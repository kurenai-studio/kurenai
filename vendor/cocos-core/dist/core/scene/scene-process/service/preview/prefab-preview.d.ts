import { InteractivePreview } from './interactive-preview';
import { Scene } from 'cc';
export declare class PrefabPreview extends InteractivePreview {
    private lightComp;
    private canvasNode;
    createNodes(scene: Scene): void;
    setPrefab(uuid: string): Promise<null | undefined>;
    resetCameraView(): void;
}
