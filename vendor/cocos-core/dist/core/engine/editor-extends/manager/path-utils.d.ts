/**
 * Generate a unique name: returns the original if no conflict, appends _001, _002, ... suffix if duplicate.
 * @param baseName - base name
 * @param existingCount - number of existing same-name entries (0 means no conflict)
 */
export declare function formatUniqueName(baseName: string, existingCount: number): string;
/**
 * Characters not allowed in node names. These have special meaning in file system paths
 * or node path separators and cause path resolution ambiguity
 * (e.g. '/' conflicts with path separator, ':' is illegal in Windows paths).
 */
export declare const ILLEGAL_NAME_CHARS: RegExp;
/**
 * Validate whether a node name is legal.
 * @returns error description if invalid, null if valid
 */
export declare function validateNodeName(name: string): string | null;
/**
 * Replace illegal characters in a name with '_'.
 * Only for internal NodePathManager fallback; external entry points should reject via validateNodeName.
 */
export declare function sanitizeNodeName(name: string): string;
/**
 * Remove leading '/' from a path. Indexed paths never start with '/',
 * but callers may spell them either way ('/Canvas' and 'Canvas' are the same node).
 */
export declare function stripLeadingSlashes(path: string): string;
/**
 * Normalize a node path for lookup: strips leading '/', and keeps a path made of
 * slashes only as '/', which denotes the root instead of an empty path.
 */
export declare function normalizeNodePath(path: string): string;
/**
 * Whether a path denotes the root ('/', '//', ...). An empty path is not a root path.
 */
export declare function isRootNodePath(path: string | undefined): boolean;
