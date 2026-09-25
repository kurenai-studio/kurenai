"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const api_1 = require("../api");
const server_1 = require("../server");
const mcp_middleware_1 = require("./mcp.middleware");
const server_2 = require("../server/server");
const chalk_1 = __importDefault(require("chalk"));
async function startServer(folder, port) {
    const cocosAPI = await api_1.CocosAPI.create();
    await cocosAPI.startup(folder, port);
    const middleware = new mcp_middleware_1.McpMiddleware();
    (0, server_1.register)('mcp', middleware.getMiddlewareContribution());
    const mcpUrl = `${server_2.serverService.url}/mcp`;
    console.log(chalk_1.default.green('✓ MCP Server started successfully!'));
    console.log(`${chalk_1.default.blueBright(`Server is running on: `)}${chalk_1.default.underline.cyan(`${mcpUrl}`)}`);
    console.log(chalk_1.default.yellow('Press Ctrl+C to stop the server'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQtc2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21jcC9zdGFydC1zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFNQSxrQ0FTQztBQWZELGdDQUFrQztBQUNsQyxzQ0FBcUM7QUFDckMscURBQWlEO0FBQ2pELDZDQUFpRDtBQUNqRCxrREFBMEI7QUFFbkIsS0FBSyxVQUFVLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBYTtJQUMzRCxNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN6QyxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sVUFBVSxHQUFHLElBQUksOEJBQWEsRUFBRSxDQUFDO0lBQ3ZDLElBQUEsaUJBQVEsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQztJQUN4RCxNQUFNLE1BQU0sR0FBRyxHQUFHLHNCQUFhLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztJQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBSyxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLGVBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDakcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsTUFBTSxDQUFDLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29jb3NBUEkgfSBmcm9tICcuLi9hcGknO1xuaW1wb3J0IHsgcmVnaXN0ZXIgfSBmcm9tICcuLi9zZXJ2ZXInO1xuaW1wb3J0IHsgTWNwTWlkZGxld2FyZSB9IGZyb20gJy4vbWNwLm1pZGRsZXdhcmUnO1xuaW1wb3J0IHsgc2VydmVyU2VydmljZSB9IGZyb20gJy4uL3NlcnZlci9zZXJ2ZXInO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2VydmVyKGZvbGRlcjogc3RyaW5nLCBwb3J0PzogbnVtYmVyKSB7XG4gICAgY29uc3QgY29jb3NBUEkgPSBhd2FpdCBDb2Nvc0FQSS5jcmVhdGUoKTtcbiAgICBhd2FpdCBjb2Nvc0FQSS5zdGFydHVwKGZvbGRlciwgcG9ydCk7XG4gICAgY29uc3QgbWlkZGxld2FyZSA9IG5ldyBNY3BNaWRkbGV3YXJlKCk7XG4gICAgcmVnaXN0ZXIoJ21jcCcsIG1pZGRsZXdhcmUuZ2V0TWlkZGxld2FyZUNvbnRyaWJ1dGlvbigpKTtcbiAgICBjb25zdCBtY3BVcmwgPSBgJHtzZXJ2ZXJTZXJ2aWNlLnVybH0vbWNwYDtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5ncmVlbign4pyTIE1DUCBTZXJ2ZXIgc3RhcnRlZCBzdWNjZXNzZnVsbHkhJykpO1xuICAgIGNvbnNvbGUubG9nKGAke2NoYWxrLmJsdWVCcmlnaHQoYFNlcnZlciBpcyBydW5uaW5nIG9uOiBgKX0ke2NoYWxrLnVuZGVybGluZS5jeWFuKGAke21jcFVybH1gKX1gKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay55ZWxsb3coJ1ByZXNzIEN0cmwrQyB0byBzdG9wIHRoZSBzZXJ2ZXInKSk7XG59XG4iXX0=