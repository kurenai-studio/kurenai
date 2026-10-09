"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCCON = transformCCON;
const serialization_1 = require("cc/editor/serialization");
const fs_extra_1 = require("fs-extra");
async function transformCCON(path) {
    const buffer = await (0, fs_extra_1.readFile)(path);
    const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return (0, serialization_1.decodeCCONBinary)(bytes);
}
