import type { EffectAsset } from 'cc';
import type { IProperty } from './@types/public';
export interface MaterialEffectInfo {
    uuid: string;
    name: string;
    hideInEditor?: boolean;
    assetPath: string;
}
export interface MaterialPassDump {
    index: number;
    name?: string;
    phase?: string;
    switch?: IProperty;
    propertyIndex: IProperty;
    props: IProperty[];
    defines: IProperty[];
    states: IProperty;
}
export interface MaterialTechniqueDump {
    name?: string;
    passes: MaterialPassDump[];
}
export interface MaterialDump {
    effect: string;
    technique: number;
    data: MaterialTechniqueDump[];
}
export declare function queryAllEffects(): Promise<Record<string, MaterialEffectInfo>>;
export declare function queryEffect(effectNameOrUuid: string): Promise<MaterialTechniqueDump[]>;
export declare function queryMaterial(uuidOrUrlOrPath: string): Promise<MaterialDump>;
export declare function saveMaterial(uuidOrUrlOrPath: string, dump: MaterialDump): Promise<void>;
export declare function encodeEffect(effect: EffectAsset, effectUuid?: string): MaterialTechniqueDump[];
