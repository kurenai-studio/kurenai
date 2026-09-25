import { AnimationClip, Node } from 'cc';
import type { IAnimationSession } from './types';
export declare function saveAnimationServiceClip(options: {
    session: IAnimationSession;
    rootNode: Node;
    clip: AnimationClip;
    target?: string;
}): Promise<boolean>;
