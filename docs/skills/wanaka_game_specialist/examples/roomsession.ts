import { hudElement } from 'wanaka-studio-engine/dom';
import type { RoomViewPlatformBridge } from 'wanaka-studio-engine/play-host-room';
import type { RoomSessionPort } from 'wanaka-studio-engine/room-session-bridge';

type MatchRoomHudPlatform = Pick<RoomViewPlatformBridge, 'roomSession' | 'roomDiagnostics'>;

function roomEndedMessage(reason: string | null): string {
  switch (reason) {
    case 'host_left':
      return 'The host left, so this room is over.';
    case 'host_ended':
      return 'The host ended this room.';
    case 'authority_lost':
      return 'The game could not keep running without its host, so this match is over.';
    case 'authority_recovery_failed':
      return 'The game could not be restored after the host dropped, so this match is over.';
    case 'authority_election_failed':
      return 'No player could take the game over after the host dropped, so this match is over.';
    default:
      return 'This room is over.';
  }
}

/** Shared look for every control on the in-game room HUD. */
function styleHudButton(button: HTMLButtonElement, selected = false): void {
  Object.assign(button.style, {
    appearance: 'none',
    border: selected ? '1px solid #f4f6f8' : '1px solid rgba(244, 246, 248, 0.35)',
    background: selected ? '#f4f6f8' : 'transparent',
    color: selected ? '#0b0d10' : '#f4f6f8',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: button.disabled ? 'default' : 'pointer',
    font: 'inherit',
    opacity: button.disabled ? '0.45' : '1',
  });
}

/**
 * Room session UI drawn by the game. Collect nickname / region / capacity here, then
 * call `platform.roomSession.create`. Persistent games choose New or Load on this
 * create page; the parent Shell owns the authenticated save list opened by Load.
 * After Membership exists, drive Ready / Start / Leave through the same Port.
 */
export function mountRoomSession(
  parent: HTMLElement,
  port: RoomSessionPort,
  mayStart: () => boolean = () => true,
): { update(): void; dispose(): void } {
  const root = hudElement('div', { parent });
  Object.assign(root.style, {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    background: 'rgba(8, 10, 14, 0.82)',
    color: '#f4f6f8',
    pointerEvents: 'auto',
    zIndex: '20',
  });

  const status = hudElement('p', { parent: root, text: 'Open a room' });
  Object.assign(status.style, { margin: '0', fontWeight: '600', fontSize: '18px' });

  const endedPanel = hudElement('div', { parent: root });
  Object.assign(endedPanel.style, {
    display: 'none',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  });
  const endedText = hudElement('p', { parent: endedPanel, text: '' });
  Object.assign(endedText.style, { margin: '0', fontWeight: '600', fontSize: '18px' });
  const backToLobby = hudElement('button', {
    parent: endedPanel,
    text: 'Back to lobby',
  }) as HTMLButtonElement;
  backToLobby.type = 'button';
  styleHudButton(backToLobby, true);

  const createPanel = hudElement('div', { parent: root });
  Object.assign(createPanel.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: 'min(420px, 100%)',
    alignItems: 'stretch',
    margin: 'auto',
  });

  const playingAs = hudElement('p', { parent: createPanel, text: 'Choose how to play' });
  Object.assign(playingAs.style, { margin: '0', opacity: '0.8', fontSize: '12px' });
  const identityHint = hudElement('p', { parent: createPanel, text: 'Checking account…' });
  Object.assign(identityHint.style, { margin: '0', fontSize: '13px', lineHeight: '1.35' });
  const nickname = hudElement('input', { parent: createPanel }) as HTMLInputElement;
  nickname.type = 'text';
  nickname.setAttribute('aria-label', 'Room display name');
  Object.assign(nickname.style, {
    margin: '0',
    fontWeight: '600',
    font: 'inherit',
    color: 'inherit',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(244,246,248,0.35)',
    borderRadius: '8px',
    padding: '8px 12px',
  });
  const login = hudElement('button', { parent: createPanel, text: 'Continue with Wanaka' }) as HTMLButtonElement;
  login.type = 'button';

  const regionLabel = hudElement('p', { parent: createPanel, text: 'Region' });
  Object.assign(regionLabel.style, { margin: '0', opacity: '0.8', fontSize: '12px' });
  const regionRow = hudElement('div', { parent: createPanel });
  Object.assign(regionRow.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  });

  const seatsLabel = hudElement('p', { parent: createPanel, text: 'Players' });
  Object.assign(seatsLabel.style, { margin: '0', opacity: '0.8', fontSize: '12px' });
  const seatsRow = hudElement('div', { parent: createPanel });
  Object.assign(seatsRow.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'center',
  });

  const minGroup = hudElement('div', { parent: seatsRow });
  Object.assign(minGroup.style, { display: 'flex', gap: '8px', alignItems: 'center' });
  hudElement('span', { parent: minGroup, text: 'Min' });
  const minMinus = hudElement('button', { parent: minGroup, text: '−' }) as HTMLButtonElement;
  minMinus.type = 'button';
  const minValue = hudElement('span', { parent: minGroup, text: '—' });
  Object.assign(minValue.style, { minWidth: '1.5em', textAlign: 'center', fontWeight: '600' });
  const minPlus = hudElement('button', { parent: minGroup, text: '+' }) as HTMLButtonElement;
  minPlus.type = 'button';

  const maxGroup = hudElement('div', { parent: seatsRow });
  Object.assign(maxGroup.style, { display: 'flex', gap: '8px', alignItems: 'center' });
  hudElement('span', { parent: maxGroup, text: 'Max' });
  const maxMinus = hudElement('button', { parent: maxGroup, text: '−' }) as HTMLButtonElement;
  maxMinus.type = 'button';
  const maxValue = hudElement('span', { parent: maxGroup, text: '—' });
  Object.assign(maxValue.style, { minWidth: '1.5em', textAlign: 'center', fontWeight: '600' });
  const maxPlus = hudElement('button', { parent: maxGroup, text: '+' }) as HTMLButtonElement;
  maxPlus.type = 'button';

  const create = hudElement('button', {
    parent: createPanel,
    text: 'Create New Game',
  }) as HTMLButtonElement;
  create.type = 'button';
  const loadSave = hudElement('button', {
    parent: createPanel,
    text: 'Load Save',
  }) as HTMLButtonElement;
  loadSave.type = 'button';

  const joinLabel = hudElement('p', {
    parent: createPanel,
    text: 'Or join with a room code',
  });
  Object.assign(joinLabel.style, {
    margin: '4px 0 0',
    opacity: '0.8',
    fontSize: '12px',
    textAlign: 'center',
  });
  const joinRow = hudElement('div', { parent: createPanel });
  Object.assign(joinRow.style, { display: 'flex', gap: '8px', alignItems: 'stretch' });
  const roomCode = hudElement('input', { parent: joinRow }) as HTMLInputElement;
  roomCode.type = 'text';
  roomCode.placeholder = 'Room code';
  roomCode.setAttribute('aria-label', 'Room code');
  roomCode.autocomplete = 'off';
  roomCode.autocapitalize = 'characters';
  roomCode.spellcheck = false;
  Object.assign(roomCode.style, {
    flex: '1 1 auto',
    minWidth: '0',
    font: 'inherit',
    color: 'inherit',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(244,246,248,0.35)',
    borderRadius: '8px',
    padding: '8px 12px',
    textTransform: 'uppercase',
  });
  const join = hudElement('button', { parent: joinRow, text: 'Join Room' }) as HTMLButtonElement;
  join.type = 'button';

  const waitingNickname = hudElement('input', { parent: root }) as HTMLInputElement;
  waitingNickname.type = 'text';
  waitingNickname.placeholder = 'Display name';
  Object.assign(waitingNickname.style, { display: 'none', padding: '8px 12px', borderRadius: '8px', font: 'inherit' });
  const roster = hudElement('ul', { parent: root });
  Object.assign(roster.style, {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    textAlign: 'center',
  });
  const invite = hudElement('p', { parent: root });
  Object.assign(invite.style, {
    maxWidth: 'min(420px, 100%)',
    wordBreak: 'break-all',
    textAlign: 'center',
    opacity: '0.9',
    fontSize: '12px',
  });
  const error = hudElement('p', { parent: root });
  Object.assign(error.style, { color: '#ffb4b4', minHeight: '1.2em', margin: '0' });
  const actions = hudElement('div', { parent: root });
  Object.assign(actions.style, {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  });
  const share = hudElement('button', {
    parent: actions,
    text: 'Copy invite link',
  }) as HTMLButtonElement;
  share.type = 'button';
  const ready = hudElement('button', { parent: actions, text: 'Ready' }) as HTMLButtonElement;
  ready.type = 'button';
  const start = hudElement('button', { parent: actions, text: 'Start' }) as HTMLButtonElement;
  start.type = 'button';
  const leave = hudElement('button', { parent: actions, text: 'Leave' }) as HTMLButtonElement;
  leave.type = 'button';
  const waitingLogin = hudElement('button', { parent: actions, text: 'Continue with Wanaka' }) as HTMLButtonElement;
  waitingLogin.type = 'button';

  let selectedRegionId = '';
  let regionPreferenceSeeded = false;
  let capacityMinPlayers: number | null = null;
  let capacityMaxPlayers: number | null = null;
  let regionKey = '';
  let joinError: string | null = null;
  let nicknameSave: Promise<boolean> | null = null;
  let nicknameError: string | null = null;

  const saveWaitingNickname = (): Promise<boolean> => {
    const view = port.getSnapshot();
    const next = waitingNickname.value.trim();
    if (next === '' || next === (view.confirmedNickname ?? '')) return Promise.resolve(true);
    if (nicknameSave !== null) return nicknameSave;
    nicknameError = null;
    nicknameSave = port
      .setNickname(next)
      .then(() => true)
      .catch(() => {
        nicknameError = 'Name was not saved. Try again.';
        return false;
      })
      .finally(() => {
        nicknameSave = null;
        update();
      });
    update();
    return nicknameSave;
  };

  const paintRegionButtons = (): void => {
    const view = port.getSnapshot();
    if (!regionPreferenceSeeded) {
      selectedRegionId = view.preferredRegion ?? '';
      regionPreferenceSeeded = true;
    } else if (
      selectedRegionId !== '' &&
      !view.regions.some((entry) => entry.id === selectedRegionId)
    ) {
      selectedRegionId = view.preferredRegion ?? '';
    }
    const nextKey = view.regions.map((entry) => `${entry.id}:${entry.label}`).join('|');
    if (nextKey === regionKey && regionRow.childElementCount > 0) {
      for (const child of regionRow.querySelectorAll('button')) {
        const button = child as HTMLButtonElement;
        styleHudButton(button, button.dataset.regionId === selectedRegionId);
      }
      return;
    }
    regionKey = nextKey;
    regionRow.replaceChildren();
    if (view.regions.length === 0) {
      regionLabel.style.display = 'none';
      regionRow.style.display = 'none';
      return;
    }
    regionLabel.style.display = '';
    regionRow.style.display = 'flex';
    const choices: Array<{ id: string; label: string }> = [
      { id: '', label: 'Nearest region' },
      ...view.regions.map((entry) => ({ id: entry.id, label: entry.label })),
    ];
    for (const choice of choices) {
      const button = hudElement('button', {
        parent: regionRow,
        text: choice.label,
      }) as HTMLButtonElement;
      button.type = 'button';
      button.dataset.regionId = choice.id;
      styleHudButton(button, choice.id === selectedRegionId);
      button.onclick = () => {
        selectedRegionId = choice.id;
        update();
      };
    }
  };

  const update = (): void => {
    const view = port.getSnapshot();
    const savingNickname = nicknameSave !== null;
    if (view.supported === null || view.lifecycle === 'playing') {
      root.style.display = 'none';
      return;
    }
    const ended = view.lifecycle === 'ended';
    root.style.display = 'flex';
    endedPanel.style.display = ended ? 'flex' : 'none';
    if (ended) {
      createPanel.style.display = 'none';
      actions.style.display = 'none';
      roster.style.display = 'none';
      invite.style.display = 'none';
      status.style.display = 'none';
      endedText.textContent = roomEndedMessage(view.endReason);
      backToLobby.disabled = !view.canReturnToLobby;
      styleHudButton(backToLobby, true);
      return;
    }
    status.style.display = '';
    const unjoined = view.roomCode === null;
    createPanel.style.display = unjoined ? 'flex' : 'none';
    actions.style.display = unjoined ? 'none' : 'flex';
    roster.style.display = unjoined ? 'none' : 'block';
    invite.style.display = unjoined ? 'none' : 'block';

    const supported = view.supported;
    if (supported !== null) {
      if (capacityMaxPlayers === null) capacityMaxPlayers = supported.maxPlayers;
      if (capacityMinPlayers === null) capacityMinPlayers = supported.minPlayers;
      capacityMaxPlayers = Math.min(
        supported.maxPlayers,
        Math.max(supported.minPlayers, capacityMaxPlayers),
      );
      capacityMinPlayers = Math.min(
        capacityMaxPlayers,
        Math.max(supported.minPlayers, capacityMinPlayers),
      );
      minValue.textContent = String(capacityMinPlayers);
      maxValue.textContent = String(capacityMaxPlayers);
      minGroup.style.display = supported.maxPlayers <= supported.minPlayers ? 'none' : 'flex';
      minMinus.disabled = capacityMinPlayers <= supported.minPlayers;
      minPlus.disabled = capacityMinPlayers >= capacityMaxPlayers;
      maxMinus.disabled = capacityMaxPlayers <= capacityMinPlayers;
      maxPlus.disabled = capacityMaxPlayers >= supported.maxPlayers;
      styleHudButton(minMinus);
      styleHudButton(minPlus);
      styleHudButton(maxMinus);
      styleHudButton(maxPlus);
    }

    paintRegionButtons();

    const capacity = view.capacity;
    const seats =
      capacity === null
        ? `${view.members.length} players`
        : `${view.members.length} / ${capacity.maxPlayers} players`;
    status.textContent = unjoined
      ? supported === null
        ? 'Preparing room…'
        : `Multiplayer — ${supported.minPlayers} to ${supported.maxPlayers} players`
      : `Room ${view.roomCode} · ${seats}`;
    invite.textContent = view.inviteUrl ?? '';
    roster.replaceChildren(
      ...view.members.map((member: (typeof view.members)[number]) => {
        const row = document.createElement('li');
        const readiness = member.ready
          ? ' · Ready'
          : member.gameReady
            ? ''
            : ' · Preparing…';
        row.textContent = `${member.nickname}${member.role === 'host' ? ' (Host)' : ''}${readiness}`;
        return row;
      }),
    );
    error.textContent = joinError ?? nicknameError ?? view.errorCode ?? '';
    const nextName = view.confirmedNickname ?? view.suggestedNickname ?? '';
    if (
      document.activeElement !== nickname &&
      (view.roomCode !== null || nickname.value === '')
    ) {
      nickname.value = nextName;
    }
    nickname.style.display = view.signedIn ? 'none' : '';
    nickname.disabled = !view.canSetNickname;
    waitingNickname.style.display = !unjoined && view.canSetNickname ? '' : 'none';
    if (document.activeElement !== waitingNickname) waitingNickname.value = nextName;
    waitingNickname.disabled = !view.canSetNickname || savingNickname;
    identityHint.textContent = view.signedIn
      ? 'Signed in as ' + (view.confirmedNickname ?? view.suggestedNickname ?? 'Wanaka player') + '.'
      : 'Play as a guest with this nickname, or sign in to use your Wanaka profile.';
    login.style.display = view.canRequestLogin ? '' : 'none';
    login.disabled = !view.canRequestLogin;
    waitingLogin.hidden = unjoined || !view.canRequestLogin;
    waitingLogin.disabled = !view.canRequestLogin;
    create.textContent = view.persistenceMode === 'none' ? 'Create Room' : 'Create New Game';
    create.disabled = !view.canCreate || view.pending !== null;
    loadSave.textContent = view.persistenceMode === 'room' ? 'Load Saved Game' : 'Load Save';
    loadSave.hidden = view.persistenceMode === 'none';
    loadSave.disabled = !view.canCreate || view.pending !== null;
    roomCode.disabled = !view.canCreate || view.pending !== null;
    join.textContent = view.pending === 'join' ? 'Joining…' : 'Join Room';
    join.disabled =
      !view.canCreate || view.pending !== null || roomCode.value.trim() === '';
    share.disabled = view.inviteUrl === null;
    if (!view.selfGameReady && !view.selfReady) {
      ready.textContent = 'Preparing…';
      ready.disabled = true;
      ready.setAttribute('aria-busy', 'true');
      ready.style.opacity = '0.72';
    } else {
      ready.textContent = view.selfReady ? 'Unready' : 'Ready';
      // A click can blur the nickname field and start its save before the click
      // event reaches this button. Keep it enabled; the handler awaits that save.
      ready.disabled = !view.canSetReady;
      ready.removeAttribute('aria-busy');
      ready.style.opacity = '';
    }
    start.disabled = !view.canStart || !mayStart();
    start.hidden = view.selfRole !== 'host';
    styleHudButton(login);
    styleHudButton(create, true);
    styleHudButton(loadSave);
    styleHudButton(join);
    styleHudButton(share);
    styleHudButton(ready);
    styleHudButton(start);
    styleHudButton(leave);
    styleHudButton(waitingLogin);
  };

  minMinus.onclick = () => {
    if (capacityMinPlayers === null) return;
    capacityMinPlayers -= 1;
    update();
  };
  minPlus.onclick = () => {
    if (capacityMinPlayers === null) return;
    capacityMinPlayers += 1;
    update();
  };
  maxMinus.onclick = () => {
    if (capacityMaxPlayers === null) return;
    capacityMaxPlayers -= 1;
    update();
  };
  maxPlus.onclick = () => {
    if (capacityMaxPlayers === null) return;
    capacityMaxPlayers += 1;
    update();
  };
  const createRoom = (saveSelection?: 'new' | 'load'): void => {
    const view = port.getSnapshot();
    const supported = view.supported;
    if (supported === null || !view.canCreate) return;
    const maxPlayers = capacityMaxPlayers ?? supported.maxPlayers;
    const minPlayers = capacityMinPlayers ?? supported.minPlayers;
    void port.create({
      nickname: view.signedIn
        ? (view.confirmedNickname ?? view.suggestedNickname ?? '')
        : nickname.value.trim(),
      ...(selectedRegionId === '' ? {} : { region: selectedRegionId }),
      capacityMaxPlayers: maxPlayers,
      ...(minPlayers !== supported.minPlayers ? { capacityMinPlayers: minPlayers } : {}),
      ...(saveSelection === undefined ? {} : { saveSelection }),
    });
  };
  create.onclick = () => {
    const mode = port.getSnapshot().persistenceMode;
    createRoom(mode === 'none' ? undefined : 'new');
  };
  loadSave.onclick = () => {
    if (port.getSnapshot().persistenceMode === 'none') return;
    createRoom('load');
  };
  const joinRoom = (): void => {
    const view = port.getSnapshot();
    if (!view.canCreate || view.pending !== null) return;
    const nextRoomCode = roomCode.value.trim().toUpperCase();
    const nextNickname = view.signedIn
      ? (view.confirmedNickname ?? view.suggestedNickname ?? '')
      : nickname.value.trim();
    if (nextRoomCode === '') {
      joinError = 'Enter a room code.';
      update();
      return;
    }
    joinError = null;
    update();
    void port
      .join({
        roomCode: nextRoomCode,
        nickname: nextNickname,
      })
      .catch((cause: unknown) => {
        joinError = cause instanceof Error ? cause.message : 'Could not join room.';
        update();
      });
  };
  roomCode.oninput = () => {
    joinError = null;
    update();
  };
  roomCode.onkeydown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    joinRoom();
  };
  join.onclick = joinRoom;
  login.onclick = () => {
    void port.requestLogin();
  };
  waitingLogin.onclick = () => { void port.requestLogin(); };
  waitingNickname.onchange = () => {
    void saveWaitingNickname();
  };
  nickname.onchange = () => {
    if (port.getSnapshot().signedIn) return;
    const next = nickname.value.trim();
    if (next === '') return;
    void port.setNickname(next);
  };
  share.onclick = () => {
    const url = port.getSnapshot().inviteUrl;
    if (url === null) return;
    void navigator.clipboard?.writeText(url);
  };
  ready.onclick = () => {
    void (async () => {
      if (!(await saveWaitingNickname())) return;
      await port.setReady(!port.getSnapshot().selfReady);
    })();
  };
  start.onclick = () => {
    void (async () => {
      if (!(await saveWaitingNickname()) || !mayStart()) return;
      await port.start();
    })();
  };
  leave.onclick = () => {
    void port.leave();
  };
  backToLobby.onclick = () => {
    if (!port.getSnapshot().canReturnToLobby) return;
    void port.returnToLobby();
  };

  const unsubscribe = port.subscribe(update);
  update();
  return {
    update,
    dispose: () => {
      unsubscribe();
      root.remove();
    },
  };
}

/** Match-phase room controls. Every player can leave; only the Host can end. */
export function mountMatchRoomHud(
  parent: HTMLElement,
  platform: MatchRoomHudPlatform,
): { update(): void; dispose(): void } {
  const panel = hudElement('section', { parent });
  const connection = hudElement('strong', { parent: panel, text: '' });
  const count = hudElement('span', { parent: panel, text: '' });
  const toggle = hudElement('button', { parent: panel, text: 'Show players' }) as HTMLButtonElement;
  const roster = hudElement('ul', { parent: panel });
  const leave = hudElement('button', { parent: panel, text: 'Leave room' }) as HTMLButtonElement;
  const end = hudElement('button', { parent: panel, text: 'End room' }) as HTMLButtonElement;
  const actionStatus = hudElement('span', { parent: panel, text: '' });
  let rosterVisible = false;
  let actionError: string | null = null;

  Object.assign(panel.style, {
    position: 'absolute', top: '18px', left: '18px', zIndex: '20', display: 'flex',
    flexDirection: 'column', gap: '8px', padding: '12px 14px', borderRadius: '9px',
    background: '#081426dd', color: '#eef6ff', fontFamily: 'system-ui', pointerEvents: 'auto',
  });
  Object.assign(roster.style, { display: 'none', margin: '0', paddingLeft: '18px' });
  for (const button of [toggle, leave, end]) {
    Object.assign(button.style, {
      padding: '7px 10px', borderRadius: '6px', border: '1px solid #8abcf0', cursor: 'pointer',
    });
  }
  toggle.onclick = () => {
    rosterVisible = !rosterVisible;
    roster.style.display = rosterVisible ? 'block' : 'none';
    toggle.textContent = rosterVisible ? 'Hide players' : 'Show players';
  };
  leave.onclick = () => {
    const port = platform.roomSession;
    if (port === null) return;
    actionError = null;
    void port.leave().catch((error: unknown) => {
      actionError = error instanceof Error ? error.message : 'Room leave failed.';
    });
  };
  end.onclick = () => {
    const port = platform.roomSession;
    if (port === null) return;
    actionError = null;
    void port.end().catch((error: unknown) => {
      actionError = error instanceof Error ? error.message : 'Room end failed.';
    });
  };

  const update = (): void => {
    const view = platform.roomSession?.getSnapshot();
    panel.style.display = view?.lifecycle === 'playing' && view.supported !== null ? 'flex' : 'none';
    if (view?.lifecycle !== 'playing' || view.supported === null) return;
    const diagnostics = platform.roomDiagnostics();
    const status = view.connectionState === 'host_reconnecting'
      ? 'Host reconnecting'
      : view.connectionState === 'reconnecting'
        ? 'Reconnecting'
        : view.connectionState === 'connected'
          ? 'Connected'
          : 'Connecting';
    const ping = diagnostics?.networkRttMs === null || diagnostics === null
      ? '—'
      : `${Math.round(diagnostics.networkRttMs)} ms`;
    connection.textContent = `${status} · ${ping}${view.roomRegion ? ` · ${view.roomRegion}` : ''}`;
    const members = view.members;
    count.textContent = `${members.filter((member) => member.connected).length}/${members.length} players`;
    roster.replaceChildren(...members.map((member) => {
      const item = document.createElement('li');
      item.textContent = `${member.nickname}${member.role === 'host' ? ' (Host)' : ''}${member.connected ? '' : ' · Reconnecting'}`;
      return item;
    }));
    const canAct = view.pending === null && view.connectionState === 'connected';
    leave.disabled = !canAct;
    leave.textContent = view.pending === 'leave' ? 'Leaving room…' : 'Leave room';
    const canEnd = view.selfRole === 'host' && canAct;
    end.hidden = view.selfRole !== 'host';
    end.disabled = !canEnd;
    end.textContent = view.pending === 'end' ? 'Ending room…' : 'End room';
    actionStatus.textContent = actionError ?? '';
    actionStatus.hidden = actionError === null;
  };

  update();
  return { update, dispose: () => panel.remove() };
}
