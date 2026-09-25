import { InteractivePreview } from './interactive-preview';
import { Scene } from 'cc';
export declare class ModelPreview extends InteractivePreview {
    private lightComp;
    createNodes(scene: Scene): void;
    private resolvePrefabUuid;
    setModel(uuid: string): Promise<unknown>;
    resetCameraView(): void;
    setLightEnable(enable: boolean): void;
}
