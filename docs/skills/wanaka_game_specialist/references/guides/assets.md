# Scene assets

## Project resources and game assets

The project-level `resources/` directory holds reference files, original uploads, and candidate assets. From the game working directory, browse them at `../resources/`. When using an uploaded file in the game, adopt it yourself as part of implementation; do not ask the user to import or copy it first. Choose the files that suit the game, then call `import_project_resource` with the project-relative `resources/...` path before using one in game source. The tool copies the selected file and its local dependencies into `game/assets/` and returns the `#project/assets/...` import specifier. Choose an optional `targetPath` such as `game/assets/vehicles/tractor.glb` to organize and name the game entry yourself. Package dependencies retain their relative paths, so leave enough directory depth for parent-relative references. An explicit target reuses identical files there and rejects different existing content; choose another target or deliberately edit the game copy for a replacement. If you omit the target, standalone files land directly in `game/assets/`; linked packages receive an independent directory preserving their internal relative paths. The upload folder hierarchy is not mirrored. Identical game content can be reused; different content receives a new name without overwriting existing game files. Use the returned path rather than deriving it from the original upload path. Organize game copies as needed and update source references when moving them.

The two copies are independent. Editing or deleting an original reference does not update the game copy, and editing the game copy does not update the reference. Existing game assets need no reference copy or migration. Keep temporarily unused game assets unless cleanup is requested; publication selects the game's required dependency closure. Catalog installation and generated game assets can enter `game/assets/` directly.

## Choosing a polish approach

Choose by what the object represents and how its geometry was authored:

- Keep layout-shaped geometry such as roads, floors, partition walls, steps, and railings. A building volume is not layout shape. Choose a surface appearance that fits the requested style. Their dimensions and paths often define the level; replacing them with fixed GLBs can disrupt that layout.
- Replace rough assemblies representing complex objects, such as a car built from boxes, with suitable catalog GLBs. Textures cannot supply missing body shape or structural detail. One complete model can replace the whole assembly.
- Keep deliberately simple geometry when it already suits the intended style. A house, shop, barn, warehouse, or tower is not that case. Not every object needs a texture or a replacement.

Use the existing code and requested result to choose an initial approach. Keep the scene's style consistent, and adjust the approach with user feedback.

## Surface appearance and mapping

- Choose image textures, procedural shading, or simple color by the intended style and viewing distance. For an image-based look, inspect the source maps: what they depict, their coverage state, directional structure, and distinctive features matter more than a material label or catalog slot.
- For tiled or patterned detail, establish the repeat footprint in world units from source physical dimensions or a recognizable size reference. Pixel resolution and aspect ratio alone do not establish physical size. Account for mesh transforms, each visible face, and whether authored UVs already carry scale and orientation.
- Try a representative patch under the intended lighting and camera before extending it over the scene. Check small and large spans, differently oriented faces, and close, normal-play, and distant views for stretching, seams, or conspicuous recurring motifs.
- For unwanted repetition, separate repeating detail from broad variation and localized features while preserving intentional structural patterns. Change the source look, mapping, geometry, or placement where a motif becomes mechanical; choose variation techniques within the game's texture, shader, and draw-call budget.

## Default scene props

A discrete scene object the brief names without describing — a tree, a house, a car, a crate — has a published catalog model behind it. Load that model. A box, a rounded box, a cylinder, a cone, or a sphere standing in for such an object is an unfinished scene, not a style choice. Roads, floors, steps, posts, coins, and projectiles may stay project primitives. Choose their surface appearance using the mapping guidance above.

When the brief does not name an appearance for one of these subjects, call `resolve_default_prop` with the fixed x, y, z placement, import each returned `assetPath` with `import propUrl from '#project/assets/...'`, and pass `{ assetUrl: propUrl, rotationDegrees, scale }` to `model3DLoader.load`. Each resolved placement includes `assetPath`, `rotationDegrees`, `scale`, `rawBboxCm`, `sourceDimensionsMeters`, and a `model` object with the same metadata shape as an ordinary model result. If the scene needs a different size, adjust only the loader's uniform `scale` using the returned `sourceDimensionsMeters` / `rawBboxCm` and the intended target size. Do not call `assetId2Url`, do not import a default-props slot module, do not call `defaultProp` or `defaultPropVariant`, and do not resolve a slot at runtime. For a runtime spawner, resolve one fixed look first and reuse that look for every instance.

