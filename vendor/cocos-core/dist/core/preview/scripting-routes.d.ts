import { Request, Response, NextFunction } from 'express';
/**
 * 动态预览的共享资源路由。
 *
 * 这些路由负责按请求动态托管「引擎 / 脚本(QuickPack) / SystemJS / import-map」等资源，
 * 游戏预览（game-preview.middleware）和场景编辑器预览（scene.scripting.middleware）共用，
 * 不包含各自专属的 `/` 入口路由。
 */
export declare const scriptingRoutes: ({
    url: string;
    handler(req: Request, res: Response, next: NextFunction): Promise<void>;
} | {
    url: string;
    handler(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
} | {
    url: RegExp;
    handler(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
})[];
