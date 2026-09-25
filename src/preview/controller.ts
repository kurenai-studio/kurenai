import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { ensureCorePack } from "../cocos/packs.js";
import { packageFile, resolveCocosCliRoot } from "../cocos/paths.js";

import { PreviewBridge } from "./bridge.js";

export interface PreviewConfig {
  project?: string;
  cocosCliRoot?: string;
  hostEntry?: string;
  scene?: string;
  port?: number;
  bridgePort?: number;
  inspectorScriptPath?: string;
  maxOldSpaceSizeMb?: number;
  watch?: boolean;
  /** Poll assets/ instead of fs.watch; needed on Docker bind mounts. */
  watchPoll?: boolean;
  autoStart?: boolean;
  readinessTimeoutMs?: number;
}

export type PreviewPhase = "idle" | "starting" | "ready" | "failed" | "stopped";

export interface PreviewState {
  phase: PreviewPhase;
  url: string;
  project?: string;
  pid?: number;
  /** The host was already running and is not owned (or stopped) by this controller. */
  attached?: boolean;
  startedAt?: string;
  lastError?: string;
  recentLogs: string[];
}

export interface PreviewControllerOptions {
  spawnProcess?: typeof spawn;
  fetchImpl?: typeof fetch;
  killProcessTree?: (child: ChildProcessWithoutNullStreams) => Promise<void>;
}

interface HostStatus {
  ready?: unknown;
  url?: unknown;
  lastError?: unknown;
}

const DEFAULT_PORT = 7460;
const DEFAULT_READINESS_TIMEOUT_MS = 180_000;
const DEFAULT_MAX_OLD_SPACE_SIZE_MB = 8192;
const MAX_LOG_LINES = 80;
const HOST_READY_LINE = /\[kurenai-host\] ready (http\S+)/u;

export class PreviewController {
  private child: ChildProcessWithoutNullStreams | undefined;
  private bridge: PreviewBridge | undefined;
  private upstreamUrl: string;
  private hostPageUrl: string | undefined;
  private state: PreviewState;
  private readonly spawnProcess: typeof spawn;
  private readonly fetchImpl: typeof fetch;
  private readonly killProcessTree: (
    child: ChildProcessWithoutNullStreams,
  ) => Promise<void>;

  constructor(
    private readonly config: PreviewConfig,
    options: PreviewControllerOptions = {},
  ) {
    const port = config.port ?? DEFAULT_PORT;
    const bridgePort = config.bridgePort ?? port + 1;
    this.spawnProcess = options.spawnProcess ?? spawn;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.killProcessTree = options.killProcessTree ?? terminateProcessTree;
    this.state = {
      phase: "idle",
      url: `http://127.0.0.1:${bridgePort}/`,
      recentLogs: [],
    };
    this.upstreamUrl = `http://127.0.0.1:${port}/`;
    if (config.project) this.state.project = resolve(config.project);
  }

  snapshot(): PreviewState {
    return {
      ...this.state,
      recentLogs: [...this.state.recentLogs],
    };
  }

  async start(overrides: Partial<PreviewConfig> = {}): Promise<PreviewState> {
    if (this.child && (this.state.phase === "starting" || this.state.phase === "ready")) {
      return this.snapshot();
    }

    const merged = { ...this.config, ...overrides };
    const project = requireDirectory(
      "project",
      merged.project ?? process.env.KURENAI_PROJECT ?? process.cwd(),
    );
    const entry = resolve(merged.hostEntry ?? packageFile("bin/kurenai-cocos-host.mjs"));
    if (!existsSync(entry)) {
      throw new Error(`Kurenai cocos host entry does not exist: ${entry}`);
    }
    const cocosCliRoot = resolveCocosCliRoot(merged.cocosCliRoot);
    await ensureCorePack({ cocosCliRoot });

    const port = merged.port ?? DEFAULT_PORT;
    const bridgePort = merged.bridgePort ?? port + 1;
    this.upstreamUrl = `http://127.0.0.1:${port}/`;
    this.hostPageUrl = undefined;
    this.state = {
      phase: "starting",
      url: `http://127.0.0.1:${bridgePort}/`,
      project,
      startedAt: new Date().toISOString(),
      recentLogs: [],
    };

    const running = await this.findRunningHost(project);
    if (running) {
      this.adoptHostUrl(running.previewUrl);
      this.state.pid = running.pid;
      this.state.attached = true;
      try {
        await this.startBridge(merged, bridgePort);
      } catch (error) {
        this.state.phase = "failed";
        this.state.lastError = error instanceof Error ? error.message : String(error);
        throw error;
      }
      return this.snapshot();
    }

    const child = this.spawnProcess(
      process.execPath,
      [
        `--max-old-space-size=${merged.maxOldSpaceSizeMb ?? DEFAULT_MAX_OLD_SPACE_SIZE_MB}`,
        entry,
      ],
      {
        cwd: project,
        env: {
          ...process.env,
          PROJECT: project,
          PORT: String(port),
          KURENAI_COCOS_CLI_ROOT: cocosCliRoot,
          ...(merged.scene ? { LAUNCH_SCENE: merged.scene } : {}),
          ...(merged.watch === false ? { WATCH: "0" } : {}),
          ...(merged.watchPoll ? { WATCH_POLL: "1" } : {}),
        },
        stdio: "pipe",
        windowsHide: true,
      },
    );
    this.child = child;
    if (child.pid !== undefined) this.state.pid = child.pid;

    child.stdout.on("data", (chunk: Buffer | string) => this.recordLog(String(chunk)));
    child.stderr.on("data", (chunk: Buffer | string) => this.recordLog(String(chunk)));
    child.once("exit", (code, signal) => {
      if (this.child !== child) return;
      this.child = undefined;
      if (this.state.phase !== "stopped") {
        this.state.phase = code === 0 ? "stopped" : "failed";
        this.state.lastError = `cocos host exited (code=${String(code)}, signal=${String(signal)})`;
      }
    });

    try {
      await this.waitUntilReady(merged.readinessTimeoutMs ?? DEFAULT_READINESS_TIMEOUT_MS);
      await this.startBridge(merged, bridgePort);
    } catch (error) {
      this.state.phase = "failed";
      this.state.lastError = error instanceof Error ? error.message : String(error);
      await this.stop();
      this.state.phase = "failed";
      throw error;
    }
    return this.snapshot();
  }

  async stop(): Promise<PreviewState> {
    const bridge = this.bridge;
    this.bridge = undefined;
    await bridge?.stop();
    const child = this.child;
    this.state.phase = "stopped";
    this.child = undefined;
    if (!child || child.exitCode !== null) return this.snapshot();

    await this.killProcessTree(child);
    return this.snapshot();
  }

  private async startBridge(config: PreviewConfig, bridgePort: number): Promise<void> {
    this.bridge = new PreviewBridge({
      upstreamUrl: this.upstreamUrl,
      port: bridgePort,
      ...(config.inspectorScriptPath ? { inspectorScriptPath: config.inspectorScriptPath } : {}),
    });
    this.state.url = withPageOf(await this.bridge.start(), this.hostPageUrl);
    this.state.phase = "ready";
  }

  /** A ready host started elsewhere (e.g. by the kurenai CLI), advertised in temp/kurenai-host.json. */
  private async findRunningHost(
    project: string,
  ): Promise<{ pid: number; previewUrl: string } | undefined> {
    let host: { pid?: unknown; serverUrl?: unknown; previewUrl?: unknown };
    try {
      host = JSON.parse(await readFile(join(project, "temp", "kurenai-host.json"), "utf8"));
    } catch {
      return undefined;
    }
    if (typeof host.pid !== "number" || typeof host.serverUrl !== "string") return undefined;
    if (typeof host.previewUrl !== "string" || !isAlive(host.pid)) return undefined;
    try {
      const response = await this.fetchImpl(new URL("/__kurenai/status", host.serverUrl), {
        signal: AbortSignal.timeout(1_500),
      });
      const status = response.ok ? ((await response.json()) as HostStatus) : undefined;
      return status?.ready === true ? { pid: host.pid, previewUrl: host.previewUrl } : undefined;
    } catch {
      return undefined;
    }
  }

  private recordLog(chunk: string): void {
    const next = chunk
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter(Boolean);
    for (const line of next) {
      const ready = HOST_READY_LINE.exec(line);
      if (ready?.[1]) this.adoptHostUrl(ready[1]);
    }
    this.state.recentLogs.push(...next);
    if (this.state.recentLogs.length > MAX_LOG_LINES) {
      this.state.recentLogs.splice(0, this.state.recentLogs.length - MAX_LOG_LINES);
    }
  }

  // cocos-cli may move to another port when the requested one is taken.
  private adoptHostUrl(value: string): void {
    try {
      const url = new URL(value);
      this.upstreamUrl = `http://127.0.0.1:${url.port}/`;
      this.hostPageUrl = value;
    } catch {
      // Ignore malformed log lines; readiness polling still applies.
    }
  }

  private async waitUntilReady(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastError = "cocos host did not answer";
    while (Date.now() < deadline) {
      if (!this.child) {
        throw new Error(
          [this.state.lastError ?? "cocos host exited before ready", this.state.recentLogs.at(-1)]
            .filter(Boolean)
            .join(": "),
        );
      }
      try {
        const response = await this.fetchImpl(
          new URL("/__kurenai/status", this.upstreamUrl),
          { signal: AbortSignal.timeout(1_500) },
        );
        if (response.ok) {
          const status = (await response.json()) as HostStatus;
          if (status.ready === true) {
            if (typeof status.url === "string" && status.url) this.adoptHostUrl(status.url);
            return;
          }
          lastError =
            typeof status.lastError === "string" ? status.lastError : "preview settings not ready";
        } else {
          lastError = `HTTP ${response.status}`;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((done) => setTimeout(done, 500));
    }
    throw new Error(`Kurenai cocos host was not ready after ${timeoutMs}ms: ${lastError}`);
  }
}

function withPageOf(bridgeUrl: string, hostPageUrl: string | undefined): string {
  if (!hostPageUrl) return bridgeUrl;
  const page = new URL(hostPageUrl);
  return new URL(`${page.pathname}${page.search}`, bridgeUrl).toString();
}

async function terminateProcessTree(
  child: ChildProcessWithoutNullStreams,
): Promise<void> {
  if (child.exitCode !== null) return;
  if (process.platform === "win32" && child.pid !== undefined) {
    await new Promise<void>((done) => {
      const killer = spawn(
        "taskkill",
        ["/PID", String(child.pid), "/T", "/F"],
        { stdio: "ignore", windowsHide: true },
      );
      killer.once("exit", () => done());
      killer.once("error", () => {
        child.kill("SIGKILL");
        done();
      });
    });
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((done) => child.once("exit", () => done())),
    new Promise<void>((done) =>
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
        done();
      }, 6_000),
    ),
  ]);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function requireDirectory(label: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`${label} is required`);
  const path = resolve(value);
  if (!existsSync(path)) throw new Error(`${label} does not exist: ${path}`);
  return path;
}
