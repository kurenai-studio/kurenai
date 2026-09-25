'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySerializedData = querySerializedData;
exports.saveSerializedData = saveSerializedData;
exports.encodeSerializedObject = encodeSerializedObject;
exports.getDefaultValueByType = getDefaultValueByType;
const fs_extra_1 = require("fs-extra");
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const utils_1 = require("./asset-handler/utils");
const operation_1 = __importDefault(require("./manager/operation"));
const query_1 = __importDefault(require("./manager/query"));
const editor_extends_1 = require("../engine/editor-extends");
const i18n_1 = __importDefault(require("../base/i18n"));
const SUPPORTED_TYPES = new Set(['cc.PhysicsMaterial', 'cc.RenderPipeline']);
const RENDER_PIPELINE_CHANGE_TYPES = {
    _flows: {
        componentKey: 'flow',
        optionalTypes: [],
    },
    _stages: {
        componentKey: 'stage',
        optionalTypes: [],
    },
};
const ATTRIBUTE_PROPS = [
    'enumList',
    'radioGroup',
    'bitmaskList',
    'displayName',
    'group',
    'multiline',
    'step',
    'slide',
    'tooltip',
    'animatable',
    'unit',
    'radian',
    'displayOrder',
];
const AUTO_I18N_ATTRIBUTE_NAMES = [
    'displayName',
    'tooltip',
];
const MAX_CLASS_NAME_LOOKUP_DEPTH = 10;
const AUTO_I18N_CLASS_PREFIXES = ['cc.', 'sp.'];
async function querySerializedData(uuidOrUrlOrPath) {
    const { asset, assetInfo } = resolveSerializedAsset(uuidOrUrlOrPath);
    const instance = await loadSerializedAssetInstance(asset);
    return {
        uuid: asset.uuid,
        url: assetInfo.url,
        type: assetInfo.type,
        importer: assetInfo.importer,
        dump: await encodeSerializedAssetDump(instance, assetInfo.type),
    };
}
async function saveSerializedData(uuidOrUrlOrPath, patch) {
    const { asset, assetInfo } = resolveSerializedAsset(uuidOrUrlOrPath);
    const instance = await loadSerializedAssetInstance(asset);
    let normalizedInstance = instance;
    if (assetInfo.type === 'cc.RenderPipeline' && isPropertyLike(patch)) {
        normalizedInstance = createRenderPipelineInstanceIfNeeded(normalizedInstance, patch);
    }
    const currentDump = await encodeSerializedAssetDump(normalizedInstance, assetInfo.type);
    const currentFieldDump = getFieldDumpFromAssetDump(assetInfo.type, currentDump);
    const patchFieldDump = normalizePatchFieldDump(assetInfo.type, currentFieldDump, patch);
    await applyFieldDumpPatch(normalizedInstance, currentFieldDump, patchFieldDump);
    const serialized = getEditorSerialize()(normalizedInstance);
    await operation_1.default.saveAsset(asset.uuid, formatSerializedContent(serialized));
    return querySerializedData(asset.uuid);
}
function resolveSerializedAsset(uuidOrUrlOrPath) {
    const asset = query_1.default.queryAsset(uuidOrUrlOrPath);
    if (!asset) {
        throw new Error(`Serialized asset can not be found: ${uuidOrUrlOrPath}`);
    }
    const assetInfo = query_1.default.encodeAsset(asset);
    if (!SUPPORTED_TYPES.has(assetInfo.type)) {
        throw new Error(`Unsupported serialized asset type: ${assetInfo.type}. Only cc.PhysicsMaterial and cc.RenderPipeline are supported.`);
    }
    if (!asset.source) {
        throw new Error(`Serialized asset has no source file: ${uuidOrUrlOrPath}`);
    }
    return { asset, assetInfo };
}
async function loadSerializedAssetInstance(asset) {
    const source = await (0, fs_extra_1.readJSON)(asset.source);
    const instance = (0, utils_1.deserialize)(source);
    if (!instance) {
        throw new Error(`Deserialize serialized asset failed: ${asset.url || asset.uuid}`);
    }
    if ('_uuid' in instance) {
        instance._uuid = asset.uuid;
    }
    return instance;
}
async function encodeSerializedAssetDump(instance, type) {
    if (type === 'cc.RenderPipeline') {
        const dump = encodeComponentAsset(instance, modifyRenderPipelineProp);
        return {
            name: 'Pipeline',
            type: instance.constructor.name,
            value: dump,
            visible: true,
            readonly: false,
            optionalTypes: queryRenderComponents('pipeline'),
            path: '',
        };
    }
    return encodeComponentAsset(instance, modifyPropName);
}
function encodeComponentAsset(instance, modifyProp) {
    const ctor = instance.constructor;
    if (!ctor.__props__) {
        throw new Error(`Serialized asset type has no editable properties: ${ctor.name || 'Unknown'}`);
    }
    const value = {};
    ctor.__props__.forEach((key) => {
        try {
            if (!(key in instance)) {
                return;
            }
            const attrs = cc.Class.attr(ctor, key);
            const dumpData = encodeSerializedObject(instance[key], attrs, instance, key);
            if (dumpData.type !== 'Unknown') {
                value[key] = dumpData;
                modifyProp(value[key], key);
            }
        }
        catch (error) {
            console.warn(`Asset property dump failed:\n Asset: ${ctor.name}\n Property: ${key}`);
            console.warn(error);
            delete value[key];
        }
    });
    return value;
}
function encodeSerializedObject(object, attributes, owner = null, objectKey, isTemplate) {
    attributes = attributes || {};
    const ctor = getPropertyConstructor(object, attributes);
    let defValue = getPropertyDefault(attributes);
    if (defValue && typeof defValue === 'object' && defValue.constructor && Array.isArray(defValue.constructor.__props__)) {
        const result = {
            type: getTypeName(defValue.constructor),
            value: {},
        };
        defValue.constructor.__props__.forEach((key) => {
            const attrs = cc.Class.attr(defValue.constructor, key);
            const dumpData = encodeSerializedObject(defValue[key], attrs, defValue, key);
            if (dumpData.type !== 'Unknown') {
                result.value[key] = dumpData;
            }
        });
        defValue = result;
    }
    let type = getTypeName(ctor);
    if (owner === null && attributes.default !== null && attributes.default !== undefined) {
        const defCtor = getPropertyConstructor(attributes.default, attributes);
        const defType = getTypeName(defCtor);
        if (defType !== type) {
            type = 'Unknown';
        }
    }
    const data = {
        name: objectKey,
        value: null,
        default: defValue,
        type,
        path: '',
        readonly: !!attributes.readonly,
        visible: attributes.visible ?? true,
        animatable: attributes.animatable === undefined ? true : !!attributes.animatable,
    };
    if (attributes.userData) {
        data.userData = attributes.userData;
    }
    applyPropertyAttributes(data, attributes, owner);
    if (Array.isArray(defValue) || Array.isArray(object)) {
        data.isArray = true;
    }
    if (data.isArray) {
        if (!Array.isArray(object) || data.type === 'Array') {
            data.type = 'Unknown';
        }
        else {
            const childAttribute = { ...attributes, visible: true };
            if (childAttribute.readonly && childAttribute.readonly.deep !== undefined) {
                childAttribute.readonly = childAttribute.readonly.deep;
            }
            const propertyDefaultValue = getPropertyDefaultValue(attributes);
            childAttribute.default = getElementDefaultValue(attributes, propertyDefaultValue);
            if (!isTemplate) {
                data.elementTypeData = encodeSerializedObject(childAttribute.default, childAttribute, propertyDefaultValue, undefined, true);
            }
            const resultValue = [];
            for (let i = 0; i < object.length; i++) {
                const item = object[i];
                if (item && item.constructor) {
                    childAttribute.ctor = item.constructor;
                }
                const result = encodeSerializedObject(item, childAttribute, owner);
                if (result.type !== 'Unknown') {
                    resultValue.push(result);
                }
                else if (data.elementTypeData) {
                    resultValue.push(data.elementTypeData);
                }
            }
            data.value = resultValue;
        }
    }
    else if (encodeKnownPropertyType(data.type, object, data, { ctor })) {
        // Encoded by known type handler.
    }
    else if (ArrayBuffer.isView(object)) {
        encodeKnownPropertyType('TypedArray', object, data, { ctor });
    }
    else if (isChildClassOf(ctor, cc.ValueType)) {
        encodeKnownPropertyType('cc.ValueType', object, data, { ctor });
    }
    else if (isChildClassOf(ctor, cc.Node)) {
        encodeKnownPropertyType('cc.Node', object, data, { ctor });
    }
    else if (isChildClassOf(ctor, cc.Component)) {
        encodeKnownPropertyType('cc.Component', object, data, { ctor });
    }
    else if (isChildClassOf(ctor, cc.Asset)) {
        encodeKnownPropertyType('cc.Asset', object, data, { ctor });
    }
    else if (ctor && ctor.__props__) {
        if (object) {
            const result = {};
            ctor.__props__.forEach((key) => {
                const attrs = cc.Class.attr(object, key);
                if (attributes.readonly && attributes.readonly.deep) {
                    attrs.readonly = { deep: true };
                }
                const dumpData = encodeSerializedObject(object[key], attrs, object, key);
                if (dumpData.type !== 'Unknown') {
                    result[key] = dumpData;
                }
                applyConstructorRewriteType(dumpData, object[key], attrs);
            });
            data.value = result;
        }
        else {
            data.value = null;
        }
    }
    else if (data.type !== 'Unknown') {
        data.value = object;
    }
    if (ctor) {
        data.extends = getTypeInheritanceChain(ctor);
    }
    return data;
}
function getPropertyDefault(attribute) {
    return typeof attribute.default === 'function' ? attribute.default() : attribute.default;
}
function getPropertyConstructor(object, attribute) {
    if (attribute && attribute.ctor) {
        return attribute.ctor;
    }
    return object === null || object === undefined ? null : object.constructor;
}
function getTypeName(ctor) {
    return ctor ? cc.js.getClassName(ctor) || ctor.name || 'Unknown' : 'Unknown';
}
function getTypeInheritanceChain(ctor) {
    return cc.Class.getInheritanceChain(ctor)
        .map((itemCtor) => getTypeName(itemCtor))
        .filter(Boolean);
}
function applyPropertyAttributes(data, attributes, owner) {
    ['visible', 'min', 'max'].forEach((name) => {
        const value = resolveAttributeValue(name, attributes, owner);
        if (value !== undefined) {
            data[name] = value;
        }
    });
    if (!attributes.ctor && attributes.type) {
        data.type = `${attributes.type}`;
    }
    if ('enumList' in attributes && attributes.type === 'Enum') {
        data.type = 'Enum';
    }
    if (attributes.hasGetter && !attributes.hasSetter) {
        data.readonly = true;
    }
    ATTRIBUTE_PROPS.forEach((propName) => {
        if (Object.prototype.hasOwnProperty.call(attributes, propName)) {
            data[propName] = attributes[propName];
        }
    });
    applyAutoI18nAttributes(data, attributes, owner);
    translateI18nStringsDeep(data);
}
function resolveAttributeValue(attributeName, attributes, owner) {
    const attribute = attributes[attributeName];
    if (attribute === undefined) {
        return undefined;
    }
    if (typeof attribute === 'function') {
        if (!owner) {
            return undefined;
        }
        const value = attribute.call(owner);
        return typeof value === 'boolean' ? !!value : value;
    }
    return typeof attribute === 'boolean' ? !!attribute : attribute;
}
function encodeKnownPropertyType(type, object, data, opts) {
    switch (type || '') {
        case 'Number':
        case 'Enum':
        case 'String':
            data.value = object;
            return true;
        case 'TypedArray':
            data.value = object ? new (object.constructor)(object) : object;
            return true;
        case 'cc.ValueType': {
            try {
                const dump = getEditorSerialize()(object, { stringify: false, forceInline: true });
                delete dump.__type__;
                data.value = dump;
            }
            catch (error) {
                console.warn('Value dump failed.');
                console.warn(error);
                const dump = getEditorSerialize()(new opts.ctor(), { stringify: false, forceInline: true });
                delete dump.__type__;
                data.value = dump;
            }
            return true;
        }
        case 'cc.Node':
        case 'cc.Component':
            data.value = { uuid: object ? object.uuid || '' : '' };
            return true;
        case 'cc.Asset': {
            const uuid = object ? object._uuid || '' : '';
            data.value = { uuid: uuid.startsWith('pm_') ? '' : uuid };
            return true;
        }
        default:
            return false;
    }
}
function applyAutoI18nAttributes(data, attributes, owner) {
    if (typeof data.name !== 'string' || !owner || typeof owner !== 'object') {
        return;
    }
    const ownerTypeName = findClassName(owner, data.name);
    if (!ownerTypeName) {
        return;
    }
    AUTO_I18N_ATTRIBUTE_NAMES.forEach((attributeName) => {
        if (Object.prototype.hasOwnProperty.call(attributes, attributeName)) {
            return;
        }
        data[attributeName] = `i18n:ENGINE.classes.${ownerTypeName}.properties.${data.name}.${attributeName}`;
    });
}
function findClassName(ccClassObject, property) {
    let depth = 0;
    let proto = ccClassObject;
    while (proto && depth < MAX_CLASS_NAME_LOOKUP_DEPTH) {
        const className = cc.js.getClassName(proto);
        if (className
            && AUTO_I18N_CLASS_PREFIXES.some((prefix) => className.startsWith(prefix))
            && Object.prototype.hasOwnProperty.call(proto, property)) {
            return className;
        }
        proto = Object.getPrototypeOf(proto);
        depth++;
    }
    return '';
}
function translateI18nStringsDeep(obj, depth = 0) {
    if (!obj || typeof obj !== 'object') {
        return;
    }
    if (depth > 10) {
        console.warn('[translateI18nStringsDeep] Max recursion depth exceeded; nested i18n strings at this level will not be translated:', obj);
        return;
    }
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === 'string') {
            obj[key] = i18n_1.default.transI18nName(value);
        }
        else if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                if (typeof value[i] === 'string') {
                    value[i] = i18n_1.default.transI18nName(value[i]);
                }
                else {
                    translateI18nStringsDeep(value[i], depth + 1);
                }
            }
        }
        else {
            translateI18nStringsDeep(value, depth + 1);
        }
    }
}
function isChildClassOf(ctor, base) {
    return !!ctor && !!base && cc.js.isChildClassOf(ctor, base);
}
function applyConstructorRewriteType(data, object, attributes) {
    if (object && typeof object === 'object' && !Array.isArray(object) && object.constructor && attributes?.ctor && !(object instanceof attributes.ctor)) {
        data.type = 'Unknown';
    }
}
function getElementDefaultValue(parentAttrs, parentInitializer) {
    if (parentAttrs.type) {
        return getPropertyDefaultValue(parentAttrs);
    }
    return getElementDefaultValueFromParentInitializer(parentInitializer);
}
function getElementDefaultValueFromParentInitializer(parentInitializer) {
    if (!parentInitializer || !Array.isArray(parentInitializer) || parentInitializer.length === 0) {
        return null;
    }
    const firstElement = parentInitializer[0];
    switch (typeof firstElement) {
        case 'number': return 0;
        case 'string': return '';
        case 'boolean': return false;
        default: return null;
    }
}
function getPropertyDefaultValue(attrs) {
    if (attrs.type === undefined) {
        return attrs.default ? getPropertyDefault(attrs) : null;
    }
    const defaultMap = {
        Boolean: false,
        String: '',
        Float: 0,
        Integer: 0,
        BitMask: 0,
    };
    if (defaultMap[attrs.type] !== undefined) {
        return defaultMap[attrs.type];
    }
    if (attrs.type === 'Enum') {
        return attrs.enumList?.[0]?.value || 0;
    }
    if (attrs.type === 'Object') {
        const { ctor } = attrs;
        if (isChildClassOf(ctor, cc.Asset) || isChildClassOf(ctor, cc.Node) || isChildClassOf(ctor, cc.Component)) {
            return null;
        }
        if (ctor) {
            try {
                return new ctor();
            }
            catch (error) {
                console.error(error);
                return null;
            }
        }
    }
    return null;
}
function modifyPropName(prop, name) {
    prop.name = name;
    if (prop.value && typeof prop.value === 'object') {
        for (const key in prop.value) {
            const child = prop.value[key];
            if (child && typeof child === 'object') {
                modifyPropName(child, key);
            }
        }
    }
}
function modifyRenderPipelineProp(prop, name) {
    prop.name = name;
    if (prop.visible === false) {
        return;
    }
    if (prop.value && typeof prop.value === 'object') {
        const changeType = name ? RENDER_PIPELINE_CHANGE_TYPES[name] : undefined;
        if (changeType) {
            changeType.optionalTypes = queryRenderComponents(changeType.componentKey);
        }
        if (prop.isArray && prop.elementTypeData && changeType) {
            modifyRenderPipelineProp(prop.elementTypeData);
            prop.elementTypeData.optionalTypes = changeType.optionalTypes;
        }
        for (const key in prop.value) {
            const child = prop.value[key];
            if (child && typeof child === 'object') {
                modifyRenderPipelineProp(child, key);
                if (prop.isArray && changeType) {
                    child.optionalTypes = changeType.optionalTypes;
                }
            }
        }
    }
}
function queryRenderComponents(type = undefined) {
    const editorExtends = globalThis.EditorExtends;
    const menus = editorExtends?.Component?.getMenus?.() || [];
    const prefix = `hidden:render_${type}/`;
    return menus
        .map((item) => {
        if (!item?.component || typeof item.menuPath !== 'string') {
            return null;
        }
        if (!item.menuPath.includes(prefix)) {
            return null;
        }
        return item.menuPath.replace(prefix, '');
    })
        .filter(Boolean);
}
function getFieldDumpFromAssetDump(type, dump) {
    if (type === 'cc.RenderPipeline') {
        if (!isPropertyLike(dump) || !isRecord(dump.value)) {
            throw new Error('Invalid RenderPipeline serialized dump.');
        }
        return dump.value;
    }
    return dump;
}
function normalizePatchFieldDump(type, currentDump, patch) {
    const patchRecord = type === 'cc.RenderPipeline' && isPropertyLike(patch)
        ? patch.value
        : patch;
    if (!isRecord(patchRecord)) {
        throw new Error('Serialized asset patch must be a dump object.');
    }
    const result = {};
    for (const [key, value] of Object.entries(patchRecord)) {
        const current = currentDump[key];
        if (!current) {
            throw new Error(`Unknown serialized field: ${key}`);
        }
        const next = isPropertyLike(value)
            ? (0, cloneDeep_1.default)(value)
            : {
                ...(0, cloneDeep_1.default)(current),
                value,
            };
        validatePropertyPatch(key, current, next);
        result[key] = next;
    }
    return result;
}
function validatePropertyPatch(path, current, next) {
    const changed = !(0, isEqual_1.default)(current.value, next.value);
    if ((current.visible === false || current.readonly === true) && changed) {
        throw new Error(`Serialized field is readonly or hidden and can not be modified: ${path}`);
    }
    if (Array.isArray(current.value) && Array.isArray(next.value)) {
        for (let i = 0; i < next.value.length; i++) {
            const nextChild = next.value[i];
            const currentChild = findCurrentArrayChild(current.value, nextChild, i);
            if (!currentChild) {
                continue;
            }
            if (isPropertyLike(currentChild) && isPropertyLike(nextChild)) {
                validatePropertyPatch(`${path}.${i}`, currentChild, nextChild);
            }
        }
        return;
    }
    if (!isRecord(current.value) || !isRecord(next.value)) {
        return;
    }
    for (const [key, value] of Object.entries(next.value)) {
        const currentChild = current.value[key];
        if (!currentChild) {
            throw new Error(`Unknown serialized field: ${path}.${key}`);
        }
        if (isPropertyLike(currentChild) && isPropertyLike(value)) {
            validatePropertyPatch(`${path}.${key}`, currentChild, value);
        }
    }
}
function findCurrentArrayChild(currentValue, nextChild, index) {
    if (isPropertyLike(nextChild) && typeof nextChild.name === 'string') {
        const originalIndex = Number(nextChild.name);
        if (Number.isInteger(originalIndex) && originalIndex >= 0 && originalIndex < currentValue.length) {
            return currentValue[originalIndex];
        }
    }
    return currentValue[index];
}
async function applyFieldDumpPatch(instance, currentDump, patchDump) {
    for (const key in patchDump) {
        const current = currentDump[key];
        if (current.visible === false || current.readonly === true) {
            continue;
        }
        await setValue(instance, patchDump, key);
    }
}
async function setValue(prop, dump, key) {
    if (!dump) {
        return;
    }
    if (typeof dump !== 'object') {
        if (key === 'uuid' && '_uuid' in prop) {
            prop._uuid = dump;
            return;
        }
        prop[key] = dump;
        return;
    }
    if (!dump[key].isArray) {
        if (dump[key].value === null || typeof dump[key].value !== 'object') {
            prop[key] = dump[key].value;
        }
        else {
            const names = Object.keys(dump[key].value);
            for (const name of names) {
                if (name === 'uuid') {
                    const uuid = extractUuidValue(dump[key].value[name]);
                    prop[key] = uuid ? createAssetReference(uuid, dump[key].type) : null;
                }
                else {
                    await setValue(prop[key], dump[key].value, name);
                }
            }
        }
    }
    else {
        const propKeyAttr = cc.Class.attr(prop.constructor, key);
        if (!Array.isArray(prop[key])) {
            prop[key] = getPropertyDefaultValue(propKeyAttr);
        }
        if (!Array.isArray(prop[key])) {
            delete prop[key];
        }
        else {
            const oldLength = prop[key].length;
            const newLength = Array.isArray(dump[key].value) ? dump[key].value.length : 0;
            if (newLength > oldLength) {
                for (let i = oldLength; i < newLength; i++) {
                    prop[key][i] = createValueForDumpItem(dump[key].value[i]);
                    await setValue(prop[key], dump[key].value, i.toString());
                }
            }
            else if (newLength < oldLength) {
                while (prop[key].length > newLength) {
                    prop[key].pop();
                }
            }
            else if (oldLength) {
                const arrayClone = prop[key].slice();
                prop[key] = [];
                for (let i = 0; i < oldLength; i++) {
                    if (dump[key].value[i] === undefined) {
                        continue;
                    }
                    prop[key][i] = arrayClone[dump[key].value[i].name];
                }
            }
            for (let i = 0; i < prop[key].length; i++) {
                const itemDump = dump[key].value[i];
                if (itemDump?.type && (!prop[key][i] || itemDump.type !== prop[key][i].constructor.name)) {
                    const typeClass = cc.js.getClassByName(itemDump.type);
                    if (typeClass) {
                        prop[key][i] = new typeClass();
                    }
                }
                await setValue(prop[key], dump[key].value, i.toString());
            }
        }
    }
}
function createValueForDumpItem(itemDump) {
    if (!itemDump?.type) {
        return null;
    }
    const typeClass = cc.js.getClassByName(itemDump.type);
    if (typeClass) {
        return new typeClass();
    }
    return getDefaultValueByType(itemDump.type);
}
function getDefaultValueByType(type, data) {
    switch (type) {
        case 'Boolean':
            return data ? data[0] : false;
        case 'Number':
        case 'Integer':
        case 'Float':
            return data ? data[0] : 0;
        case 'String':
            return data ? data[0] : '';
        case 'cc.Vec2':
            return data ? new cc.math.Vec2(data[0] || 0, data[1] || 0) : new cc.math.Vec2();
        case 'cc.Vec3':
            return data ? new cc.math.Vec3(data[0] || 0, data[1] || 0, data[2] || 0) : new cc.math.Vec3();
        case 'cc.Vec4':
            return data ? new cc.math.Vec4(data[0] || 0, data[1] || 0, data[2] || 0, data[3] || 0) : new cc.math.Vec4();
        case 'cc.Quat':
            return data ? new cc.math.Quat(data[0] || 0, data[1] || 0, data[2] || 0, data[3] || 1) : new cc.Quat();
        case 'cc.Color':
            if (Array.isArray(data)) {
                if (data[3] === undefined) {
                    data[3] = 1;
                }
                return new cc.Color(data[0] * 255, data[1] * 255, data[2] * 255, data[3] * 255);
            }
            return new cc.Color();
        case 'cc.Mat4':
            if (Array.isArray(data)) {
                return new cc.math.Mat4(data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15]);
            }
            return new cc.Mat4();
        case 'cc.Asset':
            return new cc.Asset();
        case 'cc.TextureBase':
            return new cc.TextureBase();
        case 'cc.Texture2D':
            return new cc.Texture2D();
        case 'cc.TextureCube':
            return new cc.TextureCube();
        default:
            return false;
    }
}
function createRenderPipelineInstanceIfNeeded(instance, patch) {
    if (!patch.type || instance.constructor.name === patch.type) {
        return instance;
    }
    const ctor = cc.js.getClassByName(patch.type);
    if (!ctor) {
        throw new Error(`RenderPipeline type can not be found: ${patch.type}`);
    }
    const next = new ctor();
    if ('_uuid' in next && '_uuid' in instance) {
        next._uuid = instance._uuid;
    }
    return next;
}
function extractUuidValue(value) {
    if (isPropertyLike(value)) {
        return typeof value.value === 'string' ? value.value : '';
    }
    return typeof value === 'string' ? value : '';
}
function createAssetReference(uuid, type) {
    const ctor = type ? cc.js.getClassByName(type) : undefined;
    return getEditorSerialize().asAsset(uuid, ctor);
}
function getEditorSerialize() {
    const serialize = globalThis.EditorExtends?.serialize || editor_extends_1.serialize;
    if (!serialize) {
        throw new Error('EditorExtends.serialize is not initialized.');
    }
    return serialize;
}
function formatSerializedContent(serialized) {
    return typeof serialized === 'string'
        ? serialized
        : JSON.stringify(serialized, null, 4);
}
function isPropertyLike(value) {
    return isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'value');
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplZC1kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL3NlcmlhbGl6ZWQtZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBZ0ViLGtEQVdDO0FBRUQsZ0RBc0JDO0FBK0VELHdEQWdJQztBQTRlRCxzREEyREM7QUFyMUJELHVDQUFvQztBQUNwQyxpRUFBeUM7QUFDekMsNkRBQXFDO0FBQ3JDLGlEQUE4RTtBQUk5RSxvRUFBaUQ7QUFDakQsNERBQXlDO0FBQ3pDLDZEQUF3RTtBQUN4RSx3REFBZ0M7QUFhaEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7QUFFN0UsTUFBTSw0QkFBNEIsR0FBc0U7SUFDcEcsTUFBTSxFQUFFO1FBQ0osWUFBWSxFQUFFLE1BQU07UUFDcEIsYUFBYSxFQUFFLEVBQUU7S0FDcEI7SUFDRCxPQUFPLEVBQUU7UUFDTCxZQUFZLEVBQUUsT0FBTztRQUNyQixhQUFhLEVBQUUsRUFBRTtLQUNwQjtDQUNKLENBQUM7QUFFRixNQUFNLGVBQWUsR0FBRztJQUNwQixVQUFVO0lBQ1YsWUFBWTtJQUNaLGFBQWE7SUFDYixhQUFhO0lBQ2IsT0FBTztJQUNQLFdBQVc7SUFDWCxNQUFNO0lBQ04sT0FBTztJQUNQLFNBQVM7SUFDVCxZQUFZO0lBQ1osTUFBTTtJQUNOLFFBQVE7SUFDUixjQUFjO0NBQ2pCLENBQUM7QUFFRixNQUFNLHlCQUF5QixHQUFHO0lBQzlCLGFBQWE7SUFDYixTQUFTO0NBQ0gsQ0FBQztBQUVYLE1BQU0sMkJBQTJCLEdBQUcsRUFBRSxDQUFDO0FBQ3ZDLE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFekMsS0FBSyxVQUFVLG1CQUFtQixDQUFDLGVBQXVCO0lBQzdELE1BQU0sRUFBRSxLQUFL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SUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQzlCLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDO1FBQzdCLENBQUM7SUFDTCxDQUFDO1NBQU0sSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDcEUsaUNBQWlDO0lBQ3JDLENBQUM7U0FBTSxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNwQyx1QkFBdUIsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbEUsQ0FBQztTQUFNLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUM1Qyx1QkFBdUIsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDcEUsQ0FBQztTQUFNLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUN2Qyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztTQUFNLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUM1Qyx1QkFBdUIsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDcEUsQ0FBQztTQUFNLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FB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Q0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3BGLEtBQUssU0FBUztZQUNWLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsRyxLQUFLLFNBQVM7WUFDVixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoSCxLQUFLLFNBQVM7WUFDVixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNHLEtBQUssVUFBVTtZQUNYLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDeEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEIsQ0FBQztnQkFDRCxPQUFPLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDcEYsQ0FBQztZQUNELE9BQU8sSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsS0FBSyxTQUFTO1lBQ1YsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDbkIsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLElBQUksQ0FBQyxFQUFFLENBQUMsRUFDUixJQUFJLENBQUMsRUFBRSxDQUFDLEVBQ1IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUNSLElBQUksQ0FBQyxFQUFFLENBQUMsRUFDUixJQUFJLENBQUMsRUFBRSxDQUFDLEVBQ1IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUNYLENBQUM7WUFDTixDQUFDO1lBQ0QsT0FBTyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QixLQUFLLFVBQVU7WUFDWCxPQUFPLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLEtBQUssZ0JBQWdCO1lBQ2pCLE9BQU8sSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDaEMsS0FBSyxjQUFjO1lBQ2YsT0FBTyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM5QixLQUFLLGdCQUFnQjtZQUNqQixPQUFPLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2hDO1lBQ0ksT0FBTyxLQUFLLENBQUM7SUFDckIsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLG9DQUFvQyxDQUFDLFFBQWEsRUFBRSxLQUFnQjtJQUN6RSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUQsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDUixNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUN4QixJQUFJLE9BQU8sSUFBSSxJQUFJLElBQUksT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUNoQyxDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBYztJQUNwQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sT0FBTyxLQUFLLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzlELENBQUM7SUFDRCxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbEQsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBWSxFQUFFLElBQWE7SUFDckQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQzNELE9BQU8sa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFFRCxTQUFTLGtCQUFrQjtJQUN2QixNQUFNLFNBQVMsR0FBSSxVQUFrQixDQUFDLGFBQWEsRUFBRSxTQUFTLElBQUksMEJBQWUsQ0FBQztJQUNsRixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDYixNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxTQUFTLHVCQUF1QixDQUFDLFVBQTJCO0lBQ3hELE9BQU8sT0FBTyxVQUFVLEtBQUssUUFBUTtRQUNqQyxDQUFDLENBQUMsVUFBVTtRQUNaLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLEtBQWM7SUFDbEMsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuRixDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsS0FBYztJQUM1QixPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5cbmltcG9ydCB7IHJlYWRKU09OIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IGNsb25lRGVlcCBmcm9tICdsb2Rhc2gvY2xvbmVEZWVwJztcbmltcG9ydCBpc0VxdWFsIGZyb20gJ2xvZGFzaC9pc0VxdWFsJztcbmltcG9ydCB7IGRlc2VyaWFsaXplIGFzIGRlc2VyaWFsaXplQXNzZXRTb3VyY2UgfSBmcm9tICcuL2Fzc2V0LWhhbmRsZXIvdXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBJQXNzZXQgfSBmcm9tICcuL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHR5cGUgeyBJQXNzZXRJbmZvIH0gZnJvbSAnLi9AdHlwZXMvcHVibGljJztcbmltcG9ydCB0eXBlIHsgSVByb3BlcnR5IH0gZnJvbSAnLi4vc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgYXNzZXRPcGVyYXRpb24gZnJvbSAnLi9tYW5hZ2VyL29wZXJhdGlvbic7XG5pbXBvcnQgYXNzZXRRdWVyeSBmcm9tICcuL21hbmFnZXIvcXVlcnknO1xuaW1wb3J0IHsgc2VyaWFsaXplIGFzIGVkaXRvclNlcmlhbGl6ZSB9IGZyb20gJy4uL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi9iYXNlL2kxOG4nO1xuXG5leHBvcnQgdHlwZSBTZXJpYWxpemVkQXNzZXREdW1wID0gUmVjb3JkPHN0cmluZywgSVByb3BlcnR5PiB8IElQcm9wZXJ0eTtcbmV4cG9ydCB0eXBlIFNlcmlhbGl6ZWRBc3NldFBhdGNoID0gU2VyaWFsaXplZEFzc2V0RHVtcCB8IFBhcnRpYWw8UmVjb3JkPHN0cmluZywgSVByb3BlcnR5IHwgdW5rbm93bj4+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlcmlhbGl6ZWRBc3NldFF1ZXJ5UmVzdWx0IHtcbiAgICB1dWlkOiBzdHJpbmc7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIGltcG9ydGVyOiBzdHJpbmc7XG4gICAgZHVtcDogU2VyaWFsaXplZEFzc2V0RHVtcDtcbn1cblxuY29uc3QgU1VQUE9SVEVEX1RZUEVTID0gbmV3IFNldChbJ2NjLlBoeXNpY3NNYXRlcmlhbCcsICdjYy5SZW5kZXJQaXBlbGluZSddKTtcblxuY29uc3QgUkVOREVSX1BJUEVMSU5FX0NIQU5HRV9UWVBFUzogUmVjb3JkPHN0cmluZywgeyBjb21wb25lbnRLZXk6IHN0cmluZzsgb3B0aW9uYWxUeXBlczogc3RyaW5nW10gfT4gPSB7XG4gICAgX2Zsb3dzOiB7XG4gICAgICAgIGNvbXBvbmVudEtleTogJ2Zsb3cnLFxuICAgICAgICBvcHRpb25hbFR5cGVzOiBbXSxcbiAgICB9LFxuICAgIF9zdGFnZXM6IHtcbiAgICAgICAgY29tcG9uZW50S2V5OiAnc3RhZ2UnLFxuICAgICAgICBvcHRpb25hbFR5cGVzOiBbXSxcbiAgICB9LFxufTtcblxuY29uc3QgQVRUUklCVVRFX1BST1BTID0gW1xuICAgICdlbnVtTGlzdCcsXG4gICAgJ3JhZGlvR3JvdXAnLFxuICAgICdiaXRtYXNrTGlzdCcsXG4gICAgJ2Rpc3BsYXlOYW1lJyxcbiAgICAnZ3JvdXAnLFxuICAgICdtdWx0aWxpbmUnLFxuICAgICdzdGVwJyxcbiAgICAnc2xpZGUnLFxuICAgICd0b29sdGlwJyxcbiAgICAnYW5pbWF0YWJsZScsXG4gICAgJ3VuaXQnLFxuICAgICdyYWRpYW4nLFxuICAgICdkaXNwbGF5T3JkZXInLFxuXTtcblxuY29uc3QgQVVUT19JMThOX0FUVFJJQlVURV9OQU1FUyA9IFtcbiAgICAnZGlzcGxheU5hbWUnLFxuICAgICd0b29sdGlwJyxcbl0gYXMgY29uc3Q7XG5cbmNvbnN0IE1BWF9DTEFTU19OQU1FX0xPT0tVUF9ERVBUSCA9IDEwO1xuY29uc3QgQVVUT19JMThOX0NMQVNTX1BSRUZJWEVTID0gWydjYy4nLCAnc3AuJ107XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeVNlcmlhbGl6ZWREYXRhKHV1aWRPclVybE9yUGF0aDogc3RyaW5nKTogUHJvbWlzZTxTZXJpYWxpemVkQXNzZXRRdWVyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHsgYXNzZXQsIGFzc2V0SW5mbyB9ID0gcmVzb2x2ZVNlcmlhbGl6ZWRBc3NldCh1dWlkT3JVcmxPclBhdGgpO1xuICAgIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgbG9hZFNlcmlhbGl6ZWRBc3NldEluc3RhbmNlKGFzc2V0KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgIHVybDogYXNzZXRJbmZvLnVybCxcbiAgICAgICAgdHlwZTogYXNzZXRJbmZvLnR5cGUsXG4gICAgICAgIGltcG9ydGVyOiBhc3NldEluZm8uaW1wb3J0ZXIsXG4gICAgICAgIGR1bXA6IGF3YWl0IGVuY29kZVNlcmlhbGl6ZWRBc3NldER1bXAoaW5zdGFuY2UsIGFzc2V0SW5mby50eXBlKSxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVNlcmlhbGl6ZWREYXRhKFxuICAgIHV1aWRPclVybE9yUGF0aDogc3RyaW5nLFxuICAgIHBhdGNoOiBTZXJpYWxpemVkQXNzZXRQYXRjaCxcbik6IFByb21pc2U8U2VyaWFsaXplZEFzc2V0UXVlcnlSZXN1bHQ+IHtcbiAgICBjb25zdCB7IGFzc2V0LCBhc3NldEluZm8gfSA9IHJlc29sdmVTZXJpYWxpemVkQXNzZXQodXVpZE9yVXJsT3JQYXRoKTtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGF3YWl0IGxvYWRTZXJpYWxpemVkQXNzZXRJbnN0YW5jZShhc3NldCk7XG4gICAgbGV0IG5vcm1hbGl6ZWRJbnN0YW5jZSA9IGluc3RhbmNlO1xuXG4gICAgaWYgKGFzc2V0SW5mby50eXBlID09PSAnY2MuUmVuZGVyUGlwZWxpbmUnICYmIGlzUHJvcGVydHlMaWtlKHBhdGNoKSkge1xuICAgICAgICBub3JtYWxpemVkSW5zdGFuY2UgPSBjcmVhdGVSZW5kZXJQaXBlbGluZUluc3RhbmNlSWZOZWVkZWQobm9ybWFsaXplZEluc3RhbmNlLCBwYXRjaCk7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudER1bXAgPSBhd2FpdCBlbmNvZGVTZXJpYWxpemVkQXNzZXREdW1wKG5vcm1hbGl6ZWRJbnN0YW5jZSwgYXNzZXRJbmZvLnR5cGUpO1xuICAgIGNvbnN0IGN1cnJlbnRGaWVsZER1bXAgPSBnZXRGaWVsZER1bXBGcm9tQXNzZXREdW1wKGFzc2V0SW5mby50eXBlLCBjdXJyZW50RHVtcCk7XG4gICAgY29uc3QgcGF0Y2hGaWVsZER1bXAgPSBub3JtYWxpemVQYXRjaEZpZWxkRHVtcChhc3NldEluZm8udHlwZSwgY3VycmVudEZpZWxkRHVtcCwgcGF0Y2gpO1xuXG4gICAgYXdhaXQgYXBwbHlGaWVsZER1bXBQYXRjaChub3JtYWxpemVkSW5zdGFuY2UsIGN1cnJlbnRGaWVsZER1bXAsIHBhdGNoRmllbGREdW1wKTtcblxuICAgIGNvbnN0IHNlcmlhbGl6ZWQgPSBnZXRFZGl0b3JTZXJpYWxpemUoKShub3JtYWxpemVkSW5zdGFuY2UpO1xuICAgIGF3YWl0IGFzc2V0T3BlcmF0aW9uLnNhdmVBc3NldChhc3NldC51dWlkLCBmb3JtYXRTZXJpYWxpemVkQ29udGVudChzZXJpYWxpemVkKSk7XG5cbiAgICByZXR1cm4gcXVlcnlTZXJpYWxpemVkRGF0YShhc3NldC51dWlkKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVNlcmlhbGl6ZWRBc3NldCh1dWlkT3JVcmxPclBhdGg6IHN0cmluZyk6IHsgYXNzZXQ6IElBc3NldDsgYXNzZXRJbmZvOiBJQXNzZXRJbmZvIH0ge1xuICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHV1aWRPclVybE9yUGF0aCk7XG4gICAgaWYgKCFhc3NldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlcmlhbGl6ZWQgYXNzZXQgY2FuIG5vdCBiZSBmb3VuZDogJHt1dWlkT3JVcmxPclBhdGh9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXRJbmZvID0gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChhc3NldCk7XG4gICAgaWYgKCFTVVBQT1JURURfVFlQRVMuaGFzKGFzc2V0SW5mby50eXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHNlcmlhbGl6ZWQgYXNzZXQgdHlwZTogJHthc3NldEluZm8udHlwZX0uIE9ubHkgY2MuUGh5c2ljc01hdGVyaWFsIGFuZCBjYy5SZW5kZXJQaXBlbGluZSBhcmUgc3VwcG9ydGVkLmApO1xuICAgIH1cblxuICAgIGlmICghYXNzZXQuc291cmNlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2VyaWFsaXplZCBhc3NldCBoYXMgbm8gc291cmNlIGZpbGU6ICR7dXVpZE9yVXJsT3JQYXRofWApO1xuICAgIH1cblxuICAgIHJldHVybiB7IGFzc2V0LCBhc3NldEluZm8gfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFNlcmlhbGl6ZWRBc3NldEluc3RhbmNlKGFzc2V0OiBJQXNzZXQpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHJlYWRKU09OKGFzc2V0LnNvdXJjZSk7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBkZXNlcmlhbGl6ZUFzc2V0U291cmNlKHNvdXJjZSk7XG4gICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERlc2VyaWFsaXplIHNlcmlhbGl6ZWQgYXNzZXQgZmFpbGVkOiAke2Fzc2V0LnVybCB8fCBhc3NldC51dWlkfWApO1xuICAgIH1cbiAgICBpZiAoJ191dWlkJyBpbiBpbnN0YW5jZSkge1xuICAgICAgICBpbnN0YW5jZS5fdXVpZCA9IGFzc2V0LnV1aWQ7XG4gICAgfVxuICAgIHJldHVybiBpbnN0YW5jZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5jb2RlU2VyaWFsaXplZEFzc2V0RHVtcChpbnN0YW5jZTogYW55LCB0eXBlOiBzdHJpbmcpOiBQcm9taXNlPFNlcmlhbGl6ZWRBc3NldER1bXA+IHtcbiAgICBpZiAodHlwZSA9PT0gJ2NjLlJlbmRlclBpcGVsaW5lJykge1xuICAgICAgICBjb25zdCBkdW1wID0gZW5jb2RlQ29tcG9uZW50QXNzZXQoaW5zdGFuY2UsIG1vZGlmeVJlbmRlclBpcGVsaW5lUHJvcCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiAnUGlwZWxpbmUnLFxuICAgICAgICAgICAgdHlwZTogaW5zdGFuY2UuY29uc3RydWN0b3IubmFtZSxcbiAgICAgICAgICAgIHZhbHVlOiBkdW1wLFxuICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHJlYWRvbmx5OiBmYWxzZSxcbiAgICAgICAgICAgIG9wdGlvbmFsVHlwZXM6IHF1ZXJ5UmVuZGVyQ29tcG9uZW50cygncGlwZWxpbmUnKSxcbiAgICAgICAgICAgIHBhdGg6ICcnLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBlbmNvZGVDb21wb25lbnRBc3NldChpbnN0YW5jZSwgbW9kaWZ5UHJvcE5hbWUpO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVDb21wb25lbnRBc3NldChcbiAgICBpbnN0YW5jZTogYW55LFxuICAgIG1vZGlmeVByb3A6IChwcm9wOiBJUHJvcGVydHksIG5hbWU/OiBzdHJpbmcpID0+IHZvaWQsXG4pOiBSZWNvcmQ8c3RyaW5nLCBJUHJvcGVydHk+IHtcbiAgICBjb25zdCBjdG9yID0gaW5zdGFuY2UuY29uc3RydWN0b3I7XG4gICAgaWYgKCFjdG9yLl9fcHJvcHNfXykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlcmlhbGl6ZWQgYXNzZXQgdHlwZSBoYXMgbm8gZWRpdGFibGUgcHJvcGVydGllczogJHtjdG9yLm5hbWUgfHwgJ1Vua25vd24nfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBJUHJvcGVydHk+ID0ge307XG4gICAgY3Rvci5fX3Byb3BzX18uZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghKGtleSBpbiBpbnN0YW5jZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhdHRycyA9IGNjLkNsYXNzLmF0dHIoY3Rvciwga2V5KTtcbiAgICAgICAgICAgIGNvbnN0IGR1bXBEYXRhID0gZW5jb2RlU2VyaWFsaXplZE9iamVjdChpbnN0YW5jZVtrZXldLCBhdHRycywgaW5zdGFuY2UsIGtleSk7XG4gICAgICAgICAgICBpZiAoZHVtcERhdGEudHlwZSAhPT0gJ1Vua25vd24nKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVba2V5XSA9IGR1bXBEYXRhO1xuICAgICAgICAgICAgICAgIG1vZGlmeVByb3AodmFsdWVba2V5XSwga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQXNzZXQgcHJvcGVydHkgZHVtcCBmYWlsZWQ6XFxuIEFzc2V0OiAke2N0b3IubmFtZX1cXG4gUHJvcGVydHk6ICR7a2V5fWApO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtrZXldO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlU2VyaWFsaXplZE9iamVjdChcbiAgICBvYmplY3Q6IGFueSxcbiAgICBhdHRyaWJ1dGVzOiBhbnksXG4gICAgb3duZXI6IGFueSA9IG51bGwsXG4gICAgb2JqZWN0S2V5Pzogc3RyaW5nLFxuICAgIGlzVGVtcGxhdGU/OiBib29sZWFuLFxuKTogSVByb3BlcnR5IHtcbiAgICBhdHRyaWJ1dGVzID0gYXR0cmlidXRlcyB8fCB7fTtcbiAgICBjb25zdCBjdG9yID0gZ2V0UHJvcGVydHlDb25zdHJ1Y3RvcihvYmplY3QsIGF0dHJpYnV0ZXMpO1xuICAgIGxldCBkZWZWYWx1ZSA9IGdldFByb3BlcnR5RGVmYXVsdChhdHRyaWJ1dGVzKTtcblxuICAgIGlmIChkZWZWYWx1ZSAmJiB0eXBlb2YgZGVmVmFsdWUgPT09ICdvYmplY3QnICYmIGRlZlZhbHVlLmNvbnN0cnVjdG9yICYmIEFycmF5LmlzQXJyYXkoZGVmVmFsdWUuY29uc3RydWN0b3IuX19wcm9wc19fKSkge1xuICAgICAgICBjb25zdCByZXN1bHQ6IHsgdHlwZTogc3RyaW5nOyB2YWx1ZTogUmVjb3JkPHN0cmluZywgSVByb3BlcnR5PiB9ID0ge1xuICAgICAgICAgICAgdHlwZTogZ2V0VHlwZU5hbWUoZGVmVmFsdWUuY29uc3RydWN0b3IpLFxuICAgICAgICAgICAgdmFsdWU6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBkZWZWYWx1ZS5jb25zdHJ1Y3Rvci5fX3Byb3BzX18uZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJzID0gY2MuQ2xhc3MuYXR0cihkZWZWYWx1ZS5jb25zdHJ1Y3Rvciwga2V5KTtcbiAgICAgICAgICAgIGNvbnN0IGR1bXBEYXRhID0gZW5jb2RlU2VyaWFsaXplZE9iamVjdChkZWZWYWx1ZVtrZXldLCBhdHRycywgZGVmVmFsdWUsIGtleSk7XG4gICAgICAgICAgICBpZiAoZHVtcERhdGEudHlwZSAhPT0gJ1Vua25vd24nKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnZhbHVlW2tleV0gPSBkdW1wRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRlZlZhbHVlID0gcmVzdWx0O1xuICAgIH1cblxuICAgIGxldCB0eXBlID0gZ2V0VHlwZU5hbWUoY3Rvcik7XG4gICAgaWYgKG93bmVyID09PSBudWxsICYmIGF0dHJpYnV0ZXMuZGVmYXVsdCAhPT0gbnVsbCAmJiBhdHRyaWJ1dGVzLmRlZmF1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBkZWZDdG9yID0gZ2V0UHJvcGVydHlDb25zdHJ1Y3RvcihhdHRyaWJ1dGVzLmRlZmF1bHQsIGF0dHJpYnV0ZXMpO1xuICAgICAgICBjb25zdCBkZWZUeXBlID0gZ2V0VHlwZU5hbWUoZGVmQ3Rvcik7XG4gICAgICAgIGlmIChkZWZUeXBlICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0eXBlID0gJ1Vua25vd24nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YTogSVByb3BlcnR5ID0ge1xuICAgICAgICBuYW1lOiBvYmplY3RLZXksXG4gICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICBkZWZhdWx0OiBkZWZWYWx1ZSxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgcGF0aDogJycsXG4gICAgICAgIHJlYWRvbmx5OiAhIWF0dHJpYnV0ZXMucmVhZG9ubHksXG4gICAgICAgIHZpc2libGU6IGF0dHJpYnV0ZXMudmlzaWJsZSA/PyB0cnVlLFxuICAgICAgICBhbmltYXRhYmxlOiBhdHRyaWJ1dGVzLmFuaW1hdGFibGUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiAhIWF0dHJpYnV0ZXMuYW5pbWF0YWJsZSxcbiAgICB9O1xuXG4gICAgaWYgKGF0dHJpYnV0ZXMudXNlckRhdGEpIHtcbiAgICAgICAgZGF0YS51c2VyRGF0YSA9IGF0dHJpYnV0ZXMudXNlckRhdGE7XG4gICAgfVxuXG4gICAgYXBwbHlQcm9wZXJ0eUF0dHJpYnV0ZXMoZGF0YSwgYXR0cmlidXRlcywgb3duZXIpO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGVmVmFsdWUpIHx8IEFycmF5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgICAgICBkYXRhLmlzQXJyYXkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmlzQXJyYXkpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG9iamVjdCkgfHwgZGF0YS50eXBlID09PSAnQXJyYXknKSB7XG4gICAgICAgICAgICBkYXRhLnR5cGUgPSAnVW5rbm93bic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZEF0dHJpYnV0ZTogYW55ID0geyAuLi5hdHRyaWJ1dGVzLCB2aXNpYmxlOiB0cnVlIH07XG4gICAgICAgICAgICBpZiAoY2hpbGRBdHRyaWJ1dGUucmVhZG9ubHkgJiYgY2hpbGRBdHRyaWJ1dGUucmVhZG9ubHkuZGVlcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRBdHRyaWJ1dGUucmVhZG9ubHkgPSBjaGlsZEF0dHJpYnV0ZS5yZWFkb25seS5kZWVwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eURlZmF1bHRWYWx1ZSA9IGdldFByb3BlcnR5RGVmYXVsdFZhbHVlKGF0dHJpYnV0ZXMpO1xuICAgICAgICAgICAgY2hpbGRBdHRyaWJ1dGUuZGVmYXVsdCA9IGdldEVsZW1lbnREZWZhdWx0VmFsdWUoYXR0cmlidXRlcywgcHJvcGVydHlEZWZhdWx0VmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAoIWlzVGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmVsZW1lbnRUeXBlRGF0YSA9IGVuY29kZVNlcmlhbGl6ZWRPYmplY3QoY2hpbGRBdHRyaWJ1dGUuZGVmYXVsdCwgY2hpbGRBdHRyaWJ1dGUsIHByb3BlcnR5RGVmYXVsdFZhbHVlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHRWYWx1ZTogSVByb3BlcnR5W10gPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IG9iamVjdFtpXTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkQXR0cmlidXRlLmN0b3IgPSBpdGVtLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGVuY29kZVNlcmlhbGl6ZWRPYmplY3QoaXRlbSwgY2hpbGRBdHRyaWJ1dGUsIG93bmVyKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnR5cGUgIT09ICdVbmtub3duJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRWYWx1ZS5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLmVsZW1lbnRUeXBlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRWYWx1ZS5wdXNoKGRhdGEuZWxlbWVudFR5cGVEYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkYXRhLnZhbHVlID0gcmVzdWx0VmFsdWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVuY29kZUtub3duUHJvcGVydHlUeXBlKGRhdGEudHlwZSwgb2JqZWN0LCBkYXRhLCB7IGN0b3IgfSkpIHtcbiAgICAgICAgLy8gRW5jb2RlZCBieSBrbm93biB0eXBlIGhhbmRsZXIuXG4gICAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcob2JqZWN0KSkge1xuICAgICAgICBlbmNvZGVLbm93blByb3BlcnR5VHlwZSgnVHlwZWRBcnJheScsIG9iamVjdCwgZGF0YSwgeyBjdG9yIH0pO1xuICAgIH0gZWxzZSBpZiAoaXNDaGlsZENsYXNzT2YoY3RvciwgY2MuVmFsdWVUeXBlKSkge1xuICAgICAgICBlbmNvZGVLbm93blByb3BlcnR5VHlwZSgnY2MuVmFsdWVUeXBlJywgb2JqZWN0LCBkYXRhLCB7IGN0b3IgfSk7XG4gICAgfSBlbHNlIGlmIChpc0NoaWxkQ2xhc3NPZihjdG9yLCBjYy5Ob2RlKSkge1xuICAgICAgICBlbmNvZGVLbm93blByb3BlcnR5VHlwZSgnY2MuTm9kZScsIG9iamVjdCwgZGF0YSwgeyBjdG9yIH0pO1xuICAgIH0gZWxzZSBpZiAoaXNDaGlsZENsYXNzT2YoY3RvciwgY2MuQ29tcG9uZW50KSkge1xuICAgICAgICBlbmNvZGVLbm93blByb3BlcnR5VHlwZSgnY2MuQ29tcG9uZW50Jywgb2JqZWN0LCBkYXRhLCB7IGN0b3IgfSk7XG4gICAgfSBlbHNlIGlmIChpc0NoaWxkQ2xhc3NPZihjdG9yLCBjYy5Bc3NldCkpIHtcbiAgICAgICAgZW5jb2RlS25vd25Qcm9wZXJ0eVR5cGUoJ2NjLkFzc2V0Jywgb2JqZWN0LCBkYXRhLCB7IGN0b3IgfSk7XG4gICAgfSBlbHNlIGlmIChjdG9yICYmIGN0b3IuX19wcm9wc19fKSB7XG4gICAgICAgIGlmIChvYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgSVByb3BlcnR5PiA9IHt9O1xuICAgICAgICAgICAgY3Rvci5fX3Byb3BzX18uZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRycyA9IGNjLkNsYXNzLmF0dHIob2JqZWN0LCBrZXkpO1xuICAgICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLnJlYWRvbmx5ICYmIGF0dHJpYnV0ZXMucmVhZG9ubHkuZGVlcCkge1xuICAgICAgICAgICAgICAgICAgICBhdHRycy5yZWFkb25seSA9IHsgZGVlcDogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXBEYXRhID0gZW5jb2RlU2VyaWFsaXplZE9iamVjdChvYmplY3Rba2V5XSwgYXR0cnMsIG9iamVjdCwga2V5KTtcbiAgICAgICAgICAgICAgICBpZiAoZHVtcERhdGEudHlwZSAhPT0gJ1Vua25vd24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gZHVtcERhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFwcGx5Q29uc3RydWN0b3JSZXdyaXRlVHlwZShkdW1wRGF0YSwgb2JqZWN0W2tleV0sIGF0dHJzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGF0YS52YWx1ZSA9IHJlc3VsdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEudmFsdWUgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgIT09ICdVbmtub3duJykge1xuICAgICAgICBkYXRhLnZhbHVlID0gb2JqZWN0O1xuICAgIH1cblxuICAgIGlmIChjdG9yKSB7XG4gICAgICAgIGRhdGEuZXh0ZW5kcyA9IGdldFR5cGVJbmhlcml0YW5jZUNoYWluKGN0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wZXJ0eURlZmF1bHQoYXR0cmlidXRlOiBhbnkpIHtcbiAgICByZXR1cm4gdHlwZW9mIGF0dHJpYnV0ZS5kZWZhdWx0ID09PSAnZnVuY3Rpb24nID8gYXR0cmlidXRlLmRlZmF1bHQoKSA6IGF0dHJpYnV0ZS5kZWZhdWx0O1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wZXJ0eUNvbnN0cnVjdG9yKG9iamVjdDogYW55LCBhdHRyaWJ1dGU6IGFueSkge1xuICAgIGlmIChhdHRyaWJ1dGUgJiYgYXR0cmlidXRlLmN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZS5jdG9yO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0ID09PSBudWxsIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IG9iamVjdC5jb25zdHJ1Y3Rvcjtcbn1cblxuZnVuY3Rpb24gZ2V0VHlwZU5hbWUoY3RvcjogYW55KSB7XG4gICAgcmV0dXJuIGN0b3IgPyBjYy5qcy5nZXRDbGFzc05hbWUoY3RvcikgfHwgY3Rvci5uYW1lIHx8ICdVbmtub3duJyA6ICdVbmtub3duJztcbn1cblxuZnVuY3Rpb24gZ2V0VHlwZUluaGVyaXRhbmNlQ2hhaW4oY3RvcjogYW55KSB7XG4gICAgcmV0dXJuIGNjLkNsYXNzLmdldEluaGVyaXRhbmNlQ2hhaW4oY3RvcilcbiAgICAgICAgLm1hcCgoaXRlbUN0b3I6IGFueSkgPT4gZ2V0VHlwZU5hbWUoaXRlbUN0b3IpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xufVxuXG5mdW5jdGlvbiBhcHBseVByb3BlcnR5QXR0cmlidXRlcyhkYXRhOiBJUHJvcGVydHksIGF0dHJpYnV0ZXM6IGFueSwgb3duZXI6IGFueSkge1xuICAgIFsndmlzaWJsZScsICdtaW4nLCAnbWF4J10uZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc29sdmVBdHRyaWJ1dGVWYWx1ZShuYW1lLCBhdHRyaWJ1dGVzLCBvd25lcik7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAoZGF0YSBhcyBhbnkpW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghYXR0cmlidXRlcy5jdG9yICYmIGF0dHJpYnV0ZXMudHlwZSkge1xuICAgICAgICBkYXRhLnR5cGUgPSBgJHthdHRyaWJ1dGVzLnR5cGV9YDtcbiAgICB9XG5cbiAgICBpZiAoJ2VudW1MaXN0JyBpbiBhdHRyaWJ1dGVzICYmIGF0dHJpYnV0ZXMudHlwZSA9PT0gJ0VudW0nKSB7XG4gICAgICAgIGRhdGEudHlwZSA9ICdFbnVtJztcbiAgICB9XG5cbiAgICBpZiAoYXR0cmlidXRlcy5oYXNHZXR0ZXIgJiYgIWF0dHJpYnV0ZXMuaGFzU2V0dGVyKSB7XG4gICAgICAgIGRhdGEucmVhZG9ubHkgPSB0cnVlO1xuICAgIH1cblxuICAgIEFUVFJJQlVURV9QUk9QUy5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGF0dHJpYnV0ZXMsIHByb3BOYW1lKSkge1xuICAgICAgICAgICAgKGRhdGEgYXMgYW55KVtwcm9wTmFtZV0gPSBhdHRyaWJ1dGVzW3Byb3BOYW1lXTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXBwbHlBdXRvSTE4bkF0dHJpYnV0ZXMoZGF0YSwgYXR0cmlidXRlcywgb3duZXIpO1xuICAgIHRyYW5zbGF0ZUkxOG5TdHJpbmdzRGVlcChkYXRhKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUF0dHJpYnV0ZVZhbHVlKGF0dHJpYnV0ZU5hbWU6IHN0cmluZywgYXR0cmlidXRlczogYW55LCBvd25lcjogYW55KSB7XG4gICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICBpZiAoYXR0cmlidXRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKCFvd25lcikge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZS5jYWxsKG93bmVyKTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gISF2YWx1ZSA6IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ2Jvb2xlYW4nID8gISFhdHRyaWJ1dGUgOiBhdHRyaWJ1dGU7XG59XG5cbmZ1bmN0aW9uIGVuY29kZUtub3duUHJvcGVydHlUeXBlKHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCwgb2JqZWN0OiBhbnksIGRhdGE6IElQcm9wZXJ0eSwgb3B0czogYW55KSB7XG4gICAgc3dpdGNoICh0eXBlIHx8ICcnKSB7XG4gICAgICAgIGNhc2UgJ051bWJlcic6XG4gICAgICAgIGNhc2UgJ0VudW0nOlxuICAgICAgICBjYXNlICdTdHJpbmcnOlxuICAgICAgICAgICAgZGF0YS52YWx1ZSA9IG9iamVjdDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlICdUeXBlZEFycmF5JzpcbiAgICAgICAgICAgIGRhdGEudmFsdWUgPSBvYmplY3QgPyBuZXcgKG9iamVjdC5jb25zdHJ1Y3Rvcikob2JqZWN0KSA6IG9iamVjdDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlICdjYy5WYWx1ZVR5cGUnOiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBnZXRFZGl0b3JTZXJpYWxpemUoKShvYmplY3QsIHsgc3RyaW5naWZ5OiBmYWxzZSwgZm9yY2VJbmxpbmU6IHRydWUgfSkgYXMgYW55O1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkdW1wLl9fdHlwZV9fO1xuICAgICAgICAgICAgICAgIGRhdGEudmFsdWUgPSBkdW1wO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1ZhbHVlIGR1bXAgZmFpbGVkLicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gZ2V0RWRpdG9yU2VyaWFsaXplKCkobmV3IG9wdHMuY3RvcigpLCB7IHN0cmluZ2lmeTogZmFsc2UsIGZvcmNlSW5saW5lOiB0cnVlIH0pIGFzIGFueTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZHVtcC5fX3R5cGVfXztcbiAgICAgICAgICAgICAgICBkYXRhLnZhbHVlID0gZHVtcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ2NjLk5vZGUnOlxuICAgICAgICBjYXNlICdjYy5Db21wb25lbnQnOlxuICAgICAgICAgICAgZGF0YS52YWx1ZSA9IHsgdXVpZDogb2JqZWN0ID8gb2JqZWN0LnV1aWQgfHwgJycgOiAnJyB9O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGNhc2UgJ2NjLkFzc2V0Jzoge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IG9iamVjdCA/IG9iamVjdC5fdXVpZCB8fCAnJyA6ICcnO1xuICAgICAgICAgICAgZGF0YS52YWx1ZSA9IHsgdXVpZDogdXVpZC5zdGFydHNXaXRoKCdwbV8nKSA/ICcnIDogdXVpZCB9O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5QXV0b0kxOG5BdHRyaWJ1dGVzKGRhdGE6IElQcm9wZXJ0eSwgYXR0cmlidXRlczogYW55LCBvd25lcjogYW55KSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhLm5hbWUgIT09ICdzdHJpbmcnIHx8ICFvd25lciB8fCB0eXBlb2Ygb3duZXIgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvd25lclR5cGVOYW1lID0gZmluZENsYXNzTmFtZShvd25lciwgZGF0YS5uYW1lKTtcbiAgICBpZiAoIW93bmVyVHlwZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIEFVVE9fSTE4Tl9BVFRSSUJVVEVfTkFNRVMuZm9yRWFjaCgoYXR0cmlidXRlTmFtZSkgPT4ge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGF0dHJpYnV0ZXMsIGF0dHJpYnV0ZU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgKGRhdGEgYXMgYW55KVthdHRyaWJ1dGVOYW1lXSA9IGBpMThuOkVOR0lORS5jbGFzc2VzLiR7b3duZXJUeXBlTmFtZX0ucHJvcGVydGllcy4ke2RhdGEubmFtZX0uJHthdHRyaWJ1dGVOYW1lfWA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRDbGFzc05hbWUoY2NDbGFzc09iamVjdDogYW55LCBwcm9wZXJ0eTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgZGVwdGggPSAwO1xuICAgIGxldCBwcm90byA9IGNjQ2xhc3NPYmplY3Q7XG4gICAgd2hpbGUgKHByb3RvICYmIGRlcHRoIDwgTUFYX0NMQVNTX05BTUVfTE9PS1VQX0RFUFRIKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNjLmpzLmdldENsYXNzTmFtZShwcm90byk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGNsYXNzTmFtZVxuICAgICAgICAgICAgJiYgQVVUT19JMThOX0NMQVNTX1BSRUZJWEVTLnNvbWUoKHByZWZpeCkgPT4gY2xhc3NOYW1lLnN0YXJ0c1dpdGgocHJlZml4KSlcbiAgICAgICAgICAgICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwcm90bywgcHJvcGVydHkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIGNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgICAgIGRlcHRoKys7XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGVJMThuU3RyaW5nc0RlZXAob2JqOiBhbnksIGRlcHRoID0gMCk6IHZvaWQge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGRlcHRoID4gMTApIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbdHJhbnNsYXRlSTE4blN0cmluZ3NEZWVwXSBNYXggcmVjdXJzaW9uIGRlcHRoIGV4Y2VlZGVkOyBuZXN0ZWQgaTE4biBzdHJpbmdzIGF0IHRoaXMgbGV2ZWwgd2lsbCBub3QgYmUgdHJhbnNsYXRlZDonLCBvYmopO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iaikpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gaTE4bi50cmFuc0kxOG5OYW1lKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWVbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW2ldID0gaTE4bi50cmFuc0kxOG5OYW1lKHZhbHVlW2ldKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGVJMThuU3RyaW5nc0RlZXAodmFsdWVbaV0sIGRlcHRoICsgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJhbnNsYXRlSTE4blN0cmluZ3NEZWVwKHZhbHVlLCBkZXB0aCArIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0NoaWxkQ2xhc3NPZihjdG9yOiBhbnksIGJhc2U6IGFueSkge1xuICAgIHJldHVybiAhIWN0b3IgJiYgISFiYXNlICYmIGNjLmpzLmlzQ2hpbGRDbGFzc09mKGN0b3IsIGJhc2UpO1xufVxuXG5mdW5jdGlvbiBhcHBseUNvbnN0cnVjdG9yUmV3cml0ZVR5cGUoZGF0YTogSVByb3BlcnR5LCBvYmplY3Q6IGFueSwgYXR0cmlidXRlczogYW55KSB7XG4gICAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShvYmplY3QpICYmIG9iamVjdC5jb25zdHJ1Y3RvciAmJiBhdHRyaWJ1dGVzPy5jdG9yICYmICEob2JqZWN0IGluc3RhbmNlb2YgYXR0cmlidXRlcy5jdG9yKSkge1xuICAgICAgICBkYXRhLnR5cGUgPSAnVW5rbm93bic7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRFbGVtZW50RGVmYXVsdFZhbHVlKHBhcmVudEF0dHJzOiBhbnksIHBhcmVudEluaXRpYWxpemVyOiB1bmtub3duKSB7XG4gICAgaWYgKHBhcmVudEF0dHJzLnR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGdldFByb3BlcnR5RGVmYXVsdFZhbHVlKHBhcmVudEF0dHJzKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldEVsZW1lbnREZWZhdWx0VmFsdWVGcm9tUGFyZW50SW5pdGlhbGl6ZXIocGFyZW50SW5pdGlhbGl6ZXIpO1xufVxuXG5mdW5jdGlvbiBnZXRFbGVtZW50RGVmYXVsdFZhbHVlRnJvbVBhcmVudEluaXRpYWxpemVyKHBhcmVudEluaXRpYWxpemVyOiB1bmtub3duKSB7XG4gICAgaWYgKCFwYXJlbnRJbml0aWFsaXplciB8fCAhQXJyYXkuaXNBcnJheShwYXJlbnRJbml0aWFsaXplcikgfHwgcGFyZW50SW5pdGlhbGl6ZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0RWxlbWVudCA9IHBhcmVudEluaXRpYWxpemVyWzBdO1xuICAgIHN3aXRjaCAodHlwZW9mIGZpcnN0RWxlbWVudCkge1xuICAgICAgICBjYXNlICdudW1iZXInOiByZXR1cm4gMDtcbiAgICAgICAgY2FzZSAnc3RyaW5nJzogcmV0dXJuICcnO1xuICAgICAgICBjYXNlICdib29sZWFuJzogcmV0dXJuIGZhbHNlO1xuICAgICAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFByb3BlcnR5RGVmYXVsdFZhbHVlKGF0dHJzOiBhbnkpIHtcbiAgICBpZiAoYXR0cnMudHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBhdHRycy5kZWZhdWx0ID8gZ2V0UHJvcGVydHlEZWZhdWx0KGF0dHJzKSA6IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZGVmYXVsdE1hcDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICAgIEJvb2xlYW46IGZhbHNlLFxuICAgICAgICBTdHJpbmc6ICcnLFxuICAgICAgICBGbG9hdDogMCxcbiAgICAgICAgSW50ZWdlcjogMCxcbiAgICAgICAgQml0TWFzazogMCxcbiAgICB9O1xuICAgIGlmIChkZWZhdWx0TWFwW2F0dHJzLnR5cGVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRNYXBbYXR0cnMudHlwZV07XG4gICAgfVxuXG4gICAgaWYgKGF0dHJzLnR5cGUgPT09ICdFbnVtJykge1xuICAgICAgICByZXR1cm4gYXR0cnMuZW51bUxpc3Q/LlswXT8udmFsdWUgfHwgMDtcbiAgICB9XG5cbiAgICBpZiAoYXR0cnMudHlwZSA9PT0gJ09iamVjdCcpIHtcbiAgICAgICAgY29uc3QgeyBjdG9yIH0gPSBhdHRycztcbiAgICAgICAgaWYgKGlzQ2hpbGRDbGFzc09mKGN0b3IsIGNjLkFzc2V0KSB8fCBpc0NoaWxkQ2xhc3NPZihjdG9yLCBjYy5Ob2RlKSB8fCBpc0NoaWxkQ2xhc3NPZihjdG9yLCBjYy5Db21wb25lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3Rvcikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGN0b3IoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbW9kaWZ5UHJvcE5hbWUocHJvcDogSVByb3BlcnR5LCBuYW1lPzogc3RyaW5nKSB7XG4gICAgcHJvcC5uYW1lID0gbmFtZTtcblxuICAgIGlmIChwcm9wLnZhbHVlICYmIHR5cGVvZiBwcm9wLnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wLnZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IChwcm9wLnZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldO1xuICAgICAgICAgICAgaWYgKGNoaWxkICYmIHR5cGVvZiBjaGlsZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBtb2RpZnlQcm9wTmFtZShjaGlsZCBhcyBJUHJvcGVydHksIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1vZGlmeVJlbmRlclBpcGVsaW5lUHJvcChwcm9wOiBJUHJvcGVydHksIG5hbWU/OiBzdHJpbmcpIHtcbiAgICBwcm9wLm5hbWUgPSBuYW1lO1xuXG4gICAgaWYgKHByb3AudmlzaWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwcm9wLnZhbHVlICYmIHR5cGVvZiBwcm9wLnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCBjaGFuZ2VUeXBlID0gbmFtZSA/IFJFTkRFUl9QSVBFTElORV9DSEFOR0VfVFlQRVNbbmFtZV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKGNoYW5nZVR5cGUpIHtcbiAgICAgICAgICAgIGNoYW5nZVR5cGUub3B0aW9uYWxUeXBlcyA9IHF1ZXJ5UmVuZGVyQ29tcG9uZW50cyhjaGFuZ2VUeXBlLmNvbXBvbmVudEtleSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcC5pc0FycmF5ICYmIHByb3AuZWxlbWVudFR5cGVEYXRhICYmIGNoYW5nZVR5cGUpIHtcbiAgICAgICAgICAgIG1vZGlmeVJlbmRlclBpcGVsaW5lUHJvcChwcm9wLmVsZW1lbnRUeXBlRGF0YSk7XG4gICAgICAgICAgICBwcm9wLmVsZW1lbnRUeXBlRGF0YS5vcHRpb25hbFR5cGVzID0gY2hhbmdlVHlwZS5vcHRpb25hbFR5cGVzO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcC52YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSAocHJvcC52YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XTtcbiAgICAgICAgICAgIGlmIChjaGlsZCAmJiB0eXBlb2YgY2hpbGQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgbW9kaWZ5UmVuZGVyUGlwZWxpbmVQcm9wKGNoaWxkIGFzIElQcm9wZXJ0eSwga2V5KTtcblxuICAgICAgICAgICAgICAgIGlmIChwcm9wLmlzQXJyYXkgJiYgY2hhbmdlVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAoY2hpbGQgYXMgSVByb3BlcnR5KS5vcHRpb25hbFR5cGVzID0gY2hhbmdlVHlwZS5vcHRpb25hbFR5cGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcXVlcnlSZW5kZXJDb21wb25lbnRzKHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlZGl0b3JFeHRlbmRzID0gKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgIGNvbnN0IG1lbnVzID0gZWRpdG9yRXh0ZW5kcz8uQ29tcG9uZW50Py5nZXRNZW51cz8uKCkgfHwgW107XG4gICAgY29uc3QgcHJlZml4ID0gYGhpZGRlbjpyZW5kZXJfJHt0eXBlfS9gO1xuXG4gICAgcmV0dXJuIG1lbnVzXG4gICAgICAgIC5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpdGVtPy5jb21wb25lbnQgfHwgdHlwZW9mIGl0ZW0ubWVudVBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWl0ZW0ubWVudVBhdGguaW5jbHVkZXMocHJlZml4KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGl0ZW0ubWVudVBhdGgucmVwbGFjZShwcmVmaXgsICcnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcbn1cblxuZnVuY3Rpb24gZ2V0RmllbGREdW1wRnJvbUFzc2V0RHVtcCh0eXBlOiBzdHJpbmcsIGR1bXA6IFNlcmlhbGl6ZWRBc3NldER1bXApOiBSZWNvcmQ8c3RyaW5nLCBJUHJvcGVydHk+IHtcbiAgICBpZiAodHlwZSA9PT0gJ2NjLlJlbmRlclBpcGVsaW5lJykge1xuICAgICAgICBpZiAoIWlzUHJvcGVydHlMaWtlKGR1bXApIHx8ICFpc1JlY29yZChkdW1wLnZhbHVlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFJlbmRlclBpcGVsaW5lIHNlcmlhbGl6ZWQgZHVtcC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZHVtcC52YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBJUHJvcGVydHk+O1xuICAgIH1cbiAgICByZXR1cm4gZHVtcCBhcyBSZWNvcmQ8c3RyaW5nLCBJUHJvcGVydHk+O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVQYXRjaEZpZWxkRHVtcChcbiAgICB0eXBlOiBzdHJpbmcsXG4gICAgY3VycmVudER1bXA6IFJlY29yZDxzdHJpbmcsIElQcm9wZXJ0eT4sXG4gICAgcGF0Y2g6IFNlcmlhbGl6ZWRBc3NldFBhdGNoLFxuKTogUmVjb3JkPHN0cmluZywgSVByb3BlcnR5PiB7XG4gICAgY29uc3QgcGF0Y2hSZWNvcmQgPSB0eXBlID09PSAnY2MuUmVuZGVyUGlwZWxpbmUnICYmIGlzUHJvcGVydHlMaWtlKHBhdGNoKVxuICAgICAgICA/IHBhdGNoLnZhbHVlXG4gICAgICAgIDogcGF0Y2g7XG5cbiAgICBpZiAoIWlzUmVjb3JkKHBhdGNoUmVjb3JkKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlcmlhbGl6ZWQgYXNzZXQgcGF0Y2ggbXVzdCBiZSBhIGR1bXAgb2JqZWN0LicpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgSVByb3BlcnR5PiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHBhdGNoUmVjb3JkKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gY3VycmVudER1bXBba2V5XTtcbiAgICAgICAgaWYgKCFjdXJyZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc2VyaWFsaXplZCBmaWVsZDogJHtrZXl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXh0ID0gaXNQcm9wZXJ0eUxpa2UodmFsdWUpXG4gICAgICAgICAgICA/IGNsb25lRGVlcCh2YWx1ZSlcbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIC4uLmNsb25lRGVlcChjdXJyZW50KSxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgdmFsaWRhdGVQcm9wZXJ0eVBhdGNoKGtleSwgY3VycmVudCwgbmV4dCk7XG4gICAgICAgIHJlc3VsdFtrZXldID0gbmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm9wZXJ0eVBhdGNoKHBhdGg6IHN0cmluZywgY3VycmVudDogSVByb3BlcnR5LCBuZXh0OiBJUHJvcGVydHkpIHtcbiAgICBjb25zdCBjaGFuZ2VkID0gIWlzRXF1YWwoY3VycmVudC52YWx1ZSwgbmV4dC52YWx1ZSk7XG4gICAgaWYgKChjdXJyZW50LnZpc2libGUgPT09IGZhbHNlIHx8IGN1cnJlbnQucmVhZG9ubHkgPT09IHRydWUpICYmIGNoYW5nZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZXJpYWxpemVkIGZpZWxkIGlzIHJlYWRvbmx5IG9yIGhpZGRlbiBhbmQgY2FuIG5vdCBiZSBtb2RpZmllZDogJHtwYXRofWApO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnQudmFsdWUpICYmIEFycmF5LmlzQXJyYXkobmV4dC52YWx1ZSkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXh0LnZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0Q2hpbGQgPSBuZXh0LnZhbHVlW2ldO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudENoaWxkID0gZmluZEN1cnJlbnRBcnJheUNoaWxkKGN1cnJlbnQudmFsdWUsIG5leHRDaGlsZCwgaSk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDaGlsZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzUHJvcGVydHlMaWtlKGN1cnJlbnRDaGlsZCkgJiYgaXNQcm9wZXJ0eUxpa2UobmV4dENoaWxkKSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRlUHJvcGVydHlQYXRjaChgJHtwYXRofS4ke2l9YCwgY3VycmVudENoaWxkLCBuZXh0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWlzUmVjb3JkKGN1cnJlbnQudmFsdWUpIHx8ICFpc1JlY29yZChuZXh0LnZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMobmV4dC52YWx1ZSkpIHtcbiAgICAgICAgY29uc3QgY3VycmVudENoaWxkID0gY3VycmVudC52YWx1ZVtrZXldO1xuICAgICAgICBpZiAoIWN1cnJlbnRDaGlsZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHNlcmlhbGl6ZWQgZmllbGQ6ICR7cGF0aH0uJHtrZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUHJvcGVydHlMaWtlKGN1cnJlbnRDaGlsZCkgJiYgaXNQcm9wZXJ0eUxpa2UodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWxpZGF0ZVByb3BlcnR5UGF0Y2goYCR7cGF0aH0uJHtrZXl9YCwgY3VycmVudENoaWxkLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRDdXJyZW50QXJyYXlDaGlsZChjdXJyZW50VmFsdWU6IHVua25vd25bXSwgbmV4dENoaWxkOiB1bmtub3duLCBpbmRleDogbnVtYmVyKTogdW5rbm93biB7XG4gICAgaWYgKGlzUHJvcGVydHlMaWtlKG5leHRDaGlsZCkgJiYgdHlwZW9mIG5leHRDaGlsZC5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBvcmlnaW5hbEluZGV4ID0gTnVtYmVyKG5leHRDaGlsZC5uYW1lKTtcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIob3JpZ2luYWxJbmRleCkgJiYgb3JpZ2luYWxJbmRleCA+PSAwICYmIG9yaWdpbmFsSW5kZXggPCBjdXJyZW50VmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFZhbHVlW29yaWdpbmFsSW5kZXhdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50VmFsdWVbaW5kZXhdO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhcHBseUZpZWxkRHVtcFBhdGNoKFxuICAgIGluc3RhbmNlOiBhbnksXG4gICAgY3VycmVudER1bXA6IFJlY29yZDxzdHJpbmcsIElQcm9wZXJ0eT4sXG4gICAgcGF0Y2hEdW1wOiBSZWNvcmQ8c3RyaW5nLCBJUHJvcGVydHk+LFxuKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gcGF0Y2hEdW1wKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBjdXJyZW50RHVtcFtrZXldO1xuICAgICAgICBpZiAoY3VycmVudC52aXNpYmxlID09PSBmYWxzZSB8fCBjdXJyZW50LnJlYWRvbmx5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBzZXRWYWx1ZShpbnN0YW5jZSwgcGF0Y2hEdW1wLCBrZXkpO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2V0VmFsdWUocHJvcDogYW55LCBkdW1wOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgYW55LCBrZXk6IHN0cmluZykge1xuICAgIGlmICghZHVtcCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkdW1wICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoa2V5ID09PSAndXVpZCcgJiYgJ191dWlkJyBpbiBwcm9wKSB7XG4gICAgICAgICAgICBwcm9wLl91dWlkID0gZHVtcDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwcm9wW2tleV0gPSBkdW1wO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFkdW1wW2tleV0uaXNBcnJheSkge1xuICAgICAgICBpZiAoZHVtcFtrZXldLnZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBkdW1wW2tleV0udmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBwcm9wW2tleV0gPSBkdW1wW2tleV0udmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5rZXlzKGR1bXBba2V5XS52YWx1ZSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3V1aWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBleHRyYWN0VXVpZFZhbHVlKGR1bXBba2V5XS52YWx1ZVtuYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgIHByb3Bba2V5XSA9IHV1aWQgPyBjcmVhdGVBc3NldFJlZmVyZW5jZSh1dWlkLCBkdW1wW2tleV0udHlwZSkgOiBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNldFZhbHVlKHByb3Bba2V5XSwgZHVtcFtrZXldLnZhbHVlLCBuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcm9wS2V5QXR0ciA9IGNjLkNsYXNzLmF0dHIocHJvcC5jb25zdHJ1Y3Rvciwga2V5KTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvcFtrZXldKSkge1xuICAgICAgICAgICAgcHJvcFtrZXldID0gZ2V0UHJvcGVydHlEZWZhdWx0VmFsdWUocHJvcEtleUF0dHIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHByb3Bba2V5XSkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBvbGRMZW5ndGggPSBwcm9wW2tleV0ubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgbmV3TGVuZ3RoID0gQXJyYXkuaXNBcnJheShkdW1wW2tleV0udmFsdWUpID8gZHVtcFtrZXldLnZhbHVlLmxlbmd0aCA6IDA7XG4gICAgICAgICAgICBpZiAobmV3TGVuZ3RoID4gb2xkTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IG9sZExlbmd0aDsgaSA8IG5ld0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3Bba2V5XVtpXSA9IGNyZWF0ZVZhbHVlRm9yRHVtcEl0ZW0oZHVtcFtrZXldLnZhbHVlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2V0VmFsdWUocHJvcFtrZXldLCBkdW1wW2tleV0udmFsdWUsIGkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdMZW5ndGggPCBvbGRMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAocHJvcFtrZXldLmxlbmd0aCA+IG5ld0xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wW2tleV0ucG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnJheUNsb25lID0gcHJvcFtrZXldLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgcHJvcFtrZXldID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvbGRMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZHVtcFtrZXldLnZhbHVlW2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByb3Bba2V5XVtpXSA9IGFycmF5Q2xvbmVbZHVtcFtrZXldLnZhbHVlW2ldLm5hbWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRHVtcCA9IGR1bXBba2V5XS52YWx1ZVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbUR1bXA/LnR5cGUgJiYgKCFwcm9wW2tleV1baV0gfHwgaXRlbUR1bXAudHlwZSAhPT0gcHJvcFtrZXldW2ldLmNvbnN0cnVjdG9yLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGl0ZW1EdW1wLnR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZUNsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wW2tleV1baV0gPSBuZXcgdHlwZUNsYXNzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRWYWx1ZShwcm9wW2tleV0sIGR1bXBba2V5XS52YWx1ZSwgaS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmFsdWVGb3JEdW1wSXRlbShpdGVtRHVtcDogSVByb3BlcnR5KSB7XG4gICAgaWYgKCFpdGVtRHVtcD8udHlwZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB0eXBlQ2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShpdGVtRHVtcC50eXBlKTtcbiAgICBpZiAodHlwZUNsYXNzKSB7XG4gICAgICAgIHJldHVybiBuZXcgdHlwZUNsYXNzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldERlZmF1bHRWYWx1ZUJ5VHlwZShpdGVtRHVtcC50eXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZUJ5VHlwZSh0eXBlOiBzdHJpbmcsIGRhdGE/OiBhbnkpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnQm9vbGVhbic6XG4gICAgICAgICAgICByZXR1cm4gZGF0YSA/IGRhdGFbMF0gOiBmYWxzZTtcbiAgICAgICAgY2FzZSAnTnVtYmVyJzpcbiAgICAgICAgY2FzZSAnSW50ZWdlcic6XG4gICAgICAgIGNhc2UgJ0Zsb2F0JzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gZGF0YVswXSA6IDA7XG4gICAgICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgICAgICAgICByZXR1cm4gZGF0YSA/IGRhdGFbMF0gOiAnJztcbiAgICAgICAgY2FzZSAnY2MuVmVjMic6XG4gICAgICAgICAgICByZXR1cm4gZGF0YSA/IG5ldyBjYy5tYXRoLlZlYzIoZGF0YVswXSB8fCAwLCBkYXRhWzFdIHx8IDApIDogbmV3IGNjLm1hdGguVmVjMigpO1xuICAgICAgICBjYXNlICdjYy5WZWMzJzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gbmV3IGNjLm1hdGguVmVjMyhkYXRhWzBdIHx8IDAsIGRhdGFbMV0gfHwgMCwgZGF0YVsyXSB8fCAwKSA6IG5ldyBjYy5tYXRoLlZlYzMoKTtcbiAgICAgICAgY2FzZSAnY2MuVmVjNCc6XG4gICAgICAgICAgICByZXR1cm4gZGF0YSA/IG5ldyBjYy5tYXRoLlZlYzQoZGF0YVswXSB8fCAwLCBkYXRhWzFdIHx8IDAsIGRhdGFbMl0gfHwgMCwgZGF0YVszXSB8fCAwKSA6IG5ldyBjYy5tYXRoLlZlYzQoKTtcbiAgICAgICAgY2FzZSAnY2MuUXVhdCc6XG4gICAgICAgICAgICByZXR1cm4gZGF0YSA/IG5ldyBjYy5tYXRoLlF1YXQoZGF0YVswXSB8fCAwLCBkYXRhWzFdIHx8IDAsIGRhdGFbMl0gfHwgMCwgZGF0YVszXSB8fCAxKSA6IG5ldyBjYy5RdWF0KCk7XG4gICAgICAgIGNhc2UgJ2NjLkNvbG9yJzpcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFbM10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhWzNdID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjYy5Db2xvcihkYXRhWzBdICogMjU1LCBkYXRhWzFdICogMjU1LCBkYXRhWzJdICogMjU1LCBkYXRhWzNdICogMjU1KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgY2MuQ29sb3IoKTtcbiAgICAgICAgY2FzZSAnY2MuTWF0NCc6XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY2MubWF0aC5NYXQ0KFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzBdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzFdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzJdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzNdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzRdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzVdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzZdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzddLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzhdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzldLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzEwXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxMV0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMTJdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzEzXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNF0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMTVdLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IGNjLk1hdDQoKTtcbiAgICAgICAgY2FzZSAnY2MuQXNzZXQnOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBjYy5Bc3NldCgpO1xuICAgICAgICBjYXNlICdjYy5UZXh0dXJlQmFzZSc6XG4gICAgICAgICAgICByZXR1cm4gbmV3IGNjLlRleHR1cmVCYXNlKCk7XG4gICAgICAgIGNhc2UgJ2NjLlRleHR1cmUyRCc6XG4gICAgICAgICAgICByZXR1cm4gbmV3IGNjLlRleHR1cmUyRCgpO1xuICAgICAgICBjYXNlICdjYy5UZXh0dXJlQ3ViZSc6XG4gICAgICAgICAgICByZXR1cm4gbmV3IGNjLlRleHR1cmVDdWJlKCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJQaXBlbGluZUluc3RhbmNlSWZOZWVkZWQoaW5zdGFuY2U6IGFueSwgcGF0Y2g6IElQcm9wZXJ0eSkge1xuICAgIGlmICghcGF0Y2gudHlwZSB8fCBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uYW1lID09PSBwYXRjaC50eXBlKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG5cbiAgICBjb25zdCBjdG9yID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUocGF0Y2gudHlwZSk7XG4gICAgaWYgKCFjdG9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVuZGVyUGlwZWxpbmUgdHlwZSBjYW4gbm90IGJlIGZvdW5kOiAke3BhdGNoLnR5cGV9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dCA9IG5ldyBjdG9yKCk7XG4gICAgaWYgKCdfdXVpZCcgaW4gbmV4dCAmJiAnX3V1aWQnIGluIGluc3RhbmNlKSB7XG4gICAgICAgIG5leHQuX3V1aWQgPSBpbnN0YW5jZS5fdXVpZDtcbiAgICB9XG4gICAgcmV0dXJuIG5leHQ7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RVdWlkVmFsdWUodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICAgIGlmIChpc1Byb3BlcnR5TGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZS52YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZS52YWx1ZSA6ICcnO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogJyc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFzc2V0UmVmZXJlbmNlKHV1aWQ6IHN0cmluZywgdHlwZT86IHN0cmluZykge1xuICAgIGNvbnN0IGN0b3IgPSB0eXBlID8gY2MuanMuZ2V0Q2xhc3NCeU5hbWUodHlwZSkgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGdldEVkaXRvclNlcmlhbGl6ZSgpLmFzQXNzZXQodXVpZCwgY3Rvcik7XG59XG5cbmZ1bmN0aW9uIGdldEVkaXRvclNlcmlhbGl6ZSgpIHtcbiAgICBjb25zdCBzZXJpYWxpemUgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvckV4dGVuZHM/LnNlcmlhbGl6ZSB8fCBlZGl0b3JTZXJpYWxpemU7XG4gICAgaWYgKCFzZXJpYWxpemUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZSBpcyBub3QgaW5pdGlhbGl6ZWQuJyk7XG4gICAgfVxuICAgIHJldHVybiBzZXJpYWxpemU7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNlcmlhbGl6ZWRDb250ZW50KHNlcmlhbGl6ZWQ6IHN0cmluZyB8IG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygc2VyaWFsaXplZCA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBzZXJpYWxpemVkXG4gICAgICAgIDogSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZCwgbnVsbCwgNCk7XG59XG5cbmZ1bmN0aW9uIGlzUHJvcGVydHlMaWtlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgSVByb3BlcnR5IHtcbiAgICByZXR1cm4gaXNSZWNvcmQodmFsdWUpICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ3ZhbHVlJyk7XG59XG5cbmZ1bmN0aW9uIGlzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuIl19