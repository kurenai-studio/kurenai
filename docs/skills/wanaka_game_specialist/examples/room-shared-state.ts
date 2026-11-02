/**
 * Room shared state in the simulate/play split: `declareRoom` is what a
 * multiplayer project's own `simulate.ts` exports — declarations, actions,
 * and rules against the full room — and the play-side reader below consumes
 * the same declarations through the narrowed client facet play receives.
 *
 * Every peer runs `declareRoom`, including a solo room's roster of one and
 * the room's headless authority, so nothing in it asks who is host,
 * authority, or spectator — and nothing in it reads input or touches the
 * scene. Shared writes happen inside an action handler or `onTick`;
 * `presentations` carries the transient render-only signals that must never
 * enter shared state.
 *
 * `defineEntity` declares the anchor a `room.entities(...)` call must be
 * given. The engine's entity projection creates one scene object per record,
 * parents it under the room's scene, and writes the record's own `x`/`y`/`z`
 * back onto its `root.position` — so `create` builds the object and never
 * parents or positions it itself.
 */
import * as THREE from 'three/webgpu';

import type { Room, SimClientHandles } from '@wanaka/multiplayer-runtime';
import { defineEntity } from 'wanaka-studio-engine/room';
import type {
  RoomPlatformBridge,
  RoomViewPlatformBridge,
} from 'wanaka-studio-engine/play-host-room';
import type { SimulateSceneContext } from 'wanaka-studio-engine/game';
import { scenes } from './scenes.js';

/** The branded player-id type, reached through the room facade itself. A
 * field that identifies a player must be typed with it. */
type PlayerId = Room['me'];

/** One record's replicated fields. `x`/`y`/`z` are the three the entity
 * projection reads; every other field is ordinary shared state. */
interface PickupFields {
  x: number;
  y: number;
  z: number;
  takenBy: PlayerId | null;
}

/** Declared once, at module scope. The handle — not its name string, and not
 * an inline object — is what `room.entities(...)` must receive. */
const Pickup = defineEntity({
  name: 'pickup',
  create: (scope) => {
    const root = new THREE.Mesh(
      scope.own(new THREE.SphereGeometry(0.25)),
      scope.own(new THREE.MeshStandardMaterial({ color: 0xffd166 })),
    );
    root.castShadow = true;
    root.receiveShadow = true;
    return { root };
  },
});

/**
 * The simulate module's declaration entry. The inferred return type is
 * deliberate: play derives its narrowed view from it (`PickupSim` below), so
 * the declarations have no second source of truth. Members beyond
 * `state`/`actions` — here `myScore` — ride the handles to play unchanged.
 */
export async function declareRoom(
  context: SimulateSceneContext<typeof scenes>,
  platform: RoomPlatformBridge,
) {
  const room = platform.room;
  let myScore = 0;

  // Render-only signals: every peer runs the handler, and a peer reacts
  // locally by comparing against room.me rather than asking for a role.
  const effects = room.presentations<{ collected: { by: PlayerId } }>({
    collected: ({ by }) => {
      if (by === room.me) myScore += 1;
    },
  });

  const state = room.state({
    pickups: room.entities(Pickup, { schema: room.sharedFields<PickupFields>() }),
    round: 0,
  });

  // `by` is supplied by the runtime, never by the caller: the returned call
  // surface drops it, so play invokes this as `sim.actions.take(key)`.
  const actions = room.actions({
    take: (by: PlayerId, key: string): void => {
      const record = state.pickups.get(key);
      if (!record || record.takenBy !== null) return;
      record.takenBy = by;
      effects.emit('collected', { by });
      state.pickups.despawn(key);
    },
  });

  room.onTick(() => {
    // room.tick is the clock every peer agrees on; a wall clock is not.
    if (state.pickups.keys().length > 0) return;
    state.round += 1;
    for (let index = 0; index < 4; index += 1) {
      const x = index * 2 - 3;
      state.pickups.spawn({
        fields: { x, y: 0.5, z: 0, takenBy: null },
        pose: { x, y: 0.5, z: 0 },
      });
    }
  });

  return { state, actions, myScore: (): number => myScore };
}

/** The narrowed client projection of this game's own simulate handles — the
 * exact type play's `activateGame` receives as its third parameter. */
type PickupSim = SimClientHandles<Awaited<ReturnType<typeof declareRoom>>>;

/**
 * The play side of the same game: reads through the read-only views, and
 * dispatches the already-declared action. `sim.state.pickups` carries no
 * `spawn`/`despawn`/`setFields`, and `platform.room` no declaration members,
 * so play cannot corrupt the room every peer already agreed on — a write
 * here is a compile error, not a runtime rejection.
 */
export function collectNearbyPickups(
  platform: RoomViewPlatformBridge,
  sim: PickupSim,
  isNear: (position: { x: number; y: number; z: number }) => boolean,
): { me: PlayerId; round: number; myScore: number } {
  for (const { key, fields } of sim.state.pickups.all()) {
    if (fields.takenBy === null && isNear(fields)) sim.actions.take(key);
  }
  return { me: platform.room.me, round: sim.state.round, myScore: sim.myScore() };
}
