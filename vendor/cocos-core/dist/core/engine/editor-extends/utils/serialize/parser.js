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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvZW5naW5lL2VkaXRvci1leHRlbmRzL3V0aWxzL3NlcmlhbGl6ZS9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLGVBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW90QmYsNEJBa0JDO0FBcHVCRCwyQkFXWTtBQUNaLHVDQUF5QjtBQUN6QixtRUFBMkM7QUFDM0MsYUFBYTtBQUNiLHVGQUFvRTtBQUVwRSxpRUFBaUQ7QUFDakQsd0VBQStDO0FBTy9DLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsR0FBRyxhQUFRLENBQUMsS0FBSyxDQUFDO0FBRTdFLE1BQU0sVUFBVSxHQUFHLFlBQU8sQ0FBQyxVQUFVLENBQUM7QUFzRHRDLE1BQU0sSUFBSSxHQUFHLFlBQU8sQ0FBQyxJQUFJLENBQUM7QUFDMUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUM7QUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDM0MsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLHNCQUFzQixDQUFDO0FBRXZFLFNBQVMsZUFBZSxDQUFDLEdBQVEsRUFBRSxLQUFVO0lBQ3pDLElBQUksT0FBTyxHQUFHLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDO1lBQ0QsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1AsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztJQUNMLENBQUM7SUFDRCxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztRQUNoQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsSUFBSSxHQUFHLElBQUksS0FBSztRQUNaLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO1FBQ3BELEdBQUcsQ0FBQyxXQUFXLEtBQUssS0FBSyxDQUFDLFdBQVcsRUFDdkMsQ0FBQztRQUNDLElBQUksR0FBRyxZQUFZLGNBQVMsRUFBRSxDQUFDO1lBQzNCLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1FBQ0wsQ0FBQzthQUNJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzFCLE9BQU8sR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQzthQUNJLElBQUksR0FBRyxDQUFDLFdBQVcsS0FBSyxNQUFNLEVBQUUsQ0FBQztZQUNsQyxPQUFPLE9BQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksT0FBRSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1RCxDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxJQUFTO0lBQy9DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNSLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxPQUFPLFlBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDL0UsQ0FBQztBQUVELHdCQUF3QjtBQUN4QixTQUFTLFlBQVksQ0FBQyxJQUFZO0lBQzlCLGlDQUFpQztJQUNqQyxtREFBbUQ7SUFDbkQsMkJBQTJCO0lBQzNCLE9BQU8sSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDeEcsQ0FBQztBQUVELHFEQUFxRDtBQUNyRCxTQUFTLGNBQWMsQ0FBQyxJQUFZO0lBQ2hDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBZSxDQUFDLEVBQUUsV0FBVyxDQUFDO0FBQ2hELENBQUM7QUFFRCxNQUFhLE1BQU07SUFDZixTQUFTLENBQVU7SUFDbkIsaUJBQWlCLENBQVU7SUFDM0IsY0FBYyxDQUFVO0lBQ3hCLGdCQUFnQixDQUFVO0lBQzFCLG9CQUFvQixDQUFNO0lBQzFCLHFCQUFxQixDQUFNO0lBQzNCLG1DQUFtQyxDQUFVO0lBQzdDLFlBQVksQ0FBVTtJQUN0QixrQkFBa0IsQ0FBdUM7SUFFakQsT0FBTyxDQUFVO0lBQ2pCLElBQUksQ0FBcUI7SUFDekIsVUFBVSxDQUFxQjtJQUMvQixXQUFXLENBQTBCO0lBQzdDLHNDQUFzQztJQUM5QixZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7SUFFbEQsdUJBQXVCLENBQU07SUFDN0IscUJBQXFCLENBQTBCO0lBQy9DLFlBQVksQ0FBZTtJQUVuQyxZQUFZLE9BQWdCLEVBQUUsT0FBdUI7UUFDakQsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUN0QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7UUFDaEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxnQkFBZ0IsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDcEYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0csSUFBSSxDQUFDLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztRQUN6RCxJQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDO1FBQzNELElBQUksQ0FBQyxtQ0FBbUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQ3RGLE1BQU0sZUFBZSxHQUErQyxFQUFFLENBQUM7UUFDdkUsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0NBQTZDLENBQUMsR0FBRyxJQUFJLENBQUMsbUNBQW1DLENBQUM7UUFDbEgsSUFBSSxDQUFDLHFCQUFxQixHQUFHO1lBQ3pCLElBQUksRUFBRSxJQUFJO1lBQ1YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLElBQUksS0FBSztZQUNoQyxlQUFlO1NBQ2xCLENBQUM7UUFFRixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO1FBQzNDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzVDLFFBQVEsRUFBRSxFQUFjO1lBQ3hCLFNBQVMsQ0FBQyxRQUFnQixFQUFFLElBQVk7Z0JBQ3BDLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNyQixJQUFJLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2dCQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0QsYUFBYSxFQUFFLElBQUksQ0FBQyxpQkFBaUI7U0FDeEMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRVQsSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDO1lBQ3JELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUMxQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFXO1FBQ2IsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxHQUFHLFlBQVksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUMzQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDL0MsQ0FBQzthQUNJLENBQUM7WUFDRixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IscUZBQXFGO1FBQ3JGLElBQUk7UUFDSixTQUFTO1FBQ1QsOERBQThEO1FBQzlELElBQUk7UUFFSixJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBYSxDQUFDLENBQUM7UUFDeEQsQ0FBQztJQUNMLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxLQUFjLEVBQUUsSUFBWTtRQUNsRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsNkJBQTZCO1lBQzdCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDVixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRUQsWUFBWTtJQUNKLFlBQVksQ0FBQyxHQUFRO1FBQ3pCLElBQUksR0FBRyxZQUFZLGFBQVEsRUFBRSxDQUFDO1lBQzFCLHFCQUFxQjtZQUNyQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO1lBQzlCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUNsQixDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7Z0JBQ3ZCLENBQUMseUNBQVcsQ0FBQyxDQUNoQixFQUFFLENBQUM7Z0JBQ0EsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksUUFBUSxHQUFHLFFBQVEsRUFBRSxDQUFDO2dCQUN0QixJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDdEIsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7cUJBQ0ksQ0FBQztvQkFDRixpQkFBaUI7b0JBQ2pCLElBQUksUUFBUSxHQUFHLFdBQVcsRUFBRSxDQUFDO3dCQUN6QixtRUFBbUU7d0JBQ25FLE9BQU8sSUFBSSxDQUFDO29CQUNoQixDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFTyxZQUFZLENBQUMsU0FBMEIsRUFBRSxHQUFvQixFQUFFLEdBQVEsRUFBRSxvQkFBbUM7UUFDaEgsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDakMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLFdBQVcsSUFBSSxHQUFHLFlBQVksVUFBTyxJQUFJLElBQUksQ0FBQyxJQUFJLFlBQVksVUFBTyxFQUFFLENBQUM7Z0JBQ3pFLDBKQUEwSjtnQkFDMUoscUZBQXFGO2dCQUNyRixJQUFJLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM3QyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuRCxDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dCQUN6RixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxhQUFhO0lBQ0wsb0JBQW9CLENBQUMsS0FBVSxFQUFFLEdBQW9CLEVBQUUsR0FBUTtRQUNuRSxNQUFNLElBQUksR0FBRyxPQUFPLEdBQUcsQ0FBQztRQUN4QixJQUFJLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksR0FBRyxZQUFZLGFBQVEsRUFBRSxDQUFDO2dCQUMxQixJQUFJLEdBQUcsWUFBWSxVQUFPLEVBQUUsQ0FBQztvQkFDekIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztvQkFDdkIsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDUCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNsQyxPQUFPLEdBQUcsQ0FBQztvQkFDZixDQUFDO3lCQUNJLENBQUM7d0JBQ0Ysa0RBQWtEO3dCQUNsRCwwQ0FBMEM7d0JBQzFDLE9BQU8sSUFBSSxDQUFDO29CQUNoQixDQUFDO2dCQUNMLENBQUM7Z0JBRUQsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2YsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2xDLE9BQU8sSUFBSSxDQUFDO29CQUNoQixDQUFDO2dCQUNMLENBQUM7cUJBQ0ksQ0FBQztvQkFDRixpQkFBaUI7b0JBQ2pCLGFBQWE7b0JBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDbkIsT0FBTyxJQUFJLENBQUM7b0JBQ2hCLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxrQkFBa0I7Z0JBQ2xCLElBQUksU0FBTSxJQUFJLFNBQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsMkJBQTJCO29CQUMzQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO29CQUNuRixJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNoQixPQUFPLElBQUksQ0FBQztvQkFDaEIsQ0FBQztnQkFDTCxDQUFDO2dCQUVELCtCQUErQjtnQkFDL0IsSUFBSSxHQUFHLFlBQVksY0FBVyxFQUFFLENBQUM7b0JBQzdCLHFEQUFxRDtvQkFDckQsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLG9CQUFlLENBQUMsRUFBRSxXQUFXLENBQUM7b0JBQzlHLElBQUksYUFBYSxFQUFFLENBQUM7d0JBQ2hCLE9BQU8sSUFBSSxDQUFDO29CQUNoQixDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDO2FBQ0ksSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDM0IsSUFBSSxLQUFLLFlBQVksYUFBUSxJQUFJLEdBQUcsS0FBSyxXQUFXLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5RCxPQUFPLEdBQUcsR0FBRyxjQUFjLENBQUM7WUFDaEMsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ2YsQ0FBQzthQUNJLGFBQWEsQ0FBQyxDQUFDO1lBQ2hCLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBRUQsYUFBYTtJQUNMLHNCQUFzQixDQUFDLElBQVk7UUFDdkMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDMUcsQ0FBQztJQUVPLGNBQWMsQ0FBQyxLQUFVLEVBQUUsU0FBMEIsRUFBRSxPQUFtQixFQUFFLFdBQXNCO1FBQ3RHLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsTUFBTSxLQUFLLEdBQUcsV0FBVyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDaEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNwQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN6QixTQUFTO1lBQ2IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNqQixJQUFJLEtBQUssQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsa0NBQWtDO29CQUNsQyxTQUFTO2dCQUNiLENBQUM7Z0JBQ0QsNkNBQTZDO2dCQUM3Qyw2RUFBNkU7Z0JBQzdFLDRDQUE0QztnQkFDNUMsNkNBQTZDO2dCQUM3QyxnQkFBZ0I7Z0JBQ2hCLElBQUk7WUFDUixDQUFDO1lBRUQsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsUUFBUSxHQUFHLHNCQUFzQixDQUFDLENBQUM7WUFDdEUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztnQkFDcEUsU0FBUztZQUNiLENBQUM7WUFFRCxHQUFHLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdEQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUUzRCxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksZUFBZSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNqRixTQUFTO1lBQ2IsQ0FBQztZQUVELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQU0sSUFBSSxLQUFLLFlBQVksU0FBTSxDQUFDLElBQUksQ0FBQyxjQUFXLElBQUksS0FBSyxZQUFZLGNBQVcsQ0FBQyxFQUFFLENBQUM7WUFDdkYsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3JCLDJCQUEyQjtvQkFDM0IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLEtBQUssWUFBWSxTQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sWUFBWSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUNyQixPQUFPO29CQUNYLENBQUM7Z0JBQ0wsQ0FBQztnQkFDRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDbEIsT0FBTztnQkFDWCxDQUFDO2dCQUNELDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDdkMsT0FBTztnQkFDWCxDQUFDO1lBQ0wsQ0FBQztZQUVELDJCQUEyQjtZQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckUsQ0FBQztJQUNMLENBQUM7SUFFRCxjQUFjO0lBQ2QscURBQXFEO0lBQ3JELG9DQUFvQztJQUNwQyx1REFBdUQ7SUFDdkQsdUNBQXVDO0lBQ3ZDLGlFQUFpRTtJQUNqRSxRQUFRO0lBQ1IsSUFBSTtJQUVKLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBUTtRQUN4QixPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLGVBQWU7WUFDbEUsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxZQUFZO1lBQzVFLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsWUFBWTtJQUNsRSxDQUFDO0lBRU8sVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUEwQixFQUFFLEdBQW9CLEVBQUUsR0FBUSxFQUFFLE9BQXdCO1FBQ2xILE1BQU0sSUFBSSxHQUFHLE9BQU8sR0FBRyxDQUFDO1FBQ3hCLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ25FLE9BQU87WUFDWCxDQUFDO1lBQ0QsSUFBSSxHQUFHLFlBQVksVUFBTyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1IsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztvQkFDckIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDekIsSUFBSSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztvQkFDRCxPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztvQkFDeEIsT0FBTyxDQUFDLFlBQVksR0FBRyxPQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3pFLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM3QixPQUFPO2dCQUNYLENBQUM7cUJBQ0ksQ0FBQztvQkFDRixtQ0FBbUM7Z0JBQ3ZDLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUQsQ0FBQzthQUNJLElBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0RSxDQUFDO2FBQ0ksYUFBYSxDQUFDLENBQUM7WUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7SUFDTCxDQUFDO0lBVU8sYUFBYSxDQUFDLEtBQW9CLEVBQUUsU0FBaUMsRUFBRSxHQUFvQixFQUFFLEdBQVEsRUFBRSxPQUF3QjtRQUNuSSxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDO1FBQzdCLElBQUksbUJBQW1CLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDakMsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFNBQTBCLEVBQUUsRUFBRTtnQkFDcEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDNUIsSUFBSSxHQUFHLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDekIsS0FBSyxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUM7Z0JBQ25ELENBQUM7Z0JBRUQsd0RBQXdEO2dCQUN4RCxJQUFJLENBQUM7b0JBQ0QsSUFBSSxJQUFJLEtBQUssYUFBUSxDQUFDLGNBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLGFBQWEsQ0FBQyxFQUFFLENBQUM7d0JBQ3hHLEVBQUUsQ0FBQyxLQUFLLENBQUMsOEJBQThCLEdBQUcsQ0FBQyxJQUFJLG1EQUFtRCxDQUFDLENBQUM7d0JBQ3BHLEVBQUUsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEtBQUssb0JBQW9CLElBQUksQ0FBQyxVQUFVLDBCQUEwQixDQUFDLENBQUM7d0JBQ25HLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQzlCLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULEVBQUUsQ0FBQyxJQUFJLENBQUMsd0NBQXdDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELENBQUM7Z0JBRUQsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNyQixPQUFPO2dCQUNYLENBQUM7Z0JBRUQsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxhQUFhLEVBQUUsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDakQsT0FBTztnQkFDWCxDQUFDO2dCQUVELGtEQUFrRDtnQkFDbEQsSUFBSSxDQUFDO29CQUNELElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ25CLEVBQUUsQ0FBQyxLQUFLLENBQUMsbURBQW1ELEdBQUcsQ0FBQyxJQUFJLDRDQUE0QyxDQUFDLENBQUM7d0JBQ2xILE9BQU87b0JBQ1gsQ0FBQztnQkFDTCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsRUFBRSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFFRCwwQkFBMEI7Z0JBQzFCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUM7Z0JBQ25DLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQ2pDLDBEQUEwRDtnQkFDMUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRTFDLGlCQUFpQjtnQkFDakIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUVGLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxFQUFFO2dCQUM5QixNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQWtCLENBQUM7Z0JBQzdDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxXQUFXO29CQUN4QixDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRO29CQUMxQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDaEIsR0FBRyxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxrQkFBa0IsQ0FBQztnQkFFL0UsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDN0UsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUV0QyxJQUFJLENBQUUsR0FBc0MsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztvQkFDNUQsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLE9BQU8sU0FBUyxDQUFDO2dCQUNyQixDQUFDO2dCQUVELG1EQUFtRDtnQkFDbkQsSUFBSSxDQUFDO29CQUNELElBQUksR0FBRyxZQUFZLGFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDekMsRUFBRSxDQUFDLEtBQUssQ0FBQyw4RUFBOEUsQ0FBQyxDQUFDO3dCQUN6RixnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDNUIsT0FBTyxTQUFTLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULEVBQUUsQ0FBQyxJQUFJLENBQUMsd0NBQXdDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELENBQUM7Z0JBRUQsTUFBTSxtQkFBbUIsR0FBMkI7b0JBQ2hELGFBQWEsRUFBRSxDQUFDLFlBQW9CLEVBQUUsYUFBc0IsRUFBRSxFQUFFO3dCQUM1RCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQzs0QkFDbkMsT0FBTzt3QkFDWCxDQUFDOzZCQUFNLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUN6RSxPQUFPO3dCQUNYLENBQUM7NkJBQU0sQ0FBQzs0QkFDSiw2QkFBNkI7d0JBQ2pDLENBQUM7d0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3JFLENBQUM7b0JBQ0QsU0FBUyxFQUFFLEdBQUcsRUFBRTt3QkFDWixPQUFPLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN2QyxDQUFDO29CQUNELFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2IsTUFBTSxVQUFVLEdBQUcsT0FBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDckMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDOzRCQUNkLE9BQU87d0JBQ1gsQ0FBQzt3QkFDRCxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsVUFBa0MsQ0FBQzt3QkFDdEUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDOzRCQUNuQixPQUFPO3dCQUNYLENBQUM7d0JBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDL0QsQ0FBQztpQkFDSixDQUFDO2dCQUNELEdBQTZCLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNqRyxPQUFPLFNBQVMsQ0FBQztZQUNyQixDQUFDLENBQUM7WUFFRixJQUFJLEdBQUcsWUFBWSxjQUFTLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzFGLHlCQUF5QjtnQkFDekIsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDWixPQUFPLFNBQVMsQ0FBQztnQkFDckIsQ0FBQztZQUNMLENBQUM7WUFFRCxtREFBbUQ7WUFDbkQsSUFBSSxDQUFDO2dCQUNELElBQUksR0FBRyxZQUFZLGFBQVEsQ0FBQyxjQUFjLElBQUksR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUMzRCxFQUFFLENBQUMsS0FBSyxDQUFDLHNFQUFzRSxDQUFDLENBQUM7b0JBQ2pGLEdBQUcsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1QsRUFBRSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxvQkFBb0IsRUFBRSxDQUFDO1lBQ2xDLENBQUM7aUJBQU0sQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQXdCLENBQUM7Z0JBQ25ELEdBQUcsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDM0QsR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFdEMsSUFBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQztvQkFDdEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUN6QyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ3JGLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztvQkFDRCxnQ0FBZ0M7b0JBQ2hDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2dCQUNELE9BQU8sU0FBUyxDQUFDO1lBQ3JCLENBQUM7UUFDTCxDQUFDO2FBQ0ksSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDL0IsSUFBSSxTQUFNLElBQUksU0FBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDL0UsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsS0FBTSxFQUFFLFNBQVUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLDBCQUEwQjtZQUMxQiwwQkFBMEI7WUFDMUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQzthQUNJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUVELGtFQUFrRTtZQUNsRSx3QkFBd0I7WUFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6QyxPQUFPLFNBQVMsQ0FBQztZQUNyQixDQUFDO1lBRUQseURBQXlEO1lBQ3pELHNDQUFzQztZQUN0QyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO2FBQ0ksQ0FBQztZQUNGLGtFQUFrRTtZQUNsRSx3QkFBd0I7WUFDeEIsK0JBQStCO1lBQy9CLHNCQUFzQjtZQUN0QiwyREFBMkQ7WUFDM0QsNEJBQTRCO1lBQzVCLHlDQUF5QztZQUN6QyxJQUFJO1lBQ0osSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQWtCLENBQUM7Z0JBQzdDLEdBQUcsQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO2dCQUNuQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3RDLGlCQUFpQjtnQkFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDNUMsSUFBSSxPQUFPLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDakQsU0FBUztvQkFDYixDQUFDO29CQUNELE9BQU8sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDckQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RELENBQUM7Z0JBQ0QsT0FBTyxTQUFTLENBQUM7WUFDckIsQ0FBQztpQkFDSSxDQUFDO2dCQUNGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLE9BQU8sU0FBUyxDQUFDO1lBQ3JCLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVPLGFBQWEsQ0FBQyxHQUFRLEVBQUUsT0FBd0I7UUFDcEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNwQixpREFBaUQ7WUFDakQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsaUJBQWlCO3VCQUNyRSxHQUFHLEtBQUssVUFBVSxFQUN2QixDQUFDO2dCQUNDLFNBQVM7WUFDYixDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN6QixHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ2YsQ0FBQztpQkFDSSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbEQsU0FBUztZQUNiLENBQUM7aUJBQ0ksQ0FBQztnQkFDRixHQUFHLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xELENBQUM7SUFDTCxDQUFDO0lBRU8sbUJBQW1CLENBQUMsR0FBUSxFQUFFLE9BQXdCO1FBQzFELEtBQUssTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7WUFDcEIsb0RBQW9EO1lBRXBELElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQjttQkFDckUsR0FBRyxLQUFLLFVBQVUsRUFDdkIsQ0FBQztnQkFDQyxTQUFTO1lBQ2IsQ0FBQztZQUNELElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLE9BQU8sR0FBRyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUM1QixTQUFTO1lBQ2IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN6QixHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ2YsQ0FBQztpQkFDSSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbEQsU0FBUztZQUNiLENBQUM7aUJBQ0ksQ0FBQztnQkFDRixHQUFHLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xELENBQUM7SUFDTCxDQUFDO0NBQ0o7QUF0a0JELHdCQXNrQkM7QUFHRCxTQUF3QixTQUFTLENBQUMsR0FBbUMsRUFBRSxPQUFpQjtJQUNwRixPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUV4QixJQUFJLE9BQWdCLENBQUM7SUFDckIsSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQzFCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxJQUFJLGlCQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztTQUNJLENBQUM7UUFDRixPQUFPLEdBQUcsSUFBSSx5QkFBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDNUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQixHQUFHLEdBQUcsSUFBSSxDQUFDO0lBRVgsT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8g5a6e546w5bqP5YiX5YyW55qE5Zy65pmv6Kej5p6Q6YC76L6RXG5cbmltcG9ydCB7XG4gICAgQ0NPYmplY3QsXG4gICAgQXNzZXQgYXMgQ0NBc3NldCxcbiAgICBOb2RlIGFzIENDTm9kZSxcbiAgICBDb21wb25lbnQgYXMgQ0NDb21wb25lbnQsXG4gICAgVmFsdWVUeXBlLFxuICAgIGRlc2VyaWFsaXplLFxuICAgIENDQ2xhc3MsXG4gICAganMsXG4gICAgZWRpdG9yRXh0cmFzVGFnLFxuICAgIGNjbGVnYWN5LFxufSBmcm9tICdjYyc7XG5pbXBvcnQgKiBhcyBjYyBmcm9tICdjYyc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vYmFzZS91dGlscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgeyBTRVJWRVJfTU9ERSB9IGZyb20gJ2NjL2VkaXRvci9wb3B1bGF0ZS1pbnRlcm5hbC1jb25zdGFudHMnO1xuXG5pbXBvcnQgQ29tcGlsZWRCdWlsZGVyIGZyb20gJy4vY29tcGlsZWQvYnVpbGRlcic7XG5pbXBvcnQgRHluYW1pY0J1aWxkZXIgZnJvbSAnLi9keW5hbWljLWJ1aWxkZXInO1xuXG4vLyBpbXBvcnQgZGVzZXJpYWxpemVyIHR5cGVzXG5pbXBvcnQgRCA9IGRlc2VyaWFsaXplLkludGVybmFsO1xuaW1wb3J0IHsgQnVpbGRlciwgSUJ1aWxkZXJPcHRpb25zIH0gZnJvbSAnLi9iYXNlLWJ1aWxkZXInO1xudHlwZSBBbnlDQ0NsYXNzID0gRC5BbnlDQ0NsYXNzXztcblxuY29uc3QgeyBQZXJzaXN0ZW50TWFzaywgRG9udFNhdmUsIERvbnREZXN0cm95LCBFZGl0b3JPbmx5IH0gPSBDQ09iamVjdC5GbGFncztcblxuY29uc3QgZ2V0RGVmYXVsdCA9IENDQ2xhc3MuZ2V0RGVmYXVsdDtcblxuaW50ZXJmYWNlIElQcm9wZXJ0eU9wdGlvbnMge1xuICAgIGZvcm1lcmx5U2VyaWFsaXplZEFzPzogc3RyaW5nO1xuICAgIGRlZmF1bHRWYWx1ZT86IGFueTtcbiAgICBleHBlY3RlZFR5cGU/OiBzdHJpbmc7XG59XG5leHBvcnQgdHlwZSBQcm9wZXJ0eU9wdGlvbnMgPSBJUHJvcGVydHlPcHRpb25zIHwgbnVsbDtcblxuZXhwb3J0IGludGVyZmFjZSBJQXJyYXlPcHRpb25zIGV4dGVuZHMgSVByb3BlcnR5T3B0aW9ucyB7XG4gICAgLy8g5pWw57uE5ou36LSd77yM5Y+v55SxIGJ1aWxkZXIg6Ieq55Sx5L+u5pS577yM5LiN5Y+v6K+75Y+W6YeM6Z2i55qE5YC8XG4gICAgd3JpdGVPbmx5QXJyYXk6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDbGFzc09wdGlvbnMgZXh0ZW5kcyBJUHJvcGVydHlPcHRpb25zIHtcbiAgICB0eXBlOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiDmraTnsbvnmoTlrp7kvovmsLjov5zlj6rkvJrooqvkuIDkuKrlnLDmlrnlvJXnlKjliLDjgIJcbiAgICAgKi9cbiAgICB1bmlxdWVseVJlZmVyZW5jZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDdXN0b21DbGFzc09wdGlvbnMgZXh0ZW5kcyBJQ2xhc3NPcHRpb25zIHtcbiAgICBjb250ZW50OiBhbnk7XG59XG5cbi8vIGV4cG9ydCBpbnRlcmZhY2UgSVNlcmlhbGl6ZWREYXRhT3B0aW9ucyBleHRlbmRzIElQcm9wZXJ0eU9wdGlvbnMge1xuLy8gICAgIGV4cGVjdGVkVHlwZTogc3RyaW5nO1xuLy8gICAgIGZvcm1lcmx5U2VyaWFsaXplZERhdGE6IGFueTtcbi8vIH1cblxuLy8g5b2T5YmN5q2j5Zyo6Kej5p6Q55qE5a+56LGh5pWw5o2u57yT5a2Y77yM5Y+v5Lul5piv5Lu75oSP5YC85oiW6ICF5Li656m677yM55So5LqOIEJ1aWxkZXIg57yT5a2Y5a+56LGh55qE6Kej5p6Q57uT5p6c77yM5LyY5YyW6Kej5p6Q5oCn6IO944CCXG5leHBvcnQgaW50ZXJmYWNlIElPYmpQYXJzaW5nSW5mbyB7IH1cbi8vIGV4cG9ydCB0eXBlIElPYmpQYXJzaW5nSW5mbyA9IE9iamVjdCB8IG51bGw7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBhcnNlck9wdGlvbnMge1xuICAgIC8vIOaYr+WQpuWOi+e8qSB1dWlkXG4gICAgY29tcHJlc3NVdWlkPzogYm9vbGVhbjtcbiAgICBkaXNjYXJkSW52YWxpZD86IGJvb2xlYW47XG4gICAgZG9udFN0cmlwRGVmYXVsdD86IGJvb2xlYW47XG4gICAgbWlzc2luZ0NsYXNzUmVwb3J0ZXI/OiBhbnk7XG4gICAgbWlzc2luZ09iamVjdFJlcG9ydGVyPzogYW55O1xuICAgIHJlc2VydmVDb250ZW50c0ZvclN5bmNhYmxlUHJlZmFiPzogYm9vbGVhbjtcbiAgICAvLyDmmK/lkKbmnoTlu7rvvIzlj5blhrPkuo4gYnVpbGRlclxuICAgIF9leHBvcnRpbmc/OiBib29sZWFuO1xuICAgIHVzZUNDT04/OiBib29sZWFuO1xuICAgIC8vIOaYr+WQpuS/neeVmeiKgueCueOAgee7hOS7tiB1dWlkIOaVsOaNrlxuICAgIGtlZXBOb2RlVXVpZD86IGJvb2xlYW47XG4gICAgLy8g6K6w5b2V5L6d6LWW55qE6LWE5rqQIFVVSUTvvIzmlbDmja7kvJrljrvph43vvIzkuI3lkKvohJrmnKzkvp3otZbjgILkvKDlhaXmlbDnu4TlpoLmnpzpnZ7nqbrvvIzmlbDmja7lsIbkvJrov73liqDov5vljrvjgIJcbiAgICAvLyDms6jmhI/vvJrmoLnmja7kvKDlhaXlj4LmlbDlpoIgY29tcHJlc3NVdWlkLCBfZXhwb3J0aW5nLCByZXNlcnZlQ29udGVudHNGb3JTeW5jYWJsZVByZWZhYu+8jOe7k+aenOS8muWPkeeUn+WvueW6lOWPmOWMluOAglxuICAgIHJlY29yZEFzc2V0RGVwZW5kcz86IHN0cmluZ1tdO1xufVxuXG5jb25zdCBBdHRyID0gQ0NDbGFzcy5BdHRyO1xuY29uc3QgRURJVE9SX09OTFkgPSBBdHRyLkRFTElNRVRFUiArICdlZGl0b3JPbmx5JztcbmNvbnN0IERFRkFVTFQgPSBBdHRyLkRFTElNRVRFUiArICdkZWZhdWx0JztcbmNvbnN0IEZPUk1FUkxZX1NFUklBTElaRURfQVMgPSBBdHRyLkRFTElNRVRFUiArICdmb3JtZXJseVNlcmlhbGl6ZWRBcyc7XG5cbmZ1bmN0aW9uIGVxdWFsc1RvRGVmYXVsdChkZWY6IGFueSwgdmFsdWU6IGFueSkge1xuICAgIGlmICh0eXBlb2YgZGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkZWYgPSBkZWYoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChkZWYgPT09IHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoZGVmICYmIHZhbHVlICYmXG4gICAgICAgIHR5cGVvZiBkZWYgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgZGVmLmNvbnN0cnVjdG9yID09PSB2YWx1ZS5jb25zdHJ1Y3RvclxuICAgICkge1xuICAgICAgICBpZiAoZGVmIGluc3RhbmNlb2YgVmFsdWVUeXBlKSB7XG4gICAgICAgICAgICBpZiAoZGVmLmVxdWFscyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRlZikpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWYubGVuZ3RoID09PSAwICYmIHZhbHVlLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZWYuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGpzLmlzRW1wdHlPYmplY3QoZGVmKSAmJiBqcy5pc0VtcHR5T2JqZWN0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzU2VyaWFsaXphYmxlQ2xhc3Mob2JqOiBvYmplY3QsIGN0b3I6IGFueSk6IGN0b3IgaXMgQW55Q0NDbGFzcyB7XG4gICAgaWYgKCFjdG9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIENDQ2xhc3MuaXNDQ0NsYXNzT3JGYXN0RGVmaW5lZChjdG9yKSAmJiAhIWpzLmdldENsYXNzSWQob2JqLCBmYWxzZSk7XG59XG5cbi8vIOaYr+WQpuaYr1ByZWZhYkluc3RhbmNl5Lit55qE6IqC54K5XG5mdW5jdGlvbiBpc1N5bmNQcmVmYWIobm9kZTogQ0NOb2RlKSB7XG4gICAgLy8gMS4g5ZyoUHJlZmFiSW5zdGFuY2XkuIvnmoTpnZ5Nb3VudGVk6IqC54K5XG4gICAgLy8gMi4g5aaC5p6cTW91bnRlZOiKgueCueaYr+S4gOS4qlByZWZhYkluc3RhbmNl77yM6YKj5a6D5Lmf5piv5LiA5Liqc3luY1ByZWZhYlxuICAgIC8vIEB0cy1pZ25vcmUgbWVtYmVyLWFjY2Vzc1xuICAgIHJldHVybiBub2RlPy5fcHJlZmFiPy5yb290Py5fcHJlZmFiPy5pbnN0YW5jZSAmJiAobm9kZT8uX3ByZWZhYj8uaW5zdGFuY2UgfHwgIWlzTW91bnRlZENoaWxkKG5vZGUpKTtcbn1cblxuLy8g55So5LqO5qOA5rWL5b2T5YmN6IqC54K55piv5ZCm5piv5LiA5LiqUHJlZmFiSW5zdGFuY2XkuK3nmoRNb3VudGVk55qE6IqC54K577yM5ZCO6Z2i5Y+v5Lul6ICD6JmR5LyY5YyW5LiA5LiLXG5mdW5jdGlvbiBpc01vdW50ZWRDaGlsZChub2RlOiBDQ05vZGUpIHtcbiAgICByZXR1cm4gISFub2RlW2VkaXRvckV4dHJhc1RhZ10/Lm1vdW50ZWRSb290O1xufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VyIHtcbiAgICBleHBvcnRpbmc6IGJvb2xlYW47XG4gICAgbXVzdENvbXByZXNzZVV1aWQ6IGJvb2xlYW47XG4gICAgZGlzY2FyZEludmFsaWQ6IGJvb2xlYW47XG4gICAgZG9udFN0cmlwRGVmYXVsdDogYm9vbGVhbjtcbiAgICBtaXNzaW5nQ2xhc3NSZXBvcnRlcjogYW55O1xuICAgIG1pc3NpbmdPYmplY3RSZXBvcnRlcjogYW55O1xuICAgIHJlc2VydmVDb250ZW50c0ZvckFsbFN5bmNhYmxlUHJlZmFiOiBib29sZWFuO1xuICAgIGtlZXBOb2RlVXVpZDogYm9vbGVhbjtcbiAgICByZWNvcmRBc3NldERlcGVuZHM6IElQYXJzZXJPcHRpb25zWydyZWNvcmRBc3NldERlcGVuZHMnXTtcblxuICAgIHByaXZhdGUgYnVpbGRlcjogQnVpbGRlcjtcbiAgICBwcml2YXRlIHJvb3Q6IG9iamVjdCB8IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIHByZWZhYlJvb3Q6IENDTm9kZSB8IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIGFzc2V0RXhpc3RzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgICAvLyDkuLrmiYDmnInlr7nosaHliJvlu7rlubbnvJPlrZggSU9ialBhcnNpbmdJbmZv77yM5ZCM5pe26Ziy5q2i5b6q546v5byV55SoXG4gICAgcHJpdmF0ZSBwYXJzaW5nSW5mb3MgPSBuZXcgTWFwPG9iamVjdCwgSU9ialBhcnNpbmdJbmZvPigpO1xuXG4gICAgcHJpdmF0ZSBjdXN0b21FeHBvcnRpbmdDdHhDYWNoZTogYW55O1xuICAgIHByaXZhdGUgX3NlcmlhbGl6YXRpb25Db250ZXh0OiBjYy5TZXJpYWxpemF0aW9uQ29udGV4dDtcbiAgICBwcml2YXRlIGFzc2V0RGVwZW5kcz86IFNldDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IoYnVpbGRlcjogQnVpbGRlciwgb3B0aW9uczogSVBhcnNlck9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIHRoaXMuZXhwb3J0aW5nID0gISFvcHRpb25zLl9leHBvcnRpbmc7XG4gICAgICAgIHRoaXMubXVzdENvbXByZXNzZVV1aWQgPSAhIW9wdGlvbnMuY29tcHJlc3NVdWlkO1xuICAgICAgICB0aGlzLmRpc2NhcmRJbnZhbGlkID0gJ2Rpc2NhcmRJbnZhbGlkJyBpbiBvcHRpb25zID8gISFvcHRpb25zLmRpc2NhcmRJbnZhbGlkIDogdHJ1ZTtcbiAgICAgICAgdGhpcy5kb250U3RyaXBEZWZhdWx0ID0gIXRoaXMuZXhwb3J0aW5nIHx8ICgnZG9udFN0cmlwRGVmYXVsdCcgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5kb250U3RyaXBEZWZhdWx0IDogdHJ1ZSk7XG4gICAgICAgIHRoaXMubWlzc2luZ0NsYXNzUmVwb3J0ZXIgPSBvcHRpb25zLm1pc3NpbmdDbGFzc1JlcG9ydGVyO1xuICAgICAgICB0aGlzLm1pc3NpbmdPYmplY3RSZXBvcnRlciA9IG9wdGlvbnMubWlzc2luZ09iamVjdFJlcG9ydGVyO1xuICAgICAgICB0aGlzLnJlc2VydmVDb250ZW50c0ZvckFsbFN5bmNhYmxlUHJlZmFiID0gISFvcHRpb25zLnJlc2VydmVDb250ZW50c0ZvclN5bmNhYmxlUHJlZmFiO1xuICAgICAgICBjb25zdCBjdXN0b21Bcmd1bWVudHM6IGNjLlNlcmlhbGl6YXRpb25Db250ZXh0WydjdXN0b21Bcmd1bWVudHMnXSA9IHt9O1xuICAgICAgICBjdXN0b21Bcmd1bWVudHNbY2MuTm9kZS5yZXNlcnZlQ29udGVudHNGb3JBbGxTeW5jYWJsZVByZWZhYlRhZyBhcyBhbnldID0gdGhpcy5yZXNlcnZlQ29udGVudHNGb3JBbGxTeW5jYWJsZVByZWZhYjtcbiAgICAgICAgdGhpcy5fc2VyaWFsaXphdGlvbkNvbnRleHQgPSB7XG4gICAgICAgICAgICByb290OiBudWxsLFxuICAgICAgICAgICAgdG9DQ09OOiBvcHRpb25zLnVzZUNDT04gPz8gZmFsc2UsXG4gICAgICAgICAgICBjdXN0b21Bcmd1bWVudHMsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5idWlsZGVyID0gYnVpbGRlcjtcbiAgICAgICAgdGhpcy5rZWVwTm9kZVV1aWQgPSAhIW9wdGlvbnMua2VlcE5vZGVVdWlkO1xuICAgICAgICB0aGlzLmFzc2V0RXhpc3RzID0gdGhpcy5taXNzaW5nT2JqZWN0UmVwb3J0ZXIgJiYgT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgdGhpcy5jdXN0b21FeHBvcnRpbmdDdHhDYWNoZSA9IHRoaXMuZXhwb3J0aW5nID8ge1xuICAgICAgICAgICAgX2RlcGVuZHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgICAgICAgZGVwZW5kc09uKHByb3BOYW1lOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jb21wcmVzc1V1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZCA9IFV0aWxzLlVVSUQuY29tcHJlc3NVVUlEKHV1aWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9kZXBlbmRzLnB1c2gocHJvcE5hbWUsIHV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9jb21wcmVzc1V1aWQ6IHRoaXMubXVzdENvbXByZXNzZVV1aWQsXG4gICAgICAgIH0gOiBudWxsO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnJlY29yZEFzc2V0RGVwZW5kcykge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRBc3NldERlcGVuZHMgPSBvcHRpb25zLnJlY29yZEFzc2V0RGVwZW5kcztcbiAgICAgICAgICAgIHRoaXMuYXNzZXREZXBlbmRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJzZShvYmo6IG9iamVjdCkge1xuICAgICAgICB0aGlzLnJvb3QgPSBvYmo7XG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBjYy5QcmVmYWIpIHtcbiAgICAgICAgICAgIHRoaXMucHJlZmFiUm9vdCA9IG9iai5kYXRhO1xuICAgICAgICAgICAgdGhpcy5fc2VyaWFsaXphdGlvbkNvbnRleHQucm9vdCA9IG9iai5kYXRhO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2VyaWFsaXphdGlvbkNvbnRleHQucm9vdCA9IG9iajtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb290SW5mbyA9IHRoaXMucGFyc2VPYmpGaWVsZChudWxsLCBudWxsLCAnJywgb2JqLCBudWxsKTtcbiAgICAgICAgdGhpcy5idWlsZGVyLnNldFJvb3Qocm9vdEluZm8pO1xuICAgICAgICAvLyBpZiAob2JqICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIGlzU2VyaWFsaXphYmxlQ2xhc3Mob2JqLCBvYmouY29uc3RydWN0b3IpKSB7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSB7XG4gICAgICAgIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gb2JqZWN0IHRvIHNlcmlhbGl6ZTogJHtvYmp9YCk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICBpZiAodGhpcy5yZWNvcmRBc3NldERlcGVuZHMpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3JkQXNzZXREZXBlbmRzLnB1c2goLi4udGhpcy5hc3NldERlcGVuZHMhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY2hlY2tNaXNzaW5nQXNzZXQoYXNzZXQ6IENDQXNzZXQsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5taXNzaW5nT2JqZWN0UmVwb3J0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuYXNzZXRFeGlzdHNbdXVpZF07XG4gICAgICAgICAgICAvLyBUT0RPIOi/memHjOmcgOimgeWIpOaWreS4gOS4iyBkYiDmmK/lkKblrZjlnKjlr7nlupTnmoTotYTmupBcbiAgICAgICAgICAgIGlmICghZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taXNzaW5nT2JqZWN0UmVwb3J0ZXIoYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5qCh6aqM5piv5ZCm6ZyA6KaB5bqP5YiX5YyWXG4gICAgcHJpdmF0ZSBpc09ialJlbW92ZWQodmFsOiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIENDT2JqZWN0KSB7XG4gICAgICAgICAgICAvLyB2YWxpZGF0ZSBvYmogZmxhZ3NcbiAgICAgICAgICAgIGNvbnN0IG9iakZsYWdzID0gdmFsLm9iakZsYWdzO1xuICAgICAgICAgICAgaWYgKHRoaXMuZXhwb3J0aW5nICYmIChcbiAgICAgICAgICAgICAgICAob2JqRmxhZ3MgJiBFZGl0b3JPbmx5KSB8fFxuICAgICAgICAgICAgICAgIChTRVJWRVJfTU9ERSlcbiAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvYmpGbGFncyAmIERvbnRTYXZlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGlzY2FyZEludmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBsaXZlIHJlbG9hZGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqRmxhZ3MgJiBEb250RGVzdHJveSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g55uu5YmN57yW6L6R5Zmo5LiL55qEIERvbnRTYXZlIOiKgueCueW+gOW+gOaYr+W4uOmpu+iKgueCue+8iERvbnREZXN0cm9577yJ77yM6L+Z57G76IqC54K55LiN6ZyA6KaB5bqP5YiX5YyW77yM5Zug5Li65pys6Lqr5bCx5LiN6ZyA6KaB6YeN5paw5Yib5bu644CCXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRQYXJzZWRPYmoob3duZXJJbmZvOiBJT2JqUGFyc2luZ0luZm8sIGtleTogc3RyaW5nIHwgbnVtYmVyLCB2YWw6IGFueSwgZm9ybWVybHlTZXJpYWxpemVkQXM6IHN0cmluZyB8IG51bGwpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHZhbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgbGV0IHBhcnNpbmdJbmZvID0gdGhpcy5wYXJzaW5nSW5mb3MuZ2V0KHZhbCk7XG4gICAgICAgICAgICBpZiAoIXBhcnNpbmdJbmZvICYmIHZhbCBpbnN0YW5jZW9mIENDQXNzZXQgJiYgdGhpcy5yb290IGluc3RhbmNlb2YgQ0NBc3NldCkge1xuICAgICAgICAgICAgICAgIC8vIERvdWJsZSBjaGVjayB1dWlkcyB0byBndWFyYW50ZWUgc2FtZS11dWlkICh3aXRoIG1haW4gYXNzZXQgbG9hZGVkIGZyb20gREIpIG9iamVjdHMgdGhhdCBjcmVhdGVkIHVuZXhwZWN0ZWRseSB0byB1c2UgZGlyZWN0IHJlZmVyZW5jZSAobm9uLXV1aWQgZm9ybWF0KS5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIHdheSwgZXZlbiBpZiB0aGUgdXVpZCBjaGFuZ2VzIHdoZW4gY29weWluZywgdGhlcmUgaXMgbm8gZmVhciBvZiBtaXNzaW5nLXV1aWQuXG4gICAgICAgICAgICAgICAgaWYgKHZhbC5fdXVpZCAmJiB2YWwuX3V1aWQgPT09IHRoaXMucm9vdC5fdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJzaW5nSW5mbyA9IHRoaXMucGFyc2luZ0luZm9zLmdldCh0aGlzLnJvb3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJzaW5nSW5mbykge1xuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRlci5zZXRQcm9wZXJ0eV9QYXJzZWRPYmplY3Qob3duZXJJbmZvLCBrZXksIHBhcnNpbmdJbmZvLCBmb3JtZXJseVNlcmlhbGl6ZWRBcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIOi9rOaNouS4uumcgOimgeW6j+WIl+WMlueahOWAvFxuICAgIHByaXZhdGUgdmVyaWZ5Tm90UGFyc2VkVmFsdWUob3duZXI6IGFueSwga2V5OiBzdHJpbmcgfCBudW1iZXIsIHZhbDogYW55KTogYW55IHtcbiAgICAgICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgICAgIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBDQ09iamVjdCkge1xuICAgICAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBDQ0Fzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSB2YWwuX3V1aWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrTWlzc2luZ0Fzc2V0KHZhbCwgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHV1aWQg55qEIGFzc2V0IOWNs+eoi+W6j+WIm+W7uueahOi1hOa6kO+8jOavlOWmguS4gOS6m+WGheW7uueahOeoi+W6j+WIm+W7uueahCBtYXRlcmlhbO+8jFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5oiW6ICF5piv5bqP5YiX5YyW55qE5Li76LWE5rqQ77yM5L2G5piv5Li76LWE5rqQ5bqU6K+l5bey57uP5ZyoIHNldFBhcnNlZE9iaiDlpITnkIbkuobjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGlzY2FyZEludmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWwuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taXNzaW5nT2JqZWN0UmVwb3J0ZXI/Lih2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGxpdmUgcmVsb2FkaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWwuaXNSZWFsVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gdmFsaWRhdGUgcHJlZmFiXG4gICAgICAgICAgICAgICAgaWYgKENDTm9kZSAmJiBDQ05vZGUuaXNOb2RlKHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBtZW1iZXItYWNjZXNzXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHdpbGxCZURpc2NhcmQgPSB0aGlzLmNhbkRpc2NhcmRCeVByZWZhYlJvb3QodmFsKSAmJiB2YWwgIT09IHZhbC5fcHJlZmFiLnJvb3Q7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWxsQmVEaXNjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHZhbGlkYXRlIGNvbXBvbmVudCBpbiBwcmVmYWJcbiAgICAgICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQ0NDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29tcG9uZW50IHdpdGhvdXQgbW91bnRlZFJvb3QgaW5mbyB3aWxsIGJlIGRpc2NhcmRcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2lsbEJlRGlzY2FyZCA9IHZhbC5ub2RlICYmIHRoaXMuY2FuRGlzY2FyZEJ5UHJlZmFiUm9vdCh2YWwubm9kZSkgJiYgIXZhbFtlZGl0b3JFeHRyYXNUYWddPy5tb3VudGVkUm9vdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpbGxCZURpc2NhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlmIChvd25lciBpbnN0YW5jZW9mIENDT2JqZWN0ICYmIGtleSA9PT0gJ19vYmpGbGFncycgJiYgdmFsID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWwgJiBQZXJzaXN0ZW50TWFzaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSAvKiBmdW5jdGlvbiovIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHByaXZhdGUgY2FuRGlzY2FyZEJ5UHJlZmFiUm9vdChub2RlOiBDQ05vZGUpIHtcbiAgICAgICAgcmV0dXJuICEodGhpcy5yZXNlcnZlQ29udGVudHNGb3JBbGxTeW5jYWJsZVByZWZhYiB8fCAhaXNTeW5jUHJlZmFiKG5vZGUpIHx8IHRoaXMucHJlZmFiUm9vdCA9PT0gbm9kZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlbnVtZXJhdGVDbGFzcyhvd25lcjogYW55LCBvd25lckluZm86IElPYmpQYXJzaW5nSW5mbywgY2NjbGFzczogQW55Q0NDbGFzcywgY3VzdG9tUHJvcHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBhdHRycyA9IEF0dHIuZ2V0Q2xhc3NBdHRycyhjY2NsYXNzKTtcbiAgICAgICAgY29uc3QgcHJvcHMgPSBjdXN0b21Qcm9wcyB8fCBjY2NsYXNzLl9fdmFsdWVzX187XG4gICAgICAgIGZvciAobGV0IHAgPSAwOyBwIDwgcHJvcHMubGVuZ3RoOyBwKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gcHJvcHNbcF07XG4gICAgICAgICAgICBsZXQgdmFsID0gb3duZXJbcHJvcE5hbWVdO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNPYmpSZW1vdmVkKHZhbCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmV4cG9ydGluZykge1xuICAgICAgICAgICAgICAgIGlmIChhdHRyc1twcm9wTmFtZSArIEVESVRPUl9PTkxZXSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBza2lwIGVkaXRvciBvbmx5IHdoZW4gZXhwb3J0aW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDov5nph4zkuI3nlKjogIPomZHlr7kgUHJlZmFiSW5mbyDnmoTliZTpmaTvvIzov5nkuIDlnZflnKjnvJbovpHlmajkuK3nmoTlj43luo/liJfljJbml7blt7Lnu4/lrp7njrDkuoZcbiAgICAgICAgICAgICAgICAvLyB2YXIgaXNQcmVmYWJJbmZvID0gQ0NOb2RlICYmIENDTm9kZS5pc05vZGUob2JqKSAmJiBwcm9wTmFtZSA9PT0gJ19wcmVmYWInO1xuICAgICAgICAgICAgICAgIC8vIGlmIChpc1ByZWZhYkluZm8gJiYgIWlzU3luY1ByZWZhYihvYmopKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIC8vIGRvbid0IGV4cG9ydCBwcmVmYWIgaW5mbyBpbiBydW50aW1lXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZm9ybWVybHlTZXJpYWxpemVkQXMgPSBhdHRyc1twcm9wTmFtZSArIEZPUk1FUkxZX1NFUklBTElaRURfQVNdO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0UGFyc2VkT2JqKG93bmVySW5mbywgcHJvcE5hbWUsIHZhbCwgZm9ybWVybHlTZXJpYWxpemVkQXMpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhbCA9IHRoaXMudmVyaWZ5Tm90UGFyc2VkVmFsdWUob3duZXIsIHByb3BOYW1lLCB2YWwpO1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdChhdHRyc1twcm9wTmFtZSArIERFRkFVTFRdKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwb3J0aW5nICYmICF0aGlzLmRvbnRTdHJpcERlZmF1bHQgJiYgZXF1YWxzVG9EZWZhdWx0KGRlZmF1bHRWYWx1ZSwgdmFsKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBhcnNlRmllbGQob3duZXIsIG93bmVySW5mbywgcHJvcE5hbWUsIHZhbCwgeyBmb3JtZXJseVNlcmlhbGl6ZWRBcywgZGVmYXVsdFZhbHVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChDQ05vZGUgJiYgb3duZXIgaW5zdGFuY2VvZiBDQ05vZGUpIHx8IChDQ0NvbXBvbmVudCAmJiBvd25lciBpbnN0YW5jZW9mIENDQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZXhwb3J0aW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmtlZXBOb2RlVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIG1lbWJlci1hY2Nlc3NcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlZEluUGVyc2lzdFJvb3QgPSAob3duZXIgaW5zdGFuY2VvZiBDQ05vZGUgJiYgb3duZXIuX3BhcmVudCBpbnN0YW5jZW9mIGNjLlNjZW5lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1c2VkSW5QZXJzaXN0Um9vdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByZWZhYlJvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIG1lbWJlci1hY2Nlc3NcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZG9udFN0cmlwRGVmYXVsdCAmJiAhb3duZXIuX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgbWVtYmVyLWFjY2Vzc1xuICAgICAgICAgICAgdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X1Jhdyhvd25lciwgb3duZXJJbmZvLCAnX2lkJywgb3duZXIuX2lkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOmHjee9riBUUlMg5Lit55qE57yp5pS+XG4gICAgLy8gcHJpdmF0ZSBzZXRUcnNPZlN5bmNhYmxlUHJlZmFiUm9vdCAob2JqOiBDQ05vZGUpIHtcbiAgICAvLyAgICAgY29uc3QgdHJzID0gb2JqLl90cnMuc2xpY2UoKTtcbiAgICAvLyAgICAgdHJzWzddID0gdHJzWzhdID0gdHJzWzldID0gMTsgLy8gcmVzZXQgc2NhbGUueHl6XG4gICAgLy8gICAgIGlmICghUGFyc2VyLmlzRGVmYXVsdFRycyh0cnMpKSB7XG4gICAgLy8gICAgICAgICB0aGlzLmJ1aWxkZXIuc2V0UHJvcGVydHlfVHlwZWRBcnJheShvYmosICdfdHJzJywgdHJzKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIHN0YXRpYyBpc0RlZmF1bHRUcnModHJzOiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRyc1swXSA9PT0gMCAmJiB0cnNbMV0gPT09IDAgJiYgdHJzWzJdID09PSAwICYmIC8vIHBvc2l0aW9uLnh5elxuICAgICAgICAgICAgdHJzWzNdID09PSAwICYmIHRyc1s0XSA9PT0gMCAmJiB0cnNbNV0gPT09IDAgJiYgdHJzWzZdID09PSAxICYmIC8vIHF1YXQueHl6d1xuICAgICAgICAgICAgdHJzWzddID09PSAxICYmIHRyc1s4XSA9PT0gMSAmJiB0cnNbOV0gPT09IDE7IC8vIHNjYWxlLnh5elxuICAgIH1cblxuICAgIHByaXZhdGUgcGFyc2VGaWVsZChvd25lcjogb2JqZWN0LCBvd25lckluZm86IElPYmpQYXJzaW5nSW5mbywga2V5OiBzdHJpbmcgfCBudW1iZXIsIHZhbDogYW55LCBvcHRpb25zOiBQcm9wZXJ0eU9wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgICAgIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkZXIuc2V0UHJvcGVydHlfUmF3KG93bmVyLCBvd25lckluZm8sIGtleSwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIENDQXNzZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHV1aWQgPSB2YWwuX3V1aWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm11c3RDb21wcmVzc2VVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkID0gVXRpbHMuVVVJRC5jb21wcmVzc1VVSUQodXVpZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXhwZWN0ZWRUeXBlID0ganMuZ2V0Q2xhc3NJZCh2YWwuY29uc3RydWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkZXIuc2V0UHJvcGVydHlfQXNzZXRVdWlkKG93bmVyLCBvd25lckluZm8sIGtleSwgdXVpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXNzZXREZXBlbmRzPy5hZGQodXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlIHRvIHNlcmlhbGl6ZSBtYWluIGFzc2V0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wYXJzZU9iakZpZWxkKG93bmVyLCBvd25lckluZm8sIGtleSwgdmFsLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkZXIuc2V0UHJvcGVydHlfUmF3KG93bmVyLCBvd25lckluZm8sIGtleSwgdmFsLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIC8qIGZ1bmN0aW9uKi8ge1xuICAgICAgICAgICAgdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X1Jhdyhvd25lciwgb3duZXJJbmZvLCBrZXksIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Kej5p6Q5a+56LGhXG4gICAgICogMS4g6LCD55SoIGJ1aWxkZXIg55qEIEFQSSDlo7DmmI7kuIDkuKrmlrDnmoTjgJDnqbrlr7nosaHjgJFcbiAgICAgKiAyLiDlr7nlj6/lvJXnlKjlr7nosaHvvIzmoIforrDop6PmnpDnirbmgIHvvIzpmLLmraLlvqrnjq/op6PmnpBcbiAgICAgKiAzLiDjgJDmnIDlkI7jgJHmnprkuL7lr7nosaHljIXlkKvnmoTlhbblroPlsZ7mgKdcbiAgICAgKi9cbiAgICBwcml2YXRlIHBhcnNlT2JqRmllbGQob3duZXI6IG51bGwsIG93bmVySW5mbzogbnVsbCwga2V5OiBzdHJpbmcgfCBudW1iZXIsIHZhbDogb2JqZWN0LCBvcHRpb25zOiBudWxsKTogSU9ialBhcnNpbmdJbmZvOyAvLyBmb3Igcm9vdCBvYmplY3RcbiAgICBwcml2YXRlIHBhcnNlT2JqRmllbGQob3duZXI6IG9iamVjdCwgb3duZXJJbmZvOiBJT2JqUGFyc2luZ0luZm8sIGtleTogc3RyaW5nIHwgbnVtYmVyLCB2YWw6IGFueSwgb3B0aW9uczogUHJvcGVydHlPcHRpb25zKTogSU9ialBhcnNpbmdJbmZvIHwgbnVsbDsgLy8gZm9yIG5vcm1hbFxuICAgIHByaXZhdGUgcGFyc2VPYmpGaWVsZChvd25lcjogb2JqZWN0IHwgbnVsbCwgb3duZXJJbmZvOiBJT2JqUGFyc2luZ0luZm8gfCBudWxsLCBrZXk6IHN0cmluZyB8IG51bWJlciwgdmFsOiBhbnksIG9wdGlvbnM6IFByb3BlcnR5T3B0aW9ucyk6IElPYmpQYXJzaW5nSW5mbyB8IG51bGwge1xuICAgICAgICBjb25zdCBjdG9yID0gdmFsLmNvbnN0cnVjdG9yO1xuICAgICAgICBpZiAoaXNTZXJpYWxpemFibGVDbGFzcyh2YWwsIGN0b3IpKSB7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0U2VyaWFsaXplID0gKHZhbHVlSW5mbzogSU9ialBhcnNpbmdJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHByb3BzID0gY3Rvci5fX3ZhbHVlc19fO1xuICAgICAgICAgICAgICAgIGlmICh2YWwuX29uQmVmb3JlU2VyaWFsaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzID0gdmFsLl9vbkJlZm9yZVNlcmlhbGl6ZShwcm9wcykgfHwgcHJvcHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gREVCVUc6IEFzc2VydCBNaXNzaW5nU2NyaXB0IF9fdmFsdWVzX18gZm9yIGlzc3VlIDk4NzhcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RvciA9PT0gY2NsZWdhY3kuX01pc3NpbmdTY3JpcHQgJiYgKHByb3BzLmxlbmd0aCA9PT0gMCB8fCBwcm9wc1twcm9wcy5sZW5ndGggLSAxXSAhPT0gJ18kZXJpYWxpemVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmVycm9yKGBUaGUgJ18kZXJpYWxpemVkJyBwcm9wIGluICcke3ZhbC5uYW1lfScgaXMgbWlzc2luZy4gV2lsbCBmb3JjZSB0aGUgcmF3IGRhdGEgdG8gYmUgcmVhZC5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmVycm9yKGAgICAgRXJyb3IgcHJvcHM6IFsnJHtwcm9wc30nXSwgcmF3IHByb3BzOiBbJyR7Y3Rvci5fX3ZhbHVlc19ffSddLiBQbGVhc2UgY29udGFjdCBqYXJlLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMucHVzaCgnXyRlcmlhbGl6ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2Mud2FybihgRXJyb3Igd2hlbiBjaGVja2luZyBNaXNzaW5nU2NyaXB0IDMsICR7ZX1gKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocHJvcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocHJvcHNbcHJvcHMubGVuZ3RoIC0gMV0gIT09ICdfJGVyaWFsaXplZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnVtZXJhdGVDbGFzcyh2YWwsIHZhbHVlSW5mbywgY3RvciwgcHJvcHMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gREVCVUc6IEFzc2VydCBNaXNzaW5nU2NyaXB0IGRhdGEgZm9yIGlzc3VlIDk4NzhcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbC5fJGVyaWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZXJyb3IoYFRoZSBmb3JtZXJseSBzZXJpYWxpemVkIGRhdGEgaXMgbm90IGZvdW5kIGZyb20gJyR7dmFsLm5hbWV9Jy4gUGxlYXNlIGNoZWNrIHRoZSBwcmV2aW91cyBlcnJvciByZXBvcnQuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNjLndhcm4oYEVycm9yIHdoZW4gY2hlY2tpbmcgTWlzc2luZ1NjcmlwdCAyLCAke2V9YCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g55u05o6l5YaZ5YWl5LmL5YmN5bqP5YiX5YyW6L+H55qE5pWw5o2u77yM55So5LqO6ISa5pys5Lii5aSx55qE5oOF5Ya1XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplZCA9IHZhbC5fJGVyaWFsaXplZDtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gc2VyaWFsaXplZC5fX3R5cGVfXztcbiAgICAgICAgICAgICAgICAvLyBJZiBpcyBtaXNzaW5nIHNjcmlwdCBwcm94eSwgc2VyaWFsaXplZCBhcyBvcmlnaW5hbCBkYXRhXG4gICAgICAgICAgICAgICAgdGhpcy5lbnVtZXJhdGVEaWN0KHNlcmlhbGl6ZWQsIHZhbHVlSW5mbyk7XG5cbiAgICAgICAgICAgICAgICAvLyByZXBvcnQgd2FybmluZ1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pc3NpbmdDbGFzc1JlcG9ydGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWlzc2luZ0NsYXNzUmVwb3J0ZXIodmFsLCB0eXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVOb3JtYWxDbGFzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHQgPSAob3B0aW9ucyB8fCB7fSkgYXMgSUNsYXNzT3B0aW9ucztcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gdmFsLl8kZXJpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgID8gdmFsLl8kZXJpYWxpemVkLl9fdHlwZV9fXG4gICAgICAgICAgICAgICAgICAgIDogY2MuanMuZ2V0Q2xhc3NJZChjdG9yLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgb3B0LnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgIG9wdC51bmlxdWVseVJlZmVyZW5jZWQgPSBjYy5nZXRTZXJpYWxpemF0aW9uTWV0YWRhdGEoY3Rvcik/LnVuaXF1ZWx5UmVmZXJlbmNlZDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5mbyA9IHRoaXMuYnVpbGRlci5zZXRQcm9wZXJ0eV9DbGFzcyhvd25lciwgb3duZXJJbmZvLCBrZXksIG9wdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzaW5nSW5mb3Muc2V0KHZhbCwgdmFsdWVJbmZvKTtcblxuICAgICAgICAgICAgICAgIGlmICghKHZhbCBhcyBQYXJ0aWFsPGNjLkN1c3RvbVNlcmlhbGl6YWJsZT4pW2NjLnNlcmlhbGl6ZVRhZ10pIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFNlcmlhbGl6ZSh2YWx1ZUluZm8pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVJbmZvO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERFQlVHOiBDaGVjayBNaXNzaW5nU2NyaXB0IG9iamVjdCBmb3IgaXNzdWUgOTg3OFxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBjY2xlZ2FjeS5fTWlzc2luZ1NjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZXJyb3IoJ1Nob3VsZCBub3QgZGVjbGFyZSBDdXN0b21TZXJpYWxpemFibGUgb24gTWlzc2luZ1NjcmlwdC4gUGxlYXNlIGNvbnRhY3QgamFyZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRTZXJpYWxpemUodmFsdWVJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZUluZm87XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNjLndhcm4oYEVycm9yIHdoZW4gY2hlY2tpbmcgTWlzc2luZ1NjcmlwdCAxLCAke2V9YCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXphdGlvbk91dHB1dDogY2MuU2VyaWFsaXphdGlvbk91dHB1dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVQcm9wZXJ0eTogKHByb3BlcnR5TmFtZTogc3RyaW5nLCBwcm9wZXJ0eVZhbHVlOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc09ialJlbW92ZWQocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0UGFyc2VkT2JqKHZhbHVlSW5mbywgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlLCBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogdmVyaWZ5Tm90UGFyc2VkVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyc2VGaWVsZCh2YWwsIHZhbHVlSW5mbywgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVGhpczogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRTZXJpYWxpemUodmFsdWVJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVTdXBlcjogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VwZXJDbGFzcyA9IGpzLmdldFN1cGVyKGN0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdXBlckNsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VwZXJQcm9wZXJ0aWVzID0gc3VwZXJDbGFzcy5fX3ZhbHVlc19fIGFzIHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdXBlclByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudW1lcmF0ZUNsYXNzKHZhbCwgdmFsdWVJbmZvLCBjdG9yLCBzdXBlclByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgKHZhbCBhcyBjYy5DdXN0b21TZXJpYWxpemFibGUpW2NjLnNlcmlhbGl6ZVRhZ10oc2VyaWFsaXphdGlvbk91dHB1dCwgdGhpcy5fc2VyaWFsaXphdGlvbkNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZUluZm87XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgVmFsdWVUeXBlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVJbmZvID0gdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X1ZhbHVlVHlwZShvd25lciwgb3duZXJJbmZvLCBrZXksIHZhbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgLy8g5LiN5pSv5oyB5aSa5Liq5Zyw5pa55byV55So5ZCM5LiA5LiqIFZhbHVlVHlwZVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZUluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlSW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERFQlVHOiBDaGVjayBNaXNzaW5nU2NyaXB0IG9iamVjdCBmb3IgaXNzdWUgOTg3OFxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgY2NsZWdhY3kuX01pc3NpbmdTY3JpcHQgJiYgdmFsLl9zZXJpYWxpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2MuZXJyb3IoJ1Nob3VsZCBub3QgZGVjbGFyZSBfc2VyaWFsaXplIG9uIE1pc3NpbmdTY3JpcHQuIFBsZWFzZSBjb250YWN0IGphcmUuJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhbC5fc2VyaWFsaXplID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjYy53YXJuKGBFcnJvciB3aGVuIGNoZWNraW5nIE1pc3NpbmdTY3JpcHQgMCwgJHtlfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXZhbC5fc2VyaWFsaXplKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZU5vcm1hbENsYXNzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdCA9IChvcHRpb25zIHx8IHt9KSBhcyBJQ3VzdG9tQ2xhc3NPcHRpb25zO1xuICAgICAgICAgICAgICAgIG9wdC5jb250ZW50ID0gdmFsLl9zZXJpYWxpemUodGhpcy5jdXN0b21FeHBvcnRpbmdDdHhDYWNoZSk7XG4gICAgICAgICAgICAgICAgb3B0LnR5cGUgPSBjYy5qcy5nZXRDbGFzc0lkKGN0b3IsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZUluZm8gPSB0aGlzLmJ1aWxkZXIuc2V0UHJvcGVydHlfQ3VzdG9taXplZENsYXNzKG93bmVyLCBvd25lckluZm8sIGtleSwgb3B0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNpbmdJbmZvcy5zZXQodmFsLCB2YWx1ZUluZm8pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VzdG9tRXhwb3J0aW5nQ3R4Q2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IHRoaXMuY3VzdG9tRXhwb3J0aW5nQ3R4Q2FjaGUuX2RlcGVuZHM7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVwZW5kcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X0Fzc2V0VXVpZCh2YWwsIHZhbHVlSW5mbywgZGVwZW5kc1tpXSwgZGVwZW5kc1tpICsgMV0sIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hc3NldERlcGVuZHM/LmFkZChkZXBlbmRzW2kgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVzZXQgY3VzdG9tRXhwb3J0aW5nQ3R4Q2FjaGVcbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVJbmZvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWwpKSB7XG4gICAgICAgICAgICBpZiAoQ0NOb2RlICYmIENDTm9kZS5pc05vZGUob3duZXIpICYmIGtleSA9PT0gJ190cnMnICYmIFBhcnNlci5pc0RlZmF1bHRUcnModmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X1R5cGVkQXJyYXkob3duZXIhLCBvd25lckluZm8hLCBrZXksIHZhbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAvLyDkuI3ogIPomZHnm7TmjqXluo/liJfljJYgVHlwZWRBcnJheSDnmoTmg4XlhrVcbiAgICAgICAgICAgIC8vIOS4jeiAg+iZkeWkmuS4quWcsOaWueW8leeUqOWQjOS4gOS4qiBUeXBlZEFycmF5XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjdG9yICYmIGN0b3IgIT09IE9iamVjdCAmJiAhQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgICBpZiAoIW93bmVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIG9iamVjdCB0byBzZXJpYWxpemU6ICR7dmFsfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0cyBpbnRlcmZhY2Ug57G75Z6L55qE5o6l5Y+j57G777yM5a+55bqUIGMrKyDnmoQgc3RydWN077yMc3RydWN0IOiiq+e7keWumuWQjuW5tuS4jeaYryBwbGFpbiBvYmplY3RcbiAgICAgICAgICAgIC8vIOWboOatpO+8jOi/memHjOS8mOWFiOWIpOaWreaYr+WQpuaYryBKU0Ig57uR5a6a5a+56LGhXG4gICAgICAgICAgICBpZiAoY3Rvci5fX2lzSlNCKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVJbmZvID0gdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X0RpY3Qob3duZXIsIG93bmVySW5mbywga2V5LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNpbmdJbmZvcy5zZXQodmFsLCB2YWx1ZUluZm8pO1xuICAgICAgICAgICAgICAgIHRoaXMuZW51bWVyYXRlQmluZGVkRGljdCh2YWwsIHZhbHVlSW5mbyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlSW5mbztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm90IHNlcmlhbGl6YWJsZSBvYmplY3QgdHlwZSwgc3VjaCBhcyBTZXQvTWFwLi4uLCBldGMuXG4gICAgICAgICAgICAvLyBVc2UgZGVmYXVsdCB2YWx1ZSByYXRoZXIgdGhhbiBudWxsLlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBjaGVjayBjaXJjdWxhciByZWZlcmVuY2UgZm9yIHByaW1pdGl2ZSBvYmplY3RzIChbXSwge30sIGV0Yy4uLilcbiAgICAgICAgICAgIC8vIOWvueS6juWOn+eUnyBKUyDnsbvlnovvvIzlj6rlgZrlvqrnjq/lvJXnlKjnmoTkv53miqTvvIxcbiAgICAgICAgICAgIC8vIOW5tuS4jeS/neivgeWQjOS4quWvueixoeeahOWkmuWkhOW8leeUqOWPjeW6j+WIl+WMluWQjuS7jeeEtuaMh+WQkeWQjOS4gOS4quWvueixoeOAglxuICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5q2k6ZyA5rGC77yM5bqU6K+l57un5om/6IeqRk9iamVjdFxuICAgICAgICAgICAgLy8gdmFyIGNpcmN1bGFyUmVmZXJlbmNlZCA9IHRoaXMucGFyc2luZ09ianMuaW5jbHVkZXModmFsKTtcbiAgICAgICAgICAgIC8vIGlmIChjaXJjdWxhclJlZmVyZW5jZWQpIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmJ1aWxkZXIubWFya0FzU2hhcmVkT2JqKHZhbCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyZWRBcnJheSA9IHZhbC5maWx0ZXIoKHg6IGFueSkgPT4gIXRoaXMuaXNPYmpSZW1vdmVkKHgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHQgPSAob3B0aW9ucyB8fCB7fSkgYXMgSUFycmF5T3B0aW9ucztcbiAgICAgICAgICAgICAgICBvcHQud3JpdGVPbmx5QXJyYXkgPSBmaWx0ZXJlZEFycmF5O1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5mbyA9IHRoaXMuYnVpbGRlci5zZXRQcm9wZXJ0eV9BcnJheShvd25lciwgb3duZXJJbmZvLCBrZXksIG9wdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzaW5nSW5mb3Muc2V0KHZhbCwgdmFsdWVJbmZvKTtcbiAgICAgICAgICAgICAgICAvLyBlbnVtZXJhdGVBcnJheVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsdGVyZWRBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbWVudCA9IGZpbHRlcmVkQXJyYXlbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldFBhcnNlZE9iaih2YWx1ZUluZm8sIGksIGVsZW1lbnQsIG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gdGhpcy52ZXJpZnlOb3RQYXJzZWRWYWx1ZSh2YWwsIGksIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnNlRmllbGQodmFsLCB2YWx1ZUluZm8sIGksIGVsZW1lbnQsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVJbmZvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVJbmZvID0gdGhpcy5idWlsZGVyLnNldFByb3BlcnR5X0RpY3Qob3duZXIsIG93bmVySW5mbywga2V5LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNpbmdJbmZvcy5zZXQodmFsLCB2YWx1ZUluZm8pO1xuICAgICAgICAgICAgICAgIHRoaXMuZW51bWVyYXRlRGljdCh2YWwsIHZhbHVlSW5mbyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlSW5mbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZW51bWVyYXRlRGljdChvYmo6IGFueSwgb2JqSW5mbzogSU9ialBhcnNpbmdJbmZvKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGluc1xuICAgICAgICAgICAgaWYgKChvYmouaGFzT3duUHJvcGVydHkgJiYgIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB8fFxuICAgICAgICAgICAgICAgIChrZXkuY2hhckNvZGVBdCgwKSA9PT0gOTUgJiYga2V5LmNoYXJDb2RlQXQoMSkgPT09IDk1KSAvLyBzdGFydHMgd2l0aCBfX1xuICAgICAgICAgICAgICAgICYmIGtleSAhPT0gJ19fcHJlZmFiJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdmFsID0gb2JqW2tleV07XG4gICAgICAgICAgICBpZiAodGhpcy5pc09ialJlbW92ZWQodmFsKSkge1xuICAgICAgICAgICAgICAgIHZhbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnNldFBhcnNlZE9iaihvYmpJbmZvLCBrZXksIHZhbCwgbnVsbCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbCA9IHRoaXMudmVyaWZ5Tm90UGFyc2VkVmFsdWUob2JqLCBrZXksIHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBhcnNlRmllbGQob2JqLCBvYmpJbmZvLCBrZXksIHZhbCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGVudW1lcmF0ZUJpbmRlZERpY3Qob2JqOiBhbnksIG9iakluZm86IElPYmpQYXJzaW5nSW5mbykge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIC8vIOS4jeiDveeUqCBoYXNPd25Qcm9wZXJ0eSDmnaXliKTmlq3vvIzlm6DkuLogSlNCIOWvueixoeeahOWxnuaAp+WcqCBwcm90b3R5cGUg5LiK6Z2iXG5cbiAgICAgICAgICAgIGlmICgoa2V5LmNoYXJDb2RlQXQoMCkgPT09IDk1ICYmIGtleS5jaGFyQ29kZUF0KDEpID09PSA5NSkgLy8gc3RhcnRzIHdpdGggX19cbiAgICAgICAgICAgICAgICAmJiBrZXkgIT09ICdfX3ByZWZhYidcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHZhbCA9IG9ialtrZXldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNPYmpSZW1vdmVkKHZhbCkpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zZXRQYXJzZWRPYmoob2JqSW5mbywga2V5LCB2YWwsIG51bGwpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB0aGlzLnZlcmlmeU5vdFBhcnNlZFZhbHVlKG9iaiwga2V5LCB2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wYXJzZUZpZWxkKG9iaiwgb2JqSW5mbywga2V5LCB2YWwsIG51bGwpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIElPcHRpb25zIGV4dGVuZHMgSVBhcnNlck9wdGlvbnMsIElCdWlsZGVyT3B0aW9ucyB7IH1cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNlcmlhbGl6ZShvYmo6IEV4Y2x1ZGU8YW55LCBudWxsIHwgdW5kZWZpbmVkPiwgb3B0aW9uczogSU9wdGlvbnMpOiBzdHJpbmcgfCBvYmplY3Qge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgbGV0IGJ1aWxkZXI6IEJ1aWxkZXI7XG4gICAgaWYgKG9wdGlvbnMuYnVpbGRlciA9PT0gJ2NvbXBpbGVkJykge1xuICAgICAgICBvcHRpb25zLl9leHBvcnRpbmcgPSB0cnVlO1xuICAgICAgICBvcHRpb25zLnVzZUNDT04gPSBmYWxzZTtcbiAgICAgICAgYnVpbGRlciA9IG5ldyBDb21waWxlZEJ1aWxkZXIob3B0aW9ucyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBidWlsZGVyID0gbmV3IER5bmFtaWNCdWlsZGVyKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBQYXJzZXIoYnVpbGRlciwgb3B0aW9ucyk7XG4gICAgcGFyc2VyLnBhcnNlKG9iaik7XG4gICAgb2JqID0gbnVsbDtcblxuICAgIHJldHVybiBidWlsZGVyLmR1bXAoKTtcbn1cbiJdfQ==