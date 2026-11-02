import type { CloudPersistenceClient } from 'wanaka-studio-engine/cloud-persistence';
import type {
  PlayerPersistenceAuthorityModule,
  RoomPersistenceAuthorityModule,
} from 'wanaka-studio-engine/game';

type RoomSave = { readonly schema: 1; readonly worldDay: number };
type PlayerSave = { readonly schema: 1; readonly experience: number };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function decodeRecord(snapshot: Uint8Array): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(decoder.decode(snapshot));
  } catch {
    throw new Error('Save data is not valid JSON.');
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Save data must be an object.');
  }
  return value as Record<string, unknown>;
}

function decodeRoomSave(snapshot: Uint8Array): RoomSave {
  const value = decodeRecord(snapshot);
  if (
    value.schema !== 1 ||
    typeof value.worldDay !== 'number' ||
    !Number.isFinite(value.worldDay)
  ) {
    throw new Error('Room save schema is unsupported.');
  }
  return { schema: 1, worldDay: value.worldDay };
}

function decodePlayerSave(snapshot: Uint8Array): PlayerSave {
  const value = decodeRecord(snapshot);
  if (
    value.schema !== 1 ||
    typeof value.experience !== 'number' ||
    !Number.isFinite(value.experience)
  ) {
    throw new Error('Player save schema is unsupported.');
  }
  return { schema: 1, experience: value.experience };
}

/** Room example: the Authority captures one complete world snapshot. */
export function createRoomPersistenceAuthority(state: {
  get(): RoomSave;
  replace(save: RoomSave): void;
}): RoomPersistenceAuthorityModule {
  return {
    mode: 'room',
    restore(snapshot) {
      state.replace(snapshot === null ? { schema: 1, worldDay: 1 } : decodeRoomSave(snapshot));
    },
    capture() {
      return encoder.encode(JSON.stringify(state.get()));
    },
  };
}

/** Player example: the server supplies the trusted handle for one Player save. */
export function createPlayerPersistenceAuthority(state: {
  get(playerHandle: string): PlayerSave | undefined;
  replace(playerHandle: string, save: PlayerSave): void;
}): PlayerPersistenceAuthorityModule {
  return {
    mode: 'player',
    restore(playerHandle, snapshot) {
      state.replace(
        playerHandle,
        snapshot === null ? { schema: 1, experience: 0 } : decodePlayerSave(snapshot),
      );
    },
    capture(playerHandle) {
      const save = state.get(playerHandle);
      if (save === undefined) throw new Error('Player save is not ready.');
      return encoder.encode(JSON.stringify(save));
    },
  };
}

export interface CloudPersistenceView {
  setGameplayEnabled(enabled: boolean): void;
  /** A null message hides the loading gate. */
  showLoading(message: string | null, retry: (() => void) | null): void;
  /** A null label hides Save and its receipt. */
  showSave(enabled: boolean, label: string | null, message: string): void;
}

/** Play example: state and payload-free commands only; no save bytes or identity. */
export function bindCloudPersistenceUi(
  persistence: CloudPersistenceClient,
  view: CloudPersistenceView,
  canSave: () => boolean,
  subscribeAccess: ((listener: () => void) => () => void) | null = null,
): { readonly save: () => void; readonly retryLoad: () => void; readonly dispose: () => void } {
  let saveRequested = false;
  const render = (): void => {
    const status = persistence.getStatus();
    const ready = status.loadState === 'ready';
    view.setGameplayEnabled(ready || status.loadState === 'disabled');
    view.showLoading(
      status.loadState === 'error' ? 'Could not load save.' : status.loadState === 'loading' ? 'Loading save...' : null,
      status.loadState === 'error' ? () => persistence.retryLoad() : null,
    );
    const saving = saveRequested || status.saveState === 'saving';
    const visible = ready && canSave();
    view.showSave(
      visible && !saving,
      visible ? (saving ? 'Saving...' : 'Save') : null,
      status.saveState === 'saved'
        ? 'Saved'
        : status.saveState === 'error'
          ? 'Save failed. Try again.'
          : '',
    );
  };
  const unsubscribePersistence = persistence.subscribe(() => {
    if (persistence.getStatus().saveState !== 'saving') saveRequested = false;
    render();
  });
  const unsubscribeAccess = subscribeAccess?.(render) ?? null;
  return {
    save: () => {
      const status = persistence.getStatus();
      if (
        !saveRequested &&
        status.loadState === 'ready' &&
        status.saveState !== 'saving' &&
        canSave()
      ) {
        saveRequested = true;
        render();
        persistence.requestSave();
      }
    },
    retryLoad: () => {
      if (persistence.getStatus().loadState === 'error') persistence.retryLoad();
    },
    dispose: () => {
      unsubscribeAccess?.();
      unsubscribePersistence();
    },
  };
}
