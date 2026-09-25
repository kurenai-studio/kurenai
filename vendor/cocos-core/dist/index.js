"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const start_server_js_1 = require("./mcp/start-server.js");
const server_js_1 = require("./server/server.js");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PROVIDER_ID = 'cocos-cli-mcp-provider';
async function activate(context, port) {
    // 创建事件发射器，用于通知 MCP 服务器定义变化
    const onDidChangeMcpServerDefinitionsEmitter = new vscode.EventEmitter();
    const provider = {
        onDidChangeMcpServerDefinitions: onDidChangeMcpServerDefinitionsEmitter.event,
        provideMcpServerDefinitions: async (token) => {
            const folder = getCurrentProjectFolder();
            if (!folder) {
                vscode.window.showWarningMessage('没有打开 cocos 项目');
                return [];
            }
            // 检查是否为 Cocos 工程
            const isCocosProject = await checkIsCocosProject(folder);
            if (!isCocosProject) {
                return []; // 不启动 MCP 服务器，也不返回任何定义
            }
            try {
                // 启动 MCP 服务器
                await (0, start_server_js_1.startServer)(folder, port);
                // 返回 MCP 服务器定义
                return [
                    new vscode.McpHttpServerDefinition('Cocos CLI MCP Server', vscode.Uri.parse(`http://localhost:${server_js_1.serverService.port}/mcp`))
                ];
            }
            catch (error) {
                console.error('启动 MCP 服务器失败:', error);
                return [];
            }
        },
        resolveMcpServerDefinition: async (definition, token) => {
            // 可以在这里做额外检查 / 用户交互 / 获取 token 等
            // 如果一切正常，直接返回 definition 即可
            return definition;
        }
    };
    // 注册 MCP 服务器定义提供者
    const disposable = vscode.lm.registerMcpServerDefinitionProvider(PROVIDER_ID, provider);
    context.subscriptions.push(disposable);
    // 监听工作区变化，当工作区变化时通知 MCP 服务器定义可能发生变化
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        onDidChangeMcpServerDefinitionsEmitter.fire();
    }));
}
function deactivate() { }
/**
 * 检查当前文件夹是否为 Cocos 工程
 * @param folderPath 文件夹路径
 * @returns 是否为 Cocos 工程
 */
async function checkIsCocosProject(folderPath) {
    try {
        const packageJsonPath = path.join(folderPath, 'package.json');
        // 检查 package.json 是否存在
        if (!fs.existsSync(packageJsonPath)) {
            vscode.window.showErrorMessage('当前不是 Cocos 工程');
            return false;
        }
        // 读取并解析 package.json
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        // 检查是否有 creator 字段
        if (!packageJson.creator) {
            vscode.window.showErrorMessage('当前不是 Cocos 工程');
            return false;
        }
        return true;
    }
    catch (error) {
        vscode.window.showErrorMessage('当前不是 Cocos 工程');
        return false;
    }
}
/**
 * 获取当前打开的项目文件夹路径
 * @returns 项目文件夹路径
 */
