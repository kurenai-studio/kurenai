# @kurenai-studio/wechat-minigame

WeChat mini-game publishing for Cocos `wechatgame` builds:

- **Size check** against WeChat limits: main package 4 MiB, independent subpackage 4 MiB, total 20 MiB (30 MiB with virtual payment).
- **Subpackage setup**: turns asset folders into bundles that build as WeChat subpackages. Works with Creator 3.8 (`settings/v2/packages/builder.json`) and Cocos 4.0 (`settings/cocos.config.json`).
- **Preview / upload** through [`miniprogram-ci`](https://www.npmjs.com/package/miniprogram-ci).
- **Builder plugin**: the Cocos 4.0 `wechatgame` platform plugin (`plugin/wechat`), with `static/cocos/signature.json` restored so the separate-engine option works.

kurenai installs this package on demand. `kurenai publish --platform wechatgame` fetches it into `~/.kurenai/addons`, installs the plugin, builds, and then runs the size check. Standalone use works too.

Engine on-demand compression (`includeModules` minimal set) lives in **kurenai**, not here. Design notes and measured optimizations are recorded in `sub-private/plus1-reports/pink-cli-build/REPORT.md` §3.3.

## CLI

```bash
kurenai-wechat check <buildDir> [--virtual-payment]
kurenai-wechat propose-subpackages <projectDir>
kurenai-wechat subpackage <projectDir> assets/levels [assets/audio ...] [--priority <n>] [--remove]
kurenai-wechat preview <buildDir> [--qrcode <file>] [--appid <wx...>] [--private-key <file>]
kurenai-wechat upload <buildDir> --version 1.0.0 [--appid <wx...>] [--private-key <file>] [--desc <text>]
kurenai-wechat plugin info
kurenai-wechat plugin install <cocosCliRoot>
```

Every command prints JSON. A non-zero exit means `ok: false`.

After `subpackage`, rebuild the project. Each folder ends up in `subpackages/<name>/` and is listed in `game.json` → `subpackages`.

`check` also returns `hints`: `engine-module` (for kurenai's `engine propose-cuts`) and `asset-folder` (for `propose-subpackages` / `subpackage`). Engine module edits live in **kurenai**, not this package.

## Credentials

Preview and upload need:

1. An appid. Pass `--appid`, set `WECHAT_MINIGAME_APPID`, or put it in the build's `project.config.json`.
2. The code upload key from the WeChat admin console (开发管理 → 开发设置 → 小程序代码上传). Pass `--private-key <file>`, set `WECHAT_MINIGAME_PRIVATE_KEY_PATH`, or set `WECHAT_MINIGAME_PRIVATE_KEY` to the key content.
3. The machine's public IP on the key's IP whitelist (or the whitelist turned off).

Builds that exceed the size limits are refused before anything is sent to WeChat.

## API

```ts
import {
  checkPackageSize,
  configureSubpackages,
  removeSubpackages,
  preview,
  upload,
  installPlugin,
  pluginInfo,
} from "@kurenai-studio/wechat-minigame";

const report = checkPackageSize("build/wechatgame");
configureSubpackages(".", ["assets/levels"]);
await preview("build/wechatgame", { qrcodeOutput: "preview.jpg" });
await upload("build/wechatgame", { version: "1.0.0", desc: "release" });
```

## Updating the bundled plugin

```bash
npm run sync:plugin -- --source "<PinK cocos-cli root>"
```

This copies `packages/platforms/wechat` from a PinK / cocos-cli install. It keeps only the runtime files, applies the signature patch, and records the engine version. `installPlugin` refuses a cocos-cli whose engine version doesn't match.
