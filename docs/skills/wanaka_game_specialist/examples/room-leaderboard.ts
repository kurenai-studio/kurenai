/**
 * In-room standings: the authority writes a shared board on `room.state`,
 * and play only reads it for HUD. The field names here are an example, not
 * a platform schema. Do not use `presentations` (late joiners never see
 * them) and do not use `platform.leaderboard` (that is the cross-run high
 * score wall; the headless authority cannot submit to it). Mount this HUD
 * only after Start — see `roomsession-play.ts`.
 */
import { hudElement } from 'wanaka-studio-engine/dom';
import type { Room, SimClientHandles } from '@wanaka/multiplayer-runtime';
import type {
  RoomPlatformBridge,
  RoomViewPlatformBridge,
} from 'wanaka-studio-engine/play-host-room';
import type { SimulateSceneContext } from 'wanaka-studio-engine/game';
import { scenes } from './scenes.js';

type PlayerId = Room['me'];

export interface BoardRow {
  readonly playerId: PlayerId;
  readonly name: string;
  readonly score: number;
}

export async function declareRoom(
  context: SimulateSceneContext<typeof scenes>,
  platform: RoomPlatformBridge,
): Promise<{
  readonly state: { board: Record<string, { score: number }> };
  readonly actions: { addScore(amount: number): void };
}> {
  void context;
  const room = platform.room;
  const state = room.state({
    board: {} as Record<string, { score: number }>,
  });

  const actions = room.actions({
    addScore(by: PlayerId, amount: number): void {
      if (!Number.isFinite(amount) || amount === 0) return;
      const current = state.board[by]?.score ?? 0;
      state.board = { ...state.board, [by]: { score: current + amount } };
    },
  });

  room.onTick(() => {
    let next = state.board;
    let changed = false;
    for (const id of room.players) {
      if (next[id] !== undefined) continue;
      if (!changed) next = { ...next };
      next[id] = { score: 0 };
      changed = true;
    }
    if (changed) state.board = next;
  });

  return { state, actions };
}

type BoardSim = SimClientHandles<Awaited<ReturnType<typeof declareRoom>>>;

/** Ranked rows for every seated player. Play may call this every frame. */
export function readRoomLeaderboard(
  platform: RoomViewPlatformBridge,
  sim: BoardSim,
): readonly BoardRow[] {
  const room = platform.room;
  return [...room.players]
    .map((id) => ({
      playerId: id,
      name: room.playerName(id) ?? id,
      score: sim.state.board[id]?.score ?? 0,
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

/** Overlay that only reads the shared board. */
export function mountRoomLeaderboard(
  parent: HTMLElement,
  platform: RoomViewPlatformBridge,
  sim: BoardSim,
): { update(): void; dispose(): void } {
  const root = hudElement('div', { parent });
  Object.assign(root.style, {
    position: 'absolute',
    top: '16px',
    right: '16px',
    minWidth: '160px',
    padding: '8px 12px',
    background: 'rgba(8, 10, 14, 0.72)',
    color: '#f4f6f8',
    pointerEvents: 'none',
  });
  const title = hudElement('p', { parent: root, text: 'Standings' });
  Object.assign(title.style, { margin: '0 0 8px', fontWeight: '600' });
  const list = hudElement('ol', { parent: root });
  Object.assign(list.style, { margin: '0', paddingLeft: '20px' });

  const update = (): void => {
    list.replaceChildren();
    for (const row of readRoomLeaderboard(platform, sim)) {
      hudElement('li', { parent: list, text: `${row.name}  ${row.score}` });
    }
  };
  update();

  return {
    update,
    dispose: () => {
      root.remove();
    },
  };
}
