"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentApi = void 0;
const component_schema_1 = require("./component-schema");
const decorator_js_1 = require("../decorator/decorator.js");
const schema_base_1 = require("../base/schema-base");
const scene_1 = require("../../core/scene");
class ComponentApi {
    /**
     * Add component // 添加组件
     */
    async addComponent(addComponentInfo) {
        try {
            const component = await scene_1.Scene.Component.add({ nodePath: addComponentInfo.nodePath, component: addComponentInfo.component });
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: component
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    /**
     * Remove component // 移除组件
     */
    async removeComponent(component) {
        try {
            const result = await scene_1.Scene.Component.remove({ path: component.componentPath });
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    /**
     * Query component // 查询组件
     */
    async queryComponent(component) {
        try {
            const componentInfo = await scene_1.Scene.Component.query({ path: component.componentPath });
            if (!componentInfo) {
                throw new Error(`component not found: ${component.componentPath}`);
            }
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: componentInfo
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    /**
     * Set component property // 设置组件属性
     */
    async setProperty(setPropertyOptions) {
        try {
            const result = await scene_1.Scene.Component.setProperty(setPropertyOptions);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    /**
     * Query all components // 查询所有组件
     */
    async queryAllComponent() {
        try {
            const components = await scene_1.Scene.Component.queryAll();
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: components,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    /**
     * Regenerate PolygonCollider2D points // 重新生成 PolygonCollider2D 顶点
     */
    async regeneratePolygon2DPoints(options) {
        try {
            const result = await scene_1.Scene.Component.regeneratePolygon2DPoints(options);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e),
            };
        }
    }
    /**
     * Recalculate LODGroup bounds // 重新计算 LODGroup 包围盒
     */
    async recalculateLODGroupBounds(options) {
        try {
            const bounds = await scene_1.Scene.Component.recalculateLODGroupBounds(options);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: bounds,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e),
            };
        }
    }
    /**
     * Insert an LOD level // 插入 LOD 层级
     */
    async insertLOD(options) {
        try {
            const lodState = await scene_1.Scene.Component.insertLOD(options);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: lodState,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e),
            };
        }
    }
    /**
     * Erase an LOD level // 删除 LOD 层级
     */
    async eraseLOD(options) {
        try {
            const lodState = await scene_1.Scene.Component.eraseLOD(options);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: lodState,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e),
            };
        }
    }
    /**
     * Query LODGroup relative height // 查询 LODGroup 屏幕相对高度
     */
    async queryLODGroupRelativeHeight(options) {
        try {
            const relativeHeight = await scene_1.Scene.Component.queryLODGroupRelativeHeight(options);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: relativeHeight,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e),
            };
        }
    }
}
exports.ComponentApi = ComponentApi;
__decorate([
    (0, decorator_js_1.tool)('scene-add-component'),
    (0, decorator_js_1.title)('Add component') // 添加组件
    ,
    (0, decorator_js_1.description)('Add component to node, input node name, component type, built-in or custom component. Returns all component details on success. Can query all component names via scene-query-all-component') // 添加组件到节点中，输入节点名，组件类型，内置组件或自定义组件, 成功返回所有的组件详细信息，可以通过 scene-query-all-component 查询到所有组件的名称
    ,
    (0, decorator_js_1.result)(component_schema_1.SchemaComponentResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaAddComponentInfo)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "addComponent", null);
__decorate([
    (0, decorator_js_1.tool)('scene-delete-component'),
    (0, decorator_js_1.title)('Remove component') // 删除组件
    ,
    (0, decorator_js_1.description)('Remove node component, returns true on success, false on failure') // 删除节点组件，移除成功返回 true， 移除失败返回 false
    ,
    (0, decorator_js_1.result)(component_schema_1.SchemaBooleanResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaRemoveComponent)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "removeComponent", null);
__decorate([
    (0, decorator_js_1.tool)('scene-query-component'),
    (0, decorator_js_1.title)('Query component') // 查询组件
    ,
    (0, decorator_js_1.description)('Query a component (NOT a node) on a node. The path must be a component path = node path + "/" + component type name, e.g. "Canvas/Node1/cc.Label". Do NOT pass a bare node path like "Canvas/Node1" — that has no component type suffix and will fail. To query a node use scene-query-node instead.') // 查询组件信息（不是节点），路径必须是组件路径 = 节点路径 + "/" + 组件类型名称，例如 Canvas/Node1/cc.Label。不要传裸节点路径，如需查询节点请使用 scene-query-node
    ,
    (0, decorator_js_1.result)(component_schema_1.SchemaComponentResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaQueryComponent)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "queryComponent", null);
__decorate([
    (0, decorator_js_1.tool)('scene-set-component-property'),
    (0, decorator_js_1.title)('Set component property') // 设置组件属性
    ,
    (0, decorator_js_1.description)('Set component properties. Query scene-query-component first and match each Asset reference to the returned property type. Asset values use { uuid: "..." }; uuid may be an exact UUID or db:// URL. If a parent asset has exactly one compatible sub-asset, it is normalized automatically; incompatible or ambiguous references return 400 without modifying the component.') // 设置组件属性前先查询属性类型；Asset 引用必须匹配类型，唯一兼容子资源会自动规范化，失配或歧义时不修改组件并返回 400
    ,
    (0, decorator_js_1.result)(component_schema_1.SchemaBooleanResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaSetPropertyOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "setProperty", null);
__decorate([
    (0, decorator_js_1.tool)('scene-query-all-component'),
    (0, decorator_js_1.title)('Query all components') // 查询所有组件
    ,
    (0, decorator_js_1.description)('Query all components, can query component names of all component info') // 查询所有组件，可以查询到所有组件的信息的组件名称
    ,
    (0, decorator_js_1.result)(component_schema_1.SchemaQueryAllComponentResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "queryAllComponent", null);
__decorate([
    (0, decorator_js_1.tool)('scene-regenerate-polygon-2d-points'),
    (0, decorator_js_1.title)('Regenerate PolygonCollider2D points'),
    (0, decorator_js_1.description)('Regenerate cc.PolygonCollider2D points from the alpha contour of a Sprite on the same node. Falls back to the UITransform rectangle when no usable Sprite source exists. This overwrites the current points and records undo by default.'),
    (0, decorator_js_1.result)(component_schema_1.SchemaRegeneratePolygon2DPointsResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaRegeneratePolygon2DPointsOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "regeneratePolygon2DPoints", null);
__decorate([
    (0, decorator_js_1.tool)('scene-recalculate-lod-group-bounds'),
    (0, decorator_js_1.title)('Recalculate LODGroup bounds') // 重新计算 LODGroup 包围盒
    ,
    (0, decorator_js_1.description)('Recalculate localBoundaryCenter and objectSize from all Renderers referenced by a cc.LODGroup. The path must identify a cc.LODGroup component, e.g. "Root/LOD/cc.LODGroup". Returns zero values when no valid Renderer exists.') // 根据 LODGroup 引用的 Renderer 重算边界；路径必须指向 cc.LODGroup 组件
    ,
    (0, decorator_js_1.result)(component_schema_1.SchemaLODGroupBoundsResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaRecalculateLODGroupBoundsOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "recalculateLODGroupBounds", null);
__decorate([
    (0, decorator_js_1.tool)('scene-insert-lod'),
    (0, decorator_js_1.title)('Insert LOD level') // 插入 LOD 层级
    ,
    (0, decorator_js_1.description)('Insert an LOD level into a cc.LODGroup. Index must be from 0 through lodCount, at most 8 levels are allowed, and screenUsagePercentage must be in (0, 1]. Omit screenUsagePercentage to let the engine calculate it.'),
    (0, decorator_js_1.result)(component_schema_1.SchemaLODGroupLevelsResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaInsertLODOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "insertLOD", null);
__decorate([
    (0, decorator_js_1.tool)('scene-erase-lod'),
    (0, decorator_js_1.title)('Erase LOD level') // 删除 LOD 层级
    ,
    (0, decorator_js_1.description)('Erase an LOD level from a cc.LODGroup. Index must identify an existing level, and at least one LOD level must remain.'),
    (0, decorator_js_1.result)(component_schema_1.SchemaLODGroupLevelsResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaEraseLODOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "eraseLOD", null);
__decorate([
    (0, decorator_js_1.tool)('scene-query-lod-group-relative-height'),
    (0, decorator_js_1.title)('Query LODGroup relative height') // 查询 LODGroup 屏幕相对高度
    ,
    (0, decorator_js_1.description)('Query the raw screen-relative height of a cc.LODGroup under the current editor camera. Supports perspective and orthographic cameras; the result is not clamped to [0, 1].'),
    (0, decorator_js_1.result)(component_schema_1.SchemaLODGroupRelativeHeightResult),
    __param(0, (0, decorator_js_1.param)(component_schema_1.SchemaQueryLODGroupRelativeHeightOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComponentApi.prototype, "queryLODGroupRelativeHeight", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9zY2VuZS9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBaUM0QjtBQUU1Qiw0REFBb0Y7QUFDcEYscURBQTRGO0FBQzVGLDRDQUF5RDtBQUd6RCxNQUFhLFlBQVk7SUFFckI7O09BRUc7SUFLRyxBQUFOLEtBQUssQ0FBQyxZQUFZLENBQWdDLGdCQUFtQztRQUNqRixJQUFJLENBQUM7WUFDRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGFBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUM1SCxPQUFPO2dCQUNILElBQUksRUFBRSwyQkFBYSxDQUFDLE9BQU87Z0JBQzNCLElBQUksRUFBRSxTQUFTO2FBQ2xCLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE9BQU87Z0JBQ0gsSUFBSSxFQUFFLElBQUEsa0NBQW9CLEVBQUMsQ0FBQyxDQUFDO2dCQUM3QixNQUFNLEVBQUUsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzthQUNyRCxDQUFDO1FBQ04sQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUtHLEFBQU4sS0FBSyxDQUFDLGVBQWUsQ0FBK0IsU0FBa0M7UUFDbEYsSUFBSSxDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUMvRSxPQUFPO2dCQUNILElBQUksRUFBRSwyQkFBYSxDQUFD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QUMsNkNBQTBCLENBQUM7SUFFOUIsV0FBQSxJQUFBLG9CQUFLLEVBQUMseUNBQXNCLENBQUMsQ0FBQTs7Ozs2Q0FjakM7QUFTSztJQUpMLElBQUEsbUJBQUksRUFBQyxpQkFBaUIsQ0FBQztJQUN2QixJQUFBLG9CQUFLLEVBQUMsaUJBQWlCLENBQUMsQ0FBQyxZQUFZOztJQUNyQyxJQUFBLDBCQUFXLEVBQUMsdUhBQXVILENBQUM7SUFDcEksSUFBQSxxQkFBTSxFQUFDLDZDQUEwQixDQUFDO0lBRTlCLFdBQUEsSUFBQSxvQkFBSyxFQUFDLHdDQUFxQixDQUFDLENBQUE7Ozs7NENBY2hDO0FBU0s7SUFKTCxJQUFBLG1CQUFJLEVBQUMsdUNBQXVDLENBQUM7SUFDN0MsSUFBQSxvQkFBSyxFQUFDLGdDQUFnQyxDQUFDLENBQUMscUJBQXFCOztJQUM3RCxJQUFBLDBCQUFXLEVBQUMsNEtBQTRLLENBQUM7SUFDekwsSUFBQSxxQkFBTSxFQUFDLHFEQUFrQyxDQUFDO0lBRXRDLFdBQUEsSUFBQSxvQkFBSyxFQUFDLDJEQUF3QyxDQUFDLENBQUE7Ozs7K0RBY25EIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBTY2hlbWFBZGRDb21wb25lbnRJbmZvLFxuICAgIFNjaGVtYVNldFByb3BlcnR5T3B0aW9ucyxcbiAgICBTY2hlbWFDb21wb25lbnRSZXN1bHQsXG4gICAgU2NoZW1hQm9vbGVhblJlc3VsdCxcbiAgICBTY2hlbWFRdWVyeUFsbENvbXBvbmVudFJlc3VsdCxcbiAgICBTY2hlbWFRdWVyeUNvbXBvbmVudCxcbiAgICBTY2hlbWFSZW1vdmVDb21wb25lbnQsXG4gICAgU2NoZW1hUmVnZW5lcmF0ZVBvbHlnb24yRFBvaW50c09wdGlvbnMsXG4gICAgU2NoZW1hUmVnZW5lcmF0ZVBvbHlnb24yRFBvaW50c1Jlc3VsdCxcbiAgICBTY2hlbWFSZWNhbGN1bGF0ZUxPREdyb3VwQm91bmRzT3B0aW9ucyxcbiAgICBTY2hlbWFMT0RHcm91cEJvdW5kc1Jlc3VsdCxcbiAgICBTY2hlbWFJbnNlcnRMT0RPcHRpb25zLFxuICAgIFNjaGVtYUVyYXNlTE9ET3B0aW9ucyxcbiAgICBTY2hlbWFRdWVyeUxPREdyb3VwUmVsYXRpdmVIZWlnaHRPcHRpb25zLFxuICAgIFNjaGVtYUxPREdyb3VwTGV2ZWxzUmVzdWx0LFxuICAgIFNjaGVtYUxPREdyb3VwUmVsYXRpdmVIZWlnaHRSZXN1bHQsXG5cbiAgICBUQWRkQ29tcG9uZW50SW5mbyxcbiAgICBUU2V0UHJvcGVydHlPcHRpb25zLFxuICAgIFRDb21wb25lbnRSZXN1bHQsXG4gICAgVFF1ZXJ5QWxsQ29tcG9uZW50UmVzdWx0LFxuICAgIFRSZW1vdmVDb21wb25lbnRPcHRpb25zLFxuICAgIFRRdWVyeUNvbXBvbmVudE9wdGlvbnMsXG4gICAgVFJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHNPcHRpb25zLFxuICAgIFRSZWdlbmVyYXRlUG9seWdvbjJEUG9pbnRzUmVzdWx0LFxuICAgIFRSZWNhbGN1bGF0ZUxPREdyb3VwQm91bmRzT3B0aW9ucyxcbiAgICBUTE9ER3JvdXBCb3VuZHNSZXN1bHQsXG4gICAgVEluc2VydExPRE9wdGlvbnMsXG4gICAgVEVyYXNlTE9ET3B0aW9ucyxcbiAgICBUUXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0T3B0aW9ucyxcbiAgICBUTE9ER3JvdXBMZXZlbHNSZXN1bHQsXG4gICAgVExPREdyb3VwUmVsYXRpdmVIZWlnaHRSZXN1bHQsXG59IGZyb20gJy4vY29tcG9uZW50LXNjaGVtYSc7XG5cbmltcG9ydCB7IGRlc2NyaXB0aW9uLCBwYXJhbSwgcmVzdWx0LCB0aXRsZSwgdG9vbCB9IGZyb20gJy4uL2RlY29yYXRvci9kZWNvcmF0b3IuanMnO1xuaW1wb3J0IHsgQ09NTU9OX1NUQVRVUywgQ29tbW9uUmVzdWx0VHlwZSwgZ2V0Q29tbW9uRXJyb3JTdGF0dXMgfSBmcm9tICcuLi9iYXNlL3NjaGVtYS1iYXNlJztcbmltcG9ydCB7IFNjZW5lLCBJQ29tcG9uZW50SW5mbyB9IGZyb20gJy4uLy4uL2NvcmUvc2NlbmUnO1xuaW1wb3J0IHsgSVNldFByb3BlcnR5T3B0aW9uc0luZm8gfSBmcm9tICcuLi8uLi9jb3JlL3NjZW5lL2NvbW1vbi9jbGkvY29tcG9uZW50JztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEFwaSB7XG5cbiAgICAvKipcbiAgICAgKiBBZGQgY29tcG9uZW50IC8vIOa3u+WKoOe7hOS7tlxuICAgICAqL1xuICAgIEB0b29sKCdzY2VuZS1hZGQtY29tcG9uZW50JylcbiAgICBAdGl0bGUoJ0FkZCBjb21wb25lbnQnKSAvLyDmt7vliqDnu4Tku7ZcbiAgICBAZGVzY3JpcHRpb24oJ0FkZCBjb21wb25lbnQgdG8gbm9kZSwgaW5wdXQgbm9kZSBuYW1lLCBjb21wb25lbnQgdHlwZSwgYnVpbHQtaW4gb3IgY3VzdG9tIGNvbXBvbmVudC4gUmV0dXJucyBhbGwgY29tcG9uZW50IGRldGFpbHMgb24gc3VjY2Vzcy4gQ2FuIHF1ZXJ5IGFsbCBjb21wb25lbnQgbmFtZXMgdmlhIHNjZW5lLXF1ZXJ5LWFsbC1jb21wb25lbnQnKSAvLyDmt7vliqDnu4Tku7bliLDoioLngrnkuK3vvIzovpPlhaXoioLngrnlkI3vvIznu4Tku7bnsbvlnovvvIzlhoXnva7nu4Tku7bmiJboh6rlrprkuYnnu4Tku7YsIOaIkOWKn+i/lOWbnuaJgOacieeahOe7hOS7tuivpue7huS/oeaBr++8jOWPr+S7pemAmui/hyBzY2VuZS1xdWVyeS1hbGwtY29tcG9uZW50IOafpeivouWIsOaJgOaciee7hOS7tueahOWQjeensFxuICAgIEByZXN1bHQoU2NoZW1hQ29tcG9uZW50UmVzdWx0KVxuICAgIGFzeW5jIGFkZENvbXBvbmVudChAcGFyYW0oU2NoZW1hQWRkQ29tcG9uZW50SW5mbykgYWRkQ29tcG9uZW50SW5mbzogVEFkZENvbXBvbmVudEluZm8pOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VENvbXBvbmVudFJlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGF3YWl0IFNjZW5lLkNvbXBvbmVudC5hZGQoeyBub2RlUGF0aDogYWRkQ29tcG9uZW50SW5mby5ub2RlUGF0aCwgY29tcG9uZW50OiBhZGRDb21wb25lbnRJbmZvLmNvbXBvbmVudCB9KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGE6IGNvbXBvbmVudFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjb21wb25lbnQgLy8g56e76Zmk57uE5Lu2XG4gICAgICovXG4gICAgQHRvb2woJ3NjZW5lLWRlbGV0ZS1jb21wb25lbnQnKVxuICAgIEB0aXRsZSgnUmVtb3ZlIGNvbXBvbmVudCcpIC8vIOWIoOmZpOe7hOS7tlxuICAgIEBkZXNjcmlwdGlvbignUmVtb3ZlIG5vZGUgY29tcG9uZW50LCByZXR1cm5zIHRydWUgb24gc3VjY2VzcywgZmFsc2Ugb24gZmFpbHVyZScpIC8vIOWIoOmZpOiKgueCuee7hOS7tu+8jOenu+mZpOaIkOWKn+i/lOWbniB0cnVl77yMIOenu+mZpOWksei0pei/lOWbniBmYWxzZVxuICAgIEByZXN1bHQoU2NoZW1hQm9vbGVhblJlc3VsdClcbiAgICBhc3luYyByZW1vdmVDb21wb25lbnQoQHBhcmFtKFNjaGVtYVJlbW92ZUNvbXBvbmVudCkgY29tcG9uZW50OiBUUmVtb3ZlQ29tcG9uZW50T3B0aW9ucyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxib29sZWFuPj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgU2NlbmUuQ29tcG9uZW50LnJlbW92ZSh7IHBhdGg6IGNvbXBvbmVudC5jb21wb25lbnRQYXRoIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICAgICAgZGF0YTogcmVzdWx0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGdldENvbW1vbkVycm9yU3RhdHVzKGUpLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgY29tcG9uZW50IC8vIOafpeivoue7hOS7tlxuICAgICAqL1xuICAgIEB0b29sKCdzY2VuZS1xdWVyeS1jb21wb25lbnQnKVxuICAgIEB0aXRsZSgnUXVlcnkgY29tcG9uZW50JykgLy8g5p+l6K+i57uE5Lu2XG4gICAgQGRlc2NyaXB0aW9uKCdRdWVyeSBhIGNvbXBvbmVudCAoTk9UIGEgbm9kZSkgb24gYSBub2RlLiBUaGUgcGF0aCBtdXN0IGJlIGEgY29tcG9uZW50IHBhdGggPSBub2RlIHBhdGggKyBcIi9cIiArIGNvbXBvbmVudCB0eXBlIG5hbWUsIGUuZy4gXCJDYW52YXMvTm9kZTEvY2MuTGFiZWxcIi4gRG8gTk9UIHBhc3MgYSBiYXJlIG5vZGUgcGF0aCBsaWtlIFwiQ2FudmFzL05vZGUxXCIg4oCUIHRoYXQgaGFzIG5vIGNvbXBvbmVudCB0eXBlIHN1ZmZpeCBhbmQgd2lsbCBmYWlsLiBUbyBxdWVyeSBhIG5vZGUgdXNlIHNjZW5lLXF1ZXJ5LW5vZGUgaW5zdGVhZC4nKSAvLyDmn6Xor6Lnu4Tku7bkv6Hmga/vvIjkuI3mmK/oioLngrnvvInvvIzot6/lvoTlv4XpobvmmK/nu4Tku7bot6/lvoQgPSDoioLngrnot6/lvoQgKyBcIi9cIiArIOe7hOS7tuexu+Wei+WQjeensO+8jOS+i+WmgiBDYW52YXMvTm9kZTEvY2MuTGFiZWzjgILkuI3opoHkvKDoo7joioLngrnot6/lvoTvvIzlpoLpnIDmn6Xor6LoioLngrnor7fkvb/nlKggc2NlbmUtcXVlcnktbm9kZVxuICAgIEByZXN1bHQoU2NoZW1hQ29tcG9uZW50UmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5Q29tcG9uZW50KEBwYXJhbShTY2hlbWFRdWVyeUNvbXBvbmVudCkgY29tcG9uZW50OiBUUXVlcnlDb21wb25lbnRPcHRpb25zKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRDb21wb25lbnRSZXN1bHQgfCBudWxsPj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SW5mbyA9IGF3YWl0IFNjZW5lLkNvbXBvbmVudC5xdWVyeSh7IHBhdGg6IGNvbXBvbmVudC5jb21wb25lbnRQYXRoIH0pO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnRJbmZvKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb21wb25lbnQgbm90IGZvdW5kOiAke2NvbXBvbmVudC5jb21wb25lbnRQYXRofWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICAgICAgZGF0YTogY29tcG9uZW50SW5mbyBhcyBJQ29tcG9uZW50SW5mb1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBjb21wb25lbnQgcHJvcGVydHkgLy8g6K6+572u57uE5Lu25bGe5oCnXG4gICAgICovXG4gICAgQHRvb2woJ3NjZW5lLXNldC1jb21wb25lbnQtcHJvcGVydHknKVxuICAgIEB0aXRsZSgnU2V0IGNvbXBvbmVudCBwcm9wZXJ0eScpIC8vIOiuvue9rue7hOS7tuWxnuaAp1xuICAgIEBkZXNjcmlwdGlvbignU2V0IGNvbXBvbmVudCBwcm9wZXJ0aWVzLiBRdWVyeSBzY2VuZS1xdWVyeS1jb21wb25lbnQgZmlyc3QgYW5kIG1hdGNoIGVhY2ggQXNzZXQgcmVmZXJlbmNlIHRvIHRoZSByZXR1cm5lZCBwcm9wZXJ0eSB0eXBlLiBBc3NldCB2YWx1ZXMgdXNlIHsgdXVpZDogXCIuLi5cIiB9OyB1dWlkIG1heSBiZSBhbiBleGFjdCBVVUlEIG9yIGRiOi8vIFVSTC4gSWYgYSBwYXJlbnQgYXNzZXQgaGFzIGV4YWN0bHkgb25lIGNvbXBhdGlibGUgc3ViLWFzc2V0LCBpdCBpcyBub3JtYWxpemVkIGF1dG9tYXRpY2FsbHk7IGluY29tcGF0aWJsZSBvciBhbWJpZ3VvdXMgcmVmZXJlbmNlcyByZXR1cm4gNDAwIHdpdGhvdXQgbW9kaWZ5aW5nIHRoZSBjb21wb25lbnQuJykgLy8g6K6+572u57uE5Lu25bGe5oCn5YmN5YWI5p+l6K+i5bGe5oCn57G75Z6L77ybQXNzZXQg5byV55So5b+F6aG75Yy56YWN57G75Z6L77yM5ZSv5LiA5YW85a655a2Q6LWE5rqQ5Lya6Ieq5Yqo6KeE6IyD5YyW77yM5aSx6YWN5oiW5q2n5LmJ5pe25LiN5L+u5pS557uE5Lu25bm26L+U5ZueIDQwMFxuICAgIEByZXN1bHQoU2NoZW1hQm9vbGVhblJlc3VsdClcbiAgICBhc3luYyBzZXRQcm9wZXJ0eShAcGFyYW0oU2NoZW1hU2V0UHJvcGVydHlPcHRpb25zKSBzZXRQcm9wZXJ0eU9wdGlvbnM/OiBUU2V0UHJvcGVydHlPcHRpb25zKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPGJvb2xlYW4+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBTY2VuZS5Db21wb25lbnQuc2V0UHJvcGVydHkoc2V0UHJvcGVydHlPcHRpb25zIGFzIElTZXRQcm9wZXJ0eU9wdGlvbnNJbmZvKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGE6IHJlc3VsdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IGFsbCBjb21wb25lbnRzIC8vIOafpeivouaJgOaciee7hOS7tlxuICAgICAqL1xuICAgIEB0b29sKCdzY2VuZS1xdWVyeS1hbGwtY29tcG9uZW50JylcbiAgICBAdGl0bGUoJ1F1ZXJ5IGFsbCBjb21wb25lbnRzJykgLy8g5p+l6K+i5omA5pyJ57uE5Lu2XG4gICAgQGRlc2NyaXB0aW9uKCdRdWVyeSBhbGwgY29tcG9uZW50cywgY2FuIHF1ZXJ5IGNvbXBvbmVudCBuYW1lcyBvZiBhbGwgY29tcG9uZW50IGluZm8nKSAvLyDmn6Xor6LmiYDmnInnu4Tku7bvvIzlj6/ku6Xmn6Xor6LliLDmiYDmnInnu4Tku7bnmoTkv6Hmga/nmoTnu4Tku7blkI3np7BcbiAgICBAcmVzdWx0KFNjaGVtYVF1ZXJ5QWxsQ29tcG9uZW50UmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5QWxsQ29tcG9uZW50KCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUXVlcnlBbGxDb21wb25lbnRSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRzID0gYXdhaXQgU2NlbmUuQ29tcG9uZW50LnF1ZXJ5QWxsKCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiBjb21wb25lbnRzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2VuZXJhdGUgUG9seWdvbkNvbGxpZGVyMkQgcG9pbnRzIC8vIOmHjeaWsOeUn+aIkCBQb2x5Z29uQ29sbGlkZXIyRCDpobbngrlcbiAgICAgKi9cbiAgICBAdG9vbCgnc2NlbmUtcmVnZW5lcmF0ZS1wb2x5Z29uLTJkLXBvaW50cycpXG4gICAgQHRpdGxlKCdSZWdlbmVyYXRlIFBvbHlnb25Db2xsaWRlcjJEIHBvaW50cycpXG4gICAgQGRlc2NyaXB0aW9uKCdSZWdlbmVyYXRlIGNjLlBvbHlnb25Db2xsaWRlcjJEIHBvaW50cyBmcm9tIHRoZSBhbHBoYSBjb250b3VyIG9mIGEgU3ByaXRlIG9uIHRoZSBzYW1lIG5vZGUuIEZhbGxzIGJhY2sgdG8gdGhlIFVJVHJhbnNmb3JtIHJlY3RhbmdsZSB3aGVuIG5vIHVzYWJsZSBTcHJpdGUgc291cmNlIGV4aXN0cy4gVGhpcyBvdmVyd3JpdGVzIHRoZSBjdXJyZW50IHBvaW50cyBhbmQgcmVjb3JkcyB1bmRvIGJ5IGRlZmF1bHQuJylcbiAgICBAcmVzdWx0KFNjaGVtYVJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHNSZXN1bHQpXG4gICAgYXN5bmMgcmVnZW5lcmF0ZVBvbHlnb24yRFBvaW50cyhcbiAgICAgICAgQHBhcmFtKFNjaGVtYVJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHNPcHRpb25zKSBvcHRpb25zOiBUUmVnZW5lcmF0ZVBvbHlnb24yRFBvaW50c09wdGlvbnMsXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRSZWdlbmVyYXRlUG9seWdvbjJEUG9pbnRzUmVzdWx0Pj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgU2NlbmUuQ29tcG9uZW50LnJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHMob3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiByZXN1bHQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGdldENvbW1vbkVycm9yU3RhdHVzKGUpLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY2FsY3VsYXRlIExPREdyb3VwIGJvdW5kcyAvLyDph43mlrDorqHnrpcgTE9ER3JvdXAg5YyF5Zu055uSXG4gICAgICovXG4gICAgQHRvb2woJ3NjZW5lLXJlY2FsY3VsYXRlLWxvZC1ncm91cC1ib3VuZHMnKVxuICAgIEB0aXRsZSgnUmVjYWxjdWxhdGUgTE9ER3JvdXAgYm91bmRzJykgLy8g6YeN5paw6K6h566XIExPREdyb3VwIOWMheWbtOebklxuICAgIEBkZXNjcmlwdGlvbignUmVjYWxjdWxhdGUgbG9jYWxCb3VuZGFyeUNlbnRlciBhbmQgb2JqZWN0U2l6ZSBmcm9tIGFsbCBSZW5kZXJlcnMgcmVmZXJlbmNlZCBieSBhIGNjLkxPREdyb3VwLiBUaGUgcGF0aCBtdXN0IGlkZW50aWZ5IGEgY2MuTE9ER3JvdXAgY29tcG9uZW50LCBlLmcuIFwiUm9vdC9MT0QvY2MuTE9ER3JvdXBcIi4gUmV0dXJucyB6ZXJvIHZhbHVlcyB3aGVuIG5vIHZhbGlkIFJlbmRlcmVyIGV4aXN0cy4nKSAvLyDmoLnmja4gTE9ER3JvdXAg5byV55So55qEIFJlbmRlcmVyIOmHjeeul+i+ueeVjO+8m+i3r+W+hOW/hemhu+aMh+WQkSBjYy5MT0RHcm91cCDnu4Tku7ZcbiAgICBAcmVzdWx0KFNjaGVtYUxPREdyb3VwQm91bmRzUmVzdWx0KVxuICAgIGFzeW5jIHJlY2FsY3VsYXRlTE9ER3JvdXBCb3VuZHMoXG4gICAgICAgIEBwYXJhbShTY2hlbWFSZWNhbGN1bGF0ZUxPREdyb3VwQm91bmRzT3B0aW9ucykgb3B0aW9uczogVFJlY2FsY3VsYXRlTE9ER3JvdXBCb3VuZHNPcHRpb25zLFxuICAgICk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTE9ER3JvdXBCb3VuZHNSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBib3VuZHMgPSBhd2FpdCBTY2VuZS5Db21wb25lbnQucmVjYWxjdWxhdGVMT0RHcm91cEJvdW5kcyhvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGE6IGJvdW5kcyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSksXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0IGFuIExPRCBsZXZlbCAvLyDmj5LlhaUgTE9EIOWxgue6p1xuICAgICAqL1xuICAgIEB0b29sKCdzY2VuZS1pbnNlcnQtbG9kJylcbiAgICBAdGl0bGUoJ0luc2VydCBMT0QgbGV2ZWwnKSAvLyDmj5LlhaUgTE9EIOWxgue6p1xuICAgIEBkZXNjcmlwdGlvbignSW5zZXJ0IGFuIExPRCBsZXZlbCBpbnRvIGEgY2MuTE9ER3JvdXAuIEluZGV4IG11c3QgYmUgZnJvbSAwIHRocm91Z2ggbG9kQ291bnQsIGF0IG1vc3QgOCBsZXZlbHMgYXJlIGFsbG93ZWQsIGFuZCBzY3JlZW5Vc2FnZVBlcmNlbnRhZ2UgbXVzdCBiZSBpbiAoMCwgMV0uIE9taXQgc2NyZWVuVXNhZ2VQZXJjZW50YWdlIHRvIGxldCB0aGUgZW5naW5lIGNhbGN1bGF0ZSBpdC4nKVxuICAgIEByZXN1bHQoU2NoZW1hTE9ER3JvdXBMZXZlbHNSZXN1bHQpXG4gICAgYXN5bmMgaW5zZXJ0TE9EKFxuICAgICAgICBAcGFyYW0oU2NoZW1hSW5zZXJ0TE9ET3B0aW9ucykgb3B0aW9uczogVEluc2VydExPRE9wdGlvbnMsXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRMT0RHcm91cExldmVsc1Jlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxvZFN0YXRlID0gYXdhaXQgU2NlbmUuQ29tcG9uZW50Lmluc2VydExPRChvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGE6IGxvZFN0YXRlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFcmFzZSBhbiBMT0QgbGV2ZWwgLy8g5Yig6ZmkIExPRCDlsYLnuqdcbiAgICAgKi9cbiAgICBAdG9vbCgnc2NlbmUtZXJhc2UtbG9kJylcbiAgICBAdGl0bGUoJ0VyYXNlIExPRCBsZXZlbCcpIC8vIOWIoOmZpCBMT0Qg5bGC57qnXG4gICAgQGRlc2NyaXB0aW9uKCdFcmFzZSBhbiBMT0QgbGV2ZWwgZnJvbSBhIGNjLkxPREdyb3VwLiBJbmRleCBtdXN0IGlkZW50aWZ5IGFuIGV4aXN0aW5nIGxldmVsLCBhbmQgYXQgbGVhc3Qgb25lIExPRCBsZXZlbCBtdXN0IHJlbWFpbi4nKVxuICAgIEByZXN1bHQoU2NoZW1hTE9ER3JvdXBMZXZlbHNSZXN1bHQpXG4gICAgYXN5bmMgZXJhc2VMT0QoXG4gICAgICAgIEBwYXJhbShTY2hlbWFFcmFzZUxPRE9wdGlvbnMpIG9wdGlvbnM6IFRFcmFzZUxPRE9wdGlvbnMsXG4gICAgKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRMT0RHcm91cExldmVsc1Jlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxvZFN0YXRlID0gYXdhaXQgU2NlbmUuQ29tcG9uZW50LmVyYXNlTE9EKG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICAgICAgZGF0YTogbG9kU3RhdGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGdldENvbW1vbkVycm9yU3RhdHVzKGUpLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IExPREdyb3VwIHJlbGF0aXZlIGhlaWdodCAvLyDmn6Xor6IgTE9ER3JvdXAg5bGP5bmV55u45a+56auY5bqmXG4gICAgICovXG4gICAgQHRvb2woJ3NjZW5lLXF1ZXJ5LWxvZC1ncm91cC1yZWxhdGl2ZS1oZWlnaHQnKVxuICAgIEB0aXRsZSgnUXVlcnkgTE9ER3JvdXAgcmVsYXRpdmUgaGVpZ2h0JykgLy8g5p+l6K+iIExPREdyb3VwIOWxj+W5leebuOWvuemrmOW6plxuICAgIEBkZXNjcmlwdGlvbignUXVlcnkgdGhlIHJhdyBzY3JlZW4tcmVsYXRpdmUgaGVpZ2h0IG9mIGEgY2MuTE9ER3JvdXAgdW5kZXIgdGhlIGN1cnJlbnQgZWRpdG9yIGNhbWVyYS4gU3VwcG9ydHMgcGVyc3BlY3RpdmUgYW5kIG9ydGhvZ3JhcGhpYyBjYW1lcmFzOyB0aGUgcmVzdWx0IGlzIG5vdCBjbGFtcGVkIHRvIFswLCAxXS4nKVxuICAgIEByZXN1bHQoU2NoZW1hTE9ER3JvdXBSZWxhdGl2ZUhlaWdodFJlc3VsdClcbiAgICBhc3luYyBxdWVyeUxPREdyb3VwUmVsYXRpdmVIZWlnaHQoXG4gICAgICAgIEBwYXJhbShTY2hlbWFRdWVyeUxPREdyb3VwUmVsYXRpdmVIZWlnaHRPcHRpb25zKSBvcHRpb25zOiBUUXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0T3B0aW9ucyxcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VExPREdyb3VwUmVsYXRpdmVIZWlnaHRSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZUhlaWdodCA9IGF3YWl0IFNjZW5lLkNvbXBvbmVudC5xdWVyeUxPREdyb3VwUmVsYXRpdmVIZWlnaHQob3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiByZWxhdGl2ZUhlaWdodCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSksXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxufVxuIl19