# Cocos 问题归档与引擎对比

> 范围：kurenai 以「无编辑器、代码优先、AI Agent 编写」方式使用 Cocos（vendor 引擎为 Cocos Creator 4.0.0 / cocos-cli 4.0.0-alpha.33）期间遇到的问题。
> 来源：安装反馈（2026-09-25/27）、[`bug报告-2d-3d开发阶段.md`](../../bug报告-2d-3d开发阶段.md)、模板开发与本地复现。
> 对比对象：Godot 4、three.js、Urho3D（含 rbfx / U3D 分支）。

---

## 第一部分：问题归档

### 分类说明

| 代号 | 类别 | 含义 |
|---|---|---|
| **A** | 编辑器中心设计 | 在 Creator 编辑器里「拖一下就对」的隐含约定，纯代码工作流看不到 |
| **B** | 静默失败 / 误导性报错 | 出错时不报、吞掉，或报一个与根因无关的错误 |
| **C** | API 设计 | 抽象本身难用或容易误用 |
| **D** | 工具链与安装 | 原生依赖、体积、运行环境 |
| **E** | cocos-cli 无编辑器管线成熟度 | 4.0 alpha 的 headless 预览/构建链路缺陷，属成熟度问题而非设计问题 |
| **K** | kurenai 自身 | 我们的集成问题，单列以免误算到 Cocos 头上 |

严重度：★★★ 阻断开发 / ★★ 需要绕行或明显误导 / ★ 小坑。
状态：**已修**（改了 vendor 或 kurenai）、**已封装**（helpers/模板规避）、**已文档**（写进 AGENTS.md）、**未处理**。

### A. 编辑器中心设计

| ID | 问题 | 根因 | 严重度 | 状态 |
|---|---|---|---|---|
| A-01 | 脚本无法挂到场景上 | 场景 JSON 里组件类型写的是脚本 `.meta` uuid 的压缩形式；`.meta` 在导入后才生成，写代码时无从得知 | ★★★ | 已封装：模板预置固定 uuid 的 `Boot.ts`，场景里预挂 `Game` 节点 |
| A-02 | 没有 `main()` 入口 | 运行模型是「加载场景 → 执行场景中组件生命周期」，代码没有起点 | ★★★ | 已封装：`Boot.start()` 调 `MainView.bind()` 作为固定入口 |
| A-03 | `@property` 引用无法赋值 | 节点/资源引用靠编辑器拖拽写入场景 | ★★ | 已文档：禁用 `@property`，改用路径查找与 `resources.load` |
| A-04 | 资源只能按 uuid 引用 | uuid 由导入生成、存在 `.meta` 里；prefab/材质之间按 uuid 互引 | ★★ | 已封装：外部资源放 `assets/resources/` 按路径加载；`kurenai asset info` 查 uuid |
| A-05 | 3D 场景里 UI 文字不显示 | UI 需要 Canvas + 专门的 UI 相机 + layer 与相机 visibility 掩码匹配；编辑器建 3D 场景时这些不会自动出现 | ★★ | 已封装：`ensureCanvas` 自带 UI 相机与 layer |
| A-06 | 代码创建的 Label 设透明度崩溃 `Cannot set properties of null (setting 'opacity')` | 3.x 把透明度从节点属性（2.x 的 `node.opacity`）拆成独立 `UIOpacity` 组件；编辑器会自动挂，代码不会。LLM 训练数据里大量 2.x 写法加剧此问题 | ★★ | 已封装：`addLabel` 自动挂 `UIOpacity` |
| A-07 | GLB 导入后不能 `instantiate` | 主资产是 `cc.Asset`；完整 prefab 是子资源，路径规则 `模型路径/文件名`（如 `models/tower/tower`）无文档。编辑器里是从资源面板拖 prefab，不需要知道这个规则 | ★★ | 已修：helpers `loadModel()`；`loadPrefab` 误用时提示。注：手写「引用首个 mesh 的包装 prefab」会丢掉多 mesh 模型的其余部分 |
| A-08 | 同一文件写两个 Component，预览整体启动失败 | 脚本 uuid ↔ 类一一对应（为编辑器序列化服务）；另有 `@ccclass` 名全局唯一约束 | ★★ | 已文档。报错见 B-03 |
| A-09 | 代码里用受光照材质（builtin-standard）失败 | 预览默认只加载 unlit / sprite effect；发布只打包被引用的资源，代码里按名字取的 effect 不会进产物 | ★★ | 已封装：`resources/` 中放引用 standard effect 的材质，代码加载后使用；预览和发布均验证 |
| A-10 | 导入器改写手写的 prefab 源文件 | 导入时重新格式化并补字段，Agent 再次编辑会基于旧内容 | ★ | 已文档：修改前先重读文件 |

