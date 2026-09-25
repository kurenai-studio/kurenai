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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxvQkFXQztBQStCRCwwQ0E2QkM7QUFFRCxzQkF1Q0M7QUFFRCxzREFJQztBQUVELDBDQXlDQztBQUVELG9EQUVDO0FBa0RELHNEQStCQztBQXVIRCxnREE2QkM7QUFFRCw0Q0FFQztBQUVELDhDQUVDO0FBRUQsZ0VBRUM7QUFFRCxrREFFQztBQUVELHdEQUVDO0FBRUQsNERBRUM7QUFFRCxrREFFQztBQUVELDRDQUVDO0FBRUQsOENBRUM7QUFFRCxrREFHQztBQUVELHdEQUVDO0FBRUQsOEVBRUM7QUE3Y0QsdUNBQXdDO0FBQ3hDLHdEQUFnQztBQUVoQyw2Q0FBaUQ7QUFDakQseUNBQStEO0FBQy9ELDZDQUE2QztBQUM3QywrQkFBMkQ7QUFDM0Qsb0VBQW1EO0FBQ25ELGtEQUF3RDtBQUN4RCw0RUFBbUQ7QUFFbkQsMERBQWtDO0FBQ2xDLHVEQUFpRTtBQUNqRSwwRUFBaUQ7QUFDakQsMkNBQWlEO0FBQ2pELGlDQUFxQztBQUE1QixtR0FBQSxVQUFVLE9BQUE7QUFHWixLQUFLLFVBQVUsSUFBSSxDQUFDLFFBQW1CO0lBQzFDLE1BQU0sd0JBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUMzQixNQUFNLHNCQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0Isd0JBQWlCLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSwwQkFBZSxDQUFDLENBQUM7SUFDckQsSUFBSSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFDbkIsS0FBSyxNQUFNLFlBQVksSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNsQyxNQUFNLHNCQUFhLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9DLENBQUM7SUFDTCxDQUFDO1NBQU0s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QUFLLFVBQVUsaUNBQWlDLENBQUMsUUFBa0I7SUFDdEUsT0FBTyxJQUFBLHdCQUFnQixFQUFDLE1BQU0sc0JBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ2hGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWFkSlNPTlN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgQnVpbGRFeGl0Q29kZSwgQnVpbGRTdGFnZVByb2dyZXNzQ2FsbGJhY2ssIElCdWlsZENvbW1hbmRPcHRpb24sIElCdWlsZFJlc3VsdERhdGEsIElCdWlsZFN0YWdlT3B0aW9ucywgSUJ1aWxkVGFza09wdGlvbiwgSUJ1bmRsZUJ1aWxkT3B0aW9ucywgSVByZXZpZXdTZXR0aW5nc1Jlc3VsdCwgUGxhdGZvcm0gfSBmcm9tICcuL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB7IHBsdWdpbk1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXIvcGx1Z2luJztcbmltcG9ydCB7IGNsb25lQ29uZmlnVmFsdWUsIGZvcm1hdE1TVGltZSB9IGZyb20gJy4vc2hhcmUvdXRpbHMnO1xuaW1wb3J0IHsgbmV3Q29uc29sZSB9IGZyb20gJy4uL2Jhc2UvY29uc29sZSc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZXh0bmFtZSwgaXNBYnNvbHV0ZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IGFzc2V0TWFuYWdlciBmcm9tICcuLi9hc3NldHMvbWFuYWdlci9hc3NldCc7XG5pbXBvcnQgeyByZW1vdmVEYkhlYWRlciB9IGZyb20gJy4vd29ya2VyL2J1aWxkZXIvdXRpbHMnO1xuaW1wb3J0IGJ1aWxkZXJDb25maWcgZnJvbSAnLi9zaGFyZS9idWlsZGVyLWNvbmZpZyc7XG5pbXBvcnQgeyBCdWlsZENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL0B0eXBlcy9jb25maWctZXhwb3J0JztcbmltcG9ydCB1dGlscyBmcm9tICcuLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IG1pZGRsZXdhcmVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmVyL21pZGRsZXdhcmUvY29yZSc7XG5pbXBvcnQgQnVpbGRNaWRkbGV3YXJlIGZyb20gJy4vYnVpbGQubWlkZGxld2FyZSc7XG5pbXBvcnQgeyBCdWlsZEdsb2JhbEluZm8gfSBmcm9tICcuL3NoYXJlL2dsb2JhbCc7XG5leHBvcnQgeyBjbGVhckNhY2hlIH0gZnJvbSAnLi9jYWNoZSc7XG5leHBvcnQgdHlwZSB7IEJ1aWxkQ2FjaGVTY29wZSwgQ2xlYXJDYWNoZVJlc3VsdCB9IGZyb20gJy4vY2FjaGUnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdChwbGF0Zm9ybT86IHN0cmluZ1tdKSB7XG4gICAgYXdhaXQgYnVpbGRlckNvbmZpZy5pbml0KCk7XG4gICAgYXdhaXQgcGx1Z2luTWFuYWdlci5pbml0KCk7XG4gICAgbWlkZGxld2FyZVNlcnZpY2UucmVnaXN0ZXIoJ0J1aWxkJywgQnVpbGRNaWRkbGV3YXJlKTtcbiAgICBpZiAocGxhdGZvcm0/Lmxlbmd0aCkge1xuICAgICAgICBmb3IgKGNvbnN0IHBsYXRmb3JtTmFtZSBvZiBwbGF0Zm9ybSkge1xuICAgICAgICAgICAgYXdhaXQgcGx1Z2luTWFuYWdlci5yZWdpc3RlcihwbGF0Zm9ybU5hbWUpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgcGx1Z2luTWFuYWdlci5yZWdpc3RlckFsbFBsYXRmb3JtKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRCdWlsZGVyTG9nUm9vdCgpIHtcbiAgICBjb25zdCBwcm9qZWN0VGVtcERpciA9IGJ1aWxkZXJDb25maWcucHJvamVjdFRlbXBEaXI7XG4gICAgcmV0dXJuIGJhc2VuYW1lKHByb2plY3RUZW1wRGlyKSA9PT0gJ2J1aWxkZXInID8gcHJvamVjdFRlbXBEaXIgOiBqb2luKHByb2plY3RUZW1wRGlyLCAnYnVpbGRlcicpO1xufVxuXG4vLyBMb2cgZmlsZW5hbWU6IHtwbGF0Zm9ybX0te2FjdGlvbn0te3RpbWVzdGFtcH0ubG9nXG4vLyBlLmcuIGdvb2dsZS1wbGF5LWJ1aWxkLTEyMzQ1Njc4OTAubG9nLCBnb29nbGUtcGxheS1tYWtlLTEyMzQ1Njc4OTAubG9nLCBnb29nbGUtcGxheS1idW5kbGUtYnVpbGQtMTIzNDU2Nzg5MC5sb2dcbmZ1bmN0aW9uIG5vcm1hbGl6ZUJ1aWxkTG9nRGVzdChsb2dEZXN0OiBzdHJpbmcgfCB1bmRlZmluZWQsIHRhc2tOYW1lOiBzdHJpbmcsIHBsYXRmb3JtPzogc3RyaW5nKSB7XG4gICAgY29uc3Qgc2FuaXRpemUgPSAoczogc3RyaW5nKSA9PiBzLnJlcGxhY2UoL1tcXFxcLzoqP1wiPD58XS9nLCAnXycpO1xuICAgIGNvbnN0IHNhbml0aXplZFRhc2sgPSBzYW5pdGl6ZSh0YXNrTmFtZSk7XG4gICAgY29uc3Qgc2FuaXRpemVkUGxhdGZvcm0gPSBwbGF0Zm9ybSA/IHNhbml0aXplKHBsYXRmb3JtKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBsYWJlbCA9IHBsYXRmb3JtID09PSB0YXNrTmFtZSA/ICdidWlsZCcgOiBzYW5pdGl6ZWRUYXNrO1xuICAgIGNvbnN0IHBhcnRzID0gc2FuaXRpemVkUGxhdGZvcm0gPyBbc2FuaXRpemVkUGxhdGZvcm0sIGxhYmVsLCBgJHtEYXRlLm5vdygpfWBdIDogW3Nhbml0aXplZFRhc2ssIGAke0RhdGUubm93KCl9YF07XG4gICAgY29uc3QgZmFsbGJhY2sgPSBqb2luKGdldEJ1aWxkZXJMb2dSb290KCksICdsb2cnLCBgJHtwYXJ0cy5qb2luKCctJyl9LmxvZ2ApO1xuICAgIGxldCByZXNvbHZlZExvZ0Rlc3QgPSBsb2dEZXN0ID8gdXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcobG9nRGVzdCkgOiBmYWxsYmFjaztcbiAgICBpZiAoIWlzQWJzb2x1dGUocmVzb2x2ZWRMb2dEZXN0KSkge1xuICAgICAgICByZXNvbHZlZExvZ0Rlc3QgPSBqb2luKGJ1aWxkZXJDb25maWcucHJvamVjdFJvb3QsIHJlc29sdmVkTG9nRGVzdCk7XG4gICAgfVxuICAgIHJldHVybiBleHRuYW1lKHJlc29sdmVkTG9nRGVzdCkudG9Mb3dlckNhc2UoKSA9PT0gJy5sb2cnID8gcmVzb2x2ZWRMb2dEZXN0IDogYCR7cmVzb2x2ZWRMb2dEZXN0fS5sb2dgO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVCdWlsZExvZ1Npbmsob3B0aW9uczogeyBsb2dEZXN0Pzogc3RyaW5nOyB0YXNrTmFtZT86IHN0cmluZzsgcGxhdGZvcm0/OiBzdHJpbmcgfSwgZmFsbGJhY2tUYXNrTmFtZTogc3RyaW5nLCBsb2dEZXN0Pzogc3RyaW5nKSB7XG4gICAgY29uc3QgdGFza05hbWUgPSBvcHRpb25zLnRhc2tOYW1lIHx8IGZhbGxiYWNrVGFza05hbWU7XG4gICAgb3B0aW9ucy50YXNrTmFtZSA9IHRhc2tOYW1lO1xuICAgIG9wdGlvbnMubG9nRGVzdCA9IG5vcm1hbGl6ZUJ1aWxkTG9nRGVzdChsb2dEZXN0IHx8IG9wdGlvbnMubG9nRGVzdCwgdGFza05hbWUsIG9wdGlvbnMucGxhdGZvcm0pO1xuICAgIG5ld0NvbnNvbGUucmVjb3JkKG9wdGlvbnMubG9nRGVzdCk7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9nRGVzdDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUJ1aWxkVGFzazxQIGV4dGVuZHMgUGxhdGZvcm0+KHBsYXRmb3JtOiBQLCBvcHRpb25zPzogSUJ1aWxkQ29tbWFuZE9wdGlvbikge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gYXdhaXQgcGx1Z2luTWFuYWdlci5nZXRPcHRpb25zQnlQbGF0Zm9ybShwbGF0Zm9ybSk7XG4gICAgfVxuICAgIG9wdGlvbnMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICBvcHRpb25zLnRhc2tJZCA9IG9wdGlvbnMudGFza0lkIHx8IFN0cmluZyhuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG4gICAgb3B0aW9ucy50YXNrTmFtZSA9IG9wdGlvbnMudGFza05hbWUgfHwgcGxhdGZvcm07XG4gICAgZW5zdXJlQnVpbGRMb2dTaW5rKG9wdGlvbnMsIHBsYXRmb3JtKTtcblxuICAgIC8vIOS4jeaUr+aMgeeahOaehOW7uuW5s+WPsOS4jeaJp+ihjOaehOW7ulxuICAgIGlmICghcGx1Z2luTWFuYWdlci5jaGVja1BsYXRmb3JtKHBsYXRmb3JtKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHBsYXRmb3JtICR7cGxhdGZvcm19IGZvciBidWlsZCBjb21tYW5kIWApO1xuICAgIH1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgbGV0IHJlYWxPcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uPGFueT4gPSBvcHRpb25zO1xuICAgIGlmICghb3B0aW9ucy5za2lwQ2hlY2spIHtcbiAgICAgICAgLy8g5qCh6aqM5o+S5Lu26YCJ6aG5XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcmlnaHRPcHRpb25zID0gYXdhaXQgcGx1Z2luTWFuYWdlci5jaGVja09wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIGlmICghcmlnaHRPcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoaTE4bi50KCdidWlsZGVyLmVycm9yLmNoZWNrX29wdGlvbnNfZmFpbGVkJykpO1xuICAgICAgICB9XG4gICAgICAgIHJlYWxPcHRpb25zID0gcmlnaHRPcHRpb25zO1xuICAgIH1cblxuICAgIHJlYWxPcHRpb25zLmxvZ0Rlc3QgPSBvcHRpb25zLmxvZ0Rlc3Q7XG5cbiAgICBjb25zdCB7IEJ1aWxkVGFzayB9ID0gYXdhaXQgaW1wb3J0KCcuL3dvcmtlci9idWlsZGVyJyk7XG4gICAgcmV0dXJuIG5ldyBCdWlsZFRhc2sob3B0aW9ucy50YXNrSWQsIHJlYWxPcHRpb25zKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkPFAgZXh0ZW5kcyBQbGF0Zm9ybT4ocGxhdGZvcm06IFAsIG9wdGlvbnM/OiBJQnVpbGRDb21tYW5kT3B0aW9uKTogUHJvbWlzZTxJQnVpbGRSZXN1bHREYXRhPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBsZXQgYnVpbGRTdWNjZXNzID0gdHJ1ZTtcbiAgICBjb25zdCByZXN0b3JlTG9nU2luayA9IG5ld0NvbnNvbGUuY3JlYXRlTG9nU2lua1Jlc3RvcmVyKCk7XG5cbiAgICAvLyDmmL7npLrmnoTlu7rlvIDlp4vkv6Hmga9cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgY3JlYXRlQnVpbGRUYXNrKHBsYXRmb3JtLCBvcHRpb25zKTtcbiAgICAgICAgbmV3Q29uc29sZS5idWlsZFN0YXJ0KHBsYXRmb3JtKTtcblxuICAgICAgICAvLyDnm5HlkKzmnoTlu7rov5vluqZcbiAgICAgICAgYnVpbGRlci5vbigndXBkYXRlJywgKG1lc3NhZ2U6IHN0cmluZywgcHJvZ3Jlc3M6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgbmV3Q29uc29sZS5wcm9ncmVzcyhtZXNzYWdlLCBNYXRoLnJvdW5kKHByb2dyZXNzICogMTAwKSwgMTAwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgYnVpbGRlci5ydW4oKTtcbiAgICAgICAgYnVpbGRTdWNjZXNzID0gIWJ1aWxkZXIuZXJyb3I7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gZm9ybWF0TVNUaW1lKERhdGUubm93KCkgLSBzdGFydFRpbWUpO1xuICAgICAgICBpZiAoIWJ1aWxkU3VjY2Vzcykge1xuICAgICAgICAgICAgcmVzdG9yZUxvZ1NpbmsoKTtcbiAgICAgICAgfVxuICAgICAgICBuZXdDb25zb2xlLmJ1aWxkQ29tcGxldGUocGxhdGZvcm0sIGR1cmF0aW9uLCBidWlsZFN1Y2Nlc3MpO1xuICAgICAgICBidWlsZGVyLmJ1aWxkRXhpdFJlcy5kZXN0ID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9VcmwoYnVpbGRlci5idWlsZEV4aXRSZXMuZGVzdCwgJ3Byb2plY3QnKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhKU09OLnN0cmluZ2lmeShidWlsZGVyLmJ1aWxkRXhpdFJlcykpO1xuICAgICAgICByZXR1cm4gYnVpbGRTdWNjZXNzID8gYnVpbGRlci5idWlsZEV4aXRSZXMgOiB7IGNvZGU6IEJ1aWxkRXhpdENvZGUuQlVJTERfRkFJTEVELCByZWFzb246ICdCdWlsZCBmYWlsZWQhJyB9O1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgYnVpbGRTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gZm9ybWF0TVNUaW1lKERhdGUubm93KCkgLSBzdGFydFRpbWUpO1xuICAgICAgICBuZXdDb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgbmV3Q29uc29sZS5idWlsZENvbXBsZXRlKHBsYXRmb3JtLCBkdXJhdGlvbiwgZmFsc2UpO1xuICAgICAgICAvLyDlpoLmnpzplJnor6/lr7nosaHljIXlkKsgY29kZSDlsZ7mgKfvvIzkvb/nlKjor6XplJnor6/noIHvvIjlpoIgNTAw77yJXG4gICAgICAgIGxldCBlcnJvckNvZGUgPSBlcnJvcj8uY29kZSAmJiB0eXBlb2YgZXJyb3IuY29kZSA9PT0gJ251bWJlcicgPyBlcnJvci5jb2RlIGFzIEJ1aWxkRXhpdENvZGUgOiBCdWlsZEV4aXRDb2RlLkJVSUxEX0ZBSUxFRDtcbiAgICAgICAgaWYgKGVycm9yQ29kZSA9PT0gQnVpbGRFeGl0Q29kZS5CVUlMRF9TVUNDRVNTKSB7XG4gICAgICAgICAgICBlcnJvckNvZGUgPSBCdWlsZEV4aXRDb2RlLkJVSUxEX0ZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBjb2RlOiBlcnJvckNvZGUgYXMgRXhjbHVkZTxCdWlsZEV4aXRDb2RlLCBCdWlsZEV4aXRDb2RlLkJVSUxEX1NVQ0NFU1M+LCByZWFzb246IGVycm9yPy5tZXNzYWdlIHx8IFN0cmluZyhlcnJvcikgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICByZXN0b3JlTG9nU2luaygpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUJ1bmRsZUJ1aWxkVGFzayhidW5kbGVPcHRpb25zOiBJQnVuZGxlQnVpbGRPcHRpb25zKSB7XG4gICAgY29uc3QgeyBCdW5kbGVNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vd29ya2VyL2J1aWxkZXIvYXNzZXQtaGFuZGxlci9idW5kbGUnKTtcbiAgICBjb25zdCBvcHRpb25zID0gYnVuZGxlT3B0aW9ucy5idWlsZFRhc2tPcHRpb25zO1xuICAgIHJldHVybiBhd2FpdCBCdW5kbGVNYW5hZ2VyLmNyZWF0ZShvcHRpb25zKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkQnVuZGxlT25seShidW5kbGVPcHRpb25zOiBJQnVuZGxlQnVpbGRPcHRpb25zKTogUHJvbWlzZTxJQnVpbGRSZXN1bHREYXRhPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBvcHRpb25zID0gYnVuZGxlT3B0aW9ucy5idWlsZFRhc2tPcHRpb25zO1xuICAgIGNvbnN0IHRhc2tzTGFiZWwgPSBidW5kbGVPcHRpb25zLnRhc2tOYW1lIHx8ICdidW5kbGUtYnVpbGQnO1xuICAgIGNvbnN0IHRhc2tTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHJlc3RvcmVMb2dTaW5rID0gbmV3Q29uc29sZS5jcmVhdGVMb2dTaW5rUmVzdG9yZXIoKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGJ1bmRsZU9wdGlvbnMubG9nRGVzdCA9IGVuc3VyZUJ1aWxkTG9nU2luayh7IHBsYXRmb3JtOiBvcHRpb25zLnBsYXRmb3JtIH0sIHRhc2tzTGFiZWwsIGJ1bmRsZU9wdGlvbnMubG9nRGVzdCk7XG4gICAgICAgIG5ld0NvbnNvbGUuc3RhZ2UoJ0JVTkRMRScsIGAke3Rhc2tzTGFiZWx9ICgke29wdGlvbnMucGxhdGZvcm19KSBzdGFydGluZy4uLmApO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdTdGFydCBidWlsZCB0YXNrLCBvcHRpb25zOicsIG9wdGlvbnMpO1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrTWVtb3J5U3RhcnQoYGJ1aWxkZXI6YnVpbGQtYnVuZGxlLXRvdGFsYCk7XG5cbiAgICAgICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGNyZWF0ZUJ1bmRsZUJ1aWxkVGFzayhidW5kbGVPcHRpb25zKTtcbiAgICAgICAgYnVpbGRlci5vbigndXBkYXRlJywgKG1lc3NhZ2U6IHN0cmluZywgcHJvZ3Jlc3M6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgbmV3Q29uc29sZS5wcm9ncmVzcyhgJHtvcHRpb25zLnBsYXRmb3JtfTogJHttZXNzYWdlfWAsIE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApLCAxMDApO1xuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBidWlsZGVyLnJ1bigpO1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrTWVtb3J5RW5kKGBidWlsZGVyOmJ1aWxkLWJ1bmRsZS10b3RhbGApO1xuICAgICAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gZm9ybWF0TVNUaW1lKERhdGUubm93KCkgLSBzdGFydFRpbWUpO1xuICAgICAgICBpZiAoYnVpbGRlci5lcnJvcikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3JNc2cgPSB0eXBlb2YgYnVpbGRlci5lcnJvciA9PSAnb2JqZWN0JyA/IChidWlsZGVyLmVycm9yLnN0YWNrIHx8IGJ1aWxkZXIuZXJyb3IubWVzc2FnZSkgOiBidWlsZGVyLmVycm9yO1xuICAgICAgICAgICAgbmV3Q29uc29sZS5lcnJvcihgJHt0YXNrc0xhYmVsfSAoJHtvcHRpb25zLnBsYXRmb3JtfSkgZmFpbGVkOiAke2Vycm9yTXNnfWApO1xuICAgICAgICAgICAgbmV3Q29uc29sZS50YXNrQ29tcGxldGUoJ0J1bmRsZSBCdWlsZCcsIGZhbHNlLCB0b3RhbER1cmF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IEJ1aWxkRXhpdENvZGUuQlVJTERfRkFJTEVELCByZWFzb246IGVycm9yTXNnIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IGZvcm1hdE1TVGltZShEYXRlLm5vdygpIC0gdGFza1N0YXJ0VGltZSk7XG4gICAgICAgICAgICBuZXdDb25zb2xlLnRhc2tDb21wbGV0ZSgnQnVuZGxlIEJ1aWxkJywgdHJ1ZSwgdG90YWxEdXJhdGlvbik7XG4gICAgICAgICAgICBuZXdDb25zb2xlLnN1Y2Nlc3MoYCR7dGFza3NMYWJlbH0gKCR7b3B0aW9ucy5wbGF0Zm9ybX0pIGNvbXBsZXRlZCBpbiAke2R1cmF0aW9ufWApO1xuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkZXIuYnVpbGRFeGl0UmVzO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBjb25zdCBlcnJNc2cgPSBgJHt0YXNrc0xhYmVsfSAoJHtvcHRpb25zLnBsYXRmb3JtfSkgZXJyb3I6ICR7U3RyaW5nKGVycm9yKX1gO1xuICAgICAgICBuZXdDb25zb2xlLmVycm9yKGVyck1zZyk7XG4gICAgICAgIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBmb3JtYXRNU1RpbWUoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSk7XG4gICAgICAgIG5ld0NvbnNvbGUudGFza0NvbXBsZXRlKCdCdW5kbGUgQnVpbGQnLCBmYWxzZSwgdG90YWxEdXJhdGlvbik7XG4gICAgICAgIHJldHVybiB7IGNvZGU6IEJ1aWxkRXhpdENvZGUuQlVJTERfRkFJTEVELCByZWFzb246IGVyck1zZyB9O1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlc3RvcmVMb2dTaW5rKCk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQnVpbGRTdGFnZVRhc2sodGFza0lkOiBzdHJpbmcsIHN0YWdlTmFtZTogc3RyaW5nLCBvcHRpb25zOiBJQnVpbGRTdGFnZU9wdGlvbnMpIHtcbiAgICByZXR1cm4gY3JlYXRlQnVpbGRTdGFnZVRhc2tXaXRoQnVpbGRPcHRpb25zKHRhc2tJZCwgc3RhZ2VOYW1lLCBvcHRpb25zLCByZWFkQnVpbGRPcHRpb25zRm9yQnVpbGRTdGFnZShvcHRpb25zKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUJ1aWxkU3RhZ2VUYXNrV2l0aEJ1aWxkT3B0aW9ucyh0YXNrSWQ6IHN0cmluZywgc3RhZ2VOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IElCdWlsZFN0YWdlT3B0aW9ucywgYnVpbGRPcHRpb25zPzogSUJ1aWxkVGFza09wdGlvbjxhbnk+KSB7XG4gICAgb3B0aW9ucy5kZXN0ID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcob3B0aW9ucy5kZXN0KTtcbiAgICBjb25zdCB7IEJ1aWxkU3RhZ2VUYXNrIH0gPSBhd2FpdCBpbXBvcnQoJy4vd29ya2VyL2J1aWxkZXIvc3RhZ2UtdGFzay1tYW5hZ2VyJyk7XG4gICAgY29uc3Qgc3RhZ2VDb25maWcgPSBwbHVnaW5NYW5hZ2VyLmdldEJ1aWxkU3RhZ2VXaXRoSG9va1Rhc2tzKG9wdGlvbnMucGxhdGZvcm0sIHN0YWdlTmFtZSkgfHwge1xuICAgICAgICBuYW1lOiBzdGFnZU5hbWUsXG4gICAgICAgIGhvb2s6IHN0YWdlTmFtZSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBCdWlsZFN0YWdlVGFzayh0YXNrSWQsIHtcbiAgICAgICAgaG9va3NJbmZvOiBwbHVnaW5NYW5hZ2VyLmdldEhvb2tzSW5mbyhvcHRpb25zLnBsYXRmb3JtKSxcbiAgICAgICAgcm9vdDogb3B0aW9ucy5kZXN0LFxuICAgICAgICBidWlsZFRhc2tPcHRpb25zOiBidWlsZE9wdGlvbnMhLFxuICAgICAgICAuLi5zdGFnZUNvbmZpZyxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVhZEJ1aWxkT3B0aW9uc0ZvckJ1aWxkU3RhZ2Uob3B0aW9uczogSUJ1aWxkU3RhZ2VPcHRpb25zKSB7XG4gICAgb3B0aW9ucy5kZXN0ID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcob3B0aW9ucy5kZXN0KTsgICAvLyDpobrkvr/ooaXlm57ov5nooYxcbiAgICBsZXQgYnVpbGRPcHRpb25zO1xuICAgIGlmIChvcHRpb25zLnBsYXRmb3JtLnN0YXJ0c1dpdGgoJ3dlYicpKSB7XG4gICAgICAgIGJ1aWxkT3B0aW9ucyA9IHsgcGxhdGZvcm06IG9wdGlvbnMucGxhdGZvcm0sIHBhY2thZ2VzOiB7fSB9IGFzIGFueTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBidWlsZE9wdGlvbnMgPSByZWFkQnVpbGRUYXNrT3B0aW9ucyhvcHRpb25zLmRlc3QpO1xuICAgICAgICBpZiAoIWJ1aWxkT3B0aW9ucykgeyB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkIG9wdGlvbnMgaXMgbm90IGV4aXN0IScpOyB9XG4gICAgfVxuICAgIG1lcmdlQnVpbGRTdGFnZVJ1bnRpbWVPcHRpb25zKGJ1aWxkT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGJ1aWxkT3B0aW9ucztcbn1cblxuZnVuY3Rpb24gbWVyZ2VCdWlsZFN0YWdlUnVudGltZU9wdGlvbnMoYnVpbGRPcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uPGFueT4sIG9wdGlvbnM6IElCdWlsZFN0YWdlT3B0aW9ucykge1xuICAgIGJ1aWxkT3B0aW9ucy5wbGF0Zm9ybSA9IG9wdGlvbnMucGxhdGZvcm07XG4gICAgKGJ1aWxkT3B0aW9ucyBhcyBJQnVpbGRUYXNrT3B0aW9uPGFueT4gJiB7IGRlc3Q/OiBzdHJpbmcgfSkuZGVzdCA9IG9wdGlvbnMuZGVzdDtcbiAgICBpZiAob3B0aW9ucy5sb2dEZXN0KSB7XG4gICAgICAgIGJ1aWxkT3B0aW9ucy5sb2dEZXN0ID0gb3B0aW9ucy5sb2dEZXN0O1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5wYWNrYWdlcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGJ1aWxkT3B0aW9ucy5wYWNrYWdlcyA9IGJ1aWxkT3B0aW9ucy5wYWNrYWdlcyB8fCB7fTtcbiAgICBmb3IgKGNvbnN0IFtwbGF0Zm9ybSwgcGFja2FnZU9wdGlvbnNdIG9mIE9iamVjdC5lbnRyaWVzKG9wdGlvbnMucGFja2FnZXMpKSB7XG4gICAgICAgIGJ1aWxkT3B0aW9ucy5wYWNrYWdlc1twbGF0Zm9ybV0gPSB7XG4gICAgICAgICAgICAuLi4oYnVpbGRPcHRpb25zLnBhY2thZ2VzW3BsYXRmb3JtXSB8fCB7fSksXG4gICAgICAgICAgICAuLi5wYWNrYWdlT3B0aW9ucyxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlQnVpbGRTdGFnZVRhc2sodGFza0lkOiBzdHJpbmcsIHN0YWdlTmFtZTogc3RyaW5nLCBvcHRpb25zOiBJQnVpbGRTdGFnZU9wdGlvbnMsIG9uUHJvZ3Jlc3M/OiBCdWlsZFN0YWdlUHJvZ3Jlc3NDYWxsYmFjayk6IFByb21pc2U8SUJ1aWxkUmVzdWx0RGF0YT4ge1xuICAgIGlmICghb3B0aW9ucy50YXNrTmFtZSkge1xuICAgICAgICBvcHRpb25zLnRhc2tOYW1lID0gc3RhZ2VOYW1lO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3RvcmVMb2dTaW5rID0gbmV3Q29uc29sZS5jcmVhdGVMb2dTaW5rUmVzdG9yZXIoKTtcbiAgICBlbnN1cmVCdWlsZExvZ1Npbmsob3B0aW9ucywgb3B0aW9ucy50YXNrTmFtZSwgb3B0aW9ucy5sb2dEZXN0KTtcblxuICAgIHRyeSB7XG4gICAgICAgIG9wdGlvbnMuZGVzdCA9IHV0aWxzLlBhdGgucmVzb2x2ZVRvUmF3KG9wdGlvbnMuZGVzdCk7XG4gICAgICAgIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IHJlYWRCdWlsZFRhc2tPcHRpb25zKG9wdGlvbnMuZGVzdCk7XG4gICAgICAgIGlmICghYnVpbGRPcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkIG9wdGlvbnMgaXMgbm90IGV4aXN0IScpO1xuICAgICAgICB9XG4gICAgICAgIG1lcmdlQnVpbGRTdGFnZVJ1bnRpbWVPcHRpb25zKGJ1aWxkT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIGxldCByZXN1bHQ6IElCdWlsZFJlc3VsdERhdGE7XG4gICAgICAgIGlmIChzaG91bGRDYXNjYWRlQnVpbGRTdGFnZShvcHRpb25zLCBidWlsZE9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBleGVjdXRlQnVpbGRTdGFnZVRhc2tDYXNjYWRlKHRhc2tJZCwgc3RhZ2VOYW1lLCBvcHRpb25zLCBidWlsZE9wdGlvbnMsIG9uUHJvZ3Jlc3MsIHJlc3RvcmVMb2dTaW5rKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGV4ZWN1dGVTaW5nbGVCdWlsZFN0YWdlVGFzayh0YXNrSWQsIHN0YWdlTmFtZSwgb3B0aW9ucywgYnVpbGRPcHRpb25zLCBvblByb2dyZXNzLCByZXN0b3JlTG9nU2luayk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdC5jb2RlICE9PSBCdWlsZEV4aXRDb2RlLkJVSUxEX1NVQ0NFU1MpIHtcbiAgICAgICAgICAgIHJlc3RvcmVMb2dTaW5rKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm4geyBjb2RlOiBCdWlsZEV4aXRDb2RlLkJVSUxEX0ZBSUxFRCwgcmVhc29uOiBlcnJvcj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyb3IpIH07XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVzdG9yZUxvZ1NpbmsoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZENhc2NhZGVCdWlsZFN0YWdlKG9wdGlvbnM6IElCdWlsZFN0YWdlT3B0aW9ucywgYnVpbGRPcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uPGFueT4pIHtcbiAgICByZXR1cm4gU3RyaW5nKG9wdGlvbnMucGxhdGZvcm0pID09PSBTdHJpbmcoYnVpbGRPcHRpb25zLnBsYXRmb3JtKVxuICAgICAgICAmJiAhYnVpbGRPcHRpb25zLnBhcmVudFRhc2tJZFxuICAgICAgICAmJiAhIWJ1aWxkT3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zPy5sZW5ndGg7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVCdWlsZFN0YWdlVGFza0Nhc2NhZGUoXG4gICAgdGFza0lkOiBzdHJpbmcsXG4gICAgc3RhZ2VOYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9uczogSUJ1aWxkU3RhZ2VPcHRpb25zLFxuICAgIHBhcmVudEJ1aWxkT3B0aW9uczogSUJ1aWxkVGFza09wdGlvbjxhbnk+LFxuICAgIG9uUHJvZ3Jlc3M/OiBCdWlsZFN0YWdlUHJvZ3Jlc3NDYWxsYmFjayxcbiAgICByZXN0b3JlTG9nU2luaz86ICgpID0+IHZvaWQsXG4pOiBQcm9taXNlPElCdWlsZFJlc3VsdERhdGE+IHtcbiAgICBjb25zdCB0YXJnZXRzID0gW3tcbiAgICAgICAgcGxhdGZvcm06IFN0cmluZyhvcHRpb25zLnBsYXRmb3JtKSxcbiAgICAgICAgZGVzdDogb3B0aW9ucy5kZXN0LFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LCAuLi4ocGFyZW50QnVpbGRPcHRpb25zLnN1YlRhc2tQbGF0Zm9ybXMgfHwgW10pLm1hcCgocGxhdGZvcm0pID0+ICh7XG4gICAgICAgIHBsYXRmb3JtLFxuICAgICAgICBkZXN0OiBwYXJlbnRCdWlsZE9wdGlvbnMuc3ViVGFza0J1aWxkT3V0cHV0cz8uW3BsYXRmb3JtXT8uZGVzdCB8fCAnJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIH0pKV07XG4gICAgY29uc3Qgc3RhZ2VSZXN1bHRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICAgIGxldCBwYXJlbnRSZXN1bHQ6IElCdWlsZFJlc3VsdERhdGEgfCB1bmRlZmluZWQ7XG5cbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiB0YXJnZXRzKSB7XG4gICAgICAgIGlmICghdGFyZ2V0LmRlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWlsQnVpbGRTdGFnZShgTWlzc2luZyBidWlsZCBvdXRwdXQgZm9yIHN0YWdlIHBsYXRmb3JtICR7dGFyZ2V0LnBsYXRmb3JtfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldE9wdGlvbnM6IElCdWlsZFN0YWdlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICBwbGF0Zm9ybTogdGFyZ2V0LnBsYXRmb3JtLFxuICAgICAgICAgICAgZGVzdDogdGFyZ2V0LmRlc3QsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IHJlYWRCdWlsZFRhc2tPcHRpb25zKHV0aWxzLlBhdGgucmVzb2x2ZVRvUmF3KHRhcmdldC5kZXN0KSk7XG4gICAgICAgIGlmICghYnVpbGRPcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFpbEJ1aWxkU3RhZ2UoYEJ1aWxkIG9wdGlvbnMgaXMgbm90IGV4aXN0IGZvciAke3RhcmdldC5wbGF0Zm9ybX0hYCk7XG4gICAgICAgIH1cbiAgICAgICAgbWVyZ2VCdWlsZFN0YWdlUnVudGltZU9wdGlvbnMoYnVpbGRPcHRpb25zLCB0YXJnZXRPcHRpb25zKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlY3V0ZVNpbmdsZUJ1aWxkU3RhZ2VUYXNrKHRhc2tJZCwgc3RhZ2VOYW1lLCB0YXJnZXRPcHRpb25zLCBidWlsZE9wdGlvbnMsIG9uUHJvZ3Jlc3MsIHJlc3RvcmVMb2dTaW5rKTtcbiAgICAgICAgaWYgKHJlc3VsdC5jb2RlICE9PSBCdWlsZEV4aXRDb2RlLkJVSUxEX1NVQ0NFU1MpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgc3RhZ2VSZXN1bHRzW3RhcmdldC5wbGF0Zm9ybV0gPSByZXN1bHQuY3VzdG9tO1xuICAgICAgICBpZiAodGFyZ2V0LnJlcXVpcmVkKSB7XG4gICAgICAgICAgICBwYXJlbnRSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXBhcmVudFJlc3VsdCB8fCBwYXJlbnRSZXN1bHQuY29kZSAhPT0gQnVpbGRFeGl0Q29kZS5CVUlMRF9TVUNDRVNTKSB7XG4gICAgICAgIHJldHVybiBmYWlsQnVpbGRTdGFnZShgQnVpbGQgc3RhZ2UgdGFzayAke3N0YWdlTmFtZX0gZGlkIG5vdCBydW4gZm9yICR7b3B0aW9ucy5wbGF0Zm9ybX1gKTtcbiAgICB9XG4gICAgcGFyZW50UmVzdWx0LmN1c3RvbSA9IHtcbiAgICAgICAgLi4ucGFyZW50UmVzdWx0LmN1c3RvbSxcbiAgICAgICAgc3RhZ2VSZXN1bHRzOiB7XG4gICAgICAgICAgICAuLi4ocGFyZW50UmVzdWx0LmN1c3RvbS5zdGFnZVJlc3VsdHMgfHwge30pLFxuICAgICAgICAgICAgW3N0YWdlTmFtZV06IHN0YWdlUmVzdWx0cyxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBwYXJlbnRSZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGZhaWxCdWlsZFN0YWdlKHJlYXNvbjogc3RyaW5nKTogSUJ1aWxkUmVzdWx0RGF0YSB7XG4gICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvZGU6IEJ1aWxkRXhpdENvZGUuQlVJTERfRkFJTEVELFxuICAgICAgICByZWFzb24sXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZVNpbmdsZUJ1aWxkU3RhZ2VUYXNrKFxuICAgIHRhc2tJZDogc3RyaW5nLFxuICAgIHN0YWdlTmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IElCdWlsZFN0YWdlT3B0aW9ucyxcbiAgICBidWlsZE9wdGlvbnM6IElCdWlsZFRhc2tPcHRpb248YW55PixcbiAgICBvblByb2dyZXNzPzogQnVpbGRTdGFnZVByb2dyZXNzQ2FsbGJhY2ssXG4gICAgcmVzdG9yZUxvZ1Npbms/OiAoKSA9PiB2b2lkLFxuKTogUHJvbWlzZTxJQnVpbGRSZXN1bHREYXRhPiB7XG4gICAgbGV0IGJ1aWxkU3RhZ2VUYXNrOiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUJ1aWxkU3RhZ2VUYXNrPj4gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgICAgYnVpbGRTdGFnZVRhc2sgPSBhd2FpdCBjcmVhdGVCdWlsZFN0YWdlVGFza1dpdGhCdWlsZE9wdGlvbnModGFza0lkLCBzdGFnZU5hbWUsIG9wdGlvbnMsIGJ1aWxkT3B0aW9ucyk7XG4gICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICBidWlsZFN0YWdlVGFzay5vbigndXBkYXRlJywgb25Qcm9ncmVzcyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhZ2VDb25maWcgPSBwbHVnaW5NYW5hZ2VyLmdldEJ1aWxkU3RhZ2VXaXRoSG9va1Rhc2tzKG9wdGlvbnMucGxhdGZvcm0sIHN0YWdlTmFtZSk7XG4gICAgICAgIGNvbnN0IHN0YWdlTGFiZWwgPSBzdGFnZUNvbmZpZz8ubmFtZSB8fCBzdGFnZU5hbWU7XG5cbiAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeVN0YXJ0KGBidWlsZGVyOmJ1aWxkLXN0YWdlLXRvdGFsICR7c3RhZ2VOYW1lfWApO1xuICAgICAgICBjb25zdCBidWlsZFN1Y2Nlc3MgPSBhd2FpdCBidWlsZFN0YWdlVGFzay5ydW4oKTtcbiAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeUVuZChgYnVpbGRlcjpidWlsZC1zdGFnZS10b3RhbCAke3N0YWdlTmFtZX1gKTtcblxuICAgICAgICBpZiAoIWJ1aWxkU3RhZ2VUYXNrLmVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3Rhc2s6JHtzdGFnZUxhYmVsfV06IHN1Y2Nlc3MhYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3N0YWdlTGFiZWx9IHBhY2thZ2UgJHtvcHRpb25zLmRlc3R9IGZhaWxlZCFgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdGFzazoke3N0YWdlTGFiZWx9XTogZmFpbGVkIWApO1xuICAgICAgICB9XG4gICAgICAgIGJ1aWxkU3RhZ2VUYXNrLmJ1aWxkRXhpdFJlcy5kZXN0ID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9VcmwoYnVpbGRTdGFnZVRhc2suYnVpbGRFeGl0UmVzLmRlc3QsICdwcm9qZWN0Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGJ1aWxkU3RhZ2VUYXNrLmJ1aWxkRXhpdFJlcykpO1xuICAgICAgICByZXR1cm4gYnVpbGRTdWNjZXNzID8gYnVpbGRTdGFnZVRhc2suYnVpbGRFeGl0UmVzIDogeyBjb2RlOiBCdWlsZEV4aXRDb2RlLkJVSUxEX0ZBSUxFRCwgcmVhc29uOiAnQnVpbGQgc3RhZ2UgdGFzayBmYWlsZWQhJyB9O1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybiB7IGNvZGU6IEJ1aWxkRXhpdENvZGUuQlVJTERfRkFJTEVELCByZWFzb246IGVycm9yPy5tZXNzYWdlIHx8IFN0cmluZyhlcnJvcikgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoYnVpbGRTdGFnZVRhc2sgJiYgb25Qcm9ncmVzcykge1xuICAgICAgICAgICAgYnVpbGRTdGFnZVRhc2sub2ZmKCd1cGRhdGUnLCBvblByb2dyZXNzKTtcbiAgICAgICAgfVxuICAgICAgICByZXN0b3JlTG9nU2luaz8uKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWFkQnVpbGRUYXNrT3B0aW9ucyhyb290OiBzdHJpbmcpOiBJQnVpbGRUYXNrT3B0aW9uPGFueT4ge1xuICAgIGNvbnN0IGNvbmZpZ0ZpbGUgPSBqb2luKHJvb3QsIEJ1aWxkR2xvYmFsSW5mby5idWlsZE9wdGlvbnNGaWxlTmFtZSk7XG4gICAgcmV0dXJuIHJlYWRKU09OU3luYyhjb25maWdGaWxlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFByZXZpZXdTZXR0aW5nczxQIGV4dGVuZHMgUGxhdGZvcm0+KG9wdGlvbnM/OiBJQnVpbGRUYXNrT3B0aW9uPFA+KTogUHJvbWlzZTxJUHJldmlld1NldHRpbmdzUmVzdWx0PiB7XG4gICAgY29uc3QgdGVtcCA9IG9wdGlvbnMgfHwgKGF3YWl0IHBsdWdpbk1hbmFnZXIuZ2V0T3B0aW9uc0J5UGxhdGZvcm0oJ3dlYi1kZXNrdG9wJykpO1xuICAgIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGVtcCkpO1xuICAgIGJ1aWxkT3B0aW9ucy5wcmV2aWV3ID0gdHJ1ZTtcbiAgICAvLyBUT0RPIOmihOiniCBzZXR0aW5ncyDnmoTmjpLpmJ/kuYvnsbvnmoRcbiAgICBjb25zdCB7IEJ1aWxkVGFzayB9ID0gYXdhaXQgaW1wb3J0KCcuL3dvcmtlci9idWlsZGVyL2luZGV4Jyk7XG4gICAgY29uc3QgYnVpbGRUYXNrID0gbmV3IEJ1aWxkVGFzayhidWlsZE9wdGlvbnMudGFza0lkIHx8ICd2JywgYnVpbGRPcHRpb25zIGFzIHVua25vd24gYXMgSUJ1aWxkVGFza09wdGlvbjxQbGF0Zm9ybT4pO1xuICAgIGNvbnN0IHByZXZpZXdTZXR0aW5nc1N0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICAgIC8vIOaLv+WHuiBzZXR0aW5ncyDkv6Hmga9cbiAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IGJ1aWxkVGFzay5nZXRQcmV2aWV3U2V0dGluZ3MoKTtcblxuICAgIC8vIOaLvOaOpeiEmuacrOWvueW6lOaWh+S7tueahCBtYXBcbiAgICBjb25zdCBzY3JpcHQybGlicmFyeTogeyBbaW5kZXg6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG4gICAgZm9yIChjb25zdCB1dWlkIG9mIGJ1aWxkVGFzay5jYWNoZS5zY3JpcHRVdWlkcykge1xuICAgICAgICBjb25zdCBhc3NldCA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCd1bmtub3duIHNjcmlwdCB1dWlkOiAnICsgdXVpZCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBzY3JpcHQybGlicmFyeVtyZW1vdmVEYkhlYWRlcihhc3NldC51cmwpLnJlcGxhY2UoLy50cyQvLCAnLmpzJyldID0gYXNzZXQubGlicmFyeSArICcuanMnO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgR2V0IHNldHRpbmdzLmpzIGluIHByZXZpZXc6ICR7RGF0ZS5ub3coKSAtIHByZXZpZXdTZXR0aW5nc1N0YXJ0fW1zYCk7XG4gICAgLy8g6L+U5Zue5pWw5o2uXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2V0dGluZ3MsXG4gICAgICAgIHNjcmlwdDJsaWJyYXJ5LFxuICAgICAgICBidW5kbGVDb25maWdzOiBidWlsZFRhc2suYnVuZGxlTWFuYWdlci5idW5kbGVzLm1hcCgoeCkgPT4geC5jb25maWcpLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBxdWVyeUJ1aWxkQ29uZmlnKCkge1xuICAgIHJldHVybiBidWlsZGVyQ29uZmlnLmdldFByb2plY3Q8QnVpbGRDb25maWd1cmF0aW9uPigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlCdW5kbGVDb25maWcoKSB7XG4gICAgcmV0dXJuIHBsdWdpbk1hbmFnZXIucXVlcnlCdW5kbGVDb25maWcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5VGV4dHVyZUNvbXByZXNzQ29uZmlnKCkge1xuICAgIHJldHVybiBwbHVnaW5NYW5hZ2VyLnF1ZXJ5VGV4dHVyZUNvbXByZXNzQ29uZmlnKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBxdWVyeVBsYXRmb3JtQ29uZmlnKCkge1xuICAgIHJldHVybiBwbHVnaW5NYW5hZ2VyLnF1ZXJ5UGxhdGZvcm1Db25maWcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXRmb3JtQnVpbGRTY2hlbWEocGxhdGZvcm06IFBsYXRmb3JtIHwgc3RyaW5nKSB7XG4gICAgcmV0dXJuIHBsdWdpbk1hbmFnZXIuZ2V0UGxhdGZvcm1CdWlsZFNjaGVtYShwbGF0Zm9ybSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGlzcGxheUkxOG5GaWVsZHMoKSB7XG4gICAgcmV0dXJuIHBsdWdpbk1hbmFnZXIucmVmcmVzaERpc3BsYXlJMThuRmllbGRzKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVCdWlsZFRlbXBsYXRlKG5hbWVPclBsYXRmb3JtOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gcGx1Z2luTWFuYWdlci5jcmVhdGVCdWlsZFRlbXBsYXRlKG5hbWVPclBsYXRmb3JtKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQnVpbGRPcHRpb24ocGxhdGZvcm06IHN0cmluZywga2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCBvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKSB7XG4gICAgcmV0dXJuIHBsdWdpbk1hbmFnZXIuY2hlY2tCdWlsZE9wdGlvbihwbGF0Zm9ybSwga2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0J1aWxkT3B0aW9ucyhwbGF0Zm9ybTogc3RyaW5nLCBvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKSB7XG4gICAgcmV0dXJuIHBsdWdpbk1hbmFnZXIuY2hlY2tCdWlsZE9wdGlvbnMocGxhdGZvcm0sIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlBc3NldHNJbkJ1bmRsZSh1dWlkOiBzdHJpbmcsIGJ1bmRsZUZpbHRlckNvbmZpZz86IGltcG9ydCgnLi9AdHlwZXMnKS5CdW5kbGVGaWx0ZXJDb25maWdbXSkge1xuICAgIGNvbnN0IHsgYnVpbGRBc3NldExpYnJhcnkgfSA9IGF3YWl0IGltcG9ydCgnLi93b3JrZXIvYnVpbGRlci9tYW5hZ2VyL2Fzc2V0LWxpYnJhcnknKTtcbiAgICByZXR1cm4gYnVpbGRBc3NldExpYnJhcnkucXVlcnlBc3NldHNJbkJ1bmRsZSh1dWlkLCBidW5kbGVGaWx0ZXJDb25maWcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVnaXN0ZXJlZFBsYXRmb3JtcygpIHtcbiAgICByZXR1cm4gcGx1Z2luTWFuYWdlci5nZXRSZWdpc3RlcmVkUGxhdGZvcm1zKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeURlZmF1bHRCdWlsZENvbmZpZ0J5UGxhdGZvcm0ocGxhdGZvcm06IFBsYXRmb3JtKSB7XG4gICAgcmV0dXJuIGNsb25lQ29uZmlnVmFsdWUoYXdhaXQgcGx1Z2luTWFuYWdlci5nZXRPcHRpb25zQnlQbGF0Zm9ybShwbGF0Zm9ybSkpO1xufVxuIl19