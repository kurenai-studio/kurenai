import type { IMessageManagerEvents } from '../../common';
type MessageEvent = keyof IMessageManagerEvents;
declare class MessageManager {
    private _timerUtil;
    private _emitter;
    on<K extends MessageEvent>(event: K, listener: (...args: IMessageManagerEvents[K]) => void): void;
    on(event: string, listener: (...args: any[]) => void): void;
    once<K extends MessageEvent>(event: K, listener: (...args: IMessageManagerEvents[K]) => void): void;
    once(event: string, listener: (...args: any[]) => void): void;
    off<K extends MessageEvent>(event: K, listener: (...args: IMessageManagerEvents[K]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
    broadcast<K extends MessageEvent>(event: K, ...args: IMessageManagerEvents[K]): void;
    broadcast(event: string, ...args: any[]): void;
    clear(event?: string): void;
    broadcastNodeChangeMsg(...args: any[]): void;
}
declare const messageManager: MessageManager;
export { messageManager, MessageManager };
