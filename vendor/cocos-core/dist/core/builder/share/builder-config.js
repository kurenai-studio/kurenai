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
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const utils_1 = require("./utils");
const configuration_1 = require("../../configuration");
const metadata_1 = require("./metadata");
class BuilderConfig {
    /**
     * 持有的可双向绑定的配置管理实例
     */
    _configInstance;
    getProject(path, scope) {
        return this._configInstance.get(path, scope);
    }
    setProject(path, value, scope) {
        return this._configInstance.set(path, value, scope);
    }
    commonOptionConfigs = {
        platform: {
            label: 'i18n:builder.options.platform',
            default: 'web-mobile',
            type: 'string',
        },
        name: {
            label: 'i18n:builder.options.name',
            type: 'string',
            // will update in init
            default: 'gameName',
            verifyRules: ['required'],
        },
        polyfills: {
            label: 'i18n:builder.options.polyfills',
            description: 'i18n:builder.options.polyfills_tips',
            type: 'object',
            hidden: true,
            default: {
                asyncFunctions: false,
            },
            properties: {
                asyncFunctions: {
                    label: 'i18n:builder.options.async_functions',
                    description: 'i18n:builder.options.async_functions_tips',
                    type: 'boolean',
                    default: false,
                },
                coreJs: {
                    label: 'i18n:builder.options.core_js',
                    description: 'i18n:builder.options.core_js_tips',
                    type: 'boolean',
                    default: false,
                },
            },
        },
        buildScriptTargets: {
            label: 'i18n:builder.options.buildScriptTargets',
            description: 'i18n:builder.options.buildScriptTargetsTips',
            hidden: true,
            type: 'string',
            default: '',
        },
        server: {
            label: 'i18n:builder.options.remote_server_address',
            description: 'i18n:builder.options.remote_server_address_tips',
            default: '',
            type: 'string',
            verifyRules: ['http'],
        },
        sourceMaps: {
            label: 'i18n:builder.options.sourceMap',
            default: 'inline',
            description: 'i18n:builder.options.sourceMapTips',
            type: 'enum',
            items: [{
                    label: 'i18n:builder.off',
                    value: 'false',
                }, {
                    label: 'i18n:builder.options.sourceMapsInline',
                    value: 'inline',
                }, {
                    label: 'i18n:builder.options.standaloneSourceMaps',
                    value: 'true',
                }],
        },
        experimentalEraseModules: {
            label: 'i18n:builder.options.experimental_erase_modules',
            description: 'i18n:builder.options.experimental_erase_modules_tips',
            default: false,
            experiment: true,
            type: 'boolean',
        },
        startSceneAssetBundle: {
            label: 'i18n:builder.options.start_scene_asset_bundle',
            description: 'i18n:builder.options.start_scene_asset_bundle_tips',
            default: false,
            hidden: true,
            type: 'boolean',
        },
        bundleConfigs: {
            label: 'i18n:builder.options.includeBundles',
            default: [],
            type: 'array',
            items: {
                type: 'object',
                properties: {}, // Placeholder for bundle config properties if needed
            },
            verifyLevel: 'warn',
        },
        // 之前 ios-app-clip 有隐藏 buildPath 的需求
        buildPath: {
            label: 'i18n:builder.options.build_path',
            description: 'i18n:builder.tips.build_path',
            default: 'project://build',
            type: 'string',
            verifyRules: ['required'],
        },
        debug: {
            label: 'i18n:builder.options.debug',
            description: 'i18n:builder.options.debugTips',
            default: true,
            type: 'boolean',
        },
        mangleProperties: {
            label: 'i18n:builder.options.mangleProperties',
            description: 'i18n:builder.options.manglePropertiesTip',
            default: false,
            type: 'boolean',
        },
        inlineEnum: {
            label: 'i18n:builder.options.inlineEnum',
            description: 'i18n:builder.options.inlineEnumTip',
            default: true,
            type: 'boolean',
        },
        md5Cache: {
            label: 'i18n:builder.options.md5_cache',
            description: 'i18n:builder.options.md5CacheTips',
            default: false,
            type: 'boolean',
        },
        md5CacheOptions: {
            default: {
                excludes: [],
                includes: [],
                replaceOnly: [],
                handleTemplateMd5Link: true,
            },
            type: 'object',
            properties: {
                excludes: { type: 'array', items: { type: 'string' }, default: [] },
                includes: { type: 'array', items: { type: 'string' }, default: [] },
                replaceOnly: { type: 'array', items: { type: 'string' }, default: [] },
                handleTemplateMd5Link: { type: 'boolean', default: true },
            },
        },
        mainBundleIsRemote: {
            label: 'i18n:builder.options.main_bundle_is_remote',
            description: 'i18n:builder.asset_bundle.remote_bundle_invalid_tooltip',
            default: false,
            type: 'boolean',
        },
        mainBundleCompressionType: {
            label: 'i18n:builder.options.main_bundle_compression_type',
            description: 'i18n:builder.asset_bundle.compression_type_tooltip',
            default: 'merge_dep',
            type: 'string',
        },
        useSplashScreen: {
            label: 'i18n:builder.use_splash_screen',
            default: true,
            type: 'boolean',
        },
        bundleCommonChunk: {
            label: 'i18n:builder.bundleCommonChunk',
            description: 'i18n:builder.bundleCommonChunkTips',
            default: false,
            type: 'boolean',
        },
        skipCompressTexture: {
            label: 'i18n:builder.options.skip_compress_texture',
            default: false,
            type: 'boolean',
        },
        packAutoAtlas: {
            label: 'i18n:builder.options.pack_autoAtlas',
            default: true,
            type: 'boolean',
        },
        startScene: {
            label: 'i18n:builder.options.start_scene',
            description: 'i18n:builder.options.startSceneTips',
            default: '',
            type: 'string',
        },
        outputName: {
            label: 'i18n:configuration.builder.platform.outputName.title',
            description: 'i18n:configuration.builder.platform.outputName.description',
            default: '',
            type: 'string',
            verifyRules: ['required', 'normalName'],
        },
        taskName: {
            default: '',
            type: 'string',
            verifyRules: ['required'],
        },
        scenes: {
            label: 'i18n:builder.options.scenes',
            description: 'i18n:builder.tips.build_scenes',
            default: [],
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    url: { type: 'string' },
                    uuid: { type: 'string' },
                },
            },
        },
        overwriteProjectSettings: {
            default: {
                macroConfig: {
                    cleanupImageCache: 'inherit-project-setting',
                },
                includeModules: {
                    physics: 'inherit-project-setting',
                    'physics-2d': 'inherit-project-setting',
                    'gfx-webgl2': 'off',
                },
            },
            type: 'object',
            properties: {
                macroConfig: {
                    type: 'object',
                    properties: {
                        cleanupImageCache: { type: 'string', default: 'inherit-project-setting' },
                    },
                },
                includeModules: {
                    type: 'object',
                    properties: {
                        physics: { type: 'string', default: 'inherit-project-setting' },
                        'physics-2d': { type: 'string', default: 'inherit-project-setting' },
                        'gfx-webgl2': { type: 'string', default: 'off' },
                    },
                },
            },
        },
        nativeCodeBundleMode: {
            default: 'asmjs',
            type: 'string',
        },
        wasmCompressionMode: {
            hidden: true,
            default: false,
            type: 'boolean',
        },
        binGroupConfig: {
            default: {
                threshold: 16,
                enable: false,
            },
            type: 'object',
            label: 'i18n:builder.options.bin_group_config',
            properties: {
                enable: {
                    label: 'i18n:builder.options.enable_cconb_group',
                    description: 'i18n:builder.options.enable_cconb_group_tips',
                    type: 'boolean',
                    default: false,
                },
                threshold: {
                    type: 'number',
                    default: 16,
                },
            },
        },
    };
    getBuildCommonOptions() {
        if (!this._init) {
            throw new Error('BuilderConfig is not initialized');
        }
        const defaultOptions = (0, utils_1.getOptionsDefault)(this.commonOptionConfigs);
        return {
            ...defaultOptions,
            moveRemoteBundleScript: false,
            packages: {},
        };
    }
    getDefaultConfig() {
        return {
            common: this.getBuildCommonOptions(),
            platforms: {
            // 'web-desktop': { xxx }
            },
            useCacheConfig: {
                serializeData: true,
                engine: true,
                textureCompress: true,
                autoAtlas: true,
            },
            bundleConfig: {
                custom: {},
            },
            textureCompressConfig: {
                userPreset: {},
                defaultConfig: {
                    default: {
                        name: 'Default Opaque',
                        options: {
                            miniGame: {
                                etc1_rgb: {
                                    quality: 'fast'
                                },
                                pvrtc_4bits_rgb: {
                                    quality: 'fast'
                                },
                                jpg: {
                                    quality: 80
                                }
                            },
                            android: {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                etc1_rgb: {
                                    quality: 'fast'
                                },
                                jpg: {
                                    quality: 80
                                }
                            },
                            'harmonyos-next': {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                etc1_rgb: {
                                    quality: 'fast'
                                },
                                jpg: {
                                    quality: 80
                                }
                            },
                            ios: {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                pvrtc_4bits_rgb: {
                                    quality: 'fast'
                                },
                                jpg: {
                                    quality: 80
                                }
                            },
                            web: {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                etc1_rgb: {
                                    quality: 'fast'
                                },
                                pvrtc_4bits_rgb: {
                                    quality: 'fast'
                                },
                                png: {
                                    quality: 80
                                }
                            },
                            pc: {}
                        }
                    },
                    transparent: {
                        name: 'Default Transparent',
                        options: {
                            miniGame: {
                                etc1_rgb_a: {
                                    quality: 'fast'
                                },
                                pvrtc_4bits_rgb_a: {
                                    quality: 'fast'
                                },
                                png: {
                                    quality: 80
                                }
                            },
                            android: {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                etc1_rgb_a: {
                                    quality: 'fast'
                                },
                                png: {
                                    quality: 80
                                }
                            },
                            'harmonyos-next': {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                etc1_rgb_a: {
                                    quality: 'fast'
                                },
                                png: {
                                    quality: 80
                                }
                            },
                            ios: {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                pvrtc_4bits_rgb_a: {
                                    quality: 'fast'
                                },
                                png: {
                                    quality: 80
                                }
                            },
                            web: {
                                astc_8x8: {
                                    quality: 'medium'
                                },
                                etc1_rgb_a: {
                                    quality: 'fast'
                                },
                                pvrtc_4bits_rgb_a: {
                                    quality: 'fast'
                                },
                                png: {
                                    quality: 80
                                }
                            },
                            pc: {}
                        }
                    }
                },
                customConfigs: {},
                genMipmaps: true
            }
        };
    }
    _projectRoot = '';
    _buildTemplateDir = '';
    _projectTempDir = '';
    get projectRoot() {
        if (!this._init) {
            throw new Error('BuilderConfig is not initialized');
        }
        return this._projectRoot;
    }
    get buildTemplateDir() {
        if (!this._init) {
            throw new Error('BuilderConfig is not initialized');
        }
        return this._buildTemplateDir;
    }
    get projectTempDir() {
        if (!this._init) {
            throw new Error('BuilderConfig is not initialized');
        }
        return this._projectTempDir;
    }
    _init = false;
    async init() {
        if (this._init) {
            return;
        }
        const project = await Promise.resolve().then(() => __importStar(require('../../project')));
        this._projectRoot = project.default.path;
        this._buildTemplateDir = (0, path_1.join)(this._projectRoot, 'build-templates');
        this._projectTempDir = (0, path_1.join)(this._projectRoot, 'temp');
        this.commonOptionConfigs.name.default = project.default.getInfo().name || 'gameName';
        this._init = true;
        try {
            const defaultConfig = this.getDefaultConfig();
            const useCacheDefaults = defaultConfig.useCacheConfig ?? {
                serializeData: true,
                engine: true,
                textureCompress: true,
                autoAtlas: true,
            };
            this._configInstance = await configuration_1.configurationRegistry.register('builder', {
                defaults: defaultConfig,
                nodes: () => (0, metadata_1.createBuilderCoreMetadataNodes)(this.commonOptionConfigs, useCacheDefaults, defaultConfig.bundleConfig, defaultConfig.textureCompressConfig),
            });
        }
        catch (error) {
            this._init = false;
            throw error;
        }
    }
}
exports.default = new BuilderConfig();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3NoYXJlL2J1aWxkZXItY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXNDO0FBQ3RDLG1DQUE0QztBQUM1Qyx1REFBb0c7QUFJcEcseUNBQTREO0FBRzVELE1BQU0sYUFBYTtJQUNmOztPQUVHO0lBQ0ssZUFBZSxDQUFzQjtJQUM3QyxVQUFVLENBQUksSUFBYSxFQUFFLEtBQTBCO1FBQ25ELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxVQUFVLENBQUMsSUFBWSxFQUFFLEtBQVUsRUFBRSxLQUEwQjtRQUMzRCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELG1CQUFtQixHQUF1QztRQUN0RCxRQUFRLEVBQUU7WUFDTixLQUFLLEVBQUUsK0JBQStCO1lBQ3RDLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLElBQUksRUFBRSxRQUFRO1NBQ2pCO1FBQ0QsSUFBSSxFQUFFO1lBQ0YsS0FBSyxFQUFFLDJCQUEyQjtZQUNsQyxJQUFJLEVBQUUsUUFBUTtZQUNkLHNCQUFzQjtZQUN0QixPQUFPLEVBQUUsVUFBVTtZQUNuQixXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUM7U0FDNUI7UUFDRCxTQUFTLEVBQUU7WUFDUCxLQUFLLEVBQUUsZ0NBQWdDO1lBQ3ZDLFdBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNLEVBQUUsSUFBSTtZQUNaLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsS0FBSzthQUN4QjtZQUNELFVBQVUsRUFB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QUNsQixJQUFJLENBQUM7WUFDRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUM5QyxNQUFNLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxjQUFjLElBQUk7Z0JBQ3JELGFBQWEsRUFBRSxJQUFJO2dCQUNuQixNQUFNLEVBQUUsSUFBSTtnQkFDWixlQUFlLEVBQUUsSUFBSTtnQkFDckIsU0FBUyxFQUFFLElBQUk7YUFDbEIsQ0FBQztZQUNGLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxxQ0FBcUIsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFO2dCQUNuRSxRQUFRLEVBQUUsYUFBYTtnQkFDdkIsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEseUNBQThCLEVBQ3ZDLElBQUksQ0FBQyxtQkFBbUYsRUFDeEYsZ0JBQWdCLEVBQ2hCLGFBQWEsQ0FBQyxZQUFZLEVBQzFCLGFBQWEsQ0FBQyxxQkFBcUIsQ0FDdEM7YUFDSixDQUFDLENBQUM7UUFDUCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLE1BQU0sS0FBSyxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxrQkFBZSxJQUFJLGFBQWEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGdldE9wdGlvbnNEZWZhdWx0IH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBJQmFzZUNvbmZpZ3VyYXRpb24sIENvbmZpZ3VyYXRpb25TY29wZSwgY29uZmlndXJhdGlvblJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBJQnVpbGRDb21tb25PcHRpb25zIH0gZnJvbSAnLi4vQHR5cGVzJztcbmltcG9ydCB7IElCdWlsZGVyQ29uZmlnSXRlbSB9IGZyb20gJy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgQnVpbGRDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vQHR5cGVzL2NvbmZpZy1leHBvcnQnO1xuaW1wb3J0IHsgY3JlYXRlQnVpbGRlckNvcmVNZXRhZGF0YU5vZGVzIH0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQgdHlwZSB7IElDb2Nvc0NvbmZpZ3VyYXRpb25Qcm9wZXJ0eVNjaGVtYSB9IGZyb20gJy4uLy4uL2NvbmZpZ3VyYXRpb24vc2NyaXB0L21ldGFkYXRhJztcblxuY2xhc3MgQnVpbGRlckNvbmZpZyB7XG4gICAgLyoqXG4gICAgICog5oyB5pyJ55qE5Y+v5Y+M5ZCR57uR5a6a55qE6YWN572u566h55CG5a6e5L6LXG4gICAgICovXG4gICAgcHJpdmF0ZSBfY29uZmlnSW5zdGFuY2UhOiBJQmFzZUNvbmZpZ3VyYXRpb247XG4gICAgZ2V0UHJvamVjdDxUPihwYXRoPzogc3RyaW5nLCBzY29wZT86IENvbmZpZ3VyYXRpb25TY29wZSk6IFByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnSW5zdGFuY2UuZ2V0KHBhdGgsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBzZXRQcm9qZWN0KHBhdGg6IHN0cmluZywgdmFsdWU6IGFueSwgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ0luc3RhbmNlLnNldChwYXRoLCB2YWx1ZSwgc2NvcGUpO1xuICAgIH1cblxuICAgIGNvbW1vbk9wdGlvbkNvbmZpZ3M6IFJlY29yZDxzdHJpbmcsIElCdWlsZGVyQ29uZmlnSXRlbT4gPSB7XG4gICAgICAgIHBsYXRmb3JtOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLnBsYXRmb3JtJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICd3ZWItbW9iaWxlJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLm5hbWUnLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAvLyB3aWxsIHVwZGF0ZSBpbiBpbml0XG4gICAgICAgICAgICBkZWZhdWx0OiAnZ2FtZU5hbWUnLFxuICAgICAgICAgICAgdmVyaWZ5UnVsZXM6IFsncmVxdWlyZWQnXSxcbiAgICAgICAgfSxcbiAgICAgICAgcG9seWZpbGxzOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLnBvbHlmaWxscycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5vcHRpb25zLnBvbHlmaWxsc190aXBzJyxcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIGFzeW5jRnVuY3Rpb25zOiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgYXN5bmNGdW5jdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5hc3luY19mdW5jdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5vcHRpb25zLmFzeW5jX2Z1bmN0aW9uc190aXBzJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvcmVKczoge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLmNvcmVfanMnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5vcHRpb25zLmNvcmVfanNfdGlwcycsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJ1aWxkU2NyaXB0VGFyZ2V0czoge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5idWlsZFNjcmlwdFRhcmdldHMnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5idWlsZFNjcmlwdFRhcmdldHNUaXBzJyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcnZlcjoge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5yZW1vdGVfc2VydmVyX2FkZHJlc3MnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5yZW1vdGVfc2VydmVyX2FkZHJlc3NfdGlwcycsXG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgdmVyaWZ5UnVsZXM6IFsnaHR0cCddLFxuICAgICAgICB9LFxuICAgICAgICBzb3VyY2VNYXBzOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLnNvdXJjZU1hcCcsXG4gICAgICAgICAgICBkZWZhdWx0OiAnaW5saW5lJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpidWlsZGVyLm9wdGlvbnMuc291cmNlTWFwVGlwcycsXG4gICAgICAgICAgICB0eXBlOiAnZW51bScsXG4gICAgICAgICAgICBpdGVtczogW3tcbiAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vZmYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZmFsc2UnLFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpidWlsZGVyLm9wdGlvbnMuc291cmNlTWFwc0lubGluZScsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdpbmxpbmUnLFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpidWlsZGVyLm9wdGlvbnMuc3RhbmRhbG9uZVNvdXJjZU1hcHMnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAndHJ1ZScsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSxcbiAgICAgICAgZXhwZXJpbWVudGFsRXJhc2VNb2R1bGVzOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLmV4cGVyaW1lbnRhbF9lcmFzZV9tb2R1bGVzJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpidWlsZGVyLm9wdGlvbnMuZXhwZXJpbWVudGFsX2VyYXNlX21vZHVsZXNfdGlwcycsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIGV4cGVyaW1lbnQ6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0U2NlbmVBc3NldEJ1bmRsZToge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5zdGFydF9zY2VuZV9hc3NldF9idW5kbGUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5zdGFydF9zY2VuZV9hc3NldF9idW5kbGVfdGlwcycsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnVuZGxlQ29uZmlnczoge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5pbmNsdWRlQnVuZGxlcycsXG4gICAgICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9LCAvLyBQbGFjZWhvbGRlciBmb3IgYnVuZGxlIGNvbmZpZyBwcm9wZXJ0aWVzIGlmIG5lZWRlZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZlcmlmeUxldmVsOiAnd2FybicsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOS5i+WJjSBpb3MtYXBwLWNsaXAg5pyJ6ZqQ6JePIGJ1aWxkUGF0aCDnmoTpnIDmsYJcbiAgICAgICAgYnVpbGRQYXRoOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLmJ1aWxkX3BhdGgnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIudGlwcy5idWlsZF9wYXRoJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdwcm9qZWN0Oi8vYnVpbGQnLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICB2ZXJpZnlSdWxlczogWydyZXF1aXJlZCddLFxuICAgICAgICB9LFxuICAgICAgICBkZWJ1Zzoge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5kZWJ1ZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5vcHRpb25zLmRlYnVnVGlwcycsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB9LFxuICAgICAgICBtYW5nbGVQcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLm1hbmdsZVByb3BlcnRpZXMnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5tYW5nbGVQcm9wZXJ0aWVzVGlwJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB9LFxuICAgICAgICBpbmxpbmVFbnVtOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLmlubGluZUVudW0nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5pbmxpbmVFbnVtVGlwJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIG1kNUNhY2hlOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLm1kNV9jYWNoZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5vcHRpb25zLm1kNUNhY2hlVGlwcycsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgICAgbWQ1Q2FjaGVPcHRpb25zOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgZXhjbHVkZXM6IFtdLFxuICAgICAgICAgICAgICAgIGluY2x1ZGVzOiBbXSxcbiAgICAgICAgICAgICAgICByZXBsYWNlT25seTogW10sXG4gICAgICAgICAgICAgICAgaGFuZGxlVGVtcGxhdGVNZDVMaW5rOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIGV4Y2x1ZGVzOiB7IHR5cGU6ICdhcnJheScsIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sIGRlZmF1bHQ6IFtdIH0sXG4gICAgICAgICAgICAgICAgaW5jbHVkZXM6IHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSwgZGVmYXVsdDogW10gfSxcbiAgICAgICAgICAgICAgICByZXBsYWNlT25seTogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LCBkZWZhdWx0OiBbXSB9LFxuICAgICAgICAgICAgICAgIGhhbmRsZVRlbXBsYXRlTWQ1TGluazogeyB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1haW5CdW5kbGVJc1JlbW90ZToge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5tYWluX2J1bmRsZV9pc19yZW1vdGUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIuYXNzZXRfYnVuZGxlLnJlbW90ZV9idW5kbGVfaW52YWxpZF90b29sdGlwJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB9LFxuICAgICAgICBtYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLm1haW5fYnVuZGxlX2NvbXByZXNzaW9uX3R5cGUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIuYXNzZXRfYnVuZGxlLmNvbXByZXNzaW9uX3R5cGVfdG9vbHRpcCcsXG4gICAgICAgICAgICBkZWZhdWx0OiAnbWVyZ2VfZGVwJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB9LFxuICAgICAgICB1c2VTcGxhc2hTY3JlZW46IHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpidWlsZGVyLnVzZV9zcGxhc2hfc2NyZWVuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIGJ1bmRsZUNvbW1vbkNodW5rOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5idW5kbGVDb21tb25DaHVuaycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5idW5kbGVDb21tb25DaHVua1RpcHMnLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIHNraXBDb21wcmVzc1RleHR1cmU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpidWlsZGVyLm9wdGlvbnMuc2tpcF9jb21wcmVzc190ZXh0dXJlJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB9LFxuICAgICAgICBwYWNrQXV0b0F0bGFzOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLnBhY2tfYXV0b0F0bGFzJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0U2NlbmU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpidWlsZGVyLm9wdGlvbnMuc3RhcnRfc2NlbmUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5zdGFydFNjZW5lVGlwcycsXG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB9LFxuICAgICAgICBvdXRwdXROYW1lOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46Y29uZmlndXJhdGlvbi5idWlsZGVyLnBsYXRmb3JtLm91dHB1dE5hbWUudGl0bGUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uYnVpbGRlci5wbGF0Zm9ybS5vdXRwdXROYW1lLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICB2ZXJpZnlSdWxlczogWydyZXF1aXJlZCcsICdub3JtYWxOYW1lJ10sXG4gICAgICAgIH0sXG4gICAgICAgIHRhc2tOYW1lOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgdmVyaWZ5UnVsZXM6IFsncmVxdWlyZWQnXSxcbiAgICAgICAgfSxcbiAgICAgICAgc2NlbmVzOiB7XG4gICAgICAgICAgICBsYWJlbDogJ2kxOG46YnVpbGRlci5vcHRpb25zLnNjZW5lcycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci50aXBzLmJ1aWxkX3NjZW5lcycsXG4gICAgICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcndyaXRlUHJvamVjdFNldHRpbmdzOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgbWFjcm9Db25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cEltYWdlQ2FjaGU6ICdpbmhlcml0LXByb2plY3Qtc2V0dGluZycsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbmNsdWRlTW9kdWxlczoge1xuICAgICAgICAgICAgICAgICAgICBwaHlzaWNzOiAnaW5oZXJpdC1wcm9qZWN0LXNldHRpbmcnLFxuICAgICAgICAgICAgICAgICAgICAncGh5c2ljcy0yZCc6ICdpbmhlcml0LXByb2plY3Qtc2V0dGluZycsXG4gICAgICAgICAgICAgICAgICAgICdnZngtd2ViZ2wyJzogJ29mZicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICBtYWNyb0NvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW51cEltYWdlQ2FjaGU6IHsgdHlwZTogJ3N0cmluZycsIGRlZmF1bHQ6ICdpbmhlcml0LXByb2plY3Qtc2V0dGluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwaHlzaWNzOiB7IHR5cGU6ICdzdHJpbmcnLCBkZWZhdWx0OiAnaW5oZXJpdC1wcm9qZWN0LXNldHRpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAncGh5c2ljcy0yZCc6IHsgdHlwZTogJ3N0cmluZycsIGRlZmF1bHQ6ICdpbmhlcml0LXByb2plY3Qtc2V0dGluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdnZngtd2ViZ2wyJzogeyB0eXBlOiAnc3RyaW5nJywgZGVmYXVsdDogJ29mZicgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbmF0aXZlQ29kZUJ1bmRsZU1vZGU6IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdhc21qcycsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgfSxcbiAgICAgICAgd2FzbUNvbXByZXNzaW9uTW9kZToge1xuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIGJpbkdyb3VwQ29uZmlnOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiAxNixcbiAgICAgICAgICAgICAgICBlbmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5iaW5fZ3JvdXBfY29uZmlnJyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5lbmFibGVfY2NvbmJfZ3JvdXAnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46YnVpbGRlci5vcHRpb25zLmVuYWJsZV9jY29uYl9ncm91cF90aXBzJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRocmVzaG9sZDoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMTYsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcblxuICAgIGdldEJ1aWxkQ29tbW9uT3B0aW9ucygpOiBJQnVpbGRDb21tb25PcHRpb25zIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXJDb25maWcgaXMgbm90IGluaXRpYWxpemVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSBnZXRPcHRpb25zRGVmYXVsdCh0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ3MpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZGVmYXVsdE9wdGlvbnMsXG4gICAgICAgICAgICBtb3ZlUmVtb3RlQnVuZGxlU2NyaXB0OiBmYWxzZSxcbiAgICAgICAgICAgIHBhY2thZ2VzOiB7fSxcbiAgICAgICAgfSBhcyBJQnVpbGRDb21tb25PcHRpb25zO1xuICAgIH1cblxuICAgIGdldERlZmF1bHRDb25maWcoKTogQnVpbGRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbW1vbjogdGhpcy5nZXRCdWlsZENvbW1vbk9wdGlvbnMoKSxcbiAgICAgICAgICAgIHBsYXRmb3Jtczoge1xuICAgICAgICAgICAgICAgIC8vICd3ZWItZGVza3RvcCc6IHsgeHh4IH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VDYWNoZUNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZURhdGE6IHRydWUsXG4gICAgICAgICAgICAgICAgZW5naW5lOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRleHR1cmVDb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhdXRvQXRsYXM6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYnVuZGxlQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgY3VzdG9tOiB7fSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXh0dXJlQ29tcHJlc3NDb25maWc6IHtcbiAgICAgICAgICAgICAgICB1c2VyUHJlc2V0OiB7fSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0Q29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdEZWZhdWx0IE9wYXF1ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaUdhbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXRjMV9yZ2I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdnJ0Y180Yml0c19yZ2I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqcGc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IDgwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN0Y184eDg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdtZWRpdW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV0YzFfcmdiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiAnZmFzdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganBnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiA4MFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaGFybW9ueW9zLW5leHQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzdGNfOHg4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiAnbWVkaXVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldGMxX3JnYjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ2Zhc3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpwZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW9zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzdGNfOHg4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiAnbWVkaXVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdnJ0Y180Yml0c19yZ2I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqcGc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IDgwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlYjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3RjXzh4ODoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ21lZGl1bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXRjMV9yZ2I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdnJ0Y180Yml0c19yZ2I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IDgwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBjOiB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0cmFuc3BhcmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0RlZmF1bHQgVHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmlHYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV0YzFfcmdiX2E6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdnJ0Y180Yml0c19yZ2JfYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ2Zhc3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3RjXzh4ODoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ21lZGl1bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXRjMV9yZ2JfYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ2Zhc3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2hhcm1vbnlvcy1uZXh0Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3RjXzh4ODoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ21lZGl1bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXRjMV9yZ2JfYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ2Zhc3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW9zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzdGNfOHg4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiAnbWVkaXVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdnJ0Y180Yml0c19yZ2JfYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogJ2Zhc3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2ViOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzdGNfOHg4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiAnbWVkaXVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldGMxX3JnYl9hOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiAnZmFzdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHZydGNfNGJpdHNfcmdiX2E6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6ICdmYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IDgwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBjOiB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjdXN0b21Db25maWdzOiB7fSxcbiAgICAgICAgICAgICAgICBnZW5NaXBtYXBzOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcHJvamVjdFJvb3QgPSAnJztcbiAgICBwcml2YXRlIF9idWlsZFRlbXBsYXRlRGlyID0gJyc7XG4gICAgcHJpdmF0ZSBfcHJvamVjdFRlbXBEaXIgPSAnJztcblxuICAgIGdldCBwcm9qZWN0Um9vdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXJDb25maWcgaXMgbm90IGluaXRpYWxpemVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2plY3RSb290O1xuICAgIH1cblxuICAgIGdldCBidWlsZFRlbXBsYXRlRGlyKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQnVpbGRlckNvbmZpZyBpcyBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYnVpbGRUZW1wbGF0ZURpcjtcbiAgICB9XG5cbiAgICBnZXQgcHJvamVjdFRlbXBEaXIoKSB7XG4gICAgICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCdWlsZGVyQ29uZmlnIGlzIG5vdCBpbml0aWFsaXplZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9qZWN0VGVtcERpcjtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9pbml0ID0gZmFsc2U7XG5cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBpZiAodGhpcy5faW5pdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL3Byb2plY3QnKTtcblxuICAgICAgICB0aGlzLl9wcm9qZWN0Um9vdCA9IHByb2plY3QuZGVmYXVsdC5wYXRoO1xuICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlyID0gam9pbih0aGlzLl9wcm9qZWN0Um9vdCwgJ2J1aWxkLXRlbXBsYXRlcycpO1xuICAgICAgICB0aGlzLl9wcm9qZWN0VGVtcERpciA9IGpvaW4odGhpcy5fcHJvamVjdFJvb3QsICd0ZW1wJyk7XG4gICAgICAgIHRoaXMuY29tbW9uT3B0aW9uQ29uZmlncy5uYW1lLmRlZmF1bHQgPSBwcm9qZWN0LmRlZmF1bHQuZ2V0SW5mbygpLm5hbWUgfHwgJ2dhbWVOYW1lJztcbiAgICAgICAgdGhpcy5faW5pdCA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0Q29uZmlnID0gdGhpcy5nZXREZWZhdWx0Q29uZmlnKCk7XG4gICAgICAgICAgICBjb25zdCB1c2VDYWNoZURlZmF1bHRzID0gZGVmYXVsdENvbmZpZy51c2VDYWNoZUNvbmZpZyA/PyB7XG4gICAgICAgICAgICAgICAgc2VyaWFsaXplRGF0YTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBlbmdpbmU6IHRydWUsXG4gICAgICAgICAgICAgICAgdGV4dHVyZUNvbXByZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGF1dG9BdGxhczogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9jb25maWdJbnN0YW5jZSA9IGF3YWl0IGNvbmZpZ3VyYXRpb25SZWdpc3RyeS5yZWdpc3RlcignYnVpbGRlcicsIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0czogZGVmYXVsdENvbmZpZyxcbiAgICAgICAgICAgICAgICBub2RlczogKCkgPT4gY3JlYXRlQnVpbGRlckNvcmVNZXRhZGF0YU5vZGVzKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ3MgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWE+LFxuICAgICAgICAgICAgICAgICAgICB1c2VDYWNoZURlZmF1bHRzLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0Q29uZmlnLmJ1bmRsZUNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdENvbmZpZy50ZXh0dXJlQ29tcHJlc3NDb25maWdcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0ID0gZmFsc2U7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEJ1aWxkZXJDb25maWcoKTtcbiJdfQ==