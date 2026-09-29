# Cocos project rules (Kurenai)

This is a Cocos Creator 4 project driven by cocos-cli. There is no editor:
write prefab and material files directly, and write TypeScript for behaviour.

## Where to write

- Game code goes under `assets/game/`. Create files and folders freely.
- `assets/game/MainView.ts` must export `class MainView` with `bind(root: Node)`.
  It is the entry point: `assets/kurenai/Boot.ts` runs
  `root.addComponent(MainView).bind(root)` when the scene starts.
- Prefabs go under `assets/resources/prefabs/`, materials under
  `assets/resources/materials/`, other files (images, audio) under `assets/resources/`.
- Do not edit `assets/kurenai/Boot.ts` or `*.scene`.
- Never write or edit `.meta` files. The engine creates them when it imports a
  file and assigns the uuid. Get uuids with `kurenai asset info <file>`.
- `assets/kurenai/helpers.ts` holds small helpers (`loadPrefab`, canvas, labels).
  Read and extend it when useful.

## Prefabs: structure and look

Describe node trees, transforms and render components in `.prefab` files.

- A prefab must not contain script components (no TypeScript classes).
- A prefab must not reference another prefab. Compose prefabs in code.
- A prefab may reference materials, meshes and textures by uuid.
- Minimal form: element 0 is `cc.Prefab` with `data` pointing at the root node;
  nodes list `_children` / `_components` by `{ "__id__": n }` and child nodes set
  `_parent`; components set `node`. Unspecified fields take engine defaults, and
  `cc.PrefabInfo` is not required. See `assets/resources/prefabs/` in the 3D
  template for examples.
- The importer may reformat a prefab file, so read it again before editing.

## Getting uuids from the engine

Write the source file (`.mtl`, image, ...), then run:

```sh
kurenai asset info assets/resources/materials/red.mtl
```

It makes the engine import the file (creating its `.meta`) and prints
`{ ok, asset: { uuid, type, url, subAssets: [{ uuid, name, type }] } }`.
`ok: false` means the import failed; fix the file and run it again.
Reference the main asset by `uuid`; use a sub-asset `uuid` for things like an
image's texture or sprite frame.

## Materials

Write `.mtl` files that point at a builtin effect. Lit material example
(`_props` keys are effect properties):

```json
{
  "__type__": "cc.Material",
  "_effectAsset": { "__uuid__": "c8f66d17-351a-48da-a12c-0212d28575c4" },
  "_techIdx": 0,
  "_defines": [{}],
  "_props": [{ "mainColor": { "__type__": "cc.Color", "r": 220, "g": 60, "b": 50, "a": 255 }, "roughness": 0.5, "metallic": 0.1 }]
}
```

Unlit / effect materials use `builtin-unlit` and pick a technique with `_techIdx`:

| `_techIdx` | technique | blend | cull |
|---|---|---|---|
| 0 | opaque | none | back |
| 1 | transparent | alpha | **back** |
| 2 | add | additive | none |
| 3 | alpha-blend | alpha | none |

Flat meshes (slash arcs, decals, quads seen from below) vanish under back-face
culling. Use technique 3, or override the pass state per material:
`"_states": [{ "rasterizerState": { "cullMode": 0 } }]` (0 = none).

A handwritten `.mtl` ignores `mainTexture` unless `_defines` turns the sampler
on: `builtin-standard` needs `"USE_ALBEDO_MAP": true`; `builtin-unlit` needs
`"USE_TEXTURE": true`. Example unlit textured material:

```json
{
  "__type__": "cc.Material",
  "_effectAsset": { "__uuid__": "a3cd009f-0ab0-420d-9278-b9fdab939bbc" },
  "_techIdx": 0,
  "_defines": [{ "USE_TEXTURE": true }],
  "_props": [{
    "mainTexture": { "__uuid__": "<texture-uuid>" },
    "mainColor": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 }
  }],
  "_states": [{ "rasterizerState": { "cullMode": 0 } }]
}
```

Runtime meshes do not need a prefab. Build one with
`utils.MeshUtils.createMesh({ positions, normals, uvs, indices })` and assign
it to a `MeshRenderer`. In this engine mesh UV **v=0 is the top of the image**.
Do not search engine sources or `node_modules` for this API.

Vertex colours: `builtin-standard` / `builtin-unlit` convert vertex colour with
`SRGBToLinear`, but glTF `COLOR_0` is already linear. Textureless vertex-colour
models (most low-poly kits) render far too dark, dark greens almost black.
Copy the effect under `assets/resources/effects/`, drop that conversion, and
point the model's materials at the copy (see `replaceMaterials`).

## Builtin asset uuids

| Asset | uuid |
|-------|------|
| effect `builtin-standard` (lit) | `c8f66d17-351a-48da-a12c-0212d28575c4` |
| effect `builtin-unlit` | `a3cd009f-0ab0-420d-9278-b9fdab939bbc` |
| material `standard-material` | `620b6bf3-0369-4560-837f-2a2c00b73c26` |
| mesh box | `1263d74c-8167-4928-91a6-4e2672411f47@a804a` |
| mesh sphere | `1263d74c-8167-4928-91a6-4e2672411f47@17020` |
| mesh plane | `1263d74c-8167-4928-91a6-4e2672411f47@2e76e` |
| mesh quad | `1263d74c-8167-4928-91a6-4e2672411f47@fc873` |
| mesh cylinder | `1263d74c-8167-4928-91a6-4e2672411f47@8abdc` |
| mesh cone | `1263d74c-8167-4928-91a6-4e2672411f47@38fd2` |
| mesh capsule | `1263d74c-8167-4928-91a6-4e2672411f47@801ec` |
| mesh torus | `1263d74c-8167-4928-91a6-4e2672411f47@40ece` |

