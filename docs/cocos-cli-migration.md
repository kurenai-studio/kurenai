# Kurenai 迁移到 cocos-cli：目标架构与迁移清单

目标：把 kurenai 里自研的 headless 实现（引擎快照、importers、mini-packer、preview-mirror）换成 cocos-cli 的三件套（runtime、asset-db、packer），同时去掉 DSH 宿主。build 不进核心，作为可选能力。

不在本次范围：预览里改场景再写回磁盘。工作流仍然是「Agent 改磁盘 → 编译 → 预览刷新」。

## 1. 目标架构

```text
Agent（Cursor / Claude Code / Codex / WorkBuddy）
   │  写文件（assets/**）+ 调命令（kurenai …）；MCP 以后按需做成 CLI 的薄壳
   ▼
kurenai CLI（bin/kurenai.mjs，每次调用一个短进程）
   │  读 <project>/temp/kurenai-host.json 找到 host；没有就在后台启动
   │  HTTP（/__kurenai/*）
   ▼
cocos host（bin/kurenai-cocos-host.mjs，每个工程一个常驻进程，加载 cocos-cli）
   ├─ Launcher.startGamePreview  runtime + asset-db + packer + 游戏预览 server（open: false）
   ├─ 监听 assets/（fs.watch，Docker 下用 WATCH_POLL=1 轮询）→ assetManager.refreshAsset
   ├─ /__kurenai/status          就绪状态（settings 可用）
   ├─ /__kurenai/refresh         手动刷新
   └─ /__kurenai/asset           刷新并返回引擎分配的 uuid / 子资源
   │
   ▼
cocos-cli 发行物（~/Library/Application Support/cocos-default/cocos-4.0.0-alpha.33）

kurenai 库（lib/，供 studio 页和测试使用）
   ├─ ProjectControl      模板初始化、选中节点、上下文、publish
   ├─ PreviewController   以子进程方式启动 cocos host
   └─ PreviewBridge       反代预览并注入 inspector

publish → 单独进程跑 `cocos build -p web-desktop`（以后换成拆出去的 builder 库）
```

和最初设计的差异：
- 入口从 MCP server 改为 CLI。
- host 入口保留为 `bin/*.mjs`，没有拆出 `src/cocos-host/host.ts`，因为它直接加载 cocos-cli 的 CommonJS 内部模块，不经过 tsdown 构建更简单。
- 同一个工程只跑一个 host：`PreviewController.start()` 发现 `kurenai-host.json` 指向一个已就绪的 host 时，直接接上它（`attached: true`），只启动 bridge；`stop()` 只关 bridge，不关这个 host。

为什么一个工程一个子进程：`Launcher` 依赖全局单例（`GlobalPaths`、`newConsole`、`startServer` 的 server 单例、asset-db manager），同一进程里开不了两个工程。现有 `PreviewController` 本来就是 spawn 模型，这一点不用改。

## 2. 热更新链路（和 headless 的关键差异）

headless 的 `preview-mirror.mjs` 自己 `fs.watch` 了 `assets/`。cocos-cli 没有：

- `src/core/assets/` 和 `@cocos/asset-db` 里都没有文件监听，只有 `autoRefreshAssetLazy`（由 API 调用触发）和 MCP 工具 `assets-refresh`。
- PinK 里靠 IDE 通知刷新；纯 headless 下 Agent 直接写文件，预览不会动。

所以 cocos host 要补 watcher：

```text
Agent 写 assets/**  →  host watcher（去抖）→  assetManager.refreshAsset(dir)
  →  asset-db 导入 / 生成 .meta  →  scripting 'compiled'
  →  cocos-cli live-reload.ts 广播 browser:reload  →  浏览器刷新
```

`src/core/preview/live-reload.ts` 已经监听 `compiled`、`asset-change`、`assets:refresh-finish` 并广播刷新，watcher 只需要负责触发 refresh。

Docker bind mount 下 `fs.watch` 不可靠，所以 host 支持 `WATCH_POLL=1`：按 `WATCH_POLL_MS`（默认 1000）扫描 `assets/`，比较每个文件的修改时间和大小，变化交给同一个去抖刷新队列。`PreviewController` 对应的配置项是 `watchPoll: true`。已实测（macOS 本机，非 Docker）：新增目录和脚本、修改材质、删除目录都能检测到，`.meta` 重写不会引发循环刷新。Docker 手动 smoke 与 Compose 示例见 [`docker-watch-poll.md`](docker-watch-poll.md)。

## 3. 迁移清单：kurenai 仓（`kurenai-studio/kurenai`）

| 文件 | 处理 | 说明 |
|------|------|------|
| `src/dsh.ts` | 删除 | DSH 类型 |
| `src/index.ts` | 重写 | 只做库导出；Agent 入口改为 CLI（`bin/kurenai.mjs`） |
| `src/client/KurenaiLauncher.tsx` | 删除 | DSH 启动入口 |
| `src/client/KurenaiShell.tsx` | 删除 | DSH 聊天分栏 |
| `src/client/index.ts`、`style.ts`、`workspace-api.ts` | 删除 | DSH slots / runtime 注入 |
| `src/client/KurenaiWorkspace.tsx` | 改造（M3） | 抽出「预览 iframe + 场景树 + 选中」做成独立页面 `src/studio/`，由 bridge 在 `/__kurenai/studio` 提供 |
| `cordis.patch.yml` | 删除 | DSH bundle patch |
| `package.json` | 修改 | 去掉 `dsh` 字段和 `@deepseek-ai/*` peerDeps；包名改为 `@kurenai-studio/kurenai`；加 `bin` |
| `src/preview/controller.ts` | 重写启动部分 | 改为 spawn `bin/kurenai-cocos-host.mjs`；环境变量 `KURENAI_HEADLESS_ROOT` 换成 `KURENAI_COCOS_CLI_ROOT`；去掉 `PACKER`；就绪探测改 `/__kurenai/status`（迁移期兼容 `/__hmr/status`） |
| `src/preview/bridge.ts` | 保留 | 反代已支持 WebSocket，cocos-cli 预览的 socket.io 可直接过 |
| `src/project/control.ts` | 修改 | 去掉 DSH 工作区元数据（`.evolve`、`.dsh-home`）和相关报错文案；模板默认用仓内 `templates/`，不再调 `create-project.mjs`；`publish()` 改调 `cocos build`；选中节点按 `projectPath` 存，不再按 DSH sessionId |
| `src/inspector-runtime/*` | 保留，已验证 | Cocos4 预览下可用；改为等场景加载后再 `System.import('cc')`（见第 9 节） |
| `src/shared/protocol.ts` | 保留 | postMessage 协议 |
| `test/preview-controller.test.ts` | 修改 | 入口脚本和就绪路径变了 |
| `test/project-control.test.ts` | 修改 | 去掉 DSH 工作区用例 |
| `test/protocol.test.ts` | 保留 | |
| 新增 `bin/kurenai-cocos-host.mjs` | 已建 | 子进程入口：加载 cocos-cli、`startGamePreview({ open: false, scene })`、watcher / 轮询、`/__kurenai/*` 路由。没有拆 `src/cocos-host/host.ts` |
| 新增 `bin/kurenai.mjs` | 已建（部分） | CLI，命令见第 5 节；替代原计划的 `src/mcp/server.ts` |
| 新增 `templates/base-ai`、`templates/base-ai-3d` | 从本机 stack 迁入 | 已经是 `creator.version: 4.0.0` 格式 |

## 4. 迁移清单：本机 stack 与 headless-cocos

本机实测路径清单（用途与归档建议）：[`archive-headless-inventory.md`](./archive-headless-inventory.md)。

路径前缀 `rubik-workspace/engines/kurenai/`（`puzzle-workspace` 下是同一份拷贝）。

