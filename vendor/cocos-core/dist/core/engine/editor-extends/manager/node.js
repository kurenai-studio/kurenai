'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const findLast_1 = __importDefault(require("lodash/findLast"));
const ObjectWalker = __importStar(require("../missing-reporter/object-walker"));
const utils_1 = __importDefault(require("../../../base/utils"));
const node_path_manager_1 = __importDefault(require("./node-path-manager"));
const path_utils_1 = require("./path-utils");
class NodeManager extends events_1.EventEmitter {
    // 当前在场景树中的节点集合,包括在层级管理器中隐藏的
    allow = false;
    _map = {};
    _parentChildren = new Map(); // 父节点UUID -> 子节点UUID集合
    // 被删除节点集合,为了undo，编辑器不会把Node删除
    // _recycle: { [index: string]: any } = {};
    /**
     * 新增一个节点，当引擎将一个节点添加到场景树中，同时会遍历子节点，递归的调用这个方法。
     * @param uuid
     * @param node
     */
    add(uuid, node) {
        if (!this.allow) {
            return;
        }
        const nameError = (0, path_utils_1.validateNodeName)(node.name);
        if (nameError) {
            console.warn(`Node: preserving legacy node name "${node.name}". ${nameError}`);
        }
        this._map[uuid] = node;
        const parentUuid = node.parent ? node.parent.uuid : undefined;
        // 生成唯一路径
        node_path_manager_1.default.generateUniquePath(uuid, node.name, parentUuid);
        // 维护父子关系
        if (parentUuid) {
            if (!this._parentChildren.has(parentUuid)) {
                this._parentChildren.set(parentUuid, new Set());
            }
            this._parentChildren.get(parentUuid).add(uuid);
        }
        try {
            this.emit('add', uuid, node);
        }
        catch (error) {
            console.error(error);
        }
    }
    /**
     * 删除一个节点，当引擎将一个节点从场景树中移除，同时会遍历子节点，递归的调用这个方法。
     * @param uuid
     */
    remove(uuid) {
        if (!this.allow) {
            return;
        }
        if (!this._map[uuid]) {
            return;
        }
        const node = this._map[uuid];
        const parentUuid = this._getParentUuid(uuid);
        node_path_manager_1.default.remove(uuid, parentUuid);
        // 清理父子关系
        this._cleanupParentRelations(uuid);
        // this._recycle[uuid] = this._map[uuid];
        delete this._map[uuid];
        try {
            this.emit('remove', uuid, node);
        }
        catch (error) {
            console.error(error);
        }
    }
    /**
     * 清空所有数据
     */
    clear() {
        if (!this.allow) {
            return;
        }
        this._map = {};
        node_path_manager_1.default.clear();
        this._parentChildren.clear();
        // this._recycle = {};
    }
    /**
     * Update node name and path.
     * API entry points reject illegal names, but undo/redo may restore a legacy name directly.
     * Preserve that display name and let NodePathManager sanitize only its system path segment.
     */
    updateNodeName(uuid, newName) {
        if (!this._map[uuid]) {
            return;
        }
        const error = (0, path_utils_1.validateNodeName)(newName);
        if (error) {
            console.warn(`Node: preserving legacy node name "${newName}". ${error}`);
        }
        const node = this._map[uuid];
        // 获取父节点UUID
        const parentUuid = this._getParentUuid(uuid);
        node_path_manager_1.default.updateUuid(uuid, newName, parentUuid);
        // 更新节点对象的名称
        node.name = newName;
    }
    /**
     * 更新节点父级关系，并同步该节点及其后代的路径索引。
     */
    updateNodeParent(uuid, newParentUuid) {
        const node = this._map[uuid];
        if (!node) {
            return '';
        }
        const oldParentUuid = this._getParentUuid(uuid);
        if (oldParentUuid === newParentUuid) {
            return node_path_manager_1.default.getNodePath(uuid);
        }
        const newPath = node_path_manager_1.default.move(uuid, node.name, newParentUuid, oldParentUuid);
        if (!newPath) {
            return '';
        }
        if (oldParentUuid) {
            const oldChildren = this._parentChildren.get(oldParentUuid);
            oldChildren?.delete(uuid);
        }
        if (newParentUuid) {
            if (!this._parentChildren.has(newParentUuid)) {
                this._parentChildren.set(newParentUuid, new Set());
            }
            this._parentChildren.get(newParentUuid).add(uuid);
        }
        return newPath;
    }
    /**
     * 获取一个节点数据，查的范围包括被删除的节点
     * @param uuid
     */
    getNode(uuid) {
        return this._map[uuid] ?? null;
    }
    getNodeByPath(path) {
        const normalized = (0, path_utils_1.normalizeNodePath)(path);
        if (normalized === '/') {
            return cc.director.getScene() ?? null;
        }
        const result = node_path_manager_1.default.getNodeResult(normalized);
        if (result.error === 'Ambiguous') {
            throw new Error(`The path "${path}" is ambiguous. Multiple nodes found with case-insensitive match.`);
        }
        if (result.error === 'Not found') {
            return null;
        }
        if (result.uuid) {
            return this.getNode(result.uuid);
        }
        return null;
    }
    getNodePath(node) {
        if (!node?.uuid) {
            return '';
        }
        const path = node_path_manager_1.default.getNodePath(node.uuid);
        if (!path) {
            const scene = cc.director.getScene();
            return node === scene ? '/' : '';
        }
        return path;
    }
    getNodeUuidByPath(path) {
        const normalized = (0, path_utils_1.normalizeNodePath)(path);
        if (normalized === '/') {
            const scene = cc.director.getScene();
            return scene ? scene.uuid : null;
        }
        const uuid = node_path_manager_1.default.getNodeUuid(normalized);
        const node = uuid && this.getNode(uuid);
        return node ? node.uuid : null;
    }
    getNodeByPathOrThrow(path) {
        const node = this.getNodeByPath(path);
        if (!node) {
            throw new Error(`找不到路径为 '${path}' 的节点`);
        }
        return node;
    }
    getNodeUuidByPathOrThrow(nodePath) {
        const nodeUuid = this.getNodeUuidByPath(nodePath);
        if (!nodeUuid) {
            throw new Error(`找不到路径为 "${nodePath}" 的节点`);
        }
        return nodeUuid;
    }
    /**
     * 获取所有的节点数据
     */
    getNodes() {
        return this._map;
    }
    /**
     * 获取场景中使用了某个资源的节点
     * @param uuid asset uuid
     */
    getNodesByAsset(uuid) {
        const nodesUuid = [];
        if (!uuid) {
            return nodesUuid;
        }
        ObjectWalker.walkProperties(cc.director.getScene().children, (obj, key, value, parsedObjects) => {
            let isAsset = false;
            if (value._uuid) {
                isAsset = value._uuid.includes(uuid) || utils_1.default.UUID.compressUUID(value._uuid, true).includes(uuid);
            }
            let isScript = false;
            if (value.__scriptUuid) {
                isScript = value.__scriptUuid.includes(uuid) || utils_1.default.UUID.compressUUID(value.__scriptUuid, false).includes(uuid);
            }
            if (isAsset || isScript) {
                const node = (0, findLast_1.default)(parsedObjects, (item) => item instanceof cc.Node);
                if (node && !nodesUuid.includes(node.uuid)) {
                    nodesUuid.push(node.uuid);
                }
            }
        }, {
            dontSkipNull: false,
            ignoreSubPrefabHelper: true,
        });
        return nodesUuid;
    }
    /**
     * 获取所有在场景树中的节点数据
     */
    getNodesInScene() {
        return this._map;
    }
    changeNodeUUID(oldUUID, newUUID) {
        if (!newUUID || oldUUID === newUUID) {
            return;
        }
        const node = this._map[oldUUID];
        if (!node) {
            return;
        }
        node._id = newUUID;
        // 更新节点路径
        node_path_manager_1.default.changeUuid(oldUUID, newUUID);
        this._map[newUUID] = node;
        delete this._map[oldUUID];
        // 同步父子索引：替换父节点 children Set 中的旧 UUID
        for (const [, children] of this._parentChildren) {
            if (children.has(oldUUID)) {
                children.delete(oldUUID);
                children.add(newUUID);
                break;
            }
        }
        // 同步父子索引：如果本节点是父节点，将 key 迁移到新 UUID
        const childSet = this._parentChildren.get(oldUUID);
        if (childSet) {
            this._parentChildren.delete(oldUUID);
            this._parentChildren.set(newUUID, childSet);
        }
    }
    /**
    * 获取节点的父节点UUID
    */
    _getParentUuid(uuid) {
        for (const [parentUuid, children] of this._parentChildren.entries()) {
            if (children.has(uuid)) {
                return parentUuid;
            }
        }
    }
    /**
     * 清理父子关系
     */
    _cleanupParentRelations(uuid) {
        // 从父节点中移除
        const parentUuid = this._getParentUuid(uuid);
        if (parentUuid) {
            this._parentChildren.get(parentUuid)?.delete(uuid);
        }
        // 递归清理所有子节点
        const children = this._parentChildren.get(uuid);
        if (children) {
            for (const childUuid of children) {
                this.remove(childUuid);
            }
            this._parentChildren.delete(uuid);
        }
    }
}
exports.default = NodeManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9tYW5hZ2VyL25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdiLG1DQUFzQztBQUN0QywrREFBdUM7QUFFdkMsZ0ZBQWtFO0FBQ2xFLGdFQUF3QztBQUN4Qyw0RUFBOEM7QUFDOUMsNkNBQW1FO0FBR25FLE1BQXFCLFdBQVksU0FBUSxxQkFBWTtJQUNqRCw0QkFBNEI7SUFDNUIsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUVkLElBQUksR0FBNkIsRUFBRSxDQUFDO0lBRTVCLGVBQWUsR0FBNkIsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QjtJQUV0Riw4QkFBOEI7SUFDOUIsMkNBQTJDO0lBRTNDOzs7O09BSUc7SUFDSCxHQUFHLENBQUMsSUFBWSxFQUFFLElBQVU7UUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNkLE9BQU87UUFDWCxDQUFDO1FBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLE9BQU8sQ0FBQyxJQUFJLENBQ1Isc0NBQXNDLElBQUksQ0FBQyxJQUFJLE1BQU0sU0FBUyxFQUFFLENBQ25FLENBQUM7UUFDTixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7UUFFdkIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUM5RCxTQUFTO1FBQ1QsMkJBQVcsQ0FBQyxrQkFB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QUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUksUUFBUSxFQUFFLENBQUM7WUFDWCxLQUFLLE1BQU0sU0FBUyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBN1VELDhCQTZVQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHR5cGUgeyBOb2RlIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCBmaW5kTGFzdCBmcm9tICdsb2Rhc2gvZmluZExhc3QnO1xuXG5pbXBvcnQgKiBhcyBPYmplY3RXYWxrZXIgZnJvbSAnLi4vbWlzc2luZy1yZXBvcnRlci9vYmplY3Qtd2Fsa2VyJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCBwYXRoTWFuYWdlciBmcm9tICcuL25vZGUtcGF0aC1tYW5hZ2VyJztcbmltcG9ydCB7IG5vcm1hbGl6ZU5vZGVQYXRoLCB2YWxpZGF0ZU5vZGVOYW1lIH0gZnJvbSAnLi9wYXRoLXV0aWxzJztcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOb2RlTWFuYWdlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgLy8g5b2T5YmN5Zyo5Zy65pmv5qCR5Lit55qE6IqC54K56ZuG5ZCILOWMheaLrOWcqOWxgue6p+euoeeQhuWZqOS4remakOiXj+eahFxuICAgIGFsbG93ID0gZmFsc2U7XG5cbiAgICBfbWFwOiB7IFtpbmRleDogc3RyaW5nXTogYW55IH0gPSB7fTtcblxuICAgIHByaXZhdGUgX3BhcmVudENoaWxkcmVuOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSBuZXcgTWFwKCk7IC8vIOeItuiKgueCuVVVSUQgLT4g5a2Q6IqC54K5VVVJROmbhuWQiFxuXG4gICAgLy8g6KKr5Yig6Zmk6IqC54K56ZuG5ZCILOS4uuS6hnVuZG/vvIznvJbovpHlmajkuI3kvJrmiopOb2Rl5Yig6ZmkXG4gICAgLy8gX3JlY3ljbGU6IHsgW2luZGV4OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuXG4gICAgLyoqXG4gICAgICog5paw5aKe5LiA5Liq6IqC54K577yM5b2T5byV5pOO5bCG5LiA5Liq6IqC54K55re75Yqg5Yiw5Zy65pmv5qCR5Lit77yM5ZCM5pe25Lya6YGN5Y6G5a2Q6IqC54K577yM6YCS5b2S55qE6LCD55So6L+Z5Liq5pa55rOV44CCXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKiBAcGFyYW0gbm9kZVxuICAgICAqL1xuICAgIGFkZCh1dWlkOiBzdHJpbmcsIG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmFsbG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmFtZUVycm9yID0gdmFsaWRhdGVOb2RlTmFtZShub2RlLm5hbWUpO1xuICAgICAgICBpZiAobmFtZUVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgYE5vZGU6IHByZXNlcnZpbmcgbGVnYWN5IG5vZGUgbmFtZSBcIiR7bm9kZS5uYW1lfVwiLiAke25hbWVFcnJvcn1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXBbdXVpZF0gPSBub2RlO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSBub2RlLnBhcmVudCA/IG5vZGUucGFyZW50LnV1aWQgOiB1bmRlZmluZWQ7XG4gICAgICAgIC8vIOeUn+aIkOWUr+S4gOi3r+W+hFxuICAgICAgICBwYXRoTWFuYWdlci5nZW5lcmF0ZVVuaXF1ZVBhdGgodXVpZCwgbm9kZS5uYW1lLCBwYXJlbnRVdWlkKTtcblxuICAgICAgICAvLyDnu7TmiqTniLblrZDlhbPns7tcbiAgICAgICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fcGFyZW50Q2hpbGRyZW4uaGFzKHBhcmVudFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50Q2hpbGRyZW4uc2V0KHBhcmVudFV1aWQsIG5ldyBTZXQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnRDaGlsZHJlbi5nZXQocGFyZW50VXVpZCkhLmFkZCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2FkZCcsIHV1aWQsIG5vZGUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKDpmaTkuIDkuKroioLngrnvvIzlvZPlvJXmk47lsIbkuIDkuKroioLngrnku47lnLrmma/moJHkuK3np7vpmaTvvIzlkIzml7bkvJrpgY3ljoblrZDoioLngrnvvIzpgJLlvZLnmoTosIPnlKjov5nkuKrmlrnms5XjgIJcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHJlbW92ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLmFsbG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9tYXBbdXVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fbWFwW3V1aWRdO1xuICAgICAgICBjb25zdCBwYXJlbnRVdWlkID0gdGhpcy5fZ2V0UGFyZW50VXVpZCh1dWlkKTtcblxuICAgICAgICBwYXRoTWFuYWdlci5yZW1vdmUodXVpZCwgcGFyZW50VXVpZCk7XG5cbiAgICAgICAgLy8g5riF55CG54i25a2Q5YWz57O7XG4gICAgICAgIHRoaXMuX2NsZWFudXBQYXJlbnRSZWxhdGlvbnModXVpZCk7XG5cbiAgICAgICAgLy8gdGhpcy5fcmVjeWNsZVt1dWlkXSA9IHRoaXMuX21hcFt1dWlkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX21hcFt1dWlkXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlJywgdXVpZCwgbm9kZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa4heepuuaJgOacieaVsOaNrlxuICAgICAqL1xuICAgIGNsZWFyKCkge1xuICAgICAgICBpZiAoIXRoaXMuYWxsb3cpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXAgPSB7fTtcbiAgICAgICAgcGF0aE1hbmFnZXIuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fcGFyZW50Q2hpbGRyZW4uY2xlYXIoKTtcbiAgICAgICAgLy8gdGhpcy5fcmVjeWNsZSA9IHt9O1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIG5vZGUgbmFtZSBhbmQgcGF0aC5cbiAgICAgKiBBUEkgZW50cnkgcG9pbnRzIHJlamVjdCBpbGxlZ2FsIG5hbWVzLCBidXQgdW5kby9yZWRvIG1heSByZXN0b3JlIGEgbGVnYWN5IG5hbWUgZGlyZWN0bHkuXG4gICAgICogUHJlc2VydmUgdGhhdCBkaXNwbGF5IG5hbWUgYW5kIGxldCBOb2RlUGF0aE1hbmFnZXIgc2FuaXRpemUgb25seSBpdHMgc3lzdGVtIHBhdGggc2VnbWVudC5cbiAgICAgKi9cbiAgICB1cGRhdGVOb2RlTmFtZSh1dWlkOiBzdHJpbmcsIG5ld05hbWU6IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMuX21hcFt1dWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXJyb3IgPSB2YWxpZGF0ZU5vZGVOYW1lKG5ld05hbWUpO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgTm9kZTogcHJlc2VydmluZyBsZWdhY3kgbm9kZSBuYW1lIFwiJHtuZXdOYW1lfVwiLiAke2Vycm9yfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX21hcFt1dWlkXTtcblxuICAgICAgICAvLyDojrflj5bniLboioLngrlVVUlEXG4gICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSB0aGlzLl9nZXRQYXJlbnRVdWlkKHV1aWQpO1xuICAgICAgICBwYXRoTWFuYWdlci51cGRhdGVVdWlkKHV1aWQsIG5ld05hbWUsIHBhcmVudFV1aWQpO1xuXG4gICAgICAgIC8vIOabtOaWsOiKgueCueWvueixoeeahOWQjeensFxuICAgICAgICBub2RlLm5hbWUgPSBuZXdOYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOiKgueCueeItue6p+WFs+ezu++8jOW5tuWQjOatpeivpeiKgueCueWPiuWFtuWQjuS7o+eahOi3r+W+hOe0ouW8leOAglxuICAgICAqL1xuICAgIHVwZGF0ZU5vZGVQYXJlbnQodXVpZDogc3RyaW5nLCBuZXdQYXJlbnRVdWlkPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX21hcFt1dWlkXTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvbGRQYXJlbnRVdWlkID0gdGhpcy5fZ2V0UGFyZW50VXVpZCh1dWlkKTtcbiAgICAgICAgaWYgKG9sZFBhcmVudFV1aWQgPT09IG5ld1BhcmVudFV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoTWFuYWdlci5nZXROb2RlUGF0aCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5ld1BhdGggPSBwYXRoTWFuYWdlci5tb3ZlKHV1aWQsIG5vZGUubmFtZSwgbmV3UGFyZW50VXVpZCwgb2xkUGFyZW50VXVpZCk7XG4gICAgICAgIGlmICghbmV3UGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9sZFBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG9sZENoaWxkcmVuID0gdGhpcy5fcGFyZW50Q2hpbGRyZW4uZ2V0KG9sZFBhcmVudFV1aWQpO1xuICAgICAgICAgICAgb2xkQ2hpbGRyZW4/LmRlbGV0ZSh1dWlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV3UGFyZW50VXVpZCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9wYXJlbnRDaGlsZHJlbi5oYXMobmV3UGFyZW50VXVpZCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnRDaGlsZHJlbi5zZXQobmV3UGFyZW50VXVpZCwgbmV3IFNldCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhcmVudENoaWxkcmVuLmdldChuZXdQYXJlbnRVdWlkKSEuYWRkKHV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld1BhdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5LiA5Liq6IqC54K55pWw5o2u77yM5p+l55qE6IyD5Zu05YyF5ous6KKr5Yig6Zmk55qE6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKi9cbiAgICBnZXROb2RlKHV1aWQ6IHN0cmluZyk6IE5vZGUgfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcFt1dWlkXSA/PyBudWxsO1xuICAgIH1cblxuICAgIGdldE5vZGVCeVBhdGgocGF0aDogc3RyaW5nKTogTm9kZSB8IG51bGwge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplTm9kZVBhdGgocGF0aCk7XG4gICAgICAgIGlmIChub3JtYWxpemVkID09PSAnLycpIHtcbiAgICAgICAgICAgIHJldHVybiBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpID8/IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcGF0aE1hbmFnZXIuZ2V0Tm9kZVJlc3VsdChub3JtYWxpemVkKTtcbiAgICAgICAgaWYgKHJlc3VsdC5lcnJvciA9PT0gJ0FtYmlndW91cycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHBhdGggXCIke3BhdGh9XCIgaXMgYW1iaWd1b3VzLiBNdWx0aXBsZSBub2RlcyBmb3VuZCB3aXRoIGNhc2UtaW5zZW5zaXRpdmUgbWF0Y2guYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdC5lcnJvciA9PT0gJ05vdCBmb3VuZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQudXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZShyZXN1bHQudXVpZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0Tm9kZVBhdGgobm9kZTogTm9kZSk6IHN0cmluZyB7XG4gICAgICAgIGlmICghbm9kZT8udXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhdGggPSBwYXRoTWFuYWdlci5nZXROb2RlUGF0aChub2RlLnV1aWQpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlID09PSBzY2VuZSA/ICcvJyA6ICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGdldE5vZGVVdWlkQnlQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplTm9kZVBhdGgocGF0aCk7XG4gICAgICAgIGlmIChub3JtYWxpemVkID09PSAnLycpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIHJldHVybiBzY2VuZSA/IHNjZW5lLnV1aWQgOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHV1aWQgPSBwYXRoTWFuYWdlci5nZXROb2RlVXVpZChub3JtYWxpemVkKTtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHV1aWQgJiYgdGhpcy5nZXROb2RlKHV1aWQpO1xuICAgICAgICByZXR1cm4gbm9kZSA/IG5vZGUudXVpZCA6IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0Tm9kZUJ5UGF0aE9yVGhyb3cocGF0aDogc3RyaW5nKTogTm9kZSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLmdldE5vZGVCeVBhdGgocGF0aCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmib7kuI3liLDot6/lvoTkuLogJyR7cGF0aH0nIOeahOiKgueCuWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIGdldE5vZGVVdWlkQnlQYXRoT3JUaHJvdyhub2RlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSB0aGlzLmdldE5vZGVVdWlkQnlQYXRoKG5vZGVQYXRoKTtcbiAgICAgICAgaWYgKCFub2RlVXVpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmib7kuI3liLDot6/lvoTkuLogXCIke25vZGVQYXRofVwiIOeahOiKgueCuWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlVXVpZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmiYDmnInnmoToioLngrnmlbDmja5cbiAgICAgKi9cbiAgICBnZXROb2RlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5blnLrmma/kuK3kvb/nlKjkuobmn5DkuKrotYTmupDnmoToioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCBhc3NldCB1dWlkXG4gICAgICovXG4gICAgZ2V0Tm9kZXNCeUFzc2V0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBub2Rlc1V1aWQ6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXNVdWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0V2Fsa2VyLndhbGtQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKS5jaGlsZHJlbixcbiAgICAgICAgICAgIChvYmo6IGFueSwga2V5OiBhbnksIHZhbHVlOiBhbnksIHBhcnNlZE9iamVjdHM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpc0Fzc2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLl91dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzQXNzZXQgPSB2YWx1ZS5fdXVpZC5pbmNsdWRlcyh1dWlkKSB8fCB1dGlscy5VVUlELmNvbXByZXNzVVVJRCh2YWx1ZS5fdXVpZCwgdHJ1ZSkuaW5jbHVkZXModXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGlzU2NyaXB0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLl9fc2NyaXB0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBpc1NjcmlwdCA9IHZhbHVlLl9fc2NyaXB0VXVpZC5pbmNsdWRlcyh1dWlkKSB8fCB1dGlscy5VVUlELmNvbXByZXNzVVVJRCh2YWx1ZS5fX3NjcmlwdFV1aWQsIGZhbHNlKS5pbmNsdWRlcyh1dWlkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNBc3NldCB8fCBpc1NjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gZmluZExhc3QocGFyc2VkT2JqZWN0cywgKGl0ZW06IGFueSkgPT4gaXRlbSBpbnN0YW5jZW9mIGNjLk5vZGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlICYmICFub2Rlc1V1aWQuaW5jbHVkZXMobm9kZS51dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNVdWlkLnB1c2gobm9kZS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZG9udFNraXBOdWxsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpZ25vcmVTdWJQcmVmYWJIZWxwZXI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBub2Rlc1V1aWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5omA5pyJ5Zyo5Zy65pmv5qCR5Lit55qE6IqC54K55pWw5o2uXG4gICAgICovXG4gICAgZ2V0Tm9kZXNJblNjZW5lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwO1xuICAgIH1cblxuICAgIGNoYW5nZU5vZGVVVUlEKG9sZFVVSUQ6IHN0cmluZywgbmV3VVVJRDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghbmV3VVVJRCB8fCBvbGRVVUlEID09PSBuZXdVVUlEKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fbWFwW29sZFVVSURdO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuX2lkID0gbmV3VVVJRDtcblxuICAgICAgICAvLyDmm7TmlrDoioLngrnot6/lvoRcbiAgICAgICAgcGF0aE1hbmFnZXIuY2hhbmdlVXVpZChvbGRVVUlELCBuZXdVVUlEKTtcblxuICAgICAgICB0aGlzLl9tYXBbbmV3VVVJRF0gPSBub2RlO1xuICAgICAgICBkZWxldGUgdGhpcy5fbWFwW29sZFVVSURdO1xuXG4gICAgICAgIC8vIOWQjOatpeeItuWtkOe0ouW8le+8muabv+aNoueItuiKgueCuSBjaGlsZHJlbiBTZXQg5Lit55qE5penIFVVSURcbiAgICAgICAgZm9yIChjb25zdCBbLCBjaGlsZHJlbl0gb2YgdGhpcy5fcGFyZW50Q2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbi5oYXMob2xkVVVJRCkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5kZWxldGUob2xkVVVJRCk7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uYWRkKG5ld1VVSUQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5ZCM5q2l54i25a2Q57Si5byV77ya5aaC5p6c5pys6IqC54K55piv54i26IqC54K577yM5bCGIGtleSDov4Hnp7vliLDmlrAgVVVJRFxuICAgICAgICBjb25zdCBjaGlsZFNldCA9IHRoaXMuX3BhcmVudENoaWxkcmVuLmdldChvbGRVVUlEKTtcbiAgICAgICAgaWYgKGNoaWxkU2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnRDaGlsZHJlbi5kZWxldGUob2xkVVVJRCk7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnRDaGlsZHJlbi5zZXQobmV3VVVJRCwgY2hpbGRTZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAqIOiOt+WPluiKgueCueeahOeItuiKgueCuVVVSURcbiAgICAqL1xuICAgIHByaXZhdGUgX2dldFBhcmVudFV1aWQodXVpZDogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgZm9yIChjb25zdCBbcGFyZW50VXVpZCwgY2hpbGRyZW5dIG9mIHRoaXMuX3BhcmVudENoaWxkcmVuLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmhhcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRVdWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riF55CG54i25a2Q5YWz57O7XG4gICAgICovXG4gICAgcHJpdmF0ZSBfY2xlYW51cFBhcmVudFJlbGF0aW9ucyh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLy8g5LuO54i26IqC54K55Lit56e76ZmkXG4gICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSB0aGlzLl9nZXRQYXJlbnRVdWlkKHV1aWQpO1xuICAgICAgICBpZiAocGFyZW50VXVpZCkge1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50Q2hpbGRyZW4uZ2V0KHBhcmVudFV1aWQpPy5kZWxldGUodXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpgJLlvZLmuIXnkIbmiYDmnInlrZDoioLngrlcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLl9wYXJlbnRDaGlsZHJlbi5nZXQodXVpZCk7XG4gICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZFV1aWQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZShjaGlsZFV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGFyZW50Q2hpbGRyZW4uZGVsZXRlKHV1aWQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19