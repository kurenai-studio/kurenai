import { MouseCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class MouseInputSource {
    private _canvas?;
    private _eventTarget;
    private _pointLocked;
    private _isPressed;
    private _preMousePos;
    private _handleMouseDown;
    private _handleMouseMove;
    private _handleMouseUp;
    constructor();
    dispatchMouseDownEvent(nativeMouseEvent: any): void;
    dispatchMouseMoveEvent(nativeMouseEvent: any): void;
    dispatchMouseUpEvent(nativeMouseEvent: any): void;
    dispatchScrollEvent(nativeMouseEvent: WheelEvent): void;
    on(eventType: InputEventType, callback: MouseCallback, target?: any): void;
    private _getCanvasRect;
    private _getLocation;
    private _registerEvent;
    private _registerPointerLockEvent;
    private _createCallback;
    private _handleMouseWheel;
    private _handleMouseLeave;
    private _handleMouseEnter;
    dispatchEventsInCache(): void;
}
