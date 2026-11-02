/**
 * Arcade racer ownership slice: the project integrator writes the kinematic
 * root (damped steer, brake-then-reverse, closing accel); `commitPose` records
 * the pose after contacts, and `present` interpolates a visual child. The box and
 * wheel meshes exist only until `attachArcadeRacer` replaces them with
 * the pinned Porsche race-car look. One overlapAabb contact with the kart body in
 * `ignore` is answered by the integrator. Kart-local forward is +Z. Not a
 * course, race, or HUD. The optional chase camera follows that same child.
 */
import * as THREE from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import type { Model3DLoadOptions, Model3DLoader } from 'wanaka-studio-engine/assets';
import {
  createDriveModelLook,
  createVehicleModelPresentation,
  DRIVE_WHEEL_NODES,
  DRIVE_MODEL_CENTER_Y,
  DRIVE_CHASSIS_HALF_EXTENTS,
} from './vehicle-wheel-visuals.js';
import { InputSession } from 'wanaka-studio-engine/input';
import { PhysicsWorld } from 'wanaka-studio-engine/physics';

const TOP_SPEED = 26;
const ACCEL = 10;
const BRAKE = 20;
const STEER_RATE = 2.2;
const STEER_AT_TOP = 0.45;
const GRIP = 8;
// Pinned Porsche at scale 100, metres: 2.05 wide, 1.25 tall, 4.77 long.
// The mesh bottom is at y = 0.02 and the top at y = 1.27, so the origin is the ground, not the centre.
// The collision box is centered on the root, so the root sits at the body centre and the model shifts down.
const KART_HALF = DRIVE_CHASSIS_HALF_EXTENTS;
const KART_CENTER_Y = DRIVE_MODEL_CENTER_Y;
const KART_CIRCLE_RADIUS = KART_HALF.x;
const KART_CIRCLE_OFFSET = KART_HALF.z - KART_HALF.x;
const WHEEL_RADIUS = 0.24;
const WALL = { x: 0, z: 18, halfX: 4, halfZ: 0.25 };
const UP = new THREE.Vector3(0, 1, 0);

/** Presentation values that an arcade kart exposes without transferring transform ownership. */
export interface ArcadeKartPresentationState {
  readonly steer: number;
  readonly wheelAngle: number;
  readonly pitch: number;
  readonly roll: number;
}

/** One complete, mutually exclusive visual presentation for an arcade kart. */
export interface ArcadeKartPresentation {
  readonly object: THREE.Object3D;
  /** Optional sprung body node that receives pitch/roll while wheels stay grounded. */
  readonly body?: THREE.Object3D;
  readonly present?: (state: ArcadeKartPresentationState) => void;
}

export interface ArcadeKart {
  readonly root: THREE.Group;
  /** Render-only pose, including every wheel; cameras read its world transform. */
  readonly presentationRoot: THREE.Group;
  readonly heading: number;
  readonly speed: number;
  /** Replaces the complete current vehicle presentation, including fallback wheels. */
  replacePresentation(presentation: ArcadeKartPresentation): void;
  step(dt: number, throttle: number, brake: number, steer: number): void;
  /** Call once per fixed step, after integration and all contact corrections. */
  commitPose(): void;
  present(alpha: number, frameDt: number): void;
  /** Teleport or start a new run, clearing dynamics and both presentation endpoints. */
  reset(position: { x: number; y: number; z: number }, heading: number): void;
  hitWall(nx: number, nz: number, penetration: number): void;
}

