export { isSamePath, isSubPath, toPathKey } from './path-identity';
/**
 * 将一个 path 转成绝对地址
 * 如果传入数据不存在，则返回 ''
 * @param path
 */
export declare function absolutePath(path: string | undefined): string;
/**
 * 比对版本号
 * A > B => 1
 * A = B => 0
 * A < B => -1
 * @param versionA
 * @param versionB
 */
export declare function compareVersion(versionA: any, versionB: any): 0 | 1 | -1;
/**
 * 从一个名字转换成一个 id
 * 这是个有损压缩，并不能够还原成原来的名字
 * @param id
 * @param extend
 */
export declare function nameToId(name: string, extend?: number): string;
