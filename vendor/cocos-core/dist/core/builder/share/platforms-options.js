"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overwriteCommonOptions = exports.PLATFORMS = exports.NATIVE_PLATFORM = void 0;
exports.NATIVE_PLATFORM = [
    'android',
    'google-play',
    'ios',
    'windows',
    'mac',
    'ohos',
    'harmonyos-next',
];
// 支持的平台数组，顺序将会影响界面的平台排序
exports.PLATFORMS = [
    ...exports.NATIVE_PLATFORM,
    'web-desktop',
    'web-mobile',
];
exports.overwriteCommonOptions = [
    'buildPath',
    'server',
    'sourceMaps',
    'server',
    'polyfills',
    'name',
    'mainBundleIsRemote',
    'experimentalEraseModules',
    'buildStageGroup',
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm1zLW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3NoYXJlL3BsYXRmb3Jtcy1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdhLFFBQUEsZUFBZSxHQUFlO0lBQ3ZDLFNBQVM7SUFDVCxhQUFhO0lBQ2IsS0FBSztJQUNMLFNBQVM7SUFDVCxLQUFLO0lBQ0wsTUFBTTtJQUNOLGdCQUFnQjtDQUNuQixDQUFDO0FBRUYsd0JBQXdCO0FBQ1gsUUFBQSxTQUFTLEdBQWE7SUFDL0IsR0FBRyx1QkFBZTtJQUVsQixhQUFhO0lBQ2IsWUFBWTtDQUNmLENBQUM7QUFFVyxRQUFBLHNCQUFzQixHQUE0QjtJQUMzRCxXQUFXO0lBQ1gsUUFBUTtJQUNSLFlBQVk7SUFDWixRQUFRO0lBQ1IsV0FBVztJQUNYLE1BQU07SUFDTixvQkFBb0I7SUFDcEIsMEJBQTBCO0lBQzFCLGlCQUFpQjtDQUNwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGxhdGZvcm0gfSBmcm9tICcuLi9AdHlwZXMnO1xuaW1wb3J0IHsgT3ZlcndyaXRlQ29tbW9uT3B0aW9uIH0gZnJvbSAnLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5cbmV4cG9ydCBjb25zdCBOQVRJVkVfUExBVEZPUk06IFBsYXRmb3JtW10gPSBbXG4gICAgJ2FuZHJvaWQnLFxuICAgICdnb29nbGUtcGxheScsXG4gICAgJ2lvcycsXG4gICAgJ3dpbmRvd3MnLFxuICAgICdtYWMnLFxuICAgICdvaG9zJyxcbiAgICAnaGFybW9ueW9zLW5leHQnLFxuXTtcblxuLy8g5pSv5oyB55qE5bmz5Y+w5pWw57uE77yM6aG65bqP5bCG5Lya5b2x5ZON55WM6Z2i55qE5bmz5Y+w5o6S5bqPXG5leHBvcnQgY29uc3QgUExBVEZPUk1TOiBzdHJpbmdbXSA9IFtcbiAgICAuLi5OQVRJVkVfUExBVEZPUk0sXG5cbiAgICAnd2ViLWRlc2t0b3AnLFxuICAgICd3ZWItbW9iaWxlJyxcbl07XG5cbmV4cG9ydCBjb25zdCBvdmVyd3JpdGVDb21tb25PcHRpb25zOiBPdmVyd3JpdGVDb21tb25PcHRpb25bXSA9IFtcbiAgICAnYnVpbGRQYXRoJyxcbiAgICAnc2VydmVyJyxcbiAgICAnc291cmNlTWFwcycsXG4gICAgJ3NlcnZlcicsXG4gICAgJ3BvbHlmaWxscycsXG4gICAgJ25hbWUnLFxuICAgICdtYWluQnVuZGxlSXNSZW1vdGUnLFxuICAgICdleHBlcmltZW50YWxFcmFzZU1vZHVsZXMnLFxuICAgICdidWlsZFN0YWdlR3JvdXAnLFxuXTtcbiJdfQ==