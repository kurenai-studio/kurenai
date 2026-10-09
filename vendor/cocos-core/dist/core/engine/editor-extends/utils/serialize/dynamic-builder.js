"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asAsset = asAsset;
exports.setName = setName;
exports.findRootObject = findRootObject;
exports.assert = assert;
const cc_1 = require("cc");
const base_builder_1 = require("./base-builder");
class DynamicBuilder extends base_builder_1.Builder {
    forceInline;
    // list of serialized data
    serializedList = [];
    constructor(options) {
        super(options);
        this.forceInline = !!options.forceInline;
    }
    setProperty_Array(owner, ownerInfo, key, options) {
        return this.addObject(options.writeOnlyArray, ownerInfo, key, options.formerlySerializedAs, false);
    }
    setProperty_Dict(owner, ownerInfo, key, options) {
        return this.addObject({}, ownerInfo, key, options?.formerlySerializedAs, false);
    }
    addObject(data, ownerInfo, key, formerlySerializedAs, forceIndexed) {
        let id = -1;
        let refData = data;
        const isRoot = !ownerInfo;
        if ((!this.forceInline && forceIndexed) || isRoot) {
            id = this.serializedList.length;
            this.serializedList.push(data);
            if (!this.forceInline) {
                refData = { __id__: id };
            }
        }
        if (ownerInfo) {
            ownerInfo.data[key] = refData;
            if (formerlySerializedAs) {
                ownerInfo.data[formerlySerializedAs] = refData;
            }
        }
        return { data, id };
    }
    setProperty_Class(owner, ownerInfo, key, options) {
        const data = {
            __type__: options.type,
        };
        return this.addObject(data, ownerInfo, key, options.formerlySerializedAs, !(options.uniquelyReferenced ?? false));
    }
    setProperty_CustomizedClass(owner, ownerInfo, key, options) {
        const data = {
            __type__: options.type,
            content: options.content,
        };
        return this.addObject(data, ownerInfo, key, options.formerlySerializedAs, true);
    }
    // parsed
    setProperty_ParsedObject(ownerInfo, key, valueInfo, formerlySerializedAs) {
        if (!this.forceInline && valueInfo.id >= 0) {
            // 可索引对象
            ownerInfo.data[key] = { __id__: valueInfo.id };
        }
        else {
            // 不可索引对象，直接内联数据
            ownerInfo.data[key] = valueInfo.data;
        }
        if (formerlySerializedAs) {
            ownerInfo.data[formerlySerializedAs] = ownerInfo.data[key];
        }
    }
    // Static Values
    setProperty_Raw(owner, ownerInfo, key, value, options) {
        ownerInfo.data[key] = value;
        if (options?.formerlySerializedAs) {
            ownerInfo.data[options.formerlySerializedAs] = value;
        }
    }
    setProperty_ValueType(owner, ownerInfo, key, value, options) {
        const data = {
            __type__: cc_1.js.getClassId(value, false),
        };
        const props = value.constructor.__values__;
        if (props) {
            for (let p = 0; p < props.length; p++) {
                const propName = props[p];
                data[propName] = value[propName];
            }
        }
        if (ownerInfo) {
            ownerInfo.data[key] = data;
            if (options?.formerlySerializedAs) {
                ownerInfo.data[options.formerlySerializedAs] = data;
            }
            return { data, id: -1 };
        }
        else {
            this.serializedList.push(data);
            return { data, id: 0 };
        }
    }
    setProperty_TypedArray(owner, ownerInfo, key, value, options) {
        let data;
        if (this.hasBinaryBuffer) {
            const isDataView = value instanceof DataView;
            if (!isDataView) {
                this.mainBufferBuilder.alignAs(value.constructor.BYTES_PER_ELEMENT);
            }
            const offset = this.mainBufferBuilder.append(value);
            data = {
                __type__: 'TypedArrayRef',
                ctor: value.constructor.name,
                offset,
                length: isDataView ? value.byteLength : value.length,
            };
        }
        else {
            data = {
                __type__: 'TypedArray',
                ctor: value.constructor.name,
                array: Array.from(value),
            };
        }
        if (ownerInfo) {
            ownerInfo.data[key] = data;
            if (options?.formerlySerializedAs) {
                ownerInfo.data[options.formerlySerializedAs] = data;
            }
        }
        else {
            this.serializedList.push(data);
        }
    }
    setProperty_AssetUuid(owner, ownerInfo, key, uuid, options) {
        ownerInfo.data[key] = { __uuid__: uuid };
        if (options?.formerlySerializedAs) {
            ownerInfo.data[options.formerlySerializedAs] = ownerInfo.data[key];
        }
        if (options?.expectedType) {
            ownerInfo.data[key].__expectedType__ = options.expectedType;
        }
    }
    setRoot(objInfo) {
        assert(objInfo.id === 0, `Wrong root object to serialize, id is ${objInfo.id}`);
    }
    finalizeJsonPart() {
        const serializedList = this.serializedList;
        let serializedData;
        if (serializedList.length === 1 && !Array.isArray(serializedList[0])) {
            serializedData = serializedList[0];
        }
        else {
            serializedData = serializedList;
        }
        return serializedData;
    }
}
exports.default = DynamicBuilder;
/**
 * Create a pseudo object which will be force serialized as a reference to any asset by specified uuid.
 */
function asAsset(uuid, type = cc_1.Asset) {
    if (!uuid) {
        (0, cc_1.error)('[EditorExtends.serialize.asAsset] The uuid must be non-nil!');
        return null;
    }
    const pseudoAsset = new type();
    pseudoAsset._uuid = uuid;
    return pseudoAsset;
}
/**
 * Set the asset's name directly in JSON object
 */
function setName(data, name) {
    if (Array.isArray(data)) {
        data[0]._name = name;
    }
    else {
        data._name = name;
    }
}
function findRootObject(data, type) {
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const obj = data[i];
            if (obj.__type__ === type) {
                return obj;
            }
        }
    }
    else if (data.__type__ === type) {
        return data;
    }
    return null;
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}
