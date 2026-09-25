import { existsSync, readFileSync } from "node:fs";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { ensurePacks, packsForPlatform } from "../cocos/packs.js";
import { packageFile, resolveCocosCliRoot } from "../cocos/paths.js";

import {
  PreviewController,
  type PreviewConfig,
  type PreviewState,
} from "../preview/controller.js";

export type ProjectTemplateId = "base-ai" | "base-ai-3d";
export type PublishPlatform = "web-desktop" | "web-mobile";

const PUBLISH_LOG_TAIL_LINES = 30;

function publishLogTail(combined: string, verbose?: boolean): string | undefined {
  const text = combined.trim();
  if (!text) return undefined;
  if (verbose) return text;
  const lines = text.split("\n");
  return lines.slice(-PUBLISH_LOG_TAIL_LINES).join("\n");
}
const IGNORED_WORKSPACE_ENTRIES = new Set([".git", ".DS_Store", ".cursor", ".vscode", ".idea"]);

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface ProjectControlConfig extends PreviewConfig {
  controlPort?: number;
  controlHost?: string;
  templateRoot?: string;
  template3dRoot?: string;
  runCommand?: (
    command: string,
    args: string[],
    cwd: string,
  ) => Promise<CommandResult>;
}

export interface CocosProject {
  name: string;
  projectPath: string;
  creatorVersion: string;
  dimension: "2d" | "3d";
}

export interface SelectionContext {
  id: string;
  name: string;
  path: string;
  active: boolean;
  componentTypes: string[];
}

export class ProjectControl {
  private server: Server | undefined;
  private readonly previews = new Map<string, PreviewController>();
  private readonly projects = new Map<string, CocosProject>();
  private readonly selections = new Map<string, SelectionContext>();
  private readonly runCommand: NonNullable<ProjectControlConfig["runCommand"]>;

  constructor(private readonly config: ProjectControlConfig) {
    this.runCommand = config.runCommand ?? runCommandCapture;
  }

  get url(): string {
    return `http://${this.config.controlHost ?? "127.0.0.1"}:${
      this.config.controlPort ?? 7459
    }`;
  }

  async startServer(): Promise<string> {
    if (this.server) return this.url;
    const server = createServer((request, response) => {
      void this.handle(request, response);
    });
    await new Promise<void>((resolvePromise, reject) => {
      server.once("error", reject);
      server.listen(
        this.config.controlPort ?? 7459,
        this.config.controlHost ?? "127.0.0.1",
        () => {
          server.off("error", reject);
          resolvePromise();
        },
      );
    });
    this.server = server;
    return this.url;
  }

  async stopServer(): Promise<void> {
    const server = this.server;
    this.server = undefined;
    if (server) {
      await new Promise<void>((resolvePromise) =>
        server.close(() => resolvePromise()),
      );
    }
    await Promise.all(
      [...this.previews.values()].map(async (preview) => preview.stop()),
    );
    this.previews.clear();
  }

  async inspect(projectPath: string): Promise<CocosProject | undefined> {
    const absolutePath = resolve(projectPath);
    try {
      const packageJson = JSON.parse(
        await readFile(join(absolutePath, "package.json"), "utf8"),
      ) as { name?: unknown; creator?: { version?: unknown } };
      if (typeof packageJson.creator?.version !== "string") return undefined;
      const project = {
        name:
          typeof packageJson.name === "string" && packageJson.name.trim()
            ? packageJson.name
            : basename(absolutePath),
        projectPath: absolutePath,
        creatorVersion: packageJson.creator.version,
        dimension: await detectDimension(absolutePath),
      };
      this.projects.set(normalizePath(absolutePath), project);
      return project;
    } catch (error) {
      if (isMissingFile(error)) return undefined;
      throw error;
    }
  }

