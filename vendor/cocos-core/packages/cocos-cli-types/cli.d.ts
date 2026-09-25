import type { Component } from 'cc';
import type { Node as Node_2 } from 'cc';
import type { Scene } from 'cc';
import type { Terrain } from 'cc';
import type { Vec3 as Vec3_2 } from 'cc';

/** 动画剪辑资源的 userData */
export declare interface AnimationClipAssetUserData {
    /** 动画名称 */
    name: string;
}

/** 当前编辑器类型。 */
export declare type AnimationEditorType = 'scene' | 'prefab' | 'unknown';

export declare interface AnimationImportSetting {
    /**
     * glTf 中原始动画资源的名称。
     */
    name: string;

    /**
     * 原始动画的长度，单位为秒。
     */
    duration: number;

    /**
     * 用户查看、切割原始动画时的 FPS 设定。
     */
    fps: number;

    /**
     * 对原始动画的划分，由用户配置。
     * 若此资源存在，所有划分出的动画成为 glTf 资源下的独立动画并将被导出；
     * 否则，直接导入原始动画资源。
     */
    splits: Array<{
        /**
         * 以前的 ID。如果存在，优先使用这个 ID 来创建子资源，以防止改名后 UUID 变化。
         */
        previousId?: string;

        /**
         * 划分出的动画的名称。
         */
        name: string;

        /**
         * 划分的起始时刻，单位为秒。
         */
        from: number;

        /**
         * 划分的终止时刻，单位为秒。
         */
        to: number;

        /**
         * 用户查看划分出的子动画时的 FPS 设定。
         */
        fps?: number;

        /**
         * 速度。
         */
        speed?: number;

        /**
         * 动画循环模式。
         */
        wrapMode?: number;

        /**
         * 额外的动画辅助曲线信息。
         */
        auxiliaryCurves?: Record<
        string,
            {
            /**
             * 序列化后的曲线。
             */
            curve: unknown;
        }
        >;

        /**
         * 加性动画导入设置。
         */
        additive?: {
            /**
             * 是否将动画导入为加性动画。
             */
            enabled: boolean;

            /**
             * 参考动画。
             * 若设置，将参考该动画第 0 帧的姿势计算加性动画；
             * 否则，则将参考第动画本身第 0 帧的姿势进行计算。
             */
            refClip?: string;
        };
    }>;
}

/** 动画编辑器当前所处的场景模式。 */
export declare type AnimationMode = 'general' | 'prefab' | 'animation' | 'preview' | 'unknown';

/** changePlayState 支持的播放控制操作。 */
export declare type AnimationPlayOperation = 'play' | 'pause' | 'resume' | 'stop';

/** 当前 clip 的播放状态。 */
export declare type AnimationPlayState_2 = 'stop' | 'playing' | 'pause';

/** 所有资源处理器类型的常量数组（用于 Zod enum 和 TypeScript type） */
export declare const ASSET_HANDLER_TYPES: readonly ["directory", "unknown", "text", "json", "spine-data", "dragonbones", "dragonbones-atlas", "terrain", "javascript", "typescript", "scene", "prefab", "sprite-frame", "tiled-map", "buffer", "image", "sign-image", "alpha-image", "texture", "texture-cube", "erp-texture-cube", "render-texture", "texture-cube-face", "rt-sprite-frame", "gltf", "gltf-mesh", "gltf-animation", "gltf-skeleton", "gltf-material", "gltf-scene", "gltf-embeded-image", "fbx", "material", "physics-material", "effect", "effect-header", "audio-clip", "animation-clip", "animation-graph", "animation-graph-variant", "animation-mask", "ttf-font", "bitmap-font", "particle", "sprite-atlas", "auto-atlas", "label-atlas", "render-pipeline", "render-stage", "render-flow", "instantiation-material", "instantiation-mesh", "instantiation-skeleton", "instantiation-animation", "video-clip", "*", "database"];

/** Asset handler types include built-in values and extension-registered importer names. */
export declare type AssetHandlerType =
| typeof ASSET_HANDLER_TYPES[number]
| (string & {});

export declare interface AssetUserDataMap {
    'animation-clip': AnimationClipAssetUserData;
    'auto-atlas': AutoAtlasAssetUserData;
    'label-atlas': LabelAtlasAssetUserData;
    'render-texture': RenderTextureAssetUserData;
    'directory': DirectoryAssetUserData;
    'texture-cube': TextureCubeAssetUserData;
    'erp-texture-cube': TextureCubeAssetUserData;
    'image': ImageAssetUserData;
    'sprite-frame': SpriteFrameAssetUserData;
    'texture': Texture2DAssetUserData;
    'spine-data': SpineAssetUserData;
    'javascript': JavaScriptAssetUserData;
    'gltf-animation': GltfAnimationAssetUserData;
    'particle': ParticleAssetUserData;
    'json': JsonAssetUserData;
    'prefab': PrefabAssetUserData;
    'scene': PrefabAssetUserData;
    'effect': EffectAssetUserData;
    'audio-clip': AudioClipAssetUserData;
    'bitmap-font': BitmapFontAssetUserData;
    'gltf-skeleton': GltfSkeletonAssetUserData;
    'gltf-embeded-image': GltfEmbededImageAssetUserData;
    'gltf-mesh': IVirtualAssetUserData;
    'gltf-material': IVirtualAssetUserData;
    'gltf-scene': IVirtualAssetUserData;
    'gltf': GlTFUserData;
    'fbx': GlTFUserData;
    'sprite-atlas': SpriteAtlasAssetUserData;
    'rt-sprite-frame': RtSpriteFrameAssetUserData;
    'sign-image': ImageAssetUserData;
    'alpha-image': ImageAssetUserData;

    // 无特定 userData 的资源类型（仅保留 unknown）
    'unknown': any;
}

/** 音频资源的 userData */
export declare interface AudioClipAssetUserData {
    /** 下载模式：0-Web Audio, 1-DOM Audio */
    downloadMode: number;
}

/** 自动图集资源的 userData */
export declare interface AutoAtlasAssetUserData {
    compressed: boolean;
    dest: any;
    /** 打包图像的尺寸 */
    maxWidth: number;
    maxHeight: number;
    /** 图像的边距 */
    padding: number;
    allowRotation: boolean;
    forceSquared: boolean;
    powerOfTwo: boolean;
    algorithm: string;
    format: string;
    quality: number;
    contourBleed: boolean;
    paddingBleed: boolean;
    filterUnused: boolean;
    removeTextureInBundle: boolean;
    removeImageInBundle: boolean;
    removeSpriteAtlasInBundle: boolean;
    platformSettings: any;
    textureSetting: any;
}

/** 位图字体资源的 userData */
export declare interface BitmapFontAssetUserData {
    /** 字体配置 */
    _fntConfig: any;
    /** 字体大小 */
    fontSize: number;
    /** 纹理 UUID */
    textureUuid: string;
}

/**
 * 创建类型
 */
export declare const CREATE_TYPES: readonly ["scene", "prefab"];

/** 文件夹资源的 userData */
export declare interface DirectoryAssetUserData {
    /** 是否是资源包 */
    isBundle?: boolean;
    /** 资源包配置 ID */
    bundleConfigID?: string;
    /** 资源包名称 */
    bundleName?: string;
    /** 优先级 */
    priority?: number;
}

/** Effect 着色器资源的 userData */
export declare interface EffectAssetUserData {
    /** 预编译组合 */
    combinations?: any;
    /** 编辑器相关数据 */
    editor?: any;
}

export declare type Filter = 'none' | 'nearest' | 'linear';

export declare interface FntData {
    commonHeight?: number;
    fontSize?: number;
    atlasName?: string;
    fontDefDictionary?: FontDefDictionary;
    kerningDict?: KerningDict;
}

export declare interface FontDef {
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    xOffset: number;
    yOffset: number;
    xAdvance: number;
}

export declare interface FontDefDictionary {
    [charId: number]: FontDef;
}

/**
 * 全局事件管理器
 * 统一管理所有服务的事件监听，支持类型安全的事件订阅
 */
export declare class GlobalEventManager {
    /**
     * 监听指定类型的事件（类型安全版本）
     * @param event 事件名称
     * @param listener 事件监听器
     */
    on<TEvents extends Record<string, any>>(event: keyof TEvents, listener: TEvents[keyof TEvents] extends void ? () => void : (payload: TEvents[keyof TEvents]) => void): void;
    /**
     * 监听指定类型的事件（通用版本）
     * @param event 事件名称
     * @param listener 事件监听器
     */
    on(event: string, listener: (...args: any[]) => void): void;
    /**
     * 监听指定类型的事件（一次性，类型安全版本）
     * @param event 事件名称
     * @param listener 事件监听器
     */
    once<TEvents extends Record<string, any>>(event: keyof TEvents, listener: TEvents[keyof TEvents] extends void ? () => void : (payload: TEvents[keyof TEvents]) => void): void;
    /**
     * 监听指定类型的事件（一次性，通用版本）
     * @param event 事件名称
     * @param listener 事件监听器
     */
    once(event: string, listener: (...args: any[]) => void): void;
    /**
     * 移除指定类型的事件监听器（类型安全版本）
     * @param event 事件名称
     * @param listener 事件监听器
     */
    off<TEvents extends Record<string, any>>(event: keyof TEvents, listener: TEvents[keyof TEvents] extends void ? () => void : (payload: TEvents[keyof TEvents]) => void): void;
    /**
     * 移除事件监听器（通用版本）
     * @param event 事件名称
     * @param listener 事件监听器
     */
    off(event: string, listener: (...args: any[]) => void): void;
    /**
     * 发射指定类型的事件（类型安全版本）
     * @param event 事件名称
     * @param args 事件参数
     */
    emit<TEvents extends Record<string, any>>(event: keyof TEvents, ...args: TEvents[keyof TEvents]): void;
    /**
     * 触发事件（通用版本）
     * @param event 事件名称
     * @param args 事件参数
     */
    emit(event: string, ...args: any[]): void;
    /**
     * 跨进程广播，传的参数需要能被序列化
     * @param event 事件名称
     * @param args 事件参数
     */
    broadcast<TEvents extends Record<string, any>>(event: keyof TEvents, ...args: TEvents[keyof TEvents]): void;
    broadcast(event: string, ...args: any[]): void;
    /**
     * 清除事件监听器
     * @param event 事件名称，如果不提供则清除所有
     */
    clear(event?: string): void;
}

/** glTF 动画资源的 userData */
export declare interface GltfAnimationAssetUserData {
    gltfIndex: number;
    events: Array<{
        frame: number;
        func: string;
        params: string[];
    }>;
    editorExtras?: unknown;
    embeddedPlayers?: Array<{
        editorExtras?: unknown;
        begin: number;
        end: number;
        reconciledSpeed: boolean;
        playable:
        | {
            type: 'animation-clip';
            path: string;
            clip: string;
        }
        | {
            type: 'particle-system';
            path: string;
        };
    }>;
    auxiliaryCurves?: Record<string, { curve: any }>;
    wrapMode: number;
    speed?: number;
    sample?: number;
    span?: {
        from: number;
        to: number;
    };
    additive?: any;
}

/** glTF 嵌入图片子资源的 userData */
export declare interface GltfEmbededImageAssetUserData extends IVirtualAssetUserData {
    /** 是否修复 Alpha 透明度瑕疵 */
    fixAlphaTransparencyArtifacts?: boolean;
}

export declare type GltfpackOptions = Record<string, any>;

/** glTF Skeleton 子资源的 userData */
export declare interface GltfSkeletonAssetUserData extends IVirtualAssetUserData {
    /** 骨骼数量 */
    jointsLength?: number;
}

export declare interface GlTFUserData {
    assetFinder?: SerializedAssetFinder;

    imageMetas: ImageMeta[];

    // Normal import settings
    // @default required
    normals?: NormalImportSetting;

    // Tangent import settings;
    // @default required
    tangents?: TangentImportSetting;

    /**
     * Controls how to import morph normals.
     * @default Exclude.
     */
    morphNormals?: NormalImportSetting.exclude | NormalImportSetting.optional;

    // Whether to extract material assets out of embedded (sub)assets,
    // so that the assets become editable.
    // @default false
    dumpMaterials?: boolean;

    // only for chat avatar
    redirectMaterialMap?: Record<string, string>;

    // The directory to dump the materials.
    // Default to a direct sub-folder prefixed with 'Materials_' under current path.
    materialDumpDir?: string;

    /**
     * Whether to use vertex colors(if valid) in material.
     * @default false
     */
    useVertexColors?: boolean;

    /**
     * Whether to enable depth-write if the material specify the `BLEND` mode.
     * See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#alpha-coverage
     * @default false
     */
    depthWriteInAlphaModeBlend?: boolean;

    // @default true
    skipValidation?: boolean;

    /**
     * 整个数组由导入器创建。`name` 和 `duration` 也都由导入器写入修改，外部不允许修改。
     * `splits` 是允许用户配置的。
     */
    animationImportSettings?: AnimationImportSetting[];

    /**
     * 是否将所有动画挂载到生成的预制体上。
     * @default false
     */
    mountAllAnimationsOnPrefab?: boolean;

    /**
     * 使用旧的 FBX 导入器。（在非 FBX 导入器上是 `undefined`）
     */
    legacyFbxImporter?: boolean;

    /**
     * 禁用 Mesh 分割，默认勾选
     */
    disableMeshSplit?: boolean;

    /**
     * 允许数据访问。
     */
    allowMeshDataAccess?: boolean;

    /**
     * 是否添加填充顶点色
     * @default false
     */
    addVertexColor?: boolean;

    /**
     * 若开启并且模型场景顶部仅有一个节点，那么以该节点作为根节点转换为 Prefab。
     * 否则，以场景为根节点转换为 Prefab。见 cocos/cocos-engine#11858 。
     */
    promoteSingleRootNode?: boolean;
    /*
    * 若开启则自动生成 Lightmap UV，并将 UV 写入第二个通道（若第二个通道有 UV ， 则该 UV 会被覆盖）
    * 否则，使用默认 UV 。
    */
    generateLightmapUVNode?: boolean;

    /**
     * 关于 FBX 的配置。仅当 `legacyFbxImporter === false` 时有效。
     */
    fbx?: IFbxSetting;

    /**
     * 减面配置
     */
    meshOptimizer?: MeshOptimizerOption;

    /**
     * mesh 优化配置
     */
    meshOptimize?: MeshOptimizeOptions;

    /**
     * 是否开启 mesh 减面
     */
    meshSimplify?: MeshSimplifyOptions;

    /**
     * MeshCluster Options
     */
    meshCluster?: MeshClusterOptions;