/** Box body and steerable wheels, shown only until the Porsche model replaces them. */
function createFallbackPresentation(scope: LifetimeScope): ArcadeKartPresentation {
  const object = new THREE.Group();
  const body = new THREE.Mesh(
    scope.own(new THREE.BoxGeometry(1.1, 0.3, 1.8)),
    scope.own(new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.45 })),
  );
  body.position.y = 0.32;
  object.add(body);

  const wheelGeo = scope.own(new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.22, 12));
  wheelGeo.rotateZ(Math.PI / 2);
  const rubber = scope.own(new THREE.MeshStandardMaterial({ color: 0x1f2126, roughness: 0.85 }));
  const frontPivots: THREE.Group[] = [];
  const wheelSpins: THREE.Mesh[] = [];
  for (const [x, z] of [
    [-0.6, 0.62],
    [0.6, 0.62],
    [-0.6, -0.62],
    [0.6, -0.62],
  ] as const) {
    const pivot = new THREE.Group();
    pivot.position.set(x, WHEEL_RADIUS, z);
    const wheel = new THREE.Mesh(wheelGeo, rubber);
    pivot.add(wheel);
    object.add(pivot);
    wheelSpins.push(wheel);
    if (z > 0) frontPivots.push(pivot);
  }

  return {
    object,
    body,
    present({ steer, wheelAngle, pitch, roll }) {
      body.rotation.set(pitch, 0, roll);
      for (const wheel of wheelSpins) wheel.rotation.x = wheelAngle;
      for (const pivot of frontPivots) pivot.rotation.y = -steer * 0.45;
    },
  };
}

export function createArcadeKart(scope: LifetimeScope, name: string): ArcadeKart {
  const root = new THREE.Group();
  root.name = name;
  const presentationRoot = new THREE.Group();
  presentationRoot.name = `${name}:Presentation`;
  const presentationSlot = new THREE.Group();
  let presentation = createFallbackPresentation(scope);
  presentationSlot.add(presentation.object);
  presentationRoot.add(presentationSlot);
  root.add(presentationRoot);

  const previousPosition = new THREE.Vector3();
  const currentPosition = new THREE.Vector3();
  const sampledPosition = new THREE.Vector3();
  const previousRotation = new THREE.Quaternion();
  const currentRotation = new THREE.Quaternion();
  const sampledRotation = new THREE.Quaternion();
  const inverseRootRotation = new THREE.Quaternion();

  const velocity = new THREE.Vector3();
  let heading = 0;
  let speed = 0;
  let lateral = 0;
  let steerSmoothed = 0;
  let previousSpeed = 0;
  let accel = 0;
  let roll = 0;
  let pitch = 0;
  let wheelAngle = 0;

  const compose = (): void => {
    const s = Math.sin(heading);
    const c = Math.cos(heading);
    velocity.set(s * speed + c * lateral, 0, c * speed - s * lateral);
  };
  const project = (): void => {
    const s = Math.sin(heading);
    const c = Math.cos(heading);
    speed = velocity.x * s + velocity.z * c;
    lateral = velocity.x * c - velocity.z * s;
  };

  return {
    root,
    presentationRoot,
    get heading() {
      return heading;
    },
    get speed() {
      return speed;
    },
    replacePresentation(nextPresentation) {
      presentationSlot.clear();
      presentationSlot.rotation.set(0, 0, 0);
      presentationSlot.add(nextPresentation.object);
      presentation = nextPresentation;
    },
    step(dt, throttle, brake, steer) {
      steerSmoothed += (steer - steerSmoothed) * (1 - Math.exp(-14 * dt));
      if (throttle > 0.05) {
        const target = TOP_SPEED * throttle;
        if (speed < target) {
          speed = Math.min(target, speed + Math.min(ACCEL, (target - speed) * 1.5 + 1) * dt);
        } else {
          speed = Math.max(target, speed - 3 * dt);
        }
      } else if (brake > 0.05) {
        if (speed > 0.2) speed = Math.max(0, speed - BRAKE * dt);
        else speed = Math.max(-7, speed - 5 * dt);
      } else {
        speed = Math.abs(speed) <= 3 * dt ? 0 : speed - Math.sign(speed) * 3 * dt;
      }
      const ratio = Math.min(1, Math.abs(speed) / TOP_SPEED);
      let yaw =
        steerSmoothed *
        STEER_RATE *
        (1 - (1 - STEER_AT_TOP) * ratio) *
        Math.min(1, Math.abs(speed) / 3);
      if (speed < -0.2) yaw = -yaw;
      compose();
      heading -= yaw * dt;
      project();
      lateral *= Math.exp(-GRIP * dt);
      compose();
      root.position.x += velocity.x * dt;
      root.position.z += velocity.z * dt;
      root.quaternion.setFromAxisAngle(UP, heading);
      accel = dt > 1e-8 ? (speed - previousSpeed) / dt : 0;
      previousSpeed = speed;
    },
    commitPose() {
      previousPosition.copy(currentPosition);
      previousRotation.copy(currentRotation);
      currentPosition.copy(root.position);
      currentRotation.copy(root.quaternion);
    },
    present(alpha, frameDt) {
      const t = THREE.MathUtils.clamp(alpha, 0, 1);
      sampledPosition.lerpVectors(previousPosition, currentPosition, t);
      sampledRotation.slerpQuaternions(previousRotation, currentRotation, t);
      // The unit-scale simulation root stays untouched. Cancel its transform
      // locally so this child's world pose is the sampled pose, applied once.
      inverseRootRotation.copy(root.quaternion).invert();
      presentationRoot.position
        .subVectors(sampledPosition, root.position)
        .applyQuaternion(inverseRootRotation);
      presentationRoot.quaternion.copy(inverseRootRotation).multiply(sampledRotation);
      const damp = 1 - Math.exp(-8 * frameDt);
      const targetRoll = THREE.MathUtils.clamp(
        -lateral * 0.008 + steerSmoothed * 0.025,
        -0.045,
        0.045,
      );
      const clampedAccel = THREE.MathUtils.clamp(accel, -BRAKE, ACCEL);
      const targetPitch = THREE.MathUtils.clamp(-clampedAccel * 0.0025, -0.035, 0.035);
      roll += (targetRoll - roll) * damp;
      pitch += (targetPitch - pitch) * damp;
      wheelAngle += (speed / WHEEL_RADIUS) * frameDt;
      if (presentation.present) {
        presentation.present({ steer: steerSmoothed, wheelAngle, pitch, roll });
      } else {
        (presentation.body ?? presentationSlot).rotation.set(pitch, 0, roll);
      }
    },
    reset(position, nextHeading) {
      root.position.copy(position);
      heading = nextHeading;
      root.quaternion.setFromAxisAngle(UP, heading);
      velocity.set(0, 0, 0);
      speed = lateral = steerSmoothed = previousSpeed = accel = roll = pitch = wheelAngle = 0;
      previousPosition.copy(root.position);
      currentPosition.copy(root.position);
      previousRotation.copy(root.quaternion);
      currentRotation.copy(root.quaternion);
      this.present(1, 0);
    },
    hitWall(nx, nz, penetration) {
      root.position.x += nx * penetration;
      root.position.z += nz * penetration;
      const approach = velocity.x * nx + velocity.z * nz;
      if (approach >= 0) return;
      velocity.x -= nx * approach * 1.35;
      velocity.z -= nz * approach * 1.35;
      project();
      previousSpeed = speed;
    },
  };
}

