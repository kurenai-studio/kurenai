"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniPreview = void 0;
const apply = __importStar(require("./apply"));
const private_1 = require("./private");
const cc_1 = require("cc");
const preview_base_1 = require("../preview-base");
const buffer_1 = __importDefault(require("../buffer"));
const decorator_1 = require("../../core/decorator");
class MiniPreview extends preview_base_1.PreviewBase {
    previewNodes = {};
    scene = null;
    renderScene = null;
    currNode = null;
    _previewInfo;
    init(registerName, queryName) {
        this.previewBuffer = new buffer_1.default(registerName, queryName);
        if (this.previewBuffer.window) {
            cc.director.root.destroyWindow(this.previewBuffer.window);
        }
        this._previewInfo = {
            width: 320,
            height: 240,
        };
    }
    setPreviewResolution(width, height) {
        this._previewInfo = { width, height };
    }
    setAspect(srcCamCom, tarCam) {
        if (srcCamCom.targetTexture) {
            tarCam._aspect = srcCamCom.camera.aspect;
        }
        else {
            tarCam._aspect = this._previewInfo.width / this._previewInfo.height;
        }
    }
    onNodeChanged(node, opts) {
        if (!node)
            return;
        const srcCamera = node.getComponent('cc.Camera');
        if (!srcCamera)
            return;
        if (node === this.currNode && srcCamera) {
            if (!this.previewNodes[srcCamera.uuid]) {
                this.createPreviewNode(srcCamera);
            }
            const previewNode = this.previewNodes[srcCamera.uuid];
            apply.applyCamera(srcCamera, previewNode.camera);
            this.setAspect(srcCamera, previewNode.camera);
            decorator_1.Service.Engine.repaintInEditMode();
        }
    }
    onNodeRemoved(node) {
        const srcCamera = node.getComponent('cc.Camera');
        if (!srcCamera)
            return;
        this.removePreviewNode(srcCamera);
    }
    handleSelect(uuid) {
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        const currComp = EditorExtends?.Component?.getComponent?.(uuid);
        if (!currComp)
            return;
        if (!currComp.node.active || !currComp.node.activeInHierarchy || !currComp.enabled) {
            return;
        }
        decorator_1.Service.Engine.repaintInEditMode();
        this.createPreviewNode(currComp);
    }
    handleUnselect(uuid) {
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        const currComp = EditorExtends?.Component?.getComponent?.(uuid);
        if (!currComp || !(currComp instanceof cc_1.Camera))
            return;
        this.removePreviewNode(currComp);
    }
    onComponentRemoved(comp) {
        if (!(comp instanceof cc_1.Camera))
            return;
        decorator_1.Service.Engine.repaintInEditMode();
        this.removePreviewNode(comp);
    }
    clearByComponent(comp) {
        if (comp instanceof cc_1.Camera) {
            const { uuid } = comp;
            if (this.previewBuffer.windows[uuid]) {
                this.previewBuffer.removeWindow(uuid);
            }
            if (this.previewNodes[uuid]) {
                this.previewNodes[uuid].node.destroy();
                this.previewNodes[uuid].camera.destroy();
                delete this.previewNodes[uuid];
            }
        }
    }
    removePreviewNode(srcCamera) {
        const currNode = srcCamera.node;
        for (let i = 0; i < currNode.children.length; ++i) {
            const privateCamera = currNode.children[i].getComponent('cc.Camera');
            // @ts-expect-error
            if (currNode.children[i].isPrivatePreview && privateCamera) {
                const privateNode = currNode.children[i];
                privateNode.destroy();
                srcCamera.node.removeChild(privateNode);
            }
        }
        this.currNode = null;
        this.clearByComponent(srcCamera);
    }
    createPreviewNode(srcCamera) {
        this.clearByComponent(srcCamera);
        const name = srcCamera.node.name;
        const privateNode = (0, private_1.createPreviewNode)(name);
        const privateCamera = privateNode.addComponent('cc.Camera');
        srcCamera.node.addChild(privateNode);
        if (!privateCamera.camera) {
            return;
        }
        privateCamera.camera.cameraUsage = cc_1.renderer.scene.CameraUsage.PREVIEW;
        this.previewNodes[srcCamera.uuid] = { node: privateNode, camera: privateCamera.camera };
        const previewNode = this.previewNodes[srcCamera.uuid];
        apply.applyCamera(srcCamera, previewNode.camera);
        this.setAspect(srcCamera, previewNode.camera);
        if (!this.previewBuffer.windows[srcCamera.uuid]) {
            this.previewBuffer.createWindow(srcCamera.uuid);
        }
        else {
            this.previewBuffer.window = this.previewBuffer.windows[srcCamera.uuid];
            this.clearPreviewBuffer();
        }
        this.previewBuffer.switchCameras(previewNode.camera, this.previewBuffer.window);
        this.currNode = srcCamera.node;
        return previewNode;
    }
    getPreviewInfo() {
        return this._previewInfo;
    }
}
exports.MiniPreview = MiniPreview;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvcHJldmlldy9taW5pLXByZXZpZXcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLHVDQUE4QztBQUM5QywyQkFBNkQ7QUFDN0Qsa0RBQThDO0FBQzlDLHVEQUFzQztBQUN0QyxvREFBK0M7QUFFL0MsTUFBYSxXQUFZLFNBQVEsMEJBQVc7SUFDeEMsWUFBWSxHQUFRLEVBQUUsQ0FBQztJQUN2QixLQUFLLEdBQVEsSUFBSSxDQUFDO0lBQ2xCLFdBQVcsR0FBUSxJQUFJLENBQUM7SUFDeEIsUUFBUSxHQUFRLElBQUksQ0FBQztJQUNyQixZQUFZLENBQU07SUFFWCxJQUFJLENBQUMsWUFBb0IsRUFBRSxTQUFpQjtRQUMvQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksZ0JBQWEsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzVCLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHO1lBQ2hCLEtBQUssRUFBRSxHQUFHO1lBQ1YsTUFBTSxFQUFFLEdBQUc7U0FDZCxDQUFDO0lBQ04sQ0FBQztJQUVNLG9CQUFvQixDQUFDLEtBQWEsRUFBRSxNQUFjO1FBQ3JELElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQVMsQ0FBQyxTQUFjLEVBQUUsTUFBVztRQUNqQyxJQUFJLFNB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SUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFDRCxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEYsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQy9CLE9BQU8sV0FBVyxDQUFDO0lBQ3ZCLENBQUM7SUFFTSxjQUFjO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUM3QixDQUFDO0NBQ0o7QUF4SUQsa0NBd0lDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXBwbHkgZnJvbSAnLi9hcHBseSc7XG5pbXBvcnQgeyBjcmVhdGVQcmV2aWV3Tm9kZSB9IGZyb20gJy4vcHJpdmF0ZSc7XG5pbXBvcnQgeyBDYW1lcmEsIENhbWVyYUNvbXBvbmVudCwgTm9kZSwgcmVuZGVyZXIgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBQcmV2aWV3QmFzZSB9IGZyb20gJy4uL3ByZXZpZXctYmFzZSc7XG5pbXBvcnQgUHJldmlld0J1ZmZlciBmcm9tICcuLi9idWZmZXInO1xuaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4uLy4uL2NvcmUvZGVjb3JhdG9yJztcblxuZXhwb3J0IGNsYXNzIE1pbmlQcmV2aWV3IGV4dGVuZHMgUHJldmlld0Jhc2Uge1xuICAgIHByZXZpZXdOb2RlczogYW55ID0ge307XG4gICAgc2NlbmU6IGFueSA9IG51bGw7XG4gICAgcmVuZGVyU2NlbmU6IGFueSA9IG51bGw7XG4gICAgY3Vyck5vZGU6IGFueSA9IG51bGw7XG4gICAgX3ByZXZpZXdJbmZvOiBhbnk7XG5cbiAgICBwdWJsaWMgaW5pdChyZWdpc3Rlck5hbWU6IHN0cmluZywgcXVlcnlOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5wcmV2aWV3QnVmZmVyID0gbmV3IFByZXZpZXdCdWZmZXIocmVnaXN0ZXJOYW1lLCBxdWVyeU5hbWUpO1xuICAgICAgICBpZiAodGhpcy5wcmV2aWV3QnVmZmVyLndpbmRvdykge1xuICAgICAgICAgICAgY2MuZGlyZWN0b3Iucm9vdC5kZXN0cm95V2luZG93KHRoaXMucHJldmlld0J1ZmZlci53aW5kb3cpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ByZXZpZXdJbmZvID0ge1xuICAgICAgICAgICAgd2lkdGg6IDMyMCxcbiAgICAgICAgICAgIGhlaWdodDogMjQwLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQcmV2aWV3UmVzb2x1dGlvbih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9wcmV2aWV3SW5mbyA9IHsgd2lkdGgsIGhlaWdodCB9O1xuICAgIH1cblxuICAgIHNldEFzcGVjdChzcmNDYW1Db206IGFueSwgdGFyQ2FtOiBhbnkpIHtcbiAgICAgICAgaWYgKHNyY0NhbUNvbS50YXJnZXRUZXh0dXJlKSB7XG4gICAgICAgICAgICB0YXJDYW0uX2FzcGVjdCA9IHNyY0NhbUNvbS5jYW1lcmEuYXNwZWN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyQ2FtLl9hc3BlY3QgPSB0aGlzLl9wcmV2aWV3SW5mby53aWR0aCAvIHRoaXMuX3ByZXZpZXdJbmZvLmhlaWdodDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVDaGFuZ2VkKG5vZGU6IE5vZGUsIG9wdHM6IGFueSkge1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcbiAgICAgICAgY29uc3Qgc3JjQ2FtZXJhID0gbm9kZS5nZXRDb21wb25lbnQoJ2NjLkNhbWVyYScpIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICAgICAgaWYgKCFzcmNDYW1lcmEpIHJldHVybjtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMuY3Vyck5vZGUgJiYgc3JjQ2FtZXJhKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucHJldmlld05vZGVzW3NyY0NhbWVyYS51dWlkXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlUHJldmlld05vZGUoc3JjQ2FtZXJhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdOb2RlID0gdGhpcy5wcmV2aWV3Tm9kZXNbc3JjQ2FtZXJhLnV1aWRdO1xuICAgICAgICAgICAgYXBwbHkuYXBwbHlDYW1lcmEoc3JjQ2FtZXJhLCBwcmV2aWV3Tm9kZS5jYW1lcmEpO1xuICAgICAgICAgICAgdGhpcy5zZXRBc3BlY3Qoc3JjQ2FtZXJhLCBwcmV2aWV3Tm9kZS5jYW1lcmEpO1xuICAgICAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVSZW1vdmVkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3Qgc3JjQ2FtZXJhID0gbm9kZS5nZXRDb21wb25lbnQoJ2NjLkNhbWVyYScpIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICAgICAgaWYgKCFzcmNDYW1lcmEpIHJldHVybjtcbiAgICAgICAgdGhpcy5yZW1vdmVQcmV2aWV3Tm9kZShzcmNDYW1lcmEpO1xuICAgIH1cblxuICAgIGhhbmRsZVNlbGVjdCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgRWRpdG9yRXh0ZW5kcyA9IChjYyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgICAgICBjb25zdCBjdXJyQ29tcCA9IEVkaXRvckV4dGVuZHM/LkNvbXBvbmVudD8uZ2V0Q29tcG9uZW50Py4odXVpZCk7XG4gICAgICAgIGlmICghY3VyckNvbXApIHJldHVybjtcbiAgICAgICAgaWYgKCFjdXJyQ29tcC5ub2RlLmFjdGl2ZSB8fCAhY3VyckNvbXAubm9kZS5hY3RpdmVJbkhpZXJhcmNoeSB8fCAhY3VyckNvbXAuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlUHJldmlld05vZGUoY3VyckNvbXAgYXMgQ2FtZXJhQ29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBoYW5kbGVVbnNlbGVjdCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgRWRpdG9yRXh0ZW5kcyA9IChjYyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgICAgICBjb25zdCBjdXJyQ29tcCA9IEVkaXRvckV4dGVuZHM/LkNvbXBvbmVudD8uZ2V0Q29tcG9uZW50Py4odXVpZCk7XG4gICAgICAgIGlmICghY3VyckNvbXAgfHwgIShjdXJyQ29tcCBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybjtcbiAgICAgICAgdGhpcy5yZW1vdmVQcmV2aWV3Tm9kZShjdXJyQ29tcCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uQ29tcG9uZW50UmVtb3ZlZChjb21wOiBDYW1lcmFDb21wb25lbnQpIHtcbiAgICAgICAgaWYgKCEoY29tcCBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybjtcbiAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVQcmV2aWV3Tm9kZShjb21wKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNsZWFyQnlDb21wb25lbnQoY29tcDogQ2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICAgIGlmIChjb21wIGluc3RhbmNlb2YgQ2FtZXJhKSB7XG4gICAgICAgICAgICBjb25zdCB7IHV1aWQgfSA9IGNvbXA7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2aWV3QnVmZmVyLndpbmRvd3NbdXVpZF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXdCdWZmZXIucmVtb3ZlV2luZG93KHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMucHJldmlld05vZGVzW3V1aWRdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3Tm9kZXNbdXVpZF0ubm9kZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3Tm9kZXNbdXVpZF0uY2FtZXJhLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5wcmV2aWV3Tm9kZXNbdXVpZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVQcmV2aWV3Tm9kZShzcmNDYW1lcmE6IENhbWVyYUNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBjdXJyTm9kZSA9IHNyY0NhbWVyYS5ub2RlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJOb2RlLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBwcml2YXRlQ2FtZXJhID0gY3Vyck5vZGUuY2hpbGRyZW5baV0uZ2V0Q29tcG9uZW50KCdjYy5DYW1lcmEnKTtcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICAgICAgICAgIGlmIChjdXJyTm9kZS5jaGlsZHJlbltpXS5pc1ByaXZhdGVQcmV2aWV3ICYmIHByaXZhdGVDYW1lcmEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcml2YXRlTm9kZSA9IGN1cnJOb2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIHByaXZhdGVOb2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBzcmNDYW1lcmEubm9kZS5yZW1vdmVDaGlsZChwcml2YXRlTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY2xlYXJCeUNvbXBvbmVudChzcmNDYW1lcmEpO1xuICAgIH1cblxuICAgIGNyZWF0ZVByZXZpZXdOb2RlKHNyY0NhbWVyYTogQ2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY2xlYXJCeUNvbXBvbmVudChzcmNDYW1lcmEpO1xuICAgICAgICBjb25zdCBuYW1lID0gc3JjQ2FtZXJhLm5vZGUubmFtZTtcbiAgICAgICAgY29uc3QgcHJpdmF0ZU5vZGUgPSBjcmVhdGVQcmV2aWV3Tm9kZShuYW1lKTtcbiAgICAgICAgY29uc3QgcHJpdmF0ZUNhbWVyYSA9IHByaXZhdGVOb2RlLmFkZENvbXBvbmVudCgnY2MuQ2FtZXJhJykgYXMgQ2FtZXJhO1xuICAgICAgICBzcmNDYW1lcmEubm9kZS5hZGRDaGlsZChwcml2YXRlTm9kZSk7XG5cbiAgICAgICAgaWYgKCFwcml2YXRlQ2FtZXJhLmNhbWVyYSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZUNhbWVyYS5jYW1lcmEuY2FtZXJhVXNhZ2UgPSByZW5kZXJlci5zY2VuZS5DYW1lcmFVc2FnZS5QUkVWSUVXO1xuICAgICAgICB0aGlzLnByZXZpZXdOb2Rlc1tzcmNDYW1lcmEudXVpZF0gPSB7IG5vZGU6IHByaXZhdGVOb2RlLCBjYW1lcmE6IHByaXZhdGVDYW1lcmEuY2FtZXJhIH07XG5cbiAgICAgICAgY29uc3QgcHJldmlld05vZGUgPSB0aGlzLnByZXZpZXdOb2Rlc1tzcmNDYW1lcmEudXVpZF07XG4gICAgICAgIGFwcGx5LmFwcGx5Q2FtZXJhKHNyY0NhbWVyYSwgcHJldmlld05vZGUuY2FtZXJhKTtcbiAgICAgICAgdGhpcy5zZXRBc3BlY3Qoc3JjQ2FtZXJhLCBwcmV2aWV3Tm9kZS5jYW1lcmEpO1xuXG4gICAgICAgIGlmICghdGhpcy5wcmV2aWV3QnVmZmVyLndpbmRvd3Nbc3JjQ2FtZXJhLnV1aWRdKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpZXdCdWZmZXIuY3JlYXRlV2luZG93KHNyY0NhbWVyYS51dWlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlld0J1ZmZlci53aW5kb3cgPSB0aGlzLnByZXZpZXdCdWZmZXIud2luZG93c1tzcmNDYW1lcmEudXVpZF07XG4gICAgICAgICAgICB0aGlzLmNsZWFyUHJldmlld0J1ZmZlcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJldmlld0J1ZmZlci5zd2l0Y2hDYW1lcmFzKHByZXZpZXdOb2RlLmNhbWVyYSwgdGhpcy5wcmV2aWV3QnVmZmVyLndpbmRvdyk7XG4gICAgICAgIHRoaXMuY3Vyck5vZGUgPSBzcmNDYW1lcmEubm9kZTtcbiAgICAgICAgcmV0dXJuIHByZXZpZXdOb2RlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcmV2aWV3SW5mbygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ByZXZpZXdJbmZvO1xuICAgIH1cbn1cbiJdfQ==