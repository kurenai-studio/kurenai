# Genre: Board and Card

## Choose one profile

| Profile | Product shape | Rule authority |
| --- | --- | --- |
| `board-strategy` | placement grid, piece movement, or tactical unit grid | board reducer, legal-action projection, position history, bounded AI |
| `hand-and-tile` | private hand, shared draft, deck/zone cycle, tile placement, effects and scoring | viewer projection, stable component identities, zone conservation, effect queue |
| `track-and-economy` | path movement, properties, auctions, payments and debt | ordered path, recorded random stream, transaction ledger, bounded decisions |

An underspecified board request SHOULD use `board-strategy` against bounded AI with a fixed oblique camera, mouse and keyboard input, decisive/draw outcomes, pause, and rematch. An explicit tabletop-card, drafting, tile-placement, or turn-based deckbuilder/card-battler request SHOULD use `hand-and-tile` (for a deckbuilder or card battler, pair zone conservation and deterministic shuffle with per-turn energy/mana reset and declared enemy intent; compose [Roguelike](./genre_roguelike.md) for node runs or [RPG](./genre_rpg.md) for persistent campaign progression). Grid-based tactical RPGs (`turn-based-tactics`) compose `board-strategy` grid picking and legal-move projection with [RPG](./genre_rpg.md).

## Shared rule model

The complete loop is: read state → select legal action → commit atomically → resolve effects → hand off turn → evaluate outcome. Board, hand, deck, turn, economy, history, randomness, and outcome data are the only rule truth. Native objects, DOM, animation, and camera consume committed state.

One normalized action path validates phase, actor, ownership, topology, blocking, resources, decision identity, and stale input before committing once. Rejected actions MUST change nothing and report a useful reason. Human input, AI, timers, and animation callbacks MUST converge on the same reducer.

Keep setup, turn, decision, resolution, and handoff as board-owned substates of active play under one session lifecycle. Pause freezes rules, AI, decision timers, random consumption, and committing callbacks. A terminal win, loss, or draw locks later rule writes.

## Randomness and hidden information

Each normal new match creates one visible seed and advances only its recorded PRNG state. A fixed/replay mode MAY inject a seed; the same seed and accepted actions MUST reproduce random choices and outcome. Pause, rejected actions, repeated input, and presentation MUST NOT consume randomness.

Private hands, decks, and unrevealed choices use viewer-specific projections. AI, shared UI, native object names, hover labels, and debug displays MUST NOT reveal hidden state.

## Bounded decisions and outcomes

Auctions, trades, payments, drafts, and discards use stable decision IDs, eligible/active actors, monotonic progress, and one terminal condition. A decision MUST resolve, reduce remaining choices, increase a bounded value, or fail explicitly; it MUST NOT cycle. An all-pass auction closes without sale, and a sole remaining leader settles immediately and exactly once.

Define mutually exclusive terminal outcomes before implementation. Position-history keys include the actor to move, live rule-bearing components, special rights, and pending state that changes legal actions. Count the initial position once and each completed action once, never animation frames.

## Profile rules

### Board strategy

Visible cells map exactly to logical targets. Piece movement separates movement topology, attack topology, and post-action legality. Blocking, own occupancy, capture, decisive no-action result, stalemate/draw where applicable, and bounded AI fallback remain distinct. A compound special move commits as one transaction.

### Hand and tile

Deck, hands, market, discard, placed, and removed zones preserve total authored components. Selection, rotation, placement, effects, scoring, pass legality, termination, and rematch commit once. A pass MUST NOT hide a required available action.

### Track and economy

Stable tile IDs form one ordered path or graph. One roll owns random output, movement, pass-start effects, destination resolution, and extra-turn eligibility. Purchases, ownership, rent, fees, rewards, auctions, debt, asset transfer, bankruptcy, and final value use one transaction ledger.

## Input and presentation

Interactive DOM nodes MUST keep identity from pointerdown through pointerup; do not rebuild their ancestors every frame. Follow [input-handling.md](./input-handling.md) for shared edge and ownership rules. Board picking uses one coordinate domain, enforces bounds and a real hit threshold, and rejects UI background, gaps, off-board space, and occluded targets. One-shot keys use press edges.

The game must explain the current actor, legal actions, rejection reason, objective, and terminal reason without external instructions. Use labels, icons, silhouettes, or stable help in addition to color.

