# Multiplayer rooms

The `room` API wires the platform's authoritative multiplayer surface into the Engine: the room facade and its fixed-rate tick driver, `defineEntity` entity projection, character motion adapters, and the launch bridge that forms this peer's room from the trusted host's launch grant. Every `room.*` member below comes from `@wanaka/multiplayer-runtime` unchanged; the Engine adds no role queries and no guards of its own.

A multiplayer game is authored as two modules with a fixed boundary:

- `game/simulate.ts` — the simulation module. Its exported `declareRoom(context, platform)` declares the room: shared state, entity collections, actions, presentations, and rules. It runs on every peer — a headless authority included — before play, so it never reads input, the camera, the HUD, or the scene. When entities need physics it also exports `createPhysicsWorld`.
- `game/play.ts` — input, camera, and HUD. Its `activateGame` receives the room narrowed to its client view plus the handles `declareRoom` returned, and only ever reads shared state and dispatches already-declared actions.

Read [room.d.ts](../engine-api/room.d.ts), [play-host-room.d.ts](../engine-api/play-host-room.d.ts) (which also carries the narrowed client facet: `RoomView`, the collection views, and `SimClientHandles`), and [room-launch-bridge.d.ts](../engine-api/room-launch-bridge.d.ts) before using an unfamiliar member. Two compiled examples carry the split end to end: [room-shared-state.ts](../../examples/room-shared-state.ts) for declaration, actions, and plain entity projection with the play-side read, and [room-controlled-character.ts](../../examples/room-controlled-character.ts) for character motion with the play-side `controls()` feed. That character example attaches unspecified appearance on Play: it copies the collision object's pose directly onto a catalog GLB because `{ object }` writes the capsule bottom and the published body root is feet-origin. Jump and fall clips require `createAndBind(..., { model })`, which entity `create` cannot await; the mixer infers only grounded idle/run from the model's XZ.

## Declaring multiplayer

A project is multiplayer because it declares `game/multiplayer.ts`:

```typescript
export const multiplayer = { minPlayers: 2, maxPlayers: 4 };
```

There is no separate enabled flag. The counts **MUST** be written inline as a plain object literal; a computed value is refused rather than guessed at. The scaffold's multiplayer kind emits this file together with the `game.ts` composition root, `simulate.ts`, and `play.ts`; `game.ts` registers both module entries:

```typescript
play: () => import('./play.js'),
simulate: () => import('./simulate.js'),
```

Engine hosts hand the declared config to the launch bridge, which validates it and refuses to boot on a malformed or out-of-range declaration. `enable_multiplayer` selects that kind for the current project.

## Room session: `platform.roomSession`

Play sync (`platform.room`) is separate from room **control** (create / join / ready / start / leave). In a real multiplayer launch, the Player Shell attaches `platform.roomSession` so the game owns the room HUD through the Port. Read [room-session-bridge.d.ts](../engine-api/room-session-bridge.d.ts) and the compiled example [roomsession.ts](../../examples/roomsession.ts). New multiplayer scaffolds emit `game/roomsession.ts` mounted from `play.ts`. Declaring multiplayer without calling `platform.roomSession.create` from authored source fails Preview and Export. Binding the Port without creating is not enough. For `persistenceMode: 'none'`, label the action `Create Room`. For `room` and `player`, put **Create New Game** and the mode-appropriate Load action on that same authored page, and send the clicked action as `saveSelection: 'new' | 'load'`. Put a room-code input and Join action on the same page for every persistence mode. The trusted Player Shell owns membership, credentials, and the authenticated save list; authored code never supplies a save id, revision, control token, or credential. A game authored only for single-player can omit `game/multiplayer.ts`. Ordinary browser Solo Preview also runs multiplayer-authored projects locally with their existing player bounds unchanged: `platform.roomSession` is a non-null, observation-only Port for one real local player and local authority. Its snapshots and subscriptions expose local identity, roster, and lifecycle, not a remote room or a signed-in account. `supported` is null and all `can*` flags are false; room-control and login actions reject locally without remote RPC. Keep the null guard for hosts such as headless runtimes that may provide no Port. Choose HUD phases from lifecycle and online controls from `supported` and `can*`, rather than Port presence or player count. Authored bots and NPCs remain; Solo adds none. Use Multiplayer Test or a real room to check Ready / Start, peer synchronization, and server authority. Do not invent a Host / Join / world-select HTTP entry.

