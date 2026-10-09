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
exports.GltfHandler = void 0;
exports.migrateMeshOptimizerOption = migrateMeshOptimizerOption;
exports.migrateFbxMatchMeshNames = migrateFbxMatchMeshNames;
exports.migrateMeshSimplifyOption = migrateMeshSimplifyOption;
const asset_db_1 = require("@cocos/asset-db");
const assert_1 = require("assert");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const urijs_1 = __importDefault(require("urijs"));
const url_1 = __importDefault(require("url"));
const asset_finder_1 = require("./gltf/asset-finder");
const material_1 = require("./gltf/material");
const reader_manager_1 = require("./gltf/reader-manager");
const interface_1 = require("../../@types/interface");
const uri_utils_1 = require("./utils/uri-utils");
const cc_1 = require("cc");
const resolve_glTF_image_path_1 = require("./utils/resolve-glTF-image-path");
const serialize_library_1 = require("./utils/serialize-library");
const original_animation_1 = require("./gltf/original-animation");
const path_1 = require("path");
const utils_1 = require("../utils");
const meshSimplify_1 = require("./gltf/meshSimplify");
const utils_2 = require("./image/utils");
const query_1 = __importDefault(require("../../manager/query"));
const asset_config_1 = __importDefault(require("../../asset-config"));
const lodash = require('lodash');
// const ajv = new Ajv({
//     errorDataPath: '',
// });
// const schemaFile = path.join(__dirname, '..', '..', '..', 'dist', 'meta-schemas', 'glTF.meta.json');
// const schema = fs.readJSONSync(schemaFile);
// const metaValidator = ajv.compile(schema);
exports.GltfHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'gltf',
    propertySchemaConfig: {
        dumpMaterials: {
            title: 'i18n:ENGINE.assets.fbx.GlTFUserData.dumpMaterials.name',
            description: 'i18n:ENGINE.assets.fbx.GlTFUserData.dumpMaterials.title',
            type: 'boolean',
            default: false,
        },
        mountAllAnimationsOnPrefab: {
            title: 'i18n:ENGINE.assets.fbx.GlTFUserData.mountAllAnimationsOnPrefab.name',
            description: 'i18n:importer.property_schema.gltf.mount_all_animations_on_prefab_description',
            type: 'boolean',
            default: false,
        },
        allowMeshDataAccess: {
            title: 'i18n:ENGINE.assets.fbx.allowMeshDataAccess.name',
            description: 'i18n:ENGINE.assets.fbx.allowMeshDataAccess.title',
            type: 'boolean',
            default: true,
        },
        addVertexColor: {
            title: 'i18n:ENGINE.assets.fbx.addVertexColor.name',
            description: 'i18n:ENGINE.assets.fbx.addVertexColor.title',
            type: 'boolean',
            default: false,
        },
        promoteSingleRootNode: {
            title: 'i18n:ENGINE.assets.fbx.promoteSingleRootNode.name',
            description: 'i18n:ENGINE.assets.fbx.promoteSingleRootNode.title',
            type: 'boolean',
            default: false,
        },
        generateLightmapUVNode: {
            title: 'i18n:ENGINE.assets.fbx.generateLightmapUVNode.name',
            description: 'i18n:ENGINE.assets.fbx.generateLightmapUVNode.title',
            type: 'boolean',
            default: false,
        },
        normals: {
            title: 'i18n:ENGINE.assets.fbx.GlTFUserData.normals.name',
            description: 'i18n:ENGINE.assets.fbx.GlTFUserData.normals.title',
            type: 'number',
            default: interface_1.NormalImportSetting.require,
            enum: [
                interface_1.NormalImportSetting.optional,
                interface_1.NormalImportSetting.exclude,
                interface_1.NormalImportSetting.require,
                interface_1.NormalImportSetting.recalculate,
            ],
            enumDescriptions: [
                'i18n:ENGINE.assets.fbx.GlTFUserData.normals.optional.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.normals.exclude.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.normals.require.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.normals.recalculate.name',
            ],
        },
        tangents: {
            title: 'i18n:ENGINE.assets.fbx.GlTFUserData.tangents.name',
            description: 'i18n:ENGINE.assets.fbx.GlTFUserData.tangents.title',
            type: 'number',
            default: interface_1.TangentImportSetting.require,
            enum: [
                interface_1.TangentImportSetting.exclude,
                interface_1.TangentImportSetting.optional,
                interface_1.TangentImportSetting.require,
                interface_1.TangentImportSetting.recalculate,
            ],
            enumDescriptions: [
                'i18n:ENGINE.assets.fbx.GlTFUserData.tangents.exclude.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.tangents.optional.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.tangents.require.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.tangents.recalculate.name',
            ],
        },
        morphNormals: {
            title: 'i18n:ENGINE.assets.fbx.GlTFUserData.morphNormals.name',
            description: 'i18n:ENGINE.assets.fbx.GlTFUserData.morphNormals.title',
            type: 'number',
            default: interface_1.NormalImportSetting.exclude,
            enum: [
                interface_1.NormalImportSetting.exclude,
                interface_1.NormalImportSetting.optional,
            ],
            enumDescriptions: [
                'i18n:ENGINE.assets.fbx.GlTFUserData.morphNormals.exclude.name',
                'i18n:ENGINE.assets.fbx.GlTFUserData.morphNormals.optional.name',
            ],
        },
        meshOptimizer: {
            title: 'i18n:importer.property_schema.gltf.mesh_optimizer',
            description: 'i18n:importer.property_schema.gltf.mesh_optimizer_description',
            type: 'object',
            default: {
                enable: false,
                algorithm: 'simplify',
                simplifyOptions: (0, meshSimplify_1.getDefaultSimplifyOptions)(),
            },
            properties: {
                enable: {
                    title: 'i18n:importer.property_schema.gltf.mesh_optimizer_enable',
                    description: 'i18n:importer.property_schema.gltf.mesh_optimizer_enable_description',
                    type: 'boolean',
                    default: false,
                },
                algorithm: {
                    title: 'i18n:importer.property_schema.gltf.mesh_optimizer_algorithm',
                    description: 'i18n:importer.property_schema.gltf.mesh_optimizer_algorithm_description',
                    type: 'string',
                    default: 'simplify',
                    enum: ['simplify', 'gltfpack'],
                    enumDescriptions: [
                        'i18n:importer.property_schema.gltf.mesh_optimizer_simplify',
                        'i18n:importer.property_schema.gltf.mesh_optimizer_gltfpack',
                    ],
                },
                simplifyOptions: {
                    title: 'i18n:importer.property_schema.gltf.simplify_options',
                    description: 'i18n:importer.property_schema.gltf.simplify_options_description',
                    type: 'object',
                    default: (0, meshSimplify_1.getDefaultSimplifyOptions)(),
                    properties: {
                        targetRatio: {
                            title: 'i18n:ENGINE.assets.fbx.meshSimplify.targetRatio.name',
                            description: 'i18n:importer.property_schema.gltf.target_ratio_description',
                            type: 'number',
                            default: 1,
                            minimum: 0,
                            maximum: 1,
                            step: 0.01,
                        },
                        enableSmartLink: {
                            title: 'i18n:importer.property_schema.gltf.enable_smart_link',
                            description: 'i18n:importer.property_schema.gltf.enable_smart_link_description',
                            type: 'boolean',
                            default: true,
                        },
                        agressiveness: {
                            title: 'i18n:importer.property_schema.gltf.agressiveness',
                            description: 'i18n:importer.property_schema.gltf.agressiveness_description',
                            type: 'number',
                            default: 7,
                            minimum: 0,
                            step: 1,
                        },
                        maxIterationCount: {
                            title: 'i18n:importer.property_schema.gltf.max_iteration_count',
                            description: 'i18n:importer.property_schema.gltf.max_iteration_count_description',
                            type: 'number',
                            default: 100,
                            minimum: 1,
                            step: 1,
                        },
                    },
                },
            },
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '2.3.14',
        versionCode: 3,
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            await validateMeta(asset);
            return await importSubAssets(asset, this.version);
        },
        async afterSubAssetsImport(asset) {
            await reader_manager_1.glTfReaderManager.delete(asset);
        },
    },
};
exports.default = exports.GltfHandler;
async function validateMeta(asset) {
    // asset.meta.userData.imageMetas ??= [];
    // const metaValidation = await metaValidator(asset.meta.userData);
    // if (!metaValidation) {
    //     if (Object.keys(asset.meta.userData).length !== 0) {
    //         console.debug(
    //             'Meta file of asset ' +
    //             asset.source +
    //             ' is damaged: \n' +
    //             (metaValidator.errors || []).map((error) => error.message) +
    //             '\nA default meta file is patched.',
    //         );
    //     }
    const defaultMeta = {
        imageMetas: [],
        legacyFbxImporter: false,
        allowMeshDataAccess: true,
        addVertexColor: false,
        generateLightmapUVNode: false,
        meshOptimizer: {
            enable: false,
            algorithm: 'simplify',
            simplifyOptions: (0, meshSimplify_1.getDefaultSimplifyOptions)(),
        },
        lods: {
            enable: false,
            hasBuiltinLOD: false,
            options: [],
        },
    };
    // TODO 由于目前资源界面编辑的部分默认值是自行编写的，很容易出现此类默认值有缺失的情况，补齐即可
    asset.meta.userData = lodash.defaultsDeep(asset.meta.userData, defaultMeta);
}
async function importSubAssets(asset, importVersion) {
    // Create the converter
    reader_manager_1.glTfReaderManager.delete(asset);
    const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset, importVersion, true);
    await adjustMeta(asset, gltfConverter);
    const userData = asset.userData;
    const gltfAssetFinder = new asset_finder_1.DefaultGltfAssetFinder(userData.assetFinder);
    // 导入 glTF 网格。
    const meshUUIDs = await importMeshes(asset, gltfConverter);
    gltfAssetFinder.set('meshes', meshUUIDs);
    // 保存所有原始动画（未分割）
    await saveOriginalAnimations(asset, gltfConverter, true);
    // 导入 glTF 动画。
    const { animationImportSettings } = userData;
    if (animationImportSettings) {
        for (const animationSetting of animationImportSettings) {
            for (const split of animationSetting.splits) {
                const { previousId, name, from, to, fps, ...remain } = split;
                const subAsset = await asset.createSubAsset(`${name}.animation`, 'gltf-animation', {
                    id: previousId,
                });
                split.previousId = subAsset._id;
                const subAssetUserData = subAsset.userData;
                subAssetUserData.gltfIndex = animationImportSettings.indexOf(animationSetting);
                Object.assign(subAssetUserData, remain);
                subAssetUserData.sample = fps ?? animationSetting.fps;
                subAssetUserData.span = {
                    from,
                    to,
                };
            }
        }
    }
    // 导入 glTF 皮肤。
    const skinUUIDs = await importSkins(asset, gltfConverter);
    gltfAssetFinder.set('skeletons', skinUUIDs);
    // 导入 glTF 图像。
    await importImages(asset, gltfConverter);
    // 导入 glTF 贴图。
    const textureUUIDs = await importTextures(asset, gltfConverter);
    gltfAssetFinder.set('textures', textureUUIDs);
    // 导入 glTF 材质。
    const materialUUIDs = await importMaterials(asset, gltfConverter, gltfAssetFinder);
    gltfAssetFinder.set('materials', materialUUIDs);
    // 导入 glTF 场景。
    const sceneUUIDs = await importScenes(asset, gltfConverter);
    gltfAssetFinder.set('scenes', sceneUUIDs);
    // 第一次导入，设置是否 fbx 自带 lod，是否开启
    if (sceneUUIDs.length && (!userData.lods || !userData.lods.options || !userData.lods.options.length)) {
        const assetMeta = query_1.default.queryAssetMeta(sceneUUIDs[gltfConverter.gltf.scene || 0]);
        if (assetMeta) {
            // 获取节点信息
            const sceneNode = gltfConverter.createScene(assetMeta.userData.gltfIndex || 0, gltfAssetFinder);
            const builtinLODsOption = await loadLODs(userData, sceneNode, gltfConverter);
            const hasLODs = builtinLODsOption.length > 0;
            userData.lods = {
                enable: hasLODs,
                hasBuiltinLOD: hasLODs,
                options: hasLODs ? builtinLODsOption : await generateDefaultLODsOption(),
            };
        }
    }
    if (userData.dumpMaterials && !materialUUIDs.every((uuid) => uuid !== null)) {
        console.debug('Waiting for dependency materials...');
        return false;
    }
    // 保存 AssetFinder。
    userData.assetFinder = gltfAssetFinder.serialize();
    return true;
}
async function adjustMeta(asset, glTFConverter) {
    const meta = asset.userData;
    const glTFImages = glTFConverter.gltf.images;
    if (!glTFImages) {
        meta.imageMetas = [];
    }
    else {
        const oldImageMetas = meta.imageMetas;
        const imageMetas = glTFImages.map((glTFImage, index) => {
            const imageMeta = {};
            if (glTFImage.name) {
                // If the image has name, we find old remap according the name.
                imageMeta.name = glTFImage.name;
                if (oldImageMetas) {
                    const oldImageMeta = oldImageMetas.find((remap) => remap.remap && remap.name && remap.name === imageMeta.name);
                    if (oldImageMeta) {
                        imageMeta.remap = oldImageMeta.remap;
                    }
                }
            }
            else if (oldImageMetas &&
                glTFImages.length === oldImageMetas.length &&
                !oldImageMetas[index].name &&
                oldImageMetas[index].remap) {
                // Otherwise, if the remaps count are same, and the corresponding old remap also has no name,
                // we can suppose they are for the same image.
                imageMeta.remap = oldImageMetas[index].remap;
            }
            return imageMeta;
        });
        meta.imageMetas = imageMetas;
    }
    const glTFAnimations = glTFConverter.gltf.animations;
    if (!glTFAnimations) {
        delete meta.animationImportSettings;
    }
    else {
        // 尝试从旧的动画设置中读取数据。
        const oldAnimationImportSettings = meta.animationImportSettings || [];
        const splitNames = makeUniqueSubAssetNames(asset.basename, glTFAnimations, 'animations', '');
        const newAnimationImportSettings = glTFAnimations.map((gltfAnimation, animationIndex) => {
            const duration = glTFConverter.getAnimationDuration(animationIndex);
            const splitName = gltfAnimation.name || splitNames[animationIndex];
            let defaultSplitName = splitName;
            if (glTFAnimations.length === 1) {
                const baseNameNoExt = path.basename(asset.basename, path.extname(asset.basename));
                const parts = baseNameNoExt.split('@');
                if (parts.length > 1) {
                    defaultSplitName = parts[parts.length - 1];
                }
            }
            const animationSetting = {
                name: splitName,
                duration,
                fps: 30,
                splits: [
                    {
                        name: defaultSplitName,
                        from: 0,
                        to: duration,
                        wrapMode: cc_1.AnimationClip.WrapMode.Loop,
                    },
                ],
            };
            let oldAnimationSetting = oldAnimationImportSettings.find((oldImportSetting) => oldImportSetting.name === animationSetting.name);
            if (!oldAnimationSetting && oldAnimationImportSettings.length === gltfAnimation.length) {
                oldAnimationSetting = oldAnimationImportSettings[animationIndex];
            }
            if (oldAnimationSetting) {
                animationSetting.fps = oldAnimationSetting.fps;
                const tryAdjust = (oldTime) => {
                    if (oldTime === oldAnimationSetting.duration) {
                        // A little opt.
                        return duration;
                    }
                    else {
                        // It should not exceed the new duration.
                        return Math.min(oldTime, duration);
                    }
                };
                animationSetting.splits = oldAnimationSetting.splits.map((split) => {
                    // We are trying to adjust the previous split
                    // to ensure the split range always falling in new range [0, duration].
                    return {
                        ...split,
                        from: tryAdjust(split.from),
                        to: tryAdjust(split.to),
                        wrapMode: split.wrapMode ?? cc_1.AnimationClip.WrapMode.Loop,
                    };
                });
            }
            return animationSetting;
        });
        meta.animationImportSettings = newAnimationImportSettings;
    }
}
async function importMeshes(asset, glTFConverter) {
    const glTFMeshes = glTFConverter.gltf.meshes;
    if (glTFMeshes === undefined) {
        return [];
    }
    const assetNames = makeUniqueSubAssetNames(asset.basename, glTFMeshes, 'meshes', '.mesh');
    const meshArray = [];
    for (let index = 0; index < glTFMeshes.length; index++) {
        const glTFMesh = glTFMeshes[index];
        const subAsset = await asset.createSubAsset(assetNames[index], 'gltf-mesh');
        subAsset.userData.gltfIndex = index;
        meshArray.push(subAsset.uuid);
    }
    // 添加新的 mesh 子资源
    const userData = asset.userData;
    if (userData.lods && !userData.lods.hasBuiltinLOD && userData.lods.enable) {
        for (let index = 0; index < assetNames.length; index++) {
            const lodsOption = userData.lods.options;
            // LOD0 不需要生成处理
            for (let keyIndex = 1; keyIndex < lodsOption.length; keyIndex++) {
                // 新 mesh 子资源名称
                const newSubAssetName = assetNames[index].split('.mesh')[0] + `LOD${keyIndex}.mesh`;
                const newSubAsset = await asset.createSubAsset(newSubAssetName, 'gltf-mesh');
                // 记录一些新 mesh 子资源数据
                newSubAsset.userData.gltfIndex = index;
                newSubAsset.userData.lodLevel = keyIndex;
                newSubAsset.userData.lodOptions = {
                    faceCount: lodsOption[keyIndex].faceCount,
                };
                meshArray.push(newSubAsset.uuid);
            }
        }
    }
    return meshArray;
}
async function importSkins(asset, glTFConverter) {
    const glTFSkins = glTFConverter.gltf.skins;
    if (glTFSkins === undefined) {
        return [];
    }
    const assetNames = makeUniqueSubAssetNames(asset.basename, glTFSkins, 'skeletons', '.skeleton');
    const skinArray = new Array(glTFSkins.length);
    for (let index = 0; index < glTFSkins.length; index++) {
        const glTFSkin = glTFSkins[index];
        const subAsset = await asset.createSubAsset(assetNames[index], 'gltf-skeleton');
        subAsset.userData.gltfIndex = index;
        skinArray[index] = subAsset.uuid;
    }
    return skinArray;
}
async function importImages(asset, glTFConverter) {
    const glTFImages = glTFConverter.gltf.images;
    if (glTFImages === undefined) {
        return;
    }
    const userData = asset.userData;
    const fbxMissingImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const isProducedByFBX2glTF = () => {
        const generator = glTFConverter.gltf.asset.generator;
        return generator?.includes('FBX2glTF');
    };
    const isFBX2glTFSourceMissingImageUri = (uri) => {
        return isProducedByFBX2glTF() && uri === fbxMissingImageUri;
    };
    const isProducedByFbxGlTfConv = () => {
        const generator = glTFConverter.gltf.asset.generator;
        return generator?.includes('FBX-glTF-conv');
    };
    const isFBXGlTfConvMissingImageUri = (uri) => {
        return isProducedByFbxGlTfConv() && uri === fbxMissingImageUri;
    };
    const imageNames = makeUniqueSubAssetNames(asset.basename, glTFImages, 'images', '.image');
    for (let index = 0; index < glTFImages.length; ++index) {
        const glTFImage = glTFImages[index];
        const imageMeta = userData.imageMetas[index];
        const vendorURI = glTFImage.uri;
        let isResolveNeeded = false;
        // If isResolvedNeeded is `true`, the resolve algorithm will take this parameter.
        // There may be `isResolveNeeded && !imagePath`, see below.
        let imagePath;
        // We will not create sub-asset-Handler if:
        // - `uri` field is relative or is file URL, and
        // - the resolved absolute file path, after the image lookup rules applied is inside the project.
        // In such cases, we directly use this location instead of create the image asset.
        if (vendorURI && (isFBX2glTFSourceMissingImageUri(vendorURI) || isFBXGlTfConvMissingImageUri(vendorURI))) {
            // Note, if the glTF is converted from FBX by FBX2glTF
            // and there are missing textures, the FBX2glTF will assign a constant data-uri as uri of image.
            // We capture these cases and try resolve the image according the glTF image asset name
            // using our own algorithm.
            isResolveNeeded = true;
        }
        else if (vendorURI && !vendorURI.startsWith('data:')) {
            // Note: should not be `asset.source`, which may be path to fbx.
            const glTFFilePath = glTFConverter.path;
            const baseURI = url_1.default.pathToFileURL(glTFFilePath).toString();
            try {
                let normalizedURI = new urijs_1.default(vendorURI);
                normalizedURI = normalizedURI.absoluteTo(baseURI);
                (0, uri_utils_1.convertsEncodedSeparatorsInURI)(normalizedURI);
                if (normalizedURI.scheme() === 'file') {
                    imagePath = url_1.default.fileURLToPath(normalizedURI.toString());
                    isResolveNeeded = true;
                }
            }
            catch { }
        }
        let resolved = '';
        if (isResolveNeeded) {
            const resolveJail = asset._assetDB.options.target;
            const resolvedImagePath = await (0, resolve_glTF_image_path_1.resolveGlTfImagePath)(glTFImage.name, imagePath, path.dirname(asset.source), glTFImage.extras, resolveJail);
            if (resolvedImagePath) {
                const dbURL = (0, asset_db_1.queryUrl)(resolvedImagePath);
                if (dbURL) {
                    // In asset database, use it.
                    imageMeta.uri = dbURL;
                }
                else {
                    // This is happened usually when
                    // - 1. Model file contains absolute URL point to an out-of-project location;
                    // - 2. Model file contains relative URL but resolved to an out-of-project location;
                    // - 3. FBX model file and its reference images are converted using FBX2glTF to a temporary path.
                    // This location may be only able accessed by current-user.
                    // 1 & 2 hurts if project are shared by multi-user.
                    const relativeFromTmpDir = (0, path_1.relative)(asset_config_1.default.data.tempRoot, resolvedImagePath);
                    if (!(0, path_1.isAbsolute)(relativeFromTmpDir) && !relativeFromTmpDir.startsWith(`..${path_1.sep}`)) {
                        resolved = resolvedImagePath;
                    }
                    else {
                        console.warn(`In model file ${asset.source},` +
                            `the image ${glTFImage.name} is resolved to ${resolvedImagePath},` +
                            'which is a location out of asset directory.' +
                            'This can cause problem as your project migrated.');
                    }
                }
            }
        }
        if (!imageMeta.uri) {
            const subAsset = await asset.createSubAsset(imageNames[index], 'gltf-embeded-image');
            subAsset.userData.gltfIndex = index;
            imageMeta.uri = subAsset.uuid;
            if (resolved) {
                subAsset.getSwapSpace().resolved = resolved;
            }
            else {
                if (glTFImage.uri === fbxMissingImageUri) {
                    glTFConverter.fbxMissingImagesId.push(index);
                }
            }
        }
    }
}
async function importTextures(asset, glTFConverter) {
    const glTFTextures = glTFConverter.gltf.textures;
    if (glTFTextures === undefined) {
        return [];
    }
    const assetNames = makeUniqueSubAssetNames(asset.basename, glTFTextures, 'textures', '.texture');
    const textureArray = new Array(glTFTextures.length);
    for (let index = 0; index < glTFTextures.length; index++) {
        const glTFTexture = glTFTextures[index];
        const name = assetNames[index];
        const subAsset = await asset.createSubAsset(name, 'texture');
        const defaultTextureUserdata = (0, utils_2.makeDefaultTexture2DAssetUserData)();
        // 这里只是设置一个默认值，如果用户修改过，或者已经生成过数据，我们需要尽量保持存储在用户 meta 里的数据
        glTFConverter.getTextureParameters(glTFTexture, defaultTextureUserdata);
        const textureUserdata = subAsset.userData;
        subAsset.assignUserData(defaultTextureUserdata);
        if (glTFTexture.source !== undefined) {
            const imageMeta = asset.userData.imageMetas[glTFTexture.source];
            const imageURI = imageMeta.remap || imageMeta.uri;
            if (!imageURI) {
                delete textureUserdata.imageUuidOrDatabaseUri;
                delete textureUserdata.isUuid;
            }
            else {
                const isUuid = !imageURI.startsWith('db://');
                textureUserdata.isUuid = isUuid;
                textureUserdata.imageUuidOrDatabaseUri = imageURI;
                if (!isUuid) {
                    const imagePath = (0, asset_db_1.queryPath)(textureUserdata.imageUuidOrDatabaseUri);
                    if (!imagePath) {
                        throw new assert_1.AssertionError({
                            message: `${textureUserdata.imageUuidOrDatabaseUri} is not found in asset-db.`,
                        });
                    }
                    subAsset.depend(imagePath);
                }
            }
        }
        textureArray[index] = subAsset.uuid;
    }
    return textureArray;
}
async function importMaterials(asset, glTFConverter, assetFinder) {
    const glTFMaterials = glTFConverter.gltf.materials;
    if (glTFMaterials === undefined) {
        return [];
    }
    const { dumpMaterials } = asset.userData;
    const assetNames = makeUniqueSubAssetNames(asset.basename, glTFMaterials, 'materials', dumpMaterials ? '.mtl' : '.material');
    const materialArray = new Array(glTFMaterials.length);
    for (let index = 0; index < glTFMaterials.length; index++) {
        // const glTFMaterial = glTFMaterials[index];
        if (dumpMaterials) {
            materialArray[index] = await (0, material_1.dumpMaterial)(asset, assetFinder, glTFConverter, index, assetNames[index]);
        }
        else {
            const subAsset = await asset.createSubAsset(assetNames[index], 'gltf-material');
            subAsset.userData.gltfIndex = index;
            materialArray[index] = subAsset.uuid;
        }
    }
    return materialArray;
}
async function importScenes(asset, glTFConverter) {
    const glTFScenes = glTFConverter.gltf.scenes;
    if (glTFScenes === undefined) {
        return [];
    }
    let id = '';
    if (asset.uuid2recycle) {
        for (const cID in asset.uuid2recycle) {
            const item = asset.uuid2recycle[cID];
            if (item.importer === 'gltf-scene' && 'id' in item) {
                id = cID;
            }
        }
    }
    const assetNames = makeUniqueSubAssetNames(asset.basename, glTFScenes, 'scenes', '.prefab');
    const sceneArray = new Array(glTFScenes.length);
    for (let index = 0; index < glTFScenes.length; index++) {
        const subAsset = await asset.createSubAsset(assetNames[index], 'gltf-scene', {
            id,
        });
        subAsset.userData.gltfIndex = index;
        sceneArray[index] = subAsset.uuid;
    }
    return sceneArray;
}
async function saveOriginalAnimations(asset, glTFConverter, compress) {
    const glTFAnimations = glTFConverter.gltf.animations;
    if (!glTFAnimations) {
        return;
    }
    await Promise.all(glTFAnimations.map(async (_, iAnimation) => {
        const animation = glTFConverter.createAnimation(iAnimation);
        // if (compress) {
        //     compressAnimationClip(animation);
        // }
        const { data, extension } = (0, serialize_library_1.serializeForLibrary)(animation);
        const libraryPath = (0, original_animation_1.getOriginalAnimationLibraryPath)(iAnimation);
        // @ts-expect-error
        await asset.saveToLibrary(libraryPath, data);
        const depends = (0, utils_1.getDependUUIDList)(data);
        asset.setData('depends', depends);
    }));
}
// lod 配置最多层级
const maxLodLevel = 7;
// 默认 lod 层级的
const defaultLODsOptions = {
    screenRatio: 0,
    faceCount: 0,
};
// 递归查询节点下所有 mesh 的减面数
async function deepFindMeshRenderer(node, glTFConverter, lodLevel, generateLightmapUVNode) {
    const meshRenderers = node.getComponents(cc_1.MeshRenderer);
    let meshRendererTriangleCount = 0;
    if (meshRenderers && meshRenderers.length > 0) {
        for (const meshRenderer of meshRenderers) {
            if (meshRenderer.mesh && meshRenderer.mesh.uuid) {
                let meshTriangleCount = 0;
                const meshMeta = query_1.default.queryAssetMeta(meshRenderer.mesh.uuid);
                // 如果 fbx 自身含有 lod，meshMeta 里记录相应的 lod 层级
                meshMeta.userData.lodLevel = lodLevel;
                // 获取 mesh 面数
                const mesh = glTFConverter.createMesh(meshMeta.userData.gltfIndex, generateLightmapUVNode);
                mesh.struct.primitives?.forEach((subMesh) => {
                    if (subMesh && subMesh.indexView) {
                        meshTriangleCount += subMesh.indexView.count;
                    }
                });
                meshRendererTriangleCount += meshTriangleCount / 3;
            }
        }
    }
    if (node.children && node.children.length > 0) {
        for (const childNode of node.children) {
            const childCount = await deepFindMeshRenderer(childNode, glTFConverter, lodLevel, generateLightmapUVNode);
            return meshRendererTriangleCount + childCount;
        }
    }
    return meshRendererTriangleCount;
}
async function loadLODs(gltfUserData, sceneNode, gltfConverter) {
    const LODsOptionArr = [];
    const triangleCounts = [];
    // 获取模型以 LOD# 结尾的节点，计算 lod 层级节点下的所有 mesh 的减面数总和
    for (const child of sceneNode.children) {
        const lodArr = /LOD(\d+)$/i.exec(child.name);
        if (lodArr && lodArr.length > 1) {
            const index = parseInt(lodArr[1], 10);
            // 只取 7 层
            if (index <= maxLodLevel) {
                LODsOptionArr[index] = LODsOptionArr[index] || Object.assign({}, defaultLODsOptions);
                triangleCounts[index] =
                    (triangleCounts[index] || 0) +
                        (await deepFindMeshRenderer(child, gltfConverter, index, gltfUserData.generateLightmapUVNode));
            }
        }
    }
    if (LODsOptionArr.length > 0) {
        const maxLod = Math.max(...Object.keys(LODsOptionArr).map((key) => +key));
        // 屏占比从 0.25 逐级减半
        let screenRatio = 0.25;
        for (let index = 0; index < maxLod; index++) {
            // 填充 LOD 层级，maxLod 层级肯定存在
            if (!LODsOptionArr[index]) {
                console.debug(`No mesh name are ending with LOD${index}`);
                LODsOptionArr[index] = Object.assign({}, defaultLODsOptions);
            }
            // 计算 screenRatio faceCount
            LODsOptionArr[index].screenRatio = screenRatio;
            screenRatio /= 2;
            // 每个层级 triangle 和 LOD0 的比值
            if (triangleCounts[0] !== 0) {
                LODsOptionArr[index].faceCount = triangleCounts[index] / triangleCounts[0];
            }
        }
        // screenRatio 最后一层小于 1%，以计算结果为准。如果大于1，则用 1% 作为最后一个层级的屏占比
        LODsOptionArr[maxLod].screenRatio = screenRatio < 0.01 ? screenRatio : 0.01;
        LODsOptionArr[maxLod].faceCount = triangleCounts[0] ? triangleCounts[maxLod] / triangleCounts[0] : 0;
    }
    return LODsOptionArr;
}
async function generateDefaultLODsOption() {
    const LODsOptionArr = [];
    // 生成默认 screenRatio faceCount
    const defaultScreenRatioArr = [0.25, 0.125, 0.01], defaultFaceCountArr = [1, 0.25, 0.1];
    for (let index = 0; index < 3; index++) {
        LODsOptionArr[index] = {
            screenRatio: defaultScreenRatioArr[index],
            faceCount: defaultFaceCountArr[index],
        };
    }
    return LODsOptionArr;
}
/**
 * 为glTF子资源数组中的所有子资源生成在子资源数组中独一无二的名字，这个名字可用作EditorAsset的名称以及文件系统上的文件名。
 * @param gltfFileBaseName glTF文件名，不含扩展名部分。
 * @param assetsArray glTF子资源数组。
 * @param extension 附加的扩展名。该扩展名将作为后缀附加到结果名字上。
 * @param options.preferedFileBaseName 尽可能地使用glTF文件本身的名字而不是glTF子资源本身的名称来生成结果。
 */
