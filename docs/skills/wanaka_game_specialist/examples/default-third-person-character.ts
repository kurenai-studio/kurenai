/** Play-side starter when the brief does not name a character appearance. */
import * as THREE from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import { WANAKA_DEFAULT_CHARACTER } from 'wanaka-studio-engine/default-character';
import { loadWanakaDefaultCharacter } from './scenes/default-character.js';
import {
  attachThirdPersonCharacter,
  type ThirdPersonCharacter,
} from './third-person-character.js';

export async function attachDefaultThirdPersonCharacter(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  scene: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  inputSource: EventTarget,
  model3DLoader: Model3DLoader,
): Promise<ThirdPersonCharacter> {
  const source = await loadWanakaDefaultCharacter(scope, model3DLoader, scene, 'Player');
  return attachThirdPersonCharacter(scope, scheduler, source, camera, inputSource, {
    clipNames: WANAKA_DEFAULT_CHARACTER.clipNames,
  });
}
