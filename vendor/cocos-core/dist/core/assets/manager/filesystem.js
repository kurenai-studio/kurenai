'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSystemProvider = getFileSystemProvider;
exports.setFileSystemProvider = setFileSystemProvider;
exports.resetFileSystemProvider = resetFileSystemProvider;
exports.readPath = readPath;
exports.writePath = writePath;
exports.createDirectoryPath = createDirectoryPath;
exports.deletePath = deletePath;
exports.renamePath = renamePath;
exports.copyPath = copyPath;
exports.removeAssetSource = removeAssetSource;
exports.moveAssetSource = moveAssetSource;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const asset_config_1 = __importDefault(require("../asset-config"));
const utils_1 = __importDefault(require("../../base/utils"));
const localFileSystemProvider = {
    async readFile(path, encoding) {
        if (encoding) {
            return await (0, fs_extra_1.readFile)(path, encoding);
        }
        return await (0, fs_extra_1.readFile)(path);
    },
    async writeFile(path, content, _options) {
        await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(path));
        await (0, fs_extra_1.outputFile)(path, content);
    },
    async createDirectory(path) {
        await (0, fs_extra_1.ensureDir)(path);
    },
    async delete(path, options = {}) {
        if (options.useTrash !== false) {
            await utils_1.default.File.trashItem(path);
            return;
        }
        await (0, fs_extra_1.remove)(path);
    },
    async rename(oldPath, newPath, options) {
        await (0, fs_extra_1.move)(oldPath, newPath, { overwrite: !!options?.overwrite });
    },
    async copy(sourcePath, destinationPath, options) {
        if (options?.overwrite === undefined) {
            await (0, fs_extra_1.copy)(sourcePath, destinationPath);
            return;
        }
        await (0, fs_extra_1.copy)(sourcePath, destinationPath, { overwrite: options.overwrite });
    },
};
let provider = localFileSystemProvider;
function assignProviderMethod(targetProvider, key, method) {
    targetProvider[key] = method;
}
function mergeFileSystemProvider(nextProvider) {
    const mergedProvider = {
        ...localFileSystemProvider,
    };
    if (!nextProvider) {
        return mergedProvider;
    }
    for (const key of Object.keys(nextProvider)) {
        const method = nextProvider[key];
        if (method) {
            assignProviderMethod(mergedProvider, key, method);
        }
    }
    return mergedProvider;
}
function getFileSystemProvider() {
    return provider;
}
function setFileSystemProvider(nextProvider) {
    provider = mergeFileSystemProvider(nextProvider);
}
function resetFileSystemProvider() {
    provider = mergeFileSystemProvider();
}
async function readPath(path, encoding) {
    return await Promise.resolve(provider.readFile(path, encoding));
}
async function writePath(path, content, options) {
    await Promise.resolve(provider.writeFile(path, content, options));
}
async function createDirectoryPath(path) {
    await Promise.resolve(provider.createDirectory(path));
}
async function deletePath(path, options = {}) {
    await Promise.resolve(provider.delete(path, options));
}
async function renamePath(oldPath, newPath, options) {
    await Promise.resolve(provider.rename(oldPath, newPath, options));
}
async function copyPath(sourcePath, destinationPath, options) {
    await Promise.resolve(provider.copy(sourcePath, destinationPath, options));
}
async function removeAssetSource(file, options = {}) {
    if (!(0, fs_extra_1.existsSync)(file)) {
        return true;
    }
    const deleteOptions = {
        useTrash: options.useTrash !== false,
    };
    try {
        await deletePath(file, deleteOptions);
    }
    catch (error) {
        console.error(error);
        throw new Error(`asset db removeFile ${file} fail!`);
    }
    try {
        const metaFile = file + '.meta';
        if ((0, fs_extra_1.existsSync)(metaFile)) {
            await deletePath(metaFile, deleteOptions);
        }
    }
    catch (error) {
        // do nothing
    }
    return true;
}
async function moveAssetSource(source, target, options) {
    const moveOptions = options?.overwrite ? options : { overwrite: false };
    const renameOptions = { overwrite: !!moveOptions.overwrite };
    try {
        if (!utils_1.default.Path.contains(source, target)) {
            await renamePath(source + '.meta', target + '.meta', { overwrite: true });
            await renamePath(source, target, renameOptions);
            return;
        }
        const tempDir = (0, path_1.join)(asset_config_1.default.data.tempRoot, 'move-temp');
        const relativePath = (0, path_1.relative)(asset_config_1.default.data.root, target);
        const tempPath = (0, path_1.join)(tempDir, relativePath);
        const tempMetaPath = tempPath + '.meta';
        if ((0, fs_extra_1.existsSync)(tempPath)) {
            await deletePath(tempPath, { useTrash: false });
        }
        if ((0, fs_extra_1.existsSync)(tempMetaPath)) {
            await deletePath(tempMetaPath, { useTrash: false });
        }
        await renamePath(source + '.meta', tempMetaPath, { overwrite: true });
        await renamePath(source, tempPath, { overwrite: true });
        await renamePath(tempMetaPath, target + '.meta', { overwrite: true });
        await renamePath(tempPath, target, renameOptions);
    }
    catch (error) {
        console.error(`asset db moveFile from ${source} -> ${target} fail!`);
        console.error(error);
    }
}
