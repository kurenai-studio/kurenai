# Prepare a state with Game Test support

This is an optional technique for a test you have chosen to pursue. A support overlay can prepare prerequisites that are expensive to reach through normal play, but writing and maintaining it also takes time. When that effort outweighs the expected verification benefit and testing was not explicitly requested, delivery with the remaining uncertainty disclosed is a valid outcome.

For a chosen probe, preparation establishes the starting state; ordinary input and game logic still perform the movement, collision, navigation, or transition being investigated.

## Choose the boundary

- **Lap counting:** prepare valid progress just before a lap boundary, then exercise the real crossing or update logic.
- **Finish transition:** prepare the final lap, required checkpoints, and a coherent controller state just before the finish, then trigger the real transition.
- **Results display:** invoke the game's finish workflow with known race data, then inspect rankings, formatting, and controls.

Preparation establishes prerequisites. Production logic performs the behavior under test. Report which prerequisites were prepared and which behavior ran.

## Build the overlay

Paths in this guide are relative to the Game Agent's `game/` cwd. For a test that needs preparation, write `game_test_support/manifest.json` and `game_test_support/overrides/<target>` directly; Write creates their parent directories. Read the runtime target that owns the state, copy the complete file to the override path, add the preparation hook while keeping the target's original imports and structure, and compute the SHA-256 of the exact target bytes that were copied.

Write `game_test_support/manifest.json`:

```json
{
  "schemaVersion": 1,
  "overrides": [
    {
      "target": "play.ts",
      "source": "game_test_support/overrides/play.ts",
      "baseContentHash": "<sha256 of play.ts>"
    }
  ]
}
```

Paths are relative to `game/`. `baseContentHash` identifies the target bytes from which the support copy was made. Each target has at most one entry.

Start compares each `baseContentHash` with the current target before applying the copy at its target path in an isolated build tree. It removes `game_test_support/` from that tree and compiles the Play graph. Preview, publication, and export compile the ordinary targets.

## Write preparation hooks

Place the hook near the closure or controller that owns the required state. Register one project-specific object with `Reflect.set(globalThis, '<project hook>', hooks)` and clean it up with the owning scope. Registration is inert; the test script explicitly calls a method.

Use the game's controllers and reset operations so related state remains coherent. Return compact diagnostics that confirm the prepared prerequisite. The test script validates the hook, calls the preparation method, checks the prerequisite, exercises the target behavior, and observes the result in the same execution when timing matters. Disproportionate preparation effort is a reason to reconsider further verification, including handing off with the coverage gap disclosed.

## Align the support copy

Start reports every entry whose `baseContentHash` differs from its current target. Recreate each listed support copy from the current target, reapply the preparation hook, compute that target's SHA-256, and record it in the manifest. Changing only `baseContentHash` would allow an outdated support copy to replace newer source. The next Start validates the updated copy before compiling the test artifact.

## Example: a timed enemy wave

Copy the complete file containing the owning `activateGame` function, then add this hook after its controllers and reset operations exist. The names are illustrative project locals: `startRun()` resets a run and clears enemies, `state` owns its timer and spawn countdown, and `enemies` contains the real active flags. The normal update chooses and spawns the wave.

```ts
const testHooks = {
  prepareWave(elapsedSeconds: number) {
    startRun();
    state.elapsed = elapsedSeconds;
    state.nextSpawnIn = 0;
    return { elapsed: state.elapsed, active: enemies.filter(enemy => enemy.active).length };
  },
  readWave() {
    return { elapsed: state.elapsed, active: enemies.filter(enemy => enemy.active).length };
  },
};
Reflect.set(globalThis, 'gameTestSetup', testHooks);
scope.defer(() => {
  if (Reflect.get(globalThis, 'gameTestSetup') === testHooks) {
    Reflect.deleteProperty(globalThis, 'gameTestSetup');
  }
});
```

After Start returns a session, call the hook from `run_game_test`:

```js
const hooks = Reflect.get(globalThis, 'gameTestSetup');
if (typeof hooks?.prepareWave !== 'function' || typeof hooks?.readWave !== 'function') {
  throw new Error('Wave preparation hooks are missing; inspect the project source.');
}
const observations = [];
for (const [elapsed, expected] of [[19, 1], [21, 2]]) {
  const prepared = hooks.prepareWave(elapsed);
  if (prepared.active !== 0) throw new Error('Wave setup did not clear existing enemies.');
  const spawned = await t.waitUntil(() => hooks.readWave().active > 0, 30);
  if (!spawned) throw new Error('The real update did not spawn a wave.');
  const after = hooks.readWave();
  t.assertEqual(after.active, expected, 'Wave size matches the requested rule');
  observations.push({ prepared, after });
}
return observations;
```

This executes the production spawn rule at controlled times. Pool-capacity cases use coherent initial occupancy. A focused Node test is sufficient when only the pure rule matters.

## Example: reach the finish without replaying the course

Copy the complete file that owns the live player and level state, then add a hook that prepares a source-verified approach position. This example assumes `startLevel` resets the level and its traps, `character` is the live CharacterController, and `safeGoalApproach` is a project-authored position outside the finish trigger on supporting ground. `previousCenter`, `seedCamera`, and `reseedCamera` represent the game's movement history and camera reset.

```ts
const testHooks = {
  prepareBeforeGoal() {
    startLevel(0);
    if (!character) throw new Error('Player controller is not ready.');
    character.reset({
      position: safeGoalApproach,
      facing: 'preserve',
      velocity: 'clear',
      jump: 'reset',
      groundContact: 'clear',
    });
    previousCenter = safeGoalApproach;
    seedCamera(safeGoalApproach);
    reseedCamera = true;
    return { phase };
  },
  readFinish() {
    return { phase };
  },
};
Reflect.set(globalThis, 'gameTestSetup', testHooks);
scope.defer(() => {
  if (Reflect.get(globalThis, 'gameTestSetup') === testHooks) {
    Reflect.deleteProperty(globalThis, 'gameTestSetup');
  }
});
```

One hook object can hold the project's preparation methods. Checkpoints, keys, and other prerequisites belong in the same coherent preparation, immediately before the transition being tested.

For a source-verified approach where `w` moves toward the goal and the production transition sets `phase` to `cleared`, run:

```js
const hooks = Reflect.get(globalThis, 'gameTestSetup');
if (typeof hooks?.prepareBeforeGoal !== 'function' || typeof hooks?.readFinish !== 'function') {
  throw new Error('Finish preparation hooks are missing; inspect the project source.');
}
const prepared = hooks.prepareBeforeGoal();
if (prepared.phase !== 'playing') throw new Error('Finish setup is not in playing state.');
t.keyDown('w');
const completed = await t.waitUntil(() => hooks.readFinish().phase === 'cleared', 60);
t.keyUp('w');
if (!completed) throw new Error('The real finish transition was not observed.');
return { finish: hooks.readFinish(), state: await t.getState() };
```

This verifies the production transition through state observation. Request a screenshot when the question concerns the results layout. Keep preparation, action, and observation in one execution, and end the probe when prerequisite validation fails.
