# Rendering in Kurenai: 3D, custom shaders, simulation textures

This page lists what the Kurenai preview renderer can do, verified in the bundled
runtime, and the patterns that work. Read it before building anything that
needs lighting, custom shaders, render-to-texture or per-frame geometry.

## Start a 3D project

```sh
kurenai init <dir> --template base-ai-3d
```

The `base-ai-3d` template enables the `3d` and `primitive` engine modules. Its
`MainView` keeps the prefab world and sets up what a 3D scene needs:

- the scene main camera stays at `priority = 0`
- any UI / Canvas camera is switched to `DEPTH_ONLY`, high priority and
  `visibility = UI_2D` (default visibility also includes `DEFAULT` and would
  draw every 3D mesh a second time, flat, over the scene)
- directional light with a shadow map (`shadows.type = ShadowMap`)
- ambient light lifted so faces away from the sun stay readable
- `assets/resources/materials/red.mtl` as a starter material; use
  `builtin-standard` via a `.mtl` or `loadBuiltinEffect()`

For an existing 2D project, enable the modules in
`settings/v2/packages/engine.json` (`cache.3d._value`, `cache.primitive._value`
and both names in `includeModules`), then `kurenai host stop && kurenai host start`.

## What works

| Feature | Status | How |
|---|---|---|
| Custom `.effect` shaders | works | [Custom effects](#custom-effects) |
| `builtin-unlit` | registered at start | `effectName: 'builtin-unlit'` |
| `builtin-standard`, `builtin-toon`, `advanced/*` | load on demand | `.mtl` asset or `loadBuiltinEffect()` |
| Directional light, shadow maps, ambient | works | see `base-ai-3d` MainView |
| Float textures filled from the CPU (RGBA32F) | works, linear filtering | `createDataTexture(w, h, { float: true })` |
| Camera rendering into a `RenderTexture` | works, **8 bits per channel only** | `createTexturePass()` |
| Float render targets (RGBA16F/32F) | **not available** | the engine replaces the requested format with the screen format |
| Runtime `TextureCube` | works | `TextureCube.reset` + `uploadData(pixels, 0, face)` |
| Per-frame geometry | works | `createDynamicMesh` + `updateDynamicMesh()` |
| `dFdx` / `fwidth` | works | `#pragma extension([GL_OES_standard_derivatives, __VERSION__ < 300])` |

Because render targets are 8-bit, a simulation that needs float state (height
fields, velocities, particles) runs on the CPU in typed arrays and is uploaded
into a float data texture every frame. A 256×256 grid is cheap in JavaScript:
the `pool-water` demo in
[enji-demos](https://github.com/kurenai-studio/enji-demos), a port of the
three.js pool, spends 4.8 ms per frame on it on average (p95 6.9 ms) and runs
at 59 FPS.
Render passes are still useful for data that fits in 0–1 at 8 bits, such as
caustics maps, blurs and baked lookups.

## Custom effects

Put effects under `assets/resources/effects/` and load them with
`loadEffect('effects/<name>')` from `assets/kurenai/helpers.ts`. A minimal lit
world-space effect:

```yaml
CCEffect %{
  techniques:
  - passes:
    - vert: vs:vert
      frag: fs:frag
      properties:
        tint: { value: [1, 1, 1, 1], editor: { type: color } }
        mainTexture: { value: white }
}%

CCProgram vs %{
  precision highp float;
  #include <builtin/uniforms/cc-global>
  #include <builtin/uniforms/cc-local>
  in vec3 a_position;
  in vec3 a_normal;
  in vec2 a_texCoord;
  out vec3 v_world;
  out vec3 v_normal;
  out vec2 v_uv;
  vec4 vert () {
    vec4 world = cc_matWorld * vec4(a_position, 1.0);
    v_world = world.xyz;
    v_normal = normalize((cc_matWorldIT * vec4(a_normal, 0.0)).xyz);
    v_uv = a_texCoord;
    return cc_matProj * cc_matView * world;
  }
}%

CCProgram fs %{
  precision highp float;
  #include <builtin/uniforms/cc-global>
  in vec3 v_world;
  in vec3 v_normal;
  in vec2 v_uv;
  uniform sampler2D mainTexture;
  uniform Params { vec4 tint; };
  vec4 frag () {
    vec3 toEye = normalize(cc_cameraPos.xyz - v_world);
    float rim = 1.0 - max(dot(toEye, normalize(v_normal)), 0.0);
    return vec4(texture(mainTexture, v_uv).rgb * tint.rgb + rim * 0.2, 1.0);
  }
}%
```

Rules that differ from plain WebGL / three.js:

- `vert()` returns the clip-space position and `frag()` returns the color; the
  engine writes `main()`.
- Every non-sampler uniform lives in a named `uniform Block { ... };`. Samplers
  (`sampler2D`, `samplerCube`) are declared on their own.
- Each uniform you want to set from code must be listed under `properties`
  with a default value. Set it with `material.setProperty('tint', color)`;
  vectors take `Vec4` / `Color`, textures take `Texture2D` / `RenderTexture` /
  `TextureCube`. Texture defaults are names: `white`, `black`, `grey`, `normal`.
- Engine uniforms come from includes: `cc-global` (`cc_cameraPos`, `cc_time`,
  `cc_matView`, `cc_matProj`, ...) and `cc-local` (`cc_matWorld`,
  `cc_matWorldIT`). Write GLSL 3 (`in`/`out`, `texture()`); the engine converts
  for WebGL 1.
- Blend, depth and cull state go on the pass, for example
  `blendState: { targets: [{ blend: true, blendSrc: src_alpha, blendDst: one_minus_src_alpha }] }`,
  `depthStencilState: { depthWrite: false }`, `rasterizerState: { cullMode: none }`.
  A pass with blending enabled is drawn in the transparent queue, after opaque
  geometry (the pipeline picks the queue from `blendState.targets[0].blend`).

Create the material in code:

```ts
const effect = await loadEffect('effects/water');
const material = new Material();
material.initialize({ effectAsset: effect, defines: { USE_CAUSTICS: true } });
material.setProperty('tint', new Color(80, 160, 255, 255));
renderer.setSharedMaterial(material, 0);
```

### Shader compile errors

A shader compiles when a material that uses it is first created or drawn, not
at `kurenai import` / asset refresh (an effect with GLSL errors still imports as ok). The failure
then shows up in `kurenai logs --errors` as one entry:

```json
{
  "line": "[Browser ERROR] shader compile failed: assets/resources/effects/water.effect:42 (fs) 'foo' : undeclared identifier",
  "shader": {
    "effect": "assets/resources/effects/water.effect",
    "program": "fs",
    "errors": [{ "effectLine": 42, "glslLine": 37, "message": "'foo' : undeclared identifier", "source": "vec3 c = foo * 2.0;" }]
  }
}
```

`effectLine` is the line in your `.effect` file. It is missing when the error
is in an included chunk; `source` then shows the generated line. Fix the file;
the watcher re-imports it and the page reloads.

### Shared chunks

Put shared GLSL in `.chunk` files and include them from the effect with a path
relative to the effect: `#include "./chunks/common.chunk"`. A relative
`#include` inside a chunk resolves against the including effect's folder, not
the chunk's, so do not nest chunk includes; include every chunk the program
needs directly from the effect, in dependency order. When an effect fails to
import, `kurenai asset info` currently reports only `import failed`; check include
paths first.

## Recipes

All helpers below live in `assets/kurenai/helpers.ts`.

### Simulation state in a float texture

```ts
const size = 256;
const texture = createDataTexture(size, size, { float: true });
const data = new Float32Array(size * size * 4); // r = height, g = velocity, b/a = normal

update() {
  stepSimulation(data);       // plain JS over typed arrays
  texture.uploadData(data);   // once per frame
}
```

Sample it in any shader stage (`texture(heightMap, uv)` works in vertex
shaders on WebGL 2, so a grid mesh can be displaced on the GPU).

### Render into a texture

```ts
const target = new RenderTexture();
target.reset({ width: 1024, height: 1024 });
const pass = createTexturePass(scene, causticsMaterial, target, {
  priority: -100,   // default
  mesh: waterGrid,  // optional: draw this instead of the full-screen quad
});
otherMaterial.setProperty('causticTex', target);
```

The pass effect's vertex shader outputs clip-space positions itself
(`return vec4(a_position.xy * 2.0, 0.0, 1.0);` for the quad). Texel (u, v) of
the target receives clip position (u * 2 - 1, v * 2 - 1), with no Y flip
(verified on WebGL 2 by reading the target back), so a shader that samples the
target at `clip.xy * 0.5 + 0.5` reads what the pass wrote there. A custom
`mesh` is still frustum-culled by the pass camera, which frames local x, y in
[-1, 1] (times the target aspect in x): keep the mesh bounds inside that
square. Swap geometry or material later through `pass.renderer`.

Passes render in ascending `priority`, before any camera with a higher
priority; keep the scene camera above all passes. Each pass uses its own user
layer (bits 0–19), so give the scene camera `visibility = Layers.Enum.DEFAULT`
to keep pass geometry out of the main view.

### Geometry that changes every frame

```ts
const mesh = utils.MeshUtils.createDynamicMesh(0, firstGeometry, undefined, {
  maxSubMeshes: 1, maxSubMeshVertices: 100000, maxSubMeshIndices: 300000,
});
renderer.mesh = mesh;
// each frame
updateDynamicMesh(renderer, { positions, normals, indices32, minPos, maxPos });
```

`mesh.updateSubMesh` alone leaves the renderer drawing the first frame's index
and vertex counts, which shows up as stale triangles once the geometry shrinks.
`updateDynamicMesh` also calls `renderer.onGeometryChanged()`.

### Cube map made in code

```ts
const cube = new TextureCube();
cube.reset({ width: 128, height: 128, format: Texture2D.PixelFormat.RGBA8888, mipmapLevel: 1 });
for (let face = 0; face < 6; face++) cube.uploadData(facePixels(face), 0, face);
material.setProperty('skyMap', cube); // samplerCube skyMap;
```

Face order: +X, -X, +Y, -Y, +Z, -Z, laid out as in the GL spec (sampling
`texture(skyMap, dir)` with the same directions you baked matches, no flip).

### Models from Blender (glTF)

Export `.glb` into `assets/resources/models/`, refresh / `kurenai asset info` on the files,
then take the mesh out of the generated prefab and use your own material:

```ts
const prefab = await preloadModel('models/B_room_a');
const mesh = prefab.data.getComponentsInChildren(MeshRenderer)[0].mesh!;
renderer.mesh = mesh;
renderer.setSharedMaterial(castleMaterial, 0);
```

The importer reads only `COLOR_0` as `a_color`; `COLOR_1` and later are
dropped. Blender's glTF exporter defaults to
`export_all_vertex_colors=True`, which can write a white `COLOR_0` and move
your data to `COLOR_1`; export with `export_vertex_color='NAME'`,
`export_vertex_color_name='<attribute>'`, `export_all_vertex_colors=False`
and check the accessors before importing. `infinity-castle/tools/export_blocks.py`
in [enji-demos](https://github.com/kurenai-studio/enji-demos) is a working
headless export script.

### Built-in PBR materials

Prefer a `.mtl` under `assets/resources/materials/` that references the
effect's uuid (the `--3d` template ships `standard.mtl`); Creator builds only
include builtin effects that some asset references. `loadBuiltinEffect('builtin-standard')`
is fine for quick experiments in preview.

## Gotchas

- Use ES imports (`import { MeshRenderer } from 'cc'`). The global `cc` object in
  the browser console is a partial legacy namespace; `cc.MeshRenderer` may be
  undefined even though the class works.
- A background browser tab is throttled to a few frames per second; bring the
  preview tab to the front before judging frame rate.
- The preview engine logs `Cocos Creator v4.0.0`; that is the bundled runtime
  aligned with PinK / Creator 4.0.
