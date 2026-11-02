/**
 * Pointer Lock lifecycle. `viewport.surface.requestPointerLock()` is a
 * browser Pointer Lock request: it only succeeds inside a real user gesture,
 * and `input.frame.snapshot.pointer.captured` is true while that canvas
 * owns `document.pointerLockElement`.
 *
 * The lock is not a mode the game owns. Esc revokes it at any time, so
 * `captured` must be read every frame and relative deltas must stop feeding
 * the look state the moment it goes false — otherwise ordinary pointer motion
 * over the page keeps turning the view. Esc is not a user-activation gesture
 * and MUST NOT call `requestPointerLock`. Look geometry is camera.md;
 * this file does not write yaw or pitch.
 *
 * Pause and cursor UI follow this state machine, not `captured === false`
 * while a request is in flight. Because the browser consumes the first Esc to
 * exit Pointer Lock without firing `keydown`, open pause on the `'captured'`
 * -> `'uncaptured'` transition in `onStateChange`. Write the same boundary in
 * Play source; do not add this file as a project module.
 *
 * A finished mouse look SHOULD pass `{ unadjustedMovement: true }` so OS
 * mouse acceleration does not scale captured deltas. If that request
 * rejects with `NotSupportedError`, request once more without the option
 * after the first call settles. That retry can still fail if user
 * activation has expired; then wait for the next gesture.
 *
 * The lock target is `context.viewport.surface` from `activateGame`. A menu
 * Start/Resume control MAY be the activation surface; pass every such
 * control. Overlay elements that lock themselves are not captured look.
 */
import type { InputSession } from 'wanaka-studio-engine/input';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import type { SceneViewport } from 'wanaka-studio-engine/scene';

export type PointerLockState = 'uncaptured' | 'requesting' | 'captured';

export interface PointerLockHandle {
  readonly release: () => void;
  /** True between the activation gesture and the next latched captured snapshot. */
  readonly isRequesting: () => boolean;
}

function activationSurfaces(
  surface: HTMLElement | readonly HTMLElement[],
): readonly HTMLElement[] {
  return surface instanceof HTMLElement ? [surface] : surface;
}

export function attachPointerLock(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  input: InputSession,
  activationSurface: HTMLElement | readonly HTMLElement[],
  viewport: SceneViewport,
  onStateChange?: (state: PointerLockState, error?: unknown) => void,
): PointerLockHandle {
  let state: PointerLockState = input.frame.snapshot.pointer.captured ? 'captured' : 'uncaptured';
  let requestPending = false;
  onStateChange?.(state);

  const setState = (next: PointerLockState, error?: unknown): void => {
    if (state === next && error === undefined) {
      return;
    }
    state = next;
    onStateChange?.(next, error);
  };

  // Intercept pointerdown/mousedown on activation controls so clicking Start or
  // Continue while paused (timeScale = 0) does not accumulate a buttonsPressed
  // edge on window that fires a weapon on the first resumed fixed step. Also
  // suppress fire on the 'uncaptured' -> 'captured' transition frame and until
  // isPointerDown(1) is released after entering play.
  const onActivationPress = (event: Event): void => {
    if (state !== 'captured' || !input.frame.snapshot.pointer.captured) {
      event.stopImmediatePropagation();
    }
  };

  // User activation is consumed by the gesture itself, so the request must be
  // issued inside the click handler — not at attach time, not after an await.
  const onClick = (event: MouseEvent) => {
    if (state === 'requesting' && requestPending) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (input.frame.snapshot.pointer.captured) {
      return;
    }
    event.preventDefault();
    // A HUD start/resume control still publishes its intent. The canvas
    // activation path consumes the click so the same gesture cannot fire.
    if (event.currentTarget === viewport.surface) {
      event.stopImmediatePropagation();
    }
    const target = event.currentTarget;
    if (target instanceof HTMLElement) target.blur();
    requestPending = true;
    setState('requesting');
    const requestLock = (unadjusted?: boolean): Promise<void> =>
      Promise.resolve(
        unadjusted === undefined
          ? viewport.surface.requestPointerLock()
          : viewport.surface.requestPointerLock({ unadjustedMovement: unadjusted }),
      );
    const settleRequest = (): void => {
      // Keep the browser snapshot authoritative. The lock can be revoked
      // after the request settles but before the next update;
      // requestPending lets that frame return to Uncaptured instead of
      // leaving the retry path stuck in Requesting.
      requestPending = false;
    };
    const failRequest = (error: unknown): void => {
      requestPending = false;
      setState('uncaptured', error);
    };
    void requestLock(true).then(settleRequest, (error: unknown) => {
      if (error instanceof Error && error.name === 'NotSupportedError') {
        void requestLock().then(settleRequest, failRequest);
        return;
      }
      failRequest(error);
    });
  };

  const surfaces = activationSurfaces(activationSurface);
  for (const surface of surfaces) {
    surface.addEventListener('pointerdown', onActivationPress, { capture: true });
    surface.addEventListener('mousedown', onActivationPress, { capture: true });
    surface.addEventListener('click', onClick, { capture: true });
  }
  scope.defer(() => {
    for (const surface of surfaces) {
      surface.removeEventListener('pointerdown', onActivationPress, { capture: true });
      surface.removeEventListener('mousedown', onActivationPress, { capture: true });
      surface.removeEventListener('click', onClick, { capture: true });
    }
  });

  scope.defer(
    scheduler.on('update', () => {
      const { pointer } = input.frame.snapshot;
      if (pointer.captured && state !== 'captured') {
        setState('captured');
      } else if (!pointer.captured && state === 'captured') {
        setState('uncaptured');
      } else if (!pointer.captured && state === 'requesting' && !requestPending) {
        setState('uncaptured');
      }
    }),
  );

  // The lock ends with the document owner; this is for game-driven exits such
  // as a pause menu that needs the cursor back before teardown.
  return {
    release: () => document.exitPointerLock(),
    isRequesting: () => state === 'requesting',
  };
}
