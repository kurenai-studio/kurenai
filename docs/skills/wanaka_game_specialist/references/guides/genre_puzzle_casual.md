# Genre: Puzzle / Casual

## Choose one mode

| Mode | Rule authority | Core challenge |
| --- | --- | --- |
| `logic-grid` | board graph and derived state | connectivity, exclusion, deduction, move/resource budget |
| `sokoban` | discrete player/crate/goal cells | push ordering, reachability, deadlocks |
| `merge-grid` | board, deterministic spawn source, slide/merge reducer | space, ordering, target tier |
| `escape-room` | clue/item/mechanism dependency graph | observation, dependency order, code derivation |
| `falling-block` | board, active/next piece, collision/lock/clear rules | placement, rotation, space, line goal |
| `forced-perspective` | camera/object-scale transaction and real occupancy | apparent size, placement, traversal |
| `physics-puzzle` | body motion, expected contacts, goal occupancy, settle | aim/force, collision route, chain order |

An underspecified request SHOULD use one compact `logic-grid` with authored dependencies, a finite move/resource constraint, one forbidden state, Hint, Undo, Reset, and replay. MUST NOT silently build an anthology.

A bounded authored physics objective belongs to `physics-puzzle`; player-authored build/edit/simulate/revise loops belong to [Physics Construction](./genre_physics_construction.md). Competitive turns, fouls, opponents, scoring, and match results belong to [Sports](./genre_sports.md). Using the physics API does not automatically select `physics-puzzle`.

## State and actions

The complete loop is: observe state and goal → choose one semantic action → validate → commit once → resolve dependencies or physics → update objective → continue or finish → replay cleanly.

Discrete board/dependency data is authoritative for non-physics modes. Actual body motion, allowed contacts, occupancy, and settlement are authoritative for `physics-puzzle`. Native objects and UI project that state.

Normalize pointer, keyboard, touch, and UI into one semantic action path. Follow [input-handling.md](./input-handling.md) for shared edge and ownership rules. Only active play accepts mutation. Repeated input, delayed callbacks, and animation completion MUST NOT submit the same action twice. Illegal or no-op actions change nothing and explain why. Undo restores the complete pre-action snapshot; Reset restores the authored initial fixture and transient identities.

## Puzzle quality

The authored fixture MUST:

- start unsolved and remain solvable under implemented rules;
- require the advertised objects, dependencies, targets, or route;
- require more planning than a one-step tutorial;
- include one representative illegal move, wrong order, deadlock, miss, forbidden state, or recoverable failure;
- have a reproducible semantic solution.

Hint reveals one dependency, contradiction, safe next action, or physical-route clue. It MUST NOT execute an action or complete the puzzle.

## Mode rules

- `logic-grid`: derive connectivity/reachability/forbidden state once after each action and share it across objective, HUD, visuals, and result.
- `sokoban`: validate destination and push destination before one atomic move; show deadlocks; preserve both crate and goal cues when overlapping.
- `merge-grid`: compress → merge each pair once → compress → spawn only after change; a no-op spawns nothing.
- `escape-room`: clues, inventory, mechanisms, and submission share one dependency graph; direct submit MUST NOT bypass discovery.
- `falling-block`: keep active piece, settled board, collision, rotation/kicks, lock, clear, next piece, and failure boundary explicit.
- `forced-perspective`: apparent scale commits one real transform and collision/occupancy update; success requires physical placement or traversal.
- `physics-puzzle`: visible rails, slopes, gates, sensors, catchers, and goals form the actual physical route; labels and timers MUST NOT fabricate contact.

## Picking and presentation

3D interaction uses explicit semantic picking surfaces. Map a native ray hit through a stable project identity before validation. When collider truth is required, use the active physics ray and validate the returned body. Picking MUST reject UI background, off-board space, gaps, and occluded targets.

Use one camera owner and follow [camera.md](./camera.md). Keep the full decision surface, consequence, clues, goals, next piece, physical route, and result readable. Players must distinguish pieces, goals, forbidden targets, clues, values, boundaries, and overlap states. The HUD shows objective, mode-specific progress/resource, Hint, Reset, Pause, and only wired controls.

Feedback follows committed state: legal action, rejection reason, objective progress, clue, goal occupancy, success/failure, Undo, and Reset.

## Troubleshooting

