"use strict";
/**
 * 资源操作类，会调用 assetManager/assetDB/assetHandler 等模块
 */
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
exports.assetOperation = void 0;
exports.moveFile = moveFile;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const asset_config_1 = __importDefault(require("../asset-config"));
const utils_1 = require("../utils");
const asset_db_2 = __importDefault(require("./asset-db"));
const asset_handler_1 = __importDefault(require("./asset-handler"));
const asset_copy_1 = require("./asset-copy");
const filesystem_1 = require("./filesystem");
const i18n_1 = __importDefault(require("../../base/i18n"));
const query_1 = __importStar(require("./query"));
const utils_2 = __importDefault(require("../../base/utils"));
const events_1 = __importDefault(require("events"));
const utils_3 = require("../asset-handler/utils");
const lodash = __importStar(require("lodash"));
const REIMPORT_BUSY_TIMEOUT_MS = 10_000;
function waitForAssetInit(asset, timeoutMs, pathOrUrlOrUUID) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Reimport asset ${pathOrUrlOrUUID} timed out waiting for the current import to finish`));
        }, timeoutMs);
        asset.waitInit().then(() => {
            clearTimeout(timer);
            resolve();
        }, (error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}
function isScriptAsset(asset) {
    const importer = asset.meta?.importer;
    return importer === 'typescript'
        || importer === 'javascript'
        || /\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/i.test(asset.source || '');
}
function getSceneOrPrefabAssetKind(asset) {
    const importer = asset.meta?.importer;
    const source = asset.source || '';
    if (importer === 'scene' || /\.scene$/i.test(source)) {
        return 'scene';
    }
    if (importer === 'prefab' || /\.prefab$/i.test(source)) {
        return 'prefab';
    }
    return null;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function getTypeScriptSyntaxError(fileName, content) {
    let ts = null;
    try {
        ts = require('typescript');
    }
    catch {
        return null;
    }
    const result = ts.transpileModule(content, {
        fileName,
        reportDiagnostics: true,
        compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            experimentalDecorators: true,
        },
    });
    const diagnostic = result.diagnostics?.find((item) => item.category === ts.DiagnosticCategory.Error);
    if (!diagnostic) {
        return null;
    }
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (diagnostic.file && typeof diagnostic.start === 'number') {
        const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return `${message} (${position.line + 1}:${position.character + 1})`;
    }
    return message;
}
function getScriptStructureError(content) {
    const stack = [];
    let line = 1;
    let column = 0;
    let state = 'normal';
    let escaped = false;
    const opening = new Set(['(', '[', '{']);
    const closing = {
        ')': '(',
        ']': '[',
        '}': '{',
    };
    for (let index = 0; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];
        column++;
        if (state === 'lineComment') {
            if (char === '\n') {
                state = 'normal';
            }
        }
        else if (state === 'blockComment') {
            if (char === '*' && next === '/') {
                state = 'normal';
                index++;
                column++;
            }
        }
        else if (state === 'singleQuote' || state === 'doubleQuote' || state === 'template') {
            const quote = state === 'singleQuote' ? '\'' : state === 'doubleQuote' ? '"' : '`';
            if (escaped) {
                escaped = false;
            }
            else if (char === '\\') {
                escaped = true;
            }
            else if (char === quote) {
                state = 'normal';
            }
        }
        else {
            if (char === '/' && next === '/') {
                state = 'lineComment';
                index++;
                column++;
            }
            else if (char === '/' && next === '*') {
                state = 'blockComment';
                index++;
                column++;
            }
            else if (char === '\'') {
                state = 'singleQuote';
            }
            else if (char === '"') {
                state = 'doubleQuote';
            }
            else if (char === '`') {
                state = 'template';
            }
            else if (opening.has(char)) {
                stack.push({ char, line, column });
            }
            else if (closing[char]) {
                const last = stack.pop();
                if (!last || last.char !== closing[char]) {
                    return `unexpected "${char}" at ${line}:${column}`;
                }
            }
        }
        if (char === '\n') {
            line++;
            column = 0;
            if (state === 'lineComment') {
                state = 'normal';
            }
        }
    }
    if (state === 'singleQuote' || state === 'doubleQuote' || state === 'template') {
        return `unterminated ${state === 'template' ? 'template string' : 'string literal'}`;
    }
    if (state === 'blockComment') {
        return 'unterminated block comment';
    }
    const last = stack.pop();
    if (last) {
        return `unclosed "${last.char}" at ${last.line}:${last.column}`;
    }
    return null;
}
function getSceneOrPrefabJsonError(asset, content) {
    const kind = getSceneOrPrefabAssetKind(asset);
    if (!kind) {
        return null;
    }
    const text = typeof content === 'string'
        ? content
        : Buffer.isBuffer(content)
            ? content.toString('utf8')
            : null;
    if (text === null) {
        return 'content must be JSON text';
    }
    let data;
    try {
        data = JSON.parse(text);
    }
    catch (error) {
        return `invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
    if (!Array.isArray(data)) {
        return `expected ${kind} JSON array`;
    }
    if (data.length < 2) {
        return `expected ${kind} JSON array with asset and root entries`;
    }
    const assetEntry = data[0];
    const rootEntry = data[1];
    if (!isRecord(assetEntry) || !isRecord(rootEntry)) {
        return `expected ${kind} asset and root entries to be objects`;
    }
    if (kind === 'scene') {
        if (assetEntry.__type__ !== 'cc.SceneAsset') {
            return 'expected first entry __type__ to be cc.SceneAsset';
        }
        if (rootEntry.__type__ !== 'cc.Scene') {
            return 'expected second entry __type__ to be cc.Scene';
        }
        return null;
    }
    if (assetEntry.__type__ !== 'cc.Prefab') {
        return 'expected first entry __type__ to be cc.Prefab';
    }
    if (rootEntry.__type__ !== 'cc.Node') {
        return 'expected second entry __type__ to be cc.Node';
    }
    return null;
}
class AssetOperation extends events_1.default {
    _importTaskByTargetPath = new Map();
    _reservedImportTargetPaths = new Map();
    /**
     * 检查一个资源文件夹是否为只读
     */
    _checkReadonly(asset) {
        if (asset._assetDB.options.readonly) {
            throw new Error(`${i18n_1.default.t('assets.operation.readonly')} \n  url: ${asset.url}`);
        }
    }
    _checkExists(path) {
        if (!(0, fs_extra_1.existsSync)(path)) {
            throw new Error(`file ${path} not exists`);
        }
    }
    /**
     * 检查是否存在文件，如果存在则根据选项决定是否覆盖或重命名
     * @param path
     * @param option
     * @returns 返回新的文件路径
     */
    _checkOverwrite(path, option, isOccupied = fs_extra_1.existsSync) {
        if (isOccupied(path) && !option?.overwrite) {
            if (option?.rename) {
                return utils_2.default.File.getName(path, isOccupied);
            }
            throw new Error(`file ${path} already exists, please use overwrite option to overwrite it or use rename option to auto rename it first.`);
        }
        return path;
    }
    _checkRenameNewName(asset, newName) {
        if (!newName || newName === '.' || newName === '..') {
            throw new Error('newName must be a single file or directory name');
        }
        if (newName.startsWith('db://')
            || (0, path_1.isAbsolute)(newName)
            || /[\\/]/.test(newName)) {
            throw new Error('newName must be a single file or directory name');
        }
        if (!asset.isDirectory() && !(0, path_1.extname)(newName)) {
            throw new Error('newName must include file extension');
        }
    }
    async saveAssetMeta(uuid, meta, asset) {
        // 不能为数组
        if (typeof meta !== 'object'
            || Array.isArray(meta)) {
            throw new Error(`Save meta failed(${uuid}): The meta must be an Object string`);
        }
        asset = asset || query_1.default.queryAsset(uuid);
        (0, utils_3.mergeMeta)(asset.meta, meta);
        await asset.save(); // 这里才是将数据保存到 .meta 文件
        await asset._assetDB.reimport(asset.uuid);
    }
    async updateUserData(uuidOrURLOrPath, userData) {
        if (!isRecord(userData)) {
            throw new Error('userData must be an object');
        }
        const asset = query_1.default.queryAsset(uuidOrURLOrPath);
        if (!asset) {
            console.error(`can not find asset ${uuidOrURLOrPath}`);
            return;
        }
        if (!isRecord(asset.meta.userData)) {
            asset.meta.userData = {};
        }
        const currentUserData = asset.meta.userData;
        for (const key of Object.keys(currentUserData)) {
            delete currentUserData[key];
        }
        Object.assign(currentUserData, lodash.cloneDeep(userData));
        asset.meta.userData = currentUserData;
        await asset.save();
        await asset._assetDB.reimport(asset.uuid);
        return asset?.meta.userData;
    }
    async updateUserDataByPath(uuidOrURLOrPath, path, value) {
        if (!path) {
            throw new Error('path must not be empty. Use updateUserData to replace the complete userData object');
        }
        const asset = query_1.default.queryAsset(uuidOrURLOrPath);
        if (!asset) {
            console.error(`can not find asset ${uuidOrURLOrPath}`);
            return;
        }
        if (!isRecord(asset.meta.userData)) {
            asset.meta.userData = {};
        }
        lodash.set(asset?.meta.userData, path, value);
        await asset.save();
        await asset._assetDB.reimport(asset.uuid);
        return asset?.meta.userData;
    }
    async saveAsset(uuidOrURLOrPath, content) {
        const asset = query_1.default.queryAsset(uuidOrURLOrPath);
        if (!asset) {
            throw new Error(`${i18n_1.default.t('assets.save_asset.fail.asset', { asset: uuidOrURLOrPath })}`);
        }
        if (asset._assetDB.options.readonly) {
            throw new Error(`${i18n_1.default.t('assets.operation.readonly')} \n  url: ${asset.url}`);
        }
        if (content === undefined) {
            throw new Error(`${i18n_1.default.t('assets.save_asset.fail.content')}`);
        }
        if (!asset.source) {
            // 不存在源文件的资源无法保存
            throw new Error(`${i18n_1.default.t('assets.save_asset.fail.uuid')}`);
        }
        this._validateAssetContentBeforeSave(asset, content);
        const res = await asset_handler_1.default.saveAsset(asset, content);
        if (res) {
            await asset._assetDB.reimport(asset.uuid);
        }
        if (asset && (!asset.imported || asset.invalid)) {
            throw asset.importError || new Error(`Save asset ${asset.source} failed`);
        }
        return query_1.default.encodeAsset(asset);
    }
    _validateAssetContentBeforeSave(asset, content) {
        this._validateScriptContentBeforeSave(asset, content);
        this._validateSceneOrPrefabContentBeforeSave(asset, content);
    }
    _validateScriptContentBeforeSave(asset, content) {
        if (!isScriptAsset(asset) || typeof content !== 'string') {
            return;
        }
        const structureError = getScriptStructureError(content);
        const syntaxError = getTypeScriptSyntaxError(asset.source, content);
        const error = syntaxError || structureError;
        if (error) {
            throw new Error(`Invalid script content: ${error}`);
        }
    }
    _validateSceneOrPrefabContentBeforeSave(asset, content) {
        const error = getSceneOrPrefabJsonError(asset, content);
        if (error) {
            throw new Error(`Invalid scene/prefab asset content: ${error}`);
        }
    }
    checkValidUrl(urlOrPath) {
        if (!urlOrPath.startsWith('db://')) {
            urlOrPath = query_1.default.queryUrl(urlOrPath);
            if (!urlOrPath) {
                throw new Error(`${i18n_1.default.t('assets.operation.invalid_url')} \n  url: ${urlOrPath}`);
            }
        }
        const dbName = urlOrPath.split('/').filter(Boolean)[1];
        const dbInfo = asset_db_2.default.assetDBInfo[dbName];
        if (!dbInfo || dbInfo.readonly) {
            throw new Error(`${i18n_1.default.t('assets.operation.readonly')} \n  url: ${urlOrPath}`);
        }
        return true;
    }
    async createAsset(options) {
        if (!options.target || typeof options.target !== 'string') {
            throw new Error(`Cannot create asset because options.target is required.`);
        }
        // 判断目标路径是否为只读
        this.checkValidUrl(options.target);
        if (!(0, path_1.isAbsolute)(options.target)) {
            options.target = (0, utils_1.url2path)(options.target);
        }
        options.target = this._checkOverwrite(options.target, options);
        const assetPath = await asset_handler_1.default.createAsset(options);
        await this.refreshAsset(assetPath);
        const asset = query_1.default.queryAsset(assetPath);
        if (!asset) {
            throw new Error(`Create asset in ${options.target} failed`);
        }
        if (asset && (!asset.imported || asset.invalid)) {
            throw asset.importError || new Error(`Create asset in ${options.target} failed`);
        }
        return query_1.default.encodeAsset(asset);
    }
    /**
     * 根据类型创建资源
     * @param type
     * @param dirOrUrl 目标目录
     * @param baseName 基础名称
     * @param options
     * @returns
     */
    async createAssetByType(type, dirOrUrl, baseName, options) {
        const createMenus = await asset_handler_1.default.getCreateMenuByName(type);
        if (!createMenus.length) {
            throw new Error(`Can not support create type: ${type}`);
        }
        const dir = this._resolveCreateAssetDir(dirOrUrl);
        let createInfo = createMenus[0];
        if (createMenus.length > 1 && options?.templateName) {
            createInfo = createMenus.find((menu) => menu.name === options.templateName);
            if (!createInfo) {
                throw new Error(`Can not find template: ${options.templateName}`);
            }
        }
        const extName = (0, path_1.extname)(createInfo.fullFileName);
        const fileName = extName && baseName.endsWith(extName) ? baseName : baseName + extName;
        const target = (0, path_1.join)(dir, fileName);
        return await this.createAsset({
            handler: createInfo.handler,
            target,
            overwrite: options?.overwrite ?? false,
            rename: options?.rename ?? false,
            template: createInfo.template,
            content: options?.content,
        });
    }
    _resolveCreateAssetDir(dirOrUrl) {
        const normalizedDirOrUrl = this._pathToDbUrlIfInsideAssetDB(dirOrUrl);
        if (normalizedDirOrUrl.startsWith('db://')) {
            return (0, utils_1.url2path)(normalizedDirOrUrl);
        }
        return normalizedDirOrUrl;
    }
    /**
     * 从项目外拷贝导入资源进来
     * @param source
     * @param target
     * @param options
     */
    async importAsset(source, target, options) {
        const targetUrl = this._pathToDbUrlIfInsideAssetDB(target);
        const targetPath = targetUrl.startsWith('db://') ? (0, utils_1.url2path)(targetUrl) : target;
        return this._queueImportByTargetPath(targetPath, () => this._importAsset(source, targetPath, options));
    }
    async _importAsset(source, targetPath, options) {
        const isSamePath = this._isSameFilesystemPath(source, targetPath);
        if (!isSamePath) {
            const reservation = this._reserveImportTargetPath(targetPath, options);
            targetPath = reservation.targetPath;
            try {
                const copyOptions = options?.overwrite === undefined ? undefined : { overwrite: options.overwrite };
                await (0, filesystem_1.copyPath)(source, targetPath, copyOptions);
            }
            finally {
                reservation.release();
            }
        }
        const assetTarget = this._pathToDbUrlIfInsideAssetDB(targetPath);
        await this.refreshAsset(assetTarget);
        const assetInfo = query_1.default.queryAssetInfo(assetTarget);
        if (!assetInfo) {
            return [];
        }
        if (!assetInfo.isDirectory) {
            return [assetInfo];
        }
        return query_1.default.queryAssetInfos({
            pattern: `${assetInfo.url}/**/*`
        });
    }
    _queueImportByTargetPath(targetPath, task) {
        const targetKey = this._getImportTargetKey(targetPath);
        const previousTask = this._importTaskByTargetPath.get(targetKey) ?? Promise.resolve();
        const taskResult = previousTask.then(task);
        const taskTail = taskResult.then(() => undefined, () => undefined); // never reject
        this._importTaskByTargetPath.set(targetKey, taskTail);
        return taskResult.finally(() => {
            if (this._importTaskByTargetPath.get(targetKey) === taskTail) {
                this._importTaskByTargetPath.delete(targetKey);
            }
        });
    }
    _isPathOccupied = (path) => {
        return (0, fs_extra_1.existsSync)(path) || this._reservedImportTargetPaths.has(this._getImportTargetKey(path));
    };
    _reserveImportTargetPath(targetPath, options) {
        const resolvedTargetPath = this._checkOverwrite(targetPath, options, this._isPathOccupied);
        const targetKey = this._getImportTargetKey(resolvedTargetPath);
        this._reservedImportTargetPaths.set(targetKey, (this._reservedImportTargetPaths.get(targetKey) ?? 0) + 1);
        return {
            targetPath: resolvedTargetPath,
            release: () => {
                const reservationCount = this._reservedImportTargetPaths.get(targetKey);
                if (reservationCount === undefined || reservationCount <= 1) {
                    this._reservedImportTargetPaths.delete(targetKey);
                }
                else {
                    this._reservedImportTargetPaths.set(targetKey, reservationCount - 1);
                }
            },
        };
    }
    _getImportTargetKey(targetPath) {
        let targetKey = utils_2.default.Path.normalize(targetPath);
        if (process.platform === 'win32') {
            targetKey = targetKey.toLowerCase();
        }
        return targetKey;
    }
    /**
     * Copy an existing main asset together with its complete meta information.
     */
    async copyAsset(source, target, options) {
        return await asset_db_2.default.addTask(this._copyAsset.bind(this), [source, target, options]);
    }
    async _copyAsset(source, target, options) {
        const asset = query_1.default.queryAsset(source);
        if (!asset) {
            throw new Error(`asset in source file ${source} not exists`);
        }
        if (asset._parent) {
            throw new Error('Sub-assets cannot be copied independently; copy their main asset instead.');
        }
        this.checkValidUrl(target);
        source = asset.source;
        this._checkExists(source);
        if (target.startsWith('db://')) {
            target = (0, utils_1.url2path)(target);
        }
        target = this._checkOverwrite(target, options);
        const targetIsAssetDBRoot = Object.values(asset_db_2.default.assetDBInfo).some((info) => (utils_2.default.Path.contains(info.target, target) && utils_2.default.Path.contains(target, info.target)));
        if (targetIsAssetDBRoot) {
            throw new Error(`Cannot copy an asset over an AssetDB root.\ntarget: ${target}`);
        }
        if (utils_2.default.Path.contains(source, target) || utils_2.default.Path.contains(target, source)) {
            throw new Error(`Cannot copy an asset into or over itself.\nsource: ${source}\ntarget: ${target}`);
        }
        const transaction = await (0, asset_copy_1.copyAssetSource)(source, target, options);
        let copiedAsset = null;
        try {
            await this._refreshAsset(target);
            copiedAsset = query_1.default.queryAsset(target);
            if (!copiedAsset || !copiedAsset.imported || copiedAsset.invalid) {
                throw copiedAsset?.importError || new Error(`Copy asset from ${source} to ${target} failed`);
            }
        }
        catch (error) {
            try {
                await transaction.rollback();
                await this._refreshAsset((0, path_1.dirname)(target), false);
            }
            catch (rollbackError) {
                const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
                throw new Error(`Copy asset from ${source} to ${target} failed and rollback also failed: ${rollbackMessage}`, { cause: error });
            }
            throw error;
        }
        await transaction.finalize();
        return query_1.default.encodeAsset(copiedAsset);
    }
    /**
     * 生成导出数据接口，主要用于：预览、构建阶段
     * @param asset
     * @param options
     * @returns
     */
    async generateExportData(asset, options) {
        // 3.8.3 以上版本，资源导入后的数据将会记录在 asset.outputData 字段内部
        let outputData = asset.getData('output');
        if (outputData && !options) {
            return outputData;
        }
        // 1.优先调用资源处理器内的导出逻辑
        // 需要注意，由于有类似的用法，因而 assetManager 只能在构建阶段使用，无法在给资源处理器内调用
        const data = await asset_handler_1.default.generateExportData(asset, options);
        if (data) {
            return data;
        }
        // 2. 默认的导出流程
        // 2.1 无序列化数据的，视为引擎运行时无法支持的资源，不导出
        if (!asset.meta.files.includes('.json') && !asset.meta.files.includes('.cconb')) {
            return null;
        }
        outputData = (0, utils_1.ensureOutputData)(asset);
        // 2.2 无具体的导出选项或者导出信息内不包含序列化数据，则使用默认的导出信息即可
        if (!options || !outputData.native) {
            return outputData;
        }
        // 2.3 TODO 根据不同的 options 条件生成不同的序列化结果
        // const cachePath = assetOutputPathCache.query(asset.uuid, options);
        // if (!cachePath) {
        //     const assetData = await serializeCompiled(asset, options);
        //     await outputFile(outputData.import.path, assetData);
        //     await assetOutputPathCache.add(asset, options, outputData.import.path);
        // } else {
        //     outputData.import.path = cachePath;
        // }
        // asset.setData('output', outputData);
        return outputData;
    }
    /**
     * 拷贝生成导入文件到最终目标地址，主要用于：构建阶段
     * @param handler
     * @param src
     * @param dest
     * @returns
     */
    async outputExportData(handler, src, dest) {
        const res = await asset_handler_1.default.outputExportData(handler, src, dest);
        if (!res) {
            await (0, fs_extra_1.copy)(src.import.path, dest.import.path);
            if (src.native && dest.native) {
                const nativeSrc = Object.values(src.native);
                const nativeDest = Object.values(dest.native);
                await Promise.all(nativeSrc.map((path, i) => (0, fs_extra_1.copy)(path, nativeDest[i])));
            }
        }
    }
    /**
     * 刷新某个资源或是资源目录
     * @param pathOrUrlOrUUID
     * @returns boolean
     */
    async refreshAsset(pathOrUrlOrUUID) {
        // 将实际的刷新任务塞到 db 管理器的队列内等待执行
        return await asset_db_2.default.addTask(this._refreshAsset.bind(this), [pathOrUrlOrUUID]);
    }
    async _refreshAsset(pathOrUrlOrUUID, autoRefreshDir = true) {
        const refreshTarget = this._pathToDbUrlIfInsideAssetDB(pathOrUrlOrUUID);
        const refreshDir = this._dirnameForRefresh(refreshTarget);
        const result = await (0, asset_db_1.refresh)(refreshTarget);
        if (result === undefined) {
            throw new Error(`can not find asset ${pathOrUrlOrUUID}`);
        }
        if (autoRefreshDir) {
            // HACK 某些情况下导入原始资源后，文件夹的 mtime 会发生变化，导致资源量大的情况下下次获得焦点自动刷新时会有第二次的文件夹大批量刷新
            // 用进入队列的方式才能保障 pause 等机制不会被影响
            await asset_db_2.default.addTask(asset_db_2.default.autoRefreshAssetLazy.bind(asset_db_2.default), [refreshDir]);
        }
        // this.autoRefreshAssetLazy(dirname(pathOrUrlOrUUID));
        console.debug(`refresh asset ${refreshDir} success`);
        return result;
    }
    _pathToDbUrlIfInsideAssetDB(pathOrUrlOrUUID) {
        return (0, utils_1.pathToDbUrlIfAssetDBPath)(pathOrUrlOrUUID, asset_db_2.default.assetDBInfo);
    }
    _isSameFilesystemPath(source, target) {
        if (!(0, path_1.isAbsolute)(source) || !(0, path_1.isAbsolute)(target)) {
            return source === target;
        }
        let normalizedSource = utils_2.default.Path.normalize(source);
        let normalizedTarget = utils_2.default.Path.normalize(target);
        if (process.platform === 'win32') {
            normalizedSource = normalizedSource.toLowerCase();
            normalizedTarget = normalizedTarget.toLowerCase();
        }
        return normalizedSource === normalizedTarget;
    }
    _dirnameForRefresh(pathOrUrlOrUUID) {
        return (0, utils_1.dirnameForDbUrlOrPath)(pathOrUrlOrUUID);
    }
    /**
     * 重新导入某个资源
     * @param pathOrUrlOrUUID
     * @returns
     */
    async reimportAsset(pathOrUrlOrUUID) {
        return await asset_db_2.default.addTask(this._reimportAsset.bind(this), [pathOrUrlOrUUID]);
    }
    async _reimportAsset(pathOrUrlOrUUID) {
        // 底层的 reimport 不支持子资源的 url 改为使用 uuid 重新导入
        if (pathOrUrlOrUUID.startsWith('db://')) {
            pathOrUrlOrUUID = (0, utils_1.url2uuid)(pathOrUrlOrUUID);
        }
        let asset = await (0, asset_db_1.reimport)(pathOrUrlOrUUID);
        let busyDeadline = 0;
        while (!asset) {
            const existingAsset = query_1.default.queryAsset(pathOrUrlOrUUID);
            if (!existingAsset) {
                throw new Error(`无法找到资源 ${pathOrUrlOrUUID}, 请检查参数是否正确`);
            }
            busyDeadline ||= Date.now() + REIMPORT_BUSY_TIMEOUT_MS;
            const remainingTime = busyDeadline - Date.now();
            if (remainingTime <= 0) {
                throw new Error(`Reimport asset ${pathOrUrlOrUUID} timed out waiting for the current import to finish`);
            }
            if (!existingAsset.init) {
                await waitForAssetInit(existingAsset, remainingTime, pathOrUrlOrUUID);
            }
            if (Date.now() >= busyDeadline) {
                throw new Error(`Reimport asset ${pathOrUrlOrUUID} timed out waiting for the current import to finish`);
            }
            asset = await (0, asset_db_1.reimport)(pathOrUrlOrUUID);
        }
        if (!asset.imported || asset.invalid) {
            throw asset.importError || new Error(`Reimport asset ${asset.source} failed`);
        }
        return query_1.default.encodeAsset(asset, query_1.ASSET_TREE_INFO_DATA_KEYS);
    }
    /**
     * 移动资源
     * @param source 源文件的 url 或者绝对路径 db://assets/abc.txt
     * @param target 目标 url 或者绝对路径 db://assets/a.txt
     * @param option 导入资源的参数 { overwrite, xxx, rename }
     * @returns {Promise<IAssetInfo | null>}
     */
    async moveAsset(source, target, option) {
        return await asset_db_2.default.addTask(this._moveAsset.bind(this), [source, target, option]);
    }
    async _moveAsset(source, target, option) {
        console.debug(`start move asset from ${source} -> ${target}...`);
        if (target.startsWith('db://')) {
            target = (0, utils_1.url2path)(target);
        }
        const asset = query_1.default.queryAsset(source);
        if (!asset) {
            throw new Error(`asset in source file ${source} not exists`);
        }
        this._checkReadonly(asset);
        source = asset.source;
        target = this._checkOverwrite(target, option);
        await (0, filesystem_1.moveAssetSource)(source, target, option);
        const url = (0, asset_db_1.queryUrl)(target);
        const reg = /db:\/\/[^/]+/.exec(url);
        // 常规的资源移动：期望只有 change 消息
        if (reg && reg[0] && url.startsWith(reg[0])) {
            await this.refreshAsset(target);
            // 因为文件被移走之后，文件夹的 mtime 会变化，所以要主动刷新一次被移走文件的文件夹
            // 必须在目标位置文件刷新完成后再刷新，如果放到前面，会导致先识别到文件被删除，触发 delete 后再发送 add
            await this.refreshAsset((0, path_1.dirname)(source));
        }
        else {
            // 跨数据库移动资源或者覆盖操作时需要先刷目标文件，触发 delete 后再发送 add
            await this.refreshAsset(source);
            await this.refreshAsset(target);
        }
        console.debug(`move asset from ${source} -> ${target} success`);
    }
    /**
     * 重命名某个资源
     * @param source
     * @param newName
     */
    async renameAsset(source, newName, option) {
        return await asset_db_2.default.addTask(this._renameAsset.bind(this), [source, newName, option]);
    }
    async _renameAsset(source, newName, option) {
        console.debug(`start rename asset from ${source} -> ${newName}...`);
        const asset = query_1.default.queryAsset(source);
        if (!asset) {
            throw new Error(`asset in source file ${source} not exists`);
        }
        this._checkReadonly(asset);
        source = asset.source;
        this._checkExists(source);
        this._checkRenameNewName(asset, newName);
        let target = (0, path_1.join)((0, path_1.dirname)(source), newName);
        target = this._checkOverwrite(target, option);
        // 源地址不能被目标地址包含，也不能相等
        if (target.startsWith((0, path_1.join)(source, '/'))) {
            throw new Error(`${i18n_1.default.t('assets.rename_asset.fail.parent')} \nsource: ${source}\ntarget: ${target}`);
        }
        const temp = (0, path_1.join)((0, path_1.dirname)(target), '.rename_temp');
        // 改到临时路径，然后刷新，删除原来的缓存
        await (0, filesystem_1.renamePath)(source + '.meta', temp + '.meta');
        await (0, filesystem_1.renamePath)(source, temp);
        await this._refreshAsset(source, false);
        // 改为真正的路径，然后刷新，用新名字重新导入
        await (0, filesystem_1.renamePath)(temp + '.meta', target + '.meta');
        await (0, filesystem_1.renamePath)(temp, target);
        await this._refreshAsset(target);
        // TODO 返回资源信息
        console.debug(`rename asset from ${source} -> ${target} success`);
    }
    /**
     * 移除资源
     * @param path
     * @returns
     */
    async removeAsset(uuidOrURLOrPath, options = { useTrash: true }) {
        const asset = query_1.default.queryAsset(uuidOrURLOrPath);
        if (!asset) {
            throw new Error(`${i18n_1.default.t('assets.delete_asset.fail.unexist')} \nsource: ${uuidOrURLOrPath}`);
        }
        this._checkReadonly(asset);
        if (asset._parent) {
            throw new Error(`子资源无法单独删除，请传递父资源的 URL 地址`);
        }
        const path = asset.source;
        const res = await asset_db_2.default.addTask(this._removeAsset.bind(this), [path, options]);
        return res ? query_1.default.encodeAsset(asset) : null;
    }
    async _removeAsset(path, options = { useTrash: true }) {
        let res = false;
        await (0, filesystem_1.removeAssetSource)(path, { useTrash: options.useTrash !== false });
        await this.refreshAsset(path);
        res = true;
        console.debug(`remove asset ${path} success`);
        return res;
    }
}
exports.assetOperation = new AssetOperation();
exports.default = exports.assetOperation;
/**
 * 移动文件
 * @param file
 */
async function moveFile(source, target, options) {
    if (!options || !options.overwrite) {
        options = { overwrite: false }; // fs move 要求实参 options 要有值
    }
    const tempDir = (0, path_1.join)(asset_config_1.default.data.tempRoot, 'move-temp');
    const relativePath = (0, path_1.relative)(asset_config_1.default.data.root, target);
    try {
        if (!utils_2.default.Path.contains(source, target)) {
            await (0, fs_extra_1.move)(source + '.meta', target + '.meta', { overwrite: true }); // meta 先移动
            await (0, fs_extra_1.move)(source, target, options);
            return;
        }
        // assets/scripts/scripts -> assets/scripts 直接操作会报错，需要分次执行
        // 清空临时目录
        await (0, fs_extra_1.remove)((0, path_1.join)(tempDir, relativePath));
        await (0, fs_extra_1.remove)((0, path_1.join)(tempDir, relativePath) + '.meta');
        // 先移动到临时目录
        await (0, fs_extra_1.move)(source + '.meta', (0, path_1.join)(tempDir, relativePath) + '.meta', { overwrite: true }); // meta 先移动
        await (0, fs_extra_1.move)(source, (0, path_1.join)(tempDir, relativePath), { overwrite: true });
        // 再移动到目标目录
        await (0, fs_extra_1.move)((0, path_1.join)(tempDir, relativePath) + '.meta', target + '.meta', { overwrite: true }); // meta 先移动
        await (0, fs_extra_1.move)((0, path_1.join)(tempDir, relativePath), target, options);
    }
    catch (error) {
        console.error(`asset db moveFile from ${source} -> ${target} fail!`);
        console.error(error);
    }
}
