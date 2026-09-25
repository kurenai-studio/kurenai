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
exports.throwError = void 0;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterBuild = onAfterBuild;
exports.run = run;
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../../../worker/builder/utils");
const commonUtils = __importStar(require("../../web-common/utils"));
exports.throwError = true;
async function onAfterInit(options, result, cache) {
    // 添加统计信息
    options.buildEngineParam.split = false;
    options.buildEngineParam.assetURLFormat = 'runtime-resolved';
    if (options.server && !options.server.endsWith('/')) {
        options.server += '/';
    }
}
function onAfterBundleInit(options) {
    options.buildScriptParam.system = { preset: 'web' };
    const useWebGPU = options.packages['web-mobile'].useWebGPU;
    options.buildScriptParam.flags['WEBGPU'] = useWebGPU;
    if (useWebGPU) {
        if (!options.includeModules.includes('gfx-webgpu')) {
            options.includeModules.push('gfx-webgpu');
        }
        options.assetSerializeOptions['cc.EffectAsset'].glsl4 = true;
    }
    else if (options.includeModules.includes('gfx-webgpu')) {
        const index = options.includeModules.indexOf('gfx-webgpu');
        options.includeModules.splice(index, 1);
    }
}
/**
 * 剔除不需要参与构建的资源
 * @param options
 * @param settings
 */