| Subject | slot |
| --- | --- |
| tree | `tree` |
| bush | `bush` |
| flower | `flower` |
| grass | `grass` |
| rock | `rock` |
| animal | `animal` |
| creature | `creature` |
| crop | `crop` |
| house | `house` |
| shop | `shop` |
| barn | `barn` |
| warehouse | `warehouse` |
| tower | `tower` |
| arch | `arch` |
| grandstand | `grandstand` |
| windmill | `windmill` |
| car | `car` |
| truck | `truck` |
| race car | `race-car` |
| motorcycle | `motorcycle` |
| bicycle | `bicycle` |
| boat | `boat` |
| aircraft | `aircraft` |
| spaceship | `spaceship` |
| streetlight | `streetlight` |
| bench | `bench` |
| bin | `bin` |
| hydrant | `hydrant` |
| mailbox | `mailbox` |
| traffic light | `traffic-light` |
| barrier | `barrier` |
| fence | `fence` |
| cone | `cone` |
| billboard | `billboard` |
| sign | `sign` |
| table | `table` |
| desk | `desk` |
| chair | `chair` |
| sofa | `sofa` |
| bed | `bed` |
| shelf | `shelf` |
| cabinet | `cabinet` |
| lamp | `lamp` |
| rug | `rug` |
| barrel | `barrel` |
| crate | `crate` |
| pallet | `pallet` |
| chest | `chest` |
| coin | `coin` |
| key | `key` |
| health pack | `health-pack` |
| ammo | `ammo` |
| gun | `gun` |
| melee | `melee` |
| ball | `ball` |
| goal | `goal` |
| flag | `flag` |
| target | `target` |
| shipping container | `shipping-container` |
| door | `door` |
| window | `window` |
| wall dressing | `wall` |
| stairs | `stairs` |
| bridge | `bridge` |
| ladder | `ladder` |

Each name above is a slot accepted by `resolve_default_prop`, not a module to import into the game. There is no `default-props` directory to find, so searching the filesystem for one turns up nothing.

The resolver chooses a look from the fixed placement, so two copies of the same subject standing apart can differ. The game source stores the chosen asset and complete look. Do not reach into `variants` to pick a look. A position that does not exist until the game runs has no coordinate to resolve: resolve one or more fixed looks during authoring, then store and reuse those literals.

Do not import a default-props slot module into the game. The resolver installs a fixed look under `assets/` for authoring, and the file should import that `#project/assets/...` path and pass it with `rotationDegrees` and `scale` to `model3DLoader.load`.

Use `car` for road cars, `race-car` for racing vehicles, and `truck` for trucks. Search the asset catalog when the brief asks for a go-kart.

These are placed objects, not level shape. Roads, floors, ground, ramps, and the boxes that carry colliders stay geometry with textures; a wall or door prop dresses a layout that already exists. A stairs prop is one placed flight; steps that set the path stay geometry. A house, shop, barn, warehouse, or tower is one placed object: do not cut rooms out of it or rebuild it from slabs. A street row, a skyline, or background buildings are those same objects when the brief only says buildings or city blocks. Place each one as its own slot instance at the look's scale. Vary the row by where each one stands and by which of those slots the subject is. Do not author a box, a rounded box, or a stack of slabs as the building, and do not stretch one model to a block's width and height. Gaps and the model's own height are the skyline. The sign slot has baked lettering on its look; search when the brief needs different words. The chest slot's model may carry named clips; read them from the loaded model before driving a lid animation.

Three cases fall outside this set. When the user names an appearance, search or generate that appearance instead. When the subject has no row above — a wagon, a shopping cart — call `search_native_assets` for it. When the object is purely decorative and no catalog result fits, leave it out rather than substituting a box.

See [default-props.ts](../../examples/scenes/default-props.ts) for placing a slot through one loader.

## Default surfaces

Level shape — ground, roads, floors, ramps, partition faces, and roofs that are not the roof of a whole building — stays project geometry. A building volume, including the roof on that volume, is a placed prop from the house, shop, barn, warehouse, or tower slot. A grandstand roof or a platform canopy stays this geometry. When an image-based surface suits the scene and the brief leaves its appearance unspecified, the default catalog provides a candidate look. Evaluate it with the same content, scale, and repetition checks as any other source.

For a default catalog surface, call `resolve_default_surface` with the fixed x, y, z placement, import each returned `mapPaths` / `maps` entry (`baseColor`, `normal`, `roughness`, and optional `metalness`) with `import mapUrl from '#project/assets/...'`, and pass `{ tileSizeUnits, maps: { baseColor, normal, roughness } }` into `applySurfaceMaterial`. The structured `assetId`, `tileSizeUnits`, and `mapPaths` / `maps` fields define that resolved look, not its suitability for every surface. Do not call `assetId2Url`, do not import a default-surface slot module, do not call `defaultSurface` or `applyDefaultSurface`, and let `applySurfaceMaterial` own its texture wrapping and repeat.

Keep overlapping ground, road, plaza, ramp, and wall decal faces on separate planes to avoid coplanar z-fighting (`Coplanar surface overlap detected` in Game Test `runtimeErrors`). A centered `BoxGeometry` has its top face at `y + height / 2`; when a base layer's top face sits at `y = 0` (`position.y = -height / 2`), raise any overlapping layer above it so its top face is at least `0.02` units higher, and do not stack surfaces with the same top `y`. Same-plane regions may meet cleanly at an edge or corner, but must not overlap in area.

| Surface | slot |
| --- | --- |
| grass, lawn, meadow | `surface-grass` |
| dirt, earth, bare track | `surface-dirt` |
| sand, beach, dune | `surface-sand` |
| snow | `surface-snow` |
| ice, frozen ground | `surface-ice` |
| woodland floor, leaf litter | `surface-forest` |
| rock, stone ground, cliff face | `surface-rock` |
| road, car park, tarmac | `surface-asphalt` |
| concrete slab, hard standing | `surface-concrete` |
| cobbled street, paved square | `surface-cobble` |
| brick wall | `surface-brick` |
| wooden wall, plank siding, fence | `surface-wood` |
| interior floorboards | `surface-wood-floor` |
| metal panel, plate, industrial surface | `surface-metal` |
| ceramic tiling, wet room | `surface-tile` |
| carpet | `surface-carpet` |
| roof plane | `surface-roof` |
| rendered or painted wall | `surface-plaster` |
| papered interior wall | `surface-wallpaper` |
| banner, awning, drape | `surface-fabric` |

Each name above is a slot accepted by `resolve_default_surface`, not a module to import into the game. There is no `default-surface` slot directory to find, so searching the filesystem for one turns up nothing.

The mesh's authored dimensions and colliders stay yours. `applySurfaceMaterial` clones the geometry per mesh and scales its existing UVs; it uses one U/V multiplier pair, not a separate physical mapping for every face of a complete box. Use it on individual slabs or wall faces whose UV layout matches that pair. Keep already scaled or unwrapped UVs on their own material path, and do not apply the helper to merged distant pieces with independent `0..1` UVs. Read [default-surface.d.ts](../engine-api/default-surface.d.ts) for the mapping contract. Textures and the material belong to the `scope` you pass, so disposing that scope releases them.

`resolve_default_surface` chooses the look from the fixed authoring placement, so two stretches of the same slot standing apart can differ. Copy each resolver result into the project source. Do not reach into `variants` to pick a look, and do not scatter distinct slots to fake variety.

Do not import a default-surface slot module into the game. A slot module follows the live list, so the project would change when that list changes, and it stages every map of every look it carries.

See [default-surface.ts](../../examples/scenes/default-surface.ts) for pinning three different materials onto a layout.

## Referencing an asset

Catalog search (`search_native_assets`), default-kit resolvers (`resolve_default_prop`, `resolve_default_surface`), resource adoption (`import_project_resource`), and asset generation/preparation (`generate_game_asset`, `prepare_character`, `add_character_animations`) install files under `assets/` as ProjectFiles and return their paths (`projectPath`, `assetPath`, `mapPaths`, or `projectFiles`). Import every installed file with `import assetUrl from '#project/assets/...'` and pass that imported URL to the asset's loader. Do not call `assetId2Url` on an installed ProjectFile.

When asked which assets a project contains, enumerate `assets/**` first. These are the installed game files, including files not yet referenced by source. Reference candidates remain separate under `../resources/`. Read file provenance when needed, then inspect source imports to identify which files the game actually uses. Do not claim a source reference without an exact import or runtime reference.

Before searching the catalog or generating a new asset, inspect `assets/**` and current source references. Reuse matching installed files or existing asset references. Paid 3D/audio generation, Create / Generate account-level images and models, and external import always land in the user's personal library. A project file tree may omit an asset generated or imported after the user stopped the turn. Before saying a paid generate, Create / Generate, or import created nothing, or generating another copy, call `search_native_assets` with `scope: "mine"` and the original description. If it hits, use the installed `#project/assets/...` path returned by that call. If it returns `not_found`, the asset can still be in My assets while ingest or library indexing is running; tell the user to open My assets and do not generate another copy. A file under `assets/` becomes a runtime asset when source imports `#project/assets/...`. Do not invent IDs or use download URLs as durable references.

Use `model3DLoader` for GLBs, a native Three texture loader for image textures, and one Play-only `AudioSession` from `wanaka-studio-engine/audio` for sound. Create that session once on the Play scope with `AudioSession.create` and `load` every clip on it. See [audio-session.ts](../../examples/audio-session.ts). `play` starts loading a clip when no earlier `load` exists, so direct playback is valid but the first sound may be delayed while the clip loads and decodes. Await `load` during `activateGame` when playback must be ready on the first gesture; do not await a decorative cue before the first frame. From a user gesture call `unlock` then `play`. A short cue MAY use an oscillator. Do not encode audio bytes in project source. Do not construct a separate audio source.

### Audio loudness and processing

