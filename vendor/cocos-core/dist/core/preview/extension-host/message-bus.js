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
exports.MessageBus = void 0;
/**
 * Editor.Message 的 CLI 实现：把 `Editor.Message.request(domain, message, ...args)` 路由到：
 * - domain 为已注册扩展名（含扩展自身 self-IPC）：按 contributions.messages 把 message 映射到
 *   主进程导出的方法名，调用扩展自己的处理函数；
 * - domain === 'asset-db'：映射到 CLI 的 assetManager；
 * - domain === 'scene'：最小桩实现；
 * - 其它：告警并返回 undefined（绝不抛出，避免拖垮预览）。
 */
class MessageBus {
    _registry = new Map();
    register(ext, mainModule) {
        this._registry.set(ext.name, { ext, mainModule });
    }
    /** 已注册的扩展主进程模块（供 dispose 时调用各自 unload）。 */
    getRegisteredMains() {
        return Array.from(this._registry.entries()).map(([name, reg]) => ({ name, mainModule: reg.mainModule }));
    }
    async dispatch(domain, message, ...args) {
        try {
            const reg = this._registry.get(domain);
            if (reg) {
                return await this._dispatchExtension(reg, message, args);
            }
            if (domain === 'asset-db') {
                return await this._dispatchAssetDb(message, args);
            }
            if (domain === 'scene') {
                return await this._dispatchScene(message);
            }
            if (domain === 'preview') {
                return this._dispatchPreview(message);
            }
            console.warn(`[ExtensionHost] unhandled Editor.Message.request: ${domain}/${message}`);
            return undefined;
        }
        catch (err) {
            console.warn(`[ExtensionHost] Editor.Message.request ${domain}/${message} failed:`, err);
            return undefined;
        }
    }
    async _dispatchExtension(reg, message, args) {
        const decl = reg.ext.messages[message];
        if (!decl || !decl.methods || !decl.methods.length) {
            return undefined;
        }
        let result;
        for (const fn of decl.methods) {
            // 跳过面板/渲染进程处理函数（如 'default.executePanelMethod'）—— CLI 无渲染进程
            if (fn.includes('.')) {
                continue;
            }
            const target = reg.mainModule?.methods ?? reg.mainModule;
            const handler = target?.[fn];
            if (typeof handler === 'function') {
                const r = await handler.apply(target, args);
                if (result === undefined && r !== undefined) {
                    result = r;
                }
            }
        }
        return result;
    }
    async _dispatchAssetDb(message, args) {
        const { assetManager } = await Promise.resolve().then(() => __importStar(require('../../assets')));
        switch (message) {
            case 'query-asset-info':
                return assetManager.queryAssetInfo(args[0]);
            case 'query-asset-info-by-uuid':
                return assetManager.queryAssetInfoByUUID(args[0]);
            case 'query-uuid': {
                const info = assetManager.queryAssetInfo(args[0]);
                return info?.uuid;
            }
            case 'query-path': {
                const info = assetManager.queryAssetInfo(args[0]);
                return info?.file;
            }
            case 'query-url': {
                const info = assetManager.queryAssetInfo(args[0]);
                return info?.url;
            }
            case 'query-assets':
                return assetManager.queryAssetInfos(args[0] || {});
            // 预览态下的写操作（reimport/delete/refresh）忽略
            default:
                return undefined;
        }
    }
    async _dispatchScene(message) {
        switch (message) {
            case 'query-is-ready':
                return true;
            case 'query-dirty':
                return false;
            case 'soft-reload':
                // Creator 用 scene/soft-reload 刷新预览；CLI 映射到现有 live-reload 整页刷新
                await this._triggerReload();
                return undefined;
            default:
                return undefined;
        }
    }
    async _dispatchPreview(message) {
        // Creator 用 preview/reload-terminal 刷新预览；CLI 映射到现有 live-reload
        if (message === 'reload-terminal' || message === 'reload') {
            await this._triggerReload();
        }
        return undefined;
    }
    async _triggerReload() {
        const { triggerPreviewReload } = await Promise.resolve().then(() => __importStar(require('../live-reload')));
        triggerPreviewReload();
    }
}
exports.MessageBus = MessageBus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1idXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L2V4dGVuc2lvbi1ob3N0L21lc3NhZ2UtYnVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU9BOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLFVBQVU7SUFDWCxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7SUFFcEQsUUFBUSxDQUFDLEdBQXFCLEVBQUUsVUFBZTtRQUMzQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELDJDQUEyQztJQUMzQyxrQkFBa0I7UUFDZCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdHLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQWMsRUFBRSxPQUFlLEVBQUUsR0FBRyxJQUFXO1FBQzFELElBQUksQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ04sT0FBTyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFDRCxJQUFJLE1BQU0sS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUNELElBQUksTUFBTSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNyQixPQUFPLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBQ0QsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLHFEQUFxRCxNQUFNLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN2RixPQUFPLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsMENBQTBDLE1BQU0sSUFBSSxPQUFPLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RixPQUFPLFNBQVMsQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQztJQUVPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFpQixFQUFFLE9BQWUsRUFBRSxJQUFXO1FBQzVFLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqRCxPQUFPLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBQ0QsSUFBSSxNQUFXLENBQUM7UUFDaEIsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsNERBQTREO1lBQzVELElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQixTQUFTO1lBQ2IsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFDekQsTUFBTSxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0IsSUFBSSxPQUFPLE9BQU8sS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxNQUFNLEtBQUssU0FBUyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDMUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDZixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQWUsRUFBRSxJQUFXO1FBQ3ZELE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyx3REFBYSxjQUFjLEdBQUMsQ0FBQztRQUN0RCxRQUFRLE9BQU8sRUFBRSxDQUFDO1lBQ2QsS0FBSyxrQkFBa0I7Z0JBQ25CLE9BQU8sWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRCxLQUFLLDBCQUEwQjtnQkFDM0IsT0FBTyxZQUFZLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxPQUFPLElBQUksRUFBRSxJQUFJLENBQUM7WUFDdEIsQ0FBQztZQUNELEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDaEIsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsT0FBUSxJQUFZLEVBQUUsSUFBSSxDQUFDO1lBQy9CLENBQUM7WUFDRCxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsT0FBUSxJQUFZLEVBQUUsR0FBRyxDQUFDO1lBQzlCLENBQUM7WUFDRCxLQUFLLGNBQWM7Z0JBQ2YsT0FBTyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2RCxzQ0FBc0M7WUFDdEM7Z0JBQ0ksT0FBTyxTQUFTLENBQUM7UUFDekIsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQWU7UUFDeEMsUUFBUSxPQUFPLEVBQUUsQ0FBQztZQUNkLEtBQUssZ0JBQWdCO2dCQUNqQixPQUFPLElBQUksQ0FBQztZQUNoQixLQUFLLGFBQWE7Z0JBQ2QsT0FBTyxLQUFLLENBQUM7WUFDakIsS0FBSyxhQUFhO2dCQUNkLDhEQUE4RDtnQkFDOUQsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sU0FBUyxDQUFDO1lBQ3JCO2dCQUNJLE9BQU8sU0FBUyxDQUFDO1FBQ3pCLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQWU7UUFDMUMsK0RBQStEO1FBQy9ELElBQUksT0FBTyxLQUFLLGlCQUFpQixJQUFJLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN4RCxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVPLEtBQUssQ0FBQyxjQUFjO1FBQ3hCLE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGdCQUFnQixHQUFDLENBQUM7UUFDaEUsb0JBQW9CLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQ0o7QUFoSEQsZ0NBZ0hDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJldmlld0V4dGVuc2lvbiB9IGZyb20gJy4vc2Nhbm5lcic7XG5cbmludGVyZmFjZSBSZWdpc3RyYXRpb24ge1xuICAgIGV4dDogUHJldmlld0V4dGVuc2lvbjtcbiAgICBtYWluTW9kdWxlOiBhbnk7XG59XG5cbi8qKlxuICogRWRpdG9yLk1lc3NhZ2Ug55qEIENMSSDlrp7njrDvvJrmioogYEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoZG9tYWluLCBtZXNzYWdlLCAuLi5hcmdzKWAg6Lev55Sx5Yiw77yaXG4gKiAtIGRvbWFpbiDkuLrlt7Lms6jlhozmianlsZXlkI3vvIjlkKvmianlsZXoh6rouqsgc2VsZi1JUEPvvInvvJrmjIkgY29udHJpYnV0aW9ucy5tZXNzYWdlcyDmioogbWVzc2FnZSDmmKDlsITliLBcbiAqICAg5Li76L+b56iL5a+85Ye655qE5pa55rOV5ZCN77yM6LCD55So5omp5bGV6Ieq5bex55qE5aSE55CG5Ye95pWw77ybXG4gKiAtIGRvbWFpbiA9PT0gJ2Fzc2V0LWRiJ++8muaYoOWwhOWIsCBDTEkg55qEIGFzc2V0TWFuYWdlcu+8m1xuICogLSBkb21haW4gPT09ICdzY2VuZSfvvJrmnIDlsI/moanlrp7njrDvvJtcbiAqIC0g5YW25a6D77ya5ZGK6K2m5bm26L+U5ZueIHVuZGVmaW5lZO+8iOe7neS4jeaKm+WHuu+8jOmBv+WFjeaLluWerumihOiniO+8ieOAglxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnZUJ1cyB7XG4gICAgcHJpdmF0ZSBfcmVnaXN0cnkgPSBuZXcgTWFwPHN0cmluZywgUmVnaXN0cmF0aW9uPigpO1xuXG4gICAgcmVnaXN0ZXIoZXh0OiBQcmV2aWV3RXh0ZW5zaW9uLCBtYWluTW9kdWxlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnkuc2V0KGV4dC5uYW1lLCB7IGV4dCwgbWFpbk1vZHVsZSB9KTtcbiAgICB9XG5cbiAgICAvKiog5bey5rOo5YaM55qE5omp5bGV5Li76L+b56iL5qih5Z2X77yI5L6bIGRpc3Bvc2Ug5pe26LCD55So5ZCE6IeqIHVubG9hZO+8ieOAgiAqL1xuICAgIGdldFJlZ2lzdGVyZWRNYWlucygpOiB7IG5hbWU6IHN0cmluZzsgbWFpbk1vZHVsZTogYW55IH1bXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX3JlZ2lzdHJ5LmVudHJpZXMoKSkubWFwKChbbmFtZSwgcmVnXSkgPT4gKHsgbmFtZSwgbWFpbk1vZHVsZTogcmVnLm1haW5Nb2R1bGUgfSkpO1xuICAgIH1cblxuICAgIGFzeW5jIGRpc3BhdGNoKGRvbWFpbjogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlZyA9IHRoaXMuX3JlZ2lzdHJ5LmdldChkb21haW4pO1xuICAgICAgICAgICAgaWYgKHJlZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9kaXNwYXRjaEV4dGVuc2lvbihyZWcsIG1lc3NhZ2UsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvbWFpbiA9PT0gJ2Fzc2V0LWRiJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9kaXNwYXRjaEFzc2V0RGIobWVzc2FnZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZG9tYWluID09PSAnc2NlbmUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2Rpc3BhdGNoU2NlbmUobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZG9tYWluID09PSAncHJldmlldycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGlzcGF0Y2hQcmV2aWV3KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbRXh0ZW5zaW9uSG9zdF0gdW5oYW5kbGVkIEVkaXRvci5NZXNzYWdlLnJlcXVlc3Q6ICR7ZG9tYWlufS8ke21lc3NhZ2V9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0V4dGVuc2lvbkhvc3RdIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgJHtkb21haW59LyR7bWVzc2FnZX0gZmFpbGVkOmAsIGVycik7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZGlzcGF0Y2hFeHRlbnNpb24ocmVnOiBSZWdpc3RyYXRpb24sIG1lc3NhZ2U6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkZWNsID0gcmVnLmV4dC5tZXNzYWdlc1ttZXNzYWdlXTtcbiAgICAgICAgaWYgKCFkZWNsIHx8ICFkZWNsLm1ldGhvZHMgfHwgIWRlY2wubWV0aG9kcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIGRlY2wubWV0aG9kcykge1xuICAgICAgICAgICAgLy8g6Lez6L+H6Z2i5p2/L+a4suafk+i/m+eoi+WkhOeQhuWHveaVsO+8iOWmgiAnZGVmYXVsdC5leGVjdXRlUGFuZWxNZXRob2Qn77yJ4oCU4oCUIENMSSDml6DmuLLmn5Pov5vnqItcbiAgICAgICAgICAgIGlmIChmbi5pbmNsdWRlcygnLicpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSByZWcubWFpbk1vZHVsZT8ubWV0aG9kcyA/PyByZWcubWFpbk1vZHVsZTtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0YXJnZXQ/Lltmbl07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgaGFuZGxlci5hcHBseSh0YXJnZXQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCAmJiByICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9kaXNwYXRjaEFzc2V0RGIobWVzc2FnZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2Fzc2V0cycpO1xuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNhc2UgJ3F1ZXJ5LWFzc2V0LWluZm8nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8oYXJnc1swXSk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeS1hc3NldC1pbmZvLWJ5LXV1aWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm9CeVVVSUQoYXJnc1swXSk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeS11dWlkJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8oYXJnc1swXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZm8/LnV1aWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdxdWVyeS1wYXRoJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8oYXJnc1swXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpbmZvIGFzIGFueSk/LmZpbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdxdWVyeS11cmwnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyhhcmdzWzBdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGluZm8gYXMgYW55KT8udXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAncXVlcnktYXNzZXRzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRJbmZvcyhhcmdzWzBdIHx8IHt9KTtcbiAgICAgICAgICAgIC8vIOmihOiniOaAgeS4i+eahOWGmeaTjeS9nO+8iHJlaW1wb3J0L2RlbGV0ZS9yZWZyZXNo77yJ5b+955WlXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9kaXNwYXRjaFNjZW5lKG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZSkge1xuICAgICAgICAgICAgY2FzZSAncXVlcnktaXMtcmVhZHknOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgY2FzZSAncXVlcnktZGlydHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNhc2UgJ3NvZnQtcmVsb2FkJzpcbiAgICAgICAgICAgICAgICAvLyBDcmVhdG9yIOeUqCBzY2VuZS9zb2Z0LXJlbG9hZCDliLfmlrDpooTop4jvvJtDTEkg5pig5bCE5Yiw546w5pyJIGxpdmUtcmVsb2FkIOaVtOmhteWIt+aWsFxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3RyaWdnZXJSZWxvYWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZGlzcGF0Y2hQcmV2aWV3KG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIC8vIENyZWF0b3Ig55SoIHByZXZpZXcvcmVsb2FkLXRlcm1pbmFsIOWIt+aWsOmihOiniO+8m0NMSSDmmKDlsITliLDnjrDmnIkgbGl2ZS1yZWxvYWRcbiAgICAgICAgaWYgKG1lc3NhZ2UgPT09ICdyZWxvYWQtdGVybWluYWwnIHx8IG1lc3NhZ2UgPT09ICdyZWxvYWQnKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl90cmlnZ2VyUmVsb2FkKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF90cmlnZ2VyUmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7IHRyaWdnZXJQcmV2aWV3UmVsb2FkIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2xpdmUtcmVsb2FkJyk7XG4gICAgICAgIHRyaWdnZXJQcmV2aWV3UmVsb2FkKCk7XG4gICAgfVxufVxuIl19