/**
 * First-person look. yaw/pitch are the camera (or yaw/pitch pivot)
 * orientation, not orbit position angles. Captured pointer deltas use
 * `yaw -= deltaX` and `pitch -= deltaY`. Over-shoulder writes the same
 * signs on those pivots. Do not copy these lines onto an orbit camera.
 *
 * Consume deltas only while `pointer.captured` is true.
 */
import { MathUtils, type Object3D } from 'three/webgpu';
import type { InputSession } from 'wanaka-studio-engine/input';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

const PITCH_LIMIT = Math.PI / 2 - 0.01;

export function attachFirstPersonLook(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  input: InputSession,
  head: Object3D,
  sensitivity = 0.0022,
): void {
  // One authoritative orientation. Never mirror it onto a second object.
  head.rotation.order = 'YXZ';
  let yaw = head.rotation.y;
  let pitch = head.rotation.x;

  // Pointer deltas are latched once per rendered frame. Consuming them in
  // every `fixedInput` step repeats the same delta on multi-step frames and
  // drops it on frames with zero fixed steps (high-refresh displays).
  scope.defer(
    scheduler.on('update', () => {
      const { pointer } = input.frame.snapshot;
      if (!pointer.captured) {
        return;
      }
      yaw -= pointer.deltaX * sensitivity;
      pitch = MathUtils.clamp(pitch - pointer.deltaY * sensitivity, -PITCH_LIMIT, PITCH_LIMIT);
      head.rotation.set(pitch, yaw, 0);
    }),
  );
}