## Code: behaviour

- Load prefabs by path with `loadPrefab('prefabs/Name')`, add the instance to
  the scene, then attach behaviour with `node.addComponent(SomeView).bind(node)`.
- A view implements `IView` (`assets/kurenai/IView.ts`) and finds its nodes in
  `bind(root)` with `root.getChildByPath('Child/Path')`.
- Do not use `@property` fields that expect editor-assigned references.
- `@ccclass` names must be unique across the project.
- Layout: `view.getVisibleSize()` is the **live viewport**, not design
  resolution. Use `getDesignSize()` from helpers when laying out UI for the
  project design size.
- Desktop pointer: `TOUCH_MOVE` only fires while a button is held. Use
  `onPointerMove(node, handler)` from helpers (binds touch + mouse move).
- Labels: `addLabel` attaches `UIOpacity` for you. Default fonts may not include
  emoji / special symbols — prefer ASCII for HUD text.
- `UIOpacity` does not fade `Graphics`; animate the alpha of `fillColor` /
  `strokeColor` and redraw instead.
- GLB / glTF / FBX: put the file under `assets/resources/` and call
  `loadModel('models/tower')` (for `assets/resources/models/tower.glb`). The
  main asset is a plain `cc.Asset` and cannot be instantiated; the import
  already generates a complete prefab (all meshes, materials, hierarchy) at
  `models/tower/tower`. Do not hand-write wrapper prefabs that reference a
  single mesh — multi-mesh models lose their other parts.
- Many copies of one model (enemies, props): `const prefab = await
  preloadModel('models/slime')` once, then `instantiate(prefab)` per copy.
- Swap a model's materials by the names the file gave them:
  `replaceMaterials(node, { M_Prop: myMaterial })`.
- Facing: glTF models face +Z, so turn one toward `(dx, dz)` with
  `node.setRotationFromEuler(0, yawToward(dx, dz), 0)`. Cocos' own forward
  (`Node.forward`, cameras, `lookAt`) is -Z. Check the kit's README: some kits
  face +X.
- Asset kits: `kurenai kit add <folder|zip|kura-pack-id>` copies the web files
  (glb/gltf, audio) to `assets/resources/kits/<kit>/{models,audio}/`, prints
  their resource paths, and copies the kit README to `docs/kits/<kit>.md`. Read
  the README for axes, pivots and assembly offsets.
- Cameras: `lookAt()` from straight above/below the target used to silently
  reset rotation to identity; kurenai's engine now picks another up axis. On
  older engines pass an explicit `up` (e.g. `Vec3.FORWARD`) for top-down views.
- One `@ccclass` Component per file. A second Component class in the same
  file aborts preview boot with `Cannot set properties of null (setting
  '_sealed')`.
- Preview transpiles scripts without type checking: a missing import compiles
  and only fails at runtime (`ReferenceError`). Run `kurenai check` (≈1 s) after
  edits; `publish` runs the same check and fails on type errors.

## Feedback loop

Saving a file refreshes the asset database, recompiles scripts and reloads the
preview automatically. Change source files, not the running page. Every save
reloads, so a half-finished multi-file edit logs errors for the in-between
state; finish related edits before judging `logs`.

`kurenai logs --errors` lists errors (stack traces folded into `detail`) logged
since the last successful preview boot; older ones are fixed by later edits and
only counted as `superseded`. Add `--all` to see them anyway.

When `kurenai asset info` returns `ok: false`, the host also writes a line like
`[kurenai-host] asset-error path=… reason=…` to its log buffer. Run
`kurenai logs --errors` to list import failures alongside compile errors.

## Publish

While developing, look at the preview. `kurenai host start` once, then save;
the host reloads the scene. Confirm with `kurenai logs --errors` and
`kurenai check`. Do not run `kurenai publish` until the user asks for a build
to hand over. Publish is a full web package and takes several minutes; the
preview already runs the same scene.

`kurenai publish --release` for anything you hand over (minified engine, no
source maps; the default debug build is several times larger). The build only
contains the engine modules in `settings/cocos.config.json` → `includeModules`,
while preview always has all of them. Physics, spine, dragon-bones, tiled-map,
terrain, video and webview are left out; publish refuses to build if scripts use
one of them and names the module to add back.

## Cookbook: material → prefab → View

End-to-end pattern for one mesh with a custom lit material (3D template paths).

1. **Write the material** — create `assets/resources/materials/red.mtl` (see
   [Materials](#materials) for `_effectAsset` / `_props`). Do not add a `.meta`.
2. **Import and read uuid** — from the project root:

   ```sh
   kurenai asset info assets/resources/materials/red.mtl
   ```

   Copy `asset.uuid` from the JSON when `ok` is true; fix the file if import
   failed.
3. **Write the prefab** — add `assets/resources/prefabs/RedBox.prefab`: root
   `cc.Node` + `cc.MeshRenderer` with `_mesh` from
   [Builtin asset uuids](#builtin-asset-uuids) (e.g. box) and `_materials`:
   `[{ "__uuid__": "<material-uuid-from-step-2>" }]`. No script components.
4. **Load and bind in code** — in `MainView` (or another view), spawn the prefab
   and attach behaviour on the instance:

   ```ts
   const box = await loadPrefab('prefabs/RedBox');
   root.addChild(box);
   box.addComponent(RedBoxView).bind(box);
   ```

   Implement `RedBoxView` with `bind(root)` using `getChildByPath` if the
   prefab has named children.

After each file change, the host refreshes imports and reloads the preview;
re-run `kurenai asset info` only when you need an updated uuid.
