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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvZ2x0Zi9pbWFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5REFBMkM7QUFFM0MscURBQTBDO0FBQzFDLDZDQUFnQztBQUNoQyxrREFBd0I7QUFDeEIsOENBQXNCO0FBQ3RCLG9EQUE4RTtBQUM5RSxrREFBb0U7QUFDcEUscURBQXFEO0FBQ3JELHVDQUErRDtBQUMvRCxnRkFBMEU7QUFDMUUsNEVBQXFFO0FBQ3JFLDRDQUE0RDtBQUM1RCwyQkFBZ0M7QUFDaEMsdUNBQWdEO0FBQ2hELDBDQUFxRDtBQUVyRCxpREFBZ0M7QUFDaEMsbURBQWtDO0FBRXJCLFFBQUEsZ0JBQWdCLEdBQWlCO0lBQzFDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsb0JBQW9CO0lBRTFCLFdBQVc7SUFDWCxTQUFTLEVBQUUsZUFBZTtJQUMxQixRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFDaEI7Ozs7Ozs7V0FPRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBbUI7WUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBbUIsQ0FBQztZQUN0RCxJQUFJLE9BQU8sR0FBRyxjQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxHQUFHLGFBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQzFDLENBQUM7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SyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUQsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVsRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHlCQUFpQixFQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWxDLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFRixrQkFBZSx3QkFBZ0IsQ0FBQztBQUVoQyxTQUFTLG1CQUFtQixDQUFDLEdBQW9CO0lBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztRQUNsRSxNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxHQUFHLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFNBQVMsY0FBYyxDQUFDLENBQUM7SUFDakgsQ0FBQztJQUNELE1BQU0sSUFBSSxHQUFHLElBQUEsa0NBQXlCLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELE9BQU87UUFDSCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSztLQUNoQyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIERhdGFVUkkgZnJvbSAnQGNvY29zL2RhdGEtdXJpJztcbmltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IGZzLCB7IG91dHB1dEZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgcHMsIHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IFVSSSBmcm9tICd1cmlqcyc7XG5pbXBvcnQgVVJMIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBjb252ZXJ0SERST3JFWFIsIGNvbnZlcnRQU0QsIGNvbnZlcnRUR0EgfSBmcm9tICcuLi9pbWFnZS9pbWFnZS1taWNzJztcbmltcG9ydCB7IGNvbnZlcnRzRW5jb2RlZFNlcGFyYXRvcnNJblVSSSB9IGZyb20gJy4uL3V0aWxzL3VyaS11dGlscyc7XG5pbXBvcnQgeyBnbFRmUmVhZGVyTWFuYWdlciB9IGZyb20gJy4vcmVhZGVyLW1hbmFnZXInO1xuaW1wb3J0IHsgaTE4blRyYW5zbGF0ZSwgbGlua1RvQXNzZXRUYXJnZXQgfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyBtYXRjaEltYWdlVHlwZVBhdHRlcm4gfSBmcm9tICcuLi91dGlscy9tYXRjaC1pbWFnZS10eXBlLXBhdHRlcm4nO1xuaW1wb3J0IHsgaW1hZ2VNaW1lVHlwZVRvRXh0IH0gZnJvbSAnLi4vdXRpbHMvaW1hZ2UtbWltZS10eXBlLXRvLWV4dCc7XG5pbXBvcnQgeyBkZWNvZGVCYXNlNjRUb0FycmF5QnVmZmVyIH0gZnJvbSAnLi4vdXRpbHMvYmFzZTY0JztcbmltcG9ydCB7IEltYWdlQXNzZXQgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IGhhbmRsZUltYWdlVXNlckRhdGEgfSBmcm9tICcuLi9pbWFnZS91dGlscyc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBGYnhIYW5kbGVyIGZyb20gJy4uL2ZieCc7XG5pbXBvcnQgR2x0ZkhhbmRsZXIgZnJvbSAnLi4vZ2x0Zic7XG5cbmV4cG9ydCBjb25zdCBHbHRmSW1hZ2VIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnZ2x0Zi1lbWJlZGVkLWltYWdlJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLkltYWdlQXNzZXQnLFxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjMnLFxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoQgYm9vbGVhblxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJnkuIvmrKHlkK/liqjov5jkvJrph43mlrDlr7zlhaVcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IFZpcnR1YWxBc3NldCkge1xuICAgICAgICAgICAgaWYgKCFhc3NldC5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGltYWdlSW5kZXggPSBhc3NldC51c2VyRGF0YS5nbHRmSW5kZXggYXMgbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHZlcnNpb24gPSBHbHRmSGFuZGxlci5pbXBvcnRlci52ZXJzaW9uO1xuICAgICAgICAgICAgaWYgKGFzc2V0LnBhcmVudC5tZXRhLmltcG9ydGVyID09PSAnZmJ4Jykge1xuICAgICAgICAgICAgICAgIHZlcnNpb24gPSBGYnhIYW5kbGVyLmltcG9ydGVyLnZlcnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBnbHRmQ29udmVydGVyID0gYXdhaXQgZ2xUZlJlYWRlck1hbmFnZXIuZ2V0T3JDcmVhdGUoYXNzZXQucGFyZW50IGFzIEFzc2V0LCB2ZXJzaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGdsVEZJbWFnZSA9IGdsdGZDb252ZXJ0ZXIuZ2x0Zi5pbWFnZXMhW2ltYWdlSW5kZXhdO1xuXG4gICAgICAgICAgICAvLyBUaGUgYG1pbWVUeXBlYCBpcyB0aGUgbWltZSB0eXBlIHdoaWNoIGlzIHJlY29yZGVkIG9uIG9yIGRlZHVjZWQgZnJvbSB0cmFuc3BvcnQgbGF5ZXIuXG4gICAgICAgICAgICBsZXQgaW1hZ2U6IHsgZGF0YTogQnVmZmVyOyBtaW1lVHlwZT86IHN0cmluZzsgZXh0TmFtZT86IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBjb25zdCB0cnlMb2FkRmlsZSA9IGFzeW5jIChmaWxlVVJMOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZVBhdGggPSBVUkwuZmlsZVVSTFRvUGF0aChmaWxlVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gYXdhaXQgZnMucmVhZEZpbGUoaW1hZ2VQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI2ZpbGUtZXh0ZW5zaW9ucy1hbmQtbWltZS10eXBlc1xuICAgICAgICAgICAgICAgICAgICAvLyA+IEltcGxlbWVudGF0aW9ucyBzaG91bGQgdXNlIHRoZSBpbWFnZSB0eXBlIHBhdHRlcm4gbWF0Y2hpbmcgYWxnb3JpdGhtXG4gICAgICAgICAgICAgICAgICAgIC8vID4gZnJvbSB0aGUgTUlNRSBTbmlmZmluZyBTdGFuZGFyZCB0byBkZXRlY3QgUE5HIGFuZCBKUEVHIGltYWdlcyBhcyBmaWxlIGV4dGVuc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgLy8gPiBtYXkgYmUgdW5hdmFpbGFibGUgaW4gc29tZSBjb250ZXh0cy5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWltZVR5cGUgPSBtYXRjaEltYWdlVHlwZVBhdHRlcm4oaW1hZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UgPSB7IGRhdGE6IGltYWdlRGF0YSwgbWltZVR5cGUsIGV4dE5hbWU6IHBzLmV4dG5hbWUoaW1hZ2VQYXRoKSB9O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBpMThuVHJhbnNsYXRlKCdpbXBvcnRlci5nbHRmLmZhaWxlZF90b19sb2FkX2ltYWdlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogZmlsZVVSTCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IGVycm9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rVG9Bc3NldFRhcmdldChhc3NldC51dWlkKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IGFzc2V0LmdldFN3YXBTcGFjZTx7IHJlc29sdmVkPzogc3RyaW5nIH0+KCkucmVzb2x2ZWQ7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlVVJMID0gVVJMLnBhdGhUb0ZpbGVVUkwocmVzb2x2ZWQpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRyeUxvYWRGaWxlKGZpbGVVUkwuaHJlZik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChnbFRGSW1hZ2UuYnVmZmVyVmlldyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZ2x0ZkNvbnZlcnRlci5yZWFkSW1hZ2VJbkJ1ZmZlclZpZXcoZ2x0ZkNvbnZlcnRlci5nbHRmLmJ1ZmZlclZpZXdzIVtnbFRGSW1hZ2UuYnVmZmVyVmlld10pLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2xURkltYWdlLnVyaSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6IHNob3VsZCBub3QgYmUgYGFzc2V0LnBhcmVudC5zb3VyY2VgLCB3aGljaCBtYXkgYmUgcGF0aCB0byBmYnguXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdsVEZGaWxlUGF0aCA9IGdsdGZDb252ZXJ0ZXIucGF0aDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYWRVUkkgPSAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVGhlIHVyaSBcIiR7Z2xURkltYWdlLnVyaX1cIiBwcm92aWRlZCBieSBtb2RlbCBmaWxlJHtnbFRGRmlsZVBhdGh9IGlzIG5vdCBjb3JyZWN0OiAke2Vycm9yfWApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChnbFRGSW1hZ2UudXJpLnN0YXJ0c1dpdGgoJ2RhdGE6JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVVSSSA9IERhdGFVUkkucGFyc2UoZ2xURkltYWdlLnVyaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkYXRhVVJJKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHBhcnNlIGRhdGEgdXJpIFwiJHtnbFRGSW1hZ2UudXJpfVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlID0gcmVzb2x2ZUltYWdlRGF0YVVSSShkYXRhVVJJKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFkVVJJKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6IHNob3VsZCBub3QgYmUgYGFzc2V0LnBhcmVudC5zb3VyY2VgLCB3aGljaCBtYXkgYmUgcGF0aCB0byBmYnguXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBnbFRGRmlsZVBhdGggPSBnbHRmQ29udmVydGVyLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW1hZ2VVUkk6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZVVSSSA9IFVSTC5wYXRoVG9GaWxlVVJMKGdsVEZGaWxlUGF0aCkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXJpT2JqID0gbmV3IFVSSShnbFRGSW1hZ2UudXJpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmlPYmogPSB1cmlPYmouYWJzb2x1dGVUbyhiYXNlVVJJKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0c0VuY29kZWRTZXBhcmF0b3JzSW5VUkkodXJpT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZVVSSSA9IHVyaU9iai50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWRVUkkoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW1hZ2VVUkkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWltYWdlVVJJLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZ2x0Zi5pbWFnZV91cmlfc2hvdWxkX2JlX2ZpbGVfdXJsJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rVG9Bc3NldFRhcmdldChhc3NldC51dWlkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0cnlMb2FkRmlsZShpbWFnZVVSSSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbWFnZUFzc2V0ID0gbmV3IEltYWdlQXNzZXQoKTtcbiAgICAgICAgICAgIGlmIChpbWFnZSkge1xuICAgICAgICAgICAgICAgIGxldCBleHROYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgLy8gTm90ZSwgd2UgcHJlZmVyIHRvIHVzZSBgbWltZVR5cGVgIHRvIGRldGVjdCBpbWFnZSB0eXBlIGFuZFxuICAgICAgICAgICAgICAgIC8vIHJlZHVjZSB0byB1c2UgdGhlIHBvc3NpYmxlIGBleHROYW1lYCBpZiBtaW1lIHR5cGUgaXMgbm90IGF2YWlsYWJsZSBvciBpcyBzb21lIHdlIGNhbid0IHByb2Nlc3MuXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI2ltYWdlc1xuICAgICAgICAgICAgICAgIC8vID4gV2hlbiBpbWFnZSBkYXRhIGlzIHByb3ZpZGVkIGJ5IHVyaSBhbmQgbWltZVR5cGUgaXMgZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAvLyA+IGNsaWVudCBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIHByZWZlciBKU09OLWRlZmluZWQgTUlNRSBUeXBlIG92ZXIgb25lIHByb3ZpZGVkIGJ5IHRyYW5zcG9ydCBsYXllci5cbiAgICAgICAgICAgICAgICBjb25zdCBtaW1lVHlwZSA9IGdsVEZJbWFnZS5taW1lVHlwZSA/PyBpbWFnZS5taW1lVHlwZTtcbiAgICAgICAgICAgICAgICBpZiAobWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0TmFtZSA9IGltYWdlTWltZVR5cGVUb0V4dChtaW1lVHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZXh0TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBleHROYW1lID0gaW1hZ2UuZXh0TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFleHROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBpbWFnZSB0eXBlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpbWFnZURhdGE6IEJ1ZmZlciB8IHN0cmluZyA9IGltYWdlLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGV4dE5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJy50Z2EnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IGNvbnZlcnRUR0EoaW1hZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnZlcnRlZCBpbnN0YW5jZW9mIEVycm9yIHx8ICFjb252ZXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZ2x0Zi5mYWlsZWRfdG9fY29udmVydF90Z2EnKSwgbGlua1RvQXNzZXRUYXJnZXQoYXNzZXQudXVpZCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGV4dE5hbWUgPSBjb252ZXJ0ZWQuZXh0TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VEYXRhID0gY29udmVydGVkLmRhdGE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChleHROYW1lLnRvTG93ZXJDYXNlKCkgPT09ICcucHNkJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBhd2FpdCBjb252ZXJ0UFNEKGltYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICh7IGV4dE5hbWUsIGRhdGE6IGltYWdlRGF0YSB9ID0gY29udmVydGVkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4dE5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJy5leHInKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBGaWxlID0gam9pbihhc3NldC50ZW1wLCBgaW1hZ2Uke2V4dE5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG91dHB1dEZpbGUodGVtcEZpbGUsIGltYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8g6ZyA6KaB5LiOIGltYWdlL2luZGV4IOaVtOWQiOWkjeeUqCBodHRwczovL2dpdGh1Yi5jb20vY29jb3MvM2QtdGFza3MvaXNzdWVzLzE5MDkyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IGNvbnZlcnRIRFJPckVYUihleHROYW1lLCB0ZW1wRmlsZSwgYXNzZXQudXVpZCwgYXNzZXQudGVtcCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb252ZXJ0ZWQgaW5zdGFuY2VvZiBFcnJvciB8fCAhY29udmVydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmdsdGYuZmFpbGVkX3RvX2NvbnZlcnRfdGdhJyksIGxpbmtUb0Fzc2V0VGFyZ2V0KGFzc2V0LnV1aWQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBleHROYW1lID0gY29udmVydGVkLmV4dE5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlRGF0YSA9IGNvbnZlcnRlZC5zb3VyY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGltYWdlQXNzZXQuX3NldFJhd0Fzc2V0KGV4dE5hbWUpO1xuICAgICAgICAgICAgICAgIGFzc2V0LnVzZXJEYXRhLmZpeEFscGhhVHJhbnNwYXJlbmN5QXJ0aWZhY3RzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyDlkoxpbWFnZUltcG9ydOS/neaMgeS4gOiHtCBjb2Nvcy8zZC10YXNrcyMxMzY0MVxuICAgICAgICAgICAgICAgIGltYWdlRGF0YSA9IGF3YWl0IGhhbmRsZUltYWdlVXNlckRhdGEoYXNzZXQsIGltYWdlRGF0YSwgZXh0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeShleHROYW1lLCBpbWFnZURhdGEpO1xuICAgICAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2ltYWdlRXh0TmFtZScsIGV4dE5hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUoaW1hZ2VBc3NldCk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBHbHRmSW1hZ2VIYW5kbGVyO1xuXG5mdW5jdGlvbiByZXNvbHZlSW1hZ2VEYXRhVVJJKHVyaTogRGF0YVVSSS5EYXRhVVJJKTogeyBkYXRhOiBCdWZmZXI7IG1pbWVUeXBlOiBzdHJpbmcgfSB7XG4gICAgaWYgKCF1cmkuYmFzZTY0IHx8ICF1cmkubWVkaWFUeXBlIHx8IHVyaS5tZWRpYVR5cGUudHlwZSAhPT0gJ2ltYWdlJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCB1bmRlcnN0YW5kIGRhdGEgdXJpKGJhc2U2NDogJHt1cmkuYmFzZTY0fSwgbWVkaWFUeXBlOiAke3VyaS5tZWRpYVR5cGV9KSBmb3IgaW1hZ2UuYCk7XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBkZWNvZGVCYXNlNjRUb0FycmF5QnVmZmVyKHVyaS5kYXRhKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBkYXRhOiBCdWZmZXIuZnJvbShkYXRhKSxcbiAgICAgICAgbWltZVR5cGU6IHVyaS5tZWRpYVR5cGUudmFsdWUsXG4gICAgfTtcbn1cbiJdfQ==