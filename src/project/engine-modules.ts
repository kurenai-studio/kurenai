import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const PHYSICS_3D =
  /\b(RigidBody|BoxCollider|SphereCollider|CapsuleCollider|CylinderCollider|ConeCollider|MeshCollider|PlaneCollider|TerrainCollider|SimplexCollider|CharacterController|BoxCharacterController|CapsuleCharacterController|PhysicsSystem|HingeConstraint|FixedConstraint|PointToPointConstraint|ConfigurableConstraint)\b/;
const PHYSICS_2D = /\b(RigidBody2D|PhysicsSystem2D|\w+Collider2D|\w+Joint2D)\b/;
const SPINE = /\bsp\.(Skeleton|SkeletonData)\b|\bcc\.sp\b|"cc\.sp\./;

/**
 * Canonical ids for findMissingEngineModules (one per feature family).
 * Preview always has the full engine; publish only ships includeModules.
 */
const MODULE_USAGE: Record<string, RegExp> = {
  "physics-ammo": PHYSICS_3D,
  "physics-2d-box2d": PHYSICS_2D,
  "spine-3.8": SPINE,
  "dragon-bones": /\bdragonBones\b|"cc\.dragonBones/,
  terrain: /\bTerrain\b|"cc\.Terrain/,
  "tiled-map": /\bTiledMap\w*\b|"cc\.TiledMap/,
  video: /\bVideoPlayer\b|"cc\.VideoPlayer/,
  webview: /\bWebView\b|"cc\.WebView/,
  "particle-2d": /\bParticleSystem2D\b|"cc\.ParticleSystem2D/,
  "light-probe": /\bLightProbe\w*\b|"cc\.LightProbe/,
};

