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
exports.SceneApi = void 0;
const schema_1 = require("./schema");
const decorator_js_1 = require("../decorator/decorator.js");
const schema_base_1 = require("../base/schema-base");
const scene_1 = require("../../core/scene");
const assets_1 = require("../../core/assets");
const component_1 = require("./component");
const node_1 = require("./node");
const prefab_1 = require("./prefab");
const reference_image_1 = require("./reference-image");
const particle_1 = require("./particle");
class SceneApi {
    component;
    node;
    prefab;
    referenceImage;
    particle;
    constructor() {
        this.component = new component_1.ComponentApi();
        this.node = new node_1.NodeApi();
        this.prefab = new prefab_1.PrefabApi();
        this.referenceImage = new reference_image_1.ReferenceImageApi();
        this.particle = new particle_1.ParticleApi();
    }
    async queryCurrent() {
        try {
            const data = await scene_1.Scene.queryCurrent();
            const result = {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
            if (!data) {
                delete result.data;
                result.reason = 'No scene is currently open.';
            }
            return result;
        }
        catch (e) {
            console.error(e);
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async open(options) {
        try {
            const data = await scene_1.Scene.open({ urlOrUUID: options.dbURLOrUUID, includeChildren: options.includeChildren, includeComponents: options.includeComponents });
            return {
                data: data,
                code: schema_base_1.COMMON_STATUS.SUCCESS,
            };
        }
        catch (e) {
            console.error(e);
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async close() {
        try {
            const data = await scene_1.Scene.close({});
            return {
                data,
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
    async save() {
        try {
            const data = await scene_1.Scene.save({});
            return {
                data,
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
    async createScene(options) {
        try {
            const assetInfo = await assets_1.assetManager.createAssetByType('scene', options.dbURL, options.baseName, { templateName: options.templateType ?? '2d' });
            const data = {
                assetName: assetInfo.name,
                assetUuid: assetInfo.uuid,
                assetUrl: assetInfo.url,
                assetType: assetInfo.type,
            };
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data,
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
    async reloadScene() {
        try {
            const data = await scene_1.Scene.reload({});
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: data,
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
exports.SceneApi = SceneApi;
__decorate([
    (0, decorator_js_1.tool)('scene-query-current'),
    (0, decorator_js_1.title)('Get current opened scene/prefab info') // 获取当前打开的场景/预制体信息
    ,
    (0, decorator_js_1.description)('Get current opened scene/prefab info, if no scene is opened, the data is not returned.') // 获取当前打开场景/预制体信息，如果没有打开，返回 null
    ,
    (0, decorator_js_1.result)(schema_1.SchemaCurrentResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SceneApi.prototype, "queryCurrent", null);
__decorate([
    (0, decorator_js_1.tool)('scene-open'),
    (0, decorator_js_1.title)('Open scene/prefab') // 打开场景/预制体
    ,
    (0, decorator_js_1.description)('Open specified scene/prefab asset.') // 打开指定场景/预制体资源。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaOpenResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaOpenOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SceneApi.prototype, "open", null);
__decorate([
    (0, decorator_js_1.tool)('scene-close'),
    (0, decorator_js_1.title)('Close scene/prefab') // 关闭场景/预制体
    ,
    (0, decorator_js_1.description)('Close current opened scene/prefab.') // 关闭当前打开的场景/预制体。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaCloseResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SceneApi.prototype, "close", null);
__decorate([
    (0, decorator_js_1.tool)('scene-save'),
    (0, decorator_js_1.title)('Save scene/prefab') // 保存场景/预制体
    ,
    (0, decorator_js_1.description)('Save current opened scene/prefab to asset, including scene node structure, component data, asset references etc. Will update .meta file after save.') // 保存当前打开的场景/预制体到资源，包括场景节点结构、组件数据、资源引用等信息。保存后会更新场景的 .meta 文件。
    ,
    (0, decorator_js_1.result)(schema_1.SchemaSaveResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SceneApi.prototype, "save", null);
__decorate([
    (0, decorator_js_1.tool)('scene-create'),
    (0, decorator_js_1.title)('Create scene') // 创建场景
    ,
    (0, decorator_js_1.description)('Create new scene asset in project') // 在项目中创建新的场景资源
    ,
    (0, decorator_js_1.result)(schema_1.SchemaCreateResult),
    __param(0, (0, decorator_js_1.param)(schema_1.SchemaCreateOptions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SceneApi.prototype, "createScene", null);
__decorate([
    (0, decorator_js_1.tool)('scene-reload'),
    (0, decorator_js_1.title)('Reload scene/prefab') // 重新加载场景/预制体
    ,
    (0, decorator_js_1.description)('Reload scene/prefab') // 重新加载场景/预制体
    ,
    (0, decorator_js_1.result)(schema_1.SchemaReload),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SceneApi.prototype, "reloadScene", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL3NjZW5lL3NjZW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQWlCa0I7QUFDbEIsNERBQW9GO0FBQ3BGLHFEQUE0RjtBQUM1Riw0Q0FBeUM7QUFDekMsOENBQWlEO0FBQ2pELDJDQUEyQztBQUMzQyxpQ0FBaUM7QUFDakMscUNBQXFDO0FBQ3JDLHVEQUFzRDtBQUN0RCx5Q0FBeUM7QUFHekMsTUFBYSxRQUFRO0lBQ1YsU0FBUyxDQUFlO0lBQ3hCLElBQUksQ0FBVTtJQUNkLE1BQU0sQ0FBWTtJQUNsQixjQUFjLENBQW9CO0lBQ2xDLFFBQVEsQ0FBYztJQUU3QjtRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSx3QkFBWSxFQUFFLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGNBQU8sRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxrQkFBUyxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLG1DQUFpQixFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLHNCQUFXLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBTUssQUFBTixLQUFLLENBQUMsWUFBWTtRQUNkLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sYUFBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3hDLE1BQU0sTUFBTSxHQUFHO2dCQUNYLElBQUksRUFBRSxJQUFzQjtnQkFDNUIsSUFBSSxFQUFFLDJCQUFhLENBQUMsT0FBTzthQUM5QixDQUFDO1lBQ0YsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNSLE9BQVEsTUFBYyxDQUFDLElBQUksQ0FBQztnQkFDM0IsTUFBYyxDQUFDLE1BQU0sR0FBRyw2QkFBNkIsQ0FBQztZQUMzRCxDQUFDO1lBQ0Qs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QUFlOztJQUNoRSxJQUFBLHFCQUFNLEVBQUMsMkJBQWtCLENBQUM7SUFDUixXQUFBLElBQUEsb0JBQUssRUFBQyw0QkFBbUIsQ0FBQyxDQUFBOzs7OzJDQTBCNUM7QUFNSztJQUpMLElBQUEsbUJBQUksRUFBQyxjQUFjLENBQUM7SUFDcEIsSUFBQSxvQkFBSyxFQUFDLHFCQUFxQixDQUFDLENBQUMsYUFBYTs7SUFDMUMsSUFBQSwwQkFBVyxFQUFDLHFCQUFxQixDQUFDLENBQUMsYUFBYTs7SUFDaEQsSUFBQSxxQkFBTSxFQUFDLHFCQUFZLENBQUM7Ozs7MkNBZXBCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBTY2hlbWFPcGVuT3B0aW9ucyxcbiAgICBTY2hlbWFDbG9zZVJlc3VsdCxcbiAgICBTY2hlbWFDcmVhdGVPcHRpb25zLFxuICAgIFNjaGVtYUNyZWF0ZVJlc3VsdCxcbiAgICBTY2hlbWFDdXJyZW50UmVzdWx0LFxuICAgIFNjaGVtYU9wZW5SZXN1bHQsXG4gICAgU2NoZW1hUmVsb2FkLFxuICAgIFNjaGVtYVNhdmVSZXN1bHQsXG4gICAgVE9wZW5PcHRpb25zLFxuICAgIFRDbG9zZVJlc3VsdCxcbiAgICBUQ3JlYXRlT3B0aW9ucyxcbiAgICBUQ3JlYXRlUmVzdWx0LFxuICAgIFRDdXJyZW50UmVzdWx0LFxuICAgIFRPcGVuUmVzdWx0LFxuICAgIFRSZWxvYWQsXG4gICAgVFNhdmVSZXN1bHQsXG59IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IGRlc2NyaXB0aW9uLCBwYXJhbSwgcmVzdWx0LCB0aXRsZSwgdG9vbCB9IGZyb20gJy4uL2RlY29yYXRvci9kZWNvcmF0b3IuanMnO1xuaW1wb3J0IHsgQ09NTU9OX1NUQVRVUywgQ29tbW9uUmVzdWx0VHlwZSwgZ2V0Q29tbW9uRXJyb3JTdGF0dXMgfSBmcm9tICcuLi9iYXNlL3NjaGVtYS1iYXNlJztcbmltcG9ydCB7IFNjZW5lIH0gZnJvbSAnLi4vLi4vY29yZS9zY2VuZSc7XG5pbXBvcnQgeyBhc3NldE1hbmFnZXIgfSBmcm9tICcuLi8uLi9jb3JlL2Fzc2V0cyc7XG5pbXBvcnQgeyBDb21wb25lbnRBcGkgfSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQgeyBOb2RlQXBpIH0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7IFByZWZhYkFwaSB9IGZyb20gJy4vcHJlZmFiJztcbmltcG9ydCB7IFJlZmVyZW5jZUltYWdlQXBpIH0gZnJvbSAnLi9yZWZlcmVuY2UtaW1hZ2UnO1xuaW1wb3J0IHsgUGFydGljbGVBcGkgfSBmcm9tICcuL3BhcnRpY2xlJztcbmltcG9ydCB7IG9wdGlvbnMgfSBmcm9tICcuLi8uLi9jb3JlL2J1aWxkZXIvcGxhdGZvcm1zL2FuZHJvaWQvaTE4bi9lbic7XG5cbmV4cG9ydCBjbGFzcyBTY2VuZUFwaSB7XG4gICAgcHVibGljIGNvbXBvbmVudDogQ29tcG9uZW50QXBpO1xuICAgIHB1YmxpYyBub2RlOiBOb2RlQXBpO1xuICAgIHB1YmxpYyBwcmVmYWI6IFByZWZhYkFwaTtcbiAgICBwdWJsaWMgcmVmZXJlbmNlSW1hZ2U6IFJlZmVyZW5jZUltYWdlQXBpO1xuICAgIHB1YmxpYyBwYXJ0aWNsZTogUGFydGljbGVBcGk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnQgPSBuZXcgQ29tcG9uZW50QXBpKCk7XG4gICAgICAgIHRoaXMubm9kZSA9IG5ldyBOb2RlQXBpKCk7XG4gICAgICAgIHRoaXMucHJlZmFiID0gbmV3IFByZWZhYkFwaSgpO1xuICAgICAgICB0aGlzLnJlZmVyZW5jZUltYWdlID0gbmV3IFJlZmVyZW5jZUltYWdlQXBpKCk7XG4gICAgICAgIHRoaXMucGFydGljbGUgPSBuZXcgUGFydGljbGVBcGkoKTtcbiAgICB9XG5cbiAgICBAdG9vbCgnc2NlbmUtcXVlcnktY3VycmVudCcpXG4gICAgQHRpdGxlKCdHZXQgY3VycmVudCBvcGVuZWQgc2NlbmUvcHJlZmFiIGluZm8nKSAvLyDojrflj5blvZPliY3miZPlvIDnmoTlnLrmma8v6aKE5Yi25L2T5L+h5oGvXG4gICAgQGRlc2NyaXB0aW9uKCdHZXQgY3VycmVudCBvcGVuZWQgc2NlbmUvcHJlZmFiIGluZm8sIGlmIG5vIHNjZW5lIGlzIG9wZW5lZCwgdGhlIGRhdGEgaXMgbm90IHJldHVybmVkLicpIC8vIOiOt+WPluW9k+WJjeaJk+W8gOWcuuaZry/pooTliLbkvZPkv6Hmga/vvIzlpoLmnpzmsqHmnInmiZPlvIDvvIzov5Tlm54gbnVsbFxuICAgIEByZXN1bHQoU2NoZW1hQ3VycmVudFJlc3VsdClcbiAgICBhc3luYyBxdWVyeUN1cnJlbnQoKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRDdXJyZW50UmVzdWx0Pj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IFNjZW5lLnF1ZXJ5Q3VycmVudCgpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEgYXMgVEN1cnJlbnRSZXN1bHQsXG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSAocmVzdWx0IGFzIGFueSkuZGF0YTtcbiAgICAgICAgICAgICAgICAocmVzdWx0IGFzIGFueSkucmVhc29uID0gJ05vIHNjZW5lIGlzIGN1cnJlbnRseSBvcGVuLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAdG9vbCgnc2NlbmUtb3BlbicpXG4gICAgQHRpdGxlKCdPcGVuIHNjZW5lL3ByZWZhYicpIC8vIOaJk+W8gOWcuuaZry/pooTliLbkvZNcbiAgICBAZGVzY3JpcHRpb24oJ09wZW4gc3BlY2lmaWVkIHNjZW5lL3ByZWZhYiBhc3NldC4nKSAvLyDmiZPlvIDmjIflrprlnLrmma8v6aKE5Yi25L2T6LWE5rqQ44CCXG4gICAgQHJlc3VsdChTY2hlbWFPcGVuUmVzdWx0KVxuICAgIGFzeW5jIG9wZW4oQHBhcmFtKFNjaGVtYU9wZW5PcHRpb25zKSBvcHRpb25zOiBUT3Blbk9wdGlvbnMpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VE9wZW5SZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgU2NlbmUub3Blbih7IHVybE9yVVVJRDogb3B0aW9ucy5kYlVSTE9yVVVJRCwgaW5jbHVkZUNoaWxkcmVuOiBvcHRpb25zLmluY2x1ZGVDaGlsZHJlbiwgaW5jbHVkZUNvbXBvbmVudHM6IG9wdGlvbnMuaW5jbHVkZUNvbXBvbmVudHMgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEgYXMgVE9wZW5SZXN1bHQsXG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSksXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAdG9vbCgnc2NlbmUtY2xvc2UnKVxuICAgIEB0aXRsZSgnQ2xvc2Ugc2NlbmUvcHJlZmFiJykgLy8g5YWz6Zet5Zy65pmvL+mihOWItuS9k1xuICAgIEBkZXNjcmlwdGlvbignQ2xvc2UgY3VycmVudCBvcGVuZWQgc2NlbmUvcHJlZmFiLicpIC8vIOWFs+mXreW9k+WJjeaJk+W8gOeahOWcuuaZry/pooTliLbkvZPjgIJcbiAgICBAcmVzdWx0KFNjaGVtYUNsb3NlUmVzdWx0KVxuICAgIGFzeW5jIGNsb3NlKCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQ2xvc2VSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgU2NlbmUuY2xvc2Uoe30pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuRkFJTCxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEB0b29sKCdzY2VuZS1zYXZlJylcbiAgICBAdGl0bGUoJ1NhdmUgc2NlbmUvcHJlZmFiJykgLy8g5L+d5a2Y5Zy65pmvL+mihOWItuS9k1xuICAgIEBkZXNjcmlwdGlvbignU2F2ZSBjdXJyZW50IG9wZW5lZCBzY2VuZS9wcmVmYWIgdG8gYXNzZXQsIGluY2x1ZGluZyBzY2VuZSBub2RlIHN0cnVjdHVyZSwgY29tcG9uZW50IGRhdGEsIGFzc2V0IHJlZmVyZW5jZXMgZXRjLiBXaWxsIHVwZGF0ZSAubWV0YSBmaWxlIGFmdGVyIHNhdmUuJykgLy8g5L+d5a2Y5b2T5YmN5omT5byA55qE5Zy65pmvL+mihOWItuS9k+WIsOi1hOa6kO+8jOWMheaLrOWcuuaZr+iKgueCuee7k+aehOOAgee7hOS7tuaVsOaNruOAgei1hOa6kOW8leeUqOetieS/oeaBr+OAguS/neWtmOWQjuS8muabtOaWsOWcuuaZr+eahCAubWV0YSDmlofku7bjgIJcbiAgICBAcmVzdWx0KFNjaGVtYVNhdmVSZXN1bHQpXG4gICAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFNhdmVSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgU2NlbmUuc2F2ZSh7fSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5GQUlMLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQHRvb2woJ3NjZW5lLWNyZWF0ZScpXG4gICAgQHRpdGxlKCdDcmVhdGUgc2NlbmUnKSAvLyDliJvlu7rlnLrmma9cbiAgICBAZGVzY3JpcHRpb24oJ0NyZWF0ZSBuZXcgc2NlbmUgYXNzZXQgaW4gcHJvamVjdCcpIC8vIOWcqOmhueebruS4reWIm+W7uuaWsOeahOWcuuaZr+i1hOa6kFxuICAgIEByZXN1bHQoU2NoZW1hQ3JlYXRlUmVzdWx0KVxuICAgIGFzeW5jIGNyZWF0ZVNjZW5lKEBwYXJhbShTY2hlbWFDcmVhdGVPcHRpb25zKSBvcHRpb25zOiBUQ3JlYXRlT3B0aW9ucyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQ3JlYXRlUmVzdWx0Pj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgYXNzZXRNYW5hZ2VyLmNyZWF0ZUFzc2V0QnlUeXBlKFxuICAgICAgICAgICAgICAgICdzY2VuZScsXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5kYlVSTCxcbiAgICAgICAgICAgICAgICBvcHRpb25zLmJhc2VOYW1lLFxuICAgICAgICAgICAgICAgIHsgdGVtcGxhdGVOYW1lOiBvcHRpb25zLnRlbXBsYXRlVHlwZSA/PyAnMmQnIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgZGF0YTogVENyZWF0ZVJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICBhc3NldE5hbWU6IGFzc2V0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogYXNzZXRJbmZvLnV1aWQsXG4gICAgICAgICAgICAgICAgYXNzZXRVcmw6IGFzc2V0SW5mby51cmwsXG4gICAgICAgICAgICAgICAgYXNzZXRUeXBlOiBhc3NldEluZm8udHlwZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAdG9vbCgnc2NlbmUtcmVsb2FkJylcbiAgICBAdGl0bGUoJ1JlbG9hZCBzY2VuZS9wcmVmYWInKSAvLyDph43mlrDliqDovb3lnLrmma8v6aKE5Yi25L2TXG4gICAgQGRlc2NyaXB0aW9uKCdSZWxvYWQgc2NlbmUvcHJlZmFiJykgLy8g6YeN5paw5Yqg6L295Zy65pmvL+mihOWItuS9k1xuICAgIEByZXN1bHQoU2NoZW1hUmVsb2FkKVxuICAgIGFzeW5jIHJlbG9hZFNjZW5lKCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUmVsb2FkPj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IFNjZW5lLnJlbG9hZCh7fSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhIGFzIFRSZWxvYWQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=