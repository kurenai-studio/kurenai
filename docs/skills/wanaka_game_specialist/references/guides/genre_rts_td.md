# Genre: RTS / Tower Defense

## Choose one command model

| Product | Movement owner | Minimum loop |
| --- | --- | --- |
| Fixed-route tower defense | project route progress and wave director | inspect threat → buy or place defense → survive pressure → earn and reinvest |
| Compact RTS | selection, production, semantic move/attack orders | produce unit → select → issue legal order → resolve objective |
| Lane strategy | lane progress, deployment commitment, target priority | choose lane → pay and deploy → respond to pressure → destroy or defend base |

An underspecified request SHOULD use compact fixed-route tower defense with distinct defenses and enemies, an economy choice, inter-wave preparation, escalating pressure, a final threat, defeat, result, and restart. Use compact RTS or lane strategy only when the brief asks for direct orders, production, territory, or lanes.

For compact RTS, choose either manual combat orders or autonomous assault with a stable objective. MUST NOT promise autonomous assault while requiring hidden per-enemy clicks. One unit MUST NOT be driven by a route, navigation agent, physics body, and project transform integration at the same time. Selected physics actors follow [physics.md](./physics.md).

## State and transactions

Typed logical records own match state, units, structures, director schedule, resources, production, orders, damage, rewards, leaks, and result. Native objects and runtime handles are projections mapped by stable record IDs.

Each mutable channel has one writer. Purchases, production, upgrades, sales, deployment, shots, damage, kills, rewards, and leaks commit once by stable action identity. Validate phase, ownership, placement, capacity, reservation, and full cost before mutation; rejection MUST leave resources, population, queues, schedule, and world unchanged.

Starting resources and immediately reachable income MUST fund the first required transaction and leave at least one meaningful response before the first mandatory pressure can settle the selected failure condition.

Session pacing follows the declared objective and its selected time drivers, which MAY include an explicit survival timer as well as starting resources, income rate, production time, unit travel time, and the director schedule. When the brief promises a session length, record the objective, player-policy, and enemy-policy assumptions, then derive the relevant bounds — such as earliest legal win, earliest possible defeat, or required survival duration — from the chosen values instead of assuming every RTS has a finite unavoidable-defeat point.

## Movement and commands

Fixed-route TD and lane strategy SHOULD derive native poses from project-owned waypoint or curve progress. Compact RTS units with a `CharacterController` use one scoped `LocomotorWorld` and one `Locomotor` per unit. `NavigationAgent` is leftover for non-physics marker objects. When Locomotor owns movement, project code MUST NOT also write the unit pose; branch on `body.status` — `partial` walks to the path endpoint, `unreachable` needs an explicit stop or reject policy.

Choose one field-pointer owner and follow [input-handling.md](./input-handling.md). UI controls and canvas gestures publish semantic commands into the same queue, and a UI press MUST NOT also place, select, or order in the world. Picking uses the active camera, current canvas bounds, native object-to-ID mappings, and one consistent coordinate domain. Click and drag selection MUST be mutually exclusive gestures.

During active play:

1. consume bounded commands;
2. validate and commit player transactions;
3. advance the director and admit supported spawns;
4. update the selected movement owner;
5. acquire and revalidate targets;
6. commit shot, damage, death, reward, and leak events once;
7. update projections and presentation;
8. evaluate wave and match completion.

Targeting stores a stable target ID and revalidates active status, faction, and range at the firing edge. A rejected shot MUST NOT consume cooldown or create damage.

## Pools, pressure, and reset

Pool admission validates both logical budget and a clean projection before spending resources, population, queue entries, backlog, or schedule progress. Reused projections restore identity, owner, role, health, target/order, spawn pose, visibility, collision, animation, and effects. Dispose per-unit sidecars before reuse.

Challenge SHOULD change composition and decisions rather than health alone. Telegraph meaningful threats and preserve an economy branch such as coverage versus upgrading.

Pause freezes director, movement, order admission, attacks, production, cooldowns, and AI clocks. Restart disposes active unit scopes and clears units, projectiles, backlog, queues, transient resources, cooldowns, selection, and action ledgers before rebuilding clean projections.

## Battlefield and HUD

The gameplay camera must show routes or lanes, deployment space, spawn, resources or production, and protected objectives; follow [camera.md](./camera.md) for camera ownership. Separate roles with silhouette, scale, attachment, formation, labels, or animation rather than tint alone.

