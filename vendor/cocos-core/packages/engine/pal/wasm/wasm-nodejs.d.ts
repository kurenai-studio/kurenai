export declare function instantiateWasm(wasmUrl: string, importObject: WebAssembly.Imports): Promise<any>;
export declare function fetchBuffer(binaryUrl: string): Promise<ArrayBuffer>;
export declare function fetchUrl(binaryUrl: string): Promise<string>;
export declare function ensureWasmModuleReady(): Promise<void>;
