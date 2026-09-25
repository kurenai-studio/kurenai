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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRWIsdUNBQW1GO0FBQ25GLCtCQUE0QjtBQUM1QiwyQ0FBb0Q7QUFDcEQseURBQTZEO0FBQzdELHlEQUFxRDtBQUNyRCwrQ0FBNEM7QUFDNUMsNkRBQXNEO0FBQ3RELDZFQUFvRTtBQUNwRSxtREFBdUQ7QUFDdkQsMkJBQXNDO0FBQ3RDLG1EQUFvRDtBQUNwRCw2Q0FBK0Q7QUFDL0QsNkRBQXlEO0FBQ3pELG1EQUFtRDtBQUduRCw0Q0FBaUQ7QUFDakQsZ0VBQXdDO0FBQ3hDLGlEQUFxRDtBQUNyRCw4REFBc0M7QUFDdEMsbUZBQTJFO0FBRTNFLG9EQUFzQztBQUN0QyxnRUFBd0M7QUFFeEMsTUFBYSxTQUFVLFNBQVEseUJBQWE7SUFDakMsS0FBSyxDQUFvQjtJQUV6QixNQUFNLENBQXNCO0lBQzVCLGFBQWEsQ0FBaUI7SUFFckMsZUFBZTtJQUNSLFdBQVcsQ0FBZTtJQUUxQixPQUFPLENBQXdCO0lBRS9CLFNBQVMsQ0FBa0I7SUFFM0IsV0FBVyxDQUFjO0lBRWhDLCtCQUErQjtJQUN2QixjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBRTNCLFdBQVc7SUFDWCxNQUFNLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUV0QixnQkFBZ0IsQ0FBa0I7SUFDbEMsY0FBYyxDQUFhO0lBQzNCLG1CQUFtQixHQUEwQyxFQUFFLENBQUM7SUFFakUsYUFBYSxDQUFpQjtJQUU5QixPQUFPLEdBQTZDO1FBQ3ZELGFBQWEsRUFBRSxlQUFlO1FBQzlCLFlBQVksRUFBRSxjQUFjO1FBQzVCLFdBQVcsRUFBRSxhQUFhO1FBQzFCLG1CQUFtQixFQUFFLHFCQUFxQjtRQUMxQyxrQkFB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LENBQUMsQ0FBQztRQUN0QyxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFDRCxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUM7SUFDeEIsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxNQUFNLFVBQVU7SUFDWixPQUFPLENBQVM7SUFDaEIsWUFBWSxHQUFXO1FBQ25CLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDdkIsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBlbXB0eURpclN5bmMsIGVuc3VyZURpciwgb3V0cHV0RmlsZVN5bmMsIG91dHB1dEpTT05TeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQnVpbGRlckFzc2V0Q2FjaGUgfSBmcm9tICcuL21hbmFnZXIvYXNzZXQnO1xuaW1wb3J0IHsgSW50ZXJuYWxCdWlsZFJlc3VsdCB9IGZyb20gJy4vbWFuYWdlci9idWlsZC1yZXN1bHQnO1xuaW1wb3J0IHsgQnVpbGRSZXN1bHQgfSBmcm9tICcuL21hbmFnZXIvYnVpbGQtcmVzdWx0JztcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSAnLi90YXNrLWNvbmZpZyc7XG5pbXBvcnQgeyBCdWlsZFN0YWdlVGFzayB9IGZyb20gJy4vc3RhZ2UtdGFzay1tYW5hZ2VyJztcbmltcG9ydCB7IHdvcmtlck1hbmFnZXIgfSBmcm9tICcuLi93b3JrZXItcG9vbHMvc3ViLXByb2Nlc3MtbWFuYWdlcic7XG5pbXBvcnQgeyBCdW5kbGVNYW5hZ2VyIH0gZnJvbSAnLi9hc3NldC1oYW5kbGVyL2J1bmRsZSc7XG5pbXBvcnQgeyBSZXNvbHV0aW9uUG9saWN5IH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgQnVpbGRUYXNrQmFzZSB9IGZyb20gJy4vbWFuYWdlci90YXNrLWJhc2UnO1xuaW1wb3J0IHsgZm9ybWF0TVNUaW1lLCBnZXRCdWlsZFBhdGggfSBmcm9tICcuLi8uLi9zaGFyZS91dGlscyc7XG5pbXBvcnQgeyBCdWlsZFRlbXBsYXRlIH0gZnJvbSAnLi9tYW5hZ2VyL2J1aWxkLXRlbXBsYXRlJztcbmltcG9ydCB7IG5ld0NvbnNvbGUgfSBmcm9tICcuLi8uLi8uLi9iYXNlL2NvbnNvbGUnO1xuaW1wb3J0IHsgSVRhc2tSZXN1bHRNYXAgfSBmcm9tICcuLi8uLi9AdHlwZXMvYnVpbGRlcic7XG5pbXBvcnQgeyBJQnVpbGRlciwgSUludGVybmFsQnVpbGRPcHRpb25zLCBJQnVpbGRIb29rc0luZm8sIElCdWlsZFRhc2ssIElQbHVnaW5Ib29rTmFtZSwgSUJ1aWxkT3B0aW9uQmFzZSwgSUJ1aWxkUmVzdWx0RGF0YSwgSUJ1aWxkVXRpbHMsIElTdWJUYXNrQnVpbGRPdXRwdXQgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IGFzc2V0REJNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vLi4vYXNzZXRzJztcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IHBsdWdpbk1hbmFnZXIgfSBmcm9tICcuLi8uLi9tYW5hZ2VyL3BsdWdpbic7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgY2hlY2tQcm9qZWN0U2V0dGluZyB9IGZyb20gJy4uLy4uL3NoYXJlL2NvbW1vbi1vcHRpb25zLXZhbGlkYXRvcic7XG5pbXBvcnQgeyBJMThuS2V5cyB9IGZyb20gJy4uLy4uLy4uLy4uL2kxOG4vdHlwZXMvZ2VuZXJhdGVkJztcbmltcG9ydCAqIGFzIGJ1aWxkVXRpbHMgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vYmFzZS91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBCdWlsZFRhc2sgZXh0ZW5kcyBCdWlsZFRhc2tCYXNlIGltcGxlbWVudHMgSUJ1aWxkZXIge1xuICAgIHB1YmxpYyBjYWNoZTogQnVpbGRlckFzc2V0Q2FjaGU7XG5cbiAgICBwdWJsaWMgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0O1xuICAgIHB1YmxpYyBidWlsZFRlbXBsYXRlITogQnVpbGRUZW1wbGF0ZTtcblxuICAgIC8vIOWvueWklumDqOaPkuS7tuaPkOS+m+eahOaehOW7uue7k+aenFxuICAgIHB1YmxpYyBidWlsZFJlc3VsdD86IEJ1aWxkUmVzdWx0O1xuXG4gICAgcHVibGljIG9wdGlvbnM6IElJbnRlcm5hbEJ1aWxkT3B0aW9ucztcblxuICAgIHB1YmxpYyBob29rc0luZm86IElCdWlsZEhvb2tzSW5mbztcblxuICAgIHB1YmxpYyB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG5cbiAgICAvLyDmnoTlu7rkuLvmtYHnqIvku7vliqHmnYPph43vvIzpmo/nnYDlhbbku5bpmLbmrrXmgKfku7vliqHnmoTliqDlhaXlj6/og73kvJrmnInlj5jljJZcbiAgICBwcml2YXRlIG1haW5UYXNrV2VpZ2h0ID0gMTtcblxuICAgIC8vIOaYr+WQpuS4uuWRveS7pOihjOaehOW7ulxuICAgIHN0YXRpYyBpc0NvbW1hbmRCdWlsZCA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSBjdXJyZW50U3RhZ2VUYXNrPzogQnVpbGRTdGFnZVRhc2s7XG4gICAgcHJpdmF0ZSBjdXJyZW50U3ViVGFzaz86IEJ1aWxkVGFzaztcbiAgICBwcml2YXRlIHN1YlRhc2tCdWlsZE9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIElJbnRlcm5hbEJ1aWxkT3B0aW9ucz4gPSB7fTtcblxuICAgIHB1YmxpYyBidW5kbGVNYW5hZ2VyITogQnVuZGxlTWFuYWdlcjtcblxuICAgIHB1YmxpYyBob29rTWFwOiBSZWNvcmQ8SVBsdWdpbkhvb2tOYW1lLCBJUGx1Z2luSG9va05hbWU+ID0ge1xuICAgICAgICBvbkJlZm9yZUJ1aWxkOiAnb25CZWZvcmVCdWlsZCcsXG4gICAgICAgIG9uQmVmb3JlSW5pdDogJ29uQmVmb3JlSW5pdCcsXG4gICAgICAgIG9uQWZ0ZXJJbml0OiAnb25BZnRlckluaXQnLFxuICAgICAgICBvbkJlZm9yZUJ1aWxkQXNzZXRzOiAnb25CZWZvcmVCdWlsZEFzc2V0cycsXG4gICAgICAgIG9uQWZ0ZXJCdWlsZEFzc2V0czogJ29uQWZ0ZXJCdWlsZEFzc2V0cycsXG4gICAgICAgIG9uQmVmb3JlQ29tcHJlc3NTZXR0aW5nczogJ29uQmVmb3JlQ29tcHJlc3NTZXR0aW5ncycsXG4gICAgICAgIG9uQWZ0ZXJDb21wcmVzc1NldHRpbmdzOiAnb25BZnRlckNvbXByZXNzU2V0dGluZ3MnLFxuICAgICAgICBvbkFmdGVyQnVpbGQ6ICdvbkFmdGVyQnVpbGQnLFxuICAgICAgICBvbkJlZm9yZUNvcHlCdWlsZFRlbXBsYXRlOiAnb25CZWZvcmVDb3B5QnVpbGRUZW1wbGF0ZScsXG4gICAgICAgIG9uQWZ0ZXJDb3B5QnVpbGRUZW1wbGF0ZTogJ29uQWZ0ZXJDb3B5QnVpbGRUZW1wbGF0ZScsXG4gICAgICAgIG9uRXJyb3I6ICdvbkVycm9yJyxcbiAgICB9O1xuXG4gICAgLy8g5omn6KGM5pW05Liq5p6E5bu65rWB56iL55qE6aG65bqP5rWB56iLXG4gICAgcHVibGljIHBpcGVsaW5lOiAoc3RyaW5nIHwgRnVuY3Rpb24gfCBJQnVpbGRUYXNrW10pW10gPSBbXTtcblxuICAgIC8qKlxuICAgICAqIOaehOW7uuS7u+WKoeeahOe7k+aenOe8k+WtmO+8jOWPquWFgeiuuOaOpeWPo+iuv+mXrlxuICAgICAqL1xuICAgIHByaXZhdGUgdGFza1Jlc01hcDogSVRhc2tSZXN1bHRNYXAgPSB7fTtcblxuICAgIHN0YXRpYyB1dGlsczogSUJ1aWxkVXRpbHMgPSB7XG4gICAgICAgIGlzSW5zdGFsbE5vZGVKczogYnVpbGRVdGlscy5pc0luc3RhbGxOb2RlSnMsXG4gICAgICAgIHJlbGF0aXZlVXJsOiBidWlsZFV0aWxzLnJlbGF0aXZlVXJsLFxuICAgICAgICB0cmFuc2Zvcm1Db2RlOiBidWlsZFV0aWxzLnRyYW5zZm9ybUNvZGUsXG4gICAgICAgIHJlc29sdmVUb1JhdzogdXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcsXG4gICAgfTtcblxuICAgIGdldCB1dGlscygpIHtcbiAgICAgICAgcmV0dXJuIEJ1aWxkVGFzay51dGlscztcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihpZDogc3RyaW5nLCBvcHRpb25zOiBJQnVpbGRPcHRpb25CYXNlKSB7XG4gICAgICAgIHN1cGVyKGlkLCAnYnVpbGQnKTtcbiAgICAgICAgdGhpcy50YXNrTWFuYWdlciA9IG5ldyBUYXNrTWFuYWdlcigpO1xuICAgICAgICB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ2RhdGFUYXNrcycpO1xuICAgICAgICB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ3NldHRpbmdUYXNrcycpO1xuICAgICAgICB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ2J1aWxkVGFza3MnKTtcbiAgICAgICAgdGhpcy50YXNrTWFuYWdlci5hY3RpdmVUYXNrKCdtZDVUYXNrcycpO1xuICAgICAgICB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ3Bvc3Rwcm9jZXNzVGFza3MnKTtcbiAgICAgICAgdGhpcy5ob29rc0luZm8gPSBwbHVnaW5NYW5hZ2VyLmdldEhvb2tzSW5mbyhvcHRpb25zLnBsYXRmb3JtKTtcbiAgICAgICAgLy8gVE9ETyDooaXlhaggb3B0aW9ucyDkuLogSUludGVybmFsQnVpbGRPcHRpb25zXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgYXMgSUludGVybmFsQnVpbGRPcHRpb25zO1xuXG4gICAgICAgIHRoaXMuY2FjaGUgPSBuZXcgQnVpbGRlckFzc2V0Q2FjaGUodGhpcyk7XG4gICAgICAgIHRoaXMucmVzdWx0ID0gbmV3IEludGVybmFsQnVpbGRSZXN1bHQodGhpcywgISFvcHRpb25zLnByZXZpZXcpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnByZXZpZXcgfHwgb3B0aW9ucy5idWlsZE1vZGUgPT09ICdidW5kbGUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXN1bHQuYWRkTGlzdGVuZXIoJ3VwZGF0ZVByb2Nlc3MnLCAobWVzc2FnZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MobWVzc2FnZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ2J1aWxkVGFza3MnKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLm1kNUNhY2hlICYmICh0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ21kNVRhc2tzJykpO1xuICAgICAgICB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZVRhc2soJ3Bvc3Rwcm9jZXNzVGFza3MnKTtcbiAgICAgICAgdGhpcy5idWlsZFJlc3VsdCA9IG5ldyBCdWlsZFJlc3VsdCh0aGlzKTtcbiAgICAgICAgY29uc3QgYnVpbGRVbml0Q291bnQgPSAxICsgKHRoaXMub3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zPy5sZW5ndGggfHwgMCk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubmV4dFN0YWdlcz8ubGVuZ3RoIHx8IGJ1aWxkVW5pdENvdW50ID4gMSkge1xuICAgICAgICAgICAgLy8g5b2T5a2Y5Zyo6Zi25q615oCn5Lu75Yqh5pe277yM5p6E5bu65Li75rWB56iL55qE5p2D6YeN6ZmN57qnXG4gICAgICAgICAgICB0aGlzLm1haW5UYXNrV2VpZ2h0ID0gMSAvIChidWlsZFVuaXRDb3VudCArICh0aGlzLm9wdGlvbnMubmV4dFN0YWdlcz8ubGVuZ3RoIHx8IDApKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhvb2tXZWlnaHQgPSB0aGlzLm1haW5UYXNrV2VpZ2h0ICogdGhpcy50YXNrTWFuYWdlci50YXNrV2VpZ2h0O1xuICAgICAgICB0aGlzLmJ1aWxkVGVtcGxhdGUgPSBuZXcgQnVpbGRUZW1wbGF0ZSh0aGlzLm9wdGlvbnMucGxhdGZvcm0sIHRoaXMub3B0aW9ucy50YXNrTmFtZSwgcGx1Z2luTWFuYWdlci5nZXRCdWlsZFRlbXBsYXRlQ29uZmlnKHRoaXMub3B0aW9ucy5wbGF0Zm9ybSkpO1xuXG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gdGhpcy5waXBlbGluZSA9IFtcbiAgICAgICAgLy8gICAgIHRoaXMuaG9va01hcC5vbkJlZm9yZUJ1aWxkLFxuICAgICAgICAvLyAgICAgdGhpcy5sb2NrQXNzZXREQixcbiAgICAgICAgLy8gICAgIHRoaXMuaG9va01hcC5vbkJlZm9yZUluaXQsXG4gICAgICAgIC8vICAgICB0aGlzLmluaXQsXG4gICAgICAgIC8vICAgICB0aGlzLmhvb2tNYXAub25BZnRlckluaXQsXG4gICAgICAgIC8vICAgICB0aGlzLmluaXRCdW5kbGVNYW5hZ2VyLFxuICAgICAgICAvLyAgICAgdGhpcy5kYXRhVGFza3MsXG4gICAgICAgIC8vICAgICB0aGlzLmJ1aWxkVGFza3MsXG4gICAgICAgIC8vICAgICB0aGlzLmhvb2tNYXAub25BZnRlckJ1aWxkQXNzZXRzLFxuICAgICAgICAvLyAgICAgdGhpcy5tZDVUYXNrcyxcbiAgICAgICAgLy8gICAgIHRoaXMuc2V0dGluZ1Rhc2tzLFxuICAgICAgICAvLyAgICAgdGhpcy5ob29rTWFwLm9uQmVmb3JlQ29tcHJlc3NTZXR0aW5ncyxcbiAgICAgICAgLy8gICAgIHRoaXMucG9zdHByb2Nlc3NUYXNrcyxcbiAgICAgICAgLy8gICAgIHRoaXMuaG9va01hcC5vbkFmdGVyQ29tcHJlc3NTZXR0aW5ncyxcbiAgICAgICAgLy8gICAgIHRoaXMuaG9va01hcC5vbkFmdGVyQnVpbGQsXG4gICAgICAgIC8vIF07XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBzdGFnZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTdGFnZVRhc2spIHtcbiAgICAgICAgICAgIHJldHVybiAnYnVpbGQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRTdGFnZVRhc2submFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmn5DkuKrku7vliqHnu5PmnpxcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRUYXNrUmVzdWx0KG5hbWU6IGtleW9mIElUYXNrUmVzdWx0TWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRhc2tSZXNNYXBbbmFtZV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5byA5aeL5pW055CG5p6E5bu66ZyA6KaB55qE5Y+C5pWwXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIC8vIFRPRE8g5omA5pyJ57G75Ly855qE5paw5rWB56iL77yM6YO95bqU6K+l6LWw57uf5LiA55qEIHJ1bkJ1aWxkVGFzayDlpITnkIbvvIzlkKbliJnlj6/og73ml6Dms5XkuK3mlq1cbiAgICAgICAgaWYgKHRoaXMuZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdRdWVyeSBhbGwgYXNzZXRzIGluZm8gaW4gcHJvamVjdCcpO1xuICAgICAgICBhd2FpdCB0aGlzLmluaXRPcHRpb25zKCk7XG5cbiAgICAgICAgLy8g5riF56m65omA5pyJ6LWE5rqQ57yT5a2YXG4gICAgICAgIGNjLmFzc2V0TWFuYWdlci5yZWxlYXNlQWxsKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuY2FjaGUuaW5pdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaJp+ihjOWFt+S9k+eahOaehOW7uuS7u+WKoVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBydW4oKSB7XG4gICAgICAgIGNvbnN0IHJlc3RvcmVMb2dTaW5rID0gbmV3Q29uc29sZS5jcmVhdGVMb2dTaW5rUmVzdG9yZXIoKTtcbiAgICAgICAgbGV0IGZhaWxlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB7IGRpciB9ID0gdGhpcy5yZXN1bHQucGF0aHM7XG4gICAgICAgIGlmICghZGlyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdObyBvdXRwdXQgcGF0aCBjYW4gYmUgYnVpbHQuJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5idWlsZE1vZGUgPT09ICdidW5kbGUnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5idWlsZEJ1bmRsZU9ubHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGVuc3VyZURpcih0aGlzLnJlc3VsdC5wYXRocy5kaXIpO1xuICAgICAgICAgICAgLy8g5YWB6K645o+S5Lu25ZyoIG9uQmVmb3JlQnVpbGQg5YaF5L+u5pS5IHVzZUNhY2hlXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1blBsdWdpblRhc2soVGFza01hbmFnZXIucGx1Z2luVGFza3Mub25CZWZvcmVCdWlsZCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy51c2VDYWNoZSkge1xuICAgICAgICAgICAgICAgIC8vIOWbuuWumua4heeQhuW3peeoi+eahOaXtuacuu+8jOivt+WLv+aUueWKqOS7peWFjemAoOaIkOS4jeW/heimgeeahOaPkuS7tuWFvOWuuemXrumimFxuICAgICAgICAgICAgICAgIGVtcHR5RGlyU3luYyh0aGlzLnJlc3VsdC5wYXRocy5kaXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2NrQXNzZXREQigpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5QbHVnaW5UYXNrKFRhc2tNYW5hZ2VyLnBsdWdpblRhc2tzLm9uQmVmb3JlSW5pdCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuUGx1Z2luVGFzayhUYXNrTWFuYWdlci5wbHVnaW5UYXNrcy5vbkFmdGVySW5pdCk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5pdEJ1bmRsZU1hbmFnZXIoKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5idW5kbGVNYW5hZ2VyLnJ1blBsdWdpblRhc2sodGhpcy5idW5kbGVNYW5hZ2VyLmhvb2tNYXAub25CZWZvcmVCdW5kbGVEYXRhVGFzayk7XG4gICAgICAgICAgICAvLyDlvIDlp4vmiafooYzpooTliLbku7vliqFcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuQnVpbGRUYXNrKFRhc2tNYW5hZ2VyLmdldEJ1aWxkVGFzaygnZGF0YVRhc2tzJyksIHRoaXMudGFza01hbmFnZXIudGFza1dlaWdodCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmJ1bmRsZU1hbmFnZXIucnVuUGx1Z2luVGFzayh0aGlzLmJ1bmRsZU1hbmFnZXIuaG9va01hcC5vbkFmdGVyQnVuZGxlRGF0YVRhc2spO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1blBsdWdpblRhc2soVGFza01hbmFnZXIucGx1Z2luVGFza3Mub25CZWZvcmVCdWlsZEFzc2V0cyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmJ1bmRsZU1hbmFnZXIucnVuUGx1Z2luVGFzayh0aGlzLmJ1bmRsZU1hbmFnZXIuaG9va01hcC5vbkJlZm9yZUJ1bmRsZUJ1aWxkVGFzayk7XG4gICAgICAgICAgICAvLyDlvIDlp4vmiafooYzmnoTlu7rku7vliqFcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuQnVpbGRUYXNrKFRhc2tNYW5hZ2VyLmdldEJ1aWxkVGFzaygnYnVpbGRUYXNrcycpLCB0aGlzLnRhc2tNYW5hZ2VyLnRhc2tXZWlnaHQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5idW5kbGVNYW5hZ2VyLnJ1blBsdWdpblRhc2sodGhpcy5idW5kbGVNYW5hZ2VyLmhvb2tNYXAub25BZnRlckJ1bmRsZUJ1aWxkVGFzayk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1blBsdWdpblRhc2soVGFza01hbmFnZXIucGx1Z2luVGFza3Mub25BZnRlckJ1aWxkQXNzZXRzKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5CdWlsZFRhc2soVGFza01hbmFnZXIuZ2V0QnVpbGRUYXNrKCdzZXR0aW5nVGFza3MnKSwgdGhpcy50YXNrTWFuYWdlci50YXNrV2VpZ2h0KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuUGx1Z2luVGFzayhUYXNrTWFuYWdlci5wbHVnaW5UYXNrcy5vbkJlZm9yZUNvbXByZXNzU2V0dGluZ3MpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5CdWlsZFRhc2soVGFza01hbmFnZXIuZ2V0QnVpbGRUYXNrKCdwb3N0cHJvY2Vzc1Rhc2tzJyksIHRoaXMudGFza01hbmFnZXIudGFza1dlaWdodCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1blBsdWdpblRhc2soVGFza01hbmFnZXIucGx1Z2luVGFza3Mub25BZnRlckNvbXByZXNzU2V0dGluZ3MpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5QbHVnaW5UYXNrKFRhc2tNYW5hZ2VyLnBsdWdpblRhc2tzLm9uQmVmb3JlQ29weUJ1aWxkVGVtcGxhdGUpO1xuICAgICAgICAgICAgLy8g5ou36LSd6Ieq5a6a5LmJ5qih5p2/XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmJ1aWxkVGVtcGxhdGUhLmNvcHlUbyh0aGlzLnJlc3VsdC5wYXRocy5vdXRwdXQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5QbHVnaW5UYXNrKFRhc2tNYW5hZ2VyLnBsdWdpblRhc2tzLm9uQWZ0ZXJDb3B5QnVpbGRUZW1wbGF0ZSk7XG4gICAgICAgICAgICAvLyBNRDUg5aSE55CGXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMubWQ1Q2FjaGUgJiYgKGF3YWl0IHRoaXMucnVuQnVpbGRUYXNrKFRhc2tNYW5hZ2VyLmdldEJ1aWxkVGFzaygnbWQ1VGFza3MnKSwgdGhpcy50YXNrTWFuYWdlci50YXNrV2VpZ2h0KSk7XG4gICAgICAgICAgICAvLyDmnoTlu7rov5vnqIvnu5PmnZ/kuYvliY1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuUGx1Z2luVGFzayhUYXNrTWFuYWdlci5wbHVnaW5UYXNrcy5vbkFmdGVyQnVpbGQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wb3N0QnVpbGQoKTtcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zKSBhd2FpdCB0aGlzLnJ1blN1YlRhc2tCdWlsZHMoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMubmV4dFN0YWdlcyAmJiAoYXdhaXQgdGhpcy5oYW5kbGVCdWlsZFN0YWdlVGFzayh0aGlzLm9wdGlvbnMubmV4dFN0YWdlcykpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zdG9wUHJvZ3Jlc3NIZWFydGJlYXQoKTtcbiAgICAgICAgICAgIGlmIChmYWlsZWQgfHwgdGhpcy5lcnJvcikge1xuICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUuc3RvcFJlY29yZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN0b3JlTG9nU2luaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LuF5p6E5bu6IEJ1bmRsZSDmtYHnqItcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgYnVpbGRCdW5kbGVPbmx5KCkge1xuICAgICAgICBjb25zdCBzZXR0aW5nVGFza3MgPSB0aGlzLnRhc2tNYW5hZ2VyLmFjdGl2ZUN1c3RvbVRhc2soJ3NldHRpbmdUYXNrcycsIFtcbiAgICAgICAgICAgICdzZXR0aW5nLXRhc2svY2FjaGUnLFxuICAgICAgICAgICAgJ3NldHRpbmctdGFzay9hc3NldCcsXG4gICAgICAgICAgICAnc2V0dGluZy10YXNrL3NjcmlwdCcsXG4gICAgICAgIF0pO1xuICAgICAgICBhd2FpdCB0aGlzLmxvY2tBc3NldERCKCk7XG4gICAgICAgIC8vIOi1sOaehOW7uuS7u+WKoeeahOS7hSBCdW5kbGUg5p6E5bu65qih5byP5Lmf6ZyA6KaB5omn6KGMIGluaXQg5YmN5ZCO6ZKp5a2Q77yM5Zug5Li65q2k5pe26ZyA6KaB5L+d6Zqc5YyF5a6M5pW0XG4gICAgICAgIC8vIOS4jeaJp+ihjOS4gOS6m+mAiemhueeahOS/ruaUueWPr+iDveayoeacieWQjOatpeWIsFxuICAgICAgICBhd2FpdCB0aGlzLnJ1blBsdWdpblRhc2soVGFza01hbmFnZXIucGx1Z2luVGFza3Mub25CZWZvcmVJbml0KTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0KCk7XG4gICAgICAgIGF3YWl0IHRoaXMucnVuUGx1Z2luVGFzayhUYXNrTWFuYWdlci5wbHVnaW5UYXNrcy5vbkFmdGVySW5pdCk7XG4gICAgICAgIHRoaXMuYnVuZGxlTWFuYWdlciA9IGF3YWl0IEJ1bmRsZU1hbmFnZXIuY3JlYXRlKHRoaXMub3B0aW9ucywgdGhpcyk7XG4gICAgICAgIHRoaXMuYnVuZGxlTWFuYWdlci5vcHRpb25zLmRlc3QgPSB0aGlzLnJlc3VsdC5wYXRocy5hc3NldHM7XG4gICAgICAgIHRoaXMuYnVuZGxlTWFuYWdlci5kZXN0RGlyID0gdGhpcy5yZXN1bHQucGF0aHMuYXNzZXRzO1xuICAgICAgICB0aGlzLmJ1bmRsZU1hbmFnZXIudXBkYXRlUHJvY2VzcyA9IChtZXNzYWdlLCBwcm9ncmVzczogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MobWVzc2FnZSwgcHJvZ3Jlc3MgLSB0aGlzLmJ1bmRsZU1hbmFnZXIucHJvZ3Jlc3MpO1xuICAgICAgICB9O1xuICAgICAgICBhd2FpdCB0aGlzLmJ1bmRsZU1hbmFnZXIucnVuKCk7XG4gICAgICAgIGF3YWl0IHRoaXMucnVuQnVpbGRUYXNrKHNldHRpbmdUYXNrcywgdGhpcy50YXNrTWFuYWdlci50YXNrV2VpZ2h0KTtcbiAgICAgICAgY29uc3QgYnVuZGxlcyA9IHRoaXMuYnVuZGxlTWFuYWdlci5idW5kbGVzLmZpbHRlcigoYnVuZGxlKSA9PiBidW5kbGUub3V0cHV0KS5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tZDVDYWNoZSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBidW5kbGUgb2YgYnVuZGxlcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdWx0LnNldHRpbmdzLmFzc2V0cy5idW5kbGVWZXJzW2J1bmRsZS5uYW1lXSA9IGJ1bmRsZS52ZXJzaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIOeUn+aIkCBzZXR0aW5ncy5qc29uXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeSh0aGlzLnJlc3VsdC5zZXR0aW5ncywgbnVsbCwgdGhpcy5vcHRpb25zLmRlYnVnID8gNCA6IDApO1xuICAgICAgICBvdXRwdXRGaWxlU3luYyh0aGlzLnJlc3VsdC5wYXRocy5zZXR0aW5ncywgY29udGVudCwgJ3V0ZjgnKTtcbiAgICAgICAgYXdhaXQgdGhpcy51bkxvY2tBc3NldERCKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBwb3N0QnVpbGQoKSB7XG5cbiAgICAgICAgdGhpcy51bkxvY2tBc3NldERCKCk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5nZW5lcmF0ZUNvbXBpbGVDb25maWcgfHwgdGhpcy5vcHRpb25zLnN1YlRhc2tQbGF0Zm9ybXM/Lmxlbmd0aCkge1xuICAgICAgICAgICAgLy8g5L+d5a2Y5b2T5YmN55qEIG9wdGlvbnMg5Yiw5a6e6ZmF5YyF5YaF77yM5L2c5Li65ZCO57ut57yW6K+R5Y+C5pWw5Lmf5Li65bCG5p2l5Yi25L2c5LuF5p6E5bu65byV5pOO562J562J5aSE55CG5YGa5aSH5Lu9XG4gICAgICAgICAgICBvdXRwdXRKU09OU3luYyh0aGlzLnJlc3VsdC5wYXRocy5jb21waWxlQ29uZmlnLCB0aGlzLmdldENvbXBpbGVDb25maWdPcHRpb25zKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIOe7n+iuoea1geeoi+aUvuWcqOacgOWQju+8jOmBv+WFjeWHuumUmeaXtuW5suaJsOWFtuS7lua1geeoi1xuICAgICAgICAvLyDov73ouKrmnoTlu7rml7bplb/vvIznu5/orqHmnoTlu7rplJnor6/vvIzlj5HpgIHnu5/orqHmtojmga9cbiAgICAgICAgY29uc3QgdG90YWxUaW1lID0gYXdhaXQgbmV3Q29uc29sZS50cmFja1RpbWVFbmQoJ2J1aWxkZXI6YnVpbGQtcHJvamVjdC10b3RhbCcsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBidWlsZCB0YXNrKCR7dGhpcy5vcHRpb25zLnRhc2tOYW1lfSkgaW4gJHt0b3RhbFRpbWV9IWApO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcnVuU3ViVGFza0J1aWxkcygpIHtcbiAgICAgICAgY29uc3Qgc3ViVGFza1BsYXRmb3JtcyA9IHRoaXMub3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zIHx8IFtdO1xuICAgICAgICBpZiAoIXN1YlRhc2tQbGF0Zm9ybXMubGVuZ3RoIHx8IHRoaXMub3B0aW9ucy5wYXJlbnRUYXNrSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGlsZFRhc2tJZHMgPSBbXTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnN1YlRhc2tCdWlsZE91dHB1dHMgPSB7fTtcbiAgICAgICAgdGhpcy5idWlsZEV4aXRSZXMuY3VzdG9tLnN1YlRhc2tzID0ge1xuICAgICAgICAgICAgcGxhdGZvcm1zOiBzdWJUYXNrUGxhdGZvcm1zLFxuICAgICAgICAgICAgb3V0cHV0czoge30sXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChjb25zdCBwbGF0Zm9ybSBvZiBzdWJUYXNrUGxhdGZvcm1zKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZE9wdGlvbnMgPSBhd2FpdCB0aGlzLmNyZWF0ZVN1YlRhc2tPcHRpb25zKHBsYXRmb3JtKTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jaGlsZFRhc2tJZHMucHVzaChjaGlsZE9wdGlvbnMudGFza0lkISk7XG4gICAgICAgICAgICBjb25zdCBjaGlsZFRhc2sgPSBuZXcgQnVpbGRUYXNrKGNoaWxkT3B0aW9ucy50YXNrSWQhLCBjaGlsZE9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3ViVGFzayA9IGNoaWxkVGFzaztcbiAgICAgICAgICAgIGxldCBsYXN0UHJvZ3Jlc3MgPSAwO1xuICAgICAgICAgICAgY2hpbGRUYXNrLm9uKCd1cGRhdGUnLCAobWVzc2FnZTogc3RyaW5nLCBwcm9ncmVzczogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5jcmVtZW50ID0gTWF0aC5tYXgocHJvZ3Jlc3MgLSBsYXN0UHJvZ3Jlc3MsIDApICogdGhpcy5tYWluVGFza1dlaWdodDtcbiAgICAgICAgICAgICAgICBsYXN0UHJvZ3Jlc3MgPSBNYXRoLm1heChsYXN0UHJvZ3Jlc3MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYFtzdWItYnVpbGQ6JHtwbGF0Zm9ybX1dICR7bWVzc2FnZX1gLCBpbmNyZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbc3ViLWJ1aWxkOiR7cGxhdGZvcm19XSBzdGFydGApO1xuICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IGNoaWxkVGFzay5ydW4oKTtcbiAgICAgICAgICAgIGlmICghc3VjY2VzcyB8fCBjaGlsZFRhc2suZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yID0gY2hpbGRUYXNrLmVycm9yIHx8IG5ldyBFcnJvcihgU3ViIHBsYXRmb3JtICR7cGxhdGZvcm19IGJ1aWxkIGZhaWxlZGApO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YlRhc2sgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxhc3RQcm9ncmVzcyA8IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYFtzdWItYnVpbGQ6JHtwbGF0Zm9ybX1dIGNvbXBsZXRlYCwgKDEgLSBsYXN0UHJvZ3Jlc3MpICogdGhpcy5tYWluVGFza1dlaWdodCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgb3V0cHV0OiBJU3ViVGFza0J1aWxkT3V0cHV0ID0ge1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgICAgIGRlc3Q6IGNoaWxkVGFzay5yZXN1bHQucGF0aHMuZGlyLFxuICAgICAgICAgICAgICAgIGJ1aWxkUGF0aDogY2hpbGRPcHRpb25zLmJ1aWxkUGF0aCxcbiAgICAgICAgICAgICAgICBvdXRwdXROYW1lOiBjaGlsZE9wdGlvbnMub3V0cHV0TmFtZSxcbiAgICAgICAgICAgICAgICB0YXNrSWQ6IGNoaWxkT3B0aW9ucy50YXNrSWQsXG4gICAgICAgICAgICAgICAgcGFyZW50VGFza0lkOiB0aGlzLm9wdGlvbnMudGFza0lkLFxuICAgICAgICAgICAgICAgIGxvZ0Rlc3Q6IGNoaWxkT3B0aW9ucy5sb2dEZXN0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zdWJUYXNrQnVpbGRPdXRwdXRzW3BsYXRmb3JtXSA9IG91dHB1dDtcbiAgICAgICAgICAgIHRoaXMuc3luY1N1YlRhc2tQYWNrYWdlT3B0aW9ucyhwbGF0Zm9ybSwgY2hpbGRUYXNrKTtcbiAgICAgICAgICAgIHRoaXMuc3ViVGFza0J1aWxkT3B0aW9uc1twbGF0Zm9ybV0gPSBjaGlsZFRhc2sub3B0aW9ucztcbiAgICAgICAgICAgIHRoaXMuYnVpbGRFeGl0UmVzLmN1c3RvbS5zdWJUYXNrcy5vdXRwdXRzW3BsYXRmb3JtXSA9IHtcbiAgICAgICAgICAgICAgICAuLi5vdXRwdXQsXG4gICAgICAgICAgICAgICAgY3VzdG9tOiBjaGlsZFRhc2suYnVpbGRFeGl0UmVzLmN1c3RvbSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3N1Yi1idWlsZDoke3BsYXRmb3JtfV0gc3VjY2Vzc2ApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudFN1YlRhc2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIG91dHB1dEpTT05TeW5jKHRoaXMucmVzdWx0LnBhdGhzLmNvbXBpbGVDb25maWcsIHRoaXMuZ2V0Q29tcGlsZUNvbmZpZ09wdGlvbnMoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzeW5jU3ViVGFza1BhY2thZ2VPcHRpb25zKHBsYXRmb3JtOiBzdHJpbmcsIGNoaWxkVGFzazogQnVpbGRUYXNrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkQ29tcGlsZU9wdGlvbnMgPSBjaGlsZFRhc2sucmVzdWx0LmNvbXBpbGVPcHRpb25zIHx8IGNoaWxkVGFzay5vcHRpb25zO1xuICAgICAgICBjb25zdCBjaGlsZFBhY2thZ2VPcHRpb25zID0gY2hpbGRDb21waWxlT3B0aW9ucy5wYWNrYWdlcz8uW3BsYXRmb3JtXTtcbiAgICAgICAgaWYgKCFjaGlsZFBhY2thZ2VPcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2xvbmVkUGFja2FnZU9wdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNoaWxkUGFja2FnZU9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnBhY2thZ2VzID0gdGhpcy5vcHRpb25zLnBhY2thZ2VzIHx8IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMucGFja2FnZXNbcGxhdGZvcm1dID0gY2xvbmVkUGFja2FnZU9wdGlvbnM7XG5cbiAgICAgICAgaWYgKHRoaXMucmVzdWx0LmNvbXBpbGVPcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VsdC5jb21waWxlT3B0aW9ucy5wYWNrYWdlcyA9IHRoaXMucmVzdWx0LmNvbXBpbGVPcHRpb25zLnBhY2thZ2VzIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy5yZXN1bHQuY29tcGlsZU9wdGlvbnMucGFja2FnZXNbcGxhdGZvcm1dID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjaGlsZFBhY2thZ2VPcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVN1YlRhc2tPcHRpb25zKHBsYXRmb3JtOiBzdHJpbmcpOiBQcm9taXNlPElJbnRlcm5hbEJ1aWxkT3B0aW9ucz4ge1xuICAgICAgICBjb25zdCBjaGlsZE9wdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMub3B0aW9ucykpO1xuICAgICAgICBjaGlsZE9wdGlvbnMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICAgICAgY2hpbGRPcHRpb25zLm91dHB1dE5hbWUgPSBwbGF0Zm9ybTtcbiAgICAgICAgY2hpbGRPcHRpb25zLmJ1aWxkUGF0aCA9IHRoaXMucmVzdWx0LnBhdGhzLmRpcjtcbiAgICAgICAgY2hpbGRPcHRpb25zLnRhc2tOYW1lID0gYCR7dGhpcy5vcHRpb25zLnRhc2tOYW1lIHx8IHRoaXMub3B0aW9ucy5wbGF0Zm9ybX0tJHtwbGF0Zm9ybX1gO1xuICAgICAgICBjaGlsZE9wdGlvbnMudGFza0lkID0gYCR7dGhpcy5vcHRpb25zLnRhc2tJZH06JHtwbGF0Zm9ybX1gO1xuICAgICAgICBjaGlsZE9wdGlvbnMucGFyZW50VGFza0lkID0gdGhpcy5vcHRpb25zLnRhc2tJZDtcbiAgICAgICAgY2hpbGRPcHRpb25zLmdlbmVyYXRlQ29tcGlsZUNvbmZpZyA9IHRydWU7XG4gICAgICAgIGNoaWxkT3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zID0gdW5kZWZpbmVkO1xuICAgICAgICBjaGlsZE9wdGlvbnMuc3ViVGFza0J1aWxkT3V0cHV0cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgY2hpbGRPcHRpb25zLmNoaWxkVGFza0lkcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgY2hpbGRPcHRpb25zLm5leHRTdGFnZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIGNoaWxkT3B0aW9ucy5idWlsZFN0YWdlR3JvdXAgPSB1bmRlZmluZWQ7XG4gICAgICAgIGNoaWxkT3B0aW9ucy5wYWNrYWdlcyA9IHtcbiAgICAgICAgICAgIFtwbGF0Zm9ybV06IHRoaXMub3B0aW9ucy5wYWNrYWdlcz8uW3BsYXRmb3JtXSB8fCB7fSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY2hlY2tlZE9wdGlvbnMgPSBhd2FpdCBwbHVnaW5NYW5hZ2VyLmNoZWNrT3B0aW9ucyhjaGlsZE9wdGlvbnMgYXMgYW55KTtcbiAgICAgICAgaWYgKCFjaGVja2VkT3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaGVjayBzdWIgcGxhdGZvcm0gJHtwbGF0Zm9ybX0gYnVpbGQgb3B0aW9ucyBmYWlsZWRgKTtcbiAgICAgICAgfVxuICAgICAgICBjaGVja2VkT3B0aW9ucy50YXNrSWQgPSBjaGlsZE9wdGlvbnMudGFza0lkO1xuICAgICAgICBjaGVja2VkT3B0aW9ucy50YXNrTmFtZSA9IGNoaWxkT3B0aW9ucy50YXNrTmFtZTtcbiAgICAgICAgY2hlY2tlZE9wdGlvbnMubG9nRGVzdCA9IGNoaWxkT3B0aW9ucy5sb2dEZXN0O1xuICAgICAgICBjaGVja2VkT3B0aW9ucy5wYXJlbnRUYXNrSWQgPSB0aGlzLm9wdGlvbnMudGFza0lkO1xuICAgICAgICAoY2hlY2tlZE9wdGlvbnMgYXMgSUludGVybmFsQnVpbGRPcHRpb25zKS5nZW5lcmF0ZUNvbXBpbGVDb25maWcgPSB0cnVlO1xuICAgICAgICBjaGVja2VkT3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zID0gdW5kZWZpbmVkO1xuICAgICAgICBjaGVja2VkT3B0aW9ucy5zdWJUYXNrQnVpbGRPdXRwdXRzID0gdW5kZWZpbmVkO1xuICAgICAgICBjaGVja2VkT3B0aW9ucy5jaGlsZFRhc2tJZHMgPSB1bmRlZmluZWQ7XG4gICAgICAgIGNoZWNrZWRPcHRpb25zLm5leHRTdGFnZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIChjaGVja2VkT3B0aW9ucyBhcyBhbnkpLmJ1aWxkU3RhZ2VHcm91cCA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIGNoZWNrZWRPcHRpb25zIGFzIElJbnRlcm5hbEJ1aWxkT3B0aW9ucztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbXBpbGVDb25maWdPcHRpb25zKCkge1xuICAgICAgICBjb25zdCBjb21waWxlT3B0aW9ucyA9IHRoaXMucmVzdWx0LmNvbXBpbGVPcHRpb25zIHx8IHRoaXMub3B0aW9ucztcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXJlbnRUYXNrSWQpIHtcbiAgICAgICAgICAgIGNvbXBpbGVPcHRpb25zLnBhcmVudFRhc2tJZCA9IHRoaXMub3B0aW9ucy5wYXJlbnRUYXNrSWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jaGlsZFRhc2tJZHMpIHtcbiAgICAgICAgICAgIGNvbXBpbGVPcHRpb25zLmNoaWxkVGFza0lkcyA9IHRoaXMub3B0aW9ucy5jaGlsZFRhc2tJZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zKSB7XG4gICAgICAgICAgICBjb21waWxlT3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zID0gdGhpcy5vcHRpb25zLnN1YlRhc2tQbGF0Zm9ybXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdWJUYXNrQnVpbGRPdXRwdXRzKSB7XG4gICAgICAgICAgICBjb21waWxlT3B0aW9ucy5zdWJUYXNrQnVpbGRPdXRwdXRzID0gdGhpcy5vcHRpb25zLnN1YlRhc2tCdWlsZE91dHB1dHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBpbGVPcHRpb25zO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlQnVpbGRTdGFnZVRhc2soc3RhZ2VzOiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBzdGFnZVdlaWdodCA9IDEgLSB0aGlzLm1haW5UYXNrV2VpZ2h0O1xuICAgICAgICBjb25zdCBzdGFnZVBsYXRmb3JtcyA9IHRoaXMuZ2V0U3RhZ2VQbGF0Zm9ybXMoKTtcbiAgICAgICAgaWYgKHN0YWdlUGxhdGZvcm1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuaXRTdGFnZVdlaWdodCA9IHN0YWdlV2VpZ2h0IC8gKHN0YWdlcy5sZW5ndGggKiBzdGFnZVBsYXRmb3Jtcy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCB0YXNrTmFtZSBvZiBzdGFnZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN0YWdlUGxhdGZvcm0gb2Ygc3RhZ2VQbGF0Zm9ybXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5TdGFnZUZvclBsYXRmb3JtKHRhc2tOYW1lLCBzdGFnZVBsYXRmb3JtLCB1bml0U3RhZ2VXZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgdGFza05hbWUgb2Ygc3RhZ2VzKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFnZUNvbmZpZyA9IHBsdWdpbk1hbmFnZXIuZ2V0QnVpbGRTdGFnZVdpdGhIb29rVGFza3ModGhpcy5vcHRpb25zLnBsYXRmb3JtLCB0YXNrTmFtZSk7XG4gICAgICAgICAgICBpZiAoIXN0YWdlQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKGBObyBzdGFnZSB0YXNrOiAke3Rhc2tOYW1lfSBpbiBwbGF0Zm9ybSAke3RoaXMub3B0aW9ucy5wbGF0Zm9ybX0sIHBsZWFzZSBjaGVjayB5b3VyIGJ1aWxkIG9wdGlvbnNgLCBzdGFnZVdlaWdodCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBIQUNLIOebruWJjeWOn+eUn+W5s+WPsOmSqeWtkOWHveaVsOS/ruaUueS6hiByZXN1bHQucGF0aHMuZGlyIOWboOiAjOaehOW7uui3r+W+hOmcgOimgeiHquihjOmHjeaWsOaLvOaOpVxuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGdldEJ1aWxkUGF0aCh0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgYnVpbGRTdGFnZVRhc2sgPSBuZXcgQnVpbGRTdGFnZVRhc2sodGhpcy5pZCwge1xuICAgICAgICAgICAgICAgIC4uLnN0YWdlQ29uZmlnLFxuICAgICAgICAgICAgICAgIGhvb2tzSW5mbzogdGhpcy5ob29rc0luZm8sXG4gICAgICAgICAgICAgICAgcm9vdCxcbiAgICAgICAgICAgICAgICBidWlsZFRhc2tPcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NIZWFydGJlYXQ6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBidWlsZFN0YWdlVGFzay5idWlsZEV4aXRSZXMuY3VzdG9tID0ge1xuICAgICAgICAgICAgICAgIC4uLnRoaXMuYnVpbGRFeGl0UmVzLmN1c3RvbSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGFnZVRhc2sgPSBidWlsZFN0YWdlVGFzaztcbiAgICAgICAgICAgIGJ1aWxkU3RhZ2VUYXNrLm9uKCd1cGRhdGUnLCAobWVzc2FnZTogc3RyaW5nLCBpbmNyZW1lbnQ6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcyhtZXNzYWdlLCBpbmNyZW1lbnQgKiBzdGFnZVdlaWdodCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGF3YWl0IGJ1aWxkU3RhZ2VUYXNrLnJ1bigpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9uRXJyb3IodGhpcy5lcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChidWlsZFN0YWdlVGFzay5lcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IgPSBidWlsZFN0YWdlVGFzay5lcnJvcjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20gPSB7XG4gICAgICAgICAgICAgICAgLi4udGhpcy5idWlsZEV4aXRSZXMuY3VzdG9tLFxuICAgICAgICAgICAgICAgIC4uLmJ1aWxkU3RhZ2VUYXNrLmJ1aWxkRXhpdFJlcy5jdXN0b20sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRTdGFnZVBsYXRmb3JtcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybTogU3RyaW5nKHRoaXMub3B0aW9ucy5wbGF0Zm9ybSksXG4gICAgICAgICAgICAgICAgcm9vdDogZ2V0QnVpbGRQYXRoKHRoaXMub3B0aW9ucyksXG4gICAgICAgICAgICAgICAgYnVpbGRUYXNrT3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgIGhvb2tzSW5mbzogdGhpcy5ob29rc0luZm8sXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLi4uKHRoaXMub3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zIHx8IFtdKS5tYXAoKHBsYXRmb3JtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5vcHRpb25zLnN1YlRhc2tCdWlsZE91dHB1dHM/LltwbGF0Zm9ybV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICAgICAgICAgIHJvb3Q6IG91dHB1dD8uZGVzdCB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRUYXNrT3B0aW9uczogdGhpcy5jcmVhdGVDaGlsZFN0YWdlT3B0aW9ucyhwbGF0Zm9ybSwgb3V0cHV0KSxcbiAgICAgICAgICAgICAgICAgICAgaG9va3NJbmZvOiBwbHVnaW5NYW5hZ2VyLmdldEhvb2tzSW5mbyhwbGF0Zm9ybSksXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVDaGlsZFN0YWdlT3B0aW9ucyhwbGF0Zm9ybTogc3RyaW5nLCBvdXRwdXQ/OiBJU3ViVGFza0J1aWxkT3V0cHV0KTogSUludGVybmFsQnVpbGRPcHRpb25zIHtcbiAgICAgICAgaWYgKHRoaXMuc3ViVGFza0J1aWxkT3B0aW9uc1twbGF0Zm9ybV0pIHtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMuc3ViVGFza0J1aWxkT3B0aW9uc1twbGF0Zm9ybV0pKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcHRpb25zID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLm9wdGlvbnMpKTtcbiAgICAgICAgb3B0aW9ucy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgICAgICBvcHRpb25zLm91dHB1dE5hbWUgPSBvdXRwdXQ/Lm91dHB1dE5hbWUgfHwgcGxhdGZvcm07XG4gICAgICAgIG9wdGlvbnMuYnVpbGRQYXRoID0gb3V0cHV0Py5idWlsZFBhdGggfHwgdGhpcy5yZXN1bHQucGF0aHMuZGlyO1xuICAgICAgICBvcHRpb25zLnRhc2tJZCA9IG91dHB1dD8udGFza0lkIHx8IGAke3RoaXMub3B0aW9ucy50YXNrSWR9OiR7cGxhdGZvcm19YDtcbiAgICAgICAgb3B0aW9ucy5wYXJlbnRUYXNrSWQgPSB0aGlzLm9wdGlvbnMudGFza0lkO1xuICAgICAgICBvcHRpb25zLnN1YlRhc2tQbGF0Zm9ybXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIG9wdGlvbnMuc3ViVGFza0J1aWxkT3V0cHV0cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgb3B0aW9ucy5jaGlsZFRhc2tJZHMgPSB1bmRlZmluZWQ7XG4gICAgICAgIG9wdGlvbnMubmV4dFN0YWdlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgb3B0aW9ucy5idWlsZFN0YWdlR3JvdXAgPSB1bmRlZmluZWQ7XG4gICAgICAgIG9wdGlvbnMucGFja2FnZXMgPSB7XG4gICAgICAgICAgICBbcGxhdGZvcm1dOiB0aGlzLm9wdGlvbnMucGFja2FnZXM/LltwbGF0Zm9ybV0gfHwge30sXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcnVuU3RhZ2VGb3JQbGF0Zm9ybSh0YXNrTmFtZTogc3RyaW5nLCBzdGFnZVBsYXRmb3JtOiB7XG4gICAgICAgIHBsYXRmb3JtOiBzdHJpbmc7XG4gICAgICAgIHJvb3Q6IHN0cmluZztcbiAgICAgICAgYnVpbGRUYXNrT3B0aW9uczogSUludGVybmFsQnVpbGRPcHRpb25zO1xuICAgICAgICBob29rc0luZm86IElCdWlsZEhvb2tzSW5mbztcbiAgICAgICAgcmVxdWlyZWQ6IGJvb2xlYW47XG4gICAgfSwgc3RhZ2VXZWlnaHQ6IG51bWJlcikge1xuICAgICAgICBjb25zdCBzdGFnZUNvbmZpZyA9IHBsdWdpbk1hbmFnZXIuZ2V0QnVpbGRTdGFnZVdpdGhIb29rVGFza3Moc3RhZ2VQbGF0Zm9ybS5wbGF0Zm9ybSwgdGFza05hbWUpO1xuICAgICAgICBpZiAoIXN0YWdlQ29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYE5vIHN0YWdlIHRhc2s6ICR7dGFza05hbWV9IGluIHBsYXRmb3JtICR7c3RhZ2VQbGF0Zm9ybS5wbGF0Zm9ybX0sIHNraXBgLCAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0YWdlUGxhdGZvcm0ucm9vdCkge1xuICAgICAgICAgICAgdGhpcy5lcnJvciA9IG5ldyBFcnJvcihgTWlzc2luZyBidWlsZCBvdXRwdXQgZm9yIHN0YWdlIHBsYXRmb3JtICR7c3RhZ2VQbGF0Zm9ybS5wbGF0Zm9ybX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBidWlsZFN0YWdlVGFzayA9IG5ldyBCdWlsZFN0YWdlVGFzayh0aGlzLmlkLCB7XG4gICAgICAgICAgICAuLi5zdGFnZUNvbmZpZyxcbiAgICAgICAgICAgIGhvb2tzSW5mbzogc3RhZ2VQbGF0Zm9ybS5ob29rc0luZm8sXG4gICAgICAgICAgICByb290OiBzdGFnZVBsYXRmb3JtLnJvb3QsXG4gICAgICAgICAgICBidWlsZFRhc2tPcHRpb25zOiBzdGFnZVBsYXRmb3JtLmJ1aWxkVGFza09wdGlvbnMsXG4gICAgICAgICAgICBwcm9ncmVzc0hlYXJ0YmVhdDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBidWlsZFN0YWdlVGFzay5idWlsZEV4aXRSZXMuY3VzdG9tID0ge1xuICAgICAgICAgICAgLi4udGhpcy5idWlsZEV4aXRSZXMuY3VzdG9tLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmN1cnJlbnRTdGFnZVRhc2sgPSBidWlsZFN0YWdlVGFzaztcbiAgICAgICAgYnVpbGRTdGFnZVRhc2sub24oJ3VwZGF0ZScsIChtZXNzYWdlOiBzdHJpbmcsIGluY3JlbWVudDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYFske3N0YWdlUGxhdGZvcm0ucGxhdGZvcm19XSAke21lc3NhZ2V9YCwgaW5jcmVtZW50ICogc3RhZ2VXZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgYnVpbGRTdGFnZVRhc2sucnVuKCk7XG4gICAgICAgIGlmICh0aGlzLmVycm9yKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLm9uRXJyb3IodGhpcy5lcnJvcik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSBpZiAoYnVpbGRTdGFnZVRhc2suZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3IgPSBidWlsZFN0YWdlVGFzay5lcnJvcjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20gPSB7XG4gICAgICAgICAgICAuLi50aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20sXG4gICAgICAgICAgICAuLi5idWlsZFN0YWdlVGFzay5idWlsZEV4aXRSZXMuY3VzdG9tLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaW5pdEJ1bmRsZU1hbmFnZXIoKSB7XG4gICAgICAgIC8vIFRPRE8g5omA5pyJ57G75Ly855qE5paw5rWB56iL77yM6YO95bqU6K+l6LWw57uf5LiA55qEIHJ1bkJ1aWxkVGFzayDlpITnkIbvvIzlkKbliJnlj6/og73ml6Dms5XkuK3mlq1cbiAgICAgICAgaWYgKHRoaXMuZXJyb3IpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub25FcnJvcih0aGlzLmVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJ1bmRsZU1hbmFnZXIgPSBhd2FpdCBCdW5kbGVNYW5hZ2VyLmNyZWF0ZSh0aGlzLm9wdGlvbnMsIHRoaXMpO1xuICAgICAgICB0aGlzLmJ1bmRsZU1hbmFnZXIub3B0aW9ucy5kZXN0ID0gdGhpcy5yZXN1bHQucGF0aHMuYXNzZXRzO1xuICAgICAgICB0aGlzLmJ1bmRsZU1hbmFnZXIuZGVzdERpciA9IHRoaXMucmVzdWx0LnBhdGhzLmFzc2V0cztcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcmV2aWV3KSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmJ1bmRsZU1hbmFnZXIuaW5pdE9wdGlvbnMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYnVuZGxlTWFuYWdlci51cGRhdGVQcm9jZXNzID0gKG1lc3NhZ2U6IHN0cmluZywgcHJvZ3Jlc3M6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcyhtZXNzYWdlLCBwcm9ncmVzcyAtIHRoaXMuYnVuZGxlTWFuYWdlci5wcm9ncmVzcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuYnVuZGxlTWFuYWdlci5ydW5QbHVnaW5UYXNrKHRoaXMuYnVuZGxlTWFuYWdlci5ob29rTWFwLm9uQmVmb3JlQnVuZGxlSW5pdCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYnVuZGxlTWFuYWdlci5pbml0QnVuZGxlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYnVuZGxlTWFuYWdlci5ydW5QbHVnaW5UYXNrKHRoaXMuYnVuZGxlTWFuYWdlci5ob29rTWFwLm9uQWZ0ZXJCdW5kbGVJbml0KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBicmVhayhyZWFzb246IHN0cmluZykge1xuICAgICAgICB3b3JrZXJNYW5hZ2VyLmtpbGxSdW5uaW5nQ2hpbGRzKCk7XG4gICAgICAgIHRoaXMudW5Mb2NrQXNzZXREQigpO1xuICAgICAgICB0aGlzLmJ1bmRsZU1hbmFnZXIgJiYgdGhpcy5idW5kbGVNYW5hZ2VyLmJyZWFrKHJlYXNvbik7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGFnZVRhc2spIHtcbiAgICAgICAgICAgIC8vIOi/memHjOS4jemcgOimgeetieW+he+8jGJyZWFrIOinpuWPkeS4gOS4i+WNs+WPr++8jOWQjue7reacieaKm+W8guW4uOS8muiiq+ato+W4uOaNleiOt1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhZ2VUYXNrLmJyZWFrKHJlYXNvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1YlRhc2spIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YlRhc2suYnJlYWsocmVhc29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub25FcnJvcihuZXcgRXJyb3IoYEJ1aWxkIHRhc2sgJHt0aGlzLm9wdGlvbnMudGFza05hbWUgfHwgdGhpcy5vcHRpb25zLm91dHB1dE5hbWV9IGlzIGJyZWFrIWApLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGxvY2tBc3NldERCKCkge1xuICAgICAgICAvLyBUT0RPIOaJgOacieexu+S8vOeahOaWsOa1geeoi++8jOmDveW6lOivpei1sOe7n+S4gOeahCBydW5CdWlsZFRhc2sg5aSE55CG77yM5ZCm5YiZ5Y+v6IO95peg5rOV5Lit5patXG4gICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcygnU3RhcnQgbG9jayBhc3NldCBkYi4uLicpO1xuICAgICAgICBhd2FpdCBhc3NldERCTWFuYWdlci5wYXVzZSgnYnVpbGQnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdW5Mb2NrQXNzZXREQigpIHtcbiAgICAgICAgYXNzZXREQk1hbmFnZXIucmVzdW1lKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6aKE6KeIIHNldHRpbmdzIOS/oeaBr1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBnZXRQcmV2aWV3U2V0dGluZ3MoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRoaXMucmVzdWx0LnNldHRpbmdzLmVuZ2luZS5lbmdpbmVNb2R1bGVzID0gdGhpcy5vcHRpb25zLmluY2x1ZGVNb2R1bGVzO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0QnVuZGxlTWFuYWdlcigpO1xuICAgICAgICAgICAgLy8g5byA5aeL5omn6KGM6aKE5Yi25Lu75YqhXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bkJ1aWxkVGFzayhUYXNrTWFuYWdlci5nZXRCdWlsZFRhc2soJ2RhdGFUYXNrcycpLCB0aGlzLnRhc2tNYW5hZ2VyLnRhc2tXZWlnaHQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5CdWlsZFRhc2soVGFza01hbmFnZXIuZ2V0QnVpbGRUYXNrKCdzZXR0aW5nVGFza3MnKSwgdGhpcy50YXNrTWFuYWdlci50YXNrV2VpZ2h0KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc3VsdC5zZXR0aW5ncztcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc3RvcFByb2dyZXNzSGVhcnRiZWF0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGluaXRPcHRpb25zKCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucGxhdGZvcm1UeXBlID0gcGx1Z2luTWFuYWdlci5wbGF0Zm9ybUNvbmZpZ1t0aGlzLm9wdGlvbnMucGxhdGZvcm1dLnBsYXRmb3JtVHlwZTtcbiAgICAgICAgY29uc3QgZGVmYXVsdE1kNUNhY2hlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGV4Y2x1ZGVzOiBbXSxcbiAgICAgICAgICAgIGluY2x1ZGVzOiBbXSxcbiAgICAgICAgICAgIHJlcGxhY2VPbmx5OiBbXSxcbiAgICAgICAgICAgIGhhbmRsZVRlbXBsYXRlTWQ1TGluazogZmFsc2UsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRNZDVDYWNoZU9wdGlvbnMsIHRoaXMub3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMgfHwge30pO1xuICAgICAgICBhd2FpdCBjaGVja1Byb2plY3RTZXR0aW5nKHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgLy8gVE9ETyDmlK/mjIHkvKDlj4Lnm7TmjqXkvKDpgJIgcmVzb2x1dGlvblxuICAgICAgICB0aGlzLm9wdGlvbnMucmVzb2x1dGlvbiA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLm9wdGlvbnMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5vcHRpb25zLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0LFxuICAgICAgICAgICAgcG9saWN5OiBSZXNvbHV0aW9uUG9saWN5LlNIT1dfQUxMLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc29sdXRpb24gPSB0aGlzLm9wdGlvbnMucmVzb2x1dGlvbjtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZXNpZ25SZXNvbHV0aW9uLmZpdEhlaWdodCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZXNpZ25SZXNvbHV0aW9uLmZpdFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbi5wb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlNIT1dfQUxMO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLnBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuRklYRURfSEVJR0hUO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZXNpZ25SZXNvbHV0aW9uLmZpdFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbi5wb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LkZJWEVEX1dJRFRIO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLnBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuTk9fQk9SREVSO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG6Ieq5a6a5LmJ566h57q/55qE55u45YWz6YC76L6R77yM6aG555uu6K6+572u5Lqk5LqS5bey5aSE55CG6L+H55qE5Li76KaB5piv5Li65LqG5Zy65pmv546v5aKD77yM5p6E5bu66ZyA6KaB5YaN5qyh56Gu6K6k77yM6YG/5YWN5qih5Z2X5pyJ5Ye65YWlXG4gICAgICAgIGNvbnN0IENVU1RPTV9QSVBFTElORV9OQU1FID0gdGhpcy5vcHRpb25zLm1hY3JvQ29uZmlnLkNVU1RPTV9QSVBFTElORV9OQU1FO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmN1c3RvbVBpcGVsaW5lKSB7XG4gICAgICAgICAgICBjb25zdCBsZWdhY3lQaXBlbGluZUluZGV4ID0gdGhpcy5vcHRpb25zLmluY2x1ZGVNb2R1bGVzLmZpbmRJbmRleCgobW9kdWxlOiBzdHJpbmcpID0+IG1vZHVsZSA9PT0gJ2xlZ2FjeS1waXBlbGluZScpO1xuICAgICAgICAgICAgaWYgKGxlZ2FjeVBpcGVsaW5lSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmluY2x1ZGVNb2R1bGVzLnNwbGljZShsZWdhY3lQaXBlbGluZUluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICF0aGlzLm9wdGlvbnMuaW5jbHVkZU1vZHVsZXMuaW5jbHVkZXMoJ2N1c3RvbS1waXBlbGluZScpICYmIHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5wdXNoKCdjdXN0b20tcGlwZWxpbmUnKTtcbiAgICAgICAgICAgIC8vIOS9v+eUqOS6huWGhee9rueuoee6v+eahOaDheWGteS4iywg5re75YqgIGN1c3RvbS1waXBlbGluZS1idWlsdGluLXNjcmlwdHMg5qih5Z2X5pa56IO95omT5YyF5a+55bqU55qE6ISa5pysXG4gICAgICAgICAgICBpZiAoQ1VTVE9NX1BJUEVMSU5FX05BTUUgPT09ICdCdWlsdGluJyB8fCAhQ1VTVE9NX1BJUEVMSU5FX05BTUUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygnY3VzdG9tLXBpcGVsaW5lLWJ1aWx0aW4tc2NyaXB0cycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5wdXNoKCdjdXN0b20tcGlwZWxpbmUtYnVpbHRpbi1zY3JpcHRzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tUGlwZWxpbmVJbmRleCA9IHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5maW5kSW5kZXgoKG1vZHVsZTogc3RyaW5nKSA9PiBtb2R1bGUgPT09ICdjdXN0b20tcGlwZWxpbmUnKTtcbiAgICAgICAgICAgIGlmIChjdXN0b21QaXBlbGluZUluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5zcGxpY2UoY3VzdG9tUGlwZWxpbmVJbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAhdGhpcy5vcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdsZWdhY3ktcGlwZWxpbmUnKSAmJiB0aGlzLm9wdGlvbnMuaW5jbHVkZU1vZHVsZXMucHVzaCgnbGVnYWN5LXBpcGVsaW5lJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcmV2aWV3KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zLmFwcFRlbXBsYXRlRGF0YSA9IHtcbiAgICAgICAgICAgIGRlYnVnTW9kZTogdGhpcy5vcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgcmVuZGVyTW9kZTogZmFsc2UsIC8vICEhb3B0aW9ucy5yZW5kZXJNb2RlLFxuICAgICAgICAgICAgc2hvd0ZQUzogdGhpcy5vcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgcmVzb2x1dGlvbixcbiAgICAgICAgICAgIG1kNUNhY2hlOiB0aGlzLm9wdGlvbnMubWQ1Q2FjaGUsXG4gICAgICAgICAgICBjb2Nvc1RlbXBsYXRlOiAnJyxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmJ1aWxkRW5naW5lUGFyYW0gPSB7XG4gICAgICAgICAgICBlbnRyeTogdGhpcy5vcHRpb25zLmVuZ2luZUluZm8udHlwZXNjcmlwdC5wYXRoLFxuICAgICAgICAgICAgZGVidWc6IHRoaXMub3B0aW9ucy5kZWJ1ZyxcbiAgICAgICAgICAgIG1hbmdsZVByb3BlcnRpZXM6IHRoaXMub3B0aW9ucy5tYW5nbGVQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgaW5saW5lRW51bTogdGhpcy5vcHRpb25zLmlubGluZUVudW0sXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiB0aGlzLm9wdGlvbnMuc291cmNlTWFwcyxcbiAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzOiB0aGlzLm9wdGlvbnMuaW5jbHVkZU1vZHVsZXMsXG4gICAgICAgICAgICBlbmdpbmVWZXJzaW9uOiB0aGlzLm9wdGlvbnMuZW5naW5lSW5mby52ZXJzaW9uLFxuICAgICAgICAgICAgLy8g5Y+C5LiO5b2x5ZON5byV5pOO5aSN55So6KeE5YiZ55qE5Y+C5pWwIGtleVxuICAgICAgICAgICAgbWQ1TWFwOiBbXSxcbiAgICAgICAgICAgIGVuZ2luZU5hbWU6ICdjb2Nvcy1qcycsXG4gICAgICAgICAgICBvdXRwdXQ6IGpvaW4odGhpcy5yZXN1bHQucGF0aHMuZGlyLCAnY29jb3MtanMnKSxcbiAgICAgICAgICAgIHBsYXRmb3JtVHlwZTogdGhpcy5vcHRpb25zLnBsYXRmb3JtVHlwZSxcbiAgICAgICAgICAgIHVzZUNhY2hlOiB0aGlzLm9wdGlvbnMudXNlQ2FjaGVDb25maWc/LmVuZ2luZSA9PT0gZmFsc2UgPyBmYWxzZSA6IHRydWUsXG4gICAgICAgICAgICBuYXRpdmVDb2RlQnVuZGxlTW9kZTogdGhpcy5vcHRpb25zLm5hdGl2ZUNvZGVCdW5kbGVNb2RlLFxuICAgICAgICAgICAgd2FzbUNvbXByZXNzaW9uTW9kZTogdGhpcy5vcHRpb25zLndhc21Db21wcmVzc2lvbk1vZGUsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0gPSB7XG4gICAgICAgICAgICBleHBlcmltZW50YWxFcmFzZU1vZHVsZXM6IHRoaXMub3B0aW9ucy5leHBlcmltZW50YWxFcmFzZU1vZHVsZXMsXG4gICAgICAgICAgICBvdXRwdXROYW1lOiAncHJvamVjdCcsXG4gICAgICAgICAgICBmbGFnczoge1xuICAgICAgICAgICAgICAgIERFQlVHOiAhIXRoaXMub3B0aW9ucy5kZWJ1ZyxcbiAgICAgICAgICAgICAgICAuLi50aGlzLm9wdGlvbnMuZmxhZ3MsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9seWZpbGxzOiB0aGlzLm9wdGlvbnMucG9seWZpbGxzLFxuICAgICAgICAgICAgaG90TW9kdWxlUmVsb2FkOiBmYWxzZSxcbiAgICAgICAgICAgIHBsYXRmb3JtOiB0aGlzLm9wdGlvbnMucGxhdGZvcm1UeXBlLFxuICAgICAgICAgICAgY29tbW9uRGlyOiAnJyxcbiAgICAgICAgICAgIGJ1bmRsZUNvbW1vbkNodW5rOiB0aGlzLm9wdGlvbnMuYnVuZGxlQ29tbW9uQ2h1bmsgPz8gZmFsc2UsXG4gICAgICAgICAgICB0YXJnZXRzOiB0aGlzLm9wdGlvbnMuYnVpbGRTY3JpcHRUYXJnZXRzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucG9seWZpbGxzKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9seWZpbGxzLnRhcmdldHMgPSB0aGlzLm9wdGlvbnMuYnVpbGRTY3JpcHRUYXJnZXRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvbHlmaWxscyA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXRzOiB0aGlzLm9wdGlvbnMuYnVpbGRTY3JpcHRUYXJnZXRzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucy5hc3NldFNlcmlhbGl6ZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICAnY2MuRWZmZWN0QXNzZXQnOiB7XG4gICAgICAgICAgICAgICAgZ2xzbDE6IHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygnZ2Z4LXdlYmdsJyksXG4gICAgICAgICAgICAgICAgZ2xzbDM6IHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygnZ2Z4LXdlYmdsMicpLFxuICAgICAgICAgICAgICAgIGdsc2w0OiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5idWlsZEV4aXRSZXMuZGVzdCA9IHRoaXMucmVzdWx0LnBhdGhzLmRpcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmiafooYzmn5DkuKrku7vliqHliJfooahcbiAgICAgKiBAcGFyYW0gYnVpbGRUYXNrcyDku7vliqHliJfooajmlbDnu4RcbiAgICAgKiBAcGFyYW0gd2VpZ2h0IOWFqOmDqOS7u+WKoeWIl+ihqOaJgOWNoOadg+mHjVxuICAgICAqIEBwYXJhbSBhcmdzIOmcgOimgeS8oOmAkue7meS7u+WKoeeahOWFtuS7luWPguaVsFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcnVuQnVpbGRUYXNrKGJ1aWxkVGFza3M6IElCdWlsZFRhc2tbXSwgd2VpZ2h0OiBudW1iZXIsIC4uLmFyZ3M6IGFueSkge1xuICAgICAgICB3ZWlnaHQgPSB0aGlzLm1haW5UYXNrV2VpZ2h0ICogd2VpZ2h0IC8gYnVpbGRUYXNrcy5sZW5ndGg7XG4gICAgICAgIC8vIOW8gOWni+aJp+ihjOmihOWItuS7u+WKoVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1aWxkVGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKHRoaXMuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHRhc2sgPSBidWlsZFRhc2tzW2ldO1xuICAgICAgICAgICAgY29uc3QgdGFza1RpdGxlID0gYXdhaXQgdHJhbnNUaXRsZSh0YXNrLnRpdGxlKTtcbiAgICAgICAgICAgIGNvbnN0IHRyaWNrVGltZUxhYmVsID0gYC8vIC0tLS0gYnVpbGQgdGFzayAke3Rhc2tUaXRsZX0gLS0tLWA7XG4gICAgICAgICAgICBuZXdDb25zb2xlLnRyYWNrVGltZVN0YXJ0KHRyaWNrVGltZUxhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRQcm9ncmVzc1N0ZXAodGFza1RpdGxlICsgJyBzdGFydCcsIHdlaWdodCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKHRyaWNrVGltZUxhYmVsKTtcbiAgICAgICAgICAgIG5ld0NvbnNvbGUudHJhY2tNZW1vcnlTdGFydCh0YXNrVGl0bGUpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0YXNrLmhhbmRsZS5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucywgdGhpcy5yZXN1bHQsIHRoaXMuY2FjaGUsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICB0YXNrLm5hbWUgJiYgcmVzdWx0ICYmICh0aGlzLnRhc2tSZXNNYXBbdGFzay5uYW1lXSA9IHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGltZSA9IGF3YWl0IG5ld0NvbnNvbGUudHJhY2tUaW1lRW5kKHRyaWNrVGltZUxhYmVsLCB7IG91dHB1dDogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYHJ1biBidWlsZCB0YXNrICR7dGFza1RpdGxlfSBzdWNjZXNzIGluICR7Zm9ybWF0TVNUaW1lKHRpbWUpfeKImmAsIHdlaWdodCwgJ2xvZycpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUudHJhY2tNZW1vcnlFbmQodGFza1RpdGxlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYHJ1biBidWlsZCB0YXNrICR7dGFza1RpdGxlfSBmYWlsZWQhYCwgd2VpZ2h0LCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9uRXJyb3IoZXJyb3IsIHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0NvbnNvbGUudHJhY2tNZW1vcnlFbmQodGFza1RpdGxlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZUhvb2soZnVuYzogRnVuY3Rpb24sIGludGVybmFsOiBib29sZWFuLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBpZiAoaW50ZXJuYWwpIHtcbiAgICAgICAgICAgIGF3YWl0IGZ1bmMuY2FsbCh0aGlzLCB0aGlzLm9wdGlvbnMsIHRoaXMucmVzdWx0LCB0aGlzLmNhY2hlLCAuLi5hcmdzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IGZ1bmModGhpcy5yZXN1bHQucmF3T3B0aW9ucywgdGhpcy5idWlsZFJlc3VsdCwgLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkVycm9yKGVycm9yOiBFcnJvciwgdGhyb3dFcnJvciA9IHRydWUpIHtcbiAgICAgICAgdGhpcy5lcnJvciA9IGVycm9yO1xuICAgICAgICB0aGlzLnN0b3BQcm9ncmVzc0hlYXJ0YmVhdCgpO1xuICAgICAgICB0aGlzLmJ1bmRsZU1hbmFnZXIgJiYgKHRoaXMuYnVuZGxlTWFuYWdlci5lcnJvciA9IGVycm9yKTtcbiAgICAgICAgaWYgKHRocm93RXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcnVuRXJyb3JIb29rKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZnVuY05hbWUgPSAnb25FcnJvcic7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBrZ05hbWUgb2YgdGhpcy5ob29rc0luZm8ucGtnTmFtZU9yZGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMuaG9va3NJbmZvLmluZm9zW3BrZ05hbWVdO1xuICAgICAgICAgICAgICAgIGxldCBob29rczogYW55O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVMYWJlbCA9IGAke3BrZ05hbWV9Oigke2Z1bmNOYW1lfSlgO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tzID0gVXRpbHMuRmlsZS5yZXF1aXJlRmlsZShpbmZvLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaG9va3NbZnVuY05hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYCR7dGltZUxhYmVsfSBzdGFydC4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgLy8gLS0tLSAke3BrZ05hbWV9Oigke2Z1bmNOYW1lfSkgLS0tLWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeVN0YXJ0KHRpbWVMYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5pbnRlcm5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGhvb2tzW2Z1bmNOYW1lXS5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucywgdGhpcy5yZXN1bHQsIHRoaXMuY2FjaGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaG9va3NbZnVuY05hbWVdKHRoaXMucmVzdWx0LnJhd09wdGlvbnMsIHRoaXMuYnVpbGRSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeUVuZCh0aW1lTGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgLy8gLS0tLSAke3BrZ05hbWV9Oigke2Z1bmNOYW1lfSkgc3VjY2VzcyAtLS0tYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYCR7cGtnTmFtZX06KCR7ZnVuY05hbWV9KWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdDb25zb2xlLnRyYWNrTWVtb3J5RW5kKHRpbWVMYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcigobmV3IEJ1aWxkRXJyb3IoYFJ1biBidWlsZCBwbHVnaW4gJHtwa2dOYW1lfTooJHtmdW5jTmFtZX0pIGZhaWxlZCFgKSkuc3RhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucG9zdEJ1aWxkKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiDnv7vor5EgdGl0bGVcbiAqIEBwYXJhbSB0aXRsZSDljp/lp4sgdGl0bGUg5oiW6ICF5bim5pyJIGkxOG4g5byA5aS055qEIHRpdGxlXG4gKi9cbmZ1bmN0aW9uIHRyYW5zVGl0bGUodGl0bGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHR5cGVvZiB0aXRsZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodGl0bGUuc3RhcnRzV2l0aCgnaTE4bjonKSkge1xuICAgICAgICB0aXRsZSA9IHRpdGxlLnJlcGxhY2UoJ2kxOG46JywgJycpO1xuICAgICAgICBjb25zdCByZXMgPSBpMThuLnQodGl0bGUgYXMgSTE4bktleXMpO1xuICAgICAgICBpZiAocmVzID09PSB0aXRsZSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgJHt0aXRsZX0gaXMgbm90IGRlZmluZWQgaW4gaTE4bmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMgfHwgdGl0bGU7XG4gICAgfVxuICAgIHJldHVybiB0aXRsZTtcbn1cblxuY2xhc3MgQnVpbGRFcnJvciB7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIGNvbnN0cnVjdG9yKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIEJ1aWxkRXJyb3IpO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG4gICAgfVxufVxuIl19