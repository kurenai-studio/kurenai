import { IBuildSeparateEngineCacheOptions, IBuildSeparateEngineOptions, IBuildSeparateEngineResult, IEngineCachePaths } from '../../../../@types/private';
declare class EngineCachePaths implements IEngineCachePaths {
    dir: string;
    all: string;
    plugin: string;
    meta: string;
    signatureJSON: string;
    pluginJSON: string;
    constructor(dir: string, pluginName: string);
    toJSON(): {
        dir: string;
        all: string;
        plugin: string;
        meta: string;
        signatureJSON: string;
        pluginJSON: string;
    };
}
/**
 * 根据选项编译分离引擎，并返回 importMap 信息
 * @param options
 */
export declare function buildSeparateEngine(options: IBuildSeparateEngineOptions): Promise<IBuildSeparateEngineResult>;
/**
 * 编译引擎分离插件到缓存目录下(命令行会调用)
 */
export declare function buildCocos(options: IBuildSeparateEngineCacheOptions): Promise<EngineCachePaths>;
export {};
