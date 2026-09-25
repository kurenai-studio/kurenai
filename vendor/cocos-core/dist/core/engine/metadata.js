"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEngineMetadataNodes = createEngineMetadataNodes;
const metadata_1 = require("../configuration/script/metadata");
const dynamic_metadata_1 = require("./dynamic-metadata");
const module_config_defaults_1 = require("./module-config-defaults");
const CUSTOM_PIPELINE_NAME_KEY = 'CUSTOM_PIPELINE_NAME';
const CUSTOM_PIPELINE_NAME_PROPERTY = `engine.macroConfig.${CUSTOM_PIPELINE_NAME_KEY}`;
function createEngineMetadataNodes(options) {
    const dynamicMetadata = (0, dynamic_metadata_1.getEngineDynamicConfigContribution)({
        engineRoot: options.engineRoot,
        fallbackConfig: {
            includeModules: options.defaultConfig.includeModules,
            flags: options.defaultConfig.flags,
            macroConfig: options.defaultConfig.macroConfig,
        },
    }).metadata;
    const moduleProjectDefaults = (0, module_config_defaults_1.createDefaultEngineModuleProjectDefaults)(options.engineRoot);
    const macroProperties = omitProperties(dynamicMetadata.macroProperties, [CUSTOM_PIPELINE_NAME_KEY]);
    const customPipelineNameDefault = options.defaultConfig.macroConfig?.[CUSTOM_PIPELINE_NAME_KEY];
    return [
        (0, metadata_1.createNode)('engine.physicsConfig', 'i18n:configuration.engine.physicsConfig.title', 'engine', {
            'engine.physicsConfig.gravity': {
                type: 'object',
                default: options.defaultConfig.physicsConfig.gravity,
                title: 'i18n:configuration.engine.physicsConfig.gravity.title',
                description: 'i18n:configuration.engine.physicsConfig.gravity.description',
            },
            'engine.physicsConfig.allowSleep': {
                type: 'boolean',
                default: options.defaultConfig.physicsConfig.allowSleep,
                title: 'i18n:configuration.engine.physicsConfig.allowSleep.title',
                description: 'i18n:configuration.engine.physicsConfig.allowSleep.description',
            },
            'engine.physicsConfig.sleepThreshold': {
                type: 'number',
                default: options.defaultConfig.physicsConfig.sleepThreshold,
                minimum: 0,
                title: 'i18n:configuration.engine.physicsConfig.sleepThreshold.title',
                description: 'i18n:configuration.engine.physicsConfig.sleepThreshold.description',
            },
            'engine.physicsConfig.autoSimulation': {
                type: 'boolean',
                default: options.defaultConfig.physicsConfig.autoSimulation,
                title: 'i18n:configuration.engine.physicsConfig.autoSimulation.title',
                description: 'i18n:configuration.engine.physicsConfig.autoSimulation.description',
            },
            'engine.physicsConfig.fixedTimeStep': {
                type: 'number',
                default: options.defaultConfig.physicsConfig.fixedTimeStep,
                minimum: 0,
                title: 'i18n:configuration.engine.physicsConfig.fixedTimeStep.title',
                description: 'i18n:configuration.engine.physicsConfig.fixedTimeStep.description',
            },
            'engine.physicsConfig.maxSubSteps': {
                type: 'number',
                default: options.defaultConfig.physicsConfig.maxSubSteps,
                minimum: 0,
                title: 'i18n:configuration.engine.physicsConfig.maxSubSteps.title',
                description: 'i18n:configuration.engine.physicsConfig.maxSubSteps.description',
            },
            'engine.physicsConfig.useNodeChains': {
                type: 'boolean',
                default: options.defaultConfig.physicsConfig.useNodeChains,
                title: 'i18n:configuration.engine.physicsConfig.useNodeChains.title',
            },
            'engine.physicsConfig.physicsEngine': {
                type: 'string',
                default: options.defaultConfig.physicsConfig.physicsEngine,
                title: 'i18n:configuration.engine.physicsConfig.physicsEngine.title',
                description: 'i18n:configuration.engine.physicsConfig.physicsEngine.description',
            },
            'engine.physicsConfig.collisionMatrix': {
                type: 'object',
                default: options.defaultConfig.physicsConfig.collisionMatrix,
                title: 'i18n:configuration.engine.physicsConfig.collisionMatrix.title',
                description: 'i18n:configuration.engine.physicsConfig.collisionMatrix.description',
            },
            'engine.physicsConfig.collisionGroups': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.engine.physicsConfig.collisionGroups.title',
            },
            'engine.physicsConfig.defaultMaterial': {
                type: 'string',
                default: options.defaultConfig.physicsConfig.defaultMaterial,
                title: 'i18n:configuration.engine.physicsConfig.defaultMaterial.title',
                description: 'i18n:configuration.engine.physicsConfig.defaultMaterial.description',
            },
            'engine.physicsConfig.physX': {
                type: 'object',
                default: options.defaultConfig.physicsConfig.physX,
                title: 'i18n:configuration.engine.physicsConfig.physX.title',
                description: 'i18n:configuration.engine.physicsConfig.physX.description',
            },
        }, 1),
        (0, metadata_1.createNode)('engine.designResolution', 'i18n:configuration.engine.designResolution.title', 'engine', {
            'engine.designResolution.width': {
                type: 'number',
                default: options.defaultConfig.designResolution.width,
                title: 'i18n:configuration.engine.designResolution.width.title',
            },
            'engine.designResolution.height': {
                type: 'number',
                default: options.defaultConfig.designResolution.height,
                title: 'i18n:configuration.engine.designResolution.height.title',
            },
            'engine.designResolution.fitWidth': {
                type: 'boolean',
                default: options.defaultConfig.designResolution.fitWidth,
                title: 'i18n:configuration.engine.designResolution.fitWidth.title',
            },
            'engine.designResolution.fitHeight': {
                type: 'boolean',
                default: options.defaultConfig.designResolution.fitHeight,
                title: 'i18n:configuration.engine.designResolution.fitHeight.title',
            },
        }, 2),
        (0, metadata_1.createNode)('engine.splashScreen', 'i18n:configuration.engine.splashScreen.title', 'engine', {
            'engine.splashScreen.displayRatio': {
                type: 'number',
                default: options.defaultConfig.splashScreen.displayRatio,
                title: 'i18n:configuration.engine.splashScreen.displayRatio.title',
            },
            'engine.splashScreen.totalTime': {
                type: 'number',
                default: options.defaultConfig.splashScreen.totalTime,
                minimum: 0,
                title: 'i18n:configuration.engine.splashScreen.totalTime.title',
            },
            'engine.splashScreen.watermarkLocation': {
                type: 'string',
                default: options.defaultConfig.splashScreen.watermarkLocation,
                title: 'i18n:configuration.engine.splashScreen.watermarkLocation.title',
                enum: ['default', 'topLeft', 'topRight', 'topCenter', 'bottomLeft', 'bottomCenter', 'bottomRight'],
                enumDescriptions: [
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.default',
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.topLeft',
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.topRight',
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.topCenter',
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.bottomLeft',
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.bottomCenter',
                    'i18n:configuration.engine.splashScreen.watermarkLocation.options.bottomRight',
                ],
            },
            'engine.splashScreen.autoFit': {
                type: 'boolean',
                default: options.defaultConfig.splashScreen.autoFit,
                title: 'i18n:configuration.engine.splashScreen.autoFit.title',
            },
            'engine.splashScreen.logo': {
                type: 'object',
                default: options.defaultConfig.splashScreen.logo,
                title: 'i18n:configuration.engine.splashScreen.logo.title',
            },
            'engine.splashScreen.background': {
                type: 'object',
                default: options.defaultConfig.splashScreen.background,
                title: 'i18n:configuration.engine.splashScreen.background.title',
            },
        }, 3),
        (0, metadata_1.createNode)('engine.moduleConfig', 'i18n:configuration.engine.moduleConfig.title', 'engine', {
            'engine.globalConfigKey': {
                type: 'string',
                default: moduleProjectDefaults.globalConfigKey,
                title: 'i18n:configuration.engine.projectConfig.globalConfigKey.title',
            },
            'engine.configs': (0, metadata_1.objectSchema)(undefined, {
                default: moduleProjectDefaults.configs,
                title: 'i18n:configuration.engine.projectConfig.configs.title',
                additionalProperties: (0, metadata_1.objectSchema)({
                    name: {
                        type: 'string',
                        title: 'i18n:builder.options.name',
                    },
                    includeModules: dynamicMetadata.includeModules,
                    flags: dynamicMetadata.flagsObject,
                    noDeprecatedFeatures: (0, metadata_1.objectSchema)({
                        value: {
                            type: 'boolean',
                            title: 'i18n:configuration.engine.projectConfig.noDeprecatedFeatureConfig.value.title',
                        },
                        version: {
                            type: 'string',
                            title: 'i18n:configuration.engine.projectConfig.noDeprecatedFeatureConfig.version.title',
                        },
                    }, {
                        title: 'i18n:configuration.engine.projectConfig.noDeprecatedFeatureConfig.title',
                    }),
                }, {
                    title: 'i18n:configuration.engine.projectConfig.configItem.title',
                }),
            }),
        }, 4),
        (0, metadata_1.createNode)('engine.graphics', 'i18n:configuration.engine.graphics.title', 'engine', {
            'engine.graphics.pipeline': {
                type: 'string',
                default: options.defaultConfig.graphics?.pipeline ?? 'custom-pipeline',
                title: 'i18n:configuration.engine.graphics.pipeline.title',
                enum: ['custom-pipeline', 'legacy-pipeline'],
                enumDescriptions: [
                    'i18n:configuration.engine.graphics.pipeline.options.custom',
                    'i18n:configuration.engine.graphics.pipeline.options.legacy',
                ],
            },
            [CUSTOM_PIPELINE_NAME_PROPERTY]: {
                type: 'string',
                default: typeof customPipelineNameDefault === 'string' ? customPipelineNameDefault : 'Builtin',
                title: 'i18n:configuration.engine.graphics.pipelineName.title',
                description: 'i18n:configuration.engine.graphics.pipelineName.description',
            },
            'engine.graphics.custom-pipeline-post-process': {
                type: 'boolean',
                default: options.defaultConfig.graphics?.['custom-pipeline-post-process'] ?? false,
                title: 'i18n:configuration.engine.graphics.customPipelinePostProcess.title',
                description: 'i18n:configuration.engine.graphics.customPipelinePostProcess.description',
            },
        }, 5),
        (0, metadata_1.createNode)('engine.rendering', 'i18n:configuration.engine.rendering.title', 'engine', {
            'engine.renderPipeline': {
                type: 'string',
                default: options.defaultConfig.renderPipeline,
                title: 'i18n:configuration.engine.rendering.renderPipeline.title',
                description: 'i18n:configuration.engine.rendering.renderPipeline.description',
            },
            'engine.highQuality': {
                type: 'boolean',
                default: options.defaultConfig.highQuality,
                title: 'i18n:configuration.engine.rendering.highQuality.title',
            },
            'engine.downloadMaxConcurrency': {
                type: 'number',
                default: options.defaultConfig.downloadMaxConcurrency,
                minimum: 1,
                title: 'i18n:configuration.engine.rendering.downloadMaxConcurrency.title',
            },
        }, 6),
        (0, metadata_1.createNode)('engine.jointTextureLayout', 'i18n:configuration.engine.jointTextureLayout.title', 'engine', {
            'engine.customJointTextureLayouts': (0, metadata_1.arraySchema)((0, metadata_1.objectSchema)({
                textureLength: {
                    type: 'number',
                    default: 0,
                    minimum: 0,
                    title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.textureLength.title',
                    description: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.textureLength.description',
                },
                contents: (0, metadata_1.arraySchema)((0, metadata_1.objectSchema)({
                    skeleton: {
                        type: 'string',
                        default: '',
                        title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.skeleton.title',
                        description: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.skeleton.description',
                    },
                    clips: (0, metadata_1.arraySchema)({
                        type: 'string',
                        default: '',
                        title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.clips.itemTitle',
                    }, {
                        title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.clips.title',
                        description: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.clips.description',
                    }),
                }, {
                    title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.itemTitle',
                    required: ['skeleton', 'clips'],
                }), {
                    title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.title',
                    description: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.description',
                }),
            }, {
                title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.itemTitle',
                required: ['textureLength', 'contents'],
            }), {
                default: options.defaultConfig.customJointTextureLayouts,
                title: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.title',
                description: 'i18n:configuration.engine.jointTextureLayout.customJointTextureLayouts.description',
            }),
        }, 7),
        (0, metadata_1.createNode)('engine.macroConfig', 'i18n:configuration.engine.macroConfig.title', 'engine', {
            ...prefixProperties('engine.macroConfig', macroProperties),
            'engine.macroCustom': (0, metadata_1.arraySchema)((0, metadata_1.objectSchema)({
                key: {
                    type: 'string',
                    title: 'i18n:configuration.engine.macroConfig.macroCustom.key.title',
                },
                value: {
                    type: 'boolean',
                    title: 'i18n:configuration.engine.macroConfig.macroCustom.value.title',
                },
            }, {
                title: 'i18n:configuration.engine.macroConfig.macroCustom.itemTitle',
                required: ['key', 'value'],
            }), {
                default: options.defaultConfig.macroCustom,
                title: 'i18n:configuration.engine.macroConfig.macroCustom.title',
                description: 'i18n:configuration.engine.macroConfig.macroCustom.description',
            }),
        }, 8),
        (0, metadata_1.createNode)('engine.customLayers', 'i18n:configuration.engine.layers.customLayers.title', 'engine', {
            'engine.customLayers': {
                type: 'array',
                default: options.defaultConfig.customLayers,
                title: 'i18n:configuration.engine.layers.customLayers.title',
                description: 'i18n:configuration.engine.layers.customLayers.description',
            },
        }, 9),
        (0, metadata_1.createNode)('engine.sortingLayers', 'i18n:configuration.engine.layers.sortingLayers.title', 'engine', {
            'engine.sortingLayers': {
                type: 'array',
                default: options.defaultConfig.sortingLayers,
                title: 'i18n:configuration.engine.layers.sortingLayers.title',
                description: 'i18n:configuration.engine.layers.sortingLayers.description',
            },
        }, 10),
    ];
}
function omitProperties(properties, keys) {
    return Object.fromEntries(Object.entries(properties).filter(([key]) => !keys.includes(key)));
}
function prefixProperties(prefix, properties) {
    return Object.fromEntries(Object.entries(properties).map(([key, value]) => [`${prefix}.${key}`, value]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9lbmdpbmUvbWV0YWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFjQSw4REE0VEM7QUF4VUQsK0RBQXlGO0FBQ3pGLHlEQUF3RTtBQUN4RSxxRUFBb0Y7QUFFcEYsTUFBTSx3QkFBd0IsR0FBRyxzQkFBc0IsQ0FBQztBQUN4RCxNQUFNLDZCQUE2QixHQUFHLHNCQUFzQix3QkFBd0IsRUFBRSxDQUFDO0FBT3ZGLFNBQWdCLHlCQUF5QixDQUFDLE9BQStCO0lBQ3JFLE1BQU0sZUFBZSxHQUFHLElBQUEscURBQWtDLEVBQUM7UUFDdkQsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLGNBQWMsRUFBRTtZQUNaLGNBQWMsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWM7WUFDcEQsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSztZQUNsQyxXQUFXLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxXQUFXO1NBQ2pEO0tBQ0osQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUNaLE1BQU0scUJBQXFCLEdBQUcsSUFBQSxpRUFBd0MsRUFBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDM0YsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7SUFDcEcsTUFBTSx5QkFBeUIsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFFaEcsT0FBTztRQUNILElBQUEscUJBQVUsRUFBQyxzQkFBc0IsRUFBRSwrQ0FBK0MsRUFBRSxRQUFRLEVBQUU7WUFDMUYsOEJBQThCLEVBQUU7Z0JBQzVCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxPQUFPO2dCQUNwRCxLQUFLLEVBQUUsdURBQXVEO2dCQUM5RCxXQUFXLEVBQUUsNkRBQTZEO2FBQzdFO1lBQ0QsaUNBQWlDLEVBQUU7Z0JBQy9CLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxVQUFVO2dCQUN2RCxLQUFLLEVBQUUsMERBQTBEO2dCQUNqRSxXQUFXLEVBQUUsZ0VBQWdFO2FBQ2hGO1lBQ0QscUNBQXFDLEVBQUU7Z0JBQ25DLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxjQUFjO2dCQUMzRCxPQUFPLEVBQUUsQ0FBQztnQkFDVixLQUFLLEVBQUUsOERBQThEO2dCQUNyRSxXQUFXLEVBQUUsb0VBQW9FO2FBQ3BGO1lBQ0QscUNBQXFDLEVBQUU7Z0JBQ25DLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxjQUFjO2dCQUMzRCxLQUFLLEVBQUUsOERBQThEO2dCQUNyRSxXQUFXLEVBQUUsb0VBQW9FO2FBQ3BGO1lBQ0Qsb0NBQW9DLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxhQUFhO2dCQUMxRCxPQUFPLEVBQUUsQ0FBQztnQkFDVixLQUFLLEVBQUUsNkRBQTZEO2dCQUNwRSxXQUFXLEVBQUUsbUVBQW1FO2FBQ25GO1lBQ0Qsa0NBQWtDLEVBQUU7Z0JBQ2hDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxXQUFXO2dCQUN4RCxPQUFPLEVBQUUsQ0FBQztnQkFDVixLQUFLLEVBQUUsMkRBQTJEO2dCQUNsRSxXQUFXLEVBQUUsaUVBQWlFO2FBQ2pGO1lBQ0Qsb0NBQW9DLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxhQUFhO2dCQUMxRCxLQUFLLEVBQUUsNkRBQTZEO2FBQ3ZFO1lBQ0Qsb0NBQW9DLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxhQUFhO2dCQUMxRCxLQUFLLEVBQUUsNkRBQTZEO2dCQUNwRSxXQUFXLEVBQUUsbUVBQW1FO2FBQ25GO1lBQ0Qsc0NBQXNDLEVBQUU7Z0JBQ3BDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlO2dCQUM1RCxLQUFLLEVBQUUsK0RBQStEO2dCQUN0RSxXQUFXLEVBQUUscUVBQXFFO2FBQ3JGO1lBQ0Qsc0NBQXNDLEVBQUU7Z0JBQ3BDLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSwrREFBK0Q7YUFDekU7WUFDRCxzQ0FBc0MsRUFBRTtnQkFDcEMsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWU7Z0JBQzVELEtBQUssRUFBRSwrREFBK0Q7Z0JBQ3RFLFdBQVcsRUFBRSxxRUFBcUU7YUFDckY7WUFDRCw0QkFBNEIsRUFBRTtnQkFDMUIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLEtBQUs7Z0JBQ2xELEtBQUssRUFBRSxxREFBcUQ7Z0JBQzVELFdBQVcsRUFBRSwyREFBMkQ7YUFDM0U7U0FDSixFQUFFLENBQUMsQ0FBQztRQUVMLElBQUEscUJBQVUsRUFBQyx5QkFBeUIsRUFBRSxrREFBa0QsRUFBRSxRQUFRLEVBQUU7WUFDaEcsK0JBQStCLEVBQUU7Z0JBQzdCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEtBQUs7Z0JBQ3JELEtBQUssRUFBRSx3REFBd0Q7YUFDbEU7WUFDRCxnQ0FBZ0MsRUFBRTtnQkFDOUIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsTUFBTTtnQkFDdEQsS0FBSyxFQUFFLHlEQUF5RDthQUNuRTtZQUNELGtDQUFrQyxFQUFFO2dCQUNoQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRO2dCQUN4RCxLQUFLLEVBQUUsMkRBQTJEO2FBQ3JFO1lBQ0QsbUNBQW1DLEVBQUU7Z0JBQ2pDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLFNBQVM7Z0JBQ3pELEtBQUssRUFBRSw0REFBNEQ7YUFDdEU7U0FDSixFQUFFLENBQUMsQ0FBQztRQUVMLElBQUEscUJBQVUsRUFBQyxxQkFBcUIsRUFBRSw4Q0FBOEMsRUFBRSxRQUFRLEVBQUU7WUFDeEYsa0NBQWtDLEVBQUU7Z0JBQ2hDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxZQUFZO2dCQUN4RCxLQUFLLEVBQUUsMkRBQTJEO2FBQ3JFO1lBQ0QsK0JBQStCLEVBQUU7Z0JBQzdCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxTQUFTO2dCQUNyRCxPQUFPLEVBQUUsQ0FBQztnQkFDVixLQUFLLEVBQUUsd0RBQXdEO2FBQ2xFO1lBQ0QsdUNBQXVDLEVBQUU7Z0JBQ3JDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxpQkFBaUI7Z0JBQzdELEtBQUssRUFBRSxnRUFBZ0U7Z0JBQ3ZFLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQztnQkFDbEcsZ0JBQWdCLEVBQUU7b0JBQ2QsMEVBQTBFO29CQUMxRSwwRUFBMEU7b0JBQzFFLDJFQUEyRTtvQkFDM0UsNEVBQTRFO29CQUM1RSw2RUFBNkU7b0JBQzdFLCtFQUErRTtvQkFDL0UsOEVBQThFO2lCQUNqRjthQUNKO1lBQ0QsNkJBQTZCLEVBQUU7Z0JBQzNCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPO2dCQUNuRCxLQUFLLEVBQUUsc0RBQXNEO2FBQ2hFO1lBQ0QsMEJBQTBCLEVBQUU7Z0JBQ3hCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJO2dCQUNoRCxLQUFLLEVBQUUsbURBQW1EO2FBQzdEO1lBQ0QsZ0NBQWdDLEVBQUU7Z0JBQzlCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxVQUFVO2dCQUN0RCxLQUFLLEVBQUUseURBQXlEO2FBQ25FO1NBQ0osRUFBRSxDQUFDLENBQUM7UUFFTCxJQUFBLHFCQUFVLEVBQUMscUJBQXFCLEVBQUUsOENBQThDLEVBQUUsUUFBUSxFQUFFO1lBQ3hGLHdCQUF3QixFQUFFO2dCQUN0QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUscUJBQXFCLENBQUMsZUFBZTtnQkFDOUMsS0FBSyxFQUFFLCtEQUErRDthQUN6RTtZQUNELGdCQUFnQixFQUFFLElBQUEsdUJBQVksRUFBQyxTQUFTLEVBQUU7Z0JBQ3RDLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQyxPQUFPO2dCQUN0QyxLQUFLLEVBQUUsdURBQXVEO2dCQUM5RCxvQkFBb0IsRUFBRSxJQUFBLHVCQUFZLEVBQUM7b0JBQy9CLElBQUksRUFBRTt3QkFDRixJQUFJLEVBQUUsUUFBUTt3QkFDZCxLQUFLLEVBQUUsMkJBQTJCO3FCQUNyQztvQkFDRCxjQUFjLEVBQUUsZUFBZSxDQUFDLGNBQWM7b0JBQzlDLEtBQUssRUFBRSxlQUFlLENBQUMsV0FBVztvQkFDbEMsb0JBQW9CLEVBQUUsSUFBQSx1QkFBWSxFQUFDO3dCQUMvQixLQUFLLEVBQUU7NEJBQ0gsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsS0FBSyxFQUFFLCtFQUErRTt5QkFDekY7d0JBQ0QsT0FBTyxFQUFFOzRCQUNMLElBQUksRUFBRSxRQUFROzRCQUNkLEtBQUssRUFBRSxpRkFBaUY7eUJBQzNGO3FCQUNKLEVBQUU7d0JBQ0MsS0FBSyxFQUFFLHlFQUF5RTtxQkFDbkYsQ0FBQztpQkFDTCxFQUFFO29CQUNDLEtBQUssRUFBRSwwREFBMEQ7aUJBQ3BFLENBQUM7YUFDTCxDQUFDO1NBQ0wsRUFBRSxDQUFDLENBQUM7UUFFTCxJQUFBLHFCQUFVLEVBQUMsaUJBQWlCLEVBQUUsMENBQTBDLEVBQUUsUUFBUSxFQUFFO1lBQ2hGLDBCQUEwQixFQUFFO2dCQUN4QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxJQUFJLGlCQUFpQjtnQkFDdEUsS0FBSyxFQUFFLG1EQUFtRDtnQkFDMUQsSUFBSSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUM7Z0JBQzVDLGdCQUFnQixFQUFFO29CQUNkLDREQUE0RDtvQkFDNUQsNERBQTREO2lCQUMvRDthQUNKO1lBQ0QsQ0FBQyw2QkFBNkIsQ0FBQyxFQUFFO2dCQUM3QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUsT0FBTyx5QkFBeUIsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM5RixLQUFLLEVBQUUsdURBQXVEO2dCQUM5RCxXQUFXLEVBQUUsNkRBQTZEO2FBQzdFO1lBQ0QsOENBQThDLEVBQUU7Z0JBQzVDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLDhCQUE4QixDQUFDLElBQUksS0FBSztnQkFDbEYsS0FBSyxFQUFFLG9FQUFvRTtnQkFDM0UsV0FBVyxFQUFFLDBFQUEwRTthQUMxRjtTQUNKLEVBQUUsQ0FBQyxDQUFDO1FBRUwsSUFBQSxxQkFBVSxFQUFDLGtCQUFrQixFQUFFLDJDQUEyQyxFQUFFLFFBQVEsRUFBRTtZQUNsRix1QkFBdUIsRUFBRTtnQkFDckIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsY0FBYztnQkFDN0MsS0FBSyxFQUFFLDBEQUEwRDtnQkFDakUsV0FBVyxFQUFFLGdFQUFnRTthQUNoRjtZQUNELG9CQUFvQixFQUFFO2dCQUNsQixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxXQUFXO2dCQUMxQyxLQUFLLEVBQUUsdURBQXVEO2FBQ2pFO1lBQ0QsK0JBQStCLEVBQUU7Z0JBQzdCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLHNCQUFzQjtnQkFDckQsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxFQUFFLGtFQUFrRTthQUM1RTtTQUNKLEVBQUUsQ0FBQyxDQUFDO1FBRUwsSUFBQSxxQkFBVSxFQUFDLDJCQUEyQixFQUFFLG9EQUFvRCxFQUFFLFFBQVEsRUFBRTtZQUNwRyxrQ0FBa0MsRUFBRSxJQUFBLHNCQUFXLEVBQUMsSUFBQSx1QkFBWSxFQUFDO2dCQUN6RCxhQUFhLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsT0FBTyxFQUFFLENBQUM7b0JBQ1YsT0FBTyxFQUFFLENBQUM7b0JBQ1YsS0FBSyxFQUFFLDRGQUE0RjtvQkFDbkcsV0FBVyxFQUFFLGtHQUFrRztpQkFDbEg7Z0JBQ0QsUUFBUSxFQUFFLElBQUEsc0JBQVcsRUFBQyxJQUFBLHVCQUFZLEVBQUM7b0JBQy9CLFFBQVEsRUFBRTt3QkFDTixJQUFJLEVBQUUsUUFBUTt3QkFDZCxPQUFPLEVBQUUsRUFBRTt3QkFDWCxLQUFLLEVBQUUsZ0dBQWdHO3dCQUN2RyxXQUFXLEVBQUUsc0dBQXNHO3FCQUN0SDtvQkFDRCxLQUFLLEVBQUUsSUFBQSxzQkFBVyxFQUFDO3dCQUNmLElBQUksRUFBRSxRQUFRO3dCQUNkLE9BQU8sRUFBRSxFQUFFO3dCQUNYLEtBQUssRUFBRSxpR0FBaUc7cUJBQzNHLEVBQUU7d0JBQ0MsS0FBSyxFQUFFLDZGQUE2Rjt3QkFDcEcsV0FBVyxFQUFFLG1HQUFtRztxQkFDbkgsQ0FBQztpQkFDTCxFQUFFO29CQUNDLEtBQUssRUFBRSwyRkFBMkY7b0JBQ2xHLFFBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7aUJBQ2xDLENBQUMsRUFBRTtvQkFDQSxLQUFLLEVBQUUsdUZBQXVGO29CQUM5RixXQUFXLEVBQUUsNkZBQTZGO2lCQUM3RyxDQUFDO2FBQ0wsRUFBRTtnQkFDQyxLQUFLLEVBQUUsa0ZBQWtGO2dCQUN6RixRQUFRLEVBQUUsQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDO2FBQzFDLENBQUMsRUFBRTtnQkFDQSxPQUFPLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUI7Z0JBQ3hELEtBQUssRUFBRSw4RUFBOEU7Z0JBQ3JGLFdBQVcsRUFBRSxvRkFBb0Y7YUFDcEcsQ0FBQztTQUNMLEVBQUUsQ0FBQyxDQUFDO1FBRUwsSUFBQSxxQkFBVSxFQUFDLG9CQUFvQixFQUFFLDZDQUE2QyxFQUFFLFFBQVEsRUFBRTtZQUN0RixHQUFHLGdCQUFnQixDQUFDLG9CQUFvQixFQUFFLGVBQWUsQ0FBQztZQUMxRCxvQkFBb0IsRUFBRSxJQUFBLHNCQUFXLEVBQUMsSUFBQSx1QkFBWSxFQUFDO2dCQUMzQyxHQUFHLEVBQUU7b0JBQ0QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsS0FBSyxFQUFFLDZEQUE2RDtpQkFDdkU7Z0JBQ0QsS0FBSyxFQUFFO29CQUNILElBQUksRUFBRSxTQUFTO29CQUNmLEtBQUssRUFBRSwrREFBK0Q7aUJBQ3pFO2FBQ0osRUFBRTtnQkFDQyxLQUFLLEVBQUUsNkRBQTZEO2dCQUNwRSxRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDO2FBQzdCLENBQUMsRUFBRTtnQkFDQSxPQUFPLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxXQUFXO2dCQUMxQyxLQUFLLEVBQUUseURBQXlEO2dCQUNoRSxXQUFXLEVBQUUsK0RBQStEO2FBQy9FLENBQUM7U0FDTCxFQUFFLENBQUMsQ0FBQztRQUVMLElBQUEscUJBQVUsRUFBQyxxQkFBcUIsRUFBRSxxREFBcUQsRUFBRSxRQUFRLEVBQUU7WUFDL0YscUJBQXFCLEVBQUU7Z0JBQ25CLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFlBQVk7Z0JBQzNDLEtBQUssRUFBRSxxREFBcUQ7Z0JBQzVELFdBQVcsRUFBRSwyREFBMkQ7YUFDM0U7U0FDSixFQUFFLENBQUMsQ0FBQztRQUVMLElBQUEscUJBQVUsRUFBQyxzQkFBc0IsRUFBRSxzREFBc0QsRUFBRSxRQUFRLEVBQUU7WUFDakcsc0JBQXNCLEVBQUU7Z0JBQ3BCLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWE7Z0JBQzVDLEtBQUssRUFBRSxzREFBc0Q7Z0JBQzdELFdBQVcsRUFBRSw0REFBNEQ7YUFDNUU7U0FDSixFQUFFLEVBQUUsQ0FBQztLQUNULENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyxjQUFjLENBQ25CLFVBQTZCLEVBQzdCLElBQWM7SUFFZCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQ3JCLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQ3BFLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsTUFBYyxFQUNkLFVBQTZEO0lBRTdELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FDckIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUNoRixDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSUVuZ2luZUNvbmZpZyB9IGZyb20gJy4vQHR5cGVzL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IElDb2Nvc0NvbmZpZ3VyYXRpb25Ob2RlLCBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWEgfSBmcm9tICcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9tZXRhZGF0YSc7XG5pbXBvcnQgeyBhcnJheVNjaGVtYSwgY3JlYXRlTm9kZSwgb2JqZWN0U2NoZW1hIH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbi9zY3JpcHQvbWV0YWRhdGEnO1xuaW1wb3J0IHsgZ2V0RW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbiB9IGZyb20gJy4vZHluYW1pYy1tZXRhZGF0YSc7XG5pbXBvcnQgeyBjcmVhdGVEZWZhdWx0RW5naW5lTW9kdWxlUHJvamVjdERlZmF1bHRzIH0gZnJvbSAnLi9tb2R1bGUtY29uZmlnLWRlZmF1bHRzJztcblxuY29uc3QgQ1VTVE9NX1BJUEVMSU5FX05BTUVfS0VZID0gJ0NVU1RPTV9QSVBFTElORV9OQU1FJztcbmNvbnN0IENVU1RPTV9QSVBFTElORV9OQU1FX1BST1BFUlRZID0gYGVuZ2luZS5tYWNyb0NvbmZpZy4ke0NVU1RPTV9QSVBFTElORV9OQU1FX0tFWX1gO1xuXG5pbnRlcmZhY2UgSUVuZ2luZU1ldGFkYXRhT3B0aW9ucyB7XG4gICAgZGVmYXVsdENvbmZpZzogSUVuZ2luZUNvbmZpZztcbiAgICBlbmdpbmVSb290OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbmdpbmVNZXRhZGF0YU5vZGVzKG9wdGlvbnM6IElFbmdpbmVNZXRhZGF0YU9wdGlvbnMpOiBJQ29jb3NDb25maWd1cmF0aW9uTm9kZVtdIHtcbiAgICBjb25zdCBkeW5hbWljTWV0YWRhdGEgPSBnZXRFbmdpbmVEeW5hbWljQ29uZmlnQ29udHJpYnV0aW9uKHtcbiAgICAgICAgZW5naW5lUm9vdDogb3B0aW9ucy5lbmdpbmVSb290LFxuICAgICAgICBmYWxsYmFja0NvbmZpZzoge1xuICAgICAgICAgICAgaW5jbHVkZU1vZHVsZXM6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5pbmNsdWRlTW9kdWxlcyxcbiAgICAgICAgICAgIGZsYWdzOiBvcHRpb25zLmRlZmF1bHRDb25maWcuZmxhZ3MsXG4gICAgICAgICAgICBtYWNyb0NvbmZpZzogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLm1hY3JvQ29uZmlnLFxuICAgICAgICB9LFxuICAgIH0pLm1ldGFkYXRhO1xuICAgIGNvbnN0IG1vZHVsZVByb2plY3REZWZhdWx0cyA9IGNyZWF0ZURlZmF1bHRFbmdpbmVNb2R1bGVQcm9qZWN0RGVmYXVsdHMob3B0aW9ucy5lbmdpbmVSb290KTtcbiAgICBjb25zdCBtYWNyb1Byb3BlcnRpZXMgPSBvbWl0UHJvcGVydGllcyhkeW5hbWljTWV0YWRhdGEubWFjcm9Qcm9wZXJ0aWVzLCBbQ1VTVE9NX1BJUEVMSU5FX05BTUVfS0VZXSk7XG4gICAgY29uc3QgY3VzdG9tUGlwZWxpbmVOYW1lRGVmYXVsdCA9IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5tYWNyb0NvbmZpZz8uW0NVU1RPTV9QSVBFTElORV9OQU1FX0tFWV07XG5cbiAgICByZXR1cm4gW1xuICAgICAgICBjcmVhdGVOb2RlKCdlbmdpbmUucGh5c2ljc0NvbmZpZycsICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcudGl0bGUnLCAnZW5naW5lJywge1xuICAgICAgICAgICAgJ2VuZ2luZS5waHlzaWNzQ29uZmlnLmdyYXZpdHknOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnBoeXNpY3NDb25maWcuZ3Jhdml0eSxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5ncmF2aXR5LnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5ncmF2aXR5LmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcuYWxsb3dTbGVlcCc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnBoeXNpY3NDb25maWcuYWxsb3dTbGVlcCxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5hbGxvd1NsZWVwLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5hbGxvd1NsZWVwLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcuc2xlZXBUaHJlc2hvbGQnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnBoeXNpY3NDb25maWcuc2xlZXBUaHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgbWluaW11bTogMCxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5zbGVlcFRocmVzaG9sZC50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcuc2xlZXBUaHJlc2hvbGQuZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUucGh5c2ljc0NvbmZpZy5hdXRvU2ltdWxhdGlvbic6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnBoeXNpY3NDb25maWcuYXV0b1NpbXVsYXRpb24sXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcuYXV0b1NpbXVsYXRpb24udGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLmF1dG9TaW11bGF0aW9uLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcuZml4ZWRUaW1lU3RlcCc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcucGh5c2ljc0NvbmZpZy5maXhlZFRpbWVTdGVwLFxuICAgICAgICAgICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcuZml4ZWRUaW1lU3RlcC50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcuZml4ZWRUaW1lU3RlcC5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2VuZ2luZS5waHlzaWNzQ29uZmlnLm1heFN1YlN0ZXBzJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5waHlzaWNzQ29uZmlnLm1heFN1YlN0ZXBzLFxuICAgICAgICAgICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcubWF4U3ViU3RlcHMudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLm1heFN1YlN0ZXBzLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcudXNlTm9kZUNoYWlucyc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnBoeXNpY3NDb25maWcudXNlTm9kZUNoYWlucyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy51c2VOb2RlQ2hhaW5zLnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcucGh5c2ljc0VuZ2luZSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcucGh5c2ljc0NvbmZpZy5waHlzaWNzRW5naW5lLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLnBoeXNpY3NFbmdpbmUudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLnBoeXNpY3NFbmdpbmUuZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUucGh5c2ljc0NvbmZpZy5jb2xsaXNpb25NYXRyaXgnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnBoeXNpY3NDb25maWcuY29sbGlzaW9uTWF0cml4LFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLmNvbGxpc2lvbk1hdHJpeC50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcuY29sbGlzaW9uTWF0cml4LmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcuY29sbGlzaW9uR3JvdXBzJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnBoeXNpY3NDb25maWcuY29sbGlzaW9uR3JvdXBzLnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnBoeXNpY3NDb25maWcuZGVmYXVsdE1hdGVyaWFsJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5waHlzaWNzQ29uZmlnLmRlZmF1bHRNYXRlcmlhbCxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5kZWZhdWx0TWF0ZXJpYWwudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLmRlZmF1bHRNYXRlcmlhbC5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2VuZ2luZS5waHlzaWNzQ29uZmlnLnBoeXNYJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5waHlzaWNzQ29uZmlnLnBoeXNYLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5waHlzaWNzQ29uZmlnLnBoeXNYLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucGh5c2ljc0NvbmZpZy5waHlzWC5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCAxKSxcblxuICAgICAgICBjcmVhdGVOb2RlKCdlbmdpbmUuZGVzaWduUmVzb2x1dGlvbicsICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmRlc2lnblJlc29sdXRpb24udGl0bGUnLCAnZW5naW5lJywge1xuICAgICAgICAgICAgJ2VuZ2luZS5kZXNpZ25SZXNvbHV0aW9uLndpZHRoJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5kZXNpZ25SZXNvbHV0aW9uLndpZHRoLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5kZXNpZ25SZXNvbHV0aW9uLndpZHRoLnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0Jzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZGVzaWduUmVzb2x1dGlvbi5oZWlnaHQudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUuZGVzaWduUmVzb2x1dGlvbi5maXRXaWR0aCc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLmRlc2lnblJlc29sdXRpb24uZml0V2lkdGgsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmRlc2lnblJlc29sdXRpb24uZml0V2lkdGgudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUuZGVzaWduUmVzb2x1dGlvbi5maXRIZWlnaHQnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5kZXNpZ25SZXNvbHV0aW9uLmZpdEhlaWdodCxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZGVzaWduUmVzb2x1dGlvbi5maXRIZWlnaHQudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgMiksXG5cbiAgICAgICAgY3JlYXRlTm9kZSgnZW5naW5lLnNwbGFzaFNjcmVlbicsICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnNwbGFzaFNjcmVlbi50aXRsZScsICdlbmdpbmUnLCB7XG4gICAgICAgICAgICAnZW5naW5lLnNwbGFzaFNjcmVlbi5kaXNwbGF5UmF0aW8nOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnNwbGFzaFNjcmVlbi5kaXNwbGF5UmF0aW8sXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnNwbGFzaFNjcmVlbi5kaXNwbGF5UmF0aW8udGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUuc3BsYXNoU2NyZWVuLnRvdGFsVGltZSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcuc3BsYXNoU2NyZWVuLnRvdGFsVGltZSxcbiAgICAgICAgICAgICAgICBtaW5pbXVtOiAwLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5zcGxhc2hTY3JlZW4udG90YWxUaW1lLnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnNwbGFzaFNjcmVlbi53YXRlcm1hcmtMb2NhdGlvbic6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcuc3BsYXNoU2NyZWVuLndhdGVybWFya0xvY2F0aW9uLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5zcGxhc2hTY3JlZW4ud2F0ZXJtYXJrTG9jYXRpb24udGl0bGUnLFxuICAgICAgICAgICAgICAgIGVudW06IFsnZGVmYXVsdCcsICd0b3BMZWZ0JywgJ3RvcFJpZ2h0JywgJ3RvcENlbnRlcicsICdib3R0b21MZWZ0JywgJ2JvdHRvbUNlbnRlcicsICdib3R0b21SaWdodCddLFxuICAgICAgICAgICAgICAgIGVudW1EZXNjcmlwdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuc3BsYXNoU2NyZWVuLndhdGVybWFya0xvY2F0aW9uLm9wdGlvbnMuZGVmYXVsdCcsXG4gICAgICAgICAgICAgICAgICAgICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnNwbGFzaFNjcmVlbi53YXRlcm1hcmtMb2NhdGlvbi5vcHRpb25zLnRvcExlZnQnLFxuICAgICAgICAgICAgICAgICAgICAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5zcGxhc2hTY3JlZW4ud2F0ZXJtYXJrTG9jYXRpb24ub3B0aW9ucy50b3BSaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnNwbGFzaFNjcmVlbi53YXRlcm1hcmtMb2NhdGlvbi5vcHRpb25zLnRvcENlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnNwbGFzaFNjcmVlbi53YXRlcm1hcmtMb2NhdGlvbi5vcHRpb25zLmJvdHRvbUxlZnQnLFxuICAgICAgICAgICAgICAgICAgICAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5zcGxhc2hTY3JlZW4ud2F0ZXJtYXJrTG9jYXRpb24ub3B0aW9ucy5ib3R0b21DZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5zcGxhc2hTY3JlZW4ud2F0ZXJtYXJrTG9jYXRpb24ub3B0aW9ucy5ib3R0b21SaWdodCcsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnNwbGFzaFNjcmVlbi5hdXRvRml0Jzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcuc3BsYXNoU2NyZWVuLmF1dG9GaXQsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnNwbGFzaFNjcmVlbi5hdXRvRml0LnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLnNwbGFzaFNjcmVlbi5sb2dvJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5zcGxhc2hTY3JlZW4ubG9nbyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuc3BsYXNoU2NyZWVuLmxvZ28udGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUuc3BsYXNoU2NyZWVuLmJhY2tncm91bmQnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLnNwbGFzaFNjcmVlbi5iYWNrZ3JvdW5kLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5zcGxhc2hTY3JlZW4uYmFja2dyb3VuZC50aXRsZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCAzKSxcblxuICAgICAgICBjcmVhdGVOb2RlKCdlbmdpbmUubW9kdWxlQ29uZmlnJywgJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUubW9kdWxlQ29uZmlnLnRpdGxlJywgJ2VuZ2luZScsIHtcbiAgICAgICAgICAgICdlbmdpbmUuZ2xvYmFsQ29uZmlnS2V5Jzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG1vZHVsZVByb2plY3REZWZhdWx0cy5nbG9iYWxDb25maWdLZXksXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnByb2plY3RDb25maWcuZ2xvYmFsQ29uZmlnS2V5LnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLmNvbmZpZ3MnOiBvYmplY3RTY2hlbWEodW5kZWZpbmVkLCB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogbW9kdWxlUHJvamVjdERlZmF1bHRzLmNvbmZpZ3MsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnByb2plY3RDb25maWcuY29uZmlncy50aXRsZScsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IG9iamVjdFNjaGVtYSh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmJ1aWxkZXIub3B0aW9ucy5uYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU1vZHVsZXM6IGR5bmFtaWNNZXRhZGF0YS5pbmNsdWRlTW9kdWxlcyxcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3M6IGR5bmFtaWNNZXRhZGF0YS5mbGFnc09iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbm9EZXByZWNhdGVkRmVhdHVyZXM6IG9iamVjdFNjaGVtYSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUucHJvamVjdENvbmZpZy5ub0RlcHJlY2F0ZWRGZWF0dXJlQ29uZmlnLnZhbHVlLnRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnByb2plY3RDb25maWcubm9EZXByZWNhdGVkRmVhdHVyZUNvbmZpZy52ZXJzaW9uLnRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5wcm9qZWN0Q29uZmlnLm5vRGVwcmVjYXRlZEZlYXR1cmVDb25maWcudGl0bGUnLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5wcm9qZWN0Q29uZmlnLmNvbmZpZ0l0ZW0udGl0bGUnLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0sIDQpLFxuXG4gICAgICAgIGNyZWF0ZU5vZGUoJ2VuZ2luZS5ncmFwaGljcycsICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmdyYXBoaWNzLnRpdGxlJywgJ2VuZ2luZScsIHtcbiAgICAgICAgICAgICdlbmdpbmUuZ3JhcGhpY3MucGlwZWxpbmUnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLmdyYXBoaWNzPy5waXBlbGluZSA/PyAnY3VzdG9tLXBpcGVsaW5lJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZ3JhcGhpY3MucGlwZWxpbmUudGl0bGUnLFxuICAgICAgICAgICAgICAgIGVudW06IFsnY3VzdG9tLXBpcGVsaW5lJywgJ2xlZ2FjeS1waXBlbGluZSddLFxuICAgICAgICAgICAgICAgIGVudW1EZXNjcmlwdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZ3JhcGhpY3MucGlwZWxpbmUub3B0aW9ucy5jdXN0b20nLFxuICAgICAgICAgICAgICAgICAgICAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5ncmFwaGljcy5waXBlbGluZS5vcHRpb25zLmxlZ2FjeScsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbQ1VTVE9NX1BJUEVMSU5FX05BTUVfUFJPUEVSVFldOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHlwZW9mIGN1c3RvbVBpcGVsaW5lTmFtZURlZmF1bHQgPT09ICdzdHJpbmcnID8gY3VzdG9tUGlwZWxpbmVOYW1lRGVmYXVsdCA6ICdCdWlsdGluJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZ3JhcGhpY3MucGlwZWxpbmVOYW1lLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZ3JhcGhpY3MucGlwZWxpbmVOYW1lLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZW5naW5lLmdyYXBoaWNzLmN1c3RvbS1waXBlbGluZS1wb3N0LXByb2Nlc3MnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5ncmFwaGljcz8uWydjdXN0b20tcGlwZWxpbmUtcG9zdC1wcm9jZXNzJ10gPz8gZmFsc2UsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmdyYXBoaWNzLmN1c3RvbVBpcGVsaW5lUG9zdFByb2Nlc3MudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5ncmFwaGljcy5jdXN0b21QaXBlbGluZVBvc3RQcm9jZXNzLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIDUpLFxuXG4gICAgICAgIGNyZWF0ZU5vZGUoJ2VuZ2luZS5yZW5kZXJpbmcnLCAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5yZW5kZXJpbmcudGl0bGUnLCAnZW5naW5lJywge1xuICAgICAgICAgICAgJ2VuZ2luZS5yZW5kZXJQaXBlbGluZSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcucmVuZGVyUGlwZWxpbmUsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnJlbmRlcmluZy5yZW5kZXJQaXBlbGluZS50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLnJlbmRlcmluZy5yZW5kZXJQaXBlbGluZS5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2VuZ2luZS5oaWdoUXVhbGl0eSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLmhpZ2hRdWFsaXR5LFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5yZW5kZXJpbmcuaGlnaFF1YWxpdHkudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdlbmdpbmUuZG93bmxvYWRNYXhDb25jdXJyZW5jeSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcuZG93bmxvYWRNYXhDb25jdXJyZW5jeSxcbiAgICAgICAgICAgICAgICBtaW5pbXVtOiAxLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5yZW5kZXJpbmcuZG93bmxvYWRNYXhDb25jdXJyZW5jeS50aXRsZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCA2KSxcblxuICAgICAgICBjcmVhdGVOb2RlKCdlbmdpbmUuam9pbnRUZXh0dXJlTGF5b3V0JywgJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuam9pbnRUZXh0dXJlTGF5b3V0LnRpdGxlJywgJ2VuZ2luZScsIHtcbiAgICAgICAgICAgICdlbmdpbmUuY3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cyc6IGFycmF5U2NoZW1hKG9iamVjdFNjaGVtYSh7XG4gICAgICAgICAgICAgICAgdGV4dHVyZUxlbmd0aDoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMCxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLnRleHR1cmVMZW5ndGgudGl0bGUnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuam9pbnRUZXh0dXJlTGF5b3V0LmN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMudGV4dHVyZUxlbmd0aC5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250ZW50czogYXJyYXlTY2hlbWEob2JqZWN0U2NoZW1hKHtcbiAgICAgICAgICAgICAgICAgICAgc2tlbGV0b246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuam9pbnRUZXh0dXJlTGF5b3V0LmN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMuY29udGVudHMuc2tlbGV0b24udGl0bGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLmNvbnRlbnRzLnNrZWxldG9uLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY2xpcHM6IGFycmF5U2NoZW1hKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuam9pbnRUZXh0dXJlTGF5b3V0LmN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMuY29udGVudHMuY2xpcHMuaXRlbVRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLmNvbnRlbnRzLmNsaXBzLnRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5qb2ludFRleHR1cmVMYXlvdXQuY3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cy5jb250ZW50cy5jbGlwcy5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLmNvbnRlbnRzLml0ZW1UaXRsZScsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NrZWxldG9uJywgJ2NsaXBzJ10sXG4gICAgICAgICAgICAgICAgfSksIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLmNvbnRlbnRzLnRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLmNvbnRlbnRzLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuam9pbnRUZXh0dXJlTGF5b3V0LmN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMuaXRlbVRpdGxlJyxcbiAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd0ZXh0dXJlTGVuZ3RoJywgJ2NvbnRlbnRzJ10sXG4gICAgICAgICAgICB9KSwge1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG9wdGlvbnMuZGVmYXVsdENvbmZpZy5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5qb2ludFRleHR1cmVMYXlvdXQuY3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cy50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmpvaW50VGV4dHVyZUxheW91dC5jdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9LCA3KSxcblxuICAgICAgICBjcmVhdGVOb2RlKCdlbmdpbmUubWFjcm9Db25maWcnLCAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5tYWNyb0NvbmZpZy50aXRsZScsICdlbmdpbmUnLCB7XG4gICAgICAgICAgICAuLi5wcmVmaXhQcm9wZXJ0aWVzKCdlbmdpbmUubWFjcm9Db25maWcnLCBtYWNyb1Byb3BlcnRpZXMpLFxuICAgICAgICAgICAgJ2VuZ2luZS5tYWNyb0N1c3RvbSc6IGFycmF5U2NoZW1hKG9iamVjdFNjaGVtYSh7XG4gICAgICAgICAgICAgICAga2V5OiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUubWFjcm9Db25maWcubWFjcm9DdXN0b20ua2V5LnRpdGxlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLm1hY3JvQ29uZmlnLm1hY3JvQ3VzdG9tLnZhbHVlLnRpdGxlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5tYWNyb0NvbmZpZy5tYWNyb0N1c3RvbS5pdGVtVGl0bGUnLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2tleScsICd2YWx1ZSddLFxuICAgICAgICAgICAgfSksIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcubWFjcm9DdXN0b20sXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLm1hY3JvQ29uZmlnLm1hY3JvQ3VzdG9tLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUubWFjcm9Db25maWcubWFjcm9DdXN0b20uZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0sIDgpLFxuXG4gICAgICAgIGNyZWF0ZU5vZGUoJ2VuZ2luZS5jdXN0b21MYXllcnMnLCAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5sYXllcnMuY3VzdG9tTGF5ZXJzLnRpdGxlJywgJ2VuZ2luZScsIHtcbiAgICAgICAgICAgICdlbmdpbmUuY3VzdG9tTGF5ZXJzJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogb3B0aW9ucy5kZWZhdWx0Q29uZmlnLmN1c3RvbUxheWVycyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUubGF5ZXJzLmN1c3RvbUxheWVycy50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmxheWVycy5jdXN0b21MYXllcnMuZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgOSksXG5cbiAgICAgICAgY3JlYXRlTm9kZSgnZW5naW5lLnNvcnRpbmdMYXllcnMnLCAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5sYXllcnMuc29ydGluZ0xheWVycy50aXRsZScsICdlbmdpbmUnLCB7XG4gICAgICAgICAgICAnZW5naW5lLnNvcnRpbmdMYXllcnMnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBvcHRpb25zLmRlZmF1bHRDb25maWcuc29ydGluZ0xheWVycyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUubGF5ZXJzLnNvcnRpbmdMYXllcnMudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5sYXllcnMuc29ydGluZ0xheWVycy5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCAxMCksXG4gICAgXTtcbn1cblxuZnVuY3Rpb24gb21pdFByb3BlcnRpZXM8VD4oXG4gICAgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgVD4sXG4gICAga2V5czogc3RyaW5nW11cbik6IFJlY29yZDxzdHJpbmcsIFQ+IHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKS5maWx0ZXIoKFtrZXldKSA9PiAha2V5cy5pbmNsdWRlcyhrZXkpKVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIHByZWZpeFByb3BlcnRpZXMoXG4gICAgcHJlZml4OiBzdHJpbmcsXG4gICAgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPlxuKTogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPiB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMocHJvcGVydGllcykubWFwKChba2V5LCB2YWx1ZV0pID0+IFtgJHtwcmVmaXh9LiR7a2V5fWAsIHZhbHVlXSlcbiAgICApO1xufVxuIl19