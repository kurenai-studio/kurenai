"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const global_1 = require("../../global");
// 监听来自主进程的消息
process.on('message', async (message) => {
    if (message && message.type === 'start') {
        try {
            const engineCompilerPath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'packages', 'engine-compiler', 'dist', 'index');
            const { compileEngine } = require(engineCompilerPath);
            const enginePath = global_1.GlobalPaths.enginePath;
            //compile for editor
            await compileEngine(enginePath);
            //compile for web
            await compileEngine(enginePath, true);
            // 编译成功后给主进程发送完成消息
            if (process.send) {
                process.send({ type: 'done' });
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Engine compile worker failed:', error);
            if (process.send) {
                process.send({
                    type: 'error',
                    message: error.message,
                    stack: error.stack
                });
            }
            process.exit(1);
        }
    }
});
