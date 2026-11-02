// Import from "wanaka-studio-engine/room-launch-bridge".

import type { RoomPlayerProfileEntry } from "@wanaka/multiplayer-runtime/runtime";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { RuntimeSession } from "wanaka-studio-engine";
/**
 * Engine-side counterpart of the shell↔game frame protocol
 * (`packages/player-shell/src/multiplayer/frame-protocol.ts`, frozen): forms
 * this peer's realtime room from the launch grant the trusted host delivers
 * over the browser or native transport; replaces that room when a persistent
 * document receives a different room identity; rotates the relay grant on the
 * live connection whenever a later grant/resume only changes the credential;
 * tears the room down on
 * `WANAKA_ROOM_ENDED`; watches relay liveness; and reports this frame's own
 * preload back to the shell.
 *
 * Kept out of `play-host.ts` for the same reason `play-host-room.ts` is (see
 * that module's own doc): a kernel file bundled into every Play entry must
 * not pull realtime room implementations into a single-player export's
 * closure. Browser and native channel mechanics live in
 * `play-host-window.ts`. The browser adapter retains exact origin/source
 * checks; the native adapter accepts only a native-authenticated channel and
 * rejects protocol, session nonce, game, or publication mismatches before
 * this module parses the shared room message.
 *
 * The wire contract comes from the shared pure browser bridge entry.
 * This receiving-side parser preserves the frozen room message formats.
 *
 * One thing this bridge deliberately does NOT do, because this engine's
 * boot order has no equivalent hook to act on (a kernel-lifecycle decision
 * beyond this module's scope): `WANAKA_ROOM_START`/`WANAKA_ROOM_CANCEL_START`
 * are parsed (so a malformed one is still rejected) but produce no action —
 * main's engine gates the FIRST SCENE's load behind the countdown they
 * describe, and this host's boot path has no "first scene start" barrier to
 * gate.
 *
 * `reportPreloaded()` and the `GAME_LOADED`/`GAME_LOAD_FAILED` load-outcome
 * reports (`GameToShellMessage`'s other two variants — see `messages.ts`)
 * ARE now wired, by {@link bootRoomLaunch}: the boot glue that awaits room
 * formation behind the shell's own preload gate, then activates authored
 * game code with the formed room. `GAME_PRELOADED` is sent the moment the
 * room forms, NOT once assets are actually ready — this bridge has no
 * "assets are ready" signal of its own to wait for (see `bootRoomLaunch`'s
 * own doc): the name is the wire contract's, inherited from main's engine,
 * where preload genuinely does mean asset readiness.
 */
import { type CreateRealtimeSeamsOptions, type Room } from "@wanaka/multiplayer-runtime/runtime";
import { type EntityCreateContext } from "wanaka-studio-engine/room";
import type { PersistenceMode } from "wanaka-studio-engine/game";

// ---------------------------------------------------------------------------
// Pure protocol decision: what a message means for this frame's launch
// ---------------------------------------------------------------------------
/** What this frame currently believes about its launch. */
export interface RoomLaunchState {
    /** The generation and grant this frame's room is currently formed on, or
     * `null` before the first grant. */
    readonly current: {
        readonly generation: number;
        readonly grant: RelayLaunchGrant;
    } | null;
    /** Set once `WANAKA_ROOM_ENDED` lands; every later message is ignored. */
    readonly ended: boolean;
}

/** The state a freshly-attached bridge starts from. */
export const INITIAL_ROOM_LAUNCH_STATE: RoomLaunchState;

/** What the runner must do in response to one shell message. */
export type RoomLaunchAction = {
    readonly kind: 'form';
    readonly generation: number;
    readonly grant: RelayLaunchGrant;
} | {
    readonly kind: 'rotate';
    readonly grant: RelayLaunchGrant;
} | {
    readonly kind: 'end';
} | {
    readonly kind: 'pause';
} | {
    readonly kind: 'resume';
};

