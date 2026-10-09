"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundle = void 0;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");
const utils_1 = require("../../utils");
const bundle_1 = require("../../utils/bundle");
const zip_1 = require("../../utils/zip");
const cconb_1 = require("../../utils/cconb");
const fast_glob_1 = __importDefault(require("fast-glob"));
const asset_1 = __importDefault(require("../../../../../assets/manager/asset"));
const utils_2 = require("./utils");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
const utils_3 = __importDefault(require("../../../../../base/utils"));
const global_1 = require("../../../../share/global");
class Bundle {
    get scenes() {
        return Array.from(Object.values(this._scenes)).sort();
    }
    get assets() {
        return Array.from(this._assets).sort();
    }
    get assetsWithoutRedirect() {
        return this.assets.filter((x) => !this.getRedirect(x));
    }
    get scripts() {
        return Array.from(this._scripts).sort();
    }
    get rootAssets() {
        return Array.from(this._rootAssets);
    }
    get isSubpackage() {
        return this.compressionType === bundle_utils_1.BundleCompressionTypes.SUBPACKAGE;
    }
    root = ''; // bundle 的根目录, 开发者勾选的目录，如果是 main 包，这个字段为 ''
    dest = ''; // bundle 的输出目录
    importBase = global_1.BuildGlobalInfo.IMPORT_HEADER;
    nativeBase = global_1.BuildGlobalInfo.NATIVE_HEADER;
    scriptDest = ''; // 脚本的输出地址
    name = ''; // bundle 的名称
    priority = 0; // bundle 的优先级
    compressionType = bundle_utils_1.BundleCompressionTypes.MERGE_DEP; // bundle 的压缩类型
    assetVer = { import: {}, native: {} };
    zipVer = ''; // Zip 压缩模式，压缩包的版本
    version = ''; // bundle 的版本信息
    isRemote = false; // bundle 是否是远程包
    isZip = false; // bundle 是否是 zip 包，即使压缩类型设置为 zip，也不一定是 zip 包
    redirect = {};
    deps = new Set();
    groups = [];
    bundleFilterConfig;
    output;
    hasPreloadScript = true;
    extensionMap = {};
    packs = {};
    paths = {};
    md5Cache = false;
    debug = false;
    // TODO 废弃 bundle 的 config 结构，输出 config 时即时整理即可
    config = {
        importBase: global_1.BuildGlobalInfo.IMPORT_HEADER,
        nativeBase: global_1.BuildGlobalInfo.NATIVE_HEADER,
        name: '',
        deps: [],
        uuids: [],
        paths: {},
        scenes: {},
        packs: {},
        versions: { import: [], native: [] },
        redirect: [],
        debug: false,
        extensionMap: {},
        hasPreloadScript: true,
        dependencyRelationships: {},
    };
    configOutPutName = '';
    atlasRes = {
        // 存储 texture/sprite/atlas 和 image 的对应关系
        assetsToImage: {},
        imageToAtlas: {},
        atlasToImages: {},
    };
    // 存储纹理压缩 image uuid 与对应的纹理资源地址
    compressRes = {};
    _rootAssets = new Set(); // 该 bundle 直接包含的资源
    _scenes = {};
    _scripts = new Set();
    // 除脚本、图片以外的资源 uuid 合集
    _assets = new Set();
    compressTask = {};
    _jsonAsset = new Set();
    _cconAsset = new Set();
    _pacAssets = new Set();
    constructor(options) {
        this.root = options.root;
        this.name = options.name;
        this.dest = options.dest;
        this.md5Cache = options.md5Cache;
        this.debug = options.debug;
        this.priority = options.priority;
        this.compressionType = options.compressionType;
        this.isRemote = options.isRemote;
        this.scriptDest = options.scriptDest;
        this.bundleFilterConfig = (0, utils_2.initBundleConfig)(options.bundleFilterConfig);
        this.output = options.output ?? true;
    }
    /**
     * 添加根资源，此方法会递归添加子资源的数据支持普通资源与脚本资源
     * @param asset
     * @returns
     */
    addRootAsset(asset) {
        if (!asset) {
            return;
        }
        (0, utils_1.recursively)(asset, (asset) => {
            const assetType = asset_1.default.queryAssetProperty(asset, 'type');
            if (assetType === 'cc.Script') {
                this.addScript(asset);
                return;
            }
            if (asset.meta?.files && !asset.meta.files.includes('.json') && !(0, cconb_1.hasCCONFormatAssetInLibrary)(asset)) {
                return;
            }
            const canAdd = (0, bundle_1.checkAssetWithFilterConfig)(asset, this.bundleFilterConfig);
            if (!canAdd) {
                // root asset 根据 bundle 配置的正常剔除行为，无需警告，打印记录即可
                console.debug(`asset {asset(${asset.url})} can not match the bundler filter config(${this.name})`);
                return;
            }
            this._rootAssets.add(asset.uuid);
            this.addAsset(asset);
        });
    }
    /**
     * 添加参与 Bundle 打包的脚本资源，最终输出到 index.js 内
     * 需要提前判断脚本资源类型
     * @param asset
     * @returns
     */
    addScript(asset) {
        if (!asset || this._scripts.has(asset.uuid)) {
            return;
        }
        // hack 过滤特殊的声明文件
        if (asset.url.toLowerCase().endsWith('.d.ts')) {
            return;
        }
        if (!asset.meta.userData.isPlugin) {
            this._scripts.add(asset.uuid);
        }
    }
    /**
     * 添加一个资源到该 bundle 中
     */
    addAsset(asset) {
        if (!asset || this._assets.has(asset.uuid)) {
            return;
        }
        if (asset.meta.files.includes('.json')) {
            this._jsonAsset.add(asset.uuid);
        }
        if ((0, cconb_1.hasCCONFormatAssetInLibrary)(asset)) {
            this._cconAsset.add(asset.uuid);
        }
        const assetType = asset_1.default.queryAssetProperty(asset, 'type');
        switch (assetType) {
            case 'cc.Script':
                this.addScript(asset);
                return;
            case 'cc.SceneAsset':
                this._scenes[asset.uuid] = {
                    uuid: asset.uuid,
                    url: asset.url,
                };
                this._assets.add(asset.uuid);
                return;
            default:
                this._assets.add(asset.uuid);
        }
    }
    removeAsset(assetUuid) {
        if (!assetUuid) {
            return;
        }
        this._assets.delete(assetUuid);
        this._rootAssets.delete(assetUuid);
        delete this._scenes[assetUuid];
        this._jsonAsset.delete(assetUuid);
        this._scripts.delete(assetUuid);
        delete this.redirect[assetUuid];
        this.removeFromGroups(assetUuid);
        delete this.compressTask[assetUuid];
        delete this.compressRes[assetUuid];
    }
    addRedirect(uuid, redirect) {
        if (!uuid) {
            return;
        }
        this.redirect[uuid] = redirect;
        this.deps.add(redirect);
        this.addAssetWithUuid(uuid);
    }
    addScriptWithUuid(asset) {
        this._scripts.add(asset);
    }
    /**
     * 类似图集等资源的 uuid 可能没有 asset info
     * @param asset
     */
    addAssetWithUuid(asset) {
        this._assets.add(asset);
    }
    getRedirect(uuid) {
        return this.redirect[uuid];
    }
    addGroup(type, uuids, name = '') {
        this.groups.push({ type, uuids, name });
    }
    addToGroup(type, uuid) {
        const group = this.groups.find((item) => item.type === type);
        if (group) {
            group.uuids.push(uuid);
        }
        else {
            this.addGroup(type, [uuid]);
        }
    }
    removeFromGroups(uuid) {
        this.groups.forEach((group) => {
            cc.js.array.fastRemove(group.uuids, uuid);
        });
        this.groups = this.groups.filter((group) => group.uuids.length > 1);
    }
    /**
     * 初始化 bundle 的 config 数据
     */
    initConfig() {
        this.config.importBase = this.importBase;
        this.config.nativeBase = this.nativeBase;
        this.config.name = this.name;
        this.config.debug = this.debug;
        this.config.hasPreloadScript = this.hasPreloadScript;
        this.config.deps = Array.from(this.deps).sort();
        this.config.uuids = this.assets.sort();
        const redirect = this.config.redirect = [];
        const uuids = Object.keys(this.redirect).sort();
        for (const uuid of uuids) {
            redirect.push(uuid, String(this.config.deps.indexOf(this.redirect[uuid])));
        }
        this.scenes.forEach((sceneItem) => {
            this.config.scenes[sceneItem.url] = sceneItem.uuid;
        });
    }
    async initAssetPaths() {
        // HACK internal bundle 是引擎自身引用的资源，不需要支持 paths 动态加载
        // if (this.name === BuiltinBundleName.INTERNAL) {
        //     return;
        // }
        // 整理 Bundle 根资源的加载路径
        const urlCollect = {};
        // 先去重一次
        this.rootAssets.forEach((uuid) => {
            const asset = asset_library_1.buildAssetLibrary.getAssetInfo(uuid);
            const info = [asset.loadUrl.replace(this.root + '/', '').replace((0, path_1.extname)(asset.url), ''), asset.type];
            // 内置资源不做此警告提示
            this.name !== bundle_utils_1.BuiltinBundleName.INTERNAL && checkUrl(asset.uuid, info[0], info[1]);
            // 作为判断是否为子资源的标识符，子资源需要加标记 1
            if (!(asset instanceof asset_db_1.Asset)) {
                info.push(1);
            }
            this.config.paths[asset.uuid] = info;
        });
        function checkUrl(uuid, url, type) {
            if (!urlCollect[url]) {
                urlCollect[url] = {};
            }
            if (!urlCollect[url][type]) {
                urlCollect[url][type] = uuid;
            }
            // 同名，同类型 url
            const existUuid = urlCollect[url][type];
            if (existUuid === uuid) {
                return;
            }
            const assetA = asset_library_1.buildAssetLibrary.getAsset(existUuid);
            const assetB = asset_library_1.buildAssetLibrary.getAsset(uuid);
            console.warn(i18n_1.default.t('builder.warn.same_load_url', {
                urlA: `{asset(${assetA.url})} uuid: ${existUuid}`,
                urlB: `{asset(${assetB.url})} uuid: ${uuid}`,
                url,
            }));
        }
        // Note: dependencyRelationships 引擎尚未支持，无需写入
        // 并且由于预览不加载脚本并且场景 prefab 的依赖信息目前无法脱离反序列化流程等原因，无法在预览阶段获取完整依赖，如需开放此功能需要这两处问题解决后
        // for (const uuid of this.assetsWithoutRedirect) {
        //     const depends = await buildAssetLibrary.getDependUuids(uuid);
        //     depends.length && (this.config.dependencyRelationships[uuid] = depends);
        // }
    }
    async outputConfigs() {
        if (!this.output) {
            return;
        }
        if (this.isZip) {
            this.config.isZip = true;
            this.config.zipVersion = this.zipVer;
        }
        console.debug(`output config of bundle ${this.name}`);
        let outputPath = (0, path_1.join)(this.dest, (this.configOutPutName || (0, path_1.parse)(global_1.BuildGlobalInfo.CONFIG_NAME).name) + '.json');
        if (this.version) {
            outputPath = (0, path_1.join)(this.dest, `${this.configOutPutName || (0, path_1.parse)(global_1.BuildGlobalInfo.CONFIG_NAME).name}.${this.version}.json`);
        }
        const content = JSON.stringify(this.config, null, this.config.debug ? 4 : 0);
        (0, fs_extra_1.outputFileSync)(outputPath, content, 'utf8');
        console.debug(`output config of bundle ${this.name} success`);
    }
    async build() {
        // 重新整理一次 config 避免漏掉一些后续流程新增的数据
        await this.initConfig();
        await this.genPackedAssetsConfig();
        if (this.md5Cache) {
            await this.createAssetsMd5();
            await this.compress();
            await this.zipBundle();
            await this.md5Bundle();
            await this.outputConfigs();
        }
        else {
            await this.compress();
            await this.zipBundle();
            await this.outputConfigs();
        }
    }
    async md5Bundle() {
        if (!this.md5Cache) {
            return;
        }
        const hash = (0, utils_1.calcMd5)([JSON.stringify(this.config), (0, fs_extra_1.readFileSync)(this.scriptDest)]);
        if (!this.isSubpackage) {
            const newName = (0, path_1.join)((0, path_1.dirname)(this.scriptDest), `${(0, path_1.parse)(this.scriptDest).name}.${hash}${(0, path_1.extname)(this.scriptDest)}`);
            (0, fs_extra_1.renameSync)(this.scriptDest, newName);
            this.scriptDest = newName;
        }
        this.version = hash;
        if (this.isZip) {
            const zipPath = (0, path_1.join)(this.dest, global_1.BuildGlobalInfo.BUNDLE_ZIP_NAME);
            if ((0, fs_extra_1.existsSync)(zipPath)) {
                const res = await (0, utils_1.appendMd5ToPaths)([zipPath]);
                if (res) {
                    this.zipVer = res.hash;
                }
            }
        }
    }
    /**
     * 对 bundle 内的资源文件进行 md5 处理
     * @returns
     */
    async createAssetsMd5() {
        if (!this.md5Cache || this.isZip) {
            return;
        }
        this.assetVer.import = {};
        this.assetVer.native = {};
        if (!this.assets.length) {
            return;
        }
        console.debug(`add md5 to bundle ${this.name}...`);
        // 先收集每个 uuid 下对应的多个路径
        const suffixMap = {
            native: {},
            import: {},
        };
        const fontPaths = [];
        const importPaths = await (0, fast_glob_1.default)('**', { cwd: (0, path_1.join)(this.dest, this.importBase), absolute: true });
        for (let i = 0; i < importPaths.length; i++) {
            const filePath = importPaths[i];
            const uuid = (0, utils_1.getUuidFromPath)(filePath);
            if (!suffixMap.import[uuid]) {
                suffixMap.import[uuid] = [];
            }
            suffixMap.import[uuid].push(filePath);
        }
        const nativePaths = await (0, fast_glob_1.default)('**', { cwd: (0, path_1.join)(this.dest, this.nativeBase), absolute: true });
        for (let i = 0; i < nativePaths.length; i++) {
            const filePath = nativePaths[i];
            const uuid = (0, utils_1.getUuidFromPath)(filePath);
            if (!suffixMap.native[uuid]) {
                suffixMap.native[uuid] = [];
            }
            // ttf 字体类型路径需要单独提取出来特殊处理,只对文件夹做 hash 值处理
            if ((0, path_1.basename)((0, path_1.dirname)(filePath)) === uuid) {
                fontPaths.push(filePath);
                continue;
            }
            suffixMap.native[uuid].push(filePath);
        }
        for (const uuid in suffixMap.import) {
            const res = await (0, utils_1.appendMd5ToPaths)(suffixMap.import[uuid]);
            if (!res) {
                continue;
            }
            this.assetVer.import[uuid] = res.hash;
        }
        for (const uuid in suffixMap.native) {
            const res = await (0, utils_1.appendMd5ToPaths)(suffixMap.native[uuid]);
            if (!res) {
                continue;
            }
            this.assetVer.native[uuid] = res.hash;
        }
        for (let i = 0; i < fontPaths.length; i++) {
            const path = fontPaths[i];
            try {
                const hash = (0, utils_1.calcMd5)((0, fs_extra_1.readFileSync)(path));
                const uuid = (0, utils_1.getUuidFromPath)(path);
                (0, fs_extra_1.renameSync)((0, path_1.dirname)(path), (0, path_1.dirname)(path) + `.${hash}`);
                this.assetVer.native[uuid] = hash;
            }
            catch (error) {
                console.error(error);
            }
        }
        // 填充 md5 数据
        const importUUids = Object.keys(this.assetVer.import).sort();
        for (const uuid of importUUids) {
            if (!this.config.uuids.includes(uuid)) {
                // 做一层校验报错，避免在运行时才暴露混淆排查
                console.error(`Can not find import asset(${uuid}) in bundle ${this.root}.`);
                this.config.uuids.push(uuid);
            }
            this.config.versions.import.push(uuid, this.assetVer.import[uuid]);
        }
        const nativeUUids = Object.keys(this.assetVer.native).sort();
        for (const uuid of nativeUUids) {
            if (!this.config.uuids.includes(uuid)) {
                // 做一层校验报错，避免在运行时才暴露混淆排查
                console.error(`Can not find native asset(${uuid}) in bundle ${this.root}.`);
                this.config.uuids.push(uuid);
            }
            this.config.versions.native.push(uuid, this.assetVer.native[uuid]);
        }
        console.debug(`add md5 to bundle ${this.name} success`);
    }
    async zipBundle() {
        if (this.compressionType !== bundle_utils_1.BundleCompressionTypes.ZIP || !this.output) {
            return;
        }
        console.debug(`zip bundle ${this.name}...`);
        const dest = this.dest;
        const nativeDir = (0, path_1.join)(dest, this.nativeBase);
        const importDir = (0, path_1.join)(dest, this.importBase);
        const dirsToCompress = [nativeDir, importDir].filter(dir => (0, fs_extra_1.existsSync)(dir));
        if (dirsToCompress.length > 0) {
            this.isZip = true;
            await (0, zip_1.compressDirs)(dirsToCompress, dest, (0, path_1.join)(dest, global_1.BuildGlobalInfo.BUNDLE_ZIP_NAME));
        }
        console.debug(`zip bundle ${this.name} success...`);
    }
    compress() {
        if (this.debug) {
            return;
        }
        console.debug(`compress config of bundle ${this.name}...`);
        function collectUuids(config) {
            const uuidCount = {};
            const uuidIndices = {};
            function addUuid(uuid) {
                const count = (uuidCount[uuid] || 0) + 1;
                uuidCount[uuid] = count;
                if (!(uuid in uuidIndices)) {
                    uuidIndices[uuid] = uuid;
                }
            }
            const paths = config.paths;
            for (const path in paths) {
                addUuid(path);
            }
            const scenes = config.scenes;
            for (const name in scenes) {
                addUuid(scenes[name]);
            }
            for (const extName in config.extensionMap) {
                config.extensionMap[extName].forEach(addUuid);
            }
            const packIds = Object.keys(config.packs).sort();
            const sortedPackAssets = {};
            for (const packId of packIds) {
                config.packs[packId].forEach(addUuid);
                sortedPackAssets[packId] = config.packs[packId];
            }
            config.packs = sortedPackAssets;
            const versions = config.versions;
            for (const entries of Object.values(versions)) {
                for (let i = 0; i < entries.length; i += 2) {
                    addUuid(entries[i]);
                }
            }
            const redirect = config.redirect;
            for (let i = 0; i < redirect.length; i += 2) {
                addUuid(redirect[i]);
            }
            // sort by reference count
            config.uuids.sort((a, b) => uuidCount[b] - uuidCount[a]);
            config.uuids.forEach((uuid, index) => uuidIndices[uuid] = index);
            config.uuids = config.uuids.map((uuid) => utils_3.default.UUID.compressUUID(uuid, true));
            return uuidIndices;
        }
        const config = this.config;
        const uuidIndices = collectUuids(config);
        const paths = config.paths;
        const newPaths = config.paths = {};
        const types = config.types = [];
        for (const uuid in paths) {
            const entry = paths[uuid];
            const index = uuidIndices[uuid];
            let typeIndex = types.indexOf(entry[1]);
            if (typeIndex === -1) {
                typeIndex = types.length;
                types.push(entry[1]);
            }
            entry[1] = typeIndex;
            newPaths[index] = entry;
        }
        // 引擎尚未对接使用 https://github.com/cocos/3d-tasks/issues/16152
        // const newDependencyRelationships: Record<string, Array<string | number>> = {};
        // for (const uuid in config.dependencyRelationships) {
        //     let depends: Array<string | number> = config.dependencyRelationships[uuid];
        //     const index = uuidIndices[uuid] ?? utils.string.compressUUID(uuid, true);
        //     depends = depends.map((uuid) => uuidIndices[uuid] ?? utils.string.compressUUID(uuid as string, true));
        //     newDependencyRelationships[index] = depends;
        // }
        // config.dependencyRelationships = newDependencyRelationships;
        const scenes = config.scenes;
        for (const name in scenes) {
            const scene = scenes[name];
            const uuidIndex = uuidIndices[scene];
            scenes[name] = Number(uuidIndex);
        }
        for (const extName in config.extensionMap) {
            const uuids = config.extensionMap[extName];
            for (let i = 0; i < uuids.length; ++i) {
                const uuidIndex = uuidIndices[uuids[i]];
                uuids[i] = uuidIndex;
            }
            uuids.sort();
        }
        const packedAssets = config.packs;
        for (const packId in packedAssets) {
            const packedIds = packedAssets[packId];
            for (let i = 0; i < packedIds.length; ++i) {
                const uuidIndex = uuidIndices[packedIds[i]];
                packedIds[i] = uuidIndex;
            }
        }
        const redirect = config.redirect;
        for (let i = 0; i < redirect.length; i += 2) {
            const uuidIndex = uuidIndices[redirect[i]];
            redirect[i] = Number(uuidIndex);
        }
        if (!this.debug) {
            const versions = this.config.versions;
            for (const entries of Object.values(versions)) {
                for (let i = 0; i < entries.length; i += 2) {
                    const uuidIndex = uuidIndices[entries[i]];
                    entries[i] = Number(uuidIndex);
                }
            }
        }
        console.debug(`compress config of bundle ${this.name} success`);
    }
    /**
     * 整理 JSON 分组以及资源路径数据到 config 内
     */
    async genPackedAssetsConfig() {
        // 重新计算一次，中间过程可能会新增数据
        this.config.uuids = this.assets.sort();
        const redirect = this.config.redirect = [];
        const uuids = Object.keys(this.redirect).sort();
        for (const uuid of uuids) {
            redirect.push(uuid, String(this.config.deps.indexOf(this.redirect[uuid])));
        }
        Object.keys(this.config.extensionMap).forEach((key) => {
            this.config.extensionMap[key].sort();
        });
        // group 里的数据转换成 packedAssets 数据
        const usedUuids = [];
        for (const group of this.groups) {
            if (!group.name) {
                continue;
            }
            if (group.uuids.length === 0) {
                continue;
            }
            // 这里的 uuids 不能排序，在 json 分组生成阶段就需要确定，group.uuids 需要用做数据查询，config.packs 后续会压缩，需要深拷贝
            this.config.packs[group.name] = JSON.parse(JSON.stringify(group.uuids));
            group.uuids.forEach((uuid) => {
                usedUuids.push(uuid);
            });
        }
        // 需要在比较晚期的时候进行，因为有些图集相关资源可能因为不同的配置选项过滤移出 Bundle
        await this.initAssetPaths();
    }
    /**
     * 指定的 uuid 资源是否包含在构建资源中
     * @param deep 是否深度查找，指定 uuid 的关联资源存在即视为存在 Bundle 包含该资源，例如未生成图集序列化资源但是合图 Image 存在的情况
     */
    containsAsset(uuid, deep = false) {
        return this._scripts.has(uuid)
            || this._assets.has(uuid)
            || !!this._scenes[uuid]
            || (deep ? !!(this.atlasRes.atlasToImages[uuid] && this.atlasRes.atlasToImages[uuid].length) : false);
    }
}
exports.Bundle = Bundle;
