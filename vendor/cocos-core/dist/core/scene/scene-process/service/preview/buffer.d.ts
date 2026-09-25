import { EventEmitter } from 'events';
import { gfx } from 'cc';
export interface IWindowInfo {
    index: number;
    uuid: string;
    name: string;
    window?: any;
}
declare class PreviewBuffer extends EventEmitter {
    private _name;
    device: any;
    width: number;
    height: number;
    data: Uint8Array<ArrayBuffer>;
    renderScene: any;
    scene: any;
    windows: Record<string, any>;
    window: any;
    regions: gfx.BufferTextureCopy[];
    renderData: any;
    queue: any[];
    lock: boolean;
    _registerName?: string;
    constructor(registerName: string, name: string, scene?: any);
    resize(width: number, height: number, window?: any): void;
    clear(): void;
    ensureWindow(width?: number, height?: number): void;
    createWindow(uuid?: string | null): void;
    removeWindow(uuid: string): void;
    destroyWindow(window?: any): void;
    onLoadScene(scene: any): void;
    switchCameras(camera: any, currWindow: any): void;
    needInvertGFXApi: gfx.API[];
    copyFrameBuffer(window?: any): any;
    static indexOfRGBA: number[];
    static indexOfBGRA: number[];
    formatBuffer(buffer: Uint8Array, needInvert: boolean, conversionBGRA: boolean): Uint8Array<ArrayBufferLike>;
    getImageDataInQueue(width: number, height: number): Promise<any>;
    step(): Promise<void>;
    getImageData(width: number, height: number): Promise<any>;
}
export default PreviewBuffer;
