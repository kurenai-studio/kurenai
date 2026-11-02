# Optional gameplay preset: Top-Down Survivors

## Product contract

The `topdown-survivors` preset (`bullet-heaven` / `survivors-like`) combines player steering, automatic attacks, rising enemy density, drops, build choices, and a return to combat with a materially changed build. Use this preset for automatic-attack swarm games (`Vampire Survivors` / horde survival style), paired with [Roguelike](./genre_roguelike.md) when run seeds or meta-progression apply. Manual-skill isometric hack-and-slash loot ARPGs (`fixed-camera-point-to-move` or hotbar skill casting with itemized equipment drops) belong to [RPG](./genre_rpg.md) plus [Action Combat](./genre_rpg_action_combat.md), not here. Movement plus periodic projectiles is not a complete loop.

Choose:

- wave settlement, continuous level-up, or shop-led progression;
- shared pickup or separate experience/currency economies;
- bounded arena or scrolling/wrapping world;
- fixed hero, character modifier, or equipment-first build identity;
- finite boss route or endless escalation;
- keyboard/gamepad, touch, or both.

Theme and roster MUST NOT silently choose these structural routes.

## Swarm ownership

For a high-count swarm, use project-owned compact records as simulation truth and native Three objects as projections. A typical route uses bounded pools, generation-aware handles, XZ-plane distance checks, a spatial grid when needed, and `THREE.InstancedMesh` for homogeneous visuals. Physics MAY serve a small number of props, obstacles, or a deliberately low-count variant; follow [physics.md](./physics.md) for its body/query rules.

Physics MUST NOT create another transform authority for the swarm.

One registry owns active/free state, generation, gameplay data, and visual slot assignment. Stale handles MUST NOT affect reused occupants. Released entries leave targeting, collision, and reward queries immediately. Pool exhaustion follows a declared director policy rather than growing an unbounded side collection.

## Combat transaction

Resolve attacks in one order:

1. validate activity, owner, cooldown, and target;
2. allocate the action and projectile or melee trace;
3. collect contacts without mutating active collections;
4. deduplicate action-target pairs;
5. commit damage, status, and knockback intent;
6. commit each death once, then rewards, drops, and presentation events;
7. release expired entries after iteration.

Melee traces the moving weapon or swept volume during its active window. Weapons, enemies, upgrades, characters, and wave mixes SHOULD be typed data composed over shared systems rather than bespoke update loops.

## Director and economy

The director maintains a desired pressure envelope using active plus telegraphed enemies. Spawn intent appears before acquisition, rejects the player's safety region, and respects arena edges or enters outside the scrolling view.

At settlement, stop new spawns, resolve or clear remaining combat entries, bank eligible drops, then process:

`combat → queued level-up choices → optional shop → next combat`

Experience MAY queue choices without interrupting the current segment. Purchases, rerolls, merges, locks, sells, and restrictions are atomic economy transactions; validate funds and inventory before commit and show a rejection reason.

Shared pickup uses one material for experience and purchasing power. Split pickup keeps separate drops and sinks. Pickup attraction and ground merging MAY serve either route.

## Arena, camera, and feedback

A bounded arena needs visible and logical edges. A scrolling route streams or wraps decoration and spawns beyond the visible region. Obstacles are shared rule data for player movement, enemy steering, and projectile rejection.

Use one native camera owner with a readable XZ view; follow [camera.md](./camera.md) for camera ownership. Default is a rigid world offset of the followed presentation pose in `preRender`, then `lookAt` that same pose ([top-down-follow.ts](../../examples/top-down-follow.ts)). Do not add pan lag or facing look-ahead. Cursor look-ahead only when move and fire stay independent. Automatic targeting keeps the rigid boom. Do not lerp the camera then `lookAt` a less-lagged target. At peak density, prioritize threat telegraphs and player damage, then hit/death feedback, pickups and settlement, then decoration. Coalesce repeated feedback, reuse buffers, cap histories, and degrade decoration before gameplay cues. MUST NOT create a DOM node or new Three object per hit.

World-anchored UI projects native vectors through the active camera and current presentation rectangle. The HUD shows health, segment state, currencies, build slots, pause, and result.

## Activity and reset

Settlement choices and shops are combat-gated activity states, not user pause. User pause has one owner and resumes to the exact prior activity. Modal choices disable movement input.

Retry clears or disposes the entire run owner before constructing the next run. Timers, scheduler hooks, input listeners, pools, overlays, action identities, queued choices, director state, and transient effects MUST NOT survive.

