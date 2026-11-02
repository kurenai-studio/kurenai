/**
 * Editable full-game UI flow. Call the shared mount function from
 * `activateEditor` for authoring preview and from `activateGame` for Play to
 * bind the same authoring identities. DOM handlers publish intents; Play owns
 * state transitions.
 * Every interactive element is parented inside its visible panel so a
 * full-screen layer cannot cover a root-level sibling button.
 *
 * Mount onto `context.viewport.overlayContainer` with `hudElement()` from
 * `wanaka-studio-engine/dom`. Tear the root down with `scope.defer(() => root.remove())`.
 * Start, Continue, and Play Again MAY be Pointer Lock activation surfaces;
 * Play requests lock. This module only publishes intents and blurs the control.
 *
 * POINTER LOCK: pass `'pointer-lock'` as the look argument. That path omits Pause,
 * Fullscreen, stick, and any other playing-overlay button. Pause with Escape,
 * release the lock, show a pause menu, and resume from Continue or a click on
 * the game surface. Pause-menu copy is Paused and Continue; do not explain lock
 * or mouse capture. The default `'cursor'` path keeps those playing buttons for
 * cursor-driven HUDs.
 */
import type { LifetimeScope } from 'wanaka-studio-engine';
import type { SceneViewport } from 'wanaka-studio-engine/scene';
import { hudElement } from 'wanaka-studio-engine/dom';
import { UI_LOOK } from './ui/look.js';

/** Visible states owned by the canonical full-game UI. */
export type CanonicalUiPhase = 'menu' | 'countdown' | 'playing' | 'result';

/** Semantic actions published by canonical UI controls. */
export type CanonicalUiIntent = 'start' | 'togglePause' | 'restart' | 'returnToMenu';

/** Local stick handle. `stickX` / `stickY` are -1..1 (`+x` right, `+y` up). */
export interface VirtualJoystick {
  readonly pad: HTMLElement;
  readonly stickX: number;
  readonly stickY: number;
  readonly active: boolean;
}

/** Host surfaces required to mount the canonical UI. */
export interface CanonicalHudHost {
  readonly viewport: SceneViewport;
}

/** Look ownership for the playing overlay. */
export type CanonicalHudLook = 'cursor' | 'pointer-lock';

/** Stable UI handles and state setters consumed by gameplay. */
export interface CanonicalHud {
  readonly stick: VirtualJoystick | null;
  readonly startControl: HTMLButtonElement;
  readonly pauseControl: HTMLButtonElement;
  readonly restartControl: HTMLButtonElement;
  readonly setPhase: (phase: CanonicalUiPhase) => void;
  readonly setScore: (value: number) => void;
  readonly setCountdown: (value: number | string) => void;
  readonly setPaused: (paused: boolean) => void;
  readonly setResult: (rank: number, total: number, elapsedSeconds: number) => void;
}

class VirtualJoystickController implements VirtualJoystick {
  stickX = 0;
  stickY = 0;
  active = false;

  constructor(readonly pad: HTMLElement) {}

  handlePointer(event: PointerEvent | TouchEvent | undefined, active: boolean): void {
    if (!active || !event) return;
    const touchPoint =
      'touches' in event ? (event.touches[0] ?? event.changedTouches[0]) : undefined;
    const clientX = 'clientX' in event ? event.clientX : touchPoint?.clientX;
    const clientY = 'clientY' in event ? event.clientY : touchPoint?.clientY;
    if (clientX === undefined || clientY === undefined) return;
    this.active = true;
    const rect = this.pad.getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) {
      this.release();
      return;
    }
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const length = Math.hypot(nx, ny) || 1;
    const scale = Math.min(1, length) / length;
    this.stickX = nx * scale;
    this.stickY = ny * scale;
  }

  release(): void {
    this.active = false;
    this.stickX = 0;
    this.stickY = 0;
  }
}

