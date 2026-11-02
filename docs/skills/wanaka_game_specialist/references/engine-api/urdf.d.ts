// Import from "wanaka-studio-engine/urdf".

import { type LifetimeScope } from "wanaka-studio-engine";
import { Object3D, type Vector3Like } from "three/webgpu";

export interface UrdfJointDef {
    readonly name: string;
    readonly type: 'fixed' | 'revolute' | 'continuous' | 'prismatic';
    readonly parent: string;
    readonly child: string;
    readonly origin: Vector3Like;
    readonly originRpy: Vector3Like;
    readonly axis: Vector3Like;
    readonly lower: number;
    readonly upper: number;
    readonly mimic?: {
        readonly joint: string;
        readonly multiplier: number;
        readonly offset: number;
    };
}

export interface UrdfModel {
    readonly name: string;
    readonly links: readonly string[];
    readonly joints: readonly UrdfJointDef[];
}

/**
 * Parses the articulated URDF subset used by Wanaka games: fixed,
 * revolute, continuous, and prismatic joints with xyz/rpy origins, axes,
 * limits, and mimic chains. It is not a ROS runtime or wrapper object type.
 */
export function parseUrdf(xml: string): UrdfModel;

export interface UrdfArticulationOptions {
    readonly model: UrdfModel;
    /** Link objects must already use their URDF parent as Object3D parent. */
    readonly objects: Readonly<Record<string, Object3D>>;
    /** Optional native root receiving the standard URDF Z-up basis and scale. */
    readonly root?: Object3D;
    /** Scene units per URDF meter (default 1). Joint values stay meters/radians. */
    readonly unitScale?: number;
    /** `urdf` applies the Z-up to Y-up basis; `engine` keeps authored transforms. */
    readonly frame?: 'urdf' | 'engine';
}

/** Applies joint-local transforms directly onto named native Object3D links. */
export class UrdfArticulation {
    readonly model: UrdfModel;
    private constructor();
    /** Creates an articulation for the supplied native link objects. */
    static create(scope: LifetimeScope, options: UrdfArticulationOptions): UrdfArticulation;
    setJoint(name: string, value: number): void;
    /** Names of joints that accept direct writes, in URDF declaration order. */
    listJoints(): string[];
    /** Current revolute angle in radians or prismatic displacement in meters. */
    jointValue(name: string): number;
}