/**
 * Decide what a shell message means for this frame's launch, and the state
 * to remember. Pure — no seam construction, no I/O — so the protocol's
 * sequencing is a property this function alone is responsible for and can
 * be checked directly, the same way the shell's own `nextFrameMessages` is.
 *
 * The room forms on the first grant and whenever the trusted host switches
 * this persistent frame to another room. A later grant for the same room
 * either rotates the live connection (the credential changed) or does nothing
 * (it didn't) — `generation` is never a re-dial trigger on its own.
 * It is a countdown-cancel LABEL the shell bumps while still assembling the
 * room, on the SAME grant (see `packages/player-shell/src/multiplayer/
 * types.ts`'s `RoomSnapshot.generation` doc: "bumped whenever a countdown is
 * cancelled"); a room that tore itself down and reconnected on every one of
 * those would announce a spurious leave/rejoin to every peer for a label
 * change nobody's connection needed. `WANAKA_ROOM_ENDED` tears down and
 * silences everything after.
 *
 * @param previous what this frame currently knows.
 * @param message the parsed message the shell just posted.
 * @returns the state to remember, and the actions the runner must take, in
 *   order. Usually zero or one; a `WANAKA_ROOM_RESUME` that also rotates the
 *   connection produces two (rotate, then resume).
 */
export function nextRoomLaunchActions(previous: RoomLaunchState, message: ShellToGameMessage): {
    readonly state: RoomLaunchState;
    readonly actions: readonly RoomLaunchAction[];
};

// ---------------------------------------------------------------------------
// Per-tab incarnation
// ---------------------------------------------------------------------------
/** Storage this bridge uses to remember this tab's chosen incarnation across
 * a reload — structurally `sessionStorage`'s own shape, so a test can inject
 * a fake instead of requiring a browser global. */
export interface IncarnationStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/**
 * Chooses this PROCESS's incarnation: a number strictly greater than any
 * this same peer id has used before, so a reload can never hand the room a
 * lower value than an earlier tab session already used (a room refuses every
 * frame from a peer whose incarnation goes backwards for the rest of that
 * session — see `RealtimeSeamsConfig.incarnation`'s own doc). Ported from
 * main's old-engine `RoomHelper.ts` (`_localIncarnation`): the wall clock
 * alone cannot promise that on its own, because a clock that steps backwards
 * (an NTP correction, a resumed laptop's stale RTC) would hand a reloaded tab
 * a lower number than its previous session used.
 *
 * Call once per attach and reuse the result for every room this bridge ever
 * forms or reforms within that attach — it identifies the PROCESS (this
 * tab), not a single room formation.
 *
 * @param storage where the previous session's value is read and written;
 *   omit to use `sessionStorage` where available. Unavailable storage
 *   (private browsing, blocked site data) degrades to the bare wall clock.
 * @param now the current instant, in epoch milliseconds; overridable for
 *   deterministic tests.
 * @returns this process's incarnation.
 */
export function chooseLocalIncarnation(storage?: IncarnationStorageLike | undefined, now?: number): number;

/** The timer surface the liveness watch polls on; tests supply a stub. */
export interface RoomLaunchTimers {
    setInterval(handler: () => void, ms: number): unknown;
    clearInterval(handle: unknown): void;
}

