/**
 * Generate a stable identity key for an absolute filesystem path.
 * Non-path values such as UUIDs and db:// URLs are returned unchanged.
 */
export declare function toPathKey(value: string): string;
/**
 * Resolve the casing currently stored on disk for a path inside a known root.
 * The configured root casing is preserved because Windows drive letters do not
 * have a filesystem-provided canonical representation.
 */
export declare function resolveRealPathCase(value: string, root: string): string;
export declare function isSamePath(left: string, right: string): boolean;
export declare function isSubPath(candidate: string, root: string): boolean;
export declare class PathCaseConflictError extends Error {
    readonly code = "ASSET_DB_PATH_CASE_CONFLICT";
    readonly paths: readonly [string, string];
    constructor(existingPath: string, incomingPath: string);
}
export declare class PathMap<Value> extends Map<string, Value> {
    private readonly keyIndex;
    constructor(entries?: readonly (readonly [string, Value])[] | null);
    getStoredKey(key: string): string | undefined;
    has(key: string): boolean;
    get(key: string): Value | undefined;
    set(key: string, value: Value): this;
    delete(key: string): boolean;
    clear(): void;
}
export declare class PathSet extends Set<string> {
    private readonly valueIndex;
    constructor(values?: readonly string[] | null);
    getStoredValue(value: string): string | undefined;
    has(value: string): boolean;
    add(value: string): this;
    delete(value: string): boolean;
    clear(): void;
}
export type PathRecord<Value> = {
    [path: string]: Value;
};
/**
 * Create an object-compatible path dictionary. Bracket access and Object.keys()
 * remain available while absolute Windows path lookups become case-insensitive.
 */
export declare function createPathRecord<Value>(): PathRecord<Value>;
export declare function getPathRecordStoredKey<Value>(record: PathRecord<Value>, key: string): string | undefined;
export declare function replacePathRecordKey<Value>(record: PathRecord<Value>, oldKey: string, newKey: string): boolean;
export declare function getMapStoredPathKey<Value>(map: Map<string, Value>, key: string): string | undefined;
export declare function getSetStoredPathValue(set: Set<string>, value: string): string | undefined;
export declare function findPathAwareIndex(values: readonly string[], value: string): number;
export declare function assertNoPathIdentityConflicts(paths: readonly string[]): void;
