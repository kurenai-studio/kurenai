"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ILLEGAL_NAME_CHARS = void 0;
exports.formatUniqueName = formatUniqueName;
exports.validateNodeName = validateNodeName;
exports.sanitizeNodeName = sanitizeNodeName;
exports.stripLeadingSlashes = stripLeadingSlashes;
exports.normalizeNodePath = normalizeNodePath;
exports.isRootNodePath = isRootNodePath;
/**
 * Generate a unique name: returns the original if no conflict, appends _001, _002, ... suffix if duplicate.
 * @param baseName - base name
 * @param existingCount - number of existing same-name entries (0 means no conflict)
 */
function formatUniqueName(baseName, existingCount) {
    if (existingCount <= 0) {
        return baseName;
    }
    return `${baseName}_${String(existingCount).padStart(3, '0')}`;
}
/**
 * Characters not allowed in node names. These have special meaning in file system paths
 * or node path separators and cause path resolution ambiguity
 * (e.g. '/' conflicts with path separator, ':' is illegal in Windows paths).
 */
exports.ILLEGAL_NAME_CHARS = /[/\\:*?"<>|]/;
/**
 * Validate whether a node name is legal.
 * @returns error description if invalid, null if valid
 */
function validateNodeName(name) {
    const match = name.match(exports.ILLEGAL_NAME_CHARS);
    if (match) {
        return `Node name "${name}" contains illegal character '${match[0]}'. Characters /\\:*?"<>| are not allowed.`;
    }
    return null;
}
/**
 * Replace illegal characters in a name with '_'.
 * Only for internal NodePathManager fallback; external entry points should reject via validateNodeName.
 */
function sanitizeNodeName(name) {
    return name.replace(/[/\\:*?"<>|]/g, '_');
}
/**
 * Remove leading '/' from a path. Indexed paths never start with '/',
 * but callers may spell them either way ('/Canvas' and 'Canvas' are the same node).
 */
function stripLeadingSlashes(path) {
    return path.replace(/^\/+/, '');
}
/**
 * Normalize a node path for lookup: strips leading '/', and keeps a path made of
 * slashes only as '/', which denotes the root instead of an empty path.
 */
function normalizeNodePath(path) {
    if (!path) {
        return path;
    }
    const stripped = stripLeadingSlashes(path);
    return stripped === '' ? '/' : stripped;
}
/**
 * Whether a path denotes the root ('/', '//', ...). An empty path is not a root path.
 */
function isRootNodePath(path) {
    return !!path && stripLeadingSlashes(path) === '';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9tYW5hZ2VyL3BhdGgtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0EsNENBS0M7QUFhRCw0Q0FNQztBQU1ELDRDQUVDO0FBTUQsa0RBRUM7QUFNRCw4Q0FNQztBQUtELHdDQUVDO0FBaEVEOzs7O0dBSUc7QUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxRQUFnQixFQUFFLGFBQXFCO0lBQ3BFLElBQUksYUFBYSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3JCLE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFDRCxPQUFPLEdBQUcsUUFBUSxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDbkUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDVSxRQUFBLGtCQUFrQixHQUFHLGNBQWMsQ0FBQztBQUVqRDs7O0dBR0c7QUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxJQUFZO0lBQ3pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQWtCLENBQUMsQ0FBQztJQUM3QyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1IsT0FBTyxjQUFjLElBQUksaUNBQWlDLEtBQUssQ0FBQyxDQUFDLENBQUMsMkNBQTJDLENBQUM7SUFDbEgsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxJQUFZO0lBQ3pDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLG1CQUFtQixDQUFDLElBQVk7SUFDNUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtJQUMxQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDUixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0MsT0FBTyxRQUFRLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUM1QyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixjQUFjLENBQUMsSUFBd0I7SUFDbkQsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN0RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZW5lcmF0ZSBhIHVuaXF1ZSBuYW1lOiByZXR1cm5zIHRoZSBvcmlnaW5hbCBpZiBubyBjb25mbGljdCwgYXBwZW5kcyBfMDAxLCBfMDAyLCAuLi4gc3VmZml4IGlmIGR1cGxpY2F0ZS5cbiAqIEBwYXJhbSBiYXNlTmFtZSAtIGJhc2UgbmFtZVxuICogQHBhcmFtIGV4aXN0aW5nQ291bnQgLSBudW1iZXIgb2YgZXhpc3Rpbmcgc2FtZS1uYW1lIGVudHJpZXMgKDAgbWVhbnMgbm8gY29uZmxpY3QpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRVbmlxdWVOYW1lKGJhc2VOYW1lOiBzdHJpbmcsIGV4aXN0aW5nQ291bnQ6IG51bWJlcik6IHN0cmluZyB7XG4gICAgaWYgKGV4aXN0aW5nQ291bnQgPD0gMCkge1xuICAgICAgICByZXR1cm4gYmFzZU5hbWU7XG4gICAgfVxuICAgIHJldHVybiBgJHtiYXNlTmFtZX1fJHtTdHJpbmcoZXhpc3RpbmdDb3VudCkucGFkU3RhcnQoMywgJzAnKX1gO1xufVxuXG4vKipcbiAqIENoYXJhY3RlcnMgbm90IGFsbG93ZWQgaW4gbm9kZSBuYW1lcy4gVGhlc2UgaGF2ZSBzcGVjaWFsIG1lYW5pbmcgaW4gZmlsZSBzeXN0ZW0gcGF0aHNcbiAqIG9yIG5vZGUgcGF0aCBzZXBhcmF0b3JzIGFuZCBjYXVzZSBwYXRoIHJlc29sdXRpb24gYW1iaWd1aXR5XG4gKiAoZS5nLiAnLycgY29uZmxpY3RzIHdpdGggcGF0aCBzZXBhcmF0b3IsICc6JyBpcyBpbGxlZ2FsIGluIFdpbmRvd3MgcGF0aHMpLlxuICovXG5leHBvcnQgY29uc3QgSUxMRUdBTF9OQU1FX0NIQVJTID0gL1svXFxcXDoqP1wiPD58XS87XG5cbi8qKlxuICogVmFsaWRhdGUgd2hldGhlciBhIG5vZGUgbmFtZSBpcyBsZWdhbC5cbiAqIEByZXR1cm5zIGVycm9yIGRlc2NyaXB0aW9uIGlmIGludmFsaWQsIG51bGwgaWYgdmFsaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTm9kZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKElMTEVHQUxfTkFNRV9DSEFSUyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBgTm9kZSBuYW1lIFwiJHtuYW1lfVwiIGNvbnRhaW5zIGlsbGVnYWwgY2hhcmFjdGVyICcke21hdGNoWzBdfScuIENoYXJhY3RlcnMgL1xcXFw6Kj9cIjw+fCBhcmUgbm90IGFsbG93ZWQuYDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmVwbGFjZSBpbGxlZ2FsIGNoYXJhY3RlcnMgaW4gYSBuYW1lIHdpdGggJ18nLlxuICogT25seSBmb3IgaW50ZXJuYWwgTm9kZVBhdGhNYW5hZ2VyIGZhbGxiYWNrOyBleHRlcm5hbCBlbnRyeSBwb2ludHMgc2hvdWxkIHJlamVjdCB2aWEgdmFsaWRhdGVOb2RlTmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplTm9kZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKC9bL1xcXFw6Kj9cIjw+fF0vZywgJ18nKTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgbGVhZGluZyAnLycgZnJvbSBhIHBhdGguIEluZGV4ZWQgcGF0aHMgbmV2ZXIgc3RhcnQgd2l0aCAnLycsXG4gKiBidXQgY2FsbGVycyBtYXkgc3BlbGwgdGhlbSBlaXRoZXIgd2F5ICgnL0NhbnZhcycgYW5kICdDYW52YXMnIGFyZSB0aGUgc2FtZSBub2RlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwTGVhZGluZ1NsYXNoZXMocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcGF0aC5yZXBsYWNlKC9eXFwvKy8sICcnKTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgYSBub2RlIHBhdGggZm9yIGxvb2t1cDogc3RyaXBzIGxlYWRpbmcgJy8nLCBhbmQga2VlcHMgYSBwYXRoIG1hZGUgb2ZcbiAqIHNsYXNoZXMgb25seSBhcyAnLycsIHdoaWNoIGRlbm90ZXMgdGhlIHJvb3QgaW5zdGVhZCBvZiBhbiBlbXB0eSBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplTm9kZVBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICAgIGNvbnN0IHN0cmlwcGVkID0gc3RyaXBMZWFkaW5nU2xhc2hlcyhwYXRoKTtcbiAgICByZXR1cm4gc3RyaXBwZWQgPT09ICcnID8gJy8nIDogc3RyaXBwZWQ7XG59XG5cbi8qKlxuICogV2hldGhlciBhIHBhdGggZGVub3RlcyB0aGUgcm9vdCAoJy8nLCAnLy8nLCAuLi4pLiBBbiBlbXB0eSBwYXRoIGlzIG5vdCBhIHJvb3QgcGF0aC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUm9vdE5vZGVQYXRoKHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXBhdGggJiYgc3RyaXBMZWFkaW5nU2xhc2hlcyhwYXRoKSA9PT0gJyc7XG59XG4iXX0=