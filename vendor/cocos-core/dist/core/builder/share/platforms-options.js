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
