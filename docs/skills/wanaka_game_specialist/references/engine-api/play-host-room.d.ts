// Import from "wanaka-studio-engine/play-host-room".

/**
 * Sync observability for the room's motion path: one collector the motion
 * bridge feeds, read three ways — the always-on diagnostics snapshot
 * (`diagnostics()`, also `window.__wanakaRoomDiag()`), the armed-only event
 * trace (`window.__wanakaMotionTrace()`), and the Room Console overlay
 * (`room-console.ts` renders the same snapshot).
 *
 * Counters and the trace ring buffer are BOTH always on: a symptom is only
 * worth capturing after it has already appeared, and arming the old
 * `?wanakaMotionTrace=1` flag needed a reload — which drops every
 * `RoomSeams` connection and ends the very multiplayer session the symptom
 * was happening in, so the trace could never actually be turned on when it
 * was needed. The cost is real (an allocation per event) but bounded: the
 * ring buffer holds at most `TRACE_CAPACITY` events per room, oldest
 * dropped first, so a long session pays a fixed cost rather than an
 * unbounded one.
 *
 * The counters are laid out along the pipeline one command travels, because
 * the question they exist to answer — "the other machine does not show what
 * I just did; where did it stop?" — is answered by finding the first hop
 * whose rate is zero. For one entity, on the two peers involved:
 *
 *   sender                          authority
 *   commandRateHz.sent      →   .accepted   (admitted by the motion cursor)
 *                           ↘   .rejected   + lastRejectReason
 *                               queueDepth  (waiting in the de-jitter queue)
 *                           →   .replayed   (staged into a physics step)
 *                           ↘   .debtDropped (a starved step already ran it)
 *                               appliedCommand / stalledMs  (a step ran it)
 *                           →   the snapshot the sender then reconciles
 *
 * Reading it:
 *  - `sent` non-zero with `accepted` zero: the frames never arrived or were
 *    refused — `lastRejectReason` names which, and the two are different
 *    bugs (`unexpected-sender` is a lifecycle/ownership fault,
 *    `stale-incarnation` a restart the room has not caught up to).
 *  - `accepted` non-zero with `replayed` zero: they arrive and are admitted
 *    but never staged — the queue is warming up or starved. `debtDropped`
 *    counts only the starvation rule. A capacity eviction or a throttle
 *    fold is in neither counter, so `accepted` can sit above
 *    `replayed` + `debtDropped` without being a guessed step.
 *  - `replayed` non-zero with `stalledMs` rising: they ARE staged, and the
 *    physics step is not consuming them. Nothing upstream is wrong.
 *  - a rising `ackLagCommands` on the sender is the same failure seen from
 *    the other end; the authority's row says which of the three it is.
 *  - `pose` differing between two peers is simulation divergence; `pose`
 *    agreeing while only one window animates is a rendering fault, not a
 *    sync one.
 *  - `rejectedSnapshotRateHz` non-zero + `lastRejectSnapshotReason`: this
 *    peer refuses the entity's SNAPSHOT stream itself — a different fault
 *    from a rejected command (the command pipeline above can be healthy
 *    while this is not), e.g. a stale authority still publishing after a
 *    handoff, or a foreign incarnation the room has not caught up to.
 *

 * Health reading, for a room that IS running:
 *  - healthy motion is almost all `accurate`; `blend` bursts around real
 *    collisions/spawns; `snap` ≈ 0.
 *  - sustained `blend` while `filteredResidualM` stays near zero means the
 *    corrections are phantom (network timing), not simulation divergence.
 *  - `ackLagCommands × speed / tickRate` is the expected residual scale; a
 *    residual persistently above it is real divergence.
 *  - `ackLagCommands` (and the RTT estimate) include the authority's
 *    de-jitter buffer, not only the network: a command dwells ~2 ticks in
 *    the queue plus one tick of integration attribution before its
 *    applied-command ack can exist (see `motion-command-buffer.ts` and
 *    `BufferedCommandStream` in `room-motion.ts`). The floor is therefore
 *    the round trip expressed in commands (`rttEstimateMs / 1000 ×
 *    tickRate`) plus that ~3 — single digits on a LAN, but several DOZEN
 *    between continents, where the round trip alone is most of it. Judge
 *    it against the link's own round trip, never against a fixed number:
 *    a high but STEADY ack lag is the mechanism, and only one that keeps
 *    CLIMBING without settling is trouble.
 *  - `transportCarrier: 'websocket'` behind a proxy explains burst jitter
 *    (TCP head-of-line blocking).
 *  - `networkRttMs` is the carrier's own round trip, measured by whichever
 *    leg is carrying — unlike `rttEstimateMs`, it carries no de-jitter-buffer
 *    delay. A high `rttEstimateMs` alongside a low `networkRttMs` points at
 *    the queue, not the network. Both legs time the relay heartbeat, each on
 *    the lane its relay answers on, and the lane is worth knowing: on the
 *    WebSocket leg the heartbeat rides the same stream as the data, so it also
 *    inflates when this uplink itself backs up; on the datagram leg it rides
 *    the reliable stream while motion rides datagrams, so it stays closer to
 *    the link's own round trip and a motion backlog does not show up in it.
 *  - `sendBufferedBytes` is the only counter here that measures what has NOT
 *    left this machine. Every rate above is counted where a frame is
 *    COMPOSED, so a carrier that has stopped draining still reads as a
 *    perfectly healthy `commandRateHz.sent` while seconds of traffic pile up
 *    behind it. A climbing `ackLagCommands` beside a healthy `sent` is
 *    ambiguous on its own — a starved authority and a backed-up uplink look
 *    identical from here — and this is what separates them: climbing with
 *    it is this peer's own uplink, flat with it is the far end. Only a leg
 *    that queues reports one (the WebSocket fallback); a datagram leg drops
 *    rather than buffering and reads `null`.
 *  - The room-level facts above — carrier, round trip, send buffer, players —
 *    are reported whether or not the game moves anything. A room with no
 *    motion entities is still a room on a network, and gating its transport
 *    readout on the presence of a motion entity is what left this snapshot
 *    saying nothing at all for a game that syncs only state.
 */
