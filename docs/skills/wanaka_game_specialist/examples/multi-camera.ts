/**
 * Two cameras over one scene. A RenderSession submits exactly one main
 * view; gameplay switches with `replaceMainView` on a reused view object.
 * `forCamera` is a host callback for preview cameras — the game provides
 * it and does not call it. Off-loop capture is a still, not a second loop.
 */
import * as THREE from 'three/webgpu';

import type {
  CameraPreviewCapture,
  RenderSession,
  RenderView,
} from 'wanaka-studio-engine/render-session';

export interface CameraPair {
  readonly heroView: RenderView;
  readonly showOverview: () => void;
  readonly showHero: () => void;
  readonly grabOverview: (width: number, height: number) => Promise<CameraPreviewCapture | null>;
}

function buildView(scene: THREE.Scene, camera: THREE.Camera): RenderView {
  return {
    scene,
    camera,
    resize: (width, height) => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    },
    forCamera: (next) => buildView(scene, next),
  };
}

export function attachCameraPair(
  session: RenderSession,
  scene: THREE.Scene,
  hero: THREE.PerspectiveCamera,
  overview: THREE.PerspectiveCamera,
): CameraPair {
  const heroView = buildView(scene, hero);
  const overviewView = buildView(scene, overview);
  return {
    heroView,
    showOverview: () => session.replaceMainView(overviewView),
    showHero: () => session.replaceMainView(heroView),
    // Off-loop capture leaves the main view untouched, which suits a still
    // thumbnail. A minimap that must update every frame belongs inside the
    // submitted view as an ArrayCamera subview instead.
    grabOverview: (width, height) =>
      session.captureCameraPreview({ scene, camera: overview, width, height }),
  };
}
