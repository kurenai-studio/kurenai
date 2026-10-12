import { describe, expect, it } from "vitest";
import { checkPackageSize } from "../src/size.js";
import { MiB, tempDir, writeBytes, writeFile } from "./helpers.js";

function build(subpackages: unknown[] = []): string {
  const dir = tempDir();
  writeFile(dir, "game.json", JSON.stringify({ deviceOrientation: "portrait", subpackages }));
  writeFile(dir, "project.config.json", JSON.stringify({ appid: "touristappid" }));
  return dir;
}

describe("checkPackageSize", () => {
  it("attributes files under subpackage roots to the subpackage and the rest to main", () => {
    const dir = build([{ name: "levels", root: "subpackages/levels/" }]);
    writeBytes(dir, "game.js", 1000);
    writeBytes(dir, "cocos-js/cc.js", 2 * MiB);
    writeBytes(dir, "subpackages/levels/game.js", 300);
    writeBytes(dir, "subpackages/levels/import/a.json", 5 * MiB);

    const report = checkPackageSize(dir);

    expect(report.ok).toBe(true);
    expect(report.main.files).toBe(3);
    expect(report.main.largest[0]).toEqual({ path: "cocos-js/cc.js", bytes: 2 * MiB });
    expect(report.subpackages).toEqual([
      { name: "levels", root: "subpackages/levels/", independent: false, bytes: 5 * MiB + 300, files: 2 },
    ]);
    expect(report.totalBytes).toBe(report.main.bytes + 5 * MiB + 300);
  });

  it("flags a main package over 4 MB but not a large normal subpackage", () => {
    const dir = build([{ name: "big", root: "subpackages/big" }]);
    writeBytes(dir, "cocos-js/cc.js", 4 * MiB + 1);
    writeBytes(dir, "subpackages/big/a.bin", 10 * MiB);

    const report = checkPackageSize(dir);

    expect(report.ok).toBe(false);
    expect(report.violations).toEqual([expect.stringMatching(/^main package 4\.00 MB exceeds 4\.00 MB$/)]);
  });

  it("limits independent subpackages to 4 MB and the total to 20 MB unless virtual payment is on", () => {
    const dir = build([
      { name: "solo", root: "subpackages/solo/", independent: true },
      { name: "rest", root: "subpackages/rest/" },
    ]);
    writeBytes(dir, "subpackages/solo/a.bin", 5 * MiB);
    writeBytes(dir, "subpackages/rest/a.bin", 20 * MiB);

    expect(checkPackageSize(dir).violations).toEqual([
      expect.stringContaining("independent subpackage solo"),
      expect.stringContaining("exceeds 20.00 MB"),
    ]);
    expect(checkPackageSize(dir, { virtualPayment: true }).violations).toEqual([
      expect.stringContaining("independent subpackage solo"),
    ]);
  });

  it("rejects a directory that is not a wechatgame build", () => {
    expect(() => checkPackageSize(tempDir())).toThrow(/no game\.json/);
  });
});
