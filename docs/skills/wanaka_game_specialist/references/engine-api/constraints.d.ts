// Import from "wanaka-studio-engine/constraints".

import { type LifetimeScope } from "wanaka-studio-engine";
import { Vector3 } from "three/webgpu";
import type { PhysicsWorld, RigidBody, Vector3Like } from "wanaka-studio-engine/physics";

export interface DistanceJointOptions {
    readonly a: RigidBody;
    readonly b: RigidBody;
    readonly restLength?: number;
}

export type HingeAxis = 'x' | 'y' | 'z';

export type ConstraintAxis = HingeAxis | Vector3Like;

export interface HingeJointLimits {
    /** Minimum relative hinge angle in radians. */
    readonly minAngle: number;
    /** Maximum relative hinge angle in radians. */
    readonly maxAngle: number;
    /** Passive resistance torque in N·m (default 0). */
    readonly maxFrictionTorque?: number;
}

export interface HingeJointOptions {
    readonly a: RigidBody;
    readonly b: RigidBody;
    /** World-space hinge axis; accepts a canonical axis name or any non-zero vector. */
    readonly axis?: ConstraintAxis;
    /** World-space hinge anchor; defaults to body `a`'s current position. */
    readonly anchor?: Vector3Like;
    readonly limits?: HingeJointLimits;
}

/**
 * World-axis hinge between two rigid bodies using a Jolt HingeConstraint.
 */
export class HingeJoint {
    readonly a: RigidBody;
    readonly b: RigidBody;
    readonly axis: Vector3;
    readonly anchor: Vector3;
    private constructor();
    /** Creates a hinge joint for the supplied bodies and owned by the scope. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: HingeJointOptions): HingeJoint;
}

/**
 * Keeps two rigid bodies at a rest length using a Jolt DistanceConstraint.
 */
export class DistanceJoint {
    readonly a: RigidBody;
    readonly b: RigidBody;
    readonly restLength: number;
    private constructor();
    /** Creates a distance joint for the supplied bodies and owned by the scope. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: DistanceJointOptions): DistanceJoint;
}

export interface SliderJointOptions {
    readonly a: RigidBody;
    readonly b: RigidBody;
    /** World-space travel axis; accepts a canonical axis name or any non-zero vector. */
    readonly axis?: ConstraintAxis;
    /** World-space slider anchor; Jolt auto-detects it when omitted. */
    readonly anchor?: Vector3Like;
    readonly limits?: {
        readonly minDistance: number;
        readonly maxDistance: number;
        readonly maxFrictionForce?: number;
    };
}

/**
 * World-axis slider between two rigid bodies using a Jolt SliderConstraint.
 */
export class SliderJoint {
    readonly a: RigidBody;
    readonly b: RigidBody;
    readonly axis: Vector3;
    readonly anchor: Vector3 | undefined;
    private constructor();
    /** Creates a slider joint for the supplied bodies and owned by the scope. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: SliderJointOptions): SliderJoint;
}

export interface PointJointOptions {
    readonly body: RigidBody;
    readonly rest?: Vector3Like;
}

/**
 * Point constraint: one body is pinned to a rest world position through a
 * static sensor anchor and a Jolt PointConstraint.
 */
export class PointJoint {
    readonly body: RigidBody;
    readonly rest: Vector3Like;
    private constructor();
    /** Creates a point joint for the supplied body and owned by the scope. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: PointJointOptions): PointJoint;
}

export interface FixedJointOptions {
    readonly a: RigidBody;
    readonly b: RigidBody;
}

export interface SwingTwistLimits {
    readonly normalHalfConeAngle?: number;
    readonly planeHalfConeAngle?: number;
    readonly twistMinAngle?: number;
    readonly twistMaxAngle?: number;
    readonly maxFrictionTorque?: number;
}

export interface SwingTwistJointOptions {
    readonly a: RigidBody;
    readonly b: RigidBody;
    readonly anchor: Vector3Like;
    readonly twistAxis?: Vector3Like;
    readonly planeAxis?: Vector3Like;
    readonly limits?: SwingTwistLimits;
}

/**
 * Anatomical swing/twist constraint around one world-space anchor. The axes
 * and limits are passed directly to Jolt; no parallel bone representation is
 * created.
 */
export class SwingTwistJoint {
    readonly a: RigidBody;
    readonly b: RigidBody;
    readonly anchor: Vector3Like;
    private constructor();
    /** Creates a swing-twist joint for the supplied bodies and owned by the scope. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: SwingTwistJointOptions): SwingTwistJoint;
}

/**
 * Fixed/weld constraint: relative pose is locked by a Jolt FixedConstraint.
 */
export class FixedJoint {
    readonly a: RigidBody;
    readonly b: RigidBody;
    private constructor();
    /** Creates a fixed joint for the supplied bodies and owned by the scope. */
    static create(scope: LifetimeScope, world: PhysicsWorld, options: FixedJointOptions): FixedJoint;
}
