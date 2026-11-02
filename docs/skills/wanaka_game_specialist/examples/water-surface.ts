/**
 * Queryable water: a 128² compute pond and four-component Wave Ocean share
 * one MeshStandardNodeMaterial. Gameplay samples height and normal through
 * sampleWaterSurface. Keep the product renderer; do not assign
 * renderer.toneMapping.
 */
import * as THREE from 'three/webgpu';
import type { WebGPURenderer } from 'three/webgpu';
import {
  Fn,
  clamp,
  cos,
  float,
  instanceIndex,
  instancedArray,
  positionLocal,
  select,
  sin,
  transformNormalToView,
  uint,
  uniform,
  vec3,
  vertexIndex,
} from 'three/tsl';

import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

export type WaterMode = 'interactive-pond' | 'wave-ocean';

export interface WaterSurfaceSample {
  readonly height: number;
  readonly normal: THREE.Vector3;
}

export interface WaterSurface {
  readonly water: THREE.Mesh;
  readonly volume: THREE.Mesh;
  readonly floater: THREE.Group;
  readonly mode: () => WaterMode;
  setMode: (mode: WaterMode) => void;
  sample: (x: number, z: number) => WaterSurfaceSample;
}

export const WATER_GRID_SIZE = 128;
export const WATER_BOUNDS = 6;
export const WATER_THICKNESS = 0.44;
export const OCEAN_WAVES = [
  {
    direction: [0.9135, 0.4067],
    wavelength: 4.8,
    amplitudeWeight: 0.5,
    phaseSpeed: 0.72,
    phaseOffset: 0,
  },
  {
    direction: [0.5299, 0.848],
    wavelength: 2.9,
    amplitudeWeight: 0.25,
    phaseSpeed: 1.05,
    phaseOffset: 1.7,
  },
  {
    direction: [0.9781, -0.2079],
    wavelength: 1.7,
    amplitudeWeight: 0.16,
    phaseSpeed: 1.45,
    phaseOffset: 3.1,
  },
  {
    direction: [0.1392, 0.9903],
    wavelength: 0.9,
    amplitudeWeight: 0.09,
    phaseSpeed: 1.9,
    phaseOffset: 4.3,
  },
] as const;

const FLOATER_OFFSET = 0.16;
const POND_VISCOSITY = 0.96;
const OCEAN_WAVE_HEIGHT = 0.16;
const OCEAN_WAVE_SPEED = 1;

export function samplePondSurface(
  x: number,
  z: number,
  surfaceHeights: Float32Array,
): WaterSurfaceSample {
  const column = THREE.MathUtils.clamp(
    Math.round((x / WATER_BOUNDS + 0.5) * (WATER_GRID_SIZE - 1)),
    1,
    WATER_GRID_SIZE - 2,
  );
  const row = THREE.MathUtils.clamp(
    Math.round((-z / WATER_BOUNDS + 0.5) * (WATER_GRID_SIZE - 1)),
    1,
    WATER_GRID_SIZE - 2,
  );
  const index = row * WATER_GRID_SIZE + column;
  const sampleHeight = (sampleIndex: number): number => {
    const value = surfaceHeights[sampleIndex];
    if (value === undefined) {
      throw new Error('Water heightfield sample is missing.');
    }
    return value;
  };
  const normal = new THREE.Vector3(
    (sampleHeight(index - 1) - sampleHeight(index + 1)) * (WATER_GRID_SIZE / WATER_BOUNDS),
    1,
    (sampleHeight(index + WATER_GRID_SIZE) - sampleHeight(index - WATER_GRID_SIZE)) *
      (WATER_GRID_SIZE / WATER_BOUNDS),
  ).normalize();
  return { height: sampleHeight(index), normal };
}

