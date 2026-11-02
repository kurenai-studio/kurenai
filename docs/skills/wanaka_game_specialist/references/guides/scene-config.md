# Scene composition

A Wanaka scene is an ordinary TypeScript factory registered in the static scene catalog. Scene factories MUST remain safe to load in Edit and MUST NOT statically import Play-only Engine API sessions. Read [scene.d.ts](../engine-api/scene.d.ts) when changing the `SceneHost` or catalog contract.

## Catalog and scene switching

`scenes.ts` owns the complete static catalog. A new scene requires both a factory module and one catalog loader. A rename or removal MUST update every importing source site in the same change.

`sceneHost.open(id)` prepares a catalog scene in a new `LifetimeScope` and commits it as the sole view. Loader, construction, view, or activation failure leaves the previous scene intact and disposes only the failed replacement. A successful `open` disposes the replaced scene scope after commit. `push` retains the current scene for `pop`; `pop` disposes the top scene and restores the previous view.

Scene-specific gameplay activation may branch on the typed `SceneContextForCatalog` union. Each registered `SceneFactory` is its scene's presentation composition root; `scenes/main.ts` is only the starter scene. A factory creates presentation that must exist whenever the scene is open in Edit or Play, while runtime-only behavior remains in Play activation.

The SceneFactory third parameter and `SceneContext.services` expose the same session services. Scene-owned instances use the scene scope; Play-created objects use their run or entity scope and may be built directly or through ordinary object modules. Use `resources` only for values created by the scene that Play needs to consume.

When save/load is selected, create one `PersistenceSession` with `PersistenceSession.create(context.session.scope, { ...options, identity: context.session.identity })` and keep it on the enclosing runtime session scope, not `context.scope`. Prefer [persistence.ts](../../examples/persistence.ts) `attachScorePersistence` — it returns the existing session when `activateGame` runs more than once (multiplayer lobby then room). A second `create()` throws. Scene replacement disposes scene-local projections; durable profile records survive until Stop disposes the persistence owner. NEVER persist Three objects, controller handles, physics bodies, or DOM nodes.

## Camera and presentation

The managed scene SHOULD expose the camera used by the project's view factory. Engine hosts create the `RenderView` from the native scene and camera, while `RenderSession` owns resize, frame advancement, submission, and capture.

Camera strategy and multi-viewport composition live in [camera.md](./camera.md). Ordinary lighting and environment remain direct pinned Three APIs; the host supplies only the shared missing-environment fallback described in the Visual Style section of [render-pipeline.md](./render-pipeline.md#visual-style), which also owns render pipeline ownership.

The project MUST NOT create another renderer or frame loop inside a scene factory.

## Switching invariants

The switching path must open the target scene, leave the previous scene intact on a failed replacement, and dispose the old scene scope on a successful replacement. A blank replacement or surviving old scene points to activation ordering and scope ownership; trace that transition in source.