/** What a project's `main.ts` glue passes to {@link attachRoomLaunchBridge}. */
export interface RoomLaunchBridgeOptions {
    /** Exact browser-shell origin. Required when `transport` is omitted. */
    readonly parentOrigin?: string;
    readonly windowRef?: PlayHostWindow;
    /** Selected trusted host channel. Omit to retain the browser iframe path. */
    readonly transport?: PlayHostTransport;
    /** This project's raw, authored multiplayer config, exactly as declared —
     * validated here via `normalizeMultiplayerProjectConfig`. Must normalize
     * to a non-null config: a single-player project has no launch to bridge
     * and calls `attachPlayHostRoom` directly instead (see
     * `assembleRoomSeams`'s own solo branch). */
    readonly multiplayer: unknown;
    /** Realtime transport factories to inject in tests; see
     * `CreateRealtimeSeamsOptions`. */
    readonly realtimeOptions?: CreateRealtimeSeamsOptions;
    /** Where this tab's chosen incarnation is remembered; see
     * `chooseLocalIncarnation`. */
    readonly incarnationStorage?: IncarnationStorageLike;
    /** The timer the liveness watch polls on; tests supply a controllable one.
     * Defaults to the ambient timer. */
    readonly timers?: RoomLaunchTimers;
    /** How the bridge learns the Room Console's visibility; tests supply a
     * stub, since a headless run mounts no console to change state on its own.
     * Defaults to the console's own observable. */
    readonly observeConsoleVisibility?: (listener: (visible: boolean) => void) => () => void;
    /** The scene entities are parented under, and the physics world a
     * physics-backed `defineEntity`/`defineCharacterEntity` factory's `create`
     * needs — forwarded unchanged to `attachRoom`'s own `ctx` parameter.
     * Omit for a room with no scene to project into (see `attachRoom`'s own
     * `ctx` doc). */
    readonly ctx?: EntityCreateContext;
    /**
     * Control-plane match phase for the formed room's
     * `RoomSeams.controlLifecycle`. Owned by the multiplayer host; omit when
     * there is no control plane (solo defaults to playing).
     */
    readonly controlLifecycle?: () => import('@wanaka/multiplayer-runtime/runtime').ControlLifecycle;
    /** Cloud persistence mode frozen into this Game's exported definition. */
    readonly persistenceMode?: PersistenceMode;
}

/** One successfully formed realtime room inside a persistent game document. */
export interface RoomLaunchFormation {
    readonly room: Room;
    readonly generation: number;
    readonly roomInstanceId: string | null;
}

/** What a project's glue reads once the bridge is attached. */
export interface RoomLaunchBridge {
    /** The currently-formed room, or `null` before the first grant has landed,
     * or once the shell has ended it. A live read, not a spawn-time snapshot.
     * Credential rotation retains the instance; a different room identity
     * replaces it and publishes another formation. */
    readonly room: Room | null;
    readonly roomInstanceId: string | null;
    /** Whether this peer is this room's fixed authority. `Room` itself carries
     * no role query — author code must not branch on host/replica (see
     * room API's own doc) — but a headless test asserting which
     * seat is authoritative is not authored game code, so this bridge answers
     * it directly from the launch grant it already parsed
     * (`grant.peerId === grant.authorityPeerId`), the same identity a
     * `Membership.isLocalAuthority()` would compute. `false` before any grant
     * has landed. */
    readonly isLocalAuthority: boolean;
    /** Payload-free cloud persistence state and commands for authored Play UI. */
    readonly cloudPersistence: CloudPersistenceClient;
    /** Resolves once, with this frame's room, the moment a formation attempt
     * succeeds — the async half of the boot-order problem `bootRoomLaunch`
     * solves: `RoomPlatformBridge.room` is synchronous and required, but a
     * real grant genuinely arrives after the Engine multiplayer host starts running.
     * Rejects with `room_ended_before_formed` once the shell ends the launch
     * before that ever happens. A formation attempt that itself throws (e.g.
     * the relay socket cannot be opened) settles neither branch: it is
     * reported via `console.error` and posted to the shell as
     * `GAME_LOAD_FAILED` (the shell has no launch timeout of its own and
     * would otherwise spin forever) — independently of this promise, which
     * stays pending for a later grant to retry — form-once is consumed only
     * by a formation that succeeds. */
    readonly formed: Promise<Room>;
    /** Observes every successful room formation, including replacements in the same document. */
    subscribeFormed(listener: (formation: RoomLaunchFormation) => void): () => void;
    /** Report that this frame has finished preloading for the current Room and
     * launch generation. A no-op before any grant has landed, and once per
     * Room/generation pair after. */
    reportPreloaded(): void;
    /** Reports `GAME_LOADED` — this document finished its first authored room
     * activation. Unlike room-scoped preload/readiness, this is a document-wide
     * one-shot. See {@link bootRoomLaunch}, the one caller that knows when. */
    reportLoaded(): void;
    /** Reports `GAME_READY` for the current Room and launch generation — resources +
     * init done; the shell may enable player Ready. Idempotent per pair. */
    reportGameReady(): void;
    /** Reports `GAME_LOAD_FAILED` with `code` — this frame's boot failed
     * before or during activation. See {@link bootRoomLaunch}. */
    reportLoadFailed(code: string): void;
}

