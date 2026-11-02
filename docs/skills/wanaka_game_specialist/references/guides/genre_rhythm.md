# Genre: Rhythm

## 1. Freeze one route

| Route | Judgement model | Required outcome |
| --- | --- | --- |
| `highway-tap` | time × fixed perspective highway | notes visibly travel through depth into the judgement gate |
| `lane-based` | time × fixed lanes | keyboard and visible touch targets can both complete the same run |
| `falling-mania` | independent multi-lane input | chords resolve per lane and remain readable at higher density |
| `gesture-rhythm` | timed judgement + gesture mapping | gestures are optional; keyboard or touch still completes the run |

Free-position rhythm also needs spatial error and is outside this fixed-lane contract. For an original project, default to `highway-tap + authored chart + keyboard/touch + no-fail score run`. Derive lane count, theme, and difficulty from the brief.

Before implementation, state the route, lane count, song, inputs, chart source, difficulty count, fail rule, and visual theme. When unspecified, choose the smallest complete set consistent with the brief. Do not invent multiple songs or camera support unless the brief asks for it and the chart remains readable.

## 2. Rhythm flow inside the session

Keep arming and playing as rhythm-owned substates of active play under one session lifecycle:

1. **Entry:** show title, controls, difficulty/song information and a visible START action.
2. **Active / arming:** start exactly one song and freeze chart judgement until audio is genuinely playable.
3. **Active / playing:** drive spawn, motion, judgement, MISS, progress and beat response from one song clock.
4. **Pause:** pause audio and gameplay together without drift or batched MISS events.
5. **Result:** after committing one result, show score, combo, accuracy, judgement counts, rank, Full Combo and Replay.
6. **Replay:** dispose the run child scope, then reinitialize rhythm-owned audio, chart, ledger, HUD, input edges, notes and transient effects on a new one.

Default to a no-fail score run: MISS never ends the song early, and results appear after the song and chart finish. Add hard failure only when the brief explicitly requests it; show the reason and provide a clean restart.

## 3. Genre floor

A complete game needs a real song, a complete authored chart, readable lanes and judgement line, distinct hit/MISS feedback, the difficulty/density profiles promised by the brief, and a purposeful 3D scene. When an alternate profile is promised, its note structure must differ visibly and remain readable; a renamed multiplier is insufficient. A mechanics demo, metronome, random note stream, or decorative scene without a complete run is not done.

Use audio catalog search first. If no catalog result fits and audio generation is available, use it. Either successful path installs the audio file under `assets/` and returns its `#project/assets/...` path. Import `AudioSession` from `wanaka-studio-engine/audio`, import the installed audio URL from `'#project/assets/...'`, create one session with `AudioSession.create`, and pass that imported URL to `load`. See [audio-session.ts](../../examples/audio-session.ts). A file merely present in an asset directory without a `#project/assets/...` source import is not part of Preview or Export. If sourcing fails, report audio as pending instead of retrying indefinitely or fabricating a URL.

There is no dependable runtime FFT chart generator. Use an authored chart or an explicitly offline-precomputed result; never present fixed-interval random generation as music-driven gameplay.

Difficulty should change density, alternation, chords, holds, and readable lead time—not clock drift, random note loss, or hidden window shrinkage.

## 4. Input and result behavior

- Use press edges from the shared input contract in [input-handling.md](./input-handling.md); held state must not repeatedly consume notes.
- Align touch targets with visible lanes and route every input method through the same judgement model.
- Resolve simultaneous multi-lane input independently so valid chords are not lost.
- Map gestures to a finite action set; gesture failure must retain a complete keyboard or touch fallback.
- Do not judge notes or add score during entry, pause, or result states.
- Repeated START, pause, resume, replay, or result actions must not create parallel audio, listeners, or result submissions.
- Process the legal chart tail before locking the ledger and committing the result.

Ranking must distinguish all-best, no-MISS medium accuracy, widest legal hits, mixed no-MISS, and all-MISS. Display Full Combo separately from rank.

## 5. HUD and 3D presentation

During the `playing` substate, show at least score, combo, accuracy, latest judgement, and song progress. Lane flashes, note removal, lightweight VFX, and SFX may reinforce hits but must not obscure incoming notes.

Establish readable lanes, judgement line, note materials, and first-screen START before adding catalog scenery, lighting, background depth, or beat response. Use one camera owner and follow [camera.md](./camera.md); keep camera shake limited and restore it.

This fixed-lane route does not need physics for note judgement. If a selected mode adds physical stage objects, apply [physics.md](./physics.md) for their bodies and queries. Derive note pose from song time, not collision. Derive the theme from the brief; a black background, a few colored boxes, or sparse placeholder geometry is not a finished scene.

