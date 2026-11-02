# Render pipeline and Visual Style

Read this guide when a project replaces or extends the standard render graph, changes AO / SSGI / SSR / DOF topology, names a visual style, needs a coherent scene mood, or Edit and Play do not match visually. Lights, materials, fog, environments, cameras, and scene-side TSL materials remain direct pinned Three APIs. `RenderSession` owns the renderer, animation loop, host size, PNG capture, one-frame GPU pass capture (`captureGpuFrame()`), quality receipt, and one submitted main view. `game/visual.ts` is the project's only persisted Visual Profile truth. A Visual Style is the art-direction subset of that profile; it is not a Rendering or Render Quality preset. `game/rendering.ts` holds the literal Rendering switches and the generated chain that applies both. The reviewed guide explains ownership and workflow; it is not an API declaration. For callable Engine contracts, read [render-session.d.ts](../engine-api/render-session.d.ts), [scene.d.ts](../engine-api/scene.d.ts), and [external-assets.d.ts](../engine-api/external-assets.d.ts), plus the pinned Three profile.

## Owner boundaries

Do not copy the Engine quality table into a controller-backed `rendering.ts`; `ProjectRendering` resolves the active quality profile. Three owners split the picture:

- Render Quality (the active quality tier) exclusively owns AA, presentation/scene resolution, effect sampling, the renderer shadow map, the default directional CSM policy, and shadow map size. Renderer shadow-map mode and map size follow the tier: Low uses PCF at 512; Medium uses PCF Soft at 1024; High and Ultra use PCF Soft at 2048; Cinematic uses PCF Soft at 4096. A project may override CSM coverage and split controls through `renderSettings.directionalShadow`, but Engine still owns the CSM node and lifecycle. Do not edit `renderSettings.shadowMap` or walk lights to set `mapSize` for a quality change.

Agent-authored source may use `quality: { preset: 'custom', baseTier: 'ultra', ... }` in
`defineGame` or `RenderSession.create`. The Engine validates and merges the optional
`pixelRatioCap`, `sceneResolutionScale`, `temporalUpscale`, `antialiasing`, AO/GI/reflection
sampling, `bloomResolutionScale`, and shadow-map overrides onto the named base tier. Use
`temporalUpscale` only with `antialiasing: 'traa'`. Studio reads this object as `custom`; do not
write the string `quality: 'custom'` because a custom profile needs its object settings.
- Rendering (`renderSettings` in `game/rendering.ts`) owns Bloom, AO, SSGI, optional VXGI, optional order-independent transparency, SSR, depth of field, optional motion blur, optional god rays, optional lens flare, optional afterimage, and optional contact shadows. That includes the Bloom switch, authored `bloomStrength`, live Bloom strength, the optional motion-blur switch, authored `motionBlurAmount`, and the later official-effect amount literals.

New scenes can author `bloomStrength: 0.1` as a restrained starting point. Omitted `bloomStrength` retains the Engine fallback of `1.5` for existing projects; explicit source values are preserved. Review Bloom at the actual gameplay camera in both bright and dark areas. Keep a strong core and readable material detail before increasing its glow; a lower strength reduces the composite amount but does not remove the Bloom passes.

Use optional `bloomThreshold` in the `ProjectRendering` settings to select which linear-luminance highlights contribute to Bloom (finite, nonnegative; omitted defaults to `0.2`). `rendering.setBloomThreshold(value)` on your `ProjectRendering` instance changes the live extraction uniform without rebuilding. Applying Rendering settings restores the authored value, including the default when omitted. If a bright environment becomes veiled, raise the extraction threshold and compare both dark materials and emissive highlights in that environment before increasing strength.

Bloom thresholds test luminance, not an emissive-material label; a bright lit floor can contribute too. For an unwanted-glow issue, a same-pose comparison with live strength zero can separate broad glow from weak underlying coverage. Raising the threshold can remove low-energy halos without making the base effect more readable.

- Visual Style (`game/visual.ts`) owns exposure/saturation/contrast/vignette grading plus `shading` as art direction. Optional grade leaves are Visual Style Customize fields on the same Visual Profile `post` block. Visual Style does not own Bloom, motion blur, god rays, lens flare, afterimage, contact shadows, or renderer shadow mapping.

Preserve retired AA literals only in an existing legacy inline pipeline unless migration was requested. Hand-authored effects may use explicit values required by the project's visual brief, but keep those values project-local and do not shadow a Visual Style grading leaf with another source of truth.

## Visual Style

### Canonical styles

These eleven style IDs are the complete named Visual Style set. Every style includes palette, key/fill/rim lighting, fog, weather, exposure/saturation/contrast/vignette grading, and shading. It does not own Bloom, motion blur, god rays, lens flare, afterimage, contact shadows, renderer shadow-map mode, Render Quality, environment selection, or tintable material-role bindings. None is only a background/fog recipe.

Read [Visual Style presets](visual-style-presets.md) when choosing, applying, or tuning one of them. That guide describes each recipe's appearance, style-owned values, and adjustment workflow.

