"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeOperation = void 0;
const cc_1 = require("cc");
const utils_1 = require("./utils");
const component_1 = require("./component");
const node_utils_1 = require("../node/node-utils");
const core_1 = require("../core");
const common_1 = require("../../../common");
const rpc_1 = require("../../rpc");
const timer_util_1 = require("../utils/timer-util");
const utils_2 = require("../scene/utils");
const nodeMgr = EditorExtends.Node;
const compMgr = EditorExtends.Component;
const PrefabInfo = cc_1.Prefab._utils.PrefabInfo;
const PropertyOverrideInfo = cc_1.Prefab._utils.PropertyOverrideInfo;
const CompPrefabInfo = cc_1.Prefab._utils.CompPrefabInfo;
const TargetInfo = cc_1.Prefab._utils.TargetInfo;
const TargetOverrideInfo = cc_1.Prefab._utils.TargetOverrideInfo;
// scale 默认不 override，因为模型往往缩放有问题，这样重导后就直接生效了
const RootReservedProperty = ['_name', '_lpos', '_lrot', '_euler'];
const compKey = '_components';
// 在 diff 比较剔除的一些属性
const diffExcludePropMap = {
    'cc.Node': ['_objFlags', '_parent', '_children', '_components', '_prefab', cc_1.editorExtrasTag],
    'cc.Component': ['node', '_objFlags', cc_1.editorExtrasTag],
};
function getDiffExcludeProps(ctor) {
    let props = [];
    Object.keys(diffExcludePropMap).forEach((key) => {
        const ccKls = cc_1.js.getClassByName(key);
        if (ccKls && cc_1.js.isChildClassOf(ctor, ccKls)) {
            props = props.concat(diffExcludePropMap[key]);
        }
    });
    return props;
}
class NodeOperation {
    assetToNodesMap = new Map(); // 存储 prefab 资源和场景节点的关系表
    isRemovingMountedChildren = false;
    _timerUtil = new timer_util_1.TimerUtil();
    onEditorOpened() {
        this.assetToNodesMap.clear();
        component_1.componentOperation.clearCompCache();
        utils_1.prefabUtils.clearCache();
        for (const uuid in nodeMgr.getNodes()) {
            const node = nodeMgr.getNode(uuid);
            // 场景节点特殊处理
            if (node instanceof cc_1.Scene) {
                continue;
            }
            if (node && !(0, node_utils_1.isEditorNode)(node)) {
                this.checkToAddPrefabAssetMap(node);
                node.components.forEach((comp) => {
                    component_1.componentOperation.cacheComp(comp);
                });
            }
        }
    }
    onNodeRemoved(node) {
        const prefabInfo = node['_prefab'];
        const prefabInstance = prefabInfo?.instance;
        if (prefabInstance && prefabInfo?.asset) {
            const nodes = this.assetToNodesMap.get(prefabInfo.asset._uuid);
            if (nodes) {
                const index = nodes.indexOf(node);
                if (index >= 0) {
                    nodes.splice(index, 1);
                }
            }
        }
    }
    // 修改 PrefabInstance 中节点数据，要保存在最外层的 PrefabInstance中
    checkToAddOverrides(node, inPropPath, root) {
        const prefabInfo = utils_1.prefabUtils.getPrefab(node);
        if (!node || !(0, cc_1.isValid)(node) || (prefabInfo && !(0, cc_1.isValid)(prefabInfo.asset))) {
            return;
        }
        if (!inPropPath) {
            return;
        }
        const propPath = inPropPath.replace(/^__comps__/, compKey);
        const pathKeys = (propPath || '').split('.');
        let comp = null;
        // 路径里有 __comps__ 就说明是组件
        if (inPropPath !== propPath && pathKeys[0] === compKey) {
            comp = node[pathKeys[0]][pathKeys[1]];
        }
        // 检测是否是 PrefabAsset 中的普通节点（非嵌套 Prefab 中的节点）
        const isNormalPrefabNode = prefabInfo && !prefabInfo.root?.['_prefab']?.instance;
        // 普通节点或者 mountedComponent，只需要判断是否要加 TargetOverride（在普通节点的 Component 引用到 Prefab 里的 Node 或 Component 时）
        if (!prefabInfo || isNormalPrefabNode || (comp && utils_1.prefabUtils.isMountedComponent(comp))) {
            if (root) {
                // 不能用 getDiffPropertyInfos 来判断引用，因为获取到的 differInfo 的属性路径是与修改的值不一样的，比如自定义类型数组 #13612
                // const comparedComp = componentOperation.getCachedComp(comp.uuid);
                // if (!comparedComp) {
                //     console.error(`can't get compared component of ${comp.name}`);
                //     return;
                // }
                // @ts-ignore
                // const diffInfos = this.getDiffPropertyInfos(comp, comparedComp, [],
                //          this.isInTargetOverrides.bind(this, comp, root._prefab?.targetOverrides)); // 利用偏函数传入预设参数
                // if (diffInfos && diffInfos.length > 0) {
                //     for (let i = 0; i < diffInfos.length; i++) {
                //         const info = diffInfos[i];
                //         this.checkToAddTargetOverride(comp, info, root);
                //     }
                // }
                this.addTargetOverrideWithModifyPath(node, pathKeys, root);
            }
        }
        // 如果改了组件，且 path 长度只有 2，则是设置了整个组件
        else if (comp && pathKeys.length === 2) {
            // @ts-ignore
            const props = comp.constructor.__props__;
            props.forEach((prop) => {
                const attr = cc.Class.attr(comp, prop);
                if (attr.visible !== false) {
                    this.checkToAddPropertyOverrides(node, [...pathKeys, prop], root);
                }
            });
        }
        else {
            this.checkToAddPropertyOverrides(node, pathKeys, root);
        }
    }
    /**
     * 一些组件，引擎内部会有数据更新操作，但没有统一处理，比如 lod\widget 的更新
     * 针对这些组件，需要在节点变化时，更新 override 数据
     * @param node
     * @param propPath
     * @param root
     */
    updateSpecialComponent(node, propPath, root) {
        // 有可能存在节点被删除了，但是还出发了 updateSpecialComponent
        if (!node.isValid)
            return;
        if (propPath === 'position') {
            // 更新一下 widget
            const widget = node.getComponent(cc_1.Widget);
            if (widget && !utils_1.prefabUtils.isMountedComponent(widget)) {
                const index = node.components.indexOf(widget);
                const props = {
                    isAlignLeft: 'left',
                    isAlignRight: 'right',
                    isAlignHorizontalCenter: 'horizontalCenter',
                    isAlignTop: 'top',
                    isAlignBottom: 'bottom',
                    isAbsoluteVerticalCenter: 'verticalCenter',
                };
                Object.keys(props).forEach((key) => {
                    // @ts-ignore
                    if (widget[key]) {
                        this.checkToAddPropertyOverrides(node, ['_components', `${index}`, props[key]], root);
                    }
                });
            }
        }
    }
    onAddNode(node) {
        const parentNode = node.parent;
        if (!parentNode) {
            return;
        }
        this.updateChildrenData(parentNode);
        this.createReservedPropertyOverrides(node);
    }
    onNodeAdded(node) {
        this.checkToAddPrefabAssetMap(node);
        if (core_1.Service.Editor.getCurrentEditorType() === 'prefab') {
            // prefab 模式下添加节点，需要都加 Prefab 相关的信息
            const prefabInfo = utils_1.prefabUtils.getPrefab(node);
            const rootNode = core_1.Service.Editor.getRootNode();
            if (!rootNode) {
                return;
            }
            const rootPrefabInfo = utils_1.prefabUtils.getPrefab(rootNode);
            if (!rootPrefabInfo) {
                return;
            }
            if (prefabInfo?.instance) {
                // 如果是嵌套预制体添加，它本身是有 prefabRootNode 的，不要去改变它
                prefabInfo.instance.prefabRootNode = prefabInfo.instance.prefabRootNode ?? rootPrefabInfo.root;
            }
            else {
                // 非 PrefabInstance 节点才需要添加或更新 PrefabInfo
                if (!prefabInfo || !prefabInfo.root?.['_prefab']?.instance) {
                    if (rootPrefabInfo.root) {
                        utils_1.prefabUtils.addPrefabInfo(node, rootPrefabInfo.root, rootPrefabInfo.asset);
                    }
                    else {
                        console.warn('root of PrefabInfo is null, set to root node');
                        // 将 root 指向自己
                        rootPrefabInfo.root = rootNode;
                        utils_1.prefabUtils.addPrefabInfo(node, rootPrefabInfo.root, rootPrefabInfo.asset);
                    }
                }
            }
        }
    }
    /**
     * 当一个组件需要引用到别的 PrefabInstance 中的
     * @param target 要检查的组件
     * @param diffInfo 差异数据
     * @param root 根节点
     * @returns
     */
    checkToAddTargetOverride(target, diffInfo, root) {
        if (!(target instanceof cc_1.Component)) {
            return false;
        }
        const propValue = diffInfo.value;
        // @ts-ignore
        const rootPrefabInfo = root['_prefab'];
        // 设置 Component 的某个属性为空，需要判断是否清除 TargetOverrides
        if ((propValue === null || propValue === undefined) && target) {
            utils_1.prefabUtils.removeTargetOverride(rootPrefabInfo, target, diffInfo.pathKeys);
            return false;
        }
        let checkNode = null;
        if (propValue instanceof cc_1.Node) {
            checkNode = propValue;
        }
        else if (propValue instanceof cc_1.Component) {
            checkNode = propValue.node;
        }
        if (!checkNode) {
            return false;
        }
        const checkPrefabInfo = utils_1.prefabUtils.getPrefab(checkNode);
        if (!checkPrefabInfo) {
            return false;
        }
        // 向上查找 PrefabInstance 路径
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(checkNode);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return false;
        }
        if (propValue instanceof cc_1.Node && outMostPrefabInstanceNode === propValue) {
            // 最外的 Instance 根节点，不需要通过 TargetOverrides 来重新映射了，直接存场景索引就可以找到
            utils_1.prefabUtils.removeTargetOverride(rootPrefabInfo, target, diffInfo.pathKeys);
            return false;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        if (outMostPrefabInstance) {
            targetPath.splice(0, 1); // 不需要存最外层的 PrefabInstance 的 fileID
            // 只处理component
            if (propValue instanceof cc_1.Node) {
                // @ts-ignore
                const prefabInfo = propValue['_prefab'];
                if (prefabInfo && prefabInfo.fileId) {
                    targetPath.push(prefabInfo.fileId);
                }
                else {
                    console.error(`can't get fileId of prefab node: ${propValue.name}`);
                    return false;
                }
            }
            else if (propValue instanceof cc_1.Component) {
                // @ts-ignore
                const compPrefabInfo = propValue.__prefab;
                if (compPrefabInfo && compPrefabInfo.fileId) {
                    targetPath.push(compPrefabInfo.fileId);
                }
                else {
                    // 非 mounted 的 component 才需要报错
                    if (!utils_1.prefabUtils.getMountedRoot(propValue)) {
                        console.error(`can't get fileId of prefab component: ${propValue.name} in node: ${propValue.node.name}`);
                    }
                    return false;
                }
            }
            // get root prefabInfo
            // scene or root in prefabAsset
            if (!root) {
                return false;
            }
            // @ts-ignore
            if (!root['_prefab']) {
                // @ts-ignore
                root['_prefab'] = utils_1.prefabUtils.createPrefabInfo(root.uuid);
            }
            // @ts-ignore
            const rootPrefabInfo = root['_prefab'];
            const targetOverride = utils_1.prefabUtils.getTargetOverride(rootPrefabInfo, target, diffInfo.pathKeys);
            if (targetOverride) {
                utils_1.prefabUtils.fireBeforeChangeMsg(root);
                targetOverride.target = outMostPrefabInstanceNode;
                const targetInfo = new TargetInfo();
                targetInfo.localID = targetPath;
                targetOverride.targetInfo = targetInfo;
                utils_1.prefabUtils.fireChangeMsg(root);
                return true;
            }
        }
        return false;
    }
    // 对比当前节点和对应预制体原始资源中的数据的差异
    checkToAddPropertyOverrides(node, pathKeys, root) {
        // 获取节点所属预制体的相关信息
        const propertyOverrideLocation = utils_1.prefabUtils.getPropertyOverrideLocationInfo(node, pathKeys);
        if (!propertyOverrideLocation) {
            return;
        }
        const outMostPrefabInstanceNode = propertyOverrideLocation.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return;
        }
        // @ts-ignore
        const outMostPrefabInfo = outMostPrefabInstanceNode['_prefab'];
        if (!outMostPrefabInfo || !outMostPrefabInfo.asset) {
            return;
        }
        const outMostPrefabInstance = outMostPrefabInfo?.instance;
        if (!outMostPrefabInstance) {
            return;
        }
        const curTarget = propertyOverrideLocation.target;
        const mountedRoot = utils_1.prefabUtils.getMountedRoot(curTarget);
        // 如果修改的是一个在当前上下文下的 mounted 节点或组件，就不需要写 overrides，因为 mounted 的节点或组件本身就会被序列化
        if (mountedRoot && mountedRoot === outMostPrefabInstanceNode) {
            return;
        }
        const localID = propertyOverrideLocation.targetPath;
        const assetRootNode = utils_1.prefabUtils.getPrefabAssetNodeInstance(outMostPrefabInfo);
        if (!assetRootNode) {
            return;
        }
        const targetInAsset = utils_1.prefabUtils.getTarget(localID, assetRootNode);
        if (!targetInAsset) {
            console.debug(`can't find item: ${curTarget.name} in prefab asset ${outMostPrefabInfo.asset._uuid}`);
            return;
        }
        const propOverrides = utils_1.prefabUtils.getPropertyOverridesOfTarget(outMostPrefabInstance, localID);
        const diffInfos = this.getDiffPropertyInfos(curTarget, targetInAsset, [], this.isInPropertyOverrides.bind(this, propOverrides)); // 利用偏函数传入预设参数
        // 清除以前用 setter 记录下的数据
        // prefabUtil.removePropertyOverride(outMostPrefabInstance, localID, propertyOverrideLocation.relativePathKeys);
        if (diffInfos && diffInfos.length > 0) {
            utils_1.prefabUtils.fireBeforeChangeMsg(propertyOverrideLocation.outMostPrefabInstanceNode);
            for (let i = 0; i < diffInfos.length; i++) {
                const info = diffInfos[i];
                if (curTarget instanceof cc_1.Component && this.checkToAddTargetOverride(curTarget, info, root)) {
                    continue;
                }
                const propOverride = utils_1.prefabUtils.getPropertyOverride(outMostPrefabInstance, localID, info.pathKeys);
                propOverride.value = info.value;
            }
            if (root) {
                // diffPropertyInfos 获取到的差异信息,有些情况会漏掉，直接比较最准确
                this.addTargetOverrideWithModifyPath(node, pathKeys, root);
            }
            utils_1.prefabUtils.fireChangeMsg(propertyOverrideLocation.outMostPrefabInstanceNode);
        }
    }
    // 是否已经在 TargetOverride 记录中
    isInTargetOverrides(source, targetOverrides, pathKeys) {
        if (!targetOverrides) {
            return false;
        }
        return utils_1.prefabUtils.isInTargetOverrides(targetOverrides, source, pathKeys);
    }
    // 是否在 PropertyOverrides 中
    isInPropertyOverrides(propertyOverrides, pathKeys) {
        return utils_1.prefabUtils.isInPropertyOverrides(pathKeys, propertyOverrides);
    }
    /**
     * 对比得到两个 ccClass 的差异数据
     * @param curTarget 对比的对象
     * @param comparedTarget 被比较的对象
     * @param propPathKeys 当前对象的属性路径数组
     * @param isModifiedFunc 用于判断属性是否被修改的方法
     * @returns
     */
    getDiffPropertyInfos(curTarget, comparedTarget, propPathKeys, isModifiedFunc) {
        if (!curTarget) {
            return null;
        }
        const curTargetCtor = curTarget.constructor;
        const comparedTargetCtor = comparedTarget.constructor;
        if (!curTargetCtor || !comparedTargetCtor || curTargetCtor !== comparedTargetCtor) {
            return null;
        }
        // @ts-ignore
        const props = curTargetCtor.__values__; // 可序列化的属性都放在这里边
        const excludeProps = getDiffExcludeProps(curTargetCtor);
        let diffPropertyInfos = [];
        props.map((key) => {
            if (excludeProps.includes(key)) {
                return;
            }
            const attr = cc_1.CCClass.attr(curTargetCtor, key);
            if (attr.serializable === false) {
                return;
            }
            const curPropValue = curTarget[key];
            const comparedPropValue = comparedTarget[key];
            const infos = this.handleDiffPropertyInfos(curPropValue, comparedPropValue, key, propPathKeys, isModifiedFunc);
            diffPropertyInfos = diffPropertyInfos.concat(infos);
        });
        return diffPropertyInfos;
    }
    handleDiffPropertyInfos(curPropValue, comparedPropValue, propName, propPathKeys, isModifiedFunc) {
        let diffPropertyInfos = [];
        const pathKeys = propPathKeys.concat(propName);
        const diffProp = {
            pathKeys,
            value: curPropValue,
        };
        if (curPropValue === null || curPropValue === undefined) {
            if (curPropValue !== comparedPropValue || isModifiedFunc(pathKeys)) {
                diffPropertyInfos.push(diffProp);
            }
        }
        else {
            if (comparedPropValue === null || comparedPropValue === undefined || isModifiedFunc(pathKeys)) {
                diffPropertyInfos.push(diffProp);
            }
            else {
                // 两个需要对比的值都非空，需要进行更详细的对比
                if (Array.isArray(curPropValue)) {
                    // 数组长度发生变化，需要记录
                    const lengthPathKeys = pathKeys.concat('length');
                    if (curPropValue.length !== comparedPropValue.length || isModifiedFunc(lengthPathKeys)) {
                        const lengthDiffProp = {
                            pathKeys: lengthPathKeys,
                            value: curPropValue.length,
                        };
                        diffPropertyInfos.push(lengthDiffProp);
                    }
                    for (let i = 0; i < curPropValue.length; i++) {
                        const infos = this.handleDiffPropertyInfos(curPropValue[i], comparedPropValue[i], '' + i, pathKeys, isModifiedFunc);
                        if (infos && infos.length > 0) {
                            diffPropertyInfos = diffPropertyInfos.concat(infos);
                        }
                    }
                }
                else if (typeof curPropValue === 'object') {
                    if (curPropValue instanceof cc_1.Node) {
                        // @ts-ignore
                        const prefabInfo = curPropValue['_prefab'];
                        // 普通节点用 uuid 比较，prefab 用 fileId 比较（可能会有相同，之后再 fix）
                        if ((prefabInfo && prefabInfo.fileId !== comparedPropValue['_prefab']?.fileId) ||
                            curPropValue.uuid !== comparedPropValue.uuid) {
                            diffPropertyInfos.push(diffProp);
                        }
                    }
                    else if (curPropValue instanceof cc_1.Component) {
                        // 普通组件组件用 uuid 比较，prefab 用 fileId 比较（可能会有相同，之后再 fix）
                        if ((curPropValue.__prefab && curPropValue.__prefab.fileId !== comparedPropValue.__prefab?.filedId) ||
                            curPropValue.uuid !== comparedPropValue.uuid) {
                            diffPropertyInfos.push(diffProp);
                        }
                    }
                    else if (curPropValue instanceof cc_1.ValueType) {
                        if (!curPropValue.equals(comparedPropValue) || isModifiedFunc(pathKeys)) {
                            diffPropertyInfos.push(diffProp);
                        }
                    }
                    else if (curPropValue instanceof cc_1.Asset) {
                        if (curPropValue._uuid !== comparedPropValue._uuid || isModifiedFunc(pathKeys)) {
                            diffPropertyInfos.push(diffProp);
                        }
                    }
                    else if (cc_1.CCClass.isCCClassOrFastDefined(curPropValue.constructor)) {
                        const infos = this.getDiffPropertyInfos(curPropValue, comparedPropValue, pathKeys, isModifiedFunc);
                        if (infos && infos.length > 0) {
                            diffPropertyInfos = diffPropertyInfos.concat(infos);
                        }
                    }
                }
                else {
                    // primitive type
                    if (curPropValue !== comparedPropValue || isModifiedFunc(pathKeys)) {
                        diffPropertyInfos.push(diffProp);
                    }
                }
            }
        }
        return diffPropertyInfos;
    }
    /**
     * 直接通过修改节点路径来判断添加 targetOverride 信息
     * @param node 修改的节点
     * @param pathKeys 属性键值路径
     * @param root
     */
    addTargetOverrideWithModifyPath(node, pathKeys, root) {
        let value = node;
        let comp = null;
        for (let index = 0; index < pathKeys.length; index++) {
            const key = pathKeys[index];
            if (!value)
                break;
            // @ts-ignore
            value = value[key];
            if (index === 1 && pathKeys[0] === '_components') {
                // 组件必然是_components[x]开头
                // @ts-ignore
                comp = value;
            }
        }
        if (value !== node && comp) {
            // 必须移除掉组件的路径，因为targetOverrideInfo是存的comp而不是node
            pathKeys.shift();
            pathKeys.shift();
            this.checkToAddTargetOverride(comp, { pathKeys: pathKeys, value: value }, root);
        }
    }
    checkToAddPrefabAssetMap(node) {
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        const prefabInstance = prefabInfo?.instance;
        if (prefabInstance && prefabInfo?.asset) {
            let nodes = this.assetToNodesMap.get(prefabInfo.asset._uuid);
            if (!nodes) {
                nodes = [];
                this.assetToNodesMap.set(prefabInfo.asset._uuid, nodes);
            }
            if (!nodes.includes(node)) {
                nodes.push(node);
            }
        }
    }
    onNodeChangedInGeneralMode(node, opts, root) {
        if (!opts) {
            return;
        }
        if (opts.type === common_1.NodeEventType.CHILD_CHANGED) {
            this.updateChildrenData(node);
            return;
        }
        else if (opts.type === common_1.NodeEventType.PARENT_CHANGED) {
            if (core_1.Service.Editor.getCurrentEditorType() === 'prefab') {
                const prefabInstance = node['_prefab']?.instance;
                if (prefabInstance) {
                    prefabInstance.prefabRootNode = root;
                }
            }
        }
        if (opts.propPath === 'children' && opts.type === common_1.NodeEventType.MOVE_ARRAY_ELEMENT) {
            // 不记录 children 的变动值到 override 中
            return;
        }
        // 修改 PrefabInstance 中节点数据，要保存在最外层的 PrefabInstance中
        if (opts.propPath) {
            const key = node.uuid + '|' + opts.propPath;
            this._timerUtil.callFunctionLimit(key, this.checkToAddOverrides.bind(this), node, opts.propPath, root);
        }
        this._timerUtil.callFunctionLimit(node.uuid, this.updateSpecialComponent.bind(this), node, opts.propPath, root);
    }
    /**
     * 判断是否是需要保留的 PropertyOverride
     * @param propOverride Prefab 实例
     * @param prefabRootFileId prefab 根节点的 FileId
     */
    isReservedPropertyOverrides(propOverride, prefabRootFileId) {
        const targetInfo = propOverride.targetInfo;
        if (targetInfo?.localID.length === 1 && targetInfo.localID[0] === prefabRootFileId) {
            const propPath = propOverride.propertyPath;
            if (propPath.length === 1 && RootReservedProperty.includes(propPath[0])) {
                return true;
            }
        }
        return false;
    }
    /**
     * 移除实例的 PropertyOverrides，保留一些一般不需要和 PrefabAsset 自动同步的覆盖
     * @param prefabInstance Prefab 实例
     * @param prefabRootFileId prefab 根节点的 FileId
     */
    removeModifiedPropertyOverrides(prefabInstance, prefabRootFileId) {
        const reservedPropertyOverrides = [];
        for (let i = 0; i < prefabInstance.propertyOverrides.length; i++) {
            const propOverride = prefabInstance.propertyOverrides[i];
            if (this.isReservedPropertyOverrides(propOverride, prefabRootFileId)) {
                reservedPropertyOverrides.push(propOverride);
            }
        }
        prefabInstance.propertyOverrides = reservedPropertyOverrides;
    }
    // 处理嵌套节点的 Override，要从场景的 instance 写到 prefab 资源中的嵌套子节点上的 instance 的 override 中
    applyMountedChildren(node) {
        const rootNode = node;
        const prefabInfo = utils_1.prefabUtils.getPrefab(rootNode);
        if (!prefabInfo || !prefabInfo.instance)
            return;
        const prefabInstance = prefabInfo.instance;
        const mountedChildrenMap = new Map();
        const mountedChildren = prefabInstance.mountedChildren;
        for (let i = 0; i < mountedChildren.length; i++) {
            const mountedChildInfo = mountedChildren[i];
            const targetInfo = mountedChildInfo.targetInfo;
            if (!targetInfo) {
                continue;
            }
            // localID 长度大于1，表示是加到了嵌套的 PrefabInstance 节点中去了
            if (targetInfo.localID.length > 1) {
                // 需要将 mounted 的信息加到嵌套的那个 PrefabInstance 中去
                const target = utils_1.prefabUtils.getTarget(targetInfo.localID, rootNode);
                // 找下一级的 PrefabInstance
                prefabInfo.instance = undefined;
                const nestedInstPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(target);
                prefabInfo.instance = prefabInstance;
                const nestedInstNode = nestedInstPrefabInstanceInfo.outMostPrefabInstanceNode;
                if (!nestedInstNode) {
                    continue;
                }
                // @ts-ignore
                const nestedInstPrefabInfo = nestedInstNode['_prefab'];
                if (!nestedInstPrefabInfo) {
                    continue;
                }
                const nestedInstPrefabInstance = nestedInstPrefabInfo.instance;
                if (!nestedInstPrefabInstance) {
                    continue;
                }
                const targetPath = nestedInstPrefabInstanceInfo.targetPath.slice();
                const mountedParentPath = nestedInstPrefabInstanceInfo.targetPath.slice(1);
                const targetFileId = utils_1.prefabUtils.getPrefab(target)?.fileId;
                if (!targetFileId) {
                    continue;
                }
                mountedParentPath.push(targetFileId);
                const nestedMountedChildInfo = utils_1.prefabUtils.getPrefabInstanceMountedChildren(nestedInstPrefabInstance, mountedParentPath);
                mountedChildInfo.nodes.forEach((mountedNode) => {
                    // @ts-ignore
                    const oldPrefabInfo = mountedNode['_prefab'];
                    utils_1.prefabUtils.addPrefabInfo(mountedNode, nestedInstNode, nestedInstPrefabInfo.asset);
                    utils_1.prefabUtils.setMountedRoot(mountedNode, nestedInstNode);
                    // @ts-ignore
                    const mountedNodePrefabInfo = mountedNode['_prefab'];
                    if (!mountedNodePrefabInfo) {
                        return;
                    }
                    // 找到原来的 mounted 节点，在新的 Prefab 下的 LocalID，以便还原时候根据它来查找节点
                    targetPath.push(mountedNodePrefabInfo.fileId);
                    mountedChildrenMap.set(targetPath, { prefabInfo: oldPrefabInfo });
                });
                nestedMountedChildInfo.nodes = nestedMountedChildInfo.nodes.concat(mountedChildInfo.nodes);
            }
            else {
                // 没有嵌套的的 mounted 节点会直接成为 PrefabAsset 里的节点
                mountedChildInfo.nodes.forEach((mountedNode) => {
                    // @ts-ignore
                    let mountedNodePrefabInfo = utils_1.prefabUtils.getPrefab(mountedNode);
                    utils_1.prefabUtils.setMountedRoot(mountedNode, undefined);
                    if (!mountedNodePrefabInfo) {
                        utils_1.prefabUtils.addPrefabInfo(mountedNode, node, prefabInfo.asset);
                        mountedNodePrefabInfo = utils_1.prefabUtils.getPrefab(mountedNode);
                    }
                    else {
                        // 非 instance 才要换 asset
                        if (!mountedNodePrefabInfo.instance) {
                            utils_1.prefabUtils.addPrefabInfo(mountedNode, node, prefabInfo.asset);
                        }
                    }
                    mountedChildrenMap.set([mountedNodePrefabInfo.fileId], { prefabInfo: null });
                });
            }
        }
        prefabInstance.mountedChildren = [];
        return mountedChildrenMap;
    }
    applyPropertyOverrides(node) {
        const rootNode = node;
        // @ts-ignore
        const prefabInfo = rootNode['_prefab'];
        if (!prefabInfo) {
            return;
        }
        const prefabInstance = prefabInfo.instance;
        if (!prefabInstance) {
            return;
        }
        const propertyOverrides = prefabInstance.propertyOverrides;
        const reservedPropertyOverrides = [];
        for (let i = 0; i < propertyOverrides.length; i++) {
            const propOverride = propertyOverrides[i];
            // 保留一些一般不需要和 PrefabAsset 自动同步的 override
            if (this.isReservedPropertyOverrides(propOverride, prefabInfo.fileId)) {
                reservedPropertyOverrides.push(propOverride);
                continue;
            }
            const targetInfo = propOverride.targetInfo;
            if (!targetInfo) {
                continue;
            }
            // localID 长度大于1，表示是加到了嵌套的 PrefabInstance 节点中去了
            if (targetInfo.localID.length > 1) {
                // 需要将 mounted 的信息加到嵌套的那个 PrefabInstance 中去
                const target = utils_1.prefabUtils.getTarget(targetInfo.localID, rootNode);
                if (!target) {
                    continue;
                }
                let targetNode = target;
                if (targetNode instanceof cc_1.Component) {
                    targetNode = targetNode.node;
                }
                // 找下一级的 PrefabInstance
                prefabInfo.instance = undefined;
                const nestedInstPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(targetNode);
                prefabInfo.instance = prefabInstance;
                const nestedInstNode = nestedInstPrefabInstanceInfo.outMostPrefabInstanceNode;
                if (!nestedInstNode) {
                    continue;
                }
                // @ts-ignore
                const nestedInstPrefabInfo = nestedInstNode['_prefab'];
                if (!nestedInstPrefabInfo) {
                    continue;
                }
                const nestedInstPrefabInstance = nestedInstPrefabInfo.instance;
                if (!nestedInstPrefabInstance) {
                    continue;
                }
                const targetPath = nestedInstPrefabInstanceInfo.targetPath.slice();
                targetPath.splice(0, 1);
                // @ts-ignore
                const targetPrefabInfo = target instanceof cc_1.Node ? target['_prefab'] : target.__prefab;
                if (!targetPrefabInfo) {
                    continue;
                }
                targetPath.push(targetPrefabInfo.fileId);
                const nestedPropOverride = utils_1.prefabUtils.getPropertyOverride(nestedInstPrefabInstance, targetPath, propOverride.propertyPath);
                nestedPropOverride.value = propOverride.value;
            }
            else {
                // 没有嵌套的的 override 数据会直接存到 PrefabAsset 的节点上
            }
        }
        prefabInstance.propertyOverrides = reservedPropertyOverrides;
    }
    // 更新脚本中预制体 child 引用的值到预制体资源
    applyTargetOverrides(node) {
        const appliedTargetOverrides = [];
        // 场景节点或 prefab 资源中的根节点
        const sceneRootNode = core_1.Service.Editor.getRootNode();
        if (!sceneRootNode) {
            return appliedTargetOverrides;
        }
        const sceneRootNodePrefabInfo = utils_1.prefabUtils.getPrefab(sceneRootNode);
        if (!sceneRootNodePrefabInfo) {
            return appliedTargetOverrides;
        }
        const prefabInfo = utils_1.prefabUtils.getPrefab(node);
        if (!prefabInfo) {
            return appliedTargetOverrides;
        }
        const prefabInstance = prefabInfo.instance;
        if (!prefabInstance) {
            return appliedTargetOverrides;
        }
        if (sceneRootNodePrefabInfo.targetOverrides) {
            for (let i = sceneRootNodePrefabInfo.targetOverrides.length - 1; i >= 0; i--) {
                const targetOverride = sceneRootNodePrefabInfo.targetOverrides[i];
                let source = targetOverride.source;
                const sourceNode = source instanceof cc_1.Component ? source.node : source;
                const sourceInfo = targetOverride.sourceInfo;
                if (sourceInfo) {
                    if (source instanceof cc_1.Node) {
                        const node = utils_1.prefabUtils.getTarget(sourceInfo.localID, source);
                        source = node ? node : source;
                    }
                }
                const targetInfo = targetOverride.targetInfo;
                if (!targetInfo) {
                    continue;
                }
                const targetInstance = targetOverride.target?.['_prefab']?.instance;
                if (!targetInstance) {
                    continue;
                }
                const t = targetOverride.target;
                const target = t ? utils_1.prefabUtils.getTarget(targetInfo.localID, t) : null;
                if (!target) {
                    // Can't find target
                    continue;
                }
                const targetNode = target instanceof cc_1.Component ? target.node : target;
                if (!sourceNode || !targetNode) {
                    continue;
                }
                // 如果引用和被引用的节点都在 prefab 中，就要把 targetOverride 信息更新掉;
                if ((0, node_utils_1.isPartOfNode)(sourceNode, node) && (0, node_utils_1.isPartOfNode)(targetNode, node)) {
                    if (!prefabInfo.targetOverrides) {
                        prefabInfo.targetOverrides = [];
                    }
                    let sourceInAsset = source;
                    const assetTargetOverride = new TargetOverrideInfo();
                    assetTargetOverride.propertyPath = targetOverride.propertyPath;
                    // 更新 source 相关数据
                    const sourceLocalID = sourceInfo?.localID;
                    if (sourceLocalID) {
                        if (targetOverride.source instanceof cc_1.Node) {
                            const sourceComp = utils_1.prefabUtils.getTarget(sourceLocalID, targetOverride.source);
                            if (sourceComp) {
                                sourceInAsset = sourceComp;
                            }
                        }
                    }
                    let targetInAsset = targetOverride.target;
                    // 更新 target 相关数据
                    const assetTargetLocalID = targetInfo.localID;
                    if (assetTargetLocalID) {
                        // 这里和 source 不同的地方是，对 target 的索引是通过 PrefabInstance 的 FileId + 节点/组件的 FileId
                        // source 的索引可以没有 source 所在节点的 PrefabInstance 的 FileId
                        if (targetOverride.target instanceof cc_1.Node) {
                            const target = utils_1.prefabUtils.getTarget(assetTargetLocalID, targetOverride.target);
                            if (target) {
                                targetInAsset = target;
                            }
                        }
                    }
                    prefabInfo.instance = undefined;
                    this.checkToAddTargetOverride(sourceInAsset, {
                        pathKeys: targetOverride.propertyPath,
                        value: targetInAsset,
                    }, node);
                    prefabInfo.instance = prefabInstance;
                    // 清理掉 targetOverride 数据
                    sceneRootNodePrefabInfo.targetOverrides.splice(i, 1);
                }
                appliedTargetOverrides.push(targetOverride);
            }
        }
        return appliedTargetOverrides;
    }
    applyRemovedComponents(node) {
        const rootNode = node;
        // @ts-ignore
        const prefabInfo = rootNode['_prefab'];
        if (!prefabInfo) {
            return;
        }
        const prefabInstance = prefabInfo.instance;
        if (!prefabInstance) {
            return;
        }
        const assetRootNode = utils_1.prefabUtils.getPrefabAssetNodeInstance(prefabInfo);
        if (!assetRootNode) {
            return null;
        }
        const removedComponents = prefabInstance.removedComponents;
        for (let i = 0; i < removedComponents.length; i++) {
            const targetInfo = removedComponents[i];
            if (!targetInfo) {
                continue;
            }
            // localID 长度大于1，表示是加到了嵌套的 PrefabInstance 节点中去了
            if (targetInfo.localID.length > 1) {
                const targetCompInAsset = utils_1.prefabUtils.getTarget(targetInfo.localID, assetRootNode);
                if (!targetCompInAsset || !targetCompInAsset.__prefab) {
                    continue;
                }
                const targetNodeInAsset = targetCompInAsset.node;
                const targetNodeInAssetPrefabInfo = utils_1.prefabUtils.getPrefab(targetNodeInAsset);
                if (!targetCompInAsset || !targetNodeInAssetPrefabInfo) {
                    continue;
                }
                // 先在 PrefabAsset 找到删除的 component 所在的节点的 localID，因为删除的 component 在当前
                // PrefabInstance 中已经不在了，无法通过 component 的 FileId 来找了，所以要通过找 node，
                // 然后再找下一层级的 PrefabInstance
                const targetNodeLocalID = targetInfo.localID.slice();
                targetNodeLocalID.pop();
                targetNodeLocalID.push(targetNodeInAssetPrefabInfo.fileId);
                // 在当前 PrefabInstance 中查找节点
                const curTargetNode = utils_1.prefabUtils.getTarget(targetNodeLocalID, rootNode);
                // 找下一级的 PrefabInstance
                prefabInfo.instance = undefined;
                const nestedInstPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(curTargetNode);
                prefabInfo.instance = prefabInstance;
                const nestedInstNode = nestedInstPrefabInstanceInfo.outMostPrefabInstanceNode;
                if (!nestedInstNode) {
                    continue;
                }
                const nestedInstPrefabInfo = utils_1.prefabUtils.getPrefab(nestedInstNode);
                if (!nestedInstPrefabInfo) {
                    continue;
                }
                const nestedInstPrefabInstance = nestedInstPrefabInfo.instance;
                if (!nestedInstPrefabInstance) {
                    continue;
                }
                const targetPath = nestedInstPrefabInstanceInfo.targetPath.slice();
                targetPath.splice(0, 1);
                targetPath.push(targetCompInAsset.__prefab.fileId);
                const newTargetInfo = new TargetInfo();
                newTargetInfo.localID = targetPath;
                nestedInstPrefabInstance.removedComponents.push(newTargetInfo);
            }
        }
        prefabInstance.removedComponents = [];
    }
    async waitForSceneLoaded() {
        return new Promise((r, _) => {
            core_1.Service.Editor.reload({}).then(() => {
                r(true);
            });
        });
    }
    /**
     * 将一个 PrefabInstance 的数据应用到对应的 Asset 资源上
     * @param nodeUUID uuid
     */
    async applyPrefab(nodeUUID) {
        return await this.doApplyPrefab(nodeUUID);
    }
    async doApplyPrefab(nodeUUID) {
        const node = nodeMgr.getNode(nodeUUID);
        if (!node)
            return null;
        const prefabInfo = utils_1.prefabUtils.getPrefab(node);
        const prefabInstance = prefabInfo?.instance;
        if (!prefabInstance || !prefabInfo?.asset)
            return null;
        const asset = prefabInfo.asset;
        // 如果是子资源，则不能应用
        if (utils_1.prefabUtils.isSubAsset(asset._uuid)) {
            console.warn('can\'t apply data to SubAsset Prefab');
            return null;
        }
        const oldPrefabContent = EditorExtends.serialize(asset);
        const info = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [asset._uuid]);
        if (!info)
            return null;
        // 把非预制体内的节点，更新到预制体信息中
        const mountedChildrenInfoMap = this.applyMountedChildren(node);
        if (!mountedChildrenInfoMap)
            return null;
        // 把非预制体内的组件，更新到预制体信息中
        const mountedComponentsInfoMap = component_1.componentOperation.applyMountedComponents(node);
        if (!mountedComponentsInfoMap)
            return null;
        this.applyPropertyOverrides(node);
        this.applyRemovedComponents(node);
        this.applyTargetOverrides(node);
        const ret = utils_1.prefabUtils.generatePrefabDataFromNode(node);
        if (!ret)
            return null;
        if (ret.clearedReference) {
            this.restoreClearedReference(node, ret.clearedReference);
        }
        try {
            await rpc_1.Rpc.getInstance().request('assetManager', 'saveAsset', [
                info.source, ret.prefabData,
            ]);
            utils_1.prefabUtils.removePrefabAssetNodeInstanceCache(prefabInfo);
        }
        catch (error) {
            console.error(error);
            return null;
        }
        return {
            nodeUUID,
            assetUuid: asset._uuid,
            assetSource: info.source,
            oldPrefabContent,
            newPrefabContent: ret.prefabData,
        };
    }
    updateChildrenData(node) {
        if (!node) {
            return;
        }
        // 如果当前正在移除 MountedChildren，则不需要更新这个数据了
        if (this.isRemovingMountedChildren) {
            return;
        }
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        // 如果节点不是一个Prefab就不用往下处理了
        if (!prefabInfo) {
            return;
        }
        // 如果最外层有一个 prefabInstance，就要记录到 prefabInstance 中成为一个 mountedChildren, 还需要保证顺序
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInfo = outMostPrefabInstanceNode['_prefab'];
        const outMostPrefabInstance = outMostPrefabInfo?.instance;
        if (!outMostPrefabInstanceNode || !outMostPrefabInfo || !outMostPrefabInstance) {
            return;
        }
        const assetRootNode = utils_1.prefabUtils.getPrefabAssetNodeInstance(outMostPrefabInfo);
        if (!assetRootNode) {
            return;
        }
        targetPath.splice(0, 1); // 不需要存最外层的 PrefabInstance 的 fileID，方便 override 可以在 PrefabInstance 复制后复用
        targetPath.push(prefabInfo.fileId);
        const nodeInAsset = utils_1.prefabUtils.getTarget(targetPath, assetRootNode);
        if (!nodeInAsset) {
            return;
        }
        const childrenFileIDs = nodeInAsset.children.map((child) => {
            // @ts-ignore
            const prefabInfo = child['_prefab'];
            if (!prefabInfo) {
                return;
            }
            if (prefabInfo.instance) {
                return prefabInfo.instance.fileId;
            }
            else {
                return prefabInfo.fileId;
            }
        });
        const addedChildren = [];
        for (let i = 0; i < node.children.length; i++) {
            const childNode = node.children[i];
            const childPrefabInfo = utils_1.prefabUtils.getPrefab(childNode);
            const childPrefabInstance = childPrefabInfo?.instance;
            // 可以写入 mountedChildren 的条件：
            // 1. 是一个普通节点
            // 2. 是一个不在别的 Prefab 资源里的新增节点
            if (!childPrefabInfo) {
                addedChildren.push(childNode);
            }
            else {
                const fileID = childPrefabInstance ? childPrefabInstance.fileId : childPrefabInfo.fileId;
                if (!childrenFileIDs.includes(fileID)) {
                    // 1. mountedRoot 为空表示为新加的节点
                    // 2. mountedRoot 不为空需要查看是不是挂在这个 PrefabInstance 节点下的，因为可能是挂在里层 PrefabInstance 里,这里就不应该重复添加
                    // 3. mountedRoot 不为空，并且 mountedRoot 不是 outMostPrefabInstanceNode 需要进行同步（fix: https://github.com/cocos/3d-tasks/issues/18516）
                    const mountedRoot = utils_1.prefabUtils.getMountedRoot(childNode);
                    if (!mountedRoot || mountedRoot === outMostPrefabInstanceNode || mountedRoot !== outMostPrefabInstanceNode) {
                        addedChildren.push(childNode);
                    }
                }
            }
        }
        utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);
        if (addedChildren.length > 0) {
            const addedChildInfo = utils_1.prefabUtils.getPrefabInstanceMountedChildren(outMostPrefabInstance, targetPath);
            addedChildInfo.nodes = addedChildren;
            addedChildInfo.nodes.forEach((childNode) => {
                utils_1.prefabUtils.setMountedRoot(childNode, outMostPrefabInstanceNode);
            });
        }
        else {
            for (let i = 0; i < outMostPrefabInstance.mountedChildren.length; i++) {
                const childInfo = outMostPrefabInstance.mountedChildren[i];
                if (childInfo.isTarget(targetPath)) {
                    childInfo.nodes.forEach((child) => {
                        utils_1.prefabUtils.setMountedRoot(child, undefined);
                    });
                    outMostPrefabInstance.mountedChildren.splice(i, 1);
                    break;
                }
            }
        }
        utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
    }
    isCircularRefPrefabInstance(checkNode, root) {
        // @ts-ignore
        const checkPrefabInfo = checkNode['_prefab'];
        if (!checkPrefabInfo) {
            return false;
        }
        const checkPrefabInstance = checkPrefabInfo.instance;
        if (!checkPrefabInstance) {
            return false;
        }
        if (checkNode === root) {
            return false;
        }
        function checkPrefabAssetEqual(nodeA, nodeB) {
            // @ts-ignore
            const prefabInfoA = nodeA['_prefab'];
            const prefabInstanceA = prefabInfoA?.instance;
            // @ts-ignore
            const prefabInfoB = nodeB['_prefab'];
            const prefabInstanceB = prefabInfoB?.instance;
            if (prefabInstanceA && prefabInstanceB && prefabInfoA?.asset?._uuid === prefabInfoB?.asset?._uuid) {
                return true;
            }
            return false;
        }
        if (checkPrefabAssetEqual(checkNode, root)) {
            return true;
        }
        let parent = checkNode.parent;
        if (!parent) {
            return false;
        }
        while (parent && parent !== root) {
            if (checkPrefabAssetEqual(checkNode, parent)) {
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }
    canBeMadeToPrefabAsset(node) {
        let hasTerrain = false;
        let hasNestedPrefab = false;
        node.walk((target) => {
            if (target.getComponent(cc_1.Terrain)) {
                hasTerrain = true;
            }
            if (this.isCircularRefPrefabInstance(target, node)) {
                console.warn(`Circular reference prefab checked: [${target.name}]`);
                hasNestedPrefab = true;
            }
        });
        if (hasTerrain) {
            console.warn('Can\'t create prefabAsset from a node that contains terrain');
            return false;
        }
        if (hasNestedPrefab) {
            console.warn('Can\'t create prefabAsset from a node that contains circular reference prefab');
            return false;
        }
        return true;
    }
    /**
     * 从一个节点生成一个 PrefabAsset
     * @param nodeUUID
     * @param url
     * @param options
     */
    async createPrefabAssetFromNode(nodeUUID, url, options = { overwrite: true }) {
        const node = nodeMgr.getNode(nodeUUID);
        if (!node) {
            return null;
        }
        const prefabInfo = utils_1.prefabUtils.getPrefab(node);
        if (prefabInfo) {
            const { outMostPrefabInstanceNode } = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
            // 是一个 PrefabAsset 中的子节点并且 PrefabAsset 被实例化了
            if (outMostPrefabInstanceNode !== node && node.isChildOf(outMostPrefabInstanceNode) && !utils_1.prefabUtils.getMountedRoot(node)) {
                console.warn('can\'t create prefabAsset from a prefabNode inside a prefabInstance');
                return null;
            }
            // 拖拽预制体时，需要更新所有的 propertyOverrides #17622
            const prefabInstance = prefabInfo.instance;
            if (prefabInstance) {
                this.applyPropertyOverrides(node);
            }
        }
        if (!this.canBeMadeToPrefabAsset(node)) {
            return null;
        }
        const ret = utils_1.prefabUtils.generatePrefabDataFromNode(node);
        if (!ret)
            return null;
        // 如果本身就是一个 prefab了，那就先从自动监听变动的列表删除，等后面 link 完再 softReload
        if (prefabInfo && prefabInfo.asset) {
            this.assetToNodesMap.delete(prefabInfo.asset._uuid);
        }
        const asset = await rpc_1.Rpc.getInstance().request('assetManager', 'createAsset', [{
                target: url,
                content: ret.prefabData,
                overwrite: options.overwrite,
            }]);
        let assetRootNode = null;
        if (asset) {
            assetRootNode = await this.replaceNewPrefabAssetWithClearedReference(node, asset.uuid, ret.clearedReference);
        }
        return assetRootNode;
    }
    /**
     *  应用被清理掉的引用数据
     * @param node 预制体实例节点
     * @param clearedReference 被清理掉的引用数据
     */
    restoreClearedReference(node, clearedReference) {
        const targetMap = {};
        cc_1.Prefab._utils.generateTargetMap(node, targetMap, true);
        // 如果拖拽的是普通节点，还原引用后，要更新 propertyOverrides/targetOverride 信息
        // 如果拖拽的是预制体，由于数据已经存在，所以可以不用更新
        for (const fileID in clearedReference) {
            const data = clearedReference[fileID];
            const localIDs = [data.component];
            const comp = cc_1.Prefab._utils.getTarget(localIDs, targetMap);
            if (comp) {
                // @ts-ignore 重新赋值
                comp[data.path] = data.value;
                // 更新 node 数据
                const node = comp.node;
                const index = comp.node.components.indexOf(comp);
                const opt = {
                    propPath: `__comps__.${index}.${data.path}`,
                    type: common_1.NodeEventType.SET_PROPERTY,
                };
                // 这个方法会更新 propertyOverrides/targetOverride 信息
                this.onNodeChangedInGeneralMode(node, opt, core_1.Service.Editor.getRootNode());
            }
        }
    }
    /**
     * 更新预制体资源后,替换场景中的预制体实例,并还原被清理掉的引用数据
     * @param node 待替换的节点
     * @param prefabAsset 新的预制体资源 uuid
     * @param clearedReference 被清除的对外部节点的引用数据
     */
    async replaceNewPrefabAssetWithClearedReference(node, prefabAsset, clearedReference) {
        // 移除原来的 node,加载新的预制体作为子节点
        const parent = node.parent;
        if (parent) {
            utils_1.prefabUtils.fireBeforeChangeMsg(parent);
            const index = node.getSiblingIndex();
            const prefab = await utils_2.sceneUtils.loadAny(prefabAsset);
            const assetRootNode = (0, cc_1.instantiate)(prefab);
            if (assetRootNode['_prefab'] && !assetRootNode['_prefab'].instance) {
                assetRootNode['_prefab'].instance = utils_1.prefabUtils.createPrefabInstance();
            }
            if (node['_prefab'] && node['_prefab'].instance && assetRootNode['_prefab'] && assetRootNode['_prefab'].instance) {
                assetRootNode['_prefab'].instance.fileId = node['_prefab'].instance.fileId;
            }
            this.createReservedPropertyOverrides(assetRootNode);
            // 同步 PropertyOverrides
            this.syncPropertyOverrides(assetRootNode, core_1.Service.Editor.getRootNode());
            this.restoreClearedReference(assetRootNode, clearedReference);
            node.parent = null;
            parent.insertChild(assetRootNode, index);
            utils_1.prefabUtils.fireChangeMsg(parent);
            return assetRootNode;
        }
        return null;
    }
    /**
     * 将一个 node 与一个 prefab 关联到一起
     * @param nodeUUID
     * @param {*} assetUuid 关联的资源
     */
    async linkNodeWithPrefabAsset(nodeUUID, assetUuid) {
        let node = null;
        if (typeof nodeUUID === 'string') {
            node = nodeMgr.getNode(nodeUUID);
        }
        else {
            node = nodeUUID;
        }
        if (!node) {
            return false;
        }
        let asset = assetUuid;
        if (typeof assetUuid === 'string') {
            // asset = cce.prefabUtil.serialize.asAsset(assetUuid);
            asset = await utils_2.sceneUtils.loadAny(assetUuid);
        }
        if (!asset) {
            console.error(`asset ${assetUuid} doesn't exist`);
            return false;
        }
        const assetRootNode = asset.data;
        if (!assetRootNode || !assetRootNode['_prefab']) {
            return;
        }
        utils_1.prefabUtils.fireBeforeChangeMsg(node);
        // @ts-ignore
        let prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            prefabInfo = new PrefabInfo();
            // @ts-ignore
            node['_prefab'] = prefabInfo;
        }
        utils_1.prefabUtils.removePrefabAssetNodeInstanceCache(prefabInfo);
        if (!prefabInfo.instance) {
            const prefabInstance = utils_1.prefabUtils.createPrefabInstance();
            // @ts-ignore
            const prefabInfo = node['_prefab'];
            if (prefabInfo) {
                // TBD 当 prefabInfo 是新建的时候，root 会为空
                prefabInstance.prefabRootNode = prefabInfo.root;
            }
            // @ts-ignore
            prefabInfo.instance = prefabInstance;
        }
        else {
            utils_1.prefabUtils.removeMountedRootInfo(node);
        }
        // 当前根节点的 fileId 同步为 PrefabAsset 根节点的 fileId 后，再创建默认根节点的 PropertyOverride
        prefabInfo.fileId = assetRootNode['_prefab'].fileId;
        prefabInfo.root = node;
        const prefabInstance = prefabInfo?.instance;
        if (prefabInfo && prefabInstance) {
            this.createReservedPropertyOverrides(node);
            // 去掉身上的各种 override,以便重新加载时完全用 PrefabAsset 的数据
            prefabInstance.mountedChildren = [];
            this.removeModifiedPropertyOverrides(prefabInstance, prefabInfo.fileId);
        }
        // @ts-ignore
        prefabInfo.asset = asset;
        utils_1.prefabUtils.fireChangeMsg(node);
        // 将 PrefabAsset 中的 PrefabInfo 同步到当前要 link 的节点上
        // 这里为了 Undo 能正常工作，不使用 softReload 的方式，需要注意处理好数据的一致性
        this.syncPrefabInfo(assetRootNode, node, node);
        // syncPrefabInfo may overwrite prefabInfo.asset with a null/uninitialized
        // value from the asset root node's _prefab.asset. Re-ensure the correct
        // reference on the root and propagate to children that syncPrefabInfo may
        // have skipped (e.g. when mounted children cause a structure mismatch).
        this.ensurePrefabAssetOnTree(node, asset);
        this.checkToAddPrefabAssetMap(node);
        return true;
    }
    /**
     * 把嵌套预制体的 PropertyOverrides 信息更新到新的预制体实例上
     * @param prefabNode 待同步的预制体节点
     * @param rootNode 带有所有预制体实例信息的根节点
     */
    syncPropertyOverrides(prefabNode, rootNode) {
        // collectInstanceOfRoot
        const roots = [];
        utils_1.prefabUtils.findOutmostPrefabInstanceNodes(rootNode, roots);
        if (roots.length > 0) {
            // collectInstanceOfPrefab
            const instanceNodes = new Map();
            prefabNode.walk((child) => {
                if (child['_prefab'] && child['_prefab'].instance) {
                    instanceNodes.set(child['_prefab'].instance.fileId, child);
                }
            });
            // sync property overrides
            for (let index = roots.length - 1; index >= 0; index--) {
                // @ts-ignore
                const prefabInfo = roots[index]['_prefab'];
                const instanceFileId = prefabInfo?.instance?.fileId;
                // @ts-ignore
                const targetFileId = prefabNode['_prefab'].instance?.fileId;
                if (instanceNodes.has(instanceFileId) && prefabInfo?.instance && prefabInfo.instance.propertyOverrides) {
                    // @ts-ignore
                    const targetPropOverrides = prefabNode['_prefab'].instance.propertyOverrides;
                    prefabInfo.instance.propertyOverrides.forEach((props) => {
                        // 部分保留属性不需要重复处理
                        if (!this.isReservedPropertyOverrides(props, prefabInfo.fileId)) {
                            targetPropOverrides.push(props);
                            // @ts-ignore
                            if (instanceFileId !== targetFileId && instanceFileId && props.targetInfo?.localID[0] !== instanceFileId) {
                                props.targetInfo?.localID.unshift(instanceFileId);
                            }
                        }
                    });
                }
            }
            // 需要更新属性
            const targetMap = {};
            cc_1.Prefab._utils.generateTargetMap(prefabNode, targetMap, true);
            // @ts-ignore
            cc_1.Prefab._utils.applyPropertyOverrides(prefabNode, prefabNode['_prefab'].instance.propertyOverrides, targetMap);
        }
    }
    // 将 PrefabAsset 中的 Prefab 信息同步到当前的节点上
    syncPrefabInfo(assetNode, dstNode, rootNode) {
        if (!assetNode || !dstNode || !rootNode) {
            return;
        }
        // @ts-ignore member access
        const srcPrefabInfo = assetNode['_prefab'];
        if (!srcPrefabInfo) {
            return;
        }
        utils_1.prefabUtils.fireBeforeChangeMsg(dstNode);
        // @ts-ignore member access
        if (!dstNode['_prefab']) {
            // @ts-ignore member access
            dstNode['_prefab'] = new PrefabInfo();
        }
        // @ts-ignore member access
        const dstPrefabInfo = dstNode['_prefab'];
        if (!dstPrefabInfo) {
            return;
        }
        // 嵌套的 prefab 子节点只需要同步一下新的 asset 和 prefabRootNode 就好了
        if (dstPrefabInfo.instance && dstNode !== rootNode) {
            dstPrefabInfo.asset = srcPrefabInfo.asset;
            dstPrefabInfo.instance.prefabRootNode = rootNode;
            utils_1.prefabUtils.fireChangeMsg(dstNode);
            return;
        }
        dstPrefabInfo.fileId = srcPrefabInfo.fileId;
        dstPrefabInfo.asset = srcPrefabInfo.asset;
        dstPrefabInfo.root = rootNode;
        if (assetNode.components.length !== dstNode.components.length) {
            console.error('Prefab Component doesn\'t match');
            return;
        }
        // copy component fileID
        for (let i = 0; i < assetNode.components.length; i++) {
            const srcComp = assetNode.components[i];
            const dstComp = dstNode.components[i];
            if (srcComp && srcComp.__prefab && dstComp) {
                if (!dstComp.__prefab) {
                    dstComp.__prefab = new CompPrefabInfo();
                }
                dstComp.__prefab.fileId = srcComp.__prefab.fileId;
            }
        }
        utils_1.prefabUtils.fireChangeMsg(dstNode);
        // 需要剔除掉私有 Node 的影响
        // 并且假设除去私有节点后，children 顺序和原来一致
        const dstChildren = [];
        dstNode.children.forEach((child) => {
            // 去掉不显示的节点
            if (child.objFlags & cc_1.CCObject.Flags.HideInHierarchy) {
                return;
            }
            dstChildren.push(child);
        });
        if (assetNode.children.length !== dstChildren.length) {
            console.error('Prefab Node doesn\'t match');
            return;
        }
        for (let i = 0; i < assetNode.children.length; i++) {
            const srcChildNode = assetNode.children[i];
            const dstChildNode = dstChildren[i];
            this.syncPrefabInfo(srcChildNode, dstChildNode, rootNode);
        }
    }
    ensurePrefabAssetOnTree(node, asset) {
        // @ts-ignore member access
        const prefabInfo = node['_prefab'];
        if (prefabInfo && !prefabInfo.asset) {
            prefabInfo.asset = asset;
        }
        for (const child of node.children ?? []) {
            // @ts-ignore member access
            const childPrefab = child['_prefab'];
            if (!childPrefab) {
                continue;
            }
            if (childPrefab.instance) {
                continue;
            }
            this.ensurePrefabAssetOnTree(child, asset);
        }
    }
    createReservedPropertyOverrides(node) {
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        const prefabInstance = prefabInfo?.instance;
        if (!prefabInfo || !prefabInstance) {
            return;
        }
        for (let i = 0; i < RootReservedProperty.length; i++) {
            const localID = [prefabInfo.fileId];
            const propPath = [RootReservedProperty[i]];
            const propValue = node[RootReservedProperty[i]];
            const propOverride = utils_1.prefabUtils.getPropertyOverride(prefabInstance, localID, propPath);
            propOverride.value = propValue;
        }
    }
    revertPropertyOverride(propOverride, curNodeTargetMap, assetTargetMap) {
        if (!propOverride || !propOverride.targetInfo) {
            return false;
        }
        const targetInfo = propOverride.targetInfo;
        const assetTarget = cc_1.Prefab._utils.getTarget(targetInfo.localID, assetTargetMap);
        const curTarget = cc_1.Prefab._utils.getTarget(targetInfo.localID, curNodeTargetMap);
        if (!assetTarget || !curTarget) {
            // Can't find target
            return false;
        }
        let node = null;
        if (curTarget instanceof cc_1.Node) {
            node = curTarget;
        }
        else if (curTarget instanceof cc_1.Component) {
            node = curTarget.node;
        }
        if (!node) {
            return false;
        }
        let assetTargetPropOwner = assetTarget;
        let curTargetPropOwner = curTarget;
        let curTargetPropOwnerParent = curTarget; // 用于记录最后数组所在的object
        let targetPropOwnerName = '';
        const propertyPath = propOverride.propertyPath.slice();
        if (propertyPath.length > 0) {
            const targetPropName = propertyPath.pop();
            if (!targetPropName) {
                return false;
            }
            for (let i = 0; i < propertyPath.length; i++) {
                const propName = propertyPath[i];
                targetPropOwnerName = propName;
                assetTargetPropOwner = assetTargetPropOwner[propName];
                curTargetPropOwnerParent = curTargetPropOwner;
                curTargetPropOwner = curTargetPropOwner[propName];
            }
            utils_1.prefabUtils.fireBeforeChangeMsg(node);
            curTargetPropOwner[targetPropName] = assetTargetPropOwner[targetPropName];
            // 如果是改数组元素，需要重新赋值一下自己以触发 setter
            if (Array.isArray(curTargetPropOwner) && curTargetPropOwnerParent && targetPropOwnerName) {
                curTargetPropOwnerParent[targetPropOwnerName] = curTargetPropOwner;
            }
            utils_1.prefabUtils.fireChangeMsg(node);
        }
        else {
            console.warn('property path is empty');
        }
        return true;
    }
    /**
     * 还原一个 PrefabInstance 的数据为它所关联的 PrefabAsset
     * @param nodeUUID node
     */
    async revertPrefab(nodeUUID) {
        let node = null;
        if (typeof nodeUUID === 'string') {
            node = nodeMgr.getNode(nodeUUID);
        }
        else {
            node = nodeUUID;
        }
        if (!node) {
            return false;
        }
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        const prefabInstance = prefabInfo?.instance;
        if (!prefabInstance || !prefabInfo?.asset) {
            return false;
        }
        const assetRootNode = (0, cc_1.instantiate)(prefabInfo.asset);
        if (!assetRootNode) {
            return false;
        }
        // @ts-ignore
        const curNodePrefabInfo = node['_prefab'];
        // @ts-ignore
        const assetRootNodePrefabInfo = assetRootNode['_prefab'];
        if (!curNodePrefabInfo || !assetRootNodePrefabInfo) {
            return false;
        }
        const assetTargetMap = {};
        const curNodeTargetMap = {};
        cc_1.Prefab._utils.generateTargetMap(assetRootNode, assetTargetMap, true);
        cc_1.Prefab._utils.generateTargetMap(node, curNodeTargetMap, true);
        utils_1.prefabUtils.fireBeforeChangeMsg(node);
        const reservedPropertyOverrides = [];
        for (let i = 0; i < prefabInstance.propertyOverrides.length; i++) {
            const propOverride = prefabInstance.propertyOverrides[i];
            if (this.isReservedPropertyOverrides(propOverride, prefabInfo.fileId)) {
                reservedPropertyOverrides.push(propOverride);
            }
            else {
                this.revertPropertyOverride(propOverride, curNodeTargetMap, assetTargetMap);
            }
        }
        prefabInstance.propertyOverrides = reservedPropertyOverrides;
        // 去掉额外添加的节点
        this.isRemovingMountedChildren = true; // 用于防止下面移除子节点时去更新mountedChildren里的数据
        for (let i = 0; i < prefabInstance.mountedChildren.length; i++) {
            const addedChildInfo = prefabInstance.mountedChildren[i];
            for (let j = 0; j < addedChildInfo.nodes.length; j++) {
                addedChildInfo.nodes[j].setParent(null);
            }
        }
        prefabInstance.mountedChildren = [];
        this.isRemovingMountedChildren = false;
        component_1.componentOperation.isRemovingMountedComponents = true;
        for (let i = 0; i < prefabInstance.mountedComponents.length; i++) {
            const mountedCompInfo = prefabInstance.mountedComponents[i];
            // 逆序，避免组件间有依赖关系导致报错
            const length = mountedCompInfo.components.length;
            for (let j = length - 1; j >= 0; j--) {
                const comp = mountedCompInfo.components[j];
                if (comp && comp.node) {
                    comp.node.removeComponent(comp);
                }
            }
        }
        // 需要立刻执行 removeComponent 操作，否则会延迟到下一帧
        cc.Object._deferredDestroy();
        prefabInstance.mountedComponents = [];
        component_1.componentOperation.isRemovingMountedComponents = false;
        component_1.componentOperation.isRevertingRemovedComponents = true;
        for (let i = 0; i < prefabInstance.removedComponents.length; i++) {
            const targetInfo = prefabInstance.removedComponents[i];
            const targetCompInAsset = cc_1.Prefab._utils.getTarget(targetInfo.localID, assetTargetMap);
            if (!targetCompInAsset) {
                continue;
            }
            const nodeLocalID = targetInfo.localID.slice();
            nodeLocalID.pop();
            // @ts-ignore
            nodeLocalID.push(targetCompInAsset.node['_prefab']?.fileId);
            const compNode = cc_1.Prefab._utils.getTarget(nodeLocalID, curNodeTargetMap);
            await component_1.componentOperation.cloneComponentToNode(compNode, targetCompInAsset);
        }
        prefabInstance.removedComponents = [];
        component_1.componentOperation.isRevertingRemovedComponents = false;
        utils_1.prefabUtils.fireChangeMsg(node);
        // 因为现在恢复的是私有变量，没有触发 setter，所以暂时只能 softReload 来保证效果正确
        await core_1.Service.Editor.reload({ preserveUndoHistory: true });
        return true;
    }
    removePrefabInfoFromNode(node, removeNested) {
        node.children.forEach((child) => {
            // @ts-ignore
            const childPrefabInstance = child['_prefab']?.instance;
            if (childPrefabInstance) {
                // 判断嵌套的 PrefabInstance 是否需要移除
                if (removeNested) {
                    this.removePrefabInfoFromNode(child, removeNested);
                }
            }
            else {
                this.removePrefabInfoFromNode(child, removeNested);
            }
        });
        utils_1.prefabUtils.removePrefabInfo(node);
    }
    removePrefabInfoFromInstanceNode(node, removeNested) {
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return false;
        }
        const prefabInstance = prefabInfo.instance;
        // 正常情况下只能在 PrefabInstance 上使用 unWrap
        // 如果资源丢失，也可以解除关系
        if (prefabInstance || !prefabInfo.asset) {
            // 移除 mountedRoot 信息
            utils_1.prefabUtils.removeMountedRootInfo(node);
            // remove prefabInfo
            utils_1.prefabUtils.walkNode(node, (target, isChild) => {
                // skip root
                if (!isChild) {
                    return false;
                }
                // @ts-ignore
                const targetPrefabInfo = target['_prefab'];
                if (!targetPrefabInfo) {
                    return true;
                }
                const targetPrefabInstance = targetPrefabInfo.instance;
                if (targetPrefabInstance || !targetPrefabInfo.asset) {
                    if (targetPrefabInstance && targetPrefabInstance.prefabRootNode === node) {
                        // 去掉子节点中的 PrefabInstance 的 prefabRootNode 对这个节点的指向
                        targetPrefabInstance.prefabRootNode = undefined;
                        utils_1.prefabUtils.fireChangeMsg(target);
                    }
                    if (removeNested) {
                        this.removePrefabInfoFromInstanceNode(target);
                    }
                    else {
                        return true;
                    }
                }
                else {
                    utils_1.prefabUtils.removePrefabInfo(target);
                }
                return false;
            });
            utils_1.prefabUtils.removePrefabInfo(node);
            return true;
        }
        return false;
    }
    removePrefabInstanceAndChangeRoot(node, rootNode, removeNested) {
        node.children.forEach((child) => {
            // @ts-ignore
            if (child['_prefab']?.instance) {
                // 判断嵌套的 PrefabInstance 是否需要移除
                if (removeNested) {
                    this.removePrefabInstanceAndChangeRoot(child, rootNode, removeNested);
                }
            }
            else {
                this.removePrefabInstanceAndChangeRoot(child, rootNode, removeNested);
            }
        });
        // @ts-ignore member access
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return;
        }
        utils_1.prefabUtils.fireBeforeChangeMsg(node);
        // @ts-ignore member access
        const rootPrefabInfo = rootNode['_prefab'];
        if (rootPrefabInfo) {
            prefabInfo.root = rootNode;
            prefabInfo.asset = rootPrefabInfo.asset;
        }
        if (prefabInfo.instance) {
            prefabInfo.instance = undefined;
        }
        // 解除嵌套的 Prefab 实例,内部节点退化为当前 Prefab 资源里的节点
        // 需要将它们的 PrefabInfo 中的 FileId 重新设置，否则由同一个资源
        // 实例化出来的多个 Prefab 实例，解除后它们的 FileId 会冲突
        prefabInfo.fileId = node.uuid;
        node.components.forEach((comp) => {
            if (comp.__prefab) {
                comp.__prefab.fileId = comp.uuid;
            }
        });
        utils_1.prefabUtils.fireChangeMsg(node);
    }
    /**
     * 解除 PrefabInstance 对 PrefabAsset 的关联
     * @param nodeUUID 节点或节点的 UUID
     * @param removeNested 是否递归的解除子节点 PrefabInstance
     */
    unWrapPrefabInstance(nodeUUID, removeNested) {
        let node = null;
        if (typeof nodeUUID === 'string') {
            node = nodeMgr.getNode(nodeUUID);
        }
        else {
            node = nodeUUID;
        }
        if (!node) {
            return false;
        }
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return false;
        }
        // 正常情况下只能在 PrefabInstance 上使用 unWrap
        // 如果资源丢失，也可以解除关系
        if (prefabInfo.instance || !prefabInfo.asset) {
            return this.removePrefabInfoFromInstanceNode(node, removeNested);
        }
        return false;
    }
    // 在 Prefab 编辑模式下不能移除 prefabInfo，只需要移除 instance
    unWrapPrefabInstanceInPrefabMode(nodeUUID, removeNested) {
        let node = null;
        if (typeof nodeUUID === 'string') {
            node = nodeMgr.getNode(nodeUUID);
        }
        else {
            node = nodeUUID;
        }
        if (!node) {
            return false;
        }
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return false;
        }
        let rootNode = node;
        const mountedRoot = utils_1.prefabUtils.getMountedRoot(node);
        if (mountedRoot) {
            // mounted 的 prefab 节点需要把 root 设置为当前 prefab 的根节点
            rootNode = core_1.Service.Editor.getRootNode();
        }
        else {
            // @ts-ignore private member access
            if (node.parent && node.parent['_prefab']) {
                // @ts-ignore private member access
                rootNode = node.parent['_prefab'].root;
            }
        }
        if (!rootNode) {
            return false;
        }
        // @ts-ignore
        const rootPrefabInfo = rootNode['_prefab'];
        if (!rootPrefabInfo) {
            return false;
        }
        // 正常情况下只能在 PrefabInstance 上使用 unWrap
        // 如果资源丢失，也可以解除关系
        if (prefabInfo.instance || !prefabInfo.asset) {
            // this.removePrefabInstanceAndChangeRoot(node, rootNode, removeNested);
            this.removePrefabInfoFromInstanceNode(node, removeNested);
            utils_1.prefabUtils.addPrefabInfo(node, rootNode, rootPrefabInfo.asset);
            // 解决子节点中的 PrefabInstance 的 FileId 冲突
            // 子节点中的 PrefabInstance 的 FileId 可能和当前场景的其它解除 PrefabInstance 的子节点中
            // 的 PrefabInstance 的 FileId 冲突，所以需要重新生成一个
            const instanceRoots = [];
            utils_1.prefabUtils.findOutmostPrefabInstanceNodes(node, instanceRoots);
            instanceRoots.forEach((instanceRoot) => {
                const rootPrefabInstance = instanceRoot?.['_prefab']?.instance;
                if (rootPrefabInstance) {
                    rootPrefabInstance.fileId = utils_1.prefabUtils.generateUUID();
                    utils_1.prefabUtils.fireChangeMsg(instanceRoot);
                }
            });
            return true;
        }
        return false;
    }
}
const nodeOperation = new NodeOperation();
exports.nodeOperation = nodeOperation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9wcmVmYWIvbm9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQkFnQlk7QUFDWixtQ0FBc0M7QUFDdEMsMkNBQWlEO0FBQ2pELG1EQUFnRTtBQUNoRSxrQ0FBa0M7QUFDbEMsNENBQW9FO0FBQ3BFLG1DQUFnQztBQUNoQyxvREFBZ0Q7QUFDaEQsMENBQTRDO0FBRTVDLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7QUFDbkMsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQztBQUd4QyxNQUFNLFVBQVUsR0FBRyxXQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztBQUU1QyxNQUFNLG9CQUFvQixHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUM7QUFHaEUsTUFBTSxjQUFjLEdBQUcsV0FBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7QUFFcEQsTUFBTSxVQUFVLEdBQUcsV0FBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFFNUMsTUFBTSxrQkFBa0IsR0FBRyxXQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0FBRTVELDZDQUE2QztBQUM3QyxNQUFNLG9CQUFvQixHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDbkUsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDO0FBTzlCLG1CQUFtQjtBQUNuQixNQUFNLGtCQUFrQixHQUFnQztJQUNwRCxTQUFTLEVBQUUsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLG9CQUFlLENBQUM7SUFDM0YsY0FBYyxFQUFFLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxvQkFBZSxD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QXFDO1lBQ3JDLGtFQUFrRTtZQUNsRSwwQ0FBMEM7WUFDMUMsTUFBTSxhQUFhLEdBQVcsRUFBRSxDQUFDO1lBQ2pDLG1CQUFXLENBQUMsOEJBQThCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2hFLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtnQkFDbkMsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLENBQUM7Z0JBQy9ELElBQUksa0JBQWtCLEVBQUUsQ0FBQztvQkFDckIsa0JBQWtCLENBQUMsTUFBTSxHQUFHLG1CQUFXLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3ZELG1CQUFXLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztDQUNKO0FBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUVqQyxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQXNzZXQsXG4gICAgYXNzZXRNYW5hZ2VyLFxuICAgIENDQ2xhc3MsXG4gICAgQ0NPYmplY3QsXG4gICAgQ29tcG9uZW50LFxuICAgIGVkaXRvckV4dHJhc1RhZyxcbiAgICBpbnN0YW50aWF0ZSxcbiAgICBqcyxcbiAgICBOb2RlLFxuICAgIFByZWZhYixcbiAgICBTY2VuZSxcbiAgICBUZXJyYWluLFxuICAgIFZhbHVlVHlwZSxcbiAgICBXaWRnZXQsXG4gICAgaXNWYWxpZCxcbn0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgcHJlZmFiVXRpbHMgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGNvbXBvbmVudE9wZXJhdGlvbiB9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7IGlzRWRpdG9yTm9kZSwgaXNQYXJ0T2ZOb2RlIH0gZnJvbSAnLi4vbm9kZS9ub2RlLXV0aWxzJztcbmltcG9ydCB7IFNlcnZpY2UgfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7IElDaGFuZ2VOb2RlT3B0aW9ucywgTm9kZUV2ZW50VHlwZSB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBScGMgfSBmcm9tICcuLi8uLi9ycGMnO1xuaW1wb3J0IHsgVGltZXJVdGlsIH0gZnJvbSAnLi4vdXRpbHMvdGltZXItdXRpbCc7XG5pbXBvcnQgeyBzY2VuZVV0aWxzIH0gZnJvbSAnLi4vc2NlbmUvdXRpbHMnO1xuXG5jb25zdCBub2RlTWdyID0gRWRpdG9yRXh0ZW5kcy5Ob2RlO1xuY29uc3QgY29tcE1nciA9IEVkaXRvckV4dGVuZHMuQ29tcG9uZW50O1xuXG50eXBlIFByZWZhYkluZm8gPSBQcmVmYWIuX3V0aWxzLlByZWZhYkluZm87XG5jb25zdCBQcmVmYWJJbmZvID0gUHJlZmFiLl91dGlscy5QcmVmYWJJbmZvO1xudHlwZSBQcm9wZXJ0eU92ZXJyaWRlSW5mbyA9IFByZWZhYi5fdXRpbHMuUHJvcGVydHlPdmVycmlkZUluZm87XG5jb25zdCBQcm9wZXJ0eU92ZXJyaWRlSW5mbyA9IFByZWZhYi5fdXRpbHMuUHJvcGVydHlPdmVycmlkZUluZm87XG50eXBlIFByZWZhYkluc3RhbmNlID0gUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZTtcbnR5cGUgQ29tcFByZWZhYkluZm8gPSBQcmVmYWIuX3V0aWxzLkNvbXBQcmVmYWJJbmZvO1xuY29uc3QgQ29tcFByZWZhYkluZm8gPSBQcmVmYWIuX3V0aWxzLkNvbXBQcmVmYWJJbmZvO1xudHlwZSBUYXJnZXRJbmZvID0gUHJlZmFiLl91dGlscy5UYXJnZXRJbmZvO1xuY29uc3QgVGFyZ2V0SW5mbyA9IFByZWZhYi5fdXRpbHMuVGFyZ2V0SW5mbztcbnR5cGUgVGFyZ2V0T3ZlcnJpZGVJbmZvID0gUHJlZmFiLl91dGlscy5UYXJnZXRPdmVycmlkZUluZm87XG5jb25zdCBUYXJnZXRPdmVycmlkZUluZm8gPSBQcmVmYWIuX3V0aWxzLlRhcmdldE92ZXJyaWRlSW5mbztcblxuLy8gc2NhbGUg6buY6K6k5LiNIG92ZXJyaWRl77yM5Zug5Li65qih5Z6L5b6A5b6A57yp5pS+5pyJ6Zeu6aKY77yM6L+Z5qC36YeN5a+85ZCO5bCx55u05o6l55Sf5pWI5LqGXG5jb25zdCBSb290UmVzZXJ2ZWRQcm9wZXJ0eSA9IFsnX25hbWUnLCAnX2xwb3MnLCAnX2xyb3QnLCAnX2V1bGVyJ107XG5jb25zdCBjb21wS2V5ID0gJ19jb21wb25lbnRzJztcblxuaW50ZXJmYWNlIElEaWZmUHJvcGVydHlJbmZvIHtcbiAgICBwYXRoS2V5czogc3RyaW5nW107IC8vIOebuOWvueS6juiKgueCueaIlue7hOS7tueahOWxnuaAp+afpeaJvui3r+W+hFxuICAgIHZhbHVlOiBhbnk7IC8vIOS/ruaUueWQjueahOWAvFxufVxuXG4vLyDlnKggZGlmZiDmr5TovoPliZTpmaTnmoTkuIDkupvlsZ7mgKdcbmNvbnN0IGRpZmZFeGNsdWRlUHJvcE1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmdbXSB9ID0ge1xuICAgICdjYy5Ob2RlJzogWydfb2JqRmxhZ3MnLCAnX3BhcmVudCcsICdfY2hpbGRyZW4nLCAnX2NvbXBvbmVudHMnLCAnX3ByZWZhYicsIGVkaXRvckV4dHJhc1RhZ10sXG4gICAgJ2NjLkNvbXBvbmVudCc6IFsnbm9kZScsICdfb2JqRmxhZ3MnLCBlZGl0b3JFeHRyYXNUYWddLFxufTtcblxuZnVuY3Rpb24gZ2V0RGlmZkV4Y2x1ZGVQcm9wcyhjdG9yOiBGdW5jdGlvbikge1xuICAgIGxldCBwcm9wczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3Qua2V5cyhkaWZmRXhjbHVkZVByb3BNYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBjb25zdCBjY0tscyA9IGpzLmdldENsYXNzQnlOYW1lKGtleSk7XG4gICAgICAgIGlmIChjY0tscyAmJiBqcy5pc0NoaWxkQ2xhc3NPZihjdG9yLCBjY0tscykpIHtcbiAgICAgICAgICAgIHByb3BzID0gcHJvcHMuY29uY2F0KGRpZmZFeGNsdWRlUHJvcE1hcFtrZXldKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByb3BzO1xufVxuXG5pbnRlcmZhY2UgSU5vZGVQcmVmYWJEYXRhIHtcbiAgICBwcmVmYWJJbmZvOiBQcmVmYWJJbmZvIHwgbnVsbDtcbn1cblxuaW50ZXJmYWNlIElBcHBseVByZWZhYkluZm8ge1xuICAgIG5vZGVVVUlEOiBzdHJpbmc7XG4gICAgYXNzZXRVdWlkOiBzdHJpbmc7XG4gICAgYXNzZXRTb3VyY2U6IHN0cmluZztcbiAgICBvbGRQcmVmYWJDb250ZW50OiBzdHJpbmc7XG4gICAgbmV3UHJlZmFiQ29udGVudDogc3RyaW5nO1xufVxuXG5cbmNsYXNzIE5vZGVPcGVyYXRpb24ge1xuICAgIHB1YmxpYyBhc3NldFRvTm9kZXNNYXA6IE1hcDxzdHJpbmcsIE5vZGVbXT4gPSBuZXcgTWFwKCk7IC8vIOWtmOWCqCBwcmVmYWIg6LWE5rqQ5ZKM5Zy65pmv6IqC54K555qE5YWz57O76KGoXG4gICAgcHVibGljIGlzUmVtb3ZpbmdNb3VudGVkQ2hpbGRyZW4gPSBmYWxzZTtcblxuICAgIF90aW1lclV0aWwgPSBuZXcgVGltZXJVdGlsKCk7XG5cbiAgICBwdWJsaWMgb25FZGl0b3JPcGVuZWQoKSB7XG4gICAgICAgIHRoaXMuYXNzZXRUb05vZGVzTWFwLmNsZWFyKCk7XG4gICAgICAgIGNvbXBvbmVudE9wZXJhdGlvbi5jbGVhckNvbXBDYWNoZSgpO1xuICAgICAgICBwcmVmYWJVdGlscy5jbGVhckNhY2hlKCk7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBpbiBub2RlTWdyLmdldE5vZGVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2RlTWdyLmdldE5vZGUodXVpZCk7XG5cbiAgICAgICAgICAgIC8vIOWcuuaZr+iKgueCueeJueauiuWkhOeQhlxuICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBTY2VuZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobm9kZSAmJiAhaXNFZGl0b3JOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja1RvQWRkUHJlZmFiQXNzZXRNYXAobm9kZSk7XG4gICAgICAgICAgICAgICAgbm9kZS5jb21wb25lbnRzLmZvckVhY2goKGNvbXApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50T3BlcmF0aW9uLmNhY2hlQ29tcChjb21wKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVSZW1vdmVkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBwcmVmYWJJbmZvPy5pbnN0YW5jZTtcbiAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlICYmIHByZWZhYkluZm8/LmFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IHRoaXMuYXNzZXRUb05vZGVzTWFwLmdldChwcmVmYWJJbmZvLmFzc2V0Ll91dWlkKTtcbiAgICAgICAgICAgIGlmIChub2Rlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOS/ruaUuSBQcmVmYWJJbnN0YW5jZSDkuK3oioLngrnmlbDmja7vvIzopoHkv53lrZjlnKjmnIDlpJblsYLnmoQgUHJlZmFiSW5zdGFuY2XkuK1cbiAgICBwcml2YXRlIGNoZWNrVG9BZGRPdmVycmlkZXMobm9kZTogTm9kZSwgaW5Qcm9wUGF0aDogc3RyaW5nLCByb290OiBOb2RlIHwgbnVsbCkge1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG5vZGUpO1xuICAgICAgICBpZiAoIW5vZGUgfHwgIWlzVmFsaWQobm9kZSkgfHwgKHByZWZhYkluZm8gJiYgIWlzVmFsaWQocHJlZmFiSW5mby5hc3NldCkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWluUHJvcFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb3BQYXRoID0gaW5Qcm9wUGF0aC5yZXBsYWNlKC9eX19jb21wc19fLywgY29tcEtleSk7XG4gICAgICAgIGNvbnN0IHBhdGhLZXlzOiBzdHJpbmdbXSA9IChwcm9wUGF0aCB8fCAnJykuc3BsaXQoJy4nKTtcblxuICAgICAgICBsZXQgY29tcDogQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgLy8g6Lev5b6E6YeM5pyJIF9fY29tcHNfXyDlsLHor7TmmI7mmK/nu4Tku7ZcbiAgICAgICAgaWYgKGluUHJvcFBhdGggIT09IHByb3BQYXRoICYmIHBhdGhLZXlzWzBdID09PSBjb21wS2V5KSB7XG4gICAgICAgICAgICBjb21wID0gKG5vZGVbcGF0aEtleXNbMF1dIGFzIGFueSlbcGF0aEtleXNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5rWL5piv5ZCm5pivIFByZWZhYkFzc2V0IOS4reeahOaZrumAmuiKgueCue+8iOmdnuW1jOWllyBQcmVmYWIg5Lit55qE6IqC54K577yJXG4gICAgICAgIGNvbnN0IGlzTm9ybWFsUHJlZmFiTm9kZSA9IHByZWZhYkluZm8gJiYgIXByZWZhYkluZm8ucm9vdD8uWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuXG4gICAgICAgIC8vIOaZrumAmuiKgueCueaIluiAhSBtb3VudGVkQ29tcG9uZW5077yM5Y+q6ZyA6KaB5Yik5pat5piv5ZCm6KaB5YqgIFRhcmdldE92ZXJyaWRl77yI5Zyo5pmu6YCa6IqC54K555qEIENvbXBvbmVudCDlvJXnlKjliLAgUHJlZmFiIOmHjOeahCBOb2RlIOaIliBDb21wb25lbnQg5pe277yJXG4gICAgICAgIGlmICghcHJlZmFiSW5mbyB8fCBpc05vcm1hbFByZWZhYk5vZGUgfHwgKGNvbXAgJiYgcHJlZmFiVXRpbHMuaXNNb3VudGVkQ29tcG9uZW50KGNvbXApKSkge1xuICAgICAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgICAgICAvLyDkuI3og73nlKggZ2V0RGlmZlByb3BlcnR5SW5mb3Mg5p2l5Yik5pat5byV55So77yM5Zug5Li66I635Y+W5Yiw55qEIGRpZmZlckluZm8g55qE5bGe5oCn6Lev5b6E5piv5LiO5L+u5pS555qE5YC85LiN5LiA5qC355qE77yM5q+U5aaC6Ieq5a6a5LmJ57G75Z6L5pWw57uEICMxMzYxMlxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IGNvbXBhcmVkQ29tcCA9IGNvbXBvbmVudE9wZXJhdGlvbi5nZXRDYWNoZWRDb21wKGNvbXAudXVpZCk7XG4gICAgICAgICAgICAgICAgLy8gaWYgKCFjb21wYXJlZENvbXApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihgY2FuJ3QgZ2V0IGNvbXBhcmVkIGNvbXBvbmVudCBvZiAke2NvbXAubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgZGlmZkluZm9zID0gdGhpcy5nZXREaWZmUHJvcGVydHlJbmZvcyhjb21wLCBjb21wYXJlZENvbXAsIFtdLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgIHRoaXMuaXNJblRhcmdldE92ZXJyaWRlcy5iaW5kKHRoaXMsIGNvbXAsIHJvb3QuX3ByZWZhYj8udGFyZ2V0T3ZlcnJpZGVzKSk7IC8vIOWIqeeUqOWBj+WHveaVsOS8oOWFpemihOiuvuWPguaVsFxuICAgICAgICAgICAgICAgIC8vIGlmIChkaWZmSW5mb3MgJiYgZGlmZkluZm9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmSW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGNvbnN0IGluZm8gPSBkaWZmSW5mb3NbaV07XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLmNoZWNrVG9BZGRUYXJnZXRPdmVycmlkZShjb21wLCBpbmZvLCByb290KTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICB0aGlzLmFkZFRhcmdldE92ZXJyaWRlV2l0aE1vZGlmeVBhdGgobm9kZSwgcGF0aEtleXMsIHJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIOWmguaenOaUueS6hue7hOS7tu+8jOS4lCBwYXRoIOmVv+W6puWPquaciSAy77yM5YiZ5piv6K6+572u5LqG5pW05Liq57uE5Lu2XG4gICAgICAgIGVsc2UgaWYgKGNvbXAgJiYgcGF0aEtleXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwcm9wczogc3RyaW5nW10gPSBjb21wLmNvbnN0cnVjdG9yLl9fcHJvcHNfXztcbiAgICAgICAgICAgIHByb3BzLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyID0gY2MuQ2xhc3MuYXR0cihjb21wLCBwcm9wKTtcbiAgICAgICAgICAgICAgICBpZiAoYXR0ci52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrVG9BZGRQcm9wZXJ0eU92ZXJyaWRlcyhub2RlLCBbLi4ucGF0aEtleXMsIHByb3BdLCByb290KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tUb0FkZFByb3BlcnR5T3ZlcnJpZGVzKG5vZGUsIHBhdGhLZXlzLCByb290KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS4gOS6m+e7hOS7tu+8jOW8leaTjuWGhemDqOS8muacieaVsOaNruabtOaWsOaTjeS9nO+8jOS9huayoeaciee7n+S4gOWkhOeQhu+8jOavlOWmgiBsb2RcXHdpZGdldCDnmoTmm7TmlrBcbiAgICAgKiDpkojlr7nov5nkupvnu4Tku7bvvIzpnIDopoHlnKjoioLngrnlj5jljJbml7bvvIzmm7TmlrAgb3ZlcnJpZGUg5pWw5o2uXG4gICAgICogQHBhcmFtIG5vZGVcbiAgICAgKiBAcGFyYW0gcHJvcFBhdGhcbiAgICAgKiBAcGFyYW0gcm9vdFxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVTcGVjaWFsQ29tcG9uZW50KG5vZGU6IE5vZGUsIHByb3BQYXRoOiBzdHJpbmcsIHJvb3Q6IE5vZGUgfCBTY2VuZSB8IG51bGwpIHtcbiAgICAgICAgLy8g5pyJ5Y+v6IO95a2Y5Zyo6IqC54K56KKr5Yig6Zmk5LqG77yM5L2G5piv6L+Y5Ye65Y+R5LqGIHVwZGF0ZVNwZWNpYWxDb21wb25lbnRcbiAgICAgICAgaWYgKCFub2RlLmlzVmFsaWQpIHJldHVybjtcblxuICAgICAgICBpZiAocHJvcFBhdGggPT09ICdwb3NpdGlvbicpIHtcbiAgICAgICAgICAgIC8vIOabtOaWsOS4gOS4iyB3aWRnZXRcbiAgICAgICAgICAgIGNvbnN0IHdpZGdldCA9IG5vZGUuZ2V0Q29tcG9uZW50KFdpZGdldCk7XG4gICAgICAgICAgICBpZiAod2lkZ2V0ICYmICFwcmVmYWJVdGlscy5pc01vdW50ZWRDb21wb25lbnQod2lkZ2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbm9kZS5jb21wb25lbnRzLmluZGV4T2Yod2lkZ2V0KTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICAgICAgICAgaXNBbGlnbkxlZnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgICAgaXNBbGlnblJpZ2h0OiAncmlnaHQnLFxuICAgICAgICAgICAgICAgICAgICBpc0FsaWduSG9yaXpvbnRhbENlbnRlcjogJ2hvcml6b250YWxDZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICBpc0FsaWduVG9wOiAndG9wJyxcbiAgICAgICAgICAgICAgICAgICAgaXNBbGlnbkJvdHRvbTogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICAgIGlzQWJzb2x1dGVWZXJ0aWNhbENlbnRlcjogJ3ZlcnRpY2FsQ2VudGVyJyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHByb3BzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWRnZXRba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1RvQWRkUHJvcGVydHlPdmVycmlkZXMobm9kZSwgWydfY29tcG9uZW50cycsIGAke2luZGV4fWAsIHByb3BzW2tleV1dLCByb290KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uQWRkTm9kZShub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBub2RlLnBhcmVudDtcblxuICAgICAgICBpZiAoIXBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlQ2hpbGRyZW5EYXRhKHBhcmVudE5vZGUpO1xuICAgICAgICB0aGlzLmNyZWF0ZVJlc2VydmVkUHJvcGVydHlPdmVycmlkZXMobm9kZSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uTm9kZUFkZGVkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgdGhpcy5jaGVja1RvQWRkUHJlZmFiQXNzZXRNYXAobm9kZSk7XG5cbiAgICAgICAgaWYgKFNlcnZpY2UuRWRpdG9yLmdldEN1cnJlbnRFZGl0b3JUeXBlKCkgPT09ICdwcmVmYWInKSB7XG4gICAgICAgICAgICAvLyBwcmVmYWIg5qih5byP5LiL5re75Yqg6IqC54K577yM6ZyA6KaB6YO95YqgIFByZWZhYiDnm7jlhbPnmoTkv6Hmga9cbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWIobm9kZSk7XG4gICAgICAgICAgICBjb25zdCByb290Tm9kZSA9IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkgYXMgTm9kZTtcbiAgICAgICAgICAgIGlmICghcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByb290UHJlZmFiSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYihyb290Tm9kZSk7XG4gICAgICAgICAgICBpZiAoIXJvb3RQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByZWZhYkluZm8/Lmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5piv5bWM5aWX6aKE5Yi25L2T5re75Yqg77yM5a6D5pys6Lqr5piv5pyJIHByZWZhYlJvb3ROb2RlIOeahO+8jOS4jeimgeWOu+aUueWPmOWug1xuICAgICAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UucHJlZmFiUm9vdE5vZGUgPSBwcmVmYWJJbmZvLmluc3RhbmNlLnByZWZhYlJvb3ROb2RlID8/IHJvb3RQcmVmYWJJbmZvLnJvb3Q7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOmdniBQcmVmYWJJbnN0YW5jZSDoioLngrnmiY3pnIDopoHmt7vliqDmiJbmm7TmlrAgUHJlZmFiSW5mb1xuICAgICAgICAgICAgICAgIGlmICghcHJlZmFiSW5mbyB8fCAhcHJlZmFiSW5mby5yb290Py5bJ19wcmVmYWInXT8uaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvb3RQcmVmYWJJbmZvLnJvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV0aWxzLmFkZFByZWZhYkluZm8obm9kZSwgcm9vdFByZWZhYkluZm8ucm9vdCwgcm9vdFByZWZhYkluZm8uYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdyb290IG9mIFByZWZhYkluZm8gaXMgbnVsbCwgc2V0IHRvIHJvb3Qgbm9kZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bCGIHJvb3Qg5oyH5ZCR6Ieq5bexXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJlZmFiSW5mby5yb290ID0gcm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdGlscy5hZGRQcmVmYWJJbmZvKG5vZGUsIHJvb3RQcmVmYWJJbmZvLnJvb3QsIHJvb3RQcmVmYWJJbmZvLmFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW9k+S4gOS4que7hOS7tumcgOimgeW8leeUqOWIsOWIq+eahCBQcmVmYWJJbnN0YW5jZSDkuK3nmoRcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IOimgeajgOafpeeahOe7hOS7tlxuICAgICAqIEBwYXJhbSBkaWZmSW5mbyDlt67lvILmlbDmja5cbiAgICAgKiBAcGFyYW0gcm9vdCDmoLnoioLngrlcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHB1YmxpYyBjaGVja1RvQWRkVGFyZ2V0T3ZlcnJpZGUodGFyZ2V0OiBDb21wb25lbnQsIGRpZmZJbmZvOiBJRGlmZlByb3BlcnR5SW5mbywgcm9vdDogTm9kZSB8IG51bGwpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcFZhbHVlID0gZGlmZkluZm8udmFsdWU7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCByb290UHJlZmFiSW5mbyA9IHJvb3RbJ19wcmVmYWInXTtcbiAgICAgICAgLy8g6K6+572uIENvbXBvbmVudCDnmoTmn5DkuKrlsZ7mgKfkuLrnqbrvvIzpnIDopoHliKTmlq3mmK/lkKbmuIXpmaQgVGFyZ2V0T3ZlcnJpZGVzXG4gICAgICAgIGlmICgocHJvcFZhbHVlID09PSBudWxsIHx8IHByb3BWYWx1ZSA9PT0gdW5kZWZpbmVkKSAmJiB0YXJnZXQpIHtcbiAgICAgICAgICAgIHByZWZhYlV0aWxzLnJlbW92ZVRhcmdldE92ZXJyaWRlKHJvb3RQcmVmYWJJbmZvLCB0YXJnZXQsIGRpZmZJbmZvLnBhdGhLZXlzKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjaGVja05vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgaWYgKHByb3BWYWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgIGNoZWNrTm9kZSA9IHByb3BWYWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wVmFsdWUgaW5zdGFuY2VvZiBDb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNoZWNrTm9kZSA9IHByb3BWYWx1ZS5ub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjaGVja05vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoZWNrUHJlZmFiSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYihjaGVja05vZGUpO1xuICAgICAgICBpZiAoIWNoZWNrUHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5ZCR5LiK5p+l5om+IFByZWZhYkluc3RhbmNlIOi3r+W+hFxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvID0gcHJlZmFiVXRpbHMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhjaGVja05vZGUpO1xuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlOiBOb2RlIHwgbnVsbCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcFZhbHVlIGluc3RhbmNlb2YgTm9kZSAmJiBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlID09PSBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgIC8vIOacgOWklueahCBJbnN0YW5jZSDmoLnoioLngrnvvIzkuI3pnIDopoHpgJrov4cgVGFyZ2V0T3ZlcnJpZGVzIOadpemHjeaWsOaYoOWwhOS6hu+8jOebtOaOpeWtmOWcuuaZr+e0ouW8leWwseWPr+S7peaJvuWIsFxuICAgICAgICAgICAgcHJlZmFiVXRpbHMucmVtb3ZlVGFyZ2V0T3ZlcnJpZGUocm9vdFByZWZhYkluZm8sIHRhcmdldCwgZGlmZkluZm8ucGF0aEtleXMpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aDogc3RyaW5nW10gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvLnRhcmdldFBhdGg7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2U6IFByZWZhYi5fdXRpbHMuUHJlZmFiSW5zdGFuY2UgfCB1bmRlZmluZWQgPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuXG4gICAgICAgIGlmIChvdXRNb3N0UHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpOyAvLyDkuI3pnIDopoHlrZjmnIDlpJblsYLnmoQgUHJlZmFiSW5zdGFuY2Ug55qEIGZpbGVJRFxuICAgICAgICAgICAgLy8g5Y+q5aSE55CGY29tcG9uZW50XG4gICAgICAgICAgICBpZiAocHJvcFZhbHVlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcHJvcFZhbHVlWydfcHJlZmFiJ107XG4gICAgICAgICAgICAgICAgaWYgKHByZWZhYkluZm8gJiYgcHJlZmFiSW5mby5maWxlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGF0aC5wdXNoKHByZWZhYkluZm8uZmlsZUlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjYW4ndCBnZXQgZmlsZUlkIG9mIHByZWZhYiBub2RlOiAke3Byb3BWYWx1ZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wVmFsdWUgaW5zdGFuY2VvZiBDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcFByZWZhYkluZm8gPSBwcm9wVmFsdWUuX19wcmVmYWI7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBQcmVmYWJJbmZvICYmIGNvbXBQcmVmYWJJbmZvLmZpbGVJZCkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRQYXRoLnB1c2goY29tcFByZWZhYkluZm8uZmlsZUlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDpnZ4gbW91bnRlZCDnmoQgY29tcG9uZW50IOaJjemcgOimgeaKpemUmVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXByZWZhYlV0aWxzLmdldE1vdW50ZWRSb290KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNhbid0IGdldCBmaWxlSWQgb2YgcHJlZmFiIGNvbXBvbmVudDogJHtwcm9wVmFsdWUubmFtZX0gaW4gbm9kZTogJHtwcm9wVmFsdWUubm9kZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdldCByb290IHByZWZhYkluZm9cbiAgICAgICAgICAgIC8vIHNjZW5lIG9yIHJvb3QgaW4gcHJlZmFiQXNzZXRcbiAgICAgICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKCFyb290WydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgcm9vdFsnX3ByZWZhYiddID0gcHJlZmFiVXRpbHMuY3JlYXRlUHJlZmFiSW5mbyhyb290LnV1aWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCByb290UHJlZmFiSW5mbyA9IHJvb3RbJ19wcmVmYWInXSE7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRPdmVycmlkZSA9IHByZWZhYlV0aWxzLmdldFRhcmdldE92ZXJyaWRlKHJvb3RQcmVmYWJJbmZvLCB0YXJnZXQsIGRpZmZJbmZvLnBhdGhLZXlzKTtcbiAgICAgICAgICAgIGlmICh0YXJnZXRPdmVycmlkZSkge1xuICAgICAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cocm9vdCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0T3ZlcnJpZGUudGFyZ2V0ID0gb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRJbmZvID0gbmV3IFRhcmdldEluZm8oKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRJbmZvLmxvY2FsSUQgPSB0YXJnZXRQYXRoO1xuICAgICAgICAgICAgICAgIHRhcmdldE92ZXJyaWRlLnRhcmdldEluZm8gPSB0YXJnZXRJbmZvO1xuICAgICAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2cocm9vdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8g5a+55q+U5b2T5YmN6IqC54K55ZKM5a+55bqU6aKE5Yi25L2T5Y6f5aeL6LWE5rqQ5Lit55qE5pWw5o2u55qE5beu5byCXG4gICAgcHJpdmF0ZSBjaGVja1RvQWRkUHJvcGVydHlPdmVycmlkZXMobm9kZTogTm9kZSwgcGF0aEtleXM6IHN0cmluZ1tdLCByb290OiBOb2RlIHwgbnVsbCkge1xuICAgICAgICAvLyDojrflj5boioLngrnmiYDlsZ7pooTliLbkvZPnmoTnm7jlhbPkv6Hmga9cbiAgICAgICAgY29uc3QgcHJvcGVydHlPdmVycmlkZUxvY2F0aW9uID0gcHJlZmFiVXRpbHMuZ2V0UHJvcGVydHlPdmVycmlkZUxvY2F0aW9uSW5mbyhub2RlLCBwYXRoS2V5cyk7XG5cbiAgICAgICAgaWYgKCFwcm9wZXJ0eU92ZXJyaWRlTG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgPSBwcm9wZXJ0eU92ZXJyaWRlTG9jYXRpb24ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5mbyA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5mbyB8fCAhb3V0TW9zdFByZWZhYkluZm8uYXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZSA9IG91dE1vc3RQcmVmYWJJbmZvPy5pbnN0YW5jZTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1clRhcmdldCA9IHByb3BlcnR5T3ZlcnJpZGVMb2NhdGlvbi50YXJnZXQ7XG5cbiAgICAgICAgY29uc3QgbW91bnRlZFJvb3QgPSBwcmVmYWJVdGlscy5nZXRNb3VudGVkUm9vdChjdXJUYXJnZXQpO1xuICAgICAgICAvLyDlpoLmnpzkv67mlLnnmoTmmK/kuIDkuKrlnKjlvZPliY3kuIrkuIvmlofkuIvnmoQgbW91bnRlZCDoioLngrnmiJbnu4Tku7bvvIzlsLHkuI3pnIDopoHlhpkgb3ZlcnJpZGVz77yM5Zug5Li6IG1vdW50ZWQg55qE6IqC54K55oiW57uE5Lu25pys6Lqr5bCx5Lya6KKr5bqP5YiX5YyWXG4gICAgICAgIGlmIChtb3VudGVkUm9vdCAmJiBtb3VudGVkUm9vdCA9PT0gb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9jYWxJRCA9IHByb3BlcnR5T3ZlcnJpZGVMb2NhdGlvbi50YXJnZXRQYXRoO1xuICAgICAgICBjb25zdCBhc3NldFJvb3ROb2RlOiBOb2RlIHwgdW5kZWZpbmVkID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiQXNzZXROb2RlSW5zdGFuY2Uob3V0TW9zdFByZWZhYkluZm8pO1xuICAgICAgICBpZiAoIWFzc2V0Um9vdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldEluQXNzZXQgPSBwcmVmYWJVdGlscy5nZXRUYXJnZXQobG9jYWxJRCwgYXNzZXRSb290Tm9kZSk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXRJbkFzc2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBjYW4ndCBmaW5kIGl0ZW06ICR7Y3VyVGFyZ2V0Lm5hbWV9IGluIHByZWZhYiBhc3NldCAke291dE1vc3RQcmVmYWJJbmZvLmFzc2V0Ll91dWlkfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcE92ZXJyaWRlcyA9IHByZWZhYlV0aWxzLmdldFByb3BlcnR5T3ZlcnJpZGVzT2ZUYXJnZXQob3V0TW9zdFByZWZhYkluc3RhbmNlLCBsb2NhbElEKTtcbiAgICAgICAgY29uc3QgZGlmZkluZm9zID0gdGhpcy5nZXREaWZmUHJvcGVydHlJbmZvcyhjdXJUYXJnZXQsIHRhcmdldEluQXNzZXQsIFtdLCB0aGlzLmlzSW5Qcm9wZXJ0eU92ZXJyaWRlcy5iaW5kKHRoaXMsIHByb3BPdmVycmlkZXMpKTsgLy8g5Yip55So5YGP5Ye95pWw5Lyg5YWl6aKE6K6+5Y+C5pWwXG5cbiAgICAgICAgLy8g5riF6Zmk5Lul5YmN55SoIHNldHRlciDorrDlvZXkuIvnmoTmlbDmja5cbiAgICAgICAgLy8gcHJlZmFiVXRpbC5yZW1vdmVQcm9wZXJ0eU92ZXJyaWRlKG91dE1vc3RQcmVmYWJJbnN0YW5jZSwgbG9jYWxJRCwgcHJvcGVydHlPdmVycmlkZUxvY2F0aW9uLnJlbGF0aXZlUGF0aEtleXMpO1xuICAgICAgICBpZiAoZGlmZkluZm9zICYmIGRpZmZJbmZvcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwcmVmYWJVdGlscy5maXJlQmVmb3JlQ2hhbmdlTXNnKHByb3BlcnR5T3ZlcnJpZGVMb2NhdGlvbi5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmSW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gZGlmZkluZm9zW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1clRhcmdldCBpbnN0YW5jZW9mIENvbXBvbmVudCAmJiB0aGlzLmNoZWNrVG9BZGRUYXJnZXRPdmVycmlkZShjdXJUYXJnZXQsIGluZm8sIHJvb3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wT3ZlcnJpZGUgPSBwcmVmYWJVdGlscy5nZXRQcm9wZXJ0eU92ZXJyaWRlKG91dE1vc3RQcmVmYWJJbnN0YW5jZSwgbG9jYWxJRCwgaW5mby5wYXRoS2V5cyk7XG4gICAgICAgICAgICAgICAgcHJvcE92ZXJyaWRlLnZhbHVlID0gaW5mby52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgICAgICAgLy8gZGlmZlByb3BlcnR5SW5mb3Mg6I635Y+W5Yiw55qE5beu5byC5L+h5oGvLOacieS6m+aDheWGteS8mua8j+aOie+8jOebtOaOpeavlOi+g+acgOWHhuehrlxuICAgICAgICAgICAgICAgIHRoaXMuYWRkVGFyZ2V0T3ZlcnJpZGVXaXRoTW9kaWZ5UGF0aChub2RlLCBwYXRoS2V5cywgcm9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmVmYWJVdGlscy5maXJlQ2hhbmdlTXNnKHByb3BlcnR5T3ZlcnJpZGVMb2NhdGlvbi5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOaYr+WQpuW3sue7j+WcqCBUYXJnZXRPdmVycmlkZSDorrDlvZXkuK1cbiAgICBwcml2YXRlIGlzSW5UYXJnZXRPdmVycmlkZXMoc291cmNlOiBDb21wb25lbnQsIHRhcmdldE92ZXJyaWRlczogVGFyZ2V0T3ZlcnJpZGVJbmZvW10gfCBudWxsLCBwYXRoS2V5czogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKCF0YXJnZXRPdmVycmlkZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJlZmFiVXRpbHMuaXNJblRhcmdldE92ZXJyaWRlcyh0YXJnZXRPdmVycmlkZXMsIHNvdXJjZSwgcGF0aEtleXMpO1xuICAgIH1cblxuICAgIC8vIOaYr+WQpuWcqCBQcm9wZXJ0eU92ZXJyaWRlcyDkuK1cbiAgICBwcml2YXRlIGlzSW5Qcm9wZXJ0eU92ZXJyaWRlcyhwcm9wZXJ0eU92ZXJyaWRlczogUHJvcGVydHlPdmVycmlkZUluZm9bXSwgcGF0aEtleXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIHJldHVybiBwcmVmYWJVdGlscy5pc0luUHJvcGVydHlPdmVycmlkZXMocGF0aEtleXMsIHByb3BlcnR5T3ZlcnJpZGVzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlr7nmr5TlvpfliLDkuKTkuKogY2NDbGFzcyDnmoTlt67lvILmlbDmja5cbiAgICAgKiBAcGFyYW0gY3VyVGFyZ2V0IOWvueavlOeahOWvueixoVxuICAgICAqIEBwYXJhbSBjb21wYXJlZFRhcmdldCDooqvmr5TovoPnmoTlr7nosaFcbiAgICAgKiBAcGFyYW0gcHJvcFBhdGhLZXlzIOW9k+WJjeWvueixoeeahOWxnuaAp+i3r+W+hOaVsOe7hFxuICAgICAqIEBwYXJhbSBpc01vZGlmaWVkRnVuYyDnlKjkuo7liKTmlq3lsZ7mgKfmmK/lkKbooqvkv67mlLnnmoTmlrnms5VcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHByaXZhdGUgZ2V0RGlmZlByb3BlcnR5SW5mb3MoXG4gICAgICAgIGN1clRhcmdldDogYW55LFxuICAgICAgICBjb21wYXJlZFRhcmdldDogYW55LFxuICAgICAgICBwcm9wUGF0aEtleXM6IHN0cmluZ1tdLFxuICAgICAgICBpc01vZGlmaWVkRnVuYzogRnVuY3Rpb24sXG4gICAgKTogbnVsbCB8IElEaWZmUHJvcGVydHlJbmZvW10ge1xuICAgICAgICBpZiAoIWN1clRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJUYXJnZXRDdG9yID0gY3VyVGFyZ2V0LmNvbnN0cnVjdG9yO1xuICAgICAgICBjb25zdCBjb21wYXJlZFRhcmdldEN0b3IgPSBjb21wYXJlZFRhcmdldC5jb25zdHJ1Y3RvcjtcblxuICAgICAgICBpZiAoIWN1clRhcmdldEN0b3IgfHwgIWNvbXBhcmVkVGFyZ2V0Q3RvciB8fCBjdXJUYXJnZXRDdG9yICE9PSBjb21wYXJlZFRhcmdldEN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBwcm9wcyA9IGN1clRhcmdldEN0b3IuX192YWx1ZXNfXzsgLy8g5Y+v5bqP5YiX5YyW55qE5bGe5oCn6YO95pS+5Zyo6L+Z6YeM6L65XG4gICAgICAgIGNvbnN0IGV4Y2x1ZGVQcm9wcyA9IGdldERpZmZFeGNsdWRlUHJvcHMoY3VyVGFyZ2V0Q3Rvcik7XG5cbiAgICAgICAgbGV0IGRpZmZQcm9wZXJ0eUluZm9zOiBJRGlmZlByb3BlcnR5SW5mb1tdID0gW107XG4gICAgICAgIHByb3BzLm1hcCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChleGNsdWRlUHJvcHMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXR0ciA9IENDQ2xhc3MuYXR0cihjdXJUYXJnZXRDdG9yLCBrZXkpO1xuICAgICAgICAgICAgaWYgKGF0dHIuc2VyaWFsaXphYmxlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3VyUHJvcFZhbHVlID0gY3VyVGFyZ2V0W2tleV07XG4gICAgICAgICAgICBjb25zdCBjb21wYXJlZFByb3BWYWx1ZSA9IGNvbXBhcmVkVGFyZ2V0W2tleV07XG5cbiAgICAgICAgICAgIGNvbnN0IGluZm9zID0gdGhpcy5oYW5kbGVEaWZmUHJvcGVydHlJbmZvcyhjdXJQcm9wVmFsdWUsIGNvbXBhcmVkUHJvcFZhbHVlLCBrZXksIHByb3BQYXRoS2V5cywgaXNNb2RpZmllZEZ1bmMpO1xuICAgICAgICAgICAgZGlmZlByb3BlcnR5SW5mb3MgPSBkaWZmUHJvcGVydHlJbmZvcy5jb25jYXQoaW5mb3MpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGlmZlByb3BlcnR5SW5mb3M7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVEaWZmUHJvcGVydHlJbmZvcyhcbiAgICAgICAgY3VyUHJvcFZhbHVlOiBhbnksXG4gICAgICAgIGNvbXBhcmVkUHJvcFZhbHVlOiBhbnksXG4gICAgICAgIHByb3BOYW1lOiBzdHJpbmcsXG4gICAgICAgIHByb3BQYXRoS2V5czogc3RyaW5nW10sXG4gICAgICAgIGlzTW9kaWZpZWRGdW5jOiBGdW5jdGlvbixcbiAgICApIHtcbiAgICAgICAgbGV0IGRpZmZQcm9wZXJ0eUluZm9zOiBJRGlmZlByb3BlcnR5SW5mb1tdID0gW107XG5cbiAgICAgICAgY29uc3QgcGF0aEtleXMgPSBwcm9wUGF0aEtleXMuY29uY2F0KHByb3BOYW1lKTtcbiAgICAgICAgY29uc3QgZGlmZlByb3A6IElEaWZmUHJvcGVydHlJbmZvID0ge1xuICAgICAgICAgICAgcGF0aEtleXMsXG4gICAgICAgICAgICB2YWx1ZTogY3VyUHJvcFZhbHVlLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoY3VyUHJvcFZhbHVlID09PSBudWxsIHx8IGN1clByb3BWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoY3VyUHJvcFZhbHVlICE9PSBjb21wYXJlZFByb3BWYWx1ZSB8fCBpc01vZGlmaWVkRnVuYyhwYXRoS2V5cykpIHtcbiAgICAgICAgICAgICAgICBkaWZmUHJvcGVydHlJbmZvcy5wdXNoKGRpZmZQcm9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjb21wYXJlZFByb3BWYWx1ZSA9PT0gbnVsbCB8fCBjb21wYXJlZFByb3BWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGlzTW9kaWZpZWRGdW5jKHBhdGhLZXlzKSkge1xuICAgICAgICAgICAgICAgIGRpZmZQcm9wZXJ0eUluZm9zLnB1c2goZGlmZlByb3ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDkuKTkuKrpnIDopoHlr7nmr5TnmoTlgLzpg73pnZ7nqbrvvIzpnIDopoHov5vooYzmm7Tor6bnu4bnmoTlr7nmr5RcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjdXJQcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaVsOe7hOmVv+W6puWPkeeUn+WPmOWMlu+8jOmcgOimgeiusOW9lVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW5ndGhQYXRoS2V5cyA9IHBhdGhLZXlzLmNvbmNhdCgnbGVuZ3RoJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJQcm9wVmFsdWUubGVuZ3RoICE9PSBjb21wYXJlZFByb3BWYWx1ZS5sZW5ndGggfHwgaXNNb2RpZmllZEZ1bmMobGVuZ3RoUGF0aEtleXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW5ndGhEaWZmUHJvcDogSURpZmZQcm9wZXJ0eUluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aEtleXM6IGxlbmd0aFBhdGhLZXlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjdXJQcm9wVmFsdWUubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZQcm9wZXJ0eUluZm9zLnB1c2gobGVuZ3RoRGlmZlByb3ApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJQcm9wVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm9zID0gdGhpcy5oYW5kbGVEaWZmUHJvcGVydHlJbmZvcyhjdXJQcm9wVmFsdWVbaV0sIGNvbXBhcmVkUHJvcFZhbHVlW2ldLCAnJyArIGksIHBhdGhLZXlzLCBpc01vZGlmaWVkRnVuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mb3MgJiYgaW5mb3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZQcm9wZXJ0eUluZm9zID0gZGlmZlByb3BlcnR5SW5mb3MuY29uY2F0KGluZm9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1clByb3BWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1clByb3BWYWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBjdXJQcm9wVmFsdWVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaZrumAmuiKgueCueeUqCB1dWlkIOavlOi+g++8jHByZWZhYiDnlKggZmlsZUlkIOavlOi+g++8iOWPr+iDveS8muacieebuOWQjO+8jOS5i+WQjuWGjSBmaXjvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocHJlZmFiSW5mbyAmJiBwcmVmYWJJbmZvLmZpbGVJZCAhPT0gY29tcGFyZWRQcm9wVmFsdWVbJ19wcmVmYWInXT8uZmlsZUlkKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1clByb3BWYWx1ZS51dWlkICE9PSBjb21wYXJlZFByb3BWYWx1ZS51dWlkXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmUHJvcGVydHlJbmZvcy5wdXNoKGRpZmZQcm9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJQcm9wVmFsdWUgaW5zdGFuY2VvZiBDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaZrumAmue7hOS7tue7hOS7tueUqCB1dWlkIOavlOi+g++8jHByZWZhYiDnlKggZmlsZUlkIOavlOi+g++8iOWPr+iDveS8muacieebuOWQjO+8jOS5i+WQjuWGjSBmaXjvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY3VyUHJvcFZhbHVlLl9fcHJlZmFiICYmIGN1clByb3BWYWx1ZS5fX3ByZWZhYi5maWxlSWQgIT09IGNvbXBhcmVkUHJvcFZhbHVlLl9fcHJlZmFiPy5maWxlZElkKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1clByb3BWYWx1ZS51dWlkICE9PSBjb21wYXJlZFByb3BWYWx1ZS51dWlkXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmUHJvcGVydHlJbmZvcy5wdXNoKGRpZmZQcm9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJQcm9wVmFsdWUgaW5zdGFuY2VvZiBWYWx1ZVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3VyUHJvcFZhbHVlLmVxdWFscyhjb21wYXJlZFByb3BWYWx1ZSkgfHwgaXNNb2RpZmllZEZ1bmMocGF0aEtleXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlByb3BlcnR5SW5mb3MucHVzaChkaWZmUHJvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyUHJvcFZhbHVlIGluc3RhbmNlb2YgQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJQcm9wVmFsdWUuX3V1aWQgIT09IGNvbXBhcmVkUHJvcFZhbHVlLl91dWlkIHx8IGlzTW9kaWZpZWRGdW5jKHBhdGhLZXlzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZQcm9wZXJ0eUluZm9zLnB1c2goZGlmZlByb3ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKENDQ2xhc3MuaXNDQ0NsYXNzT3JGYXN0RGVmaW5lZChjdXJQcm9wVmFsdWUuY29uc3RydWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvcyA9IHRoaXMuZ2V0RGlmZlByb3BlcnR5SW5mb3MoY3VyUHJvcFZhbHVlLCBjb21wYXJlZFByb3BWYWx1ZSwgcGF0aEtleXMsIGlzTW9kaWZpZWRGdW5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvcyAmJiBpbmZvcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlByb3BlcnR5SW5mb3MgPSBkaWZmUHJvcGVydHlJbmZvcy5jb25jYXQoaW5mb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJpbWl0aXZlIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1clByb3BWYWx1ZSAhPT0gY29tcGFyZWRQcm9wVmFsdWUgfHwgaXNNb2RpZmllZEZ1bmMocGF0aEtleXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmUHJvcGVydHlJbmZvcy5wdXNoKGRpZmZQcm9wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkaWZmUHJvcGVydHlJbmZvcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnm7TmjqXpgJrov4fkv67mlLnoioLngrnot6/lvoTmnaXliKTmlq3mt7vliqAgdGFyZ2V0T3ZlcnJpZGUg5L+h5oGvXG4gICAgICogQHBhcmFtIG5vZGUg5L+u5pS555qE6IqC54K5XG4gICAgICogQHBhcmFtIHBhdGhLZXlzIOWxnuaAp+mUruWAvOi3r+W+hFxuICAgICAqIEBwYXJhbSByb290XG4gICAgICovXG4gICAgcHJpdmF0ZSBhZGRUYXJnZXRPdmVycmlkZVdpdGhNb2RpZnlQYXRoKG5vZGU6IE5vZGUsIHBhdGhLZXlzOiBzdHJpbmdbXSwgcm9vdDogTm9kZSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBub2RlO1xuICAgICAgICBsZXQgY29tcDogQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwYXRoS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHBhdGhLZXlzW2luZGV4XTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIGJyZWFrO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVtrZXldO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAxICYmIHBhdGhLZXlzWzBdID09PSAnX2NvbXBvbmVudHMnKSB7XG4gICAgICAgICAgICAgICAgLy8g57uE5Lu25b+F54S25pivX2NvbXBvbmVudHNbeF3lvIDlpLRcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29tcCA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbm9kZSAmJiBjb21wKSB7XG4gICAgICAgICAgICAvLyDlv4Xpobvnp7vpmaTmjonnu4Tku7bnmoTot6/lvoTvvIzlm6DkuLp0YXJnZXRPdmVycmlkZUluZm/mmK/lrZjnmoRjb21w6ICM5LiN5pivbm9kZVxuICAgICAgICAgICAgcGF0aEtleXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHBhdGhLZXlzLnNoaWZ0KCk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrVG9BZGRUYXJnZXRPdmVycmlkZShjb21wLCB7IHBhdGhLZXlzOiBwYXRoS2V5cywgdmFsdWU6IHZhbHVlIH0sIHJvb3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNoZWNrVG9BZGRQcmVmYWJBc3NldE1hcChub2RlOiBOb2RlKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBwcmVmYWJJbmZvPy5pbnN0YW5jZTtcbiAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlICYmIHByZWZhYkluZm8/LmFzc2V0KSB7XG4gICAgICAgICAgICBsZXQgbm9kZXMgPSB0aGlzLmFzc2V0VG9Ob2Rlc01hcC5nZXQocHJlZmFiSW5mby5hc3NldC5fdXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGVzKSB7XG4gICAgICAgICAgICAgICAgbm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLmFzc2V0VG9Ob2Rlc01hcC5zZXQocHJlZmFiSW5mby5hc3NldC5fdXVpZCwgbm9kZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW5vZGVzLmluY2x1ZGVzKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVDaGFuZ2VkSW5HZW5lcmFsTW9kZShub2RlOiBOb2RlLCBvcHRzOiBJQ2hhbmdlTm9kZU9wdGlvbnMsIHJvb3Q6IE5vZGUgfCBTY2VuZSB8IG51bGwpIHtcbiAgICAgICAgaWYgKCFvcHRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0cy50eXBlID09PSBOb2RlRXZlbnRUeXBlLkNISUxEX0NIQU5HRUQpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2hpbGRyZW5EYXRhKG5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdHMudHlwZSA9PT0gTm9kZUV2ZW50VHlwZS5QQVJFTlRfQ0hBTkdFRCkge1xuICAgICAgICAgICAgaWYgKFNlcnZpY2UuRWRpdG9yLmdldEN1cnJlbnRFZGl0b3JUeXBlKCkgPT09ICdwcmVmYWInKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBub2RlWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuICAgICAgICAgICAgICAgIGlmIChwcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBwcmVmYWJJbnN0YW5jZS5wcmVmYWJSb290Tm9kZSA9IHJvb3QgYXMgTm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0cy5wcm9wUGF0aCA9PT0gJ2NoaWxkcmVuJyAmJiBvcHRzLnR5cGUgPT09IE5vZGVFdmVudFR5cGUuTU9WRV9BUlJBWV9FTEVNRU5UKSB7XG4gICAgICAgICAgICAvLyDkuI3orrDlvZUgY2hpbGRyZW4g55qE5Y+Y5Yqo5YC85YiwIG92ZXJyaWRlIOS4rVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+u5pS5IFByZWZhYkluc3RhbmNlIOS4reiKgueCueaVsOaNru+8jOimgeS/neWtmOWcqOacgOWkluWxgueahCBQcmVmYWJJbnN0YW5jZeS4rVxuICAgICAgICBpZiAob3B0cy5wcm9wUGF0aCkge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gbm9kZS51dWlkICsgJ3wnICsgb3B0cy5wcm9wUGF0aDtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyVXRpbC5jYWxsRnVuY3Rpb25MaW1pdChrZXksIHRoaXMuY2hlY2tUb0FkZE92ZXJyaWRlcy5iaW5kKHRoaXMpLCBub2RlLCBvcHRzLnByb3BQYXRoLCByb290KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3RpbWVyVXRpbC5jYWxsRnVuY3Rpb25MaW1pdChub2RlLnV1aWQsIHRoaXMudXBkYXRlU3BlY2lhbENvbXBvbmVudC5iaW5kKHRoaXMpLCBub2RlLCBvcHRzLnByb3BQYXRoLCByb290KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKTmlq3mmK/lkKbmmK/pnIDopoHkv53nlZnnmoQgUHJvcGVydHlPdmVycmlkZVxuICAgICAqIEBwYXJhbSBwcm9wT3ZlcnJpZGUgUHJlZmFiIOWunuS+i1xuICAgICAqIEBwYXJhbSBwcmVmYWJSb290RmlsZUlkIHByZWZhYiDmoLnoioLngrnnmoQgRmlsZUlkXG4gICAgICovXG4gICAgcHVibGljIGlzUmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcyhwcm9wT3ZlcnJpZGU6IFByZWZhYi5fdXRpbHMuUHJvcGVydHlPdmVycmlkZUluZm8sIHByZWZhYlJvb3RGaWxlSWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCB0YXJnZXRJbmZvID0gcHJvcE92ZXJyaWRlLnRhcmdldEluZm87XG4gICAgICAgIGlmICh0YXJnZXRJbmZvPy5sb2NhbElELmxlbmd0aCA9PT0gMSAmJiB0YXJnZXRJbmZvLmxvY2FsSURbMF0gPT09IHByZWZhYlJvb3RGaWxlSWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BQYXRoID0gcHJvcE92ZXJyaWRlLnByb3BlcnR5UGF0aDtcbiAgICAgICAgICAgIGlmIChwcm9wUGF0aC5sZW5ndGggPT09IDEgJiYgUm9vdFJlc2VydmVkUHJvcGVydHkuaW5jbHVkZXMocHJvcFBhdGhbMF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk5a6e5L6L55qEIFByb3BlcnR5T3ZlcnJpZGVz77yM5L+d55WZ5LiA5Lqb5LiA6Iis5LiN6ZyA6KaB5ZKMIFByZWZhYkFzc2V0IOiHquWKqOWQjOatpeeahOimhuebllxuICAgICAqIEBwYXJhbSBwcmVmYWJJbnN0YW5jZSBQcmVmYWIg5a6e5L6LXG4gICAgICogQHBhcmFtIHByZWZhYlJvb3RGaWxlSWQgcHJlZmFiIOagueiKgueCueeahCBGaWxlSWRcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlTW9kaWZpZWRQcm9wZXJ0eU92ZXJyaWRlcyhwcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UsIHByZWZhYlJvb3RGaWxlSWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCByZXNlcnZlZFByb3BlcnR5T3ZlcnJpZGVzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5zdGFuY2UucHJvcGVydHlPdmVycmlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BPdmVycmlkZSA9IHByZWZhYkluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNSZXNlcnZlZFByb3BlcnR5T3ZlcnJpZGVzKHByb3BPdmVycmlkZSwgcHJlZmFiUm9vdEZpbGVJZCkpIHtcbiAgICAgICAgICAgICAgICByZXNlcnZlZFByb3BlcnR5T3ZlcnJpZGVzLnB1c2gocHJvcE92ZXJyaWRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZhYkluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzID0gcmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcztcbiAgICB9XG5cbiAgICAvLyDlpITnkIbltYzlpZfoioLngrnnmoQgT3ZlcnJpZGXvvIzopoHku47lnLrmma/nmoQgaW5zdGFuY2Ug5YaZ5YiwIHByZWZhYiDotYTmupDkuK3nmoTltYzlpZflrZDoioLngrnkuIrnmoQgaW5zdGFuY2Ug55qEIG92ZXJyaWRlIOS4rVxuICAgIHB1YmxpYyBhcHBseU1vdW50ZWRDaGlsZHJlbihub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlOiBOb2RlID0gbm9kZTtcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYihyb290Tm9kZSk7XG4gICAgICAgIGlmICghcHJlZmFiSW5mbyB8fCAhcHJlZmFiSW5mby5pbnN0YW5jZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gcHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgY29uc3QgbW91bnRlZENoaWxkcmVuTWFwID0gbmV3IE1hcDxzdHJpbmdbXSwgSU5vZGVQcmVmYWJEYXRhPigpO1xuICAgICAgICBjb25zdCBtb3VudGVkQ2hpbGRyZW4gPSBwcmVmYWJJbnN0YW5jZS5tb3VudGVkQ2hpbGRyZW47XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3VudGVkQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG1vdW50ZWRDaGlsZEluZm8gPSBtb3VudGVkQ2hpbGRyZW5baV07XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRJbmZvID0gbW91bnRlZENoaWxkSW5mby50YXJnZXRJbmZvO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGxvY2FsSUQg6ZW/5bqm5aSn5LqOMe+8jOihqOekuuaYr+WKoOWIsOS6huW1jOWll+eahCBQcmVmYWJJbnN0YW5jZSDoioLngrnkuK3ljrvkuoZcbiAgICAgICAgICAgIGlmICh0YXJnZXRJbmZvLmxvY2FsSUQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIC8vIOmcgOimgeWwhiBtb3VudGVkIOeahOS/oeaBr+WKoOWIsOW1jOWll+eahOmCo+S4qiBQcmVmYWJJbnN0YW5jZSDkuK3ljrtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldCh0YXJnZXRJbmZvLmxvY2FsSUQsIHJvb3ROb2RlKSBhcyBOb2RlO1xuXG4gICAgICAgICAgICAgICAgLy8g5om+5LiL5LiA57qn55qEIFByZWZhYkluc3RhbmNlXG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2VJbmZvID0gcHJlZmFiVXRpbHMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyh0YXJnZXQpO1xuICAgICAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSBwcmVmYWJJbnN0YW5jZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEluc3ROb2RlID0gbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICAgICAgICAgIGlmICghbmVzdGVkSW5zdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEluc3RQcmVmYWJJbmZvID0gbmVzdGVkSW5zdE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICBpZiAoIW5lc3RlZEluc3RQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UgPSBuZXN0ZWRJbnN0UHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAoIW5lc3RlZEluc3RQcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mby50YXJnZXRQYXRoLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbW91bnRlZFBhcmVudFBhdGggPSBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2VJbmZvLnRhcmdldFBhdGguc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0RmlsZUlkID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKHRhcmdldCk/LmZpbGVJZDtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldEZpbGVJZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW91bnRlZFBhcmVudFBhdGgucHVzaCh0YXJnZXRGaWxlSWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZE1vdW50ZWRDaGlsZEluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWJJbnN0YW5jZU1vdW50ZWRDaGlsZHJlbihuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UsIG1vdW50ZWRQYXJlbnRQYXRoKTtcblxuICAgICAgICAgICAgICAgIG1vdW50ZWRDaGlsZEluZm8ubm9kZXMuZm9yRWFjaCgobW91bnRlZE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRQcmVmYWJJbmZvID0gbW91bnRlZE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuYWRkUHJlZmFiSW5mbyhtb3VudGVkTm9kZSwgbmVzdGVkSW5zdE5vZGUsIG5lc3RlZEluc3RQcmVmYWJJbmZvLmFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QobW91bnRlZE5vZGUsIG5lc3RlZEluc3ROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3VudGVkTm9kZVByZWZhYkluZm8gPSBtb3VudGVkTm9kZVsnX3ByZWZhYiddO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1vdW50ZWROb2RlUHJlZmFiSW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIOaJvuWIsOWOn+adpeeahCBtb3VudGVkIOiKgueCue+8jOWcqOaWsOeahCBQcmVmYWIg5LiL55qEIExvY2FsSUTvvIzku6Xkvr/ov5jljp/ml7blgJnmoLnmja7lroPmnaXmn6Xmib7oioLngrlcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGF0aC5wdXNoKG1vdW50ZWROb2RlUHJlZmFiSW5mby5maWxlSWQpO1xuICAgICAgICAgICAgICAgICAgICBtb3VudGVkQ2hpbGRyZW5NYXAuc2V0KHRhcmdldFBhdGgsIHsgcHJlZmFiSW5mbzogb2xkUHJlZmFiSW5mbyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG5lc3RlZE1vdW50ZWRDaGlsZEluZm8ubm9kZXMgPSBuZXN0ZWRNb3VudGVkQ2hpbGRJbmZvLm5vZGVzLmNvbmNhdChtb3VudGVkQ2hpbGRJbmZvLm5vZGVzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ5bWM5aWX55qE55qEIG1vdW50ZWQg6IqC54K55Lya55u05o6l5oiQ5Li6IFByZWZhYkFzc2V0IOmHjOeahOiKgueCuVxuICAgICAgICAgICAgICAgIG1vdW50ZWRDaGlsZEluZm8ubm9kZXMuZm9yRWFjaCgobW91bnRlZE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBsZXQgbW91bnRlZE5vZGVQcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG1vdW50ZWROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QobW91bnRlZE5vZGUsIHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtb3VudGVkTm9kZVByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV0aWxzLmFkZFByZWZhYkluZm8obW91bnRlZE5vZGUsIG5vZGUsIHByZWZhYkluZm8uYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW91bnRlZE5vZGVQcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG1vdW50ZWROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmdniBpbnN0YW5jZSDmiY3opoHmjaIgYXNzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbW91bnRlZE5vZGVQcmVmYWJJbmZvLmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuYWRkUHJlZmFiSW5mbyhtb3VudGVkTm9kZSwgbm9kZSwgcHJlZmFiSW5mby5hc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZENoaWxkcmVuTWFwLnNldChbbW91bnRlZE5vZGVQcmVmYWJJbmZvIS5maWxlSWRdLCB7IHByZWZhYkluZm86IG51bGwgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcmVmYWJJbnN0YW5jZS5tb3VudGVkQ2hpbGRyZW4gPSBbXTtcblxuICAgICAgICByZXR1cm4gbW91bnRlZENoaWxkcmVuTWFwO1xuICAgIH1cblxuICAgIHB1YmxpYyBhcHBseVByb3BlcnR5T3ZlcnJpZGVzKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3Qgcm9vdE5vZGU6IE5vZGUgPSBub2RlO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IHJvb3ROb2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gcHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgaWYgKCFwcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlPdmVycmlkZXMgPSBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcztcbiAgICAgICAgY29uc3QgcmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BlcnR5T3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wT3ZlcnJpZGUgPSBwcm9wZXJ0eU92ZXJyaWRlc1tpXTtcblxuICAgICAgICAgICAgLy8g5L+d55WZ5LiA5Lqb5LiA6Iis5LiN6ZyA6KaB5ZKMIFByZWZhYkFzc2V0IOiHquWKqOWQjOatpeeahCBvdmVycmlkZVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSZXNlcnZlZFByb3BlcnR5T3ZlcnJpZGVzKHByb3BPdmVycmlkZSwgcHJlZmFiSW5mby5maWxlSWQpKSB7XG4gICAgICAgICAgICAgICAgcmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcy5wdXNoKHByb3BPdmVycmlkZSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEluZm8gPSBwcm9wT3ZlcnJpZGUudGFyZ2V0SW5mbztcbiAgICAgICAgICAgIGlmICghdGFyZ2V0SW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBsb2NhbElEIOmVv+W6puWkp+S6jjHvvIzooajnpLrmmK/liqDliLDkuobltYzlpZfnmoQgUHJlZmFiSW5zdGFuY2Ug6IqC54K55Lit5Y675LqGXG4gICAgICAgICAgICBpZiAodGFyZ2V0SW5mby5sb2NhbElELmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAvLyDpnIDopoHlsIYgbW91bnRlZCDnmoTkv6Hmga/liqDliLDltYzlpZfnmoTpgqPkuKogUHJlZmFiSW5zdGFuY2Ug5Lit5Y67XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gcHJlZmFiVXRpbHMuZ2V0VGFyZ2V0KHRhcmdldEluZm8ubG9jYWxJRCwgcm9vdE5vZGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldE5vZGUgPSB0YXJnZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldE5vZGUgaW5zdGFuY2VvZiBDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZSA9IHRhcmdldE5vZGUubm9kZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmib7kuIvkuIDnuqfnmoQgUHJlZmFiSW5zdGFuY2VcbiAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEluc3RQcmVmYWJJbnN0YW5jZUluZm8gPSBwcmVmYWJVdGlscy5nZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKHRhcmdldE5vZGUpO1xuICAgICAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSBwcmVmYWJJbnN0YW5jZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEluc3ROb2RlID0gbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICAgICAgICAgIGlmICghbmVzdGVkSW5zdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEluc3RQcmVmYWJJbmZvID0gbmVzdGVkSW5zdE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICBpZiAoIW5lc3RlZEluc3RQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UgPSBuZXN0ZWRJbnN0UHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAoIW5lc3RlZEluc3RQcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mby50YXJnZXRQYXRoLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0UGF0aC5zcGxpY2UoMCwgMSk7XG5cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UHJlZmFiSW5mbyA9IHRhcmdldCBpbnN0YW5jZW9mIE5vZGUgPyB0YXJnZXRbJ19wcmVmYWInXSA6IHRhcmdldC5fX3ByZWZhYjtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRhcmdldFBhdGgucHVzaCh0YXJnZXRQcmVmYWJJbmZvLmZpbGVJZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkUHJvcE92ZXJyaWRlID0gcHJlZmFiVXRpbHMuZ2V0UHJvcGVydHlPdmVycmlkZShuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UsIHRhcmdldFBhdGgsIHByb3BPdmVycmlkZS5wcm9wZXJ0eVBhdGgpO1xuICAgICAgICAgICAgICAgIG5lc3RlZFByb3BPdmVycmlkZS52YWx1ZSA9IHByb3BPdmVycmlkZS52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ5bWM5aWX55qE55qEIG92ZXJyaWRlIOaVsOaNruS8muebtOaOpeWtmOWIsCBQcmVmYWJBc3NldCDnmoToioLngrnkuIpcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZhYkluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzID0gcmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcztcbiAgICB9XG5cbiAgICAvLyDmm7TmlrDohJrmnKzkuK3pooTliLbkvZMgY2hpbGQg5byV55So55qE5YC85Yiw6aKE5Yi25L2T6LWE5rqQXG4gICAgcHVibGljIGFwcGx5VGFyZ2V0T3ZlcnJpZGVzKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgYXBwbGllZFRhcmdldE92ZXJyaWRlczogVGFyZ2V0T3ZlcnJpZGVJbmZvW10gPSBbXTtcbiAgICAgICAgLy8g5Zy65pmv6IqC54K55oiWIHByZWZhYiDotYTmupDkuK3nmoTmoLnoioLngrlcbiAgICAgICAgY29uc3Qgc2NlbmVSb290Tm9kZSA9IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCk7XG4gICAgICAgIGlmICghc2NlbmVSb290Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcGxpZWRUYXJnZXRPdmVycmlkZXM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY2VuZVJvb3ROb2RlUHJlZmFiSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYihzY2VuZVJvb3ROb2RlKTtcbiAgICAgICAgaWYgKCFzY2VuZVJvb3ROb2RlUHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGFwcGxpZWRUYXJnZXRPdmVycmlkZXM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG5vZGUpO1xuICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBhcHBsaWVkVGFyZ2V0T3ZlcnJpZGVzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gcHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgaWYgKCFwcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcGxpZWRUYXJnZXRPdmVycmlkZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NlbmVSb290Tm9kZVByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gc2NlbmVSb290Tm9kZVByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0T3ZlcnJpZGUgPSBzY2VuZVJvb3ROb2RlUHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXNbaV07XG4gICAgICAgICAgICAgICAgbGV0IHNvdXJjZSA9IHRhcmdldE92ZXJyaWRlLnNvdXJjZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2VOb2RlID0gc291cmNlIGluc3RhbmNlb2YgQ29tcG9uZW50ID8gc291cmNlLm5vZGUgOiBzb3VyY2U7XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlSW5mbyA9IHRhcmdldE92ZXJyaWRlLnNvdXJjZUluZm87XG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZUluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwcmVmYWJVdGlscy5nZXRUYXJnZXQoc291cmNlSW5mby5sb2NhbElELCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gbm9kZSA/IG5vZGUgOiBzb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRJbmZvID0gdGFyZ2V0T3ZlcnJpZGUudGFyZ2V0SW5mbztcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0SW5zdGFuY2UgPSB0YXJnZXRPdmVycmlkZS50YXJnZXQ/LlsnX3ByZWZhYiddPy5pbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gdGFyZ2V0T3ZlcnJpZGUudGFyZ2V0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHQgPyBwcmVmYWJVdGlscy5nZXRUYXJnZXQodGFyZ2V0SW5mby5sb2NhbElELCB0IGFzIE5vZGUpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDYW4ndCBmaW5kIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdGFyZ2V0IGluc3RhbmNlb2YgQ29tcG9uZW50ID8gdGFyZ2V0Lm5vZGUgOiB0YXJnZXQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXNvdXJjZU5vZGUgfHwgIXRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWmguaenOW8leeUqOWSjOiiq+W8leeUqOeahOiKgueCuemDveWcqCBwcmVmYWIg5Lit77yM5bCx6KaB5oqKIHRhcmdldE92ZXJyaWRlIOS/oeaBr+abtOaWsOaOiTtcbiAgICAgICAgICAgICAgICBpZiAoaXNQYXJ0T2ZOb2RlKHNvdXJjZU5vZGUsIG5vZGUpICYmIGlzUGFydE9mTm9kZSh0YXJnZXROb2RlLCBub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLnRhcmdldE92ZXJyaWRlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHNvdXJjZUluQXNzZXQgPSBzb3VyY2U7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRUYXJnZXRPdmVycmlkZSA9IG5ldyBUYXJnZXRPdmVycmlkZUluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRUYXJnZXRPdmVycmlkZS5wcm9wZXJ0eVBhdGggPSB0YXJnZXRPdmVycmlkZS5wcm9wZXJ0eVBhdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05pawIHNvdXJjZSDnm7jlhbPmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc291cmNlTG9jYWxJRCA9IHNvdXJjZUluZm8/LmxvY2FsSUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VMb2NhbElEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0T3ZlcnJpZGUuc291cmNlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZUNvbXAgPSBwcmVmYWJVdGlscy5nZXRUYXJnZXQoc291cmNlTG9jYWxJRCwgdGFyZ2V0T3ZlcnJpZGUuc291cmNlKSBhcyBDb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZUNvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlSW5Bc3NldCA9IHNvdXJjZUNvbXA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhcmdldEluQXNzZXQgPSB0YXJnZXRPdmVycmlkZS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsCB0YXJnZXQg55u45YWz5pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0VGFyZ2V0TG9jYWxJRCA9IHRhcmdldEluZm8ubG9jYWxJRDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0VGFyZ2V0TG9jYWxJRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6L+Z6YeM5ZKMIHNvdXJjZSDkuI3lkIznmoTlnLDmlrnmmK/vvIzlr7kgdGFyZ2V0IOeahOe0ouW8leaYr+mAmui/hyBQcmVmYWJJbnN0YW5jZSDnmoQgRmlsZUlkICsg6IqC54K5L+e7hOS7tueahCBGaWxlSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvdXJjZSDnmoTntKLlvJXlj6/ku6XmsqHmnIkgc291cmNlIOaJgOWcqOiKgueCueeahCBQcmVmYWJJbnN0YW5jZSDnmoQgRmlsZUlkXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0T3ZlcnJpZGUudGFyZ2V0IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldChhc3NldFRhcmdldExvY2FsSUQsIHRhcmdldE92ZXJyaWRlLnRhcmdldCkgYXMgTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEluQXNzZXQgPSB0YXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1RvQWRkVGFyZ2V0T3ZlcnJpZGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VJbkFzc2V0IGFzIENvbXBvbmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoS2V5czogdGFyZ2V0T3ZlcnJpZGUucHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0YXJnZXRJbkFzc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSBwcmVmYWJJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5riF55CG5o6JIHRhcmdldE92ZXJyaWRlIOaVsOaNrlxuICAgICAgICAgICAgICAgICAgICBzY2VuZVJvb3ROb2RlUHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGFwcGxpZWRUYXJnZXRPdmVycmlkZXMucHVzaCh0YXJnZXRPdmVycmlkZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXBwbGllZFRhcmdldE92ZXJyaWRlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXBwbHlSZW1vdmVkQ29tcG9uZW50cyhub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlOiBOb2RlID0gbm9kZTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSByb290Tm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZSA9IHByZWZhYkluZm8uaW5zdGFuY2U7XG4gICAgICAgIGlmICghcHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0Um9vdE5vZGUgPSBwcmVmYWJVdGlscy5nZXRQcmVmYWJBc3NldE5vZGVJbnN0YW5jZShwcmVmYWJJbmZvKTtcbiAgICAgICAgaWYgKCFhc3NldFJvb3ROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbW92ZWRDb21wb25lbnRzID0gcHJlZmFiSW5zdGFuY2UucmVtb3ZlZENvbXBvbmVudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtb3ZlZENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEluZm8gPSByZW1vdmVkQ29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0SW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBsb2NhbElEIOmVv+W6puWkp+S6jjHvvIzooajnpLrmmK/liqDliLDkuobltYzlpZfnmoQgUHJlZmFiSW5zdGFuY2Ug6IqC54K55Lit5Y675LqGXG4gICAgICAgICAgICBpZiAodGFyZ2V0SW5mby5sb2NhbElELmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRDb21wSW5Bc3NldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldCh0YXJnZXRJbmZvLmxvY2FsSUQsIGFzc2V0Um9vdE5vZGUpIGFzIENvbXBvbmVudDtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldENvbXBJbkFzc2V0IHx8ICF0YXJnZXRDb21wSW5Bc3NldC5fX3ByZWZhYikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXROb2RlSW5Bc3NldCA9IHRhcmdldENvbXBJbkFzc2V0Lm5vZGU7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZUluQXNzZXRQcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKHRhcmdldE5vZGVJbkFzc2V0KTtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldENvbXBJbkFzc2V0IHx8ICF0YXJnZXROb2RlSW5Bc3NldFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5YWI5ZyoIFByZWZhYkFzc2V0IOaJvuWIsOWIoOmZpOeahCBjb21wb25lbnQg5omA5Zyo55qE6IqC54K555qEIGxvY2FsSUTvvIzlm6DkuLrliKDpmaTnmoQgY29tcG9uZW50IOWcqOW9k+WJjVxuICAgICAgICAgICAgICAgIC8vIFByZWZhYkluc3RhbmNlIOS4reW3sue7j+S4jeWcqOS6hu+8jOaXoOazlemAmui/hyBjb21wb25lbnQg55qEIEZpbGVJZCDmnaXmib7kuobvvIzmiYDku6XopoHpgJrov4fmib4gbm9kZe+8jFxuICAgICAgICAgICAgICAgIC8vIOeEtuWQjuWGjeaJvuS4i+S4gOWxgue6p+eahCBQcmVmYWJJbnN0YW5jZVxuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldE5vZGVMb2NhbElEID0gdGFyZ2V0SW5mby5sb2NhbElELnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZUxvY2FsSUQucG9wKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZUxvY2FsSUQucHVzaCh0YXJnZXROb2RlSW5Bc3NldFByZWZhYkluZm8uZmlsZUlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOWcqOW9k+WJjSBQcmVmYWJJbnN0YW5jZSDkuK3mn6Xmib7oioLngrlcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJUYXJnZXROb2RlID0gcHJlZmFiVXRpbHMuZ2V0VGFyZ2V0KHRhcmdldE5vZGVMb2NhbElELCByb290Tm9kZSkgYXMgTm9kZTtcblxuICAgICAgICAgICAgICAgIC8vIOaJvuS4i+S4gOe6p+eahCBQcmVmYWJJbnN0YW5jZVxuICAgICAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mbyA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8oY3VyVGFyZ2V0Tm9kZSk7XG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHByZWZhYkluc3RhbmNlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSW5zdE5vZGUgPSBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2VJbmZvLm91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXN0ZWRJbnN0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0UHJlZmFiSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYihuZXN0ZWRJbnN0Tm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXN0ZWRJbnN0UHJlZmFiSW5mbykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlID0gbmVzdGVkSW5zdFByZWZhYkluZm8uaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IG5lc3RlZEluc3RQcmVmYWJJbnN0YW5jZUluZm8udGFyZ2V0UGF0aC5zbGljZSgpO1xuICAgICAgICAgICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpO1xuICAgICAgICAgICAgICAgIHRhcmdldFBhdGgucHVzaCh0YXJnZXRDb21wSW5Bc3NldC5fX3ByZWZhYi5maWxlSWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RhcmdldEluZm8gPSBuZXcgVGFyZ2V0SW5mbygpO1xuICAgICAgICAgICAgICAgIG5ld1RhcmdldEluZm8ubG9jYWxJRCA9IHRhcmdldFBhdGg7XG4gICAgICAgICAgICAgICAgbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlLnJlbW92ZWRDb21wb25lbnRzLnB1c2gobmV3VGFyZ2V0SW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcmVmYWJJbnN0YW5jZS5yZW1vdmVkQ29tcG9uZW50cyA9IFtdO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgYXN5bmMgd2FpdEZvclNjZW5lTG9hZGVkKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHIsIF8pID0+IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnJlbG9hZCh7fSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcih0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICog5bCG5LiA5LiqIFByZWZhYkluc3RhbmNlIOeahOaVsOaNruW6lOeUqOWIsOWvueW6lOeahCBBc3NldCDotYTmupDkuIpcbiAgICAgKiBAcGFyYW0gbm9kZVVVSUQgdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBhcHBseVByZWZhYihub2RlVVVJRDogc3RyaW5nKTogUHJvbWlzZTxJQXBwbHlQcmVmYWJJbmZvIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kb0FwcGx5UHJlZmFiKG5vZGVVVUlEKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZG9BcHBseVByZWZhYihub2RlVVVJRDogc3RyaW5nKTogUHJvbWlzZTxJQXBwbHlQcmVmYWJJbmZvIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZU1nci5nZXROb2RlKG5vZGVVVUlEKTtcbiAgICAgICAgaWYgKCFub2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG5vZGUpO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gcHJlZmFiSW5mbz8uaW5zdGFuY2U7XG4gICAgICAgIGlmICghcHJlZmFiSW5zdGFuY2UgfHwgIXByZWZhYkluZm8/LmFzc2V0KSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHByZWZhYkluZm8uYXNzZXQ7XG5cbiAgICAgICAgLy8g5aaC5p6c5piv5a2Q6LWE5rqQ77yM5YiZ5LiN6IO95bqU55SoXG4gICAgICAgIGlmIChwcmVmYWJVdGlscy5pc1N1YkFzc2V0KGFzc2V0Ll91dWlkKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdjYW5cXCd0IGFwcGx5IGRhdGEgdG8gU3ViQXNzZXQgUHJlZmFiJyk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9sZFByZWZhYkNvbnRlbnQgPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShhc3NldCkgYXMgc3RyaW5nO1xuXG4gICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlBc3NldEluZm8nLCBbYXNzZXQuX3V1aWRdKTtcbiAgICAgICAgaWYgKCFpbmZvKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyDmiorpnZ7pooTliLbkvZPlhoXnmoToioLngrnvvIzmm7TmlrDliLDpooTliLbkvZPkv6Hmga/kuK1cbiAgICAgICAgY29uc3QgbW91bnRlZENoaWxkcmVuSW5mb01hcCA9IHRoaXMuYXBwbHlNb3VudGVkQ2hpbGRyZW4obm9kZSk7XG4gICAgICAgIGlmICghbW91bnRlZENoaWxkcmVuSW5mb01hcCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8g5oqK6Z2e6aKE5Yi25L2T5YaF55qE57uE5Lu277yM5pu05paw5Yiw6aKE5Yi25L2T5L+h5oGv5LitXG4gICAgICAgIGNvbnN0IG1vdW50ZWRDb21wb25lbnRzSW5mb01hcCA9IGNvbXBvbmVudE9wZXJhdGlvbi5hcHBseU1vdW50ZWRDb21wb25lbnRzKG5vZGUpO1xuICAgICAgICBpZiAoIW1vdW50ZWRDb21wb25lbnRzSW5mb01hcCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgdGhpcy5hcHBseVByb3BlcnR5T3ZlcnJpZGVzKG5vZGUpO1xuICAgICAgICB0aGlzLmFwcGx5UmVtb3ZlZENvbXBvbmVudHMobm9kZSk7XG4gICAgICAgIHRoaXMuYXBwbHlUYXJnZXRPdmVycmlkZXMobm9kZSk7XG4gICAgICAgIGNvbnN0IHJldCA9IHByZWZhYlV0aWxzLmdlbmVyYXRlUHJlZmFiRGF0YUZyb21Ob2RlKG5vZGUpO1xuICAgICAgICBpZiAoIXJldCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmIChyZXQuY2xlYXJlZFJlZmVyZW5jZSkge1xuICAgICAgICAgICAgdGhpcy5yZXN0b3JlQ2xlYXJlZFJlZmVyZW5jZShub2RlLCByZXQuY2xlYXJlZFJlZmVyZW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3NhdmVBc3NldCcsIFtcbiAgICAgICAgICAgICAgICBpbmZvLnNvdXJjZSwgcmV0LnByZWZhYkRhdGEsXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIHByZWZhYlV0aWxzLnJlbW92ZVByZWZhYkFzc2V0Tm9kZUluc3RhbmNlQ2FjaGUocHJlZmFiSW5mbyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5vZGVVVUlELFxuICAgICAgICAgICAgYXNzZXRVdWlkOiBhc3NldC5fdXVpZCxcbiAgICAgICAgICAgIGFzc2V0U291cmNlOiBpbmZvLnNvdXJjZSxcbiAgICAgICAgICAgIG9sZFByZWZhYkNvbnRlbnQsXG4gICAgICAgICAgICBuZXdQcmVmYWJDb250ZW50OiByZXQucHJlZmFiRGF0YSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlQ2hpbGRyZW5EYXRhKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzlvZPliY3mraPlnKjnp7vpmaQgTW91bnRlZENoaWxkcmVu77yM5YiZ5LiN6ZyA6KaB5pu05paw6L+Z5Liq5pWw5o2u5LqGXG4gICAgICAgIGlmICh0aGlzLmlzUmVtb3ZpbmdNb3VudGVkQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICAvLyDlpoLmnpzoioLngrnkuI3mmK/kuIDkuKpQcmVmYWLlsLHkuI3nlKjlvoDkuIvlpITnkIbkuoZcbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzmnIDlpJblsYLmnInkuIDkuKogcHJlZmFiSW5zdGFuY2XvvIzlsLHopoHorrDlvZXliLAgcHJlZmFiSW5zdGFuY2Ug5Lit5oiQ5Li65LiA5LiqIG1vdW50ZWRDaGlsZHJlbiwg6L+Y6ZyA6KaB5L+d6K+B6aG65bqPXG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8gPSBwcmVmYWJVdGlscy5nZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKG5vZGUpO1xuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlOiBOb2RlIHwgbnVsbCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aDogc3RyaW5nW10gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvLnRhcmdldFBhdGg7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluZm8gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ107XG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UgfCB1bmRlZmluZWQgPSBvdXRNb3N0UHJlZmFiSW5mbz8uaW5zdGFuY2U7XG5cbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlIHx8ICFvdXRNb3N0UHJlZmFiSW5mbyB8fCAhb3V0TW9zdFByZWZhYkluc3RhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldFJvb3ROb2RlID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiQXNzZXROb2RlSW5zdGFuY2Uob3V0TW9zdFByZWZhYkluZm8pO1xuICAgICAgICBpZiAoIWFzc2V0Um9vdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpOyAvLyDkuI3pnIDopoHlrZjmnIDlpJblsYLnmoQgUHJlZmFiSW5zdGFuY2Ug55qEIGZpbGVJRO+8jOaWueS+vyBvdmVycmlkZSDlj6/ku6XlnKggUHJlZmFiSW5zdGFuY2Ug5aSN5Yi25ZCO5aSN55SoXG4gICAgICAgIHRhcmdldFBhdGgucHVzaChwcmVmYWJJbmZvLmZpbGVJZCk7XG4gICAgICAgIGNvbnN0IG5vZGVJbkFzc2V0OiBOb2RlIHwgbnVsbCA9IHByZWZhYlV0aWxzLmdldFRhcmdldCh0YXJnZXRQYXRoLCBhc3NldFJvb3ROb2RlKSBhcyBOb2RlO1xuXG4gICAgICAgIGlmICghbm9kZUluQXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuRmlsZUlEcyA9IG5vZGVJbkFzc2V0LmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBjaGlsZFsnX3ByZWZhYiddO1xuICAgICAgICAgICAgaWYgKCFwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJlZmFiSW5mby5pbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmYWJJbmZvLmluc3RhbmNlLmZpbGVJZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZhYkluZm8uZmlsZUlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhZGRlZENoaWxkcmVuOiBOb2RlW10gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICBjb25zdCBjaGlsZFByZWZhYkluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWIoY2hpbGROb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkUHJlZmFiSW5zdGFuY2UgPSBjaGlsZFByZWZhYkluZm8/Lmluc3RhbmNlO1xuXG4gICAgICAgICAgICAvLyDlj6/ku6XlhpnlhaUgbW91bnRlZENoaWxkcmVuIOeahOadoeS7tu+8mlxuICAgICAgICAgICAgLy8gMS4g5piv5LiA5Liq5pmu6YCa6IqC54K5XG4gICAgICAgICAgICAvLyAyLiDmmK/kuIDkuKrkuI3lnKjliKvnmoQgUHJlZmFiIOi1hOa6kOmHjOeahOaWsOWinuiKgueCuVxuICAgICAgICAgICAgaWYgKCFjaGlsZFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICBhZGRlZENoaWxkcmVuLnB1c2goY2hpbGROb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZUlEID0gY2hpbGRQcmVmYWJJbnN0YW5jZSA/IGNoaWxkUHJlZmFiSW5zdGFuY2UuZmlsZUlkIDogY2hpbGRQcmVmYWJJbmZvLmZpbGVJZDtcbiAgICAgICAgICAgICAgICBpZiAoIWNoaWxkcmVuRmlsZUlEcy5pbmNsdWRlcyhmaWxlSUQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIG1vdW50ZWRSb290IOS4uuepuuihqOekuuS4uuaWsOWKoOeahOiKgueCuVxuICAgICAgICAgICAgICAgICAgICAvLyAyLiBtb3VudGVkUm9vdCDkuI3kuLrnqbrpnIDopoHmn6XnnIvmmK/kuI3mmK/mjILlnKjov5nkuKogUHJlZmFiSW5zdGFuY2Ug6IqC54K55LiL55qE77yM5Zug5Li65Y+v6IO95piv5oyC5Zyo6YeM5bGCIFByZWZhYkluc3RhbmNlIOmHjCzov5nph4zlsLHkuI3lupTor6Xph43lpI3mt7vliqBcbiAgICAgICAgICAgICAgICAgICAgLy8gMy4gbW91bnRlZFJvb3Qg5LiN5Li656m677yM5bm25LiUIG1vdW50ZWRSb290IOS4jeaYryBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlIOmcgOimgei/m+ihjOWQjOatpe+8iGZpeDogaHR0cHM6Ly9naXRodWIuY29tL2NvY29zLzNkLXRhc2tzL2lzc3Vlcy8xODUxNu+8iVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3VudGVkUm9vdCA9IHByZWZhYlV0aWxzLmdldE1vdW50ZWRSb290KGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbW91bnRlZFJvb3QgfHwgbW91bnRlZFJvb3QgPT09IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgfHwgbW91bnRlZFJvb3QgIT09IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkQ2hpbGRyZW4ucHVzaChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUJlZm9yZUNoYW5nZU1zZyhvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcbiAgICAgICAgaWYgKGFkZGVkQ2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgYWRkZWRDaGlsZEluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWJJbnN0YW5jZU1vdW50ZWRDaGlsZHJlbihvdXRNb3N0UHJlZmFiSW5zdGFuY2UsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgYWRkZWRDaGlsZEluZm8ubm9kZXMgPSBhZGRlZENoaWxkcmVuO1xuICAgICAgICAgICAgYWRkZWRDaGlsZEluZm8ubm9kZXMuZm9yRWFjaCgoY2hpbGROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QoY2hpbGROb2RlLCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRNb3N0UHJlZmFiSW5zdGFuY2UubW91bnRlZENoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRJbmZvID0gb3V0TW9zdFByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRJbmZvLmlzVGFyZ2V0KHRhcmdldFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkSW5mby5ub2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QoY2hpbGQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBvdXRNb3N0UHJlZmFiSW5zdGFuY2UubW91bnRlZENoaWxkcmVuLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2cob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0NpcmN1bGFyUmVmUHJlZmFiSW5zdGFuY2UoY2hlY2tOb2RlOiBOb2RlLCByb290OiBOb2RlKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgY2hlY2tQcmVmYWJJbmZvID0gY2hlY2tOb2RlWydfcHJlZmFiJ107XG5cbiAgICAgICAgaWYgKCFjaGVja1ByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoZWNrUHJlZmFiSW5zdGFuY2UgPSBjaGVja1ByZWZhYkluZm8uaW5zdGFuY2U7XG4gICAgICAgIGlmICghY2hlY2tQcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrTm9kZSA9PT0gcm9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2hlY2tQcmVmYWJBc3NldEVxdWFsKG5vZGVBOiBOb2RlLCBub2RlQjogTm9kZSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mb0EgPSBub2RlQVsnX3ByZWZhYiddO1xuICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2VBID0gcHJlZmFiSW5mb0E/Lmluc3RhbmNlO1xuXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbmZvQiA9IG5vZGVCWydfcHJlZmFiJ107XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZUIgPSBwcmVmYWJJbmZvQj8uaW5zdGFuY2U7XG5cbiAgICAgICAgICAgIGlmIChwcmVmYWJJbnN0YW5jZUEgJiYgcHJlZmFiSW5zdGFuY2VCICYmIHByZWZhYkluZm9BPy5hc3NldD8uX3V1aWQgPT09IHByZWZhYkluZm9CPy5hc3NldD8uX3V1aWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrUHJlZmFiQXNzZXRFcXVhbChjaGVja05vZGUsIHJvb3QpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnQgPSBjaGVja05vZGUucGFyZW50O1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQgIT09IHJvb3QpIHtcbiAgICAgICAgICAgIGlmIChjaGVja1ByZWZhYkFzc2V0RXF1YWwoY2hlY2tOb2RlLCBwYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBjYW5CZU1hZGVUb1ByZWZhYkFzc2V0KG5vZGU6IE5vZGUpOiBib29sZWFuIHtcbiAgICAgICAgbGV0IGhhc1RlcnJhaW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGhhc05lc3RlZFByZWZhYiA9IGZhbHNlO1xuICAgICAgICBub2RlLndhbGsoKHRhcmdldDogTm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRhcmdldC5nZXRDb21wb25lbnQoVGVycmFpbikpIHtcbiAgICAgICAgICAgICAgICBoYXNUZXJyYWluID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNDaXJjdWxhclJlZlByZWZhYkluc3RhbmNlKHRhcmdldCwgbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENpcmN1bGFyIHJlZmVyZW5jZSBwcmVmYWIgY2hlY2tlZDogWyR7dGFyZ2V0Lm5hbWV9XWApO1xuICAgICAgICAgICAgICAgIGhhc05lc3RlZFByZWZhYiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChoYXNUZXJyYWluKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0NhblxcJ3QgY3JlYXRlIHByZWZhYkFzc2V0IGZyb20gYSBub2RlIHRoYXQgY29udGFpbnMgdGVycmFpbicpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc05lc3RlZFByZWZhYikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDYW5cXCd0IGNyZWF0ZSBwcmVmYWJBc3NldCBmcm9tIGEgbm9kZSB0aGF0IGNvbnRhaW5zIGNpcmN1bGFyIHJlZmVyZW5jZSBwcmVmYWInKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7juS4gOS4quiKgueCueeUn+aIkOS4gOS4qiBQcmVmYWJBc3NldFxuICAgICAqIEBwYXJhbSBub2RlVVVJRFxuICAgICAqIEBwYXJhbSB1cmxcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBjcmVhdGVQcmVmYWJBc3NldEZyb21Ob2RlKG5vZGVVVUlEOiBzdHJpbmcsIHVybDogc3RyaW5nLCBvcHRpb25zID0geyBvdmVyd3JpdGU6IHRydWUgfSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZU1nci5nZXROb2RlKG5vZGVVVUlEKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG5vZGUpO1xuXG4gICAgICAgIGlmIChwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCB7IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgfSA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8obm9kZSk7XG4gICAgICAgICAgICAvLyDmmK/kuIDkuKogUHJlZmFiQXNzZXQg5Lit55qE5a2Q6IqC54K55bm25LiUIFByZWZhYkFzc2V0IOiiq+WunuS+i+WMluS6hlxuICAgICAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgIT09IG5vZGUgJiYgbm9kZS5pc0NoaWxkT2Yob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkgJiYgIXByZWZhYlV0aWxzLmdldE1vdW50ZWRSb290KG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdjYW5cXCd0IGNyZWF0ZSBwcmVmYWJBc3NldCBmcm9tIGEgcHJlZmFiTm9kZSBpbnNpZGUgYSBwcmVmYWJJbnN0YW5jZScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5ouW5ou96aKE5Yi25L2T5pe277yM6ZyA6KaB5pu05paw5omA5pyJ55qEIHByb3BlcnR5T3ZlcnJpZGVzICMxNzYyMlxuICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBwcmVmYWJJbmZvLmluc3RhbmNlO1xuICAgICAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBseVByb3BlcnR5T3ZlcnJpZGVzKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmNhbkJlTWFkZVRvUHJlZmFiQXNzZXQobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmV0ID0gcHJlZmFiVXRpbHMuZ2VuZXJhdGVQcmVmYWJEYXRhRnJvbU5vZGUobm9kZSk7XG4gICAgICAgIGlmICghcmV0KSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyDlpoLmnpzmnKzouqvlsLHmmK/kuIDkuKogcHJlZmFi5LqG77yM6YKj5bCx5YWI5LuO6Ieq5Yqo55uR5ZCs5Y+Y5Yqo55qE5YiX6KGo5Yig6Zmk77yM562J5ZCO6Z2iIGxpbmsg5a6M5YaNIHNvZnRSZWxvYWRcbiAgICAgICAgaWYgKHByZWZhYkluZm8gJiYgcHJlZmFiSW5mby5hc3NldCkge1xuICAgICAgICAgICAgdGhpcy5hc3NldFRvTm9kZXNNYXAuZGVsZXRlKHByZWZhYkluZm8uYXNzZXQuX3V1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAnY3JlYXRlQXNzZXQnLCBbe1xuICAgICAgICAgICAgdGFyZ2V0OiB1cmwsXG4gICAgICAgICAgICBjb250ZW50OiByZXQucHJlZmFiRGF0YSxcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogb3B0aW9ucy5vdmVyd3JpdGUsXG4gICAgICAgIH1dKTtcbiAgICAgICAgbGV0IGFzc2V0Um9vdE5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICBhc3NldFJvb3ROb2RlID0gYXdhaXQgdGhpcy5yZXBsYWNlTmV3UHJlZmFiQXNzZXRXaXRoQ2xlYXJlZFJlZmVyZW5jZShub2RlLCBhc3NldC51dWlkLCByZXQuY2xlYXJlZFJlZmVyZW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXNzZXRSb290Tm9kZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiAg5bqU55So6KKr5riF55CG5o6J55qE5byV55So5pWw5o2uXG4gICAgICogQHBhcmFtIG5vZGUg6aKE5Yi25L2T5a6e5L6L6IqC54K5XG4gICAgICogQHBhcmFtIGNsZWFyZWRSZWZlcmVuY2Ug6KKr5riF55CG5o6J55qE5byV55So5pWw5o2uXG4gICAgICovXG4gICAgcHVibGljIHJlc3RvcmVDbGVhcmVkUmVmZXJlbmNlKG5vZGU6IE5vZGUsIGNsZWFyZWRSZWZlcmVuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0TWFwID0ge307XG4gICAgICAgIFByZWZhYi5fdXRpbHMuZ2VuZXJhdGVUYXJnZXRNYXAobm9kZSwgdGFyZ2V0TWFwLCB0cnVlKTtcblxuICAgICAgICAvLyDlpoLmnpzmi5bmi73nmoTmmK/mma7pgJroioLngrnvvIzov5jljp/lvJXnlKjlkI7vvIzopoHmm7TmlrAgcHJvcGVydHlPdmVycmlkZXMvdGFyZ2V0T3ZlcnJpZGUg5L+h5oGvXG4gICAgICAgIC8vIOWmguaenOaLluaLveeahOaYr+mihOWItuS9k++8jOeUseS6juaVsOaNruW3sue7j+WtmOWcqO+8jOaJgOS7peWPr+S7peS4jeeUqOabtOaWsFxuICAgICAgICBmb3IgKGNvbnN0IGZpbGVJRCBpbiBjbGVhcmVkUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gY2xlYXJlZFJlZmVyZW5jZVtmaWxlSURdO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxJRHMgPSBbZGF0YS5jb21wb25lbnRdO1xuICAgICAgICAgICAgY29uc3QgY29tcCA9IFByZWZhYi5fdXRpbHMuZ2V0VGFyZ2V0KGxvY2FsSURzLCB0YXJnZXRNYXApIGFzIENvbXBvbmVudDtcbiAgICAgICAgICAgIGlmIChjb21wKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDph43mlrDotYvlgLxcbiAgICAgICAgICAgICAgICBjb21wW2RhdGEucGF0aF0gPSBkYXRhLnZhbHVlO1xuICAgICAgICAgICAgICAgIC8vIOabtOaWsCBub2RlIOaVsOaNrlxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBjb21wLm5vZGU7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjb21wLm5vZGUuY29tcG9uZW50cy5pbmRleE9mKGNvbXApO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdDogSUNoYW5nZU5vZGVPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBwcm9wUGF0aDogYF9fY29tcHNfXy4ke2luZGV4fS4ke2RhdGEucGF0aH1gLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlRXZlbnRUeXBlLlNFVF9QUk9QRVJUWSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIOi/meS4quaWueazleS8muabtOaWsCBwcm9wZXJ0eU92ZXJyaWRlcy90YXJnZXRPdmVycmlkZSDkv6Hmga9cbiAgICAgICAgICAgICAgICB0aGlzLm9uTm9kZUNoYW5nZWRJbkdlbmVyYWxNb2RlKG5vZGUsIG9wdCwgU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICog5pu05paw6aKE5Yi25L2T6LWE5rqQ5ZCOLOabv+aNouWcuuaZr+S4reeahOmihOWItuS9k+WunuS+iyzlubbov5jljp/ooqvmuIXnkIbmjonnmoTlvJXnlKjmlbDmja5cbiAgICAgKiBAcGFyYW0gbm9kZSDlvoXmm7/mjaLnmoToioLngrlcbiAgICAgKiBAcGFyYW0gcHJlZmFiQXNzZXQg5paw55qE6aKE5Yi25L2T6LWE5rqQIHV1aWRcbiAgICAgKiBAcGFyYW0gY2xlYXJlZFJlZmVyZW5jZSDooqvmuIXpmaTnmoTlr7nlpJbpg6joioLngrnnmoTlvJXnlKjmlbDmja5cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVwbGFjZU5ld1ByZWZhYkFzc2V0V2l0aENsZWFyZWRSZWZlcmVuY2Uobm9kZTogTm9kZSwgcHJlZmFiQXNzZXQ6IHN0cmluZywgY2xlYXJlZFJlZmVyZW5jZTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgICAgICAvLyDnp7vpmaTljp/mnaXnmoQgbm9kZSzliqDovb3mlrDnmoTpooTliLbkvZPkvZzkuLrlrZDoioLngrlcbiAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cocGFyZW50KTtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbm9kZS5nZXRTaWJsaW5nSW5kZXgoKTtcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYiA9IGF3YWl0IHNjZW5lVXRpbHMubG9hZEFueTxQcmVmYWI+KHByZWZhYkFzc2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0Um9vdE5vZGUgPSBpbnN0YW50aWF0ZShwcmVmYWIpO1xuICAgICAgICAgICAgaWYgKGFzc2V0Um9vdE5vZGVbJ19wcmVmYWInXSAmJiAhYXNzZXRSb290Tm9kZVsnX3ByZWZhYiddLmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgYXNzZXRSb290Tm9kZVsnX3ByZWZhYiddLmluc3RhbmNlID0gcHJlZmFiVXRpbHMuY3JlYXRlUHJlZmFiSW5zdGFuY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlWydfcHJlZmFiJ10gJiYgbm9kZVsnX3ByZWZhYiddLmluc3RhbmNlICYmIGFzc2V0Um9vdE5vZGVbJ19wcmVmYWInXSAmJiBhc3NldFJvb3ROb2RlWydfcHJlZmFiJ10uaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBhc3NldFJvb3ROb2RlWydfcHJlZmFiJ10uaW5zdGFuY2UuZmlsZUlkID0gbm9kZVsnX3ByZWZhYiddLmluc3RhbmNlLmZpbGVJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcyhhc3NldFJvb3ROb2RlKTtcbiAgICAgICAgICAgIC8vIOWQjOatpSBQcm9wZXJ0eU92ZXJyaWRlc1xuICAgICAgICAgICAgdGhpcy5zeW5jUHJvcGVydHlPdmVycmlkZXMoYXNzZXRSb290Tm9kZSwgU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKSBhcyBOb2RlKTtcblxuICAgICAgICAgICAgdGhpcy5yZXN0b3JlQ2xlYXJlZFJlZmVyZW5jZShhc3NldFJvb3ROb2RlLCBjbGVhcmVkUmVmZXJlbmNlKTtcblxuICAgICAgICAgICAgbm9kZS5wYXJlbnQgPSBudWxsO1xuICAgICAgICAgICAgcGFyZW50Lmluc2VydENoaWxkKGFzc2V0Um9vdE5vZGUsIGluZGV4KTtcbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2cocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldFJvb3ROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhuS4gOS4qiBub2RlIOS4juS4gOS4qiBwcmVmYWIg5YWz6IGU5Yiw5LiA6LW3XG4gICAgICogQHBhcmFtIG5vZGVVVUlEXG4gICAgICogQHBhcmFtIHsqfSBhc3NldFV1aWQg5YWz6IGU55qE6LWE5rqQXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGxpbmtOb2RlV2l0aFByZWZhYkFzc2V0KG5vZGVVVUlEOiBzdHJpbmcgfCBOb2RlLCBhc3NldFV1aWQ6IHN0cmluZyB8IGFueSkge1xuICAgICAgICBsZXQgbm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIG5vZGVVVUlEID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVNZ3IuZ2V0Tm9kZShub2RlVVVJRCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZVVVSUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhc3NldDogYW55ID0gYXNzZXRVdWlkO1xuICAgICAgICBpZiAodHlwZW9mIGFzc2V0VXVpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIGFzc2V0ID0gY2NlLnByZWZhYlV0aWwuc2VyaWFsaXplLmFzQXNzZXQoYXNzZXRVdWlkKTtcbiAgICAgICAgICAgIGFzc2V0ID0gYXdhaXQgc2NlbmVVdGlscy5sb2FkQW55KGFzc2V0VXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldCAke2Fzc2V0VXVpZH0gZG9lc24ndCBleGlzdGApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXRSb290Tm9kZSA9IGFzc2V0LmRhdGE7XG4gICAgICAgIGlmICghYXNzZXRSb290Tm9kZSB8fCAhYXNzZXRSb290Tm9kZVsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcmVmYWJVdGlscy5maXJlQmVmb3JlQ2hhbmdlTXNnKG5vZGUpO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgbGV0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcHJlZmFiSW5mbyA9IG5ldyBQcmVmYWJJbmZvKCk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBub2RlWydfcHJlZmFiJ10gPSBwcmVmYWJJbmZvO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJlZmFiVXRpbHMucmVtb3ZlUHJlZmFiQXNzZXROb2RlSW5zdGFuY2VDYWNoZShwcmVmYWJJbmZvKTtcbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZSA9IHByZWZhYlV0aWxzLmNyZWF0ZVByZWZhYkluc3RhbmNlKCk7XG5cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG4gICAgICAgICAgICBpZiAocHJlZmFiSW5mbykge1xuICAgICAgICAgICAgICAgIC8vIFRCRCDlvZMgcHJlZmFiSW5mbyDmmK/mlrDlu7rnmoTml7blgJnvvIxyb290IOS8muS4uuepulxuICAgICAgICAgICAgICAgIHByZWZhYkluc3RhbmNlLnByZWZhYlJvb3ROb2RlID0gcHJlZmFiSW5mby5yb290O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0gcHJlZmFiSW5zdGFuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVmYWJVdGlscy5yZW1vdmVNb3VudGVkUm9vdEluZm8obm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlvZPliY3moLnoioLngrnnmoQgZmlsZUlkIOWQjOatpeS4uiBQcmVmYWJBc3NldCDmoLnoioLngrnnmoQgZmlsZUlkIOWQju+8jOWGjeWIm+W7uum7mOiupOagueiKgueCueeahCBQcm9wZXJ0eU92ZXJyaWRlXG4gICAgICAgIHByZWZhYkluZm8uZmlsZUlkID0gYXNzZXRSb290Tm9kZVsnX3ByZWZhYiddLmZpbGVJZDtcbiAgICAgICAgcHJlZmFiSW5mby5yb290ID0gbm9kZTtcbiAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBwcmVmYWJJbmZvPy5pbnN0YW5jZTtcbiAgICAgICAgaWYgKHByZWZhYkluZm8gJiYgcHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcyhub2RlKTtcbiAgICAgICAgICAgIC8vIOWOu+aOiei6q+S4iueahOWQhOenjSBvdmVycmlkZSzku6Xkvr/ph43mlrDliqDovb3ml7blrozlhajnlKggUHJlZmFiQXNzZXQg55qE5pWw5o2uXG4gICAgICAgICAgICBwcmVmYWJJbnN0YW5jZS5tb3VudGVkQ2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlTW9kaWZpZWRQcm9wZXJ0eU92ZXJyaWRlcyhwcmVmYWJJbnN0YW5jZSwgcHJlZmFiSW5mby5maWxlSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBwcmVmYWJJbmZvLmFzc2V0ID0gYXNzZXQ7XG5cbiAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhub2RlKTtcblxuICAgICAgICAvLyDlsIYgUHJlZmFiQXNzZXQg5Lit55qEIFByZWZhYkluZm8g5ZCM5q2l5Yiw5b2T5YmN6KaBIGxpbmsg55qE6IqC54K55LiKXG4gICAgICAgIC8vIOi/memHjOS4uuS6hiBVbmRvIOiDveato+W4uOW3peS9nO+8jOS4jeS9v+eUqCBzb2Z0UmVsb2FkIOeahOaWueW8j++8jOmcgOimgeazqOaEj+WkhOeQhuWlveaVsOaNrueahOS4gOiHtOaAp1xuICAgICAgICB0aGlzLnN5bmNQcmVmYWJJbmZvKGFzc2V0Um9vdE5vZGUsIG5vZGUsIG5vZGUpO1xuXG4gICAgICAgIC8vIHN5bmNQcmVmYWJJbmZvIG1heSBvdmVyd3JpdGUgcHJlZmFiSW5mby5hc3NldCB3aXRoIGEgbnVsbC91bmluaXRpYWxpemVkXG4gICAgICAgIC8vIHZhbHVlIGZyb20gdGhlIGFzc2V0IHJvb3Qgbm9kZSdzIF9wcmVmYWIuYXNzZXQuIFJlLWVuc3VyZSB0aGUgY29ycmVjdFxuICAgICAgICAvLyByZWZlcmVuY2Ugb24gdGhlIHJvb3QgYW5kIHByb3BhZ2F0ZSB0byBjaGlsZHJlbiB0aGF0IHN5bmNQcmVmYWJJbmZvIG1heVxuICAgICAgICAvLyBoYXZlIHNraXBwZWQgKGUuZy4gd2hlbiBtb3VudGVkIGNoaWxkcmVuIGNhdXNlIGEgc3RydWN0dXJlIG1pc21hdGNoKS5cbiAgICAgICAgdGhpcy5lbnN1cmVQcmVmYWJBc3NldE9uVHJlZShub2RlLCBhc3NldCk7XG5cbiAgICAgICAgdGhpcy5jaGVja1RvQWRkUHJlZmFiQXNzZXRNYXAobm9kZSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5oqK5bWM5aWX6aKE5Yi25L2T55qEIFByb3BlcnR5T3ZlcnJpZGVzIOS/oeaBr+abtOaWsOWIsOaWsOeahOmihOWItuS9k+WunuS+i+S4ilxuICAgICAqIEBwYXJhbSBwcmVmYWJOb2RlIOW+heWQjOatpeeahOmihOWItuS9k+iKgueCuVxuICAgICAqIEBwYXJhbSByb290Tm9kZSDluKbmnInmiYDmnInpooTliLbkvZPlrp7kvovkv6Hmga/nmoTmoLnoioLngrlcbiAgICAgKi9cbiAgICBwdWJsaWMgc3luY1Byb3BlcnR5T3ZlcnJpZGVzKHByZWZhYk5vZGU6IE5vZGUsIHJvb3ROb2RlOiBOb2RlKSB7XG4gICAgICAgIC8vIGNvbGxlY3RJbnN0YW5jZU9mUm9vdFxuICAgICAgICBjb25zdCByb290czogTm9kZVtdID0gW107XG4gICAgICAgIHByZWZhYlV0aWxzLmZpbmRPdXRtb3N0UHJlZmFiSW5zdGFuY2VOb2Rlcyhyb290Tm9kZSBhcyBOb2RlLCByb290cyk7XG5cbiAgICAgICAgaWYgKHJvb3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIGNvbGxlY3RJbnN0YW5jZU9mUHJlZmFiXG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZU5vZGVzID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgcHJlZmFiTm9kZS53YWxrKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkWydfcHJlZmFiJ10gJiYgY2hpbGRbJ19wcmVmYWInXS5pbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZU5vZGVzLnNldChjaGlsZFsnX3ByZWZhYiddLmluc3RhbmNlLmZpbGVJZCwgY2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBzeW5jIHByb3BlcnR5IG92ZXJyaWRlc1xuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSByb290cy5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSByb290c1tpbmRleF1bJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnN0YW5jZUZpbGVJZCA9IHByZWZhYkluZm8/Lmluc3RhbmNlPy5maWxlSWQ7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEZpbGVJZCA9IHByZWZhYk5vZGVbJ19wcmVmYWInXS5pbnN0YW5jZT8uZmlsZUlkO1xuICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZU5vZGVzLmhhcyhpbnN0YW5jZUZpbGVJZCkgJiYgcHJlZmFiSW5mbz8uaW5zdGFuY2UgJiYgcHJlZmFiSW5mby5pbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByb3BPdmVycmlkZXMgPSBwcmVmYWJOb2RlWydfcHJlZmFiJ10uaW5zdGFuY2UucHJvcGVydHlPdmVycmlkZXM7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UucHJvcGVydHlPdmVycmlkZXMuZm9yRWFjaCgocHJvcHM6IFByb3BlcnR5T3ZlcnJpZGVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpg6jliIbkv53nlZnlsZ7mgKfkuI3pnIDopoHph43lpI3lpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1Jlc2VydmVkUHJvcGVydHlPdmVycmlkZXMocHJvcHMsIHByZWZhYkluZm8uZmlsZUlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFByb3BPdmVycmlkZXMucHVzaChwcm9wcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZUZpbGVJZCAhPT0gdGFyZ2V0RmlsZUlkICYmIGluc3RhbmNlRmlsZUlkICYmIHByb3BzLnRhcmdldEluZm8/LmxvY2FsSURbMF0gIT09IGluc3RhbmNlRmlsZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLnRhcmdldEluZm8/LmxvY2FsSUQudW5zaGlmdChpbnN0YW5jZUZpbGVJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDpnIDopoHmm7TmlrDlsZ7mgKdcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE1hcCA9IHt9O1xuICAgICAgICAgICAgUHJlZmFiLl91dGlscy5nZW5lcmF0ZVRhcmdldE1hcChwcmVmYWJOb2RlLCB0YXJnZXRNYXAsIHRydWUpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgUHJlZmFiLl91dGlscy5hcHBseVByb3BlcnR5T3ZlcnJpZGVzKHByZWZhYk5vZGUsIHByZWZhYk5vZGVbJ19wcmVmYWInXS5pbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcywgdGFyZ2V0TWFwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOWwhiBQcmVmYWJBc3NldCDkuK3nmoQgUHJlZmFiIOS/oeaBr+WQjOatpeWIsOW9k+WJjeeahOiKgueCueS4ilxuICAgIHB1YmxpYyBzeW5jUHJlZmFiSW5mbyhhc3NldE5vZGU6IE5vZGUsIGRzdE5vZGU6IE5vZGUsIHJvb3ROb2RlOiBOb2RlKSB7XG4gICAgICAgIGlmICghYXNzZXROb2RlIHx8ICFkc3ROb2RlIHx8ICFyb290Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgIGNvbnN0IHNyY1ByZWZhYkluZm8gPSBhc3NldE5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICBpZiAoIXNyY1ByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2coZHN0Tm9kZSk7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgIGlmICghZHN0Tm9kZVsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIG1lbWJlciBhY2Nlc3NcbiAgICAgICAgICAgIGRzdE5vZGVbJ19wcmVmYWInXSA9IG5ldyBQcmVmYWJJbmZvKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBAdHMtaWdub3JlIG1lbWJlciBhY2Nlc3NcbiAgICAgICAgY29uc3QgZHN0UHJlZmFiSW5mbyA9IGRzdE5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICBpZiAoIWRzdFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOW1jOWll+eahCBwcmVmYWIg5a2Q6IqC54K55Y+q6ZyA6KaB5ZCM5q2l5LiA5LiL5paw55qEIGFzc2V0IOWSjCBwcmVmYWJSb290Tm9kZSDlsLHlpb3kuoZcbiAgICAgICAgaWYgKGRzdFByZWZhYkluZm8uaW5zdGFuY2UgJiYgZHN0Tm9kZSAhPT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgIGRzdFByZWZhYkluZm8uYXNzZXQgPSBzcmNQcmVmYWJJbmZvLmFzc2V0O1xuICAgICAgICAgICAgZHN0UHJlZmFiSW5mby5pbnN0YW5jZS5wcmVmYWJSb290Tm9kZSA9IHJvb3ROb2RlO1xuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhkc3ROb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRzdFByZWZhYkluZm8uZmlsZUlkID0gc3JjUHJlZmFiSW5mby5maWxlSWQ7XG4gICAgICAgIGRzdFByZWZhYkluZm8uYXNzZXQgPSBzcmNQcmVmYWJJbmZvLmFzc2V0O1xuICAgICAgICBkc3RQcmVmYWJJbmZvLnJvb3QgPSByb290Tm9kZTtcblxuICAgICAgICBpZiAoYXNzZXROb2RlLmNvbXBvbmVudHMubGVuZ3RoICE9PSBkc3ROb2RlLmNvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdQcmVmYWIgQ29tcG9uZW50IGRvZXNuXFwndCBtYXRjaCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29weSBjb21wb25lbnQgZmlsZUlEXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXNzZXROb2RlLmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHNyY0NvbXAgPSBhc3NldE5vZGUuY29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGRzdENvbXAgPSBkc3ROb2RlLmNvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBpZiAoc3JjQ29tcCAmJiBzcmNDb21wLl9fcHJlZmFiICYmIGRzdENvbXApIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRzdENvbXAuX19wcmVmYWIpIHtcbiAgICAgICAgICAgICAgICAgICAgZHN0Q29tcC5fX3ByZWZhYiA9IG5ldyBDb21wUHJlZmFiSW5mbygpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRzdENvbXAuX19wcmVmYWIhLmZpbGVJZCA9IHNyY0NvbXAuX19wcmVmYWIuZmlsZUlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhkc3ROb2RlKTtcblxuICAgICAgICAvLyDpnIDopoHliZTpmaTmjonnp4HmnIkgTm9kZSDnmoTlvbHlk41cbiAgICAgICAgLy8g5bm25LiU5YGH6K6+6Zmk5Y6756eB5pyJ6IqC54K55ZCO77yMY2hpbGRyZW4g6aG65bqP5ZKM5Y6f5p2l5LiA6Ie0XG4gICAgICAgIGNvbnN0IGRzdENoaWxkcmVuOiBOb2RlW10gPSBbXTtcbiAgICAgICAgZHN0Tm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgLy8g5Y675o6J5LiN5pi+56S655qE6IqC54K5XG4gICAgICAgICAgICBpZiAoY2hpbGQub2JqRmxhZ3MgJiBDQ09iamVjdC5GbGFncy5IaWRlSW5IaWVyYXJjaHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRzdENoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYXNzZXROb2RlLmNoaWxkcmVuLmxlbmd0aCAhPT0gZHN0Q2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdQcmVmYWIgTm9kZSBkb2VzblxcJ3QgbWF0Y2gnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXNzZXROb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBzcmNDaGlsZE5vZGUgPSBhc3NldE5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICBjb25zdCBkc3RDaGlsZE5vZGUgPSBkc3RDaGlsZHJlbltpXTtcbiAgICAgICAgICAgIHRoaXMuc3luY1ByZWZhYkluZm8oc3JjQ2hpbGROb2RlLCBkc3RDaGlsZE5vZGUsIHJvb3ROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZW5zdXJlUHJlZmFiQXNzZXRPblRyZWUobm9kZTogTm9kZSwgYXNzZXQ6IGFueSk6IHZvaWQge1xuICAgICAgICAvLyBAdHMtaWdub3JlIG1lbWJlciBhY2Nlc3NcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKHByZWZhYkluZm8gJiYgIXByZWZhYkluZm8uYXNzZXQpIHtcbiAgICAgICAgICAgIHByZWZhYkluZm8uYXNzZXQgPSBhc3NldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbiA/PyBbXSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgICAgICBjb25zdCBjaGlsZFByZWZhYiA9IGNoaWxkWydfcHJlZmFiJ107XG4gICAgICAgICAgICBpZiAoIWNoaWxkUHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2hpbGRQcmVmYWIuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZW5zdXJlUHJlZmFiQXNzZXRPblRyZWUoY2hpbGQsIGFzc2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVSZXNlcnZlZFByb3BlcnR5T3ZlcnJpZGVzKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gcHJlZmFiSW5mbz8uaW5zdGFuY2U7XG5cbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvIHx8ICFwcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBSb290UmVzZXJ2ZWRQcm9wZXJ0eS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxJRCA9IFtwcmVmYWJJbmZvLmZpbGVJZF07XG4gICAgICAgICAgICBjb25zdCBwcm9wUGF0aCA9IFtSb290UmVzZXJ2ZWRQcm9wZXJ0eVtpXV07XG4gICAgICAgICAgICBjb25zdCBwcm9wVmFsdWUgPSAobm9kZSBhcyBhbnkpW1Jvb3RSZXNlcnZlZFByb3BlcnR5W2ldXTtcbiAgICAgICAgICAgIGNvbnN0IHByb3BPdmVycmlkZSA9IHByZWZhYlV0aWxzLmdldFByb3BlcnR5T3ZlcnJpZGUocHJlZmFiSW5zdGFuY2UsIGxvY2FsSUQsIHByb3BQYXRoKTtcbiAgICAgICAgICAgIHByb3BPdmVycmlkZS52YWx1ZSA9IHByb3BWYWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZXZlcnRQcm9wZXJ0eU92ZXJyaWRlKHByb3BPdmVycmlkZTogUHJlZmFiLl91dGlscy5Qcm9wZXJ0eU92ZXJyaWRlSW5mbywgY3VyTm9kZVRhcmdldE1hcDogYW55LCBhc3NldFRhcmdldE1hcDogYW55KSB7XG4gICAgICAgIGlmICghcHJvcE92ZXJyaWRlIHx8ICFwcm9wT3ZlcnJpZGUudGFyZ2V0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0SW5mbyA9IHByb3BPdmVycmlkZS50YXJnZXRJbmZvO1xuICAgICAgICBjb25zdCBhc3NldFRhcmdldCA9IFByZWZhYi5fdXRpbHMuZ2V0VGFyZ2V0KHRhcmdldEluZm8ubG9jYWxJRCwgYXNzZXRUYXJnZXRNYXApO1xuICAgICAgICBjb25zdCBjdXJUYXJnZXQgPSBQcmVmYWIuX3V0aWxzLmdldFRhcmdldCh0YXJnZXRJbmZvLmxvY2FsSUQsIGN1ck5vZGVUYXJnZXRNYXApO1xuICAgICAgICBpZiAoIWFzc2V0VGFyZ2V0IHx8ICFjdXJUYXJnZXQpIHtcbiAgICAgICAgICAgIC8vIENhbid0IGZpbmQgdGFyZ2V0XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgICAgICBpZiAoY3VyVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgbm9kZSA9IGN1clRhcmdldDtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJUYXJnZXQgaW5zdGFuY2VvZiBDb21wb25lbnQpIHtcbiAgICAgICAgICAgIG5vZGUgPSBjdXJUYXJnZXQubm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFzc2V0VGFyZ2V0UHJvcE93bmVyOiBhbnkgPSBhc3NldFRhcmdldDtcblxuICAgICAgICBsZXQgY3VyVGFyZ2V0UHJvcE93bmVyOiBhbnkgPSBjdXJUYXJnZXQ7XG4gICAgICAgIGxldCBjdXJUYXJnZXRQcm9wT3duZXJQYXJlbnQ6IGFueSA9IGN1clRhcmdldDsgLy8g55So5LqO6K6w5b2V5pyA5ZCO5pWw57uE5omA5Zyo55qEb2JqZWN0XG4gICAgICAgIGxldCB0YXJnZXRQcm9wT3duZXJOYW1lID0gJyc7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5UGF0aCA9IHByb3BPdmVycmlkZS5wcm9wZXJ0eVBhdGguc2xpY2UoKTtcbiAgICAgICAgaWYgKHByb3BlcnR5UGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRQcm9wTmFtZSA9IHByb3BlcnR5UGF0aC5wb3AoKTtcblxuICAgICAgICAgICAgaWYgKCF0YXJnZXRQcm9wTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wZXJ0eVBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHByb3BlcnR5UGF0aFtpXTtcbiAgICAgICAgICAgICAgICB0YXJnZXRQcm9wT3duZXJOYW1lID0gcHJvcE5hbWU7XG4gICAgICAgICAgICAgICAgYXNzZXRUYXJnZXRQcm9wT3duZXIgPSBhc3NldFRhcmdldFByb3BPd25lcltwcm9wTmFtZV07XG5cbiAgICAgICAgICAgICAgICBjdXJUYXJnZXRQcm9wT3duZXJQYXJlbnQgPSBjdXJUYXJnZXRQcm9wT3duZXI7XG4gICAgICAgICAgICAgICAgY3VyVGFyZ2V0UHJvcE93bmVyID0gY3VyVGFyZ2V0UHJvcE93bmVyW3Byb3BOYW1lXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUJlZm9yZUNoYW5nZU1zZyhub2RlKTtcblxuICAgICAgICAgICAgY3VyVGFyZ2V0UHJvcE93bmVyW3RhcmdldFByb3BOYW1lXSA9IGFzc2V0VGFyZ2V0UHJvcE93bmVyW3RhcmdldFByb3BOYW1lXTtcblxuICAgICAgICAgICAgLy8g5aaC5p6c5piv5pS55pWw57uE5YWD57Sg77yM6ZyA6KaB6YeN5paw6LWL5YC85LiA5LiL6Ieq5bex5Lul6Kem5Y+RIHNldHRlclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY3VyVGFyZ2V0UHJvcE93bmVyKSAmJiBjdXJUYXJnZXRQcm9wT3duZXJQYXJlbnQgJiYgdGFyZ2V0UHJvcE93bmVyTmFtZSkge1xuICAgICAgICAgICAgICAgIGN1clRhcmdldFByb3BPd25lclBhcmVudFt0YXJnZXRQcm9wT3duZXJOYW1lXSA9IGN1clRhcmdldFByb3BPd25lcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigncHJvcGVydHkgcGF0aCBpcyBlbXB0eScpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L+Y5Y6f5LiA5LiqIFByZWZhYkluc3RhbmNlIOeahOaVsOaNruS4uuWug+aJgOWFs+iBlOeahCBQcmVmYWJBc3NldFxuICAgICAqIEBwYXJhbSBub2RlVVVJRCBub2RlXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHJldmVydFByZWZhYihub2RlVVVJRDogTm9kZSB8IHN0cmluZykge1xuICAgICAgICBsZXQgbm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIG5vZGVVVUlEID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVNZ3IuZ2V0Tm9kZShub2RlVVVJRCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZVVVSUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZSA9IHByZWZhYkluZm8/Lmluc3RhbmNlO1xuXG4gICAgICAgIGlmICghcHJlZmFiSW5zdGFuY2UgfHwgIXByZWZhYkluZm8/LmFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldFJvb3ROb2RlID0gaW5zdGFudGlhdGUocHJlZmFiSW5mby5hc3NldCk7XG5cbiAgICAgICAgaWYgKCFhc3NldFJvb3ROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGN1ck5vZGVQcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGFzc2V0Um9vdE5vZGVQcmVmYWJJbmZvID0gYXNzZXRSb290Tm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAoIWN1ck5vZGVQcmVmYWJJbmZvIHx8ICFhc3NldFJvb3ROb2RlUHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXRUYXJnZXRNYXAgPSB7fTtcbiAgICAgICAgY29uc3QgY3VyTm9kZVRhcmdldE1hcCA9IHt9O1xuXG4gICAgICAgIFByZWZhYi5fdXRpbHMuZ2VuZXJhdGVUYXJnZXRNYXAoYXNzZXRSb290Tm9kZSwgYXNzZXRUYXJnZXRNYXAsIHRydWUpO1xuICAgICAgICBQcmVmYWIuX3V0aWxzLmdlbmVyYXRlVGFyZ2V0TWFwKG5vZGUsIGN1ck5vZGVUYXJnZXRNYXAsIHRydWUpO1xuXG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cobm9kZSk7XG5cbiAgICAgICAgY29uc3QgcmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wT3ZlcnJpZGUgPSBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlc1tpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUmVzZXJ2ZWRQcm9wZXJ0eU92ZXJyaWRlcyhwcm9wT3ZlcnJpZGUsIHByZWZhYkluZm8uZmlsZUlkKSkge1xuICAgICAgICAgICAgICAgIHJlc2VydmVkUHJvcGVydHlPdmVycmlkZXMucHVzaChwcm9wT3ZlcnJpZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJldmVydFByb3BlcnR5T3ZlcnJpZGUocHJvcE92ZXJyaWRlLCBjdXJOb2RlVGFyZ2V0TWFwLCBhc3NldFRhcmdldE1hcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcyA9IHJlc2VydmVkUHJvcGVydHlPdmVycmlkZXM7XG5cbiAgICAgICAgLy8g5Y675o6J6aKd5aSW5re75Yqg55qE6IqC54K5XG4gICAgICAgIHRoaXMuaXNSZW1vdmluZ01vdW50ZWRDaGlsZHJlbiA9IHRydWU7IC8vIOeUqOS6jumYsuatouS4i+mdouenu+mZpOWtkOiKgueCueaXtuWOu+abtOaWsG1vdW50ZWRDaGlsZHJlbumHjOeahOaVsOaNrlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYWRkZWRDaGlsZEluZm8gPSBwcmVmYWJJbnN0YW5jZS5tb3VudGVkQ2hpbGRyZW5baV07XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFkZGVkQ2hpbGRJbmZvLm5vZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgYWRkZWRDaGlsZEluZm8ubm9kZXNbal0uc2V0UGFyZW50KG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbiA9IFtdO1xuICAgICAgICB0aGlzLmlzUmVtb3ZpbmdNb3VudGVkQ2hpbGRyZW4gPSBmYWxzZTtcblxuICAgICAgICBjb21wb25lbnRPcGVyYXRpb24uaXNSZW1vdmluZ01vdW50ZWRDb21wb25lbnRzID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbnN0YW5jZS5tb3VudGVkQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbW91bnRlZENvbXBJbmZvID0gcHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHNbaV07XG4gICAgICAgICAgICAvLyDpgIbluo/vvIzpgb/lhY3nu4Tku7bpl7TmnInkvp3otZblhbPns7vlr7zoh7TmiqXplJlcbiAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IG1vdW50ZWRDb21wSW5mby5jb21wb25lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBsZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBtb3VudGVkQ29tcEluZm8uY29tcG9uZW50c1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcCAmJiBjb21wLm5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcC5ub2RlLnJlbW92ZUNvbXBvbmVudChjb21wKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g6ZyA6KaB56uL5Yi75omn6KGMIHJlbW92ZUNvbXBvbmVudCDmk43kvZzvvIzlkKbliJnkvJrlu7bov5/liLDkuIvkuIDluKdcbiAgICAgICAgY2MuT2JqZWN0Ll9kZWZlcnJlZERlc3Ryb3koKTtcbiAgICAgICAgcHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgY29tcG9uZW50T3BlcmF0aW9uLmlzUmVtb3ZpbmdNb3VudGVkQ29tcG9uZW50cyA9IGZhbHNlO1xuXG4gICAgICAgIGNvbXBvbmVudE9wZXJhdGlvbi5pc1JldmVydGluZ1JlbW92ZWRDb21wb25lbnRzID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbnN0YW5jZS5yZW1vdmVkQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0SW5mbyA9IHByZWZhYkluc3RhbmNlLnJlbW92ZWRDb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Q29tcEluQXNzZXQgPSBQcmVmYWIuX3V0aWxzLmdldFRhcmdldCh0YXJnZXRJbmZvLmxvY2FsSUQsIGFzc2V0VGFyZ2V0TWFwKSBhcyBDb21wb25lbnQ7XG4gICAgICAgICAgICBpZiAoIXRhcmdldENvbXBJbkFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGVMb2NhbElEID0gdGFyZ2V0SW5mby5sb2NhbElELnNsaWNlKCk7XG4gICAgICAgICAgICBub2RlTG9jYWxJRC5wb3AoKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIG5vZGVMb2NhbElELnB1c2godGFyZ2V0Q29tcEluQXNzZXQubm9kZVsnX3ByZWZhYiddPy5maWxlSWQpO1xuICAgICAgICAgICAgY29uc3QgY29tcE5vZGUgPSBQcmVmYWIuX3V0aWxzLmdldFRhcmdldChub2RlTG9jYWxJRCwgY3VyTm9kZVRhcmdldE1hcCkgYXMgTm9kZTtcbiAgICAgICAgICAgIGF3YWl0IGNvbXBvbmVudE9wZXJhdGlvbi5jbG9uZUNvbXBvbmVudFRvTm9kZShjb21wTm9kZSwgdGFyZ2V0Q29tcEluQXNzZXQpO1xuICAgICAgICB9XG4gICAgICAgIHByZWZhYkluc3RhbmNlLnJlbW92ZWRDb21wb25lbnRzID0gW107XG4gICAgICAgIGNvbXBvbmVudE9wZXJhdGlvbi5pc1JldmVydGluZ1JlbW92ZWRDb21wb25lbnRzID0gZmFsc2U7XG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2cobm9kZSk7XG5cbiAgICAgICAgLy8g5Zug5Li6546w5Zyo5oGi5aSN55qE5piv56eB5pyJ5Y+Y6YeP77yM5rKh5pyJ6Kem5Y+RIHNldHRlcu+8jOaJgOS7peaaguaXtuWPquiDvSBzb2Z0UmVsb2FkIOadpeS/neivgeaViOaenOato+ehrlxuICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5yZWxvYWQoeyBwcmVzZXJ2ZVVuZG9IaXN0b3J5OiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVQcmVmYWJJbmZvRnJvbU5vZGUobm9kZTogTm9kZSwgcmVtb3ZlTmVzdGVkPzogYm9vbGVhbikge1xuICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBOb2RlKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBjaGlsZFByZWZhYkluc3RhbmNlID0gY2hpbGRbJ19wcmVmYWInXT8uaW5zdGFuY2U7XG4gICAgICAgICAgICBpZiAoY2hpbGRQcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIC8vIOWIpOaWreW1jOWll+eahCBQcmVmYWJJbnN0YW5jZSDmmK/lkKbpnIDopoHnp7vpmaRcbiAgICAgICAgICAgICAgICBpZiAocmVtb3ZlTmVzdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlUHJlZmFiSW5mb0Zyb21Ob2RlKGNoaWxkLCByZW1vdmVOZXN0ZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVQcmVmYWJJbmZvRnJvbU5vZGUoY2hpbGQsIHJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByZWZhYlV0aWxzLnJlbW92ZVByZWZhYkluZm8obm9kZSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVByZWZhYkluZm9Gcm9tSW5zdGFuY2VOb2RlKG5vZGU6IE5vZGUsIHJlbW92ZU5lc3RlZD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuXG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBwcmVmYWJJbmZvLmluc3RhbmNlO1xuICAgICAgICAvLyDmraPluLjmg4XlhrXkuIvlj6rog73lnKggUHJlZmFiSW5zdGFuY2Ug5LiK5L2/55SoIHVuV3JhcFxuICAgICAgICAvLyDlpoLmnpzotYTmupDkuKLlpLHvvIzkuZ/lj6/ku6Xop6PpmaTlhbPns7tcbiAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlIHx8ICFwcmVmYWJJbmZvLmFzc2V0KSB7XG4gICAgICAgICAgICAvLyDnp7vpmaQgbW91bnRlZFJvb3Qg5L+h5oGvXG4gICAgICAgICAgICBwcmVmYWJVdGlscy5yZW1vdmVNb3VudGVkUm9vdEluZm8obm9kZSk7XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZSBwcmVmYWJJbmZvXG4gICAgICAgICAgICBwcmVmYWJVdGlscy53YWxrTm9kZShub2RlLCAodGFyZ2V0LCBpc0NoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gc2tpcCByb290XG4gICAgICAgICAgICAgICAgaWYgKCFpc0NoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByZWZhYkluZm8gPSB0YXJnZXRbJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByZWZhYkluc3RhbmNlID0gdGFyZ2V0UHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0UHJlZmFiSW5zdGFuY2UgfHwgIXRhcmdldFByZWZhYkluZm8uYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldFByZWZhYkluc3RhbmNlICYmIHRhcmdldFByZWZhYkluc3RhbmNlLnByZWZhYlJvb3ROb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDljrvmjonlrZDoioLngrnkuK3nmoQgUHJlZmFiSW5zdGFuY2Ug55qEIHByZWZhYlJvb3ROb2RlIOWvuei/meS4quiKgueCueeahOaMh+WQkVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UHJlZmFiSW5zdGFuY2UucHJlZmFiUm9vdE5vZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdGlscy5maXJlQ2hhbmdlTXNnKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbW92ZU5lc3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVQcmVmYWJJbmZvRnJvbUluc3RhbmNlTm9kZSh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdGlscy5yZW1vdmVQcmVmYWJJbmZvKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHByZWZhYlV0aWxzLnJlbW92ZVByZWZhYkluZm8obm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVByZWZhYkluc3RhbmNlQW5kQ2hhbmdlUm9vdChub2RlOiBOb2RlLCByb290Tm9kZTogTm9kZSwgcmVtb3ZlTmVzdGVkPzogYm9vbGVhbikge1xuICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBOb2RlKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBpZiAoY2hpbGRbJ19wcmVmYWInXT8uaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAvLyDliKTmlq3ltYzlpZfnmoQgUHJlZmFiSW5zdGFuY2Ug5piv5ZCm6ZyA6KaB56e76ZmkXG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZU5lc3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVByZWZhYkluc3RhbmNlQW5kQ2hhbmdlUm9vdChjaGlsZCwgcm9vdE5vZGUsIHJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVByZWZhYkluc3RhbmNlQW5kQ2hhbmdlUm9vdChjaGlsZCwgcm9vdE5vZGUsIHJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmUgbWVtYmVyIGFjY2Vzc1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cobm9kZSk7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJbmZvID0gcm9vdE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKHJvb3RQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICBwcmVmYWJJbmZvLnJvb3QgPSByb290Tm9kZTtcbiAgICAgICAgICAgIHByZWZhYkluZm8uYXNzZXQgPSByb290UHJlZmFiSW5mby5hc3NldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmVmYWJJbmZvLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6Kej6Zmk5bWM5aWX55qEIFByZWZhYiDlrp7kvoss5YaF6YOo6IqC54K56YCA5YyW5Li65b2T5YmNIFByZWZhYiDotYTmupDph4znmoToioLngrlcbiAgICAgICAgLy8g6ZyA6KaB5bCG5a6D5Lus55qEIFByZWZhYkluZm8g5Lit55qEIEZpbGVJZCDph43mlrDorr7nva7vvIzlkKbliJnnlLHlkIzkuIDkuKrotYTmupBcbiAgICAgICAgLy8g5a6e5L6L5YyW5Ye65p2l55qE5aSa5LiqIFByZWZhYiDlrp7kvovvvIzop6PpmaTlkI7lroPku6znmoQgRmlsZUlkIOS8muWGsueqgVxuICAgICAgICBwcmVmYWJJbmZvLmZpbGVJZCA9IG5vZGUudXVpZDtcbiAgICAgICAgbm9kZS5jb21wb25lbnRzLmZvckVhY2goKGNvbXApID0+IHtcbiAgICAgICAgICAgIGlmIChjb21wLl9fcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgY29tcC5fX3ByZWZhYi5maWxlSWQgPSBjb21wLnV1aWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2cobm9kZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Kej6ZmkIFByZWZhYkluc3RhbmNlIOWvuSBQcmVmYWJBc3NldCDnmoTlhbPogZRcbiAgICAgKiBAcGFyYW0gbm9kZVVVSUQg6IqC54K55oiW6IqC54K555qEIFVVSURcbiAgICAgKiBAcGFyYW0gcmVtb3ZlTmVzdGVkIOaYr+WQpumAkuW9kueahOino+mZpOWtkOiKgueCuSBQcmVmYWJJbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB1bldyYXBQcmVmYWJJbnN0YW5jZShub2RlVVVJRDogc3RyaW5nIHwgTm9kZSwgcmVtb3ZlTmVzdGVkPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgbm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIG5vZGVVVUlEID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVNZ3IuZ2V0Tm9kZShub2RlVVVJRCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZVVVSUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmraPluLjmg4XlhrXkuIvlj6rog73lnKggUHJlZmFiSW5zdGFuY2Ug5LiK5L2/55SoIHVuV3JhcFxuICAgICAgICAvLyDlpoLmnpzotYTmupDkuKLlpLHvvIzkuZ/lj6/ku6Xop6PpmaTlhbPns7tcbiAgICAgICAgaWYgKHByZWZhYkluZm8uaW5zdGFuY2UgfHwgIXByZWZhYkluZm8uYXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZVByZWZhYkluZm9Gcm9tSW5zdGFuY2VOb2RlKG5vZGUsIHJlbW92ZU5lc3RlZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIOWcqCBQcmVmYWIg57yW6L6R5qih5byP5LiL5LiN6IO956e76ZmkIHByZWZhYkluZm/vvIzlj6rpnIDopoHnp7vpmaQgaW5zdGFuY2VcbiAgICBwdWJsaWMgdW5XcmFwUHJlZmFiSW5zdGFuY2VJblByZWZhYk1vZGUobm9kZVVVSUQ6IHN0cmluZyB8IE5vZGUsIHJlbW92ZU5lc3RlZD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICAgICAgbGV0IG5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBub2RlVVVJRCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlTWdyLmdldE5vZGUobm9kZVVVSUQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVVVUlEO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJvb3ROb2RlOiBOb2RlIHwgdW5kZWZpbmVkID0gbm9kZTtcblxuICAgICAgICBjb25zdCBtb3VudGVkUm9vdCA9IHByZWZhYlV0aWxzLmdldE1vdW50ZWRSb290KG5vZGUpO1xuICAgICAgICBpZiAobW91bnRlZFJvb3QpIHtcbiAgICAgICAgICAgIC8vIG1vdW50ZWQg55qEIHByZWZhYiDoioLngrnpnIDopoHmioogcm9vdCDorr7nva7kuLrlvZPliY0gcHJlZmFiIOeahOagueiKgueCuVxuICAgICAgICAgICAgcm9vdE5vZGUgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpIGFzIE5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHByaXZhdGUgbWVtYmVyIGFjY2Vzc1xuICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50WydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIHByaXZhdGUgbWVtYmVyIGFjY2Vzc1xuICAgICAgICAgICAgICAgIHJvb3ROb2RlID0gbm9kZS5wYXJlbnRbJ19wcmVmYWInXS5yb290O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyb290Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCByb290UHJlZmFiSW5mbyA9IHJvb3ROb2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcm9vdFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOato+W4uOaDheWGteS4i+WPquiDveWcqCBQcmVmYWJJbnN0YW5jZSDkuIrkvb/nlKggdW5XcmFwXG4gICAgICAgIC8vIOWmguaenOi1hOa6kOS4ouWkse+8jOS5n+WPr+S7peino+mZpOWFs+ezu1xuICAgICAgICBpZiAocHJlZmFiSW5mby5pbnN0YW5jZSB8fCAhcHJlZmFiSW5mby5hc3NldCkge1xuICAgICAgICAgICAgLy8gdGhpcy5yZW1vdmVQcmVmYWJJbnN0YW5jZUFuZENoYW5nZVJvb3Qobm9kZSwgcm9vdE5vZGUsIHJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZVByZWZhYkluZm9Gcm9tSW5zdGFuY2VOb2RlKG5vZGUsIHJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICBwcmVmYWJVdGlscy5hZGRQcmVmYWJJbmZvKG5vZGUsIHJvb3ROb2RlLCByb290UHJlZmFiSW5mby5hc3NldCk7XG5cbiAgICAgICAgICAgIC8vIOino+WGs+WtkOiKgueCueS4reeahCBQcmVmYWJJbnN0YW5jZSDnmoQgRmlsZUlkIOWGsueqgVxuICAgICAgICAgICAgLy8g5a2Q6IqC54K55Lit55qEIFByZWZhYkluc3RhbmNlIOeahCBGaWxlSWQg5Y+v6IO95ZKM5b2T5YmN5Zy65pmv55qE5YW25a6D6Kej6ZmkIFByZWZhYkluc3RhbmNlIOeahOWtkOiKgueCueS4rVxuICAgICAgICAgICAgLy8g55qEIFByZWZhYkluc3RhbmNlIOeahCBGaWxlSWQg5Yay56qB77yM5omA5Lul6ZyA6KaB6YeN5paw55Sf5oiQ5LiA5LiqXG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZVJvb3RzOiBOb2RlW10gPSBbXTtcbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpbmRPdXRtb3N0UHJlZmFiSW5zdGFuY2VOb2Rlcyhub2RlLCBpbnN0YW5jZVJvb3RzKTtcbiAgICAgICAgICAgIGluc3RhbmNlUm9vdHMuZm9yRWFjaCgoaW5zdGFuY2VSb290KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdFByZWZhYkluc3RhbmNlID0gaW5zdGFuY2VSb290Py5bJ19wcmVmYWInXT8uaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgaWYgKHJvb3RQcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByb290UHJlZmFiSW5zdGFuY2UuZmlsZUlkID0gcHJlZmFiVXRpbHMuZ2VuZXJhdGVVVUlEKCk7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2coaW5zdGFuY2VSb290KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmNvbnN0IG5vZGVPcGVyYXRpb24gPSBuZXcgTm9kZU9wZXJhdGlvbigpO1xuXG5leHBvcnQgeyBub2RlT3BlcmF0aW9uLCBJTm9kZVByZWZhYkRhdGEsIElBcHBseVByZWZhYkluZm8gfTtcbiJdfQ==