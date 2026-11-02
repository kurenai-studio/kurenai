// Import from "wanaka-studio-engine/default-characters/blond-beard".

import type { ModelRotationDegrees } from "wanaka-studio-engine/assets";
import type { LocomotionClipNames } from "wanaka-studio-engine/locomotion-clips";

/** Published blond-beard catalog humanoid for an extra grounded default body. */
export const WANAKA_DEFAULT_CHARACTER_BLOND_BEARD: WanakaDefaultCharacter;

export type WanakaDefaultCharacterId = 'cat-ear-glasses' | 'blond-beard' | 'purple-hair' | 'gold-twin-tails' | 'pink-bob' | 'black-headscarf';

export type WanakaDefaultCharacter = {
    readonly id: WanakaDefaultCharacterId;
    readonly assetId: string;
    readonly assetUrl: string;
    readonly rotationDegrees: ModelRotationDegrees;
    readonly scale: number;
    readonly clipNames: LocomotionClipNames;
};