Selected catalog audio, generated audio, and imported resources live on disk under `assets/`. Measure real levels with `ffmpeg` / `ffprobe` in Bash before choosing mixer gains or editing clips; do not guess `volume` values across tracks:

- **Long tracks (`bgm`, `voice`, `ambience` >= 1s):** measure EBU R128 integrated loudness (`input_i` LUFS) and true peak (`input_tp` dBTP) with `ffmpeg -hide_banner -nostdin -i <file> -vn -af loudnorm=print_format=json -f null -`.
- **Short one-shot `sfx` (< 1s):** EBU R128 gating under-reads or returns `-inf` on sub-second transients; measure `max_volume` and `mean_volume` with `ffmpeg -hide_banner -nostdin -i <file> -vn -af volumedetect -f null -`.
- **Relative mix targets:** keep `voice` clearest in the foreground (`~ -16 LUFS`, true peak `<= -1.5 dBTP`), primary `sfx` punchy (`max_volume` around `-6` to `-3 dBFS`, `mean_volume` around `-18` to `-14 dBFS`; lower rapid-fire or overlapping cues by `3–6 dB` to prevent stacking clipping), `bgm` behind gameplay (`~ -22` to `-18 LUFS`, `6–8 dB` below voice/lead SFX), and `ambience` furthest back (`~ -30` to `-24 LUFS`; never normalize quiet room tone or wind `<= -40 LUFS` up to a foreground target).
- **Gain vs. file edits:** for pure loudness balancing or skipping leading silence (`silencedetect`), apply the linear gain `10 ** (deltaDb / 20)` through `audio.setChannelVolume(channel, volume)` or `audio.play(url, { channel, volume, offsetSeconds })` without re-encoding MP3s. When a clip needs trimming, silence stripping (`silenceremove`), fades (`afade`), or two-pass `loudnorm`, write the processed file under `assets/` and import `#project/assets/...`.
- **Timeline, envelope, and beat/spectrum analysis:** when inspecting per-second RMS envelopes, section transitions, frequency bands, or BPM/onsets, decode once to raw float32 PCM (`ffmpeg -v error -i <file> -ac 1 -ar 22050 -f f32le -`) and process in `python3` with `numpy.frombuffer(raw, dtype=np.float32)` (`np.fft.rfft`, vectorized window RMS, and autocorrelation) in a single script instead of decoding the file repeatedly or parsing `ametadata=print` lines with `awk`.

### Image cutout and texture processing

For semantic background removal (cutouts where the subject shares colors with the background or casts soft shadows), run `rembg <input> <output.png> --crop` in Bash (backed by local ONNX `u2netp` + edge decontamination) instead of writing heuristic color/flood-fill loops. Use `python3` with `PIL.Image` (`Pillow`) and `numpy` for cropping, resizing, sprite-sheet slicing, channel edits, or procedural textures, then save the result under `assets/` and import `#project/assets/...`.

When a scene needs more than one catalog asset, name the slots you will place this turn, then call `search_native_assets` once with `items`. Every text-search item specifies `asset_kind`: `model`, `material`, `environment`, `image`, `audio`, `font`, or `icon`. A locked Plan asset uses `asset_id` instead. Do not search an asset you will not place. For a selected result, use `kind` as the discriminator and follow its nested kind metadata and `nextStep`; do not infer behavior from file MIME type or treat a non-model as a model. If the tool returns `importing`, follow its `nextStep`. The import is already running, and `run_id` waits until it finishes. If the tool returns `import_failed`, `generate`, or `not_found`, tell the user and follow `nextStep`; never invent an asset ID.

## Importing downloaded assets with Bash

Use `/tmp` for temporary downloads, unpacking, conversion, and disposable inspection files. Preserve downloaded originals, archives, reference documents, or candidate assets in `../resources/` when the user asks to keep them or they are needed for later comparison or rework. Organize those retained files to suit the project; not every discarded search result needs to be saved.

Files selected for the game can go directly into `assets/` relative to the `game/` cwd, without first passing through Resources. When adopting a retained reference from `../resources/`, use `import_project_resource` as described above. Game copies stay independent of retained originals; the next checkpoint stores project files. Do not delete an adopted game file after copying, and do not wait for an `assetId`.

- Organize standalone GLB, image, audio, video, and font files under `assets/` to suit the game.
- Put one `.gltf` and all its local dependencies in a dedicated directory, preserving relative paths. Download remote dependencies first and update their URIs to local paths.
- Put PBR images together in a dedicated directory and import each map by its path.

Choose retention by purpose rather than file type: an archive or alternate model needed later belongs in `../resources/`, while disposable intermediate files can remain in `/tmp`. Reference a file adopted under `assets/` with a package import whose specifier is the path after `assets/`:

