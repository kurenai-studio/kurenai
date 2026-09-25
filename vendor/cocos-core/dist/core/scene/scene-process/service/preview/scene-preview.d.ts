import { CameraComponent } from 'cc';
import { PreviewBase } from './preview-base';
export declare class ScenePreview extends PreviewBase {
    device: any;
    width: number;
    height: number;
    init(registerName: string, queryName: string): void;
    onComponentAdded(comp: CameraComponent): void;
    detachSceneCameras(): void;
}
export declare const scenePreview: ScenePreview;
