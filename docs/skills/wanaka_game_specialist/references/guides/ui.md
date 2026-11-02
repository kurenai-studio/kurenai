# Game UI

Read this guide before implementing a HUD, menu, dialogue, shop, or touch control. The project source is the only UI truth: `game/ui/look.ts` owns the look and `game/plan.json` `ui` owns the requested platform and screen list.

## Vocabulary

Use the closed look set `clean`, `neon`, `pixel`, `soft`, `bold`, `cartoon`, `elegant`, and `ornate`. Use the screen ids `title`, `hud`, `pause`, `result`, `settings`, `tutorial`, `toast`, `dialogue`, `level-select`, `shop`, `inventory`, `loadout`, and `touch-controls`.

Every visible screen is a child of one `.wk-root`. Screen roots use `authoringId: 'ui/<screen>'` and the semantic `.wk-screen` class. Compose the screen with these hooks: `.wk-panel`, `.wk-title`, `.wk-body`, `.wk-actions`, `.wk-button`, `.wk-ghost`, `.wk-primary`, `.wk-text`, `.wk-value`, `.wk-muted`, `.wk-vitals`, `.wk-track`, `.wk-fill`, `.wk-secondary`, `.wk-counter`, `.wk-timer`, `.wk-toast`, `.wk-objective`, `.wk-dialogue`, `.wk-speaker`, `.wk-portrait`, `.wk-choices`, `.wk-hotbar`, `.wk-slot`, `.wk-cd`, `.wk-minimap`, `.wk-map`, `.wk-marker`, `.wk-touch`, `.wk-stick`, `.wk-action`, and `.wk-reticle`. Do not invent a second component schema or custom theme variables.

## Design for this game

Before writing UI, read the brief, the plan's declared UI, and the existing look and screens. Use the title, description, genre, scene, camera, and supported platforms to choose a coherent visual direction: what the player notices first, the primary action or live value, secondary information, typography, spacing, palette, and panel treatment. Keep these decisions brief and implement them in the existing project source; no separate design document or theme system is needed.

The selected look is a starting palette and set of semantic hooks, not a finished screen layout. Shape the composition, type hierarchy, component proportions, and feedback around this game's decisions and tone. A realistic endurance race can emphasize instrument-like tire condition and pit information; a lighthearted sky racer can emphasize playful lap, position, and boost feedback. These illustrate how mechanics affect presentation, not mandatory genre templates. An intentionally restrained clean interface is valid when it fits the brief; merely accepting scaffold styling or changing an accent does not resolve the design choices.

For both whole-game builds and scoped UI edits, refine hierarchy, typography, spacing, colors, and feedback while preserving authoritative data, navigation, and input behavior. A selected screen or panel limits a scoped edit; otherwise inspect the affected UI as a whole. Reuse existing Interface tools, `UI_LOOK`, and semantic hooks instead of layering a second UI over them. Keep custom composition and responsive rules in the existing UI source. When editing `UI_LOOK` directly, keep token values and their root CSS properties consistent; inline hardcoded colors must not silently defeat the chosen theme.

## Mounting

Import `UI_LOOK` from `./look.js` and `hudElement` from `wanaka-studio-engine/dom`. Mount one root, append one style element with `UI_LOOK.css`, then append all screens below it. Keep `game/ui/index.ts` free of game state; return small handles with `update()` methods so `play.ts` can project its model onto stable elements.

```ts
const root = hudElement('div', {
  parent,
  className: 'wanaka-hud wk-root',
  authoringId: 'ui/root',
});
hudElement('style', { parent: root, text: UI_LOOK.css });
const screen = hudElement('section', {
  parent: root,
  className: 'wk-screen',
  authoringId: 'ui/hud',
});
```

`editor.ts` may mount a showcase with sample data for every screen. `play.ts` mounts the same constructors with the live model. Own the root with the active `LifetimeScope`; runtime and editor scopes must not share listeners or state. Use `display` to switch screens, and keep hidden screens out of pointer hit testing.

## Screen contract

