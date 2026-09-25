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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvdGV4dHVyZS1jb21wcmVzcy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLG9DQUVDO0FBRUQsOEJBTUM7QUFHRCw4Q0FFQztBQUVELDhDQU9DO0FBUUQsb0RBa0JDO0FBdERELDJDQUE2QjtBQUM3QixvRUFBNEM7QUFHNUMsU0FBZ0IsWUFBWSxDQUFDLElBQVksRUFBRSxNQUFjO0lBQ3JELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUMzRixDQUFDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLFVBQThCLEVBQUUsTUFBYztJQUNwRSxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztJQUM3QyxJQUFJLFVBQVUsQ0FBQyxZQUFZLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1FBQ2xFLE1BQU0sSUFBSSxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztJQUN6RCxDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQUVELGNBQWM7QUFDZCxTQUFnQixpQkFBaUIsQ0FBQyxJQUF5QjtJQUN2RCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsS0FBYTtJQUMzQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDZixPQUFPLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixvQkFBb0IsQ0FBQyxlQUFvQyxFQUFFLFFBQWlCLEVBQUUsSUFBWTtJQUN0RyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3pGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDekYsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hILGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUNELElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNwQixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoSCxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7U0FBTSxJQUFJLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDL0QsdUNBQXVDO1FBQ3ZDLHdEQUF3RDtRQUN4RCxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxDQUFDLENBQUMsNkJBQTZCLEVBQUU7WUFDL0MsSUFBSSxFQUFFLFVBQVUsSUFBSSxJQUFJO1NBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYmFzZS9pMThuJztcbmltcG9ydCB7IElUZXh0dXJlRm9ybWF0SW5mbyB9IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VTdWZmaXgocGF0aDogc3RyaW5nLCBzdWZmaXg6IHN0cmluZykge1xuICAgIHJldHVybiBQYXRoLmpvaW4oUGF0aC5kaXJuYW1lKHBhdGgpLCBQYXRoLmJhc2VuYW1lKHBhdGgsIFBhdGguZXh0bmFtZShwYXRoKSkgKyBzdWZmaXgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3VmZml4KGZvcm1hdEluZm86IElUZXh0dXJlRm9ybWF0SW5mbywgc3VmZml4OiBzdHJpbmcpIHtcbiAgICBjb25zdCBQaXhlbEZvcm1hdCA9IGNjLlRleHR1cmUyRC5QaXhlbEZvcm1hdDtcbiAgICBpZiAoZm9ybWF0SW5mby5mb3JtYXRTdWZmaXggJiYgUGl4ZWxGb3JtYXRbZm9ybWF0SW5mby5mb3JtYXRTdWZmaXhdKSB7XG4gICAgICAgIHN1ZmZpeCArPSBgQCR7UGl4ZWxGb3JtYXRbZm9ybWF0SW5mby5mb3JtYXRTdWZmaXhdfWA7XG4gICAgfVxuICAgIHJldHVybiBzdWZmaXg7XG59XG5cbi8vIOiwt+atjOe7n+iuoeeahOmAmueUqOaVsOaNruagvOW8j1xuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUluZm9Ub0xhYmVsKGluZm86IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaW5mbykubWFwKChrZXkpID0+IGAke2tleX06JHtpbmZvW2tleV19YCkuam9pbignLCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm91bmRUb1Bvd2VyT2ZUd28odmFsdWU6IG51bWJlcikge1xuICAgIGxldCBwb3dlcnMgPSAyO1xuICAgIHdoaWxlICh2YWx1ZSA+IHBvd2Vycykge1xuICAgICAgICBwb3dlcnMgKj0gMjtcbiAgICB9XG5cbiAgICByZXR1cm4gcG93ZXJzO1xufVxuXG4vKipcbiAqIOagueaNruW9k+WJjeWbvueJh+aYr+WQpuW4puaciemAj+aYjumAmumBk+i/h+a7pOaOieWQjOexu+Wei+eahOS4jeaOqOiNkOeahOagvOW8j1xuICog5aaC5p6c5ZCM57G75Z6L5Zu+54mH5Y+q5pyJ5LiA56eN6YWN572u77yM5YiZ5LiN5L2c6L+H5ruk5aSE55CGXG4gKiBAcGFyYW0gY29tcHJlc3NPcHRpb25zXG4gKiBAcGFyYW0gaGFzQWxwaGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQ29tcHJlc3NPcHRpb25zKGNvbXByZXNzT3B0aW9uczogUmVjb3JkPHN0cmluZywgYW55PiwgaGFzQWxwaGE6IGJvb2xlYW4sIHV1aWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGV0Y0FyciA9IE9iamVjdC5rZXlzKGNvbXByZXNzT3B0aW9ucykuZmlsdGVyKChmb3JtYXQpID0+IGZvcm1hdC5zdGFydHNXaXRoKCdldGMnKSk7XG4gICAgY29uc3QgcHZyQXJyID0gT2JqZWN0LmtleXMoY29tcHJlc3NPcHRpb25zKS5maWx0ZXIoKGZvcm1hdCkgPT4gZm9ybWF0LnN0YXJ0c1dpdGgoJ3B2cicpKTtcbiAgICBpZiAoZXRjQXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29uc3QgaW52YWxpZEZvcm1hdHMgPSBldGNBcnIuZmlsdGVyKChmb3JtYXQpID0+IChoYXNBbHBoYSA/IGZvcm1hdC5lbmRzV2l0aCgncmdiJykgOiAhZm9ybWF0LmVuZHNXaXRoKCdyZ2InKSkpO1xuICAgICAgICBpbnZhbGlkRm9ybWF0cy5mb3JFYWNoKChmb3JtYXQpID0+IGRlbGV0ZSBjb21wcmVzc09wdGlvbnNbZm9ybWF0XSk7XG4gICAgfVxuICAgIGlmIChwdnJBcnIubGVuZ3RoID4gMSkge1xuICAgICAgICBjb25zdCBpbnZhbGlkRm9ybWF0cyA9IHB2ckFyci5maWx0ZXIoKGZvcm1hdCkgPT4gKGhhc0FscGhhID8gZm9ybWF0LmVuZHNXaXRoKCdyZ2InKSA6ICFmb3JtYXQuZW5kc1dpdGgoJ3JnYicpKSk7XG4gICAgICAgIGludmFsaWRGb3JtYXRzLmZvckVhY2goKGZvcm1hdCkgPT4gZGVsZXRlIGNvbXByZXNzT3B0aW9uc1tmb3JtYXRdKTtcbiAgICB9IGVsc2UgaWYgKCFoYXNBbHBoYSAmJiBwdnJBcnJbMF0gJiYgcHZyQXJyWzBdLmVuZHNXaXRoKCdyZ2JfYScpKSB7XG4gICAgICAgIC8vIOS4jeW4pumAj+aYjuW6pueahOWbvuWOi+e8qeaIkCByZ2JfYSDpnIDopoHov4fmu6TmjonmiqXorablkYrvvIzlkKbliJnljovnvKnlkI7kvJrlpLHotKXmiqXplJlcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvY29zLWNyZWF0b3IvM2QtdGFza3MvaXNzdWVzLzUyOThcbiAgICAgICAgZGVsZXRlIGNvbXByZXNzT3B0aW9uc1twdnJBcnJbMF1dO1xuICAgICAgICBjb25zb2xlLndhcm4oaTE4bi50KCdidWlsZGVyLndhcm4uY29tcHJlc3NfcmdiX2EnLCB7XG4gICAgICAgICAgICB1dWlkOiBge2Fzc2V0KCR7dXVpZH0pfWAsXG4gICAgICAgIH0pKTtcbiAgICB9XG59Il19