  async initialize(
    projectPath: string,
    template: ProjectTemplateId,
  ): Promise<CocosProject> {
    const target = resolve(projectPath);
    await mkdir(target, { recursive: true });
    if (await this.inspect(target)) {
      throw new Error("This directory is already a Cocos Creator project");
    }
    const projectEntries = (await readdir(target)).filter(
      (entry) => !IGNORED_WORKSPACE_ENTRIES.has(entry),
    );
    if (projectEntries.length) {
      throw new Error(
        `Cocos initialization requires an empty directory; found: ${projectEntries.join(", ")}`,
      );
    }
    const configuredRoot =
      template === "base-ai-3d"
        ? this.config.template3dRoot
        : this.config.templateRoot;
    if (configuredRoot) {
      await copyDirectoryContents(resolve(configuredRoot), target);
    } else {
      await copyDirectoryContents(packageFile(join("templates", template)), target);
      // Boot entry, helpers and AGENTS.md shared by every bundled template.
      await copyDirectoryContents(packageFile(join("templates", "shared")), target);
    }
    await assignProjectIdentity(target);
    const project = await this.inspect(target);
    if (!project) {
      throw new Error("The initialized template is not a Cocos Creator project");
    }
    return project;
  }

  async state(projectPath: string): Promise<{
    projectPath: string;
    project?: CocosProject;
    preview?: PreviewState;
    selection?: SelectionContext;
  }> {
    const absolutePath = resolve(projectPath);
    const key = normalizePath(absolutePath);
    const project = await this.inspect(absolutePath);
    const preview = this.previews.get(key)?.snapshot();
    const selection = this.selections.get(key);
    return {
      projectPath: absolutePath,
      ...(project ? { project } : {}),
      ...(preview ? { preview } : {}),
      ...(selection ? { selection } : {}),
    };
  }

  async startPreview(projectPath: string): Promise<PreviewState> {
    const project = await this.inspect(projectPath);
    if (!project) throw new Error("The directory is not a Cocos Creator project");
    const preview = await this.previewFor(project.projectPath);
    return preview.start({ project: project.projectPath });
  }

  async stopPreview(projectPath: string): Promise<PreviewState> {
    return (await this.previewFor(resolve(projectPath))).stop();
  }

  async publish(
    projectPath: string,
    options: {
      platform?: PublishPlatform;
      outDir?: string;
      verbose?: boolean;
    } = {},
  ): Promise<Record<string, unknown>> {
    const absolutePath = resolve(projectPath);
    const project = await this.inspect(absolutePath);
    if (!project) throw new Error("The directory is not a Cocos Creator project");
    const cocosCliRoot = resolveCocosCliRoot(this.config.cocosCliRoot);
    const platform = options.platform ?? "web-desktop";
    await ensurePacks(packsForPlatform(platform), { cocosCliRoot });
    const cli = join(cocosCliRoot, "dist", "cli.js");
    if (!existsSync(cli)) throw new Error(`cocos-cli not found: ${cli}`);
    const args = [cli, "build", "--project", absolutePath, "--platform", platform];

    let configDir: string | undefined;
    if (options.outDir) {
      const outDir = resolve(absolutePath, options.outDir);
      configDir = await mkdtemp(join(tmpdir(), "kurenai-build-"));
      const configPath = join(configDir, "build-config.json");
      await writeFile(
        configPath,
        JSON.stringify({ buildPath: dirname(outDir), outputName: basename(outDir) }),
      );
      args.push("--build-config", configPath);
    }

    try {
      const { stdout, stderr, code } = await this.runCommand(
        process.execPath,
        args,
        absolutePath,
      );
      const combined = `${stdout}\n${stderr}`.trim();
      const dest = /Build Dest: (.+)$/mu.exec(combined)?.[1]?.trim();
      if (code !== 0 || !dest) {
        return {
          ok: false,
          platform,
          exitCode: code,
          error: combined.slice(-4000) || "cocos build failed",
        };
      }
      const outDir = dest.startsWith("project://")
        ? join(absolutePath, dest.slice("project://".length))
        : resolve(absolutePath, dest);
      const logTail = publishLogTail(combined, options.verbose);
      return {
        ok: true,
        outDir,
        platform,
        ...(logTail !== undefined ? { logTail } : {}),
      };
    } finally {
      if (configDir) await rm(configDir, { recursive: true, force: true });
    }
  }

  setSelection(
    projectPath: string,
    selection: SelectionContext | undefined,
  ): void {
    const key = normalizePath(projectPath);
    if (selection) this.selections.set(key, selection);
    else this.selections.delete(key);
  }

  getSelection(projectPath: string): SelectionContext | undefined {
    return this.selections.get(normalizePath(projectPath));
  }