/** Detectable modules for minimal-set compression (scripts + scene/prefab text). */
const DETECT_USAGE: Record<string, RegExp> = {
  ...MODULE_USAGE,
  "physics-cannon": PHYSICS_3D,
  "physics-physx": PHYSICS_3D,
  "physics-2d-box2d-wasm": PHYSICS_2D,
  "spine-4.2": SPINE,
  "2d":
    /\b(UITransform|Sprite|Label|Canvas|Widget|Layout|Button|ScrollView|EditBox|ProgressBar|Toggle|PageView|Slider|SafeArea|BlockInputEvents|PageViewIndicator)\b|"cc\.(UITransform|Sprite|Label|Canvas|Widget|Layout|Button)/,
  ui: /\b(Canvas|Widget|Layout|Button|ScrollView|EditBox|ProgressBar|Toggle|PageView|Slider|SafeArea)\b|"cc\.(Canvas|Widget|Layout|Button)/,
  graphics: /\bGraphics\b|"cc\.Graphics/,
  "rich-text": /\bRichText\b|"cc\.RichText/,
  mask: /\bMask\b|"cc\.Mask/,
  "ui-skew": /\bUISkew\b|"cc\.UISkew/,
  "affine-transform": /\baffineTransform\b|\bAffineTransform\b/,
  "intersection-2d": /\bIntersection2D\b|intersection2D/,
  "3d":
    /\b(MeshRenderer|SkinnedMeshRenderer|DirectionalLight|SpotLight|SphereLight|ModelRenderer|MeshCollider|Terrain|Skybox)\b|"cc\.(MeshRenderer|SkinnedMeshRenderer|DirectionalLight|SpotLight|SphereLight)/,
  particle: /\bParticleSystem\b(?!2D)|"cc\.ParticleSystem"/,
  primitive: /\bPrimitive\b|"cc\.Primitive/,
  animation: /\b(Animation|AnimationClip|AnimationState)\b|"cc\.Animation"/,
  "skeletal-animation": /\b(SkeletalAnimation|SkinnedMeshRenderer)\b|"cc\.SkeletalAnimation/,
  marionette: /\b(animation\.|AnimationGraph|Marionette)\b/,
  audio: /\b(AudioSource|AudioClip)\b|"cc\.AudioSource/,
  tween: /\btween\s*\(|\bTween\b/,
  websocket: /\bWebSocket\b/,
  "particle-2d": /\bParticleSystem2D\b|"cc\.ParticleSystem2D/,
  terrain: /\bTerrain\b|"cc\.Terrain/,
  "tiled-map": /\bTiledMap\w*\b|"cc\.TiledMap/,
  video: /\bVideoPlayer\b|"cc\.VideoPlayer/,
  webview: /\bWebView\b|"cc\.WebView/,
  "dragon-bones": /\bdragonBones\b|"cc\.dragonBones/,
  profiler: /\bProfiler\b|"cc\.Profiler/,
  "light-probe": /\bLightProbeGroup\b|"cc\.LightProbeGroup/,
};

/** Feature → dependencies (includeModules ids). Options inherit their group's deps. */
const FEATURE_DEPS: Record<string, string[]> = {
  "skeletal-animation": ["animation"],
  "3d": ["meshopt"],
  "sorting-2d": ["2d"],
  "rich-text": ["2d"],
  mask: ["2d", "graphics"],
  graphics: ["2d"],
  "ui-skew": ["2d"],
  ui: ["2d"],
  particle: ["3d"],
  "physics-ammo": ["3d"],
  "physics-cannon": ["3d"],
  "physics-physx": ["3d"],
  "physics-builtin": ["3d"],
  "physics-2d-box2d": ["2d"],
  "physics-2d-box2d-wasm": ["2d"],
  "physics-2d-builtin": ["2d"],
  "intersection-2d": ["2d"],
  primitive: ["3d"],
  "occlusion-query": ["3d"],
  "geometry-renderer": ["3d"],
  "debug-renderer": ["3d"],
  "particle-2d": ["2d"],
  terrain: ["3d"],
  "light-probe": ["3d"],
  "tiled-map": ["2d"],
  "spine-3.8": ["2d"],
  "spine-4.2": ["2d"],
  "dragon-bones": ["2d"],
  marionette: ["animation"],
  "procedural-animation": ["animation"],
};

const OPTION_GROUPS: string[][] = [
  ["physics-ammo", "physics-cannon", "physics-physx", "physics-builtin"],
  ["physics-2d-box2d", "physics-2d-box2d-wasm", "physics-2d-builtin", "physics-2d-box2d-jsb"],
  ["spine-3.8", "spine-4.2"],
  ["custom-pipeline", "legacy-pipeline"],
];

/** Always required for HTML5 / WeChat mini-game builds. */
const ALWAYS = ["base", "gfx-webgl"] as const;

/** Scene/prefab __type__ values that every default scene carries — ignore for detection. */
const SCENE_NOISE =
  /^cc\.(Scene|SceneAsset|SceneGlobals|Node|Prefab|PrefabInfo|Color|Vec[234]|Quat|Rect|Size|Mat[34]|AmbientInfo|FogInfo|LightProbeInfo|OctreeInfo|ShadowsInfo|SkyboxInfo|SkinInfo|PostSettingsInfo|Camera)$/;

export interface MissingEngineModule {
  module: string;
  file: string;
  match: string;
}

export type EngineCutHint = {
  evidence?: string;
  bytes?: number;
};

export type EngineCutProposal = {
  module: string;
  reason: "unused" | "artifact" | "minimal";
  evidence?: string;
  bytes?: number;
};

export type ProposeEngineCutsResult = {
  file: string;
  included: string[];
  /** Minimal includeModules that still cover detected usage (+ deps + always). */
  minimal: string[];
  cuts: EngineCutProposal[];
  keep: string[];
  blocked: Array<{ module: string; file: string; match: string; evidence?: string }>;
  /** Modules pulled in because scripts/scenes referenced them. */
  detected: Array<{ module: string; evidence: string }>;
};

export type ApplyEngineCutsResult = {
  file: string;
  removed: string[];
  included: string[];
};

async function listFiles(dir: string, re: RegExp): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(path, re)));
    else if (re.test(entry.name)) out.push(path);
  }
  return out;
}

function modulesOf(engine: any): string[] | undefined {
  if (Array.isArray(engine?.includeModules) && engine.includeModules.length) return engine.includeModules;
  const key = engine?.globalConfigKey || Object.keys(engine?.configs ?? {})[0];
  const list = key ? engine.configs?.[key]?.includeModules : undefined;
  return Array.isArray(list) && list.length ? list : undefined;
}

function setModulesOf(engine: any, modules: string[]): void {
  if (Array.isArray(engine?.includeModules)) {
    engine.includeModules = modules;
    return;
  }
  const key = engine?.globalConfigKey || Object.keys(engine?.configs ?? {})[0] || "defaultConfig";
  engine.globalConfigKey ??= key;
  engine.configs ??= {};
  engine.configs[key] ??= {};
  engine.configs[key].includeModules = modules;
}