- Illegal moves consuming a turn, or Undo/Reset leaving partial state, points to mutation outside the authoritative action transaction.
- Hint and solution logic disagreeing with the visible board points to different rule representations.
- Input changing a solved puzzle points to result locking; replay or resize revealing stale pieces points to projection and reset ownership.
- In forced perspective, apparent scale may disagree with committed transforms or occupancy. Trace the affected placement or traversal across those representations.
- In a physics puzzle, a near miss counting as success or a reset retaining motion points to the contact route, settlement predicate, and physical-state reset.

## Implementation

### Native delta

Discrete grid, tile, card, and clue modes keep integer cells, stable identities, dependency flags, and derived snapshots as rule truth; they do not import physics or character. Only an explicitly embodied route creates those sidecars. Native roots, DOM, animation, and audio project committed state.

Undo is an identified state transaction within the current attempt. Reset, Retry, room replacement, or replay disposes the attempt scope and clears commands, contacts, timers, derived caches, pose samples, animation queues, history, and semantic projection maps before rebuilding the authored fixture.

### 1. Shared authoritative transaction

Keep state serializable. Discrete modes use a pure candidate/validator/commit pipeline:

```text
normalize raw edge -> Action
candidate = reduce(previous, Action)
reject without mutation OR commit {state, actionId, historySnapshot}
derive(committedState) once
project the same derived snapshot to objective, HUD, scene, audio and result
```

Never infer gameplay from object color, visibility, tween completion, or world float coordinates. Keep integer cells, stable semantic IDs, rule values, RNG state, history, phase/substate, action/result identities, and objective proof in authoritative state. Presentation owns no rule mutation.

### 2. Projection and picking contract

Before placing repeated instances, decide their semantic IDs, expected authored count, transform source, final visibility writer, distinguishing cues, and overlap policy. Keep those decisions in the project state and projection code instead of creating a parallel manifest.

For visual picking, convert the measured canvas point to native normalized device coordinates and use `THREE.Raycaster` against an explicit semantic-target allowlist. Map the hit object through a project-owned stable-ID lookup and call the same action validator used by keyboard/UI. Use `physics.castRay` only when collider truth is required and a world was selected, and pass the querier's body in `ignore` when that query would otherwise start inside an owned collider. Do not raycast a lower floor and reverse-project an elevated oblique board.

### 3. Derived-state synchronization

After entry, commit, Undo, Reset, Retry, restore, or relevant authoritative-state update, derive one snapshot from current authority. The win/fail predicate, target colors, energized/connected sets, labels, HUD counters, and result transition all consume that snapshot. A module-level cache may store it only with an explicit source-state revision/hash; stale caches cannot survive Reset or room changes.

### 4. Authored fixture troubleshooting

An already-solved, trivial, or unsolvable puzzle can come from the initial fixture, unused dependencies, or a mismatch between the intended solution and the implemented validator. When investigating solvability on a finite board, BFS or exhaustive search against that validator can help; a semantic action sequence without project coordinates can make the issue reproducible. A Hint that changes the board points to guidance dispatching an action instead of only reading authority.

Reject a two-crate puzzle where one crate begins solved and the remaining crate is a straight push if the brief promises ordering. Reject an escape-room code that Submit accepts before clue discovery. Reject a logic puzzle whose forbidden target is absent or invisible.

### 5. Mode-specific reducers

#### Logic grid

Store cell kind and orientation/value separately. Connectivity requires reciprocal ports. Derive reachability/energy from source with a bounded traversal. Success proves every required target true and every forbidden target false. Rotating a locked/non-rotatable cell is illegal and preserves the board hash.

#### Sokoban

Represent player, crates, goals and walls as cells. For move direction `d`: reject wall; if crate, reject unless `crate+d` is free; otherwise commit player and optional crate atomically. Undo restores both. Detect authored/static dead squares and provide feedback; do not silently move a crate out of a deadlock.

#### Merge grid

For one direction: compress, merge adjacent equal values once per pair, compress again. If board hash did not change, reject and do not advance RNG or spawn. On a changed board, sample the injected deterministic source once and spawn in a selected empty cell. Undo restores board, score, move count and RNG state.

#### Escape room

Model clues/items/mechanisms as a dependency DAG. Each action declares prerequisites and one atomic effect. Inventory and scene state project the same flags. Submit checks both discovery/dependency completion and the derived solution; knowing a code externally cannot bypass the chain.

#### Falling block

Keep settled board separate from the active piece. Apply movement/rotation to a candidate, validate bounds/overlap, then commit. Gravity and hard drop enter the same lock resolver. Lock once, clear complete lines once, spawn next once, and fail if the spawn candidate overlaps. Show board boundary and next piece even when the settled board is empty.

#### Forced perspective