    /**
     * Mesh compression options
     */
    meshCompress?: MeshCompressOptions;

    lods?: {
        // 是否开启 LODS
        enable: boolean;
        // fbx 是否自带 LOD
        hasBuiltinLOD: boolean;
        // fbx 各层级 lod 的配置
        options: LODsOption[];
    };
}

/**
 * 添加/创建组件的选项
 */
export declare interface IAddComponentOptions {
    nodePath: string;
    component: string;
}

/**
 * 辅助曲线 dump。
 */
export declare interface IAnimationAuxiliaryCurveDump {
    keyframes: IAnimationAuxiliaryKeyDump[];
    preExtrap: number;
    postExtrap: number;
}

/**
 * 辅助曲线关键帧。frame 使用采样帧号，value 当前为 RealCurve 数值。
 */
export declare interface IAnimationAuxiliaryKeyDump extends IAnimationCurveKeyData {
    frame: number;
    value: number;
}

/**
 * queryClip 返回的完整 clip 编辑数据。
 */
export declare interface IAnimationClipDump {
    name: string;
    /** clip 时长，单位为秒。 */
    duration: number;
    /** 每秒采样帧数。 */
    sample: number;
    /** 播放速度倍率。 */
    speed: number;
    /** Cocos AnimationClip.wrapMode 数值。 */
    wrapMode: number;
    /** 普通属性曲线。 */
    curves: IAnimationCurveDump[];
    /** 动画事件，frame 使用采样帧号。 */
    events: IAnimationEventDump[];
    /** Embedded player 列表，begin/end 使用采样帧号。 */
    embeddedPlayers: IAnimationEmbeddedPlayerDump[];
    /** Embedded player 分组轨道。 */
    embeddedPlayerGroups: IAnimationEmbeddedPlayerGroup[];
    /** 辅助曲线，以曲线名索引。 */
    auxiliaryCurves: Record<string, IAnimationAuxiliaryCurveDump>;
    /** 当前编辑时间，单位为秒。 */
    time: number;
    /** 当前 clip 是否被锁定。 */
    isLock: boolean;
    /** 是否来自骨骼动画资源。 */
    isSkeleton: boolean;
    /** 当前骨骼动画是否使用 baked animation。 */
    useBakedAnimation: boolean;
}

/**
 * 动画 root 上可编辑的 clip 菜单项。
 */
export declare interface IAnimationClipMenuItem {
    uuid: string;
    name: string;
}

/**
 * 动画 root 和 clip 列表信息。
 */
export declare interface IAnimationClipsInfo extends IAnimationRootResult {
    clipsMenu: IAnimationClipMenuItem[];
    /** 默认或当前可编辑 clip uuid。 */
    defaultClip: string;
}

/**
 * 分量曲线 dump。用于表达 Vec/Color/Size 等复合属性的真实 per-channel keyframe。
 */
export declare interface IAnimationCurveChannelDump {
    /** 分量 key，例如 `x`、`y`、`z`、`r`、`width`。 */
    key: string;
    displayName?: string;
    type?: IAnimationPropertyType;
    keyframes: IAnimationCurveKeyDump[];
}

/**
 * queryClip 返回的普通属性曲线 dump。
 */
export declare interface IAnimationCurveDump {
    /** 相对动画 root 的节点路径。 */
    nodePath: string;
    /** 属性 key，例如 `position` 或 `cc.Sprite.color`。 */
    key: string;
    /** 曲线关键帧；没有可编辑关键帧时可能为 null。 */
    keyframes: IAnimationCurveKeyDump[] | null;
    /** 复合属性的真实分量曲线；旧 UI 可继续使用上面的聚合 keyframes。 */
    channels?: IAnimationCurveChannelDump[];
    category?: string;
    type?: IAnimationPropertyType;
    displayName?: string;
    name?: string;
    comp?: string;
    menuName?: string;
    preExtrap?: number;
    postExtrap?: number;
    isCurveSupport?: boolean;
    parentPropKey?: string;
    partKeys?: string[];
}

/**
 * 曲线关键帧的插值和切线信息。
 */
export declare interface IAnimationCurveKeyData {
    inTangent?: number;
    inTangentWeight?: number;
    outTangent?: number;
    outTangentWeight?: number;
    interpMode?: number;
    tangentWeightMode?: number;
    tangentMode?: number;
    easingMethod?: number;
    broken?: boolean;
}

/**
 * 普通属性曲线中的关键帧。frame 使用 clip 的采样帧号，不是秒。
 */
export declare interface IAnimationCurveKeyDump extends IAnimationCurveKeyData {
    frame: number;
    dump: IAnimationKeyValueDump;
    imgUrl?: string;
}

/**
 * 切换当前动画编辑 clip。
 */
export declare interface IAnimationEditClipOptions {
    /** 要切换到的 clip uuid，必须属于当前动画 root。 */
    clipUuid: string;
}

/**
 * Embedded player 中可播放的资源引用。
 */
export declare type IAnimationEmbeddedPlayable = {
    type: 'animation-clip';
    clip?: string;
    path?: string;
} | {
    type: 'particle-system';
    path?: string;
};

/**
 * Embedded player dump。begin/end 使用采样帧号，不是秒。
 */
export declare interface IAnimationEmbeddedPlayerDump {
    begin: number;
    end: number;
    reconciledSpeed: boolean;
    playable?: IAnimationEmbeddedPlayable;
    group: string;
    displayName?: string;
}

/**
 * Embedded player 分组轨道。
 */
export declare interface IAnimationEmbeddedPlayerGroup {
    key: string;
    name: string;
    type: string;
}

/**
 * 进入动画编辑 session。
 */
export declare interface IAnimationEnterOptions {
    /** 动画 root 节点路径。未传时从当前选择推导。 */
    rootPath?: string;
    /** 动画 root 节点 uuid。 */
    rootUuid?: string;
    /** 要编辑的 clip uuid。未传时使用 root 上的默认 clip。 */
    clipUuid?: string;
    /** 退出时是否恢复进入前的 selection，默认 true。 */
    restoreSelectionOnExit?: boolean;
}

/**
 * 动画事件。frame 使用采样帧号；保存骨骼 meta 时会按引擎格式写回。
 */
export declare interface IAnimationEventDump {
    frame: number;
    func: string;
    params: IAnimationValue[];
}

/**
 * 退出动画编辑 session。
 */
export declare interface IAnimationExitOptions {
    /** 退出前是否保存当前 clip。 */
    save?: boolean;
    /** 是否恢复进入前的 selection，默认使用 enter 时的 restoreSelectionOnExit。 */
    restoreSelection?: boolean;
    /** 是否恢复进入动画编辑前采样过的场景状态，默认 true。 */
    restoreSampledSceneState?: boolean;
}

/**
 * 曲线关键帧的属性值 dump。
 */
export declare interface IAnimationKeyValueDump {
    value: IAnimationValue;
    default?: IAnimationValue;
    extends?: string[];
    readonly?: boolean;
    type?: string;
    visible?: boolean;
}

/**
 * applyOperations 使用的 typed operation。
 *
 * 所有 operation 都必须携带当前编辑的 clipUuid；clipUuid 不匹配时会返回 failure。
 * frame、frames、offset、dstFrame 都使用采样帧号；setTime/queryTime 的 time 才使用秒。
 * 支持的类型分为 clip 基础属性、普通属性曲线、事件、embedded player 和辅助曲线五类。
 *
 * @example
 * ```ts
 * await service.applyOperations({
 *   operations: [
 *     { type: 'changeSample', clipUuid, sample: 60 },
 *     { type: 'addEvent', clipUuid, frame: 30, func: 'onHalf', params: ['value'] },
 *   ],
 * });
 * ```
 *
 * @example
 * ```ts
 * await service.applyOperations({
 *   operations: [
 *     { type: 'addEmbeddedPlayerGroup', clipUuid, group: { key: 'fx', name: 'FX', type: 'particle-system' } },
 *     { type: 'addAuxiliaryCurve', clipUuid, name: 'BlendWeight' },
 *     { type: 'createAuxKey', clipUuid, name: 'BlendWeight', frame: 0, value: 1 },
 *   ],
 * });
 * ```
 */
export declare type IAnimationOperation = {
    type: 'changeSample';
    clipUuid: string;
    sample: number;
} | {
    type: 'changeSpeed';
    clipUuid: string;
    speed: number;
} | {
    type: 'changeWrapMode';
    clipUuid: string;
    wrapMode: number;
} | {
    type: 'addPropertyCurve';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    value?: IAnimationValue;
} | {
    type: 'createPropertyKey';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frame: number;
    value?: IAnimationValue;
    channel?: string;
    keyData?: IAnimationCurveKeyData;
    curveData?: IAnimationCurveKeyData;
} | {
    type: 'updatePropertyKey';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frame: number;
    value?: IAnimationValue;
    channel?: string;
    keyData?: IAnimationCurveKeyData;
    curveData?: IAnimationCurveKeyData;
} | {
    type: 'updatePropertyKeyData';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frame: number;
    channel?: string;
    keyData?: IAnimationCurveKeyData;
    curveData?: IAnimationCurveKeyData;
} | {
    type: 'removePropertyCurve';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
} | {
    type: 'removePropertyKey';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frames: number[];
    channel?: string;
} | {
    type: 'removePropertyKeys';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frames: number[];
    channel?: string;
} | {
    type: 'movePropertyKeys';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frames: number[];
    offset: number;
    channel?: string;
} | {
    type: 'copyPropertyKeysTo';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    frames: number[];
    dstFrame: number;
    channel?: string;
} | {
    type: 'setPropertyCurveExtrapolation';
    clipUuid: string;
    nodePath?: string;
    nodeUuid?: string;
    propKey: string;
    preExtrap?: number;
    postExtrap?: number;
} | {
    type: 'addEvent';
    clipUuid: string;
    frame: number;
    func: string;
    params?: IAnimationValue[];
} | {
    type: 'deleteEvent';
    clipUuid: string;
    frames: number[];
} | {
    type: 'updateEvent';
    clipUuid: string;
    frames: number[];
    events: IAnimationEventDump[];
} | {
    type: 'moveEvents';
    clipUuid: string;
    frames: number[];
    offset: number;
} | {
    type: 'copyEventsTo';
    clipUuid: string;
    frames: number[];
    dstFrame: number;
} | {
    type: 'addEmbeddedPlayer';
    clipUuid: string;
    embeddedPlayer: IAnimationEmbeddedPlayerDump;
} | {
    type: 'deleteEmbeddedPlayer';
    clipUuid: string;
    embeddedPlayer: IAnimationEmbeddedPlayerDump;
} | {
    type: 'updateEmbeddedPlayer';
    clipUuid: string;
    embeddedPlayer: IAnimationEmbeddedPlayerDump;
    newEmbeddedPlayer: IAnimationEmbeddedPlayerDump;
} | {
    type: 'clearEmbeddedPlayer';
    clipUuid: string;
    group?: string;
} | {
    type: 'addEmbeddedPlayerGroup';
    clipUuid: string;
    group: IAnimationEmbeddedPlayerGroup;
} | {
    type: 'removeEmbeddedPlayerGroup';
    clipUuid: string;
    key: string;
} | {
    type: 'clearEmbeddedPlayerGroup';
    clipUuid: string;
    key: string;
} | {
    type: 'addAuxiliaryCurve';
    clipUuid: string;
    name: string;
} | {
    type: 'removeAuxiliaryCurve';
    clipUuid: string;
    name: string;
} | {
    type: 'renameAuxiliaryCurve';
    clipUuid: string;
    name: string;
    newName: string;
} | {
    type: 'createAuxKey';
    clipUuid: string;
    name: string;
    frame: number;
    value: number;
    keyData?: IAnimationCurveKeyData;
    curveData?: IAnimationCurveKeyData;
} | {
    type: 'removeAuxKey';
    clipUuid: string;
    name: string;
    frame: number;
} | {
    type: 'moveAuxKeys';
    clipUuid: string;
    name: string;
    frames: number[];
    offset: number;
} | {
    type: 'copyAuxKey';
    clipUuid: string;
    name: string;
    frame: number;
    dstFrame: number;
} | {
    type: 'updateAuxKeyData';
    clipUuid: string;
    name: string;
    frame: number;
    keyData?: IAnimationCurveKeyData;
    curveData?: IAnimationCurveKeyData;
};

/**
 * 批量执行动画编辑操作。
 */
export declare interface IAnimationOperationOptions {
    /** 按顺序执行；任一操作失败时停止并返回 failure。 */
    operations: IAnimationOperation[];
    /** 是否记录 undo/dirty；默认 true，显式传 false 时仅修改当前 clip，不写入 undo 栈。 */
    recordUndo?: boolean;
    /** 明确消费外部属性 commit 时，将紧邻的 scene 属性 undo 合并进本次 animation undo。 */
    absorbPreviousScenePropertyUndo?: boolean;
}

/**
 * applyOperations 的执行结果。
 */
export declare interface IAnimationOperationResult {
    state: 'success' | 'failure';
    result: boolean;
    /** 成功操作是否创建了 animation scoped Undo 历史；失败时省略。 */
    undoRecorded?: boolean;
    reason?: string;
}

/**
 * 控制当前 clip 播放状态。
 */
export declare interface IAnimationPlayStateOptions {
    /** 播放控制操作。 */
    operate: AnimationPlayOperation;
    /** clip uuid；未传时使用当前 session 的编辑 clip。 */
    clipUuid?: string;
}

/**
 * 可创建或编辑动画曲线的属性信息。
 */
export declare interface IAnimationPropertyInfo {
    name: string;
    key: string;
    displayName: string;
    type: IAnimationPropertyType;
    menuName: string;
    comp?: string;
    category?: string;
}

/**
 * 可编辑属性的类型描述，value 为 Cocos 类型名，例如 `cc.Vec3`、`cc.Boolean`。
 */
export declare interface IAnimationPropertyType {
    value: string;
    extends?: string[];
    enumList?: Array<{
        name: string;
        value: number;
    }>;
}

/**
 * 查询辅助曲线在某一帧的采样值。
 */
export declare interface IAnimationQueryAuxiliaryCurveValueAtFrameOptions {
    /** clip uuid；必须是当前编辑 clip。 */
    clipUuid?: string;
    /** 辅助曲线名称。 */
    name: string;
    /** 要采样的帧号，不是秒。 */
    frame: number;
}

/**
 * 查询 clip dump。
 */
export declare interface IAnimationQueryClipOptions extends IAnimationTargetOptions {
    /** clip uuid；未传时使用当前 session 或 root 的默认 clip。 */
    clipUuid?: string;
}

