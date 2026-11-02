/**
 * Third-person orbit look. yaw/pitch locate the camera around a follow
 * target; the camera then looks at that target. Those angles are position
 * angles, not view Euler, so captured deltas use the opposite signs of
 * first-person-look.ts. This slice is the only pose writer. The camera
 * MUST be scene-rooted so `camera.position` is world space. Do not parent
 * it under a yaw/pitch look rig.
 *
 * Consume deltas in `update`. Write pose in `preRender` so a
 * CharacterController caller can pass leftover-frame presentation.
 */
import { MathUtils, Vector3, type PerspectiveCamera } from 'three/webgpu';
import type { InputSession } from 'wanaka-studio-engine/input';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

const PITCH_MIN = 0.08;
const PITCH_MAX = 1.2;
const DEFAULT_RADIUS = 8;
const DEFAULT_SENSITIVITY = 0.0022;

export interface OrbitLookTarget {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function attachThirdPersonOrbitLook(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  input: InputSession,
  camera: PerspectiveCamera,
  getTarget: () => OrbitLookTarget,
  options?: {
    readonly radius?: number;
    readonly sensitivity?: number;
  },
): void {
  const radius = options?.radius ?? DEFAULT_RADIUS;
  const sensitivity = options?.sensitivity ?? DEFAULT_SENSITIVITY;
  let yaw = 0;
  let pitch = 0.35;
  const offset = new Vector3();
  const lookTarget = new Vector3();

  scope.defer(
    scheduler.on('update', () => {
      const { pointer } = input.frame.snapshot;
      if (!pointer.captured) {
        return;
      }
      yaw += pointer.deltaX * sensitivity;
      pitch = MathUtils.clamp(pitch + pointer.deltaY * sensitivity, PITCH_MIN, PITCH_MAX);
    }),
  );

  scope.defer(
    scheduler.on('preRender', () => {
      const target = getTarget();
      const planar = Math.cos(pitch) * radius;
      offset.set(-Math.sin(yaw) * planar, Math.sin(pitch) * radius, Math.cos(yaw) * planar);
      lookTarget.set(target.x, target.y, target.z);
      camera.position.set(target.x + offset.x, target.y + offset.y, target.z + offset.z);
      camera.lookAt(lookTarget);
    }),
  );
}
