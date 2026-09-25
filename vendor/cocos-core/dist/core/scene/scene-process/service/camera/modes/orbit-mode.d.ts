import ModeBase3D from './mode-base-3d';
import type { ISceneMouseEvent } from '../../operation/types';
import type { CameraController3D } from '../camera-controller-3d';
declare class OrbitMode extends ModeBase3D {
    private _rotateSpeed;
    constructor(cameraCtrl: CameraController3D);
    enter(): Promise<void>;
    exit(): Promise<void>;
    onMouseDown(event: ISceneMouseEvent): boolean;
    onMouseMove(event: ISceneMouseEvent): boolean;
    onMouseUp(event: ISceneMouseEvent): boolean;
}
export default OrbitMode;
