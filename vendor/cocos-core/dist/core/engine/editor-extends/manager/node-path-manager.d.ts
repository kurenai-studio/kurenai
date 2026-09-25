/**
 * Node path manager (singleton).
 *
 * Core problem solved: after name/path decoupling, node.name is a repeatable display name,
 * while system paths must be unique (same-name siblings are disambiguated via _001, _002 suffixes).
 * This class maintains a bidirectional UUID <-> unique system path mapping with case-insensitive lookup.
 */
export declare class NodePathManager {
    private _uuidToPath;
    private _pathToUuid;
    private _lowerPathToUuids;
    private _nodeNames;
    /**
        * 清理名称中的非法字符
        */
    private _sanitizeName;
    /**
     * 生成唯一路径
     */
    generateUniquePath(uuid: string, name: string, parentUuid?: string): string;
    private _addPathMapping;
    private _removePathMapping;
    add(uuid: string, path: string): void;
    remove(uuid: string, parentUuid?: string): void;
    changeUuid(oldUuid: string, newUuid: string): void;
    clear(): void;
    private _getParentUuid;
    /**
     * 确保节点名称在父节点下唯一
     */
    ensureUniqueName(parentUuid: string | undefined, baseName: string): string;
    getNodeUuid(path: string): string | undefined;
    getNodeResult(path: string): {
        uuid?: string;
        exactMatch?: boolean;
        error?: 'Not found' | 'Ambiguous';
    };
    getNodePath(uuid: string): string;
    private _getSubtreeEntries;
    private _replaceSubtreePathPrefix;
    move(uuid: string, name: string, newParentUuid: string | undefined, oldParentUuid?: string): string;
    updateUuid(uuid: string, newName: string, parentUuid?: string): void;
}
declare const _default: NodePathManager;
export default _default;
