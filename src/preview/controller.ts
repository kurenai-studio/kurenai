import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { PreviewBridge } from "./bridge.js";

export interface PreviewConfig {
  project?: string;
  headlessRoot?: string;
  previewEntry?: string;
  port?: number;
  bridgePort?: number;
  inspectorScriptPath?: string;
  packer?: "mini" | "creator";
  autoStart?: boolean;
  readinessTimeoutMs?: number;
}

export type PreviewPhase = "idle" | "starting" | "ready" | "failed" | "stopped";

export interface PreviewState {
  phase: PreviewPhase;
  url: string;
  project?: string;
  pid?: number;
  startedAt?: string;
  lastError?: string;
  recentLogs: string[];
}

export interface PreviewControllerOptions {
  spawnProcess?: typeof spawn;
  fetchImpl?: typeof fetch;
  killProcessTree?: (child: ChildProcessWithoutNullStreams) => Promise<void>;
}

const DEFAULT_PORT = 7460;
const MAX_LOG_LINES = 80;

export class PreviewController {
  private child: ChildProcessWithoutNullStreams | undefined;
  private bridge: PreviewBridge | undefined;
  private upstreamUrl: string;
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
    const headlessRoot = requireDirectory(
      "headlessRoot",
      merged.headlessRoot ??
        process.env.KURENAI_HEADLESS_ROOT ??
        process.env.HEADLESS_STACK,
    );
    const entry = resolve(
      headlessRoot,
      merged.previewEntry ?? "spike/preview-mirror.mjs",
    );
    if (!existsSync(entry)) {
      throw new Error(`Headless Cocos preview entry does not exist: ${entry}`);
    }

    const port = merged.port ?? DEFAULT_PORT;
    const bridgePort = merged.bridgePort ?? port + 1;
    this.upstreamUrl = `http://127.0.0.1:${port}/`;
    this.state = {
      phase: "starting",
      url: `http://127.0.0.1:${bridgePort}/`,
      project,
      startedAt: new Date().toISOString(),
      recentLogs: [],
    };

    const child = this.spawnProcess(process.execPath, [entry], {
      cwd: headlessRoot,
      env: {
        ...process.env,
        PROJECT: project,
        PORT: String(port),
        PACKER: merged.packer ?? "mini",
      },
      stdio: "pipe",
      windowsHide: true,
    });
    this.child = child;
    if (child.pid !== undefined) this.state.pid = child.pid;

    child.stdout.on("data", (chunk: Buffer | string) => this.recordLog(String(chunk)));
    child.stderr.on("data", (chunk: Buffer | string) => this.recordLog(String(chunk)));
    child.once("exit", (code, signal) => {
      if (this.child !== child) return;
      this.child = undefined;
      if (this.state.phase !== "stopped") {
        this.state.phase = code === 0 ? "stopped" : "failed";
        this.state.lastError = `preview exited (code=${String(code)}, signal=${String(signal)})`;
      }
    });

    try {
      await this.waitUntilReady(merged.readinessTimeoutMs ?? 30_000);
      const bridgeConfig = {
        upstreamUrl: this.upstreamUrl,
        port: bridgePort,
        ...(merged.inspectorScriptPath
          ? { inspectorScriptPath: merged.inspectorScriptPath }
          : {}),
      };
      this.bridge = new PreviewBridge(bridgeConfig);
      this.state.url = await this.bridge.start();
      this.state.phase = "ready";
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

  private recordLog(chunk: string): void {
    const next = chunk
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter(Boolean);
    this.state.recentLogs.push(...next);
    if (this.state.recentLogs.length > MAX_LOG_LINES) {
      this.state.recentLogs.splice(0, this.state.recentLogs.length - MAX_LOG_LINES);
    }
  }

  private async waitUntilReady(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastError = "preview did not answer";
    while (Date.now() < deadline) {
      if (!this.child) throw new Error(this.state.lastError ?? "preview exited before ready");
      try {
        const response = await this.fetchImpl(
          new URL("/__hmr/status", this.upstreamUrl),
          {
          signal: AbortSignal.timeout(1_500),
          },
        );
        if (response.ok) return;
        lastError = `HTTP ${response.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((done) => setTimeout(done, 250));
    }
    throw new Error(`Headless Cocos preview was not ready after ${timeoutMs}ms: ${lastError}`);
  }
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
      }, 2_000),
    ),
  ]);
}

function requireDirectory(label: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`${label} is required`);
  const path = resolve(value);
  if (!existsSync(path)) throw new Error(`${label} does not exist: ${path}`);
  return path;
}
