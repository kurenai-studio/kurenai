'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.fsCopy = exports.fsRename = exports.fsDelete = exports.fsCreateDirectory = exports.fsWriteFile = exports.fsReadFile = exports.fsStat = exports.fsExists = exports.resolveOperationContext = exports.takeOperationContext = exports.peekOperationContext = exports.resetOperationContexts = exports.resetFileSystemProvider = exports.setFileSystemProvider = exports.getFileSystemProvider = void 0;
const path_1 = require("path");
const local_provider_1 = require("./local-provider");
const localProvider = new local_provider_1.LocalAssetFileSystemProvider();
let provider = localProvider;
const operationContexts = new Map();
const OPERATION_CONTEXT_TTL = 30 * 1000;
function normalizeOperationPath(path) {
    return (0, path_1.normalize)(path);
}
function pruneOperationContexts(now = Date.now()) {
    for (const [path, context] of operationContexts) {
        if (now - context.timestamp > OPERATION_CONTEXT_TTL) {
            operationContexts.delete(path);
        }
    }
}
function rememberOperationContext(context) {
    if (!context) {
        return;
    }
    pruneOperationContexts(context.timestamp);
    for (const path of context.paths) {
        operationContexts.set(normalizeOperationPath(path), context);
    }
}
function createWatcherOperationContext(path, kind, source = path) {
    const timestamp = Date.now();
    return {
        opId: `asset-watcher-${timestamp}-${Math.random().toString(16).slice(2)}`,
        kind,
        origin: 'watcher',
        source,
        paths: [path],
        timestamp,
    };
}
function getFileSystemProvider() {
    return provider;
}
exports.getFileSystemProvider = getFileSystemProvider;
function setFileSystemProvider(nextProvider) {
    provider = nextProvider;
}
exports.setFileSystemProvider = setFileSystemProvider;
function resetFileSystemProvider() {
    provider = localProvider;
}
exports.resetFileSystemProvider = resetFileSystemProvider;
function resetOperationContexts() {
    operationContexts.clear();
}
exports.resetOperationContexts = resetOperationContexts;
function peekOperationContext(path) {
    pruneOperationContexts();
    return operationContexts.get(normalizeOperationPath(path));
}
exports.peekOperationContext = peekOperationContext;
function takeOperationContext(path) {
    pruneOperationContexts();
    const key = normalizeOperationPath(path);
    const context = operationContexts.get(key);
    operationContexts.delete(key);
    return context;
}
exports.takeOperationContext = takeOperationContext;
function resolveOperationContext(path, kind, source = path) {
    return takeOperationContext(path) || createWatcherOperationContext(path, kind, source);
}
exports.resolveOperationContext = resolveOperationContext;
function resolveProviderMethod(name) {
    const method = provider[name] || localProvider[name];
    if (!method) {
        throw new Error(`asset filesystem provider method "${String(name)}" is not implemented`);
    }
    return method;
}
function getMethodOwner(name) {
    return provider[name] ? provider : localProvider;
}
async function fsExists(path) {
    return await Promise.resolve(localProvider.exists(path));
}
exports.fsExists = fsExists;
async function fsStat(path) {
    return await Promise.resolve(localProvider.stat(path));
}
exports.fsStat = fsStat;
async function fsReadFile(path, encoding) {
    const readFile = resolveProviderMethod('readFile');
    return await Promise.resolve(readFile.call(getMethodOwner('readFile'), path, encoding));
}
exports.fsReadFile = fsReadFile;
async function fsWriteFile(path, content, options) {
    rememberOperationContext(options === null || options === void 0 ? void 0 : options.context);
    const writeFile = resolveProviderMethod('writeFile');
    await Promise.resolve(writeFile.call(getMethodOwner('writeFile'), path, content, options));
}
exports.fsWriteFile = fsWriteFile;
async function fsCreateDirectory(path) {
    const createDirectory = resolveProviderMethod('createDirectory');
    await Promise.resolve(createDirectory.call(getMethodOwner('createDirectory'), path));
}
exports.fsCreateDirectory = fsCreateDirectory;
async function fsDelete(path, options) {
    rememberOperationContext(options === null || options === void 0 ? void 0 : options.context);
    const deleteFile = resolveProviderMethod('delete');
    await Promise.resolve(deleteFile.call(getMethodOwner('delete'), path, options));
}
exports.fsDelete = fsDelete;
async function fsRename(oldPath, newPath, options) {
    rememberOperationContext(options === null || options === void 0 ? void 0 : options.context);
    const rename = resolveProviderMethod('rename');
    await Promise.resolve(rename.call(getMethodOwner('rename'), oldPath, newPath, options));
}
exports.fsRename = fsRename;
async function fsCopy(sourcePath, destinationPath, options) {
    rememberOperationContext(options === null || options === void 0 ? void 0 : options.context);
    const copy = resolveProviderMethod('copy');
    await Promise.resolve(copy.call(getMethodOwner('copy'), sourcePath, destinationPath, options));
}
exports.fsCopy = fsCopy;