function familySatisfied(module: string, included: Set<string>): boolean {
  const family = OPTION_GROUPS.find((group) => group.includes(module));
  if (!family) return included.has(module);
  return family.some((id) => included.has(id));
}

function pickOption(group: string[], included: string[], detectedNeed: boolean): string | undefined {
  if (!detectedNeed) return undefined;
  return group.find((id) => included.includes(id)) ?? group[0];
}

const ENGINE_CONFIG_FILES = [
  {
    file: "settings/cocos.config.json",
    engine: (json: any) => json?.engine,
    ensure: (json: any) => {
      json.engine ??= {};
      return json.engine;
    },
  },
  {
    file: "settings/v2/packages/engine.json",
    engine: (json: any) => json?.modules,
    ensure: (json: any) => {
      json.modules ??= {};
      return json.modules;
    },
  },
];

type LoadedConfig = {
  file: string;
  absolute: string;
  root: any;
  engine: any;
  modules: string[];
};

async function loadEngineConfig(projectPath: string): Promise<LoadedConfig | undefined> {
  for (const { file, engine } of ENGINE_CONFIG_FILES) {
    try {
      const absolute = join(projectPath, file);
      const root = JSON.parse(await readFile(absolute, "utf8"));
      const eng = engine(root);
      const modules = modulesOf(eng);
      if (modules) return { file, absolute, root, engine: eng, modules: [...modules] };
    } catch {
      // try next
    }
  }
  return undefined;
}

async function collectProjectText(projectPath: string): Promise<Array<{ file: string; text: string }>> {
  const assets = join(projectPath, "assets");
  const files = await listFiles(assets, /\.(ts|js|scene|prefab)$/);
  const out: Array<{ file: string; text: string }> = [];
  for (const file of files) {
    out.push({ file: relative(projectPath, file), text: await readFile(file, "utf8") });
  }
  return out;
}

/** Strip scene-globals noise so default LightProbeInfo / SkyboxInfo do not force 3d modules. */
function scrubSceneNoise(text: string, file: string): string {
  if (!/\.(scene|prefab)$/.test(file)) return text;
  return text.replace(/"__type__"\s*:\s*"([^"]+)"/g, (full, type: string) =>
    SCENE_NOISE.test(type) ? `"__type__":"cc.Node"` : full,
  );
}

function detectModules(corpus: Array<{ file: string; text: string }>): Map<string, string> {
  const hit = new Map<string, string>();
  for (const { file, text } of corpus) {
    const body = scrubSceneNoise(text, file);
    for (const [module, pattern] of Object.entries(DETECT_USAGE)) {
      if (hit.has(module)) continue;
      const match = pattern.exec(body);
      if (match) hit.set(module, `${file}:${match[0]}`);
    }
  }
  return hit;
}

function closeDependencies(seed: Iterable<string>): Set<string> {
  const out = new Set<string>();
  const stack = [...seed];
  while (stack.length) {
    const module = stack.pop()!;
    if (out.has(module)) continue;
    out.add(module);
    for (const dep of FEATURE_DEPS[module] ?? []) {
      if (!out.has(dep)) stack.push(dep);
    }
  }
  return out;
}

/**
 * Build the smallest includeModules list that covers detected usage.
 * Never invents modules the project did not already have, except ALWAYS + deps of kept modules.
 * Pipeline (custom/legacy) is preserved when already included — required for Creator 4 render.
 */