Studio and Plan Mode apply these IDs. Game source must not import a style registry. For a new project, write one complete profile. For an existing project, apply the named style as a merge: replace only the style-owned leaves and preserve its environment, tintable roles, legacy-compatible Bloom/shadow leaves, and every Rendering/quality source value. Do not reconstruct styles from a partial table, import editor-core from the game, or add a second `styles` map. A user edit to a style-owned leaf on a named style sets `presetId: 'custom'` unless the resulting style-owned values exactly match a registered style again. Studio's editing path creates and maintains `savedCustom` as its restorable Custom-card snapshot. The runtime applies the active top-level fields, not that snapshot. For direct source edits, synchronize an existing `savedCustom` when replacing the active Custom recipe, but do not create it merely to make an adjustment render. Studio Save as Custom snapshots the current look into that one project-scoped recipe even when the values still match a named style. Editing a preserved project-specific leaf does not change the selected style identity. Studio Customize can edit environment and tintable roles; that does not change the selected style identity.

### Schema-v1 leaves and owners

Keep the generated `ProjectVisualProfile` type and one direct, fully literal `visualProfile` declaration. Edit its known leaves rather than moving values into scene code or another settings object.

| Group                | Schema-v1 leaves                                                                  | Named style behavior | Runtime owner                                                     |
| -------------------- | --------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| `palette`            | `sky`, `ground`, `road`, `accent` as `#RRGGBB`                                    | Replaced             | Scene background plus explicitly bound tintable materials; dither also uses sky/ground as paper/ink, and CRT mixes accent as a fluorescent phosphor cast |
| `lighting`           | key color/intensity/azimuth/elevation; fill and rim color/intensity; legacy-compatible `shadowMode` | Key/fill/rim replaced; `shadowMode` preserved | Explicitly bound project lights; renderer shadow map and map size are exclusively owned by the quality tier; per-light shadow flags stay in scene source |
| `atmosphere.fog`     | enabled, color, near, far                                                         | Replaced             | `THREE.Scene.fog`                                                 |
| `atmosphere.weather` | `clear` / `rain` / `snow`, amount, wind                                           | Replaced             | Scope-owned project weather installed by the Engine visual runtime |
| `environment`        | `color` / `exr`, exactly one immutable `assetId`, intensity, rotation | Preserved            | Scene environment/background and scope-owned EXR texture          |
| `post`               | exposure, legacy-compatible bloom, saturation, contrast, vignette, optional grade | Exposure/saturation/contrast/vignette replaced; bloom and optional grade preserved | Style grading in the generated post chain; Rendering owns Bloom   |
| `materialTheme`      | unique subset of `road`, `ground`, `accent`                                       | Preserved            | Only project materials explicitly listed under those roles        |
| `shading`            | `model`: `standard` / `cel`; `ink`: boolean; `look`: `none` / `graphic` / `wash` / `pixel` / `hatch` / `dither` / `crt`; optional `inkThickness` (`0.25..4`, default `1`); optional `pixelResolution` (`32..2048`, default `200`) | Replaced             | Cel remaps the renderer material library; ink is screen-space edges; look is one NPR treatment in `game/rendering.ts`; the optional leaves tune ink width and the pixel look's virtual screen width, with integer nearest-neighbor scaling on resize |
| `savedCustom`        | one style-owned recipe, including optional grade and shading leaves; no Bloom, environment, materials, or `shadowMode` | Preserved            | Studio Custom card restore; Engine preview ignores the snapshot and applies the active leaves |

Runtime-safe ranges are part of schema v1: light intensity `0..20`, key azimuth `-180..180`, elevation `-90..90`, fog `0 <= near < far <= 100000`, weather amount/wind `0..1`, environment intensity `0..10`, rotation `-180..180`, exposure `-2..2`, saturation/contrast `0..2`, contrastPivot `0.1..0.9` (omitted is `0.5`), vignette `0..1`, `shading.inkThickness` `0.25..4` (omitted is `1`), and `shading.pixelResolution` `32..2048` (omitted is `200`). The compatibility bloom leaf still validates as `0..3`, but it is not a Visual Style or renderer control; the `post` block section below owns the Bloom admission rule. A color environment carries no asset reference. An EXR environment requires one non-empty immutable `assetId`.

### Complete source example

This is one complete schema-v1 file for a new project, not a style registry or an instruction to replace an existing profile. It matches the `neutral` named style.

