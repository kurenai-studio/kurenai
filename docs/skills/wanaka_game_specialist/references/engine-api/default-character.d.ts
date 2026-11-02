// Import from "wanaka-studio-engine/default-character".

import type { ModelRotationDegrees } from "wanaka-studio-engine/assets";
import type { LocomotionClipNames } from "wanaka-studio-engine/locomotion-clips";

/** Loader inputs for the Wanaka default humanoid when the brief does not name an appearance. */
export const WANAKA_DEFAULT_CHARACTER: WanakaDefaultCharacter;

export type WanakaDefaultCharacterId = 'cat-ear-glasses' | 'blond-beard' | 'purple-hair' | 'gold-twin-tails' | 'pink-bob' | 'black-headscarf';

export type WanakaDefaultCharacter = {
    readonly id: WanakaDefaultCharacterId;
    readonly assetId: string;
    readonly assetUrl: string;
    readonly rotationDegrees: ModelRotationDegrees;
    readonly scale: number;
    readonly clipNames: LocomotionClipNames;
};
