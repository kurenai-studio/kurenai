import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import { WANAKA_DEFAULT_CHARACTER_BLOND_BEARD } from 'wanaka-studio-engine/default-characters/blond-beard';

/** Loads one extra published default humanoid so an NPC does not clone the player. */
export async function loadWanakaDefaultCharacterBlondBeard(
  scope: LifetimeScope,
  model3DLoader: Model3DLoader,
  parent: THREE.Object3D,
  name: string,
): Promise<THREE.Group> {
  const model = await model3DLoader.load(scope, {
    assetUrl: WANAKA_DEFAULT_CHARACTER_BLOND_BEARD.assetUrl,
    rotationDegrees: WANAKA_DEFAULT_CHARACTER_BLOND_BEARD.rotationDegrees,
    scale: WANAKA_DEFAULT_CHARACTER_BLOND_BEARD.scale,
  });
  model.name = name;
  parent.add(model);
  return model;
}
