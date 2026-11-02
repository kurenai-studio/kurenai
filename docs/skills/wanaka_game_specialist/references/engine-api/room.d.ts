// Import from "wanaka-studio-engine/room".

import type { LifetimeScope } from "wanaka-studio-engine";
/**
 * Entity projection: the per-frame pull/diff self-healing reconcile that
 * keeps this peer's scene objects in step with `room.entities(...)`
 * collections. Records are truth; scene objects are projections — EVERY
 * peer runs this reconcile, including the room's authority. (A
 * motion-driven collection's local controller additionally runs real
 * physics, and every other peer replays its commands through the same
 * controller — see the motion adapter implementation; this module only ever reads record
 * fields either way.)
 *
 * A collection's `objectType` (a plain string) is all the package's own
 * `EntityCollection` carries — `entities()` never stashes the `defineEntity`
 * handle an author declared it with (see `room.ts`'s package source: it
 * extracts `object._name` and discards the rest). This module recovers that
 * mapping with NO extra wiring anywhere: the projection helper hands game
 * code a `Room` whose `entities` method is a thin, self-registering wrapper
 * around the package's own — the moment an author calls
 * `room.entities(Bullet, options)`, `Bullet` is captured into this room's own
 * registry, keyed by its wire name, before the call is forwarded unchanged.
 * A project's `game.ts` therefore never enumerates entity types; it declares
 * `defineEntity` handles once, in the same module that already names them at
 * their `room.entities(...)` call site, and nothing else has to agree.
 *
 * Two different handles declaring the same wire name are rejected the
 * moment the second one is registered — the earliest point this reconcile
 * can observe the collision, since a collection's own `objectType` is the
 * only fact carried forward from that call.
 *
 * Each PhaseScheduler `update` tick, once per declared collection:
 *  1. Diff the collection's current key-set against last frame's, via the
 *     package's own `entity-reconciler` (`createEntityReconciler`) — never
 *     re-implemented here.
 *  2. `added` — resolve the collection's `objectType` to the matching
 *     `defineEntity` handle, call its `create(scope, ctx)` inside a fresh
 *     child scope, parent the returned `root` under `ctx.scene`, and bind it
 *     to the collection (`bindProjection`) so `objectFor`/`fromObject`/
 *     `onCollision` see the real scene object instead of the package's
 *     synthetic `{ position }` stand-in. For a collection with no declared
 *     motion, `root` is also SEEDED at its spawn pose immediately (never left
 *     at the origin for even one frame) — see point 4 for why a second,
 *     smoothed write follows on the same and later frames.
 *  3. `removed` — dispose that entity's own child scope. The engine's
 *     `LifetimeScope` convention (`scope.defer`) is what actually detaches
 *     and destroys whatever `create` registered, including
 *     `bindObject3D`'s own removal of `root` from `ctx.scene`.
 *  4. `added` ∪ `persisted`, for a collection with NO declared motion only —
 *     a motion-declared collection's pose comes from physics or a
 *     replicated snapshot (driven by the motion adapter implementation), and writing position
 *     from fields here would fight it (see `RoomCore.collectionBindings`'s
 *     own doc comment in the package) — feed the record's own numeric
 *     `x`/`y`/`z` fields to a per-entity `motion-interpolation` playout
 *     buffer keyed by the room's shared tick, and write the blended pose
 *     onto `root.position`. This smooths the room's fixed tick rate against
 *     the display's own frame rate, the same reason `character.ts`'s render
 *     interpolation exists — there is no network jitter to buffer against
 *     for a plain (non-motion) collection, but the tick/frame-rate gap is
 *     real regardless of transport. No interpolator is even allocated for a
 *     motion-driven collection's entities, since nothing here ever writes
 *     their position.
 *
 * Rotation is not projected: only `x`/`y`/`z` are read off a record's
 * fields, matching the package's own documented contract for a
 * non-motion-driven collection (`RoomCore.collectionBindings`'s
 * `motionDriven` doc comment names exactly these three fields). An author
 * who needs orientation must currently drive it from their own `onTick`.
 *
 * `adopt`-claimed instances (`Room.entities(..., { adopt })`) are BOUND,
 * never built: on a collection's first reconcile tick a settlement pass
 * resolves each declared instance key through the scene's own named lookup
 * (`Scene.getObjectByName` — the scene module names the nodes it wants
 * addressable) and hands it to the package's `AdoptBindingTable`; an
 * `added` record whose key is adopted then binds that placed object instead
 * of calling `create()`, its position projection falls back per-axis to the
 * placed pose (see `readAdoptedPositionFields`), and its despawn unmaps
 * without destroying — the object belongs to the scene layout, not the
 * collection. A declared instance the scene does not contain fails loud,
 * once, at settlement. Motion-driven collections refuse `adopt` outright: a
 * placed node carries no controller body for a motion adapter to drive.
 */