### B. 静默失败 / 误导性报错

| ID | 问题 | 根因 | 严重度 | 状态 |
|---|---|---|---|---|
| B-01 | 键盘事件全部丢失，无任何报错 | `KeyboardInputSource` 用 `canvas?.addEventListener` 绑定，canvas 不存在时可选链直接吞掉（时序原因见 E-02） | ★★★ | 已修：改绑 `window`，canvas 设 `tabindex` |
| B-02 | 相机「旋转不生效」，`worldRotation` 恒为 0 | `Node.lookAt` 在视线与 up 平行时（相机在目标正上方，俯视游戏常见）由 `Mat3.fromViewUp` 返回单位矩阵，**不报错**。报告者因此排查了 re-parent、欧拉缓存等方向，误判为引擎丢弃旋转 | ★★★ | 已修：`lookAt` 自动换 up 轴（源码 + web/editor bundled + transform-cache） |
| B-03 | 两个 Component 同文件时报 `Cannot set properties of null (setting '_sealed')` | 真正原因（A-08）只在前一行打印 `Each script can have at most one Component.`，随后崩在无关的内部字段 | ★★ | 已文档 |
| B-04 | 漏写 `import` 能编译通过，运行时才 `ReferenceError` | 预览链路用 Babel 只转译不做类型检查 | ★★ | 已文档；建议预览时增加 `tsc --noEmit` 并进 `kurenai logs --errors`（未做） |
| B-05 | resources 缺失只在 `resources.load` 时报「Bundle resources doesn't contain …」 | settings 生成阶段不校验；根因见 E-01 | ★★ | 随 E-01 修复 |

### C. API 设计

| ID | 问题 | 根因 | 严重度 | 状态 |
|---|---|---|---|---|
| C-01 | 桌面端鼠标悬停不触发移动 | touch 与 mouse 是两套事件，无统一 pointer 事件；未按键时不产生 `TOUCH_MOVE` | ★ | 已封装：helpers `onPointerMove` |
| C-02 | 按 `view.getVisibleSize()` 布局错位 | 可见尺寸随窗口比例变化（如 960×432.8），不等于设计分辨率；适配策略概念多 | ★ | 已封装：`getDesignSize()` + 文档 |
| C-03 | `♥` 等符号不渲染 | 默认字体缺字形 | ★ | 已文档：HUD 用 ASCII |
| C-04 | 序列化数据难以阅读和手写 | `_clearFlags: 14`、`_visibility: 1822425087`、`_layer: 1073741824` 等位掩码魔数；节点同时存 `_lrot` 与 `_euler` 两套旋转 | ★ | 未处理（通过模板和常量表缓解） |

### D. 工具链与安装

