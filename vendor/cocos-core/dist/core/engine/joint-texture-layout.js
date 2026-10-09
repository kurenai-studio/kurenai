"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJointTextureLayoutDeviceTip = getJointTextureLayoutDeviceTip;
exports.resolveCustomJointTextureLayouts = resolveCustomJointTextureLayouts;
exports.queryJointTextureLayoutPreview = queryJointTextureLayoutPreview;
exports.calculateJointTextureLength = calculateJointTextureLength;
exports.readJointTextureLayoutAssetState = readJointTextureLayoutAssetState;
const fs_1 = require("fs");
const JOINT_TEXTURE_LENGTH_ALIGN = 12;
function getJointTextureLayoutDeviceTip(textureLength) {
    if (textureLength < 1024) {
        return {
            level: 'valid',
            message: 'Valid on all devices',
        };
    }
    if (textureLength < 2048) {
        return {
            level: 'warning',
            message: 'May exceeds max texture size limit on devices with no float texture support',
        };
    }
    return {
        level: 'error',
        message: 'May exceeds max texture size limit on many mobile devices',
    };
}
async function resolveCustomJointTextureLayouts(layouts, resolver = {}) {
    return (await queryJointTextureLayoutPreview(layouts, resolver)).resolvedLayouts;
}
async function queryJointTextureLayoutPreview(layouts, resolver = {}) {
    if (!Array.isArray(layouts) || layouts.length === 0) {
        return {
            layouts: [],
            resolvedLayouts: [],
            missingAssets: [],
        };
    }
    const readAssetState = createCachedAssetStateReader(resolver.readAssetState ?? readJointTextureLayoutAssetState);
    const previewLayouts = [];
    const resolvedLayouts = [];
    const allMissingAssets = new Set();
    for (const [index, layout] of layouts.entries()) {
        if (!layout || !Array.isArray(layout.contents) || layout.contents.length === 0) {
            previewLayouts.push(createEmptyPreviewItem(index));
            continue;
        }
        const layoutMissingAssets = new Set();
        const previewResolver = {
            ...resolver,
            onMissingAsset: (uuid) => {
                const alreadyMissing = allMissingAssets.has(uuid);
                layoutMissingAssets.add(uuid);
                allMissingAssets.add(uuid);
                if (!alreadyMissing) {
                    resolver.onMissingAsset?.(uuid);
                }
            },
        };
        const contents = await Promise.all(layout.contents.map((content) => resolveChunkContent(content, readAssetState, previewResolver)));
        const resolvedContents = contents.filter((content) => !!content);
        resolvedContents.sort((a, b) => a.skeleton - b.skeleton);
        const calculatedTextureLength = await calculateJointTextureLength(layout.contents, readAssetState, previewResolver);
        const fallbackTextureLength = normalizePositiveInteger(layout.textureLength);
        const textureLength = calculatedTextureLength || fallbackTextureLength || 0;
        const resolvedLayout = textureLength && resolvedContents.length > 0
            ? {
                textureLength,
                contents: resolvedContents,
            }
            : null;
        if (resolvedLayout) {
            resolvedLayouts.push(resolvedLayout);
        }
        previewLayouts.push({
            index,
            textureLength,
            calculatedTextureLength,
            fallbackTextureLength,
            resolvedLayout,
            tip: getJointTextureLayoutDeviceTip(textureLength),
            missingAssets: Array.from(layoutMissingAssets),
        });
    }
    return {
        layouts: previewLayouts,
        resolvedLayouts,
        missingAssets: Array.from(allMissingAssets),
    };
}
async function calculateJointTextureLength(contents, readAssetState = readJointTextureLayoutAssetState, resolver = {}) {
    let pixels = 0;
    for (const content of contents) {
        const joints = await resolveJointsLength(content?.skeleton, readAssetState, resolver);
        if (!joints) {
            continue;
        }
        for (const clip of content.clips ?? []) {
            const clipState = await resolveUuidState(clip, readAssetState, resolver);
            const sample = normalizePositiveNumber(clipState?.sample);
            const duration = normalizeNonNegativeNumber(clipState?.duration);
            if (!sample || duration === undefined) {
                continue;
            }
            const frames = Math.ceil(sample * duration) + 1;
            pixels += joints * frames * 3;
        }
        pixels += joints * 3;
    }
    return pixels > 0
        ? Math.ceil(Math.sqrt(pixels) / JOINT_TEXTURE_LENGTH_ALIGN) * JOINT_TEXTURE_LENGTH_ALIGN
        : 0;
}
async function readJointTextureLayoutAssetState(uuid) {
    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
    const meta = assetManager.queryAssetMeta(uuid);
    const jointsLength = normalizePositiveInteger(meta?.userData && meta.userData.jointsLength);
    const info = assetManager.queryAssetInfo(uuid);
    if (!info) {
        return jointsLength ? { jointsLength } : null;
    }
    const libraryPath = findImportLibraryPath(info.library);
    if (!libraryPath) {
        return jointsLength ? { jointsLength } : null;
    }
    try {
        const { getRawInstanceFromImportFile } = await Promise.resolve().then(() => __importStar(require('../assets/utils')));
        const rawInstanceResult = await getRawInstanceFromImportFile(libraryPath, {
            uuid: info.uuid,
            url: info.url,
        });
        const asset = rawInstanceResult?.asset;
        if (!asset) {
            return jointsLength ? { jointsLength } : null;
        }
        const instance = asset;
        return {
            hash: normalizePositiveInteger(instance.hash),
            sample: normalizePositiveNumber(instance.sample),
            duration: normalizeNonNegativeNumber(instance.duration),
            jointsLength: jointsLength || (Array.isArray(instance.joints) ? instance.joints.length : undefined),
        };
    }
    catch (error) {
        console.error(error);
        return jointsLength ? { jointsLength } : null;
    }
}
async function resolveChunkContent(content, readAssetState, resolver) {
    const skeleton = await resolveAssetHash(content?.skeleton, readAssetState, resolver);
    if (!skeleton) {
        return null;
    }
    const clips = [];
    for (const clip of content.clips ?? []) {
        const hash = await resolveAssetHash(clip, readAssetState, resolver);
        if (hash) {
            clips.push(hash);
        }
    }
    clips.sort();
    return {
        skeleton,
        clips,
    };
}
async function resolveAssetHash(value, readAssetState, resolver) {
    if (typeof value === 'number') {
        return normalizePositiveInteger(value) ?? null;
    }
    const state = await resolveUuidState(value, readAssetState, resolver);
    return normalizePositiveInteger(state?.hash) ?? null;
}
async function resolveJointsLength(value, readAssetState, resolver) {
    const state = await resolveUuidState(value, readAssetState, resolver);
    return normalizePositiveInteger(state?.jointsLength) ?? 0;
}
async function resolveUuidState(value, readAssetState, resolver) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }
    const state = await readAssetState(value);
    if (!state) {
        resolver.onMissingAsset?.(value);
        resolver.warn?.(`Failed to resolve Joint Texture Layout asset: ${value}`);
    }
    return state;
}
function createEmptyPreviewItem(index) {
    return {
        index,
        textureLength: 0,
        calculatedTextureLength: 0,
        resolvedLayout: null,
        tip: getJointTextureLayoutDeviceTip(0),
        missingAssets: [],
    };
}
function findImportLibraryPath(library) {
    if (!library) {
        return '';
    }
    for (const ext of ['.json', '.bin', '.cconb']) {
        const file = library[ext];
        if (file && (0, fs_1.existsSync)(file)) {
            return file;
        }
    }
    return '';
}
function createCachedAssetStateReader(readAssetState) {
    const cache = new Map();
    return (uuid) => {
        if (!cache.has(uuid)) {
            cache.set(uuid, readAssetState(uuid));
        }
        return cache.get(uuid);
    };
}
function normalizePositiveInteger(value) {
    const numberValue = normalizePositiveNumber(value);
    return numberValue === undefined ? undefined : Math.trunc(numberValue);
}
function normalizePositiveNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return undefined;
    }
    return value;
}
function normalizeNonNegativeNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return undefined;
    }
    return value;
}
