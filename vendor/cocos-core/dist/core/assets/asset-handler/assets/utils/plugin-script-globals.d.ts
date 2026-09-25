/** Default aliases made available to enclosed plugin scripts. */
export declare const DEFAULT_SIMULATED_GLOBALS: readonly ["self", "window", "global", "globalThis"];
/**
 * Resolves persisted plugin aliases while tolerating metadata written by older PinK versions.
 */
export declare function resolveSimulatedGlobals(value: unknown): string[];
