import type { IMiddlewareContribution } from '../../server/interfaces';
import { Request, Response, NextFunction } from 'express';
export declare function getLibraryDirs(): Promise<string[]>;
/**
 * 游戏运行时共享的资源路由（settings / 原始资源 / bundle config / bundle index / 启动场景 JSON）。
 * 浏览器游戏预览（/）使用；抽出为具名导出便于维护。
 */
export declare const gamePreviewResourceRoutes: ({
    url: string;
    handler(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
} | {
    url: RegExp;
    handler(req: Request, res: Response, next: NextFunction): Promise<void>;
})[];
declare const _default: IMiddlewareContribution;
export default _default;
