"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceManager = exports.ServiceManager = void 0;
const core_1 = require("./core");
const internal_events_1 = require("./core/internal-events");
const message_1 = require("./message");
// 仅需 messageManager 转发、无服务方法扇出的事件
const MESSAGE_ONLY_EVENTS = [
    'dirty:changed',
    'animation:state-changed',
    'animation:time-changed',
    'animation:clip-changed',
    'animation:property-committed',
    'gizmo:coordinate-changed',
    'gizmo:pivot-changed',
    'gizmo:view-mode-changed',
    'gizmo:tool-changed',
    'scene:dimension-changed',
    'camera:mode-change',
    'camera:projection-changed',
    'camera:fov-changed',
    'scene-view:visibility-changed',
    'scene-view:light-changed',
    'terrain:changed',
    'terrain:sculpt',
    'terrain:block-update',
    'terrain:session-changed',
];
// 定义事件分组映射
const SERVICE_EVENTS_MAP = {
    // Editor 事件
    'editor:open': 'onEditorOpened',
    'editor:close': 'onEditorClosed',
    'editor:reload': 'onEditorReload',
    'editor:save': 'onEditorSaved',
    // Node 事件
    'node:add': 'onAddNode',
    'node:remove': 'onRemoveNode',
    'node:before-remove': 'onBeforeRemoveNode',
    'node:before-add': 'onBeforeAddNode',
    'node:before-change': 'onNodeBeforeChanged',
    'node:change': 'onNodeChanged',
    'node:added': 'onNodeAdded',
    'node:removed': 'onNodeRemoved',
    // Asset 事件
    'asset:change': 'onAssetChanged',
    'asset:deleted': 'onAssetDeleted',
    // Component 事件
    'component:add': 'onAddComponent',
    'component:remove': 'onRemoveComponent',
    'component:added': 'onComponentAdded',
    'component:removed': 'onComponentRemoved',
    'component:set-property': 'onSetPropertyComponent',
    'component:before-add-component': 'onBeforeAddComponent',
    'component:before-remove-component': 'onBeforeRemoveComponent',
    // Script 事件
    'script:execution-finished': 'onScriptExecutionFinished',
    // Selection 事件
    'selection:select': 'onSelectionSelect',
    'selection:unselect': 'onSelectionUnselect',
    'selection:clear': 'onSelectionClear',
};
const INTERNAL_SERVICE_EVENTS_MAP = {
    [internal_events_1.InternalServiceEvents.EditorReloadClose]: 'onEditorClosed',
    [internal_events_1.InternalServiceEvents.EditorReloadOpen]: 'onEditorOpened',
    [internal_events_1.InternalServiceEvents.EditorDisposed]: 'onEditorDisposed',
};
class ServiceManager {
    initialized = false;
    eventHandlers = new Map();
    serverUrl = '';
    initialize(serverUrl) {
        if (this.initialized)
            return;
        this.initialized = true;
        this.serverUrl = serverUrl;
        this.unregisterAutoForwardEvents();
        this.registerAutoForwardEvents();
    }
    getServerUrl() {
        return this.serverUrl;
    }
    /**
     * 遍历所有已注册的 Service，依次调用 init()（跳过 Engine，它需要单独初始化）
     */
    async initAllServices() {
        for (const service of (0, core_1.getServiceAll)()) {
            const name = service.constructor.name;
            if (name === 'EngineService')
                continue;
            if (typeof service.init === 'function') {
                try {
                    await service.init();
                }
                catch (e) {
                    console.warn(`[ServiceManager] init failed on ${name}:`, e);
                }
            }
        }
    }
    registerAutoForwardEvents() {
        // 公开编辑器生命周期保持原有行为，会继续发给外部监听方。
        Object.entries(SERVICE_EVENTS_MAP).forEach(([eventType, methodName]) => {
            this.registerAutoForwardEvent(eventType, methodName);
        });
        // 重载不是公开的关闭/打开；这里只用内部事件复用服务内容卸载/挂载钩子，
        // 让服务暂停监听并重新绑定引擎重建后的对象，同时不广播 editor:close/open。
        Object.entries(INTERNAL_SERVICE_EVENTS_MAP).forEach(([eventType, methodName]) => {
            this.registerAutoForwardEvent(eventType, methodName, false);
        });
        // 仅需 messageManager 转发的事件（无服务方法扇出）
        this.registerMessageOnlyForwardEvents();
    }
    registerAutoForwardEvent(eventType, methodName, broadcastToMessage = true) {
        const isNodeChange = eventType === 'node:change';
        const handler = (...args) => {
            for (const service of (0, core_1.getServiceAll)()) {
                const serviceHandler = service[methodName];
                if (typeof serviceHandler === 'function') {
                    try {
                        serviceHandler.apply(service, args);
                    }
                    catch (e) {
                        console.warn(`[ServiceManager] ${methodName} failed on ${service.constructor.name}:`, e);
                    }
                }
            }
            if (!broadcastToMessage)
                return;
            if (isNodeChange) {
                message_1.messageManager.broadcastNodeChangeMsg(...args);
            }
            else {
                message_1.messageManager.broadcast(eventType, ...args);
            }
        };
        core_1.ServiceEvents.on(eventType, handler);
        this.eventHandlers.set(eventType, handler);
    }
    registerMessageOnlyForwardEvents() {
        for (const eventType of MESSAGE_ONLY_EVENTS) {
            const handler = (...args) => {
                message_1.messageManager.broadcast(eventType, ...args);
            };
            core_1.ServiceEvents.on(eventType, handler);
            this.eventHandlers.set(eventType, handler);
        }
    }
    unregisterAutoForwardEvents() {
        this.eventHandlers.forEach((handler, eventType) => {
            core_1.ServiceEvents.off(eventType, handler);
        });
        this.eventHandlers.clear();
    }
}
exports.ServiceManager = ServiceManager;
exports.serviceManager = new ServiceManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3NlcnZpY2UtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBc0U7QUFDdEUsNERBQStEO0FBRS9ELHVDQUEyQztBQVczQyxrQ0FBa0M7QUFDbEMsTUFBTSxtQkFBbUIsR0FBRztJQUN4QixlQUFlO0lBQ2YseUJBQXlCO0lBQ3pCLHdCQUF3QjtJQUN4Qix3QkFBd0I7SUFDeEIsOEJBQThCO0lBQzlCLDBCQUEwQjtJQUMxQixxQkFBcUI7SUFDckIseUJBQXlCO0lBQ3pCLG9CQUFvQjtJQUNwQix5QkFBeUI7SUFDekIsb0JBQW9CO0lBQ3BCLDJCQUEyQjtJQUMzQixvQkFBb0I7SUFDcEIsK0JBQStCO0lBQy9CLDBCQUEwQjtJQUMxQixpQkFBaUI7SUFDakIsZ0JBQWdCO0lBQ2hCLHNCQUFzQjtJQUN0Qix5QkFBeUI7Q0FDbkIsQ0FBQztBQUVYLFdBQVc7QUFDWCxNQUFNLGtCQUFrQixHQUFhO0lBQ2pDLFlBQVk7SUFDWixhQUFhLEVBQUUsZ0JBQWdCO0lBQy9CLGNBQWMsRUFBRSxnQkFBZ0I7SUFDaEMsZUFBZSxFQUFFLGdCQUFnQjtJQUNqQyxhQUFhLEVBQUUsZUFBZTtJQUU5QixVQUFVO0lBQ1YsVUFBVSxFQUFFLFdBQVc7SUFDdkIsYUFBYSxFQUFFLGNBQWM7SUFDN0Isb0JBQW9CLEVBQUUsb0JBQW9CO0lBQzFDLGlCQUFpQixFQUFFLGlCQUFpQjtJQUNwQyxvQkFBb0IsRUFBRSxxQkFBcUI7SUFDM0MsYUFBYSxFQUFFLGVBQWU7SUFDOUIsWUFBWSxFQUFFLGFBQWE7SUFDM0IsY0FBYyxFQUFFLGVBQWU7SUFFL0IsV0FBVztJQUNYLGNBQWMsRUFBRSxnQkFBZ0I7SUFDaEMsZUFBZSxFQUFFLGdCQUFnQjtJQUVqQyxlQUFlO0lBQ2YsZUFBZSxFQUFF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QztZQUNqRCxDQUFDLENBQUM7WUFDRixvQkFBYSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLENBQUM7SUFDTCxDQUFDO0lBRU8sMkJBQTJCO1FBQy9CLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQzlDLG9CQUFhLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0IsQ0FBQztDQUNKO0FBekZELHdDQXlGQztBQUVZLFFBQUEsY0FBYyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRTZXJ2aWNlQWxsLCBJU2VydmljZUV2ZW50cywgU2VydmljZUV2ZW50cyB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBJbnRlcm5hbFNlcnZpY2VFdmVudHMgfSBmcm9tICcuL2NvcmUvaW50ZXJuYWwtZXZlbnRzJztcbmltcG9ydCB7IElFZGl0b3JFdmVudHMsIElOb2RlRXZlbnRzLCBJQ29tcG9uZW50RXZlbnRzLCBJU2NyaXB0RXZlbnRzLCBJQXNzZXRFdmVudHMsIElTZWxlY3Rpb25FdmVudHMgfSBmcm9tICcuLi8uLi9jb21tb24nO1xuaW1wb3J0IHsgbWVzc2FnZU1hbmFnZXIgfSBmcm9tICcuL21lc3NhZ2UnO1xuXG50eXBlIEFsbEV2ZW50cyA9IElFZGl0b3JFdmVudHMgJiBJTm9kZUV2ZW50cyAmIElDb21wb25lbnRFdmVudHMgJiBJU2NyaXB0RXZlbnRzICYgSUFzc2V0RXZlbnRzICYgSVNlbGVjdGlvbkV2ZW50cztcblxuLy8g5o6S6Zmk5LqL5Lu2XG50eXBlIEZpbHRlcmVkRXZlbnRzID0gRXhjbHVkZTxrZXlvZiBBbGxFdmVudHMsICdhc3NldC1yZWZyZXNoJz47XG5cbnR5cGUgRXZlbnRNYXAgPSB7XG4gICAgW0sgaW4gRmlsdGVyZWRFdmVudHNdOiBrZXlvZiBJU2VydmljZUV2ZW50cztcbn07XG5cbi8vIOS7hemcgCBtZXNzYWdlTWFuYWdlciDovazlj5HjgIHml6DmnI3liqHmlrnms5XmiYflh7rnmoTkuovku7ZcbmNvbnN0IE1FU1NBR0VfT05MWV9FVkVOVFMgPSBbXG4gICAgJ2RpcnR5OmNoYW5nZWQnLFxuICAgICdhbmltYXRpb246c3RhdGUtY2hhbmdlZCcsXG4gICAgJ2FuaW1hdGlvbjp0aW1lLWNoYW5nZWQnLFxuICAgICdhbmltYXRpb246Y2xpcC1jaGFuZ2VkJyxcbiAgICAnYW5pbWF0aW9uOnByb3BlcnR5LWNvbW1pdHRlZCcsXG4gICAgJ2dpem1vOmNvb3JkaW5hdGUtY2hhbmdlZCcsXG4gICAgJ2dpem1vOnBpdm90LWNoYW5nZWQnLFxuICAgICdnaXptbzp2aWV3LW1vZGUtY2hhbmdlZCcsXG4gICAgJ2dpem1vOnRvb2wtY2hhbmdlZCcsXG4gICAgJ3NjZW5lOmRpbWVuc2lvbi1jaGFuZ2VkJyxcbiAgICAnY2FtZXJhOm1vZGUtY2hhbmdlJyxcbiAgICAnY2FtZXJhOnByb2plY3Rpb24tY2hhbmdlZCcsXG4gICAgJ2NhbWVyYTpmb3YtY2hhbmdlZCcsXG4gICAgJ3NjZW5lLXZpZXc6dmlzaWJpbGl0eS1jaGFuZ2VkJyxcbiAgICAnc2NlbmUtdmlldzpsaWdodC1jaGFuZ2VkJyxcbiAgICAndGVycmFpbjpjaGFuZ2VkJyxcbiAgICAndGVycmFpbjpzY3VscHQnLFxuICAgICd0ZXJyYWluOmJsb2NrLXVwZGF0ZScsXG4gICAgJ3RlcnJhaW46c2Vzc2lvbi1jaGFuZ2VkJyxcbl0gYXMgY29uc3Q7XG5cbi8vIOWumuS5ieS6i+S7tuWIhue7hOaYoOWwhFxuY29uc3QgU0VSVklDRV9FVkVOVFNfTUFQOiBFdmVudE1hcCA9IHtcbiAgICAvLyBFZGl0b3Ig5LqL5Lu2XG4gICAgJ2VkaXRvcjpvcGVuJzogJ29uRWRpdG9yT3BlbmVkJyxcbiAgICAnZWRpdG9yOmNsb3NlJzogJ29uRWRpdG9yQ2xvc2VkJyxcbiAgICAnZWRpdG9yOnJlbG9hZCc6ICdvbkVkaXRvclJlbG9hZCcsXG4gICAgJ2VkaXRvcjpzYXZlJzogJ29uRWRpdG9yU2F2ZWQnLFxuXG4gICAgLy8gTm9kZSDkuovku7ZcbiAgICAnbm9kZTphZGQnOiAnb25BZGROb2RlJyxcbiAgICAnbm9kZTpyZW1vdmUnOiAnb25SZW1vdmVOb2RlJyxcbiAgICAnbm9kZTpiZWZvcmUtcmVtb3ZlJzogJ29uQmVmb3JlUmVtb3ZlTm9kZScsXG4gICAgJ25vZGU6YmVmb3JlLWFkZCc6ICdvbkJlZm9yZUFkZE5vZGUnLFxuICAgICdub2RlOmJlZm9yZS1jaGFuZ2UnOiAnb25Ob2RlQmVmb3JlQ2hhbmdlZCcsXG4gICAgJ25vZGU6Y2hhbmdlJzogJ29uTm9kZUNoYW5nZWQnLFxuICAgICdub2RlOmFkZGVkJzogJ29uTm9kZUFkZGVkJyxcbiAgICAnbm9kZTpyZW1vdmVkJzogJ29uTm9kZVJlbW92ZWQnLFxuXG4gICAgLy8gQXNzZXQg5LqL5Lu2XG4gICAgJ2Fzc2V0OmNoYW5nZSc6ICdvbkFzc2V0Q2hhbmdlZCcsXG4gICAgJ2Fzc2V0OmRlbGV0ZWQnOiAnb25Bc3NldERlbGV0ZWQnLFxuXG4gICAgLy8gQ29tcG9uZW50IOS6i+S7tlxuICAgICdjb21wb25lbnQ6YWRkJzogJ29uQWRkQ29tcG9uZW50JyxcbiAgICAnY29tcG9uZW50OnJlbW92ZSc6ICdvblJlbW92ZUNvbXBvbmVudCcsXG4gICAgJ2NvbXBvbmVudDphZGRlZCc6ICdvbkNvbXBvbmVudEFkZGVkJyxcbiAgICAnY29tcG9uZW50OnJlbW92ZWQnOiAnb25Db21wb25lbnRSZW1vdmVkJyxcbiAgICAnY29tcG9uZW50OnNldC1wcm9wZXJ0eSc6ICdvblNldFByb3BlcnR5Q29tcG9uZW50JyxcbiAgICAnY29tcG9uZW50OmJlZm9yZS1hZGQtY29tcG9uZW50JzogJ29uQmVmb3JlQWRkQ29tcG9uZW50JyxcbiAgICAnY29tcG9uZW50OmJlZm9yZS1yZW1vdmUtY29tcG9uZW50JzogJ29uQmVmb3JlUmVtb3ZlQ29tcG9uZW50JyxcbiAgICAvLyBTY3JpcHQg5LqL5Lu2XG4gICAgJ3NjcmlwdDpleGVjdXRpb24tZmluaXNoZWQnOiAnb25TY3JpcHRFeGVjdXRpb25GaW5pc2hlZCcsXG5cbiAgICAvLyBTZWxlY3Rpb24g5LqL5Lu2XG4gICAgJ3NlbGVjdGlvbjpzZWxlY3QnOiAnb25TZWxlY3Rpb25TZWxlY3QnLFxuICAgICdzZWxlY3Rpb246dW5zZWxlY3QnOiAnb25TZWxlY3Rpb25VbnNlbGVjdCcsXG4gICAgJ3NlbGVjdGlvbjpjbGVhcic6ICdvblNlbGVjdGlvbkNsZWFyJyxcbn0gYXMgY29uc3Q7XG5cbmNvbnN0IElOVEVSTkFMX1NFUlZJQ0VfRVZFTlRTX01BUCA9IHtcbiAgICBbSW50ZXJuYWxTZXJ2aWNlRXZlbnRzLkVkaXRvclJlbG9hZENsb3NlXTogJ29uRWRpdG9yQ2xvc2VkJyxcbiAgICBbSW50ZXJuYWxTZXJ2aWNlRXZlbnRzLkVkaXRvclJlbG9hZE9wZW5dOiAnb25FZGl0b3JPcGVuZWQnLFxuICAgIFtJbnRlcm5hbFNlcnZpY2VFdmVudHMuRWRpdG9yRGlzcG9zZWRdOiAnb25FZGl0b3JEaXNwb3NlZCcsXG59IGFzIGNvbnN0O1xuXG4vLyDlhoXpg6jnlJ/lkb3lkajmnJ/ljIXlkKsgb25FZGl0b3JEaXNwb3NlZO+8jOS9huWug+WPquWcqOWcuuaZr+i/m+eoi+WGheS9v+eUqO+8jFxuLy8g5LiN5pS+6L+bIElTZXJ2aWNlRXZlbnRz77yM6YG/5YWN5Y+Y5oiQ5a+55aSW5pyN5Yqh57G75Z6L55qE5LiA6YOo5YiG44CCXG50eXBlIFNlcnZpY2VNZXRob2ROYW1lID0ga2V5b2YgSVNlcnZpY2VFdmVudHMgfCAnb25FZGl0b3JEaXNwb3NlZCc7XG5cbi8vIOacjeWKoeaYr+WKqOaAgeazqOWGjOeahO+8jOi/memHjOWPque7meiHquWKqOi9rOWPkemAu+i+keS4gOS4quacrOWcsOWuveexu+Wei++8jFxuLy8g5LiN5by66L+r5omA5pyJ5YaF6YOo55Sf5ZG95ZGo5pyf6ZKp5a2Q6L+b5YWl5YWs5YWx5pyN5Yqh57G75Z6L44CCXG50eXBlIEF1dG9Gb3J3YXJkU2VydmljZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogeyBuYW1lOiBzdHJpbmcgfTtcbn0gJiBQYXJ0aWFsPFJlY29yZDxTZXJ2aWNlTWV0aG9kTmFtZSwgKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkPj47XG5cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgZXZlbnRIYW5kbGVycyA9IG5ldyBNYXA8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IHZvaWQ+KCk7XG4gICAgcHJpdmF0ZSBzZXJ2ZXJVcmw6IHN0cmluZyA9ICcnO1xuXG4gICAgaW5pdGlhbGl6ZShzZXJ2ZXJVcmw6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJVcmwgPSBzZXJ2ZXJVcmw7XG4gICAgICAgIHRoaXMudW5yZWdpc3RlckF1dG9Gb3J3YXJkRXZlbnRzKCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJBdXRvRm9yd2FyZEV2ZW50cygpO1xuICAgIH1cblxuICAgIGdldFNlcnZlclVybCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmVyVXJsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmBjeWOhuaJgOacieW3suazqOWGjOeahCBTZXJ2aWNl77yM5L6d5qyh6LCD55SoIGluaXQoKe+8iOi3s+i/hyBFbmdpbmXvvIzlroPpnIDopoHljZXni6zliJ3lp4vljJbvvIlcbiAgICAgKi9cbiAgICBhc3luYyBpbml0QWxsU2VydmljZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc2VydmljZSBvZiBnZXRTZXJ2aWNlQWxsKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBzZXJ2aWNlLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ0VuZ2luZVNlcnZpY2UnKSBjb250aW51ZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2VydmljZS5pbml0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VydmljZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtTZXJ2aWNlTWFuYWdlcl0gaW5pdCBmYWlsZWQgb24gJHtuYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlZ2lzdGVyQXV0b0ZvcndhcmRFdmVudHMoKSB7XG4gICAgICAgIC8vIOWFrOW8gOe8lui+keWZqOeUn+WRveWRqOacn+S/neaMgeWOn+acieihjOS4uu+8jOS8mue7p+e7reWPkee7meWklumDqOebkeWQrOaWueOAglxuICAgICAgICBPYmplY3QuZW50cmllcyhTRVJWSUNFX0VWRU5UU19NQVApLmZvckVhY2goKFtldmVudFR5cGUsIG1ldGhvZE5hbWVdKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQXV0b0ZvcndhcmRFdmVudChldmVudFR5cGUsIG1ldGhvZE5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8g6YeN6L295LiN5piv5YWs5byA55qE5YWz6ZetL+aJk+W8gO+8m+i/memHjOWPqueUqOWGhemDqOS6i+S7tuWkjeeUqOacjeWKoeWGheWuueWNuOi9vS/mjILovb3pkqnlrZDvvIxcbiAgICAgICAgLy8g6K6p5pyN5Yqh5pqC5YGc55uR5ZCs5bm26YeN5paw57uR5a6a5byV5pOO6YeN5bu65ZCO55qE5a+56LGh77yM5ZCM5pe25LiN5bm/5pKtIGVkaXRvcjpjbG9zZS9vcGVu44CCXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKElOVEVSTkFMX1NFUlZJQ0VfRVZFTlRTX01BUCkuZm9yRWFjaCgoW2V2ZW50VHlwZSwgbWV0aG9kTmFtZV0pID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJBdXRvRm9yd2FyZEV2ZW50KGV2ZW50VHlwZSwgbWV0aG9kTmFtZSwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8g5LuF6ZyAIG1lc3NhZ2VNYW5hZ2VyIOi9rOWPkeeahOS6i+S7tu+8iOaXoOacjeWKoeaWueazleaJh+WHuu+8iVxuICAgICAgICB0aGlzLnJlZ2lzdGVyTWVzc2FnZU9ubHlGb3J3YXJkRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWdpc3RlckF1dG9Gb3J3YXJkRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIG1ldGhvZE5hbWU6IFNlcnZpY2VNZXRob2ROYW1lLCBicm9hZGNhc3RUb01lc3NhZ2UgPSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IGlzTm9kZUNoYW5nZSA9IGV2ZW50VHlwZSA9PT0gJ25vZGU6Y2hhbmdlJztcbiAgICAgICAgY29uc3QgaGFuZGxlciA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBzZXJ2aWNlIG9mIGdldFNlcnZpY2VBbGwoKSBhcyBBdXRvRm9yd2FyZFNlcnZpY2VbXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZpY2VIYW5kbGVyID0gc2VydmljZVttZXRob2ROYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNlcnZpY2VIYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlSGFuZGxlci5hcHBseShzZXJ2aWNlLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbU2VydmljZU1hbmFnZXJdICR7bWV0aG9kTmFtZX0gZmFpbGVkIG9uICR7c2VydmljZS5jb25zdHJ1Y3Rvci5uYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYnJvYWRjYXN0VG9NZXNzYWdlKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoaXNOb2RlQ2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZU1hbmFnZXIuYnJvYWRjYXN0Tm9kZUNoYW5nZU1zZyguLi5hcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZU1hbmFnZXIuYnJvYWRjYXN0KGV2ZW50VHlwZSwgLi4uYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgU2VydmljZUV2ZW50cy5vbihldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnMuc2V0KGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWdpc3Rlck1lc3NhZ2VPbmx5Rm9yd2FyZEV2ZW50cygpIHtcbiAgICAgICAgZm9yIChjb25zdCBldmVudFR5cGUgb2YgTUVTU0FHRV9PTkxZX0VWRU5UUykge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VNYW5hZ2VyLmJyb2FkY2FzdChldmVudFR5cGUsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFNlcnZpY2VFdmVudHMub24oZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVycy5zZXQoZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdW5yZWdpc3RlckF1dG9Gb3J3YXJkRXZlbnRzKCkge1xuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnMuZm9yRWFjaCgoaGFuZGxlciwgZXZlbnRUeXBlKSA9PiB7XG4gICAgICAgICAgICBTZXJ2aWNlRXZlbnRzLm9mZihldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzLmNsZWFyKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3Qgc2VydmljZU1hbmFnZXIgPSBuZXcgU2VydmljZU1hbmFnZXIoKTtcbiJdfQ==