// Import from "wanaka-studio-engine/camera-sequence".

import type { DiagnosticsPort } from "wanaka-studio-engine";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { type Object3D, type PerspectiveCamera } from "three/webgpu";

/** Immutable three-dimensional tuple used by camera sequence literals. */
export type Vector3Tuple = readonly [
    number,
    number,
    number
];

/** Immutable quaternion tuple in Three's x, y, z, w order. */
export type QuaternionTuple = readonly [
    number,
    number,
    number,
    number
];

/** A world point or a point captured relative to one snapshot anchor. */
export type CameraPoint = {
    readonly world: Vector3Tuple;
} | {
    readonly anchor: string;
    readonly local: Vector3Tuple;
    readonly sampling?: 'snapshot';
};

/** Authored camera orientation resolved directly or through a snapshot binding. */
export type CameraOrientation = {
    readonly kind: 'euler-degrees';
    readonly value: Vector3Tuple;
    readonly order?: 'YXZ';
    readonly space?: {
        readonly anchor: string;
        readonly sampling?: 'snapshot';
    };
} | {
    readonly kind: 'quaternion';
    readonly value: QuaternionTuple;
    readonly space?: {
        readonly anchor: string;
        readonly sampling?: 'snapshot';
    };
} | {
    readonly kind: 'binding';
    readonly key: string;
    readonly sampling?: 'snapshot';
};

/** A direct orientation or a deterministic look-at target. */
export type CameraAim = CameraOrientation | {
    readonly kind: 'look-at';
    readonly target: CameraPoint;
    readonly rollDegrees?: number;
    readonly fallback: CameraOrientation;
};

/** Perspective lens values controlled by a camera sequence. */
export interface CameraPerspectiveLens {
    readonly kind: 'perspective';
    readonly fovDegrees: number;
}

/** Lens branch supported by the camera sequence player. */
export type CameraLens = CameraPerspectiveLens;

/** Named interpolation curves shared by Runtime and authoring tools. */
export type CameraEasing = 'linear' | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic';

/** Travel from the previous keyframe into the keyframe carrying this value. */
export type CameraTransition = {
    readonly kind: 'cut';
} | {
    readonly kind: 'linear' | 'smooth';
    readonly easing: CameraEasing;
};

/** One author-defined event on a camera sequence timeline. */
export interface CameraMarker {
    readonly id: string;
    readonly atSeconds: number;
}

/** One complete camera pose on a camera sequence timeline. */
export interface CameraKeyframe {
    readonly id: string;
    readonly atSeconds: number;
    readonly position: CameraPoint;
    readonly aim: CameraAim;
    readonly lens?: CameraLens;
    readonly transition?: CameraTransition;
}

/** Validated immutable camera trajectory definition. */
export interface CameraSequence {
    readonly id: string;
    readonly durationSeconds: number;
    readonly keyframes: readonly CameraKeyframe[];
    readonly markers?: readonly CameraMarker[];
}

/** Frozen world transform captured for one snapshot anchor or orientation binding. */
export interface CameraSequenceBindingSnapshot {
    /** Three column-major Matrix4 elements. */
    readonly matrixWorld: readonly number[];
    readonly worldQuaternion: QuaternionTuple;
}

/** Snapshot bindings consumed by deterministic sampling. */
export interface CameraSequenceBindings {
    readonly snapshot: Readonly<Record<string, CameraSequenceBindingSnapshot>>;
}

/** Deterministic world-space result of sampling a camera sequence. */
export interface CameraSequenceSample {
    readonly position: Vector3Tuple;
    readonly quaternion: QuaternionTuple;
    readonly lens: CameraLens | undefined;
    readonly keyframeId: string;
    readonly segmentProgress: number;
    readonly cut: boolean;
    readonly aimFallbackUsed: boolean;
}

/**
 * Validates, copies, and deeply freezes a camera sequence literal.
 * Subsequent mutation of the caller's literal cannot change the definition.
 */
export function defineCameraSequence(definition: CameraSequence): CameraSequence;

/**
 * Samples a sequence at finite time, clamped to its authored duration.
 * The function never mutates the definition or supplied binding snapshots.
 */
export function sampleCameraSequence(sequence: CameraSequence, timeSeconds: number, bindings: CameraSequenceBindings): CameraSequenceSample;

