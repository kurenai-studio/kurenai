import type { IAnimationOperation, IAnimationOperationResult } from '../../../common';
export declare function isAnimationOperationResult(value: IAnimationOperation | IAnimationOperationResult): value is IAnimationOperationResult;
export declare function shouldSyncClipDuration(operation: IAnimationOperation): boolean;
/**
 * Imported skeletal clips keep the duration authored by the importer. Their
 * editable event/settings operations must not recompute duration from the
 * currently visible event list and accidentally shorten the source clip.
 */
export declare function shouldSyncAnimationClipDuration(operation: IAnimationOperation, isSkeleton: boolean): boolean;
export declare function isAllowedSkeletonAnimationOperation(operation: IAnimationOperation): boolean;
