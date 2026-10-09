'use strict';
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
exports.ProgrammingFacet = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ccbuild_1 = require("@cocos/ccbuild");
const moduleSystem = __importStar(require("@cocos/module-system"));
/**
 * 异步迭代。有以下特点：
 * 1. 每次调用 `nextIteration()` 会执行一次传入的**迭代函数**；迭代函数允许是异步的，在构造函数中确定之后不能更改；
 * 2. 同时**最多仅会有一例**迭代在执行；
 * 3. **迭代是可合并的**，也就是说，在前面的迭代没完成之前，后面的所有迭代都会被合并成一个。
 */
class AsyncIterationConcurrency {
    _iterate;
    _executionPromise = null;
    _pendingPromise = null;
    constructor(iterate) {
        this._iterate = iterate;
    }
    nextIteration() {
        if (!this._executionPromise) {
            // 如果未在执行，那就去执行
            // assert(!this._pendingPromise)
            return this._executionPromise = Promise.resolve(this._iterate()).finally(() => {
                this._executionPromise = null;
            });
        }
        else if (!this._pendingPromise) {
            // 如果没有等待队列，创建等待 promise，在 执行 promise 完成后执行
            return this._pendingPromise = this._executionPromise.finally(() => {
                this._pendingPromise = null;
                // 等待 promise 将等待执行 promise，并在完成后重新入队
                return this.nextIteration();
            });
        }
        else {
            // 如果已经有等待队列，那就等待现有的队列
            console.debug(`[Facet] There is a pending promise task, waiting ...`);
            return this._pendingPromise;
        }
    }
}
class ProgrammingFacet {
    _packerDriverUpdateCount = 0;
    _asyncIteration;
    static async create(engine, projectPath) {
        const previewFacet = new ProgrammingFacet(engine.root, engine.distRoot, // engineDistRoot
        projectPath);
        await previewFacet._initialize({ engine });
        return previewFacet;
    }
    get engineRoot() {
        return this._engineRoot;
    }
    get engineDistRoot() {
        return this._engineDistRoot;
    }
    get systemJsHomeDir() {
        return this._systemJsHomeDir;
    }
    get systemJsIndexFile() {
        return this._systemJsBundleFileName;
    }
    get engineImportMapURL() {
        return '/scripting/engine/import-map.json';
    }
    get packImportMapURL() {
        return this._quickPackLoader.importMapURL;
    }
    get packResolutionDetailMapURL() {
        return this._quickPackLoader.resolutionDetailMapURL;
    }
    async loadPackResource(url) {
        return await this._getQuickPackLoader().loadAny(url);
    }
    async getGlobalImportMap() {
        return this._staticImportMap;
    }
    async reload() {
        const reloadIndex = ++this._packerDriverUpdateCount;
        console.debug(`[[Facet.reload]], before lock, count: ${reloadIndex}`);
        const loader = this._getQuickPackLoader();
        let unlockPromise;
        try {
            unlockPromise = await loader.lock();
        }
        catch (err) {
            console.error(`[[Facet.reload]] lock failed: ${err}, stack: ${err.stack}, count: ${reloadIndex}`);
        }
        console.debug(`[[Facet.reload]], after lock, count: ${reloadIndex}`);
        try {
            await loader.reload();
        }
        catch (err) {
            console.error(`[[Facet.reload]], failed: ${err}, ${err.stack}, count: ${reloadIndex}`);
            throw err;
        }
        finally {
            console.debug(`[[Facet.reload]], before unlock, count: ${reloadIndex}`);
            try {
                if (unlockPromise) {
                    await unlockPromise();
                }
            }
            catch (err) {
                console.error(`[[Facet.reload]] unlock failed: ${err}, stack: ${err.stack}, count: ${reloadIndex}`);
            }
            console.debug(`[[Facet.reload]], after unlock, count: ${reloadIndex}`);
        }
    }
    async notifyPackDriverUpdated() {
        return this._asyncIteration.nextIteration();
    }
    _staticImportMap = {
        imports: {},
    };
    _engineRoot;
    _engineDistRoot;
    _systemJsHomeDir;
    _systemJsBundleFileName = 'system.js';
    _quickPackLoader;
    constructor(engineRoot, engineDistRoot, projectRoot) {
        this._systemJsHomeDir = path_1.default.join(projectRoot, 'temp', 'programming', 'preview', 'systemjs');
        this._engineRoot = engineRoot;
        this._engineDistRoot = engineDistRoot;
        this._asyncIteration = new AsyncIterationConcurrency(async () => {
            return this.reload();
        });
    }
    _getQuickPackLoader() {
        if (!this._quickPackLoader) {
            throw new Error('Loader has not been created.');
        }
        else {
            return this._quickPackLoader;
        }
    }
    async _initialize({ engine, }) {
        this._engineStatsQuery = await ccbuild_1.StatsQuery.create(engine.root);
        const imports = this._staticImportMap.imports;
        imports['cc'] = 'q-bundled:///virtual/cc.js';
        imports['cc/env'] = 'cc/editor/populate-internal-constants';
        // TODO: deprecated cce.env is only live in 3.0-preview
        imports['cce.env'] = imports['cc/env'];
        imports['cc/userland/macro'] = './userland/macro';
        console.debug(`Preview import map: ${JSON.stringify(this._staticImportMap, undefined, 2)}`);
        await this._buildSystemJs();
        await this._resetQuickPackLoader();
    }
    async _buildSystemJs() {
        const systemJsBundleOutFile = path_1.default.join(this._systemJsHomeDir, this._systemJsBundleFileName);
        await fs_extra_1.default.ensureDir(path_1.default.dirname(systemJsBundleOutFile));
        // NOTE: The @cocos/rollup-plugin-typescript requires document.baseURI to resolve tslib in Node.js environment.
        // In cocos-cli, web-adapter.js (loaded by initEngine) polyfills `document` but not `baseURI`.
        // If `document` is defined, the rollup plugin enters a browser-only branch and fails if `baseURI` is missing.
        // Use the cocos-cli package root (not process.cwd()) so tslib resolves correctly when
        // the CLI is invoked from an arbitrary working directory.
        if (typeof document !== 'undefined' && !document.baseURI) {
            const { pathToFileURL } = require('url');
            const cliRoot = path_1.default.resolve(__dirname, '..', '..', '..', '..');
            document.baseURI = pathToFileURL(path_1.default.join(cliRoot, 'index.js')).href;
        }
        await moduleSystem.build({
            out: systemJsBundleOutFile,
            minify: false,
            sourceMap: true,
            platform: 'web-mobile',
            editor: true,
        });
    }
    async _resetQuickPackLoader() {
        const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../index')));
        const contextSerialize = scripting.getPackerDriverLoaderContext('preview');
        const { QuickPackLoaderContext, QuickPackLoader } = await Promise.resolve().then(() => __importStar(require('@cocos/creator-programming-quick-pack/lib/loader')));
        const context = QuickPackLoaderContext.deserialize(contextSerialize);
        const quickPackLoader = new QuickPackLoader(context);
        this._quickPackLoader = quickPackLoader;
    }
}
exports.ProgrammingFacet = ProgrammingFacet;
