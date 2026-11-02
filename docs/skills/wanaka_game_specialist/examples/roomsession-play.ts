/**
 * Mount room-session UI from `activateGame` when the Port is available.
 * `activatePlaying` starts after real room Start or Solo initialization.
 * Solo Preview exposes local roomSession observations without online room controls.
 */
import type { SimClientHandles } from '@wanaka/multiplayer-runtime';
import type { PlatformBridge } from 'wanaka-studio-engine/platform-bridge';
import type { RoomViewPlatformBridge } from 'wanaka-studio-engine/play-host-room';
import type { SceneContextForCatalog } from 'wanaka-studio-engine/scene';
import { mountRoomLeaderboard, type declareRoom } from './room-leaderboard.js';
import { mountMatchRoomHud, mountRoomSession } from './roomsession.js';
import { scenes } from './scenes.js';

type BoardSim = SimClientHandles<Awaited<ReturnType<typeof declareRoom>>>;

let roomSessionMounted = false;

export async function activateGame(
  context: SceneContextForCatalog<typeof scenes>,
  platform: PlatformBridge,
): Promise<void> {
  const port = platform.roomSession;
  if (port !== null && !roomSessionMounted) {
    roomSessionMounted = true;
    const session = mountRoomSession(context.viewport.overlayContainer, port);
    context.scope.defer(() => {
      roomSessionMounted = false;
      session.dispose();
    });
  }
}

export async function activateWaiting(
  _context: SceneContextForCatalog<typeof scenes>,
  _platform: PlatformBridge,
  _sim?: unknown,
): Promise<void> {
  // When this game has factions, mount the side-selection HUD here from `sim`.
  // Match input stays in activatePlaying.
}

export async function activatePlaying(
  context: SceneContextForCatalog<typeof scenes>,
  platform: PlatformBridge,
  raw?: unknown,
): Promise<void> {
  const room = 'room' in platform ? platform as RoomViewPlatformBridge : null;
  const sim = raw !== null && typeof raw === 'object' ? raw as BoardSim : null;
  if (sim === null || room === null) return;
  const roomHud = mountMatchRoomHud(context.viewport.overlayContainer, room);
  const board = mountRoomLeaderboard(context.viewport.overlayContainer, room, sim);
  context.scope.defer(
    context.session.scheduler.on('update', () => {
      roomHud.update();
      board.update();
    }),
  );
  context.scope.defer(() => {
    roomHud.dispose();
    board.dispose();
  });
}
