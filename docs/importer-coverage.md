# Importer coverage: headless-cocos spike vs cocos-cli asset-db

Survey date: **2026-09-24** (WORKER-P).  
Pinned cocos-cli install: `cocos-4.0.0-alpha.33` (`cocos-cli` **0.0.1-alpha.41**), default path:

`~/Library/Application Support/cocos-default/cocos-4.0.0-alpha.33`

Override with `KURENAI_COCOS_CLI_ROOT` (same layout as above).

Headless reference: [shinjiyu/headless-cocos](https://github.com/shinjiyu/headless-cocos) `spike/importers/*.cjs` (13 files; 10 user-facing importers + helpers). Inventory: [`archive-headless-inventory.md`](./archive-headless-inventory.md).

## How cocos-cli registers handlers

All production importers are listed in:

`dist/core/assets/asset-handler/config.js` → `assetHandlerInfos[]`

Each entry has a handler `name` (stored in `.meta` as `importer`), file `extensions`, and a lazy `load()` into `dist/core/assets/asset-handler/assets/<name>.js`. Sub-resource handlers (e.g. `gltf-mesh`, `sprite-frame`) usually have empty `extensions` and are chosen by `validate()` on imported parents.

Quick listing on a machine with the install present:

```bash
node -e "const c=require('$KURENAI_COCOS_CLI_ROOT/dist/core/assets/asset-handler/config.js'); console.log(c.assetHandlerInfos.map(h=>h.name).join('\n'))"
```

(`KURENAI_COCOS_CLI_ROOT` defaults to the Application Support path above.)

## Headless spike modules (baseline)

| Module | Role |
|--------|------|
| `image.cjs` | Raster images → texture + sprite-frame submetas |
| `audio.cjs` | Audio clips |
| `font.cjs` | TTF |
| `bmfont.cjs` | BMFont `.fnt` + page PNG |
| `spine.cjs` | Spine JSON / `.skel` + atlas pages |
| `plist.cjs` | TexturePacker plist → `sprite-atlas` or Cocos particle plist |
| `gltf.cjs` | glTF/GLB (large custom KHR / morph / skin scope) |
| `fbx.cjs` | FBX via external `fbx2gltf` → reuses glTF path |
| `text.cjs` | Plain text / markdown-like files |
| `polyhaven.cjs` | **Not an importer** — downloads HDR/glTF from Poly Haven API, then writes glTF meta |
| `ccon.cjs`, `_notepack_*.cjs` | Encoding helpers for glTF/spine pipeline |

Headless did **not** ship spike importers for prefab/scene, `.mtl`, TypeScript compile, DragonBones, Tiled, terrain, effects, animation graphs, etc.; those relied on a pre-built `library/` or Creator-side import.

## Agent-relevant coverage matrix

Status for kurenai after switching to cocos-cli host (`bin/kurenai-cocos-host.mjs`):

| Asset type | Extensions / detection | cocos-cli handler | Headless spike | Gap? | Notes |
|------------|------------------------|-------------------|----------------|------|-------|
| **Prefab** | `.prefab` | `prefab` | N/A (no spike) | **ok** | M0/M1 verified: minimal prefab JSON imports, engine reformats + assigns `.meta`. Primary LLM asset type. |
| **Material** | `.mtl` | `material` | N/A | **ok** | `kurenai asset info` detects wrong importer (`*`) on broken `.mtl`. |
| **Image / Sprite** | `.png`, `.jpg`, `.webp`, … | `image` (+ sub: `texture`, `sprite-frame`) | `image.cjs` | **ok** | Headless matched Creator 3.8 library layout; cocos-cli is superset (HDR, PSD, etc.). |
| **TypeScript** | `.ts` under `assets/` | `typescript` | N/A | **ok** | Compiles via asset-db + preview scripting; headless mirror did not reimplement TS import. |
| **glTF / GLB** | `.gltf`, `.glb` | `gltf` (+ `gltf-mesh`, `gltf-material`, `gltf-animation`, `gltf-skeleton`, `gltf-scene`, …) | `gltf.cjs` | **unknown** | Both import meshes/materials/skins/animations. Headless doc lists many KHR extensions (clearcoat, sheen, transmission, Draco, meshopt, variants). cocos-cli uses engine importer — parity not exhaustively diffed here; treat exotic extensions as **verify per asset**. |
| **FBX** | `.fbx` | `fbx` | `fbx.cjs` (convert → GLB) | **ok** | cocos-cli native FBX pipeline; headless required `fbx2gltf` on PATH. |
| **Spine** | `.json` / `.skel` (Spine skeleton) | `spine-data` | `spine.cjs` | **unknown** | Headless comments target **Spine 3.8** JSON/binary. cocos-cli Creator 4 runtime expects compatible exports; **Spine 4.2** vs 3.8 not regression-tested in kurenai — validate skeleton + atlas in preview. |
| **BMFont** | `.fnt` | `bitmap-font` | `bmfont.cjs` | **ok** | Same importer name in `.meta`. |
| **TexturePacker plist** | `.plist` (atlas) | `sprite-atlas` | `plist.cjs` (atlas branch) | **ok** | Same extension as particle plist; both stacks disambiguate by content / `validate`. |
| **Particle plist** | `.plist` (particle) | `particle` | `plist.cjs` (particle branch) | **ok** | |
| **TTF font** | `.ttf` | `ttf-font` | `font.cjs` | **ok** | |
| **Audio** | `.mp3`, `.wav`, `.ogg`, … | `audio-clip` | `audio.cjs` | **ok** | |
| **Scene** | `.scene`, legacy `.fire` | `scene` | N/A | **ok** | Templates use `.scene`; LLM usually does not hand-write scenes (see migration §9). |
| **DragonBones** | `.json`, `.dbbin` | `dragonbones`, `dragonbones-atlas` | N/A | **ok** | Only in cocos-cli; no headless spike. |
| **Tiled map** | `.tmx` | `tiled-map` | N/A | **ok** | cocos-cli only. |
| **Effect / shader** | `.effect`, `.chunk` | `effect`, `effect-header` | N/A | **ok** | LLM uses builtin effects via `.mtl` for standard shading. |
| **Poly Haven download** | API / `.hdr` workflows | N/A | `polyhaven.cjs` helper | **gap** | No cocos-cli equivalent; use manual download or custom script, then import as glTF/image. Not required for kurenai core workflow. |
| **Plain text** | `.txt`, `.md`, … | `text` | `text.cjs` | **ok** | Headless also treated some `.ts` in text path in mirror heuristics; cocos-cli routes `.ts` to `typescript`. |

### Gap legend

| Value | Meaning |
|-------|---------|
| **ok** | cocos-cli handler exists and matches or exceeds headless for kurenai’s stated workflow. |
| **unknown** | Handler exists but feature/version parity with headless (or Creator editor) not proven in this survey. |
| **gap** | headless or workflow had capability with no cocos-cli counterpart. |
| **N/A** | headless spike never covered this type; cocos-cli is authoritative after migration. |

## Full cocos-cli handler catalog (alpha.33)

Handlers with **non-empty** file extensions (primary disk importers):

| Handler | Extensions |
|---------|------------|
| `text` | `.txt`, `.html`, `.htm`, `.xml`, `.css`, `.less`, `.scss`, `.stylus`, `.yaml`, `.ini`, `.csv`, `.proto`, `.ts`, `.tsx`, `.md`, `.markdown` |
| `json` | `.json` |
| `spine-data` | `.json`, `.skel` |
| `dragonbones` | `.json`, `.dbbin` |
| `dragonbones-atlas` | `.json` |
| `terrain` | `.terrain` |
| `javascript` | `.js`, `.cjs`, `.mjs` |
| `typescript` | `.ts` |
| `scene` | `.scene`, `.fire` |
| `prefab` | `.prefab` |
| `tiled-map` | `.tmx` |
| `buffer` | `.bin` |
| `image` | `.jpg`, `.png`, `.jpeg`, `.webp`, `.tga`, `.hdr`, `.bmp`, `.psd`, `.tif`, `.tiff`, `.exr`, `.znt` |
| `texture` | `.texture` |
| `texture-cube` | `.cubemap` |
| `render-texture` | `.rt` |
| `gltf` | `.gltf`, `.glb` |
| `fbx` | `.fbx` |
| `material` | `.mtl` |
| `physics-material` | `.pmtl` |
| `effect` | `.effect` |
| `effect-header` | `.chunk` |
| `audio-clip` | `.mp3`, `.wav`, `.ogg`, `.aac`, `.pcm`, `.m4a` |
| `animation-clip` | `.anim` |
| `animation-graph` | `.animgraph` |
| `animation-graph-variant` | `.animgraphvari` |
| `animation-mask` | `.animask` |
| `ttf-font` | `.ttf` |
| `bitmap-font` | `.fnt` |
| `particle` | `.plist` |
| `sprite-atlas` | `.plist` |
| `auto-atlas` | `.pac` |
| `label-atlas` | `.labelatlas` |
| `render-pipeline` | `.rpp` |
| `render-stage` | `.stg` |
| `render-flow` | `.flow` |
| `instantiation-material` | `.material` |
| `instantiation-mesh` | `.mesh` |
| `instantiation-skeleton` | `.skeleton` |
| `instantiation-animation` | `.animation` |
| `video-clip` | `.mp4` |

Additional handlers without disk extensions (derived / sub-assets): `directory`, `unknown`, `sprite-frame`, `sign-image`, `alpha-image`, `erp-texture-cube`, `texture-cube-face`, `rt-sprite-frame`, all `gltf-*` sub-handlers, etc.

## Recommendations

1. **Do not revive headless importers** for types marked **ok** — keep a single source of truth in cocos-cli asset-db.
2. For **glTF** and **Spine**, add targeted fixtures under `test/` or bench scripts when a regression is reported; update this matrix from **unknown** to **ok** or **gap**.
3. **Poly Haven** and other download helpers stay out of kurenai core; document one-off scripts in agent prompts if needed.
4. After M4 archive of headless-cocos, this file remains the checklist for “should we fork an importer?” (answer: only upstream cocos-cli gaps).

Related: [cocos-cli-migration.md §4](./cocos-cli-migration.md#4-迁移清单本机-stack-与-headless-cocos), [archive-headless-inventory.md](./archive-headless-inventory.md).
