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