function attachVirtualJoystick(scope: LifetimeScope, pad: HTMLElement): VirtualJoystick {
  const stick = new VirtualJoystickController(pad);
  const onDown = (event: Event): void =>
    stick.handlePointer(event as PointerEvent | TouchEvent, true);
  const onMove = (event: Event): void =>
    stick.handlePointer(event as PointerEvent | TouchEvent, stick.active);
  const onUp = (): void => stick.release();
  for (const type of ['pointerdown', 'touchstart']) {
    pad.addEventListener(type, onDown);
    scope.defer(() => pad.removeEventListener(type, onDown));
  }
  for (const type of ['pointermove', 'touchmove']) {
    pad.addEventListener(type, onMove);
    scope.defer(() => pad.removeEventListener(type, onMove));
  }
  for (const type of ['pointerup', 'pointerleave', 'touchend', 'touchcancel']) {
    pad.addEventListener(type, onUp);
    scope.defer(() => pad.removeEventListener(type, onUp));
  }
  return stick;
}

function bindFullscreenButton(
  scope: LifetimeScope,
  parent: HTMLElement,
  target: Element,
  label: string,
  className: string,
): HTMLButtonElement {
  const button = hudElement('button', { parent, className, text: label });
  const onPress = (): void => {
    button.blur();
    void target.requestFullscreen();
  };
  button.addEventListener('click', onPress);
  scope.defer(() => button.removeEventListener('click', onPress));
  return button;
}

