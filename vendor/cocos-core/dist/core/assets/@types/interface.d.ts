/** 所有资源处理器类型的常量数组（用于 Zod enum 和 TypeScript type） */
export declare const ASSET_HANDLER_TYPES: readonly ["directory", "unknown", "text", "json", "spine-data", "dragonbones", "dragonbones-atlas", "terrain", "javascript", "typescript", "scene", "prefab", "sprite-frame", "tiled-map", "buffer", "image", "sign-image", "alpha-image", "texture", "texture-cube", "erp-texture-cube", "render-texture", "texture-cube-face", "rt-sprite-frame", "gltf", "gltf-mesh", "gltf-animation", "gltf-skeleton", "gltf-material", "gltf-scene", "gltf-embeded-image", "fbx", "material", "physics-material", "effect", "effect-header", "audio-clip", "animation-clip", "animation-graph", "animation-graph-variant", "animation-mask", "ttf-font", "bitmap-font", "particle", "sprite-atlas", "auto-atlas", "label-atlas", "render-pipeline", "render-stage", "render-flow", "instantiation-material", "instantiation-mesh", "instantiation-skeleton", "instantiation-animation", "video-clip", "*", "database"];
/** 支持创建的资源类型常量数组（用于 Zod enum 和 TypeScript type） */
export declare const SUPPORT_CREATE_TYPES: readonly ["animation-clip", "typescript", "auto-atlas", "effect", "scene", "prefab", "material", "texture-cube", "terrain", "physics-material", "label-atlas", "render-texture", "directory", "effect-header"];
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
