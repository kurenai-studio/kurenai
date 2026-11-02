/**
 * First-person shot writes the eye and keeps the current quaternion.
 * Pair with InputSession for look. Do not also write camera.position.
 */
import type { Camera } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import { CameraRig, type PositionLike } from 'wanaka-studio-engine/camera-rig';

export function attachFirstPersonRig(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: Camera,
  eye: PositionLike,
): CameraRig {
  const rig = CameraRig.create(scope, scheduler, { camera });
  rig.setShot({ kind: 'first-person', eye });
  return rig;
}
