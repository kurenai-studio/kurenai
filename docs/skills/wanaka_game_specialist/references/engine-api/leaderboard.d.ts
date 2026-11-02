// Import from "wanaka-studio-engine/leaderboard".

import type { LifetimeScope } from "wanaka-studio-engine";

export interface LeaderboardEntry {
    readonly playerId: string;
    readonly score: number;
    readonly extra?: Record<string, unknown>;
}

export interface LeaderboardSubmission {
    readonly score: number;
    readonly extra?: Record<string, unknown>;
}

export interface LeaderboardClientOptions {
    readonly list: (boardId: string, signal: AbortSignal) => Promise<unknown>;
    readonly submit: (boardId: string, entry: LeaderboardSubmission, signal: AbortSignal) => Promise<unknown>;
}

/**
 * Narrow platform leaderboard client. The trusted host owns player identity;
 * project code submits only score data.
 */
export class LeaderboardClient {
    private constructor();
    static create(scope: LifetimeScope, options: LeaderboardClientOptions): LeaderboardClient;
    list(boardId: string): Promise<readonly LeaderboardEntry[]>;
    submit(boardId: string, entry: LeaderboardSubmission): Promise<void>;
}
