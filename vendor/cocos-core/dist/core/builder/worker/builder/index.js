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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTask = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const asset_1 = require("./manager/asset");
const build_result_1 = require("./manager/build-result");
const build_result_2 = require("./manager/build-result");
const task_config_1 = require("./task-config");
const stage_task_manager_1 = require("./stage-task-manager");
const sub_process_manager_1 = require("../worker-pools/sub-process-manager");
const bundle_1 = require("./asset-handler/bundle");
const cc_1 = require("cc");
const task_base_1 = require("./manager/task-base");
const utils_1 = require("../../share/utils");
const build_template_1 = require("./manager/build-template");
const console_1 = require("../../../base/console");
const assets_1 = require("../../../assets");
const utils_2 = __importDefault(require("../../../base/utils"));
const plugin_1 = require("../../manager/plugin");
const i18n_1 = __importDefault(require("../../../base/i18n"));
const common_options_validator_1 = require("../../share/common-options-validator");
const buildUtils = __importStar(require("./utils"));
const utils_3 = __importDefault(require("../../../base/utils"));
class BuildTask extends task_base_1.BuildTaskBase {
    cache;
    result;
    buildTemplate;
    // 对外部插件提供的构建结果
    buildResult;
    options;
    hooksInfo;
    taskManager;
    // 构建主流程任务权重，随着其他阶段性任务的加入可能会有变化
    mainTaskWeight = 1;
    // 是否为命令行构建
    static isCommandBuild = false;
    currentStageTask;
    currentSubTask;
    subTaskBuildOptions = {};
    bundleManager;
    hookMap = {
        onBeforeBuild: 'onBeforeBuild',
        onBeforeInit: 'onBeforeInit',
        onAfterInit: 'onAfterInit',
        onBeforeBuildAssets: 'onBeforeBuildAssets',
        onAfterBuildAssets: 'onAfterBuildAssets',
        onBeforeCompressSettings: 'onBeforeCompressSettings',
        onAfterCompressSettings: 'onAfterCompressSettings',
        onAfterBuild: 'onAfterBuild',
        onBeforeCopyBuildTemplate: 'onBeforeCopyBuildTemplate',
        onAfterCopyBuildTemplate: 'onAfterCopyBuildTemplate',
        onError: 'onError',
    };
    // 执行整个构建流程的顺序流程
    pipeline = [];
    /**
     * 构建任务的结果缓存，只允许接口访问
     */
    taskResMap = {};
    static utils = {
        isInstallNodeJs: buildUtils.isInstallNodeJs,
        relativeUrl: buildUtils.relativeUrl,
        transformCode: buildUtils.transformCode,
        resolveToRaw: utils_3.default.Path.resolveToRaw,
    };
    get utils() {
        return BuildTask.utils;
    }
    constructor(id, options) {
        super(id, 'build');
        this.taskManager = new task_config_1.TaskManager();
        this.taskManager.activeTask('dataTasks');
        this.taskManager.activeTask('settingTasks');
        this.taskManager.activeTask('buildTasks');
        this.taskManager.activeTask('md5Tasks');
        this.taskManager.activeTask('postprocessTasks');
        this.hooksInfo = plugin_1.pluginManager.getHooksInfo(options.platform);
        // TODO 补全 options 为 IInternalBuildOptions
        this.options = options;
        this.cache = new asset_1.BuilderAssetCache(this);
        this.result = new build_result_1.InternalBuildResult(this, !!options.preview);
        if (options.preview || options.buildMode === 'bundle') {
            return;
        }
        this.result.addListener('updateProcess', (message) => {
            this.updateProcess(message);
        });
        this.taskManager.activeTask('buildTasks');
        this.options.md5Cache && (this.taskManager.activeTask('md5Tasks'));
        this.taskManager.activeTask('postprocessTasks');
        this.buildResult = new build_result_2.BuildResult(this);
        const buildUnitCount = 1 + (this.options.subTaskPlatforms?.length || 0);
        if (this.options.nextStages?.length || buildUnitCount > 1) {
            // 当存在阶段性任务时，构建主流程的权重降级
            this.mainTaskWeight = 1 / (buildUnitCount + (this.options.nextStages?.length || 0));
        }
        this.hookWeight = this.mainTaskWeight * this.taskManager.taskWeight;
        this.buildTemplate = new build_template_1.BuildTemplate(this.options.platform, this.options.taskName, plugin_1.pluginManager.getBuildTemplateConfig(this.options.platform));
        // TODO
        // this.pipeline = [
        //     this.hookMap.onBeforeBuild,
        //     this.lockAssetDB,
        //     this.hookMap.onBeforeInit,
        //     this.init,
        //     this.hookMap.onAfterInit,
        //     this.initBundleManager,
        //     this.dataTasks,
        //     this.buildTasks,
        //     this.hookMap.onAfterBuildAssets,
        //     this.md5Tasks,
        //     this.settingTasks,
        //     this.hookMap.onBeforeCompressSettings,
        //     this.postprocessTasks,
        //     this.hookMap.onAfterCompressSettings,
        //     this.hookMap.onAfterBuild,
        // ];
    }
    get stage() {
        if (!this.currentStageTask) {
            return 'build';
        }
        return this.currentStageTask.name;
    }
    /**
     * 获取某个任务结果
     * @param name
     */
    getTaskResult(name) {
        return this.taskResMap[name];
    }
    /**
     * 开始整理构建需要的参数
     */
    async init() {
        // TODO 所有类似的新流程，都应该走统一的 runBuildTask 处理，否则可能无法中断
        if (this.error) {
            return;
        }
        console.debug('Query all assets info in project');
        await this.initOptions();
        // 清空所有资源缓存
        cc.assetManager.releaseAll();
        await this.cache.init();
    }
    /**
     * 执行具体的构建任务
     */
    async run() {
        const restoreLogSink = console_1.newConsole.createLogSinkRestorer();
        let failed = false;
        const { dir } = this.result.paths;
        if (!dir) {
            console.error('No output path can be built.');
            return false;
        }
        try {
            if (this.options.buildMode === 'bundle') {
                await this.buildBundleOnly();
                return true;
            }
            await (0, fs_extra_1.ensureDir)(this.result.paths.dir);
            // 允许插件在 onBeforeBuild 内修改 useCache
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onBeforeBuild);
            if (!this.options.useCache) {
                // 固定清理工程的时机，请勿改动以免造成不必要的插件兼容问题
                (0, fs_extra_1.emptyDirSync)(this.result.paths.dir);
            }
            await this.lockAssetDB();
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onBeforeInit);
            await this.init();
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onAfterInit);
            await this.initBundleManager();
            await this.bundleManager.runPluginTask(this.bundleManager.hookMap.onBeforeBundleDataTask);
            // 开始执行预制任务
            await this.runBuildTask(task_config_1.TaskManager.getBuildTask('dataTasks'), this.taskManager.taskWeight);
            await this.bundleManager.runPluginTask(this.bundleManager.hookMap.onAfterBundleDataTask);
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onBeforeBuildAssets);
            await this.bundleManager.runPluginTask(this.bundleManager.hookMap.onBeforeBundleBuildTask);
            // 开始执行构建任务
            await this.runBuildTask(task_config_1.TaskManager.getBuildTask('buildTasks'), this.taskManager.taskWeight);
            await this.bundleManager.runPluginTask(this.bundleManager.hookMap.onAfterBundleBuildTask);
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onAfterBuildAssets);
            await this.runBuildTask(task_config_1.TaskManager.getBuildTask('settingTasks'), this.taskManager.taskWeight);
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onBeforeCompressSettings);
            await this.runBuildTask(task_config_1.TaskManager.getBuildTask('postprocessTasks'), this.taskManager.taskWeight);
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onAfterCompressSettings);
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onBeforeCopyBuildTemplate);
            // 拷贝自定义模板
            await this.buildTemplate.copyTo(this.result.paths.output);
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onAfterCopyBuildTemplate);
            // MD5 处理
            this.options.md5Cache && (await this.runBuildTask(task_config_1.TaskManager.getBuildTask('md5Tasks'), this.taskManager.taskWeight));
            // 构建进程结束之前
            await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onAfterBuild);
            await this.postBuild();
            if (this.options.subTaskPlatforms)
                await this.runSubTaskBuilds();
            if (this.error) {
                failed = true;
                return false;
            }
            this.options.nextStages && (await this.handleBuildStageTask(this.options.nextStages));
            if (this.error) {
                failed = true;
                return false;
            }
            return true;
        }
        catch (error) {
            failed = true;
            throw error;
        }
        finally {
            this.stopProgressHeartbeat();
            if (failed || this.error) {
                console_1.newConsole.stopRecord();
            }
            else {
                restoreLogSink();
            }
        }
    }
    /**
     * 仅构建 Bundle 流程
     */
    async buildBundleOnly() {
        const settingTasks = this.taskManager.activeCustomTask('settingTasks', [
            'setting-task/cache',
            'setting-task/asset',
            'setting-task/script',
        ]);
        await this.lockAssetDB();
        // 走构建任务的仅 Bundle 构建模式也需要执行 init 前后钩子，因为此时需要保障包完整
        // 不执行一些选项的修改可能没有同步到
        await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onBeforeInit);
        await this.init();
        await this.runPluginTask(task_config_1.TaskManager.pluginTasks.onAfterInit);
        this.bundleManager = await bundle_1.BundleManager.create(this.options, this);
        this.bundleManager.options.dest = this.result.paths.assets;
        this.bundleManager.destDir = this.result.paths.assets;
        this.bundleManager.updateProcess = (message, progress) => {
            this.updateProcess(message, progress - this.bundleManager.progress);
        };
        await this.bundleManager.run();
        await this.runBuildTask(settingTasks, this.taskManager.taskWeight);
        const bundles = this.bundleManager.bundles.filter((bundle) => bundle.output).sort((a, b) => a.name.localeCompare(b.name));
        if (this.options.md5Cache) {
            for (const bundle of bundles) {
                this.result.settings.assets.bundleVers[bundle.name] = bundle.version;
            }
        }
        // 生成 settings.json
        const content = JSON.stringify(this.result.settings, null, this.options.debug ? 4 : 0);
        (0, fs_extra_1.outputFileSync)(this.result.paths.settings, content, 'utf8');
        await this.unLockAssetDB();
    }
    async postBuild() {
        this.unLockAssetDB();
        if (this.options.generateCompileConfig || this.options.subTaskPlatforms?.length) {
            // 保存当前的 options 到实际包内，作为后续编译参数也为将来制作仅构建引擎等等处理做备份
            (0, fs_extra_1.outputJSONSync)(this.result.paths.compileConfig, this.getCompileConfigOptions());
        }
        // 统计流程放在最后，避免出错时干扰其他流程
        // 追踪构建时长，统计构建错误，发送统计消息
        const totalTime = await console_1.newConsole.trackTimeEnd('builder:build-project-total', { output: true });
        console.debug(`build task(${this.options.taskName}) in ${totalTime}!`);
    }
    async runSubTaskBuilds() {
        const subTaskPlatforms = this.options.subTaskPlatforms || [];
        if (!subTaskPlatforms.length || this.options.parentTaskId) {
            return;
        }
        this.options.childTaskIds = [];
        this.options.subTaskBuildOutputs = {};
        this.buildExitRes.custom.subTasks = {
            platforms: subTaskPlatforms,
            outputs: {},
        };
        for (const platform of subTaskPlatforms) {
            const childOptions = await this.createSubTaskOptions(platform);
            this.options.childTaskIds.push(childOptions.taskId);
            const childTask = new BuildTask(childOptions.taskId, childOptions);
            this.currentSubTask = childTask;
            let lastProgress = 0;
            childTask.on('update', (message, progress) => {
                const increment = Math.max(progress - lastProgress, 0) * this.mainTaskWeight;
                lastProgress = Math.max(lastProgress, progress);
                this.updateProcess(`[sub-build:${platform}] ${message}`, increment);
            });
            console.log(`[sub-build:${platform}] start`);
            const success = await childTask.run();
            if (!success || childTask.error) {
                this.error = childTask.error || new Error(`Sub platform ${platform} build failed`);
                this.currentSubTask = undefined;
                return;
            }
            if (lastProgress < 1) {
                this.updateProcess(`[sub-build:${platform}] complete`, (1 - lastProgress) * this.mainTaskWeight, 'success');
            }
            const output = {
                platform,
                dest: childTask.result.paths.dir,
                buildPath: childOptions.buildPath,
                outputName: childOptions.outputName,
                taskId: childOptions.taskId,
                parentTaskId: this.options.taskId,
                logDest: childOptions.logDest,
            };
            this.options.subTaskBuildOutputs[platform] = output;
            this.syncSubTaskPackageOptions(platform, childTask);
            this.subTaskBuildOptions[platform] = childTask.options;
            this.buildExitRes.custom.subTasks.outputs[platform] = {
                ...output,
                custom: childTask.buildExitRes.custom,
            };
            console.log(`[sub-build:${platform}] success`);
        }
        this.currentSubTask = undefined;
        (0, fs_extra_1.outputJSONSync)(this.result.paths.compileConfig, this.getCompileConfigOptions());
    }
    syncSubTaskPackageOptions(platform, childTask) {
        const childCompileOptions = childTask.result.compileOptions || childTask.options;
        const childPackageOptions = childCompileOptions.packages?.[platform];
        if (!childPackageOptions) {
            return;
        }
        const clonedPackageOptions = JSON.parse(JSON.stringify(childPackageOptions));
        this.options.packages = this.options.packages || {};
        this.options.packages[platform] = clonedPackageOptions;
        if (this.result.compileOptions) {
            this.result.compileOptions.packages = this.result.compileOptions.packages || {};
            this.result.compileOptions.packages[platform] = JSON.parse(JSON.stringify(childPackageOptions));
        }
    }
    async createSubTaskOptions(platform) {
        const childOptions = JSON.parse(JSON.stringify(this.options));
        childOptions.platform = platform;
        childOptions.outputName = platform;
        childOptions.buildPath = this.result.paths.dir;
        childOptions.taskName = `${this.options.taskName || this.options.platform}-${platform}`;
        childOptions.taskId = `${this.options.taskId}:${platform}`;
        childOptions.parentTaskId = this.options.taskId;
        childOptions.generateCompileConfig = true;
        childOptions.subTaskPlatforms = undefined;
        childOptions.subTaskBuildOutputs = undefined;
        childOptions.childTaskIds = undefined;
        childOptions.nextStages = undefined;
        childOptions.buildStageGroup = undefined;
        childOptions.packages = {
            [platform]: this.options.packages?.[platform] || {},
        };
        const checkedOptions = await plugin_1.pluginManager.checkOptions(childOptions);
        if (!checkedOptions) {
            throw new Error(`Check sub platform ${platform} build options failed`);
        }
        checkedOptions.taskId = childOptions.taskId;
        checkedOptions.taskName = childOptions.taskName;
        checkedOptions.logDest = childOptions.logDest;
        checkedOptions.parentTaskId = this.options.taskId;
        checkedOptions.generateCompileConfig = true;
        checkedOptions.subTaskPlatforms = undefined;
        checkedOptions.subTaskBuildOutputs = undefined;
        checkedOptions.childTaskIds = undefined;
        checkedOptions.nextStages = undefined;
        checkedOptions.buildStageGroup = undefined;
        return checkedOptions;
    }
    getCompileConfigOptions() {
        const compileOptions = this.result.compileOptions || this.options;
        if (this.options.parentTaskId) {
            compileOptions.parentTaskId = this.options.parentTaskId;
        }
        if (this.options.childTaskIds) {
            compileOptions.childTaskIds = this.options.childTaskIds;
        }
        if (this.options.subTaskPlatforms) {
            compileOptions.subTaskPlatforms = this.options.subTaskPlatforms;
        }
        if (this.options.subTaskBuildOutputs) {
            compileOptions.subTaskBuildOutputs = this.options.subTaskBuildOutputs;
        }
        return compileOptions;
    }
    async handleBuildStageTask(stages) {
        const stageWeight = 1 - this.mainTaskWeight;
        const stagePlatforms = this.getStagePlatforms();
        if (stagePlatforms.length > 1) {
            const unitStageWeight = stageWeight / (stages.length * stagePlatforms.length);
            for (const taskName of stages) {
                for (const stagePlatform of stagePlatforms) {
                    await this.runStageForPlatform(taskName, stagePlatform, unitStageWeight);
                    if (this.error) {
                        return;
                    }
                }
            }
            return;
        }
        for (const taskName of stages) {
            const stageConfig = plugin_1.pluginManager.getBuildStageWithHookTasks(this.options.platform, taskName);
            if (!stageConfig) {
                this.updateProcess(`No stage task: ${taskName} in platform ${this.options.platform}, please check your build options`, stageWeight);
                continue;
            }
            // HACK 目前原生平台钩子函数修改了 result.paths.dir 因而构建路径需要自行重新拼接
            const root = (0, utils_1.getBuildPath)(this.options);
            const buildStageTask = new stage_task_manager_1.BuildStageTask(this.id, {
                ...stageConfig,
                hooksInfo: this.hooksInfo,
                root,
                buildTaskOptions: this.options,
                progressHeartbeat: false,
            });
            buildStageTask.buildExitRes.custom = {
                ...this.buildExitRes.custom,
            };
            this.currentStageTask = buildStageTask;
            buildStageTask.on('update', (message, increment) => {
                this.updateProcess(message, increment * stageWeight);
            });
            await buildStageTask.run();
            if (this.error) {
                await this.onError(this.error);
                return;
            }
            else if (buildStageTask.error) {
                this.error = buildStageTask.error;
                return;
            }
            this.buildExitRes.custom = {
                ...this.buildExitRes.custom,
                ...buildStageTask.buildExitRes.custom,
            };
        }
    }
    getStagePlatforms() {
        return [
            {
                platform: String(this.options.platform),
                root: (0, utils_1.getBuildPath)(this.options),
                buildTaskOptions: this.options,
                hooksInfo: this.hooksInfo,
                required: true,
            },
            ...(this.options.subTaskPlatforms || []).map((platform) => {
                const output = this.options.subTaskBuildOutputs?.[platform];
                return {
                    platform,
                    root: output?.dest || '',
                    buildTaskOptions: this.createChildStageOptions(platform, output),
                    hooksInfo: plugin_1.pluginManager.getHooksInfo(platform),
                    required: false,
                };
            }),
        ];
    }
    createChildStageOptions(platform, output) {
        if (this.subTaskBuildOptions[platform]) {
            return JSON.parse(JSON.stringify(this.subTaskBuildOptions[platform]));
        }
        const options = JSON.parse(JSON.stringify(this.options));
        options.platform = platform;
        options.outputName = output?.outputName || platform;
        options.buildPath = output?.buildPath || this.result.paths.dir;
        options.taskId = output?.taskId || `${this.options.taskId}:${platform}`;
        options.parentTaskId = this.options.taskId;
        options.subTaskPlatforms = undefined;
        options.subTaskBuildOutputs = undefined;
        options.childTaskIds = undefined;
        options.nextStages = undefined;
        options.buildStageGroup = undefined;
        options.packages = {
            [platform]: this.options.packages?.[platform] || {},
        };
        return options;
    }
    async runStageForPlatform(taskName, stagePlatform, stageWeight) {
        const stageConfig = plugin_1.pluginManager.getBuildStageWithHookTasks(stagePlatform.platform, taskName);
        if (!stageConfig) {
            this.updateProcess(`No stage task: ${taskName} in platform ${stagePlatform.platform}, skip`, 0);
            return;
        }
        if (!stagePlatform.root) {
            this.error = new Error(`Missing build output for stage platform ${stagePlatform.platform}`);
            return;
        }
        const buildStageTask = new stage_task_manager_1.BuildStageTask(this.id, {
            ...stageConfig,
            hooksInfo: stagePlatform.hooksInfo,
            root: stagePlatform.root,
            buildTaskOptions: stagePlatform.buildTaskOptions,
            progressHeartbeat: false,
        });
        buildStageTask.buildExitRes.custom = {
            ...this.buildExitRes.custom,
        };
        this.currentStageTask = buildStageTask;
        buildStageTask.on('update', (message, increment) => {
            this.updateProcess(`[${stagePlatform.platform}] ${message}`, increment * stageWeight);
        });
        await buildStageTask.run();
        if (this.error) {
            await this.onError(this.error);
            return;
        }
        else if (buildStageTask.error) {
            this.error = buildStageTask.error;
            return;
        }
        this.buildExitRes.custom = {
            ...this.buildExitRes.custom,
            ...buildStageTask.buildExitRes.custom,
        };
    }
    async initBundleManager() {
        // TODO 所有类似的新流程，都应该走统一的 runBuildTask 处理，否则可能无法中断
        if (this.error) {
            await this.onError(this.error);
            return;
        }
        this.bundleManager = await bundle_1.BundleManager.create(this.options, this);
        this.bundleManager.options.dest = this.result.paths.assets;
        this.bundleManager.destDir = this.result.paths.assets;
        if (this.options.preview) {
            await this.bundleManager.initOptions();
        }
        else {
            this.bundleManager.updateProcess = (message, progress) => {
                this.updateProcess(message, progress - this.bundleManager.progress);
            };
        }
        await this.bundleManager.runPluginTask(this.bundleManager.hookMap.onBeforeBundleInit);
        await this.bundleManager.initBundle();
        await this.bundleManager.runPluginTask(this.bundleManager.hookMap.onAfterBundleInit);
    }
    break(reason) {
        sub_process_manager_1.workerManager.killRunningChilds();
        this.unLockAssetDB();
        this.bundleManager && this.bundleManager.break(reason);
        if (this.currentStageTask) {
            // 这里不需要等待，break 触发一下即可，后续有抛异常会被正常捕获
            this.currentStageTask.break(reason);
        }
        if (this.currentSubTask) {
            this.currentSubTask.break(reason);
        }
        this.onError(new Error(`Build task ${this.options.taskName || this.options.outputName} is break!`), false);
    }
    async lockAssetDB() {
        // TODO 所有类似的新流程，都应该走统一的 runBuildTask 处理，否则可能无法中断
        this.updateProcess('Start lock asset db...');
        await assets_1.assetDBManager.pause('build');
    }
    unLockAssetDB() {
        assets_1.assetDBManager.resume();
    }
    /**
     * 获取预览 settings 信息
     */
    async getPreviewSettings() {
        try {
            await this.init();
            this.result.settings.engine.engineModules = this.options.includeModules;
            await this.initBundleManager();
            // 开始执行预制任务
            await this.runBuildTask(task_config_1.TaskManager.getBuildTask('dataTasks'), this.taskManager.taskWeight);
            await this.runBuildTask(task_config_1.TaskManager.getBuildTask('settingTasks'), this.taskManager.taskWeight);
            return this.result.settings;
        }
        finally {
            this.stopProgressHeartbeat();
        }
    }
    async initOptions() {
        this.options.platformType = plugin_1.pluginManager.platformConfig[this.options.platform].platformType;
        const defaultMd5CacheOptions = {
            excludes: [],
            includes: [],
            replaceOnly: [],
            handleTemplateMd5Link: false,
        };
        this.options.md5CacheOptions = Object.assign(defaultMd5CacheOptions, this.options.md5CacheOptions || {});
        await (0, common_options_validator_1.checkProjectSetting)(this.options);
        // TODO 支持传参直接传递 resolution
        this.options.resolution = {
            width: this.options.designResolution.width,
            height: this.options.designResolution.height,
            policy: cc_1.ResolutionPolicy.SHOW_ALL,
        };
        const resolution = this.options.resolution;
        if (this.options.designResolution.fitHeight) {
            if (this.options.designResolution.fitWidth) {
                resolution.policy = cc_1.ResolutionPolicy.SHOW_ALL;
            }
            else {
                resolution.policy = cc_1.ResolutionPolicy.FIXED_HEIGHT;
            }
        }
        else {
            if (this.options.designResolution.fitWidth) {
                resolution.policy = cc_1.ResolutionPolicy.FIXED_WIDTH;
            }
            else {
                resolution.policy = cc_1.ResolutionPolicy.NO_BORDER;
            }
        }
        // 处理自定义管线的相关逻辑，项目设置交互已处理过的主要是为了场景环境，构建需要再次确认，避免模块有出入
        const CUSTOM_PIPELINE_NAME = this.options.macroConfig.CUSTOM_PIPELINE_NAME;
        if (this.options.customPipeline) {
            const legacyPipelineIndex = this.options.includeModules.findIndex((module) => module === 'legacy-pipeline');
            if (legacyPipelineIndex !== -1) {
                this.options.includeModules.splice(legacyPipelineIndex, 1);
            }
            !this.options.includeModules.includes('custom-pipeline') && this.options.includeModules.push('custom-pipeline');
            // 使用了内置管线的情况下, 添加 custom-pipeline-builtin-scripts 模块方能打包对应的脚本
            if (CUSTOM_PIPELINE_NAME === 'Builtin' || !CUSTOM_PIPELINE_NAME) {
                if (!this.options.includeModules.includes('custom-pipeline-builtin-scripts')) {
                    this.options.includeModules.push('custom-pipeline-builtin-scripts');
                }
            }
        }
        else {
            const customPipelineIndex = this.options.includeModules.findIndex((module) => module === 'custom-pipeline');
            if (customPipelineIndex !== -1) {
                this.options.includeModules.splice(customPipelineIndex, 1);
            }
            !this.options.includeModules.includes('legacy-pipeline') && this.options.includeModules.push('legacy-pipeline');
        }
        if (this.options.preview) {
            return;
        }
        this.options.appTemplateData = {
            debugMode: this.options.debug,
            renderMode: false, // !!options.renderMode,
            showFPS: this.options.debug,
            resolution,
            md5Cache: this.options.md5Cache,
            cocosTemplate: '',
        };
        this.options.buildEngineParam = {
            entry: this.options.engineInfo.typescript.path,
            debug: this.options.debug,
            mangleProperties: this.options.mangleProperties,
            inlineEnum: this.options.inlineEnum,
            sourceMaps: this.options.sourceMaps,
            includeModules: this.options.includeModules,
            engineVersion: this.options.engineInfo.version,
            // 参与影响引擎复用规则的参数 key
            md5Map: [],
            engineName: 'cocos-js',
            output: (0, path_1.join)(this.result.paths.dir, 'cocos-js'),
            platformType: this.options.platformType,
            useCache: this.options.useCacheConfig?.engine === false ? false : true,
            nativeCodeBundleMode: this.options.nativeCodeBundleMode,
            wasmCompressionMode: this.options.wasmCompressionMode,
        };
        this.options.buildScriptParam = {
            experimentalEraseModules: this.options.experimentalEraseModules,
            outputName: 'project',
            flags: {
                DEBUG: !!this.options.debug,
                ...this.options.flags,
            },
            polyfills: this.options.polyfills,
            hotModuleReload: false,
            platform: this.options.platformType,
            commonDir: '',
            bundleCommonChunk: this.options.bundleCommonChunk ?? false,
            targets: this.options.buildScriptTargets,
        };
        if (this.options.polyfills) {
            this.options.polyfills.targets = this.options.buildScriptTargets;
        }
        else {
            this.options.polyfills = {
                targets: this.options.buildScriptTargets,
            };
        }
        this.options.assetSerializeOptions = {
            'cc.EffectAsset': {
                glsl1: this.options.includeModules.includes('gfx-webgl'),
                glsl3: this.options.includeModules.includes('gfx-webgl2'),
                glsl4: false,
            },
        };
        this.buildExitRes.dest = this.result.paths.dir;
    }
    /**
     * 执行某个任务列表
     * @param buildTasks 任务列表数组
     * @param weight 全部任务列表所占权重
     * @param args 需要传递给任务的其他参数
     */
    async runBuildTask(buildTasks, weight, ...args) {
        weight = this.mainTaskWeight * weight / buildTasks.length;
        // 开始执行预制任务
        for (let i = 0; i < buildTasks.length; i++) {
            if (this.error) {
                this.onError(this.error);
                return;
            }
            const task = buildTasks[i];
            const taskTitle = await transTitle(task.title);
            const trickTimeLabel = `// ---- build task ${taskTitle} ----`;
            console_1.newConsole.trackTimeStart(trickTimeLabel);
            this.startProgressStep(taskTitle + ' start', weight);
            console.debug(trickTimeLabel);
            console_1.newConsole.trackMemoryStart(taskTitle);
            try {
                const result = await task.handle.call(this, this.options, this.result, this.cache, ...args);
                // @ts-ignore
                task.name && result && (this.taskResMap[task.name] = result);
                const time = await console_1.newConsole.trackTimeEnd(trickTimeLabel, { output: true });
                this.updateProcess(`run build task ${taskTitle} success in ${(0, utils_1.formatMSTime)(time)}√`, weight, 'log');
            }
            catch (error) {
                console_1.newConsole.trackMemoryEnd(taskTitle);
                this.updateProcess(`run build task ${taskTitle} failed!`, weight, 'error');
                await this.onError(error, true);
                return;
            }
            console_1.newConsole.trackMemoryEnd(taskTitle);
        }
    }
    async handleHook(func, internal, ...args) {
        if (internal) {
            await func.call(this, this.options, this.result, this.cache, ...args);
        }
        else {
            await func(this.result.rawOptions, this.buildResult, ...args);
        }
    }
    onError(error, throwError = true) {
        this.error = error;
        this.stopProgressHeartbeat();
        this.bundleManager && (this.bundleManager.error = error);
        if (throwError) {
            throw error;
        }
    }
    async runErrorHook() {
        try {
            const funcName = 'onError';
            for (const pkgName of this.hooksInfo.pkgNameOrder) {
                const info = this.hooksInfo.infos[pkgName];
                let hooks;
                const timeLabel = `${pkgName}:(${funcName})`;
                try {
                    hooks = utils_2.default.File.requireFile(info.path);
                    if (hooks[funcName]) {
                        this.updateProcess(`${timeLabel} start...`);
                        console.debug(`// ---- ${pkgName}:(${funcName}) ----`);
                        console_1.newConsole.trackMemoryStart(timeLabel);
                        if (info.internal) {
                            await hooks[funcName].call(this, this.options, this.result, this.cache);
                        }
                        else {
                            // @ts-ignore
                            await hooks[funcName](this.result.rawOptions, this.buildResult);
                        }
                        console_1.newConsole.trackMemoryEnd(timeLabel);
                        console.debug(`// ---- ${pkgName}:(${funcName}) success ----`);
                        this.updateProcess(`${pkgName}:(${funcName})`);
                    }
                }
                catch (error) {
                    console_1.newConsole.trackMemoryEnd(timeLabel);
                    // @ts-ignore
                    console.error((new BuildError(`Run build plugin ${pkgName}:(${funcName}) failed!`)).stack);
                }
            }
            await this.postBuild();
        }
        catch (error) {
            console.debug(error);
        }
    }
}
exports.BuildTask = BuildTask;
/**
 * 翻译 title
 * @param title 原始 title 或者带有 i18n 开头的 title
 */
function transTitle(title) {
    if (typeof title !== 'string') {
        return '';
    }
    if (title.startsWith('i18n:')) {
        title = title.replace('i18n:', '');
        const res = i18n_1.default.t(title);
        if (res === title) {
            console.debug(`${title} is not defined in i18n`);
        }
        return res || title;
    }
    return title;
}
class BuildError {
    message;
    constructor(msg) {
        Error.captureStackTrace(this, BuildError);
        this.message = msg;
    }
}
