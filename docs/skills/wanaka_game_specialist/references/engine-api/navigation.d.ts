// Import from "wanaka-studio-engine/navigation".

import { Vector3 } from "three/webgpu";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { DiagnosticsPort } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { Box3, type Object3D, type Vector3Like } from "three/webgpu";

export interface NavigationMeshOptions {
    /** Recast cell size in meters (default 0.5). */
    readonly cellSize?: number;
    /** Minimum clear height required by an agent, in meters (default 1.8). */
    readonly agentHeight?: number;
    /** Horizontal clearance radius around an agent, in meters (default 0.3). */
    readonly agentRadius?: number;
    /** Maximum ledge height an agent may traverse, in meters (default 0.4). */
    readonly maxClimb?: number;
    /** Maximum walkable surface slope in degrees (default 45). */
    readonly maxSlopeDeg?: number;
    /** Walkable volumes rasterized as Recast floor triangles. */
    readonly walkableBoxes?: readonly Box3[];
    /** Game Three mesh hierarchies rasterized at their current world transforms. */
    readonly walkableObjects?: readonly Object3D[];
    /** Volumes rasterized as unwalkable Recast geometry. */
    readonly blockedBoxes?: readonly Box3[];
    /** Game Three mesh hierarchies rasterized as unwalkable geometry. */
    readonly blockedObjects?: readonly Object3D[];
    readonly diagnostics?: DiagnosticsPort;
}

/**
 * A Recast/Detour navigation mesh baked from explicit boxes and/or native Three
 * mesh triangles.
 * `findPath` reports whether Detour reached the projected target and returns
 * its straight-path waypoints in world space.
 */
export class NavigationMesh {
    readonly cellSize: number;
    readonly agentHeight: number;
    readonly agentRadius: number;
    readonly maxClimb: number;
    readonly maxSlopeDeg: number;
    private constructor();
    /** Loads Recast and creates a navigation mesh owned by the scope. */
    static create(scope: LifetimeScope, options: NavigationMeshOptions): Promise<NavigationMesh>;
    /** Number of Recast polygons after bake. */
    get walkableCellCount(): number;
    /** Monotonic revision of the currently published query world. */
    get revision(): number;
    /** Adds a walkable volume, rebakes, and returns its idempotent remover. */
    addWalkableBox(box: Box3): () => void;
    /** Removes a walkable volume previously added with {@link addWalkableBox}. */
    removeWalkableBox(box: Box3): void;
    /** Adds a native Three mesh hierarchy as walkable geometry and rebakes. */
    addWalkableObject(object: Object3D): () => void;
    /** Removes a native walkable mesh hierarchy previously added to this mesh. */
    removeWalkableObject(object: Object3D): void;
    /** Adds a blocked volume, rebakes, and returns its idempotent remover. */
    addBlockedBox(box: Box3): () => void;
    /** Removes a blocked volume previously added with {@link addBlockedBox}. */
    removeBlockedBox(box: Box3): void;
    /** Adds a native Three mesh hierarchy as blocked geometry and rebakes. */
    addBlockedObject(object: Object3D): () => void;
    /** Removes a native blocked mesh hierarchy previously added to this mesh. */
    removeBlockedObject(object: Object3D): void;
    /** Closest walkable Recast point, or null when the query misses the mesh. */
    closestPoint(point: Vector3Like): Vector3 | null;
    /** Queries a Detour path without collapsing partial and unreachable results. */
    findPath(from: Vector3Like, to: Vector3Like): NavigationPathResult;
}

export type NavigationPathReason = 'start-off-mesh' | 'target-off-mesh' | 'disconnected' | 'buffer-limit' | 'search-limit' | 'query-failed' | 'straight-path-failed';

/** Structured path receipt tied to one published NavMesh revision. */
export interface NavigationPathResult {
    readonly status: 'complete' | 'partial' | 'unreachable';
    readonly points: readonly Vector3[];
    readonly requestedStart: Vector3;
    readonly requestedTarget: Vector3;
    readonly projectedStart: Vector3 | null;
    readonly projectedTarget: Vector3 | null;
    readonly endpoint: Vector3 | null;
    readonly revision: number;
    readonly reason?: NavigationPathReason;
}

export interface NavigationAgentOptions {
    readonly mesh: NavigationMesh;
    /** Game Three.js object moved along Detour waypoints. */
    readonly object: Object3D;
    readonly speed?: number;
    /** Linear acceleration in world units per second squared. */
    readonly acceleration?: number;
    /** Rotate the native object's local +Z toward movement using Three radians. */
    readonly rotateObject?: boolean;
    /** Maximum yaw change in radians per second. */
    readonly turnSpeedRad?: number;
    /** Distance at which a projected destination counts as reached. */
    readonly arrivalDistance?: number;
    readonly diagnostics?: DiagnosticsPort;
}

export type NavigationAgentStatus = 'idle' | 'moving' | 'arrived' | 'partial' | 'unreachable';

export type NavigationMoveReason = NavigationPathReason | 'projection-too-far';

/** Receipt for a movement command evaluated against one NavMesh revision. */
export interface NavigationMoveResult {
    readonly status: 'started' | 'arrived' | 'partial' | 'unreachable';
    readonly revision: number;
    readonly requestedTarget: Vector3;
    readonly projectedTarget: Vector3 | null;
    readonly endpoint: Vector3 | null;
    readonly reason?: NavigationMoveReason;
}

/** Result of explicitly rebinding an existing movement intent. */
export type NavigationReplanResult = NavigationMoveResult | {
    readonly status: 'rejected';
    readonly revision: number;
    readonly reason: 'no-target';
};

/**
 * Follows `NavigationMesh.findPath` waypoints in `update`. Not a
 * NavigationAgent wrapper object.
 */
export class NavigationAgent {
    private constructor();
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: NavigationAgentOptions): NavigationAgent;
    /** Projects and starts movement to one world-space destination. */
    moveTo(point: Vector3Like, maxProjectionDistance?: number): NavigationMoveResult;
    /** Replans the retained target from the object's current position. */
    replanFromCurrentPosition(): NavigationReplanResult;
    /** Cancels movement and clears both the route and retained target. */
    stop(): void;
    /** Current movement lifecycle state. */
    get status(): NavigationAgentStatus;
    /** Last projected destination, retained after arrival for inspection. */
    get projectedDestination(): Vector3 | null;
    /** Last requested destination before NavMesh projection. */
    get requestedDestination(): Vector3 | null;
    get remainingWaypoints(): number;
    /** NavMesh revision used by the current or last terminal route attempt. */
    get routeRevision(): number | null;
}

/**
 * The single boundary where walkable/blocked Object3D hierarchies are
 * rasterized into plain triangle data. It performs no Recast work and needs
 * no loaded Recast module, so a renderer can resolve native mesh geometry
 * before a portable navigation API consumes it.
 */
export function resolveNavigationGeometry(walkableObjects: readonly Object3D[], blockedObjects: readonly Object3D[]): {
    readonly walkable: NativeTriangleMesh;
    readonly blocked: NativeTriangleMesh;
};

interface NativeTriangleMesh {
    readonly positions: readonly number[];
    readonly indices: readonly number[];
    readonly samples: readonly Vector3[];
}
