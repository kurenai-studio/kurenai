/** Play-side compositor for a model already returned by model3DLoader.load.
 * Unspecified appearance uses default-third-person-character.ts instead.
 * The movement and facing slice is reusable for third-person games. Free-look
 * projects add pointer-lock orbit and obstruction handling from the camera and
 * input guides; shooting is not a prerequisite for mouse look.
 */
import * as THREE from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import {
  attachAnimatedModelInstance,
  type AnimatedModelInstanceOptions,
} from 'wanaka-studio-engine/animated-model';
import { CharacterController } from 'wanaka-studio-engine/character';
import { InputSession } from 'wanaka-studio-engine/input';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';

const MOVE_SPEED = 6;
const CAMERA_OFFSET = new THREE.Vector3(0, 3.2, -7.5);

export interface ThirdPersonCharacter {
  readonly physics: PhysicsWorld;
  readonly character: CharacterController;
  readonly input: InputSession;
}

export async function attachThirdPersonCharacter(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  source: THREE.Group,
  camera: THREE.PerspectiveCamera,
  inputSource: EventTarget,
  animationOptions?: AnimatedModelInstanceOptions,
): Promise<ThirdPersonCharacter> {
  const physics = await PhysicsWorld.create(scope, scheduler, {
    gravity: { x: 0, y: -9.81, z: 0 },
  });

  physics.createBody(scope, {
    motion: 'static',
    shape: { kind: 'box', halfExtents: { x: 20, y: 0.5, z: 20 } },
    position: { x: 0, y: -0.5, z: 0 },
  });

  // Caller supplies clipNames. Unspecified appearance uses default-third-person-character.ts.
  const model = attachAnimatedModelInstance(scope, scheduler, source, animationOptions);
  const character = CharacterController.createAndBind(scope, physics, {
    radius: 0.35,
    halfHeight: 0.55,
    model,
    position: { x: 0, y: 1.1, z: 0 },
  });

  const input = InputSession.create(scope, scheduler, inputSource);
  const fixedInput = input.fixed(scope);
  const cameraForward = new THREE.Vector3();
  scope.defer(
    scheduler.on('fixedInput', () => {
      // Camera returns its viewing -Z in world space.
      // facing: { kind: 'movement' } turns the simulation capsule only.
      camera.getWorldDirection(cameraForward);
      const planarX = cameraForward.x;
      const planarZ = cameraForward.z;
      const planarLength = Math.hypot(planarX, planarZ);
      const fx = planarLength > 1e-6 ? planarX / planarLength : 0;
      const fz = planarLength > 1e-6 ? planarZ / planarLength : -1;
      const forward = fixedInput.axis('KeyS', 'KeyW');
      const strafe = fixedInput.axis('KeyA', 'KeyD');
      character.control({
        movement: {
          kind: 'relative',
          strafe,
          forward,
          speed: MOVE_SPEED,
          relativeTo: { kind: 'view', forward: { x: fx, z: fz } },
        },
        facing: { kind: 'movement', smoothingHalfLife: 0.08 },
        jump: fixedInput.wasPressed('Space') ? 'fixed' : 'none',
      });
    }),
  );
  scope.defer(
    scheduler.on('preRender', () => {
      const feet = character.anchors.feet.position;
      camera.position.set(
        feet.x + CAMERA_OFFSET.x,
        feet.y + CAMERA_OFFSET.y,
        feet.z + CAMERA_OFFSET.z,
      );
      camera.lookAt(feet.x, feet.y + 1.4, feet.z);
    }),
  );

  return { physics, character, input };
}
