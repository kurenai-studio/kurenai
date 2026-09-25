import { Server } from 'http';
import { Request, Response, NextFunction } from 'express';
export declare class ConsoleLogService {
    private wss;
    startup(server: Server): void;
    injectMiddleware: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const consoleLogService: ConsoleLogService;
