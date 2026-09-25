import { InteractivePreview } from './interactive-preview';
import { Scene } from 'cc';
export declare class SkeletonPreview extends InteractivePreview {
    private lightComp;
    private jointNodes;
    createNodes(scene: Scene): void;
    setSkeleton(uuid: string): Promise<void>;
    private drawSkeletonLines;
    private clearJoints;
    resetCameraView(): void;
}
