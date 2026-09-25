'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentGizmo = exports.IconGizmo = exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../../base/gizmo-base"));
const image_1 = __importDefault(require("../../controller/image"));
const gizmo_defines_1 = require("../../gizmo-defines");
const tempQuat = new cc_1.Quat();
class VideoPlayerPersistentGizmo extends gizmo_base_1.default {
    _controller;
    init() {
        const gizmoRoot = this.getGizmoRoot();
        this._controller = new image_1.default(gizmoRoot, { texture: true });
    }
    onShow() {
        this._controller.show();
        this.updateController();
    }
    onHide() {
        this._controller.hide();
    }
    updateControllerData() {
        if (!this._isInitialized || !this.target)
            return;
        const uiTransComp = this.target.node.getComponent(cc_1.UITransform);
        if (!uiTransComp)
            return;
        const contentSize = uiTransComp.contentSize;
        this._controller.updateSize(new cc_1.Vec3(), new cc_1.Vec2(contentSize.width, -contentSize.height));
        this._controller.show();
    }
    updateControllerTransform() {
        if (!this._isInitialized || !this.target)
            return;
        const node = this.target.node;
        const worldPos = node.getWorldPosition();
        node.getWorldRotation(tempQuat);
        this._controller.setPosition(worldPos);
        this._controller.setRotation(tempQuat);
    }
    updateController() {
        this.updateControllerData();
        this.updateControllerTransform();
    }
    onTargetUpdate() {
        this.updateController();
    }
    onNodeChanged() {
        this.updateController();
    }
}
exports.name = cc_1.js.getClassName(cc_1.VideoPlayer);
exports.SelectGizmo = null;
exports.IconGizmo = null;
exports.PersistentGizmo = VideoPlayerPersistentGizmo;
(0, gizmo_defines_1.registerGizmo)(exports.name, { PersistentGizmo: exports.PersistentGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy92aWRlby1wbGF5ZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYiwyQkFBb0U7QUFDcEUsdUVBQThDO0FBQzlDLG1FQUFxRDtBQUNyRCx1REFBb0Q7QUFFcEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUU1QixNQUFNLDBCQUEyQixTQUFRLG9CQUFTO0lBQ3BDLFdBQVcsQ0FBbUI7SUFFeEMsSUFBSTtRQUNBLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELG9CQUFvQjtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQUUsT0FBTztRQUNqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQVcsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTztRQUN6QixNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDO1FBQzVDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLElBQUksU0FBSSxFQUFFLEVBQUUsSUFBSSxTQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELHlCQUF5QjtRQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQUUsT0FBTztRQUNqRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELGdCQUFnQjtRQUNaLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxjQUFjO1FBQ1YsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELGFBQWE7UUFDVCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0NBQ0o7QUFFWSxRQUFBLElBQUksR0FBRyxPQUFFLENBQUMsWUFBWSxDQUFDLGdCQUFXLENBQUMsQ0FBQztBQUNwQyxRQUFBLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDbkIsUUFBQSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFFBQUEsZUFBZSxHQUFHLDBCQUEwQixDQUFDO0FBRTFELElBQUEsNkJBQWEsRUFBQyxZQUFJLEVBQUUsRUFBRSxlQUFlLEVBQWYsdUJBQWUsRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFF1YXQsIFVJVHJhbnNmb3JtLCBWZWMzLCBWZWMyLCBqcywgVmlkZW9QbGF5ZXIgfSBmcm9tICdjYyc7XG5pbXBvcnQgR2l6bW9CYXNlIGZyb20gJy4uLy4uL2Jhc2UvZ2l6bW8tYmFzZSc7XG5pbXBvcnQgSW1hZ2VDb250cm9sbGVyIGZyb20gJy4uLy4uL2NvbnRyb2xsZXIvaW1hZ2UnO1xuaW1wb3J0IHsgcmVnaXN0ZXJHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vLWRlZmluZXMnO1xuXG5jb25zdCB0ZW1wUXVhdCA9IG5ldyBRdWF0KCk7XG5cbmNsYXNzIFZpZGVvUGxheWVyUGVyc2lzdGVudEdpem1vIGV4dGVuZHMgR2l6bW9CYXNlIHtcbiAgICBwcm90ZWN0ZWQgX2NvbnRyb2xsZXIhOiBJbWFnZUNvbnRyb2xsZXI7XG5cbiAgICBpbml0KCkge1xuICAgICAgICBjb25zdCBnaXptb1Jvb3QgPSB0aGlzLmdldEdpem1vUm9vdCgpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gbmV3IEltYWdlQ29udHJvbGxlcihnaXptb1Jvb3QsIHsgdGV4dHVyZTogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBvblNob3coKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2hvdygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXIoKTtcbiAgICB9XG5cbiAgICBvbkhpZGUoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuaGlkZSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJEYXRhKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbGl6ZWQgfHwgIXRoaXMudGFyZ2V0KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHVpVHJhbnNDb21wID0gdGhpcy50YXJnZXQubm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xuICAgICAgICBpZiAoIXVpVHJhbnNDb21wKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGNvbnRlbnRTaXplID0gdWlUcmFuc0NvbXAuY29udGVudFNpemU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlU2l6ZShuZXcgVmVjMygpLCBuZXcgVmVjMihjb250ZW50U2l6ZS53aWR0aCwgLWNvbnRlbnRTaXplLmhlaWdodCkpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNob3coKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbGl6ZWQgfHwgIXRoaXMudGFyZ2V0KSByZXR1cm47XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnRhcmdldC5ub2RlO1xuICAgICAgICBjb25zdCB3b3JsZFBvcyA9IG5vZGUuZ2V0V29ybGRQb3NpdGlvbigpO1xuICAgICAgICBub2RlLmdldFdvcmxkUm90YXRpb24odGVtcFF1YXQpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldFBvc2l0aW9uKHdvcmxkUG9zKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRSb3RhdGlvbih0ZW1wUXVhdCk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29udHJvbGxlcigpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyRGF0YSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oKTtcbiAgICB9XG5cbiAgICBvblRhcmdldFVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgfVxuXG4gICAgb25Ob2RlQ2hhbmdlZCgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgbmFtZSA9IGpzLmdldENsYXNzTmFtZShWaWRlb1BsYXllcik7XG5leHBvcnQgY29uc3QgU2VsZWN0R2l6bW8gPSBudWxsO1xuZXhwb3J0IGNvbnN0IEljb25HaXptbyA9IG51bGw7XG5leHBvcnQgY29uc3QgUGVyc2lzdGVudEdpem1vID0gVmlkZW9QbGF5ZXJQZXJzaXN0ZW50R2l6bW87XG5cbnJlZ2lzdGVyR2l6bW8obmFtZSwgeyBQZXJzaXN0ZW50R2l6bW8gfSk7XG4iXX0=