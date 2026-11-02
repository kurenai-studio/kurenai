# Genre: Physics Construction

This genre owns **build → simulate → observe → revise**. A pile of rigid bodies is not an editable construction system.

Route fixed authored mechanisms and physics puzzles through Puzzle. Route turns, fouls, opponent decisions, and scoring through Sports. Choose Physics Construction when player-authored structure and repeated revision are the primary promise.

## Product route

| Route | Core promise | Session behavior |
| --- | --- | --- |
| `objective-builder` | build against a visible physical objective, test it, diagnose failure, revise | terminal success/failure is allowed after authoritative objective conditions |
| `sandbox-builder` | create, simulate, inspect, save, and keep revising | remains continuous unless the brief explicitly adds a challenge |

For an underspecified original request, choose a small objective-builder with a bounded part catalog and one connection model. This is a starting route, not a tuning preset. Record whether the construction is a bridge, vehicle, boat, stack, machine, tabletop mechanism, or another shape; that profile does not create another runtime architecture.

Choose grid or freeform placement, one camera/picking policy, and only connections confirmed by the current generated Engine declarations. If the requested joint, motor, breakage rule, or editable property is not published, report the API gap. Do not fake physical behavior by continuously teleporting live parts.

## Authoritative model

Use one transaction chain:

```text
semantic tool command
  -> validate against committed blueprint
  -> accept/reject one edit identity
  -> update blueprint version and canonical hash
  -> project BUILD visuals
  -> materialize scoped physics bodies and joints for RUN
  -> collect physical observations
  -> reset or return to BUILD from the unchanged blueprint
```

The blueprint contains serializable stable part and connection IDs, authored transforms, part kinds, connection endpoints, and selected product data. It never contains Three UUIDs, object references, rigid-body or joint handles, pool slots, velocities, contacts, DOM, or renderer state.

BUILD and RUN have distinct pose owners:

- in BUILD, blueprint projection writes native Three part transforms;
- in RUN, each dynamic body owns the bound object's pose;
- returning to BUILD first disposes the RUN scope, then reapplies blueprint transforms;
- solver motion never silently rewrites the blueprint.

Selection, placement, transform, connection, deletion, undo, mode change, save, and load are atomic commands. A visible ghost is only a candidate. One configured edge commits at most one edit identity, and every rejection preserves blueprint version/hash while publishing one reason.

## Minimum playable slice

Before expanding the catalog, implement:

1. one native build surface, supports/bounds, camera, scale landmark, and reusable part projection;
2. hover/ghost feedback plus one accepted placement and one rejected placement;
3. select, delete or undo, with stable blueprint attribution;
4. deterministic BUILD → RUN materialization of bodies and the selected connection;
5. frozen editing in RUN and observable physical response;
6. reset to the same starting simulation from the same blueprint;
7. RUN teardown followed by a valid BUILD revision;
8. the selected route's closure: objective result and retry, or continuous sandbox revise/save/load.

Hide any tool without a dispatcher, invalid boundary, and feedback state. Button presence, a green ghost, a stable-looking solver, or a compiled joint does not establish a working player loop.

## Placement, picking, and tools

UI owns edges that begin on its controls. A toolbar activation must never also place, select, or delete in the world. Grid snapping, freeform anchors, overlap, bounds, support, budget, capacity, and connection compatibility are validated before a blueprint mutation.

Each visible tool records:

| Tool | Accepted effect | Required rejection |
| --- | --- | --- |
| place | add one stable part | out of bounds, overlap, unsupported kind, or capacity |
| select | change selection only | empty or occluded target according to the declared rule |
| transform | replace one authored transform | locked, unsupported, or colliding transform |
| connect | add one stable endpoint pair | missing, duplicate, incompatible, or unreachable endpoint |
| delete | remove part and owned connections atomically | protected or absent part |
| undo | restore one prior canonical blueprint | empty history or invalid migration boundary |
| save/load, if selected | write or replace validated blueprint data | empty slot, schema/version failure, or invalid references |

## Simulation and objective truth

An objective derives from named physical conditions such as a payload crossing a goal, supported load, reached height, or survival interval. An actuator is part of the simulation, not a success condition: the same controller must still fail when the construction is missing or broken.

A pure sandbox reports structural observations without fabricating win/fail. It remains in the BUILD/RUN/revise loop and only persists state selected by the brief.

## Persistence and presentation

When persistence is selected, save versioned logical blueprint/product state through the current persistence API. Load validates the whole document and references before replacing the blueprint. Rebuild Three projections and a fresh RUN scope; never restore live solver handles or poses.

The scene needs readable bounds, build surfaces, supports, scale cues, and environmental identity; objective routes also need visible goal geometry. HUD shows mode, tool/part, validation reason, simulation controls, and save state when enabled. Budget, objective, and result appear only for routes that own them. Audio/VFX follow committed edit, connection, impact, mode, and result identities.

## Parameter contract

Define project-selected parameter families with units: part dimensions and anchors, body/collider policy, mass/density, snap/rotation increments, overlap tolerance, budget/capacity, connection limits, gravity/material response, camera/picking thresholds, objective rules, undo bound, and persistence version.

Select concrete values from the current brief and measured project geometry.

## Troubleshooting

- Rejected placement changing the blueprint, or a held input creating several edits, points to command validation, transaction boundaries, and edge consumption.
- BUILD-to-RUN or reset/revise losing the authored construction points to blueprint and simulation state sharing an owner.
- A structure that appears supported but collapses, or a visible goal that never settles, points to disagreement between collision, supports, objective predicates, and presentation.
- Save/load duplicating parts or losing connections points to stable IDs and reconstruction order.
- For an affected construction, useful diagnostic context is its route, blueprint version, placement/connection state, simulation owner, and objective state. Existing source and state may be enough; unrelated catalog, sharing, or device diagnostics need not be added.

