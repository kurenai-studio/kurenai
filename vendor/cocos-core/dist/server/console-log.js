"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLogService = exports.ConsoleLogService = void 0;
const ws_1 = require("ws");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const middleware_1 = require("./middleware");
const INJECTION_SCRIPT = `
<script>
(function() {
    // 建立 WebSocket 连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(protocol + '//' + window.location.host + '/console-log');
    
    // 保存原始 console 方法
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };
    
    // 发送日志到服务器
    function sendLog(level, args) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify({
                    type: 'log',
                    level: level,
                    message: args.map(arg => {
                        if (typeof arg === 'object') {
                            try {
                                return JSON.stringify(arg, null, 2);
                            } catch (e) {
                                return String(arg);
                            }
                        }
                        return String(arg);
                    }).join(' '),
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                }));
            } catch (err) {
                console.error('[日志系统] 发送失败:', err);
            }
        }
    }
    
    // 重写 console 方法
    Object.keys(originalConsole).forEach(level => {
        console[level] = function(...args) {
            originalConsole[level].apply(console, args);
            sendLog(level, args);
        };
    });
    
    // 监听未捕获的错误
    window.addEventListener('error', (event) => {
        sendLog('error', [
            'Uncaught Error: ' + event.message,
            'File: ' + event.filename,
            'Line: ' + event.lineno + ':' + event.colno
        ]);
    });
    
    // 监听未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
        sendLog('error', [
            'Unhandled Promise Rejection: ' + (event.reason || 'Unknown reason')
        ]);
    });
    
    // WebSocket 事件处理
    ws.onopen = () => {
        // console.log('[日志系统] WebSocket 连接已建立');
    };
    
    ws.onerror = (err) => {
        console.error('[日志系统] WebSocket 错误:', err);
    };
    
    ws.onclose = () => {
        // console.warn('[日志系统] WebSocket 连接已关闭');
    };
})();
</script>
`;
class ConsoleLogService {
    wss;
    startup(server) {
        this.wss = new ws_1.WebSocketServer({ noServer: true });
        server.on('upgrade', (request, socket, head) => {
            const pathname = new URL(request.url || '', 'http://base').pathname;
            if (pathname === '/console-log') {
                this.wss?.handleUpgrade(request, socket, head, (ws) => {
                    this.wss?.emit('connection', ws, request);
                });
            }
        });
        this.wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                try {
                    const msgStr = message.toString();
                    const data = JSON.parse(msgStr);
                    if (data.type === 'log') {
                        const level = data.level || 'info';
                        const text = data.message || '';
                        const logMessage = `[Browser ${level.toUpperCase()}] ${text}`;
                        switch (level) {
                            case 'error':
                                console.error(logMessage);
                                break;
                            case 'warn':
                                console.warn(logMessage);
                                break;
                            case 'info':
                                console.info(logMessage);
                                break;
                            case 'debug':
                                console.debug(logMessage);
                                break;
                            default:
                                console.log(logMessage);
                                break;
                        }
                    }
                }
                catch (err) {
                    // ignore
                }
            });
        });
    }
    injectMiddleware = (req, res, next) => {
        const originalSend = res.send;
        const originalSendFile = res.sendFile;
        // @ts-ignore
        res.send = function (body) {
            if (typeof body === 'string' && (body.includes('</head>') || body.includes('<body'))) {
                let modified = body;
                if (body.includes('</head>')) {
                    modified = body.replace('</head>', INJECTION_SCRIPT + '</head>');
                }
                else if (body.includes('<body')) {
                    modified = body.replace('<body', INJECTION_SCRIPT + '<body');
                }
                else {
                    modified = INJECTION_SCRIPT + body;
                }
                this.set('X-Console-Injected', 'true');
                return originalSend.call(this, modified);
            }
            return originalSend.call(this, body);
        };
        // @ts-ignore
        res.sendFile = function (path, options, callback) {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            if (path.endsWith('.html') || path.endsWith('.htm')) {
                fs_1.default.readFile(path, 'utf8', (err, data) => {
                    if (err) {
                        if (callback)
                            callback(err);
                        else
                            originalSendFile.call(this, path, options);
                        return;
                    }
                    let modified = data;
                    let injected = false;
                    if (data.includes('</head>')) {
                        modified = data.replace('</head>', INJECTION_SCRIPT + '</head>');
                        injected = true;
                    }
                    else if (data.includes('<body')) {
                        modified = data.replace('<body', INJECTION_SCRIPT + '<body');
                        injected = true;
                    }
                    else {
                        modified = INJECTION_SCRIPT + data;
                        injected = true;
                    }
                    if (injected) {
                        this.set('X-Console-Injected', 'true');
                        this.send(modified);
                    }
                    else {
                        originalSendFile.call(this, path, options, callback);
                    }
                });
            }
            else {
                originalSendFile.call(this, path, options, callback);
            }
        };
        // Intercept HTML requests that might be handled by static middleware
        // Because static middleware uses pipe which bypasses res.sendFile override
        // We manually find the file and use res.sendFile to trigger the override
        if (req.method === 'GET' && (req.path.endsWith('.html') || req.path.endsWith('.htm') || req.path.endsWith('/'))) {
            for (const config of middleware_1.middlewareService.middlewareStaticFile) {
                // Check if req.path matches config.url (mount point)
                // e.g. config.url = '/build', req.path = '/build/web-mobile/index.html'
                const urlPrefix = config.url.endsWith('/') ? config.url : config.url + '/';
                // Handle exact match or prefix match
                if (req.path === config.url || req.path.startsWith(urlPrefix)) {
                    let relativePath = req.path.slice(config.url.length);
                    if (relativePath.startsWith('/'))
                        relativePath = relativePath.slice(1);
                    // If empty or ends with slash, look for index.html
                    if (!relativePath || relativePath.endsWith('/')) {
                        relativePath += 'index.html';
                    }
                    const fsPath = path_1.default.join(config.path, relativePath);
                    // Check if file exists and is html
                    try {
                        if (fs_1.default.existsSync(fsPath) && fs_1.default.statSync(fsPath).isFile() && (fsPath.endsWith('.html') || fsPath.endsWith('.htm'))) {
                            // Send it using sendFile which is overridden
                            res.sendFile(fsPath);
                            return;
                        }
                    }
                    catch (e) {
                        // ignore error
                    }
                }
            }
        }
        next();
    };
}
exports.ConsoleLogService = ConsoleLogService;
exports.consoleLogService = new ConsoleLogService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS1sb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmVyL2NvbnNvbGUtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJCQUFnRDtBQUdoRCw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBQ3hCLDZDQUFpRDtBQUVqRCxNQUFNLGdCQUFnQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWdGeEIsQ0FBQztBQUVGLE1BQWEsaUJBQWlCO0lBQ2xCLEdBQUcsQ0FBOEI7SUFFbEMsT0FBTyxDQUFDLE1BQWM7UUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLG9CQUFlLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVuRCxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUMsUUFBUSxDQUFDO1lBRXBFLElBQUksUUFBUSxLQUFLLGNBQWMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO29CQUNsRCxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQWEsRUFBRSxF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QUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdlYlNvY2tldFNlcnZlciwgV2ViU29ja2V0IH0gZnJvbSAnd3MnO1xuaW1wb3J0IHsgU2VydmVyIH0gZnJvbSAnaHR0cCc7XG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSwgTmV4dEZ1bmN0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBtaWRkbGV3YXJlU2VydmljZSB9IGZyb20gJy4vbWlkZGxld2FyZSc7XG5cbmNvbnN0IElOSkVDVElPTl9TQ1JJUFQgPSBgXG48c2NyaXB0PlxuKGZ1bmN0aW9uKCkge1xuICAgIC8vIOW7uueriyBXZWJTb2NrZXQg6L+e5o6lXG4gICAgY29uc3QgcHJvdG9jb2wgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonID8gJ3dzczonIDogJ3dzOic7XG4gICAgY29uc3Qgd3MgPSBuZXcgV2ViU29ja2V0KHByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJy9jb25zb2xlLWxvZycpO1xuICAgIFxuICAgIC8vIOS/neWtmOWOn+WniyBjb25zb2xlIOaWueazlVxuICAgIGNvbnN0IG9yaWdpbmFsQ29uc29sZSA9IHtcbiAgICAgICAgbG9nOiBjb25zb2xlLmxvZyxcbiAgICAgICAgZXJyb3I6IGNvbnNvbGUuZXJyb3IsXG4gICAgICAgIHdhcm46IGNvbnNvbGUud2FybixcbiAgICAgICAgaW5mbzogY29uc29sZS5pbmZvLFxuICAgICAgICBkZWJ1ZzogY29uc29sZS5kZWJ1Z1xuICAgIH07XG4gICAgXG4gICAgLy8g5Y+R6YCB5pel5b+X5Yiw5pyN5Yqh5ZmoXG4gICAgZnVuY3Rpb24gc2VuZExvZyhsZXZlbCwgYXJncykge1xuICAgICAgICBpZiAod3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdsb2cnLFxuICAgICAgICAgICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGFyZ3MubWFwKGFyZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnLCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmpvaW4oJyAnKSxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWZcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdb5pel5b+X57O757ufXSDlj5HpgIHlpLHotKU6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyDph43lhpkgY29uc29sZSDmlrnms5VcbiAgICBPYmplY3Qua2V5cyhvcmlnaW5hbENvbnNvbGUpLmZvckVhY2gobGV2ZWwgPT4ge1xuICAgICAgICBjb25zb2xlW2xldmVsXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQ29uc29sZVtsZXZlbF0uYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgICAgICAgICBzZW5kTG9nKGxldmVsLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyDnm5HlkKzmnKrmjZXojrfnmoTplJnor69cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXZlbnQpID0+IHtcbiAgICAgICAgc2VuZExvZygnZXJyb3InLCBbXG4gICAgICAgICAgICAnVW5jYXVnaHQgRXJyb3I6ICcgKyBldmVudC5tZXNzYWdlLFxuICAgICAgICAgICAgJ0ZpbGU6ICcgKyBldmVudC5maWxlbmFtZSxcbiAgICAgICAgICAgICdMaW5lOiAnICsgZXZlbnQubGluZW5vICsgJzonICsgZXZlbnQuY29sbm9cbiAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8g55uR5ZCs5pyq5aSE55CG55qEIFByb21pc2Ug5ouS57udXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicsIChldmVudCkgPT4ge1xuICAgICAgICBzZW5kTG9nKCdlcnJvcicsIFtcbiAgICAgICAgICAgICdVbmhhbmRsZWQgUHJvbWlzZSBSZWplY3Rpb246ICcgKyAoZXZlbnQucmVhc29uIHx8ICdVbmtub3duIHJlYXNvbicpXG4gICAgICAgIF0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIFdlYlNvY2tldCDkuovku7blpITnkIZcbiAgICB3cy5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdb5pel5b+X57O757ufXSBXZWJTb2NrZXQg6L+e5o6l5bey5bu656uLJyk7XG4gICAgfTtcbiAgICBcbiAgICB3cy5vbmVycm9yID0gKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdb5pel5b+X57O757ufXSBXZWJTb2NrZXQg6ZSZ6K+vOicsIGVycik7XG4gICAgfTtcbiAgICBcbiAgICB3cy5vbmNsb3NlID0gKCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLndhcm4oJ1vml6Xlv5fns7vnu59dIFdlYlNvY2tldCDov57mjqXlt7LlhbPpl60nKTtcbiAgICB9O1xufSkoKTtcbjwvc2NyaXB0PlxuYDtcblxuZXhwb3J0IGNsYXNzIENvbnNvbGVMb2dTZXJ2aWNlIHtcbiAgICBwcml2YXRlIHdzczogV2ViU29ja2V0U2VydmVyIHwgdW5kZWZpbmVkO1xuXG4gICAgcHVibGljIHN0YXJ0dXAoc2VydmVyOiBTZXJ2ZXIpIHtcbiAgICAgICAgdGhpcy53c3MgPSBuZXcgV2ViU29ja2V0U2VydmVyKHsgbm9TZXJ2ZXI6IHRydWUgfSk7XG4gICAgICAgIFxuICAgICAgICBzZXJ2ZXIub24oJ3VwZ3JhZGUnLCAocmVxdWVzdCwgc29ja2V0LCBoZWFkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXRobmFtZSA9IG5ldyBVUkwocmVxdWVzdC51cmwgfHwgJycsICdodHRwOi8vYmFzZScpLnBhdGhuYW1lO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09ICcvY29uc29sZS1sb2cnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53c3M/LmhhbmRsZVVwZ3JhZGUocmVxdWVzdCwgc29ja2V0LCBoZWFkLCAod3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53c3M/LmVtaXQoJ2Nvbm5lY3Rpb24nLCB3cywgcmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMud3NzLm9uKCdjb25uZWN0aW9uJywgKHdzOiBXZWJTb2NrZXQpID0+IHtcbiAgICAgICAgICAgIHdzLm9uKCdtZXNzYWdlJywgKG1lc3NhZ2U6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1zZ1N0ciA9IG1lc3NhZ2UudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobXNnU3RyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ2xvZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZXZlbCA9IGRhdGEubGV2ZWwgfHwgJ2luZm8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkYXRhLm1lc3NhZ2UgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9nTWVzc2FnZSA9IGBbQnJvd3NlciAke2xldmVsLnRvVXBwZXJDYXNlKCl9XSAke3RleHR9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGxldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZXJyb3InOiBjb25zb2xlLmVycm9yKGxvZ01lc3NhZ2UpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd3YXJuJzogY29uc29sZS53YXJuKGxvZ01lc3NhZ2UpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdpbmZvJzogY29uc29sZS5pbmZvKGxvZ01lc3NhZ2UpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdkZWJ1Zyc6IGNvbnNvbGUuZGVidWcobG9nTWVzc2FnZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGNvbnNvbGUubG9nKGxvZ01lc3NhZ2UpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBwdWJsaWMgaW5qZWN0TWlkZGxld2FyZSA9IChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuICAgICAgICBjb25zdCBvcmlnaW5hbFNlbmQgPSByZXMuc2VuZDtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxTZW5kRmlsZSA9IHJlcy5zZW5kRmlsZTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJlcy5zZW5kID0gZnVuY3Rpb24oYm9keTogYW55KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnICYmIChib2R5LmluY2x1ZGVzKCc8L2hlYWQ+JykgfHwgYm9keS5pbmNsdWRlcygnPGJvZHknKSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbW9kaWZpZWQgPSBib2R5O1xuICAgICAgICAgICAgICAgIGlmIChib2R5LmluY2x1ZGVzKCc8L2hlYWQ+JykpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZpZWQgPSBib2R5LnJlcGxhY2UoJzwvaGVhZD4nLCBJTkpFQ1RJT05fU0NSSVBUICsgJzwvaGVhZD4nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGJvZHkuaW5jbHVkZXMoJzxib2R5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZpZWQgPSBib2R5LnJlcGxhY2UoJzxib2R5JywgSU5KRUNUSU9OX1NDUklQVCArICc8Ym9keScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGlmaWVkID0gSU5KRUNUSU9OX1NDUklQVCArIGJvZHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdYLUNvbnNvbGUtSW5qZWN0ZWQnLCAndHJ1ZScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFNlbmQuY2FsbCh0aGlzLCBtb2RpZmllZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxTZW5kLmNhbGwodGhpcywgYm9keSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXMuc2VuZEZpbGUgPSBmdW5jdGlvbihwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBhbnksIGNhbGxiYWNrPzogKGVycj86IGFueSkgPT4gdm9pZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgcGF0aC5lbmRzV2l0aCgnLmh0bScpKSB7XG4gICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKHBhdGgsICd1dGY4JywgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIG9yaWdpbmFsU2VuZEZpbGUuY2FsbCh0aGlzLCBwYXRoLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1vZGlmaWVkID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluamVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5pbmNsdWRlcygnPC9oZWFkPicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllZCA9IGRhdGEucmVwbGFjZSgnPC9oZWFkPicsIElOSkVDVElPTl9TQ1JJUFQgKyAnPC9oZWFkPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuaW5jbHVkZXMoJzxib2R5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVkID0gZGF0YS5yZXBsYWNlKCc8Ym9keScsIElOSkVDVElPTl9TQ1JJUFQgKyAnPGJvZHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVkID0gSU5KRUNUSU9OX1NDUklQVCArIGRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmplY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoJ1gtQ29uc29sZS1JbmplY3RlZCcsICd0cnVlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmQobW9kaWZpZWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxTZW5kRmlsZS5jYWxsKHRoaXMsIHBhdGgsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFNlbmRGaWxlLmNhbGwodGhpcywgcGF0aCwgb3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVyY2VwdCBIVE1MIHJlcXVlc3RzIHRoYXQgbWlnaHQgYmUgaGFuZGxlZCBieSBzdGF0aWMgbWlkZGxld2FyZVxuICAgICAgICAvLyBCZWNhdXNlIHN0YXRpYyBtaWRkbGV3YXJlIHVzZXMgcGlwZSB3aGljaCBieXBhc3NlcyByZXMuc2VuZEZpbGUgb3ZlcnJpZGVcbiAgICAgICAgLy8gV2UgbWFudWFsbHkgZmluZCB0aGUgZmlsZSBhbmQgdXNlIHJlcy5zZW5kRmlsZSB0byB0cmlnZ2VyIHRoZSBvdmVycmlkZVxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0dFVCcgJiYgKHJlcS5wYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IHJlcS5wYXRoLmVuZHNXaXRoKCcuaHRtJykgfHwgcmVxLnBhdGguZW5kc1dpdGgoJy8nKSkpIHtcbiAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbmZpZyBvZiBtaWRkbGV3YXJlU2VydmljZS5taWRkbGV3YXJlU3RhdGljRmlsZSkge1xuICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiByZXEucGF0aCBtYXRjaGVzIGNvbmZpZy51cmwgKG1vdW50IHBvaW50KVxuICAgICAgICAgICAgICAgICAvLyBlLmcuIGNvbmZpZy51cmwgPSAnL2J1aWxkJywgcmVxLnBhdGggPSAnL2J1aWxkL3dlYi1tb2JpbGUvaW5kZXguaHRtbCdcbiAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIGNvbnN0IHVybFByZWZpeCA9IGNvbmZpZy51cmwuZW5kc1dpdGgoJy8nKSA/IGNvbmZpZy51cmwgOiBjb25maWcudXJsICsgJy8nO1xuICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgZXhhY3QgbWF0Y2ggb3IgcHJlZml4IG1hdGNoXG4gICAgICAgICAgICAgICAgIGlmIChyZXEucGF0aCA9PT0gY29uZmlnLnVybCB8fCByZXEucGF0aC5zdGFydHNXaXRoKHVybFByZWZpeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgbGV0IHJlbGF0aXZlUGF0aCA9IHJlcS5wYXRoLnNsaWNlKGNvbmZpZy51cmwubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGl2ZVBhdGguc3RhcnRzV2l0aCgnLycpKSByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZVBhdGguc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgIC8vIElmIGVtcHR5IG9yIGVuZHMgd2l0aCBzbGFzaCwgbG9vayBmb3IgaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZWxhdGl2ZVBhdGggfHwgcmVsYXRpdmVQYXRoLmVuZHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZVBhdGggKz0gJ2luZGV4Lmh0bWwnO1xuICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICBjb25zdCBmc1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnBhdGgsIHJlbGF0aXZlUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGZpbGUgZXhpc3RzIGFuZCBpcyBodG1sXG4gICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZzUGF0aCkgJiYgZnMuc3RhdFN5bmMoZnNQYXRoKS5pc0ZpbGUoKSAmJiAoZnNQYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZzUGF0aC5lbmRzV2l0aCgnLmh0bScpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIGl0IHVzaW5nIHNlbmRGaWxlIHdoaWNoIGlzIG92ZXJyaWRkZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmRGaWxlKGZzUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBuZXh0KCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY29uc29sZUxvZ1NlcnZpY2UgPSBuZXcgQ29uc29sZUxvZ1NlcnZpY2UoKTtcbiJdfQ==