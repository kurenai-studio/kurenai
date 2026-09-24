import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("run-puzzle scaffold", () => {
  it("ships a prefab template that parses as JSON", () => {
    const source = readFileSync(join(process.cwd(), "scripts/run-puzzle.mjs"), "utf8");
    const match = source.match(/const PUZZLE_TILE_PREFAB = `([\s\S]*?)`;/);
    expect(match?.[1]).toBeTruthy();
    const prefab = JSON.parse(match![1] as string);
    expect(prefab[0]["__type__"]).toBe("cc.Prefab");
    expect(prefab[0]._name).toBe("PuzzleTile");
  });
});
