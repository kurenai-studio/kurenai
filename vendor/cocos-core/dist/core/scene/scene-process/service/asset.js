"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetService = void 0;
const core_1 = require("./core");
const cc_1 = require("cc");
const asset_watcher_1 = require("./asset/asset-watcher");
const node_utils_1 = require("./node/node-utils");
let AssetService = class AssetService extends core_1.BaseService {
    /**
     * 主进程监听 asset 事件，所触发事件
     * @param uuid
     */
    getEditorSession() {
        return (0, core_1.queryRegisteredService)('Editor')?.getEditorSession?.() ?? null;
    }
    isCurrentEditorSession(session) {
        if (!session) {
            return true;
        }
        return (0, core_1.queryRegisteredService)('Editor')?.isCurrentEditorSession?.(session) ?? true;
    }
    async assetChanged(uuid) {
        const session = this.getEditorSession();
        if (!this.isCurrentEditorSession(session)) {
            return;
        }
        if (!this._preserveCurrentAnimationClipAsset(uuid)) {
            this.releaseAsset(uuid);
            await asset_watcher_1.assetWatcherManager.onAssetChanged(uuid);
        }
        if (this.isCurrentEditorSession(session)) {
            this.emit('asset:change', uuid);
        }
    }
    _preserveCurrentAnimationClipAsset(uuid) {
        const animationService = (0, core_1.queryRegisteredService)('Animation');
        return animationService?.preserveCurrentClipAssetForChange?.(uuid) === true;
    }
    /**
     * 主进程监听 asset 事件，所触发事件
     * @param uuid
     */
    async assetDeleted(uuid) {
        const session = this.getEditorSession();
        if (!this.isCurrentEditorSession(session)) {
            return;
        }
        asset_watcher_1.assetWatcherManager.onAssetDeleted(uuid);
        if (this.isCurrentEditorSession(session)) {
            this.emit('asset:deleted', uuid);
        }
    }
    onEditorOpened() {
        asset_watcher_1.assetWatcherManager.invalidate();
        // iterate all component
        const nodeObject = EditorExtends.Node.getNodes();
        for (const key in nodeObject) {
            const node = nodeObject[key];
            // 场景节点特殊处理
            if (node instanceof cc.Scene) {
                asset_watcher_1.assetWatcherManager.startWatch(node.globals);
            }
            else {
                if (node && !(0, node_utils_1.isEditorNode)(node)) {
                    node.components.forEach((component) => {
                        asset_watcher_1.assetWatcherManager.startWatch(component);
                    });
                }
            }
        }
    }
    onEditorClosed() {
        asset_watcher_1.assetWatcherManager.invalidate();
    }
    onEditorDisposed() {
        asset_watcher_1.assetWatcherManager.invalidate();
    }
    onNodeChanged(node) {
        node.components.forEach((component) => {
            asset_watcher_1.assetWatcherManager.stopWatch(component);
            asset_watcher_1.assetWatcherManager.startWatch(component);
        });
    }
    onComponentAdded(comp) {
        asset_watcher_1.assetWatcherManager.startWatch(comp);
    }
    onComponentRemoved(comp) {
        asset_watcher_1.assetWatcherManager.stopWatch(comp);
    }
    releaseAsset(assetUUID) {
        const asset = cc_1.assetManager.assets.get(assetUUID);
        if (asset) {
            // Hack: Prefab 需要把引用它的资源一起清除缓存，否则嵌套的 Prefab 不会及时更新
            if (asset instanceof cc_1.Prefab) {
                // 不可以先释放，会影响后续数据查询，比如 A->B->C，先释放B，那么A依赖查询就会失败
                const list = [];
                cc_1.assetManager.assets.forEach((cachedAsset, uuid) => {
                    const depsUUIDs = cc_1.assetManager.dependUtil.getDepsRecursively(uuid);
                    if (asset && depsUUIDs.includes(asset.uuid)) {
                        list.push(cachedAsset);
                    }
                });
                list.forEach((cachedAsset) => {
                    cc_1.assetManager.releaseAsset(cachedAsset);
                });
            }
            cc_1.assetManager.releaseAsset(asset);
        }
    }
};
exports.AssetService = AssetService;
exports.AssetService = AssetService = __decorate([
    (0, core_1.register)('Asset')
], AssetService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvYXNzZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaUNBQXVFO0FBRXZFLDJCQUFrRTtBQUNsRSx5REFBNEQ7QUFDNUQsa0RBQWlEO0FBSTFDLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSxrQkFBeUI7SUFDdkQ7OztPQUdHO0lBQ0ssZ0JBQWdCO1FBQ3BCLE9BQU8sSUFBQSw2QkFBc0IsRUFBd0IsUUFBUSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLElBQUksQ0FBQztJQUNqRyxDQUFDO0lBRU8sc0JBQXNCLENBQUMsT0FBc0M7UUFDakUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ1gsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELE9BQU8sSUFBQSw2QkFBc0IsRUFBd0IsUUFBUSxDQUFDLEVBQUUsc0JBQXNCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDOUcsQ0FBQztJQUVNLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBWTtRQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDeEMsT0FBTztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QixNQUFNLG1DQUFtQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLEVB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QVksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFO29CQUM5QyxNQUFNLFNBQVMsR0FBRyxpQkFBWSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkUsSUFBSSxLQUFLLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQzt3QkFDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDM0IsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7b0JBQ3pCLGlCQUFZLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMzQyxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFDRCxpQkFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUE7QUFwSFksb0NBQVk7dUJBQVosWUFBWTtJQUR4QixJQUFBLGVBQVEsRUFBQyxPQUFPLENBQUM7R0FDTCxZQUFZLENBb0h4QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VTZXJ2aWNlLCBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlLCByZWdpc3RlciB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBJQXNzZXRFdmVudHMsIElBc3NldFNlcnZpY2UgfSBmcm9tICcuLi8uLi9jb21tb24nO1xuaW1wb3J0IHsgQXNzZXQsIGFzc2V0TWFuYWdlciwgQ29tcG9uZW50LCBOb2RlLCBQcmVmYWIgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBhc3NldFdhdGNoZXJNYW5hZ2VyIH0gZnJvbSAnLi9hc3NldC9hc3NldC13YXRjaGVyJztcbmltcG9ydCB7IGlzRWRpdG9yTm9kZSB9IGZyb20gJy4vbm9kZS9ub2RlLXV0aWxzJztcbmltcG9ydCB0eXBlIHsgSUVkaXRvclNlc3Npb25TZXJ2aWNlLCBJRWRpdG9yU2Vzc2lvblNuYXBzaG90IH0gZnJvbSAnLi9jb3JlL2VkaXRvci1zZXNzaW9uJztcblxuQHJlZ2lzdGVyKCdBc3NldCcpXG5leHBvcnQgY2xhc3MgQXNzZXRTZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8SUFzc2V0RXZlbnRzPiBpbXBsZW1lbnRzIElBc3NldFNlcnZpY2Uge1xuICAgIC8qKlxuICAgICAqIOS4u+i/m+eoi+ebkeWQrCBhc3NldCDkuovku7bvvIzmiYDop6blj5Hkuovku7ZcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHByaXZhdGUgZ2V0RWRpdG9yU2Vzc2lvbigpOiBJRWRpdG9yU2Vzc2lvblNuYXBzaG90IHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlPElFZGl0b3JTZXNzaW9uU2VydmljZT4oJ0VkaXRvcicpPy5nZXRFZGl0b3JTZXNzaW9uPy4oKSA/PyBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNDdXJyZW50RWRpdG9yU2Vzc2lvbihzZXNzaW9uOiBJRWRpdG9yU2Vzc2lvblNuYXBzaG90IHwgbnVsbCk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlPElFZGl0b3JTZXNzaW9uU2VydmljZT4oJ0VkaXRvcicpPy5pc0N1cnJlbnRFZGl0b3JTZXNzaW9uPy4oc2Vzc2lvbikgPz8gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgYXNzZXRDaGFuZ2VkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBzZXNzaW9uID0gdGhpcy5nZXRFZGl0b3JTZXNzaW9uKCk7XG4gICAgICAgIGlmICghdGhpcy5pc0N1cnJlbnRFZGl0b3JTZXNzaW9uKHNlc3Npb24pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9wcmVzZXJ2ZUN1cnJlbnRBbmltYXRpb25DbGlwQXNzZXQodXVpZCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVsZWFzZUFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXRXYXRjaGVyTWFuYWdlci5vbkFzc2V0Q2hhbmdlZCh1dWlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc0N1cnJlbnRFZGl0b3JTZXNzaW9uKHNlc3Npb24pKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Fzc2V0OmNoYW5nZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIF9wcmVzZXJ2ZUN1cnJlbnRBbmltYXRpb25DbGlwQXNzZXQodXVpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvblNlcnZpY2UgPSBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlPHtcbiAgICAgICAgICAgIHByZXNlcnZlQ3VycmVudENsaXBBc3NldEZvckNoYW5nZT86ICh1dWlkOiBzdHJpbmcpID0+IGJvb2xlYW47XG4gICAgICAgIH0+KCdBbmltYXRpb24nKTtcbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvblNlcnZpY2U/LnByZXNlcnZlQ3VycmVudENsaXBBc3NldEZvckNoYW5nZT8uKHV1aWQpID09PSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS4u+i/m+eoi+ebkeWQrCBhc3NldCDkuovku7bvvIzmiYDop6blj5Hkuovku7ZcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBhc3NldERlbGV0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLmdldEVkaXRvclNlc3Npb24oKTtcbiAgICAgICAgaWYgKCF0aGlzLmlzQ3VycmVudEVkaXRvclNlc3Npb24oc2Vzc2lvbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhc3NldFdhdGNoZXJNYW5hZ2VyLm9uQXNzZXREZWxldGVkKHV1aWQpO1xuICAgICAgICBpZiAodGhpcy5pc0N1cnJlbnRFZGl0b3JTZXNzaW9uKHNlc3Npb24pKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Fzc2V0OmRlbGV0ZWQnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkVkaXRvck9wZW5lZCgpIHtcbiAgICAgICAgYXNzZXRXYXRjaGVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XG4gICAgICAgIC8vIGl0ZXJhdGUgYWxsIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBub2RlT2JqZWN0ID0gRWRpdG9yRXh0ZW5kcy5Ob2RlLmdldE5vZGVzKCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG5vZGVPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2RlT2JqZWN0W2tleV07XG5cbiAgICAgICAgICAgIC8vIOWcuuaZr+iKgueCueeJueauiuWkhOeQhlxuICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBjYy5TY2VuZSkge1xuICAgICAgICAgICAgICAgIGFzc2V0V2F0Y2hlck1hbmFnZXIuc3RhcnRXYXRjaChub2RlLmdsb2JhbHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZSAmJiAhaXNFZGl0b3JOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY29tcG9uZW50cy5mb3JFYWNoKChjb21wb25lbnQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRXYXRjaGVyTWFuYWdlci5zdGFydFdhdGNoKGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkVkaXRvckNsb3NlZCgpIHtcbiAgICAgICAgYXNzZXRXYXRjaGVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yRGlzcG9zZWQoKSB7XG4gICAgICAgIGFzc2V0V2F0Y2hlck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVDaGFuZ2VkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgbm9kZS5jb21wb25lbnRzLmZvckVhY2goKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgYXNzZXRXYXRjaGVyTWFuYWdlci5zdG9wV2F0Y2goY29tcG9uZW50KTtcbiAgICAgICAgICAgIGFzc2V0V2F0Y2hlck1hbmFnZXIuc3RhcnRXYXRjaChjb21wb25lbnQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnRBZGRlZChjb21wOiBDb21wb25lbnQpIHtcbiAgICAgICAgYXNzZXRXYXRjaGVyTWFuYWdlci5zdGFydFdhdGNoKGNvbXApO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkNvbXBvbmVudFJlbW92ZWQoY29tcDogQ29tcG9uZW50KSB7XG4gICAgICAgIGFzc2V0V2F0Y2hlck1hbmFnZXIuc3RvcFdhdGNoKGNvbXApO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWxlYXNlQXNzZXQoYXNzZXRVVUlEOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSBhc3NldE1hbmFnZXIuYXNzZXRzLmdldChhc3NldFVVSUQpO1xuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIC8vIEhhY2s6IFByZWZhYiDpnIDopoHmiorlvJXnlKjlroPnmoTotYTmupDkuIDotbfmuIXpmaTnvJPlrZjvvIzlkKbliJnltYzlpZfnmoQgUHJlZmFiIOS4jeS8muWPiuaXtuabtOaWsFxuICAgICAgICAgICAgaWYgKGFzc2V0IGluc3RhbmNlb2YgUHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgLy8g5LiN5Y+v5Lul5YWI6YeK5pS+77yM5Lya5b2x5ZON5ZCO57ut5pWw5o2u5p+l6K+i77yM5q+U5aaCIEEtPkItPkPvvIzlhYjph4rmlL5C77yM6YKj5LmIQeS+nei1luafpeivouWwseS8muWksei0pVxuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3Q6IEFzc2V0W10gPSBbXTtcbiAgICAgICAgICAgICAgICBhc3NldE1hbmFnZXIuYXNzZXRzLmZvckVhY2goKGNhY2hlZEFzc2V0LCB1dWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlcHNVVUlEcyA9IGFzc2V0TWFuYWdlci5kZXBlbmRVdGlsLmdldERlcHNSZWN1cnNpdmVseSh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0ICYmIGRlcHNVVUlEcy5pbmNsdWRlcyhhc3NldC51dWlkKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2goY2FjaGVkQXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKChjYWNoZWRBc3NldCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NldE1hbmFnZXIucmVsZWFzZUFzc2V0KGNhY2hlZEFzc2V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzc2V0TWFuYWdlci5yZWxlYXNlQXNzZXQoYXNzZXQpO1xuICAgICAgICB9XG4gICAgfVxufSJdfQ==