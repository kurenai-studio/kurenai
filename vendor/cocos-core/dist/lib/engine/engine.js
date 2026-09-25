"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.getInfo = getInfo;
exports.getConfig = getConfig;
exports.getRenderConfig = getRenderConfig;
exports.queryJointTextureLayoutPreview = queryJointTextureLayoutPreview;
exports.initEngine = initEngine;
exports.startEngineCompilation = startEngineCompilation;
exports.queryLayerBuiltin = queryLayerBuiltin;
exports.querySortingLayerBuiltin = querySortingLayerBuiltin;
const global_1 = require("../../global");
async function init(projectPath) {
    const { initEngine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return await initEngine(global_1.GlobalPaths.enginePath, projectPath);
}
async function getInfo() {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return Engine.getInfo();
}
async function getConfig(useDefault) {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return Engine.getConfig(useDefault);
}
async function getRenderConfig() {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return Engine.queryLocalizedRenderConfig();
}
async function queryJointTextureLayoutPreview() {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return Engine.queryJointTextureLayoutPreview();
}
async function initEngine(enginePath, projectPath, serverURL) {
    const { initEngine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return await initEngine(enginePath, projectPath, serverURL);
}
async function startEngineCompilation(force = false) {
    const { startCompileEngineProcess } = await Promise.resolve().then(() => __importStar(require('../../core/engine/compile-process')));
    await startCompileEngineProcess(force);
}
async function queryLayerBuiltin() {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return Engine.queryLayerBuiltin();
}
async function querySortingLayerBuiltin() {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return Engine.querySortingLayerBuiltin();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9lbmdpbmUvZW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0Esb0JBR0M7QUFFRCwwQkFHQztBQUVELDhCQUdDO0FBRUQsMENBR0M7QUFFRCx3RUFHQztBQUVELGdDQUdDO0FBRUQsd0RBR0M7QUFFRCw4Q0FHQztBQUVELDREQUdDO0FBOUNELHlDQUEyQztBQUdwQyxLQUFLLFVBQVUsSUFBSSxDQUFDLFdBQW1CO0lBQzFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyx3REFBYSxtQkFBbUIsR0FBQyxDQUFDO0lBQ3pELE9BQU8sTUFBTSxVQUFVLENBQUMsb0JBQVcsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVNLEtBQUssVUFBVSxPQUFPO0lBQ3pCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyx3REFBYSxtQkFBbUIsR0FBQyxDQUFDO0lBQ3JELE9BQU8sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVCLENBQUM7QUFFTSxLQUFLLFVBQVUsU0FBUyxDQUFDLFVBQW9CO0lBQ2hELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyx3REFBYSxtQkFBbUIsR0FBQyxDQUFDO0lBQ3JELE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRU0sS0FBSyxVQUFVLGVBQWU7SUFDakMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLHdEQUFhLG1CQUFtQixHQUFDLENBQUM7SUFDckQsT0FBTyxNQUFNLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztBQUMvQyxDQUFDO0FBRU0sS0FBSyxVQUFVLDhCQUE4QjtJQUNoRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsd0RBQWEsbUJBQW1CLEdBQUMsQ0FBQztJQUNyRCxPQUFPLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO0FBQ25ELENBQUM7QUFFTSxLQUFLLFVBQVUsVUFBVSxDQUFDLFVBQWtCLEVBQUUsV0FBbUIsRUFBRSxTQUFrQjtJQUN4RixNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsd0RBQWEsbUJBQW1CLEdBQUMsQ0FBQztJQUN6RCxPQUFPLE1BQU0sVUFBVSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQUVNLEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxRQUFpQixLQUFLO0lBQy9ELE1BQU0sRUFBRSx5QkFBeUIsRUFBRSxHQUFHLHdEQUFhLG1DQUFtQyxHQUFDLENBQUM7SUFDeEYsTUFBTSx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRU0sS0FBSyxVQUFVLGlCQUFpQjtJQUNuQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsd0RBQWEsbUJBQW1CLEdBQUMsQ0FBQztJQUNyRCxPQUFPLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RDLENBQUM7QUFFTSxLQUFLLFVBQVUsd0JBQXdCO0lBQzFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyx3REFBYSxtQkFBbUIsR0FBQyxDQUFDO0lBQ3JELE9BQU8sTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7QUFDN0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdsb2JhbFBhdGhzIH0gZnJvbSAnLi4vLi4vZ2xvYmFsJztcbmV4cG9ydCB0eXBlICogZnJvbSAnLi4vLi4vY29yZS9lbmdpbmUvQHR5cGVzL3B1YmxpYyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0KHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IGluaXRFbmdpbmUgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9lbmdpbmUnKTtcbiAgICByZXR1cm4gYXdhaXQgaW5pdEVuZ2luZShHbG9iYWxQYXRocy5lbmdpbmVQYXRoLCBwcm9qZWN0UGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRJbmZvKCkge1xuICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvZW5naW5lJyk7XG4gICAgcmV0dXJuIEVuZ2luZS5nZXRJbmZvKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb25maWcodXNlRGVmYXVsdD86IGJvb2xlYW4pIHtcbiAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2VuZ2luZScpO1xuICAgIHJldHVybiBFbmdpbmUuZ2V0Q29uZmlnKHVzZURlZmF1bHQpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UmVuZGVyQ29uZmlnKCkge1xuICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvZW5naW5lJyk7XG4gICAgcmV0dXJuIEVuZ2luZS5xdWVyeUxvY2FsaXplZFJlbmRlckNvbmZpZygpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlKb2ludFRleHR1cmVMYXlvdXRQcmV2aWV3KCkge1xuICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvZW5naW5lJyk7XG4gICAgcmV0dXJuIEVuZ2luZS5xdWVyeUpvaW50VGV4dHVyZUxheW91dFByZXZpZXcoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRFbmdpbmUoZW5naW5lUGF0aDogc3RyaW5nLCBwcm9qZWN0UGF0aDogc3RyaW5nLCBzZXJ2ZXJVUkw/OiBzdHJpbmcpIHtcbiAgICBjb25zdCB7IGluaXRFbmdpbmUgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9lbmdpbmUnKTtcbiAgICByZXR1cm4gYXdhaXQgaW5pdEVuZ2luZShlbmdpbmVQYXRoLCBwcm9qZWN0UGF0aCwgc2VydmVyVVJMKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0RW5naW5lQ29tcGlsYXRpb24oZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIGNvbnN0IHsgc3RhcnRDb21waWxlRW5naW5lUHJvY2VzcyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2VuZ2luZS9jb21waWxlLXByb2Nlc3MnKTtcbiAgICBhd2FpdCBzdGFydENvbXBpbGVFbmdpbmVQcm9jZXNzKGZvcmNlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5TGF5ZXJCdWlsdGluKCkge1xuICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvZW5naW5lJyk7XG4gICAgcmV0dXJuIEVuZ2luZS5xdWVyeUxheWVyQnVpbHRpbigpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlTb3J0aW5nTGF5ZXJCdWlsdGluKCkge1xuICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvZW5naW5lJyk7XG4gICAgcmV0dXJuIEVuZ2luZS5xdWVyeVNvcnRpbmdMYXllckJ1aWx0aW4oKTtcbn1cbiJdfQ==