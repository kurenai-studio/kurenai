"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const utils_1 = require("../utils");
const utils_2 = require("./image/utils");
const texture_base_1 = require("./texture-base");
const utils_3 = require("../../utils");
exports.TextureHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'texture',
    // 引擎内对应的类型
    assetType: 'cc.Texture2D',
    propertySchemaConfig: {
        ...(0, texture_base_1.createTextureBasePropertySchema)(),
        imageUuidOrDatabaseUri: {
            title: 'i18n:ENGINE.assets.image.label',
            description: 'i18n:importer.property_schema.texture.image_uuid_or_database_uri_description',
            type: 'string',
            default: '',
        },
        isUuid: {
            title: 'i18n:importer.property_schema.texture.use_uuid',
            description: 'i18n:importer.property_schema.texture.use_uuid_description',
            type: 'boolean',
            default: true,
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.22',
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
            const userData = asset.userData;
            // @ts-ignore
            const texture = new cc.Texture2D();
            if (asset.parent instanceof asset_db_1.Asset) {
                texture.name = asset.parent.basename || '';
                // hdr exr 导入默认值需为 nearest 过滤模式
                if (!userData.mipfilter && ['.hdr', '.exr'].includes(asset.parent.extname)) {
                    userData.mipfilter = 'none';
                    userData.minfilter = 'nearest';
                    userData.magfilter = 'nearest';
                }
            }
            asset.assignUserData((0, utils_2.makeDefaultTexture2DAssetUserData)());
            (0, texture_base_1.applyTextureBaseAssetUserData)(userData, texture);
            const imageAsset = getImageAsset(asset);
            if (imageAsset) {
                texture._mipmaps = [imageAsset];
            }
            else {
                // 如果存在 imageUuidOrDatabaseUri 却无法获取到可能是资源尚未导入完成，需要做标记
                if (asset.userData.imageUuidOrDatabaseUri) {
                    asset.depend(asset.userData.imageUuidOrDatabaseUri);
                    return false;
                }
            }
            const serializeJSON = EditorExtends.serialize(texture);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TextureHandler;
function getImageUuid(asset) {
    const userData = asset.userData;
    const imageUuidOrDatabaseUri = userData.imageUuidOrDatabaseUri;
    if (!imageUuidOrDatabaseUri) {
        return null;
    }
    if (userData.isUuid) {
        return imageUuidOrDatabaseUri;
    }
    else {
        const imageUuid = (0, utils_3.url2uuid)(imageUuidOrDatabaseUri);
        if (imageUuid) {
            return imageUuid;
        }
    }
    return null;
}
function getImageAsset(asset) {
    const imageUuid = getImageUuid(asset);
    if (imageUuid !== null) {
        // @ts-ignore
        const image = EditorExtends.serialize.asAsset(imageUuid, cc_1.ImageAsset);
        return image;
    }
    return null;
}
