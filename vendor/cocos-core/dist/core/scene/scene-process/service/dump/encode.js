'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodePrefab = encodePrefab;
exports.encodeNode = encodeNode;
exports.encodeScene = encodeScene;
exports.encodeComponent = encodeComponent;
exports.encodeObject = encodeObject;
const utils_1 = __importDefault(require("./utils"));
const service_access_1 = require("./service-access");
const dump_defines_1 = require("./dump-defines");
const utils_2 = require("./../prefab/utils");
const core_1 = require("./../core");
const cc_1 = require("cc");
const i18n_1 = __importDefault(require("../../i18n"));
const attributeProps = [
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
const autoI18nAttributeNames = [
    'displayName',
    'tooltip',
];
function encodePrefab(node) {
    if (!node['_prefab'])
        return null;
    const prefabStateInfo = utils_2.prefabUtils.getPrefabStateInfo(node);
    const rootNode = node['_prefab'].root;
    const result = {
        uuid: (node['_prefab'].asset && node['_prefab'].asset._uuid) || '',
        fileId: node['_prefab'].fileId,
        rootUuid: rootNode?.uuid || '',
        sync: true,
        prefabStateInfo,
    };
    if (node['_prefab'].targetOverrides) {
        result.targetOverrides = encodeTargetOverrides(node['_prefab'].targetOverrides) ?? undefined;
    }
    if (node['_prefab'].instance) {
        result.instance = encodeObject(node['_prefab'].instance, { default: null }, node);
    }
    return result;
}
/**
 * 编码一个 node 数据
 * @param node
 */
function encodeNode(node, options = {}) {
    const includeComponents = options.includeComponents !== false;
    const ctor = node.constructor;
    const LayersEnumList = Object.keys(cc.Layers.Enum).map((key, index) => {
        return { name: key, value: cc.Layers.Enum[key] };
    });
    LayersEnumList.sort((a, b) => {
        return a.value - b.value;
    });
    const MobilityModeEnumList = Object.keys(cc_1.MobilityMode).map((key, index) => {
        return { name: key, value: cc_1.MobilityMode[key] };
    });
    // FIXME：后续需要避免直接访问私有字段。
    // TODO：这里的需要知道当前场景是 2D 还是 3D
    //const is2DProject = cce.SceneFacadeManager['_projectType'] === '2d';
    const is2DProject = false;
    const data = {
        path: EditorExtends.Node.getNodePath(node),
        active: encodeObject(node.active, { displayName: 'Active', default: null, visible: false }, node),
        locked: encodeObject(Boolean(node.objFlags & cc.Object.Flags.LockedInEditor), { displayName: 'Locked', default: false, animatable: false, visible: false }, node),
        name: encodeObject(node.name, { displayName: 'Name', default: null, animatable: false }, node),
        position: encodeObject(node.position, {
            displayName: 'i18n:scene.cc.Node.properties.position.displayName',
            default: new cc.math.Vec3(),
            tooltip: 'i18n:scene.cc.Node.properties.position.tooltip',
        }, node, 'position'),
        rotation: encodeObject(node.eulerAngles, {
            name: 'eulerAngles',
            displayName: 'i18n:scene.cc.Node.properties.eulerAngles.displayName',
            default: new cc.math.Vec3(),
            tooltip: `i18n:scene.cc.Node.properties.eulerAngles.${is2DProject ? 'tooltip2D' : 'tooltip3D'}`,
        }, node, is2DProject ? 'angle' : 'eulerAngles'),
        scale: encodeObject(node.scale, {
            displayName: 'i18n:scene.cc.Node.properties.scale.displayName',
            default: new cc.math.Vec3(1, 1, 1),
            tooltip: 'i18n:scene.cc.Node.properties.scale.tooltip',
        }, node, 'scale'),
        mobility: encodeObject(node.mobility, {
            displayName: 'i18n:scene.cc.Node.properties.mobility.displayName',
            tooltip: 'i18n:scene.cc.Node.properties.mobility.tooltip',
            default: 0,
            type: 'Enum',
            enumList: MobilityModeEnumList,
        }, node, 'mobility'),
        layer: encodeObject(node.layer, {
            displayName: 'i18n:scene.cc.Node.properties.layer.displayName',
            tooltip: 'i18n:scene.cc.Node.properties.layer.tooltip',
            default: 1073741824,
            type: 'Enum',
            enumList: LayersEnumList,
            readonly: false,
            animatable: false,
        }, node, 'layer'),
        uuid: encodeObject(node.uuid, { displayName: 'UUID', default: null, animatable: false }, node),
        parent: encodeObject(node.parent, {
            ctor: cc.Node,
        }, node),
        children: node.children
            .map((child) => {
            if (!child || child.objFlags & cc.Object.Flags.HideInHierarchy) {
                return;
            }
            return encodeObject(child, {
                ctor: cc.Node,
            }, node);
        })
            .filter((v) => !!v),
        __type__: utils_1.default.getTypeName(ctor),
        __comps__: includeComponents
            ? node['_components'].map((comp) => {
                return encodeComponent(comp);
            })
            : [],
        mountedRoot: utils_2.prefabUtils.getMountedRoot(node)?.uuid,
    };
    if (node['_prefab']) {
        data.__prefab__ = encodePrefab(node);
        const removedComponents = utils_2.prefabUtils.getRemovedComponents(node);
        if (removedComponents.length > 0) {
            data.removedComponents = removedComponents.map((comp) => {
                return { name: cc_1.js.getClassName(comp), fileID: comp.__prefab.fileId };
            });
        }
    }
    // 根据 flag 调整 readonly。
    _checkObjFlags(node, data);
    // 填充 path，供 inspector setProperty 使用
    for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && !Array.isArray(val) && 'type' in val && 'value' in val) {
            val.path = key;
        }
    }
    if (includeComponents) {
        data.__comps__.forEach((comp, index) => {
            comp.path = `__comps__.${index}`;
            if (comp.value && typeof comp.value === 'object' && !Array.isArray(comp.value)) {
                for (const [key, prop] of Object.entries(comp.value)) {
                    if (prop && typeof prop === 'object' && !Array.isArray(prop) && 'type' in prop && 'value' in prop) {
                        prop.path = `__comps__.${index}.${key}`;
                    }
                }
            }
        });
    }
    return data;
}
/**
 * 编码一个场景数据
 * @param scene
 */
function encodeScene(scene) {
    const ctor = scene.constructor;
    const data = {
        path: '/',
        active: encodeObject(scene.active, { default: null, displayName: 'Active' }),
        locked: encodeObject(false, { default: false, displayName: 'Locked' }),
        name: encodeObject(scene.name || ctor.name, { default: null, displayName: 'Name' }),
        uuid: encodeObject(scene.uuid, { default: null, displayName: 'UUID', visible: false }),
        autoReleaseAssets: encodeObject(scene.autoReleaseAssets, { displayName: 'Auto Release Assets', default: false }),
        children: scene.children
            .map((child) => {
            if (!child || child.objFlags & cc.Object.Flags.HideInHierarchy) {
                return;
            }
            return encodeObject(child, {
                ctor: cc.Node,
            });
        })
            .filter((v) => !!v),
        parent: '',
        __type__: utils_1.default.getTypeName(ctor),
        _globals: {},
        isScene: true,
    };
    // 遍历 scene._globals 内所有属性
    if (scene._globals) {
        scene._globals.constructor.__props__.map((key) => {
            const attrs = cc.Class.attr(scene._globals.constructor, key);
            data._globals[key] = encodeObject(scene._globals[key], attrs, scene._globals);
        });
    }
    if (scene['_prefab']?.targetOverrides) {
        data.targetOverrides = encodeTargetOverrides(scene['_prefab'].targetOverrides) ?? undefined;
    }
    // 填充 path，供 inspector setProperty 使用
    for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && !Array.isArray(val) && 'type' in val && 'value' in val) {
            val.path = key;
        }
    }
    for (const [key, val] of Object.entries(data._globals)) {
        if (val && typeof val === 'object' && 'type' in val && 'value' in val) {
            const prop = val;
            prop.path = `_globals.${key}`;
            if (prop.value && typeof prop.value === 'object' && !Array.isArray(prop.value)) {
                for (const [subKey, subProp] of Object.entries(prop.value)) {
                    if (subProp && typeof subProp === 'object' && !Array.isArray(subProp) && 'type' in subProp && 'value' in subProp) {
                        subProp.path = `_globals.${key}.${subKey}`;
                    }
                }
            }
        }
    }
    return data;
}
/**
 * 详细的编码 component
 * @param component
 */
function encodeComponent(component) {
    const ctor = component.constructor;
    const componentAccess = (0, service_access_1.getDumpComponentAccess)();
    // 嵌套预制体中的mountedComponent并不是mounted;需要做区分
    const mountedRootNode = utils_2.prefabUtils.getMountedRoot(component);
    let mountedRoot = mountedRootNode?.uuid;
    if (mountedRootNode) {
        const prefabInfo = mountedRootNode['_prefab'];
        if (prefabInfo && prefabInfo.root) {
            const prefabRootNode = prefabInfo.root['_prefab']?.instance?.prefabRootNode;
            // 判断下是否是嵌套预制体且由父预制体引入到当前场景（避免在预制体编辑模式中误判）
            if (prefabRootNode && prefabRootNode !== core_1.Service.Editor.getRootNode()) {
                mountedRoot = undefined;
            }
        }
    }
    const data = {
        value: {
            uuid: encodeObject(component.uuid, { default: null, visible: false }, component),
            name: encodeObject(component.name, { default: null, visible: false }, component),
            enabled: encodeObject(component.enabled, { default: null, visible: false }, component),
        },
        path: componentAccess.getPathFromUuid(component.uuid) ?? 'unknown',
        default: undefined,
        type: utils_1.default.getTypeName(ctor),
        readonly: false,
        visible: true,
        cid: component.__cid__,
        mountedRoot: mountedRoot,
        component_path: componentAccess.getPathFromUuid(component.uuid) ?? '',
    };
    // 遍历组件内所有属性
    ctor.__props__.forEach((key) => {
        if (!data.value) {
            return;
        }
        try {
            if (key in component) {
                /**
                 * 此处 cc.Class.attr(component, key) 中的 component 不能用 ctor 替代
                 * 因为 ctor 是基类定义，component 是子类，子类的 __attr__ 存了一些自己数据了
                 * 比如 sp.Skeleton 当 skeletonData 属性有数据时取 _animationIndex 属性的 enumList 数据
                 */
                const attrs = cc.Class.attr(component, key);
                const dumpData = encodeObject(component[key], attrs, component, key);
                if (dumpData.type !== 'Unknown') {
                    data.value[key] = dumpData;
                }
                _checkConstructorRewriteType(dumpData, component[key], attrs);
            }
        }
        catch (error) {
            // tslint:disable-next-line:max-line-length
            console.warn(`Component property dump failed:\n  Node: ${component.node.name}(${component.node.uuid})\n Component: ${data.type}(${component.uuid})\n Property: ${key}`);
            console.warn(error);
            delete data.value[key];
        }
    });
    // editor 附加数据
    data.editor = {
        inspector: ctor._inspector || '',
        icon: ctor._icon || '',
        help: i18n_1.default.transI18nName(`${ctor._help}`.replace('i18n:cc', 'i18n:ENGINE.help.cc')) || '',
        _showTick: typeof component.start === 'function' ||
            typeof component.update === 'function' ||
            typeof component.lateUpdate === 'function' ||
            typeof component.onEnable === 'function' ||
            typeof component.onDisable === 'function',
    };
    // __scriptUuid
    if (data.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const scriptType = data.value.__scriptAsset;
        if (component instanceof cc._MissingScript) {
            const compData = component['_$erialized'];
            let uuid = compData && compData['__type__'];
            uuid = uuid && EditorExtends.UuidUtils.decompressUUID(component._$erialized.__type__);
            scriptType.visible = !!(uuid && EditorExtends.UuidUtils.isUUID(uuid));
            scriptType.value = { uuid };
        }
        else {
            scriptType.visible = !!component.__scriptUuid;
            scriptType.value = { uuid: component.__scriptUuid };
        }
        scriptType.displayOrder = -999;
    }
    // 继承链
    if (ctor) {
        data.extends = utils_1.default.getTypeInheritanceChain(ctor);
    }
    // hack: __prefab 不属于标准 IComponent 结构，proxy 层需要用它还原预制体引用关系
    // node的_prefab和component的__prefab不一样，命名方式也不一样，引擎是这样定义的。
    // component的__prefab只有一个属性，所以这里可以直接复制
    data.__compPrefab__ = component.__prefab || null;
    return data;
}
/**
 * 属性（非数组）的现有值类型和所在组件对其定义的类型进行比较，
 * 不一致时需要在 inspector 上显示 reset 按钮
 * @param data
 * @param object
 * @param attributes
 */
