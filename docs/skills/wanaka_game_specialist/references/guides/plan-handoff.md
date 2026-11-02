# Plan handoff

Use this when an approved plan is already in the project and the user asked you to build it.

## Files

- Read `game/plan.json` and `game/visual.ts` before changing the game. The Plan file contains the user's approved, visible direction and asset decisions; it does not define milestones or acceptance criteria.
- Read `game/NOTES.md` before continuing prior work. Create it when absent, and update it before finishing with decisions, files changed, checks actually performed, important unverified behavior, known issues, and concrete remaining work. Keep it concise and factual.

## Progress

- Before changing the game, turn the approved direction into a concise task list. Revise that list as the work changes and mark work completed only after it is finished.
- Build the real production Edit scene graph first (`game/visual.ts`, world/prop modules, and `game/scenes/main.ts`), then call `compile_game` once so the Studio Edit canvas renders the 3D scene early while you implement `game/play.ts` and HUD. Do not call `compile_game` on unconnected helper modules before `game/scenes/main.ts` imports them.
- Keep working toward the requested `/goal` outcome across turns. An unperformed optional runtime check does not by itself make an implemented outcome incomplete.

## Asset slots

Process each `game/plan.json` `assetSlots` row from the fields written there. Do not rebuild a query from its label, description, recommendation, genre, or other prose.

- When `selectedAssets` is non-empty, resolve every listed asset with `search_native_assets` passing `asset_id` and that row's `assetKind` as `asset_kind`. Do not perform a text search or replace a locked selection. A `multiple` row may require every selected asset.
- When `generationRequest` is present, use its exact query and the specified generation mode when present. Do not silently switch an explicit generation route. A `multiple` row may contain both locked assets and an additional generation request; honor both.
- When `searchDuringBuild` is `true`, call `search_native_assets` with that row's exact `query` and `assetKind`. For `single`, use one selected result. For `multiple`, select the distinct results the implementation actually needs rather than silently reducing the row to one asset.
- A row with none of `selectedAssets`, `generationRequest`, or `searchDuringBuild` is invalid. Report the missing decision instead of guessing an asset request.

## Temporary placeholders

Temporary basic geometry that stands in for unfinished presentation MUST have
an Object3D name beginning with `Placeholder`, for example
`Placeholder.TrackBarrier.01`. Record those names in `game/NOTES.md`. Remove or
replace every such object before claiming the work has no placeholders. An
intentional primitive that is part of the finished art direction should have a
semantic production name and must not use the `Placeholder` prefix. A box, a
rounded box, or a stack of slabs standing in for a house, shop, barn, warehouse,
or tower — including a street row, a skyline, or background buildings — is not
an intentional primitive.

For a placeholder that still appears, trace its recorded name to the source that creates it. Exact-name runtime queries can help distinguish a remaining object from a replacement; a bounded scene dump does not establish that all placeholders are absent.

## Delivery

Complete the approved player-facing behavior and deliver a useful iteration. Optional runtime verification does not add tasks to the approved plan. Record the checks actually performed and important remaining uncertainty in `game/NOTES.md`. When reporting observations, distinguish the source version and behavior actually observed from anything left unverified.
