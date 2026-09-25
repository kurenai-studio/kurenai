"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceImageService = void 0;
/** Scene-side reference-image runtime: it renders ephemeral editor nodes from main-process authority state. */
const cc_1 = require("cc");
const common_1 = require("../../common");
const rpc_1 = require("../rpc");
const core_1 = require("./core");
const message_1 = require("./message");
const DEFAULT_CONFIG = {
    images: [],
    sceneBindings: {},
    desiredVisible: true,
};
/**
 * Editor-only reference image overlay. It owns no scene data: all runtime nodes
 * live under Gizmo.backgroundNode and are explicitly DontSave/hidden.
 */
let ReferenceImageService = class ReferenceImageService extends core_1.BaseService {
    config = DEFAULT_CONFIG;
    currentSceneUuid = null;
    canvasNode = null;
    imageNode = null;
    sprite = null;
    spriteFrame = null;
    loadedPath = null;
    missingPaths = new Set();
    error = null;
    /** Last main-process authority revision applied to this Webview's renderer. */
    authorityRevision = null;
    /** Runtime identity paired with authorityRevision to survive main-process restarts. */
    authorityInstanceId = null;
    authorityApplyQueue = Promise.resolve();
    loadGeneration = 0;
    activeInteractionId = null;
    interactionWatermark = 0;
    previewPatch = null;
    async init() {
        core_1.ServiceEvents.on('scene:dimension-changed', this.onDimensionChanged);
        await this.reconcileCurrentEditor(false);
    }
    async getState() {
        await this.pullAuthoritySnapshot();
        return this.createState();
    }
    async addAndSelect(options) {
        const path = this.validatePath(options?.path);
        const sceneUuid = this.requireCurrentScene();
        const frame = await this.createSpriteFrameForPath(path);
        frame.destroy();
        return this.mutateAuthority({ type: 'add-and-select', path, sceneUuid }, true);
    }
    async remove(options) {
        const path = this.validatePath(options?.path);
        this.missingPaths.delete(path);
        return this.mutateAuthority({ type: 'remove', path }, true);
    }
    async select(options) {
        const path = this.validatePath(options?.path);
        const sceneUuid = this.requireCurrentScene();
        const frame = await this.createSpriteFrameForPath(path);
        frame.destroy();
        return this.mutateAuthority({ type: 'select', path, sceneUuid }, true);
    }
    async clearBinding() {
        const sceneUuid = this.requireCurrentScene();
        this.invalidatePreview();
        return this.mutateAuthority({ type: 'clear-binding', sceneUuid }, true);
    }
    async setVisible(options) {
        if (typeof options?.desiredVisible !== 'boolean') {
            throw new Error('desiredVisible must be a boolean.');
        }
        return this.mutateAuthority({ type: 'set-visible', desiredVisible: options.desiredVisible }, false);
    }
    async refresh() {
        const before = this.createRuntimeStateKey();
        const authorityChanged = await this.pullAuthoritySnapshot();
        this.invalidatePreview();
        this.error = null;
        await this.loadBoundImage(true);
        if (authorityChanged || before !== this.createRuntimeStateKey())
            this.publishState();
        return this.createState();
    }
    async previewParameters(options) {
        const interactionId = this.validateInteractionId(options?.interactionId);
        if (interactionId <= this.interactionWatermark
            || (this.activeInteractionId !== null && interactionId < this.activeInteractionId)) {
            return this.createState();
        }
        const patch = this.validateParameters(options?.patch);
        this.requireCurrentImage();
        if (this.activeInteractionId !== interactionId) {
            this.activeInteractionId = interactionId;
            this.previewPatch = null;
        }
        this.previewPatch = { ...this.previewPatch, ...patch };
        this.applyCurrentParameters();
        return this.createState();
    }
    async commitParameters(options) {
        const interactionId = options?.interactionId === undefined ? undefined : this.validateInteractionId(options.interactionId);
        if (interactionId !== undefined && interactionId <= this.interactionWatermark) {
            return this.createState();
        }
        const patch = this.validateParameters(options?.patch);
        const sceneUuid = this.requireCurrentScene();
        this.requireCurrentImage();
        this.closeInteraction(interactionId);
        this.error = null;
        return this.mutateAuthority({ type: 'commit-parameters', sceneUuid, patch }, false, false, true);
    }
    async cancelPreview(options) {
        const interactionId = this.validateInteractionId(options?.interactionId);
        if (interactionId <= this.interactionWatermark) {
            return this.createState();
        }
        this.closeInteraction(interactionId);
        this.applyCurrentParameters();
        return this.createState();
    }
    onEditorOpened() {
        void this.reconcileCurrentEditor(true);
    }
    onEditorClosed() {
        this.currentSceneUuid = null;
        this.invalidatePreview();
        this.clearRuntime(true);
        this.error = null;
        this.publishState();
    }
    onDimensionChanged = () => {
        void this.handleDimensionChanged();
    };
    async handleDimensionChanged() {
        if (await this.reconcileRuntime())
            this.publishState();
    }
    /** Socket entrypoint; reconnects reconcile runtime even when authority revision is unchanged. */
    async syncFromAuthority(publish = true) {
        const authorityChanged = await this.pullAuthoritySnapshot();
        const runtimeChanged = await this.reconcileRuntime();
        if (publish && (authorityChanged || runtimeChanged))
            this.publishState();
    }
    /** Pulls authority only; callers decide whether the renderer should be reconciled. */
    async pullAuthoritySnapshot() {
        try {
            const snapshot = await rpc_1.Rpc.getInstance().request('referenceImageStore', 'getSnapshot');
            return await this.enqueueAuthoritySnapshot(snapshot, false, false);
        }
        catch (error) {
            this.error = { stage: 'config', message: error instanceof Error ? error.message : String(error) };
            console.warn('[ReferenceImage] failed to synchronize authority:', error);
            return false;
        }
    }
    async reconcileCurrentEditor(publish) {
        let editorChanged = false;
        const nextSceneUuid = this.getEditorSession().uuid;
        if (nextSceneUuid !== this.currentSceneUuid) {
            editorChanged = true;
            this.currentSceneUuid = nextSceneUuid;
            this.invalidatePreview();
            this.clearRuntime(true);
            this.error = null;
        }
        const authorityChanged = await this.pullAuthoritySnapshot();
        const runtimeChanged = await this.reconcileRuntime();
        if (publish && (editorChanged || authorityChanged || runtimeChanged))
            this.publishState();
    }
    /** Recreates or clears ephemeral editor objects without mutating authority state. */
    async reconcileRuntime() {
        const before = this.createRuntimeStateKey();
        if (this.is2D()) {
            await this.loadBoundImage();
        }
        else {
            this.applyVisibility();
        }
        return before !== this.createRuntimeStateKey();
    }
    createRuntimeStateKey() {
        // Only these public runtime fields determine whether a lifecycle event needs a state broadcast.
        const visibility = this.computeVisibility();
        return JSON.stringify({
            sceneUuid: this.currentSceneUuid,
            imagePath: this.getCurrentPath(),
            desiredVisible: this.config.desiredVisible,
            effectiveVisible: visibility.effectiveVisible,
            visibilityReason: visibility.reason,
            error: this.error,
        });
    }
    async loadBoundImage(force = false) {
        const path = this.getCurrentPath();
        if (!path || !this.currentSceneUuid || !this.is2D() || !this.config.desiredVisible) {
            this.clearRuntime(false);
            this.applyVisibility();
            return;
        }
        if (!force && this.loadedPath === path && this.spriteFrame) {
            this.applyCurrentParameters();
            return;
        }
        const session = this.getEditorSession();
        const generation = ++this.loadGeneration;
        let dataUrl;
        try {
            dataUrl = await this.readDataUrl(path);
        }
        catch (error) {
            if (generation !== this.loadGeneration || !this.isSessionCurrent(session))
                return;
            this.missingPaths.add(path);
            this.error = { stage: 'file', message: error instanceof Error ? error.message : String(error) };
            this.clearRuntime(false);
            this.applyVisibility();
            return;
        }
        try {
            const frame = await this.createSpriteFrame(dataUrl);
            if (generation !== this.loadGeneration || !this.isSessionCurrent(session) || path !== this.getCurrentPath()) {
                frame.destroy();
                return;
            }
            this.error = null;
            this.missingPaths.delete(path);
            this.replaceSpriteFrame(frame, path);
            this.applyCurrentParameters();
        }
        catch (error) {
            if (generation !== this.loadGeneration || !this.isSessionCurrent(session))
                return;
            this.missingPaths.delete(path);
            this.error = { stage: 'decode', message: error instanceof Error ? error.message : String(error) };
            this.clearRuntime(false);
            this.applyVisibility();
        }
    }
    async createSpriteFrameForPath(path) {
        return this.createSpriteFrame(await this.readDataUrl(path));
    }
    async readDataUrl(path) {
        return rpc_1.Rpc.getInstance().request('referenceImageFiles', 'readDataUrl', [path]);
    }
    createSpriteFrame(dataUrl) {
        const ImageCtor = globalThis.ccwindow?.Image ?? globalThis.Image;
        if (!ImageCtor) {
            return Promise.reject(new Error('Image decoding is unavailable in the scene editor.'));
        }
        return new Promise((resolve, reject) => {
            const image = new ImageCtor();
            image.onload = () => {
                try {
                    resolve(cc_1.SpriteFrame.createWithImage(image));
                }
                catch (error) {
                    reject(error);
                }
            };
            image.onerror = () => reject(new Error('Reference image decoding failed.'));
            image.src = dataUrl;
        });
    }
    ensureNodes() {
        if (this.sprite && this.imageNode && this.canvasNode)
            return;
        const background = core_1.Service.Gizmo.backgroundNode;
        if (!background)
            throw new Error('Editor gizmo background is unavailable.');
        const flags = cc_1.CCObject.Flags.DontSave | cc_1.CCObject.Flags.HideInHierarchy;
        const layer = cc_1.Layers.Enum.GIZMOS | cc_1.Layers.Enum.UI_2D | cc_1.Layers.Enum.IGNORE_RAYCAST;
        this.canvasNode = new cc_1.Node('Reference Image Canvas');
        this.canvasNode.objFlags |= flags;
        this.canvasNode.layer = layer;
        this.canvasNode.parent = background;
        this.canvasNode.addComponent(cc_1.Canvas);
        this.imageNode = new cc_1.Node('Reference Image');
        this.imageNode.objFlags |= flags;
        this.imageNode.layer = layer;
        this.imageNode.parent = this.canvasNode;
        this.imageNode.addComponent(cc_1.UITransform);
        this.sprite = this.imageNode.addComponent(cc_1.Sprite);
    }
    replaceSpriteFrame(frame, path) {
        this.ensureNodes();
        const previous = this.spriteFrame;
        this.spriteFrame = frame;
        this.loadedPath = path;
        this.sprite.spriteFrame = frame;
        if (previous && previous !== frame)
            previous.destroy();
    }
    clearRuntime(destroyNodes) {
        this.loadGeneration++;
        if (this.sprite)
            this.sprite.spriteFrame = null;
        if (this.spriteFrame)
            this.spriteFrame.destroy();
        this.spriteFrame = null;
        this.loadedPath = null;
        if (destroyNodes && this.canvasNode) {
            this.canvasNode.destroy();
            this.canvasNode = null;
            this.imageNode = null;
            this.sprite = null;
        }
    }
    applyCurrentParameters() {
        const parameters = this.getCurrentParameters();
        if (!parameters || !this.imageNode || !this.sprite) {
            this.applyVisibility();
            return;
        }
        this.imageNode.setPosition(parameters.x, parameters.y, 0);
        this.imageNode.setScale(parameters.scaleX, parameters.scaleY, 1);
        const color = this.sprite.color.clone();
        color.a = Math.round(parameters.opacity / 100 * 255);
        this.sprite.color = color;
        this.applyVisibility(false);
        void core_1.Service.Engine.repaintInEditMode();
    }
    applyVisibility(repaint = true) {
        if (this.imageNode)
            this.imageNode.active = this.computeVisibility().effectiveVisible;
        if (repaint)
            void core_1.Service.Engine.repaintInEditMode();
    }
    computeVisibility() {
        if (!this.currentSceneUuid)
            return { effectiveVisible: false, reason: 'no-editor' };
        if (!this.config.desiredVisible)
            return { effectiveVisible: false, reason: 'disabled' };
        if (!this.is2D())
            return { effectiveVisible: false, reason: 'not-2d' };
        const path = this.getCurrentPath();
        if (!path)
            return { effectiveVisible: false, reason: 'unbound' };
        if (this.missingPaths.has(path))
            return { effectiveVisible: false, reason: 'missing' };
        if (this.error)
            return { effectiveVisible: false, reason: 'load-error' };
        if (!this.spriteFrame || this.loadedPath !== path)
            return { effectiveVisible: false, reason: 'load-error' };
        return { effectiveVisible: true, reason: 'visible' };
    }
    createState() {
        const visibility = this.computeVisibility();
        const currentPath = this.getCurrentPath();
        const images = this.config.images.map((image) => ({ ...image, missing: this.missingPaths.has(image.path) }));
        const image = currentPath ? images.find((candidate) => candidate.path === currentPath) ?? null : null;
        return {
            images,
            current: { sceneUuid: this.currentSceneUuid, imagePath: currentPath, image },
            desiredVisible: this.config.desiredVisible,
            effectiveVisible: visibility.effectiveVisible,
            visibilityReason: visibility.reason,
            is2D: this.is2D(),
            hasOpenEditor: this.currentSceneUuid !== null,
            error: this.error,
        };
    }
    getCurrentPath() {
        return this.currentSceneUuid ? this.config.sceneBindings[this.currentSceneUuid] ?? null : null;
    }
    requireCurrentScene() {
        if (!this.currentSceneUuid)
            throw new Error('No scene or prefab is currently open.');
        return this.currentSceneUuid;
    }
    requireCurrentImage() {
        const path = this.getCurrentPath();
        const image = path ? this.config.images.find((candidate) => candidate.path === path) : undefined;
        if (!image)
            throw new Error('The current scene or prefab has no reference image binding.');
        return image;
    }
    getCurrentParameters() {
        const image = this.getCurrentPath()
            ? this.config.images.find((candidate) => candidate.path === this.getCurrentPath())
            : undefined;
        return image ? { ...image, ...this.previewPatch } : null;
    }
    async mutateAuthority(mutation, invalidatePreview, clearError = true, applyRuntimeOnNoop = false) {
        const snapshot = await rpc_1.Rpc.getInstance().request('referenceImageStore', 'mutate', [mutation]);
        if (invalidatePreview)
            this.invalidatePreview();
        if (clearError && snapshot.changed)
            this.error = null;
        const applied = await this.enqueueAuthoritySnapshot(snapshot, snapshot.changed, true);
        if (applyRuntimeOnNoop && !snapshot.changed && !applied)
            this.applyCurrentParameters();
        return this.createState();
    }
    async enqueueAuthoritySnapshot(snapshot, publish, reconcileRuntime = false) {
        let resolveTask;
        let rejectTask;
        const result = new Promise((resolve, reject) => {
            resolveTask = resolve;
            rejectTask = reject;
        });
        this.authorityApplyQueue = this.authorityApplyQueue
            .catch(() => undefined)
            .then(async () => {
            try {
                resolveTask(await this.applyAuthoritySnapshot(snapshot, publish, reconcileRuntime));
            }
            catch (error) {
                rejectTask(error);
            }
        });
        return result;
    }
    async applyAuthoritySnapshot(snapshot, publish, reconcileRuntime) {
        if (!snapshot
            || typeof snapshot.instanceId !== 'string'
            || !snapshot.instanceId
            || !Number.isSafeInteger(snapshot.revision)
            || snapshot.revision < 0) {
            throw new Error('Reference image authority returned an invalid snapshot.');
        }
        // A socket notification may arrive before the RPC response that caused it.
        // Never let an older or already-applied response roll the renderer back.
        if (this.authorityInstanceId === snapshot.instanceId
            && this.authorityRevision !== null
            && snapshot.revision <= this.authorityRevision) {
            return false;
        }
        const previewTargetPath = this.activeInteractionId === null ? null : this.getCurrentPath();
        this.config = (0, common_1.normalizeReferenceImageConfig)(snapshot.config);
        this.authorityInstanceId = snapshot.instanceId;
        this.authorityRevision = snapshot.revision;
        // Authority snapshots describe the whole shared library. Keep a local slider
        // interaction alive when another Scene changes unrelated library entries; its
        // commit is still applied against the Store's latest configuration. A changed
        // or removed current binding is the actual boundary that invalidates the edit.
        if (this.activeInteractionId !== null
            && (!previewTargetPath
                || this.getCurrentPath() !== previewTargetPath
                || !this.config.images.some((image) => image.path === previewTargetPath))) {
            this.invalidatePreview();
        }
        if (reconcileRuntime)
            await this.reconcileRuntime();
        if (publish)
            this.publishState();
        return true;
    }
    publishState() {
        const state = this.createState();
        this.broadcast('reference-image:state-changed', state);
        message_1.messageManager.broadcast('reference-image:state-changed', state);
    }
    invalidatePreview() {
        if (this.activeInteractionId !== null) {
            this.interactionWatermark = Math.max(this.interactionWatermark, this.activeInteractionId);
        }
        this.activeInteractionId = null;
        this.previewPatch = null;
    }
    closeInteraction(interactionId) {
        this.interactionWatermark = Math.max(this.interactionWatermark, interactionId ?? this.activeInteractionId ?? 0);
        this.activeInteractionId = null;
        this.previewPatch = null;
    }
    validatePath(path) {
        if (typeof path !== 'string' || !path)
            throw new Error('Reference image path is required.');
        return path;
    }
    validateInteractionId(value) {
        if (!Number.isSafeInteger(value) || value <= 0) {
            throw new Error('interactionId must be a positive safe integer.');
        }
        return value;
    }
    validateParameters(patch) {
        return (0, common_1.validateReferenceImageParameters)(patch);
    }
    is2D() {
        try {
            return Boolean(core_1.Service.Gizmo.is2D);
        }
        catch {
            return false;
        }
    }
    getEditorSession() {
        const editor = core_1.Service.Editor;
        return editor.getEditorSession?.() ?? { uuid: null, generation: 0 };
    }
    isSessionCurrent(session) {
        const editor = core_1.Service.Editor;
        return editor.isCurrentEditorSession?.(session) ?? session.uuid === this.getEditorSession().uuid;
    }
};
exports.ReferenceImageService = ReferenceImageService;
exports.ReferenceImageService = ReferenceImageService = __decorate([
    (0, core_1.register)('ReferenceImage')
], ReferenceImageService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlLWltYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3JlZmVyZW5jZS1pbWFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwrR0FBK0c7QUFDL0csMkJBQTZGO0FBQzdGLHlDQW1Cc0I7QUFDdEIsZ0NBQTZCO0FBQzdCLGlDQUF1RTtBQUN2RSx1Q0FBMkM7QUFFM0MsTUFBTSxjQUFjLEdBQTBCO0lBQzFDLE1BQU0sRUFBRSxFQUFFO0lBQ1YsYUFBYSxFQUFFLEVBQUU7SUFDakIsY0FBYyxFQUFFLElBQUk7Q0FDdkIsQ0FBQztBQUlGOzs7R0FHRztBQUVJLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsa0JBQWtDO0lBQ2pFLE1BQU0sR0FBMEIsY0FBYyxDQUFDO0lBQy9DLGdCQUFnQixHQUFrQixJQUFJLENBQUM7SUFDdkMsVUFBVSxHQUFnQixJQUFJLENBQUM7SUFDL0IsU0FBUyxHQUFnQixJQUFJLENBQUM7SUFDOUIsTUFBTSxHQUFrQixJQUFJLENBQUM7SUFDN0IsV0FBVyxHQUF1QixJQUFJLENBQUM7SUFDdkMsVUFBVSxHQUFrQixJQUFJLENBQUM7SUFDakMsWUFBWSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFDakMsS0FBSyxHQUFnQyxJQUFJLENBQUM7SUFDbEQsK0VBQStFO0lBQ3ZFLGlCQUFpQixHQUFrQixJQUFJLENBQUM7SUFDaEQsdUZBQXVGO0lBQy9FLG1CQUFtQixHQUFrQixJQUFJLENBQUM7SUFDMUMsbUJBQW1CLEdBQWtCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN2RCxjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLG1CQUFtQixHQUFrQixJQUFJLENBQUM7SUFDMUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLFlBQVksR0FBcUMsSUFBSSxDQUFDO0lB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QUFxQixDQUFDLEtBQWM7UUFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUssS0FBZ0IsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN6RCxNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUNELE9BQU8sS0FBZSxDQUFDO0lBQzNCLENBQUM7SUFFTyxrQkFBa0IsQ0FBQyxLQUFjO1FBQ3JDLE9BQU8sSUFBQSx5Q0FBZ0MsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU8sSUFBSTtRQUNSLElBQUksQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLGNBQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7SUFDTCxDQUFDO0lBRU8sZ0JBQWdCO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLGNBQU8sQ0FBQyxNQUErRCxDQUFDO1FBQ3ZGLE9BQU8sTUFBTSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3hFLENBQUM7SUFFTyxnQkFBZ0IsQ0FBQyxPQUFzQjtRQUMzQyxNQUFNLE1BQU0sR0FBRyxjQUFPLENBQUMsTUFBbUYsQ0FBQztRQUMzRyxPQUFPLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3JHLENBQUM7Q0FDSixDQUFBO0FBMWZZLHNEQUFxQjtnQ0FBckIscUJBQXFCO0lBRGpDLElBQUEsZUFBUSxFQUFDLGdCQUFnQixDQUFDO0dBQ2QscUJBQXFCLENBMGZqQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBTY2VuZS1zaWRlIHJlZmVyZW5jZS1pbWFnZSBydW50aW1lOiBpdCByZW5kZXJzIGVwaGVtZXJhbCBlZGl0b3Igbm9kZXMgZnJvbSBtYWluLXByb2Nlc3MgYXV0aG9yaXR5IHN0YXRlLiAqL1xuaW1wb3J0IHsgQ2FudmFzLCBDQ09iamVjdCwgQ29sb3IsIExheWVycywgTm9kZSwgU3ByaXRlLCBTcHJpdGVGcmFtZSwgVUlUcmFuc2Zvcm0gfSBmcm9tICdjYyc7XG5pbXBvcnQge1xuICAgIElSZWZlcmVuY2VJbWFnZUNhbmNlbE9wdGlvbnMsXG4gICAgSVJlZmVyZW5jZUltYWdlQXV0aG9yaXR5TXV0YXRpb24sXG4gICAgSVJlZmVyZW5jZUltYWdlQXV0aG9yaXR5U25hcHNob3QsXG4gICAgSVJlZmVyZW5jZUltYWdlQ29tbWl0T3B0aW9ucyxcbiAgICBJUmVmZXJlbmNlSW1hZ2VDb25maWcsXG4gICAgSVJlZmVyZW5jZUltYWdlQ29uZmlnSXRlbSxcbiAgICBJUmVmZXJlbmNlSW1hZ2VFcnJvcixcbiAgICBJUmVmZXJlbmNlSW1hZ2VFdmVudHMsXG4gICAgSVJlZmVyZW5jZUltYWdlSXRlbSxcbiAgICBJUmVmZXJlbmNlSW1hZ2VQYXJhbWV0ZXJzLFxuICAgIElSZWZlcmVuY2VJbWFnZVBhdGhPcHRpb25zLFxuICAgIElSZWZlcmVuY2VJbWFnZVByZXZpZXdPcHRpb25zLFxuICAgIElSZWZlcmVuY2VJbWFnZVNlcnZpY2UsXG4gICAgSVJlZmVyZW5jZUltYWdlU3RhdGUsXG4gICAgSVJlZmVyZW5jZUltYWdlVmlzaWJpbGl0eU9wdGlvbnMsXG4gICAgUmVmZXJlbmNlSW1hZ2VWaXNpYmlsaXR5UmVhc29uLFxuICAgIG5vcm1hbGl6ZVJlZmVyZW5jZUltYWdlQ29uZmlnLFxuICAgIHZhbGlkYXRlUmVmZXJlbmNlSW1hZ2VQYXJhbWV0ZXJzLFxufSBmcm9tICcuLi8uLi9jb21tb24nO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi4vcnBjJztcbmltcG9ydCB7IEJhc2VTZXJ2aWNlLCByZWdpc3RlciwgU2VydmljZSwgU2VydmljZUV2ZW50cyB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBtZXNzYWdlTWFuYWdlciB9IGZyb20gJy4vbWVzc2FnZSc7XG5cbmNvbnN0IERFRkFVTFRfQ09ORklHOiBJUmVmZXJlbmNlSW1hZ2VDb25maWcgPSB7XG4gICAgaW1hZ2VzOiBbXSxcbiAgICBzY2VuZUJpbmRpbmdzOiB7fSxcbiAgICBkZXNpcmVkVmlzaWJsZTogdHJ1ZSxcbn07XG5cbnR5cGUgRWRpdG9yU2Vzc2lvbiA9IHsgdXVpZDogc3RyaW5nIHwgbnVsbDsgZ2VuZXJhdGlvbjogbnVtYmVyIH07XG5cbi8qKlxuICogRWRpdG9yLW9ubHkgcmVmZXJlbmNlIGltYWdlIG92ZXJsYXkuIEl0IG93bnMgbm8gc2NlbmUgZGF0YTogYWxsIHJ1bnRpbWUgbm9kZXNcbiAqIGxpdmUgdW5kZXIgR2l6bW8uYmFja2dyb3VuZE5vZGUgYW5kIGFyZSBleHBsaWNpdGx5IERvbnRTYXZlL2hpZGRlbi5cbiAqL1xuQHJlZ2lzdGVyKCdSZWZlcmVuY2VJbWFnZScpXG5leHBvcnQgY2xhc3MgUmVmZXJlbmNlSW1hZ2VTZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8SVJlZmVyZW5jZUltYWdlRXZlbnRzPiBpbXBsZW1lbnRzIElSZWZlcmVuY2VJbWFnZVNlcnZpY2Uge1xuICAgIHByaXZhdGUgY29uZmlnOiBJUmVmZXJlbmNlSW1hZ2VDb25maWcgPSBERUZBVUxUX0NPTkZJRztcbiAgICBwcml2YXRlIGN1cnJlbnRTY2VuZVV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgY2FudmFzTm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgaW1hZ2VOb2RlOiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBzcHJpdGU6IFNwcml0ZSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgc3ByaXRlRnJhbWU6IFNwcml0ZUZyYW1lIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBsb2FkZWRQYXRoOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIG1pc3NpbmdQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIHByaXZhdGUgZXJyb3I6IElSZWZlcmVuY2VJbWFnZUVycm9yIHwgbnVsbCA9IG51bGw7XG4gICAgLyoqIExhc3QgbWFpbi1wcm9jZXNzIGF1dGhvcml0eSByZXZpc2lvbiBhcHBsaWVkIHRvIHRoaXMgV2VidmlldydzIHJlbmRlcmVyLiAqL1xuICAgIHByaXZhdGUgYXV0aG9yaXR5UmV2aXNpb246IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIC8qKiBSdW50aW1lIGlkZW50aXR5IHBhaXJlZCB3aXRoIGF1dGhvcml0eVJldmlzaW9uIHRvIHN1cnZpdmUgbWFpbi1wcm9jZXNzIHJlc3RhcnRzLiAqL1xuICAgIHByaXZhdGUgYXV0aG9yaXR5SW5zdGFuY2VJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBhdXRob3JpdHlBcHBseVF1ZXVlOiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgcHJpdmF0ZSBsb2FkR2VuZXJhdGlvbiA9IDA7XG4gICAgcHJpdmF0ZSBhY3RpdmVJbnRlcmFjdGlvbklkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIGludGVyYWN0aW9uV2F0ZXJtYXJrID0gMDtcbiAgICBwcml2YXRlIHByZXZpZXdQYXRjaDogSVJlZmVyZW5jZUltYWdlUGFyYW1ldGVycyB8IG51bGwgPSBudWxsO1xuXG4gICAgYXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgU2VydmljZUV2ZW50cy5vbignc2NlbmU6ZGltZW5zaW9uLWNoYW5nZWQnLCB0aGlzLm9uRGltZW5zaW9uQ2hhbmdlZCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVjb25jaWxlQ3VycmVudEVkaXRvcihmYWxzZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0U3RhdGUoKTogUHJvbWlzZTxJUmVmZXJlbmNlSW1hZ2VTdGF0ZT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnB1bGxBdXRob3JpdHlTbmFwc2hvdCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZEFuZFNlbGVjdChvcHRpb25zOiBJUmVmZXJlbmNlSW1hZ2VQYXRoT3B0aW9ucyk6IFByb21pc2U8SVJlZmVyZW5jZUltYWdlU3RhdGU+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMudmFsaWRhdGVQYXRoKG9wdGlvbnM/LnBhdGgpO1xuICAgICAgICBjb25zdCBzY2VuZVV1aWQgPSB0aGlzLnJlcXVpcmVDdXJyZW50U2NlbmUoKTtcbiAgICAgICAgY29uc3QgZnJhbWUgPSBhd2FpdCB0aGlzLmNyZWF0ZVNwcml0ZUZyYW1lRm9yUGF0aChwYXRoKTtcbiAgICAgICAgZnJhbWUuZGVzdHJveSgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGVBdXRob3JpdHkoeyB0eXBlOiAnYWRkLWFuZC1zZWxlY3QnLCBwYXRoLCBzY2VuZVV1aWQgfSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmVtb3ZlKG9wdGlvbnM6IElSZWZlcmVuY2VJbWFnZVBhdGhPcHRpb25zKTogUHJvbWlzZTxJUmVmZXJlbmNlSW1hZ2VTdGF0ZT4ge1xuICAgICAgICBjb25zdCBwYXRoID0gdGhpcy52YWxpZGF0ZVBhdGgob3B0aW9ucz8ucGF0aCk7XG4gICAgICAgIHRoaXMubWlzc2luZ1BhdGhzLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlQXV0aG9yaXR5KHsgdHlwZTogJ3JlbW92ZScsIHBhdGggfSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2VsZWN0KG9wdGlvbnM6IElSZWZlcmVuY2VJbWFnZVBhdGhPcHRpb25zKTogUHJvbWlzZTxJUmVmZXJlbmNlSW1hZ2VTdGF0ZT4ge1xuICAgICAgICBjb25zdCBwYXRoID0gdGhpcy52YWxpZGF0ZVBhdGgob3B0aW9ucz8ucGF0aCk7XG4gICAgICAgIGNvbnN0IHNjZW5lVXVpZCA9IHRoaXMucmVxdWlyZUN1cnJlbnRTY2VuZSgpO1xuICAgICAgICBjb25zdCBmcmFtZSA9IGF3YWl0IHRoaXMuY3JlYXRlU3ByaXRlRnJhbWVGb3JQYXRoKHBhdGgpO1xuICAgICAgICBmcmFtZS5kZXN0cm95KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZUF1dGhvcml0eSh7IHR5cGU6ICdzZWxlY3QnLCBwYXRoLCBzY2VuZVV1aWQgfSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2xlYXJCaW5kaW5nKCk6IFByb21pc2U8SVJlZmVyZW5jZUltYWdlU3RhdGU+IHtcbiAgICAgICAgY29uc3Qgc2NlbmVVdWlkID0gdGhpcy5yZXF1aXJlQ3VycmVudFNjZW5lKCk7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVByZXZpZXcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlQXV0aG9yaXR5KHsgdHlwZTogJ2NsZWFyLWJpbmRpbmcnLCBzY2VuZVV1aWQgfSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2V0VmlzaWJsZShvcHRpb25zOiBJUmVmZXJlbmNlSW1hZ2VWaXNpYmlsaXR5T3B0aW9ucyk6IFByb21pc2U8SVJlZmVyZW5jZUltYWdlU3RhdGU+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zPy5kZXNpcmVkVmlzaWJsZSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Rlc2lyZWRWaXNpYmxlIG11c3QgYmUgYSBib29sZWFuLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZUF1dGhvcml0eSh7IHR5cGU6ICdzZXQtdmlzaWJsZScsIGRlc2lyZWRWaXNpYmxlOiBvcHRpb25zLmRlc2lyZWRWaXNpYmxlIH0sIGZhbHNlKTtcbiAgICB9XG5cbiAgICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8SVJlZmVyZW5jZUltYWdlU3RhdGU+IHtcbiAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5jcmVhdGVSdW50aW1lU3RhdGVLZXkoKTtcbiAgICAgICAgY29uc3QgYXV0aG9yaXR5Q2hhbmdlZCA9IGF3YWl0IHRoaXMucHVsbEF1dGhvcml0eVNuYXBzaG90KCk7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVByZXZpZXcoKTtcbiAgICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgICAgIGF3YWl0IHRoaXMubG9hZEJvdW5kSW1hZ2UodHJ1ZSk7XG4gICAgICAgIGlmIChhdXRob3JpdHlDaGFuZ2VkIHx8IGJlZm9yZSAhPT0gdGhpcy5jcmVhdGVSdW50aW1lU3RhdGVLZXkoKSkgdGhpcy5wdWJsaXNoU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3RhdGUoKTtcbiAgICB9XG5cbiAgICBhc3luYyBwcmV2aWV3UGFyYW1ldGVycyhvcHRpb25zOiBJUmVmZXJlbmNlSW1hZ2VQcmV2aWV3T3B0aW9ucyk6IFByb21pc2U8SVJlZmVyZW5jZUltYWdlU3RhdGU+IHtcbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb25JZCA9IHRoaXMudmFsaWRhdGVJbnRlcmFjdGlvbklkKG9wdGlvbnM/LmludGVyYWN0aW9uSWQpO1xuICAgICAgICBpZiAoaW50ZXJhY3Rpb25JZCA8PSB0aGlzLmludGVyYWN0aW9uV2F0ZXJtYXJrXG4gICAgICAgICAgICB8fCAodGhpcy5hY3RpdmVJbnRlcmFjdGlvbklkICE9PSBudWxsICYmIGludGVyYWN0aW9uSWQgPCB0aGlzLmFjdGl2ZUludGVyYWN0aW9uSWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhdGNoID0gdGhpcy52YWxpZGF0ZVBhcmFtZXRlcnMob3B0aW9ucz8ucGF0Y2gpO1xuICAgICAgICB0aGlzLnJlcXVpcmVDdXJyZW50SW1hZ2UoKTtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlSW50ZXJhY3Rpb25JZCAhPT0gaW50ZXJhY3Rpb25JZCkge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVJbnRlcmFjdGlvbklkID0gaW50ZXJhY3Rpb25JZDtcbiAgICAgICAgICAgIHRoaXMucHJldmlld1BhdGNoID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByZXZpZXdQYXRjaCA9IHsgLi4udGhpcy5wcmV2aWV3UGF0Y2gsIC4uLnBhdGNoIH07XG4gICAgICAgIHRoaXMuYXBwbHlDdXJyZW50UGFyYW1ldGVycygpO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIGFzeW5jIGNvbW1pdFBhcmFtZXRlcnMob3B0aW9uczogSVJlZmVyZW5jZUltYWdlQ29tbWl0T3B0aW9ucyk6IFByb21pc2U8SVJlZmVyZW5jZUltYWdlU3RhdGU+IHtcbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb25JZCA9IG9wdGlvbnM/LmludGVyYWN0aW9uSWQgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMudmFsaWRhdGVJbnRlcmFjdGlvbklkKG9wdGlvbnMuaW50ZXJhY3Rpb25JZCk7XG4gICAgICAgIGlmIChpbnRlcmFjdGlvbklkICE9PSB1bmRlZmluZWQgJiYgaW50ZXJhY3Rpb25JZCA8PSB0aGlzLmludGVyYWN0aW9uV2F0ZXJtYXJrKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhdGNoID0gdGhpcy52YWxpZGF0ZVBhcmFtZXRlcnMob3B0aW9ucz8ucGF0Y2gpO1xuICAgICAgICBjb25zdCBzY2VuZVV1aWQgPSB0aGlzLnJlcXVpcmVDdXJyZW50U2NlbmUoKTtcbiAgICAgICAgdGhpcy5yZXF1aXJlQ3VycmVudEltYWdlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VJbnRlcmFjdGlvbihpbnRlcmFjdGlvbklkKTtcbiAgICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZUF1dGhvcml0eSh7IHR5cGU6ICdjb21taXQtcGFyYW1ldGVycycsIHNjZW5lVXVpZCwgcGF0Y2ggfSwgZmFsc2UsIGZhbHNlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBhc3luYyBjYW5jZWxQcmV2aWV3KG9wdGlvbnM6IElSZWZlcmVuY2VJbWFnZUNhbmNlbE9wdGlvbnMpOiBQcm9taXNlPElSZWZlcmVuY2VJbWFnZVN0YXRlPiB7XG4gICAgICAgIGNvbnN0IGludGVyYWN0aW9uSWQgPSB0aGlzLnZhbGlkYXRlSW50ZXJhY3Rpb25JZChvcHRpb25zPy5pbnRlcmFjdGlvbklkKTtcbiAgICAgICAgaWYgKGludGVyYWN0aW9uSWQgPD0gdGhpcy5pbnRlcmFjdGlvbldhdGVybWFyaykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3RhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsb3NlSW50ZXJhY3Rpb24oaW50ZXJhY3Rpb25JZCk7XG4gICAgICAgIHRoaXMuYXBwbHlDdXJyZW50UGFyYW1ldGVycygpO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG9uRWRpdG9yT3BlbmVkKCk6IHZvaWQge1xuICAgICAgICB2b2lkIHRoaXMucmVjb25jaWxlQ3VycmVudEVkaXRvcih0cnVlKTtcbiAgICB9XG5cbiAgICBvbkVkaXRvckNsb3NlZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50U2NlbmVVdWlkID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlUHJldmlldygpO1xuICAgICAgICB0aGlzLmNsZWFyUnVudGltZSh0cnVlKTtcbiAgICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgICAgIHRoaXMucHVibGlzaFN0YXRlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkRpbWVuc2lvbkNoYW5nZWQgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5oYW5kbGVEaW1lbnNpb25DaGFuZ2VkKCk7XG4gICAgfTtcblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlRGltZW5zaW9uQ2hhbmdlZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKGF3YWl0IHRoaXMucmVjb25jaWxlUnVudGltZSgpKSB0aGlzLnB1Ymxpc2hTdGF0ZSgpO1xuICAgIH1cblxuICAgIC8qKiBTb2NrZXQgZW50cnlwb2ludDsgcmVjb25uZWN0cyByZWNvbmNpbGUgcnVudGltZSBldmVuIHdoZW4gYXV0aG9yaXR5IHJldmlzaW9uIGlzIHVuY2hhbmdlZC4gKi9cbiAgICBhc3luYyBzeW5jRnJvbUF1dGhvcml0eShwdWJsaXNoID0gdHJ1ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBhdXRob3JpdHlDaGFuZ2VkID0gYXdhaXQgdGhpcy5wdWxsQXV0aG9yaXR5U25hcHNob3QoKTtcbiAgICAgICAgY29uc3QgcnVudGltZUNoYW5nZWQgPSBhd2FpdCB0aGlzLnJlY29uY2lsZVJ1bnRpbWUoKTtcbiAgICAgICAgaWYgKHB1Ymxpc2ggJiYgKGF1dGhvcml0eUNoYW5nZWQgfHwgcnVudGltZUNoYW5nZWQpKSB0aGlzLnB1Ymxpc2hTdGF0ZSgpO1xuICAgIH1cblxuICAgIC8qKiBQdWxscyBhdXRob3JpdHkgb25seTsgY2FsbGVycyBkZWNpZGUgd2hldGhlciB0aGUgcmVuZGVyZXIgc2hvdWxkIGJlIHJlY29uY2lsZWQuICovXG4gICAgcHJpdmF0ZSBhc3luYyBwdWxsQXV0aG9yaXR5U25hcHNob3QoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ3JlZmVyZW5jZUltYWdlU3RvcmUnLCAnZ2V0U25hcHNob3QnKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVucXVldWVBdXRob3JpdHlTbmFwc2hvdChzbmFwc2hvdCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3IgPSB7IHN0YWdlOiAnY29uZmlnJywgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpIH07XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tSZWZlcmVuY2VJbWFnZV0gZmFpbGVkIHRvIHN5bmNocm9uaXplIGF1dGhvcml0eTonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlY29uY2lsZUN1cnJlbnRFZGl0b3IocHVibGlzaDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgZWRpdG9yQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBuZXh0U2NlbmVVdWlkID0gdGhpcy5nZXRFZGl0b3JTZXNzaW9uKCkudXVpZDtcbiAgICAgICAgaWYgKG5leHRTY2VuZVV1aWQgIT09IHRoaXMuY3VycmVudFNjZW5lVXVpZCkge1xuICAgICAgICAgICAgZWRpdG9yQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY2VuZVV1aWQgPSBuZXh0U2NlbmVVdWlkO1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUHJldmlldygpO1xuICAgICAgICAgICAgdGhpcy5jbGVhclJ1bnRpbWUodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdXRob3JpdHlDaGFuZ2VkID0gYXdhaXQgdGhpcy5wdWxsQXV0aG9yaXR5U25hcHNob3QoKTtcbiAgICAgICAgY29uc3QgcnVudGltZUNoYW5nZWQgPSBhd2FpdCB0aGlzLnJlY29uY2lsZVJ1bnRpbWUoKTtcbiAgICAgICAgaWYgKHB1Ymxpc2ggJiYgKGVkaXRvckNoYW5nZWQgfHwgYXV0aG9yaXR5Q2hhbmdlZCB8fCBydW50aW1lQ2hhbmdlZCkpIHRoaXMucHVibGlzaFN0YXRlKCk7XG4gICAgfVxuXG4gICAgLyoqIFJlY3JlYXRlcyBvciBjbGVhcnMgZXBoZW1lcmFsIGVkaXRvciBvYmplY3RzIHdpdGhvdXQgbXV0YXRpbmcgYXV0aG9yaXR5IHN0YXRlLiAqL1xuICAgIHByaXZhdGUgYXN5bmMgcmVjb25jaWxlUnVudGltZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5jcmVhdGVSdW50aW1lU3RhdGVLZXkoKTtcbiAgICAgICAgaWYgKHRoaXMuaXMyRCgpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRCb3VuZEltYWdlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5VmlzaWJpbGl0eSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiZWZvcmUgIT09IHRoaXMuY3JlYXRlUnVudGltZVN0YXRlS2V5KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVSdW50aW1lU3RhdGVLZXkoKTogc3RyaW5nIHtcbiAgICAgICAgLy8gT25seSB0aGVzZSBwdWJsaWMgcnVudGltZSBmaWVsZHMgZGV0ZXJtaW5lIHdoZXRoZXIgYSBsaWZlY3ljbGUgZXZlbnQgbmVlZHMgYSBzdGF0ZSBicm9hZGNhc3QuXG4gICAgICAgIGNvbnN0IHZpc2liaWxpdHkgPSB0aGlzLmNvbXB1dGVWaXNpYmlsaXR5KCk7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBzY2VuZVV1aWQ6IHRoaXMuY3VycmVudFNjZW5lVXVpZCxcbiAgICAgICAgICAgIGltYWdlUGF0aDogdGhpcy5nZXRDdXJyZW50UGF0aCgpLFxuICAgICAgICAgICAgZGVzaXJlZFZpc2libGU6IHRoaXMuY29uZmlnLmRlc2lyZWRWaXNpYmxlLFxuICAgICAgICAgICAgZWZmZWN0aXZlVmlzaWJsZTogdmlzaWJpbGl0eS5lZmZlY3RpdmVWaXNpYmxlLFxuICAgICAgICAgICAgdmlzaWJpbGl0eVJlYXNvbjogdmlzaWJpbGl0eS5yZWFzb24sXG4gICAgICAgICAgICBlcnJvcjogdGhpcy5lcnJvcixcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBsb2FkQm91bmRJbWFnZShmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldEN1cnJlbnRQYXRoKCk7XG4gICAgICAgIGlmICghcGF0aCB8fCAhdGhpcy5jdXJyZW50U2NlbmVVdWlkIHx8ICF0aGlzLmlzMkQoKSB8fCAhdGhpcy5jb25maWcuZGVzaXJlZFZpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJSdW50aW1lKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmb3JjZSAmJiB0aGlzLmxvYWRlZFBhdGggPT09IHBhdGggJiYgdGhpcy5zcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBseUN1cnJlbnRQYXJhbWV0ZXJzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHRoaXMuZ2V0RWRpdG9yU2Vzc2lvbigpO1xuICAgICAgICBjb25zdCBnZW5lcmF0aW9uID0gKyt0aGlzLmxvYWRHZW5lcmF0aW9uO1xuICAgICAgICBsZXQgZGF0YVVybDogc3RyaW5nO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGF0YVVybCA9IGF3YWl0IHRoaXMucmVhZERhdGFVcmwocGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5sb2FkR2VuZXJhdGlvbiB8fCAhdGhpcy5pc1Nlc3Npb25DdXJyZW50KHNlc3Npb24pKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLm1pc3NpbmdQYXRocy5hZGQocGF0aCk7XG4gICAgICAgICAgICB0aGlzLmVycm9yID0geyBzdGFnZTogJ2ZpbGUnLCBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikgfTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJSdW50aW1lKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lID0gYXdhaXQgdGhpcy5jcmVhdGVTcHJpdGVGcmFtZShkYXRhVXJsKTtcbiAgICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmxvYWRHZW5lcmF0aW9uIHx8ICF0aGlzLmlzU2Vzc2lvbkN1cnJlbnQoc2Vzc2lvbikgfHwgcGF0aCAhPT0gdGhpcy5nZXRDdXJyZW50UGF0aCgpKSB7XG4gICAgICAgICAgICAgICAgZnJhbWUuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5taXNzaW5nUGF0aHMuZGVsZXRlKHBhdGgpO1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlU3ByaXRlRnJhbWUoZnJhbWUsIHBhdGgpO1xuICAgICAgICAgICAgdGhpcy5hcHBseUN1cnJlbnRQYXJhbWV0ZXJzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5sb2FkR2VuZXJhdGlvbiB8fCAhdGhpcy5pc1Nlc3Npb25DdXJyZW50KHNlc3Npb24pKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLm1pc3NpbmdQYXRocy5kZWxldGUocGF0aCk7XG4gICAgICAgICAgICB0aGlzLmVycm9yID0geyBzdGFnZTogJ2RlY29kZScsIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9O1xuICAgICAgICAgICAgdGhpcy5jbGVhclJ1bnRpbWUoZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5hcHBseVZpc2liaWxpdHkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlU3ByaXRlRnJhbWVGb3JQYXRoKHBhdGg6IHN0cmluZyk6IFByb21pc2U8U3ByaXRlRnJhbWU+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3ByaXRlRnJhbWUoYXdhaXQgdGhpcy5yZWFkRGF0YVVybChwYXRoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZWFkRGF0YVVybChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgncmVmZXJlbmNlSW1hZ2VGaWxlcycsICdyZWFkRGF0YVVybCcsIFtwYXRoXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVTcHJpdGVGcmFtZShkYXRhVXJsOiBzdHJpbmcpOiBQcm9taXNlPFNwcml0ZUZyYW1lPiB7XG4gICAgICAgIGNvbnN0IEltYWdlQ3RvciA9IChnbG9iYWxUaGlzIGFzIGFueSkuY2N3aW5kb3c/LkltYWdlID8/IChnbG9iYWxUaGlzIGFzIGFueSkuSW1hZ2U7XG4gICAgICAgIGlmICghSW1hZ2VDdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbWFnZSBkZWNvZGluZyBpcyB1bmF2YWlsYWJsZSBpbiB0aGUgc2NlbmUgZWRpdG9yLicpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2VDdG9yKCk7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShTcHJpdGVGcmFtZS5jcmVhdGVXaXRoSW1hZ2UoaW1hZ2UpKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignUmVmZXJlbmNlIGltYWdlIGRlY29kaW5nIGZhaWxlZC4nKSk7XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBkYXRhVXJsO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVuc3VyZU5vZGVzKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5zcHJpdGUgJiYgdGhpcy5pbWFnZU5vZGUgJiYgdGhpcy5jYW52YXNOb2RlKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSBTZXJ2aWNlLkdpem1vLmJhY2tncm91bmROb2RlO1xuICAgICAgICBpZiAoIWJhY2tncm91bmQpIHRocm93IG5ldyBFcnJvcignRWRpdG9yIGdpem1vIGJhY2tncm91bmQgaXMgdW5hdmFpbGFibGUuJyk7XG4gICAgICAgIGNvbnN0IGZsYWdzID0gQ0NPYmplY3QuRmxhZ3MuRG9udFNhdmUgfCBDQ09iamVjdC5GbGFncy5IaWRlSW5IaWVyYXJjaHk7XG4gICAgICAgIGNvbnN0IGxheWVyID0gTGF5ZXJzLkVudW0uR0laTU9TIHwgTGF5ZXJzLkVudW0uVUlfMkQgfCBMYXllcnMuRW51bS5JR05PUkVfUkFZQ0FTVDtcbiAgICAgICAgdGhpcy5jYW52YXNOb2RlID0gbmV3IE5vZGUoJ1JlZmVyZW5jZSBJbWFnZSBDYW52YXMnKTtcbiAgICAgICAgdGhpcy5jYW52YXNOb2RlLm9iakZsYWdzIHw9IGZsYWdzO1xuICAgICAgICB0aGlzLmNhbnZhc05vZGUubGF5ZXIgPSBsYXllcjtcbiAgICAgICAgdGhpcy5jYW52YXNOb2RlLnBhcmVudCA9IGJhY2tncm91bmQ7XG4gICAgICAgIHRoaXMuY2FudmFzTm9kZS5hZGRDb21wb25lbnQoQ2FudmFzKTtcblxuICAgICAgICB0aGlzLmltYWdlTm9kZSA9IG5ldyBOb2RlKCdSZWZlcmVuY2UgSW1hZ2UnKTtcbiAgICAgICAgdGhpcy5pbWFnZU5vZGUub2JqRmxhZ3MgfD0gZmxhZ3M7XG4gICAgICAgIHRoaXMuaW1hZ2VOb2RlLmxheWVyID0gbGF5ZXI7XG4gICAgICAgIHRoaXMuaW1hZ2VOb2RlLnBhcmVudCA9IHRoaXMuY2FudmFzTm9kZTtcbiAgICAgICAgdGhpcy5pbWFnZU5vZGUuYWRkQ29tcG9uZW50KFVJVHJhbnNmb3JtKTtcbiAgICAgICAgdGhpcy5zcHJpdGUgPSB0aGlzLmltYWdlTm9kZS5hZGRDb21wb25lbnQoU3ByaXRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlcGxhY2VTcHJpdGVGcmFtZShmcmFtZTogU3ByaXRlRnJhbWUsIHBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVuc3VyZU5vZGVzKCk7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzID0gdGhpcy5zcHJpdGVGcmFtZTtcbiAgICAgICAgdGhpcy5zcHJpdGVGcmFtZSA9IGZyYW1lO1xuICAgICAgICB0aGlzLmxvYWRlZFBhdGggPSBwYXRoO1xuICAgICAgICB0aGlzLnNwcml0ZSEuc3ByaXRlRnJhbWUgPSBmcmFtZTtcbiAgICAgICAgaWYgKHByZXZpb3VzICYmIHByZXZpb3VzICE9PSBmcmFtZSkgcHJldmlvdXMuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2xlYXJSdW50aW1lKGRlc3Ryb3lOb2RlczogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLmxvYWRHZW5lcmF0aW9uKys7XG4gICAgICAgIGlmICh0aGlzLnNwcml0ZSkgdGhpcy5zcHJpdGUuc3ByaXRlRnJhbWUgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5zcHJpdGVGcmFtZSkgdGhpcy5zcHJpdGVGcmFtZS5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuc3ByaXRlRnJhbWUgPSBudWxsO1xuICAgICAgICB0aGlzLmxvYWRlZFBhdGggPSBudWxsO1xuICAgICAgICBpZiAoZGVzdHJveU5vZGVzICYmIHRoaXMuY2FudmFzTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5jYW52YXNOb2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzTm9kZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmltYWdlTm9kZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNwcml0ZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFwcGx5Q3VycmVudFBhcmFtZXRlcnMoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSB0aGlzLmdldEN1cnJlbnRQYXJhbWV0ZXJzKCk7XG4gICAgICAgIGlmICghcGFyYW1ldGVycyB8fCAhdGhpcy5pbWFnZU5vZGUgfHwgIXRoaXMuc3ByaXRlKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5VmlzaWJpbGl0eSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW1hZ2VOb2RlLnNldFBvc2l0aW9uKHBhcmFtZXRlcnMueCwgcGFyYW1ldGVycy55LCAwKTtcbiAgICAgICAgdGhpcy5pbWFnZU5vZGUuc2V0U2NhbGUocGFyYW1ldGVycy5zY2FsZVgsIHBhcmFtZXRlcnMuc2NhbGVZLCAxKTtcbiAgICAgICAgY29uc3QgY29sb3IgPSB0aGlzLnNwcml0ZS5jb2xvci5jbG9uZSgpO1xuICAgICAgICBjb2xvci5hID0gTWF0aC5yb3VuZChwYXJhbWV0ZXJzLm9wYWNpdHkgLyAxMDAgKiAyNTUpO1xuICAgICAgICB0aGlzLnNwcml0ZS5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmFwcGx5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHZvaWQgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFwcGx5VmlzaWJpbGl0eShyZXBhaW50ID0gdHJ1ZSk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5pbWFnZU5vZGUpIHRoaXMuaW1hZ2VOb2RlLmFjdGl2ZSA9IHRoaXMuY29tcHV0ZVZpc2liaWxpdHkoKS5lZmZlY3RpdmVWaXNpYmxlO1xuICAgICAgICBpZiAocmVwYWludCkgdm9pZCBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29tcHV0ZVZpc2liaWxpdHkoKTogeyBlZmZlY3RpdmVWaXNpYmxlOiBib29sZWFuOyByZWFzb246IFJlZmVyZW5jZUltYWdlVmlzaWJpbGl0eVJlYXNvbiB9IHtcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTY2VuZVV1aWQpIHJldHVybiB7IGVmZmVjdGl2ZVZpc2libGU6IGZhbHNlLCByZWFzb246ICduby1lZGl0b3InIH07XG4gICAgICAgIGlmICghdGhpcy5jb25maWcuZGVzaXJlZFZpc2libGUpIHJldHVybiB7IGVmZmVjdGl2ZVZpc2libGU6IGZhbHNlLCByZWFzb246ICdkaXNhYmxlZCcgfTtcbiAgICAgICAgaWYgKCF0aGlzLmlzMkQoKSkgcmV0dXJuIHsgZWZmZWN0aXZlVmlzaWJsZTogZmFsc2UsIHJlYXNvbjogJ25vdC0yZCcgfTtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0Q3VycmVudFBhdGgoKTtcbiAgICAgICAgaWYgKCFwYXRoKSByZXR1cm4geyBlZmZlY3RpdmVWaXNpYmxlOiBmYWxzZSwgcmVhc29uOiAndW5ib3VuZCcgfTtcbiAgICAgICAgaWYgKHRoaXMubWlzc2luZ1BhdGhzLmhhcyhwYXRoKSkgcmV0dXJuIHsgZWZmZWN0aXZlVmlzaWJsZTogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmcnIH07XG4gICAgICAgIGlmICh0aGlzLmVycm9yKSByZXR1cm4geyBlZmZlY3RpdmVWaXNpYmxlOiBmYWxzZSwgcmVhc29uOiAnbG9hZC1lcnJvcicgfTtcbiAgICAgICAgaWYgKCF0aGlzLnNwcml0ZUZyYW1lIHx8IHRoaXMubG9hZGVkUGF0aCAhPT0gcGF0aCkgcmV0dXJuIHsgZWZmZWN0aXZlVmlzaWJsZTogZmFsc2UsIHJlYXNvbjogJ2xvYWQtZXJyb3InIH07XG4gICAgICAgIHJldHVybiB7IGVmZmVjdGl2ZVZpc2libGU6IHRydWUsIHJlYXNvbjogJ3Zpc2libGUnIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVTdGF0ZSgpOiBJUmVmZXJlbmNlSW1hZ2VTdGF0ZSB7XG4gICAgICAgIGNvbnN0IHZpc2liaWxpdHkgPSB0aGlzLmNvbXB1dGVWaXNpYmlsaXR5KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gdGhpcy5nZXRDdXJyZW50UGF0aCgpO1xuICAgICAgICBjb25zdCBpbWFnZXMgPSB0aGlzLmNvbmZpZy5pbWFnZXMubWFwKChpbWFnZSkgPT4gKHsgLi4uaW1hZ2UsIG1pc3Npbmc6IHRoaXMubWlzc2luZ1BhdGhzLmhhcyhpbWFnZS5wYXRoKSB9KSk7XG4gICAgICAgIGNvbnN0IGltYWdlID0gY3VycmVudFBhdGggPyBpbWFnZXMuZmluZCgoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUucGF0aCA9PT0gY3VycmVudFBhdGgpID8/IG51bGwgOiBudWxsO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW1hZ2VzLFxuICAgICAgICAgICAgY3VycmVudDogeyBzY2VuZVV1aWQ6IHRoaXMuY3VycmVudFNjZW5lVXVpZCwgaW1hZ2VQYXRoOiBjdXJyZW50UGF0aCwgaW1hZ2UgfSxcbiAgICAgICAgICAgIGRlc2lyZWRWaXNpYmxlOiB0aGlzLmNvbmZpZy5kZXNpcmVkVmlzaWJsZSxcbiAgICAgICAgICAgIGVmZmVjdGl2ZVZpc2libGU6IHZpc2liaWxpdHkuZWZmZWN0aXZlVmlzaWJsZSxcbiAgICAgICAgICAgIHZpc2liaWxpdHlSZWFzb246IHZpc2liaWxpdHkucmVhc29uLFxuICAgICAgICAgICAgaXMyRDogdGhpcy5pczJEKCksXG4gICAgICAgICAgICBoYXNPcGVuRWRpdG9yOiB0aGlzLmN1cnJlbnRTY2VuZVV1aWQgIT09IG51bGwsXG4gICAgICAgICAgICBlcnJvcjogdGhpcy5lcnJvcixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEN1cnJlbnRQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50U2NlbmVVdWlkID8gdGhpcy5jb25maWcuc2NlbmVCaW5kaW5nc1t0aGlzLmN1cnJlbnRTY2VuZVV1aWRdID8/IG51bGwgOiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVxdWlyZUN1cnJlbnRTY2VuZSgpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudFNjZW5lVXVpZCkgdGhyb3cgbmV3IEVycm9yKCdObyBzY2VuZSBvciBwcmVmYWIgaXMgY3VycmVudGx5IG9wZW4uJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRTY2VuZVV1aWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXF1aXJlQ3VycmVudEltYWdlKCk6IElSZWZlcmVuY2VJbWFnZUNvbmZpZ0l0ZW0ge1xuICAgICAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRDdXJyZW50UGF0aCgpO1xuICAgICAgICBjb25zdCBpbWFnZSA9IHBhdGggPyB0aGlzLmNvbmZpZy5pbWFnZXMuZmluZCgoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUucGF0aCA9PT0gcGF0aCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghaW1hZ2UpIHRocm93IG5ldyBFcnJvcignVGhlIGN1cnJlbnQgc2NlbmUgb3IgcHJlZmFiIGhhcyBubyByZWZlcmVuY2UgaW1hZ2UgYmluZGluZy4nKTtcbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q3VycmVudFBhcmFtZXRlcnMoKTogSVJlZmVyZW5jZUltYWdlQ29uZmlnSXRlbSB8IG51bGwge1xuICAgICAgICBjb25zdCBpbWFnZSA9IHRoaXMuZ2V0Q3VycmVudFBhdGgoKVxuICAgICAgICAgICAgPyB0aGlzLmNvbmZpZy5pbWFnZXMuZmluZCgoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUucGF0aCA9PT0gdGhpcy5nZXRDdXJyZW50UGF0aCgpKVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiBpbWFnZSA/IHsgLi4uaW1hZ2UsIC4uLnRoaXMucHJldmlld1BhdGNoIH0gOiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgbXV0YXRlQXV0aG9yaXR5KFxuICAgICAgICBtdXRhdGlvbjogSVJlZmVyZW5jZUltYWdlQXV0aG9yaXR5TXV0YXRpb24sXG4gICAgICAgIGludmFsaWRhdGVQcmV2aWV3OiBib29sZWFuLFxuICAgICAgICBjbGVhckVycm9yID0gdHJ1ZSxcbiAgICAgICAgYXBwbHlSdW50aW1lT25Ob29wID0gZmFsc2UsXG4gICAgKTogUHJvbWlzZTxJUmVmZXJlbmNlSW1hZ2VTdGF0ZT4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ3JlZmVyZW5jZUltYWdlU3RvcmUnLCAnbXV0YXRlJywgW211dGF0aW9uXSk7XG4gICAgICAgIGlmIChpbnZhbGlkYXRlUHJldmlldykgdGhpcy5pbnZhbGlkYXRlUHJldmlldygpO1xuICAgICAgICBpZiAoY2xlYXJFcnJvciAmJiBzbmFwc2hvdC5jaGFuZ2VkKSB0aGlzLmVycm9yID0gbnVsbDtcbiAgICAgICAgY29uc3QgYXBwbGllZCA9IGF3YWl0IHRoaXMuZW5xdWV1ZUF1dGhvcml0eVNuYXBzaG90KHNuYXBzaG90LCBzbmFwc2hvdC5jaGFuZ2VkLCB0cnVlKTtcbiAgICAgICAgaWYgKGFwcGx5UnVudGltZU9uTm9vcCAmJiAhc25hcHNob3QuY2hhbmdlZCAmJiAhYXBwbGllZCkgdGhpcy5hcHBseUN1cnJlbnRQYXJhbWV0ZXJzKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBlbnF1ZXVlQXV0aG9yaXR5U25hcHNob3QoXG4gICAgICAgIHNuYXBzaG90OiBJUmVmZXJlbmNlSW1hZ2VBdXRob3JpdHlTbmFwc2hvdCxcbiAgICAgICAgcHVibGlzaDogYm9vbGVhbixcbiAgICAgICAgcmVjb25jaWxlUnVudGltZSA9IGZhbHNlLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBsZXQgcmVzb2x2ZVRhc2shOiAoYXBwbGllZDogYm9vbGVhbikgPT4gdm9pZDtcbiAgICAgICAgbGV0IHJlamVjdFRhc2shOiAocmVhc29uOiB1bmtub3duKSA9PiB2b2lkO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlVGFzayA9IHJlc29sdmU7XG4gICAgICAgICAgICByZWplY3RUYXNrID0gcmVqZWN0O1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hdXRob3JpdHlBcHBseVF1ZXVlID0gdGhpcy5hdXRob3JpdHlBcHBseVF1ZXVlXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKVxuICAgICAgICAgICAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVUYXNrKGF3YWl0IHRoaXMuYXBwbHlBdXRob3JpdHlTbmFwc2hvdChzbmFwc2hvdCwgcHVibGlzaCwgcmVjb25jaWxlUnVudGltZSkpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdFRhc2soZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYXBwbHlBdXRob3JpdHlTbmFwc2hvdChcbiAgICAgICAgc25hcHNob3Q6IElSZWZlcmVuY2VJbWFnZUF1dGhvcml0eVNuYXBzaG90LFxuICAgICAgICBwdWJsaXNoOiBib29sZWFuLFxuICAgICAgICByZWNvbmNpbGVSdW50aW1lOiBib29sZWFuLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoIXNuYXBzaG90XG4gICAgICAgICAgICB8fCB0eXBlb2Ygc25hcHNob3QuaW5zdGFuY2VJZCAhPT0gJ3N0cmluZydcbiAgICAgICAgICAgIHx8ICFzbmFwc2hvdC5pbnN0YW5jZUlkXG4gICAgICAgICAgICB8fCAhTnVtYmVyLmlzU2FmZUludGVnZXIoc25hcHNob3QucmV2aXNpb24pXG4gICAgICAgICAgICB8fCBzbmFwc2hvdC5yZXZpc2lvbiA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmVmZXJlbmNlIGltYWdlIGF1dGhvcml0eSByZXR1cm5lZCBhbiBpbnZhbGlkIHNuYXBzaG90LicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEEgc29ja2V0IG5vdGlmaWNhdGlvbiBtYXkgYXJyaXZlIGJlZm9yZSB0aGUgUlBDIHJlc3BvbnNlIHRoYXQgY2F1c2VkIGl0LlxuICAgICAgICAvLyBOZXZlciBsZXQgYW4gb2xkZXIgb3IgYWxyZWFkeS1hcHBsaWVkIHJlc3BvbnNlIHJvbGwgdGhlIHJlbmRlcmVyIGJhY2suXG4gICAgICAgIGlmICh0aGlzLmF1dGhvcml0eUluc3RhbmNlSWQgPT09IHNuYXBzaG90Lmluc3RhbmNlSWRcbiAgICAgICAgICAgICYmIHRoaXMuYXV0aG9yaXR5UmV2aXNpb24gIT09IG51bGxcbiAgICAgICAgICAgICYmIHNuYXBzaG90LnJldmlzaW9uIDw9IHRoaXMuYXV0aG9yaXR5UmV2aXNpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmV2aWV3VGFyZ2V0UGF0aCA9IHRoaXMuYWN0aXZlSW50ZXJhY3Rpb25JZCA9PT0gbnVsbCA/IG51bGwgOiB0aGlzLmdldEN1cnJlbnRQYXRoKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gbm9ybWFsaXplUmVmZXJlbmNlSW1hZ2VDb25maWcoc25hcHNob3QuY29uZmlnKTtcbiAgICAgICAgdGhpcy5hdXRob3JpdHlJbnN0YW5jZUlkID0gc25hcHNob3QuaW5zdGFuY2VJZDtcbiAgICAgICAgdGhpcy5hdXRob3JpdHlSZXZpc2lvbiA9IHNuYXBzaG90LnJldmlzaW9uO1xuICAgICAgICAvLyBBdXRob3JpdHkgc25hcHNob3RzIGRlc2NyaWJlIHRoZSB3aG9sZSBzaGFyZWQgbGlicmFyeS4gS2VlcCBhIGxvY2FsIHNsaWRlclxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBhbGl2ZSB3aGVuIGFub3RoZXIgU2NlbmUgY2hhbmdlcyB1bnJlbGF0ZWQgbGlicmFyeSBlbnRyaWVzOyBpdHNcbiAgICAgICAgLy8gY29tbWl0IGlzIHN0aWxsIGFwcGxpZWQgYWdhaW5zdCB0aGUgU3RvcmUncyBsYXRlc3QgY29uZmlndXJhdGlvbi4gQSBjaGFuZ2VkXG4gICAgICAgIC8vIG9yIHJlbW92ZWQgY3VycmVudCBiaW5kaW5nIGlzIHRoZSBhY3R1YWwgYm91bmRhcnkgdGhhdCBpbnZhbGlkYXRlcyB0aGUgZWRpdC5cbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlSW50ZXJhY3Rpb25JZCAhPT0gbnVsbFxuICAgICAgICAgICAgJiYgKCFwcmV2aWV3VGFyZ2V0UGF0aFxuICAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0Q3VycmVudFBhdGgoKSAhPT0gcHJldmlld1RhcmdldFBhdGhcbiAgICAgICAgICAgICAgICB8fCAhdGhpcy5jb25maWcuaW1hZ2VzLnNvbWUoKGltYWdlKSA9PiBpbWFnZS5wYXRoID09PSBwcmV2aWV3VGFyZ2V0UGF0aCkpKSB7XG4gICAgICAgICAgICB0aGlzLmludmFsaWRhdGVQcmV2aWV3KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlY29uY2lsZVJ1bnRpbWUpIGF3YWl0IHRoaXMucmVjb25jaWxlUnVudGltZSgpO1xuICAgICAgICBpZiAocHVibGlzaCkgdGhpcy5wdWJsaXNoU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwdWJsaXNoU3RhdGUoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jcmVhdGVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmJyb2FkY2FzdCgncmVmZXJlbmNlLWltYWdlOnN0YXRlLWNoYW5nZWQnLCBzdGF0ZSk7XG4gICAgICAgIG1lc3NhZ2VNYW5hZ2VyLmJyb2FkY2FzdCgncmVmZXJlbmNlLWltYWdlOnN0YXRlLWNoYW5nZWQnLCBzdGF0ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbnZhbGlkYXRlUHJldmlldygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlSW50ZXJhY3Rpb25JZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbldhdGVybWFyayA9IE1hdGgubWF4KHRoaXMuaW50ZXJhY3Rpb25XYXRlcm1hcmssIHRoaXMuYWN0aXZlSW50ZXJhY3Rpb25JZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3RpdmVJbnRlcmFjdGlvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmV2aWV3UGF0Y2ggPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2xvc2VJbnRlcmFjdGlvbihpbnRlcmFjdGlvbklkPzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb25XYXRlcm1hcmsgPSBNYXRoLm1heCh0aGlzLmludGVyYWN0aW9uV2F0ZXJtYXJrLCBpbnRlcmFjdGlvbklkID8/IHRoaXMuYWN0aXZlSW50ZXJhY3Rpb25JZCA/PyAwKTtcbiAgICAgICAgdGhpcy5hY3RpdmVJbnRlcmFjdGlvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmV2aWV3UGF0Y2ggPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgdmFsaWRhdGVQYXRoKHBhdGg6IHVua25vd24pOiBzdHJpbmcge1xuICAgICAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnIHx8ICFwYXRoKSB0aHJvdyBuZXcgRXJyb3IoJ1JlZmVyZW5jZSBpbWFnZSBwYXRoIGlzIHJlcXVpcmVkLicpO1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZhbGlkYXRlSW50ZXJhY3Rpb25JZCh2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIodmFsdWUpIHx8ICh2YWx1ZSBhcyBudW1iZXIpIDw9IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW50ZXJhY3Rpb25JZCBtdXN0IGJlIGEgcG9zaXRpdmUgc2FmZSBpbnRlZ2VyLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZSBhcyBudW1iZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZVBhcmFtZXRlcnMocGF0Y2g6IHVua25vd24pOiBJUmVmZXJlbmNlSW1hZ2VQYXJhbWV0ZXJzIHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlUmVmZXJlbmNlSW1hZ2VQYXJhbWV0ZXJzKHBhdGNoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzMkQoKTogYm9vbGVhbiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gQm9vbGVhbihTZXJ2aWNlLkdpem1vLmlzMkQpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RWRpdG9yU2Vzc2lvbigpOiBFZGl0b3JTZXNzaW9uIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gU2VydmljZS5FZGl0b3IgYXMgdW5rbm93biBhcyB7IGdldEVkaXRvclNlc3Npb24/OiAoKSA9PiBFZGl0b3JTZXNzaW9uIH07XG4gICAgICAgIHJldHVybiBlZGl0b3IuZ2V0RWRpdG9yU2Vzc2lvbj8uKCkgPz8geyB1dWlkOiBudWxsLCBnZW5lcmF0aW9uOiAwIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc1Nlc3Npb25DdXJyZW50KHNlc3Npb246IEVkaXRvclNlc3Npb24pOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gU2VydmljZS5FZGl0b3IgYXMgdW5rbm93biBhcyB7IGlzQ3VycmVudEVkaXRvclNlc3Npb24/OiAodmFsdWU6IEVkaXRvclNlc3Npb24pID0+IGJvb2xlYW4gfTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci5pc0N1cnJlbnRFZGl0b3JTZXNzaW9uPy4oc2Vzc2lvbikgPz8gc2Vzc2lvbi51dWlkID09PSB0aGlzLmdldEVkaXRvclNlc3Npb24oKS51dWlkO1xuICAgIH1cbn1cbiJdfQ==