  /** `preview` overrides the in-process preview, e.g. a host started by the CLI. */
  contextText(projectPath: string, preview?: Pick<PreviewState, "phase" | "url">): string {
    const absolutePath = resolve(projectPath);
    const key = normalizePath(absolutePath);
    const project = this.projects.get(key) ?? inspectProjectSync(absolutePath);
    if (project) this.projects.set(key, project);
    preview ??= this.previews.get(key)?.snapshot();
    const selection = this.selections.get(key);
    const lines = [
      "[Kurenai current Cocos context]",
      `workspace: ${absolutePath}`,
      `projectStatus: ${project ? "ready" : "uninitialized"}`,
    ];
    if (project) {
      lines.push(
        `project: ${project.name}`,
        `creatorVersion: ${project.creatorVersion}`,
        `dimension: ${project.dimension.toUpperCase()}`,
      );
    } else {
      lines.push("availableTemplates: 2D (base-ai), 3D (base-ai-3d)");
    }
    lines.push(
      `preview: ${preview?.phase ?? "not-started"}`,
      `previewUrl: ${preview?.url ?? "(none)"}`,
    );
    if (selection) {
      lines.push(
        `selectedNode: ${selection.name}`,
        `selectedPath: ${selection.path}`,
        `selectedRuntimeId: ${selection.id}`,
        `selectedComponents: ${selection.componentTypes.join(", ") || "(none)"}`,
      );
    }
    const authoringGuide = project ? readAuthoringGuide(absolutePath) : undefined;
    if (authoringGuide) {
      lines.push(
        "",
        "[Kurenai project authoring guide]",
        "These project-specific rules are mandatory for every Cocos edit in this session:",
        authoringGuide,
      );
    }
    return lines.join("\n");
  }

  private async previewFor(projectPath: string): Promise<PreviewController> {
    const key = normalizePath(projectPath);
    const existing = this.previews.get(key);
    if (existing) return existing;
    const port = await findAvailablePortPair(
      (this.config.port ?? 7460) + this.previews.size * 2,
    );
    const preview = new PreviewController({
      ...this.config,
      project: projectPath,
      port,
      bridgePort: port + 1,
    });
    this.previews.set(key, preview);
    return preview;
  }

