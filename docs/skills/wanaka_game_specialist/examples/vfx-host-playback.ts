import type { SceneContext } from 'wanaka-studio-engine/scene';
import { useVfx, type VfxDefinition, type VfxHandle } from 'wanaka-studio-engine/vfx';

import { loadWanakaDefaultCharacter } from './scenes/default-character.js';

/**
 * Plays a host-bound effect on the default character.
 * Leave the host's mesh visibility alone until the handle finishes.
 */
export async function playOnDefaultCharacter(
  context: SceneContext,
  effect: VfxDefinition,
): Promise<VfxHandle> {
  const vfx = useVfx(context);
  const host = await loadWanakaDefaultCharacter(
    context.scope,
    context.services.model3DLoader,
    context.managed.scene,
    'Host',
  );
  await vfx.prepare(effect, { host });
  return vfx.play(effect, { host });
}