```ts
import treeUrl from '#project/assets/tree.glb';
import colorUrl from '#project/assets/brick/color.png';
```

Pass that URL to the loader. Both tool-installed catalog/generated assets and files written under `assets/` use `#project/assets/...` imports.

## Imported scenes

Use `import_scene` when the user wants an already exported scene integrated into the project. Its result supplies model references, compatible managed-scene source and migration limitations; follow the tool's integration guidance. Desktop local references are machine-local capabilities, not host paths available to the cloud Agent. Preserve world scale and relative placement when importing a complete level; character-size fitting is inappropriate. Check imported source and asset metadata against the supported content; treat gameplay or animation-trigger reconstruction as a separate request.

## Scene GLB models

The scaffold provides one `model3DLoader` for the current runtime session. In a `SceneFactory`, get it from the third parameter and pass the scene scope to `load`; in Play, use `context.services.model3DLoader` and pass the run or entity scope. Import the installed model under `assets/` with `import assetUrl from '#project/assets/...'` and pass `assetUrl` to `model3DLoader.load`. For a selected search result, read the metadata from its `model` field; other model delivery receipts expose the same fields directly. Copy `rotationDegrees`, and pass `recommendedScale` as the loader's `scale`. The loader applies that scalar uniformly. If gameplay needs the model larger or smaller, adjust that one scalar instead of constructing independent axis scales.

`rotationDegrees` is the asset-space correction that establishes local `+Z` as the model's forward direction; it is not the model's gameplay heading. Apply gameplay or scene heading to the returned semantic root. `rawBboxCm` is the stored GLB's local-axis bounding box before `rotationDegrees` or `scale`; it is informational and is not a target size or a loader input.

Load scene-owned objects in the scene factory and expose interactive ones through `nodes`. Load spawned objects in Play or a reusable object module. Such a module may own visual, animation, physics, input, and gameplay together; pass it the loader, owning scope, and parent.

Use the model returned by `load` as the object added, transformed, and bound to gameplay. Authored `_LOD*` branches with a positive integer become exclusive `THREE.LOD` levels; the remaining scene is LOD0. Those names are not extra catalog meshes. Do not set `visible = false` on them: distance selection is the loader's, and hiding far levels empties them when the camera switches. Confirm `isLOD` on the returned tree when a GLB inspection listed those names. If it needs animation, call `attachAnimatedModelInstance` once on that model. Use `preload` only when fetch and decode can start materially before later instance creation, such as for the next level, wave, boss, or vehicle. It creates no object, so call `load` later and keep the preload scope alive until that load completes. If the model is needed immediately, call `load` directly.

For an existing project, work with its TypeScript ownership structure. The Inspector reads and writes that source; do not introduce a second scene data model. See [model3d-asset.ts](../../examples/scenes/model3d-asset.ts).

When using selected parts from a compound GLB, attaching one loaded model to another, or handling authored `_LOD*` branches, read [model parts and attachments](model-parts-and-attachments.md).

## Replacing existing scene objects

Inspect the area being replaced: what the existing objects represent, their scale relative to the playable subject and surroundings, placement anchors, and required routes and interactions. Placeholder bounds describe the current composition; treat a dimension as a hard limit only when gameplay or the requested layout requires it.

Choose the replacement grouping before scaling. One complete model can replace several placeholders that together represent the same structure. For example, replace a cluster of building blocks with one building model instead of shrinking a complete building into every block. Rework spacing and instance count within the affected area while preserving required routes, interactions, and unrelated objects. Remove superseded visuals and reconcile their colliders and gameplay bindings.

Load each replacement with its returned model metadata's `rotationDegrees` and with `scale` initially set to `recommendedScale`. These establish its canonical local `+Z` orientation and recommended uniform size. If the scene needs a different size, adjust the loader's single `scale` value. Keep the resulting scale coherent with the scene's playable subject and surroundings; do not shrink a model to an implausible size merely to fit one placeholder, copy a placeholder's nonuniform scale, or substitute placeholder dimensions for the asset scale. If the model does not suit the available space at a coherent scale, revise the grouping or local spacing, or choose another asset.

After the loader applies the asset correction and the returned root receives its scene scale and heading, measure the replacement's actual bounds in the same coordinate frame as the layout constraints and align its intended anchor. Recheck neighboring objects, required clearances, and collision geometry. Correct unintended intersections, floating or buried geometry, and blocked paths. Bounding-box overlap is a screening signal; distinguish intentional contact or foliage overlap from obstructive intersections.

Scale, grounding, intersections, and blocked routes can come from source transforms or asset bounds. Trace the affected placement and its collision geometry; an unrelated scene view does not resolve that clearance question.

## Texturing existing geometry

Search for an image texture describing the surface, such as asphalt, concrete, brick, or wood. Use a seamless image when the surface needs repetition; a preview image of an object is not a surface texture.

