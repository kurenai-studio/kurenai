"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenePreview = exports.ScenePreview = void 0;
const cc_1 = require("cc");
const buffer_1 = __importDefault(require("./buffer"));
const preview_base_1 = require("./preview-base");
const editorMask = cc_1.Layers.makeMaskInclude([cc_1.Layers.Enum.GIZMOS, cc_1.Layers.Enum.SCENE_GIZMO, cc_1.Layers.Enum.EDITOR]);
class ScenePreview extends preview_base_1.PreviewBase {
    device;
    width = 0;
    height = 0;
    init(registerName, queryName) {
        this.device = cc.director.root.device;
        this.width = this.device.width;
        this.height = this.device.height;
        this.previewBuffer = new buffer_1.default(registerName, queryName);
        this.previewBuffer.on('loadScene', this.detachSceneCameras.bind(this));
    }
    onComponentAdded(comp) {
        if (!comp)
            return;
        if (comp instanceof cc_1.Camera) {
            Promise.resolve().then(() => {
                if (comp.camera)
                    comp.camera.detachCamera();
            });
        }
    }
    detachSceneCameras() {
        const cameras = this.previewBuffer.renderScene.cameras;
        for (const camera of cameras) {
            if (camera.node.layer & editorMask) {
                continue;
            }
            const comp = camera.node.getComponent('cc.Camera');
            if (comp && !camera.node.isPrivatePreview) {
                camera.detachCamera();
            }
        }
        cc.director.root.tempWindow = this.previewBuffer.window;
    }
}
exports.ScenePreview = ScenePreview;
exports.scenePreview = new ScenePreview();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtcHJldmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9wcmV2aWV3L3NjZW5lLXByZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQXFEO0FBQ3JELHNEQUFxQztBQUNyQyxpREFBNkM7QUFFN0MsTUFBTSxVQUFVLEdBQUcsV0FBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUU3RyxNQUFhLFlBQWEsU0FBUSwwQkFBVztJQUN6QyxNQUFNLENBQU07SUFDWixLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUVKLElBQUksQ0FBQyxZQUFvQixFQUFFLFNBQWlCO1FBQy9DLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUVqQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksZ0JBQWEsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU0sZ0JBQWdCLENBQUMsSUFBcUI7UUFDekMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLElBQUksSUFBSSxZQUFZLFdBQU0sRUFBRSxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLElBQUksQ0FBQyxNQUFNO29CQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztJQUVELGtCQUFrQjtRQUNkLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBWSxDQUFDLE9BQU8sQ0FBQztRQUN4RCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzNCLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsVUFBVSxFQUFFLENBQUM7Z0JBQ2pDLFNBQVM7WUFDYixDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbkQsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMxQixDQUFDO1FBQ0wsQ0FBQztRQUNELEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztJQUM1RCxDQUFDO0NBQ0o7QUFwQ0Qsb0NBb0NDO0FBRVksUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExheWVycywgQ2FtZXJhLCBDYW1lcmFDb21wb25lbnQgfSBmcm9tICdjYyc7XG5pbXBvcnQgUHJldmlld0J1ZmZlciBmcm9tICcuL2J1ZmZlcic7XG5pbXBvcnQgeyBQcmV2aWV3QmFzZSB9IGZyb20gJy4vcHJldmlldy1iYXNlJztcblxuY29uc3QgZWRpdG9yTWFzayA9IExheWVycy5tYWtlTWFza0luY2x1ZGUoW0xheWVycy5FbnVtLkdJWk1PUywgTGF5ZXJzLkVudW0uU0NFTkVfR0laTU8sIExheWVycy5FbnVtLkVESVRPUl0pO1xuXG5leHBvcnQgY2xhc3MgU2NlbmVQcmV2aWV3IGV4dGVuZHMgUHJldmlld0Jhc2Uge1xuICAgIGRldmljZTogYW55O1xuICAgIHdpZHRoID0gMDtcbiAgICBoZWlnaHQgPSAwO1xuXG4gICAgcHVibGljIGluaXQocmVnaXN0ZXJOYW1lOiBzdHJpbmcsIHF1ZXJ5TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuZGV2aWNlID0gY2MuZGlyZWN0b3Iucm9vdC5kZXZpY2U7XG4gICAgICAgIHRoaXMud2lkdGggPSB0aGlzLmRldmljZS53aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLmRldmljZS5oZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5wcmV2aWV3QnVmZmVyID0gbmV3IFByZXZpZXdCdWZmZXIocmVnaXN0ZXJOYW1lLCBxdWVyeU5hbWUpO1xuICAgICAgICB0aGlzLnByZXZpZXdCdWZmZXIub24oJ2xvYWRTY2VuZScsIHRoaXMuZGV0YWNoU2NlbmVDYW1lcmFzLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkNvbXBvbmVudEFkZGVkKGNvbXA6IENhbWVyYUNvbXBvbmVudCkge1xuICAgICAgICBpZiAoIWNvbXApIHJldHVybjtcbiAgICAgICAgaWYgKGNvbXAgaW5zdGFuY2VvZiBDYW1lcmEpIHtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb21wLmNhbWVyYSkgY29tcC5jYW1lcmEuZGV0YWNoQ2FtZXJhKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRldGFjaFNjZW5lQ2FtZXJhcygpIHtcbiAgICAgICAgY29uc3QgY2FtZXJhcyA9IHRoaXMucHJldmlld0J1ZmZlci5yZW5kZXJTY2VuZSEuY2FtZXJhcztcbiAgICAgICAgZm9yIChjb25zdCBjYW1lcmEgb2YgY2FtZXJhcykge1xuICAgICAgICAgICAgaWYgKGNhbWVyYS5ub2RlLmxheWVyICYgZWRpdG9yTWFzaykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tcCA9IGNhbWVyYS5ub2RlLmdldENvbXBvbmVudCgnY2MuQ2FtZXJhJyk7XG4gICAgICAgICAgICBpZiAoY29tcCAmJiAhY2FtZXJhLm5vZGUuaXNQcml2YXRlUHJldmlldykge1xuICAgICAgICAgICAgICAgIGNhbWVyYS5kZXRhY2hDYW1lcmEoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYy5kaXJlY3Rvci5yb290LnRlbXBXaW5kb3cgPSB0aGlzLnByZXZpZXdCdWZmZXIud2luZG93O1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNjZW5lUHJldmlldyA9IG5ldyBTY2VuZVByZXZpZXcoKTtcbiJdfQ==