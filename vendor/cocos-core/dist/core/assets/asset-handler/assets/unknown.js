'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const utils_1 = require("../utils");
exports.UnknownHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: '*',
    // 引擎内对应的类型
    assetType: 'cc.Asset',
    async open() {
        return false;
    },
    /**
     * 检查文件是否适用于这个 Handler
     * @param asset
     */
    async validate(asset) {
        return !asset.isDirectory();
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.0',
        /**
         * 实际导入流程
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            // 虚拟的未知类型资源不做处理
            if (!(asset instanceof asset_db_1.Asset)) {
                return true;
            }
            // 如果当前资源没有导入，则开始导入当前资源
            await asset.copyToLibrary(asset.extname, asset.source);
            const unknowAsset = new cc_1.Asset();
            unknowAsset.name = asset.basename;
            // @ts-ignore
            unknowAsset._setRawAsset(asset.extname);
            const serializeJSON = EditorExtends.serialize(unknowAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.UnknownHandler;
