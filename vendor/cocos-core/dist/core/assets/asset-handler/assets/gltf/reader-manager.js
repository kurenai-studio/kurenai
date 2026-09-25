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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZGVyLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvZ2x0Zi9yZWFkZXItbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2Q0Esd0NBMkJDO0FBQ0QsMENBTUM7QUFFRCw0Q0FPQztBQXRGRCx1Q0FBK0Q7QUFDL0QsNERBQWtFO0FBQ2xFLDZDQUE0QztBQUM1QyxxREFBMEQ7QUFDMUQsaURBQXFDO0FBQ3JDLGdEQUF3QjtBQUN4QixrREFBb0Q7QUFDcEQseUVBQWdEO0FBQ2hELDBEQUE0RDtBQUM1RCwwRUFBcUU7QUFDckUsK0NBQTBDO0FBRzFDLE1BQU0saUJBQWlCO0lBQ1gsSUFBSSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO0lBRWhEOzs7O09BSUc7SUFDSSxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQVksRUFBRSxhQUFxQixFQUFFLHdCQUF3QixHQUFHLEtBQUs7UUFDMUYsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNWLE1BQU0sRUFBRSxTQUFTLEVBQUUscUJBQXFCLEVBQUUsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztZQUMxRixNQUFNLEdBQUcsU0FBUyxDQUFDO1lBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEMsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO2dCQUMzQixLQUFLLE1BQU0sb0JBQW9CLElBQUkscUJBQXFCLEVBQUUsQ0FBQztvQkFDdkQsS0FBSyxDQUFDLE1B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MUIsQ0FBQztZQUNELElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsQ0FBQztZQUNELElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsQ0FBQztZQUVELFlBQVk7WUFDWixJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FB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LE1BQU07UUFDZCxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0lBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSw4QkFBYSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFO1FBQ25FLE1BQU07UUFDTixRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQXdCO1FBQ3hDLHFCQUFxQixFQUFHLEtBQUssQ0FBQyxRQUF5QixFQUFFLHFCQUFxQixJQUFJLEtBQUs7UUFDdkYsc0JBQXNCLEVBQUcsS0FBSyxDQUFDLFFBQXlCLEVBQUUsc0JBQXNCLElBQUksS0FBSztLQUM1RixDQUFDLENBQUM7SUFFSCxPQUFPLEVBQUUsU0FBUyxFQUFFLHFCQUFxQixFQUFFLENBQUM7QUFDaEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IEdsdGZwYWNrT3B0aW9ucywgR2xURlVzZXJEYXRhLCBNZXNoT3B0aW1pemVyT3B0aW9uIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5pbXBvcnQgeyBpMThuVHJhbnNsYXRlLCBsaW5rVG9Bc3NldFRhcmdldCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IEdsdGZDb252ZXJ0ZXIsIHJlYWRHbHRmIH0gZnJvbSAnLi4vdXRpbHMvZ2x0Zi1jb252ZXJ0ZXInO1xuaW1wb3J0IHsgdmFsaWRhdGVHbFRmIH0gZnJvbSAnLi92YWxpZGF0aW9uJztcbmltcG9ydCBmcywgeyBleGlzdHNTeW5jLCByZWFkSlNPTiwgc3RhdCB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGZvcmsgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgR2xvYmFsUGF0aHMgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9nbG9iYWwnO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4uLy4uLy4uL2Fzc2V0LWNvbmZpZyc7XG5pbXBvcnQgeyBjcmVhdGVGYnhDb252ZXJ0ZXIgfSBmcm9tICcuLi91dGlscy9mYngtY29udmVydGVyJztcbmltcG9ydCB7IG1vZGVsQ29udmVydFJvdXRpbmUgfSBmcm9tICcuLi91dGlscy9tb2RlbC1jb252ZXJ0LXJvdXRpbmUnO1xuaW1wb3J0IHsgZmJ4VG9HbFRmIH0gZnJvbSAnLi9mYngtdG8tZ2x0Zic7XG5pbXBvcnQgeyBJMThuS2V5cyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2kxOG4vdHlwZXMvZ2VuZXJhdGVkJztcblxuY2xhc3MgR2xUZlJlYWRlck1hbmFnZXIge1xuICAgIHByaXZhdGUgX21hcCA9IG5ldyBNYXA8c3RyaW5nLCBHbHRmQ29udmVydGVyPigpO1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgKiBAcGFyYW0gaW5qZWN0QnVmZmVyRGVwZW5kZW5jaWVzIOaYr+WQpuW9k+WIm+W7uiBnbFRGIOi9rOaNouWZqOeahOaXtuWAmeWQjOaXtuazqOWFpSBnbFRGIGFzc2V0IOWvueWFtuW8leeUqOeahCBidWZmZXIg5paH5Lu255qE5L6d6LWW44CCXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGdldE9yQ3JlYXRlKGFzc2V0OiBBc3NldCwgaW1wb3J0VmVyc2lvbjogc3RyaW5nLCBpbmplY3RCdWZmZXJEZXBlbmRlbmNpZXMgPSBmYWxzZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5fbWFwLmdldChhc3NldC51dWlkKTtcbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgY29udmVydGVyLCByZWZlcmVuY2VkQnVmZmVyRmlsZXMgfSA9IGF3YWl0IGNyZWF0ZUdsVGZSZWFkZXIoYXNzZXQsIGltcG9ydFZlcnNpb24pO1xuICAgICAgICAgICAgcmVzdWx0ID0gY29udmVydGVyO1xuICAgICAgICAgICAgdGhpcy5fbWFwLnNldChhc3NldC51dWlkLCByZXN1bHQpO1xuICAgICAgICAgICAgaWYgKGluamVjdEJ1ZmZlckRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcmVmZXJlbmNlZEJ1ZmZlckZpbGUgb2YgcmVmZXJlbmNlZEJ1ZmZlckZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0LmRlcGVuZChyZWZlcmVuY2VkQnVmZmVyRmlsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZShhc3NldDogQXNzZXQpIHtcbiAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShhc3NldC51dWlkKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBnbFRmUmVhZGVyTWFuYWdlciA9IG5ldyBHbFRmUmVhZGVyTWFuYWdlcigpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RmJ4RmlsZVBhdGgoYXNzZXQ6IEFzc2V0LCBpbXBvcnRlclZlcnNpb246IHN0cmluZywpIHtcbiAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhIGFzIEdsVEZVc2VyRGF0YTtcbiAgICBpZiAodHlwZW9mIHVzZXJEYXRhLmZieD8uc21hcnRNYXRlcmlhbEVuYWJsZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICh1c2VyRGF0YS5mYnggPz89IHt9KS5zbWFydE1hdGVyaWFsRW5hYmxlZCA9IGF3YWl0IGFzc2V0Q29uZmlnLmdldFByb2plY3Q8Ym9vbGVhbj4oJ2ZieC5tYXRlcmlhbC5zbWFydCcpID8/IGZhbHNlO1xuICAgIH1cbiAgICBsZXQgb3V0R0xURkZpbGU6IHN0cmluZztcbiAgICBpZiAodXNlckRhdGEubGVnYWN5RmJ4SW1wb3J0ZXIpIHtcbiAgICAgICAgb3V0R0xURkZpbGUgPSBhd2FpdCBmYnhUb0dsVGYoYXNzZXQsIGFzc2V0Ll9hc3NldERCLCBpbXBvcnRlclZlcnNpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnM6IFBhcmFtZXRlcnM8dHlwZW9mIGNyZWF0ZUZieENvbnZlcnRlcj5bMF0gPSB7fTtcbiAgICAgICAgb3B0aW9ucy51bml0Q29udmVyc2lvbiA9IHVzZXJEYXRhLmZieD8udW5pdENvbnZlcnNpb247XG4gICAgICAgIG9wdGlvbnMuYW5pbWF0aW9uQmFrZVJhdGUgPSB1c2VyRGF0YS5mYng/LmFuaW1hdGlvbkJha2VSYXRlO1xuICAgICAgICBvcHRpb25zLnByZWZlckxvY2FsVGltZVNwYW4gPSB1c2VyRGF0YS5mYng/LnByZWZlckxvY2FsVGltZVNwYW47XG4gICAgICAgIG9wdGlvbnMuc21hcnRNYXRlcmlhbEVuYWJsZWQgPSB1c2VyRGF0YS5mYng/LnNtYXJ0TWF0ZXJpYWxFbmFibGVkID8/IGZhbHNlO1xuICAgICAgICBvcHRpb25zLm1hdGNoTWVzaE5hbWVzID0gdXNlckRhdGEuZmJ4Py5tYXRjaE1lc2hOYW1lcyA/PyB0cnVlO1xuICAgICAgICBjb25zdCBmYnhDb252ZXJ0ZXIgPSBjcmVhdGVGYnhDb252ZXJ0ZXIob3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IG1vZGVsQ29udmVydFJvdXRpbmUoJ2ZieC5GQlgtZ2xURi1jb252JywgYXNzZXQsIGFzc2V0Ll9hc3NldERCLCBpbXBvcnRlclZlcnNpb24sIGZieENvbnZlcnRlcik7XG4gICAgICAgIGlmICghY29udmVydGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBpbXBvcnQgJHthc3NldC5zb3VyY2V9YCk7XG4gICAgICAgIH1cbiAgICAgICAgb3V0R0xURkZpbGUgPSBjb252ZXJ0ZWQ7XG4gICAgfVxuXG4gICAgaWYgKCF1c2VyRGF0YS5tZXNoU2ltcGxpZnkgfHwgIXVzZXJEYXRhLm1lc2hTaW1wbGlmeS5lbmFibGUpIHtcbiAgICAgICAgcmV0dXJuIG91dEdMVEZGaWxlO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgZ2V0T3B0aW1pemVyUGF0aChhc3NldCwgb3V0R0xURkZpbGUsIGltcG9ydGVyVmVyc2lvbiwgdXNlckRhdGEubWVzaFNpbXBsaWZ5KTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHbHRmRmlsZVBhdGgoYXNzZXQ6IEFzc2V0LCBpbXBvcnRlclZlcnNpb246IHN0cmluZykge1xuICAgIGNvbnN0IHVzZXJEYXRhID0gYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhO1xuICAgIGlmICghdXNlckRhdGEubWVzaFNpbXBsaWZ5IHx8ICF1c2VyRGF0YS5tZXNoU2ltcGxpZnkuZW5hYmxlKSB7XG4gICAgICAgIHJldHVybiBhc3NldC5zb3VyY2U7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCBnZXRPcHRpbWl6ZXJQYXRoKGFzc2V0LCBhc3NldC5zb3VyY2UsIGltcG9ydGVyVmVyc2lvbiwgdXNlckRhdGEubWVzaFNpbXBsaWZ5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9wdGltaXplclBhdGgoYXNzZXQ6IEFzc2V0LCBzb3VyY2U6IHN0cmluZywgaW1wb3J0ZXJWZXJzaW9uOiBzdHJpbmcsIG9wdGlvbnM6IE1lc2hPcHRpbWl6ZXJPcHRpb24pIHtcbiAgICBpZiAob3B0aW9ucy5hbGdvcml0aG0gPT09ICdnbHRmcGFjaycgJiYgb3B0aW9ucy5nbHRmcGFja09wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9nZXRPcHRpbWl6ZXJQYXRoKGFzc2V0LCBzb3VyY2UsIGltcG9ydGVyVmVyc2lvbiwgb3B0aW9ucy5nbHRmcGFja09wdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIOaWsOeahOWHj+mdouW6k+ebtOaOpeWcqCBtZXNoIOWtkOi1hOa6kOS4iuWkhOeQhlxuICAgIHJldHVybiBzb3VyY2U7XG59XG5cbi8qKlxuICogZ2x0ZnBhY2tPcHRpb25zXG4gKiBAcGFyYW0gYXNzZXRcbiAqIEBwYXJhbSBzb3VyY2VcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcmV0dXJuc1xuICovXG5hc3luYyBmdW5jdGlvbiBfZ2V0T3B0aW1pemVyUGF0aChhc3NldDogQXNzZXQsIHNvdXJjZTogc3RyaW5nLCBpbXBvcnRlclZlcnNpb246IHN0cmluZywgb3B0aW9uczogR2x0ZnBhY2tPcHRpb25zID0ge30pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHRtcERpckRpciA9IGFzc2V0Ll9hc3NldERCLm9wdGlvbnMudGVtcDtcbiAgICBjb25zdCB0bXBEaXIgPSBwYXRoLmpvaW4odG1wRGlyRGlyLCBgZ2x0ZnBhY2stJHthc3NldC51dWlkfWApO1xuICAgIGZzLmVuc3VyZURpclN5bmModG1wRGlyKTtcblxuICAgIGNvbnN0IG91dCA9IHBhdGguam9pbih0bXBEaXIsICdvdXQuZ2x0ZicpO1xuICAgIGNvbnN0IHN0YXR1c1BhdGggPSBwYXRoLmpvaW4odG1wRGlyLCAnc3RhdHVzLmpzb24nKTtcblxuICAgIGNvbnN0IGV4cGVjdGVkU3RhdHVzID0ge1xuICAgICAgICBtdGltZU1zOiAoYXdhaXQgc3RhdChhc3NldC5zb3VyY2UpKS5tdGltZU1zLFxuICAgICAgICB2ZXJzaW9uOiBpbXBvcnRlclZlcnNpb24sXG4gICAgICAgIG9wdGlvbnM6IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpLFxuICAgIH07XG5cbiAgICBpZiAoZXhpc3RzU3luYyhvdXQpICYmIGV4aXN0c1N5bmMoc3RhdHVzUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZWFkSlNPTihzdGF0dXNQYXRoKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBqc29uLm10aW1lTXMgPT09IGV4cGVjdGVkU3RhdHVzLm10aW1lTXMgJiZcbiAgICAgICAgICAgICAgICBqc29uLnZlcnNpb24gPT09IGV4cGVjdGVkU3RhdHVzLnZlcnNpb24gJiZcbiAgICAgICAgICAgICAgICBqc29uLm9wdGlvbnMgPT09IGV4cGVjdGVkU3RhdHVzLm9wdGlvbnNcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNtZCA9IHBhdGguam9pbihHbG9iYWxQYXRocy53b3Jrc3BhY2UsICdub2RlX21vZHVsZXMvZ2x0ZnBhY2svYmluL2dsdGZwYWNrLmpzJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICAgICAgICAgICAgJy1pJyxcbiAgICAgICAgICAgICAgICBzb3VyY2UsIC8vIOi+k+WFpSBHTFRGXG4gICAgICAgICAgICAgICAgJy1vJyxcbiAgICAgICAgICAgICAgICBvdXQsIC8vIOi+k+WHuiBHTFRGXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBjb25zdCBjVmxhdWUgPSBvcHRpb25zLmM7XG4gICAgICAgICAgICBpZiAoY1ZsYXVlID09PSAnMScpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1jJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNWbGF1ZSA9PT0gJzInKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCctY2MnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdGV4dHVyZXNcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRlKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCctdGUnKTtcbiAgICAgICAgICAgIH0gLy8g5Li757yT5YayXG4gICAgICAgICAgICBpZiAob3B0aW9ucy50Yikge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCgnLXRiJyk7XG4gICAgICAgICAgICB9IC8vXG4gICAgICAgICAgICBpZiAob3B0aW9ucy50Yykge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCgnLXRjJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50cSAhPT0gNTAgJiYgb3B0aW9ucy50cSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCctdHEnKTtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2gob3B0aW9ucy50cSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50dSkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCgnLXR1Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNpbXBsaWZpY2F0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zaSAhPT0gMSAmJiBvcHRpb25zLnNpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1zaScpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLnNpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNhKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCctc2EnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdmVydGljZXNcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnZwICE9PSAxNCAmJiBvcHRpb25zLnZwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy12cCcpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLnZwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnZ0ICE9PSAxMiAmJiBvcHRpb25zLnZ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy12dCcpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLnZ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnZuICE9PSA4ICYmIG9wdGlvbnMudm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCgnLXZuJyk7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKG9wdGlvbnMudm4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhbmltYXRpb25cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmF0ICE9PSAxNiAmJiBvcHRpb25zLmF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1hdCcpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLmF0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFyICE9PSAxMiAmJiBvcHRpb25zLmFyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1hcicpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLmFyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFzICE9PSAxNiAmJiBvcHRpb25zLmFzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1hcycpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLmFzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFmICE9PSAzMCAmJiBvcHRpb25zLmFmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1hZicpO1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChvcHRpb25zLmFmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFjKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCctYWMnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2NlbmVcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmtuKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCcta24nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmtlKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKCcta2UnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbWlzY2VsbGFuZW91c1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2YpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1jZicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubm9xIHx8IG9wdGlvbnMubm9xID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy1ub3EnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnYgfHwgb3B0aW9ucy52ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goJy12Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAob3B0aW9ucy5oKSB7IGFyZ3MucHVzaCctaCc7IH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBmb3JrKGNtZCwgYXJncyk7XG4gICAgICAgICAgICBjaGlsZC5vbignZXhpdCcsIGFzeW5jIChjb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKGVycm9yKSB7IGNvbnNvbGUuZXJyb3IoYEVycm9yOiAke2Vycm9yfWApOyB9XG4gICAgICAgICAgICAgICAgLy8gaWYgKHN0ZGVycikgeyBjb25zb2xlLmVycm9yKGBFcnJvcjogJHtzdGRlcnJ9YCk7IH1cbiAgICAgICAgICAgICAgICAvLyBpZiAoc3Rkb3V0KSB7IGNvbnNvbGUubG9nKGAke3N0ZG91dH1gKTsgfVxuXG4gICAgICAgICAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHN0YXR1c1BhdGgsIEpTT04uc3RyaW5naWZ5KGV4cGVjdGVkU3RhdHVzLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG91dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5hc3luYyBmdW5jdGlvbiBjcmVhdGVHbFRmUmVhZGVyKGFzc2V0OiBBc3NldCwgaW1wb3J0VmVyc2lvbjogc3RyaW5nKSB7XG4gICAgbGV0IGdldEZpbGVGdW46IEZ1bmN0aW9uO1xuICAgIGlmIChhc3NldC5tZXRhLmltcG9ydGVyID09PSAnZmJ4Jykge1xuICAgICAgICBnZXRGaWxlRnVuID0gZ2V0RmJ4RmlsZVBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0RmlsZUZ1biA9IGdldEdsdGZGaWxlUGF0aDtcbiAgICB9XG5cbiAgICBjb25zdCBnbFRmRmlsZVBhdGg6IHN0cmluZyA9IGF3YWl0IGdldEZpbGVGdW4oYXNzZXQsIGltcG9ydFZlcnNpb24pO1xuXG4gICAgY29uc3QgaXNDb252ZXJ0ZWRHbFRmID0gZ2xUZkZpbGVQYXRoICE9PSBhc3NldC5zb3VyY2U7IC8vIFRPRE86IEJldHRlciBzb2x1dGlvbj9cblxuICAgIC8vIFZhbGlkYXRlLlxuICAgIGNvbnN0IHVzZXJEYXRhID0gYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhO1xuICAgIGNvbnN0IHNraXBWYWxpZGF0aW9uID0gdXNlckRhdGEuc2tpcFZhbGlkYXRpb24gPT09IHVuZGVmaW5lZCA/IHRydWUgOiB1c2VyRGF0YS5za2lwVmFsaWRhdGlvbjtcbiAgICBpZiAoIXNraXBWYWxpZGF0aW9uKSB7XG4gICAgICAgIGF3YWl0IHZhbGlkYXRlR2xUZihnbFRmRmlsZVBhdGgsIGFzc2V0LnNvdXJjZSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlLlxuICAgIGNvbnN0IHsgZ2xURiwgYnVmZmVycyB9ID0gYXdhaXQgcmVhZEdsdGYoZ2xUZkZpbGVQYXRoKTtcblxuICAgIGNvbnN0IHJlZmVyZW5jZWRCdWZmZXJGaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBsb2FkZWRCdWZmZXJzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIGJ1ZmZlcnMubWFwKGFzeW5jIChidWZmZXIpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgICAgICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihidWZmZXIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0NvbnZlcnRlZEdsVGYpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogQmV0dGVyIHNvbHV0aW9uP1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VkQnVmZmVyRmlsZXMucHVzaChidWZmZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgZnMucmVhZEZpbGUoYnVmZmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgKTtcblxuICAgIGZ1bmN0aW9uIGdldFJlcE9mR2xURlJlc291cmNlKGdyb3VwOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGdsVEZbZ3JvdXBdKSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IGdyb3VwTmFtZUkxOE5LZXk6IEkxOG5LZXlzO1xuICAgICAgICAgICAgc3dpdGNoIChncm91cCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ21lc2hlcyc6XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwTmFtZUkxOE5LZXkgPSAnaW1wb3J0ZXIuZ2x0Zi5nbHRmX2Fzc2V0X2dyb3VwX21lc2gnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRpb25zJzpcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBOYW1lSTE4TktleSA9ICdpbXBvcnRlci5nbHRmLmdsdGZfYXNzZXRfZ3JvdXBfYW5pbWF0aW9uJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9kZXMnOlxuICAgICAgICAgICAgICAgICAgICBncm91cE5hbWVJMThOS2V5ID0gJ2ltcG9ydGVyLmdsdGYuZ2x0Zl9hc3NldF9ncm91cF9ub2RlJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2tpbnMnOlxuICAgICAgICAgICAgICAgICAgICBncm91cE5hbWVJMThOS2V5ID0gJ2ltcG9ydGVyLmdsdGYuZ2x0Zl9hc3NldF9ncm91cF9za2luJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2FtcGxlcnMnOlxuICAgICAgICAgICAgICAgICAgICBncm91cE5hbWVJMThOS2V5ID0gJ2ltcG9ydGVyLmdsdGYuZ2x0Zl9hc3NldF9ncm91cF9zYW1wbGVyJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBOYW1lSTE4TktleSA9IGdyb3VwIGFzIEkxOG5LZXlzO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gZ2xURltncm91cF1baW5kZXhdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhc3NldC5uYW1lID09PSAnc3RyaW5nJyAmJiBhc3NldC5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmdsdGYuZ2x0Zl9hc3NldCcsIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGkxOG5UcmFuc2xhdGUoZ3JvdXBOYW1lSTE4TktleSksXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZ2x0Zi5nbHRmX2Fzc2V0X25vX25hbWUnLCB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBpMThuVHJhbnNsYXRlKGdyb3VwTmFtZUkxOE5LZXkpLFxuICAgICAgICAgICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxvZ2dlcjogR2x0ZkNvbnZlcnRlci5Mb2dnZXIgPSAobGV2ZWwsIGVycm9yLCBhcmdzKSA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgIHN3aXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNhc2UgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5VbnN1cHBvcnRlZEFscGhhTW9kZToge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRBcmdzID0gYXJncyBhcyBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yQXJndW1lbnRGb3JtYXRbR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5VbnN1cHBvcnRlZEFscGhhTW9kZV07XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmdsdGYudW5zdXBwb3J0ZWRfYWxwaGFfbW9kZScsIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0ZXJpYWw6IGdldFJlcE9mR2xURlJlc291cmNlKCdtYXRlcmlhbHMnLCB0QXJncy5tYXRlcmlhbCksXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IHRBcmdzLm1vZGUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRUZXh0dXJlUGFyYW1ldGVyOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdEFyZ3MgPSBhcmdzIGFzIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3JBcmd1bWVudEZvcm1hdFtHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkVGV4dHVyZVBhcmFtZXRlcl07XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmdsdGYudW5zdXBwb3J0ZWRfdGV4dHVyZV9wYXJhbWV0ZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZXI6ICcnLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlOiBnZXRSZXBPZkdsVEZSZXNvdXJjZSgndGV4dHVyZXMnLCB0QXJncy50ZXh0dXJlKSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaTE4blRyYW5zbGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHRBcmdzLnR5cGUgPT09ICdtaW5GaWx0ZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnaW1wb3J0ZXIuZ2x0Zi50ZXh0dXJlX3BhcmFtZXRlcl9taW5fZmlsdGVyJyAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0QXJncy50eXBlID09PSAnbWFnRmlsdGVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdpbXBvcnRlci5nbHRmLnRleHR1cmVfcGFyYW1ldGVyX21hZ19maWx0ZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2ltcG9ydGVyLnRleHR1cmUud3JhcF9tb2RlJyxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkQ2hhbm5lbFBhdGg6IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0QXJncyA9IGFyZ3MgYXMgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvckFyZ3VtZW50Rm9ybWF0W0dsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuVW5zdXBwb3J0ZWRDaGFubmVsUGF0aF07XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmdsdGYudW5zdXBwb3J0ZWRfY2hhbm5lbF9wYXRoJywge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGdldFJlcE9mR2xURlJlc291cmNlKCdhbmltYXRpb25zJywgdEFyZ3MuYW5pbWF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbDogdEFyZ3MuY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogdEFyZ3MucGF0aCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5SZWZlcmVuY2VTa2luSW5EaWZmZXJlbnRTY2VuZToge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRBcmdzID1cbiAgICAgICAgICAgICAgICAgICAgYXJncyBhcyBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yQXJndW1lbnRGb3JtYXRbR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5SZWZlcmVuY2VTa2luSW5EaWZmZXJlbnRTY2VuZV07XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmdsdGYucmVmZXJlbmNlX3NraW5faW5fZGlmZmVyZW50X3NjZW5lJywge1xuICAgICAgICAgICAgICAgICAgICBub2RlOiBnZXRSZXBPZkdsVEZSZXNvdXJjZSgnbm9kZXMnLCB0QXJncy5ub2RlKSxcbiAgICAgICAgICAgICAgICAgICAgc2tpbjogZ2V0UmVwT2ZHbFRGUmVzb3VyY2UoJ3NraW5zJywgdEFyZ3Muc2tpbiksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuRGlzYWxsb3dDdWJpY1NwbGluZUNoYW5uZWxTcGxpdDoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRBcmdzID1cbiAgICAgICAgICAgICAgICAgICAgYXJncyBhcyBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yQXJndW1lbnRGb3JtYXRbR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5EaXNhbGxvd0N1YmljU3BsaW5lQ2hhbm5lbFNwbGl0XTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZ2x0Zi5kaXNhbGxvd19jdWJpY19zcGxpbmVfY2hhbm5lbF9zcGxpdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnZXRSZXBPZkdsVEZSZXNvdXJjZSgnYW5pbWF0aW9ucycsIHRBcmdzLmFuaW1hdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIGNoYW5uZWw6IHRBcmdzLmNoYW5uZWwsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3IuRmFpbGVkVG9DYWxjdWxhdGVUYW5nZW50czoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRBcmdzID0gYXJncyBhcyBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yQXJndW1lbnRGb3JtYXRbR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5GYWlsZWRUb0NhbGN1bGF0ZVRhbmdlbnRzXTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaTE4blRyYW5zbGF0ZShcbiAgICAgICAgICAgICAgICAgICAgdEFyZ3MucmVhc29uID09PSAnbm9ybWFsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgPyAnaW1wb3J0ZXIuZ2x0Zi5mYWlsZWRfdG9fY2FsY3VsYXRlX3RhbmdlbnRzX2R1ZV90b19sYWNrX29mX25vcm1hbHMnXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICdpbXBvcnRlci5nbHRmLmZhaWxlZF90b19jYWxjdWxhdGVfdGFuZ2VudHNfZHVlX3RvX2xhY2tfb2ZfdXZzJyxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzaDogZ2V0UmVwT2ZHbFRGUmVzb3VyY2UoJ21lc2hlcycsIHRBcmdzLm1lc2gpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWl0aXZlOiB0QXJncy5wcmltaXRpdmUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgR2x0ZkNvbnZlcnRlci5Db252ZXJ0ZXJFcnJvci5FbXB0eU1vcnBoOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdEFyZ3MgPSBhcmdzIGFzIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3JBcmd1bWVudEZvcm1hdFtHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLkVtcHR5TW9ycGhdO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBpMThuVHJhbnNsYXRlKCdpbXBvcnRlci5nbHRmLmVtcHR5X21vcnBoJywge1xuICAgICAgICAgICAgICAgICAgICBtZXNoOiBnZXRSZXBPZkdsVEZSZXNvdXJjZSgnbWVzaGVzJywgdEFyZ3MubWVzaCksXG4gICAgICAgICAgICAgICAgICAgIHByaW1pdGl2ZTogdEFyZ3MucHJpbWl0aXZlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkRXh0ZW5zaW9uOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdEFyZ3MgPSBhcmdzIGFzIEdsdGZDb252ZXJ0ZXIuQ29udmVydGVyRXJyb3JBcmd1bWVudEZvcm1hdFtHbHRmQ29udmVydGVyLkNvbnZlcnRlckVycm9yLlVuc3VwcG9ydGVkRXh0ZW5zaW9uXTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZ2x0Zi51bnN1cHBvcnRlZF9leHRlbnNpb24nLCB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHRBcmdzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcXVpcmVkLCAvLyDmmK/lkKblnKggZ2xURiDph4zooqvmoIforrDkuLrigJzlv4XpnIDigJ1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxpbmsgPSBsaW5rVG9Bc3NldFRhcmdldChhc3NldC51dWlkKTtcbiAgICAgICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkxvZ0xldmVsLkluZm86XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UsIGxpbmspO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkxvZ0xldmVsLldhcm5pbmc6XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UsIGxpbmspO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBHbHRmQ29udmVydGVyLkxvZ0xldmVsLkVycm9yOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSwgbGluayk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEdsdGZDb252ZXJ0ZXIuTG9nTGV2ZWwuRGVidWc6XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhtZXNzYWdlLCBsaW5rKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBjb252ZXJ0ZXIgPSBuZXcgR2x0ZkNvbnZlcnRlcihnbFRGLCBsb2FkZWRCdWZmZXJzLCBnbFRmRmlsZVBhdGgsIHtcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICB1c2VyRGF0YTogYXNzZXQudXNlckRhdGEgYXMgR2xURlVzZXJEYXRhLFxuICAgICAgICBwcm9tb3RlU2luZ2xlUm9vdE5vZGU6IChhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGEpPy5wcm9tb3RlU2luZ2xlUm9vdE5vZGUgPz8gZmFsc2UsXG4gICAgICAgIGdlbmVyYXRlTGlnaHRtYXBVVk5vZGU6IChhc3NldC51c2VyRGF0YSBhcyBHbFRGVXNlckRhdGEpPy5nZW5lcmF0ZUxpZ2h0bWFwVVZOb2RlID8/IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHsgY29udmVydGVyLCByZWZlcmVuY2VkQnVmZmVyRmlsZXMgfTtcbn1cbiJdfQ==