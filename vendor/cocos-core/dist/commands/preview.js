"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
const fs_extra_1 = require("fs-extra");
/**
 * Preview 命令类
 */
class PreviewCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('preview')
            .description('Preview a Cocos project')
            .option('-j, --project <path>', 'Path to the Cocos project')
            .option('-p, --port <number>', 'Port number for the preview server', '9527')
            .option('-P, --platform <platform>', 'Target web platform (web-desktop or web-mobile)')
            .option('-c, --build-config <path>', 'Specify build config file path')
            .option('-s, --scene <sceneUrlOrUuid>', 'Start scene (uuid or db:// url); defaults to project start scene')
            .option('--no-open', 'Do not open the preview URL in browser')
            .option('--build', 'Use the legacy build-based preview (full build then serve) instead of the dynamic serve preview')
            .option('--scene-editor', 'Start the scene editor debug preview instead of the game preview')
            .action(async (options) => {
            try {
                const projectPath = options.project ?? this.readLocalConfigProject();
                if (!projectPath) {
                    console.error(chalk_1.default.red('Error: --project is required. Provide it via CLI or config.local.json'));
                    process.exit(1);
                }
                const resolvedPath = this.validateProjectPath(projectPath);
                const port = parseInt(options.port, 10);
                // 验证端口号
                if (isNaN(port) || port < 1 || port > 65535) {
                    console.error(chalk_1.default.red('Error: Invalid port number. Port must be between 1 and 65535.'));
                    process.exit(1);
                }
                const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
                const launcher = new Launcher(resolvedPath);
                if (options.sceneEditor) {
                    await launcher.startSceneEditorPreview({ port, open: options.open });
                }
                else if (options.build) {
                    let buildOptions = {};
                    if (options.buildConfig) {
                        if (!(0, fs_extra_1.existsSync)(options.buildConfig)) {
                            console.error(chalk_1.default.red(`Error: Build config does not exist: ${options.buildConfig}`));
                            process.exit(1);
                        }
                        buildOptions = (0, fs_extra_1.readJSONSync)(options.buildConfig);
                    }
                    const platform = options.platform || buildOptions.platform || 'web-desktop';
                    await launcher.startPreview({
                        port,
                        platform,
                        open: options.open,
                        buildOptions,
                    });
                }
                else {
                    // 默认：动态托管游戏预览（对齐编辑器浏览器预览）
                    await launcher.startGamePreview({
                        port,
                        scene: options.scene,
                        open: options.open,
                    });
                }
                // 保持进程运行
                process.stdin.resume();
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to start preview'));
                console.error(error);
                process.exit(1);
            }
        });
    }
}
exports.PreviewCommand = PreviewCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9wcmV2aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixpQ0FBcUM7QUFDckMsdUNBQW9EO0FBR3BEOztHQUVHO0FBQ0gsTUFBYSxjQUFlLFNBQVEsa0JBQVc7SUFDM0MsUUFBUTtRQUNKLElBQUksQ0FBQyxPQUFPO2FBQ1AsT0FBTyxDQUFDLFNBQVMsQ0FBQzthQUNsQixXQUFXLENBQUMseUJBQXlCLENBQUM7YUFDdEMsTUFBTSxDQUFDLHNCQUFzQixFQUFFLDJCQUEyQixDQUFDO2FBQzNELE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxvQ0FBb0MsRUFBRSxNQUFNLENBQUM7YUFDM0UsTUFBTSxDQUFDLDJCQUEyQixFQUFFLGlEQUFpRCxDQUFDO2FBQ3RGLE1BQU0sQ0FBQywyQkFBMkIsRUFBRSxnQ0FBZ0MsQ0FBQzthQUNyRSxNQUFNLENBQUMsOEJBQThCLEVBQUUsa0VBQWtFLENBQUM7YUFDMUcsTUFBTSxDQUFDLFdBQVcsRUFBRSx3Q0FBd0MsQ0FBQzthQUM3RCxNQUFNLENBQUMsU0FBUyxFQUFFLGlHQUFpRyxDQUFDO2FBQ3BILE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxrRUFBa0UsQ0FBQzthQUM1RixNQUFNLENBQUMsS0FBSyxFQUFFLE9BQVksRUFBRSxFQUFFO1lBQzNCLElBQUksQ0FBQztnQkFDRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUNyRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLHVFQUF1RSxDQUFDLENBQUMsQ0FBQztvQkFDbEcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztnQkFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzNELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUV4QyxRQUFRO2dCQUNSLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEtBQUssRUFBRSxDQUFDO29CQUMxQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsK0RBQStELENBQUMsQ0FBQyxDQUFDO29CQUMxRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixDQUFDO2dCQUVELE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsd0RBQWEsa0JBQWtCLEdBQUMsQ0FBQztnQkFDL0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzVDLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN0QixNQUFNLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3pFLENBQUM7cUJBQU0sSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3ZCLElBQUksWUFBWSxHQUF3QixFQUFFLENBQUM7b0JBQzNDLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUN0QixJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDOzRCQUNuQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsdUNBQXVDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZGLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3BCLENBQUM7d0JBQ0QsWUFBWSxHQUFHLElBQUEsdUJBQVksRUFBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ3JELENBQUM7b0JBRUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxZQUFZLENBQUMsUUFBUSxJQUFJLGFBQWEsQ0FBQztvQkFDNUUsTUFBTSxRQUFRLENBQUMsWUFBWSxDQUFDO3dCQUN4QixJQUFJO3dCQUNKLFFBQVE7d0JBQ1IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO3dCQUNsQixZQUFZO3FCQUNmLENBQUMsQ0FBQztnQkFDUCxDQUFDO3FCQUFNLENBQUM7b0JBQ0osMEJBQTBCO29CQUMxQixNQUFNLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQzt3QkFDNUIsSUFBSTt3QkFDSixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7d0JBQ3BCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtxQkFDckIsQ0FBQyxDQUFDO2dCQUNQLENBQUM7Z0JBR0QsU0FBUztnQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztDQUNKO0FBckVELHdDQXFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBCYXNlQ29tbWFuZCB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkSlNPTlN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5cblxuLyoqXG4gKiBQcmV2aWV3IOWRveS7pOexu1xuICovXG5leHBvcnQgY2xhc3MgUHJldmlld0NvbW1hbmQgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG4gICAgcmVnaXN0ZXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJvZ3JhbVxuICAgICAgICAgICAgLmNvbW1hbmQoJ3ByZXZpZXcnKVxuICAgICAgICAgICAgLmRlc2NyaXB0aW9uKCdQcmV2aWV3IGEgQ29jb3MgcHJvamVjdCcpXG4gICAgICAgICAgICAub3B0aW9uKCctaiwgLS1wcm9qZWN0IDxwYXRoPicsICdQYXRoIHRvIHRoZSBDb2NvcyBwcm9qZWN0JylcbiAgICAgICAgICAgIC5vcHRpb24oJy1wLCAtLXBvcnQgPG51bWJlcj4nLCAnUG9ydCBudW1iZXIgZm9yIHRoZSBwcmV2aWV3IHNlcnZlcicsICc5NTI3JylcbiAgICAgICAgICAgIC5vcHRpb24oJy1QLCAtLXBsYXRmb3JtIDxwbGF0Zm9ybT4nLCAnVGFyZ2V0IHdlYiBwbGF0Zm9ybSAod2ViLWRlc2t0b3Agb3Igd2ViLW1vYmlsZSknKVxuICAgICAgICAgICAgLm9wdGlvbignLWMsIC0tYnVpbGQtY29uZmlnIDxwYXRoPicsICdTcGVjaWZ5IGJ1aWxkIGNvbmZpZyBmaWxlIHBhdGgnKVxuICAgICAgICAgICAgLm9wdGlvbignLXMsIC0tc2NlbmUgPHNjZW5lVXJsT3JVdWlkPicsICdTdGFydCBzY2VuZSAodXVpZCBvciBkYjovLyB1cmwpOyBkZWZhdWx0cyB0byBwcm9qZWN0IHN0YXJ0IHNjZW5lJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tbm8tb3BlbicsICdEbyBub3Qgb3BlbiB0aGUgcHJldmlldyBVUkwgaW4gYnJvd3NlcicpXG4gICAgICAgICAgICAub3B0aW9uKCctLWJ1aWxkJywgJ1VzZSB0aGUgbGVnYWN5IGJ1aWxkLWJhc2VkIHByZXZpZXcgKGZ1bGwgYnVpbGQgdGhlbiBzZXJ2ZSkgaW5zdGVhZCBvZiB0aGUgZHluYW1pYyBzZXJ2ZSBwcmV2aWV3JylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tc2NlbmUtZWRpdG9yJywgJ1N0YXJ0IHRoZSBzY2VuZSBlZGl0b3IgZGVidWcgcHJldmlldyBpbnN0ZWFkIG9mIHRoZSBnYW1lIHByZXZpZXcnKVxuICAgICAgICAgICAgLmFjdGlvbihhc3luYyAob3B0aW9uczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBvcHRpb25zLnByb2plY3QgPz8gdGhpcy5yZWFkTG9jYWxDb25maWdQcm9qZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCdFcnJvcjogLS1wcm9qZWN0IGlzIHJlcXVpcmVkLiBQcm92aWRlIGl0IHZpYSBDTEkgb3IgY29uZmlnLmxvY2FsLmpzb24nKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy52YWxpZGF0ZVByb2plY3RQYXRoKHByb2plY3RQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9ydCA9IHBhcnNlSW50KG9wdGlvbnMucG9ydCwgMTApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOmqjOivgeerr+WPo+WPt1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4ocG9ydCkgfHwgcG9ydCA8IDEgfHwgcG9ydCA+IDY1NTM1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZCgnRXJyb3I6IEludmFsaWQgcG9ydCBudW1iZXIuIFBvcnQgbXVzdCBiZSBiZXR3ZWVuIDEgYW5kIDY1NTM1LicpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogTGF1bmNoZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vY29yZS9sYXVuY2hlcicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXVuY2hlciA9IG5ldyBMYXVuY2hlcihyZXNvbHZlZFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zY2VuZUVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbGF1bmNoZXIuc3RhcnRTY2VuZUVkaXRvclByZXZpZXcoeyBwb3J0LCBvcGVuOiBvcHRpb25zLm9wZW4gfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5idWlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJ1aWxkT3B0aW9uczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYnVpbGRDb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0c1N5bmMob3B0aW9ucy5idWlsZENvbmZpZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5yZWQoYEVycm9yOiBCdWlsZCBjb25maWcgZG9lcyBub3QgZXhpc3Q6ICR7b3B0aW9ucy5idWlsZENvbmZpZ31gKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbGRPcHRpb25zID0gcmVhZEpTT05TeW5jKG9wdGlvbnMuYnVpbGRDb25maWcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGF0Zm9ybSA9IG9wdGlvbnMucGxhdGZvcm0gfHwgYnVpbGRPcHRpb25zLnBsYXRmb3JtIHx8ICd3ZWItZGVza3RvcCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBsYXVuY2hlci5zdGFydFByZXZpZXcoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Blbjogb3B0aW9ucy5vcGVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWxkT3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6buY6K6k77ya5Yqo5oCB5omY566h5ri45oiP6aKE6KeI77yI5a+56b2Q57yW6L6R5Zmo5rWP6KeI5Zmo6aKE6KeI77yJXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBsYXVuY2hlci5zdGFydEdhbWVQcmV2aWV3KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lOiBvcHRpb25zLnNjZW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW46IG9wdGlvbnMub3BlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICAvLyDkv53mjIHov5vnqIvov5DooYxcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZCgnRmFpbGVkIHRvIHN0YXJ0IHByZXZpZXcnKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuIl19