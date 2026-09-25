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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF1bmNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29yZS9sYXVuY2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUE0QjtBQUU1Qix5REFBaUM7QUFDakMsNENBQTRDO0FBQzVDLHNDQUFzRDtBQUN0RCxzQ0FBc0Q7QUFDdEQsNERBQW9DO0FBQ3BDLG1DQUF1QztBQUN2QyxpRUFBdUU7QUFVdkU7OztHQUdHO0FBQ0gsTUFBcUIsUUFBUTtJQUNqQixXQUFXLENBQVM7SUFFcEIsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNkLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFFeEIsWUFBWSxXQUFtQjtRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixVQUFVO1FBQ1Ysb0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNFLG9CQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVPLEtBQUssQ0FBQyxJQUFJO1FBQ2QsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCOztXQUVHO1FBQ0gsZUFBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFO1lBQzNCLEtBQUssRUFBRSxJQUFJO1lBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXO1NBQ3pCLENBQUMsQ0FBQztRQUNILE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGlCQUFpQixHQUFDLENBQUM7UUFDakUsTUFBTSxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFD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QUM1QyxJQUFJLENBQUM7WUFDRCxNQUFNLEVBQUUscUJBQXFCLEVBQUUsR0FBRyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDO1lBQ3JFLE1BQU0scUJBQXFCLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELFFBQVE7UUFDUixNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsd0RBQWEsV0FBVyxHQUFDLENBQUM7UUFDakQsTUFBTSxVQUFVLEVBQUUsQ0FBQztRQUVuQixTQUFTO1FBQ1QsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLHdEQUFhLG1DQUFtQyxHQUFDLENBQUM7UUFDMUUsTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFekIsVUFBVTtRQUNWLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyx3REFBYSxVQUFVLEdBQUMsQ0FBQztRQUNqRCxNQUFNLFdBQVcsRUFBRSxDQUFDO1FBRXBCLFVBQVU7UUFDVixNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHLHdEQUFhLGFBQWEsR0FBQyxDQUFDO1FBQzNELE1BQU0sU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXhCLFNBQVM7UUFDVCxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLHdEQUFhLFdBQVcsR0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3RCLG9DQUFvQztJQUN4QyxDQUFDO0NBQ0o7QUFuU0QsMkJBbVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQnVpbGRFeGl0Q29kZSwgSUJ1aWxkQ29tbWFuZE9wdGlvbiwgUGxhdGZvcm0gfSBmcm9tICcuL2J1aWxkZXIvQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IG5ld0NvbnNvbGUgfSBmcm9tICcuL2Jhc2UvY29uc29sZSc7XG5pbXBvcnQgeyBzdGFydFNlcnZlciwgZ2V0U2VydmVyVXJsIH0gZnJvbSAnLi4vc2VydmVyJztcbmltcG9ydCB7IEdsb2JhbENvbmZpZywgR2xvYmFsUGF0aHMgfSBmcm9tICcuLi9nbG9iYWwnO1xuaW1wb3J0IHNjcmlwdGluZyBmcm9tICcuL3NjcmlwdGluZyc7XG5pbXBvcnQgeyBzdGFydHVwU2NlbmUgfSBmcm9tICcuL3NjZW5lJztcbmltcG9ydCB7IGdldEV4dGVybmFsR2FtZVByZXZpZXdVcmwgfSBmcm9tICcuL3ByZXZpZXcvZ2FtZS1wcmV2aWV3LXVybCc7XG5cbmludGVyZmFjZSBJUHJldmlld1N0YXJ0T3B0aW9ucyB7XG4gICAgcG9ydD86IG51bWJlcjtcbiAgICBwbGF0Zm9ybT86IFBsYXRmb3JtIHwgc3RyaW5nO1xuICAgIG9wZW4/OiBib29sZWFuO1xuICAgIGJ1aWxkT3B0aW9ucz86IFBhcnRpYWw8SUJ1aWxkQ29tbWFuZE9wdGlvbj47XG59XG5cblxuLyoqXG4gKiDlkK/liqjlmajvvIzkuLvopoHnlKjkuo7mlbTlkIjlkITkuKrmqKHlnZfnmoTliJ3lp4vljJblkozlhbPpl63mtYHnqItcbiAqIOm7mOiupOaUr+aMgeWHoOenjeWQr+WKqOaWueW8j++8muWNleeLrOWvvOWFpemhueebruOAgeWNleeLrOWQr+WKqOmhueebruOAgeWNleeLrOaehOW7uumhueebrlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYXVuY2hlciB7XG4gICAgcHJpdmF0ZSBwcm9qZWN0UGF0aDogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBfaW5pdCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2ltcG9ydCA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IocHJvamVjdFBhdGg6IHN0cmluZykge1xuICAgICAgICB0aGlzLnByb2plY3RQYXRoID0gcHJvamVjdFBhdGg7XG4gICAgICAgIC8vIOWIneWni+WMluaXpeW/l+ezu+e7n1xuICAgICAgICBuZXdDb25zb2xlLmluaXQoam9pbih0aGlzLnByb2plY3RQYXRoLCAndGVtcCcsICdsb2dzJywgJ2NvY29zLmxvZycpLCB0cnVlKTtcbiAgICAgICAgbmV3Q29uc29sZS5yZWNvcmQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5pdCA9IHRydWU7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliJ3lp4vljJbkuIDkupvln7rnoYDmqKHlnZfkv6Hmga9cbiAgICAgICAgICovXG4gICAgICAgIHV0aWxzLlBhdGgucmVnaXN0ZXIoJ3Byb2plY3QnLCB7XG4gICAgICAgICAgICBsYWJlbDogJ+mhueebricsXG4gICAgICAgICAgICBwYXRoOiB0aGlzLnByb2plY3RQYXRoLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuL2NvbmZpZ3VyYXRpb24nKTtcbiAgICAgICAgYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIuaW5pdGlhbGl6ZSh0aGlzLnByb2plY3RQYXRoKTtcbiAgICAgICAgLy8g5Yid5aeL5YyW6aG555uu5L+h5oGvXG4gICAgICAgIGNvbnN0IHsgZGVmYXVsdDogUHJvamVjdCB9ID0gYXdhaXQgaW1wb3J0KCcuL3Byb2plY3QnKTtcbiAgICAgICAgYXdhaXQgUHJvamVjdC5vcGVuKHRoaXMucHJvamVjdFBhdGgpO1xuICAgICAgICAvLyDliJ3lp4vljJblvJXmk45cbiAgICAgICAgY29uc3QgeyBpbml0RW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4vZW5naW5lJyk7XG4gICAgICAgIGF3YWl0IGluaXRFbmdpbmUoR2xvYmFsUGF0aHMuZW5naW5lUGF0aCwgdGhpcy5wcm9qZWN0UGF0aCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdpbml0RW5naW5lIHN1Y2Nlc3MnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlr7zlhaXotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBpbXBvcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbXBvcnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbXBvcnQgPSB0cnVlO1xuICAgICAgICBhd2FpdCB0aGlzLmluaXQoKTtcbiAgICAgICAgLy8g5Zyo5a+85YWl6LWE5rqQ5LmL5YmN77yM5Yid5aeL5YyWIHNjcmlwdGluZyDmqKHlnZfvvIzmiY3og73mraPluLjlr7zlhaXnvJbor5HohJrmnKxcbiAgICAgICAgY29uc3QgeyBFbmdpbmUgfSA9IGF3YWl0IGltcG9ydCgnLi9lbmdpbmUnKTtcbiAgICAgICAgYXdhaXQgc2NyaXB0aW5nLmluaXRpYWxpemUodGhpcy5wcm9qZWN0UGF0aCwgR2xvYmFsUGF0aHMuZW5naW5lUGF0aCwgRW5naW5lLmdldENvbmZpZygpLmluY2x1ZGVNb2R1bGVzKTtcblxuICAgICAgICBjb25zdCB7IGNyZWF0ZVByb2dyYW1taW5nRmFjZXQgfSA9IGF3YWl0IGltcG9ydCgnLi9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXRJbnN0YW5jZScpO1xuICAgICAgICBhd2FpdCBjcmVhdGVQcm9ncmFtbWluZ0ZhY2V0KEVuZ2luZS5nZXRJbmZvKCkudHlwZXNjcmlwdC5wYXRoLCBzY3JpcHRpbmcucHJvamVjdFBhdGgsIEVuZ2luZS5nZXRDb25maWcoKS5pbmNsdWRlTW9kdWxlcyk7XG5cbiAgICAgICAgLy8g5ZCv5Yqo5Lul5Y+K5Yid5aeL5YyW6LWE5rqQ5pWw5o2u5bqTXG4gICAgICAgIGNvbnN0IHsgaW5pdEFzc2V0REIsIHN0YXJ0QXNzZXREQiB9ID0gYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cycpO1xuICAgICAgICBhd2FpdCBpbml0QXNzZXREQigpO1xuICAgICAgICBhd2FpdCBzdGFydEFzc2V0REIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjpobnnm65cbiAgICAgKi9cbiAgICBhc3luYyBzdGFydHVwKHBvcnQ/OiBudW1iZXIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbXBvcnQoKTtcbiAgICAgICAgYXdhaXQgc3RhcnRTZXJ2ZXIocG9ydCk7XG4gICAgICAgIC8vIOWIneWni+WMluaehOW7ulxuICAgICAgICBjb25zdCB7IGluaXQ6IGluaXRCdWlsZGVyIH0gPSBhd2FpdCBpbXBvcnQoJy4vYnVpbGRlcicpO1xuICAgICAgICBhd2FpdCBpbml0QnVpbGRlcigpO1xuXG4gICAgICAgIC8vIOWQr+WKqOWcuuaZr+i/m+eoi++8jOmcgOimgeWcqCBCdWlsZGVyIOS5i+WQju+8jOWboOS4uuacjeWKoeWZqOi3r+eUseWcuuaZr+i/mOayoeacieWBmuWJjee8gOe6puadn+WMuemFjeiMg+WbtOavlOi+g+W5v1xuICAgICAgICBhd2FpdCBzdGFydHVwU2NlbmUoR2xvYmFsUGF0aHMuZW5naW5lUGF0aCwgdGhpcy5wcm9qZWN0UGF0aCk7XG4gICAgfVxuXG4gICAgYXN5bmMgc3RhcnRQcmV2aWV3KG9wdGlvbnM6IG51bWJlciB8IElQcmV2aWV3U3RhcnRPcHRpb25zID0ge30pIHtcbiAgICAgICAgY29uc3QgcHJldmlld09wdGlvbnM6IElQcmV2aWV3U3RhcnRPcHRpb25zID0gdHlwZW9mIG9wdGlvbnMgPT09ICdudW1iZXInID8geyBwb3J0OiBvcHRpb25zIH0gOiBvcHRpb25zO1xuICAgICAgICBjb25zdCBwbGF0Zm9ybSA9IHByZXZpZXdPcHRpb25zLnBsYXRmb3JtIHx8IHByZXZpZXdPcHRpb25zLmJ1aWxkT3B0aW9ucz8ucGxhdGZvcm0gfHwgJ3dlYi1kZXNrdG9wJztcbiAgICAgICAgaWYgKCFwbGF0Zm9ybS5zdGFydHNXaXRoKCd3ZWInKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcmV2aWV3IG9ubHkgc3VwcG9ydHMgd2ViIHBsYXRmb3JtcywgZ290OiAke3BsYXRmb3JtfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgR2xvYmFsQ29uZmlnLm1vZGUgPSAnc2ltcGxlJztcbiAgICAgICAgYXdhaXQgdGhpcy5pbXBvcnQoKTtcbiAgICAgICAgYXdhaXQgc3RhcnRTZXJ2ZXIocHJldmlld09wdGlvbnMucG9ydCk7XG5cbiAgICAgICAgY29uc3QgeyBpbml0LCBidWlsZCB9ID0gYXdhaXQgaW1wb3J0KCcuL2J1aWxkZXInKTtcbiAgICAgICAgYXdhaXQgaW5pdChbcGxhdGZvcm1dKTtcblxuICAgICAgICBjb25zdCBidWlsZE9wdGlvbnM6IFBhcnRpYWw8SUJ1aWxkQ29tbWFuZE9wdGlvbj4gPSB7XG4gICAgICAgICAgICAuLi5wcmV2aWV3T3B0aW9ucy5idWlsZE9wdGlvbnMsXG4gICAgICAgICAgICBwbGF0Zm9ybSxcbiAgICAgICAgICAgIG91dHB1dE5hbWU6IHByZXZpZXdPcHRpb25zLmJ1aWxkT3B0aW9ucz8ub3V0cHV0TmFtZSB8fCAncHJldmlldycsXG4gICAgICAgICAgICB0YXNrTmFtZTogcHJldmlld09wdGlvbnMuYnVpbGRPcHRpb25zPy50YXNrTmFtZSB8fCAncHJldmlldycsXG4gICAgICAgIH07XG4gICAgICAgIGlmIChidWlsZE9wdGlvbnMuZGVidWcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYnVpbGRPcHRpb25zLmRlYnVnID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJ1aWxkKHBsYXRmb3JtIGFzIFBsYXRmb3JtLCBidWlsZE9wdGlvbnMpO1xuICAgICAgICBpZiAocmVzdWx0LmNvZGUgIT09IEJ1aWxkRXhpdENvZGUuQlVJTERfU1VDQ0VTUykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5yZWFzb24gfHwgJ1ByZXZpZXcgYnVpbGQgZmFpbGVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJldmlld1VybCA9IHJlc3VsdC5jdXN0b20/LnByZXZpZXdVcmw7XG4gICAgICAgIGlmICghcHJldmlld1VybCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcmV2aWV3IGJ1aWxkIGNvbXBsZXRlZCBidXQgZGlkIG5vdCByZXR1cm4gYSBwcmV2aWV3IFVSTC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBQcmV2aWV3IFVSTDogJHtwcmV2aWV3VXJsfWApO1xuICAgICAgICBpZiAocHJldmlld09wdGlvbnMub3BlbiAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgb3BlblVybEFzeW5jIH0gPSBhd2FpdCBpbXBvcnQoJy4vYnVpbGRlci9wbGF0Zm9ybXMvd2ViLWNvbW1vbi91dGlscycpO1xuICAgICAgICAgICAgYXdhaXQgb3BlblVybEFzeW5jKHByZXZpZXdVcmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjliqjmgIHmuLjmiI/pooTop4jvvIjlj6rmiZjnrqHkuI3mnoTlu7rvvIzlr7npvZDnvJbovpHlmajmtY/op4jlmajpooTop4jvvInjgIJcbiAgICAgKiDkuI7lnLrmma/nvJbovpHlmajpooTop4jnmoTljLrliKvvvJrkuI3lkK/liqjlnLrmma/ov5vnqIsgLyBSUEPjgIJcbiAgICAgKi9cbiAgICBhc3luYyBzdGFydEdhbWVQcmV2aWV3KG9wdGlvbnM6IHsgcG9ydD86IG51bWJlcjsgc2NlbmU/OiBzdHJpbmc7IG9wZW4/OiBib29sZWFuIH0gPSB7fSkge1xuICAgICAgICBhd2FpdCB0aGlzLmltcG9ydCgpO1xuICAgICAgICBhd2FpdCBzdGFydFNlcnZlcihvcHRpb25zLnBvcnQpO1xuXG4gICAgICAgIC8vIGdldFByZXZpZXdTZXR0aW5ncyDpnIDopoEgYnVpbGRlciDliJ3lp4vljJZcbiAgICAgICAgY29uc3QgeyBpbml0OiBpbml0QnVpbGRlciB9ID0gYXdhaXQgaW1wb3J0KCcuL2J1aWxkZXInKTtcbiAgICAgICAgYXdhaXQgaW5pdEJ1aWxkZXIoKTtcblxuICAgICAgICBjb25zdCB7IHJlZ2lzdGVyQnJvd3NlclByZXZpZXcgfSA9IGF3YWl0IGltcG9ydCgnLi9wcmV2aWV3L3JlZ2lzdGVyJyk7XG4gICAgICAgIGF3YWl0IHJlZ2lzdGVyQnJvd3NlclByZXZpZXcodGhpcy5wcm9qZWN0UGF0aCk7XG5cbiAgICAgICAgY29uc3Qgc2VydmVyVXJsID0gZ2V0U2VydmVyVXJsKCk7XG4gICAgICAgIGNvbnN0IHVybCA9IGdldEV4dGVybmFsR2FtZVByZXZpZXdVcmwoc2VydmVyVXJsLCBvcHRpb25zLnNjZW5lKTtcbiAgICAgICAgY29uc29sZS5sb2coYEdhbWUgcHJldmlldzogJHt1cmx9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMucHJpbnRQcmV2aWV3U2NlbmVzKHNlcnZlclVybCwgb3B0aW9ucy5zY2VuZSk7XG4gICAgICAgIGlmIChvcHRpb25zLm9wZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjb25zdCB7IG9wZW5VcmxBc3luYyB9ID0gYXdhaXQgaW1wb3J0KCcuL2J1aWxkZXIvcGxhdGZvcm1zL3dlYi1jb21tb24vdXRpbHMnKTtcbiAgICAgICAgICAgIGF3YWl0IG9wZW5VcmxBc3luYyh1cmwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5omT5Y2w5b2T5YmN5ZCv5Yqo5Zy65pmv5LiO6aG555uu5YaF5Y+v55So5Zy65pmv5YiX6KGo77yM5pa55L6/55SoID9zY2VuZT08dXJsfHV1aWQ+IOWIh+aNouOAglxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcHJpbnRQcmV2aWV3U2NlbmVzKHNlcnZlclVybDogc3RyaW5nLCBzY2VuZT86IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBhc3NldE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9hc3NldHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZ2V0Q2FjaGVkUHJldmlld1NldHRpbmdzIH0gPSBhd2FpdCBpbXBvcnQoJy4vcHJldmlldy9wcmV2aWV3LXNldHRpbmdzJyk7XG4gICAgICAgICAgICBjb25zdCB7IHNldHRpbmdzIH0gPSBhd2FpdCBnZXRDYWNoZWRQcmV2aWV3U2V0dGluZ3Moc2NlbmUgfHwgJycpO1xuICAgICAgICAgICAgY29uc3QgbGF1bmNoVXVpZCA9IChzZXR0aW5ncyBhcyBhbnkpPy5sYXVuY2g/LmxhdW5jaFNjZW5lIHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgbGF1bmNoSW5mbyA9IGxhdW5jaFV1aWQgPyBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8obGF1bmNoVXVpZCkgOiBudWxsO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYExhdW5jaCBzY2VuZTogJHtsYXVuY2hJbmZvPy51cmwgfHwgbGF1bmNoVXVpZCB8fCAnKG5vbmUpJ31gKTtcblxuICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRJbmZvcyh7IGNjVHlwZTogJ2NjLlNjZW5lQXNzZXQnIH0pO1xuICAgICAgICAgICAgaWYgKHNjZW5lcyAmJiBzY2VuZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F2YWlsYWJsZSBzY2VuZXMgKHN3aXRjaCB2aWEgP3NjZW5lPTx1cmwtb3ItdXVpZD4pOicpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcyBvZiBzY2VuZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgJHtzZXJ2ZXJVcmx9Lz9zY2VuZT0ke2VuY29kZVVSSUNvbXBvbmVudChzLnVybCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gc2NlbmUgYXNzZXQgZm91bmQgaW4gcHJvamVjdC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tQcmV2aWV3XSBGYWlsZWQgdG8gbGlzdCBzY2VuZXM6JywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHN0YXJ0U2NlbmVFZGl0b3JQcmV2aWV3KG9wdGlvbnM6IG51bWJlciB8IHsgcG9ydD86IG51bWJlcjsgb3Blbj86IGJvb2xlYW4gfSA9IHt9KSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB0eXBlb2Ygb3B0aW9ucyA9PT0gJ251bWJlcicgPyB7IHBvcnQ6IG9wdGlvbnMgfSA6IG9wdGlvbnM7XG4gICAgICAgIGF3YWl0IHRoaXMuaW1wb3J0KCk7XG4gICAgICAgIGF3YWl0IHN0YXJ0U2VydmVyKG9wdHMucG9ydCk7XG4gICAgICAgIC8vIOWIneWni+WMluaehOW7ulxuICAgICAgICBjb25zdCB7IGluaXQ6IGluaXRCdWlsZGVyIH0gPSBhd2FpdCBpbXBvcnQoJy4vYnVpbGRlcicpO1xuICAgICAgICBhd2FpdCBpbml0QnVpbGRlcigpO1xuXG4gICAgICAgIC8vIGluaXRTY2VuZSgpIOWGhemDqOS8muWFiOazqOWGjOa1j+iniOWZqOa4uOaIj+mihOiniOi3r+eUse+8iC8g5Y+K6LWE5rqQ6Lev55Sx77yJ77yM5YaN5rOo5YaM5Zy65pmv5Lit6Ze05Lu277yMXG4gICAgICAgIC8vIOS9v+a1j+iniOWZqOmihOiniOS4juWcuuaZr+e8lui+keWZqOWFseeUqOS4gOWPsCBzZXJ2ZXIg5LiU6Lev55Sx5LyY5YWI57qn5q2j56Gu77yI6KeBIHNjZW5lL2luZGV4LnRzIGluaXTvvInjgIJcbiAgICAgICAgY29uc3QgeyBpbml0OiBpbml0U2NlbmUgfSA9IGF3YWl0IGltcG9ydCgnLi9zY2VuZScpO1xuICAgICAgICBhd2FpdCBpbml0U2NlbmUoKTtcblxuICAgICAgICAvLyDms6jlhozosIPor5XnlKjnmoTkuK3pl7Tku7bvvIjku4UgcHJldmlldyDmqKHlvI/vvIlcbiAgICAgICAgY29uc3QgeyBtaWRkbGV3YXJlU2VydmljZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zZXJ2ZXIvbWlkZGxld2FyZScpO1xuICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFByZXZpZXdEZWJ1Z01pZGRsZXdhcmUgfSA9IGF3YWl0IGltcG9ydCgnLi9zY2VuZS9wcmV2aWV3LmRlYnVnLm1pZGRsZXdhcmUnKTtcbiAgICAgICAgbWlkZGxld2FyZVNlcnZpY2UucmVnaXN0ZXIoJ1ByZXZpZXdEZWJ1ZycsIFByZXZpZXdEZWJ1Z01pZGRsZXdhcmUpO1xuXG4gICAgICAgIGNvbnN0IHsgUnBjIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2NlbmUvbWFpbi1wcm9jZXNzL3JwYycpO1xuICAgICAgICBhd2FpdCBScGMuc3RhcnR1cCgpO1xuXG4gICAgICAgIGNvbnN0IHNlcnZlclVybCA9IGdldFNlcnZlclVybCgpO1xuICAgICAgICBjb25zdCBzY2VuZUVkaXRvclVybCA9IGAke3NlcnZlclVybH0vc2NlbmUtZWRpdG9yL2A7XG4gICAgICAgIGNvbnNvbGUubG9nKGBTY2VuZSBlZGl0b3IgcHJldmlldzogJHtzY2VuZUVkaXRvclVybH1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJyb3dzZXIgcHJldmlldzogJHtzZXJ2ZXJVcmx9L2ApO1xuXG4gICAgICAgIGlmIChvcHRzLm9wZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjb25zdCB7IG9wZW5VcmxBc3luYyB9ID0gYXdhaXQgaW1wb3J0KCcuL2J1aWxkZXIvcGxhdGZvcm1zL3dlYi1jb21tb24vdXRpbHMnKTtcbiAgICAgICAgICAgIGF3YWl0IG9wZW5VcmxBc3luYyhzY2VuZUVkaXRvclVybCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmnoTlu7rvvIzkuLvopoHmmK/kvZzkuLrlkb3ku6TooYzmnoTlu7rnmoTlhaXlj6NcbiAgICAgKiBAcGFyYW0gcGxhdGZvcm1cbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIGFzeW5jIGJ1aWxkKHBsYXRmb3JtOiBQbGF0Zm9ybSwgb3B0aW9uczogUGFydGlhbDxJQnVpbGRDb21tYW5kT3B0aW9uPikge1xuICAgICAgICBHbG9iYWxDb25maWcubW9kZSA9ICdzaW1wbGUnO1xuICAgICAgICAvLyDlhYjlr7zlhaXpobnnm65cbiAgICAgICAgYXdhaXQgdGhpcy5pbXBvcnQoKTtcbiAgICAgICAgLy8g5omn6KGM5p6E5bu65rWB56iLXG4gICAgICAgIGNvbnN0IHsgaW5pdCwgYnVpbGQgfSA9IGF3YWl0IGltcG9ydCgnLi9idWlsZGVyJyk7XG4gICAgICAgIGF3YWl0IGluaXQoW3BsYXRmb3JtXSk7XG4gICAgICAgIHJldHVybiBhd2FpdCBidWlsZChwbGF0Zm9ybSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIG1ha2UocGxhdGZvcm06IFBsYXRmb3JtLCBkZXN0OiBzdHJpbmcpIHtcbiAgICAgICAgR2xvYmFsQ29uZmlnLm1vZGUgPSAnc2ltcGxlJztcbiAgICAgICAgY29uc3QgeyBpbml0LCBleGVjdXRlQnVpbGRTdGFnZVRhc2sgfSA9IGF3YWl0IGltcG9ydCgnLi9idWlsZGVyJyk7XG4gICAgICAgIGF3YWl0IGluaXQoW3BsYXRmb3JtXSk7XG4gICAgICAgIHJldHVybiBhd2FpdCBleGVjdXRlQnVpbGRTdGFnZVRhc2soJ2NvbW1hbmQgbWFrZScsICdtYWtlJywge1xuICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICBkZXN0LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgcnVuKHBsYXRmb3JtOiBQbGF0Zm9ybSwgZGVzdDogc3RyaW5nKSB7XG4gICAgICAgIEdsb2JhbENvbmZpZy5tb2RlID0gJ3NpbXBsZSc7XG4gICAgICAgIGNvbnN0IHsgaW5pdCwgZXhlY3V0ZUJ1aWxkU3RhZ2VUYXNrIH0gPSBhd2FpdCBpbXBvcnQoJy4vYnVpbGRlcicpO1xuICAgICAgICBpZiAocGxhdGZvcm0uc3RhcnRzV2l0aCgnd2ViJykpIHtcbiAgICAgICAgICAgIGF3YWl0IHN0YXJ0U2VydmVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgaW5pdChbcGxhdGZvcm1dKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGV4ZWN1dGVCdWlsZFN0YWdlVGFzaygnY29tbWFuZCBydW4nLCAncnVuJywge1xuICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICBkZXN0LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgdXBsb2FkKHBsYXRmb3JtOiBQbGF0Zm9ybSwgZGVzdDogc3RyaW5nLCBhY2Nlc3NUb2tlbj86IHN0cmluZykge1xuICAgICAgICBHbG9iYWxDb25maWcubW9kZSA9ICdzaW1wbGUnO1xuICAgICAgICBjb25zdCB7IGluaXQsIGV4ZWN1dGVCdWlsZFN0YWdlVGFzayB9ID0gYXdhaXQgaW1wb3J0KCcuL2J1aWxkZXInKTtcbiAgICAgICAgYXdhaXQgaW5pdChbcGxhdGZvcm1dKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGV4ZWN1dGVCdWlsZFN0YWdlVGFzaygnY29tbWFuZCB1cGxvYWQnLCAndXBsb2FkJywge1xuICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICBkZXN0LFxuICAgICAgICAgICAgcGFja2FnZXM6IGFjY2Vzc1Rva2VuID8ge1xuICAgICAgICAgICAgICAgIFtwbGF0Zm9ybV06IHtcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzVG9rZW4sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0gOiB1bmRlZmluZWQsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyBwdWJsaXNoKHBsYXRmb3JtOiBQbGF0Zm9ybSwgZGVzdDogc3RyaW5nKSB7XG4gICAgICAgIEdsb2JhbENvbmZpZy5tb2RlID0gJ3NpbXBsZSc7XG4gICAgICAgIGNvbnN0IHsgaW5pdCwgZXhlY3V0ZUJ1aWxkU3RhZ2VUYXNrIH0gPSBhd2FpdCBpbXBvcnQoJy4vYnVpbGRlcicpO1xuICAgICAgICBhd2FpdCBpbml0KFtwbGF0Zm9ybV0pO1xuICAgICAgICByZXR1cm4gYXdhaXQgZXhlY3V0ZUJ1aWxkU3RhZ2VUYXNrKCdjb21tYW5kIHB1Ymxpc2gnLCAncHVibGlzaCcsIHtcbiAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgZGVzdCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIC8vIOmHiuaUvua1j+iniOWZqOmihOiniOi1hOa6kO+8iOaJqeWxlemihOiniOWQjuerryArIOeDremHjei9veebkeWQrO+8ie+8jOWvuem9kCBDcmVhdG9yIOeUn+WRveWRqOacn1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXNwb3NlQnJvd3NlclByZXZpZXcgfSA9IGF3YWl0IGltcG9ydCgnLi9wcmV2aWV3L3JlZ2lzdGVyJyk7XG4gICAgICAgICAgICBhd2FpdCBkaXNwb3NlQnJvd3NlclByZXZpZXcoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tQcmV2aWV3XSBkaXNwb3NlIGZhaWxlZDonLCBlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWz6Zet5pyN5Yqh5ZmoXG4gICAgICAgIGNvbnN0IHsgc3RvcFNlcnZlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zZXJ2ZXInKTtcbiAgICAgICAgYXdhaXQgc3RvcFNlcnZlcigpO1xuXG4gICAgICAgIC8vIOWFs+mXreWcuuaZr+i/m+eoi1xuICAgICAgICBjb25zdCB7IHNjZW5lV29ya2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2NlbmUvbWFpbi1wcm9jZXNzL3NjZW5lLXdvcmtlcicpO1xuICAgICAgICBhd2FpdCBzY2VuZVdvcmtlci5zdG9wKCk7XG5cbiAgICAgICAgLy8g5YWz6Zet6LWE5rqQ5pWw5o2u5bqTXG4gICAgICAgIGNvbnN0IHsgc3RvcEFzc2V0REIgfSA9IGF3YWl0IGltcG9ydCgnLi9hc3NldHMnKTtcbiAgICAgICAgYXdhaXQgc3RvcEFzc2V0REIoKTtcblxuICAgICAgICAvLyDlhbPpl63ohJrmnKznrqHnkIblmahcbiAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBzY3JpcHRpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi9zY3JpcHRpbmcnKTtcbiAgICAgICAgYXdhaXQgc2NyaXB0aW5nLmNsb3NlKCk7XG5cbiAgICAgICAgLy8g5L+d5a2Y6aG555uu6YWN572uXG4gICAgICAgIGNvbnN0IHsgZGVmYXVsdDogUHJvamVjdCB9ID0gYXdhaXQgaW1wb3J0KCcuL3Byb2plY3QnKTtcbiAgICAgICAgYXdhaXQgUHJvamVjdC5jbG9zZSgpO1xuICAgICAgICAvLyAtLS0tLSBUT0RPIOWPr+iDveacieeahOabtOWkmuWFtuS7luaooeWdl+eahOS/neWtmOmUgOavgeaTjeS9nCAtLS0tXG4gICAgfVxufVxuIl19