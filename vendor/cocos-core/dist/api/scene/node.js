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
exports.NodeApi = void 0;
const node_schema_1 = require("./node-schema");
const decorator_js_1 = require("../decorator/decorator.js");
const schema_base_1 = require("../base/schema-base");
const scene_1 = require("../../core/scene");
class NodeApi {
    /**
     * Create Node // 创建节点
     */
    async createNodeByType(options) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: undefined,
        };
        try {
            const resultNode = await scene_1.Scene.Node.createByType(options);
            if (resultNode) {
                ret.data = resultNode;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('Failed to create node:', e); // 创建节点失败:
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Create Node // 创建节点
     */
    async createNodeByAsset(options) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: undefined,
        };
        try {
            const resultNode = await scene_1.Scene.Node.createByAsset(options);
            if (resultNode) {
                ret.data = resultNode;
            }
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('Failed to create node:', e); // 创建节点失败:
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    /**
     * Delete Node // 删除节点
     */
    async deleteNode(options) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: undefined,
        };
        try {
            const result = await scene_1.Scene.Node.delete(options);
            if (!result)
                throw new Error(`node not found at path: ${options.path}`);
            ret.data = {
                path: result.path,
            };
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('Failed to delete node:', e); // 删除节点失败:
            ret.reason = e instanceof Error ? e.message : String(e);
            delete ret.data;
        }
        return ret;
    }
    /**
     * Update Node // 更新节点
     */
    async updateNode(options) {
        try {
            const data = await scene_1.Scene.Node.update(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error('Failed to update node:', e); // 更新节点失败:
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e),
            };
        }
    }
    /**
    * Query Node // 查询节点
    */
    async queryNode(options) {
        const ret = {
            code: schema_base_1.COMMON_STATUS.SUCCESS,
            data: undefined,
        };
        try {
            const result = await scene_1.Scene.Node.query(options);
            if (!result)
                throw new Error(`node not found at path: ${options.path}`);
            ret.data = result;
        }
        catch (e) {
            ret.code = (0, schema_base_1.getCommonErrorStatus)(e);
            console.error('Failed to query node:', e); // 查询节点失败:
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
}
exports.NodeApi = NodeApi;
__decorate([
    (0, decorator_js_1.tool)('scene-create-node-by-type'),
    (0, decorator_js_1.title)('Create Node By Type') // 根据类型创建节点
    ,
    (0, decorator_js_1.description)('Create a node named name with type nodeType under the path in the currently opened scene. The node path must be unique. If multi-level nodes are not created, empty nodes will be automatically completed.') // 在当前打开的场景中的 path 路径下创建一个名字为 name，类型为 nodeType 的节点，节点的路径必须是唯一的，如果有多级节点没创建，会自动补全空节点。
    ,
    (0, decorator_js_1.result)(node_schema_1.SchemaNodeQueryResult),
    __param(0, (0, decorator_js_1.param)(node_schema_1.SchemaNodeCreateByType)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NodeApi.prototype, "createNodeByType", null);
__decorate([
    (0, decorator_js_1.tool)('scene-create-node-by-asset'),
    (0, decorator_js_1.title)('Create Node By Asset') // 根据资源创建节点
    ,
    (0, decorator_js_1.description)('Create a node named name using dbURL asset under the path in the currently opened scene. The node path must be unique. If multi-level nodes are not created, empty nodes will be automatically completed. Example of resource dbURL format: db://assets/sample.prefab') // 在当前打开的场景中的 path 路径下使用 dbURL 资源，创建一个名字为 name 的节点，节点的路径必须是唯一的，如果有多级节点没创建，会自动补全空节点，资源的 dbURL 格式举例：db://assets/sample.prefab
    ,
    (0, decorator_js_1.result)(node_schema_1.SchemaNodeQueryResult),
    __param(0, (0, decorator_js_1.param)(node_schema_1.SchemaNodeCreateByAsset)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NodeApi.prototype, "createNodeByAsset", null);
__decorate([
    (0, decorator_js_1.tool)('scene-delete-node'),
    (0, decorator_js_1.title)('Delete Node') // 删除节点
    ,
    (0, decorator_js_1.description)('Delete a node in the currently opened scene. You need to pass in the path of the node, such as: Canvas/Node1') // 在当前打开的场景中删除节点，需要传入节点的路径，比如：Canvas/Node1
    ,
    (0, decorator_js_1.result)(node_schema_1.SchemaNodeDeleteResult),
    __param(0, (0, decorator_js_1.param)(node_schema_1.SchemaNodeDelete)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NodeApi.prototype, "deleteNode", null);
__decorate([
    (0, decorator_js_1.tool)('scene-update-node'),
    (0, decorator_js_1.title)('Update Node') // 更新节点
    ,
    (0, decorator_js_1.description)('Update a node in the currently opened scene. You need to pass in the path of the node, such as: Canvas/Node1') // 在当前打开的场景中更新节点，需要传入节点的路径，比如：Canvas/Node1
    ,
    (0, decorator_js_1.result)(node_schema_1.SchemaNodeUpdateResult),
    __param(0, (0, decorator_js_1.param)(node_schema_1.SchemaNodeUpdate)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NodeApi.prototype, "updateNode", null);
__decorate([
    (0, decorator_js_1.tool)('scene-query-node'),
    (0, decorator_js_1.title)('Query Node') // 查询节点
    ,
    (0, decorator_js_1.description)('Query a node (NOT a component) in the currently opened scene. The path must be a node path like "Canvas/Node1" — do NOT append a component type (e.g. do NOT use "Canvas/Node1/cc.Label"). To query a component, use scene-query-component instead.') // 在当前打开的场景中查询节点（不是组件），需要传入节点路径，比如：Canvas/Node1。不要追加组件类型名称（例如不要用 Canvas/Node1/cc.Label），如需查询组件请使用 scene-query-component
    ,
    (0, decorator_js_1.result)(node_schema_1.SchemaNodeQueryResult),
    __param(0, (0, decorator_js_1.param)(node_schema_1.SchemaNodeQuery)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NodeApi.prototype, "queryNode", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvc2NlbmUvbm9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FpQnVCO0FBQ3ZCLDREQUFvRjtBQUNwRixxREFBNEY7QUFDNUYsNENBQTZFO0FBRTdFLE1BQWEsT0FBTztJQUVoQjs7T0FFRztJQUtHLEFBQU4sS0FBSyxDQUFDLGdCQUFnQixDQUFnQyxPQUFpQztRQUNuRixNQUFNLEdBQUcsR0FBa0M7WUFDdkMsSUFBSSxFQUFFLDJCQUFhLENBQUMsT0FBTztZQUMzQixJQUFJLEVBQUUsU0FBUztTQUNsQixDQUFDO1FBQ0YsSUFBSSxDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxhQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFrQyxDQUFDLENBQUM7WUFDckYsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDYixHQUFHLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztZQUMxQixDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUEsa0NBQW9CLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFDdEQsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUdEOztPQUVHO0lBS0csQUFBTixLQUFLLENBQUMsaUJBQWlCLENBQWlDLE9BQWtDO1FBQ3RGLE1BQU0sR0FBRyxHQUFrQztZQUN2QyxJQUFJLEVBQUUsMkJBQWEsQ0FBQyxP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Q0FBQywySEFBMkg7O0lBQ2haLElBQUEscUJBQU0sRUFBQyxtQ0FBcUIsQ0FBQztJQUNMLFdBQUEsSUFBQSxvQkFBSyxFQUFDLHFDQUF1QixDQUFDLENBQUE7Ozs7Z0RBaUJ0RDtBQVVLO0lBSkwsSUFBQSxtQkFBSSxFQUFDLG1CQUFtQixDQUFDO0lBQ3pCLElBQUEsb0JBQUssRUFBQyxhQUFhLENBQUMsQ0FBQyxPQUFPOztJQUM1QixJQUFBLDBCQUFXLEVBQUMsOEdBQThHLENBQUMsQ0FBQywwQ0FBMEM7O0lBQ3RLLElBQUEscUJBQU0sRUFBQyxvQ0FBc0IsQ0FBQztJQUNiLFdBQUEsSUFBQSxvQkFBSyxFQUFDLDhCQUFnQixDQUFDLENBQUE7Ozs7eUNBb0J4QztBQVNLO0lBSkwsSUFBQSxtQkFBSSxFQUFDLG1CQUFtQixDQUFDO0lBQ3pCLElBQUEsb0JBQUssRUFBQyxhQUFhLENBQUMsQ0FBQyxPQUFPOztJQUM1QixJQUFBLDBCQUFXLEVBQUMsOEdBQThHLENBQUMsQ0FBQywwQ0FBMEM7O0lBQ3RLLElBQUEscUJBQU0sRUFBQyxvQ0FBc0IsQ0FBQztJQUNiLFdBQUEsSUFBQSxvQkFBSyxFQUFDLDhCQUFnQixDQUFDLENBQUE7Ozs7eUNBY3hDO0FBU0s7SUFKTCxJQUFBLG1CQUFJLEVBQUMsa0JBQWtCLENBQUM7SUFDeEIsSUFBQSxvQkFBSyxFQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU87O0lBQzNCLElBQUEsMEJBQVcsRUFBQyxxUEFBcVAsQ0FBQyxDQUFDLHVIQUF1SDs7SUFDMVgsSUFBQSxxQkFBTSxFQUFDLG1DQUFxQixDQUFDO0lBQ2IsV0FBQSxJQUFBLG9CQUFLLEVBQUMsNkJBQWUsQ0FBQyxDQUFBOzs7O3dDQWlCdEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIFNjaGVtYU5vZGVDcmVhdGVCeUFzc2V0LFxuICAgIFNjaGVtYU5vZGVDcmVhdGVCeVR5cGUsXG4gICAgU2NoZW1hTm9kZVVwZGF0ZSxcbiAgICBTY2hlbWFOb2RlRGVsZXRlLFxuICAgIFNjaGVtYU5vZGVRdWVyeSxcbiAgICBUTm9kZURldGFpbCxcbiAgICBUTm9kZVVwZGF0ZVJlc3VsdCxcbiAgICBUTm9kZURlbGV0ZVJlc3VsdCxcbiAgICBUQ3JlYXRlTm9kZUJ5QXNzZXRPcHRpb25zLFxuICAgIFRDcmVhdGVOb2RlQnlUeXBlT3B0aW9ucyxcbiAgICBUVXBkYXRlTm9kZU9wdGlvbnMsXG4gICAgVFF1ZXJ5Tm9kZU9wdGlvbnMsXG4gICAgVERlbGV0ZU5vZGVPcHRpb25zLFxuICAgIFNjaGVtYU5vZGVRdWVyeVJlc3VsdCxcbiAgICBTY2hlbWFOb2RlRGVsZXRlUmVzdWx0LFxuICAgIFNjaGVtYU5vZGVVcGRhdGVSZXN1bHQsXG59IGZyb20gJy4vbm9kZS1zY2hlbWEnO1xuaW1wb3J0IHsgZGVzY3JpcHRpb24sIHBhcmFtLCByZXN1bHQsIHRpdGxlLCB0b29sIH0gZnJvbSAnLi4vZGVjb3JhdG9yL2RlY29yYXRvci5qcyc7XG5pbXBvcnQgeyBDT01NT05fU1RBVFVTLCBDb21tb25SZXN1bHRUeXBlLCBnZXRDb21tb25FcnJvclN0YXR1cyB9IGZyb20gJy4uL2Jhc2Uvc2NoZW1hLWJhc2UnO1xuaW1wb3J0IHsgSUNyZWF0ZUJ5Tm9kZVR5cGVQYXJhbXMsIElOb2RlSW5mbywgU2NlbmUgfSBmcm9tICcuLi8uLi9jb3JlL3NjZW5lJztcblxuZXhwb3J0IGNsYXNzIE5vZGVBcGkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIE5vZGUgLy8g5Yib5bu66IqC54K5XG4gICAgICovXG4gICAgQHRvb2woJ3NjZW5lLWNyZWF0ZS1ub2RlLWJ5LXR5cGUnKVxuICAgIEB0aXRsZSgnQ3JlYXRlIE5vZGUgQnkgVHlwZScpIC8vIOagueaNruexu+Wei+WIm+W7uuiKgueCuVxuICAgIEBkZXNjcmlwdGlvbignQ3JlYXRlIGEgbm9kZSBuYW1lZCBuYW1lIHdpdGggdHlwZSBub2RlVHlwZSB1bmRlciB0aGUgcGF0aCBpbiB0aGUgY3VycmVudGx5IG9wZW5lZCBzY2VuZS4gVGhlIG5vZGUgcGF0aCBtdXN0IGJlIHVuaXF1ZS4gSWYgbXVsdGktbGV2ZWwgbm9kZXMgYXJlIG5vdCBjcmVhdGVkLCBlbXB0eSBub2RlcyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgY29tcGxldGVkLicpIC8vIOWcqOW9k+WJjeaJk+W8gOeahOWcuuaZr+S4reeahCBwYXRoIOi3r+W+hOS4i+WIm+W7uuS4gOS4quWQjeWtl+S4uiBuYW1l77yM57G75Z6L5Li6IG5vZGVUeXBlIOeahOiKgueCue+8jOiKgueCueeahOi3r+W+hOW/hemhu+aYr+WUr+S4gOeahO+8jOWmguaenOacieWkmue6p+iKgueCueayoeWIm+W7uu+8jOS8muiHquWKqOihpeWFqOepuuiKgueCueOAglxuICAgIEByZXN1bHQoU2NoZW1hTm9kZVF1ZXJ5UmVzdWx0KVxuICAgIGFzeW5jIGNyZWF0ZU5vZGVCeVR5cGUoQHBhcmFtKFNjaGVtYU5vZGVDcmVhdGVCeVR5cGUpIG9wdGlvbnM6IFRDcmVhdGVOb2RlQnlUeXBlT3B0aW9ucyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTm9kZURldGFpbD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFROb2RlRGV0YWlsPiA9IHtcbiAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIGRhdGE6IHVuZGVmaW5lZCxcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdE5vZGUgPSBhd2FpdCBTY2VuZS5Ob2RlLmNyZWF0ZUJ5VHlwZShvcHRpb25zIGFzIElDcmVhdGVCeU5vZGVUeXBlUGFyYW1zKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0LmRhdGEgPSByZXN1bHROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBub2RlOicsIGUpOyAvLyDliJvlu7roioLngrnlpLHotKU6XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBOb2RlIC8vIOWIm+W7uuiKgueCuVxuICAgICAqL1xuICAgIEB0b29sKCdzY2VuZS1jcmVhdGUtbm9kZS1ieS1hc3NldCcpXG4gICAgQHRpdGxlKCdDcmVhdGUgTm9kZSBCeSBBc3NldCcpIC8vIOagueaNrui1hOa6kOWIm+W7uuiKgueCuVxuICAgIEBkZXNjcmlwdGlvbignQ3JlYXRlIGEgbm9kZSBuYW1lZCBuYW1lIHVzaW5nIGRiVVJMIGFzc2V0IHVuZGVyIHRoZSBwYXRoIGluIHRoZSBjdXJyZW50bHkgb3BlbmVkIHNjZW5lLiBUaGUgbm9kZSBwYXRoIG11c3QgYmUgdW5pcXVlLiBJZiBtdWx0aS1sZXZlbCBub2RlcyBhcmUgbm90IGNyZWF0ZWQsIGVtcHR5IG5vZGVzIHdpbGwgYmUgYXV0b21hdGljYWxseSBjb21wbGV0ZWQuIEV4YW1wbGUgb2YgcmVzb3VyY2UgZGJVUkwgZm9ybWF0OiBkYjovL2Fzc2V0cy9zYW1wbGUucHJlZmFiJykgLy8g5Zyo5b2T5YmN5omT5byA55qE5Zy65pmv5Lit55qEIHBhdGgg6Lev5b6E5LiL5L2/55SoIGRiVVJMIOi1hOa6kO+8jOWIm+W7uuS4gOS4quWQjeWtl+S4uiBuYW1lIOeahOiKgueCue+8jOiKgueCueeahOi3r+W+hOW/hemhu+aYr+WUr+S4gOeahO+8jOWmguaenOacieWkmue6p+iKgueCueayoeWIm+W7uu+8jOS8muiHquWKqOihpeWFqOepuuiKgueCue+8jOi1hOa6kOeahCBkYlVSTCDmoLzlvI/kuL7kvovvvJpkYjovL2Fzc2V0cy9zYW1wbGUucHJlZmFiXG4gICAgQHJlc3VsdChTY2hlbWFOb2RlUXVlcnlSZXN1bHQpXG4gICAgYXN5bmMgY3JlYXRlTm9kZUJ5QXNzZXQoQHBhcmFtKFNjaGVtYU5vZGVDcmVhdGVCeUFzc2V0KSBvcHRpb25zOiBUQ3JlYXRlTm9kZUJ5QXNzZXRPcHRpb25zKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFROb2RlRGV0YWlsPj4ge1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VE5vZGVEZXRhaWw+ID0ge1xuICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgZGF0YTogdW5kZWZpbmVkLFxuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0Tm9kZSA9IGF3YWl0IFNjZW5lLk5vZGUuY3JlYXRlQnlBc3NldChvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0LmRhdGEgPSByZXN1bHROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IGdldENvbW1vbkVycm9yU3RhdHVzKGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBub2RlOicsIGUpOyAvLyDliJvlu7roioLngrnlpLHotKU6XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBOb2RlIC8vIOWIoOmZpOiKgueCuVxuICAgICAqL1xuICAgIEB0b29sKCdzY2VuZS1kZWxldGUtbm9kZScpXG4gICAgQHRpdGxlKCdEZWxldGUgTm9kZScpIC8vIOWIoOmZpOiKgueCuVxuICAgIEBkZXNjcmlwdGlvbignRGVsZXRlIGEgbm9kZSBpbiB0aGUgY3VycmVudGx5IG9wZW5lZCBzY2VuZS4gWW91IG5lZWQgdG8gcGFzcyBpbiB0aGUgcGF0aCBvZiB0aGUgbm9kZSwgc3VjaCBhczogQ2FudmFzL05vZGUxJykgLy8g5Zyo5b2T5YmN5omT5byA55qE5Zy65pmv5Lit5Yig6Zmk6IqC54K577yM6ZyA6KaB5Lyg5YWl6IqC54K555qE6Lev5b6E77yM5q+U5aaC77yaQ2FudmFzL05vZGUxXG4gICAgQHJlc3VsdChTY2hlbWFOb2RlRGVsZXRlUmVzdWx0KVxuICAgIGFzeW5jIGRlbGV0ZU5vZGUoQHBhcmFtKFNjaGVtYU5vZGVEZWxldGUpIG9wdGlvbnM6IFREZWxldGVOb2RlT3B0aW9ucyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTm9kZURlbGV0ZVJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFROb2RlRGVsZXRlUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIGRhdGE6IHVuZGVmaW5lZCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgU2NlbmUuTm9kZS5kZWxldGUob3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKGBub2RlIG5vdCBmb3VuZCBhdCBwYXRoOiAke29wdGlvbnMucGF0aH1gKTtcbiAgICAgICAgICAgIHJldC5kYXRhID0ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHJlc3VsdC5wYXRoLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBkZWxldGUgbm9kZTonLCBlKTsgLy8g5Yig6Zmk6IqC54K55aSx6LSlOlxuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgICAgIGRlbGV0ZSByZXQuZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIE5vZGUgLy8g5pu05paw6IqC54K5XG4gICAgICovXG4gICAgQHRvb2woJ3NjZW5lLXVwZGF0ZS1ub2RlJylcbiAgICBAdGl0bGUoJ1VwZGF0ZSBOb2RlJykgLy8g5pu05paw6IqC54K5XG4gICAgQGRlc2NyaXB0aW9uKCdVcGRhdGUgYSBub2RlIGluIHRoZSBjdXJyZW50bHkgb3BlbmVkIHNjZW5lLiBZb3UgbmVlZCB0byBwYXNzIGluIHRoZSBwYXRoIG9mIHRoZSBub2RlLCBzdWNoIGFzOiBDYW52YXMvTm9kZTEnKSAvLyDlnKjlvZPliY3miZPlvIDnmoTlnLrmma/kuK3mm7TmlrDoioLngrnvvIzpnIDopoHkvKDlhaXoioLngrnnmoTot6/lvoTvvIzmr5TlpoLvvJpDYW52YXMvTm9kZTFcbiAgICBAcmVzdWx0KFNjaGVtYU5vZGVVcGRhdGVSZXN1bHQpXG4gICAgYXN5bmMgdXBkYXRlTm9kZShAcGFyYW0oU2NoZW1hTm9kZVVwZGF0ZSkgb3B0aW9uczogVFVwZGF0ZU5vZGVPcHRpb25zKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFROb2RlVXBkYXRlUmVzdWx0Pj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IFNjZW5lLk5vZGUudXBkYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB1cGRhdGUgbm9kZTonLCBlKTsgLy8g5pu05paw6IqC54K55aSx6LSlOlxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFF1ZXJ5IE5vZGUgLy8g5p+l6K+i6IqC54K5XG4gICAgKi9cbiAgICBAdG9vbCgnc2NlbmUtcXVlcnktbm9kZScpXG4gICAgQHRpdGxlKCdRdWVyeSBOb2RlJykgLy8g5p+l6K+i6IqC54K5XG4gICAgQGRlc2NyaXB0aW9uKCdRdWVyeSBhIG5vZGUgKE5PVCBhIGNvbXBvbmVudCkgaW4gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2NlbmUuIFRoZSBwYXRoIG11c3QgYmUgYSBub2RlIHBhdGggbGlrZSBcIkNhbnZhcy9Ob2RlMVwiIOKAlCBkbyBOT1QgYXBwZW5kIGEgY29tcG9uZW50IHR5cGUgKGUuZy4gZG8gTk9UIHVzZSBcIkNhbnZhcy9Ob2RlMS9jYy5MYWJlbFwiKS4gVG8gcXVlcnkgYSBjb21wb25lbnQsIHVzZSBzY2VuZS1xdWVyeS1jb21wb25lbnQgaW5zdGVhZC4nKSAvLyDlnKjlvZPliY3miZPlvIDnmoTlnLrmma/kuK3mn6Xor6LoioLngrnvvIjkuI3mmK/nu4Tku7bvvInvvIzpnIDopoHkvKDlhaXoioLngrnot6/lvoTvvIzmr5TlpoLvvJpDYW52YXMvTm9kZTHjgILkuI3opoHov73liqDnu4Tku7bnsbvlnovlkI3np7DvvIjkvovlpoLkuI3opoHnlKggQ2FudmFzL05vZGUxL2NjLkxhYmVs77yJ77yM5aaC6ZyA5p+l6K+i57uE5Lu26K+35L2/55SoIHNjZW5lLXF1ZXJ5LWNvbXBvbmVudFxuICAgIEByZXN1bHQoU2NoZW1hTm9kZVF1ZXJ5UmVzdWx0KVxuICAgIGFzeW5jIHF1ZXJ5Tm9kZShAcGFyYW0oU2NoZW1hTm9kZVF1ZXJ5KSBvcHRpb25zOiBUUXVlcnlOb2RlT3B0aW9ucyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTm9kZURldGFpbD4+IHtcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPFROb2RlRGV0YWlsPiA9IHtcbiAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIGRhdGE6IHVuZGVmaW5lZCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgU2NlbmUuTm9kZS5xdWVyeShvcHRpb25zKSBhcyBJTm9kZUluZm8gfCBudWxsO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHRocm93IG5ldyBFcnJvcihgbm9kZSBub3QgZm91bmQgYXQgcGF0aDogJHtvcHRpb25zLnBhdGh9YCk7XG4gICAgICAgICAgICByZXQuZGF0YSA9IHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBnZXRDb21tb25FcnJvclN0YXR1cyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBxdWVyeSBub2RlOicsIGUpOyAvLyDmn6Xor6LoioLngrnlpLHotKU6XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG4iXX0=