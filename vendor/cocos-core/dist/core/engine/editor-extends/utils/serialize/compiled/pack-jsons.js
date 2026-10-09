"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = packJSONs;
const cc_1 = require("cc");
const types_1 = require("./types");
const builder_1 = require("./builder");
const create_class_mask_1 = __importDefault(require("./create-class-mask"));
const { EMPTY_PLACEHOLDER, CUSTOM_OBJ_DATA_CLASS, ARRAY_ITEM_VALUES, CLASS_PROP_TYPE_OFFSET, MASK_CLASS, OBJ_DATA_MASK, DICT_JSON_LAYOUT, PACKED_SECTIONS, } = cc_1.deserialize._macros;
function genArrayParser(parser) {
    return (data, value, classNodes) => {
        for (let i = 0; i < value.length; ++i) {
            parser(data, value[i], classNodes);
        }
    };
}
function parseArray(data, value, classNodes) {
    const array = value[ARRAY_ITEM_VALUES];
    for (let i = 0; i < array.length; ++i) {
        const type = value[i + 1];
        const op = PARSERS[type];
        if (op) {
            op(data, array[i], classNodes);
        }
    }
}
function parseDict(data, value, classNodes) {
    for (let i = DICT_JSON_LAYOUT + 1; i < value.length; i += 3) {
        const type = value[i + 1];
        const op = PARSERS[type];
        if (op) {
            const subValue = value[i + 2];
            op(data, subValue, classNodes);
        }
    }
}
function parseClass(data, value, classNodes) {
    const mask = data[4 /* File.SharedMasks */][value[OBJ_DATA_MASK]];
    const clazz = data[3 /* File.SharedClasses */][mask[MASK_CLASS]];
    const node = types_1.ClassNode.fromData(clazz, mask, value);
    classNodes.push(node);
    const classTypeOffset = clazz[CLASS_PROP_TYPE_OFFSET];
    const maskTypeOffset = mask[mask.length - 1];
    // parse advanced type
    for (let i = maskTypeOffset; i < value.length; ++i) {
        const type = clazz[mask[i] + classTypeOffset];
        const op = PARSERS[type];
        if (op) {
            op(data, value[i], classNodes);
        }
    }
}
function parseCustomClass(data, value, classNodes) {
    const ctor = data[3 /* File.SharedClasses */][value[CUSTOM_OBJ_DATA_CLASS]];
    const node = types_1.CustomClassNode.fromData(ctor, value);
    classNodes.push(node);
}
const PARSERS = new Array(13 /* DataTypeID.ARRAY_LENGTH */);
PARSERS.fill(null);
PARSERS[4 /* DataTypeID.Class */] = parseClass;
PARSERS[10 /* DataTypeID.CustomizedClass */] = parseCustomClass;
PARSERS[12 /* DataTypeID.Array */] = parseArray;
PARSERS[9 /* DataTypeID.Array_Class */] = genArrayParser(parseClass);
PARSERS[11 /* DataTypeID.Dict */] = parseDict;
function parseInstances(data, classNodes) {
    const sharedClasses = data[3 /* File.SharedClasses */];
    const instances = data[5 /* File.Instances */];
    const instanceTypes = data[6 /* File.InstanceTypes */];
    const instanceTypesLen = instanceTypes === EMPTY_PLACEHOLDER ? 0 : instanceTypes.length;
    const rootInfo = instances[instances.length - 1];
    let normalObjectCount = instances.length - instanceTypesLen;
    if (typeof rootInfo === 'number') {
        --normalObjectCount;
    }
    let insIndex = 0;
    for (; insIndex < normalObjectCount; ++insIndex) {
        const eachData = instances[insIndex];
        parseClass(data, eachData, classNodes);
    }
    if (instanceTypes) {
        for (let typeIndex = 0; typeIndex < instanceTypesLen; ++typeIndex, ++insIndex) {
            let type = instanceTypes[typeIndex];
            const eachData = instances[insIndex];
            if (type >= 0) {
                // class index for DataTypeID.CustomizedClass
                const classId = sharedClasses[type];
                const node = types_1.CustomClassNode.fromData(classId, [type, eachData]);
                node.instanceIndex = insIndex;
                classNodes.push(node);
                // @ts-ignore: 用于将类型更新到对应的 InstanceTypes
                instanceTypes[typeIndex] = node;
            }
            else {
                // Other
                type = ~type;
                const op = PARSERS[type];
                if (op) {
                    // @ts-ignore
                    op(data, eachData, classNodes);
                }
            }
        }
    }
}
function parseJSON(data, packedUuids, packedStrings, classNodes) {
    const sharedUuids = data[1 /* File.SharedUuids */];
    const sharedStrings = data[2 /* File.SharedStrings */];
    // merge uuids
    const uuidIndices = data[10 /* File.DependUuidIndices */];
    for (let j = 0; j < uuidIndices.length; ++j) {
        const uuid = sharedUuids[uuidIndices[j]];
        packedUuids.traceString(uuid, uuidIndices, j);
    }
    // merge strings
    if (data[7 /* File.Refs */]) {
        const refs = data[7 /* File.Refs */];
        const dataLength = refs.length - 1;
        for (let i = 0; i < dataLength; i += 3 /* Refs.EACH_RECORD_LENGTH */) {
            const key = refs[i + 1 /* Refs.KEY_OFFSET */];
            if (key >= 0) {
                const str = sharedStrings[key];
                packedStrings.traceString(str, refs, i + 1 /* Refs.KEY_OFFSET */);
            }
        }
    }
    const dependKeys = data[9 /* File.DependKeys */];
    for (let i = 0; i < dependKeys.length; ++i) {
        const key = dependKeys[i];
        if (key >= 0) {
            const str = sharedStrings[key];
            packedStrings.traceString(str, dependKeys, i);
        }
    }
    // merge classes/masks
    parseInstances(data, classNodes);
}
// 此函数会修改传入的 datas
function packJSONs(datas) {
    const packedUuids = new types_1.TraceableDict();
    const packedStrings = new types_1.TraceableDict();
    const classNodes = new Array();
    // 重建所有 dump 后的 ClassNode/CustomClassNode
    for (let i = 0; i < datas.length; ++i) {
        parseJSON(datas[i], packedUuids, packedStrings, classNodes);
    }
    // 重新生成所有 class/mask
    const { sharedClasses: packedClasses, sharedMasks: packedMasks } = (0, create_class_mask_1.default)(classNodes);
    for (let i = 0; i < datas.length; ++i) {
        const data = datas[i];
        // 更新 InstanceTypes 类型的信息
        const instanceTypes = data[6 /* File.InstanceTypes */];
        if (instanceTypes) {
            for (let i = 0; i < instanceTypes.length; ++i) {
                const type = instanceTypes[i];
                if (type instanceof types_1.CustomClassNode) {
                    instanceTypes[i] = type.dumped[CUSTOM_OBJ_DATA_CLASS];
                }
            }
        }
        // 抹去原有的共享信息
        data.splice(0, 5);
    }
    // @ts-ignore
    const res = new Array(PACKED_SECTIONS + 1);
    res[0 /* File.Version */] = builder_1.FORMAT_VERSION;
    res[1 /* File.SharedUuids */] = (0, builder_1.reduceEmptyArray)(packedUuids.dump());
    res[2 /* File.SharedStrings */] = (0, builder_1.reduceEmptyArray)(packedStrings.dump());
    res[3 /* File.SharedClasses */] = packedClasses;
    res[4 /* File.SharedMasks */] = (0, builder_1.reduceEmptyArray)(packedMasks);
    // @ts-ignore
    res[PACKED_SECTIONS] = datas;
    return res;
}
