"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationService = void 0;
const cc_1 = require("cc");
const common_1 = require("../../common");
const core_1 = require("./core");
const clip_snapshot_1 = require("./animation/clip-snapshot");
const clip_duration_1 = require("./animation/clip-duration");
const clip_operations_1 = require("./animation/clip-operations");
const auxiliary_curve_1 = require("./animation/auxiliary-curve");
const sampled_state_1 = require("./animation/sampled-state");
const service_save_1 = require("./animation/service-save");
const state_registry_1 = require("./animation/state-registry");
const undo_1 = require("./animation/undo");
const utils_1 = require("./animation/utils");
const property_value_1 = require("./animation/property-value");
const service_playback_1 = require("./animation/service-playback");
const operation_policy_1 = require("./animation/operation-policy");
const operation_normalizer_1 = require("./animation/operation-normalizer");
const clip_library_1 = require("./animation/clip-library");
const scene_node_1 = require("./animation/scene-node");
const service_target_1 = require("./animation/service-target");
const SELF_SAVE_ASSET_REFRESH_SUPPRESSION_MS = 5000;
let AnimationService = class AnimationService extends core_1.BaseService {
    _session = null;
    _animationStates = new state_registry_1.AnimationStateRegistry(() => this._getSessionRootNode(), async (uuid) => (0, clip_library_1.resolveAnimationClip)(await (0, clip_library_1.queryNodeAnimationData)(this._getSessionRootNode(), uuid), uuid));
    _curEditTime = 0;
    _playState = 'stop';
    _selfSavedClipRefreshes = new Map();
    _playback = new service_playback_1.AnimationServicePlayback({
        getCurrentState: () => this._session ? this._animationStates.get(this._session.clipUuid) : undefined,
        getEditTime: () => this._curEditTime,
        getPlayState: () => this._playState,
        setEditTime: (time) => { this._curEditTime = time; },
        setPlayState: (playState) => { this._playState = playState; },
        enterAnimationMode: () => core_1.Service.Engine.enterAnimationMode(),
        exitAnimationMode: () => core_1.Service.Engine.exitAnimationMode(),
        repaintInEditMode: () => core_1.Service.Engine.repaintInEditMode(),
        broadcastTimeChanged: (reason) => this._broadcastTimeChanged(reason),
        broadcastStateChanged: async (reason) => {
            const currentState = await this.queryState();
            this._broadcastStateChanged(reason, currentState);
        },
    });
    _onAssetRefreshed = (uuid) => {
        void this._refreshCurrentClipAsset(uuid).catch((error) => {
            this._disposeSession();
            console.error('[Animation] refresh animation clip failed:', error);
        });
    };
    constructor() {
        super();
        core_1.ServiceEvents?.on?.('asset-refresh', this._onAssetRefreshed);
    }
    async enter(options) {
        (0, service_target_1.assertAnimationEditorOpened)(core_1.Service.Editor.getRootNode());
        if (this._session) {
            await this.exit({ restoreSelection: false, restoreSampledSceneState: true });
        }
        const rootNode = (0, scene_node_1.queryAnimationRootNode)(this._resolveNode(options), core_1.Service.Editor.getRootNode());
        const animData = await (0, clip_library_1.queryNodeAnimationData)(rootNode, options.clipUuid, { recoverClipBinding: true });
        const clip = (0, clip_library_1.resolveAnimationClip)(animData, options.clipUuid);
        const uuid = (0, utils_1.clipUuid)(clip);
        if (!uuid) {
            throw new Error('Animation clip uuid is empty.');
        }
        this._session = {
            previousEditorType: core_1.Service.Editor.getCurrentEditorType(),
            previousSelection: core_1.Service.Selection.query(),
            restoreSelectionOnExit: options.restoreSelectionOnExit ?? true,
            rootUuid: rootNode.uuid,
            rootPath: (0, scene_node_1.getNodePath)(rootNode),
            clipUuid: uuid,
            sampledRootState: (0, sampled_state_1.captureAnimationSampledState)(rootNode),
            undoBaseline: core_1.Service.Undo.createCheckpoint(),
            globalDirtyAtEnter: core_1.Service.Undo.isDirty(),
        };
        this._playState = 'stop';
        this._curEditTime = 0;
        await this._getAnimationState(uuid);
        await this.setTime({ time: 0 });
        const state = await this.queryState();
        this._broadcastStateChanged('enter', state);
        return state;
    }
    async exit(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        if (options.save) {
            await this.save();
        }
        else {
            await this._discardAnimationSessionChanges(session);
        }
        await this._stopCurrent();
        const shouldRestoreSampledState = options.restoreSampledSceneState ?? true;
        if (shouldRestoreSampledState && session.sampledRootState) {
            const rootNode = (0, scene_node_1.getNodeByUuid)(session.rootUuid);
            if (rootNode) {
                await (0, sampled_state_1.restoreAnimationSampledState)(rootNode, session.sampledRootState);
                this._emitNodeChanged(rootNode);
            }
        }
        this._animationStates.clear();
        core_1.Service.Engine.exitAnimationMode();
        const shouldRestoreSelection = options.restoreSelection ?? session.restoreSelectionOnExit;
        if (shouldRestoreSelection) {
            this._restoreSelection(session.previousSelection);
        }
        this._session = null;
        this._curEditTime = 0;
        this._playState = 'stop';
        await core_1.Service.Engine.repaintInEditMode();
        const state = await this.queryState();
        this._broadcastStateChanged('exit', state);
        return state;
    }
    async queryState() {
        const editorType = core_1.Service.Editor.getCurrentEditorType();
        const selection = core_1.Service.Selection.query();
        if (!this._session) {
            return {
                active: false,
                editorType,
                mode: (0, scene_node_1.getAnimationMode)(editorType),
                rootUuid: '',
                rootPath: '',
                clipUuid: '',
                time: 0,
                playState: 'stop',
                dirty: false,
                sceneDirty: core_1.Service.Undo.isDirty(),
                selection,
                restoreSelectionOnExit: true,
            };
        }
        this._refreshSessionRootPath(this._session);
        return {
            active: true,
            editorType,
            mode: 'animation',
            rootUuid: this._session.rootUuid,
            rootPath: this._session.rootPath,
            clipUuid: this._session.clipUuid,
            time: this._curEditTime,
            playState: this._playState,
            dirty: this._isAnimationSessionDirty(this._session),
            sceneDirty: this._isSceneSessionDirty(this._session),
            selection,
            restoreSelectionOnExit: this._session.restoreSelectionOnExit,
        };
    }
    async queryRoot(options) {
        const rootNode = (0, scene_node_1.queryAnimationRootNode)(this._resolveNode(options), core_1.Service.Editor.getRootNode());
        return {
            rootUuid: rootNode.uuid,
            rootPath: (0, scene_node_1.getNodePath)(rootNode),
        };
    }
    async queryRootInfo(options) {
        const rootNode = this._resolveRootNode(options);
        if (!(0, scene_node_1.queryAnimationComponent)(rootNode)) {
            const rootPath = (0, scene_node_1.getNodePath)(rootNode);
            return {
                rootUuid: rootNode.uuid,
                rootPath,
                clipsMenu: [],
                defaultClip: '',
                nodeTreeDump: await core_1.Service.Node.queryNodeTree({ path: rootPath }),
                clipDump: null,
                time: 0,
                state: 'stop',
                useBakedAnimation: false,
            };
        }
        const clipsInfo = await (0, clip_library_1.queryAnimationClipsInfo)(rootNode);
        const activeSession = this._session?.rootUuid === rootNode.uuid ? this._session : null;
        const clipUuid = activeSession?.clipUuid || clipsInfo.defaultClip;
        return {
            ...clipsInfo,
            nodeTreeDump: await core_1.Service.Node.queryNodeTree({ path: clipsInfo.rootPath }),
            clipDump: clipUuid ? await this.queryClip({ rootUuid: rootNode.uuid, clipUuid }) : null,
            time: activeSession && clipUuid ? await this.queryTime({ clipUuid }) : 0,
            state: activeSession ? this._playState : 'stop',
            useBakedAnimation: (0, scene_node_1.isUsingBakedAnimation)(rootNode),
        };
    }
    async queryClips(options) {
        return await (0, clip_library_1.queryAnimationClipsInfo)(this._resolveRootNode(options));
    }
    async queryClip(options) {
        const hasTarget = Boolean(options.rootPath || options.rootUuid || options.nodePath || options.nodeUuid);
        if (this._session) {
            this._refreshSessionRootPath(this._session);
            const uuid = options.clipUuid || this._session.clipUuid;
            const state = (0, service_target_1.isCurrentAnimationSessionClipQuery)(this._session, options, uuid, hasTarget)
                ? this._animationStates.get(uuid)
                : undefined;
            if (state) {
                return (0, service_target_1.createAnimationServiceClipDump)(this._getSessionRootNode(), state.clip, state);
            }
        }
        const { rootNode, clip } = await this._resolveClipForQuery(options);
        const uuid = (0, utils_1.clipUuid)(clip);
        const state = this._session?.rootUuid === rootNode.uuid
            ? this._animationStates.get(uuid)
            : undefined;
        return (0, service_target_1.createAnimationServiceClipDump)(rootNode, clip, state);
    }
    async queryProperties(options) {
        const node = this._resolveNode(options);
        const root = this._session ? (0, scene_node_1.getNodeByUuid)(this._session.rootUuid) : (0, scene_node_1.queryAnimationRootNode)(node, core_1.Service.Editor.getRootNode());
        return (0, service_target_1.queryAnimationServiceProperties)(node, root);
    }
    async queryTime(options) {
        if (!this._session) {
            return 0;
        }
        const uuid = options.clipUuid || this._session.clipUuid;
        if (uuid === this._session.clipUuid) {
            return this._curEditTime;
        }
        const state = this._animationStates.get(uuid);
        return state?.current ?? 0;
    }
    async queryPropertyValueAtFrame(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        this._refreshSessionRootPath(session);
        const uuid = options.clipUuid || session.clipUuid;
        if (uuid !== session.clipUuid) {
            throw new Error(`current edit clip: '${session.clipUuid}' but you want to operate: '${uuid}'`);
        }
        if (this._playState === 'playing') {
            const node = (0, service_target_1.resolveAnimationFrameQueryNode)(options, session);
            return (0, property_value_1.serializeAnimationPropertyValue)((0, scene_node_1.readPropertyValue)(node, options.propKey));
        }
        const state = await this._getAnimationState(uuid);
        const previousTime = this._curEditTime;
        const previousStateTime = typeof state.current === 'number' && Number.isFinite(state.current)
            ? state.current
            : previousTime;
        const wasPlaying = state.isPlaying;
        const wasPaused = state.isPaused;
        const sample = (0, utils_1.getClipSample)(state.clip);
        let value;
        try {
            state.weight = 1;
            state.setTime(options.frame / sample);
            if (!state.isPaused) {
                state.pause();
            }
            state.sample();
            const node = (0, service_target_1.resolveAnimationFrameQueryNode)(options, session);
            value = (0, property_value_1.serializeAnimationPropertyValue)((0, scene_node_1.readPropertyValue)(node, options.propKey));
        }
        finally {
            state.setTime(wasPlaying ? previousStateTime : previousTime);
            if (wasPlaying && !wasPaused) {
                state.sample();
                state.resume();
            }
            else if (!state.isPaused) {
                state.pause();
                state.sample();
            }
            else {
                state.sample();
            }
            this._curEditTime = previousTime;
            await core_1.Service.Engine.repaintInEditMode();
        }
        return value;
    }
    async queryAuxiliaryCurveValueAtFrame(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        const uuid = options.clipUuid || session.clipUuid;
        if (uuid !== session.clipUuid) {
            throw new Error(`current edit clip: '${session.clipUuid}' but you want to operate: '${uuid}'`);
        }
        const state = await this._getAnimationState(uuid);
        return (0, auxiliary_curve_1.queryAuxiliaryCurveValueAtFrame)(state.clip, options.name, options.frame);
    }
    async setTime(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        const state = await this._getAnimationState(session.clipUuid);
        let editTime = options.time;
        if (editTime < 0) {
            editTime = 0;
        }
        let sampleTime = editTime;
        if (((state.clip.wrapMode & cc_1.AnimationClip.WrapMode.Reverse) === cc_1.AnimationClip.WrapMode.Reverse)) {
            sampleTime = state.duration - Math.min(editTime, state.duration);
        }
        state.weight = 1;
        state.setTime(sampleTime);
        if (!state.isPaused) {
            state.pause();
        }
        state.sample();
        this._curEditTime = editTime;
        await core_1.Service.Engine.repaintInEditMode();
        this._broadcastTimeChanged('set-time');
        return true;
    }
    async changePlayState(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        const uuid = options.clipUuid || session.clipUuid;
        if (uuid !== session.clipUuid) {
            throw new Error(`current edit clip: '${session.clipUuid}' but you want to operate: '${uuid}'`);
        }
        const state = await this._getAnimationState(uuid);
        switch (options.operate) {
            case 'play':
                this._playback.play(state);
                break;
            case 'pause':
                this._playback.pause(state);
                break;
            case 'resume':
                this._playback.resume(state);
                break;
            case 'stop':
                await this._stopCurrent();
                break;
            default:
                throw new Error(`Unsupported animation play operation: ${String(options.operate)}`);
        }
        await core_1.Service.Engine.repaintInEditMode();
        this._broadcastStateChanged('play-state', await this.queryState());
        return true;
    }
    async changeEditClip(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        if (options.clipUuid === session.clipUuid) {
            return true;
        }
        await this._stopCurrent();
        (0, clip_library_1.resolveAnimationClip)(await (0, clip_library_1.queryNodeAnimationData)(this._getSessionRootNode(), options.clipUuid, { recoverClipBinding: true }), options.clipUuid);
        session.clipUuid = options.clipUuid;
        this._curEditTime = 0;
        await this._getAnimationState(options.clipUuid);
        await this.setTime({ time: 0 });
        this._broadcastClipChanged('change-clip');
        this._broadcastStateChanged('change-clip', await this.queryState());
        return true;
    }
    async applyOperations(options) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        if (!Array.isArray(options.operations)) {
            throw new Error('Animation operations must be an array.');
        }
        const rootNode = this._getSessionRootNode();
        const state = await this._getAnimationState(session.clipUuid);
        const clip = state.clip;
        const propertyMetadataContext = (0, service_target_1.createAnimationPropertyCurveMetadataContext)(rootNode);
        const shouldRecordUndo = options.recordUndo !== false;
        const before = (0, clip_snapshot_1.captureAnimationClipSnapshot)(clip, propertyMetadataContext);
        const appliedOperations = [];
        const isSkeleton = (0, scene_node_1.isSkeletonClip)(session.clipUuid, rootNode);
        let shouldSyncDuration = false;
        let shouldRestoreOnFailure = false;
        for (const inputOperation of options.operations) {
            const inputFailure = (0, clip_operations_1.validateAnimationOperation)(inputOperation, session.clipUuid);
            if (inputFailure) {
                if (shouldRestoreOnFailure) {
                    await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                }
                return inputFailure;
            }
            const targetFailure = validateAnimationPropertyTarget(inputOperation, rootNode, session.rootPath);
            if (targetFailure) {
                if (shouldRestoreOnFailure) {
                    await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                }
                return targetFailure;
            }
            if (isSkeleton && !(0, operation_policy_1.isAllowedSkeletonAnimationOperation)(inputOperation)) {
                const skeletonFailure = {
                    state: 'failure',
                    result: false,
                    reason: `Method '${inputOperation.type}' is not allowed in skeleton animation.`,
                };
                if (shouldRestoreOnFailure) {
                    await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                }
                return skeletonFailure;
            }
            const normalized = await (0, operation_normalizer_1.normalizeAnimationOperation)(inputOperation, {
                currentClipUuid: session.clipUuid,
                rootNode,
                rootPath: session.rootPath,
                queryPropertyValueAtFrame: (queryOptions) => this.queryPropertyValueAtFrame(queryOptions),
            });
            if ((0, operation_policy_1.isAnimationOperationResult)(normalized)) {
                if (shouldRestoreOnFailure) {
                    await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                }
                return normalized;
            }
            const operation = normalized;
            const failure = (0, clip_operations_1.validateAnimationOperation)(operation, session.clipUuid);
            if (failure) {
                if (shouldRestoreOnFailure) {
                    await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                }
                return failure;
            }
            let result = false;
            shouldRestoreOnFailure = true;
            try {
                await this._resetAnimationStatePreservingClip(session.clipUuid, clip, propertyMetadataContext);
                result = await (0, clip_operations_1.applyClipOperation)(clip, operation, {
                    rootNode,
                    rootPath: session.rootPath,
                    queryPropertyMetadata: propertyMetadataContext.queryPropertyMetadata,
                });
            }
            catch (error) {
                const normalizedError = error instanceof Error ? error : new Error(String(error));
                await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                return {
                    state: 'failure',
                    result: false,
                    reason: normalizedError.message,
                };
            }
            if (!result) {
                const failureResult = {
                    state: 'failure',
                    result: false,
                    reason: `call method ${operation.type} failed`,
                };
                await this._restoreFailedOperationSnapshot(clip, before, rootNode);
                return failureResult;
            }
            appliedOperations.push(operation);
            shouldSyncDuration = shouldSyncDuration || (0, operation_policy_1.shouldSyncAnimationClipDuration)(operation, isSkeleton);
        }
        if (shouldSyncDuration) {
            (0, clip_duration_1.syncAnimationClipDuration)(clip);
        }
        await this._resetAnimationStatePreservingClip(session.clipUuid, clip, propertyMetadataContext);
        this._animationStates.create(session.clipUuid, clip);
        await this.setTime({ time: this._curEditTime });
        const after = shouldRecordUndo ? (0, clip_snapshot_1.captureAnimationClipSnapshot)(clip, propertyMetadataContext) : null;
        const undoRecorded = Boolean(before && after && !(0, clip_snapshot_1.animationClipSnapshotsEqual)(before, after));
        if (undoRecorded && before && after) {
            const undoCommand = new undo_1.AnimationClipSnapshotCommand({
                clipUuid: session.clipUuid,
                before,
                after,
                applySnapshot: (snapshot) => this._restoreCurrentClipSnapshot(session.clipUuid, snapshot),
            });
            const previousScope = options.absorbPreviousScenePropertyUndo === true
                ? this._createPreviousScenePropertyUndoScope(session.rootPath, appliedOperations)
                : null;
            if (previousScope) {
                core_1.Service.Undo.pushWithPrevious(undoCommand, {
                    label: 'Animation Property Commit',
                    type: 'animation:property-commit',
                    scope: {
                        assetUuid: session.clipUuid,
                        editorType: 'animation',
                        mode: 'animation',
                    },
                    previousScope,
                    previousTypes: ['node:set-property', 'component:set-property', 'recording:snapshot'],
                });
            }
            else {
                core_1.Service.Undo.push(undoCommand);
            }
        }
        this._broadcastClipChanged('operation');
        return {
            state: 'success',
            result: true,
            undoRecorded,
        };
    }
    async save(options = {}) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        const state = await this._getAnimationState(session.clipUuid);
        const rootNode = this._getSessionRootNode();
        (0, utils_1.ensureClipEvents)(state.clip);
        if (options.target) {
            return await (0, service_save_1.saveAnimationServiceClip)({
                session,
                rootNode,
                clip: state.clip,
                target: options.target,
            });
        }
        const propertyMetadataContext = (0, service_target_1.createAnimationPropertyCurveMetadataContext)(rootNode);
        const savedSnapshot = (0, clip_snapshot_1.captureAnimationClipSnapshot)(state.clip, propertyMetadataContext);
        const animationDirtyAtSave = this._isAnimationSessionDirty(session);
        this._markSelfSavedClipRefresh(session.clipUuid);
        let saved = false;
        try {
            saved = await (0, service_save_1.saveAnimationServiceClip)({
                session,
                rootNode,
                clip: state.clip,
            });
        }
        catch (error) {
            this._selfSavedClipRefreshes.delete(session.clipUuid);
            throw error;
        }
        if (saved) {
            await this._restoreCurrentClipAfterSelfSave(session.clipUuid, state.clip, savedSnapshot, propertyMetadataContext);
            const currentState = await this._getAnimationState(session.clipUuid);
            const animComp = (0, scene_node_1.queryAnimationComponent)(rootNode);
            if (animComp instanceof cc_1.Animation) {
                (0, clip_library_1.rebindAnimationComponentClip)(animComp, currentState.clip);
            }
            this._markSelfSavedClipRefresh(session.clipUuid);
            if (options.saveScene === true) {
                await this._saveSceneForAnimationSession(session);
            }
            else {
                const animationScope = this._createAnimationUndoScope(session.clipUuid);
                const hasNonAnimationDifference = core_1.Service.Undo.hasDifferenceOutsideScope(session.undoBaseline, animationScope);
                if (!session.globalDirtyAtEnter && !hasNonAnimationDifference) {
                    core_1.Service.Undo.markSaved();
                }
            }
            session.undoBaseline = {
                ...core_1.Service.Undo.createCheckpoint(),
                includeCheckpointCommand: animationDirtyAtSave,
            };
            session.globalDirtyAtEnter = core_1.Service.Undo.isDirty();
        }
        else {
            this._selfSavedClipRefreshes.delete(session.clipUuid);
        }
        return saved;
    }
    preserveCurrentClipAssetForChange(uuid) {
        if (!this._session || this._session.clipUuid !== uuid || !this._animationStates.get(uuid)) {
            return false;
        }
        this._rebindCurrentAnimationStateClip(uuid);
        return true;
    }
    onAssetDeleted(uuid) {
        if (!this._session || this._session.clipUuid !== uuid) {
            return;
        }
        void this.exit({ restoreSelection: false, restoreSampledSceneState: true }).catch((error) => {
            this._disposeSession();
            console.error('[Animation] exit after animation clip deletion failed:', error);
        });
    }
    onEditorClosed() {
        this._disposeSession();
    }
    _resolveRootNode(options) {
        return (0, service_target_1.resolveAnimationRootTarget)(options, core_1.Service.Editor.getRootNode(), core_1.Service.Selection.query());
    }
    _resolveNode(options) {
        return (0, service_target_1.resolveAnimationTargetNode)(options, core_1.Service.Editor.getRootNode(), core_1.Service.Selection.query());
    }
    async _resolveClipForQuery(options) {
        const hasTarget = Boolean(options.rootPath || options.rootUuid || options.nodePath || options.nodeUuid);
        const rootNode = hasTarget ? this._resolveRootNode(options) : this._getSessionRootNode();
        const defaultUuid = this._session?.rootUuid === rootNode.uuid ? this._session.clipUuid : undefined;
        const targetUuid = options.clipUuid || defaultUuid;
        const animData = await (0, clip_library_1.queryNodeAnimationData)(rootNode, targetUuid);
        return {
            rootNode,
            clip: (0, clip_library_1.resolveAnimationClip)(animData, targetUuid),
        };
    }
    async _getAnimationState(uuid) {
        (0, service_target_1.requireAnimationSession)(this._session);
        return this._animationStates.getOrCreate(uuid);
    }
    async _stopCurrent() {
        await this._playback.stopCurrent();
    }
    async _resetAnimationStatePreservingClip(uuid, clip, options = (0, service_target_1.createAnimationPropertyCurveMetadataContext)(this._getSessionRootNode())) {
        if (!this._animationStates.get(uuid)) {
            return;
        }
        // AnimationState.destroy() may touch curves it initialized. Preserve the
        // current clip data around reset so state cleanup cannot wipe existing or
        // newly edited keyframes.
        const snapshot = (0, clip_snapshot_1.captureAnimationClipSnapshot)(clip, options);
        this._animationStates.reset(uuid);
        await (0, clip_snapshot_1.restoreAnimationClipSnapshot)(clip, snapshot);
    }
    async _restoreFailedOperationSnapshot(clip, snapshot, _rootNode) {
        const uuid = (0, utils_1.clipUuid)(clip);
        try {
            await this._restoreClipSnapshotWithStateRecreation(uuid, clip, snapshot);
        }
        catch (error) {
            console.error('[Animation] restore failed operation snapshot failed:', error);
            throw error;
        }
        await this.setTime({ time: this._curEditTime });
    }
    async _restoreCurrentClipSnapshot(uuid, snapshot) {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        if (uuid !== session.clipUuid) {
            throw new Error(`current edit clip: '${session.clipUuid}' but you want to restore: '${uuid}'`);
        }
        const state = await this._getAnimationState(uuid);
        const clip = state.clip;
        await this._restoreClipSnapshotWithStateRecreation(uuid, clip, snapshot, true);
        await this.setTime({ time: this._curEditTime });
        this._broadcastClipChanged('undo-redo');
    }
    async _restoreCurrentClipAfterSelfSave(uuid, clip, snapshot, propertyMetadataContext) {
        const currentState = this._animationStates.get(uuid);
        if (!currentState || currentState.clip !== clip) {
            return;
        }
        const currentSnapshot = (0, clip_snapshot_1.captureAnimationClipSnapshot)(clip, propertyMetadataContext);
        if ((0, clip_snapshot_1.animationClipSnapshotsEqual)(currentSnapshot, snapshot)) {
            return;
        }
        await this._restoreClipSnapshotWithStateRecreation(uuid, clip, snapshot, true);
        await this.setTime({ time: this._curEditTime });
    }
    async _restoreClipSnapshotWithStateRecreation(uuid, clip, snapshot, shouldRecreateState = Boolean(this._animationStates.get(uuid))) {
        if (shouldRecreateState) {
            // Destroy the old state before replacing clip tracks; destroy() may touch curves it initialized.
            this._animationStates.reset(uuid);
        }
        try {
            await (0, clip_snapshot_1.restoreAnimationClipSnapshot)(clip, snapshot);
        }
        catch (error) {
            if (shouldRecreateState) {
                this._animationStates.create(uuid, clip);
            }
            throw error;
        }
        if (shouldRecreateState) {
            this._animationStates.create(uuid, clip);
        }
    }
    async _refreshCurrentClipAsset(uuid) {
        if (!this._session || this._session.clipUuid !== uuid) {
            return;
        }
        const currentState = this._animationStates.get(uuid);
        if (currentState) {
            this._rebindCurrentAnimationStateClip(uuid);
            return;
        }
        if (this._shouldSuppressSelfSavedClipRefresh(uuid)) {
            return;
        }
        const time = this._curEditTime;
        const clip = await (0, clip_library_1.loadAnimationClip)(uuid);
        if (!this._session || this._session.clipUuid !== uuid) {
            return;
        }
        if (this._shouldSuppressSelfSavedClipRefresh(uuid)) {
            return;
        }
        const rootNode = this._getSessionRootNode();
        const animComp = (0, scene_node_1.queryAnimationComponent)(rootNode);
        if (clip && animComp instanceof cc_1.Animation) {
            (0, clip_library_1.rebindAnimationComponentClip)(animComp, clip);
        }
        this._animationStates.reset(uuid);
        await this._getAnimationState(uuid);
        await this.setTime({ time });
        this._broadcastClipChanged('asset-refresh');
    }
    _rebindCurrentAnimationStateClip(uuid) {
        const currentState = this._animationStates.get(uuid);
        if (!currentState) {
            return;
        }
        const rootNode = this._getSessionRootNode();
        const animComp = (0, scene_node_1.queryAnimationComponent)(rootNode);
        if (animComp instanceof cc_1.Animation) {
            (0, clip_library_1.rebindAnimationComponentClip)(animComp, currentState.clip);
        }
    }
    _disposeSession() {
        this._playback.dispose();
        this._animationStates.clear();
        this._session = null;
        this._curEditTime = 0;
        this._playState = 'stop';
    }
    _restoreSelection(selection) {
        core_1.Service.Selection.clear();
        for (const path of selection.slice().reverse()) {
            if ((0, scene_node_1.getNodeByPath)(path)) {
                core_1.Service.Selection.select(path);
            }
        }
    }
    _emitNodeChanged(node) {
        this.emit('node:change', node, {
            source: 'editor',
            type: common_1.NodeEventType.NOTIFY_NODE_CHANGED,
            record: false,
        });
    }
    _broadcastStateChanged(reason, state) {
        this.broadcast('animation:state-changed', { reason, state });
    }
    _broadcastTimeChanged(reason) {
        if (this._session) {
            this._refreshSessionRootPath(this._session);
        }
        const event = (0, service_target_1.createAnimationServiceClipEvent)(this._session, reason);
        if (!event) {
            return;
        }
        this.broadcast('animation:time-changed', {
            ...event,
            time: this._curEditTime,
            playState: this._playState,
        });
    }
    _broadcastClipChanged(reason) {
        if (this._session) {
            this._refreshSessionRootPath(this._session);
        }
        const event = (0, service_target_1.createAnimationServiceClipEvent)(this._session, reason);
        if (!event) {
            return;
        }
        this.broadcast('animation:clip-changed', event);
    }
    async _saveSceneForAnimationSession(session) {
        const rootNode = (0, scene_node_1.getNodeByUuid)(session.rootUuid);
        if (!rootNode || !session.sampledRootState) {
            await core_1.Service.Editor.save({});
            return;
        }
        const editTime = this._curEditTime;
        await this._stopCurrent();
        await (0, sampled_state_1.restoreAnimationSampledState)(rootNode, session.sampledRootState);
        try {
            await core_1.Service.Editor.save({});
        }
        finally {
            await this.setTime({ time: editTime });
        }
    }
    _getSessionRootNode() {
        const session = (0, service_target_1.requireAnimationSession)(this._session);
        const rootNode = (0, service_target_1.getAnimationSessionRootNode)(session);
        const rootPath = (0, scene_node_1.getNodePath)(rootNode);
        if (rootPath) {
            session.rootPath = rootPath;
        }
        return rootNode;
    }
    _refreshSessionRootPath(session) {
        const rootNode = (0, scene_node_1.getNodeByUuid)(session.rootUuid);
        if (rootNode) {
            const rootPath = (0, scene_node_1.getNodePath)(rootNode);
            if (rootPath) {
                session.rootPath = rootPath;
            }
        }
    }
    async _discardAnimationSessionChanges(session) {
        const scope = this._createAnimationUndoScope(session.clipUuid);
        const result = await core_1.Service.Undo.discardScopedChangesAfterCheckpoint(session.undoBaseline, scope);
        if (!result.success) {
            throw new Error(result.reason || 'Failed to discard animation changes.');
        }
    }
    _isAnimationSessionDirty(session) {
        const scope = this._createAnimationUndoScope(session.clipUuid);
        if (session.undoBaseline.includeCheckpointCommand) {
            return core_1.Service.Undo.hasScopedDifference(session.undoBaseline, scope);
        }
        return core_1.Service.Undo.hasScopedDifferenceAfterCheckpoint(session.undoBaseline, scope);
    }
    _isSceneSessionDirty(session) {
        if (session.globalDirtyAtEnter) {
            return true;
        }
        return core_1.Service.Undo.hasDifferenceOutsideScope(session.undoBaseline, this._createAnimationUndoScope(session.clipUuid));
    }
    _createAnimationUndoScope(clipUuid) {
        return {
            assetUuid: clipUuid,
            editorType: 'animation',
            mode: 'animation',
        };
    }
    _markSelfSavedClipRefresh(uuid) {
        this._selfSavedClipRefreshes.set(uuid, Date.now());
    }
    _shouldSuppressSelfSavedClipRefresh(uuid) {
        const savedAt = this._selfSavedClipRefreshes.get(uuid);
        if (savedAt === undefined) {
            return false;
        }
        if (Date.now() - savedAt <= SELF_SAVE_ASSET_REFRESH_SUPPRESSION_MS) {
            return true;
        }
        this._selfSavedClipRefreshes.delete(uuid);
        return false;
    }
    _createPreviousScenePropertyUndoScope(rootPath, operations) {
        if (operations.length === 0) {
            return null;
        }
        const targets = new Map();
        for (const operation of operations) {
            if (!('propKey' in operation)) {
                return null;
            }
            const nodePath = this._resolveScenePropertyNodePath(rootPath, operation);
            if (!nodePath) {
                return null;
            }
            const target = { nodePath, propPath: operation.propKey };
            targets.set(`${target.nodePath}\n${target.propPath}`, target);
        }
        if (targets.size !== 1) {
            return null;
        }
        const [target] = targets.values();
        return {
            editorType: 'scene',
            nodePath: target.nodePath,
            propPath: target.propPath,
        };
    }
    _resolveScenePropertyNodePath(rootPath, operation) {
        if (operation.nodeUuid) {
            const node = (0, scene_node_1.getNodeByUuid)(operation.nodeUuid);
            return node ? (0, scene_node_1.getNodePath)(node) : null;
        }
        const normalizedRootPath = normalizeSceneNodePath(rootPath);
        const normalizedNodePath = normalizeSceneNodePath(operation.nodePath || '');
        if (!normalizedNodePath || normalizedNodePath === normalizedRootPath) {
            return normalizedRootPath;
        }
        if (normalizedRootPath && normalizedNodePath.startsWith(`${normalizedRootPath}/`)) {
            return normalizedNodePath;
        }
        return normalizedRootPath ? `${normalizedRootPath}/${normalizedNodePath}` : normalizedNodePath;
    }
};
exports.AnimationService = AnimationService;
exports.AnimationService = AnimationService = __decorate([
    (0, core_1.register)('Animation'),
    __metadata("design:paramtypes", [])
], AnimationService);
function normalizeSceneNodePath(path) {
    return String(path || '').replace(/^\/+|\/+$/g, '');
}
function validateAnimationPropertyTarget(operation, rootNode, rootPath) {
    if (!('propKey' in operation)) {
        return null;
    }
    if ((0, scene_node_1.resolveAnimationRelativeNodePath)(rootNode, rootPath, operation) !== null) {
        return null;
    }
    const target = operation.nodeUuid
        ? `UUID "${operation.nodeUuid}"`
        : `path "${operation.nodePath || '<root>'}"`;
    const reason = `Animation property target ${target} is not bound by the current animation hierarchy.`;
    console.warn(`[Animation] ${reason}`);
    return {
        state: 'failure',
        result: false,
        reason,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2FuaW1hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQkFJWTtBQUVaLHlDQTBCc0I7QUFDdEIsaUNBQXVFO0FBQ3ZFLDZEQUttQztBQUNuQyw2REFBc0U7QUFDdEUsaUVBQTZGO0FBQzdGLGlFQUE4RTtBQUM5RSw2REFBdUc7QUFDdkcsMkRBQW9FO0FBQ3BFLCtEQUFvRTtBQUNwRSwyQ0FBZ0U7QUFFaEUsNkNBQThFO0FBQzlFLCtEQUE2RTtBQUM3RSxtRUFBd0U7QUFDeEUsbUVBQWdKO0FBQ2hKLDJFQUErRTtBQUMvRSwyREFNa0M7QUFDbEMsdURBV2dDO0FBQ2hDLCtEQVlvQztBQUVwQyxNQUFNLHNDQUFzQyxHQUFHLElBQUksQ0FBQztBQUc3QyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLGtCQUFnQztJQUMxRCxRQUFRLEdBQTZCLElBQUksQ0FBQztJQUNqQyxnQkFBZ0IsR0FBRyxJQUFJLHVDQUFzQixDQUMxRCxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFDaEMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBQSxtQ0FBb0IsRUFBQyxNQUFNLElBQUEscUNBQXNCLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQzdHLENBQUM7SUFDTSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLFVBQVUsR0FBdUIsTUFBTSxDQUFDO0lBQy9CLHVCQUF1QixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBQ3BELFNBQVMsR0FBRyxJQUFJLDJDQUF3QixDQUFDO1FBQ3RELGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFDcEcsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZO1FBQ3BDLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVTtRQUNuQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwRCxZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFPLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFO1FBQzdELGlCQUFpQixFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUU7UUFDM0QsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRTtRQUMzRCxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQztRQUNwRSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDcEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RCxDQUFDO0tBQ0osQ0FBQyxDQUFDO0lBQ2MsaUJBQWlCLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtRQUNsRCxLQUFLLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNyRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2RSxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQztJQUVGO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFDUixvQkFBYSxFQUFFLEVBQUUsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUErQjtRQUN2QyxJQUFBLDRDQUEyQixFQUFDLGNBQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUUxRCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBQSxtQ0FBc0IsRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLGNBQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNsRyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEscUNBQXNCLEVBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3hHLE1BQU0sSUFBSSxHQUFHLElBQUEsbUNBQW9CLEVBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RCxNQUFNLElBQUksR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHO1lBQ1osa0JBQWtCLEVBQUUsY0FBTyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRTtZQUN6RCxpQkFBaUIsRUFBRSxjQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtZQUM1QyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsc0JBQXNCLElBQUksSUFBSTtZQUM5RCxRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUk7WUFDdkIsUUFBUSxFQUFFLElBQUEsd0JBQVcsRUFBQyxRQUFRLENBQUM7WUFDL0IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0IsRUFBRSxJQUFBLDRDQUE0QixFQUFDLFFBQVEsQ0FBQztZQUN4RCxZQUFZLEVBQUUsY0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUM3QyxrQkFBa0IsRUFBRSxjQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtTQUM3QyxDQUFDO1FBRUYsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFDekIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDdEIsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUE4QjtRQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFBLHdDQUF1QixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV2RCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNmLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTSxJQUFJLENBQUMsK0JBQStCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTFCLE1BQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixJQUFJLElBQUksQ0FBQztRQUMzRSxJQUFJLHlCQUF5QixJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUEsMEJBQWEsRUFBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDWCxNQUFNLElBQUEsNENBQTRCLEVBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDOUIsY0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBRW5DLE1BQU0sc0JBQXNCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztRQUMxRixJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztRQUN6QixNQUFNLGNBQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6QyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNDLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVTtRQUNaLE1BQU0sVUFBVSxHQUFHLGNBQU8sQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUN6RCxNQUFNLFNBQVMsR0FBRyxjQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakIsT0FBTztnQkFDSCxNQUFNLEVBQUUsS0FBSztnQkFDYixVQUFVO2dCQUNWLElBQUksRUFBRSxJQUFBLDZCQUFnQixFQUFDLFVBQVUsQ0FBQztnQkFDbEMsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osUUFBUSxFQUFFLEVBQUU7Z0JBQ1osUUFBUSxFQUFFLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLENBQUM7Z0JBQ1AsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLEtBQUssRUFBRSxLQUFLO2dCQUNaLFVBQVUsRUFBRSxjQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDbEMsU0FBUztnQkFDVCxzQkFBc0IsRUFBRSxJQUFJO2FBQy9CLENBQUM7UUFDTixDQUFDO1FBRUQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU1QyxPQUFPO1lBQ0gsTUFBTSxFQUFFLElBQUk7WUFDWixVQUFVO1lBQ1YsSUFBSSxFQUFFLFdBQVc7WUFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUTtZQUNoQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRO1lBQ2hDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVE7WUFDaEMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMxQixLQUFLLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDbkQsVUFBVSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3BELFNBQVM7WUFDVCxzQkFBc0IsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLHNCQUFzQjtTQUMvRCxDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBZ0M7UUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBQSxtQ0FBc0IsRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLGNBQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNsRyxPQUFPO1lBQ0gsUUFBUSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1lBQ3ZCLFFBQVEsRUFBRSxJQUFBLHdCQUFXLEVBQUMsUUFBUSxDQUFDO1NBQ2xDLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFnQztRQUNoRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLElBQUEsb0NBQXVCLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNyQyxNQUFNLFFBQVEsR0FBRyxJQUFBLHdCQUFXLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsT0FBTztnQkFDSCxRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUk7Z0JBQ3ZCLFFBQVE7Z0JBQ1IsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsWUFBWSxFQUFFLE1BQU0sY0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQ2xFLFFBQVEsRUFBRSxJQUFJO2dCQUNkLElBQUksRUFBRSxDQUFDO2dCQUNQLEtBQUssRUFBRSxNQUFNO2dCQUNiLGlCQUFpQixFQUFFLEtBQUs7YUFDM0IsQ0FBQztRQUNOLENBQUM7UUFDRCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsc0NBQXVCLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3ZGLE1BQU0sUUFBUSxHQUFHLGFBQWEsRUFBRSxRQUFRLElBQUksU0FBUyxDQUFDLFdBQVcsQ0FBQztRQUNsRSxPQUFPO1lBQ0gsR0FBRyxTQUFTO1lBQ1osWUFBWSxFQUFFLE1BQU0sY0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzVFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDdkYsSUFBSSxFQUFFLGFBQWEsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTTtZQUMvQyxpQkFBaUIsRUFBRSxJQUFBLGtDQUFxQixFQUFDLFFBQVEsQ0FBQztTQUNyRCxDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBZ0M7UUFDN0MsT0FBTyxNQUFNLElBQUEsc0NBQXVCLEVBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBbUM7UUFDL0MsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4RyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDeEQsTUFBTSxLQUFLLEdBQUcsSUFBQSxtREFBa0MsRUFBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDO2dCQUNyRixDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDaEIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDUixPQUFPLElBQUEsK0NBQThCLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RixDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEUsTUFBTSxJQUFJLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxLQUFLLFFBQVEsQ0FBQyxJQUFJO1lBQ25ELENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNqQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2hCLE9BQU8sSUFBQSwrQ0FBOEIsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQWdDO1FBQ2xELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSwwQkFBYSxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsbUNBQXNCLEVBQUMsSUFBSSxFQUFFLGNBQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNoSSxPQUFPLElBQUEsZ0RBQStCLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQThCO1FBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakIsT0FBTyxDQUFDLENBQUM7UUFDYixDQUFDO1FBQ0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUN4RCxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUM3QixDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxPQUFPLEtBQUssRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxLQUFLLENBQUMseUJBQXlCLENBQUMsT0FBbUQ7UUFDL0UsTUFBTSxPQUFPLEdBQUcsSUFBQSx3Q0FBdUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUNsRCxJQUFJLElBQUksS0FBSyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsT0FBTyxDQUFDLFFBQVEsK0JBQStCLElBQUksR0FBRyxDQUFDLENBQUM7UUFDbkcsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNoQyxNQUFNLElBQUksR0FBRyxJQUFBLCtDQUE4QixFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5RCxPQUFPLElBQUEsZ0RBQStCLEVBQUMsSUFBQSw4QkFBaUIsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDckYsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDdkMsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLEtBQUssQ0FBQyxPQUFPLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUN6RixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU87WUFDZixDQUFDLENBQUMsWUFBWSxDQUFDO1FBQ25CLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDbkMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFhLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLElBQUksS0FBc0IsQ0FBQztRQUMzQixJQUFJLENBQUM7WUFDRCxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNqQixLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xCLENBQUM7WUFDRCxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFZixNQUFNLElBQUksR0FBRyxJQUFBLCtDQUE4QixFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5RCxLQUFLLEdBQUcsSUFBQSxnREFBK0IsRUFBQyxJQUFBLDhCQUFpQixFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN0RixDQUFDO2dCQUFTLENBQUM7WUFDUCxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzdELElBQUksVUFBVSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNCLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDZixLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkIsQ0FBQztpQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6QixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2QsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25CLENBQUM7aUJBQU0sQ0FBQztnQkFDSixLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQ2pDLE1BQU0sY0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzdDLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsS0FBSyxDQUFDLCtCQUErQixDQUFDLE9BQXlEO1FBQzNGLE1BQU0sT0FBTyxHQUFHLElBQUEsd0NBQXVCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUNsRCxJQUFJLElBQUksS0FBSyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsT0FBTyxDQUFDLFFBQVEsK0JBQStCLElBQUksR0FBRyxDQUFDLENBQUM7UUFDbkcsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELE9BQU8sSUFBQSxpREFBK0IsRUFBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQWlDO1FBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUEsd0NBQXVCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RCxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQzVCLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2YsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUNqQixDQUFDO1FBQ0QsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDO1FBRTFCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLGtCQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGtCQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDOUYsVUFBVSxHQUFHLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNqQixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2xCLENBQUM7UUFDRCxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQztRQUM3QixNQUFNLGNBQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBbUM7UUFDckQsTUFBTSxPQUFPLEdBQUcsSUFBQSx3Q0FBdUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ2xELElBQUksSUFBSSxLQUFLLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixPQUFPLENBQUMsUUFBUSwrQkFBK0IsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbEQsUUFBUSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsS0FBSyxNQUFNO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzQixNQUFNO1lBQ1YsS0FBSyxPQUFPO2dCQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixNQUFNO1lBQ1YsS0FBSyxRQUFRO2dCQUNULElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixNQUFNO1lBQ1YsS0FBSyxNQUFNO2dCQUNQLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUMxQixNQUFNO1lBQ1Y7Z0JBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVELE1BQU0sY0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUNuRSxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFrQztRQUNuRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHdDQUF1QixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMxQixJQUFBLG1DQUFvQixFQUFDLE1BQU0sSUFBQSxxQ0FBc0IsRUFBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakosT0FBTyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRCxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQW1DO1FBQ3JELE1BQU0sT0FBTyxHQUFHLElBQUEsd0NBQXVCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDNUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSx1QkFBdUIsR0FBRyxJQUFBLDREQUEyQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUM7UUFDdEQsTUFBTSxNQUFNLEdBQUcsSUFBQSw0Q0FBNEIsRUFBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUMzRSxNQUFNLGlCQUFpQixHQUEwQixFQUFFLENBQUM7UUFDcEQsTUFBTSxVQUFVLEdBQUcsSUFBQSwyQkFBYyxFQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDOUQsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7UUFDL0IsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDbkMsS0FBSyxNQUFNLGNBQWMsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDOUMsTUFBTSxZQUFZLEdBQUcsSUFBQSw0Q0FBMEIsRUFBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xGLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO29CQUN6QixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUNELE9BQU8sWUFBWSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxNQUFNLGFBQWEsR0FBRywrQkFBK0IsQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRyxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNoQixJQUFJLHNCQUFzQixFQUFFLENBQUM7b0JBQ3pCLE1BQU0sSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7Z0JBQ0QsT0FBTyxhQUFhLENBQUM7WUFDekIsQ0FBQztZQUNELElBQUksVUFBVSxJQUFJLENBQUMsSUFBQSxzREFBbUMsRUFBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dCQUNyRSxNQUFNLGVBQWUsR0FBRztvQkFDcEIsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLE1BQU0sRUFBRSxLQUFLO29CQUNiLE1BQU0sRUFBRSxXQUFXLGNBQWMsQ0FBQyxJQUFJLHlDQUF5QztpQkFDckQsQ0FBQztnQkFDL0IsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO29CQUN6QixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUNELE9BQU8sZUFBZSxDQUFDO1lBQzNCLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsa0RBQTJCLEVBQUMsY0FBYyxFQUFFO2dCQUNqRSxlQUFlLEVBQUUsT0FBTyxDQUFDLFFBQVE7Z0JBQ2pDLFFBQVE7Z0JBQ1IsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO2dCQUMxQix5QkFBeUIsRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLFlBQVksQ0FBQzthQUM1RixDQUFDLENBQUM7WUFDSCxJQUFJLElBQUEsNkNBQTBCLEVBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO29CQUN6QixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUNELE9BQU8sVUFBVSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUM7WUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBQSw0Q0FBMEIsRUFBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hFLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO29CQUN6QixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUNELE9BQU8sT0FBTyxDQUFDO1lBQ25CLENBQUM7WUFFRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDbkIsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLElBQUksQ0FBQztnQkFDRCxNQUFNLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO2dCQUMvRixNQUFNLEdBQUcsTUFBTSxJQUFBLG9DQUFrQixFQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7b0JBQy9DLFFBQVE7b0JBQ1IsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO29CQUMxQixxQkFBcUIsRUFBRSx1QkFBdUIsQ0FBQyxxQkFBcUI7aUJBQ3ZFLENBQUMsQ0FBQztZQUNQLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNiLE1BQU0sZUFBZSxHQUFHLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ25FLE9BQU87b0JBQ0gsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLE1BQU0sRUFBRSxLQUFLO29CQUNiLE1BQU0sRUFBRSxlQUFlLENBQUMsT0FBTztpQkFDbEMsQ0FBQztZQUNOLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxhQUFhLEdBQUc7b0JBQ2xCLEtBQUssRUFBRSxTQUFTO29CQUNoQixNQUFNLEVBQUUsS0FBSztvQkFDYixNQUFNLEVBQUUsZUFBZSxTQUFTLENBQUMsSUFBSSxTQUFTO2lCQUNwQixDQUFDO2dCQUMvQixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRSxPQUFPLGFBQWEsQ0FBQztZQUN6QixDQUFDO1lBQ0QsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xDLGtCQUFrQixHQUFHLGtCQUFrQixJQUFJLElBQUEsa0RBQStCLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3RHLENBQUM7UUFFRCxJQUFJLGtCQUFrQixFQUFFLENBQUM7WUFDckIsSUFBQSx5Q0FBeUIsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQ0QsTUFBTSxJQUFJLENBQUMsa0NBQWtDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUMvRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckQsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFBLDRDQUE0QixFQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDcEcsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFBLDJDQUEyQixFQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzdGLElBQUksWUFBWSxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNsQyxNQUFNLFdBQVcsR0FBRyxJQUFJLG1DQUE0QixDQUFDO2dCQUNqRCxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7Z0JBQzFCLE1BQU07Z0JBQ04sS0FBSztnQkFDTCxhQUFhLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQzthQUM1RixDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsK0JBQStCLEtBQUssSUFBSTtnQkFDbEUsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDO2dCQUNqRixDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ1gsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDaEIsY0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUU7b0JBQ3ZDLEtBQUssRUFBRSwyQkFBMkI7b0JBQ2xDLElBQUksRUFBRSwyQkFBMkI7b0JBQ2pDLEtBQUssRUFBRTt3QkFDSCxTQUFTLEVBQUUsT0FBTyxDQUFDLFFBQVE7d0JBQzNCLFVBQVUsRUFBRSxXQUFXO3dCQUN2QixJQUFJLEVBQUUsV0FBVztxQkFDcEI7b0JBQ0QsYUFBYTtvQkFDYixhQUFhLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSx3QkFBd0IsRUFBRSxvQkFBb0IsQ0FBQztpQkFDdkYsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLGNBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDTCxDQUFDO1FBQ0QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLE9BQU87WUFDSCxLQUFLLEVBQUUsU0FBUztZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLFlBQVk7U0FDZixDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBaUMsRUFBRTtRQUMxQyxNQUFNLE9BQU8sR0FBRyxJQUFBLHdDQUF1QixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDNUMsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsT0FBTyxNQUFNLElBQUEsdUNBQXdCLEVBQUM7Z0JBQ2xDLE9BQU87Z0JBQ1AsUUFBUTtnQkFDUixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTthQUN6QixDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsTUFBTSx1QkFBdUIsR0FBRyxJQUFBLDREQUEyQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sYUFBYSxHQUFHLElBQUEsNENBQTRCLEVBQUMsS0FBSyxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLElBQUksQ0FBQztZQUNELEtBQUssR0FBRyxNQUFNLElBQUEsdUNBQXdCLEVBQUM7Z0JBQ25DLE9BQU87Z0JBQ1AsUUFBUTtnQkFDUixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RCxNQUFNLEtBQUssQ0FBQztRQUNoQixDQUFDO1FBQ0QsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNSLE1BQU0sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUNsSCxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckUsTUFBTSxRQUFRLEdBQUcsSUFBQSxvQ0FBdUIsRUFBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLFFBQVEsWUFBWSxjQUFTLEVBQUUsQ0FBQztnQkFDaEMsSUFBQSwyQ0FBNEIsRUFBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFDRCxJQUFJLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pELElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0seUJBQXlCLEdBQUcsY0FBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUMvRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztvQkFDNUQsY0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsQ0FBQztZQUNMLENBQUM7WUFDRCxPQUFPLENBQUMsWUFBWSxHQUFHO2dCQUNuQixHQUFHLGNBQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ2xDLHdCQUF3QixFQUFFLG9CQUFvQjthQUNqRCxDQUFDO1lBQ0YsT0FBTyxDQUFDLGtCQUFrQixHQUFHLGNBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDeEQsQ0FBQzthQUFNLENBQUM7WUFDSixJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUdELGlDQUFpQyxDQUFDLElBQVk7UUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3hGLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFDRCxJQUFJLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELGNBQWMsQ0FBQyxJQUFZO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3BELE9BQU87UUFDWCxDQUFDO1FBQ0QsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDeEYsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0RBQXdELEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkYsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsY0FBYztRQUNWLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRU8sZ0JBQWdCLENBQUMsT0FBZ0M7UUFDckQsT0FBTyxJQUFBLDJDQUEwQixFQUFDLE9BQU8sRUFBRSxjQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLGNBQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN4RyxDQUFDO0lBRU8sWUFBWSxDQUFDLE9BQXlEO1FBQzFFLE9BQU8sSUFBQSwyQ0FBMEIsRUFBQyxPQUFPLEVBQUUsY0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxjQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDeEcsQ0FBQztJQUVPLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUFtQztRQUNsRSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hHLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUN6RixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ25HLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksV0FBVyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSxxQ0FBc0IsRUFBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILFFBQVE7WUFDUixJQUFJLEVBQUUsSUFBQSxtQ0FBb0IsRUFBQyxRQUFRLEVBQUUsVUFBVSxDQUFDO1NBQ25ELENBQUM7SUFDTixDQUFDO0lBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQVk7UUFDekMsSUFBQSx3Q0FBdUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFTyxLQUFLLENBQUMsWUFBWTtRQUN0QixNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVPLEtBQUssQ0FBQyxrQ0FBa0MsQ0FDNUMsSUFBWSxFQUNaLElBQW1CLEVBQ25CLE9BQU8sR0FBRyxJQUFBLDREQUEyQyxFQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBRWpGLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbkMsT0FBTztRQUNYLENBQUM7UUFFRCx5RUFBeUU7UUFDekUsMEVBQTBFO1FBQzFFLDBCQUEwQjtRQUMxQixNQUFNLFFBQVEsR0FBRyxJQUFBLDRDQUE0QixFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sSUFBQSw0Q0FBNEIsRUFBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVPLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxJQUFtQixFQUFFLFFBQWdDLEVBQUUsU0FBZTtRQUNoSCxNQUFNLElBQUksR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsdUNBQXVDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsdURBQXVELEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDOUUsTUFBTSxLQUFLLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU8sS0FBSyxDQUFDLDJCQUEyQixDQUFDLElBQVksRUFBRSxRQUFnQztRQUNwRixNQUFNLE9BQU8sR0FBRyxJQUFBLHdDQUF1QixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxJQUFJLElBQUksS0FBSyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsT0FBTyxDQUFDLFFBQVEsK0JBQStCLElBQUksR0FBRyxDQUFDLENBQUM7UUFDbkcsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxJQUFJLENBQUMsdUNBQXVDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0UsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRU8sS0FBSyxDQUFDLGdDQUFnQyxDQUMxQyxJQUFZLEVBQ1osSUFBbUIsRUFDbkIsUUFBZ0MsRUFDaEMsdUJBQXVGO1FBRXZGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQzlDLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxlQUFlLEdBQUcsSUFBQSw0Q0FBNEIsRUFBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUNwRixJQUFJLElBQUEsMkNBQTJCLEVBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDekQsT0FBTztRQUNYLENBQUM7UUFFRCxNQUFNLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvRSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVPLEtBQUssQ0FBQyx1Q0FBdUMsQ0FDakQsSUFBWSxFQUNaLElBQW1CLEVBQ25CLFFBQWdDLEVBQ2hDLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTlELElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN0QixpR0FBaUc7WUFDakcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFBLDRDQUE0QixFQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUNELE1BQU0sS0FBSyxDQUFDO1FBQ2hCLENBQUM7UUFDRCxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsSUFBWTtRQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNwRCxPQUFPO1FBQ1gsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxPQUFPO1FBQ1gsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDakQsT0FBTztRQUNYLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQy9CLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxnQ0FBaUIsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNwRCxPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDakQsT0FBTztRQUNYLENBQUM7UUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFBLG9DQUF1QixFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELElBQUksSUFBSSxJQUFJLFFBQVEsWUFBWSxjQUFTLEVBQUUsQ0FBQztZQUN4QyxJQUFBLDJDQUE0QixFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRU8sZ0NBQWdDLENBQUMsSUFBWTtRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNoQixPQUFPO1FBQ1gsQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUEsb0NBQXVCLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkQsSUFBSSxRQUFRLFlBQVksY0FBUyxFQUFFLENBQUM7WUFDaEMsSUFBQSwyQ0FBNEIsRUFBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlELENBQUM7SUFDTCxDQUFDO0lBRU8sZUFBZTtRQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztJQUM3QixDQUFDO0lBRU8saUJBQWlCLENBQUMsU0FBbUI7UUFDekMsY0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQzdDLElBQUksSUFBQSwwQkFBYSxFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLGNBQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVPLGdCQUFnQixDQUFDLElBQVU7UUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFO1lBQzNCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLElBQUksRUFBRSxzQkFBYSxDQUFDLG1CQUFtQjtZQUN2QyxNQUFNLEVBQUUsS0FBSztTQUNoQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sc0JBQXNCLENBQUMsTUFBNEIsRUFBRSxLQUEwQjtRQUNuRixJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVPLHFCQUFxQixDQUFDLE1BQTRCO1FBQ3RELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUEsZ0RBQStCLEVBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDVCxPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLEVBQUU7WUFDckMsR0FBRyxLQUFLO1lBQ1IsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUM3QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8scUJBQXFCLENBQUMsTUFBNEI7UUFDdEQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBQSxnREFBK0IsRUFBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNULE9BQU87UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU8sS0FBSyxDQUFDLDZCQUE2QixDQUFDLE9BQTBCO1FBQ2xFLE1BQU0sUUFBUSxHQUFHLElBQUEsMEJBQWEsRUFBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sY0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUIsT0FBTztRQUNYLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ25DLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzFCLE1BQU0sSUFBQSw0Q0FBNEIsRUFBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDdkUsSUFBSSxDQUFDO1lBQ0QsTUFBTSxjQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDO2dCQUFTLENBQUM7WUFDUCxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLG1CQUFtQjtRQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFBLHdDQUF1QixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLFFBQVEsR0FBRyxJQUFBLDRDQUEyQixFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELE1BQU0sUUFBUSxHQUFHLElBQUEsd0JBQVcsRUFBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDaEMsQ0FBQztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFTyx1QkFBdUIsQ0FBQyxPQUEwQjtRQUN0RCxNQUFNLFFBQVEsR0FBRyxJQUFBLDBCQUFhLEVBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELElBQUksUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFNLFFBQVEsR0FBRyxJQUFBLHdCQUFXLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDWCxPQUFPLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztZQUNoQyxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsK0JBQStCLENBQUMsT0FBMEI7UUFDcEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQU8sQ0FBQyxJQUFJLENBQUMsbUNBQW1DLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxzQ0FBc0MsQ0FBQyxDQUFDO1FBQzdFLENBQUM7SUFDTCxDQUFDO0lBRU8sd0JBQXdCLENBQUMsT0FBMEI7UUFDdkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNoRCxPQUFPLGNBQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBQ0QsT0FBTyxjQUFPLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVPLG9CQUFvQixDQUFDLE9BQTBCO1FBQ25ELElBQUksT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDN0IsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELE9BQU8sY0FBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FDekMsT0FBTyxDQUFDLFlBQVksRUFDcEIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FDbkQsQ0FBQztJQUNOLENBQUM7SUFFTyx5QkFBeUIsQ0FBQyxRQUFnQjtRQUM5QyxPQUFPO1lBQ0gsU0FBUyxFQUFFLFFBQVE7WUFDbkIsVUFBVSxFQUFFLFdBQVc7WUFDdkIsSUFBSSxFQUFFLFdBQVc7U0FDcEIsQ0FBQztJQUNOLENBQUM7SUFFTyx5QkFBeUIsQ0FBQyxJQUFZO1FBQzFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFTyxtQ0FBbUMsQ0FBQyxJQUFZO1FBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDeEIsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLE9BQU8sSUFBSSxzQ0FBc0MsRUFBRSxDQUFDO1lBQ2pFLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFTyxxQ0FBcUMsQ0FBQyxRQUFnQixFQUFFLFVBQWlDO1FBQzdGLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQWtELENBQUM7UUFDMUUsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBQ0QsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2xDLE9BQU87WUFDSCxVQUFVLEVBQUUsT0FBTztZQUNuQixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7WUFDekIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1NBQzVCLENBQUM7SUFDTixDQUFDO0lBRU8sNkJBQTZCLENBQUMsUUFBZ0IsRUFBRSxTQUFtRDtRQUN2RyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQixNQUFNLElBQUksR0FBRyxJQUFBLDBCQUFhLEVBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLHdCQUFXLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMzQyxDQUFDO1FBQ0QsTUFBTSxrQkFBa0IsR0FBRyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RCxNQUFNLGtCQUFrQixHQUFHLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUM7UUFDNUUsSUFBSSxDQUFDLGtCQUFrQixJQUFJLGtCQUFrQixLQUFLLGtCQUFrQixFQUFFLENBQUM7WUFDbkUsT0FBTyxrQkFBa0IsQ0FBQztRQUM5QixDQUFDO1FBQ0QsSUFBSSxrQkFBa0IsSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxrQkFBa0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNoRixPQUFPLGtCQUFrQixDQUFDO1FBQzlCLENBQUM7UUFDRCxPQUFPLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxHQUFHLGtCQUFrQixJQUFJLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDO0lBQ25HLENBQUM7Q0FFSixDQUFBO0FBejVCWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixJQUFBLGVBQVEsRUFBQyxXQUFXLENBQUM7O0dBQ1QsZ0JBQWdCLENBeTVCNUI7QUFFRCxTQUFTLHNCQUFzQixDQUFDLElBQVk7SUFDeEMsT0FBTyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFNBQVMsK0JBQStCLENBQ3BDLFNBQThCLEVBQzlCLFFBQWMsRUFDZCxRQUFnQjtJQUVoQixJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUM1QixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsSUFBSSxJQUFBLDZDQUFnQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDM0UsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRO1FBQzdCLENBQUMsQ0FBQyxTQUFTLFNBQVMsQ0FBQyxRQUFRLEdBQUc7UUFDaEMsQ0FBQyxDQUFDLFNBQVMsU0FBUyxDQUFDLFFBQVEsSUFBSSxRQUFRLEdBQUcsQ0FBQztJQUNqRCxNQUFNLE1BQU0sR0FBRyw2QkFBNkIsTUFBTSxtREFBbUQsQ0FBQztJQUN0RyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUN0QyxPQUFPO1FBQ0gsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLEtBQUs7UUFDYixNQUFNO0tBQ1QsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIEFuaW1hdGlvbixcbiAgICBBbmltYXRpb25DbGlwLFxuICAgIE5vZGUsXG59IGZyb20gJ2NjJztcbmltcG9ydCB0eXBlIHsgQW5pbWF0aW9uU3RhdGUgfSBmcm9tICdjYyc7XG5pbXBvcnQge1xuICAgIEFuaW1hdGlvblBsYXlTdGF0ZSxcbiAgICBBbmltYXRpb25FdmVudFJlYXNvbixcbiAgICBJQW5pbWF0aW9uQ2xpcER1bXAsXG4gICAgSUFuaW1hdGlvbkNsaXBzSW5mbyxcbiAgICBJQW5pbWF0aW9uRWRpdENsaXBPcHRpb25zLFxuICAgIElBbmltYXRpb25FbnRlck9wdGlvbnMsXG4gICAgSUFuaW1hdGlvbkV4aXRPcHRpb25zLFxuICAgIElBbmltYXRpb25PcGVyYXRpb24sXG4gICAgSUFuaW1hdGlvbk9wZXJhdGlvbk9wdGlvbnMsXG4gICAgSUFuaW1hdGlvbk9wZXJhdGlvblJlc3VsdCxcbiAgICBJQW5pbWF0aW9uU2F2ZU9wdGlvbnMsXG4gICAgSUFuaW1hdGlvblBsYXlTdGF0ZU9wdGlvbnMsXG4gICAgSUFuaW1hdGlvblF1ZXJ5QXV4aWxpYXJ5Q3VydmVWYWx1ZUF0RnJhbWVPcHRpb25zLFxuICAgIElBbmltYXRpb25RdWVyeUNsaXBPcHRpb25zLFxuICAgIElBbmltYXRpb25RdWVyeVByb3BlcnR5VmFsdWVBdEZyYW1lT3B0aW9ucyxcbiAgICBJQW5pbWF0aW9uUm9vdEluZm8sXG4gICAgSUFuaW1hdGlvblJvb3RSZXN1bHQsXG4gICAgSUFuaW1hdGlvblNlcnZpY2UsXG4gICAgSUFuaW1hdGlvblNldFRpbWVPcHRpb25zLFxuICAgIElBbmltYXRpb25TdGF0ZUluZm8sXG4gICAgSUFuaW1hdGlvblRhcmdldE9wdGlvbnMsXG4gICAgSUFuaW1hdGlvblRpbWVPcHRpb25zLFxuICAgIElBbmltYXRpb25WYWx1ZSxcbiAgICBJVW5kb1Njb3BlLFxuICAgIE5vZGVFdmVudFR5cGUsXG59IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBCYXNlU2VydmljZSwgcmVnaXN0ZXIsIFNlcnZpY2UsIFNlcnZpY2VFdmVudHMgfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHtcbiAgICBhbmltYXRpb25DbGlwU25hcHNob3RzRXF1YWwsXG4gICAgY2FwdHVyZUFuaW1hdGlvbkNsaXBTbmFwc2hvdCxcbiAgICByZXN0b3JlQW5pbWF0aW9uQ2xpcFNuYXBzaG90LFxuICAgIHR5cGUgSUFuaW1hdGlvbkNsaXBTbmFwc2hvdCxcbn0gZnJvbSAnLi9hbmltYXRpb24vY2xpcC1zbmFwc2hvdCc7XG5pbXBvcnQgeyBzeW5jQW5pbWF0aW9uQ2xpcER1cmF0aW9uIH0gZnJvbSAnLi9hbmltYXRpb24vY2xpcC1kdXJhdGlvbic7XG5pbXBvcnQgeyBhcHBseUNsaXBPcGVyYXRpb24sIHZhbGlkYXRlQW5pbWF0aW9uT3BlcmF0aW9uIH0gZnJvbSAnLi9hbmltYXRpb24vY2xpcC1vcGVyYXRpb25zJztcbmltcG9ydCB7IHF1ZXJ5QXV4aWxpYXJ5Q3VydmVWYWx1ZUF0RnJhbWUgfSBmcm9tICcuL2FuaW1hdGlvbi9hdXhpbGlhcnktY3VydmUnO1xuaW1wb3J0IHsgY2FwdHVyZUFuaW1hdGlvblNhbXBsZWRTdGF0ZSwgcmVzdG9yZUFuaW1hdGlvblNhbXBsZWRTdGF0ZSB9IGZyb20gJy4vYW5pbWF0aW9uL3NhbXBsZWQtc3RhdGUnO1xuaW1wb3J0IHsgc2F2ZUFuaW1hdGlvblNlcnZpY2VDbGlwIH0gZnJvbSAnLi9hbmltYXRpb24vc2VydmljZS1zYXZlJztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlUmVnaXN0cnkgfSBmcm9tICcuL2FuaW1hdGlvbi9zdGF0ZS1yZWdpc3RyeSc7XG5pbXBvcnQgeyBBbmltYXRpb25DbGlwU25hcHNob3RDb21tYW5kIH0gZnJvbSAnLi9hbmltYXRpb24vdW5kbyc7XG5pbXBvcnQgeyBJQW5pbWF0aW9uU2Vzc2lvbiB9IGZyb20gJy4vYW5pbWF0aW9uL3R5cGVzJztcbmltcG9ydCB7IGNsaXBVdWlkLCBlbnN1cmVDbGlwRXZlbnRzLCBnZXRDbGlwU2FtcGxlIH0gZnJvbSAnLi9hbmltYXRpb24vdXRpbHMnO1xuaW1wb3J0IHsgc2VyaWFsaXplQW5pbWF0aW9uUHJvcGVydHlWYWx1ZSB9IGZyb20gJy4vYW5pbWF0aW9uL3Byb3BlcnR5LXZhbHVlJztcbmltcG9ydCB7IEFuaW1hdGlvblNlcnZpY2VQbGF5YmFjayB9IGZyb20gJy4vYW5pbWF0aW9uL3NlcnZpY2UtcGxheWJhY2snO1xuaW1wb3J0IHsgaXNBbGxvd2VkU2tlbGV0b25BbmltYXRpb25PcGVyYXRpb24sIGlzQW5pbWF0aW9uT3BlcmF0aW9uUmVzdWx0LCBzaG91bGRTeW5jQW5pbWF0aW9uQ2xpcER1cmF0aW9uIH0gZnJvbSAnLi9hbmltYXRpb24vb3BlcmF0aW9uLXBvbGljeSc7XG5pbXBvcnQgeyBub3JtYWxpemVBbmltYXRpb25PcGVyYXRpb24gfSBmcm9tICcuL2FuaW1hdGlvbi9vcGVyYXRpb24tbm9ybWFsaXplcic7XG5pbXBvcnQge1xuICAgIGxvYWRBbmltYXRpb25DbGlwLFxuICAgIHF1ZXJ5QW5pbWF0aW9uQ2xpcHNJbmZvLFxuICAgIHF1ZXJ5Tm9kZUFuaW1hdGlvbkRhdGEsXG4gICAgcmViaW5kQW5pbWF0aW9uQ29tcG9uZW50Q2xpcCxcbiAgICByZXNvbHZlQW5pbWF0aW9uQ2xpcCxcbn0gZnJvbSAnLi9hbmltYXRpb24vY2xpcC1saWJyYXJ5JztcbmltcG9ydCB7XG4gICAgZ2V0QW5pbWF0aW9uTW9kZSxcbiAgICBnZXROb2RlQnlQYXRoLFxuICAgIGdldE5vZGVCeVV1aWQsXG4gICAgZ2V0Tm9kZVBhdGgsXG4gICAgaXNTa2VsZXRvbkNsaXAsXG4gICAgaXNVc2luZ0Jha2VkQW5pbWF0aW9uLFxuICAgIHF1ZXJ5QW5pbWF0aW9uQ29tcG9uZW50LFxuICAgIHF1ZXJ5QW5pbWF0aW9uUm9vdE5vZGUsXG4gICAgcmVhZFByb3BlcnR5VmFsdWUsXG4gICAgcmVzb2x2ZUFuaW1hdGlvblJlbGF0aXZlTm9kZVBhdGgsXG59IGZyb20gJy4vYW5pbWF0aW9uL3NjZW5lLW5vZGUnO1xuaW1wb3J0IHtcbiAgICBhc3NlcnRBbmltYXRpb25FZGl0b3JPcGVuZWQsXG4gICAgY3JlYXRlQW5pbWF0aW9uUHJvcGVydHlDdXJ2ZU1ldGFkYXRhQ29udGV4dCxcbiAgICBjcmVhdGVBbmltYXRpb25TZXJ2aWNlQ2xpcER1bXAsXG4gICAgY3JlYXRlQW5pbWF0aW9uU2VydmljZUNsaXBFdmVudCxcbiAgICBnZXRBbmltYXRpb25TZXNzaW9uUm9vdE5vZGUsXG4gICAgaXNDdXJyZW50QW5pbWF0aW9uU2Vzc2lvbkNsaXBRdWVyeSxcbiAgICBxdWVyeUFuaW1hdGlvblNlcnZpY2VQcm9wZXJ0aWVzLFxuICAgIHJlcXVpcmVBbmltYXRpb25TZXNzaW9uLFxuICAgIHJlc29sdmVBbmltYXRpb25GcmFtZVF1ZXJ5Tm9kZSxcbiAgICByZXNvbHZlQW5pbWF0aW9uUm9vdFRhcmdldCxcbiAgICByZXNvbHZlQW5pbWF0aW9uVGFyZ2V0Tm9kZSxcbn0gZnJvbSAnLi9hbmltYXRpb24vc2VydmljZS10YXJnZXQnO1xuXG5jb25zdCBTRUxGX1NBVkVfQVNTRVRfUkVGUkVTSF9TVVBQUkVTU0lPTl9NUyA9IDUwMDA7XG5cbkByZWdpc3RlcignQW5pbWF0aW9uJylcbmV4cG9ydCBjbGFzcyBBbmltYXRpb25TZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8UmVjb3JkPHN0cmluZywgYW55Pj4gaW1wbGVtZW50cyBJQW5pbWF0aW9uU2VydmljZSB7XG4gICAgcHJpdmF0ZSBfc2Vzc2lvbjogSUFuaW1hdGlvblNlc3Npb24gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hbmltYXRpb25TdGF0ZXMgPSBuZXcgQW5pbWF0aW9uU3RhdGVSZWdpc3RyeShcbiAgICAgICAgKCkgPT4gdGhpcy5fZ2V0U2Vzc2lvblJvb3ROb2RlKCksXG4gICAgICAgIGFzeW5jICh1dWlkKSA9PiByZXNvbHZlQW5pbWF0aW9uQ2xpcChhd2FpdCBxdWVyeU5vZGVBbmltYXRpb25EYXRhKHRoaXMuX2dldFNlc3Npb25Sb290Tm9kZSgpLCB1dWlkKSwgdXVpZCksXG4gICAgKTtcbiAgICBwcml2YXRlIF9jdXJFZGl0VGltZSA9IDA7XG4gICAgcHJpdmF0ZSBfcGxheVN0YXRlOiBBbmltYXRpb25QbGF5U3RhdGUgPSAnc3RvcCc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfc2VsZlNhdmVkQ2xpcFJlZnJlc2hlcyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfcGxheWJhY2sgPSBuZXcgQW5pbWF0aW9uU2VydmljZVBsYXliYWNrKHtcbiAgICAgICAgZ2V0Q3VycmVudFN0YXRlOiAoKSA9PiB0aGlzLl9zZXNzaW9uID8gdGhpcy5fYW5pbWF0aW9uU3RhdGVzLmdldCh0aGlzLl9zZXNzaW9uLmNsaXBVdWlkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZ2V0RWRpdFRpbWU6ICgpID0+IHRoaXMuX2N1ckVkaXRUaW1lLFxuICAgICAgICBnZXRQbGF5U3RhdGU6ICgpID0+IHRoaXMuX3BsYXlTdGF0ZSxcbiAgICAgICAgc2V0RWRpdFRpbWU6ICh0aW1lKSA9PiB7IHRoaXMuX2N1ckVkaXRUaW1lID0gdGltZTsgfSxcbiAgICAgICAgc2V0UGxheVN0YXRlOiAocGxheVN0YXRlKSA9PiB7IHRoaXMuX3BsYXlTdGF0ZSA9IHBsYXlTdGF0ZTsgfSxcbiAgICAgICAgZW50ZXJBbmltYXRpb25Nb2RlOiAoKSA9PiBTZXJ2aWNlLkVuZ2luZS5lbnRlckFuaW1hdGlvbk1vZGUoKSxcbiAgICAgICAgZXhpdEFuaW1hdGlvbk1vZGU6ICgpID0+IFNlcnZpY2UuRW5naW5lLmV4aXRBbmltYXRpb25Nb2RlKCksXG4gICAgICAgIHJlcGFpbnRJbkVkaXRNb2RlOiAoKSA9PiBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpLFxuICAgICAgICBicm9hZGNhc3RUaW1lQ2hhbmdlZDogKHJlYXNvbikgPT4gdGhpcy5fYnJvYWRjYXN0VGltZUNoYW5nZWQocmVhc29uKSxcbiAgICAgICAgYnJvYWRjYXN0U3RhdGVDaGFuZ2VkOiBhc3luYyAocmVhc29uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSBhd2FpdCB0aGlzLnF1ZXJ5U3RhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdFN0YXRlQ2hhbmdlZChyZWFzb24sIGN1cnJlbnRTdGF0ZSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfb25Bc3NldFJlZnJlc2hlZCA9ICh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLl9yZWZyZXNoQ3VycmVudENsaXBBc3NldCh1dWlkKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2VTZXNzaW9uKCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbQW5pbWF0aW9uXSByZWZyZXNoIGFuaW1hdGlvbiBjbGlwIGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgU2VydmljZUV2ZW50cz8ub24/LignYXNzZXQtcmVmcmVzaCcsIHRoaXMuX29uQXNzZXRSZWZyZXNoZWQpO1xuICAgIH1cblxuICAgIGFzeW5jIGVudGVyKG9wdGlvbnM6IElBbmltYXRpb25FbnRlck9wdGlvbnMpOiBQcm9taXNlPElBbmltYXRpb25TdGF0ZUluZm8+IHtcbiAgICAgICAgYXNzZXJ0QW5pbWF0aW9uRWRpdG9yT3BlbmVkKFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkpO1xuXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmV4aXQoeyByZXN0b3JlU2VsZWN0aW9uOiBmYWxzZSwgcmVzdG9yZVNhbXBsZWRTY2VuZVN0YXRlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBxdWVyeUFuaW1hdGlvblJvb3ROb2RlKHRoaXMuX3Jlc29sdmVOb2RlKG9wdGlvbnMpLCBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpKTtcbiAgICAgICAgY29uc3QgYW5pbURhdGEgPSBhd2FpdCBxdWVyeU5vZGVBbmltYXRpb25EYXRhKHJvb3ROb2RlLCBvcHRpb25zLmNsaXBVdWlkLCB7IHJlY292ZXJDbGlwQmluZGluZzogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgY2xpcCA9IHJlc29sdmVBbmltYXRpb25DbGlwKGFuaW1EYXRhLCBvcHRpb25zLmNsaXBVdWlkKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IGNsaXBVdWlkKGNsaXApO1xuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQW5pbWF0aW9uIGNsaXAgdXVpZCBpcyBlbXB0eS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Nlc3Npb24gPSB7XG4gICAgICAgICAgICBwcmV2aW91c0VkaXRvclR5cGU6IFNlcnZpY2UuRWRpdG9yLmdldEN1cnJlbnRFZGl0b3JUeXBlKCksXG4gICAgICAgICAgICBwcmV2aW91c1NlbGVjdGlvbjogU2VydmljZS5TZWxlY3Rpb24ucXVlcnkoKSxcbiAgICAgICAgICAgIHJlc3RvcmVTZWxlY3Rpb25PbkV4aXQ6IG9wdGlvbnMucmVzdG9yZVNlbGVjdGlvbk9uRXhpdCA/PyB0cnVlLFxuICAgICAgICAgICAgcm9vdFV1aWQ6IHJvb3ROb2RlLnV1aWQsXG4gICAgICAgICAgICByb290UGF0aDogZ2V0Tm9kZVBhdGgocm9vdE5vZGUpLFxuICAgICAgICAgICAgY2xpcFV1aWQ6IHV1aWQsXG4gICAgICAgICAgICBzYW1wbGVkUm9vdFN0YXRlOiBjYXB0dXJlQW5pbWF0aW9uU2FtcGxlZFN0YXRlKHJvb3ROb2RlKSxcbiAgICAgICAgICAgIHVuZG9CYXNlbGluZTogU2VydmljZS5VbmRvLmNyZWF0ZUNoZWNrcG9pbnQoKSxcbiAgICAgICAgICAgIGdsb2JhbERpcnR5QXRFbnRlcjogU2VydmljZS5VbmRvLmlzRGlydHkoKSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9wbGF5U3RhdGUgPSAnc3RvcCc7XG4gICAgICAgIHRoaXMuX2N1ckVkaXRUaW1lID0gMDtcbiAgICAgICAgYXdhaXQgdGhpcy5fZ2V0QW5pbWF0aW9uU3RhdGUodXVpZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0VGltZSh7IHRpbWU6IDAgfSk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgdGhpcy5xdWVyeVN0YXRlKCk7XG4gICAgICAgIHRoaXMuX2Jyb2FkY2FzdFN0YXRlQ2hhbmdlZCgnZW50ZXInLCBzdGF0ZSk7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG5cbiAgICBhc3luYyBleGl0KG9wdGlvbnM6IElBbmltYXRpb25FeGl0T3B0aW9ucyk6IFByb21pc2U8SUFuaW1hdGlvblN0YXRlSW5mbz4ge1xuICAgICAgICBjb25zdCBzZXNzaW9uID0gcmVxdWlyZUFuaW1hdGlvblNlc3Npb24odGhpcy5fc2Vzc2lvbik7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuc2F2ZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9kaXNjYXJkQW5pbWF0aW9uU2Vzc2lvbkNoYW5nZXMoc2Vzc2lvbik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLl9zdG9wQ3VycmVudCgpO1xuXG4gICAgICAgIGNvbnN0IHNob3VsZFJlc3RvcmVTYW1wbGVkU3RhdGUgPSBvcHRpb25zLnJlc3RvcmVTYW1wbGVkU2NlbmVTdGF0ZSA/PyB0cnVlO1xuICAgICAgICBpZiAoc2hvdWxkUmVzdG9yZVNhbXBsZWRTdGF0ZSAmJiBzZXNzaW9uLnNhbXBsZWRSb290U3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlID0gZ2V0Tm9kZUJ5VXVpZChzZXNzaW9uLnJvb3RVdWlkKTtcbiAgICAgICAgICAgIGlmIChyb290Tm9kZSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlc3RvcmVBbmltYXRpb25TYW1wbGVkU3RhdGUocm9vdE5vZGUsIHNlc3Npb24uc2FtcGxlZFJvb3RTdGF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdE5vZGVDaGFuZ2VkKHJvb3ROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2FuaW1hdGlvblN0YXRlcy5jbGVhcigpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5leGl0QW5pbWF0aW9uTW9kZSgpO1xuXG4gICAgICAgIGNvbnN0IHNob3VsZFJlc3RvcmVTZWxlY3Rpb24gPSBvcHRpb25zLnJlc3RvcmVTZWxlY3Rpb24gPz8gc2Vzc2lvbi5yZXN0b3JlU2VsZWN0aW9uT25FeGl0O1xuICAgICAgICBpZiAoc2hvdWxkUmVzdG9yZVNlbGVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fcmVzdG9yZVNlbGVjdGlvbihzZXNzaW9uLnByZXZpb3VzU2VsZWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Nlc3Npb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9jdXJFZGl0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuX3BsYXlTdGF0ZSA9ICdzdG9wJztcbiAgICAgICAgYXdhaXQgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBhd2FpdCB0aGlzLnF1ZXJ5U3RhdGUoKTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0U3RhdGVDaGFuZ2VkKCdleGl0Jywgc3RhdGUpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlTdGF0ZSgpOiBQcm9taXNlPElBbmltYXRpb25TdGF0ZUluZm8+IHtcbiAgICAgICAgY29uc3QgZWRpdG9yVHlwZSA9IFNlcnZpY2UuRWRpdG9yLmdldEN1cnJlbnRFZGl0b3JUeXBlKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IFNlcnZpY2UuU2VsZWN0aW9uLnF1ZXJ5KCk7XG4gICAgICAgIGlmICghdGhpcy5fc2Vzc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVkaXRvclR5cGUsXG4gICAgICAgICAgICAgICAgbW9kZTogZ2V0QW5pbWF0aW9uTW9kZShlZGl0b3JUeXBlKSxcbiAgICAgICAgICAgICAgICByb290VXVpZDogJycsXG4gICAgICAgICAgICAgICAgcm9vdFBhdGg6ICcnLFxuICAgICAgICAgICAgICAgIGNsaXBVdWlkOiAnJyxcbiAgICAgICAgICAgICAgICB0aW1lOiAwLFxuICAgICAgICAgICAgICAgIHBsYXlTdGF0ZTogJ3N0b3AnLFxuICAgICAgICAgICAgICAgIGRpcnR5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzY2VuZURpcnR5OiBTZXJ2aWNlLlVuZG8uaXNEaXJ0eSgpLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgICAgICByZXN0b3JlU2VsZWN0aW9uT25FeGl0OiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlZnJlc2hTZXNzaW9uUm9vdFBhdGgodGhpcy5fc2Vzc2lvbik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGVkaXRvclR5cGUsXG4gICAgICAgICAgICBtb2RlOiAnYW5pbWF0aW9uJyxcbiAgICAgICAgICAgIHJvb3RVdWlkOiB0aGlzLl9zZXNzaW9uLnJvb3RVdWlkLFxuICAgICAgICAgICAgcm9vdFBhdGg6IHRoaXMuX3Nlc3Npb24ucm9vdFBhdGgsXG4gICAgICAgICAgICBjbGlwVXVpZDogdGhpcy5fc2Vzc2lvbi5jbGlwVXVpZCxcbiAgICAgICAgICAgIHRpbWU6IHRoaXMuX2N1ckVkaXRUaW1lLFxuICAgICAgICAgICAgcGxheVN0YXRlOiB0aGlzLl9wbGF5U3RhdGUsXG4gICAgICAgICAgICBkaXJ0eTogdGhpcy5faXNBbmltYXRpb25TZXNzaW9uRGlydHkodGhpcy5fc2Vzc2lvbiksXG4gICAgICAgICAgICBzY2VuZURpcnR5OiB0aGlzLl9pc1NjZW5lU2Vzc2lvbkRpcnR5KHRoaXMuX3Nlc3Npb24pLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgcmVzdG9yZVNlbGVjdGlvbk9uRXhpdDogdGhpcy5fc2Vzc2lvbi5yZXN0b3JlU2VsZWN0aW9uT25FeGl0LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5Um9vdChvcHRpb25zOiBJQW5pbWF0aW9uVGFyZ2V0T3B0aW9ucyk6IFByb21pc2U8SUFuaW1hdGlvblJvb3RSZXN1bHQ+IHtcbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBxdWVyeUFuaW1hdGlvblJvb3ROb2RlKHRoaXMuX3Jlc29sdmVOb2RlKG9wdGlvbnMpLCBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RVdWlkOiByb290Tm9kZS51dWlkLFxuICAgICAgICAgICAgcm9vdFBhdGg6IGdldE5vZGVQYXRoKHJvb3ROb2RlKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeVJvb3RJbmZvKG9wdGlvbnM6IElBbmltYXRpb25UYXJnZXRPcHRpb25zKTogUHJvbWlzZTxJQW5pbWF0aW9uUm9vdEluZm8+IHtcbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSB0aGlzLl9yZXNvbHZlUm9vdE5vZGUob3B0aW9ucyk7XG4gICAgICAgIGlmICghcXVlcnlBbmltYXRpb25Db21wb25lbnQocm9vdE5vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCByb290UGF0aCA9IGdldE5vZGVQYXRoKHJvb3ROb2RlKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcm9vdFV1aWQ6IHJvb3ROb2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgcm9vdFBhdGgsXG4gICAgICAgICAgICAgICAgY2xpcHNNZW51OiBbXSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0Q2xpcDogJycsXG4gICAgICAgICAgICAgICAgbm9kZVRyZWVEdW1wOiBhd2FpdCBTZXJ2aWNlLk5vZGUucXVlcnlOb2RlVHJlZSh7IHBhdGg6IHJvb3RQYXRoIH0pLFxuICAgICAgICAgICAgICAgIGNsaXBEdW1wOiBudWxsLFxuICAgICAgICAgICAgICAgIHRpbWU6IDAsXG4gICAgICAgICAgICAgICAgc3RhdGU6ICdzdG9wJyxcbiAgICAgICAgICAgICAgICB1c2VCYWtlZEFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNsaXBzSW5mbyA9IGF3YWl0IHF1ZXJ5QW5pbWF0aW9uQ2xpcHNJbmZvKHJvb3ROb2RlKTtcbiAgICAgICAgY29uc3QgYWN0aXZlU2Vzc2lvbiA9IHRoaXMuX3Nlc3Npb24/LnJvb3RVdWlkID09PSByb290Tm9kZS51dWlkID8gdGhpcy5fc2Vzc2lvbiA6IG51bGw7XG4gICAgICAgIGNvbnN0IGNsaXBVdWlkID0gYWN0aXZlU2Vzc2lvbj8uY2xpcFV1aWQgfHwgY2xpcHNJbmZvLmRlZmF1bHRDbGlwO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uY2xpcHNJbmZvLFxuICAgICAgICAgICAgbm9kZVRyZWVEdW1wOiBhd2FpdCBTZXJ2aWNlLk5vZGUucXVlcnlOb2RlVHJlZSh7IHBhdGg6IGNsaXBzSW5mby5yb290UGF0aCB9KSxcbiAgICAgICAgICAgIGNsaXBEdW1wOiBjbGlwVXVpZCA/IGF3YWl0IHRoaXMucXVlcnlDbGlwKHsgcm9vdFV1aWQ6IHJvb3ROb2RlLnV1aWQsIGNsaXBVdWlkIH0pIDogbnVsbCxcbiAgICAgICAgICAgIHRpbWU6IGFjdGl2ZVNlc3Npb24gJiYgY2xpcFV1aWQgPyBhd2FpdCB0aGlzLnF1ZXJ5VGltZSh7IGNsaXBVdWlkIH0pIDogMCxcbiAgICAgICAgICAgIHN0YXRlOiBhY3RpdmVTZXNzaW9uID8gdGhpcy5fcGxheVN0YXRlIDogJ3N0b3AnLFxuICAgICAgICAgICAgdXNlQmFrZWRBbmltYXRpb246IGlzVXNpbmdCYWtlZEFuaW1hdGlvbihyb290Tm9kZSksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlDbGlwcyhvcHRpb25zOiBJQW5pbWF0aW9uVGFyZ2V0T3B0aW9ucyk6IFByb21pc2U8SUFuaW1hdGlvbkNsaXBzSW5mbz4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgcXVlcnlBbmltYXRpb25DbGlwc0luZm8odGhpcy5fcmVzb2x2ZVJvb3ROb2RlKG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUNsaXAob3B0aW9uczogSUFuaW1hdGlvblF1ZXJ5Q2xpcE9wdGlvbnMpOiBQcm9taXNlPElBbmltYXRpb25DbGlwRHVtcD4ge1xuICAgICAgICBjb25zdCBoYXNUYXJnZXQgPSBCb29sZWFuKG9wdGlvbnMucm9vdFBhdGggfHwgb3B0aW9ucy5yb290VXVpZCB8fCBvcHRpb25zLm5vZGVQYXRoIHx8IG9wdGlvbnMubm9kZVV1aWQpO1xuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbikge1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNlc3Npb25Sb290UGF0aCh0aGlzLl9zZXNzaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBvcHRpb25zLmNsaXBVdWlkIHx8IHRoaXMuX3Nlc3Npb24uY2xpcFV1aWQ7XG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IGlzQ3VycmVudEFuaW1hdGlvblNlc3Npb25DbGlwUXVlcnkodGhpcy5fc2Vzc2lvbiwgb3B0aW9ucywgdXVpZCwgaGFzVGFyZ2V0KVxuICAgICAgICAgICAgICAgID8gdGhpcy5fYW5pbWF0aW9uU3RhdGVzLmdldCh1dWlkKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUFuaW1hdGlvblNlcnZpY2VDbGlwRHVtcCh0aGlzLl9nZXRTZXNzaW9uUm9vdE5vZGUoKSwgc3RhdGUuY2xpcCwgc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyByb290Tm9kZSwgY2xpcCB9ID0gYXdhaXQgdGhpcy5fcmVzb2x2ZUNsaXBGb3JRdWVyeShvcHRpb25zKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IGNsaXBVdWlkKGNsaXApO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX3Nlc3Npb24/LnJvb3RVdWlkID09PSByb290Tm9kZS51dWlkXG4gICAgICAgICAgICA/IHRoaXMuX2FuaW1hdGlvblN0YXRlcy5nZXQodXVpZClcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gY3JlYXRlQW5pbWF0aW9uU2VydmljZUNsaXBEdW1wKHJvb3ROb2RlLCBjbGlwLCBzdGF0ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm9wZXJ0aWVzKG9wdGlvbnM6IElBbmltYXRpb25UYXJnZXRPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9yZXNvbHZlTm9kZShvcHRpb25zKTtcbiAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuX3Nlc3Npb24gPyBnZXROb2RlQnlVdWlkKHRoaXMuX3Nlc3Npb24ucm9vdFV1aWQpIDogcXVlcnlBbmltYXRpb25Sb290Tm9kZShub2RlLCBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpKTtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5QW5pbWF0aW9uU2VydmljZVByb3BlcnRpZXMobm9kZSwgcm9vdCk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlUaW1lKG9wdGlvbnM6IElBbmltYXRpb25UaW1lT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIGlmICghdGhpcy5fc2Vzc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdXVpZCA9IG9wdGlvbnMuY2xpcFV1aWQgfHwgdGhpcy5fc2Vzc2lvbi5jbGlwVXVpZDtcbiAgICAgICAgaWYgKHV1aWQgPT09IHRoaXMuX3Nlc3Npb24uY2xpcFV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJFZGl0VGltZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX2FuaW1hdGlvblN0YXRlcy5nZXQodXVpZCk7XG4gICAgICAgIHJldHVybiBzdGF0ZT8uY3VycmVudCA/PyAwO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5UHJvcGVydHlWYWx1ZUF0RnJhbWUob3B0aW9uczogSUFuaW1hdGlvblF1ZXJ5UHJvcGVydHlWYWx1ZUF0RnJhbWVPcHRpb25zKTogUHJvbWlzZTxJQW5pbWF0aW9uVmFsdWU+IHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmVBbmltYXRpb25TZXNzaW9uKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICB0aGlzLl9yZWZyZXNoU2Vzc2lvblJvb3RQYXRoKHNlc3Npb24pO1xuICAgICAgICBjb25zdCB1dWlkID0gb3B0aW9ucy5jbGlwVXVpZCB8fCBzZXNzaW9uLmNsaXBVdWlkO1xuICAgICAgICBpZiAodXVpZCAhPT0gc2Vzc2lvbi5jbGlwVXVpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjdXJyZW50IGVkaXQgY2xpcDogJyR7c2Vzc2lvbi5jbGlwVXVpZH0nIGJ1dCB5b3Ugd2FudCB0byBvcGVyYXRlOiAnJHt1dWlkfSdgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9wbGF5U3RhdGUgPT09ICdwbGF5aW5nJykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHJlc29sdmVBbmltYXRpb25GcmFtZVF1ZXJ5Tm9kZShvcHRpb25zLCBzZXNzaW9uKTtcbiAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemVBbmltYXRpb25Qcm9wZXJ0eVZhbHVlKHJlYWRQcm9wZXJ0eVZhbHVlKG5vZGUsIG9wdGlvbnMucHJvcEtleSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBhd2FpdCB0aGlzLl9nZXRBbmltYXRpb25TdGF0ZSh1dWlkKTtcbiAgICAgICAgY29uc3QgcHJldmlvdXNUaW1lID0gdGhpcy5fY3VyRWRpdFRpbWU7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzU3RhdGVUaW1lID0gdHlwZW9mIHN0YXRlLmN1cnJlbnQgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZShzdGF0ZS5jdXJyZW50KVxuICAgICAgICAgICAgPyBzdGF0ZS5jdXJyZW50XG4gICAgICAgICAgICA6IHByZXZpb3VzVGltZTtcbiAgICAgICAgY29uc3Qgd2FzUGxheWluZyA9IHN0YXRlLmlzUGxheWluZztcbiAgICAgICAgY29uc3Qgd2FzUGF1c2VkID0gc3RhdGUuaXNQYXVzZWQ7XG4gICAgICAgIGNvbnN0IHNhbXBsZSA9IGdldENsaXBTYW1wbGUoc3RhdGUuY2xpcCk7XG4gICAgICAgIGxldCB2YWx1ZTogSUFuaW1hdGlvblZhbHVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdGUud2VpZ2h0ID0gMTtcbiAgICAgICAgICAgIHN0YXRlLnNldFRpbWUob3B0aW9ucy5mcmFtZSAvIHNhbXBsZSk7XG4gICAgICAgICAgICBpZiAoIXN0YXRlLmlzUGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlLnNhbXBsZSgpO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gcmVzb2x2ZUFuaW1hdGlvbkZyYW1lUXVlcnlOb2RlKG9wdGlvbnMsIHNlc3Npb24pO1xuICAgICAgICAgICAgdmFsdWUgPSBzZXJpYWxpemVBbmltYXRpb25Qcm9wZXJ0eVZhbHVlKHJlYWRQcm9wZXJ0eVZhbHVlKG5vZGUsIG9wdGlvbnMucHJvcEtleSkpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc3RhdGUuc2V0VGltZSh3YXNQbGF5aW5nID8gcHJldmlvdXNTdGF0ZVRpbWUgOiBwcmV2aW91c1RpbWUpO1xuICAgICAgICAgICAgaWYgKHdhc1BsYXlpbmcgJiYgIXdhc1BhdXNlZCkge1xuICAgICAgICAgICAgICAgIHN0YXRlLnNhbXBsZSgpO1xuICAgICAgICAgICAgICAgIHN0YXRlLnJlc3VtZSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghc3RhdGUuaXNQYXVzZWQpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5wYXVzZSgpO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNhbXBsZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zYW1wbGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2N1ckVkaXRUaW1lID0gcHJldmlvdXNUaW1lO1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlBdXhpbGlhcnlDdXJ2ZVZhbHVlQXRGcmFtZShvcHRpb25zOiBJQW5pbWF0aW9uUXVlcnlBdXhpbGlhcnlDdXJ2ZVZhbHVlQXRGcmFtZU9wdGlvbnMpIHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmVBbmltYXRpb25TZXNzaW9uKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICBjb25zdCB1dWlkID0gb3B0aW9ucy5jbGlwVXVpZCB8fCBzZXNzaW9uLmNsaXBVdWlkO1xuICAgICAgICBpZiAodXVpZCAhPT0gc2Vzc2lvbi5jbGlwVXVpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjdXJyZW50IGVkaXQgY2xpcDogJyR7c2Vzc2lvbi5jbGlwVXVpZH0nIGJ1dCB5b3Ugd2FudCB0byBvcGVyYXRlOiAnJHt1dWlkfSdgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgdGhpcy5fZ2V0QW5pbWF0aW9uU3RhdGUodXVpZCk7XG4gICAgICAgIHJldHVybiBxdWVyeUF1eGlsaWFyeUN1cnZlVmFsdWVBdEZyYW1lKHN0YXRlLmNsaXAsIG9wdGlvbnMubmFtZSwgb3B0aW9ucy5mcmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2V0VGltZShvcHRpb25zOiBJQW5pbWF0aW9uU2V0VGltZU9wdGlvbnMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmVBbmltYXRpb25TZXNzaW9uKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IHRoaXMuX2dldEFuaW1hdGlvblN0YXRlKHNlc3Npb24uY2xpcFV1aWQpO1xuICAgICAgICBsZXQgZWRpdFRpbWUgPSBvcHRpb25zLnRpbWU7XG4gICAgICAgIGlmIChlZGl0VGltZSA8IDApIHtcbiAgICAgICAgICAgIGVkaXRUaW1lID0gMDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2FtcGxlVGltZSA9IGVkaXRUaW1lO1xuXG4gICAgICAgIGlmICgoKHN0YXRlLmNsaXAud3JhcE1vZGUgJiBBbmltYXRpb25DbGlwLldyYXBNb2RlLlJldmVyc2UpID09PSBBbmltYXRpb25DbGlwLldyYXBNb2RlLlJldmVyc2UpKSB7XG4gICAgICAgICAgICBzYW1wbGVUaW1lID0gc3RhdGUuZHVyYXRpb24gLSBNYXRoLm1pbihlZGl0VGltZSwgc3RhdGUuZHVyYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUud2VpZ2h0ID0gMTtcbiAgICAgICAgc3RhdGUuc2V0VGltZShzYW1wbGVUaW1lKTtcbiAgICAgICAgaWYgKCFzdGF0ZS5pc1BhdXNlZCkge1xuICAgICAgICAgICAgc3RhdGUucGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5zYW1wbGUoKTtcbiAgICAgICAgdGhpcy5fY3VyRWRpdFRpbWUgPSBlZGl0VGltZTtcbiAgICAgICAgYXdhaXQgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0VGltZUNoYW5nZWQoJ3NldC10aW1lJyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFzeW5jIGNoYW5nZVBsYXlTdGF0ZShvcHRpb25zOiBJQW5pbWF0aW9uUGxheVN0YXRlT3B0aW9ucyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBzZXNzaW9uID0gcmVxdWlyZUFuaW1hdGlvblNlc3Npb24odGhpcy5fc2Vzc2lvbik7XG4gICAgICAgIGNvbnN0IHV1aWQgPSBvcHRpb25zLmNsaXBVdWlkIHx8IHNlc3Npb24uY2xpcFV1aWQ7XG4gICAgICAgIGlmICh1dWlkICE9PSBzZXNzaW9uLmNsaXBVdWlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGN1cnJlbnQgZWRpdCBjbGlwOiAnJHtzZXNzaW9uLmNsaXBVdWlkfScgYnV0IHlvdSB3YW50IHRvIG9wZXJhdGU6ICcke3V1aWR9J2ApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgdGhpcy5fZ2V0QW5pbWF0aW9uU3RhdGUodXVpZCk7XG5cbiAgICAgICAgc3dpdGNoIChvcHRpb25zLm9wZXJhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3BsYXknOlxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXliYWNrLnBsYXkoc3RhdGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGF1c2UnOlxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXliYWNrLnBhdXNlKHN0YXRlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Jlc3VtZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWJhY2sucmVzdW1lKHN0YXRlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N0b3AnOlxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3N0b3BDdXJyZW50KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgYW5pbWF0aW9uIHBsYXkgb3BlcmF0aW9uOiAke1N0cmluZyhvcHRpb25zLm9wZXJhdGUpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0U3RhdGVDaGFuZ2VkKCdwbGF5LXN0YXRlJywgYXdhaXQgdGhpcy5xdWVyeVN0YXRlKCkpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBjaGFuZ2VFZGl0Q2xpcChvcHRpb25zOiBJQW5pbWF0aW9uRWRpdENsaXBPcHRpb25zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHNlc3Npb24gPSByZXF1aXJlQW5pbWF0aW9uU2Vzc2lvbih0aGlzLl9zZXNzaW9uKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xpcFV1aWQgPT09IHNlc3Npb24uY2xpcFV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fc3RvcEN1cnJlbnQoKTtcbiAgICAgICAgcmVzb2x2ZUFuaW1hdGlvbkNsaXAoYXdhaXQgcXVlcnlOb2RlQW5pbWF0aW9uRGF0YSh0aGlzLl9nZXRTZXNzaW9uUm9vdE5vZGUoKSwgb3B0aW9ucy5jbGlwVXVpZCwgeyByZWNvdmVyQ2xpcEJpbmRpbmc6IHRydWUgfSksIG9wdGlvbnMuY2xpcFV1aWQpO1xuICAgICAgICBzZXNzaW9uLmNsaXBVdWlkID0gb3B0aW9ucy5jbGlwVXVpZDtcbiAgICAgICAgdGhpcy5fY3VyRWRpdFRpbWUgPSAwO1xuICAgICAgICBhd2FpdCB0aGlzLl9nZXRBbmltYXRpb25TdGF0ZShvcHRpb25zLmNsaXBVdWlkKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXRUaW1lKHsgdGltZTogMCB9KTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0Q2xpcENoYW5nZWQoJ2NoYW5nZS1jbGlwJyk7XG4gICAgICAgIHRoaXMuX2Jyb2FkY2FzdFN0YXRlQ2hhbmdlZCgnY2hhbmdlLWNsaXAnLCBhd2FpdCB0aGlzLnF1ZXJ5U3RhdGUoKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFzeW5jIGFwcGx5T3BlcmF0aW9ucyhvcHRpb25zOiBJQW5pbWF0aW9uT3BlcmF0aW9uT3B0aW9ucyk6IFByb21pc2U8SUFuaW1hdGlvbk9wZXJhdGlvblJlc3VsdD4ge1xuICAgICAgICBjb25zdCBzZXNzaW9uID0gcmVxdWlyZUFuaW1hdGlvblNlc3Npb24odGhpcy5fc2Vzc2lvbik7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLm9wZXJhdGlvbnMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuaW1hdGlvbiBvcGVyYXRpb25zIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb290Tm9kZSA9IHRoaXMuX2dldFNlc3Npb25Sb290Tm9kZSgpO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IHRoaXMuX2dldEFuaW1hdGlvblN0YXRlKHNlc3Npb24uY2xpcFV1aWQpO1xuICAgICAgICBjb25zdCBjbGlwID0gc3RhdGUuY2xpcDtcbiAgICAgICAgY29uc3QgcHJvcGVydHlNZXRhZGF0YUNvbnRleHQgPSBjcmVhdGVBbmltYXRpb25Qcm9wZXJ0eUN1cnZlTWV0YWRhdGFDb250ZXh0KHJvb3ROb2RlKTtcbiAgICAgICAgY29uc3Qgc2hvdWxkUmVjb3JkVW5kbyA9IG9wdGlvbnMucmVjb3JkVW5kbyAhPT0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IGNhcHR1cmVBbmltYXRpb25DbGlwU25hcHNob3QoY2xpcCwgcHJvcGVydHlNZXRhZGF0YUNvbnRleHQpO1xuICAgICAgICBjb25zdCBhcHBsaWVkT3BlcmF0aW9uczogSUFuaW1hdGlvbk9wZXJhdGlvbltdID0gW107XG4gICAgICAgIGNvbnN0IGlzU2tlbGV0b24gPSBpc1NrZWxldG9uQ2xpcChzZXNzaW9uLmNsaXBVdWlkLCByb290Tm9kZSk7XG4gICAgICAgIGxldCBzaG91bGRTeW5jRHVyYXRpb24gPSBmYWxzZTtcbiAgICAgICAgbGV0IHNob3VsZFJlc3RvcmVPbkZhaWx1cmUgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBpbnB1dE9wZXJhdGlvbiBvZiBvcHRpb25zLm9wZXJhdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0RmFpbHVyZSA9IHZhbGlkYXRlQW5pbWF0aW9uT3BlcmF0aW9uKGlucHV0T3BlcmF0aW9uLCBzZXNzaW9uLmNsaXBVdWlkKTtcbiAgICAgICAgICAgIGlmIChpbnB1dEZhaWx1cmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUmVzdG9yZU9uRmFpbHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlRmFpbGVkT3BlcmF0aW9uU25hcHNob3QoY2xpcCwgYmVmb3JlLCByb290Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dEZhaWx1cmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRGYWlsdXJlID0gdmFsaWRhdGVBbmltYXRpb25Qcm9wZXJ0eVRhcmdldChpbnB1dE9wZXJhdGlvbiwgcm9vdE5vZGUsIHNlc3Npb24ucm9vdFBhdGgpO1xuICAgICAgICAgICAgaWYgKHRhcmdldEZhaWx1cmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUmVzdG9yZU9uRmFpbHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlRmFpbGVkT3BlcmF0aW9uU25hcHNob3QoY2xpcCwgYmVmb3JlLCByb290Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXRGYWlsdXJlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU2tlbGV0b24gJiYgIWlzQWxsb3dlZFNrZWxldG9uQW5pbWF0aW9uT3BlcmF0aW9uKGlucHV0T3BlcmF0aW9uKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNrZWxldG9uRmFpbHVyZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6ICdmYWlsdXJlJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcmVhc29uOiBgTWV0aG9kICcke2lucHV0T3BlcmF0aW9uLnR5cGV9JyBpcyBub3QgYWxsb3dlZCBpbiBza2VsZXRvbiBhbmltYXRpb24uYCxcbiAgICAgICAgICAgICAgICB9IGFzIElBbmltYXRpb25PcGVyYXRpb25SZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFJlc3RvcmVPbkZhaWx1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVzdG9yZUZhaWxlZE9wZXJhdGlvblNuYXBzaG90KGNsaXAsIGJlZm9yZSwgcm9vdE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc2tlbGV0b25GYWlsdXJlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYXdhaXQgbm9ybWFsaXplQW5pbWF0aW9uT3BlcmF0aW9uKGlucHV0T3BlcmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgY3VycmVudENsaXBVdWlkOiBzZXNzaW9uLmNsaXBVdWlkLFxuICAgICAgICAgICAgICAgIHJvb3ROb2RlLFxuICAgICAgICAgICAgICAgIHJvb3RQYXRoOiBzZXNzaW9uLnJvb3RQYXRoLFxuICAgICAgICAgICAgICAgIHF1ZXJ5UHJvcGVydHlWYWx1ZUF0RnJhbWU6IChxdWVyeU9wdGlvbnMpID0+IHRoaXMucXVlcnlQcm9wZXJ0eVZhbHVlQXRGcmFtZShxdWVyeU9wdGlvbnMpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoaXNBbmltYXRpb25PcGVyYXRpb25SZXN1bHQobm9ybWFsaXplZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUmVzdG9yZU9uRmFpbHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlRmFpbGVkT3BlcmF0aW9uU25hcHNob3QoY2xpcCwgYmVmb3JlLCByb290Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBvcGVyYXRpb24gPSBub3JtYWxpemVkO1xuICAgICAgICAgICAgY29uc3QgZmFpbHVyZSA9IHZhbGlkYXRlQW5pbWF0aW9uT3BlcmF0aW9uKG9wZXJhdGlvbiwgc2Vzc2lvbi5jbGlwVXVpZCk7XG4gICAgICAgICAgICBpZiAoZmFpbHVyZSkge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRSZXN0b3JlT25GYWlsdXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RvcmVGYWlsZWRPcGVyYXRpb25TbmFwc2hvdChjbGlwLCBiZWZvcmUsIHJvb3ROb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWx1cmU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNob3VsZFJlc3RvcmVPbkZhaWx1cmUgPSB0cnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXNldEFuaW1hdGlvblN0YXRlUHJlc2VydmluZ0NsaXAoc2Vzc2lvbi5jbGlwVXVpZCwgY2xpcCwgcHJvcGVydHlNZXRhZGF0YUNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGFwcGx5Q2xpcE9wZXJhdGlvbihjbGlwLCBvcGVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdE5vZGUsXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQYXRoOiBzZXNzaW9uLnJvb3RQYXRoLFxuICAgICAgICAgICAgICAgICAgICBxdWVyeVByb3BlcnR5TWV0YWRhdGE6IHByb3BlcnR5TWV0YWRhdGFDb250ZXh0LnF1ZXJ5UHJvcGVydHlNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZEVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RvcmVGYWlsZWRPcGVyYXRpb25TbmFwc2hvdChjbGlwLCBiZWZvcmUsIHJvb3ROb2RlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ2ZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICByZWFzb246IG5vcm1hbGl6ZWRFcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWx1cmVSZXN1bHQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnZmFpbHVyZScsXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHJlYXNvbjogYGNhbGwgbWV0aG9kICR7b3BlcmF0aW9uLnR5cGV9IGZhaWxlZGAsXG4gICAgICAgICAgICAgICAgfSBhcyBJQW5pbWF0aW9uT3BlcmF0aW9uUmVzdWx0O1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RvcmVGYWlsZWRPcGVyYXRpb25TbmFwc2hvdChjbGlwLCBiZWZvcmUsIHJvb3ROb2RlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbHVyZVJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFwcGxpZWRPcGVyYXRpb25zLnB1c2gob3BlcmF0aW9uKTtcbiAgICAgICAgICAgIHNob3VsZFN5bmNEdXJhdGlvbiA9IHNob3VsZFN5bmNEdXJhdGlvbiB8fCBzaG91bGRTeW5jQW5pbWF0aW9uQ2xpcER1cmF0aW9uKG9wZXJhdGlvbiwgaXNTa2VsZXRvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvdWxkU3luY0R1cmF0aW9uKSB7XG4gICAgICAgICAgICBzeW5jQW5pbWF0aW9uQ2xpcER1cmF0aW9uKGNsaXApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuX3Jlc2V0QW5pbWF0aW9uU3RhdGVQcmVzZXJ2aW5nQ2xpcChzZXNzaW9uLmNsaXBVdWlkLCBjbGlwLCBwcm9wZXJ0eU1ldGFkYXRhQ29udGV4dCk7XG4gICAgICAgIHRoaXMuX2FuaW1hdGlvblN0YXRlcy5jcmVhdGUoc2Vzc2lvbi5jbGlwVXVpZCwgY2xpcCk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0VGltZSh7IHRpbWU6IHRoaXMuX2N1ckVkaXRUaW1lIH0pO1xuICAgICAgICBjb25zdCBhZnRlciA9IHNob3VsZFJlY29yZFVuZG8gPyBjYXB0dXJlQW5pbWF0aW9uQ2xpcFNuYXBzaG90KGNsaXAsIHByb3BlcnR5TWV0YWRhdGFDb250ZXh0KSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHVuZG9SZWNvcmRlZCA9IEJvb2xlYW4oYmVmb3JlICYmIGFmdGVyICYmICFhbmltYXRpb25DbGlwU25hcHNob3RzRXF1YWwoYmVmb3JlLCBhZnRlcikpO1xuICAgICAgICBpZiAodW5kb1JlY29yZGVkICYmIGJlZm9yZSAmJiBhZnRlcikge1xuICAgICAgICAgICAgY29uc3QgdW5kb0NvbW1hbmQgPSBuZXcgQW5pbWF0aW9uQ2xpcFNuYXBzaG90Q29tbWFuZCh7XG4gICAgICAgICAgICAgICAgY2xpcFV1aWQ6IHNlc3Npb24uY2xpcFV1aWQsXG4gICAgICAgICAgICAgICAgYmVmb3JlLFxuICAgICAgICAgICAgICAgIGFmdGVyLFxuICAgICAgICAgICAgICAgIGFwcGx5U25hcHNob3Q6IChzbmFwc2hvdCkgPT4gdGhpcy5fcmVzdG9yZUN1cnJlbnRDbGlwU25hcHNob3Qoc2Vzc2lvbi5jbGlwVXVpZCwgc25hcHNob3QpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBwcmV2aW91c1Njb3BlID0gb3B0aW9ucy5hYnNvcmJQcmV2aW91c1NjZW5lUHJvcGVydHlVbmRvID09PSB0cnVlXG4gICAgICAgICAgICAgICAgPyB0aGlzLl9jcmVhdGVQcmV2aW91c1NjZW5lUHJvcGVydHlVbmRvU2NvcGUoc2Vzc2lvbi5yb290UGF0aCwgYXBwbGllZE9wZXJhdGlvbnMpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzU2NvcGUpIHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlLlVuZG8ucHVzaFdpdGhQcmV2aW91cyh1bmRvQ29tbWFuZCwge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0FuaW1hdGlvbiBQcm9wZXJ0eSBDb21taXQnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYW5pbWF0aW9uOnByb3BlcnR5LWNvbW1pdCcsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHNlc3Npb24uY2xpcFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3JUeXBlOiAnYW5pbWF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGU6ICdhbmltYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c1Njb3BlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c1R5cGVzOiBbJ25vZGU6c2V0LXByb3BlcnR5JywgJ2NvbXBvbmVudDpzZXQtcHJvcGVydHknLCAncmVjb3JkaW5nOnNuYXBzaG90J10sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuVW5kby5wdXNoKHVuZG9Db21tYW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9icm9hZGNhc3RDbGlwQ2hhbmdlZCgnb3BlcmF0aW9uJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgcmVzdWx0OiB0cnVlLFxuICAgICAgICAgICAgdW5kb1JlY29yZGVkLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIHNhdmUob3B0aW9uczogSUFuaW1hdGlvblNhdmVPcHRpb25zID0ge30pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmVBbmltYXRpb25TZXNzaW9uKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IHRoaXMuX2dldEFuaW1hdGlvblN0YXRlKHNlc3Npb24uY2xpcFV1aWQpO1xuICAgICAgICBjb25zdCByb290Tm9kZSA9IHRoaXMuX2dldFNlc3Npb25Sb290Tm9kZSgpO1xuICAgICAgICBlbnN1cmVDbGlwRXZlbnRzKHN0YXRlLmNsaXApO1xuICAgICAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBzYXZlQW5pbWF0aW9uU2VydmljZUNsaXAoe1xuICAgICAgICAgICAgICAgIHNlc3Npb24sXG4gICAgICAgICAgICAgICAgcm9vdE5vZGUsXG4gICAgICAgICAgICAgICAgY2xpcDogc3RhdGUuY2xpcCxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG9wdGlvbnMudGFyZ2V0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9wZXJ0eU1ldGFkYXRhQ29udGV4dCA9IGNyZWF0ZUFuaW1hdGlvblByb3BlcnR5Q3VydmVNZXRhZGF0YUNvbnRleHQocm9vdE5vZGUpO1xuICAgICAgICBjb25zdCBzYXZlZFNuYXBzaG90ID0gY2FwdHVyZUFuaW1hdGlvbkNsaXBTbmFwc2hvdChzdGF0ZS5jbGlwLCBwcm9wZXJ0eU1ldGFkYXRhQ29udGV4dCk7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbkRpcnR5QXRTYXZlID0gdGhpcy5faXNBbmltYXRpb25TZXNzaW9uRGlydHkoc2Vzc2lvbik7XG4gICAgICAgIHRoaXMuX21hcmtTZWxmU2F2ZWRDbGlwUmVmcmVzaChzZXNzaW9uLmNsaXBVdWlkKTtcbiAgICAgICAgbGV0IHNhdmVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzYXZlZCA9IGF3YWl0IHNhdmVBbmltYXRpb25TZXJ2aWNlQ2xpcCh7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbixcbiAgICAgICAgICAgICAgICByb290Tm9kZSxcbiAgICAgICAgICAgICAgICBjbGlwOiBzdGF0ZS5jbGlwLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxmU2F2ZWRDbGlwUmVmcmVzaGVzLmRlbGV0ZShzZXNzaW9uLmNsaXBVdWlkKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzYXZlZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVzdG9yZUN1cnJlbnRDbGlwQWZ0ZXJTZWxmU2F2ZShzZXNzaW9uLmNsaXBVdWlkLCBzdGF0ZS5jbGlwLCBzYXZlZFNuYXBzaG90LCBwcm9wZXJ0eU1ldGFkYXRhQ29udGV4dCk7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSBhd2FpdCB0aGlzLl9nZXRBbmltYXRpb25TdGF0ZShzZXNzaW9uLmNsaXBVdWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGFuaW1Db21wID0gcXVlcnlBbmltYXRpb25Db21wb25lbnQocm9vdE5vZGUpO1xuICAgICAgICAgICAgaWYgKGFuaW1Db21wIGluc3RhbmNlb2YgQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmViaW5kQW5pbWF0aW9uQ29tcG9uZW50Q2xpcChhbmltQ29tcCwgY3VycmVudFN0YXRlLmNsaXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbWFya1NlbGZTYXZlZENsaXBSZWZyZXNoKHNlc3Npb24uY2xpcFV1aWQpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2F2ZVNjZW5lID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2F2ZVNjZW5lRm9yQW5pbWF0aW9uU2Vzc2lvbihzZXNzaW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uU2NvcGUgPSB0aGlzLl9jcmVhdGVBbmltYXRpb25VbmRvU2NvcGUoc2Vzc2lvbi5jbGlwVXVpZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTm9uQW5pbWF0aW9uRGlmZmVyZW5jZSA9IFNlcnZpY2UuVW5kby5oYXNEaWZmZXJlbmNlT3V0c2lkZVNjb3BlKHNlc3Npb24udW5kb0Jhc2VsaW5lLCBhbmltYXRpb25TY29wZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFzZXNzaW9uLmdsb2JhbERpcnR5QXRFbnRlciAmJiAhaGFzTm9uQW5pbWF0aW9uRGlmZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlLlVuZG8ubWFya1NhdmVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2Vzc2lvbi51bmRvQmFzZWxpbmUgPSB7XG4gICAgICAgICAgICAgICAgLi4uU2VydmljZS5VbmRvLmNyZWF0ZUNoZWNrcG9pbnQoKSxcbiAgICAgICAgICAgICAgICBpbmNsdWRlQ2hlY2twb2ludENvbW1hbmQ6IGFuaW1hdGlvbkRpcnR5QXRTYXZlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlc3Npb24uZ2xvYmFsRGlydHlBdEVudGVyID0gU2VydmljZS5VbmRvLmlzRGlydHkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGZTYXZlZENsaXBSZWZyZXNoZXMuZGVsZXRlKHNlc3Npb24uY2xpcFV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzYXZlZDtcbiAgICB9XG5cblxuICAgIHByZXNlcnZlQ3VycmVudENsaXBBc3NldEZvckNoYW5nZSh1dWlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCF0aGlzLl9zZXNzaW9uIHx8IHRoaXMuX3Nlc3Npb24uY2xpcFV1aWQgIT09IHV1aWQgfHwgIXRoaXMuX2FuaW1hdGlvblN0YXRlcy5nZXQodXVpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWJpbmRDdXJyZW50QW5pbWF0aW9uU3RhdGVDbGlwKHV1aWQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbkFzc2V0RGVsZXRlZCh1dWlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLl9zZXNzaW9uIHx8IHRoaXMuX3Nlc3Npb24uY2xpcFV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2b2lkIHRoaXMuZXhpdCh7IHJlc3RvcmVTZWxlY3Rpb246IGZhbHNlLCByZXN0b3JlU2FtcGxlZFNjZW5lU3RhdGU6IHRydWUgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NlU2Vzc2lvbigpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0FuaW1hdGlvbl0gZXhpdCBhZnRlciBhbmltYXRpb24gY2xpcCBkZWxldGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkVkaXRvckNsb3NlZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zZVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXNvbHZlUm9vdE5vZGUob3B0aW9uczogSUFuaW1hdGlvblRhcmdldE9wdGlvbnMpOiBOb2RlIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVBbmltYXRpb25Sb290VGFyZ2V0KG9wdGlvbnMsIFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCksIFNlcnZpY2UuU2VsZWN0aW9uLnF1ZXJ5KCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3Jlc29sdmVOb2RlKG9wdGlvbnM6IElBbmltYXRpb25UYXJnZXRPcHRpb25zIHwgSUFuaW1hdGlvbkVudGVyT3B0aW9ucyk6IE5vZGUge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZUFuaW1hdGlvblRhcmdldE5vZGUob3B0aW9ucywgU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKSwgU2VydmljZS5TZWxlY3Rpb24ucXVlcnkoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzb2x2ZUNsaXBGb3JRdWVyeShvcHRpb25zOiBJQW5pbWF0aW9uUXVlcnlDbGlwT3B0aW9ucyk6IFByb21pc2U8eyByb290Tm9kZTogTm9kZTsgY2xpcDogQW5pbWF0aW9uQ2xpcCB9PiB7XG4gICAgICAgIGNvbnN0IGhhc1RhcmdldCA9IEJvb2xlYW4ob3B0aW9ucy5yb290UGF0aCB8fCBvcHRpb25zLnJvb3RVdWlkIHx8IG9wdGlvbnMubm9kZVBhdGggfHwgb3B0aW9ucy5ub2RlVXVpZCk7XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlID0gaGFzVGFyZ2V0ID8gdGhpcy5fcmVzb2x2ZVJvb3ROb2RlKG9wdGlvbnMpIDogdGhpcy5fZ2V0U2Vzc2lvblJvb3ROb2RlKCk7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRVdWlkID0gdGhpcy5fc2Vzc2lvbj8ucm9vdFV1aWQgPT09IHJvb3ROb2RlLnV1aWQgPyB0aGlzLl9zZXNzaW9uLmNsaXBVdWlkIDogdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCB0YXJnZXRVdWlkID0gb3B0aW9ucy5jbGlwVXVpZCB8fCBkZWZhdWx0VXVpZDtcbiAgICAgICAgY29uc3QgYW5pbURhdGEgPSBhd2FpdCBxdWVyeU5vZGVBbmltYXRpb25EYXRhKHJvb3ROb2RlLCB0YXJnZXRVdWlkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3ROb2RlLFxuICAgICAgICAgICAgY2xpcDogcmVzb2x2ZUFuaW1hdGlvbkNsaXAoYW5pbURhdGEsIHRhcmdldFV1aWQpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2dldEFuaW1hdGlvblN0YXRlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8QW5pbWF0aW9uU3RhdGU+IHtcbiAgICAgICAgcmVxdWlyZUFuaW1hdGlvblNlc3Npb24odGhpcy5fc2Vzc2lvbik7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmltYXRpb25TdGF0ZXMuZ2V0T3JDcmVhdGUodXVpZCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfc3RvcEN1cnJlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3BsYXliYWNrLnN0b3BDdXJyZW50KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzZXRBbmltYXRpb25TdGF0ZVByZXNlcnZpbmdDbGlwKFxuICAgICAgICB1dWlkOiBzdHJpbmcsXG4gICAgICAgIGNsaXA6IEFuaW1hdGlvbkNsaXAsXG4gICAgICAgIG9wdGlvbnMgPSBjcmVhdGVBbmltYXRpb25Qcm9wZXJ0eUN1cnZlTWV0YWRhdGFDb250ZXh0KHRoaXMuX2dldFNlc3Npb25Sb290Tm9kZSgpKSxcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLl9hbmltYXRpb25TdGF0ZXMuZ2V0KHV1aWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbmltYXRpb25TdGF0ZS5kZXN0cm95KCkgbWF5IHRvdWNoIGN1cnZlcyBpdCBpbml0aWFsaXplZC4gUHJlc2VydmUgdGhlXG4gICAgICAgIC8vIGN1cnJlbnQgY2xpcCBkYXRhIGFyb3VuZCByZXNldCBzbyBzdGF0ZSBjbGVhbnVwIGNhbm5vdCB3aXBlIGV4aXN0aW5nIG9yXG4gICAgICAgIC8vIG5ld2x5IGVkaXRlZCBrZXlmcmFtZXMuXG4gICAgICAgIGNvbnN0IHNuYXBzaG90ID0gY2FwdHVyZUFuaW1hdGlvbkNsaXBTbmFwc2hvdChjbGlwLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uU3RhdGVzLnJlc2V0KHV1aWQpO1xuICAgICAgICBhd2FpdCByZXN0b3JlQW5pbWF0aW9uQ2xpcFNuYXBzaG90KGNsaXAsIHNuYXBzaG90KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9yZXN0b3JlRmFpbGVkT3BlcmF0aW9uU25hcHNob3QoY2xpcDogQW5pbWF0aW9uQ2xpcCwgc25hcHNob3Q6IElBbmltYXRpb25DbGlwU25hcHNob3QsIF9yb290Tm9kZTogTm9kZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB1dWlkID0gY2xpcFV1aWQoY2xpcCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlQ2xpcFNuYXBzaG90V2l0aFN0YXRlUmVjcmVhdGlvbih1dWlkLCBjbGlwLCBzbmFwc2hvdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbQW5pbWF0aW9uXSByZXN0b3JlIGZhaWxlZCBvcGVyYXRpb24gc25hcHNob3QgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0VGltZSh7IHRpbWU6IHRoaXMuX2N1ckVkaXRUaW1lIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3Jlc3RvcmVDdXJyZW50Q2xpcFNuYXBzaG90KHV1aWQ6IHN0cmluZywgc25hcHNob3Q6IElBbmltYXRpb25DbGlwU25hcHNob3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmVBbmltYXRpb25TZXNzaW9uKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICBpZiAodXVpZCAhPT0gc2Vzc2lvbi5jbGlwVXVpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjdXJyZW50IGVkaXQgY2xpcDogJyR7c2Vzc2lvbi5jbGlwVXVpZH0nIGJ1dCB5b3Ugd2FudCB0byByZXN0b3JlOiAnJHt1dWlkfSdgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgdGhpcy5fZ2V0QW5pbWF0aW9uU3RhdGUodXVpZCk7XG4gICAgICAgIGNvbnN0IGNsaXAgPSBzdGF0ZS5jbGlwO1xuICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlQ2xpcFNuYXBzaG90V2l0aFN0YXRlUmVjcmVhdGlvbih1dWlkLCBjbGlwLCBzbmFwc2hvdCwgdHJ1ZSk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0VGltZSh7IHRpbWU6IHRoaXMuX2N1ckVkaXRUaW1lIH0pO1xuICAgICAgICB0aGlzLl9icm9hZGNhc3RDbGlwQ2hhbmdlZCgndW5kby1yZWRvJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzdG9yZUN1cnJlbnRDbGlwQWZ0ZXJTZWxmU2F2ZShcbiAgICAgICAgdXVpZDogc3RyaW5nLFxuICAgICAgICBjbGlwOiBBbmltYXRpb25DbGlwLFxuICAgICAgICBzbmFwc2hvdDogSUFuaW1hdGlvbkNsaXBTbmFwc2hvdCxcbiAgICAgICAgcHJvcGVydHlNZXRhZGF0YUNvbnRleHQ6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUFuaW1hdGlvblByb3BlcnR5Q3VydmVNZXRhZGF0YUNvbnRleHQ+LFxuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSB0aGlzLl9hbmltYXRpb25TdGF0ZXMuZ2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWN1cnJlbnRTdGF0ZSB8fCBjdXJyZW50U3RhdGUuY2xpcCAhPT0gY2xpcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudFNuYXBzaG90ID0gY2FwdHVyZUFuaW1hdGlvbkNsaXBTbmFwc2hvdChjbGlwLCBwcm9wZXJ0eU1ldGFkYXRhQ29udGV4dCk7XG4gICAgICAgIGlmIChhbmltYXRpb25DbGlwU25hcHNob3RzRXF1YWwoY3VycmVudFNuYXBzaG90LCBzbmFwc2hvdCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RvcmVDbGlwU25hcHNob3RXaXRoU3RhdGVSZWNyZWF0aW9uKHV1aWQsIGNsaXAsIHNuYXBzaG90LCB0cnVlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXRUaW1lKHsgdGltZTogdGhpcy5fY3VyRWRpdFRpbWUgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzdG9yZUNsaXBTbmFwc2hvdFdpdGhTdGF0ZVJlY3JlYXRpb24oXG4gICAgICAgIHV1aWQ6IHN0cmluZyxcbiAgICAgICAgY2xpcDogQW5pbWF0aW9uQ2xpcCxcbiAgICAgICAgc25hcHNob3Q6IElBbmltYXRpb25DbGlwU25hcHNob3QsXG4gICAgICAgIHNob3VsZFJlY3JlYXRlU3RhdGUgPSBCb29sZWFuKHRoaXMuX2FuaW1hdGlvblN0YXRlcy5nZXQodXVpZCkpLFxuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoc2hvdWxkUmVjcmVhdGVTdGF0ZSkge1xuICAgICAgICAgICAgLy8gRGVzdHJveSB0aGUgb2xkIHN0YXRlIGJlZm9yZSByZXBsYWNpbmcgY2xpcCB0cmFja3M7IGRlc3Ryb3koKSBtYXkgdG91Y2ggY3VydmVzIGl0IGluaXRpYWxpemVkLlxuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uU3RhdGVzLnJlc2V0KHV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCByZXN0b3JlQW5pbWF0aW9uQ2xpcFNuYXBzaG90KGNsaXAsIHNuYXBzaG90KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChzaG91bGRSZWNyZWF0ZVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uU3RhdGVzLmNyZWF0ZSh1dWlkLCBjbGlwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaG91bGRSZWNyZWF0ZVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9hbmltYXRpb25TdGF0ZXMuY3JlYXRlKHV1aWQsIGNsaXApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVmcmVzaEN1cnJlbnRDbGlwQXNzZXQodXVpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghdGhpcy5fc2Vzc2lvbiB8fCB0aGlzLl9zZXNzaW9uLmNsaXBVdWlkICE9PSB1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSB0aGlzLl9hbmltYXRpb25TdGF0ZXMuZ2V0KHV1aWQpO1xuICAgICAgICBpZiAoY3VycmVudFN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWJpbmRDdXJyZW50QW5pbWF0aW9uU3RhdGVDbGlwKHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3Nob3VsZFN1cHByZXNzU2VsZlNhdmVkQ2xpcFJlZnJlc2godXVpZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRpbWUgPSB0aGlzLl9jdXJFZGl0VGltZTtcbiAgICAgICAgY29uc3QgY2xpcCA9IGF3YWl0IGxvYWRBbmltYXRpb25DbGlwKHV1aWQpO1xuICAgICAgICBpZiAoIXRoaXMuX3Nlc3Npb24gfHwgdGhpcy5fc2Vzc2lvbi5jbGlwVXVpZCAhPT0gdXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zaG91bGRTdXBwcmVzc1NlbGZTYXZlZENsaXBSZWZyZXNoKHV1aWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSB0aGlzLl9nZXRTZXNzaW9uUm9vdE5vZGUoKTtcbiAgICAgICAgY29uc3QgYW5pbUNvbXAgPSBxdWVyeUFuaW1hdGlvbkNvbXBvbmVudChyb290Tm9kZSk7XG4gICAgICAgIGlmIChjbGlwICYmIGFuaW1Db21wIGluc3RhbmNlb2YgQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICByZWJpbmRBbmltYXRpb25Db21wb25lbnRDbGlwKGFuaW1Db21wLCBjbGlwKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hbmltYXRpb25TdGF0ZXMucmVzZXQodXVpZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX2dldEFuaW1hdGlvblN0YXRlKHV1aWQpO1xuICAgICAgICBhd2FpdCB0aGlzLnNldFRpbWUoeyB0aW1lIH0pO1xuICAgICAgICB0aGlzLl9icm9hZGNhc3RDbGlwQ2hhbmdlZCgnYXNzZXQtcmVmcmVzaCcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlYmluZEN1cnJlbnRBbmltYXRpb25TdGF0ZUNsaXAodXVpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IHRoaXMuX2FuaW1hdGlvblN0YXRlcy5nZXQodXVpZCk7XG4gICAgICAgIGlmICghY3VycmVudFN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSB0aGlzLl9nZXRTZXNzaW9uUm9vdE5vZGUoKTtcbiAgICAgICAgY29uc3QgYW5pbUNvbXAgPSBxdWVyeUFuaW1hdGlvbkNvbXBvbmVudChyb290Tm9kZSk7XG4gICAgICAgIGlmIChhbmltQ29tcCBpbnN0YW5jZW9mIEFuaW1hdGlvbikge1xuICAgICAgICAgICAgcmViaW5kQW5pbWF0aW9uQ29tcG9uZW50Q2xpcChhbmltQ29tcCwgY3VycmVudFN0YXRlLmNsaXApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZGlzcG9zZVNlc3Npb24oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3BsYXliYWNrLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uU3RhdGVzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX3Nlc3Npb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9jdXJFZGl0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuX3BsYXlTdGF0ZSA9ICdzdG9wJztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXN0b3JlU2VsZWN0aW9uKHNlbGVjdGlvbjogc3RyaW5nW10pOiB2b2lkIHtcbiAgICAgICAgU2VydmljZS5TZWxlY3Rpb24uY2xlYXIoKTtcbiAgICAgICAgZm9yIChjb25zdCBwYXRoIG9mIHNlbGVjdGlvbi5zbGljZSgpLnJldmVyc2UoKSkge1xuICAgICAgICAgICAgaWYgKGdldE5vZGVCeVBhdGgocGF0aCkpIHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlLlNlbGVjdGlvbi5zZWxlY3QocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9lbWl0Tm9kZUNoYW5nZWQobm9kZTogTm9kZSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgbm9kZSwge1xuICAgICAgICAgICAgc291cmNlOiAnZWRpdG9yJyxcbiAgICAgICAgICAgIHR5cGU6IE5vZGVFdmVudFR5cGUuTk9USUZZX05PREVfQ0hBTkdFRCxcbiAgICAgICAgICAgIHJlY29yZDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Jyb2FkY2FzdFN0YXRlQ2hhbmdlZChyZWFzb246IEFuaW1hdGlvbkV2ZW50UmVhc29uLCBzdGF0ZTogSUFuaW1hdGlvblN0YXRlSW5mbyk6IHZvaWQge1xuICAgICAgICB0aGlzLmJyb2FkY2FzdCgnYW5pbWF0aW9uOnN0YXRlLWNoYW5nZWQnLCB7IHJlYXNvbiwgc3RhdGUgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYnJvYWRjYXN0VGltZUNoYW5nZWQocmVhc29uOiBBbmltYXRpb25FdmVudFJlYXNvbik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbikge1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNlc3Npb25Sb290UGF0aCh0aGlzLl9zZXNzaW9uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBldmVudCA9IGNyZWF0ZUFuaW1hdGlvblNlcnZpY2VDbGlwRXZlbnQodGhpcy5fc2Vzc2lvbiwgcmVhc29uKTtcbiAgICAgICAgaWYgKCFldmVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0KCdhbmltYXRpb246dGltZS1jaGFuZ2VkJywge1xuICAgICAgICAgICAgLi4uZXZlbnQsXG4gICAgICAgICAgICB0aW1lOiB0aGlzLl9jdXJFZGl0VGltZSxcbiAgICAgICAgICAgIHBsYXlTdGF0ZTogdGhpcy5fcGxheVN0YXRlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9icm9hZGNhc3RDbGlwQ2hhbmdlZChyZWFzb246IEFuaW1hdGlvbkV2ZW50UmVhc29uKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2Vzc2lvblJvb3RQYXRoKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gY3JlYXRlQW5pbWF0aW9uU2VydmljZUNsaXBFdmVudCh0aGlzLl9zZXNzaW9uLCByZWFzb24pO1xuICAgICAgICBpZiAoIWV2ZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5icm9hZGNhc3QoJ2FuaW1hdGlvbjpjbGlwLWNoYW5nZWQnLCBldmVudCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfc2F2ZVNjZW5lRm9yQW5pbWF0aW9uU2Vzc2lvbihzZXNzaW9uOiBJQW5pbWF0aW9uU2Vzc2lvbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCByb290Tm9kZSA9IGdldE5vZGVCeVV1aWQoc2Vzc2lvbi5yb290VXVpZCk7XG4gICAgICAgIGlmICghcm9vdE5vZGUgfHwgIXNlc3Npb24uc2FtcGxlZFJvb3RTdGF0ZSkge1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FZGl0b3Iuc2F2ZSh7fSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlZGl0VGltZSA9IHRoaXMuX2N1ckVkaXRUaW1lO1xuICAgICAgICBhd2FpdCB0aGlzLl9zdG9wQ3VycmVudCgpO1xuICAgICAgICBhd2FpdCByZXN0b3JlQW5pbWF0aW9uU2FtcGxlZFN0YXRlKHJvb3ROb2RlLCBzZXNzaW9uLnNhbXBsZWRSb290U3RhdGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FZGl0b3Iuc2F2ZSh7fSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNldFRpbWUoeyB0aW1lOiBlZGl0VGltZSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFNlc3Npb25Sb290Tm9kZSgpOiBOb2RlIHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmVBbmltYXRpb25TZXNzaW9uKHRoaXMuX3Nlc3Npb24pO1xuICAgICAgICBjb25zdCByb290Tm9kZSA9IGdldEFuaW1hdGlvblNlc3Npb25Sb290Tm9kZShzZXNzaW9uKTtcbiAgICAgICAgY29uc3Qgcm9vdFBhdGggPSBnZXROb2RlUGF0aChyb290Tm9kZSk7XG4gICAgICAgIGlmIChyb290UGF0aCkge1xuICAgICAgICAgICAgc2Vzc2lvbi5yb290UGF0aCA9IHJvb3RQYXRoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByb290Tm9kZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWZyZXNoU2Vzc2lvblJvb3RQYXRoKHNlc3Npb246IElBbmltYXRpb25TZXNzaW9uKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlID0gZ2V0Tm9kZUJ5VXVpZChzZXNzaW9uLnJvb3RVdWlkKTtcbiAgICAgICAgaWYgKHJvb3ROb2RlKSB7XG4gICAgICAgICAgICBjb25zdCByb290UGF0aCA9IGdldE5vZGVQYXRoKHJvb3ROb2RlKTtcbiAgICAgICAgICAgIGlmIChyb290UGF0aCkge1xuICAgICAgICAgICAgICAgIHNlc3Npb24ucm9vdFBhdGggPSByb290UGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2Rpc2NhcmRBbmltYXRpb25TZXNzaW9uQ2hhbmdlcyhzZXNzaW9uOiBJQW5pbWF0aW9uU2Vzc2lvbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBzY29wZSA9IHRoaXMuX2NyZWF0ZUFuaW1hdGlvblVuZG9TY29wZShzZXNzaW9uLmNsaXBVdWlkKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgU2VydmljZS5VbmRvLmRpc2NhcmRTY29wZWRDaGFuZ2VzQWZ0ZXJDaGVja3BvaW50KHNlc3Npb24udW5kb0Jhc2VsaW5lLCBzY29wZSk7XG4gICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXN1bHQucmVhc29uIHx8ICdGYWlsZWQgdG8gZGlzY2FyZCBhbmltYXRpb24gY2hhbmdlcy4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2lzQW5pbWF0aW9uU2Vzc2lvbkRpcnR5KHNlc3Npb246IElBbmltYXRpb25TZXNzaW9uKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5fY3JlYXRlQW5pbWF0aW9uVW5kb1Njb3BlKHNlc3Npb24uY2xpcFV1aWQpO1xuICAgICAgICBpZiAoc2Vzc2lvbi51bmRvQmFzZWxpbmUuaW5jbHVkZUNoZWNrcG9pbnRDb21tYW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gU2VydmljZS5VbmRvLmhhc1Njb3BlZERpZmZlcmVuY2Uoc2Vzc2lvbi51bmRvQmFzZWxpbmUsIHNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU2VydmljZS5VbmRvLmhhc1Njb3BlZERpZmZlcmVuY2VBZnRlckNoZWNrcG9pbnQoc2Vzc2lvbi51bmRvQmFzZWxpbmUsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9pc1NjZW5lU2Vzc2lvbkRpcnR5KHNlc3Npb246IElBbmltYXRpb25TZXNzaW9uKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChzZXNzaW9uLmdsb2JhbERpcnR5QXRFbnRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNlcnZpY2UuVW5kby5oYXNEaWZmZXJlbmNlT3V0c2lkZVNjb3BlKFxuICAgICAgICAgICAgc2Vzc2lvbi51bmRvQmFzZWxpbmUsXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVBbmltYXRpb25VbmRvU2NvcGUoc2Vzc2lvbi5jbGlwVXVpZCksXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3JlYXRlQW5pbWF0aW9uVW5kb1Njb3BlKGNsaXBVdWlkOiBzdHJpbmcpOiBQYXJ0aWFsPElVbmRvU2NvcGU+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFzc2V0VXVpZDogY2xpcFV1aWQsXG4gICAgICAgICAgICBlZGl0b3JUeXBlOiAnYW5pbWF0aW9uJyxcbiAgICAgICAgICAgIG1vZGU6ICdhbmltYXRpb24nLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX21hcmtTZWxmU2F2ZWRDbGlwUmVmcmVzaCh1dWlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fc2VsZlNhdmVkQ2xpcFJlZnJlc2hlcy5zZXQodXVpZCwgRGF0ZS5ub3coKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2hvdWxkU3VwcHJlc3NTZWxmU2F2ZWRDbGlwUmVmcmVzaCh1dWlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgc2F2ZWRBdCA9IHRoaXMuX3NlbGZTYXZlZENsaXBSZWZyZXNoZXMuZ2V0KHV1aWQpO1xuICAgICAgICBpZiAoc2F2ZWRBdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzYXZlZEF0IDw9IFNFTEZfU0FWRV9BU1NFVF9SRUZSRVNIX1NVUFBSRVNTSU9OX01TKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxmU2F2ZWRDbGlwUmVmcmVzaGVzLmRlbGV0ZSh1dWlkKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZVByZXZpb3VzU2NlbmVQcm9wZXJ0eVVuZG9TY29wZShyb290UGF0aDogc3RyaW5nLCBvcGVyYXRpb25zOiBJQW5pbWF0aW9uT3BlcmF0aW9uW10pOiBQYXJ0aWFsPElVbmRvU2NvcGU+IHwgbnVsbCB7XG4gICAgICAgIGlmIChvcGVyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IG5ldyBNYXA8c3RyaW5nLCB7IG5vZGVQYXRoOiBzdHJpbmc7IHByb3BQYXRoOiBzdHJpbmcgfT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBvcGVyYXRpb24gb2Ygb3BlcmF0aW9ucykge1xuICAgICAgICAgICAgaWYgKCEoJ3Byb3BLZXknIGluIG9wZXJhdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5vZGVQYXRoID0gdGhpcy5fcmVzb2x2ZVNjZW5lUHJvcGVydHlOb2RlUGF0aChyb290UGF0aCwgb3BlcmF0aW9uKTtcbiAgICAgICAgICAgIGlmICghbm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHsgbm9kZVBhdGgsIHByb3BQYXRoOiBvcGVyYXRpb24ucHJvcEtleSB9O1xuICAgICAgICAgICAgdGFyZ2V0cy5zZXQoYCR7dGFyZ2V0Lm5vZGVQYXRofVxcbiR7dGFyZ2V0LnByb3BQYXRofWAsIHRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhcmdldHMuc2l6ZSAhPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgW3RhcmdldF0gPSB0YXJnZXRzLnZhbHVlcygpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZWRpdG9yVHlwZTogJ3NjZW5lJyxcbiAgICAgICAgICAgIG5vZGVQYXRoOiB0YXJnZXQubm9kZVBhdGgsXG4gICAgICAgICAgICBwcm9wUGF0aDogdGFyZ2V0LnByb3BQYXRoLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX3Jlc29sdmVTY2VuZVByb3BlcnR5Tm9kZVBhdGgocm9vdFBhdGg6IHN0cmluZywgb3BlcmF0aW9uOiB7IG5vZGVQYXRoPzogc3RyaW5nOyBub2RlVXVpZD86IHN0cmluZyB9KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgICAgIGlmIChvcGVyYXRpb24ubm9kZVV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBnZXROb2RlQnlVdWlkKG9wZXJhdGlvbi5ub2RlVXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZSA/IGdldE5vZGVQYXRoKG5vZGUpIDogbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub3JtYWxpemVkUm9vdFBhdGggPSBub3JtYWxpemVTY2VuZU5vZGVQYXRoKHJvb3RQYXRoKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZE5vZGVQYXRoID0gbm9ybWFsaXplU2NlbmVOb2RlUGF0aChvcGVyYXRpb24ubm9kZVBhdGggfHwgJycpO1xuICAgICAgICBpZiAoIW5vcm1hbGl6ZWROb2RlUGF0aCB8fCBub3JtYWxpemVkTm9kZVBhdGggPT09IG5vcm1hbGl6ZWRSb290UGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRSb290UGF0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9ybWFsaXplZFJvb3RQYXRoICYmIG5vcm1hbGl6ZWROb2RlUGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRSb290UGF0aH0vYCkpIHtcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVkTm9kZVBhdGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRSb290UGF0aCA/IGAke25vcm1hbGl6ZWRSb290UGF0aH0vJHtub3JtYWxpemVkTm9kZVBhdGh9YCA6IG5vcm1hbGl6ZWROb2RlUGF0aDtcbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU2NlbmVOb2RlUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBTdHJpbmcocGF0aCB8fCAnJykucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgJycpO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUFuaW1hdGlvblByb3BlcnR5VGFyZ2V0KFxuICAgIG9wZXJhdGlvbjogSUFuaW1hdGlvbk9wZXJhdGlvbixcbiAgICByb290Tm9kZTogTm9kZSxcbiAgICByb290UGF0aDogc3RyaW5nLFxuKTogSUFuaW1hdGlvbk9wZXJhdGlvblJlc3VsdCB8IG51bGwge1xuICAgIGlmICghKCdwcm9wS2V5JyBpbiBvcGVyYXRpb24pKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAocmVzb2x2ZUFuaW1hdGlvblJlbGF0aXZlTm9kZVBhdGgocm9vdE5vZGUsIHJvb3RQYXRoLCBvcGVyYXRpb24pICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IG9wZXJhdGlvbi5ub2RlVXVpZFxuICAgICAgICA/IGBVVUlEIFwiJHtvcGVyYXRpb24ubm9kZVV1aWR9XCJgXG4gICAgICAgIDogYHBhdGggXCIke29wZXJhdGlvbi5ub2RlUGF0aCB8fCAnPHJvb3Q+J31cImA7XG4gICAgY29uc3QgcmVhc29uID0gYEFuaW1hdGlvbiBwcm9wZXJ0eSB0YXJnZXQgJHt0YXJnZXR9IGlzIG5vdCBib3VuZCBieSB0aGUgY3VycmVudCBhbmltYXRpb24gaGllcmFyY2h5LmA7XG4gICAgY29uc29sZS53YXJuKGBbQW5pbWF0aW9uXSAke3JlYXNvbn1gKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogJ2ZhaWx1cmUnLFxuICAgICAgICByZXN1bHQ6IGZhbHNlLFxuICAgICAgICByZWFzb24sXG4gICAgfTtcbn1cbiJdfQ==