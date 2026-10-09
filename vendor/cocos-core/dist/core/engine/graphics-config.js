"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CUSTOM_PIPELINE_NAME = exports.CUSTOM_PIPELINE_NAME_KEY = exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE = exports.LEGACY_PIPELINE_MODULE = exports.CUSTOM_PIPELINE_MODULE = void 0;
exports.hasOwnConfigKey = hasOwnConfigKey;
exports.ensureCustomPipelineMacroConfig = ensureCustomPipelineMacroConfig;
exports.deriveGraphicsConfigFromModules = deriveGraphicsConfigFromModules;
exports.deriveGraphicsConfigFromCustomPipeline = deriveGraphicsConfigFromCustomPipeline;
exports.mergeGraphicsConfigWithModules = mergeGraphicsConfigWithModules;
exports.normalizeIncludeModulesWithGraphics = normalizeIncludeModulesWithGraphics;
exports.CUSTOM_PIPELINE_MODULE = 'custom-pipeline';
exports.LEGACY_PIPELINE_MODULE = 'legacy-pipeline';
exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE = 'custom-pipeline-post-process';
exports.CUSTOM_PIPELINE_NAME_KEY = 'CUSTOM_PIPELINE_NAME';
exports.DEFAULT_CUSTOM_PIPELINE_NAME = 'Builtin';
function hasOwnConfigKey(object, key) {
    return !!object && Object.prototype.hasOwnProperty.call(object, key);
}
function ensureCustomPipelineMacroConfig(macroConfig) {
    return {
        ...(macroConfig ?? {}),
        [exports.CUSTOM_PIPELINE_NAME_KEY]: macroConfig?.[exports.CUSTOM_PIPELINE_NAME_KEY] ?? exports.DEFAULT_CUSTOM_PIPELINE_NAME,
    };
}
function deriveGraphicsConfigFromModules(includeModules = []) {
    const hasCustomPipeline = includeModules.includes(exports.CUSTOM_PIPELINE_MODULE);
    const hasLegacyPipeline = includeModules.includes(exports.LEGACY_PIPELINE_MODULE);
    const pipeline = hasLegacyPipeline && !hasCustomPipeline
        ? exports.LEGACY_PIPELINE_MODULE
        : exports.CUSTOM_PIPELINE_MODULE;
    return {
        pipeline,
        [exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE]: includeModules.includes(exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE),
    };
}
function deriveGraphicsConfigFromCustomPipeline(customPipeline, includeModules = []) {
    return {
        ...deriveGraphicsConfigFromModules(includeModules),
        pipeline: customPipeline === false ? exports.LEGACY_PIPELINE_MODULE : exports.CUSTOM_PIPELINE_MODULE,
    };
}
function mergeGraphicsConfigWithModules(includeModules = [], graphics = {}) {
    return {
        ...deriveGraphicsConfigFromModules(includeModules),
        ...graphics,
    };
}
function normalizeIncludeModulesWithGraphics(includeModules = [], graphics = {}) {
    const pipeline = graphics.pipeline ?? deriveGraphicsConfigFromModules(includeModules).pipeline;
    const useCustomPipeline = pipeline !== exports.LEGACY_PIPELINE_MODULE;
    const modules = includeModules.filter((module) => {
        return module !== exports.CUSTOM_PIPELINE_MODULE
            && module !== exports.LEGACY_PIPELINE_MODULE
            && module !== exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE;
    });
    modules.push(useCustomPipeline ? exports.CUSTOM_PIPELINE_MODULE : exports.LEGACY_PIPELINE_MODULE);
    if (useCustomPipeline && graphics[exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE]) {
        modules.push(exports.CUSTOM_PIPELINE_POST_PROCESS_MODULE);
    }
    return Array.from(new Set(modules));
}
