# Genre: Flight

## Choose one profile

| Profile | Complete loop |
| --- | --- |
| `checkpoint-time-trial` | ground start → ordered swept gates → timed result → restart |
| `civil-free-flight` | engine start → ground roll → takeoff → stable cruise → landing |
| `arcade-combat-mission` | stable flight → target acquisition → weapon action → damage → mission result |
| `helicopter-lite` | grounded idle → collective lift → assisted hover/translation → rescue or landing |

An underspecified request SHOULD use `checkpoint-time-trial` with a compact airfield, stable chase camera, landmarks, failure, and restart. Full six-axis space combat is not covered by this guide; MUST NOT claim orbital movement, six-axis inertia, or a complete space-combat model from the atmospheric profiles.

## Flight ownership

Use Y-up and semantic aircraft forward `+Z`. Input becomes one normalized command state, which drives one authoritative attitude/velocity state and one transform writer. Collision, gates, weapons, camera, HUD, and audio all read that committed state.

Project-owned arcade flight MAY write the native object transform in a fixed scheduler phase. A kinematic physics body MAY mirror that pose for contacts but does not provide flight dynamics. A dynamic body instead owns the pose and requires a complete force/control model. NEVER combine dynamic-body ownership with authored pose integration.

Pass the asset result's `rotationDegrees` to `model3DLoader.load` and its `recommendedScale` as `scale`. Gameplay yaw, pitch, and roll remain free of asset-specific offsets. Keep display speed and world speed separate through one declared conversion.

## Input and camera

Create one `InputSession` with `InputSession.create(scope, scheduler, window)` and combine the selected keyboard, gamepad, touch, and pointer routes before changing flight state. Teach only controls that are wired. Pointer Lock MUST begin from a visible user gesture and release before cursor-driven UI. Free-look and pointer steering are separate channels unless the selected input map defines their handoff.

Use one camera pose owner; follow [camera.md](./camera.md) for the shared camera contract:

- A horizon-stable chase uses yaw or world-up projected forward and does not inherit pitch/roll.
- An attitude chase intentionally follows the full aircraft quaternion.
- Cockpit, chase, and flyby are typed handoffs on the same `RenderSession`, not separate render loops.

Frame the complete aircraft at ground idle, takeoff, cruise, bank, climb/descent, terrain approach, resize, reset, and camera switches.

## Profile rules

### Fixed wing

- Direct-heading integrates yaw; bank-to-turn derives coordinated yaw from roll.
- Pitch MUST affect the owned vertical-velocity channel, not only model rotation.
- Ground start distinguishes engine start, brake release, roll, rotation, airborne flight, landing, and crash.
- Stall and sink have explicit entry, recovery, and unrecovered-crash behavior.

### Helicopter lite

- Collective is not fixed-wing throttle. Ground idle MUST remain stable before deliberate lift.
- Assisted hover captures an altitude target and converges the same vertical-velocity channel used by climb/descent.
- Translation and yaw MUST NOT create another height writer.
- Rescue progress uses zone occupancy, altitude error, horizontal speed, and vertical speed, and shows which condition blocks it.

### Combat

Each weapon input resolves to accepted, no lock, out of range, no ammo, hit, or miss under one action identity. Locking uses the same forward vector as flight and exposes target, angle, distance, and progress. Damage, kill, result, and restart commit once.

## Gates, mission, and reset

A directed gate tests the previous/current aircraft segment against the gate plane and visible aperture in gate-local coordinates; a spherical gate uses a swept segment-sphere test. Only the current ordered gate may commit. A close pass resolves as pass, frame hit, wrong order, or miss.

Pause freezes flight integration, mission clocks, hover/lock progress, projectiles, and AI. Restart restores one spawn pose and clears velocities, commands, ground/air state, hover target, gate progress, damage, threats, projectiles, cooldowns, input edges, camera mode, warnings, and result. Reset previous/current samples and camera smoothing from that pose.

## Scene and HUD

The scene needs a readable spawn/departure area, route landmarks, objective zone, playable boundary, and approach corridors sized for aircraft bounds, maneuvering, and camera volume. Keep runway, helipad, gate apertures, combat lanes, and rescue volumes clear.

The HUD shows only selected-profile state: speed, altitude, vertical speed, heading, throttle or collective, objective, timer, warnings, hover, lock, ammo, and damage. Engine, stall, lock, weapon, gate, landing, crash, and result audio fire from state edges or stable actions.

## Troubleshooting