/**
 * 查询某一帧的属性采样值。
 */
export declare interface IAnimationQueryPropertyValueAtFrameOptions {
    /** clip uuid；必须是当前编辑 clip。 */
    clipUuid?: string;
    /** 目标节点路径；未传时使用当前动画 root。 */
    nodePath?: string;
    /** 目标节点 uuid。 */
    nodeUuid?: string;
    /** 属性 key，例如 `position` 或 `cc.Label.string`。 */
    propKey: string;
    /** 要采样的帧号，不是秒。 */
    frame: number;
}

/**
 * 打开动画编辑器需要的一次性 root 信息。
 */
export declare interface IAnimationRootInfo extends IAnimationClipsInfo {
    /** 动画 root 的节点树 dump，对齐 Node service queryNodeTree 返回结构。 */
    nodeTreeDump: INodeTreeItem | null;
    /** 默认或当前可编辑 clip 的 dump。 */
    clipDump: IAnimationClipDump | null;
    /** 当前编辑时间，单位为秒。 */
    time: number;
    /** 当前播放状态。 */
    state: AnimationPlayState_2;
    /** 当前动画 root 是否使用 baked animation。 */
    useBakedAnimation: boolean;
}

/**
 * 动画 root 查询结果。
 */
export declare interface IAnimationRootResult {
    rootUuid: string;
    rootPath: string;
}

export declare interface IAnimationSaveOptions {
    /**
     * 保存 clip 成功后同步保存当前 scene/prefab 资源，并用普通 editor save 语义清理 shared undo dirty。
     */
    saveScene?: boolean;
    /**
     * 将当前 clip 内容保存到指定的新资源路径，不保存宿主 scene。
     */
    target?: string;
}

/**
 * Scene-process 内部 Animation service。
 *
 * 这个服务只在 scene-process 暴露，不走 MCP/API/main-process proxy。
 * 调用顺序通常是：enter -> queryClip/queryProperties -> setTime/applyOperations -> save -> exit。
 */
export declare interface IAnimationService extends IServiceEvents {
    /**
     * 进入动画编辑 session，并采样到 0 秒。
     */
    enter(options: IAnimationEnterOptions): Promise<IAnimationStateInfo>;
    /**
     * 退出动画编辑 session，可选择保存并恢复进入前的场景采样状态。
     */
    exit(options: IAnimationExitOptions): Promise<IAnimationStateInfo>;
    /**
     * 查询当前动画编辑 session 状态；未进入 session 时 active 为 false。
     */
    queryState(): Promise<IAnimationStateInfo>;
    /**
     * 查询目标节点所属的动画 root。
     */
    queryRoot(options: IAnimationTargetOptions): Promise<IAnimationRootResult>;
    /**
     * 查询动画 root、节点树、默认 clip dump、时间和播放状态。
     */
    queryRootInfo(options: IAnimationTargetOptions): Promise<IAnimationRootInfo>;
    /**
     * 查询指定 clip 的编辑 dump。
     */
    queryClip(options: IAnimationQueryClipOptions): Promise<IAnimationClipDump>;
    /**
     * 查询动画 root 上的可编辑 clip 列表。
     */
    queryClips(options: IAnimationTargetOptions): Promise<IAnimationClipsInfo>;
    /**
     * 查询目标节点上可创建动画曲线的属性。
     */
    queryProperties(options: IAnimationTargetOptions): Promise<IAnimationPropertyInfo[]>;
    /**
     * 查询当前编辑时间，单位为秒。
     */
    queryTime(options: IAnimationTimeOptions): Promise<number>;
    /**
     * 在指定帧采样属性值；采样后会恢复原编辑时间。
     */
    queryPropertyValueAtFrame(options: IAnimationQueryPropertyValueAtFrameOptions): Promise<IAnimationValue>;
    /**
     * 在指定帧采样辅助曲线值。
     */
    queryAuxiliaryCurveValueAtFrame(options: IAnimationQueryAuxiliaryCurveValueAtFrameOptions): Promise<IAnimationKeyValueDump | null>;
    /**
     * 设置当前编辑时间并采样场景，time 单位为秒。
     */
    setTime(options: IAnimationSetTimeOptions): Promise<boolean>;
    /**
     * 控制当前 clip 播放状态。
     */
    changePlayState(options: IAnimationPlayStateOptions): Promise<boolean>;
    /**
     * 切换当前编辑 clip，并重置编辑时间到 0 秒。
     */
    changeEditClip(options: IAnimationEditClipOptions): Promise<boolean>;
    /**
     * 批量执行 typed animation operation。
     */
    applyOperations(options: IAnimationOperationOptions): Promise<IAnimationOperationResult>;
    /**
     * 保存当前编辑 clip。普通 .anim 写 asset；骨骼动画写回 asset meta。saveScene 为 true 时同步保存当前 scene/prefab。
     */
    save(options?: IAnimationSaveOptions): Promise<boolean>;
}

/**
 * 设置当前编辑时间。
 */
export declare interface IAnimationSetTimeOptions {
    /** 编辑时间，单位为秒。 */
    time: number;
}

/**
 * 当前动画编辑 session 状态。
 */
export declare interface IAnimationStateInfo {
    /** 是否已经进入动画编辑 session。 */
    active: boolean;
    /** 当前编辑器类型。 */
    editorType: AnimationEditorType;
    /** 当前场景模式。 */
    mode: AnimationMode;
    /** 当前动画 root uuid；未进入 session 时为空字符串。 */
    rootUuid: string;
    /** 当前动画 root path；未进入 session 时为空字符串。 */
    rootPath: string;
    /** 当前编辑 clip uuid；未进入 session 时为空字符串。 */
    clipUuid: string;
    /** 当前编辑时间，单位为秒。 */
    time: number;
    /** 当前播放状态。 */
    playState: AnimationPlayState_2;
    /** 当前 animation authoring session 相对进入/保存 baseline 是否有未保存修改。 */
    dirty: boolean;
    /** 当前 Scene 相对进入/保存 baseline 是否有未保存修改；不包含当前 Animation scope。 */
    sceneDirty: boolean;
    /** 当前 selection paths。 */
    selection: string[];
    /** 退出 session 时默认是否恢复进入前的 selection。 */
    restoreSelectionOnExit: boolean;
}

/**
 * 定位动画目标节点。
 * 传 rootPath/rootUuid 时直接使用该节点；传 nodePath/nodeUuid 时会向上查找最近的动画 root。
 */
export declare interface IAnimationTargetOptions {
    /** 目标节点路径。 */
    nodePath?: string;
    /** 目标节点 uuid。 */
    nodeUuid?: string;
    /** 动画 root 节点路径。 */
    rootPath?: string;
    /** 动画 root 节点 uuid。 */
    rootUuid?: string;
}

/**
 * 查询当前编辑时间时的 clip 选择。
 */
export declare interface IAnimationTimeOptions {
    /** clip uuid；未传时使用当前 session 的编辑 clip。 */
    clipUuid?: string;
}

/**
 * Animation API 中可通过 RPC 传递的值。
 * 用于事件参数、关键帧值、属性采样值等不固定结构的数据。
 */
export declare type IAnimationValue = string | number | boolean | null | undefined | IAnimationValue[] | {
    [key: string]: IAnimationValue;
};

export declare interface IApplyPrefabChangesParams {
    nodePath: string;
}

export declare interface IAssetInfo {
    name: string; // 资源名字
    source: string; // url 地址
    loadUrl: string; // loader 加载的层级地址
    url: string; // loader 加载地址会去掉扩展名，这个参数不去掉
    file: string; // 绝对路径
    uuid: string; // 资源的唯一 ID
    importer: AssetHandlerType; // 使用的导入器名字
    imported: boolean; // 是否结束导入过程
    invalid: boolean; // 是否导入成功
    type: IAssetType; // 类型
    isDirectory: boolean; // 是否是文件夹
    library: { [key: string]: string }; // 导入资源的 map

    // dataKeys 作用范围
    isBundle?: boolean; // 是否是文件夹
    displayName?: string; // 资源用于显示的名字
    readonly?: boolean; // 是否只读
    visible?: boolean; // 是否显示
    subAssets?: { [key: string]: IAssetInfo }; // 子资源 map
    // 虚拟资源可以实例化成实体的话，会带上这个扩展名
    instantiation?: string;
    redirect?: IRedirectInfo; // 跳转指向资源
    meta?: IAssetMeta,
    parent?: {
        source: string;
        library: { [key: string]: string };
        uuid: string;
    };
    extends?: string[]; // 资源的继承链信息
    mtime?: number; // 资源文件的 mtime
    depends?: string[]; // 依赖的资源 uuid 信息
    dependeds?: string[]; // 被依赖的资源 uuid 信息
    temp?: string; // 资源临时文件目录
}

export declare interface IAssetMeta<T extends ISupportCreateType | 'unknown' = 'unknown'> {
    ver: string;
    importer: AssetHandlerType;
    imported: boolean;
    uuid: string;
    files: string[];
    subMetas: {
        [index: string]: IAssetMeta<'unknown'>;
    };
    userData: AssetUserDataMap[T extends keyof AssetUserDataMap ? T : 'unknown'];
    displayName?: string;
    id?: string;
    name?: string;
}

/**
 * 场景相关处理接口
 */
export declare interface IAssetService extends IServiceEvents {
    /**
     * 资源发生变化时，进行处理
     * @param uuid
     */
    assetChanged(uuid: string): Promise<void>;
    /**
     * 资源删除时，进行处理
     * @param uuid
     */
    assetDeleted(uuid: string): Promise<void>;
}

export declare type IAssetType =
| ISupportCreateCCType
| 'cc.Asset'               // 基础资源类型（instantiation-asset）
| 'cce.Database'           // 数据库资源
| 'cce.EffectHeader'       // 着色器头文件
| 'cc.VideoClip'           // 视频剪辑
| 'cc.TiledMapAsset'       // 瓦片地图
| 'cc.TTFFont'             // TTF 字体
| 'cc.Texture2D'           // 2D 纹理
| 'cc.SpriteFrame'         // 精灵帧（sprite-frame、rt-sprite-frame）
| 'cc.ImageAsset'          // 图片资源（image、gltf/image、image/alpha、image/sign、texture-cube-face）
| 'cc.TextAsset'           // 文本资源
| 'cc.JsonAsset'           // JSON 资源
| 'cc.AudioClip'           // 音频剪辑
| 'cc.BitmapFont'          // 位图字体
| 'cc.BufferAsset'         // 缓冲区资源
| 'cc.ParticleAsset'       // 粒子资源
| 'cc.RenderPipeline'     // 渲染管线
| 'cc.Skeleton'            // 骨骼（gltf/skeleton、instantiation-asset/skeleton）
| 'cc.Mesh'                // 网格（gltf/mesh、instantiation-asset/mesh）
| 'sp.SkeletonData'        // Spine 骨骼数据
| 'dragonBones.DragonBonesAsset'      // DragonBones 资源
| 'dragonBones.DragonBonesAtlasAsset' // DragonBones 图集资源
| 'RenderStage'            // 渲染阶段
| 'RenderFlow';

export declare interface IBaseCreateNodeParams {
    path: string;
    name?: string;
    workMode?: '2d' | '3d';
    position?: IVec3;
    keepWorldTransform?: boolean;
    canvasRequired?: boolean;
    prefabCanvasHandling?: PrefabCanvasHandling;
    /** Opaque token returned by preflightCreate for this creation request. */
    preflightToken?: string;
    unlinkPrefab?: boolean;
}

/**
 * 基础标识
 */
export declare interface IBaseIdentifier {
    assetName: string;
    assetUuid: string;
    assetUrl: string;
    assetType: string;
}

export declare interface ICameraConfig {
    color: number[];
    fov: number;
    far: number;
    near: number;
    wheelSpeed: number;
    wanderSpeed: number;
    enableAcceleration: boolean;
    aperture: number;
    shutter: number;
    iso: number;
    far2D?: number;
    near2D?: number;
    wheelSpeed2D?: number;
}

export declare interface ICameraService {
    init(): void;
    initFromConfig(): Promise<void>;
    is2D: boolean;
    focus(nodes?: string[] | null, editorCameraInfo?: any, immediate?: boolean): void;
    defaultFocus(uuid: string): void;
    rotateCameraToDir(dir: Vec3_2, rotateByViewDist: boolean): void;
    changeProjection(): void;
    setGridVisible(value: boolean): void;
    isGridVisible(): boolean;
    setCameraProperty(options: any): void;
    resetCameraProperty(): void;
    queryConfig(): ICameraConfig;
    updateConfig(config: Partial<ICameraConfig>): void;
    getCameraFov(): number;
    zoomUp(): void;
    zoomDown(): void;
    zoomReset(): void;
    alignNodeToSceneView(nodes: string[]): void;
    alignSceneViewToNode(nodes: string[]): void;
    setGridColor(color: number[], persist?: boolean): void;
    setOriginAxes2D(config: IOriginAxesConfig): void;
    setOriginAxes3D(config: IOriginAxesConfig): void;
    onUpdate(deltaTime: number): void;
}

export declare interface IChangeNodeLockParams {
    paths: string[];
    locked: boolean;
    loop?: boolean;
}

export declare interface IChangeNodeOptions {
    source?: 'editor' | 'undo' | 'engine';
    type?: NodeEventType;
    propPath?: string;
    index?: number;
    record?: boolean;
    dumpImmediately?: boolean;
}

export declare interface ICLI {
    Scene: IServiceManager;
    SceneEvents: GlobalEventManager;
}

export declare interface IClipboardState {
    type: 'cut' | 'copy' | 'none';
    paths: string[];
}

/**
 * 关闭场景/预制体选项
 */
export declare interface ICloseOptions {
    urlOrUUID?: string;
    /** Whether to save before closing. Defaults to true for backward compatibility. */
    save?: boolean;
    /** Allows closing the current editor when the requested source asset was deleted. */
    allowDeletedSourceFallback?: boolean;
    /** The source editor UUID expected before applying a deleted-source fallback. */
    expectedCurrentUuid?: string;
}

/**
 * 编辑器使用的组件详细信息，属性值以 IProperty 编码形式呈现，
 * 包含 type、readonly、default 等元信息，用于编辑器 Inspector 面板渲染
 */
export declare interface IComponent extends IProperty {
    value: {
        enabled: IPropertyValueType;
        uuid: IPropertyValueType;
        name: IPropertyValueType;
    } & Record<string, IPropertyValueType>;
    mountedRoot?: string;
    component_path?: string;
}

/**
 * 组件服务接口，定义了所有组件相关的操作方法
 */
