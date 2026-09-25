import { Component, PolygonCollider2D, Vec2 } from 'cc';
import type { IProperty } from '../../../@types/public';
import type { Polygon2DPointsSource } from '../../../common/component';
export interface IGeneratePolygonPointsResult {
    source: Polygon2DPointsSource;
    points: Vec2[];
}
/**
 * 将通用组件收窄为 PolygonCollider2D。
 */
export declare function requirePolygonCollider2D(component: Component | null, path: string): PolygonCollider2D;
/**
 * 生成候选顶点，不直接修改组件。
 *
 * Sprite Alpha 分支异步读取源图片并生成轮廓；无有效 Sprite 来源时回退到节点矩形。
 */
export declare function generatePolygonPoints(collider: PolygonCollider2D): Promise<IGeneratePolygonPointsResult>;
/**
 * 初始化新添加的 PolygonCollider2D，不参与通用组件新增生命周期。
 * 生成失败时保留引擎默认 points，避免阻断 Add Component。
 */
export declare function initializePolygonCollider2DPoints(collider: PolygonCollider2D): Promise<void>;
/**
 * 校验提交前的基础几何条件。
 * 首版只覆盖数量、有限数值和环形相邻重复点；复杂自交校验留给算法阶段。
 */
export declare function validatePolygonPoints(points: readonly Readonly<Vec2>[]): void;
/**
 * 判断候选点是否会实际改变 points，避免产生空 Undo。
 */
export declare function arePolygonPointsEqual(current: readonly Readonly<Vec2>[], candidate: readonly Readonly<Vec2>[]): boolean;
/**
 * 使用现有 points Dump 的元素模板编码候选 Vec2[]。
 */
export declare function createPolygonPointsPropertyDump(pointsProperty: unknown, points: readonly Readonly<Vec2>[]): IProperty | null;
