import { Node } from 'cc';
import type { IAnimationOperation, IAnimationValue } from '../../../common';
type PropertyKeyOperation = Extract<IAnimationOperation, {
    type: 'createPropertyKey' | 'updatePropertyKey';
}>;
export declare function serializeAnimationPropertyValue(value: unknown): IAnimationValue;
export declare function normalizeProvidedAnimationPropertyOperationValue(rootNode: Node, rootPath: string, operation: PropertyKeyOperation): Promise<IAnimationValue>;
export {};
