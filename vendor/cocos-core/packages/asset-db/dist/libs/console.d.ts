export declare const enum LogLevel {
    NONE = 0,
    Error = 1,
    WARN = 2,
    LOG = 3,
    DEBUG = 4
}
export declare class CustomConsole {
    constructor(level?: LogLevel);
    debug: (...args: any[]) => void;
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}
