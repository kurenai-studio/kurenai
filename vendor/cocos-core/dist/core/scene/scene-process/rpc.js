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
exports.Rpc = exports.RpcProxy = void 0;
const process_rpc_1 = require("../process-rpc");
class RpcProxy {
    rpcInstance = null;
    webServerUrl;
    getInstance() {
        if (!this.rpcInstance) {
            throw new Error('[Scene] Rpc instance is not started!');
        }
        return this.rpcInstance;
    }
    /** Returns a URL only when this proxy owns the browser Web RPC transport. */
    getWebServerUrl() {
        return this.webServerUrl;
    }
    async startup(options) {
        // 在创建新实例前，先清理旧实例，防止内存泄漏
        this.dispose();
        this.rpcInstance = new process_rpc_1.ProcessRPC();
        if (options?.serverURL) {
            this.webServerUrl = options.serverURL;
            this.rpcInstance.setWebTransport(options.serverURL);
            console.log('[Scene] Scene Process Web RPC ready');
        }
        else {
            this.rpcInstance.attach(process);
            const { Service } = await Promise.resolve().then(() => __importStar(require('./service/core/decorator')));
            this.rpcInstance.register(Service);
            console.log('[Scene] Scene Process RPC ready');
        }
    }
    /**
     * 清理 RPC 实例
     */
    dispose() {
        if (!this.rpcInstance) {
            this.webServerUrl = undefined;
            return;
        }
        console.log('[Node] Disposing RPC instance');
        try {
            this.rpcInstance.dispose();
        }
        catch (error) {
            console.warn('[Node] Error disposing RPC instance:', error);
        }
        finally {
            this.rpcInstance = null;
            this.webServerUrl = undefined;
        }
    }
}
exports.RpcProxy = RpcProxy;
exports.Rpc = new RpcProxy();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9ycGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQTRDO0FBRzVDLE1BQWEsUUFBUTtJQUNULFdBQVcsR0FBbUMsSUFBSSxDQUFDO0lBQ25ELFlBQVksQ0FBcUI7SUFFbEMsV0FBVztRQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVELDZFQUE2RTtJQUN0RSxlQUFlO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUM3QixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUErQjtRQUN6Qyx3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLHdCQUFVLEVBQWUsQ0FBQztRQUNqRCxJQUFJLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUN2RCxDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyx3REFBYSwwQkFBMEIsR0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTztRQUNILElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUM7WUFDOUIsT0FBTztRQUNYLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEUsQ0FBQztnQkFBUyxDQUFDO1lBQ1AsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUM7UUFDbEMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQW5ERCw0QkFtREM7QUFFWSxRQUFBLEdBQUcsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvY2Vzc1JQQyB9IGZyb20gJy4uL3Byb2Nlc3MtcnBjJztcbmltcG9ydCB0eXBlIHsgSU1haW5Nb2R1bGUgfSBmcm9tICcuLi9tYWluLXByb2Nlc3MnO1xuXG5leHBvcnQgY2xhc3MgUnBjUHJveHkge1xuICAgIHByaXZhdGUgcnBjSW5zdGFuY2U6IFByb2Nlc3NSUEM8SU1haW5Nb2R1bGU+IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSB3ZWJTZXJ2ZXJVcmw6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIHB1YmxpYyBnZXRJbnN0YW5jZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJwY0luc3RhbmNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tTY2VuZV0gUnBjIGluc3RhbmNlIGlzIG5vdCBzdGFydGVkIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJwY0luc3RhbmNlO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIGEgVVJMIG9ubHkgd2hlbiB0aGlzIHByb3h5IG93bnMgdGhlIGJyb3dzZXIgV2ViIFJQQyB0cmFuc3BvcnQuICovXG4gICAgcHVibGljIGdldFdlYlNlcnZlclVybCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gdGhpcy53ZWJTZXJ2ZXJVcmw7XG4gICAgfVxuXG4gICAgYXN5bmMgc3RhcnR1cChvcHRpb25zPzogeyBzZXJ2ZXJVUkw6IHN0cmluZyB9KSB7XG4gICAgICAgIC8vIOWcqOWIm+W7uuaWsOWunuS+i+WJje+8jOWFiOa4heeQhuaXp+WunuS+i++8jOmYsuatouWGheWtmOazhOa8j1xuICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5ycGNJbnN0YW5jZSA9IG5ldyBQcm9jZXNzUlBDPElNYWluTW9kdWxlPigpO1xuICAgICAgICBpZiAob3B0aW9ucz8uc2VydmVyVVJMKSB7XG4gICAgICAgICAgICB0aGlzLndlYlNlcnZlclVybCA9IG9wdGlvbnMuc2VydmVyVVJMO1xuICAgICAgICAgICAgdGhpcy5ycGNJbnN0YW5jZS5zZXRXZWJUcmFuc3BvcnQob3B0aW9ucy5zZXJ2ZXJVUkwpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTY2VuZV0gU2NlbmUgUHJvY2VzcyBXZWIgUlBDIHJlYWR5Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJwY0luc3RhbmNlLmF0dGFjaChwcm9jZXNzKTtcbiAgICAgICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZpY2UvY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgICAgIHRoaXMucnBjSW5zdGFuY2UucmVnaXN0ZXIoU2VydmljZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NjZW5lXSBTY2VuZSBQcm9jZXNzIFJQQyByZWFkeScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riF55CGIFJQQyDlrp7kvotcbiAgICAgKi9cbiAgICBkaXNwb3NlKCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMucnBjSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRoaXMud2ViU2VydmVyVXJsID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1tOb2RlXSBEaXNwb3NpbmcgUlBDIGluc3RhbmNlJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnJwY0luc3RhbmNlLmRpc3Bvc2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW05vZGVdIEVycm9yIGRpc3Bvc2luZyBSUEMgaW5zdGFuY2U6JywgZXJyb3IpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5ycGNJbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLndlYlNlcnZlclVybCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJwYyA9IG5ldyBScGNQcm94eSgpO1xuIl19