```ts
/** Project visual source shared by Edit, Preview, Play, and Publish. */
export interface ProjectVisualProfile {
  readonly schemaVersion: 1;
  readonly sky?: 'solid' | 'gradient';
  readonly presetId: 'neutral' | 'realistic' | 'stylized-toon' | 'graphic-ink' | 'ink-wash' | 'pixel-screen' | 'crosshatch' | 'one-bit' | 'phosphor' | 'retro-warm' | 'horror' | 'custom';
  readonly palette: {
    readonly sky: string;
    readonly ground: string;
    readonly road: string;
    readonly accent: string;
  };
  readonly lighting: {
    readonly key: { readonly color: string; readonly intensity: number; readonly azimuth: number; readonly elevation: number };
    readonly fill: { readonly color: string; readonly intensity: number };
    readonly rim: { readonly color: string; readonly intensity: number };
    readonly shadowMode: 'off' | 'hard' | 'soft';
  };
  readonly atmosphere: {
    readonly fog: { readonly enabled: boolean; readonly color: string; readonly near: number; readonly far: number };
    readonly weather: { readonly kind: 'clear' | 'rain' | 'snow'; readonly amount: number; readonly wind: number };
  };
  readonly environment: {
    readonly kind: 'color' | 'exr';
    readonly assetId: string | null;
    readonly intensity: number;
    readonly rotation: number;
  };
  readonly post: { readonly exposure: number; readonly bloom: number; readonly saturation: number; readonly contrast: number; readonly vignette: number; readonly hue?: number; readonly vibrance?: number; readonly cdlSlope?: number; readonly cdlOffset?: number; readonly cdlPower?: number; readonly sharpen?: number; readonly filmGrain?: number; readonly chromaticAberration?: number; readonly lutIntensity?: number; readonly lutAssetId?: string | null; readonly colorFilter?: string; readonly temperature?: number; readonly tint?: number; readonly contrastPivot?: number; readonly shadows?: string; readonly midtones?: string; readonly highlights?: string; readonly splitToneShadows?: string; readonly splitToneHighlights?: string; readonly splitToneBalance?: number; readonly channelMixer?: { readonly rr: number; readonly rg: number; readonly rb: number; readonly gr: number; readonly gg: number; readonly gb: number; readonly br: number; readonly bg: number; readonly bb: number } };
  readonly materialTheme: { readonly tintableRoles: readonly ('road' | 'ground' | 'accent')[] };
  readonly shading: { readonly model: 'standard' | 'cel'; readonly ink: boolean; readonly look?: 'none' | 'graphic' | 'wash' | 'pixel' | 'hatch' | 'dither' | 'crt'; readonly inkThickness?: number; readonly pixelResolution?: number };
}

export const visualProfile = {
  schemaVersion: 1,
  presetId: 'neutral',
  sky: 'gradient',
  palette: {
    sky: '#569bd5',
    ground: '#a5c9e2',
    road: '#4a5258',
    accent: '#ffd86b',
  },
  lighting: {
    key: {
      color: '#ffffff',
      intensity: 2,
      azimuth: 53,
      elevation: 58,
    },
    fill: {
      color: '#ffffff',
      intensity: 1,
    },
    rim: {
      color: '#fff0c5',
      intensity: 0.31,
    },
    shadowMode: 'soft',
  },
  atmosphere: {
    fog: {
      enabled: true,
      color: '#d5dfe8',
      near: 60,
      far: 160,
    },
    weather: {
      kind: 'clear',
      amount: 0,
      wind: 0,
    },
  },
  environment: {
    kind: 'color',
    assetId: null,
    intensity: 1,
    rotation: 0,
  },
  post: {
    exposure: 0.35,
    bloom: 0,
    saturation: 1,
    contrast: 1,
    vignette: 0,
  },
  materialTheme: { tintableRoles: ['road', 'ground', 'accent'] },
  shading: {
    model: 'standard',
    ink: false,
    look: 'none',
  },
} satisfies ProjectVisualProfile;
```

### Edit and auto-save without a second truth

1. Read the current `game/visual.ts`. Direct literal leaves are deterministic edits. A missing, computed, spread, duplicate, or ambiguous profile is source-owned: report the diagnostic and ask the Agent to install or reconcile the Visual Profile integration instead of guessing at scene assignments. Automatic Style cards never perform this adoption or migration.
2. For a named style, apply only its canonical palette, key/fill/rim, fog/weather, exposure/saturation/contrast/vignette, and core shading leaves. Preserve the exact `environment`, `materialTheme.tintableRoles`, `post.bloom`, `lighting.shadowMode`, and any authored optional grade or shading controls. Preserve `savedCustom` when applying a named style. For a bespoke style request, change only the requested style leaves and set `presetId: 'custom'`. Never leave an old style ID on modified style values. Optional grade leaves and shading controls are Visual Style Customize fields, not named-style recipe fields; the `post` block section below lists them and their ranges. A Custom apply replaces style-owned post and shading, including optional grade and shading leaves from `savedCustom`.
3. Keep `game/visual.ts` config-only. Do not add editor imports, runtime loading, or a project-local preset registry to it. Do not also patch `scene.background`, fog, lights, materials, or exposure; Engine and `game/rendering.ts` consume the profile. Do not add `game/visual-runtime.ts` to a current starter.
4. Studio previews a valid style edit optimistically and immediately queues its source save. There is no separate Apply, Cancel preview, or Apply Summary step. A rejected save restores the confirmed style; failed compilation compare-and-swap restores the prior source and leaves its source hash unchanged.
5. Write the profile through a revision-checked workspace transaction; on a hash conflict, re-read and reconcile rather than overwriting. When `game/visual.ts` is a writable literal, a style change patches only that file: `game/rendering.ts` must remain byte-identical. If `game/visual.ts` is absent, computed, or otherwise source-owned, route the composition to the Agent; do not adopt, migrate, or recreate Rendering during automatic style selection. Older or custom Rendering hooks do not block a writable style save.
6. Preview, Play, Publish, and Export compile the accepted Working Revision independently. Never pass temporary Edit state through a global, editor-only module, query parameter, or mutable singleton.

