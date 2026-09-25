interface IMessageInfo {
    type: string;
    path: string;
    method?: string;
    args?: any[];
    logDest?: string;
}
declare const RawWarning: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare let currentLogDest: string;
declare function recordChildLog(logDest?: string): void;
declare function executeScript(path: string, method?: string, args?: any[]): Promise<any>;
