"use strict";
// 实现序列化的运行时数据格式
// 参考文档：https://github.com/cocos-creator/3d-tasks/tree/master/design-docs/data-structure/data-structures-serialization.md
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
exports.FORMAT_VERSION = void 0;
exports.reduceEmptyArray = reduceEmptyArray;
exports.getRootData = getRootData;
const cc_1 = require("cc");
const cc = __importStar(require("cc"));
const serialization_1 = require("cc/editor/serialization");
const types_1 = require("./types");
const create_class_mask_1 = __importDefault(require("./create-class-mask"));
const base_builder_1 = require("../base-builder");
const { EMPTY_PLACEHOLDER, CUSTOM_OBJ_DATA_CLASS, CUSTOM_OBJ_DATA_CONTENT, } = cc_1.deserialize._macros;
exports.FORMAT_VERSION = 1;
// 序列化为任意值即可，反序列化时才会解析出来的对象
const INNER_OBJ_PLACEHOLDER = 0;
var RefsBuilder;
(function (RefsBuilder) {
    class Impl {
        beforeOffsetRefs = new Array();
        afterOffsetRefs = new Array();
        ctx;
        constructor(ctx) {
            this.ctx = ctx;
        }
        addRef(owner, key, target) {
            const canRefDirectly = (target.instanceIndex < owner.instanceIndex);
            if (canRefDirectly) {
                return target.instanceIndex;
            }
            const record = [NaN, key, target.instanceIndex];
            if (owner.indexed) {
                record[0 /* Refs.OWNER_OFFSET */] = owner.instanceIndex;
                this.afterOffsetRefs.push(record);
                return NaN;
            }
            else {
                record[0 /* Refs.OWNER_OFFSET */] = INNER_OBJ_PLACEHOLDER;
                this.beforeOffsetRefs.push(record);
                // 返回对象需要在反序列化过程中赋值给 refs 数组的索引（运行时索引会 * 3）
                return ~(this.beforeOffsetRefs.length - 1);
            }
        }
        build() {
            if (this.beforeOffsetRefs.length === 0 && this.afterOffsetRefs.length === 0) {
                return null;
            }
            const offset = this.beforeOffsetRefs.length;
            const allRefs = this.beforeOffsetRefs.concat(this.afterOffsetRefs);
            const res = new Array(allRefs.length * 3 /* Refs.EACH_RECORD_LENGTH */ + 1);
            let i = 0;
            for (const ref of allRefs) {
                res[i++] = ref[0 /* Refs.OWNER_OFFSET */];
                const key = ref[1 /* Refs.KEY_OFFSET */];
                if (typeof key === 'number') {
                    res[i++] = ~key;
                }
                else {
                    this.ctx.sharedStrings.traceString(key, res, i++);
                }
                res[i++] = ref[2 /* Refs.TARGET_OFFSET */];
            }
            res[i] = offset;
            return res;
        }
    }
    RefsBuilder.Impl = Impl;
})(RefsBuilder || (RefsBuilder = {}));
function reduceEmptyArray(array) {
    return (array && array.length > 0) ? array : EMPTY_PLACEHOLDER;
}
class CompiledBuilder extends base_builder_1.Builder {
    noNativeDep;
    sharedUuids = new types_1.TraceableDict();
    sharedStrings = new types_1.TraceableDict();
    refsBuilder;
    // 缓存资源使用情况
    // [item1, key1, uuid1, item2, key2, uuid2, ...]
    dependAssets = new Array();
    rootNode;
    normalNodes = new Array();
    advancedNodes = new Array();
    classNodes = new Array();
    data = new Array(11 /* File.ARRAY_LENGTH */);
    constructor(options) {
        super(options);
        if (options.forceInline) {
            throw new Error('CompiledBuilder doesn\'t support `forceInline`');
        }
        this.noNativeDep = !!('noNativeDep' in options ? options.noNativeDep : true);
        this.refsBuilder = new RefsBuilder.Impl(this);
    }
    // Object Nodes，将来如有复用则会变成 InstanceRef
    setProperty_Array(owner, ownerInfo, key, options) {
        const node = new types_1.ArrayNode(options.writeOnlyArray.length);
        this.advancedNodes.push(node);
        this.setDynamicProperty(ownerInfo, key, node);
        return node;
    }
    setProperty_Dict(owner, ownerInfo, key, options) {
        const node = new types_1.DictNode();
        this.advancedNodes.push(node);
        this.setDynamicProperty(ownerInfo, key, node);
        return node;
    }
    setProperty_Class(owner, ownerInfo, key, options) {
        const node = new types_1.ClassNode(options.type);
        this.normalNodes.push(node);
        this.classNodes.push(node);
        this.setDynamicProperty(ownerInfo, key, node);
        return node;
    }
    setProperty_CustomizedClass(owner, ownerInfo, key, options) {
        const node = new types_1.CustomClassNode(options.type, options.content);
        this.advancedNodes.push(node);
        this.classNodes.push(node);
        this.setDynamicProperty(ownerInfo, key, node);
        return node;
    }
    // parsed
    setProperty_ParsedObject(ownerInfo, key, valueInfo, formerlySerializedAs) {
        ownerInfo.setDynamic(valueInfo, key);
    }
    // Static Values
    setProperty_Raw(owner, ownerInfo, key, value, options) {
        ownerInfo.setStatic(key, 0 /* DataTypeID.SimpleType */, value);
    }
    setProperty_ValueType(owner, ownerInfo, key, value, options) {
        if (!ownerInfo) {
            throw new Error('CompiledBulider: Not support serializing ValueType as root object.');
        }
        const data = (0, serialization_1.serializeBuiltinValueType)(value);
        if (!data) {
            // not built-in value type, just serialize as normal class
            return null;
        }
        let dataTypeID = 8 /* DataTypeID.ValueType */;
        if (options && options.defaultValue instanceof cc.ValueType) {
            dataTypeID = 5 /* DataTypeID.ValueTypeCreated */;
        }
        ownerInfo.setStatic(key, dataTypeID, data);
        return data;
    }
    setProperty_TypedArray(owner, ownerInfo, key, value, options) {
        if (!(owner instanceof cc.Node) || key !== '_trs') {
            throw new Error('Not support to serialize TypedArray yet. Can only use TypedArray in TRS.');
        }
        if (value.length !== 10) {
            throw new Error(`TRS ${value} should contains 10 elements.`);
        }
        const data = Array.from(value);
        ownerInfo.setStatic(key, 7 /* DataTypeID.TRS */, data);
    }
    setProperty_AssetUuid(owner, ownerInfo, key, uuid, options) {
        // 先缓存到 dependAssets，最后 ownerItem 如做为嵌套对象将改成 AssetRefByInnerObj
        const ownerNode = ownerInfo;
        this.dependAssets.push(ownerNode, key, uuid);
        if (ownerNode instanceof types_1.CustomClassNode) {
            ownerNode.shouldBeIndexed = true;
        }
    }
    setRoot(objInfo) {
        this.rootNode = objInfo;
    }
    // markAsSharedObj (obj: any): void {}
    setDynamicProperty(ownerInfo, key, node) {
        ownerInfo && ownerInfo.setDynamic(node, key);
    }
    collectInstances() {
        this.normalNodes = this.normalNodes.filter((x) => x.refCount > 1);
        this.normalNodes.sort(types_1.Node.compareByRefCount);
        this.advancedNodes = this.advancedNodes.filter((x) => x.shouldBeIndexed || x.refCount > 1);
        this.advancedNodes.sort(types_1.Node.compareByRefCount);
        const rootNode = this.rootNode;
        if (rootNode instanceof types_1.ClassNode) {
            // root is normal
            const rootIndex = this.normalNodes.indexOf(rootNode);
            if (rootIndex !== -1) {
                this.normalNodes.splice(rootIndex, 1);
            }
            else {
                // root.refCount <= 1
            }
            this.normalNodes.unshift(rootNode);
        }
        else {
            // root is advanced
            // @ts-ignore
            const rootIndex = this.advancedNodes.indexOf(rootNode);
            if (rootIndex === -1) {
                // root.refCount <= 1
                this.advancedNodes.length;
                // @ts-ignore
                this.advancedNodes.push(rootNode);
            }
        }
        const normalCount = this.normalNodes.length;
        for (let i = 0; i < normalCount; ++i) {
            const obj = this.normalNodes[i];
            obj.instanceIndex = i;
            obj.indexed = true;
        }
        for (let i = 0; i < this.advancedNodes.length; ++i) {
            const obj = this.advancedNodes[i];
            obj.instanceIndex = normalCount + i;
            obj.indexed = true;
        }
        // TODO - 数组尽量特化为 Array_InstanceRef 以加快反序列化性能（但是又会增加索引数量及索引类型）
        // TODO - 分析引用关系，让相互引用的对象尽量同时反序列化，提升内存命中率。
        // TODO - 分析引用关系，让被依赖的对象尽量提前序列化，减少 refs 数据量的开销（多生成 owner、key 的索引），以及设置内嵌对象实例到 owner 的开销
    }
    // 生成 Instances
    dumpInstances() {
        const objCount = this.normalNodes.length + this.advancedNodes.length;
        const instances = new Array(objCount);
        const normalCount = this.normalNodes.length;
        for (let i = 0; i < normalCount; ++i) {
            const obj = this.normalNodes[i];
            instances[i] = obj.dumpRecursively(this.refsBuilder);
        }
        for (let i = 0; i < this.advancedNodes.length; ++i) {
            const obj = this.advancedNodes[i];
            const dumped = obj.dumpRecursively(this.refsBuilder);
            if (obj instanceof types_1.CustomClassNode) {
                instances[normalCount + i] = dumped[CUSTOM_OBJ_DATA_CONTENT];
            }
            else {
                instances[normalCount + i] = dumped;
            }
        }
        if (this.rootNode.instanceIndex !== 0 ||
            typeof instances[instances.length - 1] === 'number' || // 防止最后一个数字被错当 rootInfo
            !this.noNativeDep) {
            const rootIndex = this.rootNode.instanceIndex;
            instances.push(this.noNativeDep ? rootIndex : ~rootIndex);
        }
        this.data[5 /* File.Instances */] = instances;
    }
    // 生成 InstanceTypes
    dumpInstanceTypes() {
        const instanceTypes = this.advancedNodes.map((x) => {
            if (x instanceof types_1.CustomClassNode) {
                return x.dumped[CUSTOM_OBJ_DATA_CLASS];
            }
            else {
                return ~x.selfType;
            }
        });
        this.data[6 /* File.InstanceTypes */] = reduceEmptyArray(instanceTypes);
    }
    dumpDependUuids() {
        const innerDepends = {
            owners: new Array(),
            keys: new Array(),
            uuids: new Array(),
        };
        const indexedDepends = {
            owners: new Array(),
            keys: new Array(),
            uuids: new Array(),
        };
        const array = this.dependAssets;
        for (let i = 0; i < array.length; i += 3) {
            const owner = array[i];
            let key = array[i + 1];
            const uuid = array[i + 2];
            let depends;
            if (owner.indexed) {
                depends = indexedDepends;
                owner.setAssetRefPlaceholderOnIndexed(key);
                depends.owners.push(owner.instanceIndex);
            }
            else {
                depends = innerDepends;
                owner.setStatic(key, 6 /* DataTypeID.AssetRefByInnerObj */, depends.owners.length);
                depends.owners.push(INNER_OBJ_PLACEHOLDER);
            }
            if (typeof key === 'number') {
                key = ~key;
            }
            depends.keys.push(key);
            depends.uuids.push(uuid);
        }
        this.data[8 /* File.DependObjs */] = innerDepends.owners.concat(indexedDepends.owners);
        const allKeys = this.data[9 /* File.DependKeys */] = innerDepends.keys.concat(indexedDepends.keys);
        for (let i = 0; i < allKeys.length; ++i) {
            const key = allKeys[i];
            if (typeof key === 'string') {
                this.sharedStrings.traceString(key, allKeys, i);
            }
        }
        const allUuids = this.data[10 /* File.DependUuidIndices */] = innerDepends.uuids.concat(indexedDepends.uuids);
        for (let i = 0; i < allUuids.length; ++i) {
            const uuid = allUuids[i];
            this.sharedUuids.traceString(uuid, allUuids, i);
        }
    }
    finalizeJsonPart() {
        // 1. 遍历所有对象，将 root 和所有引用数超过 1 的对象放到 instances 中，同时将数据转换成引用
        // （如果已经在 instances 中则跳过）
        this.collectInstances();
        // 2. 生成资源依赖关系
        this.dumpDependUuids();
        // 3. 生成所有对象数据
        this.dumpInstances();
        this.data[0 /* File.Version */] = exports.FORMAT_VERSION;
        // data[File.SharedUuids] = this.dependSharedUuids.dump();
        // data[File.SharedStrings] = this.sharedStrings.dump();
        // 4. 生成 SharedClasses 和 SharedMasks
        const { sharedClasses, sharedMasks } = (0, create_class_mask_1.default)(this.classNodes);
        this.data[3 /* File.SharedClasses */] = sharedClasses;
        this.data[4 /* File.SharedMasks */] = reduceEmptyArray(sharedMasks);
        // 5. 写入 instance 对象类型
        this.dumpInstanceTypes();
        this.data[7 /* File.Refs */] = this.refsBuilder.build() || EMPTY_PLACEHOLDER;
        const strings = this.sharedStrings.dump();
        this.data[2 /* File.SharedStrings */] = reduceEmptyArray(strings);
        const uuids = this.sharedUuids.dump();
        this.data[1 /* File.SharedUuids */] = reduceEmptyArray(uuids);
        return this.data;
    }
}
exports.default = CompiledBuilder;
function getRootData(data) {
    const instances = data[5 /* File.Instances */];
    if (Array.isArray(instances)) {
        const rootInfo = instances[instances.length - 1];
        if (typeof rootInfo === 'number') {
            return instances[rootInfo >= 0 ? rootInfo : ~rootInfo];
        }
        else {
            return instances[0];
        }
    }
    else {
        return instances;
    }
}
