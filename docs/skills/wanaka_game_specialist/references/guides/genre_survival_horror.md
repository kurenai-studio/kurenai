# Genre: Survival Horror

## Choose one route

| Route | Pressure source | Required boundary checks |
| --- | --- | --- |
| `pursuit-extraction` | persistent but recoverable pursuit | escape, search expiry, route not permanently shut |
| `resource-scarcity` | consumption and limited replenishment | zero-resource policy and no silent soft lock |
| `loot-risk-extraction` | optional value increases return risk | early/deep exit, capacity, and loss on failure |

For an underspecified standalone horror request, start with `resource-scarcity`, a compact interconnected location, an interruptible threat, and run restart. Select concrete resources, objectives, map, and checks in the project plan. When stealth sight-blockers, noise events, hiding, or patrol/search perception are borrowed as a sub-mechanic inside an action-adventure or RPG, use the threat fairness and interaction rules below without forcing a standalone extraction or horror survival wrapper. Do not combine multiple resource ledgers, extraction rules, or threat-position writers without defining their authority.

## Product contract

A complete slice needs a learnable space, a low-pressure opening, a gated objective chain, a shortcut or loopback, a place to break sight or hide, a gated exit, a bounded resource/carry ledger, a perception-driven threat, a stable failure, a reachable success, and a clean restart.

Pressure comes from limited information, resource tradeoffs, spatial risk, sound, and recoverable pursuit. Darkness, random loud sounds, an enemy that always knows the player position, or a large empty map cannot supply the loop alone.

One run reducer owns exploration, pursuit/search, checkpoint recovery, failure, and extraction. Pause freezes consumption, attacks, perception-memory expiry, navigation targets, interaction transactions, objectives, and extraction (in 3D Pointer Lock routes, open pause immediately on the `wasCaptured && !pointer.captured && !isRequesting` capture-loss transition when `Escape` releases the lock). A terminal result rejects later damage, resource, threat, pickup, objective, door, and exit writes.

A checkpoint is a coherent snapshot of player pose, resources/carry, objectives, doors/shortcuts, pickups, threat state and perception memory, pending actions, camera mode, and relevant clocks. Restoring position alone while keeping mismatched world state is corrupt recovery.

## Threat fairness

The threat follows an explainable cycle such as patrol/calm, detection or investigation, pursuit, perception loss/search, and recovery. Each transition consumes bounded sight or noise observations and records its reason.

Sight checks range, facing, and the nearest world blocker. A player inside range and view but behind a registered blocker must not trigger sight-driven pursuit. Noise is an immutable event with identity, position, category/strength, time, and expiry; it never carries a live player reference.

The player needs readable warning, real consequence, and at least one checked pressure-release route: breaking sight, outlasting search, taking another route, hiding, or using a bounded countermeasure. Navigation failure enters a declared recovery path; it never grants wall vision, teleport pursuit, or an endless chase.

## Interactions, resources, and space

Pickups, doors, objectives, hiding points, and exits share one nearest-eligible resolver. Follow [input-handling.md](./input-handling.md) for the edge contract: one input edge commits at most one candidate. Eligibility, resource/capacity reservation, world change, objective change, and feedback form one transaction; rejection leaves every ledger unchanged.

Every pickup, consumption, door, objective, damage, and extraction event has a stable identity and commits once. Resource exhaustion leads to a declared alternative, explicit failure, or clearly reported unwinnable state. Continuing to loot in `loot-risk-extraction` must increase at least one observable risk channel.

Doors synchronize visible pose, collision, navigation, sight obstruction, interaction eligibility, and restart state. Hiding synchronizes movement, camera, input, noise, vulnerability, threat perception, entry/exit anchors, and recovery; a decorative locker or unused `hidden` flag is insufficient.

Audit every mandatory connector with the actual controller: walkable continuity, elevation, gap, width, clearance, threshold, slope, and steps. Choose first-person, close third-person, or authored-room camera; follow [camera.md](./camera.md) before placing occlusion. Even the darkest objective area must preserve traversal, interaction, and promised threat information.

Keep distance, duration, capacity, consumption, damage, view, and map values in a named project profile. This guide provides no defaults.

## Troubleshooting

