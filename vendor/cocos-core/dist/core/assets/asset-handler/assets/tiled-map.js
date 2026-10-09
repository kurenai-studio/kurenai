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
exports.TiledMapHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const xmldom_1 = require("xmldom");
const sharp_1 = __importDefault(require("sharp"));
const cc_1 = require("cc");
const image_utils_1 = require("./utils/image-utils");
const utils_1 = require("../utils");
/**
 * 读取 tmx 文件内容，查找依赖的 texture 文件信息
 * @param tmxFile tmx 文件路径
 * @param tmxFileData tmx 文件内容
 */
async function searchDependFiles(asset, tmxFile, tmxFileData) {
    // 读取 xml 数据
    const doc = new xmldom_1.DOMParser().parseFromString(tmxFileData);
    if (!doc) {
        console.error(`failed to parse ${tmxFileData}`);
        throw new Error(`TiledMap import failed: failed to parser ${tmxFile}`);
    }
    let imgFullPath = [];
    const tsxAbsFiles = [];
    const tsxSources = [];
    let imgBaseName = [];
    // @ts-ignore
    let imgSizes = [];
    const rootElement = doc.documentElement;
    const tilesetElements = rootElement.getElementsByTagName('tileset');
    // 读取内部的 source 数据
    for (let i = 0; i < tilesetElements.length; i++) {
        const tileset = tilesetElements[i];
        const sourceTSXAttr = tileset.getAttribute('source');
        if (sourceTSXAttr) {
            tsxSources.push(sourceTSXAttr);
            // 获取 texture 路径
            const tsxAbsPath = path.join(path.dirname(tmxFile), sourceTSXAttr);
            asset.depend(tsxAbsPath);
            // const tsxAsset = queryAsset(tsxAbsPath);
            // if (!tsxAsset || !tsxAsset.imported) {
            //     console.warn(`cannot find ${tsxAbsPath}`);
            //     return null;
            // }
            if (fs.existsSync(tsxAbsPath)) {
                tsxAbsFiles.push(tsxAbsPath);
                const tsxContent = fs.readFileSync(tsxAbsPath, 'utf-8');
                const tsxDoc = new xmldom_1.DOMParser().parseFromString(tsxContent);
                if (tsxDoc) {
                    const image = await parseTilesetImages(asset, tsxDoc, tsxAbsPath);
                    if (!image) {
                        return null;
                    }
                    imgFullPath = imgFullPath.concat(image.imageFullPath);
                    imgBaseName = imgBaseName.concat(image.imageBaseName);
                    imgSizes = imgSizes.concat(image.imageSizes);
                }
                else {
                    console.warn('Parse %s failed.', tsxAbsPath);
                }
            }
            else {
                console.warn(`cannot find ${tsxAbsPath}`);
                return null;
            }
        }
        // import images
        const img = await parseTilesetImages(asset, tileset, tmxFile);
        if (!img) {
            return null;
        }
        imgFullPath = imgFullPath.concat(img.imageFullPath);
        imgBaseName = imgBaseName.concat(img.imageBaseName);
        imgSizes = imgSizes.concat(img.imageSizes);
    }
    const imageLayerTextures = [];
    const imageLayerTextureNames = [];
    const imageLayerElements = rootElement.getElementsByTagName('imagelayer');
    for (let ii = 0, nn = imageLayerElements.length; ii < nn; ii++) {
        const imageLayer = imageLayerElements[ii];
        const imageInfos = imageLayer.getElementsByTagName('image');
        if (imageInfos && imageInfos.length > 0) {
            const imageInfo = imageInfos[0];
            const imageSource = imageInfo.getAttribute('source');
            const imgPath = path.join(path.dirname(tmxFile), imageSource);
            asset.depend(imgPath);
            // const imgAsset = queryAsset(imgPath);
            // if (!imgAsset || !imgAsset.imported) {
            //     console.warn(`cannot find ${imgPath}`);
            //     return null;
            // }
            if (fs.existsSync(imgPath)) {
                imageLayerTextures.push(imgPath);
                let imgName = path.relative(path.dirname(tmxFile), imgPath);
                imgName = imgName.replace(/\\/g, '/');
                imageLayerTextureNames.push(imgName);
            }
            else {
                console.warn(`cannot find ${imgPath}`);
            }
        }
    }
    return {
        imgFullPaths: imgFullPath,
        tsxFiles: tsxAbsFiles,
        tsxSources: tsxSources,
        imgBaseNames: imgBaseName,
        imageLayerTextures,
        imageLayerTextureNames,
        imgSizes,
    };
}
/**
 * 读取文件路径下 image 的 source 路径信息以及对应的文件名
 * @param tsxDoc
 * @param tsxPath
 * @returns {srcs, names}
 */