/**
 * Attaches the frame-protocol counterpart: subscribes to the selected trusted
 * host, announces `WANAKA_ROOM_BRIDGE_READY`, and forms, rotates, or
 * tears down this peer's realtime room as the shell's launch messages
 * arrive — see this module's own doc for the full protocol.
 *
 * @param session owning session; its scope, scheduler, diagnostics port, and
 *   pause/resume are all used (mirrors the play host controls' own
 *   `session`-shaped signature).
 * @param options see {@link RoomLaunchBridgeOptions}.
 * @returns the bridge; most project glue wants {@link bootRoomLaunch}
 *   instead, which already awaits {@link RoomLaunchBridge.formed} and
 *   reports the load outcome.
 * @throws if `options.multiplayer` does not normalize to a real multiplayer
 *   project config — a single-player project must not attach this bridge at
 *   all (see `RoomLaunchBridgeOptions.multiplayer`'s own doc).
 */
export function attachRoomLaunchBridge(session: RuntimeSession, options: RoomLaunchBridgeOptions): RoomLaunchBridge;

/**
 * Boot glue: resolves this frame's `platform.room` before authored game code
 * ever runs, then activates it — the reconciliation between
 * `attachRoomLaunchBridge`'s necessarily-asynchronous room (a real grant
 * arrives after the Engine multiplayer host starts) and `RoomPlatformBridge.room`'s
 * synchronous, required contract (see that interface's own doc for why it is
 * not optional).
 *
 * Awaiting {@link RoomLaunchBridge.formed} here, before `activate` ever
 * runs, IS the preload gate: the shell holds `WANAKA_ROOM_START`'s countdown
 * behind this frame's own `GAME_PRELOADED` report (see main's `RoomHelper`
 * semantics, referenced in this module's own doc). `reportPreloaded()` is
 * called the moment the room forms — `GAME_PRELOADED` means "this frame's
 * room exists," not "this frame's assets are ready": there is no asset-load
 * signal here to wait for instead (see this module's own doc). A solo
 * project (no multiplayer config) never calls this at all — it forms its
 * room synchronously via `attachPlayHostRoom` and is unaffected.
 *
 * Reports `GAME_LOADED` once `activate` returns without throwing, or
 * `GAME_LOAD_FAILED` — with `error.message` as the failure code, the shell
 * sanitizes an untrusted one at its own parse seam (see `messages.ts`'s
 * `frameLoadFailureCode`) — for a rejection of `formed` itself (only ever
 * `room_ended_before_formed`, once the shell ends the launch before any
 * formation ever succeeds), or for `activate` throwing once the room did
 * form. Rethrows after reporting, so a project's own top-level `.catch`
 * (e.g. `console.error`) still runs exactly as it does for any other boot
 * failure.
 *
 * A formation attempt that merely throws (e.g. an unreachable relay) does
 * NOT reject `formed` and does NOT make this function itself throw or
 * report — see {@link RoomLaunchBridge.formed}'s own doc for why. The
 * underlying bridge still posts `GAME_LOAD_FAILED` for it directly, so the
 * shell's spinner does not hang forever; this function keeps awaiting
 * `formed`, unaffected, so a later grant can still retry formation and
 * complete this same boot normally.
 *
 * A failure while `attachRoomLaunchBridge` itself is attaching (e.g. an
 * invalid `options.multiplayer`) throws before any bridge — and so any
 * host channel — exists, and is therefore never reported as
 * `GAME_LOAD_FAILED`: there is nothing to report it over yet. That is an
 * author-configuration mistake, not a runtime boot failure the shell's own
 * room UI needs to hear about.
 *
 * @param session owning session; forwarded to `attachRoomLaunchBridge`.
 * @param options see `RoomLaunchBridgeOptions`.
 * @param activate the project's room entry point, called for every formed
 *   room with a scope that is disposed before a replacement activates. Also
 *   receives the underlying `RoomLaunchBridge` — `Room`
 *   itself carries no role query by design (see the room API's own
 *   doc), so a caller that needs `bridge.isLocalAuthority` (e.g. the headless
 *   test surface `RuntimeTestContext.room()` reads) has nowhere else to read
 *   it from. The sanctioned use of this second parameter is exactly that:
 *   reading `bridge.room`/`bridge.isLocalAuthority` into the read-only facts
 *   the test surface reports — not calling `bridge.reportPreloaded()` /
 *   `reportLoaded()` / `reportLoadFailed()` from project glue, which this
 *   function already calls on the caller's behalf around `activate` itself.
 * @throws whatever `activate` throws, or `formed`'s own
 *   `room_ended_before_formed` rejection, after reporting `GAME_LOAD_FAILED`
 *   to the shell.
 */
