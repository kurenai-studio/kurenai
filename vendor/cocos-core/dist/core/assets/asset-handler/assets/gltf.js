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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x0Zi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9nbHRmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdqQ0EsZ0VBZUM7QUFFRCw0REFNQztBQUtELDhEQWdCQztBQXBtQ0QsOENBQXdFO0FBQ3hFLG1DQUF3QztBQUN4Qyw2Q0FBK0I7QUFDL0IsMkNBQTZCO0FBQzdCLGtEQUF3QjtBQUN4Qiw4Q0FBc0I7QUFFdEIsc0RBQTJFO0FBQzNFLDhDQUErQztBQUMvQywwREFBMEQ7QUFTMUQsc0RBQW1GO0FBQ25GLGlEQUFtRTtBQUNuRSwyQkFBdUQ7QUFFdkQsNkVBQXVFO0FBQ3ZFLGlFQUFnRTtBQUNoRSxrRUFBNEU7QUFDNUUsK0JBQWlEO0FBRWpELG9DQUE2QztBQUM3QyxzREFBZ0U7QUFHaEUseUNBQWtFO0FBRWxFLGdFQUE2QztBQUM3QyxzRUFBNkM7QUFHN0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDLHdCQUF3QjtBQUN4Qix5QkFBeUI7QUFDekIsTUFBTTtBQUNOLHVHQUF1RztBQUN2Ryw4Q0FBOEM7QUFDOUMsNkNBQTZDO0FBRWhDLFFBQUEsV0FBVyxHQUFxQjtJQUN6QyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLE1BQU07SUFFWixvQkFBb0IsRUFBRTtRQUNsQixhQUFhLEVBQUU7WUFDWCxLQUFLLEVBQUUsd0RBQXdEO1lBQy9ELFdBQVcsRUFBRSx5REFBeUQ7WUFDdEUsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztTQUNqQjtRQUNELDBCQUEwQixFQUFFO1lBQ3hCLEtBQUssRUFBRSxxRUFBcUU7WUFDNUUsV0FBVyxFQUFFLCtFQUErRTtZQUM1RixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1NB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QVU7UUFDckIsTUFBTSxFQUFFLElBQUk7UUFDWixhQUFhO1FBQ2IsZUFBZSxFQUFFLFFBQVEsQ0FBQyxvQkFBb0IsSUFBSSxFQUFFO0tBQ3ZELENBQUM7SUFDRixVQUFVO0lBQ1YsYUFBYTtJQUNiLE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDO0FBQ3pDLENBQUM7QUFFRCxTQUFnQix3QkFBd0IsQ0FBQyxLQUFZO0lBQ2pELElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxNQUFNLEVBQUUsQ0FBQztRQUMzQixPQUFPO0lBQ1gsQ0FBQztJQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUF3QixDQUFDO0lBQ2hELENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQ2pELENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLHlCQUF5QixDQUFDLEtBQVk7SUFDbEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQXdCLENBQUM7SUFDaEQsMEJBQTBCO0lBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDMUIsT0FBTztJQUNYLENBQUM7SUFFRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO0lBQ3pDLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUM7SUFFMUMsUUFBUSxDQUFDLFlBQVksR0FBRztRQUNwQixNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU07UUFDeEIsV0FBVyxFQUFFLE9BQU8sRUFBRSxXQUFXLElBQUksQ0FBQztLQUN6QyxDQUFDO0lBRUYsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldCwgcXVlcnlQYXRoLCBxdWVyeVVybCwgcXVlcnlVVUlEIH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSAnYXNzZXJ0JztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgVVJJIGZyb20gJ3VyaWpzJztcbmltcG9ydCBVUkwgZnJvbSAndXJsJztcbmltcG9ydCB7IEFuaW1hdGlvbiwgTWF0ZXJpYWwsIE1lc2gsIFNraW4gfSBmcm9tICcuLi8uLi9AdHlwZXMvZ2xURic7XG5pbXBvcnQgeyBEZWZhdWx0R2x0ZkFzc2V0RmluZGVyLCBNeUZpbmRlcktpbmQgfSBmcm9tICcuL2dsdGYvYXNzZXQtZmluZGVyJztcbmltcG9ydCB7IGR1bXBNYXRlcmlhbCB9IGZyb20gJy4vZ2x0Zi9tYXRlcmlhbCc7XG5pbXBvcnQgeyBnbFRmUmVhZGVyTWFuYWdlciB9IGZyb20gJy4vZ2x0Zi9yZWFkZXItbWFuYWdlcic7XG5pbXBvcnQgeyBHbHRmQ29udmVydGVyLCBHbHRmU3ViQXNzZXQgfSBmcm9tICcuL3V0aWxzL2dsdGYtY29udmVydGVyJztcblxuaW1wb3J0IHtcbiAgICBBbmltYXRpb25JbXBvcnRTZXR0aW5nLFxuICAgIEdsVEZVc2VyRGF0YSxcbiAgICBJbWFnZU1ldGEsXG4gICAgTE9Ec09wdGlvbixcbn0gZnJvbSAnLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5pbXBvcnQgeyBOb3JtYWxJbXBvcnRTZXR0aW5nLCBUYW5nZW50SW1wb3J0U2V0dGluZyB9IGZyb20gJy4uLy4uL0B0eXBlcy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgY29udmVydHNFbmNvZGVkU2VwYXJhdG9yc0luVVJJIH0gZnJvbSAnLi91dGlscy91cmktdXRpbHMnO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ2xpcCwgTWVzaFJlbmRlcmVyLCBOb2RlIH0gZnJvbSAnY2MnO1xuXG5pbXBvcnQgeyByZXNvbHZlR2xUZkltYWdlUGF0aCB9IGZyb20gJy4vdXRpbHMvcmVzb2x2ZS1nbFRGLWltYWdlLXBhdGgnO1xuaW1wb3J0IHsgc2VyaWFsaXplRm9yTGlicmFyeSB9IGZyb20gJy4vdXRpbHMvc2VyaWFsaXplLWxpYnJhcnknO1xuaW1wb3J0IHsgZ2V0T3JpZ2luYWxBbmltYXRpb25MaWJyYXJ5UGF0aCB9IGZyb20gJy4vZ2x0Zi9vcmlnaW5hbC1hbmltYXRpb24nO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSwgcmVsYXRpdmUsIHNlcCB9IGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IGdldERlZmF1bHRTaW1wbGlmeU9wdGlvbnMgfSBmcm9tICcuL2dsdGYvbWVzaFNpbXBsaWZ5JztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciwgQXNzZXRIYW5kbGVyQmFzZSB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgZm9yayB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgbWFrZURlZmF1bHRUZXh0dXJlMkRBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi9pbWFnZS91dGlscyc7XG5pbXBvcnQgeyBUZXh0dXJlMkRBc3NldFVzZXJEYXRhLCBHbHRmQW5pbWF0aW9uQXNzZXRVc2VyRGF0YSB9IGZyb20gJy4uLy4uL0B0eXBlcy91c2VyRGF0YXMnO1xuaW1wb3J0IGFzc2V0UXVlcnkgZnJvbSAnLi4vLi4vbWFuYWdlci9xdWVyeSc7XG5pbXBvcnQgYXNzZXRDb25maWcgZnJvbSAnLi4vLi4vYXNzZXQtY29uZmlnJztcbmltcG9ydCB7IEdsb2JhbFBhdGhzIH0gZnJvbSAnLi4vLi4vLi4vLi4vZ2xvYmFsJztcblxuY29uc3QgbG9kYXNoID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbi8vIGNvbnN0IGFqdiA9IG5ldyBBanYoe1xuLy8gICAgIGVycm9yRGF0YVBhdGg6ICcnLFxuLy8gfSk7XG4vLyBjb25zdCBzY2hlbWFGaWxlID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJywgJ2Rpc3QnLCAnbWV0YS1zY2hlbWFzJywgJ2dsVEYubWV0YS5qc29uJyk7XG4vLyBjb25zdCBzY2hlbWEgPSBmcy5yZWFkSlNPTlN5bmMoc2NoZW1hRmlsZSk7XG4vLyBjb25zdCBtZXRhVmFsaWRhdG9yID0gYWp2LmNvbXBpbGUoc2NoZW1hKTtcblxuZXhwb3J0IGNvbnN0IEdsdGZIYW5kbGVyOiBBc3NldEhhbmRsZXJCYXNlID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2dsdGYnLFxuXG4gICAgcHJvcGVydHlTY2hlbWFDb25maWc6IHtcbiAgICAgICAgZHVtcE1hdGVyaWFsczoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5kdW1wTWF0ZXJpYWxzLm5hbWUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5kdW1wTWF0ZXJpYWxzLnRpdGxlJyxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBtb3VudEFsbEFuaW1hdGlvbnNPblByZWZhYjoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5tb3VudEFsbEFuaW1hdGlvbnNPblByZWZhYi5uYW1lJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZ2x0Zi5tb3VudF9hbGxfYW5pbWF0aW9uc19vbl9wcmVmYWJfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIGFsbG93TWVzaERhdGFBY2Nlc3M6IHtcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5hbGxvd01lc2hEYXRhQWNjZXNzLm5hbWUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LmFsbG93TWVzaERhdGFBY2Nlc3MudGl0bGUnLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRkVmVydGV4Q29sb3I6IHtcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5hZGRWZXJ0ZXhDb2xvci5uYW1lJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5hZGRWZXJ0ZXhDb2xvci50aXRsZScsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgcHJvbW90ZVNpbmdsZVJvb3ROb2RlOiB7XG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5mYngucHJvbW90ZVNpbmdsZVJvb3ROb2RlLm5hbWUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LnByb21vdGVTaW5nbGVSb290Tm9kZS50aXRsZScsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVMaWdodG1hcFVWTm9kZToge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LmdlbmVyYXRlTGlnaHRtYXBVVk5vZGUubmFtZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguZ2VuZXJhdGVMaWdodG1hcFVWTm9kZS50aXRsZScsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgbm9ybWFsczoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5ub3JtYWxzLm5hbWUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5ub3JtYWxzLnRpdGxlJyxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgZGVmYXVsdDogTm9ybWFsSW1wb3J0U2V0dGluZy5yZXF1aXJlLFxuICAgICAgICAgICAgZW51bTogW1xuICAgICAgICAgICAgICAgIE5vcm1hbEltcG9ydFNldHRpbmcub3B0aW9uYWwsXG4gICAgICAgICAgICAgICAgTm9ybWFsSW1wb3J0U2V0dGluZy5leGNsdWRlLFxuICAgICAgICAgICAgICAgIE5vcm1hbEltcG9ydFNldHRpbmcucmVxdWlyZSxcbiAgICAgICAgICAgICAgICBOb3JtYWxJbXBvcnRTZXR0aW5nLnJlY2FsY3VsYXRlLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGVudW1EZXNjcmlwdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5HbFRGVXNlckRhdGEubm9ybWFscy5vcHRpb25hbC5uYW1lJyxcbiAgICAgICAgICAgICAgICAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5HbFRGVXNlckRhdGEubm9ybWFscy5leGNsdWRlLm5hbWUnLFxuICAgICAgICAgICAgICAgICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5ub3JtYWxzLnJlcXVpcmUubmFtZScsXG4gICAgICAgICAgICAgICAgJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguR2xURlVzZXJEYXRhLm5vcm1hbHMucmVjYWxjdWxhdGUubmFtZScsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB0YW5nZW50czoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS50YW5nZW50cy5uYW1lJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5HbFRGVXNlckRhdGEudGFuZ2VudHMudGl0bGUnLFxuICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICBkZWZhdWx0OiBUYW5nZW50SW1wb3J0U2V0dGluZy5yZXF1aXJlLFxuICAgICAgICAgICAgZW51bTogW1xuICAgICAgICAgICAgICAgIFRhbmdlbnRJbXBvcnRTZXR0aW5nLmV4Y2x1ZGUsXG4gICAgICAgICAgICAgICAgVGFuZ2VudEltcG9ydFNldHRpbmcub3B0aW9uYWwsXG4gICAgICAgICAgICAgICAgVGFuZ2VudEltcG9ydFNldHRpbmcucmVxdWlyZSxcbiAgICAgICAgICAgICAgICBUYW5nZW50SW1wb3J0U2V0dGluZy5yZWNhbGN1bGF0ZSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBlbnVtRGVzY3JpcHRpb25zOiBbXG4gICAgICAgICAgICAgICAgJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguR2xURlVzZXJEYXRhLnRhbmdlbnRzLmV4Y2x1ZGUubmFtZScsXG4gICAgICAgICAgICAgICAgJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguR2xURlVzZXJEYXRhLnRhbmdlbnRzLm9wdGlvbmFsLm5hbWUnLFxuICAgICAgICAgICAgICAgICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS50YW5nZW50cy5yZXF1aXJlLm5hbWUnLFxuICAgICAgICAgICAgICAgICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS50YW5nZW50cy5yZWNhbGN1bGF0ZS5uYW1lJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIG1vcnBoTm9ybWFsczoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5tb3JwaE5vcm1hbHMubmFtZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguR2xURlVzZXJEYXRhLm1vcnBoTm9ybWFscy50aXRsZScsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IE5vcm1hbEltcG9ydFNldHRpbmcuZXhjbHVkZSxcbiAgICAgICAgICAgIGVudW06IFtcbiAgICAgICAgICAgICAgICBOb3JtYWxJbXBvcnRTZXR0aW5nLmV4Y2x1ZGUsXG4gICAgICAgICAgICAgICAgTm9ybWFsSW1wb3J0U2V0dGluZy5vcHRpb25hbCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBlbnVtRGVzY3JpcHRpb25zOiBbXG4gICAgICAgICAgICAgICAgJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguR2xURlVzZXJEYXRhLm1vcnBoTm9ybWFscy5leGNsdWRlLm5hbWUnLFxuICAgICAgICAgICAgICAgICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LkdsVEZVc2VyRGF0YS5tb3JwaE5vcm1hbHMub3B0aW9uYWwubmFtZScsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBtZXNoT3B0aW1pemVyOiB7XG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYubWVzaF9vcHRpbWl6ZXInLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5nbHRmLm1lc2hfb3B0aW1pemVyX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYWxnb3JpdGhtOiAnc2ltcGxpZnknLFxuICAgICAgICAgICAgICAgIHNpbXBsaWZ5T3B0aW9uczogZ2V0RGVmYXVsdFNpbXBsaWZ5T3B0aW9ucygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5nbHRmLm1lc2hfb3B0aW1pemVyX2VuYWJsZScsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZ2x0Zi5tZXNoX29wdGltaXplcl9lbmFibGVfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWxnb3JpdGhtOiB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZ2x0Zi5tZXNoX29wdGltaXplcl9hbGdvcml0aG0nLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYubWVzaF9vcHRpbWl6ZXJfYWxnb3JpdGhtX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdzaW1wbGlmeScsXG4gICAgICAgICAgICAgICAgICAgIGVudW06IFsnc2ltcGxpZnknLCAnZ2x0ZnBhY2snXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bURlc2NyaXB0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYubWVzaF9vcHRpbWl6ZXJfc2ltcGxpZnknLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYubWVzaF9vcHRpbWl6ZXJfZ2x0ZnBhY2snLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2ltcGxpZnlPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZ2x0Zi5zaW1wbGlmeV9vcHRpb25zJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5nbHRmLnNpbXBsaWZ5X29wdGlvbnNfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZ2V0RGVmYXVsdFNpbXBsaWZ5T3B0aW9ucygpLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRSYXRpbzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5tZXNoU2ltcGxpZnkudGFyZ2V0UmF0aW8ubmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5nbHRmLnRhcmdldF9yYXRpb19kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW06IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogMC4wMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVTbWFydExpbms6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYuZW5hYmxlX3NtYXJ0X2xpbmsnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZ2x0Zi5lbmFibGVfc21hcnRfbGlua19kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWdyZXNzaXZlbmVzczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZ2x0Zi5hZ3Jlc3NpdmVuZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYuYWdyZXNzaXZlbmVzc19kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogNyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4SXRlcmF0aW9uQ291bnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmdsdGYubWF4X2l0ZXJhdGlvbl9jb3VudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5nbHRmLm1heF9pdGVyYXRpb25fY291bnRfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzIuMy4xNCcsXG4gICAgICAgIHZlcnNpb25Db2RlOiAzLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahCBib29sZWFuXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImeS4i+asoeWQr+WKqOi/mOS8mumHjeaWsOWvvOWFpVxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGF3YWl0IHZhbGlkYXRlTWV0YShhc3NldCk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgaW1wb3J0U3ViQXNzZXRzKGFzc2V0LCB0aGlzLnZlcnNpb24pO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyBhZnRlclN1YkFzc2V0c0ltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGF3YWl0IGdsVGZSZWFkZXJNYW5hZ2VyLmRlbGV0ZShhc3NldCk7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5leHBvcnQgZGVmYXVsdCBHbHRmSGFuZGxlcjtcblxuYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVNZXRhKGFzc2V0OiBBc3NldCkge1xuICAgIC8vIGFzc2V0Lm1ldGEudXNlckRhdGEuaW1hZ2VNZXRhcyA/Pz0gW107XG4gICAgLy8gY29uc3QgbWV0YVZhbGlkYXRpb24gPSBhd2FpdCBtZXRhVmFsaWRhdG9yKGFzc2V0Lm1ldGEudXNlckRhdGEpO1xuICAgIC8vIGlmICghbWV0YVZhbGlkYXRpb24pIHtcbiAgICAvLyAgICAgaWYgKE9iamVjdC5rZXlzKGFzc2V0Lm1ldGEudXNlckRhdGEpLmxlbmd0aCAhPT0gMCkge1xuICAgIC8vICAgICAgICAgY29uc29sZS5kZWJ1ZyhcbiAgICAvLyAgICAgICAgICAgICAnTWV0YSBmaWxlIG9mIGFzc2V0ICcgK1xuICAgIC8vICAgICAgICAgICAgIGFzc2V0LnNvdXJjZSArXG4gICAgLy8gICAgICAgICAgICAgJyBpcyBkYW1hZ2VkOiBcXG4nICtcbiAgICAvLyAgICAgICAgICAgICAobWV0YVZhbGlkYXRvci5lcnJvcnMgfHwgW10pLm1hcCgoZXJyb3IpID0+IGVycm9yLm1lc3NhZ2UpICtcbiAgICAvLyAgICAgICAgICAgICAnXFxuQSBkZWZhdWx0IG1ldGEgZmlsZSBpcyBwYXRjaGVkLicsXG4gICAgLy8gICAgICAgICApO1xuICAgIC8vICAgICB9XG4gICAgY29uc3QgZGVmYXVsdE1ldGE6IEdsVEZVc2VyRGF0YSA9IHtcbiAgICAgICAgaW1hZ2VNZXRhczogW10sXG4gICAgICAgIGxlZ2FjeUZieEltcG9ydGVyOiBmYWxzZSxcbiAgICAgICAgYWxsb3dNZXNoRGF0YUFjY2VzczogdHJ1ZSxcbiAgICAgICAgYWRkVmVydGV4Q29sb3I6IGZhbHNlLFxuICAgICAgICBnZW5lcmF0ZUxpZ2h0bWFwVVZOb2RlOiBmYWxzZSxcbiAgICAgICAgbWVzaE9wdGltaXplcjoge1xuICAgICAgICAgICAgZW5hYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGFsZ29yaXRobTogJ3NpbXBsaWZ5JyxcbiAgICAgICAgICAgIHNpbXBsaWZ5T3B0aW9uczogZ2V0RGVmYXVsdFNpbXBsaWZ5T3B0aW9ucygpLFxuICAgICAgICB9LFxuICAgICAgICBsb2RzOiB7XG4gICAgICAgICAgICBlbmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgaGFzQnVpbHRpbkxPRDogZmFsc2UsXG4gICAgICAgICAgICBvcHRpb25zOiBbXSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIC8vIFRPRE8g55Sx5LqO55uu5YmN6LWE5rqQ55WM6Z2i57yW6L6R55qE6YOo5YiG6buY6K6k5YC85piv6Ieq6KGM57yW5YaZ55qE77yM5b6I5a655piT5Ye6546w5q2k57G76buY6K6k5YC85pyJ57y65aSx55qE5oOF5Ya177yM6KGl6b2Q5Y2z5Y+vXG4gICAgYXNzZXQubWV0YS51c2VyRGF0YSA9IGxvZGFzaC5kZWZhdWx0c0RlZXAoYXNzZXQubWV0YS51c2VyRGF0YSwgZGVmYXVsdE1ldGEpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRTdWJBc3NldHMoYXNzZXQ6IEFzc2V0LCBpbXBvcnRWZXJzaW9uOiBzdHJpbmcpIHtcbiAgICAvLyBDcmVhdGUgdGhlIGNvbnZlcnRlclxuICAgIGdsVGZSZWFkZXJNYW5hZ2VyLmRlbGV0ZShhc3NldCk7XG4gICAgY29uc3QgZ2x0ZkNvbnZlcnRlciA9IGF3YWl0IGdsVGZSZWFkZXJNYW5hZ2VyLmdldE9yQ3JlYXRlKGFzc2V0LCBpbXBvcnRWZXJzaW9uLCB0cnVlKTtcblxuICAgIGF3YWl0IGFkanVzdE1ldGEoYXNzZXQsIGdsdGZDb252ZXJ0ZXIpO1xuXG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG5cbiAgICBjb25zdCBnbHRmQXNzZXRGaW5kZXIgPSBuZXcgRGVmYXVsdEdsdGZBc3NldEZpbmRlcih1c2VyRGF0YS5hc3NldEZpbmRlcik7XG5cbiAgICAvLyDlr7zlhaUgZ2xURiDnvZHmoLzjgIJcbiAgICBjb25zdCBtZXNoVVVJRHMgPSBhd2FpdCBpbXBvcnRNZXNoZXMoYXNzZXQsIGdsdGZDb252ZXJ0ZXIpO1xuICAgIGdsdGZBc3NldEZpbmRlci5zZXQoJ21lc2hlcycsIG1lc2hVVUlEcyk7XG5cbiAgICAvLyDkv53lrZjmiYDmnInljp/lp4vliqjnlLvvvIjmnKrliIblibLvvIlcbiAgICBhd2FpdCBzYXZlT3JpZ2luYWxBbmltYXRpb25zKGFzc2V0LCBnbHRmQ29udmVydGVyLCB0cnVlKTtcblxuICAgIC8vIOWvvOWFpSBnbFRGIOWKqOeUu+OAglxuICAgIGNvbnN0IHsgYW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MgfSA9IHVzZXJEYXRhO1xuICAgIGlmIChhbmltYXRpb25JbXBvcnRTZXR0aW5ncykge1xuICAgICAgICBmb3IgKGNvbnN0IGFuaW1hdGlvblNldHRpbmcgb2YgYW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc3BsaXQgb2YgYW5pbWF0aW9uU2V0dGluZy5zcGxpdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHByZXZpb3VzSWQsIG5hbWUsIGZyb20sIHRvLCBmcHMsIC4uLnJlbWFpbiB9ID0gc3BsaXQ7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3ViQXNzZXQgPSBhd2FpdCBhc3NldC5jcmVhdGVTdWJBc3NldChgJHtuYW1lfS5hbmltYXRpb25gLCAnZ2x0Zi1hbmltYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBwcmV2aW91c0lkLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNwbGl0LnByZXZpb3VzSWQgPSBzdWJBc3NldC5faWQ7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3ViQXNzZXRVc2VyRGF0YSA9IHN1YkFzc2V0LnVzZXJEYXRhIGFzIEdsdGZBbmltYXRpb25Bc3NldFVzZXJEYXRhO1xuICAgICAgICAgICAgICAgIHN1YkFzc2V0VXNlckRhdGEuZ2x0ZkluZGV4ID0gYW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MuaW5kZXhPZihhbmltYXRpb25TZXR0aW5nKTtcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHN1YkFzc2V0VXNlckRhdGEsIHJlbWFpbik7XG4gICAgICAgICAgICAgICAgc3ViQXNzZXRVc2VyRGF0YS5zYW1wbGUgPSBmcHMgPz8gYW5pbWF0aW9uU2V0dGluZy5mcHM7XG4gICAgICAgICAgICAgICAgc3ViQXNzZXRVc2VyRGF0YS5zcGFuID0ge1xuICAgICAgICAgICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgICAgICAgICB0byxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIGdsVEYg55qu6IKk44CCXG4gICAgY29uc3Qgc2tpblVVSURzID0gYXdhaXQgaW1wb3J0U2tpbnMoYXNzZXQsIGdsdGZDb252ZXJ0ZXIpO1xuICAgIGdsdGZBc3NldEZpbmRlci5zZXQoJ3NrZWxldG9ucycsIHNraW5VVUlEcyk7XG5cbiAgICAvLyDlr7zlhaUgZ2xURiDlm77lg4/jgIJcbiAgICBhd2FpdCBpbXBvcnRJbWFnZXMoYXNzZXQsIGdsdGZDb252ZXJ0ZXIpO1xuXG4gICAgLy8g5a+85YWlIGdsVEYg6LS05Zu+44CCXG4gICAgY29uc3QgdGV4dHVyZVVVSURzID0gYXdhaXQgaW1wb3J0VGV4dHVyZXMoYXNzZXQsIGdsdGZDb252ZXJ0ZXIpO1xuICAgIGdsdGZBc3NldEZpbmRlci5zZXQoJ3RleHR1cmVzJywgdGV4dHVyZVVVSURzKTtcblxuICAgIC8vIOWvvOWFpSBnbFRGIOadkOi0qOOAglxuICAgIGNvbnN0IG1hdGVyaWFsVVVJRHMgPSBhd2FpdCBpbXBvcnRNYXRlcmlhbHMoYXNzZXQsIGdsdGZDb252ZXJ0ZXIsIGdsdGZBc3NldEZpbmRlcik7XG4gICAgZ2x0ZkFzc2V0RmluZGVyLnNldCgnbWF0ZXJpYWxzJywgbWF0ZXJpYWxVVUlEcyk7XG5cbiAgICAvLyDlr7zlhaUgZ2xURiDlnLrmma/jgIJcbiAgICBjb25zdCBzY2VuZVVVSURzID0gYXdhaXQgaW1wb3J0U2NlbmVzKGFzc2V0LCBnbHRmQ29udmVydGVyKTtcbiAgICBnbHRmQXNzZXRGaW5kZXIuc2V0KCdzY2VuZXMnLCBzY2VuZVVVSURzKTtcblxuICAgIC8vIOesrOS4gOasoeWvvOWFpe+8jOiuvue9ruaYr+WQpiBmYngg6Ieq5bimIGxvZO+8jOaYr+WQpuW8gOWQr1xuICAgIGlmIChzY2VuZVVVSURzLmxlbmd0aCAmJiAoIXVzZXJEYXRhLmxvZHMgfHwgIXVzZXJEYXRhLmxvZHMub3B0aW9ucyB8fCAhdXNlckRhdGEubG9kcy5vcHRpb25zLmxlbmd0aCkpIHtcbiAgICAgICAgY29uc3QgYXNzZXRNZXRhID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0TWV0YShzY2VuZVVVSURzW2dsdGZDb252ZXJ0ZXIuZ2x0Zi5zY2VuZSB8fCAwXSk7XG4gICAgICAgIGlmIChhc3NldE1ldGEpIHtcbiAgICAgICAgICAgIC8vIOiOt+WPluiKgueCueS/oeaBr1xuICAgICAgICAgICAgY29uc3Qgc2NlbmVOb2RlID0gZ2x0ZkNvbnZlcnRlci5jcmVhdGVTY2VuZShhc3NldE1ldGEudXNlckRhdGEuZ2x0ZkluZGV4IHx8IDAsIGdsdGZBc3NldEZpbmRlcik7XG4gICAgICAgICAgICBjb25zdCBidWlsdGluTE9Ec09wdGlvbiA9IGF3YWl0IGxvYWRMT0RzKHVzZXJEYXRhLCBzY2VuZU5vZGUsIGdsdGZDb252ZXJ0ZXIpO1xuICAgICAgICAgICAgY29uc3QgaGFzTE9EcyA9IGJ1aWx0aW5MT0RzT3B0aW9uLmxlbmd0aCA+IDA7XG4gICAgICAgICAgICB1c2VyRGF0YS5sb2RzID0ge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogaGFzTE9EcyxcbiAgICAgICAgICAgICAgICBoYXNCdWlsdGluTE9EOiBoYXNMT0RzLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGhhc0xPRHMgPyBidWlsdGluTE9Ec09wdGlvbiA6IGF3YWl0IGdlbmVyYXRlRGVmYXVsdExPRHNPcHRpb24oKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodXNlckRhdGEuZHVtcE1hdGVyaWFscyAmJiAhbWF0ZXJpYWxVVUlEcy5ldmVyeSgodXVpZCkgPT4gdXVpZCAhPT0gbnVsbCkpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnV2FpdGluZyBmb3IgZGVwZW5kZW5jeSBtYXRlcmlhbHMuLi4nKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyDkv53lrZggQXNzZXRGaW5kZXLjgIJcbiAgICB1c2VyRGF0YS5hc3NldEZpbmRlciA9IGdsdGZBc3NldEZpbmRlci5zZXJpYWxpemUoKTtcblxuICAgIHJldHVybiB0cnVlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGp1c3RNZXRhKGFzc2V0OiBBc3NldCwgZ2xURkNvbnZlcnRlcjogR2x0ZkNvbnZlcnRlcikge1xuICAgIGNvbnN0IG1ldGEgPSBhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG5cbiAgICBjb25zdCBnbFRGSW1hZ2VzID0gZ2xURkNvbnZlcnRlci5nbHRmLmltYWdlcztcbiAgICBpZiAoIWdsVEZJbWFnZXMpIHtcbiAgICAgICAgbWV0YS5pbWFnZU1ldGFzID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgb2xkSW1hZ2VNZXRhcyA9IG1ldGEuaW1hZ2VNZXRhcztcbiAgICAgICAgY29uc3QgaW1hZ2VNZXRhcyA9IGdsVEZJbWFnZXMubWFwKChnbFRGSW1hZ2U6IGFueSwgaW5kZXg6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VNZXRhOiBJbWFnZU1ldGEgPSB7fTtcbiAgICAgICAgICAgIGlmIChnbFRGSW1hZ2UubmFtZSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbWFnZSBoYXMgbmFtZSwgd2UgZmluZCBvbGQgcmVtYXAgYWNjb3JkaW5nIHRoZSBuYW1lLlxuICAgICAgICAgICAgICAgIGltYWdlTWV0YS5uYW1lID0gZ2xURkltYWdlLm5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKG9sZEltYWdlTWV0YXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkSW1hZ2VNZXRhID0gb2xkSW1hZ2VNZXRhcy5maW5kKChyZW1hcCkgPT4gcmVtYXAucmVtYXAgJiYgcmVtYXAubmFtZSAmJiByZW1hcC5uYW1lID09PSBpbWFnZU1ldGEubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRJbWFnZU1ldGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlTWV0YS5yZW1hcCA9IG9sZEltYWdlTWV0YS5yZW1hcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgb2xkSW1hZ2VNZXRhcyAmJlxuICAgICAgICAgICAgICAgIGdsVEZJbWFnZXMubGVuZ3RoID09PSBvbGRJbWFnZU1ldGFzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgICFvbGRJbWFnZU1ldGFzW2luZGV4XS5uYW1lICYmXG4gICAgICAgICAgICAgICAgb2xkSW1hZ2VNZXRhc1tpbmRleF0ucmVtYXBcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgaWYgdGhlIHJlbWFwcyBjb3VudCBhcmUgc2FtZSwgYW5kIHRoZSBjb3JyZXNwb25kaW5nIG9sZCByZW1hcCBhbHNvIGhhcyBubyBuYW1lLFxuICAgICAgICAgICAgICAgIC8vIHdlIGNhbiBzdXBwb3NlIHRoZXkgYXJlIGZvciB0aGUgc2FtZSBpbWFnZS5cbiAgICAgICAgICAgICAgICBpbWFnZU1ldGEucmVtYXAgPSBvbGRJbWFnZU1ldGFzW2luZGV4XS5yZW1hcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbWFnZU1ldGE7XG4gICAgICAgIH0pO1xuICAgICAgICBtZXRhLmltYWdlTWV0YXMgPSBpbWFnZU1ldGFzO1xuICAgIH1cblxuICAgIGNvbnN0IGdsVEZBbmltYXRpb25zID0gZ2xURkNvbnZlcnRlci5nbHRmLmFuaW1hdGlvbnM7XG4gICAgaWYgKCFnbFRGQW5pbWF0aW9ucykge1xuICAgICAgICBkZWxldGUgbWV0YS5hbmltYXRpb25JbXBvcnRTZXR0aW5ncztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyDlsJ3or5Xku47ml6fnmoTliqjnlLvorr7nva7kuK3or7vlj5bmlbDmja7jgIJcbiAgICAgICAgY29uc3Qgb2xkQW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MgPSBtZXRhLmFuaW1hdGlvbkltcG9ydFNldHRpbmdzIHx8IFtdO1xuICAgICAgICBjb25zdCBzcGxpdE5hbWVzID0gbWFrZVVuaXF1ZVN1YkFzc2V0TmFtZXMoYXNzZXQuYmFzZW5hbWUsIGdsVEZBbmltYXRpb25zLCAnYW5pbWF0aW9ucycsICcnKTtcbiAgICAgICAgY29uc3QgbmV3QW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MgPSBnbFRGQW5pbWF0aW9ucy5tYXAoKGdsdGZBbmltYXRpb246IGFueSwgYW5pbWF0aW9uSW5kZXg6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHVyYXRpb24gPSBnbFRGQ29udmVydGVyLmdldEFuaW1hdGlvbkR1cmF0aW9uKGFuaW1hdGlvbkluZGV4KTtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0TmFtZSA9IGdsdGZBbmltYXRpb24ubmFtZSB8fCBzcGxpdE5hbWVzW2FuaW1hdGlvbkluZGV4XTtcbiAgICAgICAgICAgIGxldCBkZWZhdWx0U3BsaXROYW1lID0gc3BsaXROYW1lO1xuICAgICAgICAgICAgaWYgKGdsVEZBbmltYXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJhc2VOYW1lTm9FeHQgPSBwYXRoLmJhc2VuYW1lKGFzc2V0LmJhc2VuYW1lLCBwYXRoLmV4dG5hbWUoYXNzZXQuYmFzZW5hbWUpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJ0cyA9IGJhc2VOYW1lTm9FeHQuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0U3BsaXROYW1lID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uU2V0dGluZzogQW5pbWF0aW9uSW1wb3J0U2V0dGluZyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBzcGxpdE5hbWUsXG4gICAgICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgZnBzOiAzMCxcbiAgICAgICAgICAgICAgICBzcGxpdHM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGVmYXVsdFNwbGl0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb206IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICB3cmFwTW9kZTogQW5pbWF0aW9uQ2xpcC5XcmFwTW9kZS5Mb29wLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IG9sZEFuaW1hdGlvblNldHRpbmcgPSBvbGRBbmltYXRpb25JbXBvcnRTZXR0aW5ncy5maW5kKFxuICAgICAgICAgICAgICAgIChvbGRJbXBvcnRTZXR0aW5nKSA9PiBvbGRJbXBvcnRTZXR0aW5nLm5hbWUgPT09IGFuaW1hdGlvblNldHRpbmcubmFtZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoIW9sZEFuaW1hdGlvblNldHRpbmcgJiYgb2xkQW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MubGVuZ3RoID09PSBnbHRmQW5pbWF0aW9uLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG9sZEFuaW1hdGlvblNldHRpbmcgPSBvbGRBbmltYXRpb25JbXBvcnRTZXR0aW5nc1thbmltYXRpb25JbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2xkQW5pbWF0aW9uU2V0dGluZykge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvblNldHRpbmcuZnBzID0gb2xkQW5pbWF0aW9uU2V0dGluZy5mcHM7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJ5QWRqdXN0ID0gKG9sZFRpbWU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkVGltZSA9PT0gb2xkQW5pbWF0aW9uU2V0dGluZyEuZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEgbGl0dGxlIG9wdC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0IHNob3VsZCBub3QgZXhjZWVkIHRoZSBuZXcgZHVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5taW4ob2xkVGltZSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25TZXR0aW5nLnNwbGl0cyA9IG9sZEFuaW1hdGlvblNldHRpbmcuc3BsaXRzLm1hcCgoc3BsaXQpOiBBbmltYXRpb25JbXBvcnRTZXR0aW5nWydzcGxpdHMnXVswXSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGFyZSB0cnlpbmcgdG8gYWRqdXN0IHRoZSBwcmV2aW91cyBzcGxpdFxuICAgICAgICAgICAgICAgICAgICAvLyB0byBlbnN1cmUgdGhlIHNwbGl0IHJhbmdlIGFsd2F5cyBmYWxsaW5nIGluIG5ldyByYW5nZSBbMCwgZHVyYXRpb25dLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3BsaXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiB0cnlBZGp1c3Qoc3BsaXQuZnJvbSksXG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogdHJ5QWRqdXN0KHNwbGl0LnRvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyYXBNb2RlOiBzcGxpdC53cmFwTW9kZSA/PyBBbmltYXRpb25DbGlwLldyYXBNb2RlLkxvb3AsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uU2V0dGluZztcbiAgICAgICAgfSk7XG4gICAgICAgIG1ldGEuYW5pbWF0aW9uSW1wb3J0U2V0dGluZ3MgPSBuZXdBbmltYXRpb25JbXBvcnRTZXR0aW5ncztcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGltcG9ydE1lc2hlcyhhc3NldDogQXNzZXQsIGdsVEZDb252ZXJ0ZXI6IEdsdGZDb252ZXJ0ZXIpIHtcbiAgICBjb25zdCBnbFRGTWVzaGVzID0gZ2xURkNvbnZlcnRlci5nbHRmLm1lc2hlcztcbiAgICBpZiAoZ2xURk1lc2hlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgYXNzZXROYW1lcyA9IG1ha2VVbmlxdWVTdWJBc3NldE5hbWVzKGFzc2V0LmJhc2VuYW1lLCBnbFRGTWVzaGVzLCAnbWVzaGVzJywgJy5tZXNoJyk7XG4gICAgY29uc3QgbWVzaEFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGdsVEZNZXNoZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGdsVEZNZXNoID0gZ2xURk1lc2hlc1tpbmRleF07XG4gICAgICAgIGNvbnN0IHN1YkFzc2V0ID0gYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoYXNzZXROYW1lc1tpbmRleF0sICdnbHRmLW1lc2gnKTtcbiAgICAgICAgc3ViQXNzZXQudXNlckRhdGEuZ2x0ZkluZGV4ID0gaW5kZXg7XG4gICAgICAgIG1lc2hBcnJheS5wdXNoKHN1YkFzc2V0LnV1aWQpO1xuICAgIH1cbiAgICAvLyDmt7vliqDmlrDnmoQgbWVzaCDlrZDotYTmupBcbiAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhIGFzIEdsVEZVc2VyRGF0YTtcbiAgICBpZiAodXNlckRhdGEubG9kcyAmJiAhdXNlckRhdGEubG9kcy5oYXNCdWlsdGluTE9EICYmIHVzZXJEYXRhLmxvZHMuZW5hYmxlKSB7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBhc3NldE5hbWVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgbG9kc09wdGlvbiA9IHVzZXJEYXRhLmxvZHMub3B0aW9ucztcbiAgICAgICAgICAgIC8vIExPRDAg5LiN6ZyA6KaB55Sf5oiQ5aSE55CGXG4gICAgICAgICAgICBmb3IgKGxldCBrZXlJbmRleCA9IDE7IGtleUluZGV4IDwgbG9kc09wdGlvbi5sZW5ndGg7IGtleUluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAvLyDmlrAgbWVzaCDlrZDotYTmupDlkI3np7BcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTdWJBc3NldE5hbWUgPSBhc3NldE5hbWVzW2luZGV4XS5zcGxpdCgnLm1lc2gnKVswXSArIGBMT0Qke2tleUluZGV4fS5tZXNoYDtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTdWJBc3NldCA9IGF3YWl0IGFzc2V0LmNyZWF0ZVN1YkFzc2V0KG5ld1N1YkFzc2V0TmFtZSwgJ2dsdGYtbWVzaCcpO1xuICAgICAgICAgICAgICAgIC8vIOiusOW9leS4gOS6m+aWsCBtZXNoIOWtkOi1hOa6kOaVsOaNrlxuICAgICAgICAgICAgICAgIG5ld1N1YkFzc2V0LnVzZXJEYXRhLmdsdGZJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgIG5ld1N1YkFzc2V0LnVzZXJEYXRhLmxvZExldmVsID0ga2V5SW5kZXg7XG4gICAgICAgICAgICAgICAgbmV3U3ViQXNzZXQudXNlckRhdGEubG9kT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmFjZUNvdW50OiBsb2RzT3B0aW9uW2tleUluZGV4XS5mYWNlQ291bnQsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtZXNoQXJyYXkucHVzaChuZXdTdWJBc3NldC51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzaEFycmF5O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRTa2lucyhhc3NldDogQXNzZXQsIGdsVEZDb252ZXJ0ZXI6IEdsdGZDb252ZXJ0ZXIpIHtcbiAgICBjb25zdCBnbFRGU2tpbnMgPSBnbFRGQ29udmVydGVyLmdsdGYuc2tpbnM7XG4gICAgaWYgKGdsVEZTa2lucyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgYXNzZXROYW1lcyA9IG1ha2VVbmlxdWVTdWJBc3NldE5hbWVzKGFzc2V0LmJhc2VuYW1lLCBnbFRGU2tpbnMsICdza2VsZXRvbnMnLCAnLnNrZWxldG9uJyk7XG4gICAgY29uc3Qgc2tpbkFycmF5ID0gbmV3IEFycmF5KGdsVEZTa2lucy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBnbFRGU2tpbnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGdsVEZTa2luID0gZ2xURlNraW5zW2luZGV4XTtcbiAgICAgICAgY29uc3Qgc3ViQXNzZXQgPSBhd2FpdCBhc3NldC5jcmVhdGVTdWJBc3NldChhc3NldE5hbWVzW2luZGV4XSwgJ2dsdGYtc2tlbGV0b24nKTtcbiAgICAgICAgc3ViQXNzZXQudXNlckRhdGEuZ2x0ZkluZGV4ID0gaW5kZXg7XG4gICAgICAgIHNraW5BcnJheVtpbmRleF0gPSBzdWJBc3NldC51dWlkO1xuICAgIH1cbiAgICByZXR1cm4gc2tpbkFycmF5O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRJbWFnZXMoYXNzZXQ6IEFzc2V0LCBnbFRGQ29udmVydGVyOiBHbHRmQ29udmVydGVyKSB7XG4gICAgY29uc3QgZ2xURkltYWdlcyA9IGdsVEZDb252ZXJ0ZXIuZ2x0Zi5pbWFnZXM7XG4gICAgaWYgKGdsVEZJbWFnZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG5cbiAgICBjb25zdCBmYnhNaXNzaW5nSW1hZ2VVcmkgPVxuICAgICAgICAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1QOC81K2hIZ0FIZ2dKL1BjaEk3d0FBQUFCSlJVNUVya0pnZ2c9PSc7XG5cbiAgICBjb25zdCBpc1Byb2R1Y2VkQnlGQlgyZ2xURiA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgZ2VuZXJhdG9yID0gZ2xURkNvbnZlcnRlci5nbHRmLmFzc2V0LmdlbmVyYXRvcjtcbiAgICAgICAgcmV0dXJuIGdlbmVyYXRvcj8uaW5jbHVkZXMoJ0ZCWDJnbFRGJyk7XG4gICAgfTtcblxuICAgIGNvbnN0IGlzRkJYMmdsVEZTb3VyY2VNaXNzaW5nSW1hZ2VVcmkgPSAodXJpOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIGlzUHJvZHVjZWRCeUZCWDJnbFRGKCkgJiYgdXJpID09PSBmYnhNaXNzaW5nSW1hZ2VVcmk7XG4gICAgfTtcblxuICAgIGNvbnN0IGlzUHJvZHVjZWRCeUZieEdsVGZDb252ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBnZW5lcmF0b3IgPSBnbFRGQ29udmVydGVyLmdsdGYuYXNzZXQuZ2VuZXJhdG9yO1xuICAgICAgICByZXR1cm4gZ2VuZXJhdG9yPy5pbmNsdWRlcygnRkJYLWdsVEYtY29udicpO1xuICAgIH07XG5cbiAgICBjb25zdCBpc0ZCWEdsVGZDb252TWlzc2luZ0ltYWdlVXJpID0gKHVyaTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBpc1Byb2R1Y2VkQnlGYnhHbFRmQ29udigpICYmIHVyaSA9PT0gZmJ4TWlzc2luZ0ltYWdlVXJpO1xuICAgIH07XG5cbiAgICBjb25zdCBpbWFnZU5hbWVzID0gbWFrZVVuaXF1ZVN1YkFzc2V0TmFtZXMoYXNzZXQuYmFzZW5hbWUsIGdsVEZJbWFnZXMsICdpbWFnZXMnLCAnLmltYWdlJyk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGdsVEZJbWFnZXMubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgICAgIGNvbnN0IGdsVEZJbWFnZSA9IGdsVEZJbWFnZXNbaW5kZXhdO1xuICAgICAgICBjb25zdCBpbWFnZU1ldGEgPSB1c2VyRGF0YS5pbWFnZU1ldGFzW2luZGV4XTtcbiAgICAgICAgY29uc3QgdmVuZG9yVVJJID0gZ2xURkltYWdlLnVyaTtcblxuICAgICAgICBsZXQgaXNSZXNvbHZlTmVlZGVkID0gZmFsc2U7XG4gICAgICAgIC8vIElmIGlzUmVzb2x2ZWROZWVkZWQgaXMgYHRydWVgLCB0aGUgcmVzb2x2ZSBhbGdvcml0aG0gd2lsbCB0YWtlIHRoaXMgcGFyYW1ldGVyLlxuICAgICAgICAvLyBUaGVyZSBtYXkgYmUgYGlzUmVzb2x2ZU5lZWRlZCAmJiAhaW1hZ2VQYXRoYCwgc2VlIGJlbG93LlxuICAgICAgICBsZXQgaW1hZ2VQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gV2Ugd2lsbCBub3QgY3JlYXRlIHN1Yi1hc3NldC1IYW5kbGVyIGlmOlxuICAgICAgICAvLyAtIGB1cmlgIGZpZWxkIGlzIHJlbGF0aXZlIG9yIGlzIGZpbGUgVVJMLCBhbmRcbiAgICAgICAgLy8gLSB0aGUgcmVzb2x2ZWQgYWJzb2x1dGUgZmlsZSBwYXRoLCBhZnRlciB0aGUgaW1hZ2UgbG9va3VwIHJ1bGVzIGFwcGxpZWQgaXMgaW5zaWRlIHRoZSBwcm9qZWN0LlxuICAgICAgICAvLyBJbiBzdWNoIGNhc2VzLCB3ZSBkaXJlY3RseSB1c2UgdGhpcyBsb2NhdGlvbiBpbnN0ZWFkIG9mIGNyZWF0ZSB0aGUgaW1hZ2UgYXNzZXQuXG4gICAgICAgIGlmICh2ZW5kb3JVUkkgJiYgKGlzRkJYMmdsVEZTb3VyY2VNaXNzaW5nSW1hZ2VVcmkodmVuZG9yVVJJKSB8fCBpc0ZCWEdsVGZDb252TWlzc2luZ0ltYWdlVXJpKHZlbmRvclVSSSkpKSB7XG4gICAgICAgICAgICAvLyBOb3RlLCBpZiB0aGUgZ2xURiBpcyBjb252ZXJ0ZWQgZnJvbSBGQlggYnkgRkJYMmdsVEZcbiAgICAgICAgICAgIC8vIGFuZCB0aGVyZSBhcmUgbWlzc2luZyB0ZXh0dXJlcywgdGhlIEZCWDJnbFRGIHdpbGwgYXNzaWduIGEgY29uc3RhbnQgZGF0YS11cmkgYXMgdXJpIG9mIGltYWdlLlxuICAgICAgICAgICAgLy8gV2UgY2FwdHVyZSB0aGVzZSBjYXNlcyBhbmQgdHJ5IHJlc29sdmUgdGhlIGltYWdlIGFjY29yZGluZyB0aGUgZ2xURiBpbWFnZSBhc3NldCBuYW1lXG4gICAgICAgICAgICAvLyB1c2luZyBvdXIgb3duIGFsZ29yaXRobS5cbiAgICAgICAgICAgIGlzUmVzb2x2ZU5lZWRlZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodmVuZG9yVVJJICYmICF2ZW5kb3JVUkkuc3RhcnRzV2l0aCgnZGF0YTonKSkge1xuICAgICAgICAgICAgLy8gTm90ZTogc2hvdWxkIG5vdCBiZSBgYXNzZXQuc291cmNlYCwgd2hpY2ggbWF5IGJlIHBhdGggdG8gZmJ4LlxuICAgICAgICAgICAgY29uc3QgZ2xURkZpbGVQYXRoID0gZ2xURkNvbnZlcnRlci5wYXRoO1xuICAgICAgICAgICAgY29uc3QgYmFzZVVSSSA9IFVSTC5wYXRoVG9GaWxlVVJMKGdsVEZGaWxlUGF0aCkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IG5vcm1hbGl6ZWRVUkkgPSBuZXcgVVJJKHZlbmRvclVSSSk7XG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZFVSSSA9IG5vcm1hbGl6ZWRVUkkuYWJzb2x1dGVUbyhiYXNlVVJJKTtcbiAgICAgICAgICAgICAgICBjb252ZXJ0c0VuY29kZWRTZXBhcmF0b3JzSW5VUkkobm9ybWFsaXplZFVSSSk7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRVUkkuc2NoZW1lKCkgPT09ICdmaWxlJykge1xuICAgICAgICAgICAgICAgICAgICBpbWFnZVBhdGggPSBVUkwuZmlsZVVSTFRvUGF0aChub3JtYWxpemVkVVJJLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBpc1Jlc29sdmVOZWVkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggeyB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzb2x2ZWQgPSAnJztcbiAgICAgICAgaWYgKGlzUmVzb2x2ZU5lZWRlZCkge1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZUphaWwgPSBhc3NldC5fYXNzZXREQi5vcHRpb25zLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkSW1hZ2VQYXRoID0gYXdhaXQgcmVzb2x2ZUdsVGZJbWFnZVBhdGgoXG4gICAgICAgICAgICAgICAgZ2xURkltYWdlLm5hbWUsXG4gICAgICAgICAgICAgICAgaW1hZ2VQYXRoLFxuICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZShhc3NldC5zb3VyY2UpLFxuICAgICAgICAgICAgICAgIGdsVEZJbWFnZS5leHRyYXMsXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUphaWwsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkSW1hZ2VQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGJVUkwgPSBxdWVyeVVybChyZXNvbHZlZEltYWdlUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKGRiVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGFzc2V0IGRhdGFiYXNlLCB1c2UgaXQuXG4gICAgICAgICAgICAgICAgICAgIGltYWdlTWV0YS51cmkgPSBkYlVSTDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGhhcHBlbmVkIHVzdWFsbHkgd2hlblxuICAgICAgICAgICAgICAgICAgICAvLyAtIDEuIE1vZGVsIGZpbGUgY29udGFpbnMgYWJzb2x1dGUgVVJMIHBvaW50IHRvIGFuIG91dC1vZi1wcm9qZWN0IGxvY2F0aW9uO1xuICAgICAgICAgICAgICAgICAgICAvLyAtIDIuIE1vZGVsIGZpbGUgY29udGFpbnMgcmVsYXRpdmUgVVJMIGJ1dCByZXNvbHZlZCB0byBhbiBvdXQtb2YtcHJvamVjdCBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgLy8gLSAzLiBGQlggbW9kZWwgZmlsZSBhbmQgaXRzIHJlZmVyZW5jZSBpbWFnZXMgYXJlIGNvbnZlcnRlZCB1c2luZyBGQlgyZ2xURiB0byBhIHRlbXBvcmFyeSBwYXRoLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGxvY2F0aW9uIG1heSBiZSBvbmx5IGFibGUgYWNjZXNzZWQgYnkgY3VycmVudC11c2VyLlxuICAgICAgICAgICAgICAgICAgICAvLyAxICYgMiBodXJ0cyBpZiBwcm9qZWN0IGFyZSBzaGFyZWQgYnkgbXVsdGktdXNlci5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVGcm9tVG1wRGlyID0gcmVsYXRpdmUoYXNzZXRDb25maWcuZGF0YS50ZW1wUm9vdCwgcmVzb2x2ZWRJbWFnZVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzQWJzb2x1dGUocmVsYXRpdmVGcm9tVG1wRGlyKSAmJiAhcmVsYXRpdmVGcm9tVG1wRGlyLnN0YXJ0c1dpdGgoYC4uJHtzZXB9YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkID0gcmVzb2x2ZWRJbWFnZVBhdGg7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYEluIG1vZGVsIGZpbGUgJHthc3NldC5zb3VyY2V9LGAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGB0aGUgaW1hZ2UgJHtnbFRGSW1hZ2UubmFtZX0gaXMgcmVzb2x2ZWQgdG8gJHtyZXNvbHZlZEltYWdlUGF0aH0sYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3doaWNoIGlzIGEgbG9jYXRpb24gb3V0IG9mIGFzc2V0IGRpcmVjdG9yeS4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVGhpcyBjYW4gY2F1c2UgcHJvYmxlbSBhcyB5b3VyIHByb2plY3QgbWlncmF0ZWQuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWltYWdlTWV0YS51cmkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkFzc2V0ID0gYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoaW1hZ2VOYW1lc1tpbmRleF0sICdnbHRmLWVtYmVkZWQtaW1hZ2UnKTtcbiAgICAgICAgICAgIHN1YkFzc2V0LnVzZXJEYXRhLmdsdGZJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgaW1hZ2VNZXRhLnVyaSA9IHN1YkFzc2V0LnV1aWQ7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJBc3NldC5nZXRTd2FwU3BhY2U8eyByZXNvbHZlZD86IHN0cmluZyB9PigpLnJlc29sdmVkID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChnbFRGSW1hZ2UudXJpID09PSBmYnhNaXNzaW5nSW1hZ2VVcmkpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2xURkNvbnZlcnRlci5mYnhNaXNzaW5nSW1hZ2VzSWQucHVzaChpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRUZXh0dXJlcyhhc3NldDogQXNzZXQsIGdsVEZDb252ZXJ0ZXI6IEdsdGZDb252ZXJ0ZXIpOiBQcm9taXNlPEFycmF5PHN0cmluZyB8IG51bGw+PiB7XG4gICAgY29uc3QgZ2xURlRleHR1cmVzID0gZ2xURkNvbnZlcnRlci5nbHRmLnRleHR1cmVzO1xuICAgIGlmIChnbFRGVGV4dHVyZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IGFzc2V0TmFtZXMgPSBtYWtlVW5pcXVlU3ViQXNzZXROYW1lcyhhc3NldC5iYXNlbmFtZSwgZ2xURlRleHR1cmVzLCAndGV4dHVyZXMnLCAnLnRleHR1cmUnKTtcbiAgICBjb25zdCB0ZXh0dXJlQXJyYXkgPSBuZXcgQXJyYXkoZ2xURlRleHR1cmVzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGdsVEZUZXh0dXJlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY29uc3QgZ2xURlRleHR1cmUgPSBnbFRGVGV4dHVyZXNbaW5kZXhdO1xuICAgICAgICBjb25zdCBuYW1lID0gYXNzZXROYW1lc1tpbmRleF07XG4gICAgICAgIGNvbnN0IHN1YkFzc2V0ID0gYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQobmFtZSwgJ3RleHR1cmUnKTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFRleHR1cmVVc2VyZGF0YSA9IG1ha2VEZWZhdWx0VGV4dHVyZTJEQXNzZXRVc2VyRGF0YSgpO1xuICAgICAgICAvLyDov5nph4zlj6rmmK/orr7nva7kuIDkuKrpu5jorqTlgLzvvIzlpoLmnpznlKjmiLfkv67mlLnov4fvvIzmiJbogIXlt7Lnu4/nlJ/miJDov4fmlbDmja7vvIzmiJHku6zpnIDopoHlsL3ph4/kv53mjIHlrZjlgqjlnKjnlKjmiLcgbWV0YSDph4znmoTmlbDmja5cbiAgICAgICAgZ2xURkNvbnZlcnRlci5nZXRUZXh0dXJlUGFyYW1ldGVycyhnbFRGVGV4dHVyZSwgZGVmYXVsdFRleHR1cmVVc2VyZGF0YSk7XG4gICAgICAgIGNvbnN0IHRleHR1cmVVc2VyZGF0YSA9IHN1YkFzc2V0LnVzZXJEYXRhIGFzIFRleHR1cmUyREFzc2V0VXNlckRhdGE7XG4gICAgICAgIHN1YkFzc2V0LmFzc2lnblVzZXJEYXRhKGRlZmF1bHRUZXh0dXJlVXNlcmRhdGEpO1xuICAgICAgICBpZiAoZ2xURlRleHR1cmUuc291cmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlTWV0YSA9IChhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGEpLmltYWdlTWV0YXNbZ2xURlRleHR1cmUuc291cmNlXTtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlVVJJID0gaW1hZ2VNZXRhLnJlbWFwIHx8IGltYWdlTWV0YS51cmk7XG4gICAgICAgICAgICBpZiAoIWltYWdlVVJJKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRleHR1cmVVc2VyZGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0ZXh0dXJlVXNlcmRhdGEuaXNVdWlkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1V1aWQgPSAhaW1hZ2VVUkkuc3RhcnRzV2l0aCgnZGI6Ly8nKTtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlVXNlcmRhdGEuaXNVdWlkID0gaXNVdWlkO1xuICAgICAgICAgICAgICAgIHRleHR1cmVVc2VyZGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpID0gaW1hZ2VVUkk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1V1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VQYXRoID0gcXVlcnlQYXRoKHRleHR1cmVVc2VyZGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbWFnZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYCR7dGV4dHVyZVVzZXJkYXRhLmltYWdlVXVpZE9yRGF0YWJhc2VVcml9IGlzIG5vdCBmb3VuZCBpbiBhc3NldC1kYi5gLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3ViQXNzZXQuZGVwZW5kKGltYWdlUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRleHR1cmVBcnJheVtpbmRleF0gPSBzdWJBc3NldC51dWlkO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dHVyZUFycmF5O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRNYXRlcmlhbHMoXG4gICAgYXNzZXQ6IEFzc2V0LFxuICAgIGdsVEZDb252ZXJ0ZXI6IEdsdGZDb252ZXJ0ZXIsXG4gICAgYXNzZXRGaW5kZXI6IERlZmF1bHRHbHRmQXNzZXRGaW5kZXIsXG4pOiBQcm9taXNlPEFycmF5PHN0cmluZyB8IG51bGw+PiB7XG4gICAgY29uc3QgZ2xURk1hdGVyaWFscyA9IGdsVEZDb252ZXJ0ZXIuZ2x0Zi5tYXRlcmlhbHM7XG4gICAgaWYgKGdsVEZNYXRlcmlhbHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IHsgZHVtcE1hdGVyaWFscyB9ID0gYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhO1xuICAgIGNvbnN0IGFzc2V0TmFtZXMgPSBtYWtlVW5pcXVlU3ViQXNzZXROYW1lcyhhc3NldC5iYXNlbmFtZSwgZ2xURk1hdGVyaWFscywgJ21hdGVyaWFscycsIGR1bXBNYXRlcmlhbHMgPyAnLm10bCcgOiAnLm1hdGVyaWFsJyk7XG4gICAgY29uc3QgbWF0ZXJpYWxBcnJheSA9IG5ldyBBcnJheShnbFRGTWF0ZXJpYWxzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGdsVEZNYXRlcmlhbHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIC8vIGNvbnN0IGdsVEZNYXRlcmlhbCA9IGdsVEZNYXRlcmlhbHNbaW5kZXhdO1xuICAgICAgICBpZiAoZHVtcE1hdGVyaWFscykge1xuICAgICAgICAgICAgbWF0ZXJpYWxBcnJheVtpbmRleF0gPSBhd2FpdCBkdW1wTWF0ZXJpYWwoYXNzZXQsIGFzc2V0RmluZGVyLCBnbFRGQ29udmVydGVyLCBpbmRleCwgYXNzZXROYW1lc1tpbmRleF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3ViQXNzZXQgPSBhd2FpdCBhc3NldC5jcmVhdGVTdWJBc3NldChhc3NldE5hbWVzW2luZGV4XSwgJ2dsdGYtbWF0ZXJpYWwnKTtcbiAgICAgICAgICAgIHN1YkFzc2V0LnVzZXJEYXRhLmdsdGZJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgbWF0ZXJpYWxBcnJheVtpbmRleF0gPSBzdWJBc3NldC51dWlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRlcmlhbEFycmF5O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRTY2VuZXMoYXNzZXQ6IEFzc2V0LCBnbFRGQ29udmVydGVyOiBHbHRmQ29udmVydGVyKTogUHJvbWlzZTxBcnJheTxzdHJpbmc+PiB7XG4gICAgY29uc3QgZ2xURlNjZW5lcyA9IGdsVEZDb252ZXJ0ZXIuZ2x0Zi5zY2VuZXM7XG4gICAgaWYgKGdsVEZTY2VuZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGxldCBpZCA9ICcnO1xuICAgIGlmIChhc3NldC51dWlkMnJlY3ljbGUpIHtcbiAgICAgICAgZm9yIChjb25zdCBjSUQgaW4gYXNzZXQudXVpZDJyZWN5Y2xlKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gYXNzZXQudXVpZDJyZWN5Y2xlW2NJRF07XG4gICAgICAgICAgICBpZiAoaXRlbS5pbXBvcnRlciA9PT0gJ2dsdGYtc2NlbmUnICYmICdpZCcgaW4gaXRlbSkge1xuICAgICAgICAgICAgICAgIGlkID0gY0lEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGFzc2V0TmFtZXMgPSBtYWtlVW5pcXVlU3ViQXNzZXROYW1lcyhhc3NldC5iYXNlbmFtZSwgZ2xURlNjZW5lcywgJ3NjZW5lcycsICcucHJlZmFiJyk7XG4gICAgY29uc3Qgc2NlbmVBcnJheSA9IG5ldyBBcnJheShnbFRGU2NlbmVzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGdsVEZTY2VuZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHN1YkFzc2V0ID0gYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoYXNzZXROYW1lc1tpbmRleF0sICdnbHRmLXNjZW5lJywge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgIH0pO1xuICAgICAgICBzdWJBc3NldC51c2VyRGF0YS5nbHRmSW5kZXggPSBpbmRleDtcbiAgICAgICAgc2NlbmVBcnJheVtpbmRleF0gPSBzdWJBc3NldC51dWlkO1xuICAgIH1cbiAgICByZXR1cm4gc2NlbmVBcnJheTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2F2ZU9yaWdpbmFsQW5pbWF0aW9ucyhhc3NldDogQXNzZXQsIGdsVEZDb252ZXJ0ZXI6IEdsdGZDb252ZXJ0ZXIsIGNvbXByZXNzOiBib29sZWFuKSB7XG4gICAgY29uc3QgZ2xURkFuaW1hdGlvbnMgPSBnbFRGQ29udmVydGVyLmdsdGYuYW5pbWF0aW9ucztcbiAgICBpZiAoIWdsVEZBbmltYXRpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIGdsVEZBbmltYXRpb25zLm1hcChhc3luYyAoXzogYW55LCBpQW5pbWF0aW9uOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvbiA9IGdsVEZDb252ZXJ0ZXIuY3JlYXRlQW5pbWF0aW9uKGlBbmltYXRpb24pO1xuICAgICAgICAgICAgLy8gaWYgKGNvbXByZXNzKSB7XG4gICAgICAgICAgICAvLyAgICAgY29tcHJlc3NBbmltYXRpb25DbGlwKGFuaW1hdGlvbik7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBjb25zdCB7IGRhdGEsIGV4dGVuc2lvbiB9ID0gc2VyaWFsaXplRm9yTGlicmFyeShhbmltYXRpb24pO1xuICAgICAgICAgICAgY29uc3QgbGlicmFyeVBhdGggPSBnZXRPcmlnaW5hbEFuaW1hdGlvbkxpYnJhcnlQYXRoKGlBbmltYXRpb24pO1xuXG4gICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KGxpYnJhcnlQYXRoLCBkYXRhKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KGRhdGEpO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuICAgICAgICB9KSxcbiAgICApO1xufVxuXG50eXBlIEltcG9ydGxldCA9IChhc3NldDogTWVzaCB8IEFuaW1hdGlvbiB8IFNraW4gfCBNYXRlcmlhbCwgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuXG4vLyBsb2Qg6YWN572u5pyA5aSa5bGC57qnXG5jb25zdCBtYXhMb2RMZXZlbCA9IDc7XG5cbi8vIOm7mOiupCBsb2Qg5bGC57qn55qEXG5jb25zdCBkZWZhdWx0TE9Ec09wdGlvbnMgPSB7XG4gICAgc2NyZWVuUmF0aW86IDAsXG4gICAgZmFjZUNvdW50OiAwLFxufTtcblxuLy8g6YCS5b2S5p+l6K+i6IqC54K55LiL5omA5pyJIG1lc2gg55qE5YeP6Z2i5pWwXG5hc3luYyBmdW5jdGlvbiBkZWVwRmluZE1lc2hSZW5kZXJlcihub2RlOiBOb2RlLCBnbFRGQ29udmVydGVyOiBHbHRmQ29udmVydGVyLCBsb2RMZXZlbDogbnVtYmVyLCBnZW5lcmF0ZUxpZ2h0bWFwVVZOb2RlPzogYm9vbGVhbikge1xuICAgIGNvbnN0IG1lc2hSZW5kZXJlcnMgPSBub2RlLmdldENvbXBvbmVudHMoTWVzaFJlbmRlcmVyKTtcbiAgICBsZXQgbWVzaFJlbmRlcmVyVHJpYW5nbGVDb3VudCA9IDA7XG4gICAgaWYgKG1lc2hSZW5kZXJlcnMgJiYgbWVzaFJlbmRlcmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgbWVzaFJlbmRlcmVyIG9mIG1lc2hSZW5kZXJlcnMpIHtcbiAgICAgICAgICAgIGlmIChtZXNoUmVuZGVyZXIubWVzaCAmJiBtZXNoUmVuZGVyZXIubWVzaC51dWlkKSB7XG4gICAgICAgICAgICAgICAgbGV0IG1lc2hUcmlhbmdsZUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNoTWV0YSA9IGFzc2V0UXVlcnkucXVlcnlBc3NldE1ldGEobWVzaFJlbmRlcmVyLm1lc2gudXVpZCk7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6cIGZieCDoh6rouqvlkKvmnIkgbG9k77yMbWVzaE1ldGEg6YeM6K6w5b2V55u45bqU55qEIGxvZCDlsYLnuqdcbiAgICAgICAgICAgICAgICBtZXNoTWV0YSEudXNlckRhdGEubG9kTGV2ZWwgPSBsb2RMZXZlbDtcbiAgICAgICAgICAgICAgICAvLyDojrflj5YgbWVzaCDpnaLmlbBcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNoID0gZ2xURkNvbnZlcnRlci5jcmVhdGVNZXNoKG1lc2hNZXRhIS51c2VyRGF0YS5nbHRmSW5kZXgsIGdlbmVyYXRlTGlnaHRtYXBVVk5vZGUpO1xuICAgICAgICAgICAgICAgIG1lc2guc3RydWN0LnByaW1pdGl2ZXM/LmZvckVhY2goKHN1Yk1lc2g6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3ViTWVzaCAmJiBzdWJNZXNoLmluZGV4Vmlldykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzaFRyaWFuZ2xlQ291bnQgKz0gc3ViTWVzaC5pbmRleFZpZXcuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBtZXNoUmVuZGVyZXJUcmlhbmdsZUNvdW50ICs9IG1lc2hUcmlhbmdsZUNvdW50IC8gMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRDb3VudDogbnVtYmVyID0gYXdhaXQgZGVlcEZpbmRNZXNoUmVuZGVyZXIoY2hpbGROb2RlLCBnbFRGQ29udmVydGVyLCBsb2RMZXZlbCwgZ2VuZXJhdGVMaWdodG1hcFVWTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gbWVzaFJlbmRlcmVyVHJpYW5nbGVDb3VudCArIGNoaWxkQ291bnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc2hSZW5kZXJlclRyaWFuZ2xlQ291bnQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRMT0RzKGdsdGZVc2VyRGF0YTogR2xURlVzZXJEYXRhLCBzY2VuZU5vZGU6IE5vZGUsIGdsdGZDb252ZXJ0ZXI6IEdsdGZDb252ZXJ0ZXIpIHtcbiAgICBjb25zdCBMT0RzT3B0aW9uQXJyOiBMT0RzT3B0aW9uW10gPSBbXTtcbiAgICBjb25zdCB0cmlhbmdsZUNvdW50czogbnVtYmVyW10gPSBbXTtcbiAgICAvLyDojrflj5bmqKHlnovku6UgTE9EIyDnu5PlsL7nmoToioLngrnvvIzorqHnrpcgbG9kIOWxgue6p+iKgueCueS4i+eahOaJgOaciSBtZXNoIOeahOWHj+mdouaVsOaAu+WSjFxuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygc2NlbmVOb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgIGNvbnN0IGxvZEFyciA9IC9MT0QoXFxkKykkL2kuZXhlYyhjaGlsZC5uYW1lKTtcbiAgICAgICAgaWYgKGxvZEFyciAmJiBsb2RBcnIubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChsb2RBcnJbMV0sIDEwKTtcbiAgICAgICAgICAgIC8vIOWPquWPliA3IOWxglxuICAgICAgICAgICAgaWYgKGluZGV4IDw9IG1heExvZExldmVsKSB7XG4gICAgICAgICAgICAgICAgTE9Ec09wdGlvbkFycltpbmRleF0gPSBMT0RzT3B0aW9uQXJyW2luZGV4XSB8fCBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0TE9Ec09wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRyaWFuZ2xlQ291bnRzW2luZGV4XSA9XG4gICAgICAgICAgICAgICAgICAgICh0cmlhbmdsZUNvdW50c1tpbmRleF0gfHwgMCkgK1xuICAgICAgICAgICAgICAgICAgICAoYXdhaXQgZGVlcEZpbmRNZXNoUmVuZGVyZXIoY2hpbGQsIGdsdGZDb252ZXJ0ZXIsIGluZGV4LCBnbHRmVXNlckRhdGEuZ2VuZXJhdGVMaWdodG1hcFVWTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKExPRHNPcHRpb25BcnIubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBtYXhMb2QgPSBNYXRoLm1heCguLi5PYmplY3Qua2V5cyhMT0RzT3B0aW9uQXJyKS5tYXAoKGtleTogc3RyaW5nKSA9PiAra2V5KSk7XG4gICAgICAgIC8vIOWxj+WNoOavlOS7jiAwLjI1IOmAkOe6p+WHj+WNilxuICAgICAgICBsZXQgc2NyZWVuUmF0aW8gPSAwLjI1O1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbWF4TG9kOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyDloavlhYUgTE9EIOWxgue6p++8jG1heExvZCDlsYLnuqfogq/lrprlrZjlnKhcbiAgICAgICAgICAgIGlmICghTE9Ec09wdGlvbkFycltpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBObyBtZXNoIG5hbWUgYXJlIGVuZGluZyB3aXRoIExPRCR7aW5kZXh9YCk7XG4gICAgICAgICAgICAgICAgTE9Ec09wdGlvbkFycltpbmRleF0gPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0TE9Ec09wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDorqHnrpcgc2NyZWVuUmF0aW8gZmFjZUNvdW50XG4gICAgICAgICAgICBMT0RzT3B0aW9uQXJyW2luZGV4XS5zY3JlZW5SYXRpbyA9IHNjcmVlblJhdGlvO1xuICAgICAgICAgICAgc2NyZWVuUmF0aW8gLz0gMjtcbiAgICAgICAgICAgIC8vIOavj+S4quWxgue6pyB0cmlhbmdsZSDlkowgTE9EMCDnmoTmr5TlgLxcbiAgICAgICAgICAgIGlmICh0cmlhbmdsZUNvdW50c1swXSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIExPRHNPcHRpb25BcnJbaW5kZXhdLmZhY2VDb3VudCA9IHRyaWFuZ2xlQ291bnRzW2luZGV4XSAvIHRyaWFuZ2xlQ291bnRzWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHNjcmVlblJhdGlvIOacgOWQjuS4gOWxguWwj+S6jiAxJe+8jOS7peiuoeeul+e7k+aenOS4uuWHhuOAguWmguaenOWkp+S6jjHvvIzliJnnlKggMSUg5L2c5Li65pyA5ZCO5LiA5Liq5bGC57qn55qE5bGP5Y2g5q+UXG4gICAgICAgIExPRHNPcHRpb25BcnJbbWF4TG9kXS5zY3JlZW5SYXRpbyA9IHNjcmVlblJhdGlvIDwgMC4wMSA/IHNjcmVlblJhdGlvIDogMC4wMTtcbiAgICAgICAgTE9Ec09wdGlvbkFyclttYXhMb2RdLmZhY2VDb3VudCA9IHRyaWFuZ2xlQ291bnRzWzBdID8gdHJpYW5nbGVDb3VudHNbbWF4TG9kXSAvIHRyaWFuZ2xlQ291bnRzWzBdIDogMDtcbiAgICB9XG5cbiAgICByZXR1cm4gTE9Ec09wdGlvbkFycjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVEZWZhdWx0TE9Ec09wdGlvbigpIHtcbiAgICBjb25zdCBMT0RzT3B0aW9uQXJyOiBMT0RzT3B0aW9uW10gPSBbXTtcbiAgICAvLyDnlJ/miJDpu5jorqQgc2NyZWVuUmF0aW8gZmFjZUNvdW50XG4gICAgY29uc3QgZGVmYXVsdFNjcmVlblJhdGlvQXJyID0gWzAuMjUsIDAuMTI1LCAwLjAxXSxcbiAgICAgICAgZGVmYXVsdEZhY2VDb3VudEFyciA9IFsxLCAwLjI1LCAwLjFdO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCAzOyBpbmRleCsrKSB7XG4gICAgICAgIExPRHNPcHRpb25BcnJbaW5kZXhdID0ge1xuICAgICAgICAgICAgc2NyZWVuUmF0aW86IGRlZmF1bHRTY3JlZW5SYXRpb0FycltpbmRleF0sXG4gICAgICAgICAgICBmYWNlQ291bnQ6IGRlZmF1bHRGYWNlQ291bnRBcnJbaW5kZXhdLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gTE9Ec09wdGlvbkFycjtcbn1cblxuLyoqXG4gKiDkuLpnbFRG5a2Q6LWE5rqQ5pWw57uE5Lit55qE5omA5pyJ5a2Q6LWE5rqQ55Sf5oiQ5Zyo5a2Q6LWE5rqQ5pWw57uE5Lit54us5LiA5peg5LqM55qE5ZCN5a2X77yM6L+Z5Liq5ZCN5a2X5Y+v55So5L2cRWRpdG9yQXNzZXTnmoTlkI3np7Dku6Xlj4rmlofku7bns7vnu5/kuIrnmoTmlofku7blkI3jgIJcbiAqIEBwYXJhbSBnbHRmRmlsZUJhc2VOYW1lIGdsVEbmlofku7blkI3vvIzkuI3lkKvmianlsZXlkI3pg6jliIbjgIJcbiAqIEBwYXJhbSBhc3NldHNBcnJheSBnbFRG5a2Q6LWE5rqQ5pWw57uE44CCXG4gKiBAcGFyYW0gZXh0ZW5zaW9uIOmZhOWKoOeahOaJqeWxleWQjeOAguivpeaJqeWxleWQjeWwhuS9nOS4uuWQjue8gOmZhOWKoOWIsOe7k+aenOWQjeWtl+S4iuOAglxuICogQHBhcmFtIG9wdGlvbnMucHJlZmVyZWRGaWxlQmFzZU5hbWUg5bC95Y+v6IO95Zyw5L2/55SoZ2xURuaWh+S7tuacrOi6q+eahOWQjeWtl+iAjOS4jeaYr2dsVEblrZDotYTmupDmnKzouqvnmoTlkI3np7DmnaXnlJ/miJDnu5PmnpzjgIJcbiAqL1xuZnVuY3Rpb24gbWFrZVVuaXF1ZVN1YkFzc2V0TmFtZXMoXG4gICAgZ2x0ZkZpbGVCYXNlTmFtZTogc3RyaW5nLFxuICAgIGFzc2V0c0FycmF5OiBHbHRmU3ViQXNzZXRbXSxcbiAgICBmaW5kZXJLaW5kOiBNeUZpbmRlcktpbmQgfCAnaW1hZ2VzJyxcbiAgICBleHRlbnNpb246IHN0cmluZyxcbikge1xuICAgIGNvbnN0IGdldEJhc2VOYW1lSWZOb05hbWUgPSAoKSA9PiB7XG4gICAgICAgIHN3aXRjaCAoZmluZGVyS2luZCkge1xuICAgICAgICAgICAgY2FzZSAnYW5pbWF0aW9ucyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdVbm5hbWVkQW5pbWF0aW9uJztcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdVbm5hbWVkSW1hZ2UnO1xuICAgICAgICAgICAgY2FzZSAnbWVzaGVzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1VubmFtZWRNZXNoJztcbiAgICAgICAgICAgIGNhc2UgJ21hdGVyaWFscyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdVbm5hbWVkTWF0ZXJpYWwnO1xuICAgICAgICAgICAgY2FzZSAnc2tlbGV0b25zJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1VubmFtZWRTa2VsZXRvbic7XG4gICAgICAgICAgICBjYXNlICd0ZXh0dXJlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdVbm5hbWVkVGV4dHVyZSc7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAnVW5uYW1lZCc7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IG5hbWVzID0gYXNzZXRzQXJyYXkubWFwKChhc3NldCkgPT4ge1xuICAgICAgICBsZXQgdW5jaGVja2VkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChmaW5kZXJLaW5kID09PSAnc2NlbmVzJykge1xuICAgICAgICAgICAgdW5jaGVja2VkID0gZ2x0ZkZpbGVCYXNlTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXNzZXQubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHVuY2hlY2tlZCA9IGFzc2V0Lm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1bmNoZWNrZWQgPSBnZXRCYXNlTmFtZUlmTm9OYW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuY2hlY2tlZDtcbiAgICB9KTtcblxuICAgIGlmICghaXNEaWZmZXJXaXRoRWFjaE90aGVyKG5hbWVzIGFzIHN0cmluZ1tdKSkge1xuICAgICAgICBsZXQgdGFpbCA9ICctJztcblxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuXG4gICAgICAgICAgICBpZiAobmFtZXMuZXZlcnkoKG5hbWUpID0+ICFuYW1lIS5lbmRzV2l0aCh0YWlsKSkpIHtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFpbCArPSAnLSc7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZXMgPSBuYW1lcy5tYXAoKG5hbWUsIGluZGV4KSA9PiBuYW1lICsgYCR7dGFpbH0ke2luZGV4fWApO1xuICAgIH1cblxuICAgIHJldHVybiBuYW1lcy5tYXAoKG5hbWUpID0+IG5hbWUgKyBleHRlbnNpb24pO1xufVxuXG5mdW5jdGlvbiBpc0RpZmZlcldpdGhFYWNoT3RoZXIodmFsdWVzOiBzdHJpbmdbXSkge1xuICAgIGlmICh2YWx1ZXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29uc3Qgc29ydGVkID0gdmFsdWVzLnNsaWNlKCkuc29ydCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvcnRlZC5sZW5ndGggLSAxOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzb3J0ZWRbaV0gPT09IHNvcnRlZFtpICsgMV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGVJbWFnZUxvY2F0aW9ucyhhc3NldDogQXNzZXQpIHtcbiAgICBpbnRlcmZhY2UgSW1hZ2VEZXRhaWwge1xuICAgICAgICB1dWlkT3JEYXRhYmFzZVVyaTogc3RyaW5nO1xuICAgICAgICBlbWJlZGVkOiBib29sZWFuO1xuICAgIH1cblxuICAgIGludGVyZmFjZSBPbGRNZXRhIHtcbiAgICAgICAgaW1hZ2VMb2NhdGlvbnM/OiBSZWNvcmQ8XG4gICAgICAgICAgICBzdHJpbmcsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8g5qih5Z6L5paH5Lu25Lit6K+l5Zu+54mH55qE6Lev5b6E5L+h5oGv44CCXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxQYXRoPzogc3RyaW5nIHwgbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIOeUqOaIt+iuvue9rueahOWbvueJh+i3r+W+hO+8jERhdGFiYXNlLXVybCDlvaLlvI/jgIJcbiAgICAgICAgICAgICAgICB0YXJnZXREYXRhYmFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgPjtcblxuICAgICAgICBhc3NldEZpbmRlcj86IHtcbiAgICAgICAgICAgIGltYWdlcz86IEFycmF5PEltYWdlRGV0YWlsIHwgbnVsbD47XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgb2xkTWV0YSA9IGFzc2V0Lm1ldGEudXNlckRhdGEgYXMgT2xkTWV0YTtcbiAgICBjb25zdCBpbWFnZU1ldGFzOiBJbWFnZU1ldGFbXSA9IFtdO1xuICAgIGlmIChvbGRNZXRhLmltYWdlTG9jYXRpb25zKSB7XG4gICAgICAgIGNvbnN0IHsgaW1hZ2VMb2NhdGlvbnMgfSA9IG9sZE1ldGE7XG4gICAgICAgIGZvciAoY29uc3QgaW1hZ2VOYW1lIG9mIE9iamVjdC5rZXlzKGltYWdlTG9jYXRpb25zKSkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VMb2NhdGlvbiA9IGltYWdlTG9jYXRpb25zW2ltYWdlTmFtZV07XG4gICAgICAgICAgICBpZiAoaW1hZ2VMb2NhdGlvbi50YXJnZXREYXRhYmFzZVVybCkge1xuICAgICAgICAgICAgICAgIGltYWdlTWV0YXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGltYWdlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtYXA6IGltYWdlTG9jYXRpb24udGFyZ2V0RGF0YWJhc2VVcmwsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIG9sZE1ldGEuaW1hZ2VMb2NhdGlvbnM7XG4gICAgfVxuICAgIChhc3NldC5tZXRhLnVzZXJEYXRhIGFzIEdsVEZVc2VyRGF0YSkuaW1hZ2VNZXRhcyA9IGltYWdlTWV0YXM7XG5cbiAgICBpZiAob2xkTWV0YS5hc3NldEZpbmRlciAmJiBvbGRNZXRhLmFzc2V0RmluZGVyLmltYWdlcykge1xuICAgICAgICBkZWxldGUgb2xkTWV0YS5hc3NldEZpbmRlci5pbWFnZXM7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtaWdyYXRlSW1hZ2VSZW1hcChhc3NldDogQXNzZXQpIHtcbiAgICBjb25zdCBvbGRNZXRhID0gYXNzZXQubWV0YS51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG4gICAgaWYgKCFvbGRNZXRhLmltYWdlTWV0YXMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGltYWdlTWV0YSBvZiBvbGRNZXRhLmltYWdlTWV0YXMpIHtcbiAgICAgICAgY29uc3QgeyByZW1hcCB9ID0gaW1hZ2VNZXRhO1xuICAgICAgICBpZiAoIXJlbWFwKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWQgPSBxdWVyeVVVSUQocmVtYXApO1xuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1hZ2VNZXRhLnJlbWFwID0gdXVpZDtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKlxuICog5aaC5p6c5L2/55So5LqGIGR1bXBNYXRlcmlhbO+8jOW5tuS4lOeUn+aIkOebruW9leW4puaciSBGQlhcbiAqIOWwsemcgOimgeaUueWQje+8jOW5tumHjeaWsOWvvOWFpeaWsOeahCBtYXRlcmlhbFxuICogQHBhcmFtIGFzc2V0IGdsdGYg6LWE5rqQXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGVEdW1wTWF0ZXJpYWwoYXNzZXQ6IEFzc2V0KSB7XG4gICAgaWYgKCFhc3NldC51c2VyRGF0YS5kdW1wTWF0ZXJpYWxzIHx8IGFzc2V0LnVzZXJEYXRhLm1hdGVyaWFsRHVtcERpcikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9sZCA9IHBhdGguam9pbihhc3NldC5zb3VyY2UsIGAuLi9NYXRlcmlhbHMke2Fzc2V0LmJhc2VuYW1lfS5GQlhgKTtcbiAgICBjb25zdCBvbGRNZXRhID0gcGF0aC5qb2luKGFzc2V0LnNvdXJjZSwgYC4uL01hdGVyaWFscyR7YXNzZXQuYmFzZW5hbWV9LkZCWC5tZXRhYCk7XG4gICAgY29uc3QgY3VycmVudCA9IHBhdGguam9pbihhc3NldC5zb3VyY2UsIGAuLi9NYXRlcmlhbHMke2Fzc2V0LmJhc2VuYW1lfWApO1xuICAgIGNvbnN0IGN1cnJlbnRNZXRhID0gcGF0aC5qb2luKGFzc2V0LnNvdXJjZSwgYC4uL01hdGVyaWFscyR7YXNzZXQuYmFzZW5hbWV9Lm1ldGFgKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhvbGQpICYmICFmcy5leGlzdHNTeW5jKGN1cnJlbnQpKSB7XG4gICAgICAgIGZzLnJlbmFtZVN5bmMob2xkLCBjdXJyZW50KTtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMob2xkTWV0YSkpIHtcbiAgICAgICAgICAgIGZzLnJlbmFtZVN5bmMob2xkTWV0YSwgY3VycmVudE1ldGEpO1xuICAgICAgICB9XG4gICAgICAgIGFzc2V0Ll9hc3NldERCLnJlZnJlc2goY3VycmVudCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOS7jiBGQlgg5a+85YWl5ZmoIDIuMCDlvIDlp4vvvIzmlrDlop7kuoYgYGxlZ2FjeUZieEhhbmRsZXJgIOWtl+auteeUqOadpeehruWumuaYr1xuICog5L2/55So5pen55qEIGBGQlgyZ2xURmAg6L+Y5pivIGBGQlgtZ2xURi1jb252YOOAglxuICog5b2T5L2O5LqOIDIuMCDniYjmnKznmoTotYTmupDov4Hnp7vkuIrmnaXml7bvvIzpu5jorqTkvb/nlKjml6fniYjmnKznmoTjgIJcbiAqIOS9huaYr+aJgOacieaWsOi1hOa6kOeahOWIm+W7uuWwhuS9v+eUqOaWsOeJiOacrOeahOOAglxuICovXG5hc3luYyBmdW5jdGlvbiBtaWdyYXRlRmJ4Q29udmVydGVyU2VsZWN0b3IoYXNzZXQ6IEFzc2V0KSB7XG4gICAgaWYgKGFzc2V0LmV4dG5hbWUgIT09ICcuZmJ4Jykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIChhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGEpLmxlZ2FjeUZieEltcG9ydGVyID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBGQlgg5a+85YWl5ZmoIHYxLjAuMC1hbHBoYS4xMiDlvIDlp4vlvJXlhaXkuoYgYC0tdW5pdC1jb252ZXJzaW9uYCDpgInpobnvvIzlubbkuJTpu5jorqTkvb/nlKjkuoYgYGdlb21ldHJ5LWxldmVsYO+8jFxuICog6ICM5LmL5YmN5L2/55So55qE5pivIGBoaWVyYXJjaHktbGV2ZWxg44CCXG4gKlxuICogQHBhcmFtIGFzc2V0XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGVGYnhDb252ZXJ0ZXJVbml0Q29udmVyc2lvbihhc3NldDogQXNzZXQpIHtcbiAgICBpZiAoYXNzZXQuZXh0bmFtZSAhPT0gJy5mYngnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG4gICAgaWYgKHVzZXJEYXRhLmxlZ2FjeUZieEltcG9ydGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgICh1c2VyRGF0YS5mYnggPz89IHt9KS51bml0Q29udmVyc2lvbiA9ICdoaWVyYXJjaHktbGV2ZWwnO1xufVxuXG4vKipcbiAqIEZCWCDlr7zlhaXlmaggdjEuMC4wLWFscGhhLjI3IOW8gOWni+W8leWFpeS6hiBgLS1wcmVmZXItbG9jYWwtdGltZS1zcGFuYCDpgInpobnvvIzlubbkuJTpu5jorqTkvb/nlKjkuoYgYHRydWVg77yMXG4gKiDogIzkuYvliY3kvb/nlKjnmoTmmK8gYGZhbHNlYOOAglxuICpcbiAqIEBwYXJhbSBhc3NldFxuICovXG5hc3luYyBmdW5jdGlvbiBtaWdyYXRlRmJ4Q29udmVydGVyUHJlZmVyTG9jYWxUaW1lU3Bhbihhc3NldDogQXNzZXQpIHtcbiAgICBpZiAoYXNzZXQuZXh0bmFtZSAhPT0gJy5mYngnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG4gICAgaWYgKHVzZXJEYXRhLmxlZ2FjeUZieEltcG9ydGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgICh1c2VyRGF0YS5mYnggPz89IHt9KS5wcmVmZXJMb2NhbFRpbWVTcGFuID0gZmFsc2U7XG59XG5cbi8qKlxuICogRkJYIOWvvOWFpeWZqCAzLjUuMSDlvJXlhaXkuoYgYHNtYXJ0TWF0ZXJpYWxFbmFibGVkYCDlsZ7mgKcs6L+Z5Liq5bGe5oCn5Zyo5pen54mI5pys55qE6LWE5rqQ5Lit5piv6buY6K6k5YWz6Zet55qELlxuICpcbiAqIEBwYXJhbSBhc3NldFxuICovXG5hc3luYyBmdW5jdGlvbiBtaWdyYXRlU21hcnRNYXRlcmlhbEVuYWJsZWQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgaWYgKGFzc2V0LmV4dG5hbWUgIT09ICcuZmJ4Jykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHVzZXJEYXRhID0gYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhO1xuICAgICh1c2VyRGF0YS5mYnggPz89IHt9KS5zbWFydE1hdGVyaWFsRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIOWcqCAzLjYueO+8jGdsVEYg5Lmf6ZyA6KaB5aKe5YqgIGBwcm9tb3RlU2luZ2xlUm9vdE5vZGVgIOmAiemhueOAguaJgOS7peaIkeS7rOaKiuS5i+WJjeS4k+WxnuS6jiBGQlgg55qE55u05o6l6L+B56e76L+H5p2l44CCXG4gKiDop4HvvJpodHRwczovL2dpdGh1Yi5jb20vY29jb3MvY29jb3MtZW5naW5lL2lzc3Vlcy8xMTg1OFxuICovXG5hc3luYyBmdW5jdGlvbiBtaWdyYXRlRkJYUHJvbW90ZVNpbmdsZVJvb3ROb2RlKGFzc2V0OiBBc3NldCkge1xuICAgIGlmIChhc3NldC5leHRuYW1lICE9PSAnLmZieCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyDov4Hnp7vliY3nmoQgVXNlckRhdGEg5pWw5o2u5qC85byPXG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBPbWl0PEdsVEZVc2VyRGF0YSwgJ2ZieCc+ICYge1xuICAgICAgICBmYng/OiBOb25OdWxsYWJsZTxHbFRGVXNlckRhdGFbJ2ZieCddPiAmIHtcbiAgICAgICAgICAgIHByb21vdGVTaW5nbGVSb290Tm9kZT86IGJvb2xlYW47XG4gICAgICAgIH07XG4gICAgfTtcbiAgICBpZiAodXNlckRhdGEuZmJ4Py5wcm9tb3RlU2luZ2xlUm9vdE5vZGUpIHtcbiAgICAgICAgdXNlckRhdGEucHJvbW90ZVNpbmdsZVJvb3ROb2RlID0gdXNlckRhdGEuZmJ4LnByb21vdGVTaW5nbGVSb290Tm9kZTtcbiAgICAgICAgZGVsZXRlIHVzZXJEYXRhLmZieC5wcm9tb3RlU2luZ2xlUm9vdE5vZGU7XG4gICAgfVxufVxuXG4vKipcbiAqIDMuNy4wIOW8leWFpeS6huaWsOeahOWHj+mdoueul+azle+8jOmAiemhueS4juS5i+WJjeWujOWFqOS4jeWQjO+8jOmcgOimgeWvueWtl+auteWtmOWCqOWBmuiwg+aVtFxuICogQHBhcmFtIGFzc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlTWVzaE9wdGltaXplck9wdGlvbihhc3NldDogQXNzZXQpIHtcbiAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhIGFzIEdsVEZVc2VyRGF0YTtcbiAgICAvLyDkvb/nlKjov4fljp/mnaXnmoTlh4/pnaLnrpfms5XvvIzlhYjkv53lrZjmlbDmja7vvIzlho3np7vpmaTml6fmlbDmja5cbiAgICBpZiAoIXVzZXJEYXRhLm1lc2hPcHRpbWl6ZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB1c2VyRGF0YS5tZXNoT3B0aW1pemVyID0ge1xuICAgICAgICBhbGdvcml0aG06ICdnbHRmcGFjaycsXG4gICAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBnbHRmcGFja09wdGlvbnM6IHVzZXJEYXRhLm1lc2hPcHRpbWl6ZXJPcHRpb25zIHx8IHt9LFxuICAgIH07XG4gICAgLy8g55u05o6l56e76Zmk5pen5pWw5o2uXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGRlbGV0ZSB1c2VyRGF0YS5tZXNoT3B0aW1pemVyT3B0aW9ucztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pZ3JhdGVGYnhNYXRjaE1lc2hOYW1lcyhhc3NldDogQXNzZXQpIHtcbiAgICBpZiAoYXNzZXQuZXh0bmFtZSAhPT0gJy5mYngnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGE7XG4gICAgKHVzZXJEYXRhLmZieCA/Pz0ge30pLm1hdGNoTWVzaE5hbWVzID0gZmFsc2U7XG59XG5cbi8qKlxuICogMy44LjEg5byV5YWl5LqG5paw55qE5YeP6Z2i6YCJ6aG577yM6ZyA6KaB5a+55a2X5q615a2Y5YKo5YGa6LCD5pW0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlTWVzaFNpbXBsaWZ5T3B0aW9uKGFzc2V0OiBBc3NldCkge1xuICAgIGNvbnN0IHVzZXJEYXRhID0gYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhO1xuICAgIC8vIOS9v+eUqOi/h+WOn+adpeeahOWHj+mdoueul+azle+8jOWFiOS/neWtmOaVsOaNru+8jOWGjeenu+mZpOaXp+aVsOaNrlxuICAgIGlmICghdXNlckRhdGEubWVzaE9wdGltaXplcikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3B0aW1pemVyID0gdXNlckRhdGEubWVzaE9wdGltaXplcjtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW1pemVyLnNpbXBsaWZ5T3B0aW9ucztcblxuICAgIHVzZXJEYXRhLm1lc2hTaW1wbGlmeSA9IHtcbiAgICAgICAgZW5hYmxlOiBvcHRpbWl6ZXIuZW5hYmxlLFxuICAgICAgICB0YXJnZXRSYXRpbzogb3B0aW9ucz8udGFyZ2V0UmF0aW8gfHwgMSxcbiAgICB9O1xuXG4gICAgZGVsZXRlIHVzZXJEYXRhLm1lc2hPcHRpbWl6ZXI7XG59XG4iXX0=