| ID | 问题 | 根因 | 严重度 | 状态 |
|---|---|---|---|---|
| D-01 | 安装失败 / 需要按平台与 Node ABI 预编译 | 原生模块 `gl`（headless WebGL，仅用于 effect 离线 GPU 类型检查）和 `sharp`（libvips 图片处理），预编译产物绑定 Node 24（MODULE_VERSION 137）与 darwin-arm64 | ★★★ | 已修：移除 `gl` 检查；`sharp` 换纯 JS 的 `portable-sharp`（jimp） |
| D-02 | 官方 cocos-cli 约 5.7 GB | 「一包打天下」：各平台 V8/PhysX/glslang 预编译库 2.4 GB、全渠道小游戏平台 871 MB、打包工具 623 MB 等 | ★★ | 已修：vendor 裁剪为 Web 所需 |
| D-03 | `publish` 因 `@sentry/core` 缺文件崩溃 | 遥测模块是构建链路硬依赖 | ★★ | 已修：软加载 |
| D-04 | `publish` 末尾 `tsc: command not found` 的 ERROR | 非致命的 TS 检查依赖全局 `tsc` | ★ | 已修：降为 WARN |
| D-05 | 每次全新安装首启都重导入内置资源，并改写包目录 | 内置资源库按源文件 mtime 判断是否过期；git 检出不保留 mtime | ★ | 未处理 |

### E. cocos-cli 无编辑器管线成熟度

| ID | 问题 | 根因 | 严重度 | 状态 |
|---|---|---|---|---|
| E-01 | `type: "3d"` 项目预览黑屏，resources bundle 丢失 | 预览构建未把 project bundles 标记为输出，settings 里缺 resources | ★★★ | 已修：预览强制输出 project bundles |
| E-02 | 键盘绑定时 `#GameCanvas` 尚不存在 | 预览页模板与引擎输入初始化时序不一致（叠加 B-01 的静默吞错） | ★★★ | 已修 |
| E-03 | 预览跑到内置空 2D 场景 | 预览不读 `project.json` 的启动场景 | ★★ | 已修：host 读配置指定场景 |
| E-04 | 进程被杀后永远无法就绪（`Lock is not acquired/owned by you`） | `temp/programming/**/*.lock` 无陈旧锁检测 | ★★ | 已修：host 启动时清理陈旧锁 |
| E-05 | 首次导入引擎内置资源耗时长（慢机器 >180 s） | 首启需导入整个内置资产库 | ★ | 已缓解：见 K-01 |

### K. kurenai 自身（不计入 Cocos）

| ID | 问题 | 状态 |
|---|---|---|
| K-01 | host 就绪只等 180 s 且超时即杀进程，引发 E-04 雪崩 | 已修：默认 600 s、可配置、超时不杀 |
| K-02 | 安装脚本 `rmSync` 失败即整体退出（被沙箱删除护栏拦截） | 已修：改名搁置 + 继续，提示清理 |
| K-03 | README 未写明 Node 版本约束 | 已修（随 D-01 移除原生依赖后不再绑定） |
| K-04 | inspector 过早 `import cc` 导致偶发加载失败 | 已修：等场景加载后再 import |

### 统计与结论

按类别计（不含 K）：A 10 项、B 5 项、C 4 项、D 5 项、E 5 项，共 29 项；★★★ 共 7 项（A-01、A-02、B-01、B-02、D-01、E-01、E-02）。

- **★★★ 的 7 项全部落在 A、B、D、E**，C 类都是小坑。真正伤人的不是某个 API 难用，而是「编辑器替你做了、代码看不到」和「错了不说」。
- **A 类是结构性的**：Cocos 的数据模型（uuid 引用、组件挂载、`@property`）为编辑器设计，无法靠修 bug 消除，只能靠 kurenai 的模板和 helpers 在外面补一层代码优先的外观。
- **B 类放大了所有其他问题**：B-01、B-02 本身改动都很小，但因为不报错，报告者各花了大量时间在错误方向上。
- **E 类是阶段性的**：4.0 alpha 的 headless 链路还不成熟，随上游演进会减少，但需要持续跟进 vendor。

---

## 第二部分：与 Godot、three.js、Urho3D 对比

