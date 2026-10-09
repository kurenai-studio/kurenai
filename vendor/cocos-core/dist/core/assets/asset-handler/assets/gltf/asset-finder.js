"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGltfAssetFinder = void 0;
const load_asset_sync_1 = require("../utils/load-asset-sync");
class DefaultGltfAssetFinder {
    _assetDetails;
    constructor(_assetDetails = {}) {
        this._assetDetails = _assetDetails;
    }
    serialize() {
        return this._assetDetails;
    }
    set(kind, values) {
        this._assetDetails[kind] = values;
    }
    find(kind, index, type) {
        const uuids = this._assetDetails[kind];
        if (uuids === undefined) {
            return null;
        }
        const detail = uuids[index];
        if (detail === null) {
            return null;
        }
        else {
            return (0, load_asset_sync_1.loadAssetSync)(detail, type) || null;
        }
    }
}
exports.DefaultGltfAssetFinder = DefaultGltfAssetFinder;
