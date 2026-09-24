import { EventEmitter } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import type { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { PreviewController } from "../src/preview/controller.js";

const cleanups: string[] = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("PreviewController", () => {
  it("rejects a missing project before spawning", async () => {
    const controller = new PreviewController({ project: "/definitely/missing/project" });
    await expect(controller.start()).rejects.toThrow("project does not exist");
  });

  it("spawns the cocos host, waits for status ready and stops it", async () => {
    const fixture = await createFixture();
    const child = fakeChild();
    const spawned: { args: string[]; env: NodeJS.ProcessEnv }[] = [];
    const statusCalls: string[] = [];
    let polls = 0;
    const controller = new PreviewController(
      {
        project: fixture.project,
        hostEntry: fixture.hostEntry,
        cocosCliRoot: fixture.cliRoot,
        scene: "db://assets/main.scene",
        port: 7788,
        bridgePort: 17789,
        inspectorScriptPath: fixture.inspector,
        maxOldSpaceSizeMb: 4096,
        watchPoll: true,
      },
      {
        spawnProcess: ((_command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
          spawned.push({ args, env: options.env });
          return child;
        }) as unknown as typeof spawn,
        fetchImpl: async (input) => {
          statusCalls.push(String(input));
          polls += 1;
          return Response.json({
            ready: polls > 1,
            url: "http://localhost:7788/?scene=db%3A%2F%2Fassets%2Fmain.scene",
          });
        },
        killProcessTree: async (process) => {
          process.kill();
        },
      },
    );

    const ready = await controller.start();
    expect(ready.phase).toBe("ready");
    expect(ready.url).toBe("http://127.0.0.1:17789/?scene=db%3A%2F%2Fassets%2Fmain.scene");
    expect(ready.pid).toBe(4242);
    expect(statusCalls[0]).toBe("http://127.0.0.1:7788/__kurenai/status");
    expect(spawned[0]?.args).toEqual(["--max-old-space-size=4096", fixture.hostEntry]);
    expect(spawned[0]?.env).toMatchObject({
      PROJECT: fixture.project,
      PORT: "7788",
      KURENAI_COCOS_CLI_ROOT: fixture.cliRoot,
      LAUNCH_SCENE: "db://assets/main.scene",
      WATCH_POLL: "1",
    });

    const stopped = await controller.stop();
    expect(stopped.phase).toBe("stopped");
  });

  it("attaches to a host already advertised by the CLI instead of spawning", async () => {
    const fixture = await createFixture();
    await mkdir(join(fixture.project, "temp"));
    await writeFile(
      join(fixture.project, "temp", "kurenai-host.json"),
      JSON.stringify({
        pid: process.pid,
        serverUrl: "http://localhost:7801",
        previewUrl: "http://localhost:7801/?scene=db%3A%2F%2Fassets%2Fmain.scene",
      }),
    );
    let spawned = 0;
    const statusCalls: string[] = [];
    const controller = new PreviewController(
      {
        project: fixture.project,
        hostEntry: fixture.hostEntry,
        cocosCliRoot: fixture.cliRoot,
        port: 7800,
        bridgePort: 17802,
        inspectorScriptPath: fixture.inspector,
      },
      {
        spawnProcess: (() => {
          spawned += 1;
          return fakeChild();
        }) as unknown as typeof spawn,
        fetchImpl: async (input) => {
          statusCalls.push(String(input));
          return Response.json({ ready: true });
        },
      },
    );

    const ready = await controller.start();
    expect(spawned).toBe(0);
    expect(statusCalls).toEqual(["http://localhost:7801/__kurenai/status"]);
    expect(ready).toMatchObject({ phase: "ready", attached: true, pid: process.pid });
    expect(ready.url).toBe("http://127.0.0.1:17802/?scene=db%3A%2F%2Fassets%2Fmain.scene");
    await expect(controller.stop()).resolves.toMatchObject({ phase: "stopped" });
  });

  it("follows the host when cocos-cli picks another port", async () => {
    const fixture = await createFixture();
    const child = fakeChild();
    const statusCalls: string[] = [];
    const controller = new PreviewController(
      {
        project: fixture.project,
        hostEntry: fixture.hostEntry,
        port: 7790,
        bridgePort: 17791,
        inspectorScriptPath: fixture.inspector,
      },
      {
        spawnProcess: (() => {
          queueMicrotask(() =>
            child.stdout.write("[kurenai-host] ready http://localhost:7795/\n"),
          );
          return child;
        }) as unknown as typeof spawn,
        fetchImpl: async (input) => {
          statusCalls.push(String(input));
          return String(input).includes(":7795/")
            ? Response.json({ ready: true, url: "http://localhost:7795/" })
            : new Response("", { status: 503 });
        },
        killProcessTree: async (process) => {
          process.kill();
        },
      },
    );

    const ready = await controller.start();
    expect(ready.url).toBe("http://127.0.0.1:17791/");
    expect(statusCalls.at(-1)).toBe("http://127.0.0.1:7795/__kurenai/status");
    await controller.stop();
  });

  it("reports the host exit and last log line when startup fails", async () => {
    const fixture = await createFixture();
    const child = fakeChild();
    const controller = new PreviewController(
      { project: fixture.project, hostEntry: fixture.hostEntry, port: 7792 },
      {
        spawnProcess: (() => {
          queueMicrotask(() => {
            child.stderr.write("[kurenai-host] cocos-cli not found: /nowhere\n");
            child.exitCode = 1;
            child.emit("exit", 1, null);
          });
          return child;
        }) as unknown as typeof spawn,
        fetchImpl: async () => {
          throw new Error("ECONNREFUSED");
        },
      },
    );

    await expect(controller.start()).rejects.toThrow("cocos-cli not found: /nowhere");
    expect(controller.snapshot().phase).toBe("failed");
  });
});

async function createFixture(): Promise<{
  project: string;
  hostEntry: string;
  cliRoot: string;
  inspector: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "kurenai-"));
  cleanups.push(root);
  const project = join(root, "project");
  const hostEntry = join(root, "host.mjs");
  const inspector = join(root, "inspector.js");
  await mkdir(project);
  await writeFile(hostEntry, "");
  await writeFile(inspector, "");
  return { project, hostEntry, cliRoot: join(root, "cocos-cli"), inspector };
}

type FakeChild = ChildProcessWithoutNullStreams & {
  stdout: PassThrough;
  stderr: PassThrough;
  exitCode: number | null;
};

function fakeChild(): FakeChild {
  const emitter = new EventEmitter() as EventEmitter & {
    stdout: PassThrough;
    stderr: PassThrough;
    stdin: PassThrough;
    pid: number;
    exitCode: number | null;
    signalCode: NodeJS.Signals | null;
    kill: ChildProcessWithoutNullStreams["kill"];
  };
  emitter.stdout = new PassThrough();
  emitter.stderr = new PassThrough();
  emitter.stdin = new PassThrough();
  emitter.pid = 4242;
  emitter.exitCode = null;
  emitter.signalCode = null;
  emitter.kill = (() => {
    emitter.exitCode = 0;
    queueMicrotask(() => emitter.emit("exit", 0, null));
    return true;
  }) as ChildProcessWithoutNullStreams["kill"];
  return emitter as unknown as FakeChild;
}
