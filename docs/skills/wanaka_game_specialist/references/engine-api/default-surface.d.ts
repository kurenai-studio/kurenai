// Import from "wanaka-studio-engine/default-surface".

import type { LifetimeScope } from "wanaka-studio-engine";
import { type Mesh } from "three/webgpu";

export type WanakaDefaultSurfaceMaps = {
    readonly baseColor: string;
    readonly normal: string;
    readonly roughness: string;
    readonly metalness?: string;
};

export type SurfaceMaterialLook = {
    readonly tileSizeUnits: number;
    readonly maps: WanakaDefaultSurfaceMaps;
};

/**
 * Dresses project geometry with one already chosen surface look. Loads that
 * look's maps, tiles them to the mesh's real extent, and installs the material.
 * Game source passes the look it wrote down; this does not consult a slot list.
 *
 * The mesh receives an owned geometry clone with UVs scaled to the real world
 * extent. Textures use repeat wrapping while keeping their repeat vector at
 * (1, 1), so a shared decoded texture cannot be changed by another material
 * or mesh.
 * One U/V multiplier pair is chosen from the mesh's thin axis. Use this for
 * slabs or individual wall faces; it does not map all six faces of a whole
 * box at a uniform physical scale. Already tiled or unwrapped authored UVs
 * are still multiplied, not replaced with a new per-face mapping.
 * Textures, geometry, and the material are owned by `scope`.
 */
export function applySurfaceMaterial(scope: LifetimeScope, mesh: Mesh, look: SurfaceMaterialLook): Promise<void>;
