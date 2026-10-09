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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfMaterialHandler = void 0;
exports.dumpMaterial = dumpMaterial;
const asset_db_1 = require("@cocos/asset-db");
const cc = __importStar(require("cc"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const asset_finder_1 = require("./asset-finder");
const load_asset_sync_1 = require("../utils/load-asset-sync");
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
const url_1 = require("url");
const asset_db_2 = __importDefault(require("../../../manager/asset-db"));
const fbx_1 = __importDefault(require("../fbx"));
const gltf_1 = __importDefault(require("../gltf"));
exports.GltfMaterialHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'gltf-material',
    // 引擎内对应的类型
    assetType: 'cc.Material',
    /**
     * 允许这种类型的资源进行实例化
     */
    instantiation: '.material',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.14',
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
            // 如果之前的 fbx 有存在相同的 id 材质的编辑数据了，复用之前的数据
            if (asset.parent.meta?.userData?.materials) {
                const previousEditedData = asset.parent.meta.userData.materials[asset.uuid];
                if (previousEditedData) {
                    console.log(`importer: Reuse previously edited material data. ${asset.uuid}`);
                    const serializeJSON = JSON.stringify(previousEditedData);
                    await asset.saveToLibrary('.json', serializeJSON);
                    const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                    asset.setData('depends', depends);
                    return true;
                }
            }
            let version = gltf_1.default.importer.version;
            if (asset.parent.meta.importer === 'fbx') {
                version = fbx_1.default.importer.version;
            }
            const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset.parent, version);
            const gltfUserData = asset.parent.userData;
            const material = createMaterial(asset.userData.gltfIndex, gltfConverter, new asset_finder_1.DefaultGltfAssetFinder(gltfUserData.assetFinder), gltfUserData);
            const serializeJSON = EditorExtends.serialize(material);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
    createInfo: {
        async save(asset, content) {
            const materialUuid = asset.uuid;
            if (!content || Buffer.isBuffer(content)) {
                throw new Error(`${(0, utils_1.i18nTranslate)('assets.save_asset_meta.fail.content')}`);
            }
            if (!asset.parent) {
                return false;
            }
            const fbxMeta = asset.parent.meta;
            if (!fbxMeta.userData.materials || typeof fbxMeta.userData.materials !== 'object') {
                fbxMeta.userData.materials = {};
            }
            try {
                fbxMeta.userData.materials[materialUuid] = typeof content === 'string' ? JSON.parse(content) : content;
                (0, utils_1.mergeMeta)(asset.meta, fbxMeta);
                await asset.save();
            }
            catch (e) {
                console.error(`Save materials({asset(${materialUuid})} data to fbx {asset(${asset.parent.uuid})} failed!`);
                console.error(e);
                return false;
            }
            return true;
        },
    },
};
exports.default = exports.GltfMaterialHandler;
function createMaterial(index, gltfConverter, assetFinder, glTFUserData) {
    const material = gltfConverter.createMaterial(index, assetFinder, (effectName) => {
        const uuid = (0, asset_db_1.queryUUID)(effectName);
        return (0, load_asset_sync_1.loadAssetSync)(uuid, cc.EffectAsset);
    }, {
        useVertexColors: glTFUserData.useVertexColors,
        depthWriteInAlphaModeBlend: glTFUserData.depthWriteInAlphaModeBlend,
        smartMaterialEnabled: glTFUserData.fbx?.smartMaterialEnabled ?? false,
    });
    return material;
}
async function dumpMaterial(asset, assetFinder, gltfConverter, index, name) {
    const glTFUserData = asset.userData;
    let materialDumpDir = null;
    if (glTFUserData.materialDumpDir) {
        materialDumpDir = (0, asset_db_1.queryPath)(glTFUserData.materialDumpDir);
        if (!materialDumpDir) {
            console.warn('The specified dump directory of materials is not valid. ' + 'Default directory is used.');
        }
    }
    if (!materialDumpDir) {
        materialDumpDir = path_1.default.join(path_1.default.dirname(asset.source), `Materials_${asset.basename}`);
        // 生成默认值后，填入 userData，防止生成后，重新移动资源位置，导致 material 资源重新生成
        glTFUserData.materialDumpDir = await (0, asset_db_1.queryUrl)(materialDumpDir);
    }
    fs_extra_1.default.ensureDirSync(materialDumpDir);
    const destFileName = name;
    // 需要将 windows 上不支持的路径符号替换掉
    const destFilePath = path_1.default.join(materialDumpDir, destFileName.replace(/[\/:*?"<>|]/g, '-'));
    if (!fs_extra_1.default.existsSync(destFilePath)) {
        const material = createMaterial(index, gltfConverter, assetFinder, glTFUserData);
        // @ts-ignore
        const serialized = EditorExtends.serialize(material);
        fs_extra_1.default.writeFileSync(destFilePath, serialized);
    }
    // 不需要等待导入完成，这里只是想要获取到资源的 uuid
    (findAssetDB(glTFUserData.materialDumpDir) || asset._assetDB).refresh(destFilePath);
    const url = (0, asset_db_1.queryUrl)(destFilePath);
    if (url) {
        const uuid = (0, asset_db_1.queryUUID)(url);
        if (uuid && typeof uuid === 'string') {
            return uuid;
        }
    }
    asset.depend(destFilePath);
    return null;
}
function findAssetDB(url) {
    if (!url) {
        return null;
    }
    const uri = (0, url_1.parse)(url);
    if (!uri.host) {
        return null;
    }
    return asset_db_2.default.assetDBMap[uri.host];
}
