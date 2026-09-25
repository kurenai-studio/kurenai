import type { IEngineConfig } from './@types/config';
import type { ICocosConfigurationNode } from '../configuration/script/metadata';
interface IEngineMetadataOptions {
    defaultConfig: IEngineConfig;
    engineRoot: string;
}
export declare function createEngineMetadataNodes(options: IEngineMetadataOptions): ICocosConfigurationNode[];
export {};
