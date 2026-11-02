import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Raycaster,
  Vector3,
  type Object3D,
} from 'three/webgpu';
import type { SceneContext } from 'wanaka-studio-engine/scene';
import { useVfx, type VfxHandle, type Vec3 } from 'wanaka-studio-engine/vfx';
import {
  barrierFieldGeometry,
  barrierFieldOrigin,
  createBarrierField,
  createBarrierBreak,
  barrierFieldSurfacePoint,
  barrierHitParams,
  barrierCollapseParams,
  barrierHitSlots,
} from './vfx/shield.js';

export const copiedBarrierDuration = 6.5;
const shield = createBarrierField('game.player-barrier', { duration: copiedBarrierDuration });
const breakBurst = createBarrierBreak('game.barrier-break');

/** One copied shield play; game code owns collision, health and the active window. */
export interface CopiedBarrier {
  readonly handle: VfxHandle;
  readonly fragments: VfxHandle | undefined;
  raycast(
    origin: Vec3,
    direction: Vec3,
    maxDistance: number,
  ): { point: Vec3; uv: readonly [number, number] } | undefined;
  cancel(): void;
  hit(uv: readonly [number, number], elapsedSeconds: number): boolean;
  setIntegrity(fraction: number): boolean;
  collapse(uv: readonly [number, number], elapsedSeconds: number, outward?: Vec3): boolean;
}

/** Prepare once, then cast up to four shields at game-owned anchors. */
export async function prepareCopiedBarrier(
  context: SceneContext,
): Promise<(anchor: Object3D) => CopiedBarrier> {
  const vfx = useVfx(context);
  await vfx.prepare(shield, { instances: 4 });
  await vfx.prepare(breakBurst, { instances: 8 });
  const data = barrierFieldGeometry();
  const geometry = context.scope.own(new BufferGeometry());
  geometry.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(data.uvs, 2));
  geometry.setIndex(data.indices);
  const material = context.scope.own(new MeshBasicMaterial({ side: DoubleSide }));
  return (anchor) => {
    const handle = vfx.play(shield, { parent: anchor });
    let serial = 0;
    let collapsed = false;
    let cancelled = false;
    // Query-only mesh: never added to the scene, so it has no draw or depth footprint.
    const receiver = new Mesh(geometry, material);
    receiver.position.fromArray(barrierFieldOrigin);
    receiver.updateMatrix();
    const ray = new Raycaster();
    let fragments: VfxHandle | undefined;
    const write = (params: Readonly<Record<string, number | Vec3>>): void => {
      if (handle.state !== 'playing' && handle.state !== 'preparing') return;
      for (const [name, value] of Object.entries(params)) handle.setParam(name, value);
    };
    return {
      handle,
      get fragments() {
        return fragments;
      },
      raycast(origin, direction, maxDistance) {
        if (cancelled || collapsed) return undefined;
        const axis = new Vector3(...direction);
        if (
          !origin.every(Number.isFinite) ||
          !direction.every(Number.isFinite) ||
          axis.lengthSq() < 1e-8 ||
          !Number.isFinite(maxDistance) ||
          maxDistance <= 0
        )
          throw new Error(
            'Barrier ray needs finite coordinates, a nonzero direction and a positive finite reach.',
          );
        anchor.updateWorldMatrix(true, false);
        receiver.matrixWorld.multiplyMatrices(anchor.matrixWorld, receiver.matrix);
        ray.set(new Vector3(...origin), axis.normalize());
        ray.far = maxDistance;
        const contact = ray.intersectObject(receiver, false)[0];
        if (!contact?.uv) return undefined;
        const uv = [contact.uv.x, contact.uv.y] as const;
        if (barrierHitParams(0, uv, 0) === undefined) return undefined;
        return { point: contact.point.toArray(), uv };
      },
      cancel() {
        if (cancelled) return;
        cancelled = true;
        handle.stop({ immediate: true });
        fragments?.stop({ immediate: true });
      },
      hit(uv, elapsedSeconds) {
        if (cancelled || collapsed) return false;
        const params = barrierHitParams(serial, uv, elapsedSeconds);
        if (params === undefined) return false;
        serial += 1;
        write(params);
        return true;
      },
      setIntegrity(fraction) {
        if (!Number.isFinite(fraction) || fraction <= 0 || fraction > 1)
          throw new Error(
            'Barrier integrity must be greater than zero and at most one; use collapse at zero.',
          );
        if (cancelled || collapsed) return false;
        if (fraction === 1)
          for (let slot = 0; slot < barrierHitSlots; slot++) write({ [`hitAt${slot}`]: -10 });
        write({ integrity: fraction });
        return true;
      },
      collapse(uv, elapsedSeconds, outward) {
        if (cancelled || collapsed) return false;
        const params = barrierCollapseParams(uv, elapsedSeconds);
        if (params === undefined) return false;
        const point = anchor.localToWorld(new Vector3(...barrierFieldSurfacePoint(uv)));
        const rotation = anchor.getWorldQuaternion(new Quaternion());
        if (outward) {
          const normal = new Vector3(...outward);
          if (!outward.every(Number.isFinite) || normal.lengthSq() < 1e-8)
            throw new Error('Barrier release normal must be finite and nonzero.');
          rotation.setFromUnitVectors(new Vector3(0, 0, 1), normal.normalize());
        }
        write(params);
        collapsed = true;
        fragments = vfx.play(breakBurst, {
          position: [point.x, point.y, point.z],
          rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
        });
        return true;
      },
    };
  };
}
