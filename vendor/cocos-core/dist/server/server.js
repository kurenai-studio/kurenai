"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverService = exports.ServerService = void 0;
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const fs_extra_1 = require("fs-extra");
const http_1 = require("http");
const https_1 = require("https");
const utils_1 = require("./utils");
const socket_1 = require("./socket");
const console_log_1 = require("./console-log");
const middleware_1 = require("./middleware");
const cors_1 = require("./utils/cors");
const path_1 = __importDefault(require("path"));
class ServerService {
    app = (0, express_1.default)();
    server;
    _port = 9527;
    _host = 'localhost'; // 对外 url 使用的 host/ip
    useHttps = false;
    httpsConfig = {
        key: '', // HTTPS 私钥文件路径
        cert: '', // HTTPS 证书文件路径
        ca: '', // 证书的签发请求文件 csr ，没有可省略
    };
    get url() {
        if (this.server && this.server.listening) {
            const httpRoot = this.useHttps ? 'https' : 'http';
            return `${httpRoot}://${this._host}:${this._port}`;
        }
        return '服务器未启动';
    }
    get host() {
        return this._host;
    }
    get port() {
        return this._port;
    }
    async start(port, host) {
        console.log('🚀 开始启动服务器...');
        this.init();
        if (host) {
            this._host = host;
        }
        const preferredPort = await (0, utils_1.getAvailablePort)(port || this._port);
        const { server, port: actualPort } = await this.createServerWithRetry(preferredPort, host);
        this._port = actualPort;
        this.server = server;
        socket_1.socketService.startup(this.server);
        console_log_1.consoleLogService.startup(this.server);
        // 打印服务器地址
        this.printServerUrls();
    }
    async stop() {
        return new Promise((resolve, reject) => {
            this.server?.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('关闭服务器');
                this.server = undefined;
                resolve();
            });
        });
    }
    /**
     * 创建 HTTP 或 HTTPS 服务器并等待启动
     * @param options 配置对象
     * @param requestHandler
     * @returns Promise<http.Server | https.Server>
     */
    async createServer(options, requestHandler) {
        const { port, host, useHttps, keyFile, certFile, caFile } = options;
        let server;
        if (useHttps) {
            if (!keyFile || !certFile) {
                return Promise.reject(new Error('HTTPS requires keyFile and certFile'));
            }
            const options = {
                key: undefined,
                cert: undefined,
                ca: undefined,
            };
            if ((0, fs_extra_1.existsSync)(keyFile)) {
                options.key = (0, fs_extra_1.readFileSync)(path_1.default.resolve(keyFile));
            }
            if ((0, fs_extra_1.existsSync)(certFile)) {
                options.cert = (0, fs_extra_1.readFileSync)(certFile);
            }
            if (caFile && (0, fs_extra_1.existsSync)(caFile)) {
                options.ca = (0, fs_extra_1.readFileSync)(caFile);
            }
            server = (0, https_1.createServer)(options, requestHandler);
        }
        else {
            server = (0, http_1.createServer)(requestHandler);
        }
        return new Promise((resolve, reject) => {
            server.once('listening', () => {
                resolve(server);
            });
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`❌ 端口 ${port} 已被占用`);
                }
                else {
                    console.error(`❌ ${useHttps ? 'HTTPS' : 'HTTP'} 服务器启动失败:`, err);
                }
                reject(err);
            });
            // host 省略时 listen(port, undefined) 等价于绑定所有网卡(保持原行为)。
            if (host) {
                server.listen(port, host);
            }
            else {
                server.listen(port);
            }
        });
    }
    async createServerWithRetry(port, host) {
        try {
            const server = await this.createServer({
                port,
                host,
                useHttps: this.useHttps,
                keyFile: this.httpsConfig.key,
                certFile: this.httpsConfig.cert,
                caFile: this.httpsConfig.ca,
            }, this.app);
            return { server, port };
        }
        catch (err) {
            if (err.code === 'EADDRINUSE') {
                return this.createServerWithRetry(port + 1, host);
            }
            throw err;
        }
    }
    printServerUrls() {
        const hasListening = !!(this.server && this.server.listening);
        if (!hasListening) {
            console.warn('⚠️ 服务器未开启或未监听端口');
            return;
        }
        console.log(`\n🚀 服务器已启动: ${this.url}`);
    }
    init() {
        this.app.use(cors_1.cors);
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(console_log_1.consoleLogService.injectMiddleware);
        this.app.use(middleware_1.middlewareService.router);
        this.app.use(middleware_1.middlewareService.staticRouter);
        // 未能正常响应的接口
        this.app.use((req, res) => {
            res.status(404);
            res.send('404 - Not Found');
        });
        // 出现错误的接口
        this.app.use((err, req, res, next) => {
            console.error(err);
            res.status(500);
            res.send('500 - Server Error');
        });
    }
    register(name, module) {
        middleware_1.middlewareService.register(name, module);
        this.app.use(middleware_1.middlewareService.router);
    }
}
exports.ServerService = ServerService;
exports.serverService = new ServerService();
