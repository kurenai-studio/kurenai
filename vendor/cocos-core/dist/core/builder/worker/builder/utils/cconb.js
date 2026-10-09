"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCCONFormatAssetInLibrary = hasCCONFormatAssetInLibrary;
exports.getCCONFormatAssetInLibrary = getCCONFormatAssetInLibrary;
exports.getDesiredCCONExtensionMap = getDesiredCCONExtensionMap;
exports.outputCCONFormat = outputCCONFormat;
const serialization_1 = require("cc/editor/serialization");
const fs_extra_1 = require("fs-extra");
function hasCCONFormatAssetInLibrary(asset) {
    // 目前规则：如果一个 asset 只有一个 .bin 文件，那么它是 CCON 格式。 
    const { files } = asset.meta;
    return files.length === 1 && files[0] === '.bin';
}
function getCCONFormatAssetInLibrary(asset) {
    return hasCCONFormatAssetInLibrary(asset) ? (asset.library + '.bin') : '';
}
function getDesiredCCONExtensionMap(serializeOption) {
    return '.cconb';
}
async function outputCCONFormat(ccon, fullBaseName) {
    await (0, fs_extra_1.outputFile)(`${fullBaseName}.bin`, (0, serialization_1.encodeCCONBinary)(ccon));
}
