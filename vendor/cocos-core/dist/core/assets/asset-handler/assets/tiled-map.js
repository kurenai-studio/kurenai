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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGlsZWQtbWFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3RpbGVkLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw4Q0FBb0Q7QUFDcEQsMkNBQTZCO0FBQzdCLHVDQUF5QjtBQUN6QixtQ0FBbUM7QUFDbkMsa0RBQTBCO0FBQzFCLDJCQUFpRTtBQUNqRSxxREFBNkQ7QUFFN0Qsb0NBQTZDO0FBRzdDOzs7O0dBSUc7QUFDSCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsS0FBWSxFQUFFLE9BQWUsRUFBRSxXQUFtQjtJQUMvRSxZQUFZO0lBQ1osTUFBTSxHQUFHLEdBQUcsSUFBSSxrQkFBUyxFQUFFLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3pELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNQLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0QsSUFBSSxXQUFXLEdBQWEsRUFBRSxDQUFDO0lBQy9CLE1BQU0sV0FBVyxHQUFhLEVBQUUsQ0FBQztJQUNqQyxNQUFNLFVBQVUsR0FBYSxFQUFFLENBQUM7SUFDaEMsSUFBSSxXQUFXLEdBQWEsRUFBRSxDQUFDO0lBQy9CLGFBQWE7SUFDYixJQUFJLFFBQVEsR0FBVyxFQUFFLENBQUM7SUFDMUIsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQztJQUN4QyxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEUsa0JBQWtCO0lBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENB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SSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFRixrQkFBZSx1QkFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQsIHF1ZXJ5QXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IERPTVBhcnNlciB9IGZyb20gJ3htbGRvbSc7XG5pbXBvcnQgU2hhcnAgZnJvbSAnc2hhcnAnO1xuaW1wb3J0IHsgU2l6ZSwgU3ByaXRlRnJhbWUsIFRleHRBc3NldCwgVGlsZWRNYXBBc3NldCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IGNoYW5nZUltYWdlRGVmYXVsdFR5cGUgfSBmcm9tICcuL3V0aWxzL2ltYWdlLXV0aWxzJztcblxuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcblxuLyoqXG4gKiDor7vlj5YgdG14IOaWh+S7tuWGheWuue+8jOafpeaJvuS+nei1lueahCB0ZXh0dXJlIOaWh+S7tuS/oeaBr1xuICogQHBhcmFtIHRteEZpbGUgdG14IOaWh+S7tui3r+W+hFxuICogQHBhcmFtIHRteEZpbGVEYXRhIHRteCDmlofku7blhoXlrrlcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2VhcmNoRGVwZW5kRmlsZXMoYXNzZXQ6IEFzc2V0LCB0bXhGaWxlOiBzdHJpbmcsIHRteEZpbGVEYXRhOiBzdHJpbmcpIHtcbiAgICAvLyDor7vlj5YgeG1sIOaVsOaNrlxuICAgIGNvbnN0IGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcodG14RmlsZURhdGEpO1xuICAgIGlmICghZG9jKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSAke3RteEZpbGVEYXRhfWApO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRpbGVkTWFwIGltcG9ydCBmYWlsZWQ6IGZhaWxlZCB0byBwYXJzZXIgJHt0bXhGaWxlfWApO1xuICAgIH1cbiAgICBsZXQgaW1nRnVsbFBhdGg6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdHN4QWJzRmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdHN4U291cmNlczogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgaW1nQmFzZU5hbWU6IHN0cmluZ1tdID0gW107XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGxldCBpbWdTaXplczogU2l6ZVtdID0gW107XG4gICAgY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgIGNvbnN0IHRpbGVzZXRFbGVtZW50cyA9IHJvb3RFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0aWxlc2V0Jyk7XG4gICAgLy8g6K+75Y+W5YaF6YOo55qEIHNvdXJjZSDmlbDmja5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRpbGVzZXRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCB0aWxlc2V0ID0gdGlsZXNldEVsZW1lbnRzW2ldO1xuICAgICAgICBjb25zdCBzb3VyY2VUU1hBdHRyID0gdGlsZXNldC5nZXRBdHRyaWJ1dGUoJ3NvdXJjZScpO1xuICAgICAgICBpZiAoc291cmNlVFNYQXR0cikge1xuICAgICAgICAgICAgdHN4U291cmNlcy5wdXNoKHNvdXJjZVRTWEF0dHIpO1xuICAgICAgICAgICAgLy8g6I635Y+WIHRleHR1cmUg6Lev5b6EXG4gICAgICAgICAgICBjb25zdCB0c3hBYnNQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZSh0bXhGaWxlKSwgc291cmNlVFNYQXR0cik7XG4gICAgICAgICAgICBhc3NldC5kZXBlbmQodHN4QWJzUGF0aCk7XG5cbiAgICAgICAgICAgIC8vIGNvbnN0IHRzeEFzc2V0ID0gcXVlcnlBc3NldCh0c3hBYnNQYXRoKTtcbiAgICAgICAgICAgIC8vIGlmICghdHN4QXNzZXQgfHwgIXRzeEFzc2V0LmltcG9ydGVkKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS53YXJuKGBjYW5ub3QgZmluZCAke3RzeEFic1BhdGh9YCk7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHRzeEFic1BhdGgpKSB7XG4gICAgICAgICAgICAgICAgdHN4QWJzRmlsZXMucHVzaCh0c3hBYnNQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0c3hDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHRzeEFic1BhdGgsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRzeERvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcodHN4Q29udGVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHRzeERvYykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IHBhcnNlVGlsZXNldEltYWdlcyhhc3NldCwgdHN4RG9jLCB0c3hBYnNQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW1nRnVsbFBhdGggPSBpbWdGdWxsUGF0aC5jb25jYXQoaW1hZ2UhLmltYWdlRnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpbWdCYXNlTmFtZSA9IGltZ0Jhc2VOYW1lLmNvbmNhdChpbWFnZSEuaW1hZ2VCYXNlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGltZ1NpemVzID0gaW1nU2l6ZXMuY29uY2F0KGltYWdlIS5pbWFnZVNpemVzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1BhcnNlICVzIGZhaWxlZC4nLCB0c3hBYnNQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgY2Fubm90IGZpbmQgJHt0c3hBYnNQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGltcG9ydCBpbWFnZXNcbiAgICAgICAgY29uc3QgaW1nID0gYXdhaXQgcGFyc2VUaWxlc2V0SW1hZ2VzKGFzc2V0LCB0aWxlc2V0LCB0bXhGaWxlKTtcbiAgICAgICAgaWYgKCFpbWcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGltZ0Z1bGxQYXRoID0gaW1nRnVsbFBhdGguY29uY2F0KGltZy5pbWFnZUZ1bGxQYXRoKTtcbiAgICAgICAgaW1nQmFzZU5hbWUgPSBpbWdCYXNlTmFtZS5jb25jYXQoaW1nLmltYWdlQmFzZU5hbWUpO1xuICAgICAgICBpbWdTaXplcyA9IGltZ1NpemVzLmNvbmNhdChpbWchLmltYWdlU2l6ZXMpO1xuICAgIH1cblxuICAgIGNvbnN0IGltYWdlTGF5ZXJUZXh0dXJlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpbWFnZUxheWVyVGV4dHVyZU5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGltYWdlTGF5ZXJFbGVtZW50cyA9IHJvb3RFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWFnZWxheWVyJyk7XG4gICAgZm9yIChsZXQgaWkgPSAwLCBubiA9IGltYWdlTGF5ZXJFbGVtZW50cy5sZW5ndGg7IGlpIDwgbm47IGlpKyspIHtcbiAgICAgICAgY29uc3QgaW1hZ2VMYXllciA9IGltYWdlTGF5ZXJFbGVtZW50c1tpaV07XG4gICAgICAgIGNvbnN0IGltYWdlSW5mb3MgPSBpbWFnZUxheWVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWFnZScpO1xuICAgICAgICBpZiAoaW1hZ2VJbmZvcyAmJiBpbWFnZUluZm9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlSW5mbyA9IGltYWdlSW5mb3NbMF07XG4gICAgICAgICAgICBjb25zdCBpbWFnZVNvdXJjZSA9IGltYWdlSW5mby5nZXRBdHRyaWJ1dGUoJ3NvdXJjZScpO1xuICAgICAgICAgICAgY29uc3QgaW1nUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodG14RmlsZSksIGltYWdlU291cmNlISk7XG4gICAgICAgICAgICBhc3NldC5kZXBlbmQoaW1nUGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zdCBpbWdBc3NldCA9IHF1ZXJ5QXNzZXQoaW1nUGF0aCk7XG4gICAgICAgICAgICAvLyBpZiAoIWltZ0Fzc2V0IHx8ICFpbWdBc3NldC5pbXBvcnRlZCkge1xuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUud2FybihgY2Fubm90IGZpbmQgJHtpbWdQYXRofWApO1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhpbWdQYXRoKSkge1xuICAgICAgICAgICAgICAgIGltYWdlTGF5ZXJUZXh0dXJlcy5wdXNoKGltZ1BhdGgpO1xuICAgICAgICAgICAgICAgIGxldCBpbWdOYW1lID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUodG14RmlsZSksIGltZ1BhdGgpO1xuICAgICAgICAgICAgICAgIGltZ05hbWUgPSBpbWdOYW1lLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgICAgICAgICBpbWFnZUxheWVyVGV4dHVyZU5hbWVzLnB1c2goaW1nTmFtZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgY2Fubm90IGZpbmQgJHtpbWdQYXRofWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW1nRnVsbFBhdGhzOiBpbWdGdWxsUGF0aCxcbiAgICAgICAgdHN4RmlsZXM6IHRzeEFic0ZpbGVzLFxuICAgICAgICB0c3hTb3VyY2VzOiB0c3hTb3VyY2VzLFxuICAgICAgICBpbWdCYXNlTmFtZXM6IGltZ0Jhc2VOYW1lLFxuICAgICAgICBpbWFnZUxheWVyVGV4dHVyZXMsXG4gICAgICAgIGltYWdlTGF5ZXJUZXh0dXJlTmFtZXMsXG4gICAgICAgIGltZ1NpemVzLFxuICAgIH07XG59XG5cbi8qKlxuICog6K+75Y+W5paH5Lu26Lev5b6E5LiLIGltYWdlIOeahCBzb3VyY2Ug6Lev5b6E5L+h5oGv5Lul5Y+K5a+55bqU55qE5paH5Lu25ZCNXG4gKiBAcGFyYW0gdHN4RG9jXG4gKiBAcGFyYW0gdHN4UGF0aFxuICogQHJldHVybnMge3NyY3MsIG5hbWVzfVxuICovXG5hc3luYyBmdW5jdGlvbiBwYXJzZVRpbGVzZXRJbWFnZXMoYXNzZXQ6IEFzc2V0LCB0c3hEb2M6IEVsZW1lbnQgfCBEb2N1bWVudCwgdHN4UGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgaW1hZ2VzID0gdHN4RG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWFnZScpO1xuICAgIGNvbnN0IGltYWdlRnVsbFBhdGg6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgaW1hZ2VCYXNlTmFtZTogc3RyaW5nW10gPSBbXTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgaW1hZ2VTaXplczogU2l6ZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBpbWFnZXNbaV07XG4gICAgICAgIGNvbnN0IGltYWdlQ2ZnID0gaW1hZ2UuZ2V0QXR0cmlidXRlKCdzb3VyY2UnKTtcbiAgICAgICAgaWYgKGltYWdlQ2ZnKSB7XG4gICAgICAgICAgICBjb25zdCBpbWdQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZSh0c3hQYXRoKSwgaW1hZ2VDZmcpO1xuXG4gICAgICAgICAgICBhc3NldC5kZXBlbmQoaW1nUGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zdCB0c3hBc3NldCA9IHF1ZXJ5QXNzZXQoaW1nUGF0aCk7XG4gICAgICAgICAgICAvLyBpZiAoIXRzeEFzc2V0IHx8ICF0c3hBc3NldC5pbXBvcnRlZCkge1xuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUud2FybihgY2Fubm90IGZpbmQgJHtpbWdQYXRofWApO1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoaW1nUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhRGF0YSA9IGF3YWl0IFNoYXJwKGltZ1BhdGgpLm1ldGFkYXRhKCk7XG4gICAgICAgICAgICAgICAgaW1hZ2VTaXplcy5wdXNoKG5ldyBTaXplKG1ldGFEYXRhLndpZHRoLCBtZXRhRGF0YS5oZWlnaHQpKTtcblxuICAgICAgICAgICAgICAgIGltYWdlRnVsbFBhdGgucHVzaChpbWdQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0dXJlTmFtZSA9IHBhdGguYmFzZW5hbWUoaW1nUGF0aCk7XG4gICAgICAgICAgICAgICAgaW1hZ2VCYXNlTmFtZS5wdXNoKHRleHR1cmVOYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbWFnZSBkb2VzIG5vdCBleGlzdDogJHtpbWdQYXRofWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IGltYWdlRnVsbFBhdGgsIGltYWdlQmFzZU5hbWUsIGltYWdlU2l6ZXMgfTtcbn1cbmV4cG9ydCBjb25zdCBUaWxlZE1hcEhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICd0aWxlZC1tYXAnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuVGlsZWRNYXBBc3NldCcsXG4gICAgLyoqXG4gICAgICog5Yik5pat5piv5ZCm5YWB6K645L2/55So5b2T5YmN55qEIEhhbmRsZXIg6L+b6KGM5a+85YWlXG4gICAgICogQHBhcmFtIGFzc2V0XG4gICAgICovXG4gICAgYXN5bmMgdmFsaWRhdGUoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4yJyxcbiAgICAgICAgdmVyc2lvbkNvZGU6IDEsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuY29weVRvTGlicmFyeShhc3NldC5leHRuYW1lLCBhc3NldC5zb3VyY2UpO1xuXG4gICAgICAgICAgICBjb25zdCB0aWxlZE1hcCA9IG5ldyBUaWxlZE1hcEFzc2V0KCk7XG4gICAgICAgICAgICAvLyDor7vlj5YgdGllbGQtbWFwIOaWh+S7tuWGheeahOaVsOaNrlxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhhc3NldC5zb3VyY2UsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgICAgICAgIHRpbGVkTWFwLm5hbWUgPSBwYXRoLmJhc2VuYW1lKGFzc2V0LnNvdXJjZSwgYXNzZXQuZXh0bmFtZSk7XG4gICAgICAgICAgICAvLyAzLjUg5YaN5pS5XG4gICAgICAgICAgICAvLyB0aWxlZE1hcC5uYW1lID0gYXNzZXQuYmFzZW5hbWUgfHwgJyc7XG5cbiAgICAgICAgICAgIGNvbnN0IGpzb25Bc3NldCA9IG5ldyBUZXh0QXNzZXQoKTtcbiAgICAgICAgICAgIGpzb25Bc3NldC5uYW1lID0gdGlsZWRNYXAubmFtZTtcbiAgICAgICAgICAgIGpzb25Bc3NldC50ZXh0ID0gZGF0YTtcbiAgICAgICAgICAgIC8vIHRpbGVkTWFwLnRteFhtbFN0ciA9IGpzb25Bc3NldDtcbiAgICAgICAgICAgIHRpbGVkTWFwLnRteFhtbFN0ciA9IGRhdGE7XG5cbiAgICAgICAgICAgIC8vIOafpeivouiOt+WPluWvueW6lOeahCB0ZXh0dXJlIOS+nei1luaWh+S7tuS/oeaBr1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IHNlYXJjaERlcGVuZEZpbGVzKGFzc2V0LCBhc3NldC5zb3VyY2UsIGRhdGEpO1xuICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aWxlZE1hcC5zcHJpdGVGcmFtZXMgPSBpbmZvLmltZ0Z1bGxQYXRocy5tYXAoKHUpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NldC5kZXBlbmQodSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGV4ID0gcXVlcnlBc3NldCh1KTtcbiAgICAgICAgICAgICAgICBpZiAodGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOWQjOaXtuWvvOWFpe+8jGltYWdlIOW3sue7j+iiq+WvvOWFpe+8jOWImeaKiiBpbWFnZSDnmoTnsbvlnovmlLnkuLogc3ByaXRlLWZyYW1lXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZUltYWdlRGVmYXVsdFR5cGUodGV4LCAnc3ByaXRlLWZyYW1lJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldCh0ZXgudXVpZCArICdAZjk5NDEnLCBTcHJpdGVGcmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aWxlZE1hcC5zcHJpdGVGcmFtZU5hbWVzID0gaW5mby5pbWdCYXNlTmFtZXM7XG4gICAgICAgICAgICB0aWxlZE1hcC50c3hGaWxlcyA9IGluZm8udHN4RmlsZXMubWFwKCh1KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHN4RmlsZSA9IHF1ZXJ5QXNzZXQodSk7XG4gICAgICAgICAgICAgICAgaWYgKHRzeEZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldCh0c3hGaWxlLnV1aWQsIFRleHRBc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aWxlZE1hcC50c3hGaWxlTmFtZXMgPSBpbmZvLnRzeFNvdXJjZXM7XG5cbiAgICAgICAgICAgIHRpbGVkTWFwLmltYWdlTGF5ZXJTcHJpdGVGcmFtZSA9IGluZm8uaW1hZ2VMYXllclRleHR1cmVzLm1hcCgodSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleCA9IHF1ZXJ5QXNzZXQodSk7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZS5hc0Fzc2V0KHRleC51dWlkICsgJ0BmOTk0MScsIFNwcml0ZUZyYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGlsZWRNYXAuaW1hZ2VMYXllclNwcml0ZUZyYW1lTmFtZXMgPSBpbmZvLmltYWdlTGF5ZXJUZXh0dXJlTmFtZXMubWFwKCh1KSA9PiBwYXRoLmJhc2VuYW1lKHUpKTtcbiAgICAgICAgICAgIHRpbGVkTWFwLnNwcml0ZUZyYW1lU2l6ZXMgPSBpbmZvLmltZ1NpemVzO1xuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUodGlsZWRNYXApO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgVGlsZWRNYXBIYW5kbGVyO1xuIl19