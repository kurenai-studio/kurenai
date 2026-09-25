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
exports.SystemApi = void 0;
const system_schema_1 = require("./system-schema");
const decorator_js_1 = require("../decorator/decorator.js");
const schema_base_1 = require("../base/schema-base");
const console_1 = require("../../core/base/console");
const file_editor_1 = require("./file-editor");
class SystemApi {
    fileEditor;
    constructor() {
        this.fileEditor = new file_editor_1.FileEditorApi();
    }
    /**
     * Query CLI log information // 查询 cli 日志信息
     */
    async queryLogs(queryParam) {
        try {
            const logs = console_1.newConsole.queryLogs(queryParam.number, queryParam.logLevel);
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: logs,
            };
        }
        catch (e) {
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
    /**
     * Clear CLI log information // 清除 cli 日志信息
     */
    async clearLogs() {
        try {
            console_1.newConsole.clearLogs();
            return {
                code: schema_base_1.COMMON_STATUS.SUCCESS,
                data: true,
            };
        }
        catch (e) {
            return {
                code: schema_base_1.COMMON_STATUS.FAIL,
                reason: e instanceof Error ? e.message : String(e)
            };
        }
    }
}
exports.SystemApi = SystemApi;
__decorate([
    (0, decorator_js_1.tool)('system-query-logs'),
    (0, decorator_js_1.title)('Query CLI logs') // 查询 cli 日志
    ,
    (0, decorator_js_1.description)('Returns log information generated after executing CLI. The first parameter refers to returning the last n lines of log information, loglevel is the log level to query, such as Error, Warning, Info, Debug, etc.') // 返回执行 cli 后产生的日志信息。第一个参数是指返回最后前 n 行的日志信息，loglevel需要查询的日志级别，例如Error，Warning，Info，Debug等
    ,
    (0, decorator_js_1.result)(system_schema_1.SchemaQueryLogResult),
    __param(0, (0, decorator_js_1.param)(system_schema_1.SchemaQueryLogParamInfo)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemApi.prototype, "queryLogs", null);
__decorate([
    (0, decorator_js_1.tool)('system-clear-logs'),
    (0, decorator_js_1.title)('Clear CLI logs') // 清除 cli 日志
    ,
    (0, decorator_js_1.description)('Clear CLI log information') // 清除 cli 日志信息
    ,
    (0, decorator_js_1.result)(system_schema_1.SchemaClearLogResult),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemApi.prototype, "clearLogs", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9zeXN0ZW0vc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLG1EQU95QjtBQUV6Qiw0REFBb0Y7QUFDcEYscURBQXNFO0FBQ3RFLHFEQUFxRDtBQUNyRCwrQ0FBOEM7QUFFOUMsTUFBYSxTQUFTO0lBQ1gsVUFBVSxDQUFnQjtJQUVqQztRQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSwyQkFBYSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVEOztPQUVHO0lBS0csQUFBTixLQUFLLENBQUMsU0FBUyxDQUFpQyxVQUE4QjtRQUMxRSxJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxRSxPQUFPO2dCQUNILElBQUksRUFBRSwyQkFBYSxDQUFDLE9BQU87Z0JBQzNCLElBQUksRUFBRSxJQUFJO2FBQ2IsQ0FBQztRQUNOLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTztnQkFDSCxJQUFJLEVBQUUsMkJBQWEsQ0FBQyxJQUFJO2dCQUN4QixNQUFNLEVBQUUsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzthQUNyRCxDQUFDO1FBQ04sQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUtHLEFBQU4sS0FBSyxDQUFDLFNBQVM7UUFDWCxJQUFJLENBQUM7WUFDRCxvQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU87Z0JBQ0gsSUFBSSxFQUFFLDJCQUFhLENBQUMsT0FBTztnQkFDM0IsSUFBSSxFQUFFLElBQUk7YUFDYixDQUFDO1FBQ04sQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPO2dCQUNILElBQUksRUFBRSwyQkFBYSxDQUFDLElBQUk7Z0JBQ3hCLE1BQU0sRUFBRSxDQUFDLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2FBQ3JELENBQUM7UUFDTixDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBbERELDhCQWtEQztBQXBDUztJQUpMLElBQUEsbUJBQUksRUFBQyxtQkFBbUIsQ0FBQztJQUN6QixJQUFBLG9CQUFLLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxZQUFZOztJQUNwQyxJQUFBLDBCQUFXLEVBQUMsbU5BQW1OLENBQUMsQ0FBQyx3RkFBd0Y7O0lBQ3pULElBQUEscUJBQU0sRUFBQyxvQ0FBb0IsQ0FBQztJQUNaLFdBQUEsSUFBQSxvQkFBSyxFQUFDLHVDQUF1QixDQUFDLENBQUE7Ozs7MENBYTlDO0FBU0s7SUFKTCxJQUFBLG1CQUFJLEVBQUMsbUJBQW1CLENBQUM7SUFDekIsSUFBQSxvQkFBSyxFQUFDLGdCQUFnQixDQUFDLENBQUMsWUFBWTs7SUFDcEMsSUFBQSwwQkFBVyxFQUFDLDJCQUEyQixDQUFDLENBQUMsY0FBYzs7SUFDdkQsSUFBQSxxQkFBTSxFQUFDLG9DQUFvQixDQUFDOzs7OzBDQWM1QiIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHtcbiAgICBTY2hlbWFDbGVhckxvZ1Jlc3VsdCxcbiAgICBTY2hlbWFRdWVyeUxvZ1BhcmFtSW5mbyxcbiAgICBTY2hlbWFRdWVyeUxvZ1Jlc3VsdCxcbiAgICBUQ2xlYXJMb2dSZXN1bHQsXG4gICAgVFF1ZXJ5TG9nUGFyYW1JbmZvLFxuICAgIFRRdWVyeUxvZ1Jlc3VsdFxufSBmcm9tICcuL3N5c3RlbS1zY2hlbWEnO1xuXG5pbXBvcnQgeyBkZXNjcmlwdGlvbiwgcGFyYW0sIHJlc3VsdCwgdGl0bGUsIHRvb2wgfSBmcm9tICcuLi9kZWNvcmF0b3IvZGVjb3JhdG9yLmpzJztcbmltcG9ydCB7IENPTU1PTl9TVEFUVVMsIENvbW1vblJlc3VsdFR5cGUgfSBmcm9tICcuLi9iYXNlL3NjaGVtYS1iYXNlJztcbmltcG9ydCB7IG5ld0NvbnNvbGUgfSBmcm9tICcuLi8uLi9jb3JlL2Jhc2UvY29uc29sZSc7XG5pbXBvcnQgeyBGaWxlRWRpdG9yQXBpIH0gZnJvbSAnLi9maWxlLWVkaXRvcic7XG5cbmV4cG9ydCBjbGFzcyBTeXN0ZW1BcGkge1xuICAgIHB1YmxpYyBmaWxlRWRpdG9yOiBGaWxlRWRpdG9yQXBpO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmZpbGVFZGl0b3IgPSBuZXcgRmlsZUVkaXRvckFwaSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IENMSSBsb2cgaW5mb3JtYXRpb24gLy8g5p+l6K+iIGNsaSDml6Xlv5fkv6Hmga9cbiAgICAgKi9cbiAgICBAdG9vbCgnc3lzdGVtLXF1ZXJ5LWxvZ3MnKVxuICAgIEB0aXRsZSgnUXVlcnkgQ0xJIGxvZ3MnKSAvLyDmn6Xor6IgY2xpIOaXpeW/l1xuICAgIEBkZXNjcmlwdGlvbignUmV0dXJucyBsb2cgaW5mb3JtYXRpb24gZ2VuZXJhdGVkIGFmdGVyIGV4ZWN1dGluZyBDTEkuIFRoZSBmaXJzdCBwYXJhbWV0ZXIgcmVmZXJzIHRvIHJldHVybmluZyB0aGUgbGFzdCBuIGxpbmVzIG9mIGxvZyBpbmZvcm1hdGlvbiwgbG9nbGV2ZWwgaXMgdGhlIGxvZyBsZXZlbCB0byBxdWVyeSwgc3VjaCBhcyBFcnJvciwgV2FybmluZywgSW5mbywgRGVidWcsIGV0Yy4nKSAvLyDov5Tlm57miafooYwgY2xpIOWQjuS6p+eUn+eahOaXpeW/l+S/oeaBr+OAguesrOS4gOS4quWPguaVsOaYr+aMh+i/lOWbnuacgOWQjuWJjSBuIOihjOeahOaXpeW/l+S/oeaBr++8jGxvZ2xldmVs6ZyA6KaB5p+l6K+i55qE5pel5b+X57qn5Yir77yM5L6L5aaCRXJyb3LvvIxXYXJuaW5n77yMSW5mb++8jERlYnVn562JXG4gICAgQHJlc3VsdChTY2hlbWFRdWVyeUxvZ1Jlc3VsdClcbiAgICBhc3luYyBxdWVyeUxvZ3MoQHBhcmFtKFNjaGVtYVF1ZXJ5TG9nUGFyYW1JbmZvKSBxdWVyeVBhcmFtOiBUUXVlcnlMb2dQYXJhbUluZm8pOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFF1ZXJ5TG9nUmVzdWx0Pj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbG9ncyA9IG5ld0NvbnNvbGUucXVlcnlMb2dzKHF1ZXJ5UGFyYW0ubnVtYmVyLCBxdWVyeVBhcmFtLmxvZ0xldmVsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLFxuICAgICAgICAgICAgICAgIGRhdGE6IGxvZ3MsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuRkFJTCxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFyIENMSSBsb2cgaW5mb3JtYXRpb24gLy8g5riF6ZmkIGNsaSDml6Xlv5fkv6Hmga9cbiAgICAgKi9cbiAgICBAdG9vbCgnc3lzdGVtLWNsZWFyLWxvZ3MnKVxuICAgIEB0aXRsZSgnQ2xlYXIgQ0xJIGxvZ3MnKSAvLyDmuIXpmaQgY2xpIOaXpeW/l1xuICAgIEBkZXNjcmlwdGlvbignQ2xlYXIgQ0xJIGxvZyBpbmZvcm1hdGlvbicpIC8vIOa4hemZpCBjbGkg5pel5b+X5L+h5oGvXG4gICAgQHJlc3VsdChTY2hlbWFDbGVhckxvZ1Jlc3VsdClcbiAgICBhc3luYyBjbGVhckxvZ3MoKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRDbGVhckxvZ1Jlc3VsdD4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld0NvbnNvbGUuY2xlYXJMb2dzKCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUyxcbiAgICAgICAgICAgICAgICBkYXRhOiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiBDT01NT05fU1RBVFVTLkZBSUwsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=