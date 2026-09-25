export interface IPreviewInstance {
    onMouseDown(event: any): void;
    onMouseMove(event: any): void;
    onMouseUp(event: any): void;
    onMouseWheel(event: any): void;
    viewToggle(): void;
    is2DView(): boolean;
    resetCameraView(): void;
    hide(): void;
}
export interface IMaterialPreviewInstance extends IPreviewInstance {
    switchPrimitive(type: string): void;
    setLightEnable(enabled: boolean): void;
}
export interface ISpinePreviewInstance extends IPreviewInstance {
    play(): void;
    pause(): void;
    stop(): void;
    setSkinIndex(index: number): void;
    setAnimationIndex(index: number): void;
    close(): void;
}
export interface IPreviewService {
    open(uuid: string): Promise<IPreviewInstance | null>;
    generateThumbnail(uuid: string, assetType: string, width?: number, height?: number): Promise<any>;
}
export type IPublicPreviewService = Pick<IPreviewService, 'open' | 'generateThumbnail'>;
export interface IPreviewEvents {
}
