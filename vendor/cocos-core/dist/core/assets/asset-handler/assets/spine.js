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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpineHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const ATLAS_EXTS = ['.atlas', '.txt', '.atlas.txt', ''];
const cc_1 = require("cc");
const utils_1 = require("../utils");
function searchAtlas(skeletonPath, callback) {
    const ext = path.extname(skeletonPath);
    skeletonPath = skeletonPath.substr(0, skeletonPath.length - ext.length);
    function next(index) {
        const suffix = ATLAS_EXTS[index];
        const path = skeletonPath + suffix;
        fs.exists(path, (exists) => {
            if (exists) {
                return callback(null, path);
            }
            else if (index + 1 < ATLAS_EXTS.length) {
                next(index + 1);
            }
            else {
                // 表示没有找到
                callback(null, undefined);
            }
        });
    }
    next(0);
}
function loadAtlasText(asset, callback) {
    searchAtlas(asset.source, (err, p) => {
        if (err) {
            return callback(err, null);
        }
        if (!p) {
            callback(new Error(`The atlas with the same name is not found. Select the {asset[${asset.basename}${asset.extname}](${asset.uuid})} asset and add it manually in the attribute inspector.`), null);
        }
        else {
            fs.readFile(p, { encoding: 'utf8' }, (err, data) => {
                callback(err, {
                    path: p,
                    content: data,
                });
            });
        }
    });
}
// A dummy texture loader to record all textures in atlas
class TextureParser {
    asset;
    atlasPath;
    texturesUUID;
    textureNames;
    constructor(asset, atlasPath) {
        this.atlasPath = atlasPath;
        // array of loaded texture uuid
        this.texturesUUID = [];
        // array of corresponding line
        this.textureNames = [];
        this.asset = asset;
        this.asset.depend(atlasPath);
    }
    load(line) {
        const name = path.basename(line);
        const base = path.dirname(this.atlasPath);
        const filePath = path.resolve(base, name);
        const asset = (0, asset_db_1.queryAsset)(filePath);
        if (asset) {
            const uuid = asset.uuid + '@6c48a';
            this.asset.depend(uuid);
            console.log(`UUID is initialized for ${filePath}.`);
            this.texturesUUID.push(uuid);
            this.textureNames.push(line);
        }
        else if (!fs.existsSync(filePath)) {
            console.error(`Can not find texture "${line}" for atlas "${this.atlasPath}"`);
        }
        else {
            // AssetDB may call postImport more than once, we can get uuid in the next time.
            console.warn(`WARN: UUID not yet initialized for "${filePath}".`);
        }
        return null;
    }
}
const scale = 1;
exports.SpineHandler = {
    name: 'spine-data',
    assetType: 'sp.SkeletonData',
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        const assetpath = asset.source;
        // handle binary file
        if (assetpath.endsWith('.skel')) {
            return true;
        }
        // TODO - import as a folder named '***.spine'
        let json;
        const text = fs.readFileSync(assetpath, 'utf8');
        const fastTest = text.slice(0, 30);
        const maybe = fastTest.indexOf('slots') > 0 ||
            fastTest.indexOf('skins') > 0 ||
            fastTest.indexOf('events') > 0 ||
            fastTest.indexOf('animations') > 0 ||
            fastTest.indexOf('bones') > 0 ||
            fastTest.indexOf('skeleton') > 0 ||
            fastTest.indexOf('"ik"') > 0;
        if (maybe) {
            try {
                json = JSON.parse(text);
            }
            catch (e) {
                return false;
            }
            return Array.isArray(json.bones);
        }
        return false;
    },
    importer: {
        version: '1.2.7',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否更新的 boolean
         * 如果返回 true，则会更新依赖这个资源的所有资源
         * @param asset
         */
        async import(asset) {
            const fspath = asset.source;
            if (fspath.endsWith('.skel')) {
                return await importBinary(asset);
            }
            else {
                return await importJson(asset);
            }
        },
    },
};
exports.default = exports.SpineHandler;
/**
 * 通过 TextureParser 解析 .atlas 后缀的图集
 * @param asset
 * @param spineAtlas
 */