/** Replaces the whole fallback; explicit wheel nodes retain independent steer and roll. */
export async function replaceArcadeKartWithModel(
  scope: LifetimeScope,
  model3DLoader: Model3DLoader,
  kart: ArcadeKart,
  options: Model3DLoadOptions,
  wheelNodeNames?: readonly string[],
): Promise<THREE.Group> {
  const model = await model3DLoader.load(scope, options);
  if (!wheelNodeNames) {
    kart.replacePresentation({ object: model });
    return model;
  }
  const presentation = createVehicleModelPresentation(model, wheelNodeNames);
  kart.replacePresentation({
    object: presentation.object,
    body: presentation.body,
    present: ({ steer, wheelAngle, pitch, roll }) =>
      presentation.present(steer, wheelAngle * WHEEL_RADIUS, pitch, roll),
  });
  return presentation.object;
}

function resolveWall(kart: ArcadeKart): void {
  const fx = Math.sin(kart.heading);
  const fz = Math.cos(kart.heading);
  for (const sign of [1, -1] as const) {
    const cx = kart.root.position.x + fx * KART_CIRCLE_OFFSET * sign;
    const cz = kart.root.position.z + fz * KART_CIRCLE_OFFSET * sign;
    const dx = cx - WALL.x;
    const dz = cz - WALL.z;
    const ox = dx - Math.max(-WALL.halfX, Math.min(WALL.halfX, dx));
    const oz = dz - Math.max(-WALL.halfZ, Math.min(WALL.halfZ, dz));
    const distance = Math.hypot(ox, oz);
    if (distance >= KART_CIRCLE_RADIUS) continue;
    const nx = distance < 1e-4 ? (dx >= 0 ? 1 : -1) : ox / distance;
    const nz = distance < 1e-4 ? 0 : oz / distance;
    const penetration =
      distance < 1e-4
        ? KART_CIRCLE_RADIUS + WALL.halfX - Math.abs(dx)
        : KART_CIRCLE_RADIUS - distance;
    kart.hitWall(nx, nz, penetration);
  }
}

