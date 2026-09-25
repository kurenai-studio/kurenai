"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
// 监听来自主进程的消息
process.on('message', async (message) => {
    if (message && message.type === 'start') {
        try {
            const { projectPath, enginePath, features, assetChanges } = message.data;
            // 初始化 Scripting，但不需要驻留 watch，因为这只是单次构建进程
            await index_1.default.initialize(projectPath, enginePath, features);
            // 执行脚本编译
            await index_1.default.compileScripts(assetChanges);
            // 编译成功后给主进程发送完成消息
            if (process.send) {
                process.send({ type: 'done' });
            }
            // 确保 PackerDriver 退出并清理资源
            await index_1.default.close();
            process.exit(0);
        }
        catch (error) {
            console.error('Script compile worker failed:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS13b3JrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvY29tcGlsZS13b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxvREFBZ0M7QUFFaEMsYUFBYTtBQUNiLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUN6QyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQztZQUNELE1BQU0sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBRXpFLHlDQUF5QztZQUN6QyxNQUFNLGVBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUU5RCxTQUFTO1lBQ1QsTUFBTSxlQUFTLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTdDLGtCQUFrQjtZQUNsQixJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUNELDBCQUEwQjtZQUMxQixNQUFNLGVBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEQsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQztvQkFDVCxJQUFJLEVBQUUsT0FBTztvQkFDYixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87b0JBQ3RCLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztpQkFDckIsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzY3JpcHRpbmcgZnJvbSAnLi9pbmRleCc7XG5cbi8vIOebkeWQrOadpeiHquS4u+i/m+eoi+eahOa2iOaBr1xucHJvY2Vzcy5vbignbWVzc2FnZScsIGFzeW5jIChtZXNzYWdlOiBhbnkpID0+IHtcbiAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnR5cGUgPT09ICdzdGFydCcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvamVjdFBhdGgsIGVuZ2luZVBhdGgsIGZlYXR1cmVzLCBhc3NldENoYW5nZXMgfSA9IG1lc3NhZ2UuZGF0YTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Yid5aeL5YyWIFNjcmlwdGluZ++8jOS9huS4jemcgOimgempu+eVmSB3YXRjaO+8jOWboOS4uui/meWPquaYr+WNleasoeaehOW7uui/m+eoi1xuICAgICAgICAgICAgYXdhaXQgc2NyaXB0aW5nLmluaXRpYWxpemUocHJvamVjdFBhdGgsIGVuZ2luZVBhdGgsIGZlYXR1cmVzKTtcblxuICAgICAgICAgICAgLy8g5omn6KGM6ISa5pys57yW6K+RXG4gICAgICAgICAgICBhd2FpdCBzY3JpcHRpbmcuY29tcGlsZVNjcmlwdHMoYXNzZXRDaGFuZ2VzKTtcblxuICAgICAgICAgICAgLy8g57yW6K+R5oiQ5Yqf5ZCO57uZ5Li76L+b56iL5Y+R6YCB5a6M5oiQ5raI5oGvXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5zZW5kKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zZW5kKHsgdHlwZTogJ2RvbmUnIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g56Gu5L+dIFBhY2tlckRyaXZlciDpgIDlh7rlubbmuIXnkIbotYTmupBcbiAgICAgICAgICAgIGF3YWl0IHNjcmlwdGluZy5jbG9zZSgpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdTY3JpcHQgY29tcGlsZSB3b3JrZXIgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnNlbmQpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLnNlbmQoeyBcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJywgXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsIFxuICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2sgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdfQ==