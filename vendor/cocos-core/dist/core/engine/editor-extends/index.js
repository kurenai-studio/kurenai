'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingReporter = exports.PrefabUtils = exports.GeometryUtils = exports.Component = exports.Node = exports.Script = exports.UuidUtils = exports.walkProperties = exports.deserializeFull = exports.serializeCompiled = exports.serialize = void 0;
exports.init = init;
exports.emit = emit;
exports.on = on;
exports.removeListener = removeListener;
// MissingReporter
const missing_class_reporter_1 = require("./missing-reporter/missing-class-reporter");
const missing_object_reporter_1 = require("./missing-reporter/missing-object-reporter");
var object_walker_1 = require("./missing-reporter/object-walker");
Object.defineProperty(exports, "walkProperties", { enumerable: true, get: function () { return object_walker_1.walkProperties; } });
const utils_1 = __importDefault(require("../../base/utils"));
const events_1 = __importDefault(require("events"));
if (!events_1.default.prototype.off) {
    events_1.default.prototype.off = events_1.default.prototype.removeListener;
}
const script_1 = __importDefault(require("./manager/script"));
const node_1 = __importDefault(require("./manager/node"));
const component_1 = __importDefault(require("./manager/component"));
exports.UuidUtils = utils_1.default.UUID;
exports.Script = new script_1.default();
exports.Node = new node_1.default();
exports.Component = new component_1.default();
exports.MissingReporter = {
    classInstance: missing_class_reporter_1.MissingClass,
    class: missing_class_reporter_1.MissingClassReporter,
    object: missing_object_reporter_1.MissingObjectReporter,
};
async function init() {
    const serializeUtils = await Promise.resolve().then(() => __importStar(require('./utils/serialize')));
    exports.serialize = serializeUtils.serialize;
    exports.serializeCompiled = serializeUtils.serializeCompiled;
    exports.deserializeFull = await Promise.resolve().then(() => __importStar(require('./utils/deserialize')));
    exports.GeometryUtils = await Promise.resolve().then(() => __importStar(require('./utils/geometry')));
    exports.PrefabUtils = await Promise.resolve().then(() => __importStar(require('./utils/prefab')));
    exports.Script.allow = true;
    exports.Node.allow = true;
    exports.Component.allow = true;
}
const event = new events_1.default();
function emit(name, ...args) {
    event.emit(name, ...args);
}
function on(name, handle) {
    event.on(name, handle);
}
function removeListener(name, handle) {
    event.removeListener(name, handle);
}
