import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type PluginMarker = { id: string; platform: string; pluginVersion: string; engineVersion: string };

/** The bundled Cocos 4 openpaas builder plugin (directory name sudv2). */
export function pluginInfo(): PluginMarker & { dir: string } {
  const dir = join(packageRoot, "plugin", "sudv2");
  const markerFile = join(dir, ".kurenai-pack.json");
  if (!existsSync(markerFile)) throw new Error(`Bundled OpenPaaS plugin missing: ${dir}`);
  return { ...(JSON.parse(readFileSync(markerFile, "utf8")) as PluginMarker), dir };
}

function packageVersion(): string {
  return (JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string }).version;
}

/**
 * Install the plugin into a cocos-cli root as packages/platforms/sudv2, where the builder
 * discovers platform plugins. Refuses a cocos-cli whose engine version differs from the plugin's.
 */
export function installPlugin(cocosCliRoot: string): { dir: string; engineVersion: string; replaced: boolean } {
  const root = resolve(cocosCliRoot);
  const { dir: pluginDir, ...plugin } = pluginInfo();
  const enginePkg = join(root, "packages", "engine", "package.json");
  if (!existsSync(enginePkg)) throw new Error(`Not a cocos-cli root (no packages/engine): ${root}`);
  const engineVersion = (JSON.parse(readFileSync(enginePkg, "utf8")) as { version: string }).version;
  if (engineVersion !== plugin.engineVersion) {
    throw new Error(
      `OpenPaaS plugin is for engine ${plugin.engineVersion}, but ${root} has engine ${engineVersion}`,
    );
  }
  const dest = join(root, "packages", "platforms", "sudv2");
  const replaced = existsSync(dest);
  rmSync(dest, { recursive: true, force: true });
  cpSync(pluginDir, dest, { recursive: true });
  const marker = {
    ...plugin,
    source: `@kurenai-studio/openpaas@${packageVersion()}`,
    installedAt: new Date().toISOString(),
  };
  writeFileSync(join(dest, ".kurenai-pack.json"), `${JSON.stringify(marker, null, 2)}\n`);
  return { dir: dest, engineVersion, replaced };
}
