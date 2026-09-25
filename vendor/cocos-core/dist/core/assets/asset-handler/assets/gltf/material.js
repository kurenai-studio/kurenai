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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0ZXJpYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvZ2x0Zi9tYXRlcmlhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtSUEsb0NBeUNDO0FBNUtELDhDQUFzRjtBQUN0Rix1Q0FBeUI7QUFDekIsd0RBQTBCO0FBQzFCLGdEQUF3QjtBQUd4QixpREFBd0Q7QUFDeEQsOERBQXlEO0FBQ3pELHFEQUFxRDtBQUVyRCx1Q0FBMEU7QUFDMUUsNkJBQTRCO0FBRTVCLHlFQUF1RDtBQUN2RCxpREFBZ0M7QUFDaEMsbURBQWtDO0FBRXJCLFFBQUEsbUJBQW1CLEdBQWlCO0lBQzdDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsZUFBZTtJQUNyQixXQUFXO0lBQ1gsU0FBUyxFQUFFLGFBQWE7SUFFeEI7O09BRUc7SUFDSCxhQUFhLEVBQUUsV0FBVztJQUUxQixRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLFFBQVE7UUFDakI7Ozs7Ozs7V0FPRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBbUI7WUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUVELHVDQUF1QztZQUN2QyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUUsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO29CQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLG9EQUFvRCxL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O0lBQ3BGLE1BQU0sR0FBRyxHQUFHLElBQUEsbUJBQVEsRUFBQyxZQUFZLENBQUMsQ0FBQztJQUNuQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ04sTUFBTSxJQUFJLEdBQUcsSUFBQSxvQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLElBQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBQ0QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUMzQixPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsR0FBWTtJQUM3QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDUCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBQSxXQUFLLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxPQUFPLGtCQUFjLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQsIHF1ZXJ5UGF0aCwgcXVlcnlVcmwsIHF1ZXJ5VVVJRCwgVmlydHVhbEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCAqIGFzIGNjIGZyb20gJ2NjJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEdsVEZVc2VyRGF0YSB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcy91c2VyRGF0YXMnO1xuaW1wb3J0IHsgR2x0ZkNvbnZlcnRlciwgSUdsdGZBc3NldEZpbmRlciB9IGZyb20gJy4uL3V0aWxzL2dsdGYtY29udmVydGVyJztcbmltcG9ydCB7IERlZmF1bHRHbHRmQXNzZXRGaW5kZXIgfSBmcm9tICcuL2Fzc2V0LWZpbmRlcic7XG5pbXBvcnQgeyBsb2FkQXNzZXRTeW5jIH0gZnJvbSAnLi4vdXRpbHMvbG9hZC1hc3NldC1zeW5jJztcbmltcG9ydCB7IGdsVGZSZWFkZXJNYW5hZ2VyIH0gZnJvbSAnLi9yZWFkZXItbWFuYWdlcic7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0LCBpMThuVHJhbnNsYXRlLCBtZXJnZU1ldGEgfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBhc3NldERCTWFuYWdlciBmcm9tICcuLi8uLi8uLi9tYW5hZ2VyL2Fzc2V0LWRiJztcbmltcG9ydCBGYnhIYW5kbGVyIGZyb20gJy4uL2ZieCc7XG5pbXBvcnQgR2x0ZkhhbmRsZXIgZnJvbSAnLi4vZ2x0Zic7XG5cbmV4cG9ydCBjb25zdCBHbHRmTWF0ZXJpYWxIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnZ2x0Zi1tYXRlcmlhbCcsXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuTWF0ZXJpYWwnLFxuXG4gICAgLyoqXG4gICAgICog5YWB6K646L+Z56eN57G75Z6L55qE6LWE5rqQ6L+b6KGM5a6e5L6L5YyWXG4gICAgICovXG4gICAgaW5zdGFudGlhdGlvbjogJy5tYXRlcmlhbCcsXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4xNCcsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahCBib29sZWFuXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImeS4i+asoeWQr+WKqOi/mOS8mumHjeaWsOWvvOWFpVxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogVmlydHVhbEFzc2V0KSB7XG4gICAgICAgICAgICBpZiAoIWFzc2V0LnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5aaC5p6c5LmL5YmN55qEIGZieCDmnInlrZjlnKjnm7jlkIznmoQgaWQg5p2Q6LSo55qE57yW6L6R5pWw5o2u5LqG77yM5aSN55So5LmL5YmN55qE5pWw5o2uXG4gICAgICAgICAgICBpZiAoYXNzZXQucGFyZW50Lm1ldGE/LnVzZXJEYXRhPy5tYXRlcmlhbHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2aW91c0VkaXRlZERhdGEgPSBhc3NldC5wYXJlbnQubWV0YS51c2VyRGF0YS5tYXRlcmlhbHNbYXNzZXQudXVpZF07XG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzRWRpdGVkRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgaW1wb3J0ZXI6IFJldXNlIHByZXZpb3VzbHkgZWRpdGVkIG1hdGVyaWFsIGRhdGEuICR7YXNzZXQudXVpZH1gKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gSlNPTi5zdHJpbmdpZnkocHJldmlvdXNFZGl0ZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHZlcnNpb24gPSBHbHRmSGFuZGxlci5pbXBvcnRlci52ZXJzaW9uO1xuICAgICAgICAgICAgaWYgKGFzc2V0LnBhcmVudC5tZXRhLmltcG9ydGVyID09PSAnZmJ4Jykge1xuICAgICAgICAgICAgICAgIHZlcnNpb24gPSBGYnhIYW5kbGVyLmltcG9ydGVyLnZlcnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBnbHRmQ29udmVydGVyID0gYXdhaXQgZ2xUZlJlYWRlck1hbmFnZXIuZ2V0T3JDcmVhdGUoYXNzZXQucGFyZW50IGFzIEFzc2V0LCB2ZXJzaW9uKTtcblxuICAgICAgICAgICAgY29uc3QgZ2x0ZlVzZXJEYXRhID0gYXNzZXQucGFyZW50LnVzZXJEYXRhIGFzIEdsVEZVc2VyRGF0YTtcbiAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlTWF0ZXJpYWwoXG4gICAgICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuZ2x0ZkluZGV4IGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICBnbHRmQ29udmVydGVyLFxuICAgICAgICAgICAgICAgIG5ldyBEZWZhdWx0R2x0ZkFzc2V0RmluZGVyKGdsdGZVc2VyRGF0YS5hc3NldEZpbmRlciksXG4gICAgICAgICAgICAgICAgZ2x0ZlVzZXJEYXRhLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKG1hdGVyaWFsKTtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoJy5qc29uJywgc2VyaWFsaXplSlNPTik7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChzZXJpYWxpemVKU09OKTtcbiAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIGNyZWF0ZUluZm86IHtcbiAgICAgICAgYXN5bmMgc2F2ZShhc3NldCwgY29udGVudCkge1xuICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWxVdWlkID0gYXNzZXQudXVpZDtcbiAgICAgICAgICAgIGlmICghY29udGVudCB8fCBCdWZmZXIuaXNCdWZmZXIoY29udGVudCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aTE4blRyYW5zbGF0ZSgnYXNzZXRzLnNhdmVfYXNzZXRfbWV0YS5mYWlsLmNvbnRlbnQnKX1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldC5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZieE1ldGEgPSBhc3NldC5wYXJlbnQubWV0YTtcbiAgICAgICAgICAgIGlmICghZmJ4TWV0YS51c2VyRGF0YS5tYXRlcmlhbHMgfHwgdHlwZW9mIGZieE1ldGEudXNlckRhdGEubWF0ZXJpYWxzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGZieE1ldGEudXNlckRhdGEubWF0ZXJpYWxzID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZmJ4TWV0YS51c2VyRGF0YS5tYXRlcmlhbHNbbWF0ZXJpYWxVdWlkXSA9IHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoY29udGVudCkgOiBjb250ZW50O1xuICAgICAgICAgICAgICAgIG1lcmdlTWV0YShhc3NldC5tZXRhLCBmYnhNZXRhKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgU2F2ZSBtYXRlcmlhbHMoe2Fzc2V0KCR7bWF0ZXJpYWxVdWlkfSl9IGRhdGEgdG8gZmJ4IHthc3NldCgke2Fzc2V0LnBhcmVudC51dWlkfSl9IGZhaWxlZCFgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBHbHRmTWF0ZXJpYWxIYW5kbGVyO1xuXG5mdW5jdGlvbiBjcmVhdGVNYXRlcmlhbChpbmRleDogbnVtYmVyLCBnbHRmQ29udmVydGVyOiBHbHRmQ29udmVydGVyLCBhc3NldEZpbmRlcjogSUdsdGZBc3NldEZpbmRlciwgZ2xURlVzZXJEYXRhOiBHbFRGVXNlckRhdGEpIHtcbiAgICBjb25zdCBtYXRlcmlhbCA9IGdsdGZDb252ZXJ0ZXIuY3JlYXRlTWF0ZXJpYWwoXG4gICAgICAgIGluZGV4LFxuICAgICAgICBhc3NldEZpbmRlcixcbiAgICAgICAgKGVmZmVjdE5hbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBxdWVyeVVVSUQoZWZmZWN0TmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gbG9hZEFzc2V0U3luYyh1dWlkLCBjYy5FZmZlY3RBc3NldCkhO1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB1c2VWZXJ0ZXhDb2xvcnM6IGdsVEZVc2VyRGF0YS51c2VWZXJ0ZXhDb2xvcnMsXG4gICAgICAgICAgICBkZXB0aFdyaXRlSW5BbHBoYU1vZGVCbGVuZDogZ2xURlVzZXJEYXRhLmRlcHRoV3JpdGVJbkFscGhhTW9kZUJsZW5kLFxuICAgICAgICAgICAgc21hcnRNYXRlcmlhbEVuYWJsZWQ6IGdsVEZVc2VyRGF0YS5mYng/LnNtYXJ0TWF0ZXJpYWxFbmFibGVkID8/IGZhbHNlLFxuICAgICAgICB9LFxuICAgICk7XG4gICAgcmV0dXJuIG1hdGVyaWFsO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZHVtcE1hdGVyaWFsKFxuICAgIGFzc2V0OiBBc3NldCxcbiAgICBhc3NldEZpbmRlcjogRGVmYXVsdEdsdGZBc3NldEZpbmRlcixcbiAgICBnbHRmQ29udmVydGVyOiBHbHRmQ29udmVydGVyLFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgbmFtZTogc3RyaW5nLFxuKSB7XG4gICAgY29uc3QgZ2xURlVzZXJEYXRhID0gYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhO1xuICAgIGxldCBtYXRlcmlhbER1bXBEaXI6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIGlmIChnbFRGVXNlckRhdGEubWF0ZXJpYWxEdW1wRGlyKSB7XG4gICAgICAgIG1hdGVyaWFsRHVtcERpciA9IHF1ZXJ5UGF0aChnbFRGVXNlckRhdGEubWF0ZXJpYWxEdW1wRGlyKTtcbiAgICAgICAgaWYgKCFtYXRlcmlhbER1bXBEaXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVGhlIHNwZWNpZmllZCBkdW1wIGRpcmVjdG9yeSBvZiBtYXRlcmlhbHMgaXMgbm90IHZhbGlkLiAnICsgJ0RlZmF1bHQgZGlyZWN0b3J5IGlzIHVzZWQuJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFtYXRlcmlhbER1bXBEaXIpIHtcbiAgICAgICAgbWF0ZXJpYWxEdW1wRGlyID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShhc3NldC5zb3VyY2UpLCBgTWF0ZXJpYWxzXyR7YXNzZXQuYmFzZW5hbWV9YCk7XG4gICAgICAgIC8vIOeUn+aIkOm7mOiupOWAvOWQju+8jOWhq+WFpSB1c2VyRGF0Ye+8jOmYsuatoueUn+aIkOWQju+8jOmHjeaWsOenu+WKqOi1hOa6kOS9jee9ru+8jOWvvOiHtCBtYXRlcmlhbCDotYTmupDph43mlrDnlJ/miJBcbiAgICAgICAgZ2xURlVzZXJEYXRhLm1hdGVyaWFsRHVtcERpciA9IGF3YWl0IHF1ZXJ5VXJsKG1hdGVyaWFsRHVtcERpcik7XG4gICAgfVxuICAgIGZzLmVuc3VyZURpclN5bmMobWF0ZXJpYWxEdW1wRGlyKTtcbiAgICBjb25zdCBkZXN0RmlsZU5hbWUgPSBuYW1lO1xuICAgIC8vIOmcgOimgeWwhiB3aW5kb3dzIOS4iuS4jeaUr+aMgeeahOi3r+W+hOespuWPt+abv+aNouaOiVxuICAgIGNvbnN0IGRlc3RGaWxlUGF0aCA9IHBhdGguam9pbihtYXRlcmlhbER1bXBEaXIsIGRlc3RGaWxlTmFtZS5yZXBsYWNlKC9bXFwvOio/XCI8PnxdL2csICctJykpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhkZXN0RmlsZVBhdGgpKSB7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlTWF0ZXJpYWwoaW5kZXgsIGdsdGZDb252ZXJ0ZXIsIGFzc2V0RmluZGVyLCBnbFRGVXNlckRhdGEpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWQgPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShtYXRlcmlhbCk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZGVzdEZpbGVQYXRoLCBzZXJpYWxpemVkKTtcbiAgICB9XG4gICAgLy8g5LiN6ZyA6KaB562J5b6F5a+85YWl5a6M5oiQ77yM6L+Z6YeM5Y+q5piv5oOz6KaB6I635Y+W5Yiw6LWE5rqQ55qEIHV1aWRcbiAgICAoZmluZEFzc2V0REIoZ2xURlVzZXJEYXRhLm1hdGVyaWFsRHVtcERpcikgfHwgYXNzZXQuX2Fzc2V0REIpLnJlZnJlc2goZGVzdEZpbGVQYXRoKTtcbiAgICBjb25zdCB1cmwgPSBxdWVyeVVybChkZXN0RmlsZVBhdGgpO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgY29uc3QgdXVpZCA9IHF1ZXJ5VVVJRCh1cmwpO1xuICAgICAgICBpZiAodXVpZCAmJiB0eXBlb2YgdXVpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB1dWlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzc2V0LmRlcGVuZChkZXN0RmlsZVBhdGgpO1xuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBmaW5kQXNzZXREQih1cmw/OiBzdHJpbmcpIHtcbiAgICBpZiAoIXVybCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgdXJpID0gcGFyc2UodXJsKTtcbiAgICBpZiAoIXVyaS5ob3N0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFt1cmkuaG9zdF07XG59XG4iXX0=