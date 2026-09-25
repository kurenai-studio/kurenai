'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../base/gizmo-base"));
const box_1 = __importDefault(require("../controller/box"));
function repaintEngine() {
    try {
        const { Service } = require('../../core/decorator');
        Service.Engine?.repaintInEditMode?.();
    }
    catch (e) {
        // not ready
    }
}
class SceneGizmo extends gizmo_base_1.default {
    _controller;
    _octreeBoundingBox = new cc_1.geometry.AABB();
    _octreeBBSize = new cc_1.Vec3();
    init() {
        this.createController();
        this._isInitialized = true;
    }
    onShow() {
        this._controller.show();
        this.updateControllerTransform();
    }
    onHide() {
        this._controller.hide();
    }
    createController() {
        const gizmoRoot = this.getGizmoRoot();
        this._controller = new box_1.default(gizmoRoot);
        this._controller.setOpacity(150);
    }
    updateControllerTransform() {
        this.updateControllerData();
    }
    updateControllerData() {
        if (!this._isInitialized || !this.target) {
            this._controller && this._controller.hide();
            return;
        }
        const sceneNode = this.target.node;
        const octree = sceneNode.globals?.octree;
        if (octree && octree.enabled) {
            cc_1.geometry.AABB.fromPoints(this._octreeBoundingBox, octree.minPos, octree.maxPos);
            cc_1.Vec3.multiplyScalar(this._octreeBBSize, this._octreeBoundingBox.halfExtents, 2);
            this._controller.updateSize(this._octreeBoundingBox.center, this._octreeBBSize);
            repaintEngine();
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
exports.default = SceneGizmo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vbm9kZS9zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsMkJBQTJDO0FBQzNDLG9FQUEyQztBQUMzQyw0REFBOEM7QUFFOUMsU0FBUyxhQUFhO0lBQ2xCLElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNwRCxPQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULFlBQVk7SUFDaEIsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVcsU0FBUSxvQkFBUztJQUN0QixXQUFXLENBQWlCO0lBQzVCLGtCQUFrQixHQUFrQixJQUFJLGFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN4RCxhQUFhLEdBQVMsSUFBSSxTQUFJLEVBQUUsQ0FBQztJQUV6QyxJQUFJO1FBQ0EsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDL0IsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsZ0JBQWdCO1FBQ1osTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELHlCQUF5QjtRQUNyQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsb0JBQW9CO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QyxPQUFPO1FBQ1gsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBb0IsQ0FBQztRQUMxRCxNQUFNLE1BQU0sR0FBSSxTQUFpQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7UUFFbEQsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNCLGFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoRixTQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNoRixhQUFhLEVBQUUsQ0FBQztRQUNwQixDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztJQUNMLENBQUM7SUFFRCxjQUFjO1FBQ1YsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELGFBQWE7UUFDVCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0NBQ0o7QUFFRCxrQkFBZSxVQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGdlb21ldHJ5LCBTY2VuZSwgVmVjMyB9IGZyb20gJ2NjJztcbmltcG9ydCBHaXptb0Jhc2UgZnJvbSAnLi4vYmFzZS9naXptby1iYXNlJztcbmltcG9ydCBCb3hDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXIvYm94JztcblxuZnVuY3Rpb24gcmVwYWludEVuZ2luZSgpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBub3QgcmVhZHlcbiAgICB9XG59XG5cbmNsYXNzIFNjZW5lR2l6bW8gZXh0ZW5kcyBHaXptb0Jhc2Uge1xuICAgIHByaXZhdGUgX2NvbnRyb2xsZXIhOiBCb3hDb250cm9sbGVyO1xuICAgIHByaXZhdGUgX29jdHJlZUJvdW5kaW5nQm94OiBnZW9tZXRyeS5BQUJCID0gbmV3IGdlb21ldHJ5LkFBQkIoKTtcbiAgICBwcml2YXRlIF9vY3RyZWVCQlNpemU6IFZlYzMgPSBuZXcgVmVjMygpO1xuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5jcmVhdGVDb250cm9sbGVyKCk7XG4gICAgICAgIHRoaXMuX2lzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIG9uU2hvdygpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zaG93KCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSgpO1xuICAgIH1cblxuICAgIG9uSGlkZSgpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlQ29udHJvbGxlcigpIHtcbiAgICAgICAgY29uc3QgZ2l6bW9Sb290ID0gdGhpcy5nZXRHaXptb1Jvb3QoKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IG5ldyBCb3hDb250cm9sbGVyKGdpem1vUm9vdCk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0T3BhY2l0eSgxNTApO1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyRGF0YSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8ICF0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlciAmJiB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjZW5lTm9kZTogU2NlbmUgPSB0aGlzLnRhcmdldC5ub2RlIGFzIGFueSBhcyBTY2VuZTtcbiAgICAgICAgY29uc3Qgb2N0cmVlID0gKHNjZW5lTm9kZSBhcyBhbnkpLmdsb2JhbHM/Lm9jdHJlZTtcblxuICAgICAgICBpZiAob2N0cmVlICYmIG9jdHJlZS5lbmFibGVkKSB7XG4gICAgICAgICAgICBnZW9tZXRyeS5BQUJCLmZyb21Qb2ludHModGhpcy5fb2N0cmVlQm91bmRpbmdCb3gsIG9jdHJlZS5taW5Qb3MsIG9jdHJlZS5tYXhQb3MpO1xuICAgICAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0aGlzLl9vY3RyZWVCQlNpemUsIHRoaXMuX29jdHJlZUJvdW5kaW5nQm94LmhhbGZFeHRlbnRzLCAyKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlU2l6ZSh0aGlzLl9vY3RyZWVCb3VuZGluZ0JveC5jZW50ZXIsIHRoaXMuX29jdHJlZUJCU2l6ZSk7XG4gICAgICAgICAgICByZXBhaW50RW5naW5lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uVGFyZ2V0VXBkYXRlKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25Ob2RlQ2hhbmdlZCgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyRGF0YSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2NlbmVHaXptbztcbiJdfQ==