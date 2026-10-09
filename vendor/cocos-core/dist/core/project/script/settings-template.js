"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProjectSettings = exports.defaultEngineSettings = void 0;
exports.createDefaultEngineSettings = createDefaultEngineSettings;
const global_1 = require("../../../global");
const module_config_defaults_1 = require("../../engine/module-config-defaults");
function createDefaultEngineSettings(engineRoot = global_1.GlobalPaths.enginePath) {
    return {
        '__version__': '1.0.12',
        'modules': (0, module_config_defaults_1.createDefaultEngineModuleSettings)(engineRoot),
    };
}
exports.defaultEngineSettings = createDefaultEngineSettings();
exports.defaultProjectSettings = {
    '__version__': '1.0.6',
    'general': {
        'designResolution': {
            'width': 960,
            'height': 640
        }
    },
    'script': {
        'preserveSymlinks': true
    }
};
