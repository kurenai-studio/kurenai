"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOriginalAnimationLibraryPath = getOriginalAnimationLibraryPath;
/**
 * get original animation in library path
 * @param index - animation index
 */
function getOriginalAnimationLibraryPath(index) {
    return `__original-animation-${index}.bin`;
}
