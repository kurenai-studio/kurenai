// Import from "wanaka-studio-engine/navigation-debug".

import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { LineSegments, type Scene } from "three/webgpu";
import type { NavigationMesh } from "wanaka-studio-engine/navigation";

export interface NavigationDebugOverlayOptions {
    readonly scene: Scene;
    readonly mesh: NavigationMesh;
    readonly color?: number;
}

/**
 * Debug cell-center cross overlay for a baked NavigationMesh.
 * Visualizes the Recast samples used by the navigation mesh.
 */
export function createNavigationDebugOverlay(scope: LifetimeScope, scheduler: PhaseScheduler, options: NavigationDebugOverlayOptions): LineSegments;
