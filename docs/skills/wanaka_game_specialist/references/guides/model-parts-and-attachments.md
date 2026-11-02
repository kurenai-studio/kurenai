# Model parts and attachments

Use this guide when implementation depends on a GLB's internal hierarchy: selecting parts from a compound model, attaching one loaded model to another, or resolving model-specific LOD branches.

## Inspect the models

- Inspect only the complete `/tmp/game_assets/<assetId>.glb`, never a `.COPYING.*` file.
- Use Bash to extract the GLB JSON chunk into a temporary file, or adapt an available glTF parser, then query the relevant structure instead of copying the full dump into project source.
- From the host GLB, inspect node names and hierarchy, local transforms, `skins[].joints`, animation targets, and LOD branches. From the attached GLB, inspect its root pivot and any authored alignment node.
- A name such as `Wrist.R` is asset-defined. Treat a node as a bone only when it is a skin joint and the loaded Three object has `isBone === true`.
- GLTFLoader sanitizes runtime names with `THREE.PropertyBinding.sanitizeNodeName` and adds numeric suffixes for duplicates. Resolve the inspected raw name against the loaded hierarchy; do not assume the raw and runtime strings are identical.
- Names may be absent, opaque, or duplicated. Use hierarchy, type, and LOD membership to disambiguate them; do not guess from naming conventions or silently accept the first match.

The GLB is discovery evidence. Confirm the anchor by traversing the full model returned by `model3DLoader.load`, because the returned root may contain normalization and exclusive `THREE.LOD` wrappers. Authored `_LOD*` branches with a positive integer are those levels. Do not hide them by name or remove them from the returned tree. Instantiation shows only LOD0 until a perspective camera selects another level; `visible = false` on far levels fights that selection and can empty them.

## Select parts from a compound model

Load the complete model through the existing `model3DLoader` with its own `rotationDegrees` and with `scale` set from `recommendedScale`. After the load returns, remove independent unwanted subtrees from inside the returned semantic root. Keep the loader-created hierarchy intact; moving selected descendants to an unrelated group and copying scale alone can lose inherited rotation and intermediate transforms.

Wrap the filtered semantic root in a project-owned `THREE.Group`. By default, keep the calibrated size already applied by the loader. If the selected result needs a different final size, measure its filtered bounds and apply one additional uniform scale to the wrapper. Apply gameplay position and rotation only after filtering and measurement.

When unwanted subtrees are removed, `new THREE.Box3().setFromObject(filteredRoot, true)` measures the remaining hierarchy. If nodes must stay present with `visible = false`, compute bounds from visible meshes with `traverseVisible`; `Box3.setFromObject` includes invisible descendants. Use the filtered bounds for centering, camera framing, and collision. Preserve the source origin when gameplay data relies on model-local coordinates.

## Attach a model to an anchor

Load both models through the existing `model3DLoader` with the same owning scope. Keep each asset result's `rotationDegrees` and `recommendedScale` in its own load options, passing `recommendedScale` as `scale`.

Create a project-owned `THREE.Group` as the mount, add it to the resolved anchor, then add the attached model to the mount. Use `add`, not `attach`: the attachment needs an explicit parent-local pose, while `attach` preserves the old world pose and is not suitable for non-uniformly scaled ancestors. One `Object3D` has one parent, so separate LOD anchors need separate loaded attachment instances.

Store the asset-pair calibration on the mount:

- local position aligns the contact point;
- local rotation aligns the attached model's authored axes;
- uniform scale makes any final size correction without distorting the asset.

If the attached model has an authored socket, align that socket to the mount origin. Otherwise calibrate the local pose explicitly. The anchor already supplies the attachment frame; its position relative to the host's full bounding box is not needed. Use world-space bounds only to verify final size and intersections.

Check inherited scale after parenting. If the anchor chain is non-uniformly scaled or animates scale, avoid a guessed inverse-scale fix: preserve aspect with uniform host scaling or use a project-owned world-pose follower outside that scaled hierarchy.

## Fitted My Wana equipment

New My Wana exports contain appearance, clothing, bones and animations, not try-on weapons or props. `userData.wanaRecipe` describes appearance. Equipment is a separate immutable asset with its own configuration. Legacy exports may retain named `wana_equipment_<slot>` mounts; `createWanaLoadout(scope, host)` still adopts those. Use `wanaka-studio-engine/equipment` rather than guessing different bones. Read its generated declaration before implementing. `equip(slot, item)` creates standard modular props and `equip(slot, null)` removes one. Slots are right-hand, left-hand, back and waist. Rifle/blaster in the right hand reserve the left hand. Crates and campfires are world-only props.

