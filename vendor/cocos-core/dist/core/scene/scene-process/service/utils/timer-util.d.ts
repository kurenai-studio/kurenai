declare class TimerUtil {
    private _timeInterval;
    constructor(timeInterval?: number);
    private _callWaitingMap;
    /**
     * 限制一个方法在一定时间内的调用次数
     * @param key 这个方法的一个唯一标识
     * @param func 方法
     * @param args 参数
     */
    callFunctionLimit(key: string, func: Function, ...args: any[]): void;
    clear(): void;
}
export { TimerUtil };
