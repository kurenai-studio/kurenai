/**
 * 初始化引擎加载器。预先引擎模块，并将其映射为在编辑器内可用的 CommonJS 模块。
 * @param options 选项。
 */
declare function preload(options: {
    /**
     * 引擎根目录
     */
    engineRoot: string;
    /**
     * 引擎分发目录（引擎编译后的目录）
     */
    engineDev: string;
    /**
     * 引擎可写目录
     */
    writablePath: string;
    /**
     * 需要预加载的模块。
     */
    requiredModules: string[];
}): Promise<void>;
export default preload;
/**
 * 动态加载指定模块。应确保引擎加载器已经初始化过。
 * @param id 引擎模块 ID。
 * @returns 引擎模块。
 */
export declare function loadDynamic(id: string): Promise<unknown>;
