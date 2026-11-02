# Toolbox integration

A Toolbox request is a bounded edit to this project. Read this guide for every Toolbox task,
including after a restored conversation or compaction, then follow the relevant Engine guide.
The message carries the selected preset's specific intent. Do not load unrelated preset families.

## Scope and targets

Read the latest source before editing. The final player request overrides preset defaults.
Resolve an explicitly named target first; confirm a conflict with a pinned selection. Otherwise use
the pinned selection, or the sole clearly suitable existing object. Resolve a bone or child mesh to
its owning character. An item reference is not a character reference. A deleted or ambiguous target
requires clarification, not substitution. Never silently apply to every character.

The source project in the request owns the task, including a queued or restored request. If it is
not the active project, stop and ask to return. Pinned code and source revisions are snapshots;
re-resolve stable authoring references, never retarget by array index or trust stale source.

Reuse controls, controllers, animation, mounts, events, UI and effect ownership. Refine an existing
same-purpose implementation instead of duplicating it. Preserve unrelated content and manual edits.
Repair directly blocking issues only; report other failures without rebuilding the game.

Missing required characters, weapons, models, clips or incompatible rigs require a concrete question.
Do not replace a character, invent an asset, or build a complete game to demonstrate a local edit.
The player's explicit request to create objects or a complete system takes precedence over this
default boundary. Missing combat, inventory or stats is not itself such a request.

When the relevant event exists, connect it. Without it, provide only the requested capability and
a minimal non-conflicting Play preview when possible. Do not add enemies, targets, arenas, permanent
debug panels, health/stamina, inventory, shops, progression or win/lose rules just for a demonstration.
Distinguish a visual preview, an interactive action, and integration into actual gameplay.

## Character actions and equipment

Use the real character and its compatible admitted animations or a small additive pose. Do not
attach another movement controller or compete with existing animation/input ownership. A project
with no character needs the player to add or select one; do not create a character from an action
preset alone. Preserve interruption, movement, turning, recovery, repeated activation and respawn when
present. Equipment fits use a neutral pose and retain intended world proportions; grips and mounts
must follow the moving character. No duplicate listeners or mounts after repeated use or undo.

## Interface

Use the existing UI look, screens and input owner. Read `ui.md`. Expose actual game state and working
actions, not fake health/ammo/settings. Use samples only for explicitly identified layout previews;
never mix sample values into gameplay. A selected panel scopes polish; otherwise inspect the existing
UI as a whole. Menus hand off camera, pointer lock, audio and controls cleanly. A multiplayer pause
menu must not pause the room simulation. Do not invent completion rules for open-ended games.

## Cinematics

Read the camera-sequence section of `camera.md`. Resolve existing actors, facing and landmarks;
do not create a boss, threat, arena or dialogue to fill a shot. Preserve the gameplay camera owner,
avoid geometry clipping and restore control after completion, interruption or skip.

## Procedural worlds and Seeds

Read `pcg.md`. Reuse suitable existing procedural content and preserve authored content and gameplay.
Do not replace the current world without an explicit request. Build and Play use the same generated
definition. Check the source includes the requested terrain, buildings and environmental elements; report
missing assets or failed generation instead of silently omitting them.

A Seed is an input, not a complete world share code: reproducibility also requires the same preset,
settings, rules and assets. Preserve numeric versus text Seed identity. A changed Seed request affects
only the pinned world/region/declaration. Resolve child declarations by authored stable ID, not array
position. For an inherited Seed, add an explicit Seed only to that child; leave the parent unchanged.
Check shared constants before changing a direct Seed and isolate the target when needed. Keep all
other definitions, settings, independent Seeds and stable IDs. Use normal revision-checked edits and
undo; do not bake generated objects. If the final player text names a different Seed from metadata,
resolve that explicit override or ask about the conflict rather than using the old Seed silently.

## VFX

Choose through the [VFX recipe index](vfx-examples-index.md); [vfx.md](vfx.md) covers shared setup.
Standalone explosions, areas and ambience can be previewed without a character. Host-surface effects
need the actual model, not a substitute sphere. A weapon can be an effect target without a character.
Follow real mounts, movement and contact positions. VFX never owns damage, collision, movement or room
truth. Trigger multiplayer cosmetics from existing committed presentation events and use an appropriate
deterministic Seed. Prepare resources before play, bound concurrency and translucent/light cost, and
own effect cleanup through scene and play lifetimes. No additional particle editor or gameplay system.

## Weather, seasons and time

Read the world-environment sections of `render-pipeline.md` and `pcg.md`, and use
`references/engine-api/world-environment.d.ts` for API authority. Resolve an existing world or an
explicitly targeted environment zone, not a character or weapon. Reuse the world-environment state
owner; if absent, add only its minimal integration. Preserve the authored visual style, geometry,
gameplay and unrelated environment axes. A weather preset preserves season and time; a season
preserves weather and time; a time preset preserves season and weather. Reuse hosted sky, fog,
lighting and precipitation rather than creating another renderer, sun controller or particle system.

Weather offers clear, overcast, fog, rain, storm, snow and dust. Storm uses supported rain, wind and
lightning flashes; do not add thunder audio or lightning-bolt models. Seasonal presentation depends
on compatible existing vegetation and materials. Do not replace terrain, trees or textures to fake
seasonal support. Report an unsupported response rather than claiming every imported model changes.
An isolated third-party runtime requires an explicit integration; changing its outer host is not proof
that the game's environment changed.

Loop requests add or refine the same-purpose cycle with one environment state owner, scoped update
and cleanup. Weather transitions smoothly between supported configured presets. Seasons repeat
spring, summer, autumn and winter without forcing weather changes. Time uses the world's continuous
day clock rather than a second clock or sun animation. Reuse existing timing; otherwise keep cycle
order, durations and transitions in one configurable source definition. A cycle does not add UI.

Switch-panel requests add or refine real in-game controls for the selected axis. Reuse a combined
environment panel when present. Read the actual current state and write the same state owner, with
no fake values or secondary state machine. Preserve unrelated axes and match the existing UI look.
If a cycle exists, manual selection updates its starting state so the next update cannot snap it
back; continue the cycle without creating a new one. Handle focus, pointer lock and gameplay input
handoff, and scope listeners and UI cleanup. No cycle is added by a panel request. Repeated switches
must preserve ownership, and a cycle must advance and repeat without accumulating state.

## Tune

Read `game-tuning.md` before discovery or adjustments. Discover real source-to-consumer bindings;
do not manufacture controls by refactoring gameplay. Adjustment details contain the original definition,
before value and requested value. Re-read `game/tuning.ts` and the current source; changed targets,
values or definitions require conflict reporting. Preserve unrelated gameplay and update only affected
guide entries. Never publish automatically.

## Completion

Inspect the exact Play trigger binding in source, compile, and preserve existing behavior. State what was implemented, what is connected to gameplay, and what remains unverified.
The player can try the delivered change and guide the next iteration. When useful,
give a concise way to reach the changed behavior, without claiming gameplay
acceptance that was not performed.
