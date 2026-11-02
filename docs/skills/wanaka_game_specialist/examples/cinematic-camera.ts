/**
 * A scoped opening camera sequence over one native PerspectiveCamera.
 * The final authored pose matches the paused gameplay rig; `hold` releases the
 * camera only after that frame is submitted, then gameplay resumes as owner.
 */
import type { Object3D, PerspectiveCamera } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import {
  CameraSequencePlayer,
  defineCameraSequence,
  type CameraSequencePlayback,
} from 'wanaka-studio-engine/camera-sequence';

export const cinematicOpening = defineCameraSequence({
  id: 'cinematic-opening',
  durationSeconds: 6,
  keyframes: [
    {
      id: 'establish',
      atSeconds: 0,
      position: { anchor: 'opening-origin', local: [-5, 2.4, 7], sampling: 'snapshot' },
      aim: {
        kind: 'look-at',
        target: { anchor: 'opening-origin', local: [0, 1.2, 0], sampling: 'snapshot' },
        fallback: { kind: 'euler-degrees', value: [0, 0, 0] },
      },
      lens: { kind: 'perspective', fovDegrees: 52 },
    },
    {
      id: 'push-in',
      atSeconds: 2.4,
      position: { anchor: 'opening-origin', local: [-2.2, 1.8, 4], sampling: 'snapshot' },
      aim: {
        kind: 'look-at',
        target: { anchor: 'opening-origin', local: [0, 1.4, 0], sampling: 'snapshot' },
        fallback: { kind: 'quaternion', value: [0, 0, 0, 1] },
      },
      lens: { kind: 'perspective', fovDegrees: 46 },
      transition: { kind: 'smooth', easing: 'ease-in-out-cubic' },
    },
    {
      id: 'overhead-cut',
      atSeconds: 3.5,
      position: { world: [0, 8, 3] },
      aim: { kind: 'euler-degrees', value: [-65, 0, 0] },
      lens: { kind: 'perspective', fovDegrees: 42 },
      transition: { kind: 'cut' },
    },
    {
      id: 'gameplay-handoff',
      atSeconds: 6,
      position: {
        anchor: 'gameplay-handoff',
        local: [0, 0, 0],
        sampling: 'snapshot',
      },
      aim: { kind: 'binding', key: 'gameplay-handoff', sampling: 'snapshot' },
      lens: { kind: 'perspective', fovDegrees: 70 },
      transition: { kind: 'linear', easing: 'ease-out-cubic' },
    },
  ],
  markers: [
    { id: 'title-in', atSeconds: 0.8 },
    { id: 'objective-in', atSeconds: 4.8 },
  ],
});

export interface CinematicOpeningOptions {
  readonly scope: LifetimeScope;
  readonly scheduler: PhaseScheduler;
  readonly camera: PerspectiveCamera;
  readonly openingOrigin: Object3D;
  /** A native Object3D that records the gameplay rig's intended final world pose. */
  readonly gameplayHandoff: Object3D;
  readonly pauseGameplayCameraWriter: () => void;
  readonly resumeGameplayCameraWriter: () => void;
  readonly publishCue: (markerId: string) => void;
}

export interface CinematicOpeningPlayback {
  readonly player: CameraSequencePlayer;
  readonly playback: CameraSequencePlayback;
}

export function playCinematicOpening(
  options: CinematicOpeningOptions,
): CinematicOpeningPlayback {
  const player = CameraSequencePlayer.create(options.scope, options.scheduler, {
    camera: options.camera,
    sequence: cinematicOpening,
    anchors: {
      'opening-origin': options.openingOrigin,
      'gameplay-handoff': options.gameplayHandoff,
    },
    clock: 'presentation',
    onMarker: (marker) => options.publishCue(marker.id),
    onFinished: () => options.resumeGameplayCameraWriter(),
  });

  options.pauseGameplayCameraWriter();
  try {
    const playback = player.play({ completion: { kind: 'hold' } });
    return { player, playback };
  } catch (error) {
    options.resumeGameplayCameraWriter();
    throw error;
  }
}
