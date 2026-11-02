# Genre: 3D Racing / Driving

Treat the modes below as decision lenses, not templates to copy. Identify the repeated driving decision, then compose race rules, camera, and presentation around it. Do not expose these internal labels as product content.

## Choose the route

| Route | When | Motion owner |
| --- | --- | --- |
| Arcade racer (default) | Bare racing request; circuit, time trial, drift | Project integrator writes the kart `Object3D`. Jolt supplies kinematic and static boxes for contact queries only. |
| Simulation wheeled | Brief asks for realistic wheel physics, suspension, or rejects arcade handling | One `VehicleController` per vehicle. It needs world gravity and a driveable collision surface under the wheels. Read [physics.md](./physics.md), [vehicle.d.ts](../engine-api/vehicle.d.ts), [vehicle-drive.ts](../../examples/vehicle-drive.ts). |
| Specialized motion | Hover, rail, boat, aircraft | One transform owner and one collision authority. Flight belongs to [genre_flight_space.md](./genre_flight_space.md). |

Mixing `VehicleController` with a hand-written integrator on the same actor is a fail. Arcade is the default. [arcade-racer.ts](../../examples/arcade-racer.ts) proves integrator ownership, the kinematic bind, committed-pose display interpolation, a chase camera sharing that display pose, present-time lean, a whole model replacing the box-and-wheel fallback, and one `overlapAabb` with `{ ignore: [kartBody] }` — not a course, race, or HUD. That slice uses a pinned Porsche race-car look because it does not name an appearance.

An underspecified circuit request SHOULD ship a closed course, driveable handling, wall contact, ordered progress, a result, and restart. Hop, mini-turbo stages, particle pools, and custom postFX are not required unless the brief names them. Drag and endless drive take their course shape from the brief. Time trial is a session mode — its course follows the brief and MAY be a circuit.

## Course ownership

One centerline definition is the only road truth. Progress, surface, AI look-ahead, recovery, and the road mesh all read the same `query`. Never raycast the road mesh to decide pavement, grass, or lap.

`query(x, z, hintT)` returns arc-length `t` in `[0, 1)`, signed lateral offset, surface (`road` | `grass`), and travel tangent. Keep course math in a Three-free module so `unit_test/` can cover wrap, nearest-`t`, lateral sign, and surface bands.

A named circuit SHOULD be a closed spline resampled by arc length into a lookup table, with `closestT` searching a window around the last `t` before a full scan. When the brief promises a finished track, the path SHOULD change direction enough to read as a course from the chase camera. An oval or a stadium of two straights and two semicircles MAY prove `query` in `unit_test/` — it is not that finished track.

From the chase camera the course MUST read as a path, not a featureless strip. Kerbs or a racing line on the tighter bends are one way to mark it.

Starting-grid poses sit behind the start line, facing along the tangent, and MUST be separated before countdown ends.

A race with rivals SHOULD steer toward a look-ahead **point** on the same `query` (heading to that sample), not only the sample's tangent, while keeping each rival's lateral lane offset or avoiding nearby cars so side-by-side starters do not converge onto centerline `lateral = 0` right off the grid. Rubber-band throttle is optional. Full throttle into a bend tighter than `speed / yawRate` drives into the wall.

## Vehicle ownership

On the arcade route the project integrator is the only writer of the kart root. Bind a `kinematic` box to that root so Jolt reads its pose in `prePhysics`. Vehicle-local forward is `+Z`. Name the playable root `Player`.

