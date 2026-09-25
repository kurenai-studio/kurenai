"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainService = void 0;
const cc_1 = require("cc");
const core_1 = require("./core");
const global_events_1 = require("./core/global-events");
const editor_node_1 = require("./gizmo/utils/editor-node");
const node_create_1 = require("./node/node-create");
const scene_asset_binary_client_1 = require("../scene-asset-binary-client");
const terrainEditorModes = new Set(['manage', 'sculpt', 'paint', 'block']);
const terrainSculptTools = new Set([
    'bulge', 'sunken', 'smooth', 'flatten', 'set-height',
]);
function copyTarget(target) {
    return { nodeUuid: target.nodeUuid, componentUuid: target.componentUuid };
}
function isTerrainTarget(value) {
    if (!value || typeof value !== 'object')
        return false;
    const target = value;
    return typeof target.nodeUuid === 'string' && target.nodeUuid.length > 0
        && typeof target.componentUuid === 'string' && target.componentUuid.length > 0;
}
function isTerrainSessionGizmo(value) {
    if (!value || typeof value !== 'object')
        return false;
    const gizmo = value;
    return 'target' in gizmo
        && typeof gizmo.readTerrainState === 'function'
        && typeof gizmo.setTerrainMode === 'function'
        && typeof gizmo.setTerrainCurrentLayer === 'function'
        && typeof gizmo.updateTerrainSculptSession === 'function'
        && typeof gizmo.setSculptBrushTexture === 'function'
        && typeof gizmo.setPaintBrushTexture === 'function'
        && typeof gizmo.updateTerrainPaintSession === 'function'
        && typeof gizmo.readTerrainBlock === 'function';
}
function normalizeBrushPatch(value) {
    if (!value || typeof value !== 'object')
        return undefined;
    const source = value;
    const patch = {};
    for (const key of ['radius', 'strength', 'rotation', 'setHeight']) {
        if (typeof source[key] === 'number' && Number.isFinite(source[key]))
            patch[key] = source[key];
    }
    return Object.keys(patch).length ? patch : undefined;
}
function normalizeSculptPatch(value) {
    if (!value || typeof value !== 'object')
        return undefined;
    const source = value;
    const patch = {};
    if (source.tool && terrainSculptTools.has(source.tool))
        patch.tool = source.tool;
    const brush = normalizeBrushPatch(source.brush);
    if (brush)
        patch.brush = brush;
    return Object.keys(patch).length ? patch : undefined;
}
function normalizePaintPatch(value) {
    if (!value || typeof value !== 'object')
        return undefined;
    const brush = normalizeBrushPatch(value.brush);
    return brush ? { brush } : undefined;
}
function copyManageState(value) {
    return {
        tileSize: value.tileSize,
        weightMapSize: value.weightMapSize,
        lightMapSize: value.lightMapSize,
        blockCount: [value.blockCount[0], value.blockCount[1]],
    };
}
function copyLayerState(value) {
    return {
        detailMapUuid: value.detailMapUuid,
        normalMapUuid: value.normalMapUuid,
        metallic: value.metallic,
        roughness: value.roughness,
        tileSize: value.tileSize,
    };
}
function copyLayerStates(values) {
    return values.map((value) => value ? copyLayerState(value) : null);
}
function isFinitePositive(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
function isPositiveInteger(value, maximum = Number.MAX_SAFE_INTEGER) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= maximum;
}
function isUuidOrNull(value) {
    return value === null || (typeof value === 'string' && value.length > 0);
}
function normalizeManageState(value) {
    if (!value || typeof value !== 'object')
        return null;
    const source = value;
    if (!isFinitePositive(source.tileSize)
        || !isPositiveInteger(source.weightMapSize, 0x7fff)
        || !isPositiveInteger(source.lightMapSize, 0x7fff)
        || !Array.isArray(source.blockCount)
        || source.blockCount.length !== 2
        || !isPositiveInteger(source.blockCount[0])
        || !isPositiveInteger(source.blockCount[1])) {
        return null;
    }
    return {
        tileSize: source.tileSize,
        weightMapSize: source.weightMapSize,
        lightMapSize: source.lightMapSize,
        blockCount: [source.blockCount[0], source.blockCount[1]],
    };
}
function normalizeLayerState(value) {
    if (!value || typeof value !== 'object')
        return null;
    const source = value;
    const { detailMapUuid, normalMapUuid, metallic, roughness, tileSize } = source;
    if (!isUuidOrNull(detailMapUuid)
        || !isUuidOrNull(normalMapUuid)
        || typeof metallic !== 'number' || !Number.isFinite(metallic)
        || typeof roughness !== 'number' || !Number.isFinite(roughness)
        || !isFinitePositive(tileSize)) {
        return null;
    }
    return { detailMapUuid, normalMapUuid, metallic, roughness, tileSize };
}
function normalizeLayerPatch(value) {
    if (!value || typeof value !== 'object')
        return null;
    const source = value;
    const patch = {};
    for (const key of ['detailMapUuid', 'normalMapUuid']) {
        if (!Object.hasOwn(source, key))
            continue;
        if (!isUuidOrNull(source[key]))
            return null;
        patch[key] = source[key];
    }
    for (const key of ['metallic', 'roughness']) {
        if (!Object.hasOwn(source, key))
            continue;
        if (!Number.isFinite(source[key]))
            return null;
        patch[key] = source[key];
    }
    if (Object.hasOwn(source, 'tileSize')) {
        if (!isFinitePositive(source.tileSize))
            return null;
        patch.tileSize = source.tileSize;
    }
    return Object.keys(patch).length ? patch : null;
}
function statesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
/**
 * Terrain asset lifecycle and target-safe editor-session access.
 *
 * The public Terrain capability never exposes gizmos. This service validates the
 * requested node/component pair, adapts the matching internal gizmo, and returns
 * canonical snapshots for direct Scene-webview access.
 */
