// Import from "wanaka-studio-engine/room-session-bridge".

/**
 * Room-session Port for Agent-authored UI, distinct from `platform.room`
 * (play sync). Online sessions expose public control-plane facts and proxy
 * actions through the parent shell, which keeps the credentials. Explicit
 * browser Solo exposes its real local session facts without online controls.
 */
/** Public roster row — no membershipId, no tokens. */
export interface RoomSessionMemberView {
    readonly peerId: string;
    readonly nickname: string;
    readonly role: 'host' | 'guest';
    readonly connected: boolean;
    readonly loaded: boolean;
    readonly loadFailed: boolean;
    readonly gameReady: boolean;
    readonly ready: boolean;
}

export interface RoomSessionBounds {
    readonly minPlayers: number;
    readonly maxPlayers: number;
}

/**
 * Session facts the authored UI may read. A local Solo session has no online
 * room code or invitation; availability comes from `supported` and `can*`.
 * In an online launch, absent room fields mean no Membership yet — create via
 * {@link RoomSessionPort.create}. Invite entry (`?room=`) is owned by the
 * parent Shell: it joins once per tab; the game only paints Waiting after
 * Membership appears and never invents a second Join.
 */
export interface RoomSessionView {
    readonly roomCode: string | null;
    /** Player-facing label for the joined room's region, or `null` when absent. */
    readonly roomRegion: string | null;
    /** Current room transport status for game-authored connection UI. */
    readonly connectionState: 'connected' | 'reconnecting' | 'host_reconnecting' | null;
    readonly lifecycle: 'waiting' | 'starting' | 'playing' | 'ended' | null;
    /** Persistence mode frozen into the published GameVersion by the trusted shell. */
    readonly persistenceMode: 'none' | 'room' | 'player';
    readonly supported: RoomSessionBounds | null;
    readonly capacity: RoomSessionBounds | null;
    /** Relay regions for create UI; empty when the environment has no choice. */
    readonly regions: readonly {
        readonly id: string;
        readonly label: string;
    }[];
    /**
     * Probe-picked region to pre-select on create, or `null` when there is no
     * choice / probes have not finished.
     */
    readonly preferredRegion: string | null;
    /**
     * Shell-known nickname for create UI prefill (signed-in profile or last
     * confirmed preference). Not a credential.
     */
    readonly suggestedNickname: string | null;
    /**
     * Current session display nickname for this tab. Editable in game HUD until
     * Start; after Membership it mirrors the room roster name.
     */
    readonly confirmedNickname: string | null;
    /** True when the shell knows a signed-in account (never exposes userId). */
    readonly signedIn: boolean;
    /**
     * Public invite link (`?room=`), or `null` before Membership. Copy this from
     * game UI to share the room.
     */
    readonly inviteUrl: string | null;
    readonly members: readonly RoomSessionMemberView[];
    readonly selfPeerId: string | null;
    readonly selfRole: 'host' | 'guest' | null;
    readonly selfReady: boolean;
    readonly selfLoaded: boolean;
    readonly selfGameReady: boolean;
    /** Monotonic countdown remaining ms; null outside starting. */
    readonly startDelayMs: number | null;
    readonly pending: string | null;
    readonly errorCode: string | null;
    /** True when this tab may open a room (unjoined, not pending). */
    readonly canCreate: boolean;
    /** True while waiting and this member may change their display nickname. */
    readonly canSetNickname: boolean;
    /** True when the game may ask the shell to open Log in. */
    readonly canRequestLogin: boolean;
    readonly canSetReady: boolean;
    readonly canStart: boolean;
    /**
     * Why the room ended, or `null` while it is still open. The game paints this;
     * the shell does not cover the frame with its own notice.
     */
    readonly endReason: RoomSessionControlView['endReason'];
    /** True after the room has ended and this tab can return to the create HUD. */
    readonly canReturnToLobby: boolean;
}

