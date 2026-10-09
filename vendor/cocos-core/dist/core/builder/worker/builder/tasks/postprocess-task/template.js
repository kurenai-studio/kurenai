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
exports.name = exports.title = void 0;
exports.handle = handle;
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const babel = __importStar(require("@babel/core"));
// @ts-ignore
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const utils_1 = require("../../utils");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
const utils_2 = __importDefault(require("../../../../../base/utils"));
// 当前的 ejs 模板版本，升级版本后需要修改该字段与 application.ejs 里的版本号
const APPLICATION_EJS_VERSION = '1.0.0';
exports.title = 'i18n:builder.tasks.build_template';
exports.name = 'build-task/template';
/**
 * application.js 模板编译
 * @param options
 * @param settings
 */
async function handle(options, result, cache) {
    // 生成 settings.json
    const content = JSON.stringify(result.settings, null, options.debug ? 4 : 0);
    (0, fs_extra_1.outputFileSync)(result.paths.settings, content, 'utf8');
    const enginePath = options.engineInfo.typescript.path;
    const templateDir = (0, path_1.join)(enginePath, 'templates/launcher');
    const applicationEjsPath = this.buildTemplate.query('application') || (0, path_1.join)(templateDir, 'application.ejs');
    const settingsJsonPath = (0, utils_1.relativeUrl)(result.paths.dir, result.paths.settings);
    // ---- 编译 application.js ----
    const applicationSource = (await ejs_1.default.renderFile(applicationEjsPath, Object.assign(options.appTemplateData, {
        settingsJsonPath,
        hasPhysicsAmmo: options.buildEngineParam.includeModules.includes('physics-ammo'),
        versionTips: i18n_1.default.t('builder.tips.application_ejs_version'),
        customVersion: APPLICATION_EJS_VERSION,
        versionCheckTemplate: (0, path_1.join)(templateDir, 'version-check.ejs'),
    })));
    const applicationSourceTransformed = await babel.transformAsync(applicationSource, {
        presets: [[preset_env_1.default, {
                    modules: (0, utils_1.toBabelModules)('systemjs'),
                    targets: options.buildScriptParam.targets,
                }]],
    });
    if (!applicationSourceTransformed || !applicationSourceTransformed.code) {
        throw new Error('无法生成 application.js');
    }
    (0, fs_extra_1.outputFileSync)(result.paths.applicationJS, applicationSourceTransformed.code);
    options.md5CacheOptions.includes.push(utils_2.default.Path.relative(result.paths.dir, result.paths.applicationJS));
}