export declare interface IComponentService extends IServiceEvents {
    /**
     * 添加组件到指定节点，返回添加后的组件信息
     * @param params - 添加组件选项
     * @param params.nodePath - 目标节点路径
     * @param params.component - 组件类名，支持精确匹配（'cc.Label'）和模糊匹配（'label'）
     * @returns 添加成功后的组件信息
     *
     * @example
     * ```ts
     * // 通过节点路径 + 精确组件名
     * const comp = await add({ nodePath: 'Canvas/MyNode', component: 'cc.Label' });
     *
     * // 通过节点路径 + 模糊组件名
     * const comp = await add({ nodePath: 'Canvas/MyNode', component: 'label' });
     * ```
     */
    add(params: IAddComponentOptions): Promise<IComponent>;
    /**
     * 删除指定组件
     * @param params - 删除组件选项
     * @param params.path - 组件路径
     * @returns 删除成功返回 true，失败返回 false
     */
    remove(params: IRemoveComponentOptions): Promise<boolean>;
    /**
     * 设置组件属性（编辑器格式）
     * 通过节点路径 + dump 路径定位，属性为 IProperty 格式
     *
     * @param params - 设置属性选项
     * @returns 设置成功返回 true，失败返回 false
     *
     * @example
     * ```ts
     * await setProperty({
     *     nodePath: 'Canvas/MyNode',
     *     path: '__comps__.0.string',
     *     dump: { value: 'Hello', type: 'String' },
     * });
     * ```
     */
    setProperty(params: ISetPropertyOptions): Promise<boolean>;
    /**
     * 根据同节点 Sprite 或 UITransform 重新生成 PolygonCollider2D.points。
     *
     * Sprite Alpha 轮廓生成、资源读取、校验或提交失败时抛出 Error，不会修改组件现有 points。
     * 没有 Sprite、SpriteFrame 或无法解析源图片时，使用 UITransform 矩形回退。
     *
     * @param options - 重新生成选项
     * @param options.path - PolygonCollider2D 组件路径、UUID 或 db:// URL
     * @param options.record - 是否记录 Undo，默认 true
     * @returns 生成结果，包含是否变更、最终顶点数和顶点来源
     * @throws 组件不存在或类型不正确，以及资源读取、轮廓生成、顶点校验或属性提交失败时抛出 Error
     *
     * @example
     * ```ts
     * const result = await regeneratePolygon2DPoints({
     *     path: 'Canvas/MyNode/cc.PolygonCollider2D',
     *     record: true,
     * });
     * ```
     */
    regeneratePolygon2DPoints(options: IRegeneratePolygon2DPointsOptions): Promise<IRegeneratePolygon2DPointsResult>;
    /**
     * 查询组件信息
     * - 传入 IQueryComponentOptions 时，返回 IComponentInfo
     * - 传入 string 时，返回 IComponent
     *
     * @param params - 查询选项或组件路径字符串
     * @returns 如果传入的是 IQueryComponentOptions 时返回 IComponentInfo，如果传入是string时返回 IComponent，未找到返回 null
     *
     * @example
     * ```ts
     * CLI 模式：返回 IComponentInfo（扁平属性）
     * const comp = await query({ path: 'Canvas/cc.Label_1' }) as IComponentInfo;
     *
     * 编辑器模式：直接传 string，这里是uuid，因为与cli重复了，也支持 path 和 url
     * const comp = await query('uuid') as IComponent;
     * ```
     */
    query(params: IQueryComponentOptions | string): Promise<IComponent | null>;
    /**
     * 获取所有已注册的组件类名，包含内置与自定义组件
     * @returns 组件类名数组，如 ['cc.Label', 'cc.Sprite', 'MyCustomComponent']
     */
    queryAll(): Promise<string[]>;
    /**
     * 根据 LOD 层级中的 Renderer 重新计算 cc.LODGroup 的局部包围盒
     * @param options - 重算选项
     * @param options.path - cc.LODGroup 组件路径
     * @param options.record - 是否记录 undo，默认 true
     * @returns 重算后的局部边界中心和对象尺寸
     */
    recalculateLODGroupBounds(options: IRecalculateLODGroupBoundsOptions): Promise<ILODGroupBoundsResult>;
    /**
     * 在 cc.LODGroup 中插入一级 LOD
     * @param options - 插入选项
     * @returns 插入后的 LOD 层级状态
     */
    insertLOD(options: IInsertLODOptions): Promise<ILODGroupLevelsResult>;
    /**
     * 删除 cc.LODGroup 中的一级 LOD
     * @param options - 删除选项
     * @returns 删除后的 LOD 层级状态
     */
    eraseLOD(options: IEraseLODOptions): Promise<ILODGroupLevelsResult>;
    /**
     * 查询 cc.LODGroup 在当前编辑器相机下的屏幕相对高度
     * @param options - 查询选项
     * @returns 原始相对高度；不钳制到 [0, 1]
     */
    queryLODGroupRelativeHeight(options: IQueryLODGroupRelativeHeightOptions): Promise<number>;
    /**
     * 复位组件，将组件所有属性恢复为默认值
     * @param params - 查询组件选项，用于定位要复位的组件
     * @param params.path - 组件路径
     * @returns 复位成功返回 true，失败返回 false
     */
    reset(params: IQueryComponentOptions): Promise<boolean>;
    /**
     * 获取所有注册类名，支持按继承关系过滤
     * @param options - 过滤选项，不传则返回所有注册类
     * @param options.extends - 父类名称，只返回继承自该类的子类，支持字符串或字符串数组
     * @param options.excludeSelf - 是否排除父类自身，默认 false
     * @returns 类名对象数组，如 [{ name: 'cc.Label' }, { name: 'cc.Sprite' }]
     *
     * @example
     * ```ts
     * // 查询所有注册类
     * const all = await queryClasses();
     *
     * // 查询 cc.Component 的所有子类（含自身）
     * const comps = await queryClasses({ extends: 'cc.Component' });
     *
     * // 查询 cc.Component 的所有子类（排除自身）
     * const subComps = await queryClasses({ extends: 'cc.Component', excludeSelf: true });
     * ```
     */
    queryClasses(options?: IQueryClassesOptions): Promise<{
        name: string;
    }[]>;
    /**
     * 查询指定节点上所有组件暴露的可调用函数
     * @param path - 节点路径
     * @returns 节点上组件的函数信息，节点不存在时返回空对象
     */
    queryFunctionOfNode(path: string): Promise<any>;
    /**
     * 查询所有已注册的组件菜单项
     * @returns 组件菜单项数组，包含类名、类 ID 和菜单路径
     */
    queryComponents(): Promise<Array<{
        name: string;
        cid: string;
        path: string;
    }>>;
    /**
     * 执行组件上的指定方法
     * @param options - 执行选项
     * @param options.path - 组件路径，如 'Canvas/cc.Label_1'
     * @param options.name - 要执行的方法名，如 'onLoad'、'start'
     * @param options.args - 方法参数列表
     * @returns 执行成功返回 true，失败返回 false
     */
    executeMethod(options: IExecuteComponentMethodOptions): Promise<any>;
    /**
     * 查询指定名称的组件是否已注册（是否存在对应脚本）
     * @param name - 组件类名，如 'cc.Label'
     * @returns 存在返回 true，不存在返回 false
     */
    hasScript(name: string): Promise<boolean>;
    /**
     * 通过 uuid 获取组件的路径
     *
     * @param uuid - 组件的 uuid
     * @returns 组件路径，组件不存在时返回空字符串
     */
    getPathByUuid(uuid: string): string;
    init(): void;
    unregisterCompMgrEvents(): void;
}

export declare interface ICopyParams {
    paths: string[];
}

export declare interface ICreateByAssetParams extends IBaseCreateNodeParams {
    dbURL: string;
}

export declare interface ICreateByNodeTypeParams extends IBaseCreateNodeParams {
    nodeType: NodeType;
}

export declare interface ICreateNodePreflightResult {
    action: 'create' | 'choose-prefab-canvas-handling';
    canvasRequired: boolean;
    canvasPath: string | null;
    uiTransformPath: string | null;
    /**
     * Opaque token for the matching create request. Passing it back prevents a
     * stale preflight result from silently skipping required Canvas handling.
     */
    preflightToken: string;
}

/**
 * 创建场景/预制体选项
 */
export declare interface ICreateOptions {
    type: ICreateType;
    baseName: string;
    targetDirectory: string;
    templateType?: TSceneTemplateType;
}

export declare interface ICreatePrefabFromNodeParams {
    /** 要转换为预制体的源节点路径 */
    nodePath: string;
    /** 预制体资源保存 URL */
    dbURL: string;
    /** 是否强制覆盖现有资源 */
    overwrite?: boolean;
}

export declare type ICreateType = typeof CREATE_TYPES[number];

export declare interface ICustomLayerConfig {
    name: string;
    value: number;
}

export declare interface ICutParams {
    paths: string[];
}

export declare interface IDeleteNodeParams {
    path: string;
    keepWorldTransform?: boolean;
}

export declare interface IDeleteNodeResult {
    path: string;
}

export declare interface IDuplicateParams {
    paths: string[];
}

export declare interface IEditorService extends IServiceEvents {
    /**
     * 当前编辑器类型
     */
    getCurrentEditorType(): 'scene' | 'prefab' | 'unknown';
    /**
     * 打开资产
     * @param params
     */
    open(params: IOpenOptions): Promise<TEditorEntity>;
    /**
     * 关闭当前资产
     */
    close(params: ICloseOptions): Promise<boolean>;
    /**
     * 保存资产
     */
    save(params: ISaveOptions): Promise<IAssetInfo>;
    /**
     * 重载资产
     * @param params
     */
    reload(params: IReloadOptions): Promise<ReloadResult>;
    /**
     * 创建新资产
     * @param params
     */
    create(params: ICreateOptions): Promise<IBaseIdentifier>;
    /**
     * 是否有打开编辑器
     */
    hasOpen(): Promise<boolean>;
    /**
     * 获取当前打开的资产
     */
    queryCurrent(): Promise<TEditorEntity | null>;
    /**
     * 序列化当前正在编辑的场景（含未保存改动），返回可被 loadWithJson 加载的 JSON 字符串。
     * 用于「Preview in Editor」把编辑器实时场景交给游戏运行时预览。
     */
    querySceneSerializedData(): Promise<string>;
    /**
     *
     */
    getRootNode(): TEditorInstance | null;
    lock(): Promise<void>;
    unlock(): void;
}

export declare interface IEngineService extends IServiceEvents {
    /**
     * 初始化引擎服务，目前是暂时引擎 mainLoop
     */
    init(): Promise<void>;
    /**
     * 让引擎执行一帧
     */
    repaintInEditMode(): Promise<void>;
    pause(): void;
    resume(): void;
    /**
     * 初始化自定义 Layer 配置
     */
    initCustomLayer(layers?: ICustomLayerConfig[]): Promise<void>;
    enterAnimationMode(): void;
    exitAnimationMode(): void;
}

/**
 * 删除 LODGroup 层级的选项
 */
export declare interface IEraseLODOptions {
    /** cc.LODGroup 组件路径 */
    path: string;
    /** 删除位置，范围为 0 到 lodCount - 1 */
    index: number;
    /** 是否记录 undo，默认 true */
    record?: boolean;
}

/**
 * 执行组件方法的选项
 */
export declare interface IExecuteComponentMethodOptions {
    path: string;
    name: string;
    args: any[];
}

export declare interface IFbxSetting {
    /**
     * https://github.com/cocos-creator/FBX-glTF-conv/pull/26
     */
    unitConversion?: 'geometry-level' | 'hierarchy-level' | 'disabled';

    /**
     * 动画烘焙速率。单位为 FPS。
     * 一般来说有以下几种 FPS 选项。
     * - NTSC video 30/60
     * - PAL video 25
     * - Film 24
     * 见 https://knowledge.autodesk.com/support/3ds-max/learn-explore/caas/CloudHelp/cloudhelp/2020/ENU/3DSMax-Reference/files/GUID-92B75FD6-C112-44D6-AB89-DB50D11AE0DE-htm.html 。
     * 为了以后的拓展性，我们目前仅支持用户从这几种选项中选择。
     * @default 24
     */
    animationBakeRate?: 0 | 24 | 25 | 30 | 60;

    /**
     * 在导出动画时，是否优先使用 FBX 内记录的时间范围。
     * @default true
     */
    preferLocalTimeSpan?: boolean;

    /**
     * 是否为导入的材质匹配DCC的光照模型.
     * 在导入时,若此字段为 `undefined` 时,该字段将被初始化为当前配置的"是否开启智能材质转换".
     */
    smartMaterialEnabled?: boolean;

    /**
     * 匹配 DCC 原始模型名称。
     */
    matchMeshNames?: boolean;
}

export declare interface IGetPrefabInfoParams {
    nodePath: string;
}

export declare interface IGizmoService {
    gizmoRootNode: any;
    foregroundNode: any;
    backgroundNode: any;
    transformToolData: any;
    transformToolName: string;
    isViewMode: boolean;
    is2D: boolean;
    init(): void;
    initFromConfig(): Promise<void>;
    saveConfig(): Promise<void>;
    changeTool(name: string): void;
    setCoordinate(coord: 'local' | 'global'): void;
    setPivot(pivot: 'pivot' | 'center'): void;
    lockGizmoTool(locked: boolean): void;
    isGizmoToolLocked(): boolean;
    setIconVisible(visible: boolean): void;
    showAllGizmoOfNode(node: any, recursive?: boolean): void;
    removeAllGizmoOfNode(node: any, recursive?: boolean): void;
    clearAllGizmos(): void;
    callAllGizmoFuncOfNode(node: any, funcName: string, ...params: any[]): boolean;
    getComponentGizmo(component: any): any;
    onUpdate(deltaTime: number): void;
    queryToolsVisibility3d(): boolean;
    setToolsVisibility3d(value: boolean): void;
    isIconGizmo3D(): boolean;
    setIconGizmo3D(value: boolean): void;
    queryIconGizmoSize(): number;
    setIconGizmoSize(size: number): void;
    queryGridColor(): number[];
    setGridColor(color: number[]): void;
    queryOriginAxes2D(): IOriginAxesConfig;
    setOriginAxes2D(config: IOriginAxesConfig): void;
    queryOriginAxes3D(): IOriginAxesConfig;
    setOriginAxes3D(config: IOriginAxesConfig): void;
    queryTransformSnapConfigs(): any;
    setTransformSnapConfigs(name: string, value: any): void;
    queryRectSnapConfig(): IRectSnapConfigData;
    setRectSnapConfig(config: Partial<IRectSnapConfigData>): void;
    querySelectNodes(): any[];
    hasSelected(uuid: string): boolean;
    onResize(): void;
    showSelectionRegion(left: number, right: number, top: number, bottom: number): void;
    hideSelectionRegion(): void;
    execGizmoMethods(name: string, funcName: string, params?: any[]): any;
}

