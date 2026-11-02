# Input handling

`InputSession` is the current Engine boundary for keyboard, pointer, wheel, touch gestures, and gamepads. It latches one immutable render-frame snapshot during `frameBegin`. Fixed simulation creates a scope-owned `FixedInputConsumer`, which preserves held state on every fixed step and delivers accumulated edges and deltas once per consumer.

Keyboard (`isDown` / `wasPressed` / `wasReleased` / `axis`) and pointer (`isPointerDown` / `wasPointerPressed`) exist on both `input.frame` and the fixed consumer; the racing and first-person examples show them in use. Gamepad members exist on the same session; do not wire a physical-gamepad control path unless the brief names that device. Open [input.d.ts](../engine-api/input.d.ts) only for a member not named in this guide or those examples (wheel, pinch, swipe, the snapshot record shapes).

## Attach one session

Browser games with ordinary keyboard controls MUST attach input to `window`:

```ts
const input = InputSession.create(scope, session.scheduler, window);
const fixedInput = input.fixed(scope);
```

When pointer behavior depends on entering or leaving a game viewport, keep the
ordinary input source on `window` and pass the viewport as `pointerTarget`:

```ts
const input = InputSession.create(scope, session.scheduler, window, {
  pointerTarget: context.viewport.surface,
});
```

The optional target receives `pointerenter`, `pointerleave`, and
`pointercancel` for `input.frame.snapshot.pointer.inside`. Do not register a
second DOM pointer listener tree or infer viewport ownership only from
`getBoundingClientRect()`.

An element MAY be used only for intentionally focus-scoped input after the project makes that element keyboard-focusable. `run_game_test` sends keyboard events to `window`, so a game that expects global controls MUST NOT attach only to a canvas.

The returned session and every DOM listener end with the supplied `LifetimeScope`. The project MUST NOT add a second keyboard or pointer listener tree that competes with it.

## Use the correct phase

Input intent that feeds deterministic simulation or physics SHOULD be consumed in `fixedInput`. Presentation-only pointer or UI work MAY run in `update` when it does not mutate fixed-step authority.

- `isDown(code)` is held state.
- `wasPressed(code)` is the first latched snapshot after keydown.
- `wasReleased(code)` is the first latched snapshot after keyup.
- `axis(negativeCode, positiveCode)` combines two keys into `-1..1`.
- `isPointerDown(buttonsBit)` / `wasPointerPressed(buttonsBit)` / `wasPointerReleased(buttonsBit)` take a single DOM `MouseEvent.buttons` bitmask (`1` = Left button, `2` = Right button, `4` = Middle button, `8` = Back, `16` = Forward). **NEVER pass `0`** (which is `MouseEvent.button` for left click, not a `buttons` bitmask): passing `0` throws a runtime `Error` and will abort every fixed step when called inside a `pointer.captured` branch.

Horizontal intent uses one semantic sign across input sources and downstream systems: negative is left and positive is right relative to the control basis selected by the consumer, such as actor-relative or camera-relative movement. Map keyboard pairs as `axis(leftCode, rightCode)`. Do not reverse that input mapping to compensate for a world axis, camera yaw, model-facing correction, or a later rotation formula; convert between coordinate bases at the consumer while preserving the semantic sign.

Key names in product source are `KeyboardEvent.code` values such as `KeyW`, `ArrowLeft`, and `Space`. The Agent MUST NOT substitute character labels in gameplay code. When binding `Tab` to an in-game action (such as target lock-on, inventory, or scoreboard), register a `keydown` listener that calls `event.preventDefault()` on `event.code === 'Tab'` so the browser does not move DOM focus out of the game viewport. Runtime tests may drive `t.pressKey` with either `KeyboardEvent.key` values such as `'w'`, `' '`, and `'ArrowLeft'`, or supported standard code aliases such as `'KeyW'`, `'Space'`, and `'Digit1'`; the test host normalizes both forms into matching key and code fields. Unknown names throw.

Held movement and edge-triggered actions MUST remain distinct. A fire, jump, menu, or restart action that should happen once MUST use an edge or an explicit consumed intent rather than held state.

