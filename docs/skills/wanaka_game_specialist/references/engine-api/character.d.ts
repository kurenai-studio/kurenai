// Import from "wanaka-studio-engine/character".

import { type LifetimeScope } from "wanaka-studio-engine";
import { Vector3, type Object3D } from "three/webgpu";
import { type LocomotionClipNames, type LocomotionFacts } from "wanaka-studio-engine/locomotion-clips";
import { type PhysicsWorld, type Vector3Like } from "wanaka-studio-engine/physics";

export interface CharacterPresentationPlayOptions {
    readonly fade?: number;
    readonly loop?: boolean;
    readonly once?: boolean;
}

/**
 * Structural animated presentation. `createAnimatedModel` and
 * `attachAnimatedModelInstance` satisfy this without a module import; a custom
 * mixer owner may implement the same shape.
 */
export interface CharacterPresentation {
    /** Canonical presentation root whose local +Z is forward. */
    readonly root: Object3D;
    readonly clipNames?: readonly string[];
    readonly isPlayingOnce?: boolean;
    play(name: string, options?: CharacterPresentationPlayOptions): unknown;
    stop?(): void;
    setAutoLocomotion?(enabled: boolean): void;
    /**
     * Receives motor facts each fixed step so the presentation picks its own
     * locomotion clip. A presentation without it gets the older behavior: the
     * controller resolves a clip from `clipNames` and calls `play` itself.
     */
    setLocomotionFacts?(facts: LocomotionFacts): void;
}

export interface CharacterControllerCreateOptions {
    /** Capsule radius in meters. */
    readonly radius: number;
    /** Capsule cylinder half-height in meters (total height ≈ 2·(halfHeight+radius)). */
    readonly halfHeight: number;
    /** Start pose: capsule bottom with `object`, capsule center with `model`. */
    readonly position?: Vector3Like;
    readonly maxSlopeDeg?: number;
    readonly jumpSpeed?: number;
    /** Seconds after leaving ground during which jump() still fires. Default 0.12. */
    readonly coyoteSeconds?: number;
    /** Crouch capsule cylinder half-height. Default halfHeight * 0.45. */
    readonly crouchHalfHeight?: number;
    /** Stair step-up height in meters written onto ExtendedUpdate. Default 0.4. */
    readonly walkStairsStepUp?: number;
    /** Stick-to-floor probe distance in meters. Default 0.2. */
    readonly stickToFloorStepDown?: number;
}

export type CharacterControllerCreateAndBindOptions = CharacterControllerCreateOptions & ({
    /** Plain object whose position is the capsule bottom. A feet-origin GLB can copy it directly. */
    readonly object: Object3D;
    readonly model?: never;
    readonly clipNames?: never;
} | {
    /** Animated presentation whose root receives feet pose. Owns grounded and airborne locomotion clips. */
    readonly model: CharacterPresentation;
    readonly object?: never;
});

export interface CharacterControlReceipt {
    readonly state: 'staged';
    readonly sequence: number;
}

export interface CharacterCommandReceipt {
    readonly state: 'queued';
    readonly sequence: number;
}

export interface CharacterImpulseRequest {
    readonly velocity: Vector3Like;
    readonly mode: 'velocity-change';
    readonly driveDuringImpulse: 'blend' | {
        readonly kind: 'suspend';
        readonly durationSeconds: number;
    };
}

export interface CharacterResetRequest {
    readonly position: Vector3Like;
    readonly facing: 'preserve' | {
        readonly yawDeg: number;
    };
    readonly velocity: 'clear';
    readonly jump: 'reset';
    readonly groundContact: 'clear';
}

/** A velocity-preserving positional shift — see {@link CharacterController.nudge}. */
export interface CharacterNudgeRequest {
    /** World-space offset in meters, added to the character's current position
     * at the next physics step. */
    readonly offset: Vector3Like;
}

export interface CharacterFeetAnchor {
    readonly kind: 'character-feet';
    /** Capsule bottom in leftover-frame presentation space. */
    readonly position: Readonly<Vector3Like>;
    /** Last completed simulation step. Positions are not that step's sim pose. */
    readonly physicsStep: number;
}

export interface CharacterEyeAnchor {
    readonly kind: 'character-eye';
    /** `feet` plus `localHeight`, in leftover-frame presentation space. */
    readonly position: Readonly<Vector3Like>;
    readonly localHeight: number;
    /** Last completed simulation step. Positions are not that step's sim pose. */
    readonly physicsStep: number;
}

export type CharacterFacingSource = 'preserve' | 'movement' | 'forward' | 'face-target';