import { type EntityCollection } from "@wanaka/multiplayer-runtime/runtime";
import type { Object3D, Scene } from "three/webgpu";
import type { PhysicsWorld } from "wanaka-studio-engine/physics";
// Type-only: this module must NOT statically pull `character.ts` (and
// transitively `physics-jolt.ts`) into every project that merely imports
// `wanaka-studio-engine/room` — the assembler's API-closure detector
// keys off which files a project's OWN bundle resolves (see
// `game-compiler.js`'s import collector), and `room.ts`
// unconditionally imports this module. A project that actually declares a
// `defineCharacterEntity` handle imports `character.ts` itself (its own
// `create()` factory calls `CharacterController.createAndBind(...)`), which is the
// legitimate place for "character" detection to fire. The
// runtime check below is therefore structural (duck-typed), not
// `instanceof` — see `isCharacterBody`.
import type { CharacterController } from "wanaka-studio-engine/character";
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
import type { TransportImpairment } from "@wanaka/multiplayer-runtime/runtime";
import type { PhaseScheduler } from "wanaka-studio-engine";
/**
 * Room API: a thin forward of the package's own author-facing `Room`
 * facade, ticked at its seams' fixed rate from the engine's `update` phase.
 *
 * All room.* author semantics — `state`/`actions`/`entities`/`onTick`/`tick`/
 * `tickRate`/`me`/`players`/`presentations` — come from
 * `@wanaka/multiplayer-runtime` unchanged. This module adds no role queries
 * (no `isHost`/`isSpectator`) and no guards: a solo room (see
 * `createSoloSeams`) runs the exact same authored game code as a networked
 * one, so game code never branches on whether anyone else is connected.
 *
 * Session forming — choosing solo vs. realtime-transport seams from the
 * project's authored multiplayer config and a delivered launch grant — is
 * the Play host room setup's job (`assembleRoomSeams`); this module
 * only spawns a room from pre-formed seams and drives its tick.
 */
import { type Room, type RoomSeams } from "@wanaka/multiplayer-runtime/runtime";

/** `defineEntity`'s input: the author-facing spelling of an
 * `EntityTypeHandle`, before its wire-name member is reshaped into that
 * handle's own `_name` layout (see that interface's doc). */
export interface DefineEntityOptions {
    /** The stable wire/validation id — must be unique among every
     * `defineEntity` handle used in one room. Checked the moment a handle is
     * passed to `room.entities(...)`, not here: a single declaration cannot
     * see the other handles it might collide with (see
     * the projection implementation's `registerEntityHandle`). */
    readonly name: string;
    /** Builds one instance of this entity type; see `EntityCreateContext`. */
    readonly create: (scope: LifetimeScope, ctx: EntityCreateContext) => EntityObject;
}

