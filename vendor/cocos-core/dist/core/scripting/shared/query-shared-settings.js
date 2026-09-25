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
exports.scriptConfig = void 0;
exports.getDefaultSharedSettings = getDefaultSharedSettings;
exports.querySharedSettings = querySharedSettings;
const fs_extra_1 = __importDefault(require("fs-extra"));
const url_1 = require("url");
const fs_1 = require("fs");
const configuration_1 = require("../../configuration");
const utils_1 = __importDefault(require("../../base/utils"));
const metadata_1 = require("./metadata");
function getDefaultSharedSettings() {
    return {
        useDefineForClassFields: true,
        allowDeclareFields: true,
        loose: false,
        guessCommonJsExports: false,
        exportsConditions: [],
        sortingPlugin: [],
        preserveSymlinks: false,
        importMap: '',
        previewBrowserslistConfigFile: '',
        updateAutoUpdateImportConfig: false,
    };
}
class ScriptConfig {
    _config = getDefaultSharedSettings();
    /**
     * 持有的可双向绑定的配置管理实例
     * TODO 目前没有防护没有 init 的情况
     */
    _configInstance;
    _init = false;
    async init() {
        if (this._init) {
            return;
        }
        this._configInstance = await configuration_1.configurationRegistry.register('script', {
            defaults: getDefaultSharedSettings(),
            nodes: () => (0, metadata_1.createScriptMetadataNodes)(),
        });
        this._init = true;
    }
    getProject(path, scope) {
        return this._configInstance.get(path, scope);
    }
    async setProject(path, value, scope) {
        const result = await this._configInstance.set(path, value, scope);
        if (path === 'sortingPlugin') {
            const { default: assetConfig } = await Promise.resolve().then(() => __importStar(require('../../assets/asset-config')));
            assetConfig.setSortingPlugin(value);
        }
        return result;
    }
}
exports.scriptConfig = new ScriptConfig();
async function querySharedSettings(logger) {
    const { useDefineForClassFields, allowDeclareFields, loose, guessCommonJsExports, exportsConditions, importMap: importMapFile, preserveSymlinks, } = await exports.scriptConfig.getProject();
    let importMap;
    // ui-file 可能因为清空产生 project:// 这样的数据，应视为空字符串一样的处理逻辑
    if (importMapFile && importMapFile !== 'project://') {
        const importMapFilePath = utils_1.default.Path.resolveToRaw(importMapFile);
        if (importMapFilePath && (0, fs_1.existsSync)(importMapFilePath)) {
            try {
                const importMapJson = await fs_extra_1.default.readJson(importMapFilePath, { encoding: 'utf8' });
                if (!verifyImportMapJson(importMapJson)) {
                    logger.error('Ill-formed import map.');
                }
                else {
                    importMap = {
                        json: importMapJson,
                        url: (0, url_1.pathToFileURL)(importMapFilePath).href,
                    };
                }
            }
            catch (err) {
                logger.error(`Failed to load import map at ${importMapFile}: ${err}`);
            }
        }
        else {
            logger.warn(`Import map file not found in: ${importMapFilePath || importMapFile}`);
        }
    }
    return {
        useDefineForClassFields: useDefineForClassFields ?? true,
        allowDeclareFields: allowDeclareFields ?? true,
        loose: loose ?? false,
        exportsConditions: exportsConditions ?? [],
        guessCommonJsExports: guessCommonJsExports ?? false,
        importMap,
        preserveSymlinks: preserveSymlinks ?? false,
    };
}
/**
 * Verify the unknown input value is allowed shape of an import map.
 * This is not parse.
 * @param input
 * @param logger
 * @returns
 */
