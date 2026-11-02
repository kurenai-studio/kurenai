import type { LifetimeScope } from 'wanaka-studio-engine';
import { hudElement } from 'wanaka-studio-engine/dom';
import type { SceneViewport } from 'wanaka-studio-engine/scene';
import { UI_LOOK } from './ui/look.js';

export interface UiShowcaseHost {
  readonly viewport: SceneViewport;
}

export interface UiModel {
  readonly title: string;
  readonly score: number;
  readonly objective: string;
}

/** Mounts the title, HUD, pause, and result screens used by a small game. */
export function mountUiScreens(
  scope: LifetimeScope,
  host: UiShowcaseHost,
  model: UiModel,
): { readonly update: (next: UiModel) => void } {
  const root = hudElement('div', {
    parent: host.viewport.overlayContainer,
    className: 'wanaka-hud wk-root',
    authoringId: 'ui/root',
  });
  hudElement('style', { parent: root, text: UI_LOOK.css });
  scope.defer(() => root.remove());

  const title = hudElement('section', {
    parent: root,
    className: 'wk-screen wk-panel',
    authoringId: 'ui/title',
  });
  hudElement('h1', { parent: title, className: 'wk-title', text: model.title });
  const start = hudElement('button', {
    parent: title,
    className: 'wk-button wk-primary',
    authoringId: 'ui/title/start',
    text: 'Start game',
  });
  scope.defer(() => start.replaceWith(start.cloneNode(true)));

  const hud = hudElement('section', {
    parent: root,
    className: 'wk-screen',
    authoringId: 'ui/hud',
  });
  hud.hidden = true;
  start.addEventListener('click', () => {
    title.hidden = true;
    hud.hidden = false;
  });
  const score = hudElement('strong', { parent: hud, className: 'wk-counter wk-value' });
  hudElement('p', { parent: hud, className: 'wk-objective wk-text', text: model.objective });

  for (const [screen, label] of [
    ['pause', 'Paused'],
    ['result', 'Run complete'],
  ] as const) {
    const panel = hudElement('section', {
      parent: root,
      className: 'wk-screen wk-panel',
      authoringId: `ui/${screen}`,
      text: label,
    });
    panel.hidden = true;
  }

  let renderedScore: number | undefined;
  const update = (next: UiModel): void => {
    if (next.score === renderedScore) return;
    renderedScore = next.score;
    score.textContent = String(next.score);
  };
  update(model);
  return { update };
}
