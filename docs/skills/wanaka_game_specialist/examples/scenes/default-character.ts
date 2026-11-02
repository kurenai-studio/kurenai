import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import { WANAKA_DEFAULT_CHARACTER } from 'wanaka-studio-engine/default-character';

/** Loads the Wanaka default humanoid when the brief does not name an appearance. */
export async function loadWanakaDefaultCharacter(
  scope: LifetimeScope,
  model3DLoader: Model3DLoader,
  parent: THREE.Object3D,
  name: string,
): Promise<THREE.Group> {
  const model = await model3DLoader.load(scope, {
    assetUrl: WANAKA_DEFAULT_CHARACTER.assetUrl,
    rotationDegrees: WANAKA_DEFAULT_CHARACTER.rotationDegrees,
    scale: WANAKA_DEFAULT_CHARACTER.scale,
  });
  model.name = name;
  parent.add(model);
  return model;
}
