# Genre: Farm / Life / Management Sim

## Choose the profile

| Profile | Complete loop |
| --- | --- |
| `farm-loop` | buy or obtain seed → prepare land → plant → tend → grow → harvest → ship → settle the day |
| `management` | receive demand → source inputs → produce or serve → collect → deliver → settle the shift → reinvest |
| `life-adventure` | accept request → explore or collect → process when required → deliver → unlock relationship or world progress |

Treat these profiles as composable lenses; an underspecified farming request SHOULD start with `farm-loop`. A restaurant, shop, factory, hotel, or service-business request uses `management` without inheriting unrequested crops, stamina, animals, or seasons; a request centered on NPC commissions, collection, exploration, relationships, and world unlocks uses `life-adventure`; a city or colony builder uses continuous resource/zone/utility ledgers on top of the shared state rules below.

## Shared state rules

Logical identities, quantities, coordinates, deadlines, inventory, currency, and progression are authoritative. Three objects, DOM, and pool slots are projections.

Every purchase, harvest, craft, construction, collection, delivery, and settlement MUST validate phase, reach, resources, and destination capacity before one atomic commit. Rejected actions MUST change nothing. Production deadlines MUST use one declared game-time clock, not browser timers or sleep counts.

Each day, shift, or request has a stable settlement identity. Re-entering the same boundary MUST return the committed result without paying, consuming, rewarding, or unlocking twice.

## Profile-specific rules

### Farm loop

- Keep one calendar/clock owner with explicit active, paused, and sleep boundaries.
- Land actions MUST validate tool, cell state, reach, inventory, stamina, and crop rules.
- Shipping uses an explicit ledger; sleep MUST NOT sell the entire backpack.
- Crop stages, regrowth, season behavior, fertilizer, yield, and quality are project data, not genre defaults.
- The first session MUST teach one complete crop-to-cash transaction.

### Management

- Show each promised production stage, such as ordered, sourced, processing, ready, collected, and served. READY needs a persistent visible collect affordance.
- Machines use absolute game-time deadlines. Processing, selling, cooking, and crafting MUST consume real inventory.
- A purchasable upgrade MUST leave enough resources for the cheapest legal next production cycle or provide an explicit recovery rule.
- Result actions such as upgrade, next shift, and retry MUST be idempotent and have a visible keyboard fallback.

### Life adventure

- Requests, NPCs, packages, relationships, and world unlocks use stable IDs.
- One resolver MUST rank all in-range interaction candidates before dispatch; source-code branch order MUST NOT decide the target.
- Collection and delivery are atomic. Repeated input MUST NOT create a second package or reward, and the wrong recipient MUST NOT destroy the package.
- Every required NPC, collectible, station, gate, and landmark needs a legal approach point inside interaction range.

## Persistence

When save/load is selected, persist versioned logical state and settlement identities through `PersistenceSession`; NEVER persist Three objects, controller handles, physics bodies, DOM nodes, or pool slots. Load into detached staging data, validate the complete document, then replace live state once and rebuild transient projections. An empty or invalid slot MUST leave the current run recoverable instead of partially mutating it.

## Presentation

The HUD MUST show the current activity boundary, resources, selected item or action, blocked reason, next concrete objective, and settlement result. An embodied route also needs stable grounding and reachable paths between every required plot, station, NPC, gate, and exit. A non-embodied management route instead needs reliable pointer/touch selection, one camera owner, and clear workstation state.

## Troubleshooting

- Rejected purchases or deliveries consuming resources, or repeated rewards, point to transaction validation and once-only settlement.
- Crops, machines, or requests completing at the wrong time after pause or restore can come from mixing wall time, game time, and persisted deadlines.
- Duplicated inventory or rewards after load can come from restoring projections as fresh transactions instead of rebuilding them from committed state.
- Restart or continuation losing durable progress can come from resetting persistent and transient owners together. Follow the selected profile's ownership; disabled optional systems need no diagnostic setup.

## Implementation

### State ownership

Use only the slices required by the selected profile:

