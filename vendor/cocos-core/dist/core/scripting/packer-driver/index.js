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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvcGFja2VyLWRyaXZlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxnREFBc0I7QUFDdEIsd0RBQTBCO0FBQzFCLDZCQUF3RDtBQUN4RCwyQ0FBeUM7QUFDekMsaUVBQWlJO0FBQ2pJLDZEQUE0RTtBQUM1RSw0Q0FBNEM7QUFDNUMsOENBQTJDO0FBQzNDLDJFQUFvRztBQUVwRyxxRkFBaUY7QUFFakYseUVBS3NEO0FBQ3RELHlEQUEwSTtBQUMxSSw4Q0FBa0Q7QUFDbEQscUNBQThDO0FBQzlDLDBEQUE2RDtBQUM3RCxnREFBa0Q7QUFDbEQsa0RBQTBCO0FBQzFCLDJCQUFnQztBQUNoQyw4Q0FBOEM7QUFDOUMsOERBQWtFO0FBQ2xFLGtEQUEwRDtBQUMxRCxvREFBZ0Q7QUFFaEQsZ0RBQXdCO0FBRXhCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQztBQUVyQixNQUFNLHVCQUF1QixHQUFHLHdCQUF3QixDQUFDO0FBRXpELFNBQVMsaUJBQWlCLENBQUMsT0FBaUI7SUFDeEMsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBQzFCLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxFQUFFLENBQUM7UUFDekIsTUFBTSxlQUFlLEdBQUcsY0FBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckUsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsT0FBTyxjQUFjLENBQUM7QUFDMUIsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLFlBQTBCO0lBQy9DLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUss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LElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNqRCxPQUFPLE9BQU8sR0FBRyxLQUFLLFFBQVE7bUJBQ3ZCLEdBQUcsS0FBSyxJQUFJO21CQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUUsR0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFHLEdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0YsQ0FBQzthQUFNLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3RCLE9BQU8sR0FBRyxLQUFLLElBQUksQ0FBQztRQUN4QixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sR0FBRyxLQUFLLEdBQUcsQ0FBQztRQUN2QixDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBwcyBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBwYXRoVG9GaWxlVVJMLCBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgcGVyZm9ybWFuY2UgfSBmcm9tICdwZXJmX2hvb2tzJztcbmltcG9ydCB7IG1ha2VQcmVyZXF1aXNpdGVJbXBvcnRzTW9kLCBtYWtlVGVudGF0aXZlUHJlcmVxdWlzaXRlSW1wb3J0cywgcHJlcmVxdWlzaXRlSW1wb3J0c01vZFVSTCB9IGZyb20gJy4vcHJlcmVxdWlzaXRlLWltcG9ydHMnO1xuaW1wb3J0IHsgZWRpdG9yQnJvd3NlcnNsaXN0UXVlcnkgfSBmcm9tICdAY29jb3MvbGliLXByb2dyYW1taW5nL2Rpc3QvdXRpbHMnO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IGFzc2VydHMgfSBmcm9tICcuLi91dGlscy9hc3NlcnRzJztcbmltcG9ydCB7IHF1ZXJ5U2hhcmVkU2V0dGluZ3MsIHNjcmlwdENvbmZpZywgU2hhcmVkU2V0dGluZ3MgfSBmcm9tICcuLi9zaGFyZWQvcXVlcnktc2hhcmVkLXNldHRpbmdzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJ0Bjb2Nvcy9jcmVhdG9yLXByb2dyYW1taW5nLWNvbW1vbi9saWIvbG9nZ2VyJztcbmltcG9ydCB7IFF1aWNrUGFjayB9IGZyb20gJ0Bjb2Nvcy9jcmVhdG9yLXByb2dyYW1taW5nLXF1aWNrLXBhY2svbGliL3F1aWNrLXBhY2snO1xuaW1wb3J0IHsgUXVpY2tQYWNrTG9hZGVyQ29udGV4dCB9IGZyb20gJ0Bjb2Nvcy9jcmVhdG9yLXByb2dyYW1taW5nLXF1aWNrLXBhY2svbGliL2xvYWRlcic7XG5pbXBvcnQge1xuICAgIE1vZExvLFxuICAgIE1lbW9yeU1vZHVsZSxcbiAgICBNb2RMb09wdGlvbnMsXG4gICAgSW1wb3J0TWFwLFxufSBmcm9tICdAY29jb3MvY3JlYXRvci1wcm9ncmFtbWluZy1tb2QtbG8vbGliL21vZC1sbyc7XG5pbXBvcnQgeyBBc3NldENoYW5nZSwgQXNzZXRDaGFuZ2VJbmZvLCBBc3NldERhdGFiYXNlRG9tYWluLCBBc3NldERiSW50ZXJvcCwgREJDaGFuZ2VUeXBlLCBNb2RpZmllZEFzc2V0Q2hhbmdlIH0gZnJvbSAnLi9hc3NldC1kYi1pbnRlcm9wJztcbmltcG9ydCB7IEFzc2V0QWN0aW9uRW51bSB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBQYWNrZXJEcml2ZXJMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQgeyBMYW5ndWFnZVNlcnZpY2VBZGFwdGVyIH0gZnJvbSAnLi4vbGFuZ3VhZ2Utc2VydmljZSc7XG5pbXBvcnQgeyBBc3luY0RlbGVnYXRlIH0gZnJvbSAnLi4vdXRpbHMvZGVsZWdhdGUnO1xuaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyB1cmwycGF0aCB9IGZyb20gJy4uLy4uL2Fzc2V0cy91dGlscyc7XG5pbXBvcnQgeyBjb21wcmVzc1V1aWQgfSBmcm9tICcuLi8uLi9idWlsZGVyL3dvcmtlci9idWlsZGVyL3V0aWxzJztcbmltcG9ydCB7IFR5cGVTY3JpcHRDb25maWdCdWlsZGVyIH0gZnJvbSAnLi4vaW50ZWxsaWdlbmNlJztcbmltcG9ydCB7IGV2ZW50RW1pdHRlciB9IGZyb20gJy4uL2V2ZW50LWVtaXR0ZXInO1xuaW1wb3J0IHsgREJJbmZvIH0gZnJvbSAnLi4vQHR5cGVzL2NvbmZpZy1leHBvcnQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IFZFUlNJT04gPSAnMjAnO1xuXG5jb25zdCBmZWF0dXJlVW5pdE1vZHVsZVByZWZpeCA9ICdjY2U6L2ludGVybmFsL3gvY2MtZnUvJztcblxuZnVuY3Rpb24gZ2V0RWRpdG9yUGF0dGVybnMoZGJJbmZvczogREJJbmZvW10pIHtcbiAgICBjb25zdCBlZGl0b3JQYXR0ZXJucyA9IFtdO1xuICAgIGZvciAoY29uc3QgaW5mbyBvZiBkYkluZm9zKSB7XG4gICAgICAgIGNvbnN0IGRiRWRpdG9yUGF0dGVybiA9IHBzLmpvaW4oaW5mby50YXJnZXQsICcqKicsICdlZGl0b3InLCAnKiovKicpO1xuICAgICAgICBlZGl0b3JQYXR0ZXJucy5wdXNoKGRiRWRpdG9yUGF0dGVybik7XG4gICAgfVxuICAgIHJldHVybiBlZGl0b3JQYXR0ZXJucztcbn1cblxuZnVuY3Rpb24gZ2V0Q0NFTW9kdWxlSURzKGNjZU1vZHVsZU1hcDogQ0NFTW9kdWxlTWFwKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGNjZU1vZHVsZU1hcCkuZmlsdGVyKGlkID0+IGlkICE9PSAnbWFwTG9jYXRpb24nKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd3JhcFRvU2V0SW1tZWRpYXRlUXVldWU8VGFyZ2V0LCBBcmdzIGV4dGVuZHMgYW55W10sIFJlc3VsdD4odGhpejogVGFyZ2V0LCBmbjogKC4uLmFyZ3M6IEFyZ3MpID0+IFJlc3VsdCwgLi4uYXJnczogQXJncyk6IFByb21pc2U8UmVzdWx0PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFJlc3VsdD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyDms6jmhI/vvJpFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3Qg5YaF6YOo5Lya5L2/55SoIHNldEltbWVkaWF0ZSDlu7bml7blub/mkq3kuovku7bjgIJcbiAgICAgICAgLy8g5aaC5p6c5ZyoIGJyb2FkY2FzdCDkuYvlkI7osIPnlKjkuobmr5TovoPogJfml7bnmoTmk43kvZzvvIzpgqPkuYjmtojmga/kvJrlnKjogJfml7bmk43kvZzlkI7miY3ooqvmlLbliLDjgIJcbiAgICAgICAgLy8g5Zug5q2k6L+Z6YeM5L2/55SoIHNldEltbWVkaWF0ZSDmnaXovazmjaLlkIzmraXlh73mlbDkuLrlvILmraXvvIzkv53or4HovazmjaLnmoTlh73mlbDlnKggYnJvYWRjYXN0IOa2iOaBr+iiq+aUtuWIsOWQjuWGjeaJp+ihjOOAglxuICAgICAgICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZuLmFwcGx5KHRoaXosIGFyZ3MpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmludGVyZmFjZSBCdWlsZFJlc3VsdCB7XG4gICAgZGVwc0dyYXBoPzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xuICAgIGVycj86IG51bGwgfCBFcnJvcjtcbn1cblxuaW50ZXJmYWNlIENDRU1vZHVsZUNvbmZpZyB7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBtYWluOiBzdHJpbmc7XG4gICAgdHlwZXM6IHN0cmluZztcbn1cblxudHlwZSBDQ0VNb2R1bGVNYXAgPSB7XG4gICAgW21vZHVsZU5hbWU6IHN0cmluZ106IENDRU1vZHVsZUNvbmZpZztcbn0gJiB7XG4gICAgbWFwTG9jYXRpb246IHN0cmluZztcbn07XG5cbi8qKlxuICogUGFja2VyIOmpseWKqOWZqOOAglxuICogLSDlupXlsYLnlKggUXVpY2tQYWNrIOW/q+mAn+aJk+WMheaooeWdl+ebuOWFs+eahOi1hOa6kOOAglxuICogLSDkuqflh7rmmK/lj6/ku6Xov5vooYzliqDovb3nmoTmqKHlnZfotYTmupDvvIzljIXmi6zmqKHlnZfjgIFTb3VyY2UgbWFw562J77yb6ZyA6KaB5L2/55SoIFF1aWNrUGFja0xvYWRlciDlr7nov5nkupvmqKHlnZfotYTmupDov5vooYzliqDovb3lkozorr/pl67jgIJcbiAqL1xuZXhwb3J0IGNsYXNzIFBhY2tlckRyaXZlciB7XG4gICAgcHVibGljIGxhbmd1YWdlU2VydmljZTogTGFuZ3VhZ2VTZXJ2aWNlQWRhcHRlciB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgc3RhdGljIF9pbnN0YW5jZTogUGFja2VyRHJpdmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6IFBhY2tlckRyaXZlciB7XG4gICAgICAgIGFzc2VydHMoUGFja2VyRHJpdmVyLl9pbnN0YW5jZSwgJ1BhY2tlckRyaXZlciBpcyBub3QgY3JlYXRlZCB5ZXQuIFBsZWFzZSBjYWxsIFBhY2tlckRyaXZlci5jcmVhdGUgZmlyc3QuJyk7XG4gICAgICAgIHJldHVybiBQYWNrZXJEcml2ZXIuX2luc3RhbmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIm+W7uiBQYWNrZXIg6amx5Yqo5Zmo44CCXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBjcmVhdGUocHJvamVjdFBhdGg6IHN0cmluZywgZW5naW5lVHNQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgc2NyaXB0Q29uZmlnLmluaXQoKTtcbiAgICAgICAgY29uc3QgdHNCdWlsZGVyID0gbmV3IFR5cGVTY3JpcHRDb25maWdCdWlsZGVyKHByb2plY3RQYXRoLCBlbmdpbmVUc1BhdGgpO1xuICAgICAgICBQYWNrZXJEcml2ZXIuX2NjZU1vZHVsZU1hcCA9IFBhY2tlckRyaXZlci5xdWVyeUNDRU1vZHVsZU1hcCgpO1xuICAgICAgICBjb25zdCBiYXNlV29ya3NwYWNlID0gcHMuam9pbih0c0J1aWxkZXIuZ2V0VGVtcFBhdGgoKSwgJ3Byb2dyYW1taW5nJywgJ3BhY2tlci1kcml2ZXInKTtcbiAgICAgICAgY29uc3QgdmVyc2lvbkZpbGUgPSBwcy5qb2luKGJhc2VXb3Jrc3BhY2UsICdWRVJTSU9OJyk7XG4gICAgICAgIGNvbnN0IHRhcmdldFdvcmtzcGFjZUJhc2UgPSBwcy5qb2luKGJhc2VXb3Jrc3BhY2UsICd0YXJnZXRzJyk7XG4gICAgICAgIGNvbnN0IGRlYnVnTG9nRmlsZSA9IHBzLmpvaW4oYmFzZVdvcmtzcGFjZSwgJ2xvZ3MnLCAnZGVidWcubG9nJyk7XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0czogUGFja2VyRHJpdmVyWydfdGFyZ2V0cyddID0ge307XG5cbiAgICAgICAgY29uc3QgdmVyYm9zZSA9IHRydWU7XG4gICAgICAgIGlmIChhd2FpdCBmcy5wYXRoRXhpc3RzKGRlYnVnTG9nRmlsZSkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMudW5saW5rKGRlYnVnTG9nRmlsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byByZXNldCBsb2cgZmlsZTogJHtkZWJ1Z0xvZ0ZpbGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2dnZXIgPSBuZXcgUGFja2VyRHJpdmVyTG9nZ2VyKGRlYnVnTG9nRmlsZSk7XG5cbiAgICAgICAgbG9nZ2VyLmRlYnVnKG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKSk7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhgUHJvamVjdDogJHtwcm9qZWN0UGF0aH1gKTtcbiAgICAgICAgbG9nZ2VyLmRlYnVnKGBUYXJnZXRzOiAke09iamVjdC5rZXlzKHByZWRlZmluZWRUYXJnZXRzKX1gKTtcblxuICAgICAgICBjb25zdCBpbmNyZW1lbnRhbFJlY29yZCA9IGF3YWl0IFBhY2tlckRyaXZlci5fY3JlYXRlSW5jcmVtZW50YWxSZWNvcmQobG9nZ2VyKTtcblxuICAgICAgICBhd2FpdCBQYWNrZXJEcml2ZXIuX3ZhbGlkYXRlSW5jcmVtZW50YWxSZWNvcmQoXG4gICAgICAgICAgICBpbmNyZW1lbnRhbFJlY29yZCxcbiAgICAgICAgICAgIHZlcnNpb25GaWxlLFxuICAgICAgICAgICAgdGFyZ2V0V29ya3NwYWNlQmFzZSxcbiAgICAgICAgICAgIGxvZ2dlcixcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBsb2FkTWFwcGluZ3M6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgICAgICAnY2NlOi9pbnRlcm5hbC9jb2RlLXF1YWxpdHkvJzogcGF0aFRvRmlsZVVSTChcbiAgICAgICAgICAgICAgICBwcy5qb2luKF9fZGlybmFtZSwgJy4uLy4uJywgJy4uJywgJy4uJywgJ3N0YXRpYycsICdzY3JpcHRpbmcnLCAnYnVpbHRpbi1tb2RzJywgJ2NvZGUtcXVhbGl0eScsICcvJykpLmhyZWYsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgc3RhdHNRdWVyeSA9IGF3YWl0IFN0YXRzUXVlcnkuY3JlYXRlKGVuZ2luZVRzUGF0aCk7XG5cbiAgICAgICAgY29uc3QgZW1wdHlFbmdpbmVJbmRleE1vZHVsZVNvdXJjZSA9IHN0YXRzUXVlcnkuZXZhbHVhdGVJbmRleE1vZHVsZVNvdXJjZShbXSk7XG5cbiAgICAgICAgY29uc3QgY3JPcHRpb25zOiBNb2RMb09wdGlvbnNbJ2NyJ10gPSB7XG4gICAgICAgICAgICBtb2R1bGVSZXF1ZXN0RmlsdGVyOiBbL15jY1xcLj8uKiQvZ10sXG4gICAgICAgICAgICByZXBvcnRlcjoge1xuICAgICAgICAgICAgICAgIG1vZHVsZU5hbWU6ICdjY2U6L2ludGVybmFsL2NvZGUtcXVhbGl0eS9jci5tanMnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogJ3JlcG9ydCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAoY29uc3QgW3RhcmdldElkLCB0YXJnZXRdIG9mIE9iamVjdC5lbnRyaWVzKHByZWRlZmluZWRUYXJnZXRzKSkge1xuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKGBJbml0aWFsaXppbmcgdGFyZ2V0IFske3RhcmdldC5uYW1lfV1gKTtcblxuICAgICAgICAgICAgY29uc3QgbW9kTG9FeHRlcm5hbHM6IHN0cmluZ1tdID0gW1xuICAgICAgICAgICAgICAgICdjYy9lbnYnLFxuICAgICAgICAgICAgICAgICdjYy91c2VybGFuZC9tYWNybycsXG4gICAgICAgICAgICAgICAgLi4uZ2V0Q0NFTW9kdWxlSURzKFBhY2tlckRyaXZlci5fY2NlTW9kdWxlTWFwKSwgLy8g6K6+572u57yW6L6R5Zmo5a+85Ye655qE5qih5Z2X5Li65aSW6YOo5qih5Z2XXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBtb2RMb0V4dGVybmFscy5wdXNoKC4uLnN0YXRzUXVlcnkuZ2V0RmVhdHVyZVVuaXRzKCkubWFwKFxuICAgICAgICAgICAgICAgIChmZWF0dXJlVW5pdCkgPT4gYCR7ZmVhdHVyZVVuaXRNb2R1bGVQcmVmaXh9JHtmZWF0dXJlVW5pdH1gKSk7XG5cbiAgICAgICAgICAgIGxldCBicm93c2Vyc0xpc3RUYXJnZXRzID0gdGFyZ2V0LmJyb3dzZXJzTGlzdFRhcmdldHM7XG4gICAgICAgICAgICBpZiAodGFyZ2V0SWQgPT09ICdwcmV2aWV3JyAmJiBpbmNyZW1lbnRhbFJlY29yZC5jb25maWcucHJldmlld1RhcmdldCkge1xuICAgICAgICAgICAgICAgIGJyb3dzZXJzTGlzdFRhcmdldHMgPSBpbmNyZW1lbnRhbFJlY29yZC5jb25maWcucHJldmlld1RhcmdldDtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZGVidWcoYFVzZSBzcGVjaWZpZWQgcHJldmlldyBicm93c2Vyc2xpc3QgdGFyZ2V0OiAke2Jyb3dzZXJzTGlzdFRhcmdldHN9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtb2RMbyA9IG5ldyBNb2RMbyh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0czogYnJvd3NlcnNMaXN0VGFyZ2V0cyxcbiAgICAgICAgICAgICAgICBsb29zZTogaW5jcmVtZW50YWxSZWNvcmQuY29uZmlnLmxvb3NlLFxuICAgICAgICAgICAgICAgIGd1ZXNzQ29tbW9uSnNFeHBvcnRzOiBpbmNyZW1lbnRhbFJlY29yZC5jb25maWcuZ3Vlc3NDb21tb25Kc0V4cG9ydHMsXG4gICAgICAgICAgICAgICAgdXNlRGVmaW5lRm9yQ2xhc3NGaWVsZHM6IGluY3JlbWVudGFsUmVjb3JkLmNvbmZpZy51c2VEZWZpbmVGb3JDbGFzc0ZpZWxkcyxcbiAgICAgICAgICAgICAgICBhbGxvd0RlY2xhcmVGaWVsZHM6IGluY3JlbWVudGFsUmVjb3JkLmNvbmZpZy5hbGxvd0RlY2xhcmVGaWVsZHMsXG4gICAgICAgICAgICAgICAgY3I6IGNyT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBfY29tcHJlc3NVVUlEKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcHJlc3NVdWlkKHV1aWQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGxvZ2dlcixcbiAgICAgICAgICAgICAgICBjaGVja09ic29sZXRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGltcG9ydFJlc3RyaWN0aW9uczogUGFja2VyRHJpdmVyLl9pbXBvcnRSZXN0cmljdGlvbnMsXG4gICAgICAgICAgICAgICAgcHJlc2VydmVTeW1saW5rczogaW5jcmVtZW50YWxSZWNvcmQuY29uZmlnLnByZXNlcnZlU3ltbGlua3MsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbW9kTG8uc2V0RXh0cmFFeHBvcnRzQ29uZGl0aW9ucyhpbmNyZW1lbnRhbFJlY29yZC5jb25maWcuZXhwb3J0c0NvbmRpdGlvbnMpO1xuICAgICAgICAgICAgbW9kTG8uc2V0RXh0ZXJuYWxzKG1vZExvRXh0ZXJuYWxzKTtcbiAgICAgICAgICAgIG1vZExvLnNldExvYWRNYXBwaW5ncyhsb2FkTWFwcGluZ3MpO1xuXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRXb3Jrc3BhY2UgPSBwcy5qb2luKHRhcmdldFdvcmtzcGFjZUJhc2UsIHRhcmdldElkKTtcbiAgICAgICAgICAgIGNvbnN0IHF1aWNrUGFjayA9IG5ldyBRdWlja1BhY2soe1xuICAgICAgICAgICAgICAgIG1vZExvLFxuICAgICAgICAgICAgICAgIG9yaWdpbjogcHJvamVjdFBhdGgsXG4gICAgICAgICAgICAgICAgd29ya3NwYWNlOiB0YXJnZXRXb3Jrc3BhY2UsXG4gICAgICAgICAgICAgICAgbG9nZ2VyLFxuICAgICAgICAgICAgICAgIHZlcmJvc2UsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdMb2FkaW5nIGNhY2hlJyk7XG4gICAgICAgICAgICBjb25zdCB0MSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgYXdhaXQgcXVpY2tQYWNrLmxvYWRDYWNoZSgpO1xuICAgICAgICAgICAgY29uc3QgdDIgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZyhgTG9hZGluZyBjYWNoZSBjb3N0cyAke3QyIC0gdDF9bXMuYCk7XG5cbiAgICAgICAgICAgIGxldCBlbmdpbmVJbmRleE1vZHVsZTpcbiAgICAgICAgICAgICAgICBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8dHlwZW9mIFBhY2tUYXJnZXQ+WzBdWydlbmdpbmVJbmRleE1vZHVsZSddO1xuICAgICAgICAgICAgaWYgKHRhcmdldC5pc0VkaXRvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmVzID0gYXdhaXQgUGFja2VyRHJpdmVyLl9nZXRFbmdpbmVGZWF0dXJlc1NoaXBwZWRJbkVkaXRvcihzdGF0c1F1ZXJ5KTtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZGVidWcoYEVuZ2luZSBmZWF0dXJlcyBzaGlwcGVkIGluIGVkaXRvcjogJHtmZWF0dXJlc31gKTtcbiAgICAgICAgICAgICAgICBlbmdpbmVJbmRleE1vZHVsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBQYWNrZXJEcml2ZXIuX2dldEVuZ2luZUluZGV4TW9kdWxlU291cmNlKHN0YXRzUXVlcnksIGZlYXR1cmVzKSxcbiAgICAgICAgICAgICAgICAgICAgcmVzcGVjdFRvRmVhdHVyZVNldHRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVuZ2luZUluZGV4TW9kdWxlID0ge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGVtcHR5RW5naW5lSW5kZXhNb2R1bGVTb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BlY3RUb0ZlYXR1cmVTZXR0aW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHF1aWNrUGFja0xvYWRlckNvbnRleHQgPSBxdWlja1BhY2suY3JlYXRlTG9hZGVyQ29udGV4dCgpO1xuICAgICAgICAgICAgdGFyZ2V0c1t0YXJnZXRJZF0gPSBuZXcgUGFja1RhcmdldCh7XG4gICAgICAgICAgICAgICAgbmFtZTogdGFyZ2V0SWQsXG4gICAgICAgICAgICAgICAgbW9kTG8sXG4gICAgICAgICAgICAgICAgc291cmNlTWFwczogdGFyZ2V0LnNvdXJjZU1hcHMsXG4gICAgICAgICAgICAgICAgcXVpY2tQYWNrLFxuICAgICAgICAgICAgICAgIHF1aWNrUGFja0xvYWRlckNvbnRleHQsXG4gICAgICAgICAgICAgICAgbG9nZ2VyLFxuICAgICAgICAgICAgICAgIGVuZ2luZUluZGV4TW9kdWxlLFxuICAgICAgICAgICAgICAgIHRlbnRhdGl2ZVByZXJlcXVpc2l0ZUltcG9ydHNNb2Q6IHRhcmdldC5pc0VkaXRvciA/PyBmYWxzZSxcbiAgICAgICAgICAgICAgICB1c2VySW1wb3J0TWFwOiBpbmNyZW1lbnRhbFJlY29yZC5jb25maWcuaW1wb3J0TWFwID8ge1xuICAgICAgICAgICAgICAgICAgICBqc29uOiBpbmNyZW1lbnRhbFJlY29yZC5jb25maWcuaW1wb3J0TWFwLmpzb24sXG4gICAgICAgICAgICAgICAgICAgIHVybDogbmV3IFVSTChpbmNyZW1lbnRhbFJlY29yZC5jb25maWcuaW1wb3J0TWFwLnVybCksXG4gICAgICAgICAgICAgICAgfSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFja2VyID0gbmV3IFBhY2tlckRyaXZlcihcbiAgICAgICAgICAgIHRzQnVpbGRlcixcbiAgICAgICAgICAgIHRhcmdldHMsXG4gICAgICAgICAgICBzdGF0c1F1ZXJ5LFxuICAgICAgICAgICAgbG9nZ2VyXG4gICAgICAgICk7XG4gICAgICAgIFBhY2tlckRyaXZlci5faW5zdGFuY2UgPSBwYWNrZXI7XG4gICAgICAgIHJldHVybiBwYWNrZXI7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBxdWVyeUNDRU1vZHVsZU1hcCgpOiBDQ0VNb2R1bGVNYXAge1xuICAgICAgICBjb25zdCBjY2VNb2R1bGVNYXBMb2NhdGlvbiA9IHBzLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vLi4vc3RhdGljL3NjcmlwdGluZy9jY2UtbW9kdWxlLmpzb25jJyk7XG4gICAgICAgIGNvbnN0IGNjZU1vZHVsZU1hcCA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjY2VNb2R1bGVNYXBMb2NhdGlvbiwgJ3V0ZjgnKSkgYXMgQ0NFTW9kdWxlTWFwO1xuICAgICAgICBjY2VNb2R1bGVNYXAubWFwTG9jYXRpb24gPSBjY2VNb2R1bGVNYXBMb2NhdGlvbjtcbiAgICAgICAgcmV0dXJuIGNjZU1vZHVsZU1hcDtcbiAgICB9XG5cbiAgICAvKirmnoTlu7rku7vliqHnmoTlp5TmiZjvvIzlnKjmnoTlu7rkuYvliY3kvJrmiorlp5TmiZjph4zpnaLnmoTmiYDmnInlhoXlrrnmiafooYwgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgYmVmb3JlRWRpdG9yQnVpbGREZWxlZ2F0ZTogQXN5bmNEZWxlZ2F0ZTwoY2hhbmdlczogTW9kaWZpZWRBc3NldENoYW5nZVtdKSA9PiBQcm9taXNlPHZvaWQ+PiA9IG5ldyBBc3luY0RlbGVnYXRlKCk7XG4gICAgcHVibGljIGJ1c3koKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9idWlsZGluZztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlRGJJbmZvcyhkYkluZm86IERCSW5mbywgZGJDaGFuZ2VUeXBlOiBEQkNoYW5nZVR5cGUpIHtcbiAgICAgICAgY29uc3Qgb2xkRGJJbmZvU2l6ZSA9IHRoaXMuX2RiSW5mb3MubGVuZ3RoO1xuICAgICAgICBpZiAoZGJDaGFuZ2VUeXBlID09PSBEQkNoYW5nZVR5cGUuYWRkKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2RiSW5mb3Muc29tZShpdGVtID0+IGl0ZW0uZGJJRCA9PT0gZGJJbmZvLmRiSUQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGJJbmZvcy5wdXNoKGRiSW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZGJDaGFuZ2VUeXBlID09PSBEQkNoYW5nZVR5cGUucmVtb3ZlKSB7XG4gICAgICAgICAgICB0aGlzLl9kYkluZm9zID0gdGhpcy5fZGJJbmZvcy5maWx0ZXIoaXRlbSA9PiBpdGVtLmRiSUQgIT09IGRiSW5mby5kYklEKTtcbiAgICAgICAgICAgIGNvbnN0IHNjcmlwdEluZm9zID0gdGhpcy5fYXNzZXREYkludGVyb3AucmVtb3ZlVHNTY3JpcHRJbmZvQ2FjaGUoZGJJbmZvLnRhcmdldCk7XG4gICAgICAgICAgICBzY3JpcHRJbmZvcy5mb3JFYWNoKChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXNzZXRDaGFuZ2VRdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQXNzZXRBY3Rpb25FbnVtLmRlbGV0ZSxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZXI6ICd0eXBlc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGluZm8uZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGluZm8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgaXNQbHVnaW5TY3JpcHQ6IGluZm8uaXNQbHVnaW5TY3JpcHQsXG4gICAgICAgICAgICAgICAgICAgIHVybDogaW5mby51cmwsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob2xkRGJJbmZvU2l6ZSA9PT0gdGhpcy5fZGJJbmZvcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY29uc3QgdXBkYXRlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXREYXRhYmFzZURvbWFpbnMgPSBhd2FpdCB0aGlzLl9hc3NldERiSW50ZXJvcC5xdWVyeUFzc2V0RG9tYWlucyh0aGlzLl9kYkluZm9zKTtcbiAgICAgICAgICAgIHNlbGYuX2xvZ2dlci5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAnUmVzZXQgZGF0YWJhc2VzLiAnICtcbiAgICAgICAgICAgICAgICBgRW51bWVyYXRlZCBkb21haW5zOiAke0pTT04uc3RyaW5naWZ5KGFzc2V0RGF0YWJhc2VEb21haW5zLCB1bmRlZmluZWQsIDIpfWApO1xuXG5cbiAgICAgICAgICAgIGNvbnN0IHRzQnVpbGRlciA9IHNlbGYuX3RzQnVpbGRlcjtcbiAgICAgICAgICAgIHRzQnVpbGRlci5zZXREYlVSTEluZm9zKHRoaXMuX2RiSW5mb3MpO1xuICAgICAgICAgICAgY29uc3QgcmVhbFRzQ29uZmlnUGF0aCA9IHRzQnVpbGRlci5nZXRSZWFsVHNDb25maWdQYXRoKCk7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRzQnVpbGRlci5nZXRQcm9qZWN0UGF0aCgpO1xuICAgICAgICAgICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gYXdhaXQgdHNCdWlsZGVyLmdldENvbXBpbGVyT3B0aW9ucygpO1xuICAgICAgICAgICAgY29uc3QgaW50ZXJuYWxEYlVSTEluZm9zID0gYXdhaXQgdHNCdWlsZGVyLmdldEludGVybmFsRGJVUkxJbmZvcygpO1xuICAgICAgICAgICAgc2VsZi5sYW5ndWFnZVNlcnZpY2UgPSBuZXcgTGFuZ3VhZ2VTZXJ2aWNlQWRhcHRlcihyZWFsVHNDb25maWdQYXRoLCBwcm9qZWN0UGF0aCwgc2VsZi5iZWZvcmVFZGl0b3JCdWlsZERlbGVnYXRlLCBjb21waWxlck9wdGlvbnMsIGludGVybmFsRGJVUkxJbmZvcyk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuX3RhcmdldHMpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LnVwZGF0ZURiSW5mb3ModGhpcy5fZGJJbmZvcyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGFyZ2V0LnNldEFzc2V0RGF0YWJhc2VEb21haW5zKGFzc2V0RGF0YWJhc2VEb21haW5zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMuYnVzeSgpKSB7XG4gICAgICAgICAgICB0aGlzLl9iZWZvcmVCdWlsZFRhc2tzLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCB1cGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRpc3BhdGNoQXNzZXRDaGFuZ2VzKGFzc2V0Q2hhbmdlOiBBc3NldENoYW5nZUluZm8pIHtcbiAgICAgICAgdGhpcy5fYXNzZXREYkludGVyb3Aub25Bc3NldENoYW5nZShhc3NldENoYW5nZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LuOIGFzc2V0LWRiIOiOt+WPluaJgOacieaVsOaNruW5tuaehOW7uu+8jOWMheWQqyB0cyDlkowganMg6ISa5pys44CCXG4gICAgICogQXNzZXRDaGFuZ2UgZm9ybWF0OlxuICAgICAqICB7XG4gICAgICogICAgICB0eXBlOiBBc3NldENoYW5nZVR5cGUuYWRkLFxuICAgICAgICAgICAgdXVpZDogYXNzZXRJbmZvLnV1aWQsXG4gICAgICAgICAgICBmaWxlUGF0aDogYXNzZXRJbmZvLmZpbGUsXG4gICAgICAgICAgICB1cmw6IGdldFVSTChhc3NldEluZm8pLFxuICAgICAgICAgICAgaXNQbHVnaW5TY3JpcHQ6IGlzUGx1Z2luU2NyaXB0KG1ldGEgfHwgYXNzZXRJbmZvLm1ldGEhKSxcbiAgICAgKiAgfVxuICAgICAqIEBwYXJhbSBhc3NldENoYW5nZXMg6LWE5rqQ5Y+Y5pu05YiX6KGoXG4gICAgICogQHBhcmFtIHRhc2tJZCDku7vliqFJRO+8jOeUqOS6jui3n+i4quS7u+WKoeeKtuaAgVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBidWlsZChjaGFuZ2VJbmZvcz86IEFzc2V0Q2hhbmdlSW5mb1tdLCB0YXNrSWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbG9nZ2VyID0gdGhpcy5fbG9nZ2VyO1xuXG4gICAgICAgIGxvZ2dlci5kZWJ1ZygnUHVsbGluZyBhc3NldC1kYi4nKTtcblxuICAgICAgICBjb25zdCB0MSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICBpZiAoY2hhbmdlSW5mb3MgJiYgY2hhbmdlSW5mb3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY2hhbmdlSW5mb3MuZm9yRWFjaChjaGFuZ2VJbmZvID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hc3NldERiSW50ZXJvcC5vbkFzc2V0Q2hhbmdlKGNoYW5nZUluZm8pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGVuZGluZ0NoYW5nZXMgPSB0aGlzLl9hc3NldERiSW50ZXJvcC5nZXRBc3NldENoYW5nZVF1ZXVlKCk7XG4gICAgICAgIGlmIChwZW5kaW5nQ2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9hc3NldENoYW5nZVF1ZXVlLnB1c2goLi4ucGVuZGluZ0NoYW5nZXMpO1xuICAgICAgICAgICAgdGhpcy5fYXNzZXREYkludGVyb3AucmVzZXRBc3NldENoYW5nZVF1ZXVlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdDIgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICBsb2dnZXIuZGVidWcoYEZldGNoIGFzc2V0LWRiIGNvc3Q6ICR7dDIgLSB0MX1tcy5gKTtcblxuICAgICAgICBhd2FpdCB0aGlzLl9zdGFydEJ1aWxkKHRhc2tJZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNsZWFyQ2FjaGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jbGVhcmluZykge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKCdGYWlsZWQgdG8gY2xlYXIgY2FjaGU6IHByZXZpb3VzIGNsZWFyaW5nIGhhdmUgbm90IGZpbmlzaGVkIHlldC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5idXN5KCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcignRmFpbGVkIHRvIGNsZWFyIGNhY2hlOiB0aGUgYnVpbGRpbmcgaXMgc3RpbGwgd29ya2luZyBpbiBwcm9ncmVzcy4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jbGVhcmluZyA9IHRydWU7XG4gICAgICAgIGZvciAoY29uc3QgW25hbWUsIHRhcmdldF0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5fdGFyZ2V0cykpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhgQ2xlYXIgY2FjaGUgb2YgdGFyZ2V0ICR7bmFtZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRhcmdldC5jbGVhckNhY2hlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKCdSZXF1ZXN0IGJ1aWxkIGFmdGVyIGNsZWFyaW5nLi4uJyk7XG4gICAgICAgIGF3YWl0IHRoaXMuYnVpbGQoW10pO1xuICAgICAgICB0aGlzLl9jbGVhcmluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRRdWlja1BhY2tMb2FkZXJDb250ZXh0KHRhcmdldE5hbWU6IFRhcmdldE5hbWUpIHtcbiAgICAgICAgdGhpcy5fd2Fybk1pc3NpbmdUYXJnZXQodGFyZ2V0TmFtZSk7XG4gICAgICAgIGlmICh0YXJnZXROYW1lIGluIHRoaXMuX3RhcmdldHMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90YXJnZXRzW3RhcmdldE5hbWVdLnF1aWNrUGFja0xvYWRlckNvbnRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGlzUmVhZHkodGFyZ2V0TmFtZTogVGFyZ2V0TmFtZSkge1xuICAgICAgICB0aGlzLl93YXJuTWlzc2luZ1RhcmdldCh0YXJnZXROYW1lKTtcbiAgICAgICAgaWYgKHRhcmdldE5hbWUgaW4gdGhpcy5fdGFyZ2V0cykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RhcmdldHNbdGFyZ2V0TmFtZV0ucmVhZHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN5q2j5Zyo5omn6KGM55qE57yW6K+R5Lu75YqhSURcbiAgICAgKiBAcmV0dXJucyDku7vliqFJRO+8jOWmguaenOayoeacieato+WcqOaJp+ihjOeahOS7u+WKoeWImei/lOWbnm51bGxcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0Q3VycmVudFRhc2tJZCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRUYXNrSWQ7XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5U2NyaXB0RGVwcyhxdWVyeVBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICAgICAgY29uc3Qgc2NyaXB0UGF0aDogc3RyaW5nID0gcGF0aC5ub3JtYWxpemUocXVlcnlQYXRoKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgIHRoaXMuX3RyYW5zZm9ybURlcHNHcmFwaCgpO1xuICAgICAgICBpZiAodGhpcy5fZGVwc0dyYXBoQ2FjaGVbc2NyaXB0UGF0aF0pIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2RlcHNHcmFwaENhY2hlW3NjcmlwdFBhdGhdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHB1YmxpYyBxdWVyeVNjcmlwdFVzZXJzKHF1ZXJ5UGF0aDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBzY3JpcHRQYXRoOiBzdHJpbmcgPSBwYXRoLm5vcm1hbGl6ZShxdWVyeVBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtRGVwc0dyYXBoKCk7XG4gICAgICAgIGlmICh0aGlzLl91c2VkR3JhcGhDYWNoZVtzY3JpcHRQYXRoXSkge1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fdXNlZEdyYXBoQ2FjaGVbc2NyaXB0UGF0aF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2h1dERvd24oKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGVzdHJveWVkKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZGJJbmZvczogREJJbmZvW10gPSBbXTtcbiAgICBwcml2YXRlIF90c0J1aWxkZXI6IFR5cGVTY3JpcHRDb25maWdCdWlsZGVyO1xuICAgIHByaXZhdGUgX2NsZWFyaW5nID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfdGFyZ2V0czogUmVjb3JkPFRhcmdldE5hbWUsIFBhY2tUYXJnZXQ+ID0ge307XG4gICAgcHJpdmF0ZSBfbG9nZ2VyOiBQYWNrZXJEcml2ZXJMb2dnZXI7XG4gICAgcHJpdmF0ZSBfc3RhdHNRdWVyeTogU3RhdHNRdWVyeTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hc3NldERiSW50ZXJvcDogQXNzZXREYkludGVyb3A7XG4gICAgcHJpdmF0ZSBfYXNzZXRDaGFuZ2VRdWV1ZTogQXNzZXRDaGFuZ2VbXSA9IFtdO1xuICAgIHByaXZhdGUgX2J1aWxkaW5nID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfZmVhdHVyZUNoYW5nZWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9iZWZvcmVCdWlsZFRhc2tzOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICAgIHByaXZhdGUgX2RlcHNHcmFwaDogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG4gICAgcHJpdmF0ZSBfbmVlZFVwZGF0ZURlcHNDYWNoZSA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3VzZWRHcmFwaENhY2hlOiBSZWNvcmQ8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSB7fTtcbiAgICBwcml2YXRlIF9kZXBzR3JhcGhDYWNoZTogUmVjb3JkPHN0cmluZywgU2V0PHN0cmluZz4+ID0ge307XG4gICAgcHJpdmF0ZSBzdGF0aWMgX2NjZU1vZHVsZU1hcDogQ0NFTW9kdWxlTWFwO1xuICAgIHByaXZhdGUgc3RhdGljIF9pbXBvcnRSZXN0cmljdGlvbnM6IGFueVtdID0gW107XG4gICAgcHJpdmF0ZSBfaW5pdCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2ZlYXR1cmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIHByaXZhdGUgX2N1cnJlbnRUYXNrSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihidWlsZGVyOiBUeXBlU2NyaXB0Q29uZmlnQnVpbGRlciwgdGFyZ2V0czogUGFja2VyRHJpdmVyWydfdGFyZ2V0cyddLCBzdGF0c1F1ZXJ5OiBTdGF0c1F1ZXJ5LCBsb2dnZXI6IFBhY2tlckRyaXZlckxvZ2dlcikge1xuICAgICAgICB0aGlzLl90c0J1aWxkZXIgPSBidWlsZGVyO1xuICAgICAgICB0aGlzLl90YXJnZXRzID0gdGFyZ2V0cztcbiAgICAgICAgdGhpcy5fc3RhdHNRdWVyeSA9IHN0YXRzUXVlcnk7XG4gICAgICAgIHRoaXMuX2xvZ2dlciA9IGxvZ2dlcjtcbiAgICAgICAgdGhpcy5fYXNzZXREYkludGVyb3AgPSBuZXcgQXNzZXREYkludGVyb3AoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGZlYXR1cmVzKGZlYXR1cmVzOiBzdHJpbmdbXSkge1xuICAgICAgICB0aGlzLl9mZWF0dXJlcyA9IGZlYXR1cmVzO1xuICAgICAgICB0aGlzLl9mZWF0dXJlQ2hhbmdlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGluaXQoZmVhdHVyZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5pdCA9IHRydWU7XG4gICAgICAgIHRoaXMuX2ZlYXR1cmVzID0gZmVhdHVyZXM7XG4gICAgICAgIGF3YWl0IHRoaXMuX3N5bmNFbmdpbmVGZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGdlbmVyYXRlRGVjbGFyYXRpb25zKCkge1xuICAgICAgICBhd2FpdCB0aGlzLl90c0J1aWxkZXIuZ2VuZXJhdGVEZWNsYXJhdGlvbnMoW10pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBxdWVyeVNoYXJlZFNldHRpbmdzKCk6IFByb21pc2U8U2hhcmVkU2V0dGluZ3M+IHtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5U2hhcmVkU2V0dGluZ3ModGhpcy5fbG9nZ2VyKTtcbiAgICB9XG5cbiAgICBhc3luYyBkZXN0cm95ZWQoKSB7XG4gICAgICAgIHRoaXMuX2luaXQgPSBmYWxzZTtcbiAgICAgICAgYXdhaXQgdGhpcy5fYXNzZXREYkludGVyb3AuZGVzdHJveWVkKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfd2Fybk1pc3NpbmdUYXJnZXQodGFyZ2V0TmFtZTogVGFyZ2V0TmFtZSkge1xuICAgICAgICBpZiAoISh0YXJnZXROYW1lIGluIHRoaXMuX3RhcmdldHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgcGFjayB0YXJnZXQ6ICR7dGFyZ2V0TmFtZX0uIEV4aXN0aW5nIHRhcmdldHMgYXJlOiAke09iamVjdC5rZXlzKHRoaXMuX3RhcmdldHMpfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5byA5aeL5LiA5qyh5p6E5bu644CCXG4gICAgICogQHBhcmFtIHRhc2tJZCDku7vliqFJRO+8jOeUqOS6jui3n+i4quS7u+WKoeeKtuaAgVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX3N0YXJ0QnVpbGQodGFza0lkPzogc3RyaW5nKSB7XG4gICAgICAgIC8vIOebruWJjeS4jeiDveebtOaOpei3s+i/h++8jOWboOS4uuiwg+eUqOe8luivkeaOpeWPo+aXtuaYr+acn+acm+eri+WNs+aJp+ihjOeahO+8jOWmguaenOi3s+i/h+S8muWvvOiHtOe8luivkeS7u+WKoeaXoOazleaJp+ihjOOAglxuICAgICAgICAvLyBpZiAodGhpcy5fYnVpbGRpbmcpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZygnQnVpbGQgaXRlcmF0aW9uIGFscmVhZHkgc3RhcnRlZCwgc2tpcC4nKTtcbiAgICAgICAgLy8gICAgIHJldHVybjtcbiAgICAgICAgLy8gfVxuICAgICAgICB0aGlzLl9idWlsZGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRUYXNrSWQgPSB0YXNrSWQgfHwgbnVsbDtcbiAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoJ2NvbXBpbGUtc3RhcnQnLCAncHJvamVjdCcsIHRhc2tJZCk7XG5cbiAgICAgICAgdGhpcy5fbG9nZ2VyLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhcbiAgICAgICAgICAgICdCdWlsZCBpdGVyYXRpb24gc3RhcnRzLlxcbicgK1xuICAgICAgICAgICAgYE51bWJlciBvZiBhY2N1bXVsYXRlZCBhc3NldCBjaGFuZ2VzOiAke3RoaXMuX2Fzc2V0Q2hhbmdlUXVldWUubGVuZ3RofVxcbmAgK1xuICAgICAgICAgICAgYEZlYXR1cmUgY2hhbmdlZDogJHt0aGlzLl9mZWF0dXJlQ2hhbmdlZH1gICtcbiAgICAgICAgICAgICh0YXNrSWQgPyBgXFxuVGFzayBJRDogJHt0YXNrSWR9YCA6ICcnKSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRoaXMuX2ZlYXR1cmVDaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9mZWF0dXJlQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc3luY0VuZ2luZUZlYXR1cmVzKHRoaXMuX2ZlYXR1cmVzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhc3NldENoYW5nZXMgPSB0aGlzLl9hc3NldENoYW5nZVF1ZXVlO1xuICAgICAgICB0aGlzLl9hc3NldENoYW5nZVF1ZXVlID0gW107XG4gICAgICAgIGNvbnN0IGJlZm9yZVRhc2tzID0gdGhpcy5fYmVmb3JlQnVpbGRUYXNrcy5zbGljZSgpO1xuICAgICAgICB0aGlzLl9iZWZvcmVCdWlsZFRhc2tzLmxlbmd0aCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgYmVmb3JlVGFzayBvZiBiZWZvcmVUYXNrcykge1xuICAgICAgICAgICAgYmVmb3JlVGFzaygpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuYmVmb3JlRWRpdG9yQnVpbGREZWxlZ2F0ZS5kaXNwYXRjaChhc3NldENoYW5nZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS50eXBlID09PSBBc3NldEFjdGlvbkVudW0uY2hhbmdlKSBhcyBNb2RpZmllZEFzc2V0Q2hhbmdlW10pO1xuICAgICAgICBjb25zdCBub25EVFNDaGFuZ2VzID0gYXNzZXRDaGFuZ2VzLmZpbHRlcihpdGVtID0+ICFpdGVtLmZpbGVQYXRoLmVuZHNXaXRoKCcuZC50cycpKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBlcnI6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3QgWywgdGFyZ2V0XSBvZiBPYmplY3QuZW50cmllcyh0aGlzLl90YXJnZXRzKSkge1xuICAgICAgICAgICAgaWYgKGFzc2V0Q2hhbmdlcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0YXJnZXQuYXBwbHlBc3NldENoYW5nZXMobm9uRFRTQ2hhbmdlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBidWlsZFJlc3VsdCA9IGF3YWl0IHRhcmdldC5idWlsZCgpO1xuICAgICAgICAgICAgaWYgKGJ1aWxkUmVzdWx0LmVycikge1xuICAgICAgICAgICAgICAgIGVyciA9IGJ1aWxkUmVzdWx0LmVycjtcbiAgICAgICAgICAgICAgICB0YXJnZXQuZGVsZXRlQ2FjaGVGaWxlKChlcnIgYXMgYW55KS5maWxlKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChidWlsZFJlc3VsdC5kZXBzR3JhcGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZXBzR3JhcGggPSBidWlsZFJlc3VsdC5kZXBzR3JhcGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9uZWVkVXBkYXRlRGVwc0NhY2hlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9idWlsZGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jdXJyZW50VGFza0lkID0gbnVsbDtcblxuICAgICAgICBldmVudEVtaXR0ZXIuZW1pdCgnY29tcGlsZWQnLCAncHJvamVjdCcpO1xuXG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIGFzeW5jIF9jcmVhdGVJbmNyZW1lbnRhbFJlY29yZChsb2dnZXI6IExvZ2dlcik6IFByb21pc2U8SW5jcmVtZW50YWxSZWNvcmQ+IHtcbiAgICAgICAgY29uc3Qgc2hhcmVkTW9kTG9PcHRpb25zID0gYXdhaXQgcXVlcnlTaGFyZWRTZXR0aW5ncyhsb2dnZXIpO1xuXG4gICAgICAgIGNvbnN0IGluY3JlbWVudGFsUmVjb3JkOiBJbmNyZW1lbnRhbFJlY29yZCA9IHtcbiAgICAgICAgICAgIHZlcnNpb246IFZFUlNJT04sXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICAuLi5zaGFyZWRNb2RMb09wdGlvbnMsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHByZXZpZXdCcm93c2Vyc0xpc3RDb25maWdGaWxlID0gYXdhaXQgc2NyaXB0Q29uZmlnLmdldFByb2plY3QoJ3ByZXZpZXdCcm93c2Vyc2xpc3RDb25maWdGaWxlJykgYXMgc3RyaW5nO1xuICAgICAgICBpZiAocHJldmlld0Jyb3dzZXJzTGlzdENvbmZpZ0ZpbGUgJiYgcHJldmlld0Jyb3dzZXJzTGlzdENvbmZpZ0ZpbGUgIT09ICdwcm9qZWN0Oi8vJykge1xuICAgICAgICAgICAgY29uc3QgcHJldmlld0Jyb3dzZXJzTGlzdENvbmZpZ0ZpbGVQYXRoID0gdXJsMnBhdGgocHJldmlld0Jyb3dzZXJzTGlzdENvbmZpZ0ZpbGUgYXMgc3RyaW5nKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZpZXdCcm93c2Vyc0xpc3RDb25maWdGaWxlUGF0aCAmJiBleGlzdHNTeW5jKHByZXZpZXdCcm93c2Vyc0xpc3RDb25maWdGaWxlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJldmlld1RhcmdldCA9IGF3YWl0IHJlYWRCcm93c2Vyc2xpc3RUYXJnZXQocHJldmlld0Jyb3dzZXJzTGlzdENvbmZpZ0ZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZpZXdUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY3JlbWVudGFsUmVjb3JkLmNvbmZpZy5wcmV2aWV3VGFyZ2V0ID0gcHJldmlld1RhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBQcmV2aWV3IHRhcmdldCBjb25maWcgZmlsZSBub3QgZm91bmQuICR7cHJldmlld0Jyb3dzZXJzTGlzdENvbmZpZ0ZpbGVQYXRoIHx8IHByZXZpZXdCcm93c2Vyc0xpc3RDb25maWdGaWxlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGBGYWlsZWQgdG8gbG9hZCBwcmV2aWV3IHRhcmdldCBjb25maWcgZmlsZSBhdCAke3ByZXZpZXdCcm93c2Vyc0xpc3RDb25maWdGaWxlUGF0aCB8fCBwcmV2aWV3QnJvd3NlcnNMaXN0Q29uZmlnRmlsZX06ICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5jcmVtZW50YWxSZWNvcmQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX3ZhbGlkYXRlSW5jcmVtZW50YWxSZWNvcmQoXG4gICAgICAgIHJlY29yZDogSW5jcmVtZW50YWxSZWNvcmQsXG4gICAgICAgIHJlY29yZEZpbGU6IHN0cmluZyxcbiAgICAgICAgdGFyZ2V0V29ya3NwYWNlQmFzZTogc3RyaW5nLFxuICAgICAgICBsb2dnZXI6IExvZ2dlcixcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IG1hdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG9sZFJlY29yZDogSW5jcmVtZW50YWxSZWNvcmQgPSBhd2FpdCBmcy5yZWFkSnNvbihyZWNvcmRGaWxlKTtcbiAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaE9iamVjdChyZWNvcmQsIG9sZFJlY29yZCk7XG4gICAgICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnSW5jcmVtZW50YWwgZmlsZSBzZWVtcyBncmVhdC4nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnW1BhY2tlckRyaXZlcl0gT3B0aW9ucyBkb2VzblxcJ3QgbWF0Y2guXFxuJyArXG4gICAgICAgICAgICAgICAgICAgIGBMYXN0OiAke0pTT04uc3RyaW5naWZ5KHJlY29yZCwgdW5kZWZpbmVkLCAyKX1cXG5gICtcbiAgICAgICAgICAgICAgICAgICAgYEN1cnJlbnQ6ICR7SlNPTi5zdHJpbmdpZnkob2xkUmVjb3JkLCB1bmRlZmluZWQsIDIpfWAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoYFBhY2tlciBkZXJpdmVyIHZlcnNpb24gZmlsZSBsb3N0IG9yIGZvcm1hdCBpbmNvcnJlY3Q6ICR7ZXJyfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtYXRjaGVkKSB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ0NsZWFyaW5nIG91dCB0aGUgdGFyZ2V0cy4uLicpO1xuICAgICAgICAgICAgYXdhaXQgZnMuZW1wdHlEaXIodGFyZ2V0V29ya3NwYWNlQmFzZSk7XG4gICAgICAgICAgICBhd2FpdCBmcy5vdXRwdXRKc29uKHJlY29yZEZpbGUsIHJlY29yZCwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyBfZ2V0RW5naW5lRmVhdHVyZXNTaGlwcGVkSW5FZGl0b3Ioc3RhdHNRdWVyeTogU3RhdHNRdWVyeSkge1xuICAgICAgICAvLyDku44gdjMuOC41IOW8gOWni++8jOaUr+aMgeaJi+WKqOWKoOi9vSBXQVNNIOaooeWdl++8jOaPkOS+m+S6hiBsb2FkV2FzbU1vZHVsZUJveDJELCBsb2FkV2FzbU1vZHVsZUJ1bGxldCDnrYnmlrnms5XvvIzov5nkupvmlrnms5XmmK/lnKggZmVhdHVyZSDlhaXlj6MgKCBleHBvcnRzIOebruW9leS4i+eahOaWh+S7tuWvvOWHuueahClcbiAgICAgICAgLy8g5LmL5YmN5YmU6Zmk6L+Z5Lqb5ZCO56uvIGZlYXR1cmUg5YWl5Y+j77yM5bqU6K+l5piv5ZyoIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy8zZC10YXNrcy9pc3N1ZXMvNTc0NyDkuK3nmoTlu7rorq7jgIJcbiAgICAgICAgLy8g5L2G5a6e6ZmF5LiK77yM57yW6L6R5Zmo546v5aKD5LiL55qE5byV5pOO5omT5YyF55qE5pe25YCZ77yM5bey57uP5oqK5omA5pyJ5qih5Z2X5omT6L+bIGJ1bmRsZWQvaW5kZXguanMg5Lit77yM6KeB77yaaHR0cHM6Ly9naXRodWIuY29tL2NvY29zL2NvY29zLWVkaXRvci9ibG9iLzMuOC41L2FwcC9idWlsdGluL2VuZ2luZS9zdGF0aWMvZW5naW5lLWNvbXBpbGVyL3NvdXJjZS9pbmRleC50cyNMMTE0IOOAglxuICAgICAgICAvLyDlkK/liqjlvJXmk47kuZ/miafooYzkuobmr4/kuKrlkI7nq6/nmoTku6PnoIHvvIzor6bop4HvvJpodHRwczovL2dpdGh1Yi5jb20vY29jb3MvY29jb3MtZWRpdG9yL2Jsb2IvMy44LjUvYXBwL2J1aWx0aW4vc2NlbmUvc291cmNlL3NjcmlwdC8zZC9tYW5hZ2VyL3N0YXJ0dXAvZW5naW5lL2luZGV4LnRzI0w5NyDjgIJcbiAgICAgICAgLy8g6aG555uuIGltcG9ydCDnmoQgY2Mg5Zyo6L+Z6YeM6KKr5Yqg6L2977yaIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy9jb2Nvcy1lZGl0b3IvYmxvYi8zLjguNS9wYWNrYWdlcy9saWItcHJvZ3JhbW1pbmcvc3JjL2V4ZWN1dG9yL2luZGV4LnRzI0wzNTUgXG4gICAgICAgIC8vIOWFtuWMheWQq+eahOWvvOWHuiBmZWF0dXJlcyDmmK/moLnmja4gX2dldEVuZ2luZUZlYXR1cmVzU2hpcHBlZEluRWRpdG9yIOi/meS4quW9k+WJjeWHveaVsOi/lOWbnueahCBmZWF0dXJlcyDlhrPlrprnmoTjgILlm6DmraTvvIzkuI3kvJrljIXlkKsgbG9hZFdhc21Nb2R1bGVCb3gyRO+8jCBsb2FkV2FzbU1vZHVsZUJ1bGxldO+8jCBsb2FkV2FzbU1vZHVsZVBoeXNYIOi/meWHoOS4quWHveaVsOOAglxuICAgICAgICAvLyDov5nkuKrpgLvovpHot5/mtY/op4jlmajpooTop4jjgIHmnoTlu7rlkI7nmoTov5DooYzml7bnjq/looPpg73mnInlt67lvILvvIzogIzkuJTmsqHmnInlv4XopoHvvIzmjpLpmaTov5nkupvmlrnms5Xlj6rkvJrlr7zoh7Tlt67lvILvvIzlubbkuI3og73luKbmnaXljIXkvZPjgIHmgKfog73mlrnpnaLnmoTmj5DljYfjgIJcbiAgICAgICAgcmV0dXJuIHN0YXRzUXVlcnkuZ2V0RmVhdHVyZXMoKTtcblxuICAgICAgICAvLyBjb25zdCBlZGl0b3JGZWF0dXJlczogc3RyaW5nW10gPSBzdGF0c1F1ZXJ5LmdldEZlYXR1cmVzKCkuZmlsdGVyKChmZWF0dXJlTmFtZSkgPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuICFbXG4gICAgICAgIC8vICAgICAgICAgJ3BoeXNpY3MtYW1tbycsXG4gICAgICAgIC8vICAgICAgICAgJ3BoeXNpY3MtYnVpbHRpbicsXG4gICAgICAgIC8vICAgICAgICAgJ3BoeXNpY3MtY2Fubm9uJyxcbiAgICAgICAgLy8gICAgICAgICAncGh5c2ljcy1waHlzeCcsXG4gICAgICAgIC8vICAgICAgICAgJ3BoeXNpY3MtMmQtYm94MmQnLFxuICAgICAgICAvLyAgICAgICAgICdwaHlzaWNzLTJkLWJ1aWx0aW4nLFxuICAgICAgICAvLyAgICAgXS5pbmNsdWRlcyhmZWF0dXJlTmFtZSk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyByZXR1cm4gZWRpdG9yRmVhdHVyZXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfc3luY0VuZ2luZUZlYXR1cmVzKGZlYXR1cmVzOiBzdHJpbmdbXSkge1xuICAgICAgICB0aGlzLl9sb2dnZXIuZGVidWcoYFN5bmMgZW5naW5lIGZlYXR1cmVzOiAke2ZlYXR1cmVzfWApO1xuXG4gICAgICAgIGNvbnN0IGVuZ2luZUluZGV4TW9kdWxlU291cmNlID0gUGFja2VyRHJpdmVyLl9nZXRFbmdpbmVJbmRleE1vZHVsZVNvdXJjZSh0aGlzLl9zdGF0c1F1ZXJ5LCBmZWF0dXJlcyk7XG4gICAgICAgIGZvciAoY29uc3QgWywgdGFyZ2V0XSBvZiBPYmplY3QuZW50cmllcyh0aGlzLl90YXJnZXRzKSkge1xuICAgICAgICAgICAgaWYgKHRhcmdldC5yZXNwZWN0VG9FbmdpbmVGZWF0dXJlU2V0dGluZykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRhcmdldC5zZXRFbmdpbmVJbmRleE1vZHVsZVNvdXJjZShlbmdpbmVJbmRleE1vZHVsZVNvdXJjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfZ2V0RW5naW5lSW5kZXhNb2R1bGVTb3VyY2Uoc3RhdHNRdWVyeTogU3RhdHNRdWVyeSwgZmVhdHVyZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVVbml0cyA9IHN0YXRzUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGZlYXR1cmVzKTtcbiAgICAgICAgY29uc3QgZW5naW5lSW5kZXhNb2R1bGVTb3VyY2UgPSBzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgICAgICBmZWF0dXJlVW5pdHMsXG4gICAgICAgICAgICAoZmVhdHVyZVVuaXQpID0+IGAke2ZlYXR1cmVVbml0TW9kdWxlUHJlZml4fSR7ZmVhdHVyZVVuaXR9YCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGVuZ2luZUluZGV4TW9kdWxlU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhiBkZXBzR3JhcGgg5LuOIGZpbGUg5Y2P6K6u6L2s5oiQIGRiIOi3r+W+hOWNj+iuruOAglxuICAgICAqIOW5tuS4lOi/h+a7pOaOieS4gOS6m+WklumDqOaooeWdl+OAglxuICAgICAqL1xuICAgIHByaXZhdGUgX3RyYW5zZm9ybURlcHNHcmFwaCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9uZWVkVXBkYXRlRGVwc0NhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbmVlZFVwZGF0ZURlcHNDYWNoZSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBfZGVwc0dyYXBoOiBSZWNvcmQ8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSB7fTtcbiAgICAgICAgY29uc3QgX3VzZWRHcmFwaDogUmVjb3JkPHN0cmluZywgU2V0PHN0cmluZz4+ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgW3NjcmlwdEZpbGVQYXRoLCBkZXBGaWxlUGF0aHNdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuX2RlcHNHcmFwaCkpIHtcbiAgICAgICAgICAgIGlmICghc2NyaXB0RmlsZVBhdGguc3RhcnRzV2l0aCgnZmlsZTovLycpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzY3JpcHRQYXRoID0gZmlsZVVSTFRvUGF0aChzY3JpcHRGaWxlUGF0aCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICAgICAgaWYgKCFfZGVwc0dyYXBoW3NjcmlwdFBhdGhdKSB7XG4gICAgICAgICAgICAgICAgX2RlcHNHcmFwaFtzY3JpcHRQYXRoXSA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBkZXBGaWxlUGF0aHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGguc3RhcnRzV2l0aCgnZmlsZTovLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBkZXBQYXRoID0gZmlsZVVSTFRvUGF0aChwYXRoKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgICAgICAgICAgX2RlcHNHcmFwaFtzY3JpcHRQYXRoXS5hZGQoZGVwUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFfdXNlZEdyYXBoW2RlcFBhdGhdKSB7XG4gICAgICAgICAgICAgICAgICAgIF91c2VkR3JhcGhbZGVwUGF0aF0gPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF91c2VkR3JhcGhbZGVwUGF0aF0uYWRkKHNjcmlwdFBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VzZWRHcmFwaENhY2hlID0gX3VzZWRHcmFwaDtcbiAgICAgICAgdGhpcy5fZGVwc0dyYXBoQ2FjaGUgPSBfZGVwc0dyYXBoO1xuICAgIH1cbn1cblxuY29uc3QgZW5naW5lSW5kZXhNb2RVUkwgPSAnY2NlOi9pbnRlcm5hbC94L2NjJztcblxudHlwZSBUYXJnZXROYW1lID0gc3RyaW5nO1xuXG50eXBlIFByZWRlZmluZWRUYXJnZXROYW1lID0gJ2VkaXRvcicgfCAncHJldmlldyc7XG5cbmNvbnN0IERFRkFVTFRfUFJFVklFV19CUk9XU0VSU19MSVNUX1RBUkdFVCA9ICdzdXBwb3J0cyBlczYtbW9kdWxlJztcblxuY29uc3QgcHJlZGVmaW5lZFRhcmdldHM6IFJlY29yZDxQcmVkZWZpbmVkVGFyZ2V0TmFtZSwgUHJlZGVmaW5lZFRhcmdldD4gPSB7XG4gICAgZWRpdG9yOiB7XG4gICAgICAgIG5hbWU6ICdFZGl0b3InLFxuICAgICAgICBicm93c2Vyc0xpc3RUYXJnZXRzOiBlZGl0b3JCcm93c2Vyc2xpc3RRdWVyeSxcbiAgICAgICAgc291cmNlTWFwczogJ2lubGluZScsXG4gICAgICAgIGlzRWRpdG9yOiB0cnVlLFxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgICBuYW1lOiAnUHJldmlldycsXG4gICAgICAgIHNvdXJjZU1hcHM6IHRydWUsXG4gICAgICAgIGJyb3dzZXJzTGlzdFRhcmdldHM6IERFRkFVTFRfUFJFVklFV19CUk9XU0VSU19MSVNUX1RBUkdFVCxcbiAgICB9LFxufSBhcyBjb25zdDtcblxuYXN5bmMgZnVuY3Rpb24gcmVhZEJyb3dzZXJzbGlzdFRhcmdldChicm93c2Vyc2xpc3RyY1BhdGg6IHN0cmluZykge1xuICAgIGxldCBicm93c2Vyc2xpc3RyY1NvdXJjZTogc3RyaW5nO1xuICAgIHRyeSB7XG4gICAgICAgIGJyb3dzZXJzbGlzdHJjU291cmNlID0gYXdhaXQgZnMucmVhZEZpbGUoYnJvd3NlcnNsaXN0cmNQYXRoLCAndXRmOCcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcXVlcmllcyA9IHBhcnNlQnJvd3NlcnNsaXN0UXVlcmllcyhicm93c2Vyc2xpc3RyY1NvdXJjZSk7XG4gICAgaWYgKHF1ZXJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcmllcy5qb2luKCcgb3IgJyk7XG5cbiAgICBmdW5jdGlvbiBwYXJzZUJyb3dzZXJzbGlzdFF1ZXJpZXMoc291cmNlOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcXVlcmllczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBsaW5lIG9mIHNvdXJjZS5zcGxpdCgnXFxuJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGlTaGFycCA9IGxpbmUuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgY29uc3QgbGluZVRyaW1tZWQgPSAoaVNoYXJwIDwgMCA/IGxpbmUgOiBsaW5lLnN1YnN0cigwLCBpU2hhcnApKS50cmltKCk7XG4gICAgICAgICAgICBpZiAobGluZVRyaW1tZWQubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcXVlcmllcy5wdXNoKGxpbmVUcmltbWVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcXVlcmllcztcbiAgICB9XG59XG5cbmludGVyZmFjZSBQcmVkZWZpbmVkVGFyZ2V0IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgYnJvd3NlcnNMaXN0VGFyZ2V0cz86IE1vZExvT3B0aW9uc1sndGFyZ2V0cyddO1xuICAgIHNvdXJjZU1hcHM/OiBib29sZWFuIHwgJ2lubGluZSc7XG4gICAgaXNFZGl0b3I/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSW1wb3J0TWFwV2l0aFVSTCB7XG4gICAganNvbjogSW1wb3J0TWFwO1xuICAgIHVybDogVVJMO1xufVxuXG4vLyDogIPomZHliLDov5nmmK/mvZzlnKjnmoTmlLbotLnngrnvvIzpu5jorqTlhbPpl63lhaXlj6PohJrmnKznmoTkvJjljJblip/og71cbmNvbnN0IE9QVElNSVpFX0VOVFJZX1NPVVJDRV9DT01QSUxBVElPTiA9IGZhbHNlO1xuXG5jbGFzcyBQYWNrVGFyZ2V0IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiB7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAgbW9kTG86IE1vZExvO1xuICAgICAgICBzb3VyY2VNYXBzPzogYm9vbGVhbiB8ICdpbmxpbmUnO1xuICAgICAgICBxdWlja1BhY2s6IFF1aWNrUGFjaztcbiAgICAgICAgcXVpY2tQYWNrTG9hZGVyQ29udGV4dDogUXVpY2tQYWNrTG9hZGVyQ29udGV4dDtcbiAgICAgICAgbG9nZ2VyOiBMb2dnZXI7XG4gICAgICAgIHRlbnRhdGl2ZVByZXJlcXVpc2l0ZUltcG9ydHNNb2Q6IGJvb2xlYW47XG4gICAgICAgIGVuZ2luZUluZGV4TW9kdWxlOiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIGAnY2MnYCDmqKHlnZfnmoTliJ3lp4vlhoXlrrnjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc291cmNlOiBzdHJpbmc7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6L+Z5Liq55uu5qCH55qE5piv5ZCm55CG5Lya55So5oi355qE5byV5pOO5Yqf6IO96K6+572u44CCXG4gICAgICAgICAgICAgKiDlpoLmnpzmmK/vvIxgc2V0RW5naW5lSW5kZXhNb2R1bGVTb3VyY2VgIOS4jeS8muiiq+iwg+eUqOOAglxuICAgICAgICAgICAgICog5ZCm5YiZ77yM5b2T57yW6L6R5Zmo55qE5byV5pOO5Yqf6IO95pS55Y+Y5pe277yMYHNldEVuZ2luZUluZGV4TW9kdWxlU291cmNlYCDkvJrooqvosIPnlKjku6Xph43mlrDorr7nva4gYCdjYydgIOaooeWdl+eahOWGheWuueOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZXNwZWN0VG9GZWF0dXJlU2V0dGluZzogYm9vbGVhbjtcbiAgICAgICAgfTtcbiAgICAgICAgdXNlckltcG9ydE1hcD86IEltcG9ydE1hcFdpdGhVUkw7XG4gICAgfSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLl9tb2RMbyA9IG9wdGlvbnMubW9kTG87XG4gICAgICAgIHRoaXMuX3F1aWNrUGFjayA9IG9wdGlvbnMucXVpY2tQYWNrO1xuICAgICAgICB0aGlzLl9xdWlja1BhY2tMb2FkZXJDb250ZXh0ID0gb3B0aW9ucy5xdWlja1BhY2tMb2FkZXJDb250ZXh0O1xuICAgICAgICB0aGlzLl9zb3VyY2VNYXBzID0gb3B0aW9ucy5zb3VyY2VNYXBzO1xuICAgICAgICB0aGlzLl9sb2dnZXIgPSBvcHRpb25zLmxvZ2dlcjtcbiAgICAgICAgdGhpcy5fcmVzcGVjdFRvRmVhdHVyZVNldHRpbmcgPSBvcHRpb25zLmVuZ2luZUluZGV4TW9kdWxlLnJlc3BlY3RUb0ZlYXR1cmVTZXR0aW5nO1xuICAgICAgICB0aGlzLl90ZW50YXRpdmVQcmVyZXF1aXNpdGVJbXBvcnRzTW9kID0gb3B0aW9ucy50ZW50YXRpdmVQcmVyZXF1aXNpdGVJbXBvcnRzTW9kO1xuICAgICAgICB0aGlzLl91c2VySW1wb3J0TWFwID0gb3B0aW9ucy51c2VySW1wb3J0TWFwO1xuXG4gICAgICAgIGNvbnN0IG1vZExvID0gdGhpcy5fbW9kTG87XG4gICAgICAgIHRoaXMuX2VudHJ5TW9kID0gbW9kTG8uYWRkTWVtb3J5TW9kdWxlKHByZXJlcXVpc2l0ZUltcG9ydHNNb2RVUkwsXG4gICAgICAgICAgICAodGhpcy5fdGVudGF0aXZlUHJlcmVxdWlzaXRlSW1wb3J0c01vZCA/IG1ha2VUZW50YXRpdmVQcmVyZXF1aXNpdGVJbXBvcnRzIDogbWFrZVByZXJlcXVpc2l0ZUltcG9ydHNNb2QpKFtdKSk7XG4gICAgICAgIHRoaXMuX2VudHJ5TW9kU291cmNlID0gdGhpcy5fZW50cnlNb2Quc291cmNlO1xuXG4gICAgICAgIHRoaXMuX2VuZ2luZUluZGV4TW9kID0gbW9kTG8uYWRkTWVtb3J5TW9kdWxlKGVuZ2luZUluZGV4TW9kVVJMLCBvcHRpb25zLmVuZ2luZUluZGV4TW9kdWxlLnNvdXJjZSk7XG5cbiAgICAgICAgLy8gSW4gY29uc3RydWN0b3IsIHRoZXJlJ3Mgbm8gYnVpbGQgaW4gcHJvZ3Jlc3MsIHNvIHdlIGNhbiBzYWZlbHkgY2FsbCBzZXRBc3NldERhdGFiYXNlRG9tYWluc1xuICAgICAgICAvLyB3aXRob3V0IHdhaXRpbmcuIFdlIHVzZSBhIHN5bmNocm9ub3VzIGluaXRpYWxpemF0aW9uIG1ldGhvZC5cbiAgICAgICAgdGhpcy5fc2V0QXNzZXREYXRhYmFzZURvbWFpbnNTeW5jKFtdKTtcbiAgICB9XG5cbiAgICBnZXQgcXVpY2tQYWNrTG9hZGVyQ29udGV4dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1aWNrUGFja0xvYWRlckNvbnRleHQ7XG4gICAgfVxuXG4gICAgZ2V0IHJlYWR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHk7XG4gICAgfVxuXG4gICAgZ2V0IHJlc3BlY3RUb0VuZ2luZUZlYXR1cmVTZXR0aW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzcGVjdFRvRmVhdHVyZVNldHRpbmc7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZURiSW5mb3MoZGJJbmZvczogREJJbmZvW10pIHtcbiAgICAgICAgdGhpcy5fZGJJbmZvcyA9IGRiSW5mb3M7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGJ1aWxkKCk6IFByb21pc2U8QnVpbGRSZXN1bHQ+IHtcbiAgICAgICAgLy8g5aaC5p6c5q2j5Zyo5p6E5bu677yM6L+U5Zue5ZCM5LiA5LiqIFByb21pc2XvvIzpgb/lhY3lubblj5HmiafooYxcbiAgICAgICAgaWYgKHRoaXMuX2J1aWxkUHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBUYXJnZXQoJHt0aGlzLl9uYW1lfSkgYnVpbGQgYWxyZWFkeSBpbiBwcm9ncmVzcywgd2FpdGluZyBmb3IgZXhpc3RpbmcgYnVpbGQuLi5gKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9idWlsZFByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlvIDlp4vmlrDnmoTmnoTlu7pcbiAgICAgICAgdGhpcy5fYnVpbGRTdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgdGFyZ2V0TmFtZSA9IHRoaXMuX25hbWU7XG5cbiAgICAgICAgLy8g5Yib5bu65p6E5bu6IFByb21pc2VcbiAgICAgICAgdGhpcy5fYnVpbGRQcm9taXNlID0gdGhpcy5fZXhlY3V0ZUJ1aWxkKHRhcmdldE5hbWUpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl9idWlsZFByb21pc2U7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgLy8g5p6E5bu65a6M5oiQ5ZCO5riF6ZmkIFByb21pc2XvvIzlhYHorrjkuIvmrKHmnoTlu7pcbiAgICAgICAgICAgIHRoaXMuX2J1aWxkUHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9leGVjdXRlQnVpbGQodGFyZ2V0TmFtZTogc3RyaW5nKTogUHJvbWlzZTxCdWlsZFJlc3VsdD4ge1xuICAgICAgICAvLyDlj5HpgIHlvIDlp4vnvJbor5Hmtojmga9cbiAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoJ3BhY2stYnVpbGQtc3RhcnQnLCB0YXJnZXROYW1lKTtcblxuICAgICAgICB0aGlzLl9sb2dnZXIuZGVidWcoYFRhcmdldCgke3RhcmdldE5hbWV9KSBidWlsZCBzdGFydGVkLmApO1xuXG4gICAgICAgIGxldCBidWlsZFJlc3VsdDogQnVpbGRSZXN1bHQgPSB7fTtcbiAgICAgICAgY29uc3QgdDEgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJ1aWxkUmVzdWx0ID0gYXdhaXQgdGhpcy5fYnVpbGQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcihgJHtlcnJ9LCBzdGFjazogJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICBidWlsZFJlc3VsdC5lcnIgPSBlcnI7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9maXJzdEJ1aWxkID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCB0MiA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBUYXJnZXQoJHt0YXJnZXROYW1lfSkgZW5kcyB3aXRoIGNvc3QgJHt0MiAtIHQxfW1zLmApO1xuXG4gICAgICAgICAgICB0aGlzLl9yZWFkeSA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIOWPkemAgee8luivkeWujOaIkOa2iOaBr1xuICAgICAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoJ3BhY2stYnVpbGQtZW5kJywgdGFyZ2V0TmFtZSk7XG5cbiAgICAgICAgICAgIHRoaXMuX2J1aWxkU3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJ1aWxkUmVzdWx0O1xuICAgIH1cblxuICAgIGRlbGV0ZUNhY2hlRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG1vZHMgPSB0aGlzLl9wcmVyZXF1aXNpdGVBc3NldE1vZHM7XG4gICAgICAgIGlmIChmaWxlUGF0aCAmJiBtb2RzLnNpemUpIHtcbiAgICAgICAgICAgIG1vZHMuZGVsZXRlKGZpbGVQYXRoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2J1aWxkKCk6IFByb21pc2U8QnVpbGRSZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgcHJlcmVxdWlzaXRlQXNzZXRNb2RzID0gYXdhaXQgdGhpcy5fZ2V0UHJlcmVxdWlzaXRlQXNzZXRNb2RzV2l0aEZpbHRlcigpO1xuICAgICAgICBjb25zdCBidWlsZEVudHJpZXMgPSBbXG4gICAgICAgICAgICBlbmdpbmVJbmRleE1vZFVSTCxcbiAgICAgICAgICAgIHByZXJlcXVpc2l0ZUltcG9ydHNNb2RVUkwsXG4gICAgICAgICAgICAuLi5wcmVyZXF1aXNpdGVBc3NldE1vZHMsXG4gICAgICAgIF07XG4gICAgICAgIGNvbnN0IGNsZWFuUmVzb2x1dGlvbiA9IHRoaXMuX2NsZWFuUmVzb2x1dGlvbk5leHRUaW1lO1xuICAgICAgICBpZiAoY2xlYW5SZXNvbHV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblJlc29sdXRpb25OZXh0VGltZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjbGVhblJlc29sdXRpb24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1RoaXMgYnVpbGQgd2lsbCBwZXJmb3JtIGEgY2xlYW4gbW9kdWxlIHJlc29sdXRpb24uJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGJ1aWxkUmVzdWx0OiBCdWlsZFJlc3VsdCA9IHt9O1xuICAgICAgICBhd2FpdCB3cmFwVG9TZXRJbW1lZGlhdGVRdWV1ZSh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBidWlsZFJlc3VsdCA9IGF3YWl0IHRoaXMuX3F1aWNrUGFjay5idWlsZChidWlsZEVudHJpZXMsIHtcbiAgICAgICAgICAgICAgICByZXRyeVJlc29sdXRpb25PblVuY2hhbmdlZE1vZHVsZTogdGhpcy5fZmlyc3RCdWlsZCxcbiAgICAgICAgICAgICAgICBjbGVhblJlc29sdXRpb246IGNsZWFuUmVzb2x1dGlvbixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYnVpbGRSZXN1bHQ7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2xlYXJDYWNoZSgpIHtcbiAgICAgICAgdGhpcy5fcXVpY2tQYWNrLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2ZpcnN0QnVpbGQgPSB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBhcHBseUFzc2V0Q2hhbmdlcyhjaGFuZ2VzOiByZWFkb25seSBBc3NldENoYW5nZVtdKSB7XG4gICAgICAgIC8vIOWmguaenOato+WcqOaehOW7uu+8jOetieW+heaehOW7uuWujOaIkFxuICAgICAgICBpZiAodGhpcy5fYnVpbGRQcm9taXNlKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIuZGVidWcoYFRhcmdldCgke3RoaXMuX25hbWV9KSBidWlsZCBpbiBwcm9ncmVzcywgd2FpdGluZyBiZWZvcmUgYXBwbHlpbmcgYXNzZXQgY2hhbmdlcy4uLmApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fYnVpbGRQcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Vuc3VyZUlkbGUoKTtcbiAgICAgICAgZm9yIChjb25zdCBjaGFuZ2Ugb2YgY2hhbmdlcykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGNoYW5nZS51dWlkO1xuICAgICAgICAgICAgLy8gTm90ZTogXCJtb2RpZmllZFwiIGRpcmVjdGl2ZSBpcyBkZWNvbXBvc2VkIGFzIFwicmVtb3ZlXCIgYW5kIFwiYWRkXCIuXG4gICAgICAgICAgICBpZiAoY2hhbmdlLnR5cGUgPT09IEFzc2V0QWN0aW9uRW51bS5jaGFuZ2UgfHxcbiAgICAgICAgICAgICAgICBjaGFuZ2UudHlwZSA9PT0gQXNzZXRBY3Rpb25FbnVtLmRlbGV0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFVSTCA9IHRoaXMuX3V1aWRVUkxNYXAuZ2V0KHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghb2xkVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzIG9mIG5vdywgd2UgcmVjZWl2ZSBhbiBhc3NldCBtb2RpZnlpbmcgb3IgY2hhbmdpbmcgZGlyZWN0aXZlXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCB0aGUgYXNzZXQgd2FzIG5vdCBwcm9jZXNzZWQgYnkgdXMgYmVmb3JlLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGhvd2V2ZXIgY2FuIG9ubHkgaGFwcGVuIHdoZW46XG4gICAgICAgICAgICAgICAgICAgIC8vIC0gdGhlIGFzc2V0IGlzIHJlbW92ZWQsIGFuZCBpdCdzIGFuIHBsdWdpbiBzY3JpcHQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIC0gdGhlIGFzc2V0IGlzIG1vZGlmaWVkIGZyb20gcGx1Z2luIHNjcmlwdCB0byBub24tcGx1Z2luLXNjcmlwdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBzb21ldGhpbmcgd2VudCB3cm9uZy5cbiAgICAgICAgICAgICAgICAgICAgLy8gQnV0IHdlIGNvdWxkIG5vdCBkaXN0aW5ndWlzaCB0aGUgc2Vjb25kIHJlYXNvbiBmcm9tXG4gICAgICAgICAgICAgICAgICAgIC8vIFwicmVjZWl2ZWQgYW4gZXJyb3IgYXNzZXQgY2hhbmdlIGRpcmVjdGl2ZVwiXG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIHdlIGRvbid0IGtub3cgdGhlIGFzc2V0J3MgcHJldmlvdXMgc3RhdHVzLiBTbyB3ZSBjaG9vc2UgdG8gc2tpcCB0aGlzIGNoZWNrLlxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLl9sb2dnZXIud2FybihgVW5leHBlY3RlZDogJHt1dWlkfSBpcyBub3QgaW4gcmVnaXN0cnkuYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXVpZFVSTE1hcC5kZWxldGUodXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vZExvLnVuc2V0VVVJRChvbGRVUkwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWxldGVkID0gdGhpcy5fcHJlcmVxdWlzaXRlQXNzZXRNb2RzLmRlbGV0ZShvbGRVUkwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWRlbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci53YXJuKGBVbmV4cGVjdGVkOiAke29sZFVSTH0gaXMgbm90IGluIHJlZ2lzdHJ5LmApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNoYW5nZS50eXBlID09PSBBc3NldEFjdGlvbkVudW0uY2hhbmdlIHx8XG4gICAgICAgICAgICAgICAgY2hhbmdlLnR5cGUgPT09IEFzc2V0QWN0aW9uRW51bS5hZGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hhbmdlLmlzUGx1Z2luU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB7IGhyZWY6IHVybCB9ID0gY2hhbmdlLnVybDtcbiAgICAgICAgICAgICAgICB0aGlzLl91dWlkVVJMTWFwLnNldCh1dWlkLCB1cmwpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21vZExvLnNldFVVSUQodXJsLCB1dWlkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVyZXF1aXNpdGVBc3NldE1vZHMuYWRkKHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGltcG9ydCBtYWluIG1vZHVsZVxuICAgICAgICBjb25zdCBwcmVyZXF1aXNpdGVJbXBvcnRzID0gYXdhaXQgdGhpcy5fZ2V0UHJlcmVxdWlzaXRlQXNzZXRNb2RzV2l0aEZpbHRlcigpO1xuICAgICAgICBjb25zdCBzb3VyY2UgPSAodGhpcy5fdGVudGF0aXZlUHJlcmVxdWlzaXRlSW1wb3J0c01vZCA/IG1ha2VUZW50YXRpdmVQcmVyZXF1aXNpdGVJbXBvcnRzIDogbWFrZVByZXJlcXVpc2l0ZUltcG9ydHNNb2QpKHByZXJlcXVpc2l0ZUltcG9ydHMpO1xuXG4gICAgICAgIGNvbnNvbGUudGltZSgndXBkYXRlIGVudHJ5IG1vZCcpO1xuICAgICAgICBpZiAoT1BUSU1JWkVfRU5UUllfU09VUkNFX0NPTVBJTEFUSU9OKSB7XG4gICAgICAgICAgICAvLyDms6jmhI/vvJouc291cmNlIOaYr+S4gOS4qiBzZXR0ZXLvvIzlhbblhoXpg6jkvJrmm7TmlrAgdGltZXN0YW1w77yM5a+86Ie05q+P5qyh6YO96YeN5paw57yW6K+R5YWl5Y+j5paH5Lu277yM5aaC5p6c6aG555uu5q+U6L6D5aSn77yM5YWl5Y+j5paH5Lu255qE57yW6K+R5Lya6Z2e5bi46ICX5pe244CCXG4gICAgICAgICAgICAvLyDov5nph4zkvJjljJbvvIzlj6rmnInlnKjmnInlt67lvILnmoTmg4XlhrXkuIvmiY3ljrvmm7TmlrAgc291cmNlXG4gICAgICAgICAgICBpZiAodGhpcy5fZW50cnlNb2RTb3VyY2UubGVuZ3RoICE9PSBzb3VyY2UubGVuZ3RoIHx8IHRoaXMuX2VudHJ5TW9kU291cmNlICE9PSBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbnRyeU1vZFNvdXJjZSA9IHRoaXMuX2VudHJ5TW9kLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOaXp+eahOmAu+i+keaYr+avj+asoeS7u+aEj+iEmuacrOWPmOWMlu+8jOmDvemHjeaWsOiuvue9ruWFpeWPoyBzb3VyY2XvvIzlr7nlpKfpobnnm67lvbHlk43mr5TovoPlpKdcbiAgICAgICAgICAgIHRoaXMuX2VudHJ5TW9kU291cmNlID0gdGhpcy5fZW50cnlNb2Quc291cmNlID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgndXBkYXRlIGVudHJ5IG1vZCcpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBzZXRFbmdpbmVJbmRleE1vZHVsZVNvdXJjZShzb3VyY2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyDlpoLmnpzmraPlnKjmnoTlu7rvvIznrYnlvoXmnoTlu7rlrozmiJBcbiAgICAgICAgaWYgKHRoaXMuX2J1aWxkUHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBUYXJnZXQoJHt0aGlzLl9uYW1lfSkgYnVpbGQgaW4gcHJvZ3Jlc3MsIHdhaXRpbmcgYmVmb3JlIHNldHRpbmcgZW5naW5lIGluZGV4IG1vZHVsZSBzb3VyY2UuLi5gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2J1aWxkUHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9lbnN1cmVJZGxlKCk7XG4gICAgICAgIHRoaXMuX2VuZ2luZUluZGV4TW9kLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2V0QXNzZXREYXRhYmFzZURvbWFpbnMoYXNzZXREYXRhYmFzZURvbWFpbnM6IEFzc2V0RGF0YWJhc2VEb21haW5bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyDlpoLmnpzmraPlnKjmnoTlu7rvvIznrYnlvoXmnoTlu7rlrozmiJBcbiAgICAgICAgaWYgKHRoaXMuX2J1aWxkUHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBUYXJnZXQoJHt0aGlzLl9uYW1lfSkgYnVpbGQgaW4gcHJvZ3Jlc3MsIHdhaXRpbmcgYmVmb3JlIHNldHRpbmcgYXNzZXQgZGF0YWJhc2UgZG9tYWlucy4uLmApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fYnVpbGRQcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Vuc3VyZUlkbGUoKTtcbiAgICAgICAgdGhpcy5fc2V0QXNzZXREYXRhYmFzZURvbWFpbnNTeW5jKGFzc2V0RGF0YWJhc2VEb21haW5zKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zZXRBc3NldERhdGFiYXNlRG9tYWluc1N5bmMoYXNzZXREYXRhYmFzZURvbWFpbnM6IEFzc2V0RGF0YWJhc2VEb21haW5bXSk6IHZvaWQge1xuICAgICAgICBjb25zdCB7IF91c2VySW1wb3J0TWFwOiB1c2VySW1wb3J0TWFwIH0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IGltcG9ydE1hcDogSW1wb3J0TWFwID0ge307XG4gICAgICAgIGNvbnN0IGltcG9ydE1hcFVSTCA9IHVzZXJJbXBvcnRNYXAgPyB1c2VySW1wb3J0TWFwLnVybCA6IG5ldyBVUkwoJ2ZvbzovYmFyJyk7XG5cbiAgICAgICAgLy8gSW50ZWdyYXRlcyBidWlsdGluIG1hcHBpbmdzLCBzaW5jZSBhbGwgb2YgYnVpbHRpbiBtYXBwaW5ncyBhcmUgYWJzb2x1dGUsIHdlIGRvIG5vdCBuZWVkIHBhcnNlLlxuICAgICAgICBpbXBvcnRNYXAuaW1wb3J0cyA9IHt9O1xuICAgICAgICBpbXBvcnRNYXAuaW1wb3J0c1snY2MnXSA9IGVuZ2luZUluZGV4TW9kVVJMO1xuICAgICAgICBjb25zdCBhc3NldFByZWZpeGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGFzc2V0RGF0YWJhc2VEb21haW4gb2YgYXNzZXREYXRhYmFzZURvbWFpbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0RGlyVVJMID0gcGF0aFRvRmlsZVVSTChwcy5qb2luKGFzc2V0RGF0YWJhc2VEb21haW4ucGh5c2ljYWwsIHBzLmpvaW4ocHMuc2VwKSkpLmhyZWY7XG4gICAgICAgICAgICBpbXBvcnRNYXAuaW1wb3J0c1thc3NldERhdGFiYXNlRG9tYWluLnJvb3QuaHJlZl0gPSBhc3NldERpclVSTDtcbiAgICAgICAgICAgIGFzc2V0UHJlZml4ZXMucHVzaChhc3NldERpclVSTCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXNlckltcG9ydE1hcCkge1xuICAgICAgICAgICAgaWYgKHVzZXJJbXBvcnRNYXAuanNvbi5pbXBvcnRzKSB7XG4gICAgICAgICAgICAgICAgaW1wb3J0TWFwLmltcG9ydHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmltcG9ydE1hcC5pbXBvcnRzLFxuICAgICAgICAgICAgICAgICAgICAuLi51c2VySW1wb3J0TWFwLmpzb24uaW1wb3J0cyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXJJbXBvcnRNYXAuanNvbi5zY29wZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtzY29wZVJlcCwgc3BlY2lmaWVyTWFwXSBvZiBPYmplY3QuZW50cmllcyh1c2VySW1wb3J0TWFwLmpzb24uc2NvcGVzKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY29wZXMgPSBpbXBvcnRNYXAuc2NvcGVzID8/PSB7fTtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzW3Njb3BlUmVwXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLihzY29wZXNbc2NvcGVSZXBdID8/IHt9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnNwZWNpZmllck1hcCxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sb2dnZXIuZGVidWcoXG4gICAgICAgICAgICBgT3VyIGltcG9ydCBtYXAoJHtpbXBvcnRNYXBVUkx9KTogJHtKU09OLnN0cmluZ2lmeShpbXBvcnRNYXAsIHVuZGVmaW5lZCwgMil9YCxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLl9tb2RMby5zZXRJbXBvcnRNYXAoaW1wb3J0TWFwLCBpbXBvcnRNYXBVUkwpO1xuICAgICAgICB0aGlzLl9tb2RMby5zZXRBc3NldFByZWZpeGVzKGFzc2V0UHJlZml4ZXMpO1xuXG4gICAgICAgIHRoaXMuX2NsZWFuUmVzb2x1dGlvbk5leHRUaW1lID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9kYkluZm9zOiBEQkluZm9bXSA9IFtdO1xuICAgIHByaXZhdGUgX2J1aWxkU3RhcnRlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2J1aWxkUHJvbWlzZTogUHJvbWlzZTxCdWlsZFJlc3VsdD4gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9yZWFkeSA9IGZhbHNlO1xuICAgIHByaXZhdGUgX25hbWU6IHN0cmluZztcbiAgICBwcml2YXRlIF9lbmdpbmVJbmRleE1vZDogTWVtb3J5TW9kdWxlO1xuICAgIHByaXZhdGUgX2VudHJ5TW9kOiBNZW1vcnlNb2R1bGU7XG4gICAgcHJpdmF0ZSBfZW50cnlNb2RTb3VyY2UgPSAnJztcbiAgICBwcml2YXRlIF9tb2RMbzogTW9kTG87XG4gICAgcHJpdmF0ZSBfc291cmNlTWFwcz86IGJvb2xlYW4gfCAnaW5saW5lJztcbiAgICBwcml2YXRlIF9xdWlja1BhY2s6IFF1aWNrUGFjaztcbiAgICBwcml2YXRlIF9xdWlja1BhY2tMb2FkZXJDb250ZXh0OiBRdWlja1BhY2tMb2FkZXJDb250ZXh0O1xuICAgIHByaXZhdGUgX3ByZXJlcXVpc2l0ZUFzc2V0TW9kczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG4gICAgcHJpdmF0ZSBfdXVpZFVSTE1hcDogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIF9sb2dnZXI6IExvZ2dlcjtcbiAgICBwcml2YXRlIF9maXJzdEJ1aWxkID0gdHJ1ZTtcbiAgICBwcml2YXRlIF9jbGVhblJlc29sdXRpb25OZXh0VGltZSA9IHRydWU7XG4gICAgcHJpdmF0ZSBfcmVzcGVjdFRvRmVhdHVyZVNldHRpbmc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfdGVudGF0aXZlUHJlcmVxdWlzaXRlSW1wb3J0c01vZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIF91c2VySW1wb3J0TWFwOiBJbXBvcnRNYXBXaXRoVVJMIHwgdW5kZWZpbmVkO1xuXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0UHJlcmVxdWlzaXRlQXNzZXRNb2RzV2l0aEZpbHRlcigpIHtcbiAgICAgICAgY29uc3QgcHJlcmVxdWlzaXRlQXNzZXRNb2RzID0gQXJyYXkuZnJvbSh0aGlzLl9wcmVyZXF1aXNpdGVBc3NldE1vZHMpLnNvcnQoKTtcbiAgICAgICAgcmV0dXJuIHByZXJlcXVpc2l0ZUFzc2V0TW9kcztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9lbnN1cmVJZGxlKCkge1xuICAgICAgICBhc3NlcnRzKCF0aGlzLl9idWlsZFN0YXJ0ZWQsICdCdWlsZCBpcyBpbiBwcm9ncmVzcywgYnV0IGEgc3RhdHVzIGNoYW5nZSByZXF1ZXN0IGlzIGZpbGVkJyk7XG4gICAgfVxufVxuXG5pbnRlcmZhY2UgSW5jcmVtZW50YWxSZWNvcmQge1xuICAgIHZlcnNpb246IHN0cmluZztcbiAgICBjb25maWc6IHtcbiAgICAgICAgcHJldmlld1RhcmdldD86IHN0cmluZztcbiAgICB9ICYgU2hhcmVkU2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIG1hdGNoT2JqZWN0KGxoczogdW5rbm93biwgcmhzOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIG1hdGNoTGhzKGxocywgcmhzKTtcblxuICAgIGZ1bmN0aW9uIG1hdGNoTGhzKGxoczogdW5rbm93biwgcmhzOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGxocykpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHJocykgJiYgbGhzLmxlbmd0aCA9PT0gcmhzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIGxocy5ldmVyeSgodiwgaSkgPT4gbWF0Y2hMaHModiwgcmhzW2ldKSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxocyA9PT0gJ29iamVjdCcgJiYgbGhzICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHJocyA9PT0gJ29iamVjdCdcbiAgICAgICAgICAgICAgICAmJiByaHMgIT09IG51bGxcbiAgICAgICAgICAgICAgICAmJiBPYmplY3Qua2V5cyhsaHMpLmV2ZXJ5KChrZXkpID0+IG1hdGNoTGhzKChsaHMgYXMgYW55KVtrZXldLCAocmhzIGFzIGFueSlba2V5XSkpO1xuICAgICAgICB9IGVsc2UgaWYgKGxocyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJocyA9PT0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBsaHMgPT09IHJocztcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==