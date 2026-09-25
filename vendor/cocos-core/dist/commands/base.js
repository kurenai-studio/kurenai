"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandUtils = exports.BaseCommand = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const chalk_1 = __importDefault(require("chalk"));
/**
 * 命令基类
 */
class BaseCommand {
    program;
    constructor(program) {
        this.program = program;
    }
    /**
     * 验证项目路径
     */
    validateProjectPath(projectPath) {
        const resolvedPath = (0, path_1.resolve)(projectPath);
        if (!(0, fs_1.existsSync)(resolvedPath)) {
            console.error(chalk_1.default.red(`Error: Project path does not exist: ${resolvedPath}`));
            process.exit(1);
        }
        // 检查是否是有效的 Cocos 项目
        const packageJsonPath = (0, path_1.join)(resolvedPath, 'package.json');
        if (!(0, fs_1.existsSync)(packageJsonPath)) {
            console.error(chalk_1.default.red(`Error: Not a valid Cocos project: ${resolvedPath}`));
            console.error(chalk_1.default.yellow('Expected to find package.json in the project directory.'));
            process.exit(1);
        }
        return resolvedPath;
    }
    readLocalConfigProject() {
        const configPath = (0, path_1.resolve)('config.local.json');
        if (!(0, fs_1.existsSync)(configPath))
            return undefined;
        try {
            const config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf-8'));
            return config.project;
        }
        catch {
            console.warn(chalk_1.default.yellow('Warning: Failed to parse config.local.json'));
            return undefined;
        }
    }
    /**
     * 获取全局选项
     */
    getGlobalOptions() {
        // TODO 需要修改为全局的配置系统
        return this.program.opts();
    }
}
exports.BaseCommand = BaseCommand;
/**
 * 命令工具函数
 */
