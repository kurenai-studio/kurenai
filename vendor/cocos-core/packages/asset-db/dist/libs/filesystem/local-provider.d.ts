/// <reference types="node" />
/// <reference types="node" />
import { IAssetDeleteOptions, IAssetFileSystemProvider, IAssetRenameOptions, IAssetWriteFileOptions } from './provider';
export declare class LocalAssetFileSystemProvider implements IAssetFileSystemProvider {
    exists(path: string): boolean;
    stat(path: string): Promise<import("fs").Stats>;
    readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
    writeFile(path: string, content: Buffer | string | Uint8Array, _options?: IAssetWriteFileOptions): Promise<void>;
    createDirectory(path: string): Promise<void>;
    delete(path: string, _options?: IAssetDeleteOptions): Promise<void>;
    rename(oldPath: string, newPath: string, options?: IAssetRenameOptions): Promise<void>;
    copy(sourcePath: string, destinationPath: string, options?: IAssetRenameOptions): Promise<void>;
}
