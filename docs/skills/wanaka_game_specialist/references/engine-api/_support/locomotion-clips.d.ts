export const LOCOMOTION_CLIP_ROLES: readonly [
    'idle',
    'walk',
    'run',
    'sprint',
    'jump',
    'fall'
];

export type LocomotionClipRole = (typeof LOCOMOTION_CLIP_ROLES)[number];

export type LocomotionClipNames = {
    readonly [Role in LocomotionClipRole]?: string;
};

export const LOCOMOTION_IDLE_SPEED: number;

export const LOCOMOTION_WALK_SPEED: number;

export const LOCOMOTION_SPRINT_SPEED: number;

export const LOCOMOTION_JUMP_VELOCITY: number;

export const LOCOMOTION_TURN_SPEED: number;

export const LOCOMOTION_FADE_SECONDS: number;

export function resolveLocomotionClip(clipNames: readonly string[], role: LocomotionClipRole, overrides?: LocomotionClipNames | undefined): string | undefined;

/** Resolve every locomotion role once from exact overrides or keyword clip matching. */
export function resolveLocomotionClips(clipNames: readonly string[], overrides?: LocomotionClipNames | undefined): LocomotionClipNames;

export function hasLocomotionClips(clipNames: readonly string[], overrides?: LocomotionClipNames | undefined): boolean;

/** Select a clip for one locomotion state from a previously resolved role map. */
export function selectLocomotionStateClip(clips: LocomotionClipNames, input: {
    readonly grounded: boolean;
    readonly horizontalSpeed: number;
    readonly verticalVelocity: number;
}): string | undefined;

/** Motor facts used to pick a locomotion clip. Bound characters write these from latestStep. */
export interface LocomotionFacts {
    readonly grounded: boolean;
    readonly horizontalSpeed: number;
    readonly verticalVelocity: number;
}

export function resolveLocomotionStateClip(clipNames: readonly string[], input: LocomotionFacts, overrides?: LocomotionClipNames | undefined): string | undefined;

export function lerpAngle(from: number, to: number, t: number): number;
