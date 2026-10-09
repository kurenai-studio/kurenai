"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleDataTask = bundleDataTask;
exports.bundleOutputTask = bundleOutputTask;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const asset_library_1 = require("../../manager/asset-library");
function bundleDataTask(bundle, imageCompressManager) {
    bundle.assetsWithoutRedirect.forEach((uuid) => {
        const assetInfo = asset_library_1.buildAssetLibrary.getAsset(uuid);
        const task = imageCompressManager.addTaskWithAssetInfo(assetInfo);
        if (task) {
            bundle.compressTask[assetInfo.uuid] = task;
        }
    });
    console.debug(`init image compress task ${Object.keys(bundle.compressTask).length} in bundle ${bundle.name}`);
}
async function bundleOutputTask(bundle, cache) {
    await Promise.all(Object.keys(bundle.compressTask).map(async (uuid) => {
        const task = bundle.compressTask[uuid];
        if (!task.dest || !task.dest.length) {
            // 需要移除任务记录，后续将以此判断压缩任务是否被有效执行
            delete bundle.compressTask[uuid];
            return;
        }
        const realSuffix = [];
        bundle.compressRes[uuid] = [];
        await Promise.all(task.dest.map(async (path, index) => {
            if (!(0, fs_extra_1.existsSync)(path)) {
                return;
            }
            const dest = (0, path_1.join)(bundle.dest, bundle.nativeBase, uuid.substr(0, 2), (0, path_1.basename)(path));
            await (0, fs_extra_1.copy)(path, dest);
            realSuffix.push(task.suffix[index]);
            bundle.compressRes[uuid].push(dest);
        }));
        // 写入新增 instance , 后续进行 json 处理的时候，就能带上这个数据了
        const assetInstance = await cache.getInstance(uuid);
        assetInstance._exportedExts = realSuffix.sort();
        cache.addInstance(assetInstance);
    }));
}
