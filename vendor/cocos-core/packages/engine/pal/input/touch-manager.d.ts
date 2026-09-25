import { Touch } from '@cocos/engine/cocos/input/types';
declare class TouchManager {
    /**
     * A map from touch ID to touch object.
     */
    private _touchMap;
    private readonly _maxTouches;
    constructor();
    /**
     * Create the touch object at the touch start event callback.
     * we have some policy to create the touch object:
     * - If the number of touches doesn't exceed the max count, we create a touch object.
     * - If the number of touches exceeds the max count, we discard the timeout touch to create a new one.
     * - If the number of touches exceeds the max count and there is no timeout touch, we can't create any touch object.
     * @param touchID The touch identifier
     * @param x The x-axis coordinate of the current touch point.
     * @param y The y-axis coordinate of the current touch point.
     * @return The Touch instance or undefined.
     */
    private _createTouch;
    /**
     * Release the touch object at the touch end or touch cancel event callback.
     * @param touchID
     * @returns
     */
    releaseTouch(touchID: number): void;
    /**
     * Get touch object by touch ID.
     * @param touchID
     * @returns
     */
    getTouch(touchID: number): Touch | undefined;
    /**
     * Get or create touch object by touch ID.
     * @param touchID
     * @returns
     */
    getOrCreateTouch(touchID: number, x: number, y: number): Touch | undefined;
    /**
     * Get all the current touches objects.
     * @returns
     */
    getAllTouches(): Touch[];
    /**
     * Get the number of touches.
     */
    getTouchCount(): number;
    /**
     * Update the location and previous location of current touch ID.
     * @param touchID
     * @param x The current location X
     * @param y The current location Y
     */
    private _updateTouch;
    private _checkTouchMapSizeMoreThanMax;
}
export declare const touchManager: TouchManager;
export {};
