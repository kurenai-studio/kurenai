"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineProxy = void 0;
const rpc_1 = require("../rpc");
exports.EngineProxy = {
    init() {
        return rpc_1.Rpc.getInstance().request('Engine', 'init');
    },
    repaintInEditMode() {
        return rpc_1.Rpc.getInstance().request('Engine', 'repaintInEditMode');
    },
};
