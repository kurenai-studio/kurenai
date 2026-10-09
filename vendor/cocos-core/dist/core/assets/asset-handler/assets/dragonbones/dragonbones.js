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
exports.DragonBonesHandler = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");
const utils_1 = require("../../utils");
const DRAGONBONES_ENCODING = { encoding: 'utf8' };
function basenameNoExt(p) {
    const b = path.basename(p);
    const ext = path.extname(p);
    return b.substring(0, b.length - ext.length);
}
exports.DragonBonesHandler = {
    name: 'dragonbones',
    assetType: 'dragonBones.DragonBonesAsset',
    async validate(asset) {
        let json;
        const assetpath = asset.source;
        if (assetpath.endsWith('.json')) {
            const text = fs.readFileSync(assetpath, 'utf8');
            try {
                json = JSON.parse(text);
            }
            catch (e) {
                return false;
            }
        }
        else {
            const bin = fs.readFileSync(assetpath);
            try {
                // https://github.com/nodejs/node/issues/11132
                const ab = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
                json = cc_1.dragonBones.BinaryDataParser.getInstance().parseDragonBonesData(ab);
            }
            catch (e) {
                return false;
            }
        }
        if (!json) {
            return false;
        }
        return Array.isArray(json.armature) || !!json.armatures;
    },
    importer: {
        version: '1.0.2',
        async import(asset) {
            const fspath = asset.source;
            const data = await fse.readFile(fspath, DRAGONBONES_ENCODING);
            const dragonBone = new cc_1.dragonBones.DragonBonesAsset();
            dragonBone.name = basenameNoExt(fspath);
            if (fspath.endsWith('.json')) {
                dragonBone.dragonBonesJson = data;
            }
            else {
                await asset.copyToLibrary('.dbbin', fspath);
                dragonBone._setRawAsset('.dbbin');
            }
            const serializeJSON = EditorExtends.serialize(dragonBone);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.DragonBonesHandler;
