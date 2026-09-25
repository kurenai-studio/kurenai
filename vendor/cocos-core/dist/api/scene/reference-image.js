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
exports.ReferenceImageApi = void 0;
/** Public AI/MCP facade for formal reference-image operations. */
const schema_base_1 = require("../base/schema-base");
const decorator_1 = require("../decorator/decorator");
const scene_1 = require("../../core/scene");
const reference_image_schema_1 = require("./reference-image-schema");
/** Formal, semantic MCP operations. Ephemeral preview APIs remain scene-Webview only. */
class ReferenceImageApi {
    async query() {
        return this.execute(() => scene_1.Scene.ReferenceImage.getState());
    }
    async add(options) {
        return this.execute(() => scene_1.Scene.ReferenceImage.addAndSelect(options));
    }
    async delete(options) {
        return this.execute(() => scene_1.Scene.ReferenceImage.remove(options));
    }
    async select(options) {
        return this.execute(() => scene_1.Scene.ReferenceImage.select(options));
    }
    async clearBinding() {
        return this.execute(() => scene_1.Scene.ReferenceImage.clearBinding());
    }
    async setVisible(options) {
        return this.execute(() => scene_1.Scene.ReferenceImage.setVisible(options));
    }
    async refresh() {
        return this.execute(() => scene_1.Scene.ReferenceImage.refresh());
    }
    async setParameters(patch) {
        return this.execute(() => scene_1.Scene.ReferenceImage.commitParameters({ patch }));
    }
    async execute(operation) {
        try {
            return { code: schema_base_1.COMMON_STATUS.SUCCESS, data: await operation() };
        }
        catch (error) {
            return { code: schema_base_1.COMMON_STATUS.FAIL, reason: error instanceof Error ? error.message : String(error) };
        }
    }
}
exports.ReferenceImageApi = ReferenceImageApi;
__decorate([
    (0, decorator_1.tool)('reference-image-query'),
    (0, decorator_1.title)('Query reference image state'),
    (0, decorator_1.description)('Get the current reference-image library, current binding, parameters and effective visibility.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "query", null);
__decorate([
    (0, decorator_1.tool)('reference-image-add'),
    (0, decorator_1.title)('Add and select reference image'),
    (0, decorator_1.description)('Validate a local PNG, JPG, or JPEG, add it to the local library, and bind it to the current scene or prefab.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __param(0, (0, decorator_1.param)(reference_image_schema_1.SchemaReferenceImagePath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "add", null);
__decorate([
    (0, decorator_1.tool)('reference-image-delete'),
    (0, decorator_1.title)('Delete reference image'),
    (0, decorator_1.description)('Remove a reference image record and all scene bindings. The original local file is not deleted.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __param(0, (0, decorator_1.param)(reference_image_schema_1.SchemaReferenceImagePath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "delete", null);
__decorate([
    (0, decorator_1.tool)('reference-image-select'),
    (0, decorator_1.title)('Select reference image'),
    (0, decorator_1.description)('Bind an existing reference image to the current scene or prefab.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __param(0, (0, decorator_1.param)(reference_image_schema_1.SchemaReferenceImagePath)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "select", null);
__decorate([
    (0, decorator_1.tool)('reference-image-clear-binding'),
    (0, decorator_1.title)('Clear current reference image binding'),
    (0, decorator_1.description)('Unbind the reference image from the current scene or prefab while preserving the local library and other bindings.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "clearBinding", null);
__decorate([
    (0, decorator_1.tool)('reference-image-set-visible'),
    (0, decorator_1.title)('Set reference image visibility'),
    (0, decorator_1.description)('Set the persisted desired visibility. Reference images remain hidden while the editor is not in 2D mode.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __param(0, (0, decorator_1.param)(reference_image_schema_1.SchemaReferenceImageVisibility)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "setVisible", null);
__decorate([
    (0, decorator_1.tool)('reference-image-refresh'),
    (0, decorator_1.title)('Refresh current reference image'),
    (0, decorator_1.description)('Reload the current reference image from its original local path.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "refresh", null);
__decorate([
    (0, decorator_1.tool)('reference-image-set-parameters'),
    (0, decorator_1.title)('Set reference image parameters'),
    (0, decorator_1.description)('Persist finite position or scale values and opacity from 0 to 100 for the image bound to the current scene or prefab.'),
    (0, decorator_1.result)(reference_image_schema_1.SchemaReferenceImageState),
    __param(0, (0, decorator_1.param)(reference_image_schema_1.SchemaReferenceImageParameters)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferenceImageApi.prototype, "setParameters", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlLWltYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9zY2VuZS9yZWZlcmVuY2UtaW1hZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQWtFO0FBQ2xFLHFEQUFzRTtBQUN0RSxzREFBaUY7QUFDakYsNENBQXlDO0FBQ3pDLHFFQVNrQztBQUVsQyx5RkFBeUY7QUFDekYsTUFBYSxpQkFBaUI7SUFLcEIsQUFBTixLQUFLLENBQUMsS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQU1LLEFBQU4sS0FBSyxDQUFDLEdBQUcsQ0FBa0MsT0FBNEI7UUFDbkUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQU1LLEFBQU4sS0FBSyxDQUFDLE1BQU0sQ0FBa0MsT0FBNEI7UUFDdEUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQU1LLEFBQU4sS0FBSyxDQUFDLE1BQU0sQ0FBa0MsT0FBNEI7UUFDdEUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQU1LLEFBQU4sS0FBSyxDQUFDLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUs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QyxrREFBeUIsQ0FBQztJQUNoQixXQUFBLElBQUEsaUJBQUssRUFBQyx1REFBOEIsQ0FBQyxDQUFBOzs7O21EQUV0RDtBQU1LO0lBSkwsSUFBQSxnQkFBSSxFQUFDLHlCQUF5QixDQUFDO0lBQy9CLElBQUEsaUJBQUssRUFBQyxpQ0FBaUMsQ0FBQztJQUN4QyxJQUFBLHVCQUFXLEVBQUMsa0VBQWtFLENBQUM7SUFDL0UsSUFBQSxrQkFBTSxFQUFDLGtEQUF5QixDQUFDOzs7O2dEQUdqQztBQU1LO0lBSkwsSUFBQSxnQkFBSSxFQUFDLGdDQUFnQyxDQUFDO0lBQ3RDLElBQUEsaUJBQUssRUFBQyxnQ0FBZ0MsQ0FBQztJQUN2QyxJQUFBLHVCQUFXLEVBQUMsdUhBQXVILENBQUM7SUFDcEksSUFBQSxrQkFBTSxFQUFDLGtEQUF5QixDQUFDO0lBQ2IsV0FBQSxJQUFBLGlCQUFLLEVBQUMsdURBQThCLENBQUMsQ0FBQTs7OztzREFFekQiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogUHVibGljIEFJL01DUCBmYWNhZGUgZm9yIGZvcm1hbCByZWZlcmVuY2UtaW1hZ2Ugb3BlcmF0aW9ucy4gKi9cbmltcG9ydCB7IENPTU1PTl9TVEFUVVMsIENvbW1vblJlc3VsdFR5cGUgfSBmcm9tICcuLi9iYXNlL3NjaGVtYS1iYXNlJztcbmltcG9ydCB7IGRlc2NyaXB0aW9uLCBwYXJhbSwgcmVzdWx0LCB0aXRsZSwgdG9vbCB9IGZyb20gJy4uL2RlY29yYXRvci9kZWNvcmF0b3InO1xuaW1wb3J0IHsgU2NlbmUgfSBmcm9tICcuLi8uLi9jb3JlL3NjZW5lJztcbmltcG9ydCB7XG4gICAgU2NoZW1hUmVmZXJlbmNlSW1hZ2VQYXJhbWV0ZXJzLFxuICAgIFNjaGVtYVJlZmVyZW5jZUltYWdlUGF0aCxcbiAgICBTY2hlbWFSZWZlcmVuY2VJbWFnZVN0YXRlLFxuICAgIFNjaGVtYVJlZmVyZW5jZUltYWdlVmlzaWJpbGl0eSxcbiAgICBUUmVmZXJlbmNlSW1hZ2VQYXJhbWV0ZXJzLFxuICAgIFRSZWZlcmVuY2VJbWFnZVBhdGgsXG4gICAgVFJlZmVyZW5jZUltYWdlU3RhdGUsXG4gICAgVFJlZmVyZW5jZUltYWdlVmlzaWJpbGl0eSxcbn0gZnJvbSAnLi9yZWZlcmVuY2UtaW1hZ2Utc2NoZW1hJztcblxuLyoqIEZvcm1hbCwgc2VtYW50aWMgTUNQIG9wZXJhdGlvbnMuIEVwaGVtZXJhbCBwcmV2aWV3IEFQSXMgcmVtYWluIHNjZW5lLVdlYnZpZXcgb25seS4gKi9cbmV4cG9ydCBjbGFzcyBSZWZlcmVuY2VJbWFnZUFwaSB7XG4gICAgQHRvb2woJ3JlZmVyZW5jZS1pbWFnZS1xdWVyeScpXG4gICAgQHRpdGxlKCdRdWVyeSByZWZlcmVuY2UgaW1hZ2Ugc3RhdGUnKVxuICAgIEBkZXNjcmlwdGlvbignR2V0IHRoZSBjdXJyZW50IHJlZmVyZW5jZS1pbWFnZSBsaWJyYXJ5LCBjdXJyZW50IGJpbmRpbmcsIHBhcmFtZXRlcnMgYW5kIGVmZmVjdGl2ZSB2aXNpYmlsaXR5LicpXG4gICAgQHJlc3VsdChTY2hlbWFSZWZlcmVuY2VJbWFnZVN0YXRlKVxuICAgIGFzeW5jIHF1ZXJ5KCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUmVmZXJlbmNlSW1hZ2VTdGF0ZT4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZSgoKSA9PiBTY2VuZS5SZWZlcmVuY2VJbWFnZS5nZXRTdGF0ZSgpKTtcbiAgICB9XG5cbiAgICBAdG9vbCgncmVmZXJlbmNlLWltYWdlLWFkZCcpXG4gICAgQHRpdGxlKCdBZGQgYW5kIHNlbGVjdCByZWZlcmVuY2UgaW1hZ2UnKVxuICAgIEBkZXNjcmlwdGlvbignVmFsaWRhdGUgYSBsb2NhbCBQTkcsIEpQRywgb3IgSlBFRywgYWRkIGl0IHRvIHRoZSBsb2NhbCBsaWJyYXJ5LCBhbmQgYmluZCBpdCB0byB0aGUgY3VycmVudCBzY2VuZSBvciBwcmVmYWIuJylcbiAgICBAcmVzdWx0KFNjaGVtYVJlZmVyZW5jZUltYWdlU3RhdGUpXG4gICAgYXN5bmMgYWRkKEBwYXJhbShTY2hlbWFSZWZlcmVuY2VJbWFnZVBhdGgpIG9wdGlvbnM6IFRSZWZlcmVuY2VJbWFnZVBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFJlZmVyZW5jZUltYWdlU3RhdGU+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGUoKCkgPT4gU2NlbmUuUmVmZXJlbmNlSW1hZ2UuYWRkQW5kU2VsZWN0KG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICBAdG9vbCgncmVmZXJlbmNlLWltYWdlLWRlbGV0ZScpXG4gICAgQHRpdGxlKCdEZWxldGUgcmVmZXJlbmNlIGltYWdlJylcbiAgICBAZGVzY3JpcHRpb24oJ1JlbW92ZSBhIHJlZmVyZW5jZSBpbWFnZSByZWNvcmQgYW5kIGFsbCBzY2VuZSBiaW5kaW5ncy4gVGhlIG9yaWdpbmFsIGxvY2FsIGZpbGUgaXMgbm90IGRlbGV0ZWQuJylcbiAgICBAcmVzdWx0KFNjaGVtYVJlZmVyZW5jZUltYWdlU3RhdGUpXG4gICAgYXN5bmMgZGVsZXRlKEBwYXJhbShTY2hlbWFSZWZlcmVuY2VJbWFnZVBhdGgpIG9wdGlvbnM6IFRSZWZlcmVuY2VJbWFnZVBhdGgpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFJlZmVyZW5jZUltYWdlU3RhdGU+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGUoKCkgPT4gU2NlbmUuUmVmZXJlbmNlSW1hZ2UucmVtb3ZlKG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICBAdG9vbCgncmVmZXJlbmNlLWltYWdlLXNlbGVjdCcpXG4gICAgQHRpdGxlKCdTZWxlY3QgcmVmZXJlbmNlIGltYWdlJylcbiAgICBAZGVzY3JpcHRpb24oJ0JpbmQgYW4gZXhpc3RpbmcgcmVmZXJlbmNlIGltYWdlIHRvIHRoZSBjdXJyZW50IHNjZW5lIG9yIHByZWZhYi4nKVxuICAgIEByZXN1bHQoU2NoZW1hUmVmZXJlbmNlSW1hZ2VTdGF0ZSlcbiAgICBhc3luYyBzZWxlY3QoQHBhcmFtKFNjaGVtYVJlZmVyZW5jZUltYWdlUGF0aCkgb3B0aW9uczogVFJlZmVyZW5jZUltYWdlUGF0aCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUmVmZXJlbmNlSW1hZ2VTdGF0ZT4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZSgoKSA9PiBTY2VuZS5SZWZlcmVuY2VJbWFnZS5zZWxlY3Qob3B0aW9ucykpO1xuICAgIH1cblxuICAgIEB0b29sKCdyZWZlcmVuY2UtaW1hZ2UtY2xlYXItYmluZGluZycpXG4gICAgQHRpdGxlKCdDbGVhciBjdXJyZW50IHJlZmVyZW5jZSBpbWFnZSBiaW5kaW5nJylcbiAgICBAZGVzY3JpcHRpb24oJ1VuYmluZCB0aGUgcmVmZXJlbmNlIGltYWdlIGZyb20gdGhlIGN1cnJlbnQgc2NlbmUgb3IgcHJlZmFiIHdoaWxlIHByZXNlcnZpbmcgdGhlIGxvY2FsIGxpYnJhcnkgYW5kIG90aGVyIGJpbmRpbmdzLicpXG4gICAgQHJlc3VsdChTY2hlbWFSZWZlcmVuY2VJbWFnZVN0YXRlKVxuICAgIGFzeW5jIGNsZWFyQmluZGluZygpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFJlZmVyZW5jZUltYWdlU3RhdGU+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGUoKCkgPT4gU2NlbmUuUmVmZXJlbmNlSW1hZ2UuY2xlYXJCaW5kaW5nKCkpO1xuICAgIH1cblxuICAgIEB0b29sKCdyZWZlcmVuY2UtaW1hZ2Utc2V0LXZpc2libGUnKVxuICAgIEB0aXRsZSgnU2V0IHJlZmVyZW5jZSBpbWFnZSB2aXNpYmlsaXR5JylcbiAgICBAZGVzY3JpcHRpb24oJ1NldCB0aGUgcGVyc2lzdGVkIGRlc2lyZWQgdmlzaWJpbGl0eS4gUmVmZXJlbmNlIGltYWdlcyByZW1haW4gaGlkZGVuIHdoaWxlIHRoZSBlZGl0b3IgaXMgbm90IGluIDJEIG1vZGUuJylcbiAgICBAcmVzdWx0KFNjaGVtYVJlZmVyZW5jZUltYWdlU3RhdGUpXG4gICAgYXN5bmMgc2V0VmlzaWJsZShAcGFyYW0oU2NoZW1hUmVmZXJlbmNlSW1hZ2VWaXNpYmlsaXR5KSBvcHRpb25zOiBUUmVmZXJlbmNlSW1hZ2VWaXNpYmlsaXR5KTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRSZWZlcmVuY2VJbWFnZVN0YXRlPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjdXRlKCgpID0+IFNjZW5lLlJlZmVyZW5jZUltYWdlLnNldFZpc2libGUob3B0aW9ucykpO1xuICAgIH1cblxuICAgIEB0b29sKCdyZWZlcmVuY2UtaW1hZ2UtcmVmcmVzaCcpXG4gICAgQHRpdGxlKCdSZWZyZXNoIGN1cnJlbnQgcmVmZXJlbmNlIGltYWdlJylcbiAgICBAZGVzY3JpcHRpb24oJ1JlbG9hZCB0aGUgY3VycmVudCByZWZlcmVuY2UgaW1hZ2UgZnJvbSBpdHMgb3JpZ2luYWwgbG9jYWwgcGF0aC4nKVxuICAgIEByZXN1bHQoU2NoZW1hUmVmZXJlbmNlSW1hZ2VTdGF0ZSlcbiAgICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUmVmZXJlbmNlSW1hZ2VTdGF0ZT4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZSgoKSA9PiBTY2VuZS5SZWZlcmVuY2VJbWFnZS5yZWZyZXNoKCkpO1xuICAgIH1cblxuICAgIEB0b29sKCdyZWZlcmVuY2UtaW1hZ2Utc2V0LXBhcmFtZXRlcnMnKVxuICAgIEB0aXRsZSgnU2V0IHJlZmVyZW5jZSBpbWFnZSBwYXJhbWV0ZXJzJylcbiAgICBAZGVzY3JpcHRpb24oJ1BlcnNpc3QgZmluaXRlIHBvc2l0aW9uIG9yIHNjYWxlIHZhbHVlcyBhbmQgb3BhY2l0eSBmcm9tIDAgdG8gMTAwIGZvciB0aGUgaW1hZ2UgYm91bmQgdG8gdGhlIGN1cnJlbnQgc2NlbmUgb3IgcHJlZmFiLicpXG4gICAgQHJlc3VsdChTY2hlbWFSZWZlcmVuY2VJbWFnZVN0YXRlKVxuICAgIGFzeW5jIHNldFBhcmFtZXRlcnMoQHBhcmFtKFNjaGVtYVJlZmVyZW5jZUltYWdlUGFyYW1ldGVycykgcGF0Y2g6IFRSZWZlcmVuY2VJbWFnZVBhcmFtZXRlcnMpOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFJlZmVyZW5jZUltYWdlU3RhdGU+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGUoKCkgPT4gU2NlbmUuUmVmZXJlbmNlSW1hZ2UuY29tbWl0UGFyYW1ldGVycyh7IHBhdGNoIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGUob3BlcmF0aW9uOiAoKSA9PiBQcm9taXNlPFRSZWZlcmVuY2VJbWFnZVN0YXRlPik6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUmVmZXJlbmNlSW1hZ2VTdGF0ZT4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUywgZGF0YTogYXdhaXQgb3BlcmF0aW9uKCkgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IENPTU1PTl9TVEFUVVMuRkFJTCwgcmVhc29uOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikgfTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==