/**
 * Declares a project's stable anchor for one `room.entities(...)` object
 * type — the native engine's counterpart to main's prefab-registry lookup,
 * since the native world has no prefab registry of its own (see the design
 * doc's `defineEntity` section). Call once per entity type, at module scope,
 * and pass the returned handle directly wherever the package's own
 * `room.entities(X, options)` expects its object-type argument — `attachRoom`
 * discovers it automatically from that exact call (see
 * the projection implementation's module doc); no separate registration exists.
 *
 * `TAdapter` is supplied only as an explicit type argument
 * (`defineEntity<'character'>({...})`) — it labels the handle with a
 * `controlled({ as })` adapter tag at the type level for the motion adapter
 * implementation to check against; it has no runtime effect here.
 * Omitted, the handle carries `NoMotionAdapterTag`, which satisfies no specific
 * tag requirement (see `EntityTypeHandle`'s own doc).
 *
 * @param options `name` and `create` — see `DefineEntityOptions`.
 * @returns the typed handle to declare a collection with.
 * @throws if `name` is empty or all whitespace.
 */
export function defineEntity<TAdapter extends string = NoMotionAdapterTag>(options: DefineEntityOptions): EntityTypeHandle<TAdapter>;

/**
 * `attachRoom`'s engine-side overrides. Authored game code never passes any
 * of these; each exists for one engine-internal caller — the sync-debug
 * shell, a motion regression seam, a virtual-time harness — and they are
 * independent of each other, so a caller that wants the last one must not
 * have to spell out placeholders for the ones before it.
 */
export interface AttachRoomOptions {
    /** Sync-debug switches for this room; defaults to the ones parsed off the
     * page URL (`currentSyncDebugFlags`). */
    readonly debugFlags?: SyncDebugFlags;
    /** Engine-internal motion-bridge tuning — see
     * `CharacterMotionBridgeOptions`; omit outside regression seams. */
    readonly motionOptions?: CharacterMotionBridgeOptions;
    /** Clock the sync diagnostics stamp events and rate windows with; a
     * virtual-time harness injects its tick clock so windows are
     * deterministic. Defaults to `performance.now`. */
    readonly syncDebugNow?: () => number;
}

/**
 * Spawns a room from `seams` and drives its state-layer tick from the
 * PhaseScheduler `update` phase, independent of the display's frame rate
 * (see `createStateClock`) and of this peer's own time scale (see
 * `rawDeltaSeconds`). On `scope` disposal, the tick hook is unregistered and
 * a non-authority peer announces its departure (`SpawnedRoom.leave()`) — the
 * authority never does, since it cannot leave (see `leave()`'s own doc).
 *
 * Closing `seams`' own transport/connection is NOT this function's job: it
 * only spawns a room from seams someone else built, and a caller that hand-
 * assembled test seams (e.g. loopback) may have nothing to close at all. The
 * one caller that DOES own that lifecycle, `attachPlayHostRoom`, closes what
 * it opened.
 *
 * @param scope owning lifetime for this room API.
 * @param scheduler drives the room's fixed-rate tick.
 * @param seams the pre-formed transport/membership/codec/clock bundle — see
 *   `assembleRoomSeams` in `Runtime/hosts/play-host-room.ts`.
 * @param ctx the scene `defineEntity`-declared entities are parented under —
 *   omit for a room with no scene to project into (a headless room, or one
 *   that declares no `room.entities(...)` collections at all). `room.entities`
 *   itself stays fully usable either way; see `attachEntityProjection`.
 * @param options the engine-side overrides — see `AttachRoomOptions`; every
 *   field is defaulted, so omit it entirely outside a harness.
 * @returns the room facade authored game code reads and calls.
 */
export function attachRoom(scope: LifetimeScope, scheduler: PhaseScheduler, seams: RoomSeams, ctx?: EntityCreateContext, options?: AttachRoomOptions): Room;

