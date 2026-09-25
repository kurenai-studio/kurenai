"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderHook = void 0;
const zod_1 = require("zod");
const path_1 = require("path");
const fs_1 = require("fs");
const schema_1 = require("../../api/builder/schema");
const KNOWN_BUILD_PLATFORMS = ['web-desktop', 'web-mobile', 'android', 'ios', 'windows', 'mac', 'ohos', 'harmonyos-next', 'google-play', 'huawei-agc'];
class BuilderHook {
    dynamicPlatforms = [];
    constructor() {
        this.scanPlatformPackages();
    }
    /**
     * 扫描 packages/platforms 目录下的平台插件
     */
    scanPlatformPackages() {
        const platforms = [];
        const platformsDir = (0, path_1.resolve)(__dirname, '../../../packages/platforms');
        if (!(0, fs_1.existsSync)(platformsDir)) {
            this.dynamicPlatforms = platforms;
            return;
        }
        try {
            const dirs = (0, fs_1.readdirSync)(platformsDir);
            for (const dir of dirs) {
                const pkgJsonPath = (0, path_1.join)(platformsDir, dir, 'package.json');
                if ((0, fs_1.existsSync)(pkgJsonPath)) {
                    try {
                        const pkgContent = JSON.parse((0, fs_1.readFileSync)(pkgJsonPath, 'utf-8'));
                        // 检查是否是平台插件 (contributes.builder.register === true)
                        if (pkgContent?.contributes?.builder?.register === true) {
                            // 优先使用 contributes.builder.platform，如果没有则使用 package.name
                            const platformName = pkgContent.contributes.builder.platform || pkgContent.name;
                            if (platformName) {
                                platforms.push(platformName);
                            }
                        }
                    }
                    catch (e) {
                        console.warn(`Failed to parse package.json for ${dir}:`, e);
                    }
                }
            }
        }
        catch (e) {
            console.error('Failed to scan platform packages:', e);
        }
        this.dynamicPlatforms = platforms;
    }
    onRegisterParam(toolName, param, inputSchemaFields) {
        if (toolName !== 'builder-build')
            return;
        // 合并去重
        const allPlatforms = Array.from(new Set([...KNOWN_BUILD_PLATFORMS, ...this.dynamicPlatforms]));
        const platformDesc = `Platform Identifier (e.g., ${allPlatforms.join(', ')})`;
        if (param.name === 'options') {
            // 使用 z.object().passthrough() 而非 z.any()，确保转换出的 JSON Schema 带有 type: object，
            // 否则参数无 type，部分模型（如 Gemini）会降级成 string 并把对象 JSON.stringify 成字符串传入。
            // 详细校验仍延迟到执行阶段 onBeforeExecute 完成。
            const simpleSchema = zod_1.z.object({})
                .passthrough()
                .optional()
                .describe('Build options (Detailed validation is deferred to execution)');
            inputSchemaFields[param.name] = simpleSchema;
            param.schema = simpleSchema;
        }
        else if (param.name === 'platform') {
            // 动态更新 platform 参数的描述，包含扫描到的平台
            const newPlatformSchema = param.schema.describe(platformDesc);
            inputSchemaFields[param.name] = newPlatformSchema;
            param.schema = newPlatformSchema;
        }
    }
    onBeforeExecute(toolName, args) {
        if (toolName !== 'builder-build')
            return;
        if (!args.options) {
            args.options = {};
        }
        // 处理 configPath
        let options = args.options;
        if (options.configPath) {
            const configPath = options.configPath;
            if ((0, fs_1.existsSync)(configPath)) {
                try {
                    const fileContent = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf-8'));
                    // 合并配置，args.options 优先级高于配置文件
                    options = args.options = {
                        ...fileContent,
                        ...options
                    };
                    // 删除 configPath 字段
                    delete options.configPath;
                }
                catch (e) {
                    console.warn(`Failed to load config file: ${configPath}`, e);
                }
            }
        }
        if (typeof options === 'object') {
            if (!options.platform) {
                // 注入 platform
                options.platform = args.platform;
            }
            // sourceMaps exported by CocosEditor is a string, so need to convert it to boolean
            if (options.sourceMaps && typeof options.sourceMaps !== 'boolean') {
                if (options.sourceMaps === 'true') {
                    options.sourceMaps = true;
                }
                else if (options.sourceMaps === 'false') {
                    options.sourceMaps = false;
                }
            }
        }
        // 动态构建 SchemaBuildOption 并进行严格校验
        const dynamicPlatforms = new Set(this.dynamicPlatforms);
        if (typeof options.platform === 'string' && !KNOWN_BUILD_PLATFORMS.includes(options.platform)) {
            dynamicPlatforms.add(options.platform);
        }
        const dynamicSchemas = Array.from(dynamicPlatforms).filter(platform => !KNOWN_BUILD_PLATFORMS.includes(platform)).map(platform => {
            return schema_1.SchemaBuildBaseOption.extend({
                platform: zod_1.z.literal(platform).describe('Build platform'),
                packages: zod_1.z.object({
                    [platform]: zod_1.z.any().optional().describe(`${platform} platform specific configuration`)
                }).catchall(zod_1.z.any()).optional().describe(`${platform} platform specific configuration`)
            }).describe(`${platform} complete build options`);
        });
        const newSchema = zod_1.z.discriminatedUnion('platform', [
            ...schema_1.SchemaKnownBuildOptions,
            ...dynamicSchemas,
            schema_1.SchemaOtherPlatformBuildOption
        ]).default({});
        args.options = newSchema.parse(options);
    }
    onValidationFailed(toolName, paramName, error) {
        if (toolName === 'builder-build') {
            throw new Error(`Parameter validation failed for ${paramName}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.BuilderHook = BuilderHook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci5ob29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21jcC9ob29rcy9idWlsZGVyLmhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQXdCO0FBQ3hCLCtCQUFxQztBQUNyQywyQkFBMkQ7QUFDM0QscURBQTBIO0FBRTFILE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxhQUFhLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXZKLE1BQWEsV0FBVztJQUNaLGdCQUFnQixHQUFhLEVBQUUsQ0FBQztJQUV4QztRQUNJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNLLG9CQUFvQjtRQUN4QixNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDL0IsTUFBTSxZQUFZLEdBQUcsSUFBQSxjQUFPLEVBQUMsU0FBUyxFQUFFLDZCQUE2QixDQUFDLENBQUM7UUFFdkUsSUFBSSxDQUFDLElBQUEsZUFBVSxFQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztZQUNsQyxPQUFPO1FBQ1gsQ0FBQztRQUVELElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUEsZ0JBQVcsRUFBQyxZQUFZLENBQUMsQ0FBQztZQUN2QyxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNyQixNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQUksRUFBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLElBQUEsZUFBVSxFQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7b0JBQzFCLElBQUksQ0FBQzt3QkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUEsaUJBQVksRUFBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzt3QkFDbEUsb0RBQW9EO3dCQUNwRCxJQUFJLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQzs0QkFDdEQseURBQXlEOzRCQUN6RCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQzs0QkFDaEYsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQ0FDZixTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDOzRCQUNqQyxDQUFDO3dCQUNMLENBQUM7b0JBQ0wsQ0FBQztvQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsb0NBQW9DLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO0lBQ3RDLENBQUM7SUFFTSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxLQUFVLEVBQUUsaUJBQXNDO1FBQ3ZGLElBQUksUUFBUSxLQUFLLGVBQWU7WUFBRSxPQUFPO1FBRXpDLE9BQU87UUFDUCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxxQkFBcUIsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvRixNQUFNLFlBQVksR0FBRyw4QkFBOEIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBRTlFLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMzQiw2RUFBNkU7WUFDN0UsbUVBQW1FO1lBQ25FLG1DQUFtQztZQUNuQyxNQUFNLFlBQVksR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztpQkFDNUIsV0FBVyxFQUFFO2lCQUNiLFFBQVEsRUFBRTtpQkFDVixRQUFRLENBQUMsOERBQThELENBQUMsQ0FBQztZQUM5RSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDO1lBQzdDLEtBQUssQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO1FBRWhDLENBQUM7YUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDbkMsK0JBQStCO1lBQy9CLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUQsaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLGlCQUFpQixDQUFDO1lBQ2xELEtBQUssQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUM7UUFDckMsQ0FBQztJQUNMLENBQUM7SUFFTSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxJQUFTO1FBQzlDLElBQUksUUFBUSxLQUFLLGVBQWU7WUFBRSxPQUFPO1FBRXpDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVELGdCQUFnQjtRQUNoQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzNCLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7WUFDdEMsSUFBSSxJQUFBLGVBQVUsRUFBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUM7b0JBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFBLGlCQUFZLEVBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ2xFLDhCQUE4QjtvQkFDOUIsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUc7d0JBQ3JCLEdBQUcsV0FBVzt3QkFDZCxHQUFHLE9BQU87cUJBQ2IsQ0FBQztvQkFFRixtQkFBbUI7b0JBQ25CLE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQztnQkFDOUIsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsK0JBQStCLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLGNBQWM7Z0JBQ2QsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3JDLENBQUM7WUFFRCxtRkFBbUY7WUFDbkYsSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sT0FBTyxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDaEUsSUFBSSxPQUFPLENBQUMsVUFBVSxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUNoQyxPQUFPLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDOUIsQ0FBQztxQkFBTSxJQUFJLE9BQU8sQ0FBQyxVQUFVLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQ3hDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO2dCQUMvQixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxpQ0FBaUM7UUFDakMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RCxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUYsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzdILE9BQU8sOEJBQXFCLENBQUMsTUFBTSxDQUFDO2dCQUNoQyxRQUFRLEVBQUUsT0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ3hELFFBQVEsRUFBRSxPQUFDLENBQUMsTUFBTSxDQUFDO29CQUNmLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsa0NBQWtDLENBQUM7aUJBQ3pGLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxrQ0FBa0MsQ0FBQzthQUMxRixDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxTQUFTLEdBQUcsT0FBQyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsRUFBRTtZQUMvQyxHQUFHLGdDQUF1QjtZQUMxQixHQUFHLGNBQWM7WUFDakIsdUNBQThCO1NBQzFCLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFTSxrQkFBa0IsQ0FBQyxRQUFnQixFQUFFLFNBQWlCLEVBQUUsS0FBVTtRQUNyRSxJQUFJLFFBQVEsS0FBSyxlQUFlLEVBQUUsQ0FBQztZQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxTQUFTLEtBQUssS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMvSCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBakpELGtDQWlKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHogfSBmcm9tICd6b2QnO1xuaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IFNjaGVtYUJ1aWxkQmFzZU9wdGlvbiwgU2NoZW1hS25vd25CdWlsZE9wdGlvbnMsIFNjaGVtYU90aGVyUGxhdGZvcm1CdWlsZE9wdGlvbiB9IGZyb20gJy4uLy4uL2FwaS9idWlsZGVyL3NjaGVtYSc7XG5cbmNvbnN0IEtOT1dOX0JVSUxEX1BMQVRGT1JNUyA9IFsnd2ViLWRlc2t0b3AnLCAnd2ViLW1vYmlsZScsICdhbmRyb2lkJywgJ2lvcycsICd3aW5kb3dzJywgJ21hYycsICdvaG9zJywgJ2hhcm1vbnlvcy1uZXh0JywgJ2dvb2dsZS1wbGF5JywgJ2h1YXdlaS1hZ2MnXTtcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXJIb29rIHtcbiAgICBwcml2YXRlIGR5bmFtaWNQbGF0Zm9ybXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5zY2FuUGxhdGZvcm1QYWNrYWdlcygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaJq+aPjyBwYWNrYWdlcy9wbGF0Zm9ybXMg55uu5b2V5LiL55qE5bmz5Y+w5o+S5Lu2XG4gICAgICovXG4gICAgcHJpdmF0ZSBzY2FuUGxhdGZvcm1QYWNrYWdlcygpIHtcbiAgICAgICAgY29uc3QgcGxhdGZvcm1zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBwbGF0Zm9ybXNEaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uLy4uL3BhY2thZ2VzL3BsYXRmb3JtcycpO1xuXG4gICAgICAgIGlmICghZXhpc3RzU3luYyhwbGF0Zm9ybXNEaXIpKSB7XG4gICAgICAgICAgICB0aGlzLmR5bmFtaWNQbGF0Zm9ybXMgPSBwbGF0Zm9ybXM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGlycyA9IHJlYWRkaXJTeW5jKHBsYXRmb3Jtc0Rpcik7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGtnSnNvblBhdGggPSBqb2luKHBsYXRmb3Jtc0RpciwgZGlyLCAncGFja2FnZS5qc29uJyk7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMocGtnSnNvblBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwa2dDb250ZW50ID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMocGtnSnNvblBhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaYr+W5s+WPsOaPkuS7tiAoY29udHJpYnV0ZXMuYnVpbGRlci5yZWdpc3RlciA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwa2dDb250ZW50Py5jb250cmlidXRlcz8uYnVpbGRlcj8ucmVnaXN0ZXIgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDkvJjlhYjkvb/nlKggY29udHJpYnV0ZXMuYnVpbGRlci5wbGF0Zm9ybe+8jOWmguaenOayoeacieWImeS9v+eUqCBwYWNrYWdlLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGF0Zm9ybU5hbWUgPSBwa2dDb250ZW50LmNvbnRyaWJ1dGVzLmJ1aWxkZXIucGxhdGZvcm0gfHwgcGtnQ29udGVudC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGF0Zm9ybU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhdGZvcm1zLnB1c2gocGxhdGZvcm1OYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIHBhcnNlIHBhY2thZ2UuanNvbiBmb3IgJHtkaXJ9OmAsIGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2NhbiBwbGF0Zm9ybSBwYWNrYWdlczonLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHluYW1pY1BsYXRmb3JtcyA9IHBsYXRmb3JtcztcbiAgICB9XG5cbiAgICBwdWJsaWMgb25SZWdpc3RlclBhcmFtKHRvb2xOYW1lOiBzdHJpbmcsIHBhcmFtOiBhbnksIGlucHV0U2NoZW1hRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgICAgIGlmICh0b29sTmFtZSAhPT0gJ2J1aWxkZXItYnVpbGQnKSByZXR1cm47XG5cbiAgICAgICAgLy8g5ZCI5bm25Y676YeNXG4gICAgICAgIGNvbnN0IGFsbFBsYXRmb3JtcyA9IEFycmF5LmZyb20obmV3IFNldChbLi4uS05PV05fQlVJTERfUExBVEZPUk1TLCAuLi50aGlzLmR5bmFtaWNQbGF0Zm9ybXNdKSk7XG4gICAgICAgIGNvbnN0IHBsYXRmb3JtRGVzYyA9IGBQbGF0Zm9ybSBJZGVudGlmaWVyIChlLmcuLCAke2FsbFBsYXRmb3Jtcy5qb2luKCcsICcpfSlgO1xuXG4gICAgICAgIGlmIChwYXJhbS5uYW1lID09PSAnb3B0aW9ucycpIHtcbiAgICAgICAgICAgIC8vIOS9v+eUqCB6Lm9iamVjdCgpLnBhc3N0aHJvdWdoKCkg6ICM6Z2eIHouYW55KCnvvIznoa7kv53ovazmjaLlh7rnmoQgSlNPTiBTY2hlbWEg5bim5pyJIHR5cGU6IG9iamVjdO+8jFxuICAgICAgICAgICAgLy8g5ZCm5YiZ5Y+C5pWw5pegIHR5cGXvvIzpg6jliIbmqKHlnovvvIjlpoIgR2VtaW5p77yJ5Lya6ZmN57qn5oiQIHN0cmluZyDlubbmiorlr7nosaEgSlNPTi5zdHJpbmdpZnkg5oiQ5a2X56ym5Liy5Lyg5YWl44CCXG4gICAgICAgICAgICAvLyDor6bnu4bmoKHpqozku43lu7bov5/liLDmiafooYzpmLbmrrUgb25CZWZvcmVFeGVjdXRlIOWujOaIkOOAglxuICAgICAgICAgICAgY29uc3Qgc2ltcGxlU2NoZW1hID0gei5vYmplY3Qoe30pXG4gICAgICAgICAgICAgICAgLnBhc3N0aHJvdWdoKClcbiAgICAgICAgICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAgICAgICAgIC5kZXNjcmliZSgnQnVpbGQgb3B0aW9ucyAoRGV0YWlsZWQgdmFsaWRhdGlvbiBpcyBkZWZlcnJlZCB0byBleGVjdXRpb24pJyk7XG4gICAgICAgICAgICBpbnB1dFNjaGVtYUZpZWxkc1twYXJhbS5uYW1lXSA9IHNpbXBsZVNjaGVtYTtcbiAgICAgICAgICAgIHBhcmFtLnNjaGVtYSA9IHNpbXBsZVNjaGVtYTtcblxuICAgICAgICB9IGVsc2UgaWYgKHBhcmFtLm5hbWUgPT09ICdwbGF0Zm9ybScpIHtcbiAgICAgICAgICAgIC8vIOWKqOaAgeabtOaWsCBwbGF0Zm9ybSDlj4LmlbDnmoTmj4/ov7DvvIzljIXlkKvmiavmj4/liLDnmoTlubPlj7BcbiAgICAgICAgICAgIGNvbnN0IG5ld1BsYXRmb3JtU2NoZW1hID0gcGFyYW0uc2NoZW1hLmRlc2NyaWJlKHBsYXRmb3JtRGVzYyk7XG4gICAgICAgICAgICBpbnB1dFNjaGVtYUZpZWxkc1twYXJhbS5uYW1lXSA9IG5ld1BsYXRmb3JtU2NoZW1hO1xuICAgICAgICAgICAgcGFyYW0uc2NoZW1hID0gbmV3UGxhdGZvcm1TY2hlbWE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25CZWZvcmVFeGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSkge1xuICAgICAgICBpZiAodG9vbE5hbWUgIT09ICdidWlsZGVyLWJ1aWxkJykgcmV0dXJuO1xuXG4gICAgICAgIGlmICghYXJncy5vcHRpb25zKSB7XG4gICAgICAgICAgICBhcmdzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhiBjb25maWdQYXRoXG4gICAgICAgIGxldCBvcHRpb25zID0gYXJncy5vcHRpb25zO1xuICAgICAgICBpZiAob3B0aW9ucy5jb25maWdQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWdQYXRoID0gb3B0aW9ucy5jb25maWdQYXRoO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlQ29udGVudCA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKGNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5ZCI5bm26YWN572u77yMYXJncy5vcHRpb25zIOS8mOWFiOe6p+mrmOS6jumFjee9ruaWh+S7tlxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gYXJncy5vcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uZmlsZUNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5vcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5Yig6ZmkIGNvbmZpZ1BhdGgg5a2X5q61XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLmNvbmZpZ1BhdGg7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBsb2FkIGNvbmZpZyBmaWxlOiAke2NvbmZpZ1BhdGh9YCwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnBsYXRmb3JtKSB7XG4gICAgICAgICAgICAgICAgLy8g5rOo5YWlIHBsYXRmb3JtXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wbGF0Zm9ybSA9IGFyZ3MucGxhdGZvcm07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNvdXJjZU1hcHMgZXhwb3J0ZWQgYnkgQ29jb3NFZGl0b3IgaXMgYSBzdHJpbmcsIHNvIG5lZWQgdG8gY29udmVydCBpdCB0byBib29sZWFuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zb3VyY2VNYXBzICYmIHR5cGVvZiBvcHRpb25zLnNvdXJjZU1hcHMgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnNvdXJjZU1hcHMgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnNvdXJjZU1hcHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5zb3VyY2VNYXBzID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc291cmNlTWFwcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWKqOaAgeaehOW7uiBTY2hlbWFCdWlsZE9wdGlvbiDlubbov5vooYzkuKXmoLzmoKHpqoxcbiAgICAgICAgY29uc3QgZHluYW1pY1BsYXRmb3JtcyA9IG5ldyBTZXQodGhpcy5keW5hbWljUGxhdGZvcm1zKTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnBsYXRmb3JtID09PSAnc3RyaW5nJyAmJiAhS05PV05fQlVJTERfUExBVEZPUk1TLmluY2x1ZGVzKG9wdGlvbnMucGxhdGZvcm0pKSB7XG4gICAgICAgICAgICBkeW5hbWljUGxhdGZvcm1zLmFkZChvcHRpb25zLnBsYXRmb3JtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGR5bmFtaWNTY2hlbWFzID0gQXJyYXkuZnJvbShkeW5hbWljUGxhdGZvcm1zKS5maWx0ZXIocGxhdGZvcm0gPT4gIUtOT1dOX0JVSUxEX1BMQVRGT1JNUy5pbmNsdWRlcyhwbGF0Zm9ybSkpLm1hcChwbGF0Zm9ybSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gU2NoZW1hQnVpbGRCYXNlT3B0aW9uLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgcGxhdGZvcm06IHoubGl0ZXJhbChwbGF0Zm9ybSkuZGVzY3JpYmUoJ0J1aWxkIHBsYXRmb3JtJyksXG4gICAgICAgICAgICAgICAgcGFja2FnZXM6IHoub2JqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgW3BsYXRmb3JtXTogei5hbnkoKS5vcHRpb25hbCgpLmRlc2NyaWJlKGAke3BsYXRmb3JtfSBwbGF0Zm9ybSBzcGVjaWZpYyBjb25maWd1cmF0aW9uYClcbiAgICAgICAgICAgICAgICB9KS5jYXRjaGFsbCh6LmFueSgpKS5vcHRpb25hbCgpLmRlc2NyaWJlKGAke3BsYXRmb3JtfSBwbGF0Zm9ybSBzcGVjaWZpYyBjb25maWd1cmF0aW9uYClcbiAgICAgICAgICAgIH0pLmRlc2NyaWJlKGAke3BsYXRmb3JtfSBjb21wbGV0ZSBidWlsZCBvcHRpb25zYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG5ld1NjaGVtYSA9IHouZGlzY3JpbWluYXRlZFVuaW9uKCdwbGF0Zm9ybScsIFtcbiAgICAgICAgICAgIC4uLlNjaGVtYUtub3duQnVpbGRPcHRpb25zLFxuICAgICAgICAgICAgLi4uZHluYW1pY1NjaGVtYXMsXG4gICAgICAgICAgICBTY2hlbWFPdGhlclBsYXRmb3JtQnVpbGRPcHRpb25cbiAgICAgICAgXSBhcyBhbnkpLmRlZmF1bHQoe30pO1xuXG4gICAgICAgIGFyZ3Mub3B0aW9ucyA9IG5ld1NjaGVtYS5wYXJzZShvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25WYWxpZGF0aW9uRmFpbGVkKHRvb2xOYW1lOiBzdHJpbmcsIHBhcmFtTmFtZTogc3RyaW5nLCBlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0b29sTmFtZSA9PT0gJ2J1aWxkZXItYnVpbGQnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcmFtZXRlciB2YWxpZGF0aW9uIGZhaWxlZCBmb3IgJHtwYXJhbU5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==