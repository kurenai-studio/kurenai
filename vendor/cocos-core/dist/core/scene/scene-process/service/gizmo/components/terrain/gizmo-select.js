"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const decorator_1 = require("../../../core/decorator");
const node_create_1 = require("../../../node/node-create");
const gizmo_base_1 = __importDefault(require("../../base/gizmo-base"));
const terrain_editor_1 = require("./terrain-editor");
const terrain_editor_mode_1 = require("./terrain-editor-mode");
const terrain_brush_1 = require("./terrain-brush");
/** Component gizmo containing all Terrain editing operations. */
class TerrainGizmo extends gizmo_base_1.default {
    _editor;
    _isEditorInit = false;
    _isShiftDown = false;
    _isConcave = false;
    _isSmooth = false;
    _isFlatten = false;
    _isSetHeight = false;
    get editor() { return this._editor; }
    get isConcave() { return this._isConcave; }
    get isSmooth() { return this._isSmooth; }
    get isFlatten() { return this._isFlatten; }
    get isSetHeight() { return this._isSetHeight; }
    applySmooth(value) { this._isSmooth = value; }
    get isTerrainChange() { return !!this.target && decorator_1.Service.Terrain.isTerrainChange; }
    set isTerrainChange(value) {
        if (this.target) {
            this.target.manager = decorator_1.Service.Terrain;
            this.target.isTerrainChange = value;
        }
        if (value && this.target)
            decorator_1.Service.Terrain.select(this.target.node.uuid);
    }
    init() {
        this._editor = new terrain_editor_1.TerrainEditor(decorator_1.Service.Camera.getCamera?.() ?? null, this);
    }
    onShow() {
        this.registerCameraMovedEvent();
        this.initEditor();
        this._editor.updateBlockDepthOffset();
    }
    onHide() {
        this._isEditorInit = false;
        this.unregisterCameraMoveEvent();
        this._editor?.clearBrush();
        this._editor?.setEditTerrain(null);
        this._editor?.setCurrentLayer(0);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    onTargetUpdate() {
        // Target clearing happens after onHide() while a pooled gizmo is detached.
        // Never let the detached target consume the editor-initialized guard.
        if (!this.target) {
            this._isEditorInit = false;
            return;
        }
        if (this._isInitialized)
            this.initEditor();
    }
    onNodeChanged() { if (this._isInitialized)
        this.initEditor(); }
    onEditorCameraMoved() { this._editor?.updateBlockDepthOffset(); }
    initEditor() {
        const target = this.target;
        if (!target || !this._editor) {
            this._isEditorInit = false;
            return;
        }
        if (this._isEditorInit && this._editor.getEditTerrain() === target)
            return;
        this._editor.setEditTerrain(target);
        this._isEditorInit = true;
        decorator_1.Service.Engine.repaintInEditMode();
    }
    /**
     * Internal adapter for TerrainService. It intentionally returns plain data
     * instead of exposing this gizmo or its editor internals to Scene callers.
     */
    readTerrainState() {
        const info = this.queryTerrainInfo() ?? { tileSize: 0, weightMapSize: 0, lightMapSize: 0, blockCount: [0, 0] };
        return {
            manage: {
                tileSize: info.tileSize,
                weightMapSize: info.weightMapSize,
                lightMapSize: info.lightMapSize,
                blockCount: [info.blockCount[0] ?? 0, info.blockCount[1] ?? 0],
            },
            layers: this.getLayers().map((layer) => layer ? ({
                detailMapUuid: layer.detailMap,
                normalMapUuid: layer.normalMap,
                metallic: layer.metallic,
                roughness: layer.roughness,
                tileSize: layer.tileSize,
            }) : null),
            mode: this.getTerrainMode(),
            currentLayer: this._editor.getCurrentLayer(),
            sculpt: {
                tool: this.getTerrainSculptTool(),
                brush: this.getTerrainBrushState(terrain_editor_mode_1.eTerrainEditorMode.SCULPT),
            },
            paint: {
                brush: this.getTerrainBrushState(terrain_editor_mode_1.eTerrainEditorMode.PAINT),
            },
        };
    }
    setTerrainMode(mode) {
        const internalMode = {
            manage: terrain_editor_mode_1.eTerrainEditorMode.MANAGE,
            sculpt: terrain_editor_mode_1.eTerrainEditorMode.SCULPT,
            paint: terrain_editor_mode_1.eTerrainEditorMode.PAINT,
            block: terrain_editor_mode_1.eTerrainEditorMode.SELECT,
        };
        this._editor.setMode(internalMode[mode]);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    setTerrainCurrentLayer(currentLayer) {
        if (!Number.isInteger(currentLayer) || currentLayer < -1)
            return;
        if (currentLayer >= 0 && !this.target?.getLayer(currentLayer))
            return;
        this._editor.setCurrentLayer(currentLayer);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    updateTerrainSculptSession(patch) {
        if (patch.tool)
            this.setTerrainSculptTool(patch.tool);
        if (patch.brush)
            this.updateTerrainBrush(terrain_editor_mode_1.eTerrainEditorMode.SCULPT, patch.brush);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    updateTerrainPaintSession(patch) {
        if (patch.brush)
            this.updateTerrainBrush(terrain_editor_mode_1.eTerrainEditorMode.PAINT, patch.brush);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    readTerrainBlock() {
        const select = this._editor.getMode(terrain_editor_mode_1.eTerrainEditorMode.SELECT);
        const index = select.getCurrentBlockIndex();
        if (!index)
            return null;
        const weight = select.getCurrentWeightData();
        return {
            index: { x: index[0], y: index[1] },
            layers: select.getCurrentBlockLayerSlots(),
            weight: weight ? {
                width: weight.width,
                height: weight.height,
                data: new Uint8Array(weight.data),
            } : null,
        };
    }
    getTerrainMode() {
        switch (this._editor.getCurrentModeType()) {
            case terrain_editor_mode_1.eTerrainEditorMode.MANAGE: return 'manage';
            case terrain_editor_mode_1.eTerrainEditorMode.SCULPT: return 'sculpt';
            case terrain_editor_mode_1.eTerrainEditorMode.PAINT: return 'paint';
            default: return 'block';
        }
    }
    getTerrainSculptTool() {
        if (this._isSmooth)
            return 'smooth';
        if (this._isFlatten)
            return 'flatten';
        if (this._isSetHeight)
            return 'set-height';
        return this._isConcave ? 'sunken' : 'bulge';
    }
    setTerrainSculptTool(tool) {
        this._isConcave = tool === 'sunken';
        this._isShiftDown = this._isConcave;
        this._isSmooth = tool === 'smooth';
        this._isFlatten = tool === 'flatten';
        this._isSetHeight = tool === 'set-height';
    }
    getTerrainBrushState(mode) {
        const editor = this.getTerrainBrushEditor(mode);
        const brush = editor.getCurrentBrush();
        const image = editor.getBrush(terrain_brush_1.TerrainBrushType.IMAGE);
        return {
            kind: brush === image ? 'image' : 'circle',
            imageUuid: image.image?._uuid ?? null,
            radius: brush.radius,
            strength: brush.strength,
            rotation: image._rotation,
            setHeight: brush._setHeight,
        };
    }
    updateTerrainBrush(mode, patch) {
        const editor = this.getTerrainBrushEditor(mode);
        const image = editor.getBrush(terrain_brush_1.TerrainBrushType.IMAGE);
        const brush = editor.getCurrentBrush();
        if (typeof patch.radius === 'number')
            brush.radius = patch.radius;
        if (typeof patch.strength === 'number')
            brush.strength = patch.strength;
        if (typeof patch.rotation === 'number')
            image._rotation = patch.rotation;
        if (typeof patch.setHeight === 'number')
            brush._setHeight = patch.setHeight;
    }
    getTerrainBrushEditor(mode) {
        return mode === terrain_editor_mode_1.eTerrainEditorMode.SCULPT
            ? this._editor.getMode(terrain_editor_mode_1.eTerrainEditorMode.SCULPT)
            : this._editor.getMode(terrain_editor_mode_1.eTerrainEditorMode.PAINT);
    }
    async addLayerByUuid(uuid) {
        if (!this.target)
            return -1;
        const texture = await (0, node_create_1.loadAny)(uuid);
        const layer = new cc_1.TerrainLayer();
        layer.detailMap = texture;
        layer.tileSize = 1;
        const index = this.target.addLayer(layer);
        this.updateTerrainAsset();
        this.isTerrainChange = true;
        this.emitNodeChange();
        decorator_1.Service.Engine.repaintInEditMode();
        return index;
    }
    /** Applies a service-validated Sculpt brush texture without changing Terrain asset state. */
    setSculptBrushTexture(texture) {
        const sculpt = this.getTerrainBrushEditor(terrain_editor_mode_1.eTerrainEditorMode.SCULPT);
        sculpt.setBrushImage(texture);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    /** Applies a service-validated Paint brush texture without changing Terrain asset state. */
    setPaintBrushTexture(texture) {
        const paint = this.getTerrainBrushEditor(terrain_editor_mode_1.eTerrainEditorMode.PAINT);
        paint.setBrushImage(texture);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    async setSculptBrushRotation(rotation) {
        this._editor.getMode(terrain_editor_mode_1.eTerrainEditorMode.SCULPT).setSculptBrushRotation(rotation);
    }
    async setLayerValue(index, uuid, extVal) {
        if (!this.target)
            return null;
        const layer = this.target.getLayer(index);
        if (!layer)
            return null;
        if (extVal) {
            if ('tileSize' in extVal)
                layer.tileSize = extVal.tileSize;
            if ('metallic' in extVal)
                layer.metallic = extVal.metallic;
            if ('roughness' in extVal)
                layer.roughness = extVal.roughness;
            if ('normalMap' in extVal)
                layer.normalMap = extVal.normalMap ? await (0, node_create_1.loadAny)(extVal.normalMap) : null;
        }
        if (uuid)
            layer.detailMap = await (0, node_create_1.loadAny)(uuid);
        this.updateTerrainAsset();
        this.isTerrainChange = true;
        this.emitNodeChange();
        decorator_1.Service.Engine.repaintInEditMode();
        return index;
    }
    removeLayerByIndex(index) {
        if (!this.target)
            return;
        this.target.removeLayer(index);
        this.updateTerrainAsset();
        this.isTerrainChange = true;
        this.emitNodeChange();
        decorator_1.Service.Engine.repaintInEditMode();
    }
    setCurrentEditLayer(index) { this._editor.setCurrentLayer(index); decorator_1.Service.Engine.repaintInEditMode(); }
    getLayers() {
        if (!this.target)
            return [];
        return Array.from({ length: cc_1.TERRAIN_MAX_LAYER_COUNT }, (_, index) => {
            const layer = this.target.getLayer(index);
            return layer ? {
                detailMap: layer.detailMap?._uuid ?? null, metallic: layer.metallic,
                normalMap: layer.normalMap?._uuid ?? null, roughness: layer.roughness, tileSize: layer.tileSize,
            } : null;
        });
    }
    getCurrentEditLayer() { return this._editor.getCurrentLayer(); }
    setCurrentEditMode(mode, option) {
        const config = Object.assign({ isSculptDown: false, isSmooth: false, isFlatten: false, isSetHeight: false }, option || {});
        this._isConcave = this._isShiftDown = !!config.isSculptDown;
        this._isSmooth = !!config.isSmooth;
        this._isFlatten = !!config.isFlatten;
        this._isSetHeight = !!config.isSetHeight;
        this._editor.setMode(mode);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    queryTerrainInfo() {
        const info = this.target?.info;
        return info ? {
            tileSize: info.tileSize, weightMapSize: info.weightMapSize, lightMapSize: info.lightMapSize, blockCount: [...info.blockCount],
        } : null;
    }
    changeTerrainInfo(info) {
        if (!this.target)
            return;
        const terrainInfo = new cc_1.TerrainInfo();
        Object.assign(terrainInfo, info);
        this.target.rebuild(terrainInfo);
        this.isTerrainChange = true;
        this.emitNodeChange();
        decorator_1.Service.Engine.repaintInEditMode();
    }
    queryBrushOfMode(mode) {
        if (mode !== terrain_editor_mode_1.eTerrainEditorMode.SCULPT && mode !== terrain_editor_mode_1.eTerrainEditorMode.PAINT)
            return null;
        const brush = this._editor.getMode(mode).getCurrentBrush();
        return { radius: brush.radius, strength: brush.strength, _setHeight: brush._setHeight };
    }
    setBrushOfMode(mode, setting) {
        if (mode !== terrain_editor_mode_1.eTerrainEditorMode.SCULPT && mode !== terrain_editor_mode_1.eTerrainEditorMode.PAINT)
            return;
        const brush = this._editor.getMode(mode).getCurrentBrush();
        for (const key of Object.keys(setting || {}))
            if (key !== 'material' && setting[key] !== undefined)
                brush[key] = setting[key];
    }
    getBlockInfo() {
        const mode = this._editor.getMode(terrain_editor_mode_1.eTerrainEditorMode.SELECT);
        const index = mode.getCurrentBlockIndex() ?? [0, 0];
        const weight = mode.getCurrentWeightData();
        return {
            index: { x: index[0], y: index[1] },
            weight: weight ? { data: Array.from(weight.data), width: weight.width, height: weight.height } : null,
            layers: mode.getCurrentLayerList().map((layer) => layer?._uuid ?? ''),
        };
    }
    emitNodeChange() { if (this.target)
        this.onComponentChanged(this.target.node); }
    onKeyDown(event) { if (event.shiftKey)
        this._isShiftDown = true; }
    onKeyUp(event) { if (event.keyCode === 16)
        this._isShiftDown = this._isConcave; }
    onUpdate(deltaTime) { this._editor?.update(deltaTime, this._isShiftDown); }
    onCameraControlModeChanged(mode) { if (mode !== 0 && this._editor?.isChanged)
        this.emitNodeChange(); }
    updateTerrainAsset() { if (this.target?._asset)
        this.target.exportLayerListToAsset(this.target._asset); }
    onControllerMouseDown(event) { event.propagationStopped = true; this._isShiftDown = event.shiftKey; this._editor.onMouseDown(event.x, event.y); }
    onControllerMouseMove(event) { event.propagationStopped = true; this._editor.onMouseMove(event.x, event.y); }
    onControllerMouseUp(event) { event.propagationStopped = true; if (this._editor.isChanged)
        this.emitNodeChange(); this._editor.onMouseUp(); }
    onControllerHoverOut() { this._editor.onHoverOut(); }
}
exports.default = TerrainGizmo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l6bW8tc2VsZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2dpem1vL2NvbXBvbmVudHMvdGVycmFpbi9naXptby1zZWxlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwyQkFBaUY7QUFFakYsdURBQWtEO0FBQ2xELDJEQUFvRDtBQUNwRCx1RUFBOEM7QUFDOUMscURBQWlEO0FBR2pELCtEQUEyRDtBQUMzRCxtREFBc0U7QUFnQnRFLGlFQUFpRTtBQUNqRSxNQUFxQixZQUFhLFNBQVEsb0JBQWtCO0lBQ2hELE9BQU8sQ0FBaUI7SUFDeEIsYUFBYSxHQUFHLEtBQUssQ0FBQztJQUN0QixZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDbkIsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUNsQixVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQ25CLFlBQVksR0FBRyxLQUFLLENBQUM7SUFFN0IsSUFBVyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM1QyxJQUFXLFNBQVMsS0FBSyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQVcsUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDaEQsSUFBVyxTQUFTLEtBQUssT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUNsRCxJQUFXLFdBQVcsS0FBSyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQy9DLFdBQVcsQ0FBQyxLQUFjLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzlELElBQVcsZUFBZSxLQUFLLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFN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QUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTO1FBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0osb0JBQW9CLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDL0Q7QUE3UkQsK0JBNlJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVycmFpbiwgVGVycmFpbkluZm8sIFRlcnJhaW5MYXllciwgVEVSUkFJTl9NQVhfTEFZRVJfQ09VTlQgfSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7IFRleHR1cmUyRCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IFNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9jb3JlL2RlY29yYXRvcic7XG5pbXBvcnQgeyBsb2FkQW55IH0gZnJvbSAnLi4vLi4vLi4vbm9kZS9ub2RlLWNyZWF0ZSc7XG5pbXBvcnQgR2l6bW9CYXNlIGZyb20gJy4uLy4uL2Jhc2UvZ2l6bW8tYmFzZSc7XG5pbXBvcnQgeyBUZXJyYWluRWRpdG9yIH0gZnJvbSAnLi90ZXJyYWluLWVkaXRvcic7XG5pbXBvcnQgeyBUZXJyYWluRWRpdG9yUGFpbnQgfSBmcm9tICcuL3RlcnJhaW4tZWRpdG9yLXBhaW50JztcbmltcG9ydCB7IFRlcnJhaW5FZGl0b3JTY3VscHQgfSBmcm9tICcuL3RlcnJhaW4tZWRpdG9yLXNjdWxwdCc7XG5pbXBvcnQgeyBlVGVycmFpbkVkaXRvck1vZGUgfSBmcm9tICcuL3RlcnJhaW4tZWRpdG9yLW1vZGUnO1xuaW1wb3J0IHsgVGVycmFpbkJydXNoVHlwZSwgVGVycmFpbkltYWdlQnJ1c2ggfSBmcm9tICcuL3RlcnJhaW4tYnJ1c2gnO1xuaW1wb3J0IHR5cGUge1xuICAgIElUZXJyYWluQmxvY2tEYXRhLFxuICAgIElUZXJyYWluQnJ1c2hQYXRjaCxcbiAgICBJVGVycmFpbkJydXNoU3RhdGUsXG4gICAgSVRlcnJhaW5FZGl0b3JTdGF0ZSxcbiAgICBJVGVycmFpblBhaW50U2Vzc2lvblBhdGNoLFxuICAgIElUZXJyYWluU2N1bHB0U2Vzc2lvblBhdGNoLFxuICAgIFRlcnJhaW5FZGl0b3JNb2RlLFxuICAgIFRlcnJhaW5TY3VscHRUb29sLFxufSBmcm9tICcuLi8uLi8uLi8uLi8uLi9jb21tb24nO1xuaW1wb3J0IHR5cGUgeyBHaXptb01vdXNlRXZlbnQgfSBmcm9tICcuLi8uLi91dGlscy9kZWZpbmVzJztcblxuaW50ZXJmYWNlIElCcnVzaCB7IHJhZGl1czogbnVtYmVyOyBzdHJlbmd0aDogbnVtYmVyOyBfc2V0SGVpZ2h0OiBudW1iZXI7IH1cbmludGVyZmFjZSBJVGVycmFpbkluZm8geyB0aWxlU2l6ZTogbnVtYmVyOyB3ZWlnaHRNYXBTaXplOiBudW1iZXI7IGxpZ2h0TWFwU2l6ZTogbnVtYmVyOyBibG9ja0NvdW50OiBudW1iZXJbXTsgfVxuXG4vKiogQ29tcG9uZW50IGdpem1vIGNvbnRhaW5pbmcgYWxsIFRlcnJhaW4gZWRpdGluZyBvcGVyYXRpb25zLiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVycmFpbkdpem1vIGV4dGVuZHMgR2l6bW9CYXNlPFRlcnJhaW4+IHtcbiAgICBwcml2YXRlIF9lZGl0b3IhOiBUZXJyYWluRWRpdG9yO1xuICAgIHByaXZhdGUgX2lzRWRpdG9ySW5pdCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2lzU2hpZnREb3duID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaXNDb25jYXZlID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaXNTbW9vdGggPSBmYWxzZTtcbiAgICBwcml2YXRlIF9pc0ZsYXR0ZW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIF9pc1NldEhlaWdodCA9IGZhbHNlO1xuXG4gICAgcHVibGljIGdldCBlZGl0b3IoKSB7IHJldHVybiB0aGlzLl9lZGl0b3I7IH1cbiAgICBwdWJsaWMgZ2V0IGlzQ29uY2F2ZSgpIHsgcmV0dXJuIHRoaXMuX2lzQ29uY2F2ZTsgfVxuICAgIHB1YmxpYyBnZXQgaXNTbW9vdGgoKSB7IHJldHVybiB0aGlzLl9pc1Ntb290aDsgfVxuICAgIHB1YmxpYyBnZXQgaXNGbGF0dGVuKCkgeyByZXR1cm4gdGhpcy5faXNGbGF0dGVuOyB9XG4gICAgcHVibGljIGdldCBpc1NldEhlaWdodCgpIHsgcmV0dXJuIHRoaXMuX2lzU2V0SGVpZ2h0OyB9XG4gICAgcHVibGljIGFwcGx5U21vb3RoKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX2lzU21vb3RoID0gdmFsdWU7IH1cbiAgICBwdWJsaWMgZ2V0IGlzVGVycmFpbkNoYW5nZSgpIHsgcmV0dXJuICEhdGhpcy50YXJnZXQgJiYgU2VydmljZS5UZXJyYWluLmlzVGVycmFpbkNoYW5nZTsgfVxuICAgIHB1YmxpYyBzZXQgaXNUZXJyYWluQ2hhbmdlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldCkgeyAodGhpcy50YXJnZXQgYXMgYW55KS5tYW5hZ2VyID0gU2VydmljZS5UZXJyYWluOyAodGhpcy50YXJnZXQgYXMgYW55KS5pc1RlcnJhaW5DaGFuZ2UgPSB2YWx1ZTsgfVxuICAgICAgICBpZiAodmFsdWUgJiYgdGhpcy50YXJnZXQpIFNlcnZpY2UuVGVycmFpbi5zZWxlY3QodGhpcy50YXJnZXQubm9kZS51dWlkKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gbmV3IFRlcnJhaW5FZGl0b3IoKFNlcnZpY2UuQ2FtZXJhIGFzIGFueSkuZ2V0Q2FtZXJhPy4oKSA/PyBudWxsLCB0aGlzKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIG9uU2hvdygpIHtcbiAgICAgICAgdGhpcy5yZWdpc3RlckNhbWVyYU1vdmVkRXZlbnQoKTsgdGhpcy5pbml0RWRpdG9yKCk7IHRoaXMuX2VkaXRvci51cGRhdGVCbG9ja0RlcHRoT2Zmc2V0KCk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBvbkhpZGUoKSB7XG4gICAgICAgIHRoaXMuX2lzRWRpdG9ySW5pdCA9IGZhbHNlOyB0aGlzLnVucmVnaXN0ZXJDYW1lcmFNb3ZlRXZlbnQoKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yPy5jbGVhckJydXNoKCk7IHRoaXMuX2VkaXRvcj8uc2V0RWRpdFRlcnJhaW4obnVsbCk7IHRoaXMuX2VkaXRvcj8uc2V0Q3VycmVudExheWVyKDApO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cbiAgICBwdWJsaWMgb25UYXJnZXRVcGRhdGUoKSB7XG4gICAgICAgIC8vIFRhcmdldCBjbGVhcmluZyBoYXBwZW5zIGFmdGVyIG9uSGlkZSgpIHdoaWxlIGEgcG9vbGVkIGdpem1vIGlzIGRldGFjaGVkLlxuICAgICAgICAvLyBOZXZlciBsZXQgdGhlIGRldGFjaGVkIHRhcmdldCBjb25zdW1lIHRoZSBlZGl0b3ItaW5pdGlhbGl6ZWQgZ3VhcmQuXG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzRWRpdG9ySW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pc0luaXRpYWxpemVkKSB0aGlzLmluaXRFZGl0b3IoKTtcbiAgICB9XG4gICAgcHVibGljIG9uTm9kZUNoYW5nZWQoKSB7IGlmICh0aGlzLl9pc0luaXRpYWxpemVkKSB0aGlzLmluaXRFZGl0b3IoKTsgfVxuICAgIHB1YmxpYyBvbkVkaXRvckNhbWVyYU1vdmVkKCkgeyB0aGlzLl9lZGl0b3I/LnVwZGF0ZUJsb2NrRGVwdGhPZmZzZXQoKTsgfVxuICAgIHByaXZhdGUgaW5pdEVkaXRvcigpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG4gICAgICAgIGlmICghdGFyZ2V0IHx8ICF0aGlzLl9lZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzRWRpdG9ySW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pc0VkaXRvckluaXQgJiYgdGhpcy5fZWRpdG9yLmdldEVkaXRUZXJyYWluKCkgPT09IHRhcmdldCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0RWRpdFRlcnJhaW4odGFyZ2V0KTtcbiAgICAgICAgdGhpcy5faXNFZGl0b3JJbml0ID0gdHJ1ZTtcbiAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBhZGFwdGVyIGZvciBUZXJyYWluU2VydmljZS4gSXQgaW50ZW50aW9uYWxseSByZXR1cm5zIHBsYWluIGRhdGFcbiAgICAgKiBpbnN0ZWFkIG9mIGV4cG9zaW5nIHRoaXMgZ2l6bW8gb3IgaXRzIGVkaXRvciBpbnRlcm5hbHMgdG8gU2NlbmUgY2FsbGVycy5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVhZFRlcnJhaW5TdGF0ZSgpOiBJVGVycmFpbkVkaXRvclN0YXRlIHtcbiAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMucXVlcnlUZXJyYWluSW5mbygpID8/IHsgdGlsZVNpemU6IDAsIHdlaWdodE1hcFNpemU6IDAsIGxpZ2h0TWFwU2l6ZTogMCwgYmxvY2tDb3VudDogWzAsIDBdIGFzIFtudW1iZXIsIG51bWJlcl0gfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1hbmFnZToge1xuICAgICAgICAgICAgICAgIHRpbGVTaXplOiBpbmZvLnRpbGVTaXplLFxuICAgICAgICAgICAgICAgIHdlaWdodE1hcFNpemU6IGluZm8ud2VpZ2h0TWFwU2l6ZSxcbiAgICAgICAgICAgICAgICBsaWdodE1hcFNpemU6IGluZm8ubGlnaHRNYXBTaXplLFxuICAgICAgICAgICAgICAgIGJsb2NrQ291bnQ6IFtpbmZvLmJsb2NrQ291bnRbMF0gPz8gMCwgaW5mby5ibG9ja0NvdW50WzFdID8/IDBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxheWVyczogdGhpcy5nZXRMYXllcnMoKS5tYXAoKGxheWVyKSA9PiBsYXllciA/ICh7XG4gICAgICAgICAgICAgICAgZGV0YWlsTWFwVXVpZDogbGF5ZXIuZGV0YWlsTWFwLFxuICAgICAgICAgICAgICAgIG5vcm1hbE1hcFV1aWQ6IGxheWVyLm5vcm1hbE1hcCxcbiAgICAgICAgICAgICAgICBtZXRhbGxpYzogbGF5ZXIubWV0YWxsaWMsXG4gICAgICAgICAgICAgICAgcm91Z2huZXNzOiBsYXllci5yb3VnaG5lc3MsXG4gICAgICAgICAgICAgICAgdGlsZVNpemU6IGxheWVyLnRpbGVTaXplLFxuICAgICAgICAgICAgfSkgOiBudWxsKSxcbiAgICAgICAgICAgIG1vZGU6IHRoaXMuZ2V0VGVycmFpbk1vZGUoKSxcbiAgICAgICAgICAgIGN1cnJlbnRMYXllcjogdGhpcy5fZWRpdG9yLmdldEN1cnJlbnRMYXllcigpLFxuICAgICAgICAgICAgc2N1bHB0OiB7XG4gICAgICAgICAgICAgICAgdG9vbDogdGhpcy5nZXRUZXJyYWluU2N1bHB0VG9vbCgpLFxuICAgICAgICAgICAgICAgIGJydXNoOiB0aGlzLmdldFRlcnJhaW5CcnVzaFN0YXRlKGVUZXJyYWluRWRpdG9yTW9kZS5TQ1VMUFQpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhaW50OiB7XG4gICAgICAgICAgICAgICAgYnJ1c2g6IHRoaXMuZ2V0VGVycmFpbkJydXNoU3RhdGUoZVRlcnJhaW5FZGl0b3JNb2RlLlBBSU5UKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIHNldFRlcnJhaW5Nb2RlKG1vZGU6IFRlcnJhaW5FZGl0b3JNb2RlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGludGVybmFsTW9kZTogUmVjb3JkPFRlcnJhaW5FZGl0b3JNb2RlLCBlVGVycmFpbkVkaXRvck1vZGU+ID0ge1xuICAgICAgICAgICAgbWFuYWdlOiBlVGVycmFpbkVkaXRvck1vZGUuTUFOQUdFLFxuICAgICAgICAgICAgc2N1bHB0OiBlVGVycmFpbkVkaXRvck1vZGUuU0NVTFBULFxuICAgICAgICAgICAgcGFpbnQ6IGVUZXJyYWluRWRpdG9yTW9kZS5QQUlOVCxcbiAgICAgICAgICAgIGJsb2NrOiBlVGVycmFpbkVkaXRvck1vZGUuU0VMRUNULFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0TW9kZShpbnRlcm5hbE1vZGVbbW9kZV0pO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRUZXJyYWluQ3VycmVudExheWVyKGN1cnJlbnRMYXllcjogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjdXJyZW50TGF5ZXIpIHx8IGN1cnJlbnRMYXllciA8IC0xKSByZXR1cm47XG4gICAgICAgIGlmIChjdXJyZW50TGF5ZXIgPj0gMCAmJiAhdGhpcy50YXJnZXQ/LmdldExheWVyKGN1cnJlbnRMYXllcikpIHJldHVybjtcbiAgICAgICAgdGhpcy5fZWRpdG9yLnNldEN1cnJlbnRMYXllcihjdXJyZW50TGF5ZXIpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVUZXJyYWluU2N1bHB0U2Vzc2lvbihwYXRjaDogSVRlcnJhaW5TY3VscHRTZXNzaW9uUGF0Y2gpOiB2b2lkIHtcbiAgICAgICAgaWYgKHBhdGNoLnRvb2wpIHRoaXMuc2V0VGVycmFpblNjdWxwdFRvb2wocGF0Y2gudG9vbCk7XG4gICAgICAgIGlmIChwYXRjaC5icnVzaCkgdGhpcy51cGRhdGVUZXJyYWluQnJ1c2goZVRlcnJhaW5FZGl0b3JNb2RlLlNDVUxQVCwgcGF0Y2guYnJ1c2gpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVUZXJyYWluUGFpbnRTZXNzaW9uKHBhdGNoOiBJVGVycmFpblBhaW50U2Vzc2lvblBhdGNoKTogdm9pZCB7XG4gICAgICAgIGlmIChwYXRjaC5icnVzaCkgdGhpcy51cGRhdGVUZXJyYWluQnJ1c2goZVRlcnJhaW5FZGl0b3JNb2RlLlBBSU5ULCBwYXRjaC5icnVzaCk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRUZXJyYWluQmxvY2soKTogSVRlcnJhaW5CbG9ja0RhdGEgfCBudWxsIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ID0gdGhpcy5fZWRpdG9yLmdldE1vZGUoZVRlcnJhaW5FZGl0b3JNb2RlLlNFTEVDVCk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gc2VsZWN0LmdldEN1cnJlbnRCbG9ja0luZGV4KCk7XG4gICAgICAgIGlmICghaW5kZXgpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCB3ZWlnaHQgPSBzZWxlY3QuZ2V0Q3VycmVudFdlaWdodERhdGEoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluZGV4OiB7IHg6IGluZGV4WzBdLCB5OiBpbmRleFsxXSB9LFxuICAgICAgICAgICAgbGF5ZXJzOiBzZWxlY3QuZ2V0Q3VycmVudEJsb2NrTGF5ZXJTbG90cygpLFxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHQgPyB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHdlaWdodC53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHdlaWdodC5oZWlnaHQsXG4gICAgICAgICAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkod2VpZ2h0LmRhdGEpLFxuICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRUZXJyYWluTW9kZSgpOiBUZXJyYWluRWRpdG9yTW9kZSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fZWRpdG9yLmdldEN1cnJlbnRNb2RlVHlwZSgpKSB7XG4gICAgICAgICAgICBjYXNlIGVUZXJyYWluRWRpdG9yTW9kZS5NQU5BR0U6IHJldHVybiAnbWFuYWdlJztcbiAgICAgICAgICAgIGNhc2UgZVRlcnJhaW5FZGl0b3JNb2RlLlNDVUxQVDogcmV0dXJuICdzY3VscHQnO1xuICAgICAgICAgICAgY2FzZSBlVGVycmFpbkVkaXRvck1vZGUuUEFJTlQ6IHJldHVybiAncGFpbnQnO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuICdibG9jayc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFRlcnJhaW5TY3VscHRUb29sKCk6IFRlcnJhaW5TY3VscHRUb29sIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzU21vb3RoKSByZXR1cm4gJ3Ntb290aCc7XG4gICAgICAgIGlmICh0aGlzLl9pc0ZsYXR0ZW4pIHJldHVybiAnZmxhdHRlbic7XG4gICAgICAgIGlmICh0aGlzLl9pc1NldEhlaWdodCkgcmV0dXJuICdzZXQtaGVpZ2h0JztcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQ29uY2F2ZSA/ICdzdW5rZW4nIDogJ2J1bGdlJztcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFRlcnJhaW5TY3VscHRUb29sKHRvb2w6IFRlcnJhaW5TY3VscHRUb29sKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2lzQ29uY2F2ZSA9IHRvb2wgPT09ICdzdW5rZW4nO1xuICAgICAgICB0aGlzLl9pc1NoaWZ0RG93biA9IHRoaXMuX2lzQ29uY2F2ZTtcbiAgICAgICAgdGhpcy5faXNTbW9vdGggPSB0b29sID09PSAnc21vb3RoJztcbiAgICAgICAgdGhpcy5faXNGbGF0dGVuID0gdG9vbCA9PT0gJ2ZsYXR0ZW4nO1xuICAgICAgICB0aGlzLl9pc1NldEhlaWdodCA9IHRvb2wgPT09ICdzZXQtaGVpZ2h0JztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFRlcnJhaW5CcnVzaFN0YXRlKG1vZGU6IGVUZXJyYWluRWRpdG9yTW9kZS5TQ1VMUFQgfCBlVGVycmFpbkVkaXRvck1vZGUuUEFJTlQpOiBJVGVycmFpbkJydXNoU3RhdGUge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmdldFRlcnJhaW5CcnVzaEVkaXRvcihtb2RlKTtcbiAgICAgICAgY29uc3QgYnJ1c2ggPSBlZGl0b3IuZ2V0Q3VycmVudEJydXNoKCk7XG4gICAgICAgIGNvbnN0IGltYWdlID0gZWRpdG9yLmdldEJydXNoKFRlcnJhaW5CcnVzaFR5cGUuSU1BR0UpIGFzIFRlcnJhaW5JbWFnZUJydXNoO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogYnJ1c2ggPT09IGltYWdlID8gJ2ltYWdlJyA6ICdjaXJjbGUnLFxuICAgICAgICAgICAgaW1hZ2VVdWlkOiBpbWFnZS5pbWFnZT8uX3V1aWQgPz8gbnVsbCxcbiAgICAgICAgICAgIHJhZGl1czogYnJ1c2gucmFkaXVzLFxuICAgICAgICAgICAgc3RyZW5ndGg6IGJydXNoLnN0cmVuZ3RoLFxuICAgICAgICAgICAgcm90YXRpb246IGltYWdlLl9yb3RhdGlvbixcbiAgICAgICAgICAgIHNldEhlaWdodDogYnJ1c2guX3NldEhlaWdodCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVRlcnJhaW5CcnVzaChtb2RlOiBlVGVycmFpbkVkaXRvck1vZGUuU0NVTFBUIHwgZVRlcnJhaW5FZGl0b3JNb2RlLlBBSU5ULCBwYXRjaDogSVRlcnJhaW5CcnVzaFBhdGNoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZ2V0VGVycmFpbkJydXNoRWRpdG9yKG1vZGUpO1xuICAgICAgICBjb25zdCBpbWFnZSA9IGVkaXRvci5nZXRCcnVzaChUZXJyYWluQnJ1c2hUeXBlLklNQUdFKSBhcyBUZXJyYWluSW1hZ2VCcnVzaDtcbiAgICAgICAgY29uc3QgYnJ1c2ggPSBlZGl0b3IuZ2V0Q3VycmVudEJydXNoKCk7XG4gICAgICAgIGlmICh0eXBlb2YgcGF0Y2gucmFkaXVzID09PSAnbnVtYmVyJykgYnJ1c2gucmFkaXVzID0gcGF0Y2gucmFkaXVzO1xuICAgICAgICBpZiAodHlwZW9mIHBhdGNoLnN0cmVuZ3RoID09PSAnbnVtYmVyJykgYnJ1c2guc3RyZW5ndGggPSBwYXRjaC5zdHJlbmd0aDtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXRjaC5yb3RhdGlvbiA9PT0gJ251bWJlcicpIGltYWdlLl9yb3RhdGlvbiA9IHBhdGNoLnJvdGF0aW9uO1xuICAgICAgICBpZiAodHlwZW9mIHBhdGNoLnNldEhlaWdodCA9PT0gJ251bWJlcicpIGJydXNoLl9zZXRIZWlnaHQgPSBwYXRjaC5zZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRUZXJyYWluQnJ1c2hFZGl0b3IobW9kZTogZVRlcnJhaW5FZGl0b3JNb2RlLlNDVUxQVCB8IGVUZXJyYWluRWRpdG9yTW9kZS5QQUlOVCk6IFRlcnJhaW5FZGl0b3JTY3VscHQgfCBUZXJyYWluRWRpdG9yUGFpbnQge1xuICAgICAgICByZXR1cm4gbW9kZSA9PT0gZVRlcnJhaW5FZGl0b3JNb2RlLlNDVUxQVFxuICAgICAgICAgICAgPyB0aGlzLl9lZGl0b3IuZ2V0TW9kZShlVGVycmFpbkVkaXRvck1vZGUuU0NVTFBUKVxuICAgICAgICAgICAgOiB0aGlzLl9lZGl0b3IuZ2V0TW9kZShlVGVycmFpbkVkaXRvck1vZGUuUEFJTlQpO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZExheWVyQnlVdWlkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0KSByZXR1cm4gLTE7XG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSBhd2FpdCBsb2FkQW55PGFueT4odXVpZCk7XG4gICAgICAgIGNvbnN0IGxheWVyID0gbmV3IFRlcnJhaW5MYXllcigpOyBsYXllci5kZXRhaWxNYXAgPSB0ZXh0dXJlOyBsYXllci50aWxlU2l6ZSA9IDE7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy50YXJnZXQuYWRkTGF5ZXIobGF5ZXIpOyB0aGlzLnVwZGF0ZVRlcnJhaW5Bc3NldCgpOyB0aGlzLmlzVGVycmFpbkNoYW5nZSA9IHRydWU7IHRoaXMuZW1pdE5vZGVDaGFuZ2UoKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTsgcmV0dXJuIGluZGV4O1xuICAgIH1cblxuICAgIC8qKiBBcHBsaWVzIGEgc2VydmljZS12YWxpZGF0ZWQgU2N1bHB0IGJydXNoIHRleHR1cmUgd2l0aG91dCBjaGFuZ2luZyBUZXJyYWluIGFzc2V0IHN0YXRlLiAqL1xuICAgIHB1YmxpYyBzZXRTY3VscHRCcnVzaFRleHR1cmUodGV4dHVyZTogVGV4dHVyZTJEIHwgbnVsbCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzY3VscHQgPSB0aGlzLmdldFRlcnJhaW5CcnVzaEVkaXRvcihlVGVycmFpbkVkaXRvck1vZGUuU0NVTFBUKTtcbiAgICAgICAgc2N1bHB0LnNldEJydXNoSW1hZ2UodGV4dHVyZSk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqIEFwcGxpZXMgYSBzZXJ2aWNlLXZhbGlkYXRlZCBQYWludCBicnVzaCB0ZXh0dXJlIHdpdGhvdXQgY2hhbmdpbmcgVGVycmFpbiBhc3NldCBzdGF0ZS4gKi9cbiAgICBwdWJsaWMgc2V0UGFpbnRCcnVzaFRleHR1cmUodGV4dHVyZTogVGV4dHVyZTJEIHwgbnVsbCk6IHZvaWQge1xuICAgICAgICBjb25zdCBwYWludCA9IHRoaXMuZ2V0VGVycmFpbkJydXNoRWRpdG9yKGVUZXJyYWluRWRpdG9yTW9kZS5QQUlOVCk7XG4gICAgICAgIHBhaW50LnNldEJydXNoSW1hZ2UodGV4dHVyZSk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuICAgIGFzeW5jIHNldFNjdWxwdEJydXNoUm90YXRpb24ocm90YXRpb246IG51bWJlcikge1xuICAgICAgICAodGhpcy5fZWRpdG9yLmdldE1vZGUoZVRlcnJhaW5FZGl0b3JNb2RlLlNDVUxQVCkgYXMgYW55KS5zZXRTY3VscHRCcnVzaFJvdGF0aW9uKHJvdGF0aW9uKTtcbiAgICB9XG4gICAgYXN5bmMgc2V0TGF5ZXJWYWx1ZShpbmRleDogbnVtYmVyLCB1dWlkOiBzdHJpbmcsIGV4dFZhbDogYW55KSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMudGFyZ2V0LmdldExheWVyKGluZGV4KTsgaWYgKCFsYXllcikgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmIChleHRWYWwpIHtcbiAgICAgICAgICAgIGlmICgndGlsZVNpemUnIGluIGV4dFZhbCkgbGF5ZXIudGlsZVNpemUgPSBleHRWYWwudGlsZVNpemU7XG4gICAgICAgICAgICBpZiAoJ21ldGFsbGljJyBpbiBleHRWYWwpIGxheWVyLm1ldGFsbGljID0gZXh0VmFsLm1ldGFsbGljO1xuICAgICAgICAgICAgaWYgKCdyb3VnaG5lc3MnIGluIGV4dFZhbCkgbGF5ZXIucm91Z2huZXNzID0gZXh0VmFsLnJvdWdobmVzcztcbiAgICAgICAgICAgIGlmICgnbm9ybWFsTWFwJyBpbiBleHRWYWwpIGxheWVyLm5vcm1hbE1hcCA9IGV4dFZhbC5ub3JtYWxNYXAgPyBhd2FpdCBsb2FkQW55PGFueT4oZXh0VmFsLm5vcm1hbE1hcCkgOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1dWlkKSBsYXllci5kZXRhaWxNYXAgPSBhd2FpdCBsb2FkQW55PGFueT4odXVpZCk7XG4gICAgICAgIHRoaXMudXBkYXRlVGVycmFpbkFzc2V0KCk7IHRoaXMuaXNUZXJyYWluQ2hhbmdlID0gdHJ1ZTsgdGhpcy5lbWl0Tm9kZUNoYW5nZSgpOyBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIHJlbW92ZUxheWVyQnlJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHJldHVybjtcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlTGF5ZXIoaW5kZXgpOyB0aGlzLnVwZGF0ZVRlcnJhaW5Bc3NldCgpOyB0aGlzLmlzVGVycmFpbkNoYW5nZSA9IHRydWU7IHRoaXMuZW1pdE5vZGVDaGFuZ2UoKTsgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG4gICAgc2V0Q3VycmVudEVkaXRMYXllcihpbmRleDogbnVtYmVyKSB7IHRoaXMuX2VkaXRvci5zZXRDdXJyZW50TGF5ZXIoaW5kZXgpOyBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpOyB9XG4gICAgZ2V0TGF5ZXJzKCkge1xuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0KSByZXR1cm4gW107XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHsgbGVuZ3RoOiBURVJSQUlOX01BWF9MQVlFUl9DT1VOVCB9LCAoXywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy50YXJnZXQhLmdldExheWVyKGluZGV4KTtcbiAgICAgICAgICAgIHJldHVybiBsYXllciA/IHtcbiAgICAgICAgICAgICAgICBkZXRhaWxNYXA6IGxheWVyLmRldGFpbE1hcD8uX3V1aWQgPz8gbnVsbCwgbWV0YWxsaWM6IGxheWVyLm1ldGFsbGljLFxuICAgICAgICAgICAgICAgIG5vcm1hbE1hcDogbGF5ZXIubm9ybWFsTWFwPy5fdXVpZCA/PyBudWxsLCByb3VnaG5lc3M6IGxheWVyLnJvdWdobmVzcywgdGlsZVNpemU6IGxheWVyLnRpbGVTaXplLFxuICAgICAgICAgICAgfSA6IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRDdXJyZW50RWRpdExheWVyKCkgeyByZXR1cm4gdGhpcy5fZWRpdG9yLmdldEN1cnJlbnRMYXllcigpOyB9XG4gICAgc2V0Q3VycmVudEVkaXRNb2RlKG1vZGU6IGVUZXJyYWluRWRpdG9yTW9kZSwgb3B0aW9uPzogYW55KSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IE9iamVjdC5hc3NpZ24oeyBpc1NjdWxwdERvd246IGZhbHNlLCBpc1Ntb290aDogZmFsc2UsIGlzRmxhdHRlbjogZmFsc2UsIGlzU2V0SGVpZ2h0OiBmYWxzZSB9LCBvcHRpb24gfHwge30pO1xuICAgICAgICB0aGlzLl9pc0NvbmNhdmUgPSB0aGlzLl9pc1NoaWZ0RG93biA9ICEhY29uZmlnLmlzU2N1bHB0RG93bjsgdGhpcy5faXNTbW9vdGggPSAhIWNvbmZpZy5pc1Ntb290aDtcbiAgICAgICAgdGhpcy5faXNGbGF0dGVuID0gISFjb25maWcuaXNGbGF0dGVuOyB0aGlzLl9pc1NldEhlaWdodCA9ICEhY29uZmlnLmlzU2V0SGVpZ2h0O1xuICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0TW9kZShtb2RlKTsgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG4gICAgcXVlcnlUZXJyYWluSW5mbygpOiBJVGVycmFpbkluZm8gfCBudWxsIHtcbiAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMudGFyZ2V0Py5pbmZvOyByZXR1cm4gaW5mbyA/IHtcbiAgICAgICAgICAgIHRpbGVTaXplOiBpbmZvLnRpbGVTaXplLCB3ZWlnaHRNYXBTaXplOiBpbmZvLndlaWdodE1hcFNpemUsIGxpZ2h0TWFwU2l6ZTogaW5mby5saWdodE1hcFNpemUsIGJsb2NrQ291bnQ6IFsuLi5pbmZvLmJsb2NrQ291bnRdLFxuICAgICAgICB9IDogbnVsbDtcbiAgICB9XG4gICAgY2hhbmdlVGVycmFpbkluZm8oaW5mbzogYW55KSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHJldHVybjtcbiAgICAgICAgY29uc3QgdGVycmFpbkluZm8gPSBuZXcgVGVycmFpbkluZm8oKTsgT2JqZWN0LmFzc2lnbih0ZXJyYWluSW5mbywgaW5mbyk7IHRoaXMudGFyZ2V0LnJlYnVpbGQodGVycmFpbkluZm8pO1xuICAgICAgICB0aGlzLmlzVGVycmFpbkNoYW5nZSA9IHRydWU7IHRoaXMuZW1pdE5vZGVDaGFuZ2UoKTsgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG4gICAgcXVlcnlCcnVzaE9mTW9kZShtb2RlOiBlVGVycmFpbkVkaXRvck1vZGUpOiBJQnJ1c2ggfCBudWxsIHtcbiAgICAgICAgaWYgKG1vZGUgIT09IGVUZXJyYWluRWRpdG9yTW9kZS5TQ1VMUFQgJiYgbW9kZSAhPT0gZVRlcnJhaW5FZGl0b3JNb2RlLlBBSU5UKSByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgYnJ1c2ggPSAodGhpcy5fZWRpdG9yLmdldE1vZGUobW9kZSkgYXMgYW55KS5nZXRDdXJyZW50QnJ1c2goKTtcbiAgICAgICAgcmV0dXJuIHsgcmFkaXVzOiBicnVzaC5yYWRpdXMsIHN0cmVuZ3RoOiBicnVzaC5zdHJlbmd0aCwgX3NldEhlaWdodDogYnJ1c2guX3NldEhlaWdodCB9O1xuICAgIH1cbiAgICBzZXRCcnVzaE9mTW9kZShtb2RlOiBlVGVycmFpbkVkaXRvck1vZGUsIHNldHRpbmc6IGFueSkge1xuICAgICAgICBpZiAobW9kZSAhPT0gZVRlcnJhaW5FZGl0b3JNb2RlLlNDVUxQVCAmJiBtb2RlICE9PSBlVGVycmFpbkVkaXRvck1vZGUuUEFJTlQpIHJldHVybjtcbiAgICAgICAgY29uc3QgYnJ1c2ggPSAodGhpcy5fZWRpdG9yLmdldE1vZGUobW9kZSkgYXMgYW55KS5nZXRDdXJyZW50QnJ1c2goKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoc2V0dGluZyB8fCB7fSkpIGlmIChrZXkgIT09ICdtYXRlcmlhbCcgJiYgc2V0dGluZ1trZXldICE9PSB1bmRlZmluZWQpIGJydXNoW2tleV0gPSBzZXR0aW5nW2tleV07XG4gICAgfVxuICAgIGdldEJsb2NrSW5mbygpIHtcbiAgICAgICAgY29uc3QgbW9kZSA9IHRoaXMuX2VkaXRvci5nZXRNb2RlKGVUZXJyYWluRWRpdG9yTW9kZS5TRUxFQ1QpOyBjb25zdCBpbmRleCA9IG1vZGUuZ2V0Q3VycmVudEJsb2NrSW5kZXgoKSA/PyBbMCwgMF07XG4gICAgICAgIGNvbnN0IHdlaWdodCA9IG1vZGUuZ2V0Q3VycmVudFdlaWdodERhdGEoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluZGV4OiB7IHg6IGluZGV4WzBdLCB5OiBpbmRleFsxXSB9LFxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHQgPyB7IGRhdGE6IEFycmF5LmZyb20od2VpZ2h0LmRhdGEpLCB3aWR0aDogd2VpZ2h0LndpZHRoLCBoZWlnaHQ6IHdlaWdodC5oZWlnaHQgfSA6IG51bGwsXG4gICAgICAgICAgICBsYXllcnM6IG1vZGUuZ2V0Q3VycmVudExheWVyTGlzdCgpLm1hcCgobGF5ZXI6IGFueSkgPT4gbGF5ZXI/Ll91dWlkID8/ICcnKSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZW1pdE5vZGVDaGFuZ2UoKSB7IGlmICh0aGlzLnRhcmdldCkgdGhpcy5vbkNvbXBvbmVudENoYW5nZWQodGhpcy50YXJnZXQubm9kZSk7IH1cbiAgICBvbktleURvd24oZXZlbnQ6IGFueSkgeyBpZiAoZXZlbnQuc2hpZnRLZXkpIHRoaXMuX2lzU2hpZnREb3duID0gdHJ1ZTsgfVxuICAgIG9uS2V5VXAoZXZlbnQ6IGFueSkgeyBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTYpIHRoaXMuX2lzU2hpZnREb3duID0gdGhpcy5faXNDb25jYXZlOyB9XG4gICAgb25VcGRhdGUoZGVsdGFUaW1lOiBudW1iZXIpIHsgdGhpcy5fZWRpdG9yPy51cGRhdGUoZGVsdGFUaW1lLCB0aGlzLl9pc1NoaWZ0RG93bik7IH1cbiAgICBvbkNhbWVyYUNvbnRyb2xNb2RlQ2hhbmdlZChtb2RlOiBudW1iZXIpIHsgaWYgKG1vZGUgIT09IDAgJiYgdGhpcy5fZWRpdG9yPy5pc0NoYW5nZWQpIHRoaXMuZW1pdE5vZGVDaGFuZ2UoKTsgfVxuICAgIHVwZGF0ZVRlcnJhaW5Bc3NldCgpIHsgaWYgKHRoaXMudGFyZ2V0Py5fYXNzZXQpIHRoaXMudGFyZ2V0LmV4cG9ydExheWVyTGlzdFRvQXNzZXQodGhpcy50YXJnZXQuX2Fzc2V0KTsgfVxuXG4gICAgcHVibGljIG9uQ29udHJvbGxlck1vdXNlRG93bihldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7IGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7IHRoaXMuX2lzU2hpZnREb3duID0gZXZlbnQuc2hpZnRLZXk7IHRoaXMuX2VkaXRvci5vbk1vdXNlRG93bihldmVudC54LCBldmVudC55KTsgfVxuICAgIHB1YmxpYyBvbkNvbnRyb2xsZXJNb3VzZU1vdmUoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkgeyBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlOyB0aGlzLl9lZGl0b3Iub25Nb3VzZU1vdmUoZXZlbnQueCwgZXZlbnQueSk7IH1cbiAgICBwdWJsaWMgb25Db250cm9sbGVyTW91c2VVcChldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7IGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7IGlmICh0aGlzLl9lZGl0b3IuaXNDaGFuZ2VkKSB0aGlzLmVtaXROb2RlQ2hhbmdlKCk7IHRoaXMuX2VkaXRvci5vbk1vdXNlVXAoKTsgfVxuICAgIHB1YmxpYyBvbkNvbnRyb2xsZXJIb3Zlck91dCgpIHsgdGhpcy5fZWRpdG9yLm9uSG92ZXJPdXQoKTsgfVxufVxuIl19