Import the installed image file with `import textureUrl from '#project/assets/...'`, load it with `THREE.TextureLoader`, set its `colorSpace` to `THREE.SRGBColorSpace`, and assign it to the intended material's `map`. Own the texture with the scene scope. Check the material's `color` as well: it multiplies the texture color.

For repeating surfaces, set `wrapS` and `wrapT` to `THREE.RepeatWrapping` and set `repeat` for the surface dimensions. Repeat a texture along a long road instead of stretching one copy across it. Match texture direction and scale across related pieces; adjust face UVs or use separate face materials when one mapping does not suit every face.

Keep the object's geometry, transform, and gameplay bindings. Reuse textures and materials where their settings match; avoid changing a shared material when only one object should receive the texture.

For PBR material sets, import each installed map path from `#project/assets/...` (using `projectFiles` / `nextStep` from `search_native_assets` or `mapPaths` from `resolve_default_surface`) to load individual maps. Do not load the JSON manifest as an image.

Map `base-color` to `map` with `SRGBColorSpace`; map `normal` and
`roughness` to `normalMap` and `roughnessMap` with `NoColorSpace`.
Use only the maps you need, with matching UV scale and direction.

See [pbr-surface.ts](../../examples/scenes/pbr-surface.ts) for a complete example.

## Character models

### Character source choice

Honor the user's chosen asset or explicit creation route before searching. Read the approved Plan's `assetGenerations` and execution intent `assetDecisions`: `generationMode: "wana_character"` is a locked creation choice even before an asset ID exists. Call `generate_game_asset` with `generation_mode: "wana_character"`, a stable role_id and a designed name, parts, colors, shape and optional standard loadout. The tool applies unspecified defaults and validates against the same modular Wana catalog as My Wana. It creates and installs the real GLB without opening a character editor. Do not run the free-form model generator for the same role.

For direct Build, reuse an explicitly selected/uploaded character. When the game needs a new stylized humanoid and the appearance fits Wana's modular parts, prefer Wana customization. For a new realistic or reference-driven biped humanoid that needs skeletal animation, generate the model first with `generate_game_asset`, explicitly requesting a complete, unobstructed, rig-ready symmetrical T-pose, then pass its catalog asset ID to `prepare_character`. Keep ordinary asset generation outside the Character workflow for quadrupeds, serpentine or multi-legged creatures, vehicles, props, and other unsupported shapes. When no specific appearance is needed, reuse a suitable existing/default body. Do not silently replace an explicit Wana choice with paid mesh generation on failure: report the limitation and keep the completed asset for retries. A paid provider call still follows its normal confirmation.

Wana result `recipe` preserves its editable appearance and separate equipment loadout. Source GLBs contain appearance, clothing, skeleton and their actual animationNames, not permanently fused weapons. Load the installed assetPath using its recommendedScale, mount loadout using the equipment guide, and implement input, NPC behavior, damage, inventory and interactions in game source. Asset creation is not proof of successful game integration. Inspect the motion mappings and gameplay bindings in source. A color or clothing change should reuse the recipe; a weapon-type change also needs gameplay review.

When the brief does not name a humanoid appearance and stylized default bodies fit the game's art direction, load `WANAKA_DEFAULT_CHARACTER` from `wanaka-studio-engine/default-character` through `model3DLoader`. That constant carries `assetUrl`, `rotationDegrees`, `scale`, and locomotion `clipNames` (`{ idle: 'idle', walk: 'run', run: 'run', sprint: 'sprint', jump: 'jump_idle', fall: 'fall' }`; the GLB has no separate `'walk'` clip) for the platform default body. In that stylized default set, additional grounded walking NPCs MUST import one other published body from `wanaka-studio-engine/default-characters/blond-beard`, `wanaka-studio-engine/default-characters/purple-hair`, `wanaka-studio-engine/default-characters/gold-twin-tails`, `wanaka-studio-engine/default-characters/pink-bob`, or `wanaka-studio-engine/default-characters/black-headscarf` so they do not clone the player. Import only the modules whose bodies the game loads. Do not import `wanaka-studio-engine/default-characters`; that module stages every published default-body catalog ID. When the brief calls for a realistic, military, tactical, horror, or other non-cartoon aesthetic where stylized two-head-tall Wana characters would clash, search the catalog (`search_native_assets`) or generate and prepare a theme-matching biped humanoid instead of using the default cartoon bodies. Flying enemies, turrets, and pure kinematic hostiles keep project-owned presentation. A visible capsule or unarticulated block is valid only when that treatment is the requested style.

Search or generate a replacement when the user names an appearance or a realistic/specific theme, then load that installed `#project/assets/...` model through the same `model3DLoader.load` call. See [default-third-person-character.ts](../../examples/default-third-person-character.ts) for the unspecified-appearance player starter, [default-character.ts](../../examples/scenes/default-character.ts) for the loader, and [default-character-blond-beard.ts](../../examples/scenes/default-character-blond-beard.ts) for an extra grounded body.

