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

## Builtin asset uuids

| Asset | uuid |
|-------|------|
| effect `builtin-standard` (lit) | `c8f66d17-351a-48da-a12c-0212d28575c4` |
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

## Feedback loop

Saving a file refreshes the asset database, recompiles scripts and reloads the
preview automatically. Change source files, not the running page.

When `kurenai asset info` returns `ok: false`, the host also writes a line like
`[kurenai-host] asset-error path=… reason=…` to its log buffer. Run
`kurenai logs --errors` to list import failures alongside compile errors.

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
