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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1ncm91cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2J1aWxkZXIvd29ya2VyL2J1aWxkZXIvYXNzZXQtaGFuZGxlci9idW5kbGUvanNvbi1ncm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVlBLDBDQWlFQztBQUVELDBDQTZKQztBQTVPRCwrQkFBc0M7QUFFdEMsaUVBQXdFO0FBQ3hFLCtEQUFnRTtBQUNoRSw4Q0FBcUM7QUFDckMsZ0VBQWtEO0FBQ2xELHVDQUFzQztBQUN0QyxtREFBc0Q7QUFDdEQsMkJBQStDO0FBQy9DLG9FQUE0QztBQUdyQyxLQUFLLFVBQVUsZUFBZSxDQUFDLE1BQWU7SUFDakQsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDNUQsTUFBTTtJQUNOLElBQUksTUFBTSxDQUFDLGVBQWUsS0FBSyxxQ0FBc0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUFDLE9BQU87SUFBQyxDQUFDO0lBQ3ZFLElBQUksTUFBTSxDQUFDLGVBQWUsS0FBSyxxQ0FBc0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNuRSxlQUFlO1FBQ2YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDNUQsQ0FBQztTQUFNLENBQUM7UUFDSixXQUFXO1FBQ1gsTUFBTSxNQUFNLEdBQTZCLEVBQUUsQ0FBQztRQUM1QyxNQUFNLFVBQVUsR0FBYSxFQUFFLENBQUM7UUFDaEMsTUFBTSxZQUFZLEdBQWEsRUFBRSxDQUFDO1FBRWxDLGlCQUFpQjtRQUNqQiw0Q0FBNEM7UUFDNUMsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUM5QyxNQUFNLFNBQVMsR0FBRyxpQ0FBaUIs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QixDQUFDLENBQUMsQ0FDTCxDQUFDO1FBQ0YsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFO1lBQ25DLGFBQWE7WUFDYixNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUUsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sVUFBVSxHQUFHO1lBQ2YsSUFBSSxFQUFFLE9BQUUsQ0FBQyxVQUFVLENBQUMsY0FBUyxDQUFDO1lBQzlCLElBQUksRUFBRSxNQUFNO1NBQ2YsQ0FBQztRQUNGLE1BQU0sbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsS0FBSyxVQUFVLG1CQUFtQixDQUFDLElBQVksRUFBRSxJQUFZLEVBQUUsSUFBUztRQUNwRSxtQkFBbUI7UUFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBQSxXQUFJLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQztRQUMzRCw4QkFBOEI7UUFDOUIsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJ1bmRsZU1hbmFnZXIgfSBmcm9tICcuJztcbmltcG9ydCB7IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZS9idW5kbGUtdXRpbHMnO1xuaW1wb3J0IHsgYnVpbGRBc3NldExpYnJhcnkgfSBmcm9tICcuLi8uLi9tYW5hZ2VyL2Fzc2V0LWxpYnJhcnknO1xuaW1wb3J0IHsgd2FsayB9IGZyb20gJy4uL2pzb24tZ3JvdXAnO1xuaW1wb3J0ICogYXMgSGFzaFV1aWQgZnJvbSAnLi4vLi4vdXRpbHMvaGFzaC11dWlkJztcbmltcG9ydCB7IG91dHB1dEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBjb21wYXJlVVVJRCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlL3V0aWxzJztcbmltcG9ydCB7IEltYWdlQXNzZXQsIGpzLCBUZXh0dXJlMkQgfSBmcm9tICdjYyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgSUJ1bmRsZSwgSUdyb3VwIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVKc29uR3JvdXAoYnVuZGxlOiBJQnVuZGxlKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhgaGFuZGxlIGpzb24gZ3JvdXAgaW4gYnVuZGxlICR7YnVuZGxlLm5hbWV9YCk7XG4gICAgLy8g5LiN5Y6L57ypXG4gICAgaWYgKGJ1bmRsZS5jb21wcmVzc2lvblR5cGUgPT09IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMuTk9ORSkgeyByZXR1cm47IH1cbiAgICBpZiAoYnVuZGxlLmNvbXByZXNzaW9uVHlwZSA9PT0gQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5NRVJHRV9BTExfSlNPTikge1xuICAgICAgICAvLyDlhajpg6jljovnvKnkuLrkuIDkuKoganNvblxuICAgICAgICBidW5kbGUuYWRkR3JvdXAoJ05PUk1BTCcsIGJ1bmRsZS5hc3NldHNXaXRob3V0UmVkaXJlY3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIOWIhue7hOS/oeaBr+WtmOaUvuS9jee9rlxuICAgICAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuICAgICAgICBjb25zdCBoYXNJbkdyb3VwOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCB0ZXh0dXJlVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgLy8g5q+P5Liq5qC56LWE5rqQ5LiO5Zy65pmv55Sf5oiQ5LiA5Liq5YiG57uEXG4gICAgICAgIC8vIOm7mOiupOaDheWGteS4i+WwhuS8muWwvemHj+eahOWQiOW5tuWIhue7hO+8jOiiqyBCdW5kbGUg5YaF5YW25LuW5qC56LWE5rqQ5L6d6LWW55qE5qC56LWE5rqQ5LiN54us56uL5oiQ57uEXG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBidW5kbGUuYXNzZXRzV2l0aG91dFJlZGlyZWN0KSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0VHlwZSA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0UHJvcGVydHkoYXNzZXRJbmZvLCAndHlwZScpO1xuICAgICAgICAgICAgaWYgKGFzc2V0VHlwZSA9PSAnY2MuVGV4dHVyZTJEJykge1xuICAgICAgICAgICAgICAgIHRleHR1cmVVdWlkcy5wdXNoKGFzc2V0SW5mby51dWlkKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBncm91cFV1aWRzID0gYXdhaXQgd2Fsayhhc3NldEluZm8sIGJ1bmRsZSk7XG4gICAgICAgICAgICBpZiAoZ3JvdXBVdWlkcy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g6L+H5ruk5bey57uP5Zyo5YW25LuW5YiG57uE5YaF55qE5L6d6LWW6LWE5rqQIHV1aWRcbiAgICAgICAgICAgIGdyb3VwVXVpZHMgPSBncm91cFV1aWRzLmZpbHRlcigodXVpZCkgPT4gIWhhc0luR3JvdXAuaW5jbHVkZXModXVpZCkpO1xuICAgICAgICAgICAgaWYgKGdyb3VwVXVpZHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhhc0luR3JvdXAucHVzaCguLi5ncm91cFV1aWRzKTtcbiAgICAgICAgICAgIGdyb3Vwc1t1dWlkXSA9IGdyb3VwVXVpZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHR1cmVVdWlkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0ZXh0dXJlVXVpZHMuc29ydChjb21wYXJlVVVJRCk7XG4gICAgICAgICAgICBidW5kbGUuYWRkR3JvdXAoJ1RFWFRVUkUnLCB0ZXh0dXJlVXVpZHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmtleXMoZ3JvdXBzKS5mb3JFYWNoKChyb290VXVpZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZ3JvdXBVdWlkcyA9IGdyb3Vwc1tyb290VXVpZF07XG4gICAgICAgICAgICBpZiAoIWdyb3VwVXVpZHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB1dWRpczogc3RyaW5nW10gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdyb3VwVXVpZHMpKTtcbiAgICAgICAgICAgIHV1ZGlzLmZvckVhY2goKHV1aWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocm9vdFV1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZ3JvdXBzW3V1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYHJlbW92ZSBncm91cCB1dWlkICR7dXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdyb3Vwc1t1dWlkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g6YeN5paw6K6h566X5YiG57uEXG4gICAgICAgIC8vIGNvbnN0IGFyciA9IHNwbGl0R3JvdXBzKGdyb3VwcywgdHJ1ZSk7XG4gICAgICAgIE9iamVjdC52YWx1ZXMoZ3JvdXBzKS5mb3JFYWNoKCh1dWlkcywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIC8vIOi/h+a7pOaOieWPquacieS4gOS4qui1hOa6kOeahOaVsOe7hFxuICAgICAgICAgICAgaWYgKHV1aWRzLmxlbmd0aCA8PSAxKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgYnVuZGxlLmFkZEdyb3VwKCdOT1JNQUwnLCB1dWlkcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zb2xlLmRlYnVnKGBoYW5kbGUganNvbiBncm91cCBpbiBidW5kbGUgJHtidW5kbGUubmFtZX0gc3VjY2Vzc2ApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3V0cHV0SnNvbkdyb3VwKGJ1bmRsZTogSUJ1bmRsZSwgbWFuYWdlcjogQnVuZGxlTWFuYWdlcikge1xuICAgIGNvbnN0IGRlc3QgPSBqb2luKGJ1bmRsZS5kZXN0LCBidW5kbGUuaW1wb3J0QmFzZSk7XG4gICAgY29uc29sZS5kZWJ1ZyhgSGFuZGxlIGFsbCBqc29uIGdyb3VwcyBpbiBidW5kbGUgJHtidW5kbGUubmFtZX1gKTtcbiAgICBsZXQgaGFzQnVpbGQ6IHN0cmluZ1tdID0gW107XG4gICAgLy8g5b6q546v5YiG57uE77yM6K6h566X5q+P5Liq5YiG57uE55qEIGhhc2gg5YC8XG4gICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdW10gPSBbXTtcbiAgICBidW5kbGUuZ3JvdXBzLmZvckVhY2goKGdyb3VwKSA9PiB7XG4gICAgICAgIHV1aWRzLnB1c2goZ3JvdXAudXVpZHMpO1xuICAgICAgICBpZiAoZ3JvdXAudXVpZHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBoYXNCdWlsZCA9IGhhc0J1aWxkLmNvbmNhdChncm91cC51dWlkcyk7XG4gICAgfSk7XG4gICAgY29uc3QgaGFzQnVpbGRTZXQgPSBuZXcgU2V0KGhhc0J1aWxkKTtcbiAgICBjb25zdCBoYXNoVXVpZHM6IHN0cmluZ1tdID0gSGFzaFV1aWQuY2FsY3VsYXRlKHV1aWRzLCBIYXNoVXVpZC5CdWlsdGluSGFzaFR5cGUuUGFja2VkQXNzZXRzKTtcbiAgICAvLyDlvqrnjq/liIbnu4TvvIzmiafooYzlrp7pmYXlpITnkIZcbiAgICBjb25zb2xlLmRlYnVnKCdoYW5kbGUganNvbiBncm91cCcpO1xuXG4gICAgY29uc3QgYXNzZXRTZXJpYWxpemVPcHRpb25zID0ge1xuICAgICAgICBkZWJ1ZzogbWFuYWdlci5vcHRpb25zLmRlYnVnLFxuICAgICAgICAuLi5tYW5hZ2VyLm9wdGlvbnMuYXNzZXRTZXJpYWxpemVPcHRpb25zLFxuICAgIH07XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGJ1bmRsZS5ncm91cHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGdyb3VwID0gYnVuZGxlLmdyb3Vwc1tpbmRleF07XG5cbiAgICAgICAgaWYgKGdyb3VwLnV1aWRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDliIbnu4TlkI3orr7nva7miJDlvZPml7bnmoQgaGFzaCDlkI3lrZfvvIzlubblsIYgYXNzZXRzIOi/m+ihjOaOkuW6j1xuICAgICAgICBncm91cC5uYW1lID0gaGFzaFV1aWRzW2luZGV4XTtcbiAgICAgICAgZ3JvdXAudXVpZHMuc29ydChjb21wYXJlVVVJRCk7XG4gICAgICAgIGJ1bmRsZS5hZGRBc3NldFdpdGhVdWlkKGdyb3VwLm5hbWUpO1xuICAgICAgICBoYXNCdWlsZFNldC5hZGQoZ3JvdXAubmFtZSk7XG4gICAgICAgIC8vIOWmguaenOWIhue7hOexu+Wei+S4jeaYryB0eXBl77yM5YiZ6Lez6L+H77yM6L+Z6YeM5Y+v6IO95pivIHNwcml0ZUZyYW1lIOaIluiAhSB0ZXh0dXJlXG4gICAgICAgIGlmIChncm91cC50eXBlID09PSAnVEVYVFVSRScpIHtcbiAgICAgICAgICAgIGF3YWl0IHBhY2tUZXh0dXJlcyhkZXN0LCBoYXNoVXVpZHNbaW5kZXhdLCBncm91cCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3JvdXAudHlwZSA9PT0gJ0lNQUdFJykge1xuICAgICAgICAgICAgYXdhaXQgcGFja0ltYWdlQXNzZXQoZGVzdCwgaGFzaFV1aWRzW2luZGV4XSwgZ3JvdXApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyb3VwLnR5cGUgIT09ICdOT1JNQUwnKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDljrvph41cbiAgICAgICAgLy8gZ3JvdXAudXVpZHMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZ3JvdXBJdGVtLmpzb25VdWlkcykpO1xuXG4gICAgICAgIC8vIOaLvOaOpSBqc29uIOaVsOaNrlxuICAgICAgICBsZXQganNvbnM6IEFycmF5PGFueSB8IG51bGw+ID0gW107XG4gICAgICAgIGNvbnN0IHJlYWxVdWlkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZ3JvdXAudXVpZHMuc29ydCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLnV1aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldChncm91cC51dWlkc1tpXSk7XG4gICAgICAgICAgICBpZiAoYXNzZXRJbmZvICYmICghYXNzZXRJbmZvLm1ldGEuZmlsZXMuaW5jbHVkZXMoJy5qc29uJykpKSB7XG4gICAgICAgICAgICAgICAgLy8g5YiG57uE5aGeIHV1aWQg5pe25bm25LiN5Lya5Yik5pat5piv5ZCm5pyJIGpzb27vvIzov5nph4zpnIDopoHov4fmu6RcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCBtYW5hZ2VyLmNhY2hlLmdldFNlcmlhbGl6ZWRKU09OKGdyb3VwLnV1aWRzW2ldLCBhc3NldFNlcmlhbGl6ZU9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIuZXJyb3IuZ2V0X2Fzc2V0X2pzb25fZmFpbGVkJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0SW5mby51cmwsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0UHJvcGVydHkoYXNzZXRJbmZvLCAndHlwZScpLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlYWxVdWlkcy5wdXNoKGdyb3VwLnV1aWRzW2ldKTtcbiAgICAgICAgICAgIGpzb25zLnB1c2goanNvbik7XG4gICAgICAgIH1cbiAgICAgICAgZ3JvdXAudXVpZHMgPSByZWFsVXVpZHM7XG4gICAgICAgIGpzb25zID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShqc29ucykpO1xuICAgICAgICBqc29ucyA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplQ29tcGlsZWQucGFja0pTT05zKGpzb25zKTtcbiAgICAgICAgYXdhaXQgb3V0cHV0U2VyaWFsaXplSlNPTihkZXN0LCBoYXNoVXVpZHNbaW5kZXhdLCBqc29ucyk7XG4gICAgICAgIC8vIOi+k+WHuumDqOWIhuS/oeaBr1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBKc29uIGdyb3VwKCR7Z3JvdXAubmFtZX0pIGNvbXBpbGUgc3VjY2Vzc++8jGpzb24gbnVtYmVyOiAke2pzb25zLmxlbmd0aH1gKTtcbiAgICB9XG4gICAgY29uc29sZS5kZWJ1ZygnaGFuZGxlIHNpbmdsZSBqc29uJyk7XG4gICAgLy8g5b6q546v5omA5pyJ6ZyA6KaB6L6T5Ye655qE6LWE5rqQ77yM5omT5Y2w5Y2V5LiqIGpzb24g5pWw5o2uXG4gICAgZm9yIChjb25zdCB1dWlkIG9mIGJ1bmRsZS5hc3NldHNXaXRob3V0UmVkaXJlY3QpIHtcbiAgICAgICAgaWYgKGhhc0J1aWxkU2V0Lmhhcyh1dWlkKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlj6rmnInkuIDkuKogdXVpZCDnmoTliIbnu4TmjInnhafljp/mnaXnmoTop4TliJnnlJ/miJBcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IG1hbmFnZXIuY2FjaGUuZ2V0U2VyaWFsaXplZEpTT04odXVpZCwgYXNzZXRTZXJpYWxpemVPcHRpb25zKTtcbiAgICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhY2sg6L6T5Ye6IHV1aWQg5LiN5LiA5a6a5ZKM5Y6f5aeLIHV1aWQg5LiA5qC377yM54m55q6K5a2X56ym5omT5YyF5Ye65p2l55qEIHV1aWQg6KaB5LiOIGxpYnJhcnkg6YeM55qE5LiA6Ie0XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGxldCBkZXN0TmFtZSA9IHV1aWQ7XG4gICAgICAgIC8vIOi1hOa6kCBhc3NldCDkuI3kuIDlrprlrZjlnKjvvIzlm6DkuLrmnInlj6/og73mmK/nsbvkvLzkuo7lkIjlm77ov5nmoLfmlrDnlJ/miJDnmoTotYTmupDmlbDmja5cbiAgICAgICAgaWYgKGFzc2V0ICYmIGFzc2V0LmxpYnJhcnkgJiYgYXNzZXQubWV0YS5maWxlcy5pbmNsdWRlcygnLmpzb24nKSkge1xuICAgICAgICAgICAgZGVzdE5hbWUgPSBiYXNlbmFtZShhc3NldC5saWJyYXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBvdXRwdXRTZXJpYWxpemVKU09OKGRlc3QsIGRlc3ROYW1lLCBqc29uKTtcbiAgICB9XG5cbiAgICBidW5kbGUuZ3JvdXBzLmZvckVhY2goKGdyb3VwKSA9PiB7XG4gICAgICAgIGlmIChncm91cC5uYW1lKSB7XG4gICAgICAgICAgICBidW5kbGUuYWRkQXNzZXRXaXRoVXVpZChncm91cC5uYW1lKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICog5ZCI5bm2IGltYWdlQXNzZXQg5bqP5YiX5YyW5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgZnVuY3Rpb24gcGFja0ltYWdlQXNzZXQoZGVzdDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGdyb3VwSXRlbTogSUdyb3VwKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgZ3JvdXBJdGVtLnV1aWRzLm1hcChhc3luYyAodXVpZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBtYW5hZ2VyLmNhY2hlLmdldFNlcmlhbGl6ZWRKU09OKHV1aWQsIGFzc2V0U2VyaWFsaXplT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENhbid0IGdldCBTZXJpYWxpemVkSlNPTiBvZiBhc3NldCB7YXNzZXQoJHt1dWlkfSl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHBhY2tlZERhdGEgPSB7XG4gICAgICAgICAgICB0eXBlOiBqcy5nZXRDbGFzc0lkKEltYWdlQXNzZXQpLFxuICAgICAgICAgICAgZGF0YTogdmFsdWVzLFxuICAgICAgICB9O1xuICAgICAgICBhd2FpdCBvdXRwdXRTZXJpYWxpemVKU09OKGRlc3QsIG5hbWUsIHBhY2tlZERhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQiOW5tiB0ZXh0dXJlIOi1hOa6kFxuICAgICAqIEBwYXJhbSBncm91cEl0ZW1cbiAgICAgKi9cbiAgICBhc3luYyBmdW5jdGlvbiBwYWNrVGV4dHVyZXMoZGVzdDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGdyb3VwSXRlbTogSUdyb3VwKSB7XG4gICAgICAgIGNvbnN0IGpzb25zID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgICBncm91cEl0ZW0udXVpZHMubWFwKGFzeW5jICh1dWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IG1hbmFnZXIuY2FjaGUuZ2V0U2VyaWFsaXplZEpTT04odXVpZCwgYXNzZXRTZXJpYWxpemVPcHRpb25zKTtcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FuJ3QgZ2V0IFNlcmlhbGl6ZWRKU09OIG9mIGFzc2V0IHthc3NldCgke3V1aWR9KX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdmFsdWVzID0ganNvbnMubWFwKChqc29uOiBhbnkpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHsgYmFzZSwgbWlwbWFwcyB9ID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemVDb21waWxlZC5nZXRSb290RGF0YShqc29uKTtcbiAgICAgICAgICAgIHJldHVybiBbYmFzZSwgbWlwbWFwc107XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBwYWNrZWREYXRhID0ge1xuICAgICAgICAgICAgdHlwZToganMuZ2V0Q2xhc3NJZChUZXh0dXJlMkQpLFxuICAgICAgICAgICAgZGF0YTogdmFsdWVzLFxuICAgICAgICB9O1xuICAgICAgICBhd2FpdCBvdXRwdXRTZXJpYWxpemVKU09OKGRlc3QsIG5hbWUsIHBhY2tlZERhdGEpO1xuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIG91dHB1dFNlcmlhbGl6ZUpTT04oZGVzdDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGpzb246IGFueSkge1xuICAgICAgICAvLyDlsIbmi7zmjqXlpb3nmoTmlbDmja7vvIzlrp7pmYXlhpnliLDmjIflrprkvY3nva5cbiAgICAgICAgY29uc3QgcGF0aCA9IGpvaW4oZGVzdCwgbmFtZS5zdWJzdHIoMCwgMiksIG5hbWUgKyAnLmpzb24nKTtcbiAgICAgICAgLy8ganNvbiA9IF9jb21wcmVzc0pzb24oanNvbik7XG4gICAgICAgIGF3YWl0IG91dHB1dEpTT04ocGF0aCwganNvbik7XG4gICAgfVxufVxuIl19