### Shared project runtime and explicit bindings

Engine applies the profile after scene construction and before fallback lookdev, using the candidate scene's `SceneContext.scope`. This placement makes the same profile run in Edit and Play and lets a failed async preparation roll back before the candidate scene commits.

 The managed scene declares visual targets explicitly: key/fill/rim light references and arrays of tintable materials for the `road`, `ground`, and `accent` roles. Bind only materials the project owns and intends to tint. Do not traverse arbitrary scene or GLB materials, infer roles from Object3D names, or mutate a shared asset material that was not declared tintable. Missing optional bindings are valid and stay unchanged. `applySurfaceMaterial` applies the resolved `{ tileSizeUnits, maps }` look to a mesh, so call it before returning the managed scene and bind the final PBR material to its tint role; the Visual Profile then tints that final material. Engine applies the profile after scene construction. For the bound key it writes color, intensity, and world position from `lighting.key` azimuth and elevation on a radius-10 sphere around the origin, and sets `castShadow` from `lighting.shadowMode !== 'off'`. A factory `position` on that bound key does not survive. When `directionalLightCsm` is active, the default key's CSM node, cascade frusta, shadow distance, split scheme, texel alignment, and cascade fade belong to Engine. Do not write `sun.shadow.camera` or attach a shadow node for that key unless the project deliberately opts out of the Engine CSM path; an authored shadow camera/node is treated as an explicit owner. Fill and rim receive color and intensity only. Studio authoring overrides still apply after this preparation for Inspector-edited visibility, transforms, and shadow flags on override entries. Instantiated GLTF meshes and ordinary authored Mesh primitives start with `castShadow` and `receiveShadow` on; write those two flags when you construct a Mesh. Do not add a scene-wide traverse to enable them. To opt a model or mesh out, write those flags on the managed root or override entry — on a model root the write reaches descendant meshes.

`lighting.shadowMode` remains in schema v1 only for source compatibility and is never changed by a named Visual Style. On the bound key it sets `castShadow` when the mode is not `off`. It does not configure the renderer shadow map. A project may optionally author the directional controls in `game/rendering.ts`:

```ts
directionalShadow: {
  shadowDistance: 96,
  cascades: 2,
  splitLambda: 0.5,
  texelAlignment: true,
  fade: true,
},
```

`shadowDistance` is independent of `camera.far`; `cascades` accepts `2`, `3`, or `4`; `splitLambda` ranges from `0` (uniform) to `1` (logarithmic); `texelAlignment` keeps each cascade stable on its shadow-map texel grid; and `fade` blends cascade boundaries. When omitted, the active quality tier supplies its existing defaults. Per-light mesh shadow flags stay in scene source, while the renderer shadow-map algorithm and its resolution/sampling stay with Render Quality as listed under Owner boundaries. Do not create a second shadow owner in the visual helper.

### EXR resolution and rollback

Persist Cloud and Desktop-local EXR IDs with `assetId2Url('<asset-id>')` on `visualProfile.environment.assetId`; persist LUT IDs the same way on `visualProfile.post.lutAssetId`. Never persist a signed URL, blob URL, editor preview URL, or fetched texture. The compile/materialization path freezes those helper calls and passes the resolved URL to `loadExrEnvironment(...)`. A `.cube` LUT uses `loadCubeLut(...)` and the official `lut3D` node. The callable contracts remain the Engine declarations linked above.

Each environment attempt belongs to a fresh child scope. Load the candidate first, keep the last-good environment while it is pending, commit only the latest successful request, then dispose the previous child scope. Failure or cancellation disposes the candidate and leaves the last-good view intact. Scene replacement, Stop, and session disposal must release the active EXR texture and restore the prior scene state. A transient `environmentUrl` may accompany Edit preview for an asset not yet persisted; it is validated by the authoring bridge and must never be copied into `game/visual.ts`.

### Weather budget and lifecycle

Schema v1 intentionally supports only `clear`, `rain`, and `snow`. The canonical helper caps weather at `PROJECT_WEATHER_PARTICLE_BUDGET = 1200`; amount scales within that cap and wind remains `0..1`. Do not bypass the cap or add an unbounded emitter because a stronger storm was requested. Visual Profile weather uses official soft particles through the generated visual runtime; do not replace that precipitation with a hard-cut `Points` mesh.