export function bootRoomLaunch(session: RuntimeSession, options: RoomLaunchBridgeOptions, activate: (room: Room, bridge: RoomLaunchBridge, scope: LifetimeScope) => void | Promise<void>): Promise<void>;

/**
 * The window surface Play hosts exchange trusted shell messages on;
 * injectable for tests. Deliberately its own unpublished module: both
 * `play-host.ts` and `room-launch-bridge.ts` need the shape, but only the
 * latter is an Agent-facing declaration, and an unpublished home lets the
 * skill projection inline the interface instead of naming a module the
 * Agent surface does not ship.
 */
/** Window surface used for host messaging; injectable for tests. */
export interface PlayHostWindow {
    readonly parent: {
        postMessage(message: unknown, targetOrigin: string): void;
    };
    readonly performance?: {
        readonly timeOrigin: number;
    };
    addEventListener(type: 'message', listener: (event: {
        origin: string;
        source: unknown;
        data: unknown;
    }) => void, options: {
        signal: AbortSignal;
    }): void;
}

/** Browser and native host channel used by the multiplayer runtime. */
export interface PlayHostTransport {
    readonly kind: 'browser' | 'native';
    readonly identity: PlayHostIdentity;
    readonly bridgeVersion?: number;
    subscribe(listener: (message: unknown) => void): () => void;
    send(message: unknown): boolean;
    dispose(): void;
}

/** Stable identity attached to every trusted host message. */
interface PlayHostIdentity {
    readonly gameId: string;
    readonly publicationVersion?: number;
}

/** v3 separates room formation from generation-scoped playable readiness. */
export interface RoomSessionControlView extends Omit<V0RoomSessionControlView, 'endReason'> {
    readonly members: readonly (V0ControlMember & {
        readonly gameReady: boolean;
    })[];
    readonly selfGameReady: boolean;
    readonly endReason: 'host_ended' | 'host_left' | 'idle_timeout' | 'authority_lost' | 'authority_recovery_failed' | 'authority_election_failed' | null;
}

export type ShellToGameMessage = Exclude<V0ShellToGameMessage, {
    readonly type: 'WANAKA_ROOM_CONTROL_STATE';
}> | {
    readonly type: 'WANAKA_ROOM_CONTROL_STATE';
    readonly generation: number;
    readonly view: RoomSessionControlView;
};

export type GameToShellMessage = V0GameToShellMessage | {
    readonly type: 'WANAKA_ROOM_BRIDGE_READY';
    readonly grantCapabilities?: readonly CurrentRelayGrantCapability[];
} | {
    readonly type: 'GAME_READY';
    readonly generation: number;
};

