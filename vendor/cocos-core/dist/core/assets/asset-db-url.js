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
exports.pathToDbUrlIfAssetDBPath = pathToDbUrlIfAssetDBPath;
const path_1 = require("path");
const PathUtils = __importStar(require("../base/utils/path"));
function isAbsolutePath(value) {
    return (0, path_1.isAbsolute)(value) || path_1.win32.isAbsolute(value) || path_1.posix.isAbsolute(value);
}
function normalizeForUrl(value) {
    return PathUtils.normalize(value).replace(/\\/g, '/').replace(/\/+$/, '');
}
function normalizeForCompare(value) {
    const normalized = normalizeForUrl(value);
    return process.platform === 'win32' || /^[a-zA-Z]:\//.test(normalized)
        ? normalized.toLowerCase()
        : normalized;
}
function containsPath(root, candidate) {
    const normalizedRoot = normalizeForCompare(root);
    const normalizedCandidate = normalizeForCompare(candidate);
    return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}
function relativeInsideRoot(root, candidate) {
    const normalizedRoot = normalizeForUrl(root);
    const normalizedCandidate = normalizeForUrl(candidate);
    return normalizedCandidate === normalizedRoot ? '' : normalizedCandidate.slice(normalizedRoot.length + 1);
}
function pathToDbUrlIfAssetDBPath(pathOrUrlOrUUID, assetDBInfo) {
    if (!pathOrUrlOrUUID || pathOrUrlOrUUID.startsWith('db://')) {
        return pathOrUrlOrUUID;
    }
    if (!isAbsolutePath(pathOrUrlOrUUID)) {
        const normalizedRelativePath = pathOrUrlOrUUID
            .replace(/\\/g, '/')
            .replace(/^\.\/+/, '')
            .replace(/\/+$/, '');
        const [dbName, ...relativeParts] = normalizedRelativePath.split('/').filter(Boolean);
        const dbInfo = dbName && (assetDBInfo[dbName] ?? Object.values(assetDBInfo).find((info) => info.name === dbName));
        if (dbInfo) {
            return relativeParts.length ? `db://${dbInfo.name}/${relativeParts.join('/')}` : `db://${dbInfo.name}`;
        }
        return pathOrUrlOrUUID;
    }
    const matchedDBInfo = Object.values(assetDBInfo)
        .filter((info) => info?.target && containsPath(info.target, pathOrUrlOrUUID))
        .sort((a, b) => normalizeForCompare(b.target).length - normalizeForCompare(a.target).length)[0];
    if (!matchedDBInfo) {
        return pathOrUrlOrUUID;
    }
    const relativePath = relativeInsideRoot(matchedDBInfo.target, pathOrUrlOrUUID);
    return relativePath ? `db://${matchedDBInfo.name}/${relativePath}` : `db://${matchedDBInfo.name}`;
}
