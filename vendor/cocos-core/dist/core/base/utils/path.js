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
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.parse = exports.delimiter = exports.sep = exports.extname = exports.basename = exports.dirname = exports.relative = exports.isAbsolute = exports.resolve = exports.resolveToUrl = exports.resolveToRaw = exports.unregister = exports.register = void 0;
exports.basenameNoExt = basenameNoExt;
exports.slash = slash;
exports.stripSep = stripSep;
exports.stripExt = stripExt;
exports.contains = contains;
exports.normalize = normalize;
const Path = __importStar(require("path"));
const path_1 = require("path");
/**
 * 返回一个不含扩展名的文件名
 * @param path
 */
function basenameNoExt(path) {
    return Path.basename(path, Path.extname(path));
}
/**
 * 将 \ 统一换成 /
 * @param path
 */
function slash(path) {
    return path.replace(/\\/g, '/');
}
/**
 * 去除路径最后的斜杆，返回一个不带斜杆的路径
 * @param path
 */
function stripSep(path) {
    path = Path.normalize(path);
    let i;
    for (i = path.length - 1; i >= 0; --i) {
        if (path[i] !== Path.sep) {
            break;
        }
    }
    return path.substring(0, i + 1);
}
/**
 * 删除一个路径的扩展名
 * @param path
 */
function stripExt(path) {
    const extname = Path.extname(path);
    return path.substring(0, path.length - extname.length);
}
/**
 * 判断路径 pathA 是否包含 pathB
 * pathA = foo/bar,         pathB = foo/bar/foobar, return true
 * pathA = foo/bar,         pathB = foo/bar,        return true
 * pathA = foo/bar/foobar,  pathB = foo/bar,        return false
 * pathA = foo/bar/foobar,  pathB = foobar/bar/foo, return false
 * @param pathA
 * @param pathB
 */
function contains(pathA, pathB) {
    pathA = stripSep(pathA);
    pathB = stripSep(pathB);
    if (process.platform === 'win32') {
        pathA = pathA.toLowerCase();
        pathB = pathB.toLowerCase();
    }
    //
    if (pathA === pathB) {
        return true;
    }
    // never compare files
    if (Path.dirname(pathA) === Path.dirname(pathB)) {
        return false;
    }
    if (pathA.length < pathB.length && pathB.indexOf(pathA + Path.sep) === 0) {
        return true;
    }
    return false;
}
/**
 * 格式化路径
 * 如果是 Windows 平台，需要将盘符转成小写进行判断
 * @param path
 */
