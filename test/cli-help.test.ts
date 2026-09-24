import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cli = join(dirname(fileURLToPath(import.meta.url)), "../bin/kurenai.mjs");

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

describe("kurenai CLI help", () => {
  it("prints usage and exits 0 for help flags", () => {
    for (const args of [["help"], ["--help"], ["-h"]] as const) {
      const result = runCli(...args);
      expect(result.status).toBe(0);
      expect(result.stderr).toContain("usage:");
      expect(result.stdout).toBe("");
    }
  });

  it("exits 2 for bare invocation and unknown commands", () => {
    expect(runCli().status).toBe(2);
    expect(runCli().stderr).toContain("usage:");

    const unknown = runCli("not-a-command");
    expect(unknown.status).toBe(2);
    expect(unknown.stderr).toContain("usage:");
  });
});
