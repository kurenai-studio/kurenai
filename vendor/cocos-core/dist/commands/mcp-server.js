"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServerCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
const start_server_1 = require("../mcp/start-server");
/**
 * MCP Server 命令类
 */
class McpServerCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('start-mcp-server')
            .description('Start MCP (Model Context Protocol) server for Cocos project')
            .requiredOption('-j, --project <path>', 'Path to the Cocos project (required)')
            .option('-p, --port <number>', 'Port number for the MCP server', '9527')
            .action(async (options) => {
            try {
                const resolvedPath = this.validateProjectPath(options.project);
                const port = parseInt(options.port, 10);
                // 验证端口号
                if (isNaN(port) || port < 1 || port > 65535) {
                    console.error(chalk_1.default.red('Error: Invalid port number. Port must be between 1 and 65535.'));
                    process.exit(1);
                }
                base_1.CommandUtils.showMcpServerInfo(resolvedPath, port);
                // 启动 MCP 服务器
                await (0, start_server_1.startServer)(resolvedPath, port);
                // 保持进程运行
                process.stdin.resume();
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to start MCP server'));
                console.error(error);
                process.exit(1);
            }
        });
    }
}
exports.McpServerCommand = McpServerCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixpQ0FBbUQ7QUFDbkQsc0RBQWtEO0FBRWxEOztHQUVHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxrQkFBVztJQUM3QyxRQUFRO1FBQ0osSUFBSSxDQUFDLE9BQU87YUFDUCxPQUFPLENBQUMsa0JBQWtCLENBQUM7YUFDM0IsV0FBVyxDQUFDLDZEQUE2RCxDQUFDO2FBQzFFLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRSxzQ0FBc0MsQ0FBQzthQUM5RSxNQUFNLENBQUMscUJBQXFCLEVBQUUsZ0NBQWdDLEVBQUUsTUFBTSxDQUFDO2FBQ3ZFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDO2dCQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUV4QyxRQUFRO2dCQUNSLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEtBQUssRUFBRSxDQUFDO29CQUMxQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsK0RBQStELENBQUMsQ0FBQyxDQUFDO29CQUMxRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixDQUFDO2dCQUVELG1CQUFZLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNuRCxhQUFhO2dCQUNiLE1BQU0sSUFBQSwwQkFBVyxFQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdEMsU0FBUztnQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztDQUNKO0FBL0JELDRDQStCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBCYXNlQ29tbWFuZCwgQ29tbWFuZFV0aWxzIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7IHN0YXJ0U2VydmVyIH0gZnJvbSAnLi4vbWNwL3N0YXJ0LXNlcnZlcic7XG5cbi8qKlxuICogTUNQIFNlcnZlciDlkb3ku6TnsbtcbiAqL1xuZXhwb3J0IGNsYXNzIE1jcFNlcnZlckNvbW1hbmQgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG4gICAgcmVnaXN0ZXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJvZ3JhbVxuICAgICAgICAgICAgLmNvbW1hbmQoJ3N0YXJ0LW1jcC1zZXJ2ZXInKVxuICAgICAgICAgICAgLmRlc2NyaXB0aW9uKCdTdGFydCBNQ1AgKE1vZGVsIENvbnRleHQgUHJvdG9jb2wpIHNlcnZlciBmb3IgQ29jb3MgcHJvamVjdCcpXG4gICAgICAgICAgICAucmVxdWlyZWRPcHRpb24oJy1qLCAtLXByb2plY3QgPHBhdGg+JywgJ1BhdGggdG8gdGhlIENvY29zIHByb2plY3QgKHJlcXVpcmVkKScpXG4gICAgICAgICAgICAub3B0aW9uKCctcCwgLS1wb3J0IDxudW1iZXI+JywgJ1BvcnQgbnVtYmVyIGZvciB0aGUgTUNQIHNlcnZlcicsICc5NTI3JylcbiAgICAgICAgICAgIC5hY3Rpb24oYXN5bmMgKG9wdGlvbnM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMudmFsaWRhdGVQcm9qZWN0UGF0aChvcHRpb25zLnByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3J0ID0gcGFyc2VJbnQob3B0aW9ucy5wb3J0LCAxMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g6aqM6K+B56uv5Y+j5Y+3XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05hTihwb3J0KSB8fCBwb3J0IDwgMSB8fCBwb3J0ID4gNjU1MzUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCdFcnJvcjogSW52YWxpZCBwb3J0IG51bWJlci4gUG9ydCBtdXN0IGJlIGJldHdlZW4gMSBhbmQgNjU1MzUuJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgQ29tbWFuZFV0aWxzLnNob3dNY3BTZXJ2ZXJJbmZvKHJlc29sdmVkUGF0aCwgcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWQr+WKqCBNQ1Ag5pyN5Yqh5ZmoXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHN0YXJ0U2VydmVyKHJlc29sdmVkUGF0aCwgcG9ydCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d5oyB6L+b56iL6L+Q6KGMXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5yZWQoJ0ZhaWxlZCB0byBzdGFydCBNQ1Agc2VydmVyJykpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==