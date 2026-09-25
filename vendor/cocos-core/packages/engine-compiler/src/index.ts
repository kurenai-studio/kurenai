import { EngineCompiler } from './core/compiler';

/**
 * 根据路径编译引擎
 * @param path
 * @param outDirName
 */
export async function compileEngine(enginePath: string, isWeb?: boolean) {
    const compiler = EngineCompiler.create(enginePath, isWeb);
    await compiler.clear();
    await compiler.compileEngine(enginePath, true);
}
