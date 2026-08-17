import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectControl } from "../src/project/control.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("ProjectControl", () => {
  it("detects an existing Cocos project from the DSH cwd", async () => {
    const root = await temporaryRoot();
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "existing", creator: { version: "3.8.8" } }),
    );
    const control = new ProjectControl({});

    expect(await control.inspect(root)).toEqual({
      name: "existing",
      projectPath: root,
      creatorVersion: "3.8.8",
      dimension: "2d",
    });
  });

  it("initializes an empty DSH workspace without a registry file", async () => {
    const root = await temporaryRoot();
    const template = join(root, "template");
    const workspace = join(root, "workspace");
    await mkdir(template);
    await mkdir(workspace);
    await mkdir(join(workspace, ".evolve"));
    await writeFile(
      join(template, "package.json"),
      JSON.stringify({ name: "base", creator: { version: "3.8.8" } }),
    );
    const control = new ProjectControl({ templateRoot: template });

    const project = await control.initialize(workspace, "base-ai");

    expect(project.projectPath).toBe(workspace);
    expect(JSON.parse(await readFile(join(workspace, "package.json"), "utf8"))).toMatchObject({
      creator: { version: "3.8.8" },
    });
    await expect(readFile(join(workspace, ".kurenai", "workspace.json"))).rejects.toThrow();
  });

  it("keeps the 3D template distinct from the 2D template", async () => {
    const root = await temporaryRoot();
    const template = join(root, "template-3d");
    const workspace = join(root, "workspace-3d");
    await mkdir(join(template, "settings", "v2", "packages"), {
      recursive: true,
    });
    await mkdir(workspace);
    await writeFile(
      join(template, "package.json"),
      JSON.stringify({ name: "base-3d", creator: { version: "3.8.8" } }),
    );
    await writeFile(
      join(template, "settings", "v2", "packages", "engine.json"),
      JSON.stringify({
        modules: {
          configs: {
            defaultConfig: { cache: { "2d": { _value: false }, "3d": { _value: true } } },
          },
        },
      }),
    );
    const control = new ProjectControl({ template3dRoot: template });

    const project = await control.initialize(workspace, "base-ai-3d");

    expect(project.dimension).toBe("3d");
  });
});

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "kurenai-project-"));
  roots.push(root);
  return root;
}
