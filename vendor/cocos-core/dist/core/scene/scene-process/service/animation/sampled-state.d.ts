import { Node } from 'cc';
export interface IAnimationSampledNodeState {
    uuid: string;
    properties: Record<string, unknown>;
    components: IAnimationSampledComponentState[];
    children: IAnimationSampledNodeState[];
}
interface IAnimationSampledComponentState {
    uuid: string;
    properties: Record<string, unknown>;
}
export declare function captureAnimationSampledState(rootNode: Node): IAnimationSampledNodeState;
export declare function restoreAnimationSampledState(rootNode: Node, state: IAnimationSampledNodeState): Promise<void>;
export {};
