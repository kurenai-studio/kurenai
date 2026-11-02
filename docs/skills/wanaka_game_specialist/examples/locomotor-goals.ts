/**
 * Physical characters: one NavigationMesh, one LocomotorWorld, one
 * Locomotor per CharacterController. Goals differ; bootstrap does not.
 * Do not attach NavigationAgent to these characters. Branch on body.status.
 */
import { Box3, Vector3, type Object3D, type Vector3Like } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import { CharacterController } from 'wanaka-studio-engine/character';
import { Locomotor, LocomotorWorld, type PositionLike } from 'wanaka-studio-engine/locomotor';
import { NavigationMesh } from 'wanaka-studio-engine/navigation';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';

export async function attachLocomotorWorld(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
): Promise<{
  readonly physics: PhysicsWorld;
  readonly world: LocomotorWorld;
}> {
  const physics = await PhysicsWorld.create(scope, scheduler, {
    gravity: { x: 0, y: -9.81, z: 0 },
  });
  physics.createBody(scope, {
    motion: 'static',
    shape: { kind: 'box', halfExtents: { x: 8, y: 0.1, z: 8 } },
    position: { x: 0, y: -0.1, z: 0 },
  });
  const mesh = await NavigationMesh.create(scope, {
    agentRadius: 0.4,
    walkableBoxes: [new Box3(new Vector3(-8, -0.1, -8), new Vector3(8, 0.1, 8))],
    blockedBoxes: [new Box3(new Vector3(-0.6, -0.5, -2), new Vector3(0.6, 1.5, 2))],
  });
  return { physics, world: LocomotorWorld.create(scope, { mesh }) };
}

export function attachWalker(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  physics: PhysicsWorld,
  world: LocomotorWorld,
  walker: Object3D,
): { readonly body: Locomotor; readonly character: CharacterController } {
  const character = CharacterController.createAndBind(scope, physics, {
    radius: 0.4,
    halfHeight: 0.55,
    object: walker,
  });
  const body = Locomotor.create(scope, scheduler, { world, character });
  return { body, character };
}

/** Call from play.ts after each status read. `partial` already walked. */
export function handleLocomotorStatus(body: Locomotor): void {
  if (body.status === 'blocked' || body.status === 'unreachable') {
    body.setGoal({ kind: 'stop' });
  }
}

export function orderGoTo(body: Locomotor, point: Vector3Like, stopAt?: number): void {
  body.setGoal({ kind: 'goTo', point, ...(stopAt === undefined ? {} : { stopAt }) });
}

export function orderChase(body: Locomotor, prey: PositionLike): void {
  body.setGoal({ kind: 'chase', target: prey, stopAt: 2 });
}

/** Companion follow: stops at 3 m, resumes only after 4.5 m. */
export function orderFollow(body: Locomotor, prey: PositionLike): void {
  body.setGoal({ kind: 'follow', target: prey });
}

export function orderHold(body: Locomotor, target: PositionLike): void {
  body.setGoal({ kind: 'hold', target, ring: 7.5, band: 1.2, strafe: true });
}
