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
exports.CustomImporter = void 0;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../utils");
const lodash_1 = __importDefault(require("lodash"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const i18n_1 = __importDefault(require("../../base/i18n"));
const asset_config_1 = __importDefault(require("../asset-config"));
const filesystem_1 = require("./filesystem");
const eol_1 = __importDefault(require("eol"));
const property_schema_1 = require("../property-schema");
class CustomImporter extends asset_db_1.Importer {
    constructor(extensions, assetHandler) {
        super();
        const { migrations, migrationHook, version, versionCode, force, import: ImportAsset } = assetHandler.importer;
        if (!ImportAsset) {
            throw new Error(`Can not find import function in assetHandler(${assetHandler.name})`);
        }
        const { validate, name } = assetHandler;
        this._name = name;
        this._version = version || '0.0.0';
        this._versionCode = versionCode || 1;
        migrations && (this._migrations = migrations);
        migrationHook && (this._migrationHook = migrationHook);
        validate && (this.validate = validate);
        force && (this.force = force);
        // TODO 调整命名
        this.extnames = extensions;
        this.import = async (asset) => {
            await assetHandlerManager.runImporterHook(asset, 'before');
            const res = await ImportAsset.call(assetHandler, asset);
            await assetHandlerManager.runImporterHook(asset, 'after');
            return res;
        };
    }
}
exports.CustomImporter = CustomImporter;
class AssetHandlerManager {
    static createTemplateRoot;
    name2handler = {};
    type2handler = {};
    name2importer = {};
    // 缓存已经查找到的处理器
    // TODO 与 importer2custom 整合
    importer2OperateRecord = {};
    // [importer 懒加载] 1/3
    extname2registerInfo = {};
    name2registerInfo = {};
    // 扩展资源处理
    name2custom = {};
    importer2custom = {};
    // 用户配置里的 userData 缓存
    _userDataCache = {};
    // 导入器里注册的默认 userData 值， 注册后不可修改
    _defaultUserData = {};
    clear() {
        this.name2handler = {};
        this.extname2registerInfo = {};
        this.name2registerInfo = {};
        this.name2custom = {};
        this.importer2OperateRecord = {};
        this.importer2custom = {};
    }
    compileEffect(_force) {
        throw new Error('compileEffect is not implemented, please init assetHandler first!');
    }
    ;
    startAutoGenEffectBin() {
        throw new Error('startAutoGenEffectBin is not implemented, please init assetHandler first!');
    }
    ;
    getEffectBinPath() {
        throw new Error('getEffectBinPath is not implemented, please init assetHandler first!');
    }
    ;
    async init() {
        const { assetHandlerInfos } = await Promise.resolve().then(() => __importStar(require('../../assets/asset-handler/config')));
        this.register('cocos-cli', assetHandlerInfos, true);
        AssetHandlerManager.createTemplateRoot = asset_config_1.default.data.createTemplateRoot;
        const { compileEffect, startAutoGenEffectBin, getEffectBinPath } = await Promise.resolve().then(() => __importStar(require('../asset-handler')));
        this.compileEffect = compileEffect;
        this.startAutoGenEffectBin = startAutoGenEffectBin;
        this.getEffectBinPath = getEffectBinPath;
    }
    /**
     * 激活剩余未注册完成的资源处理器
     */
    async activateRegisterAll() {
        await Promise.all(Object.values(this.name2registerInfo).map((info) => {
            console.debug(`lazy register asset handler ${info.name}`);
            return this.activateRegister(info);
        }));
    }
    async ensureHandler(importer) {
        let handler = this.name2handler[importer];
        if (handler) {
            return handler;
        }
        const registerInfo = this.name2registerInfo[importer];
        if (!registerInfo) {
            return undefined;
        }
        await this.activateRegister(registerInfo);
        return this.name2handler[importer];
    }
    async activateRegister(registerInfos) {
        const { pkgName, name, extensions, internal } = registerInfos;
        if (this.name2importer[name]) {
            return this.name2importer[name];
        }
        try {
            const assetHandler = await registerInfos.load();
            if (assetHandler) {
                this.name2handler[name] = Object.assign(assetHandler, {
                    from: {
                        pkgName,
                        internal,
                    },
                });
                const extendsHandlerName = assetHandler.extends;
                if (extendsHandlerName) {
                    if (!this.name2handler[extendsHandlerName]) {
                        console.error(`Can not find extend asset-handler ${extendsHandlerName}`);
                        if (this.name2handler[name].assetType) {
                            const type = this.name2handler[name].assetType;
                            this.type2handler[type] = (this.type2handler[type] || []).concat([this.name2handler[name]]);
                        }
                        return null;
                    }
                    this.name2handler[name] = Object.assign({}, this.name2handler[extendsHandlerName], this.name2handler[name]);
                    this.name2handler[name].importer = Object.assign({}, this.name2handler[extendsHandlerName].importer, this.name2handler[name].importer);
                }
                if (this.name2handler[name].assetType) {
                    const type = this.name2handler[name].assetType;
                    this.type2handler[type] = (this.type2handler[type] || []).concat([this.name2handler[name]]);
                }
                // 收集默认配置，注册到导入系统内
                if (assetHandler.userDataConfig) {
                    for (const key in assetHandler.userDataConfig.default) {
                        if (this._userDataCache[name] && this._userDataCache[name][key]) {
                            assetHandler.userDataConfig.default[key].default = this._userDataCache[name][key];
                        }
                        if ([undefined, null].includes(assetHandler.userDataConfig.default[key].default)) {
                            continue;
                        }
                        lodash_1.default.set(this._defaultUserData, `${name}.${key}`, assetHandler.userDataConfig.default[key].default);
                    }
                    const combineUserData = {
                        ...(this._defaultUserData[name] || {}),
                        ...(this._userDataCache[name] || {}),
                    };
                    Object.keys(combineUserData).length && (0, asset_db_1.setDefaultUserData)(name, combineUserData);
                }
                return this.name2importer[name] = new CustomImporter(extensions, this.name2handler[name]);
            }
        }
        catch (error) {
            delete this.name2registerInfo[name];
            console.error(error);
            console.error(`register asset-handler ${name} failed!`);
        }
        return null;
    }
    register(pkgName, assetHandlerInfos, internal) {
        assetHandlerInfos.forEach((info) => {
            // 未传递 extname 的视为子资源导入器，extname = '-'
            const extensions = info.extensions && info.extensions.length ? info.extensions : ['-'];
            this.name2registerInfo[info.name] = {
                ...info,
                pkgName,
                extensions,
                internal,
            };
            extensions.forEach((extname) => {
                this.extname2registerInfo[extname] = this.extname2registerInfo[extname] || [];
                this.extname2registerInfo[extname].push(this.name2registerInfo[info.name]);
            });
        });
    }
    unregister(pkgName, assetHandlerInfos) {
        assetHandlerInfos.forEach((info) => {
            delete this.name2registerInfo[info.name];
            info.extensions.forEach((extname) => {
                if (!this.extname2registerInfo[extname]) {
                    return;
                }
                this.extname2registerInfo[extname] = this.extname2registerInfo[extname].filter((info) => info.pkgName === pkgName);
            });
            this.extname2registerInfo['-'] = this.extname2registerInfo['-'].filter((info) => info.pkgName === pkgName);
        });
    }
    async findImporter(asset, withoutDefaultImporter) {
        let extname = '';
        if (asset instanceof asset_db_1.Asset && asset.extname) {
            extname = asset.extname;
        }
        // 尝试使用标记的导入器, * 的导入器是每次找不到合适导入器时才会走的，再次进入时要重新走流程查找导入器
        if (asset.meta.importer && asset.meta.importer !== '*') {
            let importer = this.name2importer[asset.meta.importer];
            if (importer) {
                return importer;
            }
            const registerInfo = this.name2registerInfo[asset.meta.importer];
            if (registerInfo) {
                importer = await this.activateRegister(registerInfo);
                // 与标记导入器一致的不需要走检验
                if (importer && importer.name === asset.meta.importer) {
                    return importer;
                }
            }
            // 上面的逻辑走完还没有找到导入器，则说明以往标记的导入器已经无法找到，需要报错，之后重新寻找合适的导入器
            console.log(`Can not find the importer ${asset.meta.importer} in editor`);
        }
        // 尝试通过后缀找到适合这个资源的导入器
        const registerInfos = this.extname2registerInfo[extname] || [];
        if (registerInfos.length) {
            const importer = await this._findImporterInRegisterInfo(asset, registerInfos);
            if (importer) {
                return importer;
            }
        }
        if (withoutDefaultImporter) {
            return null;
        }
        // 找不到合适资源的导入器，尝试使用通过导入器
        return await this.getDefaultImporter(asset);
    }
    async getDefaultImporter(asset) {
        return (await this._findImporterInRegisterInfo(asset, this.extname2registerInfo['*'] || []) || null);
    }
    async _findImporterInRegisterInfo(asset, registerInfos) {
        for (let i = registerInfos.length - 1; i >= 0; i--) {
            const { name } = registerInfos[i];
            // 有可能在第一步的流程里已经获取到缓存在 name2importer 内了
            let importer = this.name2importer[name];
            if (!importer) {
                importer = await this.activateRegister(registerInfos[i]);
            }
            if (!importer) {
                continue;
            }
            try {
                const validate = await importer.validate(asset);
                if (validate) {
                    return importer;
                }
            }
            catch (error) {
                console.warn(`Importer(${name}) validate failed: ${asset.uuid}`);
                console.warn(error);
            }
        }
    }
    add(assetHandler, extensions) {
        // 如果已经存在同名的导入器则跳过
        if (assetHandler.name !== '*' &&
            this.name2handler[assetHandler.name] &&
            this.name2handler[assetHandler.name] !== assetHandler) {
            console.warn(`The AssetHandler[${assetHandler.name}] is already registered.`);
            return;
        }
        this.name2handler[assetHandler.name] = assetHandler;
        const importer = new CustomImporter(extensions, assetHandler);
        this.name2importer[assetHandler.name] = importer;
    }
    /**
     * 获取各个资源的新建列表数据
     */
    async getCreateMap() {
        const result = [];
        const importers = Array.from(new Set([
            ...Object.keys(this.name2registerInfo),
            ...Object.keys(this.name2handler),
        ]));
        for (const importer of importers) {
            const createMenu = await this.getCreateMenuByName(importer);
            result.push(...createMenu);
        }
        return result.map((item) => translateCreateMenuInfo(item));
    }
    /**
     * 根据导入器名称获取资源模板信息
     * @param importer
     * @returns
     */
    async getCreateMenuByName(importer) {
        const handler = await this.ensureHandler(importer);
        if (!handler || !handler.createInfo || !handler.createInfo.generateMenuInfo) {
            return [];
        }
        const { generateMenuInfo, preventDefaultTemplateMenu } = handler.createInfo;
        try {
            const defaultMenuInfo = await generateMenuInfo();
            const templateDir = getUserTemplateDir(importer);
            let templates = preventDefaultTemplateMenu ? [] : await queryUserTemplates(templateDir);
            // TODO 统一命名为 extensions
            const extensions = this.name2importer[importer].extnames;
            // 如果存在后缀则过滤不合法后缀的模板数据，无后缀作为正常模板处理（主要兼容旧版本无后缀的资源模板放置方式）
            templates = templates.filter((file) => {
                const extName = (0, path_1.extname)(file);
                if (!extName) {
                    return true;
                }
                return extensions.includes(extName);
            });
            const createMenu = [];
            defaultMenuInfo.forEach((info) => {
                // 存在用户模板时检查是否有覆盖默认模板的情况
                if (info.template && templates.length) {
                    const userTemplateIndex = templates.findIndex((templatePath) => {
                        return (0, path_1.basename)(templatePath) === (0, path_1.basename)(info.template);
                    });
                    if (userTemplateIndex !== -1) {
                        info = JSON.parse(JSON.stringify(info));
                        info.template = templates[userTemplateIndex];
                        templates.splice(userTemplateIndex, 1);
                    }
                }
                createMenu.push(patchHandler(info, importer, extensions));
            });
            // 与默认模板非同名的模板文件为用户自定义模板
            if (templates.length && createMenu.length) {
                templates.forEach((templatePath) => {
                    createMenu.push(patchHandler({
                        label: (0, path_1.basename)(templatePath, (0, path_1.extname)(templatePath)),
                        template: templatePath,
                        name: (0, path_1.basename)(templatePath, (0, path_1.extname)(templatePath)),
                        fullFileName: (0, path_1.basename)(templatePath, (0, path_1.extname)(templatePath)),
                    }, importer, extensions));
                });
            }
            return createMenu;
        }
        catch (error) {
            console.error(`Generate create list in handler ${importer} failed`);
        }
        return [];
    }
    /**
     * 生成创建资源模板
     * @param importer
     */
    async createAssetTemplate(importer, templatePath, target) {
        templatePath = (0, path_1.isAbsolute)(templatePath) ? templatePath : (0, utils_1.url2path)(templatePath);
        if (!templatePath || !(0, fs_extra_1.existsSync)(templatePath)) {
            return false;
        }
        const assetTemplateDir = getUserTemplateDir(importer);
        await (0, filesystem_1.createDirectoryPath)(assetTemplateDir);
        await (0, filesystem_1.copyPath)(templatePath, target);
        return true;
    }
    /**
     * 创建资源
     * @param options
     * @returns 返回资源创建地址
     */
    async createAsset(options) {
        options.rename = options.rename ?? true;
        if (!options.handler) {
            const registerInfos = this.extname2registerInfo[(0, path_1.extname)(options.target)];
            options.handler = registerInfos && registerInfos.length ? registerInfos[0].name : undefined;
        }
        if (options.handler) {
            const assetHandler = this.name2handler[options.handler];
            if (assetHandler && assetHandler.createInfo && assetHandler.createInfo.create) {
                // 优先使用自定义的创建方法，若创建结果不存在则走默认的创建流程
                const result = await assetHandler.createInfo.create(options);
                await afterCreateAsset(result, options);
                return result;
            }
        }
        if (options.content === undefined || options.content === null) {
            // 如果给定了模板信息，使用 db 默认的创建拷贝方式
            if (options.template) {
                const path = (0, utils_1.url2path)(options.template);
                if ((0, fs_extra_1.existsSync)(path)) {
                    await (0, filesystem_1.copyPath)(path, options.target, { overwrite: options.overwrite });
                    await afterCreateAsset(options.target, options);
                    return options.target;
                }
            }
            // content 不存在，新建一个文件夹
            await (0, filesystem_1.createDirectoryPath)(options.target);
        }
        else {
            // Buffers are already a filesystem write type; serializing one would corrupt binary assets.
            if (typeof options.content === 'object' && !Buffer.isBuffer(options.content)) {
                options.content = JSON.stringify(options.content, null, 4);
            }
            // Normalize EOL for string content
            if (typeof options.content === 'string' && options.handler === 'text') {
                options.content = eol_1.default.auto(options.content);
            }
            // 部分自定义创建资源没有模板，内容为空，只需要一个空文件即可完成创建
            await (0, filesystem_1.writePath)(options.target, options.content);
        }
        await afterCreateAsset(options.target, options);
        return options.target;
    }
    /**
     * 调用自定义的销毁资源流程
     * @param asset
     * @returns
     */
    async destroyAsset(asset) {
        const assetHandler = this.name2handler[asset.meta.importer];
        if (assetHandler && assetHandler.destroy) {
            return await assetHandler.destroy(asset);
        }
    }
    async saveAsset(asset, content) {
        const assetHandler = this.name2handler[asset.meta.importer];
        if (assetHandler && assetHandler.createInfo && assetHandler.createInfo.save) {
            // 优先使用自定义的保存方法
            return await assetHandler.createInfo.save(asset, content);
        }
        // Normalize EOL for string content
        if (typeof content === 'string' && asset.meta.importer === 'text') {
            content = eol_1.default.auto(content);
        }
        await (0, filesystem_1.writePath)(asset.source, content);
        return true;
    }
    async generateExportData(asset, options) {
        const assetHandler = this.name2handler[asset.meta.importer];
        if (!assetHandler || !assetHandler.exporter || !assetHandler.exporter.generateExportData) {
            return null;
        }
        return await assetHandler.exporter.generateExportData(asset, options);
    }
    /**
     * 拷贝生成导入文件到最终目标地址
     * @param handler
     * @param src
     * @param dest
     * @returns
     */
    async outputExportData(handler, src, dest) {
        const assetHandler = this.name2handler[handler];
        if (!assetHandler || !assetHandler.exporter || !assetHandler.exporter.outputExportData) {
            return false;
        }
        return await assetHandler.exporter.outputExportData(src, dest);
    }
    /**
     * 查询各个资源的基本配置 MAP
     */
    async queryRawAssetConfigMap() {
        await this.activateRegisterAll();
        const result = {};
        for (const importer of Object.keys(this.name2handler)) {
            const handler = this.name2handler[importer];
            const config = {
                displayName: handler.displayName,
                description: handler.description,
                docURL: handler.docURL,
            };
            if (handler.userDataConfig) {
                config.userDataConfig = handler.userDataConfig.default;
            }
            result[importer] = config;
        }
        return result;
    }
    /**
     * Query localized asset config map.
     */
    async queryAssetConfigMap() {
        const rawConfigMap = await this.queryRawAssetConfigMap();
        return localizeAssetConfigMap(rawConfigMap);
    }
    queryThumbnailHandlers() {
        return Object.keys(this.name2handler)
            .filter(name => typeof this.name2handler[name].generateThumbnail === 'function');
    }
    async generateThumbnail(asset, size) {
        const handler = this.name2handler[asset.meta.importer];
        if (handler && typeof handler.generateThumbnail === 'function') {
            return handler.generateThumbnail(asset, size);
        }
        return null;
    }
    async queryUserDataConfig(asset) {
        if (!asset) {
            return false;
        }
        const assetHandler = this.name2handler[asset.meta.importer];
        if (!assetHandler || !assetHandler.userDataConfig) {
            return;
        }
        if (!assetHandler.userDataConfig.generate) {
            return assetHandler.userDataConfig.default;
        }
        return await assetHandler.userDataConfig.generate(asset);
    }
    async queryUserDataConfigDefault(importer) {
        const assetHandler = this.name2handler[importer];
        if (!assetHandler || !assetHandler.userDataConfig) {
            return;
        }
        return assetHandler.userDataConfig.default;
    }
    async queryPropertySchema(importer) {
        const assetHandler = await this.ensureHandler(importer);
        if (!assetHandler) {
            throw new Error(`Asset handler not found: ${importer}`);
        }
        return (0, property_schema_1.createAssetPropertySchemaMap)(assetHandler.propertySchemaConfig);
    }
    async runImporterHook(asset, hookName) {
        const assetHandler = this.name2handler[asset.meta.importer];
        // 1. 先执行资源处理器内的钩子
        if (assetHandler && assetHandler.importer && typeof assetHandler.importer[hookName] === 'function') {
            try {
                await assetHandler.importer[hookName](asset);
            }
            catch (error) {
                console.error(error);
                console.error(`run ${hookName} hook failed!`);
            }
        }
        // 2. 再执行扩展注册的钩子
        const customHandlers = this.importer2custom[asset.meta.importer];
        if (!customHandlers || !customHandlers.length) {
            return;
        }
        for (const customHandler of customHandlers) {
            const hook = customHandler.importer && customHandler.importer[hookName];
            if (!hook) {
                continue;
            }
            try {
                await hook(asset);
            }
            catch (error) {
                console.error(error);
                console.error(`run ${hookName} hook failed!`);
            }
        }
    }
    _findOperateHandler(importer, operate) {
        if (this.importer2OperateRecord[importer] && this.importer2OperateRecord[importer][operate]) {
            return this.importer2OperateRecord[importer][operate];
        }
        let assetHandler = this.name2handler[importer];
        if (assetHandler && !(operate in assetHandler) && this.importer2custom[importer]) {
            assetHandler = this.importer2custom[importer].find((item) => operate in item);
        }
        if (!assetHandler || !assetHandler[operate]) {
            console.debug(`Cannot find the asset handler of operate ${operate} for importer ${importer}`);
            return null;
        }
        if (!this.importer2OperateRecord[importer]) {
            this.importer2OperateRecord[importer] = {};
        }
        this.importer2OperateRecord[importer][operate] = assetHandler;
        return assetHandler;
    }
    queryAllImporter() {
        let importerArr = Object.keys(this.name2handler);
        // 兼容旧版本的资源导入器
        const internalDB = (0, asset_db_1.get)('internal');
        const name2importer = internalDB.importerManager.name2importer;
        if (Object.keys(name2importer).length) {
            importerArr.push(...Object.keys(internalDB.importerManager.name2importer));
            importerArr = Array.from(new Set(importerArr));
            // 兼容旧版本的升级提示
            console.warn('the importer version need to upgrade.');
        }
        return importerArr.sort();
    }
    queryAllAssetTypes() {
        const assetTypes = new Set();
        Object.values(this.name2handler).forEach((handler) => {
            const { assetType } = handler;
            assetType && assetTypes.add(assetType);
        });
        // 兼容旧版本的资源导入器
        const internalDB = (0, asset_db_1.get)('internal');
        const name2importer = internalDB.importerManager.name2importer;
        if (Object.keys(name2importer).length) {
            for (const importer in name2importer) {
                if (importer === '*') {
                    continue;
                }
                const { assetType } = name2importer[importer];
                assetType && assetTypes.add(assetType);
                console.warn(`the importer${importer} version need to upgrade.`);
            }
            // 兼容旧版本的升级提示
        }
        return Array.from(assetTypes).sort();
    }
    /**
     * 更新默认配置数据并保存（偏好设置的用户操作修改入口）
     */
    async updateDefaultUserData(handler, key, value) {
        if (!this.name2handler[handler]) {
            throw new Error(`Asset handler not found: ${handler}`);
        }
        lodash_1.default.set(this._userDataCache, `${handler}.${key}`, value);
        this._updateDefaultUserDataToHandler(handler, key, value);
        const combineUserData = {
            ...(this._defaultUserData[handler] || {}),
            ...this._userDataCache[handler],
        };
        (0, asset_db_1.setDefaultUserData)(handler, combineUserData);
        const defaultMetaPath = (0, path_1.join)(asset_config_1.default.data.root, '.creator', 'default-meta.json');
        await (0, fs_extra_1.outputJSON)(defaultMetaPath, this._userDataCache);
    }
    /**
     * 更新导入默认值到导入器的渲染配置内部
     * @param handler
     * @param key
     * @param value
     */
    _updateDefaultUserDataToHandler(handler, key, value) {
        const assetHandler = this.name2handler[handler];
        // 调整已有配置内的默认值
        if (assetHandler && assetHandler.userDataConfig && assetHandler.userDataConfig.default[key]) {
            assetHandler.userDataConfig.default[key].default = value;
        }
    }
}
const assetHandlerManager = new AssetHandlerManager();
exports.default = assetHandlerManager;
function localizeAssetConfigMap(configMap) {
    const localizedConfigMap = lodash_1.default.cloneDeep(configMap);
    for (const config of Object.values(localizedConfigMap)) {
        localizeAssetConfig(config);
    }
    return localizedConfigMap;
}
function localizeAssetConfig(config) {
    config.displayName = translateAssetConfigText(config.displayName);
    config.description = translateAssetConfigText(config.description);
    if (config.userDataConfig) {
        localizeUserDataConfig(config.userDataConfig);
    }
}
function localizeUserDataConfig(config) {
    for (const item of Object.values(config)) {
        localizeUserDataConfigItem(item);
    }
}
function localizeUserDataConfigItem(item) {
    item.label = translateAssetConfigText(item.label);
    item.description = translateAssetConfigText(item.description);
    if (item.render?.items) {
        item.render.items = item.render.items.map((option) => ({
            ...option,
            label: translateAssetConfigText(option.label) ?? option.label,
        }));
    }
    if (!item.itemConfigs) {
        return;
    }
    if (Array.isArray(item.itemConfigs)) {
        item.itemConfigs.forEach((child) => {
            localizeUserDataConfigItem(child);
        });
        return;
    }
    for (const child of Object.values(item.itemConfigs)) {
        localizeUserDataConfigItem(child);
    }
}
function translateAssetConfigText(value) {
    if (typeof value !== 'string' || value.length === 0) {
        return value;
    }
    const i18nPrefix = 'i18n:';
    if (!value.startsWith(i18nPrefix)) {
        return value;
    }
    const key = value.slice(i18nPrefix.length);
    if (!key) {
        return value;
    }
    const translated = i18n_1.default.transI18nName(value);
    if (translated && translated !== value) {
        return translated;
    }
    return key;
}
function patchHandler(info, handler, extensions) {
    // 避免污染原始 info 数据
    const res = {
        handler,
        ...info,
    };
    if (res.submenu) {
        res.submenu = res.submenu.map((subInfo) => patchHandler(subInfo, handler, extensions));
    }
    if (res.template && !res.fullFileName) {
        res.fullFileName = (0, path_1.basename)(res.template);
        if (!(0, path_1.extname)(res.fullFileName)) {
            // 支持无后缀的模板文件，主要兼容 3.8.2 版本之前的脚本模板
            res.fullFileName += extensions[0];
        }
    }
    return res;
}
async function queryUserTemplates(templateDir) {
    try {
        if ((0, fs_extra_1.existsSync)(templateDir)) {
            return (await (0, fast_glob_1.default)(['**/*', '!*.meta'], {
                onlyFiles: true,
                cwd: templateDir,
            }));
        }
    }
    catch (error) {
        console.warn(error);
    }
    return [];
}
function getUserTemplateDir(importer) {
    return (0, path_1.join)(AssetHandlerManager.createTemplateRoot, importer);
}
function translateCreateMenuInfo(info) {
    const translated = { ...info };
    translated.label = i18n_1.default.transI18nName(translated.label);
    return translated;
}
async function afterCreateAsset(paths, options) {
    if (!Array.isArray(paths)) {
        paths = [paths];
    }
    for (const file of paths) {
        // 文件不存在，nodejs 没有成功创建文件
        if (!(0, fs_extra_1.existsSync)(file)) {
            throw new Error(`${i18n_1.default.t('assets.create_asset.fail.drop', {
                target: file,
            })}`);
        }
        // 根据选项配置 meta 模板文件
        if (options.userData || options.uuid) {
            const meta = {
                userData: options.userData || {},
            };
            if (options.uuid) {
                meta.uuid = options.uuid;
            }
            await (0, filesystem_1.writePath)(file + '.meta', JSON.stringify(meta, null, 4));
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9tYW5hZ2VyL2Fzc2V0LWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsOENBQThGO0FBQzlGLHVDQUFrRDtBQUNsRCwrQkFBMkQ7QUFDM0Qsb0NBQW9DO0FBQ3BDLG9EQUE0QjtBQUM1QiwwREFBMkI7QUFFM0IsMkRBQW1DO0FBSW5DLG1FQUEwQztBQUMxQyw2Q0FBd0U7QUFDeEUsOENBQXNCO0FBQ3RCLHdEQUFrRTtBQVFsRSxNQUFhLGNBQWUsU0FBUSxtQkFBZTtJQUMvQyxZQUFZLFVBQW9CLEVBQUUsWUFBMEI7UUFDeEQsS0FBSyxFQUFFLENBQUM7UUFDUixNQUFNLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsWUFBWSxDQUFDLFFBQTJCLENBQUM7UUFFakksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsWUFBWSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUNELE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsWUFBWSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQztRQUNuQyxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsSUFBSSxDQUFDLENBQUM7UUFDckMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsQ0FBQztRQUM5QyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FB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SUFBSTthQUNmLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDVixDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkMsTUFBTSxJQUFJLEdBQVE7Z0JBQ2QsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRTthQUNuQyxDQUFDO1lBQ0YsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFDRCxNQUFNLElBQUEsc0JBQVMsRUFBQyxJQUFJLEdBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUM7SUFDTCxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEltcG9ydGVyIGFzIEFzc2V0REJJbXBvcnRlciwgQXNzZXQsIHNldERlZmF1bHRVc2VyRGF0YSwgZ2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIG91dHB1dEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZXh0bmFtZSwgaXNBYnNvbHV0ZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdXJsMnBhdGggfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgbG9kYXNoIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgZmcgZnJvbSAnZmFzdC1nbG9iJztcblxuaW1wb3J0IGkxOG4gZnJvbSAnLi4vLi4vYmFzZS9pMThuJztcbmltcG9ydCB7IElBc3NldCwgSUV4cG9ydERhdGEgfSBmcm9tICcuLi9AdHlwZXMvcHJvdGVjdGVkL2Fzc2V0JztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciwgQ3VzdG9tSGFuZGxlciwgQ3VzdG9tQXNzZXRIYW5kbGVyLCBJQ3JlYXRlTWVudUluZm8sIENyZWF0ZUFzc2V0T3B0aW9ucywgSUV4cG9ydE9wdGlvbnMsIElBc3NldENvbmZpZywgSW1wb3J0ZXJIb29rLCBUaHVtYm5haWxJbmZvLCBUaHVtYm5haWxTaXplLCBJVWVyRGF0YUNvbmZpZ0l0ZW0gfSBmcm9tICcuLi9AdHlwZXMvcHJvdGVjdGVkL2Fzc2V0LWhhbmRsZXInO1xuaW1wb3J0IHR5cGUgeyBBc3NldEhhbmRsZXJJbmZvIH0gZnJvbSAnLi4vYXNzZXQtaGFuZGxlci9jb25maWcnO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4uL2Fzc2V0LWNvbmZpZyc7XG5pbXBvcnQgeyBjb3B5UGF0aCwgY3JlYXRlRGlyZWN0b3J5UGF0aCwgd3JpdGVQYXRoIH0gZnJvbSAnLi9maWxlc3lzdGVtJztcbmltcG9ydCBlb2wgZnJvbSAnZW9sJztcbmltcG9ydCB7IGNyZWF0ZUFzc2V0UHJvcGVydHlTY2hlbWFNYXAgfSBmcm9tICcuLi9wcm9wZXJ0eS1zY2hlbWEnO1xuaW1wb3J0IHR5cGUgeyBBc3NldFByb3BlcnR5U2NoZW1hTWFwIH0gZnJvbSAnLi4vQHR5cGVzL3B1YmxpYyc7XG5cbmludGVyZmFjZSBIYW5kbGVySW5mbyBleHRlbmRzIEFzc2V0SGFuZGxlckluZm8ge1xuICAgIHBrZ05hbWU6IHN0cmluZztcbiAgICBpbnRlcm5hbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEN1c3RvbUltcG9ydGVyIGV4dGVuZHMgQXNzZXREQkltcG9ydGVyIHtcbiAgICBjb25zdHJ1Y3RvcihleHRlbnNpb25zOiBzdHJpbmdbXSwgYXNzZXRIYW5kbGVyOiBBc3NldEhhbmRsZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgY29uc3QgeyBtaWdyYXRpb25zLCBtaWdyYXRpb25Ib29rLCB2ZXJzaW9uLCB2ZXJzaW9uQ29kZSwgZm9yY2UsIGltcG9ydDogSW1wb3J0QXNzZXQgfSA9IGFzc2V0SGFuZGxlci5pbXBvcnRlciBhcyBBc3NldERCSW1wb3J0ZXI7XG5cbiAgICAgICAgaWYgKCFJbXBvcnRBc3NldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW4gbm90IGZpbmQgaW1wb3J0IGZ1bmN0aW9uIGluIGFzc2V0SGFuZGxlcigke2Fzc2V0SGFuZGxlci5uYW1lfSlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHZhbGlkYXRlLCBuYW1lIH0gPSBhc3NldEhhbmRsZXI7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLl92ZXJzaW9uID0gdmVyc2lvbiB8fCAnMC4wLjAnO1xuICAgICAgICB0aGlzLl92ZXJzaW9uQ29kZSA9IHZlcnNpb25Db2RlIHx8IDE7XG4gICAgICAgIG1pZ3JhdGlvbnMgJiYgKHRoaXMuX21pZ3JhdGlvbnMgPSBtaWdyYXRpb25zKTtcbiAgICAgICAgbWlncmF0aW9uSG9vayAmJiAodGhpcy5fbWlncmF0aW9uSG9vayA9IG1pZ3JhdGlvbkhvb2spO1xuICAgICAgICB2YWxpZGF0ZSAmJiAodGhpcy52YWxpZGF0ZSA9IHZhbGlkYXRlKTtcbiAgICAgICAgZm9yY2UgJiYgKHRoaXMuZm9yY2UgPSBmb3JjZSk7XG4gICAgICAgIC8vIFRPRE8g6LCD5pW05ZG95ZCNXG4gICAgICAgIHRoaXMuZXh0bmFtZXMgPSBleHRlbnNpb25zO1xuXG4gICAgICAgIHRoaXMuaW1wb3J0ID0gYXN5bmMgKGFzc2V0OiBJQXNzZXQpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0SGFuZGxlck1hbmFnZXIucnVuSW1wb3J0ZXJIb29rKGFzc2V0LCAnYmVmb3JlJyk7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBJbXBvcnRBc3NldC5jYWxsKGFzc2V0SGFuZGxlciwgYXNzZXQpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXRIYW5kbGVyTWFuYWdlci5ydW5JbXBvcnRlckhvb2soYXNzZXQsICdhZnRlcicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmNsYXNzIEFzc2V0SGFuZGxlck1hbmFnZXIge1xuICAgIHN0YXRpYyBjcmVhdGVUZW1wbGF0ZVJvb3Q6IHN0cmluZztcbiAgICBuYW1lMmhhbmRsZXI6IFJlY29yZDxzdHJpbmcsIEFzc2V0SGFuZGxlcj4gPSB7fTtcbiAgICB0eXBlMmhhbmRsZXI6IFJlY29yZDxzdHJpbmcsIEFzc2V0SGFuZGxlcltdPiA9IHt9O1xuICAgIG5hbWUyaW1wb3J0ZXI6IFJlY29yZDxzdHJpbmcsIEN1c3RvbUltcG9ydGVyPiA9IHt9O1xuICAgIC8vIOe8k+WtmOW3sue7j+afpeaJvuWIsOeahOWkhOeQhuWZqFxuICAgIC8vIFRPRE8g5LiOIGltcG9ydGVyMmN1c3RvbSDmlbTlkIhcbiAgICBpbXBvcnRlcjJPcGVyYXRlUmVjb3JkOiB7IFtpbXBvcnRlcjogc3RyaW5nXTogeyBbb3BlcmF0ZTogc3RyaW5nXTogQXNzZXRIYW5kbGVyIHwgQ3VzdG9tSGFuZGxlciB9IH0gPSB7fTtcbiAgICAvLyBbaW1wb3J0ZXIg5oeS5Yqg6L29XSAxLzNcbiAgICBleHRuYW1lMnJlZ2lzdGVySW5mbzogUmVjb3JkPHN0cmluZywgSGFuZGxlckluZm9bXT4gPSB7fTtcbiAgICBuYW1lMnJlZ2lzdGVySW5mbzogUmVjb3JkPHN0cmluZywgSGFuZGxlckluZm8+ID0ge307XG5cbiAgICAvLyDmianlsZXotYTmupDlpITnkIZcbiAgICBuYW1lMmN1c3RvbTogUmVjb3JkPHN0cmluZywgQ3VzdG9tSGFuZGxlcj4gPSB7fTtcbiAgICBpbXBvcnRlcjJjdXN0b206IFJlY29yZDxzdHJpbmcsIEN1c3RvbUhhbmRsZXJbXT4gPSB7fTtcblxuICAgIC8vIOeUqOaIt+mFjee9rumHjOeahCB1c2VyRGF0YSDnvJPlrZhcbiAgICBfdXNlckRhdGFDYWNoZTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIC8vIOWvvOWFpeWZqOmHjOazqOWGjOeahOm7mOiupCB1c2VyRGF0YSDlgLzvvIwg5rOo5YaM5ZCO5LiN5Y+v5L+u5pS5XG4gICAgX2RlZmF1bHRVc2VyRGF0YTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMubmFtZTJoYW5kbGVyID0ge307XG4gICAgICAgIHRoaXMuZXh0bmFtZTJyZWdpc3RlckluZm8gPSB7fTtcbiAgICAgICAgdGhpcy5uYW1lMnJlZ2lzdGVySW5mbyA9IHt9O1xuICAgICAgICB0aGlzLm5hbWUyY3VzdG9tID0ge307XG4gICAgICAgIHRoaXMuaW1wb3J0ZXIyT3BlcmF0ZVJlY29yZCA9IHt9O1xuICAgICAgICB0aGlzLmltcG9ydGVyMmN1c3RvbSA9IHt9O1xuICAgIH1cblxuICAgIGNvbXBpbGVFZmZlY3QoX2ZvcmNlOiBib29sZWFuKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY29tcGlsZUVmZmVjdCBpcyBub3QgaW1wbGVtZW50ZWQsIHBsZWFzZSBpbml0IGFzc2V0SGFuZGxlciBmaXJzdCEnKTtcbiAgICB9O1xuICAgIHN0YXJ0QXV0b0dlbkVmZmVjdEJpbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdGFydEF1dG9HZW5FZmZlY3RCaW4gaXMgbm90IGltcGxlbWVudGVkLCBwbGVhc2UgaW5pdCBhc3NldEhhbmRsZXIgZmlyc3QhJyk7XG4gICAgfTtcbiAgICBnZXRFZmZlY3RCaW5QYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZ2V0RWZmZWN0QmluUGF0aCBpcyBub3QgaW1wbGVtZW50ZWQsIHBsZWFzZSBpbml0IGFzc2V0SGFuZGxlciBmaXJzdCEnKTtcbiAgICB9O1xuXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgeyBhc3NldEhhbmRsZXJJbmZvcyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9hc3NldHMvYXNzZXQtaGFuZGxlci9jb25maWcnKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlcignY29jb3MtY2xpJywgYXNzZXRIYW5kbGVySW5mb3MsIHRydWUpO1xuICAgICAgICBBc3NldEhhbmRsZXJNYW5hZ2VyLmNyZWF0ZVRlbXBsYXRlUm9vdCA9IGFzc2V0Q29uZmlnLmRhdGEuY3JlYXRlVGVtcGxhdGVSb290O1xuICAgICAgICBjb25zdCB7IGNvbXBpbGVFZmZlY3QsIHN0YXJ0QXV0b0dlbkVmZmVjdEJpbiwgZ2V0RWZmZWN0QmluUGF0aCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hc3NldC1oYW5kbGVyJyk7XG4gICAgICAgIHRoaXMuY29tcGlsZUVmZmVjdCA9IGNvbXBpbGVFZmZlY3Q7XG4gICAgICAgIHRoaXMuc3RhcnRBdXRvR2VuRWZmZWN0QmluID0gc3RhcnRBdXRvR2VuRWZmZWN0QmluO1xuICAgICAgICB0aGlzLmdldEVmZmVjdEJpblBhdGggPSBnZXRFZmZlY3RCaW5QYXRoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa/gOa0u+WJqeS9meacquazqOWGjOWujOaIkOeahOi1hOa6kOWkhOeQhuWZqFxuICAgICAqL1xuICAgIGFzeW5jIGFjdGl2YXRlUmVnaXN0ZXJBbGwoKSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC52YWx1ZXModGhpcy5uYW1lMnJlZ2lzdGVySW5mbykubWFwKChpbmZvKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBsYXp5IHJlZ2lzdGVyIGFzc2V0IGhhbmRsZXIgJHtpbmZvLm5hbWV9YCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZVJlZ2lzdGVyKGluZm8pO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBlbnN1cmVIYW5kbGVyKGltcG9ydGVyOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLm5hbWUyaGFuZGxlcltpbXBvcnRlcl07XG4gICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlZ2lzdGVySW5mbyA9IHRoaXMubmFtZTJyZWdpc3RlckluZm9baW1wb3J0ZXJdO1xuICAgICAgICBpZiAoIXJlZ2lzdGVySW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0aXZhdGVSZWdpc3RlcihyZWdpc3RlckluZm8pO1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lMmhhbmRsZXJbaW1wb3J0ZXJdO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYWN0aXZhdGVSZWdpc3RlcihyZWdpc3RlckluZm9zOiBIYW5kbGVySW5mbykge1xuICAgICAgICBjb25zdCB7IHBrZ05hbWUsIG5hbWUsIGV4dGVuc2lvbnMsIGludGVybmFsIH0gPSByZWdpc3RlckluZm9zO1xuICAgICAgICBpZiAodGhpcy5uYW1lMmltcG9ydGVyW25hbWVdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lMmltcG9ydGVyW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldEhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IGF3YWl0IHJlZ2lzdGVySW5mb3MubG9hZCgpO1xuICAgICAgICAgICAgaWYgKGFzc2V0SGFuZGxlcikge1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZTJoYW5kbGVyW25hbWVdID0gT2JqZWN0LmFzc2lnbihhc3NldEhhbmRsZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbToge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGtnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4dGVuZHNIYW5kbGVyTmFtZSA9IChhc3NldEhhbmRsZXIgYXMgQ3VzdG9tQXNzZXRIYW5kbGVyKS5leHRlbmRzO1xuICAgICAgICAgICAgICAgIGlmIChleHRlbmRzSGFuZGxlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5hbWUyaGFuZGxlcltleHRlbmRzSGFuZGxlck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDYW4gbm90IGZpbmQgZXh0ZW5kIGFzc2V0LWhhbmRsZXIgJHtleHRlbmRzSGFuZGxlck5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5uYW1lMmhhbmRsZXJbbmFtZV0uYXNzZXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IHRoaXMubmFtZTJoYW5kbGVyW25hbWVdLmFzc2V0VHlwZSE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlMmhhbmRsZXJbdHlwZV0gPSAodGhpcy50eXBlMmhhbmRsZXJbdHlwZV0gfHwgW10pLmNvbmNhdChbdGhpcy5uYW1lMmhhbmRsZXJbbmFtZV1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZTJoYW5kbGVyW25hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5uYW1lMmhhbmRsZXJbZXh0ZW5kc0hhbmRsZXJOYW1lXSwgdGhpcy5uYW1lMmhhbmRsZXJbbmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUyaGFuZGxlcltuYW1lXS5pbXBvcnRlciA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMubmFtZTJoYW5kbGVyW2V4dGVuZHNIYW5kbGVyTmFtZV0uaW1wb3J0ZXIsIHRoaXMubmFtZTJoYW5kbGVyW25hbWVdLmltcG9ydGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubmFtZTJoYW5kbGVyW25hbWVdLmFzc2V0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5uYW1lMmhhbmRsZXJbbmFtZV0uYXNzZXRUeXBlITtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlMmhhbmRsZXJbdHlwZV0gPSAodGhpcy50eXBlMmhhbmRsZXJbdHlwZV0gfHwgW10pLmNvbmNhdChbdGhpcy5uYW1lMmhhbmRsZXJbbmFtZV1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5pS26ZuG6buY6K6k6YWN572u77yM5rOo5YaM5Yiw5a+85YWl57O757uf5YaFXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0SGFuZGxlci51c2VyRGF0YUNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBhc3NldEhhbmRsZXIudXNlckRhdGFDb25maWcuZGVmYXVsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VzZXJEYXRhQ2FjaGVbbmFtZV0gJiYgdGhpcy5fdXNlckRhdGFDYWNoZVtuYW1lXVtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRIYW5kbGVyLnVzZXJEYXRhQ29uZmlnLmRlZmF1bHRba2V5XS5kZWZhdWx0ID0gdGhpcy5fdXNlckRhdGFDYWNoZVtuYW1lXVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFt1bmRlZmluZWQsIG51bGxdLmluY2x1ZGVzKGFzc2V0SGFuZGxlci51c2VyRGF0YUNvbmZpZy5kZWZhdWx0W2tleV0uZGVmYXVsdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZGFzaC5zZXQodGhpcy5fZGVmYXVsdFVzZXJEYXRhLCBgJHtuYW1lfS4ke2tleX1gLCBhc3NldEhhbmRsZXIudXNlckRhdGFDb25maWcuZGVmYXVsdFtrZXldLmRlZmF1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVVc2VyRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLih0aGlzLl9kZWZhdWx0VXNlckRhdGFbbmFtZV0gfHwge30pLFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uKHRoaXMuX3VzZXJEYXRhQ2FjaGVbbmFtZV0gfHwge30pLFxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbWJpbmVVc2VyRGF0YSkubGVuZ3RoICYmIHNldERlZmF1bHRVc2VyRGF0YShuYW1lLCBjb21iaW5lVXNlckRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lMmltcG9ydGVyW25hbWVdID0gbmV3IEN1c3RvbUltcG9ydGVyKGV4dGVuc2lvbnMsIHRoaXMubmFtZTJoYW5kbGVyW25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm5hbWUycmVnaXN0ZXJJbmZvW25hbWVdO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZWdpc3RlciBhc3NldC1oYW5kbGVyICR7bmFtZX0gZmFpbGVkIWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyKHBrZ05hbWU6IHN0cmluZywgYXNzZXRIYW5kbGVySW5mb3M6IEFzc2V0SGFuZGxlckluZm9bXSwgaW50ZXJuYWw6IGJvb2xlYW4pIHtcbiAgICAgICAgYXNzZXRIYW5kbGVySW5mb3MuZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgLy8g5pyq5Lyg6YCSIGV4dG5hbWUg55qE6KeG5Li65a2Q6LWE5rqQ5a+85YWl5Zmo77yMZXh0bmFtZSA9ICctJ1xuICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9ucyA9IGluZm8uZXh0ZW5zaW9ucyAmJiBpbmZvLmV4dGVuc2lvbnMubGVuZ3RoID8gaW5mby5leHRlbnNpb25zIDogWyctJ107XG4gICAgICAgICAgICB0aGlzLm5hbWUycmVnaXN0ZXJJbmZvW2luZm8ubmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgLi4uaW5mbyxcbiAgICAgICAgICAgICAgICBwa2dOYW1lLFxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgICAgaW50ZXJuYWwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZXh0ZW5zaW9ucy5mb3JFYWNoKChleHRuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRuYW1lMnJlZ2lzdGVySW5mb1tleHRuYW1lXSA9IHRoaXMuZXh0bmFtZTJyZWdpc3RlckluZm9bZXh0bmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgdGhpcy5leHRuYW1lMnJlZ2lzdGVySW5mb1tleHRuYW1lXS5wdXNoKHRoaXMubmFtZTJyZWdpc3RlckluZm9baW5mby5uYW1lXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5yZWdpc3Rlcihwa2dOYW1lOiBzdHJpbmcsIGFzc2V0SGFuZGxlckluZm9zOiBBc3NldEhhbmRsZXJJbmZvW10pIHtcbiAgICAgICAgYXNzZXRIYW5kbGVySW5mb3MuZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMubmFtZTJyZWdpc3RlckluZm9baW5mby5uYW1lXTtcbiAgICAgICAgICAgIGluZm8uZXh0ZW5zaW9ucy5mb3JFYWNoKChleHRuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmV4dG5hbWUycmVnaXN0ZXJJbmZvW2V4dG5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5leHRuYW1lMnJlZ2lzdGVySW5mb1tleHRuYW1lXSA9IHRoaXMuZXh0bmFtZTJyZWdpc3RlckluZm9bZXh0bmFtZV0uZmlsdGVyKChpbmZvKSA9PiBpbmZvLnBrZ05hbWUgPT09IHBrZ05hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmV4dG5hbWUycmVnaXN0ZXJJbmZvWyctJ10gPSB0aGlzLmV4dG5hbWUycmVnaXN0ZXJJbmZvWyctJ10uZmlsdGVyKChpbmZvKSA9PiBpbmZvLnBrZ05hbWUgPT09IHBrZ05hbWUpO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZpbmRJbXBvcnRlcihhc3NldDogSUFzc2V0LCB3aXRob3V0RGVmYXVsdEltcG9ydGVyPzogYm9vbGVhbik6IFByb21pc2U8QXNzZXREQkltcG9ydGVyIHwgbnVsbD4ge1xuICAgICAgICBsZXQgZXh0bmFtZSA9ICcnO1xuICAgICAgICBpZiAoYXNzZXQgaW5zdGFuY2VvZiBBc3NldCAmJiBhc3NldC5leHRuYW1lKSB7XG4gICAgICAgICAgICBleHRuYW1lID0gYXNzZXQuZXh0bmFtZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDlsJ3or5Xkvb/nlKjmoIforrDnmoTlr7zlhaXlmagsICog55qE5a+85YWl5Zmo5piv5q+P5qyh5om+5LiN5Yiw5ZCI6YCC5a+85YWl5Zmo5pe25omN5Lya6LWw55qE77yM5YaN5qyh6L+b5YWl5pe26KaB6YeN5paw6LWw5rWB56iL5p+l5om+5a+85YWl5ZmoXG4gICAgICAgIGlmIChhc3NldC5tZXRhLmltcG9ydGVyICYmIGFzc2V0Lm1ldGEuaW1wb3J0ZXIgIT09ICcqJykge1xuICAgICAgICAgICAgbGV0IGltcG9ydGVyOiBBc3NldERCSW1wb3J0ZXIgfCBudWxsID0gdGhpcy5uYW1lMmltcG9ydGVyW2Fzc2V0Lm1ldGEuaW1wb3J0ZXJdO1xuICAgICAgICAgICAgaWYgKGltcG9ydGVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGltcG9ydGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVnaXN0ZXJJbmZvID0gdGhpcy5uYW1lMnJlZ2lzdGVySW5mb1thc3NldC5tZXRhLmltcG9ydGVyXTtcbiAgICAgICAgICAgIGlmIChyZWdpc3RlckluZm8pIHtcbiAgICAgICAgICAgICAgICBpbXBvcnRlciA9IGF3YWl0IHRoaXMuYWN0aXZhdGVSZWdpc3RlcihyZWdpc3RlckluZm8pO1xuICAgICAgICAgICAgICAgIC8vIOS4juagh+iusOWvvOWFpeWZqOS4gOiHtOeahOS4jemcgOimgei1sOajgOmqjFxuICAgICAgICAgICAgICAgIGlmIChpbXBvcnRlciAmJiBpbXBvcnRlci5uYW1lID09PSBhc3NldC5tZXRhLmltcG9ydGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbXBvcnRlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDkuIrpnaLnmoTpgLvovpHotbDlrozov5jmsqHmnInmib7liLDlr7zlhaXlmajvvIzliJnor7TmmI7ku6XlvoDmoIforrDnmoTlr7zlhaXlmajlt7Lnu4/ml6Dms5Xmib7liLDvvIzpnIDopoHmiqXplJnvvIzkuYvlkI7ph43mlrDlr7vmib7lkIjpgILnmoTlr7zlhaXlmahcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDYW4gbm90IGZpbmQgdGhlIGltcG9ydGVyICR7YXNzZXQubWV0YS5pbXBvcnRlcn0gaW4gZWRpdG9yYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsJ3or5XpgJrov4flkI7nvIDmib7liLDpgILlkIjov5nkuKrotYTmupDnmoTlr7zlhaXlmahcbiAgICAgICAgY29uc3QgcmVnaXN0ZXJJbmZvcyA9IHRoaXMuZXh0bmFtZTJyZWdpc3RlckluZm9bZXh0bmFtZV0gfHwgW107XG4gICAgICAgIGlmIChyZWdpc3RlckluZm9zLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW1wb3J0ZXIgPSBhd2FpdCB0aGlzLl9maW5kSW1wb3J0ZXJJblJlZ2lzdGVySW5mbyhhc3NldCwgcmVnaXN0ZXJJbmZvcyk7XG4gICAgICAgICAgICBpZiAoaW1wb3J0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW1wb3J0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAod2l0aG91dERlZmF1bHRJbXBvcnRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmib7kuI3liLDlkIjpgILotYTmupDnmoTlr7zlhaXlmajvvIzlsJ3or5Xkvb/nlKjpgJrov4flr7zlhaXlmahcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0RGVmYXVsdEltcG9ydGVyKGFzc2V0KTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXREZWZhdWx0SW1wb3J0ZXIoYXNzZXQ6IElBc3NldCkge1xuICAgICAgICByZXR1cm4gKGF3YWl0IHRoaXMuX2ZpbmRJbXBvcnRlckluUmVnaXN0ZXJJbmZvKGFzc2V0LCB0aGlzLmV4dG5hbWUycmVnaXN0ZXJJbmZvWycqJ10gfHwgW10pIHx8IG51bGwpO1xuICAgIH1cblxuICAgIGFzeW5jIF9maW5kSW1wb3J0ZXJJblJlZ2lzdGVySW5mbyhhc3NldDogSUFzc2V0LCByZWdpc3RlckluZm9zOiBIYW5kbGVySW5mb1tdKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSByZWdpc3RlckluZm9zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCB7IG5hbWUgfSA9IHJlZ2lzdGVySW5mb3NbaV07XG4gICAgICAgICAgICAvLyDmnInlj6/og73lnKjnrKzkuIDmraXnmoTmtYHnqIvph4zlt7Lnu4/ojrflj5bliLDnvJPlrZjlnKggbmFtZTJpbXBvcnRlciDlhoXkuoZcbiAgICAgICAgICAgIGxldCBpbXBvcnRlcjogQXNzZXREQkltcG9ydGVyIHwgbnVsbCA9IHRoaXMubmFtZTJpbXBvcnRlcltuYW1lXTtcbiAgICAgICAgICAgIGlmICghaW1wb3J0ZXIpIHtcbiAgICAgICAgICAgICAgICBpbXBvcnRlciA9IGF3YWl0IHRoaXMuYWN0aXZhdGVSZWdpc3RlcihyZWdpc3RlckluZm9zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaW1wb3J0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGUgPSBhd2FpdCBpbXBvcnRlci52YWxpZGF0ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbXBvcnRlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW1wb3J0ZXIoJHtuYW1lfSkgdmFsaWRhdGUgZmFpbGVkOiAke2Fzc2V0LnV1aWR9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChhc3NldEhhbmRsZXI6IEFzc2V0SGFuZGxlciwgZXh0ZW5zaW9uczogc3RyaW5nW10pIHtcbiAgICAgICAgLy8g5aaC5p6c5bey57uP5a2Y5Zyo5ZCM5ZCN55qE5a+85YWl5Zmo5YiZ6Lez6L+HXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGFzc2V0SGFuZGxlci5uYW1lICE9PSAnKicgJiZcbiAgICAgICAgICAgIHRoaXMubmFtZTJoYW5kbGVyW2Fzc2V0SGFuZGxlci5uYW1lXSAmJlxuICAgICAgICAgICAgdGhpcy5uYW1lMmhhbmRsZXJbYXNzZXRIYW5kbGVyLm5hbWVdICE9PSBhc3NldEhhbmRsZXJcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFRoZSBBc3NldEhhbmRsZXJbJHthc3NldEhhbmRsZXIubmFtZX1dIGlzIGFscmVhZHkgcmVnaXN0ZXJlZC5gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmFtZTJoYW5kbGVyW2Fzc2V0SGFuZGxlci5uYW1lXSA9IGFzc2V0SGFuZGxlcjtcblxuICAgICAgICBjb25zdCBpbXBvcnRlciA9IG5ldyBDdXN0b21JbXBvcnRlcihleHRlbnNpb25zLCBhc3NldEhhbmRsZXIpO1xuICAgICAgICB0aGlzLm5hbWUyaW1wb3J0ZXJbYXNzZXRIYW5kbGVyLm5hbWVdID0gaW1wb3J0ZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5ZCE5Liq6LWE5rqQ55qE5paw5bu65YiX6KGo5pWw5o2uXG4gICAgICovXG4gICAgYXN5bmMgZ2V0Q3JlYXRlTWFwKCk6IFByb21pc2U8SUNyZWF0ZU1lbnVJbmZvW10+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBPbWl0PElDcmVhdGVNZW51SW5mbywgJ2NyZWF0ZSc+W10gPSBbXTtcbiAgICAgICAgY29uc3QgaW1wb3J0ZXJzID0gQXJyYXkuZnJvbShuZXcgU2V0KFtcbiAgICAgICAgICAgIC4uLk9iamVjdC5rZXlzKHRoaXMubmFtZTJyZWdpc3RlckluZm8pLFxuICAgICAgICAgICAgLi4uT2JqZWN0LmtleXModGhpcy5uYW1lMmhhbmRsZXIpLFxuICAgICAgICBdKSk7XG4gICAgICAgIGZvciAoY29uc3QgaW1wb3J0ZXIgb2YgaW1wb3J0ZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVNZW51ID0gYXdhaXQgdGhpcy5nZXRDcmVhdGVNZW51QnlOYW1lKGltcG9ydGVyKTtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLmNyZWF0ZU1lbnUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQubWFwKChpdGVtKSA9PiB0cmFuc2xhdGVDcmVhdGVNZW51SW5mbyhpdGVtKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC55o2u5a+85YWl5Zmo5ZCN56ew6I635Y+W6LWE5rqQ5qih5p2/5L+h5oGvXG4gICAgICogQHBhcmFtIGltcG9ydGVyIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGdldENyZWF0ZU1lbnVCeU5hbWUoaW1wb3J0ZXI6IHN0cmluZyk6IFByb21pc2U8SUNyZWF0ZU1lbnVJbmZvW10+IHtcbiAgICAgICAgY29uc3QgaGFuZGxlciA9IGF3YWl0IHRoaXMuZW5zdXJlSGFuZGxlcihpbXBvcnRlcik7XG4gICAgICAgIGlmICghaGFuZGxlciB8fCAhaGFuZGxlci5jcmVhdGVJbmZvIHx8ICFoYW5kbGVyLmNyZWF0ZUluZm8uZ2VuZXJhdGVNZW51SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgZ2VuZXJhdGVNZW51SW5mbywgcHJldmVudERlZmF1bHRUZW1wbGF0ZU1lbnUgfSA9IGhhbmRsZXIuY3JlYXRlSW5mbztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRNZW51SW5mbyA9IGF3YWl0IGdlbmVyYXRlTWVudUluZm8oKTtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlRGlyID0gZ2V0VXNlclRlbXBsYXRlRGlyKGltcG9ydGVyKTtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZXMgPSBwcmV2ZW50RGVmYXVsdFRlbXBsYXRlTWVudSA/IFtdIDogYXdhaXQgcXVlcnlVc2VyVGVtcGxhdGVzKHRlbXBsYXRlRGlyKTtcbiAgICAgICAgICAgIC8vIFRPRE8g57uf5LiA5ZG95ZCN5Li6IGV4dGVuc2lvbnNcbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbnMgPSB0aGlzLm5hbWUyaW1wb3J0ZXJbaW1wb3J0ZXJdLmV4dG5hbWVzO1xuICAgICAgICAgICAgLy8g5aaC5p6c5a2Y5Zyo5ZCO57yA5YiZ6L+H5ruk5LiN5ZCI5rOV5ZCO57yA55qE5qih5p2/5pWw5o2u77yM5peg5ZCO57yA5L2c5Li65q2j5bi45qih5p2/5aSE55CG77yI5Li76KaB5YW85a655pen54mI5pys5peg5ZCO57yA55qE6LWE5rqQ5qih5p2/5pS+572u5pa55byP77yJXG4gICAgICAgICAgICB0ZW1wbGF0ZXMgPSB0ZW1wbGF0ZXMuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0TmFtZSA9IGV4dG5hbWUoZmlsZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFleHROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9ucy5pbmNsdWRlcyhleHROYW1lKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBjcmVhdGVNZW51OiBJQ3JlYXRlTWVudUluZm9bXSA9IFtdO1xuICAgICAgICAgICAgZGVmYXVsdE1lbnVJbmZvLmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAvLyDlrZjlnKjnlKjmiLfmqKHmnb/ml7bmo4Dmn6XmmK/lkKbmnInopobnm5bpu5jorqTmqKHmnb/nmoTmg4XlhrVcbiAgICAgICAgICAgICAgICBpZiAoaW5mby50ZW1wbGF0ZSAmJiB0ZW1wbGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJUZW1wbGF0ZUluZGV4ID0gdGVtcGxhdGVzLmZpbmRJbmRleCgodGVtcGxhdGVQYXRoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmFzZW5hbWUodGVtcGxhdGVQYXRoKSA9PT0gYmFzZW5hbWUoaW5mby50ZW1wbGF0ZSEpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJUZW1wbGF0ZUluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mbyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoaW5mbykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50ZW1wbGF0ZSA9IHRlbXBsYXRlc1t1c2VyVGVtcGxhdGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZXMuc3BsaWNlKHVzZXJUZW1wbGF0ZUluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcmVhdGVNZW51LnB1c2gocGF0Y2hIYW5kbGVyKGluZm8sIGltcG9ydGVyLCBleHRlbnNpb25zKSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g5LiO6buY6K6k5qih5p2/6Z2e5ZCM5ZCN55qE5qih5p2/5paH5Lu25Li655So5oi36Ieq5a6a5LmJ5qih5p2/XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVzLmxlbmd0aCAmJiBjcmVhdGVNZW51Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlcy5mb3JFYWNoKCh0ZW1wbGF0ZVBhdGgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTWVudS5wdXNoKHBhdGNoSGFuZGxlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogYmFzZW5hbWUodGVtcGxhdGVQYXRoLCBleHRuYW1lKHRlbXBsYXRlUGF0aCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKHRlbXBsYXRlUGF0aCwgZXh0bmFtZSh0ZW1wbGF0ZVBhdGgpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxGaWxlTmFtZTogYmFzZW5hbWUodGVtcGxhdGVQYXRoLCBleHRuYW1lKHRlbXBsYXRlUGF0aCkpLFxuICAgICAgICAgICAgICAgICAgICB9LCBpbXBvcnRlciwgZXh0ZW5zaW9ucykpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlTWVudTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEdlbmVyYXRlIGNyZWF0ZSBsaXN0IGluIGhhbmRsZXIgJHtpbXBvcnRlcn0gZmFpbGVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICog55Sf5oiQ5Yib5bu66LWE5rqQ5qih5p2/XG4gICAgICogQHBhcmFtIGltcG9ydGVyIFxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZUFzc2V0VGVtcGxhdGUoaW1wb3J0ZXI6IHN0cmluZywgdGVtcGxhdGVQYXRoOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRlbXBsYXRlUGF0aCA9IGlzQWJzb2x1dGUodGVtcGxhdGVQYXRoKSA/IHRlbXBsYXRlUGF0aCA6IHVybDJwYXRoKHRlbXBsYXRlUGF0aCk7XG4gICAgICAgIGlmICghdGVtcGxhdGVQYXRoIHx8ICFleGlzdHNTeW5jKHRlbXBsYXRlUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhc3NldFRlbXBsYXRlRGlyID0gZ2V0VXNlclRlbXBsYXRlRGlyKGltcG9ydGVyKTtcbiAgICAgICAgYXdhaXQgY3JlYXRlRGlyZWN0b3J5UGF0aChhc3NldFRlbXBsYXRlRGlyKTtcbiAgICAgICAgYXdhaXQgY29weVBhdGgodGVtcGxhdGVQYXRoLCB0YXJnZXQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rotYTmupBcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIOi/lOWbnui1hOa6kOWIm+W7uuWcsOWdgFxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZUFzc2V0KG9wdGlvbnM6IENyZWF0ZUFzc2V0T3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIG9wdGlvbnMucmVuYW1lID0gb3B0aW9ucy5yZW5hbWUgPz8gdHJ1ZTtcbiAgICAgICAgaWYgKCFvcHRpb25zLmhhbmRsZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZ2lzdGVySW5mb3MgPSB0aGlzLmV4dG5hbWUycmVnaXN0ZXJJbmZvW2V4dG5hbWUob3B0aW9ucy50YXJnZXQpXTtcbiAgICAgICAgICAgIG9wdGlvbnMuaGFuZGxlciA9IHJlZ2lzdGVySW5mb3MgJiYgcmVnaXN0ZXJJbmZvcy5sZW5ndGggPyByZWdpc3RlckluZm9zWzBdLm5hbWUgOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5oYW5kbGVyKSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldEhhbmRsZXIgPSB0aGlzLm5hbWUyaGFuZGxlcltvcHRpb25zLmhhbmRsZXJdO1xuICAgICAgICAgICAgaWYgKGFzc2V0SGFuZGxlciAmJiBhc3NldEhhbmRsZXIuY3JlYXRlSW5mbyAmJiBhc3NldEhhbmRsZXIuY3JlYXRlSW5mby5jcmVhdGUpIHtcbiAgICAgICAgICAgICAgICAvLyDkvJjlhYjkvb/nlKjoh6rlrprkuYnnmoTliJvlu7rmlrnms5XvvIzoi6XliJvlu7rnu5PmnpzkuI3lrZjlnKjliJnotbDpu5jorqTnmoTliJvlu7rmtYHnqItcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhc3NldEhhbmRsZXIuY3JlYXRlSW5mby5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgYWZ0ZXJDcmVhdGVBc3NldChyZXN1bHQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5jb250ZW50ID09PSB1bmRlZmluZWQgfHwgb3B0aW9ucy5jb250ZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpznu5nlrprkuobmqKHmnb/kv6Hmga/vvIzkvb/nlKggZGIg6buY6K6k55qE5Yib5bu65ou36LSd5pa55byPXG4gICAgICAgICAgICBpZiAob3B0aW9ucy50ZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSB1cmwycGF0aChvcHRpb25zLnRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb3B5UGF0aChwYXRoLCBvcHRpb25zLnRhcmdldCwgeyBvdmVyd3JpdGU6IG9wdGlvbnMub3ZlcndyaXRlIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBhZnRlckNyZWF0ZUFzc2V0KG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMudGFyZ2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnRlbnQg5LiN5a2Y5Zyo77yM5paw5bu65LiA5Liq5paH5Lu25aS5XG4gICAgICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnlQYXRoKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEJ1ZmZlcnMgYXJlIGFscmVhZHkgYSBmaWxlc3lzdGVtIHdyaXRlIHR5cGU7IHNlcmlhbGl6aW5nIG9uZSB3b3VsZCBjb3JydXB0IGJpbmFyeSBhc3NldHMuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29udGVudCA9PT0gJ29iamVjdCcgJiYgIUJ1ZmZlci5pc0J1ZmZlcihvcHRpb25zLmNvbnRlbnQpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5jb250ZW50LCBudWxsLCA0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vcm1hbGl6ZSBFT0wgZm9yIHN0cmluZyBjb250ZW50XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29udGVudCA9PT0gJ3N0cmluZycgJiYgb3B0aW9ucy5oYW5kbGVyID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBlb2wuYXV0byhvcHRpb25zLmNvbnRlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g6YOo5YiG6Ieq5a6a5LmJ5Yib5bu66LWE5rqQ5rKh5pyJ5qih5p2/77yM5YaF5a655Li656m677yM5Y+q6ZyA6KaB5LiA5Liq56m65paH5Lu25Y2z5Y+v5a6M5oiQ5Yib5bu6XG4gICAgICAgICAgICBhd2FpdCB3cml0ZVBhdGgob3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgYWZ0ZXJDcmVhdGVBc3NldChvcHRpb25zLnRhcmdldCwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBvcHRpb25zLnRhcmdldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDosIPnlKjoh6rlrprkuYnnmoTplIDmr4HotYTmupDmtYHnqItcbiAgICAgKiBAcGFyYW0gYXNzZXQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZGVzdHJveUFzc2V0KGFzc2V0OiBJQXNzZXQpIHtcbiAgICAgICAgY29uc3QgYXNzZXRIYW5kbGVyID0gdGhpcy5uYW1lMmhhbmRsZXJbYXNzZXQubWV0YS5pbXBvcnRlcl07XG4gICAgICAgIGlmIChhc3NldEhhbmRsZXIgJiYgYXNzZXRIYW5kbGVyLmRlc3Ryb3kpIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBhc3NldEhhbmRsZXIuZGVzdHJveShhc3NldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBzYXZlQXNzZXQoYXNzZXQ6IElBc3NldCwgY29udGVudDogc3RyaW5nIHwgQnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0SGFuZGxlciA9IHRoaXMubmFtZTJoYW5kbGVyW2Fzc2V0Lm1ldGEuaW1wb3J0ZXJdO1xuICAgICAgICBpZiAoYXNzZXRIYW5kbGVyICYmIGFzc2V0SGFuZGxlci5jcmVhdGVJbmZvICYmIGFzc2V0SGFuZGxlci5jcmVhdGVJbmZvLnNhdmUpIHtcbiAgICAgICAgICAgIC8vIOS8mOWFiOS9v+eUqOiHquWumuS5ieeahOS/neWtmOaWueazlVxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGFzc2V0SGFuZGxlci5jcmVhdGVJbmZvLnNhdmUoYXNzZXQsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vcm1hbGl6ZSBFT0wgZm9yIHN0cmluZyBjb250ZW50XG4gICAgICAgIGlmICh0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycgJiYgYXNzZXQubWV0YS5pbXBvcnRlciA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gZW9sLmF1dG8oY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgd3JpdGVQYXRoKGFzc2V0LnNvdXJjZSwgY29udGVudCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlRXhwb3J0RGF0YShhc3NldDogSUFzc2V0LCBvcHRpb25zPzogSUV4cG9ydE9wdGlvbnMpOiBQcm9taXNlPElFeHBvcnREYXRhIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBhc3NldEhhbmRsZXIgPSB0aGlzLm5hbWUyaGFuZGxlclthc3NldC5tZXRhLmltcG9ydGVyXTtcbiAgICAgICAgaWYgKCFhc3NldEhhbmRsZXIgfHwgIWFzc2V0SGFuZGxlci5leHBvcnRlciB8fCAhYXNzZXRIYW5kbGVyLmV4cG9ydGVyLmdlbmVyYXRlRXhwb3J0RGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXdhaXQgYXNzZXRIYW5kbGVyLmV4cG9ydGVyLmdlbmVyYXRlRXhwb3J0RGF0YShhc3NldCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ou36LSd55Sf5oiQ5a+85YWl5paH5Lu25Yiw5pyA57uI55uu5qCH5Zyw5Z2AXG4gICAgICogQHBhcmFtIGhhbmRsZXIgXG4gICAgICogQHBhcmFtIHNyYyBcbiAgICAgKiBAcGFyYW0gZGVzdCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBvdXRwdXRFeHBvcnREYXRhKGhhbmRsZXI6IHN0cmluZywgc3JjOiBJRXhwb3J0RGF0YSwgZGVzdDogSUV4cG9ydERhdGEpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgYXNzZXRIYW5kbGVyID0gdGhpcy5uYW1lMmhhbmRsZXJbaGFuZGxlcl07XG4gICAgICAgIGlmICghYXNzZXRIYW5kbGVyIHx8ICFhc3NldEhhbmRsZXIuZXhwb3J0ZXIgfHwgIWFzc2V0SGFuZGxlci5leHBvcnRlci5vdXRwdXRFeHBvcnREYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXdhaXQgYXNzZXRIYW5kbGVyLmV4cG9ydGVyLm91dHB1dEV4cG9ydERhdGEoc3JjLCBkZXN0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LlkITkuKrotYTmupDnmoTln7rmnKzphY3nva4gTUFQXG4gICAgICovXG4gICAgYXN5bmMgcXVlcnlSYXdBc3NldENvbmZpZ01hcCgpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIElBc3NldENvbmZpZz4+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5hY3RpdmF0ZVJlZ2lzdGVyQWxsKCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBJQXNzZXRDb25maWc+ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgaW1wb3J0ZXIgb2YgT2JqZWN0LmtleXModGhpcy5uYW1lMmhhbmRsZXIpKSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5uYW1lMmhhbmRsZXJbaW1wb3J0ZXJdO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnOiBJQXNzZXRDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IGhhbmRsZXIuZGlzcGxheU5hbWUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGhhbmRsZXIuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgZG9jVVJMOiBoYW5kbGVyLmRvY1VSTCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChoYW5kbGVyLnVzZXJEYXRhQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnVzZXJEYXRhQ29uZmlnID0gaGFuZGxlci51c2VyRGF0YUNvbmZpZy5kZWZhdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0W2ltcG9ydGVyXSA9IGNvbmZpZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IGxvY2FsaXplZCBhc3NldCBjb25maWcgbWFwLlxuICAgICAqL1xuICAgIGFzeW5jIHF1ZXJ5QXNzZXRDb25maWdNYXAoKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBJQXNzZXRDb25maWc+PiB7XG4gICAgICAgIGNvbnN0IHJhd0NvbmZpZ01hcCA9IGF3YWl0IHRoaXMucXVlcnlSYXdBc3NldENvbmZpZ01hcCgpO1xuICAgICAgICByZXR1cm4gbG9jYWxpemVBc3NldENvbmZpZ01hcChyYXdDb25maWdNYXApO1xuICAgIH1cblxuICAgIHF1ZXJ5VGh1bWJuYWlsSGFuZGxlcnMoKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uYW1lMmhhbmRsZXIpXG4gICAgICAgICAgICAuZmlsdGVyKG5hbWUgPT4gdHlwZW9mIHRoaXMubmFtZTJoYW5kbGVyW25hbWVdLmdlbmVyYXRlVGh1bWJuYWlsID09PSAnZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZVRodW1ibmFpbChhc3NldDogSUFzc2V0LCBzaXplPzogVGh1bWJuYWlsU2l6ZSk6IFByb21pc2U8VGh1bWJuYWlsSW5mbyB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMubmFtZTJoYW5kbGVyW2Fzc2V0Lm1ldGEuaW1wb3J0ZXJdO1xuICAgICAgICBpZiAoaGFuZGxlciAmJiB0eXBlb2YgaGFuZGxlci5nZW5lcmF0ZVRodW1ibmFpbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuZ2VuZXJhdGVUaHVtYm5haWwoYXNzZXQsIHNpemUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5VXNlckRhdGFDb25maWcoYXNzZXQ6IElBc3NldCkge1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXNzZXRIYW5kbGVyID0gdGhpcy5uYW1lMmhhbmRsZXJbYXNzZXQubWV0YS5pbXBvcnRlcl07XG4gICAgICAgIGlmICghYXNzZXRIYW5kbGVyIHx8ICFhc3NldEhhbmRsZXIudXNlckRhdGFDb25maWcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYXNzZXRIYW5kbGVyLnVzZXJEYXRhQ29uZmlnLmdlbmVyYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXRIYW5kbGVyLnVzZXJEYXRhQ29uZmlnLmRlZmF1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXdhaXQgYXNzZXRIYW5kbGVyLnVzZXJEYXRhQ29uZmlnLmdlbmVyYXRlKGFzc2V0KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeVVzZXJEYXRhQ29uZmlnRGVmYXVsdChpbXBvcnRlcjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0SGFuZGxlciA9IHRoaXMubmFtZTJoYW5kbGVyW2ltcG9ydGVyXTtcbiAgICAgICAgaWYgKCFhc3NldEhhbmRsZXIgfHwgIWFzc2V0SGFuZGxlci51c2VyRGF0YUNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3NldEhhbmRsZXIudXNlckRhdGFDb25maWcuZGVmYXVsdDtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeVByb3BlcnR5U2NoZW1hKGltcG9ydGVyOiBzdHJpbmcpOiBQcm9taXNlPEFzc2V0UHJvcGVydHlTY2hlbWFNYXA+IHtcbiAgICAgICAgY29uc3QgYXNzZXRIYW5kbGVyID0gYXdhaXQgdGhpcy5lbnN1cmVIYW5kbGVyKGltcG9ydGVyKTtcbiAgICAgICAgaWYgKCFhc3NldEhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgaGFuZGxlciBub3QgZm91bmQ6ICR7aW1wb3J0ZXJ9YCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3JlYXRlQXNzZXRQcm9wZXJ0eVNjaGVtYU1hcChhc3NldEhhbmRsZXIucHJvcGVydHlTY2hlbWFDb25maWcpO1xuICAgIH1cblxuICAgIGFzeW5jIHJ1bkltcG9ydGVySG9vayhhc3NldDogSUFzc2V0LCBob29rTmFtZTogJ2JlZm9yZScgfCAnYWZ0ZXInKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0SGFuZGxlciA9IHRoaXMubmFtZTJoYW5kbGVyW2Fzc2V0Lm1ldGEuaW1wb3J0ZXJdO1xuICAgICAgICAvLyAxLiDlhYjmiafooYzotYTmupDlpITnkIblmajlhoXnmoTpkqnlrZBcbiAgICAgICAgaWYgKGFzc2V0SGFuZGxlciAmJiBhc3NldEhhbmRsZXIuaW1wb3J0ZXIgJiYgdHlwZW9mIChhc3NldEhhbmRsZXIuaW1wb3J0ZXIgYXMgSW1wb3J0ZXJIb29rKVtob29rTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgKGFzc2V0SGFuZGxlci5pbXBvcnRlciBhcyBJbXBvcnRlckhvb2spW2hvb2tOYW1lXSEoYXNzZXQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBydW4gJHtob29rTmFtZX0gaG9vayBmYWlsZWQhYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiDlho3miafooYzmianlsZXms6jlhoznmoTpkqnlrZBcbiAgICAgICAgY29uc3QgY3VzdG9tSGFuZGxlcnMgPSB0aGlzLmltcG9ydGVyMmN1c3RvbVthc3NldC5tZXRhLmltcG9ydGVyXTtcbiAgICAgICAgaWYgKCFjdXN0b21IYW5kbGVycyB8fCAhY3VzdG9tSGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGN1c3RvbUhhbmRsZXIgb2YgY3VzdG9tSGFuZGxlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhvb2sgPSBjdXN0b21IYW5kbGVyLmltcG9ydGVyICYmIGN1c3RvbUhhbmRsZXIuaW1wb3J0ZXJbaG9va05hbWVdO1xuICAgICAgICAgICAgaWYgKCFob29rKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGhvb2soYXNzZXQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBydW4gJHtob29rTmFtZX0gaG9vayBmYWlsZWQhYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmluZE9wZXJhdGVIYW5kbGVyKGltcG9ydGVyOiBzdHJpbmcsIG9wZXJhdGU6IGtleW9mIEFzc2V0SGFuZGxlcik6IEN1c3RvbUhhbmRsZXIgfCBBc3NldEhhbmRsZXIgfCBudWxsIHtcbiAgICAgICAgaWYgKHRoaXMuaW1wb3J0ZXIyT3BlcmF0ZVJlY29yZFtpbXBvcnRlcl0gJiYgdGhpcy5pbXBvcnRlcjJPcGVyYXRlUmVjb3JkW2ltcG9ydGVyXVtvcGVyYXRlXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW1wb3J0ZXIyT3BlcmF0ZVJlY29yZFtpbXBvcnRlcl1bb3BlcmF0ZV0gYXMgQ3VzdG9tSGFuZGxlcjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYXNzZXRIYW5kbGVyOiBDdXN0b21IYW5kbGVyIHwgQXNzZXRIYW5kbGVyIHwgdW5kZWZpbmVkID0gdGhpcy5uYW1lMmhhbmRsZXJbaW1wb3J0ZXJdO1xuICAgICAgICBpZiAoYXNzZXRIYW5kbGVyICYmICEob3BlcmF0ZSBpbiBhc3NldEhhbmRsZXIpICYmIHRoaXMuaW1wb3J0ZXIyY3VzdG9tW2ltcG9ydGVyXSkge1xuICAgICAgICAgICAgYXNzZXRIYW5kbGVyID0gdGhpcy5pbXBvcnRlcjJjdXN0b21baW1wb3J0ZXJdLmZpbmQoKGl0ZW0pID0+IG9wZXJhdGUgaW4gaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFzc2V0SGFuZGxlciB8fCAhKGFzc2V0SGFuZGxlciBhcyBhbnkpW29wZXJhdGVdKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBDYW5ub3QgZmluZCB0aGUgYXNzZXQgaGFuZGxlciBvZiBvcGVyYXRlICR7b3BlcmF0ZX0gZm9yIGltcG9ydGVyICR7aW1wb3J0ZXJ9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuaW1wb3J0ZXIyT3BlcmF0ZVJlY29yZFtpbXBvcnRlcl0pIHtcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0ZXIyT3BlcmF0ZVJlY29yZFtpbXBvcnRlcl0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmltcG9ydGVyMk9wZXJhdGVSZWNvcmRbaW1wb3J0ZXJdW29wZXJhdGVdID0gYXNzZXRIYW5kbGVyO1xuXG4gICAgICAgIHJldHVybiBhc3NldEhhbmRsZXI7XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5QWxsSW1wb3J0ZXIoKSB7XG4gICAgICAgIGxldCBpbXBvcnRlckFyciA9IE9iamVjdC5rZXlzKHRoaXMubmFtZTJoYW5kbGVyKTtcbiAgICAgICAgLy8g5YW85a655pen54mI5pys55qE6LWE5rqQ5a+85YWl5ZmoXG4gICAgICAgIGNvbnN0IGludGVybmFsREIgPSBnZXQoJ2ludGVybmFsJyk7XG4gICAgICAgIGNvbnN0IG5hbWUyaW1wb3J0ZXIgPSBpbnRlcm5hbERCLmltcG9ydGVyTWFuYWdlci5uYW1lMmltcG9ydGVyO1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMobmFtZTJpbXBvcnRlcikubGVuZ3RoKSB7XG4gICAgICAgICAgICBpbXBvcnRlckFyci5wdXNoKC4uLk9iamVjdC5rZXlzKGludGVybmFsREIuaW1wb3J0ZXJNYW5hZ2VyLm5hbWUyaW1wb3J0ZXIpKTtcbiAgICAgICAgICAgIGltcG9ydGVyQXJyID0gQXJyYXkuZnJvbShuZXcgU2V0KGltcG9ydGVyQXJyKSk7XG4gICAgICAgICAgICAvLyDlhbzlrrnml6fniYjmnKznmoTljYfnuqfmj5DnpLpcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigndGhlIGltcG9ydGVyIHZlcnNpb24gbmVlZCB0byB1cGdyYWRlLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbXBvcnRlckFyci5zb3J0KCk7XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5QWxsQXNzZXRUeXBlcygpIHtcbiAgICAgICAgY29uc3QgYXNzZXRUeXBlcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0aGlzLm5hbWUyaGFuZGxlcikuZm9yRWFjaCgoaGFuZGxlcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBhc3NldFR5cGUgfSA9IGhhbmRsZXI7XG4gICAgICAgICAgICBhc3NldFR5cGUgJiYgYXNzZXRUeXBlcy5hZGQoYXNzZXRUeXBlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5YW85a655pen54mI5pys55qE6LWE5rqQ5a+85YWl5ZmoXG4gICAgICAgIGNvbnN0IGludGVybmFsREIgPSBnZXQoJ2ludGVybmFsJyk7XG4gICAgICAgIGNvbnN0IG5hbWUyaW1wb3J0ZXIgPSBpbnRlcm5hbERCLmltcG9ydGVyTWFuYWdlci5uYW1lMmltcG9ydGVyO1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMobmFtZTJpbXBvcnRlcikubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGltcG9ydGVyIGluIG5hbWUyaW1wb3J0ZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1wb3J0ZXIgPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhc3NldFR5cGUgfSA9IG5hbWUyaW1wb3J0ZXJbaW1wb3J0ZXJdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBhc3NldFR5cGUgJiYgYXNzZXRUeXBlcy5hZGQoYXNzZXRUeXBlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYHRoZSBpbXBvcnRlciR7aW1wb3J0ZXJ9IHZlcnNpb24gbmVlZCB0byB1cGdyYWRlLmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5YW85a655pen54mI5pys55qE5Y2H57qn5o+Q56S6XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhc3NldFR5cGVzKS5zb3J0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05paw6buY6K6k6YWN572u5pWw5o2u5bm25L+d5a2Y77yI5YGP5aW96K6+572u55qE55So5oi35pON5L2c5L+u5pS55YWl5Y+j77yJXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZURlZmF1bHRVc2VyRGF0YShoYW5kbGVyOiBzdHJpbmcsIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghdGhpcy5uYW1lMmhhbmRsZXJbaGFuZGxlcl0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgaGFuZGxlciBub3QgZm91bmQ6ICR7aGFuZGxlcn1gKTtcbiAgICAgICAgfVxuICAgICAgICBsb2Rhc2guc2V0KHRoaXMuX3VzZXJEYXRhQ2FjaGUsIGAke2hhbmRsZXJ9LiR7a2V5fWAsIHZhbHVlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVmYXVsdFVzZXJEYXRhVG9IYW5kbGVyKGhhbmRsZXIsIGtleSwgdmFsdWUpO1xuICAgICAgICBjb25zdCBjb21iaW5lVXNlckRhdGEgPSB7XG4gICAgICAgICAgICAuLi4odGhpcy5fZGVmYXVsdFVzZXJEYXRhW2hhbmRsZXJdIHx8IHt9KSxcbiAgICAgICAgICAgIC4uLnRoaXMuX3VzZXJEYXRhQ2FjaGVbaGFuZGxlcl0sXG4gICAgICAgIH07XG4gICAgICAgIHNldERlZmF1bHRVc2VyRGF0YShoYW5kbGVyLCBjb21iaW5lVXNlckRhdGEpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRNZXRhUGF0aCA9IGpvaW4oYXNzZXRDb25maWcuZGF0YS5yb290LCAnLmNyZWF0b3InLCAnZGVmYXVsdC1tZXRhLmpzb24nKTtcbiAgICAgICAgYXdhaXQgb3V0cHV0SlNPTihkZWZhdWx0TWV0YVBhdGgsIHRoaXMuX3VzZXJEYXRhQ2FjaGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOWvvOWFpem7mOiupOWAvOWIsOWvvOWFpeWZqOeahOa4suafk+mFjee9ruWGhemDqFxuICAgICAqIEBwYXJhbSBoYW5kbGVyIFxuICAgICAqIEBwYXJhbSBrZXkgXG4gICAgICogQHBhcmFtIHZhbHVlIFxuICAgICAqL1xuICAgIHByaXZhdGUgX3VwZGF0ZURlZmF1bHRVc2VyRGF0YVRvSGFuZGxlcihoYW5kbGVyOiBzdHJpbmcsIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIGNvbnN0IGFzc2V0SGFuZGxlciA9IHRoaXMubmFtZTJoYW5kbGVyW2hhbmRsZXJdO1xuICAgICAgICAvLyDosIPmlbTlt7LmnInphY3nva7lhoXnmoTpu5jorqTlgLxcbiAgICAgICAgaWYgKGFzc2V0SGFuZGxlciAmJiBhc3NldEhhbmRsZXIudXNlckRhdGFDb25maWcgJiYgYXNzZXRIYW5kbGVyLnVzZXJEYXRhQ29uZmlnLmRlZmF1bHRba2V5XSkge1xuICAgICAgICAgICAgYXNzZXRIYW5kbGVyLnVzZXJEYXRhQ29uZmlnLmRlZmF1bHRba2V5XS5kZWZhdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuY29uc3QgYXNzZXRIYW5kbGVyTWFuYWdlciA9IG5ldyBBc3NldEhhbmRsZXJNYW5hZ2VyKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGFzc2V0SGFuZGxlck1hbmFnZXI7XG5cbmZ1bmN0aW9uIGxvY2FsaXplQXNzZXRDb25maWdNYXAoY29uZmlnTWFwOiBSZWNvcmQ8c3RyaW5nLCBJQXNzZXRDb25maWc+KTogUmVjb3JkPHN0cmluZywgSUFzc2V0Q29uZmlnPiB7XG4gICAgY29uc3QgbG9jYWxpemVkQ29uZmlnTWFwID0gbG9kYXNoLmNsb25lRGVlcChjb25maWdNYXApO1xuICAgIGZvciAoY29uc3QgY29uZmlnIG9mIE9iamVjdC52YWx1ZXMobG9jYWxpemVkQ29uZmlnTWFwKSkge1xuICAgICAgICBsb2NhbGl6ZUFzc2V0Q29uZmlnKGNvbmZpZyk7XG4gICAgfVxuICAgIHJldHVybiBsb2NhbGl6ZWRDb25maWdNYXA7XG59XG5cbmZ1bmN0aW9uIGxvY2FsaXplQXNzZXRDb25maWcoY29uZmlnOiBJQXNzZXRDb25maWcpOiB2b2lkIHtcbiAgICBjb25maWcuZGlzcGxheU5hbWUgPSB0cmFuc2xhdGVBc3NldENvbmZpZ1RleHQoY29uZmlnLmRpc3BsYXlOYW1lKTtcbiAgICBjb25maWcuZGVzY3JpcHRpb24gPSB0cmFuc2xhdGVBc3NldENvbmZpZ1RleHQoY29uZmlnLmRlc2NyaXB0aW9uKTtcblxuICAgIGlmIChjb25maWcudXNlckRhdGFDb25maWcpIHtcbiAgICAgICAgbG9jYWxpemVVc2VyRGF0YUNvbmZpZyhjb25maWcudXNlckRhdGFDb25maWcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxpemVVc2VyRGF0YUNvbmZpZyhjb25maWc6IFJlY29yZDxzdHJpbmcsIElVZXJEYXRhQ29uZmlnSXRlbT4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgT2JqZWN0LnZhbHVlcyhjb25maWcpKSB7XG4gICAgICAgIGxvY2FsaXplVXNlckRhdGFDb25maWdJdGVtKGl0ZW0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxpemVVc2VyRGF0YUNvbmZpZ0l0ZW0oaXRlbTogSVVlckRhdGFDb25maWdJdGVtKTogdm9pZCB7XG4gICAgaXRlbS5sYWJlbCA9IHRyYW5zbGF0ZUFzc2V0Q29uZmlnVGV4dChpdGVtLmxhYmVsKTtcbiAgICBpdGVtLmRlc2NyaXB0aW9uID0gdHJhbnNsYXRlQXNzZXRDb25maWdUZXh0KGl0ZW0uZGVzY3JpcHRpb24pO1xuXG4gICAgaWYgKGl0ZW0ucmVuZGVyPy5pdGVtcykge1xuICAgICAgICBpdGVtLnJlbmRlci5pdGVtcyA9IGl0ZW0ucmVuZGVyLml0ZW1zLm1hcCgob3B0aW9uKSA9PiAoe1xuICAgICAgICAgICAgLi4ub3B0aW9uLFxuICAgICAgICAgICAgbGFiZWw6IHRyYW5zbGF0ZUFzc2V0Q29uZmlnVGV4dChvcHRpb24ubGFiZWwpID8/IG9wdGlvbi5sYWJlbCxcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIGlmICghaXRlbS5pdGVtQ29uZmlncykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbS5pdGVtQ29uZmlncykpIHtcbiAgICAgICAgaXRlbS5pdGVtQ29uZmlncy5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgbG9jYWxpemVVc2VyRGF0YUNvbmZpZ0l0ZW0oY2hpbGQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyhpdGVtLml0ZW1Db25maWdzKSkge1xuICAgICAgICBsb2NhbGl6ZVVzZXJEYXRhQ29uZmlnSXRlbShjaGlsZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGVBc3NldENvbmZpZ1RleHQodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpMThuUHJlZml4ID0gJ2kxOG46JztcbiAgICBpZiAoIXZhbHVlLnN0YXJ0c1dpdGgoaTE4blByZWZpeCkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IHZhbHVlLnNsaWNlKGkxOG5QcmVmaXgubGVuZ3RoKTtcbiAgICBpZiAoIWtleSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNsYXRlZCA9IGkxOG4udHJhbnNJMThuTmFtZSh2YWx1ZSk7XG4gICAgaWYgKHRyYW5zbGF0ZWQgJiYgdHJhbnNsYXRlZCAhPT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zbGF0ZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleTtcbn1cblxuZnVuY3Rpb24gcGF0Y2hIYW5kbGVyKGluZm86IElDcmVhdGVNZW51SW5mbywgaGFuZGxlcjogc3RyaW5nLCBleHRlbnNpb25zOiBzdHJpbmdbXSkge1xuICAgIC8vIOmBv+WFjeaxoeafk+WOn+WniyBpbmZvIOaVsOaNrlxuICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgaGFuZGxlcixcbiAgICAgICAgLi4uaW5mbyxcbiAgICB9O1xuICAgIGlmIChyZXMuc3VibWVudSkge1xuICAgICAgICByZXMuc3VibWVudSA9IHJlcy5zdWJtZW51Lm1hcCgoc3ViSW5mbykgPT4gcGF0Y2hIYW5kbGVyKHN1YkluZm8sIGhhbmRsZXIsIGV4dGVuc2lvbnMpKTtcbiAgICB9XG4gICAgaWYgKHJlcy50ZW1wbGF0ZSAmJiAhcmVzLmZ1bGxGaWxlTmFtZSkge1xuICAgICAgICByZXMuZnVsbEZpbGVOYW1lID0gYmFzZW5hbWUocmVzLnRlbXBsYXRlKTtcbiAgICAgICAgaWYgKCFleHRuYW1lKHJlcy5mdWxsRmlsZU5hbWUpKSB7XG4gICAgICAgICAgICAvLyDmlK/mjIHml6DlkI7nvIDnmoTmqKHmnb/mlofku7bvvIzkuLvopoHlhbzlrrkgMy44LjIg54mI5pys5LmL5YmN55qE6ISa5pys5qih5p2/XG4gICAgICAgICAgICByZXMuZnVsbEZpbGVOYW1lICs9IGV4dGVuc2lvbnNbMF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcXVlcnlVc2VyVGVtcGxhdGVzKHRlbXBsYXRlRGlyOiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAoZXhpc3RzU3luYyh0ZW1wbGF0ZURpcikpIHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgZmcoWycqKi8qJywgJyEqLm1ldGEnXSwge1xuICAgICAgICAgICAgICAgIG9ubHlGaWxlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjd2Q6IHRlbXBsYXRlRGlyLFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyVGVtcGxhdGVEaXIoaW1wb3J0ZXI6IHN0cmluZykge1xuICAgIHJldHVybiBqb2luKEFzc2V0SGFuZGxlck1hbmFnZXIuY3JlYXRlVGVtcGxhdGVSb290LCBpbXBvcnRlcik7XG59XG5cbmZ1bmN0aW9uIHRyYW5zbGF0ZUNyZWF0ZU1lbnVJbmZvKGluZm86IElDcmVhdGVNZW51SW5mbyk6IElDcmVhdGVNZW51SW5mbyB7XG4gICAgY29uc3QgdHJhbnNsYXRlZCA9IHsgLi4uaW5mbyB9O1xuICAgIHRyYW5zbGF0ZWQubGFiZWwgPSBpMThuLnRyYW5zSTE4bk5hbWUodHJhbnNsYXRlZC5sYWJlbCk7XG4gICAgcmV0dXJuIHRyYW5zbGF0ZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFmdGVyQ3JlYXRlQXNzZXQocGF0aHM6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb25zOiBDcmVhdGVBc3NldE9wdGlvbnMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGF0aHMpKSB7XG4gICAgICAgIHBhdGhzID0gW3BhdGhzXTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBmaWxlIG9mIHBhdGhzKSB7XG4gICAgICAgIC8vIOaWh+S7tuS4jeWtmOWcqO+8jG5vZGVqcyDmsqHmnInmiJDlip/liJvlu7rmlofku7ZcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKGZpbGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aTE4bi50KCdhc3NldHMuY3JlYXRlX2Fzc2V0LmZhaWwuZHJvcCcsIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IGZpbGUsXG4gICAgICAgICAgICB9KX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOagueaNrumAiemhuemFjee9riBtZXRhIOaooeadv+aWh+S7tlxuICAgICAgICBpZiAob3B0aW9ucy51c2VyRGF0YSB8fCBvcHRpb25zLnV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IHtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YTogb3B0aW9ucy51c2VyRGF0YSB8fCB7fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAob3B0aW9ucy51dWlkKSB7XG4gICAgICAgICAgICAgICAgbWV0YS51dWlkID0gb3B0aW9ucy51dWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgd3JpdGVQYXRoKGZpbGUgKyAnLm1ldGEnLCBKU09OLnN0cmluZ2lmeShtZXRhLCBudWxsLCA0KSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=