- An interaction consuming resources before prerequisites pass, or a repeated door/extraction reward, points to transaction validation and commit identity.
- Capacity or depletion behaving inconsistently points to inventory and resource-policy ownership.
- Threats seeing through walls, following expired noise, or never leaving pursuit point to sight queries, memory expiry, and search/recovery transitions.
- Hiding places, countermeasures, shortcuts, or checkpoints that do not affect later play can be disconnected from authoritative threat or objective state.
- Danger continuing through pause, or a new run inheriting pickups, threat memory, pending transactions, or results, points to clock and run-lifetime cleanup.
- Route-specific symptoms narrow the investigation: pursuit concerns escape/search expiry; scarcity concerns consumption/replenishment; loot-risk extraction concerns carried value and early-versus-deep exit settlement. A local symptom does not require completing the whole objective route.

## Implementation

### Movement and interaction ownership

`CharacterController` owns player position; submit movement and jump through `control(intent)` and use `reset()` for checkpoint restore. `teleport` is the immediate pose write when the project does not need that queued barrier. A first-person camera is the scene-rooted look in [camera.md](./camera.md). Movement and aim rays follow that guide — do not take `Object3D.getWorldDirection` from a yaw pivot. Third-person or authored-room cameras use one project controller. Hiding, damage, transitions, failure, and extraction transfer camera ownership explicitly.

Use a project-owned interaction registry with stable identities:

```ts
interface Interactable {
  readonly id: string;
  readonly object: THREE.Object3D;
  readonly kind: 'pickup' | 'door' | 'objective' | 'hiding' | 'exit';
  evaluate(state: RunState): Eligibility;
  commit(tx: InteractionTransaction): InteractionResult;
}
```

Choose the nearest legal candidate according to the project's distance and facing policy, using stable identity to break ties. Validate run and action identity, reserve capacity/resources, commit object/ledger/objective changes, and then emit presentation. Rejection ends before any mutation.

### Doors and shared spatial truth

A door controller is the sole writer of its native pivot. Its state transition updates the kinematic collision body, navigation blocker, ray obstruction, interaction eligibility, sound, and objective state together. When a navigation obstacle changes the mesh revision, handle agent invalidation and replan or recover. Refuse a close that would trap an actor without changing the remaining door facts.

### Threat sight and navigation

Follow the hit, pick, and sight contract in [physics.md](./physics.md). Prefilter sight with native vector distance and facing, then `castRay` the complete threat-eye-to-player-anchor segment with every threat-owned `RigidBody` in `ignore`. A CharacterController is not a `RigidBody`.

Accept sight only when the target is the nearest owner or no blocker is closer than the target volume.

`Locomotor` plus `CharacterController` is the threat movement owner for physics capsules. Bake one `NavigationMesh`, create one `LocomotorWorld`, then one `Locomotor` per threat: `Locomotor.create(scope, scheduler, { world, character })`. Call `setGoal` on meaningful target or state changes (`hold`, `chase` default `stopAt` 2.0 resume `2.6`, `follow` default `stopAt` 3.0 resume `4.5`, `goTo` with optional `stopAt`, `stop`). `setSpeed` changes drive without a replan. Branch on `body.status` / `body.goal`: `partial` means the corridor was incomplete but the unit walks to the path endpoint; handle `blocked` and `unreachable`. Sim pose is `character.latestStep`. Sight uses `canSee` from `character.anchors.eyes.position`; keep lost seconds and any view cone in `play.ts`. Jolt `castRay` does not hit CharacterVirtual — `acceptHit` is for RigidBody targets. Bounded no-progress detection MUST remain a project-owned watchdog; no-progress is not a Locomotor status. Sight/noise identity, transition reason, last-known position, reaction/search deadlines, and the selected recovery path MUST remain in project state.

### Hiding, countermeasures, and reset

A hiding transaction takes ownership of player movement, camera, interaction focus, noise, vulnerability, and threat visibility. Validate the exit anchor before restoring normal owners. A countermeasure reserves its resource, commits one effect identity, and lets the threat state machine consume it; presentation never stands in for the gameplay effect.

Checkpoint restore freezes gameplay, disposes current run hooks, restores one coherent logical snapshot, rebuilds run-owned sidecars, and only then accepts input. Restart clears interactions, damage, noise, objectives, extraction, player/threat systems, resource/carry state, pickups, doors, shortcuts, perception memory, paths, search/countermeasure state, camera/input state, result, and run-only presentation.

Bound generated loot, noise/history, traces, decoys, effects, and spatial voices. A gameplay-pool shortage rejects before ledger mutation; presentation pools may drop old visuals but never gameplay facts.
