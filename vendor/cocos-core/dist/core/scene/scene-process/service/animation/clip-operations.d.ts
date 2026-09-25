import type { AnimationClip } from 'cc';
import type { IAnimationOperation, IAnimationOperationResult } from '../../../common';
import { type IPropertyCurveOperationContext } from './property-curve';
export declare function validateAnimationOperation(operation: IAnimationOperation, currentClipUuid: string): IAnimationOperationResult | null;
export declare function isSupportedClipOperation(funcName: string): boolean;
export declare function applyClipOperation(clip: AnimationClip, operation: IAnimationOperation, context: IPropertyCurveOperationContext): Promise<boolean>;
