/**
 * Platform leaderboard. The optional Play host injects transport and
 * player identity; project source submits only score data. A missing
 * host is a normal export/standalone case — skip the board, do not
 * invent origins, tokens, or HTTP calls. Submit/list reject when the
 * scope or bridge is disposed; callers must handle that.
 */
import type { PlatformBridge } from 'wanaka-studio-engine/platform-bridge';
import { LeaderboardClient, type LeaderboardEntry } from 'wanaka-studio-engine/leaderboard';
import type { LifetimeScope } from 'wanaka-studio-engine';

export function createHostLeaderboard(
  scope: LifetimeScope,
  host: PlatformBridge | undefined,
): LeaderboardClient | undefined {
  if (!host) return undefined;
  return LeaderboardClient.create(scope, host.leaderboard);
}

export async function postRunAndReadTop(
  client: LeaderboardClient,
  boardId: string,
  score: number,
  extra?: Record<string, unknown>,
): Promise<readonly LeaderboardEntry[]> {
  try {
    await client.submit(boardId, extra === undefined ? { score } : { score, extra });
    return await client.list(boardId);
  } catch {
    return [];
  }
}