- Reversed controls, drifting neutral orientation, or unstable ground idle can come from axis conventions, multiple transform writers, or inappropriate integration while grounded.
- A target or gate that looks reached but does not commit can have a trajectory-sign, crossing-volume, or objective-state mismatch.
- A camera losing the aircraft or objective points to framing and pose ownership.
- Pause or restart retaining motion, weapons, or mission state points to clock and lifetime ownership.
- Profile-specific symptoms narrow the search: takeoff/stall/landing concerns flight state and contact; weapon acknowledgement concerns the shot/result path; lift/hover/rescue concerns the selected control and objective owners.

## Implementation

### Genre-specific owners

- The selected profile owns project parameters and their units.
- Typed flight state owns lifecycle, commands, attitude, velocity, route, objective, combat, and reset.
- One input owner maps the selected devices and Pointer Lock gesture into normalized commands.
- One simulation owner integrates aircraft state and writes the native transform.
- One rules owner commits gates, landing, rescue, collision, combat, and result.
- One active camera owner handles chase, cockpit, and flyby handoffs; presentation owns the scoped HUD, audio, animation, particles, warnings, and pools.

### State and parameter contract

Declare only fields used by the selected profile. Keep source-orientation normalization outside authoritative flight state.

| Family | Required state or parameters |
| --- | --- |
| lifecycle | phase, paused/result, mission substate, action-edge guards, selected profile |
| motion | position, previous position, velocity, display/world speed and one conversion owner |
| attitude | quaternion or one documented yaw/pitch/roll convention, command targets, response and auto-level policy |
| vertical | grounded/airborne, vertical velocity, ground contact, stall or hover target |
| route | ordered stable gate IDs, current gate, crossing state, and mission clock |
| combat | target ID, angle, distance, lock, ammo, cooldown and action/damage IDs |
| camera | active mode, target identity, commissioned framing and pose owner |

Every selected parameter records value, unit, and profile. Original tuning stays project-local and is never imported as a cross-profile constant table.

### Aircraft roots and asset orientation

Expose the aircraft gameplay root, important gate or target groups, terrain, and selected cameras. Keep dense scenery, projectiles, trails, and collision proxies code-owned unless they are meaningful authoring targets.

Use one gameplay root for the aircraft. Parent the loaded model beneath it only when origin alignment requires a local position offset, and keep the loader-applied rotation and scale unchanged. The gameplay root uses Y-up and local `+Z` forward without an asset-specific yaw or roll offset. Measure the final presented bounds and store profile geometry separately from flight state.

Create every selectable camera in the scene factory. The current render host submits one main `RenderView`; camera switching replaces that view through the existing `RenderSession` composition instead of creating another render loop.

### Input and Pointer Lock

Latch frame edges from `input.frame` for engine, camera, weapon, pause, and restart into pending commands once. During `fixedInput`, merge those commands with selected held keyboard, gamepad, and touch axes into one normalized command record, consume pending edges once, and submit neutral commands while the current phase blocks control.

Relative look follows [input-handling.md](./input-handling.md).

- Activation: a visible start/resume control, or the viewport surface when no button or menu exists, receives the real gesture. The handler calls `context.viewport.surface.requestPointerLock()` inside that gesture. The activation gesture does not also fire a flight action.
- Look: read `input.frame.snapshot.pointer.captured` once per rendered frame in `update`; only captured deltas may change yaw, pitch, or view commands. Do not add the same frame's `deltaX`/`deltaY` in multiple `fixedInput` steps.
- Pause and teardown: call `document.exitPointerLock()` before showing cursor-driven UI.

Do not mutate aircraft or camera state directly from parallel DOM handlers. Handlers publish typed intents that the scheduled input owner consumes once.

### Authored flight ordering

The supported atmospheric route uses project-owned state and one native aircraft transform writer. Commit the authored aircraft transform before a kinematic physics body reads it, consume physics-owned contacts and ground queries only after physics, and update camera and presentation from the final committed state.

Do not integrate authored movement from variable `update` deltas. The scheduler already owns the fixed step. One-shot objective and weapon actions use stable IDs so multiple fixed steps or contact callbacks cannot settle them twice.

The aircraft is a project-integrated kinematic body, so the single-authoritative-pose rule in [physics.md](./physics.md) applies to it unchanged: one fixed-step authoritative pose commit, presentation derived from committed state, and no presentation write-back. Flight is unusually sensitive to ownership mistakes because airspeed is high and attitude is integrated continuously: advancing the authoritative root again from leftover time makes gate, landing, and stall evidence frame-rate dependent, while a visual-only projection followed inconsistently by the model and camera produces visible separation or jitter without changing those authoritative rules.

