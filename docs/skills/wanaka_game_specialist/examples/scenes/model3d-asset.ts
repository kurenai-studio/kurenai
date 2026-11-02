import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import type { Model3DLoader, ModelRotationDegrees } from 'wanaka-studio-engine/assets';
import type { SceneFactory } from 'wanaka-studio-engine/scene';

export interface CharacterModelAsset {
  readonly assetUrl: string;
  readonly rotationDegrees: ModelRotationDegrees;
  readonly recommendedScale: number;
}

export async function createCharacterModel(
  scope: LifetimeScope,
  model3DLoader: Model3DLoader,
  parent: THREE.Object3D,
  name: string,
  asset: CharacterModelAsset,
): Promise<THREE.Group> {
  const model = await model3DLoader.load(scope, {
    // The caller resolves assetUrl using the session-selected asset guide and
    // copies rotationDegrees and recommendedScale from the asset tool result.
    assetUrl: asset.assetUrl,
    rotationDegrees: asset.rotationDegrees,
    scale: asset.recommendedScale,
  });
  model.name = name;
  parent.add(model);
  return model;
}

export const createModelScene = (asset: CharacterModelAsset): SceneFactory => async (scope, renderer, { model3DLoader }) => {
  void renderer;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161c24);
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 200);
  camera.name = 'MainCamera';
  // The camera sits on the +Z side of a +Z-facing model to show its front;
  // camera.lookAt points the camera's local -Z toward the model.
  camera.position.set(0, 1.6, 4);
  camera.lookAt(0, 1, 0);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.name = 'Sun';
  sun.position.set(4, 8, 3);
  const player = await createCharacterModel(scope, model3DLoader, scene, 'Player', asset);
  scene.add(camera);
  scene.add(sun);
  return {
    scene,
    nodes: { camera, sun, player },
    resources: {},
  };
};
