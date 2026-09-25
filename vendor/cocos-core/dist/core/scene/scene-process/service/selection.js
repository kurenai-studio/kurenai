"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectionService = void 0;
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
const global_events_1 = require("./core/global-events");
const common_1 = require("../../common");
const editor_node_1 = require("./gizmo/utils/editor-node");
const path_utils_1 = require("../../../engine/editor-extends/manager/path-utils");
function pathToUuid(path) {
    return (0, editor_node_1.getEditorNodeUuidByPath)(path);
}
function uuidToPath(uuid) {
    const node = (0, editor_node_1.getEditorNodeByUuid)(uuid);
    if (!node)
        return '';
    return (0, editor_node_1.getEditorNodePath)(node);
}
let SelectionService = class SelectionService extends core_1.BaseService {
    _selections = [];
    _onNodeChangedHandler;
    init() {
        this._onNodeChangedHandler = (node, opts = {}) => {
            if (opts.type === common_1.NodeEventType.SET_PROPERTY && opts.propPath === 'name') {
                this._onNodePathChanged(node);
            }
            else if (opts.type === common_1.NodeEventType.PARENT_CHANGED) {
                this._onNodePathChanged(node);
            }
        };
        global_events_1.ServiceEvents.on('node:change', this._onNodeChangedHandler);
    }
    destroy() {
        if (this._onNodeChangedHandler) {
            global_events_1.ServiceEvents.off('node:change', this._onNodeChangedHandler);
            this._onNodeChangedHandler = undefined;
        }
    }
    _onNodePathChanged(node) {
        const uuid = node.uuid;
        const newPath = uuidToPath(uuid);
        if (!newPath)
            return;
        for (const entry of this._selections) {
            if (entry.uuid === uuid) {
                entry.path = newPath;
            }
        }
    }
    select(path) {
        // 选中项以归一化路径为键，'/Canvas' 与 'Canvas' 是同一个节点，不能存成两条
        const normalized = (0, path_utils_1.normalizeNodePath)(path);
        const index = this._selections.findIndex(e => e.path === normalized);
        if (index !== -1)
            return;
        const uuid = pathToUuid(normalized);
        this._selections.unshift({ path: normalized, uuid });
        if (uuid) {
            this._callFocusInEditor(uuid);
        }
        this.broadcast('selection:select', normalized, this._getPaths());
    }
    unselect(path) {
        const normalized = (0, path_utils_1.normalizeNodePath)(path);
        const index = this._selections.findIndex(e => e.path === normalized);
        if (index === -1)
            return;
        const entry = this._selections[index];
        this._selections.splice(index, 1);
        if (entry.uuid) {
            this._callLostFocusInEditor(entry.uuid);
        }
        this.broadcast('selection:unselect', normalized, this._getPaths());
    }
    clear() {
        while (this._selections.length > 0) {
            const entry = this._selections.shift();
            if (entry) {
                if (entry.uuid) {
                    this._callLostFocusInEditor(entry.uuid);
                }
                this.emit('selection:unselect', entry.path, this._getPaths());
            }
        }
        this.broadcast('selection:clear');
    }
    query() {
        return this._selections.map(e => e.path);
    }
    isSelect(path) {
        const normalized = (0, path_utils_1.normalizeNodePath)(path);
        return this._selections.some(e => e.path === normalized);
    }
    reset() {
        this._selections.length = 0;
    }
    _getPaths() {
        return this._selections.map(e => e.path);
    }
    _callFocusInEditor(uuid) {
        try {
            const node = (0, editor_node_1.getEditorNodeByUuid)(uuid);
            if (!node?._components)
                return;
            for (const comp of node.components) {
                if (comp?.onFocusInEditor) {
                    comp.onFocusInEditor();
                }
            }
        }
        catch (e) {
            console.error('[Selection] onFocusInEditor error:', e);
        }
    }
    _callLostFocusInEditor(uuid) {
        try {
            const node = (0, editor_node_1.getEditorNodeByUuid)(uuid);
            if (!node?._components)
                return;
            for (const comp of node.components) {
                if (comp?.onLostFocusInEditor) {
                    comp.onLostFocusInEditor();
                }
            }
        }
        catch (e) {
            console.error('[Selection] onLostFocusInEditor error:', e);
        }
    }
};
exports.SelectionService = SelectionService;
exports.SelectionService = SelectionService = __decorate([
    (0, decorator_1.register)('Selection')
], SelectionService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3NlbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpQ0FBcUM7QUFDckMsZ0RBQTRDO0FBQzVDLHdEQUFxRDtBQUVyRCx5Q0FBNkM7QUFFN0MsMkRBQTRHO0FBQzVHLGtGQUFzRjtBQUV0RixTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzVCLE9BQU8sSUFBQSxxQ0FBdUIsRUFBQyxJQUFJLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsSUFBWTtJQUM1QixNQUFNLElBQUksR0FBRyxJQUFBLGlDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFDckIsT0FBTyxJQUFBLCtCQUFpQixFQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFRTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLGtCQUE2QjtJQUN2RCxXQUFXLEdBQXFCLEVBQUUsQ0FBQztJQUNuQyxxQkFBcUIsQ0FBbUQ7SUFFaEYsSUFBSTtRQUNBLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLElBQVUsRUFBRSxPQUEyQixFQUFFLEVBQUUsRUFBRTtZQUN2RSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQWEsQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLHNCQUFhLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FB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ZUFBZSxFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQztJQUNMLENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxJQUFZO1FBQ3ZDLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUEsaUNBQW1CLEVBQUMsSUFBSSxDQUFRLENBQUM7WUFDOUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXO2dCQUFFLE9BQU87WUFDL0IsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksSUFBSSxFQUFFLG1CQUFtQixFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMvQixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUE7QUFwSFksNENBQWdCOzJCQUFoQixnQkFBZ0I7SUFENUIsSUFBQSxvQkFBUSxFQUFDLFdBQVcsQ0FBQztHQUNULGdCQUFnQixDQW9INUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlU2VydmljZSB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyByZWdpc3RlciB9IGZyb20gJy4vY29yZS9kZWNvcmF0b3InO1xuaW1wb3J0IHsgU2VydmljZUV2ZW50cyB9IGZyb20gJy4vY29yZS9nbG9iYWwtZXZlbnRzJztcbmltcG9ydCB0eXBlIHsgSVNlbGVjdGlvblNlcnZpY2UsIElTZWxlY3Rpb25FdmVudHMsIElDaGFuZ2VOb2RlT3B0aW9ucyB9IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBOb2RlRXZlbnRUeXBlIH0gZnJvbSAnLi4vLi4vY29tbW9uJztcbmltcG9ydCB0eXBlIHsgTm9kZSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IGdldEVkaXRvck5vZGVCeVV1aWQsIGdldEVkaXRvck5vZGVQYXRoLCBnZXRFZGl0b3JOb2RlVXVpZEJ5UGF0aCB9IGZyb20gJy4vZ2l6bW8vdXRpbHMvZWRpdG9yLW5vZGUnO1xuaW1wb3J0IHsgbm9ybWFsaXplTm9kZVBhdGggfSBmcm9tICcuLi8uLi8uLi9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvbWFuYWdlci9wYXRoLXV0aWxzJztcblxuZnVuY3Rpb24gcGF0aFRvVXVpZChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBnZXRFZGl0b3JOb2RlVXVpZEJ5UGF0aChwYXRoKTtcbn1cblxuZnVuY3Rpb24gdXVpZFRvUGF0aCh1dWlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vZGUgPSBnZXRFZGl0b3JOb2RlQnlVdWlkKHV1aWQpO1xuICAgIGlmICghbm9kZSkgcmV0dXJuICcnO1xuICAgIHJldHVybiBnZXRFZGl0b3JOb2RlUGF0aChub2RlKTtcbn1cblxuaW50ZXJmYWNlIFNlbGVjdGlvbkVudHJ5IHtcbiAgICBwYXRoOiBzdHJpbmc7XG4gICAgdXVpZDogc3RyaW5nO1xufVxuXG5AcmVnaXN0ZXIoJ1NlbGVjdGlvbicpXG5leHBvcnQgY2xhc3MgU2VsZWN0aW9uU2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPElTZWxlY3Rpb25FdmVudHM+IGltcGxlbWVudHMgSVNlbGVjdGlvblNlcnZpY2Uge1xuICAgIHByaXZhdGUgX3NlbGVjdGlvbnM6IFNlbGVjdGlvbkVudHJ5W10gPSBbXTtcbiAgICBwcml2YXRlIF9vbk5vZGVDaGFuZ2VkSGFuZGxlcj86IChub2RlOiBOb2RlLCBvcHRzPzogSUNoYW5nZU5vZGVPcHRpb25zKSA9PiB2b2lkO1xuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fb25Ob2RlQ2hhbmdlZEhhbmRsZXIgPSAobm9kZTogTm9kZSwgb3B0czogSUNoYW5nZU5vZGVPcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRzLnR5cGUgPT09IE5vZGVFdmVudFR5cGUuU0VUX1BST1BFUlRZICYmIG9wdHMucHJvcFBhdGggPT09ICduYW1lJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uTm9kZVBhdGhDaGFuZ2VkKG5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRzLnR5cGUgPT09IE5vZGVFdmVudFR5cGUuUEFSRU5UX0NIQU5HRUQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbk5vZGVQYXRoQ2hhbmdlZChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgU2VydmljZUV2ZW50cy5vbignbm9kZTpjaGFuZ2UnLCB0aGlzLl9vbk5vZGVDaGFuZ2VkSGFuZGxlcik7XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX29uTm9kZUNoYW5nZWRIYW5kbGVyKSB7XG4gICAgICAgICAgICBTZXJ2aWNlRXZlbnRzLm9mZignbm9kZTpjaGFuZ2UnLCB0aGlzLl9vbk5vZGVDaGFuZ2VkSGFuZGxlcik7XG4gICAgICAgICAgICB0aGlzLl9vbk5vZGVDaGFuZ2VkSGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX29uTm9kZVBhdGhDaGFuZ2VkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgdXVpZCA9IG5vZGUudXVpZDtcbiAgICAgICAgY29uc3QgbmV3UGF0aCA9IHV1aWRUb1BhdGgodXVpZCk7XG4gICAgICAgIGlmICghbmV3UGF0aCkgcmV0dXJuO1xuXG4gICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5fc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgaWYgKGVudHJ5LnV1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBlbnRyeS5wYXRoID0gbmV3UGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdChwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgLy8g6YCJ5Lit6aG55Lul5b2S5LiA5YyW6Lev5b6E5Li66ZSu77yMJy9DYW52YXMnIOS4jiAnQ2FudmFzJyDmmK/lkIzkuIDkuKroioLngrnvvIzkuI3og73lrZjmiJDkuKTmnaFcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZU5vZGVQYXRoKHBhdGgpO1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX3NlbGVjdGlvbnMuZmluZEluZGV4KGUgPT4gZS5wYXRoID09PSBub3JtYWxpemVkKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkgcmV0dXJuO1xuICAgICAgICBjb25zdCB1dWlkID0gcGF0aFRvVXVpZChub3JtYWxpemVkKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0aW9ucy51bnNoaWZ0KHsgcGF0aDogbm9ybWFsaXplZCwgdXVpZCB9KTtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbGxGb2N1c0luRWRpdG9yKHV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0KCdzZWxlY3Rpb246c2VsZWN0Jywgbm9ybWFsaXplZCwgdGhpcy5fZ2V0UGF0aHMoKSk7XG4gICAgfVxuXG4gICAgdW5zZWxlY3QocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVOb2RlUGF0aChwYXRoKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9zZWxlY3Rpb25zLmZpbmRJbmRleChlID0+IGUucGF0aCA9PT0gbm9ybWFsaXplZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLl9zZWxlY3Rpb25zW2luZGV4XTtcbiAgICAgICAgdGhpcy5fc2VsZWN0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpZiAoZW50cnkudXVpZCkge1xuICAgICAgICAgICAgdGhpcy5fY2FsbExvc3RGb2N1c0luRWRpdG9yKGVudHJ5LnV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0KCdzZWxlY3Rpb246dW5zZWxlY3QnLCBub3JtYWxpemVkLCB0aGlzLl9nZXRQYXRocygpKTtcbiAgICB9XG5cbiAgICBjbGVhcigpOiB2b2lkIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX3NlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLl9zZWxlY3Rpb25zLnNoaWZ0KCk7XG4gICAgICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxsTG9zdEZvY3VzSW5FZGl0b3IoZW50cnkudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc2VsZWN0aW9uOnVuc2VsZWN0JywgZW50cnkucGF0aCwgdGhpcy5fZ2V0UGF0aHMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5icm9hZGNhc3QoJ3NlbGVjdGlvbjpjbGVhcicpO1xuICAgIH1cblxuICAgIHF1ZXJ5KCk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbnMubWFwKGUgPT4gZS5wYXRoKTtcbiAgICB9XG5cbiAgICBpc1NlbGVjdChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZU5vZGVQYXRoKHBhdGgpO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VsZWN0aW9ucy5zb21lKGUgPT4gZS5wYXRoID09PSBub3JtYWxpemVkKTtcbiAgICB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0aW9ucy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFBhdGhzKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbnMubWFwKGUgPT4gZS5wYXRoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jYWxsRm9jdXNJbkVkaXRvcih1dWlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBnZXRFZGl0b3JOb2RlQnlVdWlkKHV1aWQpIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghbm9kZT8uX2NvbXBvbmVudHMpIHJldHVybjtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcCBvZiBub2RlLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcD8ub25Gb2N1c0luRWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXAub25Gb2N1c0luRWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU2VsZWN0aW9uXSBvbkZvY3VzSW5FZGl0b3IgZXJyb3I6JywgZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9jYWxsTG9zdEZvY3VzSW5FZGl0b3IodXVpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gZ2V0RWRpdG9yTm9kZUJ5VXVpZCh1dWlkKSBhcyBhbnk7XG4gICAgICAgICAgICBpZiAoIW5vZGU/Ll9jb21wb25lbnRzKSByZXR1cm47XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXAgb2Ygbm9kZS5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXA/Lm9uTG9zdEZvY3VzSW5FZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcC5vbkxvc3RGb2N1c0luRWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU2VsZWN0aW9uXSBvbkxvc3RGb2N1c0luRWRpdG9yIGVycm9yOicsIGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19