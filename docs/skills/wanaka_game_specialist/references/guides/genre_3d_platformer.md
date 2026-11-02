# Genre: 3D Platformer

Treat the course shapes below as decision lenses, not mutually exclusive templates. Identify the primary repeated traversal decision, then compose supporting shapes when the brief calls for them. Do not force a real request into one label or expose these internal labels as product content.

## Choose the course

- `course-platformer`: route reading, jump commitment, landing control, checkpoints, goal, and restart.
- `precision-platformer`: repeatable movement, fast recovery, clear collision silhouettes, and consistent input/camera.
- `obstacle-run`: moving hazards and platforms with readable phases and safe windows.
- `collectathon`: traversal-driven search, stable collectible identities, meaningful completion or return loop.
- `hub-adventure`: routes and unlocks persist while local hazards and movement transients reset.
- `technical-tower`: sections teach and combine techniques with visible next goals, shortcuts, and deliberate recovery costs.
- `incremental-escape`: an advancing threat pressures each attempt while earned movement, route, or recovery upgrades materially change later runs.
- `cooperative-hazard-escape`: distinct player controllers plus one shared hazard, rescue, objective, and result authority. It is an online multiplayer project; start with the `wanaka:wanaka_game_multiplayer` Skill. Local split-screen, a second avatar, or a UI label is not that path.

An underspecified bounded request SHOULD include a visible entry, onboarding, escalating traversal decisions, checkpoint recovery, terminal goal, result, and restart. A hub or collectathon MAY remain active instead of fabricating a terminal result.

Cooperative play is online multiplayer. A second local avatar, mirrored input, or UI label is not multiplayer; do not silently substitute single-player or claim cooperative completion without it.

## Movement ownership

Use the object, body, pose-authority, and lifetime rules in [physics.md](./physics.md). Platformer entity choices are:

- player: `CharacterController` for grounded movement;
- floors, walls, and fixed course geometry: `static` bodies;
- moving platforms: `kinematic` bodies when project code owns their motion;
- visual model, decoration, and ordinary collectibles: no body unless the selected mechanic needs physical interaction.

The loader applies the asset's rotation and recommended uniform scale. Character motion and semantic facing remain free of asset-specific correction; animation, squash, and any verified foot-offset adjustment stay presentation-only. Moving-platform carry, edge stability, crush behavior, and reset remain platformer-specific policy.

## Input and traversal

Keyboard, gamepad, and touch feed one planar movement channel and one set of action edges through [input-handling.md](./input-handling.md). Submit movement and jump on one `control(intent)` from a consumed `fixedInput` press edge, not held state. 3D camera-relative movement uses the planar basis from `camera.getWorldDirection(cameraForward)` in [camera.md](./camera.md); 2D/2.5D side-view movement locks Z and moves along X.

Air jump, dash, wall movement, ledge grab, grapple, and bounce are optional project mechanics. Add only promised verbs and give each one owner, resource rule, feedback, and recovery behavior. `jump()` returns false and ignores the call when airborne after coyote time; an air jump MUST use `setVerticalVelocity`.

## Course, hazards, and recovery

Author traversal beats with clear takeoff space, intended landing, failure volume, recovery route, and gameplay-camera view. Escalation SHOULD deliberately change timing, direction, width, height, movement, or hazard interaction.

Checkpoints use stable IDs and one recovery pose copied from `character.position` (the simulation pose for the selected binding). Respawn calls `character.reset({ position: recoveryPosition, facing: 'preserve', velocity: 'clear', jump: 'reset', groundContact: 'clear' })`. Then clear project-owned action/hazard transients and reset camera smoothing. Use previous/current committed positions for thin or fast trigger crossings.

Collectibles, checkpoints, hazards, and goals commit once. Visible danger and its rule volume MUST agree. Falling out of the level, touching a hazard, and timing out are distinct failures. Recovery MUST NOT award collectibles, advance checkpoints, or preserve an invalid action chain.

For incremental escape, separate durable unlocks from attempt identity, threat, route progress, temporary build, and failure. For cooperative escape, assign authority for each player, shared hazards, rescue/regroup, progress, disconnect behavior, and team result.

## Course composition and production quality

Translate the brief into both gameplay pillars and visual pillars before multiplying course content. Establish a readable macro route and one representative section that integrates movement, collision, camera, and the intended art direction. Expand from that shared standard so later sections change traversal decisions and remain visually coherent; a palette swap alone does not create a distinct area.

Simple physics shapes are appropriate for stable collision, but they do not require bare boxes as the visible final course. When the user asks for a polished or complete game, the visible world MUST have an intentional shape language, material hierarchy, landmarks, depth, lighting, and set dressing appropriate to the brief. When humanoid appearance is unspecified and stylized default bodies fit the course's art direction, load `WANAKA_DEFAULT_CHARACTER` through `model3DLoader`, pass `WANAKA_DEFAULT_CHARACTER.clipNames` into `attachAnimatedModelInstance`, and bind that presentation with `{ model }`; when the brief calls for a realistic or non-cartoon aesthetic, source a matching biped character via `search_native_assets` or `generate_game_asset` + `prepare_character`; the CharacterController capsule remains collision-only. A visible capsule, unarticulated block figure, or undecorated graybox MUST NOT be presented as final character or environment art unless that treatment is the requested style.

