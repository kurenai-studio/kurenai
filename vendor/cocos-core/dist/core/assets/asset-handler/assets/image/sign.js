"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignImageHandler = void 0;
const utils_1 = require("./utils");
const utils_2 = __importDefault(require("../../../../base/utils"));
exports.SignImageHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'sign-image',
    // 引擎内对应的类型
    assetType: 'cc.ImageAsset',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.1',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            if (!asset.parent) {
                return false;
            }
            const parent = asset.parent;
            const source = utils_2.default.Path.resolveToRaw(parent.userData.sign);
            Object.assign(asset.userData, parent.userData);
            delete asset.userData.type;
            delete asset.userData.sign;
            asset.userData.isRGBE = false;
            // 为不同导入类型的图片设置伪影的默认值
            if (asset.userData.fixAlphaTransparencyArtifacts === undefined) {
                asset.userData.fixAlphaTransparencyArtifacts = (0, utils_1.isCapableToFixAlphaTransparencyArtifacts)(asset, parent.userData.type, parent.extname);
            }
            const imageDataBufferOrimagePath = await (0, utils_1.handleImageUserData)(asset, source, '.png');
            await (0, utils_1.saveImageAsset)(asset, imageDataBufferOrimagePath, '.png', 'sign');
            await (0, utils_1.importWithType)(asset, parent.userData.type, 'sign', parent.extname);
            return true;
        },
    },
};
exports.default = exports.SignImageHandler;
