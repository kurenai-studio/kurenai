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
  it("rejects missing paths before spawning", async () => {
    const controller = new PreviewController({});
    await expect(controller.start()).rejects.toThrow("headlessRoot is required");
  });

  it("starts, becomes ready and stops a preview process", async () => {
    const root = await mkdtemp(join(tmpdir(), "kurenai-"));
    cleanups.push(root);
    const project = join(root, "project");
    const headlessRoot = join(root, "headless");
    const inspectorScriptPath = join(root, "inspector.js");
    await mkdir(project);
    await mkdir(join(headlessRoot, "spike"), { recursive: true });
    await writeFile(join(headlessRoot, "spike", "preview-mirror.mjs"), "");
    await writeFile(inspectorScriptPath, "");

    const child = fakeChild();
    const controller = new PreviewController(
      {
        project,
        headlessRoot,
        port: 7788,
        bridgePort: 17789,
        inspectorScriptPath,
      },
      {
        spawnProcess: (() => child) as unknown as typeof spawn,
        fetchImpl: async () => new Response("ok", { status: 200 }),
        killProcessTree: async (process) => {
          process.kill();
        },
      },
    );

    const ready = await controller.start();
    expect(ready.phase).toBe("ready");
    expect(ready.url).toBe("http://127.0.0.1:17789/");
    expect(ready.pid).toBe(4242);

    const stopped = await controller.stop();
    expect(stopped.phase).toBe("stopped");
  });
});

function fakeChild(): ChildProcessWithoutNullStreams {
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
  return emitter as unknown as ChildProcessWithoutNullStreams;
}
