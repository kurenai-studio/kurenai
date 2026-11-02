/** Fixed-step AI output for a CharacterController.
 * The behavior system owns target selection and replanning; this slice only
 * shows the final world-space intent crossing the Character boundary. Call
 * once per fixed step from `fixedInput` or `fixedUpdate`. It never writes
 * the character root or synthesizes keyboard input.
 */
import {
  type CharacterController,
  type CharacterControlReceipt,
} from 'wanaka-studio-engine/character';

export interface CharacterAiIntent {
  readonly current: { readonly x: number; readonly z: number };
  readonly target: { readonly x: number; readonly z: number };
  readonly speed: number;
  readonly jump?: boolean;
  readonly stance?: 'stand' | 'crouch';
}

/** Submit one behavior decision at a fixed-step boundary. */
export function submitCharacterAiIntent(
  character: CharacterController,
  intent: CharacterAiIntent,
): CharacterControlReceipt {
  const deltaX = intent.target.x - intent.current.x;
  const deltaZ = intent.target.z - intent.current.z;
  const distance = Math.hypot(deltaX, deltaZ);
  const velocity =
    distance > 1e-6
      ? { x: (deltaX / distance) * intent.speed, z: (deltaZ / distance) * intent.speed }
      : { x: 0, z: 0 };
  const facing =
    distance > 1e-6
      ? {
          kind: 'forward' as const,
          forward: { x: deltaX, z: deltaZ },
          smoothingHalfLife: 0.08,
        }
      : { kind: 'preserve' as const };

  return character.control({
    movement: { kind: 'world', velocity },
    facing,
    stance: intent.stance,
    jump: intent.jump === true ? 'fixed' : 'none',
  });
}