function getCurrentProjectFolder() {
    // 获取当前工作区的第一个文件夹（项目根目录）
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined; // 没有打开任何工作区
    }
    // 如果有多个工作区文件夹，优先返回当前活动文件所在的工作区
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const currentFileUri = editor.document.uri;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFileUri);
        if (workspaceFolder) {
            return workspaceFolder.uri.fsPath;
        }
    }
    // 否则返回第一个工作区文件夹
    return workspaceFolders[0].uri.fsPath;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFRQSw0QkFzREM7QUFFRCxnQ0FBZ0M7QUFoRWhDLDJEQUFvRDtBQUNwRCxrREFBbUQ7QUFDbkQsK0NBQWlDO0FBQ2pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsTUFBTSxXQUFXLEdBQUcsd0JBQXdCLENBQUM7QUFFdEMsS0FBSyxVQUFVLFFBQVEsQ0FBQyxPQUFnQyxFQUFFLElBQWE7SUFDMUUsMkJBQTJCO0lBQzNCLE1BQU0sc0NBQXNDLEdBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFRLENBQUM7SUFFL0UsTUFBTSxRQUFRLEdBQXVDO1FBQ2pELCtCQUErQixFQUFFLHNDQUFzQyxDQUFDLEtBQUs7UUFFN0UsMkJBQTJCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFHLHVCQUF1QixFQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNWLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQztZQUVELGlCQUFpQjtZQUNqQixNQUFNLGNBQWMsR0FBRyxNQUFNLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxFQUFFLENBQUMsQ0FBQyx1QkFBdUI7WUFDdEMsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDRCxhQUFhO2dCQUNiLE1BQU0sSUFBQSw2QkFBVyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFaEMsZUFBZTtnQkFDZixPQUFPO29CQUNILElBQUksTUFBTSxDQUFDLHVCQUF1QixDQUM5QixzQkFB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QWUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDdEMsQ0FBQztJQUNMLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsT0FBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzdGFydFNlcnZlciB9IGZyb20gJy4vbWNwL3N0YXJ0LXNlcnZlci5qcyc7XG5pbXBvcnQgeyBzZXJ2ZXJTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2ZXIvc2VydmVyLmpzJztcbmltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc3QgUFJPVklERVJfSUQgPSAnY29jb3MtY2xpLW1jcC1wcm92aWRlcic7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhY3RpdmF0ZShjb250ZXh0OiB2c2NvZGUuRXh0ZW5zaW9uQ29udGV4dCwgcG9ydD86IG51bWJlcikge1xuICAgIC8vIOWIm+W7uuS6i+S7tuWPkeWwhOWZqO+8jOeUqOS6jumAmuefpSBNQ1Ag5pyN5Yqh5Zmo5a6a5LmJ5Y+Y5YyWXG4gICAgY29uc3Qgb25EaWRDaGFuZ2VNY3BTZXJ2ZXJEZWZpbml0aW9uc0VtaXR0ZXIgPSBuZXcgdnNjb2RlLkV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gICAgY29uc3QgcHJvdmlkZXI6IHZzY29kZS5NY3BTZXJ2ZXJEZWZpbml0aW9uUHJvdmlkZXIgPSB7XG4gICAgICAgIG9uRGlkQ2hhbmdlTWNwU2VydmVyRGVmaW5pdGlvbnM6IG9uRGlkQ2hhbmdlTWNwU2VydmVyRGVmaW5pdGlvbnNFbWl0dGVyLmV2ZW50LFxuXG4gICAgICAgIHByb3ZpZGVNY3BTZXJ2ZXJEZWZpbml0aW9uczogYXN5bmMgKHRva2VuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmb2xkZXIgPSBnZXRDdXJyZW50UHJvamVjdEZvbGRlcigpO1xuICAgICAgICAgICAgaWYgKCFmb2xkZXIpIHtcbiAgICAgICAgICAgICAgICB2c2NvZGUud2luZG93LnNob3dXYXJuaW5nTWVzc2FnZSgn5rKh5pyJ5omT5byAIGNvY29zIOmhueebricpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5Li6IENvY29zIOW3peeoi1xuICAgICAgICAgICAgY29uc3QgaXNDb2Nvc1Byb2plY3QgPSBhd2FpdCBjaGVja0lzQ29jb3NQcm9qZWN0KGZvbGRlcik7XG4gICAgICAgICAgICBpZiAoIWlzQ29jb3NQcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdOyAvLyDkuI3lkK/liqggTUNQIOacjeWKoeWZqO+8jOS5n+S4jei/lOWbnuS7u+S9leWumuS5iVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOWQr+WKqCBNQ1Ag5pyN5Yqh5ZmoXG4gICAgICAgICAgICAgICAgYXdhaXQgc3RhcnRTZXJ2ZXIoZm9sZGVyLCBwb3J0KTtcblxuICAgICAgICAgICAgICAgIC8vIOi/lOWbniBNQ1Ag5pyN5Yqh5Zmo5a6a5LmJXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IHZzY29kZS5NY3BIdHRwU2VydmVyRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgICdDb2NvcyBDTEkgTUNQIFNlcnZlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB2c2NvZGUuVXJpLnBhcnNlKGBodHRwOi8vbG9jYWxob3N0OiR7c2VydmVyU2VydmljZS5wb3J0fS9tY3BgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5ZCv5YqoIE1DUCDmnI3liqHlmajlpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICByZXNvbHZlTWNwU2VydmVyRGVmaW5pdGlvbjogYXN5bmMgKGRlZmluaXRpb24sIHRva2VuKSA9PiB7XG4gICAgICAgICAgICAvLyDlj6/ku6XlnKjov5nph4zlgZrpop3lpJbmo4Dmn6UgLyDnlKjmiLfkuqTkupIgLyDojrflj5YgdG9rZW4g562JXG4gICAgICAgICAgICAvLyDlpoLmnpzkuIDliIfmraPluLjvvIznm7TmjqXov5Tlm54gZGVmaW5pdGlvbiDljbPlj69cbiAgICAgICAgICAgIHJldHVybiBkZWZpbml0aW9uO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIOazqOWGjCBNQ1Ag5pyN5Yqh5Zmo5a6a5LmJ5o+Q5L6b6ICFXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IHZzY29kZS5sbS5yZWdpc3Rlck1jcFNlcnZlckRlZmluaXRpb25Qcm92aWRlcihQUk9WSURFUl9JRCwgcHJvdmlkZXIpO1xuICAgIGNvbnRleHQuc3Vic2NyaXB0aW9ucy5wdXNoKGRpc3Bvc2FibGUpO1xuXG4gICAgLy8g55uR5ZCs5bel5L2c5Yy65Y+Y5YyW77yM5b2T5bel5L2c5Yy65Y+Y5YyW5pe26YCa55+lIE1DUCDmnI3liqHlmajlrprkuYnlj6/og73lj5HnlJ/lj5jljJZcbiAgICBjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaChcbiAgICAgICAgdnNjb2RlLndvcmtzcGFjZS5vbkRpZENoYW5nZVdvcmtzcGFjZUZvbGRlcnMoKCkgPT4ge1xuICAgICAgICAgICAgb25EaWRDaGFuZ2VNY3BTZXJ2ZXJEZWZpbml0aW9uc0VtaXR0ZXIuZmlyZSgpO1xuICAgICAgICB9KVxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkgeyB9XG5cbi8qKlxuICog5qOA5p+l5b2T5YmN5paH5Lu25aS55piv5ZCm5Li6IENvY29zIOW3peeoi1xuICogQHBhcmFtIGZvbGRlclBhdGgg5paH5Lu25aS56Lev5b6EXG4gKiBAcmV0dXJucyDmmK/lkKbkuLogQ29jb3Mg5bel56iLXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrSXNDb2Nvc1Byb2plY3QoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gcGF0aC5qb2luKGZvbGRlclBhdGgsICdwYWNrYWdlLmpzb24nKTtcblxuICAgICAgICAvLyDmo4Dmn6UgcGFja2FnZS5qc29uIOaYr+WQpuWtmOWcqFxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGFja2FnZUpzb25QYXRoKSkge1xuICAgICAgICAgICAgdnNjb2RlLndpbmRvdy5zaG93RXJyb3JNZXNzYWdlKCflvZPliY3kuI3mmK8gQ29jb3Mg5bel56iLJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDor7vlj5blubbop6PmnpAgcGFja2FnZS5qc29uXG4gICAgICAgIGNvbnN0IHBhY2thZ2VKc29uQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlSnNvblBhdGgsICd1dGY4Jyk7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShwYWNrYWdlSnNvbkNvbnRlbnQpO1xuXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuaciSBjcmVhdG9yIOWtl+autVxuICAgICAgICBpZiAoIXBhY2thZ2VKc29uLmNyZWF0b3IpIHtcbiAgICAgICAgICAgIHZzY29kZS53aW5kb3cuc2hvd0Vycm9yTWVzc2FnZSgn5b2T5YmN5LiN5pivIENvY29zIOW3peeoiycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdnNjb2RlLndpbmRvdy5zaG93RXJyb3JNZXNzYWdlKCflvZPliY3kuI3mmK8gQ29jb3Mg5bel56iLJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICog6I635Y+W5b2T5YmN5omT5byA55qE6aG555uu5paH5Lu25aS56Lev5b6EXG4gKiBAcmV0dXJucyDpobnnm67mlofku7blpLnot6/lvoRcbiAqL1xuZnVuY3Rpb24gZ2V0Q3VycmVudFByb2plY3RGb2xkZXIoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAvLyDojrflj5blvZPliY3lt6XkvZzljLrnmoTnrKzkuIDkuKrmlofku7blpLnvvIjpobnnm67moLnnm67lvZXvvIlcbiAgICBjb25zdCB3b3Jrc3BhY2VGb2xkZXJzID0gdnNjb2RlLndvcmtzcGFjZS53b3Jrc3BhY2VGb2xkZXJzO1xuICAgIGlmICghd29ya3NwYWNlRm9sZGVycyB8fCB3b3Jrc3BhY2VGb2xkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkOyAvLyDmsqHmnInmiZPlvIDku7vkvZXlt6XkvZzljLpcbiAgICB9XG5cbiAgICAvLyDlpoLmnpzmnInlpJrkuKrlt6XkvZzljLrmlofku7blpLnvvIzkvJjlhYjov5Tlm57lvZPliY3mtLvliqjmlofku7bmiYDlnKjnmoTlt6XkvZzljLpcbiAgICBjb25zdCBlZGl0b3IgPSB2c2NvZGUud2luZG93LmFjdGl2ZVRleHRFZGl0b3I7XG4gICAgaWYgKGVkaXRvcikge1xuICAgICAgICBjb25zdCBjdXJyZW50RmlsZVVyaSA9IGVkaXRvci5kb2N1bWVudC51cmk7XG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZUZvbGRlciA9IHZzY29kZS53b3Jrc3BhY2UuZ2V0V29ya3NwYWNlRm9sZGVyKGN1cnJlbnRGaWxlVXJpKTtcbiAgICAgICAgaWYgKHdvcmtzcGFjZUZvbGRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHdvcmtzcGFjZUZvbGRlci51cmkuZnNQYXRoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5ZCm5YiZ6L+U5Zue56ys5LiA5Liq5bel5L2c5Yy65paH5Lu25aS5XG4gICAgcmV0dXJuIHdvcmtzcGFjZUZvbGRlcnNbMF0udXJpLmZzUGF0aDtcbn1cblxuIl19