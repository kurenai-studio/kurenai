import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findMissingEngineModules } from "../src/project/engine-modules.js";
import { addKit } from "../src/project/kit.js";

async function project(modules: string[], scripts: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "kurenai-test-"));
  await mkdir(join(dir, "settings"), { recursive: true });
  await writeFile(
    join(dir, "settings", "cocos.config.json"),
    JSON.stringify({ engine: { globalConfigKey: "defaultConfig", configs: { defaultConfig: { includeModules: modules } } } }),
  );
  for (const [file, source] of Object.entries(scripts)) {
    await mkdir(join(dir, "assets", "game"), { recursive: true });
    await writeFile(join(dir, "assets", "game", file), source);
  }
  return dir;
}

describe("findMissingEngineModules", () => {
  it("names a dropped module the scripts use", async () => {
    const dir = await project(["base", "3d"], {
      "Player.ts": "import { RigidBody, Vec3 } from 'cc';\nexport const b = RigidBody;",
      "Map.ts": "import { TiledMap } from 'cc';",
    });
    const { file, missing } = await findMissingEngineModules(dir);
    expect(file).toBe("settings/cocos.config.json");
    expect(missing.map((m) => m.module).sort()).toEqual(["physics-ammo", "tiled-map"]);
    expect(missing.find((m) => m.module === "physics-ammo")?.file).toBe(join("assets", "game", "Player.ts"));
  });

  it("does not confuse 2D physics with 3D physics", async () => {
    const dir = await project(["base", "2d", "physics-2d-box2d"], {
      "Ball.ts": "import { RigidBody2D, CircleCollider2D } from 'cc';",
    });
    expect((await findMissingEngineModules(dir)).missing).toEqual([]);
  });

  it("passes when the module is included", async () => {
    const dir = await project(["base", "3d", "physics-ammo"], { "P.ts": "RigidBody" });
    expect((await findMissingEngineModules(dir)).missing).toEqual([]);
  });
});

describe("addKit", () => {
  it("copies web models and audio, skips native/source/previews, keeps the README", async () => {
    const kit = await mkdtemp(join(tmpdir(), "kurenai-kit-src-"));
    for (const [path, body] of Object.entries({
      "glb/Knight.glb": "glb",
      "audio/sfx_hit.wav": "wav",
      "native/Meshes/Knight.mdl": "mdl",
      "previews/Knight.png": "png",
      "source/build.py": "py",
      "cover.png": "png",
      "README.md": "# Kit",
    })) {
      await mkdir(join(kit, path, ".."), { recursive: true });
      await writeFile(join(kit, path), body);
    }
    const dir = await project(["base"], {});
    const result = await addKit(dir, kit, "demo-kit");
    expect(result.models).toEqual(["kits/demo-kit/models/Knight"]);
    expect(result.audio).toEqual(["kits/demo-kit/audio/sfx_hit"]);
    expect(result.readme).toBe("docs/kits/demo-kit.md");
    expect(await readFile(join(dir, "assets/resources/kits/demo-kit/models/Knight.glb"), "utf8")).toBe("glb");
    expect(await readFile(join(dir, "docs/kits/demo-kit.md"), "utf8")).toBe("# Kit");
  });
});