export function parseShellToGameMessage(value: unknown): ShellToGameMessage | null;

type V0ControlMember = V0RoomSessionControlView['members'][number];

type CurrentRelayGrantCapability = RelayGrantCapability | 'game-ready';

/** Capabilities understood before v3; retained as a public authored-game contract. */
type RelayGrantCapability = 'room-instance-id';

/**
 * The short-lived credential and routing a frame needs to open its own relay
 * connection, and nothing else.
 *
 * Everything here is either public room routing or a relay-only capability
 * that expires in minutes. It deliberately carries no Control Session, no
 * resume token, no account bearer and no stable user id — see the trust table
 * in the export-room design. The frame is expected to read it; the security
 * property is that reading it buys an attacker one anonymous peer in one room
 * for a couple of minutes, not that the frame keeps it secret.
 */
export interface RelayLaunchGrant {
    /** Relay-only capability (`aud=realtime`), bound to `peerId` + `roomCode`. */
    readonly token: string;
    /** Epoch milliseconds the capability stops being accepted. */
    readonly expiresAtMs: number;
    /** `ws://…`/`wss://…` base, already including the relay's `/realtime` prefix. */
    readonly relayUrl: string;
    /** `https://…` base of the relay's WebTransport endpoint, when one is provisioned. */
    readonly wtUrl?: string;
    readonly wtCertificateHashes?: readonly {
        readonly algorithm: string;
        readonly value: number[];
    }[];
    /** This member's random, room-scoped peer id. Meaningless outside the room. */
    readonly peerId: PeerId;
    /**
     * The room's fixed authority — there is no migration. The Host's peer id,
     * or the server authority's reserved peer id when {@link authorityMode} is
     * `'server'`.
     */
    readonly authorityPeerId: PeerId;
    /**
     * Present only when the room's Export declared server authority: the
     * capability named the authority peer itself, and {@link authorityPeerId}
     * carries it instead of the Host. Absent — the shape every frame exported
     * before the field existed still expects, key-for-key — the Host is the
     * authority, exactly as before.
     */
    readonly authorityMode?: 'server';
    /**
     * The lifecycle identity of the room this grant belongs to (`ri_…`),
     * copied verbatim from the server's signed capability and never derived
     * from roster, snapshot or any other frame-visible input. Present only
     * when the capability carried it — absent, the grant is key-for-key the
     * shape every frame exported before the field existed still expects.
     */
    readonly roomInstanceId?: string;
    /** Exact immutable Export id. */
    readonly gameId: string;
    /** The room's code, which is also what the relay scopes connections to. */
    readonly roomCode: string;
}

/**
 * One entry of the frozen Start roster: a peer id and the public nickname it
 * was admitted under. Nicknames are public room facts, never credentials.
 */
export interface PlayerNameEntry {
    readonly peerId: PeerId;
    readonly nickname: string;
}

type PeerId = string;

