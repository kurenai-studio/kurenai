"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PreviewService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinePreview = exports.PrefabPreview = exports.SkeletonPreview = exports.MeshPreview = exports.ModelPreview = exports.MaterialPreview = exports.MiniPreview = exports.ScenePreview = exports.InteractivePreview = exports.PreviewBase = exports.PreviewService = void 0;
const scene_preview_1 = require("./scene-preview");
const mini_preview_1 = require("./mini-preview");
const material_preview_1 = require("./material-preview");
const model_preview_1 = require("./model-preview");
const mesh_preview_1 = require("./mesh-preview");
const skeleton_preview_1 = require("./skeleton-preview");
const prefab_preview_1 = require("./prefab-preview");
const spine_preview_1 = require("./spine-preview");
const cc_1 = require("cc");
const core_1 = require("../core");
const rpc_1 = require("../../rpc");
let PreviewService = class PreviewService extends core_1.BaseService {
    static { PreviewService_1 = this; }
    _previewMap = new Map();
    _typeMap = new Map();
    _initialized = false;
    _activePreview = null;
    _activeUuid = null;
    _reloadTimer = null;
    scenePreview = scene_preview_1.scenePreview;
    materialPreview = new material_preview_1.MaterialPreview();
    miniPreview = new mini_preview_1.MiniPreview();
    modelPreview = new model_preview_1.ModelPreview();
    meshPreview = new mesh_preview_1.MeshPreview();
    skeletonPreview = new skeleton_preview_1.SkeletonPreview();
    prefabPreview = new prefab_preview_1.PrefabPreview();
    spinePreview = new spine_preview_1.SpinePreview();
    get activePreview() {
        return this._activePreview;
    }
    async init() {
        if (this._initialized)
            return;
        this._initialized = true;
        this.initPreview('scene:preview', 'query-preview-data', this.scenePreview);
        this.initPreview('scene:mini-preview', 'query-mini-preview-data', this.miniPreview);
        this.initPreview('scene:material-preview', 'query-material-preview-data', this.materialPreview);
        this.initPreview('scene:model-preview', 'query-model-preview-data', this.modelPreview);
        this.initPreview('scene:mesh-preview', 'query-mesh-preview-data', this.meshPreview);
        this.initPreview('scene:skeleton-preview', 'query-skeleton-preview-data', this.skeletonPreview);
        this.initPreview('scene:prefab-preview', 'query-prefab-preview-data', this.prefabPreview);
        this.initPreview('scene:spine-preview', 'query-spine-preview-data', this.spinePreview);
        this.initTypeMap();
        console.log('[Preview] PreviewService initialized');
    }
    initTypeMap() {
        const entries = [
            [['material', 'cc.Material'], { instance: this.materialPreview, setup: 'setMaterialByUuid' }],
            [['model', 'cc.FBX', 'cc.GLTF', 'cc.ModelAsset'], { instance: this.modelPreview, setup: 'setModel' }],
            [['mesh', 'cc.Mesh'], { instance: this.meshPreview, setup: 'setMesh' }],
            [['prefab', 'cc.Prefab'], { instance: this.prefabPreview, setup: 'setPrefab' }],
            [['skeleton', 'cc.Skeleton'], { instance: this.skeletonPreview, setup: 'setSkeleton' }],
            [['spine', 'sp.SkeletonData'], { instance: this.spinePreview, setup: 'setSpine' }],
        ];
        for (const [keys, entry] of entries) {
            for (const key of keys) {
                this._typeMap.set(key, entry);
            }
        }
    }
    // importer name → preview type 的映射（用于 assetType 为 cc.Asset 等泛型的回退）
    static IMPORTER_MAP = {
        'gltf': 'model',
        'fbx': 'model',
        'spine-data': 'spine',
    };
    resolvePreview(assetType) {
        return this._typeMap.get(assetType) ?? null;
    }
    async resolveAssetType(uuid) {
        const info = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [uuid]);
        if (!info)
            return null;
        // 优先用 type 匹配；若 type 为泛型（如 cc.Asset），用 importer 回退
        if (info.type && this._typeMap.has(info.type)) {
            return info.type;
        }
        if (info.importer && PreviewService_1.IMPORTER_MAP[info.importer]) {
            return PreviewService_1.IMPORTER_MAP[info.importer];
        }
        return info.type ?? null;
    }
    initPreview(registerName, queryName, mgr) {
        this._previewMap.set(registerName, mgr);
        mgr.init(registerName, queryName);
    }
    async callPreviewFunction(previewName, funcName, ...args) {
        if (this._previewMap.has(previewName)) {
            const preview = this._previewMap.get(previewName);
            if (preview[funcName]) {
                return await preview[funcName](...args);
            }
        }
        return false;
    }
    // --- 上屏预览 ---
    async open(uuid) {
        const assetType = await this.resolveAssetType(uuid);
        if (!assetType) {
            console.warn(`[Preview] Cannot resolve asset type for uuid: ${uuid}`);
            return null;
        }
        const entry = this.resolvePreview(assetType);
        if (!entry) {
            console.warn(`[Preview] Unsupported asset type: ${assetType}`);
            return null;
        }
        // 清理上一个预览的相机
        if (this._activePreview) {
            const prev = this._activePreview;
            if (typeof prev.hide === 'function') {
                prev.hide();
            }
            else if (prev.cameraComp) {
                prev.cameraComp.enabled = false;
                if (prev.camera) {
                    prev.camera.enabled = false;
                }
            }
        }
        // 设置资源
        await entry.instance[entry.setup](uuid);
        this._activePreview = entry.instance;
        this._activeUuid = uuid;
        // 将相机挂到 mainWindow 上屏渲染
        this.attachToMainWindow(entry.instance);
        await this.refreshPreviewCameraView(entry.instance);
        return this._activePreview;
    }
    onAssetChanged(uuid) {
        if (!this._activeUuid || this._activeUuid !== uuid)
            return;
        if (this._reloadTimer) {
            clearTimeout(this._reloadTimer);
        }
        this._reloadTimer = setTimeout(() => {
            this._reloadTimer = null;
            if (this._activeUuid !== uuid)
                return;
            void this.open(uuid).catch((err) => {
                console.warn(`[Preview] Failed to reload changed asset ${uuid}:`, err);
            });
        }, 50);
    }
    attachToMainWindow(previewInstance) {
        const inst = previewInstance;
        if (!inst?.cameraComp)
            return;
        const mainWindow = cc.director.root.mainWindow;
        const camera = inst.cameraComp.camera || inst.camera;
        if (!camera || !mainWindow)
            return;
        const cameraService = core_1.Service.Camera;
        const editorCamera = cameraService?.getCamera?.() ?? cameraService?.camera;
        if (editorCamera) {
            editorCamera.enabled = false;
        }
        const sceneGizmoCamera = core_1.Service.Gizmo?.sceneGizmoCamera;
        if (sceneGizmoCamera) {
            sceneGizmoCamera.enabled = false;
        }
        const skybox = inst.scene?.globals?.skybox;
        if (skybox?.enabled) {
            skybox.enabled = false;
            inst.scene.globals.activate(inst.scene);
        }
        camera.changeTargetWindow(mainWindow);
        camera.isWindowSize = true;
        camera.priority = -1;
        inst.cameraComp.clearFlags = cc_1.Camera.ClearFlag.SOLID_COLOR;
        camera.clearColor = inst.cameraComp.clearColor;
        camera.clearFlag = cc_1.gfx.ClearFlagBit.COLOR | cc_1.gfx.ClearFlagBit.DEPTH_STENCIL;
        camera.enabled = true;
        inst.cameraComp.enabled = true;
        if (inst.scene?.renderScene && !camera.scene) {
            inst.scene.renderScene.addCamera(camera);
        }
        if (inst.worldAxis) {
            inst.worldAxis._sceneGizmoCamera.camera.changeTargetWindow(mainWindow);
            inst.worldAxis._sceneGizmoCamera.camera.enabled = true;
            if (inst.enableAxis) {
                inst.worldAxis.show();
            }
        }
    }
    // --- 缩略图生成 ---
    async refreshPreviewCameraView(previewInstance) {
        const preview = previewInstance;
        if (typeof preview.resetCameraView !== 'function') {
            core_1.Service.Engine.repaintInEditMode();
            return;
        }
        preview.resetCameraView();
        core_1.Service.Engine.repaintInEditMode();
        await new Promise((resolve) => {
            let resolved = false;
            const finish = () => {
                if (resolved)
                    return;
                resolved = true;
                resolve();
            };
            const timer = setTimeout(finish, 100);
            cc.director.once(cc.Director.EVENT_AFTER_DRAW, () => {
                clearTimeout(timer);
                finish();
            });
        });
        if (this._activePreview !== previewInstance)
            return;
        this.attachToMainWindow(previewInstance);
        preview.resetCameraView();
        this.forcePreviewRepaint();
    }
    forcePreviewRepaint() {
        const engine = core_1.Service.Engine;
        if (typeof engine.forceRepaintInEditMode === 'function') {
            engine.forceRepaintInEditMode();
        }
        else {
            core_1.Service.Engine.repaintInEditMode();
        }
    }
    async generateThumbnail(uuid, assetType, width = 128, height = 128) {
        const entry = this.resolvePreview(assetType);
        if (!entry)
            return null;
        await entry.instance[entry.setup](uuid);
        return await entry.instance.queryPreviewData({ width, height });
    }
    // --- Service 事件钩子 ---
    onComponentAdded(comp) {
        this.scenePreview.onComponentAdded(comp);
    }
};
exports.PreviewService = PreviewService;
exports.PreviewService = PreviewService = PreviewService_1 = __decorate([
    (0, core_1.register)('Preview')
], PreviewService);
var preview_base_1 = require("./preview-base");
Object.defineProperty(exports, "PreviewBase", { enumerable: true, get: function () { return preview_base_1.PreviewBase; } });
var interactive_preview_1 = require("./interactive-preview");
Object.defineProperty(exports, "InteractivePreview", { enumerable: true, get: function () { return interactive_preview_1.InteractivePreview; } });
var scene_preview_2 = require("./scene-preview");
Object.defineProperty(exports, "ScenePreview", { enumerable: true, get: function () { return scene_preview_2.ScenePreview; } });
var mini_preview_2 = require("./mini-preview");
Object.defineProperty(exports, "MiniPreview", { enumerable: true, get: function () { return mini_preview_2.MiniPreview; } });
var material_preview_2 = require("./material-preview");
Object.defineProperty(exports, "MaterialPreview", { enumerable: true, get: function () { return material_preview_2.MaterialPreview; } });
var model_preview_2 = require("./model-preview");
Object.defineProperty(exports, "ModelPreview", { enumerable: true, get: function () { return model_preview_2.ModelPreview; } });
var mesh_preview_2 = require("./mesh-preview");
Object.defineProperty(exports, "MeshPreview", { enumerable: true, get: function () { return mesh_preview_2.MeshPreview; } });
var skeleton_preview_2 = require("./skeleton-preview");
Object.defineProperty(exports, "SkeletonPreview", { enumerable: true, get: function () { return skeleton_preview_2.SkeletonPreview; } });
var prefab_preview_2 = require("./prefab-preview");
Object.defineProperty(exports, "PrefabPreview", { enumerable: true, get: function () { return prefab_preview_2.PrefabPreview; } });
var spine_preview_2 = require("./spine-preview");
Object.defineProperty(exports, "SpinePreview", { enumerable: true, get: function () { return spine_preview_2.SpinePreview; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvcHJldmlldy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0EsbURBQTZEO0FBQzdELGlEQUE2QztBQUM3Qyx5REFBcUQ7QUFDckQsbURBQStDO0FBQy9DLGlEQUE2QztBQUM3Qyx5REFBcUQ7QUFDckQscURBQWlEO0FBQ2pELG1EQUErQztBQUMvQywyQkFBaUM7QUFDakMsa0NBQXlEO0FBQ3pELG1DQUFnQztBQVV6QixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsa0JBQTJCOztJQUNuRCxXQUFXLEdBQTZCLElBQUksR0FBRyxFQUFFLENBQUM7SUFDbEQsUUFBUSxHQUFrQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3BELFlBQVksR0FBRyxLQUFLLENBQUM7SUFDckIsY0FBYyxHQUE0QixJQUFJLENBQUM7SUFDL0MsV0FBVyxHQUFrQixJQUFJLENBQUM7SUFDbEMsWUFBWSxHQUF5QyxJQUFJLENBQUM7SUFFbEUsWUFBWSxHQUFHLDRCQUFZLENBQUM7SUFDNUIsZUFBZSxHQUFHLElBQUksa0NBQWUsRUFBRSxDQUFDO0lBQ3hDLFdBQVcsR0FBRyxJQUFJLDBCQUFXLEVBQUUsQ0FBQztJQUNoQyxZQUFZLEdBQUcsSUFBSSw0QkFBWSxFQUFFLENBQUM7SUFDbEMsV0FBVyxHQUFHLElBQUksMEJBQVcsRUFBRSxDQUFDO0lBQ2hDLGVBQWUsR0FBRyxJQUFJLGtDQUFlLEVBQUUsQ0FBQztJQUN4QyxhQUFhLEdBQUcsSUFBSSw4QkFBYSxFQUFFLENBQUM7SUFDcEMsWUFBWSxHQUFHLElBQUksNEJBQVksRUFBRSxDQUFDO0lBRWxDLElBQUksYUFBYTtRQUNiLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUMvQixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUk7UUFD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b20gJy4vcHJldmlldy1iYXNlJztcbmltcG9ydCB7IHNjZW5lUHJldmlldywgU2NlbmVQcmV2aWV3IH0gZnJvbSAnLi9zY2VuZS1wcmV2aWV3JztcbmltcG9ydCB7IE1pbmlQcmV2aWV3IH0gZnJvbSAnLi9taW5pLXByZXZpZXcnO1xuaW1wb3J0IHsgTWF0ZXJpYWxQcmV2aWV3IH0gZnJvbSAnLi9tYXRlcmlhbC1wcmV2aWV3JztcbmltcG9ydCB7IE1vZGVsUHJldmlldyB9IGZyb20gJy4vbW9kZWwtcHJldmlldyc7XG5pbXBvcnQgeyBNZXNoUHJldmlldyB9IGZyb20gJy4vbWVzaC1wcmV2aWV3JztcbmltcG9ydCB7IFNrZWxldG9uUHJldmlldyB9IGZyb20gJy4vc2tlbGV0b24tcHJldmlldyc7XG5pbXBvcnQgeyBQcmVmYWJQcmV2aWV3IH0gZnJvbSAnLi9wcmVmYWItcHJldmlldyc7XG5pbXBvcnQgeyBTcGluZVByZXZpZXcgfSBmcm9tICcuL3NwaW5lLXByZXZpZXcnO1xuaW1wb3J0IHsgQ2FtZXJhLCBnZnggfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBCYXNlU2VydmljZSwgcmVnaXN0ZXIsIFNlcnZpY2UgfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4uLy4uL3JwYyc7XG5pbXBvcnQgdHlwZSB7IEludGVyYWN0aXZlUHJldmlldyB9IGZyb20gJy4vaW50ZXJhY3RpdmUtcHJldmlldyc7XG5pbXBvcnQgdHlwZSB7IElQcmV2aWV3U2VydmljZSwgSVByZXZpZXdFdmVudHMsIElQcmV2aWV3SW5zdGFuY2UgfSBmcm9tICcuLi8uLi8uLi9jb21tb24vcHJldmlldyc7XG5cbmludGVyZmFjZSBQcmV2aWV3VHlwZUVudHJ5IHtcbiAgICBpbnN0YW5jZTogUHJldmlld0Jhc2U7XG4gICAgc2V0dXA6IHN0cmluZztcbn1cblxuQHJlZ2lzdGVyKCdQcmV2aWV3JylcbmV4cG9ydCBjbGFzcyBQcmV2aWV3U2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPElQcmV2aWV3RXZlbnRzPiBpbXBsZW1lbnRzIElQcmV2aWV3U2VydmljZSB7XG4gICAgcHJpdmF0ZSBfcHJldmlld01hcDogTWFwPHN0cmluZywgUHJldmlld0Jhc2U+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgX3R5cGVNYXA6IE1hcDxzdHJpbmcsIFByZXZpZXdUeXBlRW50cnk+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgX2luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfYWN0aXZlUHJldmlldzogSVByZXZpZXdJbnN0YW5jZSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX2FjdGl2ZVV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX3JlbG9hZFRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG4gICAgc2NlbmVQcmV2aWV3ID0gc2NlbmVQcmV2aWV3O1xuICAgIG1hdGVyaWFsUHJldmlldyA9IG5ldyBNYXRlcmlhbFByZXZpZXcoKTtcbiAgICBtaW5pUHJldmlldyA9IG5ldyBNaW5pUHJldmlldygpO1xuICAgIG1vZGVsUHJldmlldyA9IG5ldyBNb2RlbFByZXZpZXcoKTtcbiAgICBtZXNoUHJldmlldyA9IG5ldyBNZXNoUHJldmlldygpO1xuICAgIHNrZWxldG9uUHJldmlldyA9IG5ldyBTa2VsZXRvblByZXZpZXcoKTtcbiAgICBwcmVmYWJQcmV2aWV3ID0gbmV3IFByZWZhYlByZXZpZXcoKTtcbiAgICBzcGluZVByZXZpZXcgPSBuZXcgU3BpbmVQcmV2aWV3KCk7XG5cbiAgICBnZXQgYWN0aXZlUHJldmlldygpOiBJUHJldmlld0luc3RhbmNlIHwgbnVsbCB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVQcmV2aWV3O1xuICAgIH1cblxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5pdFByZXZpZXcoJ3NjZW5lOnByZXZpZXcnLCAncXVlcnktcHJldmlldy1kYXRhJywgdGhpcy5zY2VuZVByZXZpZXcpO1xuICAgICAgICB0aGlzLmluaXRQcmV2aWV3KCdzY2VuZTptaW5pLXByZXZpZXcnLCAncXVlcnktbWluaS1wcmV2aWV3LWRhdGEnLCB0aGlzLm1pbmlQcmV2aWV3KTtcbiAgICAgICAgdGhpcy5pbml0UHJldmlldygnc2NlbmU6bWF0ZXJpYWwtcHJldmlldycsICdxdWVyeS1tYXRlcmlhbC1wcmV2aWV3LWRhdGEnLCB0aGlzLm1hdGVyaWFsUHJldmlldyk7XG4gICAgICAgIHRoaXMuaW5pdFByZXZpZXcoJ3NjZW5lOm1vZGVsLXByZXZpZXcnLCAncXVlcnktbW9kZWwtcHJldmlldy1kYXRhJywgdGhpcy5tb2RlbFByZXZpZXcpO1xuICAgICAgICB0aGlzLmluaXRQcmV2aWV3KCdzY2VuZTptZXNoLXByZXZpZXcnLCAncXVlcnktbWVzaC1wcmV2aWV3LWRhdGEnLCB0aGlzLm1lc2hQcmV2aWV3KTtcbiAgICAgICAgdGhpcy5pbml0UHJldmlldygnc2NlbmU6c2tlbGV0b24tcHJldmlldycsICdxdWVyeS1za2VsZXRvbi1wcmV2aWV3LWRhdGEnLCB0aGlzLnNrZWxldG9uUHJldmlldyk7XG4gICAgICAgIHRoaXMuaW5pdFByZXZpZXcoJ3NjZW5lOnByZWZhYi1wcmV2aWV3JywgJ3F1ZXJ5LXByZWZhYi1wcmV2aWV3LWRhdGEnLCB0aGlzLnByZWZhYlByZXZpZXcpO1xuICAgICAgICB0aGlzLmluaXRQcmV2aWV3KCdzY2VuZTpzcGluZS1wcmV2aWV3JywgJ3F1ZXJ5LXNwaW5lLXByZXZpZXctZGF0YScsIHRoaXMuc3BpbmVQcmV2aWV3KTtcbiAgICAgICAgdGhpcy5pbml0VHlwZU1hcCgpO1xuICAgICAgICBjb25zb2xlLmxvZygnW1ByZXZpZXddIFByZXZpZXdTZXJ2aWNlIGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0VHlwZU1hcCgpIHtcbiAgICAgICAgY29uc3QgZW50cmllczogW3N0cmluZ1tdLCBQcmV2aWV3VHlwZUVudHJ5XVtdID0gW1xuICAgICAgICAgICAgW1snbWF0ZXJpYWwnLCAnY2MuTWF0ZXJpYWwnXSwgeyBpbnN0YW5jZTogdGhpcy5tYXRlcmlhbFByZXZpZXcsIHNldHVwOiAnc2V0TWF0ZXJpYWxCeVV1aWQnIH1dLFxuICAgICAgICAgICAgW1snbW9kZWwnLCAnY2MuRkJYJywgJ2NjLkdMVEYnLCAnY2MuTW9kZWxBc3NldCddLCB7IGluc3RhbmNlOiB0aGlzLm1vZGVsUHJldmlldywgc2V0dXA6ICdzZXRNb2RlbCcgfV0sXG4gICAgICAgICAgICBbWydtZXNoJywgJ2NjLk1lc2gnXSwgeyBpbnN0YW5jZTogdGhpcy5tZXNoUHJldmlldywgc2V0dXA6ICdzZXRNZXNoJyB9XSxcbiAgICAgICAgICAgIFtbJ3ByZWZhYicsICdjYy5QcmVmYWInXSwgeyBpbnN0YW5jZTogdGhpcy5wcmVmYWJQcmV2aWV3LCBzZXR1cDogJ3NldFByZWZhYicgfV0sXG4gICAgICAgICAgICBbWydza2VsZXRvbicsICdjYy5Ta2VsZXRvbiddLCB7IGluc3RhbmNlOiB0aGlzLnNrZWxldG9uUHJldmlldywgc2V0dXA6ICdzZXRTa2VsZXRvbicgfV0sXG4gICAgICAgICAgICBbWydzcGluZScsICdzcC5Ta2VsZXRvbkRhdGEnXSwgeyBpbnN0YW5jZTogdGhpcy5zcGluZVByZXZpZXcsIHNldHVwOiAnc2V0U3BpbmUnIH1dLFxuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXlzLCBlbnRyeV0gb2YgZW50cmllcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3R5cGVNYXAuc2V0KGtleSwgZW50cnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaW1wb3J0ZXIgbmFtZSDihpIgcHJldmlldyB0eXBlIOeahOaYoOWwhO+8iOeUqOS6jiBhc3NldFR5cGUg5Li6IGNjLkFzc2V0IOetieazm+Wei+eahOWbnumAgO+8iVxuICAgIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IElNUE9SVEVSX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgJ2dsdGYnOiAnbW9kZWwnLFxuICAgICAgICAnZmJ4JzogJ21vZGVsJyxcbiAgICAgICAgJ3NwaW5lLWRhdGEnOiAnc3BpbmUnLFxuICAgIH07XG5cbiAgICBwcml2YXRlIHJlc29sdmVQcmV2aWV3KGFzc2V0VHlwZTogc3RyaW5nKTogUHJldmlld1R5cGVFbnRyeSB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHlwZU1hcC5nZXQoYXNzZXRUeXBlKSA/PyBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUFzc2V0VHlwZSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFt1dWlkXSk7XG4gICAgICAgIGlmICghaW5mbykgcmV0dXJuIG51bGw7XG4gICAgICAgIC8vIOS8mOWFiOeUqCB0eXBlIOWMuemFje+8m+iLpSB0eXBlIOS4uuazm+Wei++8iOWmgiBjYy5Bc3NldO+8ie+8jOeUqCBpbXBvcnRlciDlm57pgIBcbiAgICAgICAgaWYgKGluZm8udHlwZSAmJiB0aGlzLl90eXBlTWFwLmhhcyhpbmZvLnR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5mby50eXBlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLmltcG9ydGVyICYmIFByZXZpZXdTZXJ2aWNlLklNUE9SVEVSX01BUFtpbmZvLmltcG9ydGVyXSkge1xuICAgICAgICAgICAgcmV0dXJuIFByZXZpZXdTZXJ2aWNlLklNUE9SVEVSX01BUFtpbmZvLmltcG9ydGVyXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5mby50eXBlID8/IG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0UHJldmlldyhyZWdpc3Rlck5hbWU6IHN0cmluZywgcXVlcnlOYW1lOiBzdHJpbmcsIG1ncjogUHJldmlld0Jhc2UpIHtcbiAgICAgICAgdGhpcy5fcHJldmlld01hcC5zZXQocmVnaXN0ZXJOYW1lLCBtZ3IpO1xuICAgICAgICBtZ3IuaW5pdChyZWdpc3Rlck5hbWUsIHF1ZXJ5TmFtZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNhbGxQcmV2aWV3RnVuY3Rpb24ocHJldmlld05hbWU6IHN0cmluZywgZnVuY05hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgaWYgKHRoaXMuX3ByZXZpZXdNYXAuaGFzKHByZXZpZXdOYW1lKSkge1xuICAgICAgICAgICAgY29uc3QgcHJldmlldzogYW55ID0gdGhpcy5fcHJldmlld01hcC5nZXQocHJldmlld05hbWUpO1xuICAgICAgICAgICAgaWYgKHByZXZpZXdbZnVuY05hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHByZXZpZXdbZnVuY05hbWVdKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyAtLS0g5LiK5bGP6aKE6KeIIC0tLVxuXG4gICAgYXN5bmMgb3Blbih1dWlkOiBzdHJpbmcpOiBQcm9taXNlPElQcmV2aWV3SW5zdGFuY2UgfCBudWxsPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0VHlwZSA9IGF3YWl0IHRoaXMucmVzb2x2ZUFzc2V0VHlwZSh1dWlkKTtcbiAgICAgICAgaWYgKCFhc3NldFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1ByZXZpZXddIENhbm5vdCByZXNvbHZlIGFzc2V0IHR5cGUgZm9yIHV1aWQ6ICR7dXVpZH1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLnJlc29sdmVQcmV2aWV3KGFzc2V0VHlwZSk7XG4gICAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1ByZXZpZXddIFVuc3VwcG9ydGVkIGFzc2V0IHR5cGU6ICR7YXNzZXRUeXBlfWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmuIXnkIbkuIrkuIDkuKrpooTop4jnmoTnm7jmnLpcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVByZXZpZXcpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXYgPSB0aGlzLl9hY3RpdmVQcmV2aWV3IGFzIGFueTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJldi5oaWRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcHJldi5oaWRlKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByZXYuY2FtZXJhQ29tcCkge1xuICAgICAgICAgICAgICAgIHByZXYuY2FtZXJhQ29tcC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHByZXYuY2FtZXJhKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXYuY2FtZXJhLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDorr7nva7otYTmupBcbiAgICAgICAgYXdhaXQgKGVudHJ5Lmluc3RhbmNlIGFzIGFueSlbZW50cnkuc2V0dXBdKHV1aWQpO1xuICAgICAgICB0aGlzLl9hY3RpdmVQcmV2aWV3ID0gZW50cnkuaW5zdGFuY2UgYXMgdW5rbm93biBhcyBJUHJldmlld0luc3RhbmNlO1xuICAgICAgICB0aGlzLl9hY3RpdmVVdWlkID0gdXVpZDtcblxuICAgICAgICAvLyDlsIbnm7jmnLrmjILliLAgbWFpbldpbmRvdyDkuIrlsY/muLLmn5NcbiAgICAgICAgdGhpcy5hdHRhY2hUb01haW5XaW5kb3coZW50cnkuaW5zdGFuY2UgYXMgSW50ZXJhY3RpdmVQcmV2aWV3KTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoUHJldmlld0NhbWVyYVZpZXcoZW50cnkuaW5zdGFuY2UgYXMgSW50ZXJhY3RpdmVQcmV2aWV3KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlUHJldmlldztcbiAgICB9XG5cbiAgICBvbkFzc2V0Q2hhbmdlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmVVdWlkIHx8IHRoaXMuX2FjdGl2ZVV1aWQgIT09IHV1aWQpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX3JlbG9hZFRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fcmVsb2FkVGltZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbG9hZFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZWxvYWRUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlVXVpZCAhPT0gdXVpZCkgcmV0dXJuO1xuICAgICAgICAgICAgdm9pZCB0aGlzLm9wZW4odXVpZCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1ByZXZpZXddIEZhaWxlZCB0byByZWxvYWQgY2hhbmdlZCBhc3NldCAke3V1aWR9OmAsIGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgNTApO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXR0YWNoVG9NYWluV2luZG93KHByZXZpZXdJbnN0YW5jZTogSW50ZXJhY3RpdmVQcmV2aWV3KSB7XG4gICAgICAgIGNvbnN0IGluc3QgPSBwcmV2aWV3SW5zdGFuY2UgYXMgYW55O1xuICAgICAgICBpZiAoIWluc3Q/LmNhbWVyYUNvbXApIHJldHVybjtcblxuICAgICAgICBjb25zdCBtYWluV2luZG93ID0gY2MuZGlyZWN0b3Iucm9vdC5tYWluV2luZG93O1xuICAgICAgICBjb25zdCBjYW1lcmEgPSBpbnN0LmNhbWVyYUNvbXAuY2FtZXJhIHx8IGluc3QuY2FtZXJhO1xuICAgICAgICBpZiAoIWNhbWVyYSB8fCAhbWFpbldpbmRvdykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGNhbWVyYVNlcnZpY2UgPSBTZXJ2aWNlLkNhbWVyYSBhcyBhbnk7XG4gICAgICAgIGNvbnN0IGVkaXRvckNhbWVyYSA9IGNhbWVyYVNlcnZpY2U/LmdldENhbWVyYT8uKCkgPz8gY2FtZXJhU2VydmljZT8uY2FtZXJhO1xuICAgICAgICBpZiAoZWRpdG9yQ2FtZXJhKSB7XG4gICAgICAgICAgICBlZGl0b3JDYW1lcmEuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNjZW5lR2l6bW9DYW1lcmEgPSAoU2VydmljZS5HaXptbyBhcyBhbnkpPy5zY2VuZUdpem1vQ2FtZXJhO1xuICAgICAgICBpZiAoc2NlbmVHaXptb0NhbWVyYSkge1xuICAgICAgICAgICAgc2NlbmVHaXptb0NhbWVyYS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBza3lib3ggPSBpbnN0LnNjZW5lPy5nbG9iYWxzPy5za3lib3g7XG4gICAgICAgIGlmIChza3lib3g/LmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHNreWJveC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICBpbnN0LnNjZW5lLmdsb2JhbHMuYWN0aXZhdGUoaW5zdC5zY2VuZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjYW1lcmEuY2hhbmdlVGFyZ2V0V2luZG93KG1haW5XaW5kb3cpO1xuICAgICAgICBjYW1lcmEuaXNXaW5kb3dTaXplID0gdHJ1ZTtcbiAgICAgICAgY2FtZXJhLnByaW9yaXR5ID0gLTE7XG4gICAgICAgIGluc3QuY2FtZXJhQ29tcC5jbGVhckZsYWdzID0gQ2FtZXJhLkNsZWFyRmxhZy5TT0xJRF9DT0xPUjtcbiAgICAgICAgY2FtZXJhLmNsZWFyQ29sb3IgPSBpbnN0LmNhbWVyYUNvbXAuY2xlYXJDb2xvcjtcbiAgICAgICAgY2FtZXJhLmNsZWFyRmxhZyA9IGdmeC5DbGVhckZsYWdCaXQuQ09MT1IgfCBnZnguQ2xlYXJGbGFnQml0LkRFUFRIX1NURU5DSUw7XG4gICAgICAgIGNhbWVyYS5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgaW5zdC5jYW1lcmFDb21wLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmIChpbnN0LnNjZW5lPy5yZW5kZXJTY2VuZSAmJiAhY2FtZXJhLnNjZW5lKSB7XG4gICAgICAgICAgICBpbnN0LnNjZW5lLnJlbmRlclNjZW5lLmFkZENhbWVyYShjYW1lcmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluc3Qud29ybGRBeGlzKSB7XG4gICAgICAgICAgICBpbnN0LndvcmxkQXhpcy5fc2NlbmVHaXptb0NhbWVyYS5jYW1lcmEuY2hhbmdlVGFyZ2V0V2luZG93KG1haW5XaW5kb3cpO1xuICAgICAgICAgICAgaW5zdC53b3JsZEF4aXMuX3NjZW5lR2l6bW9DYW1lcmEuY2FtZXJhLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGluc3QuZW5hYmxlQXhpcykge1xuICAgICAgICAgICAgICAgIGluc3Qud29ybGRBeGlzLnNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLSDnvKnnlaXlm77nlJ/miJAgLS0tXG5cbiAgICBwcml2YXRlIGFzeW5jIHJlZnJlc2hQcmV2aWV3Q2FtZXJhVmlldyhwcmV2aWV3SW5zdGFuY2U6IEludGVyYWN0aXZlUHJldmlldykge1xuICAgICAgICBjb25zdCBwcmV2aWV3ID0gcHJldmlld0luc3RhbmNlIGFzIGFueTtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2aWV3LnJlc2V0Q2FtZXJhVmlldyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZXZpZXcucmVzZXRDYW1lcmFWaWV3KCk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG5cbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgZmluaXNoID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHJlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KGZpbmlzaCwgMTAwKTtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLm9uY2UoY2MuRGlyZWN0b3IuRVZFTlRfQUZURVJfRFJBVywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgZmluaXNoKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVByZXZpZXcgIT09IHByZXZpZXdJbnN0YW5jZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLmF0dGFjaFRvTWFpbldpbmRvdyhwcmV2aWV3SW5zdGFuY2UpO1xuICAgICAgICBwcmV2aWV3LnJlc2V0Q2FtZXJhVmlldygpO1xuICAgICAgICB0aGlzLmZvcmNlUHJldmlld1JlcGFpbnQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcmNlUHJldmlld1JlcGFpbnQoKSB7XG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IFNlcnZpY2UuRW5naW5lIGFzIGFueTtcbiAgICAgICAgaWYgKHR5cGVvZiBlbmdpbmUuZm9yY2VSZXBhaW50SW5FZGl0TW9kZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgZW5naW5lLmZvcmNlUmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZ2VuZXJhdGVUaHVtYm5haWwodXVpZDogc3RyaW5nLCBhc3NldFR5cGU6IHN0cmluZywgd2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMucmVzb2x2ZVByZXZpZXcoYXNzZXRUeXBlKTtcbiAgICAgICAgaWYgKCFlbnRyeSkgcmV0dXJuIG51bGw7XG4gICAgICAgIGF3YWl0IChlbnRyeS5pbnN0YW5jZSBhcyBhbnkpW2VudHJ5LnNldHVwXSh1dWlkKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGVudHJ5Lmluc3RhbmNlLnF1ZXJ5UHJldmlld0RhdGEoeyB3aWR0aCwgaGVpZ2h0IH0pO1xuICAgIH1cblxuICAgIC8vIC0tLSBTZXJ2aWNlIOS6i+S7tumSqeWtkCAtLS1cblxuICAgIG9uQ29tcG9uZW50QWRkZWQoY29tcDogYW55KSB7XG4gICAgICAgIHRoaXMuc2NlbmVQcmV2aWV3Lm9uQ29tcG9uZW50QWRkZWQoY29tcCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBQcmV2aWV3QmFzZSB9IGZyb20gJy4vcHJldmlldy1iYXNlJztcbmV4cG9ydCB7IEludGVyYWN0aXZlUHJldmlldyB9IGZyb20gJy4vaW50ZXJhY3RpdmUtcHJldmlldyc7XG5leHBvcnQgeyBTY2VuZVByZXZpZXcgfSBmcm9tICcuL3NjZW5lLXByZXZpZXcnO1xuZXhwb3J0IHsgTWluaVByZXZpZXcgfSBmcm9tICcuL21pbmktcHJldmlldyc7XG5leHBvcnQgeyBNYXRlcmlhbFByZXZpZXcgfSBmcm9tICcuL21hdGVyaWFsLXByZXZpZXcnO1xuZXhwb3J0IHsgTW9kZWxQcmV2aWV3IH0gZnJvbSAnLi9tb2RlbC1wcmV2aWV3JztcbmV4cG9ydCB7IE1lc2hQcmV2aWV3IH0gZnJvbSAnLi9tZXNoLXByZXZpZXcnO1xuZXhwb3J0IHsgU2tlbGV0b25QcmV2aWV3IH0gZnJvbSAnLi9za2VsZXRvbi1wcmV2aWV3JztcbmV4cG9ydCB7IFByZWZhYlByZXZpZXcgfSBmcm9tICcuL3ByZWZhYi1wcmV2aWV3JztcbmV4cG9ydCB7IFNwaW5lUHJldmlldyB9IGZyb20gJy4vc3BpbmUtcHJldmlldyc7XG4iXX0=