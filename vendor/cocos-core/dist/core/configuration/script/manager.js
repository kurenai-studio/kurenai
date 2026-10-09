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
exports.configurationManager = exports.ConfigurationManager = void 0;
const semver_1 = require("semver");
const path_1 = __importStar(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const console_1 = require("../../base/console");
const utils = __importStar(require("./utils"));
const interface_1 = require("./interface");
const migration_1 = require("../migration");
const registry_1 = require("./registry");
const events_1 = __importDefault(require("events"));
class ConfigurationManager extends events_1.default {
    static VERSION = '1.0.0';
    static name = 'cocos.config.json';
    static SchemaPathSource = (0, path_1.join)(__dirname, '../../../../dist/cocos.config.schema.json');
    static relativeSchemaPath = `./temp/${path_1.default.basename(ConfigurationManager.SchemaPathSource)}`;
    // 配置文件已移到 settings/ 目录，$schema 相对引用需回退一级
    static schemaRef = `../temp/${path_1.default.basename(ConfigurationManager.SchemaPathSource)}`;
    static legacyLocalConfigPaths = [
        'builder.common',
        'builder.platforms.web-desktop',
        'builder.platforms.web-mobile',
        'scene.camera',
        'scene.gizmo',
        'scene.sceneView',
        'scene.camera-infos',
        'scene.camera-uuids',
    ];
    initialized = false;
    projectPath = '';
    configPath = ''; // project(committed): <project>/settings/cocos.config.json
    localConfigPath = ''; // local(personal): <project>/profiles/cocos.config.json
    projectConfig = {};
    localConfig = {};
    saveQueue = Promise.resolve();
    localSaveQueue = Promise.resolve();
    _version = '0.0.0';
    get version() {
        return this._version;
    }
    set version(value) {
        this._version = value;
    }
    configurationMap = new Map();
    onRegistryConfigurationBind = this.onRegistryConfiguration.bind(this);
    onUnRegistryConfigurationBind = this.onUnRegistryConfiguration.bind(this);
    /**
     * 初始化配置管理器
     */
    async initialize(projectPath) {
        if (this.initialized) {
            return;
        }
        registry_1.configurationRegistry.on(interface_1.MessageType.Registry, this.onRegistryConfigurationBind);
        registry_1.configurationRegistry.on(interface_1.MessageType.UnRegistry, this.onUnRegistryConfigurationBind);
        this.projectPath = projectPath;
        this.configPath = path_1.default.join(projectPath, 'settings', ConfigurationManager.name);
        this.localConfigPath = path_1.default.join(projectPath, 'profiles', ConfigurationManager.name);
        const schemaPath = path_1.default.join(projectPath, ConfigurationManager.relativeSchemaPath);
        await this.load();
        try {
            await fs_extra_1.default.copy(ConfigurationManager.SchemaPathSource, schemaPath);
            // 迁移不能影响正常的配置初始化流程
            await this.migrate();
        }
        catch (error) {
            console.error(error);
        }
        this.initialized = true;
    }
    /**
     * 从硬盘重新加载项目配置，将会丢弃内存中现有的配置
     */
    async reload() {
        await this.load();
        this.emit(interface_1.MessageType.Reload, this.projectConfig);
    }
    onRegistryConfiguration(instance) {
        if (!this.configurationMap.has(instance.moduleName)) {
            // 从 projectConfig / localConfig 中获取现有配置并初始化到配置实例中
            const existingConfig = this.projectConfig[instance.moduleName];
            if (existingConfig && typeof existingConfig === 'object') {
                this.initializeConfigFromProject(instance, existingConfig);
            }
            const existingLocal = this.localConfig[instance.moduleName];
            if (existingLocal && typeof existingLocal === 'object') {
                this.initializeConfigFromLocal(instance, existingLocal);
            }
            const bind = async (configInstance, scope = 'project') => {
                if (scope === 'local') {
                    this.localConfig[configInstance.moduleName] = configInstance.getAll('local');
                    await this.save(false, 'local');
                    return;
                }
                this.projectConfig[configInstance.moduleName] = configInstance.getAll('project');
                await this.save();
            };
            instance.on(interface_1.MessageType.Save, bind);
            this.configurationMap.set(instance.moduleName, bind);
        }
    }
    onUnRegistryConfiguration(instances) {
        const bind = this.configurationMap.get(instances.moduleName);
        if (bind) {
            instances.off(interface_1.MessageType.Save, bind);
            this.configurationMap.delete(instances.moduleName);
        }
    }
    /**
     * 从项目配置中初始化配置实例
     * @param instance 配置实例
     * @param existingConfig 现有的项目配置
     * @private
     */
    initializeConfigFromProject(instance, existingConfig) {
        // 必须是 BaseConfiguration 类型，否则抛出错误
        if (!('configs' in instance) || typeof instance.configs !== 'object') {
            const instanceType = instance.constructor?.name || 'Unknown';
            throw new Error(`配置实例必须是 BaseConfiguration 类型，但收到的是 ${instanceType}`);
        }
        // 直接设置 configs 属性
        instance.configs = utils.deepMerge({}, existingConfig);
    }
    /**
     * 从 local(个人/本机)配置初始化配置实例
     * @private
     */
    initializeConfigFromLocal(instance, existingConfig) {
        if (!('localConfigs' in instance) || typeof instance.localConfigs !== 'object') {
            const instanceType = instance.constructor?.name || 'Unknown';
            throw new Error(`配置实例必须是 BaseConfiguration 类型，但收到的是 ${instanceType}`);
        }
        instance.localConfigs = utils.deepMerge({}, existingConfig);
    }
    /**
     * 迁移，包含了 3x 迁移，允许外部单独触发
     */
    async migrate() {
        const upgrade = (0, semver_1.gt)(ConfigurationManager.VERSION, this.version);
        if (upgrade) {
            // TODO 新版本迁移
            // 3.x 迁移
            await this.migrateFromProject(this.projectPath);
        }
        else {
            console.debug('[Configuration] 项目配置已是最新版本，无需迁移');
        }
    }
    /**
     * 从指定项目路径迁移配置到当前项目
     * @param projectPath 项目路径
     * @returns 迁移后的项目配置
     */
    async migrateFromProject(projectPath) {
        const list = await migration_1.CocosMigrationManager.migrate(projectPath);
        this.projectConfig = utils.deepMerge(this.projectConfig, list.project || {});
        this.localConfig = utils.deepMerge(this.localConfig, list.local || {});
        await this.save();
        await this.save(false, 'local');
        return this.projectConfig;
    }
    splitLegacyConfigScopes(config) {
        const project = utils.deepMerge({}, config);
        const local = {};
        for (const dotPath of ConfigurationManager.legacyLocalConfigPaths) {
            const value = utils.getByDotPath(config, dotPath);
            if (value === undefined) {
                continue;
            }
            utils.setByDotPath(local, dotPath, value);
            this.removeByDotPathAndPrune(project, dotPath);
        }
        return { project, local };
    }
    removeByDotPathAndPrune(target, dotPath) {
        if (!target || !dotPath) {
            return false;
        }
        const keys = dotPath.split('.');
        const lastKey = keys.pop();
        if (!lastKey) {
            return false;
        }
        let current = target;
        const ancestors = [];
        for (const key of keys) {
            if (!current || typeof current !== 'object' || Array.isArray(current)) {
                return false;
            }
            ancestors.push({ parent: current, key });
            current = current[key];
        }
        if (!current || typeof current !== 'object' || Array.isArray(current) || !(lastKey in current)) {
            return false;
        }
        delete current[lastKey];
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const { parent, key } = ancestors[i];
            const value = parent[key];
            if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 0) {
                break;
            }
            delete parent[key];
        }
        return true;
    }
    /**
     * 解析配置键，提取模块名和实际键名
     * @param key 配置键名，如 'test.x.x'
     * @private
     */
    parseKey(key) {
        if (!utils.isValidConfigKey(key)) {
            throw new Error('配置键名不能为空');
        }
        const parts = key.split('.');
        if (parts.length < 2) {
            throw new Error('配置键名格式错误，必须包含模块名，如 "module.key"');
        }
        const moduleName = parts[0];
        const actualKey = parts.slice(1).join('.');
        if (!actualKey || actualKey.trim() === '') {
            throw new Error('配置键名不能为空');
        }
        return { moduleName, actualKey };
    }
    /**
     * 获取模块配置实例
     * @param moduleName 模块名
     * @private
     */
    getInstance(moduleName) {
        const instance = registry_1.configurationRegistry.getInstance(moduleName);
        if (!instance) {
            throw new Error(`[Configuration] 设置配置错误，${moduleName} 未注册`);
        }
        return instance;
    }
    /**
     * 获取配置值
     * 读取规则：优先读项目配置，如果没有再读默认配置，默认配置也没定义的话，就打印警告日志
     * @param key 配置键名，支持点号分隔的嵌套路径，如 'test.x.x'，第一位作为模块名
     * @param scope 配置作用域，不指定时按优先级查找
     */
    async get(key, scope) {
        try {
            await this.ensureInitialized();
            const { moduleName, actualKey } = this.parseKey(key);
            return await this.getInstance(moduleName).get(actualKey, scope);
        }
        catch (error) {
            throw new Error(`[Configuration] 获取配置失败：${error}`);
        }
    }
    /**
     * 更新配置值
     * @param key 配置键名，支持点号分隔的嵌套路径，如 'test.x.x'，第一位作为模块名
     * @param value 新的配置值
     * @param scope 配置作用域，默认为 'project'
     */
    async set(key, value, scope = 'project') {
        try {
            await this.ensureInitialized();
            const { moduleName, actualKey } = this.parseKey(key);
            await this.getInstance(moduleName).set(actualKey, value, scope);
            this.emit(interface_1.MessageType.Update, key, value, scope);
            return true;
        }
        catch (error) {
            throw new Error(`[Configuration] 更新配置失败：${error}`);
        }
    }
    /**
     * 移除配置值
     * @param key 配置键名，支持点号分隔的嵌套路径，如 'test.x.x'，第一位作为模块名
     * @param scope 配置作用域，默认为 'project'
     */
    async remove(key, scope = 'project') {
        try {
            await this.ensureInitialized();
            const { moduleName, actualKey } = this.parseKey(key);
            this.emit(interface_1.MessageType.Remove, key, scope);
            return await this.getInstance(moduleName).remove(actualKey, scope);
        }
        catch (error) {
            throw new Error(`[Configuration] 移除配置失败：${error}`);
        }
    }
    /**
     * 确保配置管理器已初始化
     */
    async ensureInitialized() {
        if (!this.initialized) {
            throw new Error('[Configuration] 未初始化');
        }
    }
    /**
     * 加载项目配置（settings/ 提交层）与 local 配置（profiles/ 个人层）
     */
    async load() {
        // project(committed): settings/cocos.config.json; legacy root config is relocated once and then removed.
        let localConfigLoaded = false;
        try {
            if (await fs_extra_1.default.pathExists(this.configPath)) {
                this.projectConfig = await fs_extra_1.default.readJSON(this.configPath);
                this.projectConfig.version && (this.version = this.projectConfig.version);
                console_1.newConsole.debug(`[Configuration] 已加载项目配置: ${this.configPath}`);
            }
            else {
                console_1.newConsole.debug(`[Configuration] 项目配置文件不存在，将创建新文件: ${this.configPath}`);
                await this.save();
            }
            const legacyPath = path_1.default.join(this.projectPath, ConfigurationManager.name);
            if (await fs_extra_1.default.pathExists(legacyPath)) {
                this.localConfig = await this.readLocalConfig();
                localConfigLoaded = true;
                await this.relocateLegacyRootConfig(legacyPath);
            }
        }
        catch (error) {
            console_1.newConsole.error(`[Configuration] 加载项目配置失败: ${this.configPath} - ${error}`);
        }
        // local(personal): profiles/cocos.config.json
        if (localConfigLoaded) {
            return;
        }
        this.localConfig = await this.readLocalConfig();
    }
    async readLocalConfig() {
        try {
            return await fs_extra_1.default.pathExists(this.localConfigPath)
                ? await fs_extra_1.default.readJSON(this.localConfigPath)
                : {};
        }
        catch (error) {
            console_1.newConsole.error(`[Configuration] 加载 local 配置失败: ${this.localConfigPath} - ${error}`);
            return {};
        }
    }
    async relocateLegacyRootConfig(legacyPath) {
        const legacyConfig = await fs_extra_1.default.readJSON(legacyPath);
        const { project, local } = this.splitLegacyConfigScopes(legacyConfig);
        this.projectConfig = utils.deepMerge(project, this.projectConfig);
        this.localConfig = utils.deepMerge(local, this.localConfig);
        this.projectConfig.version && (this.version = this.projectConfig.version);
        await this.save(true);
        await this.save(true, 'local');
        await fs_extra_1.default.remove(legacyPath);
        console_1.newConsole.debug(`[Configuration] 已将根配置拆分到 settings/ 与 profiles/ 并删除根文件: ${legacyPath}`);
    }
    /**
     * Save project or local configuration.
     */
    async save(forceOrScope = false, scope = 'project') {
        const { force, resolvedScope } = this.normalizeSaveOptions(forceOrScope, scope);
        if (resolvedScope === 'local') {
            return this.saveLocalConfig(force);
        }
        return this.saveProjectConfig(force);
    }
    normalizeSaveOptions(forceOrScope, scope) {
        if (typeof forceOrScope === 'string') {
            return {
                force: false,
                resolvedScope: forceOrScope,
            };
        }
        return {
            force: forceOrScope,
            resolvedScope: scope,
        };
    }
    async saveProjectConfig(force = false) {
        if (!force && !Object.keys(this.projectConfig).length) {
            return;
        }
        const nextSave = this.saveQueue
            .catch(() => undefined)
            .then(async () => {
            try {
                this.version = ConfigurationManager.VERSION;
                // 确保目录存在
                await fs_extra_1.default.ensureDir(path_1.default.dirname(this.configPath));
                this.projectConfig.version = this.version;
                this.projectConfig.$schema = ConfigurationManager.schemaRef;
                // 保存配置文件（带重试：见 writeConfigWithRetry）
                await this.writeConfigWithRetry();
                this.emit(interface_1.MessageType.Save, this.projectConfig, 'project');
                console_1.newConsole.debug(`[Configuration] 已保存项目配置: ${this.configPath}`);
            }
            catch (error) {
                console_1.newConsole.error(`[Configuration] 保存项目配置失败: ${this.configPath} - ${error}`);
                throw error;
            }
        });
        this.saveQueue = nextSave;
        return nextSave;
    }
    /**
     * 保存 local(个人/本机)配置到 profiles/cocos.config.json
     */
    async saveLocalConfig(force = false) {
        if (!force && !Object.keys(this.localConfig).length) {
            return;
        }
        const nextSave = this.localSaveQueue
            .catch(() => undefined)
            .then(async () => {
            try {
                await fs_extra_1.default.ensureDir(path_1.default.dirname(this.localConfigPath));
                this.localConfig.version = ConfigurationManager.VERSION;
                await fs_extra_1.default.writeJSON(this.localConfigPath, this.localConfig, { spaces: 4 });
                this.emit(interface_1.MessageType.Save, this.localConfig, 'local');
                console_1.newConsole.debug(`[Configuration] 已保存 local 配置: ${this.localConfigPath}`);
            }
            catch (error) {
                console_1.newConsole.error(`[Configuration] 保存 local 配置失败: ${this.localConfigPath} - ${error}`);
                throw error;
            }
        });
        this.localSaveQueue = nextSave;
        return nextSave;
    }
    /* 把项目配置写入磁盘，对 Windows 上的瞬时文件锁错误做有界重试。
     *
     * cocos.config.json 是配置真相源，多处会直接读盘：预览路由（scripting-routes.ts 读碰撞分组 /
     * 设计分辨率 / includeModules）、场景进程（scene/index.ts）等，且场景子进程是独立 fork 的引擎进程。
     * 当某个读取方短暂持有该文件句柄时，Windows 会让写入方的 open 失败并抛出 UNKNOWN（共享冲突），
     * 也可能是 EBUSY/EPERM/EACCES。这类错误都是瞬时的，重试即可成功。
     *
     * 先写临时文件再原子重命名，缩小目标文件被占用的时间窗口；重命名本身在 Windows 上仍可能因目标被
     * 占用而瞬时失败，故整体再包一层退避重试。非瞬时错误（如目录不存在）不重试，直接抛出。
     */
    async writeConfigWithRetry(maxAttempts = 5) {
        const transientCodes = new Set(['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES', 'EMFILE', 'ENFILE']);
        const tmpPath = `${this.configPath}.${process.pid}.tmp`;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await fs_extra_1.default.writeJSON(tmpPath, this.projectConfig, { spaces: 4 });
                await fs_extra_1.default.move(tmpPath, this.configPath, { overwrite: true });
                return;
            }
            catch (error) {
                lastError = error;
                const code = error?.code;
                if (!code || !transientCodes.has(code) || attempt === maxAttempts) {
                    // 尽力清理可能残留的临时文件后抛出
                    try {
                        await fs_extra_1.default.remove(tmpPath);
                    }
                    catch {
                        // ignore cleanup failure
                    }
                    throw error;
                }
                // 指数退避：50ms、100ms、200ms、400ms……
                const delay = 50 * 2 ** (attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    async getConfigPath(scope = 'project') {
        try {
            await this.ensureInitialized();
            return scope === 'local' ? this.localConfigPath : this.configPath;
        }
        catch (error) {
            throw new Error(`[Configuration] Failed to get configuration file path: ${error}`);
        }
    }
    reset() {
        this.initialized = false;
        this.projectPath = '';
        this.configPath = '';
        this.localConfigPath = '';
        this.projectConfig = {};
        this.localConfig = {};
        this.version = '0.0.0';
        this.configurationMap.clear();
    }
}
exports.ConfigurationManager = ConfigurationManager;
exports.configurationManager = new ConfigurationManager();