Use a native 3D board/table and a fixed near-orthographic or oblique camera unless the brief asks for another view; keep board picking and rule geometry aligned with the submitted camera ([camera.md](./camera.md)). Keep rule geometry readable; piece/card roles, legal targets, ownership, last action, AI thinking, rejection, and result need visible feedback. Camera animation MAY reinforce an action but MUST NOT introduce another base-pose owner.

## Troubleshooting

- Illegal, stale, or off-board input changing the board points to validation occurring after mutation, or an input edge being consumed more than once.
- Lost pieces, cards, or funds can come from a partial compound transaction. Compare the committed state before and after the affected action.
- Stalled AI turns can come from a pending decision with no timeout or no-action resolution. Pause and focus changes can leave the old decision active.
- Identical unintended rematches or inconsistent replay can come from seed mode and random-consumption cursors surviving reset.
- Continued moves after a terminal outcome point to result-lock ownership. Hidden information appearing on the wrong side points to the presentation's access to authoritative state.

## Implementation

### Native delta

Keep rules in serializable TypeScript and project them to native pieces, cards, HUD, and camera. Ordinary board/card routes do not need physics. If physical dice or contacts are authoritative, use the body and query rules in [physics.md](./physics.md), commit their settled observation through the same identified reducer, and never let a resting mesh mutate rule state directly.

A match child scope owns AI, decision timeouts, optional bodies, animations, voices, and projection leases. Rematch disposes that scope and clears RNG cursors, pending decisions, accepted actions, outcomes, and projection lookups before rebuilding. Native UUIDs and pool slots never become rule identities.

### 1. Authoritative state

Use one pure state core containing phase, actor to move, accepted-action history, seed mode, match seed, RNG state or stream cursors, match nonce, pending decisions, and outcome proof. Add only the selected profile's state:

- board strategy: board, pieces, special rights, legal targets, attack state, and position history;
- hand and tile: zones, private hands, deck, discard, market, placements, effect queue, and score ledger;
- track and economy: ordered path, player positions, ownership, buildings or upgrades, decks, payment queue, debt state, and modal decision.

Implement `legalActions(state, viewer)` and a pure reducer before visual motion. Validation MUST precede mutation. Rendering SHOULD consume a committed event such as `{actionId, pieceId, from, to, capture, special}` and MUST NOT call the reducer again when animation finishes.

### 2. Random-stream boundaries

Commit `matchSeed` only when a match actually begins. In NORMAL mode, combine `crypto.getRandomValues` with a monotonic match nonce, record the result, and reject silent reuse of the current or previous match seed. NEVER consume gameplay randomness while the title screen is idle.

In FIXED/REPLAY mode, accept only an explicit test or replay seed. Before replay, clear RNG cursors, deck cursors, pending random events, effects, and result state. The normal player entry MUST NOT inherit this mode.

After seed commit, advance only authoritative PRNG state. Store shuffled deck order and a cursor instead of reshuffling on access. If dice, cards, and AI share one stream, define their consumption order. If they use labeled substreams, derive each substream deterministically from the match seed.

Seed mode, committed match seed, match nonce, and random-consumption cursors are useful state when diagnosing replay or rematch behavior. NEVER infer a new match seed only from the prior final RNG state: identical play can otherwise recreate the same rematch chain.

### 3. Decision liveness

Represent each modal as stable data containing `decisionId`, owner or eligible actors, active actors, passed actors, leader, bounded value such as price or debt, revision, timeout policy, and resolved latch. Revalidate identity, phase, actor, target, and resources immediately before commit.

For an auction:

1. If nobody has bid and every eligible actor passes, resolve no sale.
2. If a valid leader exists and every other active actor passes or becomes ineligible, resolve the sale immediately.
3. NEVER schedule the leader to bid against itself.
4. A bid MUST increase the bounded price; a pass MUST permanently reduce the active set for that decision.
5. Button, keyboard, AI, and timeout paths MUST submit the same identified decision action.

For payment or debt, lock ordinary turn actions until the queue is empty or bankruptcy is terminal. Each liquidation MUST reduce the asset set or clear debt. If neither can happen, the reducer MUST enter an explicit terminal state instead of retaining an unresolvable phase.

### 4. Outcome history and reachability

Define each required terminal's predicate, precedence, and turn/time bound before implementation. When a terminal needs runtime diagnosis, use a bounded legal action script and an explicit seed. A test fixture may establish a compact legal position only through an explicit test/replay entry that normal play cannot inherit.

