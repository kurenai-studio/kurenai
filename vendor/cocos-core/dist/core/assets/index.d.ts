/**
 * 初始化资源数据库相关配置与管理器
 */
export declare function initAssetDB(): Promise<void>;
/**
 * 启动资源数据库，开始扫描和导入资源
 */
export declare function startAssetDB(): Promise<void>;
/**
 * 停止资源数据库
 */
export declare function stopAssetDB(): Promise<void>;
export { default as assetManager } from './manager/asset';
export { default as assetDBManager } from './manager/asset-db';
