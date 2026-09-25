export declare class ServiceManager {
    private initialized;
    private eventHandlers;
    private serverUrl;
    initialize(serverUrl: string): void;
    getServerUrl(): string;
    /**
     * 遍历所有已注册的 Service，依次调用 init()（跳过 Engine，它需要单独初始化）
     */
    initAllServices(): Promise<void>;
    private registerAutoForwardEvents;
    private registerAutoForwardEvent;
    private registerMessageOnlyForwardEvents;
    private unregisterAutoForwardEvents;
}
export declare const serviceManager: ServiceManager;
