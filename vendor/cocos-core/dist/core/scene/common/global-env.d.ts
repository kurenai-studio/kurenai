/**
 * 记录并管理执行过程中在 globalThis 上新增的属性，
 * 在下一次 record 时自动清理上次新增的属性。
 */
export declare class GlobalEnv {
    record(fn: () => Promise<void>): Promise<void>;
    private clear;
    private processQueue;
    private _incrementalKeys;
    private _queue;
}
