"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTaskBase = void 0;
const events_1 = __importDefault(require("events"));
const console_1 = require("../../../../base/console");
const utils_1 = __importDefault(require("../../../../base/utils"));
const i18n_1 = __importDefault(require("../../../../base/i18n"));
const PROGRESS_HEARTBEAT_INTERVAL = 10 * 1000;
const PROGRESS_HEARTBEAT_MAX_RATIO = 0.9;
const PROGRESS_HEARTBEAT_MAX_STEP = 0.01;
const PROGRESS_HEARTBEAT_MIN_STEP = 0.001;
const PROGRESS_HEARTBEAT_STEP_RATIO = 0.25;
const PROGRESS_HEARTBEAT_MAX_DISPLAY = 0.99;
class BuildTaskBase extends events_1.default {
    // break 原因
    breakReason;
    name;
    progress = 0;
    error;
    hookWeight = 0.4;
    id;
    progressHeartbeatEnabled = true;
    buildExitRes = {
        code: 0 /* BuildExitCode.BUILD_SUCCESS */,
        dest: '',
        custom: {},
    };
    progressHeartbeatTimer;
    lastProgressMessage = '';
    displayProgress = 0;
    heartbeatProgressMax = 0;
    constructor(id, name) {
        super();
        this.name = name;
        this.id = id;
    }
    break(reason) {
        this.breakReason = reason;
        this.error = new Error('task is break by reason: ' + reason + '!');
        this.stopProgressHeartbeat();
    }
    onError(error, throwError = true) {
        this.error = error;
        this.stopProgressHeartbeat();
        if (throwError) {
            throw error;
        }
    }
    /**
     * 更新进度消息 log
     * @param message
     * @param increment
     * @param outputType
     */
    updateProcess(message, increment = 0, outputType = 'debug') {
        if (increment) {
            this.progress = utils_1.default.Math.clamp01(this.progress + increment);
            this.displayProgress = Math.max(this.displayProgress, this.progress);
            this.heartbeatProgressMax = this.progress;
        }
        else {
            this.syncDisplayProgress();
        }
        this.lastProgressMessage = message;
        this.emitProgressUpdate(message, outputType);
        this.scheduleProgressHeartbeat();
    }
    startProgressStep(message, stepWeight, outputType = 'debug') {
        this.lastProgressMessage = message;
        this.prepareProgressHeartbeat(stepWeight);
        this.emitProgressUpdate(message, outputType);
        this.scheduleProgressHeartbeat();
    }
    stopProgressHeartbeat() {
        if (this.progressHeartbeatTimer) {
            clearTimeout(this.progressHeartbeatTimer);
            this.progressHeartbeatTimer = undefined;
        }
    }
    scheduleProgressHeartbeat() {
        this.stopProgressHeartbeat();
        if (!this.progressHeartbeatEnabled) {
            return;
        }
        if (this.error || this.breakReason) {
            return;
        }
        this.progressHeartbeatTimer = setTimeout(() => {
            this.emitProgressHeartbeat();
        }, PROGRESS_HEARTBEAT_INTERVAL);
        this.progressHeartbeatTimer.unref?.();
    }
    emitProgressHeartbeat() {
        this.progressHeartbeatTimer = undefined;
        if (this.error || this.breakReason) {
            return;
        }
        const message = this.lastProgressMessage
            ? `Still running: ${this.lastProgressMessage}`
            : `Still running: ${this.name}`;
        this.displayProgress = this.getNextHeartbeatProgress();
        this.emitProgressUpdate(message, 'debug');
        this.scheduleProgressHeartbeat();
    }
    prepareProgressHeartbeat(stepWeight) {
        this.syncDisplayProgress();
        const safeStepWeight = Math.max(stepWeight || 0, 0);
        this.heartbeatProgressMax = utils_1.default.Math.clamp01(this.progress + safeStepWeight * PROGRESS_HEARTBEAT_MAX_RATIO);
    }
    syncDisplayProgress() {
        this.displayProgress = Math.max(this.displayProgress, this.progress);
    }
    emitProgressUpdate(message, outputType) {
        const progress = this.displayProgress;
        this.emit('update', message, progress);
        const percentage = Math.round(progress * 100);
        console_1.newConsole[outputType](`${message} (${percentage}%)`);
    }
    getNextHeartbeatProgress() {
        const maxProgress = Math.min(this.heartbeatProgressMax, PROGRESS_HEARTBEAT_MAX_DISPLAY);
        const restProgress = maxProgress - this.displayProgress;
        if (restProgress <= 0) {
            return this.displayProgress;
        }
        const heartbeatIncrement = Math.max(Math.min(restProgress * PROGRESS_HEARTBEAT_STEP_RATIO, PROGRESS_HEARTBEAT_MAX_STEP), PROGRESS_HEARTBEAT_MIN_STEP);
        return Math.min(this.displayProgress + heartbeatIncrement, maxProgress);
    }
    async runPluginTask(funcName, weight) {
        // 预览 settings 不执行任何构建的钩子函数
        if (!Object.keys(this.hookMap).length || this.error || this.options?.preview) {
            return;
        }
        const increment = this.hookWeight / Object.keys(this.hookMap).length;
        for (let i = 0; i < this.hooksInfo.pkgNameOrder.length; i++) {
            if (this.error) {
                this.onError(this.error);
                return;
            }
            const pkgName = this.hooksInfo.pkgNameOrder[i];
            const info = this.hooksInfo.infos[pkgName];
            let hooks;
            try {
                const trickTimeLabel = `// ---- build task ${pkgName}：${funcName} ----`;
                console_1.newConsole.trackTimeStart(trickTimeLabel);
                hooks = utils_1.default.File.requireFile(info.path);
                if (hooks[funcName]) {
                    this.prepareProgressHeartbeat(increment);
                    // 使用新的 console 方法显示插件任务开始
                    console_1.newConsole.pluginTask(pkgName, funcName, 'start');
                    console.debug(trickTimeLabel);
                    await this.handleHook(hooks[funcName], info.internal);
                    const time = console_1.newConsole.trackTimeEnd(trickTimeLabel, { output: true });
                    // 使用新的 console 方法显示插件任务完成
                    console_1.newConsole.pluginTask(pkgName, funcName, 'complete', `${time}ms`);
                    this.updateProcess(`${pkgName}:${funcName} completed ✓`, increment, 'success');
                }
            }
            catch (error) {
                const errorMsg = i18n_1.default.t('builder.error.run_hooks_failed', {
                    pkgName,
                    funcName,
                });
                // 使用新的 console 方法显示插件任务错误
                console_1.newConsole.pluginTask(pkgName, funcName, 'error');
                this.updateProcess(errorMsg, increment, 'error');
                this.updateProcess(String(error), increment, 'error');
                if (hooks && hooks.throwError || info.internal) {
                    this.onError(error);
                }
            }
        }
    }
}
exports.BuildTaskBase = BuildTaskBase;
