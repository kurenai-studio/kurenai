import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installPlugin, pluginInfo } from "../src/plugin.js";
import { tempDir, writeFile } from "./helpers.js";

function cocosCli(engineVersion: string): string {
  const root = tempDir();
  writeFile(root, "packages/engine/package.json", JSON.stringify({ version: engineVersion }));
  return root;
}

describe("bundled wechat plugin", () => {
  it("ships the builder plugin with the separateEngine signature patch", () => {
    const info = pluginInfo();
    expect(info).toMatchObject({ id: "platform:wechat", platform: "wechatgame" });
    expect(existsSync(join(info.dir, "dist", "hooks.js"))).toBe(true);
    expect(existsSync(join(info.dir, "static", "cocos", "signature.json"))).toBe(true);
    expect(existsSync(join(info.dir, "node_modules"))).toBe(false);
  });

  it("installs into a cocos-cli with the matching engine version", () => {
    const root = cocosCli(pluginInfo().engineVersion);
    writeFile(root, "packages/platforms/wechat/stale.js", "");

    const result = installPlugin(root);

    expect(result).toMatchObject({ replaced: true, dir: join(root, "packages", "platforms", "wechat") });
    expect(existsSync(join(result.dir, "stale.js"))).toBe(false);
    expect(existsSync(join(result.dir, "package.json"))).toBe(true);
    const marker = JSON.parse(readFileSync(join(result.dir, ".kurenai-pack.json"), "utf8"));
    expect(marker.source).toMatch(/^@kurenai-studio\/wechat-minigame@/);
    expect(marker.dir).toBeUndefined();
  });

  it("refuses a cocos-cli with another engine version", () => {
    expect(() => installPlugin(cocosCli("4.0.0-alpha.1"))).toThrow(/is for engine/);
  });
});
