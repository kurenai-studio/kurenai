export declare class Awaiter<TValue, TError = any> {
    resolve(value: TValue): void;
    reject(err?: TError): void;
    wait(): Promise<TValue>;
    private _state;
    private _result;
    private _queue;
}
