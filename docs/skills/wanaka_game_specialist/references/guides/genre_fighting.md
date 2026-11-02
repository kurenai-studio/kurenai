# Genre: Fighting

## Choose one route

| Route | Core loop | Result owner |
| --- | --- | --- |
| `versus-round` | duel, KO or timeout, round reset, match result | round wins and draw policy |
| `arena-brawler` | multi-actor combat with a bounded objective | score, stocks, elimination, or objective result |
| `platform-brawler` | combat plus launch, recovery, and ring-out | stocks, boundary elimination, and final placement |
| `beat-em-up` | staged encounters and forward progression | encounter clear, chapter result, and campaign end |

Treat these routes as composable lenses; use `versus-round` for an underspecified request. That selects a default starting structure, not roster size, round count, health, move timing, stage dimensions, or AI tuning.

## Product contract

The minimum loop is: enter a readable stage, take direct control, commit an action, resolve an explainable hit or defense, reach a decisive result, and rematch cleanly.

Keep these authorities separate:

- match: route, timer, score or stock, round/encounter, and result;
- fighter: health, resources, semantic pose, action state, input buffer, and defense state;
- action: identity, phase, cancellation, contact shape, and hit ledger;
- AI: decision identity, reaction delay, committed action, and cancellation reason;
- campaign: chapter transition and overall result, only when explicitly selected;
- presentation: scene, camera, animation, HUD, audio, and effects derived from committed state.

Every delayed action, contact, KO, chapter result, overall result, and rematch has a stable identity and commits once. Pause freezes the clocks promised by the selected route. A result rejects later damage, score, stock, and chapter writes.

## Action and contact transaction

All devices and AI produce the same semantic commands. Follow [input-handling.md](./input-handling.md) for shared input ownership. Edge input enters a bounded buffer; the action state machine consumes it according to phase, resources, priority, and cancellation rules.

An action is data: startup/active/recovery, movement policy, attack and hurt shapes, target policy, defense interaction, resource effects, cancellation, and presentation keys. Animation does not define the active contact window.

Resolve each action in this order:

1. Validate match phase, resources, action legality, and target policy.
2. Allocate an action identity and advance its phase.
3. Collect candidates without removing actors during iteration.
4. Check shape, faction, invulnerability, defense, and the hit ledger.
5. Record each legal `actionId + targetId` once.
6. Commit defense, damage, stun, launch/knockback intent, resources, and presentation events through one entry point.
7. Let the selected route resolve KO, stock, encounter, round, and result.

A whiff, illegal target, invulnerability, or failed throw must not consume a ledger entry that could later become legal. Player and AI damage use the same transaction.

## Fairness and route isolation

AI follows `decision -> reaction wait -> action commit -> action lifetime -> next decision`. It may replan only when a declared change invalidates the plan. Difficulty may change observation delay, option weights, error, and risk; it must not bypass defense, stun, resources, collision, or result lock.

Each route owns its stage, camera policy, bounds, result adapter, and HUD projection. A campaign transition disables and disposes every old route writer before enabling the next route. Chapter and campaign results use different identities. A rematch rebuilds the declared initial route and never creates parallel campaigns.

The stage's visible floor, combat plane, platforms, bounds, spawn/recovery rules, collision, and camera framing must describe the same playable space. Follow [camera.md](./camera.md) for camera ownership. Threats need readable anticipation; hits, blocks, and damage need distinct feedback.

3D arena routes (`arena-brawler`) use camera-relative or actor-relative planar movement ([camera.md](./camera.md)); 2D/2.5D side-plane routes (`versus-round`, `platform-brawler`, `beat-em-up`) keep fighters and recovery in the declared combat plane unless the brief asks for 3D movement.

## Project parameters

Store action timing, input buffering, contact shapes, health/resources, launch behavior, bounds, AI policy, camera, and presentation budgets in a named project profile with units and the selected route. This guide provides no tuning defaults.

## Troubleshooting

- Missed, repeated, or stale actions point to press/hold/release handling, input buffers, cancellation, or focus recovery.
- A whiff dealing damage, repeated contact dealing damage twice, or a defense applying outside its window points to contact identity, action phase, and defense boundaries.
- An AI that decides but never acts can have a broken decision-to-command handoff; an AI that acts without consequences can have a broken commit path.
- Stage escapes or camera loss can come from bounds, spawn/recovery placement, or movement basis. Camera-relative direction diagnosis uses [camera.md](./camera.md); side-plane motion needs plane locking.
- Incorrect KO, timeout, draw, ring-out, or chapter progression points to the selected route's result precedence and result latch.
- A rematch or chapter transition retaining old actors, attacks, timers, HUD writers, or camera control points to lifetime cleanup and reset ownership.
- Frame-rate-dependent combat or sustained-load problems point to simulation clocks and resource lifetime. Device-specific symptoms belong to the affected input path.

## Implementation

### Fighter identity and movement owner

Give each fighter one logical identity and separate:

- `motionRoot: THREE.Object3D`, written by the selected movement owner;
- `visualRoot: THREE.Group`, used only for asset-axis correction, animation, and presentation;
- semantic facing in project state;
- typed attack/hurt volumes derived from semantic pose;
- an optional body or `CharacterController` owned by the current match or chapter scope; follow [physics.md](./physics.md) for body ownership.

When `visualRoot` is a skinned GLB, follow [Character models](assets.md#character-models) for clip mapping and animation ownership before adding move-specific presentation. When a fighter uses a grounded CharacterController, the brief does not name an appearance, and stylized default bodies fit the game's art direction, load `WANAKA_DEFAULT_CHARACTER` through `model3DLoader` and pass `WANAKA_DEFAULT_CHARACTER.clipNames` into `attachAnimatedModelInstance` (or source a matching biped fighter when the brief calls for a realistic or non-cartoon aesthetic); bind that presentation with `{ model }`. The CharacterController capsule remains collision-only.

Three UUIDs, array indexes, physics handles, bones, and clip names are not persistent fighter identities.

Choose one movement route:

| Route               | Owner and use                                                         |
| ------------------- | --------------------------------------------------------------------- |
| grounded controller | `CharacterController` owns grounded movement, steps, slopes, and jump |
| dynamic rigid body  | Physics owns pose and impulse-driven launch                           |
| project kinematic   | Project state owns exact action curves; a kinematic body follows      |
| project-only        | Fixed-step project math owns movement and contact                     |

`CharacterController` accepts one semantic fixed-step intent through `control(intent)`, combining planar movement, facing, stance, and grounded jump. Its `setMoveIntent`, `jump`, `setStance`, `setVerticalVelocity`, and `teleport` methods remain low-level operations for a project that intentionally owns those channels separately; they do not publish arbitrary launch impulse or root motion. `setMoveIntent()`, `jump()`, and `setStance()` MUST NOT be mixed with `control()` in the same step. Use `setVerticalVelocity` for an intentional air jump or other vertical impulse; calling a grounded-only `jump` again does not implement a double jump. Choose dynamic or project-owned movement when the move set needs launch impulse or root motion. Never bind a dynamic body and character controller to the same motion root. Respawn uses `reset()`; `teleport` is the immediate pose write — [physics.md](./physics.md).

### Fixed-step action and contact

Latch each frame edge from `input.frame` into a bounded command buffer once. In `fixedInput`, merge held player and AI intent and consume pending commands once; in `fixedUpdate`, advance action state and project-owned movement. Let physics read kinematic pose in `prePhysics`; after physics and character pose publication, resolve physics-backed contact in `postPhysics`. Animation, effects, HUD, and audio consume committed events later and never decide damage.

Hit-stop or slow motion needs an explicit time domain and restoration owner. Restoration cannot depend on a timer frozen by the same effect.

Prefer typed fixed-step attack and hurt volumes. `physics.overlapAabb` with `ignore` set to attacker-owned `RigidBody` entries (a CharacterController is not one) supplies broad-phase body candidates, not a complete fighting hit test; continue with identity, faction, action shape, defense, and ledger checks. `THREE.Raycaster` may support visual selection or camera checks, but it does not establish physics or hurtbox contact.

For each legal contact, write the `actionId + targetId` ledger before committing defense, damage, stun, launch/knockback intent, meter, and presentation events through one resolver. Collect all targets before removing defeated actors.

### AI and campaign transitions

AI emits the same commands as players. Track decision identity, target snapshot, reaction deadline, planned action, commit/cancel reason, and action lifetime. Replan only at declared invalidation boundaries.

For a campaign transition:

1. Stop the old route's input, AI, contact, bounds, and result writers.
2. Clear buffers, ledgers, actions, bodies/controllers, projectiles, effects, and transient audio.
3. Dispose the old chapter scope.
4. Activate the new stage, camera, bounds, movement owners, AI, and HUD projection.
5. Publish a valid first-frame snapshot before enabling damage and input.

Non-current stages must have no render, physics, AI, boundary, camera, HUD, or result writer.
