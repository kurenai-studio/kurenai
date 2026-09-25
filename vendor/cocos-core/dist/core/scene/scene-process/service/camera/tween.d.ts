import { Quat, Vec3 } from 'cc';
export declare class PositionAnimation {
    target: Vec3;
    func: Function | null;
    start: Vec3;
    end: Vec3;
    travel: number;
    time: number;
    constructor(start: Vec3, end: Vec3, time: number);
    _step(time: number): boolean;
    step(func: Function | null): void;
}
export declare class RotationAnimation {
    target: Quat;
    func: Function | null;
    start: Quat;
    end: Quat;
    travel: number;
    time: number;
    constructor(start: Quat, end: Quat, time: number);
    _step(time: number): boolean;
    step(func: Function | null): void;
}
export declare class NumberAnimation {
    target: number;
    func: Function | null;
    start: number;
    end: number;
    travel: number;
    time: number;
    constructor(start: number, end: number, time: number);
    _step(time: number): boolean;
    step(func: Function | null): void;
}
export declare function tweenPosition(start: Vec3, end: Vec3, time?: number): PositionAnimation;
export declare function tweenRotation(start: Quat, end: Quat, time: number): RotationAnimation;
export declare function tweenNumber(start: number, end: number, time: number): NumberAnimation;