The HUD shows base/objective health, resources, pressure or wave, next threat, selection, legal actions, production, pause, and result. World feedback shows selection, range, route/order acknowledgement, legal placement, and rejection reason. Audio and VFX consume committed events and remain bounded during dense combat.

## Troubleshooting

- Rejected builds or commands spending resources, or reinvestment duplicating units, point to transaction validation and admission.
- Units stopping after target changes, rebakes, or displacement point to navigation revision, partial/unreachable-path handling, and movement ownership.
- Towers or units attacking invalid targets point to target policy and stale combat state.
- Pressure cycles stalling or pools losing actors point to director clocks and pool exhaustion handling.
- UI interaction issuing field commands points to input ownership. Pause, results, or restart leaving production or combat active points to clocks, result locking, and lifetime cleanup.

## Implementation

### Genre-specific owners

- Serializable state owns the match, director, units, defenses, economy, production, and action ledger.
- One command owner validates semantic commands, commits them atomically, and reports rejection reasons.
- Each unit has exactly one selected fixed-route, lane, or scoped navigation movement owner.
- One combat owner commits target acquisition, fire revalidation, damage, death, rewards, and leaks.
- Projection owns the stable record-to-native-object registry, bounded pools, and active child lifetimes.
- One input owner combines `InputSession` with field gestures; camera, HUD, audio, telegraphs, animation, and VFX only consume committed state.

### Authoritative state slices

Keep serializable records separate from native handles:

```text
MatchState { phase, roundState, waveOrObjective, baseHealth, resources, outcome, randomSeed }
DirectorState { scheduleCursor, backlog, liveCount, spawnSequence, lastActionId }
UnitRecord { id, owner, role, health, routeOrOrder, targetId, status }
DefenseRecord { id, owner, slotOrPosition, level, cooldown, targetId, policy }
ProductionRecord { queue, reservations, progress, lastAdmission }
ActionLedger { commands, shots, damage, kills, leaks, rewards }
```

Native `Object3D`, `Locomotor`, leftover `NavigationAgent` (non-physics markers), rigid-body, DOM, audio, and animation handles stay in runtime registries keyed by stable record IDs. Restart or restore rebuilds those registries from records; native UUIDs and object references never become save or rule identity.

### Managed roots and native registries

Expose meaningful scene groups, production structures, objectives, route or lane roots, and the gameplay camera. Dense decorations, projectile pools, minor units, selection decals, and collision proxies can remain code-owned.

Build a runtime registry in Play:

- stable ID to active native object and child scope;
- native object to stable ID for picking, resolving ancestor hits until a registered semantic root is found;
- stable ID to optional navigation, physics, animation, and effect handles;
- bounded free projections separate from active strategic records.

Do not store rule state in `Object3D.userData` as the only source. A native hit resolves an ID, then commands and rules read the authoritative record.

### Canvas-owned field command pipeline

Use one field owner. Mount HUD with `hudElement()` from `wanaka-studio-engine/dom` onto `context.viewport.overlayContainer` and set the overlay root `style.pointerEvents` to ignore field pointer events, then restore them only on actual controls. Attach native pointer listeners to the canvas with the owning scope's abort signal. UI button handlers and canvas gestures both enqueue semantic intents; neither directly commits economy, movement, or combat.

For each field event snapshot:

1. read the current canvas `getBoundingClientRect()`;
2. convert `clientX/clientY` into canvas-local normalized device coordinates, including the Y inversion required by the native camera convention;
3. call `raycaster.setFromCamera(ndc, activeCamera)`;
4. intersect only the selected semantic native roots for selection/attack, or intersect the authored terrain mesh or project `THREE.Plane` for a ground destination;
5. resolve object hits through the runtime native-object-to-stable-ID registry;
6. enqueue one immutable command carrying the event action ID, semantic source, selected IDs, and world destination or target ID.

Keep CSS pixels, normalized device coordinates, and world positions separate. Recompute from the live rectangle after resize. Do not derive world X/Z from screen ratios.

For drag selection, capture the pointer on press, retain the starting event in the same coordinate domain, update one visible selection rectangle, and commit only on release. Cancellation clears it. The gesture classifier emits either a click command or a drag command, never both. Native Three projection through the active camera tests candidate world positions against the normalized selection rectangle.

If the canvas owns field gestures, do not also convert `InputSession` pointer edges into field commands. The session still owns keyboard/gamepad and any selected camera keys. UI clicks cannot reach the canvas, and field clicks cannot mutate through DOM handlers and scheduled code independently.

