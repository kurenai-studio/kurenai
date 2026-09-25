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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewNotReadyError = void 0;
exports.getCachedPreviewSettings = getCachedPreviewSettings;
exports.getCachedSceneEditorSettings = getCachedSceneEditorSettings;
exports.isPreviewSettingsReady = isPreviewSettingsReady;
exports.invalidatePreviewSettings = invalidatePreviewSettings;
/**
 * 动态预览的 settings 缓存。
 *
 * `getPreviewSettings()` 本身是无状态函数，每次调用都会重新计算 settings / bundleConfigs。
 * 这里按 `startScene` 维度缓存结果，避免每个 HTTP 请求都重新计算；脚本/资源变化时由
 * live-reload 调 `invalidatePreviewSettings()` 清空缓存，下次请求重新生成。
 */
const cache = new Map();
// Builder 以及 buildAssetLibrary 使用了进程级共享状态，不能并发生成预览 settings。
// 同一个 HTTP 请求的 settings/ bundleConfigs 路由也会同时访问这里：先合并同 key
// 的请求，再把不同 key 的生成串行化，避免多个 Builder 相互覆盖进度和临时状态。
const pending = new Map();
let cacheVersion = 0;
let generationTail = Promise.resolve();
function makeCacheKey(startScene, sceneEditor) {
    return JSON.stringify({ startScene, sceneEditor });
}
/**
 * 预览尚未就绪时抛出。路由据此返回可重试的 503，而不是生成缺 builtinAssets 的坏 settings 或裸 500。
 *
 * 「就绪」不能只看 assetDBManager.ready：该标志在 asset-db.start() 里被置位（asset-db.ts:139）
 * 后才 step() 继续导入，内置资源库 / 内置 bundle（builtinAssets 的来源，见 builder
 * setting-task/asset.ts:52 的 bundleMap[INTERNAL]._rootAssets）可能尚未完全就绪。此时
 * getPreviewSettings 要么抛错（bundleMap[INTERNAL] 缺失）→ 裸 500，要么产出 builtinAssets 为空
 * 的坏 settings → 运行时 "PhysicsSystem initDefaultMaterial Failed to load builtinMaterial" /
 * "Graphics recompileShaders of null"。因此这里以**内容校验**为准：生成失败或 builtinAssets 为空
 * 都视为未就绪，抛本错误（映射 503）且**不缓存**。
 *
 * 自愈机制（不依赖客户端手动刷新）：预览页在加载 settings/引擎之前就注册了 socket
 * `browser:reload` 监听（见 static/web/game.ejs）。未就绪时本次请求快速失败 503、boot 失败；
 * live-reload 侧监听资源事件，待 settings 首次真正可用（校验通过）时广播 browser:reload，页面
 * 整页刷新完成自愈。
 */
class PreviewNotReadyError extends Error {
    constructor(message = 'Preview asset database is not ready yet.') {
        super(message);
        this.name = 'PreviewNotReadyError';
    }
}
exports.PreviewNotReadyError = PreviewNotReadyError;
/**
 * 获取（带缓存的）预览 settings。
 * @param startScene 启动场景的 uuid 或 db:// url，留空表示使用项目默认启动场景
 */
async function getCachedPreviewSettings(startScene = '') {
    return await getCachedSettings(startScene, false);
}
async function getCachedSceneEditorSettings() {
    return await getCachedSettings('', true);
}
async function getCachedSettings(startScene, sceneEditor) {
    const cacheKey = makeCacheKey(startScene, sceneEditor);
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }
    // 第一道门禁：asset-db 连 ready 标志都没置位，必然未就绪，直接快速失败（省去无谓的生成尝试）。
    const { assetDBManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
    if (!assetDBManager.ready) {
        throw new PreviewNotReadyError();
    }
    const pendingEntry = pending.get(cacheKey);
    if (pendingEntry && pendingEntry.version === cacheVersion) {
        return await pendingEntry.promise;
    }
    const version = cacheVersion;
    const promise = runSettingsGeneration(async () => {
        const result = await generatePreviewSettings(startScene, sceneEditor);
        // 资源变化后不能让已经过期的异步生成重新写入缓存。
        if (version === cacheVersion) {
            cache.set(cacheKey, result);
        }
        return result;
    });
    pending.set(cacheKey, { version, promise });
    try {
        return await promise;
    }
    finally {
        const current = pending.get(cacheKey);
        if (current?.promise === promise) {
            pending.delete(cacheKey);
        }
    }
}
async function runSettingsGeneration(task) {
    const previous = generationTail;
    let release;
    generationTail = new Promise((resolve) => {
        release = resolve;
    });
    await previous;
    try {
        return await task();
    }
    finally {
        release();
    }
}
/**
 * 生成并**校验**预览 settings。未就绪（生成抛错或 builtinAssets 为空）时抛 PreviewNotReadyError。
 * 抽出为独立函数，供 getCachedPreviewSettings 与 live-reload 的就绪探测复用；不写缓存。
 */
