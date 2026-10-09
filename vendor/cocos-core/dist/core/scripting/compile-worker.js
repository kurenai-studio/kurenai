"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
// 监听来自主进程的消息
process.on('message', async (message) => {
    if (message && message.type === 'start') {
        try {
            const { projectPath, enginePath, features, assetChanges } = message.data;
            // 初始化 Scripting，但不需要驻留 watch，因为这只是单次构建进程
            await index_1.default.initialize(projectPath, enginePath, features);
            // 执行脚本编译
            await index_1.default.compileScripts(assetChanges);
            // 编译成功后给主进程发送完成消息
            if (process.send) {
                process.send({ type: 'done' });
            }
            // 确保 PackerDriver 退出并清理资源
            await index_1.default.close();
            process.exit(0);
        }
        catch (error) {
            console.error('Script compile worker failed:', error);
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
