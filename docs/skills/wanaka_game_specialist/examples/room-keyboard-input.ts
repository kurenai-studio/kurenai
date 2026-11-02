import * as THREE from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import { InputSession } from 'wanaka-studio-engine/input';
import type { CharacterCommand } from 'wanaka-studio-engine/room';

/** Camera-relative WASD/Space commands for a play-side room controls() reader.
 * Pass window, the active camera, and the game's speed in meters per second.
 * The scope owns input; room ticks consume edges independently of input frames. */
export function createRunnerKeyboardInput(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  inputSource: EventTarget,
  camera: THREE.Camera,
  moveSpeedMetersPerSecond: number,
): () => CharacterCommand {
  const input = InputSession.create(scope, scheduler, inputSource);
  const cameraForward = new THREE.Vector3();
  let jumpPending = false;
  let jumpThisFrame = false;
  // Registered after InputSession's latch: room ticks can skip a frame or
  // sample several times before physics. Retain an edge until sampled, and
  // keep that frame's samples consistent so a later tick cannot cancel it.
  scope.defer(
    scheduler.on('frameBegin', () => {
      jumpPending ||= input.frame.wasPressed('Space');
      jumpThisFrame = false;
    }),
  );
  return (): CharacterCommand => {
    camera.getWorldDirection(cameraForward);
    const planarLength = Math.hypot(cameraForward.x, cameraForward.z);
    const fx = planarLength > 1e-6 ? cameraForward.x / planarLength : 0;
    const fz = planarLength > 1e-6 ? cameraForward.z / planarLength : -1;
    const forward = input.frame.axis('KeyS', 'KeyW');
    const strafe = input.frame.axis('KeyA', 'KeyD');
    const speed = moveSpeedMetersPerSecond / Math.max(1, Math.hypot(strafe, forward));
    jumpThisFrame ||= jumpPending;
    jumpPending = false;
    return {
      moveX: (fx * forward - fz * strafe) * speed,
      moveZ: (fz * forward + fx * strafe) * speed,
      jump: jumpThisFrame,
      lookYawDeg: THREE.MathUtils.radToDeg(Math.atan2(fx, fz)),
    };
  };
}
