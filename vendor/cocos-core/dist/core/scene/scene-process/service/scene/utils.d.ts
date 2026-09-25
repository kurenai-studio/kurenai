import cc from 'cc';
import type { INode, IPrefab, INodeDumpOptions } from '../../../common';
import type { IScene } from '../../../common/editor/scene';
declare class SceneUtil {
    /** 默认超时：1分钟 */
    static readonly Timeout: number;
    /**
     * 立即运行场景，清除节点与组件缓存
     * @param sceneAsset
     */
    runScene(sceneAsset: cc.SceneAsset | cc.Scene): Promise<cc.Scene>;
    /**
     * 从一个序列化后的 JSON 内加载并运行场景
     * @param serializeJSON
     */
    runSceneImmediateByJson(serializeJSON: Record<string, any>): Promise<cc.Scene>;
    /**
     * 生成组件信息
     */
    generateComponentInfo(component: cc.Component): {
        cid: any;
        path: string;
        uuid: string;
        name: string;
        type: string;
        enabled: boolean;
    };
    enrichPrefabDump(prefab: any, enginePrefab: any): void;
    generateNodeIdentifier(node: cc.Node): {
        nodeId: string;
        path: string;
        name: string;
    };
    generateComponentIdentifier(component: cc.Component): {
        cid: any;
        path: string;
        uuid: string;
        name: string;
        type: string;
        enabled: boolean;
    };
    generatePrefabDump(node: cc.Node): IPrefab | null;
    generateNodeDump(node: cc.Node, options?: INodeDumpOptions): INode | IScene;
    /**
     * 序列化场景
     * @private
     */
    serialize(scene: cc.Scene): any;
    /**
     * 根据资源 uuid 加载资源
     * @param uuid
     */
    loadAny<TAsset extends cc.Asset>(uuid: string): Promise<TAsset>;
}
/**
 * 通用超时包装函数
 * @param promise 要执行的 Promise
 * @param timeoutMs 超时时间（毫秒）
 * @param message 超时错误信息
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message?: string): Promise<T>;
export declare const sceneUtils: SceneUtil;
export {};
