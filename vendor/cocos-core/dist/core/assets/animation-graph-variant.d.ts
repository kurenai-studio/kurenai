export interface AnimGraphVariantDump {
    graphUuid: string | null;
    clips: Record<string, string>;
    invalids?: Record<string, string>;
}
declare class AnimationGraphVariantAssetService {
    private _pendingEdits;
    query(uuid: string): Promise<AnimGraphVariantDump>;
    change(uuid: string, dump: AnimGraphVariantDump): Promise<AnimGraphVariantDump>;
    save(uuid: string): Promise<void>;
    private _applyChange;
    private _encodeVariant;
    private _resetDump;
    private _entryOverrides;
    private _loadAnimationGraphVariant;
    private _loadAnimationGraphByUuid;
    private _readSerializedAsset;
    private _deserializeWithAssetPlaceholders;
    private _queryTypedAsset;
    private _queryAssetUuid;
    private _createAssetReference;
    private _querySourceMtime;
    private _snapshotGraph;
    private _assertSourceUnchanged;
    private _assertGraphUnchanged;
    private _cloneDump;
}
declare const animationGraphVariant: AnimationGraphVariantAssetService;
export default animationGraphVariant;
