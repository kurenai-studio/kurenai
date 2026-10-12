import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { preview, resolveCredentials, upload, type MiniprogramCi } from "../src/ci.js";
import { MiB, tempDir, writeBytes, writeFile } from "./helpers.js";

function build(): string {
  const dir = tempDir();
  writeFile(dir, "game.json", JSON.stringify({}));
  writeFile(dir, "project.config.json", JSON.stringify({ appid: "touristappid", compileType: "game" }));
  writeBytes(dir, "game.js", 100);
  return dir;
}

function fakeCi() {
  const calls: Array<{ method: string; options: Record<string, unknown> }> = [];
  const ci: MiniprogramCi = {
    Project: class {
      constructor(options: Record<string, unknown>) {
        calls.push({ method: "Project", options });
      }
    },
    preview: async (options) => {
      calls.push({ method: "preview", options });
      return { subPackageInfo: [{ name: "__FULL__", size: 100 }] };
    },
    upload: async (options) => {
      calls.push({ method: "upload", options });
      return { subPackageInfo: [{ name: "__APP__", size: 100 }] };
    },
  };
  return { ci, calls };
}

describe("credentials", () => {
  it("prefers options, then env, and ignores the touristappid placeholder", () => {
    const dir = build();
    const key = writeFile(dir, "../upload.key", "KEY");

    expect(() => resolveCredentials(dir, { env: {} })).toThrow(/Missing WeChat appid/);
    expect(() => resolveCredentials(dir, { env: { WECHAT_MINIGAME_APPID: "wxenv" } })).toThrow(
      /Missing WeChat code upload key/,
    );
    expect(
      resolveCredentials(dir, {
        appid: "wxopt",
        env: { WECHAT_MINIGAME_APPID: "wxenv", WECHAT_MINIGAME_PRIVATE_KEY_PATH: key },
      }),
    ).toEqual({ appid: "wxopt", privateKeyPath: key });
    expect(
      resolveCredentials(dir, { env: { WECHAT_MINIGAME_APPID: "wxenv", WECHAT_MINIGAME_PRIVATE_KEY: "K" } }),
    ).toEqual({ appid: "wxenv", privateKey: "K" });
    expect(() => resolveCredentials(dir, { appid: "wx1", privateKeyPath: join(dir, "nope.key") })).toThrow(
      /upload key not found/,
    );
  });
});

describe("preview and upload", () => {
  it("previews as a mini-game, writes the appid, and returns the QR code path", async () => {
    const dir = build();
    const { ci, calls } = fakeCi();

    const result = await preview(dir, {
      ci,
      env: { WECHAT_MINIGAME_APPID: "wxabc", WECHAT_MINIGAME_PRIVATE_KEY: "K" },
      qrcodeOutput: join(dir, "..", "qr", "preview.jpg"),
      robot: 3,
    });

    expect(result).toMatchObject({ ok: true, action: "preview", appid: "wxabc", subPackageInfo: [{ name: "__FULL__" }] });
    expect(existsSync(join(dir, "..", "qr"))).toBe(true);
    expect(calls[0]).toEqual({
      method: "Project",
      options: { appid: "wxabc", type: "miniGame", projectPath: dir, privateKey: "K", ignores: ["node_modules/**/*"] },
    });
    expect(calls[1]?.options).toMatchObject({
      qrcodeFormat: "image",
      qrcodeOutputDest: result.qrcode,
      robot: 3,
      setting: { useProjectConfig: true, es6: false, minify: false },
    });
    expect(JSON.parse(readFileSync(join(dir, "project.config.json"), "utf8"))).toEqual({
      appid: "wxabc",
      compileType: "game",
    });
  });

  it("refuses to upload a build over the main package limit before touching WeChat", async () => {
    const dir = build();
    writeBytes(dir, "cocos-js/cc.js", 5 * MiB);
    const { ci, calls } = fakeCi();

    await expect(
      upload(dir, { ci, version: "1.0.0", env: { WECHAT_MINIGAME_APPID: "wx1", WECHAT_MINIGAME_PRIVATE_KEY: "K" } }),
    ).rejects.toThrow(/main package .* exceeds 4\.00 MB/);
    expect(calls).toEqual([]);
  });

  it("uploads with the given version", async () => {
    const dir = build();
    const { ci, calls } = fakeCi();

    const result = await upload(dir, {
      ci,
      version: "1.2.3",
      desc: "first",
      env: { WECHAT_MINIGAME_APPID: "wx1", WECHAT_MINIGAME_PRIVATE_KEY: "K" },
    });

    expect(result).toMatchObject({ ok: true, action: "upload", version: "1.2.3" });
    expect(calls[1]).toMatchObject({ method: "upload", options: { version: "1.2.3", desc: "first" } });
  });
});
