import { Request, Response, NextFunction } from 'express';
import { IMiddlewareContribution } from '../../../server/interfaces';
/** 扩展 server 贡献里单条路由的形状（注意键名是 handle，不是 handler）。 */
interface ExtRoute {
    url: string | RegExp;
    handle: (req: Request, res: Response, next?: NextFunction) => any;
}
/**
 * 把若干扩展 server 贡献的 get/post 路由转换为 CLI 的 IMiddlewareContribution：
 * - handle -> handler（并包一层 try/catch -> next(err)）
 * - 同方法内按 url 去重（先到先得）
 */
export declare function buildMiddlewareContribution(routeSets: {
    get?: ExtRoute[];
    post?: ExtRoute[];
}[]): IMiddlewareContribution;
export {};