/**
 * The scene-object handle a `defineEntity` factory returns — the minimum
 * shape the motion adapter implementation's motion adapters need to reach into. `root` is
 * the entity's presentation node; this reconcile parents it under
 * `ctx.scene` and positions it, so a `create` factory builds it but never
 * parents or moves it itself. `body` is an open slot for whatever a
 * controller-specific factory additionally constructs and owns — left
 * untyped here (this module stays controller-agnostic) but pinned
 * concretely for `'character'` by `room-motion.ts`'s
 * `CharacterEntityObject`/`defineCharacterEntity`, whose
 * bridge structurally asserts `body` is `CharacterController`-shaped at
 * runtime the moment a motion-driven `'character'` entity is created (see
 * `EntityMotionBridge` below).
 */
export interface EntityObject {
    readonly root: Object3D;
    readonly body?: unknown;
}

/**
 * What a `defineEntity` factory receives to build one instance of its
 * entity type. `scope` is a fresh child scope owning everything the factory
 * registers — despawn disposes it, tearing down `root` and anything else the
 * factory deferred (see the module doc). `scene` is the live Three scene new
 * entities are parented under; handed fresh on every `create` call rather
 * than captured once at author-module-load time, since the same declared
 * entity type may be created into a different scene across Play sessions
 * (an Edit reload, a new Preview window).
 *
 * `world` is the physics world a `'character'` (or any future physics-backed)
 * controller's constructor needs — e.g. `CharacterController.createAndBind(scope,
 * ctx.world, options)`. Optional: a room with no physics-backed entity type
 * never needs one, so `attachRoom`'s existing `{ scene }`-only callers stay
 * valid unchanged.
 *
 * `spawnPose` is this instance's own fixed placement (see `EntitySpawnPose`)
 * — e.g. `CharacterController.createAndBind(scope, ctx.world, { position:
 * ctx.spawnPose, ... })`. Optional: always populated by the reconcile that
 * actually calls `create` (see the projection helper's `added` loop
 * below); optional here only so a caller building a bare `{ scene, world }`
 * context by hand is not forced to also invent a pose that only the
 * reconcile can supply.
 */
export interface EntityCreateContext {
    readonly scene: Scene;
    readonly world?: PhysicsWorld;
    readonly spawnPose?: EntitySpawnPose;
}

/**
 * The tag a `defineEntity` handle declared with no explicit motion-adapter type
 * argument carries. A distinct sentinel rather than `never`, because `never`
 * is assignable to every string literal type: an untagged handle tagged
 * `never` would satisfy an `EntityTypeHandle<'character'>` requirement and
 * silently defeat the motion-adapter compile-time contract below. Nothing
 * reads it at runtime — see {@link EntityTypeHandle}.
 */
export type NoMotionAdapterTag = 'no-declared-motion-adapter';

/**
 * The typed handle `defineEntity` (`room.ts`) returns: a project's stable
 * anchor for one `room.entities(...)` object type. Its `_name`/`__type`
 * members match exactly what the package's `Room.entities(object, options)`
 * expects for its first argument, so a handle is passed there directly —
 * `room.entities(Bullet, { schema: room.sharedFields<BulletFields>() })`.
 *
 * `__type` is fixed to `Object3D`, not `EntityObject`: it is what
 * `Room.entities()` infers its own `TObject` type parameter from, and
 * `TObject` is the type a `rules()` callback's `.object` and `objectFor(key)`
 * expose — the REAL scene object an author reads `.position` off, matching
 * `create`'s `EntityObject.root` (what this reconcile actually binds via
 * `bindProjection`; see the reconcile below), never the `{ root, body? }`
 * wrapper `create` itself returns to the bridge.
 *
 * `TAdapter` carries a `controlled({ as })` adapter tag purely at the
 * type level (`defineEntity<'character'>(...)`); this module attaches no
 * runtime behavior to it at all — that is the motion adapter implementation's job. The
 * phantom holding it is a plain COVARIANT field, and the two defaults that
 * make covariance the right relation are what the whole contract rests on:
 *
 *  - An untagged handle is tagged {@link NoMotionAdapterTag}, never `never` —
 *    a real literal that is not `'character'` or `'vehicle'`, so it fails a
 *    specific tag requirement instead of satisfying every one of them the
 *    way the bottom type would.
 *  - This parameter defaults to `string`, so a bare `EntityTypeHandle` with
 *    no type argument is the EXISTENTIAL bound — "some tag, any tag" — that
 *    every handle satisfies, which is what `attachRoom`'s entity
 *    self-registration stores a heterogeneous mix of handles as (see the
 *    registry below).
 *
 * Covariance then rejects exactly the three cases that must be rejected —
 * an untagged handle, a differently-tagged one, and the WILDCARD
 * `defineEntity<string>(...)` (which is not one adapter but every
 * adapter at once, and would carry no real adapter into a
 * `'character'`-only position) — while accepting a matching tag and the
 * existential bound. See
 * the dedicated variance fixture, which pins
 * every one of those directions against a real `tsc` program.
 */