function normalize(path) {
    path = Path.normalize(path);
    if (process.platform === 'win32') {
        if (/^[a-z]/.test(path[0]) && !/electron.asar/.test(path)) {
            path = path[0].toUpperCase() + path.substr(1);
        }
    }
    return path;
}
class FileUrlManager {
    static urlMap = {};
    /**
     * 注册某个协议信息
     * @param protocol
     * @param protocolInfo
     */
    register(protocol, protocolInfo) {
        if (!FileUrlManager.urlMap) {
            FileUrlManager.urlMap = {};
        }
        if (FileUrlManager.urlMap[protocol] || protocol === 'file') {
            console.warn(`[UI-File] Register protocol(${protocol}) failed! protocol(${protocol}) has exist!`);
            return false;
        }
        FileUrlManager.urlMap[protocol] = protocolInfo;
        return true;
    }
    /**
     * 反注册某个协议信息
     * @param protocol 协议头
     */
    unregister(protocol) {
        delete FileUrlManager.urlMap[protocol];
        return true;
    }
    getAllFileProtocol() {
        return Object.keys(FileUrlManager.urlMap).map((protocol) => {
            return {
                protocol,
                label: FileUrlManager.urlMap[protocol].label,
                path: FileUrlManager.urlMap[protocol].path,
            };
        });
    }
    // 转成未处理过的（不带协议）
    resolveToRaw(url) {
        const matchInfo = url.match(/^([a-zA-z]*):\/\/(.*)$/);
        if (matchInfo) {
            const relPath = matchInfo[2].replace(/\\/g, '/');
            const info = this.getProtocalInfo(matchInfo[1]);
            if (info) {
                return (0, path_1.join)(info.path, relPath);
            }
        }
        return url;
    }
    // 转成带协议的地址格式
    resolveToUrl(raw, protocol) {
        if (!raw || !(0, exports.isAbsolute)(raw) || !protocol) {
            return '';
        }
        const info = this.getProtocalInfo(protocol);
        if (!info) {
            return '';
        }
        return info.protocol + '://' + (0, exports.relative)(info.path, raw).replace(/\\/g, '/');
    }
    getProtocalInfo(protocol) {
        if (!FileUrlManager.urlMap[protocol]) {
            return undefined;
        }
        return {
            protocol,
            ...FileUrlManager.urlMap[protocol],
        };
    }
}
const fileUrlManager = new FileUrlManager();
// 使用 bind 绑定 this 上下文
exports.register = fileUrlManager.register.bind(fileUrlManager);
exports.unregister = fileUrlManager.unregister.bind(fileUrlManager);
exports.resolveToRaw = fileUrlManager.resolveToRaw.bind(fileUrlManager);
exports.resolveToUrl = fileUrlManager.resolveToUrl.bind(fileUrlManager);
exports.resolve = Path.resolve;
exports.isAbsolute = Path.isAbsolute;
exports.relative = Path.relative;
exports.dirname = Path.dirname;
exports.basename = Path.basename;
exports.extname = Path.extname;
exports.sep = Path.sep;
exports.delimiter = Path.delimiter;
exports.parse = Path.parse;
exports.format = Path.format;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL2Jhc2UvdXRpbHMvcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVNiLHNDQUVDO0FBTUQsc0JBRUM7QUFNRCw0QkFTQztBQU1ELDRCQUdDO0FBV0QsNEJBd0JDO0FBT0QsOEJBUUM7QUEzRkQsMkNBQTZCO0FBQzdCLCtCQUE0QjtBQUU1Qjs7O0dBR0c7QUFDSCxTQUFnQixhQUFhLENBQUMsSUFBWTtJQUN0QyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsS0FBSyxDQUFDLElBQVk7SUFDOUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLElBQVk7SUFDakMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsSUFBSSxDQUFDLENBQUM7SUFDTixLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDcEMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLE1BQU07UUFDVixDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixRQUFRLENB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LFFBQUEsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDZixRQUFBLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFFBQUEsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDbkIsUUFBQSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuLyoqXG4gKiDov5Tlm57kuIDkuKrkuI3lkKvmianlsZXlkI3nmoTmlofku7blkI1cbiAqIEBwYXJhbSBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbmFtZU5vRXh0KHBhdGg6IHN0cmluZykge1xuICAgIHJldHVybiBQYXRoLmJhc2VuYW1lKHBhdGgsIFBhdGguZXh0bmFtZShwYXRoKSk7XG59XG5cbi8qKlxuICog5bCGIFxcIOe7n+S4gOaNouaIkCAvXG4gKiBAcGFyYW0gcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2xhc2gocGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xufVxuXG4vKipcbiAqIOWOu+mZpOi3r+W+hOacgOWQjueahOaWnOadhu+8jOi/lOWbnuS4gOS4quS4jeW4puaWnOadhueahOi3r+W+hFxuICogQHBhcmFtIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwU2VwKHBhdGg6IHN0cmluZykge1xuICAgIHBhdGggPSBQYXRoLm5vcm1hbGl6ZShwYXRoKTtcbiAgICBsZXQgaTtcbiAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIGlmIChwYXRoW2ldICE9PSBQYXRoLnNlcCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhdGguc3Vic3RyaW5nKDAsIGkgKyAxKTtcbn1cblxuLyoqXG4gKiDliKDpmaTkuIDkuKrot6/lvoTnmoTmianlsZXlkI1cbiAqIEBwYXJhbSBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEV4dChwYXRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCBleHRuYW1lID0gUGF0aC5leHRuYW1lKHBhdGgpO1xuICAgIHJldHVybiBwYXRoLnN1YnN0cmluZygwLCBwYXRoLmxlbmd0aCAtIGV4dG5hbWUubGVuZ3RoKTtcbn1cblxuLyoqXG4gKiDliKTmlq3ot6/lvoQgcGF0aEEg5piv5ZCm5YyF5ZCrIHBhdGhCXG4gKiBwYXRoQSA9IGZvby9iYXIsICAgICAgICAgcGF0aEIgPSBmb28vYmFyL2Zvb2JhciwgcmV0dXJuIHRydWVcbiAqIHBhdGhBID0gZm9vL2JhciwgICAgICAgICBwYXRoQiA9IGZvby9iYXIsICAgICAgICByZXR1cm4gdHJ1ZVxuICogcGF0aEEgPSBmb28vYmFyL2Zvb2JhciwgIHBhdGhCID0gZm9vL2JhciwgICAgICAgIHJldHVybiBmYWxzZVxuICogcGF0aEEgPSBmb28vYmFyL2Zvb2JhciwgIHBhdGhCID0gZm9vYmFyL2Jhci9mb28sIHJldHVybiBmYWxzZVxuICogQHBhcmFtIHBhdGhBXG4gKiBAcGFyYW0gcGF0aEJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zKHBhdGhBOiBzdHJpbmcsIHBhdGhCOiBzdHJpbmcpIHtcbiAgICBwYXRoQSA9IHN0cmlwU2VwKHBhdGhBKTtcbiAgICBwYXRoQiA9IHN0cmlwU2VwKHBhdGhCKTtcblxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIHBhdGhBID0gcGF0aEEudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcGF0aEIgPSBwYXRoQi50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIC8vXG4gICAgaWYgKHBhdGhBID09PSBwYXRoQikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBuZXZlciBjb21wYXJlIGZpbGVzXG4gICAgaWYgKFBhdGguZGlybmFtZShwYXRoQSkgPT09IFBhdGguZGlybmFtZShwYXRoQikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChwYXRoQS5sZW5ndGggPCBwYXRoQi5sZW5ndGggJiYgcGF0aEIuaW5kZXhPZihwYXRoQSArIFBhdGguc2VwKSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICog5qC85byP5YyW6Lev5b6EXG4gKiDlpoLmnpzmmK8gV2luZG93cyDlubPlj7DvvIzpnIDopoHlsIbnm5jnrKbovazmiJDlsI/lhpnov5vooYzliKTmlq1cbiAqIEBwYXJhbSBwYXRoIFxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplKHBhdGg6IHN0cmluZykge1xuICAgIHBhdGggPSBQYXRoLm5vcm1hbGl6ZShwYXRoKTtcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICBpZiAoL15bYS16XS8udGVzdChwYXRoWzBdKSAmJiAhL2VsZWN0cm9uLmFzYXIvLnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoWzBdLnRvVXBwZXJDYXNlKCkgKyBwYXRoLnN1YnN0cigxKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbn1cblxuXG5jbGFzcyBGaWxlVXJsTWFuYWdlciB7XG4gICAgc3RhdGljIHVybE1hcDogUmVjb3JkPHN0cmluZywgUmVnaXN0ZXJQcm90b2NvbEluZm8+ID0ge1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOazqOWGjOafkOS4quWNj+iuruS/oeaBr1xuICAgICAqIEBwYXJhbSBwcm90b2NvbFxuICAgICAqIEBwYXJhbSBwcm90b2NvbEluZm9cbiAgICAgKi9cbiAgICByZWdpc3Rlcihwcm90b2NvbDogc3RyaW5nLCBwcm90b2NvbEluZm86IFJlZ2lzdGVyUHJvdG9jb2xJbmZvKSB7XG4gICAgICAgIGlmICghRmlsZVVybE1hbmFnZXIudXJsTWFwKSB7XG4gICAgICAgICAgICBGaWxlVXJsTWFuYWdlci51cmxNYXAgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRmlsZVVybE1hbmFnZXIudXJsTWFwW3Byb3RvY29sXSB8fCBwcm90b2NvbCA9PT0gJ2ZpbGUnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtVSS1GaWxlXSBSZWdpc3RlciBwcm90b2NvbCgke3Byb3RvY29sfSkgZmFpbGVkISBwcm90b2NvbCgke3Byb3RvY29sfSkgaGFzIGV4aXN0IWApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIEZpbGVVcmxNYW5hZ2VyLnVybE1hcFtwcm90b2NvbF0gPSBwcm90b2NvbEluZm87XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWPjeazqOWGjOafkOS4quWNj+iuruS/oeaBr1xuICAgICAqIEBwYXJhbSBwcm90b2NvbCDljY/orq7lpLRcbiAgICAgKi9cbiAgICB1bnJlZ2lzdGVyKHByb3RvY29sOiBzdHJpbmcpIHtcbiAgICAgICAgZGVsZXRlIEZpbGVVcmxNYW5hZ2VyLnVybE1hcFtwcm90b2NvbF07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGdldEFsbEZpbGVQcm90b2NvbCgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKEZpbGVVcmxNYW5hZ2VyLnVybE1hcCkubWFwKChwcm90b2NvbCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwcm90b2NvbCxcbiAgICAgICAgICAgICAgICBsYWJlbDogRmlsZVVybE1hbmFnZXIudXJsTWFwW3Byb3RvY29sXS5sYWJlbCxcbiAgICAgICAgICAgICAgICBwYXRoOiBGaWxlVXJsTWFuYWdlci51cmxNYXBbcHJvdG9jb2xdLnBhdGgsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDovazmiJDmnKrlpITnkIbov4fnmoTvvIjkuI3luKbljY/orq7vvIlcbiAgICByZXNvbHZlVG9SYXcodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbWF0Y2hJbmZvID0gdXJsLm1hdGNoKC9eKFthLXpBLXpdKik6XFwvXFwvKC4qKSQvKTtcbiAgICAgICAgaWYgKG1hdGNoSW5mbykge1xuICAgICAgICAgICAgY29uc3QgcmVsUGF0aCA9IG1hdGNoSW5mb1syXS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRQcm90b2NhbEluZm8obWF0Y2hJbmZvWzFdKTtcbiAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpvaW4oaW5mby5wYXRoLCByZWxQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIC8vIOi9rOaIkOW4puWNj+iurueahOWcsOWdgOagvOW8j1xuICAgIHJlc29sdmVUb1VybChyYXc6IHN0cmluZywgcHJvdG9jb2w6IHN0cmluZykge1xuICAgICAgICBpZiAoIXJhdyB8fCAhaXNBYnNvbHV0ZShyYXcpIHx8ICFwcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdldFByb3RvY2FsSW5mbyhwcm90b2NvbCk7XG4gICAgICAgIGlmICghaW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbmZvLnByb3RvY29sICsgJzovLycgKyByZWxhdGl2ZShpbmZvLnBhdGgsIHJhdykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIH1cblxuICAgIGdldFByb3RvY2FsSW5mbyhwcm90b2NvbDogc3RyaW5nKTogUHJvdG9jb2xJbmZvIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKCFGaWxlVXJsTWFuYWdlci51cmxNYXBbcHJvdG9jb2xdKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcm90b2NvbCxcbiAgICAgICAgICAgIC4uLkZpbGVVcmxNYW5hZ2VyLnVybE1hcFtwcm90b2NvbF0sXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5jb25zdCBmaWxlVXJsTWFuYWdlciA9IG5ldyBGaWxlVXJsTWFuYWdlcigpO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb3RvY29sSW5mbyBleHRlbmRzIFJlZ2lzdGVyUHJvdG9jb2xJbmZvIHtcbiAgICBwcm90b2NvbDogc3RyaW5nO1xufVxuXG4vLyDkvb/nlKggYmluZCDnu5HlrpogdGhpcyDkuIrkuIvmlodcbmV4cG9ydCBjb25zdCByZWdpc3RlciA9IGZpbGVVcmxNYW5hZ2VyLnJlZ2lzdGVyLmJpbmQoZmlsZVVybE1hbmFnZXIpO1xuZXhwb3J0IGNvbnN0IHVucmVnaXN0ZXIgPSBmaWxlVXJsTWFuYWdlci51bnJlZ2lzdGVyLmJpbmQoZmlsZVVybE1hbmFnZXIpO1xuZXhwb3J0IGNvbnN0IHJlc29sdmVUb1JhdyA9IGZpbGVVcmxNYW5hZ2VyLnJlc29sdmVUb1Jhdy5iaW5kKGZpbGVVcmxNYW5hZ2VyKTtcbmV4cG9ydCBjb25zdCByZXNvbHZlVG9VcmwgPSBmaWxlVXJsTWFuYWdlci5yZXNvbHZlVG9VcmwuYmluZChmaWxlVXJsTWFuYWdlcik7XG5leHBvcnQgY29uc3QgcmVzb2x2ZSA9IFBhdGgucmVzb2x2ZTtcbmV4cG9ydCBjb25zdCBpc0Fic29sdXRlID0gUGF0aC5pc0Fic29sdXRlO1xuZXhwb3J0IGNvbnN0IHJlbGF0aXZlID0gUGF0aC5yZWxhdGl2ZTtcbmV4cG9ydCBjb25zdCBkaXJuYW1lID0gUGF0aC5kaXJuYW1lO1xuZXhwb3J0IGNvbnN0IGJhc2VuYW1lID0gUGF0aC5iYXNlbmFtZTtcbmV4cG9ydCBjb25zdCBleHRuYW1lID0gUGF0aC5leHRuYW1lO1xuZXhwb3J0IGNvbnN0IHNlcCA9IFBhdGguc2VwO1xuZXhwb3J0IGNvbnN0IGRlbGltaXRlciA9IFBhdGguZGVsaW1pdGVyO1xuZXhwb3J0IGNvbnN0IHBhcnNlID0gUGF0aC5wYXJzZTtcbmV4cG9ydCBjb25zdCBmb3JtYXQgPSBQYXRoLmZvcm1hdDtcbmV4cG9ydCBpbnRlcmZhY2UgUmVnaXN0ZXJQcm90b2NvbEluZm8ge1xuICAgIGxhYmVsOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nOyAvLyDkuI7ovazmjaIgaGFuZGxlcnMg5LqM6YCJ5LiAXG4gICAgaW52YWxpZEluZm8/OiBzdHJpbmc7IC8vIOS4jeespuWQiOW9k+WJjeWNj+iuruWktOaXtueahOaWh+acrOaPkOekulxuICAgIC8vIOiHquWumuS5ieWNj+iurui9rOaNolxuICAgIC8vIGhhbmRsZXJzPzoge1xuICAgIC8vICAgICBmaWxlVG9Vcmw6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZztcbiAgICAvLyAgICAgdXJsVG9GaWxlOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmc7XG4gICAgLy8gfVxufVxuXG5cbiJdfQ==