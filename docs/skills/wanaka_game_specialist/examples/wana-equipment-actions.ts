import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import { createWanaLoadout, createWanaEquipmentActions, type WanaEquipment, type WanaEquipmentActionEvent } from 'wanaka-studio-engine/equipment';

/** Compose with the game's own input, locomotion, inventory and projectile/physics system. */
export function wireWanaActions(scope: LifetimeScope, host: THREE.Object3D, mixer: THREE.AnimationMixer, item: WanaEquipment, onShot: (event: WanaEquipmentActionEvent) => void, onThrown: (event: WanaEquipmentActionEvent) => void): {
  update: (dt: number) => void;
  aim: (worldDirection: THREE.Vector3 | null) => void;
  fire: () => boolean;
  throwItem: () => boolean;
} {
  const loadout = createWanaLoadout(scope, host);
  // This example takes a procedural standard. Load a generated asset with its owning loader first.
  loadout.equip('right-hand', item);
  const actions = createWanaEquipmentActions(scope, host);
  return {
    update: (dt) => { actions.restore(); mixer.update(dt); actions.update(dt); },
    aim: actions.aim,
    fire: () => actions.fire(onShot),
    throwItem: () => actions.throwItem('right-hand', (event) => {
      loadout.equip('right-hand', null);
      // Consume inventory and spawn the game-owned physics object only at this callback.
      onThrown(event);
    }),
  };
}
