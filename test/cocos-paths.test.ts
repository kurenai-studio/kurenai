import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveCocosCliRoot } from "../src/cocos/paths.js";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  delete process.env.KURENAI_COCOS_CLI_ROOT;
});

describe("resolveCocosCliRoot", () => {
  it("prefers KURENAI_COCOS_CLI_ROOT when set", () => {
    const root = mkdtempSync(join(tmpdir(), "kurenai-cli-root-"));
    roots.push(root);
    mkdirSync(join(root, "dist"), { recursive: true });
    writeFileSync(join(root, "dist", "cli.js"), "");
    process.env.KURENAI_COCOS_CLI_ROOT = root;
    expect(resolveCocosCliRoot()).toBe(root);
  });

  it("uses an explicit configured path over the environment", () => {
    const root = mkdtempSync(join(tmpdir(), "kurenai-cli-cfg-"));
    roots.push(root);
    process.env.KURENAI_COCOS_CLI_ROOT = "/tmp/should-not-win";
    expect(resolveCocosCliRoot(root)).toBe(root);
  });
});
