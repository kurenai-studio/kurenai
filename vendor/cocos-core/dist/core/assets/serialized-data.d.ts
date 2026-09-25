import type { IProperty } from '../scene/@types/public';
export type SerializedAssetDump = Record<string, IProperty> | IProperty;
export type SerializedAssetPatch = SerializedAssetDump | Partial<Record<string, IProperty | unknown>>;
export interface SerializedAssetQueryResult {
    uuid: string;
    url: string;
    type: string;
    importer: string;
    dump: SerializedAssetDump;
}
export declare function querySerializedData(uuidOrUrlOrPath: string): Promise<SerializedAssetQueryResult>;
export declare function saveSerializedData(uuidOrUrlOrPath: string, patch: SerializedAssetPatch): Promise<SerializedAssetQueryResult>;
export declare function encodeSerializedObject(object: any, attributes: any, owner?: any, objectKey?: string, isTemplate?: boolean): IProperty;
export declare function getDefaultValueByType(type: string, data?: any): any;
