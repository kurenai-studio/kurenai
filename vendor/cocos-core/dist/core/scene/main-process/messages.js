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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9tYWluLXByb2Nlc3MvbWVzc2FnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQ0Esc0RBS0M7QUFFRCxvREFnREM7QUF2RkQsSUFBSSwyQkFBMkIsR0FBRyxDQUFDLENBQUM7QUFDcEMsSUFBSSw2QkFBNkIsR0FBd0IsSUFBSSxDQUFDO0FBQzlELE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7QUFFakUsU0FBUyxhQUFhLENBQUMsS0FBYTtJQUNoQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLFlBQVksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxZQUFZLENBQUM7QUFDeEYsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQUMsSUFBWSxFQUFFLFVBQWtCLEVBQUUsWUFBaUM7SUFDakcsTUFBTSxRQUFRLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN4RSxNQUFNLE9BQU8sR0FBRyxRQUFRO1NBQ25CLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsSUFBSSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDekUsQ0FBQyxDQUFDO1NBQ0QsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2Isa0ZBQWtGO1FBQ2xGLElBQUksVUFBVSxLQUFLLDJCQUEyQixFQUFFLENBQUM7WUFDN0MsT0FBTztRQUNYLENBQUM7UUFDRCxNQUFNLFlBQVksRUFBRSxDQUFDO0lBQ3pCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFD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QUUsY0FBYyxDQUFDLENBQUM7SUFDaEQsWUFBWSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFFaEQsNkJBQTZCLEdBQUcsR0FBRyxFQUFFO1FBQ2pDLGFBQWEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDcEQsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDNUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDakQsWUFBWSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDckQsQ0FBQyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSUFzc2V0IH0gZnJvbSAnLi4vLi4vYXNzZXRzL0B0eXBlcy9wcm90ZWN0ZWQvYXNzZXQnO1xuXG5sZXQgYXNzZXROb3RpZmljYXRpb25HZW5lcmF0aW9uID0gMDtcbmxldCBkaXNwb3NlTW9kdWxlTWVzc2FnZUxpc3RlbmVyczogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5jb25zdCBhc3NldE5vdGlmaWNhdGlvblF1ZXVlcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPHZvaWQ+PigpO1xuXG5mdW5jdGlvbiBpc1NjcmlwdEFzc2V0KGFzc2V0OiBJQXNzZXQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXNzZXQubWV0YS5pbXBvcnRlciA9PT0gJ3R5cGVzY3JpcHQnIHx8IGFzc2V0Lm1ldGEuaW1wb3J0ZXIgPT09ICdqYXZhc2NyaXB0Jztcbn1cblxuZnVuY3Rpb24gZW5xdWV1ZUFzc2V0Tm90aWZpY2F0aW9uKHV1aWQ6IHN0cmluZywgZ2VuZXJhdGlvbjogbnVtYmVyLCBub3RpZmljYXRpb246ICgpID0+IFByb21pc2U8dm9pZD4pOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IGFzc2V0Tm90aWZpY2F0aW9uUXVldWVzLmdldCh1dWlkKSA/PyBQcm9taXNlLnJlc29sdmUoKTtcbiAgICBjb25zdCBjdXJyZW50ID0gcHJldmlvdXNcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW1NjZW5lXSBBc3NldCBub3RpZmljYXRpb24gZmFpbGVkICgke3V1aWR9KTpgLCBlcnJvcik7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIC8vIFNjZW5lIHdvcmtlciByZXN0YXJ0L2Rpc3Bvc2FsIGludmFsaWRhdGVzIHF1ZXVlZCB3b3JrIGZyb20gdGhlIG9sZCBSUEMgc2Vzc2lvbi5cbiAgICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSBhc3NldE5vdGlmaWNhdGlvbkdlbmVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBub3RpZmljYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgY29uc3Qgc2V0dGxlZCA9IGN1cnJlbnQuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtTY2VuZV0gQXNzZXQgbm90aWZpY2F0aW9uIGZhaWxlZCAoJHt1dWlkfSk6YCwgZXJyb3IpO1xuICAgIH0pO1xuICAgIGFzc2V0Tm90aWZpY2F0aW9uUXVldWVzLnNldCh1dWlkLCBzZXR0bGVkKTtcbiAgICB2b2lkIHNldHRsZWQuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIGlmIChhc3NldE5vdGlmaWNhdGlvblF1ZXVlcy5nZXQodXVpZCkgPT09IHNldHRsZWQpIHtcbiAgICAgICAgICAgIGFzc2V0Tm90aWZpY2F0aW9uUXVldWVzLmRlbGV0ZSh1dWlkKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlzcG9zZU1vZHVsZU1lc3NhZ2VzKCk6IHZvaWQge1xuICAgIGFzc2V0Tm90aWZpY2F0aW9uR2VuZXJhdGlvbisrO1xuICAgIGRpc3Bvc2VNb2R1bGVNZXNzYWdlTGlzdGVuZXJzPy4oKTtcbiAgICBkaXNwb3NlTW9kdWxlTWVzc2FnZUxpc3RlbmVycyA9IG51bGw7XG4gICAgYXNzZXROb3RpZmljYXRpb25RdWV1ZXMuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpc3Rlbk1vZHVsZU1lc3NhZ2VzKCkge1xuICAgIGRpc3Bvc2VNb2R1bGVNZXNzYWdlcygpO1xuICAgIGNvbnN0IGdlbmVyYXRpb24gPSBhc3NldE5vdGlmaWNhdGlvbkdlbmVyYXRpb247XG4gICAgY29uc3QgeyBkZWZhdWx0OiBzY3JpcHRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL3NjcmlwdGluZycpO1xuICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2Fzc2V0cycpO1xuICAgIGNvbnN0IHsgU2NyaXB0UHJveHkgfSA9IGF3YWl0IGltcG9ydCgnLi9wcm94eS9zY3JpcHQtcHJveHknKTtcbiAgICBjb25zdCB7IEFzc2V0UHJveHkgfSA9IGF3YWl0IGltcG9ydCgnLi9wcm94eS9hc3NldC1wcm94eScpO1xuXG4gICAgLy8gQSBzdG9wL3Jlc3RhcnQgY2FuIGhhcHBlbiB3aGlsZSB0aGUgZHluYW1pYyBpbXBvcnRzIGFib3ZlIGFyZSBwZW5kaW5nLlxuICAgIC8vIERvIG5vdCBhdHRhY2ggbGlzdGVuZXJzIGZvciB0aGF0IGludmFsaWRhdGVkIHNlc3Npb24uXG4gICAgaWYgKGdlbmVyYXRpb24gIT09IGFzc2V0Tm90aWZpY2F0aW9uR2VuZXJhdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb25QYWNrQnVpbGRFbmQgPSAodGFyZ2V0TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICh0YXJnZXROYW1lID09PSAnZWRpdG9yJykge1xuICAgICAgICAgICAgdm9pZCBTY3JpcHRQcm94eS5pbnZlc3RpZ2F0ZVBhY2tlckRyaXZlcigpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBvbkFzc2V0QWRkZWQgPSAoYXNzZXQ6IElBc3NldCkgPT4ge1xuICAgICAgICBpZiAoaXNTY3JpcHRBc3NldChhc3NldCkpIHtcbiAgICAgICAgICAgIHZvaWQgU2NyaXB0UHJveHkubG9hZFNjcmlwdCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBvbkFzc2V0Q2hhbmdlZCA9IChhc3NldDogSUFzc2V0KSA9PiB7XG4gICAgICAgIGlmIChpc1NjcmlwdEFzc2V0KGFzc2V0KSkge1xuICAgICAgICAgICAgdm9pZCBTY3JpcHRQcm94eS5zY3JpcHRDaGFuZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBlbnF1ZXVlQXNzZXROb3RpZmljYXRpb24oYXNzZXQudXVpZCwgZ2VuZXJhdGlvbiwgKCkgPT4gQXNzZXRQcm94eS5hc3NldENoYW5nZWQoYXNzZXQudXVpZCkpO1xuICAgIH07XG4gICAgY29uc3Qgb25Bc3NldERlbGV0ZWQgPSAoYXNzZXQ6IElBc3NldCkgPT4ge1xuICAgICAgICBpZiAoaXNTY3JpcHRBc3NldChhc3NldCkpIHtcbiAgICAgICAgICAgIHZvaWQgU2NyaXB0UHJveHkucmVtb3ZlU2NyaXB0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZW5xdWV1ZUFzc2V0Tm90aWZpY2F0aW9uKGFzc2V0LnV1aWQsIGdlbmVyYXRpb24sICgpID0+IEFzc2V0UHJveHkuYXNzZXREZWxldGVkKGFzc2V0LnV1aWQpKTtcbiAgICB9O1xuXG4gICAgc2NyaXB0TWFuYWdlci5vbigncGFjay1idWlsZC1lbmQnLCBvblBhY2tCdWlsZEVuZCk7XG4gICAgYXNzZXRNYW5hZ2VyLm9uKCdhc3NldC1hZGQnLCBvbkFzc2V0QWRkZWQpO1xuICAgIGFzc2V0TWFuYWdlci5vbignYXNzZXQtY2hhbmdlJywgb25Bc3NldENoYW5nZWQpO1xuICAgIGFzc2V0TWFuYWdlci5vbignYXNzZXQtZGVsZXRlJywgb25Bc3NldERlbGV0ZWQpO1xuXG4gICAgZGlzcG9zZU1vZHVsZU1lc3NhZ2VMaXN0ZW5lcnMgPSAoKSA9PiB7XG4gICAgICAgIHNjcmlwdE1hbmFnZXIub2ZmKCdwYWNrLWJ1aWxkLWVuZCcsIG9uUGFja0J1aWxkRW5kKTtcbiAgICAgICAgYXNzZXRNYW5hZ2VyLm9mZignYXNzZXQtYWRkJywgb25Bc3NldEFkZGVkKTtcbiAgICAgICAgYXNzZXRNYW5hZ2VyLm9mZignYXNzZXQtY2hhbmdlJywgb25Bc3NldENoYW5nZWQpO1xuICAgICAgICBhc3NldE1hbmFnZXIub2ZmKCdhc3NldC1kZWxldGUnLCBvbkFzc2V0RGVsZXRlZCk7XG4gICAgfTtcbn1cbiJdfQ==