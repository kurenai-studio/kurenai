"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceImageProxy = void 0;
const rpc_1 = require("../rpc");
/** Node facade for formal reference-image operations; preview remains scene-local. */
exports.ReferenceImageProxy = {
    getState() {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'getState');
    },
    addAndSelect(options) {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'addAndSelect', [options]);
    },
    remove(options) {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'remove', [options]);
    },
    select(options) {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'select', [options]);
    },
    clearBinding() {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'clearBinding');
    },
    setVisible(options) {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'setVisible', [options]);
    },
    refresh() {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'refresh');
    },
    commitParameters(options) {
        return rpc_1.Rpc.getInstance().request('ReferenceImage', 'commitParameters', [options]);
    },
};