| 文件 | 处理 | 被什么替代 |
|------|------|------------|
| `headless-cocos/spike/preview-mirror.mjs` | 退出主路径，归档 | cocos host + cocos-cli 预览 server |
| `headless-cocos/spike/importers/*.cjs` | 退出主路径，归档 | cocos-cli asset-db importers |
| `headless-cocos/spike/packer/*` | 退出主路径，归档 | cocos-cli packer-driver |
| `headless-cocos/spike/publish/*` | 退出主路径 | `cocos build`（以后换 builder 库） |
| `headless-cocos/spike/engine-snapshot` | 删除依赖 | cocos-cli 的 `packages/engine` |
| `stack/spike/preview-mirror.mjs`（Creator 4 shim） | 删除 | cocos host（shim 的思路直接转正） |
| `stack/spike/create-project.mjs` | 删除 | `control.ts` 复制模板 |
| `stack/templates/*` | 迁入 kurenai 仓 | |
| `stack/run-rubik.mjs`、`run-puzzle.mjs` | 改写为验收脚本 | 改为写 prefab、材质和 `assets/game/*.ts`，不碰场景（见第 9 节） |

`headless-cocos` 的 importer 覆盖面（glTF 扩展、Spine 3.8/4.2、BMFont、plist 等）在切换前要和 cocos-cli asset-db 对一遍，缺的记为 cocos-cli 的待补项，而不是继续维护 kurenai 版。

## 5. 工具面（替代 DSH）：CLI 为主

能力全部做成 `kurenai` 命令（`bin/kurenai.mjs`），MCP 以后按需再包一层薄壳。

- **后台服务**：每个工程一个 cocos host 进程，它本来就是预览必需的，同时持有 asset-db。
- **命令怎么找到 host**：读 `<project>/temp/kurenai-host.json`（host 就绪时写入，退出时删除）；host 没在运行时，需要 host 的命令会先在后台启动它。
- **`.meta` 由引擎负责**：LLM 只写源文件。uuid 由 asset-db 在导入时分配，通过 `kurenai asset info` 查询。

| 命令 | 状态 | 备注 |
|------|------|------|
| `kurenai host start / status / stop` | 已实测 | 启动后常驻；日志在 `temp/kurenai-host.log` |
| `kurenai asset info <file>` | 已实测 | 先让引擎刷新导入这个文件，再返回 uuid、type、url、子资源；host 没运行时自动启动（约 3.7 秒） |
| `kurenai init <dir> --template <id>` | 已实测 | 调 `ProjectControl.initialize`；不自动启动 host |
| `kurenai logs [--since <seq>] [--errors]` | 已实测 | host 保留最近 500 行输出（含编译错误和转发的浏览器 console），按序号增量读取 |
| `kurenai context` | 已实测 | 原 `contextText()`：工程状态、预览地址（取自 host）、`AGENTS.md` |
| `kurenai publish [--platform] [--out]` | 已实测 | 调 `ProjectControl.publish`；host 运行时并发构建可行（约 8 秒，产物 46MB，能正常渲染） |

`asset info` 的实测结果：
- 新写的材质：引擎生成 `.meta` 并分配 uuid。
- 图片：子资源里有贴图（`@6c48a`）和 SpriteFrame（`@f9941`）的 uuid。
- 内容坏掉的材质：引擎不报错，而是静默退回通用导入器 `*`。host 会检查「扩展名有专门导入器，实际却用了 `*`」这种情况，并返回 `ok: false`；文件修好后重新导入就恢复正常。
- 原本正常的材质被改坏：`invalid: true`，返回 `ok: false`。
| `kurenai screenshot` | 待做 | 需要一个浏览器实例打开预览页；方案待定（无头浏览器或 studio 页回传） |
| `kurenai selection` | 待做 | 选中节点来自 inspector，要等 M3 的 studio 页把选中结果发给 host |

写资源先走「直接写源文件」这条路。如果测试发现某类结构手写失败率高，再加专门的创建命令（cocos-cli 内核已有 `createAsset`、`createAssetByType`、`importAsset`、`saveMaterial` 等可以直接包）。

原计划的 `kurenai_asset_info` 用来把脚本绑到场景，这个用途已经不需要了（脚本不进 prefab 和场景）；现在的 `kurenai asset info` 用来给 prefab 查材质、贴图的 uuid。