```text
Profile { unlocks, saveVersion }
ActivityRun { state, clock, settlementId }
FarmGrid { cellsByCoordinate, revision }
Inventory { stacks, selection, capacity }
Shipping { entries, settlementId }
Machines { instancesById, readyAt }
ManagementRun { demand, productionStage, deadlines, settlementId }
Requests { byId, stage, processDueAt, packageId, settlementId }
Relations and WorldUnlocks { values, committedSettlementIds }
```

Each enabled subsystem has one writer. Three objects, DOM, pools, audio, and VFX consume committed state and MUST NOT own inventory, economy, lifecycle, or settlement truth.

An embodied route creates the selected character and physics sidecars in one run scope. A non-embodied management route instead owns pointer/touch station selection and one camera/input path; follow [input-handling.md](./input-handling.md) and [camera.md](./camera.md) for those shared contracts. MUST NOT add an unused character or physics stack.

### Transaction boundary

Every semantic action follows one boundary:

```text
normalize input
→ validate phase, identity, reach, tool, resources, and capacity
→ calculate the complete delta
→ commit once with actionId
→ publish presentation events
```

Purchases, crafting, construction, machine loading, harvesting, shipping, upgrades, collection, and delivery all use this path. Rejection changes nothing.

For management upgrades, validate that the remaining currency covers the cheapest legal next production cycle unless the product defines a separate recovery action.

### Grid and deadlines

Farm cells use integer logical coordinates and project-defined crop fields. Models derive from logical state; pool exhaustion MUST NOT delete or harvest a crop.

Use one game-time clock for crops, machines, animals, shops, orders, and requests. Persist absolute deadlines in that clock domain. On load, calculate remaining time from the persisted deadline and transition immediately when already due. A runtime timer MAY display the wait but MUST NOT replace or restart the authoritative deadline.

### Requests and interaction

Build the complete in-range candidate set, select one target by explicit priority and distance tie-break, then dispatch one transaction for the consumed input edge. Separate NPC, station, and collectible branches MUST NOT depend on source order when ranges overlap.

Request state owns acceptance, collection, processing, readiness, package creation, delivery, and reward. Insufficient material, repeat input, and wrong-recipient attempts leave inventory, package, relationship, and unlock state unchanged.

### Settlement

Night or shift settlement is a pure idempotent function keyed by its settlement identity. It snapshots the activity, consumes only the explicit ledger, calculates transitions in declared order, stores the result, and returns that same result on re-entry.

Result overlays project the committed record. Buttons publish one-shot intents and refresh displayed cash, level, affordability, and availability after same-phase changes. Full-screen containers SHOULD remain pointer-transparent except for actual modal controls, and every action needs a visible keyboard fallback.

### Save and load

When persistence is selected, create one `PersistenceSession` on the runtime session with `PersistenceSession.create(context.session.scope, { ...options, identity: context.session.identity })`. Do not pass `context.scope`. `activateGame` may run more than once; a second `create()` throws — reuse the returned session. Each persistent entity MUST register a stable `saveKey`, a JSON-serializable `capture`, and a `restore` callback that writes detached staging state. Persist versioned logical identities, coordinates, deadlines, ledgers, and settlement IDs; NEVER persist native objects or handles.

An explicit Load or Continue action freezes gameplay and awaits `load(slot)` once for that action identity. `false` means the slot is empty; a foreign schema or version fails loudly. After a successful load, validate the complete staged graph, replace live logical state once, and rebuild character, physics, navigation, DOM, timers, and pools before input resumes. Empty, corrupt, incompatible, or rejected data MUST leave a recoverable current state rather than a partial restore.

Automatic continue is optional. If selected, one bootstrap owner distinguishes fresh boot, pending load, restored run, and failed recovery so the same slot is not requested repeatedly.

### Runtime reset

New Run, Load, Retry, or profile replacement disposes the previous run scope and clears commands, timers, contacts, caches, pose samples, projection mappings, voices, and pool leases before rebuilding. Persistent settlement identities survive only through restored logical state; visual-slot identities never survive.
