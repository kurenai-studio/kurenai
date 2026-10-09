"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfSkeletonHandler = void 0;
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
const gltf_1 = __importDefault(require("../gltf"));
const fbx_1 = __importDefault(require("../fbx"));
exports.GltfSkeletonHandler = {
    name: 'gltf-skeleton',
    // 引擎内对应的类型
    assetType: 'cc.Skeleton',
    /**
     * 允许这种类型的资源进行实例化
     */
    instantiation: '.skeleton',
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
            let version = gltf_1.default.importer.version;
            if (asset.parent.meta.importer === 'fbx') {
                version = fbx_1.default.importer.version;
            }
            const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset.parent, version);
            const skeleton = gltfConverter.createSkeleton(asset.userData.gltfIndex);
            asset.userData.jointsLength = skeleton.joints.length;
            const serializeJSON = EditorExtends.serialize(skeleton);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.GltfSkeletonHandler;
