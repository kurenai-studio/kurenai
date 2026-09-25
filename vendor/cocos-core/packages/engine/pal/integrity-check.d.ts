declare const guard: unique symbol;
type Guard = typeof guard;
/**
 * Checks if a PAL implementation module is compatible with its target interface module.
 *
 * @example
 * If you write the following in somewhere:
 *
 * ```ts
 * checkPalIntegrity<typeof import('pal-interface-module')>(
 *   withImpl<typeof import('pal-implementation-module')>());
 * ```
 *
 * you will receive a compilation error
 * if your implementation module is not fulfil the interface module.
 *
 * @note This function should be easily tree-shaken.
 */
export declare function checkPalIntegrity<T>(impl: T & Guard): void;
/**
 * Utility function, see example of `checkPalIntegrity()`.
 *
 */
export declare function withImpl<T>(): T & Guard;
export {};