`input.frame.snapshot` is the immutable render-frame sample. Fixed simulation MUST read `fixedInput` instead: each consumer independently accumulates keyboard, pointer, touch, wheel, and gamepad edges across render frames with no fixed step, exposes those transients during the next fixed step, and clears them before that consumer's following fixed step. Held keys, pointer buttons, gamepad buttons, axes, and current pointer state remain visible on every fixed step. Create one fixed consumer for each independent input owner; do not share one consumer between systems that require independent edge delivery. Pointer `deltaX`/`deltaY` MUST be consumed once per rendered frame in `update`. Do not consume them in `fixedInput`: multi-step frames would repeat the delta and zero-step frames would drop it.

Any gameplay ray derived from the camera — a shot, a pick, a placement probe, a sight test — MUST be frozen only after this frame's look has been written to the submitted camera. Every `fixedInput` step runs before `update`, so if any look writer still runs in `update` (pointer look, or mixed pointer and touch), freeze the ray in `update` after that look; if the triggering edge is consumed in `fixedInput` while look writes in `update`, latch the edge or the frozen ray in `update` after look. Freeze inside the same `fixedInput` step only when every look writer already runs there (touch-only look with no pointer look pending in `update`).

## Converge device channels

Each gameplay channel MUST have one final writer. Keyboard, touch, and AI MAY contribute candidate values, but the project MUST combine or select them before applying movement, look, or action intent.

For a `CharacterController`, submit one `control(intent)` per character per fixed step. Device-driven move, jump, and stance belong in `fixedInput`. Behavior or navigation that reads `latestStep` MAY submit in `fixedUpdate`. Repeated submissions are newest-wins until that step consumes the intent. Do not call `control()` from `update` or `preRender`.

Choose the movement basis from [character.d.ts](../engine-api/character.d.ts):

- `{ kind: 'world', velocity }` — planar world-space m/s (NPC toward a point, click-to-move waypoint). [character-ai.ts](../../examples/character-ai.ts) and [character-navigation.ts](../../examples/character-navigation.ts) prove that handoff.
- `{ kind: 'relative', relativeTo: { kind: 'view', forward } }` — camera-relative WASD. [third-person-character.ts](../../examples/third-person-character.ts) proves the mapping; sample that `forward` in the same fixed phase as `control()` ([camera.md](./camera.md)).
- `{ kind: 'relative', relativeTo: { kind: 'actor' } }` — tank or stick-steer in the facing already settled when this step consumes the intent. A same-step `facing: { kind: 'forward' }` turns after movement, so this step still moves along the previous facing.

Facing on `control()` is `{ kind: 'preserve' }` (keep heading when input drops; [character-ai.ts](../../examples/character-ai.ts) when stopped), `{ kind: 'movement', smoothingHalfLife }`, or `{ kind: 'forward', forward, smoothingHalfLife }`. `reset({ facing: 'preserve' })` is the string `'preserve'`, not `{ kind: 'preserve' }`.

Omitted `stance` is stand this step; omitted `jump` is no jump this step. A crouch game MUST send `stance` every step. Grounded jump reads `fixedInput.wasPressed`; do not latch `input.frame.wasPressed` in `frameBegin` for that edge — the fixed consumer already accumulates presses across render frames with no fixed step.

Use `setMoveIntent`, `jump()`, and `setStance()` only when a project deliberately owns those channels separately. They MUST NOT mix with `control()` in the same step. `setMoveIntent` does not carry facing, jump, stance, or a control sequence.

The Agent SHOULD keep these channels separate:

- planar movement;
- camera look (geometry, pointer-delta signs, and camera-relative movement basis: [camera.md](./camera.md));
- actor facing;
- jump or action edges;
- vehicle throttle, steering, brake, and handbrake;
- cursor-driven selection or aiming.

Vehicle controls MUST preserve independent full-range throttle and steering. Simulation wheeled projects map input in [vehicle-drive.ts](../../examples/vehicle-drive.ts). Arcade racer projects latch throttle, brake, and steer during `fixedInput` as in [arcade-racer.ts](../../examples/arcade-racer.ts). Camera-relative character movement is [third-person-character.ts](../../examples/third-person-character.ts). When diagnosing movement direction at runtime, measure forward and strafe by signed projection after rotating the view.

## Pointer input and Pointer Lock

