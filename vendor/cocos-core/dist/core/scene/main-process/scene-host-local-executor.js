"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHostLocalExecutor = void 0;
exports.registerDefaultSceneHostModules = registerDefaultSceneHostModules;
const assets_1 = require("../../assets");
const scripting_1 = __importDefault(require("../../scripting"));
const i18n_1 = __importDefault(require("../../base/i18n"));
const process_rpc_1 = require("../process-rpc");
const scene_configs_1 = require("../scene-configs");
const reference_image_files_1 = require("./reference-image-files");
const reference_image_store_1 = require("./reference-image-store");
const defaultSceneHostModules = {
    assetManager: assets_1.assetManager,
    programming: scripting_1.default,
    sceneConfigInstance: scene_configs_1.sceneConfigInstance,
    i18n: i18n_1.default,
    // Feature-owned Node modules: external file reads and serialized local configuration writes.
    referenceImageFiles: reference_image_files_1.referenceImageFiles,
    referenceImageStore: reference_image_store_1.referenceImageStore,
};
/** Registers the default host modules with the specified Scene RPC transport. */
function registerDefaultSceneHostModules(rpc) {
    rpc.register(defaultSceneHostModules);
}
/**
 * `SceneHostLocalExecutor` handles reverse RPC calls from the Scene runtime in the Scene host
 * process. In hosted mode, the integrating application provides this process.
 *
 * `SceneHostLocalExecutor` is transport-agnostic. The Scene Webview runtime invokes it through
 * the HTTP `/rpc/:module/:method` route. The worker provider uses the helper above to register
 * the same host modules with the Scene Worker transport.
 */
class SceneHostLocalExecutor {
    modules;
    rpc = new process_rpc_1.ProcessRPC();
    constructor(modules = defaultSceneHostModules) {
        this.modules = modules;
        this.rpc.register(modules);
    }
    executeLocal(module, method, args = []) {
        return this.rpc.executeLocal(module, method, args);
    }
    dispose() {
        this.rpc.dispose();
    }
}
exports.SceneHostLocalExecutor = SceneHostLocalExecutor;
