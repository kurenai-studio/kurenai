---
name: wanaka_game_tester
description: Reference for game test sessions, test scripts, runtime observations, and result interpretation.
---

# Wanaka Game Tester

This Skill explains how to operate runtime tests. Its diagnostic methods highlight common failure points and useful starting points for investigating a problem, not a completion checklist for every game creation or edit.

Loading this reference does not commit you to starting or continuing a test. When testing was not explicitly requested, reviewing the methods may show that the expected verification benefit does not justify the setup effort and delay. You can then deliver the implementation without runtime testing, note important unverified behavior, and let user feedback guide the next iteration.

A Game Test support overlay can shorten a test that needs a hard-to-reach state. Include the effort to create and maintain that overlay when weighing testing against delivery. Preparation establishes prerequisites; the behavior under test still runs through normal game logic. Read [prepared states](references/prepared-states.md) for the procedure.

## Studio test session

- `start_game_test` works from either Edit World or user Preview. It validates the saved source and optional `game_test_support/` overlay, compiles a Game Test artifact, and opens it in a separate Studio iframe. It returns `testSessionId`, source identity, and an initial state-only observation (without a screenshot). It replaces this task's previous test instance, and Edit/Preview switches retain it.
- Switching between Edit World and user Preview retains the active persistent test session and its `test_session_id`. Studio repositions the test monitor and keeps the resident world interactive while the test remains active.
- `run_game_test` takes that ID as `test_session_id` and executes `test_script` in the same running game. It does not compile, reload, or reset the world. Repeating a script is allowed.
- `stop_game_test` disposes the named instance. Repeated Stop is safe, and an old ID cannot stop a replacement.

The game continues while you inspect results or think. Game state remains between calls; script-local variables do not. Edits to game source or Game Test support leave the running artifact unchanged and mark later results stale. If further runtime evidence from the saved version is needed, call Start again and use the new ID.

A race, timer, or animation may have ended since the last result. Check the current prerequisite before a dependent action; keep time-sensitive setup, action, and observation together in one script.

Use these sessions with browser Studio connected. Cross-peer simulation is a separate route below.

## Cloud persistence evidence

When the test concerns `room` or `player` cloud persistence, select the relevant checks below through visible UI and the public status surface. Never inspect Preview adapters, database rows, object storage, payload bytes, credentials, or service-only receipts.

- On the first cold boot, assert `t.cloudPersistence().loadState === 'ready'`, `revision === null`, and the game's documented default state. A null revision proves an empty first visit, not a load failure.
- Drive the authored Save button with `clickDom`, then `waitUntil` the public status reaches `saveState === 'saved'`. Assert a positive committed `revision` and non-null `savedAt`; button text or local serialization alone is not save evidence.
- Run Preview again from a cold boot and assert the same committed revision or restored gameplay fact. `save → reload` requires two real runs; `restorePersistenceSlot` tests browser-local state and does not prove cloud restore.
- During `loading`, the game must keep its promised operations gated and show `Loading save...`. During `error`, it must keep the gate closed and expose a visible Retry action. Click Retry through UI; `t.retryCloudLoad()` exists for public-command diagnosis, not as a replacement for testing the authored button.
- Double-click Save before a receipt. The second click must be refused or inert while `saving`; assert only one revision advance and one final `Saved` state. Use `t.requestCloudSave()` only to diagnose the public command path.
- In `run_multiplayer_test`, `m.cloudPersistence(peer)` reads that peer's public Room/Player status, while `m.requestCloudSave(peer)` and `m.retryCloudLoad(peer)` send payload-free client actions. The peer handle comes from `m.join`; it is not a Player ID supplied to the save service.
- For room mode, verify the manual Save control is available only to the current management Host. For player mode, verify each peer sees only its own status. If the environment offers no supported way to produce a load/save failure, report that failure branch as unverified rather than inventing adapter access.

## Observe what matters

`await t.getState()` returns a compact summary without capturing an image: visible HUD/menu selectors, authoring IDs, text, values, disabled/interactable facts, plus viewport, frame/time, page visibility, Pointer Lock, recent errors, and capture status. Use `await t.getState({ screenshot: true })` only when pixels are needed for a visual conclusion; `{ screenshot: false }` explicitly keeps an observation state-only.