Ordinary pointer position and relative captured movement are different modes. The project MUST choose deliberately:

- cursor-driven games read the latched pointer snapshot and keep the system cursor available;
- camera or free-look games MUST complete the Pointer Lock state machine below;
- DOM controls own their own events and publish gameplay intent rather than mutating simulation from several handlers.

Any first-person or third-person 3D game that promises 360-degree observation MUST use Pointer Lock and direct relative mouse movement on desktop, whether its repeated activity is exploration, platforming, action combat, survival, or shooting. Mouse dragging, Q/E/R camera rotation, and an automatic follow camera that takes rotation ownership are not substitutes. A one-way run, fixed-camera corridor, or 2D/2.5D side-view game is outside this free-look contract and MUST state its rigid camera boundary instead.

## Pointer Lock state machine

The activation surface receives the user gesture; the lock target is always `context.viewport.surface`. They MAY be the same element. Use an existing user-facing control when one exists; otherwise use the viewport surface. Never create a hidden surrogate control. In Play, call `viewport.surface.requestPointerLock()` from that gesture and consume `input.frame.snapshot.pointer.captured` every frame. Keep a local requesting flag so an in-flight request is not treated as lock loss. [pointer-lock.ts](../../examples/pointer-lock.ts) proves that boundary; do not add it as a project module. A menu Start/Resume control MAY be the activation surface: [htmlui-canonical.ts](../../examples/htmlui-canonical.ts) exposes those buttons, and the Pointer Lock example accepts one or more of them, blurs the clicked control, and exposes `isRequesting` so pause does not treat an in-flight request as lock loss.

With a start, resume, or pause menu, that control MAY be the activation surface. Player-facing labels are Start, Paused, and Continue. Do not explain lock, capture, or mouse release on the HUD. Use the callback or input snapshot to reflect state.

- Keep the activation entry visible and clickable while the state is Uncaptured, including the initial screen and every denied or lost request. It MAY be hidden while Captured or when another explicit activation surface is available.
- The handler MUST only request Pointer Lock; it MUST NOT also fire, jump, or trigger another gameplay edge.
- A HUD or menu click still appears in the window-level `InputSession` snapshot — and while `session.setTimeScale(0)` is active on a title or pause screen, `frameBegin` continues accumulating `buttonsPressed` into `fixedInput` until `setTimeScale(1)` resumes! To prevent clicking Start, Continue, or the unlocked canvas from immediately firing a weapon or attacking on the first gameplay frame: (1) intercept `pointerdown` and `mousedown` (`{ capture: true }`) on activation controls with `event.stopPropagation()`, and (2) in gameplay input, suppress primary fire/attack on the capture-acquisition frame (`!wasCaptured && pointer.captured`), while `isRequesting` is true, and until the activation mouse button (`isPointerDown(1)`) has been released once after entering play/resume. After the click, blur the control so Space cannot re-activate it.
- Release the lock before opening cursor-driven UI, then resume from a new activation gesture. Escape is not a user-activation gesture and MUST NOT re-lock.
- When Pointer Lock is captured, the browser consumes the first `Escape` key press to exit Pointer Lock (`input.frame.snapshot.pointer.captured` transitions from `true` to `false` without delivering a `keydown` event for `Escape`). Any game that opens a pause or in-game menu on `Escape` MUST open that menu on the capture-loss transition (`wasCaptured && !pointer.captured && !isRequesting`) so a single `Escape` press both releases the cursor and shows the menu; relying only on `wasPressed('Escape')` forces the player to press `Escape` twice.
- While a lock request is in flight, `captured === false` is not lock loss: do not pause, open cursor UI, or abort a resume that has already requested Pointer Lock.
- If Pointer Lock is unavailable or repeatedly denied, the project MAY keep relative look without a lock and MUST still retry from each later activation gesture; a success returns to the captured path.

Without a button or menu, use `context.viewport.surface` as the activation surface.

- A click on the unlocked surface requests Pointer Lock; a later click can retry after Escape, focus loss, or a denied request.
- Do not auto-request on attach, a scheduler callback, or a timeout.
- If the surface also has click actions, consume the activation click as a lock-request edge and accept other actions only when `input.frame.snapshot.pointer.captured` was already true. The click that acquires or reacquires the lock MUST NOT fire, jump, or select.
- Keep look disabled on the unlocked surface until the next gesture; do not invent a button or menu.