export interface EntityTypeHandle<TAdapter extends string = string> {
    /** The stable wire/validation id — becomes the declared collection's
     * `EntityCollection.objectType` the moment an author passes this handle to
     * `room.entities(...)`. */
    readonly _name: string;
    /** Phantom: never assigned — see the interface doc. */
    readonly __type?: Object3D;
    /** Phantom: never assigned, carries `TAdapter` at the type level only —
     * see the interface doc. */
    readonly __motionAdapter?: TAdapter;
    /** Runtime marker for factories that require a physics world. */
    readonly requiresPhysicsWorld?: boolean;
    create(scope: LifetimeScope, ctx: EntityCreateContext): EntityObject;
}

/**
 * One entity's fixed spawn placement, exactly as `EntityCollection.poseFor`
 * records it — the `pose` a `spawn({ fields, pose })` call was given, never
 * the record's own (possibly moving) `x`/`y`/`z` fields this reconcile
 * projects elsewhere in this module (see the module doc's point 4): a
 * `'character'`-tagged record like `ShipFields` may carry no positional
 * fields at all, so the fixed spawn channel is the only real placement a
 * physics-backed `create()` factory has to read. Named locally, the same way
 * `CollectionKeyReconciler` below is: the package does not export `RoomVec3`
 * from its `./runtime` surface.
 */
type EntitySpawnPose = NonNullable<ReturnType<EntityCollection<unknown>['poseFor']>>;

/** The engine's own closed set of controlled-motion adapter tags — mirrors
 * `CONTROLLED_ADAPTER_KEYS` in the package's `simulation-adapters.ts`, which
 * is not published through the `./runtime` surface bridge files import
 * through (see the design doc's module layout). Hand-mirrored rather than
 * imported, exactly like the package's own `ControlledAdapterKey` is
 * hand-mirrored in a couple of its own internal spots — a two-value, rarely
 * changing set the package's own authors already accept duplicating. */
export type MotionAdapterKind = 'character' | 'vehicle';

/** The command shape a `controlled({ as: 'character' })` collection's
 * `controls()` read must return — the frozen counterpart to the package's
 * own (unexported) `ControlledAdapterCommandShapes.character`.
 * Convert input axes into world-space velocity using the game's configured
 * movement speed. Do not multiply these velocities by the frame delta. */
export interface CharacterCommand {
    /** World +X velocity component in meters per second, not an input axis. */
    readonly moveX: number;
    /** World +Z velocity component in meters per second, not an input axis. */
    readonly moveZ: number;
    readonly jump: boolean;
    readonly lookYawDeg: number;
}

/** The declaration token `controlled(...)` returns — structurally identical
 * to the package's own (unexported) `ControlledMotionToken<K, A>`, so it is
 * accepted wherever `room.entities(X, { motion })` expects one. */
export interface ControlledMotionDeclaration<K extends PropertyKey, A extends MotionAdapterKind> {
    readonly kind: 'controlled';
    readonly by: K;
    readonly as: A;
}