The summary focuses on visible UI and runtime facts. It is bounded and reports truncation; image and DOM sampling are not atomic. Use returned selectors or selectors verified in project source rather than guessing controls.

For a narrower question, use `domText`/`domCount`, `findObject`/`findNode`, `queryUserData`, or `sceneSnapshot` as appropriate. Object snapshots contain tuple coordinates, not live Three objects. `sceneSnapshot()` is a bounded scene/camera diagnostic; `snapshot()` remains its compatibility name. Names and managed keys come from this project's source.

For camera or motion questions, measure movement in the intended basis (such as view-forward and view-right) and inspect the project's heading convention rather than assuming `rotation[1]` is authoritative. For camera-relative controls, run the signed movement probe in the [camera guide](../wanaka_game_specialist/references/guides/camera.md); W-only movement, opposite-but-unlabeled displacement, or a changed heading alone cannot prove the labels are correct. For captured mouse look, check direction as well as pose change and distinguish captured from uncaptured movement. A top-down camera can translate without yawing, and intentional follow lag can leave the actor off center. Use a current screenshot when framing, obstruction, subject readability, or off-camera interaction is the question.

For lighting or grading diagnostics, capture only views needed to resolve the issue with the subject, floor, background, fog, or shadows. For a depth-of-field claim, inspect the player or weapon/viewmodel, ground, and first target in the relevant effect states; the intended sharp subject must not appear blurred.

For UI diagnostics, read [Game UI](../wanaka_game_specialist/references/guides/ui.md) and inspect only the states and viewports needed to answer the question.

For shooters, inspect the viewmodel or body, reticle, camera framing, and fire/release feedback relevant to the test question. Where the game uses the shooter reticle, fire held grows `--wk-reticle-gap` and release recovers it; aiming should use the intended narrower gap. For Pointer Lock menu issues, compare the relevant playing, paused, and resumed ownership transitions. For combat, distinguish a committed live hit from a miss, duplicate damage, or a dead target.

For asset-placement diagnostics, inspect the relevant scale, grounding, intersections, or visible versus collision geometry; one asset may replace multiple placeholders, so old counts or bounds are not sufficient. Exercise a changed route when clearance is in question. Exact-name queries and bounded scene dumps aid discovery but do not prove all unseen objects are absent. If a route cannot be driven reliably, report the uncovered behavior rather than changing game source merely to make an ambiguous probe succeed.

## Write a script

Pass plain JavaScript as `test_script`; `t`, `await`, and JSON-safe `return` are available directly. TypeScript annotations, imports, and `as const` are not part of this script format. Use the generated `t.*` table below for signatures.

```js
const clicked = await t.clickDom('[data-wanaka-authoring-id="ui/start"]'); // Replace with an observed selector.
await t.waitFrames(1);
return { clicked, state: await t.getState({ screenshot: true }) }; // Request pixels only for a visual conclusion.
```

```js
return { player: t.findObject('Player'), frame: t.frame() }; // A narrow fact needs no full observation.
```

`test.step('title', async (t) => { ... })` is optional grouping. Registered callbacks execute in order in the same world and may return JSON-safe data. Assertions, logs, and issues are optional diagnostics, not completion requirements. A failed assertion is recorded without aborting execution; throw a normal JavaScript error when the script cannot meaningfully continue.

Collect related observations together instead of making a tool call for each fact. For dependent checks, guard the prerequisite first: an early return can end a direct script with an explanation, or a thrown error interrupts the execution and skips remaining registered steps. Returning from a step callback only ends that callback. A failed input receipt or assertion does not cancel later checks on its own.

## Inputs and results

Tests drive the same InputSession and DOM UI described by the game's [input handling guide](../wanaka_game_specialist/references/guides/input-handling.md). Keyboard input is dispatched to `window`; supported values and code aliases are normalized, while unknown keys throw. `pressKey` schedules release after its hold-frame count. `clickDom` resolves a visible, interactable control, dispatches at its center, and focuses it after an uncancelled mouse-down; use a returned selector or the project's authoring ID and inspect its boolean result. `clickCanvas` sends canvas pointer down/up without a DOM click. DOM events bubble into the window input path, so the game owns suppression of unintended gameplay actions.

