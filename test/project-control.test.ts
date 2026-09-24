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
  it("detects an existing Cocos project", async () => {
    const root = await temporaryRoot();
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "existing", creator: { version: "4.0.0" } }),
    );
    const control = new ProjectControl({});

    expect(await control.inspect(root)).toEqual({
      name: "existing",
      projectPath: root,
      creatorVersion: "4.0.0",
      dimension: "2d",
    });
  });

  it("initializes from the bundled template with a fresh identity", async () => {
    const root = await temporaryRoot();
    const workspace = join(root, "my-game");
    await mkdir(join(workspace, ".git"), { recursive: true });
    const control = new ProjectControl({});

    const project = await control.initialize(workspace, "base-ai-3d");

    expect(project).toMatchObject({
      name: "my-game",
      projectPath: workspace,
      creatorVersion: "4.0.0",
      dimension: "3d",
    });
    const packageJson = JSON.parse(await readFile(join(workspace, "package.json"), "utf8"));
    const template = JSON.parse(
      await readFile(join(import.meta.dirname, "..", "templates", "base-ai-3d", "package.json"), "utf8"),
    );
    expect(packageJson.uuid).not.toBe(template.uuid);
    const scene = await readFile(join(workspace, "assets", "main.scene"), "utf8");
    const bootMeta = JSON.parse(
      await readFile(join(workspace, "assets", "kurenai", "Boot.ts.meta"), "utf8"),
    );
    expect(bootMeta.uuid).toBe("14158daa-c83c-44fb-9175-055ec7368a57");
    expect(scene).toContain('"__type__": "141582qyDxE+5F1BV7HNopX"');
    await expect(readFile(join(workspace, "assets", "game", "MainView.ts"), "utf8")).resolves.toContain(
      "class MainView",
    );
    expect(control.contextText(workspace)).toContain("A prefab must not contain script components");
    expect(control.contextText(workspace)).toContain("preview: not-started");
    const hosted = control.contextText(workspace, { phase: "ready", url: "http://127.0.0.1:7460/" });
    expect(hosted).toContain("preview: ready");
    expect(hosted).toContain("previewUrl: http://127.0.0.1:7460/");
  });

  it("injects the Boot entry into the 2D template too", async () => {
    const root = await temporaryRoot();
    const workspace = join(root, "my-2d");
    const control = new ProjectControl({});

    const project = await control.initialize(workspace, "base-ai");

    expect(project.dimension).toBe("2d");
    const scene = await readFile(join(workspace, "assets", "main.scene"), "utf8");
    expect(scene).toContain('"__type__": "141582qyDxE+5F1BV7HNopX"');
    await expect(readFile(join(workspace, "AGENTS.md"), "utf8")).resolves.toContain("MainView");
  });

  it("refuses to initialize a directory with user files", async () => {
    const root = await temporaryRoot();
    await writeFile(join(root, "notes.txt"), "keep me");
    const control = new ProjectControl({});

    await expect(control.initialize(root, "base-ai")).rejects.toThrow(
      "requires an empty directory; found: notes.txt",
    );
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
      JSON.stringify({ name: "base-3d", creator: { version: "4.0.0" } }),
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

  it("publishes through cocos build and reports the build destination", async () => {
    const root = await temporaryRoot();
    const cliRoot = join(root, "cocos-cli");
    const project = join(root, "game");
    await mkdir(join(cliRoot, "dist"), { recursive: true });
    await writeFile(join(cliRoot, "dist", "cli.js"), "");
    await mkdir(project);
    await writeFile(
      join(project, "package.json"),
      JSON.stringify({ name: "game", creator: { version: "4.0.0" } }),
    );
    const calls: { args: string[]; config?: unknown }[] = [];
    const control = new ProjectControl({
      cocosCliRoot: cliRoot,
      runCommand: async (_command, args) => {
        const configIndex = args.indexOf("--build-config");
        calls.push({
          args,
          ...(configIndex >= 0
            ? { config: JSON.parse(await readFile(args[configIndex + 1]!, "utf8")) }
            : {}),
        });
        return {
          stdout: `✓ Build completed successfully! Build Dest: ${join(root, "out", "web")}\n`,
          stderr: "",
          code: 0,
        };
      },
    });

    const result = await control.publish(project, {
      platform: "web-mobile",
      outDir: join(root, "out", "web"),
    });

    expect(result).toMatchObject({ ok: true, platform: "web-mobile", outDir: join(root, "out", "web") });
    expect(calls[0]?.args.slice(0, 6)).toEqual([
      join(cliRoot, "dist", "cli.js"),
      "build",
      "--project",
      project,
      "--platform",
      "web-mobile",
    ]);
    expect(calls[0]?.config).toEqual({ buildPath: join(root, "out"), outputName: "web" });
  });

  it("resolves project:// build destinations to the project directory", async () => {
    const root = await temporaryRoot();
    const cliRoot = join(root, "cocos-cli");
    await mkdir(join(cliRoot, "dist"), { recursive: true });
    await writeFile(join(cliRoot, "dist", "cli.js"), "");
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "game", creator: { version: "4.0.0" } }),
    );
    const control = new ProjectControl({
      cocosCliRoot: cliRoot,
      runCommand: async () => ({
        stdout: "✓ Build completed successfully! Build Dest: project://build/web-desktop\n",
        stderr: "",
        code: 0,
      }),
    });

    expect(await control.publish(root)).toMatchObject({
      ok: true,
      platform: "web-desktop",
      outDir: join(root, "build", "web-desktop"),
    });
  });

  it("truncates publish logTail by default and keeps full output with verbose", async () => {
    const root = await temporaryRoot();
    const cliRoot = join(root, "cocos-cli");
    await mkdir(join(cliRoot, "dist"), { recursive: true });
    await writeFile(join(cliRoot, "dist", "cli.js"), "");
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "game", creator: { version: "4.0.0" } }),
    );
    const filler = Array.from({ length: 50 }, (_, index) => `log line ${index}`).join("\n");
    const stdout = `${filler}\n✓ Build completed successfully! Build Dest: project://build/web-desktop\n`;
    const control = new ProjectControl({
      cocosCliRoot: cliRoot,
      runCommand: async () => ({ stdout, stderr: "", code: 0 }),
    });

    const trimmed = await control.publish(root);
    expect(trimmed.outDir).toBe(join(root, "build", "web-desktop"));
    expect(String(trimmed.logTail)).not.toContain("log line 0");
    expect(String(trimmed.logTail)).toContain("log line 49");

    const verbose = await control.publish(root, { verbose: true });
    expect(String(verbose.logTail)).toContain("log line 0");
    expect(String(verbose.logTail)).toContain("log line 49");
  });

  it("keys selection by project path", async () => {
    const root = await temporaryRoot();
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "sel", creator: { version: "4.0.0" } }),
    );
    const control = new ProjectControl({});
    control.setSelection(root, {
      id: "n1",
      name: "Button",
      path: "Canvas/Button",
      active: true,
      componentTypes: ["cc.Button"],
    });

    expect((await control.state(root)).selection?.path).toBe("Canvas/Button");
    expect(control.contextText(root)).toContain("selectedPath: Canvas/Button");
  });
});

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "kurenai-project-"));
  roots.push(root);
  return root;
}
