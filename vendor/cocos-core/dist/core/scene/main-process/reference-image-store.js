"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceImageStore = exports.ReferenceImageStore = void 0;
/** Main-process authority for the shared, project-local reference-image configuration. */
const reference_image_1 = require("../common/reference-image");
const crypto_1 = require("crypto");
const socket_1 = require("../../../server/socket");
const scene_configs_1 = require("../scene-configs");
const DEFAULT_IMAGE_PARAMETERS = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 100,
};
/**
 * The single writer for the project-local reference-image library. Scene
 * Webviews only submit intents so their independent rendering snapshots can
 * never overwrite another Webview's changes.
 */
class ReferenceImageStore {
    /** Changes after a main-process restart; it is intentionally not persisted. */
    instanceId = (0, crypto_1.randomUUID)();
    revision = 0;
    /** Serializes the complete read-modify-write operation, not only the disk write. */
    mutationQueue = Promise.resolve();
    async getSnapshot() {
        // Do not pair a new in-memory config value with the previous revision
        // while a queued write is awaiting disk persistence.
        await this.mutationQueue.catch(() => undefined);
        const config = (0, reference_image_1.normalizeReferenceImageConfig)(await scene_configs_1.sceneConfigInstance.get('referenceImage', 'local'));
        return this.createSnapshot(config, false);
    }
    async mutate(options) {
        let resolveTask;
        let rejectTask;
        const result = new Promise((resolve, reject) => {
            resolveTask = resolve;
            rejectTask = reject;
        });
        this.mutationQueue = this.mutationQueue
            .catch(() => undefined)
            .then(async () => {
            try {
                resolveTask(await this.mutateLatest(options));
            }
            catch (error) {
                rejectTask(error);
            }
        });
        return result;
    }
    async mutateLatest(options) {
        // Read inside the queue so another Scene cannot overwrite this mutation with a stale snapshot.
        const current = (0, reference_image_1.normalizeReferenceImageConfig)(await scene_configs_1.sceneConfigInstance.get('referenceImage', 'local'));
        const next = this.applyMutation(current, options);
        const changed = !configsEqual(current, next);
        if (changed) {
            await scene_configs_1.sceneConfigInstance.set('referenceImage', next, 'local');
            this.revision++;
            socket_1.socketService.io?.emit('scene:invoke', {
                module: 'ReferenceImage',
                method: 'syncFromAuthority',
                args: [],
            });
        }
        return this.createSnapshot(next, changed);
    }
    applyMutation(config, options) {
        const next = cloneConfig(config);
        switch (options?.type) {
            case 'add-and-select': {
                const path = validatePath(options.path);
                const sceneUuid = validateSceneUuid(options.sceneUuid);
                if (!next.images.some((image) => image.path === path)) {
                    next.images.push({ path, ...DEFAULT_IMAGE_PARAMETERS });
                }
                next.sceneBindings[sceneUuid] = path;
                return next;
            }
            case 'remove': {
                const path = validatePath(options.path);
                const index = next.images.findIndex((image) => image.path === path);
                if (index === -1)
                    return next;
                next.images.splice(index, 1);
                for (const [sceneUuid, imagePath] of Object.entries(next.sceneBindings)) {
                    if (imagePath === path)
                        delete next.sceneBindings[sceneUuid];
                }
                return next;
            }
            case 'select': {
                const path = validatePath(options.path);
                const sceneUuid = validateSceneUuid(options.sceneUuid);
                if (!next.images.some((image) => image.path === path)) {
                    throw new Error('Reference image is not in the local image library.');
                }
                next.sceneBindings[sceneUuid] = path;
                return next;
            }
            case 'clear-binding': {
                delete next.sceneBindings[validateSceneUuid(options.sceneUuid)];
                return next;
            }
            case 'set-visible': {
                if (typeof options.desiredVisible !== 'boolean') {
                    throw new Error('desiredVisible must be a boolean.');
                }
                next.desiredVisible = options.desiredVisible;
                return next;
            }
            case 'commit-parameters': {
                const sceneUuid = validateSceneUuid(options.sceneUuid);
                const path = next.sceneBindings[sceneUuid];
                const image = path ? next.images.find((candidate) => candidate.path === path) : undefined;
                if (!image)
                    throw new Error('The current scene or prefab has no reference image binding.');
                Object.assign(image, (0, reference_image_1.validateReferenceImageParameters)(options.patch));
                return next;
            }
            default:
                throw new Error('Unknown reference image mutation.');
        }
    }
    createSnapshot(config, changed) {
        return { instanceId: this.instanceId, revision: this.revision, config: cloneConfig(config), changed };
    }
}
exports.ReferenceImageStore = ReferenceImageStore;
function validatePath(path) {
    if (typeof path !== 'string' || !path)
        throw new Error('Reference image path is required.');
    return path;
}
function validateSceneUuid(sceneUuid) {
    if (typeof sceneUuid !== 'string' || !sceneUuid)
        throw new Error('No scene or prefab is currently open.');
    return sceneUuid;
}
function cloneConfig(config) {
    return {
        images: config.images.map((image) => ({ ...image })),
        sceneBindings: { ...config.sceneBindings },
        desiredVisible: config.desiredVisible,
    };
}
function configsEqual(left, right) {
    return left.desiredVisible === right.desiredVisible
        && left.images.length === right.images.length
        && left.images.every((image, index) => {
            const candidate = right.images[index];
            return candidate?.path === image.path
                && candidate.x === image.x
                && candidate.y === image.y
                && candidate.scaleX === image.scaleX
                && candidate.scaleY === image.scaleY
                && candidate.opacity === image.opacity;
        })
        && Object.keys(left.sceneBindings).length === Object.keys(right.sceneBindings).length
        && Object.entries(left.sceneBindings).every(([sceneUuid, path]) => right.sceneBindings[sceneUuid] === path);
}
exports.referenceImageStore = new ReferenceImageStore();
