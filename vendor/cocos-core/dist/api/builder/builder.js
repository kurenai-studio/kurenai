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
exports.BuilderApi = void 0;
const builder_1 = require("../../core/builder");
const schema_base_1 = require("../base/schema-base");
const decorator_1 = require("../decorator/decorator");
const schema_1 = require("./schema");
class BuilderApi {
    async build(platform, options) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const res = await (0, builder_1.build)(platform, options);
            ret.data = res;
            if (res.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
                ret.code = schema_base_1.COMMON_STATUS.FAIL;
                ret.reason = res.reason || 'Build failed!';
            }
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('build project failed:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    // @tool('builder-get-preview-settings')
    // @title('Get Preview Settings') // 获取预览设置
    // @description('Get Preview Settings') // 获取预览设置
    // @result(SchemaPreviewSettingsResult)
    // async getPreviewSettings() {
    //     const code: HttpStatusCode = COMMON_STATUS.SUCCESS;
    //     const ret: CommonResultType<TPreviewSettingsResult> = {
    //         code: code,
    //         data: null,
    //     };
    //     try {
    //         ret.data = await getPreviewSettings();
    //     } catch (e) {
    //         ret.code = COMMON_STATUS.FAIL;
    //         console.error('get preview settings fail:', e instanceof Error ? e.message : String(e));
    //         ret.reason = e instanceof Error ? e.message : String(e);
    //     }
    //     return ret;
    // }
    async queryDefaultBuildConfig(platform) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            // Temporarily bypassed // 暂时绕过
            ret.data = await (0, builder_1.queryDefaultBuildConfigByPlatform)(platform);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('query default build config by platform fail:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async createBuildTemplate(nameOrPlatform) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            await (0, builder_1.createBuildTemplate)(nameOrPlatform);
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('create build template failed:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async make(platform, dest) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const res = await (0, builder_1.executeBuildStageTask)(platform, 'make', {
                dest,
                platform,
            });
            ret.data = res;
            if (res.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
                ret.code = schema_base_1.COMMON_STATUS.FAIL;
                ret.reason = res.reason || `Make ${platform} in ${dest} failed!`;
            }
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error(`make project ${dest} in platform ${platform} failed:`, e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async run(platform, dest) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const res = await (0, builder_1.executeBuildStageTask)(platform, 'run', {
                dest,
                platform,
            });
            ret.data = res;
            if (res.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
                ret.code = schema_base_1.COMMON_STATUS.FAIL;
                ret.reason = res.reason || `Run ${platform} in ${dest} failed!`;
            }
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error('run build result failed:', e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async upload(platform, dest, accessToken) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const res = await (0, builder_1.executeBuildStageTask)(platform, 'upload', {
                dest,
                platform,
                packages: accessToken ? {
                    [platform]: {
                        accessToken,
                    },
                } : undefined,
            });
            ret.data = res;
            if (res.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
                ret.code = schema_base_1.COMMON_STATUS.FAIL;
                ret.reason = res.reason || `Upload ${platform} in ${dest} failed!`;
            }
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error(`upload project ${dest} in platform ${platform} failed:`, e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
    async publish(platform, dest) {
        const code = schema_base_1.COMMON_STATUS.SUCCESS;
        const ret = {
            code: code,
            data: null,
        };
        try {
            const res = await (0, builder_1.executeBuildStageTask)(platform, 'publish', {
                dest,
                platform,
            });
            ret.data = res;
            if (res.code !== 0 /* BuildExitCode.BUILD_SUCCESS */) {
                ret.code = schema_base_1.COMMON_STATUS.FAIL;
                ret.reason = res.reason || `Publish ${platform} in ${dest} failed!`;
            }
        }
        catch (e) {
            ret.code = schema_base_1.COMMON_STATUS.FAIL;
            console.error(`publish project ${dest} in platform ${platform} failed:`, e instanceof Error ? e.message : String(e));
            ret.reason = e instanceof Error ? e.message : String(e);
        }
        return ret;
    }
}
exports.BuilderApi = BuilderApi;
__decorate([
    (0, decorator_1.tool)('builder-build'),
    (0, decorator_1.title)('Build Project') // 构建项目
    ,
    (0, decorator_1.description)('Compile and package the project for the specified platform (e.g. web-mobile, android, ios). This is a BUILD step only — it does NOT launch or run the game. To launch the built game afterward, use builder-run separately.') // 将项目编译并打包为指定平台的游戏包（例如 web-mobile、android、ios），这是构建步骤，不会启动或运行游戏。如需启动游戏请单独使用 builder-run
    ,
    (0, decorator_1.result)(schema_1.SchemaBuildResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaBuildOption)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "build", null);
__decorate([
    (0, decorator_1.tool)('builder-query-default-build-config'),
    (0, decorator_1.title)('Get Default Build Config') // 获取平台默认构建配置
    ,
    (0, decorator_1.description)('Get default build configuration for platform') // 获取平台默认构建配置
    ,
    (0, decorator_1.result)(schema_1.SchemaBuildConfigResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaPlatform)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "queryDefaultBuildConfig", null);
__decorate([
    (0, decorator_1.tool)('builder-create-build-template'),
    (0, decorator_1.title)('Create Build Template'),
    (0, decorator_1.description)('Create or update the user build template for a platform or build template display name.'),
    (0, decorator_1.result)(schema_1.SchemaCreateBuildTemplateResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaBuildTemplateName)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "createBuildTemplate", null);
__decorate([
    (0, decorator_1.tool)('builder-make'),
    (0, decorator_1.title)('Make Build Package') // 编译构建包
    ,
    (0, decorator_1.description)('Compile the built game package, supported only by some platforms') // 编译构建后的游戏包，仅部分平台支持
    ,
    (0, decorator_1.result)(schema_1.SchemaMakeResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaPlatformCanMake)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaBuildDest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "make", null);
__decorate([
    (0, decorator_1.tool)('builder-run'),
    (0, decorator_1.title)('Run Build Result') // 运行构建结果
    ,
    (0, decorator_1.description)('Launch and run a previously built game package. This is NOT a build step — it requires that builder-build has already completed successfully. Do NOT call this instead of builder-build; the two are separate sequential steps: build first, then run.') // 启动并运行已经构建好的游戏包，这不是构建步骤——需要先成功执行过 builder-build。不要用此命令代替 builder-build，两者是独立的顺序步骤：先构建，再运行
    ,
    (0, decorator_1.result)(schema_1.SchemaBuildResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaBuildDest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "run", null);
__decorate([
    (0, decorator_1.tool)('builder-upload'),
    (0, decorator_1.title)('Upload Build Package') // 上传构建产物
    ,
    (0, decorator_1.description)('Upload a previously built game package, supported only by some platforms') // 上传已经构建好的游戏包，仅部分平台支持
    ,
    (0, decorator_1.result)(schema_1.SchemaUploadResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaBuildDest)),
    __param(2, (0, decorator_1.param)(schema_1.SchemaUploadAccessToken)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "upload", null);
__decorate([
    (0, decorator_1.tool)('builder-publish'),
    (0, decorator_1.title)('Publish Build Package') // 发布构建产物
    ,
    (0, decorator_1.description)('Publish a previously uploaded game package, supported only by some platforms. Requires a successful upload stage to have produced a packageId.') // 发布已经上传成功的游戏包，仅部分平台支持，需要先成功执行过上传阶段以获取 packageId
    ,
    (0, decorator_1.result)(schema_1.SchemaPublishResult),
    __param(0, (0, decorator_1.param)(schema_1.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaBuildDest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuilderApi.prototype, "publish", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvYnVpbGRlci9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUFxSjtBQUNySixxREFBc0Y7QUFFdEYsc0RBQWlGO0FBQ2pGLHFDQUFxaUI7QUFFcmlCLE1BQWEsVUFBVTtJQU1iLEFBQU4sS0FBSyxDQUFDLEtBQUssQ0FBd0IsUUFBbUIsRUFBNEIsT0FBc0I7UUFDcEcsTUFBTSxJQUFJLEdBQW1CLDJCQUFhLENBQUMsT0FBTyxDQUFDO1FBQ25ELE1BQU0sR0FBRyxHQUF1QztZQUM1QyxJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQztRQUNGLElBQUksQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSxlQUFLLEVBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBdUIsQ0FBQztZQUNuQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLHdDQUFnQyxFQUFFLENBQUM7Z0JBQzNDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsMkJBQWEsQ0FBQyxJQUFJLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxlQUFlLENBQUM7WUFDL0MsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsR0FBRyxDQUFDLElBQUksR0FBRywyQkFBYSxDQUFDLElBQUksQ0FBQztZQUM5QixPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxZQUFZLEtBQUssQ0FB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SyxFQUFDLHdCQUFlLENBQUMsQ0FBQTs7OztxQ0FzQjVFO0FBTUs7SUFKTCxJQUFBLGdCQUFJLEVBQUMsZ0JBQWdCLENBQUM7SUFDdEIsSUFBQSxpQkFBSyxFQUFDLHNCQUFzQixDQUFDLENBQUMsU0FBUzs7SUFDdkMsSUFBQSx1QkFBVyxFQUFDLDBFQUEwRSxDQUFDLENBQUMsc0JBQXNCOztJQUM5RyxJQUFBLGtCQUFNLEVBQUMsMkJBQWtCLENBQUM7SUFDYixXQUFBLElBQUEsaUJBQUssRUFBQyx1QkFBYyxDQUFDLENBQUE7SUFBdUIsV0FBQSxJQUFBLGlCQUFLLEVBQUMsd0JBQWUsQ0FBQyxDQUFBO0lBQW9CLFdBQUEsSUFBQSxpQkFBSyxFQUFDLGdDQUF1QixDQUFDLENBQUE7Ozs7d0NBMkJqSTtBQU1LO0lBSkwsSUFBQSxnQkFBSSxFQUFDLGlCQUFpQixDQUFDO0lBQ3ZCLElBQUEsaUJBQUssRUFBQyx1QkFBdUIsQ0FBQyxDQUFDLFNBQVM7O0lBQ3hDLElBQUEsdUJBQVcsRUFBQyxnSkFBZ0osQ0FBQyxDQUFDLGlEQUFpRDs7SUFDL00sSUFBQSxrQkFBTSxFQUFDLDRCQUFtQixDQUFDO0lBQ2IsV0FBQSxJQUFBLGlCQUFLLEVBQUMsdUJBQWMsQ0FBQyxDQUFBO0lBQXVCLFdBQUEsSUFBQSxpQkFBSyxFQUFDLHdCQUFlLENBQUMsQ0FBQTs7Ozt5Q0FzQmhGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYnVpbGQsIGNyZWF0ZUJ1aWxkVGVtcGxhdGUgYXMgY3JlYXRlQ29yZUJ1aWxkVGVtcGxhdGUsIGV4ZWN1dGVCdWlsZFN0YWdlVGFzaywgcXVlcnlEZWZhdWx0QnVpbGRDb25maWdCeVBsYXRmb3JtIH0gZnJvbSAnLi4vLi4vY29yZS9idWlsZGVyJztcbmltcG9ydCB7IEh0dHBTdGF0dXNDb2RlLCBDT01NT05fU1RBVFVTLCBDb21tb25SZXN1bHRUeXBlIH0gZnJvbSAnLi4vYmFzZS9zY2hlbWEtYmFzZSc7XG5pbXBvcnQgeyBCdWlsZEV4aXRDb2RlIH0gZnJvbSAnLi4vLi4vY29yZS9idWlsZGVyL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgZGVzY3JpcHRpb24sIHBhcmFtLCByZXN1bHQsIHRpdGxlLCB0b29sIH0gZnJvbSAnLi4vZGVjb3JhdG9yL2RlY29yYXRvcic7XG5pbXBvcnQgeyBTY2hlbWFCdWlsZENvbmZpZ1Jlc3VsdCwgU2NoZW1hQnVpbGRPcHRpb24sIFNjaGVtYUJ1aWxkUmVzdWx0LCBTY2hlbWFQbGF0Zm9ybSwgU2NoZW1hQnVpbGREZXN0LCBTY2hlbWFSdW5SZXN1bHQsIFRCdWlsZENvbmZpZ1Jlc3VsdCwgVEJ1aWxkT3B0aW9uLCBUQnVpbGRSZXN1bHREYXRhLCBUUGxhdGZvcm0sIFRCdWlsZERlc3QsIFRSdW5SZXN1bHQsIFNjaGVtYVBsYXRmb3JtQ2FuTWFrZSwgVFBsYXRmb3JtQ2FuTWFrZSwgSU1ha2VSZXN1bHREYXRhLCBJUnVuUmVzdWx0RGF0YSwgSVVwbG9hZFJlc3VsdERhdGEsIElQdWJsaXNoUmVzdWx0RGF0YSwgU2NoZW1hTWFrZVJlc3VsdCwgU2NoZW1hVXBsb2FkUmVzdWx0LCBTY2hlbWFQdWJsaXNoUmVzdWx0LCBTY2hlbWFVcGxvYWRBY2Nlc3NUb2tlbiwgVFVwbG9hZEFjY2Vzc1Rva2VuLCBTY2hlbWFCdWlsZFRlbXBsYXRlTmFtZSwgVEJ1aWxkVGVtcGxhdGVOYW1lLCBTY2hlbWFDcmVhdGVCdWlsZFRlbXBsYXRlUmVzdWx0LCBUQ3JlYXRlQnVpbGRUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXJBcGkge1xuXG4gICAgQHRvb2woJ2J1aWxkZXItYnVpbGQnKVxuICAgIEB0aXRsZSgnQnVpbGQgUHJvamVjdCcpIC8vIOaehOW7uumhueebrlxuICAgIEBkZXNjcmlwdGlvbignQ29tcGlsZSBhbmQgcGFja2FnZSB0aGUgcHJvamVjdCBmb3IgdGhlIHNwZWNpZmllZCBwbGF0Zm9ybSAoZS5nLiB3ZWItbW9iaWxlLCBhbmRyb2lkLCBpb3MpLiBUaGlzIGlzIGEgQlVJTEQgc3RlcCBvbmx5IOKAlCBpdCBkb2VzIE5PVCBsYXVuY2ggb3IgcnVuIHRoZSBnYW1lLiBUbyBsYXVuY2ggdGhlIGJ1aWx0IGdhbWUgYWZ0ZXJ3YXJkLCB1c2UgYnVpbGRlci1ydW4gc2VwYXJhdGVseS4nKSAvLyDlsIbpobnnm67nvJbor5HlubbmiZPljIXkuLrmjIflrprlubPlj7DnmoTmuLjmiI/ljIXvvIjkvovlpoIgd2ViLW1vYmlsZeOAgWFuZHJvaWTjgIFpb3PvvInvvIzov5nmmK/mnoTlu7rmraXpqqTvvIzkuI3kvJrlkK/liqjmiJbov5DooYzmuLjmiI/jgILlpoLpnIDlkK/liqjmuLjmiI/or7fljZXni6zkvb/nlKggYnVpbGRlci1ydW5cbiAgICBAcmVzdWx0KFNjaGVtYUJ1aWxkUmVzdWx0KVxuICAgIGFzeW5jIGJ1aWxkKEBwYXJhbShTY2hlbWFQbGF0Zm9ybSkgcGxhdGZvcm06IFRQbGF0Zm9ybSwgQHBhcmFtKFNjaGVtYUJ1aWxkT3B0aW9uKSBvcHRpb25zPzogVEJ1aWxkT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEJ1aWxkUmVzdWx0RGF0YT4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJ1aWxkKHBsYXRmb3JtLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldC5kYXRhID0gcmVzIGFzIFRCdWlsZFJlc3VsdERhdGE7XG4gICAgICAgICAgICBpZiAocmVzLmNvZGUgIT09IEJ1aWxkRXhpdENvZGUuQlVJTERfU1VDQ0VTUykge1xuICAgICAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5GQUlMO1xuICAgICAgICAgICAgICAgIHJldC5yZWFzb24gPSByZXMucmVhc29uIHx8ICdCdWlsZCBmYWlsZWQhJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdidWlsZCBwcm9qZWN0IGZhaWxlZDonLCBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgICAgICAgICAgcmV0LnJlYXNvbiA9IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8vIEB0b29sKCdidWlsZGVyLWdldC1wcmV2aWV3LXNldHRpbmdzJylcbiAgICAvLyBAdGl0bGUoJ0dldCBQcmV2aWV3IFNldHRpbmdzJykgLy8g6I635Y+W6aKE6KeI6K6+572uXG4gICAgLy8gQGRlc2NyaXB0aW9uKCdHZXQgUHJldmlldyBTZXR0aW5ncycpIC8vIOiOt+WPlumihOiniOiuvue9rlxuICAgIC8vIEByZXN1bHQoU2NoZW1hUHJldmlld1NldHRpbmdzUmVzdWx0KVxuICAgIC8vIGFzeW5jIGdldFByZXZpZXdTZXR0aW5ncygpIHtcbiAgICAvLyAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgLy8gICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUUHJldmlld1NldHRpbmdzUmVzdWx0PiA9IHtcbiAgICAvLyAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgLy8gICAgICAgICBkYXRhOiBudWxsLFxuICAgIC8vICAgICB9O1xuICAgIC8vICAgICB0cnkge1xuICAgIC8vICAgICAgICAgcmV0LmRhdGEgPSBhd2FpdCBnZXRQcmV2aWV3U2V0dGluZ3MoKTtcbiAgICAvLyAgICAgfSBjYXRjaCAoZSkge1xuICAgIC8vICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdnZXQgcHJldmlldyBzZXR0aW5ncyBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgLy8gICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHJldHVybiByZXQ7XG4gICAgLy8gfVxuXG4gICAgQHRvb2woJ2J1aWxkZXItcXVlcnktZGVmYXVsdC1idWlsZC1jb25maWcnKVxuICAgIEB0aXRsZSgnR2V0IERlZmF1bHQgQnVpbGQgQ29uZmlnJykgLy8g6I635Y+W5bmz5Y+w6buY6K6k5p6E5bu66YWN572uXG4gICAgQGRlc2NyaXB0aW9uKCdHZXQgZGVmYXVsdCBidWlsZCBjb25maWd1cmF0aW9uIGZvciBwbGF0Zm9ybScpIC8vIOiOt+WPluW5s+WPsOm7mOiupOaehOW7uumFjee9rlxuICAgIEByZXN1bHQoU2NoZW1hQnVpbGRDb25maWdSZXN1bHQpXG4gICAgYXN5bmMgcXVlcnlEZWZhdWx0QnVpbGRDb25maWcoQHBhcmFtKFNjaGVtYVBsYXRmb3JtKSBwbGF0Zm9ybTogVFBsYXRmb3JtKSB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8VEJ1aWxkQ29uZmlnUmVzdWx0PiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBUZW1wb3JhcmlseSBieXBhc3NlZCAvLyDmmoLml7bnu5Xov4dcbiAgICAgICAgICAgIHJldC5kYXRhID0gYXdhaXQgcXVlcnlEZWZhdWx0QnVpbGRDb25maWdCeVBsYXRmb3JtKHBsYXRmb3JtKSBhcyB1bmtub3duIGFzIFRCdWlsZENvbmZpZ1Jlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdxdWVyeSBkZWZhdWx0IGJ1aWxkIGNvbmZpZyBieSBwbGF0Zm9ybSBmYWlsOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2J1aWxkZXItY3JlYXRlLWJ1aWxkLXRlbXBsYXRlJylcbiAgICBAdGl0bGUoJ0NyZWF0ZSBCdWlsZCBUZW1wbGF0ZScpXG4gICAgQGRlc2NyaXB0aW9uKCdDcmVhdGUgb3IgdXBkYXRlIHRoZSB1c2VyIGJ1aWxkIHRlbXBsYXRlIGZvciBhIHBsYXRmb3JtIG9yIGJ1aWxkIHRlbXBsYXRlIGRpc3BsYXkgbmFtZS4nKVxuICAgIEByZXN1bHQoU2NoZW1hQ3JlYXRlQnVpbGRUZW1wbGF0ZVJlc3VsdClcbiAgICBhc3luYyBjcmVhdGVCdWlsZFRlbXBsYXRlKEBwYXJhbShTY2hlbWFCdWlsZFRlbXBsYXRlTmFtZSkgbmFtZU9yUGxhdGZvcm06IFRCdWlsZFRlbXBsYXRlTmFtZSk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUQ3JlYXRlQnVpbGRUZW1wbGF0ZVJlc3VsdD4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxUQ3JlYXRlQnVpbGRUZW1wbGF0ZVJlc3VsdD4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY3JlYXRlQ29yZUJ1aWxkVGVtcGxhdGUobmFtZU9yUGxhdGZvcm0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NyZWF0ZSBidWlsZCB0ZW1wbGF0ZSBmYWlsZWQ6JywgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBAdG9vbCgnYnVpbGRlci1tYWtlJylcbiAgICBAdGl0bGUoJ01ha2UgQnVpbGQgUGFja2FnZScpIC8vIOe8luivkeaehOW7uuWMhVxuICAgIEBkZXNjcmlwdGlvbignQ29tcGlsZSB0aGUgYnVpbHQgZ2FtZSBwYWNrYWdlLCBzdXBwb3J0ZWQgb25seSBieSBzb21lIHBsYXRmb3JtcycpIC8vIOe8luivkeaehOW7uuWQjueahOa4uOaIj+WMhe+8jOS7hemDqOWIhuW5s+WPsOaUr+aMgVxuICAgIEByZXN1bHQoU2NoZW1hTWFrZVJlc3VsdClcbiAgICBhc3luYyBtYWtlKEBwYXJhbShTY2hlbWFQbGF0Zm9ybUNhbk1ha2UpIHBsYXRmb3JtOiBUUGxhdGZvcm1DYW5NYWtlLCBAcGFyYW0oU2NoZW1hQnVpbGREZXN0KSBkZXN0OiBUQnVpbGREZXN0KSB7XG4gICAgICAgIGNvbnN0IGNvZGU6IEh0dHBTdGF0dXNDb2RlID0gQ09NTU9OX1NUQVRVUy5TVUNDRVNTO1xuICAgICAgICBjb25zdCByZXQ6IENvbW1vblJlc3VsdFR5cGU8SU1ha2VSZXN1bHREYXRhPiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZUJ1aWxkU3RhZ2VUYXNrKHBsYXRmb3JtLCAnbWFrZScsIHtcbiAgICAgICAgICAgICAgICBkZXN0LFxuICAgICAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXQuZGF0YSA9IHJlcyBhcyBJTWFrZVJlc3VsdERhdGE7XG4gICAgICAgICAgICBpZiAocmVzLmNvZGUgIT09IEJ1aWxkRXhpdENvZGUuQlVJTERfU1VDQ0VTUykge1xuICAgICAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5GQUlMO1xuICAgICAgICAgICAgICAgIHJldC5yZWFzb24gPSByZXMucmVhc29uIHx8IGBNYWtlICR7cGxhdGZvcm19IGluICR7ZGVzdH0gZmFpbGVkIWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldC5jb2RlID0gQ09NTU9OX1NUQVRVUy5GQUlMO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgbWFrZSBwcm9qZWN0ICR7ZGVzdH0gaW4gcGxhdGZvcm0gJHtwbGF0Zm9ybX0gZmFpbGVkOmAsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2J1aWxkZXItcnVuJylcbiAgICBAdGl0bGUoJ1J1biBCdWlsZCBSZXN1bHQnKSAvLyDov5DooYzmnoTlu7rnu5PmnpxcbiAgICBAZGVzY3JpcHRpb24oJ0xhdW5jaCBhbmQgcnVuIGEgcHJldmlvdXNseSBidWlsdCBnYW1lIHBhY2thZ2UuIFRoaXMgaXMgTk9UIGEgYnVpbGQgc3RlcCDigJQgaXQgcmVxdWlyZXMgdGhhdCBidWlsZGVyLWJ1aWxkIGhhcyBhbHJlYWR5IGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkuIERvIE5PVCBjYWxsIHRoaXMgaW5zdGVhZCBvZiBidWlsZGVyLWJ1aWxkOyB0aGUgdHdvIGFyZSBzZXBhcmF0ZSBzZXF1ZW50aWFsIHN0ZXBzOiBidWlsZCBmaXJzdCwgdGhlbiBydW4uJykgLy8g5ZCv5Yqo5bm26L+Q6KGM5bey57uP5p6E5bu65aW955qE5ri45oiP5YyF77yM6L+Z5LiN5piv5p6E5bu65q2l6aqk4oCU4oCU6ZyA6KaB5YWI5oiQ5Yqf5omn6KGM6L+HIGJ1aWxkZXItYnVpbGTjgILkuI3opoHnlKjmraTlkb3ku6Tku6Pmm78gYnVpbGRlci1idWlsZO+8jOS4pOiAheaYr+eLrOeri+eahOmhuuW6j+atpemqpO+8muWFiOaehOW7uu+8jOWGjei/kOihjFxuICAgIEByZXN1bHQoU2NoZW1hQnVpbGRSZXN1bHQpXG4gICAgYXN5bmMgcnVuKEBwYXJhbShTY2hlbWFQbGF0Zm9ybSkgcGxhdGZvcm06IFRQbGF0Zm9ybSwgQHBhcmFtKFNjaGVtYUJ1aWxkRGVzdCkgZGVzdDogVEJ1aWxkRGVzdCk6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxJUnVuUmVzdWx0RGF0YT4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxJUnVuUmVzdWx0RGF0YT4gPSB7XG4gICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGV4ZWN1dGVCdWlsZFN0YWdlVGFzayhwbGF0Zm9ybSwgJ3J1bicsIHtcbiAgICAgICAgICAgICAgICBkZXN0LFxuICAgICAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXQuZGF0YSA9IHJlcztcbiAgICAgICAgICAgIGlmIChyZXMuY29kZSAhPT0gQnVpbGRFeGl0Q29kZS5CVUlMRF9TVUNDRVNTKSB7XG4gICAgICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICAgICAgcmV0LnJlYXNvbiA9IHJlcy5yZWFzb24gfHwgYFJ1biAke3BsYXRmb3JtfSBpbiAke2Rlc3R9IGZhaWxlZCFgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3J1biBidWlsZCByZXN1bHQgZmFpbGVkOicsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2J1aWxkZXItdXBsb2FkJylcbiAgICBAdGl0bGUoJ1VwbG9hZCBCdWlsZCBQYWNrYWdlJykgLy8g5LiK5Lyg5p6E5bu65Lqn54mpXG4gICAgQGRlc2NyaXB0aW9uKCdVcGxvYWQgYSBwcmV2aW91c2x5IGJ1aWx0IGdhbWUgcGFja2FnZSwgc3VwcG9ydGVkIG9ubHkgYnkgc29tZSBwbGF0Zm9ybXMnKSAvLyDkuIrkvKDlt7Lnu4/mnoTlu7rlpb3nmoTmuLjmiI/ljIXvvIzku4Xpg6jliIblubPlj7DmlK/mjIFcbiAgICBAcmVzdWx0KFNjaGVtYVVwbG9hZFJlc3VsdClcbiAgICBhc3luYyB1cGxvYWQoQHBhcmFtKFNjaGVtYVBsYXRmb3JtKSBwbGF0Zm9ybTogVFBsYXRmb3JtLCBAcGFyYW0oU2NoZW1hQnVpbGREZXN0KSBkZXN0OiBUQnVpbGREZXN0LCBAcGFyYW0oU2NoZW1hVXBsb2FkQWNjZXNzVG9rZW4pIGFjY2Vzc1Rva2VuPzogVFVwbG9hZEFjY2Vzc1Rva2VuKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPElVcGxvYWRSZXN1bHREYXRhPj4ge1xuICAgICAgICBjb25zdCBjb2RlOiBIdHRwU3RhdHVzQ29kZSA9IENPTU1PTl9TVEFUVVMuU1VDQ0VTUztcbiAgICAgICAgY29uc3QgcmV0OiBDb21tb25SZXN1bHRUeXBlPElVcGxvYWRSZXN1bHREYXRhPiA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZUJ1aWxkU3RhZ2VUYXNrKHBsYXRmb3JtLCAndXBsb2FkJywge1xuICAgICAgICAgICAgICAgIGRlc3QsXG4gICAgICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICAgICAgcGFja2FnZXM6IGFjY2Vzc1Rva2VuID8ge1xuICAgICAgICAgICAgICAgICAgICBbcGxhdGZvcm1dOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXQuZGF0YSA9IHJlcyBhcyBJVXBsb2FkUmVzdWx0RGF0YTtcbiAgICAgICAgICAgIGlmIChyZXMuY29kZSAhPT0gQnVpbGRFeGl0Q29kZS5CVUlMRF9TVUNDRVNTKSB7XG4gICAgICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICAgICAgcmV0LnJlYXNvbiA9IHJlcy5yZWFzb24gfHwgYFVwbG9hZCAke3BsYXRmb3JtfSBpbiAke2Rlc3R9IGZhaWxlZCFgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQuY29kZSA9IENPTU1PTl9TVEFUVVMuRkFJTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHVwbG9hZCBwcm9qZWN0ICR7ZGVzdH0gaW4gcGxhdGZvcm0gJHtwbGF0Zm9ybX0gZmFpbGVkOmAsIGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgICAgICAgICByZXQucmVhc29uID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgQHRvb2woJ2J1aWxkZXItcHVibGlzaCcpXG4gICAgQHRpdGxlKCdQdWJsaXNoIEJ1aWxkIFBhY2thZ2UnKSAvLyDlj5HluIPmnoTlu7rkuqfnialcbiAgICBAZGVzY3JpcHRpb24oJ1B1Ymxpc2ggYSBwcmV2aW91c2x5IHVwbG9hZGVkIGdhbWUgcGFja2FnZSwgc3VwcG9ydGVkIG9ubHkgYnkgc29tZSBwbGF0Zm9ybXMuIFJlcXVpcmVzIGEgc3VjY2Vzc2Z1bCB1cGxvYWQgc3RhZ2UgdG8gaGF2ZSBwcm9kdWNlZCBhIHBhY2thZ2VJZC4nKSAvLyDlj5HluIPlt7Lnu4/kuIrkvKDmiJDlip/nmoTmuLjmiI/ljIXvvIzku4Xpg6jliIblubPlj7DmlK/mjIHvvIzpnIDopoHlhYjmiJDlip/miafooYzov4fkuIrkvKDpmLbmrrXku6Xojrflj5YgcGFja2FnZUlkXG4gICAgQHJlc3VsdChTY2hlbWFQdWJsaXNoUmVzdWx0KVxuICAgIGFzeW5jIHB1Ymxpc2goQHBhcmFtKFNjaGVtYVBsYXRmb3JtKSBwbGF0Zm9ybTogVFBsYXRmb3JtLCBAcGFyYW0oU2NoZW1hQnVpbGREZXN0KSBkZXN0OiBUQnVpbGREZXN0KTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPElQdWJsaXNoUmVzdWx0RGF0YT4+IHtcbiAgICAgICAgY29uc3QgY29kZTogSHR0cFN0YXR1c0NvZGUgPSBDT01NT05fU1RBVFVTLlNVQ0NFU1M7XG4gICAgICAgIGNvbnN0IHJldDogQ29tbW9uUmVzdWx0VHlwZTxJUHVibGlzaFJlc3VsdERhdGE+ID0ge1xuICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBleGVjdXRlQnVpbGRTdGFnZVRhc2socGxhdGZvcm0sICdwdWJsaXNoJywge1xuICAgICAgICAgICAgICAgIGRlc3QsXG4gICAgICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldC5kYXRhID0gcmVzIGFzIElQdWJsaXNoUmVzdWx0RGF0YTtcbiAgICAgICAgICAgIGlmIChyZXMuY29kZSAhPT0gQnVpbGRFeGl0Q29kZS5CVUlMRF9TVUNDRVNTKSB7XG4gICAgICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICAgICAgcmV0LnJlYXNvbiA9IHJlcy5yZWFzb24gfHwgYFB1Ymxpc2ggJHtwbGF0Zm9ybX0gaW4gJHtkZXN0fSBmYWlsZWQhYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0LmNvZGUgPSBDT01NT05fU1RBVFVTLkZBSUw7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwdWJsaXNoIHByb2plY3QgJHtkZXN0fSBpbiBwbGF0Zm9ybSAke3BsYXRmb3JtfSBmYWlsZWQ6YCwgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICAgICAgICAgIHJldC5yZWFzb24gPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG4iXX0=