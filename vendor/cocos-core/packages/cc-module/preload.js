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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDynamic = loadDynamic;
const path_1 = require("path");
const loader_1 = require("./loader");
const sharp_1 = __importDefault(require("sharp"));
let hasPreload = false;
/**
 * 初始化引擎加载器。预先引擎模块，并将其映射为在编辑器内可用的 CommonJS 模块。
 * @param options 选项。
 */
async function preload(options) {
    try {
        if (hasPreload) {
            throw new Error('You can only preload engine once.');
        }
        hasPreload = true;
        // @ts-ignore
        globalThis.CC_EDITOR = false;
        // @ts-ignore
        globalThis.CC_PREVIEW = false;
        // @ts-ignore
        globalThis.window = globalThis.global;
        const LocalStorage = require('node-localstorage').LocalStorage;
        globalThis.nodeEnv = {
            enginePath: options.engineRoot,
            require: require,
            userDataPath: options.writablePath,
            process: process,
            sharp: sharp_1.default,
            systemLanguage: Intl.DateTimeFormat().resolvedOptions().locale,
            XMLHttpRequest: require('xhr2'),
            SocketIO: require('socket.io-client'),
            WebSocket: WebSocket,
            localStorage: new LocalStorage((0, path_1.join)(options.writablePath, 'node.localStorage')),
            fetch: fetch,
            Headers: Headers,
            Request: Request,
            Response: Response
        };
        // loader web adapter
        require((0, path_1.join)(options.engineRoot, 'bin/.editor/web-adapter.js'));
        // init EngineLoader
        await loader_1.EngineLoader.init(options.engineDev, options.requiredModules);
        if (options.requiredModules.includes('cc')) {
            // ---- 加载引擎主体 ----
            // @ts-ignore
            // eslint-disable-next-line no-undef
            const ccm = window.ccm = require('cc');
            await Promise.resolve(`${(0, path_1.join)(options.engineRoot, 'bin/.editor/engine-adapter.js')}`).then(s => __importStar(require(s)));
            // ---- hack creator 使用的一些 engine 参数
            require('./polyfill/engine');
            // overwrite
            const handle = require('./overwrite');
            handle(ccm);
        }
    }
    catch (error) {
        let msg = 'preload engine failed!';
        console.error(msg);
        console.error(error);
        if (error instanceof Error) {
            msg += '\n' + error.stack ? error.stack : error.toString();
        }
        throw error;
    }
}
exports.default = preload;
/**
 * 动态加载指定模块。应确保引擎加载器已经初始化过。
 * @param id 引擎模块 ID。
 * @returns 引擎模块。
 */