/** Everything the trusted shell may say to the game frame. */
type V0ShellToGameMessage = {
    readonly type: 'WANAKA_ROOM_PROFILES';
    readonly generation: number;
    readonly profiles: readonly RoomPlayerProfileEntry[];
} | {
    readonly type: 'WANAKA_ROOM_GRANT';
    readonly generation: number;
    readonly grant: RelayLaunchGrant;
} | {
    readonly type: 'WANAKA_ROOM_START';
    readonly generation: number;
    readonly startDelayMs: number;
    readonly names: readonly PlayerNameEntry[];
} | {
    readonly type: 'WANAKA_ROOM_CANCEL_START';
    readonly generation: number;
} | {
    readonly type: 'WANAKA_ROOM_PAUSE';
    readonly generation: number;
    readonly reason: 'host_reconnecting' | 'local_reconnecting';
} | {
    readonly type: 'WANAKA_ROOM_RESUME';
    readonly generation: number;
    readonly grant: RelayLaunchGrant;
    readonly names: readonly PlayerNameEntry[];
} | {
    readonly type: 'WANAKA_ROOM_ENDED';
    readonly reason: string;
}
/**
 * Hand the frame a host-recovery checkpoint: the serialized authority
 * state of the generation this frame is taking over (or, for the Host's
 * own rebuilt page, re-assuming). `electionId` is present on a takeover
 * round's restore and rides back unchanged on the
 * `WANAKA_ROOM_RESTORE_READY` reply, so the control plane can file the
 * report against the right transaction. The frame pours the checkpoint
 * into the room it next forms on a grant.
 */
 | {
    readonly type: 'WANAKA_ROOM_RESTORE';
    readonly generation: number;
    readonly checkpoint: unknown;
    readonly electionId?: string;
}
/**
 * Control-plane lobby facts for authored room UI. Stamped with launch
 * generation so a retired frame ignores a late push.
 */
 | {
    readonly type: 'WANAKA_ROOM_CONTROL_STATE';
    readonly generation: number;
    readonly view: V0RoomSessionControlView;
}
/**
 * Show or hide the frame's own Room Console.
 *
 * Carries no `generation`, unlike every message above it: those describe a
 * launch, and a stale one must be recognised as belonging to a launch the
 * frame has moved past. This one describes what the person watching wants
 * on screen right now, which no launch can make stale — and stamping it
 * would invite the frame to withhold a view toggle over a label mismatch.
 */
 | {
    readonly type: 'WANAKA_ROOM_SYNC_HUD';
    readonly visible: boolean;
};
/**
 * Control-plane snapshot pushed to the game frame. Mirrors the Engine
 * `RoomSessionView` shape without importing the Engine package from the shell.
 */
