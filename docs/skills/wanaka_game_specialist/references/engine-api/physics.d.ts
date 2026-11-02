// Import from "wanaka-studio-engine/physics".

import type { DiagnosticsPort } from "wanaka-studio-engine";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { Quaternion, Vector3, type Object3D, type QuaternionLike, type Vector3Like } from "three/webgpu";

/** Configuration vectors use Three's official structural input contracts. */
export type { QuaternionLike, Vector3Like };

export type MotionType = 'static' | 'dynamic' | 'kinematic';

export interface TriangleMeshColliderShape {
    readonly kind: 'mesh';
    /** Object vertices or tightly packed xyz triples from a worker. */
    readonly vertices: readonly Vector3Like[] | Float32Array;
    /** Counter-clockwise, single-sided triangle indices; length must be a multiple of 3. */
    readonly indices: readonly number[] | Uint32Array;
}

export interface Object3DMeshColliderShape {
    readonly kind: 'mesh';
    /** Game Three hierarchies cooked once at their current world transforms. */
    readonly objects: readonly Object3D[];
}

export type ColliderShape = {
    readonly kind: 'box';
    readonly halfExtents: Vector3Like;
} | {
    readonly kind: 'sphere';
    readonly radius: number;
} | {
    readonly kind: 'capsule';
    readonly halfHeight: number;
    readonly radius: number;
} | {
    readonly kind: 'cylinder';
    readonly halfHeight: number;
    readonly radius: number;
} | {
    readonly kind: 'heightfield';
    /** Must be 2^n + 1 (Jolt). Row-major samples of length sampleCount^2. */
    readonly sampleCount: number;
    readonly heights: Float32Array | readonly number[];
    /** One byte per sample. Non-zero samples become native no-collision values at submission. */
    readonly voidMask?: Uint8Array;
    readonly cellSize?: number;
    readonly offset?: Vector3Like;
} | {
    readonly kind: 'convex-hull';
    readonly points: readonly Vector3Like[];
} | TriangleMeshColliderShape | StaticCompoundColliderShape | Object3DMeshColliderShape;

export interface StaticCompoundColliderShape {
    readonly kind: 'static-compound';
    readonly children: readonly StaticCompoundColliderChild[];
}

export interface StaticCompoundColliderChild {
    readonly shape: ResolvedColliderLeafShape;
    readonly position: Vector3Like;
    readonly rotation?: QuaternionLike;
}

export type ResolvedColliderLeafShape = Exclude<ColliderShape, StaticCompoundColliderShape | Object3DMeshColliderShape>;

/**
 * A collider shape with any Object3D mesh-collider sugar already cooked to
 * plain triangle data. Every native Jolt shape builder, and everything a
 * created body exposes about its own shape, is typed to this -- the physics
 * API's construction path never has a reason to hold a live
 * Three scene reference.
 */
export type ResolvedColliderShape = Exclude<ColliderShape, Object3DMeshColliderShape>;

/** Closest Jolt narrow-phase ray hit. Fraction is along the given direction. */
export interface PhysicsRayHit {
    readonly body: RigidBody;
    readonly fraction: number;
    readonly point: Vector3;
    /** Outward-facing world-space surface normal at `point`. */
    readonly normal: Vector3;
}

/** Optional same-world `ignore` list for `castRay` and `overlapAabb`. */
export interface PhysicsQueryOptions {
    /**
     * Bodies skipped by the query. Pass querier-owned `RigidBody` entries so
     * closest-hit continues past them. A CharacterController volume is not a
     * RigidBody. Disposed entries are skipped; a live body from another world
     * throws.
     */
    readonly ignore?: readonly RigidBody[];
}

export interface PhysicsWorldOptions {
    readonly gravity?: Vector3Like;
    readonly maxBodies?: number;
    readonly diagnostics?: DiagnosticsPort;
}

export type RigidBodyCreateOptions = (RigidBodyCreateCommonOptions & {
    readonly shape: Object3DMeshColliderShape;
    readonly position?: never;
    readonly rotation?: never;
}) | (RigidBodyCreateCommonOptions & {
    readonly shape: Exclude<ColliderShape, Object3DMeshColliderShape>;
    readonly position?: Vector3Like;
    readonly rotation?: QuaternionLike;
});

