"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAssetSync = loadAssetSync;
function loadAssetSync(uuid, type) {
    // @ts-ignore
    return EditorExtends.serialize.asAsset(uuid, type);
}
