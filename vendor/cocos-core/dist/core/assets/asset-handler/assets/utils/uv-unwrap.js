"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapLightmapUV = unwrapLightmapUV;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const utils_1 = __importDefault(require("../../../../base/utils"));
const global_1 = require("../../../../../global");
/**
 *
 * @param inputFile The file is the mesh data extracted from cc.Mesh for generating LightmapUV.
 * @param outFile The file is the generated LightmapUV data.
 */
function unwrapLightmapUV(inputFile, outFile) {
    const toolName = 'uvunwrap';
    const toolExt = os_1.default.type() === 'Windows_NT' ? '.exe' : '';
    // @ts-ignore
    const tool = path_1.default.join(global_1.GlobalPaths.staticDir, 'tools/LightFX', toolName + toolExt);
    const args = ['--input', inputFile, '--output', outFile];
    return utils_1.default.Process.quickSpawn(tool, args, {
        shell: true,
    });
}
