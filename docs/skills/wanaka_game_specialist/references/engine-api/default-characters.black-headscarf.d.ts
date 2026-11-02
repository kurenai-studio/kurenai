// Import from "wanaka-studio-engine/default-characters/black-headscarf".

import type { ModelRotationDegrees } from "wanaka-studio-engine/assets";
import type { LocomotionClipNames } from "wanaka-studio-engine/locomotion-clips";

/** Published black-headscarf catalog humanoid for an extra grounded default body. */
export const WANAKA_DEFAULT_CHARACTER_BLACK_HEADSCARF: WanakaDefaultCharacter;

export type WanakaDefaultCharacterId = 'cat-ear-glasses' | 'blond-beard' | 'purple-hair' | 'gold-twin-tails' | 'pink-bob' | 'black-headscarf';

export type WanakaDefaultCharacter = {
    readonly id: WanakaDefaultCharacterId;
    readonly assetId: string;
    readonly assetUrl: string;
    readonly rotationDegrees: ModelRotationDegrees;
    readonly scale: number;
    readonly clipNames: LocomotionClipNames;
};
