"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocosConfigLoader = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const types_1 = require("./types");
const console_1 = require("../../base/console");
/**
 * CocosCreator 旧配置加载器
 */
class CocosConfigLoader {
    initialized = false;
    projectPath = '';
    configMap = new Map();
    initialize(projectPath) {
        if (this.initialized)
            return;
        this.projectPath = projectPath;
        this.initialized = true;
    }
    /**
     * 根据 scope 获取路径
     * @param pkgName
     * @param scope
     * @private
     */
    getPathByScope(pkgName, scope) {
        let dir = '';
        if (scope === 'project') {
            dir = path_1.default.join(this.projectPath, 'settings');
        }
        else if (scope === 'local') {
            dir = path_1.default.join(this.projectPath, 'profiles');
        }
        else {
            dir = path_1.default.join(os_1.default.homedir(), '.CocosCreator', 'profiles');
        }
        return path_1.default.join(dir, types_1.COCOS_CREATOR_VERSION, 'packages', pkgName + '.json');
    }
    /**
     * 加载配置
     * @param scope 配置范围
     * @param pkgName 包名
     * @returns 配置对象
     */
    async loadConfig(scope, pkgName) {
        const configs = this.configMap.get(scope);
        if (configs && configs[pkgName]) {
            return configs[pkgName];
        }
        const pkgPath = this.getPathByScope(pkgName, scope);
        if (await fs_extra_1.default.pathExists(pkgPath)) {
            try {
                const pkg = await fs_extra_1.default.readJSON(pkgPath);
                const configs = this.configMap.get(scope) || {};
                configs[pkgName] = pkg;
                this.configMap.set(scope, configs);
                return pkg;
            }
            catch (error) {
                console_1.newConsole.warn(`[Migration] 加载 ${scope} 配置失败: ${pkgPath} - ${error}`);
            }
        }
        return null;
    }
}
exports.CocosConfigLoader = CocosConfigLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29jb3MtY29uZmlnLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL2NvbmZpZ3VyYXRpb24vbWlncmF0aW9uL2NvY29zLWNvbmZpZy1sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDRDQUFvQjtBQUNwQix3REFBMkI7QUFDM0IsbUNBQXlFO0FBQ3pFLGdEQUFnRDtBQUVoRDs7R0FFRztBQUNILE1BQWEsaUJBQWlCO0lBQ2xCLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDcEIsV0FBVyxHQUFHLEVBQUUsQ0FBQztJQUNqQixTQUFTLEdBQXFCLElBQUksR0FBRyxFQUFFLENBQUM7SUFFekMsVUFBVSxDQUFDLFdBQW1CO1FBQ2pDLElBQUksSUFBSSxDQUFDLFdBQVc7WUFBRSxPQUFPO1FBRTdCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLGNBQWMsQ0FBQyxPQUFlLEVBQUUsS0FBOEI7UUFDbEUsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEIsR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRCxDQUFDO2FBQU0sSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDM0IsR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRCxDQUFDO2FBQU0sQ0FBQztZQUNKLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsNkJBQXFCLEVBQUUsVUFBVSxFQUFFLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQThCLEVBQUUsT0FBZTtRQUNuRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUM5QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEQsSUFBSSxNQUFNLGtCQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDO2dCQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sa0JBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNuQyxPQUFPLEdBQUcsQ0FBQztZQUNmLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNiLG9CQUFVLENBQUMsSUFBSSxDQUFDLGtCQUFrQixLQUFLLFVBQVUsT0FBTyxNQUFNLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDM0UsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUExREQsOENBMERDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IGZzZSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBDb2Nvc0NyZWF0b3JDb25maWdTY29wZSwgQ09DT1NfQ1JFQVRPUl9WRVJTSU9OIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBuZXdDb25zb2xlIH0gZnJvbSAnLi4vLi4vYmFzZS9jb25zb2xlJztcblxuLyoqXG4gKiBDb2Nvc0NyZWF0b3Ig5pen6YWN572u5Yqg6L295ZmoXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2Nvc0NvbmZpZ0xvYWRlciB7XG4gICAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgcHJvamVjdFBhdGggPSAnJztcbiAgICBwcml2YXRlIGNvbmZpZ01hcDogTWFwPHN0cmluZywgYW55PiA9IG5ldyBNYXAoKTtcblxuICAgIHB1YmxpYyBpbml0aWFsaXplKHByb2plY3RQYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICB0aGlzLnByb2plY3RQYXRoID0gcHJvamVjdFBhdGg7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagueaNriBzY29wZSDojrflj5bot6/lvoRcbiAgICAgKiBAcGFyYW0gcGtnTmFtZVxuICAgICAqIEBwYXJhbSBzY29wZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRQYXRoQnlTY29wZShwa2dOYW1lOiBzdHJpbmcsIHNjb3BlOiBDb2Nvc0NyZWF0b3JDb25maWdTY29wZSk6IHN0cmluZyB7XG4gICAgICAgIGxldCBkaXIgPSAnJztcbiAgICAgICAgaWYgKHNjb3BlID09PSAncHJvamVjdCcpIHtcbiAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLnByb2plY3RQYXRoLCAnc2V0dGluZ3MnKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY29wZSA9PT0gJ2xvY2FsJykge1xuICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKHRoaXMucHJvamVjdFBhdGgsICdwcm9maWxlcycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKG9zLmhvbWVkaXIoKSwgJy5Db2Nvc0NyZWF0b3InLCAncHJvZmlsZXMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXRoLmpvaW4oZGlyLCBDT0NPU19DUkVBVE9SX1ZFUlNJT04sICdwYWNrYWdlcycsIHBrZ05hbWUgKyAnLmpzb24nKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliqDovb3phY3nva5cbiAgICAgKiBAcGFyYW0gc2NvcGUg6YWN572u6IyD5Zu0XG4gICAgICogQHBhcmFtIHBrZ05hbWUg5YyF5ZCNXG4gICAgICogQHJldHVybnMg6YWN572u5a+56LGhXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGxvYWRDb25maWcoc2NvcGU6IENvY29zQ3JlYXRvckNvbmZpZ1Njb3BlLCBwa2dOYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBjb25maWdzID0gdGhpcy5jb25maWdNYXAuZ2V0KHNjb3BlKTtcbiAgICAgICAgaWYgKGNvbmZpZ3MgJiYgY29uZmlnc1twa2dOYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZ3NbcGtnTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwa2dQYXRoID0gdGhpcy5nZXRQYXRoQnlTY29wZShwa2dOYW1lLCBzY29wZSk7XG4gICAgICAgIGlmIChhd2FpdCBmc2UucGF0aEV4aXN0cyhwa2dQYXRoKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwa2cgPSBhd2FpdCBmc2UucmVhZEpTT04ocGtnUGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29uZmlncyA9IHRoaXMuY29uZmlnTWFwLmdldChzY29wZSkgfHwge307XG4gICAgICAgICAgICAgICAgY29uZmlnc1twa2dOYW1lXSA9IHBrZztcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ01hcC5zZXQoc2NvcGUsIGNvbmZpZ3MpO1xuICAgICAgICAgICAgICAgIHJldHVybiBwa2c7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUud2FybihgW01pZ3JhdGlvbl0g5Yqg6L29ICR7c2NvcGV9IOmFjee9ruWksei0pTogJHtwa2dQYXRofSAtICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiJdfQ==