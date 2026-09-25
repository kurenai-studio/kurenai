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
exports.init = init;
exports.migrateFromProject = migrateFromProject;
exports.reload = reload;
exports.migrate = migrate;
exports.get = get;
exports.set = set;
exports.remove = remove;
exports.save = save;
exports.getConfigPath = getConfigPath;
exports.onDidSave = onDidSave;
exports.getMetadata = getMetadata;
async function init(projectPath) {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.initialize(projectPath);
}
async function migrateFromProject() {
    const project = await Promise.resolve().then(() => __importStar(require('../../core/project/index')));
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.migrateFromProject(project.default.path);
}
async function reload() {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.reload();
}
async function migrate() {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.migrate();
}
async function get(key, scope) {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.get(key, scope);
}
async function set(key, value, scope) {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.set(key, value, scope);
}
async function remove(key, scope) {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.remove(key, scope);
}
/**
 * 将配置写入磁盘
 * @param force 是否强制写入（跳过节流/脏检查）
 * @param scope 'project'(默认) -> settings/cocos.config.json；'local' -> profiles/cocos.config.json
 */
async function save(force, scope = 'project') {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.save(force, scope);
}
/**
 * 获取指定作用域配置文件的绝对路径
 * @param scope 'project'(默认) -> settings/cocos.config.json；'local' -> profiles/cocos.config.json
 */
async function getConfigPath(scope = 'project') {
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../../core/configuration/index')));
    return await configurationManager.getConfigPath(scope);
}
/**
 * 注册配置保存事件的监听器
 * @param callback 对应作用域配置文件被写入磁盘时触发
 * @param scope 'project'(默认) -> settings/cocos.config.json；'local' -> profiles/cocos.config.json
 * @returns 取消监听的函数
 */