Weather geometry, material, Points object, and scheduler callback all belong to the same replaceable child scope as that visual attempt. Register every disposable and callback before exposure, remove the Points object on cleanup, and dispose the old scope after a successful swap. The `clear` weather kind creates no particles. A failure must not leave a second scheduler callback, geometry, material, or scene child alive.

## The `post` block: grading and optional effects

### Style grading and shading

`game/visual.ts` owns exposure, saturation, contrast, vignette, and shading. Visual Style owns those leaves, the optional grade leaves, and shading (`model`, `ink`, `look`, `inkThickness`, and `pixelResolution`) as art direction. `inkThickness` is a multiplier for the selected look's built-in screen-space ink width (`0.25..4`, default `1`). `pixelResolution` is the virtual screen width used by the `pixel` look (`32..2048`, default `200`); its height follows the viewport aspect, and the shader uses integer nearest-neighbor scaling so resizing changes the block size only at integer scale steps. It has no effect on other looks. Studio Customize authors the grade leaves and shading controls on the same profile; named style cards preserve those optional controls. The optional grade leaves cover official Three nodes (`hue`, `vibrance`, ASC CDL, `lut3D` via `lutAssetId`/`lutIntensity`, `sharpen`, `film`, `chromaticAberration`) and Wanaka compose (white balance as `temperature`/`tint`, `contrastPivot`, `colorFilter`, shadows/midtones/highlights, channel mixer, split tone). `hue` is degrees. `temperature`/`tint` are −100…100. Hex color leaves use `#RRGGBB`; `#ffffff` is identity. Do not add a point-curve editor.

Generated `game/rendering.ts` imports that visual block, validates the schema-v1 ranges, and exposes `applyProjectVisualPost(...)` with the same argument order as `projectRendering.applyVisualSettings` (post, shadow mode, optional target scene, shading, and palette) for the project visual controller. It applies those grading/shading values, updates renderer exposure, remaps the material library when `shading.model` is `cel`, applies a linear `shading.look` on scene-linear color, scales screen-space ink by `shading.inkThickness`, applies `pixel` and `dither` after the complete neighborhood AA tail, and rebuilds the owned pipeline when required. `shading.pixelResolution` changes only the virtual width used by the `pixel` look; the pixel shader snaps to integer nearest-neighbor scale steps during resize and does not change the render target or quality tier. `shading.model: 'cel'` remaps built-in lit materials through the renderer NodeLibrary; do not walk the scene replacing materials. `shading.look` selects one of the built-in NPR treatments.

Do not copy grading values into `renderSettings`, a scene factory, or a hand-authored second post object. The complete Visual Profile still carries legacy Bloom/shadow leaves for source compatibility, but Visual Style preserves them and `ProjectRendering` does not use them to replace Rendering settings.

### Bloom

Bloom remains owned by `renderSettings`. Bloom topology is Rendering-authored rather than allocated on demand. Leave the authored Bloom switch and `visual.ts` `post.bloom` amount off until the user asks for bloom or visible glow. Sunlight, materials, fog, depth of field, and a cinematic look are not a bloom request. A disabled `renderSettings.bloom` switch does not allocate a Bloom pass, and calling a setter alone cannot enable that missing topology. When the switch is enabled, the authored `bloomStrength` literal (`0..3`) is the source-backed strength and overrides the omitted Engine default described above. Import `setBloomStrength(strength)` from `game/rendering.ts` and update its absolute `0..3` strength from gameplay without rebuilding the pipeline. Setting it to zero keeps the allocated pass ready for a later transition; applying new source-backed Rendering settings resets the live value to `bloomStrength`. Applying a Visual Style never enables, disables, or resets Bloom.

### Depth of field

Depth of field is gameplay state, not a quality tier. It stays off by default unless the project has an explicit focus state to drive. Center autofocus can blur an off-center foreground subject even when that subject is the player's intended focus. Once the topology is enabled, import `setDepthOfFieldAmount(amount)` from `game/rendering.ts`. Call it every frame from the project's existing state update: use `amount = 0` for ordinary play, then interpolate through `1` for the focus state. `ProjectRendering` starts at `1` so Studio Edit preserves its authored preview. `applyProjectRenderSettings(...)` rebuilds the presentation; reserve it for topology or literal-setting changes, not live focus transitions.

### Motion blur

Motion blur is a Rendering switch, not a Visual Style leaf. Leave `motionBlur` off until the brief asks for camera or object streaking. An omitted or false switch allocates no motion-blur samples and does not add a velocity attachment by itself. When the switch is enabled, `ProjectRendering` reuses the scene-pass `velocity` MRT already required by TRAA or temporal SSR, and allocates that attachment on Low or Medium only for this effect. The authored `motionBlurAmount` literal (`0..3`, default `1`) scales those motion vectors. Import `setMotionBlurAmount(amount)` from `game/rendering.ts` to change the live amount without rebuilding the pipeline. Applying new source-backed Rendering settings resets the live value to `motionBlurAmount`. Applying a Visual Style never enables, disables, or resets motion blur.

