"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureEditorProjectPath = ensureEditorProjectPath;
function ensureEditorProjectPath(projectPath) {
    const globalObject = globalThis;
    if (!globalObject.Editor || typeof globalObject.Editor !== 'object') {
        globalObject.Editor = {};
    }
    globalObject.Editor.Project = {
        ...(globalObject.Editor.Project ?? {}),
        path: projectPath,
    };
    return globalObject.Editor;
}
