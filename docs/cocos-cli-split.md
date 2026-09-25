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

从完整 PinK/cocos-cli 安装打 **web core**：

```bash
node scripts/pack-cocos-core.mjs --source "$HOME/Library/Application Support/cocos-default/cocos-4.0.0-alpha.33" --drop-temp --tgz
```

默认输出：

- 目录：`~/Library/Application Support/kurenai/cocos-core/4.0.0-alpha.33`（约 **1.8 GB**）
- 压缩包：`…/kurenai-cocos-core-4.0.0-alpha.33.tgz`（约 **350 MB**）

相对全量约省 **4 GB**。`packages/engine/native` 整棵砍掉，但保留 web 必需的 `native/external/emscripten`（box2d/physx 等 wasm）。

`resolveCocosCliRoot()` 优先用上述 managed core，不再默认依赖 PinK。本机已验证：`KURENAI_COCOS_CLI_ROOT` 指向该 core 时，`run-puzzle.mjs` 可起 host 并完成 asset import。

CDN 发布与「零本地 PinK、首次自动下载 tgz」仍待接上。

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
- `publish --platform wechatgame` 再拉 **platform:wechat**  
- 出 Android 再拉 **native:engine-src + native:tool-cmake + native:android**

## 4. core 仍偏大时的下一刀（phase 2）

core 里还可继续瘦（不必阻塞 phase 1 上线）：

| 路径 | 约计 | 方向 |
|---|---:|---|
| `node_modules` | ~665 MB | 按 web 预览实际 `require` 做依赖闭包；砍掉仅原生用得到的包 |
| `packages/engine/node_modules` | ~184 MB | 同上 |
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
- `packsForPlatform('wechatgame')` → `['core','platform:wechat']`（publish 扩展平台时复用）

按需下载：设置 `KURENAI_COCOS_PACK_BASE_URL`（或 `ensure --fetch` + 该变量），包 URL 约定为：

```text
{base}/{engineVersion}/{packId_with_slashes}.tgz
# 例: https://cdn.example/packs/4.0.0-alpha.33/platform/wechat.tgz
```

tarball 解压到 `KURENAI_COCOS_CLI_ROOT` 根目录（内含 `packages/platforms/wechat/...` 等相对路径）。

复算体积：

```bash
node scripts/measure-cocos-split.mjs
```

尚待：真正发布 core/platform/native 的拆包产物到 CDN；以及 phase 2 瘦 core 的 `node_modules`。

## 6. 非目标

- 不把「拆包」做成改引擎玩法；只改 **分发与按需下载**。  
- 不在本阶段改 Creator 编辑器安装体验；优先服务 **CLI + kurenai + agent**。  
- 不把最终 webgame zip 体积和工具链 GB 混为一谈。