God rays, lens flare, afterimage, and contact shadows are the same kind of Rendering switch. Leave each off until the brief asks for that look. An omitted or false switch allocates no official node. God rays and contact shadows also need a `PerspectiveCamera` plus a scene `DirectionalLight` (god rays also accept a `PointLight`); without that light the switch stays allocated-off and does not throw. God rays follow official bilateral blur and depth-aware blend, and they need a complete shadow setup to read as shafts. Contact shadows complement shadow maps for nearby detail; they are not subsurface scattering. Lens flare always samples the authored Bloom extract. Bloom only decides whether that extract is also added to the frame. Afterimage keeps a previous-frame history; rebuilding the pipeline clears that trail. Authored amounts are `godRaysDensity` (`0..2`, default `0.7`), `lensFlareAmount` (`0..3`, default `1`), `afterimageDamp` (`0..1`, default `0.96`), and `contactShadowsIntensity` (`0..1`, default `1`). Import `setGodRaysDensity(density)`, `setLensFlareAmount(amount)`, `setAfterimageDamp(damp)`, and `setContactShadowsIntensity(intensity)` from `game/rendering.ts` to change the live amounts without rebuilding the pipeline. Applying new source-backed Rendering settings resets those live values. Applying a Visual Style never enables, disables, or resets these switches.

## Use the switch module for the standard graph

For GTAO, SSGI, optional VXGI, optional order-independent transparency, SSR, Bloom, center-autofocus DOF, optional motion blur, optional god rays, optional lens flare, optional afterimage, and optional contact shadows, edit the literal `renderSettings` object in `game/rendering.ts`. Anti-aliasing belongs only to the active quality tier: Low uses native-resolution FXAA, Medium and High use native-resolution SMAA, Ultra uses 0.8-scale TAAU, and Cinematic uses native-resolution TRAA. While the custom pipeline is off, Cinematic admits full-resolution SSGI and SSR the same way High and Ultra admit default GTAO; a custom pipeline's SSGI and SSR literals win. Cinematic keeps temporal reflection history because TRAA supplies velocity, while Ultra's TAAU reconstructs its lower-resolution scene into the presentation buffer. `ProjectRendering` builds those official Three nodes, applies the active quality profile, and replaces the current view through `RenderSession`; Agent code MUST NOT copy that graph into project source. The compile-checked module shape is [webgpu-postfx.ts](../../examples/webgpu-postfx.ts).

Keep every field literal so Studio and Agent edits converge on the same source seam. A computed field makes the file source-owned and Studio will refuse to overwrite it. Existing projects with an older inline pipeline remain valid; do not migrate or recreate one unless the task explicitly asks for that change.

SSGI already produces ambient occlusion together with indirect light. When both SSGI and the GTAO intent are enabled, `ProjectRendering` uses the SSGI AO output and omits the separate GTAO pass; GTAO remains the fallback for a camera that cannot run SSGI. Do not add a second AO pass to the standard graph.

`vxgi: true` is a custom-pipeline literal, not a quality default. It runs only on WebGPU with a `PerspectiveCamera`, and then replaces both SSGI and standalone GTAO. Leave it false unless the brief asks for voxel GI. `orderIndependentTransparency: true` is also a custom-pipeline literal; skip it when the quality tier is using official SSAA, because that scene pass cannot host OIT. Add an official `LightProbeGrid` in project scene source when the brief wants a baked probe volume; the Engine bakes every grid after the scene opens. Do not call `bake()` from project source.

For one extra official node that the switch object does not name, pass `composeLinear` or `composeDisplay` as the third `ProjectRendering` argument in `game/rendering.ts`. Do not copy the standard graph. The active controller receipt is `rendering.qualitySnapshot.presentation.projectGraph`. Play code receives the active `RenderSession` as `context.rendering`; call `applyProjectRenderSettings(rendering, nextSettings)` to change switches at runtime.

Use a custom `RenderPipeline` only when the project has a concrete reason to replace the standard graph. Read the pinned Three node source or official example for exact arguments; this guide owns Wanaka's chain boundaries and lifetime rules, not a second Three API catalog.

## Build the chain around an explicit output boundary

Treat `renderOutput(...)` as a named boundary rather than an antialiasing special case:

1. The scene pass and every required MRT output produce linear scene data.
2. Linear lighting, reconstruction, spatial, and temporal effects consume that data.
3. Use `renderOutput(...)` exactly once for tone mapping and output-color conversion.
4. Display-space effects consume that transformed color.
5. Keep the selected quality path's AA tail on its graph-defined side of the output boundary. Low FXAA stays on the linear side to preserve thin-line coverage.

Choose one complete output path. Without a display-space effect, Low FXAA, SMAA, TRAA, TAAU, MSAA, SSAA, or no AA may finish the linear chain and let `RenderPipeline` apply the output transform. With a display-space effect, place the selected quality AA tail after linear effects and before explicit `renderOutput(...)`; apply the display effect next and set `pipeline.outputColorTransform = false`. The output transform occurs exactly once in every path. Official SSAA replaces the scene pass and does not add a second AA tail. Cinematic uses TRAA, so temporal SSGI and SSR can run.

