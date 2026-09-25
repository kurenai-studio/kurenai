'use strict';
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
exports.ERPTextureCubeHandler = exports.MipmapMode = void 0;
exports.checkSize = checkSize;
const asset_db_1 = require("@cocos/asset-db");
const texture_base_1 = require("./texture-base");
const equirect_cubemap_faces_1 = require("./utils/equirect-cubemap-faces");
const cc = __importStar(require("cc"));
const cube_map_simple_layout_1 = require("./utils/cube-map-simple-layout");
const sharp_1 = __importDefault(require("sharp"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const fs_extra_2 = require("fs-extra");
const utils_1 = require("../utils");
const utils_2 = require("./image/utils");
const global_1 = require("../../../../global");
const utils_3 = __importDefault(require("../../../base/utils"));
const verticalCount = 2;
/**
 * @en The way to fill mipmaps.
 * @zh 填充mipmaps的方式。
 */
var MipmapMode;
(function (MipmapMode) {
    /**
     * @zh
     * 不使用mipmaps
     * @en
     * Not using mipmaps
     * @readonly
     */
    MipmapMode[MipmapMode["NONE"] = 0] = "NONE";
    /**
     * @zh
     * 使用自动生成的mipmaps
     * @en
     * Using the automatically generated mipmaps
     * @readonly
     */
    MipmapMode[MipmapMode["AUTO"] = 1] = "AUTO";
    /**
     * @zh
     * 使用卷积图填充mipmaps
     * @en
     * Filling mipmaps with convolutional maps
     * @readonly
     */
    MipmapMode[MipmapMode["BAKED_CONVOLUTION_MAP"] = 2] = "BAKED_CONVOLUTION_MAP";
})(MipmapMode || (exports.MipmapMode = MipmapMode = {}));
exports.ERPTextureCubeHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'erp-texture-cube',
    assetType: 'cc.TextureCube',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.10',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            if (Object.getOwnPropertyNames(asset.userData).length === 0) {
                asset.assignUserData((0, utils_2.makeDefaultTextureCubeAssetUserData)(), true);
            }
            const userData = asset.userData;
            const imageAsset = (0, asset_db_1.queryAsset)(userData.imageDatabaseUri);
            if (!imageAsset) {
                return false;
            }
            let imageSource;
            // @ts-ignore parent
            const ext = asset.parent.extname?.toLowerCase();
            // image 导入器对这些类型进行了转换
            if (['.tga', '.hdr', '.bmp', '.psd', '.tif', '.tiff', '.exr'].includes(ext) || !ext) {
                imageSource = imageAsset.library + '.png';
            }
            else {
                imageSource = imageAsset.source;
            }
            // const imageSource = queryPath(userData.imageDatabaseUri as string);
            // if (!imageSource) {
            //     return false;
            // }
            const image = (0, sharp_1.default)(imageSource);
            const imageMetadata = await image.metadata();
            const width = imageMetadata.width;
            const height = imageMetadata.height;
            //need bakeOfflineMipmaps
            switch (asset.userData.mipBakeMode) {
                case MipmapMode.BAKED_CONVOLUTION_MAP: {
                    const file = asset.parent.source;
                    let outWithoutExtname = (0, path_1.join)(asset.temp, 'mipmap');
                    const convolutionDir = getDirOfMipmaps(imageAsset.source, ext);
                    if (isNeedConvolution(convolutionDir)) {
                        const vectorParams = [
                            '--srcFaceSize',
                            '768',
                            '--mipatlas',
                            '--filter',
                            'radiance',
                            '--lightingModel',
                            'ggx',
                            '--excludeBase',
                            'true',
                            '--output0params',
                            userData.isRGBE ? 'png,rgbm,facelist' : 'png,bgra8,facelist', // LDR: 'png,bgra8,facelist', HDR: 'png,rgbm,facelist',
                            '--input',
                            file,
                            '--output0',
                            outWithoutExtname,
                        ];
                        if (userData.isRGBE && !['.hdr', '.exr'].includes(ext)) {
                            vectorParams.splice(0, 0, '--rgbm');
                        }
                        (0, fs_extra_2.ensureDirSync)(asset.temp);
                        console.log(`Start to bake asset {asset[${asset.uuid}](${asset.uuid})}`);
                        let cmdTool = (0, path_1.join)(global_1.GlobalPaths.staticDir, 'tools/cmft/cmftRelease64') + (process.platform === 'win32' ? '.exe' : '');
                        if (process.platform !== 'win32' && !(0, fs_extra_1.existsSync)(cmdTool)) {
                            const fallback = (0, path_1.join)(global_1.GlobalPaths.staticDir, 'tools/cmft/cmft');
                            if ((0, fs_extra_1.existsSync)(fallback)) {
                                cmdTool = fallback;
                            }
                        }
                        await utils_3.default.Process.quickSpawn(cmdTool, vectorParams, {
                            stdio: 'inherit',
                        });
                    }
                    else {
                        outWithoutExtname = (0, path_1.join)(convolutionDir, 'mipmap');
                    }
                    const faces = ['right', 'left', 'top', 'bottom', 'front', 'back'];
                    const mipmapAtlas = {};
                    const mipmapLayoutList = [];
                    const swapSpaceMip = asset.getSwapSpace();
                    for (let i = 0; i < faces.length; i++) {
                        // 6 个面的 atlas
                        const fileName = `${outWithoutExtname}_${i}.png`;
                        //拷贝mipmaps到project目录
                        saveMipmaps(fileName, convolutionDir);
                        const imageFace = (0, sharp_1.default)(fileName);
                        const imageFaceMetadata = await imageFace.metadata();
                        const width = imageFaceMetadata.width;
                        mipmapLayoutList[i] = getMipmapLayout(width);
                        const faceName = faces[i];
                        const faceImageData = await imageFace.toFormat(sharp_1.default.format.png).toBuffer();
                        swapSpaceMip[faceName] = faceImageData;
                        const faceAsset = await asset.createSubAsset(faceName, 'texture-cube-face');
                        mipmapAtlas[faceName] = EditorExtends.serialize.asAsset(faceAsset.uuid, cc.ImageAsset);
                    }
                    const texture = new cc.TextureCube();
                    (0, texture_base_1.applyTextureBaseAssetUserData)(userData, texture);
                    texture.isRGBE = userData.isRGBE;
                    texture._mipmapMode = MipmapMode.BAKED_CONVOLUTION_MAP;
                    texture._mipmapAtlas = {
                        atlas: mipmapAtlas,
                        layout: mipmapLayoutList[0],
                    };
                    const serializeJSON = EditorExtends.serialize(texture);
                    await asset.saveToLibrary('.json', serializeJSON);
                    const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                    asset.setData('depends', depends);
                    return true;
                }
            }
            let mipmapData;
            const simpleLayout = (0, cube_map_simple_layout_1.matchSimpleLayout)(width, height);
            if (simpleLayout) {
                mipmapData = await _getFacesInSimpleLayout(imageSource, simpleLayout);
            }
            else {
                mipmapData = await _getFacesInEquirectangularProjected(imageSource, userData.faceSize === 0 ? undefined : userData.faceSize, userData.isRGBE);
            }
            const mipmap = {};
            const swapSpace = asset.getSwapSpace();
            for (const faceName of Object.getOwnPropertyNames(mipmapData)) {
                const faceImageData = mipmapData[faceName];
                swapSpace[faceName] = faceImageData;
                const faceAsset = await asset.createSubAsset(faceName, 'texture-cube-face');
                // @ts-ignore
                mipmap[faceName] = EditorExtends.serialize.asAsset(faceAsset.uuid, cc.ImageAsset);
            }
            const texture = new cc.TextureCube();
            (0, texture_base_1.applyTextureBaseAssetUserData)(userData, texture);
            texture.isRGBE = userData.isRGBE;
            texture._mipmaps = [mipmap];
            const serializeJSON = EditorExtends.serialize(texture);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.ERPTextureCubeHandler;
async function _getFacesInSimpleLayout(imageSource, layout) {
    const mipmapData = {};
    const faceNames = Object.getOwnPropertyNames(layout);
    for (const faceName of faceNames) {
        // @ts-expect-error To keep consistent order
        mipmapData[faceName] = undefined;
    }
    await Promise.all(faceNames.map(async (faceName) => {
        const faceBlit = layout[faceName];
        // 最新版本 sharp 0.32.6 连续裁剪时使用同一个 image sharp 对象会裁剪异常，需要重新创建
        const image = (0, sharp_1.default)(imageSource);
        const faceSharp = image.extract({
            left: faceBlit.x,
            top: faceBlit.y,
            width: faceBlit.width,
            height: faceBlit.height,
        });
        const faceImageData = await faceSharp.toFormat(sharp_1.default.format.png).toBuffer();
        mipmapData[faceName] = faceImageData;
    }));
    return mipmapData;
}
async function _getFacesInEquirectangularProjected(imageSource, faceSize, isRGBE) {
    const buffer = await (0, fs_extra_1.readFile)(imageSource);
    const sharpResult = await (0, sharp_1.default)(buffer);
    const meta = await sharpResult.metadata();
    if (!faceSize) {
        faceSize = (0, equirect_cubemap_faces_1.nearestPowerOfTwo)((meta.width || 0) / 4) | 0;
    }
    // 分割图片
    const faceArray = await (0, equirect_cubemap_faces_1.equirectToCubemapFaces)(sharpResult, faceSize, {
        isRGBE,
    });
    if (faceArray.length !== 6) {
        throw new Error('Failed to resolve equirectangular projection image.');
    }
    // const faces = await Promise.all(faceArray.map(getCanvasData));
    return {
        right: await (0, sharp_1.default)(Buffer.from(faceArray[0].data), { raw: { width: faceSize, height: faceSize, channels: 4 } })
            .toFormat(meta.format || 'png')
            .toBuffer(),
        left: await (0, sharp_1.default)(Buffer.from(faceArray[1].data), { raw: { width: faceSize, height: faceSize, channels: 4 } })
            .toFormat(meta.format || 'png')
            .toBuffer(),
        top: await (0, sharp_1.default)(Buffer.from(faceArray[2].data), { raw: { width: faceSize, height: faceSize, channels: 4 } })
            .toFormat(meta.format || 'png')
            .toBuffer(),
        bottom: await (0, sharp_1.default)(Buffer.from(faceArray[3].data), { raw: { width: faceSize, height: faceSize, channels: 4 } })
            .toFormat(meta.format || 'png')
            .toBuffer(),
        front: await (0, sharp_1.default)(Buffer.from(faceArray[4].data), { raw: { width: faceSize, height: faceSize, channels: 4 } })
            .toFormat(meta.format || 'png')
            .toBuffer(),
        back: await (0, sharp_1.default)(Buffer.from(faceArray[5].data), { raw: { width: faceSize, height: faceSize, channels: 4 } })
            .toFormat(meta.format || 'png')
            .toBuffer(),
    };
}
function getTop(level, mipmapLayout) {
    if (level == 0) {
        return 0;
    }
    else {
        return mipmapLayout.length > 0 ? mipmapLayout[0].height : 0;
    }
}
function getLeft(level, mipmapLayout) {
    //前两张mipmap纵置布局
    if (level < verticalCount) {
        return 0;
    }
    let left = 0;
    for (let i = verticalCount - 1; i < mipmapLayout.length; i++) {
        if (i >= level) {
            break;
        }
        left += mipmapLayout[i].width;
    }
    return left;
}
/**
 * 计算约定好的mipmap布局，前两张mipmap纵向排列，后面接第二张横向排列。
 * @param size 是level 0的尺寸
 */
function getMipmapLayout(size) {
    const mipmapLayout = [];
    let level = 0;
    while (size) {
        mipmapLayout.push({
            left: getLeft(level, mipmapLayout),
            top: getTop(level, mipmapLayout),
            width: size,
            height: size,
            level: level++,
        });
        size >>= 1;
    }
    return mipmapLayout;
}
/**
 * 获取mipmap的保存目录
 * 反射探针烘焙图的目录结构：场景名 + 文件名_convolution
 * 其他情况烘焙图的目录结构: 文件名 + _convolution
 */
function getDirOfMipmaps(filePath, ext) {
    const basePath = (0, path_1.dirname)(filePath);
    const baseName = (0, path_1.basename)(filePath, ext);
    return (0, path_1.join)(basePath, baseName + '_convolution');
}
/**
 * 如果project目录存有上次卷积的结果，无需再次做卷积以节省导入时间
 */
function isNeedConvolution(convolutionDir) {
    if (!(0, fs_extra_1.existsSync)(convolutionDir)) {
        return true;
    }
    const faceCount = 6;
    for (let i = 0; i < faceCount; i++) {
        const filePath = (0, path_1.join)(convolutionDir, 'mipmap_' + i.toString() + '.png');
        if (!(0, fs_extra_1.existsSync)(filePath)) {
            return true;
        }
    }
    return false;
}
/**
 * 保存卷积工具生成的mipmaps
 */
function saveMipmaps(filePath, destPath) {
    if (!(0, fs_extra_1.existsSync)(destPath)) {
        (0, fs_extra_2.ensureDirSync)(destPath);
    }
    (0, fs_extra_1.copyFileSync)(filePath, (0, path_1.join)(destPath, (0, path_1.basename)(filePath)));
}
function checkSize(width, height) {
    return width * 4 === height * 3 || width * 3 === height * 4 || width * 6 === height || width === height * 6 || width === height * 2;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJwLXRleHR1cmUtY3ViZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9lcnAtdGV4dHVyZS1jdWJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdVliLDhCQUVDO0FBdllELDhDQUEyRDtBQUMzRCxpREFBK0Q7QUFDL0QsMkVBQTJGO0FBQzNGLHVDQUF5QjtBQUN6QiwyRUFBa0Y7QUFFbEYsa0RBQTBCO0FBQzFCLHVDQUE4RDtBQUM5RCwrQkFBK0M7QUFDL0MsdUNBQXlDO0FBRXpDLG9DQUE2QztBQUc3Qyx5Q0FBb0U7QUFDcEUsK0NBQWlEO0FBQ2pELGdFQUF3QztBQUt4QyxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFTeEI7OztHQUdHO0FBQ0gsSUFBWSxVQXlCWDtBQXpCRCxXQUFZLFVBQVU7SUFDbEI7Ozs7OztPQU1HO0lBQ0gsMkNBQVEsQ0FBQTtJQUNSOzs7Ozs7T0FNRztJQUNILDJDQUFRLENBQUE7SUFDUjs7Ozs7O09BTUc7SUFDSCw2RUFBeUIsQ0FBQTtBQUM3QixDQUFDLEVBekJXLFVBQVUsMEJBQVYsVUFBVSxRQXlCckI7QUFFWSxRQUFBLHFCQUFxQixHQUFpQjtJQUMvQyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLGtCQUFrQjtJQUN4QixTQUFTLEVBQUUsZ0JBQWdCO0lBRTNCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsUUFBUTtRQUNqQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBbUI7WUFDNUIsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUQsS0FBSyxDQUFDLGNBQWMsQ0FB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QVksRUFBQyxRQUFRLEVBQUUsSUFBQSxXQUFJLEVBQUMsUUFBUSxFQUFFLElBQUEsZUFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBTUQsU0FBZ0IsU0FBUyxDQUFDLEtBQWEsRUFBRSxNQUFjO0lBQ25ELE9BQU8sS0FBSyxHQUFHLENBQUMsS0FBSyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLEtBQUssTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxLQUFLLE1BQU0sSUFBSSxLQUFLLEtBQUssTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN4SSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBxdWVyeUFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgYXBwbHlUZXh0dXJlQmFzZUFzc2V0VXNlckRhdGEgfSBmcm9tICcuL3RleHR1cmUtYmFzZSc7XG5pbXBvcnQgeyBlcXVpcmVjdFRvQ3ViZW1hcEZhY2VzLCBuZWFyZXN0UG93ZXJPZlR3byB9IGZyb20gJy4vdXRpbHMvZXF1aXJlY3QtY3ViZW1hcC1mYWNlcyc7XG5pbXBvcnQgKiBhcyBjYyBmcm9tICdjYyc7XG5pbXBvcnQgeyBJU2ltcGxlTGF5b3V0LCBtYXRjaFNpbXBsZUxheW91dCB9IGZyb20gJy4vdXRpbHMvY3ViZS1tYXAtc2ltcGxlLWxheW91dCc7XG5cbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgeyBjb3B5RmlsZVN5bmMsIGV4aXN0c1N5bmMsIHJlYWRGaWxlIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGVuc3VyZURpclN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBUZXh0dXJlQ3ViZUFzc2V0VXNlckRhdGEgfSBmcm9tICcuLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcbmltcG9ydCB7IG1ha2VEZWZhdWx0VGV4dHVyZUN1YmVBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi9pbWFnZS91dGlscyc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uLy4uLy4uL2dsb2JhbCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vYmFzZS91dGlscyc7XG5cbnR5cGUgSVRleHR1cmVDdWJlTWlwTWFwID0gY2MuVGV4dHVyZUN1YmVbJ21pcG1hcHMnXVswXTtcblxudHlwZSBJVGV4dHVyZUZhY2VNaXBNYXBEYXRhID0gUmVjb3JkPGtleW9mIElUZXh0dXJlQ3ViZU1pcE1hcCwgQnVmZmVyPjtcbmNvbnN0IHZlcnRpY2FsQ291bnQgPSAyO1xuXG5pbnRlcmZhY2UgSU1pcG1hcEF0bGFzTGF5b3V0IHtcbiAgICBsZWZ0OiBudW1iZXI7XG4gICAgdG9wOiBudW1iZXI7XG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICBsZXZlbDogbnVtYmVyO1xufVxuLyoqXG4gKiBAZW4gVGhlIHdheSB0byBmaWxsIG1pcG1hcHMuXG4gKiBAemgg5aGr5YWFbWlwbWFwc+eahOaWueW8j+OAglxuICovXG5leHBvcnQgZW51bSBNaXBtYXBNb2RlIHtcbiAgICAvKipcbiAgICAgKiBAemhcbiAgICAgKiDkuI3kvb/nlKhtaXBtYXBzXG4gICAgICogQGVuXG4gICAgICogTm90IHVzaW5nIG1pcG1hcHNcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBOT05FID0gMCxcbiAgICAvKipcbiAgICAgKiBAemhcbiAgICAgKiDkvb/nlKjoh6rliqjnlJ/miJDnmoRtaXBtYXBzXG4gICAgICogQGVuXG4gICAgICogVXNpbmcgdGhlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIG1pcG1hcHNcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBBVVRPID0gMSxcbiAgICAvKipcbiAgICAgKiBAemhcbiAgICAgKiDkvb/nlKjljbfnp6/lm77loavlhYVtaXBtYXBzXG4gICAgICogQGVuXG4gICAgICogRmlsbGluZyBtaXBtYXBzIHdpdGggY29udm9sdXRpb25hbCBtYXBzXG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG4gICAgQkFLRURfQ09OVk9MVVRJT05fTUFQID0gMixcbn1cblxuZXhwb3J0IGNvbnN0IEVSUFRleHR1cmVDdWJlSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2VycC10ZXh0dXJlLWN1YmUnLFxuICAgIGFzc2V0VHlwZTogJ2NjLlRleHR1cmVDdWJlJyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjEwJyxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IFZpcnR1YWxBc3NldCkge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFzc2V0LnVzZXJEYXRhKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBhc3NldC5hc3NpZ25Vc2VyRGF0YShtYWtlRGVmYXVsdFRleHR1cmVDdWJlQXNzZXRVc2VyRGF0YSgpLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBUZXh0dXJlQ3ViZUFzc2V0VXNlckRhdGE7XG5cbiAgICAgICAgICAgIGNvbnN0IGltYWdlQXNzZXQgPSBxdWVyeUFzc2V0KHVzZXJEYXRhLmltYWdlRGF0YWJhc2VVcmkgYXMgc3RyaW5nKTtcbiAgICAgICAgICAgIGlmICghaW1hZ2VBc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBpbWFnZVNvdXJjZTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgcGFyZW50XG4gICAgICAgICAgICBjb25zdCBleHQgPSBhc3NldC5wYXJlbnQuZXh0bmFtZT8udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIC8vIGltYWdlIOWvvOWFpeWZqOWvuei/meS6m+exu+Wei+i/m+ihjOS6hui9rOaNolxuICAgICAgICAgICAgaWYgKFsnLnRnYScsICcuaGRyJywgJy5ibXAnLCAnLnBzZCcsICcudGlmJywgJy50aWZmJywgJy5leHInXS5pbmNsdWRlcyhleHQpIHx8ICFleHQpIHtcbiAgICAgICAgICAgICAgICBpbWFnZVNvdXJjZSA9IGltYWdlQXNzZXQubGlicmFyeSArICcucG5nJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VTb3VyY2UgPSBpbWFnZUFzc2V0LnNvdXJjZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY29uc3QgaW1hZ2VTb3VyY2UgPSBxdWVyeVBhdGgodXNlckRhdGEuaW1hZ2VEYXRhYmFzZVVyaSBhcyBzdHJpbmcpO1xuICAgICAgICAgICAgLy8gaWYgKCFpbWFnZVNvdXJjZSkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBzaGFycChpbWFnZVNvdXJjZSk7XG4gICAgICAgICAgICBjb25zdCBpbWFnZU1ldGFkYXRhID0gYXdhaXQgaW1hZ2UubWV0YWRhdGEoKTtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gaW1hZ2VNZXRhZGF0YS53aWR0aCE7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBpbWFnZU1ldGFkYXRhLmhlaWdodCE7XG5cbiAgICAgICAgICAgIC8vbmVlZCBiYWtlT2ZmbGluZU1pcG1hcHNcbiAgICAgICAgICAgIHN3aXRjaCAoYXNzZXQudXNlckRhdGEubWlwQmFrZU1vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIE1pcG1hcE1vZGUuQkFLRURfQ09OVk9MVVRJT05fTUFQOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBhc3NldC5wYXJlbnQhLnNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG91dFdpdGhvdXRFeHRuYW1lID0gam9pbihhc3NldC50ZW1wLCAnbWlwbWFwJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZvbHV0aW9uRGlyID0gZ2V0RGlyT2ZNaXBtYXBzKGltYWdlQXNzZXQuc291cmNlLCBleHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNOZWVkQ29udm9sdXRpb24oY29udm9sdXRpb25EaXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZWN0b3JQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy0tc3JjRmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc3NjgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICctLW1pcGF0bGFzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLS1maWx0ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyYWRpYW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy0tbGlnaHRpbmdNb2RlbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2dneCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy0tZXhjbHVkZUJhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5pc1JHQkUgPyAncG5nLHJnYm0sZmFjZWxpc3QnIDogJ3BuZyxiZ3JhOCxmYWNlbGlzdCcsIC8vIExEUjogJ3BuZyxiZ3JhOCxmYWNlbGlzdCcsIEhEUjogJ3BuZyxyZ2JtLGZhY2VsaXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRXaXRob3V0RXh0bmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VyRGF0YS5pc1JHQkUgJiYgIVsnLmhkcicsICcuZXhyJ10uaW5jbHVkZXMoZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlY3RvclBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnN1cmVEaXJTeW5jKGFzc2V0LnRlbXApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnQgdG8gYmFrZSBhc3NldCB7YXNzZXRbJHthc3NldC51dWlkfV0oJHthc3NldC51dWlkfSl9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjbWRUb29sID0gam9pbihHbG9iYWxQYXRocy5zdGF0aWNEaXIsICd0b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSArIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInID8gJy5leGUnIDogJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicgJiYgIWV4aXN0c1N5bmMoY21kVG9vbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFjayA9IGpvaW4oR2xvYmFsUGF0aHMuc3RhdGljRGlyLCAndG9vbHMvY21mdC9jbWZ0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZmFsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZFRvb2wgPSBmYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5Qcm9jZXNzLnF1aWNrU3Bhd24oY21kVG9vbCwgdmVjdG9yUGFyYW1zLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RkaW86ICdpbmhlcml0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0V2l0aG91dEV4dG5hbWUgPSBqb2luKGNvbnZvbHV0aW9uRGlyLCAnbWlwbWFwJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmYWNlcyA9IFsncmlnaHQnLCAnbGVmdCcsICd0b3AnLCAnYm90dG9tJywgJ2Zyb250JywgJ2JhY2snXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWlwbWFwQXRsYXM6IGFueSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtaXBtYXBMYXlvdXRMaXN0ID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3dhcFNwYWNlTWlwID0gYXNzZXQuZ2V0U3dhcFNwYWNlPElGYWNlU3dhcFNwYWNlPigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIDYg5Liq6Z2i55qEIGF0bGFzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke291dFdpdGhvdXRFeHRuYW1lfV8ke2l9LnBuZ2A7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL+aLt+i0nW1pcG1hcHPliLBwcm9qZWN055uu5b2VXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlTWlwbWFwcyhmaWxlTmFtZSwgY29udm9sdXRpb25EaXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZUZhY2UgPSBzaGFycChmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZUZhY2VNZXRhZGF0YSA9IGF3YWl0IGltYWdlRmFjZS5tZXRhZGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBpbWFnZUZhY2VNZXRhZGF0YS53aWR0aCE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXBtYXBMYXlvdXRMaXN0W2ldID0gZ2V0TWlwbWFwTGF5b3V0KHdpZHRoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmFjZU5hbWUgPSBmYWNlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhY2VJbWFnZURhdGEgPSBhd2FpdCBpbWFnZUZhY2UudG9Gb3JtYXQoc2hhcnAuZm9ybWF0LnBuZykudG9CdWZmZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXBTcGFjZU1pcFtmYWNlTmFtZV0gPSBmYWNlSW1hZ2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmFjZUFzc2V0ID0gYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoZmFjZU5hbWUsICd0ZXh0dXJlLWN1YmUtZmFjZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWlwbWFwQXRsYXNbZmFjZU5hbWVdID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldChmYWNlQXNzZXQudXVpZCwgY2MuSW1hZ2VBc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gbmV3IGNjLlRleHR1cmVDdWJlKCk7XG4gICAgICAgICAgICAgICAgICAgIGFwcGx5VGV4dHVyZUJhc2VBc3NldFVzZXJEYXRhKHVzZXJEYXRhLCB0ZXh0dXJlKTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pc1JHQkUgPSB1c2VyRGF0YS5pc1JHQkU7XG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuX21pcG1hcE1vZGUgPSBNaXBtYXBNb2RlLkJBS0VEX0NPTlZPTFVUSU9OX01BUCBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuX21pcG1hcEF0bGFzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXRsYXM6IG1pcG1hcEF0bGFzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0OiBtaXBtYXBMYXlvdXRMaXN0WzBdLFxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZSh0ZXh0dXJlKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbWlwbWFwRGF0YTogSVRleHR1cmVGYWNlTWlwTWFwRGF0YTtcbiAgICAgICAgICAgIGNvbnN0IHNpbXBsZUxheW91dCA9IG1hdGNoU2ltcGxlTGF5b3V0KHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgaWYgKHNpbXBsZUxheW91dCkge1xuICAgICAgICAgICAgICAgIG1pcG1hcERhdGEgPSBhd2FpdCBfZ2V0RmFjZXNJblNpbXBsZUxheW91dChpbWFnZVNvdXJjZSwgc2ltcGxlTGF5b3V0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWlwbWFwRGF0YSA9IGF3YWl0IF9nZXRGYWNlc0luRXF1aXJlY3Rhbmd1bGFyUHJvamVjdGVkKFxuICAgICAgICAgICAgICAgICAgICBpbWFnZVNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEuZmFjZVNpemUgPT09IDAgPyB1bmRlZmluZWQgOiB1c2VyRGF0YS5mYWNlU2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEuaXNSR0JFLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1pcG1hcCA9IHt9IGFzIElUZXh0dXJlQ3ViZU1pcE1hcDtcbiAgICAgICAgICAgIGNvbnN0IHN3YXBTcGFjZSA9IGFzc2V0LmdldFN3YXBTcGFjZTxJRmFjZVN3YXBTcGFjZT4oKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmFjZU5hbWUgb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWlwbWFwRGF0YSkgYXMgKGtleW9mIHR5cGVvZiBtaXBtYXBEYXRhKVtdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFjZUltYWdlRGF0YSA9IG1pcG1hcERhdGFbZmFjZU5hbWVdO1xuICAgICAgICAgICAgICAgIHN3YXBTcGFjZVtmYWNlTmFtZV0gPSBmYWNlSW1hZ2VEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhY2VBc3NldCA9IGF3YWl0IGFzc2V0LmNyZWF0ZVN1YkFzc2V0KGZhY2VOYW1lLCAndGV4dHVyZS1jdWJlLWZhY2UnKTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgbWlwbWFwW2ZhY2VOYW1lXSA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplLmFzQXNzZXQoZmFjZUFzc2V0LnV1aWQsIGNjLkltYWdlQXNzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gbmV3IGNjLlRleHR1cmVDdWJlKCk7XG4gICAgICAgICAgICBhcHBseVRleHR1cmVCYXNlQXNzZXRVc2VyRGF0YSh1c2VyRGF0YSwgdGV4dHVyZSk7XG4gICAgICAgICAgICB0ZXh0dXJlLmlzUkdCRSA9IHVzZXJEYXRhLmlzUkdCRTtcbiAgICAgICAgICAgIHRleHR1cmUuX21pcG1hcHMgPSBbbWlwbWFwXTtcblxuICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKHRleHR1cmUpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgRVJQVGV4dHVyZUN1YmVIYW5kbGVyO1xuXG5hc3luYyBmdW5jdGlvbiBfZ2V0RmFjZXNJblNpbXBsZUxheW91dChpbWFnZVNvdXJjZTogc3RyaW5nLCBsYXlvdXQ6IElTaW1wbGVMYXlvdXQpOiBQcm9taXNlPElUZXh0dXJlRmFjZU1pcE1hcERhdGE+IHtcbiAgICBjb25zdCBtaXBtYXBEYXRhID0ge30gYXMgSVRleHR1cmVGYWNlTWlwTWFwRGF0YTtcbiAgICBjb25zdCBmYWNlTmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhsYXlvdXQpIGFzIChrZXlvZiB0eXBlb2YgbGF5b3V0KVtdO1xuICAgIGZvciAoY29uc3QgZmFjZU5hbWUgb2YgZmFjZU5hbWVzKSB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVG8ga2VlcCBjb25zaXN0ZW50IG9yZGVyXG4gICAgICAgIG1pcG1hcERhdGFbZmFjZU5hbWVdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgZmFjZU5hbWVzLm1hcChhc3luYyAoZmFjZU5hbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZhY2VCbGl0ID0gbGF5b3V0W2ZhY2VOYW1lXTtcbiAgICAgICAgICAgIC8vIOacgOaWsOeJiOacrCBzaGFycCAwLjMyLjYg6L+e57ut6KOB5Ymq5pe25L2/55So5ZCM5LiA5LiqIGltYWdlIHNoYXJwIOWvueixoeS8muijgeWJquW8guW4uO+8jOmcgOimgemHjeaWsOWIm+W7ulxuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBzaGFycChpbWFnZVNvdXJjZSk7XG4gICAgICAgICAgICBjb25zdCBmYWNlU2hhcnAgPSBpbWFnZS5leHRyYWN0KHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBmYWNlQmxpdC54LFxuICAgICAgICAgICAgICAgIHRvcDogZmFjZUJsaXQueSxcbiAgICAgICAgICAgICAgICB3aWR0aDogZmFjZUJsaXQud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBmYWNlQmxpdC5oZWlnaHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGZhY2VJbWFnZURhdGEgPSBhd2FpdCBmYWNlU2hhcnAudG9Gb3JtYXQoc2hhcnAuZm9ybWF0LnBuZykudG9CdWZmZXIoKTtcbiAgICAgICAgICAgIG1pcG1hcERhdGFbZmFjZU5hbWVdID0gZmFjZUltYWdlRGF0YTtcbiAgICAgICAgfSksXG4gICAgKTtcbiAgICByZXR1cm4gbWlwbWFwRGF0YTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX2dldEZhY2VzSW5FcXVpcmVjdGFuZ3VsYXJQcm9qZWN0ZWQoXG4gICAgaW1hZ2VTb3VyY2U6IHN0cmluZyxcbiAgICBmYWNlU2l6ZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgIGlzUkdCRTogYm9vbGVhbiB8IHVuZGVmaW5lZCxcbik6IFByb21pc2U8SVRleHR1cmVGYWNlTWlwTWFwRGF0YT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHJlYWRGaWxlKGltYWdlU291cmNlKTtcbiAgICBjb25zdCBzaGFycFJlc3VsdCA9IGF3YWl0IHNoYXJwKGJ1ZmZlcik7XG4gICAgY29uc3QgbWV0YSA9IGF3YWl0IHNoYXJwUmVzdWx0Lm1ldGFkYXRhKCk7XG5cbiAgICBpZiAoIWZhY2VTaXplKSB7XG4gICAgICAgIGZhY2VTaXplID0gbmVhcmVzdFBvd2VyT2ZUd28oKG1ldGEud2lkdGggfHwgMCkgLyA0KSB8IDA7XG4gICAgfVxuXG4gICAgLy8g5YiG5Ymy5Zu+54mHXG4gICAgY29uc3QgZmFjZUFycmF5ID0gYXdhaXQgZXF1aXJlY3RUb0N1YmVtYXBGYWNlcyhzaGFycFJlc3VsdCwgZmFjZVNpemUsIHtcbiAgICAgICAgaXNSR0JFLFxuICAgIH0pO1xuICAgIGlmIChmYWNlQXJyYXkubGVuZ3RoICE9PSA2KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHJlc29sdmUgZXF1aXJlY3Rhbmd1bGFyIHByb2plY3Rpb24gaW1hZ2UuJyk7XG4gICAgfVxuICAgIC8vIGNvbnN0IGZhY2VzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmFjZUFycmF5Lm1hcChnZXRDYW52YXNEYXRhKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmlnaHQ6IGF3YWl0IHNoYXJwKEJ1ZmZlci5mcm9tKGZhY2VBcnJheVswXS5kYXRhKSwgeyByYXc6IHsgd2lkdGg6IGZhY2VTaXplLCBoZWlnaHQ6IGZhY2VTaXplLCBjaGFubmVsczogNCB9IH0pXG4gICAgICAgICAgICAudG9Gb3JtYXQobWV0YS5mb3JtYXQgfHwgJ3BuZycpXG4gICAgICAgICAgICAudG9CdWZmZXIoKSxcbiAgICAgICAgbGVmdDogYXdhaXQgc2hhcnAoQnVmZmVyLmZyb20oZmFjZUFycmF5WzFdLmRhdGEpLCB7IHJhdzogeyB3aWR0aDogZmFjZVNpemUsIGhlaWdodDogZmFjZVNpemUsIGNoYW5uZWxzOiA0IH0gfSlcbiAgICAgICAgICAgIC50b0Zvcm1hdChtZXRhLmZvcm1hdCB8fCAncG5nJylcbiAgICAgICAgICAgIC50b0J1ZmZlcigpLFxuICAgICAgICB0b3A6IGF3YWl0IHNoYXJwKEJ1ZmZlci5mcm9tKGZhY2VBcnJheVsyXS5kYXRhKSwgeyByYXc6IHsgd2lkdGg6IGZhY2VTaXplLCBoZWlnaHQ6IGZhY2VTaXplLCBjaGFubmVsczogNCB9IH0pXG4gICAgICAgICAgICAudG9Gb3JtYXQobWV0YS5mb3JtYXQgfHwgJ3BuZycpXG4gICAgICAgICAgICAudG9CdWZmZXIoKSxcbiAgICAgICAgYm90dG9tOiBhd2FpdCBzaGFycChCdWZmZXIuZnJvbShmYWNlQXJyYXlbM10uZGF0YSksIHsgcmF3OiB7IHdpZHRoOiBmYWNlU2l6ZSwgaGVpZ2h0OiBmYWNlU2l6ZSwgY2hhbm5lbHM6IDQgfSB9KVxuICAgICAgICAgICAgLnRvRm9ybWF0KG1ldGEuZm9ybWF0IHx8ICdwbmcnKVxuICAgICAgICAgICAgLnRvQnVmZmVyKCksXG4gICAgICAgIGZyb250OiBhd2FpdCBzaGFycChCdWZmZXIuZnJvbShmYWNlQXJyYXlbNF0uZGF0YSksIHsgcmF3OiB7IHdpZHRoOiBmYWNlU2l6ZSwgaGVpZ2h0OiBmYWNlU2l6ZSwgY2hhbm5lbHM6IDQgfSB9KVxuICAgICAgICAgICAgLnRvRm9ybWF0KG1ldGEuZm9ybWF0IHx8ICdwbmcnKVxuICAgICAgICAgICAgLnRvQnVmZmVyKCksXG4gICAgICAgIGJhY2s6IGF3YWl0IHNoYXJwKEJ1ZmZlci5mcm9tKGZhY2VBcnJheVs1XS5kYXRhKSwgeyByYXc6IHsgd2lkdGg6IGZhY2VTaXplLCBoZWlnaHQ6IGZhY2VTaXplLCBjaGFubmVsczogNCB9IH0pXG4gICAgICAgICAgICAudG9Gb3JtYXQobWV0YS5mb3JtYXQgfHwgJ3BuZycpXG4gICAgICAgICAgICAudG9CdWZmZXIoKSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRUb3AobGV2ZWw6IG51bWJlciwgbWlwbWFwTGF5b3V0OiBJTWlwbWFwQXRsYXNMYXlvdXRbXSkge1xuICAgIGlmIChsZXZlbCA9PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBtaXBtYXBMYXlvdXQubGVuZ3RoID4gMCA/IG1pcG1hcExheW91dFswXS5oZWlnaHQgOiAwO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldExlZnQobGV2ZWw6IG51bWJlciwgbWlwbWFwTGF5b3V0OiBJTWlwbWFwQXRsYXNMYXlvdXRbXSkge1xuICAgIC8v5YmN5Lik5bygbWlwbWFw57q1572u5biD5bGAXG4gICAgaWYgKGxldmVsIDwgdmVydGljYWxDb3VudCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgbGV0IGxlZnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSB2ZXJ0aWNhbENvdW50IC0gMTsgaSA8IG1pcG1hcExheW91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaSA+PSBsZXZlbCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGVmdCArPSBtaXBtYXBMYXlvdXRbaV0ud2lkdGg7XG4gICAgfVxuICAgIHJldHVybiBsZWZ0O1xufVxuLyoqXG4gKiDorqHnrpfnuqblrprlpb3nmoRtaXBtYXDluIPlsYDvvIzliY3kuKTlvKBtaXBtYXDnurXlkJHmjpLliJfvvIzlkI7pnaLmjqXnrKzkuozlvKDmqKrlkJHmjpLliJfjgIJcbiAqIEBwYXJhbSBzaXplIOaYr2xldmVsIDDnmoTlsLrlr7hcbiAqL1xuZnVuY3Rpb24gZ2V0TWlwbWFwTGF5b3V0KHNpemU6IG51bWJlcikge1xuICAgIGNvbnN0IG1pcG1hcExheW91dDogSU1pcG1hcEF0bGFzTGF5b3V0W10gPSBbXTtcbiAgICBsZXQgbGV2ZWwgPSAwO1xuICAgIHdoaWxlIChzaXplKSB7XG4gICAgICAgIG1pcG1hcExheW91dC5wdXNoKHtcbiAgICAgICAgICAgIGxlZnQ6IGdldExlZnQobGV2ZWwsIG1pcG1hcExheW91dCksXG4gICAgICAgICAgICB0b3A6IGdldFRvcChsZXZlbCwgbWlwbWFwTGF5b3V0KSxcbiAgICAgICAgICAgIHdpZHRoOiBzaXplLFxuICAgICAgICAgICAgaGVpZ2h0OiBzaXplLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsKyssXG4gICAgICAgIH0pO1xuICAgICAgICBzaXplID4+PSAxO1xuICAgIH1cbiAgICByZXR1cm4gbWlwbWFwTGF5b3V0O1xufVxuXG4vKipcbiAqIOiOt+WPlm1pcG1hcOeahOS/neWtmOebruW9lVxuICog5Y+N5bCE5o6i6ZKI54OY54SZ5Zu+55qE55uu5b2V57uT5p6E77ya5Zy65pmv5ZCNICsg5paH5Lu25ZCNX2NvbnZvbHV0aW9uXG4gKiDlhbbku5bmg4XlhrXng5jnhJnlm77nmoTnm67lvZXnu5PmnoQ6IOaWh+S7tuWQjSArIF9jb252b2x1dGlvblxuICovXG5mdW5jdGlvbiBnZXREaXJPZk1pcG1hcHMoZmlsZVBhdGg6IHN0cmluZywgZXh0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBiYXNlUGF0aCA9IGRpcm5hbWUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGJhc2VOYW1lID0gYmFzZW5hbWUoZmlsZVBhdGgsIGV4dCk7XG4gICAgcmV0dXJuIGpvaW4oYmFzZVBhdGgsIGJhc2VOYW1lICsgJ19jb252b2x1dGlvbicpO1xufVxuXG4vKipcbiAqIOWmguaenHByb2plY3Tnm67lvZXlrZjmnInkuIrmrKHljbfnp6/nmoTnu5PmnpzvvIzml6DpnIDlho3mrKHlgZrljbfnp6/ku6XoioLnnIHlr7zlhaXml7bpl7RcbiAqL1xuZnVuY3Rpb24gaXNOZWVkQ29udm9sdXRpb24oY29udm9sdXRpb25EaXI6IHN0cmluZykge1xuICAgIGlmICghZXhpc3RzU3luYyhjb252b2x1dGlvbkRpcikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGZhY2VDb3VudCA9IDY7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNlQ291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGpvaW4oY29udm9sdXRpb25EaXIsICdtaXBtYXBfJyArIGkudG9TdHJpbmcoKSArICcucG5nJyk7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiDkv53lrZjljbfnp6/lt6XlhbfnlJ/miJDnmoRtaXBtYXBzXG4gKi9cbmZ1bmN0aW9uIHNhdmVNaXBtYXBzKGZpbGVQYXRoOiBzdHJpbmcsIGRlc3RQYXRoOiBzdHJpbmcpIHtcbiAgICBpZiAoIWV4aXN0c1N5bmMoZGVzdFBhdGgpKSB7XG4gICAgICAgIGVuc3VyZURpclN5bmMoZGVzdFBhdGgpO1xuICAgIH1cbiAgICBjb3B5RmlsZVN5bmMoZmlsZVBhdGgsIGpvaW4oZGVzdFBhdGgsIGJhc2VuYW1lKGZpbGVQYXRoKSkpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElGYWNlU3dhcFNwYWNlIHtcbiAgICBbZmFjZU5hbWU6IHN0cmluZ106IEJ1ZmZlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU2l6ZSh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgIHJldHVybiB3aWR0aCAqIDQgPT09IGhlaWdodCAqIDMgfHwgd2lkdGggKiAzID09PSBoZWlnaHQgKiA0IHx8IHdpZHRoICogNiA9PT0gaGVpZ2h0IHx8IHdpZHRoID09PSBoZWlnaHQgKiA2IHx8IHdpZHRoID09PSBoZWlnaHQgKiAyO1xufVxuXG4vLyBhc3luYyBmdW5jdGlvbiBnZXRDYW52YXNEYXRhKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbi8vICAgICBjb25zdCBibG9iID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmU6IChibG9iOiBCbG9iKSA9PiB2b2lkLCByZWplY3QpID0+IHtcbi8vICAgICAgICAgY2FudmFzLnRvQmxvYigoYmxvYikgPT4ge1xuLy8gICAgICAgICAgICAgaWYgKGJsb2IpIHtcbi8vICAgICAgICAgICAgICAgICByZXNvbHZlKGJsb2IpO1xuLy8gICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICByZWplY3QoYmxvYik7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0pO1xuLy8gICAgIH0pO1xuLy8gICAgIGNvbnN0IGFycmF5QnVmZmVyID0gYXdhaXQgbmV3IFJlc3BvbnNlKGJsb2IpLmFycmF5QnVmZmVyKCk7XG4vLyAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyKTtcbi8vIH1cbiJdfQ==