export interface NodeConfig {
    name: string;
    assetUuid?: string;
    canvasRequired?: boolean;
    snapshot?: boolean;
    nameIncrease?: boolean;
    'project-type'?: string;
}
export interface NodeMap {
    [key: string]: NodeConfig[];
}
export declare const NODE_CONFIGS: NodeMap;
export default NODE_CONFIGS;
