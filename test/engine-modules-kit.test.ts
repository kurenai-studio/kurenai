import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyEngineCuts,
  applyMinimalEngineModules,
  findMissingEngineModules,
  proposeEngineCuts,
} from "../src/project/engine-modules.js";
import { addKit } from "../src/project/kit.js";

async function project(modules: string[], scripts: Record<string, string>, scene?: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "kurenai-test-"));
  await mkdir(join(dir, "settings"), { recursive: true });
  await writeFile(
    join(dir, "settings", "cocos.config.json"),
    JSON.stringify({
      engine: { globalConfigKey: "defaultConfig", configs: { defaultConfig: { includeModules: modules } } },
    }),
  );
  await mkdir(join(dir, "assets", "game"), { recursive: true });
  for (const [file, source] of Object.entries(scripts)) {
    await writeFile(join(dir, "assets", "game", file), source);
  }
  if (scene) await writeFile(join(dir, "assets", "main.scene"), scene);
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

describe("proposeEngineCuts minimal set", () => {
  const FAT = [
    "base",
    "gfx-webgl",
    "animation",
    "skeletal-animation",
    "3d",
    "2d",
    "rich-text",
    "mask",
    "graphics",
    "ui-skew",
    "affine-transform",
    "ui",
    "particle",
    "physics-ammo",
    "physics-2d-box2d",
    "intersection-2d",
    "primitive",
    "profiler",
    "particle-2d",
    "audio",
    "video",
    "webview",
    "tween",
    "websocket",
    "terrain",
    "light-probe",
    "tiled-map",
    "spine-3.8",
    "dragon-bones",
    "marionette",
    "custom-pipeline",
  ];

  it("keeps only what a 2D Graphics+Label game needs", async () => {
    const dir = await project(
      FAT,
      {
        "MainView.ts":
          "import { _decorator, Color, Component, Graphics, Label, Node, UITransform } from 'cc';\n" +
          "const g = Graphics; const l = Label;",
      },
      JSON.stringify([
        { __type__: "cc.SceneGlobals", ambient: { __type__: "cc.AmbientInfo" } },
        { __type__: "cc.LightProbeInfo" },
        { __type__: "cc.Canvas" },
        { __type__: "cc.UITransform" },
      ]),
    );

    const { minimal, cuts } = await proposeEngineCuts(dir, {
      artifacts: [{ path: "cocos-js/bullet.release.asm.js", bytes: 900_000 }],
    });

    expect(minimal).toEqual(
      expect.arrayContaining(["base", "gfx-webgl", "2d", "ui", "graphics", "custom-pipeline"]),
    );
    expect(minimal).not.toContain("physics-ammo");
    expect(minimal).not.toContain("spine-3.8");
    expect(minimal).not.toContain("3d");
    expect(minimal).not.toContain("video");
    expect(cuts.map((c) => c.module)).toEqual(expect.arrayContaining(["physics-ammo", "spine-3.8"]));
    expect(cuts.find((c) => c.module === "physics-ammo")?.reason).toBe("artifact");
    expect(cuts.find((c) => c.module === "physics-ammo")?.bytes).toBe(900_000);
  });

  it("keeps 3d physics when RigidBody is used", async () => {
    const dir = await project(["base", "gfx-webgl", "3d", "physics-ammo", "physics-cannon", "2d", "ui"], {
      "P.ts": "import { RigidBody } from 'cc';",
    });
    const { minimal } = await proposeEngineCuts(dir);
    expect(minimal).toContain("physics-ammo");
    expect(minimal).not.toContain("physics-cannon");
    expect(minimal).toContain("3d");
  });

  it("ignores default scene LightProbeInfo for module detection", async () => {
    const dir = await project(["base", "gfx-webgl", "2d", "ui", "3d", "light-probe", "custom-pipeline"], {
      "A.ts": "import { Label } from 'cc';",
    }, JSON.stringify([{ __type__: "cc.LightProbeInfo" }, { __type__: "cc.Label" }]));
    const { minimal } = await proposeEngineCuts(dir);
    expect(minimal).not.toContain("light-probe");
    expect(minimal).not.toContain("3d");
    expect(minimal).toContain("2d");
  });

  it("applyMinimalEngineModules writes the minimal list", async () => {
    const dir = await project(FAT, {
      "MainView.ts": "import { Graphics, Label, UITransform } from 'cc';",
    });
    const applied = await applyMinimalEngineModules(dir);
    expect(applied.removed).toEqual(expect.arrayContaining(["physics-ammo", "spine-3.8", "3d"]));
    expect(applied.included).toEqual(applied.minimal);
    const json = JSON.parse(await readFile(join(dir, "settings/cocos.config.json"), "utf8"));
    expect(json.engine.configs.defaultConfig.includeModules).toEqual(applied.minimal);
  });

  it("applyEngineCuts still removes explicit modules", async () => {
    const dir = await project(["base", "2d", "physics-ammo", "spine-3.8"], {});
    const applied = await applyEngineCuts(dir, ["physics-ammo", "spine-3.8"]);
    expect(applied.removed).toEqual(["physics-ammo", "spine-3.8"]);
    expect(applied.included).toEqual(["base", "2d"]);
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
