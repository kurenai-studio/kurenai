/**
 * Physics world, static floor, dynamic crate, contact identity, and a
 * weld. Dynamic presentation is interpolated onto the bound object in
 * `preRender`; gameplay in `postPhysics` must read `body.position`.
 * Joints lock the relative pose at attach time and do not disable
 * collision between the two bodies.
 * The caller adds each presentation object to `scene`.
 * `createAndBindBody` only synchronizes the supplied object.
 * `pickCrate` attributes this playground crate through `hit.body`.
 * Do not copy it as a shooter.
 */
import * as THREE from 'three/webgpu';

import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import { FixedJoint } from 'wanaka-studio-engine/constraints';
import { applySurfaceMaterial } from 'wanaka-studio-engine/default-surface';
import { PhysicsWorld, type RigidBody, type Vector3Like } from 'wanaka-studio-engine/physics';
import floorBaseColorUrl from '#project/assets/catalog/046160b7-f67d-49ac-896f-f2d96be1d490/surface-dirt.jpg';
import floorNormalUrl from '#project/assets/catalog/046160b7-f67d-49ac-896f-f2d96be1d490/surface-dirt-normal.jpg';
import floorRoughnessUrl from '#project/assets/catalog/046160b7-f67d-49ac-896f-f2d96be1d490/surface-dirt-roughness.jpg';
import crateUrl from '#project/assets/catalog/6ae1e529-09b7-2869-adbe-8055b70dd012/crate.glb';
import crateStackUrl from '#project/assets/catalog/0c1e032e-73df-a7e8-9c04-54b05dd6169c/crate.glb';

export interface PhysicsPlayground {
  readonly physics: PhysicsWorld;
  readonly floor: RigidBody;
  readonly crate: RigidBody;
  readonly hasLanded: () => boolean;
}

const CRATE_HALF = 0.5;

async function addCrate(
  scope: LifetimeScope,
  scene: THREE.Scene,
  physics: PhysicsWorld,
  model3DLoader: Model3DLoader,
  name: string,
  position: { x: number; y: number; z: number },
  look: {
    readonly assetUrl: string;
    readonly rotationDegrees: { readonly x: number; readonly y: number; readonly z: number };
    readonly scale: number;
  },
): Promise<RigidBody> {
  const object = await model3DLoader.load(scope, look);
  object.name = name;
  scene.add(object);
  scope.defer(() => object.removeFromParent());
  return physics.createAndBindBody(scope, {
    motion: 'dynamic',
    object,
    shape: { kind: 'box', halfExtents: { x: CRATE_HALF, y: CRATE_HALF, z: CRATE_HALF } },
    position,
    friction: 0.6,
    restitution: 0.2,
  });
}

/** True when the closest remaining hit is this crate's body. */
export function pickCrate(
  physics: PhysicsWorld,
  crate: RigidBody,
  origin: Vector3Like,
  direction: Vector3Like,
  ignore: readonly RigidBody[] = [],
): boolean {
  return physics.castRay(origin, direction, { ignore })?.body === crate;
}

export async function createPhysicsPlayground(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  scene: THREE.Scene,
  model3DLoader: Model3DLoader,
): Promise<PhysicsPlayground> {
  const physics = await PhysicsWorld.create(scope, scheduler, {
    gravity: { x: 0, y: -9.81, z: 0 },
  });

  const floorMesh = new THREE.Mesh(scope.own(new THREE.BoxGeometry(20, 1, 20)));
  floorMesh.name = 'Floor';
  floorMesh.castShadow = true;
  floorMesh.receiveShadow = true;
  floorMesh.position.set(0, -0.5, 0);
  scene.add(floorMesh);
  scope.defer(() => floorMesh.removeFromParent());
  await applySurfaceMaterial(scope, floorMesh, {
    tileSizeUnits: 3.5,
    maps: {
      baseColor: floorBaseColorUrl,
      normal: floorNormalUrl,
      roughness: floorRoughnessUrl,
    },
  });
  const floor = physics.createAndBindBody(scope, {
    motion: 'static',
    object: floorMesh,
    shape: { kind: 'box', halfExtents: { x: 10, y: 0.5, z: 10 } },
    position: { x: 0, y: -0.5, z: 0 },
  });

  const crate = await addCrate(
    scope,
    scene,
    physics,
    model3DLoader,
    'Crate',
    { x: 0, y: 6, z: 0 },
    {
      assetUrl: crateUrl,
      rotationDegrees: { x: 0, y: 0, z: 0 },
      scale: 1.1,
    },
  );
  crate.applyImpulse({ x: 1.5, y: 0, z: 0 });

  let landed = false;
  scope.defer(
    crate.onContactBegin((other) => {
      if (other === floor) landed = true;
    }),
  );
  return { physics, floor, crate, hasLanded: () => landed };
}

export async function weldCratePair(
  scope: LifetimeScope,
  scene: THREE.Scene,
  physics: PhysicsWorld,
  model3DLoader: Model3DLoader,
): Promise<{ readonly joint: FixedJoint; readonly bodies: readonly [RigidBody, RigidBody] }> {
  const left = await addCrate(
    scope,
    scene,
    physics,
    model3DLoader,
    'WeldLeft',
    { x: -0.7, y: 3, z: 0 },
    {
      assetUrl: crateStackUrl,
      rotationDegrees: { x: 0, y: 0, z: 0 },
      scale: 7.2,
    },
  );
  const right = await addCrate(
    scope,
    scene,
    physics,
    model3DLoader,
    'WeldRight',
    { x: 0.7, y: 3, z: 0 },
    {
      assetUrl: crateUrl,
      rotationDegrees: { x: 0, y: 0, z: 0 },
      scale: 1.1,
    },
  );
  const joint = FixedJoint.create(scope, physics, { a: left, b: right });
  return { joint, bodies: [left, right] };
}
