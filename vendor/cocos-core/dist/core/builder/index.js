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
exports.clearCache = void 0;
exports.init = init;
exports.createBuildTask = createBuildTask;
exports.build = build;
exports.createBundleBuildTask = createBundleBuildTask;
exports.buildBundleOnly = buildBundleOnly;
exports.createBuildStageTask = createBuildStageTask;
exports.executeBuildStageTask = executeBuildStageTask;
exports.getPreviewSettings = getPreviewSettings;
exports.queryBuildConfig = queryBuildConfig;
exports.queryBundleConfig = queryBundleConfig;
exports.queryTextureCompressConfig = queryTextureCompressConfig;
exports.queryPlatformConfig = queryPlatformConfig;
exports.getPlatformBuildSchema = getPlatformBuildSchema;
exports.refreshDisplayI18nFields = refreshDisplayI18nFields;
exports.createBuildTemplate = createBuildTemplate;
exports.checkBuildOption = checkBuildOption;
exports.checkBuildOptions = checkBuildOptions;
exports.queryAssetsInBundle = queryAssetsInBundle;
exports.getRegisteredPlatforms = getRegisteredPlatforms;
exports.queryDefaultBuildConfigByPlatform = queryDefaultBuildConfigByPlatform;
const fs_extra_1 = require("fs-extra");
const i18n_1 = __importDefault(require("../base/i18n"));
const plugin_1 = require("./manager/plugin");
const utils_1 = require("./share/utils");
const console_1 = require("../base/console");
const path_1 = require("path");
const asset_1 = __importDefault(require("../assets/manager/asset"));
const utils_2 = require("./worker/builder/utils");
const builder_config_1 = __importDefault(require("./share/builder-config"));
const utils_3 = __importDefault(require("../base/utils"));
const core_1 = require("../../server/middleware/core");
const build_middleware_1 = __importDefault(require("./build.middleware"));
const global_1 = require("./share/global");
var cache_1 = require("./cache");
Object.defineProperty(exports, "clearCache", { enumerable: true, get: function () { return cache_1.clearCache; } });
async function init(platform) {
    await builder_config_1.default.init();
    await plugin_1.pluginManager.init();
    core_1.middlewareService.register('Build', build_middleware_1.default);
    if (platform?.length) {
        for (const platformName of platform) {
            await plugin_1.pluginManager.register(platformName);
        }
    }
    else {
        await plugin_1.pluginManager.registerAllPlatform();
    }
}
function getBuilderLogRoot() {
    const projectTempDir = builder_config_1.default.projectTempDir;
    return (0, path_1.basename)(projectTempDir) === 'builder' ? projectTempDir : (0, path_1.join)(projectTempDir, 'builder');
}
// Log filename: {platform}-{action}-{timestamp}.log
// e.g. google-play-build-1234567890.log, google-play-make-1234567890.log, google-play-bundle-build-1234567890.log
function normalizeBuildLogDest(logDest, taskName, platform) {
    const sanitize = (s) => s.replace(/[\\/:*?"<>|]/g, '_');
    const sanitizedTask = sanitize(taskName);
    const sanitizedPlatform = platform ? sanitize(platform) : undefined;
    const label = platform === taskName ? 'build' : sanitizedTask;
    const parts = sanitizedPlatform ? [sanitizedPlatform, label, `${Date.now()}`] : [sanitizedTask, `${Date.now()}`];
    const fallback = (0, path_1.join)(getBuilderLogRoot(), 'log', `${parts.join('-')}.log`);
    let resolvedLogDest = logDest ? utils_3.default.Path.resolveToRaw(logDest) : fallback;
    if (!(0, path_1.isAbsolute)(resolvedLogDest)) {
        resolvedLogDest = (0, path_1.join)(builder_config_1.default.projectRoot, resolvedLogDest);
    }
    return (0, path_1.extname)(resolvedLogDest).toLowerCase() === '.log' ? resolvedLogDest : `${resolvedLogDest}.log`;
}
function ensureBuildLogSink(options, fallbackTaskName, logDest) {
    const taskName = options.taskName || fallbackTaskName;
    options.taskName = taskName;
    options.logDest = normalizeBuildLogDest(logDest || options.logDest, taskName, options.platform);
    console_1.newConsole.record(options.logDest);
    return options.logDest;
}
async function createBuildTask(platform, options) {
    if (!options) {
        options = await plugin_1.pluginManager.getOptionsByPlatform(platform);
    }
    options.platform = platform;
    options.taskId = options.taskId || String(new Date().getTime());
    options.taskName = options.taskName || platform;
    ensureBuildLogSink(options, platform);
    // 不支持的构建平台不执行构建
    if (!plugin_1.pluginManager.checkPlatform(platform)) {
        throw new Error(`Unsupported platform ${platform} for build command!`);
    }
    // @ts-ignore
    let realOptions = options;
    if (!options.skipCheck) {
        // 校验插件选项
        // @ts-ignore
        const rightOptions = await plugin_1.pluginManager.checkOptions(options);
        if (!rightOptions) {
            throw new Error(i18n_1.default.t('builder.error.check_options_failed'));
        }
        realOptions = rightOptions;
    }
    realOptions.logDest = options.logDest;
    const { BuildTask } = await Promise.resolve().then(() => __importStar(require('./worker/builder')));
    return new BuildTask(options.taskId, realOptions);
}
async function build(platform, options) {
    const startTime = Date.now();
    let buildSuccess = true;
    const restoreLogSink = console_1.newConsole.createLogSinkRestorer();
    // 显示构建开始信息
    try {
        const builder = await createBuildTask(platform, options);
        console_1.newConsole.buildStart(platform);
        // 监听构建进度
        builder.on('update', (message, progress) => {
            console_1.newConsole.progress(message, Math.round(progress * 100), 100);
        });
        await builder.run();
        buildSuccess = !builder.error;
        const duration = (0, utils_1.formatMSTime)(Date.now() - startTime);
        if (!buildSuccess) {
            restoreLogSink();
        }
        console_1.newConsole.buildComplete(platform, duration, buildSuccess);
        builder.buildExitRes.dest = utils_3.default.Path.resolveToUrl(builder.buildExitRes.dest, 'project');
        console.debug(JSON.stringify(builder.buildExitRes));
        return buildSuccess ? builder.buildExitRes : { code: 34 /* BuildExitCode.BUILD_FAILED */, reason: 'Build failed!' };
    }
    catch (error) {
        buildSuccess = false;
        const duration = (0, utils_1.formatMSTime)(Date.now() - startTime);
        console_1.newConsole.error(error);
        console_1.newConsole.buildComplete(platform, duration, false);
        // 如果错误对象包含 code 属性，使用该错误码（如 500）
        let errorCode = error?.code && typeof error.code === 'number' ? error.code : 34 /* BuildExitCode.BUILD_FAILED */;
        if (errorCode === 0 /* BuildExitCode.BUILD_SUCCESS */) {
            errorCode = 34 /* BuildExitCode.BUILD_FAILED */;
        }
        return { code: errorCode, reason: error?.message || String(error) };
    }
    finally {
        restoreLogSink();
    }
}
async function createBundleBuildTask(bundleOptions) {
    const { BundleManager } = await Promise.resolve().then(() => __importStar(require('./worker/builder/asset-handler/bundle')));
    const options = bundleOptions.buildTaskOptions;
    return await BundleManager.create(options);
}
async function buildBundleOnly(bundleOptions) {
    const startTime = Date.now();
    const options = bundleOptions.buildTaskOptions;
    const tasksLabel = bundleOptions.taskName || 'bundle-build';
    const taskStartTime = Date.now();
    const restoreLogSink = console_1.newConsole.createLogSinkRestorer();
    try {
        bundleOptions.logDest = ensureBuildLogSink({ platform: options.platform }, tasksLabel, bundleOptions.logDest);
        console_1.newConsole.stage('BUNDLE', `${tasksLabel} (${options.platform}) starting...`);
        console.debug('Start build task, options:', options);
        console_1.newConsole.trackMemoryStart(`builder:build-bundle-total`);
        const builder = await createBundleBuildTask(bundleOptions);
        builder.on('update', (message, progress) => {
            console_1.newConsole.progress(`${options.platform}: ${message}`, Math.round(progress * 100), 100);
        });
        await builder.run();
        console_1.newConsole.trackMemoryEnd(`builder:build-bundle-total`);
        const totalDuration = (0, utils_1.formatMSTime)(Date.now() - startTime);
        if (builder.error) {
            const errorMsg = typeof builder.error == 'object' ? (builder.error.stack || builder.error.message) : builder.error;
            console_1.newConsole.error(`${tasksLabel} (${options.platform}) failed: ${errorMsg}`);
            console_1.newConsole.taskComplete('Bundle Build', false, totalDuration);
            return { code: 34 /* BuildExitCode.BUILD_FAILED */, reason: errorMsg };
        }
        else {
            const duration = (0, utils_1.formatMSTime)(Date.now() - taskStartTime);
            console_1.newConsole.taskComplete('Bundle Build', true, totalDuration);
            console_1.newConsole.success(`${tasksLabel} (${options.platform}) completed in ${duration}`);
            return builder.buildExitRes;
        }
    }
    catch (error) {
        const errMsg = `${tasksLabel} (${options.platform}) error: ${String(error)}`;
        console_1.newConsole.error(errMsg);
        const totalDuration = (0, utils_1.formatMSTime)(Date.now() - startTime);
        console_1.newConsole.taskComplete('Bundle Build', false, totalDuration);
        return { code: 34 /* BuildExitCode.BUILD_FAILED */, reason: errMsg };
    }
    finally {
        restoreLogSink();
    }
}
async function createBuildStageTask(taskId, stageName, options) {
    return createBuildStageTaskWithBuildOptions(taskId, stageName, options, readBuildOptionsForBuildStage(options));
}
async function createBuildStageTaskWithBuildOptions(taskId, stageName, options, buildOptions) {
    options.dest = utils_3.default.Path.resolveToRaw(options.dest);
    const { BuildStageTask } = await Promise.resolve().then(() => __importStar(require('./worker/builder/stage-task-manager')));
    const stageConfig = plugin_1.pluginManager.getBuildStageWithHookTasks(options.platform, stageName) || {
        name: stageName,
        hook: stageName,
    };
    return new BuildStageTask(taskId, {
        hooksInfo: plugin_1.pluginManager.getHooksInfo(options.platform),
        root: options.dest,
        buildTaskOptions: buildOptions,
        ...stageConfig,
    });
}
function readBuildOptionsForBuildStage(options) {
    options.dest = utils_3.default.Path.resolveToRaw(options.dest); // 顺便补回这行
    let buildOptions;
    if (options.platform.startsWith('web')) {
        buildOptions = { platform: options.platform, packages: {} };
    }
    else {
        buildOptions = readBuildTaskOptions(options.dest);
        if (!buildOptions) {
            throw new Error('Build options is not exist!');
        }
    }
    mergeBuildStageRuntimeOptions(buildOptions, options);
    return buildOptions;
}
function mergeBuildStageRuntimeOptions(buildOptions, options) {
    buildOptions.platform = options.platform;
    buildOptions.dest = options.dest;
    if (options.logDest) {
        buildOptions.logDest = options.logDest;
    }
    if (!options.packages) {
        return;
    }
    buildOptions.packages = buildOptions.packages || {};
    for (const [platform, packageOptions] of Object.entries(options.packages)) {
        buildOptions.packages[platform] = {
            ...(buildOptions.packages[platform] || {}),
            ...packageOptions,
        };
    }
}
async function executeBuildStageTask(taskId, stageName, options, onProgress) {
    if (!options.taskName) {
        options.taskName = stageName;
    }
    const restoreLogSink = console_1.newConsole.createLogSinkRestorer();
    ensureBuildLogSink(options, options.taskName, options.logDest);
    try {
        options.dest = utils_3.default.Path.resolveToRaw(options.dest);
        const buildOptions = readBuildTaskOptions(options.dest);
        if (!buildOptions) {
            throw new Error('Build options is not exist!');
        }
        mergeBuildStageRuntimeOptions(buildOptions, options);
        let result;
        if (shouldCascadeBuildStage(options, buildOptions)) {
            result = await executeBuildStageTaskCascade(taskId, stageName, options, buildOptions, onProgress, restoreLogSink);
        }
        else {
            result = await executeSingleBuildStageTask(taskId, stageName, options, buildOptions, onProgress, restoreLogSink);
        }
        if (result.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
            restoreLogSink();
        }
        return result;
    }
    catch (error) {
        console.error(error);
        return { code: 34 /* BuildExitCode.BUILD_FAILED */, reason: error?.message || String(error) };
    }
    finally {
        restoreLogSink();
    }
}
function shouldCascadeBuildStage(options, buildOptions) {
    return String(options.platform) === String(buildOptions.platform)
        && !buildOptions.parentTaskId
        && !!buildOptions.subTaskPlatforms?.length;
}
async function executeBuildStageTaskCascade(taskId, stageName, options, parentBuildOptions, onProgress, restoreLogSink) {
    const targets = [{
            platform: String(options.platform),
            dest: options.dest,
            required: true,
        }, ...(parentBuildOptions.subTaskPlatforms || []).map((platform) => ({
            platform,
            dest: parentBuildOptions.subTaskBuildOutputs?.[platform]?.dest || '',
            required: false,
        }))];
    const stageResults = {};
    let parentResult;
    for (const target of targets) {
        if (!target.dest) {
            return failBuildStage(`Missing build output for stage platform ${target.platform}`);
        }
        const targetOptions = {
            ...options,
            platform: target.platform,
            dest: target.dest,
        };
        const buildOptions = readBuildTaskOptions(utils_3.default.Path.resolveToRaw(target.dest));
        if (!buildOptions) {
            return failBuildStage(`Build options is not exist for ${target.platform}!`);
        }
        mergeBuildStageRuntimeOptions(buildOptions, targetOptions);
        const result = await executeSingleBuildStageTask(taskId, stageName, targetOptions, buildOptions, onProgress, restoreLogSink);
        if (result.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
            return result;
        }
        stageResults[target.platform] = result.custom;
        if (target.required) {
            parentResult = result;
        }
    }
    if (!parentResult || parentResult.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
        return failBuildStage(`Build stage task ${stageName} did not run for ${options.platform}`);
    }
    parentResult.custom = {
        ...parentResult.custom,
        stageResults: {
            ...(parentResult.custom.stageResults || {}),
            [stageName]: stageResults,
        },
    };
    return parentResult;
}
function failBuildStage(reason) {
    console.error(reason);
    return {
        code: 34 /* BuildExitCode.BUILD_FAILED */,
        reason,
    };
}
async function executeSingleBuildStageTask(taskId, stageName, options, buildOptions, onProgress, restoreLogSink) {
    let buildStageTask;
    try {
        buildStageTask = await createBuildStageTaskWithBuildOptions(taskId, stageName, options, buildOptions);
        if (onProgress) {
            buildStageTask.on('update', onProgress);
        }
        const stageConfig = plugin_1.pluginManager.getBuildStageWithHookTasks(options.platform, stageName);
        const stageLabel = stageConfig?.name || stageName;
        console_1.newConsole.trackMemoryStart(`builder:build-stage-total ${stageName}`);
        const buildSuccess = await buildStageTask.run();
        console_1.newConsole.trackMemoryEnd(`builder:build-stage-total ${stageName}`);
        if (!buildStageTask.error) {
            console.log(`[task:${stageLabel}]: success!`);
        }
        else {
            console.error(`${stageLabel} package ${options.dest} failed!`);
            console.log(`[task:${stageLabel}]: failed!`);
        }
        buildStageTask.buildExitRes.dest = utils_3.default.Path.resolveToUrl(buildStageTask.buildExitRes.dest, 'project');
        console.log(JSON.stringify(buildStageTask.buildExitRes));
        return buildSuccess ? buildStageTask.buildExitRes : { code: 34 /* BuildExitCode.BUILD_FAILED */, reason: 'Build stage task failed!' };
    }
    catch (error) {
        console.error(error);
        return { code: 34 /* BuildExitCode.BUILD_FAILED */, reason: error?.message || String(error) };
    }
    finally {
        if (buildStageTask && onProgress) {
            buildStageTask.off('update', onProgress);
        }
        restoreLogSink?.();
    }
}
function readBuildTaskOptions(root) {
    const configFile = (0, path_1.join)(root, global_1.BuildGlobalInfo.buildOptionsFileName);
    return (0, fs_extra_1.readJSONSync)(configFile);
}
async function getPreviewSettings(options) {
    const temp = options || (await plugin_1.pluginManager.getOptionsByPlatform('web-desktop'));
    const buildOptions = JSON.parse(JSON.stringify(temp));
    buildOptions.preview = true;
    // TODO 预览 settings 的排队之类的
    const { BuildTask } = await Promise.resolve().then(() => __importStar(require('./worker/builder/index')));
    const buildTask = new BuildTask(buildOptions.taskId || 'v', buildOptions);
    const previewSettingsStart = Date.now();
    // 拿出 settings 信息
    const settings = await buildTask.getPreviewSettings();
    // 拼接脚本对应文件的 map
    const script2library = {};
    for (const uuid of buildTask.cache.scriptUuids) {
        const asset = asset_1.default.queryAsset(uuid);
        if (!asset) {
            console.error('unknown script uuid: ' + uuid);
            continue;
        }
        script2library[(0, utils_2.removeDbHeader)(asset.url).replace(/.ts$/, '.js')] = asset.library + '.js';
    }
    console.log(`Get settings.js in preview: ${Date.now() - previewSettingsStart}ms`);
    // 返回数据
    return {
        settings,
        script2library,
        bundleConfigs: buildTask.bundleManager.bundles.map((x) => x.config),
    };
}
function queryBuildConfig() {
    return builder_config_1.default.getProject();
}
function queryBundleConfig() {
    return plugin_1.pluginManager.queryBundleConfig();
}
function queryTextureCompressConfig() {
    return plugin_1.pluginManager.queryTextureCompressConfig();
}
function queryPlatformConfig() {
    return plugin_1.pluginManager.queryPlatformConfig();
}
function getPlatformBuildSchema(platform) {
    return plugin_1.pluginManager.getPlatformBuildSchema(platform);
}
function refreshDisplayI18nFields() {
    return plugin_1.pluginManager.refreshDisplayI18nFields();
}
async function createBuildTemplate(nameOrPlatform) {
    return plugin_1.pluginManager.createBuildTemplate(nameOrPlatform);
}
function checkBuildOption(platform, key, value, options) {
    return plugin_1.pluginManager.checkBuildOption(platform, key, value, options);
}
function checkBuildOptions(platform, options) {
    return plugin_1.pluginManager.checkBuildOptions(platform, options);
}
async function queryAssetsInBundle(uuid, bundleFilterConfig) {
    const { buildAssetLibrary } = await Promise.resolve().then(() => __importStar(require('./worker/builder/manager/asset-library')));
    return buildAssetLibrary.queryAssetsInBundle(uuid, bundleFilterConfig);
}
function getRegisteredPlatforms() {
    return plugin_1.pluginManager.getRegisteredPlatforms();
}
async function queryDefaultBuildConfigByPlatform(platform) {
    return (0, utils_1.cloneConfigValue)(await plugin_1.pluginManager.getOptionsByPlatform(platform));
}