class CommandUtils {
    /**
     * 显示构建信息
     */
    static showBuildInfo(projectPath, platform) {
        console.log(chalk_1.default.blue('Building project...'));
        console.log(chalk_1.default.gray(`Project: ${projectPath}`));
        console.log(chalk_1.default.gray(`Platform: ${platform}`));
    }
    /**
     * 显示 MCP 服务器信息
     */
    static showMcpServerInfo(projectPath, port) {
        console.log(chalk_1.default.blue('MCP Server Configuration'));
        console.log(chalk_1.default.blue('========================'));
        console.log(chalk_1.default.gray(`Project: ${projectPath}`));
        console.log(chalk_1.default.gray(`Port: ${port}`));
        console.log('');
    }
}
exports.CommandUtils = CommandUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLCtCQUFxQztBQUNyQywyQkFBOEM7QUFDOUMsa0RBQTBCO0FBRTFCOztHQUVHO0FBQ0gsTUFBc0IsV0FBVztJQUNuQixPQUFPLENBQVU7SUFFM0IsWUFBWSxPQUFnQjtRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUMzQixDQUFDO0lBT0Q7O09BRUc7SUFDTyxtQkFBbUIsQ0FBQyxXQUFtQjtRQUM3QyxNQUFNLFlBQVksR0FBRyxJQUFBLGNBQU8sRUFBQyxXQUFXLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsSUFBQSxlQUFVLEVBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsdUNBQXVDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsTUFBTSxlQUFlLEdBQUcsSUFBQSxXQUFJLEVBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxJQUFBLGVBQVUsRUFBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLE1BQU0sQ0FBQyx5REFBeUQsQ0FBQyxDQUFDLENBQUM7WUFDdkYsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsT0FBTyxZQUFZLENBQUM7SUFDeEIsQ0FBQztJQUVTLHNCQUFzQjtRQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFBLGNBQU8sRUFBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFBLGVBQVUsRUFBQyxVQUFVLENBQUM7WUFBRSxPQUFPLFNBQVMsQ0FBQztRQUM5QyxJQUFJLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUEsaUJBQVksRUFBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUM3RCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDMUIsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBSyxDQUFDLE1BQU0sQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUM7WUFDekUsT0FBTyxTQUFTLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNPLGdCQUFnQjtRQUN0QixvQkFBb0I7UUFDcEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQy9CLENBQUM7Q0FDSjtBQXBERCxrQ0FvREM7QUFFRDs7R0FFRztBQUNILE1BQWEsWUFBWTtJQUNyQjs7T0FFRztJQUNILE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBbUIsRUFBRSxRQUFnQjtRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFdBQW1CLEVBQUUsSUFBWTtRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQXBCRCxvQ0FvQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCB7IGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5cbi8qKlxuICog5ZG95Luk5Z+657G7XG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlQ29tbWFuZCB7XG4gICAgcHJvdGVjdGVkIHByb2dyYW06IENvbW1hbmQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9ncmFtOiBDb21tYW5kKSB7XG4gICAgICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5rOo5YaM5ZG95LukXG4gICAgICovXG4gICAgYWJzdHJhY3QgcmVnaXN0ZXIoKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIOmqjOivgemhueebrui3r+W+hFxuICAgICAqL1xuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVByb2plY3RQYXRoKHByb2plY3RQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlKHByb2plY3RQYXRoKTtcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKGBFcnJvcjogUHJvamVjdCBwYXRoIGRvZXMgbm90IGV4aXN0OiAke3Jlc29sdmVkUGF0aH1gKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmmK/mnInmlYjnmoQgQ29jb3Mg6aG555uuXG4gICAgICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IGpvaW4ocmVzb2x2ZWRQYXRoLCAncGFja2FnZS5qc29uJyk7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhwYWNrYWdlSnNvblBhdGgpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZChgRXJyb3I6IE5vdCBhIHZhbGlkIENvY29zIHByb2plY3Q6ICR7cmVzb2x2ZWRQYXRofWApKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsueWVsbG93KCdFeHBlY3RlZCB0byBmaW5kIHBhY2thZ2UuanNvbiBpbiB0aGUgcHJvamVjdCBkaXJlY3RvcnkuJykpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVhZExvY2FsQ29uZmlnUHJvamVjdCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gcmVzb2x2ZSgnY29uZmlnLmxvY2FsLmpzb24nKTtcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKGNvbmZpZ1BhdGgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm9qZWN0O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihjaGFsay55ZWxsb3coJ1dhcm5pbmc6IEZhaWxlZCB0byBwYXJzZSBjb25maWcubG9jYWwuanNvbicpKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5blhajlsYDpgInpoblcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0R2xvYmFsT3B0aW9ucygpOiBhbnkge1xuICAgICAgICAvLyBUT0RPIOmcgOimgeS/ruaUueS4uuWFqOWxgOeahOmFjee9ruezu+e7n1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9ncmFtLm9wdHMoKTtcbiAgICB9XG59XG5cbi8qKlxuICog5ZG95Luk5bel5YW35Ye95pWwXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21tYW5kVXRpbHMge1xuICAgIC8qKlxuICAgICAqIOaYvuekuuaehOW7uuS/oeaBr1xuICAgICAqL1xuICAgIHN0YXRpYyBzaG93QnVpbGRJbmZvKHByb2plY3RQYXRoOiBzdHJpbmcsIHBsYXRmb3JtOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZSgnQnVpbGRpbmcgcHJvamVjdC4uLicpKTtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JheShgUHJvamVjdDogJHtwcm9qZWN0UGF0aH1gKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYFBsYXRmb3JtOiAke3BsYXRmb3JtfWApKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmmL7npLogTUNQIOacjeWKoeWZqOS/oeaBr1xuICAgICAqL1xuICAgIHN0YXRpYyBzaG93TWNwU2VydmVySW5mbyhwcm9qZWN0UGF0aDogc3RyaW5nLCBwb3J0OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZSgnTUNQIFNlcnZlciBDb25maWd1cmF0aW9uJykpO1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ibHVlKCc9PT09PT09PT09PT09PT09PT09PT09PT0nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYFByb2plY3Q6ICR7cHJvamVjdFBhdGh9YCkpO1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBQb3J0OiAke3BvcnR9YCkpO1xuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxufVxuIl19