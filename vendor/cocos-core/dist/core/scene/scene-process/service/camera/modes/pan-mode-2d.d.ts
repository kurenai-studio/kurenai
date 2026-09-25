import { ModeBase2D } from './mode-base-2d';
import type { ISceneMouseEvent } from '../../operation/types';
import type { CameraController2D } from '../camera-controller-2d';
declare class PanMode2D extends ModeBase2D {
    constructor(cameraCtrl: CameraController2D);
    enter(): Promise<void>;
    exit(): Promise<void>;
    onMouseMove(event: ISceneMouseEvent): boolean;
}
export { PanMode2D };
