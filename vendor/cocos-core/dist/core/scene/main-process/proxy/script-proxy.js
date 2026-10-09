"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptProxy = void 0;
const rpc_1 = require("../rpc");
exports.ScriptProxy = {
    removeScript() {
        return rpc_1.Rpc.getInstance().request('Script', 'removeScript');
    },
    scriptChange() {
        return rpc_1.Rpc.getInstance().request('Script', 'scriptChange');
    },
    investigatePackerDriver() {
        return rpc_1.Rpc.getInstance().request('Script', 'investigatePackerDriver');
    },
    loadScript() {
        return rpc_1.Rpc.getInstance().request('Script', 'loadScript');
    },
    queryScriptCid(uuid) {
        return rpc_1.Rpc.getInstance().request('Script', 'queryScriptCid', [uuid]);
    },
    queryScriptName(uuid) {
        return rpc_1.Rpc.getInstance().request('Script', 'queryScriptName', [uuid]);
    }
};