**Flow the game owns in real rooms**

1. **Create** — draw create as an in-game room HUD (same visual language as Ready / Start), not browser `<select>` or `input[type=number]` forms. Edit the session nickname in the HUD (`suggestedNickname` / `confirmedNickname`); when unsigned, show Log in and call `port.requestLogin()` (Shell opens SSO). Call `port.setNickname` when the player changes the name before Start. Prefill from `suggestedNickname`; when `regions` is non-empty, preselect `preferredRegion` on HUD region buttons (keep a Nearest option). Call `port.create({ nickname, capacityMaxPlayers, capacityMinPlayers?, saveSelection? })`, omitting `saveSelection` only for `none`. `capacityMaxPlayers` is this room's seat cap within `supported`; `capacityMinPlayers` may raise the Start floor above the game min. Omit `region` to let the shell open the measured nearest region. After Log in succeeds while still Waiting, the Shell pushes the account display name through `setNickname` so every peer's roster updates — the game only repaints from Port; it **MUST NOT** invent its own login-adopt path. Manual rename after that still goes through `port.setNickname` as usual.
2. **Room-code Join** — keep a plainly labeled room-code input and Join action visible beside Create before Membership. On one click, call `port.join({ roomCode, nickname })`; trim and uppercase the code, and pass the nickname shown on that same authored page. Do not save the nickname on blur first: Join carries both values atomically. Disable Create, Load, the room-code input, and Join while any Port action is pending; show `Joining…` while `pending === 'join'`, catch a rejected Join Promise, and keep the HUD mounted with the error so the player can correct the code or name and retry. Never navigate the frame or top page and never call room HTTP directly.
3. **Invite Join (Shell)** — guests may also open `inviteUrl` (`?room=`). The Player Shell performs Join for that tab exactly once, using the tab's current session nickname (placeholder or account name). The game does not call `create` to enter an invited room and does not assume display nicknames are unique in the roster (`peerId` distinguishes people). After Membership appears on the Port, paint Waiting (rename until Start via `setNickname` when `canSetNickname`). Copy `view.inviteUrl` only to share; sharing does not join.
4. **Ready / Start / Leave** — `port.setReady`, `port.start` (host), `port.leave`. Gate buttons on `canSetReady` / `canStart` / `selfRole`. Before Membership, show an editable nickname only when `canSetNickname` is true; signed-in create uses `confirmedNickname` and does not offer a nickname field. Waiting-room rename remains available to signed-in and guest members while `canSetNickname` is true. When a nickname input saves on blur, keep Ready and Start clickable and let their handlers await the same save Promise before sending the room action; disabling either button during that save can swallow the click that caused the blur.

Boot calls `activateGame` before Membership so shared UI and styles can mount, then runs `declareRoom` and `activateWaiting` once the room forms (with simulate handles); legacy modules without `activateWaiting` receive a second `activateGame`. Solo preserves this order, publishing `playing` after local initialization before calling `activatePlaying`; readiness follows actual scene readiness. For real rooms, Engine calls `activatePlaying` only when control lifecycle is `playing` — Start remains `platform.roomSession.start`. Keep the session UI mounted across phases. Do not dispose it when `sim` arrives — that is Membership, not Start. Match input and match HUD that read `sim` start only in `activatePlaying`. Faction selection, when the game has factions, is waiting HUD in `activateWaiting`. The scaffold's `play.ts` is that stitch; [roomsession-play.ts](../../examples/roomsession-play.ts) composes it with in-room standings.

The runtime holds actions dispatched before the first authority snapshot in a bounded local admission queue, retries this peer's `hello`, then sends those actions in call order once the snapshot proves the authority admitted the peer. Do not add a timer or retry loop around an initial action from `activateWaiting`. Keep player-setup actions idempotent so repeated UI input cannot create duplicate records. The start rule and match actions should read the same authoritative player state; do not let a separate side map unlock Start while the score path still lacks that player's record.

Do **not** fetch room HTTP paths from game source; the skill pipeline rejects them. Credentials stay in the shell; the Port is credential-free.

