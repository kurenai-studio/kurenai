"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const query_1 = __importDefault(require("./manager/query"));
const operation_1 = __importDefault(require("./manager/operation"));
function getCC() {
    return require('cc');
}
function getNewGenAnim() {
    return require('cc/editor/new-gen-anim');
}
class AnimationGraphVariantAssetService {
    _pendingEdits = new Map();
    async query(uuid) {
        const asset = this._queryTypedAsset(uuid, 'animation-graph-variant', 'cc.AnimationGraphVariant');
        const variant = await this._loadAnimationGraphVariant(asset);
        const sourceOverrides = this._entryOverrides(variant);
        const dump = await this._encodeVariant(variant, sourceOverrides);
        const graph = await this._snapshotGraph(dump.graphUuid);
        this._pendingEdits.set(asset.uuid, {
            uuid: asset.uuid,
            source: asset.source,
            sourceMtimeMs: await this._querySourceMtime(asset.source),
            assetDbMtime: query_1.default.queryAssetMtime(asset.uuid),
            graph,
            sourceOverrides,
            dump: this._cloneDump(dump),
        });
        return dump;
    }
    async change(uuid, dump) {
        const asset = this._queryTypedAsset(uuid, 'animation-graph-variant', 'cc.AnimationGraphVariant');
        let pending = this._pendingEdits.get(asset.uuid);
        if (!pending) {
            await this.query(asset.uuid);
            pending = this._pendingEdits.get(asset.uuid);
        }
        if (!pending) {
            throw new Error(`AnimationGraphVariant pending edit is missing: ${asset.uuid}`);
        }
        this._assertSourceUnchanged(asset, pending, await this._querySourceMtime(asset.source));
        const currentDump = this._cloneDump(pending.dump);
        const graphChanged = dump.graphUuid !== currentDump.graphUuid;
        if (!graphChanged) {
            await this._assertGraphUnchanged(pending.graph);
        }
        const nextDump = await this._applyChange(currentDump, dump, pending.sourceOverrides);
        const graph = graphChanged ? await this._snapshotGraph(nextDump.graphUuid) : pending.graph;
        this._pendingEdits.set(asset.uuid, {
            ...pending,
            graph,
            dump: this._cloneDump(nextDump),
        });
        return nextDump;
    }
    async save(uuid) {
        const asset = this._queryTypedAsset(uuid, 'animation-graph-variant', 'cc.AnimationGraphVariant');
        const pending = this._pendingEdits.get(asset.uuid);
        if (!pending) {
            throw new Error(`AnimationGraphVariant pending edit is missing. Call query/change before save: ${asset.uuid}`);
        }
        this._assertSourceUnchanged(asset, pending, await this._querySourceMtime(asset.source));
        await this._assertGraphUnchanged(pending.graph);
        const ccAny = getCC();
        const { AnimationGraph } = getNewGenAnim();
        const variant = await this._loadAnimationGraphVariant(asset);
        const dump = this._cloneDump(pending.dump);
        if (dump.graphUuid) {
            this._queryTypedAsset(dump.graphUuid, 'animation-graph', 'cc.AnimationGraph');
            variant.original = this._createAssetReference(dump.graphUuid, AnimationGraph);
        }
        else {
            variant.original = null;
        }
        variant.clipOverrides.clear();
        for (const [originalUuid, substituteUuid] of Object.entries(dump.clips)) {
            if (!substituteUuid) {
                continue;
            }
            this._queryTypedAsset(originalUuid, 'animation-clip', 'cc.AnimationClip');
            this._queryTypedAsset(substituteUuid, 'animation-clip', 'cc.AnimationClip');
            const originalClip = this._createAssetReference(originalUuid, ccAny.AnimationClip);
            const substituteClip = this._createAssetReference(substituteUuid, ccAny.AnimationClip);
            variant.clipOverrides.set(originalClip, substituteClip);
        }
        const serialized = EditorExtends.serialize(variant);
        const content = typeof serialized === 'string'
            ? serialized
            : JSON.stringify(serialized, null, 2);
        await operation_1.default.saveAsset(asset.uuid, content);
        this._pendingEdits.delete(asset.uuid);
    }
    async _applyChange(currentDump, patch, sourceOverrides) {
        if (patch.graphUuid !== currentDump.graphUuid) {
            const graph = patch.graphUuid
                ? await this._loadAnimationGraphByUuid(patch.graphUuid)
                : null;
            return this._resetDump(patch.graphUuid, graph, sourceOverrides);
        }
        const clips = { ...currentDump.clips };
        for (const [originalUuid, substituteUuid] of Object.entries(patch.clips || {})) {
            clips[originalUuid] = substituteUuid;
        }
        return {
            graphUuid: currentDump.graphUuid,
            clips,
            invalids: { ...(currentDump.invalids || {}) },
        };
    }
    async _encodeVariant(variant, sourceOverrides) {
        const graphUuid = this._queryAssetUuid(variant.original);
        const graph = graphUuid ? await this._loadAnimationGraphByUuid(graphUuid) : null;
        return this._resetDump(graphUuid, graph, sourceOverrides);
    }
    _resetDump(graphUuid, graph, existingOverrides) {
        const clips = {};
        const invalids = {};
        if (graph) {
            const { visitAnimationClips } = getNewGenAnim();
            for (const clip of visitAnimationClips(graph)) {
                const clipUuid = this._queryAssetUuid(clip);
                if (clipUuid) {
                    clips[clipUuid] = '';
                }
            }
        }
        for (const [originalUuid, substituteUuid] of Object.entries(existingOverrides)) {
            if (clips[originalUuid] === undefined) {
                invalids[originalUuid] = substituteUuid;
            }
            else {
                clips[originalUuid] = substituteUuid;
            }
        }
        return {
            graphUuid,
            clips,
            invalids,
        };
    }
    _entryOverrides(variant) {
        const overrides = {};
        for (const entry of variant.clipOverrides) {
            const originalUuid = this._queryAssetUuid(entry.original);
            const substituteUuid = this._queryAssetUuid(entry.substitution);
            if (originalUuid && substituteUuid) {
                overrides[originalUuid] = substituteUuid;
            }
        }
        return overrides;
    }
    async _loadAnimationGraphVariant(asset) {
        const json = await this._readSerializedAsset(asset);
        const variant = this._deserializeWithAssetPlaceholders(json);
        const { AnimationGraphVariant } = getNewGenAnim();
        if (!(variant instanceof AnimationGraphVariant)) {
            throw new Error(`Asset is not an AnimationGraphVariant: ${asset.uuid}`);
        }
        return variant;
    }
    async _loadAnimationGraphByUuid(uuid) {
        const asset = this._queryTypedAsset(uuid, 'animation-graph', 'cc.AnimationGraph');
        const json = await this._readSerializedAsset(asset);
        const graph = this._deserializeWithAssetPlaceholders(json);
        const { AnimationGraph } = getNewGenAnim();
        if (!(graph instanceof AnimationGraph)) {
            throw new Error(`Asset is not an AnimationGraph: ${uuid}`);
        }
        return graph;
    }
    async _readSerializedAsset(asset) {
        const content = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error(`Invalid JSON in asset ${asset.uuid}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    _deserializeWithAssetPlaceholders(serialized) {
        const deserialize = getCC().deserialize;
        const details = new deserialize.Details();
        details.reset();
        const object = deserialize(serialized, details);
        details.assignAssetsBy((uuid, options) => (this._createAssetReference(uuid, options?.type)));
        return object;
    }
    _queryTypedAsset(uuidOrUrlOrPath, importer, type) {
        const asset = query_1.default.queryAsset(uuidOrUrlOrPath);
        if (!asset) {
            throw new Error(`Can not find asset: ${uuidOrUrlOrPath}`);
        }
        const assetImporter = asset.meta?.importer;
        const assetType = asset.type;
        if (assetImporter !== importer && assetType !== type) {
            throw new Error(`Expected ${type} asset, got importer ${assetImporter || 'unknown'} type ${assetType || 'unknown'}: ${uuidOrUrlOrPath}`);
        }
        return asset;
    }
    _queryAssetUuid(asset) {
        if (!asset) {
            return null;
        }
        const uuid = asset._uuid || asset.uuid;
        return typeof uuid === 'string' && uuid ? uuid : null;
    }
    _createAssetReference(uuid, type) {
        if (!uuid) {
            throw new Error('Asset UUID is required');
        }
        const reference = EditorExtends.serialize.asAsset(uuid, type || getCC().Asset);
        if (!reference) {
            throw new Error(`Can not create asset reference: ${uuid}`);
        }
        return reference;
    }
    async _querySourceMtime(source) {
        try {
            return (await (0, fs_extra_1.stat)(source)).mtimeMs;
        }
        catch {
            return null;
        }
    }
    async _snapshotGraph(uuid) {
        if (!uuid) {
            return null;
        }
        const asset = this._queryTypedAsset(uuid, 'animation-graph', 'cc.AnimationGraph');
        return {
            uuid: asset.uuid,
            source: asset.source,
            sourceMtimeMs: await this._querySourceMtime(asset.source),
            assetDbMtime: query_1.default.queryAssetMtime(asset.uuid),
        };
    }
    _assertSourceUnchanged(asset, pending, currentSourceMtimeMs) {
        const currentAssetDbMtime = query_1.default.queryAssetMtime(asset.uuid);
        if (pending.assetDbMtime !== null
            && currentAssetDbMtime !== null
            && pending.assetDbMtime !== currentAssetDbMtime) {
            throw new Error(`AnimationGraphVariant source changed after query: ${asset.uuid}`);
        }
        if (pending.sourceMtimeMs !== null
            && currentSourceMtimeMs !== null
            && pending.sourceMtimeMs !== currentSourceMtimeMs) {
            throw new Error(`AnimationGraphVariant source file changed after query: ${asset.source}`);
        }
    }
    async _assertGraphUnchanged(graph) {
        if (!graph) {
            return;
        }
        const currentAssetDbMtime = query_1.default.queryAssetMtime(graph.uuid);
        if (graph.assetDbMtime !== null
            && currentAssetDbMtime !== null
            && graph.assetDbMtime !== currentAssetDbMtime) {
            throw new Error(`AnimationGraph source changed after query: ${graph.uuid}`);
        }
        const currentSourceMtimeMs = await this._querySourceMtime(graph.source);
        if (graph.sourceMtimeMs !== null
            && currentSourceMtimeMs !== null
            && graph.sourceMtimeMs !== currentSourceMtimeMs) {
            throw new Error(`AnimationGraph source file changed after query: ${graph.source}`);
        }
    }
    _cloneDump(dump) {
        return {
            graphUuid: dump.graphUuid,
            clips: { ...dump.clips },
            invalids: dump.invalids ? { ...dump.invalids } : undefined,
        };
    }
}
const animationGraphVariant = new AnimationGraphVariantAssetService();
exports.default = animationGraphVariant;
