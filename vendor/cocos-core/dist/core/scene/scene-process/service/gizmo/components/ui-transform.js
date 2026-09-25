'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../base/gizmo-base"));
const gizmo_defines_1 = require("../gizmo-defines");
const rectangle_controller_1 = require("../node/rectangle-controller");
const tempQuat_a = new cc_1.Quat();
function hasUISkewInSelfOrParent(node) {
    for (let current = node; current; current = current.parent) {
        if (current._uiProps?._uiSkewComp) {
            return true;
        }
    }
    return false;
}
class UITransformComponentGizmo extends gizmo_base_1.default {
    _controller;
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
    createController() {
        this._controller = new rectangle_controller_1.RectangleController(this.getGizmoRoot());
        this._controller.setColor(new cc_1.Color(0, 153, 255));
        this._controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
        this._controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
        this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    }
    onControllerMouseDown() { }
    onControllerMouseMove() { }
    onControllerMouseUp() { }
    updateControllerTransform() {
        if (!this._isInitialized || this.target == null) {
            return;
        }
        const node = this.target.node;
        if (hasUISkewInSelfOrParent(node)) {
            this._controller.setWorldMatrix(node.worldMatrix);
            return;
        }
        const worldPos = node.getWorldPosition();
        node.getWorldRotation(tempQuat_a);
        const worldScale = node.getWorldScale();
        this._controller.setPosition(worldPos);
        this._controller.setRotation(tempQuat_a);
        this._controller.setScale(worldScale);
    }
    updateControllerData() {
        if (!this._isInitialized || this.target == null) {
            return;
        }
        const uiTransComp = this.target;
        if (uiTransComp) {
            const size = uiTransComp.contentSize;
            const anchor = uiTransComp.anchorPoint;
            const center = new cc_1.Vec3();
            center.x = (0.5 - anchor.x) * size.width;
            center.y = (0.5 - anchor.y) * size.height;
            this._controller.updateSize(center, new cc_1.Vec2(size.width, size.height));
        }
        else {
            this._controller.hide();
        }
    }
    updateController() {
        this.updateControllerTransform();
        this.updateControllerData();
    }
    onTargetUpdate() {
        this.updateController();
    }
    onNodeChanged() {
        this.updateController();
    }
}
exports.name = cc_1.js.getClassName(cc_1.UITransform);
exports.SelectGizmo = UITransformComponentGizmo;
(0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktdHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2dpem1vL2NvbXBvbmVudHMvdWktdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsMkJBQThEO0FBQzlELG9FQUEyQztBQUMzQyxvREFBaUQ7QUFDakQsdUVBQW1FO0FBRW5FLE1BQU0sVUFBVSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFFOUIsU0FBUyx1QkFBdUIsQ0FBQyxJQUFTO0lBQ3RDLEtBQUssSUFBSSxPQUFPLEdBQUcsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3pELElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxNQUFNLHlCQUEwQixTQUFRLG9CQUFzQjtJQUNsRCxXQUFXLENBQXVCO0lBRTFDLElBQUk7UUFDQSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxnQkFBZ0I7UUFDWixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksMENBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFB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LENBQUM7SUFDNUIsQ0FBQztDQUNKO0FBRVksUUFBQSxJQUFJLEdBQUcsT0FBRSxDQUFDLFlBQVksQ0FBQyxnQkFBVyxDQUFDLENBQUM7QUFDcEMsUUFBQSxXQUFXLEdBQUcseUJBQXlCLENBQUM7QUFFckQsSUFBQSw2QkFBYSxFQUFDLFlBQUksRUFBRSxFQUFFLFdBQVcsRUFBWCxtQkFBVyxFQUFFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQ29sb3IsIGpzLCBRdWF0LCBVSVRyYW5zZm9ybSwgVmVjMiwgVmVjMyB9IGZyb20gJ2NjJztcbmltcG9ydCBHaXptb0Jhc2UgZnJvbSAnLi4vYmFzZS9naXptby1iYXNlJztcbmltcG9ydCB7IHJlZ2lzdGVyR2l6bW8gfSBmcm9tICcuLi9naXptby1kZWZpbmVzJztcbmltcG9ydCB7IFJlY3RhbmdsZUNvbnRyb2xsZXIgfSBmcm9tICcuLi9ub2RlL3JlY3RhbmdsZS1jb250cm9sbGVyJztcblxuY29uc3QgdGVtcFF1YXRfYSA9IG5ldyBRdWF0KCk7XG5cbmZ1bmN0aW9uIGhhc1VJU2tld0luU2VsZk9yUGFyZW50KG5vZGU6IGFueSk6IGJvb2xlYW4ge1xuICAgIGZvciAobGV0IGN1cnJlbnQgPSBub2RlOyBjdXJyZW50OyBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQpIHtcbiAgICAgICAgaWYgKGN1cnJlbnQuX3VpUHJvcHM/Ll91aVNrZXdDb21wKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmNsYXNzIFVJVHJhbnNmb3JtQ29tcG9uZW50R2l6bW8gZXh0ZW5kcyBHaXptb0Jhc2U8VUlUcmFuc2Zvcm0+IHtcbiAgICBwcml2YXRlIF9jb250cm9sbGVyITogUmVjdGFuZ2xlQ29udHJvbGxlcjtcblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uU2hvdygpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zaG93KCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uSGlkZSgpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlQ29udHJvbGxlcigpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IG5ldyBSZWN0YW5nbGVDb250cm9sbGVyKHRoaXMuZ2V0R2l6bW9Sb290KCkpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldENvbG9yKG5ldyBDb2xvcigwLCAxNTMsIDI1NSkpO1xuXG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VEb3duID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZURvd24uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZU1vdmUgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlVXAgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlVXAuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZURvd24oKSB7fVxuXG4gICAgb25Db250cm9sbGVyTW91c2VNb3ZlKCkge31cblxuICAgIG9uQ29udHJvbGxlck1vdXNlVXAoKSB7fVxuXG4gICAgdXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8IHRoaXMudGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnRhcmdldC5ub2RlO1xuICAgICAgICBpZiAoaGFzVUlTa2V3SW5TZWxmT3JQYXJlbnQobm9kZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0V29ybGRNYXRyaXgobm9kZS53b3JsZE1hdHJpeCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3b3JsZFBvcyA9IG5vZGUuZ2V0V29ybGRQb3NpdGlvbigpO1xuICAgICAgICBub2RlLmdldFdvcmxkUm90YXRpb24odGVtcFF1YXRfYSk7XG4gICAgICAgIGNvbnN0IHdvcmxkU2NhbGUgPSBub2RlLmdldFdvcmxkU2NhbGUoKTtcblxuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldFBvc2l0aW9uKHdvcmxkUG9zKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRSb3RhdGlvbih0ZW1wUXVhdF9hKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRTY2FsZSh3b3JsZFNjYWxlKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyRGF0YSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8IHRoaXMudGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVpVHJhbnNDb21wID0gdGhpcy50YXJnZXQ7XG4gICAgICAgIGlmICh1aVRyYW5zQ29tcCkge1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHVpVHJhbnNDb21wLmNvbnRlbnRTaXplO1xuICAgICAgICAgICAgY29uc3QgYW5jaG9yID0gdWlUcmFuc0NvbXAuYW5jaG9yUG9pbnQ7XG4gICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgY2VudGVyLnggPSAoMC41IC0gYW5jaG9yLngpICogc2l6ZS53aWR0aDtcbiAgICAgICAgICAgIGNlbnRlci55ID0gKDAuNSAtIGFuY2hvci55KSAqIHNpemUuaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci51cGRhdGVTaXplKGNlbnRlciwgbmV3IFZlYzIoc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlQ29udHJvbGxlcigpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvblRhcmdldFVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgfVxuXG4gICAgb25Ob2RlQ2hhbmdlZCgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgbmFtZSA9IGpzLmdldENsYXNzTmFtZShVSVRyYW5zZm9ybSk7XG5leHBvcnQgY29uc3QgU2VsZWN0R2l6bW8gPSBVSVRyYW5zZm9ybUNvbXBvbmVudEdpem1vO1xuXG5yZWdpc3Rlckdpem1vKG5hbWUsIHsgU2VsZWN0R2l6bW8gfSk7XG4iXX0=