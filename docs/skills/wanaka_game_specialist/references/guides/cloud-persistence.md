# Cloud persistence

Read `references/engine-api/game.d.ts` and `references/engine-api/cloud-persistence.d.ts` before implementing this boundary. The declarations are API authority; this guide owns composition and player experience.

## Choose once

Set the Game's persistence mode when authoring it:

- `none`: no server save. This is the only mode for browser-authoritative games. Do not render cloud-save controls.
- `room`: one server-authoritative snapshot for the Room world. It may include every Player's Room-scoped state.
- `player`: one server-authoritative save for each authenticated Player, reusable across Rooms of the same Game.

`room` and `player` require `multiplayer.authority: 'server'`. Put the declaration in `defineGame` and lazy-load the Authority module:

```ts
persistence: { mode: 'room', authority: () => import('./persistence.js') },
```

Do not offer a mode picker after publication. Do not combine the modes in the first release.

Room entry is explicit on the authored create page. Read `view.persistenceMode` and render:

- `none`: **Create Room**, with no `saveSelection`.
- `room`: **Create New Game** with `saveSelection: 'new'`, and **Load Saved Game** with `saveSelection: 'load'`.
- `player`: **Create New Game** with `saveSelection: 'new'`, and **Load Save** with `saveSelection: 'load'`.

Both actions keep nickname, region, and capacity on the same page. The Player Shell validates the
request and owns the authenticated, current-Game save list opened by Load. Do not add a save id,
revision, Player id, or Room code to the authored Create payload.

## Keep authority and Play separate

The Authority module exports `mode`, `restore`, and `capture`:

- Room: `restore(snapshot)` and `capture()` serialize the complete world state.
- Player: `restore(playerHandle, snapshot)` and `capture(playerHandle)` serialize only that handle's state. The host supplies this opaque trusted handle; game UI never supplies or chooses a Player ID.
- `snapshot === null` means first visit. Initialize defaults and complete restore normally. It is not an error and does not create a revision.
- Decode into a versioned game-owned envelope, validate it, and replace state only after validation succeeds. Throw on malformed or unsupported data; never silently initialize over a failed restore.
- Return a fresh `Uint8Array` from capture. Keep DOM, input, cameras, credentials, URLs, transport, and browser storage out of the Authority graph.

The runtime owns lease, revision, retry, and commit identity. Game code never chooses a revision, idempotency key, object key, Room identity, or Player identity. It never calls Core API or storage directly.

## Gate startup and render receipts

In Play, use `platform.cloudPersistence` from `RoomViewPlatformBridge`:

1. Subscribe and immediately show `Loading save...` while `loadState === 'loading'`.
2. Keep Room gameplay gated while restore is `loading` or `error`. In player mode, gate only the current Player's save-dependent actions. Solo Preview reports `disabled`: allow local gameplay, hide the loading gate and Save, and make no cloud-persistence claim.
3. On `loadState === 'error'`, keep the gate closed, show a failure with Retry, and call `retryLoad()` from that button. Do not initialize a fresh save.
4. Show Save only when load is ready. Room mode normally shows it only to the current management Host; player mode shows it to the current Player.
5. Call `requestSave()` with no payload or identity. Disable Save while `saveState === 'saving'` so repeated clicks do not create concurrent submissions.
6. Show `Saved` only after `saveState === 'saved'`; `revision` and `savedAt` then describe the committed receipt. On `error`, show a retryable failure while retaining the last committed revision.

The client status is metadata only: mode, target, load/save states, committed revision/time, and a machine error code. It never contains saved bytes or credentials.

Use [persistence.ts](../../examples/persistence.ts) for compile-checked Room and Player Authority composition plus a UI-state adapter. The standard scaffold generates `persistence.ts`, `persistence-ui.ts`, and the `defineGame` wiring when a persistent mode is selected. Existing projects retain their authored UI source when recompiled; update an older loading gate to handle `disabled` explicitly if it blocks Solo gameplay.

## Troubleshooting

- Gameplay starting before restore completes points to the loading gate; unexpected
  first-visit state points to initialization and empty-save handling.
- A Save label without restored progress can reflect local presentation without a
  committed public `Saved` status, or an incorrect restore path.
- Duplicate saves or an inert Retry control point to in-flight guards and UI command
  wiring.

Preview owns an isolated short-lived save namespace; its result does not prove a
published save. Do not inspect an adapter, database, object storage, payload bytes,
or service receipt.

`PersistenceSession` and `IndexedDbSaveStorage` are browser-local facilities. If they are used for preferences or an explicitly verified cache, label that state non-authoritative and never restore it into Room or Player cloud state.