/**
 * 插入 LODGroup 层级的选项
 */
export declare interface IInsertLODOptions {
    /** cc.LODGroup 组件路径 */
    path: string;
    /** 插入位置，范围为 0 到当前 lodCount */
    index: number;
    /** 屏幕占比，范围为 (0, 1]；省略时由引擎自动计算 */
    screenUsagePercentage?: number;
    /** 是否记录 undo，默认 true */
    record?: boolean;
}

export declare interface IIsPrefabInstanceParams {
    nodePath: string;
}

/**
 * LODGroup 包围盒重算结果
 */
export declare interface ILODGroupBoundsResult {
    localBoundaryCenter: IVec3;
    objectSize: number;
}

/**
 * LODGroup 层级状态
 */
export declare interface ILODGroupLevelsResult {
    lodCount: number;
    screenUsagePercentages: number[];
}

/** 图片资源的 userData  */
export declare interface ImageAssetUserData {
    /** 图片类型 */
    type: ImageImportType;
    /** 垂直翻转 */
    flipVertical?: boolean;
    /** 消除透明伪影 */
    fixAlphaTransparencyArtifacts?: boolean;
    /** 是否为 RGBE */
    isRGBE?: boolean;
    /** 这个图片是不是拥有 alpha 通道 */
    hasAlpha?: boolean;
    /** 重定向的 uuid */
    redirect?: string;
    visible?: boolean;
    /** 是否翻转绿通道 */
    flipGreenChannel?: boolean;

    /**
     * 部分资源导入后可能产生多张图像资源
     */
    sign?: string;
    alpha?: string;
}

export declare type ImageImportType = 'raw' | 'texture' | 'normal map' | 'sprite-frame' | 'texture cube';

export declare interface ImageMeta {
    /**
     * 图片名字。
     */
    name?: string;

    /**
     * 模型文件中该图片的 URI，可能是以下形式：
     *   - Database URL，这种路径的图片存在项目目录中；
     *   - uuid URI，这种路径的图片已经作为子资源导入，路径代表子资源的 uuid。
     * 如果未定义，表示此图片未指定源或指定的源无法解析。
     */
    uri?: string;

    /**
     * 用户设置的图片对象。
     * 3.8.0 以前使用路径，3.8.0 之后使用 UUID。
     */
    remap?: string;
}

export declare interface IMoveArrayElementParams {
    nodePath: string;
    path: string;
    target: number;
    offset: number;
}

export declare interface INode {
    path: string;
    active: IProperty;
    locked: IProperty;
    name: IProperty;
    position: IProperty;
    /**
     * 此为 dump 数据，非 node.rotation
     * 实际指向 node.eulerAngles
     * rotation 为了给用户更友好的文案
     */
    rotation: IProperty;
    mobility: IProperty;
    scale: IProperty;
    layer: IProperty;
    uuid: IProperty;
    children: IProperty[];
    parent: IProperty;
    __comps__: IComponent[];
    __type__: string;
    __prefab__?: IPrefab;
    _prefabInstance?: any;
    removedComponents?: IRemovedComponentInfo[];
    mountedRoot?: string;
}

export declare interface INodeDumpOptions {
    includeChildren?: boolean;
    includeComponents?: boolean;
}

/**
 * 节点的相关处理接口
 */
export declare interface INodeService extends IServiceEvents {
    /**
     * 创建节点
     * @param params
     */
    createByType(params: ICreateByNodeTypeParams): Promise<INode | null>;
    /**
     * 创建节点
     * @param params
     */
    createByAsset(params: ICreateByAssetParams): Promise<INode | null>;
    /**
     * Resolve Canvas handling for a node creation request without modifying the scene.
     */
    preflightCreate(params: ICreateByNodeTypeParams | ICreateByAssetParams): Promise<ICreateNodePreflightResult>;
    /**
     * 删除节点
     * @param params
     */
    delete(params: IDeleteNodeParams): Promise<IDeleteNodeResult | null>;
    /**
     * 查询节点信息
     *
     * @param params - 查询选项
     * @returns 查询到的节点信息，未找到返回 null
     */
    query(params?: IQueryNodeParams): Promise<INode | IScene | null>;
    /**
     * 查询节点树（层级管理器格式）
     */
    queryNodeTree(params: IQueryNodeTreeParams): Promise<INodeTreeItem | null>;
    /**
     * 查询当前场景中使用指定资源的节点 uuid 列表
     */
    queryNodesByAssetUuid(uuid: string): string[];
    /**
     * 查询当前场景中资源丢失的节点 uuid 列表
     */
    queryNodesMissAsset(): Promise<string[]>;
    /**
     * 预览设置节点属性，临时应用属性变更但不记录到 undo 栈
     * 用于编辑器中拖拽滑块等实时预览场景，首次调用时会缓存原始值，
     * 可通过 cancelPreviewSetProperty 恢复
     *
     * @param options - 设置属性选项
     * @param options.nodePath - 节点路径
     * @param options.path - 属性路径，如 'position'、'scale'
     * @param options.dump - 属性的 dump 数据
     * @returns 设置成功返回 true，节点或属性路径无效返回 false
     *
     * @example
     * ```ts
     * // 预览修改节点位置
     * await previewSetProperty({
     *     nodePath: 'Canvas/MyNode',
     *     path: 'position',
     *     dump: { value: { x: 100, y: 200, z: 0 }, type: 'cc.Vec3' },
     * });
     * ```
     */
    previewSetProperty(options: ISetPropertyOptions): Promise<boolean>;
    /**
     * 取消预览设置，将节点属性恢复到 previewSetProperty 调用前的值
     * 仅使用 options.nodePath 和 options.path，options.dump 不会被使用
     *
     * @param options - 设置属性选项
     * @param options.nodePath - 节点路径
     * @param options.path - 属性路径
     * @returns 恢复成功返回 true，无缓存的预览数据或节点无效返回 false
     */
    cancelPreviewSetProperty(options: ISetPropertyOptions): Promise<boolean>;
    /**
     * 设置节点属性，会记录到 undo 栈
     *
     * @param options - 设置属性选项
     * @param options.nodePath - 节点路径
     * @param options.path - 属性路径，如 'position'、'rotation'、'layer'
     * @param options.dump - 属性的 dump 数据
     * @returns 设置成功返回 true，节点不存在返回 false
     *
     * @example
     * ```ts
     * await setProperty({
     *     nodePath: 'Canvas/MyNode',
     *     path: 'position',
     *     dump: { value: { x: 100, y: 200, z: 0 }, type: 'cc.Vec3' },
     * });
     * ```
     */
    setProperty(options: ISetPropertyOptions): Promise<boolean>;
    /**
     * 重置节点的变换属性（position、rotation、scale、mobility）到默认值
     *
     * @param path - 节点路径
     * @returns 重置成功返回 true，节点不存在返回 false
     */
    reset(path: string): Promise<boolean>;
    /**
     * 重置节点的单个属性到 CCClass 定义的默认值
     * 仅使用 options.nodePath 和 options.path，options.dump 不会被使用
     *
     * @param options - 设置属性选项
     * @param options.nodePath - 节点路径
     * @param options.path - 属性路径，如 'position'、'scale'
     * @returns 重置成功返回 true，节点不存在返回 false
     */
    resetProperty(options: ISetPropertyOptions): Promise<boolean>;
    /**
     * 将节点上值为 null 的属性初始化为默认实例
     * 当属性为 null 且有定义构造函数类型时，会创建该类型的新实例
     * 仅使用 options.nodePath 和 options.path，options.dump 不会被使用
     *
     * @param options - 设置属性选项
     * @param options.nodePath - 节点路径
     * @param options.path - 属性路径
     * @returns 初始化成功返回 true，节点不存在返回 false
     *
     * @example
     * ```ts
     * // 将节点上值为 null 的自定义属性初始化
     * await updatePropertyFromNull({
     *     nodePath: 'Canvas/MyNode',
     *     path: 'customProperty',
     *     dump: {} as IProperty,
     * });
     * ```
     */
    updatePropertyFromNull(options: ISetPropertyOptions): Promise<boolean>;
    /**
     * 设置节点及其所有子节点的 layer 属性
     * 递归将相同的 layer 值应用到整个节点子树
     * 仅使用 options.nodePath 和 options.dump，options.path 不会被使用（内部固定为 'layer'）
     *
     * @param options - 设置属性选项
     * @param options.nodePath - 节点路径
     * @param options.dump - layer 属性的 dump 数据
     *
     * @example
     * ```ts
     * await setNodeAndChildrenLayer({
     *     nodePath: 'Canvas/MyNode',
     *     path: 'layer',
     *     dump: { value: 1 << 25, type: 'Enum' },
     * });
     * ```
     */
    setNodeAndChildrenLayer(options: ISetPropertyOptions): Promise<void>;
    /**
     * 通过 uuid 获取节点的层级路径
     *
     * @param uuid - 节点的 uuid
     * @returns 节点路径，节点不存在时返回空字符串
     */
    getPathByUuid(uuid: string): string;
    setParent(params: ISetParentParams): Promise<string[]>;
    reorder(params: IReorderParams): Promise<boolean>;
    copy(params: ICopyParams): Promise<string[]>;
    paste(params: IPasteParams): Promise<string[]>;
    duplicate(params: IDuplicateParams): Promise<string[]>;
    cut(params: ICutParams): Promise<string[]>;
    queryClipboardState(): Promise<IClipboardState>;
    /**
     * 移动数组元素位置
     * 通用操作，支持 children 排序、组件排序等
     */
    moveArrayElement(params: IMoveArrayElementParams): Promise<boolean>;
    /**
     * 删除数组元素
     * 支持删除组件等数组属性中的元素（不支持 children）
     */
    removeArrayElement(params: IRemoveArrayElementParams): Promise<boolean>;
    /**
     * 锁定/解锁节点
     */
    changeNodeLock(params: IChangeNodeLockParams): Promise<void>;
}

export declare interface INodeTreeComponent {
    isCustom: boolean;
    type: string;
    value: string;
    extends: string[];
}

export declare interface INodeTreeItem {
    name: string;
    active: boolean;
    locked: boolean;
    type: string;
    uuid: string;
    children: INodeTreeItem[];
    prefab: IPrefabStateInfo;
    parent: string;
    path: string;
    isScene: boolean;
    readonly: boolean;
    components: INodeTreeComponent[];
}

/**
 * 打开场景/预制体选项
 */
export declare interface IOpenOptions extends INodeDumpOptions {
    urlOrUUID: string;
}

export declare interface IOperationService {
    addListener(type: OperationEvent, listener: Function, priority?: number): void;
    removeListener(type: OperationEvent, listener: Function): void;
    dispatch(type: OperationEvent, ...args: any[]): void;
    emitMouseEvent(type: string, event: ISceneMouseEvent, dpr?: number): void;
    requestPointerLock(): void;
    exitPointerLock(): void;
    changePointer(type: string): void;
}

export declare interface IOriginAxesConfig {
    x: boolean;
    y: boolean;
    z: boolean;
}

/**
 * 粒子系统服务接口，与 cocos-editor ParticleManager 对齐。
 * 负责管理粒子系统在编辑模式下的播放、停止、暂停、重启、
 * 播放速度与运行时信息查询等能力。
 *
 * 这些方法对应 cocos-editor 中 float-window / inspector
 * 通过 callSceneMethod 调用的 playParticle / pauseParticle /
 * stopParticle / restartParticle / setParticlePlaySpeed /
 * queryParticlePlayInfo 等场景方法。
 */
/**
 * queryPlayInfo 返回的粒子运行时数据
 */
export declare interface IParticlePlayInfo {
    /** 粒子系统的模拟速度 */
    speed: number;
    /** 当前已模拟的时间（秒，保留 2 位小数） */
    time: number;
    /** 当前存活的粒子数量 */
    particle: number;
    /** 是否正在播放 */
    isPlaying: boolean;
}

export declare interface IParticleService {
    /**
     * 请求粒子系统运行时的数据
     * @param uuid 粒子组件的 uuid
     */
    queryPlayInfo(uuid: string): IParticlePlayInfo | null;
    /**
     * 设置粒子的运行速度
     * @param uuid 组件的 uuid
     * @param speed 粒子组件的运行速度
     */
    setPlaySpeed(uuid: string, speed: number): void;
    /**
     * 播放选中的粒子，会递归查找父节点，直到找到非粒子组件的节点为止
     */
    play(): void;
    /**
     * 停止播放选中的粒子
     */
    stop(): void;
    /**
     * 暂停选中的粒子
     */
    pause(): void;
    /**
     * 重新开始播放选中的粒子
     */
    restart(): void;
}

export declare interface IPasteParams {
    parentPath?: string;
    keepWorldTransform?: boolean;
}

export declare interface IPrefab {
    uuid: string;
    fileId: string;
    rootUuid: string;
    sync: boolean;
    prefabStateInfo: IPrefabStateInfo;
    targetOverrides?: ITargetOverrideInfo[];
    instance?: IProperty;
}

export declare interface IPrefabService extends IServiceEvents {
    /**
     * 将节点转换为预制体资源
     */
    createPrefabFromNode(params: ICreatePrefabFromNodeParams): Promise<INode>;
    /**
     * 将节点的修改应用回预制体资源
     */
    applyPrefabChanges(params: IApplyPrefabChangesParams): Promise<boolean>;
    /**
     * 重置节点到预制体原始状态
     */
    revertToPrefab(params: IRevertToPrefabParams): Promise<boolean>;
    /**
     * 解耦预制体实例，使其成为普通节点
     */
    unpackPrefabInstance(params: IUnpackPrefabInstanceParams): Promise<INode>;
    /**
     * 检查节点是否为预制体实例
     */
    isPrefabInstance(params: IIsPrefabInstanceParams): Promise<boolean>;
    /**
     * 获取节点的预制体信息
     */
    getPrefabInfo(params: IGetPrefabInfoParams): Promise<IPrefab | null>;
    /**
     * 解绑预制体实例，使其成为普通节点
     */
    unlinkPrefab(params: IUnlinkPrefabParams): Promise<boolean>;
    /**
     * 移除 prefab info
     * @param node
     * @param removeNested
     */
    removePrefabInfoFromNode(node: Node_2, removeNested?: boolean): void;
    /**
     * Filter out prefab asset children that cannot be removed from the current context.
     */
    filterChildOfPrefabAssetWhenRemoveNode(uuids: string | string[]): string[];
}

