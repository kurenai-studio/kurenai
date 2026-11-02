/**
 * Elevated-XZ follow compositions selected from how the player moves and
 * aims. Default remains [top-down-follow.ts](./top-down-follow.ts). Load
 * this file when pan lag, facing look-ahead, or cursor look-ahead applies.
 *
 * Each option still copies a rigid boom of one look-point and lookAts that
 * same point. Do not lerp the camera then lookAt a less-lagged actor, and
 * do not yaw from strafe input.
 */
import { Plane, Raycaster, Vector2, Vector3, type PerspectiveCamera } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

import {
  DEFAULT_LOOK_HEIGHT,
  DEFAULT_OFFSET,
  writeTopDownFollowPose,
  type FollowTarget,
  type PlanarLead,
} from './top-down-follow.js';

const DEFAULT_FOLLOW_RATE = 6;
const DEFAULT_FACE_LEAD = 5;
const DEFAULT_FACE_LEAD_RATE = 3.5;
const DEFAULT_AIM_LEAD_MAX = 3.5;
const DEFAULT_AIM_LEAD_GAIN = 0.18;
const DEFAULT_AIM_LEAD_RATE = 8;

function resolveOffset(offset: FollowTarget | undefined): FollowTarget {
  return offset ?? DEFAULT_OFFSET;
}

/** Last completed pose at alpha 0; leftover extrapolates from current. */
function leftoverAxis(current: number, previous: number, alpha: number): number {
  return current + (current - previous) * alpha;
}

/**
 * Position lag on the simulation pose, leftover-interpolated with the same
 * alpha as other presentation. lookAt the lagged look-point, not the live actor.
 */
export function attachTopDownPanLag(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: PerspectiveCamera,
  getSimTarget: () => FollowTarget,
  options?: {
    readonly offset?: FollowTarget;
    readonly lookHeight?: number;
    readonly followRate?: number;
  },
): void {
  const lookHeight = options?.lookHeight ?? DEFAULT_LOOK_HEIGHT;
  const followRate = options?.followRate ?? DEFAULT_FOLLOW_RATE;
  const lookTarget = new Vector3();
  const follow = { x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0 };
  let snapped = false;

  scope.defer(
    scheduler.on('fixedUpdate', () => {
      const target = getSimTarget();
      follow.px = follow.x;
      follow.py = follow.y;
      follow.pz = follow.z;
      if (!snapped) {
        follow.x = follow.px = target.x;
        follow.y = follow.py = target.y;
        follow.z = follow.pz = target.z;
        snapped = true;
        return;
      }
      const weight = 1 - Math.exp(-followRate * scheduler.fixedDeltaSeconds);
      follow.x += (target.x - follow.x) * weight;
      follow.y += (target.y - follow.y) * weight;
      follow.z += (target.z - follow.z) * weight;
    }),
  );

  scope.defer(
    scheduler.on('preRender', ({ alpha }) => {
      writeTopDownFollowPose(
        camera,
        lookTarget,
        {
          x: leftoverAxis(follow.x, follow.px, alpha),
          y: leftoverAxis(follow.y, follow.py, alpha),
          z: leftoverAxis(follow.z, follow.pz, alpha),
        },
        resolveOffset(options?.offset),
        lookHeight,
      );
    }),
  );
}

/**
 * Planar look-ahead along movement facing. Eases the lead vector; large
 * heading changes catch up more slowly than small ones.
 */
