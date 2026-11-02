import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import treeUrl from '#project/assets/catalog/c6c19a06-a743-952c-698b-ce19f65a41cc/tree.glb';

/**
 * Two trees resolved during authoring from fixed placements. The game source
 * stores the chosen asset look, so runtime does not consult a slot list.
 */
export async function placePinnedWood(
  scope: LifetimeScope,
  model3DLoader: Model3DLoader,
  parent: THREE.Object3D,
): Promise<THREE.Group[]> {
  const first = await model3DLoader.load(scope, {
    assetUrl: treeUrl,
    rotationDegrees: { x: 0, y: 0, z: 0 },
    scale: 0.39267,
  });
  first.name = 'tree';
  first.position.set(0, 0, 0);
  parent.add(first);

  const second = await model3DLoader.load(scope, {
    assetUrl: treeUrl,
    rotationDegrees: { x: 0, y: 0, z: 0 },
    scale: 0.39267,
  });
  second.name = 'tree';
  second.position.set(8, 0, 0);
  second.rotateY(Math.PI / 3);
  parent.add(second);

  return [first, second];
}
