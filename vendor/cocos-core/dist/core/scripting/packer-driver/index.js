"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackerDriver = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const url_1 = require("url");
const perf_hooks_1 = require("perf_hooks");
const prerequisite_imports_1 = require("./prerequisite-imports");
const utils_1 = require("@cocos/lib-programming/dist/utils");
const ccbuild_1 = require("@cocos/ccbuild");
const asserts_1 = require("../utils/asserts");
const query_shared_settings_1 = require("../shared/query-shared-settings");
const quick_pack_1 = require("@cocos/creator-programming-quick-pack/lib/quick-pack");
const mod_lo_1 = require("@cocos/creator-programming-mod-lo/lib/mod-lo");
const asset_db_interop_1 = require("./asset-db-interop");
const asset_db_1 = require("@cocos/asset-db");
const logger_1 = require("./logger");
const language_service_1 = require("../language-service");
const delegate_1 = require("../utils/delegate");
const json5_1 = __importDefault(require("json5"));
const fs_1 = require("fs");
const utils_2 = require("../../assets/utils");
const utils_3 = require("../../builder/worker/builder/utils");
const intelligence_1 = require("../intelligence");
const event_emitter_1 = require("../event-emitter");
const path_2 = __importDefault(require("path"));
const VERSION = '20';
const featureUnitModulePrefix = 'cce:/internal/x/cc-fu/';
function getEditorPatterns(dbInfos) {
    const editorPatterns = [];
    for (const info of dbInfos) {
        const dbEditorPattern = path_1.default.join(info.target, '**', 'editor', '**/*');
        editorPatterns.push(dbEditorPattern);
    }
    return editorPatterns;
}
function getCCEModuleIDs(cceModuleMap) {
    return Object.keys(cceModuleMap).filter(id => id !== 'mapLocation');
}
async function wrapToSetImmediateQueue(thiz, fn, ...args) {
    return new Promise((resolve, reject) => {
        // 注意：Editor.Message.broadcast 内部会使用 setImmediate 延时广播事件。
        // 如果在 broadcast 之后调用了比较耗时的操作，那么消息会在耗时操作后才被收到。
        // 因此这里使用 setImmediate 来转换同步函数为异步，保证转换的函数在 broadcast 消息被收到后再执行。
        setImmediate(() => {
            try {
                resolve(fn.apply(thiz, args));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
/**
 * Packer 驱动器。
 * - 底层用 QuickPack 快速打包模块相关的资源。
 * - 产出是可以进行加载的模块资源，包括模块、Source map等；需要使用 QuickPackLoader 对这些模块资源进行加载和访问。
 */
class PackerDriver {
    languageService = null;
    static _instance = null;
    static getInstance() {
        (0, asserts_1.asserts)(PackerDriver._instance, 'PackerDriver is not created yet. Please call PackerDriver.create first.');
        return PackerDriver._instance;
    }
    /**
     * 创建 Packer 驱动器。
     */
    static async create(projectPath, engineTsPath) {
        await query_shared_settings_1.scriptConfig.init();
        const tsBuilder = new intelligence_1.TypeScriptConfigBuilder(projectPath, engineTsPath);
        PackerDriver._cceModuleMap = PackerDriver.queryCCEModuleMap();
        const baseWorkspace = path_1.default.join(tsBuilder.getTempPath(), 'programming', 'packer-driver');
        const versionFile = path_1.default.join(baseWorkspace, 'VERSION');
        const targetWorkspaceBase = path_1.default.join(baseWorkspace, 'targets');
        const debugLogFile = path_1.default.join(baseWorkspace, 'logs', 'debug.log');
        const targets = {};
        const verbose = true;
        if (await fs_extra_1.default.pathExists(debugLogFile)) {
            try {
                await fs_extra_1.default.unlink(debugLogFile);
            }
            catch (err) {
                console.warn(`Failed to reset log file: ${debugLogFile}`);
            }
        }
        const logger = new logger_1.PackerDriverLogger(debugLogFile);
        logger.debug(new Date().toLocaleString());
        logger.debug(`Project: ${projectPath}`);
        logger.debug(`Targets: ${Object.keys(predefinedTargets)}`);
        const incrementalRecord = await PackerDriver._createIncrementalRecord(logger);
        await PackerDriver._validateIncrementalRecord(incrementalRecord, versionFile, targetWorkspaceBase, logger);
        const loadMappings = {
            'cce:/internal/code-quality/': (0, url_1.pathToFileURL)(path_1.default.join(__dirname, '../..', '..', '..', 'static', 'scripting', 'builtin-mods', 'code-quality', '/')).href,
        };
        const statsQuery = await ccbuild_1.StatsQuery.create(engineTsPath);
        const emptyEngineIndexModuleSource = statsQuery.evaluateIndexModuleSource([]);
        const crOptions = {
            moduleRequestFilter: [/^cc\.?.*$/g],
            reporter: {
                moduleName: 'cce:/internal/code-quality/cr.mjs',
                functionName: 'report',
            },
        };
        for (const [targetId, target] of Object.entries(predefinedTargets)) {
            logger.debug(`Initializing target [${target.name}]`);
            const modLoExternals = [
                'cc/env',
                'cc/userland/macro',
                ...getCCEModuleIDs(PackerDriver._cceModuleMap), // 设置编辑器导出的模块为外部模块
            ];
            modLoExternals.push(...statsQuery.getFeatureUnits().map((featureUnit) => `${featureUnitModulePrefix}${featureUnit}`));
            let browsersListTargets = target.browsersListTargets;
            if (targetId === 'preview' && incrementalRecord.config.previewTarget) {
                browsersListTargets = incrementalRecord.config.previewTarget;
                logger.debug(`Use specified preview browserslist target: ${browsersListTargets}`);
            }
            const modLo = new mod_lo_1.ModLo({
                targets: browsersListTargets,
                loose: incrementalRecord.config.loose,
                guessCommonJsExports: incrementalRecord.config.guessCommonJsExports,
                useDefineForClassFields: incrementalRecord.config.useDefineForClassFields,
                allowDeclareFields: incrementalRecord.config.allowDeclareFields,
                cr: crOptions,
                _compressUUID(uuid) {
                    return (0, utils_3.compressUuid)(uuid, false);
                },
                logger,
                checkObsolete: true,
                importRestrictions: PackerDriver._importRestrictions,
                preserveSymlinks: incrementalRecord.config.preserveSymlinks,
            });
            modLo.setExtraExportsConditions(incrementalRecord.config.exportsConditions);
            modLo.setExternals(modLoExternals);
            modLo.setLoadMappings(loadMappings);
            const targetWorkspace = path_1.default.join(targetWorkspaceBase, targetId);
            const quickPack = new quick_pack_1.QuickPack({
                modLo,
                origin: projectPath,
                workspace: targetWorkspace,
                logger,
                verbose,
            });
            logger.debug('Loading cache');
            const t1 = perf_hooks_1.performance.now();
            await quickPack.loadCache();
            const t2 = perf_hooks_1.performance.now();
            logger.debug(`Loading cache costs ${t2 - t1}ms.`);
            let engineIndexModule;
            if (target.isEditor) {
                const features = await PackerDriver._getEngineFeaturesShippedInEditor(statsQuery);
                logger.debug(`Engine features shipped in editor: ${features}`);
                engineIndexModule = {
                    source: PackerDriver._getEngineIndexModuleSource(statsQuery, features),
                    respectToFeatureSetting: false,
                };
            }
            else {
                engineIndexModule = {
                    source: emptyEngineIndexModuleSource,
                    respectToFeatureSetting: true,
                };
            }
            const quickPackLoaderContext = quickPack.createLoaderContext();
            targets[targetId] = new PackTarget({
                name: targetId,
                modLo,
                sourceMaps: target.sourceMaps,
                quickPack,
                quickPackLoaderContext,
                logger,
                engineIndexModule,
                tentativePrerequisiteImportsMod: target.isEditor ?? false,
                userImportMap: incrementalRecord.config.importMap ? {
                    json: incrementalRecord.config.importMap.json,
                    url: new url_1.URL(incrementalRecord.config.importMap.url),
                } : undefined,
            });
        }
        const packer = new PackerDriver(tsBuilder, targets, statsQuery, logger);
        PackerDriver._instance = packer;
        return packer;
    }
    static queryCCEModuleMap() {
        const cceModuleMapLocation = path_1.default.join(__dirname, '../../../../static/scripting/cce-module.jsonc');
        const cceModuleMap = json5_1.default.parse(fs_extra_1.default.readFileSync(cceModuleMapLocation, 'utf8'));
        cceModuleMap.mapLocation = cceModuleMapLocation;
        return cceModuleMap;
    }
    /**构建任务的委托，在构建之前会把委托里面的所有内容执行 */
    beforeEditorBuildDelegate = new delegate_1.AsyncDelegate();
    busy() {
        return this._building;
    }
    async updateDbInfos(dbInfo, dbChangeType) {
        const oldDbInfoSize = this._dbInfos.length;
        if (dbChangeType === asset_db_interop_1.DBChangeType.add) {
            if (!this._dbInfos.some(item => item.dbID === dbInfo.dbID)) {
                this._dbInfos.push(dbInfo);
            }
        }
        else if (dbChangeType === asset_db_interop_1.DBChangeType.remove) {
            this._dbInfos = this._dbInfos.filter(item => item.dbID !== dbInfo.dbID);
            const scriptInfos = this._assetDbInterop.removeTsScriptInfoCache(dbInfo.target);
            scriptInfos.forEach((info) => {
                this._assetChangeQueue.push({
                    type: asset_db_1.AssetActionEnum.delete,
                    importer: 'typescript',
                    filePath: info.filePath,
                    uuid: info.uuid,
                    isPluginScript: info.isPluginScript,
                    url: info.url,
                });
            });
        }
        if (oldDbInfoSize === this._dbInfos.length) {
            return;
        }
        const self = this;
        const update = async () => {
            const assetDatabaseDomains = await this._assetDbInterop.queryAssetDomains(this._dbInfos);
            self._logger.debug('Reset databases. ' +
                `Enumerated domains: ${JSON.stringify(assetDatabaseDomains, undefined, 2)}`);
            const tsBuilder = self._tsBuilder;
            tsBuilder.setDbURLInfos(this._dbInfos);
            const realTsConfigPath = tsBuilder.getRealTsConfigPath();
            const projectPath = tsBuilder.getProjectPath();
            const compilerOptions = await tsBuilder.getCompilerOptions();
            const internalDbURLInfos = await tsBuilder.getInternalDbURLInfos();
            self.languageService = new language_service_1.LanguageServiceAdapter(realTsConfigPath, projectPath, self.beforeEditorBuildDelegate, compilerOptions, internalDbURLInfos);
            for (const target of Object.values(this._targets)) {
                target.updateDbInfos(this._dbInfos);
                await target.setAssetDatabaseDomains(assetDatabaseDomains);
            }
        };
        if (this.busy()) {
            this._beforeBuildTasks.push(() => {
                update();
            });
        }
        else {
            await update();
        }
    }
    dispatchAssetChanges(assetChange) {
        this._assetDbInterop.onAssetChange(assetChange);
    }
    /**
     * 从 asset-db 获取所有数据并构建，包含 ts 和 js 脚本。
     * AssetChange format:
     *  {
     *      type: AssetChangeType.add,
            uuid: assetInfo.uuid,
            filePath: assetInfo.file,
            url: getURL(assetInfo),
            isPluginScript: isPluginScript(meta || assetInfo.meta!),
     *  }
     * @param assetChanges 资源变更列表
     * @param taskId 任务ID，用于跟踪任务状态
     */
    async build(changeInfos, taskId) {
        const logger = this._logger;
        logger.debug('Pulling asset-db.');
        const t1 = perf_hooks_1.performance.now();
        if (changeInfos && changeInfos.length > 0) {
            changeInfos.forEach(changeInfo => {
                this._assetDbInterop.onAssetChange(changeInfo);
            });
        }
        const pendingChanges = this._assetDbInterop.getAssetChangeQueue();
        if (pendingChanges.length > 0) {
            this._assetChangeQueue.push(...pendingChanges);
            this._assetDbInterop.resetAssetChangeQueue();
        }
        const t2 = perf_hooks_1.performance.now();
        logger.debug(`Fetch asset-db cost: ${t2 - t1}ms.`);
        await this._startBuild(taskId);
    }
    async clearCache() {
        if (this._clearing) {
            this._logger.debug('Failed to clear cache: previous clearing have not finished yet.');
            return;
        }
        if (this.busy()) {
            this._logger.error('Failed to clear cache: the building is still working in progress.');
            return;
        }
        this._clearing = true;
        for (const [name, target] of Object.entries(this._targets)) {
            this._logger.debug(`Clear cache of target ${name}`);
            await target.clearCache();
        }
        this._logger.debug('Request build after clearing...');
        await this.build([]);
        this._clearing = false;
    }
    getQuickPackLoaderContext(targetName) {
        this._warnMissingTarget(targetName);
        if (targetName in this._targets) {
            return this._targets[targetName].quickPackLoaderContext;
        }
        else {
            return undefined;
        }
    }
    isReady(targetName) {
        this._warnMissingTarget(targetName);
        if (targetName in this._targets) {
            return this._targets[targetName].ready;
        }
        else {
            return undefined;
        }
    }
    /**
     * 获取当前正在执行的编译任务ID
     * @returns 任务ID，如果没有正在执行的任务则返回null
     */
    getCurrentTaskId() {
        return this._currentTaskId;
    }
    queryScriptDeps(queryPath) {
        const scriptPath = path_2.default.normalize(queryPath).replace(/\\/g, '/');
        this._transformDepsGraph();
        if (this._depsGraphCache[scriptPath]) {
            return Array.from(this._depsGraphCache[scriptPath]);
        }
        return [];
    }
    queryScriptUsers(queryPath) {
        const scriptPath = path_2.default.normalize(queryPath).replace(/\\/g, '/');
        this._transformDepsGraph();
        if (this._usedGraphCache[scriptPath]) {
            return Array.from(this._usedGraphCache[scriptPath]);
        }
        return [];
    }
    async shutDown() {
        await this.destroyed();
    }
    _dbInfos = [];
    _tsBuilder;
    _clearing = false;
    _targets = {};
    _logger;
    _statsQuery;
    _assetDbInterop;
    _assetChangeQueue = [];
    _building = false;
    _featureChanged = false;
    _beforeBuildTasks = [];
    _depsGraph = {};
    _needUpdateDepsCache = false;
    _usedGraphCache = {};
    _depsGraphCache = {};
    static _cceModuleMap;
    static _importRestrictions = [];
    _init = false;
    _features = [];
    _currentTaskId = null;
    constructor(builder, targets, statsQuery, logger) {
        this._tsBuilder = builder;
        this._targets = targets;
        this._statsQuery = statsQuery;
        this._logger = logger;
        this._assetDbInterop = new asset_db_interop_1.AssetDbInterop();
    }
    set features(features) {
        this._features = features;
        this._featureChanged = true;
    }
    async init(features) {
        if (this._init) {
            return;
        }
        this._init = true;
        this._features = features;
        await this._syncEngineFeatures(features);
    }
    async generateDeclarations() {
        await this._tsBuilder.generateDeclarations([]);
    }
    async querySharedSettings() {
        return (0, query_shared_settings_1.querySharedSettings)(this._logger);
    }
    async destroyed() {
        this._init = false;
        await this._assetDbInterop.destroyed();
    }
    _warnMissingTarget(targetName) {
        if (!(targetName in this._targets)) {
            console.warn(`Invalid pack target: ${targetName}. Existing targets are: ${Object.keys(this._targets)}`);
        }
    }
    /**
     * 开始一次构建。
     * @param taskId 任务ID，用于跟踪任务状态
     */
    async _startBuild(taskId) {
        // 目前不能直接跳过，因为调用编译接口时是期望立即执行的，如果跳过会导致编译任务无法执行。
        // if (this._building) {
        //     this._logger.debug('Build iteration already started, skip.');
        //     return;
        // }
        this._building = true;
        this._currentTaskId = taskId || null;
        event_emitter_1.eventEmitter.emit('compile-start', 'project', taskId);
        this._logger.clear();
        this._logger.debug('Build iteration starts.\n' +
            `Number of accumulated asset changes: ${this._assetChangeQueue.length}\n` +
            `Feature changed: ${this._featureChanged}` +
            (taskId ? `\nTask ID: ${taskId}` : ''));
        if (this._featureChanged) {
            this._featureChanged = false;
            await this._syncEngineFeatures(this._features);
        }
        const assetChanges = this._assetChangeQueue;
        this._assetChangeQueue = [];
        const beforeTasks = this._beforeBuildTasks.slice();
        this._beforeBuildTasks.length = 0;
        for (const beforeTask of beforeTasks) {
            beforeTask();
        }
        await this.beforeEditorBuildDelegate.dispatch(assetChanges.filter(item => item.type === asset_db_1.AssetActionEnum.change));
        const nonDTSChanges = assetChanges.filter(item => !item.filePath.endsWith('.d.ts'));
        let err = null;
        for (const [, target] of Object.entries(this._targets)) {
            if (assetChanges.length !== 0) {
                await target.applyAssetChanges(nonDTSChanges);
            }
            const buildResult = await target.build();
            if (buildResult.err) {
                err = buildResult.err;
                target.deleteCacheFile(err.file);
                continue;
            }
            if (buildResult.depsGraph) {
                this._depsGraph = buildResult.depsGraph;
            }
            this._needUpdateDepsCache = true;
        }
        this._building = false;
        this._currentTaskId = null;
        event_emitter_1.eventEmitter.emit('compiled', 'project');
        if (err) {
            throw err;
        }
    }
    static async _createIncrementalRecord(logger) {
        const sharedModLoOptions = await (0, query_shared_settings_1.querySharedSettings)(logger);
        const incrementalRecord = {
            version: VERSION,
            config: {
                ...sharedModLoOptions,
            },
        };
        const previewBrowsersListConfigFile = await query_shared_settings_1.scriptConfig.getProject('previewBrowserslistConfigFile');
        if (previewBrowsersListConfigFile && previewBrowsersListConfigFile !== 'project://') {
            const previewBrowsersListConfigFilePath = (0, utils_2.url2path)(previewBrowsersListConfigFile);
            try {
                if (previewBrowsersListConfigFilePath && (0, fs_1.existsSync)(previewBrowsersListConfigFilePath)) {
                    const previewTarget = await readBrowserslistTarget(previewBrowsersListConfigFilePath);
                    if (previewTarget) {
                        incrementalRecord.config.previewTarget = previewTarget;
                    }
                }
                else {
                    logger.warn(`Preview target config file not found. ${previewBrowsersListConfigFilePath || previewBrowsersListConfigFile}`);
                }
            }
            catch (error) {
                logger.error(`Failed to load preview target config file at ${previewBrowsersListConfigFilePath || previewBrowsersListConfigFile}: ${error}`);
            }
        }
        return incrementalRecord;
    }
    static async _validateIncrementalRecord(record, recordFile, targetWorkspaceBase, logger) {
        let matched = false;
        try {
            const oldRecord = await fs_extra_1.default.readJson(recordFile);
            matched = matchObject(record, oldRecord);
            if (matched) {
                logger.debug('Incremental file seems great.');
            }
            else {
                logger.debug('[PackerDriver] Options doesn\'t match.\n' +
                    `Last: ${JSON.stringify(record, undefined, 2)}\n` +
                    `Current: ${JSON.stringify(oldRecord, undefined, 2)}`);
            }
        }
        catch (err) {
            logger.debug(`Packer deriver version file lost or format incorrect: ${err}`);
        }
        if (!matched) {
            logger.debug('Clearing out the targets...');
            await fs_extra_1.default.emptyDir(targetWorkspaceBase);
            await fs_extra_1.default.outputJson(recordFile, record, { spaces: 2 });
        }
        return matched;
    }
    static async _getEngineFeaturesShippedInEditor(statsQuery) {
        // 从 v3.8.5 开始，支持手动加载 WASM 模块，提供了 loadWasmModuleBox2D, loadWasmModuleBullet 等方法，这些方法是在 feature 入口 ( exports 目录下的文件导出的)
        // 之前剔除这些后端 feature 入口，应该是在 https://github.com/cocos/3d-tasks/issues/5747 中的建议。
        // 但实际上，编辑器环境下的引擎打包的时候，已经把所有模块打进 bundled/index.js 中，见：https://github.com/cocos/cocos-editor/blob/3.8.5/app/builtin/engine/static/engine-compiler/source/index.ts#L114 。
        // 启动引擎也执行了每个后端的代码，详见：https://github.com/cocos/cocos-editor/blob/3.8.5/app/builtin/scene/source/script/3d/manager/startup/engine/index.ts#L97 。
        // 项目 import 的 cc 在这里被加载： https://github.com/cocos/cocos-editor/blob/3.8.5/packages/lib-programming/src/executor/index.ts#L355 
        // 其包含的导出 features 是根据 _getEngineFeaturesShippedInEditor 这个当前函数返回的 features 决定的。因此，不会包含 loadWasmModuleBox2D， loadWasmModuleBullet， loadWasmModulePhysX 这几个函数。
        // 这个逻辑跟浏览器预览、构建后的运行时环境都有差异，而且没有必要，排除这些方法只会导致差异，并不能带来包体、性能方面的提升。
        return statsQuery.getFeatures();
        // const editorFeatures: string[] = statsQuery.getFeatures().filter((featureName) => {
        //     return ![
        //         'physics-ammo',
        //         'physics-builtin',
        //         'physics-cannon',
        //         'physics-physx',
        //         'physics-2d-box2d',
        //         'physics-2d-builtin',
        //     ].includes(featureName);
        // });
        // return editorFeatures;
    }
    async _syncEngineFeatures(features) {
        this._logger.debug(`Sync engine features: ${features}`);
        const engineIndexModuleSource = PackerDriver._getEngineIndexModuleSource(this._statsQuery, features);
        for (const [, target] of Object.entries(this._targets)) {
            if (target.respectToEngineFeatureSetting) {
                await target.setEngineIndexModuleSource(engineIndexModuleSource);
            }
        }
    }
    static _getEngineIndexModuleSource(statsQuery, features) {
        const featureUnits = statsQuery.getUnitsOfFeatures(features);
        const engineIndexModuleSource = statsQuery.evaluateIndexModuleSource(featureUnits, (featureUnit) => `${featureUnitModulePrefix}${featureUnit}`);
        return engineIndexModuleSource;
    }
    /**
     * 将 depsGraph 从 file 协议转成 db 路径协议。
     * 并且过滤掉一些外部模块。
     */
    _transformDepsGraph() {
        if (!this._needUpdateDepsCache) {
            return;
        }
        this._needUpdateDepsCache = false;
        const _depsGraph = {};
        const _usedGraph = {};
        for (const [scriptFilePath, depFilePaths] of Object.entries(this._depsGraph)) {
            if (!scriptFilePath.startsWith('file://')) {
                continue;
            }
            const scriptPath = (0, url_1.fileURLToPath)(scriptFilePath).replace(/\\/g, '/');
            if (!_depsGraph[scriptPath]) {
                _depsGraph[scriptPath] = new Set();
            }
            for (const path of depFilePaths) {
                if (!path.startsWith('file://')) {
                    continue;
                }
                const depPath = (0, url_1.fileURLToPath)(path).replace(/\\/g, '/');
                _depsGraph[scriptPath].add(depPath);
                if (!_usedGraph[depPath]) {
                    _usedGraph[depPath] = new Set();
                }
                _usedGraph[depPath].add(scriptPath);
            }
        }
        this._usedGraphCache = _usedGraph;
        this._depsGraphCache = _depsGraph;
    }
}
exports.PackerDriver = PackerDriver;
const engineIndexModURL = 'cce:/internal/x/cc';
const DEFAULT_PREVIEW_BROWSERS_LIST_TARGET = 'supports es6-module';
const predefinedTargets = {
    editor: {
        name: 'Editor',
        browsersListTargets: utils_1.editorBrowserslistQuery,
        sourceMaps: 'inline',
        isEditor: true,
    },
    preview: {
        name: 'Preview',
        sourceMaps: true,
        browsersListTargets: DEFAULT_PREVIEW_BROWSERS_LIST_TARGET,
    },
};
async function readBrowserslistTarget(browserslistrcPath) {
    let browserslistrcSource;
    try {
        browserslistrcSource = await fs_extra_1.default.readFile(browserslistrcPath, 'utf8');
    }
    catch (err) {
        return;
    }
    const queries = parseBrowserslistQueries(browserslistrcSource);
    if (queries.length === 0) {
        return;
    }
    return queries.join(' or ');
    function parseBrowserslistQueries(source) {
        const queries = [];
        for (const line of source.split('\n')) {
            const iSharp = line.indexOf('#');
            const lineTrimmed = (iSharp < 0 ? line : line.substr(0, iSharp)).trim();
            if (lineTrimmed.length !== 0) {
                queries.push(lineTrimmed);
            }
        }
        return queries;
    }
}
// 考虑到这是潜在的收费点，默认关闭入口脚本的优化功能
const OPTIMIZE_ENTRY_SOURCE_COMPILATION = false;
class PackTarget {
    constructor(options) {
        this._name = options.name;
        this._modLo = options.modLo;
        this._quickPack = options.quickPack;
        this._quickPackLoaderContext = options.quickPackLoaderContext;
        this._sourceMaps = options.sourceMaps;
        this._logger = options.logger;
        this._respectToFeatureSetting = options.engineIndexModule.respectToFeatureSetting;
        this._tentativePrerequisiteImportsMod = options.tentativePrerequisiteImportsMod;
        this._userImportMap = options.userImportMap;
        const modLo = this._modLo;
        this._entryMod = modLo.addMemoryModule(prerequisite_imports_1.prerequisiteImportsModURL, (this._tentativePrerequisiteImportsMod ? prerequisite_imports_1.makeTentativePrerequisiteImports : prerequisite_imports_1.makePrerequisiteImportsMod)([]));
        this._entryModSource = this._entryMod.source;
        this._engineIndexMod = modLo.addMemoryModule(engineIndexModURL, options.engineIndexModule.source);
        // In constructor, there's no build in progress, so we can safely call setAssetDatabaseDomains
        // without waiting. We use a synchronous initialization method.
        this._setAssetDatabaseDomainsSync([]);
    }
    get quickPackLoaderContext() {
        return this._quickPackLoaderContext;
    }
    get ready() {
        return this._ready;
    }
    get respectToEngineFeatureSetting() {
        return this._respectToFeatureSetting;
    }
    updateDbInfos(dbInfos) {
        this._dbInfos = dbInfos;
    }
    async build() {
        // 如果正在构建，返回同一个 Promise，避免并发执行
        if (this._buildPromise) {
            this._logger.debug(`Target(${this._name}) build already in progress, waiting for existing build...`);
            return this._buildPromise;
        }
        // 开始新的构建
        this._buildStarted = true;
        const targetName = this._name;
        // 创建构建 Promise
        this._buildPromise = this._executeBuild(targetName);
        try {
            const result = await this._buildPromise;
            return result;
        }
        finally {
            // 构建完成后清除 Promise，允许下次构建
            this._buildPromise = null;
        }
    }
    async _executeBuild(targetName) {
        // 发送开始编译消息
        event_emitter_1.eventEmitter.emit('pack-build-start', targetName);
        this._logger.debug(`Target(${targetName}) build started.`);
        let buildResult = {};
        const t1 = perf_hooks_1.performance.now();
        try {
            buildResult = await this._build();
        }
        catch (err) {
            this._logger.error(`${err}, stack: ${err.stack}`);
            buildResult.err = err;
        }
        finally {
            this._firstBuild = false;
            const t2 = perf_hooks_1.performance.now();
            this._logger.debug(`Target(${targetName}) ends with cost ${t2 - t1}ms.`);
            this._ready = true;
            // 发送编译完成消息
            event_emitter_1.eventEmitter.emit('pack-build-end', targetName);
            this._buildStarted = false;
        }
        return buildResult;
    }
    deleteCacheFile(filePath) {
        const mods = this._prerequisiteAssetMods;
        if (filePath && mods.size) {
            mods.delete(filePath);
        }
    }
    async _build() {
        const prerequisiteAssetMods = await this._getPrerequisiteAssetModsWithFilter();
        const buildEntries = [
            engineIndexModURL,
            prerequisite_imports_1.prerequisiteImportsModURL,
            ...prerequisiteAssetMods,
        ];
        const cleanResolution = this._cleanResolutionNextTime;
        if (cleanResolution) {
            this._cleanResolutionNextTime = false;
        }
        if (cleanResolution) {
            console.debug('This build will perform a clean module resolution.');
        }
        let buildResult = {};
        await wrapToSetImmediateQueue(this, async () => {
            buildResult = await this._quickPack.build(buildEntries, {
                retryResolutionOnUnchangedModule: this._firstBuild,
                cleanResolution: cleanResolution,
            });
        });
        return buildResult;
    }
    async clearCache() {
        this._quickPack.clear();
        this._firstBuild = true;
    }
    async applyAssetChanges(changes) {
        // 如果正在构建，等待构建完成
        if (this._buildPromise) {
            this._logger.debug(`Target(${this._name}) build in progress, waiting before applying asset changes...`);
            await this._buildPromise;
        }
        this._ensureIdle();
        for (const change of changes) {
            const uuid = change.uuid;
            // Note: "modified" directive is decomposed as "remove" and "add".
            if (change.type === asset_db_1.AssetActionEnum.change ||
                change.type === asset_db_1.AssetActionEnum.delete) {
                const oldURL = this._uuidURLMap.get(uuid);
                if (!oldURL) {
                    // As of now, we receive an asset modifying or changing directive
                    // but the asset was not processed by us before.
                    // This however can only happen when:
                    // - the asset is removed, and it's an plugin script;
                    // - the asset is modified from plugin script to non-plugin-script.
                    // Otherwise, something went wrong.
                    // But we could not distinguish the second reason from
                    // "received an error asset change directive"
                    // since we don't know the asset's previous status. So we choose to skip this check.
                    // this._logger.warn(`Unexpected: ${uuid} is not in registry.`);
                }
                else {
                    this._uuidURLMap.delete(uuid);
                    this._modLo.unsetUUID(oldURL);
                    const deleted = this._prerequisiteAssetMods.delete(oldURL);
                    if (!deleted) {
                        this._logger.warn(`Unexpected: ${oldURL} is not in registry.`);
                    }
                }
            }
            if (change.type === asset_db_1.AssetActionEnum.change ||
                change.type === asset_db_1.AssetActionEnum.add) {
                if (change.isPluginScript) {
                    continue;
                }
                const { href: url } = change.url;
                this._uuidURLMap.set(uuid, url);
                this._modLo.setUUID(url, uuid);
                this._prerequisiteAssetMods.add(url);
            }
        }
        // Update the import main module
        const prerequisiteImports = await this._getPrerequisiteAssetModsWithFilter();
        const source = (this._tentativePrerequisiteImportsMod ? prerequisite_imports_1.makeTentativePrerequisiteImports : prerequisite_imports_1.makePrerequisiteImportsMod)(prerequisiteImports);
        console.time('update entry mod');
        if (OPTIMIZE_ENTRY_SOURCE_COMPILATION) {
            // 注意：.source 是一个 setter，其内部会更新 timestamp，导致每次都重新编译入口文件，如果项目比较大，入口文件的编译会非常耗时。
            // 这里优化，只有在有差异的情况下才去更新 source
            if (this._entryModSource.length !== source.length || this._entryModSource !== source) {
                this._entryModSource = this._entryMod.source = source;
            }
        }
        else {
            // 旧的逻辑是每次任意脚本变化，都重新设置入口 source，对大项目影响比较大
            this._entryModSource = this._entryMod.source = source;
        }
        console.timeEnd('update entry mod');
    }
    async setEngineIndexModuleSource(source) {
        // 如果正在构建，等待构建完成
        if (this._buildPromise) {
            this._logger.debug(`Target(${this._name}) build in progress, waiting before setting engine index module source...`);
            await this._buildPromise;
        }
        this._ensureIdle();
        this._engineIndexMod.source = source;
    }
    async setAssetDatabaseDomains(assetDatabaseDomains) {
        // 如果正在构建，等待构建完成
        if (this._buildPromise) {
            this._logger.debug(`Target(${this._name}) build in progress, waiting before setting asset database domains...`);
            await this._buildPromise;
        }
        this._ensureIdle();
        this._setAssetDatabaseDomainsSync(assetDatabaseDomains);
    }
    _setAssetDatabaseDomainsSync(assetDatabaseDomains) {
        const { _userImportMap: userImportMap } = this;
        const importMap = {};
        const importMapURL = userImportMap ? userImportMap.url : new url_1.URL('foo:/bar');
        // Integrates builtin mappings, since all of builtin mappings are absolute, we do not need parse.
        importMap.imports = {};
        importMap.imports['cc'] = engineIndexModURL;
        const assetPrefixes = [];
        for (const assetDatabaseDomain of assetDatabaseDomains) {
            const assetDirURL = (0, url_1.pathToFileURL)(path_1.default.join(assetDatabaseDomain.physical, path_1.default.join(path_1.default.sep))).href;
            importMap.imports[assetDatabaseDomain.root.href] = assetDirURL;
            assetPrefixes.push(assetDirURL);
        }
        if (userImportMap) {
            if (userImportMap.json.imports) {
                importMap.imports = {
                    ...importMap.imports,
                    ...userImportMap.json.imports,
                };
            }
            if (userImportMap.json.scopes) {
                for (const [scopeRep, specifierMap] of Object.entries(userImportMap.json.scopes)) {
                    const scopes = importMap.scopes ??= {};
                    scopes[scopeRep] = {
                        ...(scopes[scopeRep] ?? {}),
                        ...specifierMap,
                    };
                }
            }
        }
        this._logger.debug(`Our import map(${importMapURL}): ${JSON.stringify(importMap, undefined, 2)}`);
        this._modLo.setImportMap(importMap, importMapURL);
        this._modLo.setAssetPrefixes(assetPrefixes);
        this._cleanResolutionNextTime = true;
    }
    _dbInfos = [];
    _buildStarted = false;
    _buildPromise = null;
    _ready = false;
    _name;
    _engineIndexMod;
    _entryMod;
    _entryModSource = '';
    _modLo;
    _sourceMaps;
    _quickPack;
    _quickPackLoaderContext;
    _prerequisiteAssetMods = new Set();
    _uuidURLMap = new Map();
    _logger;
    _firstBuild = true;
    _cleanResolutionNextTime = true;
    _respectToFeatureSetting;
    _tentativePrerequisiteImportsMod;
    _userImportMap;
    async _getPrerequisiteAssetModsWithFilter() {
        const prerequisiteAssetMods = Array.from(this._prerequisiteAssetMods).sort();
        return prerequisiteAssetMods;
    }
    _ensureIdle() {
        (0, asserts_1.asserts)(!this._buildStarted, 'Build is in progress, but a status change request is filed');
    }
}
function matchObject(lhs, rhs) {
    return matchLhs(lhs, rhs);
    function matchLhs(lhs, rhs) {
        if (Array.isArray(lhs)) {
            return Array.isArray(rhs) && lhs.length === rhs.length &&
                lhs.every((v, i) => matchLhs(v, rhs[i]));
        }
        else if (typeof lhs === 'object' && lhs !== null) {
            return typeof rhs === 'object'
                && rhs !== null
                && Object.keys(lhs).every((key) => matchLhs(lhs[key], rhs[key]));
        }
        else if (lhs === null) {
            return rhs === null;
        }
        else {
            return lhs === rhs;
        }
    }
}
