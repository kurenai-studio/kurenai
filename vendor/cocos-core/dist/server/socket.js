"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.SocketService = void 0;
const middleware_1 = require("./middleware");
const socket_io_1 = require("socket.io");
class SocketService {
    io;
    /**
     * 启动 io 服务器
     * @param server http 服务器
     */
    startup(server) {
        // 允许跨域连接：PinK 的场景宿主是 vscode-webview://... 与本服务不同源，
        // socket.io 有独立于 express 的 CORS 配置，不开这里 webview 会被浏览器拦截连接。
        // 与 HTTP 路由的 CORS（server.ts 的 app.use(cors)，Access-Control-Allow-Origin: *）保持一致。
        this.io = new socket_io_1.Server(server, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
        });
        this.io.on('connection', (socket) => {
            console.log(`socket ${socket.id} connected`);
            middleware_1.middlewareService.middlewareSocket.forEach((middleware) => {
                middleware.connection(socket);
            });
            socket.on('disconnect', () => {
                middleware_1.middlewareService.middlewareSocket.forEach((middleware) => {
                    middleware.disconnect(socket);
                });
            });
        });
    }
    /**
     * 断开与客户端的连接
     */
    disconnect() {
        this.io?.disconnectSockets();
    }
}
exports.SocketService = SocketService;
exports.socketService = new SocketService();