export declare interface IPrefabStateInfo {
    state: PrefabState;
    isUnwrappable: boolean;
    isRevertable: boolean;
    isApplicable: boolean;
    isAddedChild: boolean;
    isNested: boolean;
    assetUuid: string;
}

export declare interface IPreviewInstance {
    onMouseDown(event: any): void;
    onMouseMove(event: any): void;
    onMouseUp(event: any): void;
    onMouseWheel(event: any): void;
    viewToggle(): void;
    is2DView(): boolean;
    resetCameraView(): void;
    hide(): void;
}

export declare interface IPreviewService {
    open(uuid: string): Promise<IPreviewInstance | null>;
    generateThumbnail(uuid: string, assetType: string, width?: number, height?: number): Promise<any>;
}

/**
 * 组件的 dump 数据，以 IProperty 格式编码组件信息
 * 与 IComponent 不同，所有属性（包括 uuid, name, enabled）都通过 encodeObject 编码为 IProperty
 */
export declare interface IProperty {
    value: { [key: string]: IPropertyValueType } | IPropertyValueType;
    default?: any; // 默认值

    // 多选节点之后，这里存储多个数据，用于自行判断多选后的显示效果，无需更新该数据
    values?: ({ [key: string]: IPropertyValueType } | IPropertyValueType)[];

    lock?: { [key in keyof Vec4]?: IPropertyLock };

    cid?: string;
    type?: string;
    ui?: { name: string; data?: any }; // 是否用指定的 UI 组件，name 是组件的名称
    readonly?: boolean;
    visible?: boolean;
    name?: string;

    elementTypeData?: IProperty; // 数组里的数据的默认值 dump

    path: string; // 数据的搜索路径

    isArray?: boolean;
    invalid?: boolean;
    extends?: string[]; // 继承链
    displayName?: string; // 显示到界面上的名字
    displayOrder?: number; // 显示排序
    help?: string; // 帮助文档的 url 地址
    group?: IPropertyGroupOptions; // tab
    tooltip?: string; // 提示文本
    editor?: any; // 组件上定义的编辑器数据
    animatable?: boolean; // 是否可以在动画中编辑
    radioGroup?: boolean; // 是否渲染为 RadioGroup

    // Enum
    enumList?: any[]; // enum 类型的 list 选项数组

    bitmaskList?: any[];

    // Number
    min?: number; // 数值类型的最小值
    max?: number; // 数值类型的最大值
    step?: number; // 数值类型的步进值
    slide?: boolean; // 数组是否显示为滑块
    unit?: string; // 显示的单位
    radian?: boolean; // 标识是否为角度

    // Label
    multiline?: boolean; // 字符串是否允许换行
    // nullable?: boolean; 属性是否允许为空

    optionalTypes?: string[]; // 对属性是 object 且是可变类型的数据的支持，比如 render-pipeline

    userData?: { [key: string]: any }; // 用户透传的数据
}

export declare interface IPropertyGroupOptions {
    id: string // 默认 'default'
    name: string,
    displayOrder: number, // 默认 Infinity, 排在最后面
    style: string // 默认为 'tab'
}

export declare type IPropertyLock = { 
    default: number; 
    message: string 
};

export declare type IPropertyValueType = IProperty | IProperty[] | null | undefined | number | boolean | string | Vec4 | Vec3 | Vec2 | Mat4 | any | Array<unknown>

/**
 * 查询注册类的过滤选项
 */
export declare interface IQueryClassesOptions {
    extends?: string | string[];
    excludeSelf?: boolean;
}

/**
 * 查询组件的选项
 */
export declare interface IQueryComponentOptions {
    path: string;
}

/**
 * 查询 LODGroup 当前编辑器相机屏占比的选项
 */
export declare interface IQueryLODGroupRelativeHeightOptions {
    /** cc.LODGroup 组件路径 */
    path: string;
}

export declare interface IQueryNodeParams extends INodeDumpOptions {
    path: string;
}

export declare interface IQueryNodeTreeParams {
    path?: string;
}

/**
 * 重新计算 LODGroup 包围盒的选项
 */
export declare interface IRecalculateLODGroupBoundsOptions {
    /** cc.LODGroup 组件路径 */
    path: string;
    /** 是否记录 undo，默认 true */
    record?: boolean;
}

export declare interface IRectSnapConfigData {
    enableSnapping: boolean;
    snapThreshold: number;
}

export declare interface IRedirectInfo {
    // 跳转资源的类型
    type: string;
    // 跳转资源的 uuid
    uuid: string;
}

export declare interface IRedoService {
    /** 重做最近撤销的一条命令。 */
    redo(options?: IUndoOperationOptions): Promise<IUndoRedoResult>;
    /** 至少有一条可重做命令时返回 true。 */
    canRedo(options?: IUndoOperationOptions): boolean;
}

export declare interface IReferenceImageCancelOptions {
    interactionId: number;
}

export declare interface IReferenceImageCommitOptions {
    interactionId?: number;
    patch: IReferenceImageParameters;
}

/** Persisted locally; external files themselves are never imported into AssetDB. */
export declare interface IReferenceImageConfigItem {
    path: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    /** Opacity is a percentage in the inclusive 0–100 range. */
    opacity: number;
}

export declare interface IReferenceImageError {
    stage: 'config' | 'file' | 'decode';
    message: string;
}

export declare interface IReferenceImageItem extends IReferenceImageConfigItem {
    missing: boolean;
}

export declare interface IReferenceImageParameters {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    opacity?: number;
}

export declare interface IReferenceImagePathOptions {
    path: string;
}

export declare interface IReferenceImagePreviewOptions {
    interactionId: number;
    patch: IReferenceImageParameters;
}

/** Scene-local service; preview APIs are intentionally restricted to Webviews. */
export declare interface IReferenceImageService extends IServiceEvents {
    getState(): Promise<IReferenceImageState>;
    addAndSelect(options: IReferenceImagePathOptions): Promise<IReferenceImageState>;
    remove(options: IReferenceImagePathOptions): Promise<IReferenceImageState>;
    select(options: IReferenceImagePathOptions): Promise<IReferenceImageState>;
    clearBinding(): Promise<IReferenceImageState>;
    setVisible(options: IReferenceImageVisibilityOptions): Promise<IReferenceImageState>;
    refresh(): Promise<IReferenceImageState>;
    previewParameters(options: IReferenceImagePreviewOptions): Promise<IReferenceImageState>;
    commitParameters(options: IReferenceImageCommitOptions): Promise<IReferenceImageState>;
    cancelPreview(options: IReferenceImageCancelOptions): Promise<IReferenceImageState>;
}

/** A read-only snapshot; `current.image` is derived from library + binding. */
export declare interface IReferenceImageState {
    images: IReferenceImageItem[];
    current: {
        sceneUuid: string | null;
        imagePath: string | null;
        image: IReferenceImageItem | null;
    };
    desiredVisible: boolean;
    effectiveVisible: boolean;
    visibilityReason: ReferenceImageVisibilityReason;
    is2D: boolean;
    hasOpenEditor: boolean;
    error: IReferenceImageError | null;
}

export declare interface IReferenceImageVisibilityOptions {
    desiredVisible: boolean;
}

/**
 * 重新生成 PolygonCollider2D.points 的选项。
 */
export declare interface IRegeneratePolygon2DPointsOptions {
    /** PolygonCollider2D 组件路径、UUID 或 URL。 */
    path: string;
    /** 是否记录 Undo；默认 true。 */
    record?: boolean;
}

/**
 * 重新生成 PolygonCollider2D.points 的成功结果。
 * 失败通过 Error 抛出，由 RPC/API 边界决定如何呈现。
 */
export declare interface IRegeneratePolygon2DPointsResult {
    path: string;
    changed: boolean;
    pointCount: number;
    source: Polygon2DPointsSource;
}

/**
 * 软刷新场景/预制体选项
 */
export declare interface IReloadOptions {
    urlOrUUID?: string;
    /** Internal scene-process reloads can preserve undo state when the caller pushes its own command. */
    preserveUndoHistory?: boolean;
}

export declare interface IRemoveArrayElementParams {
    nodePath: string;
    path: string;
    index: number;
}

/**
 * 删除组件的选项
 */
export declare interface IRemoveComponentOptions {
    path: string;
}

export declare interface IRemovedComponentInfo {
    name: string;
    fileID: string;
}

export declare interface IReorderParams {
    path: string;
    target: number;
    offset: number;
}

export declare interface IRevertToPrefabParams {
    nodePath: string;
}

/**
 * 保持场景/预制体选项
 */
export declare interface ISaveOptions {
    urlOrUUID?: string;
}

export declare interface IScene {
    path: string;
    name: IProperty;
    active: IProperty;
    locked: IProperty;
    _globals: Record<string, IProperty>;
    isScene: boolean;
    autoReleaseAssets: IProperty;
    uuid: IProperty;
    children: IProperty[];
    parent: string;
    __type__: string;
    targetOverrides?: ITargetOverrideInfo[];
}

export declare interface ISceneMouseEvent {
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    deltaX: number;
    deltaY: number;
    wheelDeltaX: number;
    wheelDeltaY: number;
    moveDeltaX: number;
    moveDeltaY: number;
    leftButton: boolean;
    middleButton: boolean;
    rightButton: boolean;
    button: number;
    buttons: number;
    movementX: number;
    movementY: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    hitPoint?: any;
    type?: string;
    handleName?: string;
}

export declare interface ISceneViewService {
    init(): void;
    initFromConfig(): Promise<void>;
    saveConfig(): Promise<void>;
    setSceneLightOn(enable: boolean): void;
    querySceneLightOn(): boolean;
    onEditorOpened(): void;
    onEditorClosed(): void;
    onComponentAdded(comp: Component): void;
    onComponentRemoved(comp: Component): void;
}

export declare interface IScriptService extends IServiceEvents {
    investigatePackerDriver(): Promise<void>;
    loadScript(): Promise<void>;
    removeScript(): Promise<void>;
    scriptChange(): Promise<void>;
    queryScriptCid(uuid: string): Promise<string | null>;
    queryScriptName(uuid: string): Promise<string | null>;
    isCustomComponent(classConstructor: Function): boolean;
    suspend(condition: Promise<any>): void;
}

export declare interface ISelectionService {
    select(path: string): void;
    unselect(path: string): void;
    clear(): void;
    query(): string[];
    isSelect(path: string): boolean;
    reset(): void;
}

export declare interface IServiceEvents {
    onEditorOpened?(): void;
    onEditorReload?(): void;
    onEditorClosed?(): void;
    onEditorSaved?(): void;
    onNodeBeforeChanged?(node: Node_2): void;
    onBeforeRemoveNode?(node: Node_2): void;
    onBeforeAddNode?(node: Node_2): void;
    onNodeChanged?(node: Node_2, opts: IChangeNodeOptions): void;
    onBeforeNodeAdded?(node: Node_2): void;
    onAddNode?(node: Node_2): void;
    onRemoveNode?(node: Node_2): void;
    onNodeAdded?(node: Node_2): void;
    onNodeRemoved?(node: Node_2): void;
    onAddComponent?(comp: Component): void;
    onRemoveComponent?(comp: Component): void;
    onSetPropertyComponent?(comp: Component): void;
    onComponentAdded?(comp: Component): void;
    onComponentRemoved?(comp: Component): void;
    onBeforeChangeComponent?(node: Node_2): void;
    onBeforeAddComponent?(name: string, node: Node_2): void;
    onBeforeRemoveComponent?(comp: Component): void;
    onAssetDeleted?(uuid: string): void;
    onAssetChanged?(uuid: string): void;
    onAssetRefreshed?(uuid: string): void;
    onScriptExecutionFinished?(): void;
    onSelectionSelect?(path: string, paths: string[]): void;
    onSelectionUnselect?(path: string, paths: string[]): void;
    onSelectionClear?(): void;
}

export declare interface IServiceManager {
    Editor: IEditorService;
    Node: INodeService;
    Component: IComponentService;
    Script: IScriptService;
    Asset: IAssetService;
    Engine: IEngineService;
    Animation: IAnimationService;
    Prefab: IPrefabService;
    Selection: ISelectionService;
    Operation: IOperationService;
    Undo: IUndoService;
    Redo: IRedoService;
    Camera: ICameraService;
    Gizmo: IGizmoService;
    SceneView: ISceneViewService;
    Preview: IPreviewService;
    UI: IUIService;
    ReferenceImage: IReferenceImageService;
    Particle: IParticleService;
    Terrain: ITerrainService;
}

export declare interface ISetParentParams {
    paths: string[];
    parentPath: string;
    keepWorldTransform?: boolean;
}

/**
 * 编辑器设置组件属性的选项
 */
export declare interface ISetPropertyOptions {
    nodePath: string;
    path: string;
    dump: IProperty;
    record?: boolean;
}

export declare type ISupportCreateCCType =
| 'cc.AnimationClip'        // 动画剪辑
| 'cc.Script'               // 脚本（TypeScript/JavaScript）
| 'cc.SpriteAtlas'          // 精灵图集（自动图集）
| 'cc.EffectAsset'          // 着色器效果
| 'cc.SceneAsset'           // 场景
| 'cc.Prefab'               // 预制体
| 'cc.Material'             // 材质
| 'cc.TextureCube'          // 立方体贴图
| 'cc.TerrainAsset'         // 地形
| 'cc.PhysicsMaterial'      // 物理材质
| 'cc.LabelAtlas'           // 标签图集
| 'cc.RenderTexture'        // 渲染纹理
| 'cc.AnimationGraph'       // 动画图
| 'cc.AnimationMask'        // 动画遮罩
| 'cc.AnimationGraphVariant';

/** 支持创建的资源类型（从常量数组派生） */
export declare type ISupportCreateType = typeof SUPPORT_CREATE_TYPES[number];

export declare interface ITargetOverrideInfo {
    source: string;
    sourceInfo?: string[];
    propertyPath: string[];
    target: string;
    targetInfo?: string[];
}

/**
 * Direct Scene-webview binary data for the currently inspected Terrain block.
 *
 * `layers` maps the block's RGBA channel slots to Terrain layers. A null slot has no
 * assigned Terrain layer; a non-null slot retains its layer index even without a detail map.
 * When present, `weight.data` is a defensive, row-major RGBA8 snapshot: four bytes for every texel.
 * It is intentionally not JSON-serializable; a future transport must encode it at
 * that transport's seam rather than changing this direct webview interface.
 */
