"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomClassNode = exports.ClassNode = exports.DictNode = exports.ArrayNode = exports.Node = exports.TraceableDict = exports.TraceableItem = void 0;
const cc_1 = require("cc");
const { DICT_JSON_LAYOUT, CLASS_TYPE, CLASS_KEYS, CLASS_PROP_TYPE_OFFSET, CUSTOM_OBJ_DATA_CONTENT, MASK_CLASS, } = cc_1.deserialize._macros;
class TraceableItem {
    // dataTypeID: DataTypeID | undefined = undefined;
    // 引用关系。这里不考虑定义引用对象了，改用两个数组。因为引用对象使用者也会被耦合，而且使用者创建的临时对象会更多
    tracers = [];
    keys = [];
    // get isSerialized (): boolean {
    //     return this.result !== TraceableItem.NO_RESULT;
    // };
    static compareByRefCount(lhs, rhs) {
        return rhs.tracers.length - lhs.tracers.length;
    }
    static NO_RESULT = Object.create(null);
    // 需要追踪的数据
    result = TraceableItem.NO_RESULT;
    constructor() {
        // this.source = source;
        // this.serialized = serialized;
    }
    traceBy(tracer, key) {
        this.tracers.push(tracer);
        this.keys.push(key);
    }
    movedTo(index) {
        for (let i = 0; i < this.tracers.length; i++) {
            this.tracers[i][this.keys[i]] = index;
        }
    }
}
exports.TraceableItem = TraceableItem;
class TraceableDict {
    // 当某个索引将会被延迟赋值时，使用这个字段来占坑
    static PLACEHOLDER = 0;
    values = new Map();
    trace(source, tracer, key) {
        let item = this.values.get(source);
        if (!item) {
            item = new TraceableItem();
            this.values.set(source, item);
        }
        item.traceBy(tracer, key);
        return item;
    }
    traceString(source, tracer, key) {
        const item = this.trace(source, tracer, key);
        // if (!item.isSerialized) {
        item.result = source;
        // }
    }
    get(source) {
        return this.values.get(source);
    }
    getSortedItems() {
        const array = Array.from(this.values.values());
        array.sort(TraceableItem.compareByRefCount);
        return array;
    }
    dump(offset = 0) {
        const array = this.getSortedItems();
        for (let i = 0; i < array.length; i++) {
            array[i].movedTo(offset + i);
        }
        return array.map((x) => x.result);
    }
}
exports.TraceableDict = TraceableDict;
// 保存场景对象结构，此 Node 非 cc.Node，而是用来表示关系对象关系图中的节点。这些节点会组织成有向有环图。
class Node {
    // 自身序列化时需要用的实际类型
    selfType;
    // 此对象被引用的次数，决定了是否必须放到 instances，以及后续的优化权重
    refCount = 0;
    // 当前节点是否在 instances 中
    indexed = false;
    // 当前节点只能放在 instances 中
    shouldBeIndexed = false;
    // 当前节点在 instances 中的索引，如果当前节点不在 instances 中则返回持有当前节点的祖先节点的索引
    _index = -1;
    get instanceIndex() {
        return this._index;
    }
    set instanceIndex(val) {
        if (this.indexed) {
            throw new Error('Should not change instanceIndex on indexed object');
        }
        this._index = val;
    }
    // 被其它对象引用时的类型
    get refType() {
        return this.indexed ? 1 /* DataTypeID.InstanceRef */ : this.selfType;
    }
    static compareByRefCount(lhs, rhs) {
        return rhs.refCount - lhs.refCount;
    }
    constructor(dataTypeID) {
        this.selfType = dataTypeID;
    }
    setStatic(key, dataTypeID, data) {
    }
    setDynamic(target, key) {
        ++target.refCount;
    }
    static AssetPlaceholderType = 0 /* DataTypeID.SimpleType */;
    static AssetPlaceholderValue = null;
    setAssetRefPlaceholderOnIndexed(key) {
        // 设置会被延迟初始化的资源默认值
        // 只有不为 AssetRefByInnerObj / Array_AssetRefByInnerObj 的属性才要多设置这个 placeholder
        // 实际上只有数组需要提前初始化，因为如果赋值顺序不递增，会产生空洞，导致数组退化为字典，影响性能
        // 类对象在构造函数已经预分配了，不需要在反序列化重新分配
        // 字典对象不常用就不纠结了
    }
    dumpRecursively(refsBuilder) {
        // 递归调用所有除了 DataTypeID.InstanceRef 类型的关联节点的 dumpRecursively。
        // 由于所有可能产生循环引用的节点，都提前转换成了 DataTypeID.InstanceRef 类型，
        // 所以这里直接递归就行，不会死循环。
    }
}
exports.Node = Node;
class ArrayNode extends Node {
    types;
    datas;
    static DeriveTypes = [
        [0 /* DataTypeID.SimpleType */, 0 /* DataTypeID.SimpleType */],
        [4 /* DataTypeID.Class */, 9 /* DataTypeID.Array_Class */],
        [6 /* DataTypeID.AssetRefByInnerObj */, 3 /* DataTypeID.Array_AssetRefByInnerObj */],
        [1 /* DataTypeID.InstanceRef */, 2 /* DataTypeID.Array_InstanceRef */],
    ];
    constructor(length) {
        super(12 /* DataTypeID.Array */);
        this.types = new Array(length);
        this.datas = new Array(length);
    }
    setStatic(key, dataTypeID, data) {
        this.types[key] = dataTypeID;
        this.datas[key] = data;
    }
    setDynamic(target, key) {
        super.setDynamic(target);
        this.types[key] = undefined;
        this.datas[key] = target;
    }
    setAssetRefPlaceholderOnIndexed(key) {
        this.types[key] = Node.AssetPlaceholderType;
        this.datas[key] = Node.AssetPlaceholderValue;
    }
    dumpRecursively(refsBuilder) {
        // 递归依赖节点
        for (let i = 0; i < this.datas.length; ++i) {
            const target = this.datas[i];
            if (target instanceof Node) {
                if (target.indexed) {
                    const refData = refsBuilder.addRef(this, i, target);
                    if (isFinite(refData)) {
                        this.types[i] = 1 /* DataTypeID.InstanceRef */;
                        this.datas[i] = refData;
                    }
                    else {
                        // 先赋值为 null，反序列化后会被 refs 延迟赋值为目标节点
                        // TODO - 这样可能会导致无法特化为 Array_InstanceRef
                        this.types[i] = 0 /* DataTypeID.SimpleType */;
                        this.datas[i] = null;
                    }
                }
                else {
                    target.instanceIndex = this.instanceIndex;
                    const data = target.dumpRecursively(refsBuilder);
                    this.types[i] = target.refType;
                    this.datas[i] = data;
                }
            }
        }
        // 特化数组
        for (let i = 0; i < ArrayNode.DeriveTypes.length; ++i) {
            const [elementType, arrayType] = ArrayNode.DeriveTypes[i];
            if (this.types.every((x) => x === elementType)) {
                this.selfType = arrayType;
                return this.datas;
            }
        }
        // 混合数组
        this.selfType = 12 /* DataTypeID.Array */;
        return [this.datas, ...this.types];
    }
}
exports.ArrayNode = ArrayNode;
class DictNode extends Node {
    data = [null];
    json = Object.create(null);
    dynamics = Object.create(null);
    constructor() {
        super(11 /* DataTypeID.Dict */);
        this.data[DICT_JSON_LAYOUT] = this.json;
    }
    setStatic(key, dataTypeID, value) {
        if (dataTypeID === 0 /* DataTypeID.SimpleType */) {
            this.json[key] = value;
        }
        else {
            this.data.push(key, dataTypeID, value);
        }
    }
    setDynamic(target, key) {
        super.setDynamic(target);
        this.dynamics[key] = target;
    }
    dumpRecursively(refsBuilder) {
        for (const key in this.dynamics) {
            const target = this.dynamics[key];
            if (target.indexed) {
                const refData = refsBuilder.addRef(this, key, target);
                if (isFinite(refData)) {
                    this.data.push(key, 1 /* DataTypeID.InstanceRef */, refData);
                }
            }
            else {
                // 由于所有可能产生循环引用的节点，都提前转换成了 DataTypeID.InstanceRef 类型，
                // 所以这里直接递归就行，不会死循环
                target.instanceIndex = this.instanceIndex;
                const data = target.dumpRecursively(refsBuilder);
                if (target.refType === 0 /* DataTypeID.SimpleType */) {
                    this.json[key] = data;
                }
                else {
                    this.data.push(key, target.refType, data);
                }
            }
        }
        const isSimple = this.data.length === 1;
        if (isSimple) {
            this.selfType = 0 /* DataTypeID.SimpleType */;
            return this.json;
        }
        else {
            return this.data;
        }
    }
}
exports.DictNode = DictNode;
class ClassNode extends Node {
    ctor;
    simpleKeys = new Array();
    simpleValues = [];
    advanceds = new Array();
    // dump 后的结果。dump 后 simpleValues 会被清空，advanceds 中的数据部分也会被删除
    dumped;
    // 从数据直接反向生成一个已经调用过 dumpRecursively 的对象
    static fromData(clazz, mask, data) {
        const ctor = clazz[CLASS_TYPE];
        const res = new ClassNode(ctor);
        res.dumped = data;
        res.simpleValues = null;
        const keys = clazz[CLASS_KEYS];
        const classTypeOffset = clazz[CLASS_PROP_TYPE_OFFSET];
        const maskTypeOffset = mask[mask.length - 1];
        let i = MASK_CLASS + 1;
        for (; i < maskTypeOffset; ++i) {
            const key = keys[mask[i]];
            res.simpleKeys.push(key);
        }
        for (let i = maskTypeOffset; i < data.length; ++i) {
            const key = keys[mask[i]];
            const type = clazz[mask[i] + classTypeOffset];
            res.advanceds.push(key, type);
        }
        return res;
    }
    constructor(ctor) {
        super(4 /* DataTypeID.Class */);
        this.ctor = ctor;
    }
    setStatic(key, dataTypeID, value) {
        if (dataTypeID === 0 /* DataTypeID.SimpleType */) {
            this.simpleKeys.push(key);
            // @ts-ignore
            this.simpleValues.push(value);
        }
        else {
            this.advanceds.push(key, dataTypeID, value);
        }
        // this.metas.push(key, dataTypeID);
        // this.datas.push(value);
    }
    setDynamic(target, key) {
        super.setDynamic(target);
        this.advanceds.push(key, undefined, target);
    }
    dumpRecursively(refsBuilder) {
        const advanceds = this.advanceds;
        const TYPE_OFFSET = 1;
        const VALUE_OFFSET = 2;
        // dump children
        for (let i = advanceds.length - 3; i >= 0; i -= 3) {
            // let key = this.metas[m];
            // let type = this.metas[m + 1];
            const target = advanceds[i + VALUE_OFFSET];
            if (target instanceof Node) {
                if (target.indexed) {
                    const refData = refsBuilder.addRef(this, advanceds[i], target);
                    if (isFinite(refData)) {
                        advanceds[i + TYPE_OFFSET] = 1 /* DataTypeID.InstanceRef */;
                        advanceds[i + VALUE_OFFSET] = refData;
                    }
                    else {
                        // Remove key-type-value tuple from advanceds
                        advanceds.splice(i, 3);
                    }
                }
                else {
                    target.instanceIndex = this.instanceIndex;
                    const dumped = target.dumpRecursively(refsBuilder);
                    if (target.refType === 0 /* DataTypeID.SimpleType */) {
                        this.simpleKeys.push(advanceds[i]);
                        // @ts-ignore
                        this.simpleValues.push(dumped);
                        // Remove key-type-value tuple from advanceds
                        advanceds.splice(i, 3);
                    }
                    else {
                        advanceds[i + TYPE_OFFSET] = target.refType;
                        advanceds[i + VALUE_OFFSET] = dumped;
                    }
                }
            }
        }
        // dump values
        const mask = TraceableDict.PLACEHOLDER;
        // 缓存 dumped 对象，等对象都 dump 后再生成 mask 索引。
        this.dumped = [mask].concat(this.simpleValues);
        for (let i = 0; i < advanceds.length; i += 3) {
            this.dumped.push(advanceds[i + VALUE_OFFSET]);
        }
        this.simpleValues = null;
        this.advanceds = this.advanceds.filter((x, index) => index % 3 !== 2);
        return this.dumped;
    }
}
exports.ClassNode = ClassNode;
class CustomClassNode extends Node {
    ctor;
    content;
    dumped;
    // 从数据直接反向生成一个已经调用过 dumpRecursively 的对象
    static fromData(ctor, data) {
        const content = data[CUSTOM_OBJ_DATA_CONTENT];
        const res = new CustomClassNode(ctor, content);
        res.dumped = data;
        return res;
    }
    constructor(ctor, content) {
        super(10 /* DataTypeID.CustomizedClass */);
        this.ctor = ctor;
        this.content = content;
    }
    setStatic(key, dataTypeID, value) {
        throw new Error('Should not set property of CustomClass');
    }
    setDynamic(target, key) {
        throw new Error('Should not set property of CustomClass');
    }
    dumpRecursively(refsBuilder) {
        const CLASS = TraceableDict.PLACEHOLDER;
        this.dumped = [CLASS, this.content];
        // 通过保存 dumped 对象，等对象都 dump 后再生成 mask 索引。
        return this.dumped;
    }
}
exports.CustomClassNode = CustomClassNode;
