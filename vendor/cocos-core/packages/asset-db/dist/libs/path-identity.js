'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoPathIdentityConflicts = exports.findPathAwareIndex = exports.getSetStoredPathValue = exports.getMapStoredPathKey = exports.replacePathRecordKey = exports.getPathRecordStoredKey = exports.createPathRecord = exports.PathSet = exports.PathMap = exports.PathCaseConflictError = exports.isSubPath = exports.isSamePath = exports.resolveRealPathCase = exports.toPathKey = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const fileNameLowerCaseRegExp = /[^\u0130\u0131\u00DFa-z0-9\\/:\-_\. ]+/g;
const pathRecordIndexes = new WeakMap();
function toLowerCase(value) {
    return value.toLowerCase();
}
function toWindowsPathSegmentKey(value) {
    return value.replace(fileNameLowerCaseRegExp, toLowerCase);
}
function normalizeAbsolutePath(value) {
    let normalized = (0, path_1.normalize)(value);
    const root = (0, path_1.parse)(normalized).root;
    while (normalized.length > root.length && normalized.endsWith(path_1.sep)) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}
/**
 * Generate a stable identity key for an absolute filesystem path.
 * Non-path values such as UUIDs and db:// URLs are returned unchanged.
 */
function toPathKey(value) {
    if (!(0, path_1.isAbsolute)(value)) {
        return value;
    }
    const normalized = normalizeAbsolutePath(value);
    if (process.platform !== 'win32') {
        return normalized;
    }
    // Keep the same Unicode exceptions used by Creator/TypeScript filename keys.
    return toWindowsPathSegmentKey(normalized);
}
exports.toPathKey = toPathKey;
/**
 * Resolve the casing currently stored on disk for a path inside a known root.
 * The configured root casing is preserved because Windows drive letters do not
 * have a filesystem-provided canonical representation.
 */
