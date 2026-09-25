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
const common_1 = require("../common");
const rpc_1 = require("./rpc");
const utils_1 = require("./utils");
const engine_1 = require("../../engine");
const path_1 = require("path");
const service_manager_1 = require("./service/service-manager");
const editor_shim_1 = require("./editor-shim");
async function startup() {
    // 监听进程退出事件
    process.on('message', (msg) => {
        if (msg === 'scene-process:exit') {
            rpc_1.Rpc.dispose();
            process.disconnect?.(); // 关闭 IPC
            process.exit(0); // 退出进程
        }
    });
    // 父进程死亡时 IPC 通道断开，立即退出避免被 launchd 收养成为孤儿进程
    process.on('disconnect', () => {
        console.log('[Scene] Parent disconnected, exiting');
        process.exit(0);
    });
    console.log(`[Scene] startup worker pid: ${process.pid}`);
    console.log(`[Scene] parse args ${process.argv}`);
    const { enginePath, projectPath, serverURL } = (0, utils_1.parseCommandLineArgs)(process.argv);
    if (!enginePath || !projectPath) {
        throw new Error('enginePath or projectPath is not set');
    }
    // 初始化 service-manager
    (0, editor_shim_1.installSceneEditorShim)(projectPath);
    service_manager_1.serviceManager.initialize(serverURL ?? '');
    await engine_1.Engine.init(enginePath);
    const libraryPath = (0, path_1.join)(projectPath, 'library');
    const assetBase = (0, utils_1.resolveSceneAssetBase)(serverURL, libraryPath);
    await engine_1.Engine.initEngine({
        serverURL: serverURL,
        importBase: assetBase,
        nativeBase: assetBase,
        writablePath: (0, path_1.join)(projectPath, 'temp'),
        enableCustomPipeline: false,
    }, async () => {
        // 导入 service，处理装饰器，捕获开发的 api
        await Promise.resolve().then(() => __importStar(require('./service')));
        console.log('[Scene] import service');
        await rpc_1.Rpc.startup();
        console.log('[Scene] startup Rpc');
        const { Service } = await Promise.resolve().then(() => __importStar(require('./service/core/decorator')));
        globalThis.cce = {
            Script: Service.Script
        };
    }, async () => {
        await cc.game.run();
        // 初始化 engine 服务
        const { Service } = await Promise.resolve().then(() => __importStar(require('./service/core/decorator')));
        await Service.Engine.init();
        await service_manager_1.serviceManager.initAllServices();
    });
    console.log('[Scene] initEngine success');
    // 发送消息给父进程
    process.send?.(common_1.SceneReadyChannel);
    console.log(`[Scene] startup worker success, cocos version: ${cc.ENGINE_VERSION}`);
}
startup().catch(err => {
    console.error('[Scene] Startup fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3MvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQUE4QztBQUM5QywrQkFBNEI7QUFDNUIsbUNBQXNFO0FBQ3RFLHlDQUFzQztBQUN0QywrQkFBNEI7QUFDNUIsK0RBQTJEO0FBQzNELCtDQUF1RDtBQUV2RCxLQUFLLFVBQVUsT0FBTztJQUNsQixXQUFXO0lBQ1gsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUMxQixJQUFJLEdBQUcsS0FBSyxvQkFBb0IsRUFBRSxDQUFDO1lBQy9CLFNBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUztZQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsT0FBTztRQUMzQixDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCwyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUMsQ0FBQztRQUNwRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFFMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbEQsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBQSw0QkFBb0IsRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEYsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLElBQUEsb0NBQXNCLEVBQUMsV0FBVyxDQUFDLENBQUM7SUFDcEMsZ0NBQWMsQ0FBQyxVQUFVLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRTNDLE1BQU0sZUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQUksRUFBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDakQsTUFBTSxTQUFTLEdBQUcsSUFBQSw2QkFBcUIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDaEUsTUFBTSxlQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3BCLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLFVBQVUsRUFBRSxTQUFTO1FBQ3JCLFVBQVUsRUFBRSxTQUFTO1FBQ3JCLFlBQVksRUFBRSxJQUFBLFdBQUksRUFBQyxXQUFXLEVBQUUsTUFBTSxDQUFDO1FBQ3ZDLG9CQUFvQixFQUFFLEtBQUs7S0FDOUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNWLDZCQUE2QjtRQUM3Qix3REFBYSxXQUFXLEdBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDdEMsTUFBTSxTQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBRW5DLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyx3REFBYSwwQkFBMEIsR0FBQyxDQUFDO1FBQzVELFVBQVUsQ0FBQyxHQUFXLEdBQUc7WUFDdEIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1NBQ3pCLENBQUM7SUFDTixDQUFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDVixNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEIsZ0JBQWdCO1FBQ2hCLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyx3REFBYSwwQkFBMEIsR0FBQyxDQUFDO1FBQzdELE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixNQUFNLGdDQUFjLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFFMUMsV0FBVztJQUNYLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQywwQkFBaUIsQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0RBQWtELEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZGLENBQUM7QUFFRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDbEIsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2NlbmVSZWFkeUNoYW5uZWwgfSBmcm9tICcuLi9jb21tb24nO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi9ycGMnO1xuaW1wb3J0IHsgcGFyc2VDb21tYW5kTGluZUFyZ3MsIHJlc29sdmVTY2VuZUFzc2V0QmFzZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vZW5naW5lJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHNlcnZpY2VNYW5hZ2VyIH0gZnJvbSAnLi9zZXJ2aWNlL3NlcnZpY2UtbWFuYWdlcic7XG5pbXBvcnQgeyBpbnN0YWxsU2NlbmVFZGl0b3JTaGltIH0gZnJvbSAnLi9lZGl0b3Itc2hpbSc7XG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0dXAoKSB7XG4gICAgLy8g55uR5ZCs6L+b56iL6YCA5Ye65LqL5Lu2XG4gICAgcHJvY2Vzcy5vbignbWVzc2FnZScsIChtc2cpID0+IHtcbiAgICAgICAgaWYgKG1zZyA9PT0gJ3NjZW5lLXByb2Nlc3M6ZXhpdCcpIHtcbiAgICAgICAgICAgIFJwYy5kaXNwb3NlKCk7XG4gICAgICAgICAgICBwcm9jZXNzLmRpc2Nvbm5lY3Q/LigpOyAvLyDlhbPpl60gSVBDXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMCk7Ly8g6YCA5Ye66L+b56iLXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOeItui/m+eoi+atu+S6oeaXtiBJUEMg6YCa6YGT5pat5byA77yM56uL5Y2z6YCA5Ye66YG/5YWN6KKrIGxhdW5jaGQg5pS25YW75oiQ5Li65a2k5YS/6L+b56iLXG4gICAgcHJvY2Vzcy5vbignZGlzY29ubmVjdCcsICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tTY2VuZV0gUGFyZW50IGRpc2Nvbm5lY3RlZCwgZXhpdGluZycpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhgW1NjZW5lXSBzdGFydHVwIHdvcmtlciBwaWQ6ICR7cHJvY2Vzcy5waWR9YCk7XG5cbiAgICBjb25zb2xlLmxvZyhgW1NjZW5lXSBwYXJzZSBhcmdzICR7cHJvY2Vzcy5hcmd2fWApO1xuICAgIGNvbnN0IHsgZW5naW5lUGF0aCwgcHJvamVjdFBhdGgsIHNlcnZlclVSTCB9ID0gcGFyc2VDb21tYW5kTGluZUFyZ3MocHJvY2Vzcy5hcmd2KTtcbiAgICBpZiAoIWVuZ2luZVBhdGggfHwgIXByb2plY3RQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW5naW5lUGF0aCBvciBwcm9qZWN0UGF0aCBpcyBub3Qgc2V0Jyk7XG4gICAgfVxuXG4gICAgLy8g5Yid5aeL5YyWIHNlcnZpY2UtbWFuYWdlclxuICAgIGluc3RhbGxTY2VuZUVkaXRvclNoaW0ocHJvamVjdFBhdGgpO1xuICAgIHNlcnZpY2VNYW5hZ2VyLmluaXRpYWxpemUoc2VydmVyVVJMID8/ICcnKTtcblxuICAgIGF3YWl0IEVuZ2luZS5pbml0KGVuZ2luZVBhdGgpO1xuICAgIGNvbnN0IGxpYnJhcnlQYXRoID0gam9pbihwcm9qZWN0UGF0aCwgJ2xpYnJhcnknKTtcbiAgICBjb25zdCBhc3NldEJhc2UgPSByZXNvbHZlU2NlbmVBc3NldEJhc2Uoc2VydmVyVVJMLCBsaWJyYXJ5UGF0aCk7XG4gICAgYXdhaXQgRW5naW5lLmluaXRFbmdpbmUoe1xuICAgICAgICBzZXJ2ZXJVUkw6IHNlcnZlclVSTCxcbiAgICAgICAgaW1wb3J0QmFzZTogYXNzZXRCYXNlLFxuICAgICAgICBuYXRpdmVCYXNlOiBhc3NldEJhc2UsXG4gICAgICAgIHdyaXRhYmxlUGF0aDogam9pbihwcm9qZWN0UGF0aCwgJ3RlbXAnKSxcbiAgICAgICAgZW5hYmxlQ3VzdG9tUGlwZWxpbmU6IGZhbHNlLFxuICAgIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8g5a+85YWlIHNlcnZpY2XvvIzlpITnkIboo4XppbDlmajvvIzmjZXojrflvIDlj5HnmoQgYXBpXG4gICAgICAgIGF3YWl0IGltcG9ydCgnLi9zZXJ2aWNlJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2NlbmVdIGltcG9ydCBzZXJ2aWNlJyk7XG4gICAgICAgIGF3YWl0IFJwYy5zdGFydHVwKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2NlbmVdIHN0YXJ0dXAgUnBjJyk7XG5cbiAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmljZS9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICAoZ2xvYmFsVGhpcy5jY2UgYXMgYW55KSA9IHtcbiAgICAgICAgICAgIFNjcmlwdDogU2VydmljZS5TY3JpcHRcbiAgICAgICAgfTtcbiAgICB9LCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNjLmdhbWUucnVuKCk7XG4gICAgICAgIC8vIOWIneWni+WMliBlbmdpbmUg5pyN5YqhXG4gICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZpY2UvY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgYXdhaXQgU2VydmljZS5FbmdpbmUuaW5pdCgpO1xuICAgICAgICBhd2FpdCBzZXJ2aWNlTWFuYWdlci5pbml0QWxsU2VydmljZXMoKTtcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdbU2NlbmVdIGluaXRFbmdpbmUgc3VjY2VzcycpO1xuXG4gICAgLy8g5Y+R6YCB5raI5oGv57uZ54i26L+b56iLXG4gICAgcHJvY2Vzcy5zZW5kPy4oU2NlbmVSZWFkeUNoYW5uZWwpO1xuICAgIGNvbnNvbGUubG9nKGBbU2NlbmVdIHN0YXJ0dXAgd29ya2VyIHN1Y2Nlc3MsIGNvY29zIHZlcnNpb246ICR7Y2MuRU5HSU5FX1ZFUlNJT059YCk7XG59XG5cbnN0YXJ0dXAoKS5jYXRjaChlcnIgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tTY2VuZV0gU3RhcnR1cCBmYXRhbCBlcnJvcjonLCBlcnIpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuIl19