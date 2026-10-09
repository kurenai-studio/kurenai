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
exports.DragonBonesAtlasHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");
const utils_1 = require("../../utils");
function basenameNoExt(p) {
    const b = path.basename(p);
    const ext = path.extname(p);
    return b.substring(0, b.length - ext.length);
}
exports.DragonBonesAtlasHandler = {
    name: 'dragonbones-atlas',
    assetType: 'dragonBones.DragonBonesAtlasAsset',
    async validate(asset) {
        const assetpath = asset.source;
        let json;
        const text = fs.readFileSync(assetpath, 'utf8');
        try {
            json = JSON.parse(text);
        }
        catch (e) {
            return false;
        }
        return typeof json.imagePath === 'string' && Array.isArray(json.SubTexture);
    },
    importer: {
        version: '1.0.2',
        async import(asset) {
            const fspath = asset.source;
            const data = fse.readFileSync(fspath, { encoding: 'utf8' });
            const json = JSON.parse(data);
            // parse the depended texture
            const imgPath = path.resolve(path.dirname(fspath), json.imagePath);
            asset.depend(imgPath);
            const texAsset = (0, asset_db_1.queryAsset)(imgPath);
            if (texAsset && !texAsset.init) {
                asset._assetDB.taskManager.pause(asset.task);
                await texAsset.waitInit();
                asset._assetDB.taskManager.resume(asset.task);
            }
            if (!texAsset || !texAsset.imported) {
                console.warn((0, utils_1.i18nTranslate)('importer.dragonbones_atlas.texture_not_imported', { texture: imgPath }) +
                    ` {asset(${asset.uuid})}`);
                return false;
            }
            else if (!fs.existsSync(imgPath)) {
                throw new Error((0, utils_1.i18nTranslate)('importer.dragonbones_atlas.texture_not_found', {
                    atlas: fspath,
                    texture: json.imagePath,
                }) + ` {asset(${asset.uuid})}`);
            }
            const atlas = new cc_1.dragonBones.DragonBonesAtlasAsset();
            atlas.name = basenameNoExt(fspath);
            atlas.atlasJson = data;
            atlas.texture = EditorExtends.serialize.asAsset(texAsset.uuid + '@6c48a', cc_1.Texture2D);
            const serializeJSON = EditorExtends.serialize(atlas);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.DragonBonesAtlasHandler;
