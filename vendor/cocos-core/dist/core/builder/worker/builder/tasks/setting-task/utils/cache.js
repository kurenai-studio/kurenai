'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const fs_extra_1 = require("fs-extra");
/**
 * 根据缓存地址还原 settings 数据
 * @param options
 * @param settings
 */
async function handle(settingDest) {
    const cacheSettings = await (0, fs_extra_1.readJSON)(settingDest);
    if (!cacheSettings) {
        console.error('can\'t get cache settings...');
        return;
    }
    const uuids = cacheSettings.uuids;
    const rawAssets = cacheSettings.rawAssets;
    const assetTypes = cacheSettings.assetTypes;
    const realRawAssets = cacheSettings.rawAssets = {};
    for (const mount in rawAssets) {
        const entries = rawAssets[mount];
        const realEntries = realRawAssets[mount] = {};
        for (const id in entries) {
            const entry = entries[id];
            const type = entry[1];
            // retrieve minified raw asset
            if (typeof type === 'number') {
                entry[1] = assetTypes[type];
            }
            // retrieve uuid
            realEntries[uuids[id] || id] = entry;
        }
    }
    const scenes = cacheSettings.scenes;
    for (let i = 0; i < scenes.length; ++i) {
        const scene = scenes[i];
        if (typeof scene.uuid === 'number') {
            scene.uuid = uuids[scene.uuid];
        }
    }
    const packedAssets = cacheSettings.packedAssets;
    for (const packId in packedAssets) {
        const packedIds = packedAssets[packId];
        for (let j = 0; j < packedIds.length; ++j) {
            if (typeof packedIds[j] === 'number') {
                packedIds[j] = uuids[packedIds[j]];
            }
        }
    }
    const subpackages = cacheSettings.subpackages;
    for (const subId in subpackages) {
        const uuidArray = subpackages[subId].uuids;
        if (uuidArray) {
            for (let k = 0, l = uuidArray.length; k < l; k++) {
                if (typeof uuidArray[k] === 'number') {
                    uuidArray[k] = uuids[uuidArray[k]];
                }
            }
        }
    }
    return cacheSettings;
}