function parserAtlas(asset, spineAtlas) {
    // parse atlas textures
    const textureParser = new TextureParser(asset, spineAtlas.path);
    const lines = spineAtlas.content.split('\n');
    if (!lines || lines.length < 1) {
        throw new Error(`Failed to load atlas file: "${spineAtlas.path}"`);
    }
    let page = null;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.length === 0) {
            page = null;
        }
        else if (!page) {
            page = trimmed;
            textureParser.load(page);
        }
    }
    return {
        textures: textureParser.texturesUUID.map((uuid) => {
            return EditorExtends.serialize.asAsset(uuid /* + '@f9941' */, cc_1.Texture2D);
        }),
        textureNames: textureParser.textureNames,
        atlasText: spineAtlas.content,
        atlasUuid: (0, asset_db_1.queryUUID)(spineAtlas.path),
    };
}
/**
 * 得到 spine atlas 的解析数据，设置给 spData，然后存到为 JSON 到 Library 中
 * @param asset - spine 资源
 * @param spData - sp.SkeletonData 类型
 * @param spineAtlas - spine atlas 的解析数据
 * @param resolve
 * @param reject
 */
function saveToLibrary(asset, spData, spineAtlas, resolve, reject) {
    if (spineAtlas) {
        try {
            const info = parserAtlas(asset, spineAtlas);
            spData.textures = info.textures;
            spData.textureNames = info.textureNames;
            spData.atlasText = info.atlasText;
            // 存储 atlas uuid 到 userData
            asset.userData.atlasUuid = info.atlasUuid;
        }
        catch (e) {
            reject(e);
        }
    }
    const serializeJSON = EditorExtends.serialize(spData);
    asset.saveToLibrary('.json', serializeJSON).then(() => {
        const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
        asset.setData('depends', depends);
        resolve(true);
    }, reject);
}
function initTexture(asset, spData) {
    return new Promise((resolve, reject) => {
        const spineUserData = asset.userData;
        // 如果有图集 uuid 就通过图集 uuid 获取到资源去解析
        if (spineUserData.atlasUuid) {
            const atlasAsset = (0, asset_db_1.queryAsset)(spineUserData.atlasUuid);
            if (atlasAsset) {
                fs.readFile(atlasAsset.source, { encoding: 'utf8' }, (err, data) => {
                    const spineAtlas = {
                        path: atlasAsset.source,
                        content: data,
                    };
                    saveToLibrary(asset, spData, spineAtlas, resolve, reject);
                });
            }
            else {
                reject(new Error(`Failed to load atlas file by uuid: ${spineUserData.atlasUuid}`));
            }
        }
        else {
            // 没有图集 uuid 时，去查找与 spine 同名的图集
            loadAtlasText(asset, (err, spineAtlas) => {
                if (err) {
                    return reject(err);
                }
                saveToLibrary(asset, spData, spineAtlas, resolve, reject);
            });
        }
    });
}
async function importJson(asset) {
    const fspath = asset.source;
    const data = await fse.readFile(fspath, { encoding: 'utf8' });
    let json;
    try {
        json = JSON.parse(data);
    }
    catch (e) {
        console.error(e);
        return false;
    }
    const spData = new cc_1.sp.SkeletonData();
    spData.name = asset.basename || '';
    spData.skeletonJson = json;
    spData.scale = scale;
    return await initTexture(asset, spData);
}
async function importBinary(asset) {
    // import native asset
    // Since skel is not in the white list of the WeChat suffix, bin is used instead
    await asset.copyToLibrary('.bin', asset.source);
    const fspath = asset.source;
    // import asset
    const spAsset = new cc_1.sp.SkeletonData();
    spAsset.name = asset.basename || '';
    spAsset._setRawAsset('.bin');
    spAsset.scale = scale;
    return await initTexture(asset, spAsset);
}