For the built-in path, inspect `qualitySnapshot.presentation.output` when a brightness or color-space issue is under investigation. It records the renderer tone-mapping operator, live `toneMappingExposure`, and output color space that the `renderOutput` node consumes. `visualProfile.post.exposure` is the canonical project mood input; `ProjectRendering` maps those stops onto renderer state with `visualExposureToToneMappingExposure` (`0` stops is exposure 1 on the product curve: identity below linear 0.8, then a Khronos Neutral shoulder). The legal range is −2…+2. The product renderer always enables official Three reverse-Z; do not set `reversedDepthBuffer` in project source.

## Keep Visual Style grading in the canonical chain

The generated Visual Profile chain is:

1. Configure renderer exposure from `visualProfile.post.exposure`.
2. Build the scene and enabled Rendering-owned linear effects, including AO/GI/reflections, contact shadows, god rays, motion blur, depth of field, Bloom, lens flare, and afterimage. Bloom uses the admitted quality tier's resolution scale without transferring its switch or strength to Visual Style. Motion blur consumes the scene-pass velocity attachment and stays off the Visual Style `post` block. God rays, lens flare, afterimage, and contact shadows stay on `renderSettings` the same way.
3. Apply scene-linear Visual Style leaves only: white balance (`temperature`/`tint`), color filter, and `hue`.
4. When `visualProfile.shading.look` is a linear look (`graphic`, `wash`, `hatch`, `crt`), apply that one treatment on the scene-linear color. Looks are color-only and do not add MRT attachments.
5. When `visualProfile.shading.ink` is true and the look is not `dither`, draw screen-space depth/normal ink on that scene-linear color, using the active camera's perspective or orthographic view-Z. `graphic` uses a hard black comic contour nearby. The Sobel window shrinks with view-Z so a distant mesh stays readable instead of disappearing under a fixed 2–3 px kernel. Other linear looks also fade stroke opacity with distance. The active tier's AA covers those edges. Do not walk the scene or the Edit overlay to draw outlines. Do not pin the scene pass to layer 0.
6. Run the quality-tier AA/output tail while applying the output transform exactly once. Apply the generated profile saturation/contrast shaping and profile vignette, plus display-referred optional grade leaves (`vibrance`, CDL, `lut3D`, shadows/midtones/highlights, channel mixer, split tone), after `renderOutput(...)` on the `composeDisplay` seam. Contrast uses `pivot + (c - pivot) * contrast` in display space; omitted `contrastPivot` is 0.5. A display mid-gray pivot on scene-linear HDR would cut any radiance below `0.5 * (contrast - 1) / contrast`. Other paths that need this display grade also take the explicit `renderOutput` boundary. Do not add a second grade later in `game/rendering.ts`.
7. When `visualProfile.shading.look` is `dither`, threshold luma onto `palette.sky` / `palette.ground` after that complete AA tail, including High's final FXAA. If ink is also on, draw a hard contrasting paper/ink silhouette from depth/normal edges after that threshold so each object stays readable. Do not place a 1-bit threshold before neighborhood AA, and do not leave a mid-grey stroke on a dithered frame.
8. When `visualProfile.shading.look` is `pixel`, snap the resolved image to a screen-space pixel grid after that complete AA tail, including High's final FXAA. Color stays continuous. If ink is also on, those edges are already on the linear picture and snap with it; do not defer ink after the snap. Do not place that snap before neighborhood AA, and do not draw a full-frame grid overlay.
9. Official display optics from the same Visual Profile (`chromaticAberration`, `film`, then `sharpen`) run after that complete AA tail and after-AA looks, on display-referred color. Skip each node at its identity amount.

The profile vignette in step 6 is the official Three `vignette(...)` helper inside this owned chain. Do not append a second vignette for the same profile leaf.

Non-neutral saturation, contrast, or vignette, any active optional grade leaf, or `shading.ink`, or `shading.look` other than `none`, requires a project pipeline even when advanced `renderSettings.enabled` is false. Exposure still applies at the renderer boundary without requiring one. Bloom is present only when the Rendering switch enables it. When that master switch is false, GTAO follows the active quality tier's default (High, Ultra, and Cinematic on; Low and Medium off), not the stored `ambientOcclusion` literal. The renderer shadow map always follows the same tier as listed under Owner boundaries. A sky dome or other far-plane backdrop keeps `depthWrite` and `depthTest` off, `renderOrder` behind the scene, and `frustumCulled` false so GTAO never treats it as occluding geometry. `applyProjectVisualPost(...)` reconfigures Style grading/shading and replaces the active main view so the old pipeline ownership context is disposed before the new one becomes active; it must not change Bloom, shadow mapping, or Render Quality.

Pin each custom-pipeline helper to the following side:

