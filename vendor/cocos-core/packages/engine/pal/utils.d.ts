/**
 * This method clones methods in minigame environment, sub as `wx`, `swan` etc. to a module called minigame.
 * @param targetObject Usually it's specified as the minigame module.
 * @param originObj Original minigame environment such as `wx`, `swan` etc.
 */
export declare function cloneObject<T extends object = any>(targetObject: T, originObj: T): void;
type MiningameAudioCallbackName = 'onPlay' | 'onPause' | 'onStop' | 'onSeek';
type InnerAudioContextPolyfillConfig = {
    [CallbackName in MiningameAudioCallbackName]: boolean;
};
/**
 * This method is to create a polyfill on minigame platform when the innerAudioContext callback doesn't work.
 * @param minigameEnv Specify the minigame enviroment such as `wx`, `swan` etc.
 * @param polyfillConfig Specify the field, if it's true, the polyfill callback will be applied.
 * @param isAsynchronous Specify whether the callback is called asynchronous.
 * @returns A polyfilled createInnerAudioContext method.
 */
export declare function createInnerAudioContextPolyfill(minigameEnv: any, polyfillConfig: InnerAudioContextPolyfillConfig, isAsynchronous?: boolean): () => InnerAudioContext;
/**
 * Compare two version, version should in pattern like 3.0.0.
 * If versionA > versionB, return number larger than 0.
 * If versionA = versionB, return number euqal to 0.
 * If versionA < versionB, return number smaller than 0.
 * @param versionA
 * @param versionB
 */
export declare function versionCompare(versionA: string, versionB: string): number;
/**
 * A custom implementation of setTimeout that uses requestAnimationFrame.
 * @param callback The function to be executed after a delay.
 * @param delay The delay time in milliseconds.
 * @param args The arguments to be passed to the callback function.
 * @returns A unique identifier for the timer.
 */
export declare function setTimeoutRAF<T extends any[]>(callback: (...args: T) => void, delay: number, ...args: T): number;
/**
 * Cancels a timer that was created using the rafTimeout function.
 * @param id A numeric ID that represents the timer to be canceled.
 * @returns Nothing.
 */
export declare function clearTimeoutRAF(id: number): void;
export {};
