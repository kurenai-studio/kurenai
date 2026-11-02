/**
 * Split-screen and minimaps under a RenderSession that submits exactly one
 * RenderView. The view uses a native `ArrayCamera`; each sub-camera carries its
 * own `viewport`, and `RenderView.resize` keeps those viewports correct when
 * the host presentation size changes.
 *
 * Per-view filtering uses native Three `layers`. Giving the minimap its own
 * layer and setting the markers onto that layer keeps them out of the primary
 * frame without touching the scene graph twice.
 */
import { ArrayCamera, PerspectiveCamera, Vector4, type Object3D, type Scene } from 'three/webgpu';
import type { RenderView } from 'wanaka-studio-engine/render-session';

const MINIMAP_LAYER = 1;
const MINIMAP_FRACTION = 0.25;
const MINIMAP_MARGIN = 16;

export function makeMinimapView(scene: Scene, markers: readonly Object3D[]): RenderView {
  const main = new PerspectiveCamera(60, 1, 0.1, 500);
  const minimap = new PerspectiveCamera(50, 1, 0.1, 500);
  minimap.position.set(0, 60, 0);
  minimap.lookAt(0, 0, 0);

  // Markers leave the default layer entirely, so `main` cannot see them; the
  // minimap keeps layer 0 enabled and adds theirs.
  minimap.layers.enable(MINIMAP_LAYER);
  for (const marker of markers) {
    marker.layers.set(MINIMAP_LAYER);
  }

  const mainViewport = new Vector4();
  const minimapViewport = new Vector4();
  main.viewport = mainViewport;
  minimap.viewport = minimapViewport;
  const camera = new ArrayCamera([main, minimap]);
  // The submitted ArrayCamera's layers decide who enters the render list;
  // each sub-camera's layers then decide which of those objects it draws.
  camera.layers.enable(MINIMAP_LAYER);

  const resize = (width: number, height: number): void => {
    // Host resize values are CSS pixels; the backend applies pixelRatio.
    mainViewport.set(0, 0, width, height);
    main.aspect = width / height;
    main.updateProjectionMatrix();

    // Viewport origin is bottom-left, so the inset sits at the top-right.
    const size = Math.round(Math.min(width, height) * MINIMAP_FRACTION);
    minimapViewport.set(width - size - MINIMAP_MARGIN, height - size - MINIMAP_MARGIN, size, size);
    minimap.aspect = 1;
    minimap.updateProjectionMatrix();
  };

  return { scene, camera, resize };
}

/** Two players sharing one frame: stacked halves of the same ArrayCamera. */
export function makeSplitScreenView(
  scene: Scene,
  cameras: readonly [PerspectiveCamera, PerspectiveCamera],
): RenderView {
  const [top, bottom] = cameras;
  const topViewport = new Vector4();
  const bottomViewport = new Vector4();
  top.viewport = topViewport;
  bottom.viewport = bottomViewport;

  const resize = (width: number, height: number): void => {
    const half = Math.floor(height / 2);
    const topHeight = height - half;
    topViewport.set(0, half, width, topHeight);
    bottomViewport.set(0, 0, width, half);
    top.aspect = width / topHeight;
    bottom.aspect = width / half;
    top.updateProjectionMatrix();
    bottom.updateProjectionMatrix();
  };

  return { scene, camera: new ArrayCamera([top, bottom]), resize };
}
