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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFjZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFYixnREFBc0I7QUFDdEIsd0RBQTBCO0FBSTFCLDRDQUE0QztBQUM1QyxtRUFBcUQ7QUFFckQ7Ozs7O0dBS0c7QUFDSCxNQUFNLHlCQUF5QjtJQUNuQixRQUFRLENBQXNCO0lBRTlCLGlCQUFpQixHQUF5QixJQUFJLENBQUM7SUFFL0MsZUFBZSxHQUF5QixJQUFJLENBQUM7SUFFckQsWUFBWSxPQUE0QjtRQUNwQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUM1QixDQUFDO0lBRU0sYUFBYTtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDMUIsZUFBZTtZQUNmLGdDQUFnQztZQUNoQyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Z0JBQzFFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO2FBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMvQiwyQ0FBMkM7WUFDM0MsT0FBTyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUM5RCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDNUIscUNBQXFDO2dCQUNyQyxPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQztRQUNQLENB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b20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB0eXBlIHsgUXVpY2tQYWNrTG9hZGVyIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItcHJvZ3JhbW1pbmctcXVpY2stcGFjay9saWIvbG9hZGVyJztcblxuaW1wb3J0IHsgSW1wb3J0TWFwIH0gZnJvbSAnLi4vLi4vYnVpbGRlci9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IFN0YXRzUXVlcnkgfSBmcm9tICdAY29jb3MvY2NidWlsZCc7XG5pbXBvcnQgKiBhcyBtb2R1bGVTeXN0ZW0gZnJvbSAnQGNvY29zL21vZHVsZS1zeXN0ZW0nO1xuXG4vKipcbiAqIOW8guatpei/reS7o+OAguacieS7peS4i+eJueeCue+8mlxuICogMS4g5q+P5qyh6LCD55SoIGBuZXh0SXRlcmF0aW9uKClgIOS8muaJp+ihjOS4gOasoeS8oOWFpeeahCoq6L+t5Luj5Ye95pWwKirvvJvov63ku6Plh73mlbDlhYHorrjmmK/lvILmraXnmoTvvIzlnKjmnoTpgKDlh73mlbDkuK3noa7lrprkuYvlkI7kuI3og73mm7TmlLnvvJtcbiAqIDIuIOWQjOaXtioq5pyA5aSa5LuF5Lya5pyJ5LiA5L6LKirov63ku6PlnKjmiafooYzvvJtcbiAqIDMuICoq6L+t5Luj5piv5Y+v5ZCI5bm255qEKirvvIzkuZ/lsLHmmK/or7TvvIzlnKjliY3pnaLnmoTov63ku6PmsqHlrozmiJDkuYvliY3vvIzlkI7pnaLnmoTmiYDmnInov63ku6Ppg73kvJrooqvlkIjlubbmiJDkuIDkuKrjgIJcbiAqL1xuY2xhc3MgQXN5bmNJdGVyYXRpb25Db25jdXJyZW5jeSB7XG4gICAgcHJpdmF0ZSBfaXRlcmF0ZTogKCkgPT4gUHJvbWlzZTx2b2lkPjtcblxuICAgIHByaXZhdGUgX2V4ZWN1dGlvblByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbDtcblxuICAgIHByaXZhdGUgX3BlbmRpbmdQcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcihpdGVyYXRlOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG4gICAgICAgIHRoaXMuX2l0ZXJhdGUgPSBpdGVyYXRlO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0SXRlcmF0aW9uKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghdGhpcy5fZXhlY3V0aW9uUHJvbWlzZSkge1xuICAgICAgICAgICAgLy8g5aaC5p6c5pyq5Zyo5omn6KGM77yM6YKj5bCx5Y675omn6KGMXG4gICAgICAgICAgICAvLyBhc3NlcnQoIXRoaXMuX3BlbmRpbmdQcm9taXNlKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGlvblByb21pc2UgPSBQcm9taXNlLnJlc29sdmUodGhpcy5faXRlcmF0ZSgpKS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9leGVjdXRpb25Qcm9taXNlID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9wZW5kaW5nUHJvbWlzZSkge1xuICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ562J5b6F6Zif5YiX77yM5Yib5bu6562J5b6FIHByb21pc2XvvIzlnKgg5omn6KGMIHByb21pc2Ug5a6M5oiQ5ZCO5omn6KGMXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGVuZGluZ1Byb21pc2UgPSB0aGlzLl9leGVjdXRpb25Qcm9taXNlLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdQcm9taXNlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAvLyDnrYnlvoUgcHJvbWlzZSDlsIbnrYnlvoXmiafooYwgcHJvbWlzZe+8jOW5tuWcqOWujOaIkOWQjumHjeaWsOWFpemYn1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRJdGVyYXRpb24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5aaC5p6c5bey57uP5pyJ562J5b6F6Zif5YiX77yM6YKj5bCx562J5b6F546w5pyJ55qE6Zif5YiXXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbRmFjZXRdIFRoZXJlIGlzIGEgcGVuZGluZyBwcm9taXNlIHRhc2ssIHdhaXRpbmcgLi4uYCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGVuZGluZ1Byb21pc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmludGVyZmFjZSBJRW5naW5lT3B0aW9ucyB7XG4gICAgLyoqXG4gICAgICog5byV5pOO5LuT5bqT5qC555uu5b2V44CCXG4gICAgICovXG4gICAgcm9vdDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICog5byV5pOO57yW6K+R5ZCO55qE5qC555uu5b2V44CCXG4gICAgICovXG4gICAgZGlzdFJvb3Q6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIOW8leaTjuWfuuehgCBVUkzjgIJcbiAgICAgKi9cbiAgICBiYXNlVXJsOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKjnmoTlvJXmk47lip/og73jgIJcbiAgICAgKi9cbiAgICBmZWF0dXJlczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBQcm9ncmFtbWluZ0ZhY2V0IHtcbiAgICBwcml2YXRlIF9wYWNrZXJEcml2ZXJVcGRhdGVDb3VudCA9IDA7XG4gICAgcHJpdmF0ZSBfYXN5bmNJdGVyYXRpb246IEFzeW5jSXRlcmF0aW9uQ29uY3VycmVuY3k7XG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBjcmVhdGUoXG4gICAgICAgIGVuZ2luZTogSUVuZ2luZU9wdGlvbnMsXG4gICAgICAgIHByb2plY3RQYXRoOiBzdHJpbmdcbiAgICApIHtcbiAgICAgICAgY29uc3QgcHJldmlld0ZhY2V0ID0gbmV3IFByb2dyYW1taW5nRmFjZXQoXG4gICAgICAgICAgICBlbmdpbmUucm9vdCxcbiAgICAgICAgICAgIGVuZ2luZS5kaXN0Um9vdCwgLy8gZW5naW5lRGlzdFJvb3RcbiAgICAgICAgICAgIHByb2plY3RQYXRoXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IHByZXZpZXdGYWNldC5faW5pdGlhbGl6ZSh7IGVuZ2luZSB9KTtcbiAgICAgICAgcmV0dXJuIHByZXZpZXdGYWNldDtcbiAgICB9XG5cblxuXG4gICAgZ2V0IGVuZ2luZVJvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmdpbmVSb290O1xuICAgIH1cblxuICAgIGdldCBlbmdpbmVEaXN0Um9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZ2luZURpc3RSb290O1xuICAgIH1cblxuICAgIGdldCBzeXN0ZW1Kc0hvbWVEaXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zeXN0ZW1Kc0hvbWVEaXI7XG4gICAgfVxuXG4gICAgZ2V0IHN5c3RlbUpzSW5kZXhGaWxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3lzdGVtSnNCdW5kbGVGaWxlTmFtZTtcbiAgICB9XG5cbiAgICBnZXQgZW5naW5lSW1wb3J0TWFwVVJMKCkge1xuICAgICAgICByZXR1cm4gJy9zY3JpcHRpbmcvZW5naW5lL2ltcG9ydC1tYXAuanNvbic7XG4gICAgfVxuXG4gICAgZ2V0IHBhY2tJbXBvcnRNYXBVUkwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9xdWlja1BhY2tMb2FkZXIhLmltcG9ydE1hcFVSTDtcbiAgICB9XG5cbiAgICBnZXQgcGFja1Jlc29sdXRpb25EZXRhaWxNYXBVUkwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9xdWlja1BhY2tMb2FkZXIhLnJlc29sdXRpb25EZXRhaWxNYXBVUkw7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGxvYWRQYWNrUmVzb3VyY2UodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2dldFF1aWNrUGFja0xvYWRlcigpLmxvYWRBbnkodXJsKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZ2V0R2xvYmFsSW1wb3J0TWFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGljSW1wb3J0TWFwO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCByZWxvYWRJbmRleCA9ICsrdGhpcy5fcGFja2VyRHJpdmVyVXBkYXRlQ291bnQ7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtbRmFjZXQucmVsb2FkXV0sIGJlZm9yZSBsb2NrLCBjb3VudDogJHtyZWxvYWRJbmRleH1gKTtcbiAgICAgICAgY29uc3QgbG9hZGVyID0gdGhpcy5fZ2V0UXVpY2tQYWNrTG9hZGVyKCk7XG4gICAgICAgIGxldCB1bmxvY2tQcm9taXNlOiAoKCkgPT4gUHJvbWlzZTx2b2lkPikgfCB1bmRlZmluZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB1bmxvY2tQcm9taXNlID0gYXdhaXQgbG9hZGVyLmxvY2soKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtbRmFjZXQucmVsb2FkXV0gbG9jayBmYWlsZWQ6ICR7ZXJyfSwgc3RhY2s6ICR7ZXJyLnN0YWNrfSwgY291bnQ6ICR7cmVsb2FkSW5kZXh9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW1tGYWNldC5yZWxvYWRdXSwgYWZ0ZXIgbG9jaywgY291bnQ6ICR7cmVsb2FkSW5kZXh9YCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGxvYWRlci5yZWxvYWQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtbRmFjZXQucmVsb2FkXV0sIGZhaWxlZDogJHtlcnJ9LCAke2Vyci5zdGFja30sIGNvdW50OiAke3JlbG9hZEluZGV4fWApO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW1tGYWNldC5yZWxvYWRdXSwgYmVmb3JlIHVubG9jaywgY291bnQ6ICR7cmVsb2FkSW5kZXh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh1bmxvY2tQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHVubG9ja1Byb21pc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtbRmFjZXQucmVsb2FkXV0gdW5sb2NrIGZhaWxlZDogJHtlcnJ9LCBzdGFjazogJHtlcnIuc3RhY2t9LCBjb3VudDogJHtyZWxvYWRJbmRleH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtbRmFjZXQucmVsb2FkXV0sIGFmdGVyIHVubG9jaywgY291bnQ6ICR7cmVsb2FkSW5kZXh9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgbm90aWZ5UGFja0RyaXZlclVwZGF0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hc3luY0l0ZXJhdGlvbi5uZXh0SXRlcmF0aW9uKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc3RhdGljSW1wb3J0TWFwOiBJbXBvcnRNYXAgJiB7IGltcG9ydHM6IE5vbk51bGxhYmxlPEltcG9ydE1hcFsnaW1wb3J0cyddPiB9ID0ge1xuICAgICAgICBpbXBvcnRzOiB7fSxcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBfZW5naW5lUm9vdDogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBfZW5naW5lRGlzdFJvb3Q6IHN0cmluZztcblxuICAgIHByaXZhdGUgX3N5c3RlbUpzSG9tZURpcjogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBfc3lzdGVtSnNCdW5kbGVGaWxlTmFtZSA9ICdzeXN0ZW0uanMnO1xuXG4gICAgcHJpdmF0ZSBkZWNsYXJlIF9lbmdpbmVTdGF0c1F1ZXJ5OiBTdGF0c1F1ZXJ5O1xuXG4gICAgcHJpdmF0ZSBfcXVpY2tQYWNrTG9hZGVyOiBRdWlja1BhY2tMb2FkZXIgfCB1bmRlZmluZWQ7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgICAgICBlbmdpbmVSb290OiBzdHJpbmcsXG4gICAgICAgIGVuZ2luZURpc3RSb290OiBzdHJpbmcsXG4gICAgICAgIHByb2plY3RSb290OiBzdHJpbmcsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuX3N5c3RlbUpzSG9tZURpciA9IHBzLmpvaW4ocHJvamVjdFJvb3QsICd0ZW1wJywgJ3Byb2dyYW1taW5nJywgJ3ByZXZpZXcnLCAnc3lzdGVtanMnKTtcbiAgICAgICAgdGhpcy5fZW5naW5lUm9vdCA9IGVuZ2luZVJvb3Q7XG4gICAgICAgIHRoaXMuX2VuZ2luZURpc3RSb290ID0gZW5naW5lRGlzdFJvb3Q7XG4gICAgICAgIHRoaXMuX2FzeW5jSXRlcmF0aW9uID0gbmV3IEFzeW5jSXRlcmF0aW9uQ29uY3VycmVuY3koYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVsb2FkKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFF1aWNrUGFja0xvYWRlcigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9xdWlja1BhY2tMb2FkZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTG9hZGVyIGhhcyBub3QgYmVlbiBjcmVhdGVkLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3F1aWNrUGFja0xvYWRlcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2luaXRpYWxpemUoe1xuICAgICAgICBlbmdpbmUsXG4gICAgfToge1xuICAgICAgICBlbmdpbmU6IElFbmdpbmVPcHRpb25zO1xuICAgIH0pIHtcbiAgICAgICAgdGhpcy5fZW5naW5lU3RhdHNRdWVyeSA9IGF3YWl0IFN0YXRzUXVlcnkuY3JlYXRlKGVuZ2luZS5yb290KTtcbiAgICAgICAgY29uc3QgaW1wb3J0cyA9IHRoaXMuX3N0YXRpY0ltcG9ydE1hcC5pbXBvcnRzO1xuXG4gICAgICAgIGltcG9ydHNbJ2NjJ10gPSAncS1idW5kbGVkOi8vL3ZpcnR1YWwvY2MuanMnO1xuICAgICAgICBpbXBvcnRzWydjYy9lbnYnXSA9ICdjYy9lZGl0b3IvcG9wdWxhdGUtaW50ZXJuYWwtY29uc3RhbnRzJztcbiAgICAgICAgLy8gVE9ETzogZGVwcmVjYXRlZCBjY2UuZW52IGlzIG9ubHkgbGl2ZSBpbiAzLjAtcHJldmlld1xuICAgICAgICBpbXBvcnRzWydjY2UuZW52J10gPSBpbXBvcnRzWydjYy9lbnYnXTtcbiAgICAgICAgaW1wb3J0c1snY2MvdXNlcmxhbmQvbWFjcm8nXSA9ICcuL3VzZXJsYW5kL21hY3JvJztcblxuICAgICAgICBjb25zb2xlLmRlYnVnKGBQcmV2aWV3IGltcG9ydCBtYXA6ICR7SlNPTi5zdHJpbmdpZnkodGhpcy5fc3RhdGljSW1wb3J0TWFwLCB1bmRlZmluZWQsIDIpfWApO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2J1aWxkU3lzdGVtSnMoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLl9yZXNldFF1aWNrUGFja0xvYWRlcigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2J1aWxkU3lzdGVtSnMoKSB7XG4gICAgICAgIGNvbnN0IHN5c3RlbUpzQnVuZGxlT3V0RmlsZSA9IHBzLmpvaW4odGhpcy5fc3lzdGVtSnNIb21lRGlyLCB0aGlzLl9zeXN0ZW1Kc0J1bmRsZUZpbGVOYW1lKTtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyKHBzLmRpcm5hbWUoc3lzdGVtSnNCdW5kbGVPdXRGaWxlKSk7XG5cbiAgICAgICAgLy8gTk9URTogVGhlIEBjb2Nvcy9yb2xsdXAtcGx1Z2luLXR5cGVzY3JpcHQgcmVxdWlyZXMgZG9jdW1lbnQuYmFzZVVSSSB0byByZXNvbHZlIHRzbGliIGluIE5vZGUuanMgZW52aXJvbm1lbnQuXG4gICAgICAgIC8vIEluIGNvY29zLWNsaSwgd2ViLWFkYXB0ZXIuanMgKGxvYWRlZCBieSBpbml0RW5naW5lKSBwb2x5ZmlsbHMgYGRvY3VtZW50YCBidXQgbm90IGBiYXNlVVJJYC5cbiAgICAgICAgLy8gSWYgYGRvY3VtZW50YCBpcyBkZWZpbmVkLCB0aGUgcm9sbHVwIHBsdWdpbiBlbnRlcnMgYSBicm93c2VyLW9ubHkgYnJhbmNoIGFuZCBmYWlscyBpZiBgYmFzZVVSSWAgaXMgbWlzc2luZy5cbiAgICAgICAgLy8gVXNlIHRoZSBjb2Nvcy1jbGkgcGFja2FnZSByb290IChub3QgcHJvY2Vzcy5jd2QoKSkgc28gdHNsaWIgcmVzb2x2ZXMgY29ycmVjdGx5IHdoZW5cbiAgICAgICAgLy8gdGhlIENMSSBpcyBpbnZva2VkIGZyb20gYW4gYXJiaXRyYXJ5IHdvcmtpbmcgZGlyZWN0b3J5LlxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAhZG9jdW1lbnQuYmFzZVVSSSkge1xuICAgICAgICAgICAgY29uc3QgeyBwYXRoVG9GaWxlVVJMIH0gPSByZXF1aXJlKCd1cmwnKTtcbiAgICAgICAgICAgIGNvbnN0IGNsaVJvb3QgPSBwcy5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJywgJy4uJyk7XG4gICAgICAgICAgICAoZG9jdW1lbnQgYXMgYW55KS5iYXNlVVJJID0gcGF0aFRvRmlsZVVSTChwcy5qb2luKGNsaVJvb3QsICdpbmRleC5qcycpKS5ocmVmO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbW9kdWxlU3lzdGVtLmJ1aWxkKHtcbiAgICAgICAgICAgIG91dDogc3lzdGVtSnNCdW5kbGVPdXRGaWxlLFxuICAgICAgICAgICAgbWluaWZ5OiBmYWxzZSxcbiAgICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgICAgIHBsYXRmb3JtOiAnd2ViLW1vYmlsZScsXG4gICAgICAgICAgICBlZGl0b3I6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3Jlc2V0UXVpY2tQYWNrTG9hZGVyKCkge1xuICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHNjcmlwdGluZyB9ID0gYXdhaXQgaW1wb3J0KCcuLi9pbmRleCcpO1xuICAgICAgICBjb25zdCBjb250ZXh0U2VyaWFsaXplID0gc2NyaXB0aW5nLmdldFBhY2tlckRyaXZlckxvYWRlckNvbnRleHQoJ3ByZXZpZXcnKTtcbiAgICAgICAgY29uc3QgeyBRdWlja1BhY2tMb2FkZXJDb250ZXh0LCBRdWlja1BhY2tMb2FkZXIgfSA9IGF3YWl0IGltcG9ydCgnQGNvY29zL2NyZWF0b3ItcHJvZ3JhbW1pbmctcXVpY2stcGFjay9saWIvbG9hZGVyJyk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBRdWlja1BhY2tMb2FkZXJDb250ZXh0LmRlc2VyaWFsaXplKGNvbnRleHRTZXJpYWxpemUhKTtcbiAgICAgICAgY29uc3QgcXVpY2tQYWNrTG9hZGVyID0gbmV3IFF1aWNrUGFja0xvYWRlcihjb250ZXh0KTtcbiAgICAgICAgdGhpcy5fcXVpY2tQYWNrTG9hZGVyID0gcXVpY2tQYWNrTG9hZGVyO1xuICAgIH1cbn1cblxuIl19