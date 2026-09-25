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
const tempQuat_a = new cc_1.Quat();
const tempSize = new cc_1.Vec3();
class ModelComponentGizmo extends gizmo_base_1.default {
    _controller;
    _tetraHelper;
    init() {
        this._controller = new box_1.default(this.getGizmoRoot());
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
        const node = this.target.node;
        const boundingBox = this.getBoundingBox(this.target);
        if (boundingBox) {
            this._controller.show();
            const worldScale = node.getWorldScale();
            const worldPos = node.getWorldPosition();
            const worldRot = tempQuat_a;
            node.getWorldRotation(worldRot);
            this._controller.setScale(worldScale);
            this._controller.setPosition(worldPos);
            this._controller.setRotation(worldRot);
            cc_1.Vec3.multiplyScalar(tempSize, boundingBox.halfExtents, 2);
            this._controller.updateSize(boundingBox.center, tempSize);
        }
        else {
            this._controller.hide();
        }
        // 影响该物体的光照探针四面体连线（仅当开启“使用光照探针”时显示）
        this._tetraHelper.update(this.target);
    }
    getBoundingBox(component) {
        let bb = component.model && component.model.modelBounds;
        if (!bb) {
            const mesh = component.mesh;
            if (mesh && mesh.minPosition && mesh.maxPosition) {
                bb = cc_1.geometry.AABB.fromPoints(cc_1.geometry.AABB.create(), mesh.minPosition, mesh.maxPosition);
            }
        }
        return bb || null;
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
        // 每帧调用，靠 helper 内部签名缓存兜底：签名含 tetrahedronIndex/volume/reduceRinging/
        // 顶点位置/SH 首系数，未变化时廉价短路，变化时（含移动跨四面体、球体积/reduceRinging 调整）才重建。
        if (this.target)
            this._tetraHelper.update(this.target);
    }
    // 探针数据变化（探针组重生成/烘焙等，可能不改 index/签名输入）时失效缓存并强制刷新
    onLightProbeChanged() {
        this._tetraHelper.invalidate();
        if (this.target)
            this._tetraHelper.update(this.target);
    }
    onDestroy() {
        this._tetraHelper?.destroy();
    }
}
exports.name = cc_1.js.getClassName(cc_1.MeshRenderer);
exports.SelectGizmo = ModelComponentGizmo;
exports.IconGizmo = null;
exports.PersistentGizmo = null;
(0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy9tZXNoLXJlbmRlcmVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsMkJBQTREO0FBQzVELHVFQUE4QztBQUM5QywrREFBaUQ7QUFDakQscUVBQXNFO0FBQ3RFLHVEQUFvRDtBQUVwRCxNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFFNUIsTUFBTSxtQkFBb0IsU0FBUSxvQkFBdUI7SUFDN0MsV0FBVyxDQUFpQjtJQUM1QixZQUFZLENBQXlCO0lBRTdDLElBQUk7UUFDQSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSx5Q0FBcUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztJQUMvQixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVELG9CQUFvQjtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDO1lBQzlDLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDOUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckQsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFeEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQztZQUM1QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFdkMsU0FBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlELENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsbUNBQW1DO1FBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU8sY0FBYyxDQUFDLFNBQXVCO1FBQzFDLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDeEQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ04sTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztZQUM1QixJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDL0MsRUFBRSxHQUFHLGFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLEVBQUUsSUFBSSxJQUFJLENBQUM7SUFDdEIsQ0FBQztJQUVELHlCQUF5QjtRQUNyQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsY0FBYztRQUNWLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxhQUFhO1FBQ1QsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELFFBQVE7UUFDSixvRUFBb0U7UUFDcEUsNkRBQTZEO1FBQzdELElBQUksSUFBSSxDQUFDLE1BQU07WUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELCtDQUErQztJQUMvQyxtQkFBbUI7UUFDZixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQy9CLElBQUksSUFBSSxDQUFDLE1BQU07WUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELFNBQVM7UUFDTCxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ2pDLENBQUM7Q0FDSjtBQUVZLFFBQUEsSUFBSSxHQUFHLE9BQUUsQ0FBQyxZQUFZLENBQUMsaUJBQVksQ0FBQyxDQUFDO0FBQ3JDLFFBQUEsV0FBVyxHQUFHLG1CQUFtQixDQUFDO0FBQ2xDLFFBQUEsU0FBUyxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFBLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFFcEMsSUFBQSw2QkFBYSxFQUFDLFlBQUksRUFBRSxFQUFFLFdBQVcsRUFBWCxtQkFBVyxFQUFFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZ2VvbWV0cnksIGpzLCBNZXNoUmVuZGVyZXIsIFF1YXQsIFZlYzMgfSBmcm9tICdjYyc7XG5pbXBvcnQgR2l6bW9CYXNlIGZyb20gJy4uLy4uL2Jhc2UvZ2l6bW8tYmFzZSc7XG5pbXBvcnQgQm94Q29udHJvbGxlciBmcm9tICcuLi8uLi9jb250cm9sbGVyL2JveCc7XG5pbXBvcnQgeyBMaWdodFByb2JlVGV0cmFIZWxwZXIgfSBmcm9tICcuLi8uLi91dGlscy9saWdodC1wcm9iZS10ZXRyYSc7XG5pbXBvcnQgeyByZWdpc3Rlckdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW8tZGVmaW5lcyc7XG5cbmNvbnN0IHRlbXBRdWF0X2EgPSBuZXcgUXVhdCgpO1xuY29uc3QgdGVtcFNpemUgPSBuZXcgVmVjMygpO1xuXG5jbGFzcyBNb2RlbENvbXBvbmVudEdpem1vIGV4dGVuZHMgR2l6bW9CYXNlPE1lc2hSZW5kZXJlcj4ge1xuICAgIHByaXZhdGUgX2NvbnRyb2xsZXIhOiBCb3hDb250cm9sbGVyO1xuICAgIHByaXZhdGUgX3RldHJhSGVscGVyITogTGlnaHRQcm9iZVRldHJhSGVscGVyO1xuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IG5ldyBCb3hDb250cm9sbGVyKHRoaXMuZ2V0R2l6bW9Sb290KCkpO1xuICAgICAgICB0aGlzLl90ZXRyYUhlbHBlciA9IG5ldyBMaWdodFByb2JlVGV0cmFIZWxwZXIodGhpcy5nZXRHaXptb1Jvb3QoKSk7XG4gICAgICAgIHRoaXMuX2lzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIG9uU2hvdygpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zaG93KCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvbkhpZGUoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuaGlkZSgpO1xuICAgICAgICB0aGlzLl90ZXRyYUhlbHBlci5oaWRlKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29udHJvbGxlckRhdGEoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCB0aGlzLnRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy50YXJnZXQubm9kZTtcbiAgICAgICAgY29uc3QgYm91bmRpbmdCb3ggPSB0aGlzLmdldEJvdW5kaW5nQm94KHRoaXMudGFyZ2V0KTtcbiAgICAgICAgaWYgKGJvdW5kaW5nQm94KSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNob3coKTtcblxuICAgICAgICAgICAgY29uc3Qgd29ybGRTY2FsZSA9IG5vZGUuZ2V0V29ybGRTY2FsZSgpO1xuICAgICAgICAgICAgY29uc3Qgd29ybGRQb3MgPSBub2RlLmdldFdvcmxkUG9zaXRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkUm90ID0gdGVtcFF1YXRfYTtcbiAgICAgICAgICAgIG5vZGUuZ2V0V29ybGRSb3RhdGlvbih3b3JsZFJvdCk7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldFNjYWxlKHdvcmxkU2NhbGUpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRQb3NpdGlvbih3b3JsZFBvcyk7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldFJvdGF0aW9uKHdvcmxkUm90KTtcblxuICAgICAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0ZW1wU2l6ZSwgYm91bmRpbmdCb3guaGFsZkV4dGVudHMsIDIpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci51cGRhdGVTaXplKGJvdW5kaW5nQm94LmNlbnRlciwgdGVtcFNpemUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlvbHlk43or6XniankvZPnmoTlhYnnhafmjqLpkojlm5vpnaLkvZPov57nur/vvIjku4XlvZPlvIDlkK/igJzkvb/nlKjlhYnnhafmjqLpkojigJ3ml7bmmL7npLrvvIlcbiAgICAgICAgdGhpcy5fdGV0cmFIZWxwZXIudXBkYXRlKHRoaXMudGFyZ2V0KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEJvdW5kaW5nQm94KGNvbXBvbmVudDogTWVzaFJlbmRlcmVyKTogZ2VvbWV0cnkuQUFCQiB8IG51bGwge1xuICAgICAgICBsZXQgYmIgPSBjb21wb25lbnQubW9kZWwgJiYgY29tcG9uZW50Lm1vZGVsLm1vZGVsQm91bmRzO1xuICAgICAgICBpZiAoIWJiKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNoID0gY29tcG9uZW50Lm1lc2g7XG4gICAgICAgICAgICBpZiAobWVzaCAmJiBtZXNoLm1pblBvc2l0aW9uICYmIG1lc2gubWF4UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYiA9IGdlb21ldHJ5LkFBQkIuZnJvbVBvaW50cyhnZW9tZXRyeS5BQUJCLmNyZWF0ZSgpLCBtZXNoLm1pblBvc2l0aW9uLCBtZXNoLm1heFBvc2l0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmIgfHwgbnVsbDtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25UYXJnZXRVcGRhdGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvbk5vZGVDaGFuZ2VkKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25VcGRhdGUoKSB7XG4gICAgICAgIC8vIOavj+W4p+iwg+eUqO+8jOmdoCBoZWxwZXIg5YaF6YOo562+5ZCN57yT5a2Y5YWc5bqV77ya562+5ZCN5ZCrIHRldHJhaGVkcm9uSW5kZXgvdm9sdW1lL3JlZHVjZVJpbmdpbmcvXG4gICAgICAgIC8vIOmhtueCueS9jee9ri9TSCDpppbns7vmlbDvvIzmnKrlj5jljJbml7blu4nku7fnn63ot6/vvIzlj5jljJbml7bvvIjlkKvnp7vliqjot6jlm5vpnaLkvZPjgIHnkIPkvZPnp68vcmVkdWNlUmluZ2luZyDosIPmlbTvvInmiY3ph43lu7rjgIJcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0KSB0aGlzLl90ZXRyYUhlbHBlci51cGRhdGUodGhpcy50YXJnZXQpO1xuICAgIH1cblxuICAgIC8vIOaOoumSiOaVsOaNruWPmOWMlu+8iOaOoumSiOe7hOmHjeeUn+aIkC/ng5jnhJnnrYnvvIzlj6/og73kuI3mlLkgaW5kZXgv562+5ZCN6L6T5YWl77yJ5pe25aSx5pWI57yT5a2Y5bm25by65Yi25Yi35pawXG4gICAgb25MaWdodFByb2JlQ2hhbmdlZCgpIHtcbiAgICAgICAgdGhpcy5fdGV0cmFIZWxwZXIuaW52YWxpZGF0ZSgpO1xuICAgICAgICBpZiAodGhpcy50YXJnZXQpIHRoaXMuX3RldHJhSGVscGVyLnVwZGF0ZSh0aGlzLnRhcmdldCk7XG4gICAgfVxuXG4gICAgb25EZXN0cm95KCkge1xuICAgICAgICB0aGlzLl90ZXRyYUhlbHBlcj8uZGVzdHJveSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IG5hbWUgPSBqcy5nZXRDbGFzc05hbWUoTWVzaFJlbmRlcmVyKTtcbmV4cG9ydCBjb25zdCBTZWxlY3RHaXptbyA9IE1vZGVsQ29tcG9uZW50R2l6bW87XG5leHBvcnQgY29uc3QgSWNvbkdpem1vID0gbnVsbDtcbmV4cG9ydCBjb25zdCBQZXJzaXN0ZW50R2l6bW8gPSBudWxsO1xuXG5yZWdpc3Rlckdpem1vKG5hbWUsIHsgU2VsZWN0R2l6bW8gfSk7XG4iXX0=