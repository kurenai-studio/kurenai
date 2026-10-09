"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const gltf_validator_1 = require("gltf-validator");
function send(message) {
    if (typeof process.send === 'function') {
        process.send(message, () => process.disconnect());
    }
}
process.once('message', async (message) => {
    try {
        const { gltfFilePath } = message;
        const validationOptions = {
            uri: gltfFilePath,
            ignoredIssues: [],
            severityOverrides: {
                NON_RELATIVE_URI: 2 /* Severity.Information */,
                UNDECLARED_EXTENSION: 1 /* Severity.Warning */,
                ACCESSOR_TOTAL_OFFSET_ALIGNMENT: 2 /* Severity.Information */,
            },
        };
        const isGlb = gltfFilePath.endsWith('.glb');
        // For some glTF files exported by fbx2glTF, the validator can report
        // invalid JSON when it is given bytes. Read textual glTF as a string.
        const report = await (isGlb
            ? (0, gltf_validator_1.validateBytes)(Uint8Array.from(fs_1.default.readFileSync(gltfFilePath)), validationOptions)
            : (0, gltf_validator_1.validateString)(fs_1.default.readFileSync(gltfFilePath).toString(), validationOptions));
        send({ report });
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        send({
            error: {
                message: err.message,
                stack: err.stack,
            },
        });
    }
});