export function sampleOceanSurface(
  x: number,
  z: number,
  elapsedSeconds: number,
  waveHeight = OCEAN_WAVE_HEIGHT,
  waveSpeed = OCEAN_WAVE_SPEED,
): WaterSurfaceSample {
  const localY = -z;
  let height = 0;
  let gradientX = 0;
  let gradientY = 0;
  for (const wave of OCEAN_WAVES) {
    const waveNumber = (Math.PI * 2) / wave.wavelength;
    const phase =
      (x * wave.direction[0] + localY * wave.direction[1]) * waveNumber -
      elapsedSeconds * waveSpeed * wave.phaseSpeed +
      wave.phaseOffset;
    const amplitude = waveHeight * wave.amplitudeWeight;
    const slope = Math.cos(phase) * amplitude * waveNumber;
    height += Math.sin(phase) * amplitude;
    gradientX += slope * wave.direction[0];
    gradientY += slope * wave.direction[1];
  }
  return {
    height,
    normal: new THREE.Vector3(-gradientX, 1, gradientY).normalize(),
  };
}

export function sampleWaterSurface(
  mode: WaterMode,
  x: number,
  z: number,
  surfaceHeights: Float32Array,
  elapsedSeconds: number,
): WaterSurfaceSample {
  return mode === 'wave-ocean'
    ? sampleOceanSurface(x, z, elapsedSeconds)
    : samplePondSurface(x, z, surfaceHeights);
}

