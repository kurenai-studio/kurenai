# Genre: Sports

## Choose the sport and route

| Route          | Profiles                                                  |
| -------------- | --------------------------------------------------------- |
| `team-ball`    | goal possession, hoop possession, net volley              |
| `racket-sport` | court bounce, no-bounce shuttle, table bounce, wall rally |
| `target-sport` | pocket table, pin lane, cup course, fixed target          |

An underspecified original request SHOULD use a compact fixed-target match with finite attempts, opponent pressure, result, and replay. A named sport overrides that default and MUST retain its defining play space, equipment, contact order, scoring, and match structure. Racing and checkpoint athletics belong to [3D Racing](./genre_3d_racing.md); a one-shot mechanism without turns, opponents, or match rules belongs to [Puzzle](./genre_puzzle_casual.md) or [Physics Construction](./genre_physics_construction.md).

Online multiplayer starts with the `wanaka:wanaka_game_multiplayer` Skill. An ambiguous multiplayer request MUST be clarified; local multiplayer or AI opposition MUST NOT be presented as networking.

## Product contract

The complete loop is: read legal state and opponent → move, aim, or prepare → commit one skill-bearing action → resolve ordered motion and contacts → update score, turn, or restart once → repeat to a finite result → replay cleanly.

Keep setup, countdown, live play, stoppage, attempt, round, turn, server, and possession as sports-owned substates of active play under one session lifecycle. Pause freezes motion, clocks, AI, scheduled restarts, and action input. A terminal result commits once and locks later gameplay writes.

One rule state owns score, turns, possession, faults, and result. Each moving object has one motion owner. Human and AI input both publish legal intent to the same action resolver. UI, audio, animation, and VFX consume committed events and MUST NOT score or restart the game.

## Route rules

- `team-ball` needs roles, possession or last-touch truth, passing or shooting decisions, defense, legal scoring geometry, and a dead-ball restart.
- `racket-sport` needs serve ownership, predicted intercepts, legal hit windows, ordered net/wall/bounce contacts, rally state, and point/game scoring.
- `target-sport` needs aim and power, action locking while relevant objects move, attempt or turn ownership, legal target/contact rules, and explainable settlement.

Rules MUST resolve ordered contacts and swept crossings rather than final position alone. The ball or projectile remains independent unless the sport explicitly permits possession. Tennis, badminton, billiards, bowling, golf, and archery MUST NOT invent a generic ball owner.

For pull-back aiming, pointer projection, visible guide, release direction, and rule geometry MUST share one coordinate convention. A multi-body shot remains locked until every participating body has stayed below the chosen linear and angular motion thresholds for a bounded fixed-step window.

## Input, camera, and AI

Exactly one local participant owns gameplay input at a time. Follow [input-handling.md](./input-handling.md) for shared input ownership. A switch MUST revoke the previous owner before assigning the next. Press, hold, release, drag, and pointer-cancel behavior must match the visible control instructions; a UI press MUST NOT also issue a field action.

Use one camera owner and follow [camera.md](./camera.md). Keep the active participant, legal play space, equipment, and scoring geometry readable. Visible boundaries and logical collision/scoring geometry MUST agree.

AI MUST choose a route-specific future objective before acting: role or destination for team play, intercept and recovery position for racket play, or a legal target/contact/power outcome for target play. Cooldowns MAY gate repeated actions but MUST NOT freeze movement, planning, turn progression, or recovery.

## Presentation

Show score and result plus the state needed for the selected sport: clock, round or attempt; turn, server, or possession; controlled participant or aim owner; power or hit window; fault/restart call; and replay action. Use labels, silhouettes, stable help, or icons in addition to color. Bind contact, shot, bounce, score, fault, restart, and result feedback to committed event identities.

## Troubleshooting

- Missed scores at high speed or tangent crossings point to the committed motion segment and the selected scoring volume.
- Repeated scores, fouls, or turnovers point to action identity and once-only settlement.
- A stalled AI action or dead-ball recovery can come from a missing transition in possession, turn, or recovery state.
- Pause, result, or replay retaining input, actors, or timers points to session ownership and reset.
- Interpret these symptoms through the selected sport's rules; unrelated sport profiles add no evidence about the affected behavior.

## Implementation

### Native delta

Attach physics only when the selected sport makes rigid-body motion authoritative. Follow [physics.md](./physics.md) for body and pose ownership. Dynamic bodies own their native roots; project motion has one writer; swing animation and orientation correction stay on visual children. Rule state, ordered contacts, and result ledgers—not transforms, HUD text, or animation completion—remain match authority.

Rematch or Replay disposes the match scope and clears commands, action locks, contacts, settlement windows, watchdogs, AI work, cooldowns, ordered rule state, pose samples, animations, and projection maps before restoring the selected formation and seed/replay state.

### 1. Separate shared state from route state

Keep one owner for shared state. Session lifecycle covers entry, active play, pause, and terminal result; route lifecycle names belong in `sportSubstate` and MUST NOT create a competing lifecycle owner:

`phase, sportSubstate, clockOrRound, score, result, ballOrProjectile, participants, currentActionOwner, latestRuleEvent, resetCount`.

Add only the selected route state:

