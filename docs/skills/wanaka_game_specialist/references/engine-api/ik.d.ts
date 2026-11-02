// Import from "wanaka-studio-engine/ik".

import { Vector3, type Vector3Like } from "three/webgpu";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { Bone, type Object3D, type SkinnedMesh } from "three/webgpu";
import { CCDIKSolver, type IK } from "three/addons/animation/CCDIKSolver.js";

export type CcdIkChain = IK;

export type { PositionLike };

export interface CcdIkComponentOptions {
    /** Game SkinnedMesh and Skeleton consumed directly by Three's solver. */
    readonly mesh: SkinnedMesh;
    /** Bone indices use the mesh.skeleton.bones array, matching CCDIKSolver. */
    readonly chains: readonly CcdIkChain[];
    /** Global blend used when a chain has no blendFactor. */
    readonly blendFactor?: number;
    /** Optional native parent for Three's CCDIKHelper. */
    readonly helperParent?: Object3D;
    readonly helperSphereSize?: number;
    /** When set, the first chain's target bone follows this position each solve. */
    readonly followTarget?: PositionLike;
}

export interface LookAtCreateOptions {
    readonly mesh: SkinnedMesh;
    readonly bone: Bone | number;
    readonly target: PositionLike;
    readonly limitYaw?: number;
    readonly limitPitch?: number;
    readonly blend?: number;
}

export interface AimIkCreateOptions {
    readonly mesh: SkinnedMesh;
    readonly chain: CcdIkChain;
    readonly target: PositionLike;
    readonly blend?: number;
}

/**
 * Lifecycle and scheduler sidecar for Three's official CCDIKSolver. The
 * skeleton, chain format, solve, and optional visualization remain native.
 */
export class CcdIkComponent {
    readonly solver: CCDIKSolver;
    private constructor();
    /** Creates a solver sidecar for the supplied native SkinnedMesh. */
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: CcdIkComponentOptions): CcdIkComponent;
    setBlendFactor(blendFactor: number): void;
}

/**
 * Head / spine look: one bone yaws and pitches toward a live target, then
 * restores its rest quaternion when the scope disposes.
 */
export class LookAt {
    private constructor();
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: LookAtCreateOptions): LookAt;
}

/**
 * Weapon / arm aim: drives one CCD chain's target bone from a live PositionLike.
 */
export class AimIk {
    readonly solver: CCDIKSolver;
    private constructor();
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: AimIkCreateOptions): AimIk;
}

/** A point source. Native Object3D inputs are read in world space. */
interface PositionLike {
    readonly position: Vector3Like;
    getWorldPosition?(target: Vector3): Vector3;
}
