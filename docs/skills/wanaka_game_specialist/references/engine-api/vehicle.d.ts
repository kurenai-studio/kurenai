// Import from "wanaka-studio-engine/vehicle".

import type { DiagnosticsPort } from "wanaka-studio-engine";
import { type LifetimeScope } from "wanaka-studio-engine";
import { Quaternion, Vector3, type Object3D } from "three/webgpu";
import { type PhysicsWorld, type QuaternionLike, type Vector3Like } from "wanaka-studio-engine/physics";

export interface VehicleWheelOptions {
    /** Wheel hub attachment point in chassis-local space (Y-up, forward = +Z). */
    readonly position: Vector3Like;
    /** Wheel radius in meters. */
    readonly radius: number;
    /** Wheel width in meters. */
    readonly width: number;
    /** Whether this wheel steers; defaults to `position.z > 0`. */
    readonly steers?: boolean;
    /** Shortest suspension travel in meters (default 0.3). */
    readonly suspensionMinLength?: number;
    /** Longest suspension travel in meters (default 0.5). */
    readonly suspensionMaxLength?: number;
    /** Suspension natural frequency in Hz (default 1.8). */
    readonly suspensionFrequency?: number;
    /** Dimensionless suspension damping ratio (default 0.85). */
    readonly suspensionDamping?: number;
    /**
     * Optional suspension and tire force application point in chassis-local space.
     * Defaults to just below the chassis center of mass above the wheel hub to
     * shorten the pitch/roll lever arm and avoid kerb contact-point jumps.
     */
    readonly suspensionForcePoint?: Vector3Like;
    /** Peak service-brake torque in N·m. */
    readonly maxBrakeTorque?: number;
    /** Peak hand-brake torque in N·m. */
    readonly maxHandBrakeTorque?: number;
    /** Longitudinal tire friction multiplier. */
    readonly longitudinalFriction?: number;
    /** Lateral tire friction multiplier. */
    readonly lateralFriction?: number;
}

/** One driven wheel pair and its differential distribution. */
export interface VehicleDifferentialOptions {
    /** Left wheel index in declaration order. */
    readonly leftWheel: number;
    /** Right wheel index in declaration order. */
    readonly rightWheel: number;
    /** Final-drive ratio (default 1). */
    readonly ratio?: number;
    /** Torque share sent to the left wheel, from 0 through 1 (default 0.5). */
    readonly leftRightSplit?: number;
    /** Limited-slip ratio; 1 disables the limited-slip effect. */
    readonly limitedSlipRatio?: number;
    /** Fraction of engine torque routed through this differential (default 1). */
    readonly engineTorqueRatio?: number;
}

/** Opposite-wheel spring that resists chassis roll. */
export interface VehicleAntiRollBarOptions {
    /** Left wheel index in declaration order. */
    readonly leftWheel: number;
    /** Right wheel index in declaration order. */
    readonly rightWheel: number;
    /** Stiffness in N/m (Jolt default 1000). */
    readonly stiffness?: number;
}

/** Jolt engine and automatic-transmission tuning. */
export interface VehicleDrivetrainOptions {
    readonly minRpm?: number;
    readonly maxRpm?: number;
    readonly inertia?: number;
    readonly angularDamping?: number;
    /** Forward ratios ordered from first gear onwards. */
    readonly gearRatios?: readonly number[];
    /** Reverse ratios ordered from first reverse gear onwards. */
    readonly reverseGearRatios?: readonly number[];
    readonly switchTime?: number;
    readonly clutchReleaseTime?: number;
    readonly switchLatency?: number;
    readonly shiftUpRpm?: number;
    readonly shiftDownRpm?: number;
    readonly clutchStrength?: number;
}

export interface VehicleCreateOptions {
    /** Dynamic chassis box; `mass` overrides the shape's computed mass. */
    readonly chassis: {
        readonly halfExtents: Vector3Like;
        readonly mass?: number;
        readonly position?: Vector3Like;
        /**
         * Center-of-mass offset in chassis-local space.
         * Defaults to `{ x: 0, y: -halfExtents.y * 0.75, z: 0 }` so the vehicle resists pitch and roll.
         */
        readonly centerOfMassOffset?: Vector3Like;
    };
    /** Wheel layout (typically 4). Steering is per-wheel; the first pair is driven unless differentials are explicit. */
    readonly wheels: readonly VehicleWheelOptions[];
    /** Peak engine torque in N·m (default 500). */
    readonly maxTorque?: number;
    /** Steering lock of the steerable wheels in degrees (default 30). */
    readonly maxSteerAngleDeg?: number;
    /** Engine, transmission, and clutch settings passed directly to Jolt. */
    readonly drivetrain?: VehicleDrivetrainOptions;
    /** Driven wheel pairs; defaults to the first one or two wheels. */
    readonly differentials?: readonly VehicleDifferentialOptions[];
    /**
     * Caps chassis pitch/roll in degrees using the vehicle-up vs ground normal.
     * Defaults to 45 degrees so keyboard cars stay upright over bumps and kerbs.
     */
    readonly maxPitchRollAngleDeg?: number;
    /** Opposite-wheel anti-roll bars; defaults to front and rear pairs when 4+ wheels are declared. */
    readonly antiRollBars?: readonly VehicleAntiRollBarOptions[];
    /** Downforce factor in N/(m/s) applied along -up while grounded (default 15). */
    readonly downforce?: number;
    /** Steering input smoothing rate in 1/s (default 12; 0 disables smoothing). */
    readonly steerSmoothing?: number;
    /** Speed in m/s at which steering lock attenuates to highSpeedSteerFactor (default 28). */
    readonly highSpeedSteerThreshold?: number;
    /** Fraction of steering lock kept at or above highSpeedSteerThreshold, in (0, 1] (default 0.2). */
    readonly highSpeedSteerFactor?: number;
    readonly diagnostics?: DiagnosticsPort;
}

