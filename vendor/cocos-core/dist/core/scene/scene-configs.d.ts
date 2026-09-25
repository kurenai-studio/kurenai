import { ConfigurationScope } from '../configuration';
import type { IReferenceImageConfig } from './common/reference-image';
export interface IOriginAxesConfig {
    x: boolean;
    y: boolean;
    z: boolean;
}
export interface ICameraConfig {
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
export interface IRectSnapConfig {
    enableSnapping: boolean;
    snapThreshold: number;
}
export interface IGizmoConfig {
    is2D: boolean;
    is3DIcon: boolean;
    iconSize: number;
    transformToolName: string;
    viewMode: 'view' | 'select';
    pivot: string;
    coordinate: string;
    toolsVisibility3d: boolean;
    gridVisible: boolean;
    gridColor: number[];
    originAxis2D: IOriginAxesConfig;
    originAxis3D: IOriginAxesConfig;
    snapConfigs?: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: number;
        scale: number;
        isPositionSnapEnabled: boolean;
        isRotationSnapEnabled: boolean;
        isScaleSnapEnabled: boolean;
    };
    rectSnapConfig?: IRectSnapConfig;
}
export interface ISceneViewConfig {
    sceneLightOn: boolean;
}
export interface ISceneConfig {
    /**
     * 是否循环
     */
    tick: boolean;
    /**
     * 编辑器相机配置，与 cocos-editor scene/package.json profile 一致
     */
    camera: ICameraConfig;
    /**
     * Gizmo 配置，与 cocos-editor gizmos-infos profile 一致
     */
    gizmo: IGizmoConfig;
    /**
     * SceneView 配置
     */
    sceneView: ISceneViewConfig;
    /**
     * 各节点上编辑器相机的视角信息（按节点 uuid 存储），运行期由 Camera 服务写入。
     * 提供空默认值以避免首次读取时配置层抛错。
     */
    'camera-infos'?: Record<string, unknown>;
    /**
     * 记录过相机视角信息的节点 uuid 列表，运行期由 Camera 服务写入。
     */
    'camera-uuids'?: string[];
    /** Personal editor-only reference-image library and Scene bindings; never committed with Scene data. */
    referenceImage?: IReferenceImageConfig;
}
declare class SceneConfig {
    private defaultConfig;
    private configInstance;
    private static readonly PERSONAL_KEYS;
    init(): Promise<void>;
    /**
     * 一次性迁移：把历史上写在 project(committed) 里的个人键搬到 local(profiles/)，并从 project 删除，
     * 避免个人配置继续被提交。仅在 local 尚无该键时迁移，避免覆盖已有 local 值。
     */
    private _migratePersonalKeysToLocal;
    private resolveSetScope;
    get<T>(path?: string, scope?: ConfigurationScope): Promise<T>;
    set(path: string, value: any, scope?: ConfigurationScope): Promise<boolean>;
}
export declare const sceneConfigInstance: SceneConfig;
export {};