This guide owns shared screen identity, composition, and lifecycle. Implement the screens required by the actual game flow and active mechanics (such as `inventory` for RPG character/equipment/skill menus or `dialogue` for NPC quests and story branches) and the user's explicit request; do not pad a game with screens its mechanics never use. For each screen, put the primary value first, keep required play information visible, and never let decorative UI cover the playable route. The approved Plan `ui` object selects presentation look and direction; it is not a hidden screen checklist.

## Screen composition

- `title`: compose `.wk-title`, concise `.wk-body`, and `.wk-actions` around the game's identity and primary action. Use `.wk-panel` where a surface improves readability; a centered card is not a required layout. The primary action starts the run.
- `hud`: keep the primary value in `.wk-value` or `.wk-counter`, progress in `.wk-vitals` / `.wk-track` / `.wk-fill`, and objectives in `.wk-objective`. The four-tick `.wk-reticle` is reserved for shooting or ranged-aim games whose shots follow the screen-center look ray. First-person or over-shoulder exploration, platforming, action RPG, horror, and other non-shooting games MUST NOT mount it. The look draws a white center dot and four ticks (`--wk-reticle-color`, default `#fff`). Play writes `--wk-reticle-gap` from fire and aim (`reticle.style.setProperty('--wk-reticle-gap', \`${gapPx}px\`)`). A live-actor color sets `--wk-reticle-color` on that element, not `--wk-accent`. Do not mount it when shots do not follow the look ray through screen center.
- `pause` and `result`: when requested, use a centered panel. Pause exposes the declared resume or restart actions (or integrates with the multi-tab RPG menu so `Escape` gives access to both character/quest tabs and `Continue` / `Restart`); a terminal result exposes the declared next-run or navigation actions. A continuous or open-ended game MAY use a milestone or save summary when the plan requests one, but it does not invent a result screen solely to fit this component pattern.
- `tutorial`: use one concise `.wk-toast` or `.wk-panel` and dismiss it without covering the first interaction.
- `dialogue`: use `.wk-dialogue` with `.wk-speaker`, `.wk-body`, and `.wk-choices` in a clean vertical flow (do not add a 2D `.wk-portrait` unless the project actually has portrait art). Choose one of three presentation modes to fit the game:
  1. **Dialogue panel**: keep the gameplay camera and present a bottom `.wk-dialogue` panel (suited to top-down, isometric, tactical grid, or 2D games);
  2. **Shot-reverse-shot camera**: in 3D RPGs or adventures, hide busy combat HUD elements and switch a `CameraRig` shot between the active speaker and listener on the same side of the conversation line (`180°` rule) as lines advance, showing `.wk-choices` at the decision beat;
  3. **Cinematic cutscene sequence**: for major story beats or boss introductions, drive multi-shot camera paths, cuts, and staging through `camera-sequence` ([camera.md](./camera.md#camera-sequences)) before returning ownership to play.
- `shop`, `inventory`, and `loadout`: use `.wk-hotbar` / `.wk-slot` for compact action bars or item grids, and `.wk-panel` sections with a switchable tab bar (`Character`, `Inventory`, `Skills`, `Quests`, `System`) for RPG menus (while `.wk-objective` on `hud` shows the currently tracked quest step).
- `touch-controls`: put `.wk-stick` in the lower left and `.wk-action` buttons in the lower right inside a `.wk-touch` layer.

Interactive controls own `pointer-events: auto`; decorative layers and `.wk-screen` do not. A pointer-lock game keeps menus hidden during active look play. Because browsers consume the first `Escape` key press to revoke Pointer Lock without delivering a `keydown` event, open `pause` or the unified RPG menu immediately on the capture-loss transition (`wasCaptured && !pointer.captured && !isRequesting`) rather than waiting for a second `wasPressed('Escape')`; when a menu hotkey (`Tab` / `I` / `C` / `K` / `J`) is pressed while captured, call `document.exitPointerLock()` and open the menu on that tab, let the cursor switch tabs and click slots freely while open, and re-acquire the lock from the `Continue` activation button when returning to play. Never place a menu button over the active play surface while pointer lock is held.

## Platform rules

Touch and `both` projects give every interactive target at least 44px in both dimensions. Keep controls inside `env(safe-area-inset-*)` plus an 8px margin. Use `touch-action: none` only on the joystick and action controls. Desktop projects show keyboard or gamepad hints in `.wk-muted` without shrinking the primary action.

Per-frame HUD projection MUST cache the last committed value and update DOM text, attributes, styles, and formatted strings only when that value changes. Keep this cache in the screen handle or presenter; do not monkey-patch DOM setters or rewrite a whole screen to refresh one value.

## Authoring guidance

Apply these design requirements to the states the game implements:

1. There is exactly one `.wk-root` and every required screen has a visible `ui/<screen>` root in its authored state.
2. Text remains at least 12px on desktop and 14px on phone; primary values have clear hierarchy.
3. Text and controls stay inside the safe area, do not overflow, and do not overlap another interactive element.
4. Interactive elements have pointer events and touch targets meet 44px when required.
5. The primary action and live values are immediately legible against the actual scene. Typography, spacing, panel treatment, and feedback follow the chosen direction; decorative UI does not compete with the player or playable route.

### Troubleshooting

- Clipped or overlapping controls can come from fixed dimensions, safe-area handling,
  or mismatched screen visibility. Inspect the affected layout and active screen state.
- Input passing through a menu points to pointer-event and modal ownership; an inert
  control can be hidden, disabled, covered, or disconnected from its intent handler.
- Illegible text or a weak primary action points to contrast with the actual scene,
  typography, spacing, and visual hierarchy.
- Phone-only or resize-related problems point to the affected viewport's dimensions
  and coordinate mapping; they do not imply a full device matrix.

When diagnosing layout, identify the relevant viewport and screen state. DOM text
can establish content but not visual layout.

## Optional UI decoration and screen covers

Read `references/engine-api/ui-effects.d.ts` and `references/engine-api/screen-effects.d.ts` before using `createUiEffect` or `createScreenEffect`. These add non-interactive Shaders canvases, not new controls or a UI theme. Keep the existing `.wk-root`, screens, text, and buttons. Use a positioned, sized decoration slot behind readable foreground content. Use the current scope for every effect; never share effects between Edit and Play.

`createUiEffect(scope, slot, options)` decorates one UI region. `createScreenEffect(scope, context.viewport.overlayContainer, options)` covers the viewport for a flash, scanline pattern, or reveal. Reviewed layers are `SolidColor`, `LinearGradient`, `Swirl`, `SimplexNoise`, `Stripes`, `LinearWipe`, and `NoiseDissolve`. A wipe/dissolve modifies only the preceding layers inside this canvas; it does not filter the game framebuffer or blur DOM behind a panel. Place a color layer before a transition layer. Set explicit ids and update a transition through `effect.updateLayer({ id: 'reveal', type: 'LinearWipe', props: { progress } })`; 0 is fully covered and 1 fully revealed. Drive timing from the project's existing scheduler, dispose transient covers when finished, and keep gameplay input ownership unchanged.

Always provide a readable `fallbackBackground`. No WebGPU, initialization failure, or initial reduced-motion preference keeps a static CSS fallback. Transition fallback is a simple directional reveal, not equivalent dissolve noise. Pass the existing scheduler to pause decoration animation with simulation pause; use `setVisible(false)` when hiding its screen. CSS opacity alone does not stop work. Effects expose their own `setOpacity`, which pauses at zero. Register `captureSurface` only when the effect is not already inside a HUD registered for capture. Effects use bundled open-source components, no remote presets or design-service account, and disable Shaders telemetry. Do not add decoration to a game unless its brief or visual presentation benefits from it.

## World-space labels

Use Three's `CSS2DRenderer` from `three/addons/renderers/CSS2DRenderer.js` for world-space labels. Keep labels in a project-owned group, render them from the project's `preRender` hook, and do not include them in the HUD root or screenshot capture unless the brief asks for them. Do not turn UI into a Mesh.

Never inject a runtime theme through `wanakaConfig`, `:host`, or a JSON UI tree. Never query the canvas to find UI state. Theme tokens come from `UI_LOOK.tokens`. Play MAY write hook-local custom properties that `UI_LOOK.css` already declares, including `--wk-reticle-gap` and `--wk-reticle-color` on `.wk-reticle`. Do not invent other custom properties.
