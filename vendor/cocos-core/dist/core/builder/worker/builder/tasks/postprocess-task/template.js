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
exports.name = exports.title = void 0;
exports.handle = handle;
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const babel = __importStar(require("@babel/core"));
// @ts-ignore
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const utils_1 = require("../../utils");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
const utils_2 = __importDefault(require("../../../../../base/utils"));
// 当前的 ejs 模板版本，升级版本后需要修改该字段与 application.ejs 里的版本号
const APPLICATION_EJS_VERSION = '1.0.0';
exports.title = 'i18n:builder.tasks.build_template';
exports.name = 'build-task/template';
/**
 * application.js 模板编译
 * @param options
 * @param settings
 */
async function handle(options, result, cache) {
    // 生成 settings.json
    const content = JSON.stringify(result.settings, null, options.debug ? 4 : 0);
    (0, fs_extra_1.outputFileSync)(result.paths.settings, content, 'utf8');
    const enginePath = options.engineInfo.typescript.path;
    const templateDir = (0, path_1.join)(enginePath, 'templates/launcher');
    const applicationEjsPath = this.buildTemplate.query('application') || (0, path_1.join)(templateDir, 'application.ejs');
    const settingsJsonPath = (0, utils_1.relativeUrl)(result.paths.dir, result.paths.settings);
    // ---- 编译 application.js ----
    const applicationSource = (await ejs_1.default.renderFile(applicationEjsPath, Object.assign(options.appTemplateData, {
        settingsJsonPath,
        hasPhysicsAmmo: options.buildEngineParam.includeModules.includes('physics-ammo'),
        versionTips: i18n_1.default.t('builder.tips.application_ejs_version'),
        customVersion: APPLICATION_EJS_VERSION,
        versionCheckTemplate: (0, path_1.join)(templateDir, 'version-check.ejs'),
    })));
    const applicationSourceTransformed = await babel.transformAsync(applicationSource, {
        presets: [[preset_env_1.default, {
                    modules: (0, utils_1.toBabelModules)('systemjs'),
                    targets: options.buildScriptParam.targets,
                }]],
    });
    if (!applicationSourceTransformed || !applicationSourceTransformed.code) {
        throw new Error('无法生成 application.js');
    }
    (0, fs_extra_1.outputFileSync)(result.paths.applicationJS, applicationSourceTransformed.code);
    options.md5CacheOptions.includes.push(utils_2.default.Path.relative(result.paths.dir, result.paths.applicationJS));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL3Rhc2tzL3Bvc3Rwcm9jZXNzLXRhc2svdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQmIsd0JBaUNDO0FBM0RELDhDQUEyQjtBQUUzQix1Q0FBd0c7QUFDeEcsK0JBQStDO0FBQy9DLG1EQUFxQztBQUNyQyxhQUFhO0FBQ2IsbUVBQStDO0FBRy9DLHVDQUEwRDtBQUMxRCxvRUFBNEM7QUFFNUMsc0VBQThDO0FBRTlDLG1EQUFtRDtBQUNuRCxNQUFNLHVCQUF1QixHQUFHLE9BQU8sQ0FBQztBQUUzQixRQUFBLEtBQUssR0FBRyxtQ0FBbUMsQ0FBQztBQUU1QyxRQUFBLElBQUksR0FBRyxxQkFBcUIsQ0FBQztBQUUxQzs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLE1BQU0sQ0FBaUIsT0FBOEIsRUFBRSxNQUEyQixFQUFFLEtBQXdCO0lBQzlILG1CQUFtQjtJQUNuQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsSUFBQSx5QkFBYyxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUV2RCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7SUFDdEQsTUFBTSxXQUFXLEdBQUcsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFDM0QsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsYUFBYyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFBLFdBQUksRUFBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUU1RyxNQUFNLGdCQUFnQixHQUFHLElBQUEsbUJBQVcsRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlFLDhCQUE4QjtJQUM5QixNQUFNLGlCQUFpQixHQUFHLENBQUMsTUFBTSxhQUFRLENBQUMsVUFBVSxDQUNoRCxrQkFBa0IsRUFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFO1FBQ25DLGdCQUFnQjtRQUNoQixjQUFjLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDO1FBQ2hGLFdBQVcsRUFBRSxjQUFJLENBQUMsQ0FBQyxDQUFDLHNDQUFzQyxDQUFDO1FBQzNELGFBQWEsRUFBRSx1QkFBdUI7UUFDdEMsb0JBQW9CLEVBQUUsSUFBQSxXQUFJLEVBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDO0tBQy9ELENBQUMsQ0FDTCxDQUFXLENBQUM7SUFDYixNQUFNLDRCQUE0QixHQUFHLE1BQU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRTtRQUMvRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLG9CQUFjLEVBQUU7b0JBQ3ZCLE9BQU8sRUFBRSxJQUFBLHNCQUFjLEVBQUMsVUFBVSxDQUFDO29CQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU87aUJBQzVDLENBQUMsQ0FBQztLQUNOLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyw0QkFBNEIsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsSUFBQSx5QkFBYyxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLDRCQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlFLE9BQU8sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDN0csQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbmltcG9ydCB0ZW1wbGF0ZSBmcm9tICdlanMnO1xuXG5pbXBvcnQgeyBjb3B5RmlsZVN5bmMsIGNvcHlTeW5jLCBleGlzdHNTeW5jLCBvdXRwdXRGaWxlU3luYywgcmVhZEZpbGVTeW5jLCByZW1vdmVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiwgZGlybmFtZSwgYmFzZW5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBiYWJlbFByZXNldEVudiBmcm9tICdAYmFiZWwvcHJlc2V0LWVudic7XG5pbXBvcnQgeyBCdWlsZGVyQXNzZXRDYWNoZSB9IGZyb20gJy4uLy4uL21hbmFnZXIvYXNzZXQnO1xuaW1wb3J0IHsgSW50ZXJuYWxCdWlsZFJlc3VsdCB9IGZyb20gJy4uLy4uL21hbmFnZXIvYnVpbGQtcmVzdWx0JztcbmltcG9ydCB7IHJlbGF0aXZlVXJsLCB0b0JhYmVsTW9kdWxlcyB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCBpMThuIGZyb20gJy4uLy4uLy4uLy4uLy4uL2Jhc2UvaTE4bic7XG5pbXBvcnQgeyBJQnVpbGRlciwgSUludGVybmFsQnVpbGRPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYmFzZS91dGlscyc7XG5cbi8vIOW9k+WJjeeahCBlanMg5qih5p2/54mI5pys77yM5Y2H57qn54mI5pys5ZCO6ZyA6KaB5L+u5pS56K+l5a2X5q615LiOIGFwcGxpY2F0aW9uLmVqcyDph4znmoTniYjmnKzlj7dcbmNvbnN0IEFQUExJQ0FUSU9OX0VKU19WRVJTSU9OID0gJzEuMC4wJztcblxuZXhwb3J0IGNvbnN0IHRpdGxlID0gJ2kxOG46YnVpbGRlci50YXNrcy5idWlsZF90ZW1wbGF0ZSc7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ2J1aWxkLXRhc2svdGVtcGxhdGUnO1xuXG4vKipcbiAqIGFwcGxpY2F0aW9uLmpzIOaooeadv+e8luivkVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBwYXJhbSBzZXR0aW5nc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOiBJSW50ZXJuYWxCdWlsZE9wdGlvbnMsIHJlc3VsdDogSW50ZXJuYWxCdWlsZFJlc3VsdCwgY2FjaGU6IEJ1aWxkZXJBc3NldENhY2hlKSB7XG4gICAgLy8g55Sf5oiQIHNldHRpbmdzLmpzb25cbiAgICBjb25zdCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0LnNldHRpbmdzLCBudWxsLCBvcHRpb25zLmRlYnVnID8gNCA6IDApO1xuICAgIG91dHB1dEZpbGVTeW5jKHJlc3VsdC5wYXRocy5zZXR0aW5ncywgY29udGVudCwgJ3V0ZjgnKTtcblxuICAgIGNvbnN0IGVuZ2luZVBhdGggPSBvcHRpb25zLmVuZ2luZUluZm8udHlwZXNjcmlwdC5wYXRoO1xuICAgIGNvbnN0IHRlbXBsYXRlRGlyID0gam9pbihlbmdpbmVQYXRoLCAndGVtcGxhdGVzL2xhdW5jaGVyJyk7XG4gICAgY29uc3QgYXBwbGljYXRpb25FanNQYXRoID0gdGhpcy5idWlsZFRlbXBsYXRlIS5xdWVyeSgnYXBwbGljYXRpb24nKSB8fCBqb2luKHRlbXBsYXRlRGlyLCAnYXBwbGljYXRpb24uZWpzJyk7XG5cbiAgICBjb25zdCBzZXR0aW5nc0pzb25QYXRoID0gcmVsYXRpdmVVcmwocmVzdWx0LnBhdGhzLmRpciwgcmVzdWx0LnBhdGhzLnNldHRpbmdzKTtcbiAgICAvLyAtLS0tIOe8luivkSBhcHBsaWNhdGlvbi5qcyAtLS0tXG4gICAgY29uc3QgYXBwbGljYXRpb25Tb3VyY2UgPSAoYXdhaXQgdGVtcGxhdGUucmVuZGVyRmlsZShcbiAgICAgICAgYXBwbGljYXRpb25FanNQYXRoLFxuICAgICAgICBPYmplY3QuYXNzaWduKG9wdGlvbnMuYXBwVGVtcGxhdGVEYXRhLCB7XG4gICAgICAgICAgICBzZXR0aW5nc0pzb25QYXRoLFxuICAgICAgICAgICAgaGFzUGh5c2ljc0FtbW86IG9wdGlvbnMuYnVpbGRFbmdpbmVQYXJhbS5pbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygncGh5c2ljcy1hbW1vJyksXG4gICAgICAgICAgICB2ZXJzaW9uVGlwczogaTE4bi50KCdidWlsZGVyLnRpcHMuYXBwbGljYXRpb25fZWpzX3ZlcnNpb24nKSxcbiAgICAgICAgICAgIGN1c3RvbVZlcnNpb246IEFQUExJQ0FUSU9OX0VKU19WRVJTSU9OLFxuICAgICAgICAgICAgdmVyc2lvbkNoZWNrVGVtcGxhdGU6IGpvaW4odGVtcGxhdGVEaXIsICd2ZXJzaW9uLWNoZWNrLmVqcycpLFxuICAgICAgICB9KSxcbiAgICApKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXBwbGljYXRpb25Tb3VyY2VUcmFuc2Zvcm1lZCA9IGF3YWl0IGJhYmVsLnRyYW5zZm9ybUFzeW5jKGFwcGxpY2F0aW9uU291cmNlLCB7XG4gICAgICAgIHByZXNldHM6IFtbYmFiZWxQcmVzZXRFbnYsIHtcbiAgICAgICAgICAgIG1vZHVsZXM6IHRvQmFiZWxNb2R1bGVzKCdzeXN0ZW1qcycpLFxuICAgICAgICAgICAgdGFyZ2V0czogb3B0aW9ucy5idWlsZFNjcmlwdFBhcmFtLnRhcmdldHMsXG4gICAgICAgIH1dXSxcbiAgICB9KTtcblxuICAgIGlmICghYXBwbGljYXRpb25Tb3VyY2VUcmFuc2Zvcm1lZCB8fCAhYXBwbGljYXRpb25Tb3VyY2VUcmFuc2Zvcm1lZC5jb2RlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV55Sf5oiQIGFwcGxpY2F0aW9uLmpzJyk7XG4gICAgfVxuICAgIG91dHB1dEZpbGVTeW5jKHJlc3VsdC5wYXRocy5hcHBsaWNhdGlvbkpTLCBhcHBsaWNhdGlvblNvdXJjZVRyYW5zZm9ybWVkLmNvZGUpO1xuICAgIG9wdGlvbnMubWQ1Q2FjaGVPcHRpb25zLmluY2x1ZGVzLnB1c2godXRpbHMuUGF0aC5yZWxhdGl2ZShyZXN1bHQucGF0aHMuZGlyLCByZXN1bHQucGF0aHMuYXBwbGljYXRpb25KUykpO1xufVxuXG4vLyAtLS0tXG4iXX0=