export async function attachArcadeRacer(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  scene: THREE.Scene,
  inputSource: EventTarget,
  model3DLoader: Model3DLoader,
  raceCarUrl: string,
): Promise<ArcadeKart> {
  const physics = await PhysicsWorld.create(scope, scheduler, { gravity: { x: 0, y: 0, z: 0 } });
  physics.createBody(scope, {
    motion: 'static',
    shape: { kind: 'box', halfExtents: { x: WALL.halfX, y: 0.45, z: WALL.halfZ } },
    position: { x: WALL.x, y: 0.45, z: WALL.z },
  });

  const kart = createArcadeKart(scope, 'Player');
  scene.add(kart.root);
  scope.defer(() => kart.root.removeFromParent());
  const model = await replaceArcadeKartWithModel(
    scope,
    model3DLoader,
    kart,
    createDriveModelLook(raceCarUrl),
    DRIVE_WHEEL_NODES,
  );
  model.position.y = -KART_CENTER_Y;
  kart.reset({ x: 0, y: KART_CENTER_Y, z: 0 }, 0);
  const kartBody = physics.createAndBindBody(scope, {
    motion: 'kinematic',
    shape: { kind: 'box', halfExtents: KART_HALF },
    object: kart.root,
  });

  const input = InputSession.create(scope, scheduler, inputSource);
  const fixedInput = input.fixed(scope);
  let throttle = 0;
  let brake = 0;
  let steer = 0;

  scope.defer(
    scheduler.on('fixedInput', () => {
      throttle = fixedInput.isDown('KeyW') || fixedInput.isDown('ArrowUp') ? 1 : 0;
      brake = fixedInput.isDown('KeyS') || fixedInput.isDown('ArrowDown') ? 1 : 0;
      // Horizontal intent is actor-relative: negative is left, positive is right.
      steer = Math.max(
        -1,
        Math.min(1, fixedInput.axis('KeyA', 'KeyD') + fixedInput.axis('ArrowLeft', 'ArrowRight')),
      );
    }),
  );

  scope.defer(
    scheduler.on('fixedUpdate', (step) => {
      kart.step(step.deltaSeconds, throttle, brake, steer);
      const p = kart.root.position;
      const reach = KART_HALF.z + 0.6;
      if (
        physics.overlapAabb(
          { x: p.x - reach, y: -1, z: p.z - reach },
          { x: p.x + reach, y: 2, z: p.z + reach },
          { ignore: [kartBody] },
        ).length > 0
      ) {
        resolveWall(kart);
      }
      kart.commitPose();
    }),
  );

  scope.defer(
    scheduler.on('preRender', (step) => {
      kart.present(step.alpha, step.deltaSeconds);
    }),
  );

  return kart;
}

/** Register after the kart presenter. Returns a snap request for resets or teleports. */
export function attachArcadeChaseCamera(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  camera: THREE.PerspectiveCamera,
  kart: ArcadeKart,
): () => void {
  const lookPoint = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const offset = new THREE.Vector3();
  let chaseYaw = 0;
  let snap = true;
  scope.defer(
    scheduler.on('preRender', (step) => {
      kart.presentationRoot.getWorldPosition(lookPoint);
      kart.presentationRoot.getWorldDirection(forward);
      const heading = Math.atan2(forward.x, forward.z);
      const delta = Math.atan2(Math.sin(heading - chaseYaw), Math.cos(heading - chaseYaw));
      chaseYaw = snap ? heading : chaseYaw + delta * (1 - Math.exp(-5 * step.deltaSeconds));
      snap = false;
      offset.set(0, 2.3, -6).applyAxisAngle(UP, chaseYaw);
      camera.position.copy(lookPoint).add(offset);
      camera.lookAt(lookPoint);
    }),
  );
  return () => {
    snap = true;
  };
}
