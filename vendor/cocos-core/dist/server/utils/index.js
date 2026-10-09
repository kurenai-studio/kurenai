"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePort = getAvailablePort;
const net_1 = __importDefault(require("net"));
/**
 * 获取当前系统可用端口
 * @param preferredPort 希望使用的起始端口
 */
async function getAvailablePort(preferredPort) {
    return new Promise((resolve, reject) => {
        const server = net_1.default.createServer();
        server.unref(); // 不阻止 Node 进程退出
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // 端口被占用 -> 递归尝试下一个端口
                resolve(getAvailablePort(preferredPort + 1));
            }
            else {
                reject(err);
            }
        });
        server.listen(preferredPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}
