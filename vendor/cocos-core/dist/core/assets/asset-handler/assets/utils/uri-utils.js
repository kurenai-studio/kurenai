"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertsEncodedSeparatorsInURI = convertsEncodedSeparatorsInURI;
function convertsEncodedSeparatorsInURI(uri) {
    let hasBackSlash = false;
    const segments = uri
        .pathname()
        .split('/')
        .map((x) => {
        const subsegs = decodeURIComponent(x).split(/[\\\/]/g); // eslint-disable-line no-useless-escape
        if (subsegs.length > 1) {
            hasBackSlash = true;
            return subsegs.map((subseg) => encodeURIComponent(subseg)).join('/');
        }
        else {
            return x;
        }
    });
    if (hasBackSlash) {
        uri.pathname(segments.join('/'));
    }
    return uri;
}
