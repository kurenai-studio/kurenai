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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = void 0;
exports.init = init;
exports.build = build;
exports.createBuildTask = createBuildTask;
exports.buildBundleOnly = buildBundleOnly;
exports.createBundleBuildTask = createBundleBuildTask;
exports.executeBuildStageTask = executeBuildStageTask;
exports.createBuildStageTask = createBuildStageTask;
exports.make = make;
exports.run = run;
exports.getPreviewUrl = getPreviewUrl;
exports.upload = upload;
exports.publish = publish;
exports.queryBuildConfig = queryBuildConfig;
exports.queryDefaultBuildConfigByPlatform = queryDefaultBuildConfigByPlatform;
exports.queryBundleConfig = queryBundleConfig;
exports.queryTextureCompressConfig = queryTextureCompressConfig;
exports.queryPlatformConfig = queryPlatformConfig;
exports.getPlatformBuildSchema = getPlatformBuildSchema;
exports.refreshDisplayI18nFields = refreshDisplayI18nFields;
exports.createBuildTemplate = createBuildTemplate;
exports.clearCache = clearCache;
exports.checkBuildOption = checkBuildOption;
exports.checkBuildOptions = checkBuildOptions;
exports.queryAssetsInBundle = queryAssetsInBundle;
exports.getRegisteredPlatforms = getRegisteredPlatforms;
exports.getPreviewSettings = getPreviewSettings;
exports.packAutoAtlas = packAutoAtlas;
exports.queryAutoAtlasFileCache = queryAutoAtlasFileCache;
async function init(platform) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.init(platform);
}
async function build(platform, options) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.build(platform, options);
}
async function createBuildTask(platform, options) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.createBuildTask(platform, options);
}
async function buildBundleOnly(bundleOptions) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.buildBundleOnly(bundleOptions);
}
async function createBundleBuildTask(bundleOptions) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.createBundleBuildTask(bundleOptions);
}
async function executeBuildStageTask(taskId, stageName, options, onProgress) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.executeBuildStageTask(taskId, stageName, options, onProgress);
}
async function createBuildStageTask(taskId, stageName, options) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.createBuildStageTask(taskId, stageName, options);
}
async function make(platform, dest) {
    const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../../core/launcher')));
    return Launcher.make(platform, dest);
}
async function run(platform, dest) {
    const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../../core/launcher')));
    return Launcher.run(platform, dest);
}
async function getPreviewUrl(dest, platform) {
    const commonUtils = await Promise.resolve().then(() => __importStar(require('../../core/builder/platforms/web-common/utils')));
    return commonUtils.getPreviewUrl(dest, platform);
}
async function upload(platform, dest, accessToken) {
    const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../../core/launcher')));
    return Launcher.upload(platform, dest, accessToken);
}
async function publish(platform, dest) {
    const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../../core/launcher')));
    return Launcher.publish(platform, dest);
}
async function queryBuildConfig() {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.queryBuildConfig();
}
async function queryDefaultBuildConfigByPlatform(platform) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.queryDefaultBuildConfigByPlatform(platform);
}
// 获取分包配置
async function queryBundleConfig() {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.queryBundleConfig();
}
// 获取纹理压缩配置
async function queryTextureCompressConfig() {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.queryTextureCompressConfig();
}
async function queryPlatformConfig() {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.queryPlatformConfig();
}
async function getPlatformBuildSchema(platform) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.getPlatformBuildSchema(platform);
}
async function refreshDisplayI18nFields() {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.refreshDisplayI18nFields();
}
async function createBuildTemplate(nameOrPlatform) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.createBuildTemplate(nameOrPlatform);
}
async function clearCache(scope) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.clearCache(scope);
}
async function checkBuildOption(platform, key, value, options) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.checkBuildOption(platform, key, value, options);
}
async function checkBuildOptions(platform, options) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.checkBuildOptions(platform, options);
}
// 查询指定 Bundle 中实际会被打包的资源列表
async function queryAssetsInBundle(uuid, bundleFilterConfig) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.queryAssetsInBundle(uuid, bundleFilterConfig);
}
// 获取注册的平台
async function getRegisteredPlatforms() {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.getRegisteredPlatforms();
}
async function getPreviewSettings(options) {
    const builder = await Promise.resolve().then(() => __importStar(require('../../core/builder')));
    return builder.getPreviewSettings(options);
}
async function packAutoAtlas(pacUuid, option) {
    const texturePacker = await Promise.resolve().then(() => __importStar(require('../../core/builder/worker/builder/asset-handler/texture-packer')));
    return texturePacker.packAutoAtlas(pacUuid, option);
}
async function queryAutoAtlasFileCache(pacUuid) {
    const texturePacker = await Promise.resolve().then(() => __importStar(require('../../core/builder/worker/builder/asset-handler/texture-packer')));
    return texturePacker.queryAutoAtlasFileCache(pacUuid);
}
var plugin_1 = require("../../core/builder/manager/plugin");
Object.defineProperty(exports, "pluginManager", { enumerable: true, get: function () { return plugin_1.pluginManager; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvYnVpbGRlci9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVFBLG9CQUdDO0FBRUQsc0JBR0M7QUFFRCwwQ0FHQztBQUVELDBDQUdDO0FBRUQsc0RBR0M7QUFFRCxzREFHQztBQUVELG9EQUdDO0FBRUQsb0JBR0M7QUFFRCxrQkFHQztBQUVELHNDQUdDO0FBRUQsd0JBR0M7QUFFRCwwQkFHQztBQUVELDRDQUdDO0FBRUQsOEVBR0M7QUFHRCw4Q0FHQztBQUdELGdFQUdDO0FBRUQsa0RBR0M7QUFFRCx3REFHQztBQUVELDREQUdDO0FBRUQsa0RBR0M7QUFFRCxnQ0FHQztBQUVELDRDQUdDO0FBRUQsOENBR0M7QUFHRCxrREFHQztBQUdELHdEQUdDO0FBRUQsZ0RBR0M7QUFFRCxzQ0FHQztBQUVELDBEQUdDO0FBOUlNLEtBQUssVUFBVSxJQUFJLENBQUMsUUFBbUI7SUFDMUMsTUFBTSxPQUFPLEdBQUcsd0RBQWEsb0JBQW9CLEdBQUMsQ0FBQztJQUNuRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEMsQ0FBQztBQUVNLEtBQUssVUFBVSxLQUFLLENBQXFCLFFBQVcsRUFBRSxPQUE2QjtJQUN0RixNQUFNLE9BQU8sR0FBRyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDO0lBQ25ELE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVNLEtBQUssVUFBVSxlQUFlLENBQXFCLFFBQVcsRUFBRSxPQUE2QjtJQUNoRyxNQUFNLE9BQU8sR0FBRyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDO0lBQ25ELE9BQU8sT0FBTyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDdEQs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QkFBdUIsQ0FBQyxPQUFlO0lBQ3pELE1BQU0sYUFBYSxHQUFHLHdEQUFhLGdFQUFnRSxHQUFDLENBQUM7SUFDckcsT0FBTyxhQUFhLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQUVELDREQUFrRTtBQUF6RCx1R0FBQSxhQUFhLE9BQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEJ1aWxkU3RhZ2VQcm9ncmVzc0NhbGxiYWNrLCBJQnVpbGRDb21tYW5kT3B0aW9uLCBJQnVpbGRSZXN1bHREYXRhLCBJQnVpbGRTdGFnZU9wdGlvbnMsIElCdWlsZFRhc2tPcHRpb24sIElCdW5kbGVCdWlsZE9wdGlvbnMsIElQYWNrT3B0aW9ucywgSVByZXZpZXdTZXR0aW5nc1Jlc3VsdCwgUGxhdGZvcm0sIFByZXZpZXdQYWNrUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9idWlsZGVyL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB0eXBlIHsgQnVpbGRDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vLi4vY29yZS9idWlsZGVyL0B0eXBlcy9jb25maWctZXhwb3J0JztcbmltcG9ydCB0eXBlIHsgQnVpbGRDaGVja1Jlc3VsdCwgUGxhdGZvcm1CdWlsZFNjaGVtYSwgUGxhdGZvcm1Db25maWdJdGVtIH0gZnJvbSAnLi4vLi4vY29yZS9idWlsZGVyL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHR5cGUgeyBCdWlsZENhY2hlU2NvcGUsIENsZWFyQ2FjaGVSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL2J1aWxkZXIvY2FjaGUnO1xuXG5leHBvcnQgdHlwZSAqIGZyb20gJy4uLy4uL2NvcmUvYnVpbGRlci9AdHlwZXMvcHJpdmF0ZSc7XG5leHBvcnQgdHlwZSAqIGZyb20gJy4uLy4uL2NvcmUvYnVpbGRlci9AdHlwZXMvY29uZmlnLWV4cG9ydCc7XG5leHBvcnQgdHlwZSB7IEJ1aWxkQ2FjaGVTY29wZSwgQ2xlYXJDYWNoZVJlc3VsdCB9O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXQocGxhdGZvcm0/OiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLmluaXQocGxhdGZvcm0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGQ8UCBleHRlbmRzIFBsYXRmb3JtPihwbGF0Zm9ybTogUCwgb3B0aW9ucz86IElCdWlsZENvbW1hbmRPcHRpb24pOiBQcm9taXNlPElCdWlsZFJlc3VsdERhdGE+IHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5idWlsZChwbGF0Zm9ybSwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVCdWlsZFRhc2s8UCBleHRlbmRzIFBsYXRmb3JtPihwbGF0Zm9ybTogUCwgb3B0aW9ucz86IElCdWlsZENvbW1hbmRPcHRpb24pIHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5jcmVhdGVCdWlsZFRhc2socGxhdGZvcm0sIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRCdW5kbGVPbmx5KGJ1bmRsZU9wdGlvbnM6IElCdW5kbGVCdWlsZE9wdGlvbnMpOiBQcm9taXNlPElCdWlsZFJlc3VsdERhdGE+IHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5idWlsZEJ1bmRsZU9ubHkoYnVuZGxlT3B0aW9ucyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVCdW5kbGVCdWlsZFRhc2soYnVuZGxlT3B0aW9uczogSUJ1bmRsZUJ1aWxkT3B0aW9ucykge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLmNyZWF0ZUJ1bmRsZUJ1aWxkVGFzayhidW5kbGVPcHRpb25zKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVCdWlsZFN0YWdlVGFzayh0YXNrSWQ6IHN0cmluZywgc3RhZ2VOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IElCdWlsZFN0YWdlT3B0aW9ucywgb25Qcm9ncmVzcz86IEJ1aWxkU3RhZ2VQcm9ncmVzc0NhbGxiYWNrKTogUHJvbWlzZTxJQnVpbGRSZXN1bHREYXRhPiB7XG4gICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyJyk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuZXhlY3V0ZUJ1aWxkU3RhZ2VUYXNrKHRhc2tJZCwgc3RhZ2VOYW1lLCBvcHRpb25zLCBvblByb2dyZXNzKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUJ1aWxkU3RhZ2VUYXNrKHRhc2tJZDogc3RyaW5nLCBzdGFnZU5hbWU6IHN0cmluZywgb3B0aW9uczogSUJ1aWxkU3RhZ2VPcHRpb25zKSB7XG4gICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyJyk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuY3JlYXRlQnVpbGRTdGFnZVRhc2sodGFza0lkLCBzdGFnZU5hbWUsIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFrZShwbGF0Zm9ybTogUGxhdGZvcm0sIGRlc3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHsgZGVmYXVsdDogTGF1bmNoZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9sYXVuY2hlcicpO1xuICAgIHJldHVybiBMYXVuY2hlci5tYWtlKHBsYXRmb3JtLCBkZXN0KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bihwbGF0Zm9ybTogUGxhdGZvcm0sIGRlc3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHsgZGVmYXVsdDogTGF1bmNoZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9sYXVuY2hlcicpO1xuICAgIHJldHVybiBMYXVuY2hlci5ydW4ocGxhdGZvcm0sIGRlc3QpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJldmlld1VybChkZXN0OiBzdHJpbmcsIHBsYXRmb3JtPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjb21tb25VdGlscyA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyL3BsYXRmb3Jtcy93ZWItY29tbW9uL3V0aWxzJyk7XG4gICAgcmV0dXJuIGNvbW1vblV0aWxzLmdldFByZXZpZXdVcmwoZGVzdCwgcGxhdGZvcm0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkKHBsYXRmb3JtOiBQbGF0Zm9ybSwgZGVzdDogc3RyaW5nLCBhY2Nlc3NUb2tlbj86IHN0cmluZykge1xuICAgIGNvbnN0IHsgZGVmYXVsdDogTGF1bmNoZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9sYXVuY2hlcicpO1xuICAgIHJldHVybiBMYXVuY2hlci51cGxvYWQocGxhdGZvcm0sIGRlc3QsIGFjY2Vzc1Rva2VuKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHB1Ymxpc2gocGxhdGZvcm06IFBsYXRmb3JtLCBkZXN0OiBzdHJpbmcpIHtcbiAgICBjb25zdCB7IGRlZmF1bHQ6IExhdW5jaGVyIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvbGF1bmNoZXInKTtcbiAgICByZXR1cm4gTGF1bmNoZXIucHVibGlzaChwbGF0Zm9ybSwgZGVzdCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUJ1aWxkQ29uZmlnKCk6IFByb21pc2U8QnVpbGRDb25maWd1cmF0aW9uPiB7XG4gICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyJyk7XG4gICAgcmV0dXJuIGJ1aWxkZXIucXVlcnlCdWlsZENvbmZpZygpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlEZWZhdWx0QnVpbGRDb25maWdCeVBsYXRmb3JtKHBsYXRmb3JtOiBQbGF0Zm9ybSkge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLnF1ZXJ5RGVmYXVsdEJ1aWxkQ29uZmlnQnlQbGF0Zm9ybShwbGF0Zm9ybSk7XG59XG5cbi8vIOiOt+WPluWIhuWMhemFjee9rlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5QnVuZGxlQ29uZmlnKCkge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLnF1ZXJ5QnVuZGxlQ29uZmlnKCk7XG59XG5cbi8vIOiOt+WPlue6ueeQhuWOi+e8qemFjee9rlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5VGV4dHVyZUNvbXByZXNzQ29uZmlnKCkge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLnF1ZXJ5VGV4dHVyZUNvbXByZXNzQ29uZmlnKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeVBsYXRmb3JtQ29uZmlnKCk6IFByb21pc2U8UGxhdGZvcm1Db25maWdJdGVtW10+IHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5xdWVyeVBsYXRmb3JtQ29uZmlnKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQbGF0Zm9ybUJ1aWxkU2NoZW1hKHBsYXRmb3JtOiBQbGF0Zm9ybSB8IHN0cmluZyk6IFByb21pc2U8UGxhdGZvcm1CdWlsZFNjaGVtYT4ge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLmdldFBsYXRmb3JtQnVpbGRTY2hlbWEocGxhdGZvcm0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaERpc3BsYXlJMThuRmllbGRzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLnJlZnJlc2hEaXNwbGF5STE4bkZpZWxkcygpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQnVpbGRUZW1wbGF0ZShuYW1lT3JQbGF0Zm9ybTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyJyk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuY3JlYXRlQnVpbGRUZW1wbGF0ZShuYW1lT3JQbGF0Zm9ybSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhckNhY2hlKHNjb3BlOiBCdWlsZENhY2hlU2NvcGUpOiBQcm9taXNlPENsZWFyQ2FjaGVSZXN1bHQ+IHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5jbGVhckNhY2hlKHNjb3BlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrQnVpbGRPcHRpb24ocGxhdGZvcm06IHN0cmluZywga2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCBvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKTogUHJvbWlzZTxCdWlsZENoZWNrUmVzdWx0PiB7XG4gICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyJyk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuY2hlY2tCdWlsZE9wdGlvbihwbGF0Zm9ybSwga2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja0J1aWxkT3B0aW9ucyhwbGF0Zm9ybTogc3RyaW5nLCBvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBCdWlsZENoZWNrUmVzdWx0Pj4ge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYnVpbGRlcicpO1xuICAgIHJldHVybiBidWlsZGVyLmNoZWNrQnVpbGRPcHRpb25zKHBsYXRmb3JtLCBvcHRpb25zKTtcbn1cblxuLy8g5p+l6K+i5oyH5a6aIEJ1bmRsZSDkuK3lrp7pmYXkvJrooqvmiZPljIXnmoTotYTmupDliJfooahcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0c0luQnVuZGxlKHV1aWQ6IHN0cmluZywgYnVuZGxlRmlsdGVyQ29uZmlnPzogaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXIvQHR5cGVzJykuQnVuZGxlRmlsdGVyQ29uZmlnW10pIHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5xdWVyeUFzc2V0c0luQnVuZGxlKHV1aWQsIGJ1bmRsZUZpbHRlckNvbmZpZyk7XG59XG5cbi8vIOiOt+WPluazqOWGjOeahOW5s+WPsFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFJlZ2lzdGVyZWRQbGF0Zm9ybXMoKSB7XG4gICAgY29uc3QgYnVpbGRlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyJyk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuZ2V0UmVnaXN0ZXJlZFBsYXRmb3JtcygpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJldmlld1NldHRpbmdzPFAgZXh0ZW5kcyBQbGF0Zm9ybT4ob3B0aW9ucz86IElCdWlsZFRhc2tPcHRpb248UD4pOiBQcm9taXNlPElQcmV2aWV3U2V0dGluZ3NSZXN1bHQ+IHtcbiAgICBjb25zdCBidWlsZGVyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXInKTtcbiAgICByZXR1cm4gYnVpbGRlci5nZXRQcmV2aWV3U2V0dGluZ3Mob3B0aW9ucyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYWNrQXV0b0F0bGFzKHBhY1V1aWQ6IHN0cmluZywgb3B0aW9uPzogUGFydGlhbDxJUGFja09wdGlvbnM+KTogUHJvbWlzZTxQcmV2aWV3UGFja1Jlc3VsdCB8IG51bGw+IHtcbiAgICBjb25zdCB0ZXh0dXJlUGFja2VyID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2J1aWxkZXIvd29ya2VyL2J1aWxkZXIvYXNzZXQtaGFuZGxlci90ZXh0dXJlLXBhY2tlcicpO1xuICAgIHJldHVybiB0ZXh0dXJlUGFja2VyLnBhY2tBdXRvQXRsYXMocGFjVXVpZCwgb3B0aW9uKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5QXV0b0F0bGFzRmlsZUNhY2hlKHBhY1V1aWQ6IHN0cmluZyk6IFByb21pc2U8UHJldmlld1BhY2tSZXN1bHQgfCBudWxsPiB7XG4gICAgY29uc3QgdGV4dHVyZVBhY2tlciA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvdGV4dHVyZS1wYWNrZXInKTtcbiAgICByZXR1cm4gdGV4dHVyZVBhY2tlci5xdWVyeUF1dG9BdGxhc0ZpbGVDYWNoZShwYWNVdWlkKTtcbn1cblxuZXhwb3J0IHsgcGx1Z2luTWFuYWdlciB9IGZyb20gJy4uLy4uL2NvcmUvYnVpbGRlci9tYW5hZ2VyL3BsdWdpbic7XG4iXX0=