export function computeMinimalModules(
  included: string[],
  detected: Map<string, string>,
): { minimal: string[]; detectedList: Array<{ module: string; evidence: string }> } {
  const includedSet = new Set(included);
  const wanted = new Set<string>(ALWAYS);
  const detectedList: Array<{ module: string; evidence: string }> = [];

  for (const [module, evidence] of detected) {
    detectedList.push({ module, evidence });
    // Option-group members: remember need via group, resolve below.
    const group = OPTION_GROUPS.find((g) => g.includes(module));
    if (group) {
      const pick = pickOption(group, included, true);
      if (pick) wanted.add(pick);
      continue;
    }
    // Only keep feature modules we know how to detect; ignore noise keys.
    if (module in DETECT_USAGE || module in FEATURE_DEPS || (ALWAYS as readonly string[]).includes(module)) {
      wanted.add(module);
    }
  }

  // Physics / spine families: if any API hit mapped to a sibling, pickOption already ran via DETECT keys.
  for (const group of OPTION_GROUPS) {
    if (group[0] === "custom-pipeline" || group[0] === "legacy-pipeline") continue;
    const need = group.some((id) => detected.has(id));
    const pick = pickOption(group, included, need);
    if (pick) wanted.add(pick);
  }

  // Keep the project's render pipeline selection (Creator 4).
  for (const pipe of ["custom-pipeline", "legacy-pipeline"]) {
    if (includedSet.has(pipe)) wanted.add(pipe);
  }

  // If UI/2d detected, ensure both; if neither 2d nor 3d detected, default to 2d+ui (typical mini-game).
  if (wanted.has("ui") || wanted.has("graphics") || wanted.has("rich-text") || wanted.has("mask")) {
    wanted.add("2d");
    wanted.add("ui");
  }
  if (![...wanted].some((m) => m === "2d" || m === "3d")) {
    wanted.add("2d");
    wanted.add("ui");
  }

  const closed = closeDependencies(wanted);
  // Restrict to modules that are either ALWAYS, dependencies of kept modules, or were already included
  // (do not enable brand-new heavy options the project never had).
  const minimalSet = new Set<string>();
  for (const module of closed) {
    if ((ALWAYS as readonly string[]).includes(module) || includedSet.has(module) || FEATURE_DEPS[module]) {
      // deps like meshopt may be hidden and absent from includeModules — skip if never listed
      if ((ALWAYS as readonly string[]).includes(module) || includedSet.has(module)) {
        minimalSet.add(module);
      } else if ([...closed].some((m) => (FEATURE_DEPS[m] ?? []).includes(module) && includedSet.has(m))) {
        // e.g. 3d pulled meshopt but meshopt often omitted from the list — skip omission-safe
        if (includedSet.has(module)) minimalSet.add(module);
      }
    }
  }
  // Re-add deps only when they appear in the original include list OR are ALWAYS.
  for (const module of closeDependencies(minimalSet)) {
    if ((ALWAYS as readonly string[]).includes(module) || includedSet.has(module)) {
      minimalSet.add(module);
    }
  }

  // Preserve original order for survivors; append any ALWAYS missing at front.
  const minimal = [
    ...ALWAYS.filter((m) => minimalSet.has(m) && !included.includes(m)),
    ...included.filter((m) => minimalSet.has(m)),
  ];
  // Dedupe while preserving order
  const seen = new Set<string>();
  const ordered = minimal.filter((m) => (seen.has(m) ? false : (seen.add(m), true)));

  return { minimal: ordered, detectedList };
}

async function includedModules(projectPath: string): Promise<{ file: string; modules: Set<string> } | undefined> {
  const config = await loadEngineConfig(projectPath);
  if (!config) return undefined;
  return { file: config.file, modules: new Set(config.modules) };
}

export async function findMissingEngineModules(
  projectPath: string,
): Promise<{ file: string; missing: MissingEngineModule[] }> {
  const config = await includedModules(projectPath);
  if (!config) return { file: "", missing: [] };
  const included = config.modules;
  const checks = Object.keys(MODULE_USAGE).filter((module) => !familySatisfied(module, included));
  const corpus = await collectProjectText(projectPath);
  const missing: MissingEngineModule[] = [];
  for (const { file, text } of corpus) {
    if (!/\.(ts|js)$/.test(file)) continue;
    for (const module of checks) {
      if (missing.some((m) => m.module === module)) continue;
      const pattern = MODULE_USAGE[module];
      if (!pattern) continue;
      const match = pattern.exec(text);
      if (match) missing.push({ module, file, match: match[0] });
    }
  }
  return { file: config.file, missing };
}

export function modulesFromArtifacts(
  artifacts: Array<{ path: string; bytes?: number }>,
): Map<string, EngineCutHint> {
  const patterns: Array<{ pattern: RegExp; modules: string[] }> = [
    { pattern: /bullet/i, modules: ["physics-ammo"] },
    { pattern: /cannon/i, modules: ["physics-cannon"] },
    { pattern: /physx/i, modules: ["physics-physx"] },
    { pattern: /box2d/i, modules: ["physics-2d-box2d", "physics-2d-box2d-wasm"] },
    { pattern: /spine/i, modules: ["spine-3.8", "spine-4.2"] },
    { pattern: /dragonbones|dragon-bones|dragonBones/i, modules: ["dragon-bones"] },
  ];
  const out = new Map<string, EngineCutHint>();
  for (const artifact of artifacts) {
    for (const { pattern, modules } of patterns) {
      if (!pattern.test(artifact.path)) continue;
      for (const module of modules) {
        const prev = out.get(module);
        const bytes = artifact.bytes;
        if (!prev || (bytes ?? 0) > (prev.bytes ?? 0)) {
          const hint: EngineCutHint = { evidence: artifact.path };
          if (bytes !== undefined) hint.bytes = bytes;
          out.set(module, hint);
        }
      }
    }
  }
  return out;
}

