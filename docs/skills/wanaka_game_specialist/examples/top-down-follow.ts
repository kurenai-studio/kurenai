/**
 * Default elevated XZ follow without mouse look. Copies a rigid world
 * offset of the followed presentation pose, then lookAt that same pose.
 * Do not lerp the camera then lookAt a less-lagged target: leftover-frame
 * lag becomes yaw, worst while the actor strafes.
 *
 * Optional `getAimLead` is a constant planar offset of that same look-point.
 * Pan lag, facing look-ahead, and cursor look-ahead live in
 * [top-down-follow-advanced.ts](./top-down-follow-advanced.ts) when movement
 * versus aim needs them.
 *
 * Write pose in `preRender`. The camera MUST be scene-rooted so
 * `camera.position` is world space.
 */
import { Vector3, type PerspectiveCamera } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

export const DEFAULT_OFFSET = { x: 0, y: 16, z: 11 } as const;
export const DEFAULT_LOOK_HEIGHT = 1;
const ZERO_LEAD = { x: 0, z: 0 } as const;

export interface FollowTarget {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface PlanarLead {
  readonly x: number;
  readonly z: number;
}

/** Rigid boom: camera at look-point plus offset, lookAt that same look-point. */
export function writeTopDownFollowPose(
  camera: PerspectiveCamera,
  lookTarget: Vector3,
  target: FollowTarget,
  offset: FollowTarget,
  lookHeight: number,
  lead: PlanarLead = ZERO_LEAD,
): void {
  lookTarget.set(target.x + lead.x, target.y + lookHeight, target.z + lead.z);
  camera.position.set(
    target.x + offset.x + lead.x,
    target.y + offset.y,
    target.z + offset.z + lead.z,
  );
  camera.lookAt(lookTarget);
}

export function attachTopDownFollow(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: PerspectiveCamera,
  getTarget: () => FollowTarget,
  options?: {
    readonly offset?: FollowTarget;
    readonly lookHeight?: number;
    readonly getAimLead?: () => PlanarLead;
  },
): void {
  const lookHeight = options?.lookHeight ?? DEFAULT_LOOK_HEIGHT;
  const lookTarget = new Vector3();

  scope.defer(
    scheduler.on('preRender', () => {
      const target = getTarget();
      const offset = options?.offset ?? DEFAULT_OFFSET;
      writeTopDownFollowPose(
        camera,
        lookTarget,
        target,
        offset,
        lookHeight,
        options?.getAimLead?.() ?? ZERO_LEAD,
      );
    }),
  );
}