/** Chassis-local steering-wheel mesh; turns from interpolated steer, not Jolt. */
export interface VehicleSteeringWheelBind {
    readonly object: Object3D;
    /** Visual turns per wheel steer degree (default 12). */
    readonly ratio?: number;
    /** Rest-local axis the rim spins around (default `{ x: 0, y: 0, z: 1 }`). */
    readonly axis?: Vector3Like;
    /** Wheel whose `steerAngleDeg` drives the rim; defaults to the first steerable wheel. */
    readonly wheel?: number;
}

/** Chassis-local spring or shock mesh; scales along one axis from compression. */
export interface VehicleSpringBind {
    readonly object: Object3D;
    /** Wheel whose `suspensionCompression` drives the scale. */
    readonly wheel: number;
    /** Rest-local axis that shortens (default `{ x: 0, y: 1, z: 0 }`). */
    readonly axis?: Vector3Like;
    /** Scale along `axis` at full compression (default 0.55). */
    readonly minScale?: number;
}

/** Chassis-local axle mesh; follows a left/right hub pair without adding a Jolt body. */
export interface VehicleAxleBind {
    readonly object: Object3D;
    /** Left wheel index in declaration order. */
    readonly leftWheel: number;
    /** Right wheel index in declaration order. */
    readonly rightWheel: number;
}

export interface VehicleCreateAndBindOptions extends VehicleCreateOptions {
    /** Chassis presentation object that receives the body pose in postPhysics. */
    readonly object: Object3D;
    /** Per-wheel presentation objects, published from the wheel world transforms. */
    readonly wheelObjects?: readonly (Object3D | null)[];
    /**
     * Optional chassis-local steering-wheel visual. The caller parents it;
     * binding only writes local rotation from interpolated steer.
     */
    readonly steeringWheel?: VehicleSteeringWheelBind;
    /**
     * Optional chassis-local spring or shock visuals. Binding only writes local
     * scale from interpolated compression; Jolt spring parameters stay code-owned.
     */
    readonly springs?: readonly VehicleSpringBind[];
    /**
     * Optional chassis-local axle visuals. Binding writes local position and
     * roll from the paired hub midpoint. Wishbones and cardans stay project-owned.
     */
    readonly axles?: readonly VehicleAxleBind[];
}

/** One wheel's simulated pose, for gameplay reads and tests. */
export interface VehicleWheelPose {
    /** Wheel hub position in world space. */
    readonly position: Vector3;
    /** Accumulated rolling rotation in degrees. */
    readonly rotationAngleDeg: number;
    /** Current steering angle in degrees. */
    readonly steerAngleDeg: number;
    /** Current wheel angular velocity in radians per second. */
    readonly angularVelocity: number;
    /** Current suspension length in meters. */
    readonly suspensionLength: number;
    /** Suspension compression from fully extended (0) to fully compressed (1). */
    readonly suspensionCompression: number;
    /** Longitudinal tire slip reported by Jolt. */
    readonly longitudinalSlip: number;
    /** Lateral tire slip reported by Jolt. */
    readonly lateralSlip: number;
    /** Whether this wheel contacts a physics body. */
    readonly hasContact: boolean;
}

/**
 * A complete Jolt wheeled vehicle: dynamic chassis body, VehicleConstraint,
 * and WheeledVehicleController. Driver intent is latched through
 * {@link setDriverInput} and applied at the fixed step; the chassis, wheel,
 * and optional chassis-local extra presentation objects are published in
 * `preRender`.
 */
export class VehicleController {
    readonly wheelCount: number;
    private constructor();
    /** Creates a vehicle owned by the scope inside the supplied PhysicsWorld. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: VehicleCreateOptions): VehicleController;
    /**
     * Creates a vehicle and synchronizes its chassis, wheel, and optional
     * chassis-local extra presentations with the simulation for the scope
     * lifetime. Binding does not add those objects to a scene or transfer
     * geometry/material ownership; the caller still parents the objects and
     * owns their presentation resources. Extra binds stay chassis-local and
     * do not change Jolt spring or steer parameters.
     */
    static createAndBind(scope: LifetimeScope, world: PhysicsWorld, options: VehicleCreateAndBindOptions): VehicleController;
    /**
     * Latches driver intent applied at every fixed step until replaced.
     * `forward` and `right` are -1..1; `brake` and `handBrake` are 0..1.
     * Positive `forward` drives toward the chassis' local +Z front.
     */
    setDriverInput(forward: number, right: number, brake?: number, handBrake?: number): void;
    /** Chassis body position in world space. */
    get position(): Vector3;
    /** Chassis body orientation in world space. */
    get rotation(): Quaternion;
    /** Current chassis linear velocity in world space, in meters per second. */
    get linearVelocity(): Vector3;
    /** Magnitude of the chassis world-space linear velocity, in meters per second. */
    get speed(): number;
    /**
     * Relocates the chassis, clears linear/angular velocity and driver input,
     * and immediately snaps bound presentation objects to the reset pose.
     */
    resetPose(position: Vector3Like, rotation?: QuaternionLike): void;
    /** Current engine speed in revolutions per minute. */
    get engineRpm(): number;
    /** Current automatic-transmission gear; negative values are reverse. */
    get currentGear(): number;
    /** Whether the automatic transmission is currently changing gear. */
    get isSwitchingGear(): boolean;
    /** Current transmission ratio after automatic gear selection. */
    get currentGearRatio(): number;
    /** Whether at least one native Jolt wheel currently contacts the world. */
    get isOnGround(): boolean;
    /** Simulated pose of one wheel; `index` counts in declaration order. */
    wheelPose(index: number): VehicleWheelPose;
}
