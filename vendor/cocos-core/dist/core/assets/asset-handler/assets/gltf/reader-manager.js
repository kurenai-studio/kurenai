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
exports.glTfReaderManager = void 0;
exports.getFbxFilePath = getFbxFilePath;
exports.getGltfFilePath = getGltfFilePath;
exports.getOptimizerPath = getOptimizerPath;
const utils_1 = require("../../utils");
const gltf_converter_1 = require("../utils/gltf-converter");
const validation_1 = require("./validation");
const fs_extra_1 = __importStar(require("fs-extra"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const global_1 = require("../../../../../global");
const asset_config_1 = __importDefault(require("../../../asset-config"));
const fbx_converter_1 = require("../utils/fbx-converter");
const model_convert_routine_1 = require("../utils/model-convert-routine");
const fbx_to_gltf_1 = require("./fbx-to-gltf");
class GlTfReaderManager {
    _map = new Map();
    /**
     *
     * @param asset
     * @param injectBufferDependencies 是否当创建 glTF 转换器的时候同时注入 glTF asset 对其引用的 buffer 文件的依赖。
     */
    async getOrCreate(asset, importVersion, injectBufferDependencies = false) {
        let result = this._map.get(asset.uuid);
        if (!result) {
            const { converter, referencedBufferFiles } = await createGlTfReader(asset, importVersion);
            result = converter;
            this._map.set(asset.uuid, result);
            if (injectBufferDependencies) {
                for (const referencedBufferFile of referencedBufferFiles) {
                    asset.depend(referencedBufferFile);
                }
            }
        }
        return result;
    }
    delete(asset) {
        this._map.delete(asset.uuid);
    }
}
exports.glTfReaderManager = new GlTfReaderManager();
async function getFbxFilePath(asset, importerVersion) {
    const userData = asset.userData;
    if (typeof userData.fbx?.smartMaterialEnabled === 'undefined') {
        (userData.fbx ??= {}).smartMaterialEnabled = await asset_config_1.default.getProject('fbx.material.smart') ?? false;
    }
    let outGLTFFile;
    if (userData.legacyFbxImporter) {
        outGLTFFile = await (0, fbx_to_gltf_1.fbxToGlTf)(asset, asset._assetDB, importerVersion);
    }
    else {
        const options = {};
        options.unitConversion = userData.fbx?.unitConversion;
        options.animationBakeRate = userData.fbx?.animationBakeRate;
        options.preferLocalTimeSpan = userData.fbx?.preferLocalTimeSpan;
        options.smartMaterialEnabled = userData.fbx?.smartMaterialEnabled ?? false;
        options.matchMeshNames = userData.fbx?.matchMeshNames ?? true;
        const fbxConverter = (0, fbx_converter_1.createFbxConverter)(options);
        const converted = await (0, model_convert_routine_1.modelConvertRoutine)('fbx.FBX-glTF-conv', asset, asset._assetDB, importerVersion, fbxConverter);
        if (!converted) {
            throw new Error(`Failed to import ${asset.source}`);
        }
        outGLTFFile = converted;
    }
    if (!userData.meshSimplify || !userData.meshSimplify.enable) {
        return outGLTFFile;
    }
    return await getOptimizerPath(asset, outGLTFFile, importerVersion, userData.meshSimplify);
}
async function getGltfFilePath(asset, importerVersion) {
    const userData = asset.userData;
    if (!userData.meshSimplify || !userData.meshSimplify.enable) {
        return asset.source;
    }
    return await getOptimizerPath(asset, asset.source, importerVersion, userData.meshSimplify);
}
function getOptimizerPath(asset, source, importerVersion, options) {
    if (options.algorithm === 'gltfpack' && options.gltfpackOptions) {
        return _getOptimizerPath(asset, source, importerVersion, options.gltfpackOptions);
    }
    // 新的减面库直接在 mesh 子资源上处理
    return source;
}
/**
 * gltfpackOptions
 * @param asset
 * @param source
 * @param options
 * @returns
 */
async function _getOptimizerPath(asset, source, importerVersion, options = {}) {
    const tmpDirDir = asset._assetDB.options.temp;
    const tmpDir = path_1.default.join(tmpDirDir, `gltfpack-${asset.uuid}`);
    fs_extra_1.default.ensureDirSync(tmpDir);
    const out = path_1.default.join(tmpDir, 'out.gltf');
    const statusPath = path_1.default.join(tmpDir, 'status.json');
    const expectedStatus = {
        mtimeMs: (await (0, fs_extra_1.stat)(asset.source)).mtimeMs,
        version: importerVersion,
        options: JSON.stringify(options),
    };
    if ((0, fs_extra_1.existsSync)(out) && (0, fs_extra_1.existsSync)(statusPath)) {
        try {
            const json = await (0, fs_extra_1.readJSON)(statusPath);
            if (json.mtimeMs === expectedStatus.mtimeMs &&
                json.version === expectedStatus.version &&
                json.options === expectedStatus.options) {
                return out;
            }
        }
        catch (error) { }
    }
    return new Promise((resolve) => {
        try {
            const cmd = path_1.default.join(global_1.GlobalPaths.workspace, 'node_modules/gltfpack/bin/gltfpack.js');
            const args = [
                '-i',
                source, // 输入 GLTF
                '-o',
                out, // 输出 GLTF
            ];
            const cVlaue = options.c;
            if (cVlaue === '1') {
                args.push('-c');
            }
            else if (cVlaue === '2') {
                args.push('-cc');
            }
            // textures
            if (options.te) {
                args.push('-te');
            } // 主缓冲
            if (options.tb) {
                args.push('-tb');
            } //
            if (options.tc) {
                args.push('-tc');
            }
            if (options.tq !== 50 && options.tq !== undefined) {
                args.push('-tq');
                args.push(options.tq);
            }
            if (options.tu) {
                args.push('-tu');
            }
            // simplification
            if (options.si !== 1 && options.si !== undefined) {
                args.push('-si');
                args.push(options.si);
            }
            if (options.sa) {
                args.push('-sa');
            }
            // vertices
            if (options.vp !== 14 && options.vp !== undefined) {
                args.push('-vp');
                args.push(options.vp);
            }
            if (options.vt !== 12 && options.vt !== undefined) {
                args.push('-vt');
                args.push(options.vt);
            }
            if (options.vn !== 8 && options.vn !== undefined) {
                args.push('-vn');
                args.push(options.vn);
            }
            // animation
            if (options.at !== 16 && options.at !== undefined) {
                args.push('-at');
                args.push(options.at);
            }
            if (options.ar !== 12 && options.ar !== undefined) {
                args.push('-ar');
                args.push(options.ar);
            }
            if (options.as !== 16 && options.as !== undefined) {
                args.push('-as');
                args.push(options.as);
            }
            if (options.af !== 30 && options.af !== undefined) {
                args.push('-af');
                args.push(options.af);
            }
            if (options.ac) {
                args.push('-ac');
            }
            // scene
            if (options.kn) {
                args.push('-kn');
            }
            if (options.ke) {
                args.push('-ke');
            }
            // miscellaneous
            if (options.cf) {
                args.push('-cf');
            }
            if (options.noq || options.noq === undefined) {
                args.push('-noq');
            }
            if (options.v || options.v === undefined) {
                args.push('-v');
            }
            // if (options.h) { args.push'-h'; }
            const child = (0, child_process_1.fork)(cmd, args);
            child.on('exit', async (code) => {
                // if (error) { console.error(`Error: ${error}`); }
                // if (stderr) { console.error(`Error: ${stderr}`); }
                // if (stdout) { console.log(`${stdout}`); }
                await fs_extra_1.default.writeFile(statusPath, JSON.stringify(expectedStatus, undefined, 2));
                resolve(out);
            });
        }
        catch (error) {
            console.error(error);
            resolve(source);
        }
    });
}
async function createGlTfReader(asset, importVersion) {
    let getFileFun;
    if (asset.meta.importer === 'fbx') {
        getFileFun = getFbxFilePath;
    }
    else {
        getFileFun = getGltfFilePath;
    }
    const glTfFilePath = await getFileFun(asset, importVersion);
    const isConvertedGlTf = glTfFilePath !== asset.source; // TODO: Better solution?
    // Validate.
    const userData = asset.userData;
    const skipValidation = userData.skipValidation === undefined ? true : userData.skipValidation;
    if (!skipValidation) {
        await (0, validation_1.validateGlTf)(glTfFilePath, asset.source);
    }
    // Create.
    const { glTF, buffers } = await (0, gltf_converter_1.readGltf)(glTfFilePath);
    const referencedBufferFiles = [];
    const loadedBuffers = await Promise.all(buffers.map(async (buffer) => {
        if (Buffer.isBuffer(buffer)) {
            return buffer;
        }
        else {
            if (!isConvertedGlTf) {
                // TODO: Better solution?
                referencedBufferFiles.push(buffer);
            }
            return await fs_extra_1.default.readFile(buffer);
        }
    }));
    function getRepOfGlTFResource(group, index) {
        if (!Array.isArray(glTF[group])) {
            return '';
        }
        else {
            let groupNameI18NKey;
            switch (group) {
                case 'meshes':
                    groupNameI18NKey = 'importer.gltf.gltf_asset_group_mesh';
                    break;
                case 'animations':
                    groupNameI18NKey = 'importer.gltf.gltf_asset_group_animation';
                    break;
                case 'nodes':
                    groupNameI18NKey = 'importer.gltf.gltf_asset_group_node';
                    break;
                case 'skins':
                    groupNameI18NKey = 'importer.gltf.gltf_asset_group_skin';
                    break;
                case 'samplers':
                    groupNameI18NKey = 'importer.gltf.gltf_asset_group_sampler';
                    break;
                default:
                    groupNameI18NKey = group;
                    break;
            }
            const asset = glTF[group][index];
            if (typeof asset.name === 'string' && asset.name) {
                return (0, utils_1.i18nTranslate)('importer.gltf.gltf_asset', {
                    group: (0, utils_1.i18nTranslate)(groupNameI18NKey),
                    name: asset.name,
                    index,
                });
            }
            else {
                return (0, utils_1.i18nTranslate)('importer.gltf.gltf_asset_no_name', {
                    group: (0, utils_1.i18nTranslate)(groupNameI18NKey),
                    index,
                });
            }
        }
    }
    const logger = (level, error, args) => {
        let message;
        switch (error) {
            case gltf_converter_1.GltfConverter.ConverterError.UnsupportedAlphaMode: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.unsupported_alpha_mode', {
                    material: getRepOfGlTFResource('materials', tArgs.material),
                    mode: tArgs.mode,
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.UnsupportedTextureParameter: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.unsupported_texture_parameter', {
                    sampler: '',
                    texture: getRepOfGlTFResource('textures', tArgs.texture),
                    type: (0, utils_1.i18nTranslate)(tArgs.type === 'minFilter'
                        ? 'importer.gltf.texture_parameter_min_filter'
                        : tArgs.type === 'magFilter'
                            ? 'importer.gltf.texture_parameter_mag_filter'
                            : 'importer.texture.wrap_mode'),
                    value: '',
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.UnsupportedChannelPath: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.unsupported_channel_path', {
                    animation: getRepOfGlTFResource('animations', tArgs.animation),
                    channel: tArgs.channel,
                    path: tArgs.path,
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.ReferenceSkinInDifferentScene: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.reference_skin_in_different_scene', {
                    node: getRepOfGlTFResource('nodes', tArgs.node),
                    skin: getRepOfGlTFResource('skins', tArgs.skin),
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.DisallowCubicSplineChannelSplit: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.disallow_cubic_spline_channel_split', {
                    animation: getRepOfGlTFResource('animations', tArgs.animation),
                    channel: tArgs.channel,
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.FailedToCalculateTangents: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)(tArgs.reason === 'normal'
                    ? 'importer.gltf.failed_to_calculate_tangents_due_to_lack_of_normals'
                    : 'importer.gltf.failed_to_calculate_tangents_due_to_lack_of_uvs', {
                    mesh: getRepOfGlTFResource('meshes', tArgs.mesh),
                    primitive: tArgs.primitive,
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.EmptyMorph: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.empty_morph', {
                    mesh: getRepOfGlTFResource('meshes', tArgs.mesh),
                    primitive: tArgs.primitive,
                });
                break;
            }
            case gltf_converter_1.GltfConverter.ConverterError.UnsupportedExtension: {
                const tArgs = args;
                message = (0, utils_1.i18nTranslate)('importer.gltf.unsupported_extension', {
                    name: tArgs.name,
                    // required, // 是否在 glTF 里被标记为“必需”
                });
                break;
            }
        }
        const link = (0, utils_1.linkToAssetTarget)(asset.uuid);
        switch (level) {
            case gltf_converter_1.GltfConverter.LogLevel.Info:
            default:
                console.log(message, link);
                break;
            case gltf_converter_1.GltfConverter.LogLevel.Warning:
                console.warn(message, link);
                break;
            case gltf_converter_1.GltfConverter.LogLevel.Error:
                console.error(message, link);
                break;
            case gltf_converter_1.GltfConverter.LogLevel.Debug:
                console.debug(message, link);
                break;
        }
    };
    const converter = new gltf_converter_1.GltfConverter(glTF, loadedBuffers, glTfFilePath, {
        logger,
        userData: asset.userData,
        promoteSingleRootNode: asset.userData?.promoteSingleRootNode ?? false,
        generateLightmapUVNode: asset.userData?.generateLightmapUVNode ?? false,
    });
    return { converter, referencedBufferFiles };
}