async function generatePreviewSettings(startScene, sceneEditor) {
    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
    let result;
    try {
        const { getPreviewSettings, queryDefaultBuildConfigByPlatform } = await Promise.resolve().then(() => __importStar(require('../builder')));
        const { fillIncludeModulesFromProjectConfig } = await Promise.resolve().then(() => __importStar(require('../builder/share/common-options-validator')));
        const tmp = await queryDefaultBuildConfigByPlatform('web-desktop');
        const options = JSON.parse(JSON.stringify(tmp));
        // 预览必须 debug=true，否则内置 bundle 加载即崩（Cannot read properties of undefined (reading 'cc.EffectAsset')）。
        // 原因：预览的 getPreviewSettings 只跑 data/setting task，不跑 bundle 构建，bundle 配置永远不经过
        // bundle.compress()——config.paths 里类型保留为字符串（'cc.EffectAsset' 等），config.types 数组也从未生成。
        // 而引擎 asset-manager/config.ts processOptions 仅在 config.debug === false 时才把 entry[1] 当索引去
        // types[entry[1]] 解压；此时 config.types 为 undefined，就会 undefined['cc.EffectAsset'] 抛错。
        // config.debug 直接取自 options.debug，故这里必须置 true，让引擎按未压缩格式读取，跳过解压分支。
        options.debug = true;
        // 与正式构建（builder createBuildTask）保持一致：从 cocos.config.json 补全 includeModules。
        // 预览路径原本不补全，options.includeModules 为空/默认时，内置资源包会漏掉当前模块（尤其是所选
        // 物理后端 physics-cannon/ammo/physx/builtin）的 dependentAssets，比如内置物理材质
        // default-physics-material (ba21476f)。运行时 PhysicsSystem.initDefaultMaterial() 便会
        // builtinResMgr.get 到 null，报 "Failed to load builtinMaterial"(errorID 9642)。
        // 同时这也让浏览器预览真正按项目配置的物理后端运行（切后端后能生效）。
        await fillIncludeModulesFromProjectConfig(options);
        // 解析有效启动场景：显式入参 > 构建配置（扁平或 packages 嵌套）> 项目首个场景。
        // 预览模式下 builder 不会校验/补全 startScene（见 setting-task/asset.ts），
        // 留空或指向已删除的场景都会导致前端请求 /scene/<uuid>.json 404。
        // 因此每个候选都要校验在 asset-db 中真实存在，否则继续回退。
        const candidates = [
            startScene,
            options.startScene,
            options.packages?.['web-desktop']?.startScene,
        ];
        let effectiveScene = '';
        for (const candidate of candidates) {
            if (candidate && assetManager.queryAssetInfo(candidate)) {
                effectiveScene = candidate;
                break;
            }
        }
        if (!effectiveScene) {
            effectiveScene = await resolveDefaultStartScene();
        }
        options.startScene = effectiveScene;
        options.sceneEditor = sceneEditor;
        // 预览模式下注册项目中的全部场景，使运行时 cc.director.loadScene(name)/(uuid) 可加载任意场景，
        // 对齐编辑器预览行为。构建配置里的 scenes 默认只含构建时勾选的子集，会导致脚本里按名
        // loadScene 其它场景时报 "not in the build settings before playing"。
        const allScenes = assetManager.queryAssetInfos({ ccType: 'cc.SceneAsset' }) || [];
        options.scenes = allScenes.map((scene) => ({ url: scene.url, uuid: scene.uuid }));
        result = await getPreviewSettings(options);
    }
    catch (err) {
        // asset-db.ready 置位后、内置资源库/内置 bundle 尚未完全导入时，getPreviewSettings 会因
        // bundleMap[INTERNAL] 缺失等抛错。这属于「尚未就绪」，转成可重试错误（503）而非裸 500，
        // 且不缓存，交由 live-reload 在真正就绪后推送 browser:reload 自愈。
        throw new PreviewNotReadyError('Preview settings generation failed (likely asset db not fully ready): ' + (err?.message || String(err)));
    }
    // 内容校验：builtinAssets 为空说明内置资源库/内置 bundle 尚未就绪。此时若放行，运行时会报
    // builtinMaterial 加载失败 / graphics recompileShaders null。视为未就绪，抛可重试错误、不缓存。
    const builtinAssets = result?.settings?.engine?.builtinAssets;
    if (!Array.isArray(builtinAssets) || builtinAssets.length === 0) {
        throw new PreviewNotReadyError('Preview settings has empty builtinAssets (asset db not fully ready).');
    }
    // 动态预览「只托管不构建」，但 getPreviewSettings 给出的 rendering.effectSettingsPath 默认指向
    // 构建产物 'src/effect.bin'（见 setting-task/utils/project-options.ts）。该文件在预览下不存在，
    // 浏览器请求 GET /src/effect.bin 会 404，引擎再把 404 页面当二进制解析，报
    // "RangeError: Offset is outside the bounds of the DataView"。
    // 自定义渲染管线时改指向动态 effect-settings 路由，与场景编辑器（engine/index.ts）一致，
    // 由服务端从 temp/asset-db/effect/effect.bin 提供。
    const rendering = result?.settings?.rendering;
    if (rendering && rendering.effectSettingsPath) {
        rendering.effectSettingsPath = '/scripting/engine/effect-settings';
    }
    return result;
}
/**
 * 探测预览 settings 是否已可用（校验通过并已写入缓存）。供 live-reload 在资源事件后判定「首次就绪」。
 * 返回 true 表示可用（缓存已预热）；未就绪返回 false；其它非就绪类异常向上抛出。
 */
async function isPreviewSettingsReady(startScene = '') {
    try {
        await getCachedPreviewSettings(startScene);
        return true;
    }
    catch (err) {
        if (err instanceof PreviewNotReadyError) {
            return false;
        }
        throw err;
    }
}
/**
 * 项目未配置启动场景（或配置已失效）时，回退到项目中的第一个场景资源。
 */
async function resolveDefaultStartScene() {
    try {
        const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
        const scenes = assetManager.queryAssetInfos({ ccType: 'cc.SceneAsset' });
        if (scenes && scenes.length) {
            return scenes[0].uuid;
        }
        console.warn('[Preview Server] No scene asset found in project; launch scene will be empty.');
    }
    catch (err) {
        console.warn('[Preview Server] Failed to resolve default start scene:', err);
    }
    return '';
}
/**
 * 清空预览 settings 缓存。脚本重编译或资源变化后调用。
 */
function invalidatePreviewSettings() {
    cacheVersion++;
    cache.clear();
    pending.clear();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1zZXR0aW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3ByZXZpZXcvcHJldmlldy1zZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnREEsNERBRUM7QUFFRCxvRUFFQztBQTRJRCx3REFVQztBQXNCRCw4REFJQztBQXBPRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBa0MsQ0FBQztBQUN4RCw2REFBNkQ7QUFDN0QsMkRBQTJEO0FBQzNELGdEQUFnRDtBQUNoRCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBMEUsQ0FBQztBQUNsRyxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDckIsSUFBSSxjQUFjLEdBQWtCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUV0RCxTQUFTLFlBQVksQ0FBQyxVQUFrQixFQUFFLFdBQW9CO0lBQzFELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFhLG9CQUFxQixTQUFRLEtBQUs7SUFDM0MsWUFBWSxPQUFPLEdBQUcsMENBQTBDO1FBQzVELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsc0JBQXNCLENBQUM7SUFDdkMsQ0FBQztDQUNKO0FBTEQsb0RBS0M7QUFFRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsd0JBQXdCLENBQUMsVUFBVSxHQUFHLEVBQUU7SUFDMUQsT0FBTyxNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRU0sS0FBSyxVQUFVLDRCQUE0QjtJQUM5QyxPQUFPLE1BQU0saUJBQWlCLENBQUMsRUFB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fSBmcm9tICcuLi9idWlsZGVyL0B0eXBlcy9wcml2YXRlJztcblxuLyoqXG4gKiDliqjmgIHpooTop4jnmoQgc2V0dGluZ3Mg57yT5a2Y44CCXG4gKlxuICogYGdldFByZXZpZXdTZXR0aW5ncygpYCDmnKzouqvmmK/ml6DnirbmgIHlh73mlbDvvIzmr4/mrKHosIPnlKjpg73kvJrph43mlrDorqHnrpcgc2V0dGluZ3MgLyBidW5kbGVDb25maWdz44CCXG4gKiDov5nph4zmjIkgYHN0YXJ0U2NlbmVgIOe7tOW6pue8k+WtmOe7k+aenO+8jOmBv+WFjeavj+S4qiBIVFRQIOivt+axgumDvemHjeaWsOiuoeeul++8m+iEmuacrC/otYTmupDlj5jljJbml7bnlLFcbiAqIGxpdmUtcmVsb2FkIOiwgyBgaW52YWxpZGF0ZVByZXZpZXdTZXR0aW5ncygpYCDmuIXnqbrnvJPlrZjvvIzkuIvmrKHor7fmsYLph43mlrDnlJ/miJDjgIJcbiAqL1xuY29uc3QgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgSVByZXZpZXdTZXR0aW5nc1Jlc3VsdD4oKTtcbi8vIEJ1aWxkZXIg5Lul5Y+KIGJ1aWxkQXNzZXRMaWJyYXJ5IOS9v+eUqOS6hui/m+eoi+e6p+WFseS6q+eKtuaAge+8jOS4jeiDveW5tuWPkeeUn+aIkOmihOiniCBzZXR0aW5nc+OAglxuLy8g5ZCM5LiA5LiqIEhUVFAg6K+35rGC55qEIHNldHRpbmdzLyBidW5kbGVDb25maWdzIOi3r+eUseS5n+S8muWQjOaXtuiuv+mXrui/memHjO+8muWFiOWQiOW5tuWQjCBrZXlcbi8vIOeahOivt+axgu+8jOWGjeaKiuS4jeWQjCBrZXkg55qE55Sf5oiQ5Liy6KGM5YyW77yM6YG/5YWN5aSa5LiqIEJ1aWxkZXIg55u45LqS6KaG55uW6L+b5bqm5ZKM5Li05pe254q25oCB44CCXG5jb25zdCBwZW5kaW5nID0gbmV3IE1hcDxzdHJpbmcsIHsgdmVyc2lvbjogbnVtYmVyOyBwcm9taXNlOiBQcm9taXNlPElQcmV2aWV3U2V0dGluZ3NSZXN1bHQ+OyB9PigpO1xubGV0IGNhY2hlVmVyc2lvbiA9IDA7XG5sZXQgZ2VuZXJhdGlvblRhaWw6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuZnVuY3Rpb24gbWFrZUNhY2hlS2V5KHN0YXJ0U2NlbmU6IHN0cmluZywgc2NlbmVFZGl0b3I6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7IHN0YXJ0U2NlbmUsIHNjZW5lRWRpdG9yIH0pO1xufVxuXG4vKipcbiAqIOmihOiniOWwmuacquWwsee7quaXtuaKm+WHuuOAgui3r+eUseaNruatpOi/lOWbnuWPr+mHjeivleeahCA1MDPvvIzogIzkuI3mmK/nlJ/miJDnvLogYnVpbHRpbkFzc2V0cyDnmoTlnY8gc2V0dGluZ3Mg5oiW6KO4IDUwMOOAglxuICpcbiAqIOOAjOWwsee7quOAjeS4jeiDveWPqueciyBhc3NldERCTWFuYWdlci5yZWFkee+8muivpeagh+W/l+WcqCBhc3NldC1kYi5zdGFydCgpIOmHjOiiq+e9ruS9je+8iGFzc2V0LWRiLnRzOjEzOe+8iVxuICog5ZCO5omNIHN0ZXAoKSDnu6fnu63lr7zlhaXvvIzlhoXnva7otYTmupDlupMgLyDlhoXnva4gYnVuZGxl77yIYnVpbHRpbkFzc2V0cyDnmoTmnaXmupDvvIzop4EgYnVpbGRlclxuICogc2V0dGluZy10YXNrL2Fzc2V0LnRzOjUyIOeahCBidW5kbGVNYXBbSU5URVJOQUxdLl9yb290QXNzZXRz77yJ5Y+v6IO95bCa5pyq5a6M5YWo5bCx57uq44CC5q2k5pe2XG4gKiBnZXRQcmV2aWV3U2V0dGluZ3Mg6KaB5LmI5oqb6ZSZ77yIYnVuZGxlTWFwW0lOVEVSTkFMXSDnvLrlpLHvvInihpIg6KO4IDUwMO+8jOimgeS5iOS6p+WHuiBidWlsdGluQXNzZXRzIOS4uuepulxuICog55qE5Z2PIHNldHRpbmdzIOKGkiDov5DooYzml7YgXCJQaHlzaWNzU3lzdGVtIGluaXREZWZhdWx0TWF0ZXJpYWwgRmFpbGVkIHRvIGxvYWQgYnVpbHRpbk1hdGVyaWFsXCIgL1xuICogXCJHcmFwaGljcyByZWNvbXBpbGVTaGFkZXJzIG9mIG51bGxcIuOAguWboOatpOi/memHjOS7pSoq5YaF5a655qCh6aqMKirkuLrlh4bvvJrnlJ/miJDlpLHotKXmiJYgYnVpbHRpbkFzc2V0cyDkuLrnqbpcbiAqIOmDveinhuS4uuacquWwsee7qu+8jOaKm+acrOmUmeivr++8iOaYoOWwhCA1MDPvvInkuJQqKuS4jee8k+WtmCoq44CCXG4gKlxuICog6Ieq5oSI5py65Yi277yI5LiN5L6d6LWW5a6i5oi356uv5omL5Yqo5Yi35paw77yJ77ya6aKE6KeI6aG15Zyo5Yqg6L29IHNldHRpbmdzL+W8leaTjuS5i+WJjeWwseazqOWGjOS6hiBzb2NrZXRcbiAqIGBicm93c2VyOnJlbG9hZGAg55uR5ZCs77yI6KeBIHN0YXRpYy93ZWIvZ2FtZS5lanPvvInjgILmnKrlsLHnu6rml7bmnKzmrKHor7fmsYLlv6vpgJ/lpLHotKUgNTAz44CBYm9vdCDlpLHotKXvvJtcbiAqIGxpdmUtcmVsb2FkIOS+p+ebkeWQrOi1hOa6kOS6i+S7tu+8jOW+hSBzZXR0aW5ncyDpppbmrKHnnJ/mraPlj6/nlKjvvIjmoKHpqozpgJrov4fvvInml7blub/mkq0gYnJvd3NlcjpyZWxvYWTvvIzpobXpnaJcbiAqIOaVtOmhteWIt+aWsOWujOaIkOiHquaEiOOAglxuICovXG5leHBvcnQgY2xhc3MgUHJldmlld05vdFJlYWR5RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSA9ICdQcmV2aWV3IGFzc2V0IGRhdGFiYXNlIGlzIG5vdCByZWFkeSB5ZXQuJykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gJ1ByZXZpZXdOb3RSZWFkeUVycm9yJztcbiAgICB9XG59XG5cbi8qKlxuICog6I635Y+W77yI5bim57yT5a2Y55qE77yJ6aKE6KeIIHNldHRpbmdz44CCXG4gKiBAcGFyYW0gc3RhcnRTY2VuZSDlkK/liqjlnLrmma/nmoQgdXVpZCDmiJYgZGI6Ly8gdXJs77yM55WZ56m66KGo56S65L2/55So6aG555uu6buY6K6k5ZCv5Yqo5Zy65pmvXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDYWNoZWRQcmV2aWV3U2V0dGluZ3Moc3RhcnRTY2VuZSA9ICcnKTogUHJvbWlzZTxJUHJldmlld1NldHRpbmdzUmVzdWx0PiB7XG4gICAgcmV0dXJuIGF3YWl0IGdldENhY2hlZFNldHRpbmdzKHN0YXJ0U2NlbmUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENhY2hlZFNjZW5lRWRpdG9yU2V0dGluZ3MoKTogUHJvbWlzZTxJUHJldmlld1NldHRpbmdzUmVzdWx0PiB7XG4gICAgcmV0dXJuIGF3YWl0IGdldENhY2hlZFNldHRpbmdzKCcnLCB0cnVlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q2FjaGVkU2V0dGluZ3Moc3RhcnRTY2VuZTogc3RyaW5nLCBzY2VuZUVkaXRvcjogYm9vbGVhbik6IFByb21pc2U8SVByZXZpZXdTZXR0aW5nc1Jlc3VsdD4ge1xuICAgIGNvbnN0IGNhY2hlS2V5ID0gbWFrZUNhY2hlS2V5KHN0YXJ0U2NlbmUsIHNjZW5lRWRpdG9yKTtcbiAgICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICB9XG4gICAgLy8g56ys5LiA6YGT6Zeo56aB77yaYXNzZXQtZGIg6L+eIHJlYWR5IOagh+W/l+mDveayoee9ruS9je+8jOW/heeEtuacquWwsee7qu+8jOebtOaOpeW/q+mAn+Wksei0pe+8iOecgeWOu+aXoOiwk+eahOeUn+aIkOWwneivle+8ieOAglxuICAgIGNvbnN0IHsgYXNzZXREQk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgaWYgKCFhc3NldERCTWFuYWdlci5yZWFkeSkge1xuICAgICAgICB0aHJvdyBuZXcgUHJldmlld05vdFJlYWR5RXJyb3IoKTtcbiAgICB9XG5cbiAgICBjb25zdCBwZW5kaW5nRW50cnkgPSBwZW5kaW5nLmdldChjYWNoZUtleSk7XG4gICAgaWYgKHBlbmRpbmdFbnRyeSAmJiBwZW5kaW5nRW50cnkudmVyc2lvbiA9PT0gY2FjaGVWZXJzaW9uKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBwZW5kaW5nRW50cnkucHJvbWlzZTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZXJzaW9uID0gY2FjaGVWZXJzaW9uO1xuICAgIGNvbnN0IHByb21pc2UgPSBydW5TZXR0aW5nc0dlbmVyYXRpb24oYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdTZXR0aW5ncyhzdGFydFNjZW5lLCBzY2VuZUVkaXRvcik7XG4gICAgICAgIC8vIOi1hOa6kOWPmOWMluWQjuS4jeiDveiuqeW3sue7j+i/h+acn+eahOW8guatpeeUn+aIkOmHjeaWsOWGmeWFpee8k+WtmOOAglxuICAgICAgICBpZiAodmVyc2lvbiA9PT0gY2FjaGVWZXJzaW9uKSB7XG4gICAgICAgICAgICBjYWNoZS5zZXQoY2FjaGVLZXksIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgICBwZW5kaW5nLnNldChjYWNoZUtleSwgeyB2ZXJzaW9uLCBwcm9taXNlIH0pO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBwcm9taXNlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBwZW5kaW5nLmdldChjYWNoZUtleSk7XG4gICAgICAgIGlmIChjdXJyZW50Py5wcm9taXNlID09PSBwcm9taXNlKSB7XG4gICAgICAgICAgICBwZW5kaW5nLmRlbGV0ZShjYWNoZUtleSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blNldHRpbmdzR2VuZXJhdGlvbjxUPih0YXNrOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgcHJldmlvdXMgPSBnZW5lcmF0aW9uVGFpbDtcbiAgICBsZXQgcmVsZWFzZSE6ICgpID0+IHZvaWQ7XG4gICAgZ2VuZXJhdGlvblRhaWwgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICByZWxlYXNlID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgICBhd2FpdCBwcmV2aW91cztcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGFzaygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlbGVhc2UoKTtcbiAgICB9XG59XG5cbi8qKlxuICog55Sf5oiQ5bm2KirmoKHpqowqKumihOiniCBzZXR0aW5nc+OAguacquWwsee7qu+8iOeUn+aIkOaKm+mUmeaIliBidWlsdGluQXNzZXRzIOS4uuepuu+8ieaXtuaKmyBQcmV2aWV3Tm90UmVhZHlFcnJvcuOAglxuICog5oq95Ye65Li654us56uL5Ye95pWw77yM5L6bIGdldENhY2hlZFByZXZpZXdTZXR0aW5ncyDkuI4gbGl2ZS1yZWxvYWQg55qE5bCx57uq5o6i5rWL5aSN55So77yb5LiN5YaZ57yT5a2Y44CCXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUHJldmlld1NldHRpbmdzKHN0YXJ0U2NlbmU6IHN0cmluZywgc2NlbmVFZGl0b3I6IGJvb2xlYW4pOiBQcm9taXNlPElQcmV2aWV3U2V0dGluZ3NSZXN1bHQ+IHtcbiAgICBjb25zdCB7IGFzc2V0TWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hc3NldHMnKTtcbiAgICBsZXQgcmVzdWx0OiBJUHJldmlld1NldHRpbmdzUmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgZ2V0UHJldmlld1NldHRpbmdzLCBxdWVyeURlZmF1bHRCdWlsZENvbmZpZ0J5UGxhdGZvcm0gfSA9IGF3YWl0IGltcG9ydCgnLi4vYnVpbGRlcicpO1xuICAgICAgICBjb25zdCB7IGZpbGxJbmNsdWRlTW9kdWxlc0Zyb21Qcm9qZWN0Q29uZmlnIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2J1aWxkZXIvc2hhcmUvY29tbW9uLW9wdGlvbnMtdmFsaWRhdG9yJyk7XG4gICAgICAgIGNvbnN0IHRtcCA9IGF3YWl0IHF1ZXJ5RGVmYXVsdEJ1aWxkQ29uZmlnQnlQbGF0Zm9ybSgnd2ViLWRlc2t0b3AnKTtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodG1wKSk7XG4gICAgICAgIC8vIOmihOiniOW/hemhuyBkZWJ1Zz10cnVl77yM5ZCm5YiZ5YaF572uIGJ1bmRsZSDliqDovb3ljbPltKnvvIhDYW5ub3QgcmVhZCBwcm9wZXJ0aWVzIG9mIHVuZGVmaW5lZCAocmVhZGluZyAnY2MuRWZmZWN0QXNzZXQnKe+8ieOAglxuICAgICAgICAvLyDljp/lm6DvvJrpooTop4jnmoQgZ2V0UHJldmlld1NldHRpbmdzIOWPqui3kSBkYXRhL3NldHRpbmcgdGFza++8jOS4jei3kSBidW5kbGUg5p6E5bu677yMYnVuZGxlIOmFjee9ruawuOi/nOS4jee7j+i/h1xuICAgICAgICAvLyBidW5kbGUuY29tcHJlc3MoKeKAlOKAlGNvbmZpZy5wYXRocyDph4znsbvlnovkv53nlZnkuLrlrZfnrKbkuLLvvIgnY2MuRWZmZWN0QXNzZXQnIOetie+8ie+8jGNvbmZpZy50eXBlcyDmlbDnu4TkuZ/ku47mnKrnlJ/miJDjgIJcbiAgICAgICAgLy8g6ICM5byV5pOOIGFzc2V0LW1hbmFnZXIvY29uZmlnLnRzIHByb2Nlc3NPcHRpb25zIOS7heWcqCBjb25maWcuZGVidWcgPT09IGZhbHNlIOaXtuaJjeaKiiBlbnRyeVsxXSDlvZPntKLlvJXljrtcbiAgICAgICAgLy8gdHlwZXNbZW50cnlbMV1dIOino+WOi++8m+atpOaXtiBjb25maWcudHlwZXMg5Li6IHVuZGVmaW5lZO+8jOWwseS8miB1bmRlZmluZWRbJ2NjLkVmZmVjdEFzc2V0J10g5oqb6ZSZ44CCXG4gICAgICAgIC8vIGNvbmZpZy5kZWJ1ZyDnm7TmjqXlj5boh6ogb3B0aW9ucy5kZWJ1Z++8jOaVhei/memHjOW/hemhu+e9riB0cnVl77yM6K6p5byV5pOO5oyJ5pyq5Y6L57yp5qC85byP6K+75Y+W77yM6Lez6L+H6Kej5Y6L5YiG5pSv44CCXG4gICAgICAgIG9wdGlvbnMuZGVidWcgPSB0cnVlO1xuICAgICAgICAvLyDkuI7mraPlvI/mnoTlu7rvvIhidWlsZGVyIGNyZWF0ZUJ1aWxkVGFza++8ieS/neaMgeS4gOiHtO+8muS7jiBjb2Nvcy5jb25maWcuanNvbiDooaXlhaggaW5jbHVkZU1vZHVsZXPjgIJcbiAgICAgICAgLy8g6aKE6KeI6Lev5b6E5Y6f5pys5LiN6KGl5YWo77yMb3B0aW9ucy5pbmNsdWRlTW9kdWxlcyDkuLrnqbov6buY6K6k5pe277yM5YaF572u6LWE5rqQ5YyF5Lya5ryP5o6J5b2T5YmN5qih5Z2X77yI5bCk5YW25piv5omA6YCJXG4gICAgICAgIC8vIOeJqeeQhuWQjuerryBwaHlzaWNzLWNhbm5vbi9hbW1vL3BoeXN4L2J1aWx0aW7vvInnmoQgZGVwZW5kZW50QXNzZXRz77yM5q+U5aaC5YaF572u54mp55CG5p2Q6LSoXG4gICAgICAgIC8vIGRlZmF1bHQtcGh5c2ljcy1tYXRlcmlhbCAoYmEyMTQ3NmYp44CC6L+Q6KGM5pe2IFBoeXNpY3NTeXN0ZW0uaW5pdERlZmF1bHRNYXRlcmlhbCgpIOS+v+S8mlxuICAgICAgICAvLyBidWlsdGluUmVzTWdyLmdldCDliLAgbnVsbO+8jOaKpSBcIkZhaWxlZCB0byBsb2FkIGJ1aWx0aW5NYXRlcmlhbFwiKGVycm9ySUQgOTY0MinjgIJcbiAgICAgICAgLy8g5ZCM5pe26L+Z5Lmf6K6p5rWP6KeI5Zmo6aKE6KeI55yf5q2j5oyJ6aG555uu6YWN572u55qE54mp55CG5ZCO56uv6L+Q6KGM77yI5YiH5ZCO56uv5ZCO6IO955Sf5pWI77yJ44CCXG4gICAgICAgIGF3YWl0IGZpbGxJbmNsdWRlTW9kdWxlc0Zyb21Qcm9qZWN0Q29uZmlnKG9wdGlvbnMgYXMgYW55KTtcbiAgICAgICAgLy8g6Kej5p6Q5pyJ5pWI5ZCv5Yqo5Zy65pmv77ya5pi+5byP5YWl5Y+CID4g5p6E5bu66YWN572u77yI5omB5bmz5oiWIHBhY2thZ2VzIOW1jOWll++8iT4g6aG555uu6aaW5Liq5Zy65pmv44CCXG4gICAgICAgIC8vIOmihOiniOaooeW8j+S4iyBidWlsZGVyIOS4jeS8muagoemqjC/ooaXlhaggc3RhcnRTY2VuZe+8iOingSBzZXR0aW5nLXRhc2svYXNzZXQudHPvvInvvIxcbiAgICAgICAgLy8g55WZ56m65oiW5oyH5ZCR5bey5Yig6Zmk55qE5Zy65pmv6YO95Lya5a+86Ie05YmN56uv6K+35rGCIC9zY2VuZS88dXVpZD4uanNvbiA0MDTjgIJcbiAgICAgICAgLy8g5Zug5q2k5q+P5Liq5YCZ6YCJ6YO96KaB5qCh6aqM5ZyoIGFzc2V0LWRiIOS4reecn+WunuWtmOWcqO+8jOWQpuWImee7p+e7reWbnumAgOOAglxuICAgICAgICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgICAgICAgICAgc3RhcnRTY2VuZSxcbiAgICAgICAgICAgIChvcHRpb25zIGFzIGFueSkuc3RhcnRTY2VuZSxcbiAgICAgICAgICAgIChvcHRpb25zIGFzIGFueSkucGFja2FnZXM/Llsnd2ViLWRlc2t0b3AnXT8uc3RhcnRTY2VuZSxcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IGVmZmVjdGl2ZVNjZW5lID0gJyc7XG4gICAgICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChjYW5kaWRhdGUgJiYgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRJbmZvKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBlZmZlY3RpdmVTY2VuZSA9IGNhbmRpZGF0ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVmZmVjdGl2ZVNjZW5lKSB7XG4gICAgICAgICAgICBlZmZlY3RpdmVTY2VuZSA9IGF3YWl0IHJlc29sdmVEZWZhdWx0U3RhcnRTY2VuZSgpO1xuICAgICAgICB9XG4gICAgICAgIChvcHRpb25zIGFzIGFueSkuc3RhcnRTY2VuZSA9IGVmZmVjdGl2ZVNjZW5lO1xuICAgICAgICAob3B0aW9ucyBhcyBhbnkpLnNjZW5lRWRpdG9yID0gc2NlbmVFZGl0b3I7XG4gICAgICAgIC8vIOmihOiniOaooeW8j+S4i+azqOWGjOmhueebruS4reeahOWFqOmDqOWcuuaZr++8jOS9v+i/kOihjOaXtiBjYy5kaXJlY3Rvci5sb2FkU2NlbmUobmFtZSkvKHV1aWQpIOWPr+WKoOi9veS7u+aEj+WcuuaZr++8jFxuICAgICAgICAvLyDlr7npvZDnvJbovpHlmajpooTop4jooYzkuLrjgILmnoTlu7rphY3nva7ph4znmoQgc2NlbmVzIOm7mOiupOWPquWQq+aehOW7uuaXtuWLvumAieeahOWtkOmbhu+8jOS8muWvvOiHtOiEmuacrOmHjOaMieWQjVxuICAgICAgICAvLyBsb2FkU2NlbmUg5YW25a6D5Zy65pmv5pe25oqlIFwibm90IGluIHRoZSBidWlsZCBzZXR0aW5ncyBiZWZvcmUgcGxheWluZ1wi44CCXG4gICAgICAgIGNvbnN0IGFsbFNjZW5lcyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mb3MoeyBjY1R5cGU6ICdjYy5TY2VuZUFzc2V0JyB9KSB8fCBbXTtcbiAgICAgICAgKG9wdGlvbnMgYXMgYW55KS5zY2VuZXMgPSBhbGxTY2VuZXMubWFwKChzY2VuZSkgPT4gKHsgdXJsOiBzY2VuZS51cmwsIHV1aWQ6IHNjZW5lLnV1aWQgfSkpO1xuICAgICAgICByZXN1bHQgPSBhd2FpdCBnZXRQcmV2aWV3U2V0dGluZ3Mob3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIGFzc2V0LWRiLnJlYWR5IOe9ruS9jeWQjuOAgeWGhee9rui1hOa6kOW6ky/lhoXnva4gYnVuZGxlIOWwmuacquWujOWFqOWvvOWFpeaXtu+8jGdldFByZXZpZXdTZXR0aW5ncyDkvJrlm6BcbiAgICAgICAgLy8gYnVuZGxlTWFwW0lOVEVSTkFMXSDnvLrlpLHnrYnmipvplJnjgILov5nlsZ7kuo7jgIzlsJrmnKrlsLHnu6rjgI3vvIzovazmiJDlj6/ph43or5XplJnor6/vvIg1MDPvvInogIzpnZ7oo7ggNTAw77yMXG4gICAgICAgIC8vIOS4lOS4jee8k+WtmO+8jOS6pOeUsSBsaXZlLXJlbG9hZCDlnKjnnJ/mraPlsLHnu6rlkI7mjqjpgIEgYnJvd3NlcjpyZWxvYWQg6Ieq5oSI44CCXG4gICAgICAgIHRocm93IG5ldyBQcmV2aWV3Tm90UmVhZHlFcnJvcihcbiAgICAgICAgICAgICdQcmV2aWV3IHNldHRpbmdzIGdlbmVyYXRpb24gZmFpbGVkIChsaWtlbHkgYXNzZXQgZGIgbm90IGZ1bGx5IHJlYWR5KTogJyArICgoZXJyIGFzIEVycm9yKT8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyKSksXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8g5YaF5a655qCh6aqM77yaYnVpbHRpbkFzc2V0cyDkuLrnqbror7TmmI7lhoXnva7otYTmupDlupMv5YaF572uIGJ1bmRsZSDlsJrmnKrlsLHnu6rjgILmraTml7boi6XmlL7ooYzvvIzov5DooYzml7bkvJrmiqVcbiAgICAvLyBidWlsdGluTWF0ZXJpYWwg5Yqg6L295aSx6LSlIC8gZ3JhcGhpY3MgcmVjb21waWxlU2hhZGVycyBudWxs44CC6KeG5Li65pyq5bCx57uq77yM5oqb5Y+v6YeN6K+V6ZSZ6K+v44CB5LiN57yT5a2Y44CCXG4gICAgY29uc3QgYnVpbHRpbkFzc2V0cyA9IChyZXN1bHQgYXMgYW55KT8uc2V0dGluZ3M/LmVuZ2luZT8uYnVpbHRpbkFzc2V0cztcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYnVpbHRpbkFzc2V0cykgfHwgYnVpbHRpbkFzc2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFByZXZpZXdOb3RSZWFkeUVycm9yKCdQcmV2aWV3IHNldHRpbmdzIGhhcyBlbXB0eSBidWlsdGluQXNzZXRzIChhc3NldCBkYiBub3QgZnVsbHkgcmVhZHkpLicpO1xuICAgIH1cblxuICAgIC8vIOWKqOaAgemihOiniOOAjOWPquaJmOeuoeS4jeaehOW7uuOAje+8jOS9hiBnZXRQcmV2aWV3U2V0dGluZ3Mg57uZ5Ye655qEIHJlbmRlcmluZy5lZmZlY3RTZXR0aW5nc1BhdGgg6buY6K6k5oyH5ZCRXG4gICAgLy8g5p6E5bu65Lqn54mpICdzcmMvZWZmZWN0LmJpbifvvIjop4Egc2V0dGluZy10YXNrL3V0aWxzL3Byb2plY3Qtb3B0aW9ucy50c++8ieOAguivpeaWh+S7tuWcqOmihOiniOS4i+S4jeWtmOWcqO+8jFxuICAgIC8vIOa1j+iniOWZqOivt+axgiBHRVQgL3NyYy9lZmZlY3QuYmluIOS8miA0MDTvvIzlvJXmk47lho3mioogNDA0IOmhtemdouW9k+S6jOi/m+WItuino+aekO+8jOaKpVxuICAgIC8vIFwiUmFuZ2VFcnJvcjogT2Zmc2V0IGlzIG91dHNpZGUgdGhlIGJvdW5kcyBvZiB0aGUgRGF0YVZpZXdcIuOAglxuICAgIC8vIOiHquWumuS5iea4suafk+euoee6v+aXtuaUueaMh+WQkeWKqOaAgSBlZmZlY3Qtc2V0dGluZ3Mg6Lev55Sx77yM5LiO5Zy65pmv57yW6L6R5Zmo77yIZW5naW5lL2luZGV4LnRz77yJ5LiA6Ie077yMXG4gICAgLy8g55Sx5pyN5Yqh56uv5LuOIHRlbXAvYXNzZXQtZGIvZWZmZWN0L2VmZmVjdC5iaW4g5o+Q5L6b44CCXG4gICAgY29uc3QgcmVuZGVyaW5nOiBhbnkgPSAocmVzdWx0IGFzIGFueSk/LnNldHRpbmdzPy5yZW5kZXJpbmc7XG4gICAgaWYgKHJlbmRlcmluZyAmJiByZW5kZXJpbmcuZWZmZWN0U2V0dGluZ3NQYXRoKSB7XG4gICAgICAgIHJlbmRlcmluZy5lZmZlY3RTZXR0aW5nc1BhdGggPSAnL3NjcmlwdGluZy9lbmdpbmUvZWZmZWN0LXNldHRpbmdzJztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIOaOoua1i+mihOiniCBzZXR0aW5ncyDmmK/lkKblt7Llj6/nlKjvvIjmoKHpqozpgJrov4flubblt7LlhpnlhaXnvJPlrZjvvInjgILkvpsgbGl2ZS1yZWxvYWQg5Zyo6LWE5rqQ5LqL5Lu25ZCO5Yik5a6a44CM6aaW5qyh5bCx57uq44CN44CCXG4gKiDov5Tlm54gdHJ1ZSDooajnpLrlj6/nlKjvvIjnvJPlrZjlt7LpooTng63vvInvvJvmnKrlsLHnu6rov5Tlm54gZmFsc2XvvJvlhbblroPpnZ7lsLHnu6rnsbvlvILluLjlkJHkuIrmipvlh7rjgIJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzUHJldmlld1NldHRpbmdzUmVhZHkoc3RhcnRTY2VuZSA9ICcnKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZ2V0Q2FjaGVkUHJldmlld1NldHRpbmdzKHN0YXJ0U2NlbmUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFByZXZpZXdOb3RSZWFkeUVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbn1cblxuLyoqXG4gKiDpobnnm67mnKrphY3nva7lkK/liqjlnLrmma/vvIjmiJbphY3nva7lt7LlpLHmlYjvvInml7bvvIzlm57pgIDliLDpobnnm67kuK3nmoTnrKzkuIDkuKrlnLrmma/otYTmupDjgIJcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURlZmF1bHRTdGFydFNjZW5lKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBhc3NldE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgICAgIGNvbnN0IHNjZW5lcyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mb3MoeyBjY1R5cGU6ICdjYy5TY2VuZUFzc2V0JyB9KTtcbiAgICAgICAgaWYgKHNjZW5lcyAmJiBzY2VuZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NlbmVzWzBdLnV1aWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKCdbUHJldmlldyBTZXJ2ZXJdIE5vIHNjZW5lIGFzc2V0IGZvdW5kIGluIHByb2plY3Q7IGxhdW5jaCBzY2VuZSB3aWxsIGJlIGVtcHR5LicpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tQcmV2aWV3IFNlcnZlcl0gRmFpbGVkIHRvIHJlc29sdmUgZGVmYXVsdCBzdGFydCBzY2VuZTonLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICog5riF56m66aKE6KeIIHNldHRpbmdzIOe8k+WtmOOAguiEmuacrOmHjee8luivkeaIlui1hOa6kOWPmOWMluWQjuiwg+eUqOOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZGF0ZVByZXZpZXdTZXR0aW5ncygpOiB2b2lkIHtcbiAgICBjYWNoZVZlcnNpb24rKztcbiAgICBjYWNoZS5jbGVhcigpO1xuICAgIHBlbmRpbmcuY2xlYXIoKTtcbn1cbiJdfQ==