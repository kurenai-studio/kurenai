import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensurePacks,
  inspectPack,
  packsForPlatform,
  packsStatus,
  platformAddon,
} from "../src/cocos/packs.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "kurenai-packs-"));
  roots.push(root);
  return root;
}

describe("cocos packs", () => {
  it("maps web platforms to core plus the build pack", () => {
    expect(packsForPlatform("web-desktop")).toEqual(["core", "build"]);
    expect(packsForPlatform("web-mobile")).toEqual(["core", "build"]);
  });

  it("maps mini-game and native platforms to optional packs", () => {
    expect(packsForPlatform("wechatgame")).toEqual(["core", "build", "platform:wechat"]);
    expect(packsForPlatform("openpaas")).toEqual(["core", "build", "platform:sudv2"]);
    expect(platformAddon("openpaas")).toEqual({
      name: "@kurenai-studio/openpaas",
      specEnv: "KURENAI_OPENPAAS_PACKAGE",
    });
    expect(platformAddon("wechatgame")?.name).toBe("@kurenai-studio/wechat-minigame");
    expect(packsForPlatform("bytedance-mini-game")).toEqual([
      "core",
      "build",
      "platform:bytedance",
    ]);
    expect(packsForPlatform("android")).toEqual([
      "core",
      "build",
      "native:engine-src",
      "native:tool-cmake",
      "native:android",
    ]);
  });

  it("reports core present when dist/core/launcher.js exists", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist", "core"), { recursive: true });
    await writeFile(join(root, "dist", "core", "launcher.js"), "");
    expect(inspectPack("core", root).present).toBe(true);
    expect(inspectPack("platform:wechat", root).present).toBe(false);
    expect(packsStatus(root).layout).toBe("core-or-full");
  });

  it("reports the build pack present only when all of its probes exist", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "packages", "engine"), { recursive: true });
    await writeFile(join(root, "packages", "engine", "tsconfig.json"), "{}");
    expect(inspectPack("build", root).present).toBe(false);

    const polyfills = join(root, "node_modules", "@cocos", "build-polyfills");
    await mkdir(polyfills, { recursive: true });
    await writeFile(join(polyfills, "package.json"), "{}");
    expect(inspectPack("build", root).present).toBe(true);
  });

  it("ensurePacks succeeds for core-only stub and fails for missing platform", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist", "core"), { recursive: true });
    await writeFile(join(root, "dist", "core", "launcher.js"), "");

    await expect(ensurePacks(["core"], { cocosCliRoot: root })).resolves.toMatchObject({
      alreadyPresent: ["core"],
      installed: [],
      missing: [],
    });

    await expect(
      ensurePacks(["core", "platform:bytedance"], { cocosCliRoot: root, fetch: false }),
    ).rejects.toThrow(/Missing kurenai packs: platform:bytedance/);
  });

  it("installs an npm-backed platform pack through the addon's installPlugin", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist", "core"), { recursive: true });
    await writeFile(join(root, "dist", "core", "launcher.js"), "");

    const addon = await tempRoot();
    await writeFile(
      join(addon, "package.json"),
      JSON.stringify({ name: "@kurenai-studio/wechat-minigame", version: "0.0.0-test", type: "module", main: "index.js" }),
    );
    await writeFile(
      join(addon, "index.js"),
      `import { mkdirSync, writeFileSync } from "node:fs";
       import { join } from "node:path";
       export function installPlugin(root) {
         const dir = join(root, "packages", "platforms", "wechat");
         mkdirSync(dir, { recursive: true });
         writeFileSync(join(dir, "package.json"), "{}");
       }`,
    );
    const addonsDir = await tempRoot();
    const env = { ...process.env };
    process.env.KURENAI_ADDONS_DIR = addonsDir;
    process.env.KURENAI_WECHAT_MINIGAME_PACKAGE = addon;
    try {
      const result = await ensurePacks(["platform:wechat"], { cocosCliRoot: root });
      expect(result.installed).toEqual(["platform:wechat"]);
      expect(inspectPack("platform:wechat", root).present).toBe(true);
      expect(JSON.parse(readFileSync(join(addonsDir, ".kurenai-addons.json"), "utf8"))).toEqual({
        "@kurenai-studio/wechat-minigame": addon,
      });
    } finally {
      process.env = env;
    }
  }, 60_000);

  it("ensurePacks fetches a pack through a redirect from a close-delimited HTTP/1.0 server", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist", "core"), { recursive: true });
    await writeFile(join(root, "dist", "core", "launcher.js"), "");

    const packRoot = await tempRoot();
    const packDir = join(packRoot, "packages", "platforms", "bytedance");
    await mkdir(packDir, { recursive: true });
    await writeFile(join(packDir, "package.json"), JSON.stringify({ name: "bytedance-mini-game" }));
    // Incompressible payload so the download stream hits backpressure.
    await writeFile(join(packDir, "payload.bin"), randomBytes(6 * 1024 * 1024));

    const archive = join(packRoot, "bytedance.tgz");
    const tar = spawnSync(
      "tar",
      ["-czf", archive, "-C", packRoot, "packages/platforms/bytedance"],
      { encoding: "utf8" },
    );
    expect(tar.status).toBe(0);
    const body = readFileSync(archive);

    const requested: string[] = [];
    const server = createServer((socket) => {
      socket.once("data", (chunk) => {
        const path = String(chunk).split(" ")[1] ?? "";
        requested.push(path);
        if (path.startsWith("/packs/")) {
          socket.end(`HTTP/1.0 302 Found\r\nLocation: /cdn/${path.slice("/packs/".length)}\r\n\r\n`);
          return;
        }
        socket.write(`HTTP/1.0 200 OK\r\nContent-Length: ${body.length}\r\n\r\n`);
        socket.end(body);
      });
    });
    await new Promise<void>((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
    const { port } = server.address() as AddressInfo;

    try {
      const result = await ensurePacks(["platform:bytedance"], {
        cocosCliRoot: root,
        fetch: true,
        baseUrl: `http://127.0.0.1:${port}/packs`,
        version: "4.0.0-alpha.33",
      });
      expect(result.installed).toEqual(["platform:bytedance"]);
      expect(inspectPack("platform:bytedance", root).present).toBe(true);
      expect(requested).toEqual([
        "/packs/4.0.0-alpha.33/platform/bytedance.tgz",
        "/cdn/4.0.0-alpha.33/platform/bytedance.tgz",
      ]);
    } finally {
      server.close();
    }
  });
});
