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
