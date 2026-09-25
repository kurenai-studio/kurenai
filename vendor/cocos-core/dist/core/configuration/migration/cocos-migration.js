"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocosMigration = void 0;
const cocos_config_loader_1 = require("./cocos-config-loader");
/**
 * CocosCreator 配置迁移器实现
 */
class CocosMigration {
    static loader = new cocos_config_loader_1.CocosConfigLoader();
    /**
     * 执行迁移
     * @param projectPath 项目路径
     * @param target 迁移目标配置
     * @returns 迁移后的新配置
     */
    static async migrate(projectPath, target) {
        CocosMigration.loader.initialize(projectPath);
        const oldPluginConfig = await CocosMigration.loader.loadConfig(target.sourceScope, target.pluginName);
        if (!oldPluginConfig)
            return {};
        let migratedConfig = await target.migrate(oldPluginConfig);
        // 应用目标路径
        if (target.targetPath) {
            migratedConfig = CocosMigration.applyTargetPath(migratedConfig, target.targetPath);
        }
        return migratedConfig;
    }
    /**
     * 应用目标路径
     * @param config 配置对象
     * @param targetPath 目标路径
     * @returns 应用路径后的配置
     */
    static applyTargetPath(config, targetPath) {
        if (!targetPath)
            return config;
        const pathParts = targetPath.split('.');
        let result = config;
        // 从后往前构建嵌套对象
        for (let i = pathParts.length - 1; i >= 0; i--) {
            result = { [pathParts[i]]: result };
        }
        return result;
    }
}
exports.CocosMigration = CocosMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29jb3MtbWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvY29uZmlndXJhdGlvbi9taWdyYXRpb24vY29jb3MtbWlncmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLCtEQUEwRDtBQUUxRDs7R0FFRztBQUNILE1BQWEsY0FBYztJQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQXNCLElBQUksdUNBQWlCLEVBQUUsQ0FBQztJQUVuRTs7Ozs7T0FLRztJQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQW1CLEVBQUUsTUFBd0I7UUFDckUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUMsTUFBTSxlQUFlLEdBQUcsTUFBTSxjQUFjLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0RyxJQUFJLENBQUMsZUFBZTtZQUFFLE9BQU8sRUFBRSxDQUFDO1FBRWhDLElBQUksY0FBYyxHQUFRLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVoRSxTQUFTO1FBQ1QsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsY0FBYyxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRUQsT0FBTyxjQUFjLENBQUM7SUFDMUIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFXLEVBQUUsVUFBa0I7UUFDMUQsSUFBSSxDQUFDLFVBQVU7WUFBRSxPQUFPLE1BQU0sQ0FBQztRQUUvQixNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVwQixhQUFhO1FBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsTUFBTSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUN4QyxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQzs7QUExQ0wsd0NBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSU1pZ3JhdGlvblRhcmdldCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQ29jb3NDb25maWdMb2FkZXIgfSBmcm9tICcuL2NvY29zLWNvbmZpZy1sb2FkZXInO1xuXG4vKipcbiAqIENvY29zQ3JlYXRvciDphY3nva7ov4Hnp7vlmajlrp7njrBcbiAqL1xuZXhwb3J0IGNsYXNzIENvY29zTWlncmF0aW9uIHtcbiAgICBwcml2YXRlIHN0YXRpYyBsb2FkZXI6IENvY29zQ29uZmlnTG9hZGVyID0gbmV3IENvY29zQ29uZmlnTG9hZGVyKCk7XG5cbiAgICAvKipcbiAgICAgKiDmiafooYzov4Hnp7tcbiAgICAgKiBAcGFyYW0gcHJvamVjdFBhdGgg6aG555uu6Lev5b6EXG4gICAgICogQHBhcmFtIHRhcmdldCDov4Hnp7vnm67moIfphY3nva5cbiAgICAgKiBAcmV0dXJucyDov4Hnp7vlkI7nmoTmlrDphY3nva5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIG1pZ3JhdGUocHJvamVjdFBhdGg6IHN0cmluZywgdGFyZ2V0OiBJTWlncmF0aW9uVGFyZ2V0KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgQ29jb3NNaWdyYXRpb24ubG9hZGVyLmluaXRpYWxpemUocHJvamVjdFBhdGgpO1xuICAgICAgICBjb25zdCBvbGRQbHVnaW5Db25maWcgPSBhd2FpdCBDb2Nvc01pZ3JhdGlvbi5sb2FkZXIubG9hZENvbmZpZyh0YXJnZXQuc291cmNlU2NvcGUsIHRhcmdldC5wbHVnaW5OYW1lKTtcbiAgICAgICAgaWYgKCFvbGRQbHVnaW5Db25maWcpIHJldHVybiB7fTtcblxuICAgICAgICBsZXQgbWlncmF0ZWRDb25maWc6IGFueSA9IGF3YWl0IHRhcmdldC5taWdyYXRlKG9sZFBsdWdpbkNvbmZpZyk7XG5cbiAgICAgICAgLy8g5bqU55So55uu5qCH6Lev5b6EXG4gICAgICAgIGlmICh0YXJnZXQudGFyZ2V0UGF0aCkge1xuICAgICAgICAgICAgbWlncmF0ZWRDb25maWcgPSBDb2Nvc01pZ3JhdGlvbi5hcHBseVRhcmdldFBhdGgobWlncmF0ZWRDb25maWcsIHRhcmdldC50YXJnZXRQYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtaWdyYXRlZENvbmZpZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlupTnlKjnm67moIfot6/lvoRcbiAgICAgKiBAcGFyYW0gY29uZmlnIOmFjee9ruWvueixoVxuICAgICAqIEBwYXJhbSB0YXJnZXRQYXRoIOebruagh+i3r+W+hFxuICAgICAqIEByZXR1cm5zIOW6lOeUqOi3r+W+hOWQjueahOmFjee9rlxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIGFwcGx5VGFyZ2V0UGF0aChjb25maWc6IGFueSwgdGFyZ2V0UGF0aDogc3RyaW5nKTogYW55IHtcbiAgICAgICAgaWYgKCF0YXJnZXRQYXRoKSByZXR1cm4gY29uZmlnO1xuXG4gICAgICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHRhcmdldFBhdGguc3BsaXQoJy4nKTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbmZpZztcblxuICAgICAgICAvLyDku47lkI7lvoDliY3mnoTlu7rltYzlpZflr7nosaFcbiAgICAgICAgZm9yIChsZXQgaSA9IHBhdGhQYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgcmVzdWx0ID0geyBbcGF0aFBhcnRzW2ldXTogcmVzdWx0IH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbiJdfQ==