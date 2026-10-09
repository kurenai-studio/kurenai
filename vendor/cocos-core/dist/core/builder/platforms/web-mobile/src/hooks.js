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
exports.throwError = void 0;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterBuild = onAfterBuild;
exports.run = run;
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../../../worker/builder/utils");
const commonUtils = __importStar(require("../../web-common/utils"));
exports.throwError = true;
async function onAfterInit(options, result, cache) {
    // 添加统计信息
    options.buildEngineParam.split = false;
    options.buildEngineParam.assetURLFormat = 'runtime-resolved';
    if (options.server && !options.server.endsWith('/')) {
        options.server += '/';
    }
}
function onAfterBundleInit(options) {
    options.buildScriptParam.system = { preset: 'web' };
    const useWebGPU = options.packages['web-mobile'].useWebGPU;
    options.buildScriptParam.flags['WEBGPU'] = useWebGPU;
    if (useWebGPU) {
        if (!options.includeModules.includes('gfx-webgpu')) {
            options.includeModules.push('gfx-webgpu');
        }
        options.assetSerializeOptions['cc.EffectAsset'].glsl4 = true;
    }
    else if (options.includeModules.includes('gfx-webgpu')) {
        const index = options.includeModules.indexOf('gfx-webgpu');
        options.includeModules.splice(index, 1);
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
    const packageOptions = options.packages['web-mobile'];
    result.settings.screen.orientation = packageOptions.orientation;
}
async function onBeforeCopyBuildTemplate(options, result) {
    const staticDir = (0, path_1.join)(options.engineInfo.typescript.builtin, 'templates/web-mobile');
    const packageOptions = options.packages['web-mobile'];
    // 拷贝内部提供的模板文件
    const cssFilePath = (0, path_1.join)(result.paths.dir, 'style.css');
    options.md5CacheOptions.includes.push('style.css');
    if (!this.buildTemplate.findFile('style.css')) {
        // 生成 style.css
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(staticDir, 'style.css'), cssFilePath);
    }
    let webDebuggerSrc = '';
    if (packageOptions.embedWebDebugger) {
        const webDebuggerPath = (0, path_1.join)(result.paths.dir, 'vconsole.min.js');
        if (!this.buildTemplate.findFile('vconsole.min.js')) {
            // 生成 vconsole
            (0, fs_extra_1.copyFileSync)((0, path_1.join)(staticDir, 'vconsole.min.js'), webDebuggerPath);
            options.md5CacheOptions.excludes.push('vconsole.min.js');
        }
        webDebuggerSrc = './vconsole.min.js';
    }
    // index.js 模板生成
    const indexJsTemplate = this.buildTemplate.initUrl('index.js.ejs', 'indexJs') || (0, path_1.join)(staticDir, 'index.js.ejs');
    const indexJsContent = await ejs_1.default.renderFile(indexJsTemplate, {
        applicationJS: './' + (0, utils_1.relativeUrl)(result.paths.dir, result.paths.applicationJS),
    });
    // TODO 需要优化，不应该直接读到内存里
    const indexJsSourceTransformedCode = await (0, utils_1.transformCode)(indexJsContent, {
        importMapFormat: 'systemjs',
    });
    if (!indexJsSourceTransformedCode) {
        throw new Error('Cannot generate index.js');
    }
    const indexJsDest = (0, path_1.join)(result.paths.dir, `index.js`);
    result.paths.indexJs = indexJsDest;
    options.md5CacheOptions.includes.push(`index.js`);
    (0, fs_extra_1.outputFileSync)(indexJsDest, indexJsSourceTransformedCode, 'utf8');
    // index.html 模板生成
    const indexEjsTemplate = this.buildTemplate.initUrl('index.ejs') || (0, path_1.join)(staticDir, 'index.ejs');
    // 处理平台模板
    const data = {
        polyfillsBundleFile: result.paths.polyfillsJs && (0, utils_1.relativeUrl)(result.paths.dir, result.paths.polyfillsJs) || false,
        systemJsBundleFile: (0, utils_1.relativeUrl)(result.paths.dir, result.paths.systemJs),
        projectName: options.name,
        engineName: options.buildEngineParam.engineName,
        webDebuggerSrc: webDebuggerSrc,
        cocosTemplate: (0, path_1.join)(staticDir, 'index-plugin.ejs'),
        importMapFile: (0, utils_1.relativeUrl)(result.paths.dir, result.paths.importMap),
        indexJsName: (0, path_1.basename)(indexJsDest),
        cssUrl: (0, path_1.basename)(cssFilePath),
    };
    const content = await ejs_1.default.renderFile(indexEjsTemplate, data);
    result.paths.indexHTML = (0, path_1.join)(result.paths.dir, 'index.html');
    (0, fs_extra_1.outputFileSync)(result.paths.indexHTML, content, 'utf8');
    options.md5CacheOptions.replaceOnly.push('index.html');
}
async function onAfterBuild(options, result) {
    // 放在最后处理 url ，否则会破坏 md5 的处理
    result.settings.plugins.jsList.forEach((url, i) => {
        result.settings.plugins.jsList[i] = url.split('/').map(encodeURIComponent).join('/');
    });
    (0, fs_extra_1.outputFileSync)(result.paths.settings, JSON.stringify(result.settings, null, options.debug ? 4 : 0));
}
async function run(root) {
    const previewUrl = await commonUtils.run('web-mobile', root);
    this.buildExitRes.custom = {
        previewUrl,
    };
}
;