export type RigidBodyCreateAndBindOptions = RigidBodyCreateCommonOptions & {
    readonly shape: Exclude<ColliderShape, Object3DMeshColliderShape>;
    readonly position?: Vector3Like;
    readonly rotation?: QuaternionLike;
    /**
     * Presentation object. Authority follows motion type: dynamic poses are
     * published to the object in `postPhysics`; kinematic poses are read from
     * the object in `prePhysics`; static bodies move only via `teleport`.
     */
    readonly object: Object3D;
};

/** Public handle for one scope-owned Jolt rigid body. */
export interface RigidBody {
    readonly motion: MotionType;
    readonly object: Object3D | undefined;
    readonly isSensor: boolean;
    readonly shape: ResolvedColliderShape;
    readonly position: Vector3;
    readonly rotation: Quaternion;
    readonly linearVelocity: Vector3;
    readonly angularVelocity: Vector3;
    readonly isActive: boolean;
    readonly currentContacts: readonly RigidBody[];
    setLinearVelocity(velocity: Vector3Like): void;
    setAngularVelocity(velocity: Vector3Like): void;
    setFriction(friction: number): void;
    applyImpulse(impulse: Vector3Like): void;
    applyForceAtCenter(force: Vector3Like): void;
    sleep(): void;
    wake(): void;
    teleport(position: Vector3Like, rotation?: QuaternionLike): void;
    onContactBegin(callback: (other: RigidBody) => void): () => void;
    onContactEnd(callback: (other: RigidBody) => void): () => void;
}

/** One captured rigid-body pose used by lag-compensation restore. */
export interface RigidBodyPoseSample {
    readonly position: Vector3;
    readonly rotation: Quaternion;
    readonly linearVelocity: Vector3;
}

/**
 * Bounded pose history for gameplay lag compensation. Restores via teleport;
 * the phase scheduler itself does not rewind time.
 */
export class PoseLagBuffer {
    readonly capacity: number;
    constructor(capacity: number);
    capture(body: RigidBody): void;
    sampleAtDelay(delayFrames: number): RigidBodyPoseSample | undefined;
    restore(body: RigidBody, delayFrames: number): boolean;
}

/**
 * Owns Jolt lifetime, fixed-step integration, transform authority, and
 * contact dispatch for one RuntimeSession. Created explicitly; absent from
 * projects that do not import physics.
 */
export class PhysicsWorld {
    readonly gravity: Vector3Like;
    private constructor();
    /** Loads Jolt and creates a scope-owned physics world. */
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options?: PhysicsWorldOptions): Promise<PhysicsWorld>;
    /** Creates an unbound rigid body owned by the given scope. */
    createBody(scope: LifetimeScope, options: RigidBodyCreateOptions): RigidBody;
    /**
     * Creates a rigid body and synchronizes its supplied presentation object
     * with the simulation for the scope lifetime. Binding does not add the
     * object to a scene or transfer geometry/material ownership; the caller
     * still parents it and owns its presentation resources.
     */
    createAndBindBody(scope: LifetimeScope, options: RigidBodyCreateAndBindOptions): RigidBody;
    /**
     * Queues a Jolt buoyancy impulse for the next prePhysics step, using that
     * step's deltaSeconds. Sample surface height and flow from the caller;
     * Engine does not invent wading or swim state.
     */
    applyBuoyancy(body: RigidBody, options: {
        readonly surfaceY: number;
        readonly normal?: Vector3Like;
        readonly flow?: Vector3Like;
        readonly buoyancy?: number;
        readonly linearDrag?: number;
        readonly angularDrag?: number;
    }): void;
    /**
     * Closest Jolt narrow-phase hit along `origin + direction * t`.
     * Direction is the full ray vector, not a unit length. Misses return null.
     */
    castRay(origin: Vector3Like, direction: Vector3Like, options?: PhysicsQueryOptions): PhysicsRayHit | null;
    /** Bodies whose broad-phase AABB overlaps the world-space box. */
    overlapAabb(min: Vector3Like, max: Vector3Like, options?: PhysicsQueryOptions): RigidBody[];
}

/**
 * The single boundary where Object3D mesh-collider sugar is cooked into
 * plain triangle data. It performs no Jolt work and needs no PhysicsWorld,
 * so a renderer can resolve author sugar before a portable (Worker/server)
 * physics API consumes the result.
 */
export function resolveColliderShape(shape: ColliderShape): ResolvedColliderShape;

interface RigidBodyCreateCommonOptions {
    readonly motion: MotionType;
    readonly friction?: number;
    readonly restitution?: number;
    readonly linearDamping?: number;
    readonly angularDamping?: number;
    readonly gravityFactor?: number;
    readonly isSensor?: boolean;
}