For a character that needs locomotion or authored actions, list the clips required by that game behavior before choosing an animation setup. Read `animationNames` from the asset result before choosing clips. An absent field makes no claim about animation availability, `[]` means the GLB was parsed and has no named clips, and a non-empty array contains the complete original names in GLB order. Copy a listed name exactly; do not normalize, translate, sort, or deduplicate it. For a published default body, pass that look's `clipNames` into `attachAnimatedModelInstance`.

Reuse the source animation set only when it covers the clips required by that character's gameplay. When a supported biped model is not yet a factory Character with the standard locomotion set, call `prepare_character` with its catalog asset ID. When an already prepared Character needs actions beyond that set, call `add_character_animations` before wiring the behavior.

For a newly created Wana, inspect `animationReadiness` when returned. Its clip durations exclude the source timeline lead-in, and `missingLocomotionRoles` names states the body does not supply. Older results may omit it. Prepare the missing motions required by the game instead of treating a clip name as playback verification or aliasing an unrelated motion. When diagnosing animation playback at runtime, sample consecutive poses after the first frame and across a loop; a change from the rest pose alone does not prove continuous animation. When authoring a pose from a sampled clip, capture the sampled bone transforms before stopping its mixer: stopping restores the original pose. Follow a bound character from its presentation anchors in `preRender`, after the physics world publishes them. Match locomotion playback cadence to actual travel speed when a single cycle covers multiple speeds.

### Prepare and extend a Character animation set

Call `prepare_character` only when the source character is judged to be a biped humanoid with one head, torso, two arms, and two legs, such as a person, humanoid robot, orc, or similar two-legged form. Inspect the asset preview or model and verify that it shows exactly one complete humanoid in a neutral symmetrical T-pose or A-pose: upright head and torso, straight legs slightly separated, straight arms held symmetrically away from the torso, and visible unobstructed major joints. Do not use an action, fighting, guard, crouching, seated, bent-arm, crossed-limb, occluded-limb, or asymmetric pose. If the pose cannot be verified, choose or generate a different asset instead. Quadrupeds, serpentine creatures, fish, birds, multi-legged creatures, vehicles, and props stay outside the Character workflow even when the player asks to try them. These are Agent selection rules, not visual classifications performed by the service. A non-human species is compatible only when its body plan is still a biped humanoid.

Pass `model_asset_id`, using the immutable catalog ID returned by asset search or generation, and set `verified_source_pose` to the inspected `t_pose` or `a_pose`. `prepare_character` does not accept a prompt or image and does not generate the source model. Only a verified AnimationMaker v2 file marker bypasses preparation. Every unmarked GLB is external input regardless of its bone names. A complete recognized skeleton, including `J_Bip_*`, is renamed to Wanaka defaults, normalized to T-pose, and sent directly to retargeting without automatic rigging. A model with no usable skeleton, or an existing skeleton whose names or required joints cannot be mapped safely, is cleaned and enters automatic rigging for at most three attempts. Every automatic rig must map `Hips`, `UpperChest`, and both `UpperArm` and `UpperLeg` joints and pass the hard-corruption guardrail before retargeting. If all attempts fail, produce an incomplete mapping, or cannot establish reliable deformation, return a terminal rig error, tell the player why this asset could not be rigged reliably and should be replaced, and end the current turn before retargeting or any later step. Do not direct the player to manual Character rig repair after this terminal error. A successful result is a new immutable GLB plus a `characterId`; the source asset remains unchanged. Use the returned asset ID in game source and inspect `skeletonAction` and `skeletonReason` to understand the path taken. The result does not guarantee that every animation will look good.

Every newly prepared Character includes `idle`, `walk`, restrained `run`, `sprint`, `jump`, `air`, and `land`. Do not request those actions again. Existing assets are never migrated automatically. For version-stamped new exports, omit `clipNames` overrides to retain automatic takeoff/air/landing and gait-phase transitions; explicit overrides keep the legacy six-role behavior.

For additional actions, call `add_character_animations` with the returned `character_id`. Prefer `animation_packs` for a complete reviewed capability pack or `library_clips` for individual semantic names from the tool/result catalog; both can be combined and duplicates are collapsed. The catalog uses Quaternius when KayKit has the same-purpose motion. Pack membership describes animation availability, not implemented gameplay. Respect each motion's returned `mode` and `requires`: bind props, grips, seats, ledges, or interaction targets explicitly; a sitting animation does not create a chair interaction or move the controller to a seat.

