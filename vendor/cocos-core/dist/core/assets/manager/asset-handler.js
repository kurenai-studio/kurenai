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
