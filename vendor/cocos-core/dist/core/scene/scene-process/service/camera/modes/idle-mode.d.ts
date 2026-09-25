import ModeBase3D from './mode-base-3d';
import type { CameraController3D } from '../camera-controller-3d';
declare class IdleMode extends ModeBase3D {
    constructor(cameraCtrl: CameraController3D);
    enter(): Promise<void>;
    exit(): Promise<void>;
}
export default IdleMode;
