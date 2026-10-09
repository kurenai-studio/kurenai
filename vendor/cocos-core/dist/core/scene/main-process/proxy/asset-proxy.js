"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetProxy = void 0;
const rpc_1 = require("../rpc");
exports.AssetProxy = {
    assetChanged(uuid) {
        return rpc_1.Rpc.getInstance().request('Asset', 'assetChanged', [uuid]);
    },
    assetDeleted(uuid) {
        return rpc_1.Rpc.getInstance().request('Asset', 'assetDeleted', [uuid]);
    },
};
