import { Color, Node, Size, Vec2, Vec3 } from 'cc';
import { RectangleController } from '../../node/rectangle-controller';
import type { IRectangleControllerOption } from '../../utils/defines';
export default class LODController extends RectangleController {
    static readonly LABEL_CONTENT_SIZE: Size;
    static readonly FONT_COLOR: Color;
    static readonly OUTLINE_COLOR: Color;
    static readonly FONT_SIZE = 32;
    private readonly _canvasNode;
    private readonly _label;
    private readonly _labelTransform;
    constructor(rootNode: Node, options?: IRectangleControllerOption);
    destroy(): void;
    setString(value: string): void;
    updateSize(center: Readonly<Vec3>, size: Vec2): void;
    adjustControllerSize(): void;
}
