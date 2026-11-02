// Import from "wanaka-studio-engine/platform-bridge".

import type { LeaderboardClientOptions } from "wanaka-studio-engine/leaderboard";
import type { RoomSessionPort } from "wanaka-studio-engine/room-session-bridge";
import type { NpcDecisionPort } from "wanaka-studio-engine/npc";

/** Platform services injected by the Play host into Agent-authored game code. */
export interface PlatformBridge {
    readonly gameId: string;
    readonly leaderboard: LeaderboardClientOptions;
    /**
     * Room-session facts and controls for authored UI. Explicit browser Solo
     * exposes only its local session facts; online controls are unavailable.
     * `null` on hosts that never attach a session (e.g. headless authority).
     */
    readonly roomSession: RoomSessionPort | null;
    /** Host-provided bounded NPC decisions; credentials never enter game code. */
    readonly decision: NpcDecisionPort;
}