/**
 * Game-facing room actions. Each action Promise resolves only after the host
 * accepts the action and rejects with a stable room error code as the Error
 * message for control-plane, guard, and stale-answer failures. All actions
 * reject in explicit browser Solo, which has no online room controls.
 */
export interface RoomSessionPort {
    getSnapshot(): RoomSessionView;
    subscribe(listener: () => void): () => void;
    /**
     * Open a room and become its Host. Collect nickname / region / capacity in
     * game UI; the parent shell proxies the control-plane create.
     */
    create(input: {
        readonly nickname: string;
        readonly region?: string | null;
        readonly capacityMaxPlayers: number;
        readonly capacityMinPlayers?: number;
        /**
         * Create-time override of this room's late-Join admission. Absent keeps
         * the published declaration's default; `false` closes an admission the
         * export declared open. Binds to the room this create opens — nothing
         * on a room page may revise it later — and `authority` / `recovery`
         * are not overridable from here at all.
         */
        readonly joinInProgress?: boolean;
        /** Create-time override of this room's rejoin admission; same rules as `joinInProgress`. */
        readonly rejoinAfterLeave?: boolean;
        /** Explicit persistent entry action selected on the authored create page. */
        readonly saveSelection?: 'new' | 'load';
    }): Promise<void>;
    /**
     * Ask the trusted parent shell to join an existing room. The shell owns the
     * Membership and credentials; authored code supplies only player-facing
     * room and nickname input.
     */
    join(input: {
        readonly roomCode: string;
        readonly nickname: string;
    }): Promise<void>;
    /** Change this tab's display nickname while the room is waiting. */
    setNickname(nickname: string): Promise<void>;
    /** Ask the parent shell to open Log in (no-op when already signed in). */
    requestLogin(): Promise<void>;
    setReady(ready: boolean): Promise<void>;
    start(): Promise<void>;
    leave(): Promise<void>;
    retryLoad(): Promise<void>;
    end(): Promise<void>;
    /** Drop the ended-room snapshot so the create HUD can show again. */
    returnToLobby(): Promise<void>;
}

/** Empty view before the parent has pushed a control-plane snapshot. */
export const EMPTY_ROOM_SESSION_VIEW: RoomSessionView;

export interface RoomSessionPortOptions {
    readonly parentOrigin?: string;
    /** Iframe window; must match `PlayHostWindow`'s postMessage listener shape. */
    readonly windowRef?: {
        readonly parent: unknown;
        addEventListener(type: 'message', listener: (event: {
            origin: string;
            source: unknown;
            data: unknown;
        }) => void, options: {
            signal: AbortSignal;
        }): void;
    };
    /** Trusted browser/native host transport. Omit for the legacy iframe seam. */
    readonly transport?: {
        subscribe(listener: (message: unknown) => void): () => void;
    };
    readonly signal: AbortSignal;
    /**
     * Parent-window RPC used for roomSession.* operations. Same channel as
     * leaderboard list/submit.
     */
    readonly request: (operation: 'roomSession.create' | 'roomSession.join' | 'roomSession.setNickname' | 'roomSession.requestLogin' | 'roomSession.setReady' | 'roomSession.start' | 'roomSession.leave' | 'roomSession.retryLoad' | 'roomSession.end' | 'roomSession.returnToLobby', payload: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>;
}

/**
 * Build a RoomSessionPort that caches `WANAKA_ROOM_CONTROL_STATE` pushes and
 * forwards actions over the platform-request channel.
 */
export function createRoomSessionPort(options: RoomSessionPortOptions): RoomSessionPort;

/** v3 separates room formation from generation-scoped playable readiness. */
interface RoomSessionControlView extends Omit<V0RoomSessionControlView, 'endReason'> {
    readonly members: readonly (V0ControlMember & {
        readonly gameReady: boolean;
    })[];
    readonly selfGameReady: boolean;
    readonly endReason: 'host_ended' | 'host_left' | 'idle_timeout' | 'authority_lost' | 'authority_recovery_failed' | 'authority_election_failed' | null;
}

type V0ControlMember = V0RoomSessionControlView['members'][number];

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