Only actions absent from the reviewed library need `motions`. Expand each generated-motion prompt into one self-contained bounded body motion with a starting pose, complete action and timing, and ending pose. Do not pass a short label as a prompt, and omit scene, camera, appearance, story, and environment details. Give it a stable output `clip_name`. A name matching a reviewed motion reuses that library clip instead of charging for generation.

The service owns library binding, optional MotionRuntime generation and candidate choice, preservation of existing clips, and incremental retargeting. Use the newest returned asset ID after every successful addition. Source GLBs, older Character revisions, and existing game projects remain unchanged. Inspect exact clip names before wiring behavior. For an action, use `play(name, { once: true })` and explicitly return control via `setAutoLocomotion(true)` when the gameplay action ends; loop or pose actions need their own appropriate exit. See the generated animation API for layering and masks.

### Match locomotion clips

`attachAnimatedModelInstance` resolves these six optional locomotion roles independently:

| Role | Automatic name keywords |
| --- | --- |
| `idle` | `idle`, `idling`, `standrelaxed` |
| `walk` | `walk`, `walking` |
| `run` | `run`, `running`, `jog`, `jogging` |
| `sprint` | `sprint`, `sprinting` |
| `jump` | `jump`, `leap` |
| `fall` | `fall`, `falling`, `airborne`, `inair` |

Automatic matching ignores case, separators, and camel-case boundaries. It assigns a compound name to the first matching role in `jump`, `fall`, `sprint`, `run`, `walk`, `idle` priority. A name containing any separate `attack`, `back`, `backward`, `combat`, `crouch`, `death`, `die`, `dodge`, `hit`, `hurt`, `land`, `landing`, `left`, `reload`, `right`, `roll`, `shoot`, `strafe`, `swim`, or `turn` token is excluded from defaults. An exact keyword name wins; otherwise the lexicographically first matching name is stable. This is a convenience choice, not a claim that the motion suits the character.

Pass exact GLB names as `clipNames` to `attachAnimatedModelInstance`, not to `CharacterController`. The mapping is partial: specify only roles that need correction, or all six when the model's naming is nonstandard or exact selection matters. See [third-person-character.ts](../../examples/third-person-character.ts) for passing animation options to the attachment call before binding its return value to `CharacterController`.

With `{ model: animated }`, the controller selects grounded `idle`/`walk`/`run`/`sprint` and airborne `jump`/`fall` from controller state, and turns the model's local `+Z` toward its owned facing. Without a controller claim, the attached model infers grounded locomotion and facing from fixed-step root XZ movement. A state with no matched role plays nothing. Camera viewing uses the separate native `-Z` contract in [camera.md](./camera.md).

Room entity `create` is synchronous and cannot await a catalog GLB or bind `{ model }`. [room-controlled-character.ts](../../examples/room-controlled-character.ts) attaches unspecified appearance on Play as a scene sibling of the collision object. Copy the collision object's pose in `preRender`: `{ object }` writes the capsule bottom, and a published default body is feet-origin. Jump and fall stay on `{ model }`; that path infers only grounded idle/run from the model's XZ.

Before introducing a vertical character offset, read the selected `{ object }` or `{ model }` contract in [character.d.ts](../engine-api/character.d.ts) and inspect model bounds and source transforms. Keep an offset only when the bounds require it. If a reported grounding bug still requires runtime evidence, use a minimal flat-ground probe and compare feet and ground Y after the controller settles.

If `animationNames` is absent, inspect the cached GLB for its complete `animations[].name` list before deciding whether the source set is sufficient. If Preview shows a missing or unsuitable required motion, rebuild the complete set instead of trying to preserve individual source clips. Confirm the exact attachment and controller signatures in the generated [animated-model](../engine-api/animated-model.d.ts) and [character](../engine-api/character.d.ts) declarations.

### Choose one animation owner

Choose ownership before adding action logic:

- When a character needs animation, attach its loaded display model once with `attachAnimatedModelInstance`. When `CharacterController` drives that same display model, pass the attached `AnimatedModel` as `{ model }` so the controller owns its locomotion transitions. Use `animated.play(name, { once: true })` for a simple temporary full-body action; after it finishes, the controller resumes the currently matched locomotion clip.
- Blending, layering, root motion, or states beyond those roles need one project-owned animation flow chosen for that game's requirements. Do not let `CharacterController`, an attached model, and project mixer code compete for the same actions or transforms. Animation completion does not authorize movement, hits, damage, death, or other gameplay results.

Missing or stuck animations can come from role mappings, transition logic, action ownership, or scope cleanup. Grounded/airborne, recovery, reset, and respawn transitions are useful places to trace the affected state; they are not a sequence to exercise on every character edit.

## Published asset credits

Preserve the source attribution sidecar when installing or transforming third-party assets, including author, source, exact license version, notices and changes. Follow [publishing.md](publishing.md) when changing credits or preparing publication metadata.
