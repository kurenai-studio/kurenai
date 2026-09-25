import { InteractivePreview } from './interactive-preview';
import { Scene } from 'cc';
import type { ISpinePreviewInstance } from '../../../common/preview';
export declare class SpinePreview extends InteractivePreview implements ISpinePreviewInstance {
    protected is2D: boolean;
    protected enableViewToggle: boolean;
    protected orthoScale: number;
    private skeletonComponent;
    private _spineData;
    private _animTimer;
    createNodes(scene: Scene): void;
    setSpine(uuid: string): Promise<void>;
    getSpineData(): any;
    play(): void;
    pause(): void;
    stop(): void;
    setSkinIndex(index: number): void;
    setAnimationIndex(index: number): void;
    private startAnimationUpdate;
    private stopAnimationUpdate;
    close(): void;
    resetCameraView(): void;
}