/** Mounts a scope-owned menu, countdown, gameplay HUD, and result flow. */
export function mountCanonicalHud(
  scope: LifetimeScope,
  host: CanonicalHudHost,
  publishIntent: (intent: CanonicalUiIntent) => void,
  look: CanonicalHudLook = 'cursor',
): CanonicalHud {
  const root = hudElement('div', {
    parent: host.viewport.overlayContainer,
    className: 'wanaka-hud wk-root canonical-ui',
    authoringId: 'ui/root',
  });
  root.style.position = 'absolute';
  root.style.inset = '0';
  root.style.overflow = 'hidden';
  root.style.pointerEvents = 'none';
  scope.defer(() => root.remove());

  const style = hudElement('style', { parent: root, text: UI_LOOK.css });
  style.textContent += `
.canonical-ui { color: var(--wk-text); font-family: var(--wk-font-body); }
.hud-screen { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: auto; }
.hud-card { display: flex; min-width: 280px; max-width: min(480px, calc(100% - 48px)); flex-direction: column; align-items: center; gap: 16px; padding: 32px; text-align: center; }
.hud-card h1, .hud-card p { margin: 0; }
.hud-playing { position: absolute; inset: 0; pointer-events: none; }
.hud-score { position: absolute; top: 24px; left: 24px; font-size: 24px; font-weight: 700; }
.hud-controls { position: absolute; inset: 0; pointer-events: none; }
.hud-pause { position: absolute; top: 24px; right: 24px; }
.hud-fullscreen { position: absolute; right: 24px; bottom: 24px; }
.hud-stick { position: absolute; left: 24px; bottom: 24px; }
.hud-watermark { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); opacity: 0.65; }
.hud-overlay-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(56px, 14vw, 144px); font-weight: 800; pointer-events: none; }
.hud-pause-banner { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 16px 24px; font-size: 32px; font-weight: 700; pointer-events: none; }
.hud-result-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
`;

  const addButton = (
    parent: HTMLElement,
    authoringId: string,
    text: string,
    intent: CanonicalUiIntent,
    className = 'wk-button',
  ): HTMLButtonElement => {
    const button = hudElement('button', { parent, authoringId, className, text });
    const onPress = (event: Event): void => {
      event.preventDefault();
      button.blur();
      publishIntent(intent);
    };
    button.addEventListener('click', onPress);
    scope.defer(() => button.removeEventListener('click', onPress));
    return button;
  };

  const menu = hudElement('section', {
    parent: root,
    authoringId: 'hud-menu',
    className: 'wk-screen hud-screen',
  });
  const menuCard = hudElement('div', { parent: menu, className: 'wk-panel hud-card' });
  hudElement('h1', { parent: menuCard, className: 'wk-title', authoringId: 'hud-title', text: 'Ready to Play?' });
  hudElement('p', {
    parent: menuCard,
    authoringId: 'hud-instructions',
    className: 'wk-body',
    text: 'Use keyboard or touch controls.',
  });
  const startControl = addButton(menuCard, 'hud-start', 'Start Game', 'start', 'wk-button wk-primary');

  const playing = hudElement('section', {
    parent: root,
    authoringId: 'hud-playing',
    className: 'wk-screen hud-playing',
  });
  const score = hudElement('div', {
    parent: playing,
    authoringId: 'hud-score',
    className: 'wk-counter wk-value hud-score',
    text: 'Score 0',
  });
  hudElement('div', {
    parent: playing,
    authoringId: 'hud-watermark',
    className: 'hud-watermark',
    text: 'Wanaka',
  });

  let stick: VirtualJoystick | null = null;
  let pauseControl: HTMLButtonElement;
  let pauseBanner: HTMLElement | null = null;
  let pauseMenu: HTMLElement | null = null;
  if (look === 'cursor') {
    const controls = hudElement('div', { parent: playing, className: 'hud-controls' });
    pauseControl = addButton(
      controls,
      'hud-pause',
      'Pause',
      'togglePause',
      'wk-button hud-pause',
    );
    bindFullscreenButton(
      scope,
      controls,
      host.viewport.surface,
      'Fullscreen',
      'wk-button hud-fullscreen',
    );
    const stickPad = hudElement('div', {
      parent: controls,
      authoringId: 'hud-stick',
      className: 'wk-stick wk-touch hud-stick',
    });
    stick = attachVirtualJoystick(scope, stickPad);
    pauseBanner = hudElement('div', {
      parent: playing,
      authoringId: 'hud-pause-banner',
      className: 'wk-panel hud-pause-banner',
      text: 'Paused',
    });
    pauseBanner.style.display = 'none';
  } else {
    pauseMenu = hudElement('section', {
      parent: root,
      authoringId: 'hud-pause-menu',
      className: 'wk-screen hud-screen',
    });
    const pauseCard = hudElement('div', { parent: pauseMenu, className: 'wk-panel hud-card' });
    hudElement('h1', { parent: pauseCard, className: 'wk-title', authoringId: 'hud-pause-title', text: 'Paused' });
    pauseControl = addButton(pauseCard, 'hud-continue', 'Continue', 'togglePause');
    pauseMenu.style.display = 'none';
  }

  const countdown = hudElement('div', {
    parent: root,
    authoringId: 'hud-countdown',
    className: 'hud-overlay-text',
    text: '3',
  });

  const result = hudElement('section', {
    parent: root,
    authoringId: 'hud-result',
    className: 'wk-screen hud-screen',
  });
  const resultCard = hudElement('div', { parent: result, className: 'wk-panel hud-card' });
  hudElement('h1', {
    parent: resultCard,
    authoringId: 'hud-result-title',
    text: 'Game Over',
  });
  const resultRank = hudElement('div', {
    parent: resultCard,
    authoringId: 'hud-result-rank',
    text: 'Place 1 / 1',
  });
  const resultTime = hudElement('div', {
    parent: resultCard,
    authoringId: 'hud-result-time',
    text: 'Time 0:00',
  });
  const resultActions = hudElement('div', {
    parent: resultCard,
    className: 'wk-actions hud-result-actions',
  });
  const restartControl = addButton(resultActions, 'hud-restart', 'Play Again', 'restart');
  addButton(resultActions, 'hud-return-menu', 'Main Menu', 'returnToMenu');

  const setPhase = (phase: CanonicalUiPhase): void => {
    menu.style.display = phase === 'menu' ? 'flex' : 'none';
    countdown.style.display = phase === 'countdown' ? 'flex' : 'none';
    playing.style.display = phase === 'playing' ? 'block' : 'none';
    result.style.display = phase === 'result' ? 'flex' : 'none';
    if (pauseMenu && phase !== 'playing') pauseMenu.style.display = 'none';
  };

  setPhase('menu');

  return {
    stick,
    startControl,
    pauseControl,
    restartControl,
    setPhase,
    setScore: (value) => {
      score.textContent = `Score ${value}`;
    },
    setCountdown: (value) => {
      countdown.textContent = String(value);
    },
    setPaused: (paused) => {
      if (pauseBanner) {
        pauseBanner.style.display = paused ? 'block' : 'none';
        pauseControl.textContent = paused ? 'Continue' : 'Pause';
      }
      if (pauseMenu) {
        pauseMenu.style.display = paused ? 'flex' : 'none';
      }
    },
    setResult: (rank, total, elapsedSeconds) => {
      const seconds = Math.max(0, Math.floor(elapsedSeconds));
      const minutes = Math.floor(seconds / 60);
      resultRank.textContent = `Place ${rank} / ${total}`;
      resultTime.textContent = `Time ${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    },
  };
}
