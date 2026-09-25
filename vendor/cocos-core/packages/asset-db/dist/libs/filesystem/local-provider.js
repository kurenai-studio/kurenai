'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAssetFileSystemProvider = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
class LocalAssetFileSystemProvider {
    exists(path) {
        return (0, fs_extra_1.existsSync)(path);
    }
    async stat(path) {
        return await (0, fs_extra_1.stat)(path);
    }
    async readFile(path, encoding) {
        if (encoding) {
            return await (0, fs_extra_1.readFile)(path, encoding);
        }
        return await (0, fs_extra_1.readFile)(path);
    }
    async writeFile(path, content, _options) {
        await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(path));
        await (0, fs_extra_1.outputFile)(path, content);
    }
    async createDirectory(path) {
        await (0, fs_extra_1.ensureDir)(path);
    }
    async delete(path, _options) {
        await (0, fs_extra_1.remove)(path);
    }
    async rename(oldPath, newPath, options) {
        await (0, fs_extra_1.move)(oldPath, newPath, { overwrite: !!(options === null || options === void 0 ? void 0 : options.overwrite) });
    }
    async copy(sourcePath, destinationPath, options) {
        if ((options === null || options === void 0 ? void 0 : options.overwrite) === undefined) {
            await (0, fs_extra_1.copy)(sourcePath, destinationPath);
            return;
        }
        await (0, fs_extra_1.copy)(sourcePath, destinationPath, { overwrite: options.overwrite });
    }
}
exports.LocalAssetFileSystemProvider = LocalAssetFileSystemProvider;