For piece movement, a canonical position key MUST include the side to move, sorted live piece identities/types/sides/squares, special movement or capture rights, and pending state that changes `legalActions`. Register the initial stable state once. After each atomic action, evaluate decisive no-action outcomes first, switch the actor when the selected rules require it, then register and evaluate history outcomes. Animation frames MUST NEVER increment repetition.

Review terminal reachability from the rules, match limit, initial resources, costs, and AI policy. If a required outcome is unreachable, correct the implementation or balance within the brief, or report the conflict. Do not seek a terminal through unbounded random play.

### 5. Native DOM UI and board picking

Update stable DOM nodes by text, class, style, dataset, or keyed child diff only when their data changes. NEVER replace a clickable ancestor between pointerdown and pointerup. Keep the scene-lifetime listener bindings across Rematch; update or clear board data, not bindings.

Use a full-screen overlay from `hudElement()` on `context.viewport.overlayContainer` with no pointer ownership by default; restore pointer events only on interactive controls. Assign pointer ownership explicitly for menu, active board, modal, paused, and result phases.

For a fixed oblique board, convert the measured canvas point to native Three normalized device coordinates and use `THREE.Raycaster`, or project cell corners with the active camera and measured canvas bounds. Pointer and targets MUST share one coordinate domain. Picking must distinguish cells from gaps, UI background, occlusion, and off-board space; use corner/edge/center probes only when diagnosing picking. NEVER use unbounded nearest-cell snapping.

Read current `InputSession` declarations before choosing key names. Key queries use browser `KeyboardEvent.code` strings such as `Digit1`; support only codes actually wired and tested. In `update`, read render-frame edges from `input.frame.wasPressed(...)` or `input.frame.wasReleased(...)`; latch those or pointer-button edges into pending start, selection, rotation, roll, bid, pass, pause, or replay commands once, then consume them from a `FixedInputConsumer` during `fixedInput` so held input or multiple fixed steps cannot repeat an action.

### 6. Piece movement

Generate pseudo-legal actions from piece topology and blockers. Apply each candidate to a copied rule state, compute the resulting attack map, and filter actions that leave the acting side in an illegal threatened state. Legal-target rendering MUST consume only the filtered set.

Compound moves MUST be one transaction: move every participating piece, remove any off-target captured piece, replace a promoted or transformed piece, update special rights, clear or set pending capture state, then evaluate outcome. Partial animation MUST NOT expose an intermediate legal board.

When the rule set protects a royal or objective piece, exclude direct capture from legal targets and emit victory from threat plus no legal response. Distinguish attack topology from movement and capture in both code and player explanation.

### 7. Hand and tile

Represent each component with stable identity and exactly one authoritative zone. Preserve the invariant `deck + hands + market + discard + placed + removed = authored total` after every action and rematch.

Selection and rotation MUST reference component identity plus current revision, not an array index that can change after draw or discard. Placement MUST validate board bounds, occupancy, adjacency, edge matching, orientation, resource cost, and stale revision before one atomic zone transfer.

Resolve effects through a finite queue of identified entries. Each effect MUST advance or close the queue. Score, bonuses, HUD, audio, and VFX MUST derive from committed placement/effect facts. A line, set, or multi-edge bonus MUST record its awarding identity so repeated frames cannot award it again.

### 8. Track and economy

Define the path with stable tile identities and ordered adjacency. A roll action MUST freeze dice faces, total, extra-turn eligibility, and roll identity before animation. Step movement SHOULD emit pass and arrival events from the ordered path; arrival MUST settle once after the final step.

Classify the destination before opening exactly one modal: purchase, auction, payment, event/card, detention, building/management, or end-turn. A camera shot or movement callback MUST NOT own economic settlement.

Route all cash and ownership changes through one transaction ledger. Each transaction SHOULD record identity, payer, payee or bank, amount, reason, pre/post balances, property transfer, and resulting debt. Validate cash plus owned assets against the declared final net-worth formula.

Debt resolution MUST prevent rolls, purchases, auctions, and end-turn actions from interleaving. Liquidation MUST apply the selected ordering rule deterministically. Bankruptcy MUST atomically transfer assets to a creditor or return them to the bank, close pending decisions and payments, then evaluate the remaining winner.
