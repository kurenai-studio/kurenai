'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTSpriteFrameHandler = void 0;
const cc_1 = require("cc");
const utils_1 = require("../../utils");
exports.RTSpriteFrameHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'rt-sprite-frame',
    assetType: 'cc.SpriteFrame',
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
            // 如果没有生成 json 文件，则重新生成
            if (!asset.parent) {
                return false;
            }
            const sprite = new cc_1.SpriteFrame();
            // @ts-ignore
            sprite._texture = EditorExtends.serialize.asAsset(asset.userData.imageUuidOrDatabaseUri, cc.Texture2D);
            sprite.rect.width = sprite.originalSize.width = asset.userData.width || 1;
            sprite.rect.height = sprite.originalSize.height = asset.userData.height || 1;
            const serializeJSON = EditorExtends.serialize(sprite);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.RTSpriteFrameHandler;
