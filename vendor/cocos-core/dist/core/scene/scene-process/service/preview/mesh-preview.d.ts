import { InteractivePreview } from './interactive-preview';
import { Scene } from 'cc';
export declare class MeshPreview extends InteractivePreview {
    private lightComp;
    private _modelComp;
    private _defaultMat;
    createNodes(scene: Scene): void;
    setMesh(uuid: string): Promise<null | undefined>;
    resetCameraView(): void;
}
