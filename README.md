# Kurenai Studio

DSH-native Cocos vibe coding: chat beside a live Headless Cocos preview, inspect
the runtime scene tree, click a node, and use that selection as precise agent
context.

> Status: working MVP. Kurenai directly uses each DSH session's workspace
> directory as its Cocos project root.

## Product loop

```text
Click a node in the preview
  → Kurenai Inspector resolves node/path/components
  → selection becomes DSH chat context
  → agent edits the Cocos project on disk
  → Headless Cocos compiles and HMR refreshes the iframe
```

Kurenai intentionally edits source files rather than mutating only the browser
runtime, so changes survive reload and remain reviewable.

## Workspace workflow

Kurenai does not maintain an independent project registry.

- **New project** — create/open an empty DSH Workspace, then choose the
  `base-ai` 2D template or `base-ai-3d` template from the supplied
  `headless-cocos` checkout.
- **Existing project** — open the Cocos project directory as a DSH Workspace;
  Kurenai detects it from `package.json` and starts the preview.
- **Continue work** — reopen the existing DSH Workspace/session. DSH remains
  the source of truth for project paths, recent workspaces and conversations.

## Repository surfaces

- `src/index.ts` — DSH host plugin and preview lifecycle tools.
- `src/preview/controller.ts` — starts/stops an external Headless Cocos checkout.
- `src/project/` — current-DSH-workspace detection, initialization and local
  preview control API.
- `src/client/` — DSH shell overlay that splits chat on the left from the
  preview/Inspector workspace on the right.
- `src/inspector-runtime/` — browser runtime for scene tree, selection and
  initial 2D UI hit testing.
- `src/shared/protocol.ts` — versioned `postMessage` contract between iframe and
  DSH.

## Current DSH tools

- `kurenai_project_initialize`
- `kurenai_project_current`
- `kurenai_preview_start`
- `kurenai_preview_status`
- `kurenai_preview_stop`

## Development

```powershell
npm install
npm run check
```

Install a development build into a DSH profile after building:

```powershell
dsh plugin --profile <profile> add <absolute-path-to-this-repo>
```

Configure the generated Cordis row with the Cocos project and a local
`headless-cocos` checkout:

```yaml
- id: kurenai
  name: "@kurenai-studio/dsh-plugin-kurenai"
  config:
    port: 7460
    controlPort: 7459
```

Point to the Headless Cocos stack through `KURENAI_HEADLESS_ROOT`. The project
path is always read from the active DSH session cwd.

The runtime kit and Cocos engine binaries are deliberately not distributed by
this repository. Follow the Headless Cocos runtime-kit instructions and Cocos
licensing requirements.

## MVP limitations

- DSH does not expose a native center-split slot. Kurenai mounts through the
  additive `shell.overlay` slot and temporarily reserves right-side frame
  padding while open, preserving the original conversation and composer.
- Selecting a node can copy a structured context block. Direct insertion into
  the active DSH composer still needs a supported conversation API adapter.
- Initial canvas picking targets 2D `UITransform` bounds. Camera-aware 3D
  raycasting and complex multi-camera scenes are not implemented.

## License

Kurenai source code is MIT licensed. Cocos Creator engine snapshots, packer
binaries and other vendor assets are not part of this repository and remain
under their respective licenses.
