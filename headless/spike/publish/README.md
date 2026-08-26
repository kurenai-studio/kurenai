# Headless publish

Freeze the preview boot chain into a static `dist/<platform>/` tree.
No Cocos Creator install required (runtime-kit + mini-packer).

## Quick start

```powershell
cd D:\tempWorkspace\headless-cocos
# Ensure runtime/3.8.8 kit is present (see docs/runtime-kit.md)
node spike/publish/cli.mjs --project=path\to\project --platform=web
# → path\to\project\dist\web

# Serve with the dist helper (handles /engine_external, /src/effect.bin, /query-extname)
node spike/serve-dist.mjs --root=path\to\project\dist\web --port=7480
# Remote console: http://127.0.0.1:7480/?remoteConsole=my-session
```

> Plain `npx serve` is not enough for this preview-compatible tree: the engine also needs `/engine_external/?url=…`, `/src/effect.bin`, and `/query-extname/<uuid>`.

## Architecture

1. **PublishIR** — library paths, rewritten settings, bundle configs, packer build output, engine kit
2. **Platform plugins** — `web` (MVP); add `@kurenai-studio/platform-*` later via same interface
3. CLI / `publishProject()` / Kurenai tool `kurenai_publish`

See [GAP-MAP.md](./GAP-MAP.md) for URL→file mapping.

## Platforms

| id | status |
|----|--------|
| `web` | implemented — static preview-compatible tree |
| `playable` | planned (`inherits: web`) |
| `wechat` | planned — adapter plugin |

```powershell
node spike/publish/cli.mjs --list-platforms
```
