"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gizmo_base_1 = __importDefault(require("../base/gizmo-base"));
const cc_1 = require("cc");
const global_events_1 = require("../../core/global-events");
const editor_node_1 = require("../utils/editor-node");
/**
 * 获取 Service（惰性访问，避免循环依赖）
 */
function getService() {
    try {
        const { Service } = require('../../core/decorator');
        return Service;
    }
    catch (e) {
        return null;
    }
}
class TransformBaseGizmo extends gizmo_base_1.default {
    _controller;
    isNodeLocked(_node) {
        return false;
    }
    get nodes() {
        const svc = getService();
        const paths = svc?.Selection?.query?.() ?? [];
        const nodes = paths.map((path) => {
            return (0, editor_node_1.getEditorNodeByPath)(path);
        });
        return nodes.filter((node) => {
            if (node === null || !node.isValid || this.isNodeLocked(node)) {
                return false;
            }
            let parent = node.parent;
            while (parent) {
                if (nodes.includes(parent) && !this.isNodeLocked(parent)) {
                    return false;
                }
                if (!parent.isValid) {
                    return false;
                }
                // 如果父节点是 null 并且不是场景节点说明它是要被删除的节点
                if (parent.parent === null && !(parent instanceof cc_1.Scene)) {
                    return false;
                }
                parent = parent.parent;
            }
            return true;
        });
    }
    onShow() {
        if (!this._controller || this.nodes.length === 0) {
            return;
        }
        this._controller.show();
        if (this.updateControllerTransform) {
            this.updateControllerTransform();
        }
    }
    onHide() {
        // 由于 Controller 只有全局唯一一个，
        // 所有当选中的 node 列表为 0 的时候不允许隐藏
        // 否则如何出现了选中 A 节点，后隐藏 B 节点，
        // 会把 A 节点 gizmo 隐藏
        if (this.target && this._controller && this.nodes.length === 1) {
            return;
        }
        if (this._controller) {
            this._controller.hide();
        }
    }
    onTargetUpdate() {
        if (this._controller && this.updateControllerTransform) {
            this.updateControllerTransform();
        }
    }
    onNodeChanged(_event) {
        if (this._controller && this.updateControllerTransform) {
            this.updateControllerTransform();
            this._controller.adjustControllerSize?.();
        }
    }
    // 发送节点修改消息
    broadcastNodeChangeMessage(node) {
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        global_events_1.ServiceEvents.broadcast('node:change', EditorExtends.Node.getNodePath(node));
    }
    getSnappedValue(inNumber, snapStep) {
        return Math.round(inNumber / snapStep) * snapStep;
    }
    isControlKeyPressed(event) {
        return event.ctrlKey || event.metaKey;
    }
    /**
     * 默认行为是 controller 被按下就打断
     */
    onKeyDown(_event) {
        if (!this.target) {
            return;
        }
        return !this._controller?.isMouseDown;
    }
    /**
     * 默认行为是 controller 被按下就打断
     */
    onKeyUp(_event) {
        if (!this.target) {
            return true;
        }
        return !this._controller?.isMouseDown;
    }
}
exports.default = TransformBaseGizmo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vbm9kZS90cmFuc2Zvcm0tYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLG9FQUEyQztBQUUzQywyQkFBNEM7QUFFNUMsNERBQXlEO0FBQ3pELHNEQUEyRDtBQUUzRDs7R0FFRztBQUNILFNBQVMsVUFBVTtJQUNmLElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNwRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxrQkFBbUIsU0FBUSxvQkFBb0I7SUFDdkMsV0FBVyxDQUFrQjtJQUc3QixZQUFZLENBQUMsS0FBVztRQUM5QixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsSUFBVyxLQUFLO1FBQ1osTUFBTSxHQUFHLEdBQUcsVUFBVSxFQUFFLENBQUM7UUFDekIsTUFBTSxLQUFLLEdBQWEsR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUN4RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDckMsT0FBTyxJQUFBLGlDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBaUIsRUFBRSxFQUFFO1lBQ3RDLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFlBQVks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QUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLE9BQU87UUFDWCxDQUFDO1FBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDO0lBQzFDLENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU8sQ0FBQyxNQUFXO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUM7SUFDMUMsQ0FBQztDQUNKO0FBRUQsa0JBQWUsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2l6bW9CYXNlIGZyb20gJy4uL2Jhc2UvZ2l6bW8tYmFzZSc7XG5pbXBvcnQgQ29udHJvbGxlckJhc2UgZnJvbSAnLi4vY29udHJvbGxlci9iYXNlJztcbmltcG9ydCB7IE5vZGUsIENvbXBvbmVudCwgU2NlbmUgfSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7IEdpem1vTW91c2VFdmVudCB9IGZyb20gJy4uL3V0aWxzL2RlZmluZXMnO1xuaW1wb3J0IHsgU2VydmljZUV2ZW50cyB9IGZyb20gJy4uLy4uL2NvcmUvZ2xvYmFsLWV2ZW50cyc7XG5pbXBvcnQgeyBnZXRFZGl0b3JOb2RlQnlQYXRoIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yLW5vZGUnO1xuXG4vKipcbiAqIOiOt+WPliBTZXJ2aWNl77yI5oOw5oCn6K6/6Zeu77yM6YG/5YWN5b6q546v5L6d6LWW77yJXG4gKi9cbmZ1bmN0aW9uIGdldFNlcnZpY2UoKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgIHJldHVybiBTZXJ2aWNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5jbGFzcyBUcmFuc2Zvcm1CYXNlR2l6bW8gZXh0ZW5kcyBHaXptb0Jhc2U8Q29tcG9uZW50PiB7XG4gICAgcHJvdGVjdGVkIF9jb250cm9sbGVyITogQ29udHJvbGxlckJhc2U7XG4gICAgcHJvdGVjdGVkIHVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0/KC4uLmFyZ3M6IGFueVtdKTogdm9pZDtcblxuICAgIHByb3RlY3RlZCBpc05vZGVMb2NrZWQoX25vZGU6IE5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgbm9kZXMoKTogTm9kZVtdIHtcbiAgICAgICAgY29uc3Qgc3ZjID0gZ2V0U2VydmljZSgpO1xuICAgICAgICBjb25zdCBwYXRoczogc3RyaW5nW10gPSBzdmM/LlNlbGVjdGlvbj8ucXVlcnk/LigpID8/IFtdO1xuICAgICAgICBjb25zdCBub2RlcyA9IHBhdGhzLm1hcCgocGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RWRpdG9yTm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBub2Rlcy5maWx0ZXIoKG5vZGU6IE5vZGUgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICBpZiAobm9kZSA9PT0gbnVsbCB8fCAhbm9kZS5pc1ZhbGlkIHx8IHRoaXMuaXNOb2RlTG9ja2VkKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHBhcmVudCA9IG5vZGUucGFyZW50O1xuICAgICAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChub2Rlcy5pbmNsdWRlcyhwYXJlbnQpICYmICF0aGlzLmlzTm9kZUxvY2tlZChwYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFwYXJlbnQuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWmguaenOeItuiKgueCueaYryBudWxsIOW5tuS4lOS4jeaYr+WcuuaZr+iKgueCueivtOaYjuWug+aYr+imgeiiq+WIoOmZpOeahOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQucGFyZW50ID09PSBudWxsICYmICEocGFyZW50IGluc3RhbmNlb2YgU2NlbmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KSBhcyBOb2RlW107XG4gICAgfVxuXG4gICAgb25TaG93KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRyb2xsZXIgfHwgdGhpcy5ub2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNob3coKTtcbiAgICAgICAgaWYgKHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkhpZGUoKSB7XG4gICAgICAgIC8vIOeUseS6jiBDb250cm9sbGVyIOWPquacieWFqOWxgOWUr+S4gOS4gOS4qu+8jFxuICAgICAgICAvLyDmiYDmnInlvZPpgInkuK3nmoQgbm9kZSDliJfooajkuLogMCDnmoTml7blgJnkuI3lhYHorrjpmpDol49cbiAgICAgICAgLy8g5ZCm5YiZ5aaC5L2V5Ye6546w5LqG6YCJ5LitIEEg6IqC54K577yM5ZCO6ZqQ6JePIEIg6IqC54K577yMXG4gICAgICAgIC8vIOS8muaKiiBBIOiKgueCuSBnaXptbyDpmpDol49cbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICYmIHRoaXMuX2NvbnRyb2xsZXIgJiYgdGhpcy5ub2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uVGFyZ2V0VXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5fY29udHJvbGxlciAmJiB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Ob2RlQ2hhbmdlZChfZXZlbnQ/OiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvbnRyb2xsZXIgJiYgdGhpcy51cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuYWRqdXN0Q29udHJvbGxlclNpemU/LigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5Y+R6YCB6IqC54K55L+u5pS55raI5oGvXG4gICAgcHJvdGVjdGVkIGJyb2FkY2FzdE5vZGVDaGFuZ2VNZXNzYWdlKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgRWRpdG9yRXh0ZW5kcyA9IChjYyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgICAgICBTZXJ2aWNlRXZlbnRzLmJyb2FkY2FzdCgnbm9kZTpjaGFuZ2UnLCBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZVBhdGgobm9kZSkpO1xuICAgIH1cblxuICAgIGdldFNuYXBwZWRWYWx1ZShpbk51bWJlcjogbnVtYmVyLCBzbmFwU3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoaW5OdW1iZXIgLyBzbmFwU3RlcCkgKiBzbmFwU3RlcDtcbiAgICB9XG5cbiAgICBpc0NvbnRyb2xLZXlQcmVzc2VkKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpu5jorqTooYzkuLrmmK8gY29udHJvbGxlciDooqvmjInkuIvlsLHmiZPmlq1cbiAgICAgKi9cbiAgICBvbktleURvd24oX2V2ZW50OiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhdGhpcy5fY29udHJvbGxlcj8uaXNNb3VzZURvd247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6buY6K6k6KGM5Li65pivIGNvbnRyb2xsZXIg6KKr5oyJ5LiL5bCx5omT5patXG4gICAgICovXG4gICAgb25LZXlVcChfZXZlbnQ6IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIXRoaXMuX2NvbnRyb2xsZXI/LmlzTW91c2VEb3duO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVHJhbnNmb3JtQmFzZUdpem1vO1xuIl19