Create, roster, ready, and the waiting-room leave action stay in `game/roomsession.ts`. Hide that waiting HUD when `lifecycle === 'playing'`. In real rooms, draw a game-native match HUD from `activatePlaying`: use `roomSession.getSnapshot()` for the roster, `roomRegion`, and `connectionState`; expose `leave()` to every player and the Host-only `end()` action; use `platform.roomDiagnostics()` for the local carrier and `networkRttMs`. Disable Leave and End room while the Port is pending or the connection is not connected, and catch their rejected Promises to show the reason in the game HUD. The Shell does not render normal in-match room status or actions, so every multiplayer game MUST ship this native match HUD with both the all-player Leave action and Host-only End action. The Shell retains only recovery and terminal interruption notices that the running game cannot safely own. When `lifecycle === 'ended'`, keep the native HUD up, tell the player why from `endReason`, and call `port.returnToLobby()` once `canReturnToLobby` is true so create can show again. The shell does not cover the frame after Membership or after the room ends — invite guests included; it does not fall back to Join Room for an ended invite. `returnToLobby` drops the invite binding so the tab paints create, not Join on the dead room. Waiting ∪ starting are wait phases; only `playing` unlocks match play.

In simulate, use `room.onWaitingTick` for waiting-phase shared rules and `room.onTick` for match-phase rules. Existing `room.actions` stay available in both phases.

## Factions (game logic)

Factions are not control-plane fields. A seat has no side. If the game divides players, design that in `simulate.ts`: which factions exist (one or more), that a missing `factionByPeer` entry means unassigned, how a player chooses or changes a side, and which distributions may start.

Joining does not assign a side. Choosing a side is a waiting-phase process. A pick or a change may leave the room outside the start rule; do not reject it for that. The waiting HUD must match the game's rule: list only factions the game defined, and offer a pick or a change only when the rule gives the player that ability. Mount it from `activateWaiting`. Hide it once `lifecycle === 'playing'`. Do not reassign sides after Start.

`canStart` only means the control plane will accept Start. The host calls `port.start` only when `canStart` is true and the game's own distribution check passes. On failure, stay on the waiting HUD.

```typescript
type FactionId = 'alpha' | 'bravo';

const state = room.state({
  /** Absent peer id means unassigned. The union is this game's faction list. */
  factionByPeer: {} as Record<string, FactionId>,
});

const actions = room.actions({
  joinFaction(by, faction: FactionId) {
    state.factionByPeer = { ...state.factionByPeer, [by]: faction };
  },
});

/** This game's start rule. Replace the body; do not treat it as a platform check. */
function distributionMayStart(players: readonly string[]): boolean {
  const counts = { alpha: 0, bravo: 0 };
  for (const id of players) {
    const faction = state.factionByPeer[id];
    if (faction !== 'alpha' && faction !== 'bravo') return false;
    counts[faction] += 1;
  }
  return counts.alpha >= 1 && counts.bravo >= 1;
}
```

The waiting HUD reads `sim.state.factionByPeer` and dispatches `sim.actions.joinFaction`. Room capacity (`supported` / `capacityMaxPlayers`) still caps total seats only.

In-room standings are the same optional pattern: the authority writes a board on `room.state` (`onTick` or an action); play ranks `room.players` and paints HUD. Field names are the game's. Do not accumulate scores in `presentations` (late joiners never replay them) and do not submit them through `platform.leaderboard` (cross-run high scores; the headless authority cannot call it). Compiled slice: [room-leaderboard.ts](../../examples/room-leaderboard.ts). Mount that HUD only after Start: [roomsession-play.ts](../../examples/roomsession-play.ts).

## Declaring the room: simulate.ts

`declareRoom` receives `SimulateSceneContext` and `RoomPlatformBridge` — the platform whose `room` is already formed and carries the full declaration surface:

```typescript
export async function declareRoom(
  context: SimulateSceneContext<typeof scenes>,
  platform: RoomPlatformBridge,
) {
  const room = platform.room;
  const state = room.state({ ... });
  const actions = room.actions({ ... });
  return { state, actions };
}
```

`room` is required, not optional. Engine hosts complete `declareRoom` only after the room has formed, so declaration code never guards it, never narrows a union, and never awaits it. Return the declared `state` plus the action dispatchers; extra members ride the handles to play unchanged. Leave the return type inferred — play derives its narrowed view from it, so the declarations have no second source of truth.

`context` is `SimulateSceneContext`, **not** the full scene context: it carries the scene id, the ownership scope and the session, and nothing else. The room's authority is a headless process that never draws, so authored scene nodes, the renderer, the viewport, the HUD host and scene navigation are not offered here — reaching for one is a compile error, and refused at runtime as well. Anything that needs them belongs in play. `createPhysicsWorld` takes the same narrowed context, so a collision world **MUST** be built from data the simulate module carries itself rather than read off `managed.nodes`.

