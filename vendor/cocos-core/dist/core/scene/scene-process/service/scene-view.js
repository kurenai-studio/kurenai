'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneViewService = void 0;
const cc_1 = require("cc");
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
const light_manager_1 = require("./scene-view/light-manager");
const scene_view_data_1 = require("./scene-view/scene-view-data");
let SceneViewService = class SceneViewService extends core_1.BaseService {
    _sceneViewLight = null;
    _lightNode = null;
    _isVisible = true;
    init() {
        const lightNode = new cc_1.Node('SceneViewLight');
        lightNode.layer = cc_1.Layers.Enum.EDITOR;
        this._lightNode = lightNode;
        const light = lightNode.addComponent(cc_1.DirectionalLight);
        this._sceneViewLight = light;
        light.enabled = !scene_view_data_1.sceneViewData.isSceneLightOn;
        this._makeSureDirectionLightActive();
        scene_view_data_1.sceneViewData.on('is-scene-light-on', (isOn) => {
            this._onIsSceneLightOn(isOn);
        });
        void this.initFromConfig().then(() => {
            this._onIsSceneLightOn(scene_view_data_1.sceneViewData.isSceneLightOn);
        });
    }
    _makeSureDirectionLightActive() {
        if (this._sceneViewLight) {
            const scene = new cc_1.Scene('');
            this._sceneViewLight.node.parent = scene;
            scene._load();
            scene._activate();
        }
    }
    async initFromConfig() {
        await scene_view_data_1.sceneViewData.initFromConfig();
    }
    async saveConfig() {
        await scene_view_data_1.sceneViewData.saveConfig();
    }
    setSceneLightOn(enable) {
        scene_view_data_1.sceneViewData.isSceneLightOn = enable;
        void scene_view_data_1.sceneViewData.saveConfig();
    }
    querySceneLightOn() {
        return scene_view_data_1.sceneViewData.isSceneLightOn;
    }
    onEditorOpened() {
        const scene = cc.director?.getScene();
        if (scene) {
            light_manager_1.lightManager.onEditorOpened(scene, scene_view_data_1.sceneViewData.isSceneLightOn);
        }
        // Parent light node to editor camera node (aligned with editor's init())
        if (this._lightNode) {
            try {
                const cameraNode = decorator_1.Service.Camera?.camera?.node;
                if (cameraNode) {
                    this._lightNode.parent = cameraNode;
                }
            }
            catch (e) {
                // Camera not ready
            }
        }
    }
    onEditorClosed() {
        // Nothing to clean up
    }
    onComponentAdded(comp) {
        light_manager_1.lightManager.onComponentAdded(comp);
    }
    onComponentRemoved(comp) {
        light_manager_1.lightManager.onComponentRemoved(comp);
    }
    get isVisible() {
        return this._isVisible;
    }
    set isVisible(value) {
        this._isVisible = value;
        this.emit('scene-view:visibility-changed', value);
    }
    _onIsSceneLightOn(isEnable) {
        if (isEnable) {
            light_manager_1.lightManager.enableSceneLights();
            if (this._sceneViewLight) {
                this._sceneViewLight.enabled = false;
            }
        }
        else {
            light_manager_1.lightManager.disableSceneLights();
            if (this._sceneViewLight) {
                this._sceneViewLight.enabled = true;
            }
        }
        this.emit('scene-view:light-changed', isEnable);
        try {
            decorator_1.Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine not ready
        }
    }
};
exports.SceneViewService = SceneViewService;
exports.SceneViewService = SceneViewService = __decorate([
    (0, decorator_1.register)('SceneView')
], SceneViewService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9zY2VuZS12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7O0FBRWIsMkJBQXNGO0FBQ3RGLGlDQUFxQztBQUNyQyxnREFBcUQ7QUFDckQsOERBQTBEO0FBQzFELGtFQUE2RDtBQUl0RCxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLGtCQUE2QjtJQUN2RCxlQUFlLEdBQTBCLElBQUksQ0FBQztJQUM5QyxVQUFVLEdBQWdCLElBQUksQ0FBQztJQUMvQixVQUFVLEdBQUcsSUFBSSxDQUFDO0lBRTFCLElBQUk7UUFDQSxNQUFNLFNBQVMsR0FBRyxJQUFJLFNBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFFNUIsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxxQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzdCLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQywrQkFBYSxDQUFDLGNBQWMsQ0FBQztRQUU5QyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUVyQywrQkFBYSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLElBQWEsRUFBRSxFQUFFO1lBQ3BELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDakMsSUFBSSxDQUFDLGlC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LENBQUM7UUFFaEQsSUFBSSxDQUFDO1lBQ0QsbUJBQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsbUJBQW1CO1FBQ3ZCLENBQUM7SUFDTCxDQUFDO0NBQ0osQ0FBQTtBQS9HWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixJQUFBLG9CQUFRLEVBQUMsV0FBVyxDQUFDO0dBQ1QsZ0JBQWdCLENBK0c1QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQ29tcG9uZW50LCBEaXJlY3Rpb25hbExpZ2h0LCBMYXllcnMsIExpZ2h0Q29tcG9uZW50LCBOb2RlLCBTY2VuZSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9jb3JlJztcbmltcG9ydCB7IHJlZ2lzdGVyLCBTZXJ2aWNlIH0gZnJvbSAnLi9jb3JlL2RlY29yYXRvcic7XG5pbXBvcnQgeyBsaWdodE1hbmFnZXIgfSBmcm9tICcuL3NjZW5lLXZpZXcvbGlnaHQtbWFuYWdlcic7XG5pbXBvcnQgeyBzY2VuZVZpZXdEYXRhIH0gZnJvbSAnLi9zY2VuZS12aWV3L3NjZW5lLXZpZXctZGF0YSc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZVZpZXdFdmVudHMsIElTY2VuZVZpZXdTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vY29tbW9uJztcblxuQHJlZ2lzdGVyKCdTY2VuZVZpZXcnKVxuZXhwb3J0IGNsYXNzIFNjZW5lVmlld1NlcnZpY2UgZXh0ZW5kcyBCYXNlU2VydmljZTxJU2NlbmVWaWV3RXZlbnRzPiBpbXBsZW1lbnRzIElTY2VuZVZpZXdTZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9zY2VuZVZpZXdMaWdodDogTGlnaHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9saWdodE5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9pc1Zpc2libGUgPSB0cnVlO1xuXG4gICAgaW5pdCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbGlnaHROb2RlID0gbmV3IE5vZGUoJ1NjZW5lVmlld0xpZ2h0Jyk7XG4gICAgICAgIGxpZ2h0Tm9kZS5sYXllciA9IExheWVycy5FbnVtLkVESVRPUjtcbiAgICAgICAgdGhpcy5fbGlnaHROb2RlID0gbGlnaHROb2RlO1xuXG4gICAgICAgIGNvbnN0IGxpZ2h0ID0gbGlnaHROb2RlLmFkZENvbXBvbmVudChEaXJlY3Rpb25hbExpZ2h0KTtcbiAgICAgICAgdGhpcy5fc2NlbmVWaWV3TGlnaHQgPSBsaWdodDtcbiAgICAgICAgbGlnaHQuZW5hYmxlZCA9ICFzY2VuZVZpZXdEYXRhLmlzU2NlbmVMaWdodE9uO1xuXG4gICAgICAgIHRoaXMuX21ha2VTdXJlRGlyZWN0aW9uTGlnaHRBY3RpdmUoKTtcblxuICAgICAgICBzY2VuZVZpZXdEYXRhLm9uKCdpcy1zY2VuZS1saWdodC1vbicsIChpc09uOiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9vbklzU2NlbmVMaWdodE9uKGlzT24pO1xuICAgICAgICB9KTtcblxuICAgICAgICB2b2lkIHRoaXMuaW5pdEZyb21Db25maWcoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX29uSXNTY2VuZUxpZ2h0T24oc2NlbmVWaWV3RGF0YS5pc1NjZW5lTGlnaHRPbik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX21ha2VTdXJlRGlyZWN0aW9uTGlnaHRBY3RpdmUoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9zY2VuZVZpZXdMaWdodCkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBuZXcgU2NlbmUoJycpO1xuICAgICAgICAgICAgdGhpcy5fc2NlbmVWaWV3TGlnaHQubm9kZS5wYXJlbnQgPSBzY2VuZTtcbiAgICAgICAgICAgIChzY2VuZSBhcyBhbnkpLl9sb2FkKCk7XG4gICAgICAgICAgICAoc2NlbmUgYXMgYW55KS5fYWN0aXZhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGluaXRGcm9tQ29uZmlnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBzY2VuZVZpZXdEYXRhLmluaXRGcm9tQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZUNvbmZpZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgc2NlbmVWaWV3RGF0YS5zYXZlQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgc2V0U2NlbmVMaWdodE9uKGVuYWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBzY2VuZVZpZXdEYXRhLmlzU2NlbmVMaWdodE9uID0gZW5hYmxlO1xuICAgICAgICB2b2lkIHNjZW5lVmlld0RhdGEuc2F2ZUNvbmZpZygpO1xuICAgIH1cblxuICAgIHF1ZXJ5U2NlbmVMaWdodE9uKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gc2NlbmVWaWV3RGF0YS5pc1NjZW5lTGlnaHRPbjtcbiAgICB9XG5cbiAgICBvbkVkaXRvck9wZW5lZCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2NlbmUgPSAoY2MgYXMgYW55KS5kaXJlY3Rvcj8uZ2V0U2NlbmUoKTtcbiAgICAgICAgaWYgKHNjZW5lKSB7XG4gICAgICAgICAgICBsaWdodE1hbmFnZXIub25FZGl0b3JPcGVuZWQoc2NlbmUsIHNjZW5lVmlld0RhdGEuaXNTY2VuZUxpZ2h0T24pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFyZW50IGxpZ2h0IG5vZGUgdG8gZWRpdG9yIGNhbWVyYSBub2RlIChhbGlnbmVkIHdpdGggZWRpdG9yJ3MgaW5pdCgpKVxuICAgICAgICBpZiAodGhpcy5fbGlnaHROb2RlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbWVyYU5vZGUgPSAoU2VydmljZSBhcyBhbnkpLkNhbWVyYT8uY2FtZXJhPy5ub2RlO1xuICAgICAgICAgICAgICAgIGlmIChjYW1lcmFOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xpZ2h0Tm9kZS5wYXJlbnQgPSBjYW1lcmFOb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDYW1lcmEgbm90IHJlYWR5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkVkaXRvckNsb3NlZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gTm90aGluZyB0byBjbGVhbiB1cFxuICAgIH1cblxuICAgIG9uQ29tcG9uZW50QWRkZWQoY29tcDogQ29tcG9uZW50KTogdm9pZCB7XG4gICAgICAgIGxpZ2h0TWFuYWdlci5vbkNvbXBvbmVudEFkZGVkKGNvbXApO1xuICAgIH1cblxuICAgIG9uQ29tcG9uZW50UmVtb3ZlZChjb21wOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgICAgICAgbGlnaHRNYW5hZ2VyLm9uQ29tcG9uZW50UmVtb3ZlZChjb21wKTtcbiAgICB9XG5cbiAgICBnZXQgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNWaXNpYmxlO1xuICAgIH1cblxuICAgIHNldCBpc1Zpc2libGUodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5faXNWaXNpYmxlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuZW1pdCgnc2NlbmUtdmlldzp2aXNpYmlsaXR5LWNoYW5nZWQnLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfb25Jc1NjZW5lTGlnaHRPbihpc0VuYWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAoaXNFbmFibGUpIHtcbiAgICAgICAgICAgIGxpZ2h0TWFuYWdlci5lbmFibGVTY2VuZUxpZ2h0cygpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NjZW5lVmlld0xpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2NlbmVWaWV3TGlnaHQuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGlnaHRNYW5hZ2VyLmRpc2FibGVTY2VuZUxpZ2h0cygpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NjZW5lVmlld0xpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2NlbmVWaWV3TGlnaHQuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KCdzY2VuZS12aWV3OmxpZ2h0LWNoYW5nZWQnLCBpc0VuYWJsZSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIEVuZ2luZSBub3QgcmVhZHlcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==