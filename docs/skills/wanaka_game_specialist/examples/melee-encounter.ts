/** Resolved, fresh model instances enter here; asset loading and the gameplay camera stay with the scene. */
import { Vector3, type AnimationClip, type Object3D } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import type { FixedInputConsumer } from 'wanaka-studio-engine/input';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';
import type { CombatRecipe } from 'wanaka-studio-engine/combat-recipe';
import {
  CombatArena,
  createMeleeMotionPack,
  createMeleeProbes,
  createCombatCharacterMotor,
  type CombatActor,
  type CombatActorSnapshot,
  type CombatImpactEvent,
  type CombatRigMap,
  type CombatPoint,
} from 'wanaka-studio-engine/melee-combat';

export interface MeleeAsset {
  readonly id: string;
  /** Feet-origin, meter-scaled semantic root; local +Z is forward. No other animation mixer owns it. */
  readonly root: Object3D;
  readonly rig: CombatRigMap;
  readonly clips: readonly AnimationClip[];
  readonly recipe: CombatRecipe;
  /** Actual mounted geometry below the mapped right hand, not an unrelated inventory object. */
  readonly weapon?: Object3D;
  readonly idleClip: string;
  readonly runClip: string;
  readonly feet: CombatPoint;
  readonly yaw: number;
  readonly radius: number;
  readonly halfHeight: number;
}
export interface MeleeEncounterOptions {
  readonly scope: LifetimeScope;
  readonly scheduler: PhaseScheduler;
  readonly world: PhysicsWorld;
  readonly input: FixedInputConsumer;
  readonly player: MeleeAsset;
  readonly enemies: readonly MeleeAsset[];
  /** Read the current camera's horizontal forward vector, without installing a second camera writer. */
  readonly viewForward: () => CombatPoint;
  readonly publish: (actors: readonly CombatActorSnapshot[], impacts: readonly CombatImpactEvent[]) => void;
  readonly onResult: (result: 'victory' | 'defeat') => void;
}

/** Use only when the scene has not already created its PhysicsWorld and matching floor collider. */
export async function createMeleeArenaWorld(scope: LifetimeScope, scheduler: PhaseScheduler) {
  const world = await PhysicsWorld.create(scope, scheduler);
  world.createBody(scope, { motion: 'static', shape: { kind: 'box', halfExtents: { x: 20, y: 0.1, z: 20 } }, position: { x: 0, y: -0.1, z: 0 } });
  return world;
}

/** A complete encounter transaction: input, shared enemy rules, result once, and scope-based retry cleanup. */
export function startMeleeEncounter(options: MeleeEncounterOptions) {
  const scope = options.scope.child('melee-encounter');
  let player: CombatActor | undefined;
  let settled = false;
  try {
    // Register before the arena so this step's input reaches the same step's action transaction.
    scope.defer(options.scheduler.on('fixedUpdate', () => {
      if (!player || settled) return;
      const forward = new Vector3(...options.viewForward()); forward.y = 0; forward.normalize();
      const right = new Vector3(forward.z, 0, -forward.x);
      const movement = forward.multiplyScalar(options.input.axis('KeyS', 'KeyW')).add(right.multiplyScalar(options.input.axis('KeyA', 'KeyD')));
      if (movement.lengthSq() > 0) player.face(Math.atan2(movement.x, movement.z));
      player.move(movement.normalize().multiplyScalar(3.5).toArray());
      if (options.input.wasPressed('KeyJ') || options.input.wasPointerPressed(1)) player.request('light');
      if (options.input.wasPressed('KeyK') || options.input.wasPointerPressed(2)) player.request('heavy');
      if (options.input.wasPressed('Space')) player.request('dodge');
      if (options.input.isDown('KeyL') && player.snapshot().action === null) player.request('guard', 0);
    }));
    const arena = new CombatArena(scope, options.scheduler, options.world);
    const add = (asset: MeleeAsset, enemy: boolean, index: number) => {
      const pack = createMeleeMotionPack(asset.root, asset.rig, asset.recipe.mode, asset.recipe);
      const probes = createMeleeProbes(asset.root, asset.rig, asset.weapon);
      const motor = createCombatCharacterMotor(scope, options.world, asset.root, { feet: asset.feet, yaw: asset.yaw, radius: asset.radius, halfHeight: asset.halfHeight });
      return arena.addActor({ id: asset.id, team: enemy ? 'enemies' : 'player', root: asset.root, rig: asset.rig, motor, recipe: pack.recipe, clips: [...asset.clips.filter((clip) => !pack.clips.some((motion) => motion.name === clip.name)), ...pack.clips], probes, idleClip: asset.idleClip, runClip: asset.runClip, ...(enemy ? { ai: { seed: index + 17, speed: 2.6, reach: asset.recipe.mode === 'unarmed' ? 1 : 1.5, leash: 12 } } : {}) });
    };
    player = add(options.player, false, 0);
    const enemies = options.enemies.map((asset, index) => add(asset, true, index));
    scope.defer(options.scheduler.on('postPhysics', () => {
      const actors = arena.snapshot();
      options.publish(actors, arena.drainEvents());
      if (settled || !player) return;
      const defeated = player.snapshot().health === 0;
      const victory = enemies.length > 0 && enemies.every((enemy) => enemy.snapshot().health === 0);
      if (defeated || victory) { settled = true; player.move([0, 0, 0]); options.onResult(defeated ? 'defeat' : 'victory'); }
    }));
    return { arena, player, enemies, dispose: () => scope.dispose() };
  } catch (error) { scope.dispose(); throw error; }
}
