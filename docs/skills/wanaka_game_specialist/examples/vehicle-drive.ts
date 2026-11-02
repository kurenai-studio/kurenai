/**
 * Wheeled vehicle with a catalog body and four independently bound model wheels.
 * Chassis-local forward is +Z, so front wheels sit at positive Z and
 * steer by default. `setDriverInput` latches until replaced — a
 * blocked drive must submit zeros. Hand-brake is a fourth channel.
 * The caller parents and owns the chassis; `createAndBind` only
 * publishes simulated poses. Optional `steeringWheel`, `springs`, and
 * `axles` stay chassis-local and follow interpolated wheelPose. Wishbones
 * and cardans stay project-owned. Optional `antiRollBars` and
 * `maxPitchRollAngleDeg` cap chassis roll.
 */
import { Group, type Scene } from 'three/webgpu';
import type { Model3DLoader } from 'wanaka-studio-engine/assets';
import {
  createDriveModelLook,
  createVehicleModelPresentation,
  DRIVE_WHEEL_NODES,
  DRIVE_MODEL_CENTER_Y,
  DRIVE_CHASSIS_HALF_EXTENTS,
} from './vehicle-wheel-visuals.js';
import { VehicleController } from 'wanaka-studio-engine/vehicle';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';
import type { InputSession } from 'wanaka-studio-engine/input';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';

export async function attachWheeledDrive(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  world: PhysicsWorld,
  scene: Scene,
  input: InputSession,
  driving: () => boolean,
  model3DLoader: Model3DLoader,
  raceCarUrl: string,
): Promise<VehicleController> {
  const model = await model3DLoader.load(scope, createDriveModelLook(raceCarUrl));
  const presentation = createVehicleModelPresentation(model, DRIVE_WHEEL_NODES);
  const chassis = new Group();
  chassis.name = 'Chassis';
  // This model's origin is at the ground; the physics root is the body centre.
  presentation.object.position.y = -DRIVE_MODEL_CENTER_Y;
  chassis.add(presentation.object);
  scene.add(chassis);
  scope.defer(() => chassis.removeFromParent());
  chassis.updateWorldMatrix(true, true);
  const wheels = presentation.wheels.map((wheel, index) => {
    // VehicleController publishes world poses, so wheel pivots are scene siblings,
    // never children of the moving chassis. Keep authored scale on their children.
    scene.attach(wheel.object);
    scope.defer(() => wheel.object.removeFromParent());
    return {
      position: {
        x: wheel.object.position.x,
        y: wheel.object.position.y + 0.4,
        z: wheel.object.position.z,
      },
      radius: wheel.radius,
      width: wheel.width,
      steers: index < 2,
      suspensionMinLength: 0.2,
      suspensionMaxLength: 0.4,
      suspensionFrequency: 1.8,
      suspensionDamping: 0.85,
    };
  });

  const steeringWheel = new Group();
  steeringWheel.position.set(0.35, 0.42, 0.55);
  const frontLeftSpring = new Group();
  frontLeftSpring.position.set(-0.8, 0.2, 1.4);
  const frontAxle = new Group();
  frontAxle.position.set(0, 0.35, 1.4);
  chassis.add(steeringWheel, frontLeftSpring, frontAxle);

  const vehicle = VehicleController.createAndBind(scope, world, {
    chassis: {
      halfExtents: { ...DRIVE_CHASSIS_HALF_EXTENTS, y: 0.45 },
      mass: 900,
      position: { x: 0, y: 1, z: 0 },
      centerOfMassOffset: { x: 0, y: -0.35, z: 0 },
    },
    maxPitchRollAngleDeg: 45,
    antiRollBars: [
      { leftWheel: 0, rightWheel: 1, stiffness: 2_000 },
      { leftWheel: 2, rightWheel: 3, stiffness: 2_000 },
    ],
    object: chassis,
    steeringWheel: { object: steeringWheel, ratio: 12 },
    springs: [{ object: frontLeftSpring, wheel: 0 }],
    axles: [{ object: frontAxle, leftWheel: 0, rightWheel: 1 }],
    wheels,
    wheelObjects: presentation.wheels.map((wheel) => wheel.object),
  });

  const fixedInput = input.fixed(scope);
  scope.defer(
    scheduler.on('fixedInput', () => {
      if (!driving()) {
        vehicle.setDriverInput(0, 0, 0, 0);
        return;
      }
      vehicle.setDriverInput(
        fixedInput.axis('KeyS', 'KeyW'),
        fixedInput.axis('KeyA', 'KeyD'),
        fixedInput.isDown('Space') ? 1 : 0,
        fixedInput.isDown('ShiftLeft') || fixedInput.isDown('ShiftRight') ? 1 : 0,
      );
    }),
  );
  return vehicle;
}
