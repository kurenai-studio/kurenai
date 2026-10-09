'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFileNameConflict = void 0;
exports.getName = getName;
exports.trashItem = trashItem;
exports.requireFile = requireFile;
exports.removeCache = removeCache;
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
/**
 * 检查文件在指定文件夹中是否存在，如果存在则通过追加数字后缀的方式生成一个唯一的文件名。
 * @param targetFolder 目标文件夹的路径。
 * @param fileName 需要检查存在的文件名。
 * @param isOccupied 返回路径是否已被文件系统或调用方占用。
 * @returns 返回一个唯一的文件名字符串。
 */
const resolveFileNameConflict = (targetFolder, fileName, isOccupied = fs_1.existsSync) => {
    // 如果fileName为空，抛出错误
    if (!fileName)
        throw new Error(`fileName is empty`);
    // 获取文件扩展名
    const fileExt = (0, path_1.extname)(fileName);
    // 获取文件的基础名（不包括扩展名）
    let fileBase = (0, path_1.basename)(fileName, fileExt);
    // 循环检查直到找到一个不存在的文件名
    while (isOccupied((0, path_1.join)(targetFolder, `${fileBase}${fileExt}`))) {
        if ((/(\d+)$/.test(fileBase))) {
            fileBase = fileBase.replace(/^(.+?)(\d+)?$/, ($, $1, $2) => {
                let num;
                if (!$2) {
                    // 如果是纯数字的话 $2 是为 undefined，$1 自增就行
                    let num = parseInt($1, 10);
                    num += 1;
                    return num.toString();
                }
                num = parseInt($2, 10);
                num += 1;
                // 返回更新后的文件名
                return `${$1}${num.toString().padStart($2.length, '0')}`;
            });
        }
        else {
            // 如果原文件名不包含数字后缀，则添加-001作为后缀
            fileBase = `${fileBase}-001`;
        }
    }
    // 返回最终生成的唯一文件名
    return `${fileBase}${fileExt}`;
};
exports.resolveFileNameConflict = resolveFileNameConflict;
/**
 * 初始化一个可用的文件名
 * Initializes a available filename
 * 返回可用名称的文件路径
 * Returns the file path with the available name
 *
 * @param file 初始文件路径 Initial file path
 * @param isOccupied 返回路径是否已被文件系统或调用方占用。
 */
function getName(file, isOccupied = fs_1.existsSync) {
    if (!isOccupied(file)) {
        return file;
    }
    const dir = (0, path_1.dirname)(file);
    const fileName = (0, path_1.basename)(file);
    const newFileName = (0, exports.resolveFileNameConflict)(dir, fileName, isOccupied);
    return (0, path_1.join)(dir, newFileName);
}
async function trashItem(file) {
    // TODO
    // const trash = await import('sudo-trash');
    // return await trash.trash(file);
    await (0, fs_extra_1.remove)(file);
}
function requireFile(file, _options) {
    // TODO
    return require(file);
}
function removeCache(file) {
    delete require.cache[file];
    // TODD
}