function makeUniqueSubAssetNames(gltfFileBaseName, assetsArray, finderKind, extension) {
    const getBaseNameIfNoName = () => {
        switch (finderKind) {
            case 'animations':
                return 'UnnamedAnimation';
            case 'images':
                return 'UnnamedImage';
            case 'meshes':
                return 'UnnamedMesh';
            case 'materials':
                return 'UnnamedMaterial';
            case 'skeletons':
                return 'UnnamedSkeleton';
            case 'textures':
                return 'UnnamedTexture';
            default:
                return 'Unnamed';
        }
    };
    let names = assetsArray.map((asset) => {
        let unchecked;
        if (finderKind === 'scenes') {
            unchecked = gltfFileBaseName;
        }
        else if (typeof asset.name === 'string') {
            unchecked = asset.name;
        }
        else {
            unchecked = getBaseNameIfNoName();
        }
        return unchecked;
    });
    if (!isDifferWithEachOther(names)) {
        let tail = '-';
        while (true) {
            if (names.every((name) => !name.endsWith(tail))) {
                break;
            }
            tail += '-';
        }
        names = names.map((name, index) => name + `${tail}${index}`);
    }
    return names.map((name) => name + extension);
}
function isDifferWithEachOther(values) {
    if (values.length >= 2) {
        const sorted = values.slice().sort();
        for (let i = 0; i < sorted.length - 1; ++i) {
            if (sorted[i] === sorted[i + 1]) {
                return false;
            }
        }
    }
    return true;
}
async function migrateImageLocations(asset) {
    const oldMeta = asset.meta.userData;
    const imageMetas = [];
    if (oldMeta.imageLocations) {
        const { imageLocations } = oldMeta;
        for (const imageName of Object.keys(imageLocations)) {
            const imageLocation = imageLocations[imageName];
            if (imageLocation.targetDatabaseUrl) {
                imageMetas.push({
                    name: imageName,
                    remap: imageLocation.targetDatabaseUrl,
                });
            }
        }
        delete oldMeta.imageLocations;
    }
    asset.meta.userData.imageMetas = imageMetas;
    if (oldMeta.assetFinder && oldMeta.assetFinder.images) {
        delete oldMeta.assetFinder.images;
    }
}
async function migrateImageRemap(asset) {
    const oldMeta = asset.meta.userData;
    if (!oldMeta.imageMetas) {
        return;
    }
    for (const imageMeta of oldMeta.imageMetas) {
        const { remap } = imageMeta;
        if (!remap) {
            continue;
        }
        const uuid = (0, asset_db_1.queryUUID)(remap);
        if (!uuid) {
            continue;
        }
        else {
            imageMeta.remap = uuid;
        }
    }
}
/**
 * 如果使用了 dumpMaterial，并且生成目录带有 FBX
 * 就需要改名，并重新导入新的 material
 * @param asset gltf 资源
 */
