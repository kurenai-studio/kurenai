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
exports.GltfImageHandler = void 0;
const DataURI = __importStar(require("@cocos/data-uri"));
const fs_extra_1 = __importStar(require("fs-extra"));
const path_1 = __importStar(require("path"));
const urijs_1 = __importDefault(require("urijs"));
const url_1 = __importDefault(require("url"));
const image_mics_1 = require("../image/image-mics");
const uri_utils_1 = require("../utils/uri-utils");
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
const match_image_type_pattern_1 = require("../utils/match-image-type-pattern");
const image_mime_type_to_ext_1 = require("../utils/image-mime-type-to-ext");
const base64_1 = require("../utils/base64");
const cc_1 = require("cc");
const utils_2 = require("../../utils");
const utils_3 = require("../image/utils");
const fbx_1 = __importDefault(require("../fbx"));
const gltf_1 = __importDefault(require("../gltf"));
exports.GltfImageHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'gltf-embeded-image',
    // 引擎内对应的类型
    assetType: 'cc.ImageAsset',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.3',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            if (!asset.parent) {
                return false;
            }
            const imageIndex = asset.userData.gltfIndex;
            let version = gltf_1.default.importer.version;
            if (asset.parent.meta.importer === 'fbx') {
                version = fbx_1.default.importer.version;
            }
            const gltfConverter = await reader_manager_1.glTfReaderManager.getOrCreate(asset.parent, version);
            const glTFImage = gltfConverter.gltf.images[imageIndex];
            // The `mimeType` is the mime type which is recorded on or deduced from transport layer.
            let image;
            const tryLoadFile = async (fileURL) => {
                try {
                    const imagePath = url_1.default.fileURLToPath(fileURL);
                    const imageData = await fs_extra_1.default.readFile(imagePath);
                    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#file-extensions-and-mime-types
                    // > Implementations should use the image type pattern matching algorithm
                    // > from the MIME Sniffing Standard to detect PNG and JPEG images as file extensions
                    // > may be unavailable in some contexts.
                    const mimeType = (0, match_image_type_pattern_1.matchImageTypePattern)(imageData);
                    image = { data: imageData, mimeType, extName: path_1.default.extname(imagePath) };
                }
                catch (error) {
                    console.error((0, utils_1.i18nTranslate)('importer.gltf.failed_to_load_image', {
                        url: fileURL,
                        reason: error,
                    }), (0, utils_1.linkToAssetTarget)(asset.uuid));
                }
            };
            const resolved = asset.getSwapSpace().resolved;
            if (resolved) {
                const fileURL = url_1.default.pathToFileURL(resolved);
                await tryLoadFile(fileURL.href);
            }
            else {
                if (glTFImage.bufferView !== undefined) {
                    image = {
                        data: gltfConverter.readImageInBufferView(gltfConverter.gltf.bufferViews[glTFImage.bufferView]),
                    };
                }
                else if (glTFImage.uri !== undefined) {
                    // Note: should not be `asset.parent.source`, which may be path to fbx.
                    const glTFFilePath = gltfConverter.path;
                    const badURI = (error) => {
                        console.error(`The uri "${glTFImage.uri}" provided by model file${glTFFilePath} is not correct: ${error}`);
                    };
                    if (glTFImage.uri.startsWith('data:')) {
                        try {
                            const dataURI = DataURI.parse(glTFImage.uri);
                            if (!dataURI) {
                                throw new Error(`Unable to parse data uri "${glTFImage.uri}"`);
                            }
                            image = resolveImageDataURI(dataURI);
                        }
                        catch (error) {
                            badURI(error);
                        }
                    }
                    else {
                        // Note: should not be `asset.parent.source`, which may be path to fbx.
                        const glTFFilePath = gltfConverter.path;
                        let imageURI;
                        try {
                            const baseURI = url_1.default.pathToFileURL(glTFFilePath).toString();
                            let uriObj = new urijs_1.default(glTFImage.uri);
                            uriObj = uriObj.absoluteTo(baseURI);
                            (0, uri_utils_1.convertsEncodedSeparatorsInURI)(uriObj);
                            imageURI = uriObj.toString();
                        }
                        catch (error) {
                            badURI(error);
                        }
                        if (imageURI) {
                            if (!imageURI.startsWith('file://')) {
                                console.error((0, utils_1.i18nTranslate)('importer.gltf.image_uri_should_be_file_url'), (0, utils_1.linkToAssetTarget)(asset.uuid));
                            }
                            else {
                                await tryLoadFile(imageURI);
                            }
                        }
                    }
                }
            }
            const imageAsset = new cc_1.ImageAsset();
            if (image) {
                let extName;
                // Note, we prefer to use `mimeType` to detect image type and
                // reduce to use the possible `extName` if mime type is not available or is some we can't process.
                // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#images
                // > When image data is provided by uri and mimeType is defined,
                // > client implementations should prefer JSON-defined MIME Type over one provided by transport layer.
                const mimeType = glTFImage.mimeType ?? image.mimeType;
                if (mimeType) {
                    extName = (0, image_mime_type_to_ext_1.imageMimeTypeToExt)(mimeType);
                }
                if (!extName) {
                    extName = image.extName;
                }
                if (!extName) {
                    throw new Error('Unknown image type');
                }
                let imageData = image.data;
                if (extName.toLowerCase() === '.tga') {
                    const converted = await (0, image_mics_1.convertTGA)(imageData);
                    if (converted instanceof Error || !converted) {
                        console.error((0, utils_1.i18nTranslate)('importer.gltf.failed_to_convert_tga'), (0, utils_1.linkToAssetTarget)(asset.uuid));
                        return false;
                    }
                    extName = converted.extName;
                    imageData = converted.data;
                }
                else if (extName.toLowerCase() === '.psd') {
                    const converted = await (0, image_mics_1.convertPSD)(imageData);
                    ({ extName, data: imageData } = converted);
                }
                else if (extName.toLowerCase() === '.exr') {
                    const tempFile = (0, path_1.join)(asset.temp, `image${extName}`);
                    await (0, fs_extra_1.outputFile)(tempFile, imageData);
                    // TODO 需要与 image/index 整合复用 https://github.com/cocos/3d-tasks/issues/19092
                    const converted = await (0, image_mics_1.convertHDROrEXR)(extName, tempFile, asset.uuid, asset.temp);
                    if (converted instanceof Error || !converted) {
                        console.error((0, utils_1.i18nTranslate)('importer.gltf.failed_to_convert_tga'), (0, utils_1.linkToAssetTarget)(asset.uuid));
                        return false;
                    }
                    extName = converted.extName;
                    imageData = converted.source;
                }
                imageAsset._setRawAsset(extName);
                asset.userData.fixAlphaTransparencyArtifacts = true;
                // 和imageImport保持一致 cocos/3d-tasks#13641
                imageData = await (0, utils_3.handleImageUserData)(asset, imageData, extName);
                await asset.saveToLibrary(extName, imageData);
                asset.setData('imageExtName', extName);
            }
            const serializeJSON = EditorExtends.serialize(imageAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_2.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.GltfImageHandler;
function resolveImageDataURI(uri) {
    if (!uri.base64 || !uri.mediaType || uri.mediaType.type !== 'image') {
        throw new Error(`Cannot understand data uri(base64: ${uri.base64}, mediaType: ${uri.mediaType}) for image.`);
    }
    const data = (0, base64_1.decodeBase64ToArrayBuffer)(uri.data);
    return {
        data: Buffer.from(data),
        mimeType: uri.mediaType.value,
    };
}