Pointer and touch methods accept canvas-local pixels, normalized canvas coordinates, a DOM authoring ID or selector, or a scene object ID; their receipts describe dispatch, not gameplay success. `movePointer` supplies relative movement, and `setGamepad` supplies a deterministic virtual device rather than a physical controller. Synthetic events do not reproduce every browser default or grant trusted user activation.

Keys, pointer buttons, touches, and virtual gamepads are released at execution end or cancellation. Keep a hold and its observation in the same call. Use `waitUntil` for observable transitions, `waitFrames` for frame-relative behavior, and `waitRealSeconds` for wall-clock questions; frame count may advance while gameplay is paused, and a false `waitUntil` is an unmet condition rather than a game verdict.

Pointer Lock is simulated without capturing the OS pointer. The game must request it synchronously from a recognized activation handler; use the real Start/Resume control or canvas, then read `t.readPointerLockState().owner` after a frame. Once the canvas owns capture, `clickCanvas` can drive captured gameplay. `requestPointerLock()` only reads ownership. Lock survives ordinary calls and script errors; release it through `releasePointerLock` or the game's exit flow. A pending request is not lock loss.

Results contain execution status, returned observations, logs/errors, capture-delivery counts, and the remaining per-turn `startsRemaining` and `executionsRemaining` budgets (`start_game_test` resets the game world, not `executionsRemaining`; both budgets reset on the next turn). Each run also audits visible project `BoxGeometry`, `PlaneGeometry`, `CircleGeometry`, and `RingGeometry` surfaces for coplanar overlap (z-fighting) and records `Coplanar surface overlap detected ...` in `runtimeErrors` (`source: 'boundary'`) when conflicting faces share a plane; clean scenes emit no coplanar diagnostic. Execution completion does not decide whether the game is correct. Interpret observations against the task and distinguish a script problem, an environment failure, and observed game behavior.

Requested screenshots from `getState` or `screenshot` are delivered as inline images when capture and delivery succeed. `screenshot()` returns no image object; `capturedScreenshot()` is the latest captured data URL for that execution/step. Inspect delivered pixels for visual conclusions. Automatic exception captures and failure-state files are on-demand diagnostics; open them only when useful. A missing image leaves its visual question unanswered, not all collected state invalid.

Ordinary script errors retain the world for another probe. A script deadline retires the instance and may return partial observations; check `sessionAvailable`. Page visibility and manually advanced frames are environment facts, not automatic game failures. Background timing is not guaranteed real time.

## Multiplayer

The Studio test iframe is one visible game instance configured with a solo room. Use it for local input, DOM, and visual observations. For a multiplayer-authored project, `t.room()` reports the local Solo room: one player, one peer, and local authority. Its declared player bounds remain unchanged, and `roomSession` exposes local observations without online room controls. Gameplay starts after Solo initialization, so use authored input directly. This does not test a real lobby, remote peers, server authority, or cloud persistence.

For shared simulation questions, `run_multiplayer_test` runs suites under `game/multiplayer_test/` for a project declaring `game/multiplayer.ts`. It loads the simulate module on headless peers with one authority and a seeded loopback network. Use the game's declared collection, field, and action names; unknown names fail type checking. A useful shared-behavior check causes a known fact from a non-authority peer and observes it on the others. See the [suite authoring guide](../wanaka_game_specialist/references/guides/multiplayer-rooms.md#verifying-the-room-gamemultiplayer_test) and the generated `m.*` table below.

The harness also runs fixed UNIVERSAL diagnostics for convergence, contract agreement, late join, departure, replica writes, and settled motion. These and suite assertions are simulation diagnostics, not a requirement that all testing pass before the task may finish. For `assertNear`, an omitted tolerance derives a bound from measured speed and the selected network condition; read both distance and bound. Reuse the returned seed for same-machine reproduction, open a trace only when the summary is insufficient, and repair a missing or invalid suite instead of rerunning it.

## Test focus

Further investigation can end before every uncertainty is resolved. Weigh the likely value of another observation or setup change against the additional delay. When handing off, close any active test session and report important limits of the evidence collected.

Standard game-save slots use session-local memory. This isolation covers the standard save adapter; project-authored storage and network requests retain their own side effects.

The complete generated `t.*` and `m.*` APIs follow. They are separate contexts; methods from one are not available on the other.

<!-- BEGIN GENERATED t.* API (pnpm gen:skill) -->

## `t.*` Test Context API