export function addWaterSurface(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  scene: THREE.Scene,
  renderer: WebGPURenderer,
  options: { readonly y?: number } = {},
): WaterSurface {
  const waterY = options.y ?? 1.1;
  const initialHeights = new Float32Array(WATER_GRID_SIZE * WATER_GRID_SIZE);
  for (let row = 0; row < WATER_GRID_SIZE; row += 1) {
    for (let column = 0; column < WATER_GRID_SIZE; column += 1) {
      const u = (column / WATER_GRID_SIZE) * Math.PI * 2;
      const v = (row / WATER_GRID_SIZE) * Math.PI * 2;
      initialHeights[row * WATER_GRID_SIZE + column] =
        Math.sin(u * 3 + v * 2) * 0.018 + Math.sin(u * 7 - v * 5) * 0.009;
    }
  }
  const heightStorageA = instancedArray(initialHeights).setName('HeightA');
  const heightStorageB = instancedArray(new Float32Array(initialHeights)).setName('HeightB');
  const prevHeightStorage = instancedArray(new Float32Array(initialHeights)).setName('PrevHeight');
  scope.own(heightStorageA);
  scope.own(heightStorageA.value);
  scope.own(heightStorageB);
  scope.own(heightStorageB.value);
  scope.own(prevHeightStorage);
  scope.own(prevHeightStorage.value);
  const readFromA = uniform(true).setName('readFromA');
  const viscosity = uniform(POND_VISCOSITY).setName('waterViscosity');
  const isOceanMode = uniform(false).setName('isOceanMode');
  const oceanWaveTime = uniform(0).setName('oceanWaveTime');
  const oceanWaveHeight = uniform(OCEAN_WAVE_HEIGHT).setName('oceanWaveHeight');
  const oceanWaveSpeed = uniform(OCEAN_WAVE_SPEED).setName('oceanWaveSpeed');

  type StorageIndex = Exclude<Parameters<typeof heightStorageA.element>[0], number>;
  const getNeighborIndices = (index: StorageIndex) => {
    const width = uint(WATER_GRID_SIZE);
    const nodeIndex = typeof index === 'number' ? uint(index) : uint(index as typeof instanceIndex);
    const x = float(nodeIndex.mod(WATER_GRID_SIZE));
    const y = float(nodeIndex.div(WATER_GRID_SIZE));
    const leftX = uint(clamp(x.sub(1), 0, WATER_GRID_SIZE - 1));
    const rightX = uint(clamp(x.add(1), 0, WATER_GRID_SIZE - 1));
    const bottomY = uint(clamp(y.sub(1), 0, WATER_GRID_SIZE - 1));
    const topY = uint(clamp(y.add(1), 0, WATER_GRID_SIZE - 1));
    const gridX = uint(x);
    const gridY = uint(y);
    return {
      northIndex: topY.mul(width).add(gridX),
      southIndex: bottomY.mul(width).add(gridX),
      eastIndex: gridY.mul(width).add(rightX),
      westIndex: gridY.mul(width).add(leftX),
    };
  };
  const createHeightCompute = (
    readBuffer: typeof heightStorageA,
    writeBuffer: typeof heightStorageA,
  ) =>
    Fn(() => {
      const height = readBuffer.element(instanceIndex).toVar();
      const previousHeight = prevHeightStorage.element(instanceIndex).toVar();
      const { northIndex, southIndex, eastIndex, westIndex } = getNeighborIndices(instanceIndex);
      const nextHeight = readBuffer
        .element(northIndex)
        .add(readBuffer.element(southIndex))
        .add(readBuffer.element(eastIndex))
        .add(readBuffer.element(westIndex))
        .mul(0.5)
        .sub(previousHeight)
        .mul(viscosity)
        .toVar();
      prevHeightStorage.element(instanceIndex).assign(height);
      writeBuffer.element(instanceIndex).assign(nextHeight);
    })().compute(WATER_GRID_SIZE * WATER_GRID_SIZE, [16, 16]);
  const computeHeightAtoB = createHeightCompute(heightStorageA, heightStorageB).setName(
    'Update Height A to B',
  );
  const computeHeightBtoA = createHeightCompute(heightStorageB, heightStorageA).setName(
    'Update Height B to A',
  );
  scope.own(computeHeightAtoB);
  scope.own(computeHeightBtoA);
  const getCurrentHeight = (index: StorageIndex) =>
    select(readFromA, heightStorageA.element(index), heightStorageB.element(index));
  const getCurrentNormal = (index: StorageIndex) => {
    const { northIndex, southIndex, eastIndex, westIndex } = getNeighborIndices(index);
    return {
      normalX: getCurrentHeight(westIndex)
        .sub(getCurrentHeight(eastIndex))
        .mul(WATER_GRID_SIZE / WATER_BOUNDS),
      normalY: getCurrentHeight(southIndex)
        .sub(getCurrentHeight(northIndex))
        .mul(WATER_GRID_SIZE / WATER_BOUNDS),
    };
  };
  const getOceanSurface = (surfacePosition: typeof positionLocal) => {
    const height = float(0).toVar();
    const gradientX = float(0).toVar();
    const gradientY = float(0).toVar();
    for (const wave of OCEAN_WAVES) {
      const waveNumber = (Math.PI * 2) / wave.wavelength;
      const phase = surfacePosition.x
        .mul(wave.direction[0])
        .add(surfacePosition.y.mul(wave.direction[1]))
        .mul(waveNumber)
        .sub(oceanWaveTime.mul(oceanWaveSpeed).mul(wave.phaseSpeed))
        .add(wave.phaseOffset);
      const amplitude = oceanWaveHeight.mul(wave.amplitudeWeight);
      const slope = cos(phase).mul(amplitude).mul(waveNumber);
      height.addAssign(sin(phase).mul(amplitude));
      gradientX.addAssign(slope.mul(wave.direction[0]));
      gradientY.addAssign(slope.mul(wave.direction[1]));
    }
    return vec3(height, gradientX, gradientY);
  };

  const waterMaterial = scope.own(
    new THREE.MeshStandardNodeMaterial({
      color: 0x1a6b72,
      metalness: 0.08,
      roughness: 0.24,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    }),
  );
  waterMaterial.positionNode = Fn(() => {
    const oceanSurface = getOceanSurface(positionLocal);
    return vec3(
      positionLocal.x,
      positionLocal.y,
      select(isOceanMode, oceanSurface.x, getCurrentHeight(vertexIndex)),
    );
  })();
  waterMaterial.normalNode = Fn(() => {
    const { normalX, normalY } = getCurrentNormal(vertexIndex);
    const oceanSurface = getOceanSurface(positionLocal);
    return transformNormalToView(
      vec3(
        select(isOceanMode, oceanSurface.y.negate(), normalX),
        select(isOceanMode, oceanSurface.z.negate(), normalY),
        1,
      ),
    ).toVertexStage();
  })();
  const water = new THREE.Mesh(
    scope.own(
      new THREE.PlaneGeometry(
        WATER_BOUNDS,
        WATER_BOUNDS,
        WATER_GRID_SIZE - 1,
        WATER_GRID_SIZE - 1,
      ),
    ),
    waterMaterial,
  );
  water.name = 'Pond';
  water.rotation.x = -Math.PI / 2;
  water.position.y = waterY;
  water.userData.waterSimulation = 'webgpu-compute-heightfield';
  scene.add(water);
  scope.defer(() => water.removeFromParent());

  const volume = new THREE.Mesh(
    scope.own(new THREE.BoxGeometry(WATER_BOUNDS, 1, WATER_BOUNDS)),
    scope.own(
      new THREE.MeshStandardMaterial({
        color: 0x1a6b72,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    ),
  );
  volume.name = 'WaterVolume';
  volume.position.set(0, waterY - WATER_THICKNESS / 2, 0);
  volume.scale.y = WATER_THICKNESS;
  scene.add(volume);
  scope.defer(() => volume.removeFromParent());

  const floater = new THREE.Group();
  floater.name = 'FloatingProbe';
  const floaterBody = new THREE.Mesh(
    scope.own(new THREE.SphereGeometry(0.24, 24, 16)),
    scope.own(new THREE.MeshStandardMaterial({ color: 0xffd447, roughness: 0.5 })),
  );
  floaterBody.scale.set(1.25, 0.72, 0.82);
  floater.add(floaterBody);
  floater.position.set(0.45, waterY + FLOATER_OFFSET, -0.3);
  scene.add(floater);
  scope.defer(() => floater.removeFromParent());

  let waterMode: WaterMode = 'interactive-pond';
  let pingPong = 0;
  let frameCount = 0;
  let elapsedWaveSeconds = 0;
  let readbackPending = false;
  let disposed = false;
  let latestWaterHeights = new Float32Array(initialHeights);
  scope.defer(() => {
    disposed = true;
  });

  const applySample = (sampled: WaterSurfaceSample): void => {
    floater.position.y = water.position.y + sampled.height + FLOATER_OFFSET;
    floater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sampled.normal);
  };

  const readCurrentHeightfield = (): void => {
    if (readbackPending) return;
    readbackPending = true;
    const currentStorage = pingPong === 0 ? heightStorageA : heightStorageB;
    void renderer
      .getArrayBufferAsync(currentStorage.value)
      .then((buffer) => {
        if (disposed || waterMode !== 'interactive-pond') return;
        latestWaterHeights = new Float32Array(buffer.slice(0));
        applySample(samplePondSurface(floater.position.x, floater.position.z, latestWaterHeights));
      })
      .catch((error: unknown) => {
        if (!disposed) {
          water.userData.waterReadbackError =
            error instanceof Error ? error.message : String(error);
        }
      })
      .finally(() => {
        readbackPending = false;
      });
  };

  const setMode = (mode: WaterMode): void => {
    waterMode = mode;
    const oceanSelected = mode === 'wave-ocean';
    isOceanMode.value = oceanSelected;
    waterMaterial.metalness = oceanSelected ? 0.9 : 0.08;
    waterMaterial.roughness = oceanSelected ? 0 : 0.24;
    water.userData.waterMode = mode;
  };

  scope.defer(
    scheduler.on('update', ({ deltaSeconds }) => {
      frameCount += 1;
      elapsedWaveSeconds += deltaSeconds;
      oceanWaveTime.value = elapsedWaveSeconds;
      if (waterMode === 'interactive-pond') {
        for (let step = 0; step < 3; step += 1) {
          if (pingPong === 0) {
            renderer.compute(computeHeightAtoB, [8, 8, 1]);
            pingPong = 1;
            readFromA.value = false;
          } else {
            renderer.compute(computeHeightBtoA, [8, 8, 1]);
            pingPong = 0;
            readFromA.value = true;
          }
        }
        if (frameCount % 8 === 0) readCurrentHeightfield();
      } else {
        applySample(sampleOceanSurface(floater.position.x, floater.position.z, elapsedWaveSeconds));
      }
    }),
  );

  setMode('interactive-pond');
  return {
    water,
    volume,
    floater,
    mode: () => waterMode,
    setMode,
    sample: (x, z) =>
      sampleWaterSurface(waterMode, x, z, latestWaterHeights, elapsedWaveSeconds),
  };
}
