'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPowerOfTwo = isPowerOfTwo;
exports.getMipLevel = getMipLevel;
exports.genMipmapFiles = genMipmapFiles;
exports.checkHasMipMaps = checkHasMipMaps;
exports.compressMipmapFiles = compressMipmapFiles;
/**
 * 工具函数，不可引用一些特殊进程的全局变量或者特殊模块
 */
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
const Sharp = require('sharp');
function isPowerOfTwo(num) {
    return num > 0 && (num & (num - 1)) == 0;
}
// TODO 此方法从引擎处拷贝，如有修改需要同步，否则相关功能会有异常
function getMipLevel(width, height) {
    let size = Math.max(width, height);
    let level = 0;
    while (size) {
        size >>= 1;
        level++;
    }
    return level;
}
async function genMipmapFiles(file, destDir, forceChangeToPowerOfTwo) {
    const sharpResult = Sharp(file);
    const metaData = await sharpResult.metadata();
    if (!isPowerOfTwo(metaData.width) || !isPowerOfTwo(metaData.height)) {
        throw new Error(i18n_1.default.t('builder.project.texture_compress.mipmap.no_power_of_two'));
        // TODO forceChangeToPowerOfTwo
    }
    let width = metaData.width;
    let height = metaData.height;
    destDir = destDir || (0, path_1.dirname)(file);
    const extName = (0, path_1.extname)(file);
    const name = (0, path_1.basename)(file, extName);
    const fileRes = [];
    const mipLevel = getMipLevel(width, height);
    for (let i = mipLevel; i > 0; i--) {
        // 最小一像素
        if (width === 1 && height === 1) {
            break;
        }
        width = Math.max(width / 2, 1);
        height = Math.max(height / 2, 1);
        const dest = (0, path_1.join)(destDir, 'mipmaps', `${name}@mipmap_${i - 1}${extName}`);
        fileRes.push(dest);
        if ((0, fs_extra_1.existsSync)(dest)) {
            continue;
        }
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
        await sharpResult.resize(width, height).toFile(dest);
    }
    // 降序写入
    return fileRes;
}
function checkHasMipMaps(meta) {
    let mipfilter;
    if (meta.subMetas['6c48a']) {
        mipfilter = meta.subMetas['6c48a'].userData.mipfilter;
    }
    else if (meta.userData.textureSetting) {
        mipfilter = meta.userData.textureSetting.mipfilter;
    }
    if (['nearest', 'linear'].includes(mipfilter)) {
        return true;
    }
    return false;
}
async function compressMipmapFiles(optionItem, compressFunc) {
    if (!optionItem.mipmapFiles || !optionItem.mipmapFiles.length || ['png', 'jpg', 'webp'].includes(optionItem.format)) {
        return [];
    }
    console.debug(`Start merge mipmaps file of asset ${optionItem.uuid}`);
    const res = [];
    for (let i = 0; i < optionItem.mipmapFiles.length; i++) {
        const file = optionItem.mipmapFiles[i];
        const dest = (0, path_1.join)((0, path_1.dirname)(optionItem.dest), 'mipmaps', (0, path_1.basename)(file, (0, path_1.extname)(file)) + (0, path_1.extname)(optionItem.dest));
        await compressFunc({
            ...optionItem,
            src: file,
            dest,
        });
        res.push((0, fs_extra_1.readFileSync)(dest));
    }
    console.debug(`Merge mipmaps file of asset ${optionItem.uuid} success`);
    return res;
}
