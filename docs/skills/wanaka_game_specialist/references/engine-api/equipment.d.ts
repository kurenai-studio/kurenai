// Import from "wanaka-studio-engine/equipment".

import type { LifetimeScope } from "wanaka-studio-engine";
import { Object3D, Quaternion, Vector3 } from "three";
import { type WanaEquipment, type WanaEquipmentSlot } from "@wanaka/platform/wana-character";
import { type WanakaHumanoidBoneId } from "@wanaka/platform/wana-character";
import { Group } from "three";
import { type WanaLoadout } from "@wanaka/platform/wana-character";

export type { WanaEquipment, WanaEquipmentSlot, WanaLoadout, WanaPropTemplate, } from "@wanaka/platform/wana-character";

/** Canonical humanoid bone names used by Wana equipment. */
export const WANAKA_HUMANOID_BONE_NAMES: Readonly<Record<WanakaHumanoidBoneId, string>>;

/** Original modular prop geometry, in Wana skeleton units, with the grip at the origin. */
export function createWanaEquipmentModel(input: WanaEquipment): Group;

/** Dispose only geometry/materials owned by a generated equipment instance. */
export function disposeWanaEquipmentModel(root: Object3D): void;

/** Mount a prop on an inspected Wana bone. The returned group owns calibration, not gameplay. */
export function mountWanaEquipment(host: Object3D, slot: WanaEquipmentSlot, item: WanaEquipment, loadedModel?: Object3D): Group;

/** Apply explicitly calibrated model-local semantic points to a fresh equipment instance. */
export function applyWanaEquipmentSockets(model: Object3D, item: WanaEquipment): void;

/** Scope-owned default loadout. Game code calls equip/stow/unequip after its own inventory checks. */
export function createWanaLoadout(scope: LifetimeScope, host: Object3D): {
    readonly state: () => WanaLoadout;
    readonly equip: (slot: WanaEquipmentSlot, item: WanaEquipment | null, model?: Object3D) => void;
};

/** Normalize a generated rigid prop to template dimensions; calibration remains explicit. */
export function fitWanaEquipmentModel(model: Object3D, template: WanaEquipment): void;

/** Prepare a freshly loaded model for bone units. Load published GLBs with scale 1 and zero
 * rotation: publication uses meters, whereas Wana bones use centimeters. Never recenter its grip.
 * Raw generated models are fitted once; their pivot and semantic points still need user review.
 * The caller retains disposal ownership of the supplied model.
 */
export function prepareWanaEquipmentModel(model: Object3D, input: WanaEquipment, source: 'raw-generated' | 'published'): Group;

/** Optional upper-body hold overlay. Restore before the mixer update; update after it.
 * Lower-body locomotion remains untouched. Games own aiming, attacks and replication.
 */
export function createWanaEquipmentPose(host: Object3D): {
    restore: () => void;
    update: () => void;
};

/** Snapshot at the actual shot/release pose. Game code owns projectiles, inventory and networking. */
export interface WanaEquipmentActionEvent {
    kind: 'fire' | 'throw';
    slot: WanaEquipmentSlot;
    item: WanaEquipment;
    position: Vector3;
    direction: Vector3;
    quaternion: Quaternion;
}

/** Call restore before the AnimationMixer, then update after it. All directions are world-space. */
export interface WanaEquipmentActions {
    restore: () => void;
    update: (deltaSeconds: number) => void;
    aim: (direction: Vector3 | null) => void;
    fire: (onShot: (event: WanaEquipmentActionEvent) => void, slot?: 'right-hand' | 'left-hand') => boolean;
    throwItem: (slot: 'right-hand' | 'left-hand', onRelease: (event: WanaEquipmentActionEvent) => void) => boolean;
    cancel: () => void;
    reset: () => void;
    state: () => {
        action: 'fire' | 'throw' | null;
        aiming: boolean;
        issues: readonly string[];
    };
}

/** Layer scoped, pole-directed arm IK over locomotion without modifying the hips, legs or clips.
 * Fire/throw reject busy, hidden, incompatible or uncalibrated equipment instead of inventing effects.
 */
export function createWanaEquipmentActions(scope: LifetimeScope, host: Object3D): WanaEquipmentActions;
