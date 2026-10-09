'use strict';
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
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const serialize_library_1 = require("./utils/serialize-library");
const cc = __importStar(require("cc"));
const utils_1 = require("../utils");
const AnimationHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'animation-clip',
    // 引擎内对应的类型
    assetType: 'cc.AnimationClip',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newAnimation',
                    fullFileName: 'animation.anim',
                    template: `db://internal/default_file_content/${AnimationHandler.name}/default.anim`,
                    group: 'animation',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '2.0.4',
        versionCode: 2,
        /**
         * 如果改名就强制刷新
         * @param asset
         */
        async force(asset) {
            const userData = asset.userData;
            return userData.name !== asset.basename;
        },
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
            try {
                const fileContent = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
                const json = JSON.parse(fileContent);
                const details = cc.deserialize.Details.pool.get();
                const clip = cc.deserialize(json, details, undefined);
                const nUUIDRefs = details.uuidList.length;
                for (let i = 0; i < nUUIDRefs; ++i) {
                    const uuid = details.uuidList[i];
                    const uuidObj = details.uuidObjList[i];
                    const uuidProp = details.uuidPropList[i];
                    const uuidType = details.uuidTypeList[i];
                    const Type = cc.js.getClassById(uuidType) ?? cc.Asset;
                    const asset = new Type();
                    asset._uuid = uuid + '';
                    uuidObj[uuidProp] = asset;
                }
                clip.name = (0, path_1.basename)(asset.source, '.anim');
                userData.name = clip.name;
                // Compute hash
                void clip.hash;
                const { extension, data } = (0, serialize_library_1.serializeForLibrary)(clip);
                await asset.saveToLibrary(extension, data);
                const depends = (0, utils_1.getDependUUIDList)(fileContent);
                asset.setData('depends', depends);
            }
            catch (error) {
                console.error(error);
                return false;
            }
            return true;
        },
    },
};
exports.default = AnimationHandler;