### 引擎定位速览

| | Cocos Creator | Godot 4 | three.js | Urho3D |
|---|---|---|---|---|
| 类型 | 编辑器 + 引擎 | 编辑器 + 引擎 | 渲染库 | 代码优先引擎（附编辑器） |
| 主语言 | TypeScript | GDScript / C# | JS / TS | C++（AngelScript / Lua） |
| 设计取向 | 编辑器优先 | 编辑器优先，但场景为可读文本 | 纯代码 | 代码优先 |
| 维护状态 | 活跃 | 活跃 | 活跃 | 主仓库已归档；分支 rbfx（未正式发布）、U3D |
| 国内小游戏平台 | 官方全渠道支持 | 无官方支持 | 社区适配 | 无 |

### 维度对比

#### 1. 代码能否脱离编辑器工作（对应 A 类）

- **Cocos**：不能自然做到。脚本挂载、资源引用都走 uuid，没有 `main()`（A-01～A-04）。
- **Godot**：场景 `.tscn` 是可读文本，脚本和资源按 `res://` 路径引用（4.x 另加 uid，但保留路径）。入口可以是主场景，也可以是 autoload 单例。LLM 可以直接写场景文件。`@export` 同样依赖编辑器赋值，但 `get_node("路径")` / `$路径` 是常规写法，所以影响小。
- **three.js**：不存在这个问题。一切都是代码，资源按 URL 加载。
- **Urho3D**：有明确入口（`Application` 子类的 `Setup/Start`），资源按路径取（`GetResource<Model>("Models/Box.mdl")`），场景是 XML/JSON。

#### 2. 出错时是否「说话」（对应 B 类）

以 B-02 的退化 `lookAt`（视线与 up 平行）为例：

| 引擎 | 行为 |
|---|---|
| Cocos（原版） | 静默返回单位旋转，相机朝向突变，无任何日志 |
| Godot 4 | 4.3 及之前报错 `The target vector and up vector can't be parallel to each other.`；4.4 起改为警告「Target and up vectors are colinear」 |
| three.js | `Matrix4.lookAt` 检测到平行时微调方向向量，给出合理朝向，不报错 |
| Urho3D | `Quaternion::FromLookRotation` 检测到平行时回退到 `FromRotationTo(FORWARD, dir)`；结果为 NaN 时返回 `false` 并保持原值 |

类型检查：

- **Cocos**：预览只转译不检查（B-04）。
- **Godot**：GDScript 加载时报语法错误，静态类型可选，有 `--check-only`。
- **three.js**：用标准 TS 工具链，`tsc` / IDE 全程检查。
- **Urho3D**：C++ 编译期检查；AngelScript 在加载时编译，错误写日志。

three.js 也有自己的静默坑，并非一概更好：透明需要同时设 `material.transparent = true`，纹理/几何体修改后需要 `needsUpdate`，还有色彩空间设置。区别在于这些都是渲染层面的「画面不对」，不会像 B-01、B-02 那样让功能整个失效却看不出原因。

#### 3. 加载 glTF 模型（对应 A-07）

| 引擎 | 代码写法 | 备注 |
|---|---|---|
| Cocos | `resources.load('models/x/x', Prefab)` → `instantiate` | 子资源路径规则无文档；kurenai 封装为 `loadModel('models/x')` |
| Godot | `load("res://x.glb").instantiate()` | 导入即 `PackedScene`；运行时还可用 `GLTFDocument` 加载任意文件 |
| three.js | `new GLTFLoader().load(url, g => scene.add(g.scene))` | 无导入步骤 |
| Urho3D | 先用 `AssetImporter`（Assimp）离线转成 `.mdl` + 材质 XML，再 `GetResource<Model>` | 多一个离线转换步骤；rbfx 增加了 glTF 导入 |

#### 4. 输入与 UI（对应 C-01、A-05、A-06）