| Effect                | Place in the chain                                  | Inputs and ownership                                                                                                                                                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `afterImage`          | Linear, before the output boundary                  | Color plus previous-frame history. Convert and own a texture input before calling the helper, then own the node; its two render targets must end with the pipeline context. Rebuilding the pipeline resets the history.                                                                                                                           |
| `bloom`               | Linear, before the output boundary                  | Whole-frame bloom needs color only. Own the node; its threshold must see untone-mapped luminance. Selective emissive bloom would require an additional upstream MRT output and is a different recipe.                                                                                                                                             |
| `dof`                 | Linear, before the output boundary                  | Color plus `scenePass.getViewZNode()`. Request the depth-derived node before pass precompilation, convert and own its color input, then own the DOF node and its internal targets. The default depth texture does not add a color attachment.                                                                                                     |
| `motionBlur`          | Linear, before the output boundary                  | Color plus a `velocity` MRT attachment declared before pass precompilation. The function is pure shader composition and is called directly.                                                                                                                                                                                                       |
| `fsr1`                | Linear reconstruction before the output boundary    | Convert and own its texture input, then own the node. Lower the scene pass with `setResolutionScale(...)`, feed FSR1 an antialiased source, and let it produce the display-resolution input for the remaining chain. Its RCAS pass already sharpens the result; do not append `sharpen` by default. Treat it as the selected resolution strategy. |
| `ssaaPass`            | Replaces the ordinary scene pass on the linear side | Own the pass. Set `options.samples = 0` and `renderTarget.samples = 0` before the first `getTextureNode` so the accumulation target matches the single-sample depth. During `updateBefore`, the official r186 node reads CSS `getSize()`; size it from `getDrawingBufferSize()` so a pixel-ratio cap above 1 does not upscale a CSS-resolution beauty. Do not call `setMRT` on this pass; put GTAO, SSR, and other G-buffer attachments on a separate `pass(...)`. It re-renders the scene `2^sampleLevel` times and conflicts with the normal `pass(...)` plus resolution-scale structure. Select it as the AA/render strategy; do not append it to an existing scene pass or combine it with FSR1. |
| `chromaticAberration` | Display-space, after the output boundary            | Color only. Convert and own its texture input before calling the pure helper; the chromatic-aberration node itself has no disposable target.                                                                                                                                                                                                      |
| `film`                | Display-space, after the output boundary            | Color only. Call it directly; its animated grain is pure shader composition.                                                                                                                                                                                                                                                                      |
| `vignette`            | Display-space, after the output boundary            | Color only. Call the pure TSL function directly.                                                                                                                                                                                                                                                                                                  |
| `sharpen`             | Display-space, after the output boundary            | Color only. Convert and own its texture input, then own the node and its render target. Place it after temporal AA or a reconstruction without built-in sharpening so it sharpens the final resolved image once. FSR1 already includes RCAS sharpening, so stacking this node after FSR1 must be an explicit artistic choice.                     |

## Declare upstream data before the pass runs

Build the complete input inventory before compiling or rendering the scene pass. `getViewZNode()` derives DOF view depth from the pass's default depth texture. Named outputs such as velocity, normal, and diffuse color must be declared together with `setMRT(mrt(...))`; adding one after the pass has compiled is too late.

Before adding a named MRT output, calculate the resulting color-attachment count and bytes per sample for the target backend. The combined SSGI and SSR topology already packs its data into four color attachments. Reuse or pack an existing attachment where its format and semantics permit; never assume a developer adapter's higher optional limit is portable.

## Own nodes that own resources

Pass every node with a `dispose()` method through the supplied pipeline `context.own(...)` boundary. In the pinned profile this includes `afterImage`, `bloom`, `dof`, `fsr1`, `sharpen`, and `ssaaPass`. `chromaticAberration`, `film`, `vignette`, and `motionBlur` are direct shader composition and need no ownership wrapper.

Also own texture conversion separately. The pinned `afterImage`, `dof`, `fsr1`, `sharpen`, and `chromaticAberration` helpers call `convertToTexture(...)`; a non-texture input may therefore allocate an RTT that the returned effect node does not dispose. `ProjectRendering` handles this internally but does not export its helper. Hand-authored pipelines MUST apply the equivalent `convertToTexture` plus `context.own(...)` check so the conversion and the effect have explicit owners.

The pipeline itself remains owned by the active scene or view lifetime. Replacing a camera, quality tier, or pipeline factory must dispose the complete old ownership context before the replacement becomes active. Standard switch modules get this behavior from `ProjectRendering`; a custom factory must preserve the same `context.own(...)` discipline.

## Authoring guidance

Keep the player, floor/road, first objective, fog silhouette, weather, highlights, and large set-piece surfaces readable. Compare `game/rendering.ts` with its pre-style bytes to check the Rendering/quality boundary.

## Troubleshooting

Unreadable shadows, washed-out subjects, or obscured objectives can come from lighting, exposure, fog, and post-effect interactions in the affected view. Edit/Play appearance differences can come from different scene or effect state. These are investigation directions when a problem arises; compilation alone does not establish observed brightness or parity.
