'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentGizmo = exports.IconGizmo = exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../../base/gizmo-base"));
const gizmo_icon_1 = __importDefault(require("../../base/gizmo-icon"));
const base_1 = __importDefault(require("../../controller/base"));
const frustum_1 = __importDefault(require("../../controller/frustum"));
const controller_utils_1 = __importDefault(require("../../utils/controller-utils"));
const engine_utils_1 = require("../../utils/engine-utils");
const gizmo_defines_1 = require("../../gizmo-defines");
// ── DirectionLightController ──────────────────────────────────────────────────
class DirectionLightController extends base_1.default {
    _lightDirNode = null;
    constructor(rootNode) {
        super(rootNode);
        this.lockSize = true;
        this.initShape();
        this.registerCameraMovedEvent();
    }
    setColor(color) {
        (0, engine_utils_1.setMeshColor)(this._lightDirNode, color);
        this._color = color;
    }
    initShape() {
        this.createShapeNode('DirectionLightController');
        const lightOriDir = new cc_1.Vec3(0, 0, -1);
        const lightDirNode = controller_utils_1.default.arcDirectionLine(new cc_1.Vec3(), lightOriDir, new cc_1.Vec3(1, 0, 0), this._twoPI, 20, 100, 9, this._color);
        lightDirNode.parent = this.shape;
        this._lightDirNode = lightDirNode;
        this.hide();
    }
}
// ── SelectGizmo ───────────────────────────────────────────────────────────────
const tempQuat = new cc_1.Quat();
class DirectionalLightComponentGizmo extends gizmo_base_1.default {
    _controller;
    _frustumCtrl;
    _lightGizmoColor = new cc_1.Color(255, 255, 50);
    init() {
        this.createController();
        this._isInitialized = true;
    }
    onShow() {
        this._controller.show();
        this._frustumCtrl.show();
        this.updateControllerData();
    }
    onHide() {
        this._controller.hide();
        this._frustumCtrl.hide();
    }
    createController() {
        const gizmoRoot = this.getGizmoRoot();
        this._controller = new DirectionLightController(gizmoRoot);
        this._controller.setColor(this._lightGizmoColor);
        this._frustumCtrl = new frustum_1.default(gizmoRoot);
    }
    onControllerMouseDown() {
        if (!this._isInitialized || this.target === null)
            return;
    }
    onControllerMouseMove() {
        this.updateDataFromController();
    }
    onControllerMouseUp() { }
    updateDataFromController() {
        if (this._controller.updated && this.target) {
            this.onComponentChanged(this.target.node);
        }
    }
    updateControllerTransform() {
        if (this.target === null)
            return;
        const node = this.target.node;
        const worldRot = tempQuat;
        node.getWorldRotation(worldRot);
        const worldPos = node.getWorldPosition();
        this._controller.setPosition(worldPos);
        this._controller.setRotation(worldRot);
        this._frustumCtrl.setPosition(worldPos);
        this._frustumCtrl.setRotation(worldRot);
    }
    updateControllerData() {
        if (!this._isInitialized || this.target === null)
            return;
        const directionalLight = this.target;
        if (directionalLight) {
            if (directionalLight.shadowEnabled) {
                this._frustumCtrl.show();
                this._frustumCtrl.updateSize(0, directionalLight.shadowOrthoSize, 1, 1, directionalLight.shadowNear, directionalLight.shadowFar, 0);
            }
            else {
                this._frustumCtrl.hide();
            }
        }
        else {
            this._frustumCtrl.hide();
        }
        this.updateControllerTransform();
    }
    onTargetUpdate() {
        this.updateControllerData();
    }
    onNodeChanged() {
        this.updateControllerData();
    }
}
// ── IconGizmo ─────────────────────────────────────────────────────────────────
class DirectionalLightIconGizmo extends gizmo_icon_1.default {
    disableOnSelected = true;
    createController() {
        super.createController();
        this._controller.setTextureByUUID('9cb543ba-d152-4809-8a44-8e7bd5712123@6c48a');
    }
}
// ── Exports & registration ────────────────────────────────────────────────────
exports.name = cc_1.js.getClassName(cc_1.DirectionalLight);
exports.SelectGizmo = DirectionalLightComponentGizmo;
exports.IconGizmo = DirectionalLightIconGizmo;
exports.PersistentGizmo = null;
(0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo, IconGizmo: exports.IconGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy9kaXJlY3Rpb25hbC1saWdodC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLDJCQUFtRTtBQUNuRSx1RUFBOEM7QUFDOUMsdUVBQWtEO0FBQ2xELGlFQUFtRDtBQUNuRCx1RUFBeUQ7QUFDekQsb0ZBQTJEO0FBQzNELDJEQUF3RDtBQUN4RCx1REFBb0Q7QUFFcEQsaUZBQWlGO0FBRWpGLE1BQU0sd0JBQXlCLFNBQVEsY0FBYztJQUN2QyxhQUFhLEdBQWdCLElBQUksQ0FBQztJQUU1QyxZQUFZLFFBQWM7UUFDdEIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQVk7UUFDakIsSUFBQSwyQkFBWSxFQUFDLElBQUksQ0FBQyxhQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDeEIsQ0FBQztJQUVELFNBQVM7UUFDTCxJQUFJLENBQUMsZUFBZSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDakQsTUFBTSxXQUFXLEdBQUcsSUFBSSxTQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sWUFBWSxHQUFHLDBCQUFlLENBQUMsZ0JBQWdCLENBQ2pELElBQUksU0FBSSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksU0FBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUs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ekMsUUFBQSxXQUFXLEdBQUcsOEJBQThCLENBQUM7QUFDN0MsUUFBQSxTQUFTLEdBQUcseUJBQXlCLENBQUM7QUFDdEMsUUFBQSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBRXBDLElBQUEsNkJBQWEsRUFBQyxZQUFJLEVBQUUsRUFBRSxXQUFXLEVBQVgsbUJBQVcsRUFBRSxTQUFTLEVBQVQsaUJBQVMsRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IENvbG9yLCBEaXJlY3Rpb25hbExpZ2h0LCBqcywgTm9kZSwgUXVhdCwgVmVjMyB9IGZyb20gJ2NjJztcbmltcG9ydCBHaXptb0Jhc2UgZnJvbSAnLi4vLi4vYmFzZS9naXptby1iYXNlJztcbmltcG9ydCBJY29uR2l6bW9CYXNlIGZyb20gJy4uLy4uL2Jhc2UvZ2l6bW8taWNvbic7XG5pbXBvcnQgQ29udHJvbGxlckJhc2UgZnJvbSAnLi4vLi4vY29udHJvbGxlci9iYXNlJztcbmltcG9ydCBGcnVzdHVtQ29udHJvbGxlciBmcm9tICcuLi8uLi9jb250cm9sbGVyL2ZydXN0dW0nO1xuaW1wb3J0IENvbnRyb2xsZXJVdGlscyBmcm9tICcuLi8uLi91dGlscy9jb250cm9sbGVyLXV0aWxzJztcbmltcG9ydCB7IHNldE1lc2hDb2xvciB9IGZyb20gJy4uLy4uL3V0aWxzL2VuZ2luZS11dGlscyc7XG5pbXBvcnQgeyByZWdpc3Rlckdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW8tZGVmaW5lcyc7XG5cbi8vIOKUgOKUgCBEaXJlY3Rpb25MaWdodENvbnRyb2xsZXIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmNsYXNzIERpcmVjdGlvbkxpZ2h0Q29udHJvbGxlciBleHRlbmRzIENvbnRyb2xsZXJCYXNlIHtcbiAgICBwcm90ZWN0ZWQgX2xpZ2h0RGlyTm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3Iocm9vdE5vZGU6IE5vZGUpIHtcbiAgICAgICAgc3VwZXIocm9vdE5vZGUpO1xuICAgICAgICB0aGlzLmxvY2tTaXplID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbml0U2hhcGUoKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckNhbWVyYU1vdmVkRXZlbnQoKTtcbiAgICB9XG5cbiAgICBzZXRDb2xvcihjb2xvcjogQ29sb3IpIHtcbiAgICAgICAgc2V0TWVzaENvbG9yKHRoaXMuX2xpZ2h0RGlyTm9kZSEsIGNvbG9yKTtcbiAgICAgICAgdGhpcy5fY29sb3IgPSBjb2xvcjtcbiAgICB9XG5cbiAgICBpbml0U2hhcGUoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlU2hhcGVOb2RlKCdEaXJlY3Rpb25MaWdodENvbnRyb2xsZXInKTtcbiAgICAgICAgY29uc3QgbGlnaHRPcmlEaXIgPSBuZXcgVmVjMygwLCAwLCAtMSk7XG4gICAgICAgIGNvbnN0IGxpZ2h0RGlyTm9kZSA9IENvbnRyb2xsZXJVdGlscy5hcmNEaXJlY3Rpb25MaW5lKFxuICAgICAgICAgICAgbmV3IFZlYzMoKSwgbGlnaHRPcmlEaXIsIG5ldyBWZWMzKDEsIDAsIDApLFxuICAgICAgICAgICAgdGhpcy5fdHdvUEksIDIwLCAxMDAsIDksIHRoaXMuX2NvbG9yLFxuICAgICAgICApO1xuICAgICAgICBsaWdodERpck5vZGUucGFyZW50ID0gdGhpcy5zaGFwZTtcbiAgICAgICAgdGhpcy5fbGlnaHREaXJOb2RlID0gbGlnaHREaXJOb2RlO1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9XG59XG5cbi8vIOKUgOKUgCBTZWxlY3RHaXptbyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuY29uc3QgdGVtcFF1YXQgPSBuZXcgUXVhdCgpO1xuXG5jbGFzcyBEaXJlY3Rpb25hbExpZ2h0Q29tcG9uZW50R2l6bW8gZXh0ZW5kcyBHaXptb0Jhc2U8RGlyZWN0aW9uYWxMaWdodD4ge1xuICAgIHByaXZhdGUgX2NvbnRyb2xsZXIhOiBEaXJlY3Rpb25MaWdodENvbnRyb2xsZXI7XG4gICAgcHJpdmF0ZSBfZnJ1c3R1bUN0cmwhOiBGcnVzdHVtQ29udHJvbGxlcjtcbiAgICBwcml2YXRlIF9saWdodEdpem1vQ29sb3I6IENvbG9yID0gbmV3IENvbG9yKDI1NSwgMjU1LCA1MCk7XG5cbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgb25TaG93KCkge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNob3coKTtcbiAgICAgICAgdGhpcy5fZnJ1c3R1bUN0cmwuc2hvdygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25IaWRlKCkge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICAgICAgdGhpcy5fZnJ1c3R1bUN0cmwuaGlkZSgpO1xuICAgIH1cblxuICAgIGNyZWF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIGNvbnN0IGdpem1vUm9vdCA9IHRoaXMuZ2V0R2l6bW9Sb290KCk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIgPSBuZXcgRGlyZWN0aW9uTGlnaHRDb250cm9sbGVyKGdpem1vUm9vdCk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0Q29sb3IodGhpcy5fbGlnaHRHaXptb0NvbG9yKTtcbiAgICAgICAgdGhpcy5fZnJ1c3R1bUN0cmwgPSBuZXcgRnJ1c3R1bUNvbnRyb2xsZXIoZ2l6bW9Sb290KTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZURvd24oKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCB0aGlzLnRhcmdldCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgIH1cblxuICAgIG9uQ29udHJvbGxlck1vdXNlTW92ZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhRnJvbUNvbnRyb2xsZXIoKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZVVwKCkge31cblxuICAgIHVwZGF0ZURhdGFGcm9tQ29udHJvbGxlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlZCAmJiB0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudENoYW5nZWQodGhpcy50YXJnZXQubm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMudGFyZ2V0Lm5vZGU7XG4gICAgICAgIGNvbnN0IHdvcmxkUm90ID0gdGVtcFF1YXQ7XG4gICAgICAgIG5vZGUuZ2V0V29ybGRSb3RhdGlvbih3b3JsZFJvdCk7XG4gICAgICAgIGNvbnN0IHdvcmxkUG9zID0gbm9kZS5nZXRXb3JsZFBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0UG9zaXRpb24od29ybGRQb3MpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldFJvdGF0aW9uKHdvcmxkUm90KTtcbiAgICAgICAgdGhpcy5fZnJ1c3R1bUN0cmwuc2V0UG9zaXRpb24od29ybGRQb3MpO1xuICAgICAgICB0aGlzLl9mcnVzdHVtQ3RybC5zZXRSb3RhdGlvbih3b3JsZFJvdCk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29udHJvbGxlckRhdGEoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCB0aGlzLnRhcmdldCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBkaXJlY3Rpb25hbExpZ2h0ID0gdGhpcy50YXJnZXQ7XG4gICAgICAgIGlmIChkaXJlY3Rpb25hbExpZ2h0KSB7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uYWxMaWdodC5zaGFkb3dFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZnJ1c3R1bUN0cmwuc2hvdygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZydXN0dW1DdHJsLnVwZGF0ZVNpemUoMCwgZGlyZWN0aW9uYWxMaWdodC5zaGFkb3dPcnRob1NpemUsIDEsIDEsIGRpcmVjdGlvbmFsTGlnaHQuc2hhZG93TmVhciwgZGlyZWN0aW9uYWxMaWdodC5zaGFkb3dGYXIsIDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9mcnVzdHVtQ3RybC5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9mcnVzdHVtQ3RybC5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCk7XG4gICAgfVxuXG4gICAgb25UYXJnZXRVcGRhdGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICBvbk5vZGVDaGFuZ2VkKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxufVxuXG4vLyDilIDilIAgSWNvbkdpem1vIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5jbGFzcyBEaXJlY3Rpb25hbExpZ2h0SWNvbkdpem1vIGV4dGVuZHMgSWNvbkdpem1vQmFzZTxEaXJlY3Rpb25hbExpZ2h0PiB7XG4gICAgcHVibGljIGRpc2FibGVPblNlbGVjdGVkID0gdHJ1ZTtcblxuICAgIGNyZWF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRUZXh0dXJlQnlVVUlEKCc5Y2I1NDNiYS1kMTUyLTQ4MDktOGE0NC04ZTdiZDU3MTIxMjNANmM0OGEnKTtcbiAgICB9XG59XG5cbi8vIOKUgOKUgCBFeHBvcnRzICYgcmVnaXN0cmF0aW9uIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgY29uc3QgbmFtZSA9IGpzLmdldENsYXNzTmFtZShEaXJlY3Rpb25hbExpZ2h0KTtcbmV4cG9ydCBjb25zdCBTZWxlY3RHaXptbyA9IERpcmVjdGlvbmFsTGlnaHRDb21wb25lbnRHaXptbztcbmV4cG9ydCBjb25zdCBJY29uR2l6bW8gPSBEaXJlY3Rpb25hbExpZ2h0SWNvbkdpem1vO1xuZXhwb3J0IGNvbnN0IFBlcnNpc3RlbnRHaXptbyA9IG51bGw7XG5cbnJlZ2lzdGVyR2l6bW8obmFtZSwgeyBTZWxlY3RHaXptbywgSWNvbkdpem1vIH0pO1xuIl19