async function migrateDumpMaterial(asset) {
    if (!asset.userData.dumpMaterials || asset.userData.materialDumpDir) {
        return;
    }
    const old = path.join(asset.source, `../Materials${asset.basename}.FBX`);
    const oldMeta = path.join(asset.source, `../Materials${asset.basename}.FBX.meta`);
    const current = path.join(asset.source, `../Materials${asset.basename}`);
    const currentMeta = path.join(asset.source, `../Materials${asset.basename}.meta`);
    if (fs.existsSync(old) && !fs.existsSync(current)) {
        fs.renameSync(old, current);
        if (fs.existsSync(oldMeta)) {
            fs.renameSync(oldMeta, currentMeta);
        }
        asset._assetDB.refresh(current);
    }
}
/**
 * 从 FBX 导入器 2.0 开始，新增了 `legacyFbxHandler` 字段用来确定是
 * 使用旧的 `FBX2glTF` 还是 `FBX-glTF-conv`。
 * 当低于 2.0 版本的资源迁移上来时，默认使用旧版本的。
 * 但是所有新资源的创建将使用新版本的。
 */
async function migrateFbxConverterSelector(asset) {
    if (asset.extname !== '.fbx') {
        return;
    }
    asset.userData.legacyFbxImporter = true;
}
/**
 * FBX 导入器 v1.0.0-alpha.12 开始引入了 `--unit-conversion` 选项，并且默认使用了 `geometry-level`，
 * 而之前使用的是 `hierarchy-level`。
 *
 * @param asset
 */
