"use strict";
/**
 * 命令模块导出
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = exports.PublishCommand = exports.UploadCommand = exports.RunCommand = exports.MakeCommand = exports.CreateCommand = exports.McpServerCommand = exports.BuildCommand = exports.CommandUtils = exports.BaseCommand = void 0;
var base_1 = require("./base");
Object.defineProperty(exports, "BaseCommand", { enumerable: true, get: function () { return base_1.BaseCommand; } });
Object.defineProperty(exports, "CommandUtils", { enumerable: true, get: function () { return base_1.CommandUtils; } });
var build_1 = require("./build");
Object.defineProperty(exports, "BuildCommand", { enumerable: true, get: function () { return build_1.BuildCommand; } });
var mcp_server_1 = require("./mcp-server");
Object.defineProperty(exports, "McpServerCommand", { enumerable: true, get: function () { return mcp_server_1.McpServerCommand; } });
var create_1 = require("./create");
Object.defineProperty(exports, "CreateCommand", { enumerable: true, get: function () { return create_1.CreateCommand; } });
var make_1 = require("./make");
Object.defineProperty(exports, "MakeCommand", { enumerable: true, get: function () { return make_1.MakeCommand; } });
var run_1 = require("./run");
Object.defineProperty(exports, "RunCommand", { enumerable: true, get: function () { return run_1.RunCommand; } });
var upload_1 = require("./upload");
Object.defineProperty(exports, "UploadCommand", { enumerable: true, get: function () { return upload_1.UploadCommand; } });
var publish_1 = require("./publish");
Object.defineProperty(exports, "PublishCommand", { enumerable: true, get: function () { return publish_1.PublishCommand; } });
/**
 * 命令注册器
 */
class CommandRegistry {
    commands = [];
    /**
     * 注册命令
     */
    register(command) {
        this.commands.push(command);
    }
    /**
     * 注册所有命令
     */
    registerAll() {
        this.commands.forEach(command => command.register());
    }
    /**
     * 获取所有命令
     */
    getAllCommands() {
        return [...this.commands];
    }
}
exports.CommandRegistry = CommandRegistry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFVSCwrQkFBbUQ7QUFBMUMsbUdBQUEsV0FBVyxPQUFBO0FBQUUsb0dBQUEsWUFBWSxPQUFBO0FBQ2xDLGlDQUF1QztBQUE5QixxR0FBQSxZQUFZLE9BQUE7QUFDckIsMkNBQWdEO0FBQXZDLDhHQUFBLGdCQUFnQixPQUFBO0FBQ3pCLG1DQUF5QztBQUFoQyx1R0FBQSxhQUFhLE9BQUE7QUFDdEIsK0JBQXFDO0FBQTVCLG1HQUFBLFdBQVcsT0FBQTtBQUNwQiw2QkFBbUM7QUFBMUIsaUdBQUEsVUFBVSxPQUFBO0FBQ25CLG1DQUF5QztBQUFoQyx1R0FBQSxhQUFhLE9BQUE7QUFDdEIscUNBQTJDO0FBQWxDLHlHQUFBLGNBQWMsT0FBQTtBQU92Qjs7R0FFRztBQUNILE1BQWEsZUFBZTtJQUNoQixRQUFRLEdBQW1CLEVBQUUsQ0FBQztJQUV0Qzs7T0FFRztJQUNILFFBQVEsQ0FBQyxPQUFxQjtRQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxXQUFXO1FBQ1AsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxjQUFjO1FBQ1YsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlCLENBQUM7Q0FDSjtBQXZCRCwwQ0F1QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOWRveS7pOaooeWdl+WvvOWHulxuICovXG5cbmltcG9ydCB7IEJ1aWxkQ29tbWFuZCB9IGZyb20gJy4vYnVpbGQnO1xuaW1wb3J0IHsgTWNwU2VydmVyQ29tbWFuZCB9IGZyb20gJy4vbWNwLXNlcnZlcic7XG5pbXBvcnQgeyBDcmVhdGVDb21tYW5kIH0gZnJvbSAnLi9jcmVhdGUnO1xuaW1wb3J0IHsgTWFrZUNvbW1hbmQgfSBmcm9tICcuL21ha2UnO1xuaW1wb3J0IHsgUnVuQ29tbWFuZCB9IGZyb20gJy4vcnVuJztcbmltcG9ydCB7IFVwbG9hZENvbW1hbmQgfSBmcm9tICcuL3VwbG9hZCc7XG5pbXBvcnQgeyBQdWJsaXNoQ29tbWFuZCB9IGZyb20gJy4vcHVibGlzaCc7XG5cbmV4cG9ydCB7IEJhc2VDb21tYW5kLCBDb21tYW5kVXRpbHMgfSBmcm9tICcuL2Jhc2UnO1xuZXhwb3J0IHsgQnVpbGRDb21tYW5kIH0gZnJvbSAnLi9idWlsZCc7XG5leHBvcnQgeyBNY3BTZXJ2ZXJDb21tYW5kIH0gZnJvbSAnLi9tY3Atc2VydmVyJztcbmV4cG9ydCB7IENyZWF0ZUNvbW1hbmQgfSBmcm9tICcuL2NyZWF0ZSc7XG5leHBvcnQgeyBNYWtlQ29tbWFuZCB9IGZyb20gJy4vbWFrZSc7XG5leHBvcnQgeyBSdW5Db21tYW5kIH0gZnJvbSAnLi9ydW4nO1xuZXhwb3J0IHsgVXBsb2FkQ29tbWFuZCB9IGZyb20gJy4vdXBsb2FkJztcbmV4cG9ydCB7IFB1Ymxpc2hDb21tYW5kIH0gZnJvbSAnLi9wdWJsaXNoJztcblxuLyoqXG4gKiDmiYDmnInlkb3ku6TnsbvnmoTnsbvlnotcbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWFuZENsYXNzID0gQnVpbGRDb21tYW5kIHwgTWNwU2VydmVyQ29tbWFuZCB8IENyZWF0ZUNvbW1hbmQgfCBNYWtlQ29tbWFuZCB8IFJ1bkNvbW1hbmQgfCBVcGxvYWRDb21tYW5kIHwgUHVibGlzaENvbW1hbmQ7XG5cbi8qKlxuICog5ZG95Luk5rOo5YaM5ZmoXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21tYW5kUmVnaXN0cnkge1xuICAgIHByaXZhdGUgY29tbWFuZHM6IENvbW1hbmRDbGFzc1tdID0gW107XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozlkb3ku6RcbiAgICAgKi9cbiAgICByZWdpc3Rlcihjb21tYW5kOiBDb21tYW5kQ2xhc3MpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOaJgOacieWRveS7pFxuICAgICAqL1xuICAgIHJlZ2lzdGVyQWxsKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbW1hbmRzLmZvckVhY2goY29tbWFuZCA9PiBjb21tYW5kLnJlZ2lzdGVyKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluaJgOacieWRveS7pFxuICAgICAqL1xuICAgIGdldEFsbENvbW1hbmRzKCk6IENvbW1hbmRDbGFzc1tdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmNvbW1hbmRzXTtcbiAgICB9XG59XG4iXX0=