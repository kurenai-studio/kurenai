/**
 * Dressing level shape with surface looks chosen from these coordinates.
 * The meshes stay the project's own: they carry the layout, the colliders, and
 * the dimensions. The resolver writes the chosen maps and tile size into this
 * file during authoring.
 */
import * as THREE from 'three/webgpu';

import type { LifetimeScope } from 'wanaka-studio-engine';
import { applySurfaceMaterial } from 'wanaka-studio-engine/default-surface';
import grassBaseColorUrl from '#project/assets/catalog/91415929-cc07-41ae-bcc2-2b2a4439b833/surface-grass.jpg';
import grassNormalUrl from '#project/assets/catalog/91415929-cc07-41ae-bcc2-2b2a4439b833/surface-grass-normal.jpg';
import grassRoughnessUrl from '#project/assets/catalog/91415929-cc07-41ae-bcc2-2b2a4439b833/surface-grass-roughness.jpg';
import asphaltBaseColorUrl from '#project/assets/catalog/ac169d67-09f9-4be2-85bd-6e2f2db8969e/surface-asphalt.jpg';
import asphaltNormalUrl from '#project/assets/catalog/ac169d67-09f9-4be2-85bd-6e2f2db8969e/surface-asphalt-normal.jpg';
import asphaltRoughnessUrl from '#project/assets/catalog/ac169d67-09f9-4be2-85bd-6e2f2db8969e/surface-asphalt-roughness.jpg';
import brickBaseColorUrl from '#project/assets/catalog/56c8c968-00c9-44f6-a273-cb263359315b/surface-brick.jpg';
import brickNormalUrl from '#project/assets/catalog/56c8c968-00c9-44f6-a273-cb263359315b/surface-brick-normal.jpg';
import brickRoughnessUrl from '#project/assets/catalog/56c8c968-00c9-44f6-a273-cb263359315b/surface-brick-roughness.jpg';

/**
 * A verge, a road laid through it, and a boundary wall.
 */
export async function buildPinnedSurfaceYard(
  scope: LifetimeScope,
  parent: THREE.Object3D,
): Promise<THREE.Mesh[]> {
  const verge = new THREE.Mesh(scope.own(new THREE.BoxGeometry(40, 0.2, 40)));
  verge.position.set(0, -0.1, 0);

  const road = new THREE.Mesh(scope.own(new THREE.BoxGeometry(8, 0.22, 40)));
  // Keep the road top 0.02 units above the verge to avoid coplanar surfaces.
  road.position.set(0, -0.09, 0);

  const wall = new THREE.Mesh(scope.own(new THREE.BoxGeometry(40, 3, 0.4)));
  wall.position.set(0, 1.5, -20);

  const meshes = [verge, road, wall];
  for (const mesh of meshes) {
    mesh.receiveShadow = true;
    parent.add(mesh);
    scope.defer(() => mesh.removeFromParent());
  }

  await Promise.all([
    applySurfaceMaterial(scope, verge, {
      tileSizeUnits: 1.4,
      maps: {
        baseColor: grassBaseColorUrl,
        normal: grassNormalUrl,
        roughness: grassRoughnessUrl,
      },
    }),
    applySurfaceMaterial(scope, road, {
      tileSizeUnits: 2.5,
      maps: {
        baseColor: asphaltBaseColorUrl,
        normal: asphaltNormalUrl,
        roughness: asphaltRoughnessUrl,
      },
    }),
    applySurfaceMaterial(scope, wall, {
      tileSizeUnits: 1,
      maps: {
        baseColor: brickBaseColorUrl,
        normal: brickNormalUrl,
        roughness: brickRoughnessUrl,
      },
    }),
  ]);
  return meshes;
}
