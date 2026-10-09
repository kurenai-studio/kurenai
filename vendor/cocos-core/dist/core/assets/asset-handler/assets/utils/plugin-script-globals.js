"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SIMULATED_GLOBALS = void 0;
exports.resolveSimulatedGlobals = resolveSimulatedGlobals;
/** Default aliases made available to enclosed plugin scripts. */
exports.DEFAULT_SIMULATED_GLOBALS = ['self', 'window', 'global', 'globalThis'];
/**
 * Resolves persisted plugin aliases while tolerating metadata written by older PinK versions.
 */
function resolveSimulatedGlobals(value) {
    if (value === false || (Array.isArray(value) && value.length === 0)) {
        return [];
    }
    const customGlobals = Array.isArray(value) ? value : [];
    return Array.from(new Set([
        ...exports.DEFAULT_SIMULATED_GLOBALS,
        ...customGlobals,
    ]));
}