### Movement route implementations

#### Fixed route and lane progress

Keep route progress, segment index, direction, and arrival/leak state in the unit record. Advance them from the selected fixed-step project rule, derive one native world pose from the authored route, and write the projection once. Route completion publishes a leak or objective action ID; it does not directly grant multiple side effects.

Pooled units reset route, segment, direction, and native spawn pose before activation. No `NavigationAgent` or dynamic rigid body attaches to a unit owned by this route model.

#### Compact RTS navigation

Await one scoped `NavigationMesh.create(scope, options)` after explicit `Box3` volumes or native walkable/blocked object hierarchies have their final transforms. Record the returned mesh's `revision` and verify a non-empty walkable result. Create one `LocomotorWorld` from that mesh. For each physics unit, `CharacterController.createAndBind` then `Locomotor.create(scope, scheduler, { world, character })` in that unit's child scope.

On an accepted move order, call `body.setGoal({ kind: 'goTo', point: worldDestination })` and record `body.status` / `body.goal` with the command ID. `partial` means the corridor was incomplete but the unit walks to the path endpoint; report `unreachable` rather than writing the pose. Jolt owns the character transform; strategy code observes `body.status` and `body.goal` without writing the pose.

`NavigationAgent` remains only for non-physics marker objects that have no `CharacterController`.

On pooling, death, restart, or cancellation, dispose the unit child scope to remove its Locomotor before parking or reusing the native object. Restore the spawn pose through `character.teleport` before attaching the next Locomotor.

### Command and economy transaction

Consume commands in a stable queue order during the selected simulation phase. Each command validates phase, source/owner, target legality, placement or path, capacity, full resource cost, population reservation, and duplicate action ID. Only a fully accepted command atomically replaces records and creates an admission request.

Admission returns an explicit accepted/rejected result. On rejection, preserve resources, population, production queue, director backlog, and schedule cursor, then expose the reason. On acceptance, restore one projection completely, create its child scope and selected sidecars, bind the stable registries, then spend or commit reservation and advance the queue/schedule exactly once.

Upgrade and sale use the same command path. Upgrade applies one level delta and cannot reconsume the same action. Sale removes one record/projection and grants one profile-defined refund. One kill ledger identity grants at most one reward.

### Combat and director order

Use this fixed rule order for project-owned strategic state:

1. consume bounded semantic commands;
2. validate and commit economy/production actions;
3. advance the director and admit supported spawns;
4. advance fixed route/lane units and issue or observe selected direct orders;
5. acquire targets from bounded candidates using one declared policy;
6. at fire time, resolve stable target ID and recheck active state, faction, and range;
7. commit shot, damage, death, reward, and leak ledgers once;
8. evaluate wave and match completion;
9. project stable state to HUD, audio, animation, and VFX.

A rejected fire does not consume cooldown. Dead or pooled units leave hot target lists before the next acquisition. Temporary autonomous-assault targets do not erase the unit's stable strategic objective; after combat the unit resumes that objective or records a specific unreachable outcome.

### Pool and scope reset

Returning a projection to a pool performs one transaction:

1. remove it from active targeting, selection, route/order, and collision lists;
2. dispose its child scope and all navigation/contact/animation/effect hooks;
3. clear target, cooldown, health presentation, owner, role, selection, attachments, particles, and sound edges;
4. detach or park it outside gameplay without treating that pose as a future spawn;
5. mark the pool slot free only after cleanup succeeds.

Admission restores the authored spawn pose, visibility, identity mapping, owner, role, health, order, collision policy, animation, and effects before the record becomes active. Apply the same admission invariants to fresh and reused projections.

Match restart gates commands, disposes every active child scope, clears director/production/combat/action state, resets project-selected resources and objectives, restores pools, then recreates the initial records without adding new global hooks or DOM listeners.

### Camera and command feedback

Create the gameplay camera in the scene factory. One project module owns pan, zoom, rotation, bounds, and projection. Picking always uses the same active camera as the submitted main view. Camera switching or a still preview follows the native [multi-camera example](../../examples/multi-camera.ts); it never creates another renderer loop.

Immediate accepted/rejected, queue/progress, selection, range, target, destination, and audio feedback MUST correspond to authoritative records and committed action IDs. Apply a project-owned audio throttle for high-frequency combat categories.
