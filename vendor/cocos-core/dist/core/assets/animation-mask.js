"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAnimationMask = queryAnimationMask;
exports.importAnimationMaskSkeleton = importAnimationMaskSkeleton;
exports.clearAnimationMaskNodes = clearAnimationMaskNodes;
exports.changeAnimationMaskDump = changeAnimationMaskDump;
exports.saveAnimationMask = saveAnimationMask;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const asset_1 = __importDefault(require("./manager/asset"));
const animation_mask_utils_1 = require("./animation-mask-utils");
const ANIMATION_MASK_SERIALIZED_TYPE = 'cc.animation.AnimationMask';
const ANIMATION_MASK_ASSET_TYPE = 'cc.AnimationMask';
function ensureAnimationMaskAsset(asset, id) {
    if (!asset) {
        throw new Error(`AnimationMask asset not found: ${id}`);
    }
    const type = asset_1.default.queryAssetProperty(asset, 'type');
    if (type !== ANIMATION_MASK_ASSET_TYPE && type !== animation_mask_utils_1.ANIMATION_MASK_TYPE) {
        throw new Error(`Asset is not an AnimationMask: ${id}`);
    }
    if (!(asset instanceof asset_db_1.Asset) || !asset.source) {
        throw new Error(`AnimationMask asset must be a source asset: ${id}`);
    }
    return asset;
}
function ensureReadonly(value) {
    throw new Error(`Unsupported AnimationMask source content: ${String(value)}`);
}
function getLibraryJSONPath(asset) {
    if (!asset.library) {
        throw new Error(`Asset has no imported library JSON: ${asset.uuid}`);
    }
    return `${asset.library}.json`;
}
function resolveSkeletonSourceAsset(id) {
    const asset = asset_1.default.queryAsset(id);
    if (!asset) {
        throw new Error(`Skeleton source asset not found: ${id}`);
    }
    const importer = asset.meta?.importer;
    if (importer === 'gltf' || importer === 'fbx') {
        const gltfScenes = Object.values(asset.subAssets || {})
            .filter((subAsset) => subAsset.meta?.importer === 'gltf-scene');
        if (!gltfScenes.length) {
            throw new Error(`glTF source has no gltf-scene sub asset: ${id}`);
        }
        return gltfScenes[0];
    }
    if (importer !== 'prefab' && importer !== 'gltf-scene') {
        throw new Error(`Skeleton source must be a Prefab or glTF scene: ${id}`);
    }
    const type = asset_1.default.queryAssetProperty(asset, 'type');
    if (type !== animation_mask_utils_1.PREFAB_TYPE) {
        throw new Error(`Skeleton source is not a Prefab asset: ${id}`);
    }
    return asset;
}
async function readAnimationMaskSource(asset) {
    const source = asset.source;
    if (!source) {
        return ensureReadonly(asset.uuid);
    }
    const data = await (0, fs_extra_1.readJSON)(source);
    (0, animation_mask_utils_1.assertRecord)(data, `Invalid AnimationMask JSON: ${source}`);
    if (data.__type__ !== ANIMATION_MASK_SERIALIZED_TYPE) {
        throw new Error(`Invalid AnimationMask type: ${String(data.__type__)}`);
    }
    return data;
}
async function writeAnimationMaskSource(asset, data) {
    const source = asset.source;
    if (!source) {
        return ensureReadonly(asset.uuid);
    }
    await asset_1.default.saveAsset(asset.uuid, JSON.stringify(data, undefined, 2));
}
async function readPrefabJSON(asset) {
    const file = asset instanceof asset_db_1.Asset ? asset.source : getLibraryJSONPath(asset);
    const data = await (0, fs_extra_1.readJSON)(file);
    if (!Array.isArray(data)) {
        throw new Error(`Invalid Prefab JSON: ${file}`);
    }
    if (!data[0] || data[0].__type__ !== animation_mask_utils_1.PREFAB_TYPE) {
        throw new Error(`Invalid Prefab asset type: ${file}`);
    }
    return data;
}
async function queryAnimationMask(uuid) {
    const asset = ensureAnimationMaskAsset(asset_1.default.queryAsset(uuid), uuid);
    const data = await readAnimationMaskSource(asset);
    return (0, animation_mask_utils_1.jointMasksToDump)(asset.uuid, (0, animation_mask_utils_1.normalizeJointMasks)(data._jointMasks));
}
async function importAnimationMaskSkeleton(uuid, skeletonSourceUuid) {
    const maskAsset = ensureAnimationMaskAsset(asset_1.default.queryAsset(uuid), uuid);
    const sourceAsset = resolveSkeletonSourceAsset(skeletonSourceUuid);
    const maskData = await readAnimationMaskSource(maskAsset);
    const currentMasks = (0, animation_mask_utils_1.normalizeJointMasks)(maskData._jointMasks);
    const currentPathSet = new Set(currentMasks.map((joint) => joint.path));
    const importedPaths = (0, animation_mask_utils_1.extractPrefabJointPaths)(await readPrefabJSON(sourceAsset));
    for (const path of importedPaths) {
        if (!currentPathSet.has(path)) {
            currentMasks.push({ __type__: animation_mask_utils_1.JOINT_MASK_TYPE, path, enabled: true });
            currentPathSet.add(path);
        }
    }
    maskData._jointMasks = currentMasks;
    await writeAnimationMaskSource(maskAsset, maskData);
    return (0, animation_mask_utils_1.jointMasksToDump)(maskAsset.uuid, currentMasks);
}
async function clearAnimationMaskNodes(uuid) {
    const asset = ensureAnimationMaskAsset(asset_1.default.queryAsset(uuid), uuid);
    const data = await readAnimationMaskSource(asset);
    data._jointMasks = [];
    await writeAnimationMaskSource(asset, data);
    return (0, animation_mask_utils_1.jointMasksToDump)(asset.uuid, []);
}
async function changeAnimationMaskDump(uuid, changes) {
    const asset = ensureAnimationMaskAsset(asset_1.default.queryAsset(uuid), uuid);
    const data = await readAnimationMaskSource(asset);
    const nextMasks = (0, animation_mask_utils_1.applyJointChanges)((0, animation_mask_utils_1.normalizeJointMasks)(data._jointMasks), changes);
    data._jointMasks = nextMasks;
    await writeAnimationMaskSource(asset, data);
    return (0, animation_mask_utils_1.jointMasksToDump)(asset.uuid, nextMasks);
}
async function saveAnimationMask(uuid) {
    const asset = ensureAnimationMaskAsset(asset_1.default.queryAsset(uuid), uuid);
    const data = await readAnimationMaskSource(asset);
    await writeAnimationMaskSource(asset, {
        ...data,
        _jointMasks: (0, animation_mask_utils_1.normalizeJointMasks)(data._jointMasks),
    });
}
