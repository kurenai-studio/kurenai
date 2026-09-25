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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZlci9zb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsNkNBQWlEO0FBQ2pELHlDQUFtQztBQUVuQyxNQUFhLGFBQWE7SUFDZixFQUFFLENBQXFCO0lBRTlCOzs7T0FHRztJQUNILE9BQU8sQ0FBQyxNQUFnQztRQUNwQyxtREFBbUQ7UUFDbkQsMkRBQTJEO1FBQzNELGlGQUFpRjtRQUNqRixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksa0JBQU0sQ0FBQyxNQUFNLEVBQUU7WUFDekIsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUU7U0FDbEQsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBVyxFQUFFLEVBQUU7WUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzdDLDhCQUFpQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO2dCQUN0RCxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUN6Qiw4QkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtvQkFDdEQsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEMsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVTtRQUNOLElBQUksQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0NBQ0o7QUFqQ0Qsc0NBaUNDO0FBRVksUUFBQSxhQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU2VydmVyIGFzIEhUVFBTZXJ2ZXIgfSBmcm9tICdodHRwJztcbmltcG9ydCB0eXBlIHsgU2VydmVyIGFzIEhUVFBTU2VydmVyIH0gZnJvbSAnaHR0cHMnO1xuaW1wb3J0IHsgbWlkZGxld2FyZVNlcnZpY2UgfSBmcm9tICcuL21pZGRsZXdhcmUnO1xuaW1wb3J0IHsgU2VydmVyIH0gZnJvbSAnc29ja2V0LmlvJztcblxuZXhwb3J0IGNsYXNzIFNvY2tldFNlcnZpY2Uge1xuICAgIHB1YmxpYyBpbzogU2VydmVyIHwgdW5kZWZpbmVkO1xuXG4gICAgLyoqXG4gICAgICog5ZCv5YqoIGlvIOacjeWKoeWZqFxuICAgICAqIEBwYXJhbSBzZXJ2ZXIgaHR0cCDmnI3liqHlmahcbiAgICAgKi9cbiAgICBzdGFydHVwKHNlcnZlcjogSFRUUFNlcnZlciB8IEhUVFBTU2VydmVyKSB7XG4gICAgICAgIC8vIOWFgeiuuOi3qOWfn+i/nuaOpe+8mlBpbksg55qE5Zy65pmv5a6/5Li75pivIHZzY29kZS13ZWJ2aWV3Oi8vLi4uIOS4juacrOacjeWKoeS4jeWQjOa6kO+8jFxuICAgICAgICAvLyBzb2NrZXQuaW8g5pyJ54us56uL5LqOIGV4cHJlc3Mg55qEIENPUlMg6YWN572u77yM5LiN5byA6L+Z6YeMIHdlYnZpZXcg5Lya6KKr5rWP6KeI5Zmo5oum5oiq6L+e5o6l44CCXG4gICAgICAgIC8vIOS4jiBIVFRQIOi3r+eUseeahCBDT1JT77yIc2VydmVyLnRzIOeahCBhcHAudXNlKGNvcnMp77yMQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luOiAq77yJ5L+d5oyB5LiA6Ie044CCXG4gICAgICAgIHRoaXMuaW8gPSBuZXcgU2VydmVyKHNlcnZlciwge1xuICAgICAgICAgICAgY29yczogeyBvcmlnaW46ICcqJywgbWV0aG9kczogWydHRVQnLCAnUE9TVCddIH0sXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmlvLm9uKCdjb25uZWN0aW9uJywgKHNvY2tldDogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgc29ja2V0ICR7c29ja2V0LmlkfSBjb25uZWN0ZWRgKTtcbiAgICAgICAgICAgIG1pZGRsZXdhcmVTZXJ2aWNlLm1pZGRsZXdhcmVTb2NrZXQuZm9yRWFjaCgobWlkZGxld2FyZSkgPT4ge1xuICAgICAgICAgICAgICAgIG1pZGRsZXdhcmUuY29ubmVjdGlvbihzb2NrZXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbWlkZGxld2FyZVNlcnZpY2UubWlkZGxld2FyZVNvY2tldC5mb3JFYWNoKChtaWRkbGV3YXJlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1pZGRsZXdhcmUuZGlzY29ubmVjdChzb2NrZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaWreW8gOS4juWuouaIt+err+eahOi/nuaOpVxuICAgICAqL1xuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuaW8/LmRpc2Nvbm5lY3RTb2NrZXRzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3Qgc29ja2V0U2VydmljZSA9IG5ldyBTb2NrZXRTZXJ2aWNlKCk7XG4iXX0=