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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL21hbmFnZXIvb3BlcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeTNCSCw0QkE2QkM7QUFwNUJELDhDQUFxRTtBQUNyRSx1Q0FBb0U7QUFDcEUsK0JBQW9FO0FBSXBFLG1FQUEwQztBQUMxQyxvQ0FBaUg7QUFDakgsMERBQXdDO0FBQ3hDLG9FQUFrRDtBQUNsRCw2Q0FBK0M7QUFDL0MsNkNBQXdGO0FBQ3hGLDJEQUFtQztBQUNuQyxpREFBZ0U7QUFDaEUsNkRBQXFDO0FBQ3JDLG9EQUFrQztBQUNsQyxrREFBbUQ7QUFDbkQsK0NBQWlDO0FBRWpDLE1BQU0sd0JBQXdCLEdBQUcsTUFBTSxDQUFDO0FBRXhDLFNBQVMsZ0JBQWdCLENBQUMsS0FBYSxFQUFFLFNBQWlCLEVBQUUsZUFBdUI7SUFDL0UsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsZUFBZSxxREFBcUQsQ0FBQyxDQUFDLENBQUM7UUFDOUcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRWQsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDdkIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDVCxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FB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YWdlci9hc3NldERCL2Fzc2V0SGFuZGxlciDnrYnmqKHlnZdcbiAqL1xuXG5pbXBvcnQgeyByZWZyZXNoLCByZWltcG9ydCwgcXVlcnlVcmwsIEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IGNvcHkgYXMgZnNDb3B5LCBtb3ZlLCByZW1vdmUsIGV4aXN0c1N5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBpc0Fic29sdXRlLCBkaXJuYW1lLCBqb2luLCByZWxhdGl2ZSwgZXh0bmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSU1vdmVPcHRpb25zIH0gZnJvbSAnLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0IHsgSUFzc2V0LCBDcmVhdGVBc3NldE9wdGlvbnMsIElFeHBvcnRPcHRpb25zLCBJRXhwb3J0RGF0YSwgQ3JlYXRlQXNzZXRCeVR5cGVPcHRpb25zLCBJQ3JlYXRlTWVudUluZm8gfSBmcm9tICcuLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEFzc2V0T3BlcmF0aW9uT3B0aW9uLCBBc3NldFVzZXJEYXRhTWFwLCBEZWxldGVBc3NldE9wdGlvbnMsIElBc3NldEluZm8sIElBc3NldE1ldGEsIElTdXBwb3J0Q3JlYXRlVHlwZSB9IGZyb20gJy4uL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4uL2Fzc2V0LWNvbmZpZyc7XG5pbXBvcnQgeyB1cmwycGF0aCwgZW5zdXJlT3V0cHV0RGF0YSwgdXJsMnV1aWQsIHBhdGhUb0RiVXJsSWZBc3NldERCUGF0aCwgZGlybmFtZUZvckRiVXJsT3JQYXRoIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2V0REJNYW5hZ2VyIGZyb20gJy4vYXNzZXQtZGInO1xuaW1wb3J0IGFzc2V0SGFuZGxlck1hbmFnZXIgZnJvbSAnLi9hc3NldC1oYW5kbGVyJztcbmltcG9ydCB7IGNvcHlBc3NldFNvdXJjZSB9IGZyb20gJy4vYXNzZXQtY29weSc7XG5pbXBvcnQgeyBjb3B5UGF0aCwgbW92ZUFzc2V0U291cmNlLCByZW1vdmVBc3NldFNvdXJjZSwgcmVuYW1lUGF0aCB9IGZyb20gJy4vZmlsZXN5c3RlbSc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IGFzc2V0UXVlcnksIHsgQVNTRVRfVFJFRV9JTkZPX0RBVEFfS0VZUyB9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgbWVyZ2VNZXRhIH0gZnJvbSAnLi4vYXNzZXQtaGFuZGxlci91dGlscyc7XG5pbXBvcnQgKiBhcyBsb2Rhc2ggZnJvbSAnbG9kYXNoJztcblxuY29uc3QgUkVJTVBPUlRfQlVTWV9USU1FT1VUX01TID0gMTBfMDAwO1xuXG5mdW5jdGlvbiB3YWl0Rm9yQXNzZXRJbml0KGFzc2V0OiBJQXNzZXQsIHRpbWVvdXRNczogbnVtYmVyLCBwYXRoT3JVcmxPclVVSUQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBSZWltcG9ydCBhc3NldCAke3BhdGhPclVybE9yVVVJRH0gdGltZWQgb3V0IHdhaXRpbmcgZm9yIHRoZSBjdXJyZW50IGltcG9ydCB0byBmaW5pc2hgKSk7XG4gICAgICAgIH0sIHRpbWVvdXRNcyk7XG5cbiAgICAgICAgYXNzZXQud2FpdEluaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpc1NjcmlwdEFzc2V0KGFzc2V0OiBJQXNzZXQpIHtcbiAgICBjb25zdCBpbXBvcnRlciA9IGFzc2V0Lm1ldGE/LmltcG9ydGVyO1xuICAgIHJldHVybiBpbXBvcnRlciA9PT0gJ3R5cGVzY3JpcHQnXG4gICAgICAgIHx8IGltcG9ydGVyID09PSAnamF2YXNjcmlwdCdcbiAgICAgICAgfHwgL1xcLig/OltjbV0/anN8W2NtXT90c3xqc3h8dHN4KSQvaS50ZXN0KGFzc2V0LnNvdXJjZSB8fCAnJyk7XG59XG5cbmZ1bmN0aW9uIGdldFNjZW5lT3JQcmVmYWJBc3NldEtpbmQoYXNzZXQ6IElBc3NldCk6ICdzY2VuZScgfCAncHJlZmFiJyB8IG51bGwge1xuICAgIGNvbnN0IGltcG9ydGVyID0gYXNzZXQubWV0YT8uaW1wb3J0ZXI7XG4gICAgY29uc3Qgc291cmNlID0gYXNzZXQuc291cmNlIHx8ICcnO1xuICAgIGlmIChpbXBvcnRlciA9PT0gJ3NjZW5lJyB8fCAvXFwuc2NlbmUkL2kudGVzdChzb3VyY2UpKSB7XG4gICAgICAgIHJldHVybiAnc2NlbmUnO1xuICAgIH1cbiAgICBpZiAoaW1wb3J0ZXIgPT09ICdwcmVmYWInIHx8IC9cXC5wcmVmYWIkL2kudGVzdChzb3VyY2UpKSB7XG4gICAgICAgIHJldHVybiAncHJlZmFiJztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0VHlwZVNjcmlwdFN5bnRheEVycm9yKGZpbGVOYW1lOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGxldCB0czogdHlwZW9mIGltcG9ydCgndHlwZXNjcmlwdCcpIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgdHMgPSByZXF1aXJlKCd0eXBlc2NyaXB0JykgYXMgdHlwZW9mIGltcG9ydCgndHlwZXNjcmlwdCcpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0cy50cmFuc3BpbGVNb2R1bGUoY29udGVudCwge1xuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgcmVwb3J0RGlhZ25vc3RpY3M6IHRydWUsXG4gICAgICAgIGNvbXBpbGVyT3B0aW9uczoge1xuICAgICAgICAgICAgdGFyZ2V0OiB0cy5TY3JpcHRUYXJnZXQuRVNOZXh0LFxuICAgICAgICAgICAgZXhwZXJpbWVudGFsRGVjb3JhdG9yczogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBkaWFnbm9zdGljID0gcmVzdWx0LmRpYWdub3N0aWNzPy5maW5kKChpdGVtKSA9PiBpdGVtLmNhdGVnb3J5ID09PSB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IpO1xuICAgIGlmICghZGlhZ25vc3RpYykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtZXNzYWdlID0gdHMuZmxhdHRlbkRpYWdub3N0aWNNZXNzYWdlVGV4dChkaWFnbm9zdGljLm1lc3NhZ2VUZXh0LCAnXFxuJyk7XG4gICAgaWYgKGRpYWdub3N0aWMuZmlsZSAmJiB0eXBlb2YgZGlhZ25vc3RpYy5zdGFydCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBkaWFnbm9zdGljLmZpbGUuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oZGlhZ25vc3RpYy5zdGFydCk7XG4gICAgICAgIHJldHVybiBgJHttZXNzYWdlfSAoJHtwb3NpdGlvbi5saW5lICsgMX06JHtwb3NpdGlvbi5jaGFyYWN0ZXIgKyAxfSlgO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2NyaXB0U3RydWN0dXJlRXJyb3IoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3Qgc3RhY2s6IHsgY2hhcjogc3RyaW5nOyBsaW5lOiBudW1iZXI7IGNvbHVtbjogbnVtYmVyIH1bXSA9IFtdO1xuICAgIGxldCBsaW5lID0gMTtcbiAgICBsZXQgY29sdW1uID0gMDtcbiAgICBsZXQgc3RhdGU6ICdub3JtYWwnIHwgJ3NpbmdsZVF1b3RlJyB8ICdkb3VibGVRdW90ZScgfCAndGVtcGxhdGUnIHwgJ2xpbmVDb21tZW50JyB8ICdibG9ja0NvbW1lbnQnID0gJ25vcm1hbCc7XG4gICAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcbiAgICBjb25zdCBvcGVuaW5nID0gbmV3IFNldChbJygnLCAnWycsICd7J10pO1xuICAgIGNvbnN0IGNsb3Npbmc6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgICcpJzogJygnLFxuICAgICAgICAnXSc6ICdbJyxcbiAgICAgICAgJ30nOiAneycsXG4gICAgfTtcblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb250ZW50Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBjaGFyID0gY29udGVudFtpbmRleF07XG4gICAgICAgIGNvbnN0IG5leHQgPSBjb250ZW50W2luZGV4ICsgMV07XG4gICAgICAgIGNvbHVtbisrO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gJ2xpbmVDb21tZW50Jykge1xuICAgICAgICAgICAgaWYgKGNoYXIgPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnbm9ybWFsJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gJ2Jsb2NrQ29tbWVudCcpIHtcbiAgICAgICAgICAgIGlmIChjaGFyID09PSAnKicgJiYgbmV4dCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnbm9ybWFsJztcbiAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgICAgIGNvbHVtbisrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSAnc2luZ2xlUXVvdGUnIHx8IHN0YXRlID09PSAnZG91YmxlUXVvdGUnIHx8IHN0YXRlID09PSAndGVtcGxhdGUnKSB7XG4gICAgICAgICAgICBjb25zdCBxdW90ZSA9IHN0YXRlID09PSAnc2luZ2xlUXVvdGUnID8gJ1xcJycgOiBzdGF0ZSA9PT0gJ2RvdWJsZVF1b3RlJyA/ICdcIicgOiAnYCc7XG4gICAgICAgICAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgZXNjYXBlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09IHF1b3RlKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnbm9ybWFsJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjaGFyID09PSAnLycgJiYgbmV4dCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnbGluZUNvbW1lbnQnO1xuICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgY29sdW1uKys7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09ICcvJyAmJiBuZXh0ID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9ICdibG9ja0NvbW1lbnQnO1xuICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgY29sdW1uKys7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09ICdcXCcnKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnc2luZ2xlUXVvdGUnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGFyID09PSAnXCInKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnZG91YmxlUXVvdGUnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGFyID09PSAnYCcpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9ICd0ZW1wbGF0ZSc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9wZW5pbmcuaGFzKGNoYXIpKSB7XG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7IGNoYXIsIGxpbmUsIGNvbHVtbiB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xvc2luZ1tjaGFyXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3QgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWxhc3QgfHwgbGFzdC5jaGFyICE9PSBjbG9zaW5nW2NoYXJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgdW5leHBlY3RlZCBcIiR7Y2hhcn1cIiBhdCAke2xpbmV9OiR7Y29sdW1ufWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoYXIgPT09ICdcXG4nKSB7XG4gICAgICAgICAgICBsaW5lKys7XG4gICAgICAgICAgICBjb2x1bW4gPSAwO1xuICAgICAgICAgICAgaWYgKHN0YXRlID09PSAnbGluZUNvbW1lbnQnKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnbm9ybWFsJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGF0ZSA9PT0gJ3NpbmdsZVF1b3RlJyB8fCBzdGF0ZSA9PT0gJ2RvdWJsZVF1b3RlJyB8fCBzdGF0ZSA9PT0gJ3RlbXBsYXRlJykge1xuICAgICAgICByZXR1cm4gYHVudGVybWluYXRlZCAke3N0YXRlID09PSAndGVtcGxhdGUnID8gJ3RlbXBsYXRlIHN0cmluZycgOiAnc3RyaW5nIGxpdGVyYWwnfWA7XG4gICAgfVxuICAgIGlmIChzdGF0ZSA9PT0gJ2Jsb2NrQ29tbWVudCcpIHtcbiAgICAgICAgcmV0dXJuICd1bnRlcm1pbmF0ZWQgYmxvY2sgY29tbWVudCc7XG4gICAgfVxuICAgIGNvbnN0IGxhc3QgPSBzdGFjay5wb3AoKTtcbiAgICBpZiAobGFzdCkge1xuICAgICAgICByZXR1cm4gYHVuY2xvc2VkIFwiJHtsYXN0LmNoYXJ9XCIgYXQgJHtsYXN0LmxpbmV9OiR7bGFzdC5jb2x1bW59YDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFNjZW5lT3JQcmVmYWJKc29uRXJyb3IoYXNzZXQ6IElBc3NldCwgY29udGVudDogc3RyaW5nIHwgQnVmZmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3Qga2luZCA9IGdldFNjZW5lT3JQcmVmYWJBc3NldEtpbmQoYXNzZXQpO1xuICAgIGlmICgha2luZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnXG4gICAgICAgID8gY29udGVudFxuICAgICAgICA6IEJ1ZmZlci5pc0J1ZmZlcihjb250ZW50KVxuICAgICAgICAgICAgPyBjb250ZW50LnRvU3RyaW5nKCd1dGY4JylcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICBpZiAodGV4dCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gJ2NvbnRlbnQgbXVzdCBiZSBKU09OIHRleHQnO1xuICAgIH1cblxuICAgIGxldCBkYXRhOiB1bmtub3duO1xuICAgIHRyeSB7XG4gICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKHRleHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBgaW52YWxpZCBKU09OOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICByZXR1cm4gYGV4cGVjdGVkICR7a2luZH0gSlNPTiBhcnJheWA7XG4gICAgfVxuICAgIGlmIChkYXRhLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIGBleHBlY3RlZCAke2tpbmR9IEpTT04gYXJyYXkgd2l0aCBhc3NldCBhbmQgcm9vdCBlbnRyaWVzYDtcbiAgICB9XG5cbiAgICBjb25zdCBhc3NldEVudHJ5ID0gZGF0YVswXTtcbiAgICBjb25zdCByb290RW50cnkgPSBkYXRhWzFdO1xuICAgIGlmICghaXNSZWNvcmQoYXNzZXRFbnRyeSkgfHwgIWlzUmVjb3JkKHJvb3RFbnRyeSkpIHtcbiAgICAgICAgcmV0dXJuIGBleHBlY3RlZCAke2tpbmR9IGFzc2V0IGFuZCByb290IGVudHJpZXMgdG8gYmUgb2JqZWN0c2A7XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgPT09ICdzY2VuZScpIHtcbiAgICAgICAgaWYgKGFzc2V0RW50cnkuX190eXBlX18gIT09ICdjYy5TY2VuZUFzc2V0Jykge1xuICAgICAgICAgICAgcmV0dXJuICdleHBlY3RlZCBmaXJzdCBlbnRyeSBfX3R5cGVfXyB0byBiZSBjYy5TY2VuZUFzc2V0JztcbiAgICAgICAgfVxuICAgICAgICBpZiAocm9vdEVudHJ5Ll9fdHlwZV9fICE9PSAnY2MuU2NlbmUnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2V4cGVjdGVkIHNlY29uZCBlbnRyeSBfX3R5cGVfXyB0byBiZSBjYy5TY2VuZSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGFzc2V0RW50cnkuX190eXBlX18gIT09ICdjYy5QcmVmYWInKSB7XG4gICAgICAgIHJldHVybiAnZXhwZWN0ZWQgZmlyc3QgZW50cnkgX190eXBlX18gdG8gYmUgY2MuUHJlZmFiJztcbiAgICB9XG4gICAgaWYgKHJvb3RFbnRyeS5fX3R5cGVfXyAhPT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgIHJldHVybiAnZXhwZWN0ZWQgc2Vjb25kIGVudHJ5IF9fdHlwZV9fIHRvIGJlIGNjLk5vZGUnO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuY2xhc3MgQXNzZXRPcGVyYXRpb24gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBfaW1wb3J0VGFza0J5VGFyZ2V0UGF0aCA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPHZvaWQ+PigpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3Jlc2VydmVkSW1wb3J0VGFyZ2V0UGF0aHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5LiA5Liq6LWE5rqQ5paH5Lu25aS55piv5ZCm5Li65Y+q6K+7XG4gICAgICovXG4gICAgX2NoZWNrUmVhZG9ubHkoYXNzZXQ6IElBc3NldCkge1xuICAgICAgICBpZiAoYXNzZXQuX2Fzc2V0REIub3B0aW9ucy5yZWFkb25seSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2kxOG4udCgnYXNzZXRzLm9wZXJhdGlvbi5yZWFkb25seScpfSBcXG4gIHVybDogJHthc3NldC51cmx9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY2hlY2tFeGlzdHMocGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaWxlICR7cGF0aH0gbm90IGV4aXN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOajgOafpeaYr+WQpuWtmOWcqOaWh+S7tu+8jOWmguaenOWtmOWcqOWImeagueaNrumAiemhueWGs+WumuaYr+WQpuimhuebluaIlumHjeWRveWQjVxuICAgICAqIEBwYXJhbSBwYXRoIFxuICAgICAqIEBwYXJhbSBvcHRpb24gXG4gICAgICogQHJldHVybnMg6L+U5Zue5paw55qE5paH5Lu26Lev5b6EXG4gICAgICovXG4gICAgX2NoZWNrT3ZlcndyaXRlKHBhdGg6IHN0cmluZywgb3B0aW9uPzogQXNzZXRPcGVyYXRpb25PcHRpb24sIGlzT2NjdXBpZWQ6IChwYXRoOiBzdHJpbmcpID0+IGJvb2xlYW4gPSBleGlzdHNTeW5jKSB7XG4gICAgICAgIGlmIChpc09jY3VwaWVkKHBhdGgpICYmICFvcHRpb24/Lm92ZXJ3cml0ZSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbj8ucmVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHV0aWxzLkZpbGUuZ2V0TmFtZShwYXRoLCBpc09jY3VwaWVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmlsZSAke3BhdGh9IGFscmVhZHkgZXhpc3RzLCBwbGVhc2UgdXNlIG92ZXJ3cml0ZSBvcHRpb24gdG8gb3ZlcndyaXRlIGl0IG9yIHVzZSByZW5hbWUgb3B0aW9uIHRvIGF1dG8gcmVuYW1lIGl0IGZpcnN0LmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIF9jaGVja1JlbmFtZU5ld05hbWUoYXNzZXQ6IElBc3NldCwgbmV3TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGlmICghbmV3TmFtZSB8fCBuZXdOYW1lID09PSAnLicgfHwgbmV3TmFtZSA9PT0gJy4uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCduZXdOYW1lIG11c3QgYmUgYSBzaW5nbGUgZmlsZSBvciBkaXJlY3RvcnkgbmFtZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbmV3TmFtZS5zdGFydHNXaXRoKCdkYjovLycpXG4gICAgICAgICAgICB8fCBpc0Fic29sdXRlKG5ld05hbWUpXG4gICAgICAgICAgICB8fCAvW1xcXFwvXS8udGVzdChuZXdOYW1lKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbmV3TmFtZSBtdXN0IGJlIGEgc2luZ2xlIGZpbGUgb3IgZGlyZWN0b3J5IG5hbWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYXNzZXQuaXNEaXJlY3RvcnkoKSAmJiAhZXh0bmFtZShuZXdOYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCduZXdOYW1lIG11c3QgaW5jbHVkZSBmaWxlIGV4dGVuc2lvbicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZUFzc2V0TWV0YSh1dWlkOiBzdHJpbmcsIG1ldGE6IElBc3NldE1ldGEsIGFzc2V0PzogSUFzc2V0KSB7XG4gICAgICAgIC8vIOS4jeiDveS4uuaVsOe7hFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgbWV0YSAhPT0gJ29iamVjdCdcbiAgICAgICAgICAgIHx8IEFycmF5LmlzQXJyYXkobWV0YSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNhdmUgbWV0YSBmYWlsZWQoJHt1dWlkfSk6IFRoZSBtZXRhIG11c3QgYmUgYW4gT2JqZWN0IHN0cmluZ2ApO1xuICAgICAgICB9XG4gICAgICAgIGFzc2V0ID0gYXNzZXQgfHwgYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHV1aWQpITtcbiAgICAgICAgbWVyZ2VNZXRhKGFzc2V0Lm1ldGEsIG1ldGEpO1xuICAgICAgICBhd2FpdCBhc3NldC5zYXZlKCk7IC8vIOi/memHjOaJjeaYr+WwhuaVsOaNruS/neWtmOWIsCAubWV0YSDmlofku7ZcbiAgICAgICAgYXdhaXQgYXNzZXQuX2Fzc2V0REIucmVpbXBvcnQoYXNzZXQudXVpZCk7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlVXNlckRhdGE8VCBleHRlbmRzIGtleW9mIEFzc2V0VXNlckRhdGFNYXAgPSAndW5rbm93bic+KHV1aWRPclVSTE9yUGF0aDogc3RyaW5nLCB1c2VyRGF0YTogQXNzZXRVc2VyRGF0YU1hcFtUXSk6IFByb21pc2U8QXNzZXRVc2VyRGF0YU1hcFtUXSB8IHVuZGVmaW5lZD4ge1xuICAgICAgICBpZiAoIWlzUmVjb3JkKHVzZXJEYXRhKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1c2VyRGF0YSBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXQgPSBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXQodXVpZE9yVVJMT3JQYXRoKTtcbiAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY2FuIG5vdCBmaW5kIGFzc2V0ICR7dXVpZE9yVVJMT3JQYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc1JlY29yZChhc3NldC5tZXRhLnVzZXJEYXRhKSkge1xuICAgICAgICAgICAgYXNzZXQubWV0YS51c2VyRGF0YSA9IHt9IGFzIEFzc2V0VXNlckRhdGFNYXBbVF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3VycmVudFVzZXJEYXRhID0gYXNzZXQubWV0YS51c2VyRGF0YSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY3VycmVudFVzZXJEYXRhKSkge1xuICAgICAgICAgICAgZGVsZXRlIGN1cnJlbnRVc2VyRGF0YVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5hc3NpZ24oY3VycmVudFVzZXJEYXRhLCBsb2Rhc2guY2xvbmVEZWVwKHVzZXJEYXRhKSk7XG4gICAgICAgIGFzc2V0Lm1ldGEudXNlckRhdGEgPSBjdXJyZW50VXNlckRhdGEgYXMgQXNzZXRVc2VyRGF0YU1hcFtUXTtcbiAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZSgpO1xuICAgICAgICBhd2FpdCBhc3NldC5fYXNzZXREQi5yZWltcG9ydChhc3NldC51dWlkKTtcbiAgICAgICAgcmV0dXJuIGFzc2V0Py5tZXRhLnVzZXJEYXRhIGFzIEFzc2V0VXNlckRhdGFNYXBbVF07XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlVXNlckRhdGFCeVBhdGg8VCBleHRlbmRzIGtleW9mIEFzc2V0VXNlckRhdGFNYXAgPSAndW5rbm93bic+KHV1aWRPclVSTE9yUGF0aDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPEFzc2V0VXNlckRhdGFNYXBbVF0gfCB1bmRlZmluZWQ+IHtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BhdGggbXVzdCBub3QgYmUgZW1wdHkuIFVzZSB1cGRhdGVVc2VyRGF0YSB0byByZXBsYWNlIHRoZSBjb21wbGV0ZSB1c2VyRGF0YSBvYmplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHV1aWRPclVSTE9yUGF0aCk7XG4gICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNhbiBub3QgZmluZCBhc3NldCAke3V1aWRPclVSTE9yUGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzUmVjb3JkKGFzc2V0Lm1ldGEudXNlckRhdGEpKSB7XG4gICAgICAgICAgICBhc3NldC5tZXRhLnVzZXJEYXRhID0ge30gYXMgQXNzZXRVc2VyRGF0YU1hcFtUXTtcbiAgICAgICAgfVxuICAgICAgICBsb2Rhc2guc2V0KGFzc2V0Py5tZXRhLnVzZXJEYXRhLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIGF3YWl0IGFzc2V0LnNhdmUoKTtcbiAgICAgICAgYXdhaXQgYXNzZXQuX2Fzc2V0REIucmVpbXBvcnQoYXNzZXQudXVpZCk7XG4gICAgICAgIHJldHVybiBhc3NldD8ubWV0YS51c2VyRGF0YSBhcyBBc3NldFVzZXJEYXRhTWFwW1RdO1xuICAgIH1cblxuICAgIGFzeW5jIHNhdmVBc3NldCh1dWlkT3JVUkxPclBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nIHwgQnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHV1aWRPclVSTE9yUGF0aCk7XG4gICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpMThuLnQoJ2Fzc2V0cy5zYXZlX2Fzc2V0LmZhaWwuYXNzZXQnLCB7IGFzc2V0OiB1dWlkT3JVUkxPclBhdGggfSl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFzc2V0Ll9hc3NldERCLm9wdGlvbnMucmVhZG9ubHkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpMThuLnQoJ2Fzc2V0cy5vcGVyYXRpb24ucmVhZG9ubHknKX0gXFxuICB1cmw6ICR7YXNzZXQudXJsfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpMThuLnQoJ2Fzc2V0cy5zYXZlX2Fzc2V0LmZhaWwuY29udGVudCcpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYXNzZXQuc291cmNlKSB7XG4gICAgICAgICAgICAvLyDkuI3lrZjlnKjmupDmlofku7bnmoTotYTmupDml6Dms5Xkv53lrZhcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpMThuLnQoJ2Fzc2V0cy5zYXZlX2Fzc2V0LmZhaWwudXVpZCcpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdmFsaWRhdGVBc3NldENvbnRlbnRCZWZvcmVTYXZlKGFzc2V0LCBjb250ZW50KTtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgYXNzZXRIYW5kbGVyTWFuYWdlci5zYXZlQXNzZXQoYXNzZXQsIGNvbnRlbnQpO1xuICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5fYXNzZXREQi5yZWltcG9ydChhc3NldC51dWlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXNzZXQgJiYgKCFhc3NldC5pbXBvcnRlZCB8fCBhc3NldC5pbnZhbGlkKSkge1xuICAgICAgICAgICAgdGhyb3cgYXNzZXQuaW1wb3J0RXJyb3IgfHwgbmV3IEVycm9yKGBTYXZlIGFzc2V0ICR7YXNzZXQuc291cmNlfSBmYWlsZWRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChhc3NldCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfdmFsaWRhdGVBc3NldENvbnRlbnRCZWZvcmVTYXZlKGFzc2V0OiBJQXNzZXQsIGNvbnRlbnQ6IHN0cmluZyB8IEJ1ZmZlcikge1xuICAgICAgICB0aGlzLl92YWxpZGF0ZVNjcmlwdENvbnRlbnRCZWZvcmVTYXZlKGFzc2V0LCBjb250ZW50KTtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVTY2VuZU9yUHJlZmFiQ29udGVudEJlZm9yZVNhdmUoYXNzZXQsIGNvbnRlbnQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3ZhbGlkYXRlU2NyaXB0Q29udGVudEJlZm9yZVNhdmUoYXNzZXQ6IElBc3NldCwgY29udGVudDogc3RyaW5nIHwgQnVmZmVyKSB7XG4gICAgICAgIGlmICghaXNTY3JpcHRBc3NldChhc3NldCkgfHwgdHlwZW9mIGNvbnRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RydWN0dXJlRXJyb3IgPSBnZXRTY3JpcHRTdHJ1Y3R1cmVFcnJvcihjb250ZW50KTtcbiAgICAgICAgY29uc3Qgc3ludGF4RXJyb3IgPSBnZXRUeXBlU2NyaXB0U3ludGF4RXJyb3IoYXNzZXQuc291cmNlLCBjb250ZW50KTtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBzeW50YXhFcnJvciB8fCBzdHJ1Y3R1cmVFcnJvcjtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2NyaXB0IGNvbnRlbnQ6ICR7ZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF92YWxpZGF0ZVNjZW5lT3JQcmVmYWJDb250ZW50QmVmb3JlU2F2ZShhc3NldDogSUFzc2V0LCBjb250ZW50OiBzdHJpbmcgfCBCdWZmZXIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBnZXRTY2VuZU9yUHJlZmFiSnNvbkVycm9yKGFzc2V0LCBjb250ZW50KTtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2NlbmUvcHJlZmFiIGFzc2V0IGNvbnRlbnQ6ICR7ZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1ZhbGlkVXJsKHVybE9yUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdXJsT3JQYXRoLnN0YXJ0c1dpdGgoJ2RiOi8vJykpIHtcbiAgICAgICAgICAgIHVybE9yUGF0aCA9IGFzc2V0UXVlcnkucXVlcnlVcmwodXJsT3JQYXRoKTtcbiAgICAgICAgICAgIGlmICghdXJsT3JQYXRoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2kxOG4udCgnYXNzZXRzLm9wZXJhdGlvbi5pbnZhbGlkX3VybCcpfSBcXG4gIHVybDogJHt1cmxPclBhdGh9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYk5hbWUgPSB1cmxPclBhdGguc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbilbMV07XG4gICAgICAgIGNvbnN0IGRiSW5mbyA9IGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvW2RiTmFtZV07XG5cbiAgICAgICAgaWYgKCFkYkluZm8gfHwgZGJJbmZvLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aTE4bi50KCdhc3NldHMub3BlcmF0aW9uLnJlYWRvbmx5Jyl9IFxcbiAgdXJsOiAke3VybE9yUGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFzeW5jIGNyZWF0ZUFzc2V0KG9wdGlvbnM6IENyZWF0ZUFzc2V0T3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0IHx8IHR5cGVvZiBvcHRpb25zLnRhcmdldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNyZWF0ZSBhc3NldCBiZWNhdXNlIG9wdGlvbnMudGFyZ2V0IGlzIHJlcXVpcmVkLmApO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWIpOaWreebruagh+i3r+W+hOaYr+WQpuS4uuWPquivu1xuICAgICAgICB0aGlzLmNoZWNrVmFsaWRVcmwob3B0aW9ucy50YXJnZXQpO1xuICAgICAgICBpZiAoIWlzQWJzb2x1dGUob3B0aW9ucy50YXJnZXQpKSB7XG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IHVybDJwYXRoKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLnRhcmdldCA9IHRoaXMuX2NoZWNrT3ZlcndyaXRlKG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zKTtcbiAgICAgICAgY29uc3QgYXNzZXRQYXRoID0gYXdhaXQgYXNzZXRIYW5kbGVyTWFuYWdlci5jcmVhdGVBc3NldChvcHRpb25zKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQXNzZXQoYXNzZXRQYXRoKTtcbiAgICAgICAgY29uc3QgYXNzZXQgPSBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXQoYXNzZXRQYXRoKTtcbiAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDcmVhdGUgYXNzZXQgaW4gJHtvcHRpb25zLnRhcmdldH0gZmFpbGVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFzc2V0ICYmICghYXNzZXQuaW1wb3J0ZWQgfHwgYXNzZXQuaW52YWxpZCkpIHtcbiAgICAgICAgICAgIHRocm93IGFzc2V0LmltcG9ydEVycm9yIHx8IG5ldyBFcnJvcihgQ3JlYXRlIGFzc2V0IGluICR7b3B0aW9ucy50YXJnZXR9IGZhaWxlZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3NldFF1ZXJ5LmVuY29kZUFzc2V0KGFzc2V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmoLnmja7nsbvlnovliJvlu7rotYTmupBcbiAgICAgKiBAcGFyYW0gdHlwZSBcbiAgICAgKiBAcGFyYW0gZGlyT3JVcmwg55uu5qCH55uu5b2VXG4gICAgICogQHBhcmFtIGJhc2VOYW1lIOWfuuehgOWQjeensFxuICAgICAqIEBwYXJhbSBvcHRpb25zIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZUFzc2V0QnlUeXBlKHR5cGU6IElTdXBwb3J0Q3JlYXRlVHlwZSwgZGlyT3JVcmw6IHN0cmluZywgYmFzZU5hbWU6IHN0cmluZywgb3B0aW9ucz86IENyZWF0ZUFzc2V0QnlUeXBlT3B0aW9ucykge1xuICAgICAgICBjb25zdCBjcmVhdGVNZW51cyA9IGF3YWl0IGFzc2V0SGFuZGxlck1hbmFnZXIuZ2V0Q3JlYXRlTWVudUJ5TmFtZSh0eXBlKTtcbiAgICAgICAgaWYgKCFjcmVhdGVNZW51cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FuIG5vdCBzdXBwb3J0IGNyZWF0ZSB0eXBlOiAke3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fcmVzb2x2ZUNyZWF0ZUFzc2V0RGlyKGRpck9yVXJsKTtcbiAgICAgICAgbGV0IGNyZWF0ZUluZm86IHVuZGVmaW5lZCB8IElDcmVhdGVNZW51SW5mbyA9IGNyZWF0ZU1lbnVzWzBdO1xuICAgICAgICBpZiAoY3JlYXRlTWVudXMubGVuZ3RoID4gMSAmJiBvcHRpb25zPy50ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIGNyZWF0ZUluZm8gPSBjcmVhdGVNZW51cy5maW5kKChtZW51KSA9PiBtZW51Lm5hbWUgPT09IG9wdGlvbnMudGVtcGxhdGVOYW1lKTtcbiAgICAgICAgICAgIGlmICghY3JlYXRlSW5mbykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FuIG5vdCBmaW5kIHRlbXBsYXRlOiAke29wdGlvbnMudGVtcGxhdGVOYW1lfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4dE5hbWUgPSBleHRuYW1lKGNyZWF0ZUluZm8uZnVsbEZpbGVOYW1lKTtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBleHROYW1lICYmIGJhc2VOYW1lLmVuZHNXaXRoKGV4dE5hbWUpID8gYmFzZU5hbWUgOiBiYXNlTmFtZSArIGV4dE5hbWU7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGpvaW4oZGlyLCBmaWxlTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlQXNzZXQoe1xuICAgICAgICAgICAgaGFuZGxlcjogY3JlYXRlSW5mby5oYW5kbGVyLFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgb3ZlcndyaXRlOiBvcHRpb25zPy5vdmVyd3JpdGUgPz8gZmFsc2UsXG4gICAgICAgICAgICByZW5hbWU6IG9wdGlvbnM/LnJlbmFtZSA/PyBmYWxzZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiBjcmVhdGVJbmZvLnRlbXBsYXRlLFxuICAgICAgICAgICAgY29udGVudDogb3B0aW9ucz8uY29udGVudCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVzb2x2ZUNyZWF0ZUFzc2V0RGlyKGRpck9yVXJsOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZERpck9yVXJsID0gdGhpcy5fcGF0aFRvRGJVcmxJZkluc2lkZUFzc2V0REIoZGlyT3JVcmwpO1xuICAgICAgICBpZiAobm9ybWFsaXplZERpck9yVXJsLnN0YXJ0c1dpdGgoJ2RiOi8vJykpIHtcbiAgICAgICAgICAgIHJldHVybiB1cmwycGF0aChub3JtYWxpemVkRGlyT3JVcmwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkRGlyT3JVcmw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LuO6aG555uu5aSW5ou36LSd5a+85YWl6LWE5rqQ6L+b5p2lXG4gICAgICogQHBhcmFtIHNvdXJjZSBcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IFxuICAgICAqIEBwYXJhbSBvcHRpb25zIFxuICAgICAqL1xuICAgIGFzeW5jIGltcG9ydEFzc2V0KHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZywgb3B0aW9ucz86IEFzc2V0T3BlcmF0aW9uT3B0aW9uKTogUHJvbWlzZTxJQXNzZXRJbmZvW10+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0VXJsID0gdGhpcy5fcGF0aFRvRGJVcmxJZkluc2lkZUFzc2V0REIodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHRhcmdldFVybC5zdGFydHNXaXRoKCdkYjovLycpID8gdXJsMnBhdGgodGFyZ2V0VXJsKSA6IHRhcmdldDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlSW1wb3J0QnlUYXJnZXRQYXRoKHRhcmdldFBhdGgsICgpID0+IHRoaXMuX2ltcG9ydEFzc2V0KHNvdXJjZSwgdGFyZ2V0UGF0aCwgb3B0aW9ucykpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2ltcG9ydEFzc2V0KHNvdXJjZTogc3RyaW5nLCB0YXJnZXRQYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBBc3NldE9wZXJhdGlvbk9wdGlvbik6IFByb21pc2U8SUFzc2V0SW5mb1tdPiB7XG4gICAgICAgIGNvbnN0IGlzU2FtZVBhdGggPSB0aGlzLl9pc1NhbWVGaWxlc3lzdGVtUGF0aChzb3VyY2UsIHRhcmdldFBhdGgpO1xuXG4gICAgICAgIGlmICghaXNTYW1lUGF0aCkge1xuICAgICAgICAgICAgY29uc3QgcmVzZXJ2YXRpb24gPSB0aGlzLl9yZXNlcnZlSW1wb3J0VGFyZ2V0UGF0aCh0YXJnZXRQYXRoLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRhcmdldFBhdGggPSByZXNlcnZhdGlvbi50YXJnZXRQYXRoO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3B5T3B0aW9ucyA9IG9wdGlvbnM/Lm92ZXJ3cml0ZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogeyBvdmVyd3JpdGU6IG9wdGlvbnMub3ZlcndyaXRlIH07XG4gICAgICAgICAgICAgICAgYXdhaXQgY29weVBhdGgoc291cmNlLCB0YXJnZXRQYXRoLCBjb3B5T3B0aW9ucyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHJlc2VydmF0aW9uLnJlbGVhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0VGFyZ2V0ID0gdGhpcy5fcGF0aFRvRGJVcmxJZkluc2lkZUFzc2V0REIodGFyZ2V0UGF0aCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaEFzc2V0KGFzc2V0VGFyZ2V0KTtcbiAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0SW5mbyhhc3NldFRhcmdldCk7XG4gICAgICAgIGlmICghYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhc3NldEluZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBbYXNzZXRJbmZvXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXNzZXRRdWVyeS5xdWVyeUFzc2V0SW5mb3Moe1xuICAgICAgICAgICAgcGF0dGVybjogYCR7YXNzZXRJbmZvLnVybH0vKiovKmBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcXVldWVJbXBvcnRCeVRhcmdldFBhdGg8VCA9IHVua25vd24+KHRhcmdldFBhdGg6IHN0cmluZywgdGFzazogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgICAgICBjb25zdCB0YXJnZXRLZXkgPSB0aGlzLl9nZXRJbXBvcnRUYXJnZXRLZXkodGFyZ2V0UGF0aCk7XG5cbiAgICAgICAgY29uc3QgcHJldmlvdXNUYXNrID0gdGhpcy5faW1wb3J0VGFza0J5VGFyZ2V0UGF0aC5nZXQodGFyZ2V0S2V5KSA/PyBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgY29uc3QgdGFza1Jlc3VsdCA9IHByZXZpb3VzVGFzay50aGVuKHRhc2spO1xuICAgICAgICBjb25zdCB0YXNrVGFpbCA9IHRhc2tSZXN1bHQudGhlbigoKSA9PiB1bmRlZmluZWQsICgpID0+IHVuZGVmaW5lZCk7IC8vIG5ldmVyIHJlamVjdFxuICAgICAgICB0aGlzLl9pbXBvcnRUYXNrQnlUYXJnZXRQYXRoLnNldCh0YXJnZXRLZXksIHRhc2tUYWlsKTtcblxuICAgICAgICByZXR1cm4gdGFza1Jlc3VsdC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pbXBvcnRUYXNrQnlUYXJnZXRQYXRoLmdldCh0YXJnZXRLZXkpID09PSB0YXNrVGFpbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ltcG9ydFRhc2tCeVRhcmdldFBhdGguZGVsZXRlKHRhcmdldEtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2lzUGF0aE9jY3VwaWVkID0gKHBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gZXhpc3RzU3luYyhwYXRoKSB8fCB0aGlzLl9yZXNlcnZlZEltcG9ydFRhcmdldFBhdGhzLmhhcyh0aGlzLl9nZXRJbXBvcnRUYXJnZXRLZXkocGF0aCkpO1xuICAgIH07XG4gICAgcHJpdmF0ZSBfcmVzZXJ2ZUltcG9ydFRhcmdldFBhdGgodGFyZ2V0UGF0aDogc3RyaW5nLCBvcHRpb25zPzogQXNzZXRPcGVyYXRpb25PcHRpb24pIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRUYXJnZXRQYXRoID0gdGhpcy5fY2hlY2tPdmVyd3JpdGUodGFyZ2V0UGF0aCwgb3B0aW9ucywgdGhpcy5faXNQYXRoT2NjdXBpZWQpO1xuICAgICAgICBjb25zdCB0YXJnZXRLZXkgPSB0aGlzLl9nZXRJbXBvcnRUYXJnZXRLZXkocmVzb2x2ZWRUYXJnZXRQYXRoKTtcbiAgICAgICAgdGhpcy5fcmVzZXJ2ZWRJbXBvcnRUYXJnZXRQYXRocy5zZXQodGFyZ2V0S2V5LCAodGhpcy5fcmVzZXJ2ZWRJbXBvcnRUYXJnZXRQYXRocy5nZXQodGFyZ2V0S2V5KSA/PyAwKSArIDEpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0YXJnZXRQYXRoOiByZXNvbHZlZFRhcmdldFBhdGgsXG4gICAgICAgICAgICByZWxlYXNlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzZXJ2YXRpb25Db3VudCA9IHRoaXMuX3Jlc2VydmVkSW1wb3J0VGFyZ2V0UGF0aHMuZ2V0KHRhcmdldEtleSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc2VydmF0aW9uQ291bnQgPT09IHVuZGVmaW5lZCB8fCByZXNlcnZhdGlvbkNvdW50IDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzZXJ2ZWRJbXBvcnRUYXJnZXRQYXRocy5kZWxldGUodGFyZ2V0S2V5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNlcnZlZEltcG9ydFRhcmdldFBhdGhzLnNldCh0YXJnZXRLZXksIHJlc2VydmF0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldEltcG9ydFRhcmdldEtleSh0YXJnZXRQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHRhcmdldEtleSA9IHV0aWxzLlBhdGgubm9ybWFsaXplKHRhcmdldFBhdGgpO1xuICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gdGFyZ2V0S2V5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRhcmdldEtleTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IGFuIGV4aXN0aW5nIG1haW4gYXNzZXQgdG9nZXRoZXIgd2l0aCBpdHMgY29tcGxldGUgbWV0YSBpbmZvcm1hdGlvbi5cbiAgICAgKi9cbiAgICBhc3luYyBjb3B5QXNzZXQoc291cmNlOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nLCBvcHRpb25zPzogQXNzZXRPcGVyYXRpb25PcHRpb24pOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGFzc2V0REJNYW5hZ2VyLmFkZFRhc2sodGhpcy5fY29weUFzc2V0LmJpbmQodGhpcyksIFtzb3VyY2UsIHRhcmdldCwgb3B0aW9uc10pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2NvcHlBc3NldChzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcsIG9wdGlvbnM/OiBBc3NldE9wZXJhdGlvbk9wdGlvbik6IFByb21pc2U8SUFzc2V0SW5mbz4ge1xuICAgICAgICBjb25zdCBhc3NldCA9IGFzc2V0UXVlcnkucXVlcnlBc3NldChzb3VyY2UpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFzc2V0IGluIHNvdXJjZSBmaWxlICR7c291cmNlfSBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFzc2V0Ll9wYXJlbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3ViLWFzc2V0cyBjYW5ub3QgYmUgY29waWVkIGluZGVwZW5kZW50bHk7IGNvcHkgdGhlaXIgbWFpbiBhc3NldCBpbnN0ZWFkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja1ZhbGlkVXJsKHRhcmdldCk7XG4gICAgICAgIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgdGhpcy5fY2hlY2tFeGlzdHMoc291cmNlKTtcbiAgICAgICAgaWYgKHRhcmdldC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB1cmwycGF0aCh0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldCA9IHRoaXMuX2NoZWNrT3ZlcndyaXRlKHRhcmdldCwgb3B0aW9ucyk7XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0SXNBc3NldERCUm9vdCA9IE9iamVjdC52YWx1ZXMoYXNzZXREQk1hbmFnZXIuYXNzZXREQkluZm8pLnNvbWUoKGluZm8pID0+IChcbiAgICAgICAgICAgIHV0aWxzLlBhdGguY29udGFpbnMoaW5mby50YXJnZXQsIHRhcmdldCkgJiYgdXRpbHMuUGF0aC5jb250YWlucyh0YXJnZXQsIGluZm8udGFyZ2V0KVxuICAgICAgICApKTtcbiAgICAgICAgaWYgKHRhcmdldElzQXNzZXREQlJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvcHkgYW4gYXNzZXQgb3ZlciBhbiBBc3NldERCIHJvb3QuXFxudGFyZ2V0OiAke3RhcmdldH1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXRpbHMuUGF0aC5jb250YWlucyhzb3VyY2UsIHRhcmdldCkgfHwgdXRpbHMuUGF0aC5jb250YWlucyh0YXJnZXQsIHNvdXJjZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvcHkgYW4gYXNzZXQgaW50byBvciBvdmVyIGl0c2VsZi5cXG5zb3VyY2U6ICR7c291cmNlfVxcbnRhcmdldDogJHt0YXJnZXR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGF3YWl0IGNvcHlBc3NldFNvdXJjZShzb3VyY2UsIHRhcmdldCwgb3B0aW9ucyk7XG4gICAgICAgIGxldCBjb3BpZWRBc3NldDogSUFzc2V0IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9yZWZyZXNoQXNzZXQodGFyZ2V0KTtcbiAgICAgICAgICAgIGNvcGllZEFzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHRhcmdldCk7XG4gICAgICAgICAgICBpZiAoIWNvcGllZEFzc2V0IHx8ICFjb3BpZWRBc3NldC5pbXBvcnRlZCB8fCBjb3BpZWRBc3NldC5pbnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgY29waWVkQXNzZXQ/LmltcG9ydEVycm9yIHx8IG5ldyBFcnJvcihgQ29weSBhc3NldCBmcm9tICR7c291cmNlfSB0byAke3RhcmdldH0gZmFpbGVkYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRyYW5zYWN0aW9uLnJvbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVmcmVzaEFzc2V0KGRpcm5hbWUodGFyZ2V0KSwgZmFsc2UpO1xuICAgICAgICAgICAgfSBjYXRjaCAocm9sbGJhY2tFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvbGxiYWNrTWVzc2FnZSA9IHJvbGxiYWNrRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IHJvbGxiYWNrRXJyb3IubWVzc2FnZSA6IFN0cmluZyhyb2xsYmFja0Vycm9yKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvcHkgYXNzZXQgZnJvbSAke3NvdXJjZX0gdG8gJHt0YXJnZXR9IGZhaWxlZCBhbmQgcm9sbGJhY2sgYWxzbyBmYWlsZWQ6ICR7cm9sbGJhY2tNZXNzYWdlfWAsIHsgY2F1c2U6IGVycm9yIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0cmFuc2FjdGlvbi5maW5hbGl6ZSgpO1xuICAgICAgICByZXR1cm4gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChjb3BpZWRBc3NldCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog55Sf5oiQ5a+85Ye65pWw5o2u5o6l5Y+j77yM5Li76KaB55So5LqO77ya6aKE6KeI44CB5p6E5bu66Zi25q61XG4gICAgICogQHBhcmFtIGFzc2V0IFxuICAgICAqIEBwYXJhbSBvcHRpb25zIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGdlbmVyYXRlRXhwb3J0RGF0YShhc3NldDogQXNzZXQsIG9wdGlvbnM/OiBJRXhwb3J0T3B0aW9ucyk6IFByb21pc2U8SUV4cG9ydERhdGEgfCBudWxsPiB7XG4gICAgICAgIC8vIDMuOC4zIOS7peS4iueJiOacrO+8jOi1hOa6kOWvvOWFpeWQjueahOaVsOaNruWwhuS8muiusOW9leWcqCBhc3NldC5vdXRwdXREYXRhIOWtl+auteWGhemDqFxuICAgICAgICBsZXQgb3V0cHV0RGF0YTogSUV4cG9ydERhdGEgPSBhc3NldC5nZXREYXRhKCdvdXRwdXQnKTtcbiAgICAgICAgaWYgKG91dHB1dERhdGEgJiYgIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXREYXRhO1xuICAgICAgICB9XG4gICAgICAgIC8vIDEu5LyY5YWI6LCD55So6LWE5rqQ5aSE55CG5Zmo5YaF55qE5a+85Ye66YC76L6RXG4gICAgICAgIC8vIOmcgOimgeazqOaEj++8jOeUseS6juacieexu+S8vOeahOeUqOazle+8jOWboOiAjCBhc3NldE1hbmFnZXIg5Y+q6IO95Zyo5p6E5bu66Zi25q615L2/55So77yM5peg5rOV5Zyo57uZ6LWE5rqQ5aSE55CG5Zmo5YaF6LCD55SoXG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBhc3NldEhhbmRsZXJNYW5hZ2VyLmdlbmVyYXRlRXhwb3J0RGF0YShhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIOm7mOiupOeahOWvvOWHuua1geeoi1xuICAgICAgICAvLyAyLjEg5peg5bqP5YiX5YyW5pWw5o2u55qE77yM6KeG5Li65byV5pOO6L+Q6KGM5pe25peg5rOV5pSv5oyB55qE6LWE5rqQ77yM5LiN5a+85Ye6XG4gICAgICAgIGlmICghYXNzZXQubWV0YS5maWxlcy5pbmNsdWRlcygnLmpzb24nKSAmJiAhYXNzZXQubWV0YS5maWxlcy5pbmNsdWRlcygnLmNjb25iJykpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIG91dHB1dERhdGEgPSBlbnN1cmVPdXRwdXREYXRhKGFzc2V0KTtcblxuICAgICAgICAvLyAyLjIg5peg5YW35L2T55qE5a+85Ye66YCJ6aG55oiW6ICF5a+85Ye65L+h5oGv5YaF5LiN5YyF5ZCr5bqP5YiX5YyW5pWw5o2u77yM5YiZ5L2/55So6buY6K6k55qE5a+85Ye65L+h5oGv5Y2z5Y+vXG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAhb3V0cHV0RGF0YS5uYXRpdmUpIHtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXREYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gMi4zIFRPRE8g5qC55o2u5LiN5ZCM55qEIG9wdGlvbnMg5p2h5Lu255Sf5oiQ5LiN5ZCM55qE5bqP5YiX5YyW57uT5p6cXG4gICAgICAgIC8vIGNvbnN0IGNhY2hlUGF0aCA9IGFzc2V0T3V0cHV0UGF0aENhY2hlLnF1ZXJ5KGFzc2V0LnV1aWQsIG9wdGlvbnMpO1xuICAgICAgICAvLyBpZiAoIWNhY2hlUGF0aCkge1xuICAgICAgICAvLyAgICAgY29uc3QgYXNzZXREYXRhID0gYXdhaXQgc2VyaWFsaXplQ29tcGlsZWQoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAvLyAgICAgYXdhaXQgb3V0cHV0RmlsZShvdXRwdXREYXRhLmltcG9ydC5wYXRoLCBhc3NldERhdGEpO1xuICAgICAgICAvLyAgICAgYXdhaXQgYXNzZXRPdXRwdXRQYXRoQ2FjaGUuYWRkKGFzc2V0LCBvcHRpb25zLCBvdXRwdXREYXRhLmltcG9ydC5wYXRoKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIG91dHB1dERhdGEuaW1wb3J0LnBhdGggPSBjYWNoZVBhdGg7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBhc3NldC5zZXREYXRhKCdvdXRwdXQnLCBvdXRwdXREYXRhKTtcbiAgICAgICAgcmV0dXJuIG91dHB1dERhdGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ou36LSd55Sf5oiQ5a+85YWl5paH5Lu25Yiw5pyA57uI55uu5qCH5Zyw5Z2A77yM5Li76KaB55So5LqO77ya5p6E5bu66Zi25q61XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gc3JjXG4gICAgICogQHBhcmFtIGRlc3RcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGFzeW5jIG91dHB1dEV4cG9ydERhdGEoaGFuZGxlcjogc3RyaW5nLCBzcmM6IElFeHBvcnREYXRhLCBkZXN0OiBJRXhwb3J0RGF0YSkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBhc3NldEhhbmRsZXJNYW5hZ2VyLm91dHB1dEV4cG9ydERhdGEoaGFuZGxlciwgc3JjLCBkZXN0KTtcbiAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgIGF3YWl0IGZzQ29weShzcmMuaW1wb3J0LnBhdGgsIGRlc3QuaW1wb3J0LnBhdGgpO1xuICAgICAgICAgICAgaWYgKHNyYy5uYXRpdmUgJiYgZGVzdC5uYXRpdmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYXRpdmVTcmM6IHN0cmluZ1tdID0gT2JqZWN0LnZhbHVlcyhzcmMubmF0aXZlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuYXRpdmVEZXN0OiBzdHJpbmdbXSA9IE9iamVjdC52YWx1ZXMoZGVzdC5uYXRpdmUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKG5hdGl2ZVNyYy5tYXAoKHBhdGgsIGkpID0+IGZzQ29weShwYXRoLCBuYXRpdmVEZXN0W2ldKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yi35paw5p+Q5Liq6LWE5rqQ5oiW5piv6LWE5rqQ55uu5b2VXG4gICAgICogQHBhcmFtIHBhdGhPclVybE9yVVVJRCBcbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgYXN5bmMgcmVmcmVzaEFzc2V0KHBhdGhPclVybE9yVVVJRDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgLy8g5bCG5a6e6ZmF55qE5Yi35paw5Lu75Yqh5aGe5YiwIGRiIOeuoeeQhuWZqOeahOmYn+WIl+WGheetieW+heaJp+ihjFxuICAgICAgICByZXR1cm4gYXdhaXQgYXNzZXREQk1hbmFnZXIuYWRkVGFzayh0aGlzLl9yZWZyZXNoQXNzZXQuYmluZCh0aGlzKSwgW3BhdGhPclVybE9yVVVJRF0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3JlZnJlc2hBc3NldChwYXRoT3JVcmxPclVVSUQ6IHN0cmluZywgYXV0b1JlZnJlc2hEaXIgPSB0cnVlKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgY29uc3QgcmVmcmVzaFRhcmdldCA9IHRoaXMuX3BhdGhUb0RiVXJsSWZJbnNpZGVBc3NldERCKHBhdGhPclVybE9yVVVJRCk7XG4gICAgICAgIGNvbnN0IHJlZnJlc2hEaXIgPSB0aGlzLl9kaXJuYW1lRm9yUmVmcmVzaChyZWZyZXNoVGFyZ2V0KTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVmcmVzaChyZWZyZXNoVGFyZ2V0KTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNhbiBub3QgZmluZCBhc3NldCAke3BhdGhPclVybE9yVVVJRH1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXV0b1JlZnJlc2hEaXIpIHtcbiAgICAgICAgICAgIC8vIEhBQ0sg5p+Q5Lqb5oOF5Ya15LiL5a+85YWl5Y6f5aeL6LWE5rqQ5ZCO77yM5paH5Lu25aS555qEIG10aW1lIOS8muWPkeeUn+WPmOWMlu+8jOWvvOiHtOi1hOa6kOmHj+Wkp+eahOaDheWGteS4i+S4i+asoeiOt+W+l+eEpueCueiHquWKqOWIt+aWsOaXtuS8muacieesrOS6jOasoeeahOaWh+S7tuWkueWkp+aJuemHj+WIt+aWsFxuICAgICAgICAgICAgLy8g55So6L+b5YWl6Zif5YiX55qE5pa55byP5omN6IO95L+d6ZqcIHBhdXNlIOetieacuuWItuS4jeS8muiiq+W9seWTjVxuICAgICAgICAgICAgYXdhaXQgYXNzZXREQk1hbmFnZXIuYWRkVGFzayhhc3NldERCTWFuYWdlci5hdXRvUmVmcmVzaEFzc2V0TGF6eS5iaW5kKGFzc2V0REJNYW5hZ2VyKSwgW3JlZnJlc2hEaXJdKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0aGlzLmF1dG9SZWZyZXNoQXNzZXRMYXp5KGRpcm5hbWUocGF0aE9yVXJsT3JVVUlEKSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYHJlZnJlc2ggYXNzZXQgJHtyZWZyZXNoRGlyfSBzdWNjZXNzYCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcGF0aFRvRGJVcmxJZkluc2lkZUFzc2V0REIocGF0aE9yVXJsT3JVVUlEOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHBhdGhUb0RiVXJsSWZBc3NldERCUGF0aChwYXRoT3JVcmxPclVVSUQsIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9pc1NhbWVGaWxlc3lzdGVtUGF0aChzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCFpc0Fic29sdXRlKHNvdXJjZSkgfHwgIWlzQWJzb2x1dGUodGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZSA9PT0gdGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vcm1hbGl6ZWRTb3VyY2UgPSB1dGlscy5QYXRoLm5vcm1hbGl6ZShzb3VyY2UpO1xuICAgICAgICBsZXQgbm9ybWFsaXplZFRhcmdldCA9IHV0aWxzLlBhdGgubm9ybWFsaXplKHRhcmdldCk7XG4gICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkU291cmNlID0gbm9ybWFsaXplZFNvdXJjZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgbm9ybWFsaXplZFRhcmdldCA9IG5vcm1hbGl6ZWRUYXJnZXQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub3JtYWxpemVkU291cmNlID09PSBub3JtYWxpemVkVGFyZ2V0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Rpcm5hbWVGb3JSZWZyZXNoKHBhdGhPclVybE9yVVVJRDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBkaXJuYW1lRm9yRGJVcmxPclBhdGgocGF0aE9yVXJsT3JVVUlEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDph43mlrDlr7zlhaXmn5DkuKrotYTmupBcbiAgICAgKiBAcGFyYW0gcGF0aE9yVXJsT3JVVUlEIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHJlaW1wb3J0QXNzZXQocGF0aE9yVXJsT3JVVUlEOiBzdHJpbmcpOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGFzc2V0REJNYW5hZ2VyLmFkZFRhc2sodGhpcy5fcmVpbXBvcnRBc3NldC5iaW5kKHRoaXMpLCBbcGF0aE9yVXJsT3JVVUlEXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVpbXBvcnRBc3NldChwYXRoT3JVcmxPclVVSUQ6IHN0cmluZyk6IFByb21pc2U8SUFzc2V0SW5mbz4ge1xuICAgICAgICAvLyDlupXlsYLnmoQgcmVpbXBvcnQg5LiN5pSv5oyB5a2Q6LWE5rqQ55qEIHVybCDmlLnkuLrkvb/nlKggdXVpZCDph43mlrDlr7zlhaVcbiAgICAgICAgaWYgKHBhdGhPclVybE9yVVVJRC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICBwYXRoT3JVcmxPclVVSUQgPSB1cmwydXVpZChwYXRoT3JVcmxPclVVSUQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHJlaW1wb3J0KHBhdGhPclVybE9yVVVJRCk7XG4gICAgICAgIGxldCBidXN5RGVhZGxpbmUgPSAwO1xuICAgICAgICB3aGlsZSAoIWFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0Fzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHBhdGhPclVybE9yVVVJRCk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0aW5nQXNzZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaXoOazleaJvuWIsOi1hOa6kCAke3BhdGhPclVybE9yVVVJRH0sIOivt+ajgOafpeWPguaVsOaYr+WQpuato+ehrmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVzeURlYWRsaW5lIHx8PSBEYXRlLm5vdygpICsgUkVJTVBPUlRfQlVTWV9USU1FT1VUX01TO1xuICAgICAgICAgICAgY29uc3QgcmVtYWluaW5nVGltZSA9IGJ1c3lEZWFkbGluZSAtIERhdGUubm93KCk7XG4gICAgICAgICAgICBpZiAocmVtYWluaW5nVGltZSA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWltcG9ydCBhc3NldCAke3BhdGhPclVybE9yVVVJRH0gdGltZWQgb3V0IHdhaXRpbmcgZm9yIHRoZSBjdXJyZW50IGltcG9ydCB0byBmaW5pc2hgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZXhpc3RpbmdBc3NldC5pbml0KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgd2FpdEZvckFzc2V0SW5pdChleGlzdGluZ0Fzc2V0LCByZW1haW5pbmdUaW1lLCBwYXRoT3JVcmxPclVVSUQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKERhdGUubm93KCkgPj0gYnVzeURlYWRsaW5lKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWltcG9ydCBhc3NldCAke3BhdGhPclVybE9yVVVJRH0gdGltZWQgb3V0IHdhaXRpbmcgZm9yIHRoZSBjdXJyZW50IGltcG9ydCB0byBmaW5pc2hgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzc2V0ID0gYXdhaXQgcmVpbXBvcnQocGF0aE9yVXJsT3JVVUlEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFzc2V0LmltcG9ydGVkIHx8IGFzc2V0LmludmFsaWQpIHtcbiAgICAgICAgICAgIHRocm93IGFzc2V0LmltcG9ydEVycm9yIHx8IG5ldyBFcnJvcihgUmVpbXBvcnQgYXNzZXQgJHthc3NldC5zb3VyY2V9IGZhaWxlZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3NldFF1ZXJ5LmVuY29kZUFzc2V0KGFzc2V0LCBBU1NFVF9UUkVFX0lORk9fREFUQV9LRVlTKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vliqjotYTmupBcbiAgICAgKiBAcGFyYW0gc291cmNlIOa6kOaWh+S7tueahCB1cmwg5oiW6ICF57ud5a+56Lev5b6EIGRiOi8vYXNzZXRzL2FiYy50eHRcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IOebruaghyB1cmwg5oiW6ICF57ud5a+56Lev5b6EIGRiOi8vYXNzZXRzL2EudHh0XG4gICAgICogQHBhcmFtIG9wdGlvbiDlr7zlhaXotYTmupDnmoTlj4LmlbAgeyBvdmVyd3JpdGUsIHh4eCwgcmVuYW1lIH1cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxJQXNzZXRJbmZvIHwgbnVsbD59XG4gICAgICovXG4gICAgYXN5bmMgbW92ZUFzc2V0KHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZywgb3B0aW9uPzogQXNzZXRPcGVyYXRpb25PcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGFzc2V0REJNYW5hZ2VyLmFkZFRhc2sodGhpcy5fbW92ZUFzc2V0LmJpbmQodGhpcyksIFtzb3VyY2UsIHRhcmdldCwgb3B0aW9uXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfbW92ZUFzc2V0KHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZywgb3B0aW9uPzogQXNzZXRPcGVyYXRpb25PcHRpb24pIHtcbiAgICAgICAgY29uc29sZS5kZWJ1Zyhgc3RhcnQgbW92ZSBhc3NldCBmcm9tICR7c291cmNlfSAtPiAke3RhcmdldH0uLi5gKTtcbiAgICAgICAgaWYgKHRhcmdldC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB1cmwycGF0aCh0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHNvdXJjZSk7XG4gICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYXNzZXQgaW4gc291cmNlIGZpbGUgJHtzb3VyY2V9IG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jaGVja1JlYWRvbmx5KGFzc2V0KTtcbiAgICAgICAgc291cmNlID0gYXNzZXQuc291cmNlO1xuICAgICAgICB0YXJnZXQgPSB0aGlzLl9jaGVja092ZXJ3cml0ZSh0YXJnZXQsIG9wdGlvbik7XG4gICAgICAgIGF3YWl0IG1vdmVBc3NldFNvdXJjZShzb3VyY2UsIHRhcmdldCwgb3B0aW9uKTtcblxuICAgICAgICBjb25zdCB1cmwgPSBxdWVyeVVybCh0YXJnZXQpO1xuICAgICAgICBjb25zdCByZWcgPSAvZGI6XFwvXFwvW14vXSsvLmV4ZWModXJsKTtcbiAgICAgICAgLy8g5bi46KeE55qE6LWE5rqQ56e75Yqo77ya5pyf5pyb5Y+q5pyJIGNoYW5nZSDmtojmga9cbiAgICAgICAgaWYgKHJlZyAmJiByZWdbMF0gJiYgdXJsLnN0YXJ0c1dpdGgocmVnWzBdKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQXNzZXQodGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIOWboOS4uuaWh+S7tuiiq+enu+i1sOS5i+WQju+8jOaWh+S7tuWkueeahCBtdGltZSDkvJrlj5jljJbvvIzmiYDku6XopoHkuLvliqjliLfmlrDkuIDmrKHooqvnp7votbDmlofku7bnmoTmlofku7blpLlcbiAgICAgICAgICAgIC8vIOW/hemhu+WcqOebruagh+S9jee9ruaWh+S7tuWIt+aWsOWujOaIkOWQjuWGjeWIt+aWsO+8jOWmguaenOaUvuWIsOWJjemdou+8jOS8muWvvOiHtOWFiOivhuWIq+WIsOaWh+S7tuiiq+WIoOmZpO+8jOinpuWPkSBkZWxldGUg5ZCO5YaN5Y+R6YCBIGFkZFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQXNzZXQoZGlybmFtZShzb3VyY2UpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOi3qOaVsOaNruW6k+enu+WKqOi1hOa6kOaIluiAheimhuebluaTjeS9nOaXtumcgOimgeWFiOWIt+ebruagh+aWh+S7tu+8jOinpuWPkSBkZWxldGUg5ZCO5YaN5Y+R6YCBIGFkZFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQXNzZXQoc291cmNlKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaEFzc2V0KHRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgbW92ZSBhc3NldCBmcm9tICR7c291cmNlfSAtPiAke3RhcmdldH0gc3VjY2Vzc2ApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmHjeWRveWQjeafkOS4qui1hOa6kFxuICAgICAqIEBwYXJhbSBzb3VyY2UgXG4gICAgICogQHBhcmFtIG5ld05hbWVcbiAgICAgKi9cbiAgICBhc3luYyByZW5hbWVBc3NldChzb3VyY2U6IHN0cmluZywgbmV3TmFtZTogc3RyaW5nLCBvcHRpb24/OiBBc3NldE9wZXJhdGlvbk9wdGlvbikge1xuICAgICAgICByZXR1cm4gYXdhaXQgYXNzZXREQk1hbmFnZXIuYWRkVGFzayh0aGlzLl9yZW5hbWVBc3NldC5iaW5kKHRoaXMpLCBbc291cmNlLCBuZXdOYW1lLCBvcHRpb25dKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9yZW5hbWVBc3NldChzb3VyY2U6IHN0cmluZywgbmV3TmFtZTogc3RyaW5nLCBvcHRpb24/OiBBc3NldE9wZXJhdGlvbk9wdGlvbikge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBzdGFydCByZW5hbWUgYXNzZXQgZnJvbSAke3NvdXJjZX0gLT4gJHtuZXdOYW1lfS4uLmApO1xuICAgICAgICBjb25zdCBhc3NldCA9IGFzc2V0UXVlcnkucXVlcnlBc3NldChzb3VyY2UpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFzc2V0IGluIHNvdXJjZSBmaWxlICR7c291cmNlfSBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY2hlY2tSZWFkb25seShhc3NldCk7XG4gICAgICAgIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgdGhpcy5fY2hlY2tFeGlzdHMoc291cmNlKTtcbiAgICAgICAgdGhpcy5fY2hlY2tSZW5hbWVOZXdOYW1lKGFzc2V0LCBuZXdOYW1lKTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gam9pbihkaXJuYW1lKHNvdXJjZSksIG5ld05hbWUpO1xuICAgICAgICB0YXJnZXQgPSB0aGlzLl9jaGVja092ZXJ3cml0ZSh0YXJnZXQsIG9wdGlvbik7XG4gICAgICAgIC8vIOa6kOWcsOWdgOS4jeiDveiiq+ebruagh+WcsOWdgOWMheWQq++8jOS5n+S4jeiDveebuOetiVxuICAgICAgICBpZiAodGFyZ2V0LnN0YXJ0c1dpdGgoam9pbihzb3VyY2UsICcvJykpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aTE4bi50KCdhc3NldHMucmVuYW1lX2Fzc2V0LmZhaWwucGFyZW50Jyl9IFxcbnNvdXJjZTogJHtzb3VyY2V9XFxudGFyZ2V0OiAke3RhcmdldH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRlbXAgPSBqb2luKGRpcm5hbWUodGFyZ2V0KSwgJy5yZW5hbWVfdGVtcCcpO1xuXG4gICAgICAgIC8vIOaUueWIsOS4tOaXtui3r+W+hO+8jOeEtuWQjuWIt+aWsO+8jOWIoOmZpOWOn+adpeeahOe8k+WtmFxuICAgICAgICBhd2FpdCByZW5hbWVQYXRoKHNvdXJjZSArICcubWV0YScsIHRlbXAgKyAnLm1ldGEnKTtcbiAgICAgICAgYXdhaXQgcmVuYW1lUGF0aChzb3VyY2UsIHRlbXApO1xuICAgICAgICBhd2FpdCB0aGlzLl9yZWZyZXNoQXNzZXQoc291cmNlLCBmYWxzZSk7XG5cbiAgICAgICAgLy8g5pS55Li655yf5q2j55qE6Lev5b6E77yM54S25ZCO5Yi35paw77yM55So5paw5ZCN5a2X6YeN5paw5a+85YWlXG4gICAgICAgIGF3YWl0IHJlbmFtZVBhdGgodGVtcCArICcubWV0YScsIHRhcmdldCArICcubWV0YScpO1xuICAgICAgICBhd2FpdCByZW5hbWVQYXRoKHRlbXAsIHRhcmdldCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3JlZnJlc2hBc3NldCh0YXJnZXQpO1xuICAgICAgICAvLyBUT0RPIOi/lOWbnui1hOa6kOS/oeaBr1xuICAgICAgICBjb25zb2xlLmRlYnVnKGByZW5hbWUgYXNzZXQgZnJvbSAke3NvdXJjZX0gLT4gJHt0YXJnZXR9IHN1Y2Nlc3NgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vpmaTotYTmupBcbiAgICAgKiBAcGFyYW0gcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyByZW1vdmVBc3NldCh1dWlkT3JVUkxPclBhdGg6IHN0cmluZywgb3B0aW9uczogRGVsZXRlQXNzZXRPcHRpb25zID0geyB1c2VUcmFzaDogdHJ1ZSB9KTogUHJvbWlzZTxJQXNzZXRJbmZvIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBhc3NldCA9IGFzc2V0UXVlcnkucXVlcnlBc3NldCh1dWlkT3JVUkxPclBhdGgpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aTE4bi50KCdhc3NldHMuZGVsZXRlX2Fzc2V0LmZhaWwudW5leGlzdCcpfSBcXG5zb3VyY2U6ICR7dXVpZE9yVVJMT3JQYXRofWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NoZWNrUmVhZG9ubHkoYXNzZXQpO1xuXG4gICAgICAgIGlmIChhc3NldC5fcGFyZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOWtkOi1hOa6kOaXoOazleWNleeLrOWIoOmZpO+8jOivt+S8oOmAkueItui1hOa6kOeahCBVUkwg5Zyw5Z2AYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGF0aCA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgYXNzZXREQk1hbmFnZXIuYWRkVGFzayh0aGlzLl9yZW1vdmVBc3NldC5iaW5kKHRoaXMpLCBbcGF0aCwgb3B0aW9uc10pO1xuICAgICAgICByZXR1cm4gcmVzID8gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChhc3NldCkgOiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3JlbW92ZUFzc2V0KHBhdGg6IHN0cmluZywgb3B0aW9uczogRGVsZXRlQXNzZXRPcHRpb25zID0geyB1c2VUcmFzaDogdHJ1ZSB9KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGxldCByZXMgPSBmYWxzZTtcbiAgICAgICAgYXdhaXQgcmVtb3ZlQXNzZXRTb3VyY2UocGF0aCwgeyB1c2VUcmFzaDogb3B0aW9ucy51c2VUcmFzaCAhPT0gZmFsc2UgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaEFzc2V0KHBhdGgpO1xuICAgICAgICByZXMgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGByZW1vdmUgYXNzZXQgJHtwYXRofSBzdWNjZXNzYCk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgYXNzZXRPcGVyYXRpb24gPSBuZXcgQXNzZXRPcGVyYXRpb24oKTtcbmV4cG9ydCBkZWZhdWx0IGFzc2V0T3BlcmF0aW9uO1xuXG4vKipcbiAqIOenu+WKqOaWh+S7tlxuICogQHBhcmFtIGZpbGVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlKHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZywgb3B0aW9ucz86IElNb3ZlT3B0aW9ucykge1xuXG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLm92ZXJ3cml0ZSkge1xuICAgICAgICBvcHRpb25zID0geyBvdmVyd3JpdGU6IGZhbHNlIH07IC8vIGZzIG1vdmUg6KaB5rGC5a6e5Y+CIG9wdGlvbnMg6KaB5pyJ5YC8XG4gICAgfVxuICAgIGNvbnN0IHRlbXBEaXIgPSBqb2luKGFzc2V0Q29uZmlnLmRhdGEudGVtcFJvb3QsICdtb3ZlLXRlbXAnKTtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShhc3NldENvbmZpZy5kYXRhLnJvb3QsIHRhcmdldCk7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKCF1dGlscy5QYXRoLmNvbnRhaW5zKHNvdXJjZSwgdGFyZ2V0KSkge1xuICAgICAgICAgICAgYXdhaXQgbW92ZShzb3VyY2UgKyAnLm1ldGEnLCB0YXJnZXQgKyAnLm1ldGEnLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTsgLy8gbWV0YSDlhYjnp7vliqhcbiAgICAgICAgICAgIGF3YWl0IG1vdmUoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFzc2V0cy9zY3JpcHRzL3NjcmlwdHMgLT4gYXNzZXRzL3NjcmlwdHMg55u05o6l5pON5L2c5Lya5oql6ZSZ77yM6ZyA6KaB5YiG5qyh5omn6KGMXG4gICAgICAgIC8vIOa4heepuuS4tOaXtuebruW9lVxuICAgICAgICBhd2FpdCByZW1vdmUoam9pbih0ZW1wRGlyLCByZWxhdGl2ZVBhdGgpKTtcbiAgICAgICAgYXdhaXQgcmVtb3ZlKGpvaW4odGVtcERpciwgcmVsYXRpdmVQYXRoKSArICcubWV0YScpO1xuXG4gICAgICAgIC8vIOWFiOenu+WKqOWIsOS4tOaXtuebruW9lVxuICAgICAgICBhd2FpdCBtb3ZlKHNvdXJjZSArICcubWV0YScsIGpvaW4odGVtcERpciwgcmVsYXRpdmVQYXRoKSArICcubWV0YScsIHsgb3ZlcndyaXRlOiB0cnVlIH0pOyAvLyBtZXRhIOWFiOenu+WKqFxuICAgICAgICBhd2FpdCBtb3ZlKHNvdXJjZSwgam9pbih0ZW1wRGlyLCByZWxhdGl2ZVBhdGgpLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcblxuICAgICAgICAvLyDlho3np7vliqjliLDnm67moIfnm67lvZVcbiAgICAgICAgYXdhaXQgbW92ZShqb2luKHRlbXBEaXIsIHJlbGF0aXZlUGF0aCkgKyAnLm1ldGEnLCB0YXJnZXQgKyAnLm1ldGEnLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTsgLy8gbWV0YSDlhYjnp7vliqhcbiAgICAgICAgYXdhaXQgbW92ZShqb2luKHRlbXBEaXIsIHJlbGF0aXZlUGF0aCksIHRhcmdldCwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgZGIgbW92ZUZpbGUgZnJvbSAke3NvdXJjZX0gLT4gJHt0YXJnZXR9IGZhaWwhYCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbn1cbiJdfQ==