import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  findProject,
  parseArgs,
  resolveProjectDir,
} from "../src/cli/parse.js";

const cli = join(dirname(fileURLToPath(import.meta.url)), "../bin/kurenai.mjs");

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

function makeCocosProject(): { root: string; nestedFile: string } {
  const root = mkdtempSync(join(tmpdir(), "kurenai-cli-"));
  mkdirSync(join(root, "assets", "game"), { recursive: true });
  writeFileSync(join(root, "package.json"), '{"name":"fixture"}\n');
  const nestedFile = join(root, "assets", "game", "Main.ts");
  writeFileSync(nestedFile, "// fixture\n");
  return { root, nestedFile };
}

describe("CLI parseArgs", () => {
  it("parses boolean --errors and value flags --since / --project", () => {
    const { positional, options } = parseArgs([
      "logs",
      "--since",
      "42",
      "--errors",
      "--project",
      "/tmp/proj",
    ]);
    expect(positional).toEqual(["logs"]);
    expect(options.since).toBe("42");
    expect(options.errors).toBe(true);
    expect(options.project).toBe("/tmp/proj");
  });

  it("parses --verbose on publish", () => {
    const { positional, options } = parseArgs([
      "publish",
      "--platform",
      "web-mobile",
      "--verbose",
    ]);
    expect(positional).toEqual(["publish"]);
    expect(options.platform).toBe("web-mobile");
    expect(options.verbose).toBe(true);
  });

  it("parses --fetch on packs ensure", () => {
    const { positional, options } = parseArgs([
      "packs",
      "ensure",
      "platform:wechat",
      "--fetch",
    ]);
    expect(positional).toEqual(["packs", "ensure", "platform:wechat"]);
    expect(options.fetch).toBe(true);
  });
});

describe("CLI project discovery", () => {
  it("finds project root from a file path under assets/", () => {
    const { root, nestedFile } = makeCocosProject();
    expect(findProject(nestedFile)).toBe(root);
  });

  it("resolveProjectDir honors --project", () => {
    const { root } = makeCocosProject();
    expect(resolveProjectDir({ project: root })).toBe(root);
  });

  it("throws when no project exists", () => {
    const empty = mkdtempSync(join(tmpdir(), "kurenai-empty-"));
    expect(() => resolveProjectDir({}, empty)).toThrow(
      /no Cocos project found/,
    );
  });
});

describe("kurenai CLI spawn (no host)", () => {
  it("exits 2 for unknown commands", () => {
    const result = runCli("not-a-command");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("usage:");
  });

  it("reports missing project via JSON without starting a host", () => {
    const empty = mkdtempSync(join(tmpdir(), "kurenai-cli-noproj-"));
    const result = runCli("host", "status", "--project", empty);
    expect(result.status).toBe(1);
    const body = JSON.parse(result.stdout);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/no Cocos project found/);
  });
});
