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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXYtdW53cmFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3V0aWxzL3V2LXVud3JhcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQVNBLDRDQVVDO0FBbkJELDRDQUFvQjtBQUNwQixnREFBd0I7QUFDeEIsbUVBQTJDO0FBQzNDLGtEQUFvRDtBQUNwRDs7OztHQUlHO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsU0FBaUIsRUFBRSxPQUFlO0lBQy9ELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQztJQUM1QixNQUFNLE9BQU8sR0FBRyxZQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN6RCxhQUFhO0lBQ2IsTUFBTSxJQUFJLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxvQkFBVyxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ25GLE1BQU0sSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFekQsT0FBTyxlQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ3hDLEtBQUssRUFBRSxJQUFJO0tBQ2QsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IEdsb2JhbFBhdGhzIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vZ2xvYmFsJztcbi8qKlxuICpcbiAqIEBwYXJhbSBpbnB1dEZpbGUgVGhlIGZpbGUgaXMgdGhlIG1lc2ggZGF0YSBleHRyYWN0ZWQgZnJvbSBjYy5NZXNoIGZvciBnZW5lcmF0aW5nIExpZ2h0bWFwVVYuXG4gKiBAcGFyYW0gb3V0RmlsZSBUaGUgZmlsZSBpcyB0aGUgZ2VuZXJhdGVkIExpZ2h0bWFwVVYgZGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcExpZ2h0bWFwVVYoaW5wdXRGaWxlOiBzdHJpbmcsIG91dEZpbGU6IHN0cmluZykge1xuICAgIGNvbnN0IHRvb2xOYW1lID0gJ3V2dW53cmFwJztcbiAgICBjb25zdCB0b29sRXh0ID0gb3MudHlwZSgpID09PSAnV2luZG93c19OVCcgPyAnLmV4ZScgOiAnJztcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgdG9vbCA9IHBhdGguam9pbihHbG9iYWxQYXRocy5zdGF0aWNEaXIsICd0b29scy9MaWdodEZYJywgdG9vbE5hbWUgKyB0b29sRXh0KTtcbiAgICBjb25zdCBhcmdzID0gWyctLWlucHV0JywgaW5wdXRGaWxlLCAnLS1vdXRwdXQnLCBvdXRGaWxlXTtcblxuICAgIHJldHVybiB1dGlscy5Qcm9jZXNzLnF1aWNrU3Bhd24odG9vbCwgYXJncywge1xuICAgICAgICBzaGVsbDogdHJ1ZSxcbiAgICB9KTtcbn1cbiJdfQ==