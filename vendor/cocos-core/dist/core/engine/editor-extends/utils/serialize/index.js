"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = serialize;
exports.serializeCompiled = serializeCompiled;
const builder_1 = require("./compiled/builder");
const pack_jsons_1 = __importDefault(require("./compiled/pack-jsons"));
const parser_1 = __importDefault(require("./parser"));
const dynamic_builder_1 = require("./dynamic-builder");
function serialize(obj, options) {
    // console.time('Serialize in dynamic format');
    options = Object.assign({
        builder: 'dynamic',
    }, options);
    const res = (0, parser_1.default)(obj, options);
    // console.timeEnd('Serialize in dynamic format');
    // if (!options.forceInline) {
    //     // console.time('Serialize by legacy module');
    //     const expectedRes = serializeLegacy(obj, options);
    //     // console.timeEnd('Serialize by legacy module');
    //     if (typeof res === 'string') {
    //         if (res !== expectedRes) {
    //             console.warn('Different serialize result, new:');
    //             console.log(res);
    //             console.warn('Old:');
    //             console.log(expectedRes);
    //             return expectedRes;
    //         }
    //     }
    // }
    return res;
}
serialize.asAsset = dynamic_builder_1.asAsset;
serialize.setName = dynamic_builder_1.setName;
serialize.findRootObject = dynamic_builder_1.findRootObject;
function serializeCompiled(obj, options) {
    options = Object.assign({
        builder: 'compiled',
        dontStripDefault: false,
    }, options);
    return (0, parser_1.default)(obj, options);
}
serializeCompiled.getRootData = builder_1.getRootData;
serializeCompiled.packJSONs = pack_jsons_1.default;
