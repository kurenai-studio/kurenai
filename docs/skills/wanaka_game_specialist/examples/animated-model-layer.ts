/**
 * Bound-character clips follow latestStep. An upper masked blend layer needs a
 * bone mask and does not clear the base locomotion clip.
 */
import type { Group } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import {
  attachAnimatedModelInstance,
  type AnimatedModel,
} from 'wanaka-studio-engine/animated-model';
import { CharacterController } from 'wanaka-studio-engine/character';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';

export async function attachLayeredCharacter(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  source: Group,
): Promise<{ readonly model: AnimatedModel; readonly character: CharacterController }> {
  const physics = await PhysicsWorld.create(scope, scheduler, {
    gravity: { x: 0, y: -9.81, z: 0 },
  });
  physics.createBody(scope, {
    motion: 'static',
    shape: { kind: 'box', halfExtents: { x: 8, y: 0.1, z: 8 } },
    position: { x: 0, y: -0.1, z: 0 },
  });
  const model = attachAnimatedModelInstance(scope, scheduler, source);
  source.name = 'Player';
  const character = CharacterController.createAndBind(scope, physics, {
    radius: 0.4,
    halfHeight: 0.55,
    model,
  });
  if (model.clipNames.includes('idle')) {
    model.setLayer('upper', {
      clip: 'idle',
      mask: { include: ['spine', 'neck', 'head', 'arm', 'shoulder'] },
    });
  }
  return { model, character };
}
