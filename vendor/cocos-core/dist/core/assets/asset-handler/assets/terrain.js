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
exports.TerrainHandler = void 0;
const fs = __importStar(require("fs-extra"));
const index_1 = require("./scene/index");
const cc_1 = require("cc");
const utils_1 = require("../utils");
exports.TerrainHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'terrain',
    // 引擎内对应的类型
    assetType: 'cc.TerrainAsset',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newTerrain',
                    fullFileName: 'terrain.terrain',
                    template: `db://internal/default_file_content/${exports.TerrainHandler.name}/default.terrain`,
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        version: index_1.version,
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
            await asset.copyToLibrary('.bin', asset.source);
            const terrainAsset = new cc_1.TerrainAsset();
            if (terrainAsset._loadNativeData(new Uint8Array(fs.readFileSync(asset.source)))) {
                terrainAsset.layerInfos.length = terrainAsset.layerBinaryInfos.length;
                for (let i = 0; i < terrainAsset.layerInfos.length; ++i) {
                    const binaryLayer = terrainAsset.layerBinaryInfos[i];
                    const layer = new cc_1.TerrainLayerInfo();
                    layer.slot = binaryLayer.slot;
                    layer.tileSize = binaryLayer.tileSize;
                    if (binaryLayer.detailMapId && binaryLayer.detailMapId != '') {
                        // @ts-ignore
                        layer.detailMap = EditorExtends.serialize.asAsset(binaryLayer.detailMapId, cc_1.Texture2D);
                    }
                    if (binaryLayer.normalMapId && binaryLayer.normalMapId != '') {
                        // @ts-ignore
                        layer.normalMap = EditorExtends.serialize.asAsset(binaryLayer.normalMapId, cc_1.Texture2D);
                    }
                    layer.metallic = binaryLayer.metallic;
                    layer.roughness = binaryLayer.roughness;
                    terrainAsset.layerInfos[i] = layer;
                }
            }
            terrainAsset.name = asset.basename;
            terrainAsset._setRawAsset('.bin');
            const serializeJSON = EditorExtends.serialize(terrainAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TerrainHandler;