let TerrainService = class TerrainService extends core_1.BaseService {
    name = 'cc.Terrain';
    editedComponents = [];
    selectedComponents = [];
    _terrainUndoSequence = 0;
    init() {
        // SelectionService broadcasts paths, while the old manager received node UUIDs.
        // Keep both entry points so pink can use either protocol.
        global_events_1.ServiceEvents.on('selection:select', (path) => this.onSelectionSelect(path));
        global_events_1.ServiceEvents.on('selection:unselect', (path) => this.onSelectionUnselect(path));
        global_events_1.ServiceEvents.on('selection:clear', () => this.onSelectionClear());
    }
    isTerrainComponent(component) {
        return component instanceof cc_1.Terrain || component?.__classname__ === 'cc.Terrain';
    }
    terrainOfNode(node) {
        return node?.components?.find((component) => this.isTerrainComponent(component)) ?? null;
    }
    terrainOfUuid(uuid) {
        return this.terrainOfNode((0, editor_node_1.getEditorNodeByUuid)(uuid));
    }
    resolveTarget(target) {
        if (!isTerrainTarget(target))
            return null;
        const node = (0, editor_node_1.getEditorNodeByUuid)(target.nodeUuid);
        const component = node?.components?.find((candidate) => candidate.uuid === target.componentUuid
            && this.isTerrainComponent(candidate));
        if (!component || component.node !== node || !this.selectedComponents.includes(component))
            return null;
        const gizmoService = (0, core_1.queryRegisteredService)('Gizmo');
        const gizmo = gizmoService?.getComponentGizmo(component);
        if (!isTerrainSessionGizmo(gizmo) || gizmo.target !== component)
            return null;
        return { component, gizmo };
    }
    invalidResult(target) {
        return { target: copyTarget(target), valid: false };
    }
    /** Returns only the public UUID of the persisted Terrain asset, never the engine asset object. */
    getTerrainAssetUuid(component) {
        const uuid = component?._asset?.uuid;
        return typeof uuid === 'string' && uuid.length > 0 ? uuid : null;
    }
    readResolved(target, gizmo) {
        return {
            target: copyTarget(target),
            valid: true,
            assetUuid: this.getTerrainAssetUuid(gizmo.target),
            ...gizmo.readTerrainState(),
        };
    }
    /** Returns a canonical snapshot or `valid: false`; it never falls back to another Terrain. */
    read(target) {
        if (!isTerrainTarget(target))
            return { target: { nodeUuid: '', componentUuid: '' }, valid: false };
        const resolved = this.resolveTarget(target);
        return resolved ? this.readResolved(target, resolved.gizmo) : this.invalidResult(target);
    }
    setMode(target, mode) {
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        if (!terrainEditorModes.has(mode))
            return this.readResolved(target, resolved.gizmo);
        resolved.gizmo.setTerrainMode(mode);
        this.emit('terrain:session-changed', copyTarget(target));
        return this.read(target);
    }
    setCurrentLayer(target, currentLayer) {
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        if (!Number.isInteger(currentLayer) || currentLayer < -1)
            return this.readResolved(target, resolved.gizmo);
        resolved.gizmo.setTerrainCurrentLayer(currentLayer);
        this.emit('terrain:session-changed', copyTarget(target));
        return this.read(target);
    }
    setSculptSession(target, patch) {
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const normalized = normalizeSculptPatch(patch);
        if (!normalized)
            return this.readResolved(target, resolved.gizmo);
        resolved.gizmo.updateTerrainSculptSession(normalized);
        this.emit('terrain:session-changed', copyTarget(target));
        return this.read(target);
    }
    /** Assigns a validated Texture2D asset to Sculpt, or clears it to restore the circle brush, without creating Scene Undo. */
    async setSculptBrushAsset(target, assetUuid) {
        return this.setBrushAsset(target, assetUuid, 'sculpt brush', (gizmo, texture) => gizmo.setSculptBrushTexture(texture));
    }
    /** Assigns a validated Texture2D asset to Paint, or clears it to restore the circle brush, without creating Scene Undo. */
    async setPaintBrushAsset(target, assetUuid) {
        return this.setBrushAsset(target, assetUuid, 'paint brush', (gizmo, texture) => gizmo.setPaintBrushTexture(texture));
    }
    async setBrushAsset(target, assetUuid, usage, apply) {
        if (assetUuid !== null && (typeof assetUuid !== 'string' || assetUuid.length === 0)) {
            return this.read(target);
        }
        const initial = this.resolveTarget(target);
        if (!initial)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const texture = assetUuid === null ? null : await this.loadTerrainTexture(assetUuid, usage);
        if (assetUuid !== null && !texture)
            return this.read(target);
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        apply(resolved.gizmo, texture);
        this.emit('terrain:session-changed', copyTarget(target));
        return this.read(target);
    }
    setPaintSession(target, patch) {
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const normalized = normalizePaintPatch(patch);
        if (!normalized)
            return this.readResolved(target, resolved.gizmo);
        resolved.gizmo.updateTerrainPaintSession(normalized);
        this.emit('terrain:session-changed', copyTarget(target));
        return this.read(target);
    }
    /** Reads the currently inspected block only; no Terrain mutation or Undo occurs. */
    readBlock(target) {
        if (!isTerrainTarget(target))
            return { target: { nodeUuid: '', componentUuid: '' }, valid: false };
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return this.invalidResult(target);
        return { target: copyTarget(target), valid: true, block: resolved.gizmo.readTerrainBlock() };
    }
    /** Commits a full Manage draft as one CLI-owned Terrain mutation and Undo command. */
    async saveManage(target, manage) {
        const next = normalizeManageState(manage);
        if (!next)
            return this.read(target);
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const undoService = this.getTerrainUndoService();
        if (!undoService)
            return this.readResolved(target, resolved.gizmo);
        const before = copyManageState(resolved.gizmo.readTerrainState().manage);
        if (statesEqual(before, next))
            return this.readResolved(target, resolved.gizmo);
        if (!this.applyTerrainManageState(resolved.component, next))
            return this.read(target);
        const result = this.read(target);
        if (!result.valid)
            return result;
        const after = copyManageState(result.manage);
        this.pushTerrainUndo(undoService, resolved.component, 'Save Terrain Manage', 'terrain:save-manage', () => this.applyTerrainManageState(resolved.component, before), () => this.applyTerrainManageState(resolved.component, after));
        return result;
    }
    /** Adds one complete layer; incompatible or unavailable textures leave Terrain untouched. */
    async addLayer(target, layer) {
        const next = normalizeLayerState(layer);
        if (!next || !next.detailMapUuid)
            return this.read(target);
        const initial = this.resolveTarget(target);
        if (!initial)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const undoService = this.getTerrainUndoService();
        if (!undoService)
            return this.readResolved(target, initial.gizmo);
        const assets = await this.loadLayerAssets(next);
        if (!assets?.detailMap)
            return this.read(target);
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const before = copyLayerStates(resolved.gizmo.readTerrainState().layers);
        if (!this.addTerrainLayer(resolved.component, next, assets))
            return this.read(target);
        const result = this.read(target);
        if (!result.valid)
            return result;
        const after = copyLayerStates(result.layers);
        this.pushTerrainUndo(undoService, resolved.component, 'Add Terrain Layer', 'terrain:add-layer', () => this.applyTerrainLayerStates(resolved.component, before), () => this.applyTerrainLayerStates(resolved.component, after));
        return result;
    }
    /** Removes a single layer slot as one CLI-owned Terrain mutation and Undo command. */
    async removeLayer(target, index) {
        if (!this.isLayerIndex(index))
            return this.read(target);
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const undoService = this.getTerrainUndoService();
        if (!undoService)
            return this.readResolved(target, resolved.gizmo);
        const before = copyLayerStates(resolved.gizmo.readTerrainState().layers);
        if (!this.removeTerrainLayer(resolved.component, index))
            return this.read(target);
        const result = this.read(target);
        if (!result.valid)
            return result;
        const after = copyLayerStates(result.layers);
        this.pushTerrainUndo(undoService, resolved.component, 'Remove Terrain Layer', 'terrain:remove-layer', () => this.applyTerrainLayerStates(resolved.component, before), () => this.applyTerrainLayerStates(resolved.component, after));
        return result;
    }
    /** Updates one layer slot; texture references are resolved before the target can mutate. */
    async updateLayer(target, index, patch) {
        if (!this.isLayerIndex(index))
            return this.read(target);
        const next = normalizeLayerPatch(patch);
        if (!next)
            return this.read(target);
        const initial = this.resolveTarget(target);
        if (!initial)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const undoService = this.getTerrainUndoService();
        if (!undoService)
            return this.readResolved(target, initial.gizmo);
        const assets = await this.loadLayerAssets(next);
        if (!assets)
            return this.read(target);
        const resolved = this.resolveTarget(target);
        if (!resolved)
            return isTerrainTarget(target) ? this.invalidResult(target) : this.read(target);
        const before = copyLayerStates(resolved.gizmo.readTerrainState().layers);
        if (!this.updateTerrainLayer(resolved.component, index, next, assets))
            return this.read(target);
        const result = this.read(target);
        if (!result.valid)
            return result;
        const after = copyLayerStates(result.layers);
        this.pushTerrainUndo(undoService, resolved.component, 'Update Terrain Layer', 'terrain:update-layer', () => this.applyTerrainLayerStates(resolved.component, before), () => this.applyTerrainLayerStates(resolved.component, after));
        return result;
    }
    isLayerIndex(index) {
        return Number.isInteger(index) && index >= 0 && index < cc_1.TERRAIN_MAX_LAYER_COUNT;
    }
    isAttachedTerrain(component) {
        return this.isTerrainComponent(component)
            && component.isValid !== false
            && Array.isArray(component.node?.components)
            && component.node.components.includes(component);
    }
    createTerrainInfo(state) {
        const info = new cc_1.TerrainInfo();
        info.tileSize = state.tileSize;
        info.weightMapSize = state.weightMapSize;
        info.lightMapSize = state.lightMapSize;
        info.blockCount = [state.blockCount[0], state.blockCount[1]];
        return info;
    }
    createTerrainLayer(state, assets) {
        const layer = new cc_1.TerrainLayer();
        layer.detailMap = assets.detailMap ?? null;
        layer.normalMap = assets.normalMap ?? null;
        layer.metallic = state.metallic;
        layer.roughness = state.roughness;
        layer.tileSize = state.tileSize;
        return layer;
    }
    async loadTerrainTexture(uuid, usage = 'layer') {
        try {
            const texture = await (0, node_create_1.loadAny)(uuid);
            return texture instanceof cc_1.Texture2D ? texture : null;
        }
        catch (error) {
            console.warn(`[Terrain] load ${usage} texture failed: ${uuid}`, error);
            return null;
        }
    }
    async loadLayerAssets(value) {
        const assets = {};
        for (const key of ['detailMapUuid', 'normalMapUuid']) {
            if (!Object.hasOwn(value, key))
                continue;
            const uuid = value[key];
            const assetKey = key === 'detailMapUuid' ? 'detailMap' : 'normalMap';
            if (uuid === null) {
                assets[assetKey] = null;
                continue;
            }
            if (typeof uuid !== 'string')
                return null;
            const texture = await this.loadTerrainTexture(uuid);
            if (!texture)
                return null;
            assets[assetKey] = texture;
        }
        return assets;
    }
    applyTerrainManageState(component, state) {
        if (!this.isAttachedTerrain(component))
            return false;
        component.rebuild(this.createTerrainInfo(state));
        this.reportTerrainAuthoringChange(component);
        return true;
    }
    addTerrainLayer(component, state, assets) {
        if (!this.isAttachedTerrain(component) || !assets.detailMap)
            return false;
        if (component.addLayer(this.createTerrainLayer(state, assets)) < 0)
            return false;
        this.reportTerrainAuthoringChange(component);
        return true;
    }
    removeTerrainLayer(component, index) {
        if (!this.isAttachedTerrain(component) || !component.getLayer(index))
            return false;
        component.removeLayer(index);
        this.reportTerrainAuthoringChange(component);
        return true;
    }
    updateTerrainLayer(component, index, patch, assets) {
        if (!this.isAttachedTerrain(component))
            return false;
        const layer = component.getLayer(index);
        if (!layer)
            return false;
        if (Object.hasOwn(patch, 'detailMapUuid'))
            layer.detailMap = assets.detailMap ?? null;
        if (Object.hasOwn(patch, 'normalMapUuid'))
            layer.normalMap = assets.normalMap ?? null;
        if (typeof patch.metallic === 'number')
            layer.metallic = patch.metallic;
        if (typeof patch.roughness === 'number')
            layer.roughness = patch.roughness;
        if (typeof patch.tileSize === 'number')
            layer.tileSize = patch.tileSize;
        this.reportTerrainAuthoringChange(component);
        return true;
    }
    async applyTerrainLayerStates(component, states) {
        const loaded = await Promise.all(states.map(async (state) => {
            if (!state)
                return null;
            const assets = await this.loadLayerAssets(state);
            return assets ? { state, assets } : undefined;
        }));
        if (loaded.some((value, index) => states[index] !== null && value === undefined) || !this.isAttachedTerrain(component)) {
            return false;
        }
        for (let index = 0; index < cc_1.TERRAIN_MAX_LAYER_COUNT; index++) {
            const layer = loaded[index];
            if (layer)
                component.setLayer(index, this.createTerrainLayer(layer.state, layer.assets));
            else
                component.removeLayer(index);
        }
        this.reportTerrainAuthoringChange(component);
        return true;
    }
    reportTerrainAuthoringChange(component) {
        if (component._asset)
            component.exportLayerListToAsset(component._asset);
        this.setDirty(component, true);
        global_events_1.ServiceEvents.emit('node:change', component.node, { type: 'component-changed' });
        (0, core_1.queryRegisteredService)('Engine')?.repaintInEditMode();
    }
    getTerrainUndoService() {
        const undoService = (0, core_1.queryRegisteredService)('Undo');
        return undoService && !undoService.isApplying() ? undoService : null;
    }
    pushTerrainUndo(undoService, component, label, type, undo, redo) {
        const id = `${type}:${++this._terrainUndoSequence}`;
        const result = async (apply) => {
            const success = await apply();
            return success
                ? { success: true, commandId: id, label }
                : { success: false, commandId: id, label, reason: 'Terrain target or texture is unavailable' };
        };
        const command = {
            meta: { id, label, type, scope: { editorType: 'scene' }, timestamp: Date.now() },
            undo: () => result(undo),
            redo: () => result(redo),
        };
        undoService.push(command);
    }
    setManager(component, value) {
        component.manager = value;
    }
    setDirty(component, value) {
        component.isTerrainChange = value;
        if (value) {
            this.emit('terrain:changed', component);
        }
    }
    get isTerrainChange() {
        return this.editedComponents.some((component) => component.isTerrainChange === true);
    }
    set isTerrainChange(value) {
        for (const component of this.selectedComponents) {
            this.setDirty(component, value);
        }
    }
    select(nodeUuid) {
        const component = this.terrainOfUuid(nodeUuid);
        if (!component)
            return;
        this.setManager(component, this);
        if (!this.selectedComponents.includes(component))
            this.selectedComponents.push(component);
        if (!this.editedComponents.includes(component))
            this.editedComponents.push(component);
    }
    unselect(nodeUuid) {
        const component = this.terrainOfUuid(nodeUuid);
        if (!component)
            return;
        this.setManager(component, null);
        const selectedIndex = this.selectedComponents.indexOf(component);
        if (selectedIndex >= 0)
            this.selectedComponents.splice(selectedIndex, 1);
        // Keep editedComponents until the node is removed, like the 3.x manager.
    }
    onSelectionSelect(path) {
        const node = (0, editor_node_1.getEditorNodeByPath)(path);
        if (node)
            this.select(node.uuid);
    }
    onSelectionUnselect(path) {
        const node = (0, editor_node_1.getEditorNodeByPath)(path);
        if (node)
            this.unselect(node.uuid);
    }
    onSelectionClear() {
        for (const component of this.selectedComponents)
            this.setManager(component, null);
        this.selectedComponents.length = 0;
    }
    onNodeRemoved(node) {
        const component = this.terrainOfNode(node);
        if (!component)
            return;
        this.removeComponent(component);
    }
    onComponentRemoved(component) {
        if (this.isTerrainComponent(component))
            this.removeComponent(component);
    }
    removeComponent(component) {
        this.setManager(component, null);
        const selected = this.selectedComponents.indexOf(component);
        if (selected >= 0)
            this.selectedComponents.splice(selected, 1);
        const edited = this.editedComponents.indexOf(component);
        if (edited >= 0)
            this.editedComponents.splice(edited, 1);
    }
    onSculpt(node) {
        this.emit('terrain:sculpt', node);
    }
    serialize(component) {
        const asset = component.exportAsset();
        // TerrainAsset's binary export is the canonical .terrain native payload.
        return asset._exportNativeData();
    }
    async saveAsset(isClose = false, component) {
        void isClose;
        const targets = component ? [component] : this.editedComponents;
        let result = 1;
        for (const terrain of targets) {
            if (!terrain.isTerrainChange)
                continue;
            const uuid = terrain._asset?._uuid;
            if (!uuid) {
                result = 2;
                continue;
            }
            try {
                const saved = await scene_asset_binary_client_1.sceneAssetBinaryClient.save(uuid, this.serialize(terrain));
                if (!saved || saved.uuid !== uuid) {
                    result = 2;
                    continue;
                }
                this.setDirty(terrain, false);
                result = 0;
            }
            catch (error) {
                console.error('[Terrain] saveAsset failed:', error);
                result = 2;
            }
        }
        return result;
    }
    async saveAssetDialog(file, isClose = false) {
        let result = 1;
        for (const terrain of this.editedComponents) {
            if (!terrain.isTerrainChange)
                continue;
            const uuid = terrain._asset?._uuid;
            if (uuid) {
                const code = await this.saveAsset(isClose, terrain);
                if (code === 2)
                    result = 2;
                else if (code === 0)
                    result = 0;
                continue;
            }
            // No UI is intentionally implemented here. pink can pass a db:// target
            // through `file` to create the asset, or use its own Save As dialog.
            if (!file) {
                result = 2;
                continue;
            }
            try {
                const created = await scene_asset_binary_client_1.sceneAssetBinaryClient.create({
                    target: file,
                    overwrite: true,
                    content: this.serialize(terrain),
                });
                if (created) {
                    terrain._asset = await (0, node_create_1.loadAny)(created.uuid ?? created);
                    this.setDirty(terrain, false);
                    result = 0;
                }
                else {
                    result = 2;
                }
            }
            catch (error) {
                console.error('[Terrain] create terrain asset failed:', error);
                result = 2;
            }
        }
        return result;
    }
    async close() {
        if (!this.isTerrainChange)
            return 1;
        return this.saveAssetDialog(undefined, true);
    }
    async addAssetToComp(assetUuid) {
        for (const terrain of this.selectedComponents) {
            if (assetUuid) {
                try {
                    terrain._asset = await (0, node_create_1.loadAny)(assetUuid);
                }
                catch {
                    terrain._asset = null;
                }
            }
            else if (!terrain._asset) {
                terrain._asset = new cc_1.TerrainAsset();
                this.setDirty(terrain, false);
            }
            global_events_1.ServiceEvents.emit('node:change', terrain.node, { type: 'component-changed' });
        }
    }
    onAssetDeleted(uuid) {
        for (const terrain of this.editedComponents) {
            if (terrain._asset?._uuid === uuid) {
                global_events_1.ServiceEvents.emit('node:change', terrain.node, { type: 'component-changed' });
            }
        }
    }
    onEditorClosed() {
        this.onSelectionClear();
        this.editedComponents.length = 0;
    }
    onEditorDisposed() {
        this.onEditorClosed();
    }
};
exports.TerrainService = TerrainService;
exports.TerrainService = TerrainService = __decorate([
    (0, core_1.register)('Terrain')
], TerrainService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS90ZXJyYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDJCQUFxSDtBQUNySCxpQ0FBdUU7QUFDdkUsd0RBQXFEO0FBQ3JELDJEQUFxRjtBQUNyRixvREFBNkM7QUFDN0MsNEVBQXNFO0FBc0N0RSxNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxDQUFvQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDOUYsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsQ0FBa0Q7SUFDaEYsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFlBQVk7Q0FDdkQsQ0FBQyxDQUFDO0FBRUgsU0FBUyxVQUFVLENBQUMsTUFBc0I7SUFDdEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDOUUsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQWM7SUFDbkMsSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDdEQsTUFBTSxNQUFNLEdBQUcsS0FBZ0MsQ0FBQztJQUNoRCxPQUFPLE9BQU8sTUFBTSxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQztXQUNqRSxPQUFPLE1BQU0sQ0FBQyxhQUFhLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN2RixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFjO0lBQ3pDLElBQUksQ0FBQyxLQUFLLElB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UUFBUSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBQ0QsNkJBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLENBQUM7SUFDTCxDQUFDO0lBRU0sY0FBYyxDQUFDLElBQVk7UUFDOUIsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqQyw2QkFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDbkYsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRU0sY0FBYztRQUNqQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRU0sZ0JBQWdCO1FBQ25CLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQ0osQ0FBQTtBQXJqQlksd0NBQWM7eUJBQWQsY0FBYztJQUQxQixJQUFBLGVBQVEsRUFBQyxTQUFTLENBQUM7R0FDUCxjQUFjLENBcWpCMUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIFRlcnJhaW4sIFRlcnJhaW5Bc3NldCwgVGVycmFpbkluZm8sIFRlcnJhaW5MYXllciwgVGV4dHVyZTJELCBURVJSQUlOX01BWF9MQVlFUl9DT1VOVCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IEJhc2VTZXJ2aWNlLCBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlLCByZWdpc3RlciB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBTZXJ2aWNlRXZlbnRzIH0gZnJvbSAnLi9jb3JlL2dsb2JhbC1ldmVudHMnO1xuaW1wb3J0IHsgZ2V0RWRpdG9yTm9kZUJ5VXVpZCwgZ2V0RWRpdG9yTm9kZUJ5UGF0aCB9IGZyb20gJy4vZ2l6bW8vdXRpbHMvZWRpdG9yLW5vZGUnO1xuaW1wb3J0IHsgbG9hZEFueSB9IGZyb20gJy4vbm9kZS9ub2RlLWNyZWF0ZSc7XG5pbXBvcnQgeyBzY2VuZUFzc2V0QmluYXJ5Q2xpZW50IH0gZnJvbSAnLi4vc2NlbmUtYXNzZXQtYmluYXJ5LWNsaWVudCc7XG5pbXBvcnQgdHlwZSB7XG4gICAgSVRlcnJhaW5CbG9ja0RhdGEsXG4gICAgSVRlcnJhaW5CcnVzaFBhdGNoLFxuICAgIElUZXJyYWluRWRpdG9yU3RhdGUsXG4gICAgSVRlcnJhaW5FdmVudHMsXG4gICAgSVRlcnJhaW5JbnZhbGlkU25hcHNob3QsXG4gICAgSVRlcnJhaW5MYXllclBhdGNoLFxuICAgIElUZXJyYWluTGF5ZXJTdGF0ZSxcbiAgICBJVGVycmFpbk1hbmFnZVN0YXRlLFxuICAgIElUZXJyYWluUGFpbnRTZXNzaW9uUGF0Y2gsXG4gICAgSVRlcnJhaW5TZXJ2aWNlLFxuICAgIElUZXJyYWluU2N1bHB0U2Vzc2lvblBhdGNoLFxuICAgIElUZXJyYWluVGFyZ2V0LFxuICAgIFRlcnJhaW5CbG9ja1JlYWRSZXN1bHQsXG4gICAgVGVycmFpbkVkaXRvck1vZGUsXG4gICAgVGVycmFpblJlYWRSZXN1bHQsXG4gICAgSVVuZG9Db21tYW5kLFxuICAgIElVbmRvUmVkb1Jlc3VsdCxcbiAgICBJVW5kb1NlcnZpY2UsXG59IGZyb20gJy4uLy4uL2NvbW1vbic7XG5cbmludGVyZmFjZSBJVGVycmFpblNlc3Npb25HaXptbyB7XG4gICAgdGFyZ2V0OiBUZXJyYWluIHwgbnVsbDtcbiAgICByZWFkVGVycmFpblN0YXRlKCk6IElUZXJyYWluRWRpdG9yU3RhdGU7XG4gICAgc2V0VGVycmFpbk1vZGUobW9kZTogVGVycmFpbkVkaXRvck1vZGUpOiB2b2lkO1xuICAgIHNldFRlcnJhaW5DdXJyZW50TGF5ZXIoY3VycmVudExheWVyOiBudW1iZXIpOiB2b2lkO1xuICAgIHVwZGF0ZVRlcnJhaW5TY3VscHRTZXNzaW9uKHBhdGNoOiBJVGVycmFpblNjdWxwdFNlc3Npb25QYXRjaCk6IHZvaWQ7XG4gICAgc2V0U2N1bHB0QnJ1c2hUZXh0dXJlKHRleHR1cmU6IFRleHR1cmUyRCB8IG51bGwpOiB2b2lkO1xuICAgIHNldFBhaW50QnJ1c2hUZXh0dXJlKHRleHR1cmU6IFRleHR1cmUyRCB8IG51bGwpOiB2b2lkO1xuICAgIHVwZGF0ZVRlcnJhaW5QYWludFNlc3Npb24ocGF0Y2g6IElUZXJyYWluUGFpbnRTZXNzaW9uUGF0Y2gpOiB2b2lkO1xuICAgIHJlYWRUZXJyYWluQmxvY2soKTogSVRlcnJhaW5CbG9ja0RhdGEgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgSUdpem1vU2VydmljZUxvb2t1cCB7XG4gICAgZ2V0Q29tcG9uZW50R2l6bW8oY29tcG9uZW50OiBDb21wb25lbnQpOiB1bmtub3duO1xufVxuXG5jb25zdCB0ZXJyYWluRWRpdG9yTW9kZXMgPSBuZXcgU2V0PFRlcnJhaW5FZGl0b3JNb2RlPihbJ21hbmFnZScsICdzY3VscHQnLCAncGFpbnQnLCAnYmxvY2snXSk7XG5jb25zdCB0ZXJyYWluU2N1bHB0VG9vbHMgPSBuZXcgU2V0PE5vbk51bGxhYmxlPElUZXJyYWluU2N1bHB0U2Vzc2lvblBhdGNoWyd0b29sJ10+PihbXG4gICAgJ2J1bGdlJywgJ3N1bmtlbicsICdzbW9vdGgnLCAnZmxhdHRlbicsICdzZXQtaGVpZ2h0Jyxcbl0pO1xuXG5mdW5jdGlvbiBjb3B5VGFyZ2V0KHRhcmdldDogSVRlcnJhaW5UYXJnZXQpOiBJVGVycmFpblRhcmdldCB7XG4gICAgcmV0dXJuIHsgbm9kZVV1aWQ6IHRhcmdldC5ub2RlVXVpZCwgY29tcG9uZW50VXVpZDogdGFyZ2V0LmNvbXBvbmVudFV1aWQgfTtcbn1cblxuZnVuY3Rpb24gaXNUZXJyYWluVGFyZ2V0KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgSVRlcnJhaW5UYXJnZXQge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IHRhcmdldCA9IHZhbHVlIGFzIFBhcnRpYWw8SVRlcnJhaW5UYXJnZXQ+O1xuICAgIHJldHVybiB0eXBlb2YgdGFyZ2V0Lm5vZGVVdWlkID09PSAnc3RyaW5nJyAmJiB0YXJnZXQubm9kZVV1aWQubGVuZ3RoID4gMFxuICAgICAgICAmJiB0eXBlb2YgdGFyZ2V0LmNvbXBvbmVudFV1aWQgPT09ICdzdHJpbmcnICYmIHRhcmdldC5jb21wb25lbnRVdWlkLmxlbmd0aCA+IDA7XG59XG5cbmZ1bmN0aW9uIGlzVGVycmFpblNlc3Npb25HaXptbyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIElUZXJyYWluU2Vzc2lvbkdpem1vIHtcbiAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBnaXptbyA9IHZhbHVlIGFzIFBhcnRpYWw8SVRlcnJhaW5TZXNzaW9uR2l6bW8+O1xuICAgIHJldHVybiAndGFyZ2V0JyBpbiBnaXptb1xuICAgICAgICAmJiB0eXBlb2YgZ2l6bW8ucmVhZFRlcnJhaW5TdGF0ZSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAmJiB0eXBlb2YgZ2l6bW8uc2V0VGVycmFpbk1vZGUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgJiYgdHlwZW9mIGdpem1vLnNldFRlcnJhaW5DdXJyZW50TGF5ZXIgPT09ICdmdW5jdGlvbidcbiAgICAgICAgJiYgdHlwZW9mIGdpem1vLnVwZGF0ZVRlcnJhaW5TY3VscHRTZXNzaW9uID09PSAnZnVuY3Rpb24nXG4gICAgICAgICYmIHR5cGVvZiBnaXptby5zZXRTY3VscHRCcnVzaFRleHR1cmUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgJiYgdHlwZW9mIGdpem1vLnNldFBhaW50QnJ1c2hUZXh0dXJlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICYmIHR5cGVvZiBnaXptby51cGRhdGVUZXJyYWluUGFpbnRTZXNzaW9uID09PSAnZnVuY3Rpb24nXG4gICAgICAgICYmIHR5cGVvZiBnaXptby5yZWFkVGVycmFpbkJsb2NrID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCcnVzaFBhdGNoKHZhbHVlOiB1bmtub3duKTogSVRlcnJhaW5CcnVzaFBhdGNoIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc291cmNlID0gdmFsdWUgYXMgSVRlcnJhaW5CcnVzaFBhdGNoO1xuICAgIGNvbnN0IHBhdGNoOiBJVGVycmFpbkJydXNoUGF0Y2ggPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBbJ3JhZGl1cycsICdzdHJlbmd0aCcsICdyb3RhdGlvbicsICdzZXRIZWlnaHQnXSBhcyBjb25zdCkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVtrZXldID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNGaW5pdGUoc291cmNlW2tleV0pKSBwYXRjaFtrZXldID0gc291cmNlW2tleV07XG4gICAgfVxuICAgIHJldHVybiBPYmplY3Qua2V5cyhwYXRjaCkubGVuZ3RoID8gcGF0Y2ggOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNjdWxwdFBhdGNoKHZhbHVlOiB1bmtub3duKTogSVRlcnJhaW5TY3VscHRTZXNzaW9uUGF0Y2ggfCB1bmRlZmluZWQge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBjb25zdCBzb3VyY2UgPSB2YWx1ZSBhcyBJVGVycmFpblNjdWxwdFNlc3Npb25QYXRjaDtcbiAgICBjb25zdCBwYXRjaDogSVRlcnJhaW5TY3VscHRTZXNzaW9uUGF0Y2ggPSB7fTtcbiAgICBpZiAoc291cmNlLnRvb2wgJiYgdGVycmFpblNjdWxwdFRvb2xzLmhhcyhzb3VyY2UudG9vbCkpIHBhdGNoLnRvb2wgPSBzb3VyY2UudG9vbDtcbiAgICBjb25zdCBicnVzaCA9IG5vcm1hbGl6ZUJydXNoUGF0Y2goc291cmNlLmJydXNoKTtcbiAgICBpZiAoYnJ1c2gpIHBhdGNoLmJydXNoID0gYnJ1c2g7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHBhdGNoKS5sZW5ndGggPyBwYXRjaCA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUGFpbnRQYXRjaCh2YWx1ZTogdW5rbm93bik6IElUZXJyYWluUGFpbnRTZXNzaW9uUGF0Y2ggfCB1bmRlZmluZWQge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBjb25zdCBicnVzaCA9IG5vcm1hbGl6ZUJydXNoUGF0Y2goKHZhbHVlIGFzIElUZXJyYWluUGFpbnRTZXNzaW9uUGF0Y2gpLmJydXNoKTtcbiAgICByZXR1cm4gYnJ1c2ggPyB7IGJydXNoIH0gOiB1bmRlZmluZWQ7XG59XG5cblxuaW50ZXJmYWNlIElUZXJyYWluTGF5ZXJBc3NldHMge1xuICAgIGRldGFpbE1hcD86IFRleHR1cmUyRCB8IG51bGw7XG4gICAgbm9ybWFsTWFwPzogVGV4dHVyZTJEIHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gY29weU1hbmFnZVN0YXRlKHZhbHVlOiBJVGVycmFpbk1hbmFnZVN0YXRlKTogSVRlcnJhaW5NYW5hZ2VTdGF0ZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGlsZVNpemU6IHZhbHVlLnRpbGVTaXplLFxuICAgICAgICB3ZWlnaHRNYXBTaXplOiB2YWx1ZS53ZWlnaHRNYXBTaXplLFxuICAgICAgICBsaWdodE1hcFNpemU6IHZhbHVlLmxpZ2h0TWFwU2l6ZSxcbiAgICAgICAgYmxvY2tDb3VudDogW3ZhbHVlLmJsb2NrQ291bnRbMF0sIHZhbHVlLmJsb2NrQ291bnRbMV1dLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvcHlMYXllclN0YXRlKHZhbHVlOiBJVGVycmFpbkxheWVyU3RhdGUpOiBJVGVycmFpbkxheWVyU3RhdGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGRldGFpbE1hcFV1aWQ6IHZhbHVlLmRldGFpbE1hcFV1aWQsXG4gICAgICAgIG5vcm1hbE1hcFV1aWQ6IHZhbHVlLm5vcm1hbE1hcFV1aWQsXG4gICAgICAgIG1ldGFsbGljOiB2YWx1ZS5tZXRhbGxpYyxcbiAgICAgICAgcm91Z2huZXNzOiB2YWx1ZS5yb3VnaG5lc3MsXG4gICAgICAgIHRpbGVTaXplOiB2YWx1ZS50aWxlU2l6ZSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb3B5TGF5ZXJTdGF0ZXModmFsdWVzOiBBcnJheTxJVGVycmFpbkxheWVyU3RhdGUgfCBudWxsPik6IEFycmF5PElUZXJyYWluTGF5ZXJTdGF0ZSB8IG51bGw+IHtcbiAgICByZXR1cm4gdmFsdWVzLm1hcCgodmFsdWUpID0+IHZhbHVlID8gY29weUxheWVyU3RhdGUodmFsdWUpIDogbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGlzRmluaXRlUG9zaXRpdmUodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBudW1iZXIge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgJiYgdmFsdWUgPiAwO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlSW50ZWdlcih2YWx1ZTogdW5rbm93biwgbWF4aW11bSA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKTogdmFsdWUgaXMgbnVtYmVyIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+IDAgJiYgdmFsdWUgPD0gbWF4aW11bTtcbn1cblxuZnVuY3Rpb24gaXNVdWlkT3JOdWxsKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8ICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLmxlbmd0aCA+IDApO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVNYW5hZ2VTdGF0ZSh2YWx1ZTogdW5rbm93bik6IElUZXJyYWluTWFuYWdlU3RhdGUgfCBudWxsIHtcbiAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHNvdXJjZSA9IHZhbHVlIGFzIFBhcnRpYWw8SVRlcnJhaW5NYW5hZ2VTdGF0ZT47XG4gICAgaWYgKCFpc0Zpbml0ZVBvc2l0aXZlKHNvdXJjZS50aWxlU2l6ZSlcbiAgICAgICAgfHwgIWlzUG9zaXRpdmVJbnRlZ2VyKHNvdXJjZS53ZWlnaHRNYXBTaXplLCAweDdmZmYpXG4gICAgICAgIHx8ICFpc1Bvc2l0aXZlSW50ZWdlcihzb3VyY2UubGlnaHRNYXBTaXplLCAweDdmZmYpXG4gICAgICAgIHx8ICFBcnJheS5pc0FycmF5KHNvdXJjZS5ibG9ja0NvdW50KVxuICAgICAgICB8fCBzb3VyY2UuYmxvY2tDb3VudC5sZW5ndGggIT09IDJcbiAgICAgICAgfHwgIWlzUG9zaXRpdmVJbnRlZ2VyKHNvdXJjZS5ibG9ja0NvdW50WzBdKVxuICAgICAgICB8fCAhaXNQb3NpdGl2ZUludGVnZXIoc291cmNlLmJsb2NrQ291bnRbMV0pKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB0aWxlU2l6ZTogc291cmNlLnRpbGVTaXplLFxuICAgICAgICB3ZWlnaHRNYXBTaXplOiBzb3VyY2Uud2VpZ2h0TWFwU2l6ZSxcbiAgICAgICAgbGlnaHRNYXBTaXplOiBzb3VyY2UubGlnaHRNYXBTaXplLFxuICAgICAgICBibG9ja0NvdW50OiBbc291cmNlLmJsb2NrQ291bnRbMF0sIHNvdXJjZS5ibG9ja0NvdW50WzFdXSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMYXllclN0YXRlKHZhbHVlOiB1bmtub3duKTogSVRlcnJhaW5MYXllclN0YXRlIHwgbnVsbCB7XG4gICAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBzb3VyY2UgPSB2YWx1ZSBhcyBQYXJ0aWFsPElUZXJyYWluTGF5ZXJTdGF0ZT47XG4gICAgY29uc3QgeyBkZXRhaWxNYXBVdWlkLCBub3JtYWxNYXBVdWlkLCBtZXRhbGxpYywgcm91Z2huZXNzLCB0aWxlU2l6ZSB9ID0gc291cmNlO1xuICAgIGlmICghaXNVdWlkT3JOdWxsKGRldGFpbE1hcFV1aWQpXG4gICAgICAgIHx8ICFpc1V1aWRPck51bGwobm9ybWFsTWFwVXVpZClcbiAgICAgICAgfHwgdHlwZW9mIG1ldGFsbGljICE9PSAnbnVtYmVyJyB8fCAhTnVtYmVyLmlzRmluaXRlKG1ldGFsbGljKVxuICAgICAgICB8fCB0eXBlb2Ygcm91Z2huZXNzICE9PSAnbnVtYmVyJyB8fCAhTnVtYmVyLmlzRmluaXRlKHJvdWdobmVzcylcbiAgICAgICAgfHwgIWlzRmluaXRlUG9zaXRpdmUodGlsZVNpemUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4geyBkZXRhaWxNYXBVdWlkLCBub3JtYWxNYXBVdWlkLCBtZXRhbGxpYywgcm91Z2huZXNzLCB0aWxlU2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMYXllclBhdGNoKHZhbHVlOiB1bmtub3duKTogSVRlcnJhaW5MYXllclBhdGNoIHwgbnVsbCB7XG4gICAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBzb3VyY2UgPSB2YWx1ZSBhcyBJVGVycmFpbkxheWVyUGF0Y2g7XG4gICAgY29uc3QgcGF0Y2g6IElUZXJyYWluTGF5ZXJQYXRjaCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IG9mIFsnZGV0YWlsTWFwVXVpZCcsICdub3JtYWxNYXBVdWlkJ10gYXMgY29uc3QpIHtcbiAgICAgICAgaWYgKCFPYmplY3QuaGFzT3duKHNvdXJjZSwga2V5KSkgY29udGludWU7XG4gICAgICAgIGlmICghaXNVdWlkT3JOdWxsKHNvdXJjZVtrZXldKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHBhdGNoW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgb2YgWydtZXRhbGxpYycsICdyb3VnaG5lc3MnXSBhcyBjb25zdCkge1xuICAgICAgICBpZiAoIU9iamVjdC5oYXNPd24oc291cmNlLCBrZXkpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoc291cmNlW2tleV0pKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcGF0Y2hba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0Lmhhc093bihzb3VyY2UsICd0aWxlU2l6ZScpKSB7XG4gICAgICAgIGlmICghaXNGaW5pdGVQb3NpdGl2ZShzb3VyY2UudGlsZVNpemUpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcGF0Y2gudGlsZVNpemUgPSBzb3VyY2UudGlsZVNpemU7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3Qua2V5cyhwYXRjaCkubGVuZ3RoID8gcGF0Y2ggOiBudWxsO1xufVxuXG5mdW5jdGlvbiBzdGF0ZXNFcXVhbChsZWZ0OiB1bmtub3duLCByaWdodDogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShsZWZ0KSA9PT0gSlNPTi5zdHJpbmdpZnkocmlnaHQpO1xufVxuXG4vKipcbiAqIFRlcnJhaW4gYXNzZXQgbGlmZWN5Y2xlIGFuZCB0YXJnZXQtc2FmZSBlZGl0b3Itc2Vzc2lvbiBhY2Nlc3MuXG4gKlxuICogVGhlIHB1YmxpYyBUZXJyYWluIGNhcGFiaWxpdHkgbmV2ZXIgZXhwb3NlcyBnaXptb3MuIFRoaXMgc2VydmljZSB2YWxpZGF0ZXMgdGhlXG4gKiByZXF1ZXN0ZWQgbm9kZS9jb21wb25lbnQgcGFpciwgYWRhcHRzIHRoZSBtYXRjaGluZyBpbnRlcm5hbCBnaXptbywgYW5kIHJldHVybnNcbiAqIGNhbm9uaWNhbCBzbmFwc2hvdHMgZm9yIGRpcmVjdCBTY2VuZS13ZWJ2aWV3IGFjY2Vzcy5cbiAqL1xuQHJlZ2lzdGVyKCdUZXJyYWluJylcbmV4cG9ydCBjbGFzcyBUZXJyYWluU2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPElUZXJyYWluRXZlbnRzPiBpbXBsZW1lbnRzIElUZXJyYWluU2VydmljZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IG5hbWUgPSAnY2MuVGVycmFpbicgYXMgY29uc3Q7XG4gICAgcHVibGljIHJlYWRvbmx5IGVkaXRlZENvbXBvbmVudHM6IFRlcnJhaW5bXSA9IFtdO1xuICAgIHB1YmxpYyByZWFkb25seSBzZWxlY3RlZENvbXBvbmVudHM6IFRlcnJhaW5bXSA9IFtdO1xuICAgIHByaXZhdGUgX3RlcnJhaW5VbmRvU2VxdWVuY2UgPSAwO1xuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgLy8gU2VsZWN0aW9uU2VydmljZSBicm9hZGNhc3RzIHBhdGhzLCB3aGlsZSB0aGUgb2xkIG1hbmFnZXIgcmVjZWl2ZWQgbm9kZSBVVUlEcy5cbiAgICAgICAgLy8gS2VlcCBib3RoIGVudHJ5IHBvaW50cyBzbyBwaW5rIGNhbiB1c2UgZWl0aGVyIHByb3RvY29sLlxuICAgICAgICBTZXJ2aWNlRXZlbnRzLm9uKCdzZWxlY3Rpb246c2VsZWN0JywgKHBhdGg6IHN0cmluZykgPT4gdGhpcy5vblNlbGVjdGlvblNlbGVjdChwYXRoKSk7XG4gICAgICAgIFNlcnZpY2VFdmVudHMub24oJ3NlbGVjdGlvbjp1bnNlbGVjdCcsIChwYXRoOiBzdHJpbmcpID0+IHRoaXMub25TZWxlY3Rpb25VbnNlbGVjdChwYXRoKSk7XG4gICAgICAgIFNlcnZpY2VFdmVudHMub24oJ3NlbGVjdGlvbjpjbGVhcicsICgpID0+IHRoaXMub25TZWxlY3Rpb25DbGVhcigpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzVGVycmFpbkNvbXBvbmVudChjb21wb25lbnQ6IENvbXBvbmVudCB8IG51bGwgfCB1bmRlZmluZWQpOiBjb21wb25lbnQgaXMgVGVycmFpbiB7XG4gICAgICAgIHJldHVybiBjb21wb25lbnQgaW5zdGFuY2VvZiBUZXJyYWluIHx8IChjb21wb25lbnQgYXMgYW55KT8uX19jbGFzc25hbWVfXyA9PT0gJ2NjLlRlcnJhaW4nO1xuICAgIH1cblxuICAgIHByaXZhdGUgdGVycmFpbk9mTm9kZShub2RlOiBhbnkpOiBUZXJyYWluIHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBub2RlPy5jb21wb25lbnRzPy5maW5kKChjb21wb25lbnQ6IENvbXBvbmVudCkgPT4gdGhpcy5pc1RlcnJhaW5Db21wb25lbnQoY29tcG9uZW50KSkgYXMgVGVycmFpbiB8IG51bGwgPz8gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRlcnJhaW5PZlV1aWQodXVpZDogc3RyaW5nKTogVGVycmFpbiB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXJyYWluT2ZOb2RlKGdldEVkaXRvck5vZGVCeVV1aWQodXVpZCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVzb2x2ZVRhcmdldCh0YXJnZXQ6IElUZXJyYWluVGFyZ2V0KTogeyBjb21wb25lbnQ6IFRlcnJhaW47IGdpem1vOiBJVGVycmFpblNlc3Npb25HaXptbyB9IHwgbnVsbCB7XG4gICAgICAgIGlmICghaXNUZXJyYWluVGFyZ2V0KHRhcmdldCkpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBub2RlID0gZ2V0RWRpdG9yTm9kZUJ5VXVpZCh0YXJnZXQubm9kZVV1aWQpO1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlPy5jb21wb25lbnRzPy5maW5kKChjYW5kaWRhdGU6IENvbXBvbmVudCkgPT4gY2FuZGlkYXRlLnV1aWQgPT09IHRhcmdldC5jb21wb25lbnRVdWlkXG4gICAgICAgICAgICAmJiB0aGlzLmlzVGVycmFpbkNvbXBvbmVudChjYW5kaWRhdGUpKSBhcyBUZXJyYWluIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoIWNvbXBvbmVudCB8fCBjb21wb25lbnQubm9kZSAhPT0gbm9kZSB8fCAhdGhpcy5zZWxlY3RlZENvbXBvbmVudHMuaW5jbHVkZXMoY29tcG9uZW50KSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3QgZ2l6bW9TZXJ2aWNlID0gcXVlcnlSZWdpc3RlcmVkU2VydmljZTxJR2l6bW9TZXJ2aWNlTG9va3VwPignR2l6bW8nKTtcbiAgICAgICAgY29uc3QgZ2l6bW8gPSBnaXptb1NlcnZpY2U/LmdldENvbXBvbmVudEdpem1vKGNvbXBvbmVudCk7XG4gICAgICAgIGlmICghaXNUZXJyYWluU2Vzc2lvbkdpem1vKGdpem1vKSB8fCBnaXptby50YXJnZXQgIT09IGNvbXBvbmVudCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiB7IGNvbXBvbmVudCwgZ2l6bW8gfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGludmFsaWRSZXN1bHQodGFyZ2V0OiBJVGVycmFpblRhcmdldCk6IElUZXJyYWluSW52YWxpZFNuYXBzaG90IHtcbiAgICAgICAgcmV0dXJuIHsgdGFyZ2V0OiBjb3B5VGFyZ2V0KHRhcmdldCksIHZhbGlkOiBmYWxzZSB9O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIG9ubHkgdGhlIHB1YmxpYyBVVUlEIG9mIHRoZSBwZXJzaXN0ZWQgVGVycmFpbiBhc3NldCwgbmV2ZXIgdGhlIGVuZ2luZSBhc3NldCBvYmplY3QuICovXG4gICAgcHJpdmF0ZSBnZXRUZXJyYWluQXNzZXRVdWlkKGNvbXBvbmVudDogVGVycmFpbiB8IG51bGwpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgY29uc3QgdXVpZCA9IGNvbXBvbmVudD8uX2Fzc2V0Py51dWlkO1xuICAgICAgICByZXR1cm4gdHlwZW9mIHV1aWQgPT09ICdzdHJpbmcnICYmIHV1aWQubGVuZ3RoID4gMCA/IHV1aWQgOiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVhZFJlc29sdmVkKHRhcmdldDogSVRlcnJhaW5UYXJnZXQsIGdpem1vOiBJVGVycmFpblNlc3Npb25HaXptbyk6IFRlcnJhaW5SZWFkUmVzdWx0IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRhcmdldDogY29weVRhcmdldCh0YXJnZXQpLFxuICAgICAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICAgICAgICBhc3NldFV1aWQ6IHRoaXMuZ2V0VGVycmFpbkFzc2V0VXVpZChnaXptby50YXJnZXQpLFxuICAgICAgICAgICAgLi4uZ2l6bW8ucmVhZFRlcnJhaW5TdGF0ZSgpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIGEgY2Fub25pY2FsIHNuYXBzaG90IG9yIGB2YWxpZDogZmFsc2VgOyBpdCBuZXZlciBmYWxscyBiYWNrIHRvIGFub3RoZXIgVGVycmFpbi4gKi9cbiAgICBwdWJsaWMgcmVhZCh0YXJnZXQ6IElUZXJyYWluVGFyZ2V0KTogVGVycmFpblJlYWRSZXN1bHQge1xuICAgICAgICBpZiAoIWlzVGVycmFpblRhcmdldCh0YXJnZXQpKSByZXR1cm4geyB0YXJnZXQ6IHsgbm9kZVV1aWQ6ICcnLCBjb21wb25lbnRVdWlkOiAnJyB9LCB2YWxpZDogZmFsc2UgfTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVkID8gdGhpcy5yZWFkUmVzb2x2ZWQodGFyZ2V0LCByZXNvbHZlZC5naXptbykgOiB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0TW9kZSh0YXJnZXQ6IElUZXJyYWluVGFyZ2V0LCBtb2RlOiBUZXJyYWluRWRpdG9yTW9kZSk6IFRlcnJhaW5SZWFkUmVzdWx0IHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFyZXNvbHZlZCkgcmV0dXJuIGlzVGVycmFpblRhcmdldCh0YXJnZXQpID8gdGhpcy5pbnZhbGlkUmVzdWx0KHRhcmdldCkgOiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCF0ZXJyYWluRWRpdG9yTW9kZXMuaGFzKG1vZGUpKSByZXR1cm4gdGhpcy5yZWFkUmVzb2x2ZWQodGFyZ2V0LCByZXNvbHZlZC5naXptbyk7XG4gICAgICAgIHJlc29sdmVkLmdpem1vLnNldFRlcnJhaW5Nb2RlKG1vZGUpO1xuICAgICAgICB0aGlzLmVtaXQoJ3RlcnJhaW46c2Vzc2lvbi1jaGFuZ2VkJywgY29weVRhcmdldCh0YXJnZXQpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0YXJnZXQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRDdXJyZW50TGF5ZXIodGFyZ2V0OiBJVGVycmFpblRhcmdldCwgY3VycmVudExheWVyOiBudW1iZXIpOiBUZXJyYWluUmVhZFJlc3VsdCB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlVGFyZ2V0KHRhcmdldCk7XG4gICAgICAgIGlmICghcmVzb2x2ZWQpIHJldHVybiBpc1RlcnJhaW5UYXJnZXQodGFyZ2V0KSA/IHRoaXMuaW52YWxpZFJlc3VsdCh0YXJnZXQpIDogdGhpcy5yZWFkKHRhcmdldCk7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjdXJyZW50TGF5ZXIpIHx8IGN1cnJlbnRMYXllciA8IC0xKSByZXR1cm4gdGhpcy5yZWFkUmVzb2x2ZWQodGFyZ2V0LCByZXNvbHZlZC5naXptbyk7XG4gICAgICAgIHJlc29sdmVkLmdpem1vLnNldFRlcnJhaW5DdXJyZW50TGF5ZXIoY3VycmVudExheWVyKTtcbiAgICAgICAgdGhpcy5lbWl0KCd0ZXJyYWluOnNlc3Npb24tY2hhbmdlZCcsIGNvcHlUYXJnZXQodGFyZ2V0KSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0U2N1bHB0U2Vzc2lvbih0YXJnZXQ6IElUZXJyYWluVGFyZ2V0LCBwYXRjaDogSVRlcnJhaW5TY3VscHRTZXNzaW9uUGF0Y2gpOiBUZXJyYWluUmVhZFJlc3VsdCB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlVGFyZ2V0KHRhcmdldCk7XG4gICAgICAgIGlmICghcmVzb2x2ZWQpIHJldHVybiBpc1RlcnJhaW5UYXJnZXQodGFyZ2V0KSA/IHRoaXMuaW52YWxpZFJlc3VsdCh0YXJnZXQpIDogdGhpcy5yZWFkKHRhcmdldCk7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVTY3VscHRQYXRjaChwYXRjaCk7XG4gICAgICAgIGlmICghbm9ybWFsaXplZCkgcmV0dXJuIHRoaXMucmVhZFJlc29sdmVkKHRhcmdldCwgcmVzb2x2ZWQuZ2l6bW8pO1xuICAgICAgICByZXNvbHZlZC5naXptby51cGRhdGVUZXJyYWluU2N1bHB0U2Vzc2lvbihub3JtYWxpemVkKTtcbiAgICAgICAgdGhpcy5lbWl0KCd0ZXJyYWluOnNlc3Npb24tY2hhbmdlZCcsIGNvcHlUYXJnZXQodGFyZ2V0KSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICB9XG5cbiAgICAvKiogQXNzaWducyBhIHZhbGlkYXRlZCBUZXh0dXJlMkQgYXNzZXQgdG8gU2N1bHB0LCBvciBjbGVhcnMgaXQgdG8gcmVzdG9yZSB0aGUgY2lyY2xlIGJydXNoLCB3aXRob3V0IGNyZWF0aW5nIFNjZW5lIFVuZG8uICovXG4gICAgcHVibGljIGFzeW5jIHNldFNjdWxwdEJydXNoQXNzZXQodGFyZ2V0OiBJVGVycmFpblRhcmdldCwgYXNzZXRVdWlkOiBzdHJpbmcgfCBudWxsKTogUHJvbWlzZTxUZXJyYWluUmVhZFJlc3VsdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRCcnVzaEFzc2V0KHRhcmdldCwgYXNzZXRVdWlkLCAnc2N1bHB0IGJydXNoJywgKGdpem1vLCB0ZXh0dXJlKSA9PiBnaXptby5zZXRTY3VscHRCcnVzaFRleHR1cmUodGV4dHVyZSkpO1xuICAgIH1cblxuICAgIC8qKiBBc3NpZ25zIGEgdmFsaWRhdGVkIFRleHR1cmUyRCBhc3NldCB0byBQYWludCwgb3IgY2xlYXJzIGl0IHRvIHJlc3RvcmUgdGhlIGNpcmNsZSBicnVzaCwgd2l0aG91dCBjcmVhdGluZyBTY2VuZSBVbmRvLiAqL1xuICAgIHB1YmxpYyBhc3luYyBzZXRQYWludEJydXNoQXNzZXQodGFyZ2V0OiBJVGVycmFpblRhcmdldCwgYXNzZXRVdWlkOiBzdHJpbmcgfCBudWxsKTogUHJvbWlzZTxUZXJyYWluUmVhZFJlc3VsdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRCcnVzaEFzc2V0KHRhcmdldCwgYXNzZXRVdWlkLCAncGFpbnQgYnJ1c2gnLCAoZ2l6bW8sIHRleHR1cmUpID0+IGdpem1vLnNldFBhaW50QnJ1c2hUZXh0dXJlKHRleHR1cmUpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNldEJydXNoQXNzZXQoXG4gICAgICAgIHRhcmdldDogSVRlcnJhaW5UYXJnZXQsXG4gICAgICAgIGFzc2V0VXVpZDogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgdXNhZ2U6IHN0cmluZyxcbiAgICAgICAgYXBwbHk6IChnaXptbzogSVRlcnJhaW5TZXNzaW9uR2l6bW8sIHRleHR1cmU6IFRleHR1cmUyRCB8IG51bGwpID0+IHZvaWQsXG4gICAgKTogUHJvbWlzZTxUZXJyYWluUmVhZFJlc3VsdD4ge1xuICAgICAgICBpZiAoYXNzZXRVdWlkICE9PSBudWxsICYmICh0eXBlb2YgYXNzZXRVdWlkICE9PSAnc3RyaW5nJyB8fCBhc3NldFV1aWQubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluaXRpYWwgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFpbml0aWFsKSByZXR1cm4gaXNUZXJyYWluVGFyZ2V0KHRhcmdldCkgPyB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KSA6IHRoaXMucmVhZCh0YXJnZXQpO1xuXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSBhc3NldFV1aWQgPT09IG51bGwgPyBudWxsIDogYXdhaXQgdGhpcy5sb2FkVGVycmFpblRleHR1cmUoYXNzZXRVdWlkLCB1c2FnZSk7XG4gICAgICAgIGlmIChhc3NldFV1aWQgIT09IG51bGwgJiYgIXRleHR1cmUpIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcblxuICAgICAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZVRhcmdldCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlc29sdmVkKSByZXR1cm4gaXNUZXJyYWluVGFyZ2V0KHRhcmdldCkgPyB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KSA6IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBhcHBseShyZXNvbHZlZC5naXptbywgdGV4dHVyZSk7XG4gICAgICAgIHRoaXMuZW1pdCgndGVycmFpbjpzZXNzaW9uLWNoYW5nZWQnLCBjb3B5VGFyZ2V0KHRhcmdldCkpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHRhcmdldCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldFBhaW50U2Vzc2lvbih0YXJnZXQ6IElUZXJyYWluVGFyZ2V0LCBwYXRjaDogSVRlcnJhaW5QYWludFNlc3Npb25QYXRjaCk6IFRlcnJhaW5SZWFkUmVzdWx0IHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFyZXNvbHZlZCkgcmV0dXJuIGlzVGVycmFpblRhcmdldCh0YXJnZXQpID8gdGhpcy5pbnZhbGlkUmVzdWx0KHRhcmdldCkgOiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhaW50UGF0Y2gocGF0Y2gpO1xuICAgICAgICBpZiAoIW5vcm1hbGl6ZWQpIHJldHVybiB0aGlzLnJlYWRSZXNvbHZlZCh0YXJnZXQsIHJlc29sdmVkLmdpem1vKTtcbiAgICAgICAgcmVzb2x2ZWQuZ2l6bW8udXBkYXRlVGVycmFpblBhaW50U2Vzc2lvbihub3JtYWxpemVkKTtcbiAgICAgICAgdGhpcy5lbWl0KCd0ZXJyYWluOnNlc3Npb24tY2hhbmdlZCcsIGNvcHlUYXJnZXQodGFyZ2V0KSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICB9XG5cbiAgICAvKiogUmVhZHMgdGhlIGN1cnJlbnRseSBpbnNwZWN0ZWQgYmxvY2sgb25seTsgbm8gVGVycmFpbiBtdXRhdGlvbiBvciBVbmRvIG9jY3Vycy4gKi9cbiAgICBwdWJsaWMgcmVhZEJsb2NrKHRhcmdldDogSVRlcnJhaW5UYXJnZXQpOiBUZXJyYWluQmxvY2tSZWFkUmVzdWx0IHtcbiAgICAgICAgaWYgKCFpc1RlcnJhaW5UYXJnZXQodGFyZ2V0KSkgcmV0dXJuIHsgdGFyZ2V0OiB7IG5vZGVVdWlkOiAnJywgY29tcG9uZW50VXVpZDogJycgfSwgdmFsaWQ6IGZhbHNlIH07XG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlVGFyZ2V0KHRhcmdldCk7XG4gICAgICAgIGlmICghcmVzb2x2ZWQpIHJldHVybiB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHsgdGFyZ2V0OiBjb3B5VGFyZ2V0KHRhcmdldCksIHZhbGlkOiB0cnVlLCBibG9jazogcmVzb2x2ZWQuZ2l6bW8ucmVhZFRlcnJhaW5CbG9jaygpIH07XG4gICAgfVxuXG4gICAgLyoqIENvbW1pdHMgYSBmdWxsIE1hbmFnZSBkcmFmdCBhcyBvbmUgQ0xJLW93bmVkIFRlcnJhaW4gbXV0YXRpb24gYW5kIFVuZG8gY29tbWFuZC4gKi9cbiAgICBwdWJsaWMgYXN5bmMgc2F2ZU1hbmFnZSh0YXJnZXQ6IElUZXJyYWluVGFyZ2V0LCBtYW5hZ2U6IElUZXJyYWluTWFuYWdlU3RhdGUpOiBQcm9taXNlPFRlcnJhaW5SZWFkUmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBub3JtYWxpemVNYW5hZ2VTdGF0ZShtYW5hZ2UpO1xuICAgICAgICBpZiAoIW5leHQpIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFyZXNvbHZlZCkgcmV0dXJuIGlzVGVycmFpblRhcmdldCh0YXJnZXQpID8gdGhpcy5pbnZhbGlkUmVzdWx0KHRhcmdldCkgOiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgdW5kb1NlcnZpY2UgPSB0aGlzLmdldFRlcnJhaW5VbmRvU2VydmljZSgpO1xuICAgICAgICBpZiAoIXVuZG9TZXJ2aWNlKSByZXR1cm4gdGhpcy5yZWFkUmVzb2x2ZWQodGFyZ2V0LCByZXNvbHZlZC5naXptbyk7XG5cbiAgICAgICAgY29uc3QgYmVmb3JlID0gY29weU1hbmFnZVN0YXRlKHJlc29sdmVkLmdpem1vLnJlYWRUZXJyYWluU3RhdGUoKS5tYW5hZ2UpO1xuICAgICAgICBpZiAoc3RhdGVzRXF1YWwoYmVmb3JlLCBuZXh0KSkgcmV0dXJuIHRoaXMucmVhZFJlc29sdmVkKHRhcmdldCwgcmVzb2x2ZWQuZ2l6bW8pO1xuICAgICAgICBpZiAoIXRoaXMuYXBwbHlUZXJyYWluTWFuYWdlU3RhdGUocmVzb2x2ZWQuY29tcG9uZW50LCBuZXh0KSkgcmV0dXJuIHRoaXMucmVhZCh0YXJnZXQpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlc3VsdC52YWxpZCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSBjb3B5TWFuYWdlU3RhdGUocmVzdWx0Lm1hbmFnZSk7XG4gICAgICAgIHRoaXMucHVzaFRlcnJhaW5VbmRvKHVuZG9TZXJ2aWNlLCByZXNvbHZlZC5jb21wb25lbnQsICdTYXZlIFRlcnJhaW4gTWFuYWdlJywgJ3RlcnJhaW46c2F2ZS1tYW5hZ2UnLFxuICAgICAgICAgICAgKCkgPT4gdGhpcy5hcHBseVRlcnJhaW5NYW5hZ2VTdGF0ZShyZXNvbHZlZC5jb21wb25lbnQsIGJlZm9yZSksXG4gICAgICAgICAgICAoKSA9PiB0aGlzLmFwcGx5VGVycmFpbk1hbmFnZVN0YXRlKHJlc29sdmVkLmNvbXBvbmVudCwgYWZ0ZXIpKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKiogQWRkcyBvbmUgY29tcGxldGUgbGF5ZXI7IGluY29tcGF0aWJsZSBvciB1bmF2YWlsYWJsZSB0ZXh0dXJlcyBsZWF2ZSBUZXJyYWluIHVudG91Y2hlZC4gKi9cbiAgICBwdWJsaWMgYXN5bmMgYWRkTGF5ZXIodGFyZ2V0OiBJVGVycmFpblRhcmdldCwgbGF5ZXI6IElUZXJyYWluTGF5ZXJTdGF0ZSk6IFByb21pc2U8VGVycmFpblJlYWRSZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IG5vcm1hbGl6ZUxheWVyU3RhdGUobGF5ZXIpO1xuICAgICAgICBpZiAoIW5leHQgfHwgIW5leHQuZGV0YWlsTWFwVXVpZCkgcmV0dXJuIHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBjb25zdCBpbml0aWFsID0gdGhpcy5yZXNvbHZlVGFyZ2V0KHRhcmdldCk7XG4gICAgICAgIGlmICghaW5pdGlhbCkgcmV0dXJuIGlzVGVycmFpblRhcmdldCh0YXJnZXQpID8gdGhpcy5pbnZhbGlkUmVzdWx0KHRhcmdldCkgOiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgdW5kb1NlcnZpY2UgPSB0aGlzLmdldFRlcnJhaW5VbmRvU2VydmljZSgpO1xuICAgICAgICBpZiAoIXVuZG9TZXJ2aWNlKSByZXR1cm4gdGhpcy5yZWFkUmVzb2x2ZWQodGFyZ2V0LCBpbml0aWFsLmdpem1vKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gYXdhaXQgdGhpcy5sb2FkTGF5ZXJBc3NldHMobmV4dCk7XG4gICAgICAgIGlmICghYXNzZXRzPy5kZXRhaWxNYXApIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcblxuICAgICAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZVRhcmdldCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlc29sdmVkKSByZXR1cm4gaXNUZXJyYWluVGFyZ2V0KHRhcmdldCkgPyB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KSA6IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBjb25zdCBiZWZvcmUgPSBjb3B5TGF5ZXJTdGF0ZXMocmVzb2x2ZWQuZ2l6bW8ucmVhZFRlcnJhaW5TdGF0ZSgpLmxheWVycyk7XG4gICAgICAgIGlmICghdGhpcy5hZGRUZXJyYWluTGF5ZXIocmVzb2x2ZWQuY29tcG9uZW50LCBuZXh0LCBhc3NldHMpKSByZXR1cm4gdGhpcy5yZWFkKHRhcmdldCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5yZWFkKHRhcmdldCk7XG4gICAgICAgIGlmICghcmVzdWx0LnZhbGlkKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBjb25zdCBhZnRlciA9IGNvcHlMYXllclN0YXRlcyhyZXN1bHQubGF5ZXJzKTtcbiAgICAgICAgdGhpcy5wdXNoVGVycmFpblVuZG8odW5kb1NlcnZpY2UsIHJlc29sdmVkLmNvbXBvbmVudCwgJ0FkZCBUZXJyYWluIExheWVyJywgJ3RlcnJhaW46YWRkLWxheWVyJyxcbiAgICAgICAgICAgICgpID0+IHRoaXMuYXBwbHlUZXJyYWluTGF5ZXJTdGF0ZXMocmVzb2x2ZWQuY29tcG9uZW50LCBiZWZvcmUpLFxuICAgICAgICAgICAgKCkgPT4gdGhpcy5hcHBseVRlcnJhaW5MYXllclN0YXRlcyhyZXNvbHZlZC5jb21wb25lbnQsIGFmdGVyKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqIFJlbW92ZXMgYSBzaW5nbGUgbGF5ZXIgc2xvdCBhcyBvbmUgQ0xJLW93bmVkIFRlcnJhaW4gbXV0YXRpb24gYW5kIFVuZG8gY29tbWFuZC4gKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVtb3ZlTGF5ZXIodGFyZ2V0OiBJVGVycmFpblRhcmdldCwgaW5kZXg6IG51bWJlcik6IFByb21pc2U8VGVycmFpblJlYWRSZXN1bHQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzTGF5ZXJJbmRleChpbmRleCkpIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFyZXNvbHZlZCkgcmV0dXJuIGlzVGVycmFpblRhcmdldCh0YXJnZXQpID8gdGhpcy5pbnZhbGlkUmVzdWx0KHRhcmdldCkgOiB0aGlzLnJlYWQodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgdW5kb1NlcnZpY2UgPSB0aGlzLmdldFRlcnJhaW5VbmRvU2VydmljZSgpO1xuICAgICAgICBpZiAoIXVuZG9TZXJ2aWNlKSByZXR1cm4gdGhpcy5yZWFkUmVzb2x2ZWQodGFyZ2V0LCByZXNvbHZlZC5naXptbyk7XG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IGNvcHlMYXllclN0YXRlcyhyZXNvbHZlZC5naXptby5yZWFkVGVycmFpblN0YXRlKCkubGF5ZXJzKTtcbiAgICAgICAgaWYgKCF0aGlzLnJlbW92ZVRlcnJhaW5MYXllcihyZXNvbHZlZC5jb21wb25lbnQsIGluZGV4KSkgcmV0dXJuIHRoaXMucmVhZCh0YXJnZXQpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlc3VsdC52YWxpZCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSBjb3B5TGF5ZXJTdGF0ZXMocmVzdWx0LmxheWVycyk7XG4gICAgICAgIHRoaXMucHVzaFRlcnJhaW5VbmRvKHVuZG9TZXJ2aWNlLCByZXNvbHZlZC5jb21wb25lbnQsICdSZW1vdmUgVGVycmFpbiBMYXllcicsICd0ZXJyYWluOnJlbW92ZS1sYXllcicsXG4gICAgICAgICAgICAoKSA9PiB0aGlzLmFwcGx5VGVycmFpbkxheWVyU3RhdGVzKHJlc29sdmVkLmNvbXBvbmVudCwgYmVmb3JlKSxcbiAgICAgICAgICAgICgpID0+IHRoaXMuYXBwbHlUZXJyYWluTGF5ZXJTdGF0ZXMocmVzb2x2ZWQuY29tcG9uZW50LCBhZnRlcikpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGVzIG9uZSBsYXllciBzbG90OyB0ZXh0dXJlIHJlZmVyZW5jZXMgYXJlIHJlc29sdmVkIGJlZm9yZSB0aGUgdGFyZ2V0IGNhbiBtdXRhdGUuICovXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUxheWVyKHRhcmdldDogSVRlcnJhaW5UYXJnZXQsIGluZGV4OiBudW1iZXIsIHBhdGNoOiBJVGVycmFpbkxheWVyUGF0Y2gpOiBQcm9taXNlPFRlcnJhaW5SZWFkUmVzdWx0PiB7XG4gICAgICAgIGlmICghdGhpcy5pc0xheWVySW5kZXgoaW5kZXgpKSByZXR1cm4gdGhpcy5yZWFkKHRhcmdldCk7XG4gICAgICAgIGNvbnN0IG5leHQgPSBub3JtYWxpemVMYXllclBhdGNoKHBhdGNoKTtcbiAgICAgICAgaWYgKCFuZXh0KSByZXR1cm4gdGhpcy5yZWFkKHRhcmdldCk7XG4gICAgICAgIGNvbnN0IGluaXRpYWwgPSB0aGlzLnJlc29sdmVUYXJnZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFpbml0aWFsKSByZXR1cm4gaXNUZXJyYWluVGFyZ2V0KHRhcmdldCkgPyB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KSA6IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBjb25zdCB1bmRvU2VydmljZSA9IHRoaXMuZ2V0VGVycmFpblVuZG9TZXJ2aWNlKCk7XG4gICAgICAgIGlmICghdW5kb1NlcnZpY2UpIHJldHVybiB0aGlzLnJlYWRSZXNvbHZlZCh0YXJnZXQsIGluaXRpYWwuZ2l6bW8pO1xuICAgICAgICBjb25zdCBhc3NldHMgPSBhd2FpdCB0aGlzLmxvYWRMYXllckFzc2V0cyhuZXh0KTtcbiAgICAgICAgaWYgKCFhc3NldHMpIHJldHVybiB0aGlzLnJlYWQodGFyZ2V0KTtcblxuICAgICAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZVRhcmdldCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlc29sdmVkKSByZXR1cm4gaXNUZXJyYWluVGFyZ2V0KHRhcmdldCkgPyB0aGlzLmludmFsaWRSZXN1bHQodGFyZ2V0KSA6IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBjb25zdCBiZWZvcmUgPSBjb3B5TGF5ZXJTdGF0ZXMocmVzb2x2ZWQuZ2l6bW8ucmVhZFRlcnJhaW5TdGF0ZSgpLmxheWVycyk7XG4gICAgICAgIGlmICghdGhpcy51cGRhdGVUZXJyYWluTGF5ZXIocmVzb2x2ZWQuY29tcG9uZW50LCBpbmRleCwgbmV4dCwgYXNzZXRzKSkgcmV0dXJuIHRoaXMucmVhZCh0YXJnZXQpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVhZCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlc3VsdC52YWxpZCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSBjb3B5TGF5ZXJTdGF0ZXMocmVzdWx0LmxheWVycyk7XG4gICAgICAgIHRoaXMucHVzaFRlcnJhaW5VbmRvKHVuZG9TZXJ2aWNlLCByZXNvbHZlZC5jb21wb25lbnQsICdVcGRhdGUgVGVycmFpbiBMYXllcicsICd0ZXJyYWluOnVwZGF0ZS1sYXllcicsXG4gICAgICAgICAgICAoKSA9PiB0aGlzLmFwcGx5VGVycmFpbkxheWVyU3RhdGVzKHJlc29sdmVkLmNvbXBvbmVudCwgYmVmb3JlKSxcbiAgICAgICAgICAgICgpID0+IHRoaXMuYXBwbHlUZXJyYWluTGF5ZXJTdGF0ZXMocmVzb2x2ZWQuY29tcG9uZW50LCBhZnRlcikpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNMYXllckluZGV4KGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIoaW5kZXgpICYmIGluZGV4ID49IDAgJiYgaW5kZXggPCBURVJSQUlOX01BWF9MQVlFUl9DT1VOVDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzQXR0YWNoZWRUZXJyYWluKGNvbXBvbmVudDogVGVycmFpbik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1RlcnJhaW5Db21wb25lbnQoY29tcG9uZW50KVxuICAgICAgICAgICAgJiYgKGNvbXBvbmVudCBhcyBhbnkpLmlzVmFsaWQgIT09IGZhbHNlXG4gICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KGNvbXBvbmVudC5ub2RlPy5jb21wb25lbnRzKVxuICAgICAgICAgICAgJiYgY29tcG9uZW50Lm5vZGUuY29tcG9uZW50cy5pbmNsdWRlcyhjb21wb25lbnQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlVGVycmFpbkluZm8oc3RhdGU6IElUZXJyYWluTWFuYWdlU3RhdGUpOiBUZXJyYWluSW5mbyB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBuZXcgVGVycmFpbkluZm8oKTtcbiAgICAgICAgaW5mby50aWxlU2l6ZSA9IHN0YXRlLnRpbGVTaXplO1xuICAgICAgICBpbmZvLndlaWdodE1hcFNpemUgPSBzdGF0ZS53ZWlnaHRNYXBTaXplO1xuICAgICAgICBpbmZvLmxpZ2h0TWFwU2l6ZSA9IHN0YXRlLmxpZ2h0TWFwU2l6ZTtcbiAgICAgICAgaW5mby5ibG9ja0NvdW50ID0gW3N0YXRlLmJsb2NrQ291bnRbMF0sIHN0YXRlLmJsb2NrQ291bnRbMV1dO1xuICAgICAgICByZXR1cm4gaW5mbztcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVRlcnJhaW5MYXllcihzdGF0ZTogSVRlcnJhaW5MYXllclN0YXRlLCBhc3NldHM6IElUZXJyYWluTGF5ZXJBc3NldHMpOiBUZXJyYWluTGF5ZXIge1xuICAgICAgICBjb25zdCBsYXllciA9IG5ldyBUZXJyYWluTGF5ZXIoKTtcbiAgICAgICAgbGF5ZXIuZGV0YWlsTWFwID0gYXNzZXRzLmRldGFpbE1hcCA/PyBudWxsO1xuICAgICAgICBsYXllci5ub3JtYWxNYXAgPSBhc3NldHMubm9ybWFsTWFwID8/IG51bGw7XG4gICAgICAgIGxheWVyLm1ldGFsbGljID0gc3RhdGUubWV0YWxsaWM7XG4gICAgICAgIGxheWVyLnJvdWdobmVzcyA9IHN0YXRlLnJvdWdobmVzcztcbiAgICAgICAgbGF5ZXIudGlsZVNpemUgPSBzdGF0ZS50aWxlU2l6ZTtcbiAgICAgICAgcmV0dXJuIGxheWVyO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgbG9hZFRlcnJhaW5UZXh0dXJlKHV1aWQ6IHN0cmluZywgdXNhZ2UgPSAnbGF5ZXInKTogUHJvbWlzZTxUZXh0dXJlMkQgfCBudWxsPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gYXdhaXQgbG9hZEFueTxUZXh0dXJlMkQ+KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIHRleHR1cmUgaW5zdGFuY2VvZiBUZXh0dXJlMkQgPyB0ZXh0dXJlIDogbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1RlcnJhaW5dIGxvYWQgJHt1c2FnZX0gdGV4dHVyZSBmYWlsZWQ6ICR7dXVpZH1gLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgbG9hZExheWVyQXNzZXRzKHZhbHVlOiBQaWNrPElUZXJyYWluTGF5ZXJTdGF0ZSwgJ2RldGFpbE1hcFV1aWQnIHwgJ25vcm1hbE1hcFV1aWQnPiB8IElUZXJyYWluTGF5ZXJQYXRjaCk6IFByb21pc2U8SVRlcnJhaW5MYXllckFzc2V0cyB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgYXNzZXRzOiBJVGVycmFpbkxheWVyQXNzZXRzID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIFsnZGV0YWlsTWFwVXVpZCcsICdub3JtYWxNYXBVdWlkJ10gYXMgY29uc3QpIHtcbiAgICAgICAgICAgIGlmICghT2JqZWN0Lmhhc093bih2YWx1ZSwga2V5KSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdmFsdWVba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0S2V5ID0ga2V5ID09PSAnZGV0YWlsTWFwVXVpZCcgPyAnZGV0YWlsTWFwJyA6ICdub3JtYWxNYXAnO1xuICAgICAgICAgICAgaWYgKHV1aWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhc3NldHNbYXNzZXRLZXldID0gbnVsbDtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IGF3YWl0IHRoaXMubG9hZFRlcnJhaW5UZXh0dXJlKHV1aWQpO1xuICAgICAgICAgICAgaWYgKCF0ZXh0dXJlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGFzc2V0c1thc3NldEtleV0gPSB0ZXh0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3NldHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhcHBseVRlcnJhaW5NYW5hZ2VTdGF0ZShjb21wb25lbnQ6IFRlcnJhaW4sIHN0YXRlOiBJVGVycmFpbk1hbmFnZVN0YXRlKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGhpcy5pc0F0dGFjaGVkVGVycmFpbihjb21wb25lbnQpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5yZWJ1aWxkKHRoaXMuY3JlYXRlVGVycmFpbkluZm8oc3RhdGUpKTtcbiAgICAgICAgdGhpcy5yZXBvcnRUZXJyYWluQXV0aG9yaW5nQ2hhbmdlKGNvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkVGVycmFpbkxheWVyKGNvbXBvbmVudDogVGVycmFpbiwgc3RhdGU6IElUZXJyYWluTGF5ZXJTdGF0ZSwgYXNzZXRzOiBJVGVycmFpbkxheWVyQXNzZXRzKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGhpcy5pc0F0dGFjaGVkVGVycmFpbihjb21wb25lbnQpIHx8ICFhc3NldHMuZGV0YWlsTWFwKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChjb21wb25lbnQuYWRkTGF5ZXIodGhpcy5jcmVhdGVUZXJyYWluTGF5ZXIoc3RhdGUsIGFzc2V0cykpIDwgMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aGlzLnJlcG9ydFRlcnJhaW5BdXRob3JpbmdDaGFuZ2UoY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW1vdmVUZXJyYWluTGF5ZXIoY29tcG9uZW50OiBUZXJyYWluLCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGhpcy5pc0F0dGFjaGVkVGVycmFpbihjb21wb25lbnQpIHx8ICFjb21wb25lbnQuZ2V0TGF5ZXIoaW5kZXgpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5yZW1vdmVMYXllcihpbmRleCk7XG4gICAgICAgIHRoaXMucmVwb3J0VGVycmFpbkF1dGhvcmluZ0NoYW5nZShjb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVRlcnJhaW5MYXllcihjb21wb25lbnQ6IFRlcnJhaW4sIGluZGV4OiBudW1iZXIsIHBhdGNoOiBJVGVycmFpbkxheWVyUGF0Y2gsIGFzc2V0czogSVRlcnJhaW5MYXllckFzc2V0cyk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNBdHRhY2hlZFRlcnJhaW4oY29tcG9uZW50KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBsYXllciA9IGNvbXBvbmVudC5nZXRMYXllcihpbmRleCk7XG4gICAgICAgIGlmICghbGF5ZXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd24ocGF0Y2gsICdkZXRhaWxNYXBVdWlkJykpIGxheWVyLmRldGFpbE1hcCA9IGFzc2V0cy5kZXRhaWxNYXAgPz8gbnVsbDtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd24ocGF0Y2gsICdub3JtYWxNYXBVdWlkJykpIGxheWVyLm5vcm1hbE1hcCA9IGFzc2V0cy5ub3JtYWxNYXAgPz8gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXRjaC5tZXRhbGxpYyA9PT0gJ251bWJlcicpIGxheWVyLm1ldGFsbGljID0gcGF0Y2gubWV0YWxsaWM7XG4gICAgICAgIGlmICh0eXBlb2YgcGF0Y2gucm91Z2huZXNzID09PSAnbnVtYmVyJykgbGF5ZXIucm91Z2huZXNzID0gcGF0Y2gucm91Z2huZXNzO1xuICAgICAgICBpZiAodHlwZW9mIHBhdGNoLnRpbGVTaXplID09PSAnbnVtYmVyJykgbGF5ZXIudGlsZVNpemUgPSBwYXRjaC50aWxlU2l6ZTtcbiAgICAgICAgdGhpcy5yZXBvcnRUZXJyYWluQXV0aG9yaW5nQ2hhbmdlKGNvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYXBwbHlUZXJyYWluTGF5ZXJTdGF0ZXMoY29tcG9uZW50OiBUZXJyYWluLCBzdGF0ZXM6IEFycmF5PElUZXJyYWluTGF5ZXJTdGF0ZSB8IG51bGw+KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IFByb21pc2UuYWxsKHN0YXRlcy5tYXAoYXN5bmMgKHN0YXRlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXN0YXRlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0cyA9IGF3YWl0IHRoaXMubG9hZExheWVyQXNzZXRzKHN0YXRlKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldHMgPyB7IHN0YXRlLCBhc3NldHMgfSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfSkpO1xuICAgICAgICBpZiAobG9hZGVkLnNvbWUoKHZhbHVlLCBpbmRleCkgPT4gc3RhdGVzW2luZGV4XSAhPT0gbnVsbCAmJiB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB8fCAhdGhpcy5pc0F0dGFjaGVkVGVycmFpbihjb21wb25lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgVEVSUkFJTl9NQVhfTEFZRVJfQ09VTlQ7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyID0gbG9hZGVkW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChsYXllcikgY29tcG9uZW50LnNldExheWVyKGluZGV4LCB0aGlzLmNyZWF0ZVRlcnJhaW5MYXllcihsYXllci5zdGF0ZSwgbGF5ZXIuYXNzZXRzKSk7XG4gICAgICAgICAgICBlbHNlIGNvbXBvbmVudC5yZW1vdmVMYXllcihpbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXBvcnRUZXJyYWluQXV0aG9yaW5nQ2hhbmdlKGNvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVwb3J0VGVycmFpbkF1dGhvcmluZ0NoYW5nZShjb21wb25lbnQ6IFRlcnJhaW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudC5fYXNzZXQpIGNvbXBvbmVudC5leHBvcnRMYXllckxpc3RUb0Fzc2V0KGNvbXBvbmVudC5fYXNzZXQpO1xuICAgICAgICB0aGlzLnNldERpcnR5KGNvbXBvbmVudCwgdHJ1ZSk7XG4gICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBjb21wb25lbnQubm9kZSwgeyB0eXBlOiAnY29tcG9uZW50LWNoYW5nZWQnIH0pO1xuICAgICAgICBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlPHsgcmVwYWludEluRWRpdE1vZGUoKTogdm9pZCB9PignRW5naW5lJyk/LnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRUZXJyYWluVW5kb1NlcnZpY2UoKTogSVVuZG9TZXJ2aWNlIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IHVuZG9TZXJ2aWNlID0gcXVlcnlSZWdpc3RlcmVkU2VydmljZTxJVW5kb1NlcnZpY2U+KCdVbmRvJyk7XG4gICAgICAgIHJldHVybiB1bmRvU2VydmljZSAmJiAhdW5kb1NlcnZpY2UuaXNBcHBseWluZygpID8gdW5kb1NlcnZpY2UgOiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgcHVzaFRlcnJhaW5VbmRvKFxuICAgICAgICB1bmRvU2VydmljZTogSVVuZG9TZXJ2aWNlLFxuICAgICAgICBjb21wb25lbnQ6IFRlcnJhaW4sXG4gICAgICAgIGxhYmVsOiBzdHJpbmcsXG4gICAgICAgIHR5cGU6IHN0cmluZyxcbiAgICAgICAgdW5kbzogKCkgPT4gYm9vbGVhbiB8IFByb21pc2U8Ym9vbGVhbj4sXG4gICAgICAgIHJlZG86ICgpID0+IGJvb2xlYW4gfCBQcm9taXNlPGJvb2xlYW4+LFxuICAgICk6IHZvaWQge1xuICAgICAgICBjb25zdCBpZCA9IGAke3R5cGV9OiR7Kyt0aGlzLl90ZXJyYWluVW5kb1NlcXVlbmNlfWA7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGFzeW5jIChhcHBseTogKCkgPT4gYm9vbGVhbiB8IFByb21pc2U8Ym9vbGVhbj4pOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4gPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2Vzc1xuICAgICAgICAgICAgICAgID8geyBzdWNjZXNzOiB0cnVlLCBjb21tYW5kSWQ6IGlkLCBsYWJlbCB9XG4gICAgICAgICAgICAgICAgOiB7IHN1Y2Nlc3M6IGZhbHNlLCBjb21tYW5kSWQ6IGlkLCBsYWJlbCwgcmVhc29uOiAnVGVycmFpbiB0YXJnZXQgb3IgdGV4dHVyZSBpcyB1bmF2YWlsYWJsZScgfTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY29tbWFuZDogSVVuZG9Db21tYW5kID0ge1xuICAgICAgICAgICAgbWV0YTogeyBpZCwgbGFiZWwsIHR5cGUsIHNjb3BlOiB7IGVkaXRvclR5cGU6ICdzY2VuZScgfSwgdGltZXN0YW1wOiBEYXRlLm5vdygpIH0sXG4gICAgICAgICAgICB1bmRvOiAoKSA9PiByZXN1bHQodW5kbyksXG4gICAgICAgICAgICByZWRvOiAoKSA9PiByZXN1bHQocmVkbyksXG4gICAgICAgIH07XG4gICAgICAgIHVuZG9TZXJ2aWNlLnB1c2goY29tbWFuZCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRNYW5hZ2VyKGNvbXBvbmVudDogVGVycmFpbiwgdmFsdWU6IGFueSkge1xuICAgICAgICAoY29tcG9uZW50IGFzIGFueSkubWFuYWdlciA9IHZhbHVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0RGlydHkoY29tcG9uZW50OiBUZXJyYWluLCB2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuaXNUZXJyYWluQ2hhbmdlID0gdmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCd0ZXJyYWluOmNoYW5nZWQnLCBjb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBpc1RlcnJhaW5DaGFuZ2UoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRlZENvbXBvbmVudHMuc29tZSgoY29tcG9uZW50KSA9PiAoY29tcG9uZW50IGFzIGFueSkuaXNUZXJyYWluQ2hhbmdlID09PSB0cnVlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGlzVGVycmFpbkNoYW5nZSh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiB0aGlzLnNlbGVjdGVkQ29tcG9uZW50cykge1xuICAgICAgICAgICAgdGhpcy5zZXREaXJ0eShjb21wb25lbnQsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZWxlY3Qobm9kZVV1aWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnRlcnJhaW5PZlV1aWQobm9kZVV1aWQpO1xuICAgICAgICBpZiAoIWNvbXBvbmVudCkgcmV0dXJuO1xuICAgICAgICB0aGlzLnNldE1hbmFnZXIoY29tcG9uZW50LCB0aGlzKTtcbiAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkQ29tcG9uZW50cy5pbmNsdWRlcyhjb21wb25lbnQpKSB0aGlzLnNlbGVjdGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIGlmICghdGhpcy5lZGl0ZWRDb21wb25lbnRzLmluY2x1ZGVzKGNvbXBvbmVudCkpIHRoaXMuZWRpdGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVuc2VsZWN0KG5vZGVVdWlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy50ZXJyYWluT2ZVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgaWYgKCFjb21wb25lbnQpIHJldHVybjtcbiAgICAgICAgdGhpcy5zZXRNYW5hZ2VyKGNvbXBvbmVudCwgbnVsbCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkSW5kZXggPSB0aGlzLnNlbGVjdGVkQ29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudCk7XG4gICAgICAgIGlmIChzZWxlY3RlZEluZGV4ID49IDApIHRoaXMuc2VsZWN0ZWRDb21wb25lbnRzLnNwbGljZShzZWxlY3RlZEluZGV4LCAxKTtcbiAgICAgICAgLy8gS2VlcCBlZGl0ZWRDb21wb25lbnRzIHVudGlsIHRoZSBub2RlIGlzIHJlbW92ZWQsIGxpa2UgdGhlIDMueCBtYW5hZ2VyLlxuICAgIH1cblxuICAgIHB1YmxpYyBvblNlbGVjdGlvblNlbGVjdChwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IGdldEVkaXRvck5vZGVCeVBhdGgocGF0aCk7XG4gICAgICAgIGlmIChub2RlKSB0aGlzLnNlbGVjdChub2RlLnV1aWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblNlbGVjdGlvblVuc2VsZWN0KHBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBub2RlID0gZ2V0RWRpdG9yTm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgaWYgKG5vZGUpIHRoaXMudW5zZWxlY3Qobm9kZS51dWlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25TZWxlY3Rpb25DbGVhcigpOiB2b2lkIHtcbiAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgdGhpcy5zZWxlY3RlZENvbXBvbmVudHMpIHRoaXMuc2V0TWFuYWdlcihjb21wb25lbnQsIG51bGwpO1xuICAgICAgICB0aGlzLnNlbGVjdGVkQ29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVSZW1vdmVkKG5vZGU6IGFueSk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnRlcnJhaW5PZk5vZGUobm9kZSk7XG4gICAgICAgIGlmICghY29tcG9uZW50KSByZXR1cm47XG4gICAgICAgIHRoaXMucmVtb3ZlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uQ29tcG9uZW50UmVtb3ZlZChjb21wb25lbnQ6IENvbXBvbmVudCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5pc1RlcnJhaW5Db21wb25lbnQoY29tcG9uZW50KSkgdGhpcy5yZW1vdmVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZUNvbXBvbmVudChjb21wb25lbnQ6IFRlcnJhaW4pIHtcbiAgICAgICAgdGhpcy5zZXRNYW5hZ2VyKGNvbXBvbmVudCwgbnVsbCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZENvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpO1xuICAgICAgICBpZiAoc2VsZWN0ZWQgPj0gMCkgdGhpcy5zZWxlY3RlZENvbXBvbmVudHMuc3BsaWNlKHNlbGVjdGVkLCAxKTtcbiAgICAgICAgY29uc3QgZWRpdGVkID0gdGhpcy5lZGl0ZWRDb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KTtcbiAgICAgICAgaWYgKGVkaXRlZCA+PSAwKSB0aGlzLmVkaXRlZENvbXBvbmVudHMuc3BsaWNlKGVkaXRlZCwgMSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uU2N1bHB0KG5vZGU6IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVtaXQoJ3RlcnJhaW46c2N1bHB0Jywgbm9kZSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNlcmlhbGl6ZShjb21wb25lbnQ6IFRlcnJhaW4pOiBVaW50OEFycmF5IHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSBjb21wb25lbnQuZXhwb3J0QXNzZXQoKTtcbiAgICAgICAgLy8gVGVycmFpbkFzc2V0J3MgYmluYXJ5IGV4cG9ydCBpcyB0aGUgY2Fub25pY2FsIC50ZXJyYWluIG5hdGl2ZSBwYXlsb2FkLlxuICAgICAgICByZXR1cm4gYXNzZXQuX2V4cG9ydE5hdGl2ZURhdGEoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2F2ZUFzc2V0KGlzQ2xvc2UgPSBmYWxzZSwgY29tcG9uZW50PzogVGVycmFpbik6IFByb21pc2U8MCB8IDEgfCAyPiB7XG4gICAgICAgIHZvaWQgaXNDbG9zZTtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IGNvbXBvbmVudCA/IFtjb21wb25lbnRdIDogdGhpcy5lZGl0ZWRDb21wb25lbnRzO1xuICAgICAgICBsZXQgcmVzdWx0OiAwIHwgMSB8IDIgPSAxO1xuICAgICAgICBmb3IgKGNvbnN0IHRlcnJhaW4gb2YgdGFyZ2V0cykge1xuICAgICAgICAgICAgaWYgKCEodGVycmFpbiBhcyBhbnkpLmlzVGVycmFpbkNoYW5nZSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdGVycmFpbi5fYXNzZXQ/Ll91dWlkO1xuICAgICAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gMjtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBzY2VuZUFzc2V0QmluYXJ5Q2xpZW50LnNhdmUodXVpZCwgdGhpcy5zZXJpYWxpemUodGVycmFpbikpO1xuICAgICAgICAgICAgICAgIGlmICghc2F2ZWQgfHwgc2F2ZWQudXVpZCAhPT0gdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAyO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREaXJ0eSh0ZXJyYWluLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gMDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1RlcnJhaW5dIHNhdmVBc3NldCBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2F2ZUFzc2V0RGlhbG9nKGZpbGU/OiBzdHJpbmcsIGlzQ2xvc2UgPSBmYWxzZSk6IFByb21pc2U8MCB8IDEgfCAyPiB7XG4gICAgICAgIGxldCByZXN1bHQ6IDAgfCAxIHwgMiA9IDE7XG4gICAgICAgIGZvciAoY29uc3QgdGVycmFpbiBvZiB0aGlzLmVkaXRlZENvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGlmICghKHRlcnJhaW4gYXMgYW55KS5pc1RlcnJhaW5DaGFuZ2UpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHRlcnJhaW4uX2Fzc2V0Py5fdXVpZDtcbiAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IGF3YWl0IHRoaXMuc2F2ZUFzc2V0KGlzQ2xvc2UsIHRlcnJhaW4pO1xuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAyKSByZXN1bHQgPSAyO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvZGUgPT09IDApIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vIFVJIGlzIGludGVudGlvbmFsbHkgaW1wbGVtZW50ZWQgaGVyZS4gcGluayBjYW4gcGFzcyBhIGRiOi8vIHRhcmdldFxuICAgICAgICAgICAgLy8gdGhyb3VnaCBgZmlsZWAgdG8gY3JlYXRlIHRoZSBhc3NldCwgb3IgdXNlIGl0cyBvd24gU2F2ZSBBcyBkaWFsb2cuXG4gICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAyO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgc2NlbmVBc3NldEJpbmFyeUNsaWVudC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJ3cml0ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogdGhpcy5zZXJpYWxpemUodGVycmFpbiksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgKHRlcnJhaW4gYXMgYW55KS5fYXNzZXQgPSBhd2FpdCBsb2FkQW55PFRlcnJhaW5Bc3NldD4oY3JlYXRlZC51dWlkID8/IGNyZWF0ZWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldERpcnR5KHRlcnJhaW4sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1RlcnJhaW5dIGNyZWF0ZSB0ZXJyYWluIGFzc2V0IGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjbG9zZSgpOiBQcm9taXNlPDAgfCAxIHwgMj4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNUZXJyYWluQ2hhbmdlKSByZXR1cm4gMTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZUFzc2V0RGlhbG9nKHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZEFzc2V0VG9Db21wKGFzc2V0VXVpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGZvciAoY29uc3QgdGVycmFpbiBvZiB0aGlzLnNlbGVjdGVkQ29tcG9uZW50cykge1xuICAgICAgICAgICAgaWYgKGFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICh0ZXJyYWluIGFzIGFueSkuX2Fzc2V0ID0gYXdhaXQgbG9hZEFueTxUZXJyYWluQXNzZXQ+KGFzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgICAgICh0ZXJyYWluIGFzIGFueSkuX2Fzc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEodGVycmFpbiBhcyBhbnkpLl9hc3NldCkge1xuICAgICAgICAgICAgICAgICh0ZXJyYWluIGFzIGFueSkuX2Fzc2V0ID0gbmV3IFRlcnJhaW5Bc3NldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RGlydHkodGVycmFpbiwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgU2VydmljZUV2ZW50cy5lbWl0KCdub2RlOmNoYW5nZScsIHRlcnJhaW4ubm9kZSwgeyB0eXBlOiAnY29tcG9uZW50LWNoYW5nZWQnIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uQXNzZXREZWxldGVkKHV1aWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBmb3IgKGNvbnN0IHRlcnJhaW4gb2YgdGhpcy5lZGl0ZWRDb21wb25lbnRzKSB7XG4gICAgICAgICAgICBpZiAodGVycmFpbi5fYXNzZXQ/Ll91dWlkID09PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgU2VydmljZUV2ZW50cy5lbWl0KCdub2RlOmNoYW5nZScsIHRlcnJhaW4ubm9kZSwgeyB0eXBlOiAnY29tcG9uZW50LWNoYW5nZWQnIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yQ2xvc2VkKCk6IHZvaWQge1xuICAgICAgICB0aGlzLm9uU2VsZWN0aW9uQ2xlYXIoKTtcbiAgICAgICAgdGhpcy5lZGl0ZWRDb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yRGlzcG9zZWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMub25FZGl0b3JDbG9zZWQoKTtcbiAgICB9XG59XG4iXX0=