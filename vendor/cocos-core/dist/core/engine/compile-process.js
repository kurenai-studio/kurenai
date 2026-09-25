"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCompileEngineProcess = startCompileEngineProcess;
const path_1 = require("path");
const child_process_1 = require("child_process");
/**
 * 在独立的子进程中运行引擎编译
 * 这样可以避免繁重的 babel 转译阻塞主进程事件循环
 */
function startCompileEngineProcess(force = false) {
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
            // ts 环境但没有直接注册 ts-node（比如被某些 runner 调用）
            execArgv.push('-r', 'ts-node/register');
        }
        console.log(`🚀 启动引擎编译子进程...`);
        const worker = (0, child_process_1.fork)(workerPath, [], {
            stdio: 'inherit',
            execArgv,
        });
        worker.on('message', (message) => {
            if (message.type === 'done') {
                resolve();
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
                reject(new Error(`Engine compile worker exited with code ${code}`));
            }
        });
        // 告诉 worker 开始编译
        worker.send({ type: 'start', force });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS1wcm9jZXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvZW5naW5lL2NvbXBpbGUtcHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU9BLDhEQTJDQztBQWxERCwrQkFBNEI7QUFDNUIsaURBQXFDO0FBRXJDOzs7R0FHRztBQUNILFNBQWdCLHlCQUF5QixDQUFDLFFBQWlCLEtBQUs7SUFDNUQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxnQ0FBZ0M7UUFDaEMsTUFBTSxRQUFRLEdBQUksT0FBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO1FBRXRHLElBQUksVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdkMsWUFBWTtRQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUIsVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RELENBQUM7YUFBTSxJQUFJLENBQUMsUUFBUSxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNqRCx3Q0FBd0M7WUFDeEMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sTUFBTSxHQUFHLElBQUEsb0JBQUksRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFO1lBQ2hDLEtBQUssRUFBRSxTQUFTO1lBQ2hCLFFBQVE7U0FDWCxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQVksRUFBRSxFQUFFO1lBQ2xDLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDO2lCQUFNLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGtCQUFrQixPQUFPLENBQUMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0UsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUN2QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3ZCLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILGlCQUFpQjtRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZvcmsgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxuLyoqXG4gKiDlnKjni6znq4vnmoTlrZDov5vnqIvkuK3ov5DooYzlvJXmk47nvJbor5FcbiAqIOi/meagt+WPr+S7pemBv+WFjee5gemHjeeahCBiYWJlbCDovazor5HpmLvloZ7kuLvov5vnqIvkuovku7blvqrnjq9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0Q29tcGlsZUVuZ2luZVByb2Nlc3MoZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vIOagueaNrui/kOihjOeOr+Wig+WGs+WumuaYr+S9v+eUqCB0cy1ub2RlIOi/mOaYr+ebtOaOpeaJp+ihjCBqc1xuICAgICAgICBjb25zdCBpc1RzTm9kZSA9IChwcm9jZXNzIGFzIGFueSlbU3ltYm9sLmZvcigndHMtbm9kZS5yZWdpc3Rlci5pbnN0YW5jZScpXSB8fCBwcm9jZXNzLmVudi5UU19OT0RFX0RFVjtcbiAgICAgICAgXG4gICAgICAgIGxldCB3b3JrZXJQYXRoID0gam9pbihfX2Rpcm5hbWUsICdjb21waWxlLXdvcmtlci50cycpO1xuICAgICAgICBjb25zdCBleGVjQXJndiA9IFsuLi5wcm9jZXNzLmV4ZWNBcmd2XTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOaYr+e8luivkeWQjueahOeOr+Wig1xuICAgICAgICBpZiAoIV9fZmlsZW5hbWUuZW5kc1dpdGgoJy50cycpKSB7XG4gICAgICAgICAgICB3b3JrZXJQYXRoID0gam9pbihfX2Rpcm5hbWUsICdjb21waWxlLXdvcmtlci5qcycpO1xuICAgICAgICB9IGVsc2UgaWYgKCFpc1RzTm9kZSAmJiBfX2ZpbGVuYW1lLmVuZHNXaXRoKCcudHMnKSkge1xuICAgICAgICAgICAgLy8gdHMg546v5aKD5L2G5rKh5pyJ55u05o6l5rOo5YaMIHRzLW5vZGXvvIjmr5TlpoLooqvmn5DkupsgcnVubmVyIOiwg+eUqO+8iVxuICAgICAgICAgICAgZXhlY0FyZ3YucHVzaCgnLXInLCAndHMtbm9kZS9yZWdpc3RlcicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYPCfmoAg5ZCv5Yqo5byV5pOO57yW6K+R5a2Q6L+b56iLLi4uYCk7XG4gICAgICAgIGNvbnN0IHdvcmtlciA9IGZvcmsod29ya2VyUGF0aCwgW10sIHtcbiAgICAgICAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgICAgICAgICBleGVjQXJndixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ya2VyLm9uKCdtZXNzYWdlJywgKG1lc3NhZ2U6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2RvbmUnKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBbV29ya2VyIEVycm9yXSAke21lc3NhZ2UubWVzc2FnZX1cXG4ke21lc3NhZ2Uuc3RhY2t9YCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JrZXIub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmtlci5vbignZXhpdCcsIChjb2RlKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29kZSAhPT0gMCAmJiBjb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgRW5naW5lIGNvbXBpbGUgd29ya2VyIGV4aXRlZCB3aXRoIGNvZGUgJHtjb2RlfWApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5ZGK6K+JIHdvcmtlciDlvIDlp4vnvJbor5FcbiAgICAgICAgd29ya2VyLnNlbmQoeyB0eXBlOiAnc3RhcnQnLCBmb3JjZSB9KTtcbiAgICB9KTtcbn1cbiJdfQ==