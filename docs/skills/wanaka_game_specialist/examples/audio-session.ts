/**
 * Complete Play-side audio ownership for BGM and sound effects. Create one
 * session on the Play scope, bind the native listener, preload every clip
 * during activation, and call the `FromGesture` methods from a real user
 * gesture. The returned controller owns the voices through the same scope.
 */
import type { Object3D } from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import { AudioSession, type AudioVoice } from 'wanaka-studio-engine/audio';

export interface AudioClipSet {
  readonly music: string;
  readonly cues: Readonly<Record<string, string>>;
}

export interface AudioPlayback {
  readonly session: AudioSession;
  readonly currentMusic: () => AudioVoice | undefined;
  readonly playMusicFromGesture: () => Promise<AudioVoice>;
  readonly playCueFromGesture: (name: string, source?: Object3D) => Promise<AudioVoice>;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly stop: () => void;
  readonly setMasterVolume: (volume: number) => void;
  readonly setChannelVolume: (channel: string, volume: number) => void;
}

export interface AudioControls {
  readonly startMusic: HTMLElement;
  readonly playCue: HTMLElement;
  readonly pause: HTMLElement;
  readonly resume: HTMLElement;
  readonly stop: HTMLElement;
}

export async function createAudioPlayback(
  scope: LifetimeScope,
  listener: Object3D,
  clips: AudioClipSet,
): Promise<AudioPlayback> {
  const audio = AudioSession.create(scope);
  audio.bindListener(listener);

  const urls = new Set([clips.music, ...Object.values(clips.cues)]);
  await Promise.all([...urls].map((url) => audio.load(url)));

  let musicVoice: AudioVoice | undefined;
  const playMusicFromGesture = async (): Promise<AudioVoice> => {
    await audio.unlock();
    musicVoice?.stop();
    musicVoice = audio.play(clips.music, { channel: 'music', loop: true });
    return musicVoice;
  };

  const playCueFromGesture = async (
    name: string,
    source?: Object3D,
  ): Promise<AudioVoice> => {
    const url = clips.cues[name];
    if (url === undefined) {
      throw new Error(`Audio cue "${name}" was not included in the preloaded clip set.`);
    }
    await audio.unlock();
    return source === undefined
      ? audio.play(url, { channel: 'sfx' })
      : audio.play(url, { channel: 'sfx', object: source });
  };

  const stop = (): void => {
    audio.stopAll();
    musicVoice = undefined;
  };
  scope.defer(stop);

  return {
    session: audio,
    currentMusic: () => musicVoice,
    playMusicFromGesture,
    playCueFromGesture,
    pause: () => audio.pauseAll(),
    resume: () => audio.resumeAll(),
    stop,
    setMasterVolume: (volume) => audio.setMasterVolume(volume),
    setChannelVolume: (channel, volume) => audio.setChannelVolume(channel, volume),
  };
}

/**
 * Wire ordinary HTML controls to the playback controller. `unlock` runs from
 * the click handler through the `FromGesture` methods, so no awaited setup
 * step can consume the browser's user activation first.
 */
export function bindAudioControls(
  scope: LifetimeScope,
  playback: AudioPlayback,
  controls: AudioControls,
  cueName: string,
  cueSource: Object3D | undefined,
  onError: (reason: unknown) => void,
): void {
  const run = (operation: () => Promise<unknown>) => (): void => {
    void operation().catch(onError);
  };
  const startMusic = run(playback.playMusicFromGesture);
  const playCue = run(() => playback.playCueFromGesture(cueName, cueSource));
  const pause = (): void => playback.pause();
  const resume = (): void => playback.resume();
  const stop = (): void => playback.stop();

  controls.startMusic.addEventListener('click', startMusic);
  controls.playCue.addEventListener('click', playCue);
  controls.pause.addEventListener('click', pause);
  controls.resume.addEventListener('click', resume);
  controls.stop.addEventListener('click', stop);
  scope.defer(() => {
    controls.startMusic.removeEventListener('click', startMusic);
    controls.playCue.removeEventListener('click', playCue);
    controls.pause.removeEventListener('click', pause);
    controls.resume.removeEventListener('click', resume);
    controls.stop.removeEventListener('click', stop);
  });
}