## 6. cocos-cli 侧要补的（SUD-GLOBAL/cocos-cli，可回馈上游）

1. 官方 headless 会话入口，例如 `cocos preview --watch`：带 `assets/` 监听，触发 `refreshAsset`。
2. 预览就绪接口，把 `isPreviewSettingsReady()` 暴露成 HTTP 路由。
3. 在此之前，cocos host 需要直接引用 `dist/core/launcher` 等内部模块，要按 cocos-cli 版本锁定（当前 alpha.33）。
4. build 拆库（`compressUuid` 回边、`getPreviewSettings` 依赖 `BuildTask`）另起一条线推进，不阻塞本迁移：`startGamePreview` 目前内部仍会 `initBuilder()`，先接受。

## 7. 里程碑

| 阶段 | 内容 | 验收 |
|------|------|------|
| M0 | cocos host 原型：spawn、就绪、watcher、refresh | 用 `puzzle-bench/kurenai-native`：磁盘上改 `JigsawPuzzle.ts`，不手动调用任何接口，浏览器自动刷新并看到改动 |
| M1 | kurenai 库去 DSH，`ProjectControl` / `PreviewController` 跑在 cocos host 上 | 测试全过；删掉 `dsh.ts`、`client/`、`cordis.patch.yml` |
| M2 | 第 5 节的 `kurenai` CLI 命令 | Agent 只通过 CLI 和写文件，从空目录写 prefab、材质和 View 做出拼图 |
| M3 | 独立 studio 页（inspector + 选中）；publish 走 `cocos build` | 点节点后 `kurenai_selection_get` 能拿到；`web-desktop` 产物可打开 |
| M4 | watcher / 就绪接口进 cocos-cli；去掉内部模块引用；headless-cocos 正式归档 | kurenai 只依赖 cocos-cli 公开接口 |

### M0 结果（2026-09-24，cocos-cli 0.0.1-alpha.41 / cocos-4.0.0-alpha.33）

`bin/kurenai-cocos-host.mjs` 已通过验收：

- 已有 `library/` 时约 3–8 秒就绪；host 进程常驻内存约 780MB。
- 改 `JigsawPuzzle.ts`：watcher 收到事件后约 0.3 秒完成 `refreshAsset`，脚本重新编译，live-reload 让浏览器整页刷新，页面上的改动可见。
- 新目录下新建脚本能导入并生成 `.meta`；删除目录能正确回收；`.meta` 写回不会引发循环刷新。
- `POST /__kurenai/refresh` 可用，越界路径返回 400。
- 页面上 `cc` 是全局对象，inspector 可以沿用。
- 已知问题：
  - macOS 文件事件会延迟、合并送达，偶尔多出一次空刷新（约 100ms，不触发 asset 事件）。
  - `launcher.close()` 不会返回，退出靠 5 秒超时强退。

### M1 结果（2026-09-24）

包名改为 `@kurenai-studio/kurenai` 0.1.0，已去掉 DSH：

- 删除 `src/dsh.ts`、`src/client/*`、`cordis.patch.yml`，以及 `package.json` 里的 `dsh` 字段和 `@deepseek-ai/*`、react 依赖。`KurenaiWorkspace.tsx` 在 M3 从提交 `074e80d` 取回改造。
- `src/index.ts` 只做库导出；DSH tools 和 systemPrompt 在 M2 以 MCP 形式恢复。
- `PreviewController` 改为启动 `bin/kurenai-cocos-host.mjs`，就绪以 `/__kurenai/status` 的 `ready` 为准，默认超时 180 秒；cocos-cli 换端口时从 host 日志采纳新地址。
- `ProjectControl`：
  - 选中节点和 HTTP API 按 `projectPath` 区分，不再使用 `sessionId`。
  - 模板来自仓内 `templates/`，初始化时重写 `name` 和 `uuid`。
  - `publish()` 调 `cocos build`，支持 `web-desktop` 和 `web-mobile`，`project://` 形式的产物路径会解析成真实路径。
