"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("./gizmo-base"));
const icon_1 = __importDefault(require("../controller/icon"));
const tempQuat_a = new cc_1.Quat();
class IconGizmoBase extends gizmo_base_1.default {
    _controller;
    _isIconGizmoVisible = false;
    disableOnSelected = false;
    init() {
        this.createController();
    }
    onShow() {
        this._controller.show();
        this.updateController();
    }
    onHide() {
        this._controller.hide();
    }
    setIconGizmoVisible(visible) {
        this._isIconGizmoVisible = visible;
        if (visible) {
            this.show();
        }
        else {
            this.hide();
        }
    }
    setIconGizmo3D(value) {
        if (!this._controller)
            return;
        this._controller.is3DIcon = value;
        // 3D 模式下使用默认尺寸 64
    }
    setIconGizmoSize(size) {
        if (!this._controller)
            return;
        this._controller.updateSize(size);
    }
    createController() {
        const gizmoRoot = this.getGizmoRoot();
        this._controller = new icon_1.default(gizmoRoot, { texture: true });
        this._controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
        this._controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
        this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
        // 默认配置：is3DIcon=false，iconGizmoSize=64
        this._controller.is3DIcon = false;
        this._controller.updateSize(2);
        if (!this._isIconGizmoVisible) {
            this._controller.hide();
        }
    }
    onControllerMouseDown() { }
    onControllerMouseMove() { }
    onControllerMouseUp() {
        if (this.target) {
            try {
                const { Service } = require('../../core/decorator');
                const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
                const path = EditorExtends?.Node?.getNodePath?.(this.target.node) ?? '';
                if (path) {
                    Service.Selection?.select(path);
                }
            }
            catch (e) {
                // not ready
            }
        }
    }
    updateController() {
        this.updateControllerTransform();
    }
    updateControllerTransform() {
        if (!this._isInitialized || this.target === null)
            return;
        const node = this.target.node;
        const worldPos = node.getWorldPosition();
        node.getWorldRotation(tempQuat_a);
        this._controller.setPosition(worldPos);
        this._controller.setRotation(tempQuat_a);
        this._controller.onEditorCameraMoved();
    }
    onTargetUpdate() {
        this.updateController();
    }
    onNodeChanged(_event) {
        this.updateController();
    }
    onNodeSelectionChanged(selection) {
        super.onNodeSelectionChanged(selection);
        if (selection && this.disableOnSelected) {
            this.hide();
            return;
        }
        if (!selection) {
            this.show();
        }
    }
    checkVisible() {
        if (!this.target)
            return false;
        if (!this._isIconGizmoVisible)
            return false;
        if (this._nodeSelected && this.disableOnSelected)
            return false;
        if (this.target.node.objFlags & cc.Object.Flags.LockedInEditor)
            return false;
        return super.checkVisible();
    }
}
exports.default = IconGizmoBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l6bW8taWNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9naXptby9iYXNlL2dpem1vLWljb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwyQkFBcUM7QUFFckMsOERBQXFDO0FBQ3JDLDhEQUFnRDtBQUVoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBRTlCLE1BQU0sYUFBK0MsU0FBUSxvQkFBWTtJQUMzRCxXQUFXLENBQWtCO0lBQy9CLG1CQUFtQixHQUFHLEtBQUssQ0FBQztJQUM3QixpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFFakMsSUFBSTtRQUNBLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELG1CQUFtQixDQUFDLE9BQWdCO1FBQ2hDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUM7UUFDbkMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNWLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQixDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztJQUVELGNBQWMsQ0FBQyxLQUFjO1FBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVztZQUFFLE9BQU87UUFDOUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLGtCQUFrQjtJQUN0QixDQUFDO0lBRUQsZ0JBQWdCLENB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Q3JDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztJQUVNLFlBQVk7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07WUFBRSxPQUFPLEtBQUssQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQjtZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQzVDLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsaUJBQWlCO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDL0QsSUFBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQVksQ0FBQyxRQUFRLEdBQUksRUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQy9GLE9BQU8sS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ2hDLENBQUM7Q0FDSjtBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1YXQsIENvbXBvbmVudCB9IGZyb20gJ2NjJztcblxuaW1wb3J0IEdpem1vQmFzZSBmcm9tICcuL2dpem1vLWJhc2UnO1xuaW1wb3J0IEljb25Db250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXIvaWNvbic7XG5cbmNvbnN0IHRlbXBRdWF0X2EgPSBuZXcgUXVhdCgpO1xuXG5jbGFzcyBJY29uR2l6bW9CYXNlPFQgZXh0ZW5kcyBDb21wb25lbnQgPSBDb21wb25lbnQ+IGV4dGVuZHMgR2l6bW9CYXNlPFQ+IHtcbiAgICBwcm90ZWN0ZWQgX2NvbnRyb2xsZXIhOiBJY29uQ29udHJvbGxlcjtcbiAgICBwcml2YXRlIF9pc0ljb25HaXptb1Zpc2libGUgPSBmYWxzZTtcbiAgICBwdWJsaWMgZGlzYWJsZU9uU2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uU2hvdygpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zaG93KCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uSGlkZSgpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgfVxuXG4gICAgc2V0SWNvbkdpem1vVmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX2lzSWNvbkdpem1vVmlzaWJsZSA9IHZpc2libGU7XG4gICAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0SWNvbkdpem1vM0QodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jb250cm9sbGVyKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuaXMzREljb24gPSB2YWx1ZTtcbiAgICAgICAgLy8gM0Qg5qih5byP5LiL5L2/55So6buY6K6k5bC65a+4IDY0XG4gICAgfVxuXG4gICAgc2V0SWNvbkdpem1vU2l6ZShzaXplOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jb250cm9sbGVyKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlU2l6ZShzaXplKTtcbiAgICB9XG5cbiAgICBjcmVhdGVDb250cm9sbGVyKCkge1xuICAgICAgICBjb25zdCBnaXptb1Jvb3QgPSB0aGlzLmdldEdpem1vUm9vdCgpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gbmV3IEljb25Db250cm9sbGVyKGdpem1vUm9vdCwgeyB0ZXh0dXJlOiB0cnVlIH0pO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlRG93biA9IHRoaXMub25Db250cm9sbGVyTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VNb3ZlID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZVVwID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZVVwLmJpbmQodGhpcyk7XG4gICAgICAgIC8vIOm7mOiupOmFjee9ru+8mmlzM0RJY29uPWZhbHNl77yMaWNvbkdpem1vU2l6ZT02NFxuICAgICAgICB0aGlzLl9jb250cm9sbGVyLmlzM0RJY29uID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlU2l6ZSgyKTtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0ljb25HaXptb1Zpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Db250cm9sbGVyTW91c2VEb3duKCkge31cblxuICAgIG9uQ29udHJvbGxlck1vdXNlTW92ZSgpIHt9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZVVwKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi8uLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzIHx8IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcztcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gRWRpdG9yRXh0ZW5kcz8uTm9kZT8uZ2V0Tm9kZVBhdGg/Lih0aGlzLnRhcmdldC5ub2RlKSA/PyAnJztcbiAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlLlNlbGVjdGlvbj8uc2VsZWN0KHBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBub3QgcmVhZHlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCB0aGlzLnRhcmdldCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy50YXJnZXQubm9kZTtcbiAgICAgICAgY29uc3Qgd29ybGRQb3MgPSBub2RlLmdldFdvcmxkUG9zaXRpb24oKTtcbiAgICAgICAgbm9kZS5nZXRXb3JsZFJvdGF0aW9uKHRlbXBRdWF0X2EpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldFBvc2l0aW9uKHdvcmxkUG9zKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRSb3RhdGlvbih0ZW1wUXVhdF9hKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkVkaXRvckNhbWVyYU1vdmVkKCk7XG4gICAgfVxuXG4gICAgb25UYXJnZXRVcGRhdGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uTm9kZUNoYW5nZWQoX2V2ZW50OiBhbnkpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgfVxuXG4gICAgb25Ob2RlU2VsZWN0aW9uQ2hhbmdlZChzZWxlY3Rpb246IGJvb2xlYW4pIHtcbiAgICAgICAgc3VwZXIub25Ob2RlU2VsZWN0aW9uQ2hhbmdlZChzZWxlY3Rpb24pO1xuICAgICAgICBpZiAoc2VsZWN0aW9uICYmIHRoaXMuZGlzYWJsZU9uU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja1Zpc2libGUoKSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0ljb25HaXptb1Zpc2libGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuX25vZGVTZWxlY3RlZCAmJiB0aGlzLmRpc2FibGVPblNlbGVjdGVkKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgodGhpcy50YXJnZXQubm9kZSBhcyBhbnkpLm9iakZsYWdzICYgKGNjIGFzIGFueSkuT2JqZWN0LkZsYWdzLkxvY2tlZEluRWRpdG9yKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBzdXBlci5jaGVja1Zpc2libGUoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEljb25HaXptb0Jhc2U7XG4iXX0=