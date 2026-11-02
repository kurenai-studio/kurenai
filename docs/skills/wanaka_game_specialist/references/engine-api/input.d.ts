// Import from "wanaka-studio-engine/input".

import { type LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";

/** Pointer state latched into each frame snapshot. */
export interface PointerSnapshot {
    /** Browser viewport `clientX`, not canvas-local or normalized coordinates. */
    readonly x: number;
    /** Browser viewport `clientY`, not canvas-local or normalized coordinates. */
    readonly y: number;
    readonly buttons: number;
    /** DOM `buttons` bits that went down since the previous snapshot. */
    readonly buttonsPressed: number;
    /** DOM `buttons` bits that went up since the previous snapshot. */
    readonly buttonsReleased: number;
    readonly deltaX: number;
    readonly deltaY: number;
    readonly inside: boolean;
    /**
     * True while a canvas in this input source document owns Pointer Lock.
     * Overlay or other non-canvas element locks stay false.
     */
    readonly captured: boolean;
}

export interface GamepadSnapshot {
    readonly index: number;
    readonly axes: readonly number[];
    readonly buttonsDown: readonly boolean[];
    /** Buttons that went down since the previous frame snapshot. */
    readonly buttonsPressed: readonly boolean[];
    /** Buttons that went up since the previous frame snapshot. */
    readonly buttonsReleased: readonly boolean[];
}

/**
 * Immutable render-frame input state latched once in `frameBegin`. Direct
 * `InputSession.frame` reads stay stable for the frame; fixed simulation
 * uses `FixedInputConsumer` for independent consume-once transients.
 */
export interface InputSnapshot {
    /** Stable sequence of the render-frame input sample that produced this state. */
    readonly sequence: number;
    /** Keys currently held, by `KeyboardEvent.code`. */
    readonly keysDown: ReadonlySet<string>;
    /** Keys that went down since the previous frame snapshot. */
    readonly keysPressed: ReadonlySet<string>;
    /** Keys that went up since the previous frame snapshot. */
    readonly keysReleased: ReadonlySet<string>;
    readonly pointer: PointerSnapshot;
    /** Wheel pixels accumulated since the previous snapshot (then cleared). */
    readonly wheelDeltaY: number;
    readonly gamepads: readonly GamepadSnapshot[];
    /** Two-finger pinch scale relative to gesture start; 1 when idle. */
    readonly pinchScale: number;
    /** Primary-touch swipe pixels since the previous snapshot. */
    readonly swipeX: number;
    readonly swipeY: number;
}

/** Serializable frame used by input record/replay. */
export interface InputTapeFrame {
    readonly sequence: number;
    readonly keysDown: readonly string[];
    readonly keysPressed: readonly string[];
    readonly keysReleased: readonly string[];
    readonly pointer: PointerSnapshot;
    readonly wheelDeltaY: number;
    readonly gamepads: readonly GamepadSnapshot[];
    readonly pinchScale: number;
    readonly swipeX: number;
    readonly swipeY: number;
}

/** Optional DOM target that owns viewport pointer-boundary events. */
export interface InputSessionOptions {
    /** Receives pointerenter/pointerleave/pointercancel for `pointer.inside`. */
    readonly pointerTarget?: EventTarget;
}

/**
 * Scope-owned fixed-step input view. Held state is refreshed every fixed step,
 * while edges and deltas accumulated since this consumer's previous fixed step
 * are exposed once and then cleared independently from other consumers.
 */
export class FixedInputConsumer {
    private constructor();
    /** Input state prepared for the current fixed step. */
    get snapshot(): InputSnapshot;
    /** True while the key is held in the current fixed step. */
    isDown(code: string): boolean;
    /** True once when the key went down since this consumer's previous fixed step. */
    wasPressed(code: string): boolean;
    /** True once when the key went up since this consumer's previous fixed step. */
    wasReleased(code: string): boolean;
    /** True while the DOM pointer-button bit is held. */
    isPointerDown(buttonsBit: number): boolean;
    /** True once when the DOM pointer-button bit went down. */
    wasPointerPressed(buttonsBit: number): boolean;
    /** True once when the DOM pointer-button bit went up. */
    wasPointerReleased(buttonsBit: number): boolean;
    /** -1..1 helper combining a negative and a positive key. */
    axis(negativeCode: string, positiveCode: string): number;
    /** Gamepad at `index`, or `undefined` when absent from this fixed step. */
    gamepad(index?: number): GamepadSnapshot | undefined;
    /** Axis from the fixed-step gamepad snapshot, or 0 when missing. */
    gamepadAxis(index: number, axis: number): number;
    /** True while the fixed-step gamepad button is held. */
    gamepadButtonDown(index: number, button: number): boolean;
    /** True once when the gamepad button went down. */
    wasGamepadButtonPressed(index: number, button: number): boolean;
    /** True once when the gamepad button went up. */
    wasGamepadButtonReleased(index: number, button: number): boolean;
}

/** Render-frame input view. Fixed-step simulation must use `InputSession.fixed`. */
export class RenderInputView {
    private constructor();
    static create(session: InputSession): RenderInputView;
    get snapshot(): InputSnapshot;
    isDown(code: string): boolean;
    wasPressed(code: string): boolean;
    wasReleased(code: string): boolean;
    isPointerDown(buttonsBit: number): boolean;
    wasPointerPressed(buttonsBit: number): boolean;
    wasPointerReleased(buttonsBit: number): boolean;
    axis(negativeCode: string, positiveCode: string): number;
    gamepad(index?: number): GamepadSnapshot | undefined;
    gamepadAxis(index: number, axis: number): number;
    gamepadButtonDown(index: number, button: number): boolean;
    wasGamepadButtonPressed(index: number, button: number): boolean;
    wasGamepadButtonReleased(index: number, button: number): boolean;
}

/** Session-scoped input API; absent unless explicitly created. */
export class InputSession {
    readonly frame: RenderInputView;
    private constructor();
    /**
     * Creates session-scoped input for a DOM event source. Listeners and
     * the `frameBegin` latch hook are owned by the scope: after `scope.dispose()`
     * no device event or phase callback survives.
     *
     * Browser games with global keyboard controls must pass `window`. Pass an
     * element only for deliberately focus-scoped input after making that element
     * keyboard-focusable. Runtime TestSession keyboard events target `window`.
     */
    static create(scope: LifetimeScope, scheduler: PhaseScheduler, source: EventTarget, options?: InputSessionOptions): InputSession;
    /** Creates the fixed-step input view owned by `scope`. */
    fixed(scope: LifetimeScope): FixedInputConsumer;
    /**
     * Releases this session's held lock, or native Pointer Lock held by a canvas
     * in this input document. Overlay locks are left in place.
     */
    releasePointer(): void;
    /** Starts capturing latched snapshots. */
    startRecording(): void;
    /** Stops capture and returns the tape. */
    stopRecording(): InputTapeFrame[];
}