async function loadDynamic(id) {
    return await loader_1.EngineLoader.importModule(id);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9wcmVsb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkZBLGtDQUVDO0FBL0ZELCtCQUE0QjtBQUM1QixxQ0FBd0M7QUFDeEMsa0RBQTBCO0FBQzFCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztBQUV2Qjs7O0dBR0c7QUFDSCxLQUFLLFVBQVUsT0FBTyxDQUFDLE9BaUJ0QjtJQUNHLElBQUksQ0FBQztRQUNELElBQUksVUFBVSxFQUFFLENBQUM7WUFDYixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUNELFVBQVUsR0FBRyxJQUFJLENBQUM7UUFFbEIsYUFBYTtRQUNiLFVBQVUsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQzdCLGFBQWE7UUFDYixVQUFVLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUM5QixhQUFhO1FBQ2IsVUFBVSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBQ3RDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUM5RCxVQUFrQixDQUFDLE9BQU8sR0FBRztZQUMxQixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7WUFDOUIsT0FBTyxFQUFFLE9BQU87WUFDaEIsWUFBWSxFQUFFLE9BQU8sQ0FBQyxZQUFZO1lBQ2xDLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLEtBQUssRUFBRSxlQUFLO1lBQ1osY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxNQUFNO1lBQzlELGNBQWMsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQy9CLFFBQVEsRUFBRSxPQUFPLENBQUMsa0JBQWtCLENBQUM7WUFDckMsU0FBUyxFQUFFLFNBQVM7WUFDcEIsWUFBWSxFQUFFLElBQUksWUFBWSxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUMvRSxLQUFLLEVBQUUsS0FBSztZQUNaLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixxQkFBcUI7UUFDckIsT0FBTyxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLG9CQUFvQjtRQUNwQixNQUFNLHFCQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRXBFLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN6QyxtQkFBbUI7WUFDbkIsYUFBYTtZQUNiLG9DQUFvQztZQUNwQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2Qyx5QkFBYSxJQUFBLFdBQUksRUFBQyxPQUFPLENBQUMsVUFBVSxFQUFFLCtCQUErQixDQUFDLHVDQUFDLENBQUM7WUFDeEUsb0NBQW9DO1lBQ3BDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQzdCLFlBQVk7WUFDWixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksR0FBRyxHQUFHLHdCQUF3QixDQUFDO1FBQ25DLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQixJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUUsQ0FBQztZQUN6QixHQUFHLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMvRCxDQUFDO1FBQ0QsTUFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxPQUFPLENBQUM7QUFFdkI7Ozs7R0FJRztBQUNJLEtBQUssVUFBVSxXQUFXLENBQUMsRUFBVTtJQUN4QyxPQUFPLE1BQU0scUJBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEVuZ2luZUxvYWRlciB9IGZyb20gJy4vbG9hZGVyJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5sZXQgaGFzUHJlbG9hZCA9IGZhbHNlO1xuXG4vKipcbiAqIOWIneWni+WMluW8leaTjuWKoOi9veWZqOOAgumihOWFiOW8leaTjuaooeWdl++8jOW5tuWwhuWFtuaYoOWwhOS4uuWcqOe8lui+keWZqOWGheWPr+eUqOeahCBDb21tb25KUyDmqKHlnZfjgIJcbiAqIEBwYXJhbSBvcHRpb25zIOmAiemhueOAglxuICovXG5hc3luYyBmdW5jdGlvbiBwcmVsb2FkKG9wdGlvbnM6IHtcbiAgICAvKipcbiAgICAgKiDlvJXmk47moLnnm67lvZVcbiAgICAgKi9cbiAgICBlbmdpbmVSb290OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICog5byV5pOO5YiG5Y+R55uu5b2V77yI5byV5pOO57yW6K+R5ZCO55qE55uu5b2V77yJXG4gICAgICovXG4gICAgZW5naW5lRGV2OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICog5byV5pOO5Y+v5YaZ55uu5b2VXG4gICAgICovXG4gICAgd3JpdGFibGVQYXRoOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICog6ZyA6KaB6aKE5Yqg6L2955qE5qih5Z2X44CCXG4gICAgICovXG4gICAgcmVxdWlyZWRNb2R1bGVzOiBzdHJpbmdbXTtcbn0pIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAoaGFzUHJlbG9hZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2FuIG9ubHkgcHJlbG9hZCBlbmdpbmUgb25jZS4nKTtcbiAgICAgICAgfVxuICAgICAgICBoYXNQcmVsb2FkID0gdHJ1ZTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGdsb2JhbFRoaXMuQ0NfRURJVE9SID0gZmFsc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy5DQ19QUkVWSUVXID0gZmFsc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy53aW5kb3cgPSBnbG9iYWxUaGlzLmdsb2JhbDtcbiAgICAgICAgY29uc3QgTG9jYWxTdG9yYWdlID0gcmVxdWlyZSgnbm9kZS1sb2NhbHN0b3JhZ2UnKS5Mb2NhbFN0b3JhZ2U7XG4gICAgICAgIChnbG9iYWxUaGlzIGFzIGFueSkubm9kZUVudiA9IHtcbiAgICAgICAgICAgIGVuZ2luZVBhdGg6IG9wdGlvbnMuZW5naW5lUm9vdCxcbiAgICAgICAgICAgIHJlcXVpcmU6IHJlcXVpcmUsXG4gICAgICAgICAgICB1c2VyRGF0YVBhdGg6IG9wdGlvbnMud3JpdGFibGVQYXRoLFxuICAgICAgICAgICAgcHJvY2VzczogcHJvY2VzcyxcbiAgICAgICAgICAgIHNoYXJwOiBzaGFycCwgXG4gICAgICAgICAgICBzeXN0ZW1MYW5ndWFnZTogSW50bC5EYXRlVGltZUZvcm1hdCgpLnJlc29sdmVkT3B0aW9ucygpLmxvY2FsZSxcbiAgICAgICAgICAgIFhNTEh0dHBSZXF1ZXN0OiByZXF1aXJlKCd4aHIyJyksXG4gICAgICAgICAgICBTb2NrZXRJTzogcmVxdWlyZSgnc29ja2V0LmlvLWNsaWVudCcpLFxuICAgICAgICAgICAgV2ViU29ja2V0OiBXZWJTb2NrZXQsXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2U6IG5ldyBMb2NhbFN0b3JhZ2Uoam9pbihvcHRpb25zLndyaXRhYmxlUGF0aCwgJ25vZGUubG9jYWxTdG9yYWdlJykpLCBcbiAgICAgICAgICAgIGZldGNoOiBmZXRjaCxcbiAgICAgICAgICAgIEhlYWRlcnM6IEhlYWRlcnMsXG4gICAgICAgICAgICBSZXF1ZXN0OiBSZXF1ZXN0LFxuICAgICAgICAgICAgUmVzcG9uc2U6IFJlc3BvbnNlXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBsb2FkZXIgd2ViIGFkYXB0ZXJcbiAgICAgICAgcmVxdWlyZShqb2luKG9wdGlvbnMuZW5naW5lUm9vdCwgJ2Jpbi8uZWRpdG9yL3dlYi1hZGFwdGVyLmpzJykpO1xuICAgICAgICAvLyBpbml0IEVuZ2luZUxvYWRlclxuICAgICAgICBhd2FpdCBFbmdpbmVMb2FkZXIuaW5pdChvcHRpb25zLmVuZ2luZURldiwgb3B0aW9ucy5yZXF1aXJlZE1vZHVsZXMpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnJlcXVpcmVkTW9kdWxlcy5pbmNsdWRlcygnY2MnKSkge1xuICAgICAgICAgICAgLy8gLS0tLSDliqDovb3lvJXmk47kuLvkvZMgLS0tLVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgICBjb25zdCBjY20gPSB3aW5kb3cuY2NtID0gcmVxdWlyZSgnY2MnKTtcblxuICAgICAgICAgICAgYXdhaXQgaW1wb3J0KGpvaW4ob3B0aW9ucy5lbmdpbmVSb290LCAnYmluLy5lZGl0b3IvZW5naW5lLWFkYXB0ZXIuanMnKSk7XG4gICAgICAgICAgICAvLyAtLS0tIGhhY2sgY3JlYXRvciDkvb/nlKjnmoTkuIDkupsgZW5naW5lIOWPguaVsFxuICAgICAgICAgICAgcmVxdWlyZSgnLi9wb2x5ZmlsbC9lbmdpbmUnKTtcbiAgICAgICAgICAgIC8vIG92ZXJ3cml0ZVxuICAgICAgICAgICAgY29uc3QgaGFuZGxlID0gcmVxdWlyZSgnLi9vdmVyd3JpdGUnKTtcbiAgICAgICAgICAgIGhhbmRsZShjY20pO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbGV0IG1zZyA9ICdwcmVsb2FkIGVuZ2luZSBmYWlsZWQhJztcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIG1zZyArPSAnXFxuJyArIGVycm9yLnN0YWNrID8gZXJyb3Iuc3RhY2sgOiBlcnJvci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgcHJlbG9hZDtcblxuLyoqXG4gKiDliqjmgIHliqDovb3mjIflrprmqKHlnZfjgILlupTnoa7kv53lvJXmk47liqDovb3lmajlt7Lnu4/liJ3lp4vljJbov4fjgIJcbiAqIEBwYXJhbSBpZCDlvJXmk47mqKHlnZcgSUTjgIJcbiAqIEByZXR1cm5zIOW8leaTjuaooeWdl+OAglxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZER5bmFtaWMoaWQ6IHN0cmluZykge1xuICAgIHJldHVybiBhd2FpdCBFbmdpbmVMb2FkZXIuaW1wb3J0TW9kdWxlKGlkKTtcbn1cblxuIl19