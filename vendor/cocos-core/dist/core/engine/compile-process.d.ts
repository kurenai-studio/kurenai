/**
 * 在独立的子进程中运行引擎编译
 * 这样可以避免繁重的 babel 转译阻塞主进程事件循环
 */
export declare function startCompileEngineProcess(force?: boolean): Promise<void>;
