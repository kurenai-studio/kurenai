import type { AnimationState } from 'cc';
import type { AnimationEventReason, AnimationPlayState } from '../../../common';
export interface IAnimationServicePlaybackContext {
    getCurrentState(): AnimationState | undefined;
    getEditTime(): number;
    getPlayState(): AnimationPlayState;
    setEditTime(time: number): void;
    setPlayState(playState: AnimationPlayState): void;
    enterAnimationMode(): void;
    exitAnimationMode(): void;
    repaintInEditMode(): Promise<void>;
    broadcastTimeChanged(reason: AnimationEventReason): void;
    broadcastStateChanged(reason: AnimationEventReason): Promise<void>;
}
export declare class AnimationServicePlayback {
    private readonly _context;
    private _playbackTimeBroadcastTimer;
    private _lastPlaybackBroadcastTime;
    constructor(_context: IAnimationServicePlaybackContext);
    play(state: AnimationState): void;
    pause(state: AnimationState): void;
    resume(state: AnimationState): void;
    stopCurrent(): Promise<void>;
    dispose(): void;
    private _startPlaybackTimeBroadcast;
    private _stopPlaybackTimeBroadcast;
    private _broadcastPlaybackTimeTick;
}