async function migrateFbxConverterUnitConversion(asset) {
    if (asset.extname !== '.fbx') {
        return;
    }
    const userData = asset.userData;
    if (userData.legacyFbxImporter) {
        return;
    }
    // @ts-ignore
    (userData.fbx ??= {}).unitConversion = 'hierarchy-level';
}
/**
 * FBX 导入器 v1.0.0-alpha.27 开始引入了 `--prefer-local-time-span` 选项，并且默认使用了 `true`，
 * 而之前使用的是 `false`。
 *
 * @param asset
 */
async function migrateFbxConverterPreferLocalTimeSpan(asset) {
    if (asset.extname !== '.fbx') {
        return;
    }
    const userData = asset.userData;
    if (userData.legacyFbxImporter) {
        return;
    }
    // @ts-ignore
    (userData.fbx ??= {}).preferLocalTimeSpan = false;
}
/**
 * FBX 导入器 3.5.1 引入了 `smartMaterialEnabled` 属性,这个属性在旧版本的资源中是默认关闭的.
 *
 * @param asset
 */
async function migrateSmartMaterialEnabled(asset) {
    if (asset.extname !== '.fbx') {
        return;
    }
    const userData = asset.userData;
    (userData.fbx ??= {}).smartMaterialEnabled = false;
}
/**
 * 在 3.6.x，glTF 也需要增加 `promoteSingleRootNode` 选项。所以我们把之前专属于 FBX 的直接迁移过来。
 * 见：https://github.com/cocos/cocos-engine/issues/11858
 */
