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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy91dGlscy9zZXJpYWxpemUvY29tcGlsZWQvYnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsZ0JBQWdCO0FBQ2hCLHlIQUF5SDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0h6SCw0Q0FFQztBQThTRCxrQ0FjQztBQTlhRCwyQkFHWTtBQUNaLHVDQUF5QjtBQUN6QiwyREFFaUM7QUFFakMsbUNBQTZHO0FBUTdHLDRFQUE4QztBQWE5QyxrREFBMkQ7QUFJM0QsTUFBTSxFQUNGLGlCQUFpQixFQUNqQixxQkFBcUIsRUFDckIsdUJBQXVCLEdBQzFCLEdBQUcsZ0JBQVcsQ0FBQyxPQUFPLENBQUM7QUFFWCxRQUFBLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFFaEMsMkJBQTJCO0FBQzNCLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxDQUFDO0FBRWhDLElBQVUsV0FBVyxDQWlFcEI7QUFqRUQsV0FBVSxXQUFXO0lBV2pCLE1BQWEsSUFBSTtRQUNMLGdCQUFnQixHQUFHLElBQUksS0FBSyxFQUFhLENBQUM7UUFDMUMsZUFBZSxHQUFHLElBQUksS0FBSyxFQUFhLENBQUM7UUFDekMsR0FBRyxDQUFrQjtRQUU3QixZQUFZLEdBQW9CO1lBQzVCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ25CLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBVyxFQUFFLEdBQW9CLEVBQUUsTUFBWTtZQUNsRCxNQUFNLGNBQWMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3BFLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sTUFBTSxDQUFDLGFBQWEsQ0FBQztZQUNoQyxDQUFDO1lBRUQsTUFBTSxNQUFN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Q3RDLElBQUksQ0FBQyxJQUFJLDBCQUFrQixHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXRELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNyQixDQUFDO0NBQ0o7QUExU0Qsa0NBMFNDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLElBQWU7SUFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQztJQUN2QyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUMzQixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNqRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQy9CLE9BQU8sU0FBUyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzRCxDQUFDO2FBQ0ksQ0FBQztZQUNGLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO1NBQ0ksQ0FBQztRQUNGLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyDlrp7njrDluo/liJfljJbnmoTov5DooYzml7bmlbDmja7moLzlvI9cbi8vIOWPguiAg+aWh+aho++8mmh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy1jcmVhdG9yLzNkLXRhc2tzL3RyZWUvbWFzdGVyL2Rlc2lnbi1kb2NzL2RhdGEtc3RydWN0dXJlL2RhdGEtc3RydWN0dXJlcy1zZXJpYWxpemF0aW9uLm1kXG5cbmltcG9ydCB7XG4gICAgVmFsdWVUeXBlLFxuICAgIGRlc2VyaWFsaXplLFxufSBmcm9tICdjYyc7XG5pbXBvcnQgKiBhcyBjYyBmcm9tICdjYyc7XG5pbXBvcnQge1xuICAgIHNlcmlhbGl6ZUJ1aWx0aW5WYWx1ZVR5cGUsXG59IGZyb20gJ2NjL2VkaXRvci9zZXJpYWxpemF0aW9uJztcblxuaW1wb3J0IHsgQXJyYXlOb2RlLCBOb2RlLCBDbGFzc05vZGUsIEN1c3RvbUNsYXNzTm9kZSwgRGljdE5vZGUsIElSZWZzQnVpbGRlciwgVHJhY2VhYmxlRGljdCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtcbiAgICBQcm9wZXJ0eU9wdGlvbnMsXG4gICAgSUFycmF5T3B0aW9ucyxcbiAgICBJQ2xhc3NPcHRpb25zLFxuICAgIElDdXN0b21DbGFzc09wdGlvbnMsXG4gICAgSU9ialBhcnNpbmdJbmZvLFxufSBmcm9tICcuLi9wYXJzZXInO1xuaW1wb3J0IGR1bXBDbGFzc2VzIGZyb20gJy4vY3JlYXRlLWNsYXNzLW1hc2snO1xuXG4vLyBpbXBvcnQgZGVzZXJpYWxpemVyIHR5cGVzXG5pbXBvcnQgRCA9IGRlc2VyaWFsaXplLkludGVybmFsO1xudHlwZSBFbXB0eSA9IEQuRW1wdHlfO1xuaW1wb3J0IERhdGFUeXBlSUQgPSBELkRhdGFUeXBlSURfO1xuaW1wb3J0IEZpbGUgPSBELkZpbGVfO1xudHlwZSBJQ3VzdG9tT2JqZWN0RGF0YSA9IEQuSUN1c3RvbU9iamVjdERhdGFfO1xudHlwZSBJRmlsZURhdGEgPSBELklGaWxlRGF0YV87XG50eXBlIEluc3RhbmNlSW5kZXggPSBELkluc3RhbmNlSW5kZXhfO1xudHlwZSBJUmVmcyA9IEQuSVJlZnNfO1xudHlwZSBJVFJTRGF0YSA9IEQuSVRSU0RhdGFfO1xuaW1wb3J0IFJlZnMgPSBELlJlZnNfO1xuaW1wb3J0IHsgQnVpbGRlciwgSUJ1aWxkZXJPcHRpb25zIH0gZnJvbSAnLi4vYmFzZS1idWlsZGVyJztcbnR5cGUgU2hhcmVkU3RyaW5nID0gRC5TaGFyZWRTdHJpbmdfO1xudHlwZSBBbnlDQ0NsYXNzID0gRC5BbnlDQ0NsYXNzXztcblxuY29uc3Qge1xuICAgIEVNUFRZX1BMQUNFSE9MREVSLFxuICAgIENVU1RPTV9PQkpfREFUQV9DTEFTUyxcbiAgICBDVVNUT01fT0JKX0RBVEFfQ09OVEVOVCxcbn0gPSBkZXNlcmlhbGl6ZS5fbWFjcm9zO1xuXG5leHBvcnQgY29uc3QgRk9STUFUX1ZFUlNJT04gPSAxO1xuXG4vLyDluo/liJfljJbkuLrku7vmhI/lgLzljbPlj6/vvIzlj43luo/liJfljJbml7bmiY3kvJrop6PmnpDlh7rmnaXnmoTlr7nosaFcbmNvbnN0IElOTkVSX09CSl9QTEFDRUhPTERFUiA9IDA7XG5cbm5hbWVzcGFjZSBSZWZzQnVpbGRlciB7XG5cbiAgICB0eXBlIFJlZlJlY29yZCA9IFtcbiAgICAgICAgLy8gW1JlZnMuT1dORVJfT0ZGU0VUXSAtIOiwgeaMh+WQkeebruagh+WvueixoVxuICAgICAgICBJbnN0YW5jZUluZGV4LFxuICAgICAgICAvLyBbUmVmcy5LRVlfT0ZGU0VUXSAtIOaMh+WQkeebruagh+WvueixoeeahOWxnuaAp+WQjeaIluiAheaVsOe7hOe0ouW8lVxuICAgICAgICBzdHJpbmcgfCBudW1iZXIsXG4gICAgICAgIC8vIFtSZWZzLlRBUkdFVF9PRkZTRVRdIC0g5oyH5ZCR55qE55uu5qCH5a+56LGhXG4gICAgICAgIEluc3RhbmNlSW5kZXhcbiAgICBdO1xuXG4gICAgZXhwb3J0IGNsYXNzIEltcGwgaW1wbGVtZW50cyBJUmVmc0J1aWxkZXIge1xuICAgICAgICBwcml2YXRlIGJlZm9yZU9mZnNldFJlZnMgPSBuZXcgQXJyYXk8UmVmUmVjb3JkPigpO1xuICAgICAgICBwcml2YXRlIGFmdGVyT2Zmc2V0UmVmcyA9IG5ldyBBcnJheTxSZWZSZWNvcmQ+KCk7XG4gICAgICAgIHByaXZhdGUgY3R4OiBDb21waWxlZEJ1aWxkZXI7XG5cbiAgICAgICAgY29uc3RydWN0b3IoY3R4OiBDb21waWxlZEJ1aWxkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY3R4ID0gY3R4O1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkUmVmKG93bmVyOiBOb2RlLCBrZXk6IHN0cmluZyB8IG51bWJlciwgdGFyZ2V0OiBOb2RlKTogbnVtYmVyIHtcbiAgICAgICAgICAgIGNvbnN0IGNhblJlZkRpcmVjdGx5ID0gKHRhcmdldC5pbnN0YW5jZUluZGV4IDwgb3duZXIuaW5zdGFuY2VJbmRleCk7XG4gICAgICAgICAgICBpZiAoY2FuUmVmRGlyZWN0bHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0Lmluc3RhbmNlSW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlY29yZCA9IFtOYU4sIGtleSwgdGFyZ2V0Lmluc3RhbmNlSW5kZXhdIGFzIFJlZlJlY29yZDtcblxuICAgICAgICAgICAgaWYgKG93bmVyLmluZGV4ZWQpIHtcbiAgICAgICAgICAgICAgICByZWNvcmRbUmVmcy5PV05FUl9PRkZTRVRdID0gb3duZXIuaW5zdGFuY2VJbmRleDtcbiAgICAgICAgICAgICAgICB0aGlzLmFmdGVyT2Zmc2V0UmVmcy5wdXNoKHJlY29yZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5hTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlY29yZFtSZWZzLk9XTkVSX09GRlNFVF0gPSBJTk5FUl9PQkpfUExBQ0VIT0xERVI7XG4gICAgICAgICAgICAgICAgdGhpcy5iZWZvcmVPZmZzZXRSZWZzLnB1c2gocmVjb3JkKTtcbiAgICAgICAgICAgICAgICAvLyDov5Tlm57lr7nosaHpnIDopoHlnKjlj43luo/liJfljJbov4fnqIvkuK3otYvlgLznu5kgcmVmcyDmlbDnu4TnmoTntKLlvJXvvIjov5DooYzml7bntKLlvJXkvJogKiAz77yJXG4gICAgICAgICAgICAgICAgcmV0dXJuIH4odGhpcy5iZWZvcmVPZmZzZXRSZWZzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGQoKTogSVJlZnMgfCBudWxsIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmJlZm9yZU9mZnNldFJlZnMubGVuZ3RoID09PSAwICYmIHRoaXMuYWZ0ZXJPZmZzZXRSZWZzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5iZWZvcmVPZmZzZXRSZWZzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGFsbFJlZnMgPSB0aGlzLmJlZm9yZU9mZnNldFJlZnMuY29uY2F0KHRoaXMuYWZ0ZXJPZmZzZXRSZWZzKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IG5ldyBBcnJheTxudW1iZXI+KGFsbFJlZnMubGVuZ3RoICogUmVmcy5FQUNIX1JFQ09SRF9MRU5HVEggKyAxKTtcblxuICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgZm9yIChjb25zdCByZWYgb2YgYWxsUmVmcykge1xuICAgICAgICAgICAgICAgIHJlc1tpKytdID0gcmVmW1JlZnMuT1dORVJfT0ZGU0VUXTtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSByZWZbUmVmcy5LRVlfT0ZGU0VUXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW2krK10gPSB+a2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHguc2hhcmVkU3RyaW5ncy50cmFjZVN0cmluZyhrZXksIHJlcywgaSsrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzW2krK10gPSByZWZbUmVmcy5UQVJHRVRfT0ZGU0VUXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc1tpXSA9IG9mZnNldDtcbiAgICAgICAgICAgIHJldHVybiByZXMgYXMgSVJlZnM7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VFbXB0eUFycmF5PFQgZXh0ZW5kcyBhbnlbXT4oYXJyYXk6IFQpOiBUIHwgRW1wdHkge1xuICAgIHJldHVybiAoYXJyYXkgJiYgYXJyYXkubGVuZ3RoID4gMCkgPyBhcnJheSA6IEVNUFRZX1BMQUNFSE9MREVSO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxlZEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyIHtcbiAgICBub05hdGl2ZURlcDogYm9vbGVhbjtcblxuICAgIHNoYXJlZFV1aWRzID0gbmV3IFRyYWNlYWJsZURpY3Q8U2hhcmVkU3RyaW5nPigpO1xuICAgIHNoYXJlZFN0cmluZ3MgPSBuZXcgVHJhY2VhYmxlRGljdDxTaGFyZWRTdHJpbmc+KCk7XG5cbiAgICByZWZzQnVpbGRlcjogUmVmc0J1aWxkZXIuSW1wbDtcblxuICAgIC8vIOe8k+WtmOi1hOa6kOS9v+eUqOaDheWGtVxuICAgIC8vIFtpdGVtMSwga2V5MSwgdXVpZDEsIGl0ZW0yLCBrZXkyLCB1dWlkMiwgLi4uXVxuICAgIGRlcGVuZEFzc2V0cyA9IG5ldyBBcnJheTxOb2RlIHwgc3RyaW5nIHwgbnVtYmVyPigpO1xuXG4gICAgcHJpdmF0ZSByb290Tm9kZTogTm9kZSB8IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIG5vcm1hbE5vZGVzID0gbmV3IEFycmF5PENsYXNzTm9kZT4oKTtcbiAgICBwcml2YXRlIGFkdmFuY2VkTm9kZXMgPSBuZXcgQXJyYXk8Q3VzdG9tQ2xhc3NOb2RlIHwgQXJyYXlOb2RlIHwgRGljdE5vZGU+KCk7XG4gICAgcHJpdmF0ZSBjbGFzc05vZGVzID0gbmV3IEFycmF5PENsYXNzTm9kZSB8IEN1c3RvbUNsYXNzTm9kZT4oKTtcblxuICAgIHByaXZhdGUgZGF0YSA9IG5ldyBBcnJheTxhbnk+KEZpbGUuQVJSQVlfTEVOR1RIKSBhcyBJRmlsZURhdGE7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJQnVpbGRlck9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZm9yY2VJbmxpbmUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tcGlsZWRCdWlsZGVyIGRvZXNuXFwndCBzdXBwb3J0IGBmb3JjZUlubGluZWAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubm9OYXRpdmVEZXAgPSAhISgnbm9OYXRpdmVEZXAnIGluIG9wdGlvbnMgPyBvcHRpb25zLm5vTmF0aXZlRGVwIDogdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5yZWZzQnVpbGRlciA9IG5ldyBSZWZzQnVpbGRlci5JbXBsKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIE9iamVjdCBOb2Rlc++8jOWwhuadpeWmguacieWkjeeUqOWImeS8muWPmOaIkCBJbnN0YW5jZVJlZlxuXG4gICAgc2V0UHJvcGVydHlfQXJyYXkob3duZXI6IG9iamVjdCB8IG51bGwsIG93bmVySW5mbzogSU9ialBhcnNpbmdJbmZvIHwgbnVsbCwga2V5OiBzdHJpbmcgfCBudW1iZXIsIG9wdGlvbnM6IElBcnJheU9wdGlvbnMpOiBJT2JqUGFyc2luZ0luZm8ge1xuICAgICAgICBjb25zdCBub2RlID0gbmV3IEFycmF5Tm9kZShvcHRpb25zLndyaXRlT25seUFycmF5Lmxlbmd0aCk7XG4gICAgICAgIHRoaXMuYWR2YW5jZWROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB0aGlzLnNldER5bmFtaWNQcm9wZXJ0eShvd25lckluZm8sIGtleSwgbm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHNldFByb3BlcnR5X0RpY3Qob3duZXI6IG9iamVjdCB8IG51bGwsIG93bmVySW5mbzogSU9ialBhcnNpbmdJbmZvIHwgbnVsbCwga2V5OiBzdHJpbmcgfCBudW1iZXIsIG9wdGlvbnM6IFByb3BlcnR5T3B0aW9ucyk6IElPYmpQYXJzaW5nSW5mbyB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgRGljdE5vZGUoKTtcbiAgICAgICAgdGhpcy5hZHZhbmNlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIHRoaXMuc2V0RHluYW1pY1Byb3BlcnR5KG93bmVySW5mbywga2V5LCBub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgc2V0UHJvcGVydHlfQ2xhc3Mob3duZXI6IG9iamVjdCB8IG51bGwsIG93bmVySW5mbzogSU9ialBhcnNpbmdJbmZvIHwgbnVsbCwga2V5OiBzdHJpbmcgfCBudW1iZXIsIG9wdGlvbnM6IElDbGFzc09wdGlvbnMpOiBJT2JqUGFyc2luZ0luZm8ge1xuICAgICAgICBjb25zdCBub2RlID0gbmV3IENsYXNzTm9kZShvcHRpb25zLnR5cGUpO1xuICAgICAgICB0aGlzLm5vcm1hbE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIHRoaXMuY2xhc3NOb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB0aGlzLnNldER5bmFtaWNQcm9wZXJ0eShvd25lckluZm8sIGtleSwgbm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHNldFByb3BlcnR5X0N1c3RvbWl6ZWRDbGFzcyhvd25lcjogb2JqZWN0IHwgbnVsbCwgb3duZXJJbmZvOiBJT2JqUGFyc2luZ0luZm8gfCBudWxsLCBrZXk6IHN0cmluZyB8IG51bWJlciwgb3B0aW9uczogSUN1c3RvbUNsYXNzT3B0aW9ucyk6IElPYmpQYXJzaW5nSW5mbyB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgQ3VzdG9tQ2xhc3NOb2RlKG9wdGlvbnMudHlwZSwgb3B0aW9ucy5jb250ZW50KTtcbiAgICAgICAgdGhpcy5hZHZhbmNlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIHRoaXMuY2xhc3NOb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB0aGlzLnNldER5bmFtaWNQcm9wZXJ0eShvd25lckluZm8sIGtleSwgbm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIC8vIHBhcnNlZFxuXG4gICAgc2V0UHJvcGVydHlfUGFyc2VkT2JqZWN0KG93bmVySW5mbzogSU9ialBhcnNpbmdJbmZvLCBrZXk6IHN0cmluZyB8IG51bWJlciwgdmFsdWVJbmZvOiBJT2JqUGFyc2luZ0luZm8sIGZvcm1lcmx5U2VyaWFsaXplZEFzOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgICAgIChvd25lckluZm8gYXMgTm9kZSkuc2V0RHluYW1pYygodmFsdWVJbmZvIGFzIE5vZGUpLCBrZXkpO1xuICAgIH1cblxuICAgIC8vIFN0YXRpYyBWYWx1ZXNcblxuICAgIHNldFByb3BlcnR5X1Jhdyhvd25lcjogb2JqZWN0LCBvd25lckluZm86IElPYmpQYXJzaW5nSW5mbywga2V5OiBzdHJpbmcgfCBudW1iZXIsIHZhbHVlOiBhbnksIG9wdGlvbnM6IFByb3BlcnR5T3B0aW9ucyk6IHZvaWQge1xuICAgICAgICAob3duZXJJbmZvIGFzIE5vZGUpLnNldFN0YXRpYyhrZXksIERhdGFUeXBlSUQuU2ltcGxlVHlwZSwgdmFsdWUpO1xuICAgIH1cblxuICAgIHNldFByb3BlcnR5X1ZhbHVlVHlwZShvd25lcjogb2JqZWN0IHwgbnVsbCwgb3duZXJJbmZvOiBJT2JqUGFyc2luZ0luZm8gfCBudWxsLCBrZXk6IHN0cmluZyB8IG51bWJlciwgdmFsdWU6IFZhbHVlVHlwZSwgb3B0aW9uczogUHJvcGVydHlPcHRpb25zKTogSU9ialBhcnNpbmdJbmZvIHwgbnVsbCB7XG4gICAgICAgIGlmICghb3duZXJJbmZvKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbXBpbGVkQnVsaWRlcjogTm90IHN1cHBvcnQgc2VyaWFsaXppbmcgVmFsdWVUeXBlIGFzIHJvb3Qgb2JqZWN0LicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBzZXJpYWxpemVCdWlsdGluVmFsdWVUeXBlKHZhbHVlKTtcbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAvLyBub3QgYnVpbHQtaW4gdmFsdWUgdHlwZSwganVzdCBzZXJpYWxpemUgYXMgbm9ybWFsIGNsYXNzXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGF0YVR5cGVJRCA9IERhdGFUeXBlSUQuVmFsdWVUeXBlO1xuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmRlZmF1bHRWYWx1ZSBpbnN0YW5jZW9mIGNjLlZhbHVlVHlwZSkge1xuICAgICAgICAgICAgZGF0YVR5cGVJRCA9IERhdGFUeXBlSUQuVmFsdWVUeXBlQ3JlYXRlZDtcbiAgICAgICAgfVxuICAgICAgICAob3duZXJJbmZvIGFzIE5vZGUpLnNldFN0YXRpYyhrZXksIGRhdGFUeXBlSUQsIGRhdGEpO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICBzZXRQcm9wZXJ0eV9UeXBlZEFycmF5KG93bmVyOiBvYmplY3QsIG93bmVySW5mbzogSU9ialBhcnNpbmdJbmZvLCBrZXk6IHN0cmluZyB8IG51bWJlciwgdmFsdWU6IGFueSwgb3B0aW9uczogUHJvcGVydHlPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGlmICghKG93bmVyIGluc3RhbmNlb2YgY2MuTm9kZSkgfHwga2V5ICE9PSAnX3RycycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IHN1cHBvcnQgdG8gc2VyaWFsaXplIFR5cGVkQXJyYXkgeWV0LiBDYW4gb25seSB1c2UgVHlwZWRBcnJheSBpbiBUUlMuJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCAhPT0gMTApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVFJTICR7dmFsdWV9IHNob3VsZCBjb250YWlucyAxMCBlbGVtZW50cy5gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkYXRhID0gQXJyYXkuZnJvbSh2YWx1ZSkgYXMgSVRSU0RhdGE7XG4gICAgICAgIChvd25lckluZm8gYXMgTm9kZSkuc2V0U3RhdGljKGtleSwgRGF0YVR5cGVJRC5UUlMsIGRhdGEpO1xuICAgIH1cblxuICAgIHNldFByb3BlcnR5X0Fzc2V0VXVpZChvd25lcjogb2JqZWN0LCBvd25lckluZm86IElPYmpQYXJzaW5nSW5mbywga2V5OiBzdHJpbmcgfCBudW1iZXIsIHV1aWQ6IHN0cmluZywgb3B0aW9uczogUHJvcGVydHlPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIC8vIOWFiOe8k+WtmOWIsCBkZXBlbmRBc3NldHPvvIzmnIDlkI4gb3duZXJJdGVtIOWmguWBmuS4uuW1jOWll+WvueixoeWwhuaUueaIkCBBc3NldFJlZkJ5SW5uZXJPYmpcbiAgICAgICAgY29uc3Qgb3duZXJOb2RlID0gKG93bmVySW5mbyBhcyBOb2RlKTtcbiAgICAgICAgdGhpcy5kZXBlbmRBc3NldHMucHVzaChvd25lck5vZGUsIGtleSwgdXVpZCk7XG4gICAgICAgIGlmIChvd25lck5vZGUgaW5zdGFuY2VvZiBDdXN0b21DbGFzc05vZGUpIHtcbiAgICAgICAgICAgIG93bmVyTm9kZS5zaG91bGRCZUluZGV4ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Um9vdChvYmpJbmZvOiBJT2JqUGFyc2luZ0luZm8pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IG9iakluZm8gYXMgTm9kZTtcbiAgICB9XG5cbiAgICAvLyBtYXJrQXNTaGFyZWRPYmogKG9iajogYW55KTogdm9pZCB7fVxuXG4gICAgcHJpdmF0ZSBzZXREeW5hbWljUHJvcGVydHkob3duZXJJbmZvOiBJT2JqUGFyc2luZ0luZm8gfCBudWxsLCBrZXk6IHN0cmluZyB8IG51bWJlciwgbm9kZTogTm9kZSkge1xuICAgICAgICBvd25lckluZm8gJiYgKG93bmVySW5mbyBhcyBOb2RlKS5zZXREeW5hbWljKG5vZGUsIGtleSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb2xsZWN0SW5zdGFuY2VzKCkge1xuICAgICAgICB0aGlzLm5vcm1hbE5vZGVzID0gdGhpcy5ub3JtYWxOb2Rlcy5maWx0ZXIoKHgpID0+IHgucmVmQ291bnQgPiAxKTtcbiAgICAgICAgdGhpcy5ub3JtYWxOb2Rlcy5zb3J0KE5vZGUuY29tcGFyZUJ5UmVmQ291bnQpO1xuICAgICAgICB0aGlzLmFkdmFuY2VkTm9kZXMgPSB0aGlzLmFkdmFuY2VkTm9kZXMuZmlsdGVyKCh4KSA9PiB4LnNob3VsZEJlSW5kZXhlZCB8fCB4LnJlZkNvdW50ID4gMSk7XG4gICAgICAgIHRoaXMuYWR2YW5jZWROb2Rlcy5zb3J0KE5vZGUuY29tcGFyZUJ5UmVmQ291bnQpO1xuXG4gICAgICAgIGNvbnN0IHJvb3ROb2RlID0gdGhpcy5yb290Tm9kZTtcbiAgICAgICAgaWYgKHJvb3ROb2RlIGluc3RhbmNlb2YgQ2xhc3NOb2RlKSB7XG4gICAgICAgICAgICAvLyByb290IGlzIG5vcm1hbFxuICAgICAgICAgICAgY29uc3Qgcm9vdEluZGV4ID0gdGhpcy5ub3JtYWxOb2Rlcy5pbmRleE9mKHJvb3ROb2RlKTtcbiAgICAgICAgICAgIGlmIChyb290SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3JtYWxOb2Rlcy5zcGxpY2Uocm9vdEluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJvb3QucmVmQ291bnQgPD0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ub3JtYWxOb2Rlcy51bnNoaWZ0KHJvb3ROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHJvb3QgaXMgYWR2YW5jZWRcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHJvb3RJbmRleCA9IHRoaXMuYWR2YW5jZWROb2Rlcy5pbmRleE9mKHJvb3ROb2RlKTtcbiAgICAgICAgICAgIGlmIChyb290SW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gcm9vdC5yZWZDb3VudCA8PSAxXG4gICAgICAgICAgICAgICAgdGhpcy5hZHZhbmNlZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgdGhpcy5hZHZhbmNlZE5vZGVzLnB1c2gocm9vdE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsQ291bnQgPSB0aGlzLm5vcm1hbE5vZGVzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub3JtYWxDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLm5vcm1hbE5vZGVzW2ldO1xuICAgICAgICAgICAgb2JqLmluc3RhbmNlSW5kZXggPSBpO1xuICAgICAgICAgICAgb2JqLmluZGV4ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hZHZhbmNlZE5vZGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLmFkdmFuY2VkTm9kZXNbaV07XG4gICAgICAgICAgICBvYmouaW5zdGFuY2VJbmRleCA9IG5vcm1hbENvdW50ICsgaTtcbiAgICAgICAgICAgIG9iai5pbmRleGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE8gLSDmlbDnu4TlsL3ph4/nibnljJbkuLogQXJyYXlfSW5zdGFuY2VSZWYg5Lul5Yqg5b+r5Y+N5bqP5YiX5YyW5oCn6IO977yI5L2G5piv5Y+I5Lya5aKe5Yqg57Si5byV5pWw6YeP5Y+K57Si5byV57G75Z6L77yJXG4gICAgICAgIC8vIFRPRE8gLSDliIbmnpDlvJXnlKjlhbPns7vvvIzorqnnm7jkupLlvJXnlKjnmoTlr7nosaHlsL3ph4/lkIzml7blj43luo/liJfljJbvvIzmj5DljYflhoXlrZjlkb3kuK3njofjgIJcbiAgICAgICAgLy8gVE9ETyAtIOWIhuaekOW8leeUqOWFs+ezu++8jOiuqeiiq+S+nei1lueahOWvueixoeWwvemHj+aPkOWJjeW6j+WIl+WMlu+8jOWHj+WwkSByZWZzIOaVsOaNrumHj+eahOW8gOmUgO+8iOWkmueUn+aIkCBvd25lcuOAgWtleSDnmoTntKLlvJXvvInvvIzku6Xlj4rorr7nva7lhoXltYzlr7nosaHlrp7kvovliLAgb3duZXIg55qE5byA6ZSAXG4gICAgfVxuXG4gICAgLy8g55Sf5oiQIEluc3RhbmNlc1xuICAgIHByaXZhdGUgZHVtcEluc3RhbmNlcygpIHtcbiAgICAgICAgY29uc3Qgb2JqQ291bnQgPSB0aGlzLm5vcm1hbE5vZGVzLmxlbmd0aCArIHRoaXMuYWR2YW5jZWROb2Rlcy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlcyA9IG5ldyBBcnJheShvYmpDb3VudCk7XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsQ291bnQgPSB0aGlzLm5vcm1hbE5vZGVzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub3JtYWxDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLm5vcm1hbE5vZGVzW2ldO1xuICAgICAgICAgICAgaW5zdGFuY2VzW2ldID0gb2JqLmR1bXBSZWN1cnNpdmVseSh0aGlzLnJlZnNCdWlsZGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hZHZhbmNlZE5vZGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLmFkdmFuY2VkTm9kZXNbaV07XG4gICAgICAgICAgICBjb25zdCBkdW1wZWQgPSBvYmouZHVtcFJlY3Vyc2l2ZWx5KHRoaXMucmVmc0J1aWxkZXIpO1xuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEN1c3RvbUNsYXNzTm9kZSkge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlc1tub3JtYWxDb3VudCArIGldID0gKGR1bXBlZCBhcyBJQ3VzdG9tT2JqZWN0RGF0YSlbQ1VTVE9NX09CSl9EQVRBX0NPTlRFTlRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzW25vcm1hbENvdW50ICsgaV0gPSBkdW1wZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKHRoaXMucm9vdE5vZGUgYXMgTm9kZSkuaW5zdGFuY2VJbmRleCAhPT0gMCB8fFxuICAgICAgICAgICAgdHlwZW9mIGluc3RhbmNlc1tpbnN0YW5jZXMubGVuZ3RoIC0gMV0gPT09ICdudW1iZXInIHx8IC8vIOmYsuatouacgOWQjuS4gOS4quaVsOWtl+iiq+mUmeW9kyByb290SW5mb1xuICAgICAgICAgICAgIXRoaXMubm9OYXRpdmVEZXBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCByb290SW5kZXggPSAodGhpcy5yb290Tm9kZSBhcyBOb2RlKS5pbnN0YW5jZUluZGV4O1xuICAgICAgICAgICAgaW5zdGFuY2VzLnB1c2godGhpcy5ub05hdGl2ZURlcCA/IHJvb3RJbmRleCA6IH5yb290SW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kYXRhW0ZpbGUuSW5zdGFuY2VzXSA9IGluc3RhbmNlcztcbiAgICB9XG5cbiAgICAvLyDnlJ/miJAgSW5zdGFuY2VUeXBlc1xuICAgIHByaXZhdGUgZHVtcEluc3RhbmNlVHlwZXMoKSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlVHlwZXMgPSB0aGlzLmFkdmFuY2VkTm9kZXMubWFwKCh4KSA9PiB7XG4gICAgICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEN1c3RvbUNsYXNzTm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoeC5kdW1wZWQgYXMgSUN1c3RvbU9iamVjdERhdGEpW0NVU1RPTV9PQkpfREFUQV9DTEFTU107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gfnguc2VsZlR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRhdGFbRmlsZS5JbnN0YW5jZVR5cGVzXSA9IHJlZHVjZUVtcHR5QXJyYXkoaW5zdGFuY2VUeXBlcyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkdW1wRGVwZW5kVXVpZHMoKSB7XG4gICAgICAgIGNvbnN0IGlubmVyRGVwZW5kcyA9IHtcbiAgICAgICAgICAgIG93bmVyczogbmV3IEFycmF5PG51bWJlcj4oKSxcbiAgICAgICAgICAgIGtleXM6IG5ldyBBcnJheTxzdHJpbmcgfCBudW1iZXI+KCksXG4gICAgICAgICAgICB1dWlkczogbmV3IEFycmF5PHN0cmluZz4oKSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgaW5kZXhlZERlcGVuZHMgPSB7XG4gICAgICAgICAgICBvd25lcnM6IG5ldyBBcnJheTxJbnN0YW5jZUluZGV4PigpLFxuICAgICAgICAgICAga2V5czogbmV3IEFycmF5PHN0cmluZyB8IG51bWJlcj4oKSxcbiAgICAgICAgICAgIHV1aWRzOiBuZXcgQXJyYXk8c3RyaW5nPigpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGFycmF5ID0gdGhpcy5kZXBlbmRBc3NldHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIGNvbnN0IG93bmVyID0gYXJyYXlbaV0gYXMgTm9kZTtcbiAgICAgICAgICAgIGxldCBrZXkgPSBhcnJheVtpICsgMV0gYXMgc3RyaW5nIHwgbnVtYmVyO1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGFycmF5W2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICBsZXQgZGVwZW5kcztcbiAgICAgICAgICAgIGlmIChvd25lci5pbmRleGVkKSB7XG4gICAgICAgICAgICAgICAgZGVwZW5kcyA9IGluZGV4ZWREZXBlbmRzO1xuICAgICAgICAgICAgICAgIG93bmVyLnNldEFzc2V0UmVmUGxhY2Vob2xkZXJPbkluZGV4ZWQoa2V5KTtcbiAgICAgICAgICAgICAgICBkZXBlbmRzLm93bmVycy5wdXNoKG93bmVyLmluc3RhbmNlSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVwZW5kcyA9IGlubmVyRGVwZW5kcztcbiAgICAgICAgICAgICAgICBvd25lci5zZXRTdGF0aWMoa2V5LCBEYXRhVHlwZUlELkFzc2V0UmVmQnlJbm5lck9iaiwgZGVwZW5kcy5vd25lcnMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBkZXBlbmRzLm93bmVycy5wdXNoKElOTkVSX09CSl9QTEFDRUhPTERFUik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSB+a2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVwZW5kcy5rZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICAgIGRlcGVuZHMudXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGF0YVtGaWxlLkRlcGVuZE9ianNdID0gaW5uZXJEZXBlbmRzLm93bmVycy5jb25jYXQoaW5kZXhlZERlcGVuZHMub3duZXJzKTtcbiAgICAgICAgY29uc3QgYWxsS2V5cyA9IHRoaXMuZGF0YVtGaWxlLkRlcGVuZEtleXNdID0gaW5uZXJEZXBlbmRzLmtleXMuY29uY2F0KGluZGV4ZWREZXBlbmRzLmtleXMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbEtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGFsbEtleXNbaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXJlZFN0cmluZ3MudHJhY2VTdHJpbmcoa2V5LCBhbGxLZXlzLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhbGxVdWlkcyA9IHRoaXMuZGF0YVtGaWxlLkRlcGVuZFV1aWRJbmRpY2VzXSA9IGlubmVyRGVwZW5kcy51dWlkcy5jb25jYXQoaW5kZXhlZERlcGVuZHMudXVpZHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbFV1aWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gYWxsVXVpZHNbaV07XG4gICAgICAgICAgICB0aGlzLnNoYXJlZFV1aWRzLnRyYWNlU3RyaW5nKHV1aWQsIGFsbFV1aWRzLCBpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZpbmFsaXplSnNvblBhcnQoKTogb2JqZWN0IHwgc3RyaW5nIHtcbiAgICAgICAgLy8gMS4g6YGN5Y6G5omA5pyJ5a+56LGh77yM5bCGIHJvb3Qg5ZKM5omA5pyJ5byV55So5pWw6LaF6L+HIDEg55qE5a+56LGh5pS+5YiwIGluc3RhbmNlcyDkuK3vvIzlkIzml7blsIbmlbDmja7ovazmjaLmiJDlvJXnlKhcbiAgICAgICAgLy8g77yI5aaC5p6c5bey57uP5ZyoIGluc3RhbmNlcyDkuK3liJnot7Pov4fvvIlcbiAgICAgICAgdGhpcy5jb2xsZWN0SW5zdGFuY2VzKCk7XG5cbiAgICAgICAgLy8gMi4g55Sf5oiQ6LWE5rqQ5L6d6LWW5YWz57O7XG4gICAgICAgIHRoaXMuZHVtcERlcGVuZFV1aWRzKCk7XG5cbiAgICAgICAgLy8gMy4g55Sf5oiQ5omA5pyJ5a+56LGh5pWw5o2uXG4gICAgICAgIHRoaXMuZHVtcEluc3RhbmNlcygpO1xuXG4gICAgICAgIHRoaXMuZGF0YVtGaWxlLlZlcnNpb25dID0gRk9STUFUX1ZFUlNJT047XG4gICAgICAgIC8vIGRhdGFbRmlsZS5TaGFyZWRVdWlkc10gPSB0aGlzLmRlcGVuZFNoYXJlZFV1aWRzLmR1bXAoKTtcbiAgICAgICAgLy8gZGF0YVtGaWxlLlNoYXJlZFN0cmluZ3NdID0gdGhpcy5zaGFyZWRTdHJpbmdzLmR1bXAoKTtcblxuICAgICAgICAvLyA0LiDnlJ/miJAgU2hhcmVkQ2xhc3NlcyDlkowgU2hhcmVkTWFza3NcbiAgICAgICAgY29uc3QgeyBzaGFyZWRDbGFzc2VzLCBzaGFyZWRNYXNrcyB9ID0gZHVtcENsYXNzZXModGhpcy5jbGFzc05vZGVzKTtcbiAgICAgICAgdGhpcy5kYXRhW0ZpbGUuU2hhcmVkQ2xhc3Nlc10gPSBzaGFyZWRDbGFzc2VzO1xuICAgICAgICB0aGlzLmRhdGFbRmlsZS5TaGFyZWRNYXNrc10gPSByZWR1Y2VFbXB0eUFycmF5KHNoYXJlZE1hc2tzKTtcblxuICAgICAgICAvLyA1LiDlhpnlhaUgaW5zdGFuY2Ug5a+56LGh57G75Z6LXG4gICAgICAgIHRoaXMuZHVtcEluc3RhbmNlVHlwZXMoKTtcblxuICAgICAgICB0aGlzLmRhdGFbRmlsZS5SZWZzXSA9IHRoaXMucmVmc0J1aWxkZXIuYnVpbGQoKSB8fCBFTVBUWV9QTEFDRUhPTERFUjtcblxuICAgICAgICBjb25zdCBzdHJpbmdzID0gdGhpcy5zaGFyZWRTdHJpbmdzLmR1bXAoKTtcbiAgICAgICAgdGhpcy5kYXRhW0ZpbGUuU2hhcmVkU3RyaW5nc10gPSByZWR1Y2VFbXB0eUFycmF5KHN0cmluZ3MpO1xuXG4gICAgICAgIGNvbnN0IHV1aWRzID0gdGhpcy5zaGFyZWRVdWlkcy5kdW1wKCk7XG4gICAgICAgIHRoaXMuZGF0YVtGaWxlLlNoYXJlZFV1aWRzXSA9IHJlZHVjZUVtcHR5QXJyYXkodXVpZHMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdERhdGEoZGF0YTogSUZpbGVEYXRhKTogSUZpbGVEYXRhW0ZpbGUuSW5zdGFuY2VzXSB7XG4gICAgY29uc3QgaW5zdGFuY2VzID0gZGF0YVtGaWxlLkluc3RhbmNlc107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5zdGFuY2VzKSkge1xuICAgICAgICBjb25zdCByb290SW5mbyA9IGluc3RhbmNlc1tpbnN0YW5jZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmICh0eXBlb2Ygcm9vdEluZm8gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VzW3Jvb3RJbmZvID49IDAgPyByb290SW5mbyA6IH5yb290SW5mb107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VzWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2VzO1xuICAgIH1cbn1cbiJdfQ==