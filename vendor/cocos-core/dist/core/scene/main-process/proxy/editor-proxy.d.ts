import { IOpenOptions, IPublicEditorService, ISceneInfo, INodeInfo } from '../../common';
export interface IEditorProxy extends Omit<IPublicEditorService, 'open' | 'queryCurrent'> {
    open(params: IOpenOptions): Promise<ISceneInfo | INodeInfo>;
    queryCurrent(): Promise<ISceneInfo | INodeInfo | null>;
}
export declare const EditorProxy: IEditorProxy;