Use suitable installed or catalog assets for focal characters, landmarks, decoration, and audio when they materially support the requested fantasy and are available through the current asset flow. Procedural art MAY be final when it is a deliberate visual direction with layered forms and authored detail, not an unexplained fallback. If a promised asset or presentation layer cannot be acquired, report the limitation instead of silently downgrading the brief.

Each promised feedback channel MUST be connected to actual gameplay events. Empty audio registries, unused effect factories, comments, or source presence do not satisfy an audio, VFX, animation, or camera-feedback promise.

## Session, camera, and presentation

Keep traversal, recovery, respawn, and course transition as substates of active play under one session lifecycle. Pause freezes movement intent, hazards, movers, timers, collection, and settlement. Restart clears checkpoint, collectible, hazard, mover, timer, camera transition, and input-edge state; preserve only declared hub or durable progress.

Use one native camera owner and choose the camera contract from the course shape:

- **3D free-form platforming** uses Pointer Lock plus [third-person-orbit-look.ts](../../examples/third-person-orbit-look.ts) for desktop look (opening pause on the `wasCaptured && !pointer.captured && !isRequesting` capture-loss transition when `Escape` releases the lock), with obstruction resolution from a project-owned ray or sweep. Mobile uses the shared left-stick movement and right-stick or right-half-screen look state. The orbit camera reads the committed interpolated character presentation pose and keeps world-up.
- **3D one-way runs and fixed-camera courses** use a rigid offset follow or typed fixed-zone handoff. They do not provide manual camera rotation, mouse dragging, or Q/E/R camera keys. The camera frames the next landing or obstacle from the authored route.
- **2D and 2.5D side-view platforming** locks the gameplay plane to Z, uses X for movement and Y for jump, and uses a side orthographic or perspective camera. The camera follows the engine-interpolated `character.anchors.feet.position` directly. Prefer a fixed route-forward look-ahead (or no lead); if the lead follows direction, transition it with explicit hysteresis or bounded slew so reversing input cannot teleport the look-point across the player. Do not add a second `rawDeltaSeconds` exponential filter that makes the character or camera wobble.

After every handoff and resize, screen-forward input must still move toward the visible route. A platformer HUD MUST NOT mount `.wk-reticle`; that hook is reserved for screen-center shooting or ranged aiming.

Animation presents controller state; it does not move the actor root or decide gameplay outcomes.

The HUD shows the controls, goal, progress, ability state, failure reason, pause, and result actions that are relevant to this game's loop; it SHOULD NOT expose a generic checklist of unused systems. Audio, particles, camera impulses, and animation consume the events promised by the brief, such as jump, landing, checkpoint, collection, damage, recovery, or completion.

## Troubleshooting

- Missed landings, route escapes, or unreachable objectives can come from disagreement between visible geometry and collision volumes, or from movement and recovery using different poses. Trace the affected transition and its authoritative owner.
- Duplicate pickups, checkpoint rewards, or goal results point to once-only commit and reset ownership. Recovery should clear transient state while retaining the progression the game promises.
- Reversed camera-relative controls can come from a basis mismatch; [camera.md](./camera.md) describes the signed movement probe for that issue. A yaw change alone does not establish the input labels.
- A side-view camera snapping on reversal can come from flipping the full look-ahead offset in one frame. Check plane locking and the look-point transition.
- Occlusion or an unreadable landing can occur away from spawn. The affected route view is more informative than an unrelated opening screenshot; a visual observation describes only the revision and view actually observed.

## Implementation

### Genre-specific ownership

Keep one clear owner for session and traversal state, character movement, input mapping, post-physics rules, camera pose, and presentation feedback. These are responsibilities, not a required file list: co-locate them when the game is small, and split them only when independent lifetimes or complexity justify it. Preserve one authority per concern regardless of module boundaries.

### Managed roots

Expose meaningful roots such as player, course sections, important moving platforms, goal, and gameplay camera. Keep dense decoration, particles, collision proxies, and repeated minor collectibles code-owned unless Studio selection is a product requirement.

Finalize static course transforms before Play builds the selected bodies. Keep visible and collision boundaries aligned from the gameplay camera; follow the body, shape, and lifetime contract above.

### Physics profile

After static course transforms are final, await `PhysicsWorld.create(scope, scheduler, physicsOptions)`, create the selected static and kinematic bodies, then call `CharacterController.create(scope, physics, options)` for an unbound controller or `CharacterController.createAndBind(scope, physics, { ...options, object })` / `{ ...options, model }` when the presentation is available. The controller and every body MUST use the lifetime that owns the corresponding course or actor. Character binding does not run the rigid-body unit-scale check; pass the asset result's `recommendedScale` to the loader as `scale`, adjusting that one scalar only when gameplay needs another size, and keep capsule `radius` and `halfHeight` in meters.

Build `CharacterController` options from the selected project profile. Measure the character presentation and course, then record capsule radius and half-height, start position, slope, jump, crouch, stair, and floor-stick choices with units. Do not infer collider dimensions from a file name or copy values from this section.

The controller owns character motion. Gameplay reads `.position` and `isOnGround`. With `object`, that pose is the capsule bottom; with `model`, it is the capsule center. A bound `object` receives that simulation pose; a bound `model` root receives the feet (capsule center minus halfHeight+radius). Simulation records the pose after the physics post-step and interpolates onto the bound object in `preRender`. Respawn uses `reset()`; `teleport` is the immediate pose write — [physics.md](./physics.md). Do not set the player root transform after attachment.

Keep one action owner for every added traversal verb. If dash, air jump, bounce, wall movement, or grapple needs an operation absent from the current `CharacterController` declaration, implement a project mechanic with source checks and compilation or record an API gap; do not assign a fictional controller member.

### Input and simulation order

During `fixedInput`, merge selected devices into one planar command. For 3D camera-relative movement, reuse a `THREE.Vector3` target and take planar forward from `camera.getWorldDirection(cameraForward)` (forward xz, right `(-forward.z, forward.x)`) as in [camera.md](./camera.md), then submit one `control(intent)` with movement, facing, stance, and jump for that fixed step. World-space or 2D/2.5D side-plane velocity uses `movement: { kind: 'world', velocity }`. Use `setMoveIntent(velocityX, velocityZ)` only when the project deliberately drops facing, jump, stance, and control sequence. Submit a neutral intent when the current substate blocks movement.

The semantic frame's `jump: 'fixed'` consumes one press edge; a held key must not queue repeated jumps. If crouch is selected, put `stance: 'crouch' | 'stand'` in every frame — omitted stance is stand this step — and handle a rejected stand-up transition as observable state. Direct `jump()`, `setStance()`, and `setMoveIntent()` remain low-level operations for code that intentionally owns those channels separately; they MUST NOT be mixed with `control()` in the same step.

Sample committed character position and grounded state after physics before evaluating checkpoints, hazards, collectibles, and goals; do not evaluate a thin goal from a stale pre-physics transform.

### Checkpoints, hazards, and objectives

Keep previous and current `character.position` samples in project state. Initialize both on activation, reset, teleport, restart, and scene transition. For a thin trigger, test the committed segment against the declared native volume; for a broad occupancy zone, test the committed simulation pose required by the product rule.

Each checkpoint, collectible, hazard action, and goal has a stable identity and a once-only ledger rule. Separate the pure geometry result from the state commit so valid, invalid, reverse, repeated, and high-speed traces can be tested deterministically.

A checkpoint stores one owned recovery pose copied from `character.position`. On failure:

1. gate settlement and neutralize movement intent;
2. clear run-scoped action queues, mover or hazard contacts, transient scoring, and presentation edges;
3. call `character.reset({ position: checkpoint.position, facing: 'preserve', velocity: 'clear', jump: 'reset', groundContact: 'clear' })` exactly once;
4. seed previous/current position and camera smoothing from that recovery pose;
5. restore the selected active substate only after the recovery transaction is complete.

The visual player's feet may sit below a `model` root; checkpoint position is still `character.position` for the selected binding. Do not duplicate the same semantic checkpoint as unrelated literals in scene, state, and reset modules.

### Moving platforms

Moving platforms use a `kinematic` body under the physics contract above. Keep platform phase and reset state in one owner.

The current controller explicitly inherits the contacted ground's horizontal XZ velocity. It does not publish a complete vertical-carry or crush policy, so those behaviors remain project requirements rather than inferred controller guarantees.

The carry policy must handle standing, landing, riding, edge departure, reverse motion, pause, and respawn. If the selected native controller does not satisfy the product's carry or crush policy, report the gap or implement a project-owned policy. For runtime carry diagnostics, observe the relevant transition across multiple fixed steps; visual alignment alone does not prove stable carriage.

### Camera and animation

Create the camera in the scene factory and expose it through `nodes`. One camera module owns its pose. A free-form rig reads the committed player position, takes planar forward from `camera.getWorldDirection(cameraForward)` using a reused `THREE.Vector3`, uses a world-up ground basis, and applies orbit or obstruction correction in one presentation hook. A fixed or side-view rig follows the same committed interpolated presentation node without a second frame-time smoothing layer. Zone or fixed-camera changes are typed handoffs that reset the movement basis and smoothing seed without leaving an old writer alive. Projection changes belong to the host view's resize callback.

For a skinned GLB character, follow [Character models](assets.md#character-models) for loading, clip mapping, and animation ownership. When using `WANAKA_DEFAULT_CHARACTER`, pass `WANAKA_DEFAULT_CHARACTER.clipNames` into `attachAnimatedModelInstance` and bind that presentation with `{ model }`. Animation presents the grounded movement, jump, fall, landing, reset, and respawn states used by this platformer from controller and committed game state without moving the authoritative actor root.
