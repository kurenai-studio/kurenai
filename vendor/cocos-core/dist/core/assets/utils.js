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
exports.PROMISE_STATE = exports.pathToDbUrlIfAssetDBPath = void 0;
exports.url2path = url2path;
exports.dirnameForDbUrlOrPath = dirnameForDbUrlOrPath;
exports.getCurrentLocalTime = getCurrentLocalTime;
exports.getMemorySize = getMemorySize;
exports.url2uuid = url2uuid;
exports.libArr2Obj = libArr2Obj;
exports.getExtendsFromCCType = getExtendsFromCCType;
exports.tranAssetInfo = tranAssetInfo;
exports.decidePromiseState = decidePromiseState;
exports.removeFile = removeFile;
exports.serializeCompiledWithInstance = serializeCompiledWithInstance;
exports.getRawInstanceFromImportFile = getRawInstanceFromImportFile;
exports.serializeCompiled = serializeCompiled;
exports.ensureOutputData = ensureOutputData;
const asset_db_1 = require("@cocos/asset-db");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const i18n_1 = __importDefault(require("../base/i18n"));
const utils_1 = __importDefault(require("../base/utils"));
const filesystem_1 = require("./manager/filesystem");
const missing_class_reporter_1 = require("../engine/editor-extends/missing-reporter/missing-class-reporter");
var asset_db_url_1 = require("./asset-db-url");
Object.defineProperty(exports, "pathToDbUrlIfAssetDBPath", { enumerable: true, get: function () { return asset_db_url_1.pathToDbUrlIfAssetDBPath; } });
function url2path(url) {
    if ((0, path_1.isAbsolute)(url)) {
        return url;
    }
    // 数据库地址转换
    if (url.startsWith('db://')) {
        return (0, asset_db_1.queryPath)(url);
    }
    return utils_1.default.Path.resolveToRaw(url);
}
function dirnameForDbUrlOrPath(pathOrUrlOrUUID) {
    if (!pathOrUrlOrUUID.startsWith('db://')) {
        return utils_1.default.Path.dirname(pathOrUrlOrUUID);
    }
    const root = /^db:\/\/[^/]+/.exec(pathOrUrlOrUUID)?.[0];
    if (!root || pathOrUrlOrUUID === root) {
        return pathOrUrlOrUUID;
    }
    const index = pathOrUrlOrUUID.lastIndexOf('/');
    return index <= root.length ? root : pathOrUrlOrUUID.slice(0, index);
}
/**
* 将时间戳转为可阅读的时间信息
*/
function getCurrentLocalTime() {
    const time = new Date();
    return time.toLocaleDateString().replace(/\//g, '-') + ' ' + time.toTimeString().slice(0, 5).replace(/:/g, '-');
}
/**
 * 获取当前内存占用
 */
function getMemorySize() {
    const memory = process.memoryUsage();
    function format(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + 'MB';
    }
    return 'Process: heapTotal ' + format(memory.heapTotal) + ' heapUsed ' + format(memory.heapUsed) + ' rss ' + format(memory.rss);
}
/**
 * 将 url 转成 uuid
 * @param url
 */
function url2uuid(url) {
    const subAssetName = [];
    let uuid = url;
    let wUUID = '';
    while (!(wUUID = (0, asset_db_1.queryUUID)(uuid)) && uuid !== 'db:/') {
        uuid = uuid.replace(/\/([^/]*)$/, (all, name) => {
            subAssetName.splice(0, 0, asset_db_1.Utils.nameToId(name));
            return '';
        });
    }
    if (wUUID) {
        const asset = (0, asset_db_1.queryAsset)(uuid);
        if (!asset || (asset.isDirectory() && subAssetName.length > 0)) {
            uuid = '';
        }
        else {
            uuid = asset.uuid;
            if (subAssetName.length > 0) {
                uuid += '@' + subAssetName.join('@');
            }
        }
    }
    else {
        uuid = '';
    }
    return uuid;
}
// 检查是否是扩展名的正则判断
const extnameRex = /^\./;
/**
 * 检查一个输入文件名是否是扩展名
 * @param extOrFile
 */
function isExtname(extOrFile) {
    return extOrFile === '' || extnameRex.test(extOrFile);
}
/**
 * assetDB 内 asset 资源自带的 library 是一个数组，需要转成对象
 * @param asset
 */
function libArr2Obj(asset) {
    const result = {};
    for (const extname of asset.meta.files) {
        if (isExtname(extname)) {
            result[extname] = asset.library + extname;
        }
        else {
            result[extname] = (0, path_1.resolve)(asset.library, extname);
        }
    }
    return result;
}
function getExtendsFromCCType(ccType) {
    if (!ccType || ccType === 'cc.Asset') {
        return [];
    }
    const assetClass = cc.js.getClassByName(ccType);
    if (!assetClass) {
        return [];
    }
    let superClass = cc.js.getSuper(assetClass);
    const extendClass = [];
    let superClassName = cc.js.getClassName(superClass);
    while (superClassName && (extendClass[extendClass.length - 1] !== 'cc.Asset')) {
        extendClass.push(superClassName);
        superClass = cc.js.getSuper(superClass);
        superClassName = cc.js.getClassName(superClass);
    }
    return extendClass;
}
// 整理出需要在删除资源后传播的主要信息
function tranAssetInfo(asset) {
    const info = {
        file: asset.source,
        uuid: asset.uuid,
        library: libArr2Obj(asset),
        importer: asset.meta.importer,
    };
    return info;
}
exports.PROMISE_STATE = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
};
function decidePromiseState(promise) {
    const t = { name: 'test' };
    return Promise.race([promise, t])
        .then(v => {
        return (v === t) ? exports.PROMISE_STATE.PENDING : exports.PROMISE_STATE.FULFILLED;
    })
        .catch(() => exports.PROMISE_STATE.REJECTED);
}
/**
 * 删除文件
 * @param file
 */
async function removeFile(file, options = {}) {
    return await (0, filesystem_1.removeAssetSource)(file, options);
}
// 默认的序列化选项
const defaultSerializeOptions = {
    compressUuid: true, // 是否是作为正式打包导出的序列化操作
    stringify: false, // 序列化出来的以 json 字符串形式还是 json 对象显示，这个要写死统一，否则对 json 做处理的时候都需要做类型判断
    dontStripDefault: false,
    useCCON: false,
    keepNodeUuid: false, // 序列化后是否保留节点组件的 uuid 数据
};
function serializeCompiledWithInstance(instance, options) {
    if (!instance) {
        return null;
    }
    // 重新反序列化并保存
    return serializeCompiled(instance, Object.assign(defaultSerializeOptions, {
        compressUuid: !options.debug,
        debug: options.debug,
        useCCON: options.useCCONB,
        noNativeDep: !instance._native, // 表明该资源是否存在原生依赖，这个字段在运行时会影响 preload 相关接口的表现
    }));
}
async function getRawInstanceFromImportFile(path, assetInfo) {
    const data = path.endsWith('.json') ? await (0, fs_extra_1.readJSON)(path) : await transformCCON(path);
    const result = {
        asset: null,
        detail: null,
    };
    const { deserialize } = await Promise.resolve().then(() => __importStar(require('cc')));
    const deserializeDetails = new deserialize.Details();
    // detail 里面的数组分别一一对应，并且指向 asset 依赖资源的对象，不可随意更改 / 排序
    deserializeDetails.reset();
    missing_class_reporter_1.MissingClass.hasMissingClass = false;
    const deserializedAsset = deserialize(data, deserializeDetails, {
        createAssetRefs: true,
        ignoreEditorOnly: true,
        classFinder: missing_class_reporter_1.MissingClass.classFinder,
    });
    if (!deserializedAsset) {
        console.error(i18n_1.default.t('builder.error.deserialize_failed', {
            url: `{asset(${assetInfo.url})}`,
        }));
        return result;
    }
    // reportMissingClass 会根据 _uuid 来做判断，需要在调用 reportMissingClass 之前赋值
    deserializedAsset._uuid = assetInfo.uuid;
    // if (MissingClass.hasMissingClass && !this.hasMissingClassUuids.has(asset.uuid)) {
    //     MissingClass.reportMissingClass(deserializedAsset);
    //     this.hasMissingClassUuids.add(asset.uuid);
    // }
    // 清空缓存，防止内存泄漏
    missing_class_reporter_1.MissingClass.reset();
    // 预览时只需找出依赖的资源，无需缓存 asset
    // 检查以及查找对应资源，并返回给对应 asset 数据
    // const missingAssets: string[] = [];
    // 根据这个方法分配假的资源对象, 确保序列化时资源能被重新序列化成 uuid
    // const test = this;
    // let missingAssetReporter: any = null;
    // deserializeDetails.assignAssetsBy(function(uuid: string, options: { owner: object; prop: string; type: Function }) {
    // const asset = test.getAsset(uuid);
    // if (asset) {
    //     return EditorExtends.serialize.asAsset(uuid);
    // } else {
    //     // if (!missingAssets.includes(uuid)) {
    //     //     missingAssets.push(uuid);
    //     // test.hasMissingAssetsUuids.add(uuid);
    //     if (options && options.owner) {
    //         missingAssetReporter = missingAssetReporter || new EditorExtends.MissingReporter.object(deserializedAsset);
    //         missingAssetReporter.outputLevel = 'warn';
    //         missingAssetReporter.stashByOwner(options.owner, options.prop, EditorExtends.serialize.asAsset(uuid, options.type));
    //     }
    //     // }
    //     // remove deleted asset reference
    //     return null;
    // }
    // });
    // if (missingAssetReporter) {
    //     missingAssetReporter.reportByOwner();
    // }
    // if (missingAssets.length > 0) {
    //     console.warn(
    //         i18n.t('builder.error.required_asset_missing', {
    //             url: `{asset(${asset.url})}`,
    //             uuid: missingAssets.join('\n '),
    //         }),
    //     );
    // }
    // https://github.com/cocos-creator/3d-tasks/issues/6042 处理 prefab 与 scene 名称同步问题
    // if (['cc.SceneAsset', 'cc.Prefab'].includes(Manager.assetManager.queryAssetProperty(asset, 'type'))) {
    //     deserializedAsset.name = basename(asset.source, extname(asset.source));
    // }
    result.asset = deserializedAsset;
    result.detail = deserializeDetails;
    // this.depend[asset.uuid] = [...new Set(deserializeDetails.uuidList)] as string[];
    return result;
}
async function transformCCON(path) {
    const buffer = await (0, fs_extra_1.readFile)(path);
    const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const { decodeCCONBinary } = await Promise.resolve().then(() => __importStar(require('cc/editor/serialization')));
    return decodeCCONBinary(bytes);
}
async function serializeCompiled(asset, options) {
    const outputData = ensureOutputData(asset);
    const result = await getRawInstanceFromImportFile(outputData.import.path, {
        uuid: asset.uuid,
        url: asset.url,
    });
    if (!result?.asset) {
        return null;
    }
    return serializeCompiledWithInstance(result.asset, options);
}
function ensureOutputData(asset) {
    // 3.8.3 以上版本，资源导入后的数据将会记录在 outputData 字段内部
    let outputData = asset.getData('output');
    if (outputData) {
        return outputData;
    }
    outputData = {
        import: {
            type: 'json',
            path: asset.library + '.json',
        },
    };
    let importPath;
    // 生成默认的 debug 版本导出数据
    const nativePath = {};
    asset.meta.files.forEach((extName) => {
        if (['.json', '.cconb'].includes(extName)) {
            outputData.import.path = asset.library + extName;
            if (extName === '.cconb') {
                outputData.import.type = 'buffer';
            }
            return;
        }
        // 旧规则，__ 开头的资源不在运行时使用
        if (extName.startsWith('.___')) {
            return;
        }
        nativePath[extName] = asset.library + extName;
    });
    if (Object.keys(nativePath).length) {
        outputData.native = nativePath;
    }
    asset.setData('output', outputData);
    return outputData;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlYiw0QkFVQztBQUVELHNEQVlDO0FBS0Qsa0RBR0M7QUFJRCxzQ0FNQztBQU1ELDRCQXdCQztBQWlCRCxnQ0FVQztBQUVELG9EQXFCQztBQUdELHNDQVFDO0FBUUQsZ0RBT0M7QUFNRCxnQ0FFQztBQVlELHNFQWlCQztBQUVELG9FQWlGQztBQVNELDhDQVVDO0FBRUQsNENBb0NDO0FBbFZELDhDQUEwSDtBQUMxSCwrQkFBMEQ7QUFDMUQsdUNBQThDO0FBRzlDLHdEQUFnQztBQUNoQywwREFBa0M7QUFHbEMscURBQXlEO0FBQ3pELDZHQUFnRztBQUNoRywrQ0FBMEQ7QUFBakQsd0hBQUEsd0JBQXdCLE9BQUE7QUFFakMsU0FBZ0IsUUFBUSxDQUFDLEdBQVc7SUFDaEMsSUFBSSxJQUFBLGlCQUFVLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNsQixPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFDRCxVQUFVO0lBQ1YsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDMUIsT0FBTyxJQUFBLG9CQUFTLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVELE9BQU8sZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQUVELFNBQWdCLHFCQUFxQixDQUFDLGVBQXVCO0lBQ3pELElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDdkMsT0FBTyxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQs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QUM7Z0JBQ3ZCLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsT0FBTztRQUNYLENBQUM7UUFFRCxzQkFBc0I7UUFDdEIsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDN0IsT0FBTztRQUNYLENBQUM7UUFDRCxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDakMsVUFBVSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUNELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sVUFBVSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQsIHF1ZXJ5VVVJRCwgVXRpbHMgYXMgZGJVdGlscywgcXVlcnlBc3NldCBhcyBkYlF1ZXJ5QXNzZXQsIHF1ZXJ5UGF0aCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBleHRuYW1lLCBpc0Fic29sdXRlLCBqb2luLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZSwgcmVhZEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgdHlwZSB7IEFzc2V0IGFzIENDQXNzZXQsIERldGFpbHMgfSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7IENDT04gfSBmcm9tICdjYy9lZGl0b3Ivc2VyaWFsaXphdGlvbic7XG5pbXBvcnQgaTE4biBmcm9tICcuLi9iYXNlL2kxOG4nO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IHsgSUFzc2V0LCBJRXhwb3J0RGF0YSwgSVNlcmlhbGl6ZWRPcHRpb25zLCBTZXJpYWxpemVkQXNzZXQgfSBmcm9tICcuL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB7IERlbGV0ZUFzc2V0T3B0aW9ucyB9IGZyb20gJy4vQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgeyByZW1vdmVBc3NldFNvdXJjZSB9IGZyb20gJy4vbWFuYWdlci9maWxlc3lzdGVtJztcbmltcG9ydCB7IE1pc3NpbmdDbGFzcyB9IGZyb20gJy4uL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9taXNzaW5nLXJlcG9ydGVyL21pc3NpbmctY2xhc3MtcmVwb3J0ZXInO1xuZXhwb3J0IHsgcGF0aFRvRGJVcmxJZkFzc2V0REJQYXRoIH0gZnJvbSAnLi9hc3NldC1kYi11cmwnO1xuXG5leHBvcnQgZnVuY3Rpb24gdXJsMnBhdGgodXJsOiBzdHJpbmcpIHtcbiAgICBpZiAoaXNBYnNvbHV0ZSh1cmwpKSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIC8vIOaVsOaNruW6k+WcsOWdgOi9rOaNolxuICAgIGlmICh1cmwuc3RhcnRzV2l0aCgnZGI6Ly8nKSkge1xuICAgICAgICByZXR1cm4gcXVlcnlQYXRoKHVybCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFV0aWxzLlBhdGgucmVzb2x2ZVRvUmF3KHVybCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXJuYW1lRm9yRGJVcmxPclBhdGgocGF0aE9yVXJsT3JVVUlEOiBzdHJpbmcpIHtcbiAgICBpZiAoIXBhdGhPclVybE9yVVVJRC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5QYXRoLmRpcm5hbWUocGF0aE9yVXJsT3JVVUlEKTtcbiAgICB9XG5cbiAgICBjb25zdCByb290ID0gL15kYjpcXC9cXC9bXi9dKy8uZXhlYyhwYXRoT3JVcmxPclVVSUQpPy5bMF07XG4gICAgaWYgKCFyb290IHx8IHBhdGhPclVybE9yVVVJRCA9PT0gcm9vdCkge1xuICAgICAgICByZXR1cm4gcGF0aE9yVXJsT3JVVUlEO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gcGF0aE9yVXJsT3JVVUlELmxhc3RJbmRleE9mKCcvJyk7XG4gICAgcmV0dXJuIGluZGV4IDw9IHJvb3QubGVuZ3RoID8gcm9vdCA6IHBhdGhPclVybE9yVVVJRC5zbGljZSgwLCBpbmRleCk7XG59XG5cbi8qKlxuKiDlsIbml7bpl7TmiLPovazkuLrlj6/pmIXor7vnmoTml7bpl7Tkv6Hmga9cbiovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudExvY2FsVGltZSgpIHtcbiAgICBjb25zdCB0aW1lID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4gdGltZS50b0xvY2FsZURhdGVTdHJpbmcoKS5yZXBsYWNlKC9cXC8vZywgJy0nKSArICcgJyArIHRpbWUudG9UaW1lU3RyaW5nKCkuc2xpY2UoMCwgNSkucmVwbGFjZSgvOi9nLCAnLScpO1xufVxuLyoqXG4gKiDojrflj5blvZPliY3lhoXlrZjljaDnlKhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE1lbW9yeVNpemUoKSB7XG4gICAgY29uc3QgbWVtb3J5ID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpO1xuICAgIGZ1bmN0aW9uIGZvcm1hdChieXRlczogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiAoYnl0ZXMgLyAxMDI0IC8gMTAyNCkudG9GaXhlZCgyKSArICdNQic7XG4gICAgfVxuICAgIHJldHVybiAnUHJvY2VzczogaGVhcFRvdGFsICcgKyBmb3JtYXQobWVtb3J5LmhlYXBUb3RhbCkgKyAnIGhlYXBVc2VkICcgKyBmb3JtYXQobWVtb3J5LmhlYXBVc2VkKSArICcgcnNzICcgKyBmb3JtYXQobWVtb3J5LnJzcyk7XG59XG5cbi8qKlxuICog5bCGIHVybCDovazmiJAgdXVpZFxuICogQHBhcmFtIHVybCBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVybDJ1dWlkKHVybDogc3RyaW5nKSB7XG4gICAgY29uc3Qgc3ViQXNzZXROYW1lOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCB1dWlkID0gdXJsO1xuICAgIGxldCB3VVVJRCA9ICcnO1xuICAgIHdoaWxlICghKHdVVUlEID0gcXVlcnlVVUlEKHV1aWQpKSAmJiB1dWlkICE9PSAnZGI6LycpIHtcbiAgICAgICAgdXVpZCA9IHV1aWQucmVwbGFjZSgvXFwvKFteL10qKSQvLCAoYWxsOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgc3ViQXNzZXROYW1lLnNwbGljZSgwLCAwLCBkYlV0aWxzLm5hbWVUb0lkKG5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh3VVVJRCkge1xuICAgICAgICBjb25zdCBhc3NldCA9IGRiUXVlcnlBc3NldCh1dWlkKTtcbiAgICAgICAgaWYgKCFhc3NldCB8fCAoYXNzZXQuaXNEaXJlY3RvcnkoKSAmJiBzdWJBc3NldE5hbWUubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgIHV1aWQgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV1aWQgPSBhc3NldC51dWlkO1xuICAgICAgICAgICAgaWYgKHN1YkFzc2V0TmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdXVpZCArPSAnQCcgKyBzdWJBc3NldE5hbWUuam9pbignQCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXVpZCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gdXVpZDtcbn1cblxuLy8g5qOA5p+l5piv5ZCm5piv5omp5bGV5ZCN55qE5q2j5YiZ5Yik5patXG5jb25zdCBleHRuYW1lUmV4ID0gL15cXC4vO1xuXG4vKipcbiAqIOajgOafpeS4gOS4qui+k+WFpeaWh+S7tuWQjeaYr+WQpuaYr+aJqeWxleWQjVxuICogQHBhcmFtIGV4dE9yRmlsZVxuICovXG5mdW5jdGlvbiBpc0V4dG5hbWUoZXh0T3JGaWxlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZXh0T3JGaWxlID09PSAnJyB8fCBleHRuYW1lUmV4LnRlc3QoZXh0T3JGaWxlKTtcbn1cblxuLyoqXG4gKiBhc3NldERCIOWGhSBhc3NldCDotYTmupDoh6rluKbnmoQgbGlicmFyeSDmmK/kuIDkuKrmlbDnu4TvvIzpnIDopoHovazmiJDlr7nosaFcbiAqIEBwYXJhbSBhc3NldFxuICovXG5leHBvcnQgZnVuY3Rpb24gbGliQXJyMk9iaihhc3NldDogSUFzc2V0KSB7XG4gICAgY29uc3QgcmVzdWx0OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG4gICAgZm9yIChjb25zdCBleHRuYW1lIG9mIGFzc2V0Lm1ldGEuZmlsZXMpIHtcbiAgICAgICAgaWYgKGlzRXh0bmFtZShleHRuYW1lKSkge1xuICAgICAgICAgICAgcmVzdWx0W2V4dG5hbWVdID0gYXNzZXQubGlicmFyeSArIGV4dG5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRbZXh0bmFtZV0gPSByZXNvbHZlKGFzc2V0LmxpYnJhcnksIGV4dG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbmRzRnJvbUNDVHlwZShjY1R5cGU6IHN0cmluZykge1xuICAgIGlmICghY2NUeXBlIHx8IGNjVHlwZSA9PT0gJ2NjLkFzc2V0Jykge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNjVHlwZSk7XG4gICAgaWYgKCFhc3NldENsYXNzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBsZXQgc3VwZXJDbGFzcyA9IGNjLmpzLmdldFN1cGVyKGFzc2V0Q2xhc3MpO1xuICAgIGNvbnN0IGV4dGVuZENsYXNzID0gW107XG4gICAgbGV0IHN1cGVyQ2xhc3NOYW1lID0gY2MuanMuZ2V0Q2xhc3NOYW1lKHN1cGVyQ2xhc3MpO1xuXG4gICAgd2hpbGUgKHN1cGVyQ2xhc3NOYW1lICYmIChleHRlbmRDbGFzc1tleHRlbmRDbGFzcy5sZW5ndGggLSAxXSAhPT0gJ2NjLkFzc2V0JykpIHtcbiAgICAgICAgZXh0ZW5kQ2xhc3MucHVzaChzdXBlckNsYXNzTmFtZSk7XG4gICAgICAgIHN1cGVyQ2xhc3MgPSBjYy5qcy5nZXRTdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgc3VwZXJDbGFzc05hbWUgPSBjYy5qcy5nZXRDbGFzc05hbWUoc3VwZXJDbGFzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4dGVuZENsYXNzO1xufVxuXG4vLyDmlbTnkIblh7rpnIDopoHlnKjliKDpmaTotYTmupDlkI7kvKDmkq3nmoTkuLvopoHkv6Hmga9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuQXNzZXRJbmZvKGFzc2V0OiBBc3NldCB8IFZpcnR1YWxBc3NldCkge1xuICAgIGNvbnN0IGluZm8gPSB7XG4gICAgICAgIGZpbGU6IGFzc2V0LnNvdXJjZSxcbiAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgbGlicmFyeTogbGliQXJyMk9iaihhc3NldCksXG4gICAgICAgIGltcG9ydGVyOiBhc3NldC5tZXRhLmltcG9ydGVyLFxuICAgIH07XG4gICAgcmV0dXJuIGluZm87XG59XG5cbmV4cG9ydCBjb25zdCBQUk9NSVNFX1NUQVRFID0ge1xuICAgIFBFTkRJTkc6ICdwZW5kaW5nJyxcbiAgICBGVUxGSUxMRUQ6ICdmdWxmaWxsZWQnLFxuICAgIFJFSkVDVEVEOiAncmVqZWN0ZWQnLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY2lkZVByb21pc2VTdGF0ZShwcm9taXNlOiBQcm9taXNlPGFueT4pIHtcbiAgICBjb25zdCB0ID0geyBuYW1lOiAndGVzdCcgfTtcbiAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCB0XSlcbiAgICAgICAgLnRoZW4odiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKHYgPT09IHQpID8gUFJPTUlTRV9TVEFURS5QRU5ESU5HIDogUFJPTUlTRV9TVEFURS5GVUxGSUxMRUQ7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoKSA9PiBQUk9NSVNFX1NUQVRFLlJFSkVDVEVEKTtcbn1cblxuLyoqXG4gKiDliKDpmaTmlofku7ZcbiAqIEBwYXJhbSBmaWxlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGU6IHN0cmluZywgb3B0aW9uczogRGVsZXRlQXNzZXRPcHRpb25zID0ge30pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gYXdhaXQgcmVtb3ZlQXNzZXRTb3VyY2UoZmlsZSwgb3B0aW9ucyk7XG59XG5cblxuLy8g6buY6K6k55qE5bqP5YiX5YyW6YCJ6aG5XG5jb25zdCBkZWZhdWx0U2VyaWFsaXplT3B0aW9ucyA9IHtcbiAgICBjb21wcmVzc1V1aWQ6IHRydWUsIC8vIOaYr+WQpuaYr+S9nOS4uuato+W8j+aJk+WMheWvvOWHuueahOW6j+WIl+WMluaTjeS9nFxuICAgIHN0cmluZ2lmeTogZmFsc2UsIC8vIOW6j+WIl+WMluWHuuadpeeahOS7pSBqc29uIOWtl+espuS4suW9ouW8j+i/mOaYryBqc29uIOWvueixoeaYvuekuu+8jOi/meS4quimgeWGmeatu+e7n+S4gO+8jOWQpuWImeWvuSBqc29uIOWBmuWkhOeQhueahOaXtuWAmemDvemcgOimgeWBmuexu+Wei+WIpOaWrVxuICAgIGRvbnRTdHJpcERlZmF1bHQ6IGZhbHNlLFxuICAgIHVzZUNDT046IGZhbHNlLFxuICAgIGtlZXBOb2RlVXVpZDogZmFsc2UsIC8vIOW6j+WIl+WMluWQjuaYr+WQpuS/neeVmeiKgueCuee7hOS7tueahCB1dWlkIOaVsOaNrlxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUNvbXBpbGVkV2l0aEluc3RhbmNlKGluc3RhbmNlOiBhbnksIG9wdGlvbnM6IElTZXJpYWxpemVkT3B0aW9ucyAmIHtcbiAgICB1c2VDQ09OQj86IGJvb2xlYW47XG4gICAgdXNlQ0NPTj86IGJvb2xlYW47XG59KTogU2VyaWFsaXplZEFzc2V0IHwgbnVsbCB7XG4gICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLy8g6YeN5paw5Y+N5bqP5YiX5YyW5bm25L+d5a2YXG4gICAgcmV0dXJuIHNlcmlhbGl6ZUNvbXBpbGVkKFxuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0U2VyaWFsaXplT3B0aW9ucywge1xuICAgICAgICAgICAgY29tcHJlc3NVdWlkOiAhb3B0aW9ucy5kZWJ1ZyxcbiAgICAgICAgICAgIGRlYnVnOiBvcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgdXNlQ0NPTjogb3B0aW9ucy51c2VDQ09OQixcbiAgICAgICAgICAgIG5vTmF0aXZlRGVwOiAhaW5zdGFuY2UuX25hdGl2ZSwgLy8g6KGo5piO6K+l6LWE5rqQ5piv5ZCm5a2Y5Zyo5Y6f55Sf5L6d6LWW77yM6L+Z5Liq5a2X5q615Zyo6L+Q6KGM5pe25Lya5b2x5ZONIHByZWxvYWQg55u45YWz5o6l5Y+j55qE6KGo546wXG4gICAgICAgIH0pLFxuICAgICkgYXMgKHN0cmluZyB8IENDT04gfCBvYmplY3QpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UmF3SW5zdGFuY2VGcm9tSW1wb3J0RmlsZShwYXRoOiBzdHJpbmcsIGFzc2V0SW5mbzogeyB1dWlkOiBzdHJpbmcsIHVybDogc3RyaW5nIH0pIHtcbiAgICBjb25zdCBkYXRhID0gcGF0aC5lbmRzV2l0aCgnLmpzb24nKSA/IGF3YWl0IHJlYWRKU09OKHBhdGgpIDogYXdhaXQgdHJhbnNmb3JtQ0NPTihwYXRoISk7XG4gICAgY29uc3QgcmVzdWx0OiB7XG4gICAgICAgIGFzc2V0OiBDQ0Fzc2V0IHwgbnVsbDtcbiAgICAgICAgZGV0YWlsOiBEZXRhaWxzIHwgbnVsbDtcbiAgICB9ID0ge1xuICAgICAgICBhc3NldDogbnVsbCxcbiAgICAgICAgZGV0YWlsOiBudWxsLFxuICAgIH07XG4gICAgY29uc3QgeyBkZXNlcmlhbGl6ZSB9ID0gYXdhaXQgaW1wb3J0KCdjYycpO1xuICAgIGNvbnN0IGRlc2VyaWFsaXplRGV0YWlscyA9IG5ldyBkZXNlcmlhbGl6ZS5EZXRhaWxzKCk7XG4gICAgLy8gZGV0YWlsIOmHjOmdoueahOaVsOe7hOWIhuWIq+S4gOS4gOWvueW6lO+8jOW5tuS4lOaMh+WQkSBhc3NldCDkvp3otZbotYTmupDnmoTlr7nosaHvvIzkuI3lj6/pmo/mhI/mm7TmlLkgLyDmjpLluo9cbiAgICBkZXNlcmlhbGl6ZURldGFpbHMucmVzZXQoKTtcbiAgICBNaXNzaW5nQ2xhc3MuaGFzTWlzc2luZ0NsYXNzID0gZmFsc2U7XG4gICAgY29uc3QgZGVzZXJpYWxpemVkQXNzZXQgPSBkZXNlcmlhbGl6ZShkYXRhLCBkZXNlcmlhbGl6ZURldGFpbHMsIHtcbiAgICAgICAgY3JlYXRlQXNzZXRSZWZzOiB0cnVlLFxuICAgICAgICBpZ25vcmVFZGl0b3JPbmx5OiB0cnVlLFxuICAgICAgICBjbGFzc0ZpbmRlcjogTWlzc2luZ0NsYXNzLmNsYXNzRmluZGVyLFxuICAgIH0pIGFzIENDQXNzZXQ7XG4gICAgaWYgKCFkZXNlcmlhbGl6ZWRBc3NldCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgaTE4bi50KCdidWlsZGVyLmVycm9yLmRlc2VyaWFsaXplX2ZhaWxlZCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6IGB7YXNzZXQoJHthc3NldEluZm8udXJsfSl9YCxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvLyByZXBvcnRNaXNzaW5nQ2xhc3Mg5Lya5qC55o2uIF91dWlkIOadpeWBmuWIpOaWre+8jOmcgOimgeWcqOiwg+eUqCByZXBvcnRNaXNzaW5nQ2xhc3Mg5LmL5YmN6LWL5YC8XG4gICAgZGVzZXJpYWxpemVkQXNzZXQuX3V1aWQgPSBhc3NldEluZm8udXVpZDtcblxuICAgIC8vIGlmIChNaXNzaW5nQ2xhc3MuaGFzTWlzc2luZ0NsYXNzICYmICF0aGlzLmhhc01pc3NpbmdDbGFzc1V1aWRzLmhhcyhhc3NldC51dWlkKSkge1xuICAgIC8vICAgICBNaXNzaW5nQ2xhc3MucmVwb3J0TWlzc2luZ0NsYXNzKGRlc2VyaWFsaXplZEFzc2V0KTtcbiAgICAvLyAgICAgdGhpcy5oYXNNaXNzaW5nQ2xhc3NVdWlkcy5hZGQoYXNzZXQudXVpZCk7XG4gICAgLy8gfVxuICAgIC8vIOa4heepuue8k+WtmO+8jOmYsuatouWGheWtmOazhOa8j1xuICAgIE1pc3NpbmdDbGFzcy5yZXNldCgpO1xuICAgIC8vIOmihOiniOaXtuWPqumcgOaJvuWHuuS+nei1lueahOi1hOa6kO+8jOaXoOmcgOe8k+WtmCBhc3NldFxuICAgIC8vIOajgOafpeS7peWPiuafpeaJvuWvueW6lOi1hOa6kO+8jOW5tui/lOWbnue7meWvueW6lCBhc3NldCDmlbDmja5cbiAgICAvLyBjb25zdCBtaXNzaW5nQXNzZXRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIC8vIOagueaNrui/meS4quaWueazleWIhumFjeWBh+eahOi1hOa6kOWvueixoSwg56Gu5L+d5bqP5YiX5YyW5pe26LWE5rqQ6IO96KKr6YeN5paw5bqP5YiX5YyW5oiQIHV1aWRcbiAgICAvLyBjb25zdCB0ZXN0ID0gdGhpcztcbiAgICAvLyBsZXQgbWlzc2luZ0Fzc2V0UmVwb3J0ZXI6IGFueSA9IG51bGw7XG4gICAgLy8gZGVzZXJpYWxpemVEZXRhaWxzLmFzc2lnbkFzc2V0c0J5KGZ1bmN0aW9uKHV1aWQ6IHN0cmluZywgb3B0aW9uczogeyBvd25lcjogb2JqZWN0OyBwcm9wOiBzdHJpbmc7IHR5cGU6IEZ1bmN0aW9uIH0pIHtcbiAgICAvLyBjb25zdCBhc3NldCA9IHRlc3QuZ2V0QXNzZXQodXVpZCk7XG4gICAgLy8gaWYgKGFzc2V0KSB7XG4gICAgLy8gICAgIHJldHVybiBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZS5hc0Fzc2V0KHV1aWQpO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICAgIC8vIGlmICghbWlzc2luZ0Fzc2V0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgIC8vICAgICAvLyAgICAgbWlzc2luZ0Fzc2V0cy5wdXNoKHV1aWQpO1xuICAgIC8vICAgICAvLyB0ZXN0Lmhhc01pc3NpbmdBc3NldHNVdWlkcy5hZGQodXVpZCk7XG4gICAgLy8gICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMub3duZXIpIHtcbiAgICAvLyAgICAgICAgIG1pc3NpbmdBc3NldFJlcG9ydGVyID0gbWlzc2luZ0Fzc2V0UmVwb3J0ZXIgfHwgbmV3IEVkaXRvckV4dGVuZHMuTWlzc2luZ1JlcG9ydGVyLm9iamVjdChkZXNlcmlhbGl6ZWRBc3NldCk7XG4gICAgLy8gICAgICAgICBtaXNzaW5nQXNzZXRSZXBvcnRlci5vdXRwdXRMZXZlbCA9ICd3YXJuJztcbiAgICAvLyAgICAgICAgIG1pc3NpbmdBc3NldFJlcG9ydGVyLnN0YXNoQnlPd25lcihvcHRpb25zLm93bmVyLCBvcHRpb25zLnByb3AsIEVkaXRvckV4dGVuZHMuc2VyaWFsaXplLmFzQXNzZXQodXVpZCwgb3B0aW9ucy50eXBlKSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgLy8gfVxuICAgIC8vICAgICAvLyByZW1vdmUgZGVsZXRlZCBhc3NldCByZWZlcmVuY2VcbiAgICAvLyAgICAgcmV0dXJuIG51bGw7XG4gICAgLy8gfVxuICAgIC8vIH0pO1xuICAgIC8vIGlmIChtaXNzaW5nQXNzZXRSZXBvcnRlcikge1xuICAgIC8vICAgICBtaXNzaW5nQXNzZXRSZXBvcnRlci5yZXBvcnRCeU93bmVyKCk7XG4gICAgLy8gfVxuICAgIC8vIGlmIChtaXNzaW5nQXNzZXRzLmxlbmd0aCA+IDApIHtcbiAgICAvLyAgICAgY29uc29sZS53YXJuKFxuICAgIC8vICAgICAgICAgaTE4bi50KCdidWlsZGVyLmVycm9yLnJlcXVpcmVkX2Fzc2V0X21pc3NpbmcnLCB7XG4gICAgLy8gICAgICAgICAgICAgdXJsOiBge2Fzc2V0KCR7YXNzZXQudXJsfSl9YCxcbiAgICAvLyAgICAgICAgICAgICB1dWlkOiBtaXNzaW5nQXNzZXRzLmpvaW4oJ1xcbiAnKSxcbiAgICAvLyAgICAgICAgIH0pLFxuICAgIC8vICAgICApO1xuICAgIC8vIH1cblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy1jcmVhdG9yLzNkLXRhc2tzL2lzc3Vlcy82MDQyIOWkhOeQhiBwcmVmYWIg5LiOIHNjZW5lIOWQjeensOWQjOatpemXrumimFxuICAgIC8vIGlmIChbJ2NjLlNjZW5lQXNzZXQnLCAnY2MuUHJlZmFiJ10uaW5jbHVkZXMoTWFuYWdlci5hc3NldE1hbmFnZXIucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAndHlwZScpKSkge1xuICAgIC8vICAgICBkZXNlcmlhbGl6ZWRBc3NldC5uYW1lID0gYmFzZW5hbWUoYXNzZXQuc291cmNlLCBleHRuYW1lKGFzc2V0LnNvdXJjZSkpO1xuICAgIC8vIH1cblxuICAgIHJlc3VsdC5hc3NldCA9IGRlc2VyaWFsaXplZEFzc2V0O1xuICAgIHJlc3VsdC5kZXRhaWwgPSBkZXNlcmlhbGl6ZURldGFpbHM7XG4gICAgLy8gdGhpcy5kZXBlbmRbYXNzZXQudXVpZF0gPSBbLi4ubmV3IFNldChkZXNlcmlhbGl6ZURldGFpbHMudXVpZExpc3QpXSBhcyBzdHJpbmdbXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1DQ09OKHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHJlYWRGaWxlKHBhdGgpO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLmJ1ZmZlciwgYnVmZmVyLmJ5dGVPZmZzZXQsIGJ1ZmZlci5ieXRlTGVuZ3RoKTtcbiAgICBjb25zdCB7IGRlY29kZUNDT05CaW5hcnkgfSA9IGF3YWl0IGltcG9ydCgnY2MvZWRpdG9yL3NlcmlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gZGVjb2RlQ0NPTkJpbmFyeShieXRlcyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJpYWxpemVDb21waWxlZChhc3NldDogSUFzc2V0LCBvcHRpb25zOiBJU2VyaWFsaXplZE9wdGlvbnMpIHtcbiAgICBjb25zdCBvdXRwdXREYXRhID0gZW5zdXJlT3V0cHV0RGF0YShhc3NldCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZ2V0UmF3SW5zdGFuY2VGcm9tSW1wb3J0RmlsZShvdXRwdXREYXRhLmltcG9ydCEucGF0aCwge1xuICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICB9KTtcbiAgICBpZiAoIXJlc3VsdD8uYXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBzZXJpYWxpemVDb21waWxlZFdpdGhJbnN0YW5jZShyZXN1bHQuYXNzZXQsIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlT3V0cHV0RGF0YShhc3NldDogSUFzc2V0KSB7XG4gICAgLy8gMy44LjMg5Lul5LiK54mI5pys77yM6LWE5rqQ5a+85YWl5ZCO55qE5pWw5o2u5bCG5Lya6K6w5b2V5ZyoIG91dHB1dERhdGEg5a2X5q615YaF6YOoXG4gICAgbGV0IG91dHB1dERhdGE6IElFeHBvcnREYXRhID0gYXNzZXQuZ2V0RGF0YSgnb3V0cHV0Jyk7XG4gICAgaWYgKG91dHB1dERhdGEpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dERhdGE7XG4gICAgfVxuICAgIG91dHB1dERhdGEgPSB7XG4gICAgICAgIGltcG9ydDoge1xuICAgICAgICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgcGF0aDogYXNzZXQubGlicmFyeSArICcuanNvbicsXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICBsZXQgaW1wb3J0UGF0aDogc3RyaW5nO1xuICAgIC8vIOeUn+aIkOm7mOiupOeahCBkZWJ1ZyDniYjmnKzlr7zlh7rmlbDmja5cbiAgICBjb25zdCBuYXRpdmVQYXRoOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgYXNzZXQubWV0YS5maWxlcy5mb3JFYWNoKChleHROYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKFsnLmpzb24nLCAnLmNjb25iJ10uaW5jbHVkZXMoZXh0TmFtZSkpIHtcbiAgICAgICAgICAgIG91dHB1dERhdGEuaW1wb3J0LnBhdGggPSBhc3NldC5saWJyYXJ5ICsgZXh0TmFtZTtcbiAgICAgICAgICAgIGlmIChleHROYW1lID09PSAnLmNjb25iJykge1xuICAgICAgICAgICAgICAgIG91dHB1dERhdGEuaW1wb3J0LnR5cGUgPSAnYnVmZmVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaXp+inhOWIme+8jF9fIOW8gOWktOeahOi1hOa6kOS4jeWcqOi/kOihjOaXtuS9v+eUqFxuICAgICAgICBpZiAoZXh0TmFtZS5zdGFydHNXaXRoKCcuX19fJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBuYXRpdmVQYXRoW2V4dE5hbWVdID0gYXNzZXQubGlicmFyeSArIGV4dE5hbWU7XG4gICAgfSk7XG5cbiAgICBpZiAoT2JqZWN0LmtleXMobmF0aXZlUGF0aCkubGVuZ3RoKSB7XG4gICAgICAgIG91dHB1dERhdGEubmF0aXZlID0gbmF0aXZlUGF0aDtcbiAgICB9XG4gICAgYXNzZXQuc2V0RGF0YSgnb3V0cHV0Jywgb3V0cHV0RGF0YSk7XG4gICAgcmV0dXJuIG91dHB1dERhdGE7XG59XG4iXX0=