import { AnimationClip, AnimationState, Node } from 'cc';
export declare class AnimationStateRegistry {
    private readonly _getRootNode;
    private readonly _loadClip;
    private readonly _states;
    constructor(_getRootNode: () => Node, _loadClip: (uuid: string) => Promise<AnimationClip>);
    get(uuid: string): AnimationState | undefined;
    getOrCreate(uuid: string): Promise<AnimationState>;
    create(uuid: string, clip: AnimationClip): AnimationState;
    reset(uuid: string): void;
    clear(): void;
}
