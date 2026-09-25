import ModeBase3D from './mode-base-3d';
import type { ISceneMouseEvent } from '../../operation/types';
import type { CameraController3D } from '../camera-controller-3d';
declare class PanMode extends ModeBase3D {
    private _right;
    private _up;
    private _panningSpeed;
    constructor(cameraCtrl: CameraController3D);
    enter(): Promise<void>;
    exit(): Promise<void>;
    onMouseMove(event: ISceneMouseEvent): boolean;
}
export default PanMode;