export function attachTopDownFacingLead(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: PerspectiveCamera,
  getTarget: () => FollowTarget,
  getFacingYaw: () => number,
  options?: {
    readonly offset?: FollowTarget;
    readonly lookHeight?: number;
    readonly leadDistance?: number;
    readonly leadRate?: number;
  },
): void {
  const lookHeight = options?.lookHeight ?? DEFAULT_LOOK_HEIGHT;
  const leadDistance = options?.leadDistance ?? DEFAULT_FACE_LEAD;
  const leadRate = options?.leadRate ?? DEFAULT_FACE_LEAD_RATE;
  const lookTarget = new Vector3();
  const lead = { x: 0, z: 0, px: 0, pz: 0 };

  scope.defer(
    scheduler.on('fixedUpdate', () => {
      const yaw = getFacingYaw();
      const desiredX = Math.sin(yaw) * leadDistance;
      const desiredZ = Math.cos(yaw) * leadDistance;
      const err = Math.hypot(desiredX - lead.x, desiredZ - lead.z);
      const rate = leadRate / (1 + err / leadDistance);
      const weight = 1 - Math.exp(-rate * scheduler.fixedDeltaSeconds);
      lead.px = lead.x;
      lead.pz = lead.z;
      lead.x += (desiredX - lead.x) * weight;
      lead.z += (desiredZ - lead.z) * weight;
    }),
  );

  scope.defer(
    scheduler.on('preRender', ({ alpha }) => {
      const planarLead: PlanarLead = {
        x: leftoverAxis(lead.x, lead.px, alpha),
        z: leftoverAxis(lead.z, lead.pz, alpha),
      };
      writeTopDownFollowPose(
        camera,
        lookTarget,
        getTarget(),
        resolveOffset(options?.offset),
        lookHeight,
        planarLead,
      );
    }),
  );
}

/**
 * Planar look-ahead toward a ground aim point. Unproject from the un-led
 * boom; keep gain small; ease the lead. Caller supplies NDC against the
 * render surface.
 */
export function attachTopDownCursorLead(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: PerspectiveCamera,
  getTarget: () => FollowTarget,
  getPointerNdc: () => { readonly x: number; readonly y: number } | null,
  options?: {
    readonly offset?: FollowTarget;
    readonly lookHeight?: number;
    readonly maxLead?: number;
    readonly gain?: number;
    readonly leadRate?: number;
    readonly groundY?: number;
  },
): void {
  const lookHeight = options?.lookHeight ?? DEFAULT_LOOK_HEIGHT;
  const maxLead = options?.maxLead ?? DEFAULT_AIM_LEAD_MAX;
  const gain = options?.gain ?? DEFAULT_AIM_LEAD_GAIN;
  const leadRate = options?.leadRate ?? DEFAULT_AIM_LEAD_RATE;
  const groundY = options?.groundY ?? 0;
  const lookTarget = new Vector3();
  const ndc = new Vector2();
  const raycaster = new Raycaster();
  const groundPlane = new Plane(new Vector3(0, 1, 0), -groundY);
  const groundHit = new Vector3();
  const lead = { x: 0, z: 0 };
  const lastAim = { x: 0, z: 0, hasHit: false };

  scope.defer(
    scheduler.on('preRender', ({ rawDeltaSeconds }) => {
      const target = getTarget();
      const offset = resolveOffset(options?.offset);
      writeTopDownFollowPose(camera, lookTarget, target, offset, lookHeight);
      camera.updateMatrixWorld();
      const pointer = getPointerNdc();
      if (pointer) {
        ndc.set(pointer.x, pointer.y);
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(groundPlane, groundHit)) {
          lastAim.x = groundHit.x;
          lastAim.z = groundHit.z;
          lastAim.hasHit = true;
        }
      }
      let desiredX = 0;
      let desiredZ = 0;
      if (lastAim.hasHit) {
        const dx = lastAim.x - target.x;
        const dz = lastAim.z - target.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          const mag = Math.min(maxLead, dist * gain);
          desiredX = (dx / dist) * mag;
          desiredZ = (dz / dist) * mag;
        }
      }
      const dt = Math.min(0.1, rawDeltaSeconds);
      const weight = 1 - Math.exp(-leadRate * dt);
      lead.x += (desiredX - lead.x) * weight;
      lead.z += (desiredZ - lead.z) * weight;
      writeTopDownFollowPose(camera, lookTarget, target, offset, lookHeight, lead);
    }),
  );
}