For a raw generated prop, load the actual immutable catalog asset through the existing project model loader with the same owning scope, then call `prepareWanaEquipmentModel(model, item, 'raw-generated')` and pass the wrapper to `equip(slot, item, wrapper)`. This fits bounds once, establishes a normalized wrapper, and applies reviewed sockets. For a published Equipment GLB, load with `scale: 1` and zero `rotationDegrees`, then use `prepareWanaEquipmentModel(model, item, 'published')`: it converts meters to Wana bone centimeters while preserving the published grip instead of recentering or fitting again. Do not feed an already scaled/recentered published asset into this helper. Fit normalizes bounds, not semantic grip correctness. Preserve the user-reviewed position/rotation offsets. Never replace an unavailable generated asset with a procedural template. Equipment detaches supplied models; their loader keeps disposal ownership.

`createWanaEquipmentPose(host)` is an optional hold overlay: call `restore()` before the animation mixer, then `update()` afterward. Restore at teardown. Do not layer a second upper-body pose owner without choosing who is authoritative. Standard long guns expose `wana_secondary_grip` and firearms expose `wana_muzzle`; custom generated models require calibrated contact/muzzle nodes if gameplay depends on them. Do not parent one item to both hands.

For new equipment actions prefer `createWanaEquipmentActions(scope, host)` instead of the legacy hold overlay. Call `restore()` before the mixer and `update(deltaSeconds)` afterward. It keeps lower-body locomotion, uses pole-directed arm IK, aligns the long-gun stock and support hand, and layers aim, recoil and throwing. `aim(direction | null)` takes a world direction. `fire(onShot)` returns false when busy or unusable; spawn the game's projectile/effect from the callback's world-space event, not a guessed character-center offset. `throwItem('right-hand', onRelease)` emits exactly once at release, hides the mounted prop and supplies its actual world pose. Remove the inventory item and mount in that callback, then create the independent physics object. Switching mounts, cancellation and disposal suppress pending events. `reset()` is for preview replay, not automatic inventory refill. Check `state().issues` for unreachable grips; arbitrary generated meshes and extreme aim angles still need review. Generated firearms need muzzle calibration, long guns also need support and stock, and throwable props need release calibration. Wana has no individual finger bones.

See [wana-equipment-actions.ts](../../examples/wana-equipment-actions.ts) for composable game-owned shot/throw callbacks.

For clothing on this particular Wana skeleton, `wanaka-studio-engine/clothing` exports `applyWanaClothing(scope, host, recipe)`. It changes template details and isolated body clothing materials without rebuilding the face or skeleton. The scope releases generated details and restores borrowed clothing at teardown; never dispose shared baked geometries. This is not a general humanoid clothing/skinning importer. Keep inventory ownership, pickup, hotbar, cooldowns, projectiles, effects, persistence and multiplayer authority in ordinary game source. Use revision-checked source edits and ordinary project asset installation.

## LOD and attachment ownership

Inspect whether LODs share one anchor hierarchy or contain separate copies. A single attachment is sufficient for a shared anchor. For a small number of separate rigs, prefer one independently loaded attachment per LOD anchor: parent visibility then follows the active level without frame-sync code. Verify the anchors align across levels; if they do not, calibrate each mount separately. Do not hide inactive levels to simplify the tree.

A single world-space follower is useful when duplicate attachment instances are too costly or the host hierarchy has non-uniform scale. It must select the active LOD anchor, copy its world position and rotation after animation and before rendering, convert into the follower parent's local space, and preserve an intentional uniform scale. This is more timing-sensitive and does not correct misaligned LOD anchors by itself.

Attachment does not choose the host's animation. Inspect the available clips, explicitly select poses suited to the composed models when automatic matching is insufficient, and preserve alignment in the required states. One model can have only one authoritative parent; a second contact point needs a suitable authored pose or IK, not a second parent.

An attachment that shifts, duplicates, or disappears during animation or an LOD transition can have a mismatched anchor hierarchy, transform, or scope owner. Inspect the affected hierarchy in source and asset data. Missing or ambiguous anchors need a clear diagnostic rather than an invisible attachment.

If the requested host or attachment GLB cannot be used, report that failure instead of silently treating a procedural substitute or sibling object as a successful attachment.

See [model-attachment.ts](../../examples/model-attachment.ts) for the native Three attachment pattern.
