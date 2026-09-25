/**
 * 场景模板类型
 */
export declare const SCENE_TEMPLATE_TYPE: readonly ["2d", "3d", "quality"];
export type TSceneTemplateType = typeof SCENE_TEMPLATE_TYPE[number];
/**
 * 创建类型
 */
export declare const CREATE_TYPES: readonly ["scene", "prefab"];
export type ICreateType = typeof CREATE_TYPES[number];
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
