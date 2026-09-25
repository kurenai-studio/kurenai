export type BuildCacheScope = 'project' | 'global' | 'all';
export interface ClearCacheResult {
    scope: BuildCacheScope;
    cleared: string[];
}
export declare function clearCache(scope: BuildCacheScope): Promise<ClearCacheResult>;
