import { Express } from 'express';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import { IMiddlewareContribution } from './interfaces';
interface ServerOptions {
    port: number;
    host?: string;
    useHttps: boolean;
    keyFile?: string;
    certFile?: string;
    caFile?: string;
}
export declare class ServerService {
    private app;
    private server;
    private _port;
    private _host;
    private useHttps;
    private httpsConfig;
    get url(): string;
    get host(): string;
    get port(): number;
    start(port?: number, host?: string): Promise<void>;
    stop(): Promise<void>;
    /**
     * 创建 HTTP 或 HTTPS 服务器并等待启动
     * @param options 配置对象
     * @param requestHandler
     * @returns Promise<http.Server | https.Server>
     */
    createServer(options: ServerOptions, requestHandler: Express): Promise<HTTPServer | HTTPSServer>;
    private createServerWithRetry;
    private printServerUrls;
    init(): void;
    register(name: string, module: IMiddlewareContribution): void;
}
export declare const serverService: ServerService;
export {};
