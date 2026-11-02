// Import from "wanaka-studio-engine/physics-debug".

import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { LineSegments, type Scene } from "three/webgpu";
import type { PhysicsWorld } from "wanaka-studio-engine/physics";

export interface PhysicsDebugOverlayOptions {
    readonly scene: Scene;
    readonly world: PhysicsWorld;
    readonly color?: number;
}

/** Line-segment AABB overlay for live PhysicsWorld bodies, hidden from authoring picking. */
export function createPhysicsDebugOverlay(scope: LifetimeScope, scheduler: PhaseScheduler, options: PhysicsDebugOverlayOptions): LineSegments;
