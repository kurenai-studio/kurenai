'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.title = void 0;
exports.handle = handle;
exports.title = 'i18n:builder.tasks.sort_asset_bundle';
exports.name = 'data-task/asset_bundle';
async function handle(options, result, cache) {
    await this.bundleManager.initAsset();
    if (options.preview) {
        return;
    }
    await this.bundleManager.bundleDataTask();
}
