import type { IConfiguration, ConfigurationScope } from '../../core/configuration/script/interface';
import type { ICocosConfigurationNode } from '../../core/configuration/script/metadata';
export { IConfiguration, ConfigurationScope } from '../../core/configuration/script/interface';
export { IBaseConfiguration } from '../../core/configuration/script/config';
export declare function init(projectPath: string): Promise<void>;
export declare function migrateFromProject(): Promise<IConfiguration>;
export declare function reload(): Promise<void>;
export declare function migrate(): Promise<void>;
export declare function get<T>(key: string, scope?: ConfigurationScope): Promise<T>;
export declare function set<T>(key: string, value: T, scope?: ConfigurationScope): Promise<boolean>;
export declare function remove(key: string, scope?: ConfigurationScope): Promise<boolean>;
/**
 * 将配置写入磁盘
 * @param force 是否强制写入（跳过节流/脏检查）
 * @param scope 'project'(默认) -> settings/cocos.config.json；'local' -> profiles/cocos.config.json
 */
export declare function save(force?: boolean, scope?: ConfigurationScope): Promise<void>;
/**
 * 获取指定作用域配置文件的绝对路径
 * @param scope 'project'(默认) -> settings/cocos.config.json；'local' -> profiles/cocos.config.json
 */
export declare function getConfigPath(scope?: ConfigurationScope): Promise<string>;
/**
 * 注册配置保存事件的监听器
 * @param callback 对应作用域配置文件被写入磁盘时触发
 * @param scope 'project'(默认) -> settings/cocos.config.json；'local' -> profiles/cocos.config.json
 * @returns 取消监听的函数
 */
export declare function onDidSave(callback: () => void, scope?: ConfigurationScope): () => void;
export { ICocosConfigurationNode, ICocosConfigurationPropertySchema } from '../../core/configuration/script/metadata';
export declare function getMetadata(): Promise<ICocosConfigurationNode[]>;
