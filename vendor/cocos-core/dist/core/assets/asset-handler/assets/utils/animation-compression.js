"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressAnimationClip = compressAnimationClip;
const cc_1 = require("cc");
const { approx } = cc_1.math;
function compressAnimationClip(animationClip) {
    for (const track of animationClip.tracks) {
        for (const { curve } of track.channels()) {
            if (curve instanceof cc_1.RealCurve) {
                compressRealCurve(curve);
            }
        }
    }
}
function compressRealCurve(curve) {
    if (curve.keyFramesCount < 2) {
        return;
    }
    if (!Array.from(curve.values()).every(({ interpolationMode }) => interpolationMode === cc_1.RealInterpolationMode.LINEAR)) {
        return;
    }
    const times = Array.from(curve.times());
    const values = Array.from(curve.values()).map(({ value }) => value);
    const compressed = compress(times, values, [
        {
            type: 'remove-linear-keys',
            maxDiff: 1e-4,
        },
        {
            type: 'remove-trivial-keys',
            maxDiff: 1e-4,
        },
    ]);
    curve.assignSorted(compressed.times, compressed.values);
}
function compress(times, values, stack) {
    for (const compression of stack) {
        switch (compression.type) {
            case 'remove-linear-keys':
                ({ keys: times, values } = removeLinearKeys(times, values, compression.maxDiff));
                break;
            case 'remove-trivial-keys':
                ({ keys: times, values } = removeTrivialKeys(times, values, compression.maxDiff));
                break;
        }
    }
    return { times, values };
}
/**
 * Removes keys which are linear interpolations of surrounding keys.
 * @param keys Input keys.
 * @param values Input values.
 * @param maxDiff Max error.
 * @returns The new keys `keys` and new values `values`.
 */
function removeLinearKeys(keys, values, maxDiff = 1e-3) {
    const nKeys = keys.length;
    if (nKeys < 3) {
        return {
            keys: keys.slice(),
            values: values.slice(),
        };
    }
    const removeFlags = new Array(nKeys).fill(false);
    // We may choose to use different key selection policy?
    // http://nfrechette.github.io/2016/12/07/anim_compression_key_reduction/
    const iLastKey = nKeys - 1;
    for (let iKey = 1; iKey < iLastKey; ++iKey) {
        // Should we select previous non-removed key?
        const iPrevious = iKey - 1;
        const iNext = iKey + 1;
        const { [iPrevious]: previousKey, [iKey]: currentKey, [iNext]: nextKey } = keys;
        const { [iPrevious]: previousValue, [iKey]: currentValue, [iNext]: nextValue } = values;
        const alpha = (currentKey - previousKey) / (nextKey - previousKey);
        const expectedValue = (nextValue - previousValue) * alpha + previousValue;
        if (approx(expectedValue, currentValue, maxDiff)) {
            removeFlags[iKey] = true;
        }
    }
    return filterFromRemoveFlags(keys, values, removeFlags);
}
/**
 * Removes trivial frames.
 * @param keys Input keys.
 * @param values Input values.
 * @param maxDiff Max error.
 * @returns The new keys `keys` and new values `values`.
 */
function removeTrivialKeys(keys, values, maxDiff = 1e-3) {
    const nKeys = keys.length;
    if (nKeys < 2) {
        return {
            keys: keys.slice(),
            values: values.slice(),
        };
    }
    const removeFlags = new Array(nKeys).fill(false);
    for (let iKey = 1; iKey < nKeys; ++iKey) {
        // Should we select previous non-removed key?
        const iPrevious = iKey - 1;
        const { [iPrevious]: previousValue, [iKey]: currentValue } = values;
        if (approx(previousValue, currentValue, maxDiff)) {
            removeFlags[iKey] = true;
        }
    }
    return filterFromRemoveFlags(keys, values, removeFlags);
}
function filterFromRemoveFlags(keys, values, removeFlags) {
    const nKeys = keys.length;
    const nRemovals = removeFlags.reduce((n, removeFlag) => (removeFlag ? n + 1 : n), 0);
    if (!nRemovals) {
        return {
            keys: keys.slice(),
            values: values.slice(),
        };
    }
    const nNewKeyframes = nKeys - nRemovals;
    const newKeys = new Array(nNewKeyframes).fill(0.0);
    const newValues = new Array(nNewKeyframes).fill(0.0);
    for (let iNewKeys = 0, iKey = 0; iKey < nKeys; ++iKey) {
        if (!removeFlags[iKey]) {
            newKeys[iNewKeys] = keys[iKey];
            newValues[iNewKeys] = values[iKey];
            ++iNewKeys;
        }
    }
    return {
        keys: newKeys,
        values: newValues,
    };
}
