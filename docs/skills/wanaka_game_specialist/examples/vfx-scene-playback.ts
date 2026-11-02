import type { SceneContext } from 'wanaka-studio-engine/scene';
import { useVfx, type VfxDefinition, type VfxHandle } from 'wanaka-studio-engine/vfx';

/** Await during scene activation; returns event handlers only after both definitions are prepared. */
export async function createCombatVfx(
  context: SceneContext,
  effects: { readonly iceHit: VfxDefinition; readonly campfire: VfxDefinition },
): Promise<{
  playIceHit(position: readonly [number, number, number]): VfxHandle;
  playCampfire(position: readonly [number, number, number]): VfxHandle;
}> {
  const vfx = useVfx(context);
  await Promise.all([vfx.prepare(effects.iceHit), vfx.prepare(effects.campfire)]);
  return {
    playIceHit(position) {
      return vfx.play(effects.iceHit, { position });
    },
    playCampfire(position) {
      return vfx.play(effects.campfire, { position });
    },
  };
}
