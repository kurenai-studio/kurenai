/**
 * Compare dotted numeric versions segment by segment.
 * @example compareVersion('3.6.2', '3.7.0') => -1
 * @example compareVersion('3.9.0', '3.8.0') => 1
 * @example compareVersion('3.8.0', '3.8.0') => 0
 * @param versionLeft
 * @param versionRight
 * @param split
 */
export declare function compareVersion(versionLeft: string, versionRight: string, split?: string): number;