function verifyImportMapJson(input) {
    if (typeof input !== 'object' || !input) {
        return false;
    }
    const verifySpecifierMap = (specifierMapInput) => {
        if (typeof specifierMapInput !== 'object' || !specifierMapInput) {
            return false;
        }
        for (const value of Object.values(specifierMapInput)) {
            if (typeof value !== 'string') {
                return false;
            }
        }
        return true;
    };
    if ('imports' in input) {
        if (!verifySpecifierMap(input.imports)) {
            return false;
        }
    }
    if ('scopes' in input) {
        for (const value of Object.values(input)) {
            if (!verifySpecifierMap(value)) {
                return false;
            }
        }
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnktc2hhcmVkLXNldHRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NyaXB0aW5nL3NoYXJlZC9xdWVyeS1zaGFyZWQtc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLDREQWFDO0FBdUNELGtEQTJDQztBQXRIRCx3REFBMEI7QUFDMUIsNkJBQW9DO0FBR3BDLDJCQUFnQztBQUNoQyx1REFBb0c7QUFDcEcsNkRBQXFDO0FBRXJDLHlDQUF1RDtBQWV2RCxTQUFnQix3QkFBd0I7SUFDcEMsT0FBTztRQUNILHVCQUF1QixFQUFFLElBQUk7UUFDN0Isa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixLQUFLLEVBQUUsS0FBSztRQUNaLG9CQUFvQixFQUFFLEtBQUs7UUFDM0IsaUJBQWlCLEVBQUUsRUFBRTtRQUNyQixhQUFhLEVBQUUsRUFBRTtRQUNqQixnQkFBZ0IsRUFBRSxLQUFLO1FBQ3ZCLFNBQVMsRUFBRSxFQUFFO1FBQ2IsNkJBQTZCLEVBQUUsRUFBRTtRQUNqQyw0QkFBNEIsRUFBRSxLQUFLO0tBQ3RDLENBQUM7QUFDTixDQUFDO0FBRUQsTUFBTSxZQUFZO0lBQ04sT0FBTyxHQUF3Qix3QkFBd0IsRUFBRSxDQUFDO0lBQ2xFOzs7T0FHRztJQUNLLGVBQWUsQ0FBc0I7SUFFckMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUV0QixLQUFLLENBQUMsSUFBSTtRQUNOLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2IsT0FBTztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0scUNBQXFCLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUNsRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUU7WUFDcEMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsb0NBQXlCLEdBQUU7U0FDM0MsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDdEIsQ0FBQztJQUVELFVBQVUsQ0FBSSxJQUFhLEVBQUUsS0FBMEI7UUFDbkQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBSSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBWSxFQUFFLEtBQVUsRUFBRSxLQUEwQjtRQUNqRSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEUsSUFBSSxJQUFJLEtBQUssZUFBZSxFQUFFLENBQUM7WUFDM0IsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyx3REFBYSwyQkFBMkIsR0FBQyxDQUFDO1lBQzNFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztDQUNKO0FBRVksUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUV4QyxLQUFLLFVBQVUsbUJBQW1CLENBQUMsTUFBYztJQUNwRCxNQUFNLEVBQ0YsdUJBQXVCLEVBQ3ZCLGtCQUFrQixFQUNsQixLQUFLLEVBQ0wsb0JBQW9CLEVBQ3BCLGlCQUFpQixFQUNqQixTQUFTLEVBQUUsYUFBYSxFQUN4QixnQkFBZ0IsR0FDbkIsR0FBRyxNQUFNLG9CQUFZLENBQUMsVUFBVSxFQUF1QixDQUFDO0lBRXpELElBQUksU0FBc0MsQ0FBQztJQUMzQyxtREFBbUQ7SUFDbkQsSUFBSSxhQUFhLElBQUksYUFBYSxLQUFLLFlBQVksRUFBRSxDQUFDO1FBQ2xELE1BQU0saUJBQWlCLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDakUsSUFBSSxpQkFBaUIsSUFBSSxJQUFBLGVBQVUsRUFBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDckQsSUFBSSxDQUFDO2dCQUNELE1BQU0sYUFBYSxHQUFHLE1BQU0sa0JBQUUsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQVksQ0FBQztnQkFDNUYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLE1BQU0sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDM0MsQ0FBQztxQkFBTSxDQUFDO29CQUNKLFNBQVMsR0FBRzt3QkFDUixJQUFJLEVBQUUsYUFBYTt3QkFDbkIsR0FBRyxFQUFFLElBQUEsbUJBQWEsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUk7cUJBQzdDLENBQUM7Z0JBQ04sQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLGFBQWEsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLENBQUM7UUFDTCxDQUFDO2FBQU0sQ0FBQztZQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLGlCQUFpQixJQUFJLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDdkYsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsdUJBQXVCLEVBQUUsdUJBQXVCLElBQUksSUFBSTtRQUN4RCxrQkFBa0IsRUFBRSxrQkFBa0IsSUFBSSxJQUFJO1FBQzlDLEtBQUssRUFBRSxLQUFLLElBQUksS0FBSztRQUNyQixpQkFBaUIsRUFBRSxpQkFBaUIsSUFBSSxFQUFFO1FBQzFDLG9CQUFvQixFQUFFLG9CQUFvQixJQUFJLEtBQUs7UUFDbkQsU0FBUztRQUNULGdCQUFnQixFQUFFLGdCQUFnQixJQUFJLEtBQUs7S0FDOUMsQ0FBQztBQUNOLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLG1CQUFtQixDQUFDLEtBQWM7SUFDdkMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QyxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLGlCQUEwQixFQUErQyxFQUFFO1FBQ25HLElBQUksT0FBTyxpQkFBaUIsS0FBSyxRQUFRLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzlELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFDRCxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1lBQ25ELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0lBRUYsSUFBSSxTQUFTLElBQUksS0FBSyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLGtCQUFrQixDQUFFLEtBQThCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMvRCxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO0lBQ0wsQ0FBQztJQUNELElBQUksUUFBUSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3BCLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3QixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgcHMgZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgcGF0aFRvRmlsZVVSTCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgdHlwZSB7IEltcG9ydE1hcCB9IGZyb20gJ0Bjb2Nvcy9jcmVhdG9yLXByb2dyYW1taW5nLWltcG9ydC1tYXBzL2xpYi9pbXBvcnQtbWFwJztcbmltcG9ydCB0eXBlIHsgTG9nZ2VyIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItcHJvZ3JhbW1pbmctY29tbW9uL2xpYi9sb2dnZXInO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGNvbmZpZ3VyYXRpb25SZWdpc3RyeSwgQ29uZmlndXJhdGlvblNjb3BlLCBJQmFzZUNvbmZpZ3VyYXRpb24gfSBmcm9tICcuLi8uLi9jb25maWd1cmF0aW9uJztcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IFNjcmlwdFByb2plY3RDb25maWcgfSBmcm9tICcuLi9AdHlwZXMvY29uZmlnLWV4cG9ydCc7XG5pbXBvcnQgeyBjcmVhdGVTY3JpcHRNZXRhZGF0YU5vZGVzIH0gZnJvbSAnLi9tZXRhZGF0YSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcmVkU2V0dGluZ3MgZXh0ZW5kcyBQaWNrPFNjcmlwdFByb2plY3RDb25maWcsICd1c2VEZWZpbmVGb3JDbGFzc0ZpZWxkcycgfCAnYWxsb3dEZWNsYXJlRmllbGRzJyB8ICdsb29zZScgfCAnZ3Vlc3NDb21tb25Kc0V4cG9ydHMnIHwgJ2V4cG9ydHNDb25kaXRpb25zJz4ge1xuICAgIHVzZURlZmluZUZvckNsYXNzRmllbGRzOiBib29sZWFuO1xuICAgIGFsbG93RGVjbGFyZUZpZWxkczogYm9vbGVhbjtcbiAgICBsb29zZTogYm9vbGVhbjtcbiAgICBndWVzc0NvbW1vbkpzRXhwb3J0czogYm9vbGVhbjtcbiAgICBleHBvcnRzQ29uZGl0aW9uczogc3RyaW5nW107XG4gICAgaW1wb3J0TWFwPzoge1xuICAgICAgICBqc29uOiBJbXBvcnRNYXA7XG4gICAgICAgIHVybDogc3RyaW5nO1xuICAgIH07XG4gICAgcHJlc2VydmVTeW1saW5rczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRTaGFyZWRTZXR0aW5ncygpOiBTY3JpcHRQcm9qZWN0Q29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB1c2VEZWZpbmVGb3JDbGFzc0ZpZWxkczogdHJ1ZSxcbiAgICAgICAgYWxsb3dEZWNsYXJlRmllbGRzOiB0cnVlLFxuICAgICAgICBsb29zZTogZmFsc2UsXG4gICAgICAgIGd1ZXNzQ29tbW9uSnNFeHBvcnRzOiBmYWxzZSxcbiAgICAgICAgZXhwb3J0c0NvbmRpdGlvbnM6IFtdLFxuICAgICAgICBzb3J0aW5nUGx1Z2luOiBbXSxcbiAgICAgICAgcHJlc2VydmVTeW1saW5rczogZmFsc2UsXG4gICAgICAgIGltcG9ydE1hcDogJycsXG4gICAgICAgIHByZXZpZXdCcm93c2Vyc2xpc3RDb25maWdGaWxlOiAnJyxcbiAgICAgICAgdXBkYXRlQXV0b1VwZGF0ZUltcG9ydENvbmZpZzogZmFsc2UsXG4gICAgfTtcbn1cblxuY2xhc3MgU2NyaXB0Q29uZmlnIHtcbiAgICBwcml2YXRlIF9jb25maWc6IFNjcmlwdFByb2plY3RDb25maWcgPSBnZXREZWZhdWx0U2hhcmVkU2V0dGluZ3MoKTtcbiAgICAvKipcbiAgICAgKiDmjIHmnInnmoTlj6/lj4zlkJHnu5HlrprnmoTphY3nva7nrqHnkIblrp7kvotcbiAgICAgKiBUT0RPIOebruWJjeayoeaciemYsuaKpOayoeaciSBpbml0IOeahOaDheWGtVxuICAgICAqL1xuICAgIHByaXZhdGUgX2NvbmZpZ0luc3RhbmNlITogSUJhc2VDb25maWd1cmF0aW9uO1xuXG4gICAgcHJpdmF0ZSBfaW5pdCA9IGZhbHNlO1xuXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luaXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb25maWdJbnN0YW5jZSA9IGF3YWl0IGNvbmZpZ3VyYXRpb25SZWdpc3RyeS5yZWdpc3Rlcignc2NyaXB0Jywge1xuICAgICAgICAgICAgZGVmYXVsdHM6IGdldERlZmF1bHRTaGFyZWRTZXR0aW5ncygpLFxuICAgICAgICAgICAgbm9kZXM6ICgpID0+IGNyZWF0ZVNjcmlwdE1ldGFkYXRhTm9kZXMoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgIH1cblxuICAgIGdldFByb2plY3Q8VD4ocGF0aD86IHN0cmluZywgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ0luc3RhbmNlLmdldDxUPihwYXRoLCBzY29wZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2V0UHJvamVjdChwYXRoOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNjb3BlPzogQ29uZmlndXJhdGlvblNjb3BlKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX2NvbmZpZ0luc3RhbmNlLnNldChwYXRoLCB2YWx1ZSwgc2NvcGUpO1xuICAgICAgICBpZiAocGF0aCA9PT0gJ3NvcnRpbmdQbHVnaW4nKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGFzc2V0Q29uZmlnIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2Fzc2V0cy9hc3NldC1jb25maWcnKTtcbiAgICAgICAgICAgIGFzc2V0Q29uZmlnLnNldFNvcnRpbmdQbHVnaW4odmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3Qgc2NyaXB0Q29uZmlnID0gbmV3IFNjcmlwdENvbmZpZygpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlTaGFyZWRTZXR0aW5ncyhsb2dnZXI6IExvZ2dlcik6IFByb21pc2U8U2hhcmVkU2V0dGluZ3M+IHtcbiAgICBjb25zdCB7XG4gICAgICAgIHVzZURlZmluZUZvckNsYXNzRmllbGRzLFxuICAgICAgICBhbGxvd0RlY2xhcmVGaWVsZHMsXG4gICAgICAgIGxvb3NlLFxuICAgICAgICBndWVzc0NvbW1vbkpzRXhwb3J0cyxcbiAgICAgICAgZXhwb3J0c0NvbmRpdGlvbnMsXG4gICAgICAgIGltcG9ydE1hcDogaW1wb3J0TWFwRmlsZSxcbiAgICAgICAgcHJlc2VydmVTeW1saW5rcyxcbiAgICB9ID0gYXdhaXQgc2NyaXB0Q29uZmlnLmdldFByb2plY3Q8U2NyaXB0UHJvamVjdENvbmZpZz4oKTtcblxuICAgIGxldCBpbXBvcnRNYXA6IFNoYXJlZFNldHRpbmdzWydpbXBvcnRNYXAnXTtcbiAgICAvLyB1aS1maWxlIOWPr+iDveWboOS4uua4heepuuS6p+eUnyBwcm9qZWN0Oi8vIOi/meagt+eahOaVsOaNru+8jOW6lOinhuS4uuepuuWtl+espuS4suS4gOagt+eahOWkhOeQhumAu+i+kVxuICAgIGlmIChpbXBvcnRNYXBGaWxlICYmIGltcG9ydE1hcEZpbGUgIT09ICdwcm9qZWN0Oi8vJykge1xuICAgICAgICBjb25zdCBpbXBvcnRNYXBGaWxlUGF0aCA9IFV0aWxzLlBhdGgucmVzb2x2ZVRvUmF3KGltcG9ydE1hcEZpbGUpO1xuICAgICAgICBpZiAoaW1wb3J0TWFwRmlsZVBhdGggJiYgZXhpc3RzU3luYyhpbXBvcnRNYXBGaWxlUGF0aCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0TWFwSnNvbiA9IGF3YWl0IGZzLnJlYWRKc29uKGltcG9ydE1hcEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSkgYXMgdW5rbm93bjtcbiAgICAgICAgICAgICAgICBpZiAoIXZlcmlmeUltcG9ydE1hcEpzb24oaW1wb3J0TWFwSnNvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdJbGwtZm9ybWVkIGltcG9ydCBtYXAuJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0TWFwID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAganNvbjogaW1wb3J0TWFwSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcGF0aFRvRmlsZVVSTChpbXBvcnRNYXBGaWxlUGF0aCkuaHJlZixcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYEZhaWxlZCB0byBsb2FkIGltcG9ydCBtYXAgYXQgJHtpbXBvcnRNYXBGaWxlfTogJHtlcnJ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihgSW1wb3J0IG1hcCBmaWxlIG5vdCBmb3VuZCBpbjogJHtpbXBvcnRNYXBGaWxlUGF0aCB8fCBpbXBvcnRNYXBGaWxlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdXNlRGVmaW5lRm9yQ2xhc3NGaWVsZHM6IHVzZURlZmluZUZvckNsYXNzRmllbGRzID8/IHRydWUsXG4gICAgICAgIGFsbG93RGVjbGFyZUZpZWxkczogYWxsb3dEZWNsYXJlRmllbGRzID8/IHRydWUsXG4gICAgICAgIGxvb3NlOiBsb29zZSA/PyBmYWxzZSxcbiAgICAgICAgZXhwb3J0c0NvbmRpdGlvbnM6IGV4cG9ydHNDb25kaXRpb25zID8/IFtdLFxuICAgICAgICBndWVzc0NvbW1vbkpzRXhwb3J0czogZ3Vlc3NDb21tb25Kc0V4cG9ydHMgPz8gZmFsc2UsXG4gICAgICAgIGltcG9ydE1hcCxcbiAgICAgICAgcHJlc2VydmVTeW1saW5rczogcHJlc2VydmVTeW1saW5rcyA/PyBmYWxzZSxcbiAgICB9O1xufVxuXG4vKipcbiAqIFZlcmlmeSB0aGUgdW5rbm93biBpbnB1dCB2YWx1ZSBpcyBhbGxvd2VkIHNoYXBlIG9mIGFuIGltcG9ydCBtYXAuXG4gKiBUaGlzIGlzIG5vdCBwYXJzZS5cbiAqIEBwYXJhbSBpbnB1dCBcbiAqIEBwYXJhbSBsb2dnZXIgXG4gKiBAcmV0dXJucyBcbiAqL1xuZnVuY3Rpb24gdmVyaWZ5SW1wb3J0TWFwSnNvbihpbnB1dDogdW5rbm93bik6IGlucHV0IGlzIEltcG9ydE1hcCB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcgfHwgIWlucHV0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZXJpZnlTcGVjaWZpZXJNYXAgPSAoc3BlY2lmaWVyTWFwSW5wdXQ6IHVua25vd24pOiBzcGVjaWZpZXJNYXBJbnB1dCBpcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzcGVjaWZpZXJNYXBJbnB1dCAhPT0gJ29iamVjdCcgfHwgIXNwZWNpZmllck1hcElucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBPYmplY3QudmFsdWVzKHNwZWNpZmllck1hcElucHV0KSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIGlmICgnaW1wb3J0cycgaW4gaW5wdXQpIHtcbiAgICAgICAgaWYgKCF2ZXJpZnlTcGVjaWZpZXJNYXAoKGlucHV0IGFzIHsgaW1wb3J0czogdW5rbm93biB9KS5pbXBvcnRzKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICgnc2NvcGVzJyBpbiBpbnB1dCkge1xuICAgICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIE9iamVjdC52YWx1ZXMoaW5wdXQpKSB7XG4gICAgICAgICAgICBpZiAoIXZlcmlmeVNwZWNpZmllck1hcCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbiJdfQ==