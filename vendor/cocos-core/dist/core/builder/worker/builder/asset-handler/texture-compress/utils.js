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
exports.changeSuffix = changeSuffix;
exports.getSuffix = getSuffix;
exports.changeInfoToLabel = changeInfoToLabel;
exports.roundToPowerOfTwo = roundToPowerOfTwo;
exports.checkCompressOptions = checkCompressOptions;
const Path = __importStar(require("path"));
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
function changeSuffix(path, suffix) {
    return Path.join(Path.dirname(path), Path.basename(path, Path.extname(path)) + suffix);
}
function getSuffix(formatInfo, suffix) {
    const PixelFormat = cc.Texture2D.PixelFormat;
    if (formatInfo.formatSuffix && PixelFormat[formatInfo.formatSuffix]) {
        suffix += `@${PixelFormat[formatInfo.formatSuffix]}`;
    }
    return suffix;
}
// 谷歌统计的通用数据格式
function changeInfoToLabel(info) {
    return Object.keys(info).map((key) => `${key}:${info[key]}`).join(',');
}
function roundToPowerOfTwo(value) {
    let powers = 2;
    while (value > powers) {
        powers *= 2;
    }
    return powers;
}
/**
 * 根据当前图片是否带有透明通道过滤掉同类型的不推荐的格式
 * 如果同类型图片只有一种配置，则不作过滤处理
 * @param compressOptions
 * @param hasAlpha
 */
function checkCompressOptions(compressOptions, hasAlpha, uuid) {
    const etcArr = Object.keys(compressOptions).filter((format) => format.startsWith('etc'));
    const pvrArr = Object.keys(compressOptions).filter((format) => format.startsWith('pvr'));
    if (etcArr.length > 1) {
        const invalidFormats = etcArr.filter((format) => (hasAlpha ? format.endsWith('rgb') : !format.endsWith('rgb')));
        invalidFormats.forEach((format) => delete compressOptions[format]);
    }
    if (pvrArr.length > 1) {
        const invalidFormats = pvrArr.filter((format) => (hasAlpha ? format.endsWith('rgb') : !format.endsWith('rgb')));
        invalidFormats.forEach((format) => delete compressOptions[format]);
    }
    else if (!hasAlpha && pvrArr[0] && pvrArr[0].endsWith('rgb_a')) {
        // 不带透明度的图压缩成 rgb_a 需要过滤掉报警告，否则压缩后会失败报错
        // https://github.com/cocos-creator/3d-tasks/issues/5298
        delete compressOptions[pvrArr[0]];
        console.warn(i18n_1.default.t('builder.warn.compress_rgb_a', {
            uuid: `{asset(${uuid})}`,
        }));
    }
}
