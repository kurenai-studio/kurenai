// Import from "wanaka-studio-engine/animated-model".

import type { AnimationClip } from "three/webgpu";
import type { LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { AnimationAction, AnimationMixer, Group, type Object3D } from "three/webgpu";
import type { GltfAssetReference } from "wanaka-studio-engine/assets";
import { type LocomotionClipNames, type LocomotionFacts } from "wanaka-studio-engine/locomotion-clips";

export interface AnimatedModelPlayOptions {
    readonly fade?: number;
    readonly loop?: boolean;
    /**
     * Play once, then clamp. Bound characters stay on that clip until
     * `setAutoLocomotion(true)` returns choice to `latestStep`. Unbound
     * models resume root-XZ inference when auto-locomotion is enabled.
     */
    readonly once?: boolean;
}

export interface AnimatedModelInstanceOptions {
    /** Clip-name overrides for locomotion roles. */
    readonly clipNames?: LocomotionClipNames;
}

/** Built-in character asset reference used by the character pipeline fixtures. */
export const BUILTIN_CHARACTER_MODEL: string;

/** Bone-path fragments kept on a masked blend layer. */
export interface AnimationLayerMask {
    readonly include: readonly string[];
}

/** Masked blend layer on top of the implicit `base` locomotion layer. */
export interface AnimationLayerOptions {
    readonly clip: string;
    readonly mask: AnimationLayerMask;
    readonly fade?: number;
    readonly once?: boolean;
}

export type { LocomotionFacts };

export interface AnimatedModelCreateOptions extends AnimatedModelInstanceOptions {
    /** Required GLB URL or asset reference. */
    readonly reference: string | GltfAssetReference;
    /** `Object3D.name` written on the presentation root when provided. */
    readonly name?: string;
    /**
     * Unbound models only: infer idle/walk/run from this fixed step's root XZ
     * displacement. Default true when the instance has a locomotion clip set.
     * Bound characters ignore this and follow `latestStep` via
     * `setLocomotionFacts`. Do not write `root.position` to drive clips.
     */
    readonly inferLocomotion?: boolean;
    /** Loop the first clip when the instance has no locomotion set. Default false. */
    readonly autoplay?: boolean;
}

export interface AnimatedModelCreateAndBindOptions extends AnimatedModelCreateOptions {
    /** Parent that owns the presentation root for the scope's lifetime. */
    readonly parent: Object3D;
}

export interface AnimatedModel {
    /** Presentation root to parent, move, and bind to a character controller. */
    readonly root: Object3D;
    readonly clipNames: readonly string[];
    readonly mixer: AnimationMixer;
    readonly isPlayingOnce: boolean;
    play(name: string, options?: AnimatedModelPlayOptions): AnimationAction;
    stop(): void;
    /**
     * Bound characters: `true` returns clip choice to `setLocomotionFacts` /
     * `latestStep` after `play()`. `false` keeps a `play()` hold. Unbound
     * models resume root-XZ inference when they have a locomotion clip set.
     */
    setAutoLocomotion(enabled: boolean): void;
    setLocomotionFacts(facts: LocomotionFacts): void;
    setLayer(name: string, options: AnimationLayerOptions | null): void;
}

/**
 * Adds mixer, clip playback, and scheduler ownership to a model returned by
 * Model3DLoader.load. Unclaimed locomotion inference turns the root's local +Z
 * toward its fixed-step XZ movement.
 */
export function attachAnimatedModelInstance(scope: LifetimeScope, scheduler: PhaseScheduler, source: Group, options?: AnimatedModelInstanceOptions): AnimatedModel;

/** Remove a clip's common source-timeline lead-in without changing track offsets or source data. */
export function normalizeAnimationClipTimeline(clip: AnimationClip): AnimationClip;
