"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
exports.stopServer = stopServer;
exports.getServerUrl = getServerUrl;
exports.register = register;
const server_1 = require("./server");
/**
 * 启动服务器
 */
async function startServer(port, host) {
    try {
        server_1.serverService.init();
        await server_1.serverService.start(port, host);
    }
    catch (error) {
        console.error(error);
    }
}
/**
 * 停止服务器
 */
async function stopServer() {
    try {
        await server_1.serverService.stop();
    }
    catch (error) {
        console.error(error);
    }
}
/**
 * 获取当前服务器的地址
 */
function getServerUrl() {
    return server_1.serverService.url;
}
function register(name, module) {
    server_1.serverService.register(name, module);
}
