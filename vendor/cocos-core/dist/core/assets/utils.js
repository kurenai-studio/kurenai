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