## Implementation

### Genre-specific owners

- The blueprint owner handles serializable schema, canonicalization, validation, hashing, and undo.
- The build-tool owner converts one semantic command into a blueprint transaction and maintains transient selection and ghost state.
- The run owner handles physics materialization, joints, observations, and RUN teardown.
- The HUD projects validation, save, and simulation state and publishes tool, save, and simulate intent.

Use ordinary `THREE.Raycaster` for visual BUILD picking. When rigid-body truth is required, use the active physics instance's `castRay`, contacts, or overlap and follow [physics.md](./physics.md), including the query `ignore` list. Read exact generated declarations before importing a joint class; current published constraints include fixed, hinge, distance, slider, point, and swing/twist routes, but the project still owns their gameplay semantics.

### State and identity

```ts
type ConstructionMode = 'build' | 'run';

interface BlueprintPart {
  readonly id: string;
  readonly kind: string;
  readonly position: readonly [number, number, number];
  readonly quaternion: readonly [number, number, number, number];
}

interface BlueprintConnection {
  readonly id: string;
  readonly kind: string;
  readonly a: string;
  readonly b: string;
}
```

Add only selected product fields. Canonicalize ordering and numeric precision before hashing. Map blueprint IDs to native visual roots and, during RUN only, to `RigidBody` and joint handles. Those maps are transient and are cleared when the RUN scope ends.

Use project-issued stable IDs. Native objects may carry a transient `userData` lookup to the blueprint ID for picking, but UUID, array position, and pool slot are never blueprint/save identity.

### Input and picking transaction

Convert keyboard, pointer, touch, or gamepad state into one bounded command union such as `selectTool`, `place`, `select`, `transform`, `connect`, `delete`, `undo`, `enterRun`, `resetRun`, `returnToBuild`, `save`, or `load`. Follow [input-handling.md](./input-handling.md) and consume the union at the selected fixed boundary.

For a pointer command:

1. reject the edge when a modal or UI control owns it;
2. convert the measured canvas-local coordinate to Three normalized device coordinates;
3. set one `THREE.Raycaster` from the active camera;
4. intersect only the selected domain: build surface for placement, part roots for edit tools;
5. resolve a stable blueprint ID or placement candidate;
6. validate and commit or reject one action identity in `fixedUpdate`;
7. rebuild changed BUILD projections and publish feedback.

Never mutate the blueprint from hover, render projection, or a DOM callback. A continuous brush is a distinct explicitly selected tool with its own entry/exit identities.

### Blueprint transaction

For every command, copy or reduce from the committed blueprint, validate all preconditions and destination capacity, then commit once. On acceptance, increment version, recompute canonical hash, append one bounded undo record, and update selection consistently. On rejection, preserve blueprint/version/hash and publish one stable reason.

Deleting a part removes its owned connections in the same transaction. Connecting validates both endpoints, kind compatibility, duplicate identity, selected distance/axis rule, and part existence before insertion. Loading validates schema, version, IDs, references, finite transforms, catalog kinds, and product limits before replacing current state.

### BUILD and RUN ownership

Create the shared `PhysicsWorld` once in the session Play scope. BUILD visuals are project-owned native objects whose transforms project the blueprint.

On `enterRun`:

1. validate and freeze the blueprint revision;
2. create `runScope = playScope.child('construction-run')`;
3. create each body with `physics.createAndBindBody(runScope, ...)` in stable part order when it has a native visual root, or `physics.createBody(runScope, ...)` when it is intentionally unbound;
4. create each selected joint in `runScope` only after both endpoint bodies exist;
5. register contact/observation hooks in `runScope`;
6. enable RUN input only after materialization succeeds.

Dynamic bodies publish pose to their bound objects after physics. Do not write those transforms during RUN. Kinematic bodies read native poses before physics, so any kinematic actuator has one declared writer and never bypasses objective collision.

If materialization fails, dispose the partial child scope, restore BUILD projections, and publish a failure reason. To reset, revise, load, or restart, dispose `runScope` once, clear transient maps/ledgers, reapply blueprint transforms, then either create a new RUN scope or return to BUILD. Scope disposal, not guessed endpoint cleanup, owns body and joint teardown.

### Simulation observations

Submit fixed commands before physics and read body pose/contact truth after physics. Allocate stable observation identities for impacts, support state, payload progress, target crossing, and objective result. Use previous/current positions or a swept test when a fast payload can pass through thin visible goal geometry between samples.

An objective settles once from physical conditions. It cannot be set by the actuator, HUD, animation, or elapsed time alone unless the selected rule explicitly makes time the objective. A broken or missing construction producing the same success as a valid one suggests that settlement bypasses the physical outcome.

### Persistence and HUD

When enabled, create one `PersistenceSession` on the runtime session with `PersistenceSession.create(context.session.scope, { ...options, identity: context.session.identity })` and one explicit binding for versioned blueprint/product data. Do not pass `context.scope`. `activateGame` may run more than once; a second `create()` throws — reuse the returned session. `save(slot)` captures registered logical state; `load(slot)` returning false means empty. A foreign schema/version fails loudly. Restore replaces validated logical state, tears down any RUN scope, and rebuilds BUILD projections.

Derive dirty status from a canonical blueprint hash: no saved hash is `NOT_SAVED`; current hash differs is `DIRTY`; exact Undo back to the saved hash is `SAVED`; a successful validated replacement is `LOADED`, then the next accepted edit becomes `DIRTY`.

Construction controls publish intent; scheduler-owned code commits it. Keep noninteractive overlay regions pointer-transparent and explicitly arbitrate toolbar versus world edges. HUD renders the authoritative mode, tool, selection, validation result, blueprint hash/version, save state, and objective/result when selected.
