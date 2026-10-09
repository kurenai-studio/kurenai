"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const cc_1 = require("cc");
const types_1 = require("./types");
const { CLASS_PROP_TYPE_OFFSET, MASK_CLASS, OBJ_DATA_MASK, CUSTOM_OBJ_DATA_CLASS, } = cc_1.deserialize._macros;
// 同一个构造函数，生成的类型可能有多个，每个类型叫作一个 Type。
class Type {
    properties = new Map();
    nodes = new Array();
    constructor(node) {
        this.setNodeProperties(node);
        this.nodes.push(node);
    }
    setNodeProperties(node) {
        const properties = this.properties;
        for (const simpleKey of node.simpleKeys) {
            properties.set(simpleKey, 0 /* DataTypeID.SimpleType */);
        }
        for (let i = 0; i < node.advanceds.length; i += 2) {
            const key = node.advanceds[i];
            properties.set(key, node.advanceds[i + 1]);
        }
    }
    addNode(node) {
        const properties = this.properties;
        let lackProperty = false;
        for (const simpleKey of node.simpleKeys) {
            if (properties.has(simpleKey)) {
                if (properties.get(simpleKey) !== 0 /* DataTypeID.SimpleType */) {
                    // 当前类的某个属性类型和目标对象的不同
                    return false;
                }
            }
            else {
                lackProperty = true;
            }
        }
        for (let i = 0; i < node.advanceds.length; i += 2) {
            const key = node.advanceds[i];
            if (properties.has(key)) {
                if (properties.get(key) !== node.advanceds[i + 1]) {
                    // 当前类的某个属性类型和目标对象的不同
                    return false;
                }
            }
            else {
                lackProperty = true;
            }
        }
        if (lackProperty) {
            // 当前类的属性和类型是目标对象的子集
            this.setNodeProperties(node);
            this.nodes.push(node);
            return true;
        }
        else {
            // 当前类包含了目标对象的所有属性及类型
            this.nodes.push(node);
            return true;
        }
    }
    static shouldUseSameMask(rhs) {
        const lhs = this;
        const ls = lhs.simpleKeys;
        const rs = rhs.simpleKeys;
        const la = lhs.advanceds;
        const ra = rhs.advanceds;
        if (ls.length !== rs.length || la.length !== ra.length) {
            return false;
        }
        for (let i = 0; i < ls.length; ++i) {
            if (ls[i] !== rs[i]) {
                return false;
            }
        }
        for (let i = 0; i < la.length; i += 2) {
            if (la[i] !== ra[i]) {
                return false;
            }
        }
        return true;
    }
    dump(classId, sharedClasses, sharedMasks) {
        // 缓存待生成的属性列表
        const simples = new types_1.TraceableDict();
        const advanceds = new types_1.TraceableDict();
        // 缓存待生成的 mask 数据，由于每个 mask 都有与其完全匹配的对象结构，因此直接使用对象本身做为缓存就行
        const maskNodes = new Array();
        // dump mask
        for (let i = 0; i < this.nodes.length; ++i) {
            const node = this.nodes[i];
            const maskNode = maskNodes.find(Type.shouldUseSameMask, node);
            if (maskNode) {
                sharedMasks.trace(maskNode, node.dumped, OBJ_DATA_MASK);
            }
            else {
                // new mask
                const maskData = [types_1.TraceableDict.PLACEHOLDER];
                for (let i = 0; i < node.simpleKeys.length; ++i) {
                    const key = node.simpleKeys[i];
                    simples.traceString(key, maskData, maskData.length);
                    maskData.push(types_1.TraceableDict.PLACEHOLDER);
                }
                const offset = maskData.length;
                for (let i = 0; i < node.advanceds.length; i += 2) {
                    const key = node.advanceds[i];
                    advanceds.traceString(key, maskData, maskData.length);
                    maskData.push(types_1.TraceableDict.PLACEHOLDER);
                }
                maskData.push(offset);
                sharedClasses.trace(this, maskData, MASK_CLASS);
                // register mask
                const item = sharedMasks.trace(node, node.dumped, OBJ_DATA_MASK);
                item.result = maskData;
                maskNodes.push(node);
            }
        }
        // dump class
        const simpleKeys = simples.dump();
        const advancedKeys = advanceds.dump(simpleKeys.length);
        const keys = simpleKeys.concat(advancedKeys);
        const offset = CLASS_PROP_TYPE_OFFSET + 1 - simpleKeys.length;
        const dataTypes = advancedKeys.map((x) => this.properties.get(x));
        const classData = [classId, keys, offset, ...dataTypes];
        sharedClasses.get(this).result = classData;
    }
}
function registerType(types, node) {
    for (const type of types) {
        if (type.addNode(node)) {
            return;
        }
    }
    const type = new Type(node);
    types.push(type);
}
function default_1(classNodes) {
    const sharedClasses = new types_1.TraceableDict();
    const sharedMasks = new types_1.TraceableDict();
    const ctors = new Map();
    // generate types
    for (let i = 0; i < classNodes.length; ++i) {
        const node = classNodes[i];
        const classId = node.ctor;
        if (node instanceof types_1.CustomClassNode) {
            sharedClasses.traceString(classId, node.dumped, CUSTOM_OBJ_DATA_CLASS);
            continue;
        }
        let types = ctors.get(classId);
        if (!types) {
            types = [];
            ctors.set(classId, types);
        }
        registerType(types, node);
    }
    // generate class/mask
    for (const [classId, types] of ctors) {
        // let types = ctors.get(classId) as Type[];
        for (const type of types) {
            type.dump(classId, sharedClasses, sharedMasks);
        }
    }
    return {
        sharedClasses: sharedClasses.dump(),
        sharedMasks: sharedMasks.dump(),
    };
}
