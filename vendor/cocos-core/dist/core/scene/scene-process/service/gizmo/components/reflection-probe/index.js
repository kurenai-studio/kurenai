'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentGizmo = exports.IconGizmo = exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../../base/gizmo-base"));
const gizmo_icon_1 = __importDefault(require("../../base/gizmo-icon"));
const box_1 = __importDefault(require("../../controller/box"));
const gizmo_defines_1 = require("../../gizmo-defines");
const tempVec3 = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
/**
 * 反射探针（ReflectionProbe）选中 Gizmo：
 * 画出影响区域包围盒线框，并支持拖拽包围盒面手柄修改 size。
 * 注意 ReflectionProbe.size 是 AABB 半长，线框全尺寸 = size * 2。
 * PLANAR 类型的 size 为扁平值（默认 5,0.5,5），会显示成一块薄盒（平面）。
 */
class ReflectionProbeComponentGizmo extends gizmo_base_1.default {
    _controller;
    _size = new cc_1.Vec3();
    _scale = new cc_1.Vec3();
    _propPath = null;
    init() {
        this.createController();
        this._isInitialized = true;
    }
    onShow() {
        this._controller.show();
        this.updateControllerData();
    }
    onHide() {
        this._controller.hide();
    }
    createController() {
        const gizmoRoot = this.getGizmoRoot();
        this._controller = new box_1.default(gizmoRoot);
        // 青色以区别于碰撞盒的绿色
        this._controller.setColor(new cc_1.Color(0, 200, 255));
        this._controller.editable = true;
        this._controller.hoverColor = cc_1.Color.YELLOW;
        this._controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
        this._controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
        this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    }
    onControllerMouseDown() {
        if (!this._isInitialized || this.target === null)
            return;
        this._size = this.target.size.clone();
        this._scale = this.target.node.getWorldScale();
        this._propPath = this.getCompPropPath('size');
    }
    onControllerMouseMove() {
        this.updateDataFromController();
    }
    onControllerMouseUp() {
        this.onControlEnd(this._propPath);
    }
    updateDataFromController() {
        if (this._controller.updated && this.target) {
            this.onControlUpdate(this._propPath);
            const deltaSize = this._controller.getDeltaSize();
            // size 为半长：手柄位移即半长增量，除以世界缩放换算到本地，不乘 2
            cc_1.Vec3.divide(deltaSize, deltaSize, this._scale);
            const newSize = cc_1.Vec3.add(tempVec3, this._size, deltaSize);
            newSize.x = Math.max(0, newSize.x);
            newSize.y = Math.max(0, newSize.y);
            newSize.z = Math.max(0, newSize.z);
            this.target.size = newSize;
            this.onComponentChanged(this.target.node);
        }
    }
    updateControllerTransform() {
        this.updateControllerData();
    }
    updateControllerData() {
        if (!this._isInitialized || this.target == null)
            return;
        if (this.target instanceof cc_1.ReflectionProbe) {
            const node = this.target.node;
            this._controller.show();
            this._controller.checkEdit();
            const worldScale = node.getWorldScale();
            const worldPos = node.getWorldPosition();
            const worldRot = tempQuat_a;
            node.getWorldRotation(worldRot);
            this._controller.setScale(worldScale);
            this._controller.setPosition(worldPos);
            this._controller.setRotation(worldRot);
            // 影响盒中心即节点原点，全尺寸 = 半长 * 2
            const fullSize = cc_1.Vec3.multiplyScalar(tempVec3, this.target.size, 2);
            this._controller.updateSize(cc_1.Vec3.ZERO, fullSize);
        }
        else {
            this._controller.hide();
        }
    }
    onTargetUpdate() {
        this.updateControllerData();
    }
    onNodeChanged() {
        this.updateControllerData();
    }
}
class ReflectionProbeIconGizmo extends gizmo_icon_1.default {
    disableOnSelected = true;
    createController() {
        super.createController();
        this._controller.setTextureByUUID('dee6f7cc-ba21-4091-948f-4f508495f260@6c48a');
    }
}
exports.name = cc_1.js.getClassName(cc_1.ReflectionProbe);
// 仅选中 ReflectionProbe 节点时显示影响盒（对齐 Creator 的选中态；图标/预览球后续再加）。
exports.SelectGizmo = ReflectionProbeComponentGizmo;
exports.IconGizmo = ReflectionProbeIconGizmo;
exports.PersistentGizmo = null;
(0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo, IconGizmo: exports.IconGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy9yZWZsZWN0aW9uLXByb2JlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsMkJBQTREO0FBQzVELHVFQUE4QztBQUM5Qyx1RUFBa0Q7QUFDbEQsK0RBQWlEO0FBQ2pELHVEQUFvRDtBQUVwRCxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFFOUI7Ozs7O0dBS0c7QUFDSCxNQUFNLDZCQUE4QixTQUFRLG9CQUEwQjtJQUMxRCxXQUFXLENBQWlCO0lBQzVCLEtBQUssR0FBUyxJQUFJLFNBQUksRUFBRSxDQUFDO0lBQ3pCLE1BQU0sR0FBUyxJQUFJLFNBQUksRUFBRSxDQUFDO0lBQzFCLFNBQVMsR0FBa0IsSUFBSSxDQUFDO0lBRXhDLElBQUk7UUFDQSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztJQUMvQixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxnQkFBZ0I7UUFDWixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoRCxlQUFlO1FBQ2YsSUFBSSxDQUFDLFdB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RUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsNENBQTRDLENBQUMsQ0FBQztJQUNwRixDQUFDO0NBQ0o7QUFFWSxRQUFBLElBQUksR0FBRyxPQUFFLENBQUMsWUFBWSxDQUFDLG9CQUFlLENBQUMsQ0FBQztBQUNyRCw0REFBNEQ7QUFDL0MsUUFBQSxXQUFXLEdBQUcsNkJBQTZCLENBQUM7QUFDNUMsUUFBQSxTQUFTLEdBQUcsd0JBQXdCLENBQUM7QUFDckMsUUFBQSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBRXBDLElBQUEsNkJBQWEsRUFBQyxZQUFJLEVBQUUsRUFBRSxXQUFXLEVBQVgsbUJBQVcsRUFBRSxTQUFTLEVBQVQsaUJBQVMsRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IENvbG9yLCBqcywgUXVhdCwgUmVmbGVjdGlvblByb2JlLCBWZWMzIH0gZnJvbSAnY2MnO1xuaW1wb3J0IEdpem1vQmFzZSBmcm9tICcuLi8uLi9iYXNlL2dpem1vLWJhc2UnO1xuaW1wb3J0IEljb25HaXptb0Jhc2UgZnJvbSAnLi4vLi4vYmFzZS9naXptby1pY29uJztcbmltcG9ydCBCb3hDb250cm9sbGVyIGZyb20gJy4uLy4uL2NvbnRyb2xsZXIvYm94JztcbmltcG9ydCB7IHJlZ2lzdGVyR2l6bW8gfSBmcm9tICcuLi8uLi9naXptby1kZWZpbmVzJztcblxuY29uc3QgdGVtcFZlYzMgPSBuZXcgVmVjMygpO1xuY29uc3QgdGVtcFF1YXRfYSA9IG5ldyBRdWF0KCk7XG5cbi8qKlxuICog5Y+N5bCE5o6i6ZKI77yIUmVmbGVjdGlvblByb2Jl77yJ6YCJ5LitIEdpem1v77yaXG4gKiDnlLvlh7rlvbHlk43ljLrln5/ljIXlm7Tnm5Lnur/moYbvvIzlubbmlK/mjIHmi5bmi73ljIXlm7Tnm5LpnaLmiYvmn4Tkv67mlLkgc2l6ZeOAglxuICog5rOo5oSPIFJlZmxlY3Rpb25Qcm9iZS5zaXplIOaYryBBQUJCIOWNiumVv++8jOe6v+ahhuWFqOWwuuWvuCA9IHNpemUgKiAy44CCXG4gKiBQTEFOQVIg57G75Z6L55qEIHNpemUg5Li65omB5bmz5YC877yI6buY6K6kIDUsMC41LDXvvInvvIzkvJrmmL7npLrmiJDkuIDlnZfoloTnm5LvvIjlubPpnaLvvInjgIJcbiAqL1xuY2xhc3MgUmVmbGVjdGlvblByb2JlQ29tcG9uZW50R2l6bW8gZXh0ZW5kcyBHaXptb0Jhc2U8UmVmbGVjdGlvblByb2JlPiB7XG4gICAgcHJpdmF0ZSBfY29udHJvbGxlciE6IEJveENvbnRyb2xsZXI7XG4gICAgcHJpdmF0ZSBfc2l6ZTogVmVjMyA9IG5ldyBWZWMzKCk7XG4gICAgcHJpdmF0ZSBfc2NhbGU6IFZlYzMgPSBuZXcgVmVjMygpO1xuICAgIHByaXZhdGUgX3Byb3BQYXRoOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29udHJvbGxlcigpO1xuICAgICAgICB0aGlzLl9pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvblNob3coKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2hvdygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25IaWRlKCkge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVDb250cm9sbGVyKCkge1xuICAgICAgICBjb25zdCBnaXptb1Jvb3QgPSB0aGlzLmdldEdpem1vUm9vdCgpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gbmV3IEJveENvbnRyb2xsZXIoZ2l6bW9Sb290KTtcbiAgICAgICAgLy8g6Z2S6Imy5Lul5Yy65Yir5LqO56Kw5pKe55uS55qE57u/6ImyXG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0Q29sb3IobmV3IENvbG9yKDAsIDIwMCwgMjU1KSk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuZWRpdGFibGUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhvdmVyQ29sb3IgPSBDb2xvci5ZRUxMT1c7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VEb3duID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZURvd24uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZU1vdmUgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlVXAgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlVXAuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZURvd24oKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCB0aGlzLnRhcmdldCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9zaXplID0gdGhpcy50YXJnZXQuc2l6ZS5jbG9uZSgpO1xuICAgICAgICB0aGlzLl9zY2FsZSA9IHRoaXMudGFyZ2V0Lm5vZGUuZ2V0V29ybGRTY2FsZSgpO1xuICAgICAgICB0aGlzLl9wcm9wUGF0aCA9IHRoaXMuZ2V0Q29tcFByb3BQYXRoKCdzaXplJyk7XG4gICAgfVxuXG4gICAgb25Db250cm9sbGVyTW91c2VNb3ZlKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uQ29udHJvbGxlck1vdXNlVXAoKSB7XG4gICAgICAgIHRoaXMub25Db250cm9sRW5kKHRoaXMuX3Byb3BQYXRoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVEYXRhRnJvbUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyLnVwZGF0ZWQgJiYgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHRoaXMub25Db250cm9sVXBkYXRlKHRoaXMuX3Byb3BQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhU2l6ZSA9IHRoaXMuX2NvbnRyb2xsZXIuZ2V0RGVsdGFTaXplKCk7XG4gICAgICAgICAgICAvLyBzaXplIOS4uuWNiumVv++8muaJi+afhOS9jeenu+WNs+WNiumVv+WinumHj++8jOmZpOS7peS4lueVjOe8qeaUvuaNoueul+WIsOacrOWcsO+8jOS4jeS5mCAyXG4gICAgICAgICAgICBWZWMzLmRpdmlkZShkZWx0YVNpemUsIGRlbHRhU2l6ZSwgdGhpcy5fc2NhbGUpO1xuICAgICAgICAgICAgY29uc3QgbmV3U2l6ZSA9IFZlYzMuYWRkKHRlbXBWZWMzLCB0aGlzLl9zaXplLCBkZWx0YVNpemUpO1xuICAgICAgICAgICAgbmV3U2l6ZS54ID0gTWF0aC5tYXgoMCwgbmV3U2l6ZS54KTtcbiAgICAgICAgICAgIG5ld1NpemUueSA9IE1hdGgubWF4KDAsIG5ld1NpemUueSk7XG4gICAgICAgICAgICBuZXdTaXplLnogPSBNYXRoLm1heCgwLCBuZXdTaXplLnopO1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuc2l6ZSA9IG5ld1NpemU7XG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50Q2hhbmdlZCh0aGlzLnRhcmdldC5ub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyRGF0YSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8IHRoaXMudGFyZ2V0ID09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy50YXJnZXQubm9kZTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5jaGVja0VkaXQoKTtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkU2NhbGUgPSBub2RlLmdldFdvcmxkU2NhbGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkUG9zID0gbm9kZS5nZXRXb3JsZFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCB3b3JsZFJvdCA9IHRlbXBRdWF0X2E7XG4gICAgICAgICAgICBub2RlLmdldFdvcmxkUm90YXRpb24od29ybGRSb3QpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRTY2FsZSh3b3JsZFNjYWxlKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0UG9zaXRpb24od29ybGRQb3MpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRSb3RhdGlvbih3b3JsZFJvdCk7XG4gICAgICAgICAgICAvLyDlvbHlk43nm5LkuK3lv4PljbPoioLngrnljp/ngrnvvIzlhajlsLrlr7ggPSDljYrplb8gKiAyXG4gICAgICAgICAgICBjb25zdCBmdWxsU2l6ZSA9IFZlYzMubXVsdGlwbHlTY2FsYXIodGVtcFZlYzMsIHRoaXMudGFyZ2V0LnNpemUsIDIpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci51cGRhdGVTaXplKFZlYzMuWkVSTywgZnVsbFNpemUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblRhcmdldFVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyRGF0YSgpO1xuICAgIH1cblxuICAgIG9uTm9kZUNoYW5nZWQoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG59XG5cbmNsYXNzIFJlZmxlY3Rpb25Qcm9iZUljb25HaXptbyBleHRlbmRzIEljb25HaXptb0Jhc2U8UmVmbGVjdGlvblByb2JlPiB7XG4gICAgcHVibGljIGRpc2FibGVPblNlbGVjdGVkID0gdHJ1ZTtcblxuICAgIGNyZWF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRUZXh0dXJlQnlVVUlEKCdkZWU2ZjdjYy1iYTIxLTQwOTEtOTQ4Zi00ZjUwODQ5NWYyNjBANmM0OGEnKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBuYW1lID0ganMuZ2V0Q2xhc3NOYW1lKFJlZmxlY3Rpb25Qcm9iZSk7XG4vLyDku4XpgInkuK0gUmVmbGVjdGlvblByb2JlIOiKgueCueaXtuaYvuekuuW9seWTjeebku+8iOWvuem9kCBDcmVhdG9yIOeahOmAieS4reaAge+8m+Wbvuaghy/pooTop4jnkIPlkI7nu63lho3liqDvvInjgIJcbmV4cG9ydCBjb25zdCBTZWxlY3RHaXptbyA9IFJlZmxlY3Rpb25Qcm9iZUNvbXBvbmVudEdpem1vO1xuZXhwb3J0IGNvbnN0IEljb25HaXptbyA9IFJlZmxlY3Rpb25Qcm9iZUljb25HaXptbztcbmV4cG9ydCBjb25zdCBQZXJzaXN0ZW50R2l6bW8gPSBudWxsO1xuXG5yZWdpc3Rlckdpem1vKG5hbWUsIHsgU2VsZWN0R2l6bW8sIEljb25HaXptbyB9KTtcbiJdfQ==