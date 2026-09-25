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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci9hc3NldC1oYW5kbGVyL2J1bmRsZS9idW5kbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsOENBQXNEO0FBQ3RELHVDQUEwRjtBQUMxRiwrQkFBK0Q7QUFDL0QsaUVBQTJGO0FBQzNGLCtEQUFnRTtBQUNoRSx1Q0FBc0Y7QUFDdEYsK0NBQWdFO0FBQ2hFLHlDQUErQztBQUMvQyw2Q0FBZ0U7QUFDaEUsMERBQTJCO0FBRzNCLGdGQUErRDtBQUUvRCxtQ0FBMkM7QUFDM0Msb0VBQTRDO0FBQzVDLHNFQUE4QztBQUM5QyxxREFBMkQ7QUFDM0QsTUFBYSxNQUFNO0lBRWYsSUFBVyxNQUFNO1FBQ2IsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVELElBQVcsTUFBTTtRQUNiLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0MsQ0FBQztJQUVELElBQVcscUJBQXFCO1FBQzVCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxJQUFXLE9BQU87UUFDZCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFRCxJQUFXLFVBQVU7UUFDakIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENB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QUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN2QyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6QixTQUFTO1lBQ2IsQ0FBQztZQUNELFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsd0JBQWdCLEVBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDUCxTQUFTO1lBQ2IsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDMUMsQ0FBQztRQUNELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2xDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSx3QkFBZ0IsRUFBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNQLFNBQVM7WUFDYixDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztRQUMxQyxDQUFDO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4QyxNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBTyxFQUFDLElBQUEsdUJBQVksRUFBQyxJ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QUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlHLENBQUM7Q0FFSjtBQTNvQkQsd0JBMm9CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCByZW5hbWVTeW5jLCBvdXRwdXRGaWxlU3luYywgZXhpc3RzU3luYywgZW1wdHlEaXIgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZGlybmFtZSwgZXh0bmFtZSwgam9pbiwgcGFyc2UgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJ1aWx0aW5CdW5kbGVOYW1lLCBCdW5kbGVDb21wcmVzc2lvblR5cGVzIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvYnVuZGxlLXV0aWxzJztcbmltcG9ydCB7IGJ1aWxkQXNzZXRMaWJyYXJ5IH0gZnJvbSAnLi4vLi4vbWFuYWdlci9hc3NldC1saWJyYXJ5JztcbmltcG9ydCB7IHJlY3Vyc2l2ZWx5LCBnZXRVdWlkRnJvbVBhdGgsIGFwcGVuZE1kNVRvUGF0aHMsIGNhbGNNZDUgfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyBjaGVja0Fzc2V0V2l0aEZpbHRlckNvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL2J1bmRsZSc7XG5pbXBvcnQgeyBjb21wcmVzc0RpcnMgfSBmcm9tICcuLi8uLi91dGlscy96aXAnO1xuaW1wb3J0IHsgaGFzQ0NPTkZvcm1hdEFzc2V0SW5MaWJyYXJ5IH0gZnJvbSAnLi4vLi4vdXRpbHMvY2NvbmInO1xuaW1wb3J0IGZnIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgeyBCdW5kbGVDb21wcmVzc2lvblR5cGUsIEJ1bmRsZUZpbHRlckNvbmZpZywgSUJ1bmRsZUNvbmZpZywgSUJ1aWxkU2NlbmVJdGVtIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzJztcbmltcG9ydCB7IElWZXJzaW9uTWFwLCBJR3JvdXAsIElBdGxhc1Jlc3VsdCwgSUltYWdlVGFza0luZm8sIElCdW5kbGVJbml0T3B0aW9ucywgSUpTT05Hcm91cFR5cGUsIElTdWZmaXhNYXAgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBhc3NldE1hbmFnZXIgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXNzZXRzL21hbmFnZXIvYXNzZXQnO1xuaW1wb3J0IHsgSUFzc2V0IH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXNzZXRzL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgaW5pdEJ1bmRsZUNvbmZpZyB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYmFzZS9pMThuJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IEJ1aWxkR2xvYmFsSW5mbyB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlL2dsb2JhbCc7XG5leHBvcnQgY2xhc3MgQnVuZGxlIHtcblxuICAgIHB1YmxpYyBnZXQgc2NlbmVzKCkge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShPYmplY3QudmFsdWVzKHRoaXMuX3NjZW5lcykpLnNvcnQoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFzc2V0cygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fYXNzZXRzKS5zb3J0KCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhc3NldHNXaXRob3V0UmVkaXJlY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzc2V0cy5maWx0ZXIoKHgpID0+ICF0aGlzLmdldFJlZGlyZWN0KHgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHNjcmlwdHMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX3NjcmlwdHMpLnNvcnQoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHJvb3RBc3NldHMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX3Jvb3RBc3NldHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgaXNTdWJwYWNrYWdlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wcmVzc2lvblR5cGUgPT09IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMuU1VCUEFDS0FHRTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcm9vdCA9ICcnOyAvLyBidW5kbGUg55qE5qC555uu5b2VLCDlvIDlj5HogIXli77pgInnmoTnm67lvZXvvIzlpoLmnpzmmK8gbWFpbiDljIXvvIzov5nkuKrlrZfmrrXkuLogJydcbiAgICBwdWJsaWMgZGVzdCA9ICcnOyAvLyBidW5kbGUg55qE6L6T5Ye655uu5b2VXG4gICAgcHVibGljIGltcG9ydEJhc2U6IHN0cmluZyA9IEJ1aWxkR2xvYmFsSW5mby5JTVBPUlRfSEVBREVSO1xuICAgIHB1YmxpYyBuYXRpdmVCYXNlOiBzdHJpbmcgPSBCdWlsZEdsb2JhbEluZm8uTkFUSVZFX0hFQURFUjtcbiAgICBwdWJsaWMgc2NyaXB0RGVzdCA9ICcnOyAvLyDohJrmnKznmoTovpPlh7rlnLDlnYBcbiAgICBwdWJsaWMgbmFtZSA9ICcnOyAvLyBidW5kbGUg55qE5ZCN56ewXG4gICAgcHVibGljIHByaW9yaXR5ID0gMDsgLy8gYnVuZGxlIOeahOS8mOWFiOe6p1xuICAgIHB1YmxpYyBjb21wcmVzc2lvblR5cGU6IEJ1bmRsZUNvbXByZXNzaW9uVHlwZSA9IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMuTUVSR0VfREVQOyAvLyBidW5kbGUg55qE5Y6L57yp57G75Z6LXG4gICAgcHVibGljIGFzc2V0VmVyOiBJVmVyc2lvbk1hcCA9IHsgaW1wb3J0OiB7fSwgbmF0aXZlOiB7fSB9O1xuICAgIHB1YmxpYyB6aXBWZXIgPSAnJzsgLy8gWmlwIOWOi+e8qeaooeW8j++8jOWOi+e8qeWMheeahOeJiOacrFxuICAgIHB1YmxpYyB2ZXJzaW9uID0gJyc7IC8vIGJ1bmRsZSDnmoTniYjmnKzkv6Hmga9cbiAgICBwdWJsaWMgaXNSZW1vdGUgPSBmYWxzZTsgLy8gYnVuZGxlIOaYr+WQpuaYr+i/nOeoi+WMhVxuICAgIHB1YmxpYyBpc1ppcCA9IGZhbHNlOyAvLyBidW5kbGUg5piv5ZCm5pivIHppcCDljIXvvIzljbPkvb/ljovnvKnnsbvlnovorr7nva7kuLogemlw77yM5Lmf5LiN5LiA5a6a5pivIHppcCDljIVcbiAgICBwdWJsaWMgcmVkaXJlY3Q6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBwdWJsaWMgZGVwczogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBwdWJsaWMgZ3JvdXBzOiBJR3JvdXBbXSA9IFtdO1xuICAgIHB1YmxpYyBidW5kbGVGaWx0ZXJDb25maWc/OiBCdW5kbGVGaWx0ZXJDb25maWdbXTtcbiAgICBwdWJsaWMgb3V0cHV0OiBib29sZWFuO1xuICAgIHB1YmxpYyBoYXNQcmVsb2FkU2NyaXB0ID0gdHJ1ZTtcbiAgICBwdWJsaWMgZXh0ZW5zaW9uTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcbiAgICBwdWJsaWMgcGFja3M6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuICAgIHB1YmxpYyBwYXRoczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG4gICAgcHVibGljIG1kNUNhY2hlID0gZmFsc2U7XG4gICAgcHVibGljIGRlYnVnID0gZmFsc2U7XG4gICAgLy8gVE9ETyDlup/lvIMgYnVuZGxlIOeahCBjb25maWcg57uT5p6E77yM6L6T5Ye6IGNvbmZpZyDml7bljbPml7bmlbTnkIbljbPlj69cbiAgICBwdWJsaWMgY29uZmlnOiBJQnVuZGxlQ29uZmlnID0ge1xuICAgICAgICBpbXBvcnRCYXNlOiBCdWlsZEdsb2JhbEluZm8uSU1QT1JUX0hFQURFUixcbiAgICAgICAgbmF0aXZlQmFzZTogQnVpbGRHbG9iYWxJbmZvLk5BVElWRV9IRUFERVIsXG4gICAgICAgIG5hbWU6ICcnLFxuICAgICAgICBkZXBzOiBbXSxcbiAgICAgICAgdXVpZHM6IFtdLFxuICAgICAgICBwYXRoczoge30sXG4gICAgICAgIHNjZW5lczoge30sXG4gICAgICAgIHBhY2tzOiB7fSxcbiAgICAgICAgdmVyc2lvbnM6IHsgaW1wb3J0OiBbXSwgbmF0aXZlOiBbXSB9LFxuICAgICAgICByZWRpcmVjdDogW10sXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgZXh0ZW5zaW9uTWFwOiB7fSxcbiAgICAgICAgaGFzUHJlbG9hZFNjcmlwdDogdHJ1ZSxcbiAgICAgICAgZGVwZW5kZW5jeVJlbGF0aW9uc2hpcHM6IHt9LFxuICAgIH07XG5cbiAgICBwdWJsaWMgY29uZmlnT3V0UHV0TmFtZSA9ICcnO1xuXG4gICAgcHVibGljIGF0bGFzUmVzOiBJQXRsYXNSZXN1bHQgPSB7XG4gICAgICAgIC8vIOWtmOWCqCB0ZXh0dXJlL3Nwcml0ZS9hdGxhcyDlkowgaW1hZ2Ug55qE5a+55bqU5YWz57O7XG4gICAgICAgIGFzc2V0c1RvSW1hZ2U6IHt9LFxuICAgICAgICBpbWFnZVRvQXRsYXM6IHt9LFxuICAgICAgICBhdGxhc1RvSW1hZ2VzOiB7fSxcbiAgICB9O1xuXG4gICAgLy8g5a2Y5YKo57q555CG5Y6L57ypIGltYWdlIHV1aWQg5LiO5a+55bqU55qE57q555CG6LWE5rqQ5Zyw5Z2AXG4gICAgcHVibGljIGNvbXByZXNzUmVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcblxuICAgIF9yb290QXNzZXRzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpOyAvLyDor6UgYnVuZGxlIOebtOaOpeWMheWQq+eahOi1hOa6kFxuICAgIF9zY2VuZXM6IFJlY29yZDxzdHJpbmcsIElCdWlsZFNjZW5lSXRlbT4gPSB7fTtcbiAgICBfc2NyaXB0czogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAvLyDpmaTohJrmnKzjgIHlm77niYfku6XlpJbnmoTotYTmupAgdXVpZCDlkIjpm4ZcbiAgICBfYXNzZXRzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbXByZXNzVGFzazogUmVjb3JkPHN0cmluZywgSUltYWdlVGFza0luZm8+ID0ge307XG4gICAgX2pzb25Bc3NldDogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBfY2NvbkFzc2V0OiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIF9wYWNBc3NldHM6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJQnVuZGxlSW5pdE9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5yb290ID0gb3B0aW9ucy5yb290O1xuICAgICAgICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMuZGVzdCA9IG9wdGlvbnMuZGVzdDtcbiAgICAgICAgdGhpcy5tZDVDYWNoZSA9IG9wdGlvbnMubWQ1Q2FjaGU7XG4gICAgICAgIHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnO1xuICAgICAgICB0aGlzLnByaW9yaXR5ID0gb3B0aW9ucy5wcmlvcml0eTtcbiAgICAgICAgdGhpcy5jb21wcmVzc2lvblR5cGUgPSBvcHRpb25zLmNvbXByZXNzaW9uVHlwZTtcbiAgICAgICAgdGhpcy5pc1JlbW90ZSA9IG9wdGlvbnMuaXNSZW1vdGU7XG4gICAgICAgIHRoaXMuc2NyaXB0RGVzdCA9IG9wdGlvbnMuc2NyaXB0RGVzdDtcbiAgICAgICAgdGhpcy5idW5kbGVGaWx0ZXJDb25maWcgPSBpbml0QnVuZGxlQ29uZmlnKG9wdGlvbnMuYnVuZGxlRmlsdGVyQ29uZmlnKTtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBvcHRpb25zLm91dHB1dCA/PyB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa3u+WKoOaguei1hOa6kO+8jOatpOaWueazleS8mumAkuW9kua3u+WKoOWtkOi1hOa6kOeahOaVsOaNruaUr+aMgeaZrumAmui1hOa6kOS4juiEmuacrOi1hOa6kFxuICAgICAqIEBwYXJhbSBhc3NldCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkUm9vdEFzc2V0KGFzc2V0OiBBc3NldCB8IFZpcnR1YWxBc3NldCkge1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVjdXJzaXZlbHkoYXNzZXQsIChhc3NldDogQXNzZXQgfCBWaXJ0dWFsQXNzZXQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0VHlwZSA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsICd0eXBlJyk7XG4gICAgICAgICAgICBpZiAoYXNzZXRUeXBlID09PSAnY2MuU2NyaXB0Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkU2NyaXB0KGFzc2V0KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXNzZXQubWV0YT8uZmlsZXMgJiYgIWFzc2V0Lm1ldGEuZmlsZXMuaW5jbHVkZXMoJy5qc29uJykgJiYgIWhhc0NDT05Gb3JtYXRBc3NldEluTGlicmFyeShhc3NldCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjYW5BZGQgPSBjaGVja0Fzc2V0V2l0aEZpbHRlckNvbmZpZyhhc3NldCwgdGhpcy5idW5kbGVGaWx0ZXJDb25maWcpO1xuICAgICAgICAgICAgaWYgKCFjYW5BZGQpIHtcbiAgICAgICAgICAgICAgICAvLyByb290IGFzc2V0IOagueaNriBidW5kbGUg6YWN572u55qE5q2j5bi45YmU6Zmk6KGM5Li677yM5peg6ZyA6K2m5ZGK77yM5omT5Y2w6K6w5b2V5Y2z5Y+vXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgYXNzZXQge2Fzc2V0KCR7YXNzZXQudXJsfSl9IGNhbiBub3QgbWF0Y2ggdGhlIGJ1bmRsZXIgZmlsdGVyIGNvbmZpZygke3RoaXMubmFtZX0pYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcm9vdEFzc2V0cy5hZGQoYXNzZXQudXVpZCk7XG4gICAgICAgICAgICB0aGlzLmFkZEFzc2V0KGFzc2V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5re75Yqg5Y+C5LiOIEJ1bmRsZSDmiZPljIXnmoTohJrmnKzotYTmupDvvIzmnIDnu4jovpPlh7rliLAgaW5kZXguanMg5YaFXG4gICAgICog6ZyA6KaB5o+Q5YmN5Yik5pat6ISa5pys6LWE5rqQ57G75Z6LXG4gICAgICogQHBhcmFtIGFzc2V0IFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHB1YmxpYyBhZGRTY3JpcHQoYXNzZXQ6IEFzc2V0IHwgVmlydHVhbEFzc2V0KSB7XG4gICAgICAgIGlmICghYXNzZXQgfHwgdGhpcy5fc2NyaXB0cy5oYXMoYXNzZXQudXVpZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBoYWNrIOi/h+a7pOeJueauiueahOWjsOaYjuaWh+S7tlxuICAgICAgICBpZiAoYXNzZXQudXJsLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoJy5kLnRzJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFzc2V0Lm1ldGEudXNlckRhdGEuaXNQbHVnaW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3NjcmlwdHMuYWRkKGFzc2V0LnV1aWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5re75Yqg5LiA5Liq6LWE5rqQ5Yiw6K+lIGJ1bmRsZSDkuK1cbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkQXNzZXQoYXNzZXQ6IElBc3NldCkge1xuICAgICAgICBpZiAoIWFzc2V0IHx8IHRoaXMuX2Fzc2V0cy5oYXMoYXNzZXQudXVpZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldC5tZXRhLmZpbGVzLmluY2x1ZGVzKCcuanNvbicpKSB7XG4gICAgICAgICAgICB0aGlzLl9qc29uQXNzZXQuYWRkKGFzc2V0LnV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0NDT05Gb3JtYXRBc3NldEluTGlicmFyeShhc3NldCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2Njb25Bc3NldC5hZGQoYXNzZXQudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldFR5cGUgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAndHlwZScpO1xuICAgICAgICBzd2l0Y2ggKGFzc2V0VHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnY2MuU2NyaXB0JzpcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFNjcmlwdChhc3NldCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FzZSAnY2MuU2NlbmVBc3NldCc6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2NlbmVzW2Fzc2V0LnV1aWRdID0ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuX2Fzc2V0cy5hZGQoYXNzZXQudXVpZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLl9hc3NldHMuYWRkKGFzc2V0LnV1aWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUFzc2V0KGFzc2V0VXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXNzZXRzLmRlbGV0ZShhc3NldFV1aWQpO1xuICAgICAgICB0aGlzLl9yb290QXNzZXRzLmRlbGV0ZShhc3NldFV1aWQpO1xuICAgICAgICBkZWxldGUgdGhpcy5fc2NlbmVzW2Fzc2V0VXVpZF07XG4gICAgICAgIHRoaXMuX2pzb25Bc3NldC5kZWxldGUoYXNzZXRVdWlkKTtcbiAgICAgICAgdGhpcy5fc2NyaXB0cy5kZWxldGUoYXNzZXRVdWlkKTtcbiAgICAgICAgZGVsZXRlIHRoaXMucmVkaXJlY3RbYXNzZXRVdWlkXTtcbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tR3JvdXBzKGFzc2V0VXVpZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmNvbXByZXNzVGFza1thc3NldFV1aWRdO1xuICAgICAgICBkZWxldGUgdGhpcy5jb21wcmVzc1Jlc1thc3NldFV1aWRdO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRSZWRpcmVjdCh1dWlkOiBzdHJpbmcsIHJlZGlyZWN0OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWRpcmVjdFt1dWlkXSA9IHJlZGlyZWN0O1xuICAgICAgICB0aGlzLmRlcHMuYWRkKHJlZGlyZWN0KTtcbiAgICAgICAgdGhpcy5hZGRBc3NldFdpdGhVdWlkKHV1aWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTY3JpcHRXaXRoVXVpZChhc3NldDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX3NjcmlwdHMuYWRkKGFzc2V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnsbvkvLzlm77pm4bnrYnotYTmupDnmoQgdXVpZCDlj6/og73msqHmnIkgYXNzZXQgaW5mb1xuICAgICAqIEBwYXJhbSBhc3NldCBcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkQXNzZXRXaXRoVXVpZChhc3NldDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2Fzc2V0cy5hZGQoYXNzZXQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRSZWRpcmVjdCh1dWlkOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWRpcmVjdFt1dWlkXTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkR3JvdXAodHlwZTogSUpTT05Hcm91cFR5cGUsIHV1aWRzOiBzdHJpbmdbXSwgbmFtZSA9ICcnKSB7XG4gICAgICAgIHRoaXMuZ3JvdXBzLnB1c2goeyB0eXBlLCB1dWlkcywgbmFtZSB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkVG9Hcm91cCh0eXBlOiBJSlNPTkdyb3VwVHlwZSwgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5ncm91cHMuZmluZCgoaXRlbSkgPT4gaXRlbS50eXBlID09PSB0eXBlKTtcbiAgICAgICAgaWYgKGdyb3VwKSB7XG4gICAgICAgICAgICBncm91cC51dWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hZGRHcm91cCh0eXBlLCBbdXVpZF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUZyb21Hcm91cHModXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuZ3JvdXBzLmZvckVhY2goKGdyb3VwKSA9PiB7XG4gICAgICAgICAgICBjYy5qcy5hcnJheS5mYXN0UmVtb3ZlKGdyb3VwLnV1aWRzLCB1dWlkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZ3JvdXBzID0gdGhpcy5ncm91cHMuZmlsdGVyKChncm91cCkgPT4gZ3JvdXAudXVpZHMubGVuZ3RoID4gMSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yid5aeL5YyWIGJ1bmRsZSDnmoQgY29uZmlnIOaVsOaNrlxuICAgICAqL1xuICAgIHB1YmxpYyBpbml0Q29uZmlnKCkge1xuICAgICAgICB0aGlzLmNvbmZpZy5pbXBvcnRCYXNlID0gdGhpcy5pbXBvcnRCYXNlO1xuICAgICAgICB0aGlzLmNvbmZpZy5uYXRpdmVCYXNlID0gdGhpcy5uYXRpdmVCYXNlO1xuICAgICAgICB0aGlzLmNvbmZpZy5uYW1lID0gdGhpcy5uYW1lO1xuICAgICAgICB0aGlzLmNvbmZpZy5kZWJ1ZyA9IHRoaXMuZGVidWc7XG4gICAgICAgIHRoaXMuY29uZmlnLmhhc1ByZWxvYWRTY3JpcHQgPSB0aGlzLmhhc1ByZWxvYWRTY3JpcHQ7XG4gICAgICAgIHRoaXMuY29uZmlnLmRlcHMgPSBBcnJheS5mcm9tKHRoaXMuZGVwcykuc29ydCgpO1xuICAgICAgICB0aGlzLmNvbmZpZy51dWlkcyA9IHRoaXMuYXNzZXRzLnNvcnQoKTtcbiAgICAgICAgY29uc3QgcmVkaXJlY3Q6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0aGlzLmNvbmZpZy5yZWRpcmVjdCA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkcyA9IE9iamVjdC5rZXlzKHRoaXMucmVkaXJlY3QpLnNvcnQoKTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHV1aWRzKSB7XG4gICAgICAgICAgICByZWRpcmVjdC5wdXNoKHV1aWQsIFN0cmluZyh0aGlzLmNvbmZpZy5kZXBzLmluZGV4T2YodGhpcy5yZWRpcmVjdFt1dWlkXSkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjZW5lcy5mb3JFYWNoKChzY2VuZUl0ZW0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnNjZW5lc1tzY2VuZUl0ZW0udXJsXSA9IHNjZW5lSXRlbS51dWlkO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgaW5pdEFzc2V0UGF0aHMoKSB7XG4gICAgICAgIC8vIEhBQ0sgaW50ZXJuYWwgYnVuZGxlIOaYr+W8leaTjuiHqui6q+W8leeUqOeahOi1hOa6kO+8jOS4jemcgOimgeaUr+aMgSBwYXRocyDliqjmgIHliqDovb1cbiAgICAgICAgLy8gaWYgKHRoaXMubmFtZSA9PT0gQnVpbHRpbkJ1bmRsZU5hbWUuSU5URVJOQUwpIHtcbiAgICAgICAgLy8gICAgIHJldHVybjtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyDmlbTnkIYgQnVuZGxlIOaguei1hOa6kOeahOWKoOi9vei3r+W+hFxuICAgICAgICBjb25zdCB1cmxDb2xsZWN0OiBhbnkgPSB7fTtcbiAgICAgICAgLy8g5YWI5Y676YeN5LiA5qyhXG4gICAgICAgIHRoaXMucm9vdEFzc2V0cy5mb3JFYWNoKCh1dWlkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0SW5mbyh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGluZm86IGFueSA9IFthc3NldC5sb2FkVXJsLnJlcGxhY2UodGhpcy5yb290ICsgJy8nLCAnJykucmVwbGFjZShleHRuYW1lKGFzc2V0LnVybCksICcnKSwgYXNzZXQudHlwZV07XG4gICAgICAgICAgICAvLyDlhoXnva7otYTmupDkuI3lgZrmraTorablkYrmj5DnpLpcbiAgICAgICAgICAgIHRoaXMubmFtZSAhPT0gQnVpbHRpbkJ1bmRsZU5hbWUuSU5URVJOQUwgJiYgY2hlY2tVcmwoYXNzZXQudXVpZCwgaW5mb1swXSwgaW5mb1sxXSk7XG4gICAgICAgICAgICAvLyDkvZzkuLrliKTmlq3mmK/lkKbkuLrlrZDotYTmupDnmoTmoIfor4bnrKbvvIzlrZDotYTmupDpnIDopoHliqDmoIforrAgMVxuICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkpIHtcbiAgICAgICAgICAgICAgICBpbmZvLnB1c2goMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5wYXRoc1thc3NldC51dWlkXSA9IGluZm87XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgZnVuY3Rpb24gY2hlY2tVcmwodXVpZDogc3RyaW5nLCB1cmw6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXVybENvbGxlY3RbdXJsXSkge1xuICAgICAgICAgICAgICAgIHVybENvbGxlY3RbdXJsXSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF1cmxDb2xsZWN0W3VybF1bdHlwZV0pIHtcbiAgICAgICAgICAgICAgICB1cmxDb2xsZWN0W3VybF1bdHlwZV0gPSB1dWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5ZCM5ZCN77yM5ZCM57G75Z6LIHVybFxuICAgICAgICAgICAgY29uc3QgZXhpc3RVdWlkID0gdXJsQ29sbGVjdFt1cmxdW3R5cGVdO1xuICAgICAgICAgICAgaWYgKGV4aXN0VXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0QSA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KGV4aXN0VXVpZCk7XG4gICAgICAgICAgICBjb25zdCBhc3NldEIgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihpMThuLnQoJ2J1aWxkZXIud2Fybi5zYW1lX2xvYWRfdXJsJywge1xuICAgICAgICAgICAgICAgIHVybEE6IGB7YXNzZXQoJHthc3NldEEudXJsfSl9IHV1aWQ6ICR7ZXhpc3RVdWlkfWAsXG4gICAgICAgICAgICAgICAgdXJsQjogYHthc3NldCgke2Fzc2V0Qi51cmx9KX0gdXVpZDogJHt1dWlkfWAsXG4gICAgICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90ZTogZGVwZW5kZW5jeVJlbGF0aW9uc2hpcHMg5byV5pOO5bCa5pyq5pSv5oyB77yM5peg6ZyA5YaZ5YWlXG4gICAgICAgIC8vIOW5tuS4lOeUseS6jumihOiniOS4jeWKoOi9veiEmuacrOW5tuS4lOWcuuaZryBwcmVmYWIg55qE5L6d6LWW5L+h5oGv55uu5YmN5peg5rOV6ISx56a75Y+N5bqP5YiX5YyW5rWB56iL562J5Y6f5Zug77yM5peg5rOV5Zyo6aKE6KeI6Zi25q616I635Y+W5a6M5pW05L6d6LWW77yM5aaC6ZyA5byA5pS+5q2k5Yqf6IO96ZyA6KaB6L+Z5Lik5aSE6Zeu6aKY6Kej5Yaz5ZCOXG4gICAgICAgIC8vIGZvciAoY29uc3QgdXVpZCBvZiB0aGlzLmFzc2V0c1dpdGhvdXRSZWRpcmVjdCkge1xuICAgICAgICAvLyAgICAgY29uc3QgZGVwZW5kcyA9IGF3YWl0IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldERlcGVuZFV1aWRzKHV1aWQpO1xuICAgICAgICAvLyAgICAgZGVwZW5kcy5sZW5ndGggJiYgKHRoaXMuY29uZmlnLmRlcGVuZGVuY3lSZWxhdGlvbnNoaXBzW3V1aWRdID0gZGVwZW5kcyk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb3V0cHV0Q29uZmlncygpIHtcbiAgICAgICAgaWYgKCF0aGlzLm91dHB1dCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzWmlwKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5pc1ppcCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy56aXBWZXJzaW9uID0gdGhpcy56aXBWZXI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1Zyhgb3V0cHV0IGNvbmZpZyBvZiBidW5kbGUgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIGxldCBvdXRwdXRQYXRoID0gam9pbih0aGlzLmRlc3QsICh0aGlzLmNvbmZpZ091dFB1dE5hbWUgfHwgcGFyc2UoQnVpbGRHbG9iYWxJbmZvLkNPTkZJR19OQU1FKS5uYW1lKSArICcuanNvbicpO1xuICAgICAgICBpZiAodGhpcy52ZXJzaW9uKSB7XG4gICAgICAgICAgICBvdXRwdXRQYXRoID0gam9pbih0aGlzLmRlc3QsIGAke3RoaXMuY29uZmlnT3V0UHV0TmFtZSB8fCBwYXJzZShCdWlsZEdsb2JhbEluZm8uQ09ORklHX05BTUUpLm5hbWV9LiR7dGhpcy52ZXJzaW9ufS5qc29uYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkodGhpcy5jb25maWcsIG51bGwsIHRoaXMuY29uZmlnLmRlYnVnID8gNCA6IDApO1xuICAgICAgICBvdXRwdXRGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50LCAndXRmOCcpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBvdXRwdXQgY29uZmlnIG9mIGJ1bmRsZSAke3RoaXMubmFtZX0gc3VjY2Vzc2ApO1xuICAgIH1cblxuICAgIGFzeW5jIGJ1aWxkKCkge1xuICAgICAgICAvLyDph43mlrDmlbTnkIbkuIDmrKEgY29uZmlnIOmBv+WFjea8j+aOieS4gOS6m+WQjue7rea1geeoi+aWsOWinueahOaVsOaNrlxuICAgICAgICBhd2FpdCB0aGlzLmluaXRDb25maWcoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5nZW5QYWNrZWRBc3NldHNDb25maWcoKTtcblxuICAgICAgICBpZiAodGhpcy5tZDVDYWNoZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVBc3NldHNNZDUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29tcHJlc3MoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuemlwQnVuZGxlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLm1kNUJ1bmRsZSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5vdXRwdXRDb25maWdzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXByZXNzKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnppcEJ1bmRsZSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5vdXRwdXRDb25maWdzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBtZDVCdW5kbGUoKSB7XG4gICAgICAgIGlmICghdGhpcy5tZDVDYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhhc2ggPSBjYWxjTWQ1KFtKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZyksIHJlYWRGaWxlU3luYyh0aGlzLnNjcmlwdERlc3QpXSk7XG4gICAgICAgIGlmICghdGhpcy5pc1N1YnBhY2thZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld05hbWUgPSBqb2luKGRpcm5hbWUodGhpcy5zY3JpcHREZXN0KSwgYCR7cGFyc2UodGhpcy5zY3JpcHREZXN0KS5uYW1lfS4ke2hhc2h9JHtleHRuYW1lKHRoaXMuc2NyaXB0RGVzdCl9YCk7XG4gICAgICAgICAgICByZW5hbWVTeW5jKHRoaXMuc2NyaXB0RGVzdCwgbmV3TmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNjcmlwdERlc3QgPSBuZXdOYW1lO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmVyc2lvbiA9IGhhc2g7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNaaXApIHtcbiAgICAgICAgICAgIGNvbnN0IHppcFBhdGggPSBqb2luKHRoaXMuZGVzdCwgQnVpbGRHbG9iYWxJbmZvLkJVTkRMRV9aSVBfTkFNRSk7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyh6aXBQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwcGVuZE1kNVRvUGF0aHMoW3ppcFBhdGhdKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuemlwVmVyID0gcmVzLmhhc2ghO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWvuSBidW5kbGUg5YaF55qE6LWE5rqQ5paH5Lu26L+b6KGMIG1kNSDlpITnkIZcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBjcmVhdGVBc3NldHNNZDUoKSB7XG4gICAgICAgIGlmICghdGhpcy5tZDVDYWNoZSB8fCB0aGlzLmlzWmlwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hc3NldFZlci5pbXBvcnQgPSB7fTtcbiAgICAgICAgdGhpcy5hc3NldFZlci5uYXRpdmUgPSB7fTtcbiAgICAgICAgaWYgKCF0aGlzLmFzc2V0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBhZGQgbWQ1IHRvIGJ1bmRsZSAke3RoaXMubmFtZX0uLi5gKTtcbiAgICAgICAgLy8g5YWI5pS26ZuG5q+P5LiqIHV1aWQg5LiL5a+55bqU55qE5aSa5Liq6Lev5b6EXG4gICAgICAgIGNvbnN0IHN1ZmZpeE1hcDogSVN1ZmZpeE1hcCA9IHtcbiAgICAgICAgICAgIG5hdGl2ZToge30sXG4gICAgICAgICAgICBpbXBvcnQ6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmb250UGF0aHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGltcG9ydFBhdGhzID0gYXdhaXQgZmcoJyoqJywgeyBjd2Q6IGpvaW4odGhpcy5kZXN0LCB0aGlzLmltcG9ydEJhc2UpLCBhYnNvbHV0ZTogdHJ1ZSB9KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbXBvcnRQYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBpbXBvcnRQYXRoc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBnZXRVdWlkRnJvbVBhdGgoZmlsZVBhdGgpO1xuICAgICAgICAgICAgaWYgKCFzdWZmaXhNYXAuaW1wb3J0W3V1aWRdKSB7XG4gICAgICAgICAgICAgICAgc3VmZml4TWFwLmltcG9ydFt1dWlkXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VmZml4TWFwLmltcG9ydFt1dWlkXS5wdXNoKGZpbGVQYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuYXRpdmVQYXRocyA9IGF3YWl0IGZnKCcqKicsIHsgY3dkOiBqb2luKHRoaXMuZGVzdCwgdGhpcy5uYXRpdmVCYXNlKSwgYWJzb2x1dGU6IHRydWUgfSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmF0aXZlUGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gbmF0aXZlUGF0aHNbaV07XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gZ2V0VXVpZEZyb21QYXRoKGZpbGVQYXRoKTtcbiAgICAgICAgICAgIGlmICghc3VmZml4TWFwLm5hdGl2ZVt1dWlkXSkge1xuICAgICAgICAgICAgICAgIHN1ZmZpeE1hcC5uYXRpdmVbdXVpZF0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHR0ZiDlrZfkvZPnsbvlnovot6/lvoTpnIDopoHljZXni6zmj5Dlj5blh7rmnaXnibnmrorlpITnkIYs5Y+q5a+55paH5Lu25aS55YGaIGhhc2gg5YC85aSE55CGXG4gICAgICAgICAgICBpZiAoYmFzZW5hbWUoZGlybmFtZShmaWxlUGF0aCkpID09PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgZm9udFBhdGhzLnB1c2goZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VmZml4TWFwLm5hdGl2ZVt1dWlkXS5wdXNoKGZpbGVQYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBpbiBzdWZmaXhNYXAuaW1wb3J0KSB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBhcHBlbmRNZDVUb1BhdGhzKHN1ZmZpeE1hcC5pbXBvcnRbdXVpZF0pO1xuICAgICAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXNzZXRWZXIuaW1wb3J0W3V1aWRdID0gcmVzLmhhc2g7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCB1dWlkIGluIHN1ZmZpeE1hcC5uYXRpdmUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwcGVuZE1kNVRvUGF0aHMoc3VmZml4TWFwLm5hdGl2ZVt1dWlkXSk7XG4gICAgICAgICAgICBpZiAoIXJlcykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hc3NldFZlci5uYXRpdmVbdXVpZF0gPSByZXMuaGFzaDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvbnRQYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGZvbnRQYXRoc1tpXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzaCA9IGNhbGNNZDUocmVhZEZpbGVTeW5jKHBhdGgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZ2V0VXVpZEZyb21QYXRoKHBhdGgpO1xuICAgICAgICAgICAgICAgIHJlbmFtZVN5bmMoZGlybmFtZShwYXRoKSwgZGlybmFtZShwYXRoKSArIGAuJHtoYXNofWApO1xuICAgICAgICAgICAgICAgIHRoaXMuYXNzZXRWZXIubmF0aXZlW3V1aWRdID0gaGFzaDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDloavlhYUgbWQ1IOaVsOaNrlxuICAgICAgICBjb25zdCBpbXBvcnRVVWlkcyA9IE9iamVjdC5rZXlzKHRoaXMuYXNzZXRWZXIuaW1wb3J0KS5zb3J0KCk7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBpbXBvcnRVVWlkcykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy51dWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIC8vIOWBmuS4gOWxguagoemqjOaKpemUme+8jOmBv+WFjeWcqOi/kOihjOaXtuaJjeaatOmcsua3t+a3huaOkuafpVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENhbiBub3QgZmluZCBpbXBvcnQgYXNzZXQoJHt1dWlkfSkgaW4gYnVuZGxlICR7dGhpcy5yb290fS5gKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy51dWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb25maWcudmVyc2lvbnMuaW1wb3J0LnB1c2godXVpZCwgdGhpcy5hc3NldFZlci5pbXBvcnRbdXVpZF0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5hdGl2ZVVVaWRzID0gT2JqZWN0LmtleXModGhpcy5hc3NldFZlci5uYXRpdmUpLnNvcnQoKTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIG5hdGl2ZVVVaWRzKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY29uZmlnLnV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgLy8g5YGa5LiA5bGC5qCh6aqM5oql6ZSZ77yM6YG/5YWN5Zyo6L+Q6KGM5pe25omN5pq06Zyy5re35reG5o6S5p+lXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FuIG5vdCBmaW5kIG5hdGl2ZSBhc3NldCgke3V1aWR9KSBpbiBidW5kbGUgJHt0aGlzLnJvb3R9LmApO1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLnV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy52ZXJzaW9ucy5uYXRpdmUucHVzaCh1dWlkLCB0aGlzLmFzc2V0VmVyLm5hdGl2ZVt1dWlkXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgYWRkIG1kNSB0byBidW5kbGUgJHt0aGlzLm5hbWV9IHN1Y2Nlc3NgKTtcbiAgICB9XG5cbiAgICBhc3luYyB6aXBCdW5kbGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbXByZXNzaW9uVHlwZSAhPT0gQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5aSVAgfHwgIXRoaXMub3V0cHV0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgemlwIGJ1bmRsZSAke3RoaXMubmFtZX0uLi5gKTtcbiAgICAgICAgY29uc3QgZGVzdCA9IHRoaXMuZGVzdDtcbiAgICAgICAgY29uc3QgbmF0aXZlRGlyID0gam9pbihkZXN0LCB0aGlzLm5hdGl2ZUJhc2UpO1xuICAgICAgICBjb25zdCBpbXBvcnREaXIgPSBqb2luKGRlc3QsIHRoaXMuaW1wb3J0QmFzZSk7XG4gICAgICAgIGNvbnN0IGRpcnNUb0NvbXByZXNzID0gW25hdGl2ZURpciwgaW1wb3J0RGlyXS5maWx0ZXIoZGlyID0+IGV4aXN0c1N5bmMoZGlyKSk7XG4gICAgICAgIGlmIChkaXJzVG9Db21wcmVzcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmlzWmlwID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IGNvbXByZXNzRGlycyhkaXJzVG9Db21wcmVzcywgZGVzdCwgam9pbihkZXN0LCBCdWlsZEdsb2JhbEluZm8uQlVORExFX1pJUF9OQU1FKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgemlwIGJ1bmRsZSAke3RoaXMubmFtZX0gc3VjY2Vzcy4uLmApO1xuICAgIH1cblxuICAgIGNvbXByZXNzKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYGNvbXByZXNzIGNvbmZpZyBvZiBidW5kbGUgJHt0aGlzLm5hbWV9Li4uYCk7XG4gICAgICAgIGZ1bmN0aW9uIGNvbGxlY3RVdWlkcyhjb25maWc6IElCdW5kbGVDb25maWcpIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWRDb3VudDogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgICAgICAgICAgY29uc3QgdXVpZEluZGljZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4gPSB7fTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkVXVpZCh1dWlkOiBzdHJpbmcgfCBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9ICh1dWlkQ291bnRbdXVpZF0gfHwgMCkgKyAxO1xuICAgICAgICAgICAgICAgIHV1aWRDb3VudFt1dWlkXSA9IGNvdW50O1xuICAgICAgICAgICAgICAgIGlmICghKHV1aWQgaW4gdXVpZEluZGljZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWRJbmRpY2VzW3V1aWRdID0gdXVpZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gY29uZmlnLnBhdGhzO1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYXRoIGluIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgYWRkVXVpZChwYXRoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gY29uZmlnLnNjZW5lcztcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBzY2VuZXMpIHtcbiAgICAgICAgICAgICAgICBhZGRVdWlkKHNjZW5lc1tuYW1lXSBhcyBzdHJpbmcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGV4dE5hbWUgaW4gY29uZmlnLmV4dGVuc2lvbk1hcCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5leHRlbnNpb25NYXBbZXh0TmFtZV0uZm9yRWFjaChhZGRVdWlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFja0lkcyA9IE9iamVjdC5rZXlzKGNvbmZpZy5wYWNrcykuc29ydCgpO1xuICAgICAgICAgICAgY29uc3Qgc29ydGVkUGFja0Fzc2V0czogUmVjb3JkPHN0cmluZywgQXJyYXk8c3RyaW5nIHwgbnVtYmVyPj4gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGFja0lkIG9mIHBhY2tJZHMpIHtcbiAgICAgICAgICAgICAgICBjb25maWcucGFja3NbcGFja0lkXS5mb3JFYWNoKGFkZFV1aWQpO1xuICAgICAgICAgICAgICAgIHNvcnRlZFBhY2tBc3NldHNbcGFja0lkXSA9IGNvbmZpZy5wYWNrc1twYWNrSWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uZmlnLnBhY2tzID0gc29ydGVkUGFja0Fzc2V0cztcblxuICAgICAgICAgICAgY29uc3QgdmVyc2lvbnMgPSBjb25maWcudmVyc2lvbnM7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJpZXMgb2YgT2JqZWN0LnZhbHVlcyh2ZXJzaW9ucykpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkVXVpZChlbnRyaWVzW2ldIGFzIHN0cmluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZWRpcmVjdCA9IGNvbmZpZy5yZWRpcmVjdDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVkaXJlY3QubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICBhZGRVdWlkKHJlZGlyZWN0W2ldIGFzIHN0cmluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNvcnQgYnkgcmVmZXJlbmNlIGNvdW50XG4gICAgICAgICAgICBjb25maWcudXVpZHMuc29ydCgoYSwgYikgPT4gdXVpZENvdW50W2JdIC0gdXVpZENvdW50W2FdKTtcbiAgICAgICAgICAgIGNvbmZpZy51dWlkcy5mb3JFYWNoKCh1dWlkLCBpbmRleCkgPT4gdXVpZEluZGljZXNbdXVpZF0gPSBpbmRleCk7XG4gICAgICAgICAgICBjb25maWcudXVpZHMgPSBjb25maWcudXVpZHMubWFwKCh1dWlkKSA9PiB1dGlscy5VVUlELmNvbXByZXNzVVVJRCh1dWlkLCB0cnVlKSk7XG4gICAgICAgICAgICByZXR1cm4gdXVpZEluZGljZXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgICAgIGNvbnN0IHV1aWRJbmRpY2VzID0gY29sbGVjdFV1aWRzKGNvbmZpZyk7XG4gICAgICAgIGNvbnN0IHBhdGhzID0gY29uZmlnLnBhdGhzO1xuICAgICAgICBjb25zdCBuZXdQYXRoczogUmVjb3JkPHN0cmluZywgYW55PiA9IGNvbmZpZy5wYXRocyA9IHt9O1xuICAgICAgICBjb25zdCB0eXBlczogc3RyaW5nW10gPSBjb25maWcudHlwZXMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIGluIHBhdGhzKSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHBhdGhzW3V1aWRdO1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB1dWlkSW5kaWNlc1t1dWlkXTtcbiAgICAgICAgICAgIGxldCB0eXBlSW5kZXggPSB0eXBlcy5pbmRleE9mKGVudHJ5WzFdKTtcbiAgICAgICAgICAgIGlmICh0eXBlSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdHlwZUluZGV4ID0gdHlwZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHR5cGVzLnB1c2goZW50cnlbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW50cnlbMV0gPSB0eXBlSW5kZXg7XG4gICAgICAgICAgICBuZXdQYXRoc1tpbmRleF0gPSBlbnRyeTtcbiAgICAgICAgfVxuICAgICAgICAvLyDlvJXmk47lsJrmnKrlr7nmjqXkvb/nlKggaHR0cHM6Ly9naXRodWIuY29tL2NvY29zLzNkLXRhc2tzL2lzc3Vlcy8xNjE1MlxuICAgICAgICAvLyBjb25zdCBuZXdEZXBlbmRlbmN5UmVsYXRpb25zaGlwczogUmVjb3JkPHN0cmluZywgQXJyYXk8c3RyaW5nIHwgbnVtYmVyPj4gPSB7fTtcbiAgICAgICAgLy8gZm9yIChjb25zdCB1dWlkIGluIGNvbmZpZy5kZXBlbmRlbmN5UmVsYXRpb25zaGlwcykge1xuICAgICAgICAvLyAgICAgbGV0IGRlcGVuZHM6IEFycmF5PHN0cmluZyB8IG51bWJlcj4gPSBjb25maWcuZGVwZW5kZW5jeVJlbGF0aW9uc2hpcHNbdXVpZF07XG4gICAgICAgIC8vICAgICBjb25zdCBpbmRleCA9IHV1aWRJbmRpY2VzW3V1aWRdID8/IHV0aWxzLnN0cmluZy5jb21wcmVzc1VVSUQodXVpZCwgdHJ1ZSk7XG4gICAgICAgIC8vICAgICBkZXBlbmRzID0gZGVwZW5kcy5tYXAoKHV1aWQpID0+IHV1aWRJbmRpY2VzW3V1aWRdID8/IHV0aWxzLnN0cmluZy5jb21wcmVzc1VVSUQodXVpZCBhcyBzdHJpbmcsIHRydWUpKTtcbiAgICAgICAgLy8gICAgIG5ld0RlcGVuZGVuY3lSZWxhdGlvbnNoaXBzW2luZGV4XSA9IGRlcGVuZHM7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gY29uZmlnLmRlcGVuZGVuY3lSZWxhdGlvbnNoaXBzID0gbmV3RGVwZW5kZW5jeVJlbGF0aW9uc2hpcHM7XG5cbiAgICAgICAgY29uc3Qgc2NlbmVzID0gY29uZmlnLnNjZW5lcztcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIHNjZW5lcykge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBzY2VuZXNbbmFtZV07XG4gICAgICAgICAgICBjb25zdCB1dWlkSW5kZXggPSB1dWlkSW5kaWNlc1tzY2VuZV07XG4gICAgICAgICAgICBzY2VuZXNbbmFtZV0gPSBOdW1iZXIodXVpZEluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgZXh0TmFtZSBpbiBjb25maWcuZXh0ZW5zaW9uTWFwKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkcyA9IGNvbmZpZy5leHRlbnNpb25NYXBbZXh0TmFtZV07XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV1aWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZEluZGV4ID0gdXVpZEluZGljZXNbdXVpZHNbaV1dO1xuICAgICAgICAgICAgICAgIHV1aWRzW2ldID0gdXVpZEluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXVpZHMuc29ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFja2VkQXNzZXRzID0gY29uZmlnLnBhY2tzO1xuICAgICAgICBmb3IgKGNvbnN0IHBhY2tJZCBpbiBwYWNrZWRBc3NldHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tlZElkcyA9IHBhY2tlZEFzc2V0c1twYWNrSWRdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZWRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkSW5kZXggPSB1dWlkSW5kaWNlc1twYWNrZWRJZHNbaV1dO1xuICAgICAgICAgICAgICAgIHBhY2tlZElkc1tpXSA9IHV1aWRJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlZGlyZWN0ID0gY29uZmlnLnJlZGlyZWN0O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZGlyZWN0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkSW5kZXggPSB1dWlkSW5kaWNlc1tyZWRpcmVjdFtpXV07XG4gICAgICAgICAgICByZWRpcmVjdFtpXSA9IE51bWJlcih1dWlkSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc3QgdmVyc2lvbnMgPSB0aGlzLmNvbmZpZy52ZXJzaW9ucztcbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cmllcyBvZiBPYmplY3QudmFsdWVzKHZlcnNpb25zKSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1dWlkSW5kZXggPSB1dWlkSW5kaWNlc1tlbnRyaWVzW2ldXTtcbiAgICAgICAgICAgICAgICAgICAgZW50cmllc1tpXSA9IE51bWJlcih1dWlkSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBjb21wcmVzcyBjb25maWcgb2YgYnVuZGxlICR7dGhpcy5uYW1lfSBzdWNjZXNzYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pW055CGIEpTT04g5YiG57uE5Lul5Y+K6LWE5rqQ6Lev5b6E5pWw5o2u5YiwIGNvbmZpZyDlhoVcbiAgICAgKi9cbiAgICBhc3luYyBnZW5QYWNrZWRBc3NldHNDb25maWcoKSB7XG4gICAgICAgIC8vIOmHjeaWsOiuoeeul+S4gOasoe+8jOS4remXtOi/h+eoi+WPr+iDveS8muaWsOWinuaVsOaNrlxuICAgICAgICB0aGlzLmNvbmZpZy51dWlkcyA9IHRoaXMuYXNzZXRzLnNvcnQoKTtcbiAgICAgICAgY29uc3QgcmVkaXJlY3Q6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0aGlzLmNvbmZpZy5yZWRpcmVjdCA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkcyA9IE9iamVjdC5rZXlzKHRoaXMucmVkaXJlY3QpLnNvcnQoKTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHV1aWRzKSB7XG4gICAgICAgICAgICByZWRpcmVjdC5wdXNoKHV1aWQsIFN0cmluZyh0aGlzLmNvbmZpZy5kZXBzLmluZGV4T2YodGhpcy5yZWRpcmVjdFt1dWlkXSkpKTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmNvbmZpZy5leHRlbnNpb25NYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jb25maWcuZXh0ZW5zaW9uTWFwW2tleV0uc29ydCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gZ3JvdXAg6YeM55qE5pWw5o2u6L2s5o2i5oiQIHBhY2tlZEFzc2V0cyDmlbDmja5cbiAgICAgICAgY29uc3QgdXNlZFV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuZ3JvdXBzKSB7XG4gICAgICAgICAgICBpZiAoIWdyb3VwLm5hbWUpIHsgY29udGludWU7IH1cbiAgICAgICAgICAgIGlmIChncm91cC51dWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOi/memHjOeahCB1dWlkcyDkuI3og73mjpLluo/vvIzlnKgganNvbiDliIbnu4TnlJ/miJDpmLbmrrXlsLHpnIDopoHnoa7lrprvvIxncm91cC51dWlkcyDpnIDopoHnlKjlgZrmlbDmja7mn6Xor6LvvIxjb25maWcucGFja3Mg5ZCO57ut5Lya5Y6L57yp77yM6ZyA6KaB5rex5ou36LSdXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5wYWNrc1tncm91cC5uYW1lIV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdyb3VwLnV1aWRzKSk7XG4gICAgICAgICAgICBncm91cC51dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICB1c2VkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIOmcgOimgeWcqOavlOi+g+aZmuacn+eahOaXtuWAmei/m+ihjO+8jOWboOS4uuacieS6m+WbvumbhuebuOWFs+i1hOa6kOWPr+iDveWboOS4uuS4jeWQjOeahOmFjee9rumAiemhuei/h+a7pOenu+WHuiBCdW5kbGVcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0QXNzZXRQYXRocygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaMh+WumueahCB1dWlkIOi1hOa6kOaYr+WQpuWMheWQq+WcqOaehOW7uui1hOa6kOS4rVxuICAgICAqIEBwYXJhbSBkZWVwIOaYr+WQpua3seW6puafpeaJvu+8jOaMh+WumiB1dWlkIOeahOWFs+iBlOi1hOa6kOWtmOWcqOWNs+inhuS4uuWtmOWcqCBCdW5kbGUg5YyF5ZCr6K+l6LWE5rqQ77yM5L6L5aaC5pyq55Sf5oiQ5Zu+6ZuG5bqP5YiX5YyW6LWE5rqQ5L2G5piv5ZCI5Zu+IEltYWdlIOWtmOWcqOeahOaDheWGtVxuICAgICAqL1xuICAgIHB1YmxpYyBjb250YWluc0Fzc2V0KHV1aWQ6IHN0cmluZywgZGVlcCA9IGZhbHNlKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY3JpcHRzLmhhcyh1dWlkKVxuICAgICAgICAgICAgfHwgdGhpcy5fYXNzZXRzLmhhcyh1dWlkKVxuICAgICAgICAgICAgfHwgISF0aGlzLl9zY2VuZXNbdXVpZF1cbiAgICAgICAgICAgIHx8IChkZWVwID8gISEodGhpcy5hdGxhc1Jlcy5hdGxhc1RvSW1hZ2VzW3V1aWRdICYmIHRoaXMuYXRsYXNSZXMuYXRsYXNUb0ltYWdlc1t1dWlkXS5sZW5ndGgpIDogZmFsc2UpO1xuICAgIH1cblxufSJdfQ==