export declare interface ITerrainBlockData {
    index: {
        x: number;
        y: number;
    };
    layers: Array<ITerrainBlockLayerSlot | null>;
    weight: {
        width: number;
        height: number;
        data: Uint8Array;
    } | null;
}

/** One Terrain layer assigned to an RGBA channel in a selected Terrain block. */
export declare interface ITerrainBlockLayerSlot {
    /** The authoritative index into the selected Terrain component's layer list. */
    layerIndex: number;
    /** The assigned layer's detail map, when the layer has one. */
    detailMapUuid: string | null;
}

/** A valid target may have no currently inspected block. */
export declare interface ITerrainBlockSnapshot {
    target: ITerrainTarget;
    valid: true;
    block: ITerrainBlockData | null;
}

/** A partial, non-asset numeric brush-session update. Brush image selection is controlled by dedicated asset commands. */
export declare interface ITerrainBrushPatch {
    radius?: number;
    strength?: number;
    rotation?: number;
    setHeight?: number;
}

/** JSON-safe, non-asset Terrain editor brush state. */
export declare interface ITerrainBrushState {
    kind: TerrainBrushKind;
    imageUuid: string | null;
    radius: number;
    strength: number;
    rotation: number;
    setHeight: number;
}

/** The canonical editor-session state for one valid Terrain target. */
export declare interface ITerrainEditorState {
    manage: ITerrainManageState;
    layers: Array<ITerrainLayerState | null>;
    mode: TerrainEditorMode;
    currentLayer: number;
    sculpt: ITerrainSculptState;
    paint: ITerrainPaintState;
}

/** A rejected target has no usable Terrain state attached to it. */
export declare interface ITerrainInvalidSnapshot {
    target: ITerrainTarget;
    valid: false;
}

/** A partial JSON-safe Terrain layer update: omitted fields are unchanged, null texture UUIDs clear maps, and other UUIDs must resolve to compatible Texture2D assets. */
export declare interface ITerrainLayerPatch {
    detailMapUuid?: string | null;
    normalMapUuid?: string | null;
    metallic?: number;
    roughness?: number;
    tileSize?: number;
}

/** JSON-safe Terrain layer data. Its array index is the Terrain layer slot. */
export declare interface ITerrainLayerState {
    detailMapUuid: string | null;
    normalMapUuid: string | null;
    metallic: number;
    roughness: number;
    tileSize: number;
}

/** A complete JSON-safe TerrainInfo snapshot and `saveManage` payload; map sizes and block counts must be positive integers. */
export declare interface ITerrainManageState {
    tileSize: number;
    weightMapSize: number;
    lightMapSize: number;
    blockCount: [number, number];
}

/** A partial Paint session update that does not assign brush assets or create Scene Undo entries. */
export declare interface ITerrainPaintSessionPatch {
    brush?: ITerrainBrushPatch;
}

/** Canonical Paint session state for a valid Terrain target. */
export declare interface ITerrainPaintState {
    brush: ITerrainBrushState;
}

/** A partial Sculpt session update that does not assign brush assets or create Scene Undo entries. */
export declare interface ITerrainSculptSessionPatch {
    tool?: TerrainSculptTool;
    brush?: ITerrainBrushPatch;
}

/** Canonical Sculpt session state for a valid Terrain target. */
export declare interface ITerrainSculptState {
    tool: TerrainSculptTool;
    brush: ITerrainBrushState;
}

/**
 * Target-safe Terrain editor capability consumed by the Scene webview.
 *
 * Reads and commands always require an explicit node/component pair. Results are
 * canonical snapshots; a `valid: false` result must replace any cached state.
 * A rejected target does not mutate Terrain or create a new Undo entry.
 */
export declare interface ITerrainService {
    readonly name: 'cc.Terrain';
    readonly editedComponents: Terrain[];
    readonly selectedComponents: Terrain[];
    isTerrainChange: boolean;
    select(nodeUuid: string): void;
    unselect(nodeUuid: string): void;
    close(): Promise<0 | 1 | 2>;
    saveAsset(isClose?: boolean, component?: Terrain): Promise<0 | 1 | 2>;
    saveAssetDialog(file?: string, isClose?: boolean): Promise<0 | 1 | 2>;
    addAssetToComp(assetUuid: string): Promise<void>;
    serialize(component: Terrain): Uint8Array;
    onSculpt(node: any): void;
    /** Reads the canonical state for one explicit target without mutating Terrain. */
    read(target: ITerrainTarget): TerrainReadResult;
    /** Changes the active editor mode without mutating Terrain assets or creating Scene Undo. */
    setMode(target: ITerrainTarget, mode: TerrainEditorMode): TerrainReadResult;
    /** Changes the active Paint layer; pass `-1` to clear it without creating Scene Undo. */
    setCurrentLayer(target: ITerrainTarget, currentLayer: number): TerrainReadResult;
    /** Applies a partial Sculpt session update without assigning brush assets or creating Scene Undo. */
    setSculptSession(target: ITerrainTarget, patch: ITerrainSculptSessionPatch): TerrainReadResult;
    /** Assigns a Texture2D asset UUID to Sculpt; pass null to clear it and restore the circle brush without creating Scene Undo. */
    setSculptBrushAsset(target: ITerrainTarget, assetUuid: string | null): Promise<TerrainReadResult>;
    /** Assigns a Texture2D asset UUID to Paint; pass null to clear it and restore the circle brush without creating Scene Undo. */
    setPaintBrushAsset(target: ITerrainTarget, assetUuid: string | null): Promise<TerrainReadResult>;
    /** Applies a partial Paint session update without assigning brush assets or creating Scene Undo. */
    setPaintSession(target: ITerrainTarget, patch: ITerrainPaintSessionPatch): TerrainReadResult;
    /** Commits a complete Manage draft as one TerrainInfo/Undo mutation. */
    saveManage(target: ITerrainTarget, manage: ITerrainManageState): Promise<TerrainReadResult>;
    /** Adds a fully specified Terrain layer; `detailMapUuid` must identify a compatible Texture2D. */
    addLayer(target: ITerrainTarget, layer: ITerrainLayerState): Promise<TerrainReadResult>;
    /** Removes one Terrain layer slot and returns the authoritative state. */
    removeLayer(target: ITerrainTarget, index: number): Promise<TerrainReadResult>;
    /** Applies one explicit layer patch and returns the authoritative state. */
    updateLayer(target: ITerrainTarget, index: number, patch: ITerrainLayerPatch): Promise<TerrainReadResult>;
    /** Reads the current block without mutation or Scene Undo; `block` is null when no block is selected. */
    readBlock(target: ITerrainTarget): TerrainBlockReadResult;
}

/** A usable authoritative snapshot. Read its hydration state only after narrowing `valid` to `true`. */
export declare interface ITerrainSnapshot extends ITerrainEditorState {
    target: ITerrainTarget;
    /** The persisted .terrain asset UUID, or null when this Terrain is not saveable yet. */
    assetUuid: string | null;
    valid: true;
}

/** Identifies one Terrain component without relying on the active gizmo selection. */
export declare interface ITerrainTarget {
    nodeUuid: string;
    componentUuid: string;
}

export declare interface IUIService {
    alignSelection(type: UIAlignType): Promise<void>;
    distributeSelection(type: UIAlignType): Promise<void>;
}

/** beginRecording 的选项。 */
export declare interface IUndoBeginOptions {
    /** 展示在 undo 历史 UI 里的名称。 */
    label?: string;
    /** 兼容旧调用点的别名，后续逐步迁移到 label。 */
    tag?: string;
    /** 可选的命令作用域；用于上层在提交后做 scoped undo/吸收判断。 */
    scope?: IUndoScope;
    /**
     * 自定义可撤销命令，内部自带 undo()/redo() 逻辑。
     * 传入后会跳过默认的属性快照模式，直接使用这个命令。
     */
    customCommand?: IUndoCommand;
}

export declare interface IUndoCheckpoint {
    commandId: string | null;
    generation: number;
    /** 当游标回到 checkpoint 之前时，是否将 checkpoint 所在命令计入差异。 */
    includeCheckpointCommand?: boolean;
}

export declare interface IUndoCommand {
    meta: IUndoCommandMeta;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}

export declare interface IUndoCommandMeta {
    id: string;
    label: string;
    type: string;
    scope: IUndoScope;
    timestamp: number;
}

export declare interface IUndoGroupOptions {
    label?: string;
}

export declare interface IUndoOperationOptions {
    scope?: Partial<IUndoScope>;
}

export declare interface IUndoPushWithPreviousOptions {
    label?: string;
    type: string;
    scope: IUndoScope;
    previousScope?: Partial<IUndoScope>;
    previousTypes?: string[];
}

export declare interface IUndoRedoResult {
    success: boolean;
    commandId?: string;
    label?: string;
    reason?: string;
}

export declare interface IUndoScope {
    assetUuid?: string;
    assetUrl?: string;
    nodePath?: string;
    propPath?: string;
    editorType?: 'scene' | 'prefab' | 'animation' | string;
    mode?: 'general' | 'prefab' | 'animation' | 'preview' | string;
}

export declare interface IUndoService {
    /**
     * 开始记录指定对象的属性快照。
     * 返回的 commandId 需要传给 endRecording / cancelRecording。
     */
    beginRecording(uuids: string[], options?: IUndoBeginOptions): string;
    /**
     * 将 commandId 对应的录制结果提交到 undo 栈。
     * 如果 dirty 状态发生变化，会触发 dirty:changed。
     */
    endRecording(commandId: string): Promise<void>;
    /**
     * 丢弃 commandId 对应的录制结果，不推入 undo 栈。
     */
    cancelRecording(commandId: string): void;
    /** 撤销最近一条可撤销命令。 */
    undo(options?: IUndoOperationOptions): Promise<IUndoRedoResult>;
    /** 重做最近撤销的一条命令。 */
    redo(options?: IUndoOperationOptions): Promise<IUndoRedoResult>;
    beginGroup(options?: IUndoGroupOptions): string;
    endGroup(groupId: string): IUndoRedoResult;
    cancelGroup(groupId: string): IUndoRedoResult;
    isGroupActive(): boolean;
    /** 业务 service 显式推入可撤销命令的内部入口。 */
    push(command: IUndoCommand): void;
    /** 将新命令与紧邻栈顶的连续匹配命令合并；栈顶不匹配时退化为普通 push，不跨过不匹配命令搜索历史栈。 */
    pushWithPrevious(command: IUndoCommand, options: IUndoPushWithPreviousOptions): void;
    /** 清空整个 undo/redo 栈，内部生命周期 API。 */
    reset(): void;
    /** 清空整个 undo/redo 栈。 */
    clearHistory(): void;
    /** 当前场景有未保存变更时返回 true。 */
    isDirty(): boolean;
    /** 记录当前 undo cursor，用于业务层判断某个编辑 session 内的 scoped dirty。 */
    createCheckpoint(): IUndoCheckpoint;
    /** 当前 cursor 和 checkpoint 之间存在匹配 scope 的命令差异时返回 true。 */
    hasScopedDifference(checkpoint: IUndoCheckpoint, scope: Partial<IUndoScope>): boolean;
    /** 当前 cursor 与 checkpoint 之间存在匹配 scope 的 session 差异时返回 true；可按 checkpoint 标记包含其所在命令。 */
    hasScopedDifferenceAfterCheckpoint(checkpoint: IUndoCheckpoint, scope: Partial<IUndoScope>): boolean;
    /** 丢弃 checkpoint 之后匹配 scope 的命令，同时保留不匹配 scope 的命令及其当前状态。 */
    discardScopedChangesAfterCheckpoint(checkpoint: IUndoCheckpoint, scope: Partial<IUndoScope>): Promise<IUndoRedoResult>;
    /** 当前 cursor 和 checkpoint 之间存在不匹配 scope 的命令差异时返回 true。 */
    hasDifferenceOutsideScope(checkpoint: IUndoCheckpoint, scope: Partial<IUndoScope>): boolean;
    /** 至少有一条可撤销命令时返回 true。 */
    canUndo(options?: IUndoOperationOptions): boolean;
    /** 至少有一条可重做命令时返回 true。 */
    canRedo(options?: IUndoOperationOptions): boolean;
    /**
     * 将当前 undo 栈位置标记为已保存状态。
     * 调用后 isDirty() 会立即返回 false。
     */
    markSaved(): void;
    /**
     * 当前存在进行中的录制时返回 true。
     * 传入 uuid 时，只有该 uuid 被某个录制覆盖才返回 true。
     */
    hasActiveRecording(uuid?: string): boolean;
    /** undo/redo 正在应用命令时返回 true。 */
    isApplying(): boolean;
}

export declare interface IUnlinkPrefabParams {
    /** 要解绑的节点路径 */
    nodePath: string;
    /** 是否递归解绑嵌套的预制体实例 */
    removeNested?: boolean;
}

export declare interface IUnpackPrefabInstanceParams {
    /** 要解耦的预制体实例节点 */
    nodePath: string;
    /** 递归解耦所有子预制体 */
    recursive?: boolean;
}

export declare interface IVec3 {
    x: number;
    y: number;
    z: number;
}

/** glTF 虚拟子资源的通用 userData */
export declare interface IVirtualAssetUserData {
    /** 在 glTF 文件中的索引 */
    gltfIndex?: number;
    /** mesh 资源的面数 */
    triangleCount?: number;
    /** mesh 所在 lod 层级 */
    lodLevel?: number;
    /** 根据 lod 配置自动生成 */
    lodOptions?: {
        /** 自动生成的 mesh 占原 mesh 的百分比 */
        faceCount: number;
    };
    [key: string]: any;
}

/** JavaScript 资源的 userData */
export declare type JavaScriptAssetUserData = ScriptModuleUserData | PluginScriptUserData;

/** JSON 资源的 userData */
export declare interface JsonAssetUserData {
    /** 是否启用 JSON5 解析 */
    json5?: boolean;
}

export declare interface KerningDict {
    [key: number]: number;
}

/** 标签图集资源的 userData */
export declare interface LabelAtlasAssetUserData {
    itemWidth: number;
    itemHeight: number;
    startChar: string;
    fontSize: number;
    spriteFrameUuid: string;
    _fntConfig: FntData;
}

export declare interface LODsOption {
    // 屏占比
    screenRatio: number;
    // 和 lod0 的减面比
    faceCount: number;
}

export declare interface Mat4 {
    m00: number;
    m01: number;
    m02: number;
    m03: number;

    m04: number;
    m05: number;
    m06: number;
    m07: number;

    m08: number;
    m09: number;
    m10: number;
    m11: number;

    m12: number;
    m13: number;
    m14: number;
    m15: number;
}

export declare interface MeshClusterOptions {
    enable: boolean;
    coneCluster?: boolean;
}

export declare interface MeshCompressOptions {
    enable: boolean;
    encode?: boolean;
    compress?: boolean;
    quantize?: boolean;
}

export declare interface MeshOptimizeOptions {
    enable: boolean;
    vertexCache?: boolean;
    vertexFetch?: boolean;
    overdraw?: boolean;
}

export declare interface MeshOptimizerOption {
    // 是否启用此功能
    enable: boolean;
    // 减面算法，默认 simplify
    algorithm?: 'gltfpack' | 'simplify';
    simplifyOptions?: SimplifyOptions;
    // 已废弃，仅做简单记录
    gltfpackOptions?: GltfpackOptions;
}

export declare interface MeshSimplifyOptions {
    enable: boolean;
    targetRatio?: number;
    autoErrorRate?: boolean;
    errorRate?: number;
    lockBoundary?: boolean;
}

export declare enum NodeEventType {
    TRANSFORM_CHANGED = "transform-changed",// 节点改变位置、旋转或缩放事件
    SIZE_CHANGED = "size-changed",// 当节点尺寸改变时触发的事件
    ANCHOR_CHANGED = "anchor-changed",// 当节点锚点改变时触发的事件
    CHILD_ADDED = "child-added",// 节点子类添加
    CHILD_REMOVED = "child-removed",// 节点子类移除
    PARENT_CHANGED = "parent-changed",// 父节点改变时触发的事件
    CHILD_CHANGED = "child-changed",// 子节点改变时触发的事件
    COMPONENT_CHANGED = "component-changed",// 组件数据发生改变时
    ACTIVE_IN_HIERARCHY_CHANGE = "active-in-hierarchy-changed",// 节点在hierarchy是否激活
    NOTIFY_NODE_CHANGED = "notify-node-changed",
    PREFAB_INFO_CHANGED = "prefab-info-changed",// prefab数据改变
    LIGHT_PROBE_CHANGED = "light-probe-changed",// 光照探针数据改变
    LIGHT_PROBE_BAKING_CHANGED = "light-probe-baking-changed",// 光照探针烘焙数据改变
    SET_PROPERTY = "set-property",// 设置节点上的属性
    MOVE_ARRAY_ELEMENT = "move-array-element",// 调整一个数组类型的数据内某个 item 的位置
    REMOVE_ARRAY_ELEMENT = "remove-array-element",// 删除一个数组元素
    CREATE_COMPONENT = "create-component",// 创建一个组件
    RESET_COMPONENT = "reset-component"
}

export declare enum NodeType {
    EMPTY = "Empty",// 空节点
    TERRAIN = "Terrain",// 地形节点
    CAMERA = "Camera",// 摄像机节点(需要用过 TWorkMode 来区分 2D 和 3D)
    SPRITE = "Sprite",// 精灵节点(需要用过 TWorkMode 来区分 2D 和 3D)
    SPRITE_SPLASH = "SpriteSplash",// 单色
    GRAPHICS = "Graphics",// 图形节点
    LABEL = "Label",// 文本节点
    MASK = "Mask",// 遮罩节点
    PARTICLE = "Particle",// 粒子节点(需要用过 TWorkMode 来区分 2D 和 3D)
    TILED_MAP = "TiledMap",// 瓦片地图节点
    CAPSULE = "Capsule",// 胶囊体节点
    CONE = "Cone",// 圆锥体节点
    CUBE = "Cube",// 立方体节点
    CYLINDER = "Cylinder",// 圆柱体节点
    PLANE = "Plane",// 平面节点
    QUAD = "Quad",// 四边形节点
    SPHERE = "Sphere",// 球体节点
    TORUS = "Torus",// 圆环体节点
    BUTTON = "Button",// 按钮节点
    CANVAS = "Canvas",// 画布节点(需要用过 TWorkMode 来区分 2D 和 3D)
    EDIT_BOX = "EditBox",// 输入框节点
    LAYOUT = "Layout",// 布局节点
    PAGE_VIEW = "PageView",// 页面视图节点
    PROGRESS_BAR = "ProgressBar",// 进度条节点
    RICH_TEXT = "RichText",// 富文本节点
    SCROLL_VIEW = "ScrollView",// 滚动视图节点
    SLIDER = "Slider",// 滑动条节点
    TOGGLE = "Toggle",// 切换节点
    TOGGLE_GROUP = "ToggleGroup",// 切换组节点
    VIDEO_PLAYER = "VideoPlayer",// 视频播放器节点
    WEB_VIEW = "WebView",// 网页视图节点
    WIDGET = "Widget",// 小部件节点
    DIRECTIONAL_LIGHT = "Light-Directional",// 平行光
    SPHERE_LIGHT = "Light-Sphere",// 球面光
    SPOT_LIGHT = "Light-Spot",// 聚光灯
    PROBE_LIGHT = "Light-Probe-Group",// 光照探针
    REFLECTION_LIGHT = "Light-Reflection-Probe"
}

export declare enum NormalImportSetting {
    /**
     * 如果模型文件中包含法线信息则导出法线，否则不导出法线。
     */
    optional = 0,
    /**
     * 不在导出的网格中包含法线信息。
     */
    exclude = 1,
    /**
     * 如果模型文件中包含法线信息则导出法线，否则重新计算并导出法线。
     */
    require = 2,
    /**
     * 不管模型文件中是否包含法线信息，直接重新计算并导出法线。
     */
    recalculate = 3
}

export declare type OperationEvent = SceneDragEvent | SceneKeyboardEvent | SceneMouseEvent | 'resize';

/** 粒子资源的 userData */
export declare interface ParticleAssetUserData {
    totalParticles: number;
    life: number;
    lifeVar: number;
    emissionRate: number;
    duration: number;
    srcBlendFactor: number;
    dstBlendFactor: number;
    startColor: any;
    startColorVar: any;
    endColor: any;
    endColorVar: any;
    startSize: number;
    startSizeVar: number;
    endSize: number;
    endSizeVar: number;
    positionType: number;
    sourcePos: any;
    posVar: any;
    angle: number;
    angleVar: number;
    startSpin: number;
    startSpinVar: number;
    endSpin: number;
    endSpinVar: number;
    emitterMode: number;
    gravity: any;
    speed: number;
    speedVar: number;
    radialAccel: number;
    radialAccelVar: number;
    tangentialAccel: number;
    tangentialAccelVar: number;
    rotationIsDir: boolean;
    startRadius: number;
    startRadiusVar: number;
    endRadius: number;
    endRadiusVar: number;
    rotatePerS: number;
    rotatePerSVar: number;
    spriteFrameUuid: string;
}

/** JavaScript 插件脚本的 userData */
export declare interface PluginScriptUserData {
    isPlugin: true;
    /** 界面没有开放给用户。默认开启 */
    experimentalHideCommonJs?: boolean;
    /** 界面没有开放给用户。默认开启 */
    experimentalHideAmd?: boolean;
    /** 仅当 executionScope 为 enclosed 时有效。指定了要模拟的全局变量 */
    simulateGlobals?: string[];
    /** 执行作用域 */
    executionScope?: 'enclosed' | 'global';
    /** 插件执行时机 */
    loadPluginInEditor?: boolean;
    loadPluginInWeb?: boolean;
    loadPluginInMiniGame?: boolean;
    loadPluginInNative?: boolean;
}

/**
 * PolygonCollider2D 顶点重新生成的数据来源。
 */
export declare type Polygon2DPointsSource = 'sprite-alpha' | 'rect-fallback';

/** 场景/预制体资源的 userData */
export declare interface PrefabAssetUserData {
    /** 是否为持久节点 */
    persistent?: boolean;
    /** 同步节点名称 */
    syncNodeName?: string;
}

export declare type PrefabCanvasHandling = 'add-root-ui-transform' | 'create-canvas';

export declare enum PrefabState {
    NotAPrefab = 0,// Normal node, not a Prefab
    PrefabChild = 1,// Child node of a Prefab, without PrefabInstance
    PrefabInstance = 2,// Root node of a Prefab that contains a PrefabInstance
    PrefabLostAsset = 3
}

export declare type ReferenceImageVisibilityReason = 'visible' | 'disabled' | 'no-editor' | 'not-2d' | 'unbound' | 'missing' | 'load-error';

/**
 * 重载结果
 */
export declare enum ReloadResult {
    SUCCESS = 0,
    FAILED = 1,
    QUEUED = 2,
    NO_EDITOR = 3,
    ASSET_NOT_FOUND = 4,
    EDITOR_NOT_FOUND = 5
}

/** 渲染纹理资源的 userData */
export declare interface RenderTextureAssetUserData extends TextureBaseAssetUserData {
    width: number;
    height: number;
}

/** 渲染纹理精灵帧的 userData */
export declare interface RtSpriteFrameAssetUserData {
    /** 图片 UUID 或数据库 URI */
    imageUuidOrDatabaseUri: string;
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
}

/**
 * 场景模板类型
 */
export declare const SCENE_TEMPLATE_TYPE: readonly ["2d", "3d", "quality"];

export declare type SceneDragEvent = 'onDragLeave' | 'onDragOver' | 'onDrop';

export declare type SceneKeyboardEvent = 'keydown' | 'keyup';

export declare type SceneMouseEvent = 'dblclick' | 'mousedown' | 'mousemove' | 'mouseup' | 'mousewheel';

/** JavaScript 脚本模块的 userData */
export declare interface ScriptModuleUserData {
    isPlugin: false;
}

export declare interface SerializedAssetFinder {
    meshes?: Array<string | null>;
    animations?: Array<string | null>;
    skeletons?: Array<string | null>;
    textures?: Array<string | null>;
    materials?: Array<string | null>;
    scenes?: Array<string | null>;
}

export declare interface SimplifyOptions {
    // 压缩比例
    targetRatio?: number;
    // 防止破面
    enableSmartLink?: boolean;
    // 误差距离
    agressiveness?: number;
    // 计算迭代次数
    maxIterationCount?: number;
}

/** Spine 资源的 userData */
export declare interface SpineAssetUserData {
    /** 图集资源的 UUID */
    atlasUuid: string;
}

/** 精灵图集资源的 userData */
export declare interface SpriteAtlasAssetUserData {
    /** 图集纹理名称 */
    atlasTextureName: string;
    /** 纹理 UUID */
    textureUuid: string | null;
    /** 精灵帧列表 */
    frames: SpriteFrameAssetUserData[];
    /** 资源 UUID */
    uuid: string;
    /** 格式版本 */
    format: number;
}

export declare interface SpriteFrameAssetUserData extends SpriteFrameBaseAssetUserData {
    isUuid?: boolean;
    imageUuidOrDatabaseUri: string;
}

export declare interface SpriteFrameBaseAssetUserData {
    trimType?: string;
    trimThreshold: number;
    rotated: boolean;
    offsetX: number;
    offsetY: number;
    trimX: number;
    trimY: number;
    width: number;
    height: number;
    rawWidth: number;
    rawHeight: number;
    borderTop: number;
    borderBottom: number;
    borderLeft: number;
    borderRight: number;
    packable?: boolean;
    pixelsToUnit: number;
    pivotX: number;
    pivotY: number;
    meshType: number;
    vertices: SpriteFrameVertices;
}

export declare interface SpriteFrameVertices {
    rawPosition: number[];
    indexes: number[];
    uv: number[];
    nuv: number[];
    triangles?: number[];
    minPos: number[];
    maxPos: number[];
}

/** 支持创建的资源类型常量数组（用于 Zod enum 和 TypeScript type） */
export declare const SUPPORT_CREATE_TYPES: readonly ["animation-clip", "typescript", "auto-atlas", "effect", "scene", "prefab", "material", "texture-cube", "terrain", "physics-material", "label-atlas", "render-texture", "directory", "effect-header"];

export declare enum TangentImportSetting {
    /**
     * 不在导出的网格中包含正切信息。
     */
    exclude = 0,
    /**
     * 如果模型文件中包含正切信息则导出正切，否则不导出正切。
     */
    optional = 1,
    /**
     * 如果模型文件中包含正切信息则导出正切，否则若纹理坐标存在则重新计算并导出正切。
     */
    require = 2,
    /**
     * 不管模型文件中是否包含正切信息，直接重新计算并导出正切。
     */
    recalculate = 3
}

export declare type TEditorEntity = IScene | INode;

export declare type TEditorInstance = Scene | Node_2;

/** A block-read result. A valid target may still have `block: null` when no block is selected. */
export declare type TerrainBlockReadResult = ITerrainBlockSnapshot | ITerrainInvalidSnapshot;

/** The brush implementation currently selected for a Terrain editor session. */
export declare type TerrainBrushKind = 'circle' | 'image';

/** The active non-asset Terrain editor view; `block` is read-only block inspection. */
export declare type TerrainEditorMode = 'manage' | 'sculpt' | 'paint' | 'block';

/** Discriminated read result. Callers must replace cached state when `valid` is `false`. */
export declare type TerrainReadResult = ITerrainSnapshot | ITerrainInvalidSnapshot;

/** The Sculpt behavior applied while the editor is in `sculpt` mode. */
export declare type TerrainSculptTool = 'bulge' | 'sunken' | 'smooth' | 'flatten' | 'set-height';

export declare interface Texture2DAssetUserData extends TextureBaseAssetUserData {
    isUuid?: boolean;
    imageUuidOrDatabaseUri?: string;
}

export declare interface TextureBaseAssetUserData {
    wrapModeS: WrapMode;
    wrapModeT: WrapMode;
    minfilter: Filter;
    magfilter: Filter;
    mipfilter: Filter;
    anisotropy: number;
}

export declare interface TextureCubeAssetUserData extends TextureBaseAssetUserData {
    imageDatabaseUri?: string;
    isRGBE: boolean;

    mipBakeMode: number;
    /**
     * `0` 意味着默认。见 https://github.com/cocos-creator/3d-tasks/issues/2253
     */
    faceSize?: number;
    // 符号资源 uuid
    sign?: string;

    // 六个面的 UUID
    front?: string;
    back?: string;
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
}

export declare type TSceneTemplateType = typeof SCENE_TEMPLATE_TYPE[number];

export declare type UIAlignType = 'top' | 'v-center' | 'bottom' | 'left' | 'h-center' | 'right';

export declare interface Vec2 {
    x: number;
    y: number;
}

export declare interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export declare interface Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
}

export declare type WrapMode = 'repeat' | 'clamp-to-edge' | 'mirrored-repeat';

export { }