/** Clock used to advance a playing camera sequence. */
export type CameraSequenceClock = 'presentation' | 'simulation';

/** Ownership policy applied after the terminal pose has been submitted. */
export type CameraSequenceCompletion = {
    readonly kind: 'hold';
} | {
    readonly kind: 'restore';
};

/** Required options for starting one camera sequence playback. */
export interface CameraSequencePlayOptions {
    readonly completion: CameraSequenceCompletion;
}

/** Marker behavior for an explicit timeline seek. */
export interface CameraSequenceSeekOptions {
    readonly markers?: 'crossed';
}

/** Marker behavior for skipping to the authored terminal pose. */
export interface CameraSequenceSkipOptions {
    readonly markers?: 'remaining';
}

/** Confirmation that the prepared pose entered a submitted main frame. */
export interface CameraSequencePreparedReceipt {
    readonly sequenceId: string;
    readonly atSeconds: number;
    readonly frameId: number;
}

/** Stable result after terminal ownership and generation cleanup complete. */
export interface CameraSequenceFinishedReceipt {
    readonly reason: 'completed' | 'skipped' | 'cancelled' | 'disposed';
    readonly cause?: 'user' | 'view-lost' | 'reparented' | 'callback-error';
    readonly sequenceId: string;
    readonly atSeconds: number;
    readonly terminalFrameId: number | null;
}

/** Promises associated with one playback generation. */
export interface CameraSequencePlayback {
    readonly ready: Promise<CameraSequencePreparedReceipt>;
    readonly finished: Promise<CameraSequenceFinishedReceipt>;
}

/** Observable lifecycle state of a CameraSequencePlayer. */
export type CameraSequencePlayerState = 'idle' | 'preparing' | 'prepared' | 'playing' | 'paused' | 'finishing' | 'cancelling' | 'completed' | 'cancelled' | 'disposed';

/** Serializable state used by diagnostics and deterministic runtime tests. */
export interface CameraSequencePlayerSnapshot {
    readonly sequenceId: string;
    readonly generation: number;
    readonly state: CameraSequencePlayerState;
    readonly atSeconds: number;
    readonly submittedAtSeconds: number | null;
    readonly progress: number;
    readonly keyframeId: string;
    readonly finishedReason?: CameraSequenceFinishedReceipt['reason'];
    readonly finishedCause?: CameraSequenceFinishedReceipt['cause'];
}

/** Native camera, bindings, callbacks, and clock used by one reusable player. */
export interface CameraSequencePlayerOptions {
    readonly camera: PerspectiveCamera;
    readonly sequence: CameraSequence;
    readonly anchors?: Readonly<Record<string, Object3D>>;
    readonly clock?: CameraSequenceClock;
    readonly diagnostics?: DiagnosticsPort;
    readonly onMarker?: (marker: CameraMarker) => void;
    readonly onFinished?: (result: CameraSequenceFinishedReceipt) => void;
}

/** Scope-owned player for one reusable, validated camera sequence definition. */
export class CameraSequencePlayer {
    private constructor();
    /** Creates a player tied to the supplied owner scope and Runtime scheduler. */
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: CameraSequencePlayerOptions): CameraSequencePlayer;
    /**
     * Applies a pose and resolves after that pose enters a successful main frame.
     * Do not await this from the SceneHost activation stack that commits the first view.
     */
    prepare(timeSeconds?: number): Promise<CameraSequencePreparedReceipt>;
    /** Starts a new run, or continues the generation produced by a completed prepare call. */
    play(options: CameraSequencePlayOptions): CameraSequencePlayback;
    /** Pauses timeline advancement while retaining the current pose and claims. */
    pause(): void;
    /** Resumes a paused timeline from its current authored time. */
    resume(): void;
    /** Applies a finite, clamped timeline time on the next presentation pass. */
    seek(timeSeconds: number, options?: CameraSequenceSeekOptions): void;
    /** Requests the terminal pose, optionally dispatching all remaining markers. */
    skip(options?: CameraSequenceSkipOptions): void;
    /** Requests safe restoration and cancellation of the active generation. */
    cancel(): void;
    /** Returns the latest immutable lifecycle and playhead snapshot. */
    snapshot(): CameraSequencePlayerSnapshot;
}
