"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const utils_1 = __importDefault(require("./base/utils"));
const console_1 = require("./base/console");
const server_1 = require("../server");
const global_1 = require("../global");
const scripting_1 = __importDefault(require("./scripting"));
const scene_1 = require("./scene");
const game_preview_url_1 = require("./preview/game-preview-url");
/**
 * 启动器，主要用于整合各个模块的初始化和关闭流程
 * 默认支持几种启动方式：单独导入项目、单独启动项目、单独构建项目
 */
class Launcher {
    projectPath;
    _init = false;
    _import = false;
    constructor(projectPath) {
        this.projectPath = projectPath;
        // 初始化日志系统
        console_1.newConsole.init((0, path_1.join)(this.projectPath, 'temp', 'logs', 'cocos.log'), true);
        console_1.newConsole.record();
    }
    async init() {
        if (this._init) {
            return;
        }
        this._init = true;
        /**
         * 初始化一些基础模块信息
         */
        utils_1.default.Path.register('project', {
            label: '项目',
            path: this.projectPath,
        });
        const { configurationManager } = await Promise.resolve().then(() => __importStar(require('./configuration')));
        await configurationManager.initialize(this.projectPath);
        // 初始化项目信息
        const { default: Project } = await Promise.resolve().then(() => __importStar(require('./project')));
        await Project.open(this.projectPath);
        // 初始化引擎
        const { initEngine } = await Promise.resolve().then(() => __importStar(require('./engine')));
        await initEngine(global_1.GlobalPaths.enginePath, this.projectPath);
        console.log('initEngine success');
    }
    /**
     * 导入资源
     */
    async import() {
        if (this._import) {
            return;
        }
        this._import = true;
        await this.init();
        // 在导入资源之前，初始化 scripting 模块，才能正常导入编译脚本
        const { Engine } = await Promise.resolve().then(() => __importStar(require('./engine')));
        await scripting_1.default.initialize(this.projectPath, global_1.GlobalPaths.enginePath, Engine.getConfig().includeModules);
        const { createProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('./scripting/programming/FacetInstance')));
        await createProgrammingFacet(Engine.getInfo().typescript.path, scripting_1.default.projectPath, Engine.getConfig().includeModules);
        // 启动以及初始化资源数据库
        const { initAssetDB, startAssetDB } = await Promise.resolve().then(() => __importStar(require('./assets')));
        await initAssetDB();
        await startAssetDB();
    }
    /**
     * 启动项目
     */
    async startup(port) {
        await this.import();
        await (0, server_1.startServer)(port);
        // 初始化构建
        const { init: initBuilder } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await initBuilder();
        // 启动场景进程，需要在 Builder 之后，因为服务器路由场景还没有做前缀约束匹配范围比较广
        await (0, scene_1.startupScene)(global_1.GlobalPaths.enginePath, this.projectPath);
    }
    async startPreview(options = {}) {
        const previewOptions = typeof options === 'number' ? { port: options } : options;
        const platform = previewOptions.platform || previewOptions.buildOptions?.platform || 'web-desktop';
        if (!platform.startsWith('web')) {
            throw new Error(`Preview only supports web platforms, got: ${platform}`);
        }
        global_1.GlobalConfig.mode = 'simple';
        await this.import();
        await (0, server_1.startServer)(previewOptions.port);
        const { init, build } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await init([platform]);
        const buildOptions = {
            ...previewOptions.buildOptions,
            platform,
            outputName: previewOptions.buildOptions?.outputName || 'preview',
            taskName: previewOptions.buildOptions?.taskName || 'preview',
        };
        if (buildOptions.debug === undefined) {
            buildOptions.debug = true;
        }
        const result = await build(platform, buildOptions);
        if (result.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
            throw new Error(result.reason || 'Preview build failed.');
        }
        const previewUrl = result.custom?.previewUrl;
        if (!previewUrl) {
            throw new Error('Preview build completed but did not return a preview URL.');
        }
        console.log(`Preview URL: ${previewUrl}`);
        if (previewOptions.open !== false) {
            const { openUrlAsync } = await Promise.resolve().then(() => __importStar(require('./builder/platforms/web-common/utils')));
            await openUrlAsync(previewUrl);
        }
        return result;
    }
    /**
     * 启动动态游戏预览（只托管不构建，对齐编辑器浏览器预览）。
     * 与场景编辑器预览的区别：不启动场景进程 / RPC。
     */
    async startGamePreview(options = {}) {
        await this.import();
        await (0, server_1.startServer)(options.port);
        // getPreviewSettings 需要 builder 初始化
        const { init: initBuilder } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await initBuilder();
        const { registerBrowserPreview } = await Promise.resolve().then(() => __importStar(require('./preview/register')));
        await registerBrowserPreview(this.projectPath);
        const serverUrl = (0, server_1.getServerUrl)();
        const url = (0, game_preview_url_1.getExternalGamePreviewUrl)(serverUrl, options.scene);
        console.log(`Game preview: ${url}`);
        await this.printPreviewScenes(serverUrl, options.scene);
        if (options.open !== false) {
            const { openUrlAsync } = await Promise.resolve().then(() => __importStar(require('./builder/platforms/web-common/utils')));
            await openUrlAsync(url);
        }
    }
    /**
     * 打印当前启动场景与项目内可用场景列表，方便用 ?scene=<url|uuid> 切换。
     */
    async printPreviewScenes(serverUrl, scene) {
        try {
            const { assetManager } = await Promise.resolve().then(() => __importStar(require('./assets')));
            const { getCachedPreviewSettings } = await Promise.resolve().then(() => __importStar(require('./preview/preview-settings')));
            const { settings } = await getCachedPreviewSettings(scene || '');
            const launchUuid = settings?.launch?.launchScene || '';
            const launchInfo = launchUuid ? assetManager.queryAssetInfo(launchUuid) : null;
            console.log(`Launch scene: ${launchInfo?.url || launchUuid || '(none)'}`);
            const scenes = assetManager.queryAssetInfos({ ccType: 'cc.SceneAsset' });
            if (scenes && scenes.length) {
                console.log('Available scenes (switch via ?scene=<url-or-uuid>):');
                for (const s of scenes) {
                    console.log(`  ${serverUrl}/?scene=${encodeURIComponent(s.url)}`);
                }
            }
            else {
                console.log('No scene asset found in project.');
            }
        }
        catch (err) {
            console.warn('[Preview] Failed to list scenes:', err);
        }
    }
    async startSceneEditorPreview(options = {}) {
        const opts = typeof options === 'number' ? { port: options } : options;
        await this.import();
        await (0, server_1.startServer)(opts.port);
        // 初始化构建
        const { init: initBuilder } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await initBuilder();
        // initScene() 内部会先注册浏览器游戏预览路由（/ 及资源路由），再注册场景中间件，
        // 使浏览器预览与场景编辑器共用一台 server 且路由优先级正确（见 scene/index.ts init）。
        const { init: initScene } = await Promise.resolve().then(() => __importStar(require('./scene')));
        await initScene();
        // 注册调试用的中间件（仅 preview 模式）
        const { middlewareService } = await Promise.resolve().then(() => __importStar(require('../server/middleware')));
        const { default: PreviewDebugMiddleware } = await Promise.resolve().then(() => __importStar(require('./scene/preview.debug.middleware')));
        middlewareService.register('PreviewDebug', PreviewDebugMiddleware);
        const { Rpc } = await Promise.resolve().then(() => __importStar(require('./scene/main-process/rpc')));
        await Rpc.startup();
        const serverUrl = (0, server_1.getServerUrl)();
        const sceneEditorUrl = `${serverUrl}/scene-editor/`;
        console.log(`Scene editor preview: ${sceneEditorUrl}`);
        console.log(`Browser preview: ${serverUrl}/`);
        if (opts.open !== false) {
            const { openUrlAsync } = await Promise.resolve().then(() => __importStar(require('./builder/platforms/web-common/utils')));
            await openUrlAsync(sceneEditorUrl);
        }
    }
    /**
     * 构建，主要是作为命令行构建的入口
     * @param platform
     * @param options
     */
    async build(platform, options) {
        global_1.GlobalConfig.mode = 'simple';
        // 先导入项目
        await this.import();
        // 执行构建流程
        const { init, build } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await init([platform]);
        return await build(platform, options);
    }
    static async make(platform, dest) {
        global_1.GlobalConfig.mode = 'simple';
        const { init, executeBuildStageTask } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await init([platform]);
        return await executeBuildStageTask('command make', 'make', {
            platform,
            dest,
        });
    }
    static async run(platform, dest) {
        global_1.GlobalConfig.mode = 'simple';
        const { init, executeBuildStageTask } = await Promise.resolve().then(() => __importStar(require('./builder')));
        if (platform.startsWith('web')) {
            await (0, server_1.startServer)();
        }
        await init([platform]);
        return await executeBuildStageTask('command run', 'run', {
            platform,
            dest,
        });
    }
    static async upload(platform, dest, accessToken) {
        global_1.GlobalConfig.mode = 'simple';
        const { init, executeBuildStageTask } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await init([platform]);
        return await executeBuildStageTask('command upload', 'upload', {
            platform,
            dest,
            packages: accessToken ? {
                [platform]: {
                    accessToken,
                },
            } : undefined,
        });
    }
    static async publish(platform, dest) {
        global_1.GlobalConfig.mode = 'simple';
        const { init, executeBuildStageTask } = await Promise.resolve().then(() => __importStar(require('./builder')));
        await init([platform]);
        return await executeBuildStageTask('command publish', 'publish', {
            platform,
            dest,
        });
    }
    async close() {
        // 释放浏览器预览资源（扩展预览后端 + 热重载监听），对齐 Creator 生命周期
        try {
            const { disposeBrowserPreview } = await Promise.resolve().then(() => __importStar(require('./preview/register')));
            await disposeBrowserPreview();
        }
        catch (err) {
            console.warn('[Preview] dispose failed:', err);
        }
        // 关闭服务器
        const { stopServer } = await Promise.resolve().then(() => __importStar(require('../server')));
        await stopServer();
        // 关闭场景进程
        const { sceneWorker } = await Promise.resolve().then(() => __importStar(require('./scene/main-process/scene-worker')));
        await sceneWorker.stop();
        // 关闭资源数据库
        const { stopAssetDB } = await Promise.resolve().then(() => __importStar(require('./assets')));
        await stopAssetDB();
        // 关闭脚本管理器
        const { default: scripting } = await Promise.resolve().then(() => __importStar(require('./scripting')));
        await scripting.close();
        // 保存项目配置
        const { default: Project } = await Promise.resolve().then(() => __importStar(require('./project')));
        await Project.close();
        // ----- TODO 可能有的更多其他模块的保存销毁操作 ----
    }
}
exports.default = Launcher;
