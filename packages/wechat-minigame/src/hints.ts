import type { PackageSizeReport } from "./size.js";

/**
 * Attribution from a WeChat build size report. kurenai consumes `engine-module` hints
 * via proposeEngineCuts({ artifacts }); this package applies `asset-folder` hints via
 * configureSubpackages.
 */
export type SizeHint =
  | {
      kind: "engine-module";
      /** Engine includeModules id when known; otherwise empty and evidence is the artifact path. */
      module: string;
      evidence: string;
      bytes: number;
    }
  | {
      kind: "asset-folder";
      /** Path relative to the build dir, e.g. assets/levels/ */
      folder: string;
      bytes: number;
    };

/** Artifact path fragments → Cocos includeModules ids (same mapping kurenai uses). */
const ARTIFACT_MODULES: Array<{ pattern: RegExp; modules: string[] }> = [
  { pattern: /bullet/i, modules: ["physics-ammo"] },
  { pattern: /cannon/i, modules: ["physics-cannon"] },
  { pattern: /physx/i, modules: ["physics-physx"] },
  { pattern: /box2d/i, modules: ["physics-2d-box2d", "physics-2d-box2d-wasm"] },
  { pattern: /spine/i, modules: ["spine-3.8", "spine-4.2"] },
  { pattern: /dragonbones|dragon-bones|dragonBones/i, modules: ["dragon-bones"] },
];

/**
 * Turn a size report into actionable hints: engine artifacts in the main package, and
 * top-level `assets/<folder>/` trees that can move into WeChat subpackages.
 */
export function sizeHints(report: PackageSizeReport): SizeHint[] {
  const hints: SizeHint[] = [];
  const seenModules = new Set<string>();

  for (const file of report.main.largest) {
    for (const { pattern, modules } of ARTIFACT_MODULES) {
      if (!pattern.test(file.path)) continue;
      for (const module of modules) {
        if (seenModules.has(module)) continue;
        seenModules.add(module);
        hints.push({ kind: "engine-module", module, evidence: file.path, bytes: file.bytes });
      }
    }
  }

  const folderBytes = new Map<string, number>();
  for (const file of report.main.largest) {
    const match = /^assets\/([^/]+)\//.exec(file.path);
    if (!match) continue;
    const folder = `assets/${match[1]}`;
    folderBytes.set(folder, (folderBytes.get(folder) ?? 0) + file.bytes);
  }
  for (const [folder, bytes] of [...folderBytes.entries()].sort((a, b) => b[1] - a[1])) {
    hints.push({ kind: "asset-folder", folder, bytes });
  }

  return hints;
}
