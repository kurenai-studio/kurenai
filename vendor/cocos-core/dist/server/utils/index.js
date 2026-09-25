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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmVyL3V0aWxzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBTUEsNENBb0JDO0FBMUJELDhDQUFzQjtBQUV0Qjs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsYUFBcUI7SUFDeEQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLE1BQU0sR0FBRyxhQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFbEMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZ0JBQWdCO1FBRWhDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBUSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUM1QixxQkFBcUI7Z0JBQ3JCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUM5QixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBcUIsQ0FBQztZQUNyRCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG5ldCBmcm9tICduZXQnO1xuXG4vKipcbiAqIOiOt+WPluW9k+WJjeezu+e7n+WPr+eUqOerr+WPo1xuICogQHBhcmFtIHByZWZlcnJlZFBvcnQg5biM5pyb5L2/55So55qE6LW35aeL56uv5Y+jXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBdmFpbGFibGVQb3J0KHByZWZlcnJlZFBvcnQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgc2VydmVyID0gbmV0LmNyZWF0ZVNlcnZlcigpO1xuXG4gICAgICAgIHNlcnZlci51bnJlZigpOyAvLyDkuI3pmLvmraIgTm9kZSDov5vnqIvpgIDlh7pcblxuICAgICAgICBzZXJ2ZXIub24oJ2Vycm9yJywgKGVycjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyLmNvZGUgPT09ICdFQUREUklOVVNFJykge1xuICAgICAgICAgICAgICAgIC8vIOerr+WPo+iiq+WNoOeUqCAtPiDpgJLlvZLlsJ3or5XkuIvkuIDkuKrnq6/lj6NcbiAgICAgICAgICAgICAgICByZXNvbHZlKGdldEF2YWlsYWJsZVBvcnQocHJlZmVycmVkUG9ydCArIDEpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlcnZlci5saXN0ZW4ocHJlZmVycmVkUG9ydCwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBwb3J0IH0gPSBzZXJ2ZXIuYWRkcmVzcygpIGFzIG5ldC5BZGRyZXNzSW5mbztcbiAgICAgICAgICAgIHNlcnZlci5jbG9zZSgoKSA9PiByZXNvbHZlKHBvcnQpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iXX0=