## Troubleshooting

- START appearing responsive while audio stays silent can come from the audio-unlock path.
- Notes drifting against audio or jumping after pause can come from multiple time bases, incorrect resume offsets, or trajectory sampling. Drift that grows with song position differs from a constant offset.
- Incorrect early/late/MISS outcomes or dropped chords point to judgement windows and per-note input consumption.
- Difficulty changes or replay retaining notes, combo, or results point to chart selection and per-run reset ownership.
- Source, object existence, and coordinate logs do not establish observed audiovisual synchronization. Report the limit of observations actually available.

## Implementation

### Genre-specific owners

- The chart owner normalizes authored chart data into seconds and stable note IDs.
- Rhythm state owns the song clock, spawn cursor, judgement ledger, score/result projection, and replay reset.
- The note-view owner manages bounded native Mesh/InstancedMesh or object-pool presentation.
- The HUD projects score/result state and publishes start, pause, and replay intent.

All runtime hooks, DOM, audio voices, geometry/material resources, and note pools belong to the Play `LifetimeScope`. Replay resets state and visual leases; it must not attach a second input, audio, UI, or scheduler stack.

### Use one audio clock

Create one `AudioSession` on the Play `LifetimeScope`. `AudioVoice` exposes `pause` / `resume` / `seek` / `ended` / `paused`, but no Engine playback-position getter.

Await `load` during `activateGame`, then on START await `unlock` and `play` that loaded URL once. Build the chart clock from the native Web Audio context on the returned voice (`voice.audio.context.currentTime`), plus a project-owned accumulated offset:

```text
songTimeSec = accumulatedOffsetSec + (audioContextNowSec - segmentStartedAtSec)
```

On pause, snapshot that value once and call `AudioVoice.pause`. On resume, call `AudioVoice.resume` and start a new context-time segment from the accumulated offset. On seek/replay, update the project clock and call `AudioVoice.seek` in one transaction. Never read private Three fields or integrate scheduler deltas as an independent song clock.

If the pinned Three types or selected audio route cannot expose a public context time with sufficient accuracy, record an audio-position API gap and do not claim tight synchronization. Report a scheduler-only approximation as such. When investigating drift, offsets at separated song positions can distinguish a growing clock error from a constant calibration offset.

Keep chart time, travel time, chart-tail grace, global offset, calibration, judgement windows, and MISS delay in seconds. Convert an imported millisecond chart exactly once at normalization. Pause audio and judgement together; after resume, use the reconstructed audio clock rather than catching up paused scheduler time.

### Chart, spawn, and native motion

Normalize each note to stable ID, lane, `hitTimeSec`, kind, and optional `endTimeSec`; sort by `hitTimeSec` then ID. Advance the spawn cursor when the audio clock reaches the note's authored lead boundary.

Derive every visible note pose directly from current song time and the selected route mapping. Do not integrate note distance frame by frame, and never use world position as judgement truth. A dropped frame must place a note at its correct time-derived pose on the next update.

Use ordinary Three objects for low counts. For dense charts, use a bounded pool or `THREE.InstancedMesh`; keep `noteId → visual lease` as transient projection data. Release a visual only after its logical note has settled or left the presentation window. Reclaiming a Mesh or instance slot never deletes a pending judgement fact.

### Input and judgement order

Latch keyboard, pointer/touch, and gamepad frame edges from `input.frame` into pending per-lane actions once, then consume those actions at the next `fixedInput` boundary. Use browser key codes and edge methods from the current declarations; held state must not repeat taps, and multiple fixed steps in one frame must not repeat the same edge.

For each fixed step:

1. gate phase, pause, audio readiness, and result lock;
2. snapshot the authoritative audio time;
3. apply all simultaneous lane input independently;
4. select the nearest legal unsettled note per lane with stable ID tie-break;
5. settle accepted inputs once;
6. mark notes beyond the widest legal window as MISS;
7. update the one ledger and terminal condition;
8. project visuals, HUD, audio feedback, and effects from settled identities.

Hold support requires head, sustain, tail, and early-release outcomes on the same ledger. Do not advertise holds when any of those paths is missing.

### Ledger, result, and replay

Each note has exactly one terminal outcome. Score, combo, accuracy, rank, Full Combo, HUD, SFX/VFX, and final result derive from the ledger rather than separate mutable counters. Process the legal chart tail before locking the ledger and committing one result.

Replay stops the prior voice, resets the audio clock, chart cursor, input edges, note records, ledger, result, HUD state, and transient visual/effect leases, then returns to the formal entry flow. Pause/resume/replay actions carry stable identities so repeated DOM or key edges cannot create parallel voices or duplicate results.
