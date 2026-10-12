import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  configureSubpackages,
  removeSubpackages,
  SUBPACKAGE_BUNDLE_CONFIG,
  SUBPACKAGE_CONFIG_ID,
} from "../src/subpackage.js";
import { tempDir, writeFile } from "./helpers.js";

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

function project(creatorVersion: string): string {
  const root = tempDir();
  writeFile(root, "package.json", JSON.stringify({ name: "game", creator: { version: creatorVersion } }));
  mkdirSync(join(root, "assets", "levels"), { recursive: true });
  return root;
}

describe("configureSubpackages", () => {
  it("writes the bundle preset into settings/cocos.config.json for Creator 4", () => {
    const root = project("4.0.0");
    writeFile(root, "settings/cocos.config.json", JSON.stringify({ engine: { globalConfigKey: "defaultConfig" } }));
    writeFile(
      root,
      "assets/levels.meta",
      JSON.stringify({ ver: "1.2.0", importer: "directory", uuid: "u-1", userData: { compressionLevel: 3 } }),
    );

    const result = configureSubpackages(root, ["assets/levels"]);

    expect(result).toMatchObject({ creator: "4", bundles: [{ folder: "assets/levels", bundleName: "levels", metaCreated: false }] });
    const settings = readJson(join(root, "settings", "cocos.config.json"));
    expect(settings.engine).toEqual({ globalConfigKey: "defaultConfig" });
    expect(settings.builder.bundleConfig.custom[SUBPACKAGE_CONFIG_ID]).toEqual(SUBPACKAGE_BUNDLE_CONFIG);
    expect(readJson(join(root, "assets", "levels.meta"))).toEqual({
      ver: "1.2.0",
      importer: "directory",
      uuid: "u-1",
      userData: {
        compressionLevel: 3,
        isBundle: true,
        bundleConfigID: SUBPACKAGE_CONFIG_ID,
        bundleName: "levels",
        priority: 1,
      },
    });
  });

  it("writes settings/v2/packages/builder.json for Creator 3.8 and creates a missing folder meta", () => {
    const root = project("3.8.8");
    writeFile(root, "settings/v2/packages/builder.json", JSON.stringify({ __version__: "1.3.9", other: 1 }));

    const result = configureSubpackages(root, [join(root, "assets", "levels")], { priority: 4 });

    expect(result).toMatchObject({ creator: "3.8", bundles: [{ bundleName: "levels", metaCreated: true }] });
    const builder = readJson(join(root, "settings", "v2", "packages", "builder.json"));
    expect(builder).toMatchObject({ __version__: "1.3.9", other: 1 });
    expect(builder.bundleConfig.custom[SUBPACKAGE_CONFIG_ID]).toEqual(SUBPACKAGE_BUNDLE_CONFIG);
    const meta = readJson(join(root, "assets", "levels.meta"));
    expect(meta).toMatchObject({ importer: "directory", userData: { isBundle: true, priority: 4 } });
    expect(meta.uuid).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("stamps a new Creator 3.8 builder.json with the builder settings version", () => {
    const root = project("3.8.8");

    configureSubpackages(root, ["assets/levels"]);

    const builder = readJson(join(root, "settings", "v2", "packages", "builder.json"));
    expect(builder.__version__).toBe("1.3.9");
    expect(builder.bundleConfig.custom[SUBPACKAGE_CONFIG_ID]).toEqual(SUBPACKAGE_BUNDLE_CONFIG);
  });

  it("keeps an existing bundle name and is idempotent", () => {
    const root = project("4.0.0");
    writeFile(root, "assets/levels.meta", JSON.stringify({ uuid: "u-1", userData: { isBundle: true, bundleName: "lv", priority: 6 } }));

    configureSubpackages(root, ["assets/levels"]);
    const first = readFileSync(join(root, "assets", "levels.meta"), "utf8");
    configureSubpackages(root, ["assets/levels"]);

    expect(readFileSync(join(root, "assets", "levels.meta"), "utf8")).toBe(first);
    expect(readJson(join(root, "assets", "levels.meta")).userData).toMatchObject({ bundleName: "lv", priority: 6 });
  });

  it("rejects folders outside assets/ and unknown Creator versions", () => {
    const root = project("4.0.0");
    mkdirSync(join(root, "build"));
    expect(() => configureSubpackages(root, ["build"])).toThrow(/must be inside/);
    expect(() => configureSubpackages(root, ["assets/missing"])).toThrow(/does not exist/);
    expect(() => configureSubpackages(project("2.4.0"), ["assets/levels"])).toThrow(/Unsupported Creator version/);
  });

  it("removes only bundles it configured", () => {
    const root = project("4.0.0");
    mkdirSync(join(root, "assets", "resources"));
    writeFile(root, "assets/resources.meta", JSON.stringify({ userData: { isBundle: true, bundleConfigID: "default" } }));
    configureSubpackages(root, ["assets/levels"]);

    expect(removeSubpackages(root, ["assets/levels", "assets/resources"])).toEqual(["assets/levels.meta"]);
    expect(readJson(join(root, "assets", "levels.meta")).userData).toEqual({});
    expect(readJson(join(root, "assets", "resources.meta")).userData.isBundle).toBe(true);
  });
});