Keep camera ownership, held object identity, committed scale and real collision occupancy explicit. Apparent-size calculation may propose a scale; one placement transaction applies it. Pressure plates, bridges and passages must use real overlap/collision geometry, not distance alone or route phase. Falling must enter a real `failure_recovery` puzzle substate or commit the session fail result. Reset restores player, camera, held object, transformed puzzle objects, gates/bridges and callbacks.

## Implementation — physics-puzzle mode

### 1. Physics facts are authority

Track `phase/substate, attempts, actionId, expectedContacts, contactLedger, latchState, gateState, payloadReleaseState, pendingImpulseId, goalOccupancy, settleElapsed, resultId`. Configuration labels, selected route names, elapsed time, and intended solution cannot write contact or goal truth.

Create every body through the active world instance, `physics.createBody(scope, options)`, with explicit `static`, `dynamic`, or `kinematic` motion. Follow [physics.md](./physics.md) for body and pose ownership. A released payload MUST be dynamic from creation and remain physically constrained by the closed gate or a support surface until release. Scope-owned contact callbacks collect whitelisted candidates; one resolver commits mechanism/rule transitions after physics.

### 2. Geometry preflight

Scene geometry is executable logic. Design each link to support the physical chain:

1. source/launcher → first expected contact;
2. each relay → next relay;
3. last relay → latch sensor;
4. latch → gate collider physically clear;
5. clear gate → secondary payload release;
6. selected route → real goal capture volume or deliberate gutter;
7. goal entry → continuous occupancy + low-speed settle.

Record expected body/sensor identity, previous/current pose, velocity, frame/time, and contact edge. A route labelled `TO GOAL` does not create physical behavior. Inspect slope geometry and gravity in source rather than inferring travel from rotation signs alone. For a runtime slope issue, a representative dropped/rolled body can reveal actual travel. Rails, gates and decorative covers cannot occlude or physically separate a required sensor.

### 3. Contact and mechanism transaction

Use this order:

```text
expected relay contact with stable identity
  -> latch commit once
  -> gate collider moves/opens and is observed clear
  -> dynamic payload is physically clear to release
  -> consume pendingImpulseId exactly once
  -> expected payload enters goal sensor
  -> continuous occupancy + settle window
  -> commit terminal result once
```

Avoid initial overlap between the last relay and latch sensor: an early contact-begin edge can be consumed before prerequisites and never re-fire. Motion type is fixed when the current public body is created, so keep the payload dynamic from creation; use geometry to restrain it. Never consume its one-shot impulse while the gate collider remains in the route or compensate by applying force every frame.

Filter contacts by expected body identity, sensor identity and current prerequisite state. Deduplicate by stable event identity. If a catcher visually snaps/locks the payload, it may do so only after real entry/occupancy is proven. A resulting `contactEnd` cannot revoke an explicitly latched capture unless the design requires release.

### 4. Forbidden semantic fallbacks

NEVER repair a broken physical path by:

- teleporting or directly setting the primary body, relay, or secondary payload to a later milestone;
- inventing contact because the selected route/configuration is correct;
- advancing latch, payload or success from a timeout;
- enlarging a hidden sensor until it captures a visibly unrelated path;
- changing only failure/success text while the body enters the same physical destination.

A bounded watchdog may stop pathological motion and enter the ordinary resolver with an explainable failure. It cannot fabricate a contact, goal, or success. Fix geometry/collision first, then state transitions.

### 5. Reset, pause, and physical behavior

Reset/Retry keeps each body's authored motion type, calls the published body teleport/velocity operations to restore pose and clear motion, and resets the contact ledger, occupancy, settle timers, pending impulse IDs, payload release, latch/gate state, action/result locks, camera, HUD, and input edges. Keep session-scope listeners bound once or reconstruct a dedicated attempt child scope once; never duplicate them. The payload remains dynamic while reset geometry constrains it. Session pause freezes the scheduler-owned physics world, timers, pending transactions, callbacks, and settlement work together.

The implementation must provide these behaviors:

- correct configuration completes the visible physical chain and settles in the goal;
- underpowered input physically fails before the first required milestone;
- overshoot/wrong route physically enters its own gutter/failure region;
- rapid FIRE cannot duplicate an action or impulse;
- same initial state/configuration succeeds repeatedly without NaN, tunneling, duplicate contact or soft lock;
- the gameplay camera shows the launcher, relay, latch/gate, payload route, and goal;
- Retry starts a clean second attempt; pause/resume preserves the chain transaction.

These are implementation requirements, not a mandatory runtime checklist. Do not claim observed physical behavior from compilation, UI labels, direct state writes, or a still screenshot.
