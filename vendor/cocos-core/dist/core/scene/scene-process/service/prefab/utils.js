'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefabUtils = void 0;
const cc_1 = require("cc");
const node_utils_1 = require("../node/node-utils");
const core_1 = require("../core");
const common_1 = require("../../../common");
const PrefabInfo = cc_1.Prefab._utils.PrefabInfo;
const CompPrefabInfo = cc_1.Prefab._utils.CompPrefabInfo;
const PrefabInstance = cc_1.Prefab._utils.PrefabInstance;
const TargetInfo = cc_1.Prefab._utils.TargetInfo;
const PropertyOverrideInfo = cc_1.Prefab._utils.PropertyOverrideInfo;
const MountedChildrenInfo = cc_1.Prefab._utils.MountedChildrenInfo;
const TargetOverrideInfo = cc_1.Prefab._utils.TargetOverrideInfo;
const MountedComponentsInfo = cc_1.Prefab._utils.MountedComponentsInfo;
const compKey = '_components';
const DELIMETER = cc_1.CCClass.Attr.DELIMETER;
function compareStringArray(array1, array2) {
    if (!array1 || !array2) {
        return false;
    }
    if (array1.length !== array2.length) {
        return false;
    }
    return array1.every((value, index) => value === array2[index]);
}
function isInClassChain(srcCtor, dstCtor) {
    if (srcCtor && dstCtor) {
        const chian = cc_1.CCClass.getInheritanceChain(srcCtor);
        chian.push(srcCtor);
        return chian.includes(dstCtor);
    }
    return false;
}
function isSameNode(src, dst) {
    return src.getPathInHierarchy() === dst.getPathInHierarchy() && src.getSiblingIndex() === dst.getSiblingIndex();
}
function pushNestedPrefab(nestedPrefabNode, root, paths) {
    let parent = nestedPrefabNode.parent;
    while (parent && parent !== root) {
        if (parent['_prefab']?.instance) {
            paths.unshift(parent['_prefab']?.instance.fileId);
        }
        parent = parent.parent;
    }
}
class PrefabUtil {
    static PrefabState = common_1.PrefabState;
    assetTargetMapCache = new Map();
    prefabAssetNodeInstanceMap = new Map(); // 用于PrefabAsset根节点实例化数据缓存，用于diff对比
    getPrefab(node) {
        return node['_prefab'];
    }
    // 发送节点修改前消息
    fireBeforeChangeMsg(node) {
        core_1.ServiceEvents.emit('node:before-change', node);
    }
    // 发送节点修改消息
    fireChangeMsg(node, opts = {}) {
        opts.type = common_1.NodeEventType.PREFAB_INFO_CHANGED;
        core_1.ServiceEvents.emit('node:change', node, opts);
    }
    getPrefabAssetNodeInstance(prefabInfo) {
        if (this.prefabAssetNodeInstanceMap.has(prefabInfo)) {
            return this.prefabAssetNodeInstanceMap.get(prefabInfo);
        }
        let assetRootNode = undefined;
        if (prefabInfo && prefabInfo.asset && (0, cc_1.isValid)(prefabInfo.asset)) {
            assetRootNode = (0, cc_1.instantiate)(prefabInfo.asset);
        }
        if (assetRootNode) {
            // @ts-ignore
            const rootPrefabInfo = assetRootNode['_prefab'];
            if (rootPrefabInfo) {
                rootPrefabInfo.instance = prefabInfo.instance;
            }
            this.prefabAssetNodeInstanceMap.set(prefabInfo, assetRootNode);
        }
        return assetRootNode;
    }
    clearCache() {
        this.assetTargetMapCache.clear();
        this.prefabAssetNodeInstanceMap.clear();
    }
    removePrefabAssetNodeInstanceCache(prefabInfo) {
        if (this.prefabAssetNodeInstanceMap.has(prefabInfo)) {
            this.prefabAssetNodeInstanceMap.delete(prefabInfo);
        }
    }
    /**
     * 在编辑器中,node._prefab.instance.targetMap存在丢失的情况,比如新建预制体时
     * 所以编辑器中请不要通过引擎字段访问targetMap，从而去获取target
     * 请使用prefabUtil提供的方法来访问
     */
    getTargetMap(node, useCache = false) {
        if (useCache && this.assetTargetMapCache.has(node)) {
            return this.assetTargetMapCache.get(node);
        }
        const assetTargetMap = {};
        this.generateTargetMap(node, assetTargetMap, true);
        this.assetTargetMapCache.set(node, assetTargetMap);
        return assetTargetMap;
    }
    // 通过localID获取节点node上的节点
    getTarget(localID, node, useCache = false) {
        const targetMap = this.getTargetMap(node, useCache);
        return cc_1.Prefab._utils.getTarget(localID, targetMap);
    }
    // 与Prefab._utils.generateTargetMap不同的是，这个需要将mounted children都考虑进来
    generateTargetMap(node, targetMap, isRoot) {
        if (!node) {
            return;
        }
        let curTargetMap = targetMap;
        const prefabInstance = node['_prefab']?.instance;
        if (!isRoot && prefabInstance) {
            targetMap[prefabInstance.fileId] = {};
            curTargetMap = targetMap[prefabInstance.fileId];
        }
        const prefabInfo = node['_prefab'];
        if (prefabInfo) {
            curTargetMap[prefabInfo.fileId] = node;
        }
        const components = node.components;
        for (let i = 0; i < components.length; i++) {
            const comp = components[i];
            if (comp.__prefab) {
                curTargetMap[comp.__prefab.fileId] = comp;
            }
        }
        for (let i = 0; i < node.children.length; i++) {
            const childNode = node.children[i];
            this.generateTargetMap(childNode, curTargetMap, false);
        }
        if (prefabInstance && prefabInstance.mountedChildren.length > 0) {
            for (let i = 0; i < prefabInstance.mountedChildren.length; i++) {
                const childInfo = prefabInstance.mountedChildren[i];
                if (childInfo && childInfo.targetInfo) {
                    let mountedTargetMap = curTargetMap;
                    const localID = childInfo.targetInfo.localID;
                    if (localID.length > 0) {
                        for (let i = 0; i < localID.length - 1; i++) {
                            mountedTargetMap = mountedTargetMap[localID[i]];
                        }
                    }
                    // 如果目标节点是嵌套预制体时，可能出现挂载的节点已经不再是预制体实例的情况 #17493
                    if (childInfo.nodes && mountedTargetMap) {
                        for (let i = 0; i < childInfo.nodes.length; i++) {
                            const childNode = childInfo.nodes[i];
                            if (!childNode) {
                                continue;
                            }
                            // mounted node need to add to the target map
                            this.generateTargetMap(childNode, mountedTargetMap, false);
                        }
                    }
                }
            }
        }
    }
    getPropertyOverrideLocationInfo(node, pathKeys) {
        // 向上查找PrefabInstance路径
        const outMostPrefabInstanceInfo = this.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return null;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        let target = node;
        if (outMostPrefabInstance) {
            targetPath.splice(0, 1); // 不需要存最外层的PrefabInstance的fileID，方便override可以在PrefabInstance复制后复用
            let relativePathKeys = []; // 相对于目标（node\component)的属性查找路径
            if (pathKeys.length <= 0) {
                return null;
            }
            if (pathKeys[0] === compKey) {
                if (pathKeys.length === 2) {
                    // modify component
                    return null;
                }
                if (pathKeys.length === 1) {
                    // TODO，改变components数组
                    return null;
                }
                // component
                const comp = node[pathKeys[0]][pathKeys[1]];
                if (comp.__prefab) {
                    targetPath.push(comp.__prefab.fileId);
                    relativePathKeys = pathKeys.slice(2);
                    target = comp;
                }
                else {
                    // console.error(`component: ${comp.name} doesn't have a prefabInfo`);
                    // mounted component doesn't have a prefabInfo
                    return null;
                }
            }
            else {
                // node
                // @ts-ignore
                const prefabInfo = node['_prefab'];
                if (prefabInfo) {
                    targetPath.push(prefabInfo.fileId);
                    relativePathKeys = pathKeys;
                }
                else {
                    console.error(`node: ${node.name} doesn't have a prefabInfo`);
                }
            }
            return { outMostPrefabInstanceNode, targetPath, relativePathKeys, target };
        }
        return null;
    }
    getPrefabForSerialize(node, quiet = undefined) {
        // deep clone, since we don't want the given node changed by codes below
        const cloneNode = (0, cc_1.instantiate)(node);
        // 在修改节点prefabInfo时先去掉mountedChild的挂载信息
        this.removeMountedRootInfo(cloneNode);
        const prefab = new cc.Prefab();
        const prefabInfo = this.createPrefabInfo(node.uuid);
        prefabInfo.asset = prefab;
        prefabInfo.root = cloneNode;
        // 复制预制体信息
        const oriPrefabInfo = this.getPrefab(cloneNode);
        if (oriPrefabInfo) {
            prefab.optimizationPolicy = oriPrefabInfo.asset?.optimizationPolicy;
            prefab.persistent = oriPrefabInfo.asset?.persistent;
            prefabInfo.targetOverrides = oriPrefabInfo.targetOverrides;
            prefabInfo.fileId = oriPrefabInfo.fileId;
        }
        // @ts-ignore
        cloneNode['_prefab'] = prefabInfo;
        const nestedInstNodes = [];
        // 给子节点设置prefabInfo-asset,处理nestedPrefabInstanceRoots和prefabRootNode
        this.walkNode(cloneNode, (child, isChild) => {
            // 私有节点不需要添加 prefabInfo 数据
            if (child.objFlags & cc.Object.Flags.HideInHierarchy) {
                return;
            }
            const childPrefab = this.getPrefab(child);
            if (childPrefab) {
                if (childPrefab.instance) {
                    // 处理嵌套预制体信息
                    const { outMostPrefabInstanceNode } = this.getOutMostPrefabInstanceInfo(child);
                    if (outMostPrefabInstanceNode === child) {
                        childPrefab.nestedPrefabInstanceRoots = undefined;
                        childPrefab.instance.prefabRootNode = cloneNode;
                        nestedInstNodes.push(child);
                    }
                }
                else {
                    if (child['_prefab']) {
                        child['_prefab'].root = prefabInfo.root;
                        child['_prefab'].asset = prefabInfo.asset;
                    }
                }
            }
            else {
                const newPrefab = new PrefabInfo();
                newPrefab.root = prefabInfo.root;
                newPrefab.asset = prefabInfo.asset;
                newPrefab.fileId = child.uuid;
                child['_prefab'] = newPrefab;
            }
            // 组件也添加 __prefab fileId 属性，以便复用
            if (child.components && child.components.length) {
                for (let i = 0; i < child.components.length; i++) {
                    const comp = child.components[i];
                    if (!comp.__prefab) {
                        comp.__prefab = new CompPrefabInfo();
                        comp.__prefab.fileId = comp.uuid;
                    }
                }
            }
        });
        prefabInfo.nestedPrefabInstanceRoots = nestedInstNodes.length > 0 ? nestedInstNodes : undefined;
        // 清理外部节点的引用,这里会清掉component的ID,必须在上述步骤执行完后才可以清(__prefab.fileId)
        const clearedReference = EditorExtends.PrefabUtils.checkAndStripNode(cloneNode, quiet);
        this.removeInvalidPrefabData(cloneNode);
        this.setMountedRoot(cloneNode, undefined);
        prefab.data = cloneNode;
        return {
            prefab: prefab,
            clearedReference: clearedReference,
        };
    }
    addPrefabInfo(node, rootNode, prefab) {
        return EditorExtends.PrefabUtils.addPrefabInfo(node, rootNode, prefab);
    }
    walkNode(node, handle, isChild = false) {
        EditorExtends.PrefabUtils.walkNode(node, handle, isChild);
    }
    addPrefabInfoToComponent(comp) {
        if (!comp.__prefab) {
            comp.__prefab = new CompPrefabInfo();
        }
        if (!comp.__prefab) {
            return;
        }
        comp.__prefab.fileId = comp.__prefab.fileId ? comp.__prefab.fileId : comp.uuid;
    }
    /**
     * 克隆一个节点，转为预制体，返回预制体序列化数据
     * 注意这个不会影响现有节点数据，但生成的预制体，会有部分外部引用数据被清理
     * @param {*} nodeUUID
     */
    generatePrefabDataFromNode(nodeUUID) {
        let node = null;
        if (typeof nodeUUID === 'string') {
            node = EditorExtends.Node.getNode(nodeUUID);
        }
        else {
            node = nodeUUID;
        }
        if (!node) {
            return null;
        }
        const { prefab, clearedReference } = this.getPrefabForSerialize(node);
        if (!prefab) {
            return null;
        }
        // 先去掉prefabInstance，等支持了Variant再实现不剔除的情况
        prefab.data['_prefab'].instance = undefined;
        // 拖拽生成prefab时要清理instance中对外部节点的引用，否则会把场景保存到prefab中
        this.removeInvalidPropertyOverrideReference(prefab.data);
        const data = EditorExtends.serialize(prefab);
        // 恢复clearedReference
        return {
            prefabData: data,
            clearedReference: clearedReference,
        };
        // return data as string;
    }
    removeMountedRootInfo(node) {
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return;
        }
        if (!prefabInfo.instance) {
            return;
        }
        const mountedChildren = prefabInfo.instance.mountedChildren;
        mountedChildren.forEach((mountedChildInfo) => {
            mountedChildInfo.nodes.forEach((node) => {
                this.setMountedRoot(node, undefined);
            });
        });
        const mountedComponents = prefabInfo.instance.mountedComponents;
        mountedComponents.forEach((mountedCompInfo) => {
            mountedCompInfo.components.forEach((comp) => {
                this.setMountedRoot(comp, undefined);
            });
        });
    }
    generateUUID() {
        return EditorExtends.UuidUtils.generate(true);
    }
    createPrefabInstance() {
        const prefabInstance = new PrefabInstance();
        prefabInstance.fileId = this.generateUUID();
        return prefabInstance;
    }
    createPrefabInfo(fileId) {
        const prefabInfo = new PrefabInfo();
        prefabInfo.fileId = fileId;
        return prefabInfo;
    }
    cloneInstanceWithNewFileId(instance) {
        const newInstance = this.createPrefabInstance();
        // 复制propertyOverrides
        const cloneSourcePropOverrides = instance.propertyOverrides;
        newInstance.propertyOverrides = [];
        for (let i = 0; i < cloneSourcePropOverrides.length; i++) {
            const cloneSourcePropOverride = cloneSourcePropOverrides[i];
            const propOverride = new PropertyOverrideInfo();
            propOverride.targetInfo = cloneSourcePropOverride.targetInfo;
            propOverride.propertyPath = cloneSourcePropOverride.propertyPath;
            propOverride.value = cloneSourcePropOverride.value;
            newInstance.propertyOverrides.push(propOverride);
        }
        // 复制mountedChildren
        const cloneMountedChildren = instance.mountedChildren;
        newInstance.mountedChildren = [];
        for (let i = 0; i < cloneMountedChildren.length; i++) {
            const cloneSourceMountedChild = cloneMountedChildren[i];
            const mountedChild = new MountedChildrenInfo();
            mountedChild.targetInfo = cloneSourceMountedChild.targetInfo;
            mountedChild.nodes = cloneSourceMountedChild.nodes.slice();
            newInstance.mountedChildren.push(mountedChild);
        }
        // 复制mountedComponents
        const cloneMountedComponents = instance.mountedComponents;
        newInstance.mountedComponents = [];
        for (let i = 0; i < cloneMountedComponents.length; i++) {
            const cloneSourceMountedComp = cloneMountedComponents[i];
            const mountedComp = new MountedComponentsInfo();
            mountedComp.targetInfo = cloneSourceMountedComp.targetInfo;
            mountedComp.components = cloneSourceMountedComp.components.slice();
            newInstance.mountedComponents.push(mountedComp);
        }
        // 复制removedComponents
        newInstance.removedComponents = instance.removedComponents.slice();
        return newInstance;
    }
    getPrefabInstanceRoot(node) {
        let parent = node;
        let root = null;
        while (parent) {
            // @ts-ignore member access
            if (parent['_prefab']?.instance) {
                root = parent;
                break;
            }
            parent = parent.parent;
        }
        return root;
    }
    isSameSourceTargetOverride(targetOverride, source, sourceLocalID, propPath) {
        if (targetOverride.source === source &&
            ((!sourceLocalID && !targetOverride.sourceInfo) ||
                compareStringArray(sourceLocalID, targetOverride.sourceInfo?.localID)) &&
            compareStringArray(targetOverride.propertyPath, propPath)) {
            return true;
        }
        return false;
    }
    getSourceData(source) {
        // 如果source是一个普通节点下的Component，那直接指向它就可以
        // 如果source是一个mountedComponent，直接指向它就可以
        // 如果source是一个Prefab节点下的非mounted的Component，那就需要通过[根节点+LocalID]的方式来索引。
        let sourceTarget = source;
        let sourceLocalID;
        const sourceNode = source.node;
        if (!sourceNode) {
            return null;
        }
        // @ts-ignore
        if (sourceNode['_prefab'] && !this.isMountedComponent(source)) {
            // 向上查找PrefabInstance路径
            const outMostPrefabInstanceInfo = this.getOutMostPrefabInstanceInfo(sourceNode);
            const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
            if (outMostPrefabInstanceNode) {
                sourceTarget = outMostPrefabInstanceNode;
                sourceLocalID = outMostPrefabInstanceInfo.targetPath;
                sourceLocalID.splice(0, 1); // 不需要存最外层的PrefabInstance的fileID
                if (source.__prefab?.fileId) {
                    sourceLocalID.push(source.__prefab?.fileId);
                }
                else {
                    console.error(`can't get fileId of component: ${source.name} in node: ${source.node.name}`);
                }
            }
        }
        return { sourceTarget, sourceLocalID };
    }
    removeTargetOverrideBySource(prefabInfo, source) {
        if (!prefabInfo) {
            return false;
        }
        if (!prefabInfo.targetOverrides) {
            return false;
        }
        let isAnyRemoved = false;
        for (let i = prefabInfo.targetOverrides.length - 1; i >= 0; i--) {
            const targetOverrideItr = prefabInfo.targetOverrides[i];
            if (targetOverrideItr.source === source) {
                prefabInfo.targetOverrides.splice(i, 1);
                isAnyRemoved = true;
            }
        }
        return isAnyRemoved;
    }
    removeTargetOverride(prefabInfo, source, propPath) {
        if (!prefabInfo) {
            return false;
        }
        if (!prefabInfo.targetOverrides) {
            return false;
        }
        const sourceData = this.getSourceData(source);
        if (!sourceData) {
            return false;
        }
        const sourceTarget = sourceData.sourceTarget;
        const sourceLocalID = sourceData.sourceLocalID;
        let result = false;
        for (let i = prefabInfo.targetOverrides.length - 1; i >= 0; i--) {
            const targetOverrideItr = prefabInfo.targetOverrides[i];
            if (this.isSameSourceTargetOverride(targetOverrideItr, sourceTarget, sourceLocalID, propPath)) {
                prefabInfo.targetOverrides.splice(i, 1);
                result = true;
            }
        }
        return result;
    }
    isInTargetOverrides(targetOverrides, source, propPath) {
        const sourceData = this.getSourceData(source);
        if (!sourceData) {
            return false;
        }
        const sourceTarget = sourceData.sourceTarget;
        const sourceLocalID = sourceData.sourceLocalID;
        for (let i = 0; i < targetOverrides.length; i++) {
            const targetOverrideItr = targetOverrides[i];
            if (this.isSameSourceTargetOverride(targetOverrideItr, sourceTarget, sourceLocalID, propPath)) {
                return true;
            }
        }
        return false;
    }
    getTargetOverride(prefabInfo, source, propPath) {
        let targetOverride = null;
        if (!prefabInfo.targetOverrides) {
            prefabInfo.targetOverrides = [];
        }
        const sourceData = this.getSourceData(source);
        if (!sourceData) {
            return null;
        }
        const sourceTarget = sourceData.sourceTarget;
        const sourceLocalID = sourceData.sourceLocalID;
        for (let i = 0; i < prefabInfo.targetOverrides.length; i++) {
            const targetOverrideItr = prefabInfo.targetOverrides[i];
            if (this.isSameSourceTargetOverride(targetOverrideItr, sourceTarget, sourceLocalID, propPath)) {
                targetOverride = targetOverrideItr;
                break;
            }
        }
        if (!targetOverride) {
            targetOverride = new TargetOverrideInfo();
            targetOverride.source = sourceTarget;
            if (sourceLocalID) {
                targetOverride.sourceInfo = new TargetInfo();
                targetOverride.sourceInfo.localID = sourceLocalID;
            }
            targetOverride.propertyPath = propPath;
            prefabInfo.targetOverrides.push(targetOverride);
        }
        return targetOverride;
    }
    getPropertyOverridesOfTarget(prefabInstance, localID) {
        const propOverrides = [];
        for (let i = 0; i < prefabInstance.propertyOverrides.length; i++) {
            const propOverrideItr = prefabInstance.propertyOverrides[i];
            if (compareStringArray(propOverrideItr.targetInfo?.localID, localID)) {
                propOverrides.push(propOverrideItr);
            }
        }
        return propOverrides;
    }
    isInPropertyOverrides(propPath, propertyOverrides) {
        for (let i = 0; i < propertyOverrides.length; i++) {
            const propOverrideItr = propertyOverrides[i];
            if (compareStringArray(propOverrideItr.propertyPath, propPath)) {
                return true;
            }
        }
        return false;
    }
    getPropertyOverride(prefabInstance, localID, propPath) {
        let propOverride = null;
        let targetInfo = null;
        for (let i = 0; i < prefabInstance.propertyOverrides.length; i++) {
            const propOverrideItr = prefabInstance.propertyOverrides[i];
            if (compareStringArray(propOverrideItr.targetInfo?.localID, localID)) {
                // 复用已有的targetInfo，减少数据冗余
                targetInfo = propOverrideItr.targetInfo;
                if (compareStringArray(propOverrideItr.propertyPath, propPath)) {
                    propOverride = propOverrideItr;
                    break;
                }
            }
        }
        if (!propOverride) {
            propOverride = new PropertyOverrideInfo();
            if (!targetInfo) {
                targetInfo = new TargetInfo();
                targetInfo.localID = localID;
            }
            propOverride.targetInfo = targetInfo;
            propOverride.propertyPath = propPath;
            prefabInstance.propertyOverrides.push(propOverride);
        }
        return propOverride;
    }
    removePropertyOverride(prefabInstance, localID, propPath) {
        for (let i = prefabInstance.propertyOverrides.length - 1; i >= 0; i--) {
            const propOverrideItr = prefabInstance.propertyOverrides[i];
            if (compareStringArray(propOverrideItr.targetInfo?.localID, localID) &&
                compareStringArray(propOverrideItr.propertyPath, propPath)) {
                prefabInstance.propertyOverrides.splice(i, 1);
            }
        }
    }
    findPrefabInstanceMountedChildren(prefabInstance, localID) {
        let mountedChild = null;
        const mountedChildren = prefabInstance.mountedChildren;
        for (let i = 0; i < mountedChildren.length; i++) {
            const childInfo = mountedChildren[i];
            if (childInfo.isTarget(localID)) {
                mountedChild = childInfo;
                break;
            }
        }
        return mountedChild;
    }
    createMountedChildrenInfo(localID) {
        const targetInfo = new TargetInfo();
        targetInfo.localID = localID;
        const mountedChildInfo = new MountedChildrenInfo();
        mountedChildInfo.targetInfo = targetInfo;
        return mountedChildInfo;
    }
    getPrefabInstanceMountedChildren(prefabInstance, localID) {
        let mountedChild = this.findPrefabInstanceMountedChildren(prefabInstance, localID);
        if (!mountedChild) {
            mountedChild = this.createMountedChildrenInfo(localID);
            prefabInstance.mountedChildren.push(mountedChild);
        }
        return mountedChild;
    }
    getPrefabInstanceMountedComponents(prefabInstance, localID) {
        let mountedComponentsInfo = null;
        const mountedComponents = prefabInstance.mountedComponents;
        for (let i = 0; i < mountedComponents.length; i++) {
            const componentsInfo = mountedComponents[i];
            if (componentsInfo.isTarget(localID)) {
                mountedComponentsInfo = componentsInfo;
                break;
            }
        }
        if (!mountedComponentsInfo) {
            const targetInfo = new TargetInfo();
            targetInfo.localID = localID;
            mountedComponentsInfo = new MountedComponentsInfo();
            mountedComponentsInfo.targetInfo = targetInfo;
            prefabInstance.mountedComponents.push(mountedComponentsInfo);
        }
        return mountedComponentsInfo;
    }
    addRemovedComponent(prefabInstance, localID) {
        const removedComponents = prefabInstance.removedComponents;
        for (let i = 0; i < removedComponents.length; i++) {
            const targetInfo = removedComponents[i];
            if (compareStringArray(targetInfo.localID, localID)) {
                return;
            }
        }
        const targetInfo = new TargetInfo();
        targetInfo.localID = localID;
        removedComponents.push(targetInfo);
    }
    deleteRemovedComponent(prefabInstance, localID) {
        const removedComponents = prefabInstance.removedComponents;
        for (let i = 0; i < removedComponents.length; i++) {
            const targetInfo = removedComponents[i];
            if (compareStringArray(targetInfo.localID, localID)) {
                removedComponents.splice(i, 1);
                break;
            }
        }
    }
    /**
     * whether the node is child of a prefab
     * @param node node
     */
    isChildOfPrefabInstance(node) {
        let parent = node.parent;
        let hasPrefabRootInParent = false;
        while (parent) {
            // @ts-ignore: private member access
            if (parent['_prefab']?.instance) {
                hasPrefabRootInParent = true;
                break;
            }
            parent = parent.parent;
        }
        return hasPrefabRootInParent;
    }
    isPrefabInstanceRoot(node) {
        // @ts-ignore: private member access
        const prefabInfo = node['_prefab'];
        if (!prefabInfo || !prefabInfo.instance) {
            return false;
        }
        // @ts-ignore: private member access
        if (!prefabInfo.instance.prefabRootNode || !prefabInfo.instance.prefabRootNode['_prefab']?.instance) {
            return true;
        }
        return false;
    }
    isChildOfPrefabAsset(node) {
        // @ts-ignore: private member access
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return false;
        }
        const parent = node.parent;
        if (!parent) {
            return false;
        }
        // @ts-ignore: private member access
        const parentPrefabInfo = parent['_prefab'];
        if (!parentPrefabInfo) {
            return false;
        }
        if (prefabInfo.root === parentPrefabInfo.root) {
            return true;
        }
        // 用于嵌套的prefab判断
        if (prefabInfo.instance?.prefabRootNode === parentPrefabInfo.root) {
            return true;
        }
        return false;
    }
    isPartOfPrefabAsset(node) {
        // @ts-ignore: private member access
        const prefabInfo = node['_prefab'];
        const outMostPrefabInfo = this.getOutMostPrefabInstanceInfo(node);
        if (prefabInfo && outMostPrefabInfo.outMostPrefabInstanceNode) {
            if (this.isMountedChildOf(outMostPrefabInfo.outMostPrefabInstanceNode, node)) {
                return false;
            }
            return true;
        }
        return false;
    }
    /**
     * whether the node is part of a prefab,
     * root of prefab is also part of prefab
     * @param node node
     */
    isPartOfPrefabInstance(node) {
        let parent = node;
        let hasPrefabRootInParent = false;
        while (parent) {
            // @ts-ignore: private member access
            if (parent['_prefab']?.instance) {
                hasPrefabRootInParent = true;
                break;
            }
            parent = parent.parent;
        }
        return hasPrefabRootInParent;
    }
    isPartOfAssetInPrefabInstance(node) {
        const isPartOfInstance = this.isPartOfPrefabInstance(node);
        if (!isPartOfInstance) {
            return false;
        }
        const isPartOfAsset = this.isPartOfPrefabAsset(node);
        return isPartOfAsset;
    }
    /**
     * 需要考虑很多种嵌套情况,需要注意mountedChild上又挂其它prefab的问题
     * 1. prefabA->node...
     * 2. prefabA->moutedNode->prefabB->node
     * 3. prefabA->moutedPrefabB->node
     * 4. prefabA->moutedPrefabB->prefabC->node
     * 5. prefabA->prefabB->node
     * @param node
     * @returns
     */
    getOutMostPrefabInstanceInfo(node) {
        const targetPath = [];
        let outMostPrefabInstanceNode = null;
        let nodeIter = node;
        while (nodeIter) {
            const prefabInstance = nodeIter['_prefab']?.instance;
            // 向上查找到第一个预制体实例节点，判断改实例是否有prefabRootNode(嵌套预制体)
            // 当预制体实例不存在prefabRootNode时,或者prefabRootNode指向了当前根节点时，说明找到了最外层预制体实例
            if (prefabInstance) {
                targetPath.unshift(prefabInstance.fileId);
                outMostPrefabInstanceNode = nodeIter;
                // 非嵌套预制体，直接返回
                if (!prefabInstance.prefabRootNode) {
                    break;
                }
                const prefabRoot = prefabInstance.prefabRootNode;
                const rootNode = core_1.Service.Editor.getRootNode();
                if (prefabRoot && rootNode && isSameNode(prefabRoot, rootNode)) {
                    break;
                }
                else {
                    // 是嵌套预制体，直接从prefabRootNode开始继续查找
                    // 需要把节点树中的prefabInstance的fileId加入到targetPath中，因为getTargetMap的生成是按照节点树生成的
                    pushNestedPrefab(nodeIter, prefabInstance.prefabRootNode, targetPath);
                    // 避免死循环
                    if (nodeIter !== prefabInstance.prefabRootNode) {
                        nodeIter = prefabInstance.prefabRootNode;
                    }
                    else {
                        console.warn('getOutMostPrefabInstanceInfo failed: prefab instance root node has loop');
                        break;
                    }
                    continue;
                }
            }
            nodeIter = nodeIter.parent;
        }
        return { outMostPrefabInstanceNode, targetPath };
    }
    isSceneNode(node) {
        if (node instanceof cc_1.Scene) {
            return true;
        }
        return false;
    }
    /**
     * 是否是嵌套的预制体
     * @param node
     * @private
     */
    isNestedPrefab(node) {
        const prefab = node['_prefab'];
        const assetUuid = prefab?.asset?.uuid;
        if (!prefab || !assetUuid)
            return false;
        let parent = node.parent;
        while (parent) {
            // 向上遍历到场景
            if (parent === parent.scene) {
                break;
            }
            const parentPrefabInfo = parent['_prefab'];
            if (parentPrefabInfo && assetUuid !== parentPrefabInfo.asset?.uuid) {
                // 如果检查的节点是预制体根节点就直接 true
                if (prefab.instance) {
                    return true;
                }
                const isNested = this.isNestedPrefab(parent);
                if (!isNested) {
                    return true;
                }
            }
            parent = parent.parent;
        }
        return false;
    }
    getPrefabStateInfo(node) {
        let prefabState = common_1.PrefabState.NotAPrefab;
        let isUnwrappable = false;
        let isRevertable = false;
        let isApplicable = false;
        let isAddedChild = false;
        let isNested = false;
        let assetUuid = '';
        if (this.isSceneNode(node)) {
            return { state: prefabState, isUnwrappable, isRevertable, isApplicable, isAddedChild, isNested, assetUuid };
        }
        // @ts-ignore
        if (node['_prefab']) {
            // @ts-ignore
            if (node['_prefab'].asset) {
                // @ts-ignore
                assetUuid = node['_prefab'].asset._uuid;
            }
            // @ts-ignore
            const prefabInstance = node['_prefab'].instance;
            if (prefabInstance) {
                isUnwrappable = true;
                isRevertable = true;
                isApplicable = true;
                prefabState = common_1.PrefabState.PrefabInstance;
                const { outMostPrefabInstanceNode } = this.getOutMostPrefabInstanceInfo(node);
                if (outMostPrefabInstanceNode !== node) {
                    isUnwrappable = false;
                    isRevertable = false;
                    isApplicable = false;
                }
            }
            else {
                prefabState = common_1.PrefabState.PrefabChild;
            }
            // 检查是否是嵌套 prefab
            isNested = this.isNestedPrefab(node);
            // @ts-ignore
            if (!node['_prefab'].asset || node['_prefab'].asset.isDefault || node['_prefab'].asset.uuid === '') {
                prefabState = common_1.PrefabState.PrefabLostAsset;
                // 资源丢失时要允许unlink
                isUnwrappable = true;
            }
            if (this.isSubAsset(assetUuid)) {
                isApplicable = false;
            }
        }
        if (node.parent && !this.isSceneNode(node.parent)) {
            // @ts-ignore
            const parentPrefabInfo = node.parent['_prefab'];
            if (parentPrefabInfo) {
                const outMostPrefabInstanceInfo = this.getOutMostPrefabInstanceInfo(node.parent);
                if (outMostPrefabInstanceInfo && outMostPrefabInstanceInfo.outMostPrefabInstanceNode) {
                    if (this.isMountedChildOf(outMostPrefabInstanceInfo.outMostPrefabInstanceNode, node)) {
                        isAddedChild = true;
                    }
                }
            }
        }
        return { state: prefabState, isUnwrappable, isRevertable, isApplicable, isAddedChild, isNested, assetUuid };
    }
    getMountedRoot(nodeOrComp) {
        return nodeOrComp[cc_1.editorExtrasTag]?.mountedRoot;
    }
    setMountedRoot(nodeOrComp, mountedRoot) {
        if (!nodeOrComp) {
            return;
        }
        if (!nodeOrComp[cc_1.editorExtrasTag]) {
            nodeOrComp[cc_1.editorExtrasTag] = {};
        }
        nodeOrComp[cc_1.editorExtrasTag].mountedRoot = mountedRoot;
    }
    // 待优化，这里要是增加的节点多了会比较费时
    isMountedChildOf(prefabInstanceNode, node) {
        const mountedRoot = this.getMountedRoot(node);
        if (mountedRoot && mountedRoot === prefabInstanceNode) {
            return true;
        }
        return false;
    }
    isMountedComponent(component) {
        const node = component.node;
        if (!node) {
            return false;
        }
        const outMostPrefabInstanceInfo = this.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return false;
        }
        const mountedRoot = this.getMountedRoot(component);
        if (mountedRoot && mountedRoot === outMostPrefabInstanceNode) {
            return true;
        }
        return false;
    }
    getRemovedComponents(node) {
        const removedComps = [];
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return removedComps;
        }
        const outMostPrefabInstanceInfo = this.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return removedComps;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        // @ts-ignore
        const outMostPrefabInfo = outMostPrefabInstanceNode['_prefab'];
        if (outMostPrefabInstance && outMostPrefabInfo && outMostPrefabInfo.asset) {
            if (outMostPrefabInstance.removedComponents.length <= 0) {
                return removedComps;
            }
            targetPath.splice(0, 1);
            targetPath.push(prefabInfo.fileId);
            const assetRootNode = this.getPrefabAssetNodeInstance(outMostPrefabInfo);
            if (!assetRootNode) {
                return removedComps;
            }
            const assetNode = this.getTarget(targetPath, assetRootNode, true);
            if (!assetNode) {
                return removedComps;
            }
            const curCompFileIDs = node.components.map((comp) => comp.__prefab?.fileId).filter((id) => !!id);
            for (const assetComp of assetNode.components) {
                if (assetComp.__prefab) {
                    if (!curCompFileIDs.includes(assetComp.__prefab.fileId)) {
                        removedComps.push(assetComp);
                    }
                }
            }
        }
        return removedComps;
    }
    checkToRemoveTargetOverride(source, root) {
        if (!root) {
            return;
        }
        // @ts-ignore
        if (this.removeTargetOverrideBySource(root['_prefab'], source)) {
            this.fireChangeMsg(root);
        }
    }
    findOutmostPrefabInstanceNodes(node, instanceRoots) {
        if (!node)
            return;
        const prefabInfo = node['_prefab'];
        if (prefabInfo?.instance) {
            // 遇到预制体时，要对mountedchildren进行递归,不能无脑对子节点递归
            instanceRoots.push(node);
            // 清空预制体及其嵌套预制体的nestedPrefabInstanceRoots
            if (prefabInfo.nestedPrefabInstanceRoots) {
                prefabInfo.nestedPrefabInstanceRoots.forEach((prefabNode) => {
                    // @ts-ignore
                    if (prefabNode['_prefab']) {
                        // @ts-ignore
                        prefabNode['_prefab'].nestedPrefabInstanceRoots = undefined;
                    }
                });
                prefabInfo.nestedPrefabInstanceRoots = undefined;
            }
            prefabInfo.instance?.mountedChildren?.forEach((mountedChildrenInfo) => {
                mountedChildrenInfo.nodes.forEach((child) => {
                    this.findOutmostPrefabInstanceNodes(child, instanceRoots);
                });
            });
        }
        else {
            // 普通节点一直递归
            node.children.forEach((child) => {
                this.findOutmostPrefabInstanceNodes(child, instanceRoots);
            });
        }
    }
    gatherPrefabInstanceRoots(rootNode) {
        // gather prefabInstance node info
        const instanceRoots = [];
        rootNode.children.forEach((child) => {
            if ((0, node_utils_1.isEditorNode)(child)) {
                return;
            }
            this.findOutmostPrefabInstanceNodes(child, instanceRoots);
        });
        if (instanceRoots.length > 0) {
            if (!rootNode['_prefab']) {
                rootNode['_prefab'] = this.createPrefabInfo(rootNode.uuid);
            }
            const rootPrefabInfo = rootNode['_prefab'];
            rootPrefabInfo.nestedPrefabInstanceRoots = instanceRoots;
        }
        else {
            const rootPrefabInfo = rootNode['_prefab'];
            if (rootPrefabInfo) {
                rootPrefabInfo.nestedPrefabInstanceRoots = undefined;
            }
        }
    }
    // public collectPrefabInstanceIDs(rootNode: Node){
    //     const prefabInfo = this.getPrefab(rootNode);
    //     const instances = prefabInfo?.nestedPrefabInstanceRoots;
    //     if (instances && instances.length > 0) {
    //         // 遍历instance上所有子节点（包括mounted的节点）
    //         instances.forEach(node => {
    //             const prefab = this.getPrefab(node);
    //             if (prefab && !this.getMountedRoot(node)) {
    //                 const ids: string[] = [];
    //                 node.walk((child) => {
    //                     ids.push(child.uuid);
    //                     child.components.forEach(component => {
    //                         if (component.uuid){
    //                             ids.push(component.uuid);
    //                         }
    //                     });
    //                 });
    //                 if (prefab.instance?.ids) {
    //                     prefab.instance.ids = ids;
    //                 }
    //                 // console.log('收集后的预制体id', prefab.instance?.ids.length);
    //             }
    //         });
    //     }
    // }
    // prefab 是否是子资源，比如FBX生成的prefab
    isSubAsset(uuid) {
        return uuid.includes('@');
    }
    removePrefabInfo(node) {
        this.fireBeforeChangeMsg(node);
        // @ts-ignore member access
        node['_prefab'] = null;
        // remove component prefabInfo
        node.components.forEach((comp) => {
            comp.__prefab = null;
        });
        this.fireChangeMsg(node);
    }
    // 有可能一些意外情况导致错误的MountedRoot的引用
    // 导致序列化了一些无效的数据
    // 这里校验MountedRoot的数是否准确
    checkMountedRootData(node, recursively) {
        const mountedRoot = this.getMountedRoot(node);
        if (mountedRoot) {
            let isRight = false;
            // @ts-ignore
            const prefabInstance = mountedRoot['_prefab']?.instance;
            if (prefabInstance && prefabInstance.mountedChildren) {
                for (let i = 0; i < prefabInstance.mountedChildren.length; i++) {
                    const mountedInfo = prefabInstance.mountedChildren[i];
                    if (mountedInfo.nodes.includes(node)) {
                        isRight = true;
                        break;
                    }
                }
            }
            if (!isRight) {
                // 校验不通过，删除MountedRoot数据
                this.setMountedRoot(node, undefined);
            }
        }
        node.components.forEach((comp) => {
            const compMountedRoot = this.getMountedRoot(comp);
            if (compMountedRoot) {
                let isRight = false;
                // @ts-ignore
                const prefabInstance = compMountedRoot['_prefab']?.instance;
                if (prefabInstance && prefabInstance.mountedComponents) {
                    for (let i = 0; i < prefabInstance.mountedComponents.length; i++) {
                        const mountedInfo = prefabInstance.mountedComponents[i];
                        if (mountedInfo.components.includes(comp)) {
                            isRight = true;
                            break;
                        }
                    }
                }
                if (!isRight) {
                    // 校验不通过，删除MountedRoot数据
                    this.setMountedRoot(comp, undefined);
                }
            }
        });
        if (recursively) {
            node.children.forEach((child) => {
                this.checkMountedRootData(child, true);
            });
        }
    }
    removePrefabInstanceRoots(rootNode) {
        const prefabInfo = rootNode['_prefab'];
        if (prefabInfo) {
            prefabInfo.nestedPrefabInstanceRoots = undefined;
        }
    }
    // 有些targetOverride里的source都为空了，需要去掉这些
    // 冗余数据
    checkTargetOverridesData(node) {
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return;
        }
        const targetOverrides = prefabInfo.targetOverrides;
        if (!targetOverrides) {
            return;
        }
        for (let i = targetOverrides.length - 1; i >= 0; i--) {
            const targetOverrideItr = targetOverrides[i];
            if (!targetOverrideItr || !targetOverrideItr.source) {
                targetOverrides.splice(i, 1);
            }
        }
    }
    /**
     * 判断节点是否是最外一层的PrefabInstance的Mounted节点
     * mountedChild的普通子节点也需要判断
     * @param node
     * @returns
     */
    isOutmostPrefabInstanceMountedChildren(node) {
        let nodeIter = node;
        while (nodeIter) {
            const mountedRoot = this.getMountedRoot(nodeIter);
            if (mountedRoot) {
                const outMostPrefabInstanceInfo = this.getOutMostPrefabInstanceInfo(mountedRoot);
                const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
                // 节点是挂在最外层的PrefabInstance下的mountedChildren
                if (outMostPrefabInstanceNode === mountedRoot) {
                    return true;
                }
            }
            nodeIter = nodeIter.parent;
            if (!nodeIter || this.isPrefabInstanceRoot(nodeIter)) {
                break;
            }
        }
        return false;
    }
    /**
     * 移除无效的propertyOverrides信息,移除组件时，需要移除关于该组件的propertyOverrides
     * @param root 预制体实例节点
     */
    removeInvalidPropertyOverrides(root) {
        const prefabInfo = root['_prefab'];
        if (prefabInfo && prefabInfo.instance) {
            const instance = prefabInfo.instance;
            const propertyOverrides = instance.propertyOverrides;
            const size = propertyOverrides.length;
            const targetMap = this.getTargetMap(root);
            if (!targetMap || Object.keys(targetMap).length === 0) {
                console.debug('removeInvalidPropertyOverrides return,targetMap is empty', root);
                return;
            }
            for (let index = size - 1; index >= 0; index--) {
                const propOverride = propertyOverrides[index];
                const targetInfo = propOverride.targetInfo;
                if (targetInfo) {
                    // 判断targetInfo是否存在，不存在的话，移除数据
                    const target = cc_1.Prefab._utils.getTarget(targetInfo.localID, targetMap);
                    if (!target) {
                        propertyOverrides.splice(index, 1);
                        // console.log('移除无效的propertyOverrides信息', propOverride);
                    }
                }
            }
        }
    }
    /**
     * 脚本属性不存在时，或者预制体内的子节点/组件丢失时,要移除数据
     * @param root
     * @returns
     */
    removeInvalidTargetOverrides(root) {
        const prefabInfo = root?.['_prefab'];
        if (prefabInfo) {
            const targetOverrides = prefabInfo.targetOverrides;
            if (!targetOverrides)
                return;
            for (let index = targetOverrides.length - 1; index >= 0; index--) {
                const info = targetOverrides[index];
                // 判断引用节点是否存在
                let source = info.source;
                const sourceInfo = info.sourceInfo;
                let target = null;
                const targetInfo = info.targetInfo;
                if (sourceInfo) {
                    if (info.source instanceof cc_1.Node) {
                        source = this.getTarget(sourceInfo.localID, info.source);
                    }
                }
                // source (引用的节点或组件)
                // info.target (被引用的目标节点的预制体根节点)
                // targetInfo (被引用的 TargetInfo 信息，用来定位具体在哪个)
                // 1.如果 source 与 info.target 都没有也就是查询不到 target 也需要剔除
                if (!source && !info.target) {
                    targetOverrides.splice(index, 1);
                    continue;
                }
                // 2.如果没有 source 存在 info.target 也存在 targetInfo，但是需要查询一下是否有 target，如果没有就进行剔除
                if (!source && info.target && targetInfo && targetInfo.localID) {
                    target = this.getTarget(targetInfo.localID, info.target);
                    if (!target) {
                        targetOverrides.splice(index, 1);
                        continue;
                    }
                }
                if (!source || !targetInfo) {
                    continue;
                }
                if (!(info.target instanceof cc_1.Node)) {
                    continue;
                }
                target = this.getTarget(targetInfo.localID, info.target);
                if (!target) {
                    continue;
                }
                // 属性不存在，目标不存在,类型不一致，则移除属性
                const propertyPath = info.propertyPath.slice();
                let targetPropOwner = source;
                for (let i = 0; i < propertyPath.length; i++) {
                    const propName = propertyPath[i];
                    const attr = cc_1.CCClass.Attr.getClassAttrs(targetPropOwner.constructor);
                    targetPropOwner = targetPropOwner[propName];
                    // propertyPath中间可能会断掉，比如数组被清空
                    if (!targetPropOwner) {
                        targetOverrides.splice(index, 1);
                        break;
                    }
                    if (i === propertyPath.length - 1) {
                        const attrKey = propName + DELIMETER + 'ctor';
                        // 条件一: 当前值的属性目标值类型匹配
                        // 条件二：脚本中的属性类型（attr的ctor）应该是target的父类
                        // #14140 #14944 #13612 #14007
                        // 这里的逻辑经过反复修改，因为可能性实在太多了
                        // 需要考虑数组变化，类型变化，值残留，自定义类型，子类等
                        // 后续应该将清理的操作用户变成用户主动操作,在面板中显示实例上的override信息，并提供删除选项
                        if (!isInClassChain(targetPropOwner.constructor, target.constructor)
                            || (attr && attr[attrKey] && !isInClassChain(target.constructor, attr[attrKey]))) {
                            targetOverrides.splice(index, 1);
                        }
                    }
                }
            }
        }
    }
    /**
     * 清理预制体冗余数据
     * @param root
     */
    removeInvalidPrefabData(root) {
        // 清理targetOverrides
        this.removeInvalidTargetOverrides(root);
        // 清理propertyOverrides
        const prefabInfo = root['_prefab'];
        const nestedInstance = prefabInfo?.nestedPrefabInstanceRoots;
        if (nestedInstance) {
            // 嵌套预制体
            nestedInstance.forEach((node) => {
                this.removeInvalidPropertyOverrides(node);
            });
        }
    }
    /**
     * 清除预制体中，嵌套预制体的propertOverrides对非预制体子节点的引用
     * @param root 预制体根节点
     * @return {nestedPrefabInstanceRoots:{illegalReference}}
     */
    removeInvalidPropertyOverrideReference(root) {
        const prefabInfo = this.getPrefab(root);
        const ret = new Map();
        if (prefabInfo) {
            prefabInfo.nestedPrefabInstanceRoots?.forEach((prefabInstanceNode) => {
                const nestPrefabInfo = this.getPrefab(prefabInstanceNode);
                const propertyOverrides = nestPrefabInfo?.instance?.propertyOverrides;
                if (propertyOverrides) {
                    for (let index = propertyOverrides.length - 1; index >= 0; index--) {
                        const props = propertyOverrides[index];
                        let val = props.value;
                        if (val instanceof cc.Component.EventHandler) {
                            val = val.target;
                        }
                        else if (val instanceof cc.Component) {
                            val = val.node;
                        }
                        if (val && val instanceof cc.Node && !val.isChildOf(root)) {
                            // console.warn('cleanIllegalPropertyOverrideReference', props);
                            propertyOverrides.splice(index, 1);
                            let backUp = ret.get(prefabInstanceNode);
                            if (!backUp) {
                                backUp = [];
                                ret.set(prefabInstanceNode, backUp);
                            }
                            backUp.push(props);
                        }
                    }
                }
            });
        }
        return ret;
    }
}
exports.prefabUtils = new PrefabUtil();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvcHJlZmFiL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWIsMkJBQW9HO0FBQ3BHLG1EQUFrRDtBQUNsRCxrQ0FBaUQ7QUFDakQsNENBQTBFO0FBRzFFLE1BQU0sVUFBVSxHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBRTVDLE1BQU0sY0FBYyxHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO0FBRXBELE1BQU0sY0FBYyxHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO0FBRXBELE1BQU0sVUFBVSxHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBRTVDLE1BQU0sb0JBQW9CLEdBQUcsV0FBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztBQUVoRSxNQUFNLG1CQUFtQixHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUM7QUFFOUQsTUFBTSxrQkFBa0IsR0FBRyxXQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0FBRTVELE1BQU0scUJBQXFCLEdBQUcsV0FBTSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQztBQUdsRSxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7QUFDOUIsTUFBTSxTQUFTLEdBQUcsWUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7QUFFekMsU0FBUyxrQkFBa0IsQ0FBQyxNQUE0QixFQUFFLE1BQTRCO0lBQ2xGLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FB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LE1BQU0sQ0FBQyxDQUFDOzRCQUN4QyxDQUFDOzRCQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3ZCLENBQUM7b0JBQ0wsQ0FBQztnQkFFTCxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDOztBQUdRLFFBQUEsV0FBVyxHQUFHLElBQUksVUFBVSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IENvbXBvbmVudCwgZWRpdG9yRXh0cmFzVGFnLCBpbnN0YW50aWF0ZSwgTm9kZSwgUHJlZmFiLCBDQ0NsYXNzLCBTY2VuZSwgaXNWYWxpZCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IGlzRWRpdG9yTm9kZSB9IGZyb20gJy4uL25vZGUvbm9kZS11dGlscyc7XG5pbXBvcnQgeyBTZXJ2aWNlRXZlbnRzLCBTZXJ2aWNlIH0gZnJvbSAnLi4vY29yZSc7XG5pbXBvcnQgeyBJTm9kZUV2ZW50cywgTm9kZUV2ZW50VHlwZSwgUHJlZmFiU3RhdGUgfSBmcm9tICcuLi8uLi8uLi9jb21tb24nO1xuXG50eXBlIFByZWZhYkluZm8gPSBQcmVmYWIuX3V0aWxzLlByZWZhYkluZm87XG5jb25zdCBQcmVmYWJJbmZvID0gUHJlZmFiLl91dGlscy5QcmVmYWJJbmZvO1xudHlwZSBDb21wUHJlZmFiSW5mbyA9IFByZWZhYi5fdXRpbHMuQ29tcFByZWZhYkluZm87XG5jb25zdCBDb21wUHJlZmFiSW5mbyA9IFByZWZhYi5fdXRpbHMuQ29tcFByZWZhYkluZm87XG50eXBlIFByZWZhYkluc3RhbmNlID0gUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZTtcbmNvbnN0IFByZWZhYkluc3RhbmNlID0gUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZTtcbnR5cGUgVGFyZ2V0SW5mbyA9IFByZWZhYi5fdXRpbHMuVGFyZ2V0SW5mbztcbmNvbnN0IFRhcmdldEluZm8gPSBQcmVmYWIuX3V0aWxzLlRhcmdldEluZm87XG50eXBlIFByb3BlcnR5T3ZlcnJpZGVJbmZvID0gUHJlZmFiLl91dGlscy5Qcm9wZXJ0eU92ZXJyaWRlSW5mbztcbmNvbnN0IFByb3BlcnR5T3ZlcnJpZGVJbmZvID0gUHJlZmFiLl91dGlscy5Qcm9wZXJ0eU92ZXJyaWRlSW5mbztcbnR5cGUgTW91bnRlZENoaWxkcmVuSW5mbyA9IFByZWZhYi5fdXRpbHMuTW91bnRlZENoaWxkcmVuSW5mbztcbmNvbnN0IE1vdW50ZWRDaGlsZHJlbkluZm8gPSBQcmVmYWIuX3V0aWxzLk1vdW50ZWRDaGlsZHJlbkluZm87XG50eXBlIFRhcmdldE92ZXJyaWRlSW5mbyA9IFByZWZhYi5fdXRpbHMuVGFyZ2V0T3ZlcnJpZGVJbmZvO1xuY29uc3QgVGFyZ2V0T3ZlcnJpZGVJbmZvID0gUHJlZmFiLl91dGlscy5UYXJnZXRPdmVycmlkZUluZm87XG50eXBlIE1vdW50ZWRDb21wb25lbnRzSW5mbyA9IFByZWZhYi5fdXRpbHMuTW91bnRlZENvbXBvbmVudHNJbmZvO1xuY29uc3QgTW91bnRlZENvbXBvbmVudHNJbmZvID0gUHJlZmFiLl91dGlscy5Nb3VudGVkQ29tcG9uZW50c0luZm87XG5cblxuY29uc3QgY29tcEtleSA9ICdfY29tcG9uZW50cyc7XG5jb25zdCBERUxJTUVURVIgPSBDQ0NsYXNzLkF0dHIuREVMSU1FVEVSO1xuXG5mdW5jdGlvbiBjb21wYXJlU3RyaW5nQXJyYXkoYXJyYXkxOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCwgYXJyYXkyOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghYXJyYXkxIHx8ICFhcnJheTIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChhcnJheTEubGVuZ3RoICE9PSBhcnJheTIubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXkxLmV2ZXJ5KCh2YWx1ZSwgaW5kZXgpID0+IHZhbHVlID09PSBhcnJheTJbaW5kZXhdKTtcbn1cblxuZnVuY3Rpb24gaXNJbkNsYXNzQ2hhaW4oc3JjQ3RvcjogYW55LCBkc3RDdG9yOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAoc3JjQ3RvciAmJiBkc3RDdG9yKSB7XG4gICAgICAgIGNvbnN0IGNoaWFuID0gQ0NDbGFzcy5nZXRJbmhlcml0YW5jZUNoYWluKHNyY0N0b3IpO1xuICAgICAgICBjaGlhbi5wdXNoKHNyY0N0b3IpO1xuICAgICAgICByZXR1cm4gY2hpYW4uaW5jbHVkZXMoZHN0Q3Rvcik7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNTYW1lTm9kZShzcmM6IE5vZGUsIGRzdDogTm9kZSkge1xuICAgIHJldHVybiBzcmMuZ2V0UGF0aEluSGllcmFyY2h5KCkgPT09IGRzdC5nZXRQYXRoSW5IaWVyYXJjaHkoKSAmJiBzcmMuZ2V0U2libGluZ0luZGV4KCkgPT09IGRzdC5nZXRTaWJsaW5nSW5kZXgoKTtcbn1cblxuZnVuY3Rpb24gcHVzaE5lc3RlZFByZWZhYihuZXN0ZWRQcmVmYWJOb2RlOiBOb2RlLCByb290OiBOb2RlLCBwYXRoczogc3RyaW5nW10pIHtcbiAgICBsZXQgcGFyZW50ID0gbmVzdGVkUHJlZmFiTm9kZS5wYXJlbnQgYXMgTm9kZTtcbiAgICB3aGlsZSAocGFyZW50ICYmIHBhcmVudCAhPT0gcm9vdCkge1xuICAgICAgICBpZiAocGFyZW50WydfcHJlZmFiJ10/Lmluc3RhbmNlKSB7XG4gICAgICAgICAgICBwYXRocy51bnNoaWZ0KHBhcmVudFsnX3ByZWZhYiddPy5pbnN0YW5jZS5maWxlSWQpO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQgYXMgTm9kZTtcbiAgICB9XG59XG5cbmNsYXNzIFByZWZhYlV0aWwge1xuICAgIHB1YmxpYyBzdGF0aWMgUHJlZmFiU3RhdGUgPSBQcmVmYWJTdGF0ZTtcbiAgICBwcml2YXRlIGFzc2V0VGFyZ2V0TWFwQ2FjaGU6IE1hcDxOb2RlLCB7fT4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSBwcmVmYWJBc3NldE5vZGVJbnN0YW5jZU1hcDogTWFwPFByZWZhYkluZm8sIE5vZGU+ID0gbmV3IE1hcCgpOyAvLyDnlKjkuo5QcmVmYWJBc3NldOagueiKgueCueWunuS+i+WMluaVsOaNrue8k+WtmO+8jOeUqOS6jmRpZmblr7nmr5RcblxuICAgIHB1YmxpYyBnZXRQcmVmYWIobm9kZTogTm9kZSk6IFByZWZhYkluZm8gfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIG5vZGVbJ19wcmVmYWInXTtcbiAgICB9XG5cbiAgICAvLyDlj5HpgIHoioLngrnkv67mlLnliY3mtojmga9cbiAgICBwdWJsaWMgZmlyZUJlZm9yZUNoYW5nZU1zZyhub2RlOiBOb2RlKSB7XG4gICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdDxJTm9kZUV2ZW50cz4oJ25vZGU6YmVmb3JlLWNoYW5nZScsIG5vZGUpO1xuICAgIH1cblxuICAgIC8vIOWPkemAgeiKgueCueS/ruaUuea2iOaBr1xuICAgIHB1YmxpYyBmaXJlQ2hhbmdlTXNnKG5vZGU6IE5vZGUgfCBTY2VuZSwgb3B0czogYW55ID0ge30pIHtcbiAgICAgICAgb3B0cy50eXBlID0gTm9kZUV2ZW50VHlwZS5QUkVGQUJfSU5GT19DSEFOR0VEO1xuICAgICAgICBTZXJ2aWNlRXZlbnRzLmVtaXQ8SU5vZGVFdmVudHM+KCdub2RlOmNoYW5nZScsIG5vZGUsIG9wdHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcmVmYWJBc3NldE5vZGVJbnN0YW5jZShwcmVmYWJJbmZvOiBQcmVmYWJJbmZvKSB7XG4gICAgICAgIGlmICh0aGlzLnByZWZhYkFzc2V0Tm9kZUluc3RhbmNlTWFwLmhhcyhwcmVmYWJJbmZvKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJlZmFiQXNzZXROb2RlSW5zdGFuY2VNYXAuZ2V0KHByZWZhYkluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFzc2V0Um9vdE5vZGU6IE5vZGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChwcmVmYWJJbmZvICYmIHByZWZhYkluZm8uYXNzZXQgJiYgaXNWYWxpZChwcmVmYWJJbmZvLmFzc2V0KSkge1xuICAgICAgICAgICAgYXNzZXRSb290Tm9kZSA9IGluc3RhbnRpYXRlKHByZWZhYkluZm8uYXNzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzc2V0Um9vdE5vZGUpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJbmZvID0gYXNzZXRSb290Tm9kZVsnX3ByZWZhYiddO1xuICAgICAgICAgICAgaWYgKHJvb3RQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgcm9vdFByZWZhYkluZm8uaW5zdGFuY2UgPSBwcmVmYWJJbmZvLmluc3RhbmNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnByZWZhYkFzc2V0Tm9kZUluc3RhbmNlTWFwLnNldChwcmVmYWJJbmZvLCBhc3NldFJvb3ROb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhc3NldFJvb3ROb2RlO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbGVhckNhY2hlKCkge1xuICAgICAgICB0aGlzLmFzc2V0VGFyZ2V0TWFwQ2FjaGUuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5wcmVmYWJBc3NldE5vZGVJbnN0YW5jZU1hcC5jbGVhcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVQcmVmYWJBc3NldE5vZGVJbnN0YW5jZUNhY2hlKHByZWZhYkluZm86IFByZWZhYkluZm8pIHtcbiAgICAgICAgaWYgKHRoaXMucHJlZmFiQXNzZXROb2RlSW5zdGFuY2VNYXAuaGFzKHByZWZhYkluZm8pKSB7XG4gICAgICAgICAgICB0aGlzLnByZWZhYkFzc2V0Tm9kZUluc3RhbmNlTWFwLmRlbGV0ZShwcmVmYWJJbmZvKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOe8lui+keWZqOS4rSxub2RlLl9wcmVmYWIuaW5zdGFuY2UudGFyZ2V0TWFw5a2Y5Zyo5Lii5aSx55qE5oOF5Ya1LOavlOWmguaWsOW7uumihOWItuS9k+aXtlxuICAgICAqIOaJgOS7pee8lui+keWZqOS4reivt+S4jeimgemAmui/h+W8leaTjuWtl+auteiuv+mXrnRhcmdldE1hcO+8jOS7juiAjOWOu+iOt+WPlnRhcmdldFxuICAgICAqIOivt+S9v+eUqHByZWZhYlV0aWzmj5DkvpvnmoTmlrnms5XmnaXorr/pl65cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0VGFyZ2V0TWFwKG5vZGU6IE5vZGUsIHVzZUNhY2hlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKHVzZUNhY2hlICYmIHRoaXMuYXNzZXRUYXJnZXRNYXBDYWNoZS5oYXMobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFzc2V0VGFyZ2V0TWFwQ2FjaGUuZ2V0KG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXRUYXJnZXRNYXAgPSB7fTtcbiAgICAgICAgdGhpcy5nZW5lcmF0ZVRhcmdldE1hcChub2RlLCBhc3NldFRhcmdldE1hcCwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5hc3NldFRhcmdldE1hcENhY2hlLnNldChub2RlLCBhc3NldFRhcmdldE1hcCk7XG5cbiAgICAgICAgcmV0dXJuIGFzc2V0VGFyZ2V0TWFwO1xuICAgIH1cblxuICAgIC8vIOmAmui/h2xvY2FsSUTojrflj5boioLngrlub2Rl5LiK55qE6IqC54K5XG4gICAgcHVibGljIGdldFRhcmdldChsb2NhbElEOiBzdHJpbmdbXSwgbm9kZTogTm9kZSwgdXNlQ2FjaGUgPSBmYWxzZSk6IE5vZGUgfCBDb21wb25lbnQgfCBudWxsIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0TWFwID0gdGhpcy5nZXRUYXJnZXRNYXAobm9kZSwgdXNlQ2FjaGUpO1xuICAgICAgICByZXR1cm4gUHJlZmFiLl91dGlscy5nZXRUYXJnZXQobG9jYWxJRCwgdGFyZ2V0TWFwKTtcbiAgICB9XG5cbiAgICAvLyDkuI5QcmVmYWIuX3V0aWxzLmdlbmVyYXRlVGFyZ2V0TWFw5LiN5ZCM55qE5piv77yM6L+Z5Liq6ZyA6KaB5bCGbW91bnRlZCBjaGlsZHJlbumDveiAg+iZkei/m+adpVxuICAgIHByaXZhdGUgZ2VuZXJhdGVUYXJnZXRNYXAobm9kZTogTm9kZSwgdGFyZ2V0TWFwOiBhbnksIGlzUm9vdDogYm9vbGVhbikge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VyVGFyZ2V0TWFwID0gdGFyZ2V0TWFwO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gbm9kZVsnX3ByZWZhYiddPy5pbnN0YW5jZTtcbiAgICAgICAgaWYgKCFpc1Jvb3QgJiYgcHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRhcmdldE1hcFtwcmVmYWJJbnN0YW5jZS5maWxlSWRdID0ge307XG4gICAgICAgICAgICBjdXJUYXJnZXRNYXAgPSB0YXJnZXRNYXBbcHJlZmFiSW5zdGFuY2UuZmlsZUlkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmIChwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICBjdXJUYXJnZXRNYXBbcHJlZmFiSW5mby5maWxlSWRdID0gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlLmNvbXBvbmVudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY29tcCA9IGNvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBpZiAoY29tcC5fX3ByZWZhYikge1xuICAgICAgICAgICAgICAgIGN1clRhcmdldE1hcFtjb21wLl9fcHJlZmFiLmZpbGVJZF0gPSBjb21wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZVRhcmdldE1hcChjaGlsZE5vZGUsIGN1clRhcmdldE1hcCwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlICYmIHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkSW5mbyA9IHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRJbmZvICYmIGNoaWxkSW5mby50YXJnZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtb3VudGVkVGFyZ2V0TWFwID0gY3VyVGFyZ2V0TWFwO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2NhbElEID0gY2hpbGRJbmZvLnRhcmdldEluZm8ubG9jYWxJRDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsSUQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbElELmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vdW50ZWRUYXJnZXRNYXAgPSBtb3VudGVkVGFyZ2V0TWFwW2xvY2FsSURbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOebruagh+iKgueCueaYr+W1jOWll+mihOWItuS9k+aXtu+8jOWPr+iDveWHuueOsOaMgui9veeahOiKgueCueW3sue7j+S4jeWGjeaYr+mihOWItuS9k+WunuS+i+eahOaDheWGtSAjMTc0OTNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkSW5mby5ub2RlcyAmJiBtb3VudGVkVGFyZ2V0TWFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkSW5mby5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IGNoaWxkSW5mby5ub2Rlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1vdW50ZWQgbm9kZSBuZWVkIHRvIGFkZCB0byB0aGUgdGFyZ2V0IG1hcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVUYXJnZXRNYXAoY2hpbGROb2RlLCBtb3VudGVkVGFyZ2V0TWFwLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJvcGVydHlPdmVycmlkZUxvY2F0aW9uSW5mbyhub2RlOiBOb2RlLCBwYXRoS2V5czogc3RyaW5nW10pIHtcbiAgICAgICAgLy8g5ZCR5LiK5p+l5om+UHJlZmFiSW5zdGFuY2Xot6/lvoRcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHRoaXMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhub2RlKTtcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTogTm9kZSB8IG51bGwgPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvLm91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU7XG4gICAgICAgIGlmICghb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aDogc3RyaW5nW10gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvLnRhcmdldFBhdGg7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlOiBQcmVmYWIuX3V0aWxzLlByZWZhYkluc3RhbmNlIHwgdW5kZWZpbmVkID0gb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZVsnX3ByZWZhYiddPy5pbnN0YW5jZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gbm9kZTtcbiAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgdGFyZ2V0UGF0aC5zcGxpY2UoMCwgMSk7IC8vIOS4jemcgOimgeWtmOacgOWkluWxgueahFByZWZhYkluc3RhbmNl55qEZmlsZUlE77yM5pa55L6/b3ZlcnJpZGXlj6/ku6XlnKhQcmVmYWJJbnN0YW5jZeWkjeWItuWQjuWkjeeUqFxuICAgICAgICAgICAgbGV0IHJlbGF0aXZlUGF0aEtleXM6IHN0cmluZ1tdID0gW107IC8vIOebuOWvueS6juebruagh++8iG5vZGVcXGNvbXBvbmVudCnnmoTlsZ7mgKfmn6Xmib7ot6/lvoRcblxuICAgICAgICAgICAgaWYgKHBhdGhLZXlzLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwYXRoS2V5c1swXSA9PT0gY29tcEtleSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoS2V5cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbW9kaWZ5IGNvbXBvbmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocGF0aEtleXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE/vvIzmlLnlj5hjb21wb25lbnRz5pWw57uEXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSAobm9kZVtwYXRoS2V5c1swXV0gYXMgYW55KVtwYXRoS2V5c1sxXV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbXAuX19wcmVmYWIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGF0aC5wdXNoKGNvbXAuX19wcmVmYWIuZmlsZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmVQYXRoS2V5cyA9IHBhdGhLZXlzLnNsaWNlKDIpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb21wO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYGNvbXBvbmVudDogJHtjb21wLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHByZWZhYkluZm9gKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gbW91bnRlZCBjb21wb25lbnQgZG9lc24ndCBoYXZlIGEgcHJlZmFiSW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5vZGVcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICAgICAgICAgIGlmIChwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFBhdGgucHVzaChwcmVmYWJJbmZvLmZpbGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlUGF0aEtleXMgPSBwYXRoS2V5cztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBub2RlOiAke25vZGUubmFtZX0gZG9lc24ndCBoYXZlIGEgcHJlZmFiSW5mb2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHsgb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSwgdGFyZ2V0UGF0aCwgcmVsYXRpdmVQYXRoS2V5cywgdGFyZ2V0IH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJlZmFiRm9yU2VyaWFsaXplKG5vZGU6IE5vZGUsIHF1aWV0OiBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGRlZXAgY2xvbmUsIHNpbmNlIHdlIGRvbid0IHdhbnQgdGhlIGdpdmVuIG5vZGUgY2hhbmdlZCBieSBjb2RlcyBiZWxvd1xuICAgICAgICBjb25zdCBjbG9uZU5vZGUgPSBpbnN0YW50aWF0ZShub2RlKTtcbiAgICAgICAgLy8g5Zyo5L+u5pS56IqC54K5cHJlZmFiSW5mb+aXtuWFiOWOu+aOiW1vdW50ZWRDaGlsZOeahOaMgui9veS/oeaBr1xuICAgICAgICB0aGlzLnJlbW92ZU1vdW50ZWRSb290SW5mbyhjbG9uZU5vZGUpO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYiA9IG5ldyBjYy5QcmVmYWIoKTtcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IHRoaXMuY3JlYXRlUHJlZmFiSW5mbyhub2RlLnV1aWQpO1xuICAgICAgICBwcmVmYWJJbmZvLmFzc2V0ID0gcHJlZmFiO1xuICAgICAgICBwcmVmYWJJbmZvLnJvb3QgPSBjbG9uZU5vZGU7XG5cbiAgICAgICAgLy8g5aSN5Yi26aKE5Yi25L2T5L+h5oGvXG4gICAgICAgIGNvbnN0IG9yaVByZWZhYkluZm8gPSB0aGlzLmdldFByZWZhYihjbG9uZU5vZGUpIGFzIFByZWZhYkluZm87XG4gICAgICAgIGlmIChvcmlQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICBwcmVmYWIub3B0aW1pemF0aW9uUG9saWN5ID0gb3JpUHJlZmFiSW5mby5hc3NldD8ub3B0aW1pemF0aW9uUG9saWN5O1xuICAgICAgICAgICAgcHJlZmFiLnBlcnNpc3RlbnQgPSBvcmlQcmVmYWJJbmZvLmFzc2V0Py5wZXJzaXN0ZW50O1xuICAgICAgICAgICAgcHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXMgPSBvcmlQcmVmYWJJbmZvLnRhcmdldE92ZXJyaWRlcztcbiAgICAgICAgICAgIHByZWZhYkluZm8uZmlsZUlkID0gb3JpUHJlZmFiSW5mby5maWxlSWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjbG9uZU5vZGVbJ19wcmVmYWInXSA9IHByZWZhYkluZm87XG5cbiAgICAgICAgY29uc3QgbmVzdGVkSW5zdE5vZGVzOiBOb2RlW10gPSBbXTtcbiAgICAgICAgLy8g57uZ5a2Q6IqC54K56K6+572ucHJlZmFiSW5mby1hc3NldCzlpITnkIZuZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3Rz5ZKMcHJlZmFiUm9vdE5vZGVcbiAgICAgICAgdGhpcy53YWxrTm9kZShjbG9uZU5vZGUsIChjaGlsZDogTm9kZSwgaXNDaGlsZDogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgLy8g56eB5pyJ6IqC54K55LiN6ZyA6KaB5re75YqgIHByZWZhYkluZm8g5pWw5o2uXG4gICAgICAgICAgICBpZiAoY2hpbGQub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuSGlkZUluSGllcmFyY2h5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2hpbGRQcmVmYWIgPSB0aGlzLmdldFByZWZhYihjaGlsZCk7XG4gICAgICAgICAgICBpZiAoY2hpbGRQcmVmYWIpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRQcmVmYWIuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSE55CG5bWM5aWX6aKE5Yi25L2T5L+h5oGvXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSB9ID0gdGhpcy5nZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgPT09IGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFByZWZhYi5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRQcmVmYWIuaW5zdGFuY2UucHJlZmFiUm9vdE5vZGUgPSBjbG9uZU5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXN0ZWRJbnN0Tm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGRbJ19wcmVmYWInXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRbJ19wcmVmYWInXS5yb290ID0gcHJlZmFiSW5mby5yb290O1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRbJ19wcmVmYWInXS5hc3NldCA9IHByZWZhYkluZm8uYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1ByZWZhYiA9IG5ldyBQcmVmYWJJbmZvKCk7XG4gICAgICAgICAgICAgICAgbmV3UHJlZmFiLnJvb3QgPSBwcmVmYWJJbmZvLnJvb3Q7XG4gICAgICAgICAgICAgICAgbmV3UHJlZmFiLmFzc2V0ID0gcHJlZmFiSW5mby5hc3NldDtcbiAgICAgICAgICAgICAgICBuZXdQcmVmYWIuZmlsZUlkID0gY2hpbGQudXVpZDtcblxuICAgICAgICAgICAgICAgIGNoaWxkWydfcHJlZmFiJ10gPSBuZXdQcmVmYWI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOe7hOS7tuS5n+a3u+WKoCBfX3ByZWZhYiBmaWxlSWQg5bGe5oCn77yM5Lul5L6/5aSN55SoXG4gICAgICAgICAgICBpZiAoY2hpbGQuY29tcG9uZW50cyAmJiBjaGlsZC5jb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gY2hpbGQuY29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb21wLl9fcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLl9fcHJlZmFiID0gbmV3IENvbXBQcmVmYWJJbmZvKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLl9fcHJlZmFiLmZpbGVJZCA9IGNvbXAudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHByZWZhYkluZm8ubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cyA9IG5lc3RlZEluc3ROb2Rlcy5sZW5ndGggPiAwID8gbmVzdGVkSW5zdE5vZGVzIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIOa4heeQhuWklumDqOiKgueCueeahOW8leeUqCzov5nph4zkvJrmuIXmjoljb21wb25lbnTnmoRJRCzlv4XpobvlnKjkuIrov7DmraXpqqTmiafooYzlrozlkI7miY3lj6/ku6XmuIUoX19wcmVmYWIuZmlsZUlkKVxuICAgICAgICBjb25zdCBjbGVhcmVkUmVmZXJlbmNlID0gRWRpdG9yRXh0ZW5kcy5QcmVmYWJVdGlscy5jaGVja0FuZFN0cmlwTm9kZShjbG9uZU5vZGUsIHF1aWV0KTtcblxuICAgICAgICB0aGlzLnJlbW92ZUludmFsaWRQcmVmYWJEYXRhKGNsb25lTm9kZSk7XG4gICAgICAgIHRoaXMuc2V0TW91bnRlZFJvb3QoY2xvbmVOb2RlLCB1bmRlZmluZWQpO1xuICAgICAgICBwcmVmYWIuZGF0YSA9IGNsb25lTm9kZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByZWZhYjogcHJlZmFiLFxuICAgICAgICAgICAgY2xlYXJlZFJlZmVyZW5jZTogY2xlYXJlZFJlZmVyZW5jZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkUHJlZmFiSW5mbyhub2RlOiBOb2RlLCByb290Tm9kZTogTm9kZSwgcHJlZmFiOiBQcmVmYWIgfCB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIEVkaXRvckV4dGVuZHMuUHJlZmFiVXRpbHMuYWRkUHJlZmFiSW5mbyhub2RlLCByb290Tm9kZSwgcHJlZmFiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgd2Fsa05vZGUobm9kZTogTm9kZSwgaGFuZGxlOiAobm9kZTogTm9kZSwgaXNDaGlsZDogYm9vbGVhbikgPT4gYm9vbGVhbiB8IHZvaWQsIGlzQ2hpbGQgPSBmYWxzZSkge1xuICAgICAgICBFZGl0b3JFeHRlbmRzLlByZWZhYlV0aWxzLndhbGtOb2RlKG5vZGUsIGhhbmRsZSwgaXNDaGlsZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFByZWZhYkluZm9Ub0NvbXBvbmVudChjb21wOiBDb21wb25lbnQpIHtcbiAgICAgICAgaWYgKCFjb21wLl9fcHJlZmFiKSB7XG4gICAgICAgICAgICBjb21wLl9fcHJlZmFiID0gbmV3IENvbXBQcmVmYWJJbmZvKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbXAuX19wcmVmYWIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbXAuX19wcmVmYWIuZmlsZUlkID0gY29tcC5fX3ByZWZhYi5maWxlSWQgPyBjb21wLl9fcHJlZmFiLmZpbGVJZCA6IGNvbXAudXVpZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhYvpmobkuIDkuKroioLngrnvvIzovazkuLrpooTliLbkvZPvvIzov5Tlm57pooTliLbkvZPluo/liJfljJbmlbDmja5cbiAgICAgKiDms6jmhI/ov5nkuKrkuI3kvJrlvbHlk43njrDmnInoioLngrnmlbDmja7vvIzkvYbnlJ/miJDnmoTpooTliLbkvZPvvIzkvJrmnInpg6jliIblpJbpg6jlvJXnlKjmlbDmja7ooqvmuIXnkIZcbiAgICAgKiBAcGFyYW0geyp9IG5vZGVVVUlEXG4gICAgICovXG4gICAgcHVibGljIGdlbmVyYXRlUHJlZmFiRGF0YUZyb21Ob2RlKG5vZGVVVUlEOiBzdHJpbmcgfCBOb2RlKSB7XG4gICAgICAgIGxldCBub2RlOiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGlmICh0eXBlb2Ygbm9kZVVVSUQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBub2RlID0gRWRpdG9yRXh0ZW5kcy5Ob2RlLmdldE5vZGUobm9kZVVVSUQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVVVUlEO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHByZWZhYiwgY2xlYXJlZFJlZmVyZW5jZSB9ID0gdGhpcy5nZXRQcmVmYWJGb3JTZXJpYWxpemUobm9kZSk7XG4gICAgICAgIGlmICghcHJlZmFiKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWFiOWOu+aOiXByZWZhYkluc3RhbmNl77yM562J5pSv5oyB5LqGVmFyaWFudOWGjeWunueOsOS4jeWJlOmZpOeahOaDheWGtVxuICAgICAgICBwcmVmYWIuZGF0YVsnX3ByZWZhYiddLmluc3RhbmNlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIOaLluaLveeUn+aIkHByZWZhYuaXtuimgea4heeQhmluc3RhbmNl5Lit5a+55aSW6YOo6IqC54K555qE5byV55So77yM5ZCm5YiZ5Lya5oqK5Zy65pmv5L+d5a2Y5YiwcHJlZmFi5LitXG4gICAgICAgIHRoaXMucmVtb3ZlSW52YWxpZFByb3BlcnR5T3ZlcnJpZGVSZWZlcmVuY2UocHJlZmFiLmRhdGEpO1xuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShwcmVmYWIpO1xuXG4gICAgICAgIC8vIOaBouWkjWNsZWFyZWRSZWZlcmVuY2VcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByZWZhYkRhdGE6IGRhdGEgYXMgc3RyaW5nLFxuICAgICAgICAgICAgY2xlYXJlZFJlZmVyZW5jZTogY2xlYXJlZFJlZmVyZW5jZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gcmV0dXJuIGRhdGEgYXMgc3RyaW5nO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVNb3VudGVkUm9vdEluZm8obm9kZTogTm9kZSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvLmluc3RhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtb3VudGVkQ2hpbGRyZW4gPSBwcmVmYWJJbmZvLmluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbjtcbiAgICAgICAgbW91bnRlZENoaWxkcmVuLmZvckVhY2goKG1vdW50ZWRDaGlsZEluZm8pID0+IHtcbiAgICAgICAgICAgIG1vdW50ZWRDaGlsZEluZm8ubm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0TW91bnRlZFJvb3Qobm9kZSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtb3VudGVkQ29tcG9uZW50cyA9IHByZWZhYkluZm8uaW5zdGFuY2UubW91bnRlZENvbXBvbmVudHM7XG4gICAgICAgIG1vdW50ZWRDb21wb25lbnRzLmZvckVhY2goKG1vdW50ZWRDb21wSW5mbykgPT4ge1xuICAgICAgICAgICAgbW91bnRlZENvbXBJbmZvLmNvbXBvbmVudHMuZm9yRWFjaCgoY29tcCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0TW91bnRlZFJvb3QoY29tcCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2VuZXJhdGVVVUlEKCkge1xuICAgICAgICByZXR1cm4gRWRpdG9yRXh0ZW5kcy5VdWlkVXRpbHMuZ2VuZXJhdGUodHJ1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZVByZWZhYkluc3RhbmNlKCkge1xuICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZSA9IG5ldyBQcmVmYWJJbnN0YW5jZSgpO1xuICAgICAgICBwcmVmYWJJbnN0YW5jZS5maWxlSWQgPSB0aGlzLmdlbmVyYXRlVVVJRCgpO1xuXG4gICAgICAgIHJldHVybiBwcmVmYWJJbnN0YW5jZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlUHJlZmFiSW5mbyhmaWxlSWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbmV3IFByZWZhYkluZm8oKTtcbiAgICAgICAgcHJlZmFiSW5mby5maWxlSWQgPSBmaWxlSWQ7XG4gICAgICAgIHJldHVybiBwcmVmYWJJbmZvO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbG9uZUluc3RhbmNlV2l0aE5ld0ZpbGVJZChpbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgY29uc3QgbmV3SW5zdGFuY2UgPSB0aGlzLmNyZWF0ZVByZWZhYkluc3RhbmNlKCk7XG4gICAgICAgIC8vIOWkjeWItnByb3BlcnR5T3ZlcnJpZGVzXG4gICAgICAgIGNvbnN0IGNsb25lU291cmNlUHJvcE92ZXJyaWRlcyA9IGluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzO1xuICAgICAgICBuZXdJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsb25lU291cmNlUHJvcE92ZXJyaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2xvbmVTb3VyY2VQcm9wT3ZlcnJpZGUgPSBjbG9uZVNvdXJjZVByb3BPdmVycmlkZXNbaV07XG4gICAgICAgICAgICBjb25zdCBwcm9wT3ZlcnJpZGUgPSBuZXcgUHJvcGVydHlPdmVycmlkZUluZm8oKTtcbiAgICAgICAgICAgIHByb3BPdmVycmlkZS50YXJnZXRJbmZvID0gY2xvbmVTb3VyY2VQcm9wT3ZlcnJpZGUudGFyZ2V0SW5mbztcbiAgICAgICAgICAgIHByb3BPdmVycmlkZS5wcm9wZXJ0eVBhdGggPSBjbG9uZVNvdXJjZVByb3BPdmVycmlkZS5wcm9wZXJ0eVBhdGg7XG4gICAgICAgICAgICBwcm9wT3ZlcnJpZGUudmFsdWUgPSBjbG9uZVNvdXJjZVByb3BPdmVycmlkZS52YWx1ZTtcbiAgICAgICAgICAgIG5ld0luc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzLnB1c2gocHJvcE92ZXJyaWRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkjeWItm1vdW50ZWRDaGlsZHJlblxuICAgICAgICBjb25zdCBjbG9uZU1vdW50ZWRDaGlsZHJlbiA9IGluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbjtcbiAgICAgICAgbmV3SW5zdGFuY2UubW91bnRlZENoaWxkcmVuID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xvbmVNb3VudGVkQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNsb25lU291cmNlTW91bnRlZENoaWxkID0gY2xvbmVNb3VudGVkQ2hpbGRyZW5baV07XG4gICAgICAgICAgICBjb25zdCBtb3VudGVkQ2hpbGQgPSBuZXcgTW91bnRlZENoaWxkcmVuSW5mbygpO1xuICAgICAgICAgICAgbW91bnRlZENoaWxkLnRhcmdldEluZm8gPSBjbG9uZVNvdXJjZU1vdW50ZWRDaGlsZC50YXJnZXRJbmZvO1xuICAgICAgICAgICAgbW91bnRlZENoaWxkLm5vZGVzID0gY2xvbmVTb3VyY2VNb3VudGVkQ2hpbGQubm9kZXMuc2xpY2UoKTtcbiAgICAgICAgICAgIG5ld0luc3RhbmNlLm1vdW50ZWRDaGlsZHJlbi5wdXNoKG1vdW50ZWRDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpI3liLZtb3VudGVkQ29tcG9uZW50c1xuICAgICAgICBjb25zdCBjbG9uZU1vdW50ZWRDb21wb25lbnRzID0gaW5zdGFuY2UubW91bnRlZENvbXBvbmVudHM7XG4gICAgICAgIG5ld0luc3RhbmNlLm1vdW50ZWRDb21wb25lbnRzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xvbmVNb3VudGVkQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2xvbmVTb3VyY2VNb3VudGVkQ29tcCA9IGNsb25lTW91bnRlZENvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBjb25zdCBtb3VudGVkQ29tcCA9IG5ldyBNb3VudGVkQ29tcG9uZW50c0luZm8oKTtcbiAgICAgICAgICAgIG1vdW50ZWRDb21wLnRhcmdldEluZm8gPSBjbG9uZVNvdXJjZU1vdW50ZWRDb21wLnRhcmdldEluZm87XG4gICAgICAgICAgICBtb3VudGVkQ29tcC5jb21wb25lbnRzID0gY2xvbmVTb3VyY2VNb3VudGVkQ29tcC5jb21wb25lbnRzLnNsaWNlKCk7XG4gICAgICAgICAgICBuZXdJbnN0YW5jZS5tb3VudGVkQ29tcG9uZW50cy5wdXNoKG1vdW50ZWRDb21wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkjeWItnJlbW92ZWRDb21wb25lbnRzXG4gICAgICAgIG5ld0luc3RhbmNlLnJlbW92ZWRDb21wb25lbnRzID0gaW5zdGFuY2UucmVtb3ZlZENvbXBvbmVudHMuc2xpY2UoKTtcblxuICAgICAgICByZXR1cm4gbmV3SW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFByZWZhYkluc3RhbmNlUm9vdChub2RlOiBOb2RlKSB7XG4gICAgICAgIGxldCBwYXJlbnQ6IE5vZGUgfCBudWxsID0gbm9kZTtcbiAgICAgICAgbGV0IHJvb3Q6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgICAgICBpZiAocGFyZW50WydfcHJlZmFiJ10/Lmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgcm9vdCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcm9vdDtcbiAgICB9XG5cbiAgICBpc1NhbWVTb3VyY2VUYXJnZXRPdmVycmlkZSh0YXJnZXRPdmVycmlkZTogVGFyZ2V0T3ZlcnJpZGVJbmZvLCBzb3VyY2U6IENvbXBvbmVudCB8IE5vZGUsIHNvdXJjZUxvY2FsSUQ6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLCBwcm9wUGF0aDogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHRhcmdldE92ZXJyaWRlLnNvdXJjZSA9PT0gc291cmNlICYmXG4gICAgICAgICAgICAoKCFzb3VyY2VMb2NhbElEICYmICF0YXJnZXRPdmVycmlkZS5zb3VyY2VJbmZvKSB8fFxuICAgICAgICAgICAgICAgIGNvbXBhcmVTdHJpbmdBcnJheShzb3VyY2VMb2NhbElELCB0YXJnZXRPdmVycmlkZS5zb3VyY2VJbmZvPy5sb2NhbElEKSkgJiZcbiAgICAgICAgICAgIGNvbXBhcmVTdHJpbmdBcnJheSh0YXJnZXRPdmVycmlkZS5wcm9wZXJ0eVBhdGgsIHByb3BQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0U291cmNlRGF0YShzb3VyY2U6IENvbXBvbmVudCkge1xuICAgICAgICAvLyDlpoLmnpxzb3VyY2XmmK/kuIDkuKrmma7pgJroioLngrnkuIvnmoRDb21wb25lbnTvvIzpgqPnm7TmjqXmjIflkJHlroPlsLHlj6/ku6VcbiAgICAgICAgLy8g5aaC5p6cc291cmNl5piv5LiA5LiqbW91bnRlZENvbXBvbmVudO+8jOebtOaOpeaMh+WQkeWug+WwseWPr+S7pVxuICAgICAgICAvLyDlpoLmnpxzb3VyY2XmmK/kuIDkuKpQcmVmYWLoioLngrnkuIvnmoTpnZ5tb3VudGVk55qEQ29tcG9uZW5077yM6YKj5bCx6ZyA6KaB6YCa6L+HW+agueiKgueCuStMb2NhbElEXeeahOaWueW8j+adpee0ouW8leOAglxuICAgICAgICBsZXQgc291cmNlVGFyZ2V0OiBDb21wb25lbnQgfCBOb2RlID0gc291cmNlO1xuICAgICAgICBsZXQgc291cmNlTG9jYWxJRDtcbiAgICAgICAgY29uc3Qgc291cmNlTm9kZSA9IHNvdXJjZS5ub2RlO1xuICAgICAgICBpZiAoIXNvdXJjZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoc291cmNlTm9kZVsnX3ByZWZhYiddICYmICF0aGlzLmlzTW91bnRlZENvbXBvbmVudChzb3VyY2UpKSB7XG4gICAgICAgICAgICAvLyDlkJHkuIrmn6Xmib5QcmVmYWJJbnN0YW5jZei3r+W+hFxuICAgICAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHRoaXMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhzb3VyY2VOb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUgfCBudWxsID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuXG4gICAgICAgICAgICBpZiAob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgICAgIHNvdXJjZVRhcmdldCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU7XG4gICAgICAgICAgICAgICAgc291cmNlTG9jYWxJRCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8udGFyZ2V0UGF0aDtcbiAgICAgICAgICAgICAgICBzb3VyY2VMb2NhbElELnNwbGljZSgwLCAxKTsgLy8g5LiN6ZyA6KaB5a2Y5pyA5aSW5bGC55qEUHJlZmFiSW5zdGFuY2XnmoRmaWxlSURcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLl9fcHJlZmFiPy5maWxlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlTG9jYWxJRC5wdXNoKHNvdXJjZS5fX3ByZWZhYj8uZmlsZUlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjYW4ndCBnZXQgZmlsZUlkIG9mIGNvbXBvbmVudDogJHtzb3VyY2UubmFtZX0gaW4gbm9kZTogJHtzb3VyY2Uubm9kZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc291cmNlVGFyZ2V0LCBzb3VyY2VMb2NhbElEIH07XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVRhcmdldE92ZXJyaWRlQnlTb3VyY2UocHJlZmFiSW5mbzogUHJlZmFiSW5mbyB8IHVuZGVmaW5lZCwgc291cmNlOiBOb2RlIHwgQ29tcG9uZW50KSB7XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvLnRhcmdldE92ZXJyaWRlcykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGlzQW55UmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gcHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE92ZXJyaWRlSXRyID0gcHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXNbaV07XG4gICAgICAgICAgICBpZiAodGFyZ2V0T3ZlcnJpZGVJdHIuc291cmNlID09PSBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLnRhcmdldE92ZXJyaWRlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgaXNBbnlSZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0FueVJlbW92ZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVRhcmdldE92ZXJyaWRlKHByZWZhYkluZm86IFByZWZhYkluZm8gfCB1bmRlZmluZWQgfCBudWxsLCBzb3VyY2U6IENvbXBvbmVudCwgcHJvcFBhdGg6IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvLnRhcmdldE92ZXJyaWRlcykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc291cmNlRGF0YSA9IHRoaXMuZ2V0U291cmNlRGF0YShzb3VyY2UpO1xuICAgICAgICBpZiAoIXNvdXJjZURhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNvdXJjZVRhcmdldDogQ29tcG9uZW50IHwgTm9kZSA9IHNvdXJjZURhdGEuc291cmNlVGFyZ2V0O1xuICAgICAgICBjb25zdCBzb3VyY2VMb2NhbElEID0gc291cmNlRGF0YS5zb3VyY2VMb2NhbElEO1xuXG4gICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRPdmVycmlkZUl0ciA9IHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTYW1lU291cmNlVGFyZ2V0T3ZlcnJpZGUodGFyZ2V0T3ZlcnJpZGVJdHIsIHNvdXJjZVRhcmdldCwgc291cmNlTG9jYWxJRCwgcHJvcFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBpc0luVGFyZ2V0T3ZlcnJpZGVzKHRhcmdldE92ZXJyaWRlczogVGFyZ2V0T3ZlcnJpZGVJbmZvW10sIHNvdXJjZTogQ29tcG9uZW50LCBwcm9wUGF0aDogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3Qgc291cmNlRGF0YSA9IHRoaXMuZ2V0U291cmNlRGF0YShzb3VyY2UpO1xuICAgICAgICBpZiAoIXNvdXJjZURhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNvdXJjZVRhcmdldDogQ29tcG9uZW50IHwgTm9kZSA9IHNvdXJjZURhdGEuc291cmNlVGFyZ2V0O1xuICAgICAgICBjb25zdCBzb3VyY2VMb2NhbElEID0gc291cmNlRGF0YS5zb3VyY2VMb2NhbElEO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0T3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRPdmVycmlkZUl0ciA9IHRhcmdldE92ZXJyaWRlc1tpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzU2FtZVNvdXJjZVRhcmdldE92ZXJyaWRlKHRhcmdldE92ZXJyaWRlSXRyLCBzb3VyY2VUYXJnZXQsIHNvdXJjZUxvY2FsSUQsIHByb3BQYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUYXJnZXRPdmVycmlkZShwcmVmYWJJbmZvOiBQcmVmYWJJbmZvLCBzb3VyY2U6IENvbXBvbmVudCwgcHJvcFBhdGg6IHN0cmluZ1tdKSB7XG4gICAgICAgIGxldCB0YXJnZXRPdmVycmlkZTogVGFyZ2V0T3ZlcnJpZGVJbmZvIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGlmICghcHJlZmFiSW5mby50YXJnZXRPdmVycmlkZXMpIHtcbiAgICAgICAgICAgIHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3VyY2VEYXRhID0gdGhpcy5nZXRTb3VyY2VEYXRhKHNvdXJjZSk7XG4gICAgICAgIGlmICghc291cmNlRGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3VyY2VUYXJnZXQ6IENvbXBvbmVudCB8IE5vZGUgPSBzb3VyY2VEYXRhLnNvdXJjZVRhcmdldDtcbiAgICAgICAgY29uc3Qgc291cmNlTG9jYWxJRCA9IHNvdXJjZURhdGEuc291cmNlTG9jYWxJRDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRPdmVycmlkZUl0ciA9IHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTYW1lU291cmNlVGFyZ2V0T3ZlcnJpZGUodGFyZ2V0T3ZlcnJpZGVJdHIsIHNvdXJjZVRhcmdldCwgc291cmNlTG9jYWxJRCwgcHJvcFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0T3ZlcnJpZGUgPSB0YXJnZXRPdmVycmlkZUl0cjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGFyZ2V0T3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIHRhcmdldE92ZXJyaWRlID0gbmV3IFRhcmdldE92ZXJyaWRlSW5mbygpO1xuICAgICAgICAgICAgdGFyZ2V0T3ZlcnJpZGUuc291cmNlID0gc291cmNlVGFyZ2V0O1xuICAgICAgICAgICAgaWYgKHNvdXJjZUxvY2FsSUQpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRPdmVycmlkZS5zb3VyY2VJbmZvID0gbmV3IFRhcmdldEluZm8oKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRPdmVycmlkZS5zb3VyY2VJbmZvLmxvY2FsSUQgPSBzb3VyY2VMb2NhbElEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFyZ2V0T3ZlcnJpZGUucHJvcGVydHlQYXRoID0gcHJvcFBhdGg7XG4gICAgICAgICAgICBwcmVmYWJJbmZvLnRhcmdldE92ZXJyaWRlcy5wdXNoKHRhcmdldE92ZXJyaWRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXRPdmVycmlkZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJvcGVydHlPdmVycmlkZXNPZlRhcmdldChwcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UsIGxvY2FsSUQ6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IHByb3BPdmVycmlkZXM6IFByb3BlcnR5T3ZlcnJpZGVJbmZvW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcHJvcE92ZXJyaWRlSXRyID0gcHJlZmFiSW5zdGFuY2UucHJvcGVydHlPdmVycmlkZXNbaV07XG4gICAgICAgICAgICBpZiAoY29tcGFyZVN0cmluZ0FycmF5KHByb3BPdmVycmlkZUl0ci50YXJnZXRJbmZvPy5sb2NhbElELCBsb2NhbElEKSkge1xuICAgICAgICAgICAgICAgIHByb3BPdmVycmlkZXMucHVzaChwcm9wT3ZlcnJpZGVJdHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb3BPdmVycmlkZXM7XG4gICAgfVxuXG4gICAgcHVibGljIGlzSW5Qcm9wZXJ0eU92ZXJyaWRlcyhwcm9wUGF0aDogc3RyaW5nW10sIHByb3BlcnR5T3ZlcnJpZGVzOiBQcm9wZXJ0eU92ZXJyaWRlSW5mb1tdKTogYm9vbGVhbiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcGVydHlPdmVycmlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BPdmVycmlkZUl0ciA9IHByb3BlcnR5T3ZlcnJpZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmVTdHJpbmdBcnJheShwcm9wT3ZlcnJpZGVJdHIucHJvcGVydHlQYXRoLCBwcm9wUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJvcGVydHlPdmVycmlkZShwcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UsIGxvY2FsSUQ6IHN0cmluZ1tdLCBwcm9wUGF0aDogc3RyaW5nW10pIHtcbiAgICAgICAgbGV0IHByb3BPdmVycmlkZTogUHJvcGVydHlPdmVycmlkZUluZm8gfCBudWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHRhcmdldEluZm86IFRhcmdldEluZm8gfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcHJvcE92ZXJyaWRlSXRyID0gcHJlZmFiSW5zdGFuY2UucHJvcGVydHlPdmVycmlkZXNbaV07XG4gICAgICAgICAgICBpZiAoY29tcGFyZVN0cmluZ0FycmF5KHByb3BPdmVycmlkZUl0ci50YXJnZXRJbmZvPy5sb2NhbElELCBsb2NhbElEKSkge1xuICAgICAgICAgICAgICAgIC8vIOWkjeeUqOW3suacieeahHRhcmdldEluZm/vvIzlh4/lsJHmlbDmja7lhpfkvZlcbiAgICAgICAgICAgICAgICB0YXJnZXRJbmZvID0gcHJvcE92ZXJyaWRlSXRyLnRhcmdldEluZm87XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBhcmVTdHJpbmdBcnJheShwcm9wT3ZlcnJpZGVJdHIucHJvcGVydHlQYXRoLCBwcm9wUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcE92ZXJyaWRlID0gcHJvcE92ZXJyaWRlSXRyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByb3BPdmVycmlkZSkge1xuICAgICAgICAgICAgcHJvcE92ZXJyaWRlID0gbmV3IFByb3BlcnR5T3ZlcnJpZGVJbmZvKCk7XG5cbiAgICAgICAgICAgIGlmICghdGFyZ2V0SW5mbykge1xuICAgICAgICAgICAgICAgIHRhcmdldEluZm8gPSBuZXcgVGFyZ2V0SW5mbygpO1xuICAgICAgICAgICAgICAgIHRhcmdldEluZm8ubG9jYWxJRCA9IGxvY2FsSUQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb3BPdmVycmlkZS50YXJnZXRJbmZvID0gdGFyZ2V0SW5mbztcbiAgICAgICAgICAgIHByb3BPdmVycmlkZS5wcm9wZXJ0eVBhdGggPSBwcm9wUGF0aDtcbiAgICAgICAgICAgIHByZWZhYkluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzLnB1c2gocHJvcE92ZXJyaWRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9wT3ZlcnJpZGU7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVByb3BlcnR5T3ZlcnJpZGUocHJlZmFiSW5zdGFuY2U6IFByZWZhYkluc3RhbmNlLCBsb2NhbElEOiBzdHJpbmdbXSwgcHJvcFBhdGg6IHN0cmluZ1tdKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgcHJvcE92ZXJyaWRlSXRyID0gcHJlZmFiSW5zdGFuY2UucHJvcGVydHlPdmVycmlkZXNbaV07XG4gICAgICAgICAgICBpZiAoY29tcGFyZVN0cmluZ0FycmF5KHByb3BPdmVycmlkZUl0ci50YXJnZXRJbmZvPy5sb2NhbElELCBsb2NhbElEKSAmJlxuICAgICAgICAgICAgICAgIGNvbXBhcmVTdHJpbmdBcnJheShwcm9wT3ZlcnJpZGVJdHIucHJvcGVydHlQYXRoLCBwcm9wUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBwcmVmYWJJbnN0YW5jZS5wcm9wZXJ0eU92ZXJyaWRlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZmluZFByZWZhYkluc3RhbmNlTW91bnRlZENoaWxkcmVuKHByZWZhYkluc3RhbmNlOiBQcmVmYWJJbnN0YW5jZSwgbG9jYWxJRDogc3RyaW5nW10pIHtcbiAgICAgICAgbGV0IG1vdW50ZWRDaGlsZCA9IG51bGw7XG4gICAgICAgIGNvbnN0IG1vdW50ZWRDaGlsZHJlbiA9IHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3VudGVkQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkSW5mbyA9IG1vdW50ZWRDaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChjaGlsZEluZm8uaXNUYXJnZXQobG9jYWxJRCkpIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkQ2hpbGQgPSBjaGlsZEluZm87XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbW91bnRlZENoaWxkO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVNb3VudGVkQ2hpbGRyZW5JbmZvKGxvY2FsSUQ6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldEluZm8gPSBuZXcgVGFyZ2V0SW5mbygpO1xuICAgICAgICB0YXJnZXRJbmZvLmxvY2FsSUQgPSBsb2NhbElEO1xuICAgICAgICBjb25zdCBtb3VudGVkQ2hpbGRJbmZvID0gbmV3IE1vdW50ZWRDaGlsZHJlbkluZm8oKTtcbiAgICAgICAgbW91bnRlZENoaWxkSW5mby50YXJnZXRJbmZvID0gdGFyZ2V0SW5mbztcblxuICAgICAgICByZXR1cm4gbW91bnRlZENoaWxkSW5mbztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJlZmFiSW5zdGFuY2VNb3VudGVkQ2hpbGRyZW4ocHJlZmFiSW5zdGFuY2U6IFByZWZhYkluc3RhbmNlLCBsb2NhbElEOiBzdHJpbmdbXSkge1xuICAgICAgICBsZXQgbW91bnRlZENoaWxkID0gdGhpcy5maW5kUHJlZmFiSW5zdGFuY2VNb3VudGVkQ2hpbGRyZW4ocHJlZmFiSW5zdGFuY2UsIGxvY2FsSUQpO1xuXG4gICAgICAgIGlmICghbW91bnRlZENoaWxkKSB7XG4gICAgICAgICAgICBtb3VudGVkQ2hpbGQgPSB0aGlzLmNyZWF0ZU1vdW50ZWRDaGlsZHJlbkluZm8obG9jYWxJRCk7XG4gICAgICAgICAgICBwcmVmYWJJbnN0YW5jZS5tb3VudGVkQ2hpbGRyZW4ucHVzaChtb3VudGVkQ2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1vdW50ZWRDaGlsZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJlZmFiSW5zdGFuY2VNb3VudGVkQ29tcG9uZW50cyhwcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UsIGxvY2FsSUQ6IHN0cmluZ1tdKSB7XG4gICAgICAgIGxldCBtb3VudGVkQ29tcG9uZW50c0luZm8gPSBudWxsO1xuICAgICAgICBjb25zdCBtb3VudGVkQ29tcG9uZW50cyA9IHByZWZhYkluc3RhbmNlLm1vdW50ZWRDb21wb25lbnRzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vdW50ZWRDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRzSW5mbyA9IG1vdW50ZWRDb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHNJbmZvLmlzVGFyZ2V0KGxvY2FsSUQpKSB7XG4gICAgICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHNJbmZvID0gY29tcG9uZW50c0luZm87XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW1vdW50ZWRDb21wb25lbnRzSW5mbykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0SW5mbyA9IG5ldyBUYXJnZXRJbmZvKCk7XG4gICAgICAgICAgICB0YXJnZXRJbmZvLmxvY2FsSUQgPSBsb2NhbElEO1xuICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHNJbmZvID0gbmV3IE1vdW50ZWRDb21wb25lbnRzSW5mbygpO1xuICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHNJbmZvLnRhcmdldEluZm8gPSB0YXJnZXRJbmZvO1xuICAgICAgICAgICAgcHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHMucHVzaChtb3VudGVkQ29tcG9uZW50c0luZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1vdW50ZWRDb21wb25lbnRzSW5mbztcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkUmVtb3ZlZENvbXBvbmVudChwcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UsIGxvY2FsSUQ6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IHJlbW92ZWRDb21wb25lbnRzID0gcHJlZmFiSW5zdGFuY2UucmVtb3ZlZENvbXBvbmVudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtb3ZlZENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEluZm8gPSByZW1vdmVkQ29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChjb21wYXJlU3RyaW5nQXJyYXkodGFyZ2V0SW5mby5sb2NhbElELCBsb2NhbElEKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldEluZm8gPSBuZXcgVGFyZ2V0SW5mbygpO1xuICAgICAgICB0YXJnZXRJbmZvLmxvY2FsSUQgPSBsb2NhbElEO1xuICAgICAgICByZW1vdmVkQ29tcG9uZW50cy5wdXNoKHRhcmdldEluZm8pO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGVSZW1vdmVkQ29tcG9uZW50KHByZWZhYkluc3RhbmNlOiBQcmVmYWJJbnN0YW5jZSwgbG9jYWxJRDogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgcmVtb3ZlZENvbXBvbmVudHMgPSBwcmVmYWJJbnN0YW5jZS5yZW1vdmVkQ29tcG9uZW50cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW1vdmVkQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0SW5mbyA9IHJlbW92ZWRDb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmVTdHJpbmdBcnJheSh0YXJnZXRJbmZvLmxvY2FsSUQsIGxvY2FsSUQpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlZENvbXBvbmVudHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hldGhlciB0aGUgbm9kZSBpcyBjaGlsZCBvZiBhIHByZWZhYlxuICAgICAqIEBwYXJhbSBub2RlIG5vZGVcbiAgICAgKi9cbiAgICBwdWJsaWMgaXNDaGlsZE9mUHJlZmFiSW5zdGFuY2Uobm9kZTogTm9kZSkge1xuICAgICAgICBsZXQgcGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgIGxldCBoYXNQcmVmYWJSb290SW5QYXJlbnQgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZTogcHJpdmF0ZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgICAgICBpZiAocGFyZW50WydfcHJlZmFiJ10/Lmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgaGFzUHJlZmFiUm9vdEluUGFyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGFzUHJlZmFiUm9vdEluUGFyZW50O1xuICAgIH1cblxuICAgIHB1YmxpYyBpc1ByZWZhYkluc3RhbmNlUm9vdChub2RlOiBOb2RlKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmU6IHByaXZhdGUgbWVtYmVyIGFjY2Vzc1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuXG4gICAgICAgIGlmICghcHJlZmFiSW5mbyB8fCAhcHJlZmFiSW5mby5pbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZTogcHJpdmF0ZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgIGlmICghcHJlZmFiSW5mby5pbnN0YW5jZS5wcmVmYWJSb290Tm9kZSB8fCAhcHJlZmFiSW5mby5pbnN0YW5jZS5wcmVmYWJSb290Tm9kZVsnX3ByZWZhYiddPy5pbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGlzQ2hpbGRPZlByZWZhYkFzc2V0KG5vZGU6IE5vZGUpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZTogcHJpdmF0ZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG5cbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudDtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmU6IHByaXZhdGUgbWVtYmVyIGFjY2Vzc1xuICAgICAgICBjb25zdCBwYXJlbnRQcmVmYWJJbmZvID0gcGFyZW50WydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcGFyZW50UHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZWZhYkluZm8ucm9vdCA9PT0gcGFyZW50UHJlZmFiSW5mby5yb290KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeUqOS6juW1jOWll+eahHByZWZhYuWIpOaWrVxuICAgICAgICBpZiAocHJlZmFiSW5mby5pbnN0YW5jZT8ucHJlZmFiUm9vdE5vZGUgPT09IHBhcmVudFByZWZhYkluZm8ucm9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGlzUGFydE9mUHJlZmFiQXNzZXQobm9kZTogTm9kZSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlOiBwcml2YXRlIG1lbWJlciBhY2Nlc3NcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5mbyA9IHRoaXMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhub2RlKTtcbiAgICAgICAgaWYgKHByZWZhYkluZm8gJiYgb3V0TW9zdFByZWZhYkluZm8ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNNb3VudGVkQ2hpbGRPZihvdXRNb3N0UHJlZmFiSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlLCBub2RlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hldGhlciB0aGUgbm9kZSBpcyBwYXJ0IG9mIGEgcHJlZmFiLFxuICAgICAqIHJvb3Qgb2YgcHJlZmFiIGlzIGFsc28gcGFydCBvZiBwcmVmYWJcbiAgICAgKiBAcGFyYW0gbm9kZSBub2RlXG4gICAgICovXG4gICAgcHVibGljIGlzUGFydE9mUHJlZmFiSW5zdGFuY2Uobm9kZTogTm9kZSkge1xuICAgICAgICBsZXQgcGFyZW50OiBOb2RlIHwgbnVsbCA9IG5vZGU7XG4gICAgICAgIGxldCBoYXNQcmVmYWJSb290SW5QYXJlbnQgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZTogcHJpdmF0ZSBtZW1iZXIgYWNjZXNzXG4gICAgICAgICAgICBpZiAocGFyZW50WydfcHJlZmFiJ10/Lmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgaGFzUHJlZmFiUm9vdEluUGFyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGFzUHJlZmFiUm9vdEluUGFyZW50O1xuICAgIH1cblxuICAgIHB1YmxpYyBpc1BhcnRPZkFzc2V0SW5QcmVmYWJJbnN0YW5jZShub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IGlzUGFydE9mSW5zdGFuY2UgPSB0aGlzLmlzUGFydE9mUHJlZmFiSW5zdGFuY2Uobm9kZSk7XG4gICAgICAgIGlmICghaXNQYXJ0T2ZJbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNQYXJ0T2ZBc3NldCA9IHRoaXMuaXNQYXJ0T2ZQcmVmYWJBc3NldChub2RlKTtcbiAgICAgICAgcmV0dXJuIGlzUGFydE9mQXNzZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6ZyA6KaB6ICD6JmR5b6I5aSa56eN5bWM5aWX5oOF5Ya1LOmcgOimgeazqOaEj21vdW50ZWRDaGlsZOS4iuWPiOaMguWFtuWug3ByZWZhYueahOmXrumimFxuICAgICAqIDEuIHByZWZhYkEtPm5vZGUuLi5cbiAgICAgKiAyLiBwcmVmYWJBLT5tb3V0ZWROb2RlLT5wcmVmYWJCLT5ub2RlXG4gICAgICogMy4gcHJlZmFiQS0+bW91dGVkUHJlZmFiQi0+bm9kZVxuICAgICAqIDQuIHByZWZhYkEtPm1vdXRlZFByZWZhYkItPnByZWZhYkMtPm5vZGVcbiAgICAgKiA1LiBwcmVmYWJBLT5wcmVmYWJCLT5ub2RlXG4gICAgICogQHBhcmFtIG5vZGVcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHB1YmxpYyBnZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgbGV0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgbGV0IG5vZGVJdGVyOiBOb2RlIHwgbnVsbCA9IG5vZGU7XG5cbiAgICAgICAgd2hpbGUgKG5vZGVJdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZTogUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZSB8IHVuZGVmaW5lZCA9IG5vZGVJdGVyWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuICAgICAgICAgICAgLy8g5ZCR5LiK5p+l5om+5Yiw56ys5LiA5Liq6aKE5Yi25L2T5a6e5L6L6IqC54K577yM5Yik5pat5pS55a6e5L6L5piv5ZCm5pyJcHJlZmFiUm9vdE5vZGUo5bWM5aWX6aKE5Yi25L2TKVxuICAgICAgICAgICAgLy8g5b2T6aKE5Yi25L2T5a6e5L6L5LiN5a2Y5ZyocHJlZmFiUm9vdE5vZGXml7Ys5oiW6ICFcHJlZmFiUm9vdE5vZGXmjIflkJHkuoblvZPliY3moLnoioLngrnml7bvvIzor7TmmI7mib7liLDkuobmnIDlpJblsYLpooTliLbkvZPlrp7kvotcbiAgICAgICAgICAgIGlmIChwcmVmYWJJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFBhdGgudW5zaGlmdChwcmVmYWJJbnN0YW5jZS5maWxlSWQpO1xuICAgICAgICAgICAgICAgIG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgPSBub2RlSXRlcjtcbiAgICAgICAgICAgICAgICAvLyDpnZ7ltYzlpZfpooTliLbkvZPvvIznm7TmjqXov5Tlm55cbiAgICAgICAgICAgICAgICBpZiAoIXByZWZhYkluc3RhbmNlLnByZWZhYlJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJSb290ID0gcHJlZmFiSW5zdGFuY2UucHJlZmFiUm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpIGFzIE5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKHByZWZhYlJvb3QgJiYgcm9vdE5vZGUgJiYgaXNTYW1lTm9kZShwcmVmYWJSb290LCByb290Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5piv5bWM5aWX6aKE5Yi25L2T77yM55u05o6l5LuOcHJlZmFiUm9vdE5vZGXlvIDlp4vnu6fnu63mn6Xmib5cbiAgICAgICAgICAgICAgICAgICAgLy8g6ZyA6KaB5oqK6IqC54K55qCR5Lit55qEcHJlZmFiSW5zdGFuY2XnmoRmaWxlSWTliqDlhaXliLB0YXJnZXRQYXRo5Lit77yM5Zug5Li6Z2V0VGFyZ2V0TWFw55qE55Sf5oiQ5piv5oyJ54Wn6IqC54K55qCR55Sf5oiQ55qEXG4gICAgICAgICAgICAgICAgICAgIHB1c2hOZXN0ZWRQcmVmYWIobm9kZUl0ZXIsIHByZWZhYkluc3RhbmNlLnByZWZhYlJvb3ROb2RlLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g6YG/5YWN5q275b6q546vXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlSXRlciAhPT0gcHJlZmFiSW5zdGFuY2UucHJlZmFiUm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJdGVyID0gcHJlZmFiSW5zdGFuY2UucHJlZmFiUm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2dldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8gZmFpbGVkOiBwcmVmYWIgaW5zdGFuY2Ugcm9vdCBub2RlIGhhcyBsb29wJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlSXRlciA9IG5vZGVJdGVyLnBhcmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUsIHRhcmdldFBhdGggfTtcbiAgICB9XG5cbiAgICBpc1NjZW5lTm9kZShub2RlOiBOb2RlKSB7XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgU2NlbmUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaYr+WQpuaYr+W1jOWll+eahOmihOWItuS9k1xuICAgICAqIEBwYXJhbSBub2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIGlzTmVzdGVkUHJlZmFiKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgcHJlZmFiID0gbm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBjb25zdCBhc3NldFV1aWQgPSBwcmVmYWI/LmFzc2V0Py51dWlkO1xuICAgICAgICBpZiAoIXByZWZhYiB8fCAhYXNzZXRVdWlkKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgbGV0IHBhcmVudCA9IG5vZGUucGFyZW50O1xuICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAvLyDlkJHkuIrpgY3ljobliLDlnLrmma9cbiAgICAgICAgICAgIGlmIChwYXJlbnQgPT09IHBhcmVudC5zY2VuZSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGFyZW50UHJlZmFiSW5mbyA9IHBhcmVudFsnX3ByZWZhYiddO1xuICAgICAgICAgICAgaWYgKHBhcmVudFByZWZhYkluZm8gJiYgYXNzZXRVdWlkICE9PSBwYXJlbnRQcmVmYWJJbmZvLmFzc2V0Py51dWlkKSB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5qOA5p+l55qE6IqC54K55piv6aKE5Yi25L2T5qC56IqC54K55bCx55u05o6lIHRydWVcbiAgICAgICAgICAgICAgICBpZiAocHJlZmFiLmluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc05lc3RlZCA9IHRoaXMuaXNOZXN0ZWRQcmVmYWIocGFyZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTmVzdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcmVmYWJTdGF0ZUluZm8obm9kZTogTm9kZSkge1xuICAgICAgICBsZXQgcHJlZmFiU3RhdGUgPSBQcmVmYWJTdGF0ZS5Ob3RBUHJlZmFiO1xuICAgICAgICBsZXQgaXNVbndyYXBwYWJsZSA9IGZhbHNlO1xuICAgICAgICBsZXQgaXNSZXZlcnRhYmxlID0gZmFsc2U7XG4gICAgICAgIGxldCBpc0FwcGxpY2FibGUgPSBmYWxzZTtcbiAgICAgICAgbGV0IGlzQWRkZWRDaGlsZCA9IGZhbHNlO1xuICAgICAgICBsZXQgaXNOZXN0ZWQgPSBmYWxzZTtcbiAgICAgICAgbGV0IGFzc2V0VXVpZCA9ICcnO1xuXG4gICAgICAgIGlmICh0aGlzLmlzU2NlbmVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogcHJlZmFiU3RhdGUsIGlzVW53cmFwcGFibGUsIGlzUmV2ZXJ0YWJsZSwgaXNBcHBsaWNhYmxlLCBpc0FkZGVkQ2hpbGQsIGlzTmVzdGVkLCBhc3NldFV1aWQgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKG5vZGVbJ19wcmVmYWInXSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKG5vZGVbJ19wcmVmYWInXS5hc3NldCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQgPSBub2RlWydfcHJlZmFiJ10uYXNzZXQuX3V1aWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkluc3RhbmNlID0gbm9kZVsnX3ByZWZhYiddLmluc3RhbmNlO1xuXG4gICAgICAgICAgICBpZiAocHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBpc1Vud3JhcHBhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpc1JldmVydGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlzQXBwbGljYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJlZmFiU3RhdGUgPSBQcmVmYWJTdGF0ZS5QcmVmYWJJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgfSA9IHRoaXMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSAhPT0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpc1Vud3JhcHBhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlzUmV2ZXJ0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpc0FwcGxpY2FibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZWZhYlN0YXRlID0gUHJlZmFiU3RhdGUuUHJlZmFiQ2hpbGQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaYr+W1jOWllyBwcmVmYWJcbiAgICAgICAgICAgIGlzTmVzdGVkID0gdGhpcy5pc05lc3RlZFByZWZhYihub2RlKTtcblxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKCFub2RlWydfcHJlZmFiJ10uYXNzZXQgfHwgbm9kZVsnX3ByZWZhYiddLmFzc2V0LmlzRGVmYXVsdCB8fCBub2RlWydfcHJlZmFiJ10uYXNzZXQudXVpZCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICBwcmVmYWJTdGF0ZSA9IFByZWZhYlN0YXRlLlByZWZhYkxvc3RBc3NldDtcbiAgICAgICAgICAgICAgICAvLyDotYTmupDkuKLlpLHml7bopoHlhYHorrh1bmxpbmtcbiAgICAgICAgICAgICAgICBpc1Vud3JhcHBhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNTdWJBc3NldChhc3NldFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgaXNBcHBsaWNhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5wYXJlbnQgJiYgIXRoaXMuaXNTY2VuZU5vZGUobm9kZS5wYXJlbnQpKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQcmVmYWJJbmZvID0gbm9kZS5wYXJlbnRbJ19wcmVmYWInXTtcbiAgICAgICAgICAgIGlmIChwYXJlbnRQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHRoaXMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhub2RlLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8gJiYgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTW91bnRlZENoaWxkT2Yob3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlLCBub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNBZGRlZENoaWxkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IHByZWZhYlN0YXRlLCBpc1Vud3JhcHBhYmxlLCBpc1JldmVydGFibGUsIGlzQXBwbGljYWJsZSwgaXNBZGRlZENoaWxkLCBpc05lc3RlZCwgYXNzZXRVdWlkIH07XG4gICAgfVxuXG4gICAgcHVibGljIGdldE1vdW50ZWRSb290KG5vZGVPckNvbXA6IE5vZGUgfCBDb21wb25lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVPckNvbXBbZWRpdG9yRXh0cmFzVGFnXT8ubW91bnRlZFJvb3Q7XG4gICAgfVxuXG4gICAgcHVibGljIHNldE1vdW50ZWRSb290KG5vZGVPckNvbXA6IE5vZGUgfCBDb21wb25lbnQsIG1vdW50ZWRSb290OiBOb2RlIHwgdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghbm9kZU9yQ29tcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFub2RlT3JDb21wW2VkaXRvckV4dHJhc1RhZ10pIHtcbiAgICAgICAgICAgIG5vZGVPckNvbXBbZWRpdG9yRXh0cmFzVGFnXSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIG5vZGVPckNvbXBbZWRpdG9yRXh0cmFzVGFnXS5tb3VudGVkUm9vdCA9IG1vdW50ZWRSb290O1xuICAgIH1cblxuICAgIC8vIOW+heS8mOWMlu+8jOi/memHjOimgeaYr+WinuWKoOeahOiKgueCueWkmuS6huS8muavlOi+g+i0ueaXtlxuICAgIHByaXZhdGUgaXNNb3VudGVkQ2hpbGRPZihwcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUsIG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgbW91bnRlZFJvb3QgPSB0aGlzLmdldE1vdW50ZWRSb290KG5vZGUpO1xuICAgICAgICBpZiAobW91bnRlZFJvb3QgJiYgbW91bnRlZFJvb3QgPT09IHByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGlzTW91bnRlZENvbXBvbmVudChjb21wb25lbnQ6IENvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBub2RlID0gY29tcG9uZW50Lm5vZGU7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvID0gdGhpcy5nZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKG5vZGUpO1xuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlOiBOb2RlIHwgbnVsbCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtb3VudGVkUm9vdCA9IHRoaXMuZ2V0TW91bnRlZFJvb3QoY29tcG9uZW50KTtcblxuICAgICAgICBpZiAobW91bnRlZFJvb3QgJiYgbW91bnRlZFJvb3QgPT09IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRSZW1vdmVkQ29tcG9uZW50cyhub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHJlbW92ZWRDb21wczogQ29tcG9uZW50W10gPSBbXTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiByZW1vdmVkQ29tcHM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvID0gdGhpcy5nZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKG5vZGUpO1xuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlOiBOb2RlIHwgbnVsbCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlZENvbXBzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldFBhdGg6IHN0cmluZ1tdID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby50YXJnZXRQYXRoO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZTogUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZSB8IHVuZGVmaW5lZCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGVbJ19wcmVmYWInXT8uaW5zdGFuY2U7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5mbyA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZSAmJiBvdXRNb3N0UHJlZmFiSW5mbyAmJiBvdXRNb3N0UHJlZmFiSW5mby5hc3NldCkge1xuXG4gICAgICAgICAgICBpZiAob3V0TW9zdFByZWZhYkluc3RhbmNlLnJlbW92ZWRDb21wb25lbnRzLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZWRDb21wcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFyZ2V0UGF0aC5zcGxpY2UoMCwgMSk7XG4gICAgICAgICAgICB0YXJnZXRQYXRoLnB1c2gocHJlZmFiSW5mby5maWxlSWQpO1xuXG4gICAgICAgICAgICBjb25zdCBhc3NldFJvb3ROb2RlID0gdGhpcy5nZXRQcmVmYWJBc3NldE5vZGVJbnN0YW5jZShvdXRNb3N0UHJlZmFiSW5mbyk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0Um9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlZENvbXBzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhc3NldE5vZGUgPSB0aGlzLmdldFRhcmdldCh0YXJnZXRQYXRoLCBhc3NldFJvb3ROb2RlLCB0cnVlKSBhcyBOb2RlO1xuICAgICAgICAgICAgaWYgKCFhc3NldE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlZENvbXBzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjdXJDb21wRmlsZUlEcyA9IG5vZGUuY29tcG9uZW50cy5tYXAoKGNvbXApID0+IGNvbXAuX19wcmVmYWI/LmZpbGVJZCkuZmlsdGVyKChpZCkgPT4gISFpZCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0Q29tcCBvZiBhc3NldE5vZGUuY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChhc3NldENvbXAuX19wcmVmYWIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJDb21wRmlsZUlEcy5pbmNsdWRlcyhhc3NldENvbXAuX19wcmVmYWIuZmlsZUlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZENvbXBzLnB1c2goYXNzZXRDb21wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZW1vdmVkQ29tcHM7XG4gICAgfVxuXG4gICAgcHVibGljIGNoZWNrVG9SZW1vdmVUYXJnZXRPdmVycmlkZShzb3VyY2U6IE5vZGUgfCBDb21wb25lbnQsIHJvb3Q6IE5vZGUgfCBTY2VuZSB8IG51bGwpIHtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAodGhpcy5yZW1vdmVUYXJnZXRPdmVycmlkZUJ5U291cmNlKHJvb3RbJ19wcmVmYWInXSwgc291cmNlKSkge1xuICAgICAgICAgICAgdGhpcy5maXJlQ2hhbmdlTXNnKHJvb3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGZpbmRPdXRtb3N0UHJlZmFiSW5zdGFuY2VOb2Rlcyhub2RlOiBOb2RlIHwgbnVsbCwgaW5zdGFuY2VSb290czogTm9kZVtdKSB7XG4gICAgICAgIGlmICghbm9kZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG5cbiAgICAgICAgaWYgKHByZWZhYkluZm8/Lmluc3RhbmNlKSB7XG4gICAgICAgICAgICAvLyDpgYfliLDpooTliLbkvZPml7bvvIzopoHlr7ltb3VudGVkY2hpbGRyZW7ov5vooYzpgJLlvZIs5LiN6IO95peg6ISR5a+55a2Q6IqC54K56YCS5b2SXG4gICAgICAgICAgICBpbnN0YW5jZVJvb3RzLnB1c2gobm9kZSk7XG5cbiAgICAgICAgICAgIC8vIOa4heepuumihOWItuS9k+WPiuWFtuW1jOWll+mihOWItuS9k+eahG5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHNcbiAgICAgICAgICAgIGlmIChwcmVmYWJJbmZvLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMpIHtcbiAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMuZm9yRWFjaCgocHJlZmFiTm9kZTogTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmVmYWJOb2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5vZGVbJ19wcmVmYWInXS5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlPy5tb3VudGVkQ2hpbGRyZW4/LmZvckVhY2goKG1vdW50ZWRDaGlsZHJlbkluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWRDaGlsZHJlbkluZm8ubm9kZXMuZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmRPdXRtb3N0UHJlZmFiSW5zdGFuY2VOb2RlcyhjaGlsZCwgaW5zdGFuY2VSb290cyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOaZrumAmuiKgueCueS4gOebtOmAkuW9klxuICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5maW5kT3V0bW9zdFByZWZhYkluc3RhbmNlTm9kZXMoY2hpbGQsIGluc3RhbmNlUm9vdHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnYXRoZXJQcmVmYWJJbnN0YW5jZVJvb3RzKHJvb3ROb2RlOiBOb2RlIHwgU2NlbmUpIHtcbiAgICAgICAgLy8gZ2F0aGVyIHByZWZhYkluc3RhbmNlIG5vZGUgaW5mb1xuICAgICAgICBjb25zdCBpbnN0YW5jZVJvb3RzOiBOb2RlW10gPSBbXTtcbiAgICAgICAgcm9vdE5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IE5vZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChpc0VkaXRvck5vZGUoY2hpbGQgYXMgTm9kZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZpbmRPdXRtb3N0UHJlZmFiSW5zdGFuY2VOb2RlcyhjaGlsZCBhcyBOb2RlLCBpbnN0YW5jZVJvb3RzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGluc3RhbmNlUm9vdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKCFyb290Tm9kZVsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICAgICAgcm9vdE5vZGVbJ19wcmVmYWInXSA9IHRoaXMuY3JlYXRlUHJlZmFiSW5mbyhyb290Tm9kZS51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJbmZvID0gcm9vdE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgIHJvb3RQcmVmYWJJbmZvLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMgPSBpbnN0YW5jZVJvb3RzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgcm9vdFByZWZhYkluZm8gPSByb290Tm9kZVsnX3ByZWZhYiddO1xuICAgICAgICAgICAgaWYgKHJvb3RQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgcm9vdFByZWZhYkluZm8ubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHB1YmxpYyBjb2xsZWN0UHJlZmFiSW5zdGFuY2VJRHMocm9vdE5vZGU6IE5vZGUpe1xuICAgIC8vICAgICBjb25zdCBwcmVmYWJJbmZvID0gdGhpcy5nZXRQcmVmYWIocm9vdE5vZGUpO1xuICAgIC8vICAgICBjb25zdCBpbnN0YW5jZXMgPSBwcmVmYWJJbmZvPy5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzO1xuICAgIC8vICAgICBpZiAoaW5zdGFuY2VzICYmIGluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgLy8gICAgICAgICAvLyDpgY3ljoZpbnN0YW5jZeS4iuaJgOacieWtkOiKgueCue+8iOWMheaLrG1vdW50ZWTnmoToioLngrnvvIlcbiAgICAvLyAgICAgICAgIGluc3RhbmNlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgIC8vICAgICAgICAgICAgIGNvbnN0IHByZWZhYiA9IHRoaXMuZ2V0UHJlZmFiKG5vZGUpO1xuICAgIC8vICAgICAgICAgICAgIGlmIChwcmVmYWIgJiYgIXRoaXMuZ2V0TW91bnRlZFJvb3Qobm9kZSkpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgY29uc3QgaWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIC8vICAgICAgICAgICAgICAgICBub2RlLndhbGsoKGNoaWxkKSA9PiB7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZHMucHVzaChjaGlsZC51dWlkKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQudXVpZCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkcy5wdXNoKGNvbXBvbmVudC51dWlkKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgICAgICAgICAgfSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGlmIChwcmVmYWIuaW5zdGFuY2U/Lmlkcykge1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcHJlZmFiLmluc3RhbmNlLmlkcyA9IGlkcztcbiAgICAvLyAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn5pS26ZuG5ZCO55qE6aKE5Yi25L2TaWQnLCBwcmVmYWIuaW5zdGFuY2U/Lmlkcy5sZW5ndGgpO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gcHJlZmFiIOaYr+WQpuaYr+WtkOi1hOa6kO+8jOavlOWmgkZCWOeUn+aIkOeahHByZWZhYlxuICAgIHB1YmxpYyBpc1N1YkFzc2V0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXVpZC5pbmNsdWRlcygnQCcpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVQcmVmYWJJbmZvKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgdGhpcy5maXJlQmVmb3JlQ2hhbmdlTXNnKG5vZGUpO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmUgbWVtYmVyIGFjY2Vzc1xuICAgICAgICBub2RlWydfcHJlZmFiJ10gPSBudWxsO1xuXG4gICAgICAgIC8vIHJlbW92ZSBjb21wb25lbnQgcHJlZmFiSW5mb1xuICAgICAgICBub2RlLmNvbXBvbmVudHMuZm9yRWFjaCgoY29tcCkgPT4ge1xuICAgICAgICAgICAgY29tcC5fX3ByZWZhYiA9IG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZmlyZUNoYW5nZU1zZyhub2RlKTtcbiAgICB9XG5cbiAgICAvLyDmnInlj6/og73kuIDkupvmhI/lpJbmg4XlhrXlr7zoh7TplJnor6/nmoRNb3VudGVkUm9vdOeahOW8leeUqFxuICAgIC8vIOWvvOiHtOW6j+WIl+WMluS6huS4gOS6m+aXoOaViOeahOaVsOaNrlxuICAgIC8vIOi/memHjOagoemqjE1vdW50ZWRSb29055qE5pWw5piv5ZCm5YeG56GuXG4gICAgcHVibGljIGNoZWNrTW91bnRlZFJvb3REYXRhKG5vZGU6IE5vZGUsIHJlY3Vyc2l2ZWx5OiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IG1vdW50ZWRSb290ID0gdGhpcy5nZXRNb3VudGVkUm9vdChub2RlKTtcblxuICAgICAgICBpZiAobW91bnRlZFJvb3QpIHtcbiAgICAgICAgICAgIGxldCBpc1JpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZSA9IG1vdW50ZWRSb290WydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuICAgICAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlICYmIHByZWZhYkluc3RhbmNlLm1vdW50ZWRDaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5zdGFuY2UubW91bnRlZENoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdW50ZWRJbmZvID0gcHJlZmFiSW5zdGFuY2UubW91bnRlZENoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobW91bnRlZEluZm8ubm9kZXMuaW5jbHVkZXMobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUmlnaHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNSaWdodCkge1xuICAgICAgICAgICAgICAgIC8vIOagoemqjOS4jemAmui/h++8jOWIoOmZpE1vdW50ZWRSb2905pWw5o2uXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRNb3VudGVkUm9vdChub2RlLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb21wb25lbnRzLmZvckVhY2goKGNvbXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBNb3VudGVkUm9vdCA9IHRoaXMuZ2V0TW91bnRlZFJvb3QoY29tcCk7XG4gICAgICAgICAgICBpZiAoY29tcE1vdW50ZWRSb290KSB7XG4gICAgICAgICAgICAgICAgbGV0IGlzUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5zdGFuY2UgPSBjb21wTW91bnRlZFJvb3RbJ19wcmVmYWInXT8uaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgaWYgKHByZWZhYkluc3RhbmNlICYmIHByZWZhYkluc3RhbmNlLm1vdW50ZWRDb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdW50ZWRJbmZvID0gcHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobW91bnRlZEluZm8uY29tcG9uZW50cy5pbmNsdWRlcyhjb21wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzUmlnaHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFpc1JpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOagoemqjOS4jemAmui/h++8jOWIoOmZpE1vdW50ZWRSb2905pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TW91bnRlZFJvb3QoY29tcCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZWN1cnNpdmVseSkge1xuICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tNb3VudGVkUm9vdERhdGEoY2hpbGQsIHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlUHJlZmFiSW5zdGFuY2VSb290cyhyb290Tm9kZTogTm9kZSB8IFNjZW5lKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSByb290Tm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAocHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcHJlZmFiSW5mby5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5pyJ5LqbdGFyZ2V0T3ZlcnJpZGXph4znmoRzb3VyY2Xpg73kuLrnqbrkuobvvIzpnIDopoHljrvmjonov5nkuptcbiAgICAvLyDlhpfkvZnmlbDmja5cbiAgICBwdWJsaWMgY2hlY2tUYXJnZXRPdmVycmlkZXNEYXRhKG5vZGU6IE5vZGUgfCBTY2VuZSkge1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldE92ZXJyaWRlcyA9IHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzO1xuICAgICAgICBpZiAoIXRhcmdldE92ZXJyaWRlcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRhcmdldE92ZXJyaWRlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0T3ZlcnJpZGVJdHIgPSB0YXJnZXRPdmVycmlkZXNbaV07XG4gICAgICAgICAgICBpZiAoIXRhcmdldE92ZXJyaWRlSXRyIHx8ICF0YXJnZXRPdmVycmlkZUl0ci5zb3VyY2UpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRPdmVycmlkZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yik5pat6IqC54K55piv5ZCm5piv5pyA5aSW5LiA5bGC55qEUHJlZmFiSW5zdGFuY2XnmoRNb3VudGVk6IqC54K5XG4gICAgICogbW91bnRlZENoaWxk55qE5pmu6YCa5a2Q6IqC54K55Lmf6ZyA6KaB5Yik5patXG4gICAgICogQHBhcmFtIG5vZGVcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHB1YmxpYyBpc091dG1vc3RQcmVmYWJJbnN0YW5jZU1vdW50ZWRDaGlsZHJlbihub2RlOiBOb2RlKSB7XG4gICAgICAgIGxldCBub2RlSXRlcjogTm9kZSB8IG51bGwgPSBub2RlO1xuICAgICAgICB3aGlsZSAobm9kZUl0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vdW50ZWRSb290ID0gdGhpcy5nZXRNb3VudGVkUm9vdChub2RlSXRlcik7XG4gICAgICAgICAgICBpZiAobW91bnRlZFJvb3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvID0gdGhpcy5nZXRPdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvKG1vdW50ZWRSb290KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICAgICAgICAgIC8vIOiKgueCueaYr+aMguWcqOacgOWkluWxgueahFByZWZhYkluc3RhbmNl5LiL55qEbW91bnRlZENoaWxkcmVuXG4gICAgICAgICAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUgPT09IG1vdW50ZWRSb290KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGVJdGVyID0gbm9kZUl0ZXIucGFyZW50O1xuICAgICAgICAgICAgaWYgKCFub2RlSXRlciB8fCB0aGlzLmlzUHJlZmFiSW5zdGFuY2VSb290KG5vZGVJdGVyKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vpmaTml6DmlYjnmoRwcm9wZXJ0eU92ZXJyaWRlc+S/oeaBryznp7vpmaTnu4Tku7bml7bvvIzpnIDopoHnp7vpmaTlhbPkuo7or6Xnu4Tku7bnmoRwcm9wZXJ0eU92ZXJyaWRlc1xuICAgICAqIEBwYXJhbSByb290IOmihOWItuS9k+WunuS+i+iKgueCuVxuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmVJbnZhbGlkUHJvcGVydHlPdmVycmlkZXMocm9vdDogTm9kZSkge1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcm9vdFsnX3ByZWZhYiddO1xuICAgICAgICBpZiAocHJlZmFiSW5mbyAmJiBwcmVmYWJJbmZvLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IHByZWZhYkluZm8uaW5zdGFuY2U7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU92ZXJyaWRlcyA9IGluc3RhbmNlLnByb3BlcnR5T3ZlcnJpZGVzO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHByb3BlcnR5T3ZlcnJpZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE1hcCA9IHRoaXMuZ2V0VGFyZ2V0TWFwKHJvb3QpO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXRNYXAgfHwgT2JqZWN0LmtleXModGFyZ2V0TWFwKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdyZW1vdmVJbnZhbGlkUHJvcGVydHlPdmVycmlkZXMgcmV0dXJuLHRhcmdldE1hcCBpcyBlbXB0eScsIHJvb3QpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gc2l6ZSAtIDE7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wT3ZlcnJpZGUgPSBwcm9wZXJ0eU92ZXJyaWRlc1tpbmRleF07XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0SW5mbyA9IHByb3BPdmVycmlkZS50YXJnZXRJbmZvO1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWIpOaWrXRhcmdldEluZm/mmK/lkKblrZjlnKjvvIzkuI3lrZjlnKjnmoTor53vvIznp7vpmaTmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gUHJlZmFiLl91dGlscy5nZXRUYXJnZXQodGFyZ2V0SW5mby5sb2NhbElELCB0YXJnZXRNYXApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlPdmVycmlkZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCfnp7vpmaTml6DmlYjnmoRwcm9wZXJ0eU92ZXJyaWRlc+S/oeaBrycsIHByb3BPdmVycmlkZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDohJrmnKzlsZ7mgKfkuI3lrZjlnKjml7bvvIzmiJbogIXpooTliLbkvZPlhoXnmoTlrZDoioLngrkv57uE5Lu25Lii5aSx5pe2LOimgeenu+mZpOaVsOaNrlxuICAgICAqIEBwYXJhbSByb290XG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlSW52YWxpZFRhcmdldE92ZXJyaWRlcyhyb290OiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSByb290Py5bJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKHByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE92ZXJyaWRlcyA9IHByZWZhYkluZm8udGFyZ2V0T3ZlcnJpZGVzO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXRPdmVycmlkZXMpIHJldHVybjtcbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gdGFyZ2V0T3ZlcnJpZGVzLmxlbmd0aCAtIDE7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBUYXJnZXRPdmVycmlkZUluZm8gPSB0YXJnZXRPdmVycmlkZXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgIC8vIOWIpOaWreW8leeUqOiKgueCueaYr+WQpuWtmOWcqFxuICAgICAgICAgICAgICAgIGxldCBzb3VyY2U6IE5vZGUgfCBDb21wb25lbnQgfCBudWxsID0gaW5mby5zb3VyY2U7XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlSW5mbyA9IGluZm8uc291cmNlSW5mbztcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0OiBOb2RlIHwgQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0SW5mbyA9IGluZm8udGFyZ2V0SW5mbztcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlSW5mbykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5zb3VyY2UgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSB0aGlzLmdldFRhcmdldChzb3VyY2VJbmZvLmxvY2FsSUQsIGluZm8uc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHNvdXJjZSAo5byV55So55qE6IqC54K55oiW57uE5Lu2KVxuICAgICAgICAgICAgICAgIC8vIGluZm8udGFyZ2V0ICjooqvlvJXnlKjnmoTnm67moIfoioLngrnnmoTpooTliLbkvZPmoLnoioLngrkpXG4gICAgICAgICAgICAgICAgLy8gdGFyZ2V0SW5mbyAo6KKr5byV55So55qEIFRhcmdldEluZm8g5L+h5oGv77yM55So5p2l5a6a5L2N5YW35L2T5Zyo5ZOq5LiqKVxuXG4gICAgICAgICAgICAgICAgLy8gMS7lpoLmnpwgc291cmNlIOS4jiBpbmZvLnRhcmdldCDpg73msqHmnInkuZ/lsLHmmK/mn6Xor6LkuI3liLAgdGFyZ2V0IOS5n+mcgOimgeWJlOmZpFxuICAgICAgICAgICAgICAgIGlmICghc291cmNlICYmICFpbmZvLnRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRPdmVycmlkZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIDIu5aaC5p6c5rKh5pyJIHNvdXJjZSDlrZjlnKggaW5mby50YXJnZXQg5Lmf5a2Y5ZyoIHRhcmdldEluZm/vvIzkvYbmmK/pnIDopoHmn6Xor6LkuIDkuIvmmK/lkKbmnIkgdGFyZ2V077yM5aaC5p6c5rKh5pyJ5bCx6L+b6KGM5YmU6ZmkXG4gICAgICAgICAgICAgICAgaWYgKCFzb3VyY2UgJiYgaW5mby50YXJnZXQgJiYgdGFyZ2V0SW5mbyAmJiB0YXJnZXRJbmZvLmxvY2FsSUQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGhpcy5nZXRUYXJnZXQodGFyZ2V0SW5mby5sb2NhbElELCBpbmZvLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRPdmVycmlkZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFzb3VyY2UgfHwgIXRhcmdldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby50YXJnZXQgaW5zdGFuY2VvZiBOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQgPSB0aGlzLmdldFRhcmdldCh0YXJnZXRJbmZvLmxvY2FsSUQsIGluZm8udGFyZ2V0KTtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlsZ7mgKfkuI3lrZjlnKjvvIznm67moIfkuI3lrZjlnKgs57G75Z6L5LiN5LiA6Ie077yM5YiZ56e76Zmk5bGe5oCnXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHlQYXRoID0gaW5mby5wcm9wZXJ0eVBhdGguc2xpY2UoKTtcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0UHJvcE93bmVyOiBhbnkgPSBzb3VyY2U7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wZXJ0eVBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcE5hbWUgPSBwcm9wZXJ0eVBhdGhbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBDQ0NsYXNzLkF0dHIuZ2V0Q2xhc3NBdHRycyh0YXJnZXRQcm9wT3duZXIuY29uc3RydWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRQcm9wT3duZXIgPSB0YXJnZXRQcm9wT3duZXJbcHJvcE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0eVBhdGjkuK3pl7Tlj6/og73kvJrmlq3mjonvvIzmr5TlpoLmlbDnu4TooqvmuIXnqbpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRQcm9wT3duZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE92ZXJyaWRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IHByb3BlcnR5UGF0aC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyS2V5ID0gcHJvcE5hbWUgKyBERUxJTUVURVIgKyAnY3Rvcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnaHku7bkuIA6IOW9k+WJjeWAvOeahOWxnuaAp+ebruagh+WAvOexu+Wei+WMuemFjVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5p2h5Lu25LqM77ya6ISa5pys5Lit55qE5bGe5oCn57G75Z6L77yIYXR0cueahGN0b3LvvInlupTor6XmmK90YXJnZXTnmoTniLbnsbtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICMxNDE0MCAjMTQ5NDQgIzEzNjEyICMxNDAwN1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6L+Z6YeM55qE6YC76L6R57uP6L+H5Y+N5aSN5L+u5pS577yM5Zug5Li65Y+v6IO95oCn5a6e5Zyo5aSq5aSa5LqGXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpnIDopoHogIPomZHmlbDnu4Tlj5jljJbvvIznsbvlnovlj5jljJbvvIzlgLzmrovnlZnvvIzoh6rlrprkuYnnsbvlnovvvIzlrZDnsbvnrYlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWQjue7reW6lOivpeWwhua4heeQhueahOaTjeS9nOeUqOaIt+WPmOaIkOeUqOaIt+S4u+WKqOaTjeS9nCzlnKjpnaLmnb/kuK3mmL7npLrlrp7kvovkuIrnmoRvdmVycmlkZeS/oeaBr++8jOW5tuaPkOS+m+WIoOmZpOmAiemhuVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0luQ2xhc3NDaGFpbih0YXJnZXRQcm9wT3duZXIuY29uc3RydWN0b3IsIHRhcmdldC5jb25zdHJ1Y3RvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCAoYXR0ciAmJiBhdHRyW2F0dHJLZXldICYmICFpc0luQ2xhc3NDaGFpbih0YXJnZXQuY29uc3RydWN0b3IsIGF0dHJbYXR0cktleV0pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE92ZXJyaWRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOa4heeQhumihOWItuS9k+WGl+S9meaVsOaNrlxuICAgICAqIEBwYXJhbSByb290XG4gICAgICovXG4gICAgcHVibGljIHJlbW92ZUludmFsaWRQcmVmYWJEYXRhKHJvb3Q6IE5vZGUpIHtcbiAgICAgICAgLy8g5riF55CGdGFyZ2V0T3ZlcnJpZGVzXG4gICAgICAgIHRoaXMucmVtb3ZlSW52YWxpZFRhcmdldE92ZXJyaWRlcyhyb290KTtcblxuICAgICAgICAvLyDmuIXnkIZwcm9wZXJ0eU92ZXJyaWRlc1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcm9vdFsnX3ByZWZhYiddO1xuICAgICAgICBjb25zdCBuZXN0ZWRJbnN0YW5jZSA9IHByZWZhYkluZm8/Lm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHM7XG4gICAgICAgIGlmIChuZXN0ZWRJbnN0YW5jZSkge1xuICAgICAgICAgICAgLy8g5bWM5aWX6aKE5Yi25L2TXG4gICAgICAgICAgICBuZXN0ZWRJbnN0YW5jZS5mb3JFYWNoKChub2RlOiBOb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVJbnZhbGlkUHJvcGVydHlPdmVycmlkZXMobm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa4hemZpOmihOWItuS9k+S4re+8jOW1jOWll+mihOWItuS9k+eahHByb3BlcnRPdmVycmlkZXPlr7npnZ7pooTliLbkvZPlrZDoioLngrnnmoTlvJXnlKhcbiAgICAgKiBAcGFyYW0gcm9vdCDpooTliLbkvZPmoLnoioLngrlcbiAgICAgKiBAcmV0dXJuIHtuZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzOntpbGxlZ2FsUmVmZXJlbmNlfX1cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlSW52YWxpZFByb3BlcnR5T3ZlcnJpZGVSZWZlcmVuY2Uocm9vdDogTm9kZSkge1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gdGhpcy5nZXRQcmVmYWIocm9vdCk7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBNYXAoKTtcbiAgICAgICAgaWYgKHByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHByZWZhYkluZm8ubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cz8uZm9yRWFjaCgocHJlZmFiSW5zdGFuY2VOb2RlOiBOb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmVzdFByZWZhYkluZm8gPSB0aGlzLmdldFByZWZhYihwcmVmYWJJbnN0YW5jZU5vZGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5T3ZlcnJpZGVzID0gbmVzdFByZWZhYkluZm8/Lmluc3RhbmNlPy5wcm9wZXJ0eU92ZXJyaWRlcztcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlPdmVycmlkZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSBwcm9wZXJ0eU92ZXJyaWRlcy5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHByb3BlcnR5T3ZlcnJpZGVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWw6IGFueSA9IHByb3BzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIGNjLkNvbXBvbmVudC5FdmVudEhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBjYy5Db21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwubm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgJiYgdmFsIGluc3RhbmNlb2YgY2MuTm9kZSAmJiAhdmFsLmlzQ2hpbGRPZihyb290KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybignY2xlYW5JbGxlZ2FsUHJvcGVydHlPdmVycmlkZVJlZmVyZW5jZScsIHByb3BzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU92ZXJyaWRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBiYWNrVXAgPSByZXQuZ2V0KHByZWZhYkluc3RhbmNlTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrVXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja1VwID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5zZXQocHJlZmFiSW5zdGFuY2VOb2RlLCBiYWNrVXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrVXAucHVzaChwcm9wcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgcHJlZmFiVXRpbHMgPSBuZXcgUHJlZmFiVXRpbCgpO1xuIl19