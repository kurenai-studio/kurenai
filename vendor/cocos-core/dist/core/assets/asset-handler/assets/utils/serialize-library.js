"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeForLibrary = serializeForLibrary;
const cc_1 = require("cc");
const serialization_1 = require("cc/editor/serialization");
/**
 * 将对象序列化为存储在库文件夹中应有的格式。
 * @param value
 */
function serializeForLibrary(value) {
    let serializeCompiled = false;
    const serializeOptions = {};
    switch (true) {
        default:
            break;
        case isDirectInstanceOf(value, cc_1.AnimationClip):
            serializeCompiled = false;
            serializeOptions._exporting = false;
            serializeOptions.dontStripDefault = false;
            serializeOptions.useCCON = true;
            break;
    }
    const data = (serializeCompiled ? EditorExtends.serializeCompiled : EditorExtends.serialize)(value, serializeOptions);
    if (data instanceof serialization_1.CCON) {
        const cconb = (0, serialization_1.encodeCCONBinary)(data);
        return {
            data: cconb,
            extension: '.bin',
        };
    }
    else {
        return {
            data,
            extension: '.json',
        };
    }
}
function isDirectInstanceOf(value, type) {
    return (value && Object.getPrototypeOf(value) === type.prototype);
}
