/// <reference types="node" />
import { IAssetDeleteOptions, IAssetFileStat, IAssetFileSystemProvider, IAssetOperationContext, IAssetOperationKind, IAssetOperationOrigin, IAssetRenameOptions, IAssetWriteFileOptions } from './provider';
export declare function getFileSystemProvider(): IAssetFileSystemProvider;
export declare function setFileSystemProvider(nextProvider: IAssetFileSystemProvider): void;
export declare function resetFileSystemProvider(): void;
export declare function resetOperationContexts(): void;
export declare function peekOperationContext(path: string): IAssetOperationContext | undefined;
export declare function takeOperationContext(path: string): IAssetOperationContext | undefined;
export declare function resolveOperationContext(path: string, kind: IAssetOperationKind, source?: string): IAssetOperationContext;
export declare function fsExists(path: string): Promise<boolean>;
export declare function fsStat(path: string): Promise<IAssetFileStat>;
export declare function fsReadFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
export declare function fsWriteFile(path: string, content: Buffer | string | Uint8Array, options?: IAssetWriteFileOptions): Promise<void>;
export declare function fsCreateDirectory(path: string): Promise<void>;
export declare function fsDelete(path: string, options?: IAssetDeleteOptions): Promise<void>;
export declare function fsRename(oldPath: string, newPath: string, options?: IAssetRenameOptions): Promise<void>;
export declare function fsCopy(sourcePath: string, destinationPath: string, options?: IAssetRenameOptions): Promise<void>;
export type { IAssetDeleteOptions, IAssetFileStat, IAssetFileSystemProvider, IAssetOperationContext, IAssetOperationKind, IAssetOperationOrigin, IAssetRenameOptions, IAssetWriteFileOptions, };