- `team-ball`: `owner, lastTouch, possessionSide, restartSide, formation, roles`;
- `racket-sport`: `server, receiver, serveAttempt, crossedNet, orderedContacts, bounceCountBySide, rallyHitCount`;
- `target-sport`: `attempt, aim, power, shotId, resolutionState, objectsAtRest, targetEvents, remainingShots`;

NEVER let inactive route fields write gameplay. In particular, non-possession sports MUST NOT inherit a team-ball `owner`, and a target-sport action lock MUST NOT become a global freeze for AI or presentation.

Vehicle/course movement, checkpoints, laps, race progress, and rank belong to `genre_3d_racing.md`. NEVER recreate them as a Sports route. Bounded physics puzzles and editable tabletop mechanisms belong to Puzzle and Physics Construction respectively; Sports owns tabletop play only when opponent, turn, foul, legal-target, scoring, and match rules are authoritative.

### 2. Commit ordered rule events once

Use a deterministic frame order:

```text
lifecycle gate
  -> normalize input / choose AI intent
  -> save previous transforms
  -> advance motion
  -> collect ordered contacts and swept crossings
  -> commit one rule resolution
  -> update restart/result authority
  -> project HUD, audio, VFX, and camera
```

Give each action and result a stable identity. A useful target-sport event key is `shotId + objectId + eventType + targetId`; a team or racket event additionally records actor/side and ordered contact index. Mark an object inactive before presentation removes it so it cannot collide, score, or settle twice.

NEVER mutate score, turn, possession, groups, serve, or result directly from multiple collision handlers. Collect candidates, apply the selected profile's precedence, commit one event, and then project presentation.

### 3. Keep geometry reachable and consistent

Visible boundaries, collision planes, object-center travel limits, score/target centers, capture radii, and swept tests MUST use one coordinate contract. Check from geometry and rules that a legal object-center trajectory can reach every score region before tuning difficulty.

NEVER place a capture center outside the reachable object-center envelope while clamping the object inside it. NEVER resolve a solid boundary before testing a crossing that the boundary response erases. Where a visible opening exists, collision geometry MUST have the same opening.

Use previous-to-current swept tests for goal lines, nets/walls when ordered crossing matters, pockets/cups, out lines, and other high-speed targets. Handle tangents and near misses according to the selected rule profile so the swept volume does not become an oversized magnet:

- **`goal-possession` (`football`) vs. `hoop-possession` (`basketball`)**: in football, keep the ball physically independent (never parent it permanently to a carrier) and score only when the complete ball crosses the goal plane in the legal direction and opening; in basketball, score only on a top-to-bottom crossing through the hoop (upward crossings and rim/backboard hits do not score, and rim rebounds stay live).
- **`racket-sport` trajectory and bounce order**: for `no-bounce-shuttle` (`badminton`), apply strong aerodynamic drag with zero playable bounce (first ground contact ends the rally); for `table-bounce` (`table-tennis`), enforce `server table -> net -> receiver table` on serve and direct opponent-table landing on return; for `wall-rally` (`squash`), require front-wall contact before the allowed floor-bounce count expires with no net, and have AI predict reflected intercepts rather than chasing the wall impact point.
- **`pocket-table` (`billiards` / `pool`)**: cushions MUST leave real pocket-mouth openings (never run a full rectangular clamp across a pocket mouth); each step records `firstContact` during ball-ball collision and detects current-point and swept pocket capture *before* cushion rebound response so a pocketed ball is atomically deactivated (`inactive`, velocity cleared, one event recorded) before any rail bounce can erase the crossing; once all active balls settle, `resolveShot(shotId)` alone adjudicates foul/scratch, open-table or group assignment, continuation/turnover, legal non-overlapping cue-ball replacement, and black-ball result.

### 4. Lock one action, not the whole game

At aim/swing/serve/shot commit, allocate one action identity and reject duplicate commit edges until the selected resolution boundary. Continue motion, AI state, clocks, camera, HUD, and watchdog work as required by the profile.

Resolve only when the profile's objects are settled, the rally/point has ended, or a bounded watchdog fires. A watchdog MAY stop pathological motion and enter the normal rule resolver; it MUST NOT fabricate score, skip a foul, grant an AI extra action, or silently delete objects.

For rolling objects, configure each body through the attached world instance with `physics.createBody(matchScope, options)` and the project-selected damping/friction policy. Keep one project-owned settlement record for the complete active `RigidBody` group. Reset it when an action commits and sample it in `postPhysics`. Settlement requires every body's linear and angular speed to remain below their named thresholds for a consecutive fixed-step window; later motion reopens the window. Sleeping does not waive either velocity check, and a bounded watchdog remains an explicit abnormal result rather than normal settlement.

In addition to session restart, Replay clears sports-owned action identity, buffered input, cooldowns, pending contacts and scheduled work. Route keyboard and pointer actions through the same command edge.

### 5. Route-specific AI

AI chooses a route-specific future objective before acting: role/formation spacing for `team-ball` (rather than every actor chasing the ball), predicted post-bounce or drag-affected intercept plus coverage recovery for `racket-sport`, or a legal target/pocket/path with post-shot cue-ball safety for `target-sport`. Difficulty MAY alter bounded reaction, planning depth, aim error, power error, or risk preference. It MUST NOT bypass contact legality, turn ownership, action locks, target order, or result rules.
