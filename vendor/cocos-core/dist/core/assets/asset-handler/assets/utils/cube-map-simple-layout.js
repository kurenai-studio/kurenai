"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleLayoutTable = void 0;
exports.matchSimpleLayout = matchSimpleLayout;
/**
 * NOTE: this table shall be only used for internal usage(testing).
 */
exports.simpleLayoutTable = [
    [
        [3, 4],
        {
            //   u
            // f r b
            //   d
            //   l
            front: [0, 1],
            back: [2, 1],
            top: [1, 0],
            bottom: [1, 2],
            right: [1, 1],
            left: [1, 3],
        },
    ],
    [
        [4, 3],
        {
            //   u
            // l f r b
            //   d
            front: [1, 1],
            back: [3, 1],
            top: [1, 0],
            bottom: [1, 2],
            right: [2, 1],
            left: [0, 1],
        },
    ],
    [
        [6, 1],
        {
            // r l u d f b
            right: [0, 0],
            left: [1, 0],
            top: [2, 0],
            bottom: [3, 0],
            front: [4, 0],
            back: [5, 0],
        },
    ],
    [
        [1, 6],
        {
            // inverse what [6, 1] does
            right: [0, 0],
            left: [0, 1],
            top: [0, 2],
            bottom: [0, 3],
            front: [0, 4],
            back: [0, 5],
        },
    ],
];
/**
 * Given the width and height of an image. If it match the simple layout, returns the layout.
 * Returns `undefined` otherwise.
 * @param width Image width.
 * @param height Image height.
 */
function matchSimpleLayout(width, height) {
    for (const [[matchedWidth, matchedHeight], layoutCoords] of exports.simpleLayoutTable) {
        if (width % matchedWidth !== 0 || width / matchedWidth !== height / matchedHeight) {
            continue; // Not the best match
        }
        const scale = width / matchedWidth;
        const layout = {};
        for (const faceName of Object.getOwnPropertyNames(layoutCoords)) {
            const [x, y] = layoutCoords[faceName];
            layout[faceName] = {
                x: x * scale,
                y: y * scale,
                width: scale,
                height: scale,
            };
        }
        return layout;
    }
}