export interface CharacterStepFacts {
    readonly physicsStep: number;
    /**
     * Sequence of the most recently settled control intent — one that either
     * took effect or was discarded by a reset that landed first. `NaN` means
     * no control has ever settled.
     */
    readonly controlSequence: number;
    readonly position: Readonly<Vector3Like>;
    readonly driveVelocity: Readonly<Vector3Like>;
    readonly drive: Readonly<{
        status: 'active' | 'suspended';
        suspensionRemainingSeconds: number;
    }>;
    readonly impulseVelocity: Readonly<Vector3Like>;
    readonly groundVelocity: Readonly<Vector3Like>;
    readonly resolvedVelocity: Readonly<Vector3Like>;
    readonly ground: Readonly<{
        kind: 'grounded' | 'airborne';
        transition: 'initialized' | 'landed' | 'continued' | 'left-ground';
    }>;
    /**
     * World position of the kinematic body the character stands on after this
     * step; `null` when airborne or standing on a static or dynamic body. The
     * multiplayer bridge measures its prediction against the authority's pose
     * relative to this body, so a moving platform's own travel between the two
     * samples is not read as prediction error.
     */
    readonly movingGround: Readonly<Vector3Like> | null;
    /** Semantic world yaw in degrees; zero faces world +Z. */
    readonly facingYawDeg: number;
    readonly facingSource: CharacterFacingSource;
    readonly stance: Readonly<{
        requested: 'stand' | 'crouch';
        applied: 'stand' | 'crouch';
        blockedBy: 'ceiling' | null;
        colliderHeight: number;
        eyeHeight: number;
    }>;
    readonly jump: Readonly<{
        requested: 'none' | 'fixed';
        startedThisStep: boolean;
        startedFrom: 'ground' | 'coyote' | null;
        phase: 'grounded' | 'rising' | 'falling';
        coyoteRemainingSeconds: number;
    }>;
}

/**
 * Coordinated Jolt CharacterVirtual authority. After `createAndBind`, this
 * controller is the only writer of the bound root's simulation and
 * presentation pose. Project input, AI, or navigation stages one control
 * intent during `fixedInput`/`fixedUpdate` through `control()`; Character
 * resolves movement, facing, stance, jump, external commands, and
 * completed-step facts while Jolt handles slope, stair, support, and
 * collision motion through `ExtendedUpdate`.
 */
export class CharacterController {
    readonly radius: number;
    /**
     * Semantic stance anchors. Positions sample leftover frame time in
     * `preRender` so a follow camera stays locked to the collision-capsule pose.
     * `feet` is the capsule bottom (the bound model root when `model` is set).
     * `physicsStep` is the last completed simulation step; the positions are
     * presentation-space, not that step's sim pose.
     */
    readonly anchors: Readonly<{
        feet: Readonly<CharacterFeetAnchor>;
        eyes: Readonly<CharacterEyeAnchor>;
    }>;
    private constructor();
    /** Creates a character owned by the scope inside the supplied PhysicsWorld. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: CharacterControllerCreateOptions): CharacterController;
    /**
     * Creates a character and synchronizes the supplied presentation with the
     * simulation for the scope lifetime. Binding does not add the object or
     * model root to a scene or transfer geometry/material ownership; the caller
     * still parents the root and owns its presentation resources.
     */
    static createAndBind(scope: LifetimeScope, world: PhysicsWorld, options: CharacterControllerCreateAndBindOptions): CharacterController;
    /**
     * World-space planar velocity in m/s. This is the low-level escape hatch
     * for custom motion; it does not carry facing, jump, stance, or a control
     * sequence. The common route is `control(intent)`. Do not call in the same
     * step as {@link control}; put movement on the intent instead.
     */
    setMoveIntent(velocityX: number, velocityZ: number): void;
    /**
     * Stages one complete control intent for the next physics step. Repeated
     * submissions are newest-wins until that step consumes the intent once.
     * `latestStep.controlSequence` reports the settled sequence.
     * Jump, stance, and movement belong on this intent; calling {@link jump},
     * {@link setStance}, or {@link setMoveIntent} in the same step throws.
     */
    control(intent: CharacterControlIntent): CharacterControlReceipt;
    /** Last fact set published from one completed physics step. */
    get latestStep(): Readonly<CharacterStepFacts> | null;
    /**
     * Queues a jump consumed on the next grounded or coyote-window fixed step.
     * Returns true when the controller is on ground or still inside coyote time.
     * Returns false and ignores the call when airborne after coyote has elapsed.
     * Use {@link setVerticalVelocity} for air jumps. Do not call in the same
     * step as {@link control}; put `jump` on the intent instead. The call itself
     * conflicts, even when this returns false.
     */
    jump(): boolean;
    /** Queues an authoritative vertical velocity for the next fixed step. */
    setVerticalVelocity(velocityY: number): void;
    /** Queues a velocity-change impulse for the next completed physics step. */
    applyImpulse(request: CharacterImpulseRequest): CharacterCommandReceipt;
    /** Queues an atomic respawn barrier for the next physics step. */
    reset(request: CharacterResetRequest): CharacterCommandReceipt;
    /**
     * Queues a velocity-preserving positional shift for the next physics step.
     * Multiple nudges staged before a step accumulate.
     *
     * Exists for the motion-reconciliation blend path: a correction step must
     * move the body a few centimeters without disturbing its ongoing dynamics
     * — velocity, jump phase, and ground contact all survive, and the
     * presentation interpolates across the shift instead of snapping. `reset`
     * is the opposite contract (an authoritative relocate that clears all of
     * them), and a staged reset discards any nudge staged before it: a
     * correction measured against a pre-relocate pose is stale the moment the
     * relocate lands.
     *
     * @param request the world-space offset to add to the current position.
     * @returns a queued-command receipt, like `reset`'s.
     */
    nudge(request: CharacterNudgeRequest): CharacterCommandReceipt;
    get stanceName(): 'stand' | 'crouch';
    /**
     * Swaps the CharacterVirtual capsule. Crouch uses a shorter capsule; the
     * change fails loud when SetShape reports penetration. Do not call in the
     * same step as {@link control}; put `stance` on the intent instead. The call
     * itself conflicts, even when the stance is unchanged.
     */
    setStance(stance: 'stand' | 'crouch'): void;
    get isOnGround(): boolean;
    /**
     * Authoritative 60 Hz simulation pose. With `object` this is the capsule
     * bottom; with `model` this is the capsule center. Gameplay traces and
     * `latestStep.position` use this pose. Follow cameras use `anchors` or
     * the bound presentation instead.
     */
    get position(): Vector3;
    /** Current authoritative world-space CharacterVirtual velocity in m/s. */
    get velocity(): Vector3;
    /**
     * Immediate pose write. For a queued respawn barrier that also clears
     * velocity, jump, and ground contact, use {@link reset}.
     */
    teleport(position: Vector3Like): void;
}

