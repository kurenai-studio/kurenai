import type { Object3D } from 'three/webgpu';
import type { SceneContext } from 'wanaka-studio-engine/scene';
import {
  createVfxPointSource,
  useVfx,
  type VfxDefinition,
  type VfxHandle,
} from 'wanaka-studio-engine/vfx';

/** Await during scene activation. The source follows position and velocity, not rotation. */
export async function createFollowAuraVfx(context: SceneContext, aura: VfxDefinition): Promise<{
  attachAura(target: Object3D): VfxHandle;
}> {
  const vfx = useVfx(context);
  await vfx.prepare(aura);
  return {
    attachAura(target) {
      return vfx.play(aura, { source: createVfxPointSource(target) });
    },
  };
}
