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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConfiguration = void 0;
const utils = __importStar(require("./utils"));
const interface_1 = require("./interface");
const events_1 = require("events");
/**
 * 抽象配置类实现
 */
class BaseConfiguration extends events_1.EventEmitter {
    moduleName;
    defaultConfigs;
    configs = {};
    localConfigs = {};
    constructor(moduleName, defaultConfigs = {}) {
        super();
        this.moduleName = moduleName;
        this.defaultConfigs = defaultConfigs;
    }
    getDefaultConfig() {
        return this.defaultConfigs;
    }
    mergeDefaultConfig(defaultConfig) {
        if (!defaultConfig) {
            return;
        }
        this.defaultConfigs = utils.deepMerge(utils.deepMerge({}, this.defaultConfigs), defaultConfig);
    }
    getAll(scope = 'project') {
        if (scope === 'default') {
            return this.getDefaultConfig();
        }
        if (scope === 'local') {
            return this.localConfigs;
        }
        return this.configs;
    }
    async get(key, scope) {
        if (key === undefined) {
            // 不带 key 的合并读：default ← project ← local（后者覆盖前者）
            if (scope === 'default') {
                return this.getDefaultConfig();
            }
            if (scope === 'project') {
                return this.configs;
            }
            if (scope === 'local') {
                return this.localConfigs;
            }
            return utils.deepMerge(utils.deepMerge(this.getDefaultConfig(), this.configs), this.localConfigs);
        }
        const projectConfig = utils.getByDotPath(this.configs, key);
        const localConfig = utils.getByDotPath(this.localConfigs, key);
        const defaultConfig = utils.getByDotPath(this.getDefaultConfig(), key);
        const hasProjectValue = projectConfig !== undefined;
        const hasLocalValue = localConfig !== undefined;
        const hasDefaultValue = defaultConfig !== undefined;
        // 根据作用域决定返回策略
        if (scope === 'project') {
            if (!hasProjectValue) {
                throw new Error(`[Configuration] 通过 ${this.moduleName}.${key} 获取配置失败`);
            }
            return projectConfig;
        }
        if (scope === 'local') {
            // 显式 local 读取只返回本地配置，缺失时返回 undefined，避免和 default 值混淆。
            return localConfig;
        }
        if (scope === 'default') {
            if (!hasDefaultValue) {
                throw new Error(`[Configuration] 通过 ${this.moduleName}.${key} 获取配置失败`);
            }
            return defaultConfig;
        }
        // 合并读：三处都不存在才抛错
        if (!hasProjectValue && !hasLocalValue && !hasDefaultValue) {
            throw new Error(`[Configuration] 通过 ${this.moduleName}.${key} 获取配置失败`);
        }
        return utils.deepMerge(utils.deepMerge(defaultConfig, projectConfig), localConfig);
    }
    async set(key, value, scope = 'project') {
        if (scope === 'default') {
            utils.setByDotPath(this.defaultConfigs, key, value);
        }
        else if (scope === 'local') {
            utils.setByDotPath(this.localConfigs, key, value);
            await this.save('local');
        }
        else {
            utils.setByDotPath(this.configs, key, value);
            await this.save();
        }
        return true;
    }
    async remove(key, scope = 'project') {
        let removed = false;
        if (scope === 'default') {
            // 从默认配置中移除
            if (this.defaultConfigs) {
                removed = utils.removeByDotPath(this.defaultConfigs, key);
            }
        }
        else if (scope === 'local') {
            removed = utils.removeByDotPath(this.localConfigs, key);
            if (removed) {
                await this.save('local');
            }
        }
        else {
            // 从项目配置中移除
            removed = utils.removeByDotPath(this.configs, key);
            if (removed) {
                await this.save();
            }
        }
        return removed;
    }
    async save(scope = 'project') {
        this.emit(interface_1.MessageType.Save, this, scope);
        return true;
    }
}
exports.BaseConfiguration = BaseConfiguration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvY29uZmlndXJhdGlvbi9zY3JpcHQvY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFpQztBQUNqQywyQ0FBOEQ7QUFDOUQsbUNBQXNDO0FBc0R0Qzs7R0FFRztBQUNILE1BQWEsaUJBQWtCLFNBQVEscUJBQVk7SUFLM0I7SUFDTjtJQUxKLE9BQU8sR0FBd0IsRUFBRSxDQUFDO0lBQ2xDLFlBQVksR0FBd0IsRUFBRSxDQUFDO0lBRWpELFlBQ29CLFVBQWtCLEVBQ3hCLGlCQUFzQyxFQUFFO1FBRWxELEtBQUssRUFBRSxDQUFDO1FBSFEsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUN4QixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7SUFHdEQsQ0FBQztJQUVNLGdCQUFnQjtRQUNuQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDL0IsQ0FBQztJQUVNLGtCQUFrQixDQUFDLGFBQW1DO1FBQ3pELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNqQixPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FDakMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUN4QyxhQUFhLENBQ2hCLENBQUM7SUFDTixDQUFDO0lBRU0sTUFBTSxDQUFDLFFBQTRCLFNBQVM7UUFDL0MsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDcEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzdCLENBQUM7UUFDRCxPQUFPLElBQUksQ0FB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QU8sQ0FBQztJQUNuQixDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUksQ0FBQyxRQUE0QixTQUFTO1FBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQWhJRCw4Q0FnSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb25TY29wZSwgTWVzc2FnZVR5cGUgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuXG50eXBlIEV2ZW50RW1pdHRlck1ldGhvZHMgPSBQaWNrPEV2ZW50RW1pdHRlciwgJ29uJyB8ICdvZmYnIHwgJ29uY2UnIHwgJ2VtaXQnPjtcblxuLyoqXG4gKiDphY3nva7ln7rnsbvmjqXlj6NcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJQmFzZUNvbmZpZ3VyYXRpb24gZXh0ZW5kcyBFdmVudEVtaXR0ZXJNZXRob2RzIHtcbiAgICAvKipcbiAgICAgKiDmqKHlnZflkI1cbiAgICAgKi9cbiAgICBtb2R1bGVOYW1lOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiDpu5jorqTphY3nva7mlbDmja5cbiAgICAgKi9cbiAgICBnZXREZWZhdWx0Q29uZmlnKCk6IFJlY29yZDxzdHJpbmcsIGFueT4gfCB1bmRlZmluZWQ7XG4gICAgbWVyZ2VEZWZhdWx0Q29uZmlnKGRlZmF1bHRDb25maWc/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIOiOt+WPlumFjee9ruWAvFxuICAgICAqIEBwYXJhbSBrZXkg6YWN572u6ZSu5ZCN77yM5pSv5oyB54K55Y+35YiG6ZqU55qE5bWM5aWX6Lev5b6EXG4gICAgICogQHBhcmFtIHNjb3BlIOmFjee9ruS9nOeUqOWfn++8jOS4jeaMh+WumuaXtuaMieS8mOWFiOe6p+afpeaJvlxuICAgICAqL1xuICAgIGdldDxUPihrZXk/OiBzdHJpbmcsIHNjb3BlPzogQ29uZmlndXJhdGlvblNjb3BlKTogUHJvbWlzZTxUPjtcblxuICAgIC8qKlxuICAgICAqIOiOt+WPluaMh+WumuiMg+WbtOeahOaJgOaciemFjee9ru+8jOm7mOiupOaYryBwcm9qZWN0XG4gICAgICogQHBhcmFtIHNjb3BlXG4gICAgICovXG4gICAgZ2V0QWxsKHNjb3BlPzogQ29uZmlndXJhdGlvblNjb3BlKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZDtcblxuICAgIC8qKlxuICAgICAqIOiuvue9rumFjee9ruWAvFxuICAgICAqIEBwYXJhbSBrZXkg6YWN572u6ZSu5ZCN77yM5pSv5oyB54K55Y+35YiG6ZqU55qE5bWM5aWX6Lev5b6EXG4gICAgICogQHBhcmFtIHZhbHVlIOaWsOeahOmFjee9ruWAvFxuICAgICAqIEBwYXJhbSBzY29wZSDphY3nva7kvZznlKjln5/vvIzpu5jorqTkuLogJ3Byb2plY3QnXG4gICAgICovXG4gICAgc2V0PFQ+KGtleTogc3RyaW5nLCB2YWx1ZTogVCwgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gICAgLyoqXG4gICAgICog56e76Zmk6YWN572u5YC8XG4gICAgICogQHBhcmFtIGtleSDphY3nva7plK7lkI3vvIzmlK/mjIHngrnlj7fliIbpmpTnmoTltYzlpZfot6/lvoRcbiAgICAgKiBAcGFyYW0gc2NvcGUg6YWN572u5L2c55So5Z+f77yM6buY6K6k5Li6ICdwcm9qZWN0J1xuICAgICAqL1xuICAgIHJlbW92ZShrZXk6IHN0cmluZywgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gICAgLyoqXG4gICAgICog5L+d5a2Y6YWN572uXG4gICAgICogQHBhcmFtIHNjb3BlICdwcm9qZWN0Jyjpu5jorqQpIOS/neWtmOmhueebrumFjee9ru+8mydsb2NhbCcg5L+d5a2Y5Liq5Lq6L+acrOacuumFjee9rlxuICAgICAqL1xuICAgIHNhdmUoc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpOiBQcm9taXNlPGJvb2xlYW4+O1xufVxuXG4vKipcbiAqIOaKveixoemFjee9ruexu+WunueOsFxuICovXG5leHBvcnQgY2xhc3MgQmFzZUNvbmZpZ3VyYXRpb24gZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBJQmFzZUNvbmZpZ3VyYXRpb24ge1xuICAgIHByb3RlY3RlZCBjb25maWdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgcHJvdGVjdGVkIGxvY2FsQ29uZmlnczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBtb2R1bGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHByb3RlY3RlZCBkZWZhdWx0Q29uZmlnczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9XG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERlZmF1bHRDb25maWcoKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRDb25maWdzO1xuICAgIH1cblxuICAgIHB1YmxpYyBtZXJnZURlZmF1bHRDb25maWcoZGVmYXVsdENvbmZpZz86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgaWYgKCFkZWZhdWx0Q29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZWZhdWx0Q29uZmlncyA9IHV0aWxzLmRlZXBNZXJnZShcbiAgICAgICAgICAgIHV0aWxzLmRlZXBNZXJnZSh7fSwgdGhpcy5kZWZhdWx0Q29uZmlncyksXG4gICAgICAgICAgICBkZWZhdWx0Q29uZmlnXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFsbChzY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGlmIChzY29wZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXREZWZhdWx0Q29uZmlnKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjb3BlID09PSAnbG9jYWwnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbENvbmZpZ3M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlncztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZ2V0PFQ+KGtleT86IHN0cmluZywgc2NvcGU/OiBDb25maWd1cmF0aW9uU2NvcGUpOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyDkuI3luKYga2V5IOeahOWQiOW5tuivu++8mmRlZmF1bHQg4oaQIHByb2plY3Qg4oaQIGxvY2Fs77yI5ZCO6ICF6KaG55uW5YmN6ICF77yJXG4gICAgICAgICAgICBpZiAoc2NvcGUgPT09ICdkZWZhdWx0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5nZXREZWZhdWx0Q29uZmlnKCkgYXMgVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2NvcGUgPT09ICdwcm9qZWN0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5jb25maWdzIGFzIFQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNjb3BlID09PSAnbG9jYWwnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmxvY2FsQ29uZmlncyBhcyBUKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1dGlscy5kZWVwTWVyZ2UoXG4gICAgICAgICAgICAgICAgdXRpbHMuZGVlcE1lcmdlKHRoaXMuZ2V0RGVmYXVsdENvbmZpZygpLCB0aGlzLmNvbmZpZ3MpLFxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxDb25maWdzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9qZWN0Q29uZmlnID0gdXRpbHMuZ2V0QnlEb3RQYXRoKHRoaXMuY29uZmlncywga2V5KTtcbiAgICAgICAgY29uc3QgbG9jYWxDb25maWcgPSB1dGlscy5nZXRCeURvdFBhdGgodGhpcy5sb2NhbENvbmZpZ3MsIGtleSk7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSB1dGlscy5nZXRCeURvdFBhdGgodGhpcy5nZXREZWZhdWx0Q29uZmlnKCksIGtleSk7XG4gICAgICAgIGNvbnN0IGhhc1Byb2plY3RWYWx1ZSA9IHByb2plY3RDb25maWcgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgaGFzTG9jYWxWYWx1ZSA9IGxvY2FsQ29uZmlnICE9PSB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IGhhc0RlZmF1bHRWYWx1ZSA9IGRlZmF1bHRDb25maWcgIT09IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyDmoLnmja7kvZznlKjln5/lhrPlrprov5Tlm57nrZbnlaVcbiAgICAgICAgaWYgKHNjb3BlID09PSAncHJvamVjdCcpIHtcbiAgICAgICAgICAgIGlmICghaGFzUHJvamVjdFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbQ29uZmlndXJhdGlvbl0g6YCa6L+HICR7dGhpcy5tb2R1bGVOYW1lfS4ke2tleX0g6I635Y+W6YWN572u5aSx6LSlYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKHByb2plY3RDb25maWcgYXMgVCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUgPT09ICdsb2NhbCcpIHtcbiAgICAgICAgICAgIC8vIOaYvuW8jyBsb2NhbCDor7vlj5blj6rov5Tlm57mnKzlnLDphY3nva7vvIznvLrlpLHml7bov5Tlm54gdW5kZWZpbmVk77yM6YG/5YWN5ZKMIGRlZmF1bHQg5YC85re35reG44CCXG4gICAgICAgICAgICByZXR1cm4gKGxvY2FsQ29uZmlnIGFzIFQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgIGlmICghaGFzRGVmYXVsdFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbQ29uZmlndXJhdGlvbl0g6YCa6L+HICR7dGhpcy5tb2R1bGVOYW1lfS4ke2tleX0g6I635Y+W6YWN572u5aSx6LSlYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKGRlZmF1bHRDb25maWcgYXMgVCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlkIjlubbor7vvvJrkuInlpITpg73kuI3lrZjlnKjmiY3mipvplJlcbiAgICAgICAgaWYgKCFoYXNQcm9qZWN0VmFsdWUgJiYgIWhhc0xvY2FsVmFsdWUgJiYgIWhhc0RlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbQ29uZmlndXJhdGlvbl0g6YCa6L+HICR7dGhpcy5tb2R1bGVOYW1lfS4ke2tleX0g6I635Y+W6YWN572u5aSx6LSlYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHV0aWxzLmRlZXBNZXJnZSh1dGlscy5kZWVwTWVyZ2UoZGVmYXVsdENvbmZpZywgcHJvamVjdENvbmZpZyksIGxvY2FsQ29uZmlnKSBhcyBUKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2V0PFQ+KGtleTogc3RyaW5nLCB2YWx1ZTogVCwgc2NvcGU6IENvbmZpZ3VyYXRpb25TY29wZSA9ICdwcm9qZWN0Jyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoc2NvcGUgPT09ICdkZWZhdWx0Jykge1xuICAgICAgICAgICAgdXRpbHMuc2V0QnlEb3RQYXRoKHRoaXMuZGVmYXVsdENvbmZpZ3MsIGtleSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjb3BlID09PSAnbG9jYWwnKSB7XG4gICAgICAgICAgICB1dGlscy5zZXRCeURvdFBhdGgodGhpcy5sb2NhbENvbmZpZ3MsIGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlKCdsb2NhbCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMuc2V0QnlEb3RQYXRoKHRoaXMuY29uZmlncywga2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcmVtb3ZlKGtleTogc3RyaW5nLCBzY29wZTogQ29uZmlndXJhdGlvblNjb3BlID0gJ3Byb2plY3QnKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGxldCByZW1vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHNjb3BlID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgIC8vIOS7jum7mOiupOmFjee9ruS4reenu+mZpFxuICAgICAgICAgICAgaWYgKHRoaXMuZGVmYXVsdENvbmZpZ3MpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVkID0gdXRpbHMucmVtb3ZlQnlEb3RQYXRoKHRoaXMuZGVmYXVsdENvbmZpZ3MsIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NvcGUgPT09ICdsb2NhbCcpIHtcbiAgICAgICAgICAgIHJlbW92ZWQgPSB1dGlscy5yZW1vdmVCeURvdFBhdGgodGhpcy5sb2NhbENvbmZpZ3MsIGtleSk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgnbG9jYWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOS7jumhueebrumFjee9ruS4reenu+mZpFxuICAgICAgICAgICAgcmVtb3ZlZCA9IHV0aWxzLnJlbW92ZUJ5RG90UGF0aCh0aGlzLmNvbmZpZ3MsIGtleSk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHNhdmUoc2NvcGU6IENvbmZpZ3VyYXRpb25TY29wZSA9ICdwcm9qZWN0Jykge1xuICAgICAgICB0aGlzLmVtaXQoTWVzc2FnZVR5cGUuU2F2ZSwgdGhpcywgc2NvcGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG4iXX0=