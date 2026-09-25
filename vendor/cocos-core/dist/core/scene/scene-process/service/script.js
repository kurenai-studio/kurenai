"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptService = void 0;
const cc_1 = __importDefault(require("cc"));
const executor_1 = require("@cocos/lib-programming/dist/executor");
const loader_1 = require("@cocos/creator-programming-quick-pack/lib/loader");
const rpc_1 = require("../rpc");
const core_1 = require("./core");
const utils_1 = __importDefault(require("../../../base/utils"));
const i18n_1 = __importDefault(require("../i18n"));
const service_manager_1 = require("./service-manager");
/**
 * 异步迭代。有以下特点：
 * 1. 每次调用 `nextIteration()` 会执行一次传入的**迭代函数**；迭代函数允许是异步的，在构造函数中确定之后不能更改；
 * 2. 同时**最多仅会有一例**迭代在执行；
 * 3. **迭代是可合并的**，也就是说，在前面的迭代没完成之前，后面的所有迭代都会被合并成一个。
 */
class AsyncIterationConcurrency1 {
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
            return this._pendingPromise;
        }
    }
}
/**
 * 导入时异常的消息的标签。
 */
const importExceptionLogTag = '::SceneExecutorImportExceptionHandler::';
const global_env_1 = require("../../common/global-env");
const globalEnv = new global_env_1.GlobalEnv();
let ScriptService = class ScriptService extends core_1.BaseService {
    _executor;
    _isInited = false;
    _suspendPromise = null;
    _syncPluginScripts;
    _reloadScripts;
    /**
     * 非引擎定义的组件
     * @private
     */
    customComponents = new Set();
    constructor() {
        super();
        this._reloadScripts = new AsyncIterationConcurrency1(() => this._execute());
        this._syncPluginScripts = new AsyncIterationConcurrency1(() => this._syncPluginScriptList());
    }
    /**
     * 挂起脚本管理器直到 `condition` 结束，才会进行下一次执行。
     * @param condition
     */
    suspend(condition) {
        this._suspendPromise = condition;
    }
    async init() {
        if (this._isInited)
            return;
        this._isInited = true;
        EditorExtends.on('class-registered', (classConstructor, metadata, className) => {
            console.log('classRegistered', className);
            console.log('class-registered ' + cc_1.default.js.isChildClassOf(classConstructor, cc_1.default.Component));
            if (metadata && // Only project scripts
                cc_1.default.js.isChildClassOf(classConstructor, cc_1.default.Component) // Only components
            ) {
                this.customComponents.add(classConstructor);
                EditorExtends.Component.addMenu(classConstructor, `${i18n_1.default.transI18nName('i18n:ENGINE.menu.custom_script')}/${className}`, -1);
            }
        });
        const serializedPackLoaderContext = await rpc_1.Rpc.getInstance().request('programming', 'getPackerDriverLoaderContext', ['editor']);
        if (!serializedPackLoaderContext) {
            throw new Error('packer-driver/get-loader-context is not defined');
        }
        const quickPackLoaderContext = loader_1.QuickPackLoaderContext.deserialize(serializedPackLoaderContext);
        const cceModuleMap = await rpc_1.Rpc.getInstance().request('programming', 'queryCCEModuleMap');
        const isWebEnv = typeof globalThis.EditorExtends !== 'undefined' && typeof System !== 'undefined' && typeof System.import === 'function' && !process?.versions?.node;
        let loadDynamic;
        if (!isWebEnv) {
            const preload = await Promise.resolve().then(() => __importStar(require('cc/preload')));
            loadDynamic = preload.loadDynamic;
        }
        this._executor = await executor_1.Executor.create({
            // @ts-ignore
            importEngineMod: async (id) => {
                if (isWebEnv) {
                    return await System.import(id);
                }
                return await loadDynamic(id);
            },
            quickPackLoaderContext,
            beforeUnregisterClass: (classConstructor) => {
                this.customComponents.delete(classConstructor);
                EditorExtends.Component.removeMenu(classConstructor);
            },
            logger: {
                loadException: (moduleId, error, hasBeenThrown) => {
                    // console.error(`An exception is thrown during load of module "${moduleId}" (or its recursive dependencies). `, error);
                },
                possibleCircularReference: (imported, moduleRequest, importMeta, extras) => {
                    const moduleUrlToAssetLink = (url) => {
                        const prefix = 'project:///';
                        return url.startsWith(prefix) ? `{asset(db://${url.slice(prefix.length).replace('.js', '.ts')})}` : url;
                    };
                    console.warn(`在 ${moduleUrlToAssetLink(importMeta.url)} 中检测到可能的循环引用：从 ${moduleRequest} 导入 ${imported} 时。`, extras?.error?.stack);
                },
            },
            importExceptionHandler: (...args) => this._handleImportException(...args),
            cceModuleMap,
        });
        globalThis.self = window;
        if (!isWebEnv && typeof require !== 'undefined' && require.resolve) {
            this._executor.addPolyfillFile(require.resolve('@cocos/build-polyfills/prebuilt/editor/bundle'));
        }
        // 同步插件脚本列表
        await this._syncPluginScripts.nextIteration();
        // 重载项目与插件脚本
        await this._reloadScripts.nextIteration();
    }
    async investigatePackerDriver() {
        await this._reloadScripts.nextIteration();
    }
    /**
     * 传入一个 uuid 返回这个 uuid 对应的脚本组件名字
     * @param uuid
     */
    async queryScriptName(uuid) {
        const compressUuid = utils_1.default.UUID.compressUUID(uuid, false);
        const list = this._executor.queryClassesInModule(compressUuid);
        if (!list) {
            return null;
        }
        const classConstructor = list.find((classConstructor) => cc_1.default.js.isChildClassOf(classConstructor, cc_1.default.Component));
        return classConstructor ? cc_1.default.js.getClassName(classConstructor) : null;
    }
    /**
     * 传入一个 uuid 返回这个 uuid 对应的脚本的 cid
     * @param uuid
     */
    async queryScriptCid(uuid) {
        const compressUuid = utils_1.default.UUID.compressUUID(uuid, false);
        const list = this._executor.queryClassesInModule(compressUuid);
        if (!list) {
            return null;
        }
        const classConstructor = list.find((classConstructor) => cc_1.default.js.isChildClassOf(classConstructor, cc_1.default.Component));
        return classConstructor ? cc_1.default.js.getClassId(classConstructor) : null;
    }
    /**
     * 是否是自定义脚本（不是引擎定义的组件）
     * @param classConstructor
     */
    isCustomComponent(classConstructor) {
        return this.customComponents.has(classConstructor);
    }
    async _loadScripts() { }
    /**
     * 加载脚本时触发
     */
    async loadScript() {
        this._syncPluginScriptListAsync();
    }
    /**
     * 删除脚本时触发
     */
    async removeScript() {
        this._syncPluginScriptListAsync();
    }
    /**
     * 脚本发生变化时触发
     */
    async scriptChange() {
        this._syncPluginScriptListAsync();
    }
    _executeAsync() {
        void this._reloadScripts.nextIteration();
    }
    async _execute() {
        return Promise.resolve(this._suspendPromise ?? undefined).catch((reason) => {
            console.error(reason);
        }).finally(() => {
            this._suspendPromise = null;
            return globalEnv.record(async () => {
                // Refresh pack import map before reload: after server-side recompilation,
                // chunk hashes change and the browser's cached import map becomes stale.
                const serverURL = service_manager_1.serviceManager.getServerUrl();
                if (serverURL) {
                    try {
                        const res = await fetch(`${serverURL}/scripting/x/pack-import-map-url`);
                        if (res.ok) {
                            const map = await res.json();
                            const script = document.createElement('script');
                            script.type = 'systemjs-importmap';
                            script.textContent = JSON.stringify(map);
                            document.head.appendChild(script);
                            // Force SystemJS to re-process all import maps
                            if (System.prepareImport) {
                                await System.prepareImport(true);
                            }
                        }
                    }
                    catch { }
                }
                await this._executor.reload();
            }).catch((err) => {
                console.warn('[ScriptService] Executor reload failed:', err);
            }).finally(() => {
                this.emit('script:execution-finished');
            });
        });
    }
    /**
     * 防止插件脚本切换到项目脚本或者反之时，没有同步插件脚本列表
     * 这里使用了 AsyncIterationConcurrency1 功能，为了防止被多次调用，进行了迭代合并
     * @private
     */
    _syncPluginScriptListAsync() {
        void this._syncPluginScripts.nextIteration();
    }
    /**
     * 同步插件脚本列表到 Executor
     * @private
     */
    async _syncPluginScriptList() {
        return Promise.resolve(rpc_1.Rpc.getInstance().request('assetManager', 'querySortedPlugins', [{
                loadPluginInEditor: true,
            }]))
            .then((pluginScripts) => {
            this._executor.setPluginScripts(pluginScripts || []);
        })
            .catch((reason) => {
            console.error(reason);
        });
    }
    _handleImportException(err) {
        console.error(`{hidden(${importExceptionLogTag})}`, err);
    }
};
exports.ScriptService = ScriptService;
exports.ScriptService = ScriptService = __decorate([
    (0, core_1.register)('Script'),
    __metadata("design:paramtypes", [])
], ScriptService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3NjcmlwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsbUVBQWdFO0FBQ2hFLDZFQUEwRjtBQUMxRixnQ0FBNkI7QUFDN0IsaUNBQStDO0FBRS9DLGdFQUF3QztBQUN4QyxtREFBMkI7QUFDM0IsdURBQW1EO0FBRW5EOzs7OztHQUtHO0FBQ0gsTUFBTSwwQkFBMEI7SUFDcEIsUUFBUSxDQUFzQjtJQUU5QixpQkFBaUIsR0FBeUIsSUFBSSxDQUFDO0lBRS9DLGVBQWUsR0FBeUIsSUFBSSxDQUFDO0lBRXJELFlBQVksT0FBNEI7UUFDcEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFDNUIsQ0FBQztJQUVNLGFBQWE7UUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzFCLGVBQWU7WUFDZixnQ0FBZ0M7WUFDaEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUMxRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQzthQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDL0IsMkNBQTJDO1lBQzNDLE9BQU8sSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDOUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQzVCLHFDQUFxQztnQkFDckMs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LHFCQUFxQjtRQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQztnQkFDcEYsa0JBQWtCLEVBQUUsSUFBSTthQUMzQixDQUFDLENBQUMsQ0FBQzthQUNDLElBQUksQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxHQUFZO1FBQ3ZDLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxxQkFBcUIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzdELENBQUM7Q0FDSixDQUFBO0FBdk9ZLHNDQUFhO3dCQUFiLGFBQWE7SUFEekIsSUFBQSxlQUFRLEVBQUMsUUFBUSxDQUFDOztHQUNOLGFBQWEsQ0F1T3pCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNjIGZyb20gJ2NjJztcbmltcG9ydCB7IEV4ZWN1dG9yIH0gZnJvbSAnQGNvY29zL2xpYi1wcm9ncmFtbWluZy9kaXN0L2V4ZWN1dG9yJztcbmltcG9ydCB7IFF1aWNrUGFja0xvYWRlckNvbnRleHQgfSBmcm9tICdAY29jb3MvY3JlYXRvci1wcm9ncmFtbWluZy1xdWljay1wYWNrL2xpYi9sb2FkZXInO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi4vcnBjJztcbmltcG9ydCB7IEJhc2VTZXJ2aWNlLCByZWdpc3RlciB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBJU2NyaXB0RXZlbnRzLCBJU2NyaXB0U2VydmljZSB9IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi9pMThuJztcbmltcG9ydCB7IHNlcnZpY2VNYW5hZ2VyIH0gZnJvbSAnLi9zZXJ2aWNlLW1hbmFnZXInO1xuXG4vKipcbiAqIOW8guatpei/reS7o+OAguacieS7peS4i+eJueeCue+8mlxuICogMS4g5q+P5qyh6LCD55SoIGBuZXh0SXRlcmF0aW9uKClgIOS8muaJp+ihjOS4gOasoeS8oOWFpeeahCoq6L+t5Luj5Ye95pWwKirvvJvov63ku6Plh73mlbDlhYHorrjmmK/lvILmraXnmoTvvIzlnKjmnoTpgKDlh73mlbDkuK3noa7lrprkuYvlkI7kuI3og73mm7TmlLnvvJtcbiAqIDIuIOWQjOaXtioq5pyA5aSa5LuF5Lya5pyJ5LiA5L6LKirov63ku6PlnKjmiafooYzvvJtcbiAqIDMuICoq6L+t5Luj5piv5Y+v5ZCI5bm255qEKirvvIzkuZ/lsLHmmK/or7TvvIzlnKjliY3pnaLnmoTov63ku6PmsqHlrozmiJDkuYvliY3vvIzlkI7pnaLnmoTmiYDmnInov63ku6Ppg73kvJrooqvlkIjlubbmiJDkuIDkuKrjgIJcbiAqL1xuY2xhc3MgQXN5bmNJdGVyYXRpb25Db25jdXJyZW5jeTEge1xuICAgIHByaXZhdGUgX2l0ZXJhdGU6ICgpID0+IFByb21pc2U8dm9pZD47XG5cbiAgICBwcml2YXRlIF9leGVjdXRpb25Qcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgICBwcml2YXRlIF9wZW5kaW5nUHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IoaXRlcmF0ZTogKCkgPT4gUHJvbWlzZTx2b2lkPikge1xuICAgICAgICB0aGlzLl9pdGVyYXRlID0gaXRlcmF0ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmV4dEl0ZXJhdGlvbigpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIXRoaXMuX2V4ZWN1dGlvblByb21pc2UpIHtcbiAgICAgICAgICAgIC8vIOWmguaenOacquWcqOaJp+ihjO+8jOmCo+WwseWOu+aJp+ihjFxuICAgICAgICAgICAgLy8gYXNzZXJ0KCF0aGlzLl9wZW5kaW5nUHJvbWlzZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9leGVjdXRpb25Qcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2l0ZXJhdGUoKSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXhlY3V0aW9uUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fcGVuZGluZ1Byb21pc2UpIHtcbiAgICAgICAgICAgIC8vIOWmguaenOayoeacieetieW+hemYn+WIl++8jOWIm+W7uuetieW+hSBwcm9taXNl77yM5ZyoIOaJp+ihjCBwcm9taXNlIOWujOaIkOWQjuaJp+ihjFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdQcm9taXNlID0gdGhpcy5fZXhlY3V0aW9uUHJvbWlzZS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy8g562J5b6FIHByb21pc2Ug5bCG562J5b6F5omn6KGMIHByb21pc2XvvIzlubblnKjlrozmiJDlkI7ph43mlrDlhaXpmJ9cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0SXRlcmF0aW9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOW3sue7j+acieetieW+hemYn+WIl++8jOmCo+WwseetieW+heeOsOacieeahOmYn+WIl1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdQcm9taXNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIOWvvOWFpeaXtuW8guW4uOeahOa2iOaBr+eahOagh+etvuOAglxuICovXG5jb25zdCBpbXBvcnRFeGNlcHRpb25Mb2dUYWcgPSAnOjpTY2VuZUV4ZWN1dG9ySW1wb3J0RXhjZXB0aW9uSGFuZGxlcjo6JztcblxuaW1wb3J0IHsgR2xvYmFsRW52IH0gZnJvbSAnLi4vLi4vY29tbW9uL2dsb2JhbC1lbnYnO1xuXG5jb25zdCBnbG9iYWxFbnYgPSBuZXcgR2xvYmFsRW52KCk7XG5cbkByZWdpc3RlcignU2NyaXB0JylcbmV4cG9ydCBjbGFzcyBTY3JpcHRTZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8SVNjcmlwdEV2ZW50cz4gaW1wbGVtZW50cyBJU2NyaXB0U2VydmljZSB7XG4gICAgcHJpdmF0ZSBfZXhlY3V0b3IhOiBFeGVjdXRvcjtcblxuICAgIHByaXZhdGUgX2lzSW5pdGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIF9zdXNwZW5kUHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBfc3luY1BsdWdpblNjcmlwdHM6IEFzeW5jSXRlcmF0aW9uQ29uY3VycmVuY3kxO1xuICAgIHByaXZhdGUgX3JlbG9hZFNjcmlwdHM6IEFzeW5jSXRlcmF0aW9uQ29uY3VycmVuY3kxO1xuXG4gICAgLyoqXG4gICAgICog6Z2e5byV5pOO5a6a5LmJ55qE57uE5Lu2XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIGN1c3RvbUNvbXBvbmVudHM6IFNldDxGdW5jdGlvbj4gPSBuZXcgU2V0KCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fcmVsb2FkU2NyaXB0cyA9IG5ldyBBc3luY0l0ZXJhdGlvbkNvbmN1cnJlbmN5MSgoKSA9PiB0aGlzLl9leGVjdXRlKCkpO1xuICAgICAgICB0aGlzLl9zeW5jUGx1Z2luU2NyaXB0cyA9IG5ldyBBc3luY0l0ZXJhdGlvbkNvbmN1cnJlbmN5MSgoKSA9PiB0aGlzLl9zeW5jUGx1Z2luU2NyaXB0TGlzdCgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmjILotbfohJrmnKznrqHnkIblmajnm7TliLAgYGNvbmRpdGlvbmAg57uT5p2f77yM5omN5Lya6L+b6KGM5LiL5LiA5qyh5omn6KGM44CCXG4gICAgICogQHBhcmFtIGNvbmRpdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdXNwZW5kKGNvbmRpdGlvbjogUHJvbWlzZTx2b2lkPikge1xuICAgICAgICB0aGlzLl9zdXNwZW5kUHJvbWlzZSA9IGNvbmRpdGlvbjtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBpZiAodGhpcy5faXNJbml0ZWQpIHJldHVybjtcbiAgICAgICAgdGhpcy5faXNJbml0ZWQgPSB0cnVlO1xuICAgICAgICBFZGl0b3JFeHRlbmRzLm9uKCdjbGFzcy1yZWdpc3RlcmVkJywgKGNsYXNzQ29uc3RydWN0b3I6IEZ1bmN0aW9uLCBtZXRhZGF0YTogYW55LCBjbGFzc05hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NsYXNzUmVnaXN0ZXJlZCcsIGNsYXNzTmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY2xhc3MtcmVnaXN0ZXJlZCAnICsgY2MuanMuaXNDaGlsZENsYXNzT2YoY2xhc3NDb25zdHJ1Y3RvciwgY2MuQ29tcG9uZW50KSk7XG4gICAgICAgICAgICBpZiAobWV0YWRhdGEgJiYgLy8gT25seSBwcm9qZWN0IHNjcmlwdHNcbiAgICAgICAgICAgICAgICBjYy5qcy5pc0NoaWxkQ2xhc3NPZihjbGFzc0NvbnN0cnVjdG9yLCBjYy5Db21wb25lbnQpIC8vIE9ubHkgY29tcG9uZW50c1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21Db21wb25lbnRzLmFkZChjbGFzc0NvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICBFZGl0b3JFeHRlbmRzLkNvbXBvbmVudC5hZGRNZW51KFxuICAgICAgICAgICAgICAgICAgICBjbGFzc0NvbnN0cnVjdG9yLCBgJHtpMThuLnRyYW5zSTE4bk5hbWUoJ2kxOG46RU5HSU5FLm1lbnUuY3VzdG9tX3NjcmlwdCcpfS8ke2NsYXNzTmFtZX1gLCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzZXJpYWxpemVkUGFja0xvYWRlckNvbnRleHQgPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdwcm9ncmFtbWluZycsICdnZXRQYWNrZXJEcml2ZXJMb2FkZXJDb250ZXh0JywgWydlZGl0b3InXSk7XG4gICAgICAgIGlmICghc2VyaWFsaXplZFBhY2tMb2FkZXJDb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BhY2tlci1kcml2ZXIvZ2V0LWxvYWRlci1jb250ZXh0IGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVpY2tQYWNrTG9hZGVyQ29udGV4dCA9IFF1aWNrUGFja0xvYWRlckNvbnRleHQuZGVzZXJpYWxpemUoc2VyaWFsaXplZFBhY2tMb2FkZXJDb250ZXh0KTtcblxuICAgICAgICBjb25zdCBjY2VNb2R1bGVNYXAgPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdwcm9ncmFtbWluZycsICdxdWVyeUNDRU1vZHVsZU1hcCcpO1xuICAgICAgICBjb25zdCBpc1dlYkVudiA9IHR5cGVvZiAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBTeXN0ZW0gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBTeXN0ZW0uaW1wb3J0ID09PSAnZnVuY3Rpb24nICYmICEocHJvY2VzcyBhcyBhbnkpPy52ZXJzaW9ucz8ubm9kZTtcbiAgICAgICAgbGV0IGxvYWREeW5hbWljOiBhbnk7XG4gICAgICAgIGlmICghaXNXZWJFbnYpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZWxvYWQgPSBhd2FpdCBpbXBvcnQoJ2NjL3ByZWxvYWQnKTtcbiAgICAgICAgICAgIGxvYWREeW5hbWljID0gcHJlbG9hZC5sb2FkRHluYW1pYztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9leGVjdXRvciA9IGF3YWl0IEV4ZWN1dG9yLmNyZWF0ZSh7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBpbXBvcnRFbmdpbmVNb2Q6IGFzeW5jIChpZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpc1dlYkVudikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgU3lzdGVtLmltcG9ydChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBsb2FkRHluYW1pYyEoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHF1aWNrUGFja0xvYWRlckNvbnRleHQsXG4gICAgICAgICAgICBiZWZvcmVVbnJlZ2lzdGVyQ2xhc3M6IChjbGFzc0NvbnN0cnVjdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21Db21wb25lbnRzLmRlbGV0ZShjbGFzc0NvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICBFZGl0b3JFeHRlbmRzLkNvbXBvbmVudC5yZW1vdmVNZW51KGNsYXNzQ29uc3RydWN0b3IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZ2dlcjoge1xuICAgICAgICAgICAgICAgIGxvYWRFeGNlcHRpb246IChtb2R1bGVJZCwgZXJyb3IsIGhhc0JlZW5UaHJvd24/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYEFuIGV4Y2VwdGlvbiBpcyB0aHJvd24gZHVyaW5nIGxvYWQgb2YgbW9kdWxlIFwiJHttb2R1bGVJZH1cIiAob3IgaXRzIHJlY3Vyc2l2ZSBkZXBlbmRlbmNpZXMpLiBgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwb3NzaWJsZUNpcmN1bGFyUmVmZXJlbmNlOiAoaW1wb3J0ZWQ6IHN0cmluZywgbW9kdWxlUmVxdWVzdDogc3RyaW5nLCBpbXBvcnRNZXRhOiBhbnksIGV4dHJhczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZHVsZVVybFRvQXNzZXRMaW5rID0gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmVmaXggPSAncHJvamVjdDovLy8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybC5zdGFydHNXaXRoKHByZWZpeCkgPyBge2Fzc2V0KGRiOi8vJHt1cmwuc2xpY2UocHJlZml4Lmxlbmd0aCkucmVwbGFjZSgnLmpzJywgJy50cycpfSl9YCA6IHVybDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGDlnKggJHttb2R1bGVVcmxUb0Fzc2V0TGluayhpbXBvcnRNZXRhLnVybCl9IOS4reajgOa1i+WIsOWPr+iDveeahOW+queOr+W8leeUqO+8muS7jiAke21vZHVsZVJlcXVlc3R9IOWvvOWFpSAke2ltcG9ydGVkfSDml7bjgIJgLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFzPy5lcnJvcj8uc3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRFeGNlcHRpb25IYW5kbGVyOiAoLi4uYXJncykgPT4gdGhpcy5faGFuZGxlSW1wb3J0RXhjZXB0aW9uKC4uLmFyZ3MpLFxuICAgICAgICAgICAgY2NlTW9kdWxlTWFwLFxuICAgICAgICB9KTtcblxuICAgICAgICBnbG9iYWxUaGlzLnNlbGYgPSB3aW5kb3c7XG4gICAgICAgIGlmICghaXNXZWJFbnYgJiYgdHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnICYmIHJlcXVpcmUucmVzb2x2ZSkge1xuICAgICAgICAgICAgdGhpcy5fZXhlY3V0b3IuYWRkUG9seWZpbGxGaWxlKHJlcXVpcmUucmVzb2x2ZSgnQGNvY29zL2J1aWxkLXBvbHlmaWxscy9wcmVidWlsdC9lZGl0b3IvYnVuZGxlJykpO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWQjOatpeaPkuS7tuiEmuacrOWIl+ihqFxuICAgICAgICBhd2FpdCB0aGlzLl9zeW5jUGx1Z2luU2NyaXB0cy5uZXh0SXRlcmF0aW9uKCk7XG4gICAgICAgIC8vIOmHjei9vemhueebruS4juaPkuS7tuiEmuacrFxuICAgICAgICBhd2FpdCB0aGlzLl9yZWxvYWRTY3JpcHRzLm5leHRJdGVyYXRpb24oKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbnZlc3RpZ2F0ZVBhY2tlckRyaXZlcigpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fcmVsb2FkU2NyaXB0cy5uZXh0SXRlcmF0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Lyg5YWl5LiA5LiqIHV1aWQg6L+U5Zue6L+Z5LiqIHV1aWQg5a+55bqU55qE6ISa5pys57uE5Lu25ZCN5a2XXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKi9cbiAgICBhc3luYyBxdWVyeVNjcmlwdE5hbWUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGNvbXByZXNzVXVpZCA9IHV0aWxzLlVVSUQuY29tcHJlc3NVVUlEKHV1aWQsIGZhbHNlKTtcbiAgICAgICAgY29uc3QgbGlzdCA9IHRoaXMuX2V4ZWN1dG9yLnF1ZXJ5Q2xhc3Nlc0luTW9kdWxlKGNvbXByZXNzVXVpZCk7XG4gICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2xhc3NDb25zdHJ1Y3RvciA9IGxpc3QuZmluZCgoY2xhc3NDb25zdHJ1Y3RvcikgPT4gY2MuanMuaXNDaGlsZENsYXNzT2YoY2xhc3NDb25zdHJ1Y3RvciBhcyBGdW5jdGlvbiwgY2MuQ29tcG9uZW50KSk7XG4gICAgICAgIHJldHVybiBjbGFzc0NvbnN0cnVjdG9yID8gY2MuanMuZ2V0Q2xhc3NOYW1lKGNsYXNzQ29uc3RydWN0b3IpIDogbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvKDlhaXkuIDkuKogdXVpZCDov5Tlm57ov5nkuKogdXVpZCDlr7nlupTnmoTohJrmnKznmoQgY2lkXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKi9cbiAgICBhc3luYyBxdWVyeVNjcmlwdENpZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY29tcHJlc3NVdWlkID0gdXRpbHMuVVVJRC5jb21wcmVzc1VVSUQodXVpZCwgZmFsc2UpO1xuICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5fZXhlY3V0b3IucXVlcnlDbGFzc2VzSW5Nb2R1bGUoY29tcHJlc3NVdWlkKTtcbiAgICAgICAgaWYgKCFsaXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjbGFzc0NvbnN0cnVjdG9yID0gbGlzdC5maW5kKChjbGFzc0NvbnN0cnVjdG9yKSA9PiBjYy5qcy5pc0NoaWxkQ2xhc3NPZihjbGFzc0NvbnN0cnVjdG9yIGFzIEZ1bmN0aW9uLCBjYy5Db21wb25lbnQpKTtcbiAgICAgICAgcmV0dXJuIGNsYXNzQ29uc3RydWN0b3IgPyBjYy5qcy5nZXRDbGFzc0lkKGNsYXNzQ29uc3RydWN0b3IpIDogbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmmK/lkKbmmK/oh6rlrprkuYnohJrmnKzvvIjkuI3mmK/lvJXmk47lrprkuYnnmoTnu4Tku7bvvIlcbiAgICAgKiBAcGFyYW0gY2xhc3NDb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHB1YmxpYyBpc0N1c3RvbUNvbXBvbmVudChjbGFzc0NvbnN0cnVjdG9yOiBGdW5jdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXN0b21Db21wb25lbnRzLmhhcyhjbGFzc0NvbnN0cnVjdG9yKTtcbiAgICB9XG5cbiAgICBhc3luYyBfbG9hZFNjcmlwdHMoKSB7IH1cblxuICAgIC8qKlxuICAgICAqIOWKoOi9veiEmuacrOaXtuinpuWPkVxuICAgICAqL1xuICAgIGFzeW5jIGxvYWRTY3JpcHQoKSB7XG4gICAgICAgIHRoaXMuX3N5bmNQbHVnaW5TY3JpcHRMaXN0QXN5bmMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKDpmaTohJrmnKzml7bop6blj5FcbiAgICAgKi9cbiAgICBhc3luYyByZW1vdmVTY3JpcHQoKSB7XG4gICAgICAgIHRoaXMuX3N5bmNQbHVnaW5TY3JpcHRMaXN0QXN5bmMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDohJrmnKzlj5HnlJ/lj5jljJbml7bop6blj5FcbiAgICAgKi9cbiAgICBhc3luYyBzY3JpcHRDaGFuZ2UoKSB7XG4gICAgICAgIHRoaXMuX3N5bmNQbHVnaW5TY3JpcHRMaXN0QXN5bmMoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9leGVjdXRlQXN5bmMoKSB7XG5cbiAgICAgICAgdm9pZCB0aGlzLl9yZWxvYWRTY3JpcHRzLm5leHRJdGVyYXRpb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9leGVjdXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX3N1c3BlbmRQcm9taXNlID8/IHVuZGVmaW5lZCkuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3N1c3BlbmRQcm9taXNlID0gbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbEVudi5yZWNvcmQoXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZWZyZXNoIHBhY2sgaW1wb3J0IG1hcCBiZWZvcmUgcmVsb2FkOiBhZnRlciBzZXJ2ZXItc2lkZSByZWNvbXBpbGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAvLyBjaHVuayBoYXNoZXMgY2hhbmdlIGFuZCB0aGUgYnJvd3NlcidzIGNhY2hlZCBpbXBvcnQgbWFwIGJlY29tZXMgc3RhbGUuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlclVSTCA9IHNlcnZpY2VNYW5hZ2VyLmdldFNlcnZlclVybCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VydmVyVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke3NlcnZlclVSTH0vc2NyaXB0aW5nL3gvcGFjay1pbXBvcnQtbWFwLXVybGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC50eXBlID0gJ3N5c3RlbWpzLWltcG9ydG1hcCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC50ZXh0Q29udGVudCA9IEpTT04uc3RyaW5naWZ5KG1hcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgU3lzdGVtSlMgdG8gcmUtcHJvY2VzcyBhbGwgaW1wb3J0IG1hcHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChTeXN0ZW0gYXMgYW55KS5wcmVwYXJlSW1wb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCAoU3lzdGVtIGFzIGFueSkucHJlcGFyZUltcG9ydCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9leGVjdXRvci5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbU2NyaXB0U2VydmljZV0gRXhlY3V0b3IgcmVsb2FkIGZhaWxlZDonLCBlcnIpO1xuICAgICAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdzY3JpcHQ6ZXhlY3V0aW9uLWZpbmlzaGVkJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Ziy5q2i5o+S5Lu26ISa5pys5YiH5o2i5Yiw6aG555uu6ISa5pys5oiW6ICF5Y+N5LmL5pe277yM5rKh5pyJ5ZCM5q2l5o+S5Lu26ISa5pys5YiX6KGoXG4gICAgICog6L+Z6YeM5L2/55So5LqGIEFzeW5jSXRlcmF0aW9uQ29uY3VycmVuY3kxIOWKn+iDve+8jOS4uuS6humYsuatouiiq+Wkmuasoeiwg+eUqO+8jOi/m+ihjOS6hui/reS7o+WQiOW5tlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBfc3luY1BsdWdpblNjcmlwdExpc3RBc3luYygpIHtcbiAgICAgICAgdm9pZCB0aGlzLl9zeW5jUGx1Z2luU2NyaXB0cy5uZXh0SXRlcmF0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCM5q2l5o+S5Lu26ISa5pys5YiX6KGo5YiwIEV4ZWN1dG9yXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIF9zeW5jUGx1Z2luU2NyaXB0TGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlTb3J0ZWRQbHVnaW5zJywgW3tcbiAgICAgICAgICAgIGxvYWRQbHVnaW5JbkVkaXRvcjogdHJ1ZSxcbiAgICAgICAgfV0pKVxuICAgICAgICAgICAgLnRoZW4oKHBsdWdpblNjcmlwdHMpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9leGVjdXRvci5zZXRQbHVnaW5TY3JpcHRzKHBsdWdpblNjcmlwdHMgfHwgW10pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaGFuZGxlSW1wb3J0RXhjZXB0aW9uKGVycjogdW5rbm93bikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGB7aGlkZGVuKCR7aW1wb3J0RXhjZXB0aW9uTG9nVGFnfSl9YCwgZXJyKTtcbiAgICB9XG59XG4iXX0=