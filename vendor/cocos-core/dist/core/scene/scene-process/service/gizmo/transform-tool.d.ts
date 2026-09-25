import { IVec3Like } from 'cc';
import { EventEmitter } from 'events';
export interface ISnapConfigData {
    position: IVec3Like;
    rotation: number;
    scale: number;
    isPositionSnapEnabled: boolean;
    isRotationSnapEnabled: boolean;
    isScaleSnapEnabled: boolean;
}
export declare class SnapConfigs extends EventEmitter {
    private _position;
    private _rotation;
    private _scale;
    private _isPositionSnapEnabled;
    private _isRotationSnapEnabled;
    private _isScaleSnapEnabled;
    get position(): IVec3Like;
    set position(value: IVec3Like);
    get rotation(): number;
    set rotation(value: number);
    get scale(): number;
    set scale(value: number);
    get isPositionSnapEnabled(): boolean;
    set isPositionSnapEnabled(value: boolean);
    get isRotationSnapEnabled(): boolean;
    set isRotationSnapEnabled(value: boolean);
    get isScaleSnapEnabled(): boolean;
    set isScaleSnapEnabled(value: boolean);
    getPureDataObject(): ISnapConfigData;
    initFromData(data: ISnapConfigData): void;
}
export type TransformToolDataToolNameType = 'view' | 'position' | 'rotation' | 'scale' | 'rect';
export declare const transformToolDataToolNameTypeList: string[];
export type TransformToolDataCoordinateType = 'local' | 'global';
export type TransformToolDataPivotType = 'pivot' | 'center';
export type TransformToolDataViewMode = 'view' | 'select';
export declare class TransformToolData extends EventEmitter {
    private _toolName;
    private _viewMode;
    private _coordinate;
    private _pivot;
    private _isLocked;
    private _is2D;
    private _scale2D;
    snapConfigs: SnapConfigs;
    get toolName(): TransformToolDataToolNameType;
    set toolName(value: TransformToolDataToolNameType);
    get viewMode(): TransformToolDataViewMode;
    set viewMode(value: TransformToolDataViewMode);
    get coordinate(): TransformToolDataCoordinateType;
    set coordinate(value: TransformToolDataCoordinateType);
    get pivot(): TransformToolDataPivotType;
    set pivot(value: TransformToolDataPivotType);
    get isLocked(): boolean;
    set isLocked(value: boolean);
    get is2D(): boolean;
    set is2D(value: boolean);
    get scale2D(): number;
    set scale2D(value: number);
    set cameraOrthoHeight(value: number);
}
