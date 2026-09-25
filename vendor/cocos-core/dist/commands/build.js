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
exports.BuildCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
const fs_extra_1 = require("fs-extra");
/**
 * Build 命令类
 */
class BuildCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('build')
            .description('Build a Cocos project')
            .requiredOption('-j, --project <path>', 'Path to the Cocos project (required)')
            .requiredOption('-p, --platform <platform>', 'Target platform (web-desktop, web-mobile, android, ios, etc.)')
            .option('-c,--build-config <path>', 'Specify build config file path')
            .option('--ndkPath <path>', 'Android NDK path (for Android platform)')
            .option('--sdkPath <path>', 'Android SDK path (for Android platform)')
            .action(async (options) => {
            try {
                const resolvedPath = this.validateProjectPath(options.project);
                if (options.buildConfig) {
                    if (!(0, fs_extra_1.existsSync)(options.buildConfig)) {
                        console.error(`config: ${options.buildConfig} is not exist!`);
                        process.exit(34 /* BuildExitCode.BUILD_FAILED */);
                    }
                    console.debug(`Read config from path ${options.buildConfig}...`);
                    let data = (0, fs_extra_1.readJSONSync)(options.buildConfig);
                    // 功能点：options 传递的值，允许覆盖配置文件内的同属性值
                    data = Object.assign(data, options);
                    // 避免修改原始 options
                    Object.assign(options, data);
                    // 移除旧的 key 方便和 configPath 未读取的情况做区分
                    delete options.buildConfig;
                }
                // 处理 SDK\NDK 参数
                if (options.sdkPath || options.ndkPath) {
                    if (!options.packages) {
                        options.packages = {};
                    }
                    if (options.ndkPath) {
                        if (options.platform === 'android') {
                            if (!options.packages.android) {
                                options.packages.android = {};
                            }
                            options.packages.android.ndkPath = options.ndkPath;
                        }
                        else if (options.platform == 'google-play') {
                            if (!options.packages['google-play']) {
                                options.packages['google-play'] = {};
                            }
                            options.packages['google-play'].ndkPath = options.ndkPath;
                        }
                        else if (options.platform === 'ohos') {
                            if (!options.packages.ohos) {
                                options.packages.ohos = {};
                            }
                            options.packages.ohos.ndkPath = options.ndkPath;
                        }
                        else if (options.platform === 'harmonyos-next') {
                            if (!options.packages['harmonyos-next']) {
                                options.packages['harmonyos-next'] = {};
                            }
                            options.packages['harmonyos-next'].ndkPath = options.ndkPath;
                        }
                        delete options.ndkPath; // 清理，避免传递到其他地方
                    }
                    if (options.sdkPath) {
                        if (options.platform === 'android') {
                            if (!options.packages.android) {
                                options.packages.android = {};
                            }
                            options.packages.android.sdkPath = options.sdkPath;
                        }
                        else if (options.platform == 'google-play') {
                            if (!options.packages['google-play']) {
                                options.packages['google-play'] = {};
                            }
                            options.packages['google-play'].sdkPath = options.sdkPath;
                        }
                        else if (options.platform === 'ohos') {
                            if (!options.packages.ohos) {
                                options.packages.ohos = {};
                            }
                            options.packages.ohos.sdkPath = options.sdkPath;
                        }
                        else if (options.platform === 'harmonyos-next') {
                            if (!options.packages['harmonyos-next']) {
                                options.packages['harmonyos-next'] = {};
                            }
                            options.packages['harmonyos-next'].sdkPath = options.sdkPath;
                        }
                        delete options.sdkPath; // 清理，避免传递到其他地方
                    }
                }
                const { CocosAPI } = await Promise.resolve().then(() => __importStar(require('../api/index')));
                const result = await CocosAPI.buildProject(resolvedPath, options.platform, options);
                if (result.code === 0 /* BuildExitCode.BUILD_SUCCESS */) {
                    console.log(chalk_1.default.green('✓ Build completed successfully! Build Dest: ' + result.dest));
                }
                else {
                    console.error(chalk_1.default.red('✗ Build failed!'));
                }
                process.exit(result.code);
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to build project:'), error);
                process.exit(1);
            }
        });
    }
}
exports.BuildCommand = BuildCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvYnVpbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLGlDQUFtRDtBQUVuRCx1Q0FBb0Q7QUFHcEQ7O0dBRUc7QUFDSCxNQUFhLFlBQWEsU0FBUSxrQkFBVztJQUN6QyxRQUFRO1FBQ0osSUFBSSxDQUFDLE9BQU87YUFDUCxPQUFPLENBQUMsT0FBTyxDQUFDO2FBQ2hCLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQzthQUNwQyxjQUFjLENBQUMsc0JBQXNCLEVBQUUsc0NBQXNDLENBQUM7YUFDOUUsY0FBYyxDQUFDLDJCQUEyQixFQUFFLCtEQUErRCxDQUFDO2FBQzVHLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxnQ0FBZ0MsQ0FBQzthQUNwRSxNQUFNLENBQUMsa0JBQWtCLEVBQUUseUNBQXlDLENBQUM7YUFDckUsTUFBTSxDQUFDLGtCQUFrQixFQUFFLHlDQUF5QyxDQUFDO2FBQ3JFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDO2dCQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRS9ELElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN0QixJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO3dCQUNuQyxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsT0FBTyxDQUFDLFdBQVcsZ0JBQWdCLENBQUMsQ0FBQzt3QkFDOUQsT0FBTyxDQUFDLElBQUkscUNBQTRCLENBQUM7b0JBQzdDLENBQUM7b0JBQ0QsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsT0FBTyxDQUFDLFdBQVcsS0FBSyxD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QUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3BGLElBQUksTUFBTSxDQUFDLElBQUksd0NBQWdDLEVBQUUsQ0FBQztvQkFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMzRixDQUFDO3FCQUFNLENBQUM7b0JBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztnQkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0NBQ0o7QUFuR0Qsb0NBbUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCB7IEJhc2VDb21tYW5kLCBDb21tYW5kVXRpbHMgfSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHsgSUJ1aWxkQ29tbWFuZE9wdGlvbiwgQnVpbGRFeGl0Q29kZSB9IGZyb20gJy4uL2NvcmUvYnVpbGRlci9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRKU09OU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IG9wZW5JbWFnZUFzc2V0IH0gZnJvbSAnLi4vY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvaW1hZ2UvdXRpbHMnO1xuXG4vKipcbiAqIEJ1aWxkIOWRveS7pOexu1xuICovXG5leHBvcnQgY2xhc3MgQnVpbGRDb21tYW5kIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICAgIHJlZ2lzdGVyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnByb2dyYW1cbiAgICAgICAgICAgIC5jb21tYW5kKCdidWlsZCcpXG4gICAgICAgICAgICAuZGVzY3JpcHRpb24oJ0J1aWxkIGEgQ29jb3MgcHJvamVjdCcpXG4gICAgICAgICAgICAucmVxdWlyZWRPcHRpb24oJy1qLCAtLXByb2plY3QgPHBhdGg+JywgJ1BhdGggdG8gdGhlIENvY29zIHByb2plY3QgKHJlcXVpcmVkKScpXG4gICAgICAgICAgICAucmVxdWlyZWRPcHRpb24oJy1wLCAtLXBsYXRmb3JtIDxwbGF0Zm9ybT4nLCAnVGFyZ2V0IHBsYXRmb3JtICh3ZWItZGVza3RvcCwgd2ViLW1vYmlsZSwgYW5kcm9pZCwgaW9zLCBldGMuKScpXG4gICAgICAgICAgICAub3B0aW9uKCctYywtLWJ1aWxkLWNvbmZpZyA8cGF0aD4nLCAnU3BlY2lmeSBidWlsZCBjb25maWcgZmlsZSBwYXRoJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tbmRrUGF0aCA8cGF0aD4nLCAnQW5kcm9pZCBOREsgcGF0aCAoZm9yIEFuZHJvaWQgcGxhdGZvcm0pJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tc2RrUGF0aCA8cGF0aD4nLCAnQW5kcm9pZCBTREsgcGF0aCAoZm9yIEFuZHJvaWQgcGxhdGZvcm0pJylcbiAgICAgICAgICAgIC5hY3Rpb24oYXN5bmMgKG9wdGlvbnM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMudmFsaWRhdGVQcm9qZWN0UGF0aChvcHRpb25zLnByb2plY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmJ1aWxkQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0c1N5bmMob3B0aW9ucy5idWlsZENvbmZpZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWc6ICR7b3B0aW9ucy5idWlsZENvbmZpZ30gaXMgbm90IGV4aXN0IWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdChCdWlsZEV4aXRDb2RlLkJVSUxEX0ZBSUxFRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBSZWFkIGNvbmZpZyBmcm9tIHBhdGggJHtvcHRpb25zLmJ1aWxkQ29uZmlnfS4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRhdGEgPSByZWFkSlNPTlN5bmMob3B0aW9ucy5idWlsZENvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlip/og73ngrnvvJpvcHRpb25zIOS8oOmAkueahOWAvO+8jOWFgeiuuOimhueblumFjee9ruaWh+S7tuWGheeahOWQjOWxnuaAp+WAvFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IE9iamVjdC5hc3NpZ24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpgb/lhY3kv67mlLnljp/lp4sgb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihvcHRpb25zLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOenu+mZpOaXp+eahCBrZXkg5pa55L6/5ZKMIGNvbmZpZ1BhdGgg5pyq6K+75Y+W55qE5oOF5Ya15YGa5Yy65YiGXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5idWlsZENvbmZpZztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIOWkhOeQhiBTREtcXE5ESyDlj4LmlbBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2RrUGF0aCB8fCBvcHRpb25zLm5ka1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5wYWNrYWdlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGFja2FnZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm5ka1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5wbGF0Zm9ybSA9PT0gJ2FuZHJvaWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5wYWNrYWdlcy5hbmRyb2lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzLmFuZHJvaWQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzLmFuZHJvaWQubmRrUGF0aCA9IG9wdGlvbnMubmRrUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucGxhdGZvcm0gPT0gJ2dvb2dsZS1wbGF5Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMucGFja2FnZXNbJ2dvb2dsZS1wbGF5J10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGFja2FnZXNbJ2dvb2dsZS1wbGF5J10gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzWydnb29nbGUtcGxheSddLm5ka1BhdGggPSBvcHRpb25zLm5ka1BhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnBsYXRmb3JtID09PSAnb2hvcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLnBhY2thZ2VzLm9ob3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGFja2FnZXMub2hvcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGFja2FnZXMub2hvcy5uZGtQYXRoID0gb3B0aW9ucy5uZGtQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wbGF0Zm9ybSA9PT0gJ2hhcm1vbnlvcy1uZXh0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMucGFja2FnZXNbJ2hhcm1vbnlvcy1uZXh0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGFja2FnZXNbJ2hhcm1vbnlvcy1uZXh0J10gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzWydoYXJtb255b3MtbmV4dCddLm5ka1BhdGggPSBvcHRpb25zLm5ka1BhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLm5ka1BhdGg7IC8vIOa4heeQhu+8jOmBv+WFjeS8oOmAkuWIsOWFtuS7luWcsOaWuVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zZGtQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucGxhdGZvcm0gPT09ICdhbmRyb2lkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMucGFja2FnZXMuYW5kcm9pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5wYWNrYWdlcy5hbmRyb2lkID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5wYWNrYWdlcy5hbmRyb2lkLnNka1BhdGggPSBvcHRpb25zLnNka1BhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnBsYXRmb3JtID09ICdnb29nbGUtcGxheScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLnBhY2thZ2VzWydnb29nbGUtcGxheSddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzWydnb29nbGUtcGxheSddID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5wYWNrYWdlc1snZ29vZ2xlLXBsYXknXS5zZGtQYXRoID0gb3B0aW9ucy5zZGtQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wbGF0Zm9ybSA9PT0gJ29ob3MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5wYWNrYWdlcy5vaG9zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzLm9ob3MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzLm9ob3Muc2RrUGF0aCA9IG9wdGlvbnMuc2RrUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucGxhdGZvcm0gPT09ICdoYXJtb255b3MtbmV4dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLnBhY2thZ2VzWydoYXJtb255b3MtbmV4dCddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBhY2thZ2VzWydoYXJtb255b3MtbmV4dCddID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5wYWNrYWdlc1snaGFybW9ueW9zLW5leHQnXS5zZGtQYXRoID0gb3B0aW9ucy5zZGtQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5zZGtQYXRoOyAvLyDmuIXnkIbvvIzpgb/lhY3kvKDpgJLliLDlhbbku5blnLDmlrlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQ29jb3NBUEkgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXBpL2luZGV4Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IENvY29zQVBJLmJ1aWxkUHJvamVjdChyZXNvbHZlZFBhdGgsIG9wdGlvbnMucGxhdGZvcm0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNvZGUgPT09IEJ1aWxkRXhpdENvZGUuQlVJTERfU1VDQ0VTUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJ+KckyBCdWlsZCBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5ISBCdWlsZCBEZXN0OiAnICsgcmVzdWx0LmRlc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCfinJcgQnVpbGQgZmFpbGVkIScpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQocmVzdWx0LmNvZGUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCdGYWlsZWQgdG8gYnVpbGQgcHJvamVjdDonKSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuIl19