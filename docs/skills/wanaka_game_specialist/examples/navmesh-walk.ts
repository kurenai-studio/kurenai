/**
 * LEGACY: leftover for marker objects WITHOUT CharacterController / physics.
 * Physical characters use Locomotor — see locomotor-goals.ts.
 * Recast walk: one NavigationAgent writes one Object3D. Do not also bind
 * that object to a CharacterController or dynamic body. Static blockers
 * belong in `blockedBoxes` so bake runs once. `moveTo` returns a receipt
 * — collapsing it hides why the walker never starts. Disposing the agent
 * teleports the object back to its attach position. Default rotation points
 * the walker's local +Z toward the next waypoint.
 */
import { Box3, Vector3, type Object3D, type Vector3Like } from 'three/webgpu';
import {
  NavigationAgent,
  NavigationMesh,
  type NavigationMoveResult,
} from 'wanaka-studio-engine/navigation';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

export async function attachWalkNav(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  walker: Object3D,
  destination: Vector3Like,
): Promise<{ readonly agent: NavigationAgent; readonly move: NavigationMoveResult }> {
  const mesh = await NavigationMesh.create(scope, {
    agentRadius: 0.3,
    walkableBoxes: [new Box3(new Vector3(-8, -0.1, -8), new Vector3(8, 0.1, 8))],
    blockedBoxes: [new Box3(new Vector3(-0.6, -0.5, -2), new Vector3(0.6, 1.5, 2))],
  });
  const agent = NavigationAgent.create(scope, scheduler, {
    mesh,
    object: walker,
    speed: 4,
  });
  return { agent, move: agent.moveTo(destination) };
}
