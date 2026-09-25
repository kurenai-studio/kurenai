export interface IContourPoint {
    x: number;
    y: number;
}
/**
 * 提取 RGBA 数据中左上方第一个非透明连通区域的外轮廓。
 */
export declare function traceAlphaContour(data: Uint8Array, width: number, height: number, loop?: boolean): IContourPoint[];
