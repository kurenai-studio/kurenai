import { z } from 'zod';
import { SchemaUrlOrUUID, SchemaUUIDOrPath, SchemaUrlOrUUIDOrPath, SchemaUrlOrPath } from '../base/schema-identifier';
export { SchemaUrlOrUUIDOrPath };
export declare const SchemaDirOrDbPath: z.ZodString;
export declare const SchemaDbDirResult: z.ZodObject<{
    dbPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
}, {
    dbPath: string;
}>;
type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
export declare const SchemaAssetInfo: z.ZodType<any>;
export declare const SchemaDataKeys: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
export declare const SchemaQueryAssetsOption: z.ZodOptional<z.ZodObject<{
    ccType: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    isBundle: z.ZodOptional<z.ZodBoolean>;
    importer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    pattern: z.ZodOptional<z.ZodString>;
    extname: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
}, "strip", z.ZodTypeAny, {
    pattern?: string | undefined;
    importer?: string | string[] | undefined;
    extname?: string | string[] | undefined;
    isBundle?: boolean | undefined;
    ccType?: string | string[] | undefined;
}, {
    pattern?: string | undefined;
    importer?: string | string[] | undefined;
    extname?: string | string[] | undefined;
    isBundle?: boolean | undefined;
    ccType?: string | string[] | undefined;
}>>;
export declare const SchemaSupportCreateType: z.ZodEnum<z.Writeable<any>>;
export declare const SchemaTargetPath: z.ZodString;
export declare const SchemaBaseName: z.ZodString;
export declare const SchemaAssetNewName: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaAssetOperationOption: z.ZodOptional<z.ZodObject<{
    overwrite: z.ZodOptional<z.ZodBoolean>;
    rename: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    overwrite?: boolean | undefined;
    rename?: boolean | undefined;
}, {
    overwrite?: boolean | undefined;
    rename?: boolean | undefined;
}>>;
export declare const SchemaCreateAssetByTypeOptions: z.ZodOptional<z.ZodObject<{
    overwrite: z.ZodOptional<z.ZodBoolean>;
    rename: z.ZodOptional<z.ZodBoolean>;
    templateName: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
    userData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, z.ZodTypeDef, JsonValue>>>;
}, "strip", z.ZodTypeAny, {
    overwrite?: boolean | undefined;
    uuid?: string | undefined;
    userData?: Record<string, JsonValue> | undefined;
    rename?: boolean | undefined;
    content?: string | undefined;
    templateName?: string | undefined;
}, {
    overwrite?: boolean | undefined;
    uuid?: string | undefined;
    userData?: Record<string, JsonValue> | undefined;
    rename?: boolean | undefined;
    content?: string | undefined;
    templateName?: string | undefined;
}>>;
export declare const SchemaCreateAssetOptions: z.ZodObject<{
    overwrite: z.ZodOptional<z.ZodBoolean>;
    rename: z.ZodOptional<z.ZodBoolean>;
    content: z.ZodOptional<z.ZodString>;
    target: z.ZodString;
    template: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
    userData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, z.ZodTypeDef, JsonValue>>>;
    customOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, z.ZodTypeDef, JsonValue>>>;
}, "strip", z.ZodTypeAny, {
    target: string;
    overwrite?: boolean | undefined;
    uuid?: string | undefined;
    userData?: Record<string, JsonValue> | undefined;
    rename?: boolean | undefined;
    content?: string | undefined;
    template?: string | undefined;
    customOptions?: Record<string, JsonValue> | undefined;
}, {
    target: string;
    overwrite?: boolean | undefined;
    uuid?: string | undefined;
    userData?: Record<string, JsonValue> | undefined;
    rename?: boolean | undefined;
    content?: string | undefined;
    template?: string | undefined;
    customOptions?: Record<string, JsonValue> | undefined;
}>;
export declare const SchemaSourcePath: z.ZodString;
export declare const SchemaSaveAssetPath: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaAssetData: z.ZodString;
export declare const SchemaSerializedAssetProperty: z.ZodType<any>;
export declare const SchemaSerializedAssetDump: z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>, z.ZodType<any, z.ZodTypeDef, any>]>;
export declare const SchemaSerializedAssetPatch: z.ZodUnion<[z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>, z.ZodType<any, z.ZodTypeDef, any>]>, z.ZodRecord<z.ZodString, z.ZodAny>]>;
export declare const SchemaMaterialEffectNameOrUuid: z.ZodString;
export declare const SchemaMaterialEffectInfo: z.ZodObject<{
    uuid: z.ZodString;
    name: z.ZodString;
    hideInEditor: z.ZodOptional<z.ZodBoolean>;
    assetPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    uuid: string;
    assetPath: string;
    hideInEditor?: boolean | undefined;
}, {
    name: string;
    uuid: string;
    assetPath: string;
    hideInEditor?: boolean | undefined;
}>;
export declare const SchemaMaterialPassDump: z.ZodObject<{
    index: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    phase: z.ZodOptional<z.ZodString>;
    switch: z.ZodOptional<z.ZodType<any, z.ZodTypeDef, any>>;
    propertyIndex: z.ZodType<any, z.ZodTypeDef, any>;
    props: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
    defines: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
    states: z.ZodType<any, z.ZodTypeDef, any>;
}, "strip", z.ZodTypeAny, {
    index: number;
    props: any[];
    defines: any[];
    name?: string | undefined;
    switch?: any;
    phase?: string | undefined;
    propertyIndex?: any;
    states?: any;
}, {
    index: number;
    props: any[];
    defines: any[];
    name?: string | undefined;
    switch?: any;
    phase?: string | undefined;
    propertyIndex?: any;
    states?: any;
}>;
export declare const SchemaMaterialTechniqueDump: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    passes: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
        phase: z.ZodOptional<z.ZodString>;
        switch: z.ZodOptional<z.ZodType<any, z.ZodTypeDef, any>>;
        propertyIndex: z.ZodType<any, z.ZodTypeDef, any>;
        props: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
        defines: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
        states: z.ZodType<any, z.ZodTypeDef, any>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }, {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    passes: {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }[];
    name?: string | undefined;
}, {
    passes: {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }[];
    name?: string | undefined;
}>;
export declare const SchemaMaterialDump: z.ZodObject<{
    effect: z.ZodString;
    technique: z.ZodNumber;
    data: z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        passes: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
            phase: z.ZodOptional<z.ZodString>;
            switch: z.ZodOptional<z.ZodType<any, z.ZodTypeDef, any>>;
            propertyIndex: z.ZodType<any, z.ZodTypeDef, any>;
            props: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
            defines: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
            states: z.ZodType<any, z.ZodTypeDef, any>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }, {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }, {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    effect: string;
    data: {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }[];
    technique: number;
}, {
    effect: string;
    data: {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }[];
    technique: number;
}>;
export declare const SchemaAssetInfoResult: z.ZodNullable<z.ZodType<any, z.ZodTypeDef, any>>;
export declare const SchemaAssetMetaResult: z.ZodNullable<z.ZodType<any, z.ZodTypeDef, any>>;
export declare const SchemaCreateMapResult: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
export declare const SchemaAssetInfosResult: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
export declare const SchemaAssetDBInfosResult: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    target: z.ZodString;
    library: z.ZodString;
    temp: z.ZodString;
    state: z.ZodEnum<["none", "start", "startup", "refresh"]>;
    visible: z.ZodBoolean;
    preImportExtList: z.ZodArray<z.ZodString, "many">;
    readonly: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    temp: string;
    target: string;
    name: string;
    visible: boolean;
    library: string;
    state: "start" | "none" | "startup" | "refresh";
    preImportExtList: string[];
    readonly?: boolean | undefined;
}, {
    temp: string;
    target: string;
    name: string;
    visible: boolean;
    library: string;
    state: "start" | "none" | "startup" | "refresh";
    preImportExtList: string[];
    readonly?: boolean | undefined;
}>, "many">;
export declare const SchemaCreatedAssetResult: z.ZodNullable<z.ZodType<any, z.ZodTypeDef, any>>;
export declare const SchemaImportedAssetResult: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
export declare const SchemaReimportResult: z.ZodNullable<z.ZodType<any, z.ZodTypeDef, any>>;
export declare const SchemaSaveAssetResult: z.ZodNullable<z.ZodType<any, z.ZodTypeDef, any>>;
export declare const SchemaSerializedAssetResult: z.ZodNullable<z.ZodObject<{
    uuid: z.ZodString;
    url: z.ZodString;
    type: z.ZodString;
    importer: z.ZodString;
    dump: z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>, z.ZodType<any, z.ZodTypeDef, any>]>;
}, "strip", z.ZodTypeAny, {
    type: string;
    url: string;
    uuid: string;
    importer: string;
    dump?: any;
}, {
    type: string;
    url: string;
    uuid: string;
    importer: string;
    dump?: any;
}>>;
export declare const SchemaMaterialEffectsResult: z.ZodRecord<z.ZodString, z.ZodObject<{
    uuid: z.ZodString;
    name: z.ZodString;
    hideInEditor: z.ZodOptional<z.ZodBoolean>;
    assetPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    uuid: string;
    assetPath: string;
    hideInEditor?: boolean | undefined;
}, {
    name: string;
    uuid: string;
    assetPath: string;
    hideInEditor?: boolean | undefined;
}>>;
export declare const SchemaMaterialEffectResult: z.ZodArray<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    passes: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
        phase: z.ZodOptional<z.ZodString>;
        switch: z.ZodOptional<z.ZodType<any, z.ZodTypeDef, any>>;
        propertyIndex: z.ZodType<any, z.ZodTypeDef, any>;
        props: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
        defines: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
        states: z.ZodType<any, z.ZodTypeDef, any>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }, {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    passes: {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }[];
    name?: string | undefined;
}, {
    passes: {
        index: number;
        props: any[];
        defines: any[];
        name?: string | undefined;
        switch?: any;
        phase?: string | undefined;
        propertyIndex?: any;
        states?: any;
    }[];
    name?: string | undefined;
}>, "many">;
export declare const SchemaMaterialResult: z.ZodObject<{
    effect: z.ZodString;
    technique: z.ZodNumber;
    data: z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        passes: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
            phase: z.ZodOptional<z.ZodString>;
            switch: z.ZodOptional<z.ZodType<any, z.ZodTypeDef, any>>;
            propertyIndex: z.ZodType<any, z.ZodTypeDef, any>;
            props: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
            defines: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
            states: z.ZodType<any, z.ZodTypeDef, any>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }, {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }, {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    effect: string;
    data: {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }[];
    technique: number;
}, {
    effect: string;
    data: {
        passes: {
            index: number;
            props: any[];
            defines: any[];
            name?: string | undefined;
            switch?: any;
            phase?: string | undefined;
            propertyIndex?: any;
            states?: any;
        }[];
        name?: string | undefined;
    }[];
    technique: number;
}>;
export declare const SchemaRefreshDirResult: z.ZodNull;
export declare const SchemaUUIDResult: z.ZodNullable<z.ZodString>;
export declare const SchemaPathResult: z.ZodNullable<z.ZodString>;
export declare const SchemaUrlResult: z.ZodNullable<z.ZodString>;
export declare const SchemaAnimationMaskJoint: z.ZodType<any>;
export declare const SchemaAnimationMaskDump: z.ZodObject<{
    version: z.ZodLiteral<1>;
    assetUuid: z.ZodString;
    joints: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
}, "strip", z.ZodTypeAny, {
    version: 1;
    assetUuid: string;
    joints: any[];
}, {
    version: 1;
    assetUuid: string;
    joints: any[];
}>;
export declare const SchemaAnimationMaskChanges: z.ZodArray<z.ZodObject<{
    path: z.ZodString;
    enabled: z.ZodBoolean;
    recursive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    path: string;
    recursive?: boolean | undefined;
}, {
    enabled: boolean;
    path: string;
    recursive?: boolean | undefined;
}>, "many">;
export declare const SchemaVoidResult: z.ZodNull;
export declare const SchemaQueryAssetType: z.ZodEnum<["asset", "script", "all"]>;
export declare const SchemaFilterPluginOptions: z.ZodOptional<z.ZodObject<{
    loadPluginInEditor: z.ZodOptional<z.ZodBoolean>;
    loadPluginInWeb: z.ZodOptional<z.ZodBoolean>;
    loadPluginInNative: z.ZodOptional<z.ZodBoolean>;
    loadPluginInMiniGame: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    loadPluginInEditor?: boolean | undefined;
    loadPluginInWeb?: boolean | undefined;
    loadPluginInNative?: boolean | undefined;
    loadPluginInMiniGame?: boolean | undefined;
}, {
    loadPluginInEditor?: boolean | undefined;
    loadPluginInWeb?: boolean | undefined;
    loadPluginInNative?: boolean | undefined;
    loadPluginInMiniGame?: boolean | undefined;
}>>;
export declare const SchemaPluginScriptInfo: z.ZodObject<{
    uuid: z.ZodString;
    file: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    file: string;
    uuid: string;
}, {
    url: string;
    file: string;
    uuid: string;
}>;
export declare const SchemaAssetMoveOptions: z.ZodOptional<z.ZodObject<{
    overwrite: z.ZodOptional<z.ZodBoolean>;
    rename: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    overwrite?: boolean | undefined;
    rename?: boolean | undefined;
}, {
    overwrite?: boolean | undefined;
    rename?: boolean | undefined;
}>>;
export declare const SchemaAssetRenameOptions: z.ZodOptional<z.ZodObject<{
    overwrite: z.ZodOptional<z.ZodBoolean>;
    rename: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    overwrite?: boolean | undefined;
    rename?: boolean | undefined;
}, {
    overwrite?: boolean | undefined;
    rename?: boolean | undefined;
}>>;
export declare const SchemaUpdateUserDataOptions: z.ZodObject<{
    handler: z.ZodString;
    key: z.ZodString;
    value: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    key: string;
    handler: string;
    value?: any;
}, {
    key: string;
    handler: string;
    value?: any;
}>;
export declare const SchemaUserDataHandler: z.ZodString;
export type TDirOrDbPath = z.infer<typeof SchemaDirOrDbPath>;
export type TBaseName = z.infer<typeof SchemaBaseName>;
export type TDbDirResult = z.infer<typeof SchemaDbDirResult>;
export type TUrlOrUUIDOrPath = z.infer<typeof SchemaUrlOrUUIDOrPath>;
export type TSaveAssetPath = z.infer<typeof SchemaSaveAssetPath>;
export type TUUIDOrPath = z.infer<typeof SchemaUUIDOrPath>;
export type TUrlOrUUID = z.infer<typeof SchemaUrlOrUUID>;
export type TUrlOrPath = z.infer<typeof SchemaUrlOrPath>;
export type TDataKeys = z.infer<typeof SchemaDataKeys>;
export type TQueryAssetsOption = z.infer<typeof SchemaQueryAssetsOption> | undefined;
export type TSupportCreateType = z.infer<typeof SchemaSupportCreateType>;
export type TTargetPath = z.infer<typeof SchemaTargetPath>;
export type TAssetNewName = z.infer<typeof SchemaAssetNewName>;
export type TAssetOperationOption = z.infer<typeof SchemaAssetOperationOption> | undefined;
export type TSourcePath = z.infer<typeof SchemaSourcePath>;
export type TAssetData = z.infer<typeof SchemaAssetData>;
export type TSerializedAssetPatch = z.infer<typeof SchemaSerializedAssetPatch>;
export type TMaterialEffectNameOrUuid = z.infer<typeof SchemaMaterialEffectNameOrUuid>;
export type TMaterialDump = z.infer<typeof SchemaMaterialDump>;
export type TAssetInfoResult = z.infer<typeof SchemaAssetInfoResult>;
export type TAssetMetaResult = z.infer<typeof SchemaAssetMetaResult>;
export type TCreateMapResult = z.infer<typeof SchemaCreateMapResult>;
export type TAssetInfosResult = z.infer<typeof SchemaAssetInfosResult>;
export type TAssetDBInfosResult = z.infer<typeof SchemaAssetDBInfosResult>;
export type TCreatedAssetResult = z.infer<typeof SchemaCreatedAssetResult>;
export type TCreateAssetByTypeOptions = z.infer<typeof SchemaCreateAssetByTypeOptions>;
export type TCreateAssetOptions = z.infer<typeof SchemaCreateAssetOptions>;
export type TImportedAssetResult = z.infer<typeof SchemaImportedAssetResult>;
export type TReimportResult = z.infer<typeof SchemaAssetInfoResult>;
export type TSaveAssetResult = z.infer<typeof SchemaSaveAssetResult>;
export type TSerializedAssetResult = z.infer<typeof SchemaSerializedAssetResult>;
export type TMaterialEffectsResult = z.infer<typeof SchemaMaterialEffectsResult>;
export type TMaterialEffectResult = z.infer<typeof SchemaMaterialEffectResult>;
export type TMaterialResult = z.infer<typeof SchemaMaterialResult>;
export type TRefreshDirResult = z.infer<typeof SchemaRefreshDirResult>;
export type TUUIDResult = z.infer<typeof SchemaUUIDResult>;
export type TPathResult = z.infer<typeof SchemaPathResult>;
export type TUrlResult = z.infer<typeof SchemaUrlResult>;
export type TAnimationMaskDump = z.infer<typeof SchemaAnimationMaskDump>;
export type TAnimationMaskChanges = z.infer<typeof SchemaAnimationMaskChanges>;
export type TVoidResult = z.infer<typeof SchemaVoidResult>;
export type TQueryAssetType = z.infer<typeof SchemaQueryAssetType>;
export type TFilterPluginOptions = z.infer<typeof SchemaFilterPluginOptions>;
export type TPluginScriptInfo = z.infer<typeof SchemaPluginScriptInfo>;
export type TAssetMoveOptions = z.infer<typeof SchemaAssetMoveOptions>;
export type TAssetRenameOptions = z.infer<typeof SchemaAssetRenameOptions>;
export type TUpdateUserDataOptions = z.infer<typeof SchemaUpdateUserDataOptions>;
export type TUserDataHandler = z.infer<typeof SchemaUserDataHandler>;
export declare const SchemaUpdateAssetUserData: z.ZodRecord<z.ZodString, z.ZodAny>;
export type TUpdateAssetUserData = z.infer<typeof SchemaUpdateAssetUserData>;
export declare const SchemaUpdateAssetUserDataPath: z.ZodString;
export type TUpdateAssetUserDataPath = z.infer<typeof SchemaUpdateAssetUserDataPath>;
export declare const SchemaUpdateAssetUserDataValue: z.ZodAny;
export type TUpdateAssetUserDataValue = z.infer<typeof SchemaUpdateAssetUserDataValue>;
export declare const SchemaUpdateAssetUserDataResult: z.ZodAny;
export type TUpdateAssetUserDataResult = z.infer<typeof SchemaUpdateAssetUserDataResult>;
export declare const SchemaAssetConfig: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    docURL: z.ZodOptional<z.ZodString>;
    userDataConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    displayName?: string | undefined;
    docURL?: string | undefined;
    userDataConfig?: Record<string, any> | undefined;
}, {
    description?: string | undefined;
    displayName?: string | undefined;
    docURL?: string | undefined;
    userDataConfig?: Record<string, any> | undefined;
}>;
export declare const SchemaAssetConfigMapResult: z.ZodRecord<z.ZodString, z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    docURL: z.ZodOptional<z.ZodString>;
    userDataConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    displayName?: string | undefined;
    docURL?: string | undefined;
    userDataConfig?: Record<string, any> | undefined;
}, {
    description?: string | undefined;
    displayName?: string | undefined;
    docURL?: string | undefined;
    userDataConfig?: Record<string, any> | undefined;
}>>;
export type TAssetConfigMapResult = z.infer<typeof SchemaAssetConfigMapResult>;
export declare const SchemaAssetPropertySchema: z.ZodType<any>;
export declare const SchemaAssetPropertySchemaResult: z.ZodRecord<z.ZodString, z.ZodType<any, z.ZodTypeDef, any>>;
export type TAssetPropertySchemaResult = z.infer<typeof SchemaAssetPropertySchemaResult>;
export declare const SchemaAnimationGraphVariantDump: z.ZodObject<{
    graphUuid: z.ZodNullable<z.ZodString>;
    clips: z.ZodRecord<z.ZodString, z.ZodString>;
    invalids: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    graphUuid: string | null;
    clips: Record<string, string>;
    invalids?: Record<string, string> | undefined;
}, {
    graphUuid: string | null;
    clips: Record<string, string>;
    invalids?: Record<string, string> | undefined;
}>;
export declare const SchemaAnimationGraphVariantResult: z.ZodObject<{
    graphUuid: z.ZodNullable<z.ZodString>;
    clips: z.ZodRecord<z.ZodString, z.ZodString>;
    invalids: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    graphUuid: string | null;
    clips: Record<string, string>;
    invalids?: Record<string, string> | undefined;
}, {
    graphUuid: string | null;
    clips: Record<string, string>;
    invalids?: Record<string, string> | undefined;
}>;
export declare const SchemaAnimationGraphVariantSaveResult: z.ZodNull;
export type TAnimationGraphVariantDump = z.infer<typeof SchemaAnimationGraphVariantDump>;
export type TAnimationGraphVariantResult = z.infer<typeof SchemaAnimationGraphVariantResult>;
export type TAnimationGraphVariantSaveResult = z.infer<typeof SchemaAnimationGraphVariantSaveResult>;
