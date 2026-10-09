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
exports.disposeModuleMessages = disposeModuleMessages;
exports.listenModuleMessages = listenModuleMessages;
let assetNotificationGeneration = 0;
let disposeModuleMessageListeners = null;
const assetNotificationQueues = new Map();
function isScriptAsset(asset) {
    return asset.meta.importer === 'typescript' || asset.meta.importer === 'javascript';
}
function enqueueAssetNotification(uuid, generation, notification) {
    const previous = assetNotificationQueues.get(uuid) ?? Promise.resolve();
    const current = previous
        .catch((error) => {
        console.error(`[Scene] Asset notification failed (${uuid}):`, error);
    })
        .then(async () => {
        // Scene worker restart/disposal invalidates queued work from the old RPC session.
        if (generation !== assetNotificationGeneration) {
            return;
        }
        await notification();
    });
    const settled = current.catch((error) => {
        console.error(`[Scene] Asset notification failed (${uuid}):`, error);
    });
    assetNotificationQueues.set(uuid, settled);
    void settled.finally(() => {
        if (assetNotificationQueues.get(uuid) === settled) {
            assetNotificationQueues.delete(uuid);
        }
    });
}
function disposeModuleMessages() {
    assetNotificationGeneration++;
    disposeModuleMessageListeners?.();
    disposeModuleMessageListeners = null;
    assetNotificationQueues.clear();
}
async function listenModuleMessages() {
    disposeModuleMessages();
    const generation = assetNotificationGeneration;
    const { default: scriptManager } = await Promise.resolve().then(() => __importStar(require('../../scripting')));
    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../../assets')));
    const { ScriptProxy } = await Promise.resolve().then(() => __importStar(require('./proxy/script-proxy')));
    const { AssetProxy } = await Promise.resolve().then(() => __importStar(require('./proxy/asset-proxy')));
    // A stop/restart can happen while the dynamic imports above are pending.
    // Do not attach listeners for that invalidated session.
    if (generation !== assetNotificationGeneration) {
        return;
    }
    const onPackBuildEnd = (targetName) => {
        if (targetName === 'editor') {
            void ScriptProxy.investigatePackerDriver();
        }
    };
    const onAssetAdded = (asset) => {
        if (isScriptAsset(asset)) {
            void ScriptProxy.loadScript();
        }
    };
    const onAssetChanged = (asset) => {
        if (isScriptAsset(asset)) {
            void ScriptProxy.scriptChange();
        }
        enqueueAssetNotification(asset.uuid, generation, () => AssetProxy.assetChanged(asset.uuid));
    };
    const onAssetDeleted = (asset) => {
        if (isScriptAsset(asset)) {
            void ScriptProxy.removeScript();
        }
        enqueueAssetNotification(asset.uuid, generation, () => AssetProxy.assetDeleted(asset.uuid));
    };
    scriptManager.on('pack-build-end', onPackBuildEnd);
    assetManager.on('asset-add', onAssetAdded);
    assetManager.on('asset-change', onAssetChanged);
    assetManager.on('asset-delete', onAssetDeleted);
    disposeModuleMessageListeners = () => {
        scriptManager.off('pack-build-end', onPackBuildEnd);
        assetManager.off('asset-add', onAssetAdded);
        assetManager.off('asset-change', onAssetChanged);
        assetManager.off('asset-delete', onAssetDeleted);
    };
}
