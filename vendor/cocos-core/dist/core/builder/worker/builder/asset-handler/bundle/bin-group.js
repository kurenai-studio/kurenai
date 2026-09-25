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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluLWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci9hc3NldC1oYW5kbGVyL2J1bmRsZS9iaW4tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjQSwwQ0FZQztBQUVELHdDQWNDO0FBRUQsd0NBU0M7QUFyREQsK0JBQTRCO0FBQzVCLCtEQUFnRTtBQUNoRSw2Q0FBZ0U7QUFDaEUsdUNBQXNEO0FBQ3RELGdFQUFrRDtBQUNsRCxtREFBc0Q7QUFDdEQseURBQW9EO0FBSXBELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2pELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztBQUVoQiw2REFBNkQ7QUFDdEQsS0FBSyxVQUFVLGVBQWUsQ0FBQyxNQUFlLEVBQUUsU0FBaUI7SUFDcEUsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO0lBQzlCLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztJQUM5QixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsTUFBTSxhQUFhLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoSCxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVTtZQUFFLE9BQU87UUFDL0IsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsU0FBUyxJQUFJ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QUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ2pGLENBQUM7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsS0FBYSxFQUFFLE1BQWU7SUFDM0QsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7SUFDbEUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDckQsTUFBTSxLQUFLLEdBQUcsaUNBQWlCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9DLE1BQU0sSUFBSSxHQUFHLElBQUEsbUNBQTJCLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsT0FBTyxJQUFBLG1CQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNKLE1BQU0sU0FBUyxHQUFHLElBQUEsaUNBQWMsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN2RixNQUFNLElBQUEscUJBQVUsRUFBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDdkYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGJ1aWxkQXNzZXRMaWJyYXJ5IH0gZnJvbSAnLi4vLi4vbWFuYWdlci9hc3NldC1saWJyYXJ5JztcbmltcG9ydCB7IGdldENDT05Gb3JtYXRBc3NldEluTGlicmFyeSB9IGZyb20gJy4uLy4uL3V0aWxzL2Njb25iJztcbmltcG9ydCB7IG91dHB1dEZpbGUsIHJlYWRGaWxlLCBzdGF0IH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgSGFzaFV1aWQgZnJvbSAnLi4vLi4vdXRpbHMvaGFzaC11dWlkJztcbmltcG9ydCB7IGNvbXBhcmVVVUlEIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvdXRpbHMnO1xuaW1wb3J0IHsgYmluUGFja2FnZVBhY2sgfSBmcm9tICcuL2Jpbi1wYWNrYWdlLXBhY2snO1xuaW1wb3J0IHsgSUFzc2V0IH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXNzZXRzL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgSUJpbkdyb3VwQ29uZmlnLCBJQnVuZGxlLCBJR3JvdXAgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcblxuY29uc3QgUEFDS19GSUxFX1RZUEVfTElTVCA9IFsnY2MuQW5pbWF0aW9uQ2xpcCddO1xuY29uc3QgS0IgPSAxMDI0O1xuXG4vLyDpooTop4hidW5kbGXlr7liaW7mlofku7blkIjlubbku6XlkI7nmoTmlYjmnpwsIOWPr+eUqOS6juiwg+ivlSwg5Lmf5Y+v55So5LqO5Lul5ZCOZWRpdG9y5YGa55WM6Z2i6aKE6KeI5bGV56S657uZ55So5oi35p+l55yL5ZCI5bm25pWI5p6cXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJldmlld0Jpbkdyb3VwKGJ1bmRsZTogSUJ1bmRsZSwgdGhyZXNob2xkOiBudW1iZXIpOiBQcm9taXNlPHsgdXVpZExpc3Q6IHN0cmluZ1tdLCBzaXplTGlzdDogbnVtYmVyW10sIHRvdGFsU2l6ZTogbnVtYmVyIH0+IHtcbiAgICBjb25zdCB1dWlkTGlzdDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBzaXplTGlzdDogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgdG90YWxTaXplID0gMDtcbiAgICBjb25zdCBhbmFseXplUmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5hbGwoYnVuZGxlLmFzc2V0c1dpdGhvdXRSZWRpcmVjdC5tYXAodXVpZCA9PiBhbmFseXplUGFjayh1dWlkLCB0aHJlc2hvbGQpKSk7XG4gICAgYW5hbHl6ZVJlc3VsdC5mb3JFYWNoKG91dHB1dCA9PiB7XG4gICAgICAgIGlmICghb3V0cHV0LnNob3VsZFBhY2spIHJldHVybjtcbiAgICAgICAgdXVpZExpc3QucHVzaChvdXRwdXQudXVpZCk7XG4gICAgICAgIHNpemVMaXN0LnB1c2gob3V0cHV0LnNpemUpO1xuICAgICAgICB0b3RhbFNpemUgKz0gb3V0cHV0LnNpemU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgdXVpZExpc3QsIHNpemVMaXN0LCB0b3RhbFNpemUgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUJpbkdyb3VwKGJ1bmRsZTogSUJ1bmRsZSwgY29uZmlnPzogSUJpbkdyb3VwQ29uZmlnKSB7XG4gICAgaWYgKCFjb25maWcgfHwgIWNvbmZpZy5lbmFibGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zb2xlLmRlYnVnKGBIYW5kbGUgYmluYXJ5IGdyb3VwIGluIGJ1bmRsZSAke2J1bmRsZS5uYW1lfTogc3RhcnRgKTtcbiAgICBjb25zdCB0aHJlc2hvbGQgPSBjb25maWcudGhyZXNob2xkICogS0I7XG4gICAgY29uc3QgdXVpZHMgPSAoYXdhaXQgcHJldmlld0Jpbkdyb3VwKGJ1bmRsZSwgdGhyZXNob2xkKSkudXVpZExpc3Q7XG4gICAgaWYgKHV1aWRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYEhhbmRsZSBiaW5hcnkgZ3JvdXAgaW4gYnVuZGxlICR7YnVuZGxlLm5hbWV9OiBubyBuZWVkIHRvIGhhbmRsZWApO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHV1aWRzLnNvcnQoY29tcGFyZVVVSUQpO1xuICAgIGJ1bmRsZS5hZGRHcm91cCgnQklOJywgdXVpZHMsIEhhc2hVdWlkLmNhbGN1bGF0ZShbdXVpZHNdLCBIYXNoVXVpZC5CdWlsdGluSGFzaFR5cGUuUGFja2VkQXNzZXRzKVswXSk7XG4gICAgY29uc29sZS5kZWJ1ZyhgSGFuZGxlIGJpbmFyeSBncm91cCBpbiBidW5kbGUgJHtidW5kbGUubmFtZX06IHN1Y2Nlc3NgKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG91dHB1dEJpbkdyb3VwKGJ1bmRsZTogSUJ1bmRsZSwgY29uZmlnPzogSUJpbkdyb3VwQ29uZmlnKSB7XG4gICAgaWYgKCFjb25maWcgfHwgIWNvbmZpZy5lbmFibGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBncm91cCA9IGJ1bmRsZS5ncm91cHMuZmluZChncm91cCA9PiBncm91cC50eXBlID09ICdCSU4nKTtcbiAgICBpZiAoIWdyb3VwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgb3V0cHV0T25lQmluR3JvdXAoZ3JvdXAsIGJ1bmRsZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFzc2V0U2l6ZShhc3NldDogSUFzc2V0KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBwYXRoID0gZ2V0Q0NPTkZvcm1hdEFzc2V0SW5MaWJyYXJ5KGFzc2V0KTtcbiAgICByZXR1cm4gKGF3YWl0IHN0YXQocGF0aCkpLnNpemU7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFuYWx5emVQYWNrKHV1aWQ6IHN0cmluZywgdGhyZXNob2xkOiBudW1iZXIpOiBQcm9taXNlPHsgdXVpZDogc3RyaW5nLCBzaG91bGRQYWNrOiBib29sZWFuLCBzaXplOiBudW1iZXIgfT4ge1xuICAgIGNvbnN0IGFzc2V0ID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQodXVpZCk7XG4gICAgY29uc3QgYXNzZXRUeXBlID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKTtcblxuICAgIGlmICghUEFDS19GSUxFX1RZUEVfTElTVC5pbmNsdWRlcyhhc3NldFR5cGUpKSB7XG4gICAgICAgIHJldHVybiB7IHV1aWQsIHNob3VsZFBhY2s6IGZhbHNlLCBzaXplOiAwIH07XG4gICAgfVxuICAgIGNvbnN0IHNpemUgPSBhd2FpdCBnZXRBc3NldFNpemUoYXNzZXQpO1xuICAgIHJldHVybiB7IHV1aWQsIHNob3VsZFBhY2s6IHNpemUgPD0gdGhyZXNob2xkLCBzaXplIH07XG59XG5cbmZ1bmN0aW9uIGdldE91dHB1dEZpbGVQYXRoKGJ1bmRsZTogSUJ1bmRsZSwgdXVpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGpvaW4oYnVuZGxlLmRlc3QsIGJ1bmRsZS5pbXBvcnRCYXNlLCB1dWlkLnNsaWNlKDAsIDIpLCB1dWlkICsgJy5iaW4nKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0T25lQmluR3JvdXAoZ3JvdXA6IElHcm91cCwgYnVuZGxlOiBJQnVuZGxlKSB7XG4gICAgY29uc29sZS5kZWJ1Zyhgb3V0cHV0IGJpbiBncm91cHMgaW4gYnVuZGxlICR7YnVuZGxlLm5hbWV9IHN0YXJ0YCk7XG4gICAgYnVuZGxlLmFkZEFzc2V0V2l0aFV1aWQoZ3JvdXAubmFtZSk7XG4gICAgY29uc3QgYnVmZmVycyA9IGF3YWl0IFByb21pc2UuYWxsKGdyb3VwLnV1aWRzLm1hcCh1dWlkID0+IHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgY29uc3QgcGF0aCA9IGdldENDT05Gb3JtYXRBc3NldEluTGlicmFyeShhc3NldCk7XG4gICAgICAgIHJldHVybiByZWFkRmlsZShwYXRoKTtcbiAgICB9KSk7XG4gICAgY29uc3QgcGFja2VkQmluID0gYmluUGFja2FnZVBhY2soYnVmZmVycy5tYXAoYnVmZmVyID0+IG5ldyBVaW50OEFycmF5KGJ1ZmZlcikuYnVmZmVyKSk7XG4gICAgYXdhaXQgb3V0cHV0RmlsZShnZXRPdXRwdXRGaWxlUGF0aChidW5kbGUsIGdyb3VwLm5hbWUpLCBuZXcgVWludDhBcnJheShwYWNrZWRCaW4pKTtcbn1cbiJdfQ==