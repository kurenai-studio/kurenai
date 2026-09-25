"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const global_1 = require("../../global");
// 监听来自主进程的消息
process.on('message', async (message) => {
    if (message && message.type === 'start') {
        try {
            const engineCompilerPath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'packages', 'engine-compiler', 'dist', 'index');
            const { compileEngine } = require(engineCompilerPath);
            const enginePath = global_1.GlobalPaths.enginePath;
            //compile for editor
            await compileEngine(enginePath);
            //compile for web
            await compileEngine(enginePath, true);
            // 编译成功后给主进程发送完成消息
            if (process.send) {
                process.send({ type: 'done' });
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Engine compile worker failed:', error);
            if (process.send) {
                process.send({
                    type: 'error',
                    message: error.message,
                    stack: error.stack
                });
            }
            process.exit(1);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS13b3JrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9lbmdpbmUvY29tcGlsZS13b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBNEI7QUFDNUIseUNBQTJDO0FBRTNDLGFBQWE7QUFDYixPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUU7SUFDekMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUM7WUFDRCxNQUFNLGtCQUFrQixHQUFHLElBQUEsV0FBSSxFQUFDLG9CQUFXLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkcsTUFBTSxFQUFFLGFBQWEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRXRELE1BQU0sVUFBVSxHQUFHLG9CQUFXLENBQUMsVUFBVSxDQUFDO1lBQzFDLG9CQUFvQjtZQUNwQixNQUFNLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoQyxpQkFBaUI7WUFDakIsTUFBTSxhQUFhLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXRDLGtCQUFrQjtZQUNsQixJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQztRQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7WUFDbEIsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsSUFBSSxDQUFDO29CQUNULElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztvQkFDdEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO2lCQUNyQixDQUFDLENBQUM7WUFDUCxDQUFDO1lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgR2xvYmFsUGF0aHMgfSBmcm9tICcuLi8uLi9nbG9iYWwnO1xuXG4vLyDnm5HlkKzmnaXoh6rkuLvov5vnqIvnmoTmtojmga9cbnByb2Nlc3Mub24oJ21lc3NhZ2UnLCBhc3luYyAobWVzc2FnZTogYW55KSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSAnc3RhcnQnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlbmdpbmVDb21waWxlclBhdGggPSBqb2luKEdsb2JhbFBhdGhzLndvcmtzcGFjZSwgJ3BhY2thZ2VzJywgJ2VuZ2luZS1jb21waWxlcicsICdkaXN0JywgJ2luZGV4Jyk7XG4gICAgICAgICAgICBjb25zdCB7IGNvbXBpbGVFbmdpbmUgfSA9IHJlcXVpcmUoZW5naW5lQ29tcGlsZXJQYXRoKTtcblxuICAgICAgICAgICAgY29uc3QgZW5naW5lUGF0aCA9IEdsb2JhbFBhdGhzLmVuZ2luZVBhdGg7XG4gICAgICAgICAgICAvL2NvbXBpbGUgZm9yIGVkaXRvclxuICAgICAgICAgICAgYXdhaXQgY29tcGlsZUVuZ2luZShlbmdpbmVQYXRoKTtcbiAgICAgICAgICAgIC8vY29tcGlsZSBmb3Igd2ViXG4gICAgICAgICAgICBhd2FpdCBjb21waWxlRW5naW5lKGVuZ2luZVBhdGgsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyDnvJbor5HmiJDlip/lkI7nu5nkuLvov5vnqIvlj5HpgIHlrozmiJDmtojmga9cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnNlbmQpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLnNlbmQoeyB0eXBlOiAnZG9uZScgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0VuZ2luZSBjb21waWxlIHdvcmtlciBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgaWYgKHByb2Nlc3Muc2VuZCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3Muc2VuZCh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4iXX0=