Arcade display smoothing follows [project-owned fixed-step presentation](./physics.md#project-owned-fixed-step-presentation). Lean and pitch read the last fixed-step accel and lateral and run in `present`, not `step`. Separate the sprung bodywork group (`presentation.body` in [vehicle-wheel-visuals.ts](../../examples/vehicle-wheel-visuals.ts)) from the unsprung wheel hub pivots (`WheelHub:*` or fallback wheels): apply lean and pitch (`body.rotation.set(pitch, 0, roll)`) ONLY to the sprung bodywork group so the four tires remain planted on the road surface instead of lifting into the air or sinking into the asphalt during cornering and braking. Clamp longitudinal acceleration (`clamp(accel, -BRAKE, ACCEL)`) before driving visual pitch so wall-contact reflections do not flip the bodywork, and clamp visual pitch (`±0.035 rad`) and roll (`±0.045 rad`). With local `+Z` forward and `+X` right, nose-up under acceleration is negative `rotation.x`. NEVER lift the whole vehicle vertically by `Math.abs(Math.sin(roll))` (`bicycle-effect` two-wheel balance).

When a course has undulating elevation (hills, crests, ramps, or banked slopes), sample the road surface height at the four wheel footprints `(fl, fr, rl, rr)` rather than a single center point: place the root height at the four-wheel average `(fl + fr + rl + rr) * 0.25` and derive road-slope pitch and roll from the front-to-rear wheelbase `atan2((fl + fr) * 0.5 - (rl + rr) * 0.5, wheelbase)` and left-to-right track width, smoothed with a low-pass filter (`1 - Math.exp(-12 * dt)`), so the vehicle bridges crests and valleys without single-point vertical chatter.

Ship one whole vehicle, the way `attachArcadeRacer` replaces the box and wheels. When the brief does not name an appearance, resolve one fixed `race-car` look during authoring and write it directly into source. A go-kart request searches for a go-kart model. When the brief names an appearance — a red formula car, a motorcycle — search or generate that vehicle and load it through the same replacement. Do not ship the box-and-wheel fallback. The whole vehicle yaws together. NEVER treat the catalog model as chassis-only or overlay project-built wheels on it. Size the collision box and the contact radius to that model's footprint. The example's pinned Porsche is 2.05 m wide, 1.25 m tall, and 4.77 m long, with its mesh bottom on the ground. Its kinematic root sits at the body centre and the model is shifted down by the same amount, so the centered box covers that height and the tires stay on the road. A rigid whole-car GLB stays one visual. Independent wheel steer applies only when the shipped presentation actually exposes controllable wheels. The pinned Porsche exposes four wheel groups; other `race-car` variants need their own hierarchy inspection and wheel mapping. [vehicle-wheel-visuals.ts](../../examples/vehicle-wheel-visuals.ts) maps those exact nodes and preserves their authored rest transforms inside wheel-centred pivots; [arcade-racer.ts](../../examples/arcade-racer.ts) keeps the imported wheels rolling from signed travel and steers only the front pair after replacement. For another model, inspect its hierarchy and map its own wheel groups; a wheel name or an animation count alone does not prove independent wheels. A requested visible wheel-steering effect needs an articulated model or asset preparation, rather than silently accepting a rigid model. Do not add duplicate wheels over the asset.

Keep the authored track, road edges, and barriers that define the course layout. Choose their material the way the [assets guide](assets.md) does. Do not replace that geometry with model sections.

## Handling

Feel is a small set of named constants, not a physics vehicle. Tune these first:

| Channel | Role | Useful magnitude |
| --- | --- | --- |
| Top speed | Pavement target | 20–28 m/s |
| Accel / brake / coast | Reach, stop, idle decay | accel 8–12, brake 16–22, coast 3–5 |
| Closing accel | Pull near top speed | keep a closing term so throttle still changes speed near the cap |
| Steer damp | Input before yaw | λ ≈ 12–16 |
| Steer | Yaw authority that fades with speed | ~2 rad/s at walking pace, ~0.4–0.5 of that at top speed |
| Grip | Lateral-velocity decay | road 7–9, grass 3–5, drift ~2 |
| Off-road | Pavement privilege | grass top speed ~0.55 of road |
| Brake / reverse | Stop first | brake to rest, then reverse ~0.25–0.3 of top |
| Lean / pitch | Last fixed-step lateral and accel | lean out; nose up under accel |
| Drift | Optional kart verb | enter on steer + hold above ~0.4 top speed; release after ~1 s MAY grant a short boost |
| Wall | Stay on the course | reflect the approaching component; a hard hit keeps ~0.6–0.7 of speed |

Damp steer before it becomes yaw — raw ±1 is a binary turn. Brake to rest, then reverse; NEVER subtract brake through zero in one term. Near top speed keep the closing accel term so throttle still pulls. Yaw rate at top speed is about `steerRate × steerAtTop`. Turning radius is `speed / yawRate`. If the tightest bend on the course is tighter, raise steer-at-top or lower top speed — holding throttle into that bend otherwise hits the wall.

Steering follows the shared horizontal-intent sign: negative is driver-left and positive is driver-right. With local `+Z` forward and local `+Y` up, driver-right is local `-X`. Preserve that semantic sign through keyboard, touch, gamepad, and AI inputs as well as yaw integration and wheel presentation; perform any coordinate-basis conversion at the consuming calculation instead of reversing one input source.

Reversing mirrors steer. Carry world velocity across the heading change, then bleed the lateral part with grip — that is the slide. Do not invent hop, staged mini-turbos, or item hits unless the brief asks.

## Collision

Physics is detection, not a second vehicle. Create one `PhysicsWorld` (gravity unused). Barriers are `static` boxes along both shoulders. Each fixed step, `overlapAabb` around the kart with `{ ignore: [kartBody] }`, then the integrator responds: circle-versus-box (or 2D OBB) against a barrier, symmetric shove between karts, no spin-out. For a long, narrow car footprint (such as the `2.05 m × 4.77 m` race car), represent the car with two circles along its forward axis (front and rear, radius ≈ half-width) or a 2D OBB rather than a single half-length circle so side-by-side cars do not shove from metres apart and angled wall contacts match the bumper and flanks. When resolving analytical circle-versus-segment contacts against polyline barriers, clamp the longitudinal projection onto each segment (`clamp(proj, -segHalfLen, segHalfLen)`) before computing closest-point distance so curved segments never trigger infinite-line false hits across the track.

Query filters are `castRay` / `overlapAabb` `ignore` lists of bodies in that world. Pass the kart's own body so the query skips it; do not identity-filter the result afterward. Do not invent a general collision-layer API. Identify remaining bodies with a project map from `RigidBody` to barrier or rival. `onContactBegin` is optional; [arcade-racer.ts](../../examples/arcade-racer.ts) proves the `ignore` then integrator-responds path.

Visible road, shoulder, and barrier MUST agree with the query bands and the static boxes from the gameplay camera.

## Session, camera, and HUD

Countdown freezes integrator input. Racing advances checkpoints in order; crossing the start line after the last checkpoint counts a lap. Wrong-way is a sustained negative tangent-dot-velocity, not a single backward sample. Finished shows place and restart. Replay recreates run-scoped state without reloading the document.

Choose one integration path from [arcade-racer.ts](../../examples/arcade-racer.ts):

- `createArcadeKart`: register the callbacks yourself. In `fixedUpdate`, integrate motion, resolve contacts, then call `kart.commitPose()` once. In `preRender`, call `kart.present(step.alpha, step.deltaSeconds)`.
- `attachArcadeRacer`: those fixed-step and presentation callbacks are already registered; do not register them again.

For either path, register `attachArcadeChaseCamera` after the kart presenter (after awaiting `attachArcadeRacer` when used); it follows `presentationRoot`. Pair `kart.reset(position, heading)` with the returned camera snap callback.

HUD shows speed, lap, and place through `hudElement()` from `wanaka-studio-engine/dom` on `overlayContainer`. Minimap, drift meters, and title screens are optional.

Environment, lighting, and weather follow the Visual Style section of [render-pipeline.md](./render-pipeline.md#visual-style). A readable course needs a road ribbon, barriers, and some trackside depth — not a particle pool or a custom TSL compose.

After countdown the submitted camera sits behind the displayed kart. When the selected presentation exposes controllable wheels, steer and roll read as independent motion. A rigid whole-car GLB remains one complete visual without duplicate fallback wheels.

## Troubleshooting

- Reversed steering can come from disagreement between input mapping and the kart's own right basis. For a same-pose direction comparison, left input projects negative and right input positive onto that basis; opposite yaw deltas alone do not establish the labels.
- Escaping a bend or boundary can come from route-query, contact, or off-road response at the intended speed. Inspect the affected segment and the visible/collision boundary agreement.
- Incorrect laps, placement, results, or restart state point to ordered progress, result locking, and per-race reset ownership. A local progress issue need not become a full-race investigation.
- Poor course readability can come from chase-camera placement or follow behavior during the affected turn. For independently controlled wheels, distinguish steering from rolling transforms.
- Stepped motion during turns or drift can come from displaying fixed-step poses directly. Compare the committed and displayed position and heading with actual render-frame intervals; a refresh-rate setting alone does not establish the sampling cadence. Continuous `alpha=1` without a new fixed step holds the display at the current endpoint; inspect the simulation/render timing gap. Motion blur and camera yaw damping do not supply the missing vehicle pose samples.
- On the simulation route, unexpected motion can come from wheel contact, throttle/steer handoff, or multiple transform writers. Compile diagnostics belong to source repair, not a Preview investigation.

## Implementation

Keep one owner for course query, integrator, contact response, camera, and race state. Co-locate them when the game is small; split a Three-free `track` module early so unit tests can run. These are responsibilities, not a required file list and not a copy order.

The scene factory builds camera, lights, and static world (ground, road, barriers) from the same centerline Play will query. Play attaches `PhysicsWorld`, karts, input, race, and HUD. Input latches throttle, brake, steer, and optional drift during `fixedInput` through [input-handling.md](./input-handling.md). Integrator and contacts run in `fixedUpdate`. Visuals and chase camera run in `preRender`.

Read [arcade-racer.ts](../../examples/arcade-racer.ts) for integrator, kinematic, `overlapAabb`, and shared vehicle/camera display ownership. `attachArcadeRacer` loads a pinned Porsche race-car look because that slice names no appearance, and replaces the box-and-wheel fallback with that whole model. A named appearance searches or generates its own vehicle instead. Do not ship the fallback as the car. Course, race session, AI, and full camera composition stay in this guide. Do not copy the slice into the project as the game.
