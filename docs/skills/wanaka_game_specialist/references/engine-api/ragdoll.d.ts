// Import from "wanaka-studio-engine/ragdoll".

import type { DiagnosticsPort } from "wanaka-studio-engine";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { Object3D } from "three/webgpu";
import { type SwingTwistLimits } from "wanaka-studio-engine/constraints";
import type { PhysicsWorld, QuaternionLike, RigidBody, Vector3Like } from "wanaka-studio-engine/physics";

export interface RagdollBoneOptions {
    readonly name?: string;
    readonly position: Vector3Like;
    readonly rotation?: QuaternionLike;
    readonly halfHeight: number;
    readonly radius: number;
}

export interface RagdollCreateAndBindBoneOptions extends RagdollBoneOptions {
    /** Native bone proxy driven by this ragdoll body. */
    readonly object: Object3D;
}

export interface RagdollJointOptions {
    readonly parent: number | string;
    readonly child: number | string;
    readonly anchor: Vector3Like;
    readonly twistAxis?: Vector3Like;
    readonly planeAxis?: Vector3Like;
    readonly limits?: SwingTwistLimits;
}

export interface RagdollCreateOptions {
    readonly bones: readonly RagdollBoneOptions[];
    /**
     * Explicit anatomical graph. When omitted, consecutive bones use the
     * lightweight distance-chain preset.
     */
    readonly joints?: readonly RagdollJointOptions[];
    readonly startAsleep?: boolean;
    readonly diagnostics?: DiagnosticsPort;
}

export interface RagdollCreateAndBindOptions extends Omit<RagdollCreateOptions, 'bones'> {
    readonly bones: readonly RagdollCreateAndBindBoneOptions[];
}

/** Game Jolt ragdoll whose rigid bodies may drive ordinary Object3D bones. */
export class Ragdoll {
    readonly bones: readonly RigidBody[];
    private constructor();
    static create(scope: LifetimeScope, world: PhysicsWorld, options: RagdollCreateOptions): Ragdoll;
    /**
     * Creates a ragdoll and synchronizes each supplied bone presentation with
     * the simulation for the scope lifetime. Binding does not add bone objects
     * to a scene or transfer geometry/material ownership; the caller still
     * parents the proxies and owns their presentation resources.
     */
    static createAndBind(scope: LifetimeScope, world: PhysicsWorld, options: RagdollCreateAndBindOptions): Ragdoll;
    /** Returns one rigid body by index or authored bone name. */
    bone(key: number | string): RigidBody;
    /** Wakes every dynamic body without recreating constraints. */
    wake(): void;
    /** Sleeps every dynamic body without removing constraints. */
    sleep(): void;
}
