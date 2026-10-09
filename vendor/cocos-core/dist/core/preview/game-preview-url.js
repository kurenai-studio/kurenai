"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExternalGamePreviewUrl = getExternalGamePreviewUrl;
/**
 * Build the URL opened by the CLI's external game preview entry.
 * Unflagged URLs remain available to lightweight embedded preview consumers.
 */
function getExternalGamePreviewUrl(serverUrl, scene) {
    const url = new URL(serverUrl);
    if (scene) {
        url.searchParams.set('scene', scene);
    }
    url.searchParams.set('previewToolbar', '1');
    return url.toString();
}
