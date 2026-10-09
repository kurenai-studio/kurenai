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
exports.handleJsonGroup = handleJsonGroup;
exports.outputJsonGroup = outputJsonGroup;
const path_1 = require("path");
const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");
const json_group_1 = require("../json-group");
const HashUuid = __importStar(require("../../utils/hash-uuid"));
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../../../../share/utils");
const cc_1 = require("cc");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
async function handleJsonGroup(bundle) {
    console.debug(`handle json group in bundle ${bundle.name}`);
    // 不压缩
    if (bundle.compressionType === bundle_utils_1.BundleCompressionTypes.NONE) {
        return;
    }
    if (bundle.compressionType === bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON) {
        // 全部压缩为一个 json
        bundle.addGroup('NORMAL', bundle.assetsWithoutRedirect);
    }
    else {
        // 分组信息存放位置
        const groups = {};
        const hasInGroup = [];
        const textureUuids = [];
        // 每个根资源与场景生成一个分组
        // 默认情况下将会尽量的合并分组，被 Bundle 内其他根资源依赖的根资源不独立成组
        for (const uuid of bundle.assetsWithoutRedirect) {
            const assetInfo = asset_library_1.buildAssetLibrary.getAsset(uuid);
            const assetType = asset_library_1.buildAssetLibrary.getAssetProperty(assetInfo, 'type');
            if (assetType == 'cc.Texture2D') {
                textureUuids.push(assetInfo.uuid);
                continue;
            }
            let groupUuids = await (0, json_group_1.walk)(assetInfo, bundle);
            if (groupUuids.length <= 1) {
                continue;
            }
            // 过滤已经在其他分组内的依赖资源 uuid
            groupUuids = groupUuids.filter((uuid) => !hasInGroup.includes(uuid));
            if (groupUuids.length <= 1) {
                continue;
            }
            hasInGroup.push(...groupUuids);
            groups[uuid] = groupUuids;
        }
        if (textureUuids.length > 1) {
            textureUuids.sort(utils_1.compareUUID);
            bundle.addGroup('TEXTURE', textureUuids);
        }
        Object.keys(groups).forEach((rootUuid) => {
            const groupUuids = groups[rootUuid];
            if (!groupUuids) {
                return;
            }
            const uudis = JSON.parse(JSON.stringify(groupUuids));
            uudis.forEach((uuid) => {
                if (rootUuid === uuid) {
                    return;
                }
                if (groups[uuid]) {
                    console.debug(`remove group uuid ${uuid}`);
                    delete groups[uuid];
                }
            });
        });
        // 重新计算分组
        // const arr = splitGroups(groups, true);
        Object.values(groups).forEach((uuids, index) => {
            // 过滤掉只有一个资源的数组
            if (uuids.length <= 1) {
                return;
            }
            bundle.addGroup('NORMAL', uuids);
        });
    }
    console.debug(`handle json group in bundle ${bundle.name} success`);
}
async function outputJsonGroup(bundle, manager) {
    const dest = (0, path_1.join)(bundle.dest, bundle.importBase);
    console.debug(`Handle all json groups in bundle ${bundle.name}`);
    let hasBuild = [];
    // 循环分组，计算每个分组的 hash 值
    const uuids = [];
    bundle.groups.forEach((group) => {
        uuids.push(group.uuids);
        if (group.uuids.length <= 1) {
            return;
        }
        hasBuild = hasBuild.concat(group.uuids);
    });
    const hasBuildSet = new Set(hasBuild);
    const hashUuids = HashUuid.calculate(uuids, HashUuid.BuiltinHashType.PackedAssets);
    // 循环分组，执行实际处理
    console.debug('handle json group');
    const assetSerializeOptions = {
        debug: manager.options.debug,
        ...manager.options.assetSerializeOptions,
    };
    for (let index = 0; index < bundle.groups.length; index++) {
        const group = bundle.groups[index];
        if (group.uuids.length <= 1) {
            continue;
        }
        // 分组名设置成当时的 hash 名字，并将 assets 进行排序
        group.name = hashUuids[index];
        group.uuids.sort(utils_1.compareUUID);
        bundle.addAssetWithUuid(group.name);
        hasBuildSet.add(group.name);
        // 如果分组类型不是 type，则跳过，这里可能是 spriteFrame 或者 texture
        if (group.type === 'TEXTURE') {
            await packTextures(dest, hashUuids[index], group);
            continue;
        }
        if (group.type === 'IMAGE') {
            await packImageAsset(dest, hashUuids[index], group);
            continue;
        }
        if (group.type !== 'NORMAL') {
            continue;
        }
        // 去重
        // group.uuids = Array.from(new Set(groupItem.jsonUuids));
        // 拼接 json 数据
        let jsons = [];
        const realUuids = [];
        group.uuids.sort();
        for (let i = 0; i < group.uuids.length; i++) {
            const assetInfo = asset_library_1.buildAssetLibrary.getAsset(group.uuids[i]);
            if (assetInfo && (!assetInfo.meta.files.includes('.json'))) {
                // 分组塞 uuid 时并不会判断是否有 json，这里需要过滤
                continue;
            }
            const json = await manager.cache.getSerializedJSON(group.uuids[i], assetSerializeOptions);
            if (!json) {
                console.error(i18n_1.default.t('builder.error.get_asset_json_failed', {
                    url: assetInfo.url,
                    type: asset_library_1.buildAssetLibrary.getAssetProperty(assetInfo, 'type'),
                }));
                continue;
            }
            realUuids.push(group.uuids[i]);
            jsons.push(json);
        }
        group.uuids = realUuids;
        jsons = JSON.parse(JSON.stringify(jsons));
        jsons = EditorExtends.serializeCompiled.packJSONs(jsons);
        await outputSerializeJSON(dest, hashUuids[index], jsons);
        // 输出部分信息
        console.debug(`Json group(${group.name}) compile success，json number: ${jsons.length}`);
    }
    console.debug('handle single json');
    // 循环所有需要输出的资源，打印单个 json 数据
    for (const uuid of bundle.assetsWithoutRedirect) {
        if (hasBuildSet.has(uuid)) {
            continue;
        }
        // 只有一个 uuid 的分组按照原来的规则生成
        const json = await manager.cache.getSerializedJSON(uuid, assetSerializeOptions);
        if (!json) {
            continue;
        }
        // Hack 输出 uuid 不一定和原始 uuid 一样，特殊字符打包出来的 uuid 要与 library 里的一致
        const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
        let destName = uuid;
        // 资源 asset 不一定存在，因为有可能是类似于合图这样新生成的资源数据
        if (asset && asset.library && asset.meta.files.includes('.json')) {
            destName = (0, path_1.basename)(asset.library);
        }
        await outputSerializeJSON(dest, destName, json);
    }
    bundle.groups.forEach((group) => {
        if (group.name) {
            bundle.addAssetWithUuid(group.name);
        }
    });
    /**
     * 合并 imageAsset 序列化信息
     */
    async function packImageAsset(dest, name, groupItem) {
        const values = await Promise.all(groupItem.uuids.map(async (uuid) => {
            const data = await manager.cache.getSerializedJSON(uuid, assetSerializeOptions);
            if (!data) {
                console.error(`Can't get SerializedJSON of asset {asset(${uuid})}`);
            }
            return data;
        }));
        const packedData = {
            type: cc_1.js.getClassId(cc_1.ImageAsset),
            data: values,
        };
        await outputSerializeJSON(dest, name, packedData);
    }
    /**
     * 合并 texture 资源
     * @param groupItem
     */
    async function packTextures(dest, name, groupItem) {
        const jsons = await Promise.all(groupItem.uuids.map(async (uuid) => {
            const data = await manager.cache.getSerializedJSON(uuid, assetSerializeOptions);
            if (!data) {
                console.error(`Can't get SerializedJSON of asset {asset(${uuid})}`);
            }
            return data;
        }));
        const values = jsons.map((json) => {
            // @ts-ignore
            const { base, mipmaps } = EditorExtends.serializeCompiled.getRootData(json);
            return [base, mipmaps];
        });
        const packedData = {
            type: cc_1.js.getClassId(cc_1.Texture2D),
            data: values,
        };
        await outputSerializeJSON(dest, name, packedData);
    }
    async function outputSerializeJSON(dest, name, json) {
        // 将拼接好的数据，实际写到指定位置
        const path = (0, path_1.join)(dest, name.substr(0, 2), name + '.json');
        // json = _compressJson(json);
        await (0, fs_extra_1.outputJSON)(path, json);
    }
}
