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
exports.ASSET_TREE_INFO_DATA_KEYS = exports.DEFAULT_ASSET_INFO_DATA_KEYS = void 0;
exports.searchAssets = searchAssets;
const asset_db_1 = require("@cocos/asset-db");
const path_1 = require("path");
const utils_1 = require("../utils");
const asset_db_2 = __importDefault(require("./asset-db"));
const asset_handler_1 = __importDefault(require("./asset-handler"));
const scripting_1 = __importDefault(require("../../scripting"));
const i18n_1 = __importDefault(require("../../base/i18n"));
const asset_config_1 = __importDefault(require("../asset-config"));
const minimatch_1 = __importDefault(require("minimatch"));
const utils_2 = __importDefault(require("../../base/utils"));
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
exports.DEFAULT_ASSET_INFO_DATA_KEYS = [
    'subAssets',
    'displayName',
];
exports.ASSET_TREE_INFO_DATA_KEYS = [
    ...exports.DEFAULT_ASSET_INFO_DATA_KEYS,
    'extends',
];
class AssetQueryManager {
    /**
     * 1. 资源/脚本 uuid, asset -> uuid 依赖的普通资源列表
     * 2. 资源 uuid, script -> uuid 依赖的脚本列表
     * 3. 脚本 uuid, script -> uuid 脚本依赖的脚本列表
     * @param uuidOrURL
     * @param type
     * @returns
     */
    async queryAssetDependencies(uuidOrURL, type = 'asset') {
        const asset = this.queryAsset(uuidOrURL);
        if (!asset) {
            return [];
        }
        let uuids = [];
        if (['asset', 'all'].includes(type)) {
            uuids = this.queryAssetProperty(asset, 'depends');
        }
        if (['script', 'all'].includes(type)) {
            const ccType = this.queryAssetProperty(asset, 'type');
            if (ccType === 'cc.Script') {
                // 返回依赖脚本的 db URL
                // const pathList: string[] = await Editor.Message.request('programming', 'packer-driver/query-script-deps', asset.source);
                // uuids.push(...pathList.map(path => queryUUID(path)));
            }
            else {
                uuids.push(...this.queryAssetProperty(asset, 'dependScripts'));
            }
        }
        return uuids;
    }
    /**
     * 1. 资源/脚本 uuid, asset -> 使用 uuid 的普通资源列表
     * 2. 资源 uuid, script -> 使用 uuid 的脚本列表
     * 3. 脚本 uuid，script -> 使用此 uuid 脚本的脚本列表
     * @param uuidOrURL
     * @param type
     * @returns
     */
    async queryAssetUsers(uuidOrURL, type = 'asset') {
        const asset = this.queryAsset(uuidOrURL);
        if (!asset) {
            return [];
        }
        const ccType = this.queryAssetProperty(asset, 'type');
        let usages = [];
        if (['asset', 'all'].includes(type)) {
            if (ccType === 'cc.Script') {
                usages = this.queryAssetProperty(asset, 'dependedScripts');
            }
            else {
                usages = this.queryAssetProperty(asset, 'dependeds');
            }
        }
        if (['script', 'all'].includes(type)) {
            if (ccType === 'cc.Script') {
                const pathList = await scripting_1.default.queryScriptUsers(asset.source);
                pathList.forEach(path => usages.push((0, asset_db_1.queryUUID)(path)));
            }
            else {
                // 查询依赖此资源的脚本，目前依赖信息都记录在场景上，所以实际上并没有脚本会依赖资源，代码写死是无法查询的
            }
        }
        return usages;
    }
    /**
     * 传入一个 uuid 或者 url 或者绝对路径，查询指向的资源
     * @param uuidOrURLOrPath
     */
    queryAsset(uuidOrURLOrPath) {
        const uuid = utils_2.default.UUID.isUUID(uuidOrURLOrPath) ? uuidOrURLOrPath : this.queryUUID(uuidOrURLOrPath);
        for (const name in asset_db_2.default.assetDBMap) {
            const database = asset_db_2.default.assetDBMap[name];
            if (!database) {
                continue;
            }
            // 查找的是数据库, 由于数据库的单条数据不在 database 里，所以需要这里单独返回
            if (uuid === `db://${name}`) {
                return {
                    displayName: '',
                    basename: name,
                    extname: '',
                    imported: true,
                    source: `db://${name}`,
                    subAssets: {},
                    library: '',
                    parent: null,
                    userData: {},
                    isDirectory() {
                        return false;
                    },
                    uuid: `db://${name}`,
                    meta: {
                        ver: '1.0.0',
                        uuid: `db://${name}`,
                        name: name,
                        id: name,
                        subMetas: {},
                        userData: {},
                        importer: 'database',
                        imported: true,
                        files: [],
                        displayName: '',
                    },
                };
            }
            const asset = database.getAsset(uuid || '');
            if (asset) {
                return asset;
            }
        }
        return null;
    }
    queryAssetInfo(urlOrUUIDOrPath, dataKeys) {
        if (!urlOrUUIDOrPath || typeof urlOrUUIDOrPath !== 'string') {
            throw new Error('parameter error');
        }
        urlOrUUIDOrPath = (0, utils_1.pathToDbUrlIfAssetDBPath)(urlOrUUIDOrPath, asset_db_2.default.assetDBInfo);
        let uuid = '';
        if (urlOrUUIDOrPath.startsWith('db://')) {
            const name = urlOrUUIDOrPath.substr(5);
            if (asset_db_2.default.assetDBMap[name]) {
                return this.queryDBAssetInfo(name);
            }
            uuid = (0, utils_1.url2uuid)(urlOrUUIDOrPath);
        }
        else if ((0, path_1.isAbsolute)(urlOrUUIDOrPath)) {
            for (const name in asset_db_2.default.assetDBMap) {
                const database = asset_db_2.default.assetDBMap[name];
                if (!database) {
                    continue;
                }
                if (database.path2asset.has(urlOrUUIDOrPath)) {
                    uuid = database.path2asset.get(urlOrUUIDOrPath).uuid;
                    break;
                }
            }
        }
        else {
            uuid = urlOrUUIDOrPath;
        }
        if (!uuid) {
            return null;
        }
        return this.queryAssetInfoByUUID(uuid, dataKeys);
    }
    /**
     * 查询指定资源的信息
     * @param uuid 资源的唯一标识符
     * @param dataKeys 资源输出可选项
     */
    queryAssetInfoByUUID(uuid, dataKeys) {
        if (!uuid) {
            return null;
        }
        // 查询资源
        const asset = (0, asset_db_1.queryAsset)(uuid);
        if (!asset) {
            return null;
        }
        return this.encodeAsset(asset, dataKeys);
    }
    /**
     * 根据提供的 options 查询对应的资源数组(不包含数据库对象)
     * @param options 搜索配置
     * @param dataKeys 指定需要的资源信息字段
     */
    queryAssetInfos(options, dataKeys) {
        let allAssets = [];
        const dbInfos = [];
        // 循环每一个已经启动的 database
        for (const name in asset_db_2.default.assetDBMap) {
            const database = asset_db_2.default.assetDBMap[name];
            allAssets = allAssets.concat(Array.from(database.uuid2asset.values()));
            dbInfos.push(this.queryDBAssetInfo(name));
        }
        let filterAssets = allAssets;
        if (options) {
            if (options.isBundle) {
                // 兼容旧版本使用 isBundle 查询会默认带上 meta 的行为
                dataKeys = (dataKeys || []).concat(['meta']);
            }
            // 根据选项筛选过滤的函数信息
            const filterInfos = FilterHandlerInfos.filter(info => {
                info.value = options[info.name];
                if (info.resolve) {
                    info.value = info.resolve(info.value);
                }
                if (info.value === undefined) {
                    return false;
                }
                return true;
            });
            filterAssets = searchAssets(filterInfos, allAssets);
        }
        const result = filterAssets.map((asset) => this.encodeAsset(asset, dataKeys));
        if (!options || (allAssets.length && allAssets.length === result.length)) {
            // 无效过滤条件或者查询全部资源时需要包含默认 db 的资源，主要为了兼容旧版本的接口行为，正常资源查询应该不包含数据库对象
            return result.concat(dbInfos);
        }
        else if (options.pattern && Object.keys(options).length === 1) {
            // 存在 pattern 参数时，需要包含数据库对象，主要是兼容旧版本行为
            return dbInfos.filter((db) => {
                return (0, minimatch_1.default)(db.url, options.pattern);
            }).concat(result);
        }
        else {
            return result;
        }
    }
    queryAssets(options = {}) {
        if (typeof options !== 'object' || Array.isArray(options)) {
            options = {};
        }
        let assets = [];
        // 循环每一个已经启动的 database
        for (const name in asset_db_2.default.assetDBMap) {
            if (!(name in asset_db_2.default.assetDBMap)) {
                continue;
            }
            const database = asset_db_2.default.assetDBMap[name];
            assets = assets.concat(Array.from(database.uuid2asset.values()));
        }
        if (options) {
            // 根据选项筛选过滤的函数信息
            const filterInfos = FilterHandlerInfos.filter(info => {
                info.value = options[info.name];
                if (info.resolve) {
                    info.value = info.resolve(info.value);
                }
                if (info.value === undefined) {
                    return false;
                }
                return true;
            });
            assets = searchAssets(filterInfos, assets);
        }
        return assets;
    }
    /**
     * 查询符合某个筛选规则的排序后的插件脚本列表
     * @param filterOptions
     * @returns
     */
    querySortedPlugins(filterOptions = {}) {
        const plugins = this.queryAssetInfos({
            ccType: 'cc.Script',
            userData: {
                ...filterOptions,
                isPlugin: true,
            },
        }, ['name']);
        if (!plugins.length) {
            return [];
        }
        // 1. 先按照默认插件脚本的排序规则，取插件脚本名称排序
        plugins.sort((a, b) => a.name.localeCompare(b.name));
        // 2. 根据项目设置内配置好的脚本优先级顺序，调整原有的脚本排序
        const sorted = asset_config_1.default.data.sortingPlugin;
        if (Array.isArray(sorted) && sorted.length) {
            // 过滤掉用户配置排序中不符合当前环境或者说不存在的插件脚本
            const filterSorted = sorted.filter((uuid) => plugins.find(info => info.uuid === uuid));
            // 倒序处理主要是为了兼容 383 之前的处理规则，保持一致的结果行为。顺序排结果有差异。
            filterSorted.reverse().reduce((preIndex, current) => {
                const currentIndex = plugins.findIndex((info) => info.uuid === current);
                if (currentIndex > preIndex) {
                    const scripts = plugins.splice(currentIndex, 1);
                    plugins.splice(preIndex, 0, scripts[0]);
                    return preIndex;
                }
                return currentIndex;
            }, plugins.length);
        }
        return plugins.map((asset) => {
            return {
                uuid: asset.uuid,
                file: asset.library['.js'],
                url: asset.url,
            };
        });
    }
    /**
     * 将一个 Asset 转成 info 对象
     * @param database
     * @param asset
     * @param invalid 是否是无效的资源，例如已被删除的资源
     */
    encodeAsset(asset, dataKeys = exports.DEFAULT_ASSET_INFO_DATA_KEYS, invalid = false) {
        let name = '';
        let source = '';
        let file = '';
        const database = asset._assetDB;
        if (asset.uuid === asset.source || (asset instanceof asset_db_1.Asset && asset.source)) {
            name = (0, path_1.basename)(asset.source);
            source = asset_db_2.default.path2url(asset.source, database.options.name);
            file = asset.source;
        }
        else {
            name = asset._name;
        }
        let loadUrl = name;
        let url = name;
        // 注：asset.uuid === asset.source 是 mac 上的 db://assets
        if (asset.uuid === asset.source || asset instanceof asset_db_1.Asset) {
            url = loadUrl = source;
        }
        else {
            let parent = asset.parent;
            while (parent && !(parent instanceof asset_db_1.Asset)) {
                loadUrl = `${parent._name}/${name}`;
                parent = parent.parent;
            }
            // @ts-ignore
            if (parent instanceof asset_db_1.Asset) {
                const ext = (0, path_1.extname)(parent._source);
                const tempSource = asset_db_2.default.path2url(parent._source, database.options.name);
                url = tempSource + '/' + loadUrl;
                loadUrl = tempSource.substr(0, tempSource.length - ext.length) + '/' + loadUrl;
            }
        }
        let isDirectory = false;
        try {
            isDirectory = asset.isDirectory();
        }
        catch (error) {
            if (invalid) {
                // 被删除的资源此处抛异常不报错
                console.debug(error);
            }
            else {
                console.error(error);
            }
            isDirectory = (0, path_1.extname)(asset.source) === '';
        }
        if (!isDirectory) {
            loadUrl = loadUrl.replace(/\.[^./]+$/, '');
        }
        const info = {
            name,
            displayName: asset.displayName,
            source,
            loadUrl, // loader 加载使用的路径
            url, // 实际的带有扩展名的路径
            file, // 实际磁盘路径
            uuid: asset.uuid,
            importer: asset.meta.importer,
            imported: asset.meta.imported, // 是否结束导入过程
            invalid: asset.invalid, // 是否导入成功
            type: this.queryAssetProperty(asset, 'type'),
            isDirectory,
            readonly: database.options.readonly,
            library: (0, utils_1.libArr2Obj)(asset),
        };
        dataKeys.forEach((key) => {
            // @ts-ignore 2322
            info[key] = this.queryAssetProperty(asset, key) ?? info[key];
        });
        // 没有显示指定获取 isBundle 字段时，默认只有 bundle 文件夹才会加上标记
        if (!dataKeys.includes('isBundle')) {
            const value = this.queryAssetProperty(asset, 'isBundle');
            if (value) {
                info.isBundle = true;
            }
        }
        if (dataKeys.includes('parent') && asset.parent) {
            info.parent = {
                source: asset.parent.source,
                library: (0, utils_1.libArr2Obj)(asset.parent),
                uuid: asset.parent.uuid,
            };
        }
        if (dataKeys.includes('subAssets')) {
            info.subAssets = {};
            for (const name in asset.subAssets) {
                if (!(name in asset.subAssets)) {
                    continue;
                }
                const childInfo = this.encodeAsset(asset.subAssets[name], dataKeys);
                info.subAssets[name] = childInfo;
            }
        }
        return info;
    }
    queryAssetProperty(asset, property) {
        switch (property) {
            case 'loadUrl':
                {
                    const name = this.queryAssetProperty(asset, 'name');
                    let loadUrl = name;
                    // 注：asset.uuid === asset.source 是 mac 上的 db://assets
                    if (asset instanceof asset_db_1.Asset) {
                        loadUrl = asset_db_2.default.path2url(asset.source, asset._assetDB.options.name);
                    }
                    else {
                        let parent = asset.parent;
                        while (parent && !(parent instanceof asset_db_1.Asset)) {
                            loadUrl = `${parent._name}/${name}`;
                            parent = parent.parent;
                        }
                        // @ts-ignore
                        if (parent instanceof asset_db_1.Asset) {
                            const ext = (0, path_1.extname)(parent._source);
                            const tempSource = asset_db_2.default.path2url(parent._source, asset._assetDB.options.name);
                            loadUrl = tempSource.substr(0, tempSource.length - ext.length) + '/' + loadUrl;
                        }
                    }
                    const isDirectory = asset.isDirectory();
                    if (!isDirectory) {
                        loadUrl = loadUrl.replace(/\.[^./]+$/, '');
                    }
                    return loadUrl;
                }
            case 'name':
                if (asset.uuid === asset.source || (asset instanceof asset_db_1.Asset && asset.source)) {
                    return (0, path_1.basename)(asset.source);
                }
                else {
                    return asset._name;
                }
            case 'readonly':
                return asset._assetDB.options.readonly;
            case 'url':
                {
                    const name = this.queryAssetProperty(asset, 'name');
                    if (asset.uuid === asset.source || asset instanceof asset_db_1.Asset) {
                        return asset_db_2.default.path2url(asset.source, asset._assetDB.options.name);
                    }
                    else {
                        let path = name;
                        let parent = asset.parent;
                        while (parent && !(parent instanceof asset_db_1.Asset)) {
                            path = `${parent._name}/${name}`;
                            parent = parent.parent;
                        }
                        // @ts-ignore
                        if (parent instanceof asset_db_1.Asset) {
                            const tempSource = asset_db_2.default.path2url(parent._source, asset._assetDB.options.name);
                            return tempSource + '/' + path;
                        }
                        else {
                            return path;
                        }
                    }
                }
            case 'type':
                {
                    const handler = asset_handler_1.default.name2handler[asset.meta.importer] || asset._assetDB.importerManager.name2importer[asset.meta.importer] || null;
                    return handler ? handler.assetType || 'cc.Asset' : 'cc.Asset';
                }
            case 'isBundle':
                return asset.meta.userData && asset.meta.userData.isBundle;
            case 'instantiation':
                {
                    const handler = asset_handler_1.default.name2handler[asset.meta.importer] || asset._assetDB.importerManager.name2importer[asset.meta.importer] || null;
                    return handler ? handler.instantiation : undefined;
                }
            case 'library':
                return (0, utils_1.libArr2Obj)(asset);
            case 'displayName':
                return asset.displayName;
            case 'redirect':
                // 整理跳转数据
                if (asset.meta.userData && asset.meta.userData.redirect) {
                    const redirectInfo = this.queryAsset(asset.meta.userData.redirect);
                    if (redirectInfo) {
                        const redirectHandler = asset_handler_1.default.name2handler[redirectInfo.meta.importer] || null;
                        return {
                            uuid: redirectInfo.uuid,
                            type: redirectHandler ? redirectHandler.assetType || 'cc.Asset' : 'cc.Asset',
                        };
                    }
                }
                return;
            case 'extends':
                {
                    // 此处兼容了旧的资源导入器
                    const CCType = this.queryAssetProperty(asset, 'type');
                    return (0, utils_1.getExtendsFromCCType)(CCType);
                }
            case 'visible':
                {
                    // @ts-ignore TODO 底层 options 并无此字段
                    let visible = asset._assetDB.options.visible;
                    if (visible && asset.userData.visible === false) {
                        visible = false;
                    }
                    return visible === false ? false : true;
                }
            case 'mtime':
                {
                    const info = asset._assetDB.infoManager.get(asset.source);
                    return info ? info.time : null;
                }
            case 'meta':
                return asset.meta;
            case 'depends':
                {
                    return Array.from(asset.getData('depends') || []);
                }
            case 'dependeds':
                {
                    const usedList = [];
                    function collectUuid(depends, uuid) {
                        if (depends.includes(asset.uuid)) {
                            usedList.push(uuid);
                        }
                    }
                    (0, asset_db_1.forEach)((db) => {
                        const map = db.dataManager.dataMap;
                        for (const id in map) {
                            const item = map[id];
                            if (item.value && item.value.depends && item.value.depends.length) {
                                collectUuid(item.value.depends, id);
                            }
                        }
                    });
                    return usedList;
                }
            case 'dependScripts':
                {
                    const data = asset._assetDB.dataManager.dataMap[asset.uuid];
                    return Array.from(data && data.value && data.value['dependScripts'] || []);
                }
            case 'dependedScripts':
                {
                    const usedList = [];
                    (0, asset_db_1.forEach)((db) => {
                        const map = db.dataManager.dataMap;
                        for (const id in map) {
                            const item = map[id];
                            if (item.value && item.value.dependScripts && item.value.dependScripts.includes(asset.uuid)) {
                                usedList.push(id);
                            }
                        }
                    });
                    return usedList;
                }
            case 'temp':
                return asset.temp;
        }
    }
    /**
     * 查询指定的资源的 meta
     * @param uuidOrURLOrPath 资源的唯一标识符
     */
    queryAssetMeta(uuidOrURLOrPath) {
        if (!uuidOrURLOrPath || typeof uuidOrURLOrPath !== 'string') {
            return null;
        }
        let uuid = uuidOrURLOrPath;
        if (uuidOrURLOrPath.startsWith('db://')) {
            const name = uuidOrURLOrPath.substr(5);
            if (asset_db_2.default.assetDBMap[name]) {
                // @ts-ignore DB 数据库并不存在 meta 理论上并不需要返回，但旧版本已支持
                return {
                    // displayName: name,
                    files: [],
                    // id: '',
                    imported: true,
                    importer: 'database',
                    // name: '',
                    subMetas: {},
                    userData: {},
                    uuid: uuidOrURLOrPath,
                    ver: '1.0.0',
                };
            }
            const path = (0, utils_1.url2path)(uuidOrURLOrPath);
            const metaInfo = asset_db_2.default.assetDBMap['assets'].metaManager.path2meta[path];
            if (metaInfo) {
                return metaInfo.json;
            }
            uuid = (0, utils_1.url2uuid)(uuidOrURLOrPath);
        }
        const asset = (0, asset_db_1.queryAsset)(uuid);
        if (!asset) {
            return null;
        }
        return asset.meta;
    }
    /**
     * 查询子资源名称
     * 当源文件已删除但 .meta 仍存在时，通过读取 meta 的 subMetas 获取子资源名称
     * @param mainUuid 主资源 UUID
     * @param subId 子资源 ID（@ 后面的部分）
     */
    querySubAssetName(mainUuid, subId) {
        const meta = this.queryAssetMeta(mainUuid);
        if (meta?.subMetas?.[subId]?.name) {
            return meta.subMetas[subId].name;
        }
        // 源文件已删除但 .meta 仍存在时，通过 infoManager 查找已删除资源的路径，直接读取 .meta 文件
        for (const name in asset_db_2.default.assetDBMap) {
            const database = asset_db_2.default.assetDBMap[name];
            if (!database)
                continue;
            // metaManager 可能仍缓存了 .meta 数据
            const path2meta = database.metaManager?.path2meta;
            if (path2meta) {
                for (const key in path2meta) {
                    const metaInfo = path2meta[key];
                    if (metaInfo?.json?.uuid === mainUuid && metaInfo.json.subMetas?.[subId]) {
                        return metaInfo.json.subMetas[subId].name ?? null;
                    }
                }
            }
            // infoManager 记录了已删除资源的路径，尝试从磁盘读取 .meta 文件
            try {
                const missingInfo = database.infoManager?.getMissingInfo(mainUuid);
                if (missingInfo?.path) {
                    const metaPath = missingInfo.path + '.meta';
                    if ((0, fs_extra_1.existsSync)(metaPath)) {
                        const metaJson = (0, fs_extra_1.readJSONSync)(metaPath);
                        if (metaJson?.subMetas?.[subId]?.name) {
                            return metaJson.subMetas[subId].name;
                        }
                    }
                }
            }
            catch {
                // infoManager or file read may fail
            }
            // 遍历资源目录，查找包含该 UUID 的 .meta 文件
            try {
                const target = asset_db_2.default.assetDBInfo[name]?.target;
                if (target && (0, fs_extra_1.existsSync)(target)) {
                    const result = this._findSubAssetNameFromMeta(target, mainUuid, subId);
                    if (result)
                        return result;
                }
            }
            catch {
                // filesystem scan may fail
            }
        }
        return null;
    }
    _findSubAssetNameFromMeta(dir, uuid, subId) {
        try {
            const entries = (0, fs_extra_1.readdirSync)(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const result = this._findSubAssetNameFromMeta(fullPath, uuid, subId);
                    if (result)
                        return result;
                }
                else if (entry.name.endsWith('.meta')) {
                    try {
                        const metaJson = (0, fs_extra_1.readJSONSync)(fullPath);
                        if (metaJson?.uuid === uuid && metaJson?.subMetas?.[subId]?.name) {
                            return metaJson.subMetas[subId].name;
                        }
                    }
                    catch {
                        // skip unreadable meta files
                    }
                }
            }
        }
        catch {
            // directory read may fail
        }
        return null;
    }
    /**
     * 查询指定的资源以及对应 meta 的 mtime
     * @param uuid 资源的唯一标识符
     */
    queryAssetMtime(uuid) {
        if (!uuid || typeof uuid !== 'string') {
            return null;
        }
        for (const name in asset_db_2.default.assetDBMap) {
            if (!(name in asset_db_2.default.assetDBMap)) {
                continue;
            }
            const database = asset_db_2.default.assetDBMap[name];
            if (!database) {
                continue;
            }
            const asset = database.getAsset(uuid);
            if (asset) {
                const info = database.infoManager.get(asset.source);
                return info ? info.time : null;
            }
        }
        return null;
    }
    queryUUID(urlOrPath) {
        if (!urlOrPath || typeof urlOrPath !== 'string') {
            return null;
        }
        urlOrPath = (0, utils_1.pathToDbUrlIfAssetDBPath)(urlOrPath, asset_db_2.default.assetDBInfo);
        if (urlOrPath.startsWith('db://')) {
            const name = urlOrPath.substr(5);
            if (asset_db_2.default.assetDBMap[name]) {
                return `db://${name}`;
            }
            const uuid = (0, utils_1.url2uuid)(urlOrPath);
            if (uuid) {
                return uuid;
            }
        }
        try {
            return (0, asset_db_1.queryUUID)(urlOrPath);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * db 根节点不是有效的 asset 类型资源
     * 这里伪造一份它的数据信息
     * @param name db name
     */
    queryDBAssetInfo(name) {
        const dbInfo = asset_db_2.default.assetDBInfo[name];
        if (!dbInfo) {
            return null;
        }
        const info = {
            name,
            displayName: name || '',
            source: `db://${name}`,
            loadUrl: `db://${name}`,
            url: `db://${name}`,
            file: dbInfo.target, // 实际磁盘路径
            uuid: `db://${name}`,
            importer: 'database',
            imported: true,
            invalid: false,
            type: 'cce.Database',
            isDirectory: false,
            library: {},
            subAssets: {},
            readonly: dbInfo.readonly,
        };
        return info;
    }
    queryUrl(uuidOrPath) {
        if (!uuidOrPath || typeof uuidOrPath !== 'string') {
            throw new Error('parameter error');
        }
        const normalizedUrl = (0, utils_1.pathToDbUrlIfAssetDBPath)(uuidOrPath, asset_db_2.default.assetDBInfo);
        if (!uuidOrPath.startsWith('db://') && normalizedUrl.startsWith('db://')) {
            const dbName = normalizedUrl.slice('db://'.length).split('/', 1)[0];
            if (asset_db_2.default.assetDBMap[dbName]) {
                return normalizedUrl;
            }
        }
        // 根路径 /assets, /internal 对应的 url 模拟数据
        const name = uuidOrPath.substr(asset_config_1.default.data.root.length + 1);
        if (asset_db_2.default.assetDBMap[name]) {
            return `db://${name}`;
        }
        const result = (0, asset_db_1.queryUrl)(uuidOrPath);
        if (result) {
            return result;
        }
        uuidOrPath = uuidOrPath.replaceAll('/', path.sep);
        return (0, asset_db_1.queryUrl)(uuidOrPath);
    }
    queryPath(urlOrUuid) {
        if (!urlOrUuid || typeof urlOrUuid !== 'string') {
            return '';
        }
        urlOrUuid = (0, utils_1.pathToDbUrlIfAssetDBPath)(urlOrUuid, asset_db_2.default.assetDBInfo);
        if (urlOrUuid.startsWith('db://')) {
            const name = urlOrUuid.substr(5);
            if (asset_db_2.default.assetDBMap[name]) {
                return asset_db_2.default.assetDBMap[name].options.target;
            }
            const uuid = (0, utils_1.url2uuid)(urlOrUuid);
            if (uuid) {
                return (0, asset_db_1.queryPath)(uuid);
            }
        }
        return (0, asset_db_1.queryPath)(urlOrUuid);
    }
    generateAvailableURL(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }
        const path = (0, asset_db_1.queryPath)(url);
        if (!path) {
            return '';
        }
        else if (!(0, fs_extra_1.existsSync)(path)) {
            return url;
        }
        const newPath = utils_2.default.File.getName(path);
        return (0, asset_db_1.queryUrl)(newPath);
    }
}
const assetQuery = new AssetQueryManager();
// 允许使用全局变量去查询 db 的一些数据信息
if (!globalThis.assetQuery) {
    globalThis.assetQuery = assetQuery;
}
exports.default = assetQuery;
// 根据资源类型筛选
const TYPES = {
    scripts: ['.js', '.ts'],
    scene: ['.scene'],
    effect: ['.effect'],
    image: ['.jpg', '.png', '.jpeg', '.webp', '.tga'],
};
function searchAssets(filterHandlerInfos, assets, resultAssets = []) {
    if (!filterHandlerInfos.length) {
        return assets;
    }
    assets.forEach((asset) => {
        if (asset.subAssets && Object.keys(asset.subAssets).length > 0) {
            searchAssets(filterHandlerInfos, Object.values(asset.subAssets), resultAssets);
        }
        const unMatch = filterHandlerInfos.some((filterHandlerInfo) => {
            if (filterHandlerInfo.value === undefined) {
                return false;
            }
            return !filterHandlerInfo.handler(filterHandlerInfo.value, asset);
        });
        if (!unMatch) {
            resultAssets.push(asset);
        }
    });
    return resultAssets;
}
function filterUserDataInfo(userDataFilters, asset) {
    return !Object.keys(userDataFilters).some((key) => userDataFilters[key] !== asset.meta.userData[key]);
}
const FilterHandlerInfos = [{
        name: 'ccType',
        handler: (ccTypes, asset) => {
            return ccTypes.includes(assetQuery.queryAssetProperty(asset, 'type'));
        },
        resolve: (value) => {
            if (typeof value === 'string') {
                if (typeof value === 'string') {
                    return [value.trim()];
                }
                else if (Array.isArray(value)) {
                    return value;
                }
                else {
                    return undefined;
                }
            }
            return value;
        },
    }, {
        name: 'pattern',
        handler: (value, asset) => {
            const loadUrl = assetQuery.queryAssetProperty(asset, 'loadUrl');
            const url = assetQuery.queryAssetProperty(asset, 'url');
            return (0, minimatch_1.default)(loadUrl, value) || (0, minimatch_1.default)(url, value);
        },
        resolve: (value) => {
            return typeof value === 'string' ? value : undefined;
        },
    }, {
        name: 'importer',
        handler: (importers, asset) => {
            return importers.includes(asset.meta.importer);
        },
        resolve: (value) => {
            if (typeof value === 'string') {
                if (typeof value === 'string') {
                    return [value.trim()];
                }
                else if (Array.isArray(value)) {
                    return value;
                }
                else {
                    return;
                }
            }
        },
    }, {
        name: 'isBundle',
        handler: (value, asset) => {
            return (!!assetQuery.queryAssetProperty(asset, 'isBundle')) === value;
        },
    }, {
        name: 'extname',
        handler: (extensionNames, asset) => {
            const extension = (0, path_1.extname)(asset.source).toLowerCase();
            if (extensionNames.includes(extension) && !/\.d\.ts$/.test(asset.source)) {
                return true;
            }
            return false;
        },
        resolve(value) {
            if (typeof value === 'string') {
                return [value.trim().toLocaleLowerCase()];
            }
            else if (Array.isArray(value)) {
                return value.map(name => name.trim().toLocaleLowerCase());
            }
            else {
                return;
            }
        },
    }, {
        name: 'userData',
        handler: (value, asset) => {
            return filterUserDataInfo(value, asset);
        },
    }, {
        name: 'type',
        handler: (types, asset) => {
            return types.includes((0, path_1.extname)(asset.source)) && !/\.d\.ts$/.test(asset.source);
        },
        resolve: (value) => {
            const types = TYPES[value];
            if (!types) {
                return;
            }
            console.warn(i18n_1.default.t('assets.deprecated_tip', {
                oldName: 'options.type',
                newName: 'options.ccType',
                version: '3.8.0',
            }));
            return types;
        },
    }];
