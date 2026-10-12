import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listImportTargets, readAssetInfo } from "../src/meta/asset-info.js";

function project(): string {
  const root = mkdtempSync(join(tmpdir(), "kurenai-asset-info-"));
  mkdirSync(join(root, "assets", "images"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  return root;
}

describe("readAssetInfo", () => {
  it("reads uuid and nested sub-assets from .meta", async () => {
    const root = project();
    const png = join(root, "assets", "images", "hero.png");
    writeFileSync(png, "");
    writeFileSync(
      `${png}.meta`,
      JSON.stringify({
        ver: "1.0.27",
        importer: "image",
        imported: true,
        uuid: "e9e2424a-dca1-41cc-984f-a95da8e5a977",
        subMetas: {
          "6c48a": { importer: "texture", uuid: "e9e2424a-dca1-41cc-984f-a95da8e5a977@6c48a", name: "texture" },
          f9941: { importer: "sprite-frame", uuid: "e9e2424a-dca1-41cc-984f-a95da8e5a977@f9941", name: "spriteFrame" },
        },
      }),
    );
    const info = await readAssetInfo(root, png);
    expect(info).toMatchObject({
      path: "assets/images/hero.png",
      url: "db://assets/images/hero.png",
      uuid: "e9e2424a-dca1-41cc-984f-a95da8e5a977",
      importer: "image",
      imported: true,
    });
    expect(info.subAssets.map((s) => s.name)).toEqual(["texture", "spriteFrame"]);
  });

  it("tells the caller to run kurenai import when there is no .meta", async () => {
    const root = project();
    const png = join(root, "assets", "images", "new.png");
    writeFileSync(png, "");
    await expect(readAssetInfo(root, png)).rejects.toThrow(/kurenai import/);
  });

  it("rejects paths outside assets/", async () => {
    const root = project();
    await expect(readAssetInfo(root, join(root, "package.json"))).rejects.toThrow(/inside/);
  });
});

describe("listImportTargets", () => {
  it("expands directories and skips .meta and dotfiles", () => {
    const root = project();
    const dir = join(root, "assets", "images");
    writeFileSync(join(dir, "a.png"), "");
    writeFileSync(join(dir, "a.png.meta"), "{}");
    writeFileSync(join(dir, ".DS_Store"), "");
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "sub", "b.png"), "");
    expect(listImportTargets(dir).map((f) => f.slice(dir.length + 1))).toEqual(["a.png", join("sub", "b.png")]);
  });
});
