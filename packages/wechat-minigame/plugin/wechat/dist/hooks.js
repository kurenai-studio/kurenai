'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = void 0;
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterInit = onAfterInit;
exports.onBeforeBundleInit = onBeforeBundleInit;
exports.onAfterBundleBuildTask = onAfterBundleBuildTask;
exports.onAfterBuildAssets = onAfterBuildAssets;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterCopyBuildTemplate = onAfterCopyBuildTemplate;
exports.onAfterBuild = onAfterBuild;
exports.run = run;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const child_process_1 = require("child_process");
const ejs_1 = __importStar(require("ejs"));
const share_1 = require("./share");
const OPEN_DATA_CONTEXT_ROOT = 'openDataContext';
exports.throwError = true; // 标记是否任务失败时，抛出错误
async function onBeforeBuild(options, result, cache) {
    // 强制开启 generateCompileConfig:让主 build 把 build options(含 PinK preBuild hook
    // 注入的 wechatToolsPath)持久化到 dest/cocos.compile.config.json,run stage hook 从这里读回。
    // 背景:CLI createBuildStageTask 对 web 系平台(name.startsWith('web'))不自动读这个文件,
    //       stage hook 拿到的 options 是 undefined;wechatgame 名字凑巧 'web' 开头被命中。
    //       cocos-code docs/design/builder/cli-stage-execution-requirements.md TODO-1 跟踪长期解法。
    options.generateCompileConfig = true;
    // 暂存用户的开放数据域工程
    const openDataContextPath = (0, path_1.join)(result.paths.dir, OPEN_DATA_CONTEXT_ROOT);
    const openDataContextTemp = (0, path_1.join)(result.paths.tempDir, OPEN_DATA_CONTEXT_ROOT);
    if ((0, fs_extra_1.existsSync)(openDataContextPath)) {
        if ((0, fs_extra_1.existsSync)(openDataContextTemp)) {
            (0, fs_extra_1.removeSync)(openDataContextTemp);
        }
        (0, fs_extra_1.copySync)(openDataContextPath, openDataContextTemp);
    }
}
async function onAfterInit(options, result, cache) {
    const packagesOptions = options.packages.wechatgame;
    if (options.server && !options.server.endsWith('/')) {
        options.server += '/';
    }
    // 注入一些改变引擎编译的参数
    if (packagesOptions.separateEngine) {
        options.buildEngineParam.separateEngineOptions = {
            useCacheForce: false,
            pluginFeatures: 'default',
            pluginName: 'cocos',
            checkVersionValid: true,
            signatureProvider: require('../static/cocos/signature.json').provider,
        };
        options.buildEngineParam.nativeCodeBundleMode = 'wasm';
    }
    options.buildEngineParam.assetURLFormat = 'relative-from-out';
    // 恢复用户的开放数据域工程
    const openDataContextPath = (0, path_1.join)(result.paths.dir, OPEN_DATA_CONTEXT_ROOT);
    const openDataContextTemp = (0, path_1.join)(result.paths.tempDir, OPEN_DATA_CONTEXT_ROOT);
    if ((0, fs_extra_1.existsSync)(openDataContextTemp)) {
        (0, fs_extra_1.moveSync)(openDataContextTemp, openDataContextPath);
    }
    else if (packagesOptions.buildOpenDataContextTemplate) {
        const enginePath = options.engineInfo.typescript.path;
        const templatePath = (0, path_1.join)(enginePath, 'platforms/minigame', OPEN_DATA_CONTEXT_ROOT);
        (0, fs_extra_1.copySync)(templatePath, openDataContextPath);
    }
    options.buildScriptParam.flags.WASM_SUBPACKAGE = packagesOptions.wasmSubpackage && !packagesOptions.separateEngine;
}
function onBeforeBundleInit(options) {
    options.moveRemoteBundleScript = true;
    if (options.polyfills) {
        options.polyfills.asyncFunctions = false;
    }
    options.buildScriptParam.importMapFormat = 'commonjs';
}
async function onAfterBundleBuildTask(options, bundles, cache) {
    const subpackages = [];
    bundles.forEach((bundle) => {
        if (!bundle.isSubpackage) {
            return;
        }
        // 处理 game.js 文件
        const dest = (0, path_1.join)((0, path_1.dirname)(bundle.scriptDest), 'game.js');
        if ((0, fs_extra_1.existsSync)(bundle.scriptDest)) {
            (0, fs_extra_1.renameSync)(bundle.scriptDest, dest);
        }
        else {
            (0, fs_extra_1.outputFileSync)(dest, `console.log('${ejs_1.name}: no script in subPackage.')`, 'utf8');
        }
        bundle.scriptDest = dest;
        subpackages.push({
            name: bundle.name,
            root: `subpackages/${bundle.name}/`,
        });
    });
    subpackages.length && (options.packages.wechatgame.subpackages = subpackages);
}
async function onAfterBuildAssets(options, result, cache) {
    // 380 防止构建过程中修改启用插屏，问卷校验失败
    if (!options.useSplashScreen) {
        options.useSplashScreen = true;
    }
}
/**
 * 剔除不需要参与构建的资源
 * @param options
 * @param settings
 */
async function onBeforeCompressSettings(options, result, cache) {
    if (!result.paths.dir) {
        return;
    }
    result.settings.scripting.scriptPackages = result.scriptPackages.map(path => `project://${(0, path_1.relative)(result.paths.dir, path).replace(/\\/g, '/')}`);
    // 校验完插屏问卷后，关闭平台插屏
    result.settings.splashScreen && (result.settings.splashScreen.totalTime = 0);
}
/**
 * Hack 目前微信加载子包脚本需要单独处理对应脚本加载
 */
async function onBeforeCopyBuildTemplate(options, result, cache) {
    // 拷贝 adapter 文件
    for (const name of ['web-adapter', 'engine-adapter']) {
        await (0, fs_extra_1.copy)((0, path_1.join)(__dirname, 'adapter', `${name}.${options.debug ? '' : 'min.'}js`), (0, path_1.join)(result.paths.dir, `${name}.js`));
    }
    const gameDest = (0, path_1.join)(result.paths.dir, 'game.js');
    options.md5CacheOptions.replaceOnly.push('game.js');
    if (!this.buildTemplate.findFile('game.js')) {
        const gameEjsTemplate = this.buildTemplate.initUrl('game.ejs') || (0, path_1.join)(share_1.Paths.internalTemplateDir, 'game.ejs');
        const alpha = result.settings.engine.macros?.['ENABLE_TRANSPARENT_CANVAS'];
        const antialias = result.settings.engine.macros?.['ENABLE_WEBGL_ANTIALIAS'];
        const engineName = options.buildEngineParam.engineName;
        // 编译 game.js
        const gameJsRenderConfig = {
            engineName,
            cocosTemplate: (0, path_1.join)(share_1.Paths.internalTemplateDir, 'cocos-script.ejs'),
            polyfillsBundleFile: (result.paths.polyfillsJs && this.utils.relativeUrl(result.paths.dir, result.paths.polyfillsJs)) || false,
            systemJsBundleFile: this.utils.relativeUrl(result.paths.dir, result.paths.systemJs),
            importMapFile: this.utils.relativeUrl(result.paths.dir, result.paths.importMap),
            applicationJs: './' + this.utils.relativeUrl(result.paths.dir, result.paths.applicationJS),
            engineDir: this.utils.relativeUrl(result.paths.dir, result.paths.engineDir),
            alpha: alpha === undefined ? 'default' : alpha,
            antialias: antialias === undefined ? 'default' : antialias,
            useWebgl2: options.includeModules.includes('gfx-webgl2'),
        };
        const contents = await ejs_1.default.renderFile(gameEjsTemplate, gameJsRenderConfig);
        (0, fs_extra_1.writeFileSync)(gameDest, contents, 'utf8');
    }
}
async function onAfterCopyBuildTemplate(options, result) {
    // json 文件需要做与用户模板的整理工作，这里需要在用户模板拷贝之后注意顺序
    await buildGameJson(result.paths.dir, options, result, this.buildTemplate.findFile('game.json'));
    buildProjectConfig(result.paths.dir, options, this.buildTemplate.findFile('project.config.json'));
}
async function buildWeChatSplash(utils, options, result) {
    const splashScreen = options.splashScreen;
    const imageStatus = {
        logo: '', // 记录 logo 图片的路径，为空表示不需要拷贝
        background: '', // 记录背景图片的路径，为空表示不需要拷贝
        slogan: '', // 记录 slogan 图片的路径，为空表示不需要拷贝
    };
    if (splashScreen.logo.type === 'default') {
        imageStatus.logo = (0, path_1.join)(share_1.Paths.internalTemplateDir, 'logo.png');
        imageStatus.slogan = (0, path_1.join)(share_1.Paths.internalTemplateDir, 'slogan.png');
    }
    else if (splashScreen.logo.type === 'custom' && splashScreen.logo.image) {
        imageStatus.logo = utils.resolveToRaw(splashScreen.logo.image);
    }
    if (splashScreen.background.type === 'custom' && splashScreen.background.image) {
        imageStatus.background = utils.resolveToRaw(splashScreen.background.image);
    }
    const splashScreenSettings = result.settings.splashScreen;
    const filesToCopy = [];
    Object.entries(imageStatus).forEach(([type, filePath]) => {
        if (filePath) {
            try {
                // 过滤要拷贝图片
                const { ext } = (0, path_1.parse)(filePath);
                const targetPath = (0, path_1.join)(result.paths.dir, `${type}${ext}`);
                filesToCopy.push({ source: filePath, target: targetPath });
                // hack wechatgame 的 settings 需要告知图片路径
                if (splashScreenSettings?.logo && type === 'logo') {
                    splashScreenSettings.logo.image = (0, path_1.relative)(result.paths.settings, targetPath);
                    // 微信小游戏里并未使用这个base64，而是使用的文件
                    splashScreenSettings.logo.base64 = '';
                }
                if (splashScreenSettings?.background && type === 'background') {
                    splashScreenSettings.background.image = (0, path_1.relative)(result.paths.settings, targetPath);
                }
            }
            catch (error) {
                console.warn(error);
            }
        }
    });
    // 并发拷贝图片
    await Promise.all(filesToCopy.map(({ source, target }) => (0, fs_extra_1.copyFile)(source, target)));
    // 重新写入 splashScreen 配置到 settings.json 文件
    const settingsCode = (0, fs_extra_1.readFileSync)(result.paths.settings, 'utf8');
    const settings = JSON.parse(settingsCode);
    settings.splashScreen = splashScreenSettings;
    (0, fs_extra_1.writeFileSync)(result.paths.settings, JSON.stringify(settings, null, 0), 'utf8');
}
async function onAfterBuild(options, result) {
    // Align with Creator Editor: splash images are copied after md5 processing so logo.png keeps its original name.
    await buildWeChatSplash(this.utils, options, result);
    const firstScreenFile = (0, path_1.join)(result.paths.dir, 'first-screen.js');
    // 读取首屏模版并生成首屏文件
    if (!this.buildTemplate.findFile('first-screen.js')) {
        const splashScreen = result.settings.splashScreen;
        const designResolution = options.designResolution || {};
        const firstScreenTemplateFile = (0, path_1.join)(share_1.Paths.internalTemplateDir, 'first-screen.ejs');
        const background = splashScreen.background || { type: 'default' };
        const bgColor = background.color;
        const logo = splashScreen.logo || { type: 'default' };
        const firstScreenRenderConfig = {
            displayRatio: splashScreen.displayRatio ?? 1,
            bgColor: bgColor ? [bgColor.x, bgColor.y, bgColor.z, bgColor.w] : [0, 0, 0, 1],
            useCustomBg: background.type === 'custom',
            useLogo: logo.type !== 'none',
            useDefaultLogo: logo.type === 'default',
            logoName: (0, path_1.basename)(logo.image || 'logo.png'),
            bgName: (0, path_1.basename)(background.image || 'background.png'),
            fitWidth: designResolution.fitWidth ?? true,
            fitHeight: designResolution.fitHeight ?? true,
        };
        const renderContent = await ejs_1.default.renderFile(firstScreenTemplateFile, firstScreenRenderConfig);
        (0, fs_extra_1.writeFileSync)(firstScreenFile, renderContent, 'utf8');
    }
}
/**
 * 编译 project.config.json
 * @param buildTemplateDir
 * @param buildDest
 * @param options
 */
