import type { Object3D } from 'three/webgpu';
import type { SceneContext } from 'wanaka-studio-engine/scene';
import { useVfx, type VfxHandle } from 'wanaka-studio-engine/vfx';
import { createCryoHold, createCryoRelease, cryoReleaseParams } from './vfx/ice-prison.js';

const cryo = createCryoHold('game.player-cryo');

const earlyBreak = createCryoRelease('game.player-cryo-release');

/** Owns the visual hold and its independent release; game code owns actor locks and animation. */
export interface CopiedCryo {
  readonly handle: VfxHandle;
  readonly debris: VfxHandle | undefined;
  update(heldSeconds: number): void;
  release(heldSeconds: number, onBreak: () => void): VfxHandle | undefined;
  cancel(onCancel: () => void): void;
}
/** Prepare once; retain a stationary cast anchor through the release tail. */
export async function prepareCopiedCryo(
  context: SceneContext,
): Promise<(anchor: Object3D) => CopiedCryo> {
  const vfx = useVfx(context);
  await vfx.prepare(cryo, { instances: 4 });
  await vfx.prepare(earlyBreak, { instances: 4 });
  return (anchor: Object3D) => {
    const handle = vfx.play(cryo, { parent: anchor });
    let released = false;
    let cancelled = false;
    let handedOff = false;
    let time = 0;
    let debris: VfxHandle | undefined;
    let cancelHandoff: (() => void) | undefined;
    const checkTime = (seconds: number): void => {
      if (!Number.isFinite(seconds) || seconds < time)
        throw new Error('Cryo time must be finite and nondecreasing.');
      time = seconds;
    };
    return {
      handle,
      get debris() {
        return debris;
      },
      update(heldSeconds: number) {
        if (cancelled || released) return;
        checkTime(heldSeconds);
        if (handle.state === 'playing' || handle.state === 'preparing')
          handle.setParam('heldSeconds', heldSeconds);
      },
      release(heldSeconds: number, onBreak: () => void) {
        if (cancelled || released) return;
        checkTime(heldSeconds);
        const params = cryoReleaseParams(heldSeconds);
        released = true;
        const releaseHandle = vfx.play(earlyBreak, { parent: anchor, params });
        debris = releaseHandle;
        const handoff = context.scope.child('cryo-handoff');
        cancelHandoff = () => handoff.dispose();
        handoff.defer(
          context.session.scheduler.on('lateUpdate', ({ deltaSeconds }) => {
            if (cancelled || deltaSeconds <= 0 || releaseHandle.state === 'preparing') return;
            try {
              handle.stop({ immediate: true });
              handedOff = true;
              onBreak();
            } finally {
              handoff.dispose();
              cancelHandoff = undefined;
            }
          }),
        );
        return releaseHandle;
      },
      cancel(onCancel) {
        if (cancelled) return;
        cancelled = true;
        cancelHandoff?.();
        cancelHandoff = undefined;
        handle.stop({ immediate: true });
        debris?.stop({ immediate: true });
        if (!handedOff) {
          handedOff = true;
          onCancel();
        }
      },
    };
  };
}
