"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const configuration_1 = require("../configuration");
const interface_1 = require("../configuration/script/interface");
const project_1 = __importDefault(require("../project"));
const engine_1 = require("../engine");
const metadata_1 = require("./metadata");
const import_config_defaults_1 = require("./import-config-defaults");
class AssetConfig {
    /**
     * 环境共享的资源库配置
     */
    _assetConfig = {
        restoreAssetDBFromCache: false,
        flagReimportCheck: false,
        globList: [],
        assetDBList: [],
        root: '',
        libraryRoot: '',
        tempRoot: '',
        createTemplateRoot: '',
        sortingPlugin: [],
        // fbx.material.smart
    };
    _init = false;
    _watchingConfiguration = false;
    /**
     * 持有的可双向绑定的配置管理实例
     */
    _configInstance;
    get data() {
        if (!this._init) {
            throw new Error('AssetConfig not init');
        }
        return this._assetConfig;
    }
    async init() {
        if (this._init) {
            console.warn('AssetConfig already init');
            return;
        }
        this._configInstance = await configuration_1.configurationRegistry.register('import', {
            defaults: {
                restoreAssetDBFromCache: this._assetConfig.restoreAssetDBFromCache,
                globList: this._assetConfig.globList ?? [],
                createTemplateRoot: import_config_defaults_1.DEFAULT_CREATE_TEMPLATE_ROOT,
            },
            nodes: () => (0, metadata_1.createImportMetadataNodes)(),
        });
        if (!project_1.default.path) {
            throw new Error('Project not found');
        }
        this._assetConfig.root = project_1.default.path;
        const enginePath = engine_1.Engine.getInfo().typescript.path;
        this._assetConfig.libraryRoot = this._assetConfig.libraryRoot || (0, path_1.join)(this._assetConfig.root, 'library');
        this._assetConfig.tempRoot = (0, path_1.join)(this._assetConfig.root, 'temp/asset-db');
        this.watchConfigurationChanges();
        await this.syncRuntimeConfigFromConfiguration();
        this._assetConfig.assetDBList = [{
                name: 'assets',
                target: (0, path_1.join)(this._assetConfig.root, 'assets'),
                readonly: false,
                visible: true,
                library: (0, path_1.join)(this._assetConfig.root, 'library'),
            }, {
                name: 'internal',
                target: (0, path_1.join)(enginePath, 'editor/assets'),
                readonly: true,
                visible: true,
                library: (0, path_1.join)(enginePath, 'editor/library'),
            }];
        // Scan project extensions for asset-db mount contributions and register their db:// domains
        const extensionsDir = (0, path_1.join)(this._assetConfig.root, 'extensions');
        if ((0, fs_1.existsSync)(extensionsDir)) {
            try {
                const entries = (0, fs_1.readdirSync)(extensionsDir, { withFileTypes: true });
                for (const entry of entries) {
                    if (!entry.isDirectory())
                        continue;
                    const extDir = (0, path_1.join)(extensionsDir, entry.name);
                    const pkgJsonPath = (0, path_1.join)(extDir, 'package.json');
                    if (!(0, fs_1.existsSync)(pkgJsonPath))
                        continue;
                    try {
                        const pkgJson = JSON.parse(require('fs').readFileSync(pkgJsonPath, 'utf8'));
                        const mount = pkgJson?.contributions?.['asset-db']?.mount;
                        if (!mount?.path)
                            continue;
                        const mountTarget = (0, path_1.join)(extDir, mount.path);
                        if (!(0, fs_1.existsSync)(mountTarget))
                            continue;
                        this._assetConfig.assetDBList.push({
                            name: pkgJson.name || entry.name,
                            target: mountTarget,
                            readonly: mount.readonly ?? true,
                            visible: mount.visible ?? false,
                            library: (0, path_1.join)(this._assetConfig.root, `library/${pkgJson.name || entry.name}`),
                        });
                    }
                    catch {
                        // Skip extensions with invalid package.json
                    }
                }
            }
            catch {
                // Ignore errors scanning extensions directory
            }
        }
        this._init = true;
    }
    getProject(path, scope) {
        return this._configInstance.get(path, scope);
    }
    setProject(path, value, scope) {
        return this._configInstance.set(path, value, scope);
    }
    setSortingPlugin(value) {
        this._assetConfig.sortingPlugin = Array.isArray(value)
            ? value.filter((item) => typeof item === 'string')
            : [];
    }
    async syncSortingPluginFromConfiguration() {
        const scriptConfigInstance = configuration_1.configurationRegistry.getInstances().script;
        if (!scriptConfigInstance) {
            return;
        }
        const scriptConfig = await scriptConfigInstance.get();
        this.setSortingPlugin(scriptConfig?.sortingPlugin);
    }
    async syncRuntimeConfigFromConfiguration() {
        const importConfig = await this._configInstance.get();
        this._assetConfig.restoreAssetDBFromCache = importConfig.restoreAssetDBFromCache ?? false;
        this._assetConfig.globList = importConfig.globList ?? [];
        this._assetConfig.createTemplateRoot = (0, import_config_defaults_1.resolveImportTemplateRoot)(this._assetConfig.root, importConfig.createTemplateRoot ?? import_config_defaults_1.DEFAULT_CREATE_TEMPLATE_ROOT);
        await this.syncSortingPluginFromConfiguration();
    }
    watchConfigurationChanges() {
        if (this._watchingConfiguration) {
            return;
        }
        this._watchingConfiguration = true;
        configuration_1.configurationRegistry.on(interface_1.MessageType.Registry, (instance) => {
            if (instance.moduleName === 'script') {
                void this.syncSortingPluginFromConfiguration();
            }
        });
        configuration_1.configurationManager.on(interface_1.MessageType.Update, (key) => {
            if (key === 'script.sortingPlugin' || key === 'script') {
                void this.syncSortingPluginFromConfiguration();
            }
        });
        configuration_1.configurationManager.on(interface_1.MessageType.Remove, (key) => {
            if (key === 'script.sortingPlugin' || key === 'script') {
                this.setSortingPlugin([]);
            }
        });
        configuration_1.configurationManager.on(interface_1.MessageType.Reload, () => {
            void this.syncRuntimeConfigFromConfiguration();
        });
    }
}
exports.default = new AssetConfig();
