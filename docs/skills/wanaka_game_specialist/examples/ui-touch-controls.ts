import type { LifetimeScope } from 'wanaka-studio-engine';
import { hudElement } from 'wanaka-studio-engine/dom';

/** Adds a touch control screen with safe-area-friendly joystick and action targets. */
export function mountTouchControls(scope: LifetimeScope, parent: HTMLElement): void {
  const screen = hudElement('section', {
    parent,
    className: 'wk-screen wk-touch',
    authoringId: 'ui/touch-controls',
  });
  const stick = hudElement('div', {
    parent: screen,
    className: 'wk-stick wk-touch',
    authoringId: 'ui/touch-controls/stick',
  });
  const action = hudElement('button', {
    parent: screen,
    className: 'wk-action wk-primary',
    authoringId: 'ui/touch-controls/action',
    text: 'Action',
  });
  stick.addEventListener('pointerdown', (event) => {
    stick.setPointerCapture(event.pointerId);
  });
  scope.defer(() => screen.remove());
  void action;
}
