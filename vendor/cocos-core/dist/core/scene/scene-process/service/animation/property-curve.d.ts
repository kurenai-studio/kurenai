import { AnimationClip, Node } from 'cc';
import type { IAnimationCurveDump, IAnimationPropertyType, IAnimationValue } from '../../../common';
import type { IDumpRealKeyDataOptions } from './real-curve-key-data';
import type { ICopyPropertyKeysOperation, ICreatePropertyKeyOperation, IMovePropertyKeysOperation, IPropertyKeyFramesOperation, IPropertyTarget, ISetPropertyCurveExtrapolationOperation, IUpdatePropertyKeyDataOperation } from './property-curve-types';
export interface IAnimationPropertyMetadata {
    type: IAnimationPropertyType;
    valueCtor?: new () => unknown;
}
export interface IPropertyCurveMetadataContext {
    queryPropertyMetadata?: (nodePath: string, propKey: string) => IAnimationPropertyMetadata | null;
}
export interface IPropertyCurveOperationContext extends IPropertyCurveMetadataContext {
    rootNode: Node;
    rootPath: string;
}
export declare function dumpPropertyCurves(clip: AnimationClip, options?: IDumpRealKeyDataOptions & IPropertyCurveMetadataContext): IAnimationCurveDump[];
export declare function createPropertyKey(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: ICreatePropertyKeyOperation): boolean;
export declare function addPropertyCurve(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: IPropertyTarget & {
    value?: IAnimationValue;
}): boolean;
export declare function updatePropertyKey(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: ICreatePropertyKeyOperation): boolean;
export declare function updatePropertyKeyData(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: IUpdatePropertyKeyDataOperation): boolean;
export declare function removePropertyKey(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: IPropertyKeyFramesOperation): boolean;
export declare function removePropertyKeys(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: IPropertyKeyFramesOperation): boolean;
export declare function removePropertyCurve(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: IPropertyTarget): boolean;
export declare function movePropertyKeys(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: IMovePropertyKeysOperation): boolean;
export declare function copyPropertyKeysTo(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: ICopyPropertyKeysOperation): boolean;
export declare function setPropertyCurveExtrapolation(clip: AnimationClip, context: IPropertyCurveOperationContext, operation: ISetPropertyCurveExtrapolationOperation): boolean;
export declare function replacePropertyCurves(clip: AnimationClip, curves: IAnimationCurveDump[]): boolean;