async function onBeforeCompressSettings(options, result, cache) {
    if (!result.paths.dir) {
        return;
    }
    const packageOptions = options.packages['web-mobile'];
    result.settings.screen.orientation = packageOptions.orientation;
}
async function onBeforeCopyBuildTemplate(options, result) {
    const staticDir = (0, path_1.join)(options.engineInfo.typescript.builtin, 'templates/web-mobile');
    const packageOptions = options.packages['web-mobile'];
    // 拷贝内部提供的模板文件
    const cssFilePath = (0, path_1.join)(result.paths.dir, 'style.css');
    options.md5CacheOptions.includes.push('style.css');
    if (!this.buildTemplate.findFile('style.css')) {
        // 生成 style.css
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(staticDir, 'style.css'), cssFilePath);
    }
    let webDebuggerSrc = '';
    if (packageOptions.embedWebDebugger) {
        const webDebuggerPath = (0, path_1.join)(result.paths.dir, 'vconsole.min.js');
        if (!this.buildTemplate.findFile('vconsole.min.js')) {
            // 生成 vconsole
            (0, fs_extra_1.copyFileSync)((0, path_1.join)(staticDir, 'vconsole.min.js'), webDebuggerPath);
            options.md5CacheOptions.excludes.push('vconsole.min.js');
        }
        webDebuggerSrc = './vconsole.min.js';
    }
    // index.js 模板生成
    const indexJsTemplate = this.buildTemplate.initUrl('index.js.ejs', 'indexJs') || (0, path_1.join)(staticDir, 'index.js.ejs');
    const indexJsContent = await ejs_1.default.renderFile(indexJsTemplate, {
        applicationJS: './' + (0, utils_1.relativeUrl)(result.paths.dir, result.paths.applicationJS),
    });
    // TODO 需要优化，不应该直接读到内存里
    const indexJsSourceTransformedCode = await (0, utils_1.transformCode)(indexJsContent, {
        importMapFormat: 'systemjs',
    });
    if (!indexJsSourceTransformedCode) {
        throw new Error('Cannot generate index.js');
    }
    const indexJsDest = (0, path_1.join)(result.paths.dir, `index.js`);
    result.paths.indexJs = indexJsDest;
    options.md5CacheOptions.includes.push(`index.js`);
    (0, fs_extra_1.outputFileSync)(indexJsDest, indexJsSourceTransformedCode, 'utf8');
    // index.html 模板生成
    const indexEjsTemplate = this.buildTemplate.initUrl('index.ejs') || (0, path_1.join)(staticDir, 'index.ejs');
    // 处理平台模板
    const data = {
        polyfillsBundleFile: result.paths.polyfillsJs && (0, utils_1.relativeUrl)(result.paths.dir, result.paths.polyfillsJs) || false,
        systemJsBundleFile: (0, utils_1.relativeUrl)(result.paths.dir, result.paths.systemJs),
        projectName: options.name,
        engineName: options.buildEngineParam.engineName,
        webDebuggerSrc: webDebuggerSrc,
        cocosTemplate: (0, path_1.join)(staticDir, 'index-plugin.ejs'),
        importMapFile: (0, utils_1.relativeUrl)(result.paths.dir, result.paths.importMap),
        indexJsName: (0, path_1.basename)(indexJsDest),
        cssUrl: (0, path_1.basename)(cssFilePath),
    };
    const content = await ejs_1.default.renderFile(indexEjsTemplate, data);
    result.paths.indexHTML = (0, path_1.join)(result.paths.dir, 'index.html');
    (0, fs_extra_1.outputFileSync)(result.paths.indexHTML, content, 'utf8');
    options.md5CacheOptions.replaceOnly.push('index.html');
}
async function onAfterBuild(options, result) {
    // 放在最后处理 url ，否则会破坏 md5 的处理
    result.settings.plugins.jsList.forEach((url, i) => {
        result.settings.plugins.jsList[i] = url.split('/').map(encodeURIComponent).join('/');
    });
    (0, fs_extra_1.outputFileSync)(result.paths.settings, JSON.stringify(result.settings, null, options.debug ? 4 : 0));
}
async function run(root) {
    const previewUrl = await commonUtils.run('web-mobile', root);
    this.buildExitRes.custom = {
        previewUrl,
    };
}
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3BsYXRmb3Jtcy93ZWItbW9iaWxlL3NyYy9ob29rcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVdiLGtDQVFDO0FBRUQsOENBYUM7QUFPRCw0REFNQztBQUVELDhEQTJEQztBQUVELG9DQU9DO0FBRUQsa0JBS0M7QUExSEQsOENBQXNCO0FBQ3RCLHVDQUF3RDtBQUN4RCwrQkFBc0M7QUFFdEMseURBQTJFO0FBRTNFLG9FQUFzRDtBQUN6QyxRQUFBLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFFeEIsS0FBSyxVQUFVLFdBQVcsQ0FBQyxPQUE0QyxFQUFFLE1BQTJCLEVBQUUsS0FBbUI7SUFFNUgsU0FBUztJQUNULE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3ZDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEdBQUcsa0JBQWtCLENBQUM7SUFDN0QsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNsRCxPQUFPLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQztJQUMxQixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQTRDO0lBQzFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDcEQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDM0QsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUM7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QyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pGLENBQUMsQ0FBQyxDQUFDO0lBQ0gsSUFBQSx5QkFBYyxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXhHLENBQUM7QUFFTSxLQUFLLFVBQVUsR0FBRyxDQUF3QixJQUFZO0lBQ3pELE1BQU0sVUFBVSxHQUFHLE1BQU0sV0FBVyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDN0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUc7UUFDdkIsVUFBVTtLQUNiLENBQUM7QUFDTixDQUFDO0FBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgY29weUZpbGVTeW5jLCBvdXRwdXRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBJbnRlcm5hbEJ1aWxkUmVzdWx0LCBCdWlsZGVyQ2FjaGUsIElCdWlsZGVyLCBJSW50ZXJCdWlsZFRhc2tPcHRpb24sIElCdWlsZFN0YWdlVGFzayB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcmVsYXRpdmVVcmwsIHRyYW5zZm9ybUNvZGUgfSBmcm9tICcuLi8uLi8uLi93b3JrZXIvYnVpbGRlci91dGlscyc7XG5pbXBvcnQgeyBJQnVpbGRSZXN1bHQgfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0ICogYXMgY29tbW9uVXRpbHMgZnJvbSAnLi4vLi4vd2ViLWNvbW1vbi91dGlscyc7XG5leHBvcnQgY29uc3QgdGhyb3dFcnJvciA9IHRydWU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFmdGVySW5pdChvcHRpb25zOiBJSW50ZXJCdWlsZFRhc2tPcHRpb248J3dlYi1tb2JpbGUnPiwgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0LCBjYWNoZTogQnVpbGRlckNhY2hlKSB7XG5cbiAgICAvLyDmt7vliqDnu5/orqHkv6Hmga9cbiAgICBvcHRpb25zLmJ1aWxkRW5naW5lUGFyYW0uc3BsaXQgPSBmYWxzZTtcbiAgICBvcHRpb25zLmJ1aWxkRW5naW5lUGFyYW0uYXNzZXRVUkxGb3JtYXQgPSAncnVudGltZS1yZXNvbHZlZCc7XG4gICAgaWYgKG9wdGlvbnMuc2VydmVyICYmICFvcHRpb25zLnNlcnZlci5lbmRzV2l0aCgnLycpKSB7XG4gICAgICAgIG9wdGlvbnMuc2VydmVyICs9ICcvJztcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkFmdGVyQnVuZGxlSW5pdChvcHRpb25zOiBJSW50ZXJCdWlsZFRhc2tPcHRpb248J3dlYi1tb2JpbGUnPikge1xuICAgIG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5zeXN0ZW0gPSB7IHByZXNldDogJ3dlYicgfTtcbiAgICBjb25zdCB1c2VXZWJHUFUgPSBvcHRpb25zLnBhY2thZ2VzWyd3ZWItbW9iaWxlJ10udXNlV2ViR1BVO1xuICAgIG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5mbGFnc1snV0VCR1BVJ10gPSB1c2VXZWJHUFU7XG4gICAgaWYgKHVzZVdlYkdQVSkge1xuICAgICAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZU1vZHVsZXMuaW5jbHVkZXMoJ2dmeC13ZWJncHUnKSkge1xuICAgICAgICAgICAgb3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5wdXNoKCdnZngtd2ViZ3B1Jyk7XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucy5hc3NldFNlcmlhbGl6ZU9wdGlvbnNbJ2NjLkVmZmVjdEFzc2V0J10hLmdsc2w0ID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaW5jbHVkZU1vZHVsZXMuaW5jbHVkZXMoJ2dmeC13ZWJncHUnKSkge1xuICAgICAgICBjb25zdCBpbmRleCA9IG9wdGlvbnMuaW5jbHVkZU1vZHVsZXMuaW5kZXhPZignZ2Z4LXdlYmdwdScpO1xuICAgICAgICBvcHRpb25zLmluY2x1ZGVNb2R1bGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxufVxuXG4vKipcbiAqIOWJlOmZpOS4jemcgOimgeWPguS4juaehOW7uueahOi1hOa6kFxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBwYXJhbSBzZXR0aW5nc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25CZWZvcmVDb21wcmVzc1NldHRpbmdzKG9wdGlvbnM6IElJbnRlckJ1aWxkVGFza09wdGlvbjwnd2ViLW1vYmlsZSc+LCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQsIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICBpZiAoIXJlc3VsdC5wYXRocy5kaXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYWNrYWdlT3B0aW9ucyA9IG9wdGlvbnMucGFja2FnZXNbJ3dlYi1tb2JpbGUnXTtcbiAgICByZXN1bHQuc2V0dGluZ3Muc2NyZWVuLm9yaWVudGF0aW9uID0gcGFja2FnZU9wdGlvbnMub3JpZW50YXRpb247XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkJlZm9yZUNvcHlCdWlsZFRlbXBsYXRlKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOiBJSW50ZXJCdWlsZFRhc2tPcHRpb248J3dlYi1tb2JpbGUnPiwgcmVzdWx0OiBJQnVpbGRSZXN1bHQpIHtcbiAgICBjb25zdCBzdGF0aWNEaXIgPSBqb2luKG9wdGlvbnMuZW5naW5lSW5mby50eXBlc2NyaXB0LmJ1aWx0aW4sICd0ZW1wbGF0ZXMvd2ViLW1vYmlsZScpO1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1snd2ViLW1vYmlsZSddO1xuXG4gICAgLy8g5ou36LSd5YaF6YOo5o+Q5L6b55qE5qih5p2/5paH5Lu2XG4gICAgY29uc3QgY3NzRmlsZVBhdGggPSBqb2luKHJlc3VsdC5wYXRocy5kaXIsICdzdHlsZS5jc3MnKTtcbiAgICBvcHRpb25zLm1kNUNhY2hlT3B0aW9ucy5pbmNsdWRlcy5wdXNoKCdzdHlsZS5jc3MnKTtcbiAgICBpZiAoIXRoaXMuYnVpbGRUZW1wbGF0ZS5maW5kRmlsZSgnc3R5bGUuY3NzJykpIHtcbiAgICAgICAgLy8g55Sf5oiQIHN0eWxlLmNzc1xuICAgICAgICBjb3B5RmlsZVN5bmMoam9pbihzdGF0aWNEaXIsICdzdHlsZS5jc3MnKSwgY3NzRmlsZVBhdGgpO1xuICAgIH1cblxuICAgIGxldCB3ZWJEZWJ1Z2dlclNyYyA9ICcnO1xuICAgIGlmIChwYWNrYWdlT3B0aW9ucy5lbWJlZFdlYkRlYnVnZ2VyKSB7XG4gICAgICAgIGNvbnN0IHdlYkRlYnVnZ2VyUGF0aCA9IGpvaW4ocmVzdWx0LnBhdGhzLmRpciwgJ3Zjb25zb2xlLm1pbi5qcycpO1xuICAgICAgICBpZiAoIXRoaXMuYnVpbGRUZW1wbGF0ZS5maW5kRmlsZSgndmNvbnNvbGUubWluLmpzJykpIHtcbiAgICAgICAgICAgIC8vIOeUn+aIkCB2Y29uc29sZVxuICAgICAgICAgICAgY29weUZpbGVTeW5jKGpvaW4oc3RhdGljRGlyLCAndmNvbnNvbGUubWluLmpzJyksIHdlYkRlYnVnZ2VyUGF0aCk7XG4gICAgICAgICAgICBvcHRpb25zLm1kNUNhY2hlT3B0aW9ucy5leGNsdWRlcy5wdXNoKCd2Y29uc29sZS5taW4uanMnKTtcbiAgICAgICAgfVxuICAgICAgICB3ZWJEZWJ1Z2dlclNyYyA9ICcuL3Zjb25zb2xlLm1pbi5qcyc7XG4gICAgfVxuXG4gICAgLy8gaW5kZXguanMg5qih5p2/55Sf5oiQXG4gICAgY29uc3QgaW5kZXhKc1RlbXBsYXRlID0gdGhpcy5idWlsZFRlbXBsYXRlLmluaXRVcmwoJ2luZGV4LmpzLmVqcycsICdpbmRleEpzJykgfHwgam9pbihzdGF0aWNEaXIsICdpbmRleC5qcy5lanMnKTtcbiAgICBjb25zdCBpbmRleEpzQ29udGVudDogc3RyaW5nID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoaW5kZXhKc1RlbXBsYXRlLCB7XG4gICAgICAgIGFwcGxpY2F0aW9uSlM6ICcuLycgKyByZWxhdGl2ZVVybChyZXN1bHQucGF0aHMuZGlyLCByZXN1bHQucGF0aHMuYXBwbGljYXRpb25KUyksXG4gICAgfSk7XG4gICAgLy8gVE9ETyDpnIDopoHkvJjljJbvvIzkuI3lupTor6Xnm7TmjqXor7vliLDlhoXlrZjph4xcbiAgICBjb25zdCBpbmRleEpzU291cmNlVHJhbnNmb3JtZWRDb2RlID0gYXdhaXQgdHJhbnNmb3JtQ29kZShpbmRleEpzQ29udGVudCwge1xuICAgICAgICBpbXBvcnRNYXBGb3JtYXQ6ICdzeXN0ZW1qcycsXG4gICAgfSk7XG4gICAgaWYgKCFpbmRleEpzU291cmNlVHJhbnNmb3JtZWRDb2RlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGdlbmVyYXRlIGluZGV4LmpzJyk7XG4gICAgfVxuICAgIGNvbnN0IGluZGV4SnNEZXN0ID0gam9pbihyZXN1bHQucGF0aHMuZGlyLCBgaW5kZXguanNgKTtcbiAgICByZXN1bHQucGF0aHMuaW5kZXhKcyA9IGluZGV4SnNEZXN0O1xuICAgIG9wdGlvbnMubWQ1Q2FjaGVPcHRpb25zLmluY2x1ZGVzLnB1c2goYGluZGV4LmpzYCk7XG5cbiAgICBvdXRwdXRGaWxlU3luYyhpbmRleEpzRGVzdCwgaW5kZXhKc1NvdXJjZVRyYW5zZm9ybWVkQ29kZSwgJ3V0ZjgnKTtcblxuICAgIC8vIGluZGV4Lmh0bWwg5qih5p2/55Sf5oiQXG4gICAgY29uc3QgaW5kZXhFanNUZW1wbGF0ZSA9IHRoaXMuYnVpbGRUZW1wbGF0ZS5pbml0VXJsKCdpbmRleC5lanMnKSB8fCBqb2luKHN0YXRpY0RpciwgJ2luZGV4LmVqcycpO1xuICAgIC8vIOWkhOeQhuW5s+WPsOaooeadv1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgIHBvbHlmaWxsc0J1bmRsZUZpbGU6IHJlc3VsdC5wYXRocy5wb2x5ZmlsbHNKcyAmJiByZWxhdGl2ZVVybChyZXN1bHQucGF0aHMuZGlyLCByZXN1bHQucGF0aHMucG9seWZpbGxzSnMpIHx8IGZhbHNlLFxuICAgICAgICBzeXN0ZW1Kc0J1bmRsZUZpbGU6IHJlbGF0aXZlVXJsKHJlc3VsdC5wYXRocy5kaXIsIHJlc3VsdC5wYXRocy5zeXN0ZW1KcyEpLFxuICAgICAgICBwcm9qZWN0TmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICBlbmdpbmVOYW1lOiBvcHRpb25zLmJ1aWxkRW5naW5lUGFyYW0uZW5naW5lTmFtZSxcbiAgICAgICAgd2ViRGVidWdnZXJTcmM6IHdlYkRlYnVnZ2VyU3JjLFxuICAgICAgICBjb2Nvc1RlbXBsYXRlOiBqb2luKHN0YXRpY0RpciwgJ2luZGV4LXBsdWdpbi5lanMnKSxcbiAgICAgICAgaW1wb3J0TWFwRmlsZTogcmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLmltcG9ydE1hcCksXG4gICAgICAgIGluZGV4SnNOYW1lOiBiYXNlbmFtZShpbmRleEpzRGVzdCksXG4gICAgICAgIGNzc1VybDogYmFzZW5hbWUoY3NzRmlsZVBhdGgpLFxuICAgIH07XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGluZGV4RWpzVGVtcGxhdGUsIGRhdGEpO1xuICAgIHJlc3VsdC5wYXRocy5pbmRleEhUTUwgPSBqb2luKHJlc3VsdC5wYXRocy5kaXIsICdpbmRleC5odG1sJyk7XG4gICAgb3V0cHV0RmlsZVN5bmMocmVzdWx0LnBhdGhzLmluZGV4SFRNTCwgY29udGVudCwgJ3V0ZjgnKTtcbiAgICBvcHRpb25zLm1kNUNhY2hlT3B0aW9ucy5yZXBsYWNlT25seS5wdXNoKCdpbmRleC5odG1sJyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFmdGVyQnVpbGQodGhpczogSUJ1aWxkZXIsIG9wdGlvbnM6IElJbnRlckJ1aWxkVGFza09wdGlvbjwnd2ViLW1vYmlsZSc+LCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQpIHtcbiAgICAvLyDmlL7lnKjmnIDlkI7lpITnkIYgdXJsIO+8jOWQpuWImeS8muegtOWdjyBtZDUg55qE5aSE55CGXG4gICAgcmVzdWx0LnNldHRpbmdzLnBsdWdpbnMuanNMaXN0LmZvckVhY2goKHVybDogc3RyaW5nLCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgcmVzdWx0LnNldHRpbmdzLnBsdWdpbnMuanNMaXN0W2ldID0gdXJsLnNwbGl0KCcvJykubWFwKGVuY29kZVVSSUNvbXBvbmVudCkuam9pbignLycpO1xuICAgIH0pO1xuICAgIG91dHB1dEZpbGVTeW5jKHJlc3VsdC5wYXRocy5zZXR0aW5ncywgSlNPTi5zdHJpbmdpZnkocmVzdWx0LnNldHRpbmdzLCBudWxsLCBvcHRpb25zLmRlYnVnID8gNCA6IDApKTtcblxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuKHRoaXM6IElCdWlsZFN0YWdlVGFzaywgcm9vdDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJldmlld1VybCA9IGF3YWl0IGNvbW1vblV0aWxzLnJ1bignd2ViLW1vYmlsZScsIHJvb3QpO1xuICAgIHRoaXMuYnVpbGRFeGl0UmVzLmN1c3RvbSA9IHtcbiAgICAgICAgcHJldmlld1VybCxcbiAgICB9O1xufTtcbiJdfQ==