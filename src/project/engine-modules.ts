import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

/**
 * Preview always runs the full engine, but a build only ships the modules listed in
 * settings/v2/packages/engine.json. Code that uses a dropped module works in preview and
 * breaks after publish, so scan scripts for the classes each optional module provides.
 */
const MODULE_USAGE: Record<string, RegExp> = {
  "physics-ammo":
    /\b(RigidBody|BoxCollider|SphereCollider|CapsuleCollider|CylinderCollider|ConeCollider|MeshCollider|PlaneCollider|TerrainCollider|SimplexCollider|CharacterController|BoxCharacterController|CapsuleCharacterController|PhysicsSystem|HingeConstraint|FixedConstraint|PointToPointConstraint|ConfigurableConstraint)\b/,
  "physics-2d-box2d": /\b(RigidBody2D|PhysicsSystem2D|\w+Collider2D|\w+Joint2D)\b/,
  "spine-3.8": /\bsp\.(Skeleton|SkeletonData)\b/,
  "dragon-bones": /\bdragonBones\b/,
  terrain: /\bTerrain\b/,
  "tiled-map": /\bTiledMap\w*\b/,
  video: /\bVideoPlayer\b/,
  webview: /\bWebView\b/,
  "particle-2d": /\bParticleSystem2D\b/,
  "light-probe": /\bLightProbe\w*\b/,
};

export interface MissingEngineModule {
  module: string;
  file: string;
  match: string;
}

async function scripts(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await scripts(path)));
    else if (/\.(ts|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** Same lookup as cocos-cli's resolveIncludeModulesFromEngineConfig. */
function modulesOf(engine: any): string[] | undefined {
  if (Array.isArray(engine?.includeModules) && engine.includeModules.length) return engine.includeModules;
  const key = engine?.globalConfigKey || Object.keys(engine?.configs ?? {})[0];
  const list = key ? engine.configs?.[key]?.includeModules : undefined;
  return Array.isArray(list) && list.length ? list : undefined;
}

// cocos-cli builds from settings/cocos.config.json; it is created from the legacy
// settings/v2/packages/engine.json on first import when missing.
const ENGINE_CONFIG_FILES = [
  { file: "settings/cocos.config.json", engine: (json: any) => json?.engine },
  { file: "settings/v2/packages/engine.json", engine: (json: any) => json?.modules },
];

async function includedModules(projectPath: string): Promise<{ file: string; modules: Set<string> } | undefined> {
  for (const { file, engine } of ENGINE_CONFIG_FILES) {
    try {
      const modules = modulesOf(engine(JSON.parse(await readFile(join(projectPath, file), "utf8"))));
      if (modules) return { file, modules: new Set(modules) };
    } catch {
      // try the next config file
    }
  }
  return undefined;
}

export async function findMissingEngineModules(
  projectPath: string,
): Promise<{ file: string; missing: MissingEngineModule[] }> {
  const config = await includedModules(projectPath);
  if (!config) return { file: "", missing: [] };
  const included = config.modules;
  const checks = Object.entries(MODULE_USAGE).filter(([module]) => !included.has(module));
  if (!checks.length) return { file: config.file, missing: [] };
  const missing: MissingEngineModule[] = [];
  for (const file of await scripts(join(projectPath, "assets"))) {
    const source = await readFile(file, "utf8");
    for (const [module, pattern] of checks) {
      const match = pattern.exec(source);
      if (match && !missing.some((m) => m.module === module)) {
        missing.push({ module, file: relative(projectPath, file), match: match[0] });
      }
    }
  }
  return { file: config.file, missing };
}