- **指针事件**
  - Cocos：touch / mouse 两套，悬停不产生 `TOUCH_MOVE`。
  - Godot：未按键也发 `InputEventMouseMotion`；有「鼠标模拟触摸 / 触摸模拟鼠标」开关。
  - three.js：直接用浏览器统一的 Pointer Events。
  - Urho3D：`E_MOUSEMOVE` 与按键无关；`SetTouchEmulation` 可把鼠标转成触摸。
- **透明度**
  - Cocos 3.x：需要额外的 `UIOpacity` 组件。
  - Godot：`CanvasItem.modulate` 是内置属性。
  - three.js：`material.opacity` + `transparent`。
  - Urho3D：`UIElement::SetOpacity` 是内置方法。
- **UI 渲染前提**
  - Cocos 需要 Canvas + UI 相机 + layer 掩码，三者匹配才显示。
  - Godot 的 `CanvasLayer` / Control 节点不依赖 3D 相机。
  - three.js 通常直接用 HTML/CSS 叠在画布上。
  - Urho3D 的 UI 子系统独立于场景相机。

#### 5. 安装与工具链（对应 D 类）

| 引擎 | 获取方式 | 原生依赖 / 体积 |
|---|---|---|
| Cocos | 编辑器安装包；cocos-cli 经 npm | 官方 cli 约 5.7 GB；含 `gl` / `sharp` 等需预编译的 Node 原生模块（kurenai 已移除） |
| Godot | 单个可执行文件，`--headless` 可做导入与导出 | 无 Node/npm；导出模板需单独下载 |
| three.js | `npm install three` | 纯 JS，无原生依赖，体积为 MB 级 |
| Urho3D | 源码 + CMake 自行编译（Web 需 Emscripten） | 需要完整的 C++ / Emscripten 工具链 |

three.js 没有 D-01 问题的根本原因是**没有离线资产管线**：着色器在浏览器运行时编译，图片由浏览器解码，所以不需要 headless WebGL 或 libvips。Cocos 选择在构建期做 effect 编译、贴图压缩，换来更小更快的发布包，代价是工具链变重。

#### 6. Web 发布

- **Cocos**：Web 包小，且官方支持微信 / 抖音等小游戏平台。这是它相对另外三者最明确的优势。
- **Godot**：4.3 起默认单线程导出，不再强制 `SharedArrayBuffer` 与跨域隔离头。wasm 体积明显大于 Cocos 和 three.js。C# 项目的 Web 导出在 Godot 4 上长期受限，选型前需按当时版本核实。
- **three.js**：原生 Web，产物最小。小游戏平台需要社区适配层。
- **Urho3D**：通过 Emscripten 可以出 Web，但要自己编译引擎，生态已停滞。

#### 7. LLM / Agent 适配度

- **训练语料**
  - three.js 与 TS 语料最多。
  - Godot 常见 3.x / 4.x API 混用，例如 `instance()` 与 `instantiate()`、`KinematicBody` 与 `CharacterBody3D`。
  - Cocos 有同样的 2.x / 3.x 混用问题，A-06 的 `node.opacity` 就是典型。
  - Urho3D 语料最少。
- **文件可写性**：three.js（纯代码）> Godot（文本场景 + 路径引用）> Urho3D（XML 场景 + 路径引用）> Cocos（JSON + uuid + 位掩码）。
- **错误可见性**：Godot ≈ Urho3D > three.js > Cocos（原版）。

### Cocos 问题在其他引擎中是否存在

