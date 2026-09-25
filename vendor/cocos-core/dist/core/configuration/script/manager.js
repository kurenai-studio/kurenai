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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL2NvbmZpZ3VyYXRpb24vc2NyaXB0L21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQTRCO0FBQzVCLDZDQUE0QztBQUM1Qyx3REFBMkI7QUFDM0IsZ0RBQWdEO0FBQ2hELCtDQUFpQztBQUNqQywyQ0FBOEU7QUFDOUUsNENBQXFEO0FBQ3JELHlDQUFtRDtBQUVuRCxvREFBa0M7QUF5RGxDLE1BQWEsb0JBQXFCLFNBQVEsZ0JBQVk7SUFFbEQsTUFBTSxDQUFDLE9BQU8sR0FBVyxPQUFPLENBQUM7SUFDakMsTUFBTSxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQztJQUNsQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDJDQUEyQyxDQUFDLENBQUM7SUFDdkYsTUFBTSxDQUFDLGtCQUFrQixHQUFHLFVBQVUsY0FBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7SUFDN0YseUNBQXlDO0lBQ3pDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsV0FBVyxjQUFJLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztJQUM3RSxNQUFNLENBQVUsc0JBQXNCLEdBQUc7UUFDN0MsZ0JBQWdCO1FBQ2hCLCtCQUErQjtRQUMvQiw4QkFBOEI7UUFDOUIsY0FBYztRQUNkLGFBQWE7UUFDYixpQkFBaUI7UUFDakIsb0JBQW9CO1FBQ3BCLG9CQUFvQjtLQUN2QixDQUFDO0lBRU0sV0FBVyxHQUFZLEtBQUssQ0FBQztJQUM3QixXQUFXLEdBQVcsRUFBRSxDQUFDO0lBQ3pCLFVBQVUsR0FBVyxFQUFFLENBQUMsQ0FBUSwyREFBMkQ7SUFDM0YsZUFBZSxHQUFXLEVBQUUs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LE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDbEMsQ0FBQzs7QUEzZkwsb0RBNGZDO0FBRVksUUFBQSxvQkFBb0IsR0FBRyxJQUFJLG9CQUFvQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBndCB9IGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgcGF0aCwgeyBqb2luLCByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzZSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBuZXdDb25zb2xlIH0gZnJvbSAnLi4vLi4vYmFzZS9jb25zb2xlJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgSUNvbmZpZ3VyYXRpb24sIENvbmZpZ3VyYXRpb25TY29wZSwgTWVzc2FnZVR5cGUgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBDb2Nvc01pZ3JhdGlvbk1hbmFnZXIgfSBmcm9tICcuLi9taWdyYXRpb24nO1xuaW1wb3J0IHsgY29uZmlndXJhdGlvblJlZ2lzdHJ5IH0gZnJvbSAnLi9yZWdpc3RyeSc7XG5pbXBvcnQgeyBJQmFzZUNvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbmZpZ3VyYXRpb25NYW5hZ2VyIHtcbiAgICAvKipcbiAgICAgKiDliJ3lp4vljJbphY3nva7nrqHnkIblmahcbiAgICAgKi9cbiAgICBpbml0aWFsaXplKHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLyoqXG4gICAgICog6I635Y+W6YWN572uXG4gICAgICogQHBhcmFtIGtleSDphY3nva7plK7lkI3vvIzmlK/mjIHngrnlj7fliIbpmpTnmoTltYzlpZfot6/lvoTvvIzlpoIgJ3Rlc3QueC54J++8jOesrOS4gOS9jeS9nOS4uuaooeWdl+WQjVxuICAgICAqIEBwYXJhbSBzY29wZSDphY3nva7kvZznlKjln5/vvIzkuI3mjIflrprml7bmjInkvJjlhYjnuqfmn6Xmib5cbiAgICAgKi9cbiAgICBnZXQ8VD4oa2V5OiBzdHJpbmcsIHNjb3BlPzogQ29uZmlndXJhdGlvblNjb3BlKTogUHJvbWlzZTxUPjtcblxuICAgIC8qKlxuICAgICAqIOiuvue9rumFjee9rlxuICAgICAqIEBwYXJhbSBrZXkg6YWN572u6ZSu5ZCN77yM5pSv5oyB54K55Y+35YiG6ZqU55qE5bWM5aWX6Lev5b6E77yM5aaCICd0ZXN0LngueCfvvIznrKzkuIDkvY3kvZzkuLrmqKHlnZflkI1cbiAgICAgKiBAcGFyYW0gdmFsdWUg5paw55qE6YWN572u5YC8XG4gICAgICogQHBhcmFtIHNjb3BlIOmFjee9ruS9nOeUqOWfn++8jOm7mOiupOS4uiAncHJvamVjdCdcbiAgICAgKi9cbiAgICBzZXQ8VD4oa2V5OiBzdHJpbmcsIHZhbHVlOiBULCBzY29wZT86IENvbmZpZ3VyYXRpb25TY29wZSk6IFByb21pc2U8Ym9vbGVhbj47XG5cbiAgICAvKipcbiAgICAgKiDnp7vpmaTphY3nva5cbiAgICAgKiBAcGFyYW0ga2V5IOmFjee9rumUruWQje+8jOaUr+aMgeeCueWPt+WIhumalOeahOW1jOWll+i3r+W+hO+8jOWmgiAndGVzdC54Lngn77yM56ys5LiA5L2N5L2c5Li65qih5Z2X5ZCNXG4gICAgICogQHBhcmFtIHNjb3BlIOmFjee9ruS9nOeUqOWfn++8jOm7mOiupOS4uiAncHJvamVjdCdcbiAgICAgKi9cbiAgICByZW1vdmUoa2V5OiBzdHJpbmcsIHNjb3BlPzogQ29uZmlndXJhdGlvblNjb3BlKTogUHJvbWlzZTxib29sZWFuPjtcblxuICAgIC8qKlxuICAgICAqIOS7juehrOebmOmHjeaWsOWKoOi9vemhueebrumFjee9ru+8jOWwhuS8muS4ouW8g+WGheWtmOS4reeOsOacieeahOmFjee9rlxuICAgICAqL1xuICAgIHJlbG9hZCgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLyoqXG4gICAgICog6L+B56e777yM5YyF5ZCr5LqGIDN4IOi/geenu++8jOWFgeiuuOWklumDqOWNleeLrOinpuWPkVxuICAgICAqL1xuICAgIG1pZ3JhdGUoKTogUHJvbWlzZTx2b2lkPjtcblxuICAgIC8qKlxuICAgICAqIOS7juaMh+Wumumhueebrui3r+W+hOi/geenu+mFjee9ruWIsOW9k+WJjemhueebrlxuICAgICAqIEBwYXJhbSBwcm9qZWN0UGF0aCDpobnnm67ot6/lvoRcbiAgICAgKiBAcmV0dXJucyDov4Hnp7vlkI7nmoTpobnnm67phY3nva5cbiAgICAgKi9cbiAgICBtaWdyYXRlRnJvbVByb2plY3QocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8SUNvbmZpZ3VyYXRpb24+O1xuXG4gICAgLyoqXG4gICAgICogU2F2ZSBwcm9qZWN0IG9yIGxvY2FsIGNvbmZpZ3VyYXRpb24uXG4gICAgICogQHBhcmFtIGZvcmNlT3JTY29wZSBib29sZWFuIGZvcmNlIGZsYWcsIG9yIGEgc2NvcGUgc2hvcnRoYW5kIHN1Y2ggYXMgc2F2ZSgnbG9jYWwnKS5cbiAgICAgKiBAcGFyYW0gc2NvcGUgdGFyZ2V0IHNjb3BlIHdoZW4gdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGEgZm9yY2UgZmxhZy4gRGVmYXVsdHMgdG8gJ3Byb2plY3QnLlxuICAgICAqL1xuICAgIHNhdmUoZm9yY2VPclNjb3BlPzogYm9vbGVhbiB8IENvbmZpZ3VyYXRpb25TY29wZSwgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgZ2V0Q29uZmlnUGF0aChzY29wZT86IENvbmZpZ3VyYXRpb25TY29wZSk6IFByb21pc2U8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYXRpb25NYW5hZ2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIGltcGxlbWVudHMgSUNvbmZpZ3VyYXRpb25NYW5hZ2VyIHtcblxuICAgIHN0YXRpYyBWRVJTSU9OOiBzdHJpbmcgPSAnMS4wLjAnO1xuICAgIHN0YXRpYyBuYW1lID0gJ2NvY29zLmNvbmZpZy5qc29uJztcbiAgICBzdGF0aWMgU2NoZW1hUGF0aFNvdXJjZSA9IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vLi4vZGlzdC9jb2Nvcy5jb25maWcuc2NoZW1hLmpzb24nKTtcbiAgICBzdGF0aWMgcmVsYXRpdmVTY2hlbWFQYXRoID0gYC4vdGVtcC8ke3BhdGguYmFzZW5hbWUoQ29uZmlndXJhdGlvbk1hbmFnZXIuU2NoZW1hUGF0aFNvdXJjZSl9YDtcbiAgICAvLyDphY3nva7mlofku7blt7Lnp7vliLAgc2V0dGluZ3MvIOebruW9le+8jCRzY2hlbWEg55u45a+55byV55So6ZyA5Zue6YCA5LiA57qnXG4gICAgc3RhdGljIHNjaGVtYVJlZiA9IGAuLi90ZW1wLyR7cGF0aC5iYXNlbmFtZShDb25maWd1cmF0aW9uTWFuYWdlci5TY2hlbWFQYXRoU291cmNlKX1gO1xuICAgIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IGxlZ2FjeUxvY2FsQ29uZmlnUGF0aHMgPSBbXG4gICAgICAgICdidWlsZGVyLmNvbW1vbicsXG4gICAgICAgICdidWlsZGVyLnBsYXRmb3Jtcy53ZWItZGVza3RvcCcsXG4gICAgICAgICdidWlsZGVyLnBsYXRmb3Jtcy53ZWItbW9iaWxlJyxcbiAgICAgICAgJ3NjZW5lLmNhbWVyYScsXG4gICAgICAgICdzY2VuZS5naXptbycsXG4gICAgICAgICdzY2VuZS5zY2VuZVZpZXcnLFxuICAgICAgICAnc2NlbmUuY2FtZXJhLWluZm9zJyxcbiAgICAgICAgJ3NjZW5lLmNhbWVyYS11dWlkcycsXG4gICAgXTtcblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIHByb2plY3RQYXRoOiBzdHJpbmcgPSAnJztcbiAgICBwcml2YXRlIGNvbmZpZ1BhdGg6IHN0cmluZyA9ICcnOyAgICAgICAgLy8gcHJvamVjdChjb21taXR0ZWQpOiA8cHJvamVjdD4vc2V0dGluZ3MvY29jb3MuY29uZmlnLmpzb25cbiAgICBwcml2YXRlIGxvY2FsQ29uZmlnUGF0aDogc3RyaW5nID0gJyc7ICAgLy8gbG9jYWwocGVyc29uYWwpOiA8cHJvamVjdD4vcHJvZmlsZXMvY29jb3MuY29uZmlnLmpzb25cbiAgICBwcml2YXRlIHByb2plY3RDb25maWc6IElDb25maWd1cmF0aW9uID0ge307XG4gICAgcHJpdmF0ZSBsb2NhbENvbmZpZzogSUNvbmZpZ3VyYXRpb24gPSB7fTtcbiAgICBwcml2YXRlIHNhdmVRdWV1ZTogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHByaXZhdGUgbG9jYWxTYXZlUXVldWU6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgIHByaXZhdGUgX3ZlcnNpb246IHN0cmluZyA9ICcwLjAuMCc7XG4gICAgZ2V0IHZlcnNpb24oKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZlcnNpb247XG4gICAgfVxuICAgIHNldCB2ZXJzaW9uKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fdmVyc2lvbiA9IHZhbHVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29uZmlndXJhdGlvbk1hcDogTWFwPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIG9uUmVnaXN0cnlDb25maWd1cmF0aW9uQmluZCA9IHRoaXMub25SZWdpc3RyeUNvbmZpZ3VyYXRpb24uYmluZCh0aGlzKTtcbiAgICBwcml2YXRlIG9uVW5SZWdpc3RyeUNvbmZpZ3VyYXRpb25CaW5kID0gdGhpcy5vblVuUmVnaXN0cnlDb25maWd1cmF0aW9uLmJpbmQodGhpcyk7XG5cbiAgICAvKipcbiAgICAgKiDliJ3lp4vljJbphY3nva7nrqHnkIblmahcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWd1cmF0aW9uUmVnaXN0cnkub24oTWVzc2FnZVR5cGUuUmVnaXN0cnksIHRoaXMub25SZWdpc3RyeUNvbmZpZ3VyYXRpb25CaW5kKTtcbiAgICAgICAgY29uZmlndXJhdGlvblJlZ2lzdHJ5Lm9uKE1lc3NhZ2VUeXBlLlVuUmVnaXN0cnksIHRoaXMub25VblJlZ2lzdHJ5Q29uZmlndXJhdGlvbkJpbmQpO1xuXG4gICAgICAgIHRoaXMucHJvamVjdFBhdGggPSBwcm9qZWN0UGF0aDtcbiAgICAgICAgdGhpcy5jb25maWdQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCAnc2V0dGluZ3MnLCBDb25maWd1cmF0aW9uTWFuYWdlci5uYW1lKTtcbiAgICAgICAgdGhpcy5sb2NhbENvbmZpZ1BhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsICdwcm9maWxlcycsIENvbmZpZ3VyYXRpb25NYW5hZ2VyLm5hbWUpO1xuICAgICAgICBjb25zdCBzY2hlbWFQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCBDb25maWd1cmF0aW9uTWFuYWdlci5yZWxhdGl2ZVNjaGVtYVBhdGgpO1xuICAgICAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGZzZS5jb3B5KENvbmZpZ3VyYXRpb25NYW5hZ2VyLlNjaGVtYVBhdGhTb3VyY2UsIHNjaGVtYVBhdGgpO1xuICAgICAgICAgICAgLy8g6L+B56e75LiN6IO95b2x5ZON5q2j5bi455qE6YWN572u5Yid5aeL5YyW5rWB56iLXG4gICAgICAgICAgICBhd2FpdCB0aGlzLm1pZ3JhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7juehrOebmOmHjeaWsOWKoOi9vemhueebrumFjee9ru+8jOWwhuS8muS4ouW8g+WGheWtmOS4reeOsOacieeahOmFjee9rlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyByZWxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgICAgICB0aGlzLmVtaXQoTWVzc2FnZVR5cGUuUmVsb2FkLCB0aGlzLnByb2plY3RDb25maWcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25SZWdpc3RyeUNvbmZpZ3VyYXRpb24oaW5zdGFuY2U6IElCYXNlQ29uZmlndXJhdGlvbik6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuY29uZmlndXJhdGlvbk1hcC5oYXMoaW5zdGFuY2UubW9kdWxlTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIOS7jiBwcm9qZWN0Q29uZmlnIC8gbG9jYWxDb25maWcg5Lit6I635Y+W546w5pyJ6YWN572u5bm25Yid5aeL5YyW5Yiw6YWN572u5a6e5L6L5LitXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0NvbmZpZyA9IHRoaXMucHJvamVjdENvbmZpZ1tpbnN0YW5jZS5tb2R1bGVOYW1lXTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbmZpZyAmJiB0eXBlb2YgZXhpc3RpbmdDb25maWcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplQ29uZmlnRnJvbVByb2plY3QoaW5zdGFuY2UsIGV4aXN0aW5nQ29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nTG9jYWwgPSB0aGlzLmxvY2FsQ29uZmlnW2luc3RhbmNlLm1vZHVsZU5hbWVdO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nTG9jYWwgJiYgdHlwZW9mIGV4aXN0aW5nTG9jYWwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplQ29uZmlnRnJvbUxvY2FsKGluc3RhbmNlLCBleGlzdGluZ0xvY2FsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYmluZCA9IGFzeW5jIChjb25maWdJbnN0YW5jZTogSUJhc2VDb25maWd1cmF0aW9uLCBzY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlID09PSAnbG9jYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9jYWxDb25maWdbY29uZmlnSW5zdGFuY2UubW9kdWxlTmFtZV0gPSBjb25maWdJbnN0YW5jZS5nZXRBbGwoJ2xvY2FsJyk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZShmYWxzZSwgJ2xvY2FsJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0Q29uZmlnW2NvbmZpZ0luc3RhbmNlLm1vZHVsZU5hbWVdID0gY29uZmlnSW5zdGFuY2UuZ2V0QWxsKCdwcm9qZWN0Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW5zdGFuY2Uub24oTWVzc2FnZVR5cGUuU2F2ZSwgYmluZCk7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25NYXAuc2V0KGluc3RhbmNlLm1vZHVsZU5hbWUsIGJpbmQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvblVuUmVnaXN0cnlDb25maWd1cmF0aW9uKGluc3RhbmNlczogSUJhc2VDb25maWd1cmF0aW9uKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGJpbmQgPSB0aGlzLmNvbmZpZ3VyYXRpb25NYXAuZ2V0KGluc3RhbmNlcy5tb2R1bGVOYW1lKTtcbiAgICAgICAgaWYgKGJpbmQpIHtcbiAgICAgICAgICAgIGluc3RhbmNlcy5vZmYoTWVzc2FnZVR5cGUuU2F2ZSwgYmluZCk7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25NYXAuZGVsZXRlKGluc3RhbmNlcy5tb2R1bGVOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7jumhueebrumFjee9ruS4reWIneWni+WMlumFjee9ruWunuS+i1xuICAgICAqIEBwYXJhbSBpbnN0YW5jZSDphY3nva7lrp7kvotcbiAgICAgKiBAcGFyYW0gZXhpc3RpbmdDb25maWcg546w5pyJ55qE6aG555uu6YWN572uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIGluaXRpYWxpemVDb25maWdGcm9tUHJvamVjdChpbnN0YW5jZTogSUJhc2VDb25maWd1cmF0aW9uLCBleGlzdGluZ0NvbmZpZzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICAvLyDlv4XpobvmmK8gQmFzZUNvbmZpZ3VyYXRpb24g57G75Z6L77yM5ZCm5YiZ5oqb5Ye66ZSZ6K+vXG4gICAgICAgIGlmICghKCdjb25maWdzJyBpbiBpbnN0YW5jZSkgfHwgdHlwZW9mIGluc3RhbmNlLmNvbmZpZ3MgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZVR5cGUgPSBpbnN0YW5jZS5jb25zdHJ1Y3Rvcj8ubmFtZSB8fCAnVW5rbm93bic7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOmFjee9ruWunuS+i+W/hemhu+aYryBCYXNlQ29uZmlndXJhdGlvbiDnsbvlnovvvIzkvYbmlLbliLDnmoTmmK8gJHtpbnN0YW5jZVR5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g55u05o6l6K6+572uIGNvbmZpZ3Mg5bGe5oCnXG4gICAgICAgIGluc3RhbmNlLmNvbmZpZ3MgPSB1dGlscy5kZWVwTWVyZ2Uoe30sIGV4aXN0aW5nQ29uZmlnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDku44gbG9jYWwo5Liq5Lq6L+acrOacuinphY3nva7liJ3lp4vljJbphY3nva7lrp7kvotcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgaW5pdGlhbGl6ZUNvbmZpZ0Zyb21Mb2NhbChpbnN0YW5jZTogSUJhc2VDb25maWd1cmF0aW9uLCBleGlzdGluZ0NvbmZpZzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBpZiAoISgnbG9jYWxDb25maWdzJyBpbiBpbnN0YW5jZSkgfHwgdHlwZW9mIChpbnN0YW5jZSBhcyBhbnkpLmxvY2FsQ29uZmlncyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlVHlwZSA9IGluc3RhbmNlLmNvbnN0cnVjdG9yPy5uYW1lIHx8ICdVbmtub3duJztcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg6YWN572u5a6e5L6L5b+F6aG75pivIEJhc2VDb25maWd1cmF0aW9uIOexu+Wei++8jOS9huaUtuWIsOeahOaYryAke2luc3RhbmNlVHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KS5sb2NhbENvbmZpZ3MgPSB1dGlscy5kZWVwTWVyZ2Uoe30sIGV4aXN0aW5nQ29uZmlnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDov4Hnp7vvvIzljIXlkKvkuoYgM3gg6L+B56e777yM5YWB6K645aSW6YOo5Y2V54us6Kem5Y+RXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG1pZ3JhdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHVwZ3JhZGUgPSBndChDb25maWd1cmF0aW9uTWFuYWdlci5WRVJTSU9OLCB0aGlzLnZlcnNpb24pO1xuICAgICAgICBpZiAodXBncmFkZSkge1xuICAgICAgICAgICAgLy8gVE9ETyDmlrDniYjmnKzov4Hnp7tcbiAgICAgICAgICAgIC8vIDMueCDov4Hnp7tcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubWlncmF0ZUZyb21Qcm9qZWN0KHRoaXMucHJvamVjdFBhdGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW0NvbmZpZ3VyYXRpb25dIOmhueebrumFjee9ruW3suaYr+acgOaWsOeJiOacrO+8jOaXoOmcgOi/geenuycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LuO5oyH5a6a6aG555uu6Lev5b6E6L+B56e76YWN572u5Yiw5b2T5YmN6aG555uuXG4gICAgICogQHBhcmFtIHByb2plY3RQYXRoIOmhueebrui3r+W+hFxuICAgICAqIEByZXR1cm5zIOi/geenu+WQjueahOmhueebrumFjee9rlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBtaWdyYXRlRnJvbVByb2plY3QocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8SUNvbmZpZ3VyYXRpb24+IHtcbiAgICAgICAgY29uc3QgbGlzdCA9IGF3YWl0IENvY29zTWlncmF0aW9uTWFuYWdlci5taWdyYXRlKHByb2plY3RQYXRoKTtcbiAgICAgICAgdGhpcy5wcm9qZWN0Q29uZmlnID0gdXRpbHMuZGVlcE1lcmdlKHRoaXMucHJvamVjdENvbmZpZywgbGlzdC5wcm9qZWN0IHx8IHt9KSBhcyBJQ29uZmlndXJhdGlvbjtcbiAgICAgICAgdGhpcy5sb2NhbENvbmZpZyA9IHV0aWxzLmRlZXBNZXJnZSh0aGlzLmxvY2FsQ29uZmlnLCBsaXN0LmxvY2FsIHx8IHt9KSBhcyBJQ29uZmlndXJhdGlvbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZShmYWxzZSwgJ2xvY2FsJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnByb2plY3RDb25maWc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzcGxpdExlZ2FjeUNvbmZpZ1Njb3Blcyhjb25maWc6IElDb25maWd1cmF0aW9uKTogeyBwcm9qZWN0OiBJQ29uZmlndXJhdGlvbjsgbG9jYWw6IElDb25maWd1cmF0aW9uIH0ge1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gdXRpbHMuZGVlcE1lcmdlKHt9LCBjb25maWcpIGFzIElDb25maWd1cmF0aW9uO1xuICAgICAgICBjb25zdCBsb2NhbDogSUNvbmZpZ3VyYXRpb24gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRvdFBhdGggb2YgQ29uZmlndXJhdGlvbk1hbmFnZXIubGVnYWN5TG9jYWxDb25maWdQYXRocykge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGlscy5nZXRCeURvdFBhdGgoY29uZmlnLCBkb3RQYXRoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1dGlscy5zZXRCeURvdFBhdGgobG9jYWwsIGRvdFBhdGgsIHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQnlEb3RQYXRoQW5kUHJ1bmUocHJvamVjdCwgZG90UGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBwcm9qZWN0LCBsb2NhbCB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVtb3ZlQnlEb3RQYXRoQW5kUHJ1bmUodGFyZ2V0OiBJQ29uZmlndXJhdGlvbiwgZG90UGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGFyZ2V0IHx8ICFkb3RQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXlzID0gZG90UGF0aC5zcGxpdCgnLicpO1xuICAgICAgICBjb25zdCBsYXN0S2V5ID0ga2V5cy5wb3AoKTtcbiAgICAgICAgaWYgKCFsYXN0S2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3VycmVudDogYW55ID0gdGFyZ2V0O1xuICAgICAgICBjb25zdCBhbmNlc3RvcnM6IHsgcGFyZW50OiBhbnk7IGtleTogc3RyaW5nIH1bXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnQgfHwgdHlwZW9mIGN1cnJlbnQgIT09ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoY3VycmVudCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbmNlc3RvcnMucHVzaCh7IHBhcmVudDogY3VycmVudCwga2V5IH0pO1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY3VycmVudCB8fCB0eXBlb2YgY3VycmVudCAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShjdXJyZW50KSB8fCAhKGxhc3RLZXkgaW4gY3VycmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBjdXJyZW50W2xhc3RLZXldO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBhbmNlc3RvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IHsgcGFyZW50LCBrZXkgfSA9IGFuY2VzdG9yc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W2tleV07XG4gICAgICAgICAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBwYXJlbnRba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOino+aekOmFjee9rumUru+8jOaPkOWPluaooeWdl+WQjeWSjOWunumZhemUruWQjVxuICAgICAqIEBwYXJhbSBrZXkg6YWN572u6ZSu5ZCN77yM5aaCICd0ZXN0LngueCdcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgcGFyc2VLZXkoa2V5OiBzdHJpbmcpOiB7IG1vZHVsZU5hbWU6IHN0cmluZzsgYWN0dWFsS2V5OiBzdHJpbmcgfSB7XG4gICAgICAgIGlmICghdXRpbHMuaXNWYWxpZENvbmZpZ0tleShrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mFjee9rumUruWQjeS4jeiDveS4uuepuicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFydHMgPSBrZXkuc3BsaXQoJy4nKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6YWN572u6ZSu5ZCN5qC85byP6ZSZ6K+v77yM5b+F6aG75YyF5ZCr5qih5Z2X5ZCN77yM5aaCIFwibW9kdWxlLmtleVwiJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gcGFydHNbMF07XG4gICAgICAgIGNvbnN0IGFjdHVhbEtleSA9IHBhcnRzLnNsaWNlKDEpLmpvaW4oJy4nKTtcblxuICAgICAgICBpZiAoIWFjdHVhbEtleSB8fCBhY3R1YWxLZXkudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7plK7lkI3kuI3og73kuLrnqbonKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IG1vZHVsZU5hbWUsIGFjdHVhbEtleSB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluaooeWdl+mFjee9ruWunuS+i1xuICAgICAqIEBwYXJhbSBtb2R1bGVOYW1lIOaooeWdl+WQjVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRJbnN0YW5jZShtb2R1bGVOYW1lOiBzdHJpbmcpOiBJQmFzZUNvbmZpZ3VyYXRpb24ge1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGNvbmZpZ3VyYXRpb25SZWdpc3RyeS5nZXRJbnN0YW5jZShtb2R1bGVOYW1lKTtcbiAgICAgICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbQ29uZmlndXJhdGlvbl0g6K6+572u6YWN572u6ZSZ6K+v77yMJHttb2R1bGVOYW1lfSDmnKrms6jlhoxgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6YWN572u5YC8XG4gICAgICog6K+75Y+W6KeE5YiZ77ya5LyY5YWI6K+76aG555uu6YWN572u77yM5aaC5p6c5rKh5pyJ5YaN6K+76buY6K6k6YWN572u77yM6buY6K6k6YWN572u5Lmf5rKh5a6a5LmJ55qE6K+d77yM5bCx5omT5Y2w6K2m5ZGK5pel5b+XXG4gICAgICogQHBhcmFtIGtleSDphY3nva7plK7lkI3vvIzmlK/mjIHngrnlj7fliIbpmpTnmoTltYzlpZfot6/lvoTvvIzlpoIgJ3Rlc3QueC54J++8jOesrOS4gOS9jeS9nOS4uuaooeWdl+WQjVxuICAgICAqIEBwYXJhbSBzY29wZSDphY3nva7kvZznlKjln5/vvIzkuI3mjIflrprml7bmjInkvJjlhYjnuqfmn6Xmib5cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgZ2V0PFQ+KGtleTogc3RyaW5nLCBzY29wZT86IENvbmZpZ3VyYXRpb25TY29wZSk6IFByb21pc2U8VD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbnN1cmVJbml0aWFsaXplZCgpO1xuICAgICAgICAgICAgY29uc3QgeyBtb2R1bGVOYW1lLCBhY3R1YWxLZXkgfSA9IHRoaXMucGFyc2VLZXkoa2V5KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEluc3RhbmNlKG1vZHVsZU5hbWUpLmdldChhY3R1YWxLZXksIHNjb3BlKSBhcyBUO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbQ29uZmlndXJhdGlvbl0g6I635Y+W6YWN572u5aSx6LSl77yaJHtlcnJvcn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOmFjee9ruWAvFxuICAgICAqIEBwYXJhbSBrZXkg6YWN572u6ZSu5ZCN77yM5pSv5oyB54K55Y+35YiG6ZqU55qE5bWM5aWX6Lev5b6E77yM5aaCICd0ZXN0LngueCfvvIznrKzkuIDkvY3kvZzkuLrmqKHlnZflkI1cbiAgICAgKiBAcGFyYW0gdmFsdWUg5paw55qE6YWN572u5YC8XG4gICAgICogQHBhcmFtIHNjb3BlIOmFjee9ruS9nOeUqOWfn++8jOm7mOiupOS4uiAncHJvamVjdCdcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgc2V0PFQ+KGtleTogc3RyaW5nLCB2YWx1ZTogVCwgc2NvcGU6IENvbmZpZ3VyYXRpb25TY29wZSA9ICdwcm9qZWN0Jyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbnN1cmVJbml0aWFsaXplZCgpO1xuICAgICAgICAgICAgY29uc3QgeyBtb2R1bGVOYW1lLCBhY3R1YWxLZXkgfSA9IHRoaXMucGFyc2VLZXkoa2V5KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0SW5zdGFuY2UobW9kdWxlTmFtZSkuc2V0KGFjdHVhbEtleSwgdmFsdWUsIHNjb3BlKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChNZXNzYWdlVHlwZS5VcGRhdGUsIGtleSwgdmFsdWUsIHNjb3BlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbQ29uZmlndXJhdGlvbl0g5pu05paw6YWN572u5aSx6LSl77yaJHtlcnJvcn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOenu+mZpOmFjee9ruWAvFxuICAgICAqIEBwYXJhbSBrZXkg6YWN572u6ZSu5ZCN77yM5pSv5oyB54K55Y+35YiG6ZqU55qE5bWM5aWX6Lev5b6E77yM5aaCICd0ZXN0LngueCfvvIznrKzkuIDkvY3kvZzkuLrmqKHlnZflkI1cbiAgICAgKiBAcGFyYW0gc2NvcGUg6YWN572u5L2c55So5Z+f77yM6buY6K6k5Li6ICdwcm9qZWN0J1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyByZW1vdmUoa2V5OiBzdHJpbmcsIHNjb3BlOiBDb25maWd1cmF0aW9uU2NvcGUgPSAncHJvamVjdCcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICAgICAgICAgIGNvbnN0IHsgbW9kdWxlTmFtZSwgYWN0dWFsS2V5IH0gPSB0aGlzLnBhcnNlS2V5KGtleSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoTWVzc2FnZVR5cGUuUmVtb3ZlLCBrZXksIHNjb3BlKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEluc3RhbmNlKG1vZHVsZU5hbWUpLnJlbW92ZShhY3R1YWxLZXksIHNjb3BlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0NvbmZpZ3VyYXRpb25dIOenu+mZpOmFjee9ruWksei0pe+8miR7ZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnoa7kv53phY3nva7nrqHnkIblmajlt7LliJ3lp4vljJZcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGVuc3VyZUluaXRpYWxpemVkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0NvbmZpZ3VyYXRpb25dIOacquWIneWni+WMlicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yqg6L296aG555uu6YWN572u77yIc2V0dGluZ3MvIOaPkOS6pOWxgu+8ieS4jiBsb2NhbCDphY3nva7vvIhwcm9maWxlcy8g5Liq5Lq65bGC77yJXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyBwcm9qZWN0KGNvbW1pdHRlZCk6IHNldHRpbmdzL2NvY29zLmNvbmZpZy5qc29uOyBsZWdhY3kgcm9vdCBjb25maWcgaXMgcmVsb2NhdGVkIG9uY2UgYW5kIHRoZW4gcmVtb3ZlZC5cbiAgICAgICAgbGV0IGxvY2FsQ29uZmlnTG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoYXdhaXQgZnNlLnBhdGhFeGlzdHModGhpcy5jb25maWdQYXRoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdENvbmZpZyA9IGF3YWl0IGZzZS5yZWFkSlNPTih0aGlzLmNvbmZpZ1BhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdENvbmZpZy52ZXJzaW9uICYmICh0aGlzLnZlcnNpb24gPSB0aGlzLnByb2plY3RDb25maWcudmVyc2lvbik7XG4gICAgICAgICAgICAgICAgbmV3Q29uc29sZS5kZWJ1ZyhgW0NvbmZpZ3VyYXRpb25dIOW3suWKoOi9vemhueebrumFjee9rjogJHt0aGlzLmNvbmZpZ1BhdGh9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUuZGVidWcoYFtDb25maWd1cmF0aW9uXSDpobnnm67phY3nva7mlofku7bkuI3lrZjlnKjvvIzlsIbliJvlu7rmlrDmlofku7Y6ICR7dGhpcy5jb25maWdQYXRofWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsZWdhY3lQYXRoID0gcGF0aC5qb2luKHRoaXMucHJvamVjdFBhdGgsIENvbmZpZ3VyYXRpb25NYW5hZ2VyLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGF3YWl0IGZzZS5wYXRoRXhpc3RzKGxlZ2FjeVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2NhbENvbmZpZyA9IGF3YWl0IHRoaXMucmVhZExvY2FsQ29uZmlnKCk7XG4gICAgICAgICAgICAgICAgbG9jYWxDb25maWdMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVsb2NhdGVMZWdhY3lSb290Q29uZmlnKGxlZ2FjeVBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbmV3Q29uc29sZS5lcnJvcihgW0NvbmZpZ3VyYXRpb25dIOWKoOi9vemhueebrumFjee9ruWksei0pTogJHt0aGlzLmNvbmZpZ1BhdGh9IC0gJHtlcnJvcn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvY2FsKHBlcnNvbmFsKTogcHJvZmlsZXMvY29jb3MuY29uZmlnLmpzb25cbiAgICAgICAgaWYgKGxvY2FsQ29uZmlnTG9hZGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2NhbENvbmZpZyA9IGF3YWl0IHRoaXMucmVhZExvY2FsQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZWFkTG9jYWxDb25maWcoKTogUHJvbWlzZTxJQ29uZmlndXJhdGlvbj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZzZS5wYXRoRXhpc3RzKHRoaXMubG9jYWxDb25maWdQYXRoKVxuICAgICAgICAgICAgICAgID8gYXdhaXQgZnNlLnJlYWRKU09OKHRoaXMubG9jYWxDb25maWdQYXRoKVxuICAgICAgICAgICAgICAgIDoge307XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBuZXdDb25zb2xlLmVycm9yKGBbQ29uZmlndXJhdGlvbl0g5Yqg6L29IGxvY2FsIOmFjee9ruWksei0pTogJHt0aGlzLmxvY2FsQ29uZmlnUGF0aH0gLSAke2Vycm9yfWApO1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZWxvY2F0ZUxlZ2FjeVJvb3RDb25maWcobGVnYWN5UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGxlZ2FjeUNvbmZpZyA9IGF3YWl0IGZzZS5yZWFkSlNPTihsZWdhY3lQYXRoKTtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0LCBsb2NhbCB9ID0gdGhpcy5zcGxpdExlZ2FjeUNvbmZpZ1Njb3BlcyhsZWdhY3lDb25maWcpO1xuICAgICAgICB0aGlzLnByb2plY3RDb25maWcgPSB1dGlscy5kZWVwTWVyZ2UocHJvamVjdCwgdGhpcy5wcm9qZWN0Q29uZmlnKSBhcyBJQ29uZmlndXJhdGlvbjtcbiAgICAgICAgdGhpcy5sb2NhbENvbmZpZyA9IHV0aWxzLmRlZXBNZXJnZShsb2NhbCwgdGhpcy5sb2NhbENvbmZpZykgYXMgSUNvbmZpZ3VyYXRpb247XG4gICAgICAgIHRoaXMucHJvamVjdENvbmZpZy52ZXJzaW9uICYmICh0aGlzLnZlcnNpb24gPSB0aGlzLnByb2plY3RDb25maWcudmVyc2lvbik7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlKHRydWUpO1xuICAgICAgICBhd2FpdCB0aGlzLnNhdmUodHJ1ZSwgJ2xvY2FsJyk7XG4gICAgICAgIGF3YWl0IGZzZS5yZW1vdmUobGVnYWN5UGF0aCk7XG4gICAgICAgIG5ld0NvbnNvbGUuZGVidWcoYFtDb25maWd1cmF0aW9uXSDlt7LlsIbmoLnphY3nva7mi4bliIbliLAgc2V0dGluZ3MvIOS4jiBwcm9maWxlcy8g5bm25Yig6Zmk5qC55paH5Lu2OiAke2xlZ2FjeVBhdGh9YCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBwcm9qZWN0IG9yIGxvY2FsIGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHNhdmUoZm9yY2VPclNjb3BlOiBib29sZWFuIHwgQ29uZmlndXJhdGlvblNjb3BlID0gZmFsc2UsIHNjb3BlOiBDb25maWd1cmF0aW9uU2NvcGUgPSAncHJvamVjdCcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgeyBmb3JjZSwgcmVzb2x2ZWRTY29wZSB9ID0gdGhpcy5ub3JtYWxpemVTYXZlT3B0aW9ucyhmb3JjZU9yU2NvcGUsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc29sdmVkU2NvcGUgPT09ICdsb2NhbCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNhdmVMb2NhbENvbmZpZyhmb3JjZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZVByb2plY3RDb25maWcoZm9yY2UpO1xuICAgIH1cblxuICAgIHByaXZhdGUgbm9ybWFsaXplU2F2ZU9wdGlvbnMoZm9yY2VPclNjb3BlOiBib29sZWFuIHwgQ29uZmlndXJhdGlvblNjb3BlLCBzY29wZTogQ29uZmlndXJhdGlvblNjb3BlKTogeyBmb3JjZTogYm9vbGVhbjsgcmVzb2x2ZWRTY29wZTogQ29uZmlndXJhdGlvblNjb3BlIH0ge1xuICAgICAgICBpZiAodHlwZW9mIGZvcmNlT3JTY29wZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZm9yY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlc29sdmVkU2NvcGU6IGZvcmNlT3JTY29wZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZvcmNlOiBmb3JjZU9yU2NvcGUsXG4gICAgICAgICAgICByZXNvbHZlZFNjb3BlOiBzY29wZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVQcm9qZWN0Q29uZmlnKGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCFmb3JjZSAmJiAhT2JqZWN0LmtleXModGhpcy5wcm9qZWN0Q29uZmlnKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZXh0U2F2ZSA9IHRoaXMuc2F2ZVF1ZXVlXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKVxuICAgICAgICAgICAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmVyc2lvbiA9IENvbmZpZ3VyYXRpb25NYW5hZ2VyLlZFUlNJT047XG4gICAgICAgICAgICAgICAgICAgIC8vIOehruS/neebruW9leWtmOWcqFxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmc2UuZW5zdXJlRGlyKHBhdGguZGlybmFtZSh0aGlzLmNvbmZpZ1BhdGgpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0Q29uZmlnLnZlcnNpb24gPSB0aGlzLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0Q29uZmlnLiRzY2hlbWEgPSBDb25maWd1cmF0aW9uTWFuYWdlci5zY2hlbWFSZWY7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOmFjee9ruaWh+S7tu+8iOW4pumHjeivle+8muingSB3cml0ZUNvbmZpZ1dpdGhSZXRyee+8iVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLndyaXRlQ29uZmlnV2l0aFJldHJ5KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChNZXNzYWdlVHlwZS5TYXZlLCB0aGlzLnByb2plY3RDb25maWcsICdwcm9qZWN0Jyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUuZGVidWcoYFtDb25maWd1cmF0aW9uXSDlt7Lkv53lrZjpobnnm67phY3nva46ICR7dGhpcy5jb25maWdQYXRofWApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUuZXJyb3IoYFtDb25maWd1cmF0aW9uXSDkv53lrZjpobnnm67phY3nva7lpLHotKU6ICR7dGhpcy5jb25maWdQYXRofSAtICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2F2ZVF1ZXVlID0gbmV4dFNhdmU7XG4gICAgICAgIHJldHVybiBuZXh0U2F2ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkv53lrZggbG9jYWwo5Liq5Lq6L+acrOacuinphY3nva7liLAgcHJvZmlsZXMvY29jb3MuY29uZmlnLmpzb25cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVMb2NhbENvbmZpZyhmb3JjZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghZm9yY2UgJiYgIU9iamVjdC5rZXlzKHRoaXMubG9jYWxDb25maWcpLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5leHRTYXZlID0gdGhpcy5sb2NhbFNhdmVRdWV1ZVxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IHVuZGVmaW5lZClcbiAgICAgICAgICAgIC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmc2UuZW5zdXJlRGlyKHBhdGguZGlybmFtZSh0aGlzLmxvY2FsQ29uZmlnUGF0aCkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvY2FsQ29uZmlnLnZlcnNpb24gPSBDb25maWd1cmF0aW9uTWFuYWdlci5WRVJTSU9OO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmc2Uud3JpdGVKU09OKHRoaXMubG9jYWxDb25maWdQYXRoLCB0aGlzLmxvY2FsQ29uZmlnLCB7IHNwYWNlczogNCB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KE1lc3NhZ2VUeXBlLlNhdmUsIHRoaXMubG9jYWxDb25maWcsICdsb2NhbCcpO1xuICAgICAgICAgICAgICAgICAgICBuZXdDb25zb2xlLmRlYnVnKGBbQ29uZmlndXJhdGlvbl0g5bey5L+d5a2YIGxvY2FsIOmFjee9rjogJHt0aGlzLmxvY2FsQ29uZmlnUGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBuZXdDb25zb2xlLmVycm9yKGBbQ29uZmlndXJhdGlvbl0g5L+d5a2YIGxvY2FsIOmFjee9ruWksei0pTogJHt0aGlzLmxvY2FsQ29uZmlnUGF0aH0gLSAke2Vycm9yfWApO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sb2NhbFNhdmVRdWV1ZSA9IG5leHRTYXZlO1xuICAgICAgICByZXR1cm4gbmV4dFNhdmU7XG4gICAgfVxuXG4gICAgLyog5oqK6aG555uu6YWN572u5YaZ5YWl56OB55uY77yM5a+5IFdpbmRvd3Mg5LiK55qE556s5pe25paH5Lu26ZSB6ZSZ6K+v5YGa5pyJ55WM6YeN6K+V44CCXG4gICAgICpcbiAgICAgKiBjb2Nvcy5jb25maWcuanNvbiDmmK/phY3nva7nnJ/nm7jmupDvvIzlpJrlpITkvJrnm7TmjqXor7vnm5jvvJrpooTop4jot6/nlLHvvIhzY3JpcHRpbmctcm91dGVzLnRzIOivu+eisOaSnuWIhue7hCAvXG4gICAgICog6K6+6K6h5YiG6L6o546HIC8gaW5jbHVkZU1vZHVsZXPvvInjgIHlnLrmma/ov5vnqIvvvIhzY2VuZS9pbmRleC50c++8ieetie+8jOS4lOWcuuaZr+WtkOi/m+eoi+aYr+eLrOeriyBmb3JrIOeahOW8leaTjui/m+eoi+OAglxuICAgICAqIOW9k+afkOS4quivu+WPluaWueefreaaguaMgeacieivpeaWh+S7tuWPpeafhOaXtu+8jFdpbmRvd3Mg5Lya6K6p5YaZ5YWl5pa555qEIG9wZW4g5aSx6LSl5bm25oqb5Ye6IFVOS05PV07vvIjlhbHkuqvlhrLnqoHvvInvvIxcbiAgICAgKiDkuZ/lj6/og73mmK8gRUJVU1kvRVBFUk0vRUFDQ0VT44CC6L+Z57G76ZSZ6K+v6YO95piv556s5pe255qE77yM6YeN6K+V5Y2z5Y+v5oiQ5Yqf44CCXG4gICAgICpcbiAgICAgKiDlhYjlhpnkuLTml7bmlofku7blho3ljp/lrZDph43lkb3lkI3vvIznvKnlsI/nm67moIfmlofku7booqvljaDnlKjnmoTml7bpl7Tnqpflj6PvvJvph43lkb3lkI3mnKzouqvlnKggV2luZG93cyDkuIrku43lj6/og73lm6Dnm67moIfooqtcbiAgICAgKiDljaDnlKjogIznnqzml7blpLHotKXvvIzmlYXmlbTkvZPlho3ljIXkuIDlsYLpgIDpgb/ph43or5XjgILpnZ7nnqzml7bplJnor6/vvIjlpoLnm67lvZXkuI3lrZjlnKjvvInkuI3ph43or5XvvIznm7TmjqXmipvlh7rjgIJcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHdyaXRlQ29uZmlnV2l0aFJldHJ5KG1heEF0dGVtcHRzOiBudW1iZXIgPSA1KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHRyYW5zaWVudENvZGVzID0gbmV3IFNldChbJ1VOS05PV04nLCAnRUJVU1knLCAnRVBFUk0nLCAnRUFDQ0VTJywgJ0VNRklMRScsICdFTkZJTEUnXSk7XG4gICAgICAgIGNvbnN0IHRtcFBhdGggPSBgJHt0aGlzLmNvbmZpZ1BhdGh9LiR7cHJvY2Vzcy5waWR9LnRtcGA7XG4gICAgICAgIGxldCBsYXN0RXJyb3I6IHVua25vd247XG4gICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAxOyBhdHRlbXB0IDw9IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNlLndyaXRlSlNPTih0bXBQYXRoLCB0aGlzLnByb2plY3RDb25maWcsIHsgc3BhY2VzOiA0IH0pO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzZS5tb3ZlKHRtcFBhdGgsIHRoaXMuY29uZmlnUGF0aCwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsYXN0RXJyb3IgPSBlcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gKGVycm9yIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbik/LmNvZGU7XG4gICAgICAgICAgICAgICAgaWYgKCFjb2RlIHx8ICF0cmFuc2llbnRDb2Rlcy5oYXMoY29kZSkgfHwgYXR0ZW1wdCA9PT0gbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bC95Yqb5riF55CG5Y+v6IO95q6L55WZ55qE5Li05pe25paH5Lu25ZCO5oqb5Ye6XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBmc2UucmVtb3ZlKHRtcFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBjbGVhbnVwIGZhaWx1cmVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5oyH5pWw6YCA6YG/77yaNTBtc+OAgTEwMG1z44CBMjAwbXPjgIE0MDBtc+KApuKAplxuICAgICAgICAgICAgICAgIGNvbnN0IGRlbGF5ID0gNTAgKiAyICoqIChhdHRlbXB0IC0gMSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgZGVsYXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBsYXN0RXJyb3I7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGdldENvbmZpZ1BhdGgoc2NvcGU6IENvbmZpZ3VyYXRpb25TY29wZSA9ICdwcm9qZWN0Jyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgICAgICAgICByZXR1cm4gc2NvcGUgPT09ICdsb2NhbCcgPyB0aGlzLmxvY2FsQ29uZmlnUGF0aCA6IHRoaXMuY29uZmlnUGF0aDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0NvbmZpZ3VyYXRpb25dIEZhaWxlZCB0byBnZXQgY29uZmlndXJhdGlvbiBmaWxlIHBhdGg6ICR7ZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnByb2plY3RQYXRoID0gJyc7XG4gICAgICAgIHRoaXMuY29uZmlnUGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmxvY2FsQ29uZmlnUGF0aCA9ICcnO1xuICAgICAgICB0aGlzLnByb2plY3RDb25maWcgPSB7fTtcbiAgICAgICAgdGhpcy5sb2NhbENvbmZpZyA9IHt9O1xuICAgICAgICB0aGlzLnZlcnNpb24gPSAnMC4wLjAnO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25NYXAuY2xlYXIoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWd1cmF0aW9uTWFuYWdlciA9IG5ldyBDb25maWd1cmF0aW9uTWFuYWdlcigpO1xuIl19