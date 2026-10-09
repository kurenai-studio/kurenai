"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortBundleInPac = sortBundleInPac;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
function sortBundleInPac(bundles, atlas, pacInfo, dependedAssets, imageCompressManager) {
    const { removeTextureInBundle, removeImageInBundle, removeSpriteAtlasInBundle } = pacInfo.packOptions;
    let firstBundleContainAtlasImage = null;
    const bundlesWithSamePriority = [];
    // 一个 AutoAtlas 可能会生成多张大图
    const imageUuid = atlas.imageUuid;
    const textureUuid = atlas.textureUuid;
    for (const bundle of bundles) {
        if (!bundle.output) {
            continue;
        }
        const taskResult = bundle.atlasRes;
        const assets = bundle.assetsWithoutRedirect;
        const assetsMap = new Set(assets);
        if (!assetsMap.has(pacInfo.uuid) &&
            !pacInfo.spriteFrames.find((x) => assetsMap.has(x._uuid))) {
            continue;
        }
        const spriteFrameUuids = [];
        const inBundle = pacInfo.path.startsWith(bundle.root + '/');
        if (inBundle) {
            console.debug(`Asset {asset(${pacInfo.path})} is Bundle`);
        }
        for (const spriteFrameInfo of atlas.spriteFrameInfos) {
            if (bundle.getRedirect(spriteFrameInfo.uuid)) {
                continue;
            }
            bundle.addAssetWithUuid(spriteFrameInfo.uuid);
            // 将小图信息从原有分组中删除
            bundle.removeFromGroups(spriteFrameInfo.uuid);
            if (!dependedAssets[spriteFrameInfo.textureUuid] && (removeTextureInBundle || !inBundle)) {
                bundle.removeAsset(spriteFrameInfo.textureUuid);
            }
            else if (dependedAssets[spriteFrameInfo.textureUuid] && !inBundle) {
                // 自动图集内的 texture 资源被使用后不剔除，但需要警告
                // https://github.com/cocos-creator/3d-tasks/issues/4014
                console.warn(i18n_1.default.t('builder.tips.use_texture_in_atlas', {
                    info: `{asset(${spriteFrameInfo.textureUuid})}`,
                    useInfo: `{asset(${dependedAssets[spriteFrameInfo.textureUuid].toString()})}`,
                }));
            }
            // !dependedAssets[spriteFrameInfo.textureUuid]: 由于 texture 与 image 之间的依赖关系，当 texture 被引用时，image 也不能剔除
            if (!dependedAssets[spriteFrameInfo.imageUuid] && (removeImageInBundle || !inBundle) && !dependedAssets[spriteFrameInfo.textureUuid]) {
                bundle.removeAsset(spriteFrameInfo.imageUuid);
                // 移除 image 碎图后，需要删除原有纹理压缩任务
                imageCompressManager && imageCompressManager.removeTask(spriteFrameInfo.imageUuid);
            }
            else if (dependedAssets[spriteFrameInfo.imageUuid] && !inBundle) {
                // 自动图集内的 image 资源被使用后不剔除，但需要警告
                // https://github.com/cocos-creator/3d-tasks/issues/4014
                console.warn(i18n_1.default.t('builder.tips.use_image_in_atlas', {
                    info: `{asset(${spriteFrameInfo.imageUuid})}`,
                    useInfo: `{asset(${dependedAssets[spriteFrameInfo.imageUuid].toString()})}`,
                }));
            }
            spriteFrameUuids.push(spriteFrameInfo.uuid);
            taskResult.assetsToImage[spriteFrameInfo.uuid] = imageUuid;
            taskResult.assetsToImage[spriteFrameInfo.imageUuid] = imageUuid;
        }
        // 大图按照优先级进行存放，如果已经有了一个 bundle 包含此大图且那个 bundle 的优先级高于此 bundle, 那存储一个 redirect 即可
        // 参考 https://github.com/cocos-creator/3d-tasks/issues/6352
        if (!firstBundleContainAtlasImage || firstBundleContainAtlasImage.priority === bundle.priority) {
            bundle.addAssetWithUuid(imageUuid);
            bundle.addAssetWithUuid(textureUuid);
            if (bundle.compressionType === bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON) {
                if (!bundle.groups[0]) {
                    bundle.addGroup('NORMAL', [imageUuid, textureUuid]);
                }
                else {
                    bundle.groups[0].uuids.push(imageUuid, textureUuid);
                }
            }
            else if (bundle.compressionType !== bundle_utils_1.BundleCompressionTypes.NONE) {
                bundle.addToGroup('IMAGE', imageUuid);
                bundle.addToGroup('TEXTURE', textureUuid);
            }
            const pacAssetInfo = asset_library_1.buildAssetLibrary.getAsset(pacInfo.uuid);
            let taskInfo = null;
            if (pacAssetInfo.meta.userData.compressSettings && imageCompressManager) {
                // 添加大图压缩任务
                taskInfo = imageCompressManager.genTaskInfoFromAssetInfo(pacAssetInfo);
                if (taskInfo) {
                    // 此处需要取合图实际文件的 mtime ，单纯合图资源的 mtime 信息不能包含小图的修改情况
                    taskInfo.mtime = (0, fs_extra_1.statSync)(atlas.imagePath).mtime.getTime();
                    bundle.compressTask[atlas.imageUuid] = imageCompressManager.addTask(atlas.imageUuid, {
                        ...taskInfo,
                        src: atlas.imagePath,
                    });
                }
            }
            // 如果没有压缩纹理任务，默认使用原图
            if (!taskInfo) {
                const dest = (0, path_1.join)(bundle.dest, bundle.nativeBase, imageUuid.slice(0, 2), imageUuid + (0, path_1.extname)(atlas.imagePath));
                (0, fs_extra_1.copySync)(atlas.imagePath, dest);
            }
            if (!firstBundleContainAtlasImage) {
                firstBundleContainAtlasImage = bundle;
            }
            else {
                bundlesWithSamePriority.push(bundle.root);
            }
        }
        else {
            bundle.addRedirect(textureUuid, firstBundleContainAtlasImage.name);
        }
        const groupUuids = [...spriteFrameUuids];
        if (assetsMap.has(pacInfo.uuid)) {
            if (!dependedAssets[pacInfo.uuid] && (!inBundle || removeSpriteAtlasInBundle)) {
                bundle.removeAsset(pacInfo.uuid);
                console.debug(`remove spriteAtlas._uuid : {asset(${pacInfo.uuid})}`);
            }
            else if (dependedAssets[pacInfo.uuid] || inBundle) {
                groupUuids.push(pacInfo.uuid);
            }
        }
        if (bundle.compressionType === bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON) {
            if (!bundle.groups[0]) {
                bundle.addGroup('NORMAL', groupUuids);
            }
            else {
                bundle.groups[0].uuids.push(...groupUuids);
            }
        }
        else if (bundle.compressionType !== bundle_utils_1.BundleCompressionTypes.NONE) {
            bundle.addGroup('NORMAL', groupUuids);
        }
        // // 收集信息
        taskResult.imageToAtlas[imageUuid] = pacInfo.uuid;
        taskResult.assetsToImage[textureUuid] = imageUuid;
        if (!taskResult.atlasToImages[pacInfo.uuid]) {
            taskResult.atlasToImages[pacInfo.uuid] = [];
        }
        taskResult.atlasToImages[pacInfo.uuid].push(imageUuid);
    }
    if (firstBundleContainAtlasImage && bundlesWithSamePriority.length) {
        console.warn(i18n_1.default.t('builder.warn.repeat_atlas_in_bundle', {
            Atlas: pacInfo.path,
            bundle1: firstBundleContainAtlasImage.root,
            bundle2: bundlesWithSamePriority.toString(),
        }));
    }
}
