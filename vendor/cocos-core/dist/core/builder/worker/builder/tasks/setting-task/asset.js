'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.title = void 0;
exports.handle = handle;
const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");
const utils_1 = require("../../utils");
exports.title = 'i18n:builder.tasks.settings.options';
const layerMask = [];
for (let i = 0; i <= 19; i++) {
    layerMask[i] = 1 << i;
}
/**
 * 根据选项填充 settings
 * @param options
 * @param settings
 */
async function handle(options, result, cache) {
    const bundles = this.bundleManager.bundles.filter((bundle) => bundle.output);
    for (const bundle of bundles) {
        if (bundle.name === bundle_utils_1.BuiltinBundleName.RESOURCES) {
            result.settings.assets.preloadBundles.push({ bundle: bundle_utils_1.BuiltinBundleName.RESOURCES });
        }
        else if (bundle.name === bundle_utils_1.BuiltinBundleName.START_SCENE) {
            result.settings.assets.preloadBundles.push({ bundle: bundle_utils_1.BuiltinBundleName.START_SCENE });
        }
        else if (bundle.name === bundle_utils_1.BuiltinBundleName.MAIN) {
            result.settings.assets.preloadBundles.push({ bundle: bundle_utils_1.BuiltinBundleName.MAIN });
        }
        if (bundle.isRemote) {
            result.settings.assets.remoteBundles.push(bundle.name);
        }
        if (bundle.isSubpackage) {
            result.settings.assets.subpackages.push(bundle.name);
        }
    }
    if (!options.preview) {
        const startSceneAsset = asset_library_1.buildAssetLibrary.getAsset(options.startScene);
        if (!startSceneAsset) {
            // 理论上进入构建前应该已经校验过，这里还是校验一下给一个可阅读的报错
            throw new Error('can not find start scene asset by uuid or url: ' + options.startScene);
        }
        options.startScene = startSceneAsset.url;
    }
    if (!options.debug) {
        result.settings.rendering.renderPipeline = (0, utils_1.compressUuid)(result.settings.rendering.renderPipeline, true);
    }
    result.settings.assets.projectBundles = bundles.map((bundle) => bundle.name);
    result.settings.engine.builtinAssets = Array.from(this.bundleManager.bundleMap[bundle_utils_1.BuiltinBundleName.INTERNAL]._rootAssets);
}