These are all methods exposed to inline Engine Preview tests. Any other `t.*` call is rejected before execution.

| Name | Signature | Description |
| --- | --- | --- |
| `assert` | `assert(condition: boolean, message: string): void` | Record a boolean assertion. |
| `assertApprox` | `assertApprox(actual: number, expected: number, tolerance: number, message: string): void` | Compare finite numbers within tolerance. |
| `assertEqual` | `assertEqual(actual: unknown, expected: unknown, message: string): void` | Record JSON-structural equality. |
| `capturedScreenshot` | `capturedScreenshot(): string \| null` | Data URL of the latest screenshot captured in this execution/step, or null. Does not capture another image. |
| `clearGamepad` | `clearGamepad(index: number): void` | Remove a deterministic virtual Gamepad. |
| `click` | `click(x: number, y: number, button?: number): void` | Dispatch pointer down/up on the game canvas. Does not dispatch a click event, so it cannot grant Pointer Lock from a click listener; after owner is canvas, use it for captured left-button gameplay. |
| `clickCanvas` | `clickCanvas(x: number, y: number, button?: number): void` | Dispatch canvas pointer down/up at iframe client-pixel coordinates, without synthesizing a DOM click. |
| `clickDom` | `clickDom(selector: string): Promise<boolean>` | Click an interactable DOM element at its center, focusing after uncancelled mouse-down. Use an observed selector or authoring ID. Returns false with diagnostics for missing, hidden, non-interactable or removed targets. Uses synthetic events in Studio, not all native browser default actions. |
| `cloudPersistence` | `cloudPersistence(): CloudPersistenceStatus` | Read the current public cloud load/save status. Stored bytes and service receipts are never exposed. |
| `domCount` | `domCount(selector: string): number` | Count DOM elements matching a CSS selector, including HUD overlay nodes. |
| `domText` | `domText(selector: string): string \| null` | Read textContent from the first visible DOM element matching a CSS selector. Hidden nodes (`display:none`, `visibility:hidden`, or `[hidden]`, including ancestors) return null. |
| `findAllObjects` | `findAllObjects(name: string): GameObjectSnapshot[]` | Snapshot every real Object3D with this name. |
| `findById` | `findById(id: string): GameObjectSnapshot \| null` | Snapshot the Object3D with this uuid from a prior snapshot() line. |
| `findNode` | `findNode(key: string): GameObjectSnapshot \| null` | Snapshot one stable managed-scene node by its exported nodes key. A miss logs the keys that do exist. |
| `findObject` | `findObject(name: string): GameObjectSnapshot \| null` | Snapshot the first real Object3D with this name. A miss logs the named objects already in the scene so the next script can address one of them. |
| `frame` | `frame(): number` | Read the current Play frame count. |
| `getState` | `getState(options?: { screenshot?: boolean }): Promise<GameTestState>` | Observe bounded visible HUD/DOM and runtime facts without an image by default; pass screenshot: true for visual evidence. Not a full scene or accessibility tree. |
| `keyDown` | `keyDown(key: string): void` | Dispatch a browser keydown on `window`. Pass `KeyboardEvent.key`. |
| `keyUp` | `keyUp(key: string): void` | Dispatch a browser keyup on `window`. Pass `KeyboardEvent.key`. |
| `log` | `log(message: string): void` | Add a diagnostic line to the current execution/step. |
| `movePointer` | `movePointer(deltaX: number, deltaY: number): void` | Dispatch relative pointer movement on the game canvas. |
| `objectCount` | `objectCount(name: string): number` | Count real Object3D nodes with this name. |
| `pointerDown` | `pointerDown(target: RuntimeInputTarget, button?: number, pointerId?: number): RuntimeInputReceipt` | Dispatch one pointer-down action against a stable target. |
| `pointerEnter` | `pointerEnter(target: RuntimeInputTarget, pointerId?: number): RuntimeInputReceipt` | Dispatch pointerenter against a stable target. |
| `pointerLeave` | `pointerLeave(target: RuntimeInputTarget, pointerId?: number): RuntimeInputReceipt` | Dispatch pointerleave against a stable target. |
| `pointerMove` | `pointerMove( target: RuntimeInputTarget, deltaX?: number, deltaY?: number, pointerId?: number, ): RuntimeInputReceipt` | Dispatch one pointer-move action against a stable target. |
| `pointerUp` | `pointerUp(target: RuntimeInputTarget, button?: number, pointerId?: number): RuntimeInputReceipt` | Dispatch one pointer-up action against a stable target. |
| `pressKey` | `pressKey(key: string, holdFrames?: number): void` | Hold a `window` key for one or more Play frames. Pass the `KeyboardEvent.key` value (`'w'`, `'ArrowLeft'`, `' '`, `'Shift'`, `'F5'`). Letters map to `Key*`, digits to `Digit*`, and supported named keys and function keys (`F1`–`F24`) map to their standard `KeyboardEvent.code`. Supported code aliases such as KeyW and Space also work. Unknown keys throw. Release is scheduled by frame count; wait within this execution to observe the hold. |
| `queryUserData` | `queryUserData(name: string, key: string): unknown` | Read one JSON-safe gameplay fact from Object3D.userData. |
| `readPointerLockState` | `readPointerLockState(): RuntimePointerLockState` | Read test Pointer Lock ownership as `{ locked, owner, ownerTag }`. `owner` is `none`, `canvas`, or `another-element`. |
| `releasePointerLock` | `releasePointerLock(): void` | Release test Pointer Lock when the canvas owns it. |
| `reportIssue` | `reportIssue(severity: 'critical' \| 'major' \| 'minor', description: string): void` | Add a critical, major, or minor issue. |
| `requestCloudSave` | `requestCloudSave(): void` | Send the same payload-free Save intent as the game's Save UI. |
| `requestPointerLock` | `requestPointerLock(): Promise<boolean>` | Read whether the game canvas currently owns test Pointer Lock. Does not request a lock. |
| `restorePersistenceSlot` | `restorePersistenceSlot(slot: string): Promise<boolean>` | Restore the play composition's persistence slot; false when empty. Available when Play created one PersistenceSession with the runtime session identity. |
| `retryCloudLoad` | `retryCloudLoad(): void` | Retry the current Player's or Room's failed cloud restore. |
| `room` | `room(): RuntimeTestRoomFacts` | Read this multiplayer test run's room facts (formation, own player id, player and attachment counts, authority); throws for a solo project with no room configured. |
| `savePersistenceSlot` | `savePersistenceSlot(slot: string): Promise<void>` | Write the play composition's persistence slot. Available when Play created one PersistenceSession with the runtime session identity. |
| `sceneSnapshot` | `sceneSnapshot(): string` | Read a bounded scene tree and camera, separately from the visible UI observation. |
| `screenshot` | `screenshot(): Promise<void>` | Capture the submitted GPU frame plus registered DOM HUD overlays and attach it to the execution result for inline delivery. Returns no image value. |
| `setGamepad` | `setGamepad(index: number, state: RuntimeGamepadState): void` | Set deterministic virtual Gamepad state sampled by InputSession. |
| `snapshot` | `snapshot(): string` | Compatibility name for sceneSnapshot: bounded scene tree and camera, not the getState UI observation. |
| `touchEnd` | `touchEnd(target: RuntimeInputTarget, points?: readonly RuntimeTouchPoint[]): RuntimeInputReceipt` | Dispatch a single- or multi-touch end against a stable target. |
| `touchMove` | `touchMove(target: RuntimeInputTarget, points: readonly RuntimeTouchPoint[]): RuntimeInputReceipt` | Dispatch a single- or multi-touch move against a stable target. |
| `touchStart` | `touchStart(target: RuntimeInputTarget, points: readonly RuntimeTouchPoint[]): RuntimeInputReceipt` | Dispatch a single- or multi-touch start against a stable target. |
| `waitFrames` | `waitFrames(count: number): Promise<void>` | Wait for real Play frames (0..600 per call). |
| `waitRealSeconds` | `waitRealSeconds(seconds: number): Promise<void>` | Wait unscaled wall time. |
| `waitUntil` | `waitUntil(predicate: () => boolean, maxFrames: number): Promise<boolean>` | Poll a predicate once per frame (0..600 frames per call). |
| `wheel` | `wheel(deltaY: number): void` | Dispatch a wheel delta on the game canvas. |