#### Vertical ownership

Fixed-wing pitch, stall/sink, and ground response converge on one vertical velocity before position integration. Helicopter collective and hover assist converge on the same vertical channel. Keep ground contact and airborne transition state explicit so idle numerical noise cannot produce a landing or crash action.

For hover assist, a held vertical command selects climb/descent intent. On release, capture an altitude target; use altitude error and vertical damping to derive one bounded target vertical velocity, then converge the authoritative vertical velocity before the final Y integration. A hover/brake option may damp horizontal velocity but never writes Y independently.

### Optional physics boundary

Physics is not implicit. When selected, apply [physics.md](./physics.md) and keep the flight-specific policy below:

- create static bodies for terrain, runway, structures, and meaningful gate frames using measured shapes;
- bind one `kinematic` body to an authored-kinematic aircraft only when contact queries are required; the native aircraft transform remains the pre-physics authority;
- use scope-owned `onContactBegin` or `onContactEnd` callbacks as candidate facts, then apply once-only crash/damage identity rules;
- use `castRay(origin, direction, { ignore: [aircraftBody] })` with the complete direction vector for the closest ground hit when the aircraft has a kinematic body;
- treat `overlapAabb` as broad-phase candidates, not final narrow-phase proof. Pass the aircraft body in `ignore` so the candidate set does not include the querier.

A kinematic contact does not automatically produce a flight recovery response. The project must define and implement impact, stop, slide, damage, or crash policy. A dynamic aircraft instead gives transform authority to its rigid body and requires a separate force model; never combine it with the authored transform writer described above.

### Gate, rescue, and combat state

Store previous and current committed positions. Initialize both on activation, restart, teleport-like project reset, and scene transition. Directed gates use a segment-plane intersection followed by a gate-local aperture test. Spherical gates use a swept segment-sphere test. Stable gate order and once-only ledgers turn geometry results into progress.

Rescue hover reads committed zone occupancy, altitude error, horizontal speed, vertical speed, and stable time. Publish each condition so a stalled progress bar has an observable reason.

Implement the combat transaction with:

1. acknowledge the weapon edge with one action ID;
2. report miss, no-lock, range, and ammo outcomes;
3. acquire lock from the authoritative forward vector, target distance, and selected cone;
4. commit damage once through one resolver;
5. commit kill and mission result once;
6. clear target, projectiles, cooldowns, threats, and feedback on restart.

Keep target angular motion within the designed player tracking envelope. Runtime tracking measurements are diagnostic options, not a prerequisite for enabling target movement.

### Native camera and audio

One camera mode owns pose at a time. For horizon-stable chase, project aircraft forward onto the world-up plane and derive camera target and offset from that basis. For attitude chase, transform the commissioned offset by the complete aircraft quaternion and intentionally inherit bank. Cockpit free-look writes a camera-local orientation channel and not the aircraft transform.

Use a typed mode handoff for chase, cockpit, and flyby. Update the main view through the existing `RenderSession`, reset smoothing from the committed aircraft pose, and call `audio.bindListener(activeCamera)` for the selected view. The [multi-camera example](../../examples/multi-camera.ts) shows native view replacement and resize ownership.

`audio.play(url)` returns a scope-owned voice for an installed audio asset URL. Keep one engine voice owner; gate, warning, lock, weapon, impact, landing, and result clips fire from state edges. Pause and resume audio through the same session when the complete flight session pauses.

### Reset transaction

One reset owner performs this order:

1. gate settlement, neutralize commands, and release Pointer Lock;
2. clear profile-owned mission, gate, weapon, target, cooldown, pool, warning, and presentation state;
3. restore the commissioned gameplay root pose and all authoritative velocities/commands through the selected transform owner;
4. if physics is bound, relocate its supported kinematic or dynamic body only through the exact current body operation and clear supported velocities;
5. initialize previous/current positions, grounded/airborne state, hover target, camera smoothing, and audio edges from the restored pose;
6. re-enter setup or countdown without registering new hooks.

The rigid-body declaration exposes `teleport(position, rotation?)` and velocity setters. Use them only when that body is the selected aircraft authority. A pure authored aircraft resets its native project state and root; it does not create a physics body merely to obtain reset syntax.