function buildProjectConfig(buildDest, options, userProjectConfigPath) {
    const packagesOptions = options.packages.wechatgame;
    const contents = (0, fs_extra_1.readJSONSync)((0, path_1.join)(share_1.Paths.internalTemplateDir, 'project.config.json'));
    // 用户模板内拷贝的 project.config.json
    if (userProjectConfigPath) {
        const userConfig = (0, fs_extra_1.readJSONSync)(userProjectConfigPath);
        Object.assign(contents, userConfig);
    }
    // 与构建面板的数据做融合
    contents.appid = packagesOptions.appid || 'wx6ac3f5090a6b99c5';
    contents.projectname = options.name;
    const dest = (0, path_1.join)(buildDest, 'project.config.json');
    options.md5CacheOptions.excludes.push('project.config.json');
    (0, fs_extra_1.outputJSONSync)(dest, contents);
}
/**
 * 编译 game.json
 * @param buildTemplateDir
 * @param buildDest
 * @param options
 * @param settings
 */
async function buildGameJson(buildDest, options, result, userGameJsonPath) {
    const packagesOptions = options.packages.wechatgame;
    const contents = (0, fs_extra_1.readJSONSync)((0, path_1.join)(share_1.Paths.internalTemplateDir, 'game.json'));
    // 用户模板内拷贝的 game.json
    if (userGameJsonPath) {
        const userConfig = (0, fs_extra_1.readJSONSync)(userGameJsonPath);
        Object.assign(contents, userConfig);
    }
    // 与构建面板的数据做融合
    contents.deviceOrientation = packagesOptions.orientation;
    if (packagesOptions.separateEngine) {
        contents.plugins = {
            cocos: {
                version: options.engineInfo.version,
                provider: require((0, path_1.join)(__dirname, '../static/cocos/signature.json')).provider,
            },
        };
    }
    if (packagesOptions.buildOpenDataContextTemplate) {
        contents.openDataContext = OPEN_DATA_CONTEXT_ROOT;
    }
    if (!contents.openDataContext) {
        // 微信运行时 openDataContext 为空会报错
        delete contents.openDataContext;
    }
    if (packagesOptions.highPerformanceMode) {
        contents.iOSHighPerformance = true;
    }
    else {
        delete contents.iOSHighPerformance;
    }
    // 处理引擎 wasm 模块分包
    if (packagesOptions.wasmSubpackage && !packagesOptions.separateEngine) {
        const wasmAssetSubpkg = (0, path_1.join)(result.paths.engineDir, './assets/');
        const wasmChunkSubpkg = (0, path_1.join)(result.paths.engineDir, './chunks/');
        if ((0, fs_extra_1.existsSync)(wasmAssetSubpkg)) {
            packagesOptions.subpackages ??= [];
            packagesOptions.subpackages.push({
                name: '__ccWasmAssetSubpkg__',
                root: `cocos-js/assets/`,
            });
        }
        if ((0, fs_extra_1.existsSync)(wasmChunkSubpkg)) {
            packagesOptions.subpackages ??= [];
            packagesOptions.subpackages.push({
                name: '__ccWasmChunkSubpkg__',
                root: `cocos-js/chunks/`,
            });
        }
    }
    if (packagesOptions.subpackages) {
        contents.subpackages = packagesOptions.subpackages;
    }
    const dest = (0, path_1.join)(buildDest, 'game.json');
    options.md5CacheOptions.excludes.push('game.json');
    (0, fs_extra_1.outputJSONSync)(dest, contents, {
        spaces: 4,
    });
}
// ============================================================
// customBuildStage: run — 在微信 DevTools 中启动构建好的游戏
// 迁自 editor-3d-dev 旧 platform-extensions/wechatgame/source/main.ts。
// PinK 在场:wechatToolsPath 由 build-config-host.ts 的 registerPreStageHook 在执行阶段前现读现注入
//   (programManager.wechatDevTools → 运行时 options,不落盘);CLI 这边直接读。
// CLI 独立运行:用户在 build options 直接给 wechatToolsPath 即可,不依赖 PinK。
// ============================================================
const RUN_SYMBOL_REGEX = /([`~!#$%^&*+=<>?"{}|,;'·~！#￥%……&*（）+={}|《》？：“”【】、；‘’，。、])/im;
function normalizeWin32DriveLetter(filePath) {
    if (process.platform !== 'win32') {
        return filePath;
    }
    return filePath.replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`);
}
/**
 * 解析微信开发者工具 cli 可执行路径(支持 darwin / win32 两种打包结构);
 * 返回 [cliPath, shell] — shell 为 true 时 spawn 需要 shell 模式(win32)。
 */
function resolveWechatCliPath(wechatRoot) {
    // 1.0.2 起 mac/win 都拿 .app/.exe;windows 下需要取它的所在目录
    let root = wechatRoot;
    try {
        if (!(0, fs_extra_1.statSync)(root).isDirectory() && process.platform === 'win32') {
            root = (0, path_1.dirname)(root);
        }
    }
    catch {
        return null;
    }
    let cliPath;
    if (process.platform === 'darwin') {
        cliPath = (0, path_1.join)(root, 'Contents/Resources/app.nw/bin/cli');
        // 1.02.2003250 调整后的备用路径
        if (!(0, fs_extra_1.existsSync)(cliPath)) {
            cliPath = (0, path_1.join)(root, 'Contents/MacOS/cli');
        }
    }
    else {
        cliPath = (0, path_1.join)(root, 'cli.bat');
    }
    cliPath = normalizeWin32DriveLetter(cliPath);
    if (!(0, fs_extra_1.existsSync)(cliPath)) {
        return null;
    }
    return { cliPath, shell: process.platform === 'win32' };
}
const WECHAT_CLI_TIMEOUT_MS = 2 * 60 * 1000;
/**
 * CLI BuildStageTask 调用 stage hook 的契约(stage-task-manager.ts:64-70):
 *     await func(this.root, this.options)
 * 即第一参数 = 输出目录绝对路径,第二参数 = build options。
 *
 * options 优先用入参(CLI 正常传入 this.options 时直接用);仅当入参缺失/为空时,
 * 才回退读 dest/cocos.compile.config.json(由 onBeforeBuild 强制 generateCompileConfig=true
 * 后主 build 落盘)。背景:CLI createBuildStageTask 对 web 系平台(platform.startsWith('web'))
 * 会跳过 readBuildTaskOptions(index.ts:174),this.options 实为 undefined,此时才需要从文件读回。
 */
async function run(root, _options) {
    // 输出路径含特殊符号 → warn(微信工具对路径要求严格)
    const matched = root.match(RUN_SYMBOL_REGEX);
    if (matched) {
        console.warn(`[wechatgame:run] 构建输出路径包含特殊字符「${matched[1]}」,微信 DevTools 可能加载失败;建议改名后重新构建。`);
    }
    // options 优先用入参;为空(web 系平台 CLI 跳过 readBuildTaskOptions 导致 undefined)才回退读元数据文件
    let options;
    if (_options && typeof _options === 'object' && Object.keys(_options).length > 0) {
        options = _options;
    }
    else {
        try {
            options = (0, fs_extra_1.readJSONSync)((0, path_1.join)(root, 'cocos.compile.config.json'));
        }
        catch {
            throw new Error(`无法读取构建元数据 (${(0, path_1.join)(root, 'cocos.compile.config.json')});请先成功构建一次该平台。`);
        }
    }
    // 优先读平台选项 packages.wechatgame.wechatToolsPath(PinK preBuildHook 注入 / 表单填 / CLI 用户填);
    // 兼容顶层 wechatToolsPath(旧写法 / CLI 独立用户直接顶层提供)
    const wechatRoot = options.packages?.wechatgame?.wechatToolsPath || options.wechatToolsPath;
    console.log(`[wechatgame:run] options 来源=${_options && Object.keys(_options).length > 0 ? 'CLI 入参' : 'compile.config 文件'};`
        + ` packages.wechatgame.wechatToolsPath=${options.packages?.wechatgame?.wechatToolsPath ?? '(无)'};`
        + ` 顶层 wechatToolsPath=${options.wechatToolsPath ?? '(无)'}`);
    if (!wechatRoot || !(0, fs_extra_1.existsSync)(wechatRoot)) {
        throw new Error('WeChat DevTools 路径未配置或不存在。\n'
            + 'PinK 用户:请到 Preferences → Program Manager → WeChat DevTools 选择 cli/cli.bat 所在的安装目录或可执行文件,然后重新构建一次让设置生效。\n'
            + 'CLI 命令行用户:请在 build options 中提供 wechatToolsPath 字段。');
    }
    const resolved = resolveWechatCliPath(wechatRoot);
    if (!resolved) {
        throw new Error(`WeChat DevTools cli 未找到 (检查路径: ${wechatRoot})`);
    }
    let { cliPath } = resolved;
    let rootPath = root;
    if (process.platform === 'win32') {
        cliPath = `"${(0, path_1.normalize)(cliPath)}"`; // win32 spawn shell 模式下含空格路径需引号
        rootPath = `"${path_1.win32.normalize(root)}"`; // 同理 project 路径含空格也需引号
    }
    // 新版微信开发者工具(2.x)cli 用子命令语法:`open --project <path>`。
    // 旧版的 `-o <path> -f cocos` 已废弃,在新版上会报「Please ensure that the IDE has been properly installed」。
    const projectConfigPath = (0, path_1.join)(root, 'project.config.json');
    if (!(0, fs_extra_1.existsSync)(projectConfigPath)) {
        throw new Error(`WeChat DevTools 启动失败: 构建输出目录缺少 project.config.json。请确认 run stage 的 dest 指向微信小游戏构建产物目录: ${root}`);
    }
    const args = ['open', '--project', rootPath];
    const command = `${cliPath} ${args.join(' ')}`;
    const fallbackCommand = `${cliPath} open`;
    console.log(`[wechatgame:run] ${command}`);
    // await cli 退出并捕获输出:cli `open` 会启动 DevTools 并打开项目后返回。
    // 之前 fire-and-forget,cli 失败(如「Please ensure that the IDE has been properly installed」)
    // 时 stage 仍算成功,用户只能在 console 看到报错。现在收集输出 + 非零退出抛出,
    // 让真实报错经 PinK 任务卡片显示(host mapTask 已透传 task.message)。
    const { stdout, stderr, exitCode } = await new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, { maxBuffer: 10 * 1024 * 1024, timeout: WECHAT_CLI_TIMEOUT_MS }, (error, stdout, stderr) => {
            if (stdout) {
                console.log(`[WeChat Dev Tool] ${stdout}`);
            }
            if (stderr) {
                console.warn(`[WeChat Dev Tool] ${stderr}`);
            }
            if (error?.killed) {
                console.warn(`[wechatgame:run] open --project timed out, fallback to ${fallbackCommand}`);
                (0, child_process_1.exec)(fallbackCommand, { maxBuffer: 10 * 1024 * 1024, timeout: WECHAT_CLI_TIMEOUT_MS }, (fallbackError, fallbackStdout, fallbackStderr) => {
                    if (fallbackStdout) {
                        console.log(`[WeChat Dev Tool] ${fallbackStdout}`);
                    }
                    if (fallbackStderr) {
                        console.warn(`[WeChat Dev Tool] ${fallbackStderr}`);
                    }
                    if (fallbackError?.killed) {
                        reject(new Error('WeChat DevTools 启动超时。'
                            + '如果开发者工具弹出 "Enable IDE Service" 确认框,请在微信开发者工具中点击允许/启用;'
                            + '也可以进入 Settings -> Security Settings 手动开启 Service Port 后重新执行 run。'));
                        return;
                    }
                    if (fallbackError && typeof fallbackError.code !== 'number') {
                        reject(fallbackError);
                        return;
                    }
                    resolve({
                        stdout: fallbackStdout,
                        stderr: fallbackStderr,
                        exitCode: fallbackError && typeof fallbackError.code === 'number' ? fallbackError.code : 0,
                    });
                });
                return;
            }
            if (error && typeof error.code !== 'number') {
                reject(error);
                return;
            }
            resolve({
                stdout,
                stderr,
                exitCode: error && typeof error.code === 'number' ? error.code : 0,
            });
        });
    });
    const output = `${stdout}\n${stderr}`.trim();
    // DevTools cli 即使退出码为 0 也可能在输出里报错(各版本行为不一);两个判据任一命中即视为失败。
    const failedByOutput = /properly installed|not installed|\[error\]|\berror\s*:|failed|fail to|failure|失败|无法/i.test(output);
    if (exitCode !== 0 || failedByOutput) {
        throw new Error(`WeChat DevTools 启动失败(exit ${exitCode})。\n`
            + (output ? `DevTools 输出:${output}\n` : '')
            + '常见原因:\n'
            + '1. WeChat DevTools 未开启「服务端口」:打开开发者工具 → 设置 → 安全设置 → 开启「服务端口」(CLI/HTTP 调用必需);\n'
            + '2. wechatToolsPath 指向的不是有效安装目录(需含 cli.bat / cli);\n'
            + '3. 开发者工具安装不完整,请重装后先手动打开一次。');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlYixzQ0FpQkM7QUFFRCxrQ0FpQ0M7QUFFRCxnREFNQztBQUVELHdEQW9CQztBQUdELGdEQUtDO0FBT0QsNERBUUM7QUFLRCw4REE2QkM7QUFFRCw0REFJQztBQXNERCxvQ0EwQkM7QUErSkQsa0JBMkhDO0FBeGdCRCx1Q0FBdUw7QUFDdkwsK0JBQWtGO0FBQ2xGLGlEQUFxQztBQUNyQywyQ0FBZ0M7QUFFaEMsbUNBQWdDO0FBSWhDLE1BQU0sc0JBQXNCLEdBQUcsaUJBQWlCLENBQUM7QUFFcEMsUUFBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsaUJBQWlCO0FBRTFDLEtBQUssVUFBVSxhQUFhLENBQUMsT0FBNEIsRUFBRSxNQUEyQixFQUFFLEtBQW1CO0lBQzlHLDJFQUEyRTtJQUMzRSxnRkFBZ0Y7SUFDaEYseUVBQXlFO0lBQ3pFLHdFQUF3RTtJQUN4RSwwRkFBMEY7SUFDMUYsT0FBTyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztJQUVyQyxlQUFlO0lBQ2YsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQzNFLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUMvRSxJQUFJLElBQUEscUJBQVUsRUFBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7UUFDbEMsSUFBSSxJQUFBLHFCQUFVLEVBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO1lBQ2xDLElBQUEscUJBQVUsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFD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O1lBQ1gsQ0FBQztZQUNELE9BQU8sQ0FBQztnQkFDSixNQUFNO2dCQUNOLE1BQU07Z0JBQ04sUUFBUSxFQUFFLEtBQUssSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3JFLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM3QywwREFBMEQ7SUFDMUQsTUFBTSxjQUFjLEdBQUcsc0ZBQXNGLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNILElBQUksUUFBUSxLQUFLLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNuQyxNQUFNLElBQUksS0FBSyxDQUNYLDZCQUE2QixRQUFRLE1BQU07Y0FDekMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGVBQWUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztjQUN6QyxTQUFTO2NBQ1QsK0VBQStFO2NBQy9FLHFEQUFxRDtjQUNyRCw0QkFBNEIsQ0FDakMsQ0FBQztJQUNOLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb3B5U3luYywgZXhpc3RzU3luYywgb3V0cHV0RmlsZVN5bmMsIHJlbW92ZVN5bmMsIHJlbmFtZVN5bmMsIHdyaXRlRmlsZVN5bmMsIHJlYWRKU09OU3luYywgb3V0cHV0SlNPTlN5bmMsIG1vdmVTeW5jLCBjb3B5LCBjb3B5RmlsZSwgcmVhZEZpbGVTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luLCByZWxhdGl2ZSwgZGlybmFtZSwgcGFyc2UsIHdpbjMyLCBub3JtYWxpemUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBFanMsIHsgbmFtZSB9IGZyb20gJ2Vqcyc7XG5cbmltcG9ydCB7IFBhdGhzIH0gZnJvbSAnLi9zaGFyZSc7XG5pbXBvcnQgeyBJbnRlcm5hbEJ1aWxkUmVzdWx0LCBCdWlsZGVyQ2FjaGUsIElCdW5kbGUsIElCdWlsZGVyLCBJQnVpbGRVdGlscyB9IGZyb20gJ0Bjb2Nvcy9jb2Nvcy1jbGktdHlwZXMvYnVpbGRlcic7XG5pbXBvcnQgeyBJV2VjaGF0QnVpbGRPcHRpb25zIH0gZnJvbSAnLi90eXBlJztcblxuY29uc3QgT1BFTl9EQVRBX0NPTlRFWFRfUk9PVCA9ICdvcGVuRGF0YUNvbnRleHQnO1xuXG5leHBvcnQgY29uc3QgdGhyb3dFcnJvciA9IHRydWU7IC8vIOagh+iusOaYr+WQpuS7u+WKoeWksei0peaXtu+8jOaKm+WHuumUmeivr1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25CZWZvcmVCdWlsZChvcHRpb25zOiBJV2VjaGF0QnVpbGRPcHRpb25zLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQsIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICAvLyDlvLrliLblvIDlkK8gZ2VuZXJhdGVDb21waWxlQ29uZmlnOuiuqeS4uyBidWlsZCDmioogYnVpbGQgb3B0aW9ucyjlkKsgUGluSyBwcmVCdWlsZCBob29rXG4gICAgLy8g5rOo5YWl55qEIHdlY2hhdFRvb2xzUGF0aCnmjIHkuYXljJbliLAgZGVzdC9jb2Nvcy5jb21waWxlLmNvbmZpZy5qc29uLHJ1biBzdGFnZSBob29rIOS7jui/memHjOivu+WbnuOAglxuICAgIC8vIOiDjOaZrzpDTEkgY3JlYXRlQnVpbGRTdGFnZVRhc2sg5a+5IHdlYiDns7vlubPlj7AobmFtZS5zdGFydHNXaXRoKCd3ZWInKSnkuI3oh6rliqjor7vov5nkuKrmlofku7YsXG4gICAgLy8gICAgICAgc3RhZ2UgaG9vayDmi7/liLDnmoQgb3B0aW9ucyDmmK8gdW5kZWZpbmVkO3dlY2hhdGdhbWUg5ZCN5a2X5YeR5benICd3ZWInIOW8gOWktOiiq+WRveS4reOAglxuICAgIC8vICAgICAgIGNvY29zLWNvZGUgZG9jcy9kZXNpZ24vYnVpbGRlci9jbGktc3RhZ2UtZXhlY3V0aW9uLXJlcXVpcmVtZW50cy5tZCBUT0RPLTEg6Lef6Liq6ZW/5pyf6Kej5rOV44CCXG4gICAgb3B0aW9ucy5nZW5lcmF0ZUNvbXBpbGVDb25maWcgPSB0cnVlO1xuXG4gICAgLy8g5pqC5a2Y55So5oi355qE5byA5pS+5pWw5o2u5Z+f5bel56iLXG4gICAgY29uc3Qgb3BlbkRhdGFDb250ZXh0UGF0aCA9IGpvaW4ocmVzdWx0LnBhdGhzLmRpciwgT1BFTl9EQVRBX0NPTlRFWFRfUk9PVCk7XG4gICAgY29uc3Qgb3BlbkRhdGFDb250ZXh0VGVtcCA9IGpvaW4ocmVzdWx0LnBhdGhzLnRlbXBEaXIsIE9QRU5fREFUQV9DT05URVhUX1JPT1QpO1xuICAgIGlmIChleGlzdHNTeW5jKG9wZW5EYXRhQ29udGV4dFBhdGgpKSB7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKG9wZW5EYXRhQ29udGV4dFRlbXApKSB7XG4gICAgICAgICAgICByZW1vdmVTeW5jKG9wZW5EYXRhQ29udGV4dFRlbXApO1xuICAgICAgICB9XG4gICAgICAgIGNvcHlTeW5jKG9wZW5EYXRhQ29udGV4dFBhdGgsIG9wZW5EYXRhQ29udGV4dFRlbXApO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWZ0ZXJJbml0KG9wdGlvbnM6IElXZWNoYXRCdWlsZE9wdGlvbnMsIHJlc3VsdDogSW50ZXJuYWxCdWlsZFJlc3VsdCwgY2FjaGU6IEJ1aWxkZXJDYWNoZSkge1xuICAgIGNvbnN0IHBhY2thZ2VzT3B0aW9ucyA9IG9wdGlvbnMucGFja2FnZXMud2VjaGF0Z2FtZTtcblxuICAgIGlmIChvcHRpb25zLnNlcnZlciAmJiAhb3B0aW9ucy5zZXJ2ZXIuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgICBvcHRpb25zLnNlcnZlciArPSAnLyc7XG4gICAgfVxuXG4gICAgLy8g5rOo5YWl5LiA5Lqb5pS55Y+Y5byV5pOO57yW6K+R55qE5Y+C5pWwXG4gICAgaWYgKHBhY2thZ2VzT3B0aW9ucy5zZXBhcmF0ZUVuZ2luZSkge1xuICAgICAgICBvcHRpb25zLmJ1aWxkRW5naW5lUGFyYW0uc2VwYXJhdGVFbmdpbmVPcHRpb25zID0ge1xuICAgICAgICAgICAgdXNlQ2FjaGVGb3JjZTogZmFsc2UsXG4gICAgICAgICAgICBwbHVnaW5GZWF0dXJlczogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgcGx1Z2luTmFtZTogJ2NvY29zJyxcbiAgICAgICAgICAgIGNoZWNrVmVyc2lvblZhbGlkOiB0cnVlLFxuICAgICAgICAgICAgc2lnbmF0dXJlUHJvdmlkZXI6IHJlcXVpcmUoJy4uL3N0YXRpYy9jb2Nvcy9zaWduYXR1cmUuanNvbicpLnByb3ZpZGVyLFxuICAgICAgICB9O1xuICAgICAgICBvcHRpb25zLmJ1aWxkRW5naW5lUGFyYW0ubmF0aXZlQ29kZUJ1bmRsZU1vZGUgPSAnd2FzbSc7XG4gICAgfVxuICAgIG9wdGlvbnMuYnVpbGRFbmdpbmVQYXJhbS5hc3NldFVSTEZvcm1hdCA9ICdyZWxhdGl2ZS1mcm9tLW91dCc7XG5cbiAgICAvLyDmgaLlpI3nlKjmiLfnmoTlvIDmlL7mlbDmja7ln5/lt6XnqItcbiAgICBjb25zdCBvcGVuRGF0YUNvbnRleHRQYXRoID0gam9pbihyZXN1bHQucGF0aHMuZGlyLCBPUEVOX0RBVEFfQ09OVEVYVF9ST09UKTtcbiAgICBjb25zdCBvcGVuRGF0YUNvbnRleHRUZW1wID0gam9pbihyZXN1bHQucGF0aHMudGVtcERpciwgT1BFTl9EQVRBX0NPTlRFWFRfUk9PVCk7XG4gICAgaWYgKGV4aXN0c1N5bmMob3BlbkRhdGFDb250ZXh0VGVtcCkpIHtcbiAgICAgICAgbW92ZVN5bmMob3BlbkRhdGFDb250ZXh0VGVtcCwgb3BlbkRhdGFDb250ZXh0UGF0aCk7XG4gICAgfSBlbHNlIGlmIChwYWNrYWdlc09wdGlvbnMuYnVpbGRPcGVuRGF0YUNvbnRleHRUZW1wbGF0ZSkge1xuICAgICAgICBjb25zdCBlbmdpbmVQYXRoID0gb3B0aW9ucy5lbmdpbmVJbmZvLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVQYXRoID0gam9pbihlbmdpbmVQYXRoLCAncGxhdGZvcm1zL21pbmlnYW1lJywgT1BFTl9EQVRBX0NPTlRFWFRfUk9PVCk7XG4gICAgICAgIGNvcHlTeW5jKHRlbXBsYXRlUGF0aCwgb3BlbkRhdGFDb250ZXh0UGF0aCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5idWlsZFNjcmlwdFBhcmFtLmZsYWdzLldBU01fU1VCUEFDS0FHRSA9IHBhY2thZ2VzT3B0aW9ucy53YXNtU3VicGFja2FnZSAmJiAhcGFja2FnZXNPcHRpb25zLnNlcGFyYXRlRW5naW5lO1xuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkJlZm9yZUJ1bmRsZUluaXQob3B0aW9uczogSVdlY2hhdEJ1aWxkT3B0aW9ucykge1xuICAgIG9wdGlvbnMubW92ZVJlbW90ZUJ1bmRsZVNjcmlwdCA9IHRydWU7XG4gICAgaWYgKG9wdGlvbnMucG9seWZpbGxzKSB7XG4gICAgICAgIG9wdGlvbnMucG9seWZpbGxzLmFzeW5jRnVuY3Rpb25zID0gZmFsc2U7XG4gICAgfVxuICAgIG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5pbXBvcnRNYXBGb3JtYXQgPSAnY29tbW9uanMnO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25BZnRlckJ1bmRsZUJ1aWxkVGFzayhvcHRpb25zOiBJV2VjaGF0QnVpbGRPcHRpb25zLCBidW5kbGVzOiBJQnVuZGxlW10sIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICBjb25zdCBzdWJwYWNrYWdlczogeyBuYW1lOiBzdHJpbmcsIHJvb3Q6IHN0cmluZyB9W10gPSBbXTtcbiAgICBidW5kbGVzLmZvckVhY2goKGJ1bmRsZSkgPT4ge1xuICAgICAgICBpZiAoIWJ1bmRsZS5pc1N1YnBhY2thZ2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDlpITnkIYgZ2FtZS5qcyDmlofku7ZcbiAgICAgICAgY29uc3QgZGVzdCA9IGpvaW4oZGlybmFtZShidW5kbGUuc2NyaXB0RGVzdCksICdnYW1lLmpzJyk7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGJ1bmRsZS5zY3JpcHREZXN0KSkge1xuICAgICAgICAgICAgcmVuYW1lU3luYyhidW5kbGUuc2NyaXB0RGVzdCwgZGVzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXRGaWxlU3luYyhkZXN0LCBgY29uc29sZS5sb2coJyR7bmFtZX06IG5vIHNjcmlwdCBpbiBzdWJQYWNrYWdlLicpYCwgJ3V0ZjgnKTtcbiAgICAgICAgfVxuICAgICAgICBidW5kbGUuc2NyaXB0RGVzdCA9IGRlc3Q7XG4gICAgICAgIHN1YnBhY2thZ2VzLnB1c2goe1xuICAgICAgICAgICAgbmFtZTogYnVuZGxlLm5hbWUsXG4gICAgICAgICAgICByb290OiBgc3VicGFja2FnZXMvJHtidW5kbGUubmFtZX0vYCxcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VicGFja2FnZXMubGVuZ3RoICYmIChvcHRpb25zLnBhY2thZ2VzLndlY2hhdGdhbWUuc3VicGFja2FnZXMgPSBzdWJwYWNrYWdlcyk7XG59XG5cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWZ0ZXJCdWlsZEFzc2V0cyhvcHRpb25zOiBJV2VjaGF0QnVpbGRPcHRpb25zLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQsIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICAvLyAzODAg6Ziy5q2i5p6E5bu66L+H56iL5Lit5L+u5pS55ZCv55So5o+S5bGP77yM6Zeu5Y235qCh6aqM5aSx6LSlXG4gICAgaWYgKCFvcHRpb25zLnVzZVNwbGFzaFNjcmVlbikge1xuICAgICAgICBvcHRpb25zLnVzZVNwbGFzaFNjcmVlbiA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIOWJlOmZpOS4jemcgOimgeWPguS4juaehOW7uueahOi1hOa6kFxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBwYXJhbSBzZXR0aW5nc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25CZWZvcmVDb21wcmVzc1NldHRpbmdzKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOiBJV2VjaGF0QnVpbGRPcHRpb25zLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQsIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICBpZiAoIXJlc3VsdC5wYXRocy5kaXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXN1bHQuc2V0dGluZ3Muc2NyaXB0aW5nLnNjcmlwdFBhY2thZ2VzID0gcmVzdWx0LnNjcmlwdFBhY2thZ2VzLm1hcChwYXRoID0+IGBwcm9qZWN0Oi8vJHtyZWxhdGl2ZShyZXN1bHQucGF0aHMuZGlyLCBwYXRoKS5yZXBsYWNlKC9cXFxcL2csICcvJyl9YCk7XG5cbiAgICAvLyDmoKHpqozlrozmj5LlsY/pl67ljbflkI7vvIzlhbPpl63lubPlj7Dmj5LlsY9cbiAgICByZXN1bHQuc2V0dGluZ3Muc3BsYXNoU2NyZWVuICYmIChyZXN1bHQuc2V0dGluZ3Muc3BsYXNoU2NyZWVuLnRvdGFsVGltZSA9IDApO1xufVxuXG4vKipcbiAqIEhhY2sg55uu5YmN5b6u5L+h5Yqg6L295a2Q5YyF6ISa5pys6ZyA6KaB5Y2V54us5aSE55CG5a+55bqU6ISa5pys5Yqg6L29XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkJlZm9yZUNvcHlCdWlsZFRlbXBsYXRlKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOiBJV2VjaGF0QnVpbGRPcHRpb25zLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQsIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICAvLyDmi7fotJ0gYWRhcHRlciDmlofku7ZcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgWyd3ZWItYWRhcHRlcicsICdlbmdpbmUtYWRhcHRlciddKSB7XG4gICAgICAgIGF3YWl0IGNvcHkoam9pbihfX2Rpcm5hbWUsICdhZGFwdGVyJywgYCR7bmFtZX0uJHtvcHRpb25zLmRlYnVnID8gJycgOiAnbWluLid9anNgKSwgam9pbihyZXN1bHQucGF0aHMuZGlyLCBgJHtuYW1lfS5qc2ApKTtcbiAgICB9XG5cbiAgICBjb25zdCBnYW1lRGVzdCA9IGpvaW4ocmVzdWx0LnBhdGhzLmRpciwgJ2dhbWUuanMnKTtcbiAgICBvcHRpb25zLm1kNUNhY2hlT3B0aW9ucy5yZXBsYWNlT25seS5wdXNoKCdnYW1lLmpzJyk7XG4gICAgaWYgKCF0aGlzLmJ1aWxkVGVtcGxhdGUuZmluZEZpbGUoJ2dhbWUuanMnKSkge1xuICAgICAgICBjb25zdCBnYW1lRWpzVGVtcGxhdGUgPSB0aGlzLmJ1aWxkVGVtcGxhdGUuaW5pdFVybCgnZ2FtZS5lanMnKSB8fCBqb2luKFBhdGhzLmludGVybmFsVGVtcGxhdGVEaXIsICdnYW1lLmVqcycpO1xuICAgICAgICBjb25zdCBhbHBoYSA9IHJlc3VsdC5zZXR0aW5ncy5lbmdpbmUubWFjcm9zPy5bJ0VOQUJMRV9UUkFOU1BBUkVOVF9DQU5WQVMnXTtcbiAgICAgICAgY29uc3QgYW50aWFsaWFzID0gcmVzdWx0LnNldHRpbmdzLmVuZ2luZS5tYWNyb3M/LlsnRU5BQkxFX1dFQkdMX0FOVElBTElBUyddO1xuICAgICAgICBjb25zdCBlbmdpbmVOYW1lID0gb3B0aW9ucy5idWlsZEVuZ2luZVBhcmFtLmVuZ2luZU5hbWU7XG4gICAgICAgIC8vIOe8luivkSBnYW1lLmpzXG4gICAgICAgIGNvbnN0IGdhbWVKc1JlbmRlckNvbmZpZyA9IHtcbiAgICAgICAgICAgIGVuZ2luZU5hbWUsXG4gICAgICAgICAgICBjb2Nvc1RlbXBsYXRlOiBqb2luKFBhdGhzLmludGVybmFsVGVtcGxhdGVEaXIsICdjb2Nvcy1zY3JpcHQuZWpzJyksXG4gICAgICAgICAgICBwb2x5ZmlsbHNCdW5kbGVGaWxlOiAocmVzdWx0LnBhdGhzLnBvbHlmaWxsc0pzICYmIHRoaXMudXRpbHMucmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLnBvbHlmaWxsc0pzKSkgfHwgZmFsc2UsXG4gICAgICAgICAgICBzeXN0ZW1Kc0J1bmRsZUZpbGU6IHRoaXMudXRpbHMucmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLnN5c3RlbUpzISksXG4gICAgICAgICAgICBpbXBvcnRNYXBGaWxlOiB0aGlzLnV0aWxzLnJlbGF0aXZlVXJsKHJlc3VsdC5wYXRocy5kaXIsIHJlc3VsdC5wYXRocy5pbXBvcnRNYXApLFxuICAgICAgICAgICAgYXBwbGljYXRpb25KczogJy4vJyArIHRoaXMudXRpbHMucmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLmFwcGxpY2F0aW9uSlMpLFxuICAgICAgICAgICAgZW5naW5lRGlyOiB0aGlzLnV0aWxzLnJlbGF0aXZlVXJsKHJlc3VsdC5wYXRocy5kaXIsIHJlc3VsdC5wYXRocy5lbmdpbmVEaXIhKSxcbiAgICAgICAgICAgIGFscGhhOiBhbHBoYSA9PT0gdW5kZWZpbmVkID8gJ2RlZmF1bHQnIDogYWxwaGEsXG4gICAgICAgICAgICBhbnRpYWxpYXM6IGFudGlhbGlhcyA9PT0gdW5kZWZpbmVkID8gJ2RlZmF1bHQnIDogYW50aWFsaWFzLFxuICAgICAgICAgICAgdXNlV2ViZ2wyOiBvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdnZngtd2ViZ2wyJyksXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGNvbnRlbnRzOiBhbnkgPSBhd2FpdCBFanMucmVuZGVyRmlsZShnYW1lRWpzVGVtcGxhdGUsIGdhbWVKc1JlbmRlckNvbmZpZyk7XG4gICAgICAgIHdyaXRlRmlsZVN5bmMoZ2FtZURlc3QsIGNvbnRlbnRzLCAndXRmOCcpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWZ0ZXJDb3B5QnVpbGRUZW1wbGF0ZSh0aGlzOiBJQnVpbGRlciwgb3B0aW9uczogSVdlY2hhdEJ1aWxkT3B0aW9ucywgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0KSB7XG4gICAgLy8ganNvbiDmlofku7bpnIDopoHlgZrkuI7nlKjmiLfmqKHmnb/nmoTmlbTnkIblt6XkvZzvvIzov5nph4zpnIDopoHlnKjnlKjmiLfmqKHmnb/mi7fotJ3kuYvlkI7ms6jmhI/pobrluo9cbiAgICBhd2FpdCBidWlsZEdhbWVKc29uKHJlc3VsdC5wYXRocy5kaXIsIG9wdGlvbnMsIHJlc3VsdCwgdGhpcy5idWlsZFRlbXBsYXRlLmZpbmRGaWxlKCdnYW1lLmpzb24nKSk7XG4gICAgYnVpbGRQcm9qZWN0Q29uZmlnKHJlc3VsdC5wYXRocy5kaXIsIG9wdGlvbnMsIHRoaXMuYnVpbGRUZW1wbGF0ZS5maW5kRmlsZSgncHJvamVjdC5jb25maWcuanNvbicpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRXZUNoYXRTcGxhc2godXRpbHM6IElCdWlsZFV0aWxzLCBvcHRpb25zOiBJV2VjaGF0QnVpbGRPcHRpb25zLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQpIHtcbiAgICBjb25zdCBzcGxhc2hTY3JlZW4gPSBvcHRpb25zLnNwbGFzaFNjcmVlbjtcbiAgICBjb25zdCBpbWFnZVN0YXR1cyA9IHtcbiAgICAgICAgbG9nbzogJycsIC8vIOiusOW9lSBsb2dvIOWbvueJh+eahOi3r+W+hO+8jOS4uuepuuihqOekuuS4jemcgOimgeaLt+i0nVxuICAgICAgICBiYWNrZ3JvdW5kOiAnJywgLy8g6K6w5b2V6IOM5pmv5Zu+54mH55qE6Lev5b6E77yM5Li656m66KGo56S65LiN6ZyA6KaB5ou36LSdXG4gICAgICAgIHNsb2dhbjogJycsIC8vIOiusOW9lSBzbG9nYW4g5Zu+54mH55qE6Lev5b6E77yM5Li656m66KGo56S65LiN6ZyA6KaB5ou36LSdXG4gICAgfTtcblxuICAgIGlmIChzcGxhc2hTY3JlZW4ubG9nbyEudHlwZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgIGltYWdlU3RhdHVzLmxvZ28gPSBqb2luKFBhdGhzLmludGVybmFsVGVtcGxhdGVEaXIsICdsb2dvLnBuZycpO1xuICAgICAgICBpbWFnZVN0YXR1cy5zbG9nYW4gPSBqb2luKFBhdGhzLmludGVybmFsVGVtcGxhdGVEaXIsICdzbG9nYW4ucG5nJyk7XG4gICAgfSBlbHNlIGlmIChzcGxhc2hTY3JlZW4ubG9nbyEudHlwZSA9PT0gJ2N1c3RvbScgJiYgc3BsYXNoU2NyZWVuLmxvZ28hLmltYWdlKSB7XG4gICAgICAgIGltYWdlU3RhdHVzLmxvZ28gPSB1dGlscy5yZXNvbHZlVG9SYXcoc3BsYXNoU2NyZWVuLmxvZ28hLmltYWdlKTtcbiAgICB9XG5cbiAgICBpZiAoc3BsYXNoU2NyZWVuLmJhY2tncm91bmQhLnR5cGUgPT09ICdjdXN0b20nICYmIHNwbGFzaFNjcmVlbi5iYWNrZ3JvdW5kIS5pbWFnZSkge1xuICAgICAgICBpbWFnZVN0YXR1cy5iYWNrZ3JvdW5kID0gdXRpbHMucmVzb2x2ZVRvUmF3KHNwbGFzaFNjcmVlbi5iYWNrZ3JvdW5kIS5pbWFnZSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3BsYXNoU2NyZWVuU2V0dGluZ3MgPSByZXN1bHQuc2V0dGluZ3Muc3BsYXNoU2NyZWVuO1xuICAgIGNvbnN0IGZpbGVzVG9Db3B5OiB7IHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZyB9W10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhpbWFnZVN0YXR1cykuZm9yRWFjaCgoW3R5cGUsIGZpbGVQYXRoXSkgPT4ge1xuICAgICAgICBpZiAoZmlsZVBhdGgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g6L+H5ruk6KaB5ou36LSd5Zu+54mHXG4gICAgICAgICAgICAgICAgY29uc3QgeyBleHQgfSA9IHBhcnNlKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gam9pbihyZXN1bHQucGF0aHMuZGlyLCBgJHt0eXBlfSR7ZXh0fWApO1xuICAgICAgICAgICAgICAgIGZpbGVzVG9Db3B5LnB1c2goeyBzb3VyY2U6IGZpbGVQYXRoLCB0YXJnZXQ6IHRhcmdldFBhdGggfSk7XG4gICAgICAgICAgICAgICAgLy8gaGFjayB3ZWNoYXRnYW1lIOeahCBzZXR0aW5ncyDpnIDopoHlkYrnn6Xlm77niYfot6/lvoRcbiAgICAgICAgICAgICAgICBpZiAoc3BsYXNoU2NyZWVuU2V0dGluZ3M/LmxvZ28gJiYgdHlwZSA9PT0gJ2xvZ28nKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwbGFzaFNjcmVlblNldHRpbmdzLmxvZ28uaW1hZ2UgPSByZWxhdGl2ZShyZXN1bHQucGF0aHMuc2V0dGluZ3MsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAvLyDlvq7kv6HlsI/muLjmiI/ph4zlubbmnKrkvb/nlKjov5nkuKpiYXNlNjTvvIzogIzmmK/kvb/nlKjnmoTmlofku7ZcbiAgICAgICAgICAgICAgICAgICAgc3BsYXNoU2NyZWVuU2V0dGluZ3MubG9nby5iYXNlNjQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3BsYXNoU2NyZWVuU2V0dGluZ3M/LmJhY2tncm91bmQgJiYgdHlwZSA9PT0gJ2JhY2tncm91bmQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwbGFzaFNjcmVlblNldHRpbmdzLmJhY2tncm91bmQuaW1hZ2UgPSByZWxhdGl2ZShyZXN1bHQucGF0aHMuc2V0dGluZ3MsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIOW5tuWPkeaLt+i0neWbvueJh1xuICAgIGF3YWl0IFByb21pc2UuYWxsKGZpbGVzVG9Db3B5Lm1hcCgoeyBzb3VyY2UsIHRhcmdldCB9KSA9PiBjb3B5RmlsZShzb3VyY2UsIHRhcmdldCkpKTtcbiAgICAvLyDph43mlrDlhpnlhaUgc3BsYXNoU2NyZWVuIOmFjee9ruWIsCBzZXR0aW5ncy5qc29uIOaWh+S7tlxuICAgIGNvbnN0IHNldHRpbmdzQ29kZSA9IHJlYWRGaWxlU3luYyhyZXN1bHQucGF0aHMuc2V0dGluZ3MsICd1dGY4Jyk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBKU09OLnBhcnNlKHNldHRpbmdzQ29kZSk7XG4gICAgc2V0dGluZ3Muc3BsYXNoU2NyZWVuID0gc3BsYXNoU2NyZWVuU2V0dGluZ3M7XG4gICAgd3JpdGVGaWxlU3luYyhyZXN1bHQucGF0aHMuc2V0dGluZ3MsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAwKSwgJ3V0ZjgnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWZ0ZXJCdWlsZCh0aGlzOiBJQnVpbGRlciwgb3B0aW9uczogSVdlY2hhdEJ1aWxkT3B0aW9ucywgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0KSB7XG4gICAgLy8gQWxpZ24gd2l0aCBDcmVhdG9yIEVkaXRvcjogc3BsYXNoIGltYWdlcyBhcmUgY29waWVkIGFmdGVyIG1kNSBwcm9jZXNzaW5nIHNvIGxvZ28ucG5nIGtlZXBzIGl0cyBvcmlnaW5hbCBuYW1lLlxuICAgIGF3YWl0IGJ1aWxkV2VDaGF0U3BsYXNoKHRoaXMudXRpbHMsIG9wdGlvbnMsIHJlc3VsdCk7XG4gICAgY29uc3QgZmlyc3RTY3JlZW5GaWxlID0gam9pbihyZXN1bHQucGF0aHMuZGlyLCAnZmlyc3Qtc2NyZWVuLmpzJyk7XG4gICAgLy8g6K+75Y+W6aaW5bGP5qih54mI5bm255Sf5oiQ6aaW5bGP5paH5Lu2XG4gICAgaWYgKCF0aGlzLmJ1aWxkVGVtcGxhdGUuZmluZEZpbGUoJ2ZpcnN0LXNjcmVlbi5qcycpKSB7XG4gICAgICAgIGNvbnN0IHNwbGFzaFNjcmVlbiA9IHJlc3VsdC5zZXR0aW5ncy5zcGxhc2hTY3JlZW4hO1xuICAgICAgICBjb25zdCBkZXNpZ25SZXNvbHV0aW9uID0gb3B0aW9ucy5kZXNpZ25SZXNvbHV0aW9uIHx8IHt9O1xuICAgICAgICBjb25zdCBmaXJzdFNjcmVlblRlbXBsYXRlRmlsZSA9IGpvaW4oUGF0aHMuaW50ZXJuYWxUZW1wbGF0ZURpciwgJ2ZpcnN0LXNjcmVlbi5lanMnKTtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IHNwbGFzaFNjcmVlbi5iYWNrZ3JvdW5kIHx8IHsgdHlwZTogJ2RlZmF1bHQnIH07XG4gICAgICAgIGNvbnN0IGJnQ29sb3IgPSBiYWNrZ3JvdW5kLmNvbG9yO1xuICAgICAgICBjb25zdCBsb2dvID0gc3BsYXNoU2NyZWVuLmxvZ28gfHwgeyB0eXBlOiAnZGVmYXVsdCcgfTtcbiAgICAgICAgY29uc3QgZmlyc3RTY3JlZW5SZW5kZXJDb25maWcgPSB7XG4gICAgICAgICAgICBkaXNwbGF5UmF0aW86IHNwbGFzaFNjcmVlbi5kaXNwbGF5UmF0aW8gPz8gMSxcbiAgICAgICAgICAgIGJnQ29sb3I6IGJnQ29sb3IgPyBbYmdDb2xvci54LCBiZ0NvbG9yLnksIGJnQ29sb3IueiwgYmdDb2xvci53XSA6IFswLCAwLCAwLCAxXSxcbiAgICAgICAgICAgIHVzZUN1c3RvbUJnOiBiYWNrZ3JvdW5kLnR5cGUgPT09ICdjdXN0b20nLFxuICAgICAgICAgICAgdXNlTG9nbzogbG9nby50eXBlICE9PSAnbm9uZScsXG4gICAgICAgICAgICB1c2VEZWZhdWx0TG9nbzogbG9nby50eXBlID09PSAnZGVmYXVsdCcsXG4gICAgICAgICAgICBsb2dvTmFtZTogYmFzZW5hbWUobG9nby5pbWFnZSB8fCAnbG9nby5wbmcnKSxcbiAgICAgICAgICAgIGJnTmFtZTogYmFzZW5hbWUoYmFja2dyb3VuZC5pbWFnZSB8fCAnYmFja2dyb3VuZC5wbmcnKSxcbiAgICAgICAgICAgIGZpdFdpZHRoOiBkZXNpZ25SZXNvbHV0aW9uLmZpdFdpZHRoID8/IHRydWUsXG4gICAgICAgICAgICBmaXRIZWlnaHQ6IGRlc2lnblJlc29sdXRpb24uZml0SGVpZ2h0ID8/IHRydWUsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlbmRlckNvbnRlbnQ6IGFueSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGZpcnN0U2NyZWVuVGVtcGxhdGVGaWxlLCBmaXJzdFNjcmVlblJlbmRlckNvbmZpZyk7XG4gICAgICAgIHdyaXRlRmlsZVN5bmMoZmlyc3RTY3JlZW5GaWxlLCByZW5kZXJDb250ZW50LCAndXRmOCcpO1xuICAgIH1cbn1cbi8qKlxuICog57yW6K+RIHByb2plY3QuY29uZmlnLmpzb25cbiAqIEBwYXJhbSBidWlsZFRlbXBsYXRlRGlyXG4gKiBAcGFyYW0gYnVpbGREZXN0XG4gKiBAcGFyYW0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBidWlsZFByb2plY3RDb25maWcoYnVpbGREZXN0OiBzdHJpbmcsIG9wdGlvbnM6IElXZWNoYXRCdWlsZE9wdGlvbnMsIHVzZXJQcm9qZWN0Q29uZmlnUGF0aD86IHN0cmluZykge1xuICAgIGNvbnN0IHBhY2thZ2VzT3B0aW9ucyA9IG9wdGlvbnMucGFja2FnZXMud2VjaGF0Z2FtZTtcbiAgICBjb25zdCBjb250ZW50cyA9IHJlYWRKU09OU3luYyhqb2luKFBhdGhzLmludGVybmFsVGVtcGxhdGVEaXIsICdwcm9qZWN0LmNvbmZpZy5qc29uJykpO1xuICAgIC8vIOeUqOaIt+aooeadv+WGheaLt+i0neeahCBwcm9qZWN0LmNvbmZpZy5qc29uXG4gICAgaWYgKHVzZXJQcm9qZWN0Q29uZmlnUGF0aCkge1xuICAgICAgICBjb25zdCB1c2VyQ29uZmlnID0gcmVhZEpTT05TeW5jKHVzZXJQcm9qZWN0Q29uZmlnUGF0aCk7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oY29udGVudHMsIHVzZXJDb25maWcpO1xuICAgIH1cbiAgICAvLyDkuI7mnoTlu7rpnaLmnb/nmoTmlbDmja7lgZrono3lkIhcbiAgICBjb250ZW50cy5hcHBpZCA9IHBhY2thZ2VzT3B0aW9ucy5hcHBpZCB8fCAnd3g2YWMzZjUwOTBhNmI5OWM1JztcbiAgICBjb250ZW50cy5wcm9qZWN0bmFtZSA9IG9wdGlvbnMubmFtZTtcblxuICAgIGNvbnN0IGRlc3QgPSBqb2luKGJ1aWxkRGVzdCwgJ3Byb2plY3QuY29uZmlnLmpzb24nKTtcbiAgICBvcHRpb25zLm1kNUNhY2hlT3B0aW9ucy5leGNsdWRlcy5wdXNoKCdwcm9qZWN0LmNvbmZpZy5qc29uJyk7XG4gICAgb3V0cHV0SlNPTlN5bmMoZGVzdCwgY29udGVudHMpO1xufVxuXG4vKipcbiAqIOe8luivkSBnYW1lLmpzb25cbiAqIEBwYXJhbSBidWlsZFRlbXBsYXRlRGlyXG4gKiBAcGFyYW0gYnVpbGREZXN0XG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHBhcmFtIHNldHRpbmdzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGJ1aWxkR2FtZUpzb24oYnVpbGREZXN0OiBzdHJpbmcsIG9wdGlvbnM6IElXZWNoYXRCdWlsZE9wdGlvbnMsIHJlc3VsdDogSW50ZXJuYWxCdWlsZFJlc3VsdCwgdXNlckdhbWVKc29uUGF0aD86IHN0cmluZykge1xuICAgIGNvbnN0IHBhY2thZ2VzT3B0aW9ucyA9IG9wdGlvbnMucGFja2FnZXMud2VjaGF0Z2FtZTtcbiAgICBjb25zdCBjb250ZW50cyA9IHJlYWRKU09OU3luYyhqb2luKFBhdGhzLmludGVybmFsVGVtcGxhdGVEaXIsICdnYW1lLmpzb24nKSk7XG4gICAgLy8g55So5oi35qih5p2/5YaF5ou36LSd55qEIGdhbWUuanNvblxuICAgIGlmICh1c2VyR2FtZUpzb25QYXRoKSB7XG4gICAgICAgIGNvbnN0IHVzZXJDb25maWcgPSByZWFkSlNPTlN5bmModXNlckdhbWVKc29uUGF0aCk7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oY29udGVudHMsIHVzZXJDb25maWcpO1xuICAgIH1cbiAgICAvLyDkuI7mnoTlu7rpnaLmnb/nmoTmlbDmja7lgZrono3lkIhcbiAgICBjb250ZW50cy5kZXZpY2VPcmllbnRhdGlvbiA9IHBhY2thZ2VzT3B0aW9ucy5vcmllbnRhdGlvbjtcbiAgICBpZiAocGFja2FnZXNPcHRpb25zLnNlcGFyYXRlRW5naW5lKSB7XG4gICAgICAgIGNvbnRlbnRzLnBsdWdpbnMgPSB7XG4gICAgICAgICAgICBjb2Nvczoge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IG9wdGlvbnMuZW5naW5lSW5mby52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIHByb3ZpZGVyOiByZXF1aXJlKGpvaW4oX19kaXJuYW1lLCAnLi4vc3RhdGljL2NvY29zL3NpZ25hdHVyZS5qc29uJykpLnByb3ZpZGVyLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHBhY2thZ2VzT3B0aW9ucy5idWlsZE9wZW5EYXRhQ29udGV4dFRlbXBsYXRlKSB7XG4gICAgICAgIGNvbnRlbnRzLm9wZW5EYXRhQ29udGV4dCA9IE9QRU5fREFUQV9DT05URVhUX1JPT1Q7XG4gICAgfVxuXG4gICAgaWYgKCFjb250ZW50cy5vcGVuRGF0YUNvbnRleHQpIHtcbiAgICAgICAgLy8g5b6u5L+h6L+Q6KGM5pe2IG9wZW5EYXRhQ29udGV4dCDkuLrnqbrkvJrmiqXplJlcbiAgICAgICAgZGVsZXRlIGNvbnRlbnRzLm9wZW5EYXRhQ29udGV4dDtcbiAgICB9XG5cbiAgICBpZiAocGFja2FnZXNPcHRpb25zLmhpZ2hQZXJmb3JtYW5jZU1vZGUpIHtcbiAgICAgICAgY29udGVudHMuaU9TSGlnaFBlcmZvcm1hbmNlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgY29udGVudHMuaU9TSGlnaFBlcmZvcm1hbmNlO1xuICAgIH1cblxuICAgIC8vIOWkhOeQhuW8leaTjiB3YXNtIOaooeWdl+WIhuWMhVxuICAgIGlmIChwYWNrYWdlc09wdGlvbnMud2FzbVN1YnBhY2thZ2UgJiYgIXBhY2thZ2VzT3B0aW9ucy5zZXBhcmF0ZUVuZ2luZSkge1xuICAgICAgICBjb25zdCB3YXNtQXNzZXRTdWJwa2cgPSBqb2luKHJlc3VsdC5wYXRocy5lbmdpbmVEaXIhLCAnLi9hc3NldHMvJyk7XG4gICAgICAgIGNvbnN0IHdhc21DaHVua1N1YnBrZyA9IGpvaW4ocmVzdWx0LnBhdGhzLmVuZ2luZURpciEsICcuL2NodW5rcy8nKTtcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMod2FzbUFzc2V0U3VicGtnKSkge1xuICAgICAgICAgICAgcGFja2FnZXNPcHRpb25zLnN1YnBhY2thZ2VzID8/PSBbXTtcbiAgICAgICAgICAgIHBhY2thZ2VzT3B0aW9ucy5zdWJwYWNrYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnX19jY1dhc21Bc3NldFN1YnBrZ19fJyxcbiAgICAgICAgICAgICAgICByb290OiBgY29jb3MtanMvYXNzZXRzL2AsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleGlzdHNTeW5jKHdhc21DaHVua1N1YnBrZykpIHtcbiAgICAgICAgICAgIHBhY2thZ2VzT3B0aW9ucy5zdWJwYWNrYWdlcyA/Pz0gW107XG4gICAgICAgICAgICBwYWNrYWdlc09wdGlvbnMuc3VicGFja2FnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ19fY2NXYXNtQ2h1bmtTdWJwa2dfXycsXG4gICAgICAgICAgICAgICAgcm9vdDogYGNvY29zLWpzL2NodW5rcy9gLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICBpZiAocGFja2FnZXNPcHRpb25zLnN1YnBhY2thZ2VzKSB7XG4gICAgICAgIGNvbnRlbnRzLnN1YnBhY2thZ2VzID0gcGFja2FnZXNPcHRpb25zLnN1YnBhY2thZ2VzO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc3QgPSBqb2luKGJ1aWxkRGVzdCwgJ2dhbWUuanNvbicpO1xuICAgIG9wdGlvbnMubWQ1Q2FjaGVPcHRpb25zLmV4Y2x1ZGVzLnB1c2goJ2dhbWUuanNvbicpO1xuICAgIG91dHB1dEpTT05TeW5jKGRlc3QsIGNvbnRlbnRzLCB7XG4gICAgICAgIHNwYWNlczogNCxcbiAgICB9KTtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBjdXN0b21CdWlsZFN0YWdlOiBydW4g4oCUIOWcqOW+ruS/oSBEZXZUb29scyDkuK3lkK/liqjmnoTlu7rlpb3nmoTmuLjmiI9cbi8vIOi/geiHqiBlZGl0b3ItM2QtZGV2IOaXpyBwbGF0Zm9ybS1leHRlbnNpb25zL3dlY2hhdGdhbWUvc291cmNlL21haW4udHPjgIJcbi8vIFBpbksg5Zyo5Zy6OndlY2hhdFRvb2xzUGF0aCDnlLEgYnVpbGQtY29uZmlnLWhvc3QudHMg55qEIHJlZ2lzdGVyUHJlU3RhZ2VIb29rIOWcqOaJp+ihjOmYtuauteWJjeeOsOivu+eOsOazqOWFpVxuLy8gICAocHJvZ3JhbU1hbmFnZXIud2VjaGF0RGV2VG9vbHMg4oaSIOi/kOihjOaXtiBvcHRpb25zLOS4jeiQveebmCk7Q0xJIOi/mei+ueebtOaOpeivu+OAglxuLy8gQ0xJIOeLrOeri+i/kOihjDrnlKjmiLflnKggYnVpbGQgb3B0aW9ucyDnm7TmjqXnu5kgd2VjaGF0VG9vbHNQYXRoIOWNs+WPryzkuI3kvp3otZYgUGluS+OAglxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmNvbnN0IFJVTl9TWU1CT0xfUkVHRVggPSAvKFtgfiEjJCVeJiorPTw+P1wie318LDsnwrd+77yBI++/pSXigKbigKYmKu+8iO+8iSs9e31844CK44CL77yf77ya4oCc4oCd44CQ44CR44CB77yb4oCY4oCZ77yM44CC44CBXSkvaW07XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVdpbjMyRHJpdmVMZXR0ZXIoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHtcbiAgICAgICAgcmV0dXJuIGZpbGVQYXRoO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZVBhdGgucmVwbGFjZSgvXihbYS16XSk6LywgKF8sIGRyaXZlOiBzdHJpbmcpID0+IGAke2RyaXZlLnRvVXBwZXJDYXNlKCl9OmApO1xufVxuXG4vKipcbiAqIOino+aekOW+ruS/oeW8gOWPkeiAheW3peWFtyBjbGkg5Y+v5omn6KGM6Lev5b6EKOaUr+aMgSBkYXJ3aW4gLyB3aW4zMiDkuKTnp43miZPljIXnu5PmnoQpO1xuICog6L+U5ZueIFtjbGlQYXRoLCBzaGVsbF0g4oCUIHNoZWxsIOS4uiB0cnVlIOaXtiBzcGF3biDpnIDopoEgc2hlbGwg5qih5byPKHdpbjMyKeOAglxuICovXG5mdW5jdGlvbiByZXNvbHZlV2VjaGF0Q2xpUGF0aCh3ZWNoYXRSb290OiBzdHJpbmcpOiB7IGNsaVBhdGg6IHN0cmluZzsgc2hlbGw6IGJvb2xlYW4gfSB8IG51bGwge1xuICAgIC8vIDEuMC4yIOi1tyBtYWMvd2luIOmDveaLvyAuYXBwLy5leGU7d2luZG93cyDkuIvpnIDopoHlj5blroPnmoTmiYDlnKjnm67lvZVcbiAgICBsZXQgcm9vdCA9IHdlY2hhdFJvb3Q7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKCFzdGF0U3luYyhyb290KS5pc0RpcmVjdG9yeSgpICYmIHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgICAgIHJvb3QgPSBkaXJuYW1lKHJvb3QpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgY2xpUGF0aDogc3RyaW5nO1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICBjbGlQYXRoID0gam9pbihyb290LCAnQ29udGVudHMvUmVzb3VyY2VzL2FwcC5udy9iaW4vY2xpJyk7XG4gICAgICAgIC8vIDEuMDIuMjAwMzI1MCDosIPmlbTlkI7nmoTlpIfnlKjot6/lvoRcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKGNsaVBhdGgpKSB7XG4gICAgICAgICAgICBjbGlQYXRoID0gam9pbihyb290LCAnQ29udGVudHMvTWFjT1MvY2xpJyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBjbGlQYXRoID0gam9pbihyb290LCAnY2xpLmJhdCcpO1xuICAgIH1cbiAgICBjbGlQYXRoID0gbm9ybWFsaXplV2luMzJEcml2ZUxldHRlcihjbGlQYXRoKTtcbiAgICBpZiAoIWV4aXN0c1N5bmMoY2xpUGF0aCkpIHsgcmV0dXJuIG51bGw7IH1cbiAgICByZXR1cm4geyBjbGlQYXRoLCBzaGVsbDogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyB9O1xufVxuXG5jb25zdCBXRUNIQVRfQ0xJX1RJTUVPVVRfTVMgPSAyICogNjAgKiAxMDAwO1xuXG5pbnRlcmZhY2UgSVJ1bk9wdGlvbnMgZXh0ZW5kcyBJV2VjaGF0QnVpbGRPcHRpb25zIHtcbiAgICAvLyDnlLEgUGluSyBwcmVCdWlsZCBob29rIOazqOWFpTtDTEkg54us56uL55So5pe255Sx55So5oi35ZyoIGJ1aWxkIG9wdGlvbnMg5o+Q5L6bXG4gICAgd2VjaGF0VG9vbHNQYXRoPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIENMSSBCdWlsZFN0YWdlVGFzayDosIPnlKggc3RhZ2UgaG9vayDnmoTlpZHnuqYoc3RhZ2UtdGFzay1tYW5hZ2VyLnRzOjY0LTcwKTpcbiAqICAgICBhd2FpdCBmdW5jKHRoaXMucm9vdCwgdGhpcy5vcHRpb25zKVxuICog5Y2z56ys5LiA5Y+C5pWwID0g6L6T5Ye655uu5b2V57ud5a+56Lev5b6ELOesrOS6jOWPguaVsCA9IGJ1aWxkIG9wdGlvbnPjgIJcbiAqXG4gKiBvcHRpb25zIOS8mOWFiOeUqOWFpeWPgihDTEkg5q2j5bi45Lyg5YWlIHRoaXMub3B0aW9ucyDml7bnm7TmjqXnlKgpO+S7heW9k+WFpeWPgue8uuWksS/kuLrnqbrml7YsXG4gKiDmiY3lm57pgIDor7sgZGVzdC9jb2Nvcy5jb21waWxlLmNvbmZpZy5qc29uKOeUsSBvbkJlZm9yZUJ1aWxkIOW8uuWItiBnZW5lcmF0ZUNvbXBpbGVDb25maWc9dHJ1ZVxuICog5ZCO5Li7IGJ1aWxkIOiQveebmCnjgILog4zmma86Q0xJIGNyZWF0ZUJ1aWxkU3RhZ2VUYXNrIOWvuSB3ZWIg57O75bmz5Y+wKHBsYXRmb3JtLnN0YXJ0c1dpdGgoJ3dlYicpKVxuICog5Lya6Lez6L+HIHJlYWRCdWlsZFRhc2tPcHRpb25zKGluZGV4LnRzOjE3NCksdGhpcy5vcHRpb25zIOWunuS4uiB1bmRlZmluZWQs5q2k5pe25omN6ZyA6KaB5LuO5paH5Lu26K+75Zue44CCXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW4ocm9vdDogc3RyaW5nLCBfb3B0aW9uczogSVJ1bk9wdGlvbnMgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDovpPlh7rot6/lvoTlkKvnibnmrornrKblj7cg4oaSIHdhcm4o5b6u5L+h5bel5YW35a+56Lev5b6E6KaB5rGC5Lil5qC8KVxuICAgIGNvbnN0IG1hdGNoZWQgPSByb290Lm1hdGNoKFJVTl9TWU1CT0xfUkVHRVgpO1xuICAgIGlmIChtYXRjaGVkKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW3dlY2hhdGdhbWU6cnVuXSDmnoTlu7rovpPlh7rot6/lvoTljIXlkKvnibnmrorlrZfnrKbjgIwke21hdGNoZWRbMV1944CNLOW+ruS/oSBEZXZUb29scyDlj6/og73liqDovb3lpLHotKU75bu66K6u5pS55ZCN5ZCO6YeN5paw5p6E5bu644CCYCk7XG4gICAgfVxuXG4gICAgLy8gb3B0aW9ucyDkvJjlhYjnlKjlhaXlj4I75Li656m6KHdlYiDns7vlubPlj7AgQ0xJIOi3s+i/hyByZWFkQnVpbGRUYXNrT3B0aW9ucyDlr7zoh7QgdW5kZWZpbmVkKeaJjeWbnumAgOivu+WFg+aVsOaNruaWh+S7tlxuICAgIGxldCBvcHRpb25zOiBJUnVuT3B0aW9ucztcbiAgICBpZiAoX29wdGlvbnMgJiYgdHlwZW9mIF9vcHRpb25zID09PSAnb2JqZWN0JyAmJiBPYmplY3Qua2V5cyhfb3B0aW9ucykubGVuZ3RoID4gMCkge1xuICAgICAgICBvcHRpb25zID0gX29wdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSByZWFkSlNPTlN5bmMoam9pbihyb290LCAnY29jb3MuY29tcGlsZS5jb25maWcuanNvbicpKSBhcyBJUnVuT3B0aW9ucztcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaXoOazleivu+WPluaehOW7uuWFg+aVsOaNriAoJHtqb2luKHJvb3QsICdjb2Nvcy5jb21waWxlLmNvbmZpZy5qc29uJyl9KTvor7flhYjmiJDlip/mnoTlu7rkuIDmrKHor6XlubPlj7DjgIJgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOS8mOWFiOivu+W5s+WPsOmAiemhuSBwYWNrYWdlcy53ZWNoYXRnYW1lLndlY2hhdFRvb2xzUGF0aChQaW5LIHByZUJ1aWxkSG9vayDms6jlhaUgLyDooajljZXloasgLyBDTEkg55So5oi35aGrKTtcbiAgICAvLyDlhbzlrrnpobblsYIgd2VjaGF0VG9vbHNQYXRoKOaXp+WGmeazlSAvIENMSSDni6znq4vnlKjmiLfnm7TmjqXpobblsYLmj5DkvpspXG4gICAgY29uc3Qgd2VjaGF0Um9vdCA9IG9wdGlvbnMucGFja2FnZXM/LndlY2hhdGdhbWU/LndlY2hhdFRvb2xzUGF0aCB8fCBvcHRpb25zLndlY2hhdFRvb2xzUGF0aDtcbiAgICBjb25zb2xlLmxvZyhgW3dlY2hhdGdhbWU6cnVuXSBvcHRpb25zIOadpea6kD0ke19vcHRpb25zICYmIE9iamVjdC5rZXlzKF9vcHRpb25zKS5sZW5ndGggPiAwID8gJ0NMSSDlhaXlj4InIDogJ2NvbXBpbGUuY29uZmlnIOaWh+S7tid9O2BcbiAgICAgICAgKyBgIHBhY2thZ2VzLndlY2hhdGdhbWUud2VjaGF0VG9vbHNQYXRoPSR7b3B0aW9ucy5wYWNrYWdlcz8ud2VjaGF0Z2FtZT8ud2VjaGF0VG9vbHNQYXRoID8/ICco5pegKSd9O2BcbiAgICAgICAgKyBgIOmhtuWxgiB3ZWNoYXRUb29sc1BhdGg9JHtvcHRpb25zLndlY2hhdFRvb2xzUGF0aCA/PyAnKOaXoCknfWApO1xuICAgIGlmICghd2VjaGF0Um9vdCB8fCAhZXhpc3RzU3luYyh3ZWNoYXRSb290KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnV2VDaGF0IERldlRvb2xzIOi3r+W+hOacqumFjee9ruaIluS4jeWtmOWcqOOAglxcbidcbiAgICAgICAgICAgICsgJ1Bpbksg55So5oi3Ouivt+WIsCBQcmVmZXJlbmNlcyDihpIgUHJvZ3JhbSBNYW5hZ2VyIOKGkiBXZUNoYXQgRGV2VG9vbHMg6YCJ5oupIGNsaS9jbGkuYmF0IOaJgOWcqOeahOWuieijheebruW9leaIluWPr+aJp+ihjOaWh+S7tiznhLblkI7ph43mlrDmnoTlu7rkuIDmrKHorqnorr7nva7nlJ/mlYjjgIJcXG4nXG4gICAgICAgICAgICArICdDTEkg5ZG95Luk6KGM55So5oi3Ouivt+WcqCBidWlsZCBvcHRpb25zIOS4reaPkOS+myB3ZWNoYXRUb29sc1BhdGgg5a2X5q6144CCJyxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVXZWNoYXRDbGlQYXRoKHdlY2hhdFJvb3QpO1xuICAgIGlmICghcmVzb2x2ZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBXZUNoYXQgRGV2VG9vbHMgY2xpIOacquaJvuWIsCAo5qOA5p+l6Lev5b6EOiAke3dlY2hhdFJvb3R9KWApO1xuICAgIH1cblxuICAgIGxldCB7IGNsaVBhdGggfSA9IHJlc29sdmVkO1xuICAgIGxldCByb290UGF0aCA9IHJvb3Q7XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgY2xpUGF0aCA9IGBcIiR7bm9ybWFsaXplKGNsaVBhdGgpfVwiYDsgLy8gd2luMzIgc3Bhd24gc2hlbGwg5qih5byP5LiL5ZCr56m65qC86Lev5b6E6ZyA5byV5Y+3XG4gICAgICAgIHJvb3RQYXRoID0gYFwiJHt3aW4zMi5ub3JtYWxpemUocm9vdCl9XCJgOyAvLyDlkIznkIYgcHJvamVjdCDot6/lvoTlkKvnqbrmoLzkuZ/pnIDlvJXlj7dcbiAgICB9XG5cbiAgICAvLyDmlrDniYjlvq7kv6HlvIDlj5HogIXlt6XlhbcoMi54KWNsaSDnlKjlrZDlkb3ku6Tor63ms5U6YG9wZW4gLS1wcm9qZWN0IDxwYXRoPmDjgIJcbiAgICAvLyDml6fniYjnmoQgYC1vIDxwYXRoPiAtZiBjb2Nvc2Ag5bey5bqf5byDLOWcqOaWsOeJiOS4iuS8muaKpeOAjFBsZWFzZSBlbnN1cmUgdGhhdCB0aGUgSURFIGhhcyBiZWVuIHByb3Blcmx5IGluc3RhbGxlZOOAjeOAglxuICAgIGNvbnN0IHByb2plY3RDb25maWdQYXRoID0gam9pbihyb290LCAncHJvamVjdC5jb25maWcuanNvbicpO1xuICAgIGlmICghZXhpc3RzU3luYyhwcm9qZWN0Q29uZmlnUGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBXZUNoYXQgRGV2VG9vbHMg5ZCv5Yqo5aSx6LSlOiDmnoTlu7rovpPlh7rnm67lvZXnvLrlsJEgcHJvamVjdC5jb25maWcuanNvbuOAguivt+ehruiupCBydW4gc3RhZ2Ug55qEIGRlc3Qg5oyH5ZCR5b6u5L+h5bCP5ri45oiP5p6E5bu65Lqn54mp55uu5b2VOiAke3Jvb3R9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXJncyA9IFsnb3BlbicsICctLXByb2plY3QnLCByb290UGF0aF07XG4gICAgY29uc3QgY29tbWFuZCA9IGAke2NsaVBhdGh9ICR7YXJncy5qb2luKCcgJyl9YDtcbiAgICBjb25zdCBmYWxsYmFja0NvbW1hbmQgPSBgJHtjbGlQYXRofSBvcGVuYDtcbiAgICBjb25zb2xlLmxvZyhgW3dlY2hhdGdhbWU6cnVuXSAke2NvbW1hbmR9YCk7XG5cbiAgICAvLyBhd2FpdCBjbGkg6YCA5Ye65bm25o2V6I636L6T5Ye6OmNsaSBgb3BlbmAg5Lya5ZCv5YqoIERldlRvb2xzIOW5tuaJk+W8gOmhueebruWQjui/lOWbnuOAglxuICAgIC8vIOS5i+WJjSBmaXJlLWFuZC1mb3JnZXQsY2xpIOWksei0pSjlpoLjgIxQbGVhc2UgZW5zdXJlIHRoYXQgdGhlIElERSBoYXMgYmVlbiBwcm9wZXJseSBpbnN0YWxsZWTjgI0pXG4gICAgLy8g5pe2IHN0YWdlIOS7jeeul+aIkOWKnyznlKjmiLflj6rog73lnKggY29uc29sZSDnnIvliLDmiqXplJnjgILnjrDlnKjmlLbpm4bovpPlh7ogKyDpnZ7pm7bpgIDlh7rmipvlh7osXG4gICAgLy8g6K6p55yf5a6e5oql6ZSZ57uPIFBpbksg5Lu75Yqh5Y2h54mH5pi+56S6KGhvc3QgbWFwVGFzayDlt7LpgI/kvKAgdGFzay5tZXNzYWdlKeOAglxuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIsIGV4aXRDb2RlIH0gPSBhd2FpdCBuZXcgUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZzsgZXhpdENvZGU6IG51bWJlciB9PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGV4ZWMoY29tbWFuZCwgeyBtYXhCdWZmZXI6IDEwICogMTAyNCAqIDEwMjQsIHRpbWVvdXQ6IFdFQ0hBVF9DTElfVElNRU9VVF9NUyB9LCAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3Rkb3V0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtXZUNoYXQgRGV2IFRvb2xdICR7c3Rkb3V0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0ZGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlQ2hhdCBEZXYgVG9vbF0gJHtzdGRlcnJ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXJyb3I/LmtpbGxlZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3dlY2hhdGdhbWU6cnVuXSBvcGVuIC0tcHJvamVjdCB0aW1lZCBvdXQsIGZhbGxiYWNrIHRvICR7ZmFsbGJhY2tDb21tYW5kfWApO1xuICAgICAgICAgICAgICAgIGV4ZWMoZmFsbGJhY2tDb21tYW5kLCB7IG1heEJ1ZmZlcjogMTAgKiAxMDI0ICogMTAyNCwgdGltZW91dDogV0VDSEFUX0NMSV9USU1FT1VUX01TIH0sIChmYWxsYmFja0Vycm9yLCBmYWxsYmFja1N0ZG91dCwgZmFsbGJhY2tTdGRlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrU3Rkb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dlQ2hhdCBEZXYgVG9vbF0gJHtmYWxsYmFja1N0ZG91dH1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZmFsbGJhY2tTdGRlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlQ2hhdCBEZXYgVG9vbF0gJHtmYWxsYmFja1N0ZGVycn1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZmFsbGJhY2tFcnJvcj8ua2lsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdXZUNoYXQgRGV2VG9vbHMg5ZCv5Yqo6LaF5pe244CCJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ+WmguaenOW8gOWPkeiAheW3peWFt+W8ueWHuiBcIkVuYWJsZSBJREUgU2VydmljZVwiIOehruiupOahhizor7flnKjlvq7kv6HlvIDlj5HogIXlt6XlhbfkuK3ngrnlh7vlhYHorrgv5ZCv55SoOydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICfkuZ/lj6/ku6Xov5vlhaUgU2V0dGluZ3MgLT4gU2VjdXJpdHkgU2V0dGluZ3Mg5omL5Yqo5byA5ZCvIFNlcnZpY2UgUG9ydCDlkI7ph43mlrDmiafooYwgcnVu44CCJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWxsYmFja0Vycm9yICYmIHR5cGVvZiBmYWxsYmFja0Vycm9yLmNvZGUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZmFsbGJhY2tFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGRvdXQ6IGZhbGxiYWNrU3Rkb3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RkZXJyOiBmYWxsYmFja1N0ZGVycixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRDb2RlOiBmYWxsYmFja0Vycm9yICYmIHR5cGVvZiBmYWxsYmFja0Vycm9yLmNvZGUgPT09ICdudW1iZXInID8gZmFsbGJhY2tFcnJvci5jb2RlIDogMCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVycm9yICYmIHR5cGVvZiBlcnJvci5jb2RlICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgc3Rkb3V0LFxuICAgICAgICAgICAgICAgIHN0ZGVycixcbiAgICAgICAgICAgICAgICBleGl0Q29kZTogZXJyb3IgJiYgdHlwZW9mIGVycm9yLmNvZGUgPT09ICdudW1iZXInID8gZXJyb3IuY29kZSA6IDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBvdXRwdXQgPSBgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YC50cmltKCk7XG4gICAgLy8gRGV2VG9vbHMgY2xpIOWNs+S9v+mAgOWHuueggeS4uiAwIOS5n+WPr+iDveWcqOi+k+WHuumHjOaKpemUmSjlkITniYjmnKzooYzkuLrkuI3kuIApO+S4pOS4quWIpOaNruS7u+S4gOWRveS4reWNs+inhuS4uuWksei0peOAglxuICAgIGNvbnN0IGZhaWxlZEJ5T3V0cHV0ID0gL3Byb3Blcmx5IGluc3RhbGxlZHxub3QgaW5zdGFsbGVkfFxcW2Vycm9yXFxdfFxcYmVycm9yXFxzKjp8ZmFpbGVkfGZhaWwgdG98ZmFpbHVyZXzlpLHotKV85peg5rOVL2kudGVzdChvdXRwdXQpO1xuICAgIGlmIChleGl0Q29kZSAhPT0gMCB8fCBmYWlsZWRCeU91dHB1dCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgV2VDaGF0IERldlRvb2xzIOWQr+WKqOWksei0pShleGl0ICR7ZXhpdENvZGV9KeOAglxcbmBcbiAgICAgICAgICAgICsgKG91dHB1dCA/IGBEZXZUb29scyDovpPlh7o6JHtvdXRwdXR9XFxuYCA6ICcnKVxuICAgICAgICAgICAgKyAn5bi46KeB5Y6f5ZugOlxcbidcbiAgICAgICAgICAgICsgJzEuIFdlQ2hhdCBEZXZUb29scyDmnKrlvIDlkK/jgIzmnI3liqHnq6/lj6PjgI065omT5byA5byA5Y+R6ICF5bel5YW3IOKGkiDorr7nva4g4oaSIOWuieWFqOiuvue9riDihpIg5byA5ZCv44CM5pyN5Yqh56uv5Y+j44CNKENMSS9IVFRQIOiwg+eUqOW/hemcgCk7XFxuJ1xuICAgICAgICAgICAgKyAnMi4gd2VjaGF0VG9vbHNQYXRoIOaMh+WQkeeahOS4jeaYr+acieaViOWuieijheebruW9lSjpnIDlkKsgY2xpLmJhdCAvIGNsaSk7XFxuJ1xuICAgICAgICAgICAgKyAnMy4g5byA5Y+R6ICF5bel5YW35a6J6KOF5LiN5a6M5pW0LOivt+mHjeijheWQjuWFiOaJi+WKqOaJk+W8gOS4gOasoeOAgicsXG4gICAgICAgICk7XG4gICAgfVxufVxuIl19