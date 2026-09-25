'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.nameToId = exports.compareVersion = exports.absolutePath = exports.toPathKey = exports.isSubPath = exports.isSamePath = void 0;
const path_1 = require("path");
const crypto_1 = require("crypto");
var path_identity_1 = require("./path-identity");
Object.defineProperty(exports, "isSamePath", { enumerable: true, get: function () { return path_identity_1.isSamePath; } });
Object.defineProperty(exports, "isSubPath", { enumerable: true, get: function () { return path_identity_1.isSubPath; } });
Object.defineProperty(exports, "toPathKey", { enumerable: true, get: function () { return path_identity_1.toPathKey; } });
/**
 * 将一个 path 转成绝对地址
 * 如果传入数据不存在，则返回 ''
 * @param path
 */
function absolutePath(path) {
    if (!path) {
        return '';
    }
    if ((0, path_1.isAbsolute)(path) && /^[A-Za-z]:/.test(path)) {
        return (0, path_1.normalize)(path);
    }
    return (0, path_1.resolve)(path);
}
exports.absolutePath = absolutePath;
;
/**
 * 比对版本号
 * A > B => 1
 * A = B => 0
 * A < B => -1
 * @param versionA
 * @param versionB
 */
function compareVersion(versionA, versionB) {
    const a = versionA.split('.');
    const b = versionB.split('.');
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
        const an = a[i] || 0;
        const bn = b[i] || 0;
        if (Number(an) < Number(bn)) {
            return -1;
        }
        if (Number(an) > Number(bn)) {
            return 1;
        }
    }
    return 0;
}
exports.compareVersion = compareVersion;
;
const _extendIndex = [
    1, 2, 3, 4, 5,
    7, 8, 9, 10, 11, 12, 13, 14, 15,
    17, 18, 19, 20, 21, 22, 23, 24,
    26, 27, 28, 29, 30
];
/**
 * 从一个名字转换成一个 id
 * 这是个有损压缩，并不能够还原成原来的名字
 * @param id
 * @param extend
 */
function nameToId(name, extend) {
    if (!extend) {
        extend = 0;
    }
    const md5 = (0, crypto_1.createHash)('md5').update(name).digest('hex');
    let id = md5[0] + md5[6] + md5[16] + md5[25] + md5[31];
    for (let i = 0; i < extend; i++) {
        id += md5[_extendIndex[i]];
    }
    return id;
}
exports.nameToId = nameToId;
