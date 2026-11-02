// Import from "wanaka-studio-engine/locomotor".

import { Vector3, type Vector3Like } from "three/webgpu";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import type { CharacterController } from "wanaka-studio-engine/character";
import type { NavigationMesh } from "wanaka-studio-engine/navigation";
import type { PhysicsRayHit, PhysicsWorld } from "wanaka-studio-engine/physics";

export type { PositionLike };

/** Destination or tracking intent submitted to {@link Locomotor.setGoal}. */
export type LocomotorGoal = {
    readonly kind: 'goTo';
    readonly point: Vector3Like;
    readonly stopAt?: number;
} | {
    readonly kind: 'stop';
} | {
    /** Hunt: default stopAt 2, resume at stopAt + 0.6. */
    readonly kind: 'chase';
    readonly target: PositionLike;
    readonly stopAt?: number;
    readonly resumeAt?: number;
} | {
    /** Companion: default stopAt 3, resume at stopAt + 1.5. */
    readonly kind: 'follow';
    readonly target: PositionLike;
    readonly stopAt?: number;
    readonly resumeAt?: number;
} | {
    readonly kind: 'hold';
    readonly target: PositionLike;
    readonly ring: number;
    readonly band?: number;
    readonly strafe?: boolean;
};

/** Lifecycle of one Locomotor relative to its current goal. */
export type LocomotorStatus = 'idle' | 'moving' | 'arrived' | 'blocked' | 'partial' | 'unreachable';

/** CharacterController and shared world for {@link Locomotor.create}. */
export interface LocomotorCreateOptions {
    readonly world: LocomotorWorld;
    readonly character: CharacterController;
    /** Defaults to `character.radius`. Override when the nav clearance differs. */
    readonly radius?: number;
    readonly speed?: number;
}

/**
 * Scope-owned mesh handle shared by Locomotor bodies.
 * Disposing the world does not dispose the mesh.
 */
export class LocomotorWorld {
    readonly mesh: NavigationMesh;
    private constructor();
    /** Creates a world that shares `mesh` for the scope lifetime. */
    static create(scope: LifetimeScope, options: {
        readonly mesh: NavigationMesh;
    }): LocomotorWorld;
}

/**
 * Detour corridor follow that writes CharacterControlFrame into a
 * CharacterController. This capability does not write Object3D.position.
 */
export class Locomotor {
    private constructor();
    /** Attaches a Locomotor that samples on `fixedInput` and `control()`s on `fixedUpdate`. */
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: LocomotorCreateOptions): Locomotor;
    /** Current navigation intent (a frozen copy; tracking targets stay live). */
    get goal(): LocomotorGoal;
    /** Status of the current intent after the last plan or fixed step. */
    get status(): LocomotorStatus;
    /** Replaces the current intent and plans from the simulation pose. */
    setGoal(goal: LocomotorGoal): void;
    /** Rebinds the retained intent from the current simulation pose. */
    replan(): void;
    /** Horizontal drive speed in m/s. Applies to the next staged velocity. */
    get speed(): number;
    /** Replaces the horizontal drive speed. Does not replan. */
    setSpeed(speed: number): void;
}

export type CanSeeOptions = {
    readonly max: number;
    readonly castRay: PhysicsWorld['castRay'];
    /** Returns true when the closest ray hit belongs to the intended target. */
    readonly acceptHit?: (hit: PhysicsRayHit) => boolean;
};

/**
 * Line-of-sight helper: in range, and the injected ray reports no hit, or
 * its closest hit is accepted as the target. `castRay` receives the full
 * `to - from` vector, not a unit direction.
 * Cast from `character.anchors.eyes.position`, not a model's foot root.
 * Jolt `castRay` does not hit CharacterVirtual capsules — `acceptHit` is
 * only needed when the intended target is a RigidBody.
 */
export function canSee(from: Vector3Like, to: Vector3Like, options: CanSeeOptions): boolean;

/** A point source. Native Object3D inputs are read in world space. */
interface PositionLike {
    readonly position: Vector3Like;
    getWorldPosition?(target: Vector3): Vector3;
}
