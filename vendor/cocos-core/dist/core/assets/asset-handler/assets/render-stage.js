'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderStageAssetHandler = void 0;
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
exports.RenderStageAssetHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'render-stage',
    // 引擎内对应的类型
    assetType: 'RenderStage',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.0',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            const serializeJSON = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.RenderStageAssetHandler;
