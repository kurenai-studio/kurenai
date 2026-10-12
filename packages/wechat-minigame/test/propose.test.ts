import { describe, expect, it } from "vitest";
import { checkPackageSize } from "../src/size.js";
import { proposeSubpackages } from "../src/propose-subpackages.js";
import { MiB, tempDir, writeBytes, writeFile } from "./helpers.js";

describe("sizeHints via checkPackageSize", () => {
  it("attributes bullet/spine artifacts and assets folders", () => {
    const dir = tempDir();
    writeFile(dir, "game.json", JSON.stringify({ deviceOrientation: "portrait" }));
    writeBytes(dir, "cocos-js/bullet.release.asm-x.js", 900_000);
    writeBytes(dir, "cocos-js/spine.asm-y.js", 300_000);
    writeBytes(dir, "assets/levels/a.bin", 200_000);

    const report = checkPackageSize(dir);
    expect(report.hints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "engine-module", module: "physics-ammo" }),
        expect.objectContaining({ kind: "engine-module", module: "spine-3.8" }),
        expect.objectContaining({ kind: "asset-folder", folder: "assets/levels", bytes: 200_000 }),
      ]),
    );
  });
});

describe("proposeSubpackages", () => {
  it("ranks top-level asset folders and skips tiny ones", () => {
    const root = tempDir();
    writeFile(root, "package.json", JSON.stringify({ name: "g", creator: { version: "4.0.0" } }));
    writeBytes(root, "assets/levels/big.bin", 200 * 1024);
    writeBytes(root, "assets/audio/a.wav", 100 * 1024);
    writeBytes(root, "assets/tiny/x.txt", 10);
    writeFile(
      root,
      "assets/audio.meta",
      JSON.stringify({ uuid: "u", userData: { isBundle: true, bundleName: "audio" } }),
    );

    const result = proposeSubpackages(root, { minBytes: 32 * 1024 });
    expect(result.candidates.map((c) => c.folder)).toEqual(["assets/levels", "assets/audio"]);
    expect(result.suggested).toEqual(["assets/levels"]);
    expect(result.candidates.find((c) => c.folder === "assets/audio")?.alreadyBundle).toBe(true);
  });
});

void MiB;
