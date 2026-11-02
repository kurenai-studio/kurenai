// Import from "wanaka-studio-engine/soft-body".

import type { DiagnosticsPort } from "wanaka-studio-engine";
import { type LifetimeScope } from "wanaka-studio-engine";
import { Vector3, type Mesh, type Object3D } from "three/webgpu";
import { type PhysicsWorld, type Vector3Like } from "wanaka-studio-engine/physics";

export interface SoftBodyClothCreateOptions {
    /** Cloth grid columns (default 4). */
    readonly columns?: number;
    /** Cloth grid rows (default 4). */
    readonly rows?: number;
    /** Width in meters along +X (default 2). */
    readonly width?: number;
    /** Height in meters along -Y (default 2). */
    readonly height?: number;
    /** World-space origin of the top-left vertex (default {0,2,0}). */
    readonly origin?: Vector3Like;
    /** Pin the top row so it does not fall (default true). */
    readonly pinTop?: boolean;
    /** Edge compliance passed to CreateConstraints (default 0.01). */
    readonly compliance?: number;
    /** Solver iterations per physics step (default 5). */
    readonly numIterations?: number;
    /** Internal pressure used to inflate a closed soft-body volume (default 0). */
    readonly pressure?: number;
    /** Linear velocity damping (default 0.1). */
    readonly linearDamping?: number;
    /** Surface friction coefficient (default 0.3). */
    readonly friction?: number;
    /** Surface restitution coefficient (default 0). */
    readonly restitution?: number;
    /** Gravity multiplier (default 1). */
    readonly gravityScale?: number;
    readonly diagnostics?: DiagnosticsPort;
}

export type SoftBodyClothCreateAndBindOptions = SoftBodyClothCreateOptions & ({
    /** Native mesh whose position attribute receives the cloth vertices. */
    readonly mesh: Mesh;
    readonly object?: Object3D;
} | {
    /** Presentation object that receives the cloth centroid pose. */
    readonly object: Object3D;
    readonly mesh?: Mesh;
});

/** Direct Jolt soft-body settings for an arbitrary closed native Mesh. */
export interface SoftBodyMeshOptions {
    /** Closed native mesh whose indexed triangles form the simulated volume. */
    readonly mesh: Mesh;
    /** Edge constraint compliance (default 0.0001). */
    readonly compliance?: number;
    /** Solver iterations per physics step (default 30). */
    readonly numIterations?: number;
    /** Internal pressure (default 100). */
    readonly pressure?: number;
    /** Per-vertex inverse mass (default 1). */
    readonly vertexInvMass?: number;
    /** Collision radius in world meters (default 0.02). */
    readonly vertexRadius?: number;
    readonly linearDamping?: number;
    readonly friction?: number;
    readonly restitution?: number;
    readonly gravityScale?: number;
    /** Recompute normals after writing simulated positions (default true). */
    readonly recomputeNormals?: boolean;
}

/**
 * A Jolt cloth soft body: a regular vertex grid with dihedral (or distance)
 * constraints. The top row can be pinned. Vertex poses are recorded in
 * postPhysics and the centroid is sampled onto the presentation object in
 * preRender.
 */
export class SoftBodyCloth {
    readonly vertexCount: number;
    private constructor();
    /** Creates a cloth soft body owned by the scope inside the supplied PhysicsWorld. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options?: SoftBodyClothCreateOptions): SoftBodyCloth;
    /**
     * Creates a cloth soft body and synchronizes its supplied presentation with
     * the simulation for the scope lifetime. Binding does not add the object or
     * mesh to a scene or transfer geometry/material ownership; the caller still
     * parents it and owns its presentation resources.
     */
    static createAndBind(scope: LifetimeScope, world: PhysicsWorld, options: SoftBodyClothCreateAndBindOptions): SoftBodyCloth;
    /** World-space positions of every cloth vertex after the last physics step. */
    vertexPositions(): Vector3[];
}

/**
 * A Jolt soft body built from a closed native Three Mesh. Its source geometry
 * is copied into Jolt vertices and indexed faces, and the mesh presents the
 * simulated vertices.
 */
export class SoftBodyMesh {
    readonly mesh: Mesh;
    readonly vertexCount: number;
    private constructor();
    /** Creates a mesh soft body for the supplied native Mesh. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: SoftBodyMeshOptions): SoftBodyMesh;
    vertexPositions(): Vector3[];
}
