# cocos-cli 按需拆包（面向 webgame）

目标：把「装工具链」从 **~5.4 GB 全家桶** 收成 **先装 core，再按平台/原生按需拉**。  
游戏最终 **web 产物可以很小**；这里拆的是 **开发/构建工具链下载**，不是产物体积。

测量基准：本机 PinK `cocos-4.0.0-alpha.33`（cocos-cli `0.0.1-alpha.41`）。  
复算：

```bash
node scripts/measure-cocos-split.mjs
# 或
KURENAI_COCOS_CLI_ROOT=/path/to/cocos-cli node scripts/measure-cocos-split.mjs
```

机器可读清单：[`cocos-cli-split.manifest.json`](./cocos-cli-split.manifest.json)。

## 1. 为什么「只拆平台」不够

| 块 | 约计 | 角色 |
|---|---:|---|
| `packages/engine/native` | **~2.6 GB** | 各端 native 依赖 |
| `packages/platforms/*` | **~0.7 GB** | 微信/抖音/… 小游戏插件 |
| `static/tools` 里 cmake/快游戏等 | **~0.5 GB** | 原生/厂商打包工具 |
| 其余（CLI + JS 引擎 + node_modules + web） | **~1.7 GB** | 预览与 web 构建真正刚需 |

只拆 `platforms/`，全量仍接近 **5 GB**。webgame 日常链路（`kurenai host` / `web-desktop`）**不需要** native 与小游戏平台包。

## 2. 三层模型

```text
core（必装）
  → preview、asset-db、web-desktop / web-mobile

platform:<id>（按需）
  → wechat / bytedance / alipay / …

native:<target>（按需）
  → android / ios / mac / win64 / … + cmake / engine native src
```

`web` **不是** `packages/platforms` 里的一项；它在 `static/web` + `static/build-templates` + engine JS 产物里，归 **core**。

## 3. 裁剪产物（已可本地打出）

策略（已落地）：

- **主包不含完整 `node_modules`**：解压后 `npm install --omit=dev`（图片走纯 JS `portable-sharp`；无原生模块，不触发 node-gyp）
- **主包含 webgame 打包模块**：`dist/.../web-desktop|web-mobile|web-common`；其余平台 builder 不进主包
- **其它平台打包模块不进主包**（android/ios/微信等）
- **预览必需**：`engine/bin/.cache/dev-cli` + emscripten wasm
- **无原生模块**：`gl` 已移除，`sharp` 由 `packages/portable-sharp` 替代，`@ffprobe-installer` 由 `asset-handler/media-duration.js`（纯 JS 解析 wav/mp3/aac/ogg/mp4 时长）替代

```bash
node scripts/pack-cocos-core.mjs --source "$HOME/Library/Application Support/cocos-default/cocos-4.0.0-alpha.33" --tgz --npm-install
```

实测（本机）：

| | 体积 |
|---|---:|
| 主包目录（未 npm） | **~444 MB** |
| 主包 `.tgz`（下载） | **~96 MB** |
| 解压 + `npm install` 后 | **~1.4 GB** |
| 现行 `vendor/cocos-core`（`slim-vendor`）全新 `postinstall` 后 | **417 MB** |

`postinstall`（`scripts/install-vendored-cocos.mjs`）只装根依赖，不给 `packages/engine` 装依赖，装完把相同文件硬链接（实测 370 个文件、省 80 MB，大头是 npm 分别嵌在 `@cocos/ccbuild` 和 `@cocos/tfig` 下的同一份 TypeScript 4.9.5）。

`resolveCocosCliRoot()` 默认指向包内 `vendor/cocos-core`。

| 包 | 约计 |
|---|---:|
| 全量安装 | **~5.4 GB** |
| **proposed core** | **~1.7 GB** |
| 相对全量节省 | **~3.7 GB** |
| `platform:wechat` | ~62 MB |
| `platform:bytedance` | ~64 MB |
| `native:android`（external） | ~428 MB |
| `native:win64` | ~552 MB |
| `native:tool-cmake` | ~352 MB |

对 kurenai / agent「一句话装环境」：

- 默认只保证 **core** → 能开发、预览、出 web 包  
- `publish --platform wechatgame` 再装微信独立包 **@kurenai-studio/wechat-minigame**（内含 platform:wechat 插件）  
- 出 Android 再拉 **native:engine-src + native:tool-cmake + native:android**

## 4. core 仍偏大时的下一刀（phase 2）

