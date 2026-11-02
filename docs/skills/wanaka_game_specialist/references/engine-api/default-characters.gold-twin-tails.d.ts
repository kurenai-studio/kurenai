// Import from "wanaka-studio-engine/default-characters/gold-twin-tails".

import type { ModelRotationDegrees } from "wanaka-studio-engine/assets";
import type { LocomotionClipNames } from "wanaka-studio-engine/locomotion-clips";

/** Published gold-twin-tails catalog humanoid for an extra grounded default body. */
export const WANAKA_DEFAULT_CHARACTER_GOLD_TWIN_TAILS: WanakaDefaultCharacter;

export type WanakaDefaultCharacterId = 'cat-ear-glasses' | 'blond-beard' | 'purple-hair' | 'gold-twin-tails' | 'pink-bob' | 'black-headscarf';

export type WanakaDefaultCharacter = {
    readonly id: WanakaDefaultCharacterId;
    readonly assetId: string;
    readonly assetUrl: string;
    readonly rotationDegrees: ModelRotationDegrees;
    readonly scale: number;
    readonly clipNames: LocomotionClipNames;
};