/** World-space planar velocity in m/s. Positive X is world +X; positive Z is
 * world +Z. */
export interface CharacterWorldMovementIntent {
    readonly kind: 'world';
    readonly velocity: {
        readonly x: number;
        readonly z: number;
    };
}

/** Movement in a named local basis. `forward` is positive in that basis and
 * `strafe` is positive to its right. Combined input is clipped to unit length
 * so diagonal keyboard input does not exceed `speed`. `{ kind: 'actor' }` uses
 * the facing already settled when this step consumes the intent. A same-step
 * `facing: { kind: 'forward' }` turns after movement, so this step still moves
 * along the previous facing. */
export interface CharacterRelativeMovementIntent {
    readonly kind: 'relative';
    readonly strafe: number;
    readonly forward: number;
    readonly speed: number;
    readonly relativeTo: {
        readonly kind: 'actor';
    } | {
        readonly kind: 'view';
        readonly forward: {
            readonly x: number;
            readonly z: number;
        };
    };
}

export type CharacterMovementIntent = CharacterWorldMovementIntent | CharacterRelativeMovementIntent | {
    readonly axes: {
        readonly x: number;
        readonly y: number;
    };
    readonly speed: number;
    readonly relativeTo: {
        readonly kind: 'world' | 'actor';
    } | {
        readonly kind: 'view';
        readonly forward: {
            readonly x: number;
            readonly z: number;
        };
    };
};

export type CharacterFacingIntent = {
    readonly kind: 'preserve';
} | {
    readonly kind: 'movement';
    readonly smoothingHalfLife: number;
} | {
    /** Face this planar world-space vector. */
    readonly kind: 'forward';
    readonly forward: {
        readonly x: number;
        readonly z: number;
    };
    readonly smoothingHalfLife: number;
} | {
    /** Compatibility target-facing intent retained for older locomotor projects. */
    readonly kind: 'face-target';
    readonly target: {
        readonly position: {
            readonly x: number;
            readonly y: number;
            readonly z: number;
        };
    };
    readonly smoothingHalfLife: number;
};

/** One fixed-step movement, facing, stance, and jump command. Submit with
 * `CharacterController.control`. Omitted `stance` is stand this step; omitted
 * `jump` is no jump this step. Do not mix with `jump()`, `setStance()`, or
 * `setMoveIntent()` in the same step. */
export interface CharacterControlIntent {
    readonly movement: CharacterMovementIntent;
    readonly facing: CharacterFacingIntent;
    readonly stance?: 'stand' | 'crouch';
    readonly jump?: 'none' | 'fixed' | {
        readonly kind: 'none' | 'fixed';
    };
}

/** Internal bag consumed by Character physics. Not part of the public character
 * export; world movement stores forward in `axes.y` with z = -axes.y * speed. */
export interface CharacterControlFrame {
    readonly movement: {
        readonly axes: {
            readonly x: number;
            readonly y: number;
        };
        readonly speed: number;
        readonly relativeTo: {
            readonly kind: 'world' | 'actor';
        } | {
            readonly kind: 'view';
            readonly forward: {
                readonly x: number;
                readonly z: number;
            };
        };
    };
    readonly facing: {
        readonly kind: 'preserve';
    } | {
        readonly kind: 'movement';
        readonly whenStationary: 'preserve';
        readonly smoothingHalfLife: number;
    } | {
        readonly kind: 'view-yaw';
        readonly forward: {
            readonly x: number;
            readonly z: number;
        };
        readonly smoothingHalfLife: number;
    } | {
        readonly kind: 'face-target';
        readonly target: {
            readonly position: {
                readonly x: number;
                readonly y: number;
                readonly z: number;
            };
        };
        readonly smoothingHalfLife: number;
    };
    readonly stance: 'stand' | 'crouch';
    readonly jump: {
        readonly kind: 'none' | 'fixed';
    };
}
