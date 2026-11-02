// Import from "wanaka-studio-engine/melee-combat".

import { AnimationClip, Bone, type Object3D } from "three";
import type { CombatMotionKey } from "wanaka-studio-engine/action-combat";
import type { LifetimeScope } from "wanaka-studio-engine";
import { type CharacterControllerCreateOptions } from "wanaka-studio-engine/character";
import type { PhysicsWorld } from "wanaka-studio-engine/physics";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { type CombatAnimationProbe } from "wanaka-studio-engine/action-combat";
import type { CombatRecipe } from "wanaka-studio-engine/combat-recipe";

export { defineCombatRecipe, createMeleeRecipe, type CombatRecipe, type CombatMove, type CombatMoveRole, } from "wanaka-studio-engine/combat-recipe";

export const COMBAT_HUMANOID_ROLES: readonly [
    'hips',
    'spine',
    'chest',
    'head',
    'leftUpperArm',
    'leftLowerArm',
    'leftHand',
    'rightUpperArm',
    'rightLowerArm',
    'rightHand',
    'leftUpperLeg',
    'leftLowerLeg',
    'leftFoot',
    'rightUpperLeg',
    'rightLowerLeg',
    'rightFoot'
];

export type CombatHumanoidRole = (typeof COMBAT_HUMANOID_ROLES)[number];

export type CombatRigMap = Readonly<Record<CombatHumanoidRole, string>>;

export const WANA_COMBAT_RIG: CombatRigMap;

export const VROID_COMBAT_RIG: CombatRigMap;

/** No name guessing: missing/duplicate bones and collapsed rigs are explicit errors. */
export function bindCombatRig(root: Object3D, map: CombatRigMap): Readonly<Record<CombatHumanoidRole, Bone>>;

export interface CombatRetargetOptions {
    readonly source: Object3D;
    readonly sourceRig: CombatRigMap;
    readonly target: Object3D;
    readonly targetRig: CombatRigMap;
    readonly clip: AnimationClip;
    readonly name: string;
    readonly duration?: number;
    readonly sampleRate?: number;
}

export interface CombatRetargetResult {
    readonly clip: AnimationClip;
    readonly motion: readonly CombatMotionKey[];
}

/** Bake rest-space rotational deltas on isolated rigs; never stretch target limbs or mutate input assets. */
export function retargetCombatClip(options: CombatRetargetOptions): CombatRetargetResult;

/** Original support motions (defense, dodge, stagger and get-up), relative to the target bind pose. */
export function createCombatSupportClips(root: Object3D, map: CombatRigMap): readonly AnimationClip[];

export const COMBAT_MOTION_LICENSE: {
    readonly source: string;
    readonly sourceUrl: string;
    readonly licenseUrl: string;
    readonly acknowledgment: string;
};

export interface MeleeMotionPack {
    readonly clips: readonly AnimationClip[];
    readonly recipe: CombatRecipe;
}

/** Bake the licensed starter pack once per rig, leaving original models and clips unchanged. */
export function createMeleeMotionPack(target: Object3D, rig: CombatRigMap, mode?: CombatRecipe['mode'], authoredRecipe?: CombatRecipe): MeleeMotionPack;

export type CombatPoint = readonly [
    number,
    number,
    number
];

/** One movement owner, shared by inputs, root travel and physical reactions. */
export interface CombatMotor {
    read(): {
        readonly position: CombatPoint;
        readonly yaw: number;
    };
    drive(velocity: CombatPoint, yaw: number): void;
    impulse(velocity: CombatPoint): void;
    suspend(): void;
    resume(position: CombatPoint, yaw: number): void;
}

/** Feet-space adapter; removes the CharacterVirtual while a ragdoll owns the body. */
export function createCombatCharacterMotor(scope: LifetimeScope, world: PhysicsWorld, root: Object3D, options: Omit<CharacterControllerCreateOptions, 'position'> & {
    readonly feet: CombatPoint;
    readonly yaw?: number;
}): CombatMotor;

export type CombatActorState = 'ready' | 'staggered' | 'downed' | 'getting-up' | 'dead' | 'disposed';

export interface CombatActorSnapshot {
    readonly id: string;
    readonly state: CombatActorState;
    readonly health: number;
    readonly stamina: number;
    readonly stagger: number;
    readonly action: string | null;
    readonly position: CombatPoint;
    readonly yaw: number;
}

export interface CombatActor {
    readonly id: string;
    readonly root: Object3D;
    request(move: string, bufferSeconds?: number): 'started' | 'buffered' | 'rejected';
    move(velocity: CombatPoint): void;
    face(yaw: number): void;
    snapshot(): CombatActorSnapshot;
    dispose(): void;
}

export interface CombatActorOptions {
    readonly id: string;
    readonly team: string;
    readonly root: Object3D;
    readonly motor: CombatMotor;
    readonly rig: CombatRigMap;
    readonly clips: readonly AnimationClip[];
    readonly recipe: CombatRecipe;
    readonly probes: readonly CombatAnimationProbe[];
    readonly idleClip?: string;
    readonly runClip?: string;
    readonly ai?: {
        readonly seed: number;
        readonly speed: number;
        readonly reach: number;
        readonly leash: number;
    };
}

export interface CombatImpactEvent {
    readonly kind: 'hit' | 'blocked' | 'parried' | 'dodged' | 'downed' | 'recovered' | 'death';
    readonly attacker: string | null;
    readonly target: string;
    readonly move: string | null;
    readonly damage: number;
    readonly point: CombatPoint;
}

/** Shared fixed-step transaction for players and AI, with one motor and one visible mixer per actor. */
export class CombatArena {
    constructor(scope: LifetimeScope, scheduler: PhaseScheduler, world: PhysicsWorld);
    addActor(input: CombatActorOptions): CombatActor;
    snapshot(): readonly CombatActorSnapshot[];
    drainEvents(): readonly CombatImpactEvent[];
}

/** Calibration helpers preserve mounted weapon transforms; probe radii are world meters. */
export function createMeleeProbes(root: Object3D, map: CombatRigMap, weapon?: Object3D): readonly CombatAnimationProbe[];
