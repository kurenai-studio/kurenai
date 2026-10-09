"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCompileScriptProcess = startCompileScriptProcess;
const path_1 = require("path");
const child_process_1 = require("child_process");
/**
 * 在独立的子进程中运行项目脚本编译
 * 避免 QuickPacker 的 Rollup 等繁重任务阻塞主进程事件循环
 */
function startCompileScriptProcess(data, completeCallback) {
    return new Promise((resolve, reject) => {
        // 根据运行环境决定是使用 ts-node 还是直接执行 js
        const isTsNode = process[Symbol.for('ts-node.register.instance')] || process.env.TS_NODE_DEV;
        let workerPath = (0, path_1.join)(__dirname, 'compile-worker.ts');
        const execArgv = [...process.execArgv];
        // 如果是编译后的环境
        if (!__filename.endsWith('.ts')) {
            workerPath = (0, path_1.join)(__dirname, 'compile-worker.js');
        }
        else if (!isTsNode && __filename.endsWith('.ts')) {
            // ts 环境但没有直接注册 ts-node（比如 CLI 调用）
            execArgv.push('-r', 'ts-node/register');
        }
        console.log(`🚀 启动项目脚本编译子进程...`);
        const worker = (0, child_process_1.fork)(workerPath, [], {
            stdio: 'inherit',
            execArgv,
        });
        worker.on('message', (message) => {
            if (message.type === 'done') {
                resolve();
                completeCallback();
            }
            else if (message.type === 'error') {
                reject(new Error(`[Worker Error] ${message.message}\n${message.stack}`));
            }
        });
        worker.on('error', (err) => {
            reject(err);
        });
        worker.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                reject(new Error(`Script compile worker exited with code ${code}`));
            }
        });
        // 告诉 worker 开始编译并传递必要的初始化参数
        worker.send({ type: 'start', data });
    });
}
