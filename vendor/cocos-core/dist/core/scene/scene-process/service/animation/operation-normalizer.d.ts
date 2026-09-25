import type { Node } from 'cc';
import type { IAnimationOperation, IAnimationOperationResult, IAnimationQueryPropertyValueAtFrameOptions, IAnimationValue } from '../../../common';
interface IAnimationOperationNormalizerContext {
    currentClipUuid: string;
    rootNode: Node;
    rootPath: string;
    queryPropertyValueAtFrame(options: IAnimationQueryPropertyValueAtFrameOptions): Promise<IAnimationValue>;
}
export declare function normalizeAnimationOperation(operation: IAnimationOperation, context: IAnimationOperationNormalizerContext): Promise<IAnimationOperation | IAnimationOperationResult>;
export {};