function onDidSave(callback, scope = 'project') {
    // 同步引入：调用时 configurationManager 必定已初始化
    const { configurationManager } = require('../../core/configuration/index');
    const handler = (_config, savedScope = 'project') => {
        if (savedScope === scope) {
            callback();
        }
    };
    configurationManager.on('configuration:save', handler);
    return () => configurationManager.off('configuration:save', handler);
}
async function getMetadata() {
    const { configurationRegistry } = await Promise.resolve().then(() => __importStar(require('../../core/configuration')));
    return configurationRegistry.getMetadata();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29uZmlndXJhdGlvbi9jb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBTUEsb0JBR0M7QUFFRCxnREFJQztBQUVELHdCQUdDO0FBRUQsMEJBR0M7QUFFRCxrQkFHQztBQUVELGtCQUdDO0FBRUQsd0JBR0M7QUFPRCxvQkFHQztBQU1ELHNDQUdDO0FBUUQsOEJBVUM7QUFNRCxrQ0FHQztBQWhGTSxLQUFLLFVBQVUsSUFBSSxDQUFDLFdBQW1CO0lBQzFDLE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGdDQUFnQyxHQUFDLENBQUM7SUFDaEYsT0FBTyxNQUFNLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRU0sS0FBSyxVQUFVLGtCQUFrQjtJQUNwQyxNQUFNLE9BQU8sR0FBRyx3REFBYSwwQkFBMEIsR0FBQyxDQUFDO0lBQ3pELE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGdDQUFnQyxHQUFDLENBQUM7SUFDaEYsT0FBTyxNQUFNLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0UsQ0FBQztBQUVNLEtBQUssVUFBVSxNQUFNO0lBQ3hCLE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGdDQUFnQyxHQUFDLENBQUM7SUFDaEYsT0FBTyxNQUFNLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQy9DLENBQUM7QUFFTSxLQUFLLFVBQVUsT0FBTztJQUN6QixNQUFNLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyx3REFBYSxnQ0FBZ0MsR0FBQyxDQUFDO0lBQ2hGLE9BQU8sTUFBTSxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoRCxDQUFDO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBSSxHQUFXLEVBQUUsS0FBMEI7SUFDaEUsTUFBTSxFQUFFLG9CQUFvQixFQUFFLEdBQUcsd0RBQWEsZ0NBQWdDLEdBQUMsQ0FBQztJQUNoRixPQUFPLE1BQU0sb0JBQW9CLENBQUMsR0FBRyxDQUFJLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBSSxHQUFXLEVBQUUsS0FBUSxFQUFFLEtBQTBCO0lBQzFFLE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLHdEQUFhLGdDQUFnQyxHQUFDLENBQUM7SUFDaEYsT0FBTyxNQUFNLG9CQUFvQixDQUFDLEdBQUcsQ0FBSSxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFTSxLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQVcsRUFBRSxLQUEwQjtJQUNoRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyx3REFBYSxnQ0FBZ0MsR0FBQyxDQUFDO0lBQ2hGLE9BQU8sTUFBTSxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRDs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxLQUFlLEVBQUUsUUFBNEIsU0FBUztJQUM3RSxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyx3REFBYSxnQ0FBZ0MsR0FBQyxDQUFDO0lBQ2hGLE9BQU8sTUFBTSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsYUFBYSxDQUFDLFFBQTRCLFNBQVM7SUFDckUsTUFBTSxFQUFFLG9CQUFvQixFQUFFLEdBQUcsd0RBQWEsZ0NBQWdDLEdBQUMsQ0FBQztJQUNoRixPQUFPLE1BQU0sb0JBQW9CLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxRQUFvQixFQUFFLFFBQTRCLFNBQVM7SUFDakYsdUNBQXVDO0lBQ3ZDLE1BQU0sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQzNFLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxhQUFpQyxTQUFTLEVBQUUsRUFBRTtRQUM3RSxJQUFJLFVBQVUsS0FBSyxLQUFLLEVBQUUsQ0FBQztZQUN2QixRQUFRLEVBQUUsQ0FBQztRQUNmLENBQUM7SUFDTCxDQUFDLENBQUM7SUFDRixvQkFBb0IsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDekUsQ0FBQztBQU1NLEtBQUssVUFBVSxXQUFXO0lBQzdCLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxHQUFHLHdEQUFhLDBCQUEwQixHQUFDLENBQUM7SUFDM0UsT0FBTyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJQ29uZmlndXJhdGlvbiwgQ29uZmlndXJhdGlvblNjb3BlIH0gZnJvbSAnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL3NjcmlwdC9pbnRlcmZhY2UnO1xuaW1wb3J0IHR5cGUgeyBJQ29jb3NDb25maWd1cmF0aW9uTm9kZSB9IGZyb20gJy4uLy4uL2NvcmUvY29uZmlndXJhdGlvbi9zY3JpcHQvbWV0YWRhdGEnO1xuXG5leHBvcnQgeyBJQ29uZmlndXJhdGlvbiwgQ29uZmlndXJhdGlvblNjb3BlIH0gZnJvbSAnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL3NjcmlwdC9pbnRlcmZhY2UnO1xuZXhwb3J0IHsgSUJhc2VDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL3NjcmlwdC9jb25maWcnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdChwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2NvbmZpZ3VyYXRpb24vaW5kZXgnKTtcbiAgICByZXR1cm4gYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIuaW5pdGlhbGl6ZShwcm9qZWN0UGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlRnJvbVByb2plY3QoKTogUHJvbWlzZTxJQ29uZmlndXJhdGlvbj4ge1xuICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvcHJvamVjdC9pbmRleCcpO1xuICAgIGNvbnN0IHsgY29uZmlndXJhdGlvbk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL2luZGV4Jyk7XG4gICAgcmV0dXJuIGF3YWl0IGNvbmZpZ3VyYXRpb25NYW5hZ2VyLm1pZ3JhdGVGcm9tUHJvamVjdChwcm9qZWN0LmRlZmF1bHQucGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2NvbmZpZ3VyYXRpb24vaW5kZXgnKTtcbiAgICByZXR1cm4gYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIucmVsb2FkKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgY29uZmlndXJhdGlvbk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL2luZGV4Jyk7XG4gICAgcmV0dXJuIGF3YWl0IGNvbmZpZ3VyYXRpb25NYW5hZ2VyLm1pZ3JhdGUoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldDxUPihrZXk6IHN0cmluZywgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCB7IGNvbmZpZ3VyYXRpb25NYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvY29uZmlndXJhdGlvbi9pbmRleCcpO1xuICAgIHJldHVybiBhd2FpdCBjb25maWd1cmF0aW9uTWFuYWdlci5nZXQ8VD4oa2V5LCBzY29wZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXQ8VD4oa2V5OiBzdHJpbmcsIHZhbHVlOiBULCBzY29wZT86IENvbmZpZ3VyYXRpb25TY29wZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHsgY29uZmlndXJhdGlvbk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL2luZGV4Jyk7XG4gICAgcmV0dXJuIGF3YWl0IGNvbmZpZ3VyYXRpb25NYW5hZ2VyLnNldDxUPihrZXksIHZhbHVlLCBzY29wZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmUoa2V5OiBzdHJpbmcsIHNjb3BlPzogQ29uZmlndXJhdGlvblNjb3BlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2NvbmZpZ3VyYXRpb24vaW5kZXgnKTtcbiAgICByZXR1cm4gYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIucmVtb3ZlKGtleSwgc2NvcGUpO1xufVxuXG4vKipcbiAqIOWwhumFjee9ruWGmeWFpeejgeebmFxuICogQHBhcmFtIGZvcmNlIOaYr+WQpuW8uuWItuWGmeWFpe+8iOi3s+i/h+iKgua1gS/ohI/mo4Dmn6XvvIlcbiAqIEBwYXJhbSBzY29wZSAncHJvamVjdCco6buY6K6kKSAtPiBzZXR0aW5ncy9jb2Nvcy5jb25maWcuanNvbu+8mydsb2NhbCcgLT4gcHJvZmlsZXMvY29jb3MuY29uZmlnLmpzb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmUoZm9yY2U/OiBib29sZWFuLCBzY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2NvbmZpZ3VyYXRpb24vaW5kZXgnKTtcbiAgICByZXR1cm4gYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIuc2F2ZShmb3JjZSwgc2NvcGUpO1xufVxuXG4vKipcbiAqIOiOt+WPluaMh+WumuS9nOeUqOWfn+mFjee9ruaWh+S7tueahOe7neWvuei3r+W+hFxuICogQHBhcmFtIHNjb3BlICdwcm9qZWN0Jyjpu5jorqQpIC0+IHNldHRpbmdzL2NvY29zLmNvbmZpZy5qc29u77ybJ2xvY2FsJyAtPiBwcm9maWxlcy9jb2Nvcy5jb25maWcuanNvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29uZmlnUGF0aChzY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IGNvbmZpZ3VyYXRpb25NYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvY29uZmlndXJhdGlvbi9pbmRleCcpO1xuICAgIHJldHVybiBhd2FpdCBjb25maWd1cmF0aW9uTWFuYWdlci5nZXRDb25maWdQYXRoKHNjb3BlKTtcbn1cblxuLyoqXG4gKiDms6jlhozphY3nva7kv53lrZjkuovku7bnmoTnm5HlkKzlmahcbiAqIEBwYXJhbSBjYWxsYmFjayDlr7nlupTkvZznlKjln5/phY3nva7mlofku7booqvlhpnlhaXno4Hnm5jml7bop6blj5FcbiAqIEBwYXJhbSBzY29wZSAncHJvamVjdCco6buY6K6kKSAtPiBzZXR0aW5ncy9jb2Nvcy5jb25maWcuanNvbu+8mydsb2NhbCcgLT4gcHJvZmlsZXMvY29jb3MuY29uZmlnLmpzb25cbiAqIEByZXR1cm5zIOWPlua2iOebkeWQrOeahOWHveaVsFxuICovXG5leHBvcnQgZnVuY3Rpb24gb25EaWRTYXZlKGNhbGxiYWNrOiAoKSA9PiB2b2lkLCBzY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKTogKCkgPT4gdm9pZCB7XG4gICAgLy8g5ZCM5q2l5byV5YWl77ya6LCD55So5pe2IGNvbmZpZ3VyYXRpb25NYW5hZ2VyIOW/heWumuW3suWIneWni+WMllxuICAgIGNvbnN0IHsgY29uZmlndXJhdGlvbk1hbmFnZXIgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvY29uZmlndXJhdGlvbi9pbmRleCcpO1xuICAgIGNvbnN0IGhhbmRsZXIgPSAoX2NvbmZpZzogdW5rbm93biwgc2F2ZWRTY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKSA9PiB7XG4gICAgICAgIGlmIChzYXZlZFNjb3BlID09PSBzY29wZSkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uZmlndXJhdGlvbk1hbmFnZXIub24oJ2NvbmZpZ3VyYXRpb246c2F2ZScsIGhhbmRsZXIpO1xuICAgIHJldHVybiAoKSA9PiBjb25maWd1cmF0aW9uTWFuYWdlci5vZmYoJ2NvbmZpZ3VyYXRpb246c2F2ZScsIGhhbmRsZXIpO1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PSBNZXRhZGF0YSA9PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgeyBJQ29jb3NDb25maWd1cmF0aW9uTm9kZSwgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hIH0gZnJvbSAnLi4vLi4vY29yZS9jb25maWd1cmF0aW9uL3NjcmlwdC9tZXRhZGF0YSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNZXRhZGF0YSgpOiBQcm9taXNlPElDb2Nvc0NvbmZpZ3VyYXRpb25Ob2RlW10+IHtcbiAgICBjb25zdCB7IGNvbmZpZ3VyYXRpb25SZWdpc3RyeSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2NvbmZpZ3VyYXRpb24nKTtcbiAgICByZXR1cm4gY29uZmlndXJhdGlvblJlZ2lzdHJ5LmdldE1ldGFkYXRhKCk7XG59XG4iXX0=