  private async handle(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    setCors(response);
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    try {
      const url = new URL(request.url ?? "/", this.url);
      if (request.method === "GET" && url.pathname === "/api/project/default") {
        json(response, 200, { projectPath: process.cwd() });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/project") {
        const projectPath = requireText(
          url.searchParams.get("projectPath"),
          "projectPath",
        );
        json(response, 200, await this.state(projectPath));
        return;
      }
      if (request.method === "POST") {
        const body = await readJson(request);
        const projectPath = requireText(body.projectPath, "projectPath");
        if (url.pathname === "/api/context/selection") {
          this.setSelection(projectPath, selectionOf(body.selection));
          json(response, 200, { ok: true });
          return;
        }
        if (url.pathname === "/api/project/initialize") {
          const template = requireTemplate(body.template);
          const project = await this.initialize(projectPath, template);
          const preview = await this.startPreview(projectPath);
          json(response, 200, {
            ok: true,
            project,
            preview,
            state: await this.state(projectPath),
          });
          return;
        }
        if (url.pathname === "/api/preview/start") {
          json(response, 200, {
            ok: true,
            preview: await this.startPreview(projectPath),
          });
          return;
        }
        if (url.pathname === "/api/preview/stop") {
          json(response, 200, {
            ok: true,
            preview: await this.stopPreview(projectPath),
          });
          return;
        }
        if (url.pathname === "/api/publish") {
          json(response, 200, {
            ...(await this.publish(projectPath, {
              platform: requirePublishPlatform(body.platform),
              ...(typeof body.outDir === "string"
                ? { outDir: body.outDir }
                : {}),
              ...(body.verbose ? { verbose: true } : {}),
            })),
          });
          return;
        }
      }
      json(response, 404, { ok: false, error: "Not found" });
    } catch (error) {
      json(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function copyDirectoryContents(
  source: string,
  target: string,
): Promise<void> {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyDirectoryContents(from, to);
    } else {
      await cp(from, to, { errorOnExist: true, force: false });
    }
  }
}

function setCors(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("cache-control", "no-store");
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be an object");
  }
  return value as Record<string, unknown>;
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function requireTemplate(value: unknown): ProjectTemplateId {
  if (value === "base-ai" || value === "base-ai-3d") return value;
  throw new Error("template must be base-ai or base-ai-3d");
}

function requirePublishPlatform(value: unknown): PublishPlatform {
  if (value === undefined) return "web-desktop";
  if (value === "web-desktop" || value === "web-mobile") return value;
  throw new Error("platform must be web-desktop or web-mobile");
}

async function assignProjectIdentity(projectPath: string): Promise<void> {
  const packagePath = join(projectPath, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as Record<string, unknown>;
  packageJson.name = basename(projectPath);
  packageJson.uuid = randomUUID();
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 4)}\n`);
}

async function detectDimension(projectPath: string): Promise<"2d" | "3d"> {
  try {
    const engine = JSON.parse(
      await readFile(
        join(projectPath, "settings", "v2", "packages", "engine.json"),
        "utf8",
      ),
    ) as {
      modules?: {
        configs?: {
          defaultConfig?: {
            cache?: Record<string, { _value?: unknown }>;
          };
        };
      };
    };
    return engine.modules?.configs?.defaultConfig?.cache?.["3d"]?._value === true
      ? "3d"
      : "2d";
  } catch {
    return "2d";
  }
}

function inspectProjectSync(projectPath: string): CocosProject | undefined {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(projectPath, "package.json"), "utf8"),
    ) as { name?: unknown; creator?: { version?: unknown } };
    if (typeof packageJson.creator?.version !== "string") return undefined;
    return {
      name:
        typeof packageJson.name === "string" && packageJson.name.trim()
          ? packageJson.name
          : basename(projectPath),
      projectPath,
      creatorVersion: packageJson.creator.version,
      dimension: detectDimensionSync(projectPath),
    };
  } catch {
    return undefined;
  }
}

function readAuthoringGuide(projectPath: string): string | undefined {
  for (const file of ["AGENTS.md", "AGENT_AUTHORING.md"]) {
    try {
      const guide = readFileSync(join(projectPath, file), "utf8").trim();
      if (guide) return guide.slice(0, 48_000);
    } catch {
      // Try the next file name.
    }
  }
  return undefined;
}

function detectDimensionSync(projectPath: string): "2d" | "3d" {
  try {
    const engine = JSON.parse(
      readFileSync(
        join(projectPath, "settings", "v2", "packages", "engine.json"),
        "utf8",
      ),
    ) as {
      modules?: {
        configs?: {
          defaultConfig?: {
            cache?: Record<string, { _value?: unknown }>;
          };
        };
      };
    };
    return engine.modules?.configs?.defaultConfig?.cache?.["3d"]?._value === true
      ? "3d"
      : "2d";
  } catch {
    return "2d";
  }
}

function selectionOf(value: unknown): SelectionContext | undefined {
  if (value === null || value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("selection must be an object or null");
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.path !== "string" ||
    typeof candidate.active !== "boolean" ||
    !Array.isArray(candidate.componentTypes) ||
    !candidate.componentTypes.every((item) => typeof item === "string")
  ) {
    throw new Error("selection is invalid");
  }
  return {
    id: candidate.id,
    name: candidate.name,
    path: candidate.path,
    active: candidate.active,
    componentTypes: candidate.componentTypes,
  };
}

async function findAvailablePortPair(start: number): Promise<number> {
  for (let port = start; port < start + 200; port += 2) {
    if ((await portAvailable(port)) && (await portAvailable(port + 1))) {
      return port;
    }
  }
  throw new Error(`No free preview port pair near ${start}`);
}

async function portAvailable(port: number): Promise<boolean> {
  const server = createServer();
  return new Promise<boolean>((resolvePromise) => {
    server.once("error", () => resolvePromise(false));
    server.listen(port, () => {
      server.close(() => resolvePromise(true));
    });
  });
}

function normalizePath(path: string): string {
  const absolutePath = resolve(path);
  return process.platform === "win32" ? absolutePath.toLowerCase() : absolutePath;
}

function isMissingFile(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

async function runCommandCapture(
  command: string,
  args: string[],
  cwd: string,
): Promise<CommandResult> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      resolvePromise({ stdout, stderr, code: code ?? 1 });
    });
  });
}