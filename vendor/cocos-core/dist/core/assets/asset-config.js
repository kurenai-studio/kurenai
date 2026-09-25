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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtCQUE0QjtBQUM1QiwyQkFBNkM7QUFFN0Msb0RBQXVIO0FBQ3ZILGlFQUFnRTtBQUNoRSx5REFBaUM7QUFDakMsc0NBQW1DO0FBQ25DLHlDQUF1RDtBQUN2RCxxRUFBbUc7QUFnQ25HLE1BQU0sV0FBVztJQUNiOztPQUVHO0lBQ0ssWUFBWSxHQUFrQjtRQUNsQyx1QkFBdUIsRUFBRSxLQUFLO1FBQzlCLGlCQUFpQixFQUFFLEtBQUs7UUFDeEIsUUFBUSxFQUFFLEVBQUU7UUFDWixXQUFXLEVBQUUsRUFBRTtRQUNmLElBQUksRUFBRSxFQUFFO1FBQ1IsV0FBVyxFQUFFLEVBQUU7UUFDZixRQUFRLEVBQUUsRUFBRTtRQUNaLGtCQUFrQixFQUFFLEVBQUU7UUFDdEIsYUFBYSxFQUFFLEVBQUU7UUFDakIscUJBQXFCO0tBQ3hCLENBQUM7SUFFTSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2Qsc0JBQXNCLEdBQUcsS0FBSyxDQUFDO0lBRXZDOztPQUVHO0lBQ0ssZUFBZSxDQUFzQjtJQUM3QyxJQUFJLElBQUk7UUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDN0IsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJO1FBQ04sSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDekMsT0FBTztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0scUNBQXFCLENBQUMsUUFBUSxDQUFDLFFB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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZGRpclN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBBc3NldERCUmVnaXN0ZXJJbmZvIH0gZnJvbSAnLi9AdHlwZXMvcHJpdmF0ZSc7XG5pbXBvcnQgeyBjb25maWd1cmF0aW9uTWFuYWdlciwgY29uZmlndXJhdGlvblJlZ2lzdHJ5LCBDb25maWd1cmF0aW9uU2NvcGUsIElCYXNlQ29uZmlndXJhdGlvbiB9IGZyb20gJy4uL2NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgTWVzc2FnZVR5cGUgfSBmcm9tICcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9pbnRlcmZhY2UnO1xuaW1wb3J0IHByb2plY3QgZnJvbSAnLi4vcHJvamVjdCc7XG5pbXBvcnQgeyBFbmdpbmUgfSBmcm9tICcuLi9lbmdpbmUnO1xuaW1wb3J0IHsgY3JlYXRlSW1wb3J0TWV0YWRhdGFOb2RlcyB9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHsgREVGQVVMVF9DUkVBVEVfVEVNUExBVEVfUk9PVCwgcmVzb2x2ZUltcG9ydFRlbXBsYXRlUm9vdCB9IGZyb20gJy4vaW1wb3J0LWNvbmZpZy1kZWZhdWx0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXREQkNvbmZpZyB7XG4gICAgcmVzdG9yZUFzc2V0REJGcm9tQ2FjaGU6IGJvb2xlYW47XG4gICAgZmxhZ1JlaW1wb3J0Q2hlY2s6IGJvb2xlYW47XG4gICAgZ2xvYkxpc3Q/OiBzdHJpbmdbXTtcbiAgICAvKipcbiAgICAgKiDotYTmupAgdXNlckRhdGEg55qE6buY6K6k5YC8XG4gICAgICovXG4gICAgdXNlckRhdGFUZW1wbGF0ZT86IFJlY29yZDxzdHJpbmcsIGFueT47XG5cbiAgICAvKipcbiAgICAgKiDotYTmupDmlbDmja7lupPkv6Hmga/liJfooahcbiAgICAgKi9cbiAgICBhc3NldERCTGlzdDogQXNzZXREQlJlZ2lzdGVySW5mb1tdO1xuXG4gICAgLyoqXG4gICAgICog6LWE5rqQ5qC555uu5b2V77yM6YCa5bi45piv6aG555uu55uu5b2VXG4gICAgICovXG4gICAgcm9vdDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICog6LWE5rqQ5bqT5a+85YWl5ZCO5qC555uu5b2V77yM6YCa5bi45qC55o2u6YWN572u55qEIHJvb3Qg6K6h566XXG4gICAgICovXG4gICAgbGlicmFyeVJvb3Q6IHN0cmluZztcblxuICAgIHRlbXBSb290OiBzdHJpbmc7XG4gICAgY3JlYXRlVGVtcGxhdGVSb290OiBzdHJpbmc7XG5cbiAgICBzb3J0aW5nUGx1Z2luOiBzdHJpbmdbXTtcbn1cblxuY2xhc3MgQXNzZXRDb25maWcge1xuICAgIC8qKlxuICAgICAqIOeOr+Wig+WFseS6q+eahOi1hOa6kOW6k+mFjee9rlxuICAgICAqL1xuICAgIHByaXZhdGUgX2Fzc2V0Q29uZmlnOiBBc3NldERCQ29uZmlnID0ge1xuICAgICAgICByZXN0b3JlQXNzZXREQkZyb21DYWNoZTogZmFsc2UsXG4gICAgICAgIGZsYWdSZWltcG9ydENoZWNrOiBmYWxzZSxcbiAgICAgICAgZ2xvYkxpc3Q6IFtdLFxuICAgICAgICBhc3NldERCTGlzdDogW10sXG4gICAgICAgIHJvb3Q6ICcnLFxuICAgICAgICBsaWJyYXJ5Um9vdDogJycsXG4gICAgICAgIHRlbXBSb290OiAnJyxcbiAgICAgICAgY3JlYXRlVGVtcGxhdGVSb290OiAnJyxcbiAgICAgICAgc29ydGluZ1BsdWdpbjogW10sXG4gICAgICAgIC8vIGZieC5tYXRlcmlhbC5zbWFydFxuICAgIH07XG5cbiAgICBwcml2YXRlIF9pbml0ID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfd2F0Y2hpbmdDb25maWd1cmF0aW9uID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiDmjIHmnInnmoTlj6/lj4zlkJHnu5HlrprnmoTphY3nva7nrqHnkIblrp7kvotcbiAgICAgKi9cbiAgICBwcml2YXRlIF9jb25maWdJbnN0YW5jZSE6IElCYXNlQ29uZmlndXJhdGlvbjtcbiAgICBnZXQgZGF0YSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Fzc2V0Q29uZmlnIG5vdCBpbml0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2Fzc2V0Q29uZmlnO1xuICAgIH1cblxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0Fzc2V0Q29uZmlnIGFscmVhZHkgaW5pdCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbmZpZ0luc3RhbmNlID0gYXdhaXQgY29uZmlndXJhdGlvblJlZ2lzdHJ5LnJlZ2lzdGVyKCdpbXBvcnQnLCB7XG4gICAgICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgICAgIHJlc3RvcmVBc3NldERCRnJvbUNhY2hlOiB0aGlzLl9hc3NldENvbmZpZy5yZXN0b3JlQXNzZXREQkZyb21DYWNoZSxcbiAgICAgICAgICAgICAgICBnbG9iTGlzdDogdGhpcy5fYXNzZXRDb25maWcuZ2xvYkxpc3QgPz8gW10sXG4gICAgICAgICAgICAgICAgY3JlYXRlVGVtcGxhdGVSb290OiBERUZBVUxUX0NSRUFURV9URU1QTEFURV9ST09ULFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5vZGVzOiAoKSA9PiBjcmVhdGVJbXBvcnRNZXRhZGF0YU5vZGVzKCksXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXByb2plY3QucGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9qZWN0IG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Fzc2V0Q29uZmlnLnJvb3QgPSBwcm9qZWN0LnBhdGg7XG4gICAgICAgIGNvbnN0IGVuZ2luZVBhdGggPSBFbmdpbmUuZ2V0SW5mbygpLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgdGhpcy5fYXNzZXRDb25maWcubGlicmFyeVJvb3QgPSB0aGlzLl9hc3NldENvbmZpZy5saWJyYXJ5Um9vdCB8fCBqb2luKHRoaXMuX2Fzc2V0Q29uZmlnLnJvb3QsICdsaWJyYXJ5Jyk7XG4gICAgICAgIHRoaXMuX2Fzc2V0Q29uZmlnLnRlbXBSb290ID0gam9pbih0aGlzLl9hc3NldENvbmZpZy5yb290LCAndGVtcC9hc3NldC1kYicpO1xuICAgICAgICB0aGlzLndhdGNoQ29uZmlndXJhdGlvbkNoYW5nZXMoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zeW5jUnVudGltZUNvbmZpZ0Zyb21Db25maWd1cmF0aW9uKCk7XG4gICAgICAgIHRoaXMuX2Fzc2V0Q29uZmlnLmFzc2V0REJMaXN0ID0gW3tcbiAgICAgICAgICAgIG5hbWU6ICdhc3NldHMnLFxuICAgICAgICAgICAgdGFyZ2V0OiBqb2luKHRoaXMuX2Fzc2V0Q29uZmlnLnJvb3QsICdhc3NldHMnKSxcbiAgICAgICAgICAgIHJlYWRvbmx5OiBmYWxzZSxcbiAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICBsaWJyYXJ5OiBqb2luKHRoaXMuX2Fzc2V0Q29uZmlnLnJvb3QsICdsaWJyYXJ5JyksXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdpbnRlcm5hbCcsXG4gICAgICAgICAgICB0YXJnZXQ6IGpvaW4oZW5naW5lUGF0aCwgJ2VkaXRvci9hc3NldHMnKSxcbiAgICAgICAgICAgIHJlYWRvbmx5OiB0cnVlLFxuICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGxpYnJhcnk6IGpvaW4oZW5naW5lUGF0aCwgJ2VkaXRvci9saWJyYXJ5JyksXG4gICAgICAgIH1dO1xuXG4gICAgICAgIC8vIFNjYW4gcHJvamVjdCBleHRlbnNpb25zIGZvciBhc3NldC1kYiBtb3VudCBjb250cmlidXRpb25zIGFuZCByZWdpc3RlciB0aGVpciBkYjovLyBkb21haW5zXG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbnNEaXIgPSBqb2luKHRoaXMuX2Fzc2V0Q29uZmlnLnJvb3QsICdleHRlbnNpb25zJyk7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGV4dGVuc2lvbnNEaXIpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSByZWFkZGlyU3luYyhleHRlbnNpb25zRGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZW50cnkuaXNEaXJlY3RvcnkoKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dERpciA9IGpvaW4oZXh0ZW5zaW9uc0RpciwgZW50cnkubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBrZ0pzb25QYXRoID0gam9pbihleHREaXIsICdwYWNrYWdlLmpzb24nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFleGlzdHNTeW5jKHBrZ0pzb25QYXRoKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwa2dKc29uID0gSlNPTi5wYXJzZShyZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYyhwa2dKc29uUGF0aCwgJ3V0ZjgnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3VudCA9IHBrZ0pzb24/LmNvbnRyaWJ1dGlvbnM/LlsnYXNzZXQtZGInXT8ubW91bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1vdW50Py5wYXRoKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdW50VGFyZ2V0ID0gam9pbihleHREaXIsIG1vdW50LnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFleGlzdHNTeW5jKG1vdW50VGFyZ2V0KSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hc3NldENvbmZpZy5hc3NldERCTGlzdC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwa2dKc29uLm5hbWUgfHwgZW50cnkubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IG1vdW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRvbmx5OiBtb3VudC5yZWFkb25seSA/PyB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGU6IG1vdW50LnZpc2libGUgPz8gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlicmFyeTogam9pbih0aGlzLl9hc3NldENvbmZpZy5yb290LCBgbGlicmFyeS8ke3BrZ0pzb24ubmFtZSB8fCBlbnRyeS5uYW1lfWApLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBleHRlbnNpb25zIHdpdGggaW52YWxpZCBwYWNrYWdlLmpzb25cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIC8vIElnbm9yZSBlcnJvcnMgc2Nhbm5pbmcgZXh0ZW5zaW9ucyBkaXJlY3RvcnlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgIH1cblxuICAgIGdldFByb2plY3Q8VD4ocGF0aDogc3RyaW5nLCBzY29wZT86IENvbmZpZ3VyYXRpb25TY29wZSk6IFByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnSW5zdGFuY2UuZ2V0KHBhdGgsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBzZXRQcm9qZWN0KHBhdGg6IHN0cmluZywgdmFsdWU6IGFueSwgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ0luc3RhbmNlLnNldChwYXRoLCB2YWx1ZSwgc2NvcGUpO1xuICAgIH1cblxuICAgIHNldFNvcnRpbmdQbHVnaW4odmFsdWU6IHVua25vd24pIHtcbiAgICAgICAgdGhpcy5fYXNzZXRDb25maWcuc29ydGluZ1BsdWdpbiA9IEFycmF5LmlzQXJyYXkodmFsdWUpXG4gICAgICAgICAgICA/IHZhbHVlLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgc3RyaW5nID0+IHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgIDogW107XG4gICAgfVxuXG4gICAgYXN5bmMgc3luY1NvcnRpbmdQbHVnaW5Gcm9tQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgY29uc3Qgc2NyaXB0Q29uZmlnSW5zdGFuY2UgPSBjb25maWd1cmF0aW9uUmVnaXN0cnkuZ2V0SW5zdGFuY2VzKCkuc2NyaXB0O1xuICAgICAgICBpZiAoIXNjcmlwdENvbmZpZ0luc3RhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHRDb25maWcgPSBhd2FpdCBzY3JpcHRDb25maWdJbnN0YW5jZS5nZXQ8eyBzb3J0aW5nUGx1Z2luPzogdW5rbm93biB9PigpO1xuICAgICAgICB0aGlzLnNldFNvcnRpbmdQbHVnaW4oc2NyaXB0Q29uZmlnPy5zb3J0aW5nUGx1Z2luKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHN5bmNSdW50aW1lQ29uZmlnRnJvbUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGltcG9ydENvbmZpZyA9IGF3YWl0IHRoaXMuX2NvbmZpZ0luc3RhbmNlLmdldDxQYXJ0aWFsPFBpY2s8QXNzZXREQkNvbmZpZywgJ3Jlc3RvcmVBc3NldERCRnJvbUNhY2hlJyB8ICdnbG9iTGlzdCcgfCAnY3JlYXRlVGVtcGxhdGVSb290Jz4+PigpO1xuICAgICAgICB0aGlzLl9hc3NldENvbmZpZy5yZXN0b3JlQXNzZXREQkZyb21DYWNoZSA9IGltcG9ydENvbmZpZy5yZXN0b3JlQXNzZXREQkZyb21DYWNoZSA/PyBmYWxzZTtcbiAgICAgICAgdGhpcy5fYXNzZXRDb25maWcuZ2xvYkxpc3QgPSBpbXBvcnRDb25maWcuZ2xvYkxpc3QgPz8gW107XG4gICAgICAgIHRoaXMuX2Fzc2V0Q29uZmlnLmNyZWF0ZVRlbXBsYXRlUm9vdCA9IHJlc29sdmVJbXBvcnRUZW1wbGF0ZVJvb3QoXG4gICAgICAgICAgICB0aGlzLl9hc3NldENvbmZpZy5yb290LFxuICAgICAgICAgICAgaW1wb3J0Q29uZmlnLmNyZWF0ZVRlbXBsYXRlUm9vdCA/PyBERUZBVUxUX0NSRUFURV9URU1QTEFURV9ST09UXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IHRoaXMuc3luY1NvcnRpbmdQbHVnaW5Gcm9tQ29uZmlndXJhdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgd2F0Y2hDb25maWd1cmF0aW9uQ2hhbmdlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuX3dhdGNoaW5nQ29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3dhdGNoaW5nQ29uZmlndXJhdGlvbiA9IHRydWU7XG5cbiAgICAgICAgY29uZmlndXJhdGlvblJlZ2lzdHJ5Lm9uKE1lc3NhZ2VUeXBlLlJlZ2lzdHJ5LCAoaW5zdGFuY2U6IElCYXNlQ29uZmlndXJhdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKGluc3RhbmNlLm1vZHVsZU5hbWUgPT09ICdzY3JpcHQnKSB7XG4gICAgICAgICAgICAgICAgdm9pZCB0aGlzLnN5bmNTb3J0aW5nUGx1Z2luRnJvbUNvbmZpZ3VyYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uZmlndXJhdGlvbk1hbmFnZXIub24oTWVzc2FnZVR5cGUuVXBkYXRlLCAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdzY3JpcHQuc29ydGluZ1BsdWdpbicgfHwga2V5ID09PSAnc2NyaXB0Jykge1xuICAgICAgICAgICAgICAgIHZvaWQgdGhpcy5zeW5jU29ydGluZ1BsdWdpbkZyb21Db25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbmZpZ3VyYXRpb25NYW5hZ2VyLm9uKE1lc3NhZ2VUeXBlLlJlbW92ZSwgKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnc2NyaXB0LnNvcnRpbmdQbHVnaW4nIHx8IGtleSA9PT0gJ3NjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFNvcnRpbmdQbHVnaW4oW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25maWd1cmF0aW9uTWFuYWdlci5vbihNZXNzYWdlVHlwZS5SZWxvYWQsICgpID0+IHtcbiAgICAgICAgICAgIHZvaWQgdGhpcy5zeW5jUnVudGltZUNvbmZpZ0Zyb21Db25maWd1cmF0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEFzc2V0Q29uZmlnKCk7XG4iXX0=