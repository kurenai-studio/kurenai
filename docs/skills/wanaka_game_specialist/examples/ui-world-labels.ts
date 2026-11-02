import * as THREE from 'three/webgpu';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/** Creates a project-owned world label; the project must render CSS2DRenderer in preRender. */
export function createWorldLabel(text: string, position: THREE.Vector3): CSS2DObject {
  const element = document.createElement('span');
  element.className = 'world-label';
  element.textContent = text;
  const label = new CSS2DObject(element);
  label.position.copy(position);
  return label;
}