### `GameObjectSnapshot`

`findObject`, `findNode`, `findAllObjects`, and `findById` return this shape. `position`, `rotation`, and `scale` are `[x, y, z]` tuples, not Three.js `Vector3`. `snapshot.position.y` is `undefined`; read `snapshot.position[1]`.

| Field           | Type                                |
| --------------- | ----------------------------------- |
| `id`            | `string`                            |
| `name`          | `string`                            |
| `position`      | `readonly [number, number, number]` |
| `rotation`      | `readonly [number, number, number]` |
| `scale`         | `readonly [number, number, number]` |
| `userData`      | `Readonly<Record<string, unknown>>` |
| `visible`       | `boolean`                           |
| `worldPosition` | `readonly [number, number, number]` |

### `CloudPersistenceLoadState`

Public load phase exposed by cloud persistence clients and test probes.

`disabled`, `loading`, `ready`, `error`.

### `CloudPersistenceSaveState`

Public save phase exposed by cloud persistence clients and test probes.

`idle`, `saving`, `saved`, `error`.

### `CloudPersistenceStatus`

Client-visible cloud persistence state; it never includes stored bytes or credentials.

| Field       | Type                           |
| ----------- | ------------------------------ |
| `errorCode` | `string \| null`               |
| `loadState` | `CloudPersistenceLoadState`    |
| `mode`      | `'none' \| 'room' \| 'player'` |
| `revision`  | `number \| null`               |
| `savedAt`   | `string \| null`               |
| `saveState` | `CloudPersistenceSaveState`    |
| `target`    | `string`                       |

