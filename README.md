# Kurenai Studio

Cocos vibe coding on top of [cocos-cli](https://github.com/SUD-GLOBAL/cocos-cli):
a live preview per project, a runtime scene inspector, and a command line for
coding agents.

> Status: migrated off the DSH plugin and the historical `headless-cocos` stack.
> The preview runs cocos-cli's own runtime, asset-db and script packer. Agents
> use the `kurenai` CLI; there is no MCP server.
> See [`docs/cocos-cli-migration.md`](docs/cocos-cli-migration.md).

## Product loop

```text
Agent writes files under assets/ (prefabs, materials, TypeScript views)
  → cocos host watcher → asset-db refresh (.meta, import, compile)
  → cocos-cli live reload refreshes the preview
  → agent reads uuids and errors through `kurenai asset info` / `kurenai logs`
```

Prefabs describe structure and look and carry no scripts; code loads them by
path and attaches behaviour with `addComponent(View).bind(root)`. `.meta` files
are always written by the engine. The rules agents follow live in
[`templates/shared/AGENTS.md`](templates/shared/AGENTS.md), copied into every
new project.

## Pieces

- `bin/kurenai.mjs` — the CLI (see below).
- `bin/kurenai-cocos-host.mjs` — one long-lived process per project. Loads
  cocos-cli, starts its game preview, watches `assets/` (or polls with
  `WATCH_POLL=1`) and exposes `/__kurenai/status`, `/__kurenai/refresh`,
  `/__kurenai/asset` and `/__kurenai/logs`. Advertises itself in
  `<project>/temp/kurenai-host.json`.
- `src/preview/controller.ts` — starts the host (or attaches to one the CLI
  started) and puts `PreviewBridge` in front of it.
- `src/preview/bridge.ts` — reverse proxy that injects the inspector and keeps
  every preview request on the bridge origin.
- `src/project/control.ts` — project detection, template initialization,
  selection context and publish through `cocos build`.
- `src/inspector-runtime/` — browser runtime for scene tree, selection and 2D
  hit testing.
- `templates/` — `base-ai` (2D) and `base-ai-3d` project templates plus the
  `shared` layer (Boot entry, helpers, `AGENTS.md`).

## Requirements

- Node.js 22+
- A cocos-cli install. Defaults to
  `~/Library/Application Support/cocos-default/cocos-4.0.0-alpha.33` (installed
  by PinK); override with `KURENAI_COCOS_CLI_ROOT` or the `cocosCliRoot` option.
  The host uses cocos-cli internals (`dist/core/*`), so keep the version pinned.

## Install

Not published to npm; install from GitHub:

```sh
git clone https://github.com/kurenai-studio/kurenai.git
cd kurenai
npm install
npm link   # optional: puts `kurenai` on PATH
```

`lib/` is committed, so no build step is needed to use the CLI.

## CLI

```sh
kurenai init ./my-game --template base-ai-3d
cd my-game
kurenai host start                 # background preview host; prints the preview URL
kurenai asset info assets/resources/materials/red.mtl   # engine-assigned uuid, sub-assets
kurenai logs --errors              # compile errors and browser console
kurenai context                    # project state + AGENTS.md
kurenai publish --platform web-desktop --out ./dist
kurenai host stop
```

Commands that need the host start it when it is not running. Output is JSON.

## Library

```ts
import { ProjectControl } from "@kurenai-studio/kurenai";

const control = new ProjectControl({ scene: "db://assets/main.scene" });
await control.initialize("/path/to/new-game", "base-ai-3d");
const preview = await control.startPreview("/path/to/new-game");
console.log(preview.url); // bridge URL with the inspector injected

await control.publish("/path/to/new-game", { platform: "web-desktop" });
await control.stopServer(); // stops the bridges and any hosts it started
```

## Development

```sh
npm install
npm run check
```

## Agent swarm

Parallel workers claim GitHub issues labeled `swarm:available`. Claim, branch, PR, and
manager review rules live in [`docs/SWARM.md`](docs/SWARM.md).

## Limitations

- In Docker (bind-mounted project dirs), set `WATCH_POLL=1` on the cocos host;
  see [`docs/docker-watch-poll.md`](docs/docker-watch-poll.md).
- Canvas picking targets 2D `UITransform` bounds; 3D raycasting is not
  implemented.
- Materials created from code can only use `builtin-unlit`; write `.mtl` files
  for lit materials.
- Publishing supports `web-desktop` and `web-mobile`.

## License

Kurenai source code is MIT licensed. cocos-cli, the Cocos engine and other
vendor assets are not part of this repository and remain under their
respective licenses.
