"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageServiceAdapter = exports.LanguageServiceHostAdapter = exports.ParseConfigFileHostAdapter = exports.VirtualIOAdapter = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const typescript_1 = __importDefault(require("typescript"));
const cache_1 = require("../shared/cache");
const command_1 = require("./command");
const asserts_1 = require("../utils/asserts");
const query_shared_settings_1 = require("../shared/query-shared-settings");
/**
 * 这个类用来处理内存中的文件
 */
class VirtualIOAdapter {
    _fileCache = cache_1.tsScriptAssetCache;
    constructor() {
    }
    /** 如果内存中有这部分内容则优先使用内存的 */
    readFile(filePath) {
        if (filePath === LanguageServiceHostAdapter.defaultLibFileName) {
            return undefined;
        }
        const cache = this.readCache(filePath);
        let content;
        if (cache?.content) {
            content = cache.content;
        }
        else {
            try {
                content = (0, fs_extra_1.readFileSync)(filePath, 'utf8');
                const info = this._fileCache.get(filePath);
                (0, asserts_1.asserts)(info);
                const nowMtimeMs = (0, fs_extra_1.statSync)(filePath).mtimeMs;
                this.writeCache({ filePath, uuid: info.uuid, content, version: nowMtimeMs.toString() });
            }
            catch (error) {
                console.debug(error);
            }
        }
        return content;
    }
    /**从内存加载脚本信息 */
    readCache(filePath) {
        return this._fileCache.get(filePath);
    }
    removeCache(filePath) {
        return this._fileCache.delete(filePath);
    }
    /** 将文件写入至内存 */
    writeCache({ uuid, content, version, filePath }) {
        this._fileCache.set(filePath, { filePath, uuid, content, version });
    }
    fileExists(path) {
        return (0, fs_extra_1.existsSync)(path);
    }
    getFileNames() {
        return Array.from(cache_1.tsScriptAssetCache.keys());
    }
}
exports.VirtualIOAdapter = VirtualIOAdapter;
class ParseConfigFileHostAdapter extends VirtualIOAdapter {
    _currentDirectory;
    constructor(_currentDirectory) {
        super();
        this._currentDirectory = _currentDirectory;
    }
    getCurrentDirectory() {
        return this._currentDirectory;
    }
    useCaseSensitiveFileNames = true;
    readDirectory(rootDir, extensions, excludes, includes, depth) {
        return this.getFileNames();
    }
    onUnRecoverableConfigFileDiagnostic(...args) {
        console.error(...args);
    }
}
exports.ParseConfigFileHostAdapter = ParseConfigFileHostAdapter;
class LanguageServiceHostAdapter extends VirtualIOAdapter {
    _parseConfigFileHost;
    _tsconfigPath;
    _currentDirectory;
    _compilerOptions;
    static defaultLibFileName = '__DEFAULT_LIB_FILE_NAME_IS_NEVER_EXIST.d.ts';
    constructor(_parseConfigFileHost, _tsconfigPath, _currentDirectory, _compilerOptions) {
        super();
        this._parseConfigFileHost = _parseConfigFileHost;
        this._tsconfigPath = _tsconfigPath;
        this._currentDirectory = _currentDirectory;
        this._compilerOptions = _compilerOptions;
    }
    getCompilationSettings() {
        return this._compilerOptions;
    }
    getScriptFileNames() {
        return this.getFileNames().slice();
    }
    getScriptVersion(fileName) {
        return this.readCache(fileName)?.version ?? '';
    }
    getScriptSnapshot(fileName) {
        const file = this.readFile(fileName);
        return file && typescript_1.default.ScriptSnapshot.fromString(file) || undefined;
    }
    getCurrentDirectory() {
        return this._currentDirectory;
    }
    getDefaultLibFileName(options) {
        return LanguageServiceHostAdapter.defaultLibFileName;
    }
    useCaseSensitiveFileNames() {
        return this._parseConfigFileHost.useCaseSensitiveFileNames;
    }
}
exports.LanguageServiceHostAdapter = LanguageServiceHostAdapter;
class LanguageServiceAdapter {
    _tsconfigPath;
    _currentDirectory;
    _beforeBuildDelegate;
    _compilerOptions;
    dbURLInfos;
    languageService;
    host;
    autoUpdateFileImport;
    _parseConfigFileHost;
    /** 命令队列 */
    _awaitCommandQueue = [];
    /** 正在执行的命令 */
    _executingCommandID = '';
    _changedFileSet = new Set();
    _afterOutputTasks = [];
    constructor(_tsconfigPath, _currentDirectory, 
    /** 外部提供一个委托，这里注入委托，主要防止重复编译 */
    _beforeBuildDelegate, _compilerOptions, dbURLInfos) {
        this._tsconfigPath = _tsconfigPath;
        this._currentDirectory = _currentDirectory;
        this._beforeBuildDelegate = _beforeBuildDelegate;
        this._compilerOptions = _compilerOptions;
        this.dbURLInfos = dbURLInfos;
        this._parseConfigFileHost = new ParseConfigFileHostAdapter(_currentDirectory);
        this.host = new LanguageServiceHostAdapter(this._parseConfigFileHost, this._tsconfigPath, this._currentDirectory, this._compilerOptions);
        this.languageService = typescript_1.default.createLanguageService(this.host, undefined, typescript_1.default.LanguageServiceMode.Semantic);
        this._beforeBuildDelegate.add(async (assetChanges) => {
            assetChanges.forEach(item => item.oldFilePath && item.newFilePath && this.requestRenameFile(item.oldFilePath, item.newFilePath));
            await this.finishCommand(assetChanges);
        });
    }
    isExecuting(commandID) {
        if (this._executingCommandID === commandID || this._awaitCommandQueue.some(item => item.command.id === commandID)) {
            return true;
        }
        return false;
    }
    get isBusy() {
        return Boolean(this._executingCommandID);
    }
    async executeCommand(command) {
        if (this.isExecuting(command.id)) {
            return;
        }
        if (this._executingCommandID) {
            await new Promise((resolve, reject) => {
                this._awaitCommandQueue.push({
                    command,
                    resolveAwait: resolve,
                });
            });
        }
        this._executingCommandID = command.id;
        const result = await command.execute(this);
        for (const iterator of result.values()) {
            this._changedFileSet.add(iterator);
        }
        const nextCommand = this._awaitCommandQueue.shift();
        if (nextCommand) {
            nextCommand.resolveAwait(void 0);
        }
        else {
            await this.outPutFiles(this._changedFileSet);
            this._executingCommandID = '';
            this._changedFileSet.clear();
            // 从生成文件的过程中会注入命令，
            const nextCommand = this._awaitCommandQueue.shift();
            if (nextCommand) {
                nextCommand.resolveAwait(void 0);
            }
        }
    }
    /** 请求更新路径 */
    async requestRenameFile(oldFilePath, newFilePath) {
        if (oldFilePath && newFilePath && oldFilePath.endsWith('.ts') && newFilePath.endsWith('.ts') || !(0, path_1.extname)(oldFilePath)) {
            if (oldFilePath === newFilePath) {
                return;
            }
            if (this.autoUpdateFileImport === undefined) {
                this.autoUpdateFileImport = await query_shared_settings_1.scriptConfig.getProject('updateAutoUpdateImportConfig');
            }
            if (this.autoUpdateFileImport) {
                console.debug('Starting rename...');
                await this.executeCommand(new command_1.RenameCommand(oldFilePath, newFilePath));
                console.debug('Finish rename.');
            }
        }
    }
    applyChanges(text, changes) {
        for (let i = changes.length - 1; i >= 0; i--) {
            const { span, newText } = changes[i];
            text = `${text.substring(0, span.start)}${newText}${text.substring(this.textSpanEnd(span))}`;
        }
        return text;
    }
    /** 将缓存中的数据生成到位置 */
    async outPutFiles(fileNameSet) {
        const arr = Array.from(fileNameSet.values());
        await Promise.all(arr.map(async (file) => {
            try {
                const cache = this.host.readCache(file);
                if (!cache?.content) {
                    console.debug('There\'s nothing in the cache');
                    return;
                }
                await (0, fs_extra_1.writeFile)(file, cache?.content, { encoding: 'utf8' });
            }
            catch (error) {
                console.debug(`Failed to update script ${file}`, error);
            }
        }));
        while (this._afterOutputTasks.length) {
            const task = this._afterOutputTasks.shift();
            if (task) {
                task();
            }
        }
        this.clearCache();
    }
    clearCache() {
        cache_1.tsScriptAssetCache.forEach(item => item.content = undefined);
    }
    textSpanEnd(span) {
        return span.start + span.length;
    }
    async finishCommand(assetChanges) {
        return new Promise((resolve, reject) => {
            if (this.isBusy) {
                this._afterOutputTasks.push(resolve);
            }
            else {
                resolve();
            }
        });
    }
}
exports.LanguageServiceAdapter = LanguageServiceAdapter;
