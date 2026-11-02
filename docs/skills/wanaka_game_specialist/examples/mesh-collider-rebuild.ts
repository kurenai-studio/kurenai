/**
 * A collider shape is immutable, so regenerated geometry replaces the body.
 * Own each generation in a child scope: that scope removes exactly this body
 * while leaving the rest of the scene's bodies untouched.
 *
 * An `Object3D` mesh shape is cooked once at the objects' current world
 * transforms, so the hierarchy must already be positioned when the body is
 * created; moving it afterwards does not move the collision geometry.
 * Cooked mesh bodies are static and cannot also set `object`, `position`,
 * or `rotation`.
 *
 * Reach for this rebuild pattern when the source is a live native hierarchy
 * whose transform can change between generations -- that is what `objects`
 * is for. If the triangle data is already plain (procedurally generated, or
 * cooked once and cached), pass `{ kind: 'mesh', vertices, indices }`
 * directly instead: it is the same shape `objects` resolves to, with
 * nothing to rebuild and no native hierarchy to hold onto.
 */
import type { Object3D } from 'three/webgpu';
import type { PhysicsWorld, RigidBody } from 'wanaka-studio-engine/physics';
import type { LifetimeScope } from 'wanaka-studio-engine';

export interface RebuildableMeshCollider {
  /** Discards the previous body and cooks a new one from current transforms. */
  rebuild(): RigidBody;
  current(): RigidBody;
}

export function attachRebuildableMeshCollider(
  scope: LifetimeScope,
  world: PhysicsWorld,
  objects: readonly Object3D[],
): RebuildableMeshCollider {
  let generation: LifetimeScope | undefined;
  let body!: RigidBody;

  const rebuild = (): RigidBody => {
    generation?.dispose();
    generation = scope.child('mesh-collider');
    body = world.createBody(generation, {
      motion: 'static',
      shape: { kind: 'mesh', objects },
    });
    return body;
  };

  rebuild();
  return { rebuild, current: () => body };
}