- `PreviewBridge` 把页面里写死的 `window.WebEnv.serverURL`（host 端口）改写成 `location.origin`。否则 import map、场景 JSON 会绕过 bridge 直接请求 host 端口。

端到端验证（从 `lib/` 调用）：

- 从空目录初始化 `base-ai-3d`，约 6–7 秒预览就绪。
- 经 bridge 打开页面，inspector 能挂载，205 个请求全部走 bridge 端口。
- 新建和修改脚本后页面自动重载，inspector 会重新挂载。
- `web-desktop` 发布耗时 37 秒，产物 45MB，用静态服务器打开能加载场景。
- 15 个单元测试通过。

预览运行时同时对同一工程跑 `cocos build`（两个进程共用 `library/`）：已验证可行，见第 5 节 `publish`。

## 8. 风险

- **内部 API**：M4 之前依赖 cocos-cli 的 `dist/core/*`，cocos-cli 升级可能直接断。
- **冷启动**：asset-db 首次建库约 1 分钟（见 `live-reload.ts` 注释），比 headless mirror 慢。子进程要常驻，就绪以 settings 可用为准。
- **资源占用**：现在的 shim 用了 `--max-old-space-size=8192`，每个工程一个完整 cocos-cli 进程，内存需要实测（可以复用 webgame-docker 资源基准那套相位和指标）。
- **inspector**：Cocos4 预览下已验证可用（见第 9 节的加载时序问题）。
- **安装体积**：kurenai 会依赖约 5.7 GB 的 cocos-cli 发行物，直到有瘦身后的核心包。
- **importer 覆盖差异**：headless 有、cocos-cli 没有的资源类型，切换后会出现回退。

## 9. 资源文件 + 代码的写作方式（2026-09-24 调整）

目标是让 LLM 不经过编辑器，直接写出能运行的 Cocos 工程。结构和外观写成 prefab、材质文件，行为写成 TS 代码。

### 决定

- **LLM 直接写 prefab**，但有两条约束：
  - prefab 里不挂 TS 脚本组件；
  - prefab 之间不互相静态引用，组合在代码里做。

  prefab 可以按 uuid 引用材质、网格和贴图。
- **材质也写成文件**：LLM 写 `.mtl` 指向内置 effect，然后用 `kurenai asset info` 拿到引擎分配的 uuid，再写进 prefab。受光照材质就是这样解决的，不再绕开。
- **`.meta` 一律由引擎生成**，LLM 不写也不改。
- **行为用 ViewWeaver 的运行时写法**：代码用 `resources.load` 按路径加载 prefab 并实例化，然后 `addComponent(View).bind(root)`，View 在 `bind` 里用 `getChildByPath` 找节点。不用 ViewWeaver 的 `bind.json` 和 `.gen.ts` 生成链。
- **入口在创建工程时注入**：`initialize()` 先复制 `templates/<id>`，再合并 `templates/shared`。场景里预置一个 `Game` 节点，挂 `KurenaiBoot` 组件，它负责把 `MainView` 挂上去。
- **直接写原生 cc 代码**：不做 three.js 风格的封装 API，模板只带少量 helper。
- **UI 和场景怎么组织**：后续再讨论。现在的 `ensureCanvas` / `addLabel` 和 2D 模板里用代码画的方块先保持原样。

### 模板内容

| 文件 | 作用 |
|------|------|
| `assets/kurenai/Boot.ts` | 固定 uuid `14158daa-…`；`start()` 里执行 `this.node.addComponent(MainView).bind(this.node)` |
| `assets/kurenai/IView.ts` | `bind(root: Node): void` 接口 |
| `assets/kurenai/helpers.ts` | `loadPrefab(path)`、`ensureCanvas`（3D 场景下自带 UI 相机）、`addLabel` |
| `assets/game/MainView.ts` | 入口。3D 模板里加载 `Ground`、`Tower` 两个 prefab，给 `Tower` 挂 `TowerView` |
| `assets/game/TowerView.ts`（3D） | prefab 对应的 View 示例：`bind` 里取 `Ball` 节点，`update` 里旋转、弹跳 |
| `assets/resources/materials/red.mtl` + `.meta`（3D） | 材质示例，引用 `builtin-standard`；模板自带 `.meta`，这样示例 prefab 里的 uuid 是固定的 |
| `assets/resources/prefabs/*.prefab`（3D） | 精简 prefab 示例，没有 `.meta` 和 `cc.PrefabInfo` |
| `AGENTS.md` | 写作规则和内置资源 uuid 表（standard effect、standard 材质、8 种基础网格） |

