/** Navigation waypoint to CharacterController handoff.
 * NavigationMesh owns connectivity and the project owns the current path;
 * CharacterController remains the only motion-root writer for the NPC.
 * Submit the returned intent once per fixed step from `fixedInput` or
 * `fixedUpdate`.
 */
import {
  type CharacterController,
  type CharacterControlReceipt,
} from 'wanaka-studio-engine/character';
import type { NavigationPathResult } from 'wanaka-studio-engine/navigation';

const ARRIVAL_DISTANCE = 0.35;

function nextWaypoint(
  path: NavigationPathResult,
  current: { readonly x: number; readonly z: number },
): { readonly x: number; readonly z: number } | undefined {
  if (path.status !== 'complete') return undefined;
  for (const point of path.points) {
    if (Math.hypot(point.x - current.x, point.z - current.z) > ARRIVAL_DISTANCE) {
      return point;
    }
  }
  return undefined;
}

export function submitCharacterWaypoint(
  character: CharacterController,
  current: { readonly x: number; readonly z: number },
  path: NavigationPathResult,
  speed: number,
): CharacterControlReceipt {
  const waypoint = nextWaypoint(path, current);
  if (!waypoint) {
    return character.control({
      movement: { kind: 'world', velocity: { x: 0, z: 0 } },
      facing: { kind: 'preserve' },
    });
  }

  const deltaX = waypoint.x - current.x;
  const deltaZ = waypoint.z - current.z;
  const distance = Math.hypot(deltaX, deltaZ);
  const velocity = { x: (deltaX / distance) * speed, z: (deltaZ / distance) * speed };
  return character.control({
    movement: { kind: 'world', velocity },
    facing: {
      kind: 'forward',
      forward: { x: deltaX, z: deltaZ },
      smoothingHalfLife: 0.08,
    },
  });
}
