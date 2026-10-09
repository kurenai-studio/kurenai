"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureCubeHandler = void 0;
exports.makeDefaultTextureCubeAssetUserData = makeDefaultTextureCubeAssetUserData;
const asset_db_1 = require("@cocos/asset-db");
const cc = __importStar(require("cc"));
const utils_1 = require("../utils");
const texture_base_1 = require("./texture-base");
const load_asset_sync_1 = require("./utils/load-asset-sync");
function makeDefaultTextureCubeAssetUserData() {
    const userData = (0, texture_base_1.makeDefaultTextureBaseAssetUserData)();
    userData.isRGBE = false;
    return userData;
}
exports.TextureCubeHandler = {
    name: 'texture-cube',
    assetType: 'cc.TextureCube',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newCubeMap',
                    fullFileName: 'cubemap.cubemap',
                    template: 'db://internal/default_file_content/texture-cube/default.cubemap',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.4',
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
            if (Object.getOwnPropertyNames(asset.userData).length === 0) {
                asset.assignUserData(makeDefaultTextureCubeAssetUserData(), true);
                asset.userData.isRGBE = false;
            }
            const userData = asset.userData;
            const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
            const faceAssets = {};
            for (const faceName of faceNames) {
                let faceImageUUID = userData[faceName];
                if (!faceImageUUID) {
                    const defaultFaceUrl = `db://internal/default_cubemap/${faceName}.jpg`;
                    const uuid = (0, asset_db_1.queryUUID)(defaultFaceUrl);
                    if (uuid) {
                        faceImageUUID = uuid;
                    }
                    else {
                        throw new Error(`[[internal-error]] Default face url ${defaultFaceUrl} doesn't exists.`);
                    }
                }
                const face = (0, load_asset_sync_1.loadAssetSync)(faceImageUUID, cc.ImageAsset);
                if (!face) {
                    throw new Error(`Failed to load ${faceName} face of ${asset.uuid}.`);
                }
                faceAssets[faceName] = face;
            }
            const texture = new cc.TextureCube();
            (0, texture_base_1.applyTextureBaseAssetUserData)(userData, texture);
            if (asset.parent instanceof asset_db_1.Asset) {
                texture.name = asset.parent.basename || '';
            }
            texture.isRGBE = userData.isRGBE;
            texture._mipmaps = [faceAssets];
            const serializeJSON = EditorExtends.serialize(texture);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TextureCubeHandler;
