/**
 * One meter-height sample grid feeds both the PlaneGeometry and the
 * Jolt heightfield. `sampleCount` must be `2^n + 1`; the plane uses
 * `sampleCount - 1` segments. Rotate the plane onto XZ before writing
 * `position.y`, then recompute normals.
 * The caller adds and owns the terrain mesh; `createAndBindBody` only
 * synchronizes its physics pose.
 */
import * as THREE from 'three/webgpu';

import type { LifetimeScope } from 'wanaka-studio-engine';
import type { PhysicsWorld } from 'wanaka-studio-engine/physics';

export function addHeightfieldTerrain(
  scope: LifetimeScope,
  scene: THREE.Scene,
  physics: PhysicsWorld,
): THREE.Mesh {
  const sampleCount = 9;
  const cellSize = 1;
  const maxHeight = 4;
  const heights = Array.from({ length: sampleCount * sampleCount }, (_, index) =>
    index === 4 * sampleCount + 4 ? maxHeight : 0.15 * maxHeight,
  );
  const geometry = scope.own(
    new THREE.PlaneGeometry(
      (sampleCount - 1) * cellSize,
      (sampleCount - 1) * cellSize,
      sampleCount - 1,
      sampleCount - 1,
    ),
  );
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < heights.length; index += 1) {
    positions.setY(index, heights[index] ?? 0);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geometry,
    scope.own(new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.9 })),
  );
  terrain.name = 'Terrain';
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  scene.add(terrain);
  scope.defer(() => terrain.removeFromParent());
  physics.createAndBindBody(scope, {
    motion: 'static',
    object: terrain,
    shape: {
      kind: 'heightfield',
      sampleCount,
      heights,
      cellSize,
    },
  });
  return terrain;
}