core 里还可继续瘦（不必阻塞 phase 1 上线）：

| 路径 | 约计 | 方向 |
|---|---:|---|
| `node_modules` | ~665 MB | 按 web 预览实际 `require` 做依赖闭包；砍掉仅原生用得到的包 |
| `packages/engine/node_modules` | ~184 MB | 已去掉：发布需要的 box2d / cannon / dragonbones 由构建包 `build` 提供 |
| `packages/engine/bin/temp` | ~113 MB | 发布 core 时剔除缓存/中间产物 |
| `packages/engine/templates` | ~9 MB | 非 web 模板挪到 native 包 |

目标体感：**core < 1 GB** 再冲击；web **产物**体积与工具链无关，保持现有 publish 管线即可。

## 5. 与 kurenai 的衔接

已实现：

```bash
kurenai packs status
kurenai packs ensure              # 默认确保 core
kurenai packs ensure platform:wechat --fetch
```

- `kurenai host start` / `PreviewController.start` → `ensurePacks(['core'])`
- `kurenai publish --platform web-*` → `ensurePacks(['core'])`
- `packsForPlatform('wechatgame')` → `['core','build','platform:wechat']`（publish 扩展平台时复用）

按需下载：设置 `KURENAI_COCOS_PACK_BASE_URL`（或 `ensure --fetch` + 该变量），包 URL 约定为：

```text
{base}/{engineVersion}/{packId_with_slashes}.tgz
# 例: https://cdn.example/packs/4.0.0-alpha.33/platform/wechat.tgz
```

tarball 解压到 `KURENAI_COCOS_CLI_ROOT` 根目录（内含 `packages/platforms/sudv2/...` 等相对路径）。

manifest 里带 `npm` 字段的包（目前只有 `platform:wechat`）不走 tgz：`ensurePacks` 先把对应 npm 包装进 `~/.kurenai/addons`（`KURENAI_ADDONS_DIR` 可改），再调用包导出的 `installPlugin(cocosCliRoot)` 放插件。包名或本地 tgz 路径可用 manifest 里的 `specEnv`（`KURENAI_WECHAT_MINIGAME_PACKAGE`）覆盖；spec 变了会重装。

### 构建包 `build`

瘦身后的 core 只够预览，任何平台的 `publish` 都要先装构建包（`packsForPlatform` 自动带上 `build`）。内容由 manifest `packs.build` 定义，从 PinK 安装原样拷出（不跑 `npm install`，保证依赖版本与 PinK 一致，例如 core-js 3.46.0）：

- `node_modules`：`@cocos/babel-preset-cc`、`@cocos/build-polyfills`、`@cocos/creator-programming-rollup-plugin-mod-lo`、`concat-with-sourcemaps`、`max-rects-packing` 及其依赖闭包中 core 没有的部分（与 core 已有包版本冲突时报错）
- 引擎：`tsconfig.json`、`@types`、`DebugInfos`、`babel.config.js`、`predefine.ts`、`extensions`、`external`、`templates` 子集（web / wechatgame / launcher / common）、emscripten 的 `*.asm.js` 与 `*.d.ts`
- 不带整个 `packages/engine/node_modules`（203 MB，大头是和根目录重复的 `@cocos/typescript`、`ccbuild`）：引擎编译用根目录的 `@cocos/ccbuild`，只补引擎可选模块直接引用的 `@cocos/box2d`、`@cocos/cannon`、`@cocos/dragonbones-js`（manifest `engineNpmPackages`）。`postinstall` 也不再给 `packages/engine` 跑 `npm install`

```bash
npm run pack:build                       # → dist-packs/{engineVersion}/build.tgz
```

实测解压后 75.9 MB（node_modules 55.3 MB + 引擎 20.7 MB），tgz 11.5 MB。

缺了引擎那三个包时构建**不会报错**：rollup 把 `@cocos/cannon`、`@cocos/box2d` 当外部依赖跳过，产物里没有物理库，运行时才出错。验证：全新安装的开发包加构建包，开启 `physics-cannon`、`physics-2d-box2d`、`dragon-bones`（模块开关在工程 `settings/cocos.config.json`）的 3D 模板能发布 web-mobile 和 wechatgame，产物含 cannon / box2d / dragonBones，与本地完整依赖构建逐文件一致。

### 渠道包

渠道包从 PinK 安装里打，只带运行时文件（`package.json`、`dist`、`static`、`i18n`，OpenPaaS 另带签名工具 `tools`），不带 `node_modules`；插件用到的 `fs-extra`、`ejs`、`jszip` 由 core 提供：

