/**
 * One CameraRig owns this Camera in preRender. Do not also write
 * camera.position from play.ts. Omit `yaw` to keep world azimuth; pass
 * facing radians (`atan2(x, z)`) to sit behind the character. First-person
 * is camera-rig-first-person.ts.
 */
import type { Camera } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import { CameraRig, type PositionLike } from 'wanaka-studio-engine/camera-rig';
import type { PhysicsWorld } from 'wanaka-studio-engine/physics';

export function attachThirdPersonRig(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: Camera,
  follow: PositionLike,
  physics?: PhysicsWorld,
): CameraRig {
  const rig = CameraRig.create(scope, scheduler, {
    camera,
    ...(physics
      ? { collision: { raycast: physics.castRay.bind(physics) } }
      : {}),
  });
  rig.setShot({ kind: 'third-person', follow, distance: 7.5, height: 2.4 });
  return rig;
}
