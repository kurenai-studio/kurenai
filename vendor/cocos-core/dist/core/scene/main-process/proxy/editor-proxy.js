"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorProxy = void 0;
const rpc_1 = require("../rpc");
const dump_converter_1 = require("./dump-converter");
function convertEditorResult(dump, options) {
    if ('isScene' in dump && dump.isScene) {
        return dump_converter_1.DumpConverter.toScene(dump, options);
    }
    return dump_converter_1.DumpConverter.toNode(dump, options);
}
exports.EditorProxy = {
    async open(params) {
        const result = await rpc_1.Rpc.getInstance().request('Editor', 'open', [params]);
        return convertEditorResult(result);
    },
    close(params) {
        return rpc_1.Rpc.getInstance().request('Editor', 'close', [params]);
    },
    save(params) {
        return rpc_1.Rpc.getInstance().request('Editor', 'save', [params]);
    },
    reload(params) {
        return rpc_1.Rpc.getInstance().request('Editor', 'reload', [params]);
    },
    create(params) {
        return rpc_1.Rpc.getInstance().request('Editor', 'create', [params]);
    },
    async queryCurrent() {
        const result = await rpc_1.Rpc.getInstance().request('Editor', 'queryCurrent');
        if (!result)
            return null;
        return convertEditorResult(result);
    },
    querySceneSerializedData() {
        return rpc_1.Rpc.getInstance().request('Editor', 'querySceneSerializedData');
    },
    hasOpen() {
        return rpc_1.Rpc.getInstance().request('Editor', 'hasOpen');
    }
};
