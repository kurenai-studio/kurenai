"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerSceneCommandProvider = void 0;
const process_rpc_1 = require("../process-rpc");
const scene_host_local_executor_1 = require("./scene-host-local-executor");
/** Default provider used by standalone cocos-cli to connect to the Scene Worker. */
class WorkerSceneCommandProvider {
    rpc = new process_rpc_1.ProcessRPC();
    constructor(process) {
        this.rpc.attach(process);
        (0, scene_host_local_executor_1.registerDefaultSceneHostModules)(this.rpc);
    }
    request(module, method, args = [], options) {
        return this.rpc.request(module, method, args, options);
    }
    notify(module, method, args = []) {
        this.rpc.notify(module, method, args);
    }
    isConnect() {
        return this.rpc.isConnect();
    }
    dispose() {
        this.rpc.dispose();
    }
}
exports.WorkerSceneCommandProvider = WorkerSceneCommandProvider;
