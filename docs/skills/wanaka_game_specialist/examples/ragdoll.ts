/**
 * Jolt ragdoll whose rigid bodies drive root-level Object3D physics proxies.
 * Each proxy needs identity auto-TRS ancestors with unit world scale; project
 * the proxy pose onto an animated skeleton separately. Adjacent capsules must
 * not overlap — joints do not disable parent/child collision.
 *
 * `startAsleep: true` keeps the bind stable. Call `wake()` when a hit or
 * collapse should start simulation; `sleep()` parks the bodies again.
 * `ragdoll` requires a real value import of `physics` somewhere in the
 * project. `import type { PhysicsWorld }` is erased and will not register it.
 * The caller parents and owns each proxy; `Ragdoll.createAndBind` only
 * synchronizes the supplied bone presentations.
 */
import type { Object3D } from 'three/webgpu';
import { Ragdoll } from 'wanaka-studio-engine/ragdoll';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';
import type { LifetimeScope } from 'wanaka-studio-engine';

export function attachHumanoidRagdoll(
  scope: LifetimeScope,
  world: PhysicsWorld,
  proxies: { readonly pelvis: Object3D; readonly chest: Object3D; readonly head: Object3D },
): Ragdoll {
  const doll = Ragdoll.createAndBind(scope, world, {
    bones: [
      {
        name: 'pelvis',
        position: { x: 0, y: 0.85, z: 0 },
        halfHeight: 0.1,
        radius: 0.14,
        object: proxies.pelvis,
      },
      {
        name: 'chest',
        position: { x: 0, y: 1.4, z: 0 },
        halfHeight: 0.12,
        radius: 0.14,
        object: proxies.chest,
      },
      {
        name: 'head',
        position: { x: 0, y: 1.92, z: 0 },
        halfHeight: 0.06,
        radius: 0.11,
        object: proxies.head,
      },
    ],
    joints: [
      {
        parent: 'pelvis',
        child: 'chest',
        anchor: { x: 0, y: 1.12, z: 0 },
        limits: {
          normalHalfConeAngle: 0.5,
          planeHalfConeAngle: 0.5,
          twistMinAngle: -0.3,
          twistMaxAngle: 0.3,
        },
      },
      {
        parent: 'chest',
        child: 'head',
        anchor: { x: 0, y: 1.7, z: 0 },
        limits: {
          normalHalfConeAngle: 0.7,
          planeHalfConeAngle: 0.4,
          twistMinAngle: -0.4,
          twistMaxAngle: 0.4,
        },
      },
    ],
    startAsleep: true,
  });
  return doll;
}

export function collapseHumanoidRagdoll(ragdoll: Ragdoll): void {
  ragdoll.wake();
}
