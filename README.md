# Kurenai Studio

PinK 的升级版：项目管理、资源编译、预览、构建在同一产品里。

> Agents install **only kurenai** — no PinK / separate cocos-cli.
> The trimmed cocos runtime is the `vendor/cocos-core` source tree in this package.

## One-liner (for agents)

Paste this into a coding agent so it can install and use Kurenai on its own:

```text
自学并只用最新 kurenai（https://github.com/kurenai-studio/kurenai：clone 后 Node.js 22+ 下 `npm install && npm link`；不要单独安装完整 cocos-cli / PinK）开发 Cocos 游戏：`kurenai init` → `host start` → 按项目 `AGENTS.md` 只改 `assets/game/` 与 `assets/resources/`，用 `asset info` / `logs` / `context` 闭环，禁止手写 .meta、prefab 不挂脚本；交付时再 `kurenai publish --platform web-desktop`。
```

中文安装与用法入口：[docs/安装方法.md](docs/安装方法.md) · [docs/简单使用方法.md](docs/简单使用方法.md)

## Product shape

```text
kurenai
  ├─ CLI / inspector / templates     (agent 面)
  └─ vendor/cocos-core               (裁剪后的运行时：asset-db + preview + web build)
```

四个核心能力在一起：**项目管理 · 资源编译 · 预览 · 构建**。

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
- Network access to fetch the trimmed cocos **core** pack on first `host start` / `publish` (once the pack CDN is live)

Transitional only: if a local cocos tree already exists, `KURENAI_COCOS_CLI_ROOT` can still point at it. That is not the intended end state.

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

### Puzzle demo (M2 acceptance)

From a clean clone, `node scripts/run-puzzle.mjs` creates a temp 2D project
(`base-ai`), writes a generated `assets/resources/images/puzzle.png`, a
script-free `PuzzleTile` prefab, and `MainView` / `PuzzleTileView` (3×3 slice
swap until the picture is restored). It runs `kurenai asset info` on the image
and prefab (prints uuids), then starts the preview host.

Manual check after the host starts: open the printed `previewUrl`, tap one tile
then another to swap slices; when all nine are in the correct order the status
line shows **Complete!**

Options: `--dir <path>` for a fixed project directory, `--no-host` to skip the
host, `--cleanup` to remove the temp project (and stop the host) when finished.
Related scaffold: issue #8 (`run-puzzle.mjs` entrypoint).

### Host benchmark (RSS / ready time)

`node scripts/bench-host.mjs` initializes a temp project (default
`base-ai-3d`), runs `kurenai host start`, prints JSON with wall time to
ready and host process RSS (via `ps`), then stops the host. Requires a local
cocos-cli install; if cocos-cli is missing the script exits with a JSON error
and does not write log files. Pass `--concurrent` to start two hosts on ports
7460/7461 (useful but can be flaky under load); `--cleanup` removes temp dirs.

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

CI runs `npm run check` on pull requests to `main` (see `.github/workflows/check.yml`).

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
- Each preview host is a full cocos-cli process (~ hundreds of MB RSS); use
  `node scripts/bench-host.mjs` on your machine for repeatable numbers.

## License

Kurenai source code is MIT licensed. cocos-cli, the Cocos engine and other
vendor assets are not part of this repository and remain under their
respective licenses.
