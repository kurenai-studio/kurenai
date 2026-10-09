"use strict";
// https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeBase64ToArrayBuffer = decodeBase64ToArrayBuffer;
exports.encodeArrayBufferToBase64 = encodeArrayBufferToBase64;
function decodeBase64ToArrayBuffer(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}
function encodeArrayBufferToBase64(bytes) {
    // @ts-ignore TS2345
    return btoa(String.fromCharCode.apply(null, bytes));
}