Touch, keyboard, and gamepad converge on one normalized movement command. Follow [input-handling.md](./input-handling.md) for shared input ownership. Show only controls available on the selected devices.

## Performance

Set budgets from the target devices and art route. For a performance issue, useful measurements can include the affected entity counts, pool capacity/rejections, broad-phase candidates, simulation/render cost, draw calls, or memory. Choose measurements that distinguish the suspected cause; a full diagnostic counter system or runtime run is not a prerequisite for adding assets or effects.

## Troubleshooting

- Attacks missing valid targets or modifiers changing only the HUD point to targeting and the live attack-stat consumer.
- Duplicated drops, rewards, or purchases point to death settlement and transaction identity.
- Difficulty pressure failing to advance can come from wave clocks or spawn admission; disappearing or stale enemies can come from pool reuse and exhaustion.
- Movement or camera drift near arena/scrolling boundaries points to world-space ownership. Crowded scenes becoming unreadable points to density and presentation.
- Build-choice overlays, pause, retry, or resize leaving stale input or actors point to modal ownership and per-run cleanup. Inspect the affected path without adding unrelated device or teardown scenarios.

## Implementation

### Lifetime and state

The simulation registry owns active flag, generation, archetype, previous/current XZ position, velocity, radius, health, timers, and visual slot. Handles contain index plus generation and validate both on lookup. Acquisition initializes the complete record before activation; release removes it from queries, increments generation, clears transient references, and returns the slot.

### Native presentation

Choose per archetype:

- `THREE.InstancedMesh` for shared geometry/material without individual graphs or skeletal animation;
- a bounded `THREE.Mesh` or `THREE.Group` pool for independent animation, attachments, or material state;
- individual graphs for bosses or a few authored interactors, adapted to the same combat transactions.

The normal swarm route writes simulation positions and publishes native transforms later. If a few physics-owned actors are selected, define the handoff explicitly; NEVER write a dynamic body's transform from the swarm updater.

### Simulation ordering

Merge held keyboard/gamepad/joystick axes and pending DOM commands in `fixedInput`, then advance player, director, AI, weapons, contacts, and combat transactions in `fixedUpdate`. Use physics phases only for explicitly attached physics actors. Publish HUD and camera from committed player presentation in `preRender` ([top-down-follow.ts](../../examples/top-down-follow.ts)). Interpolate pooled native swarm transforms only during presentation; do not lerp the follow camera toward the player.

Choice, shop, pause, and result states keep rendering and UI alive while gating combat. User pause uses one session owner and needs a DOM path that remains usable while scheduler callbacks are suspended.

### Combat and pools

Collect contacts and mutation intents into bounded queues. Resolve broad-phase candidates, exact or swept contacts, action-target deduplication, damage, death, rewards/drops, then release expired entries. Child shots enqueue later spawn intents instead of modifying projectile collections recursively. Area effects gather all targets before releasing any death.

Gameplay-event overflow is an implementation failure. Cosmetic overflow follows a declared priority policy. Sound throttling and visual coalescing MUST NOT suppress gameplay state.

Start with linear scans only when the configured maximum is safe. When targeting, contact, separation, or pickup candidates dominate cost, use one shared uniform grid containing validated handles; it MUST NOT become another entity registry.

The director counts active plus telegraphed enemies against pressure. A request records archetype, position, and reveal time, shows the warning, then acquires from the pool. Exhaustion delays or rejects through one policy.

### HUD and input

Upgrade, shop, pause, and result callbacks enqueue typed intents; the next fixed boundary validates and commits them. The virtual joystick and `InputSession` axes merge under one dead-zone/priority policy. Modal activities disable movement controls and discard stale intent.

Callbacks MUST NOT capture a disposed run object. Route them through an intent queue owned by the current play composition.

### World-to-screen UI

Project reused native vectors through the active camera after its late-update transform and `updateMatrixWorld()`. Convert normalized coordinates through the actual render surface rectangle. Re-read the rectangle after resize, cull offscreen items, and reuse an overlay canvas or bounded DOM pool. Device pixel ratio MUST NOT be applied to CSS-pixel placement.

### Reset

For bounded arenas, reset player, camera, visible/logical edges, obstacles, director, economy, random source, pools, and effects together. For scrolling arenas, also reset chunk/wrap origin and spawn exclusion. When replayable runs are promised, route director, loot, and offer randomness through one stored seed.
