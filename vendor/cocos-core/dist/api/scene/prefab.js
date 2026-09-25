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
exports.PrefabApi = void 0;
const decorator_1 = require("../decorator/decorator");
const schema_base_1 = require("../base/schema-base");
const node_schema_1 = require("./node-schema");
const scene_1 = require("../../core/scene");
const prefab_schema_1 = require("./prefab-schema");
class PrefabApi {
    async createPrefabFromNode(options) {
        try {
            const data = await scene_1.Scene.createPrefabFromNode(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async applyPrefabChanges(options) {
        try {
            const data = await scene_1.Scene.applyPrefabChanges(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async revertToPrefab(options) {
        try {
            const data = await scene_1.Scene.revertToPrefab(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async unpackPrefabInstance(options) {
        try {
            const data = await scene_1.Scene.unpackPrefabInstance(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async isPrefabInstance(options) {
        try {
            const data = await scene_1.Scene.isPrefabInstance(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    // @tool('get-prefab-info')
    async getPrefabInfo(options) {
        try {
            const data = await scene_1.Scene.getPrefabInfo(options);
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
}
exports.PrefabApi = PrefabApi;
__decorate([
    (0, decorator_1.tool)('create-prefab-from-node'),
    (0, decorator_1.title)('Convert Node to Prefab Asset') // 将节点转换为预制体资源
    ,
    (0, decorator_1.description)('Convert the specified node and its children into a prefab asset and save it to the specified path') // 将指定节点及其子节点转换为预制体资源，并保存到指定路径
    ,
    (0, decorator_1.result)(node_schema_1.SchemaNode),
    __param(0, (0, decorator_1.param)(prefab_schema_1.SchemaCreatePrefabFromNodeOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrefabApi.prototype, "createPrefabFromNode", null);
__decorate([
    (0, decorator_1.tool)('apply-prefab-changes'),
    (0, decorator_1.title)('Apply Prefab Changes') // 应用预制体修改
    ,
    (0, decorator_1.description)('Apply changes from the prefab instance back to the prefab asset') // 将预制体实例的修改应用回预制体资源
    ,
    (0, decorator_1.result)(prefab_schema_1.SchemaApplyPrefabChangesResult),
    __param(0, (0, decorator_1.param)(prefab_schema_1.SchemaApplyPrefabChangesOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrefabApi.prototype, "applyPrefabChanges", null);
__decorate([
    (0, decorator_1.tool)('revert-prefab'),
    (0, decorator_1.title)('Revert Prefab Instance') // 重置预制体实例
    ,
    (0, decorator_1.description)('Revert the prefab instance to the original state of the prefab asset') // 将预制体实例重置到预制体资源的原始状态
    ,
    (0, decorator_1.result)(prefab_schema_1.SchemaRevertToPrefabResult),
    __param(0, (0, decorator_1.param)(prefab_schema_1.SchemaRevertToPrefabOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrefabApi.prototype, "revertToPrefab", null);
__decorate([
    (0, decorator_1.tool)('unpack-prefab'),
    (0, decorator_1.title)('Unpack Prefab Instance') // 解耦预制体实例
    ,
    (0, decorator_1.description)('Unpack the prefab instance, making it a regular node and no longer associated with the prefab asset') // 将预制体实例解耦，使其成为普通节点，不再与预制体资源关联
    ,
    (0, decorator_1.result)(node_schema_1.SchemaNode),
    __param(0, (0, decorator_1.param)(prefab_schema_1.SchemaUnpackPrefabInstanceOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrefabApi.prototype, "unpackPrefabInstance", null);
__decorate([
    (0, decorator_1.tool)('is-prefab-instance'),
    (0, decorator_1.title)('Check if Prefab Instance') // 检查是否为预制体实例
    ,
    (0, decorator_1.description)('Check if the specified node is a prefab instance') // 检查指定节点是否为预制体实例
    ,
    (0, decorator_1.result)(prefab_schema_1.SchemaIsPrefabInstanceResult),
    __param(0, (0, decorator_1.param)(prefab_schema_1.SchemaIsPrefabInstanceOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrefabApi.prototype, "isPrefabInstance", null);
__decorate([
    (0, decorator_1.title)('Get Prefab Info') // 获取预制体信息
    ,
    (0, decorator_1.description)('Get prefab-related information for the specified node') // 获取指定节点的预制体相关信息
    ,
    (0, decorator_1.result)(prefab_schema_1.SchemaGetPrefabResult),
    __param(0, (0, decorator_1.param)(prefab_schema_1.SchemaGetPrefabInfoOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrefabApi.prototype, "getPrefabInfo", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9zY2VuZS9wcmVmYWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0RBQWlGO0FBQ2pGLHFEQUFzRTtBQUN0RSwrQ0FBa0Q7QUFDbEQsNENBQXlDO0FBQ3pDLG1EQXFCeUI7QUFFekIsTUFBYSxTQUFTO0lBTVosQUFBTixLQUFLLENBQUMsb0JBQW9CLENBQTJDLE9BQXFDO1FBQ3RHLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sYUFBSyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELE9BQU87Z0JBQ0gsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLDJCQUFhLENBQUMsT0FBTzthQUM5QixDQUFDO1FBQ04sQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE9BQU87Z0JBQ0gsSUFBSSxFQUFFLDJCQUFhLENBQUMsSUFBSTtnQkFDeEIsTUFBTSxFQUFFLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDckQsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBTUssQUFBTixLQUFLLENBQUMsa0JBQWtCLENBQXlDLE9BQW1DO1FBQ2hHLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sYUFBSyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELE9BQU87Z0JBQ0gsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLDJCQUFhLENBQUMsT0FBTzthQUM5QixDQUFDO1FBQ04sQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsS0FBSyxD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LElBQUEsdUJBQVcsRUFBQyxxR0FBcUcsQ0FBQyxDQUFDLCtCQUErQjs7SUFDbEosSUFBQSxrQkFBTSxFQUFDLHdCQUFVLENBQUM7SUFDUyxXQUFBLElBQUEsaUJBQUssRUFBQyxpREFBaUMsQ0FBQyxDQUFBOzs7O3FEQWNuRTtBQU1LO0lBSkwsSUFBQSxnQkFBSSxFQUFDLG9CQUFvQixDQUFDO0lBQzFCLElBQUEsaUJBQUssRUFBQywwQkFBMEIsQ0FBQyxDQUFDLGFBQWE7O0lBQy9DLElBQUEsdUJBQVcsRUFBQyxrREFBa0QsQ0FBQyxDQUFDLGlCQUFpQjs7SUFDakYsSUFBQSxrQkFBTSxFQUFDLDRDQUE0QixDQUFDO0lBQ2IsV0FBQSxJQUFBLGlCQUFLLEVBQUMsNkNBQTZCLENBQUMsQ0FBQTs7OztpREFjM0Q7QUFNSztJQUhMLElBQUEsaUJBQUssRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLFVBQVU7O0lBQ25DLElBQUEsdUJBQVcsRUFBQyx1REFBdUQsQ0FBQyxDQUFDLGlCQUFpQjs7SUFDdEYsSUFBQSxrQkFBTSxFQUFDLHFDQUFxQixDQUFDO0lBQ1QsV0FBQSxJQUFBLGlCQUFLLEVBQUMsMENBQTBCLENBQUMsQ0FBQTs7Ozs4Q0FjckQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNjcmlwdGlvbiwgcGFyYW0sIHJlc3VsdCwgdGl0bGUsIHRvb2wgfSBmcm9tICcuLi9kZWNvcmF0b3IvZGVjb3JhdG9yJztcbmltcG9ydCB7IENPTU1PTl9TVEFUVVMsIENvbW1vblJlc3VsdFR5cGUgfSBmcm9tICcuLi9iYXNlL3NjaGVtYS1iYXNlJztcbmltcG9ydCB7IFNjaGVtYU5vZGUsIFROb2RlIH0gZnJvbSAnLi9ub2RlLXNjaGVtYSc7XG5pbXBvcnQgeyBTY2VuZSB9IGZyb20gJy4uLy4uL2NvcmUvc2NlbmUnO1xuaW1wb3J0IHtcbiAgICBTY2hlbWFBcHBseVByZWZhYkNoYW5nZXNPcHRpb25zLFxuICAgIFNjaGVtYUFwcGx5UHJlZmFiQ2hhbmdlc1Jlc3VsdCxcbiAgICBTY2hlbWFDcmVhdGVQcmVmYWJGcm9tTm9kZU9wdGlvbnMsXG4gICAgU2NoZW1hR2V0UHJlZmFiSW5mb09wdGlvbnMsXG4gICAgU2NoZW1hR2V0UHJlZmFiUmVzdWx0LFxuICAgIFNjaGVtYUlzUHJlZmFiSW5zdGFuY2VPcHRpb25zLFxuICAgIFNjaGVtYUlzUHJlZmFiSW5zdGFuY2VSZXN1bHQsXG4gICAgU2NoZW1hUmV2ZXJ0VG9QcmVmYWJPcHRpb25zLFxuICAgIFNjaGVtYVJldmVydFRvUHJlZmFiUmVzdWx0LFxuICAgIFNjaGVtYVVucGFja1ByZWZhYkluc3RhbmNlT3B0aW9ucyxcbiAgICBUQXBwbHlQcmVmYWJDaGFuZ2VzT3B0aW9ucyxcbiAgICBUQXBwbHlQcmVmYWJDaGFuZ2VzUmVzdWx0LFxuICAgIFRDcmVhdGVQcmVmYWJGcm9tTm9kZU9wdGlvbnMsXG4gICAgVEdldFByZWZhYkluZm9QYXJhbXMsXG4gICAgVEdldFByZWZhYlJlc3VsdCxcbiAgICBUSXNQcmVmYWJJbnN0YW5jZU9wdGlvbnMsXG4gICAgVElzUHJlZmFiSW5zdGFuY2VSZXN1bHQsXG4gICAgVFJldmVydFRvUHJlZmFiT3B0aW9ucyxcbiAgICBUUmV2ZXJ0VG9QcmVmYWJSZXN1bHQsXG4gICAgVFVucGFja1ByZWZhYkluc3RhbmNlT3B0aW9uc1xufSBmcm9tICcuL3ByZWZhYi1zY2hlbWEnO1xuXG5leHBvcnQgY2xhc3MgUHJlZmFiQXBpIHtcblxuICAgIEB0b29sKCdjcmVhdGUtcHJlZmFiLWZyb20tbm9kZScpXG4gICAgQHRpdGxlKCdDb252ZXJ0IE5vZGUgdG8gUHJlZmFiIEFzc2V0JykgLy8g5bCG6IqC54K56L2s5o2i5Li66aKE5Yi25L2T6LWE5rqQXG4gICAgQGRlc2NyaXB0aW9uKCdDb252ZXJ0IHRoZSBzcGVjaWZpZWQgbm9kZSBhbmQgaXRzIGNoaWxkcmVuIGludG8gYSBwcmVmYWIgYXNzZXQgYW5kIHNhdmUgaXQgdG8gdGhlIHNwZWNpZmllZCBwYXRoJykgLy8g5bCG5oyH5a6a6IqC54K55Y+K5YW25a2Q6IqC54K56L2s5o2i5Li66aKE5Yi25L2T6LWE5rqQ77yM5bm25L+d5a2Y5Yiw5oyH5a6a6Lev5b6EXG4gICAgQHJlc3VsdChTY2hlbWFOb2RlKVxuICAgIGFzeW5jIGNyZWF0ZVByZWZhYkZyb21Ob2RlKEBwYXJhbShTY2hlbWFDcmVhdGVQcmVmYWJGcm9tTm9kZU9wdGlvbnMpIG9wdGlvbnM6IFRDcmVhdGVQcmVmYWJGcm9tTm9kZU9wdGlvbnMpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VE5vZGU+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgU2NlbmUuY3JlYXRlUHJlZmFiRnJvbU5vZGUob3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5GQUlMLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQHRvb2woJ2FwcGx5LXByZWZhYi1jaGFuZ2VzJylcbiAgICBAdGl0bGUoJ0FwcGx5IFByZWZhYiBDaGFuZ2VzJykgLy8g5bqU55So6aKE5Yi25L2T5L+u5pS5XG4gICAgQGRlc2NyaXB0aW9uKCdBcHBseSBjaGFuZ2VzIGZyb20gdGhlIHByZWZhYiBpbnN0YW5jZSBiYWNrIHRvIHRoZSBwcmVmYWIgYXNzZXQnKSAvLyDlsIbpooTliLbkvZPlrp7kvovnmoTkv67mlLnlupTnlKjlm57pooTliLbkvZPotYTmupBcbiAgICBAcmVzdWx0KFNjaGVtYUFwcGx5UHJlZmFiQ2hhbmdlc1Jlc3VsdClcbiAgICBhc3luYyBhcHBseVByZWZhYkNoYW5nZXMoQHBhcmFtKFNjaGVtYUFwcGx5UHJlZmFiQ2hhbmdlc09wdGlvbnMpIG9wdGlvbnM6IFRBcHBseVByZWZhYkNoYW5nZXNPcHRpb25zKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRBcHBseVByZWZhYkNoYW5nZXNSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgU2NlbmUuYXBwbHlQcmVmYWJDaGFuZ2VzKG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuRkFJTCxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEB0b29sKCdyZXZlcnQtcHJlZmFiJylcbiAgICBAdGl0bGUoJ1JldmVydCBQcmVmYWIgSW5zdGFuY2UnKSAvLyDph43nva7pooTliLbkvZPlrp7kvotcbiAgICBAZGVzY3JpcHRpb24oJ1JldmVydCB0aGUgcHJlZmFiIGluc3RhbmNlIHRvIHRoZSBvcmlnaW5hbCBzdGF0ZSBvZiB0aGUgcHJlZmFiIGFzc2V0JykgLy8g5bCG6aKE5Yi25L2T5a6e5L6L6YeN572u5Yiw6aKE5Yi25L2T6LWE5rqQ55qE5Y6f5aeL54q25oCBXG4gICAgQHJlc3VsdChTY2hlbWFSZXZlcnRUb1ByZWZhYlJlc3VsdClcbiAgICBhc3luYyByZXZlcnRUb1ByZWZhYihAcGFyYW0oU2NoZW1hUmV2ZXJ0VG9QcmVmYWJPcHRpb25zKSBvcHRpb25zOiBUUmV2ZXJ0VG9QcmVmYWJPcHRpb25zKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRSZXZlcnRUb1ByZWZhYlJlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBTY2VuZS5yZXZlcnRUb1ByZWZhYihvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAdG9vbCgndW5wYWNrLXByZWZhYicpXG4gICAgQHRpdGxlKCdVbnBhY2sgUHJlZmFiIEluc3RhbmNlJykgLy8g6Kej6ICm6aKE5Yi25L2T5a6e5L6LXG4gICAgQGRlc2NyaXB0aW9uKCdVbnBhY2sgdGhlIHByZWZhYiBpbnN0YW5jZSwgbWFraW5nIGl0IGEgcmVndWxhciBub2RlIGFuZCBubyBsb25nZXIgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcmVmYWIgYXNzZXQnKSAvLyDlsIbpooTliLbkvZPlrp7kvovop6PogKbvvIzkvb/lhbbmiJDkuLrmma7pgJroioLngrnvvIzkuI3lho3kuI7pooTliLbkvZPotYTmupDlhbPogZRcbiAgICBAcmVzdWx0KFNjaGVtYU5vZGUpXG4gICAgYXN5bmMgdW5wYWNrUHJlZmFiSW5zdGFuY2UoQHBhcmFtKFNjaGVtYVVucGFja1ByZWZhYkluc3RhbmNlT3B0aW9ucykgb3B0aW9uczogVFVucGFja1ByZWZhYkluc3RhbmNlT3B0aW9ucyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUTm9kZT4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBTY2VuZS51bnBhY2tQcmVmYWJJbnN0YW5jZShvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAdG9vbCgnaXMtcHJlZmFiLWluc3RhbmNlJylcbiAgICBAdGl0bGUoJ0NoZWNrIGlmIFByZWZhYiBJbnN0YW5jZScpIC8vIOajgOafpeaYr+WQpuS4uumihOWItuS9k+WunuS+i1xuICAgIEBkZXNjcmlwdGlvbignQ2hlY2sgaWYgdGhlIHNwZWNpZmllZCBub2RlIGlzIGEgcHJlZmFiIGluc3RhbmNlJykgLy8g5qOA5p+l5oyH5a6a6IqC54K55piv5ZCm5Li66aKE5Yi25L2T5a6e5L6LXG4gICAgQHJlc3VsdChTY2hlbWFJc1ByZWZhYkluc3RhbmNlUmVzdWx0KVxuICAgIGFzeW5jIGlzUHJlZmFiSW5zdGFuY2UoQHBhcmFtKFNjaGVtYUlzUHJlZmFiSW5zdGFuY2VPcHRpb25zKSBvcHRpb25zOiBUSXNQcmVmYWJJbnN0YW5jZU9wdGlvbnMpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VElzUHJlZmFiSW5zdGFuY2VSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgU2NlbmUuaXNQcmVmYWJJbnN0YW5jZShvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBAdG9vbCgnZ2V0LXByZWZhYi1pbmZvJylcbiAgICBAdGl0bGUoJ0dldCBQcmVmYWIgSW5mbycpIC8vIOiOt+WPlumihOWItuS9k+S/oeaBr1xuICAgIEBkZXNjcmlwdGlvbignR2V0IHByZWZhYi1yZWxhdGVkIGluZm9ybWF0aW9uIGZvciB0aGUgc3BlY2lmaWVkIG5vZGUnKSAvLyDojrflj5bmjIflrproioLngrnnmoTpooTliLbkvZPnm7jlhbPkv6Hmga9cbiAgICBAcmVzdWx0KFNjaGVtYUdldFByZWZhYlJlc3VsdClcbiAgICBhc3luYyBnZXRQcmVmYWJJbmZvKEBwYXJhbShTY2hlbWFHZXRQcmVmYWJJbmZvT3B0aW9ucykgb3B0aW9uczogVEdldFByZWZhYkluZm9QYXJhbXMpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEdldFByZWZhYlJlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBTY2VuZS5nZXRQcmVmYWJJbmZvKG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuRkFJTCxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=