interface V0RoomSessionControlView {
    readonly roomCode: string | null;
    /** Player-facing label for the region of the joined room, if it has one. */
    readonly roomRegion: string | null;
    /** Current room transport status for game-authored connection UI. */
    readonly connectionState: 'connected' | 'reconnecting' | 'host_reconnecting' | null;
    readonly lifecycle: 'waiting' | 'starting' | 'playing' | 'ended' | null;
    /** Persistence mode frozen into the published game by the trusted shell. */
    readonly persistenceMode: 'none' | 'room' | 'player';
    readonly supported: {
        readonly minPlayers: number;
        readonly maxPlayers: number;
    } | null;
    readonly capacity: {
        readonly minPlayers: number;
        readonly maxPlayers: number;
    } | null;
    /**
     * Relay regions the create UI may offer. Empty when this environment has no
     * region choice (single relay) or probes have not produced candidates yet.
     */
    readonly regions: readonly {
        readonly id: string;
        readonly label: string;
    }[];
    /**
     * Probe-picked region id to pre-select in create UI, or `null` when probes
     * have not finished / there is nothing to choose. Omitting `region` on
     * create still uses this same nearest relay.
     */
    readonly preferredRegion: string | null;
    /**
     * Nickname the trusted shell already knows for this visitor (signed-in
     * profile or last confirmed room nickname). Not used for create once
     * {@link confirmedNickname} is set.
     */
    readonly suggestedNickname: string | null;
    /**
     * Public invite link for this room (`/g/<gameId>?room=`), or `null` before
     * Membership. Safe to copy into a share control from game UI.
     */
    readonly inviteUrl: string | null;
    readonly members: readonly {
        readonly peerId: string;
        readonly nickname: string;
        readonly role: 'host' | 'guest';
        readonly connected: boolean;
        readonly loaded: boolean;
        readonly loadFailed: boolean;
        readonly ready: boolean;
    }[];
    readonly selfPeerId: string | null;
    readonly selfRole: 'host' | 'guest' | null;
    readonly selfReady: boolean;
    readonly selfLoaded: boolean;
    readonly startDelayMs: number | null;
    readonly pending: string | null;
    readonly errorCode: string | null;
    /**
     * Current session display nickname for this tab. Signed-in create keeps this
     * account-bound; after Membership the waiting HUD may change the room roster
     * name until Start.
     */
    readonly confirmedNickname: string | null;
    /** True when the shell knows a signed-in account (never exposes userId). */
    readonly signedIn: boolean;
    /** True when this tab may open a room (unjoined, not pending). */
    readonly canCreate: boolean;
    /** True while waiting and this member may change their display nickname. */
    readonly canSetNickname: boolean;
    /** True when the game may ask the shell to open Log in (unsigned visitors). */
    readonly canRequestLogin: boolean;
    readonly canSetReady: boolean;
    readonly canStart: boolean;
    readonly endReason: 'host_ended' | 'host_left' | 'authority_lost' | 'authority_recovery_failed' | 'authority_election_failed' | null;
    /** True once the room has ended and the game may return to its create HUD. */
    readonly canReturnToLobby: boolean;
}
/** Everything the game frame may say to the shell. */
type V0GameToShellMessage = {
    readonly type: 'WANAKA_ROOM_BRIDGE_READY';
    readonly grantCapabilities?: readonly RelayGrantCapability[];
} | {
    readonly type: 'GAME_PRELOADED';
    readonly generation: number;
} | {
    readonly type: 'GAME_LOADED';
} | {
    readonly type: 'GAME_LOAD_FAILED';
    readonly code: string;
} | {
    readonly type: 'WANAKA_ROOM_CONNECTION_STATUS';
    readonly generation: number;
    readonly connected: boolean;
}
/**
 * The carrier's own round trip, sampled on a timer rather than reported on
 * a change: a round trip is a continuous quantity, and there is no edge to
 * report.
 *
 * `rttMs` is `null` when the leg has no measurement yet, which is a reading
 * in its own right — a panel must show "no reading" rather than zero.
 */
 | {
    readonly type: 'WANAKA_ROOM_NETWORK_RTT';
    readonly generation: number;
    readonly rttMs: number | null;
}
/**
 * Whether the frame's own Room Console is on screen right now.
 *
 * The shell cannot know this by tracking its own button: the console's
 * primary entry point is a keybind inside the frame, so a shell that
 * assumed its button was the only toggle would mislabel it the moment
 * anyone pressed that key.
 *
 * Carries no `generation`, for the same reason the shell's own
 * `WANAKA_ROOM_SYNC_HUD` does not: it describes what is on screen now,
 * which no launch can make stale.
 */
 | {
    readonly type: 'WANAKA_ROOM_SYNC_HUD_VISIBLE';
    readonly visible: boolean;
}
/**
 * The server authority rejoined after a transient replacement. The shell
 * clears the frame's authority-loss notice without minting a new grant: the
 * frame's existing relay connection already observed the replacement.
 */
 | {
    readonly type: 'WANAKA_ROOM_AUTHORITY_RESTORED';
    readonly generation: number;
}
/**
 * The server authority left this room while its players remained attached.
 * The frame reports this as a recoverable interruption; a later restored
 * event withdraws it when the relay announces the replacement authority.
 */
 | {
    readonly type: 'WANAKA_ROOM_AUTHORITY_LOST';
    readonly generation: number;
}
/**
 * The frame accepted a host-recovery checkpoint and stands ready to pour
 * it into the room it next forms. The shell files this with the control
 * plane (`restore-ready`) before committing the takeover, so authority is
 * never handed to a frame that has not said it can hold it.
 */
 | {
    readonly type: 'WANAKA_ROOM_RESTORE_READY';
    readonly generation: number;
    readonly electionId?: string;
}
/**
 * The frame cannot restore the checkpoint it was handed (`code` names
 * why). The takeover round must move on to its next candidate.
 */
 | {
    readonly type: 'WANAKA_ROOM_RESTORE_FAILED';
    readonly generation: number;
    code: string;
};


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