- 两个模板的场景都已预置 `Game` + `KurenaiBoot`：2D 挂在 Canvas 下，3D 挂在场景根节点下。场景 JSON 里组件类型写的是压缩 uuid `141582qyDxE+5F1BV7HNopX`。
- `base-ai` 原来没有场景，现在用 cocos-cli `createScene({templateType:'2d'})` 生成了 `main.scene`。

### 验证结果

- **精简 prefab 能导入**：只写 `cc.Prefab`、`cc.Node`、`cc.MeshRenderer` 的必要字段（不写 `_objFlags`、`_id`、`cc.PrefabInfo` 等）就能导入，`.meta` 自动生成，`instantiate` 后子节点结构正确。导入器会把源文件重新格式化并补字段（比如 `persistent`），所以 LLM 再次修改前要先读一遍。
- **已有 `.meta` 的 uuid 会保留**：导入器只补了 `imported`、`files` 等字段。这条只用于模板自带的 `.meta`，LLM 不手写。
- **受光照渲染**：预览和 `web-desktop` 产物里都正常。产物里 `resources` 包的 config 包含自定义材质和 standard effect。
- **改材质文件会自动刷新预览**，新颜色生效。
- 3D 从空目录初始化到预览就绪约 3.6 秒（`library/` 已有缓存的情况下）。
- 2D：画面上有标题和移动的方块，连续刷新 3 次都正常。
- 两个模板都经 bridge 打开，inspector 能挂载；改 `helpers.ts` 后页面自动重载。

### 过程中发现的问题

- **预览启动场景**：cocos-cli 预览按「显式参数 > 构建配置 `startScene` > asset-db 里第一个场景」选择，会选到内置的 `2d` 场景，不读 `project.json` 的 `general.startScene`。host 现在默认读取该字段，环境变量 `LAUNCH_SCENE` 可以覆盖。
- **inspector 加载时序**：`cc` 模块由约 13MB 的 `engine-dist/bundled/index.js` 注册。inspector 在它注册前 `System.import('cc')`，SystemJS 会缓存失败结果，页面报 "Error loading q-bundled:///virtual/cc.js"，这个问题是偶发的。现在 inspector 等全局 `cc.director.getScene()` 可用后才 import。
- **全局 `cc` 和 `System.import('cc')` 不是同一个对象**：两者共享 `director`，但全局那个缺少 `MeshRenderer` 等类。运行时代码和 inspector 都应使用 `import`。
- **代码里直接创建 standard 材质不可行**：`initialize({effectName:'builtin-standard'})` 会失败，因为没有资源引用它时预览不会加载这个 effect。改成材质文件后问题消失，这也是材质走文件的原因之一。
- **`cocos build` 会打印 `tsc: command not found`**：这是一个可选的类型检查步骤，不影响产物。

### 待办

- **Docker 里实测轮询监听**：目前只在 macOS 本机验证过。
- **精简 prefab 的边界**：目前只测了 `MeshRenderer`。其他组件（灯光、粒子、`Sprite`、`Label`）省略字段后的默认值是否可用，要逐个测。
- **UI 与场景的组织方式**：待讨论。
- **`kurenai_logs`**：数据源已有，就是 host 转发的 `[Browser ERROR] … at MainView.bind (…)` 和编译日志。需要在 host 里做一个环形缓冲区，再暴露成路由；导入失败也应该进这个日志。
- **`run-puzzle` 改写**：拼图块写成 prefab，行为写成 View，作为 M2 的验收用例。