The activation gesture calls `viewport.surface.requestPointerLock()` synchronously. A finished mouse look SHOULD pass `{ unadjustedMovement: true }` so OS mouse acceleration does not scale captured deltas; omit the option when the brief wants OS acceleration. If that promise rejects with `NotSupportedError`, request once more without options after the first call settles; that retry is not a concurrent second request. Do not retry other failures on the same gesture. If the retry fails — including expired user activation — return to Uncaptured and wait for a new gesture. Some hosts ignore the option and still lock; treat that as success. While requesting Pointer Lock, the activation handler consumes the corresponding pointer press/click before global or same-surface gameplay handlers can treat it as an edge. Observe the returned promise asynchronously for failure handling; do not await it before the call or issue a second concurrent request while the local request is pending. `input.frame.snapshot.pointer.captured` is true while that canvas owns `document.pointerLockElement` and remains authoritative after the request. An overlay that locks itself is not captured look.

| State | Required behavior | Recovery |
| --- | --- | --- |
| Uncaptured / waiting | Do not apply `deltaX` or `deltaY`. Keep an existing activation control available, or accept a gesture on the game surface itself. | A new user gesture may request Pointer Lock. |
| Requesting | Keep the local request state separate from `input.frame.snapshot.pointer.captured`; do not issue a second concurrent request, treat the activation gesture as gameplay input, or treat uncaptured snapshots as lock loss while the request is pending. A sequential retry without `unadjustedMovement` after `NotSupportedError` is allowed. | After the promise settles, let the next latched snapshot choose Captured or return to Uncaptured. |
| Captured | Read `input.frame.snapshot.pointer.captured` in one per-frame consumer and apply only that frame's relative delta. | `document.exitPointerLock()` is the explicit game-driven exit. |
| Denied or lost | Once the local request is not pending, treat a rejected request or `captured === false` as a real state transition; stop look immediately and ignore stale deltas. Surface a retry affordance only when the project has UI. | Return to Uncaptured / waiting and require another gesture. |
| Paused, in a menu, or unfocused | Release the lock before showing cursor-driven UI and stop look while the overlay owns interaction. Do not enter this state from an in-flight request solely because `captured` is still false. | Resume only after a new activation gesture. Escape does not count. |

The lock may be lost through Escape, browser policy, focus changes, or another document-level transition. No state other than `input.frame.snapshot.pointer.captured` may claim that relative look is active.

## Touch and HUD controls

Screen controls mount onto `context.viewport.overlayContainer` with `hudElement()` from `wanaka-studio-engine/dom`, then `scope.defer(() => root.remove())`. A local virtual joystick exposes `stickX`, `stickY`, and `active`; gameplay code reads those values into the same movement writer used by keyboard. Free-look touch projects add a right-stick or right-half-screen swipe that writes the same yaw and pitch state as captured mouse movement. See [htmlui-canonical.ts](../../examples/htmlui-canonical.ts).

Non-interactive overlay regions SHOULD NOT intercept pointer events. Buttons and controls MUST have deliberate focus behavior so clicking a HUD element does not silently disable the game's intended keyboard path. A clicked start or resume control MUST blur so Space cannot re-activate it after play resumes.

## Troubleshooting

Lost, repeated, or stale actions can come from edge consumption, release handling, focus, or modal ownership on the affected device path. Trace the affected input from its listener through the frame snapshot to its intended consumer.

Reversed controls can come from a mismatch between input labels and the selected movement basis. [camera.md](./camera.md) describes a signed camera-relative probe. For an actor-relative comparison, such as steering, same-pose displacement or facing change projects negatively onto actor-right for left input and positively for right input. Opposite rotation alone is insufficient because both labels can still be swapped.

Pointer Lock problems often occur at the initial gesture, denied request, Escape, focus loss, or later activation. Look remaining active while uncaptured points to stale capture state; activation firing another action points to an unconsumed gameplay edge. A request in flight is not lock loss. Menu visibility and release/resume ownership belong to the authored flow; a game without a menu reacquires through its viewport rather than invented UI or automatic requests.
