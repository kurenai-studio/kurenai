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
exports.WorkerSceneCommandProvider = void 0;
exports.init = init;
exports.startupWorker = startupWorker;
exports.setCommandProvider = setCommandProvider;
exports.resetCommandProvider = resetCommandProvider;
const scene_1 = require("../../core/scene");
const global_1 = require("../../global");
const rpc_1 = require("../../core/scene/main-process/rpc");
var rpc_2 = require("../../core/scene/main-process/rpc");
Object.defineProperty(exports, "WorkerSceneCommandProvider", { enumerable: true, get: function () { return rpc_2.WorkerSceneCommandProvider; } });
/**
 * Initialize the scene module.
 * Registers the scene middleware and initializes scene config.
 */
async function init() {
    await (0, scene_1.init)();
}
/**
 * Start the scene worker process.
 *
 * @param projectPath Path to the project directory
 */
async function startupWorker(projectPath) {
    const { sceneWorker } = await Promise.resolve().then(() => __importStar(require('../../core/scene/main-process/scene-worker')));
    await sceneWorker.start(global_1.GlobalPaths.enginePath, projectPath);
}
/** Installs a Scene command provider and returns an ownership-bound registration. */
function setCommandProvider(provider) {
    return rpc_1.Rpc.setCommandProvider(provider);
}
/** Clears and disposes the active Scene command provider. */
function resetCommandProvider() {
    rpc_1.Rpc.resetCommandProvider();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3NjZW5lL3NjZW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxvQkFFQztBQU9ELHNDQUdDO0FBR0QsZ0RBSUM7QUFHRCxvREFFQztBQTNDRCw0Q0FBcUQ7QUFDckQseUNBQTJDO0FBQzNDLDJEQUF3RDtBQVd4RCx5REFBK0U7QUFBdEUsaUhBQUEsMEJBQTBCLE9BQUE7QUFFbkM7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLElBQUk7SUFDdEIsTUFBTSxJQUFBLFlBQVMsR0FBRSxDQUFDO0FBQ3RCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLGFBQWEsQ0FBQyxXQUFtQjtJQUNuRCxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsd0RBQWEsNENBQTRDLEdBQUMsQ0FBQztJQUNuRixNQUFNLFdBQVcsQ0FBQyxLQUFLLENBQUMsb0JBQVcsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVELHFGQUFxRjtBQUNyRixTQUFnQixrQkFBa0IsQ0FDOUIsUUFBK0I7SUFFL0IsT0FBTyxTQUFHLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELDZEQUE2RDtBQUM3RCxTQUFnQixvQkFBb0I7SUFDaEMsU0FBRyxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDL0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGluaXQgYXMgc2NlbmVJbml0IH0gZnJvbSAnLi4vLi4vY29yZS9zY2VuZSc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uL2dsb2JhbCc7XG5pbXBvcnQgeyBScGMgfSBmcm9tICcuLi8uLi9jb3JlL3NjZW5lL21haW4tcHJvY2Vzcy9ycGMnO1xuaW1wb3J0IHR5cGUge1xuICAgIElTY2VuZUNvbW1hbmRQcm92aWRlcixcbiAgICBTY2VuZUNvbW1hbmRQcm92aWRlclJlZ2lzdHJhdGlvbixcbn0gZnJvbSAnLi4vLi4vY29yZS9zY2VuZS9tYWluLXByb2Nlc3MvcnBjJztcblxuZXhwb3J0IHR5cGUge1xuICAgIElTY2VuZUNvbW1hbmRQcm92aWRlcixcbiAgICBTY2VuZUNvbW1hbmRQcm92aWRlclJlZ2lzdHJhdGlvbixcbiAgICBTY2VuZUNvbW1hbmRSZXF1ZXN0T3B0aW9ucyxcbn0gZnJvbSAnLi4vLi4vY29yZS9zY2VuZS9tYWluLXByb2Nlc3MvcnBjJztcbmV4cG9ydCB7IFdvcmtlclNjZW5lQ29tbWFuZFByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vY29yZS9zY2VuZS9tYWluLXByb2Nlc3MvcnBjJztcblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBzY2VuZSBtb2R1bGUuXG4gKiBSZWdpc3RlcnMgdGhlIHNjZW5lIG1pZGRsZXdhcmUgYW5kIGluaXRpYWxpemVzIHNjZW5lIGNvbmZpZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc2NlbmVJbml0KCk7XG59XG5cbi8qKlxuICogU3RhcnQgdGhlIHNjZW5lIHdvcmtlciBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0UGF0aCBQYXRoIHRvIHRoZSBwcm9qZWN0IGRpcmVjdG9yeVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnR1cFdvcmtlcihwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBzY2VuZVdvcmtlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3NjZW5lL21haW4tcHJvY2Vzcy9zY2VuZS13b3JrZXInKTtcbiAgICBhd2FpdCBzY2VuZVdvcmtlci5zdGFydChHbG9iYWxQYXRocy5lbmdpbmVQYXRoLCBwcm9qZWN0UGF0aCk7XG59XG5cbi8qKiBJbnN0YWxscyBhIFNjZW5lIGNvbW1hbmQgcHJvdmlkZXIgYW5kIHJldHVybnMgYW4gb3duZXJzaGlwLWJvdW5kIHJlZ2lzdHJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb21tYW5kUHJvdmlkZXIoXG4gICAgcHJvdmlkZXI6IElTY2VuZUNvbW1hbmRQcm92aWRlcixcbik6IFNjZW5lQ29tbWFuZFByb3ZpZGVyUmVnaXN0cmF0aW9uIHtcbiAgICByZXR1cm4gUnBjLnNldENvbW1hbmRQcm92aWRlcihwcm92aWRlcik7XG59XG5cbi8qKiBDbGVhcnMgYW5kIGRpc3Bvc2VzIHRoZSBhY3RpdmUgU2NlbmUgY29tbWFuZCBwcm92aWRlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldENvbW1hbmRQcm92aWRlcigpOiB2b2lkIHtcbiAgICBScGMucmVzZXRDb21tYW5kUHJvdmlkZXIoKTtcbn1cbiJdfQ==