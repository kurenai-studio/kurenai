import type { Object3D } from 'three/webgpu';
import type { SceneContext } from 'wanaka-studio-engine/scene';
import { useVfx, type VfxHandle } from 'wanaka-studio-engine/vfx';
import { createHeldPortal, portalCloseSeconds } from './vfx/portal.js';

const definition = createHeldPortal('game.doorway');

/** One doorway play; traversal eligibility remains game-owned. */
export interface CopiedPortal {
  readonly handle: VfxHandle;
  update(elapsedSeconds: number): void;
  close(): void;
  cancel(): void;
}
/** Prepare once during scene activation; cast at an unscaled doorway anchor. */
export async function prepareCopiedPortal(
  context: SceneContext,
): Promise<(anchor: Object3D) => CopiedPortal> {
  const vfx = useVfx(context);
  await vfx.prepare(definition, { instances: 4 });
  return (anchor: Object3D) => {
    const handle = vfx.play(definition, { parent: anchor });
    let time = 0;
    let closingAt: number | undefined;
    let ended = false;
    return {
      handle,
      update(elapsedSeconds: number) {
        if (ended) return;
        if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < time)
          throw new Error('Portal time must be finite and nondecreasing.');
        time = elapsedSeconds;
        handle.setParam('time', time);
        if (closingAt !== undefined && time - closingAt >= portalCloseSeconds) {
          ended = true;
          handle.stop({ immediate: true });
        }
      },
      close() {
        if (ended || closingAt !== undefined) return;
        closingAt = time;
        handle.setParam('closingAt', closingAt);
      },
      cancel() {
        if (ended) return;
        ended = true;
        handle.stop({ immediate: true });
      },
    };
  };
}
