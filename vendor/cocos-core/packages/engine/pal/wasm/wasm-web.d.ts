export declare function instantiateWasm(wasmUrl: string, importObject: WebAssembly.Imports): Promise<any>;
export declare function fetchBuffer(binaryUrl: string): Promise<ArrayBuffer>;
/**
 * @en Translate virtual addresses within the engine to actual addresses of paths, such as external:emscripten/webgpu/glslang.wasm
 * @zh 把引擎内部的虚拟地址转为路径的实际地址，如external:emscripten/webgpu/glslang.wasm
 */
export declare function fetchUrl(binaryUrl: string): Promise<string>;
export declare function ensureWasmModuleReady(): Promise<void>;