/**
 * Propose a minimal includeModules list from project usage (scripts + scenes/prefabs).
 * Optional build artifacts only annotate cut reasons / ordering — they do not keep modules.
 */
export async function proposeEngineCuts(
  projectPath: string,
  options: { artifacts?: Array<{ path: string; bytes?: number }> } = {},
): Promise<ProposeEngineCutsResult> {
  const config = await loadEngineConfig(projectPath);
  if (!config) {
    return { file: "", included: [], minimal: [], cuts: [], keep: [], blocked: [], detected: [] };
  }

  const corpus = await collectProjectText(projectPath);
  const detected = detectModules(corpus);
  const { minimal, detectedList } = computeMinimalModules(config.modules, detected);
  const minimalSet = new Set(minimal);
  const fromArtifacts = modulesFromArtifacts(options.artifacts ?? []);

  const cuts: EngineCutProposal[] = [];
  for (const module of config.modules) {
    if (minimalSet.has(module)) continue;
    const art = fromArtifacts.get(module);
    const cut: EngineCutProposal = {
      module,
      reason: art ? "artifact" : "minimal",
    };
    if (art?.evidence !== undefined) cut.evidence = art.evidence;
    if (art?.bytes !== undefined) cut.bytes = art.bytes;
    cuts.push(cut);
  }
  cuts.sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0) || a.module.localeCompare(b.module));

  return {
    file: config.file,
    included: config.modules,
    minimal,
    cuts,
    keep: minimal,
    blocked: [],
    detected: detectedList,
  };
}

/** Write an exact includeModules list into every engine settings file that has one. */
export async function applyEngineModules(
  projectPath: string,
  modules: string[],
): Promise<ApplyEngineCutsResult> {
  if (!modules.length) throw new Error("includeModules list must not be empty");
  const next = [...modules];
  let primary: LoadedConfig | undefined;
  const written: string[] = [];
  for (const entry of ENGINE_CONFIG_FILES) {
    try {
      const absolute = join(projectPath, entry.file);
      const root = JSON.parse(await readFile(absolute, "utf8"));
      const eng = entry.ensure(root);
      const previous = modulesOf(eng);
      if (!previous) continue;
      if (!primary) {
        primary = { file: entry.file, absolute, root, engine: eng, modules: [...previous] };
      }
      setModulesOf(eng, next);
      await writeFile(absolute, `${JSON.stringify(root, null, 2)}\n`);
      written.push(entry.file);
    } catch {
      // file missing — skip
    }
  }
  if (!primary || !written.length) {
    throw new Error(
      `No engine includeModules found under ${projectPath} (expected settings/cocos.config.json or settings/v2/packages/engine.json)`,
    );
  }
  return {
    file: written.join(", "),
    removed: primary.modules.filter((m) => !next.includes(m)),
    included: next,
  };
}

/** Compute minimal set and write it. */
export async function applyMinimalEngineModules(projectPath: string): Promise<ApplyEngineCutsResult & { minimal: string[] }> {
  const proposal = await proposeEngineCuts(projectPath);
  if (!proposal.file) {
    throw new Error(
      `No engine includeModules found under ${projectPath} (expected settings/cocos.config.json or settings/v2/packages/engine.json)`,
    );
  }
  const applied = await applyEngineModules(projectPath, proposal.minimal);
  return { ...applied, minimal: proposal.minimal };
}

/** Remove the given modules from includeModules. Idempotent. */
export async function applyEngineCuts(
  projectPath: string,
  modules: string[],
): Promise<ApplyEngineCutsResult> {
  if (!modules.length) throw new Error("Pass at least one engine module to remove (or use applyMinimalEngineModules)");
  const config = await loadEngineConfig(projectPath);
  if (!config) {
    throw new Error(
      `No engine includeModules found under ${projectPath} (expected settings/cocos.config.json or settings/v2/packages/engine.json)`,
    );
  }
  const remove = new Set(modules);
  const unknown = modules.filter((module) => !config.modules.includes(module));
  if (unknown.length) throw new Error(`Not in includeModules: ${unknown.join(", ")}`);
  const next = config.modules.filter((module) => !remove.has(module));
  return applyEngineModules(projectPath, next);
}
