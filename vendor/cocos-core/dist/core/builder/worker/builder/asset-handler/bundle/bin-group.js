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
exports.previewBinGroup = previewBinGroup;
exports.handleBinGroup = handleBinGroup;
exports.outputBinGroup = outputBinGroup;
const path_1 = require("path");
const asset_library_1 = require("../../manager/asset-library");
const cconb_1 = require("../../utils/cconb");
const fs_extra_1 = require("fs-extra");
const HashUuid = __importStar(require("../../utils/hash-uuid"));
const utils_1 = require("../../../../share/utils");
const bin_package_pack_1 = require("./bin-package-pack");
const PACK_FILE_TYPE_LIST = ['cc.AnimationClip'];
const KB = 1024;
// 预览bundle对bin文件合并以后的效果, 可用于调试, 也可用于以后editor做界面预览展示给用户查看合并效果
async function previewBinGroup(bundle, threshold) {
    const uuidList = [];
    const sizeList = [];
    let totalSize = 0;
    const analyzeResult = await Promise.all(bundle.assetsWithoutRedirect.map(uuid => analyzePack(uuid, threshold)));
    analyzeResult.forEach(output => {
        if (!output.shouldPack)
            return;
        uuidList.push(output.uuid);
        sizeList.push(output.size);
        totalSize += output.size;
    });
    return { uuidList, sizeList, totalSize };
}
async function handleBinGroup(bundle, config) {
    if (!config || !config.enable) {
        return;
    }
    console.debug(`Handle binary group in bundle ${bundle.name}: start`);
    const threshold = config.threshold * KB;
    const uuids = (await previewBinGroup(bundle, threshold)).uuidList;
    if (uuids.length <= 1) {
        console.debug(`Handle binary group in bundle ${bundle.name}: no need to handle`);
        return;
    }
    uuids.sort(utils_1.compareUUID);
    bundle.addGroup('BIN', uuids, HashUuid.calculate([uuids], HashUuid.BuiltinHashType.PackedAssets)[0]);
    console.debug(`Handle binary group in bundle ${bundle.name}: success`);
}
async function outputBinGroup(bundle, config) {
    if (!config || !config.enable) {
        return;
    }
    const group = bundle.groups.find(group => group.type == 'BIN');
    if (!group) {
        return;
    }
    await outputOneBinGroup(group, bundle);
}
async function getAssetSize(asset) {
    const path = (0, cconb_1.getCCONFormatAssetInLibrary)(asset);
    return (await (0, fs_extra_1.stat)(path)).size;
}
async function analyzePack(uuid, threshold) {
    const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
    const assetType = asset_library_1.buildAssetLibrary.getAssetProperty(asset, 'type');
    if (!PACK_FILE_TYPE_LIST.includes(assetType)) {
        return { uuid, shouldPack: false, size: 0 };
    }
    const size = await getAssetSize(asset);
    return { uuid, shouldPack: size <= threshold, size };
}
function getOutputFilePath(bundle, uuid) {
    return (0, path_1.join)(bundle.dest, bundle.importBase, uuid.slice(0, 2), uuid + '.bin');
}
async function outputOneBinGroup(group, bundle) {
    console.debug(`output bin groups in bundle ${bundle.name} start`);
    bundle.addAssetWithUuid(group.name);
    const buffers = await Promise.all(group.uuids.map(uuid => {
        const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
        const path = (0, cconb_1.getCCONFormatAssetInLibrary)(asset);
        return (0, fs_extra_1.readFile)(path);
    }));
    const packedBin = (0, bin_package_pack_1.binPackagePack)(buffers.map(buffer => new Uint8Array(buffer).buffer));
    await (0, fs_extra_1.outputFile)(getOutputFilePath(bundle, group.name), new Uint8Array(packedBin));
}
