import { EventEmitter } from 'events';
import { IBaseConfiguration } from './config';
import type { ICocosConfigurationMetadataRegistration, ICocosConfigurationNode } from './metadata';
export interface IConfigurationRegistration {
    defaults?: Record<string, any>;
    nodes?: ICocosConfigurationMetadataRegistration;
}
export interface IConfigurationRegistry {
    getInstances(): Record<string, IBaseConfiguration>;
    getInstance(moduleName: string): IBaseConfiguration | undefined;
    register(moduleName: string, registration?: IConfigurationRegistration): Promise<IBaseConfiguration>;
    register(moduleName: string, defaultConfig?: Record<string, any>): Promise<IBaseConfiguration>;
    register<T extends IBaseConfiguration>(moduleName: string, instance: T): Promise<T>;
    register<T extends IBaseConfiguration>(moduleName: string, instance: T, registration: IConfigurationRegistration): Promise<T>;
    unregister(moduleName: string): Promise<void>;
    getMetadata(): Promise<ICocosConfigurationNode[]>;
}
export declare class ConfigurationRegistry extends EventEmitter implements IConfigurationRegistry {
    private instances;
    private registrations;
    getInstances(): Record<string, IBaseConfiguration>;
    getInstance(moduleName: string): IBaseConfiguration | undefined;
    register(moduleName: string, registration?: IConfigurationRegistration): Promise<IBaseConfiguration>;
    register(moduleName: string, defaultConfig?: Record<string, any>): Promise<IBaseConfiguration>;
    register<T extends IBaseConfiguration>(moduleName: string, instance: T): Promise<T>;
    register<T extends IBaseConfiguration>(moduleName: string, instance: T, registration: IConfigurationRegistration): Promise<T>;
    unregister(moduleName: string): Promise<void>;
    getMetadata(): Promise<ICocosConfigurationNode[]>;
    private parseRegisterArguments;
    private resolveDefaultConfig;
    private mergeRegistration;
    private deriveDefaultsFromNodes;
}
export declare const configurationRegistry: ConfigurationRegistry;
