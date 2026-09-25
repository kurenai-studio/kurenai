"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompManager = void 0;
const dump_1 = __importDefault(require("../dump"));
const get_1 = __importDefault(require("lodash/get"));
const service_access_1 = require("../dump/service-access");
const CompMgr = EditorExtends.Component;
const utils_1 = __importDefault(require("./utils"));
const cc_1 = require("cc");
const global_events_1 = require("../core/global-events");
const decorator_1 = require("../core/decorator");
class CompManager {
    _recycleComponent = {};
    emit(event, ...args) {
        global_events_1.ServiceEvents.emit(event, ...args);
    }
    init() {
        this.unregisterCompMgrEvents();
        this.registerCompMgrEvents();
    }
    _onCompAdded;
    _onCompRemoved;
    /**
     * 注册引擎Component管理相关事件的监听
     */
    registerCompMgrEvents() {
        this._onCompAdded = this.add.bind(this);
        CompMgr.on('add', this._onCompAdded);
        this._onCompRemoved = this.remove.bind(this);
        CompMgr.on('remove', this._onCompRemoved);
    }
    /**
     * 反注册引擎Component管理相关事件的监听
     */
    unregisterCompMgrEvents() {
        if (this._onCompAdded) {
            CompMgr.off('add', this._onCompAdded);
        }
        if (this._onCompRemoved) {
            CompMgr.off('remove', this._onCompRemoved);
        }
    }
    /**
     * 清空当前管理的节点
     */
    clear() {
        CompMgr.clear();
    }
    /**
     * 添加到组件缓存
     * @param {String} uuid
     * @param {cc.Component} component
     */
    add(uuid, component) {
        this.emit('component:added', component);
    }
    /**
     * 移除组件缓存
     * @param {String} uuid
     * @param {cc.Component} component
     */
    remove(uuid, component) {
        this.emit('component:removed', component);
    }
    query(uuid) {
        return CompMgr.getComponent(uuid) || null;
    }
    queryFromPath(path) {
        return CompMgr.getComponentFromPath(path) || null;
    }
    getPathFromUuid(uuid) {
        return CompMgr.getPathFromUuid(uuid);
    }
    addRecycleComponent(uuid) {
        if (this._recycleComponent[uuid]) {
            delete this._recycleComponent[uuid];
        }
    }
    removeRecycleComponent(uuid, comp) {
        this._recycleComponent[comp.uuid] = comp;
    }
    /**
     * 在回收站中查询一个组件的实例
     * @param {*} uuid
     * @returns {cc.Component}
     */
    queryRecycle(uuid) {
        return this._recycleComponent[uuid] ?? null;
    }
    /**
     * 获取所有在用的组件
     */
    queryAll() {
        return CompMgr.getComponents();
    }
    /**
     * 在编辑器中删除一个component
     * @param {*} component 组件
     */
    removeComponent(component) {
        // 删除前查询依赖关系，被依赖的组件不能被删除
        // @ts-ignore
        if (component.node._getDependComponent(component).length > 0) {
            // @ts-ignore
            console.warn('Dependent components cannot be removed.  ' + component.name);
            return false;
        }
        this.emit('component:before-remove-component', component);
        component.node.removeComponent(component);
        // 需要立刻执行removeComponent操作，否则会延迟到下一帧
        cc.Object._deferredDestroy();
        this.emit('component:remove', component);
        return true;
    }
    /**
     * 在编辑器中重置 component
     * @param {*} component 组件
     */
    async resetComponent(component) {
        if (component instanceof cc_1.MissingScript) {
            // @ts-ignore
            const __type__ = component && component._$erialized && component._$erialized.__type__ ? component._$erialized.__type__ : 'unknown';
            console.warn(`Reset Component failed: ${__type__} does not exist`);
            return false;
        }
        const skipCompProps = [
            'name',
            'node',
            'uuid',
            'enabled',
            '_name',
            '_enabled',
            '_objFlags', // 不要重置 _objFlags，否则因为没有 onEnable 的标记会导致 onDisable 不被调用，后续 remove 不掉
            '_isOnLoadCalled',
            '__scriptAsset',
            '__eventTargets',
        ];
        try {
            const node = new cc.Node();
            const newComp = node.addComponent(component.constructor);
            const dump = dump_1.default.dumpComponent(newComp);
            for (const key in dump.value) {
                if (skipCompProps.includes(key)) {
                    continue;
                }
                await dump_1.default.restoreProperty(component, key, dump.value[key]);
            }
            component?.resetInEditor?.();
            component?.onRestore?.();
        }
        catch (error) {
            console.error(error);
            return false;
        }
        return true;
    }
    /**
     * 查询一个组件，并返回该节点的 dump 数据
     *   如果组件不存在，则返回 null
     * @param {String} uuid
     */
    async queryDump(uuid) {
        const comp = this.query(uuid);
        if (!comp) {
            return null;
        }
        return dump_1.default.dumpComponent(comp);
    }
    /**
     * 调用Component身上的方法
     * @param {*} uuid
     * @param {*} name
     * @param {*} args
     */
    async executeComponentMethod(uuid, name, args) {
        const comp = this.query(uuid);
        if (!comp) {
            return null;
        }
        const pathKeys = (name || '').split('.');
        const methodName = pathKeys.pop() || '';
        // 3.x terrain UI calls component methods through `gizmo.xxx`. Gizmos are
        // held by GizmoService's WeakMap in CLI, so they cannot be resolved by lodash/get.
        if (pathKeys.length === 1 && pathKeys[0] === 'gizmo') {
            const gizmo = (0, decorator_1.queryRegisteredService)('Gizmo')?.getComponentGizmo?.(comp);
            if (gizmo && methodName && typeof gizmo[methodName] === 'function') {
                return await gizmo[methodName](...(args || []));
            }
        }
        if (pathKeys.length > 0) {
            const methodObjPath = pathKeys.join('.');
            const methodObj = (0, get_1.default)(comp, methodObjPath);
            if (methodObj && methodName && methodObj[methodName]) {
                return await methodObj[methodName](...(args || []));
            }
        }
        if (!comp[methodName]) {
            return null;
        }
        // @ts-ignore
        return await comp[methodName](...(args || []));
    }
    /**
     * 设置一个组件的属性，暂时不用
     * @param {*} uuid
     * @param {*} path
     * @param {*} key
     * @param {*} dump
     */
    async setProperty(uuid, path, dump) {
        const comp = this.query(uuid);
        if (!comp) {
            return false;
        }
        // 恢复数据
        await dump_1.default.restoreProperty(comp, path, dump);
        return true;
    }
    // 通过编辑器操作添加的Component才需要增加额外的处理，区别于引擎里发出的component添加事件
    // 否则当拖一个prefab到场景时，也会进行后处理，造成错误
    onComponentAddedFromEditor(component) {
        if (!component) {
            return;
        }
        this.emit('component:add', component);
        // 一些组件在添加的时候，需要执行部分特殊的逻辑
        if (component.constructor && utils_1.default.addComponentMap[component.constructor.name]) {
            utils_1.default.addComponentMap[component.constructor.name](component, component.node);
        }
    }
    changeUUID(oldUUID, newUUID) {
        CompMgr.changeUUID(oldUUID, newUUID);
    }
}
exports.CompManager = CompManager;
const compManager = new CompManager();
(0, service_access_1.registerDumpComponentAccess)({
    query: compManager.query.bind(compManager),
    queryRecycle: compManager.queryRecycle.bind(compManager),
    removeComponent: compManager.removeComponent.bind(compManager),
    getPathFromUuid: compManager.getPathFromUuid.bind(compManager),
});
exports.default = compManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvY29tcG9uZW50L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG1EQUErQjtBQUMvQixxREFBNkI7QUFDN0IsMkRBQXFFO0FBRXJFLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUM7QUFDeEMsb0RBQTRCO0FBQzVCLDJCQUE4QztBQUc5Qyx5REFBc0Q7QUFDdEQsaURBQTJEO0FBRTNELE1BQWEsV0FBVztJQUNWLGlCQUFpQixHQUE4QixFQUFFLENBQUM7SUFJNUQsSUFBSSxDQUFDLEtBQWEsRUFBRSxHQUFHLElBQVc7UUFDOUIsNkJBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUk7UUFDQSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsWUFBWSxDQUFnRDtJQUM1RCxjQUFjLENBQWdEO0lBQzlEOztPQUVHO0lBQ0gscUJBQXFCO1FBQ2pCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRDs7T0FFRztJQUNILHVCQUF1QjtRQUNuQixJQUFJLElBQUks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QUMsU0FBUyxFQUFFLENBQUM7WUFDYixPQUFPO1FBQ1gsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRXRDLHlCQUF5QjtRQUN6QixJQUFJLFNBQVMsQ0FBQyxXQUFXLElBQUssZUFBSyxDQUFDLGVBQXVCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3JGLGVBQUssQ0FBQyxlQUF1QixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxRixDQUFDO0lBQ0wsQ0FBQztJQUVELFVBQVUsQ0FBQyxPQUFlLEVBQUUsT0FBZTtRQUN2QyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQ0o7QUF4UUQsa0NBd1FDO0FBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUV0QyxJQUFBLDRDQUEyQixFQUFDO0lBQ3hCLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDMUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUN4RCxlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzlELGVBQWUsRUFBRSxXQUFXLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7Q0FDakUsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGR1bXBVdGlsIGZyb20gJy4uL2R1bXAnO1xuaW1wb3J0IGdldCBmcm9tICdsb2Rhc2gvZ2V0JztcbmltcG9ydCB7IHJlZ2lzdGVyRHVtcENvbXBvbmVudEFjY2VzcyB9IGZyb20gJy4uL2R1bXAvc2VydmljZS1hY2Nlc3MnO1xuXG5jb25zdCBDb21wTWdyID0gRWRpdG9yRXh0ZW5kcy5Db21wb25lbnQ7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBDb21wb25lbnQsIE1pc3NpbmdTY3JpcHQgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHVibGljJztcbmltcG9ydCB7IHR5cGUgSUNvbXBvbmVudEV2ZW50cyB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBTZXJ2aWNlRXZlbnRzIH0gZnJvbSAnLi4vY29yZS9nbG9iYWwtZXZlbnRzJztcbmltcG9ydCB7IHF1ZXJ5UmVnaXN0ZXJlZFNlcnZpY2UgfSBmcm9tICcuLi9jb3JlL2RlY29yYXRvcic7XG5cbmV4cG9ydCBjbGFzcyBDb21wTWFuYWdlciB7XG4gICAgcHJvdGVjdGVkIF9yZWN5Y2xlQ29tcG9uZW50OiBSZWNvcmQ8c3RyaW5nLCBDb21wb25lbnQ+ID0ge307XG5cbiAgICBlbWl0PEsgZXh0ZW5kcyBrZXlvZiBJQ29tcG9uZW50RXZlbnRzPihldmVudDogSywgLi4uYXJnczogSUNvbXBvbmVudEV2ZW50c1tLXSk6IHZvaWQ7XG4gICAgZW1pdChldmVudDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IHZvaWQ7XG4gICAgZW1pdChldmVudDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBTZXJ2aWNlRXZlbnRzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMudW5yZWdpc3RlckNvbXBNZ3JFdmVudHMoKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckNvbXBNZ3JFdmVudHMoKTtcbiAgICB9XG4gICAgX29uQ29tcEFkZGVkPzogKHV1aWQ6IHN0cmluZywgY29tcG9uZW50OiBDb21wb25lbnQpID0+IHZvaWQ7XG4gICAgX29uQ29tcFJlbW92ZWQ/OiAodXVpZDogc3RyaW5nLCBjb21wb25lbnQ6IENvbXBvbmVudCkgPT4gdm9pZDtcbiAgICAvKipcbiAgICAgKiDms6jlhozlvJXmk45Db21wb25lbnTnrqHnkIbnm7jlhbPkuovku7bnmoTnm5HlkKxcbiAgICAgKi9cbiAgICByZWdpc3RlckNvbXBNZ3JFdmVudHMoKSB7XG4gICAgICAgIHRoaXMuX29uQ29tcEFkZGVkID0gdGhpcy5hZGQuYmluZCh0aGlzKTtcbiAgICAgICAgQ29tcE1nci5vbignYWRkJywgdGhpcy5fb25Db21wQWRkZWQpO1xuICAgICAgICB0aGlzLl9vbkNvbXBSZW1vdmVkID0gdGhpcy5yZW1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgQ29tcE1nci5vbigncmVtb3ZlJywgdGhpcy5fb25Db21wUmVtb3ZlZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Y+N5rOo5YaM5byV5pOOQ29tcG9uZW50566h55CG55u45YWz5LqL5Lu255qE55uR5ZCsXG4gICAgICovXG4gICAgdW5yZWdpc3RlckNvbXBNZ3JFdmVudHMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9vbkNvbXBBZGRlZCkge1xuICAgICAgICAgICAgQ29tcE1nci5vZmYoJ2FkZCcsIHRoaXMuX29uQ29tcEFkZGVkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fb25Db21wUmVtb3ZlZCkge1xuICAgICAgICAgICAgQ29tcE1nci5vZmYoJ3JlbW92ZScsIHRoaXMuX29uQ29tcFJlbW92ZWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riF56m65b2T5YmN566h55CG55qE6IqC54K5XG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIENvbXBNZ3IuY2xlYXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmt7vliqDliLDnu4Tku7bnvJPlrZhcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXVpZFxuICAgICAqIEBwYXJhbSB7Y2MuQ29tcG9uZW50fSBjb21wb25lbnRcbiAgICAgKi9cbiAgICBhZGQodXVpZDogc3RyaW5nLCBjb21wb25lbnQ6IENvbXBvbmVudCkge1xuICAgICAgICB0aGlzLmVtaXQoJ2NvbXBvbmVudDphZGRlZCcsIGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk57uE5Lu257yT5a2YXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHV1aWRcbiAgICAgKiBAcGFyYW0ge2NjLkNvbXBvbmVudH0gY29tcG9uZW50XG4gICAgICovXG4gICAgcmVtb3ZlKHV1aWQ6IHN0cmluZywgY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdjb21wb25lbnQ6cmVtb3ZlZCcsIGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5LiA5Liq57uE5Lu255qE5a6e5L6LXG4gICAgICogQHBhcmFtIHsqfSB1dWlkXG4gICAgICogQHJldHVybnMge2NjLkNvbXBvbmVudH1cbiAgICAgKi9cbiAgICBxdWVyeSh1dWlkOiBzdHJpbmcpOiBDb21wb25lbnQgfCBudWxsXG4gICAgcXVlcnk8VCBleHRlbmRzIENvbXBvbmVudD4odXVpZDogc3RyaW5nKTogVCB8IG51bGxcbiAgICBxdWVyeTxUIGV4dGVuZHMgQ29tcG9uZW50Pih1dWlkOiBzdHJpbmcpOiBUIHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBDb21wTWdyLmdldENvbXBvbmVudCh1dWlkKSB8fCBudWxsO1xuICAgIH1cblxuICAgIHF1ZXJ5RnJvbVBhdGgocGF0aDogc3RyaW5nKTogQ29tcG9uZW50IHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBDb21wTWdyLmdldENvbXBvbmVudEZyb21QYXRoKHBhdGgpIHx8IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0UGF0aEZyb21VdWlkKHV1aWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBDb21wTWdyLmdldFBhdGhGcm9tVXVpZCh1dWlkKTtcbiAgICB9XG5cbiAgICBhZGRSZWN5Y2xlQ29tcG9uZW50KHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5fcmVjeWNsZUNvbXBvbmVudFt1dWlkXSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3JlY3ljbGVDb21wb25lbnRbdXVpZF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVSZWN5Y2xlQ29tcG9uZW50KHV1aWQ6IHN0cmluZywgY29tcDogQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuX3JlY3ljbGVDb21wb25lbnRbY29tcC51dWlkXSA9IGNvbXA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Zyo5Zue5pS256uZ5Lit5p+l6K+i5LiA5Liq57uE5Lu255qE5a6e5L6LXG4gICAgICogQHBhcmFtIHsqfSB1dWlkXG4gICAgICogQHJldHVybnMge2NjLkNvbXBvbmVudH1cbiAgICAgKi9cbiAgICBxdWVyeVJlY3ljbGUodXVpZDogc3RyaW5nKTogQ29tcG9uZW50IHwgbnVsbCB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWN5Y2xlQ29tcG9uZW50W3V1aWRdID8/IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5omA5pyJ5Zyo55So55qE57uE5Lu2XG4gICAgICovXG4gICAgcXVlcnlBbGwoKSB7XG4gICAgICAgIHJldHVybiBDb21wTWdyLmdldENvbXBvbmVudHMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlnKjnvJbovpHlmajkuK3liKDpmaTkuIDkuKpjb21wb25lbnRcbiAgICAgKiBAcGFyYW0geyp9IGNvbXBvbmVudCDnu4Tku7ZcbiAgICAgKi9cbiAgICByZW1vdmVDb21wb25lbnQoY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgICAgICAgLy8g5Yig6Zmk5YmN5p+l6K+i5L6d6LWW5YWz57O777yM6KKr5L6d6LWW55qE57uE5Lu25LiN6IO96KKr5Yig6ZmkXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGNvbXBvbmVudC5ub2RlLl9nZXREZXBlbmRDb21wb25lbnQoY29tcG9uZW50KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0RlcGVuZGVudCBjb21wb25lbnRzIGNhbm5vdCBiZSByZW1vdmVkLiAgJyArIGNvbXBvbmVudC5uYW1lKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW1pdCgnY29tcG9uZW50OmJlZm9yZS1yZW1vdmUtY29tcG9uZW50JywgY29tcG9uZW50KTtcbiAgICAgICAgY29tcG9uZW50Lm5vZGUucmVtb3ZlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgIC8vIOmcgOimgeeri+WIu+aJp+ihjHJlbW92ZUNvbXBvbmVudOaTjeS9nO+8jOWQpuWImeS8muW7tui/n+WIsOS4i+S4gOW4p1xuICAgICAgICBjYy5PYmplY3QuX2RlZmVycmVkRGVzdHJveSgpO1xuXG4gICAgICAgIHRoaXMuZW1pdCgnY29tcG9uZW50OnJlbW92ZScsIGNvbXBvbmVudCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Zyo57yW6L6R5Zmo5Lit6YeN572uIGNvbXBvbmVudFxuICAgICAqIEBwYXJhbSB7Kn0gY29tcG9uZW50IOe7hOS7tlxuICAgICAqL1xuICAgIGFzeW5jIHJlc2V0Q29tcG9uZW50KGNvbXBvbmVudDogYW55KSB7XG4gICAgICAgIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBNaXNzaW5nU2NyaXB0KSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBfX3R5cGVfXyA9IGNvbXBvbmVudCAmJiBjb21wb25lbnQuXyRlcmlhbGl6ZWQgJiYgY29tcG9uZW50Ll8kZXJpYWxpemVkLl9fdHlwZV9fID8gY29tcG9uZW50Ll8kZXJpYWxpemVkLl9fdHlwZV9fIDogJ3Vua25vd24nO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBSZXNldCBDb21wb25lbnQgZmFpbGVkOiAke19fdHlwZV9ffSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2tpcENvbXBQcm9wcyA9IFtcbiAgICAgICAgICAgICduYW1lJyxcbiAgICAgICAgICAgICdub2RlJyxcbiAgICAgICAgICAgICd1dWlkJyxcbiAgICAgICAgICAgICdlbmFibGVkJyxcbiAgICAgICAgICAgICdfbmFtZScsXG4gICAgICAgICAgICAnX2VuYWJsZWQnLFxuICAgICAgICAgICAgJ19vYmpGbGFncycsIC8vIOS4jeimgemHjee9riBfb2JqRmxhZ3PvvIzlkKbliJnlm6DkuLrmsqHmnIkgb25FbmFibGUg55qE5qCH6K6w5Lya5a+86Ie0IG9uRGlzYWJsZSDkuI3ooqvosIPnlKjvvIzlkI7nu60gcmVtb3ZlIOS4jeaOiVxuICAgICAgICAgICAgJ19pc09uTG9hZENhbGxlZCcsXG4gICAgICAgICAgICAnX19zY3JpcHRBc3NldCcsXG4gICAgICAgICAgICAnX19ldmVudFRhcmdldHMnLFxuICAgICAgICBdO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IGNjLk5vZGUoKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0NvbXAgPSBub2RlLmFkZENvbXBvbmVudChjb21wb25lbnQuY29uc3RydWN0b3IpO1xuICAgICAgICAgICAgY29uc3QgZHVtcCA9IGR1bXBVdGlsLmR1bXBDb21wb25lbnQobmV3Q29tcCk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGR1bXAudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcENvbXBQcm9wcy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF3YWl0IGR1bXBVdGlsLnJlc3RvcmVQcm9wZXJ0eShjb21wb25lbnQsIGtleSwgZHVtcC52YWx1ZVtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudD8ucmVzZXRJbkVkaXRvcj8uKCk7XG4gICAgICAgICAgICBjb21wb25lbnQ/Lm9uUmVzdG9yZT8uKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4que7hOS7tu+8jOW5tui/lOWbnuivpeiKgueCueeahCBkdW1wIOaVsOaNrlxuICAgICAqICAg5aaC5p6c57uE5Lu25LiN5a2Y5Zyo77yM5YiZ6L+U5ZueIG51bGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXVpZFxuICAgICAqL1xuICAgIGFzeW5jIHF1ZXJ5RHVtcCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY29tcCA9IHRoaXMucXVlcnkodXVpZCk7XG4gICAgICAgIGlmICghY29tcCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGR1bXBVdGlsLmR1bXBDb21wb25lbnQoY29tcCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6LCD55SoQ29tcG9uZW506Lqr5LiK55qE5pa55rOVXG4gICAgICogQHBhcmFtIHsqfSB1dWlkXG4gICAgICogQHBhcmFtIHsqfSBuYW1lXG4gICAgICogQHBhcmFtIHsqfSBhcmdzXG4gICAgICovXG4gICAgYXN5bmMgZXhlY3V0ZUNvbXBvbmVudE1ldGhvZCh1dWlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgYXJnczogYW55KSB7XG4gICAgICAgIGNvbnN0IGNvbXAgPSB0aGlzLnF1ZXJ5KHV1aWQpO1xuICAgICAgICBpZiAoIWNvbXApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGF0aEtleXMgPSAobmFtZSB8fCAnJykuc3BsaXQoJy4nKTtcbiAgICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IHBhdGhLZXlzLnBvcCgpIHx8ICcnO1xuICAgICAgICAvLyAzLnggdGVycmFpbiBVSSBjYWxscyBjb21wb25lbnQgbWV0aG9kcyB0aHJvdWdoIGBnaXptby54eHhgLiBHaXptb3MgYXJlXG4gICAgICAgIC8vIGhlbGQgYnkgR2l6bW9TZXJ2aWNlJ3MgV2Vha01hcCBpbiBDTEksIHNvIHRoZXkgY2Fubm90IGJlIHJlc29sdmVkIGJ5IGxvZGFzaC9nZXQuXG4gICAgICAgIGlmIChwYXRoS2V5cy5sZW5ndGggPT09IDEgJiYgcGF0aEtleXNbMF0gPT09ICdnaXptbycpIHtcbiAgICAgICAgICAgIGNvbnN0IGdpem1vID0gcXVlcnlSZWdpc3RlcmVkU2VydmljZTxhbnk+KCdHaXptbycpPy5nZXRDb21wb25lbnRHaXptbz8uKGNvbXApO1xuICAgICAgICAgICAgaWYgKGdpem1vICYmIG1ldGhvZE5hbWUgJiYgdHlwZW9mIGdpem1vW21ldGhvZE5hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGdpem1vW21ldGhvZE5hbWVdKC4uLihhcmdzIHx8IFtdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhdGhLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG1ldGhvZE9ialBhdGggPSBwYXRoS2V5cy5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBtZXRob2RPYmogPSBnZXQoY29tcCwgbWV0aG9kT2JqUGF0aCk7XG4gICAgICAgICAgICBpZiAobWV0aG9kT2JqICYmIG1ldGhvZE5hbWUgJiYgbWV0aG9kT2JqW21ldGhvZE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IG1ldGhvZE9ialttZXRob2ROYW1lXSguLi4oYXJncyB8fCBbXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb21wW21ldGhvZE5hbWUgYXMga2V5b2YgQ29tcG9uZW50XSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gYXdhaXQgY29tcFttZXRob2ROYW1lXSguLi4oYXJncyB8fCBbXSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruS4gOS4que7hOS7tueahOWxnuaAp++8jOaaguaXtuS4jeeUqFxuICAgICAqIEBwYXJhbSB7Kn0gdXVpZFxuICAgICAqIEBwYXJhbSB7Kn0gcGF0aFxuICAgICAqIEBwYXJhbSB7Kn0ga2V5XG4gICAgICogQHBhcmFtIHsqfSBkdW1wXG4gICAgICovXG4gICAgYXN5bmMgc2V0UHJvcGVydHkodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGR1bXA6IElQcm9wZXJ0eSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBjb21wID0gdGhpcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgaWYgKCFjb21wKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmgaLlpI3mlbDmja5cbiAgICAgICAgYXdhaXQgZHVtcFV0aWwucmVzdG9yZVByb3BlcnR5KGNvbXAsIHBhdGgsIGR1bXApO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIOmAmui/h+e8lui+keWZqOaTjeS9nOa3u+WKoOeahENvbXBvbmVudOaJjemcgOimgeWinuWKoOmineWklueahOWkhOeQhu+8jOWMuuWIq+S6juW8leaTjumHjOWPkeWHuueahGNvbXBvbmVudOa3u+WKoOS6i+S7tlxuICAgIC8vIOWQpuWImeW9k+aLluS4gOS4qnByZWZhYuWIsOWcuuaZr+aXtu+8jOS5n+S8mui/m+ihjOWQjuWkhOeQhu+8jOmAoOaIkOmUmeivr1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudEFkZGVkRnJvbUVkaXRvcihjb21wb25lbnQ6IENvbXBvbmVudCkge1xuICAgICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbWl0KCdjb21wb25lbnQ6YWRkJywgY29tcG9uZW50KTtcblxuICAgICAgICAvLyDkuIDkupvnu4Tku7blnKjmt7vliqDnmoTml7blgJnvvIzpnIDopoHmiafooYzpg6jliIbnibnmrornmoTpgLvovpFcbiAgICAgICAgaWYgKGNvbXBvbmVudC5jb25zdHJ1Y3RvciAmJiAodXRpbHMuYWRkQ29tcG9uZW50TWFwIGFzIGFueSlbY29tcG9uZW50LmNvbnN0cnVjdG9yLm5hbWVdKSB7XG4gICAgICAgICAgICAodXRpbHMuYWRkQ29tcG9uZW50TWFwIGFzIGFueSlbY29tcG9uZW50LmNvbnN0cnVjdG9yLm5hbWVdKGNvbXBvbmVudCwgY29tcG9uZW50Lm5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hhbmdlVVVJRChvbGRVVUlEOiBzdHJpbmcsIG5ld1VVSUQ6IHN0cmluZykge1xuICAgICAgICBDb21wTWdyLmNoYW5nZVVVSUQob2xkVVVJRCwgbmV3VVVJRCk7XG4gICAgfVxufVxuY29uc3QgY29tcE1hbmFnZXIgPSBuZXcgQ29tcE1hbmFnZXIoKTtcblxucmVnaXN0ZXJEdW1wQ29tcG9uZW50QWNjZXNzKHtcbiAgICBxdWVyeTogY29tcE1hbmFnZXIucXVlcnkuYmluZChjb21wTWFuYWdlciksXG4gICAgcXVlcnlSZWN5Y2xlOiBjb21wTWFuYWdlci5xdWVyeVJlY3ljbGUuYmluZChjb21wTWFuYWdlciksXG4gICAgcmVtb3ZlQ29tcG9uZW50OiBjb21wTWFuYWdlci5yZW1vdmVDb21wb25lbnQuYmluZChjb21wTWFuYWdlciksXG4gICAgZ2V0UGF0aEZyb21VdWlkOiBjb21wTWFuYWdlci5nZXRQYXRoRnJvbVV1aWQuYmluZChjb21wTWFuYWdlciksXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgY29tcE1hbmFnZXI7XG4iXX0=