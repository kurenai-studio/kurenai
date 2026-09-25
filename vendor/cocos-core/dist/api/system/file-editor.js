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
exports.FileEditorApi = void 0;
const file_editor_schema_1 = require("./file-editor-schema");
const decorator_js_1 = require("../decorator/decorator.js");
const schema_base_1 = require("../base/schema-base");
const file_edit_1 = require("../../core/filesystem/file-edit");
class FileEditorApi {
    async insertTextAtLine(param) {
        try {
            const result = await (0, file_edit_1.insertTextAtLine)(param.dbURL, param.fileType, param.lineNumber, param.text);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async eraseLinesInRange(param) {
        try {
            const result = await (0, file_edit_1.eraseLinesInRange)(param.dbURL, param.fileType, param.startLine, param.endLine);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async replaceTextInFile(param) {
        try {
            const result = await (0, file_edit_1.replaceTextInFile)(param.dbURL, param.fileType, param.targetText, param.replacementText, param.regex);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    async queryFileText(param) {
        try {
            const result = await (0, file_edit_1.queryLinesInFile)(param.dbURL, param.fileType, param.startLine, param.lineCount);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: result,
            };
        }
        catch (e) {
            return {
                code: (0, schema_base_1.getCommonErrorStatus)(e),
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
}
exports.FileEditorApi = FileEditorApi;
__decorate([
    (0, decorator_js_1.tool)('file-insert-text'),
    (0, decorator_js_1.title)('Insert content before line n of the file') // 在文件第n行前插入内容
    ,
    (0, decorator_js_1.description)('Insert content before line n of the file, return success or failure. If the line number is greater than the total number of lines in the file, insert it at the end of the file.') // 在文件第 n 行前插入内容，返回成功或者失败。行号大于文件总行数时，插入到文件末尾
    ,
    (0, decorator_js_1.result)(file_editor_schema_1.SchemaFileEditorResult),
    __param(0, (0, decorator_js_1.param)(file_editor_schema_1.SchemaInsertTextAtLineInfo)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileEditorApi.prototype, "insertTextAtLine", null);
__decorate([
    (0, decorator_js_1.tool)('file-delete-text'),
    (0, decorator_js_1.title)('Delete content between startLine and endLine of the file') // 删除文件第 startLine 到 endLine 之间的内容
    ,
    (0, decorator_js_1.description)('Delete content between startLine and endLine of the file, return success or failure') // 删除文件第 startLine 到 endLine 之间的内容，返回成功或者失败
    ,
    (0, decorator_js_1.result)(file_editor_schema_1.SchemaFileEditorResult),
    __param(0, (0, decorator_js_1.param)(file_editor_schema_1.SchemaEraseLinesInRangeInfo)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileEditorApi.prototype, "eraseLinesInRange", null);
__decorate([
    (0, decorator_js_1.tool)('file-replace-text'),
    (0, decorator_js_1.title)('Replace target text with replacement text in the file') // 替换文件中的 目标文本 为 替换文本
    ,
    (0, decorator_js_1.description)('Replace target text (including regular expressions) with replacement text in the file. Only replace the unique occurrence of the target text (fail if there are multiple), return success or failure.') // 替换文件中的 目标文本(含正则表达式) 为 替换文本，只替换唯一出现的目标文本（如果有多个视为失败），返回成功或者失败
    ,
    (0, decorator_js_1.result)(file_editor_schema_1.SchemaFileEditorResult),
    __param(0, (0, decorator_js_1.param)(file_editor_schema_1.SchemaReplaceTextInFileInfo)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileEditorApi.prototype, "replaceTextInFile", null);
__decorate([
    (0, decorator_js_1.tool)('file-query-text'),
    (0, decorator_js_1.title)('Query content of specified lines in the file') // 查询文件指定行数的内容
    ,
    (0, decorator_js_1.description)('Query content of specified number of lines starting from startLine in the file, return the array of queried content') // 查询文件从 startLine 行开始的指定行数内容，返回查询到的内容数组
    ,
    (0, decorator_js_1.result)(file_editor_schema_1.SchemaFileQueryTextResult),
    __param(0, (0, decorator_js_1.param)(file_editor_schema_1.SchemaQueryFileTextInfo)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileEditorApi.prototype, "queryFileText", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1lZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL3N5c3RlbS9maWxlLWVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2REFjOEI7QUFFOUIsNERBQW9GO0FBQ3BGLHFEQUE0RjtBQUM1RiwrREFBMkg7QUFFM0gsTUFBYSxhQUFhO0lBS2hCLEFBQU4sS0FBSyxDQUFDLGdCQUFnQixDQUFvQyxLQUE0QjtRQUNsRixJQUFJLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsNEJBQWdCLEVBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pHLE9BQU87Z0JBQ0gsSUFBSSxFQUFFLDJCQUFhLENBQUMsT0FBTztnQkFDM0IsSUFBSSxFQUFFLE1BQU07YUFDZixDQUFDO1FBQ04sQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPO2dCQUNILElBQUksRUFBRSxJQUFBLGtDQUFvQixFQUFDLENBQUMsQ0FBQztnQkFDN0IsTUFBTSxFQUFFLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDckQsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBTUssQUFBTixLQUFLLENBQUMsaUJBQWlCLENBQXFDLEtBQTZCO1FBQ3JGLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSw2QkFBaUIsRUFBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEcsT0FBTztnQkFDSCxJQUFJLEVBQUUsMkJBQWEs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LDhEQUE4RDs7SUFDblIsSUFBQSxxQkFBTSxFQUFDLDJDQUFzQixDQUFDO0lBQ04sV0FBQSxJQUFBLG9CQUFLLEVBQUMsZ0RBQTJCLENBQUMsQ0FBQTs7OztzREFhMUQ7QUFNSztJQUpMLElBQUEsbUJBQUksRUFBQyxpQkFBaUIsQ0FBQztJQUN2QixJQUFBLG9CQUFLLEVBQUMsOENBQThDLENBQUMsQ0FBQyxjQUFjOztJQUNwRSxJQUFBLDBCQUFXLEVBQUMscUhBQXFILENBQUMsQ0FBQyx3Q0FBd0M7O0lBQzNLLElBQUEscUJBQU0sRUFBQyw4Q0FBeUIsQ0FBQztJQUNiLFdBQUEsSUFBQSxvQkFBSyxFQUFDLDRDQUF1QixDQUFDLENBQUE7Ozs7a0RBYWxEIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQge1xuICAgIFNjaGVtYUluc2VydFRleHRBdExpbmVJbmZvLFxuICAgIFNjaGVtYUVyYXNlTGluZXNJblJhbmdlSW5mbyxcbiAgICBTY2hlbWFSZXBsYWNlVGV4dEluRmlsZUluZm8sXG4gICAgU2NoZW1hRmlsZUVkaXRvclJlc3VsdCxcblxuICAgIFRJbnNlcnRUZXh0QXRMaW5lSW5mbyxcbiAgICBURmlsZUVkaXRvclJlc3VsdCxcbiAgICBURXJhc2VMaW5lc0luUmFuZ2VJbmZvLFxuICAgIFRSZXBsYWNlVGV4dEluRmlsZUluZm8sXG4gICAgU2NoZW1hUXVlcnlGaWxlVGV4dEluZm8sXG4gICAgVFF1ZXJ5RmlsZVRleHRJbmZvLFxuICAgIFRGaWxlUXVlcnlUZXh0UmVzdWx0LFxuICAgIFNjaGVtYUZpbGVRdWVyeVRleHRSZXN1bHQsXG59IGZyb20gJy4vZmlsZS1lZGl0b3Itc2NoZW1hJztcblxuaW1wb3J0IHsgZGVzY3JpcHRpb24sIHBhcmFtLCByZXN1bHQsIHRpdGxlLCB0b29sIH0gZnJvbSAnLi4vZGVjb3JhdG9yL2RlY29yYXRvci5qcyc7XG5pbXBvcnQgeyBDT01NT05fU1RBVFVTLCBDb21tb25SZXN1bHRUeXBlLCBnZXRDb21tb25FcnJvclN0YXR1cyB9IGZyb20gJy4uL2Jhc2Uvc2NoZW1hLWJhc2UnO1xuaW1wb3J0IHsgaW5zZXJ0VGV4dEF0TGluZSwgZXJhc2VMaW5lc0luUmFuZ2UsIHJlcGxhY2VUZXh0SW5GaWxlLCBxdWVyeUxpbmVzSW5GaWxlIH0gZnJvbSAnLi4vLi4vY29yZS9maWxlc3lzdGVtL2ZpbGUtZWRpdCc7XG5cbmV4cG9ydCBjbGFzcyBGaWxlRWRpdG9yQXBpIHtcbiAgICBAdG9vbCgnZmlsZS1pbnNlcnQtdGV4dCcpXG4gICAgQHRpdGxlKCdJbnNlcnQgY29udGVudCBiZWZvcmUgbGluZSBuIG9mIHRoZSBmaWxlJykgLy8g5Zyo5paH5Lu256ysbuihjOWJjeaPkuWFpeWGheWuuVxuICAgIEBkZXNjcmlwdGlvbignSW5zZXJ0IGNvbnRlbnQgYmVmb3JlIGxpbmUgbiBvZiB0aGUgZmlsZSwgcmV0dXJuIHN1Y2Nlc3Mgb3IgZmFpbHVyZS4gSWYgdGhlIGxpbmUgbnVtYmVyIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdG90YWwgbnVtYmVyIG9mIGxpbmVzIGluIHRoZSBmaWxlLCBpbnNlcnQgaXQgYXQgdGhlIGVuZCBvZiB0aGUgZmlsZS4nKSAvLyDlnKjmlofku7bnrKwgbiDooYzliY3mj5LlhaXlhoXlrrnvvIzov5Tlm57miJDlip/miJbogIXlpLHotKXjgILooYzlj7flpKfkuo7mlofku7bmgLvooYzmlbDml7bvvIzmj5LlhaXliLDmlofku7bmnKvlsL5cbiAgICBAcmVzdWx0KFNjaGVtYUZpbGVFZGl0b3JSZXN1bHQpXG4gICAgYXN5bmMgaW5zZXJ0VGV4dEF0TGluZShAcGFyYW0oU2NoZW1hSW5zZXJ0VGV4dEF0TGluZUluZm8pIHBhcmFtOiBUSW5zZXJ0VGV4dEF0TGluZUluZm8pOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEZpbGVFZGl0b3JSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBpbnNlcnRUZXh0QXRMaW5lKHBhcmFtLmRiVVJMLCBwYXJhbS5maWxlVHlwZSwgcGFyYW0ubGluZU51bWJlciwgcGFyYW0udGV4dCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiByZXN1bHQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGdldENvbW1vbkVycm9yU3RhdHVzKGUpLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQHRvb2woJ2ZpbGUtZGVsZXRlLXRleHQnKVxuICAgIEB0aXRsZSgnRGVsZXRlIGNvbnRlbnQgYmV0d2VlbiBzdGFydExpbmUgYW5kIGVuZExpbmUgb2YgdGhlIGZpbGUnKSAvLyDliKDpmaTmlofku7bnrKwgc3RhcnRMaW5lIOWIsCBlbmRMaW5lIOS5i+mXtOeahOWGheWuuVxuICAgIEBkZXNjcmlwdGlvbignRGVsZXRlIGNvbnRlbnQgYmV0d2VlbiBzdGFydExpbmUgYW5kIGVuZExpbmUgb2YgdGhlIGZpbGUsIHJldHVybiBzdWNjZXNzIG9yIGZhaWx1cmUnKSAvLyDliKDpmaTmlofku7bnrKwgc3RhcnRMaW5lIOWIsCBlbmRMaW5lIOS5i+mXtOeahOWGheWuue+8jOi/lOWbnuaIkOWKn+aIluiAheWksei0pVxuICAgIEByZXN1bHQoU2NoZW1hRmlsZUVkaXRvclJlc3VsdClcbiAgICBhc3luYyBlcmFzZUxpbmVzSW5SYW5nZShAcGFyYW0oU2NoZW1hRXJhc2VMaW5lc0luUmFuZ2VJbmZvKSBwYXJhbTogVEVyYXNlTGluZXNJblJhbmdlSW5mbyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxURmlsZUVkaXRvclJlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGVyYXNlTGluZXNJblJhbmdlKHBhcmFtLmRiVVJMLCBwYXJhbS5maWxlVHlwZSwgcGFyYW0uc3RhcnRMaW5lLCBwYXJhbS5lbmRMaW5lKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGE6IHJlc3VsdCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSksXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAdG9vbCgnZmlsZS1yZXBsYWNlLXRleHQnKVxuICAgIEB0aXRsZSgnUmVwbGFjZSB0YXJnZXQgdGV4dCB3aXRoIHJlcGxhY2VtZW50IHRleHQgaW4gdGhlIGZpbGUnKSAvLyDmm7/mjaLmlofku7bkuK3nmoQg55uu5qCH5paH5pysIOS4uiDmm7/mjaLmlofmnKxcbiAgICBAZGVzY3JpcHRpb24oJ1JlcGxhY2UgdGFyZ2V0IHRleHQgKGluY2x1ZGluZyByZWd1bGFyIGV4cHJlc3Npb25zKSB3aXRoIHJlcGxhY2VtZW50IHRleHQgaW4gdGhlIGZpbGUuIE9ubHkgcmVwbGFjZSB0aGUgdW5pcXVlIG9jY3VycmVuY2Ugb2YgdGhlIHRhcmdldCB0ZXh0IChmYWlsIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSksIHJldHVybiBzdWNjZXNzIG9yIGZhaWx1cmUuJykgLy8g5pu/5o2i5paH5Lu25Lit55qEIOebruagh+aWh+acrCjlkKvmraPliJnooajovr7lvI8pIOS4uiDmm7/mjaLmlofmnKzvvIzlj6rmm7/mjaLllK/kuIDlh7rnjrDnmoTnm67moIfmlofmnKzvvIjlpoLmnpzmnInlpJrkuKrop4bkuLrlpLHotKXvvInvvIzov5Tlm57miJDlip/miJbogIXlpLHotKVcbiAgICBAcmVzdWx0KFNjaGVtYUZpbGVFZGl0b3JSZXN1bHQpXG4gICAgYXN5bmMgcmVwbGFjZVRleHRJbkZpbGUoQHBhcmFtKFNjaGVtYVJlcGxhY2VUZXh0SW5GaWxlSW5mbykgcGFyYW06IFRSZXBsYWNlVGV4dEluRmlsZUluZm8pOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VEZpbGVFZGl0b3JSZXN1bHQ+PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXBsYWNlVGV4dEluRmlsZShwYXJhbS5kYlVSTCwgcGFyYW0uZmlsZVR5cGUsIHBhcmFtLnRhcmdldFRleHQsIHBhcmFtLnJlcGxhY2VtZW50VGV4dCwgcGFyYW0ucmVnZXgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsXG4gICAgICAgICAgICAgICAgZGF0YTogcmVzdWx0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBnZXRDb21tb25FcnJvclN0YXR1cyhlKSxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEB0b29sKCdmaWxlLXF1ZXJ5LXRleHQnKVxuICAgIEB0aXRsZSgnUXVlcnkgY29udGVudCBvZiBzcGVjaWZpZWQgbGluZXMgaW4gdGhlIGZpbGUnKSAvLyDmn6Xor6Lmlofku7bmjIflrprooYzmlbDnmoTlhoXlrrlcbiAgICBAZGVzY3JpcHRpb24oJ1F1ZXJ5IGNvbnRlbnQgb2Ygc3BlY2lmaWVkIG51bWJlciBvZiBsaW5lcyBzdGFydGluZyBmcm9tIHN0YXJ0TGluZSBpbiB0aGUgZmlsZSwgcmV0dXJuIHRoZSBhcnJheSBvZiBxdWVyaWVkIGNvbnRlbnQnKSAvLyDmn6Xor6Lmlofku7bku44gc3RhcnRMaW5lIOihjOW8gOWni+eahOaMh+WumuihjOaVsOWGheWuue+8jOi/lOWbnuafpeivouWIsOeahOWGheWuueaVsOe7hFxuICAgIEByZXN1bHQoU2NoZW1hRmlsZVF1ZXJ5VGV4dFJlc3VsdClcbiAgICBhc3luYyBxdWVyeUZpbGVUZXh0KEBwYXJhbShTY2hlbWFRdWVyeUZpbGVUZXh0SW5mbykgcGFyYW06IFRRdWVyeUZpbGVUZXh0SW5mbyk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxURmlsZVF1ZXJ5VGV4dFJlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHF1ZXJ5TGluZXNJbkZpbGUocGFyYW0uZGJVUkwsIHBhcmFtLmZpbGVUeXBlLCBwYXJhbS5zdGFydExpbmUsIHBhcmFtLmxpbmVDb3VudCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiByZXN1bHQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGdldENvbW1vbkVycm9yU3RhdHVzKGUpLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxufVxuIl19