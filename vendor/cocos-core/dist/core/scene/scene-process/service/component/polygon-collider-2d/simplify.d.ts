import type { IContourPoint } from './contour';
/**
 * 使用与 Creator Editor 相同的 Ramer-Douglas-Peucker 实现简化轮廓。
 */
export declare function simplifyContour(points: readonly IContourPoint[], epsilon: number): IContourPoint[];
