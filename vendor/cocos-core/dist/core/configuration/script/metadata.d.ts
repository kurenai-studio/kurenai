import type { EnumItem } from '../../base/type';
export interface ICocosConfigurationPropertySchema {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    default?: unknown;
    title?: string;
    description?: string;
    hidden?: boolean;
    enum?: Array<string | number | boolean>;
    enumDescriptions?: string[];
    minimum?: number;
    maximum?: number;
    step?: number;
    order?: number;
    properties?: Record<string, ICocosConfigurationPropertySchema>;
    items?: ICocosConfigurationPropertySchema | ICocosConfigurationPropertySchema[];
    additionalProperties?: boolean | ICocosConfigurationPropertySchema;
    required?: string[];
    ui?: 'asset-picker' | string;
    assetType?: string;
    valueField?: string;
    displayFields?: string[];
    query?: Record<string, unknown>;
}
export interface ICocosConfigurationNode {
    id: string;
    title: string;
    group: string;
    order?: number;
    properties: Record<string, ICocosConfigurationPropertySchema>;
}
export type ICocosConfigurationMetadataValue = ICocosConfigurationNode[] | Promise<ICocosConfigurationNode[]>;
export type ICocosConfigurationMetadataProvider = () => ICocosConfigurationMetadataValue;
export type ICocosConfigurationMetadataRegistration = ICocosConfigurationNode[] | ICocosConfigurationMetadataProvider;
export interface IConfigurationItemBase {
    label?: string;
    description?: string;
    default?: unknown;
    hidden?: boolean;
}
export type IConfigurationItem = (IConfigurationItemBase & {
    type: 'string';
}) | (IConfigurationItemBase & {
    type: 'number';
    minimum?: number;
    maximum?: number;
    step?: number;
}) | (IConfigurationItemBase & {
    type: 'boolean';
}) | (IConfigurationItemBase & {
    type: 'enum';
    items: EnumItem[];
}) | (IConfigurationItemBase & {
    type: 'array';
    items?: IConfigurationItem | IConfigurationItem[];
}) | (IConfigurationItemBase & {
    type: 'object';
    properties?: Record<string, IConfigurationItem>;
    additionalProperties?: boolean | ICocosConfigurationPropertySchema;
    required?: string[];
});
export declare function createPropertySchema(schema: ICocosConfigurationPropertySchema): ICocosConfigurationPropertySchema;
export declare function createNode(id: string, title: string, group: string, props: Record<string, ICocosConfigurationPropertySchema>, order?: number): ICocosConfigurationNode;
export declare function createTitleFromKey(key: string): string;
export declare function translateMetadataText(value: string | undefined, fallback?: string): string | undefined;
export declare function normalizeDisplayText(value: string | undefined, fallback: string): string;
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
export declare function hasConfigItemShape(value: unknown): value is IConfigurationItem;
export declare function objectSchema(properties?: Record<string, ICocosConfigurationPropertySchema>, overrides?: Partial<ICocosConfigurationPropertySchema>): ICocosConfigurationPropertySchema;
export declare function arraySchema(items?: ICocosConfigurationPropertySchema | ICocosConfigurationPropertySchema[], overrides?: Partial<ICocosConfigurationPropertySchema>): ICocosConfigurationPropertySchema;
export declare function inferSchemaFromValue(value: unknown, key: string): ICocosConfigurationPropertySchema;
export declare function convertConfigItem(item: IConfigurationItem, key: string): ICocosConfigurationPropertySchema;
