import { Node, Vec2, Vec3 } from 'cc';
import ControllerBase from './base';
import type { GizmoMouseEvent } from '../utils/defines';
declare class ImageController extends ControllerBase {
    private _center;
    private _size;
    private _imageNode;
    constructor(rootNode: Node, opts?: any);
    initShape(opts?: any): void;
    setTexture(texture: any): void;
    setTextureByUUID(uuid: string): void;
    updateSize(center: Vec3, size: Vec2): void;
    protected onMouseDown(event: GizmoMouseEvent): void;
    protected onMouseMove(event: GizmoMouseEvent): void;
    protected onMouseUp(event: GizmoMouseEvent): void;
}
export default ImageController;