function resolveRealPathCase(value, root) {
    const normalized = normalizeAbsolutePath(value);
    const normalizedRoot = normalizeAbsolutePath(root);
    if (process.platform !== 'win32' ||
        !(0, path_1.isAbsolute)(normalized) ||
        !(0, path_1.isAbsolute)(normalizedRoot)) {
        return normalized;
    }
    if (toPathKey(normalized) === toPathKey(normalizedRoot)) {
        return normalizedRoot;
    }
    const relativePath = (0, path_1.relative)(normalizedRoot, normalized);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path_1.sep}`) || (0, path_1.isAbsolute)(relativePath)) {
        return normalized;
    }
    const segments = relativePath.split(path_1.sep).filter(Boolean);
    let resolved = normalizedRoot;
    for (let index = 0; index < segments.length; index++) {
        let entries;
        try {
            entries = (0, fs_1.readdirSync)(resolved);
        }
        catch (_a) {
            return (0, path_1.join)(resolved, ...segments.slice(index));
        }
        const segmentKey = toWindowsPathSegmentKey(segments[index]);
        const matches = entries.filter((entry) => toWindowsPathSegmentKey(entry) === segmentKey);
        if (matches.length > 1) {
            throw new PathCaseConflictError((0, path_1.join)(resolved, matches[0]), (0, path_1.join)(resolved, matches[1]));
        }
        if (matches.length === 0) {
            return (0, path_1.join)(resolved, ...segments.slice(index));
        }
        resolved = (0, path_1.join)(resolved, matches[0]);
    }
    return resolved;
}
exports.resolveRealPathCase = resolveRealPathCase;
function isSamePath(left, right) {
    if (!(0, path_1.isAbsolute)(left) || !(0, path_1.isAbsolute)(right)) {
        return left === right;
    }
    return toPathKey(left) === toPathKey(right);
}
exports.isSamePath = isSamePath;
function isSubPath(candidate, root) {
    if (!(0, path_1.isAbsolute)(candidate) || !(0, path_1.isAbsolute)(root)) {
        return false;
    }
    const candidateKey = toPathKey(candidate);
    const rootKey = toPathKey(root);
    if (candidateKey === rootKey) {
        return false;
    }
    const rootWithSeparator = rootKey.endsWith(path_1.sep) ? rootKey : rootKey + path_1.sep;
    return candidateKey.startsWith(rootWithSeparator);
}
exports.isSubPath = isSubPath;
class PathCaseConflictError extends Error {
    constructor(existingPath, incomingPath) {
        super(`Windows path case conflict: "${existingPath}" and "${incomingPath}" ` +
            'resolve to the same case-insensitive identity. AssetDB cannot index both paths.');
        this.code = 'ASSET_DB_PATH_CASE_CONFLICT';
        this.name = 'PathCaseConflictError';
        this.paths = [existingPath, incomingPath];
    }
}
exports.PathCaseConflictError = PathCaseConflictError;
class PathMap extends Map {
    constructor(entries) {
        super();
        this.keyIndex = new Map();
        if (entries) {
            entries.forEach(([key, value]) => this.set(key, value));
        }
    }
    getStoredKey(key) {
        return this.keyIndex.get(toPathKey(key));
    }
    has(key) {
        return this.keyIndex.has(toPathKey(key));
    }
    get(key) {
        const storedKey = this.getStoredKey(key);
        return storedKey === undefined ? undefined : super.get(storedKey);
    }
    set(key, value) {
        const identityKey = toPathKey(key);
        const storedKey = this.keyIndex.get(identityKey);
        if (storedKey !== undefined && storedKey !== key) {
            super.delete(storedKey);
        }
        this.keyIndex.set(identityKey, key);
        super.set(key, value);
        return this;
    }
    delete(key) {
        const identityKey = toPathKey(key);
        const storedKey = this.keyIndex.get(identityKey);
        if (storedKey === undefined) {
            return false;
        }
        this.keyIndex.delete(identityKey);
        return super.delete(storedKey);
    }
    clear() {
        this.keyIndex.clear();
        super.clear();
    }
}
exports.PathMap = PathMap;
class PathSet extends Set {
    constructor(values) {
        super();
        this.valueIndex = new Map();
        values === null || values === void 0 ? void 0 : values.forEach((value) => this.add(value));
    }
    getStoredValue(value) {
        return this.valueIndex.get(toPathKey(value));
    }
    has(value) {
        return this.valueIndex.has(toPathKey(value));
    }
    add(value) {
        const identityKey = toPathKey(value);
        const storedValue = this.valueIndex.get(identityKey);
        if (storedValue !== undefined && storedValue !== value) {
            super.delete(storedValue);
        }
        this.valueIndex.set(identityKey, value);
        super.add(value);
        return this;
    }
    delete(value) {
        const identityKey = toPathKey(value);
        const storedValue = this.valueIndex.get(identityKey);
        if (storedValue === undefined) {
            return false;
        }
        this.valueIndex.delete(identityKey);
        return super.delete(storedValue);
    }
    clear() {
        this.valueIndex.clear();
        super.clear();
    }
}
exports.PathSet = PathSet;
/**
 * Create an object-compatible path dictionary. Bracket access and Object.keys()
 * remain available while absolute Windows path lookups become case-insensitive.
 */
function createPathRecord() {
    const target = {};
    const keyIndex = new Map();
    const proxy = new Proxy(target, {
        get(current, property) {
            if (typeof property !== 'string') {
                return Reflect.get(current, property);
            }
            const storedKey = keyIndex.get(toPathKey(property));
            return Reflect.get(current, storedKey === undefined ? property : storedKey);
        },
        set(current, property, value) {
            if (typeof property !== 'string') {
                return Reflect.set(current, property, value);
            }
            const identityKey = toPathKey(property);
            const storedKey = keyIndex.get(identityKey);
            if (storedKey !== undefined && storedKey !== property) {
                Reflect.deleteProperty(current, storedKey);
            }
            keyIndex.set(identityKey, property);
            return Reflect.set(current, property, value);
        },
        deleteProperty(current, property) {
            if (typeof property !== 'string') {
                return Reflect.deleteProperty(current, property);
            }
            const identityKey = toPathKey(property);
            const storedKey = keyIndex.get(identityKey);
            if (storedKey === undefined) {
                return true;
            }
            keyIndex.delete(identityKey);
            return Reflect.deleteProperty(current, storedKey);
        },
        has(current, property) {
            if (typeof property !== 'string') {
                return Reflect.has(current, property);
            }
            const storedKey = keyIndex.get(toPathKey(property));
            return storedKey === undefined ? Reflect.has(current, property) : true;
        },
        getOwnPropertyDescriptor(current, property) {
            if (typeof property !== 'string') {
                return Reflect.getOwnPropertyDescriptor(current, property);
            }
            const storedKey = keyIndex.get(toPathKey(property));
            return Reflect.getOwnPropertyDescriptor(current, storedKey === undefined ? property : storedKey);
        },
    });
    pathRecordIndexes.set(proxy, keyIndex);
    return proxy;
}
exports.createPathRecord = createPathRecord;
function getPathRecordStoredKey(record, key) {
    const index = pathRecordIndexes.get(record);
    if (index) {
        return index.get(toPathKey(key));
    }
    return Object.prototype.hasOwnProperty.call(record, key) ? key : undefined;
}
exports.getPathRecordStoredKey = getPathRecordStoredKey;
function replacePathRecordKey(record, oldKey, newKey) {
    const storedKey = getPathRecordStoredKey(record, oldKey);
    if (storedKey === undefined) {
        return false;
    }
    const value = record[storedKey];
    if (storedKey !== newKey) {
        delete record[storedKey];
    }
    record[newKey] = value;
    return true;
}
exports.replacePathRecordKey = replacePathRecordKey;
function getMapStoredPathKey(map, key) {
    return map instanceof PathMap ? map.getStoredKey(key) : (map.has(key) ? key : undefined);
}
exports.getMapStoredPathKey = getMapStoredPathKey;
function getSetStoredPathValue(set, value) {
    return set instanceof PathSet ? set.getStoredValue(value) : (set.has(value) ? value : undefined);
}
exports.getSetStoredPathValue = getSetStoredPathValue;
function findPathAwareIndex(values, value) {
    return values.findIndex((candidate) => isSamePath(candidate, value));
}
exports.findPathAwareIndex = findPathAwareIndex;
function assertNoPathIdentityConflicts(paths) {
    if (process.platform !== 'win32') {
        return;
    }
    const seen = new PathMap();
    for (const path of paths) {
        const storedPath = seen.getStoredKey(path);
        if (storedPath !== undefined && storedPath !== path && (0, path_1.normalize)(storedPath) !== (0, path_1.normalize)(path)) {
            throw new PathCaseConflictError(storedPath, path);
        }
        seen.set(path, true);
    }
}
exports.assertNoPathIdentityConflicts = assertNoPathIdentityConflicts;
