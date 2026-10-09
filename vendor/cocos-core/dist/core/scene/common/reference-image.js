"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeReferenceImageConfig = normalizeReferenceImageConfig;
exports.validateReferenceImageParameters = validateReferenceImageParameters;
const DEFAULT_IMAGE_PARAMETERS = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 100,
};
function normalizeReferenceImageConfig(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const seen = new Set();
    const images = Array.isArray(raw.images) ? raw.images.flatMap((item) => {
        if (!item || typeof item.path !== 'string' || !item.path || seen.has(item.path))
            return [];
        seen.add(item.path);
        return [{
                path: item.path,
                x: finiteOrDefault(item.x, DEFAULT_IMAGE_PARAMETERS.x),
                y: finiteOrDefault(item.y, DEFAULT_IMAGE_PARAMETERS.y),
                scaleX: finiteOrDefault(item.scaleX, DEFAULT_IMAGE_PARAMETERS.scaleX),
                scaleY: finiteOrDefault(item.scaleY, DEFAULT_IMAGE_PARAMETERS.scaleY),
                opacity: opacityOrDefault(item.opacity),
            }];
    }) : [];
    const paths = new Set(images.map((image) => image.path));
    const sceneBindings = {};
    if (raw.sceneBindings && typeof raw.sceneBindings === 'object') {
        for (const [sceneUuid, imagePath] of Object.entries(raw.sceneBindings)) {
            if (typeof imagePath === 'string' && paths.has(imagePath))
                sceneBindings[sceneUuid] = imagePath;
        }
    }
    return { images, sceneBindings, desiredVisible: raw.desiredVisible !== false };
}
function validateReferenceImageParameters(patch) {
    if (!patch || typeof patch !== 'object')
        throw new Error('Reference image parameters are required.');
    const result = {};
    for (const key of ['x', 'y', 'scaleX', 'scaleY', 'opacity']) {
        const value = patch[key];
        if (value === undefined)
            continue;
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(`${key} must be a finite number.`);
        }
        if (key === 'opacity' && (value < 0 || value > 100)) {
            throw new Error('opacity must be between 0 and 100.');
        }
        result[key] = value;
    }
    if (Object.keys(result).length === 0)
        throw new Error('At least one reference image parameter is required.');
    return result;
}
function finiteOrDefault(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function opacityOrDefault(value) {
    const opacity = finiteOrDefault(value, DEFAULT_IMAGE_PARAMETERS.opacity);
    return opacity >= 0 && opacity <= 100 ? opacity : DEFAULT_IMAGE_PARAMETERS.opacity;
}
