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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvbWFuYWdlci9xdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwMkJBLG9DQXdCQztBQWw0QkQsOENBQW9IO0FBQ3BILCtCQUFxRDtBQUlyRCxvQ0FBMEc7QUFDMUcsMERBQXdDO0FBQ3hDLG9FQUFrRDtBQUNsRCxnRUFBcUM7QUFDckMsMkRBQW1DO0FBQ25DLG1FQUEwQztBQUMxQywwREFBa0M7QUFDbEMsNkRBQXFDO0FBQ3JDLHVDQUFpRTtBQUNqRSwyQ0FBNkI7QUFFaEIsUUFBQSw0QkFBNEIsR0FBRztJQUN4QyxXQUFXO0lBQ1gsYUFBYTtDQUNpQyxDQUFDO0FBRXRDLFFBQUEseUJBQXlCLEdBQUc7SUFDckMsR0FBRyxvQ0FBNEI7SUFDL0IsU0FBUztDQUNxQyxDQUFDO0FBTW5ELE1BQU0saUJBQWlCO0lBRW5COzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsc0JBQXNCLENBQUMsU0FBaUIsRUFBRSxPQUF1QixPQUFPO1FBQzFFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1QsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbEMsS0FBSyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUNELElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENB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QUM1QyxDQUFDO0tBQ0osRUFBRTtRQUNDLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLENBQUMsS0FBZSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ2hDLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLGNBQU8sRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFhLEVBQUUsRUFBRTtZQUN2QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNULE9BQU87WUFDWCxDQUFDO1lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixFQUFFO2dCQUN6QyxPQUFPLEVBQUUsY0FBYztnQkFDdkIsT0FBTyxFQUFFLGdCQUFnQjtnQkFDekIsT0FBTyxFQUFFLE9BQU87YUFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDSixPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO0tBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcXVlcnlVVUlELCBxdWVyeUFzc2V0LCBWaXJ0dWFsQXNzZXQsIEFzc2V0REIsIHF1ZXJ5VXJsLCBBc3NldCwgZm9yRWFjaCwgcXVlcnlQYXRoIH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IGlzQWJzb2x1dGUsIGJhc2VuYW1lLCBleHRuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBRdWVyeUFzc2V0VHlwZSwgSUFzc2V0IH0gZnJvbSAnLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXJUeXBlLCBJQXNzZXRJbmZvLCBJQXNzZXRNZXRhLCBRdWVyeUFzc2V0c09wdGlvbiB9IGZyb20gJy4uL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IHsgRmlsdGVyUGx1Z2luT3B0aW9ucywgSVBsdWdpblNjcmlwdEluZm8gfSBmcm9tICcuLi8uLi9zY3JpcHRpbmcvaW50ZXJmYWNlJztcbmltcG9ydCB7IHVybDJ1dWlkLCBsaWJBcnIyT2JqLCBnZXRFeHRlbmRzRnJvbUNDVHlwZSwgdXJsMnBhdGgsIHBhdGhUb0RiVXJsSWZBc3NldERCUGF0aCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NldERCTWFuYWdlciBmcm9tICcuL2Fzc2V0LWRiJztcbmltcG9ydCBhc3NldEhhbmRsZXJNYW5hZ2VyIGZyb20gJy4vYXNzZXQtaGFuZGxlcic7XG5pbXBvcnQgc2NyaXB0IGZyb20gJy4uLy4uL3NjcmlwdGluZyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4uL2Fzc2V0LWNvbmZpZyc7XG5pbXBvcnQgbWluaW1hdGNoIGZyb20gJ21pbmltYXRjaCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkSlNPTlN5bmMsIHJlYWRkaXJTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQVNTRVRfSU5GT19EQVRBX0tFWVMgPSBbXG4gICAgJ3N1YkFzc2V0cycsXG4gICAgJ2Rpc3BsYXlOYW1lJyxcbl0gYXMgY29uc3Qgc2F0aXNmaWVzIHJlYWRvbmx5IChrZXlvZiBJQXNzZXRJbmZvKVtdO1xuXG5leHBvcnQgY29uc3QgQVNTRVRfVFJFRV9JTkZPX0RBVEFfS0VZUyA9IFtcbiAgICAuLi5ERUZBVUxUX0FTU0VUX0lORk9fREFUQV9LRVlTLFxuICAgICdleHRlbmRzJyxcbl0gYXMgY29uc3Qgc2F0aXNmaWVzIHJlYWRvbmx5IChrZXlvZiBJQXNzZXRJbmZvKVtdO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gICAgdmFyIGFzc2V0UXVlcnk6IEFzc2V0UXVlcnlNYW5hZ2VyO1xufVxuXG5jbGFzcyBBc3NldFF1ZXJ5TWFuYWdlciB7XG5cbiAgICAvKipcbiAgICAgKiAxLiDotYTmupAv6ISa5pysIHV1aWQsIGFzc2V0IC0+IHV1aWQg5L6d6LWW55qE5pmu6YCa6LWE5rqQ5YiX6KGoXG4gICAgICogMi4g6LWE5rqQIHV1aWQsIHNjcmlwdCAtPiB1dWlkIOS+nei1lueahOiEmuacrOWIl+ihqFxuICAgICAqIDMuIOiEmuacrCB1dWlkLCBzY3JpcHQgLT4gdXVpZCDohJrmnKzkvp3otZbnmoTohJrmnKzliJfooahcbiAgICAgKiBAcGFyYW0gdXVpZE9yVVJMXG4gICAgICogQHBhcmFtIHR5cGUgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcXVlcnlBc3NldERlcGVuZGVuY2llcyh1dWlkT3JVUkw6IHN0cmluZywgdHlwZTogUXVlcnlBc3NldFR5cGUgPSAnYXNzZXQnKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5xdWVyeUFzc2V0KHV1aWRPclVSTCk7XG4gICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmIChbJ2Fzc2V0JywgJ2FsbCddLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IHRoaXMucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAnZGVwZW5kcycpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChbJ3NjcmlwdCcsICdhbGwnXS5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgICAgY29uc3QgY2NUeXBlID0gdGhpcy5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsICd0eXBlJyk7XG4gICAgICAgICAgICBpZiAoY2NUeXBlID09PSAnY2MuU2NyaXB0Jykge1xuICAgICAgICAgICAgICAgIC8vIOi/lOWbnuS+nei1luiEmuacrOeahCBkYiBVUkxcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBwYXRoTGlzdDogc3RyaW5nW10gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcm9ncmFtbWluZycsICdwYWNrZXItZHJpdmVyL3F1ZXJ5LXNjcmlwdC1kZXBzJywgYXNzZXQuc291cmNlKTtcbiAgICAgICAgICAgICAgICAvLyB1dWlkcy5wdXNoKC4uLnBhdGhMaXN0Lm1hcChwYXRoID0+IHF1ZXJ5VVVJRChwYXRoKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1dWlkcy5wdXNoKC4uLnRoaXMucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAnZGVwZW5kU2NyaXB0cycpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXVpZHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogMS4g6LWE5rqQL+iEmuacrCB1dWlkLCBhc3NldCAtPiDkvb/nlKggdXVpZCDnmoTmma7pgJrotYTmupDliJfooahcbiAgICAgKiAyLiDotYTmupAgdXVpZCwgc2NyaXB0IC0+IOS9v+eUqCB1dWlkIOeahOiEmuacrOWIl+ihqFxuICAgICAqIDMuIOiEmuacrCB1dWlk77yMc2NyaXB0IC0+IOS9v+eUqOatpCB1dWlkIOiEmuacrOeahOiEmuacrOWIl+ihqFxuICAgICAqIEBwYXJhbSB1dWlkT3JVUkwgXG4gICAgICogQHBhcmFtIHR5cGUgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcXVlcnlBc3NldFVzZXJzKHV1aWRPclVSTDogc3RyaW5nLCB0eXBlOiBRdWVyeUFzc2V0VHlwZSA9ICdhc3NldCcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5xdWVyeUFzc2V0KHV1aWRPclVSTCk7XG4gICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjY1R5cGUgPSB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKTtcbiAgICAgICAgbGV0IHVzYWdlczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBpZiAoWydhc3NldCcsICdhbGwnXS5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgICAgaWYgKGNjVHlwZSA9PT0gJ2NjLlNjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICB1c2FnZXMgPSB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ2RlcGVuZGVkU2NyaXB0cycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1c2FnZXMgPSB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ2RlcGVuZGVkcycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFsnc2NyaXB0JywgJ2FsbCddLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgICAgICBpZiAoY2NUeXBlID09PSAnY2MuU2NyaXB0Jykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhMaXN0OiBzdHJpbmdbXSA9IGF3YWl0IHNjcmlwdC5xdWVyeVNjcmlwdFVzZXJzKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICAgICAgcGF0aExpc3QuZm9yRWFjaChwYXRoID0+IHVzYWdlcy5wdXNoKHF1ZXJ5VVVJRChwYXRoKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmn6Xor6Lkvp3otZbmraTotYTmupDnmoTohJrmnKzvvIznm67liY3kvp3otZbkv6Hmga/pg73orrDlvZXlnKjlnLrmma/kuIrvvIzmiYDku6Xlrp7pmYXkuIrlubbmsqHmnInohJrmnKzkvJrkvp3otZbotYTmupDvvIzku6PnoIHlhpnmrbvmmK/ml6Dms5Xmn6Xor6LnmoRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1c2FnZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Lyg5YWl5LiA5LiqIHV1aWQg5oiW6ICFIHVybCDmiJbogIXnu53lr7not6/lvoTvvIzmn6Xor6LmjIflkJHnmoTotYTmupBcbiAgICAgKiBAcGFyYW0gdXVpZE9yVVJMT3JQYXRoXG4gICAgICovXG4gICAgcXVlcnlBc3NldCh1dWlkT3JVUkxPclBhdGg6IHN0cmluZyk6IElBc3NldCB8IG51bGwge1xuICAgICAgICBjb25zdCB1dWlkID0gdXRpbHMuVVVJRC5pc1VVSUQodXVpZE9yVVJMT3JQYXRoKSA/IHV1aWRPclVSTE9yUGF0aCA6IHRoaXMucXVlcnlVVUlEKHV1aWRPclVSTE9yUGF0aCk7XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBhc3NldERCTWFuYWdlci5hc3NldERCTWFwKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXBbbmFtZV07XG4gICAgICAgICAgICBpZiAoIWRhdGFiYXNlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOafpeaJvueahOaYr+aVsOaNruW6kywg55Sx5LqO5pWw5o2u5bqT55qE5Y2V5p2h5pWw5o2u5LiN5ZyoIGRhdGFiYXNlIOmHjO+8jOaJgOS7pemcgOimgei/memHjOWNleeLrOi/lOWbnlxuICAgICAgICAgICAgaWYgKHV1aWQgPT09IGBkYjovLyR7bmFtZX1gKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBiYXNlbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZXh0bmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGBkYjovLyR7bmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICBzdWJBc3NldHM6IHt9LFxuICAgICAgICAgICAgICAgICAgICBsaWJyYXJ5OiAnJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge30sXG4gICAgICAgICAgICAgICAgICAgIGlzRGlyZWN0b3J5KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBgZGI6Ly8ke25hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVyOiAnMS4wLjAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYGRiOi8vJHtuYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJNZXRhczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJ2RhdGFiYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0gYXMgdW5rbm93biBhcyBJQXNzZXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gZGF0YWJhc2UuZ2V0QXNzZXQodXVpZCB8fCAnJyk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXNzZXQgYXMgdW5rbm93biBhcyBJQXNzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcXVlcnlBc3NldEluZm8odXJsT3JVVUlET3JQYXRoOiBzdHJpbmcsIGRhdGFLZXlzPzogcmVhZG9ubHkgKGtleW9mIElBc3NldEluZm8pW10pOiBJQXNzZXRJbmZvIHwgbnVsbCB7XG4gICAgICAgIGlmICghdXJsT3JVVUlET3JQYXRoIHx8IHR5cGVvZiB1cmxPclVVSURPclBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BhcmFtZXRlciBlcnJvcicpO1xuICAgICAgICB9XG4gICAgICAgIHVybE9yVVVJRE9yUGF0aCA9IHBhdGhUb0RiVXJsSWZBc3NldERCUGF0aCh1cmxPclVVSURPclBhdGgsIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvKTtcbiAgICAgICAgbGV0IHV1aWQgPSAnJztcblxuICAgICAgICBpZiAodXJsT3JVVUlET3JQYXRoLnN0YXJ0c1dpdGgoJ2RiOi8vJykpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB1cmxPclVVSURPclBhdGguc3Vic3RyKDUpO1xuICAgICAgICAgICAgaWYgKGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXBbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeURCQXNzZXRJbmZvKG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXVpZCA9IHVybDJ1dWlkKHVybE9yVVVJRE9yUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBYnNvbHV0ZSh1cmxPclVVSURPclBhdGgpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGF0YWJhc2UucGF0aDJhc3NldC5oYXModXJsT3JVVUlET3JQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICB1dWlkID0gZGF0YWJhc2UucGF0aDJhc3NldC5nZXQodXJsT3JVVUlET3JQYXRoKSEudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXVpZCA9IHVybE9yVVVJRE9yUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUFzc2V0SW5mb0J5VVVJRCh1dWlkLCBkYXRhS2V5cyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5oyH5a6a6LWE5rqQ55qE5L+h5oGvXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQ55qE5ZSv5LiA5qCH6K+G56ymXG4gICAgICogQHBhcmFtIGRhdGFLZXlzIOi1hOa6kOi+k+WHuuWPr+mAiemhuVxuICAgICAqL1xuICAgIHF1ZXJ5QXNzZXRJbmZvQnlVVUlEKHV1aWQ6IHN0cmluZywgZGF0YUtleXM/OiByZWFkb25seSAoa2V5b2YgSUFzc2V0SW5mbylbXSk6IElBc3NldEluZm8gfCBudWxsIHtcbiAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyDmn6Xor6LotYTmupBcbiAgICAgICAgY29uc3QgYXNzZXQgPSBxdWVyeUFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmVuY29kZUFzc2V0KGFzc2V0LCBkYXRhS2V5cyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC55o2u5o+Q5L6b55qEIG9wdGlvbnMg5p+l6K+i5a+55bqU55qE6LWE5rqQ5pWw57uEKOS4jeWMheWQq+aVsOaNruW6k+WvueixoSlcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyDmkJzntKLphY3nva5cbiAgICAgKiBAcGFyYW0gZGF0YUtleXMg5oyH5a6a6ZyA6KaB55qE6LWE5rqQ5L+h5oGv5a2X5q61XG4gICAgICovXG4gICAgcXVlcnlBc3NldEluZm9zKG9wdGlvbnM/OiBRdWVyeUFzc2V0c09wdGlvbiwgZGF0YUtleXM/OiByZWFkb25seSAoa2V5b2YgSUFzc2V0SW5mbylbXSk6IElBc3NldEluZm9bXSB7XG4gICAgICAgIGxldCBhbGxBc3NldHM6IElBc3NldFtdID0gW107XG4gICAgICAgIGNvbnN0IGRiSW5mb3M6IElBc3NldEluZm9bXSA9IFtdO1xuICAgICAgICAvLyDlvqrnjq/mr4/kuIDkuKrlt7Lnu4/lkK/liqjnmoQgZGF0YWJhc2VcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgIGFsbEFzc2V0cyA9IGFsbEFzc2V0cy5jb25jYXQoQXJyYXkuZnJvbShkYXRhYmFzZS51dWlkMmFzc2V0LnZhbHVlcygpKSk7XG4gICAgICAgICAgICBkYkluZm9zLnB1c2godGhpcy5xdWVyeURCQXNzZXRJbmZvKG5hbWUpISk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZpbHRlckFzc2V0czogSUFzc2V0W10gPSBhbGxBc3NldHM7XG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5pc0J1bmRsZSkge1xuICAgICAgICAgICAgICAgIC8vIOWFvOWuueaXp+eJiOacrOS9v+eUqCBpc0J1bmRsZSDmn6Xor6LkvJrpu5jorqTluKbkuIogbWV0YSDnmoTooYzkuLpcbiAgICAgICAgICAgICAgICBkYXRhS2V5cyA9IChkYXRhS2V5cyB8fCBbXSkuY29uY2F0KFsnbWV0YSddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOagueaNrumAiemhueetm+mAiei/h+a7pOeahOWHveaVsOS/oeaBr1xuICAgICAgICAgICAgY29uc3QgZmlsdGVySW5mb3MgPSBGaWx0ZXJIYW5kbGVySW5mb3MuZmlsdGVyKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGluZm8udmFsdWUgPSBvcHRpb25zW2luZm8ubmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGluZm8ucmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLnZhbHVlID0gaW5mby5yZXNvbHZlKGluZm8udmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW5mby52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpbHRlckFzc2V0cyA9IHNlYXJjaEFzc2V0cyhmaWx0ZXJJbmZvcywgYWxsQXNzZXRzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBmaWx0ZXJBc3NldHMubWFwKChhc3NldCkgPT4gdGhpcy5lbmNvZGVBc3NldChhc3NldCwgZGF0YUtleXMpKTtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8IChhbGxBc3NldHMubGVuZ3RoICYmIGFsbEFzc2V0cy5sZW5ndGggPT09IHJlc3VsdC5sZW5ndGgpKSB7XG4gICAgICAgICAgICAvLyDml6DmlYjov4fmu6TmnaHku7bmiJbogIXmn6Xor6Llhajpg6jotYTmupDml7bpnIDopoHljIXlkKvpu5jorqQgZGIg55qE6LWE5rqQ77yM5Li76KaB5Li65LqG5YW85a655pen54mI5pys55qE5o6l5Y+j6KGM5Li677yM5q2j5bi46LWE5rqQ5p+l6K+i5bqU6K+l5LiN5YyF5ZCr5pWw5o2u5bqT5a+56LGhXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChkYkluZm9zKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnBhdHRlcm4gJiYgT2JqZWN0LmtleXMob3B0aW9ucykubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyDlrZjlnKggcGF0dGVybiDlj4LmlbDml7bvvIzpnIDopoHljIXlkKvmlbDmja7lupPlr7nosaHvvIzkuLvopoHmmK/lhbzlrrnml6fniYjmnKzooYzkuLpcbiAgICAgICAgICAgIHJldHVybiBkYkluZm9zLmZpbHRlcigoZGIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWluaW1hdGNoKGRiLnVybCwgb3B0aW9ucy5wYXR0ZXJuISk7XG4gICAgICAgICAgICB9KS5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBxdWVyeUFzc2V0cyhvcHRpb25zOiBRdWVyeUFzc2V0c09wdGlvbiA9IHt9KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFzc2V0czogSUFzc2V0W10gPSBbXTtcbiAgICAgICAgLy8g5b6q546v5q+P5LiA5Liq5bey57uP5ZCv5Yqo55qEIGRhdGFiYXNlXG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBhc3NldERCTWFuYWdlci5hc3NldERCTWFwKSB7XG4gICAgICAgICAgICBpZiAoIShuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgIGFzc2V0cyA9IGFzc2V0cy5jb25jYXQoQXJyYXkuZnJvbShkYXRhYmFzZS51dWlkMmFzc2V0LnZhbHVlcygpKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgLy8g5qC55o2u6YCJ6aG5562b6YCJ6L+H5ruk55qE5Ye95pWw5L+h5oGvXG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJJbmZvcyA9IEZpbHRlckhhbmRsZXJJbmZvcy5maWx0ZXIoaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaW5mby52YWx1ZSA9IG9wdGlvbnNbaW5mby5uYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoaW5mby5yZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8udmFsdWUgPSBpbmZvLnJlc29sdmUoaW5mby52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmZvLnZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXNzZXRzID0gc2VhcmNoQXNzZXRzKGZpbHRlckluZm9zLCBhc3NldHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3NldHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i56ym5ZCI5p+Q5Liq562b6YCJ6KeE5YiZ55qE5o6S5bqP5ZCO55qE5o+S5Lu26ISa5pys5YiX6KGoXG4gICAgICogQHBhcmFtIGZpbHRlck9wdGlvbnMgXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBxdWVyeVNvcnRlZFBsdWdpbnMoZmlsdGVyT3B0aW9uczogRmlsdGVyUGx1Z2luT3B0aW9ucyA9IHt9KTogSVBsdWdpblNjcmlwdEluZm9bXSB7XG4gICAgICAgIGNvbnN0IHBsdWdpbnMgPSB0aGlzLnF1ZXJ5QXNzZXRJbmZvcyh7XG4gICAgICAgICAgICBjY1R5cGU6ICdjYy5TY3JpcHQnLFxuICAgICAgICAgICAgdXNlckRhdGE6IHtcbiAgICAgICAgICAgICAgICAuLi5maWx0ZXJPcHRpb25zLFxuICAgICAgICAgICAgICAgIGlzUGx1Z2luOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgWyduYW1lJ10pO1xuICAgICAgICBpZiAoIXBsdWdpbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICAvLyAxLiDlhYjmjInnhafpu5jorqTmj5Lku7bohJrmnKznmoTmjpLluo/op4TliJnvvIzlj5bmj5Lku7bohJrmnKzlkI3np7DmjpLluo9cbiAgICAgICAgcGx1Z2lucy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcblxuICAgICAgICAvLyAyLiDmoLnmja7pobnnm67orr7nva7lhoXphY3nva7lpb3nmoTohJrmnKzkvJjlhYjnuqfpobrluo/vvIzosIPmlbTljp/mnInnmoTohJrmnKzmjpLluo9cbiAgICAgICAgY29uc3Qgc29ydGVkOiBzdHJpbmdbXSA9IGFzc2V0Q29uZmlnLmRhdGEuc29ydGluZ1BsdWdpbjtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc29ydGVkKSAmJiBzb3J0ZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyDov4fmu6TmjonnlKjmiLfphY3nva7mjpLluo/kuK3kuI3nrKblkIjlvZPliY3njq/looPmiJbogIXor7TkuI3lrZjlnKjnmoTmj5Lku7bohJrmnKxcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlclNvcnRlZCA9IHNvcnRlZC5maWx0ZXIoKHV1aWQpID0+IHBsdWdpbnMuZmluZChpbmZvID0+IGluZm8udXVpZCA9PT0gdXVpZCkpO1xuICAgICAgICAgICAgLy8g5YCS5bqP5aSE55CG5Li76KaB5piv5Li65LqG5YW85a65IDM4MyDkuYvliY3nmoTlpITnkIbop4TliJnvvIzkv53mjIHkuIDoh7TnmoTnu5PmnpzooYzkuLrjgILpobrluo/mjpLnu5PmnpzmnInlt67lvILjgIJcbiAgICAgICAgICAgIGZpbHRlclNvcnRlZC5yZXZlcnNlKCkucmVkdWNlKChwcmVJbmRleCwgY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHBsdWdpbnMuZmluZEluZGV4KChpbmZvKSA9PiBpbmZvLnV1aWQgPT09IGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SW5kZXggPiBwcmVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRzID0gcGx1Z2lucy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcGx1Z2lucy5zcGxpY2UocHJlSW5kZXgsIDAsIHNjcmlwdHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJlSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50SW5kZXg7XG4gICAgICAgICAgICB9LCBwbHVnaW5zLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGx1Z2lucy5tYXAoKGFzc2V0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgZmlsZTogYXNzZXQubGlicmFyeVsnLmpzJ10sXG4gICAgICAgICAgICAgICAgdXJsOiBhc3NldC51cmwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIOWwhuS4gOS4qiBBc3NldCDovazmiJAgaW5mbyDlr7nosaFcbiAgICAgKiBAcGFyYW0gZGF0YWJhc2VcbiAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgKiBAcGFyYW0gaW52YWxpZCDmmK/lkKbmmK/ml6DmlYjnmoTotYTmupDvvIzkvovlpoLlt7LooqvliKDpmaTnmoTotYTmupBcbiAgICAgKi9cbiAgICBlbmNvZGVBc3NldChhc3NldDogSUFzc2V0LCBkYXRhS2V5czogcmVhZG9ubHkgKGtleW9mIElBc3NldEluZm8pW10gPSBERUZBVUxUX0FTU0VUX0lORk9fREFUQV9LRVlTLCBpbnZhbGlkID0gZmFsc2UpIHtcbiAgICAgICAgbGV0IG5hbWUgPSAnJztcbiAgICAgICAgbGV0IHNvdXJjZSA9ICcnO1xuICAgICAgICBsZXQgZmlsZSA9ICcnO1xuICAgICAgICBjb25zdCBkYXRhYmFzZSA9IGFzc2V0Ll9hc3NldERCO1xuICAgICAgICBpZiAoYXNzZXQudXVpZCA9PT0gYXNzZXQuc291cmNlIHx8IChhc3NldCBpbnN0YW5jZW9mIEFzc2V0ICYmIGFzc2V0LnNvdXJjZSkpIHtcbiAgICAgICAgICAgIG5hbWUgPSBiYXNlbmFtZShhc3NldC5zb3VyY2UpO1xuICAgICAgICAgICAgc291cmNlID0gYXNzZXREQk1hbmFnZXIucGF0aDJ1cmwoYXNzZXQuc291cmNlLCBkYXRhYmFzZS5vcHRpb25zLm5hbWUpO1xuICAgICAgICAgICAgZmlsZSA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5hbWUgPSBhc3NldC5fbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsb2FkVXJsID0gbmFtZTtcbiAgICAgICAgbGV0IHVybCA9IG5hbWU7XG5cbiAgICAgICAgLy8g5rOo77yaYXNzZXQudXVpZCA9PT0gYXNzZXQuc291cmNlIOaYryBtYWMg5LiK55qEIGRiOi8vYXNzZXRzXG4gICAgICAgIGlmIChhc3NldC51dWlkID09PSBhc3NldC5zb3VyY2UgfHwgYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkge1xuICAgICAgICAgICAgdXJsID0gbG9hZFVybCA9IHNvdXJjZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBwYXJlbnQ6IEFzc2V0IHwgVmlydHVhbEFzc2V0IHwgbnVsbCA9IGFzc2V0LnBhcmVudDtcbiAgICAgICAgICAgIHdoaWxlIChwYXJlbnQgJiYgIShwYXJlbnQgaW5zdGFuY2VvZiBBc3NldCkpIHtcbiAgICAgICAgICAgICAgICBsb2FkVXJsID0gYCR7cGFyZW50Ll9uYW1lfS8ke25hbWV9YDtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKHBhcmVudCBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXJlbnQuX3NvdXJjZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcFNvdXJjZSA9IGFzc2V0REJNYW5hZ2VyLnBhdGgydXJsKHBhcmVudC5fc291cmNlLCBkYXRhYmFzZS5vcHRpb25zLm5hbWUpO1xuICAgICAgICAgICAgICAgIHVybCA9IHRlbXBTb3VyY2UgKyAnLycgKyBsb2FkVXJsO1xuICAgICAgICAgICAgICAgIGxvYWRVcmwgPSB0ZW1wU291cmNlLnN1YnN0cigwLCB0ZW1wU291cmNlLmxlbmd0aCAtIGV4dC5sZW5ndGgpICsgJy8nICsgbG9hZFVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgaXNEaXJlY3RvcnkgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlzRGlyZWN0b3J5ID0gYXNzZXQuaXNEaXJlY3RvcnkoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChpbnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgLy8g6KKr5Yig6Zmk55qE6LWE5rqQ5q2k5aSE5oqb5byC5bi45LiN5oql6ZSZXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXNEaXJlY3RvcnkgPSBleHRuYW1lKGFzc2V0LnNvdXJjZSkgPT09ICcnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIGxvYWRVcmwgPSBsb2FkVXJsLnJlcGxhY2UoL1xcLlteLi9dKyQvLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmZvOiBJQXNzZXRJbmZvID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBhc3NldC5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICAgIGxvYWRVcmwsIC8vIGxvYWRlciDliqDovb3kvb/nlKjnmoTot6/lvoRcbiAgICAgICAgICAgIHVybCwgLy8g5a6e6ZmF55qE5bim5pyJ5omp5bGV5ZCN55qE6Lev5b6EXG4gICAgICAgICAgICBmaWxlLCAvLyDlrp7pmYXno4Hnm5jot6/lvoRcbiAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICBpbXBvcnRlcjogYXNzZXQubWV0YS5pbXBvcnRlciBhcyBBc3NldEhhbmRsZXJUeXBlLFxuICAgICAgICAgICAgaW1wb3J0ZWQ6IGFzc2V0Lm1ldGEuaW1wb3J0ZWQsIC8vIOaYr+WQpue7k+adn+WvvOWFpei/h+eoi1xuICAgICAgICAgICAgaW52YWxpZDogYXNzZXQuaW52YWxpZCwgLy8g5piv5ZCm5a+85YWl5oiQ5YqfXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKSxcbiAgICAgICAgICAgIGlzRGlyZWN0b3J5LFxuICAgICAgICAgICAgcmVhZG9ubHk6IGRhdGFiYXNlLm9wdGlvbnMucmVhZG9ubHksXG4gICAgICAgICAgICBsaWJyYXJ5OiBsaWJBcnIyT2JqKGFzc2V0KSxcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhS2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgMjMyMlxuICAgICAgICAgICAgaW5mb1trZXldID0gdGhpcy5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsIGtleSkgPz8gaW5mb1trZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDmsqHmnInmmL7npLrmjIflrprojrflj5YgaXNCdW5kbGUg5a2X5q615pe277yM6buY6K6k5Y+q5pyJIGJ1bmRsZSDmlofku7blpLnmiY3kvJrliqDkuIrmoIforrBcbiAgICAgICAgaWYgKCFkYXRhS2V5cy5pbmNsdWRlcygnaXNCdW5kbGUnKSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ2lzQnVuZGxlJyk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmlzQnVuZGxlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhS2V5cy5pbmNsdWRlcygncGFyZW50JykgJiYgYXNzZXQucGFyZW50KSB7XG4gICAgICAgICAgICBpbmZvLnBhcmVudCA9IHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IGFzc2V0LnBhcmVudC5zb3VyY2UsXG4gICAgICAgICAgICAgICAgbGlicmFyeTogbGliQXJyMk9iaihhc3NldC5wYXJlbnQpLFxuICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnBhcmVudC51dWlkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YUtleXMuaW5jbHVkZXMoJ3N1YkFzc2V0cycpKSB7XG4gICAgICAgICAgICBpbmZvLnN1YkFzc2V0cyA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0LnN1YkFzc2V0cykge1xuICAgICAgICAgICAgICAgIGlmICghKG5hbWUgaW4gYXNzZXQuc3ViQXNzZXRzKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRJbmZvOiBJQXNzZXRJbmZvID0gdGhpcy5lbmNvZGVBc3NldChhc3NldC5zdWJBc3NldHNbbmFtZV0sIGRhdGFLZXlzKTtcbiAgICAgICAgICAgICAgICBpbmZvLnN1YkFzc2V0c1tuYW1lXSA9IGNoaWxkSW5mbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5mbztcbiAgICB9XG5cbiAgICBxdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQ6IElBc3NldCwgcHJvcGVydHk6IChrZXlvZiBJQXNzZXRJbmZvIHwgJ2RlcGVuZHMnIHwgJ2RlcGVuZFNjcmlwdHMnIHwgJ2RlcGVuZGVkU2NyaXB0cycpKTogYW55IHtcblxuICAgICAgICBzd2l0Y2ggKHByb3BlcnR5KSB7XG4gICAgICAgICAgICBjYXNlICdsb2FkVXJsJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ25hbWUnKSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGxldCBsb2FkVXJsID0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5rOo77yaYXNzZXQudXVpZCA9PT0gYXNzZXQuc291cmNlIOaYryBtYWMg5LiK55qEIGRiOi8vYXNzZXRzXG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkVXJsID0gYXNzZXREQk1hbmFnZXIucGF0aDJ1cmwoYXNzZXQuc291cmNlLCBhc3NldC5fYXNzZXREQi5vcHRpb25zLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhcmVudDogQXNzZXQgfCBWaXJ0dWFsQXNzZXQgfCBudWxsID0gYXNzZXQucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHBhcmVudCAmJiAhKHBhcmVudCBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRVcmwgPSBgJHtwYXJlbnQuX25hbWV9LyR7bmFtZX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50IGluc3RhbmNlb2YgQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleHQgPSBleHRuYW1lKHBhcmVudC5fc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wU291cmNlID0gYXNzZXREQk1hbmFnZXIucGF0aDJ1cmwocGFyZW50Ll9zb3VyY2UsIGFzc2V0Ll9hc3NldERCLm9wdGlvbnMubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFVybCA9IHRlbXBTb3VyY2Uuc3Vic3RyKDAsIHRlbXBTb3VyY2UubGVuZ3RoIC0gZXh0Lmxlbmd0aCkgKyAnLycgKyBsb2FkVXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNEaXJlY3RvcnkgPSBhc3NldC5pc0RpcmVjdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkVXJsID0gbG9hZFVybC5yZXBsYWNlKC9cXC5bXi4vXSskLywgJycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2FkVXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ25hbWUnOlxuICAgICAgICAgICAgICAgIGlmIChhc3NldC51dWlkID09PSBhc3NldC5zb3VyY2UgfHwgKGFzc2V0IGluc3RhbmNlb2YgQXNzZXQgJiYgYXNzZXQuc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmFzZW5hbWUoYXNzZXQuc291cmNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXNzZXQuX25hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAncmVhZG9ubHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldC5fYXNzZXREQi5vcHRpb25zLnJlYWRvbmx5O1xuICAgICAgICAgICAgY2FzZSAndXJsJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ25hbWUnKSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldC51dWlkID09PSBhc3NldC5zb3VyY2UgfHwgYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFzc2V0REJNYW5hZ2VyLnBhdGgydXJsKGFzc2V0LnNvdXJjZSwgYXNzZXQuX2Fzc2V0REIub3B0aW9ucy5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXRoID0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXJlbnQ6IEFzc2V0IHwgVmlydHVhbEFzc2V0IHwgbnVsbCA9IGFzc2V0LnBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQgJiYgIShwYXJlbnQgaW5zdGFuY2VvZiBBc3NldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gYCR7cGFyZW50Ll9uYW1lfS8ke25hbWV9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudCBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcFNvdXJjZSA9IGFzc2V0REJNYW5hZ2VyLnBhdGgydXJsKHBhcmVudC5fc291cmNlLCBhc3NldC5fYXNzZXREQi5vcHRpb25zLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZW1wU291cmNlICsgJy8nICsgcGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICd0eXBlJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBhc3NldEhhbmRsZXJNYW5hZ2VyLm5hbWUyaGFuZGxlclthc3NldC5tZXRhLmltcG9ydGVyXSB8fCBhc3NldC5fYXNzZXREQi5pbXBvcnRlck1hbmFnZXIubmFtZTJpbXBvcnRlclthc3NldC5tZXRhLmltcG9ydGVyXSB8fCBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlciA/IGhhbmRsZXIuYXNzZXRUeXBlIHx8ICdjYy5Bc3NldCcgOiAnY2MuQXNzZXQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2lzQnVuZGxlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXNzZXQubWV0YS51c2VyRGF0YSAmJiBhc3NldC5tZXRhLnVzZXJEYXRhLmlzQnVuZGxlO1xuICAgICAgICAgICAgY2FzZSAnaW5zdGFudGlhdGlvbic6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gYXNzZXRIYW5kbGVyTWFuYWdlci5uYW1lMmhhbmRsZXJbYXNzZXQubWV0YS5pbXBvcnRlcl0gfHwgYXNzZXQuX2Fzc2V0REIuaW1wb3J0ZXJNYW5hZ2VyLm5hbWUyaW1wb3J0ZXJbYXNzZXQubWV0YS5pbXBvcnRlcl0gfHwgbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIgPyBoYW5kbGVyLmluc3RhbnRpYXRpb24gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnbGlicmFyeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpYkFycjJPYmooYXNzZXQpO1xuICAgICAgICAgICAgY2FzZSAnZGlzcGxheU5hbWUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldC5kaXNwbGF5TmFtZTtcbiAgICAgICAgICAgIGNhc2UgJ3JlZGlyZWN0JzpcbiAgICAgICAgICAgICAgICAvLyDmlbTnkIbot7PovazmlbDmja5cbiAgICAgICAgICAgICAgICBpZiAoYXNzZXQubWV0YS51c2VyRGF0YSAmJiBhc3NldC5tZXRhLnVzZXJEYXRhLnJlZGlyZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZGlyZWN0SW5mbyA9IHRoaXMucXVlcnlBc3NldChhc3NldC5tZXRhLnVzZXJEYXRhLnJlZGlyZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZGlyZWN0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVkaXJlY3RIYW5kbGVyID0gYXNzZXRIYW5kbGVyTWFuYWdlci5uYW1lMmhhbmRsZXJbcmVkaXJlY3RJbmZvLm1ldGEuaW1wb3J0ZXJdIHx8IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJlZGlyZWN0SW5mby51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHJlZGlyZWN0SGFuZGxlciA/IHJlZGlyZWN0SGFuZGxlci5hc3NldFR5cGUgfHwgJ2NjLkFzc2V0JyA6ICdjYy5Bc3NldCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVuZHMnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5q2k5aSE5YW85a655LqG5pen55qE6LWE5rqQ5a+85YWl5ZmoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IENDVHlwZSA9IHRoaXMucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAndHlwZScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RXh0ZW5kc0Zyb21DQ1R5cGUoQ0NUeXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICd2aXNpYmxlJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgVE9ETyDlupXlsYIgb3B0aW9ucyDlubbml6DmraTlrZfmrrVcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZpc2libGUgPSBhc3NldC5fYXNzZXREQi5vcHRpb25zLnZpc2libGU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2aXNpYmxlICYmIGFzc2V0LnVzZXJEYXRhLnZpc2libGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpc2libGUgPT09IGZhbHNlID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ210aW1lJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldC5fYXNzZXREQi5pbmZvTWFuYWdlci5nZXQoYXNzZXQuc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZm8gPyBpbmZvLnRpbWUgOiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ21ldGEnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldC5tZXRhO1xuICAgICAgICAgICAgY2FzZSAnZGVwZW5kcyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhc3NldC5nZXREYXRhKCdkZXBlbmRzJykgfHwgW10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2RlcGVuZGVkcyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VkTGlzdDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gY29sbGVjdFV1aWQoZGVwZW5kczogc3RyaW5nW10sIHV1aWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlcGVuZHMuaW5jbHVkZXMoYXNzZXQudXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VkTGlzdC5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvckVhY2goKGRiOiBBc3NldERCKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXAgPSBkYi5kYXRhTWFuYWdlci5kYXRhTWFwO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBpZCBpbiBtYXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gbWFwW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS52YWx1ZSAmJiBpdGVtLnZhbHVlLmRlcGVuZHMgJiYgaXRlbS52YWx1ZS5kZXBlbmRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0VXVpZChpdGVtLnZhbHVlLmRlcGVuZHMsIGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlZExpc3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnZGVwZW5kU2NyaXB0cyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXNzZXQuX2Fzc2V0REIuZGF0YU1hbmFnZXIuZGF0YU1hcFthc3NldC51dWlkXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEFycmF5LmZyb20oZGF0YSAmJiBkYXRhLnZhbHVlICYmIGRhdGEudmFsdWVbJ2RlcGVuZFNjcmlwdHMnXSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnZGVwZW5kZWRTY3JpcHRzJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZWRMaXN0OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3JFYWNoKChkYjogQXNzZXREQikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwID0gZGIuZGF0YU1hbmFnZXIuZGF0YU1hcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaWQgaW4gbWFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IG1hcFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0udmFsdWUgJiYgaXRlbS52YWx1ZS5kZXBlbmRTY3JpcHRzICYmIGl0ZW0udmFsdWUuZGVwZW5kU2NyaXB0cy5pbmNsdWRlcyhhc3NldC51dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VkTGlzdC5wdXNoKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlZExpc3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAndGVtcCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzc2V0LnRlbXA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LmjIflrprnmoTotYTmupDnmoQgbWV0YVxuICAgICAqIEBwYXJhbSB1dWlkT3JVUkxPclBhdGgg6LWE5rqQ55qE5ZSv5LiA5qCH6K+G56ymXG4gICAgICovXG4gICAgcXVlcnlBc3NldE1ldGEodXVpZE9yVVJMT3JQYXRoOiBzdHJpbmcpOiBJQXNzZXRNZXRhIHwgbnVsbCB7XG4gICAgICAgIGlmICghdXVpZE9yVVJMT3JQYXRoIHx8IHR5cGVvZiB1dWlkT3JVUkxPclBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdXVpZCA9IHV1aWRPclVSTE9yUGF0aDtcbiAgICAgICAgaWYgKHV1aWRPclVSTE9yUGF0aC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdXVpZE9yVVJMT3JQYXRoLnN1YnN0cig1KTtcbiAgICAgICAgICAgIGlmIChhc3NldERCTWFuYWdlci5hc3NldERCTWFwW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBEQiDmlbDmja7lupPlubbkuI3lrZjlnKggbWV0YSDnkIborrrkuIrlubbkuI3pnIDopoHov5Tlm57vvIzkvYbml6fniYjmnKzlt7LmlK/mjIFcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBkaXNwbGF5TmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAvLyBpZDogJycsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJ2RhdGFiYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgLy8gbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIHN1Yk1ldGFzOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGE6IHt9LFxuICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkT3JVUkxPclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHZlcjogJzEuMC4wJyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHVybDJwYXRoKHV1aWRPclVSTE9yUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBtZXRhSW5mbyA9IGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXBbJ2Fzc2V0cyddLm1ldGFNYW5hZ2VyLnBhdGgybWV0YVtwYXRoXTtcbiAgICAgICAgICAgIGlmIChtZXRhSW5mbykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZXRhSW5mby5qc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXVpZCA9IHVybDJ1dWlkKHV1aWRPclVSTE9yUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXNzZXQgPSBxdWVyeUFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhc3NldC5tZXRhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouWtkOi1hOa6kOWQjeensFxuICAgICAqIOW9k+a6kOaWh+S7tuW3suWIoOmZpOS9hiAubWV0YSDku43lrZjlnKjml7bvvIzpgJrov4for7vlj5YgbWV0YSDnmoQgc3ViTWV0YXMg6I635Y+W5a2Q6LWE5rqQ5ZCN56ewXG4gICAgICogQHBhcmFtIG1haW5VdWlkIOS4u+i1hOa6kCBVVUlEXG4gICAgICogQHBhcmFtIHN1YklkIOWtkOi1hOa6kCBJRO+8iEAg5ZCO6Z2i55qE6YOo5YiG77yJXG4gICAgICovXG4gICAgcXVlcnlTdWJBc3NldE5hbWUobWFpblV1aWQ6IHN0cmluZywgc3ViSWQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBjb25zdCBtZXRhID0gdGhpcy5xdWVyeUFzc2V0TWV0YShtYWluVXVpZCk7XG4gICAgICAgIGlmIChtZXRhPy5zdWJNZXRhcz8uW3N1YklkXT8ubmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG1ldGEuc3ViTWV0YXNbc3ViSWRdLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmupDmlofku7blt7LliKDpmaTkvYYgLm1ldGEg5LuN5a2Y5Zyo5pe277yM6YCa6L+HIGluZm9NYW5hZ2VyIOafpeaJvuW3suWIoOmZpOi1hOa6kOeahOi3r+W+hO+8jOebtOaOpeivu+WPliAubWV0YSDmlofku7ZcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgIGlmICghZGF0YWJhc2UpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAvLyBtZXRhTWFuYWdlciDlj6/og73ku43nvJPlrZjkuoYgLm1ldGEg5pWw5o2uXG4gICAgICAgICAgICBjb25zdCBwYXRoMm1ldGEgPSBkYXRhYmFzZS5tZXRhTWFuYWdlcj8ucGF0aDJtZXRhO1xuICAgICAgICAgICAgaWYgKHBhdGgybWV0YSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHBhdGgybWV0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhSW5mbyA9IHBhdGgybWV0YVtrZXldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWV0YUluZm8/Lmpzb24/LnV1aWQgPT09IG1haW5VdWlkICYmIG1ldGFJbmZvLmpzb24uc3ViTWV0YXM/LltzdWJJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZXRhSW5mby5qc29uLnN1Yk1ldGFzW3N1YklkXS5uYW1lID8/IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGluZm9NYW5hZ2VyIOiusOW9leS6huW3suWIoOmZpOi1hOa6kOeahOi3r+W+hO+8jOWwneivleS7juejgeebmOivu+WPliAubWV0YSDmlofku7ZcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWlzc2luZ0luZm8gPSBkYXRhYmFzZS5pbmZvTWFuYWdlcj8uZ2V0TWlzc2luZ0luZm8obWFpblV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChtaXNzaW5nSW5mbz8ucGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IG1pc3NpbmdJbmZvLnBhdGggKyAnLm1ldGEnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFKc29uID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXRhSnNvbj8uc3ViTWV0YXM/LltzdWJJZF0/Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWV0YUpzb24uc3ViTWV0YXNbc3ViSWRdLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAvLyBpbmZvTWFuYWdlciBvciBmaWxlIHJlYWQgbWF5IGZhaWxcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6YGN5Y6G6LWE5rqQ55uu5b2V77yM5p+l5om+5YyF5ZCr6K+lIFVVSUQg55qEIC5tZXRhIOaWh+S7tlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBhc3NldERCTWFuYWdlci5hc3NldERCSW5mb1tuYW1lXT8udGFyZ2V0O1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgJiYgZXhpc3RzU3luYyh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2ZpbmRTdWJBc3NldE5hbWVGcm9tTWV0YSh0YXJnZXQsIG1haW5VdWlkLCBzdWJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgLy8gZmlsZXN5c3RlbSBzY2FuIG1heSBmYWlsXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZmluZFN1YkFzc2V0TmFtZUZyb21NZXRhKGRpcjogc3RyaW5nLCB1dWlkOiBzdHJpbmcsIHN1YklkOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSByZWFkZGlyU3luYyhkaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgZW50cnkubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fZmluZFN1YkFzc2V0TmFtZUZyb21NZXRhKGZ1bGxQYXRoLCB1dWlkLCBzdWJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5uYW1lLmVuZHNXaXRoKCcubWV0YScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhSnNvbiA9IHJlYWRKU09OU3luYyhmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWV0YUpzb24/LnV1aWQgPT09IHV1aWQgJiYgbWV0YUpzb24/LnN1Yk1ldGFzPy5bc3ViSWRdPy5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ldGFKc29uLnN1Yk1ldGFzW3N1YklkXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgdW5yZWFkYWJsZSBtZXRhIGZpbGVzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gZGlyZWN0b3J5IHJlYWQgbWF5IGZhaWxcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LmjIflrprnmoTotYTmupDku6Xlj4rlr7nlupQgbWV0YSDnmoQgbXRpbWVcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupDnmoTllK/kuIDmoIfor4bnrKZcbiAgICAgKi9cbiAgICBxdWVyeUFzc2V0TXRpbWUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApIHtcbiAgICAgICAgICAgIGlmICghKG5hbWUgaW4gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlOiBBc3NldERCID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgIGlmICghZGF0YWJhc2UpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gZGF0YWJhc2UuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gZGF0YWJhc2UuaW5mb01hbmFnZXIuZ2V0KGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZm8gPyBpbmZvLnRpbWUgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHF1ZXJ5VVVJRCh1cmxPclBhdGg6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIXVybE9yUGF0aCB8fCB0eXBlb2YgdXJsT3JQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdXJsT3JQYXRoID0gcGF0aFRvRGJVcmxJZkFzc2V0REJQYXRoKHVybE9yUGF0aCwgYXNzZXREQk1hbmFnZXIuYXNzZXREQkluZm8pO1xuXG4gICAgICAgIGlmICh1cmxPclBhdGguc3RhcnRzV2l0aCgnZGI6Ly8nKSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHVybE9yUGF0aC5zdWJzdHIoNSk7XG4gICAgICAgICAgICBpZiAoYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgZGI6Ly8ke25hbWV9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSB1cmwydXVpZCh1cmxPclBhdGgpO1xuICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXVpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnlVVUlEKHVybE9yUGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGRiIOagueiKgueCueS4jeaYr+acieaViOeahCBhc3NldCDnsbvlnovotYTmupBcbiAgICAgKiDov5nph4zkvKrpgKDkuIDku73lroPnmoTmlbDmja7kv6Hmga9cbiAgICAgKiBAcGFyYW0gbmFtZSBkYiBuYW1lXG4gICAgICovXG4gICAgcXVlcnlEQkFzc2V0SW5mbyhuYW1lOiBzdHJpbmcpOiBJQXNzZXRJbmZvIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGRiSW5mbyA9IGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvW25hbWVdO1xuICAgICAgICBpZiAoIWRiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmZvOiBJQXNzZXRJbmZvID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBuYW1lIHx8ICcnLFxuICAgICAgICAgICAgc291cmNlOiBgZGI6Ly8ke25hbWV9YCxcbiAgICAgICAgICAgIGxvYWRVcmw6IGBkYjovLyR7bmFtZX1gLFxuICAgICAgICAgICAgdXJsOiBgZGI6Ly8ke25hbWV9YCxcbiAgICAgICAgICAgIGZpbGU6IGRiSW5mby50YXJnZXQsIC8vIOWunumZheejgeebmOi3r+W+hFxuICAgICAgICAgICAgdXVpZDogYGRiOi8vJHtuYW1lfWAsXG4gICAgICAgICAgICBpbXBvcnRlcjogJ2RhdGFiYXNlJyxcbiAgICAgICAgICAgIGltcG9ydGVkOiB0cnVlLFxuICAgICAgICAgICAgaW52YWxpZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnY2NlLkRhdGFiYXNlJyxcbiAgICAgICAgICAgIGlzRGlyZWN0b3J5OiBmYWxzZSxcbiAgICAgICAgICAgIGxpYnJhcnk6IHt9LFxuICAgICAgICAgICAgc3ViQXNzZXRzOiB7fSxcbiAgICAgICAgICAgIHJlYWRvbmx5OiBkYkluZm8ucmVhZG9ubHksXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGluZm87XG4gICAgfVxuXG4gICAgcXVlcnlVcmwodXVpZE9yUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdXVpZE9yUGF0aCB8fCB0eXBlb2YgdXVpZE9yUGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncGFyYW1ldGVyIGVycm9yJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub3JtYWxpemVkVXJsID0gcGF0aFRvRGJVcmxJZkFzc2V0REJQYXRoKHV1aWRPclBhdGgsIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvKTtcbiAgICAgICAgaWYgKCF1dWlkT3JQYXRoLnN0YXJ0c1dpdGgoJ2RiOi8vJykgJiYgbm9ybWFsaXplZFVybC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICBjb25zdCBkYk5hbWUgPSBub3JtYWxpemVkVXJsLnNsaWNlKCdkYjovLycubGVuZ3RoKS5zcGxpdCgnLycsIDEpWzBdO1xuICAgICAgICAgICAgaWYgKGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXBbZGJOYW1lXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVkVXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qC56Lev5b6EIC9hc3NldHMsIC9pbnRlcm5hbCDlr7nlupTnmoQgdXJsIOaooeaLn+aVsOaNrlxuICAgICAgICBjb25zdCBuYW1lID0gdXVpZE9yUGF0aC5zdWJzdHIoYXNzZXRDb25maWcuZGF0YS5yb290Lmxlbmd0aCArIDEpO1xuICAgICAgICBpZiAoYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuIGBkYjovLyR7bmFtZX1gO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXN1bHQgPSBxdWVyeVVybCh1dWlkT3JQYXRoKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICB1dWlkT3JQYXRoID0gdXVpZE9yUGF0aC5yZXBsYWNlQWxsKCcvJywgcGF0aC5zZXApO1xuICAgICAgICByZXR1cm4gcXVlcnlVcmwodXVpZE9yUGF0aCk7XG4gICAgfVxuXG4gICAgcXVlcnlQYXRoKHVybE9yVXVpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF1cmxPclV1aWQgfHwgdHlwZW9mIHVybE9yVXVpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICB1cmxPclV1aWQgPSBwYXRoVG9EYlVybElmQXNzZXREQlBhdGgodXJsT3JVdWlkLCBhc3NldERCTWFuYWdlci5hc3NldERCSW5mbyk7XG4gICAgICAgIGlmICh1cmxPclV1aWQuc3RhcnRzV2l0aCgnZGI6Ly8nKSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHVybE9yVXVpZC5zdWJzdHIoNSk7XG4gICAgICAgICAgICBpZiAoYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldERCTWFuYWdlci5hc3NldERCTWFwW25hbWVdLm9wdGlvbnMudGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHVybDJ1dWlkKHVybE9yVXVpZCk7XG4gICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeVBhdGgodXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHF1ZXJ5UGF0aCh1cmxPclV1aWQpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQXZhaWxhYmxlVVJMKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF1cmwgfHwgdHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXRoID0gcXVlcnlQYXRoKHVybCk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9IGVsc2UgaWYgKCFleGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld1BhdGggPSB1dGlscy5GaWxlLmdldE5hbWUocGF0aCk7XG4gICAgICAgIHJldHVybiBxdWVyeVVybChuZXdQYXRoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFzc2V0UXVlcnkgPSBuZXcgQXNzZXRRdWVyeU1hbmFnZXIoKTtcblxuLy8g5YWB6K645L2/55So5YWo5bGA5Y+Y6YeP5Y675p+l6K+iIGRiIOeahOS4gOS6m+aVsOaNruS/oeaBr1xuaWYgKCFnbG9iYWxUaGlzLmFzc2V0UXVlcnkpIHtcbiAgICBnbG9iYWxUaGlzLmFzc2V0UXVlcnkgPSBhc3NldFF1ZXJ5O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3NldFF1ZXJ5O1xuXG4vLyDmoLnmja7otYTmupDnsbvlnovnrZvpgIlcbmNvbnN0IFRZUEVTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7XG4gICAgc2NyaXB0czogWycuanMnLCAnLnRzJ10sXG4gICAgc2NlbmU6IFsnLnNjZW5lJ10sXG4gICAgZWZmZWN0OiBbJy5lZmZlY3QnXSxcbiAgICBpbWFnZTogWycuanBnJywgJy5wbmcnLCAnLmpwZWcnLCAnLndlYnAnLCAnLnRnYSddLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNlYXJjaEFzc2V0cyhmaWx0ZXJIYW5kbGVySW5mb3M6IEZpbHRlckhhbmRsZXJJbmZvW10sIGFzc2V0czogSUFzc2V0W10sIHJlc3VsdEFzc2V0czogSUFzc2V0W10gPSBbXSkge1xuICAgIGlmICghZmlsdGVySGFuZGxlckluZm9zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gYXNzZXRzO1xuICAgIH1cbiAgICBhc3NldHMuZm9yRWFjaCgoYXNzZXQ6IEFzc2V0IHwgVmlydHVhbEFzc2V0KSA9PiB7XG4gICAgICAgIGlmIChhc3NldC5zdWJBc3NldHMgJiYgT2JqZWN0LmtleXMoYXNzZXQuc3ViQXNzZXRzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzZWFyY2hBc3NldHMoXG4gICAgICAgICAgICAgICAgZmlsdGVySGFuZGxlckluZm9zLFxuICAgICAgICAgICAgICAgIE9iamVjdC52YWx1ZXMoYXNzZXQuc3ViQXNzZXRzKSxcbiAgICAgICAgICAgICAgICByZXN1bHRBc3NldHMsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVuTWF0Y2ggPSBmaWx0ZXJIYW5kbGVySW5mb3Muc29tZSgoZmlsdGVySGFuZGxlckluZm8pID0+IHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJIYW5kbGVySW5mby52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICFmaWx0ZXJIYW5kbGVySW5mby5oYW5kbGVyKGZpbHRlckhhbmRsZXJJbmZvLnZhbHVlLCBhc3NldCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXVuTWF0Y2gpIHtcbiAgICAgICAgICAgIHJlc3VsdEFzc2V0cy5wdXNoKGFzc2V0KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdEFzc2V0cztcbn1cblxuZnVuY3Rpb24gZmlsdGVyVXNlckRhdGFJbmZvKHVzZXJEYXRhRmlsdGVyczogUmVjb3JkPHN0cmluZywgYW55PiwgYXNzZXQ6IElBc3NldCkge1xuICAgIHJldHVybiAhT2JqZWN0LmtleXModXNlckRhdGFGaWx0ZXJzKS5zb21lKChrZXkpID0+IHVzZXJEYXRhRmlsdGVyc1trZXldICE9PSBhc3NldC5tZXRhLnVzZXJEYXRhW2tleV0pO1xufVxuXG5pbnRlcmZhY2UgRmlsdGVySGFuZGxlckluZm8ge1xuICAgIG5hbWU6IGtleW9mIFF1ZXJ5QXNzZXRzT3B0aW9uO1xuICAgIC8vIOWunumZheeahOWkhOeQhuaWueazlVxuICAgIGhhbmRsZXI6ICh2YWx1ZTogYW55LCBhc3NldHM6IElBc3NldCkgPT4gYm9vbGVhbjtcbiAgICAvLyDlr7nov4fmu6TmlbDmja7ov5vooYzovazmjaLmo4Dmn6XvvIzov5Tlm54gbnVsbCDooajnpLrlvZPliY3mlbDmja7ml6DmlYhcbiAgICByZXNvbHZlPzogKHZhbHVlOiBhbnkpID0+IGFueSB8IHVuZGVmaW5lZDtcbiAgICB2YWx1ZT86IGFueTtcbn1cblxuY29uc3QgRmlsdGVySGFuZGxlckluZm9zOiBGaWx0ZXJIYW5kbGVySW5mb1tdID0gW3tcbiAgICBuYW1lOiAnY2NUeXBlJyxcbiAgICBoYW5kbGVyOiAoY2NUeXBlczogc3RyaW5nW10sIGFzc2V0OiBJQXNzZXQpID0+IHtcbiAgICAgICAgcmV0dXJuIGNjVHlwZXMuaW5jbHVkZXMoYXNzZXRRdWVyeS5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsICd0eXBlJykpO1xuICAgIH0sXG4gICAgcmVzb2x2ZTogKHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3ZhbHVlLnRyaW0oKV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxufSwge1xuICAgIG5hbWU6ICdwYXR0ZXJuJyxcbiAgICBoYW5kbGVyOiAodmFsdWU6IHN0cmluZywgYXNzZXQpID0+IHtcbiAgICAgICAgY29uc3QgbG9hZFVybCA9IGFzc2V0UXVlcnkucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAnbG9hZFVybCcpO1xuICAgICAgICBjb25zdCB1cmwgPSBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3VybCcpO1xuICAgICAgICByZXR1cm4gbWluaW1hdGNoKGxvYWRVcmwsIHZhbHVlKSB8fCBtaW5pbWF0Y2godXJsLCB2YWx1ZSk7XG4gICAgfSxcbiAgICByZXNvbHZlOiAodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiB1bmRlZmluZWQ7XG4gICAgfSxcbn0sIHtcbiAgICBuYW1lOiAnaW1wb3J0ZXInLFxuICAgIGhhbmRsZXI6IChpbXBvcnRlcnM6IHN0cmluZ1tdLCBhc3NldCkgPT4ge1xuICAgICAgICByZXR1cm4gaW1wb3J0ZXJzLmluY2x1ZGVzKGFzc2V0Lm1ldGEuaW1wb3J0ZXIpO1xuICAgIH0sXG4gICAgcmVzb2x2ZTogKHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3ZhbHVlLnRyaW0oKV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxufSwge1xuICAgIG5hbWU6ICdpc0J1bmRsZScsXG4gICAgaGFuZGxlcjogKHZhbHVlOiBib29sZWFuLCBhc3NldCkgPT4ge1xuICAgICAgICByZXR1cm4gKCEhYXNzZXRRdWVyeS5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsICdpc0J1bmRsZScpKSA9PT0gdmFsdWU7XG4gICAgfSxcbn0sIHtcbiAgICBuYW1lOiAnZXh0bmFtZScsXG4gICAgaGFuZGxlcjogKGV4dGVuc2lvbk5hbWVzOiBzdHJpbmdbXSwgYXNzZXQpID0+IHtcbiAgICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZXh0bmFtZShhc3NldC5zb3VyY2UpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChleHRlbnNpb25OYW1lcy5pbmNsdWRlcyhleHRlbnNpb24pICYmICEvXFwuZFxcLnRzJC8udGVzdChhc3NldC5zb3VyY2UpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICByZXNvbHZlKHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIFt2YWx1ZS50cmltKCkudG9Mb2NhbGVMb3dlckNhc2UoKV07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5tYXAobmFtZSA9PiBuYW1lLnRyaW0oKS50b0xvY2FsZUxvd2VyQ2FzZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG59LCB7XG4gICAgbmFtZTogJ3VzZXJEYXRhJyxcbiAgICBoYW5kbGVyOiAodmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIGFzc2V0KSA9PiB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJVc2VyRGF0YUluZm8odmFsdWUsIGFzc2V0KTtcbiAgICB9LFxufSwge1xuICAgIG5hbWU6ICd0eXBlJyxcbiAgICBoYW5kbGVyOiAodHlwZXM6IHN0cmluZ1tdLCBhc3NldCkgPT4ge1xuICAgICAgICByZXR1cm4gdHlwZXMuaW5jbHVkZXMoZXh0bmFtZShhc3NldC5zb3VyY2UpKSAmJiAhL1xcLmRcXC50cyQvLnRlc3QoYXNzZXQuc291cmNlKTtcbiAgICB9LFxuICAgIHJlc29sdmU6ICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHR5cGVzID0gVFlQRVNbdmFsdWVdO1xuICAgICAgICBpZiAoIXR5cGVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKGkxOG4udCgnYXNzZXRzLmRlcHJlY2F0ZWRfdGlwJywge1xuICAgICAgICAgICAgb2xkTmFtZTogJ29wdGlvbnMudHlwZScsXG4gICAgICAgICAgICBuZXdOYW1lOiAnb3B0aW9ucy5jY1R5cGUnLFxuICAgICAgICAgICAgdmVyc2lvbjogJzMuOC4wJyxcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gdHlwZXM7XG4gICAgfSxcbn1dO1xuIl19