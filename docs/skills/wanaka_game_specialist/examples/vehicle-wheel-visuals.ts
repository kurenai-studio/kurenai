/** Explicit wheel mapping for a +Y-up, +Z-forward model; no animation clip is needed. */
import { Box3, Group, Vector3 } from 'three/webgpu';

/**
 * Look for the pinned Porsche (`01a12069-612e-7501-ab5a-bd1cda1667c7`).
 * Import the installed asset with:
 * `import raceCarUrl from '#project/assets/catalog/01a12069-612e-7501-ab5a-bd1cda1667c7/race-car.glb';`
 * and pass `raceCarUrl` here.
 */
export function createDriveModelLook(assetUrl: string) {
  return {
    assetUrl,
    rotationDegrees: { x: 0, y: 0, z: 0 },
    scale: 100,
  };
}

export const DRIVE_MODEL_CENTER_Y = 0.645;
export const DRIVE_CHASSIS_HALF_EXTENTS = { x: 1.03, y: 0.625, z: 2.38 };

// Declaration order is front-left, front-right, rear-left, rear-right.
export const DRIVE_WHEEL_NODES = [
  'WHEEL_LF_3',
  'WHEEL_RF_36',
  'WHEEL_LR_14',
  'WHEEL_RR_25',
] as const;

export interface ModelWheelVisual {
  readonly object: Group;
  readonly radius: number;
  readonly width: number;
}

export interface VehicleModelPresentation {
  readonly object: Group;
  /** Sprung bodywork group (excludes detached wheel hubs); apply visual pitch/roll here. */
  readonly body: Group;
  readonly wheels: readonly ModelWheelVisual[];
  present(steer: number, travelMeters: number, pitch?: number, roll?: number): void;
}

/** Retains the asset's rest transforms inside unit-scale wheel-hub pivots. */
export function createVehicleModelPresentation(
  model: Group,
  wheelNodeNames: readonly string[],
): VehicleModelPresentation {
  const nodes = wheelNodeNames.map((name) => {
    const node = model.getObjectByName(name);
    if (!node) throw new Error(`Vehicle model is missing wheel node "${name}".`);
    return node;
  });
  if (new Set(nodes).size !== nodes.length) {
    throw new Error('Map each vehicle wheel to a distinct model node.');
  }
  const object = new Group();
  const body = new Group();
  body.name = 'VehicleBody';
  body.add(model);
  object.add(body);
  object.updateWorldMatrix(true, true);
  const wheels = nodes.map((node, index) => {
    const bounds = new Box3().setFromObject(node);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    if (bounds.isEmpty() || Math.min(size.x, size.y, size.z) <= 0) {
      throw new Error(`Vehicle wheel "${wheelNodeNames[index]}" needs visible geometry.`);
    }
    const pivot = new Group();
    pivot.name = `WheelHub:${wheelNodeNames[index]}`;
    pivot.position.copy(center);
    object.add(pivot);
    // attach preserves every authored ancestor rotation and scale on the child.
    // The pivot remains unscaled and its origin is the measured wheel centre.
    pivot.attach(node);
    return { object: pivot, radius: Math.max(size.y, size.z) / 2, width: size.x };
  });
  return {
    object,
    body,
    wheels,
    present(steer, travelMeters, pitch = 0, roll = 0) {
      body.rotation.set(pitch, 0, roll);
      wheels.forEach((wheel, index) => {
        wheel.object.rotation.set(0, index < 2 ? -steer * 0.45 : 0, 0);
        wheel.object.rotateX(travelMeters / wheel.radius);
      });
    },
  };
}