async function migrateFBXPromoteSingleRootNode(asset) {
    if (asset.extname !== '.fbx') {
        return;
    }
    // 迁移前的 UserData 数据格式
    const userData = asset.userData;
    if (userData.fbx?.promoteSingleRootNode) {
        userData.promoteSingleRootNode = userData.fbx.promoteSingleRootNode;
        delete userData.fbx.promoteSingleRootNode;
    }
}
/**
 * 3.7.0 引入了新的减面算法，选项与之前完全不同，需要对字段存储做调整
 * @param asset
 */
function migrateMeshOptimizerOption(asset) {
    const userData = asset.userData;
    // 使用过原来的减面算法，先保存数据，再移除旧数据
    if (!userData.meshOptimizer) {
        return;
    }
    userData.meshOptimizer = {
        algorithm: 'gltfpack',
        enable: true,
        // @ts-ignore
        gltfpackOptions: userData.meshOptimizerOptions || {},
    };
    // 直接移除旧数据
    // @ts-ignore
    delete userData.meshOptimizerOptions;
}
function migrateFbxMatchMeshNames(asset) {
    if (asset.extname !== '.fbx') {
        return;
    }
    const userData = asset.userData;
    (userData.fbx ??= {}).matchMeshNames = false;
}
/**
 * 3.8.1 引入了新的减面选项，需要对字段存储做调整
 */
function migrateMeshSimplifyOption(asset) {
    const userData = asset.userData;
    // 使用过原来的减面算法，先保存数据，再移除旧数据
    if (!userData.meshOptimizer) {
        return;
    }
    const optimizer = userData.meshOptimizer;
    const options = optimizer.simplifyOptions;
    userData.meshSimplify = {
        enable: optimizer.enable,
        targetRatio: options?.targetRatio || 1,
    };
    delete userData.meshOptimizer;
}
