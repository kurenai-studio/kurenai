import { CameraComponent, Node } from 'cc';
import { PreviewBase } from '../preview-base';
export declare class MiniPreview extends PreviewBase {
    previewNodes: any;
    scene: any;
    renderScene: any;
    currNode: any;
    _previewInfo: any;
    init(registerName: string, queryName: string): void;
    setPreviewResolution(width: number, height: number): void;
    setAspect(srcCamCom: any, tarCam: any): void;
    onNodeChanged(node: Node, opts: any): void;
    onNodeRemoved(node: Node): void;
    handleSelect(uuid: string): void;
    handleUnselect(uuid: string): void;
    onComponentRemoved(comp: CameraComponent): void;
    private clearByComponent;
    removePreviewNode(srcCamera: CameraComponent): void;
    createPreviewNode(srcCamera: CameraComponent): any;
    getPreviewInfo(): any;
}
