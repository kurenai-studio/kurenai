// Import from "wanaka-studio-engine/action-combat".

import type { LifetimeScope } from "wanaka-studio-engine";
import { Matrix4, type AnimationClip, type Object3D } from "three";

/** Authored action time in seconds, independent of rendering frame rate. */
export interface CombatWindow {
    readonly kind: 'contact' | 'invulnerable' | 'guard' | 'parry';
    readonly start: number;
    readonly end: number;
}

/** A transition is permitted only inside its authored half-open interval. */
export interface CombatTransition {
    readonly action: string;
    readonly start: number;
    readonly end: number;
}

/** Absolute local root trajectory. +Z is forward; yaw is in radians. */
export interface CombatMotionKey {
    readonly time: number;
    readonly position: readonly [
        number,
        number,
        number
    ];
    readonly yaw: number;
}

/** One action's animation slice, gameplay timing and optional root trajectory. */
export interface CombatAction {
    readonly id: string;
    readonly clip: string;
    readonly clipStart: number;
    readonly clipEnd: number;
    readonly speed: number;
    readonly windows: readonly CombatWindow[];
    readonly transitions: readonly CombatTransition[];
    readonly motion?: readonly CombatMotionKey[];
}

/** Serializable receipts; presentation consumes these after simulation commits. */
export type CombatEvent = {
    readonly kind: 'started';
    readonly sequence: number;
    readonly action: string;
} | {
    readonly kind: 'window';
    readonly sequence: number;
    readonly action: string;
    readonly window: CombatWindow['kind'];
    readonly index: number;
    readonly edge: 'open' | 'close';
} | {
    readonly kind: 'ended';
    readonly sequence: number;
    readonly action: string;
    readonly reason: 'completed' | 'transition' | 'interrupted' | 'disposed';
};

/** A contiguous action interval, including animation sample times and root delta. */
export interface CombatSpan {
    readonly sequence: number;
    readonly action: string;
    readonly from: number;
    readonly to: number;
    /** Seconds from the start of this advance, including any preceding hit stop. */
    readonly stepFrom: number;
    readonly stepTo: number;
    readonly clipFrom: number;
    readonly clipTo: number;
    readonly contacts: readonly number[];
    readonly motion: {
        readonly position: readonly [
            number,
            number,
            number
        ];
        readonly yaw: number;
    };
}

/** Current state for inspectors, replays and fixed-step tests. */
export interface CombatSnapshot {
    readonly state: 'idle' | 'playing' | 'disposed';
    readonly sequence: number;
    readonly action: string | null;
    readonly time: number;
    readonly duration: number;
    readonly clipTime: number | null;
    readonly windows: readonly CombatWindow['kind'][];
    readonly buffered: string | null;
    readonly hitStopRemaining: number;
}

/** One moving hit probe, usable for a fist, foot or authored weapon volume. */
export interface CombatSphereSweep {
    readonly from: readonly [
        number,
        number,
        number
    ];
    readonly to: readonly [
        number,
        number,
        number
    ];
    readonly radius: number;
    readonly targetFrom: readonly [
        number,
        number,
        number
    ];
    readonly targetTo: readonly [
        number,
        number,
        number
    ];
    readonly targetRadius: number;
}

/** First contact in [0, 1], with a world-space point and target-outward normal. */
export interface CombatSweepHit {
    readonly fraction: number;
    readonly point: readonly [
        number,
        number,
        number
    ];
    readonly normal: readonly [
        number,
        number,
        number
    ];
}

/**
 * Sweeps two linearly moving spheres in relative space, rather than checking
 * their endpoints. The caller samples the animation at each span boundary;
 * splitting curved trajectories is the animation adapter's responsibility.
 */
export function sweepCombatSphere(sweep: CombatSphereSweep): CombatSweepHit | null;

/** Shared defense eligibility; damage and reactions remain project-owned. */
export interface CombatDefense {
    readonly windows: readonly CombatWindow['kind'][];
    readonly defender: readonly [
        number,
        number,
        number
    ];
    readonly attacker: readonly [
        number,
        number,
        number
    ];
    readonly forward: readonly [
        number,
        number,
        number
    ];
    /** Half angle of the guard cone, in radians. */
    readonly guardHalfAngle: number;
    readonly unblockable: boolean;
}

/** Evaluates dodge before facing-constrained parry/guard, then a normal hit. */
export function resolveCombatDefense(defense: CombatDefense): 'dodged' | 'parried' | 'blocked' | 'hit';

/**
 * Scope-owned action clock shared by unarmed and weapon combat. Advance once per
 * simulation step. Apply spans through the existing animation/movement owners;
 * this clock never writes a character transform or decides damage rules.
 */
export class ActionCombat {
    constructor(scope: LifetimeScope, definitions: readonly CombatAction[]);
    /** Latest buffered intent wins. Rejected unknown actions never mutate state. */
    request(action: string, bufferSeconds?: number): 'started' | 'buffered' | 'rejected';
    /** Forces cleanup for hit reaction, death or another project-owned interruption. */
    interrupt(): void;
    /** Extends a freeze without multiplying or permanently changing animation speed. */
    hitStop(seconds: number): void;
    /**
     * Advances at authored boundaries, including windows shorter than one step.
     * Every returned span belongs to one action generation; resolve its contacts
     * against that generation, not against the final snapshot after this call.
     */
    advance(deltaSeconds: number): readonly CombatSpan[];
    /**
     * Claims a target once per action from a contact span returned by the latest
     * advance. This also covers an action that completed inside that step.
     * Interrupt, disposal and the next advance invalidate unprocessed spans.
     */
    claimContact(span: CombatSpan, target: string): boolean;
    /** Drains ordered lifecycle receipts without invoking reentrant callbacks. */
    drainEvents(): readonly CombatEvent[];
    /** Returns a detached snapshot; modifying it cannot alter the runner. */
    snapshot(): CombatSnapshot;
    /** Clears buffered commands, hit claims and all open windows exactly once. */
    dispose(): void;
}

/** Named rig socket, in the bone's local coordinates. Weapon probes use the same contract. */
export interface CombatAnimationProbe {
    readonly id: string;
    readonly bone: string;
    readonly offset: readonly [
        number,
        number,
        number
    ];
    readonly radius: number;
}

export interface CombatAnimationSegment {
    readonly probe: string;
    readonly radius: number;
    /** Fractions of the originating span, also used to interpolate moving targets. */
    readonly from: number;
    readonly to: number;
    readonly start: readonly [
        number,
        number,
        number
    ];
    readonly end: readonly [
        number,
        number,
        number
    ];
}

/**
 * Isolated skeletal sampler: it never advances or rewinds the visible model's
 * mixer. Intermediate samples follow curved punches and blade arcs, including
 * steps that cross an entire contact window. Geometry/materials are borrowed,
 * not owned; disposing this sampler must not dispose the source's GPU assets.
 */
export class CombatAnimationSampler {
    constructor(scope: LifetimeScope, source: Object3D, clips: readonly AnimationClip[], probes: readonly CombatAnimationProbe[]);
    /** Parent-world transforms bracket the span; the cloned source retains its local transform. */
    sample(span: CombatSpan, clipName: string, parentFrom: Matrix4, parentTo: Matrix4, maxSampleSeconds?: number): readonly CombatAnimationSegment[];
    dispose(): void;
}
