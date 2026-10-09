'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.title = void 0;
exports.handle = handle;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = __importDefault(require("../../../../../base/utils"));
const assets_1 = require("../../../../../assets");
exports.title = 'Build Assets';
async function handle(options, result, cache) {
    this.updateProcess('Build bundles...');
    await this.bundleManager.buildAsset();
    // 生成 effect.bin
    if (options.includeModules.includes('custom-pipeline')) {
        const effectBin = await assets_1.assetManager.getEffectBinPath();
        result.paths.effectBin = (0, path_1.join)((0, path_1.dirname)(result.paths.settings), 'effect.bin');
        await (0, fs_extra_1.copyFile)(effectBin, result.paths.effectBin);
        options.md5CacheOptions.excludes.push(utils_1.default.Path.relative(result.paths.dir, result.paths.effectBin));
    }
    // 输出 bundle 文件夹内容
    await this.bundleManager.outputBundle();
}
