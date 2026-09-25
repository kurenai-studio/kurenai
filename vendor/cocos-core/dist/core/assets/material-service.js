'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAllEffects = queryAllEffects;
exports.queryEffect = queryEffect;
exports.queryMaterial = queryMaterial;
exports.saveMaterial = saveMaterial;
exports.encodeEffect = encodeEffect;
const fs_extra_1 = require("fs-extra");
const utils_1 = require("./asset-handler/utils");
const serialized_data_1 = require("./serialized-data");
const operation_1 = __importDefault(require("./manager/operation"));
const query_1 = __importDefault(require("./manager/query"));
const editor_extends_1 = require("../engine/editor-extends");
const i18n_1 = __importDefault(require("../base/i18n"));
const BASIC_VALUE_TYPE_MAP = {
    boolean: 'Boolean',
    number: 'Number',
    string: 'String',
};
const INSPECTOR_ATTRIBUTE_PROPS = ['visible', 'displayName', 'min', 'max', 'step', 'slide', 'tooltip', 'range'];
async function queryAllEffects() {
    const effectAssets = queryEffectAssets();
    const result = {};
    for (const asset of effectAssets) {
        try {
            const effect = await loadEffectAsset(asset);
            const info = query_1.default.encodeAsset(asset, []);
            result[asset.uuid] = {
                uuid: asset.uuid,
                name: effect.name || getEffectFallbackName(info),
                hideInEditor: !!effect.hideInEditor,
                assetPath: info.url || info.file,
            };
        }
        catch (error) {
            warnEffectLoadFailure(asset, error);
        }
    }
    return result;
}
async function queryEffect(effectNameOrUuid) {
    const { asset, effect } = await resolveEffectAsset(effectNameOrUuid);
    if (!effect) {
        throw new Error(`Effect asset can not be found: ${effectNameOrUuid}. Please refresh/reimport effect.`);
    }
    return encodeEffect(effect, asset.uuid);
}
async function queryMaterial(uuidOrUrlOrPath) {
    const { asset, assetInfo } = resolveMaterialAsset(uuidOrUrlOrPath);
    const source = await readMaterialSource(asset, assetInfo);
    const material = deserializeMaterialSource(source, asset);
    const effectUuid = extractUuid(source?._effectAsset) || extractUuid(material?._effectAsset);
    if (!effectUuid) {
        throw new Error(`Material effect can not be found: ${uuidOrUrlOrPath}. Please refresh/reimport material.`);
    }
    const { asset: effectAsset, effect } = await resolveEffectAsset(effectUuid);
    const data = encodeEffect(effect, effectAsset.uuid);
    const techniqueIndex = Number.isInteger(material._techIdx) ? material._techIdx : (source._techIdx || 0);
    const technique = data[techniqueIndex];
    if (technique) {
        mergeMaterialOverrides(technique, material);
    }
    return {
        effect: effectAsset.uuid,
        technique: techniqueIndex,
        data,
    };
}
async function readMaterialSource(asset, assetInfo) {
    if (asset.source && await (0, fs_extra_1.pathExists)(asset.source)) {
        return (0, fs_extra_1.readJSON)(asset.source);
    }
    const libraryPath = assetInfo.library['.json'];
    if (libraryPath && await (0, fs_extra_1.pathExists)(libraryPath)) {
        return (0, fs_extra_1.readJSON)(libraryPath);
    }
    throw new Error(`Material JSON can not be found: ${assetInfo.url || asset.uuid}. Please refresh/reimport material.`);
}
async function saveMaterial(uuidOrUrlOrPath, dump) {
    const { asset } = resolveMaterialAsset(uuidOrUrlOrPath);
    const serialized = await decodeMaterial(dump);
    await operation_1.default.saveAsset(asset.uuid, formatSerializedContent(serialized));
}
function encodeEffect(effect, effectUuid) {
    return (effect.techniques || []).map((tech) => {
        const passes = (tech.passes || []).map((pass, index) => {
            const props = [];
            const defines = [];
            const prog = (effect.shaders || []).find((shader) => shader.name === pass.program);
            for (const define of (prog?.defines || [])) {
                if (typeof define.name === 'string' && define.name.startsWith('CC_')) {
                    continue;
                }
                const type = getGfxValueType(define.type);
                let value;
                switch (type) {
                    case 'Number':
                    case 'Integer':
                    case 'Float':
                        value = Array.isArray(define.range) ? define.range[0] : 0;
                        break;
                    case 'String':
                        value = Array.isArray(define.options) ? define.options[0] : '';
                        break;
                    default:
                        value = false;
                        break;
                }
                const dump = (0, serialized_data_1.encodeSerializedObject)(value, { default: value });
                const tooltip = tryGetEffectTooltip(define.name, define.editor?.tooltip);
                Object.assign(dump, {
                    name: define.name,
                    defines: define.defines,
                    type,
                    options: define.options,
                    range: define.range,
                    default: dump.value,
                    tooltip,
                });
                defines.push(dump);
            }
            getObjectKeys(pass.properties).forEach((name) => {
                const prop = pass.properties[name];
                if (prop?.editor?.deprecated) {
                    return;
                }
                const uniformName = prop?.handleInfo?.[0] || name;
                const propData = getPropData(uniformName, prog);
                let customDefines = prop?.editor?.parent;
                if (customDefines && !Array.isArray(customDefines)) {
                    customDefines = [customDefines];
                }
                let type = getGfxValueType(prop.type);
                if (prop?.editor?.type === 'color') {
                    type = 'cc.Color';
                }
                let value = getDefaultValue(type, prop.value);
                if (propData.count && propData.count > 1) {
                    value = Array.from({ length: propData.count }, () => cloneDefaultValue(value));
                }
                const inspectorAttr = prop?.editor ? checkInspectorAttr(prop.editor) : {};
                const tooltip = tryGetEffectTooltip(name, prop?.editor?.tooltip);
                const dump = (0, serialized_data_1.encodeSerializedObject)(value, {
                    default: value,
                    displayName: prop?.editor?.displayName,
                    visible: prop?.editor?.visible,
                    tooltip,
                    range: prop?.editor?.range,
                    type,
                    ...inspectorAttr,
                });
                if (Array.isArray(dump.value)) {
                    dump.value.forEach((elem) => {
                        elem.default = elem.value;
                    });
                }
                Object.assign(dump, {
                    name,
                    defines: customDefines || propData.defines,
                    default: dump.value,
                });
                props.push(dump);
            });
            const passState = changePassStateToCCClass(pass);
            const states = (0, serialized_data_1.encodeSerializedObject)(passState, {});
            patchDumpData(states, 'pipelineStates');
            const needHide = pass.propertyIndex !== undefined && pass.propertyIndex !== index;
            return {
                index,
                name: pass.name,
                phase: pass.phase,
                switch: {
                    name: pass.switch,
                    value: false,
                    default: false,
                    type: 'Boolean',
                    visible: true,
                    readonly: false,
                    path: '',
                },
                propertyIndex: {
                    name: 'propertyIndex',
                    value: pass.propertyIndex === undefined ? index : pass.propertyIndex,
                    default: pass.propertyIndex === undefined ? index : pass.propertyIndex,
                    type: 'Integer',
                    visible: false,
                    readonly: false,
                    path: '',
                },
                props: needHide ? [] : props,
                defines: needHide ? [] : defines,
                states,
            };
        });
        return {
            name: tech.name,
            passes,
        };
    });
}
async function decodeMaterial(dump) {
    const { asset: effectAsset, effect } = await resolveEffectAsset(dump.effect);
    const MaterialCtor = getMaterialCtor();
    const material = new MaterialCtor();
    material._effectAsset = effect;
    material._props = [];
    material._defines = [];
    material._states = [];
    material._techIdx = dump.technique || 0;
    if ('_uuid' in material._effectAsset) {
        material._effectAsset._uuid = effectAsset.uuid;
    }
    const technique = dump.data?.[material._techIdx];
    const passes = technique?.passes || [];
    const matProps = [];
    const matDefines = [];
    const matStates = [];
    const compareAndDecode = (dumpData, dstData) => {
        if (!dumpData) {
            return false;
        }
        if (dumpData.isObject) {
            const decoded = decodeChangedObjectDump(dumpData);
            if (Object.keys(decoded).length === 0) {
                return false;
            }
            dstData[dumpData.name] = decoded;
            return true;
        }
        if (!hasModifiedDump(dumpData)) {
            return false;
        }
        dstData[dumpData.name] = decodeMaterialDumpValue(dumpData);
        return true;
    };
    for (let i = 0; i < passes.length; i++) {
        const current = passes[i];
        matProps[i] = {};
        matDefines[i] = {};
        matStates[i] = {};
        if (current.switch?.name && current.switch.value) {
            matDefines[i][current.switch.name] = current.switch.value;
        }
        for (const define of current.defines || []) {
            compareAndDecode(define, matDefines[i]);
        }
        for (const prop of current.props || []) {
            compareAndDecode(prop, matProps[i]);
        }
        const states = current.states?.value && typeof current.states.value === 'object'
            ? Object.values(current.states.value)
            : [];
        for (const state of states) {
            compareAndDecode(state, matStates[i]);
        }
    }
    material._props = matProps;
    material._defines = matDefines;
    material._states = matStates;
    const tech = effect.techniques?.[material._techIdx];
    if (tech) {
        for (let i = tech.passes.length - 1; i >= 0; i--) {
            const current = tech.passes[i];
            if (current.propertyIndex !== undefined && current.propertyIndex !== i) {
                material._props[i] = {};
                material._defines[i] = {};
            }
        }
    }
    return getEditorSerialize()(material);
}
function resolveMaterialAsset(uuidOrUrlOrPath) {
    const asset = query_1.default.queryAsset(uuidOrUrlOrPath);
    if (!asset) {
        throw new Error(`Material can not be found: ${uuidOrUrlOrPath}. Please refresh asset db and try again.`);
    }
    const assetInfo = query_1.default.encodeAsset(asset, []);
    if (assetInfo.type !== 'cc.Material') {
        throw new Error(`Asset is not a material: ${uuidOrUrlOrPath}. Current type: ${assetInfo.type}.`);
    }
    if (!asset.source) {
        throw new Error(`Material has no source file: ${uuidOrUrlOrPath}.`);
    }
    return { asset, assetInfo };
}
async function resolveEffectAsset(effectNameOrUuid) {
    const direct = query_1.default.queryAsset(effectNameOrUuid);
    if (direct) {
        const directInfo = query_1.default.encodeAsset(direct, []);
        if (directInfo.type === 'cc.EffectAsset') {
            return {
                asset: direct,
                assetInfo: directInfo,
                effect: await loadEffectAsset(direct),
            };
        }
    }
    const effectAssets = queryEffectAssets();
    for (const asset of effectAssets) {
        const assetInfo = query_1.default.encodeAsset(asset, []);
        if (matchesEffectAssetKey(effectNameOrUuid, assetInfo)) {
            return {
                asset,
                assetInfo,
                effect: await loadEffectAsset(asset),
            };
        }
    }
    for (const asset of effectAssets) {
        try {
            const effect = await loadEffectAsset(asset);
            const assetInfo = query_1.default.encodeAsset(asset, []);
            if (effect.name === effectNameOrUuid) {
                return { asset, assetInfo, effect };
            }
        }
        catch (error) {
            warnEffectLoadFailure(asset, error);
        }
    }
    throw new Error(`Effect asset can not be found: ${effectNameOrUuid}. Please refresh/reimport effect.`);
}
function queryEffectAssets() {
    return query_1.default.queryAssets({ ccType: 'cc.EffectAsset' });
}
async function loadEffectAsset(asset) {
    const info = query_1.default.encodeAsset(asset, []);
    const libraryPath = info.library['.json'];
    if (!libraryPath) {
        throw new Error(`Effect library JSON can not be found: ${info.url}. Please refresh/reimport effect.`);
    }
    const effect = (0, utils_1.deserialize)(await (0, fs_extra_1.readJSON)(libraryPath));
    if (!effect) {
        throw new Error(`Deserialize effect failed: ${info.url}. Please refresh/reimport effect.`);
    }
    if ('_uuid' in effect) {
        effect._uuid = asset.uuid;
    }
    return effect;
}
function deserializeMaterialSource(source, asset) {
    const material = (0, utils_1.deserialize)(source);
    if (!material) {
        throw new Error(`Deserialize material failed: ${asset.url || asset.uuid}. Please refresh/reimport material.`);
    }
    if ('_uuid' in material) {
        material._uuid = asset.uuid;
    }
    return material;
}
function matchesEffectAssetKey(key, info) {
    const baseName = info.name.replace(/\.effect$/i, '');
    const loadName = info.loadUrl.split('/').pop() || info.loadUrl;
    return key === info.uuid
        || key === info.url
        || key === info.file
        || key === info.name
        || key === baseName
        || key === info.loadUrl
        || key === loadName;
}
function getEffectFallbackName(info) {
    return info.name.replace(/\.effect$/i, '');
}
function getObjectKeys(obj) {
    if (!obj) {
        return [];
    }
    if (obj.constructor?.__isJSB) {
        const keys = [];
        for (const key in obj) {
            keys.push(key);
        }
        return keys;
    }
    return Object.keys(obj);
}
function tryGetEffectTooltip(name, rawTooltip) {
    if (typeof rawTooltip === 'string' && rawTooltip !== '') {
        return rawTooltip;
    }
    const tooltip = `ENGINE.assets.effect.propertyTips.${name}`;
    try {
        const translated = i18n_1.default.t(tooltip);
        if (translated && translated !== tooltip) {
            return `i18n:${tooltip}`;
        }
    }
    catch {
        // Ignore missing i18n keys.
    }
    return undefined;
}
function warnEffectLoadFailure(asset, error) {
    console.warn(`EffectAsset ${asset.uuid} can not be loaded. Please refresh/reimport effect.`);
    console.warn(error);
}
function deepCopyProperty(dstObj, srcObj, propName, propClass) {
    if (!dstObj) {
        return;
    }
    const dstProp = dstObj[propName];
    const srcProp = srcObj?.[propName];
    if (srcProp === undefined) {
        return;
    }
    if (Array.isArray(dstProp)) {
        if (!Array.isArray(srcProp)) {
            return;
        }
        const srcArrayLen = srcProp.length;
        const dstArrayLen = dstProp.length;
        if (propClass && srcArrayLen > dstArrayLen) {
            for (let i = 0; i < srcArrayLen - dstArrayLen; i++) {
                dstProp.push(new propClass());
            }
        }
        for (let i = 0; i < srcProp.length; i++) {
            deepCopyProperty(dstProp, srcProp, i, propClass);
        }
    }
    else if (dstProp?.constructor?.__props__) {
        const ctor = dstProp.constructor;
        ctor.__props__.forEach((key) => {
            if (dstProp[key] === undefined || srcProp[key] === undefined) {
                return;
            }
            const attr = cc.Class.attr(ctor, key);
            const attrCtor = getConstructor(srcProp[key], attr);
            deepCopyProperty(dstProp, srcProp, key, attrCtor);
        });
    }
    else {
        dstObj[propName] = srcObj[propName];
    }
}
function changePassStateToCCClass(passStateObj) {
    const PassStatesEditorCtor = getPassStatesEditorCtor();
    const passState = new PassStatesEditorCtor();
    passState.blendState.init(passStateObj.blendState);
    const ctor = passState.constructor;
    ctor.__props__.forEach((key) => {
        if (passState[key] === undefined || passStateObj[key] === undefined) {
            return;
        }
        const attr = cc.Class.attr(ctor, key);
        const attrCtor = getConstructor(passStateObj[key], attr);
        deepCopyProperty(passState, passStateObj, key, attrCtor);
    });
    return passState;
}
function getPassStatesEditorCtor() {
    const materialModule = require('cc/editor/material');
    return materialModule.PassStatesEditor;
}
function getMaterialCtor() {
    try {
        if (typeof cc !== 'undefined' && cc.Material) {
            return cc.Material;
        }
    }
    catch {
        // Ignore, cc is initialized lazily in tests and host startup.
    }
    const ccModule = require('cc');
    return ccModule.Material;
}
function hasModifiedDump(dumpData) {
    if (!dumpData) {
        return false;
    }
    if (dumpData.isObject && dumpData.value && typeof dumpData.value === 'object') {
        return Object.values(dumpData.value).some((item) => hasModifiedDump(item));
    }
    if (dumpData.isArray && Array.isArray(dumpData.value)) {
        return isModified(dumpData) || dumpData.value.some((item) => hasModifiedDump(item));
    }
    return isModified(dumpData);
}
function decodeChangedObjectDump(dumpData) {
    const result = {};
    if (!dumpData?.value || typeof dumpData.value !== 'object') {
        return result;
    }
    getObjectKeys(dumpData.value).forEach((key) => {
        const child = dumpData.value[key];
        if (!hasModifiedDump(child)) {
            return;
        }
        result[child.name ?? key] = child.isObject ? decodeChangedObjectDump(child) : decodeMaterialDumpValue(child);
    });
    return result;
}
function decodeMaterialDumpValue(dumpData) {
    if (!dumpData || !('value' in dumpData)) {
        return undefined;
    }
    const value = dumpData.value;
    if (isAssetReferenceDump(dumpData)) {
        return createAssetReference(value.uuid, dumpData.type);
    }
    if (dumpData.isArray) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.map((item) => isPropertyDump(item) ? decodeMaterialDumpValue(item) : cloneSerializedValue(item));
    }
    if (dumpData.isObject) {
        const result = {};
        if (value && typeof value === 'object') {
            getObjectKeys(value).forEach((key) => {
                const child = value[key];
                result[child.name ?? key] = isPropertyDump(child) ? decodeMaterialDumpValue(child) : cloneSerializedValue(child);
            });
        }
        return result;
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    const ccType = getCCClassByName(dumpData.type);
    if (ccType && ((dumpData.extends || []).includes('cc.ValueType') || Array.isArray(ccType.__props__))) {
        const instance = new ccType();
        const keys = Array.isArray(ccType.__props__) ? ccType.__props__ : getObjectKeys(value);
        keys.forEach((key) => {
            if (value[key] === undefined) {
                return;
            }
            instance[key] = isPropertyDump(value[key]) ? decodeMaterialDumpValue(value[key]) : cloneSerializedValue(value[key]);
        });
        return instance;
    }
    const result = {};
    getObjectKeys(value).forEach((key) => {
        const child = value[key];
        result[key] = isPropertyDump(child) ? decodeMaterialDumpValue(child) : cloneSerializedValue(child);
    });
    return result;
}
function isAssetReferenceDump(dumpData) {
    const value = dumpData?.value;
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.uuid !== 'string') {
        return false;
    }
    if ((dumpData.extends || []).includes('cc.Asset')) {
        return true;
    }
    const ccType = getCCClassByName(dumpData.type);
    try {
        if (ccType && cc?.js?.isChildClassOf && cc?.Asset) {
            return cc.js.isChildClassOf(ccType, cc.Asset);
        }
    }
    catch {
        // Fall back to known material asset property types.
    }
    return ['cc.Asset', 'cc.TextureBase', 'cc.Texture2D', 'cc.TextureCube'].includes(dumpData.type);
}
function createAssetReference(uuid, type) {
    if (!uuid) {
        return null;
    }
    return getEditorSerialize().asAsset(uuid, type ? getCCClassByName(type) : undefined);
}
function getCCClassByName(type) {
    if (!type) {
        return undefined;
    }
    try {
        return cc.js.getClassByName(type);
    }
    catch {
        return undefined;
    }
}
function isPropertyDump(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'value');
}
function cloneSerializedValue(value) {
    if (!value || typeof value !== 'object') {
        return value;
    }
    return JSON.parse(JSON.stringify(value));
}
function getConstructor(object, attribute) {
    if (attribute?.ctor) {
        return attribute.ctor;
    }
    return object === null || object === undefined ? null : object.constructor;
}
function getPassDefaultValue(type) {
    const ccType = cc.js.getClassByName(type);
    if (ccType) {
        return new ccType();
    }
    switch (type) {
        case 'Boolean':
            return false;
        case 'Number':
        case 'Float':
        case 'Integer':
        case 'Enum':
            return 0;
        case 'String':
            return '';
        default:
            return null;
    }
}
function patchNameToDump(dump, name) {
    if (!dump) {
        return;
    }
    dump.name = name;
    const value = dump.value;
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            patchNameToDump(value[i], `${i}`);
        }
    }
    else if (value && typeof value === 'object') {
        dump.isObject = true;
        Object.keys(value).forEach((key) => {
            patchNameToDump(value[key], key);
        });
    }
}
function patchDumpData(passStateDump, name) {
    if (!passStateDump) {
        return;
    }
    passStateDump.name = name;
    const value = passStateDump.value;
    if (Array.isArray(value)) {
        const defaultValue = getPassDefaultValue(passStateDump.type);
        passStateDump.elementTypeData = (0, serialized_data_1.encodeSerializedObject)(defaultValue, {
            type: passStateDump.type,
            enumList: passStateDump.enumList,
        });
        patchNameToDump(passStateDump.elementTypeData, name);
        for (let i = 0; i < value.length; i++) {
            patchDumpData(value[i], `${i}`);
        }
    }
    else if (value && typeof value === 'object' && !(passStateDump.extends || []).includes('cc.ValueType')) {
        passStateDump.isObject = true;
        Object.keys(value).forEach((key) => {
            patchDumpData(value[key], key);
        });
    }
    else {
        passStateDump.default = value;
    }
    passStateDump.isMat = true;
}
function getPropData(name, prog) {
    const propData = {};
    const block = prog?.blocks?.find((b) => b.members?.find((u) => u.name === name) !== undefined);
    if (block) {
        propData.defines = block.defines;
        const member = block.members.find((m) => m.name === name);
        if (member) {
            propData.count = member.count;
        }
    }
    const samplerTexture = prog?.samplerTextures?.find((u) => u.name === name);
    if (samplerTexture) {
        propData.defines = samplerTexture.defines;
        propData.count = samplerTexture.count;
    }
    return propData;
}
function checkInspectorAttr(inspector) {
    const inspectorAttr = {};
    INSPECTOR_ATTRIBUTE_PROPS.forEach((key) => {
        if (inspector?.[key] === undefined) {
            return;
        }
        if (key === 'range') {
            const range = inspector[key];
            if (range.length >= 2) {
                inspectorAttr.min = range[0];
                inspectorAttr.max = range[1];
                if (range.length > 2) {
                    inspectorAttr.step = range[2];
                }
            }
        }
        else {
            inspectorAttr[key] = inspector[key];
        }
    });
    return inspectorAttr;
}
function getGfxValueType(type) {
    const mappedBasic = BASIC_VALUE_TYPE_MAP[type];
    if (mappedBasic) {
        return mappedBasic;
    }
    const gfxType = getGfxTypeEnum();
    const mappedGfx = gfxType ? {
        [gfxType.INT]: 'Integer',
        [gfxType.INT2]: 'cc.Vec2',
        [gfxType.INT3]: 'cc.Vec3',
        [gfxType.INT4]: 'cc.Vec4',
        [gfxType.FLOAT]: 'Float',
        [gfxType.FLOAT2]: 'cc.Vec2',
        [gfxType.FLOAT3]: 'cc.Vec3',
        [gfxType.FLOAT4]: 'cc.Vec4',
        [gfxType.MAT4]: 'cc.Mat4',
        [gfxType.SAMPLER2D]: 'cc.TextureBase',
        [gfxType.SAMPLER_CUBE]: 'cc.TextureCube',
    } : {};
    return mappedGfx[type] || `${type}`;
}
function getGfxTypeEnum() {
    try {
        if (typeof cc !== 'undefined' && cc.gfx?.Type) {
            return cc.gfx.Type;
        }
    }
    catch {
        // Ignore, cc is initialized lazily in tests and host startup.
    }
    try {
        return require('cc').gfx?.Type;
    }
    catch {
        return undefined;
    }
}
function getDefaultValue(type, data) {
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
            return data ? new cc.math.Vec2(data[0] || 0, data[1] || 0) : new cc.Vec2();
        case 'cc.Vec3':
            return data ? new cc.math.Vec3(data[0] || 0, data[1] || 0, data[2] || 0) : new cc.Vec3();
        case 'cc.Vec4':
            return data ? new cc.math.Vec4(data[0] || 0, data[1] || 0, data[2] || 0, data[3] || 0) : new cc.Vec4();
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
function cloneDefaultValue(value) {
    if (!value || typeof value !== 'object') {
        return value;
    }
    if (typeof value.clone === 'function') {
        return value.clone();
    }
    return JSON.parse(JSON.stringify(value));
}
function mergeMaterialOverrides(technique, material) {
    technique.passes.forEach((pass, index) => {
        getObjectKeys(material._defines?.[index]).forEach((name) => {
            const item = pass.defines.find((define) => define.name === name);
            if (!item) {
                if (pass.switch?.name === name) {
                    pass.switch.value = material._defines[index][name];
                }
                return;
            }
            overrideDataWithAsset(item, material._defines[index][name]);
        });
        getObjectKeys(material._props?.[index]).forEach((name) => {
            const item = pass.props.find((prop) => prop.name === name);
            if (!item) {
                return;
            }
            overrideDataWithAsset(item, material._props[index][name]);
        });
        getObjectKeys(material._states?.[index]).forEach((name) => {
            const stateValue = pass.states.value;
            if (!stateValue || typeof stateValue !== 'object' || Array.isArray(stateValue)) {
                return;
            }
            const item = Object.values(stateValue).find((prop) => prop.name === name);
            if (!item) {
                return;
            }
            overrideDataWithAsset(item, material._states[index][name]);
        });
    });
}
function overrideDataWithAsset(defaultData, assetData) {
    if (defaultData === undefined || assetData === undefined) {
        return;
    }
    if (defaultData.isObject) {
        getObjectKeys(assetData).forEach((key) => {
            overrideDataWithAsset(defaultData.value?.[key], assetData[key]);
        });
    }
    else if (defaultData.isArray) {
        if (!Array.isArray(assetData)) {
            return;
        }
        while (assetData.length > defaultData.value.length && defaultData.elementTypeData) {
            const newValue = JSON.parse(JSON.stringify(defaultData.elementTypeData));
            newValue.name = `${defaultData.value.length}`;
            newValue.displayName = `${defaultData.value.length}`;
            defaultData.value.push(newValue);
        }
        for (let i = 0; i < assetData.length; i++) {
            overrideDataWithAsset(defaultData.value[i], assetData[i]);
        }
    }
    else {
        const dump = (0, serialized_data_1.encodeSerializedObject)(assetData, {});
        if (dump.type !== 'Unknown') {
            defaultData.value = dump.value;
        }
    }
}
function isModified(dumpData) {
    return dumpData.default !== dumpData.value && JSON.stringify(dumpData.default) !== JSON.stringify(dumpData.value);
}
function extractUuid(value) {
    if (!value) {
        return '';
    }
    return value.__uuid__ || value._uuid || value.uuid || '';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0ZXJpYWwtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9tYXRlcmlhbC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFvRGIsMENBb0JDO0FBRUQsa0NBTUM7QUFFRCxzQ0F3QkM7QUFlRCxvQ0FJQztBQUVELG9DQWlJQztBQTVQRCx1Q0FBZ0Q7QUFJaEQsaURBQThFO0FBQzlFLHVEQUEyRDtBQUMzRCxvRUFBaUQ7QUFDakQsNERBQXlDO0FBQ3pDLDZEQUF3RTtBQUN4RSx3REFBZ0M7QUErQmhDLE1BQU0sb0JBQW9CLEdBQW9DO0lBQzFELE9BQU8sRUFBRSxTQUFTO0lBQ2xCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxRQUFRO0NBQ25CLENBQUM7QUFFRixNQUFNLHlCQUF5QixHQUFHLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRXpHLEtBQUssVUFBVSxlQUFlO0lBQ2pDLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixFQUFFLENBQUM7SUFDekMsTUFBTSxNQUFNLEdBQXVDLEVBQUUsQ0FBQztJQUV0RCxLQUFLLE1BQU0sS0FBSyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE1BQU0sSUFBSSxHQUFHLGVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7Z0JBQ2pCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtnQkFDaEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUkscUJBQXFC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SSxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQy9DLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzlELENBQUM7UUFFRCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxFQUFFLENBQUM7WUFDekMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxFQUFFLENBQUM7WUFDckMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLFFBQVE7WUFDNUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDckMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNULEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7WUFDekIsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFDLENBQUM7SUFDTCxDQUFDO0lBRUQsUUFBUSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7SUFDM0IsUUFBUSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7SUFDL0IsUUFBUSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7SUFFN0IsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFR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QUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvRSxLQUFLLFNBQVM7WUFDVixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM3RixLQUFLLFNBQVM7WUFDVixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNHLEtBQUssU0FBUztZQUNWLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFB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S0FBVTtJQUMzQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDVCxPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUM3RCxDQUFDO0FBRUQsU0FBUyxrQkFBa0I7SUFDdkIsTUFBTSxTQUFTLEdBQUksVUFBa0IsQ0FBQyxhQUFhLEVBQUUsU0FBUyxJQUFJLDBCQUFlLENBQUM7SUFDbEYsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxVQUEyQjtJQUN4RCxPQUFPLE9BQU8sVUFBVSxLQUFLLFFBQVE7UUFDakMsQ0FBQyxDQUFDLFVBQVU7UUFDWixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmRlY2xhcmUgY29uc3QgY2M6IGFueTtcblxuaW1wb3J0IHsgcGF0aEV4aXN0cywgcmVhZEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgdHlwZSB7IEVmZmVjdEFzc2V0IH0gZnJvbSAnY2MnO1xuaW1wb3J0IHR5cGUgeyBJQXNzZXQgfSBmcm9tICcuL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHR5cGUgeyBJQXNzZXRJbmZvLCBJUHJvcGVydHkgfSBmcm9tICcuL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IHsgZGVzZXJpYWxpemUgYXMgZGVzZXJpYWxpemVBc3NldFNvdXJjZSB9IGZyb20gJy4vYXNzZXQtaGFuZGxlci91dGlscyc7XG5pbXBvcnQgeyBlbmNvZGVTZXJpYWxpemVkT2JqZWN0IH0gZnJvbSAnLi9zZXJpYWxpemVkLWRhdGEnO1xuaW1wb3J0IGFzc2V0T3BlcmF0aW9uIGZyb20gJy4vbWFuYWdlci9vcGVyYXRpb24nO1xuaW1wb3J0IGFzc2V0UXVlcnkgZnJvbSAnLi9tYW5hZ2VyL3F1ZXJ5JztcbmltcG9ydCB7IHNlcmlhbGl6ZSBhcyBlZGl0b3JTZXJpYWxpemUgfSBmcm9tICcuLi9lbmdpbmUvZWRpdG9yLWV4dGVuZHMnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vYmFzZS9pMThuJztcblxuZXhwb3J0IGludGVyZmFjZSBNYXRlcmlhbEVmZmVjdEluZm8ge1xuICAgIHV1aWQ6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaGlkZUluRWRpdG9yPzogYm9vbGVhbjtcbiAgICBhc3NldFBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYXRlcmlhbFBhc3NEdW1wIHtcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgcGhhc2U/OiBzdHJpbmc7XG4gICAgc3dpdGNoPzogSVByb3BlcnR5O1xuICAgIHByb3BlcnR5SW5kZXg6IElQcm9wZXJ0eTtcbiAgICBwcm9wczogSVByb3BlcnR5W107XG4gICAgZGVmaW5lczogSVByb3BlcnR5W107XG4gICAgc3RhdGVzOiBJUHJvcGVydHk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWF0ZXJpYWxUZWNobmlxdWVEdW1wIHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHBhc3NlczogTWF0ZXJpYWxQYXNzRHVtcFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hdGVyaWFsRHVtcCB7XG4gICAgZWZmZWN0OiBzdHJpbmc7XG4gICAgdGVjaG5pcXVlOiBudW1iZXI7XG4gICAgZGF0YTogTWF0ZXJpYWxUZWNobmlxdWVEdW1wW107XG59XG5cbmNvbnN0IEJBU0lDX1ZBTFVFX1RZUEVfTUFQOiBSZWNvcmQ8c3RyaW5nIHwgbnVtYmVyLCBzdHJpbmc+ID0ge1xuICAgIGJvb2xlYW46ICdCb29sZWFuJyxcbiAgICBudW1iZXI6ICdOdW1iZXInLFxuICAgIHN0cmluZzogJ1N0cmluZycsXG59O1xuXG5jb25zdCBJTlNQRUNUT1JfQVRUUklCVVRFX1BST1BTID0gWyd2aXNpYmxlJywgJ2Rpc3BsYXlOYW1lJywgJ21pbicsICdtYXgnLCAnc3RlcCcsICdzbGlkZScsICd0b29sdGlwJywgJ3JhbmdlJ107XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFsbEVmZmVjdHMoKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBNYXRlcmlhbEVmZmVjdEluZm8+PiB7XG4gICAgY29uc3QgZWZmZWN0QXNzZXRzID0gcXVlcnlFZmZlY3RBc3NldHMoKTtcbiAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIE1hdGVyaWFsRWZmZWN0SW5mbz4gPSB7fTtcblxuICAgIGZvciAoY29uc3QgYXNzZXQgb2YgZWZmZWN0QXNzZXRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZmZlY3QgPSBhd2FpdCBsb2FkRWZmZWN0QXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0UXVlcnkuZW5jb2RlQXNzZXQoYXNzZXQsIFtdKTtcbiAgICAgICAgICAgIHJlc3VsdFthc3NldC51dWlkXSA9IHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGVmZmVjdC5uYW1lIHx8IGdldEVmZmVjdEZhbGxiYWNrTmFtZShpbmZvKSxcbiAgICAgICAgICAgICAgICBoaWRlSW5FZGl0b3I6ICEhZWZmZWN0LmhpZGVJbkVkaXRvcixcbiAgICAgICAgICAgICAgICBhc3NldFBhdGg6IGluZm8udXJsIHx8IGluZm8uZmlsZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB3YXJuRWZmZWN0TG9hZEZhaWx1cmUoYXNzZXQsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUVmZmVjdChlZmZlY3ROYW1lT3JVdWlkOiBzdHJpbmcpOiBQcm9taXNlPE1hdGVyaWFsVGVjaG5pcXVlRHVtcFtdPiB7XG4gICAgY29uc3QgeyBhc3NldCwgZWZmZWN0IH0gPSBhd2FpdCByZXNvbHZlRWZmZWN0QXNzZXQoZWZmZWN0TmFtZU9yVXVpZCk7XG4gICAgaWYgKCFlZmZlY3QpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFZmZlY3QgYXNzZXQgY2FuIG5vdCBiZSBmb3VuZDogJHtlZmZlY3ROYW1lT3JVdWlkfS4gUGxlYXNlIHJlZnJlc2gvcmVpbXBvcnQgZWZmZWN0LmApO1xuICAgIH1cbiAgICByZXR1cm4gZW5jb2RlRWZmZWN0KGVmZmVjdCwgYXNzZXQudXVpZCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeU1hdGVyaWFsKHV1aWRPclVybE9yUGF0aDogc3RyaW5nKTogUHJvbWlzZTxNYXRlcmlhbER1bXA+IHtcbiAgICBjb25zdCB7IGFzc2V0LCBhc3NldEluZm8gfSA9IHJlc29sdmVNYXRlcmlhbEFzc2V0KHV1aWRPclVybE9yUGF0aCk7XG4gICAgY29uc3Qgc291cmNlID0gYXdhaXQgcmVhZE1hdGVyaWFsU291cmNlKGFzc2V0LCBhc3NldEluZm8pO1xuICAgIGNvbnN0IG1hdGVyaWFsID0gZGVzZXJpYWxpemVNYXRlcmlhbFNvdXJjZShzb3VyY2UsIGFzc2V0KTtcbiAgICBjb25zdCBlZmZlY3RVdWlkID0gZXh0cmFjdFV1aWQoc291cmNlPy5fZWZmZWN0QXNzZXQpIHx8IGV4dHJhY3RVdWlkKG1hdGVyaWFsPy5fZWZmZWN0QXNzZXQpO1xuXG4gICAgaWYgKCFlZmZlY3RVdWlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTWF0ZXJpYWwgZWZmZWN0IGNhbiBub3QgYmUgZm91bmQ6ICR7dXVpZE9yVXJsT3JQYXRofS4gUGxlYXNlIHJlZnJlc2gvcmVpbXBvcnQgbWF0ZXJpYWwuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBhc3NldDogZWZmZWN0QXNzZXQsIGVmZmVjdCB9ID0gYXdhaXQgcmVzb2x2ZUVmZmVjdEFzc2V0KGVmZmVjdFV1aWQpO1xuICAgIGNvbnN0IGRhdGEgPSBlbmNvZGVFZmZlY3QoZWZmZWN0LCBlZmZlY3RBc3NldC51dWlkKTtcbiAgICBjb25zdCB0ZWNobmlxdWVJbmRleCA9IE51bWJlci5pc0ludGVnZXIobWF0ZXJpYWwuX3RlY2hJZHgpID8gbWF0ZXJpYWwuX3RlY2hJZHggOiAoc291cmNlLl90ZWNoSWR4IHx8IDApO1xuICAgIGNvbnN0IHRlY2huaXF1ZSA9IGRhdGFbdGVjaG5pcXVlSW5kZXhdO1xuXG4gICAgaWYgKHRlY2huaXF1ZSkge1xuICAgICAgICBtZXJnZU1hdGVyaWFsT3ZlcnJpZGVzKHRlY2huaXF1ZSwgbWF0ZXJpYWwpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGVmZmVjdDogZWZmZWN0QXNzZXQudXVpZCxcbiAgICAgICAgdGVjaG5pcXVlOiB0ZWNobmlxdWVJbmRleCxcbiAgICAgICAgZGF0YSxcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTWF0ZXJpYWxTb3VyY2UoYXNzZXQ6IElBc3NldCwgYXNzZXRJbmZvOiBJQXNzZXRJbmZvKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAoYXNzZXQuc291cmNlICYmIGF3YWl0IHBhdGhFeGlzdHMoYXNzZXQuc291cmNlKSkge1xuICAgICAgICByZXR1cm4gcmVhZEpTT04oYXNzZXQuc291cmNlKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaWJyYXJ5UGF0aCA9IGFzc2V0SW5mby5saWJyYXJ5WycuanNvbiddO1xuICAgIGlmIChsaWJyYXJ5UGF0aCAmJiBhd2FpdCBwYXRoRXhpc3RzKGxpYnJhcnlQYXRoKSkge1xuICAgICAgICByZXR1cm4gcmVhZEpTT04obGlicmFyeVBhdGgpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgTWF0ZXJpYWwgSlNPTiBjYW4gbm90IGJlIGZvdW5kOiAke2Fzc2V0SW5mby51cmwgfHwgYXNzZXQudXVpZH0uIFBsZWFzZSByZWZyZXNoL3JlaW1wb3J0IG1hdGVyaWFsLmApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZU1hdGVyaWFsKHV1aWRPclVybE9yUGF0aDogc3RyaW5nLCBkdW1wOiBNYXRlcmlhbER1bXApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IGFzc2V0IH0gPSByZXNvbHZlTWF0ZXJpYWxBc3NldCh1dWlkT3JVcmxPclBhdGgpO1xuICAgIGNvbnN0IHNlcmlhbGl6ZWQgPSBhd2FpdCBkZWNvZGVNYXRlcmlhbChkdW1wKTtcbiAgICBhd2FpdCBhc3NldE9wZXJhdGlvbi5zYXZlQXNzZXQoYXNzZXQudXVpZCwgZm9ybWF0U2VyaWFsaXplZENvbnRlbnQoc2VyaWFsaXplZCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlRWZmZWN0KGVmZmVjdDogRWZmZWN0QXNzZXQsIGVmZmVjdFV1aWQ/OiBzdHJpbmcpOiBNYXRlcmlhbFRlY2huaXF1ZUR1bXBbXSB7XG4gICAgcmV0dXJuIChlZmZlY3QudGVjaG5pcXVlcyB8fCBbXSkubWFwKCh0ZWNoOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgcGFzc2VzID0gKHRlY2gucGFzc2VzIHx8IFtdKS5tYXAoKHBhc3M6IGFueSwgaW5kZXg6IG51bWJlcik6IE1hdGVyaWFsUGFzc0R1bXAgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IElQcm9wZXJ0eVtdID0gW107XG4gICAgICAgICAgICBjb25zdCBkZWZpbmVzOiBJUHJvcGVydHlbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcHJvZyA9IChlZmZlY3Quc2hhZGVycyB8fCBbXSkuZmluZCgoc2hhZGVyOiBhbnkpID0+IHNoYWRlci5uYW1lID09PSBwYXNzLnByb2dyYW0pO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRlZmluZSBvZiAocHJvZz8uZGVmaW5lcyB8fCBbXSkgYXMgYW55W10pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmluZS5uYW1lID09PSAnc3RyaW5nJyAmJiBkZWZpbmUubmFtZS5zdGFydHNXaXRoKCdDQ18nKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gZ2V0R2Z4VmFsdWVUeXBlKGRlZmluZS50eXBlKTtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWU6IGFueTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnTnVtYmVyJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSW50ZWdlcic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0Zsb2F0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gQXJyYXkuaXNBcnJheShkZWZpbmUucmFuZ2UpID8gZGVmaW5lLnJhbmdlWzBdIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdTdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBBcnJheS5pc0FycmF5KGRlZmluZS5vcHRpb25zKSA/IGRlZmluZS5vcHRpb25zWzBdIDogJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gZW5jb2RlU2VyaWFsaXplZE9iamVjdCh2YWx1ZSwgeyBkZWZhdWx0OiB2YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sdGlwID0gdHJ5R2V0RWZmZWN0VG9vbHRpcChkZWZpbmUubmFtZSwgZGVmaW5lLmVkaXRvcj8udG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkdW1wLCB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGRlZmluZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzOiBkZWZpbmUuZGVmaW5lcyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogZGVmaW5lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBkZWZpbmUucmFuZ2UsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGR1bXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZGVmaW5lcy5wdXNoKGR1bXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnZXRPYmplY3RLZXlzKHBhc3MucHJvcGVydGllcykuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBwYXNzLnByb3BlcnRpZXNbbmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKHByb3A/LmVkaXRvcj8uZGVwcmVjYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdW5pZm9ybU5hbWUgPSBwcm9wPy5oYW5kbGVJbmZvPy5bMF0gfHwgbmFtZTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wRGF0YSA9IGdldFByb3BEYXRhKHVuaWZvcm1OYW1lLCBwcm9nKTtcbiAgICAgICAgICAgICAgICBsZXQgY3VzdG9tRGVmaW5lcyA9IHByb3A/LmVkaXRvcj8ucGFyZW50O1xuICAgICAgICAgICAgICAgIGlmIChjdXN0b21EZWZpbmVzICYmICFBcnJheS5pc0FycmF5KGN1c3RvbURlZmluZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbURlZmluZXMgPSBbY3VzdG9tRGVmaW5lc107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHR5cGUgPSBnZXRHZnhWYWx1ZVR5cGUocHJvcC50eXBlKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcD8uZWRpdG9yPy50eXBlID09PSAnY29sb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSAnY2MuQ29sb3InO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGdldERlZmF1bHRWYWx1ZSh0eXBlLCBwcm9wLnZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcERhdGEuY291bnQgJiYgcHJvcERhdGEuY291bnQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogcHJvcERhdGEuY291bnQgfSwgKCkgPT4gY2xvbmVEZWZhdWx0VmFsdWUodmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpbnNwZWN0b3JBdHRyID0gcHJvcD8uZWRpdG9yID8gY2hlY2tJbnNwZWN0b3JBdHRyKHByb3AuZWRpdG9yKSA6IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2x0aXAgPSB0cnlHZXRFZmZlY3RUb29sdGlwKG5hbWUsIHByb3A/LmVkaXRvcj8udG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGVuY29kZVNlcmlhbGl6ZWRPYmplY3QodmFsdWUsIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBwcm9wPy5lZGl0b3I/LmRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiBwcm9wPy5lZGl0b3I/LnZpc2libGUsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXAsXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBwcm9wPy5lZGl0b3I/LnJhbmdlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICAgICAgICAuLi5pbnNwZWN0b3JBdHRyLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZHVtcC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZHVtcC52YWx1ZS5mb3JFYWNoKChlbGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uZGVmYXVsdCA9IGVsZW0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZHVtcCwge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzOiBjdXN0b21EZWZpbmVzIHx8IHByb3BEYXRhLmRlZmluZXMsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGR1bXAudmFsdWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcHJvcHMucHVzaChkdW1wKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBwYXNzU3RhdGUgPSBjaGFuZ2VQYXNzU3RhdGVUb0NDQ2xhc3MocGFzcyk7XG4gICAgICAgICAgICBjb25zdCBzdGF0ZXMgPSBlbmNvZGVTZXJpYWxpemVkT2JqZWN0KHBhc3NTdGF0ZSwge30pO1xuICAgICAgICAgICAgcGF0Y2hEdW1wRGF0YShzdGF0ZXMsICdwaXBlbGluZVN0YXRlcycpO1xuXG4gICAgICAgICAgICBjb25zdCBuZWVkSGlkZSA9IHBhc3MucHJvcGVydHlJbmRleCAhPT0gdW5kZWZpbmVkICYmIHBhc3MucHJvcGVydHlJbmRleCAhPT0gaW5kZXg7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgICAgIG5hbWU6IHBhc3MubmFtZSxcbiAgICAgICAgICAgICAgICBwaGFzZTogcGFzcy5waGFzZSxcbiAgICAgICAgICAgICAgICBzd2l0Y2g6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcGFzcy5zd2l0Y2gsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdCb29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVhZG9ubHk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHByb3BlcnR5SW5kZXg6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3Byb3BlcnR5SW5kZXgnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFzcy5wcm9wZXJ0eUluZGV4ID09PSB1bmRlZmluZWQgPyBpbmRleCA6IHBhc3MucHJvcGVydHlJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcGFzcy5wcm9wZXJ0eUluZGV4ID09PSB1bmRlZmluZWQgPyBpbmRleCA6IHBhc3MucHJvcGVydHlJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0ludGVnZXInLFxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcmVhZG9ubHk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHByb3BzOiBuZWVkSGlkZSA/IFtdIDogcHJvcHMsXG4gICAgICAgICAgICAgICAgZGVmaW5lczogbmVlZEhpZGUgPyBbXSA6IGRlZmluZXMsXG4gICAgICAgICAgICAgICAgc3RhdGVzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IHRlY2gubmFtZSxcbiAgICAgICAgICAgIHBhc3NlcyxcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZGVjb2RlTWF0ZXJpYWwoZHVtcDogTWF0ZXJpYWxEdW1wKTogUHJvbWlzZTxzdHJpbmcgfCBvYmplY3Q+IHtcbiAgICBjb25zdCB7IGFzc2V0OiBlZmZlY3RBc3NldCwgZWZmZWN0IH0gPSBhd2FpdCByZXNvbHZlRWZmZWN0QXNzZXQoZHVtcC5lZmZlY3QpO1xuICAgIGNvbnN0IE1hdGVyaWFsQ3RvciA9IGdldE1hdGVyaWFsQ3RvcigpO1xuICAgIGNvbnN0IG1hdGVyaWFsOiBhbnkgPSBuZXcgTWF0ZXJpYWxDdG9yKCk7XG4gICAgbWF0ZXJpYWwuX2VmZmVjdEFzc2V0ID0gZWZmZWN0O1xuICAgIG1hdGVyaWFsLl9wcm9wcyA9IFtdO1xuICAgIG1hdGVyaWFsLl9kZWZpbmVzID0gW107XG4gICAgbWF0ZXJpYWwuX3N0YXRlcyA9IFtdO1xuICAgIG1hdGVyaWFsLl90ZWNoSWR4ID0gZHVtcC50ZWNobmlxdWUgfHwgMDtcblxuICAgIGlmICgnX3V1aWQnIGluIG1hdGVyaWFsLl9lZmZlY3RBc3NldCkge1xuICAgICAgICBtYXRlcmlhbC5fZWZmZWN0QXNzZXQuX3V1aWQgPSBlZmZlY3RBc3NldC51dWlkO1xuICAgIH1cblxuICAgIGNvbnN0IHRlY2huaXF1ZSA9IGR1bXAuZGF0YT8uW21hdGVyaWFsLl90ZWNoSWR4XTtcbiAgICBjb25zdCBwYXNzZXMgPSB0ZWNobmlxdWU/LnBhc3NlcyB8fCBbXTtcbiAgICBjb25zdCBtYXRQcm9wczogUmVjb3JkPHN0cmluZywgYW55PltdID0gW107XG4gICAgY29uc3QgbWF0RGVmaW5lczogUmVjb3JkPHN0cmluZywgYW55PltdID0gW107XG4gICAgY29uc3QgbWF0U3RhdGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+W10gPSBbXTtcblxuICAgIGNvbnN0IGNvbXBhcmVBbmREZWNvZGUgPSAoZHVtcERhdGE6IGFueSwgZHN0RGF0YTogUmVjb3JkPHN0cmluZywgYW55Pik6IGJvb2xlYW4gPT4ge1xuICAgICAgICBpZiAoIWR1bXBEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZHVtcERhdGEuaXNPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlY29kZWQgPSBkZWNvZGVDaGFuZ2VkT2JqZWN0RHVtcChkdW1wRGF0YSk7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoZGVjb2RlZCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZHN0RGF0YVtkdW1wRGF0YS5uYW1lXSA9IGRlY29kZWQ7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGFzTW9kaWZpZWREdW1wKGR1bXBEYXRhKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZHN0RGF0YVtkdW1wRGF0YS5uYW1lXSA9IGRlY29kZU1hdGVyaWFsRHVtcFZhbHVlKGR1bXBEYXRhKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBwYXNzZXNbaV07XG4gICAgICAgIG1hdFByb3BzW2ldID0ge307XG4gICAgICAgIG1hdERlZmluZXNbaV0gPSB7fTtcbiAgICAgICAgbWF0U3RhdGVzW2ldID0ge307XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuc3dpdGNoPy5uYW1lICYmIGN1cnJlbnQuc3dpdGNoLnZhbHVlKSB7XG4gICAgICAgICAgICBtYXREZWZpbmVzW2ldW2N1cnJlbnQuc3dpdGNoLm5hbWVdID0gY3VycmVudC5zd2l0Y2gudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGRlZmluZSBvZiBjdXJyZW50LmRlZmluZXMgfHwgW10pIHtcbiAgICAgICAgICAgIGNvbXBhcmVBbmREZWNvZGUoZGVmaW5lLCBtYXREZWZpbmVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBjdXJyZW50LnByb3BzIHx8IFtdKSB7XG4gICAgICAgICAgICBjb21wYXJlQW5kRGVjb2RlKHByb3AsIG1hdFByb3BzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXRlcyA9IGN1cnJlbnQuc3RhdGVzPy52YWx1ZSAmJiB0eXBlb2YgY3VycmVudC5zdGF0ZXMudmFsdWUgPT09ICdvYmplY3QnXG4gICAgICAgICAgICA/IE9iamVjdC52YWx1ZXMoY3VycmVudC5zdGF0ZXMudmFsdWUpXG4gICAgICAgICAgICA6IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHN0YXRlIG9mIHN0YXRlcykge1xuICAgICAgICAgICAgY29tcGFyZUFuZERlY29kZShzdGF0ZSwgbWF0U3RhdGVzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1hdGVyaWFsLl9wcm9wcyA9IG1hdFByb3BzO1xuICAgIG1hdGVyaWFsLl9kZWZpbmVzID0gbWF0RGVmaW5lcztcbiAgICBtYXRlcmlhbC5fc3RhdGVzID0gbWF0U3RhdGVzO1xuXG4gICAgY29uc3QgdGVjaCA9IGVmZmVjdC50ZWNobmlxdWVzPy5bbWF0ZXJpYWwuX3RlY2hJZHhdO1xuICAgIGlmICh0ZWNoKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0ZWNoLnBhc3Nlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRlY2gucGFzc2VzW2ldO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnQucHJvcGVydHlJbmRleCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnQucHJvcGVydHlJbmRleCAhPT0gaSkge1xuICAgICAgICAgICAgICAgIG1hdGVyaWFsLl9wcm9wc1tpXSA9IHt9O1xuICAgICAgICAgICAgICAgIG1hdGVyaWFsLl9kZWZpbmVzW2ldID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0RWRpdG9yU2VyaWFsaXplKCkobWF0ZXJpYWwpO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlTWF0ZXJpYWxBc3NldCh1dWlkT3JVcmxPclBhdGg6IHN0cmluZyk6IHsgYXNzZXQ6IElBc3NldDsgYXNzZXRJbmZvOiBJQXNzZXRJbmZvIH0ge1xuICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0KHV1aWRPclVybE9yUGF0aCk7XG4gICAgaWYgKCFhc3NldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1hdGVyaWFsIGNhbiBub3QgYmUgZm91bmQ6ICR7dXVpZE9yVXJsT3JQYXRofS4gUGxlYXNlIHJlZnJlc2ggYXNzZXQgZGIgYW5kIHRyeSBhZ2Fpbi5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBhc3NldEluZm8gPSBhc3NldFF1ZXJ5LmVuY29kZUFzc2V0KGFzc2V0LCBbXSk7XG4gICAgaWYgKGFzc2V0SW5mby50eXBlICE9PSAnY2MuTWF0ZXJpYWwnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgaXMgbm90IGEgbWF0ZXJpYWw6ICR7dXVpZE9yVXJsT3JQYXRofS4gQ3VycmVudCB0eXBlOiAke2Fzc2V0SW5mby50eXBlfS5gKTtcbiAgICB9XG5cbiAgICBpZiAoIWFzc2V0LnNvdXJjZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1hdGVyaWFsIGhhcyBubyBzb3VyY2UgZmlsZTogJHt1dWlkT3JVcmxPclBhdGh9LmApO1xuICAgIH1cblxuICAgIHJldHVybiB7IGFzc2V0LCBhc3NldEluZm8gfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUVmZmVjdEFzc2V0KGVmZmVjdE5hbWVPclV1aWQ6IHN0cmluZyk6IFByb21pc2U8eyBhc3NldDogSUFzc2V0OyBhc3NldEluZm86IElBc3NldEluZm87IGVmZmVjdDogRWZmZWN0QXNzZXQgfT4ge1xuICAgIGNvbnN0IGRpcmVjdCA9IGFzc2V0UXVlcnkucXVlcnlBc3NldChlZmZlY3ROYW1lT3JVdWlkKTtcbiAgICBpZiAoZGlyZWN0KSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdEluZm8gPSBhc3NldFF1ZXJ5LmVuY29kZUFzc2V0KGRpcmVjdCwgW10pO1xuICAgICAgICBpZiAoZGlyZWN0SW5mby50eXBlID09PSAnY2MuRWZmZWN0QXNzZXQnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFzc2V0OiBkaXJlY3QsXG4gICAgICAgICAgICAgICAgYXNzZXRJbmZvOiBkaXJlY3RJbmZvLFxuICAgICAgICAgICAgICAgIGVmZmVjdDogYXdhaXQgbG9hZEVmZmVjdEFzc2V0KGRpcmVjdCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZWZmZWN0QXNzZXRzID0gcXVlcnlFZmZlY3RBc3NldHMoKTtcbiAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIGVmZmVjdEFzc2V0cykge1xuICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhc3NldFF1ZXJ5LmVuY29kZUFzc2V0KGFzc2V0LCBbXSk7XG4gICAgICAgIGlmIChtYXRjaGVzRWZmZWN0QXNzZXRLZXkoZWZmZWN0TmFtZU9yVXVpZCwgYXNzZXRJbmZvKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhc3NldCxcbiAgICAgICAgICAgICAgICBhc3NldEluZm8sXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBhd2FpdCBsb2FkRWZmZWN0QXNzZXQoYXNzZXQpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYXNzZXQgb2YgZWZmZWN0QXNzZXRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZmZlY3QgPSBhd2FpdCBsb2FkRWZmZWN0QXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChhc3NldCwgW10pO1xuICAgICAgICAgICAgaWYgKGVmZmVjdC5uYW1lID09PSBlZmZlY3ROYW1lT3JVdWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYXNzZXQsIGFzc2V0SW5mbywgZWZmZWN0IH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB3YXJuRWZmZWN0TG9hZEZhaWx1cmUoYXNzZXQsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgRWZmZWN0IGFzc2V0IGNhbiBub3QgYmUgZm91bmQ6ICR7ZWZmZWN0TmFtZU9yVXVpZH0uIFBsZWFzZSByZWZyZXNoL3JlaW1wb3J0IGVmZmVjdC5gKTtcbn1cblxuZnVuY3Rpb24gcXVlcnlFZmZlY3RBc3NldHMoKTogSUFzc2V0W10ge1xuICAgIHJldHVybiBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRzKHsgY2NUeXBlOiAnY2MuRWZmZWN0QXNzZXQnIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkRWZmZWN0QXNzZXQoYXNzZXQ6IElBc3NldCk6IFByb21pc2U8RWZmZWN0QXNzZXQ+IHtcbiAgICBjb25zdCBpbmZvID0gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChhc3NldCwgW10pO1xuICAgIGNvbnN0IGxpYnJhcnlQYXRoID0gaW5mby5saWJyYXJ5WycuanNvbiddO1xuICAgIGlmICghbGlicmFyeVBhdGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFZmZlY3QgbGlicmFyeSBKU09OIGNhbiBub3QgYmUgZm91bmQ6ICR7aW5mby51cmx9LiBQbGVhc2UgcmVmcmVzaC9yZWltcG9ydCBlZmZlY3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgZWZmZWN0ID0gZGVzZXJpYWxpemVBc3NldFNvdXJjZShhd2FpdCByZWFkSlNPTihsaWJyYXJ5UGF0aCkpIGFzIEVmZmVjdEFzc2V0O1xuICAgIGlmICghZWZmZWN0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRGVzZXJpYWxpemUgZWZmZWN0IGZhaWxlZDogJHtpbmZvLnVybH0uIFBsZWFzZSByZWZyZXNoL3JlaW1wb3J0IGVmZmVjdC5gKTtcbiAgICB9XG4gICAgaWYgKCdfdXVpZCcgaW4gZWZmZWN0KSB7XG4gICAgICAgIChlZmZlY3QgYXMgYW55KS5fdXVpZCA9IGFzc2V0LnV1aWQ7XG4gICAgfVxuICAgIHJldHVybiBlZmZlY3Q7XG59XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplTWF0ZXJpYWxTb3VyY2Uoc291cmNlOiBhbnksIGFzc2V0OiBJQXNzZXQpOiBhbnkge1xuICAgIGNvbnN0IG1hdGVyaWFsID0gZGVzZXJpYWxpemVBc3NldFNvdXJjZShzb3VyY2UpO1xuICAgIGlmICghbWF0ZXJpYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEZXNlcmlhbGl6ZSBtYXRlcmlhbCBmYWlsZWQ6ICR7YXNzZXQudXJsIHx8IGFzc2V0LnV1aWR9LiBQbGVhc2UgcmVmcmVzaC9yZWltcG9ydCBtYXRlcmlhbC5gKTtcbiAgICB9XG4gICAgaWYgKCdfdXVpZCcgaW4gbWF0ZXJpYWwpIHtcbiAgICAgICAgbWF0ZXJpYWwuX3V1aWQgPSBhc3NldC51dWlkO1xuICAgIH1cbiAgICByZXR1cm4gbWF0ZXJpYWw7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNFZmZlY3RBc3NldEtleShrZXk6IHN0cmluZywgaW5mbzogSUFzc2V0SW5mbyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGJhc2VOYW1lID0gaW5mby5uYW1lLnJlcGxhY2UoL1xcLmVmZmVjdCQvaSwgJycpO1xuICAgIGNvbnN0IGxvYWROYW1lID0gaW5mby5sb2FkVXJsLnNwbGl0KCcvJykucG9wKCkgfHwgaW5mby5sb2FkVXJsO1xuICAgIHJldHVybiBrZXkgPT09IGluZm8udXVpZFxuICAgICAgICB8fCBrZXkgPT09IGluZm8udXJsXG4gICAgICAgIHx8IGtleSA9PT0gaW5mby5maWxlXG4gICAgICAgIHx8IGtleSA9PT0gaW5mby5uYW1lXG4gICAgICAgIHx8IGtleSA9PT0gYmFzZU5hbWVcbiAgICAgICAgfHwga2V5ID09PSBpbmZvLmxvYWRVcmxcbiAgICAgICAgfHwga2V5ID09PSBsb2FkTmFtZTtcbn1cblxuZnVuY3Rpb24gZ2V0RWZmZWN0RmFsbGJhY2tOYW1lKGluZm86IElBc3NldEluZm8pOiBzdHJpbmcge1xuICAgIHJldHVybiBpbmZvLm5hbWUucmVwbGFjZSgvXFwuZWZmZWN0JC9pLCAnJyk7XG59XG5cbmZ1bmN0aW9uIGdldE9iamVjdEtleXMob2JqOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFvYmopIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGlmIChvYmouY29uc3RydWN0b3I/Ll9faXNKU0IpIHtcbiAgICAgICAgY29uc3Qga2V5czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICB9XG5cbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKTtcbn1cblxuZnVuY3Rpb24gdHJ5R2V0RWZmZWN0VG9vbHRpcChuYW1lOiBzdHJpbmcsIHJhd1Rvb2x0aXA/OiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIHJhd1Rvb2x0aXAgPT09ICdzdHJpbmcnICYmIHJhd1Rvb2x0aXAgIT09ICcnKSB7XG4gICAgICAgIHJldHVybiByYXdUb29sdGlwO1xuICAgIH1cblxuICAgIGNvbnN0IHRvb2x0aXAgPSBgRU5HSU5FLmFzc2V0cy5lZmZlY3QucHJvcGVydHlUaXBzLiR7bmFtZX1gO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRyYW5zbGF0ZWQgPSBpMThuLnQodG9vbHRpcCBhcyBhbnkpO1xuICAgICAgICBpZiAodHJhbnNsYXRlZCAmJiB0cmFuc2xhdGVkICE9PSB0b29sdGlwKSB7XG4gICAgICAgICAgICByZXR1cm4gYGkxOG46JHt0b29sdGlwfWA7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSWdub3JlIG1pc3NpbmcgaTE4biBrZXlzLlxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHdhcm5FZmZlY3RMb2FkRmFpbHVyZShhc3NldDogSUFzc2V0LCBlcnJvcjogdW5rbm93bikge1xuICAgIGNvbnNvbGUud2FybihgRWZmZWN0QXNzZXQgJHthc3NldC51dWlkfSBjYW4gbm90IGJlIGxvYWRlZC4gUGxlYXNlIHJlZnJlc2gvcmVpbXBvcnQgZWZmZWN0LmApO1xuICAgIGNvbnNvbGUud2FybihlcnJvcik7XG59XG5cbmZ1bmN0aW9uIGRlZXBDb3B5UHJvcGVydHkoZHN0T2JqOiBhbnksIHNyY09iajogYW55LCBwcm9wTmFtZTogc3RyaW5nIHwgbnVtYmVyLCBwcm9wQ2xhc3M/OiBhbnkpIHtcbiAgICBpZiAoIWRzdE9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZHN0UHJvcCA9IGRzdE9ialtwcm9wTmFtZV07XG4gICAgY29uc3Qgc3JjUHJvcCA9IHNyY09iaj8uW3Byb3BOYW1lXTtcbiAgICBpZiAoc3JjUHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkc3RQcm9wKSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3JjUHJvcCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNyY0FycmF5TGVuID0gc3JjUHJvcC5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGRzdEFycmF5TGVuID0gZHN0UHJvcC5sZW5ndGg7XG4gICAgICAgIGlmIChwcm9wQ2xhc3MgJiYgc3JjQXJyYXlMZW4gPiBkc3RBcnJheUxlbikge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcmNBcnJheUxlbiAtIGRzdEFycmF5TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkc3RQcm9wLnB1c2gobmV3IHByb3BDbGFzcygpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3JjUHJvcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGVlcENvcHlQcm9wZXJ0eShkc3RQcm9wLCBzcmNQcm9wLCBpLCBwcm9wQ2xhc3MpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChkc3RQcm9wPy5jb25zdHJ1Y3Rvcj8uX19wcm9wc19fKSB7XG4gICAgICAgIGNvbnN0IGN0b3IgPSBkc3RQcm9wLmNvbnN0cnVjdG9yO1xuICAgICAgICBjdG9yLl9fcHJvcHNfXy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKGRzdFByb3Bba2V5XSA9PT0gdW5kZWZpbmVkIHx8IHNyY1Byb3Bba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXR0ciA9IGNjLkNsYXNzLmF0dHIoY3Rvciwga2V5KTtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJDdG9yID0gZ2V0Q29uc3RydWN0b3Ioc3JjUHJvcFtrZXldLCBhdHRyKTtcbiAgICAgICAgICAgIGRlZXBDb3B5UHJvcGVydHkoZHN0UHJvcCwgc3JjUHJvcCwga2V5LCBhdHRyQ3Rvcik7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRzdE9ialtwcm9wTmFtZV0gPSBzcmNPYmpbcHJvcE5hbWVdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2hhbmdlUGFzc1N0YXRlVG9DQ0NsYXNzKHBhc3NTdGF0ZU9iajogYW55KSB7XG4gICAgY29uc3QgUGFzc1N0YXRlc0VkaXRvckN0b3IgPSBnZXRQYXNzU3RhdGVzRWRpdG9yQ3RvcigpO1xuICAgIGNvbnN0IHBhc3NTdGF0ZTogYW55ID0gbmV3IFBhc3NTdGF0ZXNFZGl0b3JDdG9yKCk7XG4gICAgcGFzc1N0YXRlLmJsZW5kU3RhdGUuaW5pdChwYXNzU3RhdGVPYmouYmxlbmRTdGF0ZSk7XG4gICAgY29uc3QgY3RvcjogYW55ID0gcGFzc1N0YXRlLmNvbnN0cnVjdG9yO1xuICAgIGN0b3IuX19wcm9wc19fLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChwYXNzU3RhdGVba2V5XSA9PT0gdW5kZWZpbmVkIHx8IHBhc3NTdGF0ZU9ialtrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyID0gY2MuQ2xhc3MuYXR0cihjdG9yLCBrZXkpO1xuICAgICAgICBjb25zdCBhdHRyQ3RvciA9IGdldENvbnN0cnVjdG9yKHBhc3NTdGF0ZU9ialtrZXldLCBhdHRyKTtcbiAgICAgICAgZGVlcENvcHlQcm9wZXJ0eShwYXNzU3RhdGUsIHBhc3NTdGF0ZU9iaiwga2V5LCBhdHRyQ3Rvcik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFzc1N0YXRlO1xufVxuXG5mdW5jdGlvbiBnZXRQYXNzU3RhdGVzRWRpdG9yQ3RvcigpOiBhbnkge1xuICAgIGNvbnN0IG1hdGVyaWFsTW9kdWxlID0gcmVxdWlyZSgnY2MvZWRpdG9yL21hdGVyaWFsJyk7XG4gICAgcmV0dXJuIG1hdGVyaWFsTW9kdWxlLlBhc3NTdGF0ZXNFZGl0b3I7XG59XG5cbmZ1bmN0aW9uIGdldE1hdGVyaWFsQ3RvcigpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2MgIT09ICd1bmRlZmluZWQnICYmIGNjLk1hdGVyaWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gY2MuTWF0ZXJpYWw7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSWdub3JlLCBjYyBpcyBpbml0aWFsaXplZCBsYXppbHkgaW4gdGVzdHMgYW5kIGhvc3Qgc3RhcnR1cC5cbiAgICB9XG5cbiAgICBjb25zdCBjY01vZHVsZSA9IHJlcXVpcmUoJ2NjJyk7XG4gICAgcmV0dXJuIGNjTW9kdWxlLk1hdGVyaWFsO1xufVxuXG5mdW5jdGlvbiBoYXNNb2RpZmllZER1bXAoZHVtcERhdGE6IGFueSk6IGJvb2xlYW4ge1xuICAgIGlmICghZHVtcERhdGEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChkdW1wRGF0YS5pc09iamVjdCAmJiBkdW1wRGF0YS52YWx1ZSAmJiB0eXBlb2YgZHVtcERhdGEudmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QudmFsdWVzKGR1bXBEYXRhLnZhbHVlKS5zb21lKChpdGVtKSA9PiBoYXNNb2RpZmllZER1bXAoaXRlbSkpO1xuICAgIH1cblxuICAgIGlmIChkdW1wRGF0YS5pc0FycmF5ICYmIEFycmF5LmlzQXJyYXkoZHVtcERhdGEudmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBpc01vZGlmaWVkKGR1bXBEYXRhKSB8fCBkdW1wRGF0YS52YWx1ZS5zb21lKChpdGVtOiBhbnkpID0+IGhhc01vZGlmaWVkRHVtcChpdGVtKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzTW9kaWZpZWQoZHVtcERhdGEpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVDaGFuZ2VkT2JqZWN0RHVtcChkdW1wRGF0YTogYW55KTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgaWYgKCFkdW1wRGF0YT8udmFsdWUgfHwgdHlwZW9mIGR1bXBEYXRhLnZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldE9iamVjdEtleXMoZHVtcERhdGEudmFsdWUpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGR1bXBEYXRhLnZhbHVlW2tleV07XG4gICAgICAgIGlmICghaGFzTW9kaWZpZWREdW1wKGNoaWxkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtjaGlsZC5uYW1lID8/IGtleV0gPSBjaGlsZC5pc09iamVjdCA/IGRlY29kZUNoYW5nZWRPYmplY3REdW1wKGNoaWxkKSA6IGRlY29kZU1hdGVyaWFsRHVtcFZhbHVlKGNoaWxkKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBkZWNvZGVNYXRlcmlhbER1bXBWYWx1ZShkdW1wRGF0YTogYW55KTogYW55IHtcbiAgICBpZiAoIWR1bXBEYXRhIHx8ICEoJ3ZhbHVlJyBpbiBkdW1wRGF0YSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IGR1bXBEYXRhLnZhbHVlO1xuICAgIGlmIChpc0Fzc2V0UmVmZXJlbmNlRHVtcChkdW1wRGF0YSkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUFzc2V0UmVmZXJlbmNlKHZhbHVlLnV1aWQsIGR1bXBEYXRhLnR5cGUpO1xuICAgIH1cblxuICAgIGlmIChkdW1wRGF0YS5pc0FycmF5KSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUubWFwKChpdGVtOiBhbnkpID0+IGlzUHJvcGVydHlEdW1wKGl0ZW0pID8gZGVjb2RlTWF0ZXJpYWxEdW1wVmFsdWUoaXRlbSkgOiBjbG9uZVNlcmlhbGl6ZWRWYWx1ZShpdGVtKSk7XG4gICAgfVxuXG4gICAgaWYgKGR1bXBEYXRhLmlzT2JqZWN0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZ2V0T2JqZWN0S2V5cyh2YWx1ZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSB2YWx1ZVtrZXldO1xuICAgICAgICAgICAgICAgIHJlc3VsdFtjaGlsZC5uYW1lID8/IGtleV0gPSBpc1Byb3BlcnR5RHVtcChjaGlsZCkgPyBkZWNvZGVNYXRlcmlhbER1bXBWYWx1ZShjaGlsZCkgOiBjbG9uZVNlcmlhbGl6ZWRWYWx1ZShjaGlsZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgY29uc3QgY2NUeXBlID0gZ2V0Q0NDbGFzc0J5TmFtZShkdW1wRGF0YS50eXBlKTtcbiAgICBpZiAoY2NUeXBlICYmICgoZHVtcERhdGEuZXh0ZW5kcyB8fCBbXSkuaW5jbHVkZXMoJ2NjLlZhbHVlVHlwZScpIHx8IEFycmF5LmlzQXJyYXkoY2NUeXBlLl9fcHJvcHNfXykpKSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGNjVHlwZSgpO1xuICAgICAgICBjb25zdCBrZXlzID0gQXJyYXkuaXNBcnJheShjY1R5cGUuX19wcm9wc19fKSA/IGNjVHlwZS5fX3Byb3BzX18gOiBnZXRPYmplY3RLZXlzKHZhbHVlKTtcbiAgICAgICAga2V5cy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlW2tleV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluc3RhbmNlW2tleV0gPSBpc1Byb3BlcnR5RHVtcCh2YWx1ZVtrZXldKSA/IGRlY29kZU1hdGVyaWFsRHVtcFZhbHVlKHZhbHVlW2tleV0pIDogY2xvbmVTZXJpYWxpemVkVmFsdWUodmFsdWVba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgZ2V0T2JqZWN0S2V5cyh2YWx1ZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gdmFsdWVba2V5XTtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBpc1Byb3BlcnR5RHVtcChjaGlsZCkgPyBkZWNvZGVNYXRlcmlhbER1bXBWYWx1ZShjaGlsZCkgOiBjbG9uZVNlcmlhbGl6ZWRWYWx1ZShjaGlsZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaXNBc3NldFJlZmVyZW5jZUR1bXAoZHVtcERhdGE6IGFueSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHZhbHVlID0gZHVtcERhdGE/LnZhbHVlO1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUudXVpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICgoZHVtcERhdGEuZXh0ZW5kcyB8fCBbXSkuaW5jbHVkZXMoJ2NjLkFzc2V0JykpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgY2NUeXBlID0gZ2V0Q0NDbGFzc0J5TmFtZShkdW1wRGF0YS50eXBlKTtcbiAgICB0cnkge1xuICAgICAgICBpZiAoY2NUeXBlICYmIGNjPy5qcz8uaXNDaGlsZENsYXNzT2YgJiYgY2M/LkFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gY2MuanMuaXNDaGlsZENsYXNzT2YoY2NUeXBlLCBjYy5Bc3NldCk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGtub3duIG1hdGVyaWFsIGFzc2V0IHByb3BlcnR5IHR5cGVzLlxuICAgIH1cblxuICAgIHJldHVybiBbJ2NjLkFzc2V0JywgJ2NjLlRleHR1cmVCYXNlJywgJ2NjLlRleHR1cmUyRCcsICdjYy5UZXh0dXJlQ3ViZSddLmluY2x1ZGVzKGR1bXBEYXRhLnR5cGUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBc3NldFJlZmVyZW5jZSh1dWlkOiBzdHJpbmcsIHR5cGU/OiBzdHJpbmcpIHtcbiAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBnZXRFZGl0b3JTZXJpYWxpemUoKS5hc0Fzc2V0KHV1aWQsIHR5cGUgPyBnZXRDQ0NsYXNzQnlOYW1lKHR5cGUpIDogdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q0NDbGFzc0J5TmFtZSh0eXBlPzogc3RyaW5nKTogYW55IHtcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGNjLmpzLmdldENsYXNzQnlOYW1lKHR5cGUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNQcm9wZXJ0eUR1bXAodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ3ZhbHVlJyk7XG59XG5cbmZ1bmN0aW9uIGNsb25lU2VyaWFsaXplZFZhbHVlKHZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIGdldENvbnN0cnVjdG9yKG9iamVjdDogYW55LCBhdHRyaWJ1dGU6IGFueSkge1xuICAgIGlmIChhdHRyaWJ1dGU/LmN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZS5jdG9yO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0ID09PSBudWxsIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IG9iamVjdC5jb25zdHJ1Y3Rvcjtcbn1cblxuZnVuY3Rpb24gZ2V0UGFzc0RlZmF1bHRWYWx1ZSh0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjY1R5cGUgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZSh0eXBlKTtcbiAgICBpZiAoY2NUeXBlKSB7XG4gICAgICAgIHJldHVybiBuZXcgY2NUeXBlKCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ0Jvb2xlYW4nOlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICBjYXNlICdGbG9hdCc6XG4gICAgICAgIGNhc2UgJ0ludGVnZXInOlxuICAgICAgICBjYXNlICdFbnVtJzpcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBjYXNlICdTdHJpbmcnOlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXRjaE5hbWVUb0R1bXAoZHVtcDogYW55LCBuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIWR1bXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGR1bXAubmFtZSA9IG5hbWU7XG4gICAgY29uc3QgdmFsdWUgPSBkdW1wLnZhbHVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwYXRjaE5hbWVUb0R1bXAodmFsdWVbaV0sIGAke2l9YCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgZHVtcC5pc09iamVjdCA9IHRydWU7XG4gICAgICAgIE9iamVjdC5rZXlzKHZhbHVlKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIHBhdGNoTmFtZVRvRHVtcCh2YWx1ZVtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoRHVtcERhdGEocGFzc1N0YXRlRHVtcDogYW55LCBuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIXBhc3NTdGF0ZUR1bXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHBhc3NTdGF0ZUR1bXAubmFtZSA9IG5hbWU7XG4gICAgY29uc3QgdmFsdWUgPSBwYXNzU3RhdGVEdW1wLnZhbHVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXRQYXNzRGVmYXVsdFZhbHVlKHBhc3NTdGF0ZUR1bXAudHlwZSk7XG4gICAgICAgIHBhc3NTdGF0ZUR1bXAuZWxlbWVudFR5cGVEYXRhID0gZW5jb2RlU2VyaWFsaXplZE9iamVjdChkZWZhdWx0VmFsdWUsIHtcbiAgICAgICAgICAgIHR5cGU6IHBhc3NTdGF0ZUR1bXAudHlwZSxcbiAgICAgICAgICAgIGVudW1MaXN0OiBwYXNzU3RhdGVEdW1wLmVudW1MaXN0LFxuICAgICAgICB9KTtcbiAgICAgICAgcGF0Y2hOYW1lVG9EdW1wKHBhc3NTdGF0ZUR1bXAuZWxlbWVudFR5cGVEYXRhLCBuYW1lKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcGF0Y2hEdW1wRGF0YSh2YWx1ZVtpXSwgYCR7aX1gKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhKHBhc3NTdGF0ZUR1bXAuZXh0ZW5kcyB8fCBbXSkuaW5jbHVkZXMoJ2NjLlZhbHVlVHlwZScpKSB7XG4gICAgICAgIHBhc3NTdGF0ZUR1bXAuaXNPYmplY3QgPSB0cnVlO1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBwYXRjaER1bXBEYXRhKHZhbHVlW2tleV0sIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhc3NTdGF0ZUR1bXAuZGVmYXVsdCA9IHZhbHVlO1xuICAgIH1cblxuICAgIHBhc3NTdGF0ZUR1bXAuaXNNYXQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wRGF0YShuYW1lOiBzdHJpbmcsIHByb2c6IGFueSkge1xuICAgIGNvbnN0IHByb3BEYXRhOiB7IGRlZmluZXM/OiBhbnk7IGNvdW50PzogbnVtYmVyIH0gPSB7fTtcbiAgICBjb25zdCBibG9jayA9IHByb2c/LmJsb2Nrcz8uZmluZCgoYjogYW55KSA9PiBiLm1lbWJlcnM/LmZpbmQoKHU6IGFueSkgPT4gdS5uYW1lID09PSBuYW1lKSAhPT0gdW5kZWZpbmVkKTtcbiAgICBpZiAoYmxvY2spIHtcbiAgICAgICAgcHJvcERhdGEuZGVmaW5lcyA9IGJsb2NrLmRlZmluZXM7XG4gICAgICAgIGNvbnN0IG1lbWJlciA9IGJsb2NrLm1lbWJlcnMuZmluZCgobTogYW55KSA9PiBtLm5hbWUgPT09IG5hbWUpO1xuICAgICAgICBpZiAobWVtYmVyKSB7XG4gICAgICAgICAgICBwcm9wRGF0YS5jb3VudCA9IG1lbWJlci5jb3VudDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNhbXBsZXJUZXh0dXJlID0gcHJvZz8uc2FtcGxlclRleHR1cmVzPy5maW5kKCh1OiBhbnkpID0+IHUubmFtZSA9PT0gbmFtZSk7XG4gICAgaWYgKHNhbXBsZXJUZXh0dXJlKSB7XG4gICAgICAgIHByb3BEYXRhLmRlZmluZXMgPSBzYW1wbGVyVGV4dHVyZS5kZWZpbmVzO1xuICAgICAgICBwcm9wRGF0YS5jb3VudCA9IHNhbXBsZXJUZXh0dXJlLmNvdW50O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wRGF0YTtcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnNwZWN0b3JBdHRyKGluc3BlY3RvcjogYW55KSB7XG4gICAgY29uc3QgaW5zcGVjdG9yQXR0cjogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIElOU1BFQ1RPUl9BVFRSSUJVVEVfUFJPUFMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGlmIChpbnNwZWN0b3I/LltrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSAncmFuZ2UnKSB7XG4gICAgICAgICAgICBjb25zdCByYW5nZSA9IGluc3BlY3RvcltrZXldO1xuICAgICAgICAgICAgaWYgKHJhbmdlLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICAgICAgaW5zcGVjdG9yQXR0ci5taW4gPSByYW5nZVswXTtcbiAgICAgICAgICAgICAgICBpbnNwZWN0b3JBdHRyLm1heCA9IHJhbmdlWzFdO1xuICAgICAgICAgICAgICAgIGlmIChyYW5nZS5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3BlY3RvckF0dHIuc3RlcCA9IHJhbmdlWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluc3BlY3RvckF0dHJba2V5XSA9IGluc3BlY3RvcltrZXldO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaW5zcGVjdG9yQXR0cjtcbn1cblxuZnVuY3Rpb24gZ2V0R2Z4VmFsdWVUeXBlKHR5cGU6IHN0cmluZyB8IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgbWFwcGVkQmFzaWMgPSBCQVNJQ19WQUxVRV9UWVBFX01BUFt0eXBlXTtcbiAgICBpZiAobWFwcGVkQmFzaWMpIHtcbiAgICAgICAgcmV0dXJuIG1hcHBlZEJhc2ljO1xuICAgIH1cblxuICAgIGNvbnN0IGdmeFR5cGUgPSBnZXRHZnhUeXBlRW51bSgpO1xuICAgIGNvbnN0IG1hcHBlZEdmeDogUmVjb3JkPHN0cmluZyB8IG51bWJlciwgc3RyaW5nPiA9IGdmeFR5cGUgPyB7XG4gICAgICAgIFtnZnhUeXBlLklOVF06ICdJbnRlZ2VyJyxcbiAgICAgICAgW2dmeFR5cGUuSU5UMl06ICdjYy5WZWMyJyxcbiAgICAgICAgW2dmeFR5cGUuSU5UM106ICdjYy5WZWMzJyxcbiAgICAgICAgW2dmeFR5cGUuSU5UNF06ICdjYy5WZWM0JyxcbiAgICAgICAgW2dmeFR5cGUuRkxPQVRdOiAnRmxvYXQnLFxuICAgICAgICBbZ2Z4VHlwZS5GTE9BVDJdOiAnY2MuVmVjMicsXG4gICAgICAgIFtnZnhUeXBlLkZMT0FUM106ICdjYy5WZWMzJyxcbiAgICAgICAgW2dmeFR5cGUuRkxPQVQ0XTogJ2NjLlZlYzQnLFxuICAgICAgICBbZ2Z4VHlwZS5NQVQ0XTogJ2NjLk1hdDQnLFxuICAgICAgICBbZ2Z4VHlwZS5TQU1QTEVSMkRdOiAnY2MuVGV4dHVyZUJhc2UnLFxuICAgICAgICBbZ2Z4VHlwZS5TQU1QTEVSX0NVQkVdOiAnY2MuVGV4dHVyZUN1YmUnLFxuICAgIH0gOiB7fTtcblxuICAgIHJldHVybiBtYXBwZWRHZnhbdHlwZV0gfHwgYCR7dHlwZX1gO1xufVxuXG5mdW5jdGlvbiBnZXRHZnhUeXBlRW51bSgpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2MgIT09ICd1bmRlZmluZWQnICYmIGNjLmdmeD8uVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNjLmdmeC5UeXBlO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIElnbm9yZSwgY2MgaXMgaW5pdGlhbGl6ZWQgbGF6aWx5IGluIHRlc3RzIGFuZCBob3N0IHN0YXJ0dXAuXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJ2NjJykuZ2Z4Py5UeXBlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKHR5cGU6IHN0cmluZywgZGF0YT86IGFueSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdCb29sZWFuJzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gZGF0YVswXSA6IGZhbHNlO1xuICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICBjYXNlICdJbnRlZ2VyJzpcbiAgICAgICAgY2FzZSAnRmxvYXQnOlxuICAgICAgICAgICAgcmV0dXJuIGRhdGEgPyBkYXRhWzBdIDogMDtcbiAgICAgICAgY2FzZSAnU3RyaW5nJzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gZGF0YVswXSA6ICcnO1xuICAgICAgICBjYXNlICdjYy5WZWMyJzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gbmV3IGNjLm1hdGguVmVjMihkYXRhWzBdIHx8IDAsIGRhdGFbMV0gfHwgMCkgOiBuZXcgY2MuVmVjMigpO1xuICAgICAgICBjYXNlICdjYy5WZWMzJzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gbmV3IGNjLm1hdGguVmVjMyhkYXRhWzBdIHx8IDAsIGRhdGFbMV0gfHwgMCwgZGF0YVsyXSB8fCAwKSA6IG5ldyBjYy5WZWMzKCk7XG4gICAgICAgIGNhc2UgJ2NjLlZlYzQnOlxuICAgICAgICAgICAgcmV0dXJuIGRhdGEgPyBuZXcgY2MubWF0aC5WZWM0KGRhdGFbMF0gfHwgMCwgZGF0YVsxXSB8fCAwLCBkYXRhWzJdIHx8IDAsIGRhdGFbM10gfHwgMCkgOiBuZXcgY2MuVmVjNCgpO1xuICAgICAgICBjYXNlICdjYy5RdWF0JzpcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gbmV3IGNjLm1hdGguUXVhdChkYXRhWzBdIHx8IDAsIGRhdGFbMV0gfHwgMCwgZGF0YVsyXSB8fCAwLCBkYXRhWzNdIHx8IDEpIDogbmV3IGNjLlF1YXQoKTtcbiAgICAgICAgY2FzZSAnY2MuQ29sb3InOlxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVszXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbM10gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNjLkNvbG9yKGRhdGFbMF0gKiAyNTUsIGRhdGFbMV0gKiAyNTUsIGRhdGFbMl0gKiAyNTUsIGRhdGFbM10gKiAyNTUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBjYy5Db2xvcigpO1xuICAgICAgICBjYXNlICdjYy5NYXQ0JzpcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjYy5tYXRoLk1hdDQoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMV0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMl0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbM10sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbNF0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbNV0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbNl0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbN10sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbOF0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbOV0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMTBdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzExXSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxMl0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMTNdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhWzE0XSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVsxNV0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgY2MuTWF0NCgpO1xuICAgICAgICBjYXNlICdjYy5Bc3NldCc6XG4gICAgICAgICAgICByZXR1cm4gbmV3IGNjLkFzc2V0KCk7XG4gICAgICAgIGNhc2UgJ2NjLlRleHR1cmVCYXNlJzpcbiAgICAgICAgICAgIHJldHVybiBuZXcgY2MuVGV4dHVyZUJhc2UoKTtcbiAgICAgICAgY2FzZSAnY2MuVGV4dHVyZTJEJzpcbiAgICAgICAgICAgIHJldHVybiBuZXcgY2MuVGV4dHVyZTJEKCk7XG4gICAgICAgIGNhc2UgJ2NjLlRleHR1cmVDdWJlJzpcbiAgICAgICAgICAgIHJldHVybiBuZXcgY2MuVGV4dHVyZUN1YmUoKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsb25lRGVmYXVsdFZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlLmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5jbG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBtZXJnZU1hdGVyaWFsT3ZlcnJpZGVzKHRlY2huaXF1ZTogTWF0ZXJpYWxUZWNobmlxdWVEdW1wLCBtYXRlcmlhbDogYW55KSB7XG4gICAgdGVjaG5pcXVlLnBhc3Nlcy5mb3JFYWNoKChwYXNzLCBpbmRleCkgPT4ge1xuICAgICAgICBnZXRPYmplY3RLZXlzKG1hdGVyaWFsLl9kZWZpbmVzPy5baW5kZXhdKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gcGFzcy5kZWZpbmVzLmZpbmQoKGRlZmluZSkgPT4gZGVmaW5lLm5hbWUgPT09IG5hbWUpO1xuICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhc3Muc3dpdGNoPy5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhc3Muc3dpdGNoLnZhbHVlID0gbWF0ZXJpYWwuX2RlZmluZXNbaW5kZXhdW25hbWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdmVycmlkZURhdGFXaXRoQXNzZXQoaXRlbSwgbWF0ZXJpYWwuX2RlZmluZXNbaW5kZXhdW25hbWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ2V0T2JqZWN0S2V5cyhtYXRlcmlhbC5fcHJvcHM/LltpbmRleF0pLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwYXNzLnByb3BzLmZpbmQoKHByb3ApID0+IHByb3AubmFtZSA9PT0gbmFtZSk7XG4gICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdmVycmlkZURhdGFXaXRoQXNzZXQoaXRlbSwgbWF0ZXJpYWwuX3Byb3BzW2luZGV4XVtuYW1lXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdldE9iamVjdEtleXMobWF0ZXJpYWwuX3N0YXRlcz8uW2luZGV4XSkuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGVWYWx1ZSA9IHBhc3Muc3RhdGVzLnZhbHVlO1xuICAgICAgICAgICAgaWYgKCFzdGF0ZVZhbHVlIHx8IHR5cGVvZiBzdGF0ZVZhbHVlICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KHN0YXRlVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IE9iamVjdC52YWx1ZXMoc3RhdGVWYWx1ZSkuZmluZCgocHJvcDogYW55KSA9PiBwcm9wLm5hbWUgPT09IG5hbWUpIGFzIElQcm9wZXJ0eSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG92ZXJyaWRlRGF0YVdpdGhBc3NldChpdGVtLCBtYXRlcmlhbC5fc3RhdGVzW2luZGV4XVtuYW1lXSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBvdmVycmlkZURhdGFXaXRoQXNzZXQoZGVmYXVsdERhdGE6IGFueSwgYXNzZXREYXRhOiBhbnkpIHtcbiAgICBpZiAoZGVmYXVsdERhdGEgPT09IHVuZGVmaW5lZCB8fCBhc3NldERhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGRlZmF1bHREYXRhLmlzT2JqZWN0KSB7XG4gICAgICAgIGdldE9iamVjdEtleXMoYXNzZXREYXRhKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIG92ZXJyaWRlRGF0YVdpdGhBc3NldChkZWZhdWx0RGF0YS52YWx1ZT8uW2tleV0sIGFzc2V0RGF0YVtrZXldKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChkZWZhdWx0RGF0YS5pc0FycmF5KSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhc3NldERhdGEpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGFzc2V0RGF0YS5sZW5ndGggPiBkZWZhdWx0RGF0YS52YWx1ZS5sZW5ndGggJiYgZGVmYXVsdERhdGEuZWxlbWVudFR5cGVEYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGVmYXVsdERhdGEuZWxlbWVudFR5cGVEYXRhKSk7XG4gICAgICAgICAgICBuZXdWYWx1ZS5uYW1lID0gYCR7ZGVmYXVsdERhdGEudmFsdWUubGVuZ3RofWA7XG4gICAgICAgICAgICBuZXdWYWx1ZS5kaXNwbGF5TmFtZSA9IGAke2RlZmF1bHREYXRhLnZhbHVlLmxlbmd0aH1gO1xuICAgICAgICAgICAgZGVmYXVsdERhdGEudmFsdWUucHVzaChuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG92ZXJyaWRlRGF0YVdpdGhBc3NldChkZWZhdWx0RGF0YS52YWx1ZVtpXSwgYXNzZXREYXRhW2ldKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGR1bXAgPSBlbmNvZGVTZXJpYWxpemVkT2JqZWN0KGFzc2V0RGF0YSwge30pO1xuICAgICAgICBpZiAoZHVtcC50eXBlICE9PSAnVW5rbm93bicpIHtcbiAgICAgICAgICAgIGRlZmF1bHREYXRhLnZhbHVlID0gZHVtcC52YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNNb2RpZmllZChkdW1wRGF0YTogYW55KSB7XG4gICAgcmV0dXJuIGR1bXBEYXRhLmRlZmF1bHQgIT09IGR1bXBEYXRhLnZhbHVlICYmIEpTT04uc3RyaW5naWZ5KGR1bXBEYXRhLmRlZmF1bHQpICE9PSBKU09OLnN0cmluZ2lmeShkdW1wRGF0YS52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RVdWlkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUuX191dWlkX18gfHwgdmFsdWUuX3V1aWQgfHwgdmFsdWUudXVpZCB8fCAnJztcbn1cblxuZnVuY3Rpb24gZ2V0RWRpdG9yU2VyaWFsaXplKCkge1xuICAgIGNvbnN0IHNlcmlhbGl6ZSA9IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcz8uc2VyaWFsaXplIHx8IGVkaXRvclNlcmlhbGl6ZTtcbiAgICBpZiAoIXNlcmlhbGl6ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VkaXRvckV4dGVuZHMuc2VyaWFsaXplIGlzIG5vdCBpbml0aWFsaXplZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcmlhbGl6ZTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0U2VyaWFsaXplZENvbnRlbnQoc2VyaWFsaXplZDogc3RyaW5nIHwgb2JqZWN0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzZXJpYWxpemVkID09PSAnc3RyaW5nJ1xuICAgICAgICA/IHNlcmlhbGl6ZWRcbiAgICAgICAgOiBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkLCBudWxsLCA0KTtcbn1cbiJdfQ==