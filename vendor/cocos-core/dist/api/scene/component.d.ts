import { TAddComponentInfo, TSetPropertyOptions, TComponentResult, TQueryAllComponentResult, TRemoveComponentOptions, TQueryComponentOptions, TRegeneratePolygon2DPointsOptions, TRegeneratePolygon2DPointsResult, TRecalculateLODGroupBoundsOptions, TLODGroupBoundsResult, TInsertLODOptions, TEraseLODOptions, TQueryLODGroupRelativeHeightOptions, TLODGroupLevelsResult, TLODGroupRelativeHeightResult } from './component-schema';
import { CommonResultType } from '../base/schema-base';
export declare class ComponentApi {
    /**
     * Add component // 添加组件
     */
    addComponent(addComponentInfo: TAddComponentInfo): Promise<CommonResultType<TComponentResult>>;
    /**
     * Remove component // 移除组件
     */
    removeComponent(component: TRemoveComponentOptions): Promise<CommonResultType<boolean>>;
    /**
     * Query component // 查询组件
     */
    queryComponent(component: TQueryComponentOptions): Promise<CommonResultType<TComponentResult | null>>;
    /**
     * Set component property // 设置组件属性
     */
    setProperty(setPropertyOptions?: TSetPropertyOptions): Promise<CommonResultType<boolean>>;
    /**
     * Query all components // 查询所有组件
     */
    queryAllComponent(): Promise<CommonResultType<TQueryAllComponentResult>>;
    /**
     * Regenerate PolygonCollider2D points // 重新生成 PolygonCollider2D 顶点
     */
    regeneratePolygon2DPoints(options: TRegeneratePolygon2DPointsOptions): Promise<CommonResultType<TRegeneratePolygon2DPointsResult>>;
    /**
     * Recalculate LODGroup bounds // 重新计算 LODGroup 包围盒
     */
    recalculateLODGroupBounds(options: TRecalculateLODGroupBoundsOptions): Promise<CommonResultType<TLODGroupBoundsResult>>;
    /**
     * Insert an LOD level // 插入 LOD 层级
     */
    insertLOD(options: TInsertLODOptions): Promise<CommonResultType<TLODGroupLevelsResult>>;
    /**
     * Erase an LOD level // 删除 LOD 层级
     */
    eraseLOD(options: TEraseLODOptions): Promise<CommonResultType<TLODGroupLevelsResult>>;
    /**
     * Query LODGroup relative height // 查询 LODGroup 屏幕相对高度
     */
    queryLODGroupRelativeHeight(options: TQueryLODGroupRelativeHeightOptions): Promise<CommonResultType<TLODGroupRelativeHeightResult>>;
}