### `GameTestState`

Compact visible game UI, not a browser accessibility tree or a scene dump.

| Field         | Type                                                                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errors`      | `readonly string[]`                                                                                                                                                                                                         |
| `frame`       | `number`                                                                                                                                                                                                                    |
| `observedAt`  | `string`                                                                                                                                                                                                                    |
| `pointerLock` | `{ readonly locked: boolean; readonly owner: string }`                                                                                                                                                                      |
| `screenshot`  | `{ readonly requested: boolean; readonly captured: boolean }`                                                                                                                                                               |
| `truncated`   | `boolean`                                                                                                                                                                                                                   |
| `ui`          | `readonly { readonly selector: string; readonly authoringId: string \| null; readonly role: string; readonly text: string; readonly value: string \| null; readonly disabled: boolean; readonly interactable: boolean; }[]` |
| `viewport`    | `{ readonly width: number; readonly height: number }`                                                                                                                                                                       |
| `visibility`  | `string`                                                                                                                                                                                                                    |

### `RuntimeGamepadState`

Deterministic virtual gamepad state used by RuntimeTestContext.

| Field         | Type                 |
| ------------- | -------------------- |
| `axes`        | `readonly number[]`  |
| `buttonsDown` | `readonly boolean[]` |

### `RuntimeInputReceipt`

The observable result of resolving and dispatching one test input action.

| Field              | Type                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `actionId`         | `string`                                                               |
| `actualPoint`      | `readonly [number, number] \| null`                                    |
| `consumed`         | `boolean`                                                              |
| `defaultPrevented` | `boolean`                                                              |
| `eventTarget`      | `string \| null`                                                       |
| `failure`          | `'target-not-found' \| 'outside-viewport' \| 'invalid-target' \| null` |
| `resolvedTarget`   | `RuntimeInputTarget \| null`                                           |

### `RuntimeInputTarget`

Pass a target inline or bind it to a variable in plain JavaScript. The script checker preserves a literal `kind`; TypeScript assertions such as `as const` are not valid script syntax.

| `kind`           | Fields                   |
| ---------------- | ------------------------ |
| `'canvas-local'` | `x: number`, `y: number` |
| `'normalized'`   | `x: number`, `y: number` |
| `'dom'`          | `authoringId: string`    |
| `'dom-selector'` | `selector: string`       |
| `'object3d'`     | `id: string`             |

```js
t.pointerDown({ kind: 'canvas-local', x: 0, y: 0 });
t.pointerUp({ kind: 'canvas-local', x: 0, y: 0 });
```

### `RuntimePointerLockOwner`

Pointer Lock owner categories exposed to RuntimeTestContext.

`none`, `canvas`, `another-element`.

### `RuntimePointerLockState`

Pointer Lock state observed by a RuntimeTestContext probe.

| Field      | Type                      |
| ---------- | ------------------------- |
| `locked`   | `boolean`                 |
| `owner`    | `RuntimePointerLockOwner` |
| `ownerTag` | `string \| null`          |

### `RuntimeTestRoomFacts`

Object returned by `room()`.

| Field            | Type             |
| ---------------- | ---------------- |
| `authority`      | `boolean`        |
| `formed`         | `boolean`        |
| `me`             | `string \| null` |
| `peerCount`      | `number`         |
| `playerCount`    | `number`         |
| `roomInstanceId` | `string \| null` |

### `RuntimeTouchPoint`

| Field        | Type     |
| ------------ | -------- |
| `identifier` | `number` |
| `x`          | `number` |
| `y`          | `number` |

<!-- END GENERATED t.* API -->

<!-- BEGIN GENERATED m.* API (pnpm gen:skill) -->

## `m.*` Multiplayer Test Context API

These are all methods exposed to `game/multiplayer_test/*.ts` steps run by `run_multiplayer_test`. Any other `m.*` call fails the type check before the run.

| Name | Signature | Description |
| --- | --- | --- |
| `actions` | `actions(peer: HarnessPeer): SimActionsOf<TDeclare>` | The action dispatchers the game declared, dispatched as this peer. |
| `assert` | `assert(condition: boolean, message: string): void` | Record a boolean assertion. |
| `assertApprox` | `assertApprox(actual: number, expected: number, tolerance: number, message: string): void` | Compare finite numbers within a tolerance. |
| `assertEqual` | `assertEqual(actual: unknown, expected: unknown, message: string): void` | Record JSON-structural equality. |
| `assertNear` | `assertNear( actual: Pose, expected: Pose, toleranceMeters: number \| undefined, message: string, ): void` | Assert two poses are within a distance in meters; pass `undefined` as the tolerance to derive it from the current network condition and from the measured speed and playout depth of the peer and entity `actual` was read from, so `actual` should be the remote peer's pose. |
| `authorityPose` | `authorityPose(collection: string, key: string): Pose` | The pose of an entity's physics body on the authority. |
| `cloudPersistence` | `cloudPersistence(peer: HarnessPeer): CloudPersistenceStatus` | Read this peer's public cloud load/save state; no payload, key, credential, or service adapter is exposed. |
| `hold` | `hold(peer: HarnessPeer, command: CharacterCommand): void` | Keep feeding this command to every character the peer controls until release. |
| `intentGap` | `intentGap( peer: HarnessPeer, actionName: string, collection: string, targetKey: string, ): IntentGap` | Distance between where this peer saw the target when it dispatched the action and where the authority's body was when it processed it. |
| `join` | `join(count: number): Promise<readonly HarnessPeer[]>` | Add players to the room and return their handles; a join after the first run is a late join. |
| `leave` | `leave(peer: HarnessPeer): void` | Remove a player from the room; the authority cannot leave. |
| `log` | `log(message: string): void` | Append a line to the step's log. |
| `motion` | `motion(peer: HarnessPeer, collection: string, key: string): MotionDiagnostics` | Motion diagnostics for an entity on this peer: snap, blend, accurate, and skipped counts, ack lag, and playout depth. |
| `network` | `network(preset: NetworkPresetName): void` | Select the named network condition for every peer from now on; unset means a clean network. |
| `pose` | `pose(peer: HarnessPeer, collection: string, key: string): Pose` | The presented pose of an entity on this peer's screen after interpolation and correction. |
| `records` | `records(peer: HarnessPeer, collection: string): readonly EntityRecordView[]` | The records of a collection as this peer currently sees them. |
| `release` | `release(peer: HarnessPeer): void` | Stop feeding a held command; the peer's characters go idle. |
| `requestCloudSave` | `requestCloudSave(peer: HarnessPeer): Promise<void>` | Send the same payload-free Save intent as this peer's game UI. |
| `retryCloudLoad` | `retryCloudLoad(peer: HarnessPeer): Promise<void>` | Retry this peer's failed Room or Player restore through the public client command. |
| `run` | `run(ticks: number): void` | Advance every peer by the given number of room ticks at 60 Hz. |
| `seed` | `seed(value: number): void` | Override the default seed before the first join; the seed only changes which frames are dropped, delayed, or reordered. |
| `state` | `state(peer: HarnessPeer): SimStateOf<TDeclare>` | The shared state tree as this peer currently sees it, read-only. |

<!-- END GENERATED m.* API -->
