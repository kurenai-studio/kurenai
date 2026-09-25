/**
 * 将命令行参数解析为键值对对象
 * 支持形式：
 *   --key=value
 *   --flag （没有等号的参数会被解析为 undefined）
 *
 * @param argv - 命令行参数数组，通常为 process.argv
 * @returns 解析后的参数对象，键为参数名，值为对应值
 */
export declare function parseCommandLineArgs(argv: string[]): Record<string, string | undefined>;
export declare function resolveSceneAssetBase(serverURL: string | undefined, libraryPath: string): string;
