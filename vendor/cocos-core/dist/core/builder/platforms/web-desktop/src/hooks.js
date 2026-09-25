"use strict";
'use-strict';
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
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const ejs_1 = __importDefault(require("ejs"));
const utils_1 = require("../../../worker/builder/utils");
const commonUtils = __importStar(require("../../web-common/utils"));
exports.throwError = true;
function onAfterInit(options, result, cache) {
    options.buildEngineParam.assetURLFormat = 'runtime-resolved';
    if (options.server && !options.server.endsWith('/')) {
        options.server += '/';
    }
}
function onAfterBundleInit(options) {
    options.buildScriptParam.system = { preset: 'web' };
    const useWebGPU = options.packages['web-desktop'].useWebGPU;
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
async function onBeforeCompressSettings(options, result, cache) {
    if (!result.paths.dir) {
        return;
    }
    result.settings.screen.exactFitScreen = false;
}
async function onBeforeCopyBuildTemplate(options, result) {
    const staticDir = (0, path_1.join)(options.engineInfo.typescript.path, 'templates/web-desktop');
    const packageOptions = options.packages['web-desktop'];
    const cssFilePath = (0, path_1.join)(result.paths.dir, 'style.css');
    options.md5CacheOptions.includes.push('style.css');
    if (!this.buildTemplate.findFile('style.css')) {
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(staticDir, 'style.css'), cssFilePath);
    }
    if (!this.buildTemplate.findFile('favicon.ico')) {
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(staticDir, 'favicon.ico'), (0, path_1.join)(result.paths.dir, 'favicon.ico'));
    }
    const indexJsTemplate = this.buildTemplate.initUrl('index.js.ejs', 'indexJs') || (0, path_1.join)(staticDir, 'index.js.ejs');
    const indexJsContent = await ejs_1.default.renderFile(indexJsTemplate, {
        applicationJS: './' + (0, utils_1.relativeUrl)(result.paths.dir, result.paths.applicationJS),
    });
    const indexJsSourceTransformedCode = await (0, utils_1.transformCode)(indexJsContent, {
        importMapFormat: 'systemjs',
    });
    if (!indexJsSourceTransformedCode) {
        throw new Error('Cannot generate index.js');
    }
    const indexJsDest = (0, path_1.join)(result.paths.dir, 'index.js');
    result.paths.indexJs = indexJsDest;
    options.md5CacheOptions.includes.push('index.js');
    (0, fs_extra_1.outputFileSync)(indexJsDest, indexJsSourceTransformedCode, 'utf8');
    const indexEjsTemplate = this.buildTemplate.initUrl('index.ejs') || (0, path_1.join)(staticDir, 'index.ejs');
    const data = {
        polyfillsBundleFile: (result.paths.polyfillsJs && (0, utils_1.relativeUrl)(result.paths.dir, result.paths.polyfillsJs)) || false,
        systemJsBundleFile: (0, utils_1.relativeUrl)(result.paths.dir, result.paths.systemJs),
        projectName: options.name,
        engineName: options.buildEngineParam.engineName,
        previewWidth: packageOptions.resolution.designWidth,
        previewHeight: packageOptions.resolution.designHeight,
        cocosTemplate: (0, path_1.join)(staticDir, 'index-plugin.ejs'),
        importMapFile: (0, utils_1.relativeUrl)(result.paths.dir, result.paths.importMap),
        indexJsName: './index.js',
        cssUrl: './style.css',
    };
    const content = await ejs_1.default.renderFile(indexEjsTemplate, data);
    result.paths.indexHTML = (0, path_1.join)(result.paths.dir, 'index.html');
    (0, fs_extra_1.outputFileSync)(result.paths.indexHTML, content, 'utf8');
    options.md5CacheOptions.replaceOnly.push('index.html');
}
async function onAfterBuild(options, result) {
    result.settings.plugins.jsList.forEach((url, i) => {
        result.settings.plugins.jsList[i] = url.split('/').map(encodeURIComponent).join('/');
    });
    (0, fs_extra_1.outputFileSync)(result.paths.settings, JSON.stringify(result.settings, null, options.debug ? 4 : 0));
}
async function run(root, options) {
    const previewUrl = await commonUtils.run('web-desktop', root);
    this.buildExitRes.custom = {
        previewUrl,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3BsYXRmb3Jtcy93ZWItZGVza3RvcC9zcmMvaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYWIsa0NBS0M7QUFFRCw4Q0FhQztBQUVELDREQUtDO0FBRUQsOERBOENDO0FBRUQsb0NBS0M7QUFFRCxrQkFLQztBQXBHRCx1Q0FBd0Q7QUFDeEQsK0JBQTRCO0FBQzVCLDhDQUFzQjtBQUd0Qix5REFBMkU7QUFDM0Usb0VBQXNEO0FBR3pDLFFBQUEsVUFBVSxHQUFHLElBQUksQ0FBQztBQUUvQixTQUFnQixXQUFXLENBQUMsT0FBbUIsRUFBRSxNQUEyQixFQUFFLEtBQW1CO0lBQzdGLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEdBQUcsa0JBQWtCLENBQUM7SUFDN0QsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNsRCxPQUFPLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQztJQUMxQixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQW1CO0lBQ2pELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDcEQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDNUQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDckQsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFD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QUM7SUFDOUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUc7UUFDdkIsVUFBVTtLQUNiLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZS1zdHJpY3QnO1xuXG5pbXBvcnQgeyBjb3B5RmlsZVN5bmMsIG91dHB1dEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgSW50ZXJuYWxCdWlsZFJlc3VsdCwgQnVpbGRlckNhY2hlLCBJQnVpbGRlciwgSUJ1aWxkU3RhZ2VUYXNrIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBJQnVpbGRSZXN1bHQgfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHsgcmVsYXRpdmVVcmwsIHRyYW5zZm9ybUNvZGUgfSBmcm9tICcuLi8uLi8uLi93b3JrZXIvYnVpbGRlci91dGlscyc7XG5pbXBvcnQgKiBhcyBjb21tb25VdGlscyBmcm9tICcuLi8uLi93ZWItY29tbW9uL3V0aWxzJztcbmltcG9ydCB7IElUYXNrT3B0aW9uIH0gZnJvbSAnLi4vLi4vbmF0aXZlLWNvbW1vbi90eXBlJztcblxuZXhwb3J0IGNvbnN0IHRocm93RXJyb3IgPSB0cnVlO1xuXG5leHBvcnQgZnVuY3Rpb24gb25BZnRlckluaXQob3B0aW9uczpJVGFza09wdGlvbiwgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0LCBjYWNoZTogQnVpbGRlckNhY2hlKSB7XG4gICAgb3B0aW9ucy5idWlsZEVuZ2luZVBhcmFtLmFzc2V0VVJMRm9ybWF0ID0gJ3J1bnRpbWUtcmVzb2x2ZWQnO1xuICAgIGlmIChvcHRpb25zLnNlcnZlciAmJiAhb3B0aW9ucy5zZXJ2ZXIuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgICBvcHRpb25zLnNlcnZlciArPSAnLyc7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb25BZnRlckJ1bmRsZUluaXQob3B0aW9uczpJVGFza09wdGlvbikge1xuICAgIG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5zeXN0ZW0gPSB7IHByZXNldDogJ3dlYicgfTtcbiAgICBjb25zdCB1c2VXZWJHUFUgPSBvcHRpb25zLnBhY2thZ2VzWyd3ZWItZGVza3RvcCddLnVzZVdlYkdQVTtcbiAgICBvcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0uZmxhZ3NbJ1dFQkdQVSddID0gdXNlV2ViR1BVO1xuICAgIGlmICh1c2VXZWJHUFUpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdnZngtd2ViZ3B1JykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuaW5jbHVkZU1vZHVsZXMucHVzaCgnZ2Z4LXdlYmdwdScpO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMuYXNzZXRTZXJpYWxpemVPcHRpb25zWydjYy5FZmZlY3RBc3NldCddIS5nbHNsNCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdnZngtd2ViZ3B1JykpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluZGV4T2YoJ2dmeC13ZWJncHUnKTtcbiAgICAgICAgb3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQmVmb3JlQ29tcHJlc3NTZXR0aW5ncyhvcHRpb25zOklUYXNrT3B0aW9uLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQsIGNhY2hlOiBCdWlsZGVyQ2FjaGUpIHtcbiAgICBpZiAoIXJlc3VsdC5wYXRocy5kaXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXN1bHQuc2V0dGluZ3Muc2NyZWVuLmV4YWN0Rml0U2NyZWVuID0gZmFsc2U7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkJlZm9yZUNvcHlCdWlsZFRlbXBsYXRlKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOklUYXNrT3B0aW9uLCByZXN1bHQ6IElCdWlsZFJlc3VsdCkge1xuICAgIGNvbnN0IHN0YXRpY0RpciA9IGpvaW4ob3B0aW9ucy5lbmdpbmVJbmZvLnR5cGVzY3JpcHQucGF0aCwgJ3RlbXBsYXRlcy93ZWItZGVza3RvcCcpO1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1snd2ViLWRlc2t0b3AnXTtcblxuICAgIGNvbnN0IGNzc0ZpbGVQYXRoID0gam9pbihyZXN1bHQucGF0aHMuZGlyLCAnc3R5bGUuY3NzJyk7XG4gICAgb3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMuaW5jbHVkZXMucHVzaCgnc3R5bGUuY3NzJyk7XG4gICAgaWYgKCF0aGlzLmJ1aWxkVGVtcGxhdGUuZmluZEZpbGUoJ3N0eWxlLmNzcycpKSB7XG4gICAgICAgIGNvcHlGaWxlU3luYyhqb2luKHN0YXRpY0RpciwgJ3N0eWxlLmNzcycpLCBjc3NGaWxlUGF0aCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5idWlsZFRlbXBsYXRlLmZpbmRGaWxlKCdmYXZpY29uLmljbycpKSB7XG4gICAgICAgIGNvcHlGaWxlU3luYyhqb2luKHN0YXRpY0RpciwgJ2Zhdmljb24uaWNvJyksIGpvaW4ocmVzdWx0LnBhdGhzLmRpciwgJ2Zhdmljb24uaWNvJykpO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4SnNUZW1wbGF0ZSA9IHRoaXMuYnVpbGRUZW1wbGF0ZS5pbml0VXJsKCdpbmRleC5qcy5lanMnLCAnaW5kZXhKcycpIHx8IGpvaW4oc3RhdGljRGlyLCAnaW5kZXguanMuZWpzJyk7XG4gICAgY29uc3QgaW5kZXhKc0NvbnRlbnQ6IHN0cmluZyA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGluZGV4SnNUZW1wbGF0ZSwge1xuICAgICAgICBhcHBsaWNhdGlvbkpTOiAnLi8nICsgcmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLmFwcGxpY2F0aW9uSlMpLFxuICAgIH0pO1xuICAgIGNvbnN0IGluZGV4SnNTb3VyY2VUcmFuc2Zvcm1lZENvZGUgPSBhd2FpdCB0cmFuc2Zvcm1Db2RlKGluZGV4SnNDb250ZW50LCB7XG4gICAgICAgIGltcG9ydE1hcEZvcm1hdDogJ3N5c3RlbWpzJyxcbiAgICB9KTtcbiAgICBpZiAoIWluZGV4SnNTb3VyY2VUcmFuc2Zvcm1lZENvZGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2VuZXJhdGUgaW5kZXguanMnKTtcbiAgICB9XG4gICAgY29uc3QgaW5kZXhKc0Rlc3QgPSBqb2luKHJlc3VsdC5wYXRocy5kaXIsICdpbmRleC5qcycpO1xuICAgIHJlc3VsdC5wYXRocy5pbmRleEpzID0gaW5kZXhKc0Rlc3Q7XG4gICAgb3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMuaW5jbHVkZXMucHVzaCgnaW5kZXguanMnKTtcblxuICAgIG91dHB1dEZpbGVTeW5jKGluZGV4SnNEZXN0LCBpbmRleEpzU291cmNlVHJhbnNmb3JtZWRDb2RlLCAndXRmOCcpO1xuXG4gICAgY29uc3QgaW5kZXhFanNUZW1wbGF0ZSA9IHRoaXMuYnVpbGRUZW1wbGF0ZS5pbml0VXJsKCdpbmRleC5lanMnKSB8fCBqb2luKHN0YXRpY0RpciwgJ2luZGV4LmVqcycpO1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgIHBvbHlmaWxsc0J1bmRsZUZpbGU6IChyZXN1bHQucGF0aHMucG9seWZpbGxzSnMgJiYgcmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLnBvbHlmaWxsc0pzKSkgfHwgZmFsc2UsXG4gICAgICAgIHN5c3RlbUpzQnVuZGxlRmlsZTogcmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLnN5c3RlbUpzISksXG4gICAgICAgIHByb2plY3ROYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgICAgIGVuZ2luZU5hbWU6IG9wdGlvbnMuYnVpbGRFbmdpbmVQYXJhbS5lbmdpbmVOYW1lLFxuICAgICAgICBwcmV2aWV3V2lkdGg6IHBhY2thZ2VPcHRpb25zLnJlc29sdXRpb24uZGVzaWduV2lkdGgsXG4gICAgICAgIHByZXZpZXdIZWlnaHQ6IHBhY2thZ2VPcHRpb25zLnJlc29sdXRpb24uZGVzaWduSGVpZ2h0LFxuICAgICAgICBjb2Nvc1RlbXBsYXRlOiBqb2luKHN0YXRpY0RpciwgJ2luZGV4LXBsdWdpbi5lanMnKSxcbiAgICAgICAgaW1wb3J0TWFwRmlsZTogcmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLmltcG9ydE1hcCksXG4gICAgICAgIGluZGV4SnNOYW1lOiAnLi9pbmRleC5qcycsXG4gICAgICAgIGNzc1VybDogJy4vc3R5bGUuY3NzJyxcbiAgICB9O1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBFanMucmVuZGVyRmlsZShpbmRleEVqc1RlbXBsYXRlLCBkYXRhKTtcbiAgICByZXN1bHQucGF0aHMuaW5kZXhIVE1MID0gam9pbihyZXN1bHQucGF0aHMuZGlyLCAnaW5kZXguaHRtbCcpO1xuICAgIG91dHB1dEZpbGVTeW5jKHJlc3VsdC5wYXRocy5pbmRleEhUTUwsIGNvbnRlbnQsICd1dGY4Jyk7XG4gICAgb3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMucmVwbGFjZU9ubHkucHVzaCgnaW5kZXguaHRtbCcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25BZnRlckJ1aWxkKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOklUYXNrT3B0aW9uLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQpIHtcbiAgICByZXN1bHQuc2V0dGluZ3MucGx1Z2lucy5qc0xpc3QuZm9yRWFjaCgodXJsOiBzdHJpbmcsIGk6IG51bWJlcikgPT4ge1xuICAgICAgICByZXN1bHQuc2V0dGluZ3MucGx1Z2lucy5qc0xpc3RbaV0gPSB1cmwuc3BsaXQoJy8nKS5tYXAoZW5jb2RlVVJJQ29tcG9uZW50KS5qb2luKCcvJyk7XG4gICAgfSk7XG4gICAgb3V0cHV0RmlsZVN5bmMocmVzdWx0LnBhdGhzLnNldHRpbmdzLCBKU09OLnN0cmluZ2lmeShyZXN1bHQuc2V0dGluZ3MsIG51bGwsIG9wdGlvbnMuZGVidWcgPyA0IDogMCkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuKHRoaXM6IElCdWlsZFN0YWdlVGFzaywgcm9vdDogc3RyaW5nLCBvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnN0IHByZXZpZXdVcmwgPSBhd2FpdCBjb21tb25VdGlscy5ydW4oJ3dlYi1kZXNrdG9wJywgcm9vdCk7XG4gICAgdGhpcy5idWlsZEV4aXRSZXMuY3VzdG9tID0ge1xuICAgICAgICBwcmV2aWV3VXJsLFxuICAgIH07XG59XG4iXX0=