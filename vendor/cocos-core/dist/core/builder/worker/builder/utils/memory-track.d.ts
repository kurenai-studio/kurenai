/**
 * 内存统计 构建内存性能测试 A022
 */
export declare class MemoryTrack {
    private _startMemory;
    private _maxMemory;
    private _interval;
    private _intervalId;
    static enabled: boolean;
    private _lastMemory;
    constructor(interval?: number);
    start(): void;
    stop(): void;
    get memoryUsage(): number;
    get currentMemory(): number;
    printResult(): void;
}
export declare function formateBytes(bytes: number): string;
/**
 * 获取当前内存占用
 */
export declare function getMemorySize(): string;
