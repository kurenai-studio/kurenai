"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageMimeTypeToExt = imageMimeTypeToExt;
function imageMimeTypeToExt(mimeType) {
    switch (mimeType) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
    }
}
