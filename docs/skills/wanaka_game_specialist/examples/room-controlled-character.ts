/**
 * Controlled character motion in a room, split across the simulate/play
 * boundary: the simulate module declares the collection, its motion, its
 * rules, and the physics world; play claims a runner and feeds THIS
 * machine's input through the narrowed view's `controls()`.
 *
 * `defineCharacterEntity` is `defineEntity`'s physics-backed counterpart —
 * its `create` must return a real `CharacterController` as `body`, and its
 * handle is tagged so that `controlled(handle, { by, as: 'character' })`
 * type-checks only against a matching declaration. `by` names the record
 * field holding the controlling player's id, which must be typed with the
 * room's own player-id type.
 *
 * `controls()` is the one declaration-shaped member that belongs to play: it
 * reads this machine's own devices, once per room tick, only for the entities
 * this peer controls — the simulate module runs identically on every peer,
 * and the room's authority has no keyboard. Nothing is sent by hand — the
 * resulting motion reaches the other peers on its own, and the engine
 * replays or interpolates it there.
 *
 * `as: 'vehicle'` is a declared adapter with no engine controller behind it
 * yet: it type-checks and throws the moment `controlled(...)` is called.
 */
import * as THREE from 'three/webgpu';

import type { Room, SimClientHandles } from '@wanaka/multiplayer-runtime';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import { attachAnimatedModelInstance } from 'wanaka-studio-engine/animated-model';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import { CharacterController } from 'wanaka-studio-engine/character';
import { WANAKA_DEFAULT_CHARACTER } from 'wanaka-studio-engine/default-character';
import type { SimulateSceneContext } from 'wanaka-studio-engine/game';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';
import type {
  RoomPlatformBridge,
  RoomViewPlatformBridge,
} from 'wanaka-studio-engine/play-host-room';
import {
  controlled,
  defineCharacterEntity,
  type CharacterCommand,
} from 'wanaka-studio-engine/room';
import type { SceneContextForCatalog } from 'wanaka-studio-engine/scene';
import { loadWanakaDefaultCharacter } from './scenes/default-character.js';
import type { scenes } from './scenes.js';

type PlayerId = Room['me'];

interface RunnerFields {
  driver: PlayerId | null;
  laps: number;
}

const RUNNER_RADIUS = 0.35;
const RUNNER_HALF_HEIGHT = 0.5;

/**
 * `ctx.world` is the physics world the controller attaches inside, and
 * `ctx.spawnPose` is the fixed placement the record was spawned with. The
 * engine builds that ctx from the simulate module's own `createPhysicsWorld`
 * below — a physics-backed entity type therefore requires exporting one.
 */
const Runner = defineCharacterEntity({
  name: 'runner',
  create: (scope, ctx) => {
    if (!ctx.world) {
      throw new Error(
        'Runner entities need a physics world. Export createPhysicsWorld from simulate.ts.',
      );
    }
    const root = new THREE.Group();
    // Entity create is synchronous and cannot load catalog GLBs. Play attaches
    // unspecified appearance through attachDefaultRunnerPresentation.
    const body = CharacterController.createAndBind(scope, ctx.world, {
      radius: RUNNER_RADIUS,
      halfHeight: RUNNER_HALF_HEIGHT,
      position: ctx.spawnPose ?? { x: 0, y: 1, z: 0 },
      object: root,
    });
    return { root, body };
  },
});

/**
 * The simulate module owns the physics world for a `defineGame({ simulate })`
 * game: the engine calls this before room attachment and hands the world to
 * every physics-backed entity's `create` as `ctx.world`.
 */
export async function createPhysicsWorld(
  context: SimulateSceneContext<typeof scenes>,
): Promise<PhysicsWorld> {
  return PhysicsWorld.create(context.scope, context.session.scheduler, {
    gravity: { x: 0, y: -9.81, z: 0 },
  });
}

/**
 * Declarations only: the collection, its controlled motion, the shared rule,
 * and the claim action. No input is read here — a runner's occupant feeds
 * commands from play, through the narrowed view this module's inferred
 * return type gives it.
 */
export async function declareRoom(
  context: SimulateSceneContext<typeof scenes>,
  platform: RoomPlatformBridge,
) {
  const room = platform.room;

  const state = room.state({
    runners: room.entities(Runner, {
      schema: room.sharedFields<RunnerFields>(),
      motion: controlled(Runner, { by: 'driver', as: 'character' }),
    }),
  });

  // Shared simulation over the same records, run once for the room and
  // delivered to every peer as a delta.
  state.runners.rules({
    onTick: (entity) => {
      if (entity.object.position.z > 10) entity.fields.laps += 1;
    },
  });

  const actions = room.actions({
    join: (by: PlayerId): void => {
      state.runners.spawn({ fields: { driver: by, laps: 0 }, pose: { x: 0, y: 1, z: 0 } });
    },
  });

  return { state, actions };
}

/** Play-only visual. Entity `create` cannot await a catalog GLB or bind
 * `{ model }`. Parent the GLB as a scene sibling of the collision object and
 * copy pose in `preRender`: `{ object }` writes the capsule bottom and the GLB
 * root is the feet. Mixer infers only grounded idle/run from the model's XZ;
 * jump and fall require `{ model }`. */
export async function attachDefaultRunnerPresentation(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  model3DLoader: Model3DLoader,
  scene: THREE.Object3D,
  entityRoot: THREE.Object3D,
  name: string,
): Promise<void> {
  const model = await loadWanakaDefaultCharacter(scope, model3DLoader, scene, name);
  attachAnimatedModelInstance(scope, scheduler, model, {
    clipNames: WANAKA_DEFAULT_CHARACTER.clipNames,
  });
  scope.defer(
    scheduler.on('preRender', () => {
      model.position.set(
        entityRoot.position.x,
        entityRoot.position.y,
        entityRoot.position.z,
      );
      model.quaternion.copy(entityRoot.quaternion);
    }),
  );
}

/** The narrowed client projection play receives as `activateGame`'s third
 * parameter. */
type RunnerSim = SimClientHandles<Awaited<ReturnType<typeof declareRoom>>>;

/**
 * The play side: claim a runner, attach unspecified appearance, then register the
 * local input rig. `sim.actions.join()` dispatches the declared claim
 * (idempotent against the records this peer already drives), and
 * `sim.state.runners.controls(...)` runs on every peer, once per room tick, only
 * for the entities this peer controls, with no role check anywhere.
 */
export async function activateRunnerPlay(
  context: SceneContextForCatalog<typeof scenes>,
  platform: RoomViewPlatformBridge,
  sim: RunnerSim,
  readLocalInput: () => CharacterCommand,
): Promise<void> {
  const mine = sim.state.runners
    .all()
    .some((record) => record.fields.driver === platform.room.me);
  if (!mine) sim.actions.join();

  const attached = new WeakSet<THREE.Object3D>();
  const attachPending = (): void => {
    for (const record of sim.state.runners.all()) {
      const root = sim.state.runners.objectFor(record.key);
      if (!root || attached.has(root)) continue;
      attached.add(root);
      void attachDefaultRunnerPresentation(
        context.scope,
        context.session.scheduler,
        context.services.model3DLoader,
        context.managed.scene,
        root,
        record.fields.driver === platform.room.me ? 'Player' : `Runner-${record.key}`,
      );
    }
  };
  attachPending();
  context.scope.defer(context.session.scheduler.on('update', attachPending));

  // This machine's own devices only.
  sim.state.runners.controls(() => readLocalInput());
}
