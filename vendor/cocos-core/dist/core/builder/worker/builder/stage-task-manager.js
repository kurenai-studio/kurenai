"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildStageTask = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const sub_process_manager_1 = require("../worker-pools/sub-process-manager");
const task_base_1 = require("./manager/task-base");
const console_1 = require("../../../base/console");
const global_1 = require("../../share/global");
const plugin_1 = require("../../manager/plugin");
class BuildStageTask extends task_base_1.BuildTaskBase {
    // 从构建包缓存文件内获取到的构建选项信息
    options;
    hooksInfo;
    root;
    hook;
    hookMap;
    constructor(id, config) {
        super(id, config.name);
        this.hooksInfo = config.hooksInfo;
        this.root = config.root;
        this.options = config.buildTaskOptions;
        this.hook = config.hook;
        this.progressHeartbeatEnabled = config.progressHeartbeat !== false;
        // 首字母转为大写后走前后钩子函数流程
        const name = config.name[0].toUpperCase() + config.name.slice(1, config.name.length);
        this.hookMap = {
            [`onBefore${name}`]: `onBefore${name}`,
            [this.name]: this.name,
            [`onAfter${name}`]: `onAfter${name}`,
        };
        this.buildExitRes.dest = config.root;
    }
    async run() {
        const restoreLogSink = console_1.newConsole.createLogSinkRestorer();
        try {
            if (!this.isStageSupported()) {
                return true;
            }
            const trickTimeLabel = `// ---- builder:run-build-stage-${this.name} ----`;
            console.debug(trickTimeLabel);
            // 为了保障构建 + 编译或者单独编译的情况都有统计到，直接加在此处
            console_1.newConsole.trackTimeStart(trickTimeLabel);
            this.updateProcess('init options success', 0.1);
            try {
                for (const taskName of Object.keys(this.hookMap)) {
                    await this.runPluginTask(taskName);
                }
            }
            catch (error) {
                this.error = error;
            }
            await console_1.newConsole.trackTimeEnd(trickTimeLabel, { output: true });
            if (this.error) {
                throw this.error;
            }
            return true;
        }
        finally {
            this.stopProgressHeartbeat();
            restoreLogSink();
        }
    }
    isStageSupported() {
        const platform = String(this.options?.platform || '');
        const stageConfig = platform ? plugin_1.pluginManager.getBuildStageWithHookTasks(platform, this.hook) : null;
        if (stageConfig) {
            return true;
        }
        this.buildExitRes.custom = {
            ...this.buildExitRes.custom,
            skipped: true,
        };
        console.log(`[task:${this.hook}:${platform}]: skipped`);
        return false;
    }
    break(reason) {
        sub_process_manager_1.workerManager.killRunningChilds();
        super.break(reason);
    }
    async handleHook(func, internal) {
        if (internal) {
            await func.call(this, this.root, this.options);
        }
        else {
            await func(this.root, this.options);
        }
    }
    async saveOptions() {
        await (0, fs_extra_1.outputJSON)((0, path_1.join)(this.root, global_1.BuildGlobalInfo.buildOptionsFileName), this.options);
    }
}
exports.BuildStageTask = BuildStageTask;
