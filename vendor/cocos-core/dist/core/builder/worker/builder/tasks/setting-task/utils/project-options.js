'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchOptionsToSettings = patchOptionsToSettings;
exports.getSplashSettings = getSplashSettings;
exports.getPhysicsConfig = getPhysicsConfig;
exports.formatSplashScreen = formatSplashScreen;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const i18n_1 = __importDefault(require("../../../../../../base/i18n"));
const utils_1 = __importDefault(require("../../../../../../base/utils"));
const engine_1 = require("../../../../../../engine");
const joint_texture_layout_1 = require("../../../../../../engine/joint-texture-layout");
const global_1 = require("../../../../../../../global");
const utils_2 = require("../../../../../share/utils");
const layerMask = [];
for (let i = 0; i <= 19; i++) {
    layerMask[i] = 1 << i;
}
/**
 * 根据构建选项补充 settings 数据
 * @param options
 * @param settings
 */
async function patchOptionsToSettings(options, settings) {
    settings.launch.launchScene = options.startScene;
    settings.engine.debug = options.debug;
    settings.screen.designResolution = options.resolution;
    settings.engine.platform = options.platform || settings.engine.platform;
    settings.assets.server = options.server || '';
    settings.CocosEngine = engine_1.Engine.getInfo().version;
    settings.engine.customLayers = options.customLayers.map((layer) => {
        const index = layerMask.findIndex((num) => { return layer.value === num; });
        return {
            name: layer.name,
            bit: index,
        };
    });
    settings.engine.customLayers.sort((a, b) => a.bit - b.bit);
    settings.engine.sortingLayers = options.sortingLayers;
    const { renderPipeline: defaultPipeline, splashScreen: defaultSplashScreen } = engine_1.Engine.getConfig(true);
    settings.rendering.renderPipeline = options.renderPipeline === defaultPipeline ? '' : options.renderPipeline;
    settings.rendering.customPipeline = options.customPipeline;
    const { customJointTextureLayouts, downloadMaxConcurrency } = engine_1.Engine.getConfig();
    settings.animation.customJointTextureLayouts = await (0, joint_texture_layout_1.resolveCustomJointTextureLayouts)(customJointTextureLayouts);
    if (options.includeModules.includes('custom-pipeline')) {
        settings.rendering.effectSettingsPath = 'src/effect.bin';
    }
    // 自定义插屏写入
    settings.splashScreen = await getSplashSettings(!!options.useSplashScreen, !!options.preview, defaultSplashScreen, options.splashScreen);
    settings.physics = await getPhysicsConfig(options.includeModules, options.physicsConfig);
    settings.engine.macros = options.macroConfig || {};
    settings.assets.downloadMaxConcurrency = downloadMaxConcurrency;
}
async function getSplashSettings(useSplashScreen, preview, defaultSplashScreen, splashScreen) {
    if (useSplashScreen !== false || preview) {
        try {
            splashScreen = (0, utils_2.cloneConfigValue)(Object.assign({}, defaultSplashScreen, splashScreen));
            return formatSplashScreen(splashScreen);
        }
        catch (error) {
            console.error(error);
            console.error(i18n_1.default.t('builder.error.missing_splash_tips', {
                splashScreen: JSON.stringify(splashScreen),
            }));
            return formatSplashScreen((0, utils_2.cloneConfigValue)(defaultSplashScreen));
        }
    }
    else {
        const defaultSplashSettings = formatSplashScreen((0, utils_2.cloneConfigValue)(defaultSplashScreen));
        defaultSplashSettings.totalTime = 0;
        delete defaultSplashSettings.logo;
        delete defaultSplashSettings.background;
        return defaultSplashSettings;
    }
}
async function getPhysicsConfig(includeModules, physicsConfig) {
    // 添加物理引擎模块标记
    let physicsEngine = '';
    const engineList = ['physics-cannon', 'physics-ammo', 'physics-builtin', 'physics-physx'];
    for (let i = 0; i < engineList.length; i++) {
        if (includeModules.indexOf(engineList[i]) >= 0) {
            physicsEngine = engineList[i];
            break;
        }
    }
    // 不论引擎对物理模块的剔除情况，物理配置都输出
    return Object.assign({ physicsEngine }, (0, utils_2.cloneConfigValue)(physicsConfig));
}
function formatSplashScreen(splashScreen) {
    if (splashScreen.logo) {
        if (splashScreen.logo.type === 'custom') {
            const path = utils_1.default.Path.resolveToRaw(splashScreen.logo.image);
            splashScreen.logo.base64 = `data:image/png;base64,${(0, fs_extra_1.readFileSync)(path).toString('base64')}`;
        }
        else if (splashScreen.logo.type === 'default') {
            // 先不从 defaultSplashSettings 里获取默认图片
            const defaultLogoPath = (0, path_1.join)(global_1.GlobalPaths.staticDir, 'build-templates/launcher/icon.png');
            splashScreen.logo.base64 = `data:image/png;base64,${(0, fs_extra_1.readFileSync)(defaultLogoPath).toString('base64')}`;
        }
        delete splashScreen.logo.image;
    }
    if (splashScreen.background) {
        if (splashScreen.background.type === 'custom') {
            const path = utils_1.default.Path.resolveToRaw(splashScreen.background.image);
            splashScreen.background.base64 = `data:image/png;base64,${(0, fs_extra_1.readFileSync)(path).toString('base64')}`;
            delete splashScreen.background.color;
        }
        else if (splashScreen.background.type === 'default') {
            splashScreen.background.color = {
                x: 4 / 255,
                y: 9 / 255,
                z: 10 / 255,
                w: 1 / 255,
            };
        }
        delete splashScreen.background.image;
    }
    return splashScreen;
}