async function parseTilesetImages(asset, tsxDoc, tsxPath) {
    const images = tsxDoc.getElementsByTagName('image');
    const imageFullPath = [];
    const imageBaseName = [];
    // @ts-ignore
    const imageSizes = [];
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageCfg = image.getAttribute('source');
        if (imageCfg) {
            const imgPath = path.join(path.dirname(tsxPath), imageCfg);
            asset.depend(imgPath);
            // const tsxAsset = queryAsset(imgPath);
            // if (!tsxAsset || !tsxAsset.imported) {
            //     console.warn(`cannot find ${imgPath}`);
            //     return null;
            // }
            if (fs.existsSync(imgPath)) {
                const metaData = await (0, sharp_1.default)(imgPath).metadata();
                imageSizes.push(new cc_1.Size(metaData.width, metaData.height));
                imageFullPath.push(imgPath);
                const textureName = path.basename(imgPath);
                imageBaseName.push(textureName);
            }
            else {
                throw new Error(`Image does not exist: ${imgPath}`);
            }
        }
    }
    return { imageFullPath, imageBaseName, imageSizes };
}
exports.TiledMapHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'tiled-map',
    // 引擎内对应的类型
    assetType: 'cc.TiledMapAsset',
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        return true;
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.2',
        versionCode: 1,
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         * @param asset
         */
        async import(asset) {
            await asset.copyToLibrary(asset.extname, asset.source);
            const tiledMap = new cc_1.TiledMapAsset();
            // 读取 tield-map 文件内的数据
            const data = fs.readFileSync(asset.source, { encoding: 'utf8' });
            tiledMap.name = path.basename(asset.source, asset.extname);
            // 3.5 再改
            // tiledMap.name = asset.basename || '';
            const jsonAsset = new cc_1.TextAsset();
            jsonAsset.name = tiledMap.name;
            jsonAsset.text = data;
            // tiledMap.tmxXmlStr = jsonAsset;
            tiledMap.tmxXmlStr = data;
            // 查询获取对应的 texture 依赖文件信息
            const info = await searchDependFiles(asset, asset.source, data);
            if (!info) {
                return false;
            }
            tiledMap.spriteFrames = info.imgFullPaths.map((u) => {
                asset.depend(u);
                const tex = (0, asset_db_1.queryAsset)(u);
                if (tex) {
                    // 如果同时导入，image 已经被导入，则把 image 的类型改为 sprite-frame
                    (0, image_utils_1.changeImageDefaultType)(tex, 'sprite-frame');
                    // @ts-ignore
                    return EditorExtends.serialize.asAsset(tex.uuid + '@f9941', cc_1.SpriteFrame);
                }
            });
            tiledMap.spriteFrameNames = info.imgBaseNames;
            tiledMap.tsxFiles = info.tsxFiles.map((u) => {
                const tsxFile = (0, asset_db_1.queryAsset)(u);
                if (tsxFile) {
                    // @ts-ignore
                    return EditorExtends.serialize.asAsset(tsxFile.uuid, cc_1.TextAsset);
                }
            });
            tiledMap.tsxFileNames = info.tsxSources;
            tiledMap.imageLayerSpriteFrame = info.imageLayerTextures.map((u) => {
                const tex = (0, asset_db_1.queryAsset)(u);
                // @ts-ignore
                return EditorExtends.serialize.asAsset(tex.uuid + '@f9941', cc_1.SpriteFrame);
            });
            tiledMap.imageLayerSpriteFrameNames = info.imageLayerTextureNames.map((u) => path.basename(u));
            tiledMap.spriteFrameSizes = info.imgSizes;
            const serializeJSON = EditorExtends.serialize(tiledMap);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TiledMapHandler;
