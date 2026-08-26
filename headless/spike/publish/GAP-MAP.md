# Publish gap map — preview boot → static dist

Source of truth: `spike/preview-mirror.mjs` `mapPath` + rewrite handlers.
Goal: freeze these into `dist/web/` so `npx serve dist/web` boots without preview-mirror.

## URL → publish action

| Preview URL | Today | Publish action |
|-------------|-------|----------------|
| `/` `index.html` | CACHE + spawn boot inject | Copy CACHE; inject optional static note; keep relative `./` |
| `/index.css` `/favicon.ico` | CACHE | Copy |
| `/settings.js` | CACHE + `rewriteSettings` | Write rewritten file |
| `/scripting/polyfills/bundle.js` | CACHE | Copy |
| `/scripting/systemjs/system.js` | CACHE | Copy |
| `/scripting/import-map-global` | CACHE | Copy |
| `/preview-app/*.js` | CACHE | Copy (preview shell; MVP accepts preview-app boot) |
| `/scripting/engine/bin/.cache/dev/preview/**` | runtime-kit engine | Copy tree; rewrite spine import-map |
| `/scripting/x/chunks/**` | preview-mini overlay / preview | Run mini-packer → `targets/build`, copy to `scripting/x/` |
| `/scripting/x/*.json` (import-map, records) | Creator preview pack | Prefer mini build records; fallback preview |
| `/assets/main/config.json` | CACHE + `rewriteMainConfig` | Write rewritten config |
| `/assets/internal/**` | CACHE snapshot | Copy CACHE internal |
| `/assets/<bundle>/config.json` | `buildBundleConfig` synth | Write synth to disk |
| `/assets/<bundle>/index.js` | empty System.register | Write synth |
| `/assets/*/import|native/**` | `library/` (+ internal-library) | Copy uuid files referenced by configs |
| `/scene/<uuid>.json` | library | Copy launch + listed scenes |

## Already reusable

- `findBundles` / `buildBundleConfig` / `collectHeadlessAssets` / `rewriteMainConfig` / `rewriteSettings`
- mini-packer `spike/packer/build.cjs` (`--out=`)
- runtime-kit (`resolveEngineSnapshot`)

## Gaps closed by this publish MVP

1. Settings/bundle synth only lived in HTTP rewrite → pure functions + write to dist
2. No build-target packer out dir convention → `targets/build`
3. No platform plugin surface → `spike/publish/platforms/*`
4. No kurenai tool → `kurenai_publish`

## Still deferred

- Official web-mobile boot (non preview-app) / ccbuild release engine trim
- Per-bundle script splitting
- Native / wechat adapters (plugin stubs only)
- Full library prune (MVP may copy broad uuid set from configs)
