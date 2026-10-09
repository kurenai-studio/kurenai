'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextHandler = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../utils");
exports.TextHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'text',
    // 引擎内对应的类型
    assetType: 'cc.TextAsset',
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        if (await asset.isDirectory()) {
            return false;
        }
        if (asset.extname === '.ts') {
            // 只允许 .d 结尾的文件（xxx.d.ts）
            return (0, path_1.extname)(asset.basename) === '.d';
        }
        return true;
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.1',
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
            const text = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
            const jsonAsset = new cc.TextAsset();
            jsonAsset.name = asset.basename;
            jsonAsset.text = text;
            const serializeJSON = EditorExtends.serialize(jsonAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TextHandler;