import type { MotionCarrier, RoomStateChannelDiagnostics } from "@wanaka/multiplayer-runtime/runtime";
import type { LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
/**
 * Session forming for the room API: chooses this peer's room seams
 * from the project's authored multiplayer config and a delivered realtime
 * launch grant, and attaches the room's tick driver to them.
 *
 * Kept out of `play-host.ts` on purpose: that module is always bundled for
 * every Play entry (it is a kernel file, not optional room integration), and
 * importing `@wanaka/multiplayer-runtime` from it would drag multiplayer
 * code into every single-player export too. This sibling is only pulled in
 * by Engine's multiplayer host when it actually wants `platform.room` — see the
 * room entry in the Engine package.
 */
import { createRealtimeSeams, createSoloSeams, type ControlLifecycle, type CreateRealtimeSeamsOptions, type RelayConnection, type RealtimeSeamsConfig, type Room, type TransportImpairment } from "@wanaka/multiplayer-runtime/runtime";
import type { MultiplayerProjectConfig } from "@wanaka/multiplayer-runtime/project-config";
import { type EntityCreateContext } from "wanaka-studio-engine/room";
import type { PlatformBridge } from "wanaka-studio-engine/platform-bridge";
/**
 * The narrowed client facet of the `room.*` surface: what a `defineGame`
 * PLAY module receives once the game also declares a `simulate` module.
 * Declarations (state/entities/actions/rules) belong to `simulate`, which
 * runs on every peer — the authority included; play keeps input, camera, and
 * HUD, and therefore only ever needs to READ shared state and to DISPATCH
 * already-declared actions and intents.
 *
 * This narrowing is compile-time only. At runtime the play module is handed
 * the very same `Room` and collection instances the simulate module declared
 * against — `Room` satisfies `RoomView`, and a live collection satisfies its
 * view — so nothing is wrapped or copied. The write path was already guarded:
 * a client-side write to shared state is rejected by the state tree's
 * `guardWrite` at runtime. These types move that class of error to compile
 * time, and remove the declaration surface a play module has no business
 * calling at all.
 *
 * Every type here is a plain `interface`/`type` export enumerated member by
 * member, never an `Omit`/`Pick` composition over `Room` or
 * `EntityCollection`, and never derived from a value via `typeof`: this
 * facet is reachable from agent-facing declaration output, whose generator
 * extracts only `interface`/`type` exports (the same constraint
 * `ControlledAdapterKey` and `SimulationAdapterInitializeShapes` in
 * entity-collection.ts already document). `room-type-contract.ts` pins each
 * view's member set against the full surface it narrows, so the two cannot
 * drift apart silently.
 */
import type { RoomPlayerProfile } from "@wanaka/multiplayer-runtime/runtime";
import type { ControlledAdapterKey, ControlledCommand, ControlledEntityCollection, EntityCollection, EntityRuleContext, PlayerId, ProjectedObject, RoomVec3 } from "@wanaka/multiplayer-runtime/runtime";

/**
 * The exact seam shapes `assembleRoomSeams` can return. Both `createSoloSeams`
 * and `createRealtimeSeams` widen their `RoomSeams` result with a closable
 * `transport`; the realtime branch also carries the `RelayConnection` a grant
 * rotation or relay-liveness watch needs (not yet wired into this play host —
 * see the module doc's `realtime: null` note). Declared as a type union
 * rather than re-declared here, so the two factories' own return types stay
 * the single source of what is closable.
 */
export type PlayHostRoomSeams = ReturnType<typeof createSoloSeams> | ReturnType<typeof createRealtimeSeams>
/**
 * The realtime branch widened by a staged host-recovery restore: the same
 * seams, plus the checkpoint the room pours in as its complete state before
 * its first tick. See `PlayHostRoomConfig.restore` and
 * `RoomSeams.initialCheckpoint`.
 */
 | (ReturnType<typeof createRealtimeSeams> & {
    readonly initialCheckpoint: import('@wanaka/multiplayer-runtime/checkpoint').RoomCheckpoint;
});

/**
 * `PlatformBridge`, widened with the pre-formed room. Declared here, not in
 * `platform-bridge.ts`: that module is type-imported by the kernel file
 * `play-host.ts` (always bundled for every Play entry), and a
 * `@wanaka/multiplayer-runtime`-typed field there would pull the package's
 * whole module graph into `play-host.ts`'s own strict typecheck — confirmed
 * empirically (even a bare `import type { Room }` reproduces the same
 * `noUncheckedIndexedAccess` diagnostics `tsconfig.multiplayer-bridge.json`
 * exists to route around). This module is already checked under that relaxed
 * config, so the extension is free here.
 *
 * `room` is required, not optional: glue that never wires a room simply
 * passes plain `PlatformBridge` (no `room` field to omit); glue that
 * constructs a `RoomPlatformBridge` at all has already called
 * `attachPlayHostRoom` to get one. Authors do zero session wiring and no
 * guards — an optional field here would force one into every consumer of
 * `platform.room`.
 */
export interface RoomPlatformBridge extends RoomViewPlatformBridge {
    /** The pre-formed room — see `attachPlayHostRoom`. */
    readonly room: Room;
}

/**
 * The play-facing narrowing of `RoomPlatformBridge` for a
 * `defineGame({ simulate })` game: `room` is the read-only `RoomView` —
 * identity, roster, shared time — instead of the full declaring `Room`,
 * which belongs to the simulate module's `declareRoom`. The same bridge
 * instance satisfies both types; a play module that declares its `platform`
 * parameter with this type simply cannot reach the declaration surface at
 * compile time.
 */
export interface RoomViewPlatformBridge extends PlatformBridge {
    /** The pre-formed room, narrowed to its client view — see `RoomView`. */
    readonly room: RoomView;
    /**
     * Live sync-health snapshot for this room's motion path — roles, ack lag,
     * RTT estimate, reconcile verdict counts, correction magnitudes, snapshot
     * ages, playout-buffer depths, transport carrier. Always available (solo
     * rooms report carrier `'local'`), so a game HUD can render sync state
     * without any debug flag. `null` only for a room this engine did not
     * build. Reading it never changes sync behavior.
     */
    readonly roomDiagnostics: () => RoomSyncDiagnostics | null;
    /** Server-authoritative save status and payload-free UI commands. */
    readonly cloudPersistence: CloudPersistenceClient;
}

/**
 * Builds a `RoomPlatformBridge` from a base `PlatformBridge` and a formed
 * room — the one sanctioned place project glue composes the two, so a
 * caller never hand-spreads `{ ...platform, room }` itself (and, with it,
 * never has a reason to declare `platform`'s type as a `PlatformBridge |
 * RoomPlatformBridge` union just to build one — see `RoomPlatformBridge`'s
 * own doc on why `room` stays required, not optional).
 *
 * @param platform the base platform services (leaderboard, `gameId`) a
 *   project's glue already configured the platform bridge.
 * @param room the formed room — from `attachPlayHostRoom` (solo/synchronous)
 *   or `bootRoomLaunch`'s `activate` callback (multiplayer/asynchronous).
 * @returns `platform` widened with `room`.
 */
export function toRoomPlatformBridge(platform: PlatformBridge, room: Room, cloudPersistence?: CloudPersistenceClient): RoomPlatformBridge;

/**
 * The two facts this play host needs to choose this peer's room seams: the
 * project's authored multiplayer intent, and the realtime connection config
 * to dial once a launch grant has been delivered.
 *
 * Receiving that grant over the parent postMessage channel — generations,
 * the preload gate, per-tab incarnation, relay liveness — is not wired into
 * this play host yet; `realtime` is `null` until it is.
 */
export interface PlayHostRoomConfig {
    /** The authored `ProjectConfig.multiplayer`, normalized, or `null` for a
     * single-player project — see `@wanaka/multiplayer-runtime/project-config`. */
    readonly multiplayer: MultiplayerProjectConfig | null;
    /** This peer's realtime connection config, once a launch grant has
     * delivered one — see `RealtimeSeamsConfig`. */
    readonly realtime: RealtimeSeamsConfig | null;
    /**
     * A host-recovery checkpoint to pour into the room this config forms, as
     * its complete state before the first tick — an incoming authority resumes
     * from the confirmed state instead of from an empty room. Absent on every
     * formation that is not a restore (the ordinary launch, and every guest).
     */
    readonly restore?: import('@wanaka/multiplayer-runtime/checkpoint').RoomCheckpoint;
    /** This peer's incarnation for the solo path, which has no grant to carry
     * one. Ignored when `realtime` is set (its own `incarnation` field is
     * authoritative there). */
    readonly soloIncarnation: number;
    /**
     * Control-plane match phase for {@link RoomSeams.controlLifecycle}.
     * Omit for solo / no control plane (runtime defaults to `playing`).
     */
    readonly controlLifecycle?: () => ControlLifecycle;
    /** Host-only hook for opening opaque application channels on the Room connection. */
    readonly onApplicationConnection?: (connection: RelayConnection | null) => void;
}

/**
 * Chooses and builds this peer's room seams.
 *
 * A delivered realtime launch grant wins outright: package
 * `realtime-transport` seams over the relay. A project with no authored
 * multiplayer config gets a solo room — the roster-of-one that lets game
 * code run unchanged whether or not anyone else ever connects (see
 * `createSoloSeams`).
 *
 * @param config the project's multiplayer intent and this peer's realtime
 *   connection config, if a grant has delivered one.
 * @param options realtime transport factories to inject in tests; see
 *   `CreateRealtimeSeamsOptions`.
 * @returns the seams to hand the room factory.
 * @throws if `config.multiplayer` is set but no grant has been delivered yet
 *   — a multiplayer project never falls back to solo, which would silently
 *   run the match without the other players.
 */
export function assembleRoomSeams(config: PlayHostRoomConfig, options?: CreateRealtimeSeamsOptions, impairment?: TransportImpairment | null): PlayHostRoomSeams;

/**
 * Session forming: assembles this peer's room seams, connects the room API
 * to them, and closes what it opened on `scope` disposal — the
 * engine-side glue that builds `activateGame`'s
 * third `platform` parameter (`{ room: attachPlayHostRoom(...) }`).
 *
 * The transport close is deferred BEFORE the room factory is called, so it runs
 * AFTER the room factory's own teardown on disposal (`LifetimeScope` runs
 * cleanups in reverse registration order): a non-authority peer's
 * `SpawnedRoom.leave()` still has an open transport to send its departure
 * frame over, and only then does the transport actually close.
 *
 * @param scope owning lifetime for the room API.
 * @param scheduler drives the room's fixed-rate tick.
 * @param config see `assembleRoomSeams`.
 * @param options realtime transport factories to inject in tests.
 * @param ctx entity-projection scene context — see the room factory's `ctx`
 *   parameter; omit for a room with no scene to project into.
 * @returns the room facade to hand game code as `platform.room`.
 */
export function attachPlayHostRoom(scope: LifetimeScope, scheduler: PhaseScheduler, config: PlayHostRoomConfig, options?: CreateRealtimeSeamsOptions, ctx?: EntityCreateContext): Room;

/** The full room snapshot `__wanakaRoomDiag()` and the HUD render. */
interface RoomSyncDiagnostics {
    readonly isAuthority: boolean;
    /** Which leg carries motion frames — `'local'` for a room with no network
     * (solo/loopback seams). */
    readonly transportCarrier: MotionCarrier | 'local';
    readonly fallbackReason: string | null;
    /** The carrier's own network round trip, measured by whichever leg is
     * carrying — see the module doc's health-reading notes. `null` when the
     * room has no network at all (a solo or loopback seam) or no sample has
     * landed yet. See the module doc for how each carrier measures it. */
    readonly networkRttMs: number | null;
    /** Bytes queued in this peer's own carrier, waiting to reach the network —
     * see the module doc's health-reading notes. `null` when the carrier does
     * not queue (a datagram leg drops instead) or the room has no network. */
    readonly sendBufferedBytes: number | null;
    readonly tickRate: number;
    /** How many PLAYERS are in the room. Not the attachment count: a
     * server-authority room's service peer is attached and simulating, but it
     * is nobody, and a head count that included it read one higher than the
     * roster a player can see beside it. That peer is not hidden by the
     * omission — it is named on the same line, as `authorityPeerId`. */
    readonly playerCount: number;
    /** This peer's own id. Together with `authorityPeerId` it answers "which
     * window am I looking at, and is it the host" — which used to be readable
     * only off a motion entity's `controller`, and so was unanswerable in a room
     * that has none. */
    readonly localPeerId: string;
    /** The peer every other one is corrected toward. Equal to `localPeerId` on
     * the authority itself. */
    readonly authorityPeerId: string;
    /** The reliable state channel's health — the revision this peer has reached
     * and whether it is waiting on a resync. `null` for a seam shape with no
     * state channel to report (a solo/loopback room without one). Distinct from
     * the motion `entities` below: a game that syncs only state (no motion
     * entities) still has this, where it used to read blank. */
    readonly stateChannel: RoomStateChannelDiagnostics | null;
    readonly entities: Readonly<Record<string, RoomSyncEntityDiagnostics>>;
}

/** One entity's sync state, as `diagnostics()` reports it. Distances in
 * meters, ages in milliseconds; `null` where the signal has not occurred
 * yet (no snapshot received, no command acknowledged, …). */
interface RoomSyncEntityDiagnostics {
    readonly role: SyncEntityRole;
    /** The peer steering this entity, `null` when nobody does. Named so a row
     * can say WHOSE character it describes: every diagnosis of "my input does
     * not reach the other machine" starts by identifying the two rows that
     * are supposed to be the same character. */
    readonly controller: string | null;
    /** Whether `room.me` is that controller — the row for the player reading
     * this overlay. */
    readonly isMine: boolean;
    /** This machine's own pose for the entity; `null` before its first step. */
    readonly pose: SyncPose | null;
    /** Newest sent command minus newest acknowledged — how far the authority's
     * answer trails this controller. Controller entities only. */
    readonly ackLagCommands: number | null;
    /** EWMA of command-send → first-acknowledging-snapshot round trips. */
    readonly rttEstimateMs: number | null;
    /** Reconcile verdicts over the last 5 s — what the reconciler is doing
     * right now, which is what an overlay watching a live symptom wants. */
    readonly verdicts5s: ReconcileVerdictCounts;
    /** The same verdicts counted since this entity's row was created, never
     * pruned. A run that is over is judged on its totals: the 5 s window has
     * long since emptied by the time a headless harness reads the row, and a
     * verdict that occurred once in a thousand ticks still has to be
     * countable. */
    readonly verdictsTotal: ReconcileVerdictCounts;
    readonly lastResidualM: number | null;
    readonly filteredResidualM: number | null;
    /** Correction magnitude still being paid off by the current blend. */
    readonly outstandingCorrectionM: number;
    readonly snapshotAgeMs: number | null;
    /** Playout-buffer depth (replica entities; `null` before any snapshot). */
    readonly interpolatorDepth: number | null;
    /**
     * Commands over the last second, one counter per hop of the pipeline so a
     * silent stage names itself:
     *  - `sent` — produced and sent by this peer for its own entity;
     *  - `accepted` — arrived here and admitted by the motion cursor;
     *  - `rejected` — arrived here and refused (see `lastRejectReason`);
     *  - `replayed` — actually staged into this machine's simulation;
     *  - `debtDropped` — removed because a starved step had already run on the
     *    last staged intent. A capacity eviction or a throttle fold is not
     *    included, so this plus `replayed` does not cover every `accepted`
     *    command.
     */
    readonly commandRateHz: {
        readonly sent: number;
        readonly replayed: number;
        readonly accepted: number;
        readonly rejected: number;
        readonly debtDropped: number;
    };
    /** Why the most recent command refusal happened — a `MotionAcceptOutcome`,
     * or `null` when no command has been refused. */
    readonly lastRejectReason: string | null;
    /** SNAPSHOT rejections over the last second — the snapshot counterpart to
     * `commandRateHz.rejected`, counted separately because a rejected snapshot
     * is a different fault than a rejected command (e.g. a stale or foreign
     * authority publishing, rather than a mis-sequenced or untrusted
     * controller) and must not be silently folded into the command pipeline's
     * own numbers. */
    readonly rejectedSnapshotRateHz: number;
    /** Why the most recent snapshot refusal happened — a `MotionAcceptOutcome`,
     * or `null` when no snapshot has been refused. The snapshot counterpart to
     * `lastRejectReason`. */
    readonly lastRejectSnapshotReason: string | null;
    /** Frames waiting in the authority's de-jitter queue for this entity;
     * `null` for an entity this peer does not pace a command stream for. */
    readonly queueDepth: number | null;
    /** The last command a physics step here actually integrated — what this
     * peer's published snapshot is stamped with. Authority command streams
     * only. */
    readonly appliedCommand: number | null;
    /** How long since a physics step last attributed an integration for this
     * entity. Rises without bound exactly when commands are arriving but the
     * body is not consuming them — the one state `commandRateHz` alone cannot
     * distinguish from nothing arriving at all. `null` off that path. */
    readonly stalledMs: number | null;
}

/** How an entity relates to this peer — where its pose comes from. On the
 * room's authority every entity is `authority`: simulated locally (own input
 * or replayed commands) as the pose every other peer is corrected toward —
 * snapshots are never sent to self, so neither prediction nor the
 * interpolator ever drives one there. Elsewhere, `controller` is this peer's
 * own entity (local prediction reconciled against the authority's snapshots)
 * and `replica` is everyone else's (replayed commands corrected against the
 * interpolator). */
type SyncEntityRole = 'authority' | 'controller' | 'replica';

/** Where an entity is and which way it faces on THIS machine, as its own
 * physics step resolved it. The one reading that is directly comparable
 * between two peers: two windows showing different values for the same key
 * disagree about the simulation, and two showing the same value while only
 * one animates disagree about rendering instead. */
interface SyncPose {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly yawDeg: number;
}

/** One counter per verdict the reconciler can file, reported twice per
 * entity row: over a window and since the row appeared. */
interface ReconcileVerdictCounts {
    readonly accurate: number;
    readonly blend: number;
    readonly snap: number;
    readonly skipped: number;
}

/** Game-facing cloud persistence state and payload-free commands. */
interface CloudPersistenceClient {
    getStatus(): CloudPersistenceStatus;
    subscribe(listener: (status: CloudPersistenceStatus) => void): () => void;
    requestSave(): void;
    retryLoad(): void;
}

/** Client-visible cloud persistence state; it never includes stored bytes or credentials. */
interface CloudPersistenceStatus {
    readonly mode: 'none' | 'room' | 'player';
    readonly target: string;
    readonly loadState: CloudPersistenceLoadState;
    readonly saveState: CloudPersistenceSaveState;
    readonly revision: number | null;
    readonly savedAt: string | null;
    readonly errorCode: string | null;
}

/** Public load phase exposed by cloud persistence clients and test probes. */
type CloudPersistenceLoadState = 'disabled' | 'loading' | 'ready' | 'error';

/** Public save phase exposed by cloud persistence clients and test probes. */
type CloudPersistenceSaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * The room a play module sees: identity, roster, and shared time — nothing
 * else. Every declaration member of the full `Room` (`state`, `entities`,
 * `actions`, `presentations`, `sharedFields`, `controlled`, `simulated`,
 * `onTick`) is deliberately absent: declaring is the simulate module's job,
 * and a second declaration from play would corrupt the room every peer
 * already agreed on.
 */
interface RoomView {
    /** This peer's own id — see `Room.me`. */
    readonly me: PlayerId;
    /** The room's current roster — see `Room.players` for its live-read and
     * ordering caveats. */
    readonly players: readonly PlayerId[];
    /** The public nickname a player was admitted under, or `null` for an id
     * this room never admitted — see `Room.playerName`. */
    playerName(id: PlayerId): string | null;
    /** Public room display facts, without an account identifier. */
    playerProfile(id: PlayerId): RoomPlayerProfile | null;
    /** The room's shared tick — see `Room.tick`. */
    readonly tick: number;
    /** How many ticks of `tick` stand for one second — see `Room.tickRate`. */
    readonly tickRate: number;
}

/**
 * The read-only projection of an entity collection: what a play module sees
 * of a `simulated` (or motion-less) collection the simulate module declared.
 * Exactly the full collection's read members, with every fields read
 * narrowed to `Readonly` — `all()`/`get()` still return the live view, not a
 * copy, but a client-side write through it is now a compile error instead of
 * a runtime `guardWrite` rejection. The write and declaration members
 * (`spawn`, `despawn`, `setFields`, `rules`) are deliberately absent.
 */
interface EntityCollectionView<TFields, TObject = ProjectedObject> {
    /** The object type name this collection was declared with — see
     * `EntityCollection.objectType`. */
    readonly objectType: string;
    /** The record's current fields, read-only, or `undefined` if `key` doesn't
     * exist — see `EntityCollection.get`. */
    get(key: string): Readonly<TFields> | undefined;
    /** Every current record, keyed, fields read-only — see
     * `EntityCollection.all` for the live-view caveat. */
    all(): ReadonlyArray<{
        readonly key: string;
        readonly fields: Readonly<TFields>;
    }>;
    /** Every current record key — see `EntityCollection.keys`. */
    keys(): readonly string[];
    /** The record's current projected game object — see
     * `EntityCollection.objectFor`. */
    objectFor(key: string): TObject | undefined;
    /** The pose `spawn` was given for `key` — see `EntityCollection.poseFor`. */
    poseFor(key: string): RoomVec3 | undefined;
    /** Maps a projected object back to its record, fields read-only — see
     * `EntityCollection.fromObject`. */
    fromObject(object: unknown): {
        readonly key: string;
        readonly fields: Readonly<TFields>;
    } | undefined;
}

/**
 * The client view of a `controlled` collection: the read-only projection
 * plus `controls()` — the one declaration-shaped member that genuinely
 * belongs to the client, because its whole job is reading THIS machine's own
 * input devices once per frame for the entities this peer controls (see
 * `ControlledEntityCollection.controls`). The simulate module cannot own it:
 * it runs identically on every peer, and the authority host has no keyboard.
 *
 * `intents(...)` — the other controlled-only member — is deliberately absent
 * here: an intent HANDLER is simulation logic the simulate module declares,
 * and the payload-only dispatchers that declaration returns reach play
 * through the simulate module's returned handles (see `SimClientHandles`),
 * not by re-declaring on the view (a second `intents()` call with the same
 * names would silently replace the routed handlers the room already
 * registered).
 */
interface ControlledEntityCollectionView<TFields, TObject = ProjectedObject, K extends ControlledAdapterKey = ControlledAdapterKey> extends EntityCollectionView<TFields, TObject> {
    /** Registers the LOCAL input rig — see
     * `ControlledEntityCollection.controls`. The entity view it hands the read
     * carries read-only fields, matching every other client read path. */
    controls(read: (entity: EntityRuleContext<Readonly<TFields>, TObject>) => ControlledCommand<K>): void;
}

/**
 * The client (play-side) view of one declared shared-state value: entity
 * collections narrow to their client views, and every plain value becomes
 * deeply read-only. Branded ids (`PlayerId`) and other primitives pass
 * through untouched. Applied by `SimClientHandles` to the whole `room.state`
 * tree the simulate module returned.
 */
type SimStateView<T> = T extends ControlledEntityCollection<infer TFields, infer TObject, infer K> ? ControlledEntityCollectionView<TFields, TObject, K> : T extends EntityCollection<infer TFields, infer TObject, infer _TInit> ? EntityCollectionView<TFields, TObject> : T extends string | number | boolean | bigint | null | undefined ? T : T extends object ? {
    readonly [K in keyof T]: SimStateView<T[K]>;
} : T;

/**
 * The client projection of a simulate module's returned handles — the third
 * parameter a play module's `activateGame` receives. `state` (the declared
 * `room.state` tree) becomes its `SimStateView`; every other member — the
 * payload-only dispatcher records `room.actions(...)` and
 * `collection.intents(...)` returned — passes through unchanged, because a
 * dispatcher is already client-safe: it carries a payload and nothing else.
 *
 * Derive it from the simulate module's own inferred return type, so play's
 * view tracks the declaration with no second source of truth:
 *
 * ```ts
 * import type { declareRoom } from './simulate.js';
 * type Sim = SimClientHandles<Awaited<ReturnType<typeof declareRoom>>>;
 * ```
 */
type SimClientHandles<THandles extends {
    readonly state: object;
}> = {
    readonly [K in keyof THandles]: K extends 'state' ? SimStateView<THandles[K]> : THandles[K];
};
