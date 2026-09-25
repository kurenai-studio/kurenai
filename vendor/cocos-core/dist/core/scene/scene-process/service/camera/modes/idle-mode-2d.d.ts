import { ModeBase2D } from './mode-base-2d';
import type { CameraController2D } from '../camera-controller-2d';
declare class IdleMode2D extends ModeBase2D {
    constructor(cameraCtrl: CameraController2D);
    enter(): Promise<void>;
    exit(): Promise<void>;
}
export { IdleMode2D };