| Cocos 问题 | Godot 4 | three.js | Urho3D |
|---|---|---|---|
| A-01/A-04 uuid 挂载与引用 | 无（路径引用，uid 为辅） | 无 | 无（路径引用） |
| A-02 无代码入口 | 无（主场景 / autoload） | 无 | 无（`Application`） |
| A-05 UI 依赖相机 layer 掩码 | 无 | 无（HTML UI） | 无 |
| A-06 透明度需额外组件 | 无（`modulate`） | 部分（需 `transparent`） | 无 |
| A-07 模型不能直接实例化 | 无（导入即 `PackedScene`） | 无 | 部分（需离线转换） |
| A-08 每文件一个组件 | 类似（每节点一个脚本，每文件一个类），但报错清晰 | 无 | 无 |
| B-02 `lookAt` 退化静默 | 无（报错 / 警告） | 无（自动微调） | 无（回退 + 返回值） |
| B-04 无类型检查 | 部分（静态类型可选） | 无（标准 tsc） | 无（C++）/ 部分（Lua） |
| C-01 touch / mouse 分离 | 部分（有模拟开关） | 无（Pointer Events） | 部分（有触摸模拟） |
| D-01 构建期原生依赖 | 无 | 无 | 需要 C++ 工具链 |
| 小游戏平台支持 | 弱 | 社区 | 无 |

### 结论与对 kurenai 的启示

1. **对「Cocos 设计易用性差」的判断**：成立，但范围要说准。
   - 问题集中在编辑器中心设计（A）和静默失败（B）。前者在 Godot / three.js / Urho3D 中基本不存在，后者在其余三者中都做得更好。
   - 纯 API 设计（C 类）差距不大。
2. **Cocos 的不可替代性**在于国内小游戏平台和小体积 Web 包，而不是开发体验。只要这仍是目标市场，路线就是「保留 Cocos 运行时和发布链路，在外层做代码优先的外观」。这正是 kurenai 的定位。
3. **可借鉴的做法**：
   - 学 **three.js**：helpers 提供纯代码 API，隐藏 uuid、组件拆分和 layer 细节（如 `loadModel`、`ensureCanvas`、`addLabel`）。
   - 学 **Godot / Urho3D**：把静默失败改成明确报错或合理回退（B-01、B-02 已做）。下一步建议：
     - 预览时做类型检查（B-04）；
     - 对 A-08 这类误导性报错做前置检测，把「一个文件只能一个 Component」直接报给 Agent。
   - 学 **Godot**：路径优先的引用方式最适合 LLM 书写，AGENTS.md 应坚持「按路径加载，不手写 uuid 引用」。
4. **不建议迁移到 Urho3D**：主仓库已归档、社区分裂，且需要 C++ / Emscripten 工具链。若看重代码优先的 C++ 引擎，rbfx 可以观察，但它尚未正式发布。

---

## 参考

- Godot `look_at` 平行报错：[godot#79146](https://github.com/godotengine/godot/issues/79146)、[godot#53793](https://github.com/godotengine/godot/issues/53793)；4.4 改为警告：[godot#105703](https://github.com/godotengine/godot/issues/105703)
- Godot Web 单线程导出：[Web Export in 4.3](https://godotengine.org/article/progress-report-web-export-in-4-3/)、[Exporting for the Web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
- Godot 场景实例化与运行时 glTF：[Resources](https://docs.godotengine.org/en/stable/tutorials/scripting/resources.html)、[Runtime file loading and saving](https://docs.godotengine.org/en/stable/tutorials/io/runtime_file_loading_and_saving.html)
- Urho3D `FromLookRotation` 回退：[Quaternion.cpp](https://github.com/urho3d/Urho3D/blob/master/Source/Urho3D/Math/Quaternion.cpp)；仓库归档状态：[urho3d/Urho3D](https://github.com/urho3d/Urho3D/)；分支：[rbfx](https://rebelfork.io/docs/index.html)、[U3D](https://github.com/u3d-community/U3D)
- three.js `Matrix4.lookAt` 平行处理：`src/math/Matrix4.js`（`_x.lengthSq() === 0` 分支）
- Cocos 复现与修复记录：[`cocos-cli-migration.md`](./cocos-cli-migration.md)、[`bug报告-2d-3d开发阶段.md`](../../bug报告-2d-3d开发阶段.md)
