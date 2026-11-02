# Good-game scaffold

Read this file for every original whole-game build. It defines the shared player-experience floor; selected genre guides add the Engine integration, state ownership, feedback, authoring guidance, and troubleshooting for the mechanics the game uses.

Project structure and shared runtime ownership stay in the Specialist contract. Generated Engine declarations own exact Wanaka names and signatures. Read a declaration or example only when the selected capability leaves an exact integration question unresolved.

## Define the promised loop

Before implementation, identify:

- the repeated player decision and its visible consequence;
- the smallest complete session or continuous loop;
- the selected genre guide(s) and how they compose;
- the minimum scene, HUD, audio, onboarding, and feedback needed to communicate the fantasy;
- the positive, negative, boundary, pause, and reset or continuation cases that apply.

Named modes, stage progressions, and match rules inside `genre_*.md` are fallback starting points for bare, underspecified prompts. When the user specifies a concrete loop or a cross-genre hybrid, shape the loop, world structure, progression, and ending rules around the user's request and borrow only the needed sub-mechanic contracts from each guide. Regardless of how mechanics are combined, every shared state channel, input consumer, camera pose, actor transform, settlement transaction, and save binding MUST keep a single authoritative owner.

A terminal game needs a reachable entry, active play, result, and restart. A sandbox, open-world, or persistent RPG experience needs an explicit enter, interact, and continue or save loop; it must not invent a win screen or run-reset wrapper merely to look complete.

A named mode is not implemented by changing only a label, timer, target, or result threshold. Its defining decision must affect authoritative state, produce distinct feedback, punish a relevant mistake, and provide recovery.

Once the loop, genre, and mode are chosen, call update_project_info with the listing title and short description. Complete the real Edit scene graph (`game/visual.ts`, scene/world modules, and `game/scenes/main.ts`) and call `compile_game` once so the Studio Edit canvas displays the 3D world early, before implementing `game/play.ts` and HUD.

## Treat phases as semantic roles

Terms such as `MENU` or entry, `ACTIVE`, `FINISHED`, paused, and fail result describe player-facing roles, not required enum literals or one mandatory state machine. Active means genre-owned play. Finished and fail result apply only to terminal sessions. Pause is a condition over the owning session. A continuous experience may remain active and settle through continue or save instead.

Use one typed owner for the session phase, result, gameplay clocks, and their transitions. Pause and restart or continuation use the same owners as normal play.

## Keep values and product layers project-specific

Genre guidance defines parameter families, units, invariants, authoring guidance, and likely causes for specific problems. It must not turn one project's tuning, coordinates, counts, prices, probabilities, timings, assets, layouts, or workarounds into defaults. Choose values for the current brief and scene, and say plainly when a value or behavior has not been checked.

Maps, difficulty paths, collection, social or cooperative play, durable progression, rotating challenges, and seasons are independent product layers. Add one only when the brief promises it. State what repeated play changes, what remains attempt- or session-local, and how the layer reconnects to the core decision.

## Make the game readable

The player can discover the primary action without source access, understand the objective and important resources, recognize accepted and rejected actions, read pressure and progress, and tell when control is paused or blocked. Camera, HUD, world cues, audio, and effects agree with authoritative state.

These are outcomes, not a required visual theme. Presentation should fit the game's tone, camera, audience, and platform instead of inheriting a fixed glass style, layout, color system, or compulsory `WIN` and `LOSE` treatment.

When the build includes UI, follow the design requirements in [Game UI](ui.md). Runtime inspection is not a prerequisite for ordinary builds or Toolbox UI polish. Keep only the screens and behaviors promised by this build.

## Complete and report honestly

Implement the smallest complete loop before multiplying content: entry, readable goals, the core action, feedback, session closure, and restart or continuation.

Use source inspection and compilation for ordinary completion checks. Do not describe gameplay or appearance as runtime-verified without observing it.

Report what was actually run and what remains unchecked. Old runs, source presence, or another project do not prove the current game, and results invalidated by a behavior change must not be reported as current.

After an original whole-game Build, read [game-tuning.md](game-tuning.md) and extract the small optional Toolbox Tune guide from implemented content. This handoff does not replace or delay the playable loop. Do not refactor gameplay to manufacture direct controls. A bounded follow-up edit refreshes only affected existing guide entries; it does not start a second discovery pass.
