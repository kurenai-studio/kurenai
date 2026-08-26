import { existsSync, readFileSync } from "node:fs";
import {
  cp,
  mkdir,
  readFile,
  readdir,
} from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import {
  PreviewController,
  type PreviewConfig,
  type PreviewState,
} from "../preview/controller.js";

export type ProjectTemplateId = "base-ai" | "base-ai-3d";
const DSH_WORKSPACE_METADATA = new Set([".evolve", ".dsh-home"]);

export interface ProjectControlConfig extends PreviewConfig {
  controlPort?: number;
  controlHost?: string;
  templateRoot?: string;
  template3dRoot?: string;
  runCommand?: (
    command: string,
    args: string[],
    cwd: string,
  ) => Promise<void>;
}

export interface CocosProject {
  name: string;
  projectPath: string;
  creatorVersion: string;
  dimension: "2d" | "3d";
}

interface SelectionContext {
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
    this.runCommand = config.runCommand ?? runCommand;
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
      throw new Error("This DSH workspace is already a Cocos Creator project");
    }
    const entries = await readdir(target);
    const projectEntries = entries.filter(
      (entry) => !DSH_WORKSPACE_METADATA.has(entry),
    );
    if (projectEntries.length) {
      throw new Error(
        `Cocos initialization requires an empty DSH workspace directory; found: ${projectEntries.join(
          ", ",
        )}`,
      );
    }
    const configuredRoot =
      template === "base-ai-3d"
        ? this.config.template3dRoot
        : this.config.templateRoot;
    const templateRoot = configuredRoot ? resolve(configuredRoot) : undefined;
    if (templateRoot) {
      await copyDirectoryContents(templateRoot, target);
    } else {
      const configuredHeadlessRoot =
        this.config.headlessRoot ??
          process.env.KURENAI_HEADLESS_ROOT ??
          process.env.HEADLESS_STACK;
      if (!configuredHeadlessRoot) {
        throw new Error(
          "KURENAI_HEADLESS_ROOT must point to the supplied headless-cocos repository",
        );
      }
      const headlessRoot = resolve(configuredHeadlessRoot);
      const creator = join(headlessRoot, "spike", "create-project.mjs");
      if (!existsSync(creator)) {
        throw new Error(
          "KURENAI_HEADLESS_ROOT must point to the supplied headless-cocos repository",
        );
      }
      await this.runCommand(
        process.execPath,
        [
          creator,
          "--template",
          template,
          "--out",
          target,
          ...(entries.length ? ["--force"] : []),
        ],
        headlessRoot,
      );
    }
    const project = await this.inspect(target);
    if (!project) {
      throw new Error("The initialized template is not a Cocos Creator project");
    }
    return project;
  }

  async state(
    sessionId: string,
    projectPath: string,
  ): Promise<{
    sessionId: string;
    projectPath: string;
    project?: CocosProject;
    preview?: PreviewState;
  }> {
    const absolutePath = resolve(projectPath);
    const project = await this.inspect(absolutePath);
    const preview = this.previews.get(normalizePath(absolutePath))?.snapshot();
    return {
      sessionId,
      projectPath: absolutePath,
      ...(project ? { project } : {}),
      ...(preview ? { preview } : {}),
    };
  }

  async startPreview(projectPath: string): Promise<PreviewState> {
    const project = await this.inspect(projectPath);
    if (!project) throw new Error("The DSH workspace is not a Cocos Creator project");
    const preview = await this.previewFor(project.projectPath);
    return preview.start({ project: project.projectPath });
  }

  async stopPreview(projectPath: string): Promise<PreviewState> {
    return (await this.previewFor(resolve(projectPath))).stop();
  }

  async publish(
    projectPath: string,
    options: {
      platform?: string;
      outDir?: string;
      skipPacker?: boolean;
    } = {},
  ): Promise<Record<string, unknown>> {
    const absolutePath = resolve(projectPath);
    const project = await this.inspect(absolutePath);
    if (!project) throw new Error("The DSH workspace is not a Cocos Creator project");
    const headlessRoot = requireDirectory(
      "headlessRoot",
      this.config.headlessRoot ??
        process.env.KURENAI_HEADLESS_ROOT ??
        process.env.HEADLESS_STACK,
    );
    const platform = options.platform ?? "web";
    const outDir = options.outDir ?? join(absolutePath, "dist", platform);
    const cli = join(headlessRoot, "spike", "publish", "cli.mjs");
    if (!existsSync(cli)) {
      throw new Error(`Publish CLI missing: ${cli}`);
    }
    const args = [
      cli,
      `--project=${absolutePath}`,
      `--platform=${platform}`,
      `--out=${outDir}`,
    ];
    if (options.skipPacker) args.push("--skip-packer");
    const { stdout, stderr, code } = await runCommandCapture(
      process.execPath,
      args,
      headlessRoot,
    );
    const combined = `${stdout}\n${stderr}`.trim();
    let parsed: Record<string, unknown> | undefined;
    const jsonMatch = combined.match(/\{[\s\S]*"ok"\s*:\s*(true|false)[\s\S]*\}\s*$/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      } catch {
        parsed = undefined;
      }
    }
    if (code !== 0) {
      return {
        ok: false,
        platform,
        outDir,
        exitCode: code,
        error:
          (typeof parsed?.error === "string" && parsed.error) ||
          combined.slice(-4000) ||
          "publish failed",
        logTail: combined.slice(-2000),
      };
    }
    return {
      ok: true,
      platform,
      outDir,
      ...(parsed ?? {}),
      logTail: combined.slice(-1500),
    };
  }

  setSelection(
    sessionId: string,
    selection: SelectionContext | undefined,
  ): void {
    if (selection) this.selections.set(sessionId, selection);
    else this.selections.delete(sessionId);
  }

  contextText(sessionId: string, projectPath: string): string {
    const absolutePath = resolve(projectPath);
    const key = normalizePath(absolutePath);
    const project = this.projects.get(key) ?? inspectProjectSync(absolutePath);
    if (project) this.projects.set(key, project);
    const preview = this.previews.get(key)?.snapshot();
    const selection = this.selections.get(sessionId);
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
        "[Kurenai headless authoring skill]",
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
        const sessionId = requireText(url.searchParams.get("sessionId"), "sessionId");
        const projectPath = requireText(
          url.searchParams.get("projectPath"),
          "projectPath",
        );
        json(response, 200, await this.state(sessionId, projectPath));
        return;
      }
      if (request.method === "POST") {
        const body = await readJson(request);
        const sessionId = requireText(body.sessionId, "sessionId");
        const projectPath = requireText(body.projectPath, "projectPath");
        if (url.pathname === "/api/context/selection") {
          this.setSelection(sessionId, selectionOf(body.selection));
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
            state: await this.state(sessionId, projectPath),
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
              platform:
                typeof body.platform === "string" ? body.platform : "web",
              ...(typeof body.outDir === "string"
                ? { outDir: body.outDir }
                : {}),
              skipPacker: body.skipPacker === true,
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
    await cp(join(source, entry.name), join(target, entry.name), {
      recursive: entry.isDirectory(),
      errorOnExist: true,
      force: false,
    });
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
  try {
    const guide = readFileSync(
      join(projectPath, "AGENT_AUTHORING.md"),
      "utf8",
    ).trim();
    return guide ? guide.slice(0, 48_000) : undefined;
  } catch {
    return undefined;
  }
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
  throw new Error(`No free Headless Cocos port pair near ${start}`);
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

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe",
      windowsHide: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} failed (${String(code)}): ${stderr.trim()}`));
    });
  });
}

async function runCommandCapture(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
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

function requireDirectory(label: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`${label} is required`);
  const absolute = resolve(value);
  if (!existsSync(absolute)) throw new Error(`${label} does not exist: ${absolute}`);
  return absolute;
}
