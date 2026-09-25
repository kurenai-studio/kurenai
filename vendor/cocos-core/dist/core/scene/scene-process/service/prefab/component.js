"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentOperation = void 0;
const cc_1 = require("cc");
const utils_1 = require("./utils");
const dump_1 = __importDefault(require("../dump"));
const rpc_1 = require("../../rpc");
const core_1 = require("../core");
// import { SceneUndoCommand } from '../../../export/undo';
const nodeMgr = EditorExtends.Node;
const CompPrefabInfo = cc_1.Prefab._utils.CompPrefabInfo;
// class ApplyRemoveComponentCommand extends SceneUndoCommand {
//     public removedCompInfo: IRemovedComponentInfo | null = null;
//     private _undoFunc: Function;
//     private _redoFunc: Function;
//     constructor(undoFunc: Function, redoFunc: Function) {
//         super();
//         this._undoFunc = undoFunc;
//         this._redoFunc = redoFunc;
//     }
//
//     public async undo() {
//         if (this.removedCompInfo) {
//             this._undoFunc(this.removedCompInfo);
//         }
//     }
//
//     public async redo() {
//         if (this.removedCompInfo) {
//             this._redoFunc(this.removedCompInfo.nodeUUID, this.removedCompInfo.compData.__prefab!.fileId);
//         }
//     }
// }
/**
 * Component 相关的操作
 */
