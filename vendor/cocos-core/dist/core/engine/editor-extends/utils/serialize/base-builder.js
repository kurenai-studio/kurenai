"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Builder = void 0;
const serialization_1 = require("cc/editor/serialization");
// 通过 builder 的 API，把当前序列化的所有数据传输给 builder，由 builder 生成具体的序列化格式
class Builder {
    constructor(options) {
        this.minify = !!options.minify;
        this.stringify = !!('stringify' in options ? options.stringify : true);
        this._useCCON = options.useCCON ?? false;
    }
    // // 标记对象处于被多个参数共同引用的状态
    // markAsSharedObj (obj: any): void;
    dump() {
        if (this._useCCON) {
            return this._dumpAsCCON();
        }
        else {
            return this._dumpAsJson();
        }
    }
    get hasBinaryBuffer() {
        return this._useCCON;
    }
    get mainBufferBuilder() {
        return this._mainBufferBuilder;
    }
    stringify;
    minify;
    _mainBufferBuilder = new serialization_1.BufferBuilder();
    _dumpAsJson() {
        const mainJsonData = this.finalizeJsonPart();
        if (this.stringify) {
            return JSON.stringify(mainJsonData, null, this.minify ? 0 : 2);
        }
        else {
            return mainJsonData;
        }
    }
    _dumpAsCCON() {
        const json = this.finalizeJsonPart();
        const { _mainBufferBuilder: mainBufferBuilder } = this;
        const chunks = mainBufferBuilder.byteLength === 0
            ? []
            : [mainBufferBuilder.get()];
        return new serialization_1.CCON(json, chunks);
    }
}
exports.Builder = Builder;