Asset loading is absent for the same reason, one step further out: an authority computes state and draws nothing, so it has no asset origin to fetch from — a model URL that resolves against the page in a browser resolves against nothing in a Node process. `context.services` is therefore not offered here either, and its fix is **not** "move it to play": a model loaded in play is just as absent from the authority. A simulate module **MUST** declare the geometry it needs as data — a mesh collider takes the plain-data `TriangleMeshColliderShape` (`{ kind: 'mesh', vertices, indices }`) directly, so pass the vertices the simulation owns rather than reaching for `Object3DMeshColliderShape` over a loaded model.

Annotate both `declareRoom` and `createPhysicsWorld` with `SimulateSceneContext`, never with the project's full scene-context alias. Only `createPhysicsWorld` fails to compile on the wider annotation — `declareRoom` is a method, so its parameters are checked bivariantly and the wider type slips through, then throws on the authority at runtime.

Every peer runs the same `declareRoom` against its own formed room; only the authority additionally runs the declared rules. It therefore **NEVER** branches on role, reads input devices, or touches scene objects — the entity projection owns the scene side of every record.

## Reading the room: play.ts

A multiplayer project's `activateGame` is typed for both calls: `PlatformBridge | RoomViewPlatformBridge`, and `sim` only on the second. After Membership, `room` is narrowed to `RoomView` (identity, roster, shared time; no declaration members) and the simulate handles arrive as the third parameter. Type those handles by deriving from the simulate module itself:

```typescript
import type { SimClientHandles } from '@wanaka/multiplayer-runtime';
import type { PlatformBridge } from 'wanaka-studio-engine/platform-bridge';
import type { RoomViewPlatformBridge } from 'wanaka-studio-engine/play-host-room';
import type { declareRoom } from './simulate.js';

type Sim = SimClientHandles<Awaited<ReturnType<typeof declareRoom>>>;

export async function activateGame(
  context: SceneContextForCatalog<typeof scenes>,
  platform: PlatformBridge | RoomViewPlatformBridge,
  sim?: Sim,
): Promise<void> {
  // Mount roomsession on the first call; keep it.
  // After `'room' in platform` and lifecycle === 'playing', read sim.
}
```

`SimClientHandles` maps the declared `room.state` tree to its read-only client view: entity collections narrow to their views (reads only; `controls()` on a controlled collection), plain values become deeply read-only, and every dispatcher member passes through unchanged. The narrowing is compile-time only — at runtime play holds the very same instances simulate declared against — but a play-side shared-state write or re-declaration is now a compile error instead of a runtime rejection.

## Shared state, actions, and the shared clock

Declare the room's one shared state tree in `declareRoom`, from a plain object literal. An entity collection **MUST** be a direct top-level field of that literal; the runtime discovers collections by that position and rejects a nested one at declare time.

`room.actions({...})` declares the action map. Each handler's first parameter is `by`, the calling player, supplied by the runtime and never by the caller — the returned call surface drops it, so a `(by, key)` handler is dispatched from play as `sim.actions.take(key)`. `room.onTick(handler)` registers a per-frame rule that runs once for the shared game and reaches every other peer as a delta.

`spawn`, `despawn`, and `setFields` are shared-state writes: call them only from inside an action handler or `onTick`. The client views play receives do not carry them, so play cannot reach for them by accident; simulate code outside a handler or `onTick` is rejected on most peers and can appear to work locally on the one where it is not, leaving the rest out of sync.

A record's `fields` view stays writable only while that record does. After `despawn(key)` or `setFields(key, …)`, every view already read for that key — a handle, a rule context, an `all()` entry, or a local variable holding one — rejects writes by throwing out of the tick, and on a server-authority room that ends the room. A call that can despawn (damage that may kill, a pickup that consumes) therefore closes the record for its caller too: apply every effect to the record before that call, or re-read it with `get(key)` afterwards and skip the remaining writes when it returns `undefined`.

Use `room.tick` and `room.tickRate` wherever a single-player game would reach for a wall clock; `Date.now()` differs on every machine and desyncs shared state. `room.me` is this peer's own player id and `room.players` is the live roster of who is connected right now — read it fresh rather than caching it, since a newcomer grows it on every peer. `room.playerName(id)` stays answerable for a player who has dropped, which `players` does not. `room.peers` is every peer attached to the room, the service peer that runs a server-authoritative room included; that peer is never in `players`, so seats, head counts, and scoreboards read `players`, and only a check that the room really runs on a service peer reads the gap between the two. `run_multiplayer_test` forms its rooms the same way, so a suite never sees the service peer in `players` either. All of these remain readable from play through `RoomView`.

