import { CommonResultType } from '../base/schema-base';
import { TBuildOption, TPlatform, TBuildDest, TPlatformCanMake, IRunResultData, IUploadResultData, IPublishResultData, TUploadAccessToken, TBuildTemplateName, TCreateBuildTemplateResult } from './schema';
export declare class BuilderApi {
    build(platform: TPlatform, options?: TBuildOption): Promise<CommonResultType<{
        code: number;
        custom?: {
            previewUrl?: string | undefined;
            nativePrjDir?: string | undefined;
        } | undefined;
        reason?: string | undefined;
        dest?: string | undefined;
    } | null>>;
    queryDefaultBuildConfig(platform: TPlatform): Promise<CommonResultType<{
        platform: "web-desktop";
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        packages?: {
            'web-desktop': {
                appid?: string | undefined;
                versionName?: string | undefined;
                uploadEnv?: "dev" | "fat" | "prod" | undefined;
                accessToken?: string | undefined;
                codeVersion?: string | undefined;
                app_id?: string | undefined;
                bridgeLink?: string | undefined;
                bridgeBuildToken?: string | undefined;
                entryPath?: string | undefined;
                encryptKey?: string | undefined;
                useWebGPU?: boolean | undefined;
                resolution?: {
                    designHeight: number;
                    designWidth: number;
                } | undefined;
            } & {
                [k: string]: any;
            };
        } | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "web-mobile";
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        packages?: {
            'web-mobile': {
                appid?: string | undefined;
                versionName?: string | undefined;
                uploadEnv?: "dev" | "fat" | "prod" | undefined;
                accessToken?: string | undefined;
                codeVersion?: string | undefined;
                app_id?: string | undefined;
                bridgeLink?: string | undefined;
                bridgeBuildToken?: string | undefined;
                entryPath?: string | undefined;
                encryptKey?: string | undefined;
                useWebGPU?: boolean | undefined;
                orientation?: "auto" | "landscape" | "portrait" | undefined;
                embedWebDebugger?: boolean | undefined;
            } & {
                [k: string]: any;
            };
        } | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "windows";
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "ios";
        packages: {
            ios?: import("zod").objectOutputType<{
                packageName: import("zod").ZodString;
                osTarget: import("zod").ZodOptional<import("zod").ZodObject<{
                    iphoneos: import("zod").ZodOptional<import("zod").ZodBoolean>;
                    simulator: import("zod").ZodOptional<import("zod").ZodBoolean>;
                }, "strip", import("zod").ZodTypeAny, {
                    iphoneos?: boolean | undefined;
                    simulator?: boolean | undefined;
                }, {
                    iphoneos?: boolean | undefined;
                    simulator?: boolean | undefined;
                }>>;
                targetVersion: import("zod").ZodOptional<import("zod").ZodString>;
                developerTeam: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod").ZodAny, "strip"> | undefined;
        };
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "android";
        packages: {
            android?: import("zod").objectOutputType<{
                packageName: import("zod").ZodString;
                keystorePath: import("zod").ZodOptional<import("zod").ZodString>;
                keystorePassword: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod").ZodAny, "strip"> | undefined;
        };
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "mac";
        packages: {
            mac?: import("zod").objectOutputType<{
                packageName: import("zod").ZodString;
            }, import("zod").ZodAny, "strip"> | undefined;
        };
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "ohos";
        packages: {
            ohos?: import("zod").objectOutputType<{
                packageName: import("zod").ZodString;
            }, import("zod").ZodAny, "strip"> | undefined;
        };
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "harmonyos-next";
        packages: {
            'harmonyos-next'?: import("zod").objectOutputType<{
                packageName: import("zod").ZodString;
            }, import("zod").ZodAny, "strip"> | undefined;
        };
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "google-play";
        packages: {
            'google-play'?: import("zod").objectOutputType<{
                packageName: import("zod").ZodString;
            }, import("zod").ZodAny, "strip"> | undefined;
        };
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        platform: "huawei-agc";
        debug?: boolean | undefined;
        name?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        packages?: {
            'huawei-agc'?: import("zod").objectOutputType<{
                serviceConfigPath: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod").ZodAny, "strip"> | undefined;
        } | undefined;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | {
        debug?: boolean | undefined;
        name?: string | undefined;
        platform?: string | undefined;
        useCacheConfig?: {
            engine?: boolean | undefined;
            serializeData?: boolean | undefined;
            textureCompress?: boolean | undefined;
            autoAtlas?: boolean | undefined;
        } | undefined;
        outputName?: string | undefined;
        buildPath?: string | undefined;
        scenes?: {
            url: string;
            uuid: string;
        }[] | undefined;
        skipCompressTexture?: boolean | undefined;
        packAutoAtlas?: boolean | undefined;
        sourceMaps?: boolean | "inline" | undefined;
        experimentalEraseModules?: boolean | undefined;
        bundleCommonChunk?: boolean | undefined;
        startScene?: string | undefined;
        mangleProperties?: boolean | undefined;
        inlineEnum?: boolean | undefined;
        md5Cache?: boolean | undefined;
        polyfills?: {
            targets?: string | undefined;
            asyncFunctions?: boolean | undefined;
            coreJs?: boolean | undefined;
        } | undefined;
        buildScriptTargets?: string | undefined;
        mainBundleCompressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
        mainBundleIsRemote?: boolean | undefined;
        server?: string | undefined;
        startSceneAssetBundle?: boolean | undefined;
        moveRemoteBundleScript?: boolean | undefined;
        useSplashScreen?: boolean | undefined;
        nextStages?: ("make" | "run" | "upload" | "publish")[] | undefined;
        packages?: any;
        nativeCodeBundleMode?: "wasm" | "asmjs" | "both" | undefined;
        bundleConfigs?: {
            name: string;
            root: string;
            compressionType?: "none" | "merge_dep" | "merge_all_json" | "subpackage" | "zip" | undefined;
            isRemote?: boolean | undefined;
            output?: boolean | undefined;
            priority?: number | undefined;
            dest?: string | undefined;
            scriptDest?: string | undefined;
        }[] | undefined;
    } | null>>;
    createBuildTemplate(nameOrPlatform: TBuildTemplateName): Promise<CommonResultType<TCreateBuildTemplateResult>>;
    make(platform: TPlatformCanMake, dest: TBuildDest): Promise<CommonResultType<{
        code: number;
        custom?: import("zod").objectOutputType<{
            nativePrjDir: import("zod").ZodOptional<import("zod").ZodString>;
            executableFile: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod").ZodTypeAny, "passthrough"> | undefined;
        reason?: string | undefined;
        dest?: string | undefined;
    } | null>>;
    run(platform: TPlatform, dest: TBuildDest): Promise<CommonResultType<IRunResultData>>;
    upload(platform: TPlatform, dest: TBuildDest, accessToken?: TUploadAccessToken): Promise<CommonResultType<IUploadResultData>>;
    publish(platform: TPlatform, dest: TBuildDest): Promise<CommonResultType<IPublishResultData>>;
}
