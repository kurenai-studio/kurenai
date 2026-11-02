import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';

export interface PbrSurfaceMaps {
  readonly baseColor: string;
  readonly normal: string;
  readonly roughness: string;
}

/**
 * Creates a PBR surface from installed ProjectFile map URLs
 * (imported via `import mapUrl from '#project/assets/...'`).
 * Dimensions and tile size use the same world units.
 */
export async function createPbrSurface(
  scope: LifetimeScope,
  maps: PbrSurfaceMaps,
  width: number,
  depth: number,
  tileSize: number,
): Promise<THREE.Mesh> {
  const loader = new THREE.TextureLoader();

  async function loadChannel(
    url: string,
    colorSpace: THREE.ColorSpace,
  ): Promise<THREE.Texture> {
    const texture = scope.own(await loader.loadAsync(url));
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / tileSize, depth / tileSize);
    return texture;
  }

  const [map, normalMap, roughnessMap] = await Promise.all([
    loadChannel(maps.baseColor, THREE.SRGBColorSpace),
    loadChannel(maps.normal, THREE.NoColorSpace),
    loadChannel(maps.roughness, THREE.NoColorSpace),
  ]);

  const material = scope.own(
    new THREE.MeshStandardMaterial({
      map,
      normalMap,
      roughnessMap,
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
    }),
  );

  const geometry = scope.own(new THREE.PlaneGeometry(width, depth));
  geometry.rotateX(-Math.PI / 2);

  const ground = new THREE.Mesh(geometry, material);
  ground.name = 'Ground';
  ground.castShadow = true;
  ground.receiveShadow = true;
  return ground;
}