/**
 * Declares a `room.entities(X, { motion: controlled(X, { by, as }) })`
 * collection's motion, gated at compile time by `X`'s own adapter tag:
 * `handle: EntityTypeHandle<A>` and `options.as: A` share ONE type
 * parameter, so a `defineEntity` handle whose tag does not match `as` fails
 * to typecheck — `EntityTypeHandle.__motionAdapter`'s phantom field is what
 * makes this real (see that interface's own doc for why an untagged, a
 * differently-tagged, and a wildcard-tagged handle are all rejected here). The
 * package's own `room.controlled({ by, as })` cannot express this: its `by`/
 * `as` never see which handle they will end up paired with, since `X` and
 * `motion` are independent arguments to independent calls.
 *
 * Runtime assert as the second line of defense, since `__motionAdapter` is a
 * type-only phantom with nothing to inspect at runtime on `handle` itself:
 * `createCharacterMotionBridge()`'s `entityCreated` hook asserts `object.body`
 * is `CharacterController`-shaped (see `isCharacterBody`) the moment a
 * `'character'` entity is actually created, which is the earliest point
 * there is something real to check.
 *
 * `as: 'vehicle'` type-checks (the tag is a legitimate declared adapter —
 * see `MotionAdapterKind`) but throws immediately: the engine has no
 * vehicle controller to drive it with yet (design doc allowed-absent list).
 */
export function controlled<const K extends PropertyKey>(handle: EntityTypeHandle<'character'>, options: {
    readonly by: K;
    readonly as: 'character';
}): ControlledMotionDeclaration<K, 'character'>;

export function controlled<const K extends PropertyKey>(handle: EntityTypeHandle<'vehicle'>, options: {
    readonly by: K;
    readonly as: 'vehicle';
}): never;

/** The `EntityObject` shape a `defineCharacterEntity` factory must return:
 * `body` pinned to a real `CharacterController`, not `unknown`. */
export interface CharacterEntityObject extends EntityObject {
    readonly body: CharacterController;
}

/**
 * `defineEntity<'character'>`'s counterpart, narrowed so its `create`
 * factory's return type is checked against `CharacterEntityObject` instead
 * of the generic `EntityObject` — the compile-time half of "`EntityObject.
 * body` typed against what the character controller actually needs" (the
 * runtime half is `createCharacterMotionBridge`'s `isCharacterBody` assert).
 * Builds the same `{ _name, create }` handle shape `room.ts`'s `defineEntity`
 * does (sharing its name validation, `assertValidEntityName`) rather than
 * calling `defineEntity` itself, since `room.ts` is this module's own
 * caller (it wires `createCharacterMotionBridge` into `attachRoom`) and
 * importing back from it would be circular.
 */
export function defineCharacterEntity(options: {
    readonly name: string;
    readonly create: (scope: LifetimeScope, ctx: EntityCreateContext) => CharacterEntityObject;
}): EntityTypeHandle<'character'>;

/** Engine-internal tuning for `createCharacterMotionBridge`. */
export interface CharacterMotionBridgeOptions {
    /** Override the reconciler's measurement filter window. Exists for the
     * jitter regression seams: collapsing the window to 1 removes the
     * downstream noise filter, so the seams prove the applied-command ack and
     * the de-jitter buffer treat the cause rather than lean on the filter. */
    readonly reconcileFilterWindow?: number;
    /**
     * Drop commands a starved step already ran, and merge an over-depth pair
     * instead of discarding the older frame. Set from the engine compat
     * behavior `motionCommandDebt`; omitted, the queue only throttles.
     */
    readonly coverStarvedCommands?: boolean;
}

/** Parsed state of every sync-debug switch. */
interface SyncDebugFlags {
    /** Seeded loss/latency/jitter profile for the room's inbound transports,
     * or `null` when the URL asks for none. */
    readonly impairment: TransportImpairment | null;
    /** Render the Room Console overlay. */
    readonly hud: boolean;
}