class ComponentOperation {
    isRevertingRemovedComponents = false;
    isRemovingMountedComponents = false;
    compMap = {}; // uuid->comp映射表，用于diff比较
    cacheComp(comp) {
        this.compMap[comp.uuid] = comp._instantiate();
    }
    getCachedComp(uuid) {
        return this.compMap[uuid];
    }
    clearCompCache() {
        this.compMap = {};
    }
    onAddComponent(comp) {
        this.cacheComp(comp);
        if (this.isRevertingRemovedComponents) {
            return;
        }
        const node = comp.node;
        // @ts-ignore
        if (node && node['_prefab']) {
            this.updateMountedComponents(node);
        }
    }
    onComponentAdded(comp) {
        this.cacheComp(comp);
        if (core_1.Service.Editor.getCurrentEditorType() === 'prefab' && comp.node &&
            // @ts-ignore
            comp.node['_prefab']) {
            // prefab节点上的Component需要添加prefab信息
            if (!comp.__prefab) {
                comp.__prefab = new CompPrefabInfo();
                comp.__prefab.fileId = comp.uuid;
            }
        }
    }
    onRemoveComponentInGeneralMode(comp, rootNode) {
        if (this.isRemovingMountedComponents) {
            return;
        }
        const node = comp.node;
        // @ts-ignore
        if (node && node['_prefab']) {
            const mountedRoot = utils_1.prefabUtils.getMountedRoot(comp);
            if (comp.__prefab && !mountedRoot) {
                this.onPrefabComponentRemoved(comp);
            }
            else {
                this.updateMountedComponents(node);
            }
        }
    }
    onPrefabComponentRemoved(comp) {
        const compPrefabInfo = comp.__prefab;
        if (!compPrefabInfo) {
            return;
        }
        const node = comp.node;
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return;
        }
        // 向上查找PrefabInstance路径
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        if (outMostPrefabInstance) {
            targetPath.splice(0, 1); // 不需要存最外层的PrefabInstance的fileID，方便override可以在PrefabInstance复制后复用  
            targetPath.push(compPrefabInfo.fileId);
            utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);
            utils_1.prefabUtils.addRemovedComponent(outMostPrefabInstance, targetPath);
            utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
        }
    }
    onComponentRemovedInGeneralMode(comp, rootNode) {
        if (this.isRemovingMountedComponents) {
            return;
        }
        utils_1.prefabUtils.checkToRemoveTargetOverride(comp, rootNode);
    }
    /**
     * 将 PrefabInstance 上删除的组件应用到 PrefabAsset 中
     * @param nodeUUID 节点的uuid
     * @param fileID component的fileID
     */
    async doApplyRemovedComponent(nodeUUID, fileID) {
        const node = nodeMgr.getNode(nodeUUID);
        if (!node) {
            return null;
        }
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return null;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        // @ts-ignore
        const outMostPrefabInfo = outMostPrefabInstanceNode['_prefab'];
        if (outMostPrefabInstance && outMostPrefabInfo && outMostPrefabInfo.asset) {
            const assetUUID = outMostPrefabInfo.asset._uuid;
            // 如果是子资源，则不能应用
            if (utils_1.prefabUtils.isSubAsset(assetUUID)) {
                console.warn('can\'t apply RemovedComponent in SubAsset Prefab');
                return null;
            }
            targetPath.splice(0, 1);
            targetPath.push(fileID);
            const assetRootNode = utils_1.prefabUtils.getPrefabAssetNodeInstance(outMostPrefabInfo);
            if (!assetRootNode) {
                return null;
            }
            const targetCompInAsset = utils_1.prefabUtils.getTarget(targetPath, assetRootNode);
            const compIndex = targetCompInAsset.node.components.indexOf(targetCompInAsset);
            const compData = targetCompInAsset._instantiate();
            if (!compData) {
                return null;
            }
            // #14002 移除组件是嵌套预制体的组件，需要额外处理。是mounted的组件就移除mounted信息，不是的话要更新removedComponents属性
            // 可以参考applyPrefab的结果 
            if (node['_prefab']?.instance && node['_prefab']?.instance !== outMostPrefabInstance) {
                // @ts-ignore
                const assetRootPrefabInfo = assetRootNode._prefab;
                const oldInstance = assetRootPrefabInfo.instance;
                assetRootPrefabInfo.instance = undefined;
                this.onRemoveComponentInGeneralMode(targetCompInAsset, assetRootNode);
                assetRootPrefabInfo.instance = oldInstance;
            }
            // 删除Component
            targetCompInAsset._destroyImmediate();
            // 去掉instance,否则里边的mountedRoot会被消除
            // @ts-ignore
            const assetRootNodePrefab = assetRootNode['_prefab'];
            if (assetRootNodePrefab) {
                assetRootNodePrefab.instance = undefined;
            }
            const ret = utils_1.prefabUtils.generatePrefabDataFromNode(assetRootNode);
            if (!ret)
                return null;
            const prefabData = ret.prefabData;
            const info = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [outMostPrefabInfo.asset._uuid]);
            if (!info)
                return null;
            utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);
            utils_1.prefabUtils.deleteRemovedComponent(outMostPrefabInstance, targetPath);
            utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
            await rpc_1.Rpc.getInstance().request('assetManager', 'createAsset', [{
                    target: info.source,
                    content: prefabData,
                    overwrite: true
                }]);
            // cce.SceneFacadeManager.abortSnapshot();
            return {
                nodeUUID,
                compIndex,
                compData,
            };
        }
        return null;
    }
    /**
     * undo ApplyRemovedComponent 操作
     * @param IRemovedComponentInfo 移除的component信息
     */
    async undoApplyRemovedComponent(removedCompInfo) {
        if (!removedCompInfo) {
            return;
        }
        const node = nodeMgr.getNode(removedCompInfo.nodeUUID);
        if (!node) {
            return;
        }
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        // @ts-ignore
        const outMostPrefabInfo = outMostPrefabInstanceNode['_prefab'];
        if (outMostPrefabInstance && outMostPrefabInfo && outMostPrefabInfo.asset) {
            targetPath.splice(0, 1);
            const nodeLocalID = targetPath.slice();
            // @ts-ignore
            nodeLocalID.push(node['_prefab'].fileId);
            const compFileID = removedCompInfo.compData.__prefab.fileId;
            targetPath.push(compFileID);
            const assetRootNode = utils_1.prefabUtils.getPrefabAssetNodeInstance(outMostPrefabInfo);
            if (!assetRootNode) {
                return;
            }
            const nodeInAsset = utils_1.prefabUtils.getTarget(nodeLocalID, assetRootNode);
            // @ts-ignore
            nodeInAsset._addComponentAt(removedCompInfo.compData, removedCompInfo.compIndex);
            const ret = utils_1.prefabUtils.generatePrefabDataFromNode(assetRootNode);
            if (!ret)
                return;
            const info = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [outMostPrefabInfo.asset._uuid]);
            if (!info)
                return;
            utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);
            utils_1.prefabUtils.addRemovedComponent(outMostPrefabInstance, targetPath);
            utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
            await rpc_1.Rpc.getInstance().request('assetManager', 'createAsset', [{
                    target: info.source,
                    content: ret.prefabData,
                    overwrite: true
                }]);
            // cce.SceneFacadeManager.abortSnapshot();
        }
    }
    async applyRemovedComponent(nodeUUID, fileID) {
        // const command = new ApplyRemoveComponentCommand(
        //     this.undoApplyRemovedComponent.bind(this), this.doApplyRemovedComponent.bind(this));
        // const undoID = cce.SceneFacadeManager.beginRecording(nodeUUID, { customCommand: command });
        const removedCompInfo = await this.doApplyRemovedComponent(nodeUUID, fileID);
        if (removedCompInfo) {
            // command.removedCompInfo = removedCompInfo;
            // cce.SceneFacadeManager.endRecording(undoID);
            // cce.SceneFacadeManager.snapshot();
            // cce.SceneFacadeManager.abortSnapshot();
        }
        else {
            // cce.SceneFacadeManager.cancelRecording(undoID);
        }
    }
    async cloneComponentToNode(node, clonedComp) {
        const copyCompDump = dump_1.default.dumpComponent(clonedComp);
        // 不要同步_objFlags，否则因为没有onEnable的标记会导致onDisable不被调用
        // delete copyCompDump.value._objFlags;
        const newComp = node.addComponent(cc_1.js.getClassName(clonedComp));
        const components = node.components;
        if (components && components.length) {
            const lastIndex = components.length - 1;
            const lastComp = components[lastIndex];
            if (lastComp && lastComp === newComp) {
                await dump_1.default.restoreProperty(node, `__comps__.${lastIndex}`, copyCompDump);
                // MissingScript的_$erialized要特殊还原
                if (newComp instanceof cc_1.MissingScript) {
                    // 这里_$erialized因为有node引用没法简单的clone出一份，只能
                    // 先用prefabAsset上的component身上的那份数据
                    // @ts-expect-error
                    newComp._$erialized = clonedComp._$erialized;
                }
            }
        }
    }
    /**
     * 撤销 removedComponent，会将PrefabAsset中的Component还原到当前节点上
     * @param nodeUUID node的UUID
     * @param fileID component的fileID
     */
    async revertRemovedComponent(nodeUUID, fileID) {
        const node = nodeMgr.getNode(nodeUUID);
        if (!node) {
            return;
        }
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return;
        }
        const targetPath = outMostPrefabInstanceInfo.targetPath;
        // @ts-ignore
        const outMostPrefabInstance = outMostPrefabInstanceNode['_prefab']?.instance;
        // @ts-ignore
        const outMostPrefabInfo = outMostPrefabInstanceNode['_prefab'];
        if (outMostPrefabInstance && outMostPrefabInfo && outMostPrefabInfo.asset) {
            targetPath.splice(0, 1);
            targetPath.push(fileID);
            const assetRootNode = (0, cc_1.instantiate)(outMostPrefabInfo.asset);
            if (!assetRootNode) {
                return;
            }
            // const undoId = cce.SceneFacadeManager.beginRecording([outMostPrefabInstanceNode.uuid, nodeUUID]);
            const targetCompInAsset = utils_1.prefabUtils.getTarget(targetPath, assetRootNode);
            utils_1.prefabUtils.fireBeforeChangeMsg(node);
            this.isRevertingRemovedComponents = true;
            await this.cloneComponentToNode(node, targetCompInAsset);
            this.isRevertingRemovedComponents = false;
            utils_1.prefabUtils.fireChangeMsg(node);
            utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);
            utils_1.prefabUtils.deleteRemovedComponent(outMostPrefabInstance, targetPath);
            utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
            // cce.SceneFacadeManager.endRecording(undoId);
        }
    }
    updateMountedComponents(node) {
        // PrefabInstance中增加/删除Component，需要更新mountedComponents
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            return;
        }
        // 向上查找PrefabInstance路径
        const outMostPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(node);
        const outMostPrefabInstanceNode = outMostPrefabInstanceInfo.outMostPrefabInstanceNode;
        if (!outMostPrefabInstanceNode) {
            return null;
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
        targetPath.splice(0, 1); // 不需要存最外层的PrefabInstance的fileID，方便override可以在PrefabInstance复制后复用  
        targetPath.push(prefabInfo.fileId);
        const nodeInAsset = utils_1.prefabUtils.getTarget(targetPath, assetRootNode);
        if (!nodeInAsset) {
            return;
        }
        const compsFileIDs = nodeInAsset.components.map((comp) => {
            return comp.__prefab?.fileId;
        });
        const mountedComponents = [];
        for (let i = 0; i < node.components.length; i++) {
            const comp = node.components[i];
            const compPrefabInfo = comp.__prefab;
            // 非Prefab中的component
            if (!compPrefabInfo) {
                mountedComponents.push(comp);
            }
            else {
                // 不在prefabAsset中的component，要加到mountedComponents
                if (!compsFileIDs.includes(comp.__prefab?.fileId)) {
                    // 1. mountedRoot为空表示为新加的Component
                    // 2. mountedRoot不为空需要查看是不是挂在这个PrefabInstance节点下的，因为可能是挂在
                    // 里层PrefabInstance里,这里就不应该重复添加
                    const mountedRoot = utils_1.prefabUtils.getMountedRoot(comp);
                    if (!mountedRoot || mountedRoot === outMostPrefabInstanceNode) {
                        mountedComponents.push(comp);
                    }
                }
            }
        }
        utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);
        if (mountedComponents.length > 0) {
            const mountedComponentsInfo = utils_1.prefabUtils.getPrefabInstanceMountedComponents(outMostPrefabInstance, targetPath);
            mountedComponentsInfo.components = mountedComponents;
            mountedComponentsInfo.components.forEach((comp) => {
                utils_1.prefabUtils.setMountedRoot(comp, outMostPrefabInstanceNode);
            });
        }
        else {
            for (let i = 0; i < outMostPrefabInstance.mountedComponents.length; i++) {
                const compInfo = outMostPrefabInstance.mountedComponents[i];
                if (compInfo.isTarget(targetPath)) {
                    compInfo.components.forEach((comp) => {
                        utils_1.prefabUtils.setMountedRoot(comp, undefined);
                    });
                    outMostPrefabInstance.mountedComponents.splice(i, 1);
                    break;
                }
            }
        }
        utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
    }
    applyMountedComponents(node) {
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
        const mountedCompsMap = new Map();
        const mountedComponents = prefabInstance.mountedComponents;
        for (let i = 0; i < mountedComponents.length; i++) {
            const mountedComponentInfo = mountedComponents[i];
            const targetInfo = mountedComponentInfo.targetInfo;
            if (!targetInfo)
                continue;
            const target = utils_1.prefabUtils.getTarget(targetInfo.localID, rootNode);
            if (!target)
                continue;
            // 把mountedComponentInfo中的组件加到PrefabAsset中
            mountedComponentInfo.components.forEach((mountedComp) => {
                if (!mountedComp.__prefab) {
                    mountedComp.__prefab = new CompPrefabInfo();
                    mountedComp.__prefab.fileId = mountedComp.uuid;
                }
                // 节点挂载嵌套预制体身上
                if (targetInfo.localID.length > 1) {
                    prefabInfo.instance = undefined;
                    const nestedInstPrefabInstanceInfo = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(target);
                    prefabInfo.instance = prefabInstance;
                    const nestedInstNode = nestedInstPrefabInstanceInfo.outMostPrefabInstanceNode;
                    if (!nestedInstNode) {
                        return;
                    }
                    // @ts-ignore
                    const nestedInstPrefabInfo = nestedInstNode['_prefab'];
                    if (!nestedInstPrefabInfo) {
                        return;
                    }
                    const nestedInstPrefabInstance = nestedInstPrefabInfo.instance;
                    if (!nestedInstPrefabInstance) {
                        return;
                    }
                    // @ts-ignore
                    const targetPrefabInfo = target['_prefab'];
                    if (!targetPrefabInfo) {
                        return;
                    }
                    // 更新预制体数据，localID从第二个开始(数据存在嵌套预制体实例上，所以可以忽略第一个fileID(自身))
                    const mountedNodePath = nestedInstPrefabInstanceInfo.targetPath.slice(1);
                    mountedNodePath.push(targetPrefabInfo.fileId);
                    const nestedMountedComponentInfo = utils_1.prefabUtils.getPrefabInstanceMountedComponents(nestedInstPrefabInstance, mountedNodePath);
                    nestedMountedComponentInfo.components.push(mountedComp);
                    utils_1.prefabUtils.setMountedRoot(mountedComp, nestedInstNode);
                    // 记录undo索引数据,从根节点开始找，所以需要第一个fileID
                    const targetPath = nestedInstPrefabInstanceInfo.targetPath.slice();
                    targetPath.push(mountedComp.__prefab.fileId);
                    mountedCompsMap.set(targetPath, { prefabInfo: null });
                }
                else {
                    mountedCompsMap.set([mountedComp.__prefab.fileId], { prefabInfo: null });
                    utils_1.prefabUtils.setMountedRoot(mountedComp, undefined);
                }
            });
        }
        prefabInstance.mountedComponents = [];
        return mountedCompsMap;
    }
}
exports.componentOperation = new ComponentOperation();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3ByZWZhYi9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQW9GO0FBQ3BGLG1DQUFzQztBQUN0QyxtREFBK0I7QUFDL0IsbUNBQWdDO0FBQ2hDLGtDQUFrQztBQUNsQywyREFBMkQ7QUFFM0QsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQztBQUduQyxNQUFNLGNBQWMsR0FBRyxXQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztBQWFwRCwrREFBK0Q7QUFDL0QsbUVBQW1FO0FBQ25FLG1DQUFtQztBQUNuQyxtQ0FBbUM7QUFDbkMsNERBQTREO0FBQzVELG1CQUFtQjtBQUNuQixxQ0FBcUM7QUFDckMscUNBQXFDO0FBQ3JDLFFBQVE7QUFDUixFQUFFO0FBQ0YsNEJBQTRCO0FBQzVCLHNDQUFzQztBQUN0QyxvREFBb0Q7QUFDcEQsWUFBWTtBQUNaLFFBQVE7QUFDUixFQUFFO0FBQ0YsNEJBQTRCO0FBQzVCLHNDQUFzQztBQUN0Qyw2R0FBNkc7QUFDN0csWUFBWTtBQUNaLFFBQVE7QUFDUixJQUFJO0FBRUo7O0dBRUc7QUFDSCxNQUFNLGtCQUFrQjtJQUNiLDRCQUE0QixHQUFHLEtBQUssQ0FBQztJQUNyQywyQkFBMkIsR0FBRyxLQUFLLENBQUM7SUFDbkMsT0FBTyxHQUFtQyxFQUFFLENBQUMsQ0FBQyx5QkFBeUI7SUFFeEUsU0FBUyxDQUFDLElBQWU7UUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRyxDQUFDO0lBQ25ELENBQUM7SUFFTSxhQUFhLENBQUMsSUFBWTtRQUM3QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFD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QVcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELGNBQWMsQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFFdEMsT0FBTyxlQUFlLENBQUM7SUFDM0IsQ0FBQztDQUNKO0FBRVksUUFBQSxrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTY2VuZSwgQ29tcG9uZW50LCBpbnN0YW50aWF0ZSwganMsIE1pc3NpbmdTY3JpcHQsIE5vZGUsIFByZWZhYiB9IGZyb20gJ2NjJztcbmltcG9ydCB7IHByZWZhYlV0aWxzIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgZHVtcFV0aWwgZnJvbSAnLi4vZHVtcCc7XG5pbXBvcnQgeyBScGMgfSBmcm9tICcuLi8uLi9ycGMnO1xuaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4uL2NvcmUnO1xuLy8gaW1wb3J0IHsgU2NlbmVVbmRvQ29tbWFuZCB9IGZyb20gJy4uLy4uLy4uL2V4cG9ydC91bmRvJztcblxuY29uc3Qgbm9kZU1nciA9IEVkaXRvckV4dGVuZHMuTm9kZTtcblxudHlwZSBDb21wUHJlZmFiSW5mbyA9IFByZWZhYi5fdXRpbHMuQ29tcFByZWZhYkluZm87XG5jb25zdCBDb21wUHJlZmFiSW5mbyA9IFByZWZhYi5fdXRpbHMuQ29tcFByZWZhYkluZm87XG50eXBlIFByZWZhYkluc3RhbmNlID0gUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZTtcblxuZXhwb3J0IGludGVyZmFjZSBJQ29tcG9uZW50UHJlZmFiRGF0YSB7XG4gICAgcHJlZmFiSW5mbzogQ29tcFByZWZhYkluZm8gfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElSZW1vdmVkQ29tcG9uZW50SW5mbyB7XG4gICAgbm9kZVVVSUQ6IHN0cmluZztcbiAgICBjb21wSW5kZXg6IG51bWJlcjtcbiAgICBjb21wRGF0YTogQ29tcG9uZW50O1xufVxuXG4vLyBjbGFzcyBBcHBseVJlbW92ZUNvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBTY2VuZVVuZG9Db21tYW5kIHtcbi8vICAgICBwdWJsaWMgcmVtb3ZlZENvbXBJbmZvOiBJUmVtb3ZlZENvbXBvbmVudEluZm8gfCBudWxsID0gbnVsbDtcbi8vICAgICBwcml2YXRlIF91bmRvRnVuYzogRnVuY3Rpb247XG4vLyAgICAgcHJpdmF0ZSBfcmVkb0Z1bmM6IEZ1bmN0aW9uO1xuLy8gICAgIGNvbnN0cnVjdG9yKHVuZG9GdW5jOiBGdW5jdGlvbiwgcmVkb0Z1bmM6IEZ1bmN0aW9uKSB7XG4vLyAgICAgICAgIHN1cGVyKCk7XG4vLyAgICAgICAgIHRoaXMuX3VuZG9GdW5jID0gdW5kb0Z1bmM7XG4vLyAgICAgICAgIHRoaXMuX3JlZG9GdW5jID0gcmVkb0Z1bmM7XG4vLyAgICAgfVxuLy9cbi8vICAgICBwdWJsaWMgYXN5bmMgdW5kbygpIHtcbi8vICAgICAgICAgaWYgKHRoaXMucmVtb3ZlZENvbXBJbmZvKSB7XG4vLyAgICAgICAgICAgICB0aGlzLl91bmRvRnVuYyh0aGlzLnJlbW92ZWRDb21wSW5mbyk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vL1xuLy8gICAgIHB1YmxpYyBhc3luYyByZWRvKCkge1xuLy8gICAgICAgICBpZiAodGhpcy5yZW1vdmVkQ29tcEluZm8pIHtcbi8vICAgICAgICAgICAgIHRoaXMuX3JlZG9GdW5jKHRoaXMucmVtb3ZlZENvbXBJbmZvLm5vZGVVVUlELCB0aGlzLnJlbW92ZWRDb21wSW5mby5jb21wRGF0YS5fX3ByZWZhYiEuZmlsZUlkKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH1cbi8vIH1cblxuLyoqXG4gKiBDb21wb25lbnQg55u45YWz55qE5pON5L2cXG4gKi9cbmNsYXNzIENvbXBvbmVudE9wZXJhdGlvbiB7XG4gICAgcHVibGljIGlzUmV2ZXJ0aW5nUmVtb3ZlZENvbXBvbmVudHMgPSBmYWxzZTtcbiAgICBwdWJsaWMgaXNSZW1vdmluZ01vdW50ZWRDb21wb25lbnRzID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBjb21wTWFwOiB7IFtpbmRleDogc3RyaW5nXTogQ29tcG9uZW50IH0gPSB7fTsgLy8gdXVpZC0+Y29tcOaYoOWwhOihqO+8jOeUqOS6jmRpZmbmr5TovoNcblxuICAgIHB1YmxpYyBjYWNoZUNvbXAoY29tcDogQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY29tcE1hcFtjb21wLnV1aWRdID0gY29tcC5faW5zdGFudGlhdGUoKSE7XG4gICAgfVxuXG4gICAgcHVibGljIGdldENhY2hlZENvbXAodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBNYXBbdXVpZF07XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyQ29tcENhY2hlKCkge1xuICAgICAgICB0aGlzLmNvbXBNYXAgPSB7fTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25BZGRDb21wb25lbnQoY29tcDogQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY2FjaGVDb21wKGNvbXApO1xuICAgICAgICBpZiAodGhpcy5pc1JldmVydGluZ1JlbW92ZWRDb21wb25lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZSA9IGNvbXAubm9kZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAobm9kZSAmJiBub2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTW91bnRlZENvbXBvbmVudHMobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnRBZGRlZChjb21wOiBDb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5jYWNoZUNvbXAoY29tcCk7XG5cbiAgICAgICAgaWYgKFNlcnZpY2UuRWRpdG9yLmdldEN1cnJlbnRFZGl0b3JUeXBlKCkgPT09ICdwcmVmYWInICYmIGNvbXAubm9kZSAmJlxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29tcC5ub2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgIC8vIHByZWZhYuiKgueCueS4iueahENvbXBvbmVudOmcgOimgea3u+WKoHByZWZhYuS/oeaBr1xuICAgICAgICAgICAgaWYgKCFjb21wLl9fcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgY29tcC5fX3ByZWZhYiA9IG5ldyBDb21wUHJlZmFiSW5mbygpO1xuICAgICAgICAgICAgICAgIGNvbXAuX19wcmVmYWIhLmZpbGVJZCA9IGNvbXAudXVpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvblJlbW92ZUNvbXBvbmVudEluR2VuZXJhbE1vZGUoY29tcDogQ29tcG9uZW50LCByb290Tm9kZTogTm9kZSB8IFNjZW5lIHwgbnVsbCkge1xuICAgICAgICBpZiAodGhpcy5pc1JlbW92aW5nTW91bnRlZENvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGUgPSBjb21wLm5vZGU7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKG5vZGUgJiYgbm9kZVsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICBjb25zdCBtb3VudGVkUm9vdCA9IHByZWZhYlV0aWxzLmdldE1vdW50ZWRSb290KGNvbXApO1xuICAgICAgICAgICAgaWYgKGNvbXAuX19wcmVmYWIgJiYgIW1vdW50ZWRSb290KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblByZWZhYkNvbXBvbmVudFJlbW92ZWQoY29tcCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTW91bnRlZENvbXBvbmVudHMobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uUHJlZmFiQ29tcG9uZW50UmVtb3ZlZChjb21wOiBDb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgY29tcFByZWZhYkluZm8gPSBjb21wLl9fcHJlZmFiO1xuICAgICAgICBpZiAoIWNvbXBQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gY29tcC5ub2RlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBub2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5ZCR5LiK5p+l5om+UHJlZmFiSW5zdGFuY2Xot6/lvoRcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8obm9kZSk7XG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUgfCBudWxsID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICBpZiAoIW91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXJnZXRQYXRoOiBzdHJpbmdbXSA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8udGFyZ2V0UGF0aDtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2U6IFByZWZhYi5fdXRpbHMuUHJlZmFiSW5zdGFuY2UgfCB1bmRlZmluZWQgPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuXG4gICAgICAgIGlmIChvdXRNb3N0UHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpOyAvLyDkuI3pnIDopoHlrZjmnIDlpJblsYLnmoRQcmVmYWJJbnN0YW5jZeeahGZpbGVJRO+8jOaWueS+v292ZXJyaWRl5Y+v5Lul5ZyoUHJlZmFiSW5zdGFuY2XlpI3liLblkI7lpI3nlKggIFxuICAgICAgICAgICAgdGFyZ2V0UGF0aC5wdXNoKGNvbXBQcmVmYWJJbmZvLmZpbGVJZCk7XG5cbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSk7XG5cbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmFkZFJlbW92ZWRDb21wb25lbnQob3V0TW9zdFByZWZhYkluc3RhbmNlLCB0YXJnZXRQYXRoKTtcblxuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkNvbXBvbmVudFJlbW92ZWRJbkdlbmVyYWxNb2RlKGNvbXA6IENvbXBvbmVudCwgcm9vdE5vZGU6IE5vZGUgfCBTY2VuZSB8IG51bGwpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSZW1vdmluZ01vdW50ZWRDb21wb25lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcmVmYWJVdGlscy5jaGVja1RvUmVtb3ZlVGFyZ2V0T3ZlcnJpZGUoY29tcCwgcm9vdE5vZGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhiBQcmVmYWJJbnN0YW5jZSDkuIrliKDpmaTnmoTnu4Tku7blupTnlKjliLAgUHJlZmFiQXNzZXQg5LitXG4gICAgICogQHBhcmFtIG5vZGVVVUlEIOiKgueCueeahHV1aWRcbiAgICAgKiBAcGFyYW0gZmlsZUlEIGNvbXBvbmVudOeahGZpbGVJRFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBkb0FwcGx5UmVtb3ZlZENvbXBvbmVudChub2RlVVVJRDogc3RyaW5nLCBmaWxlSUQ6IHN0cmluZyk6IFByb21pc2U8bnVsbCB8IElSZW1vdmVkQ29tcG9uZW50SW5mbz4ge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZU1nci5nZXROb2RlKG5vZGVVVUlEKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8obm9kZSk7XG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUgfCBudWxsID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICBpZiAoIW91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldFBhdGg6IHN0cmluZ1tdID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby50YXJnZXRQYXRoO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZTogUHJlZmFiLl91dGlscy5QcmVmYWJJbnN0YW5jZSB8IHVuZGVmaW5lZCA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGVbJ19wcmVmYWInXT8uaW5zdGFuY2U7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5mbyA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKG91dE1vc3RQcmVmYWJJbnN0YW5jZSAmJiBvdXRNb3N0UHJlZmFiSW5mbyAmJiBvdXRNb3N0UHJlZmFiSW5mby5hc3NldCkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXRVVUlEID0gb3V0TW9zdFByZWZhYkluZm8uYXNzZXQuX3V1aWQ7XG4gICAgICAgICAgICAvLyDlpoLmnpzmmK/lrZDotYTmupDvvIzliJnkuI3og73lupTnlKhcbiAgICAgICAgICAgIGlmIChwcmVmYWJVdGlscy5pc1N1YkFzc2V0KGFzc2V0VVVJRCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2NhblxcJ3QgYXBwbHkgUmVtb3ZlZENvbXBvbmVudCBpbiBTdWJBc3NldCBQcmVmYWInKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFyZ2V0UGF0aC5zcGxpY2UoMCwgMSk7XG4gICAgICAgICAgICB0YXJnZXRQYXRoLnB1c2goZmlsZUlEKTtcblxuICAgICAgICAgICAgY29uc3QgYXNzZXRSb290Tm9kZSA9IHByZWZhYlV0aWxzLmdldFByZWZhYkFzc2V0Tm9kZUluc3RhbmNlKG91dE1vc3RQcmVmYWJJbmZvKTtcbiAgICAgICAgICAgIGlmICghYXNzZXRSb290Tm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRDb21wSW5Bc3NldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldCh0YXJnZXRQYXRoLCBhc3NldFJvb3ROb2RlKSBhcyBDb21wb25lbnQ7XG4gICAgICAgICAgICBjb25zdCBjb21wSW5kZXggPSB0YXJnZXRDb21wSW5Bc3NldC5ub2RlLmNvbXBvbmVudHMuaW5kZXhPZih0YXJnZXRDb21wSW5Bc3NldCk7XG4gICAgICAgICAgICBjb25zdCBjb21wRGF0YSA9IHRhcmdldENvbXBJbkFzc2V0Ll9pbnN0YW50aWF0ZSgpO1xuICAgICAgICAgICAgaWYgKCFjb21wRGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyAjMTQwMDIg56e76Zmk57uE5Lu25piv5bWM5aWX6aKE5Yi25L2T55qE57uE5Lu277yM6ZyA6KaB6aKd5aSW5aSE55CG44CC5pivbW91bnRlZOeahOe7hOS7tuWwseenu+mZpG1vdW50ZWTkv6Hmga/vvIzkuI3mmK/nmoTor53opoHmm7TmlrByZW1vdmVkQ29tcG9uZW50c+WxnuaAp1xuICAgICAgICAgICAgLy8g5Y+v5Lul5Y+C6ICDYXBwbHlQcmVmYWLnmoTnu5PmnpwgXG4gICAgICAgICAgICBpZiAobm9kZVsnX3ByZWZhYiddPy5pbnN0YW5jZSAmJiBub2RlWydfcHJlZmFiJ10/Lmluc3RhbmNlICE9PSBvdXRNb3N0UHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRSb290UHJlZmFiSW5mbyA9IGFzc2V0Um9vdE5vZGUuX3ByZWZhYiE7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkSW5zdGFuY2UgPSBhc3NldFJvb3RQcmVmYWJJbmZvLmluc3RhbmNlO1xuICAgICAgICAgICAgICAgIGFzc2V0Um9vdFByZWZhYkluZm8uaW5zdGFuY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5vblJlbW92ZUNvbXBvbmVudEluR2VuZXJhbE1vZGUodGFyZ2V0Q29tcEluQXNzZXQsIGFzc2V0Um9vdE5vZGUpO1xuICAgICAgICAgICAgICAgIGFzc2V0Um9vdFByZWZhYkluZm8uaW5zdGFuY2UgPSBvbGRJbnN0YW5jZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5Yig6ZmkQ29tcG9uZW50XG4gICAgICAgICAgICB0YXJnZXRDb21wSW5Bc3NldC5fZGVzdHJveUltbWVkaWF0ZSgpO1xuXG4gICAgICAgICAgICAvLyDljrvmjolpbnN0YW5jZSzlkKbliJnph4zovrnnmoRtb3VudGVkUm9vdOS8muiiq+a2iOmZpFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgYXNzZXRSb290Tm9kZVByZWZhYiA9IGFzc2V0Um9vdE5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgIGlmIChhc3NldFJvb3ROb2RlUHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgYXNzZXRSb290Tm9kZVByZWZhYi5pbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcmV0ID0gcHJlZmFiVXRpbHMuZ2VuZXJhdGVQcmVmYWJEYXRhRnJvbU5vZGUoYXNzZXRSb290Tm9kZSk7XG5cbiAgICAgICAgICAgIGlmICghcmV0KSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkRhdGEgPSByZXQucHJlZmFiRGF0YTtcblxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFtvdXRNb3N0UHJlZmFiSW5mby5hc3NldC5fdXVpZF0pO1xuXG4gICAgICAgICAgICBpZiAoIWluZm8pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICBwcmVmYWJVdGlscy5maXJlQmVmb3JlQ2hhbmdlTXNnKG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpO1xuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZGVsZXRlUmVtb3ZlZENvbXBvbmVudChvdXRNb3N0UHJlZmFiSW5zdGFuY2UsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcblxuICAgICAgICAgICAgYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ2NyZWF0ZUFzc2V0JywgW3tcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IGluZm8uc291cmNlLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByZWZhYkRhdGEsXG4gICAgICAgICAgICAgICAgb3ZlcndyaXRlOiB0cnVlXG4gICAgICAgICAgICB9XSk7XG5cbiAgICAgICAgICAgIC8vIGNjZS5TY2VuZUZhY2FkZU1hbmFnZXIuYWJvcnRTbmFwc2hvdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBub2RlVVVJRCxcbiAgICAgICAgICAgICAgICBjb21wSW5kZXgsXG4gICAgICAgICAgICAgICAgY29tcERhdGEsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdW5kbyBBcHBseVJlbW92ZWRDb21wb25lbnQg5pON5L2cXG4gICAgICogQHBhcmFtIElSZW1vdmVkQ29tcG9uZW50SW5mbyDnp7vpmaTnmoRjb21wb25lbnTkv6Hmga9cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgdW5kb0FwcGx5UmVtb3ZlZENvbXBvbmVudChyZW1vdmVkQ29tcEluZm86IElSZW1vdmVkQ29tcG9uZW50SW5mbykge1xuICAgICAgICBpZiAoIXJlbW92ZWRDb21wSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVNZ3IuZ2V0Tm9kZShyZW1vdmVkQ29tcEluZm8ubm9kZVVVSUQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8obm9kZSk7XG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUgfCBudWxsID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICBpZiAoIW91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXJnZXRQYXRoOiBzdHJpbmdbXSA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8udGFyZ2V0UGF0aDtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2U6IFByZWZhYi5fdXRpbHMuUHJlZmFiSW5zdGFuY2UgfCB1bmRlZmluZWQgPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluZm8gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmIChvdXRNb3N0UHJlZmFiSW5zdGFuY2UgJiYgb3V0TW9zdFByZWZhYkluZm8gJiYgb3V0TW9zdFByZWZhYkluZm8uYXNzZXQpIHtcbiAgICAgICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZUxvY2FsSUQgPSB0YXJnZXRQYXRoLnNsaWNlKCk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBub2RlTG9jYWxJRC5wdXNoKG5vZGVbJ19wcmVmYWInXS5maWxlSWQpO1xuICAgICAgICAgICAgY29uc3QgY29tcEZpbGVJRCA9IHJlbW92ZWRDb21wSW5mby5jb21wRGF0YS5fX3ByZWZhYiEuZmlsZUlkO1xuICAgICAgICAgICAgdGFyZ2V0UGF0aC5wdXNoKGNvbXBGaWxlSUQpO1xuXG4gICAgICAgICAgICBjb25zdCBhc3NldFJvb3ROb2RlID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiQXNzZXROb2RlSW5zdGFuY2Uob3V0TW9zdFByZWZhYkluZm8pO1xuICAgICAgICAgICAgaWYgKCFhc3NldFJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlSW5Bc3NldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldChub2RlTG9jYWxJRCwgYXNzZXRSb290Tm9kZSk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBub2RlSW5Bc3NldC5fYWRkQ29tcG9uZW50QXQocmVtb3ZlZENvbXBJbmZvLmNvbXBEYXRhLCByZW1vdmVkQ29tcEluZm8uY29tcEluZGV4KTtcblxuICAgICAgICAgICAgY29uc3QgcmV0ID0gcHJlZmFiVXRpbHMuZ2VuZXJhdGVQcmVmYWJEYXRhRnJvbU5vZGUoYXNzZXRSb290Tm9kZSk7XG5cbiAgICAgICAgICAgIGlmICghcmV0KSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlBc3NldEluZm8nLCBbb3V0TW9zdFByZWZhYkluZm8uYXNzZXQuX3V1aWRdKTtcbiAgICAgICAgICAgIGlmICghaW5mbykgcmV0dXJuO1xuXG4gICAgICAgICAgICBwcmVmYWJVdGlscy5maXJlQmVmb3JlQ2hhbmdlTXNnKG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpO1xuICAgICAgICAgICAgcHJlZmFiVXRpbHMuYWRkUmVtb3ZlZENvbXBvbmVudChvdXRNb3N0UHJlZmFiSW5zdGFuY2UsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcblxuICAgICAgICAgICAgYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ2NyZWF0ZUFzc2V0JywgW3tcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IGluZm8uc291cmNlLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJldC5wcmVmYWJEYXRhLFxuICAgICAgICAgICAgICAgIG92ZXJ3cml0ZTogdHJ1ZVxuICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgLy8gY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5hYm9ydFNuYXBzaG90KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgYXBwbHlSZW1vdmVkQ29tcG9uZW50KG5vZGVVVUlEOiBzdHJpbmcsIGZpbGVJRDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnN0IGNvbW1hbmQgPSBuZXcgQXBwbHlSZW1vdmVDb21wb25lbnRDb21tYW5kKFxuICAgICAgICAvLyAgICAgdGhpcy51bmRvQXBwbHlSZW1vdmVkQ29tcG9uZW50LmJpbmQodGhpcyksIHRoaXMuZG9BcHBseVJlbW92ZWRDb21wb25lbnQuYmluZCh0aGlzKSk7XG4gICAgICAgIC8vIGNvbnN0IHVuZG9JRCA9IGNjZS5TY2VuZUZhY2FkZU1hbmFnZXIuYmVnaW5SZWNvcmRpbmcobm9kZVVVSUQsIHsgY3VzdG9tQ29tbWFuZDogY29tbWFuZCB9KTtcbiAgICAgICAgY29uc3QgcmVtb3ZlZENvbXBJbmZvID0gYXdhaXQgdGhpcy5kb0FwcGx5UmVtb3ZlZENvbXBvbmVudChub2RlVVVJRCwgZmlsZUlEKTtcbiAgICAgICAgaWYgKHJlbW92ZWRDb21wSW5mbykge1xuICAgICAgICAgICAgLy8gY29tbWFuZC5yZW1vdmVkQ29tcEluZm8gPSByZW1vdmVkQ29tcEluZm87XG4gICAgICAgICAgICAvLyBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyLmVuZFJlY29yZGluZyh1bmRvSUQpO1xuICAgICAgICAgICAgLy8gY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5zbmFwc2hvdCgpO1xuICAgICAgICAgICAgLy8gY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5hYm9ydFNuYXBzaG90KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyLmNhbmNlbFJlY29yZGluZyh1bmRvSUQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNsb25lQ29tcG9uZW50VG9Ob2RlKG5vZGU6IE5vZGUsIGNsb25lZENvbXA6IENvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBjb3B5Q29tcER1bXAgPSBkdW1wVXRpbC5kdW1wQ29tcG9uZW50KGNsb25lZENvbXApO1xuICAgICAgICAvLyDkuI3opoHlkIzmraVfb2JqRmxhZ3PvvIzlkKbliJnlm6DkuLrmsqHmnIlvbkVuYWJsZeeahOagh+iusOS8muWvvOiHtG9uRGlzYWJsZeS4jeiiq+iwg+eUqFxuICAgICAgICAvLyBkZWxldGUgY29weUNvbXBEdW1wLnZhbHVlLl9vYmpGbGFncztcbiAgICAgICAgY29uc3QgbmV3Q29tcCA9IG5vZGUuYWRkQ29tcG9uZW50KGpzLmdldENsYXNzTmFtZShjbG9uZWRDb21wKSk7XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cztcbiAgICAgICAgaWYgKGNvbXBvbmVudHMgJiYgY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IGNvbXBvbmVudHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RDb21wID0gY29tcG9uZW50c1tsYXN0SW5kZXhdO1xuICAgICAgICAgICAgaWYgKGxhc3RDb21wICYmIGxhc3RDb21wID09PSBuZXdDb21wKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZHVtcFV0aWwucmVzdG9yZVByb3BlcnR5KG5vZGUsIGBfX2NvbXBzX18uJHtsYXN0SW5kZXh9YCwgY29weUNvbXBEdW1wKTtcblxuICAgICAgICAgICAgICAgIC8vIE1pc3NpbmdTY3JpcHTnmoRfJGVyaWFsaXplZOimgeeJueauiui/mOWOn1xuICAgICAgICAgICAgICAgIGlmIChuZXdDb21wIGluc3RhbmNlb2YgTWlzc2luZ1NjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDov5nph4xfJGVyaWFsaXplZOWboOS4uuaciW5vZGXlvJXnlKjmsqHms5XnroDljZXnmoRjbG9uZeWHuuS4gOS7ve+8jOWPquiDvVxuICAgICAgICAgICAgICAgICAgICAvLyDlhYjnlKhwcmVmYWJBc3NldOS4iueahGNvbXBvbmVudOi6q+S4iueahOmCo+S7veaVsOaNrlxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgICAgICAgICAgICAgICAgIG5ld0NvbXAuXyRlcmlhbGl6ZWQgPSBjbG9uZWRDb21wLl8kZXJpYWxpemVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaSpOmUgCByZW1vdmVkQ29tcG9uZW5077yM5Lya5bCGUHJlZmFiQXNzZXTkuK3nmoRDb21wb25lbnTov5jljp/liLDlvZPliY3oioLngrnkuIpcbiAgICAgKiBAcGFyYW0gbm9kZVVVSUQgbm9kZeeahFVVSURcbiAgICAgKiBAcGFyYW0gZmlsZUlEIGNvbXBvbmVudOeahGZpbGVJRFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyByZXZlcnRSZW1vdmVkQ29tcG9uZW50KG5vZGVVVUlEOiBzdHJpbmcsIGZpbGVJRDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2RlTWdyLmdldE5vZGUobm9kZVVVSUQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8obm9kZSk7XG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU6IE5vZGUgfCBudWxsID0gb3V0TW9zdFByZWZhYkluc3RhbmNlSW5mby5vdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlO1xuICAgICAgICBpZiAoIW91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXJnZXRQYXRoOiBzdHJpbmdbXSA9IG91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8udGFyZ2V0UGF0aDtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2U6IFByZWZhYi5fdXRpbHMuUHJlZmFiSW5zdGFuY2UgfCB1bmRlZmluZWQgPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ10/Lmluc3RhbmNlO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluZm8gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ107XG4gICAgICAgIGlmIChvdXRNb3N0UHJlZmFiSW5zdGFuY2UgJiYgb3V0TW9zdFByZWZhYkluZm8gJiYgb3V0TW9zdFByZWZhYkluZm8uYXNzZXQpIHtcbiAgICAgICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpO1xuICAgICAgICAgICAgdGFyZ2V0UGF0aC5wdXNoKGZpbGVJRCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0Um9vdE5vZGUgPSBpbnN0YW50aWF0ZShvdXRNb3N0UHJlZmFiSW5mby5hc3NldCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0Um9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zdCB1bmRvSWQgPSBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyLmJlZ2luUmVjb3JkaW5nKFtvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlLnV1aWQsIG5vZGVVVUlEXSk7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRDb21wSW5Bc3NldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldCh0YXJnZXRQYXRoLCBhc3NldFJvb3ROb2RlKSBhcyBDb21wb25lbnQ7XG5cbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cobm9kZSk7XG4gICAgICAgICAgICB0aGlzLmlzUmV2ZXJ0aW5nUmVtb3ZlZENvbXBvbmVudHMgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jbG9uZUNvbXBvbmVudFRvTm9kZShub2RlLCB0YXJnZXRDb21wSW5Bc3NldCk7XG4gICAgICAgICAgICB0aGlzLmlzUmV2ZXJ0aW5nUmVtb3ZlZENvbXBvbmVudHMgPSBmYWxzZTtcbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVDaGFuZ2VNc2cobm9kZSk7XG5cbiAgICAgICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSk7XG4gICAgICAgICAgICBwcmVmYWJVdGlscy5kZWxldGVSZW1vdmVkQ29tcG9uZW50KG91dE1vc3RQcmVmYWJJbnN0YW5jZSwgdGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICBwcmVmYWJVdGlscy5maXJlQ2hhbmdlTXNnKG91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGUpO1xuICAgICAgICAgICAgLy8gY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5lbmRSZWNvcmRpbmcodW5kb0lkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVNb3VudGVkQ29tcG9uZW50cyhub2RlOiBOb2RlKSB7XG4gICAgICAgIC8vIFByZWZhYkluc3RhbmNl5Lit5aKe5YqgL+WIoOmZpENvbXBvbmVudO+8jOmcgOimgeabtOaWsG1vdW50ZWRDb21wb25lbnRzXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgaWYgKCFwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlkJHkuIrmn6Xmib5QcmVmYWJJbnN0YW5jZei3r+W+hFxuICAgICAgICBjb25zdCBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvID0gcHJlZmFiVXRpbHMuZ2V0T3V0TW9zdFByZWZhYkluc3RhbmNlSW5mbyhub2RlKTtcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTogTm9kZSB8IG51bGwgPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvLm91dE1vc3RQcmVmYWJJbnN0YW5jZU5vZGU7XG4gICAgICAgIGlmICghb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aDogc3RyaW5nW10gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VJbmZvLnRhcmdldFBhdGg7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgb3V0TW9zdFByZWZhYkluZm8gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlWydfcHJlZmFiJ107XG4gICAgICAgIGNvbnN0IG91dE1vc3RQcmVmYWJJbnN0YW5jZTogUHJlZmFiSW5zdGFuY2UgfCB1bmRlZmluZWQgPSBvdXRNb3N0UHJlZmFiSW5mbz8uaW5zdGFuY2U7XG5cbiAgICAgICAgaWYgKCFvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlIHx8ICFvdXRNb3N0UHJlZmFiSW5mbyB8fCAhb3V0TW9zdFByZWZhYkluc3RhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldFJvb3ROb2RlID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiQXNzZXROb2RlSW5zdGFuY2Uob3V0TW9zdFByZWZhYkluZm8pO1xuICAgICAgICBpZiAoIWFzc2V0Um9vdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldFBhdGguc3BsaWNlKDAsIDEpOyAvLyDkuI3pnIDopoHlrZjmnIDlpJblsYLnmoRQcmVmYWJJbnN0YW5jZeeahGZpbGVJRO+8jOaWueS+v292ZXJyaWRl5Y+v5Lul5ZyoUHJlZmFiSW5zdGFuY2XlpI3liLblkI7lpI3nlKggIFxuICAgICAgICB0YXJnZXRQYXRoLnB1c2gocHJlZmFiSW5mby5maWxlSWQpO1xuXG4gICAgICAgIGNvbnN0IG5vZGVJbkFzc2V0OiBOb2RlID0gcHJlZmFiVXRpbHMuZ2V0VGFyZ2V0KHRhcmdldFBhdGgsIGFzc2V0Um9vdE5vZGUpIGFzIE5vZGU7XG4gICAgICAgIGlmICghbm9kZUluQXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb21wc0ZpbGVJRHMgPSBub2RlSW5Bc3NldC5jb21wb25lbnRzLm1hcCgoY29tcCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXAuX19wcmVmYWI/LmZpbGVJZDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbW91bnRlZENvbXBvbmVudHM6IENvbXBvbmVudFtdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5jb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgY29tcFByZWZhYkluZm8gPSBjb21wLl9fcHJlZmFiO1xuICAgICAgICAgICAgLy8g6Z2eUHJlZmFi5Lit55qEY29tcG9uZW50XG4gICAgICAgICAgICBpZiAoIWNvbXBQcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHMucHVzaChjb21wKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5LiN5ZyocHJlZmFiQXNzZXTkuK3nmoRjb21wb25lbnTvvIzopoHliqDliLBtb3VudGVkQ29tcG9uZW50c1xuICAgICAgICAgICAgICAgIGlmICghY29tcHNGaWxlSURzLmluY2x1ZGVzKGNvbXAuX19wcmVmYWI/LmZpbGVJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gbW91bnRlZFJvb3TkuLrnqbrooajnpLrkuLrmlrDliqDnmoRDb21wb25lbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gMi4gbW91bnRlZFJvb3TkuI3kuLrnqbrpnIDopoHmn6XnnIvmmK/kuI3mmK/mjILlnKjov5nkuKpQcmVmYWJJbnN0YW5jZeiKgueCueS4i+eahO+8jOWboOS4uuWPr+iDveaYr+aMguWcqFxuICAgICAgICAgICAgICAgICAgICAvLyDph4zlsYJQcmVmYWJJbnN0YW5jZemHjCzov5nph4zlsLHkuI3lupTor6Xph43lpI3mt7vliqBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW91bnRlZFJvb3QgPSBwcmVmYWJVdGlscy5nZXRNb3VudGVkUm9vdChjb21wKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtb3VudGVkUm9vdCB8fCBtb3VudGVkUm9vdCA9PT0gb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHMucHVzaChjb21wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZhYlV0aWxzLmZpcmVCZWZvcmVDaGFuZ2VNc2cob3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSk7XG5cbiAgICAgICAgaWYgKG1vdW50ZWRDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG1vdW50ZWRDb21wb25lbnRzSW5mbyA9IHByZWZhYlV0aWxzLmdldFByZWZhYkluc3RhbmNlTW91bnRlZENvbXBvbmVudHMob3V0TW9zdFByZWZhYkluc3RhbmNlLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgIG1vdW50ZWRDb21wb25lbnRzSW5mby5jb21wb25lbnRzID0gbW91bnRlZENvbXBvbmVudHM7XG4gICAgICAgICAgICBtb3VudGVkQ29tcG9uZW50c0luZm8uY29tcG9uZW50cy5mb3JFYWNoKChjb21wKSA9PiB7XG4gICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QoY29tcCwgb3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0TW9zdFByZWZhYkluc3RhbmNlLm1vdW50ZWRDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcEluZm8gPSBvdXRNb3N0UHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBJbmZvLmlzVGFyZ2V0KHRhcmdldFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBJbmZvLmNvbXBvbmVudHMuZm9yRWFjaCgoY29tcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QoY29tcCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgb3V0TW9zdFByZWZhYkluc3RhbmNlLm1vdW50ZWRDb21wb25lbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJlZmFiVXRpbHMuZmlyZUNoYW5nZU1zZyhvdXRNb3N0UHJlZmFiSW5zdGFuY2VOb2RlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXBwbHlNb3VudGVkQ29tcG9uZW50cyhub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlOiBOb2RlID0gbm9kZTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSByb290Tm9kZVsnX3ByZWZhYiddO1xuICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmVmYWJJbnN0YW5jZSA9IHByZWZhYkluZm8uaW5zdGFuY2U7XG4gICAgICAgIGlmICghcHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1vdW50ZWRDb21wc01hcCA9IG5ldyBNYXA8c3RyaW5nW10sIElDb21wb25lbnRQcmVmYWJEYXRhPigpO1xuICAgICAgICBjb25zdCBtb3VudGVkQ29tcG9uZW50cyA9IHByZWZhYkluc3RhbmNlLm1vdW50ZWRDb21wb25lbnRzO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW91bnRlZENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG1vdW50ZWRDb21wb25lbnRJbmZvID0gbW91bnRlZENvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRJbmZvID0gbW91bnRlZENvbXBvbmVudEluZm8udGFyZ2V0SW5mbztcbiAgICAgICAgICAgIGlmICghdGFyZ2V0SW5mbykgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHByZWZhYlV0aWxzLmdldFRhcmdldCh0YXJnZXRJbmZvLmxvY2FsSUQsIHJvb3ROb2RlKSBhcyBOb2RlO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAvLyDmioptb3VudGVkQ29tcG9uZW50SW5mb+S4reeahOe7hOS7tuWKoOWIsFByZWZhYkFzc2V05LitXG4gICAgICAgICAgICBtb3VudGVkQ29tcG9uZW50SW5mby5jb21wb25lbnRzLmZvckVhY2goKG1vdW50ZWRDb21wKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFtb3VudGVkQ29tcC5fX3ByZWZhYikge1xuICAgICAgICAgICAgICAgICAgICBtb3VudGVkQ29tcC5fX3ByZWZhYiA9IG5ldyBDb21wUHJlZmFiSW5mbygpO1xuICAgICAgICAgICAgICAgICAgICBtb3VudGVkQ29tcC5fX3ByZWZhYi5maWxlSWQgPSBtb3VudGVkQ29tcC51dWlkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDoioLngrnmjILovb3ltYzlpZfpooTliLbkvZPouqvkuIpcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0SW5mby5sb2NhbElELmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mbyA9IHByZWZhYlV0aWxzLmdldE91dE1vc3RQcmVmYWJJbnN0YW5jZUluZm8odGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHByZWZhYkluc3RhbmNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0Tm9kZSA9IG5lc3RlZEluc3RQcmVmYWJJbnN0YW5jZUluZm8ub3V0TW9zdFByZWZhYkluc3RhbmNlTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXN0ZWRJbnN0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0UHJlZmFiSW5mbyA9IG5lc3RlZEluc3ROb2RlWydfcHJlZmFiJ107XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmVzdGVkSW5zdFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UgPSBuZXN0ZWRJbnN0UHJlZmFiSW5mby5pbnN0YW5jZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UHJlZmFiSW5mbyA9IHRhcmdldFsnX3ByZWZhYiddO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldFByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDmm7TmlrDpooTliLbkvZPmlbDmja7vvIxsb2NhbElE5LuO56ys5LqM5Liq5byA5aeLKOaVsOaNruWtmOWcqOW1jOWll+mihOWItuS9k+WunuS+i+S4iu+8jOaJgOS7peWPr+S7peW/veeVpeesrOS4gOS4qmZpbGVJRCjoh6rouqspKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3VudGVkTm9kZVBhdGggPSBuZXN0ZWRJbnN0UHJlZmFiSW5zdGFuY2VJbmZvLnRhcmdldFBhdGguc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWROb2RlUGF0aC5wdXNoKHRhcmdldFByZWZhYkluZm8uZmlsZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkTW91bnRlZENvbXBvbmVudEluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWJJbnN0YW5jZU1vdW50ZWRDb21wb25lbnRzKG5lc3RlZEluc3RQcmVmYWJJbnN0YW5jZSwgbW91bnRlZE5vZGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgbmVzdGVkTW91bnRlZENvbXBvbmVudEluZm8uY29tcG9uZW50cy5wdXNoKG1vdW50ZWRDb21wKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXRpbHMuc2V0TW91bnRlZFJvb3QobW91bnRlZENvbXAsIG5lc3RlZEluc3ROb2RlKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDorrDlvZV1bmRv57Si5byV5pWw5o2uLOS7juagueiKgueCueW8gOWni+aJvu+8jOaJgOS7pemcgOimgeesrOS4gOS4qmZpbGVJRFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gbmVzdGVkSW5zdFByZWZhYkluc3RhbmNlSW5mby50YXJnZXRQYXRoLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFBhdGgucHVzaChtb3VudGVkQ29tcC5fX3ByZWZhYi5maWxlSWQpO1xuICAgICAgICAgICAgICAgICAgICBtb3VudGVkQ29tcHNNYXAuc2V0KHRhcmdldFBhdGgsIHsgcHJlZmFiSW5mbzogbnVsbCB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtb3VudGVkQ29tcHNNYXAuc2V0KFttb3VudGVkQ29tcC5fX3ByZWZhYi5maWxlSWRdLCB7IHByZWZhYkluZm86IG51bGwgfSk7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYlV0aWxzLnNldE1vdW50ZWRSb290KG1vdW50ZWRDb21wLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJlZmFiSW5zdGFuY2UubW91bnRlZENvbXBvbmVudHMgPSBbXTtcblxuICAgICAgICByZXR1cm4gbW91bnRlZENvbXBzTWFwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudE9wZXJhdGlvbiA9IG5ldyBDb21wb25lbnRPcGVyYXRpb24oKTtcbiJdfQ==