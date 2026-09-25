import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensurePacks,
  inspectPack,
  packsForPlatform,
  packsStatus,
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
  it("maps web platforms to core only", () => {
    expect(packsForPlatform("web-desktop")).toEqual(["core"]);
    expect(packsForPlatform("web-mobile")).toEqual(["core"]);
  });

  it("maps mini-game and native platforms to optional packs", () => {
    expect(packsForPlatform("wechatgame")).toEqual(["core", "platform:wechat"]);
    expect(packsForPlatform("bytedance-mini-game")).toEqual(["core", "platform:bytedance"]);
    expect(packsForPlatform("android")).toEqual([
      "core",
      "native:engine-src",
      "native:tool-cmake",
      "native:android",
    ]);
  });

  it("reports core present when dist/cli.js exists", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist"), { recursive: true });
    await writeFile(join(root, "dist", "cli.js"), "");
    expect(inspectPack("core", root).present).toBe(true);
    expect(inspectPack("platform:wechat", root).present).toBe(false);
    expect(packsStatus(root).layout).toBe("core-or-full");
  });

  it("ensurePacks succeeds for core-only stub and fails for missing platform", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist"), { recursive: true });
    await writeFile(join(root, "dist", "cli.js"), "");

    await expect(ensurePacks(["core"], { cocosCliRoot: root })).resolves.toMatchObject({
      alreadyPresent: ["core"],
      installed: [],
      missing: [],
    });

    await expect(ensurePacks(["core", "platform:wechat"], { cocosCliRoot: root })).rejects.toThrow(
      /Missing kurenai packs: platform:wechat/,
    );
  });

  it("ensurePacks can fetch a missing platform pack from a base URL", async () => {
    const root = await tempRoot();
    await mkdir(join(root, "dist"), { recursive: true });
    await writeFile(join(root, "dist", "cli.js"), "");

    const packRoot = await tempRoot();
    const wechatDir = join(packRoot, "packages", "platforms", "wechat");
    await mkdir(wechatDir, { recursive: true });
    await writeFile(join(wechatDir, "package.json"), JSON.stringify({ name: "wechatgame" }));

    const { spawnSync } = await import("node:child_process");
    const archive = join(packRoot, "wechat.tgz");
    const tar = spawnSync(
      "tar",
      ["-czf", archive, "-C", packRoot, "packages/platforms/wechat"],
      { encoding: "utf8" },
    );
    expect(tar.status).toBe(0);

    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      expect(String(input)).toContain("/platform/wechat.tgz");
      const { readFileSync } = await import("node:fs");
      return new Response(readFileSync(archive), { status: 200 });
    }) as typeof fetch;

    try {
      const result = await ensurePacks(["platform:wechat"], {
        cocosCliRoot: root,
        fetch: true,
        baseUrl: "https://example.test/packs",
        version: "4.0.0-alpha.33",
      });
      expect(result.installed).toEqual(["platform:wechat"]);
      expect(inspectPack("platform:wechat", root).present).toBe(true);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
