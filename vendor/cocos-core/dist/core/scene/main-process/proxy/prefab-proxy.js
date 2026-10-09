"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabProxy = void 0;
const rpc_1 = require("../rpc");
const dump_converter_1 = require("./dump-converter");
exports.PrefabProxy = {
    applyPrefabChanges(params) {
        return rpc_1.Rpc.getInstance().request('Prefab', 'applyPrefabChanges', [params]);
    },
    async createPrefabFromNode(params) {
        const result = await rpc_1.Rpc.getInstance().request('Prefab', 'createPrefabFromNode', [params]);
        return dump_converter_1.DumpConverter.toNode(result);
    },
    async getPrefabInfo(params) {
        const result = await rpc_1.Rpc.getInstance().request('Prefab', 'getPrefabInfo', [params]);
        if (!result)
            return null;
        return dump_converter_1.DumpConverter.convertPrefab(result);
    },
    isPrefabInstance(params) {
        return rpc_1.Rpc.getInstance().request('Prefab', 'isPrefabInstance', [params]);
    },
    revertToPrefab(params) {
        return rpc_1.Rpc.getInstance().request('Prefab', 'revertToPrefab', [params]);
    },
    async unpackPrefabInstance(params) {
        const result = await rpc_1.Rpc.getInstance().request('Prefab', 'unpackPrefabInstance', [params]);
        return dump_converter_1.DumpConverter.toNode(result);
    }
};
