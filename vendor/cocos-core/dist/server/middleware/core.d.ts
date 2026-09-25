import { IMiddlewareContribution, ISocketConfig, IStaticFileConfig } from '../interfaces';
export declare class MiddlewareManager {
    router: import("express-serve-static-core").Router;
    staticRouter: import("express-serve-static-core").Router;
    middlewareStaticFile: IStaticFileConfig[];
    middlewareSocket: Map<string, ISocketConfig>;
    /** 加载中间件模块 */
    register(name: string, module: IMiddlewareContribution): void;
}
export declare const middlewareService: MiddlewareManager;
