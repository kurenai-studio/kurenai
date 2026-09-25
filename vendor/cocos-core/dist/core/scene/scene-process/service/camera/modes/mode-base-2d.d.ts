import { Quat, Vec3 } from 'cc';
import IState from '../../utils/state-machine/state-interface';
import { CameraMoveMode } from '../utils';
import type { ISceneMouseEvent, ISceneKeyboardEvent } from '../../operation/types';
import type { CameraController2D } from '../camera-controller-2d';
declare class ModeBase2D implements IState {
    _cameraCtrl: CameraController2D;
    modeName: CameraMoveMode;
    fromState?: IState;
    protected _curRot: Quat;
    protected _curPos: Vec3;
    constructor(cameraCtrl: CameraController2D, modeName: CameraMoveMode);
    enter(opts?: any): Promise<void>;
    exit(): Promise<void>;
    onMouseDBlDown(event: ISceneMouseEvent): boolean;
    onMouseDown(event: ISceneMouseEvent): boolean;
    onMouseMove(event: ISceneMouseEvent): boolean;
    onMouseUp(event: ISceneMouseEvent): boolean;
    onMouseWheel(event: ISceneMouseEvent): void;
    onKeyDown(event: ISceneKeyboardEvent): void;
    onKeyUp(event: ISceneKeyboardEvent): void;
    onUpdate(deltaTime: number): void;
}
export { ModeBase2D };
