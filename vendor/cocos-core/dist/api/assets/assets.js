"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsApi = void 0;
const schema_1 = require("./schema");
const zod_1 = require("zod");
const decorator_js_1 = require("../decorator/decorator.js");
const schema_base_1 = require("../base/schema-base");
const assets_1 = require("../../core/assets");
const schema_identifier_1 = require("../base/schema-identifier");
const animation_mask_1 = require("../../core/assets/animation-mask");
class AssetsApi {
    /**
     * Delete Asset // 删除资源
     */
    async deleteAsset(dbPath) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: { dbPath },
        };
        try {
            await assets_1.assetManager.removeAsset(dbPath);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('remove asset fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Refresh Asset Directory // 刷新资源目录
     */
    async refresh(dir) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            await assets_1.assetManager.refreshAsset(dir);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('refresh dir fail:', e);
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Info // 查询资源信息
     */
    async queryAssetInfo(urlOrUUIDOrPath, dataKeys) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.queryAssetInfo(urlOrUUIDOrPath, dataKeys);
            if (!ret.data) {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.reason = `❌Asset can not be found: ${urlOrUUIDOrPath}. Please refresh asset db and try again.`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query asset info fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Metadata // 查询资源元数据
     */
    async queryAssetMeta(urlOrUUIDOrPath) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.queryAssetMeta(urlOrUUIDOrPath);
            if (!ret.data) {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.reason = `Asset not found: ${urlOrUUIDOrPath}`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query asset meta fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Creatable Asset Map // 查询可创建资源映射表
     */
    async queryCreateMap() {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = await assets_1.assetManager.getCreateMap();
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query create map fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Batch Query Asset Info // 批量查询资源信息
     */
    // @tool('assets-query-asset-infos')
    async queryAssetInfos(options) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = await assets_1.assetManager.queryAssetInfos(options);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query asset infos fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query All Asset Database Info // 查询所有资源数据库信息
     */
    // @tool('assets-query-asset-db-infos')
    async queryAssetDBInfos() {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = Object.values(assets_1.assetDBManager.assetDBInfo);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query asset db infos fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Create Asset By Type // 按类型创建资源
     */
    async createAssetByType(ccType, dirOrUrl, baseName, options) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.createAssetByType(ccType, dirOrUrl, baseName, options);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error(e);
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async createAsset(options) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.createAsset(options);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error(e);
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Import Asset // 导入资源
     */
    async importAsset(source, target, options) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = await assets_1.assetManager.importAsset(source, target, options);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('import asset fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Copy Asset // 复制资源
     */
    async copyAsset(source, target, options) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.copyAsset(source, target, options);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('copy asset fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Reimport Asset // 重新导入资源
     */
    async reimportAsset(pathOrUrlOrUUID) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const assetInfo = await assets_1.assetManager.reimportAsset(pathOrUrlOrUUID);
            ret.data = assetInfo;
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error(e);
            ret.reason = e instanceof Error ? e.message + e.stack : String(e);
        }
        return ret;
    }
    /**
     * Save Asset // 保存资源
     */
    async saveAsset(pathOrUrlOrUUID, data) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.saveAsset(pathOrUrlOrUUID, data);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('save asset fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async queryAnimationMask(uuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            ret.data = await (0, animation_mask_1.queryAnimationMask)(uuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query animation mask fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async importAnimationMaskSkeleton(uuid, skeletonSourceUuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            ret.data = await (0, animation_mask_1.importAnimationMaskSkeleton)(uuid, skeletonSourceUuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('import animation mask skeleton fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async clearAnimationMaskNodes(uuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            ret.data = await (0, animation_mask_1.clearAnimationMaskNodes)(uuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('clear animation mask nodes fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async changeAnimationMaskDump(uuid, changes) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            ret.data = await (0, animation_mask_1.changeAnimationMaskDump)(uuid, changes);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('change animation mask dump fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async saveAnimationMask(uuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            await (0, animation_mask_1.saveAnimationMask)(uuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('save animation mask fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query All Material Effects // 查询所有材质 Effect
     */
    async queryMaterialAllEffects() {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: {},
        };
        try {
            ret.data = await assets_1.assetManager.queryMaterialAllEffects();
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query material effects fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Material Effect // 查询单个材质 Effect
     */
    async queryMaterialEffect(effectNameOrUuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: [],
        };
        try {
            ret.data = await assets_1.assetManager.queryMaterialEffect(effectNameOrUuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query material effect fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Material // 查询材质
     */
    async queryMaterial(uuidOrUrlOrPath) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.queryMaterial(uuidOrUrlOrPath);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query material fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Save Material // 保存材质
     */
    async saveMaterial(uuidOrUrlOrPath, dump) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            await assets_1.assetManager.saveMaterial(uuidOrUrlOrPath, dump);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('save material fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Serialized Asset Data // 查询序列化资源属性数据
     */
    async querySerializedData(uuidOrUrlOrPath) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.querySerializedData(uuidOrUrlOrPath);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query serialized asset data fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Save Serialized Asset Data // 保存序列化资源属性数据
     */
    async saveSerializedData(uuidOrUrlOrPath, patch) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.saveSerializedData(uuidOrUrlOrPath, patch);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('save serialized asset data fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Animation Graph Variant
     */
    async queryAnimationGraphVariant(uuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: undefined,
        };
        try {
            ret.data = await assets_1.assetManager.queryAnimationGraphVariant(uuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query animation graph variant fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async changeAnimationGraphVariant(uuid, dump) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: undefined,
        };
        try {
            ret.data = await assets_1.assetManager.changeAnimationGraphVariant(uuid, dump);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('change animation graph variant fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async saveAnimationGraphVariant(uuid) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: null,
        };
        try {
            await assets_1.assetManager.saveAnimationGraphVariant(uuid);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('save animation graph variant fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset UUID // 查询资源 UUID
     */
    async queryUUID(urlOrPath) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = assets_1.assetManager.queryUUID(urlOrPath);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query UUID fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Path // 查询资源路径
     */
    async queryPath(urlOrUuid) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = assets_1.assetManager.queryPath(urlOrUuid);
            if (!ret.data) {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.data = null;
                ret.reason = `Asset path can not be found: ${urlOrUuid}. Please refresh asset db and try again.`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query path fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset URL // 查询资源 URL
     */
    async queryUrl(uuidOrPath) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = assets_1.assetManager.queryUrl(uuidOrPath);
            if (!ret.data) {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.data = null;
                ret.reason = `Asset URL can not be found: ${uuidOrPath}. Please refresh asset db and try again.`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query URL fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Dependencies // 查询资源依赖
     */
    // @tool('assets-query-asset-dependencies')
    async queryAssetDependencies(uuidOrUrl, type = 'asset') {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = await assets_1.assetManager.queryAssetDependencies(uuidOrUrl, type);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query asset dependencies fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Users // 查询资源使用者
     */
    // @tool('assets-query-asset-users')
    async queryAssetUsers(uuidOrUrl, type = 'asset') {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = await assets_1.assetManager.queryAssetUsers(uuidOrUrl, type);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query asset users fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Sorted Plugin Scripts // 查询排序后的插件脚本
     */
    // @tool('assets-query-sorted-plugins')
    async querySortedPlugins(filterOptions = {}) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: [],
        };
        try {
            ret.data = assets_1.assetManager.querySortedPlugins(filterOptions);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query sorted plugins fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Rename Asset // 重命名资源
     */
    async renameAsset(source, newName, options = {}) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.renameAsset(source, newName, options);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('rename asset fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Move Asset // 移动资源
     */
    async moveAsset(source, target, options = {}) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.moveAsset(source, target, options);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('move asset fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Update Default User Data // 更新默认用户数据
     */
    async updateDefaultUserData(handler, path, value) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            await assets_1.assetManager.updateDefaultUserData(handler, path, value);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('update default user data fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset User Data Config // 查询资源用户数据配置
     */
    async queryAssetUserDataConfig(urlOrUuidOrPath) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const asset = assets_1.assetManager.queryAsset(urlOrUuidOrPath);
            if (asset) {
                ret.data = await assets_1.assetManager.queryAssetUserDataConfig(asset);
            }
            else {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.reason = `❌Asset can not be found: ${urlOrUuidOrPath}`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query asset user data config fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Update Asset User Data // 更新资源用户数据
     */
    async updateAssetUserData(urlOrUuidOrPath, userData) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.updateUserData(urlOrUuidOrPath, userData);
            if (!ret.data) {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.reason = `❌Asset can not be found: ${urlOrUuidOrPath}. Please refresh asset db and try again.`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('update asset user data fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Update Asset User Data By Path // 按路径更新资源用户数据
     */
    async updateAssetUserDataByPath(urlOrUuidOrPath, path, value) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            ret.data = await assets_1.assetManager.updateUserDataByPath(urlOrUuidOrPath, path, value);
            if (!ret.data) {
                ret.code = schema_base_1.COMMON_STATUS.NOT_FOUND;
                ret.reason = `❌Asset can not be found: ${urlOrUuidOrPath}. Please refresh asset db and try again.`;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('update asset user data by path fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Config Map // 查询资源配置映射表
     */
    // @tool('assets-query-asset-config-map')
    async queryAssetConfigMap() {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: {},
        };
        try {
            ret.data = await assets_1.assetManager.queryAssetConfigMap();
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query asset config map fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Query Asset Property Schema // 查询资源导入属性 schema
     */
    async queryPropertySchema(importer) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: {},
        };
        try {
            ret.data = await assets_1.assetManager.queryPropertySchema(importer);
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('query asset property schema fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
}
exports.AssetsApi = AssetsApi;
__decorate([
    (0, decorator_js_1.tool)('assets-delete-asset'),
    (0, decorator_js_1.title)('Delete Project Asset') // 删除项目资源
    ,
    (0, decorator_js_1.description)('Delete specified asset files from the Cocos Creator project. Supports deleting single files or entire directories. Deleted assets will be removed from the asset database, and corresponding .meta files will also be deleted. The deletion operation is irreversible, please use with caution.') // 从 Cocos Creator 项目中删除指定的资源文件。支持删除单个文件或整个目录。删除的资源会从资源数据库中移除，同时删除对应的 .meta 文件。删除操作不可逆，请谨慎使用。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaDbDirResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaDirOrDbPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "deleteAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-refresh'),
    (0, decorator_js_1.title)('Refresh Asset Directory') // 刷新资源目录
    ,
    (0, decorator_js_1.description)('Refresh the specified asset directory in the Cocos Creator project, rescan all asset files in the directory, and update the asset database index. This method needs to be called to synchronize the asset status when asset files are modified externally or new files are added.') // 刷新 Cocos Creator 项目中的指定资源目录，重新扫描目录下的所有资源文件，更新资源数据库索引。当外部修改了资源文件或添加了新文件时，需要调用此方法同步资源状态。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaRefreshDirResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaDirOrDbPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "refresh", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-asset-info'),
    (0, decorator_js_1.title)('Query Detailed Asset Info') // 查询资源详细信息
    ,
    (0, decorator_js_1.description)('Query detailed asset information by URL, UUID, or file path. By default the result includes subAssets; use each sub-asset type (for example type === "cc.SpriteFrame") to select the UUID required by a component property. Specify dataKeys, including "subAssets" and "extends", when an explicit field list is needed.') // 根据 URL、UUID 或文件路径查询资源详情；默认包含子资源，可按 type 选择组件属性所需的子资源 UUID
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetInfoResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaDataKeys)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetInfo", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-asset-meta'),
    (0, decorator_js_1.title)('Query Asset Metadata') // 查询资源元数据
    ,
    (0, decorator_js_1.description)('Query the content of the .meta file of an asset based on its URL, UUID, or file path. Metadata includes asset import configuration, user-defined data, version information, etc.') // 根据资源的 URL、UUID 或文件路径查询资源的 .meta 文件内容。元数据包含资源的导入配置、用户自定义数据、版本信息等。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetMetaResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetMeta", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-create-map'),
    (0, decorator_js_1.title)('Query Creatable Asset Map') // 查询可创建资源映射表
    ,
    (0, decorator_js_1.description)('Get the mapping table of all supported creatable asset types. The returned mapping table contains asset handler names, corresponding engine types, creation menu information, etc., used to understand which types of assets the system supports creating.') // 获取所有支持创建的资源类型映射表。返回的映射表包含资源处理器名称、对应的引擎类型、创建菜单信息等，用于了解系统支持创建哪些类型的资源。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaCreateMapResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryCreateMap", null);
__decorate([
    (0, decorator_js_1.title)('Batch Query Asset Info') // 批量查询资源信息
    ,
    (0, decorator_js_1.description)('Batch retrieve asset information based on query conditions. Supports filtering by asset type, importer, path pattern, extension, userData, etc. Can be used for asset list display, batch processing, and other scenarios.') // 根据查询条件批量获取资源信息。支持按资源类型、导入器、路径模式、扩展名、userData 等条件筛选。可用于资源列表展示、批量处理等场景。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetInfosResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaQueryAssetsOption)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetInfos", null);
__decorate([
    (0, decorator_js_1.title)('Query All Asset Database Info') // 查询所有资源数据库信息
    ,
    (0, decorator_js_1.description)('Get information about all asset databases in the project, including the built-in database (internal), asset database (assets), etc. Returns database configuration, path, options, and other information.') // 获取项目中所有资源数据库的信息，包括内置数据库（internal）、资源数据库（assets）等。返回数据库的配置、路径、选项等信息。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetDBInfosResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetDBInfos", null);
__decorate([
    (0, decorator_js_1.tool)('assets-create-asset-by-type'),
    (0, decorator_js_1.title)('Create Asset By Type') // 按类型创建资源
    ,
    (0, decorator_js_1.description)('Create a new asset at the target path based on the specified asset handler type. Supports creating various resources such as animations, scripts, materials, scenes, prefabs, etc. You can customize file content, template name, or control whether to overwrite or automatically rename via the options parameter. If file content is not specified, the built-in default template for the corresponding type will be used.') // 根据指定的资源处理器类型在目标路径创建新资源。支持创建动画、脚本、材质、场景、预制体等各类资源。可通过 options 参数自定义文件内容、模板名称或者控制是否覆盖、自动重命名，未指定文件内容时将使用对应类型的内置默认模板创建。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaCreatedAssetResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaSupportCreateType)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaDirOrDbPath)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaBaseName)),
    __param(3, (0, decorator_js_1.param)(schema_1.SchemaCreateAssetByTypeOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "createAssetByType", null);
__decorate([
    (0, decorator_js_1.tool)('assets-create-asset'),
    (0, decorator_js_1.title)('Create Asset') // 创建资源
    ,
    (0, decorator_js_1.description)('Create a Cocos asset from file content or a template. Set options.target to an asset-db URL such as db://assets/scripts/GameManager.ts, or to an absolute file path inside an asset database root. Do not pass a web URL or a plain relative path as target.') // 根据文件内容或模板创建 Cocos 资源。options.target 使用 db://assets/scripts/GameManager.ts 这类 asset-db URL，或位于资源数据库根目录内的绝对路径；不要传 Web URL 或普通相对路径。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaCreatedAssetResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaCreateAssetOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "createAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-import-asset'),
    (0, decorator_js_1.title)('Import External Asset') // 导入外部资源
    ,
    (0, decorator_js_1.description)('Import external asset files into the project. Copy files from the source path to the target path, and automatically execute the asset import process to generate .meta files and library files. Suitable for introducing images, audio, models, and other resources from outside.') // 将外部资源文件导入到项目中。从源路径复制文件到目标路径，并自动执行资源导入流程，生成 .meta 文件和库文件。适用于从外部引入图片、音频、模型等资源。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaImportedAssetResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaSourcePath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaTargetPath)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaAssetOperationOption)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "importAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-copy-asset'),
    (0, decorator_js_1.title)('Copy Asset') // 复制资源
    ,
    (0, decorator_js_1.description)('Copy an existing main asset to a new location together with its complete metadata. The copied asset receives new UUIDs while preserving importer settings, userData, subMetas, and internal references. Supports overwrite or automatic rename on conflicts.') // 将现有主资源及其完整元数据复制到新位置。副本会获得新 UUID，同时保留导入设置、userData、subMetas 和内部引用。支持冲突时覆盖或自动重命名。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetInfoResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaTargetPath)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaAssetOperationOption)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "copyAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-reimport-asset'),
    (0, decorator_js_1.title)('Reimport Asset') // 重新导入资源
    ,
    (0, decorator_js_1.description)('Force reimport of specified assets. When asset files or import configurations change, call this method to re-execute the import process and update library files and asset information. Commonly used for asset repair or refresh after configuration updates.') // 强制重新导入指定资源。当资源文件或导入配置发生变化时，调用此方法重新执行导入流程，更新库文件和资源信息。常用于资源修复或配置更新后的刷新。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaReimportResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "reimportAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-save-asset'),
    (0, decorator_js_1.title)('Save Asset Data') // 保存资源数据
    ,
    (0, decorator_js_1.description)('Save complete content to an existing asset file. Required arguments: pathOrUrlOrUUID (existing asset URL, UUID, or file path) and data (complete file content). Do not call this tool with empty arguments. This tool does not create new assets or temporary files; create the asset first with assets-create-asset-by-type or assets-create-asset, then call save. For scripts, pass complete syntactically valid content. For scene and prefab assets, pass complete valid Cocos serialized JSON; prefer scene-* tools and scene-save for scene graph edits.'),
    (0, decorator_js_1.result)(schema_1.SchemaSaveAssetResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaSaveAssetPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaAssetData)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "saveAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-mask-query'),
    (0, decorator_js_1.title)('Query Animation Mask'),
    (0, decorator_js_1.description)('Query a .animask AnimationMask asset and return a stable DTO containing joint paths, enabled states, and tree structure. This tool does not expose Creator inspector reflection dump.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationMaskDump),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAnimationMask", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-mask-import-skeleton'),
    (0, decorator_js_1.title)('Import Animation Mask Skeleton'),
    (0, decorator_js_1.description)('Import joint paths from a Prefab or glTF-scene asset into an AnimationMask. Existing joint states are preserved and missing paths are appended as enabled. Pass the glTF-scene sub-asset UUID when possible.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationMaskDump),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "importAnimationMaskSkeleton", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-mask-clear-nodes'),
    (0, decorator_js_1.title)('Clear Animation Mask Nodes'),
    (0, decorator_js_1.description)('Clear all joint paths from an AnimationMask asset and return the updated stable DTO.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationMaskDump),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "clearAnimationMaskNodes", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-mask-change-dump'),
    (0, decorator_js_1.title)('Change Animation Mask Dump'),
    (0, decorator_js_1.description)('Apply path-based changes to an AnimationMask stable DTO. recursive defaults to false; pass recursive=true to update descendant paths.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationMaskDump),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaAnimationMaskChanges)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "changeAnimationMaskDump", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-mask-save'),
    (0, decorator_js_1.title)('Save Animation Mask'),
    (0, decorator_js_1.description)('Normalize and save the current AnimationMask asset content, then reimport the asset.'),
    (0, decorator_js_1.result)(schema_1.SchemaVoidResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "saveAnimationMask", null);
__decorate([
    (0, decorator_js_1.tool)('assets-material-query-all-effects'),
    (0, decorator_js_1.title)('Query Material Effects'),
    (0, decorator_js_1.description)('Query all available cc.EffectAsset entries for assets.material.queryAllEffects. Returns effect UUID, name, hideInEditor flag, and asset path. Use UUID as the stable key when building material effect selectors.'),
    (0, decorator_js_1.result)(schema_1.SchemaMaterialEffectsResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryMaterialAllEffects", null);
__decorate([
    (0, decorator_js_1.tool)('assets-material-query-effect'),
    (0, decorator_js_1.title)('Query Material Effect'),
    (0, decorator_js_1.description)('Query one material Effect by UUID, asset URL/path, or effect name. Returns Creator-compatible technique/pass/property dump data for generating the material inspector UI.'),
    (0, decorator_js_1.result)(schema_1.SchemaMaterialEffectResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaMaterialEffectNameOrUuid)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryMaterialEffect", null);
__decorate([
    (0, decorator_js_1.tool)('assets-material-query'),
    (0, decorator_js_1.title)('Query Material'),
    (0, decorator_js_1.description)('Query a cc.Material asset and return Creator-compatible material dump data. The dump merges effect defaults with values saved in the .mtl file and can be used as the input for assets-material-save.'),
    (0, decorator_js_1.result)(schema_1.SchemaMaterialResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryMaterial", null);
__decorate([
    (0, decorator_js_1.tool)('assets-material-save'),
    (0, decorator_js_1.title)('Save Material'),
    (0, decorator_js_1.description)('Save Creator-compatible material dump data to a cc.Material asset. The implementation writes only modified values, then reimports through AssetDB to keep the database state consistent.'),
    (0, decorator_js_1.result)(schema_1.SchemaVoidResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaMaterialDump)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "saveMaterial", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-serialized-data'),
    (0, decorator_js_1.title)('Query Serialized Asset Data'),
    (0, decorator_js_1.description)('Query Creator-compatible serialized asset dump data through assets.serializedData.query. Supports only cc.PhysicsMaterial and cc.RenderPipeline in the first batch. The returned dump is the raw IProperty structure consumed by ui-prop type="dump": PhysicsMaterial returns a property map, while RenderPipeline returns one top-level IProperty.'),
    (0, decorator_js_1.result)(schema_1.SchemaSerializedAssetResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "querySerializedData", null);
__decorate([
    (0, decorator_js_1.tool)('assets-save-serialized-data'),
    (0, decorator_js_1.title)('Save Serialized Asset Data'),
    (0, decorator_js_1.description)('Save Creator-compatible serialized asset dump data through assets.serializedData.save. Supports only cc.PhysicsMaterial and cc.RenderPipeline in the first batch. Prefer passing an IProperty or full dump patch returned by assets-query-serialized-data; unknown fields are rejected, and hidden or readonly fields can only pass through unchanged.'),
    (0, decorator_js_1.result)(schema_1.SchemaSerializedAssetResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaSerializedAssetPatch)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "saveSerializedData", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-graph-variant-query'),
    (0, decorator_js_1.title)('Query Animation Graph Variant'),
    (0, decorator_js_1.description)('Load an AnimationGraphVariant asset and return its referenced graph UUID, valid clip override rows, and invalid saved override entries.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationGraphVariantResult),
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUrlOrUUID)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAnimationGraphVariant", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-graph-variant-change'),
    (0, decorator_js_1.title)('Change Animation Graph Variant'),
    (0, decorator_js_1.description)('Update the pending AnimationGraphVariant edit. Changing graphUuid rebuilds the original clip list from the new graph; otherwise clips updates override mappings.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationGraphVariantResult),
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUrlOrUUID)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaAnimationGraphVariantDump)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "changeAnimationGraphVariant", null);
__decorate([
    (0, decorator_js_1.tool)('assets-animation-graph-variant-save'),
    (0, decorator_js_1.title)('Save Animation Graph Variant'),
    (0, decorator_js_1.description)('Save the pending AnimationGraphVariant edit created by query/change. This method takes only the asset UUID and writes the cached pending dump.'),
    (0, decorator_js_1.result)(schema_1.SchemaAnimationGraphVariantSaveResult),
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUrlOrUUID)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "saveAnimationGraphVariant", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-uuid'),
    (0, decorator_js_1.title)('Query Asset UUID') // 查询资源 UUID
    ,
    (0, decorator_js_1.description)('Query the UUID of the exact asset addressed by a URL or file path. This does not automatically choose a typed sub-asset: querying an image URL returns its parent ImageAsset UUID. Use assets-query-asset-info and inspect subAssets when a component requires cc.SpriteFrame or another specific Asset type.') // 查询 URL 或路径直接指向资源的 UUID；不会自动选择 SpriteFrame 等子资源
    ,
    (0, decorator_js_1.result)(schema_1.SchemaUUIDResult),
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUrlOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryUUID", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-path'),
    (0, decorator_js_1.title)('Query Asset File Path') // 查询资源文件路径
    ,
    (0, decorator_js_1.description)('Query the actual path of an asset in the file system based on its URL, UUID, or asset-db relative path such as assets/resources/Image/a.png. Returns an absolute path string.') // 根据资源的 URL、UUID 或 asset-db 相对路径查询资源在文件系统中的实际路径。返回绝对路径字符串。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaPathResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryPath", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-url'),
    (0, decorator_js_1.title)('Query Asset URL') // 查询资源 URL
    ,
    (0, decorator_js_1.description)('Query the URL address of an asset in the database based on its file path or UUID. Returns a URL in db:// protocol format.') // 根据资源的文件路径或 UUID 查询资源在数据库中的 URL 地址。返回 db:// 协议格式的 URL。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaUrlResult),
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryUrl", null);
__decorate([
    (0, decorator_js_1.title)('Query Asset Dependencies') // 查询资源依赖
    ,
    (0, decorator_js_1.description)('Query the list of other assets that the specified asset depends on. Supports querying normal asset dependencies, script dependencies, or all dependencies.') // 查询指定资源所依赖的其他资源列表。支持查询普通资源依赖、脚本依赖或全部依赖。
    ,
    (0, decorator_js_1.result)(zod_1.z.array(zod_1.z.string()).describe('List of dependent asset UUIDs')) // 依赖资源的 UUID 列表
    ,
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUrlOrUUID)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaQueryAssetType)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetDependencies", null);
__decorate([
    (0, decorator_js_1.title)('Query Asset Users') // 查询资源使用者
    ,
    (0, decorator_js_1.description)('Query the list of other assets that use the specified asset. Supports querying normal asset users, script users, or all users.') // 查询使用指定资源的其他资源列表。支持查询普通资源使用者、脚本使用者或全部使用者。
    ,
    (0, decorator_js_1.result)(zod_1.z.array(zod_1.z.string()).describe('List of asset UUIDs using this asset')) // 使用该资源的资源 UUID 列表
    ,
    __param(0, (0, decorator_js_1.param)(schema_identifier_1.SchemaUrlOrUUID)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaQueryAssetType)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetUsers", null);
__decorate([
    (0, decorator_js_1.title)('Query Sorted Plugin Scripts') // 查询排序后的插件脚本
    ,
    (0, decorator_js_1.description)('Query the sorted list of all plugin scripts in the project. Supports filtering plugin scripts by platform.') // 查询项目中所有插件脚本的排序列表。支持按平台筛选插件脚本。
    ,
    (0, decorator_js_1.result)(zod_1.z.array(schema_1.SchemaPluginScriptInfo).describe('List of plugin script information')) // 插件脚本信息列表
    ,
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaFilterPluginOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "querySortedPlugins", null);
__decorate([
    (0, decorator_js_1.tool)('assets-rename-asset'),
    (0, decorator_js_1.title)('Rename Asset') // 重命名资源
    ,
    (0, decorator_js_1.description)('Rename the specified asset in its current directory. The source can be a URL, UUID, or path. The newName parameter only changes the asset name and does not move it across directories; use moveAsset for moving. For file assets, include the extension in newName. Supports overwrite or automatic rename on conflicts.') // 在资源当前目录内重命名指定资源。source 支持 URL、UUID 或路径。newName 仅修改名称，不负责跨目录移动；如需移动请使用 moveAsset。文件资源请在 newName 中包含后缀名。支持冲突时覆盖或自动重命名。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetInfoResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaAssetNewName)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaAssetRenameOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "renameAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-move-asset'),
    (0, decorator_js_1.title)('Move Asset') // 移动资源
    ,
    (0, decorator_js_1.description)('Move assets from the source location to the target location. Supports moving files and folders, with options to overwrite or automatically rename.') // 将资源从源位置移动到目标位置。支持移动文件和文件夹，可选择是否覆盖或自动重命名。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetInfoResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaAssetMoveOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "moveAsset", null);
__decorate([
    (0, decorator_js_1.tool)('assets-update-default-user-data'),
    (0, decorator_js_1.title)('Update Default User Data') // 更新默认用户数据
    ,
    (0, decorator_js_1.description)('Update the default user data configuration for the specified asset handler. Used to modify the default import settings for assets.') // 更新指定资源处理器的默认用户数据配置。用于修改资源的默认导入设置。
    ,
    (0, decorator_js_1.result)(zod_1.z.null().describe('Update operation result (no return value)')) // 更新操作结果（无返回值）
    ,
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUserDataHandler)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaUpdateAssetUserDataPath)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaUpdateAssetUserDataValue)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "updateDefaultUserData", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-asset-user-data-config'),
    (0, decorator_js_1.title)('Query Asset User Data Config') // 查询资源用户数据配置
    ,
    (0, decorator_js_1.description)('Query the user data configuration information of the specified asset. Returns the asset\'s import configuration and user-defined data.') // 查询指定资源的用户数据配置信息。返回资源的导入配置和用户自定义数据。
    ,
    (0, decorator_js_1.result)(zod_1.z.any().nullable().describe('Asset user data configuration object')) // 资源用户数据配置对象
    ,
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetUserDataConfig", null);
__decorate([
    (0, decorator_js_1.tool)('assets-update-asset-user-data'),
    (0, decorator_js_1.title)('Update Asset User Data') // 更新资源用户数据
    ,
    (0, decorator_js_1.description)('Replace the complete userData object of the specified asset in one save. urlOrUuidOrPath accepts an asset URL, UUID, file path, or sub asset UUID in parentUuid@subMetaId format.') // 一次性整体替换指定资源的 userData，支持父资源与 parentUuid@subMetaId 子资源 UUID。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaUpdateAssetUserDataResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaUpdateAssetUserData)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "updateAssetUserData", null);
__decorate([
    (0, decorator_js_1.tool)('assets-update-asset-user-data-by-path'),
    (0, decorator_js_1.title)('Update Asset User Data By Path') // 按路径更新资源用户数据
    ,
    (0, decorator_js_1.description)('Update a single path in the userData of the specified asset. urlOrUuidOrPath accepts an asset URL, UUID, file path, or sub asset UUID in parentUuid@subMetaId format.') // 通过路径和值精确更新指定资源 userData 的单个字段，支持父资源与 parentUuid@subMetaId 子资源 UUID。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaUpdateAssetUserDataResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUrlOrUUIDOrPath)),
    __param(1, (0, decorator_js_1.param)(schema_1.SchemaUpdateAssetUserDataPath)),
    __param(2, (0, decorator_js_1.param)(schema_1.SchemaUpdateAssetUserDataValue)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "updateAssetUserDataByPath", null);
__decorate([
    (0, decorator_js_1.title)('Query Asset Config Map') // 查询资源配置映射表
    ,
    (0, decorator_js_1.description)('Query the basic configuration mapping table for each asset handler. Returns a mapping table containing configuration information such as asset display name, description, documentation URL, user data configuration, icon information, etc.') // 查询各个资源处理器的基本配置映射表。返回包含资源显示名称、描述、文档URL、用户数据配置、图标信息等配置信息的映射表。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetConfigMapResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryAssetConfigMap", null);
__decorate([
    (0, decorator_js_1.tool)('assets-query-property-schema'),
    (0, decorator_js_1.title)('Query Asset Import Property Schema') // 查询资源导入属性 schema
    ,
    (0, decorator_js_1.description)('Query the import property schema map for a specific asset importer. The result value follows ICocosConfigurationPropertySchema, using fields such as title, type, default, enum, enumDescriptions, minimum, maximum, step, properties, and items.') // 查询指定资源导入器的标准化导入属性 schema，用于面板自动渲染导入设置。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaAssetPropertySchemaResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaUserDataHandler)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsApi.prototype, "queryPropertySchema", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9hc3NldHMvYXNzZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQTRHa0I7QUFDbEIsNkJBQXdCO0FBQ3hCLDREQUFvRjtBQUNwRixxREFBNEc7QUFDNUcsOENBQWlFO0FBRWpFLGlFQUErRjtBQUMvRixxRUFNMEM7QUFFMUMsTUFBYSxTQUFTO0lBRWxCOztPQUVHO0lBS0csQUFBTixLQUFLLENBQUMsV0FBVyxDQUEyQixNQUFvQjtRQUM1RCxNQUFNLElBQUksR0FBbUIsMkJBQWEsQ0FBQyxPQUFPLENBQUM7UUFDbkQsTUFBTSxHQUFHLEdBQW1DO1lBQ3hDLElBQUksRUFBRSxJQUFJO1lBQ1YsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFO1NBQ25CLENBQUM7UUFFRixJQUFJLENBQUM7WUFDRCxNQUFNLHFCQUFZLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsR0FBRyxDQUFDLElBQUksR0FBRywyQkFBYSxDQUFDLElBQUksQ0FBQztZQUM5QixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFRDs7T0FFRztJQUtHLEFBQU4sS0FBSyxDQUFDLE9BQU8sQ0FBMkIsR0FBaUI7UUFDckQsTUFBTSxJ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LENBQUMsQ0FBQTs7OztvREFpQmhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBTY2hlbWFEYkRpclJlc3VsdCxcbiAgICBTY2hlbWFEaXJPckRiUGF0aCxcbiAgICBURGJEaXJSZXN1bHQsXG4gICAgVERpck9yRGJQYXRoLFxuICAgIFNjaGVtYVVybE9yVVVJRE9yUGF0aCxcbiAgICBTY2hlbWFEYXRhS2V5cyxcbiAgICBTY2hlbWFRdWVyeUFzc2V0c09wdGlvbixcbiAgICBTY2hlbWFTdXBwb3J0Q3JlYXRlVHlwZSxcbiAgICBTY2hlbWFUYXJnZXRQYXRoLFxuICAgIFNjaGVtYUFzc2V0T3BlcmF0aW9uT3B0aW9uLFxuICAgIFNjaGVtYVNvdXJjZVBhdGgsXG4gICAgU2NoZW1hU2F2ZUFzc2V0UGF0aCxcbiAgICBTY2hlbWFBc3NldERhdGEsXG4gICAgU2NoZW1hU2VyaWFsaXplZEFzc2V0UGF0Y2gsXG4gICAgU2NoZW1hU2VyaWFsaXplZEFzc2V0UmVzdWx0LFxuICAgIFNjaGVtYU1hdGVyaWFsRWZmZWN0TmFtZU9yVXVpZCxcbiAgICBTY2hlbWFNYXRlcmlhbER1bXAsXG4gICAgU2NoZW1hTWF0ZXJpYWxFZmZlY3RzUmVzdWx0LFxuICAgIFNjaGVtYU1hdGVyaWFsRWZmZWN0UmVzdWx0LFxuICAgIFNjaGVtYU1hdGVyaWFsUmVzdWx0LFxuICAgIFRVcmxPclVVSURPclBhdGgsXG4gICAgVFNhdmVBc3NldFBhdGgsXG4gICAgVERhdGFLZXlzLFxuICAgIFRRdWVyeUFzc2V0c09wdGlvbixcbiAgICBUU3VwcG9ydENyZWF0ZVR5cGUsXG4gICAgVEFzc2V0T3BlcmF0aW9uT3B0aW9uLFxuICAgIFRBc3NldERhdGEsXG4gICAgVFNlcmlhbGl6ZWRBc3NldFBhdGNoLFxuICAgIFRTZXJpYWxpemVkQXNzZXRSZXN1bHQsXG4gICAgVE1hdGVyaWFsRWZmZWN0TmFtZU9yVXVpZCxcbiAgICBUTWF0ZXJpYWxEdW1wLFxuICAgIFRNYXRlcmlhbEVmZmVjdHNSZXN1bHQsXG4gICAgVE1hdGVyaWFsRWZmZWN0UmVzdWx0LFxuICAgIFRNYXRlcmlhbFJlc3VsdCxcbiAgICBTY2hlbWFBc3NldEluZm9SZXN1bHQsXG4gICAgU2NoZW1hQXNzZXRNZXRhUmVzdWx0LFxuICAgIFNjaGVtYUNyZWF0ZU1hcFJlc3VsdCxcbiAgICBTY2hlbWFBc3NldEluZm9zUmVzdWx0LFxuICAgIFNjaGVtYUFzc2V0REJJbmZvc1Jlc3VsdCxcbiAgICBTY2hlbWFDcmVhdGVkQXNzZXRSZXN1bHQsXG4gICAgU2NoZW1hSW1wb3J0ZWRBc3NldFJlc3VsdCxcbiAgICBTY2hlbWFSZWltcG9ydFJlc3VsdCxcbiAgICBTY2hlbWFTYXZlQXNzZXRSZXN1bHQsXG4gICAgVEFzc2V0SW5mb1Jlc3VsdCxcbiAgICBUQXNzZXRNZXRhUmVzdWx0LFxuICAgIFRDcmVhdGVNYXBSZXN1bHQsXG4gICAgVEFzc2V0SW5mb3NSZXN1bHQsXG4gICAgVEFzc2V0REJJbmZvc1Jlc3VsdCxcbiAgICBUQ3JlYXRlZEFzc2V0UmVzdWx0LFxuICAgIFRJbXBvcnRlZEFzc2V0UmVzdWx0LFxuICAgIFRSZWltcG9ydFJlc3VsdCxcbiAgICBUU2F2ZUFzc2V0UmVzdWx0LFxuICAgIFRSZWZyZXNoRGlyUmVzdWx0LFxuICAgIFNjaGVtYUJhc2VOYW1lLFxuICAgIFNjaGVtYUFzc2V0TmV3TmFtZSxcbiAgICBUQmFzZU5hbWUsXG4gICAgVEFzc2V0TmV3TmFtZSxcbiAgICBTY2hlbWFSZWZyZXNoRGlyUmVzdWx0LFxuICAgIFNjaGVtYUNyZWF0ZUFzc2V0QnlUeXBlT3B0aW9ucyxcbiAgICBUQ3JlYXRlQXNzZXRCeVR5cGVPcHRpb25zLFxuICAgIFNjaGVtYUNyZWF0ZUFzc2V0T3B0aW9ucyxcbiAgICBUQ3JlYXRlQXNzZXRPcHRpb25zLFxuICAgIFNjaGVtYVVVSURSZXN1bHQsXG4gICAgU2NoZW1hUGF0aFJlc3VsdCxcbiAgICBTY2hlbWFVcmxSZXN1bHQsXG4gICAgVFVVSURSZXN1bHQsXG4gICAgVFBhdGhSZXN1bHQsXG4gICAgVFVybFJlc3VsdCxcbiAgICBTY2hlbWFRdWVyeUFzc2V0VHlwZSxcbiAgICBTY2hlbWFGaWx0ZXJQbHVnaW5PcHRpb25zLFxuICAgIFNjaGVtYVBsdWdpblNjcmlwdEluZm8sXG4gICAgU2NoZW1hQXNzZXRNb3ZlT3B0aW9ucyxcbiAgICBTY2hlbWFBc3NldFJlbmFtZU9wdGlvbnMsXG4gICAgU2NoZW1hVXNlckRhdGFIYW5kbGVyLFxuICAgIFRRdWVyeUFzc2V0VHlwZSxcbiAgICBURmlsdGVyUGx1Z2luT3B0aW9ucyxcbiAgICBUUGx1Z2luU2NyaXB0SW5mbyxcbiAgICBUQXNzZXRNb3ZlT3B0aW9ucyxcbiAgICBUQXNzZXRSZW5hbWVPcHRpb25zLFxuICAgIFRVc2VyRGF0YUhhbmRsZXIsXG4gICAgU2NoZW1hVXBkYXRlQXNzZXRVc2VyRGF0YSxcbiAgICBTY2hlbWFVcGRhdGVBc3NldFVzZXJEYXRhUGF0aCxcbiAgICBTY2hlbWFVcGRhdGVBc3NldFVzZXJEYXRhVmFsdWUsXG4gICAgU2NoZW1hVXBkYXRlQXNzZXRVc2VyRGF0YVJlc3VsdCxcbiAgICBUVXBkYXRlQXNzZXRVc2VyRGF0YSxcbiAgICBUVXBkYXRlQXNzZXRVc2VyRGF0YVBhdGgsXG4gICAgVFVwZGF0ZUFzc2V0VXNlckRhdGFWYWx1ZSxcbiAgICBUVXBkYXRlQXNzZXRVc2VyRGF0YVJlc3VsdCxcbiAgICBTY2hlbWFBc3NldENvbmZpZ01hcFJlc3VsdCxcbiAgICBUQXNzZXRDb25maWdNYXBSZXN1bHQsXG4gICAgU2NoZW1hQXNzZXRQcm9wZXJ0eVNjaGVtYVJlc3VsdCxcbiAgICBUQXNzZXRQcm9wZXJ0eVNjaGVtYVJlc3VsdCxcbiAgICBUVVVJRE9yUGF0aCxcbiAgICBUVXJsT3JVVUlELFxuICAgIFRVcmxPclBhdGgsXG4gICAgU2NoZW1hQW5pbWF0aW9uR3JhcGhWYXJpYW50RHVtcCxcbiAgICBTY2hlbWFBbmltYXRpb25HcmFwaFZhcmlhbnRSZXN1bHQsXG4gICAgU2NoZW1hQW5pbWF0aW9uR3JhcGhWYXJpYW50U2F2ZVJlc3VsdCxcbiAgICBUQW5pbWF0aW9uR3JhcGhWYXJpYW50RHVtcCxcbiAgICBUQW5pbWF0aW9uR3JhcGhWYXJpYW50UmVzdWx0LFxuICAgIFRBbmltYXRpb25HcmFwaFZhcmlhbnRTYXZlUmVzdWx0LFxuICAgIFNjaGVtYUFuaW1hdGlvbk1hc2tEdW1wLFxuICAgIFNjaGVtYUFuaW1hdGlvbk1hc2tDaGFuZ2VzLFxuICAgIFNjaGVtYVZvaWRSZXN1bHQsXG4gICAgVEFuaW1hdGlvbk1hc2tEdW1wLFxuICAgIFRBbmltYXRpb25NYXNrQ2hhbmdlcyxcbiAgICBUVm9pZFJlc3VsdCxcbn0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgeiB9IGZyb20gJ3pvZCc7XG5pbXBvcnQgeyBkZXNjcmlwdGlvbiwgcGFyYW0sIHJlc3VsdCwgdGl0bGUsIHRvb2wgfSBmcm9tICcuLi9kZWNvcmF0b3IvZGVjb3JhdG9yLmpzJztcbmltcG9ydCB7IENPTU1PTl9TVEFUVVMsIENvbW1vblJlc3VsdFR5cGUsIGdldENvbW1vbkVycm9yU3RhdHVzLCBIdHRwU3RhdHVzQ29kZSB9IGZyb20gJy4uL2Jhc2Uvc2NoZW1hLWJhc2UnO1xuaW1wb3J0IHsgYXNzZXREQk1hbmFnZXIsIGFzc2V0TWFuYWdlciB9IGZyb20gJy4uLy4uL2NvcmUvYXNzZXRzJztcbmltcG9ydCB7IElBc3NldEluZm8gfSBmcm9tICcuLi8uLi9jb3JlL2Fzc2V0cy9AdHlwZXMvcHVibGljJztcbmltcG9ydCB7IFNjaGVtYVVybE9yUGF0aCwgU2NoZW1hVXJsT3JVVUlELCBTY2hlbWFVVUlET3JQYXRoIH0gZnJvbSAnLi4vYmFzZS9zY2hlbWEtaWRlbnRpZmllcic7XG5pbXBvcnQge1xuICAgIGNoYW5nZUFuaW1hdGlvbk1hc2tEdW1wIGFzIGNoYW5nZUFuaW1hdGlvbk1hc2tEdW1wQ29yZSxcbiAgICBjbGVhckFuaW1hdGlvbk1hc2tOb2RlcyBhcyBjbGVhckFuaW1hdGlvbk1hc2tOb2Rlc0NvcmUsXG4gICAgaW1wb3J0QW5pbWF0aW9uTWFza1NrZWxldG9uIGFzIGltcG9ydEFuaW1hdGlvbk1hc2tTa2VsZXRvbkNvcmUsXG4gICAgcXVlcnlBbmltYXRpb25NYXNrIGFzIHF1ZXJ5QW5pbWF0aW9uTWFza0NvcmUsXG4gICAgc2F2ZUFuaW1hdGlvbk1hc2sgYXMgc2F2ZUFuaW1hdGlvbk1hc2tDb3JlLFxufSBmcm9tICcuLi8uLi9jb3JlL2Fzc2V0cy9hbmltYXRpb24tbWFzayc7XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNBcGkge1xuXG4gICAgLyoqXG4gICAgICogRGVsZXRlIEFzc2V0IC8vIOWIoOmZpOi1hOa6kFxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtZGVsZXRlLWFzc2V0JylcbiAgICBAdGl0bGUoJ0RlbGV0ZSBQcm9qZWN0IEFzc2V0JykgLy8g5Yig6Zmk6aG555uu6LWE5rqQXG4gICAgQGRlc2NyaXB0aW9uKCdEZWxldGUgc3BlY2lmaWVkIGFzc2V0IGZpbGVzIGZyb20gdGhlIENvY29zIENyZWF0b3IgcHJvamVjdC4gU3VwcG9ydHMgZGVsZXRpbmcgc2luZ2xlIGZpbGVzIG9yIGVudGlyZSBkaXJlY3Rvcmllcy4gRGVsZXRlZCBhc3NldHMgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGFzc2V0IGRhdGFiYXNlLCBhbmQgY29ycmVzcG9uZGluZyAubWV0YSBmaWxlcyB3aWxsIGFsc28gYmUgZGVsZXRlZC4gVGhlIGRlbGV0aW9uIG9wZXJhdGlvbiBpcyBpcnJldmVyc2libGUsIHBsZWFzZSB1c2Ugd2l0aCBjYXV0aW9uLicpIC8vIOS7jiBDb2NvcyBDcmVhdG9yIOmhueebruS4reWIoOmZpOaMh+WumueahOi1hOa6kOaWh+S7tuOAguaUr+aMgeWIoOmZpOWNleS4quaWh+S7tuaIluaVtOS4quebruW9leOAguWIoOmZpOeahOi1hOa6kOS8muS7jui1hOa6kOaVsOaNruW6k+S4reenu+mZpO+8jOWQjOaXtuWIoOmZpOWvueW6lOeahCAubWV0YSDmlofku7bjgILliKDpmaTmk43kvZzkuI3lj6/pgIbvvIzor7fosKjmhY7kvb/nlKjjgIJcbiAgICBAcmVzdWx0KFNjaGVtYURiRGlyUmVzdWx0KVxuICAgIGFzeW5jIGRlbGV0ZUFzc2V0KEBwYXJhbShTY2hlbWFEaXJPckRiUGF0aCkgZGJQYXRoOiBURGlyT3JEYlBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VERiRGlyUmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFREYkRpclJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogeyBkYlBhdGggfSxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXNzZXRNYW5hZ2VyLnJlbW92ZUFzc2V0KGRiUGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5GQUlMO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigncmVtb3ZlIGFzc2V0IGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2ggQXNzZXQgRGlyZWN0b3J5IC8vIOWIt+aWsOi1hOa6kOebruW9lVxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtcmVmcmVzaCcpXG4gICAgQHRpdGxlKCdSZWZyZXNoIEFzc2V0IERpcmVjdG9yeScpIC8vIOWIt+aWsOi1hOa6kOebruW9lVxuICAgIEBkZXNjcmlwdGlvbignUmVmcmVzaCB0aGUgc3BlY2lmaWVkIGFzc2V0IGRpcmVjdG9yeSBpbiB0aGUgQ29jb3MgQ3JlYXRvciBwcm9qZWN0LCByZXNjYW4gYWxsIGFzc2V0IGZpbGVzIGluIHRoZSBkaXJlY3RvcnksIGFuZCB1cGRhdGUgdGhlIGFzc2V0IGRhdGFiYXNlIGluZGV4LiBUaGlzIG1ldGhvZCBuZWVkcyB0byBiZSBjYWxsZWQgdG8gc3luY2hyb25pemUgdGhlIGFzc2V0IHN0YXR1cyB3aGVuIGFzc2V0IGZpbGVzIGFyZSBtb2RpZmllZCBleHRlcm5hbGx5IG9yIG5ldyBmaWxlcyBhcmUgYWRkZWQuJykgLy8g5Yi35pawIENvY29zIENyZWF0b3Ig6aG555uu5Lit55qE5oyH5a6a6LWE5rqQ55uu5b2V77yM6YeN5paw5omr5o+P55uu5b2V5LiL55qE5omA5pyJ6LWE5rqQ5paH5Lu277yM5pu05paw6LWE5rqQ5pWw5o2u5bqT57Si5byV44CC5b2T5aSW6YOo5L+u5pS55LqG6LWE5rqQ5paH5Lu25oiW5re75Yqg5LqG5paw5paH5Lu25pe277yM6ZyA6KaB6LCD55So5q2k5pa55rOV5ZCM5q2l6LWE5rqQ54q25oCB44CCXG4gICAgQHJlc3VsdChTY2hlbWFSZWZyZXNoRGlyUmVzdWx0KVxuICAgIGFzeW5jIHJlZnJlc2goQHBhcmFtKFNjaGVtYURpck9yRGJQYXRoKSBkaXI6IFREaXJPckRiUGF0aCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUmVmcmVzaERpclJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUUmVmcmVzaERpclJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXNzZXRNYW5hZ2VyLnJlZnJlc2hBc3NldChkaXIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigncmVmcmVzaCBkaXIgZmFpbDonLCBlKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IEFzc2V0IEluZm8gLy8g5p+l6K+i6LWE5rqQ5L+h5oGvXG4gICAgICovXG4gICAgQHRvb2woJ2Fzc2V0cy1xdWVyeS1hc3NldC1pbmZvJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IERldGFpbGVkIEFzc2V0IEluZm8nKSAvLyDmn6Xor6LotYTmupDor6bnu4bkv6Hmga9cbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IGRldGFpbGVkIGFzc2V0IGluZm9ybWF0aW9uIGJ5IFVSTCwgVVVJRCwgb3IgZmlsZSBwYXRoLiBCeSBkZWZhdWx0IHRoZSByZXN1bHQgaW5jbHVkZXMgc3ViQXNzZXRzOyB1c2UgZWFjaCBzdWItYXNzZXQgdHlwZSAoZm9yIGV4YW1wbGUgdHlwZSA9PT0gXCJjYy5TcHJpdGVGcmFtZVwiKSB0byBzZWxlY3QgdGhlIFVVSUQgcmVxdWlyZWQgYnkgYSBjb21wb25lbnQgcHJvcGVydHkuIFNwZWNpZnkgZGF0YUtleXMsIGluY2x1ZGluZyBcInN1YkFzc2V0c1wiIGFuZCBcImV4dGVuZHNcIiwgd2hlbiBhbiBleHBsaWNpdCBmaWVsZCBsaXN0IGlzIG5lZWRlZC4nKSAvLyDmoLnmja4gVVJM44CBVVVJRCDmiJbmlofku7bot6/lvoTmn6Xor6LotYTmupDor6bmg4XvvJvpu5jorqTljIXlkKvlrZDotYTmupDvvIzlj6/mjIkgdHlwZSDpgInmi6nnu4Tku7blsZ7mgKfmiYDpnIDnmoTlrZDotYTmupAgVVVJRFxuICAgIEByZXN1bHQoU2NoZW1hQXNzZXRJbmZvUmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5QXNzZXRJbmZvKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1cmxPclVVSURPclBhdGg6IFRVcmxPclVVSURPclBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFEYXRhS2V5cykgZGF0YUtleXM/OiBURGF0YUtleXNcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFzc2V0SW5mb1Jlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQXNzZXRJbmZvUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1cmxPclVVSURPclBhdGgsIGRhdGFLZXlzIGFzIChrZXlvZiBJQXNzZXRJbmZvKVtdIHwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIGlmICghcmV0LmRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuTk9UX0ZPVU5EO1xuICAgICAgICAgICAgICAgIHJldC5yZWFzb24gPSBg4p2MQXNzZXQgY2FuIG5vdCBiZSBmb3VuZDogJHt1cmxPclVVSURPclBhdGh9LiBQbGVhc2UgcmVmcmVzaCBhc3NldCBkYiBhbmQgdHJ5IGFnYWluLmA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBhc3NldCBpbmZvIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IEFzc2V0IE1ldGFkYXRhIC8vIOafpeivoui1hOa6kOWFg+aVsOaNrlxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtcXVlcnktYXNzZXQtbWV0YScpXG4gICAgQHRpdGxlKCdRdWVyeSBBc3NldCBNZXRhZGF0YScpIC8vIOafpeivoui1hOa6kOWFg+aVsOaNrlxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgdGhlIGNvbnRlbnQgb2YgdGhlIC5tZXRhIGZpbGUgb2YgYW4gYXNzZXQgYmFzZWQgb24gaXRzIFVSTCwgVVVJRCwgb3IgZmlsZSBwYXRoLiBNZXRhZGF0YSBpbmNsdWRlcyBhc3NldCBpbXBvcnQgY29uZmlndXJhdGlvbiwgdXNlci1kZWZpbmVkIGRhdGEsIHZlcnNpb24gaW5mb3JtYXRpb24sIGV0Yy4nKSAvLyDmoLnmja7otYTmupDnmoQgVVJM44CBVVVJRCDmiJbmlofku7bot6/lvoTmn6Xor6LotYTmupDnmoQgLm1ldGEg5paH5Lu25YaF5a6544CC5YWD5pWw5o2u5YyF5ZCr6LWE5rqQ55qE5a+85YWl6YWN572u44CB55So5oi36Ieq5a6a5LmJ5pWw5o2u44CB54mI5pys5L+h5oGv562J44CCXG4gICAgQHJlc3VsdChTY2hlbWFBc3NldE1ldGFSZXN1bHQpXG4gICAgYXN5bmMgcXVlcnlBc3NldE1ldGEoQHBhcmFtKFNjaGVtYVVybE9yVVVJRE9yUGF0aCkgdXJsT3JVVUlET3JQYXRoOiBUVXJsT3JVVUlET3JQYXRoKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRBc3NldE1ldGFSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFzc2V0TWV0YVJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBc3NldE1ldGEodXJsT3JVVUlET3JQYXRoKTtcbiAgICAgICAgICAgIGlmICghcmV0LmRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuTk9UX0ZPVU5EO1xuICAgICAgICAgICAgICAgIHJldC5yZWFzb24gPSBgQXNzZXQgbm90IGZvdW5kOiAke3VybE9yVVVJRE9yUGF0aH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigncXVlcnkgYXNzZXQgbWV0YSBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBDcmVhdGFibGUgQXNzZXQgTWFwIC8vIOafpeivouWPr+WIm+W7uui1hOa6kOaYoOWwhOihqFxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtcXVlcnktY3JlYXRlLW1hcCcpXG4gICAgQHRpdGxlKCdRdWVyeSBDcmVhdGFibGUgQXNzZXQgTWFwJykgLy8g5p+l6K+i5Y+v5Yib5bu66LWE5rqQ5pig5bCE6KGoXG4gICAgQGRlc2NyaXB0aW9uKCdHZXQgdGhlIG1hcHBpbmcgdGFibGUgb2YgYWxsIHN1cHBvcnRlZCBjcmVhdGFibGUgYXNzZXQgdHlwZXMuIFRoZSByZXR1cm5lZCBtYXBwaW5nIHRhYmxlIGNvbnRhaW5zIGFzc2V0IGhhbmRsZXIgbmFtZXMsIGNvcnJlc3BvbmRpbmcgZW5naW5lIHR5cGVzLCBjcmVhdGlvbiBtZW51IGluZm9ybWF0aW9uLCBldGMuLCB1c2VkIHRvIHVuZGVyc3RhbmQgd2hpY2ggdHlwZXMgb2YgYXNzZXRzIHRoZSBzeXN0ZW0gc3VwcG9ydHMgY3JlYXRpbmcuJykgLy8g6I635Y+W5omA5pyJ5pSv5oyB5Yib5bu655qE6LWE5rqQ57G75Z6L5pig5bCE6KGo44CC6L+U5Zue55qE5pig5bCE6KGo5YyF5ZCr6LWE5rqQ5aSE55CG5Zmo5ZCN56ew44CB5a+55bqU55qE5byV5pOO57G75Z6L44CB5Yib5bu66I+c5Y2V5L+h5oGv562J77yM55So5LqO5LqG6Kej57O757uf5pSv5oyB5Yib5bu65ZOq5Lqb57G75Z6L55qE6LWE5rqQ44CCXG4gICAgQHJlc3VsdChTY2hlbWFDcmVhdGVNYXBSZXN1bHQpXG4gICAgYXN5bmMgcXVlcnlDcmVhdGVNYXAoKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRDcmVhdGVNYXBSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VENyZWF0ZU1hcFJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogW10sXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLmdldENyZWF0ZU1hcCgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IGNyZWF0ZSBtYXAgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQmF0Y2ggUXVlcnkgQXNzZXQgSW5mbyAvLyDmibnph4/mn6Xor6LotYTmupDkv6Hmga9cbiAgICAgKi9cbiAgICAvLyBAdG9vbCgnYXNzZXRzLXF1ZXJ5LWFzc2V0LWluZm9zJylcbiAgICBAdGl0bGUoJ0JhdGNoIFF1ZXJ5IEFzc2V0IEluZm8nKSAvLyDmibnph4/mn6Xor6LotYTmupDkv6Hmga9cbiAgICBAZGVzY3JpcHRpb24oJ0JhdGNoIHJldHJpZXZlIGFzc2V0IGluZm9ybWF0aW9uIGJhc2VkIG9uIHF1ZXJ5IGNvbmRpdGlvbnMuIFN1cHBvcnRzIGZpbHRlcmluZyBieSBhc3NldCB0eXBlLCBpbXBvcnRlciwgcGF0aCBwYXR0ZXJuLCBleHRlbnNpb24sIHVzZXJEYXRhLCBldGMuIENhbiBiZSB1c2VkIGZvciBhc3NldCBsaXN0IGRpc3BsYXksIGJhdGNoIHByb2Nlc3NpbmcsIGFuZCBvdGhlciBzY2VuYXJpb3MuJykgLy8g5qC55o2u5p+l6K+i5p2h5Lu25om56YeP6I635Y+W6LWE5rqQ5L+h5oGv44CC5pSv5oyB5oyJ6LWE5rqQ57G75Z6L44CB5a+85YWl5Zmo44CB6Lev5b6E5qih5byP44CB5omp5bGV5ZCN44CBdXNlckRhdGEg562J5p2h5Lu2562b6YCJ44CC5Y+v55So5LqO6LWE5rqQ5YiX6KGo5bGV56S644CB5om56YeP5aSE55CG562J5Zy65pmv44CCXG4gICAgQHJlc3VsdChTY2hlbWFBc3NldEluZm9zUmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5QXNzZXRJbmZvcyhAcGFyYW0oU2NoZW1hUXVlcnlBc3NldHNPcHRpb24pIG9wdGlvbnM/OiBUUXVlcnlBc3NldHNPcHRpb24pOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFzc2V0SW5mb3NSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFzc2V0SW5mb3NSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mb3Mob3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5GQUlMO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigncXVlcnkgYXNzZXQgaW5mb3MgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgQWxsIEFzc2V0IERhdGFiYXNlIEluZm8gLy8g5p+l6K+i5omA5pyJ6LWE5rqQ5pWw5o2u5bqT5L+h5oGvXG4gICAgICovXG4gICAgLy8gQHRvb2woJ2Fzc2V0cy1xdWVyeS1hc3NldC1kYi1pbmZvcycpXG4gICAgQHRpdGxlKCdRdWVyeSBBbGwgQXNzZXQgRGF0YWJhc2UgSW5mbycpIC8vIOafpeivouaJgOaciei1hOa6kOaVsOaNruW6k+S/oeaBr1xuICAgIEBkZXNjcmlwdGlvbignR2V0IGluZm9ybWF0aW9uIGFib3V0IGFsbCBhc3NldCBkYXRhYmFzZXMgaW4gdGhlIHByb2plY3QsIGluY2x1ZGluZyB0aGUgYnVpbHQtaW4gZGF0YWJhc2UgKGludGVybmFsKSwgYXNzZXQgZGF0YWJhc2UgKGFzc2V0cyksIGV0Yy4gUmV0dXJucyBkYXRhYmFzZSBjb25maWd1cmF0aW9uLCBwYXRoLCBvcHRpb25zLCBhbmQgb3RoZXIgaW5mb3JtYXRpb24uJykgLy8g6I635Y+W6aG555uu5Lit5omA5pyJ6LWE5rqQ5pWw5o2u5bqT55qE5L+h5oGv77yM5YyF5ous5YaF572u5pWw5o2u5bqT77yIaW50ZXJuYWzvvInjgIHotYTmupDmlbDmja7lupPvvIhhc3NldHPvvInnrYnjgILov5Tlm57mlbDmja7lupPnmoTphY3nva7jgIHot6/lvoTjgIHpgInpobnnrYnkv6Hmga/jgIJcbiAgICBAcmVzdWx0KFNjaGVtYUFzc2V0REJJbmZvc1Jlc3VsdClcbiAgICBhc3luYyBxdWVyeUFzc2V0REJJbmZvcygpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFzc2V0REJJbmZvc1Jlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQXNzZXREQkluZm9zUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBPYmplY3QudmFsdWVzKGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBhc3NldCBkYiBpbmZvcyBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgQXNzZXQgQnkgVHlwZSAvLyDmjInnsbvlnovliJvlu7rotYTmupBcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLWNyZWF0ZS1hc3NldC1ieS10eXBlJylcbiAgICBAdGl0bGUoJ0NyZWF0ZSBBc3NldCBCeSBUeXBlJykgLy8g5oyJ57G75Z6L5Yib5bu66LWE5rqQXG4gICAgQGRlc2NyaXB0aW9uKCdDcmVhdGUgYSBuZXcgYXNzZXQgYXQgdGhlIHRhcmdldCBwYXRoIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYXNzZXQgaGFuZGxlciB0eXBlLiBTdXBwb3J0cyBjcmVhdGluZyB2YXJpb3VzIHJlc291cmNlcyBzdWNoIGFzIGFuaW1hdGlvbnMsIHNjcmlwdHMsIG1hdGVyaWFscywgc2NlbmVzLCBwcmVmYWJzLCBldGMuIFlvdSBjYW4gY3VzdG9taXplIGZpbGUgY29udGVudCwgdGVtcGxhdGUgbmFtZSwgb3IgY29udHJvbCB3aGV0aGVyIHRvIG92ZXJ3cml0ZSBvciBhdXRvbWF0aWNhbGx5IHJlbmFtZSB2aWEgdGhlIG9wdGlvbnMgcGFyYW1ldGVyLiBJZiBmaWxlIGNvbnRlbnQgaXMgbm90IHNwZWNpZmllZCwgdGhlIGJ1aWx0LWluIGRlZmF1bHQgdGVtcGxhdGUgZm9yIHRoZSBjb3JyZXNwb25kaW5nIHR5cGUgd2lsbCBiZSB1c2VkLicpIC8vIOagueaNruaMh+WumueahOi1hOa6kOWkhOeQhuWZqOexu+Wei+WcqOebruagh+i3r+W+hOWIm+W7uuaWsOi1hOa6kOOAguaUr+aMgeWIm+W7uuWKqOeUu+OAgeiEmuacrOOAgeadkOi0qOOAgeWcuuaZr+OAgemihOWItuS9k+etieWQhOexu+i1hOa6kOOAguWPr+mAmui/hyBvcHRpb25zIOWPguaVsOiHquWumuS5ieaWh+S7tuWGheWuueOAgeaooeadv+WQjeensOaIluiAheaOp+WItuaYr+WQpuimhuebluOAgeiHquWKqOmHjeWRveWQje+8jOacquaMh+WumuaWh+S7tuWGheWuueaXtuWwhuS9v+eUqOWvueW6lOexu+Wei+eahOWGhee9rum7mOiupOaooeadv+WIm+W7uuOAglxuICAgIEByZXN1bHQoU2NoZW1hQ3JlYXRlZEFzc2V0UmVzdWx0KVxuICAgIGFzeW5jIGNyZWF0ZUFzc2V0QnlUeXBlKFxuICAgICAgICBAcGFyYW0oU2NoZW1hU3VwcG9ydENyZWF0ZVR5cGUpIGNjVHlwZTogVFN1cHBvcnRDcmVhdGVUeXBlLFxuICAgICAgICBAcGFyYW0oU2NoZW1hRGlyT3JEYlBhdGgpIGRpck9yVXJsOiBURGlyT3JEYlBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFCYXNlTmFtZSkgYmFzZU5hbWU6IFRCYXNlTmFtZSxcbiAgICAgICAgQHBhcmFtKFNjaGVtYUNyZWF0ZUFzc2V0QnlUeXBlT3B0aW9ucykgb3B0aW9ucz86IFRDcmVhdGVBc3NldEJ5VHlwZU9wdGlvbnNcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VENyZWF0ZWRBc3NldFJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQ3JlYXRlZEFzc2V0UmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5jcmVhdGVBc3NldEJ5VHlwZShjY1R5cGUsIGRpck9yVXJsLCBiYXNlTmFtZSwgb3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2Fzc2V0cy1jcmVhdGUtYXNzZXQnKVxuICAgIEB0aXRsZSgnQ3JlYXRlIEFzc2V0JykgLy8g5Yib5bu66LWE5rqQXG4gICAgQGRlc2NyaXB0aW9uKCdDcmVhdGUgYSBDb2NvcyBhc3NldCBmcm9tIGZpbGUgY29udGVudCBvciBhIHRlbXBsYXRlLiBTZXQgb3B0aW9ucy50YXJnZXQgdG8gYW4gYXNzZXQtZGIgVVJMIHN1Y2ggYXMgZGI6Ly9hc3NldHMvc2NyaXB0cy9HYW1lTWFuYWdlci50cywgb3IgdG8gYW4gYWJzb2x1dGUgZmlsZSBwYXRoIGluc2lkZSBhbiBhc3NldCBkYXRhYmFzZSByb290LiBEbyBub3QgcGFzcyBhIHdlYiBVUkwgb3IgYSBwbGFpbiByZWxhdGl2ZSBwYXRoIGFzIHRhcmdldC4nKSAvLyDmoLnmja7mlofku7blhoXlrrnmiJbmqKHmnb/liJvlu7ogQ29jb3Mg6LWE5rqQ44CCb3B0aW9ucy50YXJnZXQg5L2/55SoIGRiOi8vYXNzZXRzL3NjcmlwdHMvR2FtZU1hbmFnZXIudHMg6L+Z57G7IGFzc2V0LWRiIFVSTO+8jOaIluS9jeS6jui1hOa6kOaVsOaNruW6k+agueebruW9leWGheeahOe7neWvuei3r+W+hO+8m+S4jeimgeS8oCBXZWIgVVJMIOaIluaZrumAmuebuOWvuei3r+W+hOOAglxuICAgIEByZXN1bHQoU2NoZW1hQ3JlYXRlZEFzc2V0UmVzdWx0KVxuICAgIGFzeW5jIGNyZWF0ZUFzc2V0KFxuICAgICAgICBAcGFyYW0oU2NoZW1hQ3JlYXRlQXNzZXRPcHRpb25zKSBvcHRpb25zOiBUQ3JlYXRlQXNzZXRPcHRpb25zXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRDcmVhdGVkQXNzZXRSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VENyZWF0ZWRBc3NldFJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIuY3JlYXRlQXNzZXQob3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcG9ydCBBc3NldCAvLyDlr7zlhaXotYTmupBcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLWltcG9ydC1hc3NldCcpXG4gICAgQHRpdGxlKCdJbXBvcnQgRXh0ZXJuYWwgQXNzZXQnKSAvLyDlr7zlhaXlpJbpg6jotYTmupBcbiAgICBAZGVzY3JpcHRpb24oJ0ltcG9ydCBleHRlcm5hbCBhc3NldCBmaWxlcyBpbnRvIHRoZSBwcm9qZWN0LiBDb3B5IGZpbGVzIGZyb20gdGhlIHNvdXJjZSBwYXRoIHRvIHRoZSB0YXJnZXQgcGF0aCwgYW5kIGF1dG9tYXRpY2FsbHkgZXhlY3V0ZSB0aGUgYXNzZXQgaW1wb3J0IHByb2Nlc3MgdG8gZ2VuZXJhdGUgLm1ldGEgZmlsZXMgYW5kIGxpYnJhcnkgZmlsZXMuIFN1aXRhYmxlIGZvciBpbnRyb2R1Y2luZyBpbWFnZXMsIGF1ZGlvLCBtb2RlbHMsIGFuZCBvdGhlciByZXNvdXJjZXMgZnJvbSBvdXRzaWRlLicpIC8vIOWwhuWklumDqOi1hOa6kOaWh+S7tuWvvOWFpeWIsOmhueebruS4reOAguS7jua6kOi3r+W+hOWkjeWItuaWh+S7tuWIsOebruagh+i3r+W+hO+8jOW5tuiHquWKqOaJp+ihjOi1hOa6kOWvvOWFpea1geeoi++8jOeUn+aIkCAubWV0YSDmlofku7blkozlupPmlofku7bjgILpgILnlKjkuo7ku47lpJbpg6jlvJXlhaXlm77niYfjgIHpn7PpopHjgIHmqKHlnovnrYnotYTmupDjgIJcbiAgICBAcmVzdWx0KFNjaGVtYUltcG9ydGVkQXNzZXRSZXN1bHQpXG4gICAgYXN5bmMgaW1wb3J0QXNzZXQoXG4gICAgICAgIEBwYXJhbShTY2hlbWFTb3VyY2VQYXRoKSBzb3VyY2U6IFREaXJPckRiUGF0aCxcbiAgICAgICAgQHBhcmFtKFNjaGVtYVRhcmdldFBhdGgpIHRhcmdldDogVERpck9yRGJQYXRoLFxuICAgICAgICBAcGFyYW0oU2NoZW1hQXNzZXRPcGVyYXRpb25PcHRpb24pIG9wdGlvbnM/OiBUQXNzZXRPcGVyYXRpb25PcHRpb25cbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEltcG9ydGVkQXNzZXRSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEltcG9ydGVkQXNzZXRSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5pbXBvcnRBc3NldChzb3VyY2UsIHRhcmdldCwgb3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdpbXBvcnQgYXNzZXQgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29weSBBc3NldCAvLyDlpI3liLbotYTmupBcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLWNvcHktYXNzZXQnKVxuICAgIEB0aXRsZSgnQ29weSBBc3NldCcpIC8vIOWkjeWItui1hOa6kFxuICAgIEBkZXNjcmlwdGlvbignQ29weSBhbiBleGlzdGluZyBtYWluIGFzc2V0IHRvIGEgbmV3IGxvY2F0aW9uIHRvZ2V0aGVyIHdpdGggaXRzIGNvbXBsZXRlIG1ldGFkYXRhLiBUaGUgY29waWVkIGFzc2V0IHJlY2VpdmVzIG5ldyBVVUlEcyB3aGlsZSBwcmVzZXJ2aW5nIGltcG9ydGVyIHNldHRpbmdzLCB1c2VyRGF0YSwgc3ViTWV0YXMsIGFuZCBpbnRlcm5hbCByZWZlcmVuY2VzLiBTdXBwb3J0cyBvdmVyd3JpdGUgb3IgYXV0b21hdGljIHJlbmFtZSBvbiBjb25mbGljdHMuJykgLy8g5bCG546w5pyJ5Li76LWE5rqQ5Y+K5YW25a6M5pW05YWD5pWw5o2u5aSN5Yi25Yiw5paw5L2N572u44CC5Ymv5pys5Lya6I635b6X5pawIFVVSUTvvIzlkIzml7bkv53nlZnlr7zlhaXorr7nva7jgIF1c2VyRGF0YeOAgXN1Yk1ldGFzIOWSjOWGhemDqOW8leeUqOOAguaUr+aMgeWGsueqgeaXtuimhuebluaIluiHquWKqOmHjeWRveWQjeOAglxuICAgIEByZXN1bHQoU2NoZW1hQXNzZXRJbmZvUmVzdWx0KVxuICAgIGFzeW5jIGNvcHlBc3NldChcbiAgICAgICAgQHBhcmFtKFNjaGVtYVVybE9yVVVJRE9yUGF0aCkgc291cmNlOiBUVXJsT3JVVUlET3JQYXRoLFxuICAgICAgICBAcGFyYW0oU2NoZW1hVGFyZ2V0UGF0aCkgdGFyZ2V0OiBURGlyT3JEYlBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFBc3NldE9wZXJhdGlvbk9wdGlvbikgb3B0aW9ucz86IFRBc3NldE9wZXJhdGlvbk9wdGlvblxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQXNzZXRJbmZvUmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFzc2V0SW5mb1Jlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5jb3B5QXNzZXQoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignY29weSBhc3NldCBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWltcG9ydCBBc3NldCAvLyDph43mlrDlr7zlhaXotYTmupBcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLXJlaW1wb3J0LWFzc2V0JylcbiAgICBAdGl0bGUoJ1JlaW1wb3J0IEFzc2V0JykgLy8g6YeN5paw5a+85YWl6LWE5rqQXG4gICAgQGRlc2NyaXB0aW9uKCdGb3JjZSByZWltcG9ydCBvZiBzcGVjaWZpZWQgYXNzZXRzLiBXaGVuIGFzc2V0IGZpbGVzIG9yIGltcG9ydCBjb25maWd1cmF0aW9ucyBjaGFuZ2UsIGNhbGwgdGhpcyBtZXRob2QgdG8gcmUtZXhlY3V0ZSB0aGUgaW1wb3J0IHByb2Nlc3MgYW5kIHVwZGF0ZSBsaWJyYXJ5IGZpbGVzIGFuZCBhc3NldCBpbmZvcm1hdGlvbi4gQ29tbW9ubHkgdXNlZCBmb3IgYXNzZXQgcmVwYWlyIG9yIHJlZnJlc2ggYWZ0ZXIgY29uZmlndXJhdGlvbiB1cGRhdGVzLicpIC8vIOW8uuWItumHjeaWsOWvvOWFpeaMh+Wumui1hOa6kOOAguW9k+i1hOa6kOaWh+S7tuaIluWvvOWFpemFjee9ruWPkeeUn+WPmOWMluaXtu+8jOiwg+eUqOatpOaWueazlemHjeaWsOaJp+ihjOWvvOWFpea1geeoi++8jOabtOaWsOW6k+aWh+S7tuWSjOi1hOa6kOS/oeaBr+OAguW4uOeUqOS6jui1hOa6kOS/ruWkjeaIlumFjee9ruabtOaWsOWQjueahOWIt+aWsOOAglxuICAgIEByZXN1bHQoU2NoZW1hUmVpbXBvcnRSZXN1bHQpXG4gICAgYXN5bmMgcmVpbXBvcnRBc3NldChAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSBwYXRoT3JVcmxPclVVSUQ6IFRVcmxPclVVSURPclBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFJlaW1wb3J0UmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRSZWltcG9ydFJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnJlaW1wb3J0QXNzZXQocGF0aE9yVXJsT3JVVUlEKTtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXNzZXRJbmZvO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgKyBlLnN0YWNrIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTYXZlIEFzc2V0IC8vIOS/neWtmOi1hOa6kFxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtc2F2ZS1hc3NldCcpXG4gICAgQHRpdGxlKCdTYXZlIEFzc2V0IERhdGEnKSAvLyDkv53lrZjotYTmupDmlbDmja5cbiAgICBAZGVzY3JpcHRpb24oJ1NhdmUgY29tcGxldGUgY29udGVudCB0byBhbiBleGlzdGluZyBhc3NldCBmaWxlLiBSZXF1aXJlZCBhcmd1bWVudHM6IHBhdGhPclVybE9yVVVJRCAoZXhpc3RpbmcgYXNzZXQgVVJMLCBVVUlELCBvciBmaWxlIHBhdGgpIGFuZCBkYXRhIChjb21wbGV0ZSBmaWxlIGNvbnRlbnQpLiBEbyBub3QgY2FsbCB0aGlzIHRvb2wgd2l0aCBlbXB0eSBhcmd1bWVudHMuIFRoaXMgdG9vbCBkb2VzIG5vdCBjcmVhdGUgbmV3IGFzc2V0cyBvciB0ZW1wb3JhcnkgZmlsZXM7IGNyZWF0ZSB0aGUgYXNzZXQgZmlyc3Qgd2l0aCBhc3NldHMtY3JlYXRlLWFzc2V0LWJ5LXR5cGUgb3IgYXNzZXRzLWNyZWF0ZS1hc3NldCwgdGhlbiBjYWxsIHNhdmUuIEZvciBzY3JpcHRzLCBwYXNzIGNvbXBsZXRlIHN5bnRhY3RpY2FsbHkgdmFsaWQgY29udGVudC4gRm9yIHNjZW5lIGFuZCBwcmVmYWIgYXNzZXRzLCBwYXNzIGNvbXBsZXRlIHZhbGlkIENvY29zIHNlcmlhbGl6ZWQgSlNPTjsgcHJlZmVyIHNjZW5lLSogdG9vbHMgYW5kIHNjZW5lLXNhdmUgZm9yIHNjZW5lIGdyYXBoIGVkaXRzLicpXG4gICAgQHJlc3VsdChTY2hlbWFTYXZlQXNzZXRSZXN1bHQpXG4gICAgYXN5bmMgc2F2ZUFzc2V0KFxuICAgICAgICBAcGFyYW0oU2NoZW1hU2F2ZUFzc2V0UGF0aCkgcGF0aE9yVXJsT3JVVUlEOiBUU2F2ZUFzc2V0UGF0aCxcbiAgICAgICAgQHBhcmFtKFNjaGVtYUFzc2V0RGF0YSkgZGF0YTogVEFzc2V0RGF0YVxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUU2F2ZUFzc2V0UmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRTYXZlQXNzZXRSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnNhdmVBc3NldChwYXRoT3JVcmxPclVVSUQsIGRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignc2F2ZSBhc3NldCBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBAdG9vbCgnYXNzZXRzLWFuaW1hdGlvbi1tYXNrLXF1ZXJ5JylcbiAgICBAdGl0bGUoJ1F1ZXJ5IEFuaW1hdGlvbiBNYXNrJylcbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IGEgLmFuaW1hc2sgQW5pbWF0aW9uTWFzayBhc3NldCBhbmQgcmV0dXJuIGEgc3RhYmxlIERUTyBjb250YWluaW5nIGpvaW50IHBhdGhzLCBlbmFibGVkIHN0YXRlcywgYW5kIHRyZWUgc3RydWN0dXJlLiBUaGlzIHRvb2wgZG9lcyBub3QgZXhwb3NlIENyZWF0b3IgaW5zcGVjdG9yIHJlZmxlY3Rpb24gZHVtcC4nKVxuICAgIEByZXN1bHQoU2NoZW1hQW5pbWF0aW9uTWFza0R1bXApXG4gICAgYXN5bmMgcXVlcnlBbmltYXRpb25NYXNrKEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHV1aWQ6IFRVcmxPclVVSURPclBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFuaW1hdGlvbk1hc2tEdW1wIHwgbnVsbD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRBbmltYXRpb25NYXNrRHVtcCB8IG51bGw+ID0ge1xuICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBxdWVyeUFuaW1hdGlvbk1hc2tDb3JlKHV1aWQpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigncXVlcnkgYW5pbWF0aW9uIG1hc2sgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2Fzc2V0cy1hbmltYXRpb24tbWFzay1pbXBvcnQtc2tlbGV0b24nKVxuICAgIEB0aXRsZSgnSW1wb3J0IEFuaW1hdGlvbiBNYXNrIFNrZWxldG9uJylcbiAgICBAZGVzY3JpcHRpb24oJ0ltcG9ydCBqb2ludCBwYXRocyBmcm9tIGEgUHJlZmFiIG9yIGdsVEYtc2NlbmUgYXNzZXQgaW50byBhbiBBbmltYXRpb25NYXNrLiBFeGlzdGluZyBqb2ludCBzdGF0ZXMgYXJlIHByZXNlcnZlZCBhbmQgbWlzc2luZyBwYXRocyBhcmUgYXBwZW5kZWQgYXMgZW5hYmxlZC4gUGFzcyB0aGUgZ2xURi1zY2VuZSBzdWItYXNzZXQgVVVJRCB3aGVuIHBvc3NpYmxlLicpXG4gICAgQHJlc3VsdChTY2hlbWFBbmltYXRpb25NYXNrRHVtcClcbiAgICBhc3luYyBpbXBvcnRBbmltYXRpb25NYXNrU2tlbGV0b24oXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHV1aWQ6IFRVcmxPclVVSURPclBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHNrZWxldG9uU291cmNlVXVpZDogVFVybE9yVVVJRE9yUGF0aFxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQW5pbWF0aW9uTWFza0R1bXAgfCBudWxsPj4ge1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFuaW1hdGlvbk1hc2tEdW1wIHwgbnVsbD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGltcG9ydEFuaW1hdGlvbk1hc2tTa2VsZXRvbkNvcmUodXVpZCwgc2tlbGV0b25Tb3VyY2VVdWlkKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ltcG9ydCBhbmltYXRpb24gbWFzayBza2VsZXRvbiBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBAdG9vbCgnYXNzZXRzLWFuaW1hdGlvbi1tYXNrLWNsZWFyLW5vZGVzJylcbiAgICBAdGl0bGUoJ0NsZWFyIEFuaW1hdGlvbiBNYXNrIE5vZGVzJylcbiAgICBAZGVzY3JpcHRpb24oJ0NsZWFyIGFsbCBqb2ludCBwYXRocyBmcm9tIGFuIEFuaW1hdGlvbk1hc2sgYXNzZXQgYW5kIHJldHVybiB0aGUgdXBkYXRlZCBzdGFibGUgRFRPLicpXG4gICAgQHJlc3VsdChTY2hlbWFBbmltYXRpb25NYXNrRHVtcClcbiAgICBhc3luYyBjbGVhckFuaW1hdGlvbk1hc2tOb2RlcyhAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1dWlkOiBUVXJsT3JVVUlET3JQYXRoKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRBbmltYXRpb25NYXNrRHVtcCB8IG51bGw+PiB7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQW5pbWF0aW9uTWFza0R1bXAgfCBudWxsPiA9IHtcbiAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgY2xlYXJBbmltYXRpb25NYXNrTm9kZXNDb3JlKHV1aWQpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignY2xlYXIgYW5pbWF0aW9uIG1hc2sgbm9kZXMgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2Fzc2V0cy1hbmltYXRpb24tbWFzay1jaGFuZ2UtZHVtcCcpXG4gICAgQHRpdGxlKCdDaGFuZ2UgQW5pbWF0aW9uIE1hc2sgRHVtcCcpXG4gICAgQGRlc2NyaXB0aW9uKCdBcHBseSBwYXRoLWJhc2VkIGNoYW5nZXMgdG8gYW4gQW5pbWF0aW9uTWFzayBzdGFibGUgRFRPLiByZWN1cnNpdmUgZGVmYXVsdHMgdG8gZmFsc2U7IHBhc3MgcmVjdXJzaXZlPXRydWUgdG8gdXBkYXRlIGRlc2NlbmRhbnQgcGF0aHMuJylcbiAgICBAcmVzdWx0KFNjaGVtYUFuaW1hdGlvbk1hc2tEdW1wKVxuICAgIGFzeW5jIGNoYW5nZUFuaW1hdGlvbk1hc2tEdW1wKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1dWlkOiBUVXJsT3JVVUlET3JQYXRoLFxuICAgICAgICBAcGFyYW0oU2NoZW1hQW5pbWF0aW9uTWFza0NoYW5nZXMpIGNoYW5nZXM6IFRBbmltYXRpb25NYXNrQ2hhbmdlc1xuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQW5pbWF0aW9uTWFza0R1bXAgfCBudWxsPj4ge1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFuaW1hdGlvbk1hc2tEdW1wIHwgbnVsbD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGNoYW5nZUFuaW1hdGlvbk1hc2tEdW1wQ29yZSh1dWlkLCBjaGFuZ2VzKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NoYW5nZSBhbmltYXRpb24gbWFzayBkdW1wIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIEB0b29sKCdhc3NldHMtYW5pbWF0aW9uLW1hc2stc2F2ZScpXG4gICAgQHRpdGxlKCdTYXZlIEFuaW1hdGlvbiBNYXNrJylcbiAgICBAZGVzY3JpcHRpb24oJ05vcm1hbGl6ZSBhbmQgc2F2ZSB0aGUgY3VycmVudCBBbmltYXRpb25NYXNrIGFzc2V0IGNvbnRlbnQsIHRoZW4gcmVpbXBvcnQgdGhlIGFzc2V0LicpXG4gICAgQHJlc3VsdChTY2hlbWFWb2lkUmVzdWx0KVxuICAgIGFzeW5jIHNhdmVBbmltYXRpb25NYXNrKEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHV1aWQ6IFRVcmxPclVVSURPclBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFZvaWRSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUVm9pZFJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBzYXZlQW5pbWF0aW9uTWFza0NvcmUodXVpZCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdzYXZlIGFuaW1hdGlvbiBtYXNrIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IEFsbCBNYXRlcmlhbCBFZmZlY3RzIC8vIOafpeivouaJgOacieadkOi0qCBFZmZlY3RcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLW1hdGVyaWFsLXF1ZXJ5LWFsbC1lZmZlY3RzJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IE1hdGVyaWFsIEVmZmVjdHMnKVxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgYWxsIGF2YWlsYWJsZSBjYy5FZmZlY3RBc3NldCBlbnRyaWVzIGZvciBhc3NldHMubWF0ZXJpYWwucXVlcnlBbGxFZmZlY3RzLiBSZXR1cm5zIGVmZmVjdCBVVUlELCBuYW1lLCBoaWRlSW5FZGl0b3IgZmxhZywgYW5kIGFzc2V0IHBhdGguIFVzZSBVVUlEIGFzIHRoZSBzdGFibGUga2V5IHdoZW4gYnVpbGRpbmcgbWF0ZXJpYWwgZWZmZWN0IHNlbGVjdG9ycy4nKVxuICAgIEByZXN1bHQoU2NoZW1hTWF0ZXJpYWxFZmZlY3RzUmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5TWF0ZXJpYWxBbGxFZmZlY3RzKCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTWF0ZXJpYWxFZmZlY3RzUmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VE1hdGVyaWFsRWZmZWN0c1Jlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlNYXRlcmlhbEFsbEVmZmVjdHMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IG1hdGVyaWFsIGVmZmVjdHMgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgTWF0ZXJpYWwgRWZmZWN0IC8vIOafpeivouWNleS4quadkOi0qCBFZmZlY3RcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLW1hdGVyaWFsLXF1ZXJ5LWVmZmVjdCcpXG4gICAgQHRpdGxlKCdRdWVyeSBNYXRlcmlhbCBFZmZlY3QnKVxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgb25lIG1hdGVyaWFsIEVmZmVjdCBieSBVVUlELCBhc3NldCBVUkwvcGF0aCwgb3IgZWZmZWN0IG5hbWUuIFJldHVybnMgQ3JlYXRvci1jb21wYXRpYmxlIHRlY2huaXF1ZS9wYXNzL3Byb3BlcnR5IGR1bXAgZGF0YSBmb3IgZ2VuZXJhdGluZyB0aGUgbWF0ZXJpYWwgaW5zcGVjdG9yIFVJLicpXG4gICAgQHJlc3VsdChTY2hlbWFNYXRlcmlhbEVmZmVjdFJlc3VsdClcbiAgICBhc3luYyBxdWVyeU1hdGVyaWFsRWZmZWN0KFxuICAgICAgICBAcGFyYW0oU2NoZW1hTWF0ZXJpYWxFZmZlY3ROYW1lT3JVdWlkKSBlZmZlY3ROYW1lT3JVdWlkOiBUTWF0ZXJpYWxFZmZlY3ROYW1lT3JVdWlkXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRNYXRlcmlhbEVmZmVjdFJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRNYXRlcmlhbEVmZmVjdFJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlNYXRlcmlhbEVmZmVjdChlZmZlY3ROYW1lT3JVdWlkKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IG1hdGVyaWFsIGVmZmVjdCBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBNYXRlcmlhbCAvLyDmn6Xor6LmnZDotKhcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLW1hdGVyaWFsLXF1ZXJ5JylcbiAgICBAdGl0bGUoJ1F1ZXJ5IE1hdGVyaWFsJylcbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IGEgY2MuTWF0ZXJpYWwgYXNzZXQgYW5kIHJldHVybiBDcmVhdG9yLWNvbXBhdGlibGUgbWF0ZXJpYWwgZHVtcCBkYXRhLiBUaGUgZHVtcCBtZXJnZXMgZWZmZWN0IGRlZmF1bHRzIHdpdGggdmFsdWVzIHNhdmVkIGluIHRoZSAubXRsIGZpbGUgYW5kIGNhbiBiZSB1c2VkIGFzIHRoZSBpbnB1dCBmb3IgYXNzZXRzLW1hdGVyaWFsLXNhdmUuJylcbiAgICBAcmVzdWx0KFNjaGVtYU1hdGVyaWFsUmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5TWF0ZXJpYWwoXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHV1aWRPclVybE9yUGF0aDogVFVybE9yVVVJRE9yUGF0aFxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTWF0ZXJpYWxSZXN1bHQgfCBudWxsPj4ge1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VE1hdGVyaWFsUmVzdWx0IHwgbnVsbD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeU1hdGVyaWFsKHV1aWRPclVybE9yUGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBtYXRlcmlhbCBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTYXZlIE1hdGVyaWFsIC8vIOS/neWtmOadkOi0qFxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtbWF0ZXJpYWwtc2F2ZScpXG4gICAgQHRpdGxlKCdTYXZlIE1hdGVyaWFsJylcbiAgICBAZGVzY3JpcHRpb24oJ1NhdmUgQ3JlYXRvci1jb21wYXRpYmxlIG1hdGVyaWFsIGR1bXAgZGF0YSB0byBhIGNjLk1hdGVyaWFsIGFzc2V0LiBUaGUgaW1wbGVtZW50YXRpb24gd3JpdGVzIG9ubHkgbW9kaWZpZWQgdmFsdWVzLCB0aGVuIHJlaW1wb3J0cyB0aHJvdWdoIEFzc2V0REIgdG8ga2VlcCB0aGUgZGF0YWJhc2Ugc3RhdGUgY29uc2lzdGVudC4nKVxuICAgIEByZXN1bHQoU2NoZW1hVm9pZFJlc3VsdClcbiAgICBhc3luYyBzYXZlTWF0ZXJpYWwoXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHV1aWRPclVybE9yUGF0aDogVFVybE9yVVVJRE9yUGF0aCxcbiAgICAgICAgQHBhcmFtKFNjaGVtYU1hdGVyaWFsRHVtcCkgZHVtcDogVE1hdGVyaWFsRHVtcFxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUVm9pZFJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRWb2lkUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0TWFuYWdlci5zYXZlTWF0ZXJpYWwodXVpZE9yVXJsT3JQYXRoLCBkdW1wIGFzIGFueSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdzYXZlIG1hdGVyaWFsIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IFNlcmlhbGl6ZWQgQXNzZXQgRGF0YSAvLyDmn6Xor6Lluo/liJfljJbotYTmupDlsZ7mgKfmlbDmja5cbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLXF1ZXJ5LXNlcmlhbGl6ZWQtZGF0YScpXG4gICAgQHRpdGxlKCdRdWVyeSBTZXJpYWxpemVkIEFzc2V0IERhdGEnKVxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgQ3JlYXRvci1jb21wYXRpYmxlIHNlcmlhbGl6ZWQgYXNzZXQgZHVtcCBkYXRhIHRocm91Z2ggYXNzZXRzLnNlcmlhbGl6ZWREYXRhLnF1ZXJ5LiBTdXBwb3J0cyBvbmx5IGNjLlBoeXNpY3NNYXRlcmlhbCBhbmQgY2MuUmVuZGVyUGlwZWxpbmUgaW4gdGhlIGZpcnN0IGJhdGNoLiBUaGUgcmV0dXJuZWQgZHVtcCBpcyB0aGUgcmF3IElQcm9wZXJ0eSBzdHJ1Y3R1cmUgY29uc3VtZWQgYnkgdWktcHJvcCB0eXBlPVwiZHVtcFwiOiBQaHlzaWNzTWF0ZXJpYWwgcmV0dXJucyBhIHByb3BlcnR5IG1hcCwgd2hpbGUgUmVuZGVyUGlwZWxpbmUgcmV0dXJucyBvbmUgdG9wLWxldmVsIElQcm9wZXJ0eS4nKVxuICAgIEByZXN1bHQoU2NoZW1hU2VyaWFsaXplZEFzc2V0UmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5U2VyaWFsaXplZERhdGEoXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHV1aWRPclVybE9yUGF0aDogVFVybE9yVVVJRE9yUGF0aFxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUU2VyaWFsaXplZEFzc2V0UmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRTZXJpYWxpemVkQXNzZXRSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5U2VyaWFsaXplZERhdGEodXVpZE9yVXJsT3JQYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IHNlcmlhbGl6ZWQgYXNzZXQgZGF0YSBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTYXZlIFNlcmlhbGl6ZWQgQXNzZXQgRGF0YSAvLyDkv53lrZjluo/liJfljJbotYTmupDlsZ7mgKfmlbDmja5cbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLXNhdmUtc2VyaWFsaXplZC1kYXRhJylcbiAgICBAdGl0bGUoJ1NhdmUgU2VyaWFsaXplZCBBc3NldCBEYXRhJylcbiAgICBAZGVzY3JpcHRpb24oJ1NhdmUgQ3JlYXRvci1jb21wYXRpYmxlIHNlcmlhbGl6ZWQgYXNzZXQgZHVtcCBkYXRhIHRocm91Z2ggYXNzZXRzLnNlcmlhbGl6ZWREYXRhLnNhdmUuIFN1cHBvcnRzIG9ubHkgY2MuUGh5c2ljc01hdGVyaWFsIGFuZCBjYy5SZW5kZXJQaXBlbGluZSBpbiB0aGUgZmlyc3QgYmF0Y2guIFByZWZlciBwYXNzaW5nIGFuIElQcm9wZXJ0eSBvciBmdWxsIGR1bXAgcGF0Y2ggcmV0dXJuZWQgYnkgYXNzZXRzLXF1ZXJ5LXNlcmlhbGl6ZWQtZGF0YTsgdW5rbm93biBmaWVsZHMgYXJlIHJlamVjdGVkLCBhbmQgaGlkZGVuIG9yIHJlYWRvbmx5IGZpZWxkcyBjYW4gb25seSBwYXNzIHRocm91Z2ggdW5jaGFuZ2VkLicpXG4gICAgQHJlc3VsdChTY2hlbWFTZXJpYWxpemVkQXNzZXRSZXN1bHQpXG4gICAgYXN5bmMgc2F2ZVNlcmlhbGl6ZWREYXRhKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1dWlkT3JVcmxPclBhdGg6IFRVcmxPclVVSURPclBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFTZXJpYWxpemVkQXNzZXRQYXRjaCkgcGF0Y2g6IFRTZXJpYWxpemVkQXNzZXRQYXRjaFxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUU2VyaWFsaXplZEFzc2V0UmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRTZXJpYWxpemVkQXNzZXRSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnNhdmVTZXJpYWxpemVkRGF0YSh1dWlkT3JVcmxPclBhdGgsIHBhdGNoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NhdmUgc2VyaWFsaXplZCBhc3NldCBkYXRhIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuaW1hdGlvbiBHcmFwaCBWYXJpYW50XG4gICAgICovXG4gICAgQHRvb2woJ2Fzc2V0cy1hbmltYXRpb24tZ3JhcGgtdmFyaWFudC1xdWVyeScpXG4gICAgQHRpdGxlKCdRdWVyeSBBbmltYXRpb24gR3JhcGggVmFyaWFudCcpXG4gICAgQGRlc2NyaXB0aW9uKCdMb2FkIGFuIEFuaW1hdGlvbkdyYXBoVmFyaWFudCBhc3NldCBhbmQgcmV0dXJuIGl0cyByZWZlcmVuY2VkIGdyYXBoIFVVSUQsIHZhbGlkIGNsaXAgb3ZlcnJpZGUgcm93cywgYW5kIGludmFsaWQgc2F2ZWQgb3ZlcnJpZGUgZW50cmllcy4nKVxuICAgIEByZXN1bHQoU2NoZW1hQW5pbWF0aW9uR3JhcGhWYXJpYW50UmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5QW5pbWF0aW9uR3JhcGhWYXJpYW50KFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlEKSB1dWlkOiBUVXJsT3JVVUlEXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRBbmltYXRpb25HcmFwaFZhcmlhbnRSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQW5pbWF0aW9uR3JhcGhWYXJpYW50UmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIGRhdGE6IHVuZGVmaW5lZCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBbmltYXRpb25HcmFwaFZhcmlhbnQodXVpZCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBhbmltYXRpb24gZ3JhcGggdmFyaWFudCBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBAdG9vbCgnYXNzZXRzLWFuaW1hdGlvbi1ncmFwaC12YXJpYW50LWNoYW5nZScpXG4gICAgQHRpdGxlKCdDaGFuZ2UgQW5pbWF0aW9uIEdyYXBoIFZhcmlhbnQnKVxuICAgIEBkZXNjcmlwdGlvbignVXBkYXRlIHRoZSBwZW5kaW5nIEFuaW1hdGlvbkdyYXBoVmFyaWFudCBlZGl0LiBDaGFuZ2luZyBncmFwaFV1aWQgcmVidWlsZHMgdGhlIG9yaWdpbmFsIGNsaXAgbGlzdCBmcm9tIHRoZSBuZXcgZ3JhcGg7IG90aGVyd2lzZSBjbGlwcyB1cGRhdGVzIG92ZXJyaWRlIG1hcHBpbmdzLicpXG4gICAgQHJlc3VsdChTY2hlbWFBbmltYXRpb25HcmFwaFZhcmlhbnRSZXN1bHQpXG4gICAgYXN5bmMgY2hhbmdlQW5pbWF0aW9uR3JhcGhWYXJpYW50KFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlEKSB1dWlkOiBUVXJsT3JVVUlELFxuICAgICAgICBAcGFyYW0oU2NoZW1hQW5pbWF0aW9uR3JhcGhWYXJpYW50RHVtcCkgZHVtcDogVEFuaW1hdGlvbkdyYXBoVmFyaWFudER1bXBcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFuaW1hdGlvbkdyYXBoVmFyaWFudFJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRBbmltYXRpb25HcmFwaFZhcmlhbnRSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgZGF0YTogdW5kZWZpbmVkLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5jaGFuZ2VBbmltYXRpb25HcmFwaFZhcmlhbnQodXVpZCwgZHVtcCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdjaGFuZ2UgYW5pbWF0aW9uIGdyYXBoIHZhcmlhbnQgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2Fzc2V0cy1hbmltYXRpb24tZ3JhcGgtdmFyaWFudC1zYXZlJylcbiAgICBAdGl0bGUoJ1NhdmUgQW5pbWF0aW9uIEdyYXBoIFZhcmlhbnQnKVxuICAgIEBkZXNjcmlwdGlvbignU2F2ZSB0aGUgcGVuZGluZyBBbmltYXRpb25HcmFwaFZhcmlhbnQgZWRpdCBjcmVhdGVkIGJ5IHF1ZXJ5L2NoYW5nZS4gVGhpcyBtZXRob2QgdGFrZXMgb25seSB0aGUgYXNzZXQgVVVJRCBhbmQgd3JpdGVzIHRoZSBjYWNoZWQgcGVuZGluZyBkdW1wLicpXG4gICAgQHJlc3VsdChTY2hlbWFBbmltYXRpb25HcmFwaFZhcmlhbnRTYXZlUmVzdWx0KVxuICAgIGFzeW5jIHNhdmVBbmltYXRpb25HcmFwaFZhcmlhbnQoXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSUQpIHV1aWQ6IFRVcmxPclVVSURcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFuaW1hdGlvbkdyYXBoVmFyaWFudFNhdmVSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQW5pbWF0aW9uR3JhcGhWYXJpYW50U2F2ZVJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBhc3NldE1hbmFnZXIuc2F2ZUFuaW1hdGlvbkdyYXBoVmFyaWFudCh1dWlkKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NhdmUgYW5pbWF0aW9uIGdyYXBoIHZhcmlhbnQgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgQXNzZXQgVVVJRCAvLyDmn6Xor6LotYTmupAgVVVJRFxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtcXVlcnktdXVpZCcpXG4gICAgQHRpdGxlKCdRdWVyeSBBc3NldCBVVUlEJykgLy8g5p+l6K+i6LWE5rqQIFVVSURcbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IHRoZSBVVUlEIG9mIHRoZSBleGFjdCBhc3NldCBhZGRyZXNzZWQgYnkgYSBVUkwgb3IgZmlsZSBwYXRoLiBUaGlzIGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgY2hvb3NlIGEgdHlwZWQgc3ViLWFzc2V0OiBxdWVyeWluZyBhbiBpbWFnZSBVUkwgcmV0dXJucyBpdHMgcGFyZW50IEltYWdlQXNzZXQgVVVJRC4gVXNlIGFzc2V0cy1xdWVyeS1hc3NldC1pbmZvIGFuZCBpbnNwZWN0IHN1YkFzc2V0cyB3aGVuIGEgY29tcG9uZW50IHJlcXVpcmVzIGNjLlNwcml0ZUZyYW1lIG9yIGFub3RoZXIgc3BlY2lmaWMgQXNzZXQgdHlwZS4nKSAvLyDmn6Xor6IgVVJMIOaIlui3r+W+hOebtOaOpeaMh+WQkei1hOa6kOeahCBVVUlE77yb5LiN5Lya6Ieq5Yqo6YCJ5oupIFNwcml0ZUZyYW1lIOetieWtkOi1hOa6kFxuICAgIEByZXN1bHQoU2NoZW1hVVVJRFJlc3VsdClcbiAgICBhc3luYyBxdWVyeVVVSUQoQHBhcmFtKFNjaGVtYVVybE9yUGF0aCkgdXJsT3JQYXRoOiBUVXJsT3JQYXRoKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRVVUlEUmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRVVUlEUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGFzc2V0TWFuYWdlci5xdWVyeVVVSUQodXJsT3JQYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBVVUlEIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IEFzc2V0IFBhdGggLy8g5p+l6K+i6LWE5rqQ6Lev5b6EXG4gICAgICovXG4gICAgQHRvb2woJ2Fzc2V0cy1xdWVyeS1wYXRoJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IEFzc2V0IEZpbGUgUGF0aCcpIC8vIOafpeivoui1hOa6kOaWh+S7tui3r+W+hFxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgdGhlIGFjdHVhbCBwYXRoIG9mIGFuIGFzc2V0IGluIHRoZSBmaWxlIHN5c3RlbSBiYXNlZCBvbiBpdHMgVVJMLCBVVUlELCBvciBhc3NldC1kYiByZWxhdGl2ZSBwYXRoIHN1Y2ggYXMgYXNzZXRzL3Jlc291cmNlcy9JbWFnZS9hLnBuZy4gUmV0dXJucyBhbiBhYnNvbHV0ZSBwYXRoIHN0cmluZy4nKSAvLyDmoLnmja7otYTmupDnmoQgVVJM44CBVVVJRCDmiJYgYXNzZXQtZGIg55u45a+56Lev5b6E5p+l6K+i6LWE5rqQ5Zyo5paH5Lu257O757uf5Lit55qE5a6e6ZmF6Lev5b6E44CC6L+U5Zue57ud5a+56Lev5b6E5a2X56ym5Liy44CCXG4gICAgQHJlc3VsdChTY2hlbWFQYXRoUmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5UGF0aChAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1cmxPclV1aWQ6IFRVcmxPclVVSURPclBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFBhdGhSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VFBhdGhSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXNzZXRNYW5hZ2VyLnF1ZXJ5UGF0aCh1cmxPclV1aWQpO1xuICAgICAgICAgICAgaWYgKCFyZXQuZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5OT1RfRk9VTkQ7XG4gICAgICAgICAgICAgICAgcmV0LmRhdGEgPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldC5yZWFzb24gPSBgQXNzZXQgcGF0aCBjYW4gbm90IGJlIGZvdW5kOiAke3VybE9yVXVpZH0uIFBsZWFzZSByZWZyZXNoIGFzc2V0IGRiIGFuZCB0cnkgYWdhaW4uYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IHBhdGggZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgQXNzZXQgVVJMIC8vIOafpeivoui1hOa6kCBVUkxcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLXF1ZXJ5LXVybCcpXG4gICAgQHRpdGxlKCdRdWVyeSBBc3NldCBVUkwnKSAvLyDmn6Xor6LotYTmupAgVVJMXG4gICAgQGRlc2NyaXB0aW9uKCdRdWVyeSB0aGUgVVJMIGFkZHJlc3Mgb2YgYW4gYXNzZXQgaW4gdGhlIGRhdGFiYXNlIGJhc2VkIG9uIGl0cyBmaWxlIHBhdGggb3IgVVVJRC4gUmV0dXJucyBhIFVSTCBpbiBkYjovLyBwcm90b2NvbCBmb3JtYXQuJykgLy8g5qC55o2u6LWE5rqQ55qE5paH5Lu26Lev5b6E5oiWIFVVSUQg5p+l6K+i6LWE5rqQ5Zyo5pWw5o2u5bqT5Lit55qEIFVSTCDlnLDlnYDjgILov5Tlm54gZGI6Ly8g5Y2P6K6u5qC85byP55qEIFVSTOOAglxuICAgIEByZXN1bHQoU2NoZW1hVXJsUmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5VXJsKEBwYXJhbShTY2hlbWFVVUlET3JQYXRoKSB1dWlkT3JQYXRoOiBUVVVJRE9yUGF0aCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUVXJsUmVzdWx0Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFRVcmxSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXNzZXRNYW5hZ2VyLnF1ZXJ5VXJsKHV1aWRPclBhdGgpO1xuICAgICAgICAgICAgaWYgKCFyZXQuZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5OT1RfRk9VTkQ7XG4gICAgICAgICAgICAgICAgcmV0LmRhdGEgPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldC5yZWFzb24gPSBgQXNzZXQgVVJMIGNhbiBub3QgYmUgZm91bmQ6ICR7dXVpZE9yUGF0aH0uIFBsZWFzZSByZWZyZXNoIGFzc2V0IGRiIGFuZCB0cnkgYWdhaW4uYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IFVSTCBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBBc3NldCBEZXBlbmRlbmNpZXMgLy8g5p+l6K+i6LWE5rqQ5L6d6LWWXG4gICAgICovXG4gICAgLy8gQHRvb2woJ2Fzc2V0cy1xdWVyeS1hc3NldC1kZXBlbmRlbmNpZXMnKVxuICAgIEB0aXRsZSgnUXVlcnkgQXNzZXQgRGVwZW5kZW5jaWVzJykgLy8g5p+l6K+i6LWE5rqQ5L6d6LWWXG4gICAgQGRlc2NyaXB0aW9uKCdRdWVyeSB0aGUgbGlzdCBvZiBvdGhlciBhc3NldHMgdGhhdCB0aGUgc3BlY2lmaWVkIGFzc2V0IGRlcGVuZHMgb24uIFN1cHBvcnRzIHF1ZXJ5aW5nIG5vcm1hbCBhc3NldCBkZXBlbmRlbmNpZXMsIHNjcmlwdCBkZXBlbmRlbmNpZXMsIG9yIGFsbCBkZXBlbmRlbmNpZXMuJykgLy8g5p+l6K+i5oyH5a6a6LWE5rqQ5omA5L6d6LWW55qE5YW25LuW6LWE5rqQ5YiX6KGo44CC5pSv5oyB5p+l6K+i5pmu6YCa6LWE5rqQ5L6d6LWW44CB6ISa5pys5L6d6LWW5oiW5YWo6YOo5L6d6LWW44CCXG4gICAgQHJlc3VsdCh6LmFycmF5KHouc3RyaW5nKCkpLmRlc2NyaWJlKCdMaXN0IG9mIGRlcGVuZGVudCBhc3NldCBVVUlEcycpKSAvLyDkvp3otZbotYTmupDnmoQgVVVJRCDliJfooahcbiAgICBhc3luYyBxdWVyeUFzc2V0RGVwZW5kZW5jaWVzKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlEKSB1dWlkT3JVcmw6IFRVcmxPclVVSUQsXG4gICAgICAgIEBwYXJhbShTY2hlbWFRdWVyeUFzc2V0VHlwZSkgdHlwZTogVFF1ZXJ5QXNzZXRUeXBlID0gJ2Fzc2V0J1xuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxzdHJpbmdbXT4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxzdHJpbmdbXT4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogW10sXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXREZXBlbmRlbmNpZXModXVpZE9yVXJsLCB0eXBlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBhc3NldCBkZXBlbmRlbmNpZXMgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgQXNzZXQgVXNlcnMgLy8g5p+l6K+i6LWE5rqQ5L2/55So6ICFXG4gICAgICovXG4gICAgLy8gQHRvb2woJ2Fzc2V0cy1xdWVyeS1hc3NldC11c2VycycpXG4gICAgQHRpdGxlKCdRdWVyeSBBc3NldCBVc2VycycpIC8vIOafpeivoui1hOa6kOS9v+eUqOiAhVxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgdGhlIGxpc3Qgb2Ygb3RoZXIgYXNzZXRzIHRoYXQgdXNlIHRoZSBzcGVjaWZpZWQgYXNzZXQuIFN1cHBvcnRzIHF1ZXJ5aW5nIG5vcm1hbCBhc3NldCB1c2Vycywgc2NyaXB0IHVzZXJzLCBvciBhbGwgdXNlcnMuJykgLy8g5p+l6K+i5L2/55So5oyH5a6a6LWE5rqQ55qE5YW25LuW6LWE5rqQ5YiX6KGo44CC5pSv5oyB5p+l6K+i5pmu6YCa6LWE5rqQ5L2/55So6ICF44CB6ISa5pys5L2/55So6ICF5oiW5YWo6YOo5L2/55So6ICF44CCXG4gICAgQHJlc3VsdCh6LmFycmF5KHouc3RyaW5nKCkpLmRlc2NyaWJlKCdMaXN0IG9mIGFzc2V0IFVVSURzIHVzaW5nIHRoaXMgYXNzZXQnKSkgLy8g5L2/55So6K+l6LWE5rqQ55qE6LWE5rqQIFVVSUQg5YiX6KGoXG4gICAgYXN5bmMgcXVlcnlBc3NldFVzZXJzKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlEKSB1dWlkT3JVcmw6IFRVcmxPclVVSUQsXG4gICAgICAgIEBwYXJhbShTY2hlbWFRdWVyeUFzc2V0VHlwZSkgdHlwZTogVFF1ZXJ5QXNzZXRUeXBlID0gJ2Fzc2V0J1xuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxzdHJpbmdbXT4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxzdHJpbmdbXT4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogW10sXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRVc2Vycyh1dWlkT3JVcmwsIHR5cGUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IGFzc2V0IHVzZXJzIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IFNvcnRlZCBQbHVnaW4gU2NyaXB0cyAvLyDmn6Xor6LmjpLluo/lkI7nmoTmj5Lku7bohJrmnKxcbiAgICAgKi9cbiAgICAvLyBAdG9vbCgnYXNzZXRzLXF1ZXJ5LXNvcnRlZC1wbHVnaW5zJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IFNvcnRlZCBQbHVnaW4gU2NyaXB0cycpIC8vIOafpeivouaOkuW6j+WQjueahOaPkuS7tuiEmuacrFxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgdGhlIHNvcnRlZCBsaXN0IG9mIGFsbCBwbHVnaW4gc2NyaXB0cyBpbiB0aGUgcHJvamVjdC4gU3VwcG9ydHMgZmlsdGVyaW5nIHBsdWdpbiBzY3JpcHRzIGJ5IHBsYXRmb3JtLicpIC8vIOafpeivoumhueebruS4reaJgOacieaPkuS7tuiEmuacrOeahOaOkuW6j+WIl+ihqOOAguaUr+aMgeaMieW5s+WPsOetm+mAieaPkuS7tuiEmuacrOOAglxuICAgIEByZXN1bHQoei5hcnJheShTY2hlbWFQbHVnaW5TY3JpcHRJbmZvKS5kZXNjcmliZSgnTGlzdCBvZiBwbHVnaW4gc2NyaXB0IGluZm9ybWF0aW9uJykpIC8vIOaPkuS7tuiEmuacrOS/oeaBr+WIl+ihqFxuICAgIGFzeW5jIHF1ZXJ5U29ydGVkUGx1Z2lucyhcbiAgICAgICAgQHBhcmFtKFNjaGVtYUZpbHRlclBsdWdpbk9wdGlvbnMpIGZpbHRlck9wdGlvbnM6IFRGaWx0ZXJQbHVnaW5PcHRpb25zID0ge31cbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFBsdWdpblNjcmlwdEluZm9bXT4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUUGx1Z2luU2NyaXB0SW5mb1tdPiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhc3NldE1hbmFnZXIucXVlcnlTb3J0ZWRQbHVnaW5zKGZpbHRlck9wdGlvbnMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IHNvcnRlZCBwbHVnaW5zIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbmFtZSBBc3NldCAvLyDph43lkb3lkI3otYTmupBcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLXJlbmFtZS1hc3NldCcpXG4gICAgQHRpdGxlKCdSZW5hbWUgQXNzZXQnKSAvLyDph43lkb3lkI3otYTmupBcbiAgICBAZGVzY3JpcHRpb24oJ1JlbmFtZSB0aGUgc3BlY2lmaWVkIGFzc2V0IGluIGl0cyBjdXJyZW50IGRpcmVjdG9yeS4gVGhlIHNvdXJjZSBjYW4gYmUgYSBVUkwsIFVVSUQsIG9yIHBhdGguIFRoZSBuZXdOYW1lIHBhcmFtZXRlciBvbmx5IGNoYW5nZXMgdGhlIGFzc2V0IG5hbWUgYW5kIGRvZXMgbm90IG1vdmUgaXQgYWNyb3NzIGRpcmVjdG9yaWVzOyB1c2UgbW92ZUFzc2V0IGZvciBtb3ZpbmcuIEZvciBmaWxlIGFzc2V0cywgaW5jbHVkZSB0aGUgZXh0ZW5zaW9uIGluIG5ld05hbWUuIFN1cHBvcnRzIG92ZXJ3cml0ZSBvciBhdXRvbWF0aWMgcmVuYW1lIG9uIGNvbmZsaWN0cy4nKSAvLyDlnKjotYTmupDlvZPliY3nm67lvZXlhoXph43lkb3lkI3mjIflrprotYTmupDjgIJzb3VyY2Ug5pSv5oyBIFVSTOOAgVVVSUQg5oiW6Lev5b6E44CCbmV3TmFtZSDku4Xkv67mlLnlkI3np7DvvIzkuI3otJ/otKPot6jnm67lvZXnp7vliqjvvJvlpoLpnIDnp7vliqjor7fkvb/nlKggbW92ZUFzc2V044CC5paH5Lu26LWE5rqQ6K+35ZyoIG5ld05hbWUg5Lit5YyF5ZCr5ZCO57yA5ZCN44CC5pSv5oyB5Yay56qB5pe26KaG55uW5oiW6Ieq5Yqo6YeN5ZG95ZCN44CCXG4gICAgQHJlc3VsdChTY2hlbWFBc3NldEluZm9SZXN1bHQpXG4gICAgYXN5bmMgcmVuYW1lQXNzZXQoXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHNvdXJjZTogVFVybE9yVVVJRE9yUGF0aCxcbiAgICAgICAgQHBhcmFtKFNjaGVtYUFzc2V0TmV3TmFtZSkgbmV3TmFtZTogVEFzc2V0TmV3TmFtZSxcbiAgICAgICAgQHBhcmFtKFNjaGVtYUFzc2V0UmVuYW1lT3B0aW9ucykgb3B0aW9uczogVEFzc2V0UmVuYW1lT3B0aW9ucyA9IHt9XG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRBc3NldEluZm9SZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFzc2V0SW5mb1Jlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucmVuYW1lQXNzZXQoc291cmNlLCBuZXdOYW1lLCBvcHRpb25zKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdyZW5hbWUgYXNzZXQgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW92ZSBBc3NldCAvLyDnp7vliqjotYTmupBcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLW1vdmUtYXNzZXQnKVxuICAgIEB0aXRsZSgnTW92ZSBBc3NldCcpIC8vIOenu+WKqOi1hOa6kFxuICAgIEBkZXNjcmlwdGlvbignTW92ZSBhc3NldHMgZnJvbSB0aGUgc291cmNlIGxvY2F0aW9uIHRvIHRoZSB0YXJnZXQgbG9jYXRpb24uIFN1cHBvcnRzIG1vdmluZyBmaWxlcyBhbmQgZm9sZGVycywgd2l0aCBvcHRpb25zIHRvIG92ZXJ3cml0ZSBvciBhdXRvbWF0aWNhbGx5IHJlbmFtZS4nKSAvLyDlsIbotYTmupDku47mupDkvY3nva7np7vliqjliLDnm67moIfkvY3nva7jgILmlK/mjIHnp7vliqjmlofku7blkozmlofku7blpLnvvIzlj6/pgInmi6nmmK/lkKbopobnm5bmiJboh6rliqjph43lkb3lkI3jgIJcbiAgICBAcmVzdWx0KFNjaGVtYUFzc2V0SW5mb1Jlc3VsdClcbiAgICBhc3luYyBtb3ZlQXNzZXQoXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcmxPclVVSURPclBhdGgpIHNvdXJjZTogVERpck9yRGJQYXRoLFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB0YXJnZXQ6IFREaXJPckRiUGF0aCxcbiAgICAgICAgQHBhcmFtKFNjaGVtYUFzc2V0TW92ZU9wdGlvbnMpIG9wdGlvbnM6IFRBc3NldE1vdmVPcHRpb25zID0ge31cbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFzc2V0SW5mb1Jlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQXNzZXRJbmZvUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5tb3ZlQXNzZXQoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21vdmUgYXNzZXQgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIERlZmF1bHQgVXNlciBEYXRhIC8vIOabtOaWsOm7mOiupOeUqOaIt+aVsOaNrlxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtdXBkYXRlLWRlZmF1bHQtdXNlci1kYXRhJylcbiAgICBAdGl0bGUoJ1VwZGF0ZSBEZWZhdWx0IFVzZXIgRGF0YScpIC8vIOabtOaWsOm7mOiupOeUqOaIt+aVsOaNrlxuICAgIEBkZXNjcmlwdGlvbignVXBkYXRlIHRoZSBkZWZhdWx0IHVzZXIgZGF0YSBjb25maWd1cmF0aW9uIGZvciB0aGUgc3BlY2lmaWVkIGFzc2V0IGhhbmRsZXIuIFVzZWQgdG8gbW9kaWZ5IHRoZSBkZWZhdWx0IGltcG9ydCBzZXR0aW5ncyBmb3IgYXNzZXRzLicpIC8vIOabtOaWsOaMh+Wumui1hOa6kOWkhOeQhuWZqOeahOm7mOiupOeUqOaIt+aVsOaNrumFjee9ruOAgueUqOS6juS/ruaUuei1hOa6kOeahOm7mOiupOWvvOWFpeiuvue9ruOAglxuICAgIEByZXN1bHQoei5udWxsKCkuZGVzY3JpYmUoJ1VwZGF0ZSBvcGVyYXRpb24gcmVzdWx0IChubyByZXR1cm4gdmFsdWUpJykpIC8vIOabtOaWsOaTjeS9nOe7k+aenO+8iOaXoOi/lOWbnuWAvO+8iVxuICAgIGFzeW5jIHVwZGF0ZURlZmF1bHRVc2VyRGF0YShcbiAgICAgICAgQHBhcmFtKFNjaGVtYVVzZXJEYXRhSGFuZGxlcikgaGFuZGxlcjogVFVzZXJEYXRhSGFuZGxlcixcbiAgICAgICAgQHBhcmFtKFNjaGVtYVVwZGF0ZUFzc2V0VXNlckRhdGFQYXRoKSBwYXRoOiBUVXBkYXRlQXNzZXRVc2VyRGF0YVBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcGRhdGVBc3NldFVzZXJEYXRhVmFsdWUpIHZhbHVlOiBUVXBkYXRlQXNzZXRVc2VyRGF0YVZhbHVlXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPG51bGw+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8bnVsbD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXNzZXRNYW5hZ2VyLnVwZGF0ZURlZmF1bHRVc2VyRGF0YShoYW5kbGVyLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5GQUlMO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigndXBkYXRlIGRlZmF1bHQgdXNlciBkYXRhIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IEFzc2V0IFVzZXIgRGF0YSBDb25maWcgLy8g5p+l6K+i6LWE5rqQ55So5oi35pWw5o2u6YWN572uXG4gICAgICovXG4gICAgQHRvb2woJ2Fzc2V0cy1xdWVyeS1hc3NldC11c2VyLWRhdGEtY29uZmlnJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IEFzc2V0IFVzZXIgRGF0YSBDb25maWcnKSAvLyDmn6Xor6LotYTmupDnlKjmiLfmlbDmja7phY3nva5cbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IHRoZSB1c2VyIGRhdGEgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiBvZiB0aGUgc3BlY2lmaWVkIGFzc2V0LiBSZXR1cm5zIHRoZSBhc3NldFxcJ3MgaW1wb3J0IGNvbmZpZ3VyYXRpb24gYW5kIHVzZXItZGVmaW5lZCBkYXRhLicpIC8vIOafpeivouaMh+Wumui1hOa6kOeahOeUqOaIt+aVsOaNrumFjee9ruS/oeaBr+OAgui/lOWbnui1hOa6kOeahOWvvOWFpemFjee9ruWSjOeUqOaIt+iHquWumuS5ieaVsOaNruOAglxuICAgIEByZXN1bHQoei5hbnkoKS5udWxsYWJsZSgpLmRlc2NyaWJlKCdBc3NldCB1c2VyIGRhdGEgY29uZmlndXJhdGlvbiBvYmplY3QnKSkgLy8g6LWE5rqQ55So5oi35pWw5o2u6YWN572u5a+56LGhXG4gICAgYXN5bmMgcXVlcnlBc3NldFVzZXJEYXRhQ29uZmlnKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1cmxPclV1aWRPclBhdGg6IFRVcmxPclVVSURPclBhdGhcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8YW55Pj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPGFueT4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldCh1cmxPclV1aWRPclBhdGgpO1xuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBc3NldFVzZXJEYXRhQ29uZmlnKGFzc2V0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLk5PVF9GT1VORDtcbiAgICAgICAgICAgICAgICByZXQucmVhc29uID0gYOKdjEFzc2V0IGNhbiBub3QgYmUgZm91bmQ6ICR7dXJsT3JVdWlkT3JQYXRofWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBhc3NldCB1c2VyIGRhdGEgY29uZmlnIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBBc3NldCBVc2VyIERhdGEgLy8g5pu05paw6LWE5rqQ55So5oi35pWw5o2uXG4gICAgICovXG4gICAgQHRvb2woJ2Fzc2V0cy11cGRhdGUtYXNzZXQtdXNlci1kYXRhJylcbiAgICBAdGl0bGUoJ1VwZGF0ZSBBc3NldCBVc2VyIERhdGEnKSAvLyDmm7TmlrDotYTmupDnlKjmiLfmlbDmja5cbiAgICBAZGVzY3JpcHRpb24oJ1JlcGxhY2UgdGhlIGNvbXBsZXRlIHVzZXJEYXRhIG9iamVjdCBvZiB0aGUgc3BlY2lmaWVkIGFzc2V0IGluIG9uZSBzYXZlLiB1cmxPclV1aWRPclBhdGggYWNjZXB0cyBhbiBhc3NldCBVUkwsIFVVSUQsIGZpbGUgcGF0aCwgb3Igc3ViIGFzc2V0IFVVSUQgaW4gcGFyZW50VXVpZEBzdWJNZXRhSWQgZm9ybWF0LicpIC8vIOS4gOasoeaAp+aVtOS9k+abv+aNouaMh+Wumui1hOa6kOeahCB1c2VyRGF0Ye+8jOaUr+aMgeeItui1hOa6kOS4jiBwYXJlbnRVdWlkQHN1Yk1ldGFJZCDlrZDotYTmupAgVVVJROOAglxuICAgIEByZXN1bHQoU2NoZW1hVXBkYXRlQXNzZXRVc2VyRGF0YVJlc3VsdClcbiAgICBhc3luYyB1cGRhdGVBc3NldFVzZXJEYXRhKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1cmxPclV1aWRPclBhdGg6IFRVcmxPclVVSURPclBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcGRhdGVBc3NldFVzZXJEYXRhKSB1c2VyRGF0YTogVFVwZGF0ZUFzc2V0VXNlckRhdGFcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFVwZGF0ZUFzc2V0VXNlckRhdGFSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VFVwZGF0ZUFzc2V0VXNlckRhdGFSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnVwZGF0ZVVzZXJEYXRhKHVybE9yVXVpZE9yUGF0aCwgdXNlckRhdGEpO1xuICAgICAgICAgICAgaWYgKCFyZXQuZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5OT1RfRk9VTkQ7XG4gICAgICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGDinYxBc3NldCBjYW4gbm90IGJlIGZvdW5kOiAke3VybE9yVXVpZE9yUGF0aH0uIFBsZWFzZSByZWZyZXNoIGFzc2V0IGRiIGFuZCB0cnkgYWdhaW4uYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3VwZGF0ZSBhc3NldCB1c2VyIGRhdGEgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIEFzc2V0IFVzZXIgRGF0YSBCeSBQYXRoIC8vIOaMiei3r+W+hOabtOaWsOi1hOa6kOeUqOaIt+aVsOaNrlxuICAgICAqL1xuICAgIEB0b29sKCdhc3NldHMtdXBkYXRlLWFzc2V0LXVzZXItZGF0YS1ieS1wYXRoJylcbiAgICBAdGl0bGUoJ1VwZGF0ZSBBc3NldCBVc2VyIERhdGEgQnkgUGF0aCcpIC8vIOaMiei3r+W+hOabtOaWsOi1hOa6kOeUqOaIt+aVsOaNrlxuICAgIEBkZXNjcmlwdGlvbignVXBkYXRlIGEgc2luZ2xlIHBhdGggaW4gdGhlIHVzZXJEYXRhIG9mIHRoZSBzcGVjaWZpZWQgYXNzZXQuIHVybE9yVXVpZE9yUGF0aCBhY2NlcHRzIGFuIGFzc2V0IFVSTCwgVVVJRCwgZmlsZSBwYXRoLCBvciBzdWIgYXNzZXQgVVVJRCBpbiBwYXJlbnRVdWlkQHN1Yk1ldGFJZCBmb3JtYXQuJykgLy8g6YCa6L+H6Lev5b6E5ZKM5YC857K+56Gu5pu05paw5oyH5a6a6LWE5rqQIHVzZXJEYXRhIOeahOWNleS4quWtl+aute+8jOaUr+aMgeeItui1hOa6kOS4jiBwYXJlbnRVdWlkQHN1Yk1ldGFJZCDlrZDotYTmupAgVVVJROOAglxuICAgIEByZXN1bHQoU2NoZW1hVXBkYXRlQXNzZXRVc2VyRGF0YVJlc3VsdClcbiAgICBhc3luYyB1cGRhdGVBc3NldFVzZXJEYXRhQnlQYXRoKFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXJsT3JVVUlET3JQYXRoKSB1cmxPclV1aWRPclBhdGg6IFRVcmxPclVVSURPclBhdGgsXG4gICAgICAgIEBwYXJhbShTY2hlbWFVcGRhdGVBc3NldFVzZXJEYXRhUGF0aCkgcGF0aDogVFVwZGF0ZUFzc2V0VXNlckRhdGFQYXRoLFxuICAgICAgICBAcGFyYW0oU2NoZW1hVXBkYXRlQXNzZXRVc2VyRGF0YVZhbHVlKSB2YWx1ZTogVFVwZGF0ZUFzc2V0VXNlckRhdGFWYWx1ZVxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUVXBkYXRlQXNzZXRVc2VyRGF0YVJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUVXBkYXRlQXNzZXRVc2VyRGF0YVJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIudXBkYXRlVXNlckRhdGFCeVBhdGgodXJsT3JVdWlkT3JQYXRoLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoIXJldC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLk5PVF9GT1VORDtcbiAgICAgICAgICAgICAgICByZXQucmVhc29uID0gYOKdjEFzc2V0IGNhbiBub3QgYmUgZm91bmQ6ICR7dXJsT3JVdWlkT3JQYXRofS4gUGxlYXNlIHJlZnJlc2ggYXNzZXQgZGIgYW5kIHRyeSBhZ2Fpbi5gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcigndXBkYXRlIGFzc2V0IHVzZXIgZGF0YSBieSBwYXRoIGZhaWw6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IEFzc2V0IENvbmZpZyBNYXAgLy8g5p+l6K+i6LWE5rqQ6YWN572u5pig5bCE6KGoXG4gICAgICovXG4gICAgLy8gQHRvb2woJ2Fzc2V0cy1xdWVyeS1hc3NldC1jb25maWctbWFwJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IEFzc2V0IENvbmZpZyBNYXAnKSAvLyDmn6Xor6LotYTmupDphY3nva7mmKDlsITooahcbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IHRoZSBiYXNpYyBjb25maWd1cmF0aW9uIG1hcHBpbmcgdGFibGUgZm9yIGVhY2ggYXNzZXQgaGFuZGxlci4gUmV0dXJucyBhIG1hcHBpbmcgdGFibGUgY29udGFpbmluZyBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uIHN1Y2ggYXMgYXNzZXQgZGlzcGxheSBuYW1lLCBkZXNjcmlwdGlvbiwgZG9jdW1lbnRhdGlvbiBVUkwsIHVzZXIgZGF0YSBjb25maWd1cmF0aW9uLCBpY29uIGluZm9ybWF0aW9uLCBldGMuJykgLy8g5p+l6K+i5ZCE5Liq6LWE5rqQ5aSE55CG5Zmo55qE5Z+65pys6YWN572u5pig5bCE6KGo44CC6L+U5Zue5YyF5ZCr6LWE5rqQ5pi+56S65ZCN56ew44CB5o+P6L+w44CB5paH5qGjVVJM44CB55So5oi35pWw5o2u6YWN572u44CB5Zu+5qCH5L+h5oGv562J6YWN572u5L+h5oGv55qE5pig5bCE6KGo44CCXG4gICAgQHJlc3VsdChTY2hlbWFBc3NldENvbmZpZ01hcFJlc3VsdClcbiAgICBhc3luYyBxdWVyeUFzc2V0Q29uZmlnTWFwKCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQXNzZXRDb25maWdNYXBSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFzc2V0Q29uZmlnTWFwUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBc3NldENvbmZpZ01hcCgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IGFzc2V0IGNvbmZpZyBtYXAgZmFpbDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgQXNzZXQgUHJvcGVydHkgU2NoZW1hIC8vIOafpeivoui1hOa6kOWvvOWFpeWxnuaApyBzY2hlbWFcbiAgICAgKi9cbiAgICBAdG9vbCgnYXNzZXRzLXF1ZXJ5LXByb3BlcnR5LXNjaGVtYScpXG4gICAgQHRpdGxlKCdRdWVyeSBBc3NldCBJbXBvcnQgUHJvcGVydHkgU2NoZW1hJykgLy8g5p+l6K+i6LWE5rqQ5a+85YWl5bGe5oCnIHNjaGVtYVxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgdGhlIGltcG9ydCBwcm9wZXJ0eSBzY2hlbWEgbWFwIGZvciBhIHNwZWNpZmljIGFzc2V0IGltcG9ydGVyLiBUaGUgcmVzdWx0IHZhbHVlIGZvbGxvd3MgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hLCB1c2luZyBmaWVsZHMgc3VjaCBhcyB0aXRsZSwgdHlwZSwgZGVmYXVsdCwgZW51bSwgZW51bURlc2NyaXB0aW9ucywgbWluaW11bSwgbWF4aW11bSwgc3RlcCwgcHJvcGVydGllcywgYW5kIGl0ZW1zLicpIC8vIOafpeivouaMh+Wumui1hOa6kOWvvOWFpeWZqOeahOagh+WHhuWMluWvvOWFpeWxnuaApyBzY2hlbWHvvIznlKjkuo7pnaLmnb/oh6rliqjmuLLmn5Plr7zlhaXorr7nva7jgIJcbiAgICBAcmVzdWx0KFNjaGVtYUFzc2V0UHJvcGVydHlTY2hlbWFSZXN1bHQpXG4gICAgYXN5bmMgcXVlcnlQcm9wZXJ0eVNjaGVtYShcbiAgICAgICAgQHBhcmFtKFNjaGVtYVVzZXJEYXRhSGFuZGxlcikgaW1wb3J0ZXI6IFRVc2VyRGF0YUhhbmRsZXJcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEFzc2V0UHJvcGVydHlTY2hlbWFSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEFzc2V0UHJvcGVydHlTY2hlbWFSZXN1bHQ+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IHt9LFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXQuZGF0YSA9IGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeVByb3BlcnR5U2NoZW1hKGltcG9ydGVyKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3F1ZXJ5IGFzc2V0IHByb3BlcnR5IHNjaGVtYSBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG4iXX0=