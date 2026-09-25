import { Camera, Color, MeshRenderer, Node } from 'cc';
export declare enum CameraMoveMode {
    IDLE = 0,
    ORBIT = 1,
    PAN = 2,
    ZOOM = 3,
    WANDER = 4
}
export declare class CameraUtils {
    static updateVBAttr(comp: MeshRenderer | null, attr: string, data: number[]): void;
    static updateIB(comp: MeshRenderer | null, data: number[]): void;
    static grid(width: number, length: number, segw: number, segl: number): {
        positions: number[];
        uvs: number[];
        indices: number[];
        minPos: any;
        maxPos: any;
    };
    static createStrokeGrid(w: number, l: number, parentNode: Node): MeshRenderer;
    static createGrid(effectName: string, parentNode: Node): MeshRenderer;
    static createCamera(color: Color, parentNode: Node, componentClass?: typeof Camera): Camera;
    private static _snapTipElement;
    private static _snapTipTimeout;
    static showSnapTip(duration?: number): void;
    static hideSnapTip(): void;
    private static _wanderTipElement;
    private static _wanderTipTimeout;
    static showWanderTip(duration?: number): void;
    static hideWanderTip(): void;
    private static _speedToastElement;
    private static _speedToastTimeout;
    static showWanderSpeedToast(speedScale: number, speed: number): void;
    private static _hideSpeedToast;
}