`room.presentations({...})` carries transient render-only signals and is declared in simulate. Its handlers run on every peer and are never written into shared state, so a peer that joins later never replays them; a peer-local reaction compares the payload against `room.me` instead of asking what role it is playing. Expose what play needs from a presentation reaction as an extra member on the returned handles (see the shared-state example's `myScore`).

## Entity types and the entity projection

`defineEntity({ name, create })` declares a project's stable anchor for one `room.entities(...)` object type. Call it once per entity type, at module scope in `simulate.ts`, and pass the returned handle itself to `room.entities(...)`:

```typescript
const Pickup = defineEntity({ name: 'pickup', create: (scope) => ({ root: buildPickup(scope) }) });
const state = room.state({
  pickups: room.entities(Pickup, { schema: room.sharedFields<PickupFields>() }),
});
```

- `name` **MUST** be non-empty and unique among every handle used in one room. An empty or all-whitespace name throws at declare time; a duplicate is rejected the moment the second handle reaches `room.entities(...)`.
- `create(scope, ctx)` builds the object and returns `{ root }` (plus `body` for a physics-backed type). It **MUST NOT** parent `root` or write `root.position` itself — the projection parents it under `ctx.scene`, seeds and drives its pose, and disposes that entity's own child scope on despawn, which tears down everything `create` registered. A physics-backed type still passes its own starting position to the body it constructs.
- `ctx.world` and `ctx.spawnPose` are optional on the context. A physics-backed room entity **MUST** be registered only when the simulate module exports `createPhysicsWorld(context)` to supply the scope-owned world before Engine room attachment; project code does not build room boot glue. (`PlayModule.createPhysicsWorld` remains only as the compatibility slot for a game without a simulate module.)
- For a collection with **no** declared motion, the record's own `x`, `y`, and `z` fields are the position channel: the projection writes them onto `root.position` every tick, smoothed against the display's frame rate. Rotation is not projected — drive it yourself from `onTick` when an entity needs facing.
- `room.entities(..., { adopt: { instances, fields } })` claims preset scene instances instead of spawning. Each key in `instances` **MUST** be the `.name` of an object the scene module already placed and added to the scene; `fields(instance)` seeds that record's initial fields, deterministically, on every peer. The projection binds the placed object — `create()` is never called for an adopted key, a declared instance missing from the scene fails loud on the first frame, and despawning an adopted record unmaps the object without destroying it. A positional field the record does not carry reads the placed pose, so an adopted record with no `x`/`y`/`z` fields stays exactly where the scene author put it. Adopt **MUST NOT** be combined with declared motion — a placed node has no simulation body for a motion adapter to drive; spawn motion-driven entities with `spawn()` instead.

## Controlled character motion

`defineCharacterEntity` is `defineEntity`'s physics-backed counterpart: its `create` **MUST** return a real `CharacterController` as `body`, and its handle is tagged `'character'`. `controlled(handle, { by, as })` declares that collection's motion — in simulate, with every other declaration — and the handle's tag and `as` share one type parameter, so a mismatched pair fails to compile.

`by` names the record field holding the controlling player's id. That field **MUST** be typed with the room's own branded player-id type, reachable from authored code as `Room['me']`. A field left as plain `string` collapses the check to `never`, and the compiler error then names the field without ever mentioning the type — retype the field rather than the call site.

`controls(read)` registers this machine's own input rig, and it is the one declaration-shaped call that belongs to **play**: call it on the collection's client view (`sim.state.runners.controls(...)`), never in simulate — the simulate module runs identically on every peer, and the room's authority has no keyboard. It runs on every peer, once per room tick, only for the entities that peer controls, and returns the frozen `CharacterCommand` shape: `moveX`, `moveZ`, `jump`, `lookYawDeg`. Nothing is sent by hand. The Engine adapter converts the world-space movement, yaw, and jump edge into one `character.control()` frame; it does not write the entity root directly. Every other peer replays the same command through the same adapter as it arrives, and the published snapshots correct that replay when it has drifted too far to close on its own.

`CharacterCommand.moveX` and `moveZ` are world-space velocity components in meters per second. Choose a movement speed for the game's scale and pace, convert device input into the intended world direction, limit combined input to unit length, and multiply by that speed. A normalized direction alone requests only 1 m/s; multiplying by frame delta turns velocity into the wrong unit. For keyboard controls, copy [room-keyboard-input.ts](../../examples/room-keyboard-input.ts): it converts camera-relative WASD to world velocity, keeps diagonal movement at the configured speed, and retains jump edges until a room tick samples them. Pass its reader to `activateRunnerPlay`; touch or other input rigs can supply their own reader through the same callback:

```typescript
const readLocalInput = createRunnerKeyboardInput(
  context.scope,
  context.session.scheduler,
  window,
  camera,
  moveSpeedMetersPerSecond,
);
await activateRunnerPlay(context, platform, sim, readLocalInput);
```

If a character walks too slowly, compare the requested command speed with displacement over elapsed game time under actual input. A headless multiplayer test that injects `moveX`/`moveZ` directly does not exercise the keyboard-to-command conversion in play.

`controlled(handle, { as: 'vehicle' })` is a declared adapter with no engine vehicle implementation behind it. It type-checks and throws the moment it is called; drive such an entity from `onTick` by hand instead.

### Bots: an entity the authority steers

A bot is not a separate mechanism. It is an ordinary `controlled` entity whose `by` field names **the authority's own player id** instead of a human's, so every part of the channel that already carries a player's character carries a bot too — the same command fan-out, the same replay on every peer, the same corrective snapshots.

Spawn it with `room.me` as its driver, from simulate:

```typescript
const Bot = defineCharacterEntity({ name: 'bot', create: (scope, ctx) => buildBot(scope, ctx) });
const state = room.state({
  bots: room.entities(Bot, {
    schema: room.sharedFields<BotFields>(),
    motion: room.controlled({ by: 'driver', as: 'character' }),
  }),
});
// The AI. Registered in SIMULATE, unlike a human's input rig.
state.bots.controls((entity) => decideBotCommand(entity.fields));
room.onTick(() => {
  if (state.bots.keys().length === 0) {
    state.bots.spawn({ fields: { driver: room.me }, pose: spawnPoint() });
  }
});
```

- The AI reader is registered in **simulate**, which is the opposite of a human's `controls()` rig — and for the opposite reason. A human's rig reads an input device, which only that human's machine has; a bot's reader is shared logic, and the machine that must run it is the authority, which never runs play. **NEVER** branch it on whether this peer is the authority: `controls()` already runs only for the records the calling peer controls, and a bot's driver is the authority, so a replica registers the identical reader and never runs it.
- **Many bots naming one driver id is not a collision.** Everything that addresses motion — command sequencing, the resend history, the receiving cursor, the identity a snapshot travels under — is keyed by the record; the driver is only the fence deciding who may send that record's commands, and one id may stand behind any number of records. The reader runs once per record the calling peer controls, so it **MUST** derive its command from the `entity` it is handed. A reader that returns shared state instead steers every bot identically.
- **A collection has exactly ONE `controls()` reader.** Readers belong to the collection, not to a record, and registering a second one replaces the first — silently. Whichever survives then supplies the command for **every** record that peer controls, so a play-registered input rig and a simulate-registered AI **MUST NOT** both be registered on one collection. Two shapes satisfy this: give bots their own collection, each side registering its own reader; or keep humans and bots in one collection and register a single reader **in simulate** that branches on the `entity` it is handed — in which case play **MUST** publish this machine's input through a value that reader reads, instead of registering a reader of its own.
- A bot's driver is the authority, and in a server-authority room the authority is a service peer that `room.players` deliberately excludes. Validate a driver against the record, never against `room.players`, or every bot reads as unclaimed.
- Authority-driven motion is the ONE case where an entity moves under a controller nobody is holding a device for. An entity with `by` left `null` is a different state entirely: nobody steers it, it is issued no motion identity, and it does not move.

## Verifying the room: game/multiplayer_test

This section is a reference for a multiplayer test you have chosen to pursue.
Preparing and running a suite adds time; a multiplayer iteration can be delivered
without one. Shared-action disagreement, late-join state loss, and divergent
controlled motion are common starting points for cross-peer investigation.

When using `run_multiplayer_test` for a project that declares `game/multiplayer.ts`, provide a suite under `game/multiplayer_test/`; the harness reports a missing suite as a diagnostic failure. A suite is project code that `run_multiplayer_test` runs headlessly on several peers at once: it is not reached from `game.ts`, is not part of the Play bundle, and `npm test` does not run it. Import only the test entry and the simulate module's own type:

```typescript
import { defineMultiplayerTest } from 'wanaka-studio-engine/multiplayer-test';
import type { declareRoom } from '../simulate.js';

export default defineMultiplayerTest<typeof declareRoom>((test) => {
  test.step('name', async (m) => {
    // …
  });
});
```

Collection, action, and field names inside the steps are this game's own: `m.actions(peer)`, `m.state(peer)`, and `m.records(peer, collection)` are typed from what `declareRoom` returns, so a name the game never declared fails the tool's type check before any peer boots. The complete `m.*` table lives in the tester Skill.

For shared-action verification, a useful focused suite can: join the declared player count; dispatch, from a player that is not the authority, at least one action the game declares; run a few ticks; and assert that a game fact only that action could have produced reads the same on every player. Asserting bare equality is not enough — the tool's UNIVERSAL block already checks that every field converges; the step has to cause the fact and read it back. When late-join behavior is relevant and `maxPlayers` leaves a seat free, join a late player afterwards and compare that fact.

When verifying replication of a `controlled` character, a useful scenario is to: have every player obtain its own character through the game's declared action; hold a movement command on one player under a network preset other than `clean` for a stretch of ticks; and assert another player's `pose` of that character is within tolerance of the mover's own. `assertNear` with no tolerance derives one from the measured speed and the chosen preset, and the report prints the derived bound.

Input is the engine command shape — `moveX`, `moveZ`, `jump`, `lookYawDeg` — not key names: play never loads in this harness, so the key-to-command mapping is not what is under test. Network presets are named (`clean`, `lan`, `incident-jitter`, `heavy-jitter`, `cross-ocean`, `cross-ocean-spike`, `lossy`); the numbers behind them belong to the platform, and the tool never re-runs a suite under a preset the suite did not name.

A minimal suite for a duel whose simulate declares a `soldiers` collection with a `driver` field, a `join` action that spawns the caller's soldier, a `fire` action taking `{ yawDeg }`, and a shared `score`. `m.join` returns an array indexed as possibly `undefined`, so every peer is guarded with an explicit `throw` before it is used:

```typescript
import { defineMultiplayerTest } from 'wanaka-studio-engine/multiplayer-test';
import type { declareRoom } from '../simulate.js';

export default defineMultiplayerTest<typeof declareRoom>((test) => {
  test.step('remote sees my movement within tolerance', async (m) => {
    const [mover, observer] = await m.join(2);
    if (mover === undefined || observer === undefined) throw new Error('join(2) returned fewer than two peers.');
    m.actions(mover).join();
    m.actions(observer).join();
    m.run(2);
    const moverSoldier = m.records(mover, 'soldiers').find((r) => r.fields.driver === mover.id);
    if (moverSoldier === undefined) throw new Error('mover has no soldier after join.');
    const mine = moverSoldier.key;

    m.network('cross-ocean');
    m.hold(mover, { moveX: 1, moveZ: 0, jump: false, lookYawDeg: 0 });
    m.run(120);
    m.release(mover);
    m.run(30);

    m.assertNear(
      m.pose(observer, 'soldiers', mine),
      m.pose(mover, 'soldiers', mine),
      undefined,
      'observer lags mover beyond the derived bound',
    );
    m.assertEqual(m.motion(observer, 'soldiers', mine).snaps, 0, 'observer snapped while mover walked');
  });

  test.step('hit resolves on the authority from its own view', async (m) => {
    const [shooter, victim] = await m.join(2);
    if (shooter === undefined || victim === undefined) throw new Error('join(2) returned fewer than two peers.');
    m.actions(shooter).join();
    m.actions(victim).join();
    m.run(2);
    const victimSoldier = m.records(victim, 'soldiers').find((r) => r.fields.driver === victim.id);
    if (victimSoldier === undefined) throw new Error('victim has no soldier after join.');
    const target = victimSoldier.key;

    m.network('cross-ocean');
    m.hold(victim, { moveX: 0, moveZ: 1, jump: false, lookYawDeg: 0 });
    m.run(30);

    m.actions(shooter).fire({ yawDeg: 90 });
    m.run(40);

    m.assertEqual(m.state(shooter).score, m.state(victim).score, 'score diverged across peers');
    m.log(`shooter-vs-authority target gap: ${m.intentGap(shooter, 'fire', 'soldiers', target).meters} m`);
  });
});
```

`intentGap` only measures: it is the distance between where the shooter's screen showed the target when `fire` was dispatched and where the authority's physics body had the target when it processed that action. Log it; do not assert on it.

## Solo runs the same code

These are two different layers, and they do not contradict each other. Whether a project _gets_ a room at all is a project-shape question the scaffold kind answers: the single-player kind wires no room and no simulate module, so its `platform` has no `room` field. What a room that _is_ wired runs on is a seam question: glue that attaches a room while the project declares no multiplayer config forms a solo room — a roster of one running the exact same `declareRoom` and `activateGame`.

Either way, game code never branches. There is no `isHost`, no `isSpectator`, and nothing to ask: what a peer does for a given entity falls out of what it receives, not a role it queries. A project that **does** declare multiplayer can run locally through explicit Solo Preview; a real multiplayer launch still throws on assembly failure rather than silently running without the other players.

## What game code may not import

Game code may name exactly four specifiers from the frozen package: `@wanaka/multiplayer-runtime` and `@wanaka/multiplayer-runtime/project-config` for the types a state tree and a play module need (`SimClientHandles` comes from the package root), plus `@wanaka/multiplayer-runtime/project-config-rules.json` and `@wanaka/multiplayer-runtime/package.json`. The bare `@wanaka/multiplayer-runtime` specifier stays legal only as a type-only reference (`import type { ... }`, `export type { ... }`, or every named binding individually `type`-marked); any other way of naming it — a value import, a value re-export, `export * from` it, or a dynamic `import(...)` of it — is rejected the same as an engine-internal subpath. Every other subpath — lobby, membership, transports, seams, relay connection, loopback, harness, and the runtime surface the engine itself binds — is engine-internal and is rejected before the project is bundled. Never open a raw `WebSocket` or `WebTransport` connection, by any route: the engine owns the relay session, and the room it hands the game is the whole sanctioned surface.

## Diagnostics you may see

These are raised before the bundle, against the project's own sources, and each names a file, line, and column.

| Message names | What it means | Fix |
| --- | --- | --- |
| `game code cannot import "@wanaka/multiplayer-runtime/..."` | The project reached for an engine-internal module of the frozen package. | Delete the import and read the room from `platform.room`. |
| `game code cannot bring a value in from "@wanaka/multiplayer-runtime"` | The project named a value, not just types, from the frozen package's root — an import, an export-from, `export *`, or a dynamic `import(...)`. | Reference it as a type only (`import type` / `export type`), or read the room from `platform.room`. |
| `game code cannot open a raw WebSocket connection` (or `WebTransport`) | Project source constructs a relay socket itself, by any route. | Delete it; the engine owns the session. |
| `this project launches a multiplayer room ... but declares no multiplayer.ts` | `defineGame({ multiplayer })` or a `bootRoomLaunch` import is present, but the declaration file is absent. | Add `game/multiplayer.ts` with the exported `multiplayer` object literal, or drop the multiplayer field. |
| `no multiplayer config is declared here` | `multiplayer.ts` exists but exports no `multiplayer` const. | Export it; its presence is what makes the project multiplayer. |
| `"multiplayer" must be a plain object literal` | The declaration is computed, spread, or imported. | Write the numbers inline. |
| `room.entities(...) must anchor on a defineEntity handle declared in this project` | The call passed a string, an inline object, or a value this project never declared. | Declare the type once with `defineEntity` / `defineCharacterEntity` and pass that handle. |
| `game code cannot call the room HTTP control plane; use platform.roomSession` | Project source named a room HTTP path (for example `/rooms/` or `preview-rooms`). | Delete the fetch; drive Create / Ready / Start / Leave through `platform.roomSession`. |
| `a project that declares multiplayer must call platform.roomSession.create` | The project declared multiplayer but never calls `platform.roomSession.create`. | Mount `game/roomsession.ts` from `play.ts` and create through the Port. Do not invent a Host / Join HTTP path. |

The anchoring check reads project sources syntactically. It follows a handle across relative project imports and through `export ... from` and `export *` barrels, but not one that arrives from a factory call, an array or object member, or a dynamic import — such a call site is reported rather than silently accepted. Restructure to a module-scope handle instead of arguing with it.
