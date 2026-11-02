// Import from "wanaka-studio-engine/audio".

import type { LifetimeScope } from "wanaka-studio-engine";
import { Audio as ThreeAudio, Object3D, PositionalAudio } from "three/webgpu";

export interface PlayAudioOptions {
    readonly volume?: number;
    readonly loop?: boolean;
    /** Mixer bus name; defaults to `master`. */
    readonly channel?: string;
    /** Playback start offset into the decoded clip. */
    readonly offsetSeconds?: number;
    /** Game spatial source. The PositionalAudio child follows its world matrix. */
    readonly object?: Object3D;
}

export interface AudioVoice {
    /** Scope-owned native Three audio object for filters and positional controls. */
    readonly audio: ThreeAudio | PositionalAudio;
    stop(): void;
    pause(): void;
    resume(): void;
    seek(offsetSeconds: number): void;
    readonly ended: boolean;
    readonly paused: boolean;
}

/** Scope-owned mixer and clip cache built on Three.Audio and PositionalAudio. */
export class AudioSession {
    private constructor();
    static create(scope: LifetimeScope): AudioSession;
    /** Sets the session AudioListener master gain, including unbound listeners. Values outside 0..1 are rejected. */
    setMasterVolume(volume: number): void;
    unlock(): Promise<void>;
    load(url: string): Promise<AudioBuffer>;
    setChannelVolume(channel: string, volume: number): void;
    play(url: string, options?: PlayAudioOptions): AudioVoice;
    /**
     * Binds Three's native listener to the camera or another Object3D.
     */
    bindListener(object: Object3D): void;
    pauseAll(): void;
    resumeAll(): void;
    stopAll(): void;
}
