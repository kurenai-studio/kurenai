// Import from "wanaka-studio-engine/camera-rig".

import { Vector3, type Vector3Like } from "three/webgpu";
import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import { Camera } from "three/webgpu";

export type { PositionLike };

export type CameraShot = {
    readonly kind: 'first-person';
    readonly eye: PositionLike;
} | {
    readonly kind: 'third-person';
    readonly follow: PositionLike;
    readonly distance: number;
    readonly height: number;
    /**
     * Character facing in radians (`atan2(x, z)`, 0 looks +Z). When set,
     * the camera sits behind that heading. Omit to keep the current world
     * azimuth (free follow, not lock-behind).
     */
    readonly yaw?: number;
} | {
    readonly kind: 'orbit';
    readonly target: PositionLike;
    readonly distance: number;
    /**
     * Orbit azimuth in radians (0 places the camera at +Z looking -Z;
     * captured pointer look uses `yaw += deltaX`, `pitch += deltaY`; derive
     * planar movement from `camera.getWorldDirection`).
     */
    readonly yaw: number;
    readonly pitch: number;
} | {
    readonly kind: 'fixed';
    readonly position: Vector3Like;
    readonly lookAt: Vector3Like;
};

export interface CameraRigCreateOptions {
    readonly camera: Camera;
    readonly collision?: {
        readonly raycast: (origin: Vector3Like, direction: Vector3Like) => {
            readonly point: Vector3Like;
        } | null;
        /** nearest keeps all probes clear; widest (default) tolerates an isolated thin occluder. */
        readonly strategy?: 'nearest' | 'widest';
        /** Minimum boom distance from the follow point when collision shortens the shot. */
        readonly minimumDistance?: number;
    };
}

/**
 * Owns one Camera's pose in preRender. Project code still creates the Camera
 * and hands it to the rig. Two rigs on the same Camera fail at create.
 */
export class CameraRig {
    private constructor();
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, options: CameraRigCreateOptions): CameraRig;
    /** Replaces the active shot. `blendSeconds === 0` is a cut. */
    setShot(shot: CameraShot, options?: {
        readonly blendSeconds?: number;
    }): void;
}

/** A point source. Native Object3D inputs are read in world space. */
interface PositionLike {
    readonly position: Vector3Like;
    getWorldPosition?(target: Vector3): Vector3;
}
