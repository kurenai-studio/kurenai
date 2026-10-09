"use strict";
// 实现序列化的场景解析逻辑
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
exports.Parser = void 0;
exports.default = serialize;
const cc_1 = require("cc");
const cc = __importStar(require("cc"));
const utils_1 = __importDefault(require("../../../../base/utils"));
// @ts-ignore
const populate_internal_constants_1 = require("cc/editor/populate-internal-constants");
const builder_1 = __importDefault(require("./compiled/builder"));
const dynamic_builder_1 = __importDefault(require("./dynamic-builder"));
const { PersistentMask, DontSave, DontDestroy, EditorOnly } = cc_1.CCObject.Flags;
const getDefault = cc_1.CCClass.getDefault;
const Attr = cc_1.CCClass.Attr;
const EDITOR_ONLY = Attr.DELIMETER + 'editorOnly';
const DEFAULT = Attr.DELIMETER + 'default';
const FORMERLY_SERIALIZED_AS = Attr.DELIMETER + 'formerlySerializedAs';
function equalsToDefault(def, value) {
    if (typeof def === 'function') {
        try {
            def = def();
        }
        catch (e) {
            return false;
        }
    }
    if (def === value) {
        return true;
    }
    if (def && value &&
        typeof def === 'object' && typeof value === 'object' &&
        def.constructor === value.constructor) {
        if (def instanceof cc_1.ValueType) {
            if (def.equals(value)) {
                return true;
            }
        }
        else if (Array.isArray(def)) {
            return def.length === 0 && value.length === 0;
        }
        else if (def.constructor === Object) {
            return cc_1.js.isEmptyObject(def) && cc_1.js.isEmptyObject(value);
        }
    }
    return false;
}
function isSerializableClass(obj, ctor) {
    if (!ctor) {
        return false;
    }
    return cc_1.CCClass.isCCClassOrFastDefined(ctor) && !!cc_1.js.getClassId(obj, false);
}
// 是否是PrefabInstance中的节点
function isSyncPrefab(node) {
    // 1. 在PrefabInstance下的非Mounted节点
    // 2. 如果Mounted节点是一个PrefabInstance，那它也是一个syncPrefab
    // @ts-ignore member-access
    return node?._prefab?.root?._prefab?.instance && (node?._prefab?.instance || !isMountedChild(node));
}
// 用于检测当前节点是否是一个PrefabInstance中的Mounted的节点，后面可以考虑优化一下
function isMountedChild(node) {
    return !!node[cc_1.editorExtrasTag]?.mountedRoot;
}
class Parser {
    exporting;
    mustCompresseUuid;
    discardInvalid;
    dontStripDefault;
    missingClassReporter;
    missingObjectReporter;
    reserveContentsForAllSyncablePrefab;
    keepNodeUuid;
    recordAssetDepends;
    builder;
    root;
    prefabRoot;
    assetExists;
    // 为所有对象创建并缓存 IObjParsingInfo，同时防止循环引用
    parsingInfos = new Map();
    customExportingCtxCache;
    _serializationContext;
    assetDepends;
    constructor(builder, options) {
        options = options || {};
        this.exporting = !!options._exporting;
        this.mustCompresseUuid = !!options.compressUuid;
        this.discardInvalid = 'discardInvalid' in options ? !!options.discardInvalid : true;
        this.dontStripDefault = !this.exporting || ('dontStripDefault' in options ? !!options.dontStripDefault : true);
        this.missingClassReporter = options.missingClassReporter;
        this.missingObjectReporter = options.missingObjectReporter;
        this.reserveContentsForAllSyncablePrefab = !!options.reserveContentsForSyncablePrefab;
        const customArguments = {};
        customArguments[cc.Node.reserveContentsForAllSyncablePrefabTag] = this.reserveContentsForAllSyncablePrefab;
        this._serializationContext = {
            root: null,
            toCCON: options.useCCON ?? false,
            customArguments,
        };
        this.builder = builder;
        this.keepNodeUuid = !!options.keepNodeUuid;
        this.assetExists = this.missingObjectReporter && Object.create(null);
        this.customExportingCtxCache = this.exporting ? {
            _depends: [],
            dependsOn(propName, uuid) {
                if (this._compressUuid) {
                    uuid = utils_1.default.UUID.compressUUID(uuid, true);
                }
                this._depends.push(propName, uuid);
            },
            _compressUuid: this.mustCompresseUuid,
        } : null;
        if (options.recordAssetDepends) {
            this.recordAssetDepends = options.recordAssetDepends;
            this.assetDepends = new Set();
        }
    }
    parse(obj) {
        this.root = obj;
        if (obj instanceof cc.Prefab) {
            this.prefabRoot = obj.data;
            this._serializationContext.root = obj.data;
        }
        else {
            this._serializationContext.root = obj;
        }
        const rootInfo = this.parseObjField(null, null, '', obj, null);
        this.builder.setRoot(rootInfo);
        // if (obj && typeof obj === 'object' && isSerializableClass(obj, obj.constructor)) {
        // }
        // else {
        //     throw new Error(`Unknown object to serialize: ${obj}`);
        // }
        if (this.recordAssetDepends) {
            this.recordAssetDepends.push(...this.assetDepends);
        }
    }
    checkMissingAsset(asset, uuid) {
        if (this.missingObjectReporter) {
            const exists = this.assetExists[uuid];
            // TODO 这里需要判断一下 db 是否存在对应的资源
            if (!exists) {
                this.missingObjectReporter(asset);
            }
        }
    }
    // 校验是否需要序列化
    isObjRemoved(val) {
        if (val instanceof cc_1.CCObject) {
            // validate obj flags
            const objFlags = val.objFlags;
            if (this.exporting && ((objFlags & EditorOnly) ||
                (populate_internal_constants_1.SERVER_MODE))) {
                return true;
            }
            if (objFlags & DontSave) {
                if (this.discardInvalid) {
                    return true;
                }
                else {
                    // live reloading
                    if (objFlags & DontDestroy) {
                        // 目前编辑器下的 DontSave 节点往往是常驻节点（DontDestroy），这类节点不需要序列化，因为本身就不需要重新创建。
                        return true;
                    }
                }
            }
        }
        return false;
    }
    setParsedObj(ownerInfo, key, val, formerlySerializedAs) {
        if (val && typeof val === 'object') {
            let parsingInfo = this.parsingInfos.get(val);
            if (!parsingInfo && val instanceof cc_1.Asset && this.root instanceof cc_1.Asset) {
                // Double check uuids to guarantee same-uuid (with main asset loaded from DB) objects that created unexpectedly to use direct reference (non-uuid format).
                // This way, even if the uuid changes when copying, there is no fear of missing-uuid.
                if (val._uuid && val._uuid === this.root._uuid) {
                    parsingInfo = this.parsingInfos.get(this.root);
                }
            }
            if (parsingInfo) {
                this.builder.setProperty_ParsedObject(ownerInfo, key, parsingInfo, formerlySerializedAs);
                return true;
            }
        }
        return false;
    }
    // 转换为需要序列化的值
    verifyNotParsedValue(owner, key, val) {
        const type = typeof val;
        if (type === 'object') {
            if (!val) {
                return null;
            }
            if (val instanceof cc_1.CCObject) {
                if (val instanceof cc_1.Asset) {
                    const uuid = val._uuid;
                    if (uuid) {
                        this.checkMissingAsset(val, uuid);
                        return val;
                    }
                    else {
                        // 没有 uuid 的 asset 即程序创建的资源，比如一些内建的程序创建的 material，
                        // 或者是序列化的主资源，但是主资源应该已经在 setParsedObj 处理了。
                        return null;
                    }
                }
                if (this.discardInvalid) {
                    if (!val.isValid) {
                        this.missingObjectReporter?.(val);
                        return null;
                    }
                }
                else {
                    // live reloading
                    // @ts-ignore
                    if (!val.isRealValid) {
                        return null;
                    }
                }
                // validate prefab
                if (cc_1.Node && cc_1.Node.isNode(val)) {
                    // @ts-ignore member-access
                    const willBeDiscard = this.canDiscardByPrefabRoot(val) && val !== val._prefab.root;
                    if (willBeDiscard) {
                        return null;
                    }
                }
                // validate component in prefab
                if (val instanceof cc_1.Component) {
                    // component without mountedRoot info will be discard
                    const willBeDiscard = val.node && this.canDiscardByPrefabRoot(val.node) && !val[cc_1.editorExtrasTag]?.mountedRoot;
                    if (willBeDiscard) {
                        return null;
                    }
                }
            }
            return val;
        }
        else if (type !== 'function') {
            if (owner instanceof cc_1.CCObject && key === '_objFlags' && val > 0) {
                return val & PersistentMask;
            }
            return val;
        }
        else /* function*/ {
            return null;
        }
    }
    // @ts-ignore
    canDiscardByPrefabRoot(node) {
        return !(this.reserveContentsForAllSyncablePrefab || !isSyncPrefab(node) || this.prefabRoot === node);
    }
    enumerateClass(owner, ownerInfo, ccclass, customProps) {
        const attrs = Attr.getClassAttrs(ccclass);
        const props = customProps || ccclass.__values__;
        for (let p = 0; p < props.length; p++) {
            const propName = props[p];
            let val = owner[propName];
            if (this.isObjRemoved(val)) {
                continue;
            }
            if (this.exporting) {
                if (attrs[propName + EDITOR_ONLY]) {
                    // skip editor only when exporting
                    continue;
                }
                // 这里不用考虑对 PrefabInfo 的剔除，这一块在编辑器中的反序列化时已经实现了
                // var isPrefabInfo = CCNode && CCNode.isNode(obj) && propName === '_prefab';
                // if (isPrefabInfo && !isSyncPrefab(obj)) {
                //     // don't export prefab info in runtime
                //     continue;
                // }
            }
            const formerlySerializedAs = attrs[propName + FORMERLY_SERIALIZED_AS];
            if (this.setParsedObj(ownerInfo, propName, val, formerlySerializedAs)) {
                continue;
            }
            val = this.verifyNotParsedValue(owner, propName, val);
            const defaultValue = getDefault(attrs[propName + DEFAULT]);
            if (this.exporting && !this.dontStripDefault && equalsToDefault(defaultValue, val)) {
                continue;
            }
            this.parseField(owner, ownerInfo, propName, val, { formerlySerializedAs, defaultValue });
        }
        if ((cc_1.Node && owner instanceof cc_1.Node) || (cc_1.Component && owner instanceof cc_1.Component)) {
            if (this.exporting) {
                if (!this.keepNodeUuid) {
                    // @ts-ignore member-access
                    const usedInPersistRoot = (owner instanceof cc_1.Node && owner._parent instanceof cc.Scene);
                    if (!usedInPersistRoot) {
                        return;
                    }
                }
                if (this.prefabRoot) {
                    return;
                }
                // @ts-ignore member-access
                if (!this.dontStripDefault && !owner._id) {
                    return;
                }
            }
            // @ts-ignore member-access
            this.builder.setProperty_Raw(owner, ownerInfo, '_id', owner._id);
        }
    }
    // 重置 TRS 中的缩放
    // private setTrsOfSyncablePrefabRoot (obj: CCNode) {
    //     const trs = obj._trs.slice();
    //     trs[7] = trs[8] = trs[9] = 1; // reset scale.xyz
    //     if (!Parser.isDefaultTrs(trs)) {
    //         this.builder.setProperty_TypedArray(obj, '_trs', trs);
    //     }
    // }
    static isDefaultTrs(trs) {
        return trs[0] === 0 && trs[1] === 0 && trs[2] === 0 && // position.xyz
            trs[3] === 0 && trs[4] === 0 && trs[5] === 0 && trs[6] === 1 && // quat.xyzw
            trs[7] === 1 && trs[8] === 1 && trs[9] === 1; // scale.xyz
    }
    parseField(owner, ownerInfo, key, val, options) {
        const type = typeof val;
        if (type === 'object') {
            if (!val) {
                this.builder.setProperty_Raw(owner, ownerInfo, key, null, options);
                return;
            }
            if (val instanceof cc_1.Asset) {
                if (owner) {
                    let uuid = val._uuid;
                    if (this.mustCompresseUuid) {
                        uuid = utils_1.default.UUID.compressUUID(uuid, true);
                    }
                    options = options || {};
                    options.expectedType = cc_1.js.getClassId(val.constructor);
                    this.builder.setProperty_AssetUuid(owner, ownerInfo, key, uuid, options);
                    this.assetDepends?.add(uuid);
                    return;
                }
                else {
                    // continue to serialize main asset
                }
            }
            this.parseObjField(owner, ownerInfo, key, val, options);
        }
        else if (type !== 'function') {
            this.builder.setProperty_Raw(owner, ownerInfo, key, val, options);
        }
        else /* function*/ {
            this.builder.setProperty_Raw(owner, ownerInfo, key, null, options);
        }
    }
    parseObjField(owner, ownerInfo, key, val, options) {
        const ctor = val.constructor;
        if (isSerializableClass(val, ctor)) {
            const defaultSerialize = (valueInfo) => {
                let props = ctor.__values__;
                if (val._onBeforeSerialize) {
                    props = val._onBeforeSerialize(props) || props;
                }
                // DEBUG: Assert MissingScript __values__ for issue 9878
                try {
                    if (ctor === cc_1.cclegacy._MissingScript && (props.length === 0 || props[props.length - 1] !== '_$erialized')) {
                        cc.error(`The '_$erialized' prop in '${val.name}' is missing. Will force the raw data to be read.`);
                        cc.error(`    Error props: ['${props}'], raw props: ['${ctor.__values__}']. Please contact jare.`);
                        props.push('_$erialized');
                    }
                }
                catch (e) {
                    cc.warn(`Error when checking MissingScript 3, ${e}`);
                }
                if (props.length === 0) {
                    return;
                }
                if (props[props.length - 1] !== '_$erialized') {
                    this.enumerateClass(val, valueInfo, ctor, props);
                    return;
                }
                // DEBUG: Assert MissingScript data for issue 9878
                try {
                    if (!val._$erialized) {
                        cc.error(`The formerly serialized data is not found from '${val.name}'. Please check the previous error report.`);
                        return;
                    }
                }
                catch (e) {
                    cc.warn(`Error when checking MissingScript 2, ${e}`);
                }
                // 直接写入之前序列化过的数据，用于脚本丢失的情况
                const serialized = val._$erialized;
                const type = serialized.__type__;
                // If is missing script proxy, serialized as original data
                this.enumerateDict(serialized, valueInfo);
                // report warning
                if (this.missingClassReporter) {
                    this.missingClassReporter(val, type);
                }
            };
            const serializeNormalClass = () => {
                const opt = (options || {});
                const type = val._$erialized
                    ? val._$erialized.__type__
                    : cc.js.getClassId(ctor, false);
                opt.type = type;
                opt.uniquelyReferenced = cc.getSerializationMetadata(ctor)?.uniquelyReferenced;
                const valueInfo = this.builder.setProperty_Class(owner, ownerInfo, key, opt);
                this.parsingInfos.set(val, valueInfo);
                if (!val[cc.serializeTag]) {
                    defaultSerialize(valueInfo);
                    return valueInfo;
                }
                // DEBUG: Check MissingScript object for issue 9878
                try {
                    if (val instanceof cc_1.cclegacy._MissingScript) {
                        cc.error('Should not declare CustomSerializable on MissingScript. Please contact jare.');
                        defaultSerialize(valueInfo);
                        return valueInfo;
                    }
                }
                catch (e) {
                    cc.warn(`Error when checking MissingScript 1, ${e}`);
                }
                const serializationOutput = {
                    writeProperty: (propertyName, propertyValue) => {
                        if (this.isObjRemoved(propertyValue)) {
                            return;
                        }
                        else if (this.setParsedObj(valueInfo, propertyName, propertyValue, null)) {
                            return;
                        }
                        else {
                            // TODO: verifyNotParsedValue
                        }
                        this.parseField(val, valueInfo, propertyName, propertyValue, {});
                    },
                    writeThis: () => {
                        return defaultSerialize(valueInfo);
                    },
                    writeSuper: () => {
                        const superClass = cc_1.js.getSuper(ctor);
                        if (!superClass) {
                            return;
                        }
                        const superProperties = superClass.__values__;
                        if (!superProperties) {
                            return;
                        }
                        this.enumerateClass(val, valueInfo, ctor, superProperties);
                    },
                };
                val[cc.serializeTag](serializationOutput, this._serializationContext);
                return valueInfo;
            };
            if (val instanceof cc_1.ValueType) {
                const valueInfo = this.builder.setProperty_ValueType(owner, ownerInfo, key, val, options);
                // 不支持多个地方引用同一个 ValueType
                if (valueInfo) {
                    return valueInfo;
                }
            }
            // DEBUG: Check MissingScript object for issue 9878
            try {
                if (val instanceof cc_1.cclegacy._MissingScript && val._serialize) {
                    cc.error('Should not declare _serialize on MissingScript. Please contact jare.');
                    val._serialize = undefined;
                }
            }
            catch (e) {
                cc.warn(`Error when checking MissingScript 0, ${e}`);
            }
            if (!val._serialize) {
                return serializeNormalClass();
            }
            else {
                const opt = (options || {});
                opt.content = val._serialize(this.customExportingCtxCache);
                opt.type = cc.js.getClassId(ctor, false);
                const valueInfo = this.builder.setProperty_CustomizedClass(owner, ownerInfo, key, opt);
                this.parsingInfos.set(val, valueInfo);
                if (this.customExportingCtxCache) {
                    const depends = this.customExportingCtxCache._depends;
                    for (let i = 0; i < depends.length; i += 2) {
                        this.builder.setProperty_AssetUuid(val, valueInfo, depends[i], depends[i + 1], null);
                        this.assetDepends?.add(depends[i + 1]);
                    }
                    // reset customExportingCtxCache
                    depends.length = 0;
                }
                return valueInfo;
            }
        }
        else if (ArrayBuffer.isView(val)) {
            if (cc_1.Node && cc_1.Node.isNode(owner) && key === '_trs' && Parser.isDefaultTrs(val)) {
                return null;
            }
            this.builder.setProperty_TypedArray(owner, ownerInfo, key, val, options);
            // 不考虑直接序列化 TypedArray 的情况
            // 不考虑多个地方引用同一个 TypedArray
            return null;
        }
        else if (ctor && ctor !== Object && !Array.isArray(val)) {
            if (!owner) {
                throw new Error(`Unknown object to serialize: ${val}`);
            }
            // ts interface 类型的接口类，对应 c++ 的 struct，struct 被绑定后并不是 plain object
            // 因此，这里优先判断是否是 JSB 绑定对象
            if (ctor.__isJSB) {
                const valueInfo = this.builder.setProperty_Dict(owner, ownerInfo, key, options);
                this.parsingInfos.set(val, valueInfo);
                this.enumerateBindedDict(val, valueInfo);
                return valueInfo;
            }
            // Not serializable object type, such as Set/Map..., etc.
            // Use default value rather than null.
            return null;
        }
        else {
            // check circular reference for primitive objects ([], {}, etc...)
            // 对于原生 JS 类型，只做循环引用的保护，
            // 并不保证同个对象的多处引用反序列化后仍然指向同一个对象。
            // 如果有此需求，应该继承自FObject
            // var circularReferenced = this.parsingObjs.includes(val);
            // if (circularReferenced) {
            //     this.builder.markAsSharedObj(val);
            // }
            if (Array.isArray(val)) {
                const filteredArray = val.filter((x) => !this.isObjRemoved(x));
                const opt = (options || {});
                opt.writeOnlyArray = filteredArray;
                const valueInfo = this.builder.setProperty_Array(owner, ownerInfo, key, opt);
                this.parsingInfos.set(val, valueInfo);
                // enumerateArray
                for (let i = 0; i < filteredArray.length; ++i) {
                    let element = filteredArray[i];
                    if (this.setParsedObj(valueInfo, i, element, null)) {
                        continue;
                    }
                    element = this.verifyNotParsedValue(val, i, element);
                    this.parseField(val, valueInfo, i, element, null);
                }
                return valueInfo;
            }
            else {
                const valueInfo = this.builder.setProperty_Dict(owner, ownerInfo, key, options);
                this.parsingInfos.set(val, valueInfo);
                this.enumerateDict(val, valueInfo);
                return valueInfo;
            }
        }
    }
    enumerateDict(obj, objInfo) {
        for (const key in obj) {
            // eslint-disable-next-line no-prototype-builtins
            if ((obj.hasOwnProperty && !obj.hasOwnProperty(key)) ||
                (key.charCodeAt(0) === 95 && key.charCodeAt(1) === 95) // starts with __
                    && key !== '__prefab') {
                continue;
            }
            let val = obj[key];
            if (this.isObjRemoved(val)) {
                val = null;
            }
            else if (this.setParsedObj(objInfo, key, val, null)) {
                continue;
            }
            else {
                val = this.verifyNotParsedValue(obj, key, val);
            }
            this.parseField(obj, objInfo, key, val, null);
        }
    }
    enumerateBindedDict(obj, objInfo) {
        for (const key in obj) {
            // 不能用 hasOwnProperty 来判断，因为 JSB 对象的属性在 prototype 上面
            if ((key.charCodeAt(0) === 95 && key.charCodeAt(1) === 95) // starts with __
                && key !== '__prefab') {
                continue;
            }
            let val = obj[key];
            if (typeof val === 'function') {
                continue;
            }
            if (this.isObjRemoved(val)) {
                val = null;
            }
            else if (this.setParsedObj(objInfo, key, val, null)) {
                continue;
            }
            else {
                val = this.verifyNotParsedValue(obj, key, val);
            }
            this.parseField(obj, objInfo, key, val, null);
        }
    }
}
exports.Parser = Parser;
function serialize(obj, options) {
    options = options || {};
    let builder;
    if (options.builder === 'compiled') {
        options._exporting = true;
        options.useCCON = false;
        builder = new builder_1.default(options);
    }
    else {
        builder = new dynamic_builder_1.default(options);
    }
    const parser = new Parser(builder, options);
    parser.parse(obj);
    obj = null;
    return builder.dump();
}
