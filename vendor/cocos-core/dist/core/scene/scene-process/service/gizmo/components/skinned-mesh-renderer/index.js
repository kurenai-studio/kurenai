'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentGizmo = exports.IconGizmo = exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../../base/gizmo-base"));
const box_1 = __importDefault(require("../../controller/box"));
const light_probe_tetra_1 = require("../../utils/light-probe-tetra");
const gizmo_defines_1 = require("../../gizmo-defines");
const tempSize = new cc_1.Vec3();
const tempCenter = new cc_1.Vec3();
class SkinningModelComponentGizmo extends gizmo_base_1.default {
    _controller;
    _tetraHelper;
    init() {
        this._controller = new box_1.default(this.getGizmoRoot());
        this._controller.setOpacity(150);
        this._tetraHelper = new light_probe_tetra_1.LightProbeTetraHelper(this.getGizmoRoot());
        this._isInitialized = true;
    }
    onShow() {
        this._controller.show();
        this.updateControllerData();
    }
    onHide() {
        this._controller.hide();
        this._tetraHelper.hide();
    }
    updateControllerData() {
        if (!this._isInitialized || this.target == null) {
            return;
        }
        const rootBoneNode = this.target.skinningRoot;
        if (!rootBoneNode) {
            this._controller.hide();
            this._tetraHelper.hide();
            return;
        }
        const bounds = this.target.model && this.target.model.worldBounds;
        if (bounds) {
            cc_1.Vec3.multiplyScalar(tempSize, bounds.halfExtents, 2);
            cc_1.Vec3.copy(tempCenter, bounds.center);
            this._controller.updateSize(tempCenter, tempSize);
        }
        else {
            this._controller.hide();
        }
        // 影响该物体的光照探针四面体连线（仅当开启“使用光照探针”时显示）
        this._tetraHelper.update(this.target);
    }
    updateControllerTransform() {
        this.updateControllerData();
    }
    onTargetUpdate() {
        this.updateControllerData();
    }
    onNodeChanged() {
        this.updateControllerData();
    }
    onUpdate() {
        this.updateControllerData();
    }
    onLightProbeChanged() {
        this._tetraHelper.invalidate();
        if (this.target)
            this._tetraHelper.update(this.target);
    }
    onDestroy() {
        this._tetraHelper?.destroy();
    }
}
exports.name = cc_1.js.getClassName(cc_1.SkinnedMeshRenderer);
exports.SelectGizmo = SkinningModelComponentGizmo;
exports.IconGizmo = null;
exports.PersistentGizmo = null;
(0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy9za2lubmVkLW1lc2gtcmVuZGVyZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYiwyQkFBbUQ7QUFDbkQsdUVBQThDO0FBQzlDLCtEQUFpRDtBQUNqRCxxRUFBc0U7QUFDdEUsdURBQW9EO0FBRXBELE1BQU0sUUFBUSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUU5QixNQUFNLDJCQUE0QixTQUFRLG9CQUE4QjtJQUM1RCxXQUFXLENBQWlCO0lBQzVCLFlBQVksQ0FBeUI7SUFFN0MsSUFBSTtRQUNBLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLHlDQUFxQixDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0lBQy9CLENBQUM7SUFFRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQsb0JBQW9CO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFLENBQUM7WUFDOUMsT0FBTztRQUNYLENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztRQUM5QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pCLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQ2xFLElBQUksTUFBTSxFQUFFLENBQUM7WUFDVCxTQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JELFNBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsQ0FBQzthQUFNLENBQUM7WUFDSixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFRCxtQ0FBbUM7UUFDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCx5QkFBeUI7UUFDckIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELGNBQWM7UUFDVixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsYUFBYTtRQUNULElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxRQUFRO1FBQ0osSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELG1CQUFtQjtRQUNmLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDL0IsSUFBSSxJQUFJLENBQUMsTUFBTTtZQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsU0FBUztRQUNMLElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDakMsQ0FBQztDQUNKO0FBRVksUUFBQSxJQUFJLEdBQUcsT0FBRSxDQUFDLFlBQVksQ0FBQyx3QkFBbUIsQ0FBQyxDQUFDO0FBQzVDLFFBQUEsV0FBVyxHQUFHLDJCQUEyQixDQUFDO0FBQzFDLFFBQUEsU0FBUyxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFBLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFFcEMsSUFBQSw2QkFBYSxFQUFDLFlBQUksRUFBRSxFQUFFLFdBQVcsRUFBWCxtQkFBVyxFQUFFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsganMsIFNraW5uZWRNZXNoUmVuZGVyZXIsIFZlYzMgfSBmcm9tICdjYyc7XG5pbXBvcnQgR2l6bW9CYXNlIGZyb20gJy4uLy4uL2Jhc2UvZ2l6bW8tYmFzZSc7XG5pbXBvcnQgQm94Q29udHJvbGxlciBmcm9tICcuLi8uLi9jb250cm9sbGVyL2JveCc7XG5pbXBvcnQgeyBMaWdodFByb2JlVGV0cmFIZWxwZXIgfSBmcm9tICcuLi8uLi91dGlscy9saWdodC1wcm9iZS10ZXRyYSc7XG5pbXBvcnQgeyByZWdpc3Rlckdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW8tZGVmaW5lcyc7XG5cbmNvbnN0IHRlbXBTaXplID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBDZW50ZXIgPSBuZXcgVmVjMygpO1xuXG5jbGFzcyBTa2lubmluZ01vZGVsQ29tcG9uZW50R2l6bW8gZXh0ZW5kcyBHaXptb0Jhc2U8U2tpbm5lZE1lc2hSZW5kZXJlcj4ge1xuICAgIHByaXZhdGUgX2NvbnRyb2xsZXIhOiBCb3hDb250cm9sbGVyO1xuICAgIHByaXZhdGUgX3RldHJhSGVscGVyITogTGlnaHRQcm9iZVRldHJhSGVscGVyO1xuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IG5ldyBCb3hDb250cm9sbGVyKHRoaXMuZ2V0R2l6bW9Sb290KCkpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldE9wYWNpdHkoMTUwKTtcbiAgICAgICAgdGhpcy5fdGV0cmFIZWxwZXIgPSBuZXcgTGlnaHRQcm9iZVRldHJhSGVscGVyKHRoaXMuZ2V0R2l6bW9Sb290KCkpO1xuICAgICAgICB0aGlzLl9pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvblNob3coKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2hvdygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25IaWRlKCkge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgdGhpcy5fdGV0cmFIZWxwZXIuaGlkZSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJEYXRhKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbGl6ZWQgfHwgdGhpcy50YXJnZXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm9vdEJvbmVOb2RlID0gdGhpcy50YXJnZXQuc2tpbm5pbmdSb290O1xuICAgICAgICBpZiAoIXJvb3RCb25lTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLl90ZXRyYUhlbHBlci5oaWRlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBib3VuZHMgPSB0aGlzLnRhcmdldC5tb2RlbCAmJiB0aGlzLnRhcmdldC5tb2RlbC53b3JsZEJvdW5kcztcbiAgICAgICAgaWYgKGJvdW5kcykge1xuICAgICAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0ZW1wU2l6ZSwgYm91bmRzLmhhbGZFeHRlbnRzLCAyKTtcbiAgICAgICAgICAgIFZlYzMuY29weSh0ZW1wQ2VudGVyLCBib3VuZHMuY2VudGVyKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlU2l6ZSh0ZW1wQ2VudGVyLCB0ZW1wU2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOW9seWTjeivpeeJqeS9k+eahOWFieeFp+aOoumSiOWbm+mdouS9k+i/nue6v++8iOS7heW9k+W8gOWQr+KAnOS9v+eUqOWFieeFp+aOoumSiOKAneaXtuaYvuekuu+8iVxuICAgICAgICB0aGlzLl90ZXRyYUhlbHBlci51cGRhdGUodGhpcy50YXJnZXQpO1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvblRhcmdldFVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyRGF0YSgpO1xuICAgIH1cblxuICAgIG9uTm9kZUNoYW5nZWQoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvblVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyRGF0YSgpO1xuICAgIH1cblxuICAgIG9uTGlnaHRQcm9iZUNoYW5nZWQoKSB7XG4gICAgICAgIHRoaXMuX3RldHJhSGVscGVyLmludmFsaWRhdGUoKTtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0KSB0aGlzLl90ZXRyYUhlbHBlci51cGRhdGUodGhpcy50YXJnZXQpO1xuICAgIH1cblxuICAgIG9uRGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5fdGV0cmFIZWxwZXI/LmRlc3Ryb3koKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBuYW1lID0ganMuZ2V0Q2xhc3NOYW1lKFNraW5uZWRNZXNoUmVuZGVyZXIpO1xuZXhwb3J0IGNvbnN0IFNlbGVjdEdpem1vID0gU2tpbm5pbmdNb2RlbENvbXBvbmVudEdpem1vO1xuZXhwb3J0IGNvbnN0IEljb25HaXptbyA9IG51bGw7XG5leHBvcnQgY29uc3QgUGVyc2lzdGVudEdpem1vID0gbnVsbDtcblxucmVnaXN0ZXJHaXptbyhuYW1lLCB7IFNlbGVjdEdpem1vIH0pO1xuIl19