function _checkConstructorRewriteType(data, object, attributes) {
    if (object && typeof object === 'object' && !Array.isArray(object) && object.constructor && attributes && attributes.ctor && !(object instanceof attributes.ctor)) {
        data.type = 'Unknown';
    }
}
function _checkFuncAttribute(attributeName, attributes, owner) {
    const attribute = attributes[attributeName];
    if (attribute === undefined)
        return;
    if (typeof attribute === 'function') {
        if (!owner) {
            console.warn(`try to use ${attributeName} function without owner`);
        }
        else {
            const value = attribute.call(owner);
            if (typeof value === 'boolean') {
                return !!value;
            }
            return value;
        }
    }
    else if (typeof attribute === 'boolean') {
        return !!attribute;
    }
    else {
        return attribute;
    }
}
function _checkAttributes(data, attributes, owner) {
    // 处理存在函数写法的属性
    ['visible', 'min', 'max'].forEach((name) => {
        const attributeName = name;
        const value = _checkFuncAttribute(attributeName, attributes, owner);
        if (value !== undefined) {
            data[attributeName] = value;
        }
    });
    if (!attributes.ctor && attributes.type) {
        data.type = '' + attributes.type;
    }
    if ('enumList' in attributes && attributes.type === 'Enum') {
        data.type = 'Enum';
    }
    // 现在跟默认值没关系，明确只有 get 没有 set 的情况下为只读
    if (attributes && attributes.hasGetter && !attributes.hasSetter) {
        data.readonly = true;
    }
    attributeProps.forEach((propName) => {
        // eslint-disable-next-line no-prototype-builtins
        if (attributes.hasOwnProperty(propName)) {
            // @ts-ignore
            data[propName] = attributes[propName];
        }
    });
    // 如果对象类型名以 `cc.` 开始，也就是引擎对象。
    // 则自动按规则组装出要 i18n 的特性（比如显示名和工具提示）的 i18n 路径，作为 Dump 数据。
    //
    // 组装规则如下。对于某个引擎类的某个属性的某个特性，编辑器会按以下的字典路径去查找该特性的 i18n 字符串：
    // `i18n:ENGINE.classes.<类的 cc-class 名称>.properties.<属性的名称>.<特性的名称>`
    //
    if (typeof data.name === 'string' && owner && typeof owner === 'object') {
        const ownerTypeName = findClassName(owner, data.name);
        if (ownerTypeName) {
            for (const autoI18nAttributeName of autoI18nAttributeNames) {
                // 如果该特性已经被声明，比如 `@property({ tooltip: '' })`，跳过组装。
                if (Object.prototype.hasOwnProperty.call(attributes, autoI18nAttributeName)) {
                    continue;
                }
                data[autoI18nAttributeName] = `i18n:ENGINE.classes.${ownerTypeName}.properties.${data.name}.${autoI18nAttributeName}`;
            }
        }
    }
    translateI18nStringsDeep(data);
}
// Engine property attributes are user-defined and their structure is unpredictable.
// For example, @group({ name: 'i18n:...', displayOrder: 0 }) or any custom decorator
// can embed i18n strings at arbitrary nesting levels. Checking only top-level fields
// (displayName / tooltip) would silently miss these. We therefore traverse the entire
// attribute object and translate every string that carries the 'i18n:' prefix.
function translateI18nStringsDeep(obj, depth = 0) {
    if (!obj || typeof obj !== 'object')
        return;
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
/**
 * 查询指定类名，如果自身没有就向上查询
 * @param ccClassObject
 */
const MAX_RECURSION_DEPTH = 10; // 递归中增加最大递归深度限制，避免无限循环或性能问题
const TARGET_CLASS_NAME = ['cc.', 'sp.'];
function findClassName(ccClassObject, property) {
    let depth = 0;
    let proto = ccClassObject;
    while (proto && depth < MAX_RECURSION_DEPTH) {
        const className = cc_1.js.getClassName(proto);
        if (className &&
            TARGET_CLASS_NAME.find(key => className.startsWith(key)) &&
            Object.prototype.hasOwnProperty.call(proto, property)) {
            return className;
        }
        // 通过原型链向上查找
        proto = Object.getPrototypeOf(proto);
        depth++;
    }
    return '';
}
function _encodeByType(type, object, data, opts) {
    type = type || '';
    const dumpType = dump_defines_1.DumpDefines[type];
    if (dumpType) {
        dumpType.encode(object, data, opts);
        return true;
    }
    return false;
}
/**
 * hack：处理 component 的 .objFlags 设置，需要传递给 node
 * 比如 Canvas 的 IsPositionLocked 要传给 node，position.readonly = true
 * 比如 Canvas 的 IsSizeLocked 要传给 UITransform, contentsize = true
 * 暂时处理以下逻辑，后续可增删
 */
function _checkObjFlags(node, data) {
    let IsPositionLocked = false;
    let IsSizeLocked = false;
    let IsAnchorLocked = false;
    let IsScaleLocked = false;
    let IsRotationLocked = false;
    node['_components'].forEach((component) => {
        if (component.objFlags & cc.Object.Flags.IsPositionLocked) {
            IsPositionLocked = true;
        }
        if (component.objFlags & cc.Object.Flags.IsSizeLocked) {
            IsSizeLocked = true;
        }
        if (component.objFlags & cc.Object.Flags.IsAnchorLocked) {
            IsAnchorLocked = true;
        }
        if (component.objFlags & cc.Object.Flags.IsScaleLocked) {
            IsScaleLocked = true;
        }
        if (component.objFlags & cc.Object.Flags.IsRotationLocked) {
            IsRotationLocked = true;
        }
    });
    if (IsPositionLocked) {
        data.position.readonly = true;
    }
    if (IsScaleLocked) {
        data.scale.readonly = true;
    }
    if (IsRotationLocked) {
        data.rotation.readonly = true;
    }
    const uiTransformComponents = [];
    data.__comps__.forEach((comp) => {
        if (comp.cid === 'cc.UITransform') {
            uiTransformComponents.push(comp);
        }
    });
    if (uiTransformComponents.length) {
        if (IsSizeLocked) {
            uiTransformComponents.forEach((comp) => {
                comp.value.contentSize.readonly = true;
            });
        }
        if (IsAnchorLocked) {
            uiTransformComponents.forEach((comp) => {
                comp.value.anchorPoint.readonly = true;
            });
        }
    }
}
/**
 * 编码一个对象
 * @param object 编码对象
 * @param attributes 属性描述
 * @param owner 编码对象所属的对象
 * @param objectKey 输出有效信息，当前数据 key，以便问题排查
 */
function encodeObject(object, attributes, owner = null, objectKey, isTemplate) {
    const ctor = utils_1.default.getConstructor(object, attributes);
    let defValue = utils_1.default.getDefault(attributes);
    // 构造器存在，属性也存在
    if (defValue && typeof defValue === 'object' && defValue.constructor && Array.isArray(defValue.constructor.__props__)) {
        const result = {
            type: utils_1.default.getTypeName(defValue.constructor),
            value: {},
        };
        defValue.constructor.__props__.forEach((key) => {
            const attrs = cc.Class.attr(defValue.constructor, key);
            const dumpData = encodeObject(defValue[key], attrs, defValue, key);
            if (dumpData.type !== 'Unknown') {
                result.value[key] = dumpData;
            }
        });
        defValue = result;
    }
    let type = utils_1.default.getTypeName(ctor);
    if (owner === null) {
        // 默认值如果存在，则比对默认值的 ctor 和当前对象的 ctor 是否一致
        if (attributes.default !== null && attributes.default !== undefined) {
            const defCtor = utils_1.default.getConstructor(attributes.default, attributes);
            const defType = utils_1.default.getTypeName(defCtor);
            if (defType !== type) {
                type = 'Unknown';
            }
        }
    }
    const data = {
        name: objectKey,
        value: null,
        default: defValue,
        type: type,
        path: '',
        readonly: !!attributes.readonly,
        visible: attributes.visible ?? true,
        animatable: attributes.animatable === undefined ? true : !!attributes.animatable, // 如果没有定义默认是 true，否则根据定义取布尔值
    };
    //如果有 userData 就把 userData 传递过去
    if (attributes.userData) {
        data.userData = attributes.userData;
    }
    _checkAttributes(data, attributes, owner);
    if (defValue) {
        if (Array.isArray(defValue)) {
            data.isArray = true;
        }
    }
    if (!data.isArray && Array.isArray(object)) {
        data.isArray = true;
    }
    if (data.isArray) {
        if (!Array.isArray(object) || data.type === 'Array') {
            data.type = 'Unknown';
        }
        else {
            // 子元素的定义
            const childAttribute = Object.assign({}, attributes);
            // 父级数组属性的修饰器定义不适用于 子元素 的定义，需要调整
            childAttribute.visible = true;
            if (childAttribute.readonly && childAttribute.readonly.deep !== undefined) {
                childAttribute.readonly = childAttribute.readonly.deep;
            }
            const propertyDefaultValue = utils_1.default.ccClassAttrPropertyDefaultValue(attributes);
            // 子元素的类型由父级决定，子元素的默认值跟随父级类型的默认值
            childAttribute.default = getElementDefaultValue(attributes, propertyDefaultValue);
            if (!isTemplate) {
                data.elementTypeData = encodeObject(childAttribute.default, childAttribute, propertyDefaultValue, undefined, true);
            }
            const resultValue = [];
            // 未避免有可能出现的内部数据有空，需要用普通的 for 循环，不要使用 forEach\map 等来遍历
            for (let i = 0; i < object.length; i++) {
                const item = object[i];
                if (item && item.constructor) {
                    childAttribute.ctor = item && item.constructor; // 处理子级的类是继承父级类的情况
                }
                const result = encodeObject(item, childAttribute, owner);
                if (result.type !== 'Unknown') {
                    resultValue.push(result);
                }
                else {
                    resultValue.push(data.elementTypeData);
                }
            }
            data.value = resultValue;
        }
    }
    else {
        const opts = {};
        opts.ctor = ctor;
        if (_encodeByType(data.type, object, data, opts)) {
            // empty
        }
        else if (ArrayBuffer.isView(object)) {
            _encodeByType('TypedArray', object, data, opts);
        }
        else if (cc.js.isChildClassOf(ctor, cc.ValueType)) {
            _encodeByType('cc.ValueType', object, data, opts);
        }
        else if (cc.js.isChildClassOf(ctor, cc.Node)) {
            // 如果是节点、资源、组件，则生成链接到对象的 uuid
            _encodeByType('cc.Node', object, data, opts);
        }
        else if (cc.js.isChildClassOf(ctor, cc.Component)) {
            _encodeByType('cc.Component', object, data, opts);
        }
        else if (cc.js.isChildClassOf(ctor, cc.Asset)) {
            _encodeByType('cc.Asset', object, data, opts);
        }
        else if (ctor && ctor.__props__) {
            // 如果构造器存在，且带有 __props__，则开始递归序列化内部属性
            if (object) {
                // 构造器存在，属性也存在
                const result = {};
                ctor.__props__.forEach((key) => {
                    const attrs = cc.Class.attr(object, key); // object 是实例，可能有自定义的 attrs
                    if (attributes.readonly && attributes.readonly.deep) {
                        attrs.readonly = { deep: true };
                    }
                    const dumpData = encodeObject(object[key], attrs, object, key);
                    if (dumpData.type !== 'Unknown') {
                        result[key] = dumpData;
                    }
                    _checkConstructorRewriteType(dumpData, object[key], attrs);
                });
                data.value = result;
            }
            else {
                // 构造器存在，但是属性不存在，无法继续递归序列化内部属性
                data.value = null;
            }
        }
        else {
            // 上述判断都无法适用的情况下, 直接将 object 赋值给 value
            if (data.type !== 'Unknown') {
                data.value = object;
            }
        }
    }
    // 继承链
    if (ctor) {
        data.extends = utils_1.default.getTypeInheritanceChain(ctor);
    }
    return data;
}
function getElementDefaultValue(parentAttrs, parentInitializer) {
    if (parentAttrs.type) {
        return utils_1.default.ccClassAttrPropertyDefaultValue(parentAttrs);
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
    }
    return null;
}
function encodeTargetOverrides(targetOverrides) {
    if (!targetOverrides || targetOverrides.length <= 0) {
        return null;
    }
    const dumpedTargetOverrides = [];
    targetOverrides.forEach((itr) => {
        if (!itr.source || !itr.target) {
            return;
        }
        const dumpOverride = {
            source: itr.source.uuid,
            sourceInfo: itr.sourceInfo ? itr.sourceInfo.localID : undefined,
            propertyPath: itr.propertyPath,
            target: itr.target.uuid,
            targetInfo: itr.targetInfo ? itr.targetInfo.localID : undefined,
        };
        dumpedTargetOverrides.push(dumpOverride);
    });
    return dumpedTargetOverrides;
}
// export * as default from './encode';
exports.default = {
    encodeNode,
    encodeScene,
    encodeComponent,
    encodeObject,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2R1bXAvZW5jb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFxQ2Isb0NBa0JDO0FBVUQsZ0NBdUpDO0FBTUQsa0NBNERDO0FBTUQsMENBdUdDO0FBb09ELG9DQTBKQztBQWh3QkQsb0RBQStCO0FBQy9CLHFEQUEwRDtBQUUxRCxpREFBNkM7QUFHN0MsNkNBQWdEO0FBQ2hELG9DQUFvQztBQUNwQywyQkFBK0Q7QUFDL0Qsc0RBQThCO0FBRTlCLE1BQU0sY0FBYyxHQUFHO0lBQ25CLFVBQVU7SUFDVixZQUFZO0lBQ1osYUFBYTtJQUNiLGFBQWE7SUFDYixPQUFPO0lBQ1AsV0FBVztJQUNYLE1BQU07SUFDTixPQUFPO0lBQ1AsU0FBUztJQUNULFlBQVk7SUFDWixNQUFNO0lBQ04sUUFBUTtJQUNSLGNBQWM7Q0FDakIsQ0FBQztBQUVGLE1BQU0sc0JBQXNCLEdBQUc7SUFDM0IsYUFBYTtJQUNiLFNBQVM7Q0FDSCxDQUFDO0FBRVgsU0FBZ0IsWUFBWSxDQUFDLElBQVU7SUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztJQUNsQyxNQUFNLGVBQWUsR0FBRyxtQkFBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDdEMsTUFBTSxNQUFNLEdBQVk7UUFDcEIsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7UUFDbEUsTUFBTSxFQUFFLElBQUksQ0FBQyxT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ZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQXFDLEVBQUUsRUFBRTtRQUM5RCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM3QixPQUFPO1FBQ1gsQ0FBQztRQUNELE1BQU0sWUFBWSxHQUFHO1lBQ2pCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUk7WUFDdkIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQy9ELFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWTtZQUM5QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJO1lBQ3ZCLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztTQUNsRSxDQUFDO1FBRUYscUJBQXFCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUNqQyxDQUFDO0FBRUQsdUNBQXVDO0FBQ3ZDLGtCQUFlO0lBQ1gsVUFBVTtJQUNWLFdBQVc7SUFDWCxlQUFlO0lBQ2YsWUFBWTtDQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmRlY2xhcmUgY29uc3QgY2M6IGFueTtcbmRlY2xhcmUgY29uc3QgRWRpdG9yRXh0ZW5kczogYW55O1xuXG5pbXBvcnQgZHVtcFV0aWwgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBnZXREdW1wQ29tcG9uZW50QWNjZXNzIH0gZnJvbSAnLi9zZXJ2aWNlLWFjY2Vzcyc7XG5cbmltcG9ydCB7IER1bXBEZWZpbmVzIH0gZnJvbSAnLi9kdW1wLWRlZmluZXMnO1xuaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgeyBJQ29tcG9uZW50LCBJTm9kZSwgSVByZWZhYiwgSVNjZW5lLCBJVGFyZ2V0T3ZlcnJpZGVJbmZvIH0gZnJvbSAnLi4vLi4vLi4vY29tbW9uJztcbmltcG9ydCB7IHByZWZhYlV0aWxzIH0gZnJvbSAnLi8uLi9wcmVmYWIvdXRpbHMnO1xuaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4vLi4vY29yZSc7XG5pbXBvcnQgeyBNb2JpbGl0eU1vZGUsIE5vZGUsIFByZWZhYiwgQ29tcG9uZW50LCBqcyB9IGZyb20gJ2NjJztcbmltcG9ydCBpMThuIGZyb20gJy4uLy4uL2kxOG4nO1xuXG5jb25zdCBhdHRyaWJ1dGVQcm9wcyA9IFtcbiAgICAnZW51bUxpc3QnLFxuICAgICdyYWRpb0dyb3VwJyxcbiAgICAnYml0bWFza0xpc3QnLFxuICAgICdkaXNwbGF5TmFtZScsXG4gICAgJ2dyb3VwJyxcbiAgICAnbXVsdGlsaW5lJyxcbiAgICAnc3RlcCcsXG4gICAgJ3NsaWRlJyxcbiAgICAndG9vbHRpcCcsXG4gICAgJ2FuaW1hdGFibGUnLFxuICAgICd1bml0JyxcbiAgICAncmFkaWFuJyxcbiAgICAnZGlzcGxheU9yZGVyJyxcbl07XG5cbmNvbnN0IGF1dG9JMThuQXR0cmlidXRlTmFtZXMgPSBbXG4gICAgJ2Rpc3BsYXlOYW1lJyxcbiAgICAndG9vbHRpcCcsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJlZmFiKG5vZGU6IE5vZGUpOiBJUHJlZmFiIHwgbnVsbCB7XG4gICAgaWYgKCFub2RlWydfcHJlZmFiJ10pIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHByZWZhYlN0YXRlSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYlN0YXRlSW5mbyhub2RlKTtcbiAgICBjb25zdCByb290Tm9kZSA9IG5vZGVbJ19wcmVmYWInXS5yb290O1xuICAgIGNvbnN0IHJlc3VsdDogSVByZWZhYiA9IHtcbiAgICAgICAgdXVpZDogKG5vZGVbJ19wcmVmYWInXS5hc3NldCAmJiBub2RlWydfcHJlZmFiJ10uYXNzZXQuX3V1aWQpIHx8ICcnLFxuICAgICAgICBmaWxlSWQ6IG5vZGVbJ19wcmVmYWInXS5maWxlSWQsXG4gICAgICAgIHJvb3RVdWlkOiByb290Tm9kZT8udXVpZCB8fCAnJyxcbiAgICAgICAgc3luYzogdHJ1ZSxcbiAgICAgICAgcHJlZmFiU3RhdGVJbmZvLFxuICAgIH07XG4gICAgaWYgKG5vZGVbJ19wcmVmYWInXS50YXJnZXRPdmVycmlkZXMpIHtcbiAgICAgICAgcmVzdWx0LnRhcmdldE92ZXJyaWRlcyA9IGVuY29kZVRhcmdldE92ZXJyaWRlcyhub2RlWydfcHJlZmFiJ10udGFyZ2V0T3ZlcnJpZGVzKSA/PyB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChub2RlWydfcHJlZmFiJ10uaW5zdGFuY2UpIHtcbiAgICAgICAgcmVzdWx0Lmluc3RhbmNlID0gZW5jb2RlT2JqZWN0KG5vZGVbJ19wcmVmYWInXS5pbnN0YW5jZSwgeyBkZWZhdWx0OiBudWxsIH0sIG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5pbnRlcmZhY2UgSUVuY29kZU5vZGVPcHRpb25zIHtcbiAgICBpbmNsdWRlQ29tcG9uZW50cz86IGJvb2xlYW47XG59XG5cbi8qKlxuICog57yW56CB5LiA5LiqIG5vZGUg5pWw5o2uXG4gKiBAcGFyYW0gbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlTm9kZShub2RlOiBOb2RlLCBvcHRpb25zOiBJRW5jb2RlTm9kZU9wdGlvbnMgPSB7fSk6IElOb2RlIHtcbiAgICBjb25zdCBpbmNsdWRlQ29tcG9uZW50cyA9IG9wdGlvbnMuaW5jbHVkZUNvbXBvbmVudHMgIT09IGZhbHNlO1xuICAgIGNvbnN0IGN0b3IgPSBub2RlLmNvbnN0cnVjdG9yO1xuXG4gICAgY29uc3QgTGF5ZXJzRW51bUxpc3QgPSBPYmplY3Qua2V5cyhjYy5MYXllcnMuRW51bSkubWFwKChrZXksIGluZGV4KSA9PiB7XG4gICAgICAgIHJldHVybiB7IG5hbWU6IGtleSwgdmFsdWU6IGNjLkxheWVycy5FbnVtW2tleV0gfTtcbiAgICB9KTtcbiAgICBMYXllcnNFbnVtTGlzdC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiBhLnZhbHVlIC0gYi52YWx1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IE1vYmlsaXR5TW9kZUVudW1MaXN0ID0gT2JqZWN0LmtleXMoTW9iaWxpdHlNb2RlKS5tYXAoKGtleSwgaW5kZXgpID0+IHtcbiAgICAgICAgcmV0dXJuIHsgbmFtZToga2V5LCB2YWx1ZTogTW9iaWxpdHlNb2RlW2tleSBhcyBrZXlvZiB0eXBlb2YgTW9iaWxpdHlNb2RlXSB9O1xuICAgIH0pO1xuXG4gICAgLy8gRklYTUXvvJrlkI7nu63pnIDopoHpgb/lhY3nm7TmjqXorr/pl67np4HmnInlrZfmrrXjgIJcbiAgICAvLyBUT0RP77ya6L+Z6YeM55qE6ZyA6KaB55+l6YGT5b2T5YmN5Zy65pmv5pivIDJEIOi/mOaYryAzRFxuICAgIC8vY29uc3QgaXMyRFByb2plY3QgPSBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyWydfcHJvamVjdFR5cGUnXSA9PT0gJzJkJztcbiAgICBjb25zdCBpczJEUHJvamVjdCA9IGZhbHNlO1xuXG4gICAgY29uc3QgZGF0YTogSU5vZGUgPSB7XG4gICAgICAgIHBhdGg6IEVkaXRvckV4dGVuZHMuTm9kZS5nZXROb2RlUGF0aChub2RlKSxcbiAgICAgICAgYWN0aXZlOiBlbmNvZGVPYmplY3Qobm9kZS5hY3RpdmUsIHsgZGlzcGxheU5hbWU6ICdBY3RpdmUnLCBkZWZhdWx0OiBudWxsICwgdmlzaWJsZTogZmFsc2UgfSwgbm9kZSksXG4gICAgICAgIGxvY2tlZDogZW5jb2RlT2JqZWN0KEJvb2xlYW4obm9kZS5vYmpGbGFncyAmIGNjLk9iamVjdC5GbGFncy5Mb2NrZWRJbkVkaXRvciksIHsgZGlzcGxheU5hbWU6ICdMb2NrZWQnLCBkZWZhdWx0OiBmYWxzZSwgYW5pbWF0YWJsZTogZmFsc2UsIHZpc2libGU6IGZhbHNlIH0sIG5vZGUpLFxuICAgICAgICBuYW1lOiBlbmNvZGVPYmplY3Qobm9kZS5uYW1lLCB7IGRpc3BsYXlOYW1lOiAnTmFtZScsIGRlZmF1bHQ6IG51bGwsIGFuaW1hdGFibGU6IGZhbHNlIH0sIG5vZGUpLFxuICAgICAgICBwb3NpdGlvbjogZW5jb2RlT2JqZWN0KFxuICAgICAgICAgICAgbm9kZS5wb3NpdGlvbixcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogJ2kxOG46c2NlbmUuY2MuTm9kZS5wcm9wZXJ0aWVzLnBvc2l0aW9uLmRpc3BsYXlOYW1lJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBuZXcgY2MubWF0aC5WZWMzKCksXG4gICAgICAgICAgICAgICAgdG9vbHRpcDogJ2kxOG46c2NlbmUuY2MuTm9kZS5wcm9wZXJ0aWVzLnBvc2l0aW9uLnRvb2x0aXAnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICApLFxuICAgICAgICByb3RhdGlvbjogZW5jb2RlT2JqZWN0KFxuICAgICAgICAgICAgbm9kZS5ldWxlckFuZ2xlcyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZXVsZXJBbmdsZXMnLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiAnaTE4bjpzY2VuZS5jYy5Ob2RlLnByb3BlcnRpZXMuZXVsZXJBbmdsZXMuZGlzcGxheU5hbWUnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IG5ldyBjYy5tYXRoLlZlYzMoKSxcbiAgICAgICAgICAgICAgICB0b29sdGlwOiBgaTE4bjpzY2VuZS5jYy5Ob2RlLnByb3BlcnRpZXMuZXVsZXJBbmdsZXMuJHtpczJEUHJvamVjdCA/ICd0b29sdGlwMkQnIDogJ3Rvb2x0aXAzRCd9YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgaXMyRFByb2plY3QgPyAnYW5nbGUnIDogJ2V1bGVyQW5nbGVzJyxcbiAgICAgICAgKSxcbiAgICAgICAgc2NhbGU6IGVuY29kZU9iamVjdChcbiAgICAgICAgICAgIG5vZGUuc2NhbGUsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6ICdpMThuOnNjZW5lLmNjLk5vZGUucHJvcGVydGllcy5zY2FsZS5kaXNwbGF5TmFtZScsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogbmV3IGNjLm1hdGguVmVjMygxLCAxLCAxKSxcbiAgICAgICAgICAgICAgICB0b29sdGlwOiAnaTE4bjpzY2VuZS5jYy5Ob2RlLnByb3BlcnRpZXMuc2NhbGUudG9vbHRpcCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICdzY2FsZScsXG4gICAgICAgICksXG4gICAgICAgIG1vYmlsaXR5OiBlbmNvZGVPYmplY3QoXG4gICAgICAgICAgICBub2RlLm1vYmlsaXR5LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiAnaTE4bjpzY2VuZS5jYy5Ob2RlLnByb3BlcnRpZXMubW9iaWxpdHkuZGlzcGxheU5hbWUnLFxuICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdpMThuOnNjZW5lLmNjLk5vZGUucHJvcGVydGllcy5tb2JpbGl0eS50b29sdGlwJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdFbnVtJyxcbiAgICAgICAgICAgICAgICBlbnVtTGlzdDogTW9iaWxpdHlNb2RlRW51bUxpc3QsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICdtb2JpbGl0eScsXG4gICAgICAgICksXG4gICAgICAgIGxheWVyOiBlbmNvZGVPYmplY3QoXG4gICAgICAgICAgICBub2RlLmxheWVyLCB7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6ICdpMThuOnNjZW5lLmNjLk5vZGUucHJvcGVydGllcy5sYXllci5kaXNwbGF5TmFtZScsXG4gICAgICAgICAgICAgICAgdG9vbHRpcDogJ2kxOG46c2NlbmUuY2MuTm9kZS5wcm9wZXJ0aWVzLmxheWVyLnRvb2x0aXAnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDEwNzM3NDE4MjQsXG4gICAgICAgICAgICAgICAgdHlwZTogJ0VudW0nLFxuICAgICAgICAgICAgICAgIGVudW1MaXN0OiBMYXllcnNFbnVtTGlzdCxcbiAgICAgICAgICAgICAgICByZWFkb25seTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYW5pbWF0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICdsYXllcicsXG4gICAgICAgICksXG4gICAgICAgIHV1aWQ6IGVuY29kZU9iamVjdChub2RlLnV1aWQsIHsgZGlzcGxheU5hbWU6ICdVVUlEJywgZGVmYXVsdDogbnVsbCwgYW5pbWF0YWJsZTogZmFsc2UgfSwgbm9kZSksXG5cbiAgICAgICAgcGFyZW50OiBlbmNvZGVPYmplY3QoXG4gICAgICAgICAgICBub2RlLnBhcmVudCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjdG9yOiBjYy5Ob2RlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICksXG5cbiAgICAgICAgY2hpbGRyZW46IG5vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgIC5tYXAoKGNoaWxkOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWNoaWxkIHx8IGNoaWxkLm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZU9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0b3I6IGNjLk5vZGUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKCh2KTogdiBpcyBJUHJvcGVydHkgPT4gISF2KSxcblxuICAgICAgICBfX3R5cGVfXzogZHVtcFV0aWwuZ2V0VHlwZU5hbWUoY3RvciksXG4gICAgICAgIF9fY29tcHNfXzogaW5jbHVkZUNvbXBvbmVudHNcbiAgICAgICAgICAgID8gbm9kZVsnX2NvbXBvbmVudHMnXS5tYXAoKGNvbXA6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbmNvZGVDb21wb25lbnQoY29tcCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiBbXSxcblxuICAgICAgICBtb3VudGVkUm9vdDogcHJlZmFiVXRpbHMuZ2V0TW91bnRlZFJvb3Qobm9kZSk/LnV1aWQsXG4gICAgfTtcblxuICAgIGlmIChub2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgZGF0YS5fX3ByZWZhYl9fID0gZW5jb2RlUHJlZmFiKG5vZGUpITtcblxuICAgICAgICBjb25zdCByZW1vdmVkQ29tcG9uZW50cyA9IHByZWZhYlV0aWxzLmdldFJlbW92ZWRDb21wb25lbnRzKG5vZGUpO1xuICAgICAgICBpZiAocmVtb3ZlZENvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZGF0YS5yZW1vdmVkQ29tcG9uZW50cyA9IHJlbW92ZWRDb21wb25lbnRzLm1hcCgoY29tcDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbmFtZToganMuZ2V0Q2xhc3NOYW1lKGNvbXApLCBmaWxlSUQ6IGNvbXAuX19wcmVmYWIhLmZpbGVJZCB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDmoLnmja4gZmxhZyDosIPmlbQgcmVhZG9ubHnjgIJcbiAgICBfY2hlY2tPYmpGbGFncyhub2RlLCBkYXRhKTtcblxuICAgIC8vIOWhq+WFhSBwYXRo77yM5L6bIGluc3BlY3RvciBzZXRQcm9wZXJ0eSDkvb/nlKhcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGF0YSkpIHtcbiAgICAgICAgaWYgKHZhbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWwpICYmICd0eXBlJyBpbiB2YWwgJiYgJ3ZhbHVlJyBpbiB2YWwpIHtcbiAgICAgICAgICAgICh2YWwgYXMgSVByb3BlcnR5KS5wYXRoID0ga2V5O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cykge1xuICAgICAgICBkYXRhLl9fY29tcHNfXy5mb3JFYWNoKChjb21wLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29tcC5wYXRoID0gYF9fY29tcHNfXy4ke2luZGV4fWA7XG4gICAgICAgICAgICBpZiAoY29tcC52YWx1ZSAmJiB0eXBlb2YgY29tcC52YWx1ZSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoY29tcC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHByb3BdIG9mIE9iamVjdC5lbnRyaWVzKGNvbXAudmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wICYmIHR5cGVvZiBwcm9wID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShwcm9wKSAmJiAndHlwZScgaW4gcHJvcCAmJiAndmFsdWUnIGluIHByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wIGFzIElQcm9wZXJ0eSkucGF0aCA9IGBfX2NvbXBzX18uJHtpbmRleH0uJHtrZXl9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG59XG5cbi8qKlxuICog57yW56CB5LiA5Liq5Zy65pmv5pWw5o2uXG4gKiBAcGFyYW0gc2NlbmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVNjZW5lKHNjZW5lOiBhbnkpOiBJU2NlbmUge1xuICAgIGNvbnN0IGN0b3IgPSBzY2VuZS5jb25zdHJ1Y3RvcjtcblxuICAgIGNvbnN0IGRhdGE6IElTY2VuZSA9IHtcbiAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICBhY3RpdmU6IGVuY29kZU9iamVjdChzY2VuZS5hY3RpdmUsIHsgZGVmYXVsdDogbnVsbCwgZGlzcGxheU5hbWU6ICdBY3RpdmUnIH0pLFxuICAgICAgICBsb2NrZWQ6IGVuY29kZU9iamVjdChmYWxzZSwgeyBkZWZhdWx0OiBmYWxzZSwgZGlzcGxheU5hbWU6ICdMb2NrZWQnIH0pLFxuICAgICAgICBuYW1lOiBlbmNvZGVPYmplY3Qoc2NlbmUubmFtZSB8fCBjdG9yLm5hbWUsIHsgZGVmYXVsdDogbnVsbCwgZGlzcGxheU5hbWU6ICdOYW1lJyB9KSxcbiAgICAgICAgdXVpZDogZW5jb2RlT2JqZWN0KHNjZW5lLnV1aWQsIHsgZGVmYXVsdDogbnVsbCwgZGlzcGxheU5hbWU6ICdVVUlEJywgdmlzaWJsZTogZmFsc2UgfSksXG4gICAgICAgIGF1dG9SZWxlYXNlQXNzZXRzOiBlbmNvZGVPYmplY3Qoc2NlbmUuYXV0b1JlbGVhc2VBc3NldHMsIHsgZGlzcGxheU5hbWU6ICdBdXRvIFJlbGVhc2UgQXNzZXRzJywgZGVmYXVsdDogZmFsc2UgfSksXG4gICAgICAgIGNoaWxkcmVuOiBzY2VuZS5jaGlsZHJlblxuICAgICAgICAgICAgLm1hcCgoY2hpbGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghY2hpbGQgfHwgY2hpbGQub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuSGlkZUluSGllcmFyY2h5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZW5jb2RlT2JqZWN0KGNoaWxkLCB7XG4gICAgICAgICAgICAgICAgICAgIGN0b3I6IGNjLk5vZGUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcigodjogYW55KTogdiBpcyBJUHJvcGVydHkgPT4gISF2KSxcbiAgICAgICAgcGFyZW50OiAnJyxcbiAgICAgICAgX190eXBlX186IGR1bXBVdGlsLmdldFR5cGVOYW1lKGN0b3IpLFxuICAgICAgICBfZ2xvYmFsczoge30sXG4gICAgICAgIGlzU2NlbmU6IHRydWUsXG4gICAgfTtcblxuICAgIC8vIOmBjeWOhiBzY2VuZS5fZ2xvYmFscyDlhoXmiYDmnInlsZ7mgKdcbiAgICBpZiAoc2NlbmUuX2dsb2JhbHMpIHtcbiAgICAgICAgc2NlbmUuX2dsb2JhbHMuY29uc3RydWN0b3IuX19wcm9wc19fLm1hcCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJzID0gY2MuQ2xhc3MuYXR0cihzY2VuZS5fZ2xvYmFscy5jb25zdHJ1Y3Rvciwga2V5KTtcbiAgICAgICAgICAgIGRhdGEuX2dsb2JhbHNba2V5XSA9IGVuY29kZU9iamVjdChzY2VuZS5fZ2xvYmFsc1trZXldLCBhdHRycywgc2NlbmUuX2dsb2JhbHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoc2NlbmVbJ19wcmVmYWInXT8udGFyZ2V0T3ZlcnJpZGVzKSB7XG4gICAgICAgIGRhdGEudGFyZ2V0T3ZlcnJpZGVzID0gZW5jb2RlVGFyZ2V0T3ZlcnJpZGVzKHNjZW5lWydfcHJlZmFiJ10udGFyZ2V0T3ZlcnJpZGVzKSA/PyB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8g5aGr5YWFIHBhdGjvvIzkvpsgaW5zcGVjdG9yIHNldFByb3BlcnR5IOS9v+eUqFxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsXSBvZiBPYmplY3QuZW50cmllcyhkYXRhKSkge1xuICAgICAgICBpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbCkgJiYgJ3R5cGUnIGluIHZhbCAmJiAndmFsdWUnIGluIHZhbCkge1xuICAgICAgICAgICAgKHZhbCBhcyBJUHJvcGVydHkpLnBhdGggPSBrZXk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKGRhdGEuX2dsb2JhbHMpKSB7XG4gICAgICAgIGlmICh2YWwgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgJiYgJ3R5cGUnIGluIHZhbCAmJiAndmFsdWUnIGluIHZhbCkge1xuICAgICAgICAgICAgY29uc3QgcHJvcCA9IHZhbCBhcyBJUHJvcGVydHk7XG4gICAgICAgICAgICBwcm9wLnBhdGggPSBgX2dsb2JhbHMuJHtrZXl9YDtcbiAgICAgICAgICAgIGlmIChwcm9wLnZhbHVlICYmIHR5cGVvZiBwcm9wLnZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShwcm9wLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW3N1YktleSwgc3ViUHJvcF0gb2YgT2JqZWN0LmVudHJpZXMocHJvcC52YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YlByb3AgJiYgdHlwZW9mIHN1YlByb3AgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHN1YlByb3ApICYmICd0eXBlJyBpbiBzdWJQcm9wICYmICd2YWx1ZScgaW4gc3ViUHJvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgKHN1YlByb3AgYXMgSVByb3BlcnR5KS5wYXRoID0gYF9nbG9iYWxzLiR7a2V5fS4ke3N1YktleX1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG59XG5cbi8qKlxuICog6K+m57uG55qE57yW56CBIGNvbXBvbmVudFxuICogQHBhcmFtIGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlQ29tcG9uZW50KGNvbXBvbmVudDogYW55KTogSUNvbXBvbmVudCB7XG4gICAgY29uc3QgY3RvciA9IGNvbXBvbmVudC5jb25zdHJ1Y3RvcjtcbiAgICBjb25zdCBjb21wb25lbnRBY2Nlc3MgPSBnZXREdW1wQ29tcG9uZW50QWNjZXNzKCk7XG4gICAgLy8g5bWM5aWX6aKE5Yi25L2T5Lit55qEbW91bnRlZENvbXBvbmVudOW5tuS4jeaYr21vdW50ZWQ76ZyA6KaB5YGa5Yy65YiGXG4gICAgY29uc3QgbW91bnRlZFJvb3ROb2RlID0gcHJlZmFiVXRpbHMuZ2V0TW91bnRlZFJvb3QoY29tcG9uZW50KTtcbiAgICBsZXQgbW91bnRlZFJvb3Q6IHN0cmluZyB8IHVuZGVmaW5lZCA9IG1vdW50ZWRSb290Tm9kZT8udXVpZDtcbiAgICBpZiAobW91bnRlZFJvb3ROb2RlKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBtb3VudGVkUm9vdE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKHByZWZhYkluZm8gJiYgcHJlZmFiSW5mby5yb290KSB7XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJSb290Tm9kZSA9IHByZWZhYkluZm8ucm9vdFsnX3ByZWZhYiddPy5pbnN0YW5jZT8ucHJlZmFiUm9vdE5vZGU7XG4gICAgICAgICAgICAvLyDliKTmlq3kuIvmmK/lkKbmmK/ltYzlpZfpooTliLbkvZPkuJTnlLHniLbpooTliLbkvZPlvJXlhaXliLDlvZPliY3lnLrmma/vvIjpgb/lhY3lnKjpooTliLbkvZPnvJbovpHmqKHlvI/kuK3or6/liKTvvIlcbiAgICAgICAgICAgIGlmIChwcmVmYWJSb290Tm9kZSAmJiBwcmVmYWJSb290Tm9kZSAhPT0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKSkge1xuICAgICAgICAgICAgICAgIG1vdW50ZWRSb290ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGRhdGE6IElDb21wb25lbnQgPSB7XG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICB1dWlkOiBlbmNvZGVPYmplY3QoY29tcG9uZW50LnV1aWQsIHsgZGVmYXVsdDogbnVsbCwgdmlzaWJsZTogZmFsc2UgfSwgY29tcG9uZW50KSxcbiAgICAgICAgICAgIG5hbWU6IGVuY29kZU9iamVjdChjb21wb25lbnQubmFtZSwgeyBkZWZhdWx0OiBudWxsLCB2aXNpYmxlOiBmYWxzZSB9LCBjb21wb25lbnQpLFxuICAgICAgICAgICAgZW5hYmxlZDogZW5jb2RlT2JqZWN0KGNvbXBvbmVudC5lbmFibGVkLCB7IGRlZmF1bHQ6IG51bGwsIHZpc2libGU6IGZhbHNlIH0sIGNvbXBvbmVudCksXG4gICAgICAgIH0sXG4gICAgICAgIHBhdGg6IGNvbXBvbmVudEFjY2Vzcy5nZXRQYXRoRnJvbVV1aWQoY29tcG9uZW50LnV1aWQpID8/ICd1bmtub3duJyxcbiAgICAgICAgZGVmYXVsdDogdW5kZWZpbmVkLFxuICAgICAgICB0eXBlOiBkdW1wVXRpbC5nZXRUeXBlTmFtZShjdG9yKSxcbiAgICAgICAgcmVhZG9ubHk6IGZhbHNlLFxuICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICBjaWQ6IGNvbXBvbmVudC5fX2NpZF9fLFxuXG4gICAgICAgIG1vdW50ZWRSb290OiBtb3VudGVkUm9vdCxcbiAgICAgICAgY29tcG9uZW50X3BhdGg6IGNvbXBvbmVudEFjY2Vzcy5nZXRQYXRoRnJvbVV1aWQoY29tcG9uZW50LnV1aWQpID8/ICcnLFxuICAgIH07XG5cbiAgICAvLyDpgY3ljobnu4Tku7blhoXmiYDmnInlsZ7mgKdcbiAgICBjdG9yLl9fcHJvcHNfXy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoIWRhdGEudmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoa2V5IGluIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIOatpOWkhCBjYy5DbGFzcy5hdHRyKGNvbXBvbmVudCwga2V5KSDkuK3nmoQgY29tcG9uZW50IOS4jeiDveeUqCBjdG9yIOabv+S7o1xuICAgICAgICAgICAgICAgICAqIOWboOS4uiBjdG9yIOaYr+Wfuuexu+WumuS5ie+8jGNvbXBvbmVudCDmmK/lrZDnsbvvvIzlrZDnsbvnmoQgX19hdHRyX18g5a2Y5LqG5LiA5Lqb6Ieq5bex5pWw5o2u5LqGXG4gICAgICAgICAgICAgICAgICog5q+U5aaCIHNwLlNrZWxldG9uIOW9kyBza2VsZXRvbkRhdGEg5bGe5oCn5pyJ5pWw5o2u5pe25Y+WIF9hbmltYXRpb25JbmRleCDlsZ7mgKfnmoQgZW51bUxpc3Qg5pWw5o2uICBcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBjb25zdCBhdHRycyA9IGNjLkNsYXNzLmF0dHIoY29tcG9uZW50LCBrZXkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXBEYXRhID0gZW5jb2RlT2JqZWN0KGNvbXBvbmVudFtrZXldLCBhdHRycywgY29tcG9uZW50LCBrZXkpO1xuICAgICAgICAgICAgICAgIGlmIChkdW1wRGF0YS50eXBlICE9PSAnVW5rbm93bicpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YWx1ZVtrZXldID0gZHVtcERhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9jaGVja0NvbnN0cnVjdG9yUmV3cml0ZVR5cGUoZHVtcERhdGEsIGNvbXBvbmVudFtrZXldLCBhdHRycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWxpbmUtbGVuZ3RoXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgYENvbXBvbmVudCBwcm9wZXJ0eSBkdW1wIGZhaWxlZDpcXG4gIE5vZGU6ICR7Y29tcG9uZW50Lm5vZGUubmFtZX0oJHtjb21wb25lbnQubm9kZS51dWlkfSlcXG4gQ29tcG9uZW50OiAke2RhdGEudHlwZX0oJHtjb21wb25lbnQudXVpZH0pXFxuIFByb3BlcnR5OiAke2tleX1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG4gICAgICAgICAgICBkZWxldGUgZGF0YS52YWx1ZVtrZXldO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBlZGl0b3Ig6ZmE5Yqg5pWw5o2uXG4gICAgZGF0YS5lZGl0b3IgPSB7XG4gICAgICAgIGluc3BlY3RvcjogY3Rvci5faW5zcGVjdG9yIHx8ICcnLFxuICAgICAgICBpY29uOiBjdG9yLl9pY29uIHx8ICcnLFxuICAgICAgICBoZWxwOiBpMThuLnRyYW5zSTE4bk5hbWUoYCR7Y3Rvci5faGVscH1gLnJlcGxhY2UoJ2kxOG46Y2MnLCAnaTE4bjpFTkdJTkUuaGVscC5jYycpKSB8fCAnJyxcbiAgICAgICAgX3Nob3dUaWNrOlxuICAgICAgICAgICAgdHlwZW9mIGNvbXBvbmVudC5zdGFydCA9PT0gJ2Z1bmN0aW9uJyB8fFxuICAgICAgICAgICAgdHlwZW9mIGNvbXBvbmVudC51cGRhdGUgPT09ICdmdW5jdGlvbicgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjb21wb25lbnQubGF0ZVVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJyB8fFxuICAgICAgICAgICAgdHlwZW9mIGNvbXBvbmVudC5vbkVuYWJsZSA9PT0gJ2Z1bmN0aW9uJyB8fFxuICAgICAgICAgICAgdHlwZW9mIGNvbXBvbmVudC5vbkRpc2FibGUgPT09ICdmdW5jdGlvbicsXG4gICAgfTtcblxuICAgIC8vIF9fc2NyaXB0VXVpZFxuICAgIGlmIChkYXRhLnZhbHVlICYmIHR5cGVvZiBkYXRhLnZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShkYXRhLnZhbHVlKSkge1xuICAgICAgICBjb25zdCBzY3JpcHRUeXBlOiBhbnkgPSAoZGF0YS52YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+KS5fX3NjcmlwdEFzc2V0O1xuICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgY2MuX01pc3NpbmdTY3JpcHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBEYXRhID0gY29tcG9uZW50WydfJGVyaWFsaXplZCddO1xuICAgICAgICAgICAgbGV0IHV1aWQgPSBjb21wRGF0YSAmJiBjb21wRGF0YVsnX190eXBlX18nXTtcbiAgICAgICAgICAgIHV1aWQgPSB1dWlkICYmIEVkaXRvckV4dGVuZHMuVXVpZFV0aWxzLmRlY29tcHJlc3NVVUlEKGNvbXBvbmVudC5fJGVyaWFsaXplZC5fX3R5cGVfXyk7XG4gICAgICAgICAgICBzY3JpcHRUeXBlLnZpc2libGUgPSAhISh1dWlkICYmIEVkaXRvckV4dGVuZHMuVXVpZFV0aWxzLmlzVVVJRCh1dWlkKSk7XG4gICAgICAgICAgICBzY3JpcHRUeXBlLnZhbHVlID0geyB1dWlkIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUeXBlLnZpc2libGUgPSAhIWNvbXBvbmVudC5fX3NjcmlwdFV1aWQ7XG4gICAgICAgICAgICBzY3JpcHRUeXBlLnZhbHVlID0geyB1dWlkOiBjb21wb25lbnQuX19zY3JpcHRVdWlkIH07XG4gICAgICAgIH1cbiAgICAgICAgc2NyaXB0VHlwZS5kaXNwbGF5T3JkZXIgPSAtOTk5O1xuICAgIH1cblxuICAgIC8vIOe7p+aJv+mTvlxuICAgIGlmIChjdG9yKSB7XG4gICAgICAgIGRhdGEuZXh0ZW5kcyA9IGR1bXBVdGlsLmdldFR5cGVJbmhlcml0YW5jZUNoYWluKGN0b3IpO1xuICAgIH1cblxuICAgIC8vIGhhY2s6IF9fcHJlZmFiIOS4jeWxnuS6juagh+WHhiBJQ29tcG9uZW50IOe7k+aehO+8jHByb3h5IOWxgumcgOimgeeUqOWug+i/mOWOn+mihOWItuS9k+W8leeUqOWFs+ezu1xuICAgIC8vIG5vZGXnmoRfcHJlZmFi5ZKMY29tcG9uZW5055qEX19wcmVmYWLkuI3kuIDmoLfvvIzlkb3lkI3mlrnlvI/kuZ/kuI3kuIDmoLfvvIzlvJXmk47mmK/ov5nmoLflrprkuYnnmoTjgIJcbiAgICAvLyBjb21wb25lbnTnmoRfX3ByZWZhYuWPquacieS4gOS4quWxnuaAp++8jOaJgOS7pei/memHjOWPr+S7peebtOaOpeWkjeWItlxuICAgIChkYXRhIGFzIGFueSkuX19jb21wUHJlZmFiX18gPSAoY29tcG9uZW50IGFzIGFueSkuX19wcmVmYWIgfHwgbnVsbDtcblxuICAgIHJldHVybiBkYXRhO1xufVxuXG5cbi8qKlxuICog5bGe5oCn77yI6Z2e5pWw57uE77yJ55qE546w5pyJ5YC857G75Z6L5ZKM5omA5Zyo57uE5Lu25a+55YW25a6a5LmJ55qE57G75Z6L6L+b6KGM5q+U6L6D77yMXG4gKiDkuI3kuIDoh7Tml7bpnIDopoHlnKggaW5zcGVjdG9yIOS4iuaYvuekuiByZXNldCDmjInpkq5cbiAqIEBwYXJhbSBkYXRhIFxuICogQHBhcmFtIG9iamVjdCBcbiAqIEBwYXJhbSBhdHRyaWJ1dGVzIFxuICovXG5mdW5jdGlvbiBfY2hlY2tDb25zdHJ1Y3RvclJld3JpdGVUeXBlKGRhdGE6IElQcm9wZXJ0eSwgb2JqZWN0OiBhbnksIGF0dHJpYnV0ZXM6IGFueSkge1xuICAgIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkob2JqZWN0KSAmJiBvYmplY3QuY29uc3RydWN0b3IgJiYgYXR0cmlidXRlcyAmJiBhdHRyaWJ1dGVzLmN0b3IgJiYgIShvYmplY3QgaW5zdGFuY2VvZiBhdHRyaWJ1dGVzLmN0b3IpKSB7XG4gICAgICAgIGRhdGEudHlwZSA9ICdVbmtub3duJztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9jaGVja0Z1bmNBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZTogc3RyaW5nLCBhdHRyaWJ1dGVzOiBhbnksIG93bmVyOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgICBpZiAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoIW93bmVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYHRyeSB0byB1c2UgJHthdHRyaWJ1dGVOYW1lfSBmdW5jdGlvbiB3aXRob3V0IG93bmVyYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZS5jYWxsKG93bmVyKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIXZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXR0cmlidXRlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuICEhYXR0cmlidXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfY2hlY2tBdHRyaWJ1dGVzKGRhdGE6IElQcm9wZXJ0eSwgYXR0cmlidXRlczogYW55LCBvd25lcjogYW55KSB7XG4gICAgLy8g5aSE55CG5a2Y5Zyo5Ye95pWw5YaZ5rOV55qE5bGe5oCnXG4gICAgWyd2aXNpYmxlJywgJ21pbicsICdtYXgnXS5mb3JFYWNoKChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IG5hbWUgYXMga2V5b2YgSVByb3BlcnR5O1xuICAgICAgICBjb25zdCB2YWx1ZSA9IF9jaGVja0Z1bmNBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlcywgb3duZXIpO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGF0YVthdHRyaWJ1dGVOYW1lXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWF0dHJpYnV0ZXMuY3RvciAmJiBhdHRyaWJ1dGVzLnR5cGUpIHtcbiAgICAgICAgZGF0YS50eXBlID0gJycgKyBhdHRyaWJ1dGVzLnR5cGU7XG4gICAgfVxuXG4gICAgaWYgKCdlbnVtTGlzdCcgaW4gYXR0cmlidXRlcyAmJiBhdHRyaWJ1dGVzLnR5cGUgPT09ICdFbnVtJykge1xuICAgICAgICBkYXRhLnR5cGUgPSAnRW51bSc7XG4gICAgfVxuXG4gICAgLy8g546w5Zyo6Lef6buY6K6k5YC85rKh5YWz57O777yM5piO56Gu5Y+q5pyJIGdldCDmsqHmnIkgc2V0IOeahOaDheWGteS4i+S4uuWPquivu1xuICAgIGlmIChhdHRyaWJ1dGVzICYmIGF0dHJpYnV0ZXMuaGFzR2V0dGVyICYmICFhdHRyaWJ1dGVzLmhhc1NldHRlcikge1xuICAgICAgICBkYXRhLnJlYWRvbmx5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVQcm9wcy5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgZGF0YVtwcm9wTmFtZV0gPSBhdHRyaWJ1dGVzW3Byb3BOYW1lXTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8g5aaC5p6c5a+56LGh57G75Z6L5ZCN5LulIGBjYy5gIOW8gOWni++8jOS5n+WwseaYr+W8leaTjuWvueixoeOAglxuICAgIC8vIOWImeiHquWKqOaMieinhOWImee7hOijheWHuuimgSBpMThuIOeahOeJueaAp++8iOavlOWmguaYvuekuuWQjeWSjOW3peWFt+aPkOekuu+8ieeahCBpMThuIOi3r+W+hO+8jOS9nOS4uiBEdW1wIOaVsOaNruOAglxuICAgIC8vXG4gICAgLy8g57uE6KOF6KeE5YiZ5aaC5LiL44CC5a+55LqO5p+Q5Liq5byV5pOO57G755qE5p+Q5Liq5bGe5oCn55qE5p+Q5Liq54m55oCn77yM57yW6L6R5Zmo5Lya5oyJ5Lul5LiL55qE5a2X5YW46Lev5b6E5Y675p+l5om+6K+l54m55oCn55qEIGkxOG4g5a2X56ym5Liy77yaXG4gICAgLy8gYGkxOG46RU5HSU5FLmNsYXNzZXMuPOexu+eahCBjYy1jbGFzcyDlkI3np7A+LnByb3BlcnRpZXMuPOWxnuaAp+eahOWQjeensD4uPOeJueaAp+eahOWQjeensD5gXG4gICAgLy9cbiAgICBpZiAodHlwZW9mIGRhdGEubmFtZSA9PT0gJ3N0cmluZycgJiYgb3duZXIgJiYgdHlwZW9mIG93bmVyID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCBvd25lclR5cGVOYW1lID0gZmluZENsYXNzTmFtZShvd25lciwgZGF0YS5uYW1lKTtcbiAgICAgICAgaWYgKG93bmVyVHlwZU5hbWUpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYXV0b0kxOG5BdHRyaWJ1dGVOYW1lIG9mIGF1dG9JMThuQXR0cmlidXRlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzor6XnibnmgKflt7Lnu4/ooqvlo7DmmI7vvIzmr5TlpoIgYEBwcm9wZXJ0eSh7IHRvb2x0aXA6ICcnIH0pYO+8jOi3s+i/h+e7hOijheOAglxuICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0cmlidXRlcywgYXV0b0kxOG5BdHRyaWJ1dGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGF0YVthdXRvSTE4bkF0dHJpYnV0ZU5hbWVdID0gYGkxOG46RU5HSU5FLmNsYXNzZXMuJHtvd25lclR5cGVOYW1lfS5wcm9wZXJ0aWVzLiR7ZGF0YS5uYW1lfS4ke2F1dG9JMThuQXR0cmlidXRlTmFtZX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJhbnNsYXRlSTE4blN0cmluZ3NEZWVwKGRhdGEpO1xufVxuXG4vLyBFbmdpbmUgcHJvcGVydHkgYXR0cmlidXRlcyBhcmUgdXNlci1kZWZpbmVkIGFuZCB0aGVpciBzdHJ1Y3R1cmUgaXMgdW5wcmVkaWN0YWJsZS5cbi8vIEZvciBleGFtcGxlLCBAZ3JvdXAoeyBuYW1lOiAnaTE4bjouLi4nLCBkaXNwbGF5T3JkZXI6IDAgfSkgb3IgYW55IGN1c3RvbSBkZWNvcmF0b3Jcbi8vIGNhbiBlbWJlZCBpMThuIHN0cmluZ3MgYXQgYXJiaXRyYXJ5IG5lc3RpbmcgbGV2ZWxzLiBDaGVja2luZyBvbmx5IHRvcC1sZXZlbCBmaWVsZHNcbi8vIChkaXNwbGF5TmFtZSAvIHRvb2x0aXApIHdvdWxkIHNpbGVudGx5IG1pc3MgdGhlc2UuIFdlIHRoZXJlZm9yZSB0cmF2ZXJzZSB0aGUgZW50aXJlXG4vLyBhdHRyaWJ1dGUgb2JqZWN0IGFuZCB0cmFuc2xhdGUgZXZlcnkgc3RyaW5nIHRoYXQgY2FycmllcyB0aGUgJ2kxOG46JyBwcmVmaXguXG5mdW5jdGlvbiB0cmFuc2xhdGVJMThuU3RyaW5nc0RlZXAob2JqOiBhbnksIGRlcHRoID0gMCk6IHZvaWQge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSByZXR1cm47XG4gICAgaWYgKGRlcHRoID4gMTApIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbdHJhbnNsYXRlSTE4blN0cmluZ3NEZWVwXSBNYXggcmVjdXJzaW9uIGRlcHRoIGV4Y2VlZGVkOyBuZXN0ZWQgaTE4biBzdHJpbmdzIGF0IHRoaXMgbGV2ZWwgd2lsbCBub3QgYmUgdHJhbnNsYXRlZDonLCBvYmopO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iaikpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gaTE4bi50cmFuc0kxOG5OYW1lKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWVbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW2ldID0gaTE4bi50cmFuc0kxOG5OYW1lKHZhbHVlW2ldKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGVJMThuU3RyaW5nc0RlZXAodmFsdWVbaV0sIGRlcHRoICsgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJhbnNsYXRlSTE4blN0cmluZ3NEZWVwKHZhbHVlLCBkZXB0aCArIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIOafpeivouaMh+Wumuexu+WQje+8jOWmguaenOiHqui6q+ayoeacieWwseWQkeS4iuafpeivolxuICogQHBhcmFtIGNjQ2xhc3NPYmplY3RcbiAqL1xuY29uc3QgTUFYX1JFQ1VSU0lPTl9ERVBUSCA9IDEwOy8vIOmAkuW9kuS4reWinuWKoOacgOWkp+mAkuW9kua3seW6pumZkOWItu+8jOmBv+WFjeaXoOmZkOW+queOr+aIluaAp+iDvemXrumimFxuY29uc3QgVEFSR0VUX0NMQVNTX05BTUUgPSBbJ2NjLicsICdzcC4nXTtcbmZ1bmN0aW9uIGZpbmRDbGFzc05hbWUoY2NDbGFzc09iamVjdDogYW55LCBwcm9wZXJ0eTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgZGVwdGggPSAwO1xuICAgIGxldCBwcm90byA9IGNjQ2xhc3NPYmplY3Q7XG4gICAgd2hpbGUgKHByb3RvICYmIGRlcHRoIDwgTUFYX1JFQ1VSU0lPTl9ERVBUSCkge1xuICAgICAgICBjb25zdCBjbGFzc05hbWUgPSBqcy5nZXRDbGFzc05hbWUocHJvdG8pO1xuXG4gICAgICAgIGlmIChjbGFzc05hbWUgJiZcbiAgICAgICAgICAgIFRBUkdFVF9DTEFTU19OQU1FLmZpbmQoa2V5ID0+IGNsYXNzTmFtZS5zdGFydHNXaXRoKGtleSkpICYmXG4gICAgICAgICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocHJvdG8sIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgcmV0dXJuIGNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDpgJrov4fljp/lnovpk77lkJHkuIrmn6Xmib5cbiAgICAgICAgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgICAgICBkZXB0aCsrO1xuICAgIH1cblxuICAgIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gX2VuY29kZUJ5VHlwZSh0eXBlOiBzdHJpbmcgfCB1bmRlZmluZWQsIG9iamVjdDogYW55LCBkYXRhOiBJUHJvcGVydHksIG9wdHM/OiBhbnkpIHtcbiAgICB0eXBlID0gdHlwZSB8fCAnJztcbiAgICBjb25zdCBkdW1wVHlwZSA9IER1bXBEZWZpbmVzW3R5cGVdO1xuICAgIGlmIChkdW1wVHlwZSkge1xuICAgICAgICBkdW1wVHlwZS5lbmNvZGUob2JqZWN0LCBkYXRhLCBvcHRzKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIGhhY2vvvJrlpITnkIYgY29tcG9uZW50IOeahCAub2JqRmxhZ3Mg6K6+572u77yM6ZyA6KaB5Lyg6YCS57uZIG5vZGVcbiAqIOavlOWmgiBDYW52YXMg55qEIElzUG9zaXRpb25Mb2NrZWQg6KaB5Lyg57uZIG5vZGXvvIxwb3NpdGlvbi5yZWFkb25seSA9IHRydWVcbiAqIOavlOWmgiBDYW52YXMg55qEIElzU2l6ZUxvY2tlZCDopoHkvKDnu5kgVUlUcmFuc2Zvcm0sIGNvbnRlbnRzaXplID0gdHJ1ZVxuICog5pqC5pe25aSE55CG5Lul5LiL6YC76L6R77yM5ZCO57ut5Y+v5aKe5YigXG4gKi9cbmZ1bmN0aW9uIF9jaGVja09iakZsYWdzKG5vZGU6IGFueSwgZGF0YTogSU5vZGUpIHtcbiAgICBsZXQgSXNQb3NpdGlvbkxvY2tlZCA9IGZhbHNlO1xuICAgIGxldCBJc1NpemVMb2NrZWQgPSBmYWxzZTtcbiAgICBsZXQgSXNBbmNob3JMb2NrZWQgPSBmYWxzZTtcbiAgICBsZXQgSXNTY2FsZUxvY2tlZCA9IGZhbHNlO1xuICAgIGxldCBJc1JvdGF0aW9uTG9ja2VkID0gZmFsc2U7XG4gICAgbm9kZVsnX2NvbXBvbmVudHMnXS5mb3JFYWNoKChjb21wb25lbnQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoY29tcG9uZW50Lm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLklzUG9zaXRpb25Mb2NrZWQpIHtcbiAgICAgICAgICAgIElzUG9zaXRpb25Mb2NrZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudC5vYmpGbGFncyAmIGNjLk9iamVjdC5GbGFncy5Jc1NpemVMb2NrZWQpIHtcbiAgICAgICAgICAgIElzU2l6ZUxvY2tlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcG9uZW50Lm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLklzQW5jaG9yTG9ja2VkKSB7XG4gICAgICAgICAgICBJc0FuY2hvckxvY2tlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcG9uZW50Lm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLklzU2NhbGVMb2NrZWQpIHtcbiAgICAgICAgICAgIElzU2NhbGVMb2NrZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudC5vYmpGbGFncyAmIGNjLk9iamVjdC5GbGFncy5Jc1JvdGF0aW9uTG9ja2VkKSB7XG4gICAgICAgICAgICBJc1JvdGF0aW9uTG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKElzUG9zaXRpb25Mb2NrZWQpIHtcbiAgICAgICAgZGF0YS5wb3NpdGlvbi5yZWFkb25seSA9IHRydWU7XG4gICAgfVxuICAgIGlmIChJc1NjYWxlTG9ja2VkKSB7XG4gICAgICAgIGRhdGEuc2NhbGUucmVhZG9ubHkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChJc1JvdGF0aW9uTG9ja2VkKSB7XG4gICAgICAgIGRhdGEucm90YXRpb24ucmVhZG9ubHkgPSB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVpVHJhbnNmb3JtQ29tcG9uZW50czogYW55ID0gW107XG4gICAgZGF0YS5fX2NvbXBzX18uZm9yRWFjaCgoY29tcDogYW55KSA9PiB7XG4gICAgICAgIGlmIChjb21wLmNpZCA9PT0gJ2NjLlVJVHJhbnNmb3JtJykge1xuICAgICAgICAgICAgdWlUcmFuc2Zvcm1Db21wb25lbnRzLnB1c2goY29tcCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICh1aVRyYW5zZm9ybUNvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgIGlmIChJc1NpemVMb2NrZWQpIHtcbiAgICAgICAgICAgIHVpVHJhbnNmb3JtQ29tcG9uZW50cy5mb3JFYWNoKChjb21wOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb21wLnZhbHVlLmNvbnRlbnRTaXplLnJlYWRvbmx5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChJc0FuY2hvckxvY2tlZCkge1xuICAgICAgICAgICAgdWlUcmFuc2Zvcm1Db21wb25lbnRzLmZvckVhY2goKGNvbXA6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbXAudmFsdWUuYW5jaG9yUG9pbnQucmVhZG9ubHkgPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICog57yW56CB5LiA5Liq5a+56LGhXG4gKiBAcGFyYW0gb2JqZWN0IOe8lueggeWvueixoVxuICogQHBhcmFtIGF0dHJpYnV0ZXMg5bGe5oCn5o+P6L+wXG4gKiBAcGFyYW0gb3duZXIg57yW56CB5a+56LGh5omA5bGe55qE5a+56LGhXG4gKiBAcGFyYW0gb2JqZWN0S2V5IOi+k+WHuuacieaViOS/oeaBr++8jOW9k+WJjeaVsOaNriBrZXnvvIzku6Xkvr/pl67popjmjpLmn6VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZU9iamVjdChvYmplY3Q6IGFueSwgYXR0cmlidXRlczogYW55LCBvd25lcjogYW55ID0gbnVsbCwgb2JqZWN0S2V5Pzogc3RyaW5nLCBpc1RlbXBsYXRlPzogYm9vbGVhbik6IElQcm9wZXJ0eSB7XG4gICAgY29uc3QgY3RvciA9IGR1bXBVdGlsLmdldENvbnN0cnVjdG9yKG9iamVjdCwgYXR0cmlidXRlcyk7XG4gICAgbGV0IGRlZlZhbHVlID0gZHVtcFV0aWwuZ2V0RGVmYXVsdChhdHRyaWJ1dGVzKTtcblxuICAgIC8vIOaehOmAoOWZqOWtmOWcqO+8jOWxnuaAp+S5n+WtmOWcqFxuICAgIGlmIChkZWZWYWx1ZSAmJiB0eXBlb2YgZGVmVmFsdWUgPT09ICdvYmplY3QnICYmIGRlZlZhbHVlLmNvbnN0cnVjdG9yICYmIEFycmF5LmlzQXJyYXkoZGVmVmFsdWUuY29uc3RydWN0b3IuX19wcm9wc19fKSkge1xuICAgICAgICBjb25zdCByZXN1bHQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7XG4gICAgICAgICAgICB0eXBlOiBkdW1wVXRpbC5nZXRUeXBlTmFtZShkZWZWYWx1ZS5jb25zdHJ1Y3RvciksXG4gICAgICAgICAgICB2YWx1ZToge30sXG4gICAgICAgIH07XG4gICAgICAgIGRlZlZhbHVlLmNvbnN0cnVjdG9yLl9fcHJvcHNfXy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0cnMgPSBjYy5DbGFzcy5hdHRyKGRlZlZhbHVlLmNvbnN0cnVjdG9yLCBrZXkpO1xuICAgICAgICAgICAgY29uc3QgZHVtcERhdGEgPSBlbmNvZGVPYmplY3QoZGVmVmFsdWVba2V5XSwgYXR0cnMsIGRlZlZhbHVlLCBrZXkpO1xuICAgICAgICAgICAgaWYgKGR1bXBEYXRhLnR5cGUgIT09ICdVbmtub3duJykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC52YWx1ZVtrZXldID0gZHVtcERhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkZWZWYWx1ZSA9IHJlc3VsdDtcbiAgICB9XG5cbiAgICBsZXQgdHlwZSA9IGR1bXBVdGlsLmdldFR5cGVOYW1lKGN0b3IpO1xuXG4gICAgaWYgKG93bmVyID09PSBudWxsKSB7XG4gICAgICAgIC8vIOm7mOiupOWAvOWmguaenOWtmOWcqO+8jOWImeavlOWvuem7mOiupOWAvOeahCBjdG9yIOWSjOW9k+WJjeWvueixoeeahCBjdG9yIOaYr+WQpuS4gOiHtFxuICAgICAgICBpZiAoYXR0cmlidXRlcy5kZWZhdWx0ICE9PSBudWxsICYmIGF0dHJpYnV0ZXMuZGVmYXVsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBkZWZDdG9yID0gZHVtcFV0aWwuZ2V0Q29uc3RydWN0b3IoYXR0cmlidXRlcy5kZWZhdWx0LCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgICAgIGNvbnN0IGRlZlR5cGUgPSBkdW1wVXRpbC5nZXRUeXBlTmFtZShkZWZDdG9yKTtcbiAgICAgICAgICAgIGlmIChkZWZUeXBlICE9PSB0eXBlKSB7XG4gICAgICAgICAgICAgICAgdHlwZSA9ICdVbmtub3duJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGRhdGE6IElQcm9wZXJ0eSA9IHtcbiAgICAgICAgbmFtZTogb2JqZWN0S2V5LFxuICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgZGVmYXVsdDogZGVmVmFsdWUsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgICByZWFkb25seTogISFhdHRyaWJ1dGVzLnJlYWRvbmx5LFxuICAgICAgICB2aXNpYmxlOiBhdHRyaWJ1dGVzLnZpc2libGUgPz8gdHJ1ZSxcbiAgICAgICAgYW5pbWF0YWJsZTogYXR0cmlidXRlcy5hbmltYXRhYmxlID09PSB1bmRlZmluZWQgPyB0cnVlIDogISFhdHRyaWJ1dGVzLmFuaW1hdGFibGUsIC8vIOWmguaenOayoeacieWumuS5iem7mOiupOaYryB0cnVl77yM5ZCm5YiZ5qC55o2u5a6a5LmJ5Y+W5biD5bCU5YC8XG4gICAgfTtcblxuICAgIC8v5aaC5p6c5pyJIHVzZXJEYXRhIOWwseaKiiB1c2VyRGF0YSDkvKDpgJLov4fljrtcbiAgICBpZiAoYXR0cmlidXRlcy51c2VyRGF0YSkge1xuICAgICAgICBkYXRhLnVzZXJEYXRhID0gYXR0cmlidXRlcy51c2VyRGF0YTtcbiAgICB9XG5cbiAgICBfY2hlY2tBdHRyaWJ1dGVzKGRhdGEsIGF0dHJpYnV0ZXMsIG93bmVyKTtcblxuICAgIGlmIChkZWZWYWx1ZSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZWZWYWx1ZSkpIHtcbiAgICAgICAgICAgIGRhdGEuaXNBcnJheSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWRhdGEuaXNBcnJheSAmJiBBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgICAgZGF0YS5pc0FycmF5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5pc0FycmF5KSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShvYmplY3QpIHx8IGRhdGEudHlwZSA9PT0gJ0FycmF5Jykge1xuICAgICAgICAgICAgZGF0YS50eXBlID0gJ1Vua25vd24nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5a2Q5YWD57Sg55qE5a6a5LmJXG4gICAgICAgICAgICBjb25zdCBjaGlsZEF0dHJpYnV0ZTogYW55ID0gT2JqZWN0LmFzc2lnbih7fSwgYXR0cmlidXRlcyk7XG5cbiAgICAgICAgICAgIC8vIOeItue6p+aVsOe7hOWxnuaAp+eahOS/rumlsOWZqOWumuS5ieS4jemAgueUqOS6jiDlrZDlhYPntKAg55qE5a6a5LmJ77yM6ZyA6KaB6LCD5pW0XG4gICAgICAgICAgICBjaGlsZEF0dHJpYnV0ZS52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChjaGlsZEF0dHJpYnV0ZS5yZWFkb25seSAmJiBjaGlsZEF0dHJpYnV0ZS5yZWFkb25seS5kZWVwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjaGlsZEF0dHJpYnV0ZS5yZWFkb25seSA9IGNoaWxkQXR0cmlidXRlLnJlYWRvbmx5LmRlZXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5RGVmYXVsdFZhbHVlID0gZHVtcFV0aWwuY2NDbGFzc0F0dHJQcm9wZXJ0eURlZmF1bHRWYWx1ZShhdHRyaWJ1dGVzKTtcbiAgICAgICAgICAgIC8vIOWtkOWFg+e0oOeahOexu+Wei+eUseeItue6p+WGs+Wumu+8jOWtkOWFg+e0oOeahOm7mOiupOWAvOi3n+maj+eItue6p+exu+Wei+eahOm7mOiupOWAvFxuICAgICAgICAgICAgY2hpbGRBdHRyaWJ1dGUuZGVmYXVsdCA9IGdldEVsZW1lbnREZWZhdWx0VmFsdWUoYXR0cmlidXRlcywgcHJvcGVydHlEZWZhdWx0VmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAoIWlzVGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmVsZW1lbnRUeXBlRGF0YSA9IGVuY29kZU9iamVjdChjaGlsZEF0dHJpYnV0ZS5kZWZhdWx0LCBjaGlsZEF0dHJpYnV0ZSwgcHJvcGVydHlEZWZhdWx0VmFsdWUsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdFZhbHVlOiBhbnkgPSBbXTtcbiAgICAgICAgICAgIC8vIOacqumBv+WFjeacieWPr+iDveWHuueOsOeahOWGhemDqOaVsOaNruacieepuu+8jOmcgOimgeeUqOaZrumAmueahCBmb3Ig5b6q546v77yM5LiN6KaB5L2/55SoIGZvckVhY2hcXG1hcCDnrYnmnaXpgY3ljoZcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IG9iamVjdFtpXTtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0uY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRBdHRyaWJ1dGUuY3RvciA9IGl0ZW0gJiYgaXRlbS5jb25zdHJ1Y3RvcjsgLy8g5aSE55CG5a2Q57qn55qE57G75piv57un5om/54i257qn57G755qE5oOF5Ya1XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZW5jb2RlT2JqZWN0KGl0ZW0sIGNoaWxkQXR0cmlidXRlLCBvd25lcik7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50eXBlICE9PSAnVW5rbm93bicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0VmFsdWUucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFZhbHVlLnB1c2goZGF0YS5lbGVtZW50VHlwZURhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRhdGEudmFsdWUgPSByZXN1bHRWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG9wdHM6IGFueSA9IHt9O1xuICAgICAgICBvcHRzLmN0b3IgPSBjdG9yO1xuXG4gICAgICAgIGlmIChfZW5jb2RlQnlUeXBlKGRhdGEudHlwZSwgb2JqZWN0LCBkYXRhLCBvcHRzKSkge1xuICAgICAgICAgICAgLy8gZW1wdHlcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcob2JqZWN0KSkge1xuICAgICAgICAgICAgX2VuY29kZUJ5VHlwZSgnVHlwZWRBcnJheScsIG9iamVjdCwgZGF0YSwgb3B0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2MuanMuaXNDaGlsZENsYXNzT2YoY3RvciwgY2MuVmFsdWVUeXBlKSkge1xuICAgICAgICAgICAgX2VuY29kZUJ5VHlwZSgnY2MuVmFsdWVUeXBlJywgb2JqZWN0LCBkYXRhLCBvcHRzKTtcbiAgICAgICAgfSBlbHNlIGlmIChjYy5qcy5pc0NoaWxkQ2xhc3NPZihjdG9yLCBjYy5Ob2RlKSkge1xuICAgICAgICAgICAgLy8g5aaC5p6c5piv6IqC54K544CB6LWE5rqQ44CB57uE5Lu277yM5YiZ55Sf5oiQ6ZO+5o6l5Yiw5a+56LGh55qEIHV1aWRcbiAgICAgICAgICAgIF9lbmNvZGVCeVR5cGUoJ2NjLk5vZGUnLCBvYmplY3QsIGRhdGEsIG9wdHMpO1xuICAgICAgICB9IGVsc2UgaWYgKGNjLmpzLmlzQ2hpbGRDbGFzc09mKGN0b3IsIGNjLkNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIF9lbmNvZGVCeVR5cGUoJ2NjLkNvbXBvbmVudCcsIG9iamVjdCwgZGF0YSwgb3B0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2MuanMuaXNDaGlsZENsYXNzT2YoY3RvciwgY2MuQXNzZXQpKSB7XG4gICAgICAgICAgICBfZW5jb2RlQnlUeXBlKCdjYy5Bc3NldCcsIG9iamVjdCwgZGF0YSwgb3B0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3RvciAmJiBjdG9yLl9fcHJvcHNfXykge1xuICAgICAgICAgICAgLy8g5aaC5p6c5p6E6YCg5Zmo5a2Y5Zyo77yM5LiU5bim5pyJIF9fcHJvcHNfX++8jOWImeW8gOWni+mAkuW9kuW6j+WIl+WMluWGhemDqOWxnuaAp1xuICAgICAgICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICAgICAgICAgIC8vIOaehOmAoOWZqOWtmOWcqO+8jOWxnuaAp+S5n+WtmOWcqFxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuICAgICAgICAgICAgICAgIGN0b3IuX19wcm9wc19fLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJzID0gY2MuQ2xhc3MuYXR0cihvYmplY3QsIGtleSk7IC8vIG9iamVjdCDmmK/lrp7kvovvvIzlj6/og73mnInoh6rlrprkuYnnmoQgYXR0cnNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLnJlYWRvbmx5ICYmIGF0dHJpYnV0ZXMucmVhZG9ubHkuZGVlcCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRycy5yZWFkb25seSA9IHsgZGVlcDogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcERhdGEgPSBlbmNvZGVPYmplY3Qob2JqZWN0W2tleV0sIGF0dHJzLCBvYmplY3QsIGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkdW1wRGF0YS50eXBlICE9PSAnVW5rbm93bicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gZHVtcERhdGE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgX2NoZWNrQ29uc3RydWN0b3JSZXdyaXRlVHlwZShkdW1wRGF0YSwgb2JqZWN0W2tleV0sIGF0dHJzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkYXRhLnZhbHVlID0gcmVzdWx0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmnoTpgKDlmajlrZjlnKjvvIzkvYbmmK/lsZ7mgKfkuI3lrZjlnKjvvIzml6Dms5Xnu6fnu63pgJLlvZLluo/liJfljJblhoXpg6jlsZ7mgKdcbiAgICAgICAgICAgICAgICBkYXRhLnZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOS4iui/sOWIpOaWremDveaXoOazlemAgueUqOeahOaDheWGteS4iywg55u05o6l5bCGIG9iamVjdCDotYvlgLznu5kgdmFsdWVcbiAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgIT09ICdVbmtub3duJykge1xuICAgICAgICAgICAgICAgIGRhdGEudmFsdWUgPSBvYmplY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDnu6fmib/pk75cbiAgICBpZiAoY3Rvcikge1xuICAgICAgICBkYXRhLmV4dGVuZHMgPSBkdW1wVXRpbC5nZXRUeXBlSW5oZXJpdGFuY2VDaGFpbihjdG9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudERlZmF1bHRWYWx1ZShwYXJlbnRBdHRyczogYW55LCBwYXJlbnRJbml0aWFsaXplcjogdW5rbm93bikge1xuICAgIGlmIChwYXJlbnRBdHRycy50eXBlKSB7XG4gICAgICAgIHJldHVybiBkdW1wVXRpbC5jY0NsYXNzQXR0clByb3BlcnR5RGVmYXVsdFZhbHVlKHBhcmVudEF0dHJzKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldEVsZW1lbnREZWZhdWx0VmFsdWVGcm9tUGFyZW50SW5pdGlhbGl6ZXIocGFyZW50SW5pdGlhbGl6ZXIpO1xufVxuXG5mdW5jdGlvbiBnZXRFbGVtZW50RGVmYXVsdFZhbHVlRnJvbVBhcmVudEluaXRpYWxpemVyKHBhcmVudEluaXRpYWxpemVyOiB1bmtub3duKSB7XG4gICAgaWYgKCFwYXJlbnRJbml0aWFsaXplciB8fCAhQXJyYXkuaXNBcnJheShwYXJlbnRJbml0aWFsaXplcikgfHwgcGFyZW50SW5pdGlhbGl6ZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0RWxlbWVudCA9IHBhcmVudEluaXRpYWxpemVyWzBdO1xuICAgIHN3aXRjaCAodHlwZW9mIGZpcnN0RWxlbWVudCkge1xuICAgICAgICBjYXNlICdudW1iZXInOiByZXR1cm4gMDtcbiAgICAgICAgY2FzZSAnc3RyaW5nJzogcmV0dXJuICcnO1xuICAgICAgICBjYXNlICdib29sZWFuJzogcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVUYXJnZXRPdmVycmlkZXModGFyZ2V0T3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBpZiAoIXRhcmdldE92ZXJyaWRlcyB8fCB0YXJnZXRPdmVycmlkZXMubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZHVtcGVkVGFyZ2V0T3ZlcnJpZGVzOiBJVGFyZ2V0T3ZlcnJpZGVJbmZvW10gPSBbXTtcbiAgICB0YXJnZXRPdmVycmlkZXMuZm9yRWFjaCgoaXRyOiBQcmVmYWIuX3V0aWxzLlRhcmdldE92ZXJyaWRlSW5mbykgPT4ge1xuICAgICAgICBpZiAoIWl0ci5zb3VyY2UgfHwgIWl0ci50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkdW1wT3ZlcnJpZGUgPSB7XG4gICAgICAgICAgICBzb3VyY2U6IGl0ci5zb3VyY2UudXVpZCxcbiAgICAgICAgICAgIHNvdXJjZUluZm86IGl0ci5zb3VyY2VJbmZvID8gaXRyLnNvdXJjZUluZm8ubG9jYWxJRCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHByb3BlcnR5UGF0aDogaXRyLnByb3BlcnR5UGF0aCxcbiAgICAgICAgICAgIHRhcmdldDogaXRyLnRhcmdldC51dWlkLFxuICAgICAgICAgICAgdGFyZ2V0SW5mbzogaXRyLnRhcmdldEluZm8gPyBpdHIudGFyZ2V0SW5mby5sb2NhbElEIDogdW5kZWZpbmVkLFxuICAgICAgICB9O1xuXG4gICAgICAgIGR1bXBlZFRhcmdldE92ZXJyaWRlcy5wdXNoKGR1bXBPdmVycmlkZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZHVtcGVkVGFyZ2V0T3ZlcnJpZGVzO1xufVxuXG4vLyBleHBvcnQgKiBhcyBkZWZhdWx0IGZyb20gJy4vZW5jb2RlJztcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBlbmNvZGVOb2RlLFxuICAgIGVuY29kZVNjZW5lLFxuICAgIGVuY29kZUNvbXBvbmVudCxcbiAgICBlbmNvZGVPYmplY3QsXG59O1xuIl19