```bash
npm run pack:platform                    # 默认 platform:sudv2（微信插件改由 npm 包发）
npm run pack:platform -- --all           # 全部小游戏渠道
```

输出在 `dist-packs/{engineVersion}/platform/<dir>.tgz`，整个 `dist-packs/` 可直接当 `KURENAI_COCOS_PACK_BASE_URL` 托管。实测：

| 包 | 构建平台 | 插件原目录 | 解压后 | tgz |
|---|---|---:|---:|---:|
| `platform:wechat` | `wechatgame` | 74.5 MB | 0.6 MB | 0.2 MB |
| `platform:sudv2` | `openpaas` | 95.8 MB | 11.7 MB | 5.0 MB |

验证：在去掉 `packages/platforms` 的完整 cocos-cli 上 `packs ensure --fetch` 装这两个包后，`wechatgame` 发布构建产物与 PinK 原插件逐文件一致；`openpaas` 插件能注册，无令牌时停在取 package context。

端到端：全新的瘦身 core 上 `packs ensure build platform:wechat platform:sudv2 --fetch`（HTTP/1.0 静态服务器）后，`kurenai publish` 模板工程 `web-desktop`（3.8 MB）、`wechatgame`（3.7 MB）release 构建成功，`openpaas` 停在缺少访问令牌。`wechatgame` 与完整 PinK 构建相比只差 spine 等模块，来自 kurenai 有意的 `includeModules` 覆盖补丁（数组整体替换而非按下标合并）。

微信包额外补了 `static/cocos/signature.json`（PinK 原插件缺这个文件，`separateEngine` 会直接崩）；开启后 `game.json` 引用微信托管的 `cocos` 引擎插件 4.0.0-alpha.33，能否在真机跑通取决于微信侧是否有这个版本。

### 微信独立包 `@kurenai-studio/wechat-minigame`

微信发布相关的能力单独成包（源码在 `sub-private/kurenai-wechat`），kurenai 只在用户发微信时才装：

- 插件：`plugin/wechat` 是上面的 platform:wechat（含 signature 补丁），`installPlugin` 校验引擎版本后放进 cocos-cli
- 包体检查：`checkPackageSize` 按微信限制（主包 4 MiB、独立分包 4 MiB、总包 20 MiB，开虚拟支付 30 MiB）检查构建目录
- 分包配置：`kurenai wechat subpackage <工程> assets/<目录>` 把目录设成 bundle，小游戏下压缩类型为「小游戏分包」；Creator 3.8 写 `settings/v2/packages/builder.json`，4.0 写 `settings/cocos.config.json`
- 上传/预览：封装 `miniprogram-ci`，需要 appid、上传密钥（文件路径或 `WECHAT_MINIGAME_PRIVATE_KEY_PATH`）和公众平台 IP 白名单

`kurenai publish --platform wechatgame` 构建成功后自动跑包体检查，超限时提示用分包；`--preview` / `--upload --version x.y.z` 在检查通过后调用微信 CI。

缩包分工：微信包负责 `check`（含 `hints`）和 `propose-subpackages` / `subpackage`；引擎按需压缩在 kurenai：扫描 `assets` 脚本/场景/预制体用法，算出最小 `includeModules`（`proposeEngineCuts` / `applyMinimalEngineModules`，CLI：`kurenai engine propose-cuts [--from-build <wechatBuild>]`、`apply-cuts --minimal`）。会同步写 `settings/cocos.config.json` 与 `settings/v2/packages/engine.json`。2048 实测：31 → 6 个模块后主包 5.84 MB → 2.51 MB，过微信 4 MB。自动 rebuild 闭环仍未串上，需 apply 后再 `publish`。

复算体积：

```bash
node scripts/measure-cocos-split.mjs
```

尚待：真正发布 core/platform/native 的拆包产物到 CDN；以及 phase 2 瘦 core 的 `node_modules`。  
~~TODO：去掉 effect `finalTypeCheck` 对 `gl` 的依赖~~ — 已完成（见 migration 待办）。

## 6. 非目标

- 不把「拆包」做成改引擎玩法；只改 **分发与按需下载**。  
- 不在本阶段改 Creator 编辑器安装体验；优先服务 **CLI + kurenai + agent**。  
- 不把最终 webgame zip 体积和工具链 GB 混为一谈。
