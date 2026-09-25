"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConsole = exports.NewConsole = void 0;
exports.formateBytes = formateBytes;
exports.transTimeToNumber = transTimeToNumber;
exports.getRealTime = getRealTime;
const path_1 = require("path");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const consola_1 = require("consola");
const pino_1 = __importDefault(require("pino"));
const i18n_1 = __importDefault(require("./i18n"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
let rawConsole = global.console;
function normalizeLogFilePath(logDest) {
    if (!logDest) {
        return (0, path_1.join)(process.cwd(), 'temp', 'logs', 'cocos.log');
    }
    return (0, path_1.extname)(logDest).toLowerCase() === '.log' ? logDest : `${logDest}.log`;
}
function getLogFileTransportOptions(logDest) {
    const logFile = normalizeLogFilePath(logDest);
    const logDir = (0, path_1.dirname)(logFile);
    return {
        logFile,
        logDir,
        filename: (0, path_1.basename)(logFile, (0, path_1.extname)(logFile)),
    };
}
function appendCriticalLogSync(logDest, type, message) {
    if (!logDest || (type !== 'error' && type !== 'warn')) {
        return;
    }
    const logFile = normalizeLogFilePath(logDest);
    try {
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(logFile));
        const time = new Date().toISOString();
        (0, fs_1.appendFileSync)(logFile, `[${time}] [${type.toUpperCase()}] ${message}\n`, 'utf8');
    }
    catch (_e) {
        // ignore fallback write errors
    }
}
/**
 * 自定义的一个新 console 类型，用于收集日志
 * 集成 console 提供美观的日志输出
 */
class NewConsole {
    command = false;
    messages = [];
    logDest = '';
    _start = false;
    memoryTrackMap = new Map();
    trackTimeStartMap = new Map();
    consola;
    pino = (0, pino_1.default)({
        level: process.env.DEBUG === 'true' || process.argv.includes('--debug')
            ? 'debug' : 'trace', // 暂时全部记录
    });
    cacheLogs = true;
    isLogging = false;
    isVerbose = false;
    // 进度管理相关
    currentSpinner = null;
    progressMode = false;
    lastProgressMessage = '';
    progressStartTime = 0;
    // 去重控制（控制台防抖与重复抑制）
    lastPrintType;
    lastPrintMessage;
    lastPrintTime = 0;
    duplicateSuppressWindowMs = 800;
    _init = false;
    constructor() {
        // 初始化 consola 实例
        this.consola = consola_1.consola.create({
            level: process.env.DEBUG === 'true' || process.argv.includes('--debug') ? 4 : 3,
            formatOptions: {
                colors: true,
                compact: false,
                date: false
            }
        });
        // 检查是否启用详细模式
        this.isVerbose = process.env.DEBUG === 'true' || process.argv.includes('--debug');
    }
    init(logDest, cacheLogs = false) {
        if (this._init) {
            return;
        }
        // 兼容可能存在多个同样自定义 console 的处理
        // @ts-ignore
        if (console.__rawConsole) {
            // @ts-ignore
            rawConsole = console.__rawConsole;
        }
        else {
            rawConsole = console;
        }
        // @ts-ignore 手动继承 console
        this.__proto__.__proto__ = rawConsole;
        this.logDest = normalizeLogFilePath(logDest);
        this.cacheLogs = cacheLogs;
        this._init = true;
    }
    /**
     * 开始记录资源导入日志
     * */
    record(logDest) {
        this.logDest = normalizeLogFilePath(logDest || this.logDest);
        if (this._start) {
            this.resetPinoLogger();
            rawConsole.debug(`Switch record log to {file(${this.logDest})}`);
            return;
        }
        // @ts-ignore
        if (globalThis.console.switchConsole) {
            // @ts-ignore
            globalThis.console.switchConsole(this);
            this._start = true;
            return;
        }
        this.flush(); // Finish previous writes
        const logFileOptions = getLogFileTransportOptions(this.logDest);
        (0, fs_extra_1.ensureDirSync)(logFileOptions.logDir);
        const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
        this.pino = (0, pino_1.default)({
            level: process.env.DEBUG === 'true' || process.argv.includes('--debug')
                ? 'debug' : 'trace', // 暂时全部记录
            transport: !isTest ? {
                targets: [
                    {
                        target: 'pino-transport-rotating-file',
                        options: {
                            dir: logFileOptions.logDir,
                            filename: logFileOptions.filename,
                            enabled: true,
                            size: '1M',
                            interval: '1d',
                            compress: true,
                            immutable: false,
                            retentionDays: 30,
                            compressionOptions: { level: 6, strategy: 0 },
                            errorLogFile: (0, path_1.join)(logFileOptions.logDir, 'errors.log'),
                            timestampFormat: 'iso',
                            skipPretty: false,
                            errorFlushIntervalMs: 100, // Reduced for faster flush
                        },
                    }
                ],
            } : undefined
        });
        this._start = true;
        const EXIT_FLUSH_GUARD = Symbol.for('console.exit.flush');
        // Auto-flush on exit
        if (!process[EXIT_FLUSH_GUARD]) {
            process.on('exit', () => {
                try {
                    this.flush();
                }
                catch (_e) {
                    // console.error('[Console] Flush failed on exit:', e.message);
                }
            });
            process[EXIT_FLUSH_GUARD] = true;
        }
        // @ts-ignore 将处理过的继承自 console 的新对象赋给 windows
        // 保存原始 console 引用，以便其他模块可以访问原始 console 避免死循环
        this.__rawConsole = rawConsole;
        // @ts-ignore
        globalThis.console = this;
        rawConsole.debug(`Start record log in {file(${this.logDest})}`);
    }
    createLogSinkRestorer() {
        const previousLogDest = this.logDest;
        const wasRecording = this._start;
        let restored = false;
        return () => {
            if (restored) {
                return;
            }
            restored = true;
            this.flush();
            if (wasRecording && previousLogDest) {
                this.record(previousLogDest);
                return;
            }
            if (this._start) {
                this.stopRecord();
            }
            this.logDest = previousLogDest;
        };
    }
    /**
     * Reset file log sink.
     */
    resetPinoLogger() {
        this.flush(); // Finish previous writes
        this.logDest = normalizeLogFilePath(this.logDest);
        const logFileOptions = getLogFileTransportOptions(this.logDest);
        (0, fs_extra_1.ensureDirSync)(logFileOptions.logDir);
        const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
        this.pino = (0, pino_1.default)({
            level: process.env.DEBUG === 'true' || process.argv.includes('--debug')
                ? 'debug' : 'trace',
            transport: !isTest ? {
                targets: [
                    {
                        target: 'pino-transport-rotating-file',
                        options: {
                            dir: logFileOptions.logDir,
                            filename: logFileOptions.filename,
                            enabled: true,
                            size: '1M',
                            interval: '1d',
                            compress: true,
                            immutable: false,
                            retentionDays: 30,
                            compressionOptions: { level: 6, strategy: 0 },
                            errorLogFile: (0, path_1.join)(logFileOptions.logDir, 'errors.log'),
                            timestampFormat: 'iso',
                            skipPretty: false,
                            errorFlushIntervalMs: 100, // Reduced for faster flush
                        },
                    }
                ],
            } : undefined
        });
    }
    /**
     * 停止记录
     */
    stopRecord() {
        if (!this._start) {
            console.warn('Console is not recording logs.');
            return;
        }
        rawConsole.debug(`Stop record asset-db log. {file(${this.logDest})}`);
        // @ts-ignore 将处理过的继承自 console 的新对象赋给 windows
        globalThis.console = rawConsole;
        this._start = false;
    }
    // --------------------- 重写 console 相关方法 -------------------------
    /**
     * 将参数数组格式化为消息字符串
     * 支持 Error 对象、多个参数等
     */
    _formatMessage(...args) {
        if (args.length === 0) {
            return '';
        }
        return args.map(arg => {
            if (arg instanceof Error) {
                return arg.stack || arg.message || String(arg);
            }
            return String(arg);
        }).join(' ');
    }
    /**
     * 通用的日志记录方法
     * @param type 日志类型
     * @param args 日志参数
     */
    _logMessage(type, ...args) {
        if (this.isLogging) {
            // 如果正在记录日志，直接返回，避免死循环
            return;
        }
        // 防止递归调用
        this.isLogging = true;
        try {
            const message = this._formatMessage(...args);
            this._handleProgressMessage(type, message);
            if (this._start) {
                this.save();
            }
        }
        catch (error) {
            // 如果日志记录过程中出错，使用原始 console 输出，避免死循环
            // 不能使用 newConsole.error，因为那会再次触发这个流程
            try {
                const rawC = this.__rawConsole || globalThis.console?.__rawConsole || rawConsole;
                rawC.error('[NewConsole] Error in _logMessage:', error);
            }
            catch {
                // 如果连原始 console 都失败了，忽略（避免无限循环）
            }
        }
        finally {
            // 必须在 finally 中重置标志，确保即使出错也能重置
            this.isLogging = false;
        }
    }
    log(...args) {
        this._logMessage('log', ...args);
    }
    info(...args) {
        this._logMessage('info', ...args);
    }
    success(...args) {
        this._logMessage('success', ...args);
    }
    ready(...args) {
        this._logMessage('ready', ...args);
    }
    start(...args) {
        this._logMessage('start', ...args);
    }
    error(...args) {
        this._logMessage('error', ...args);
    }
    warn(...args) {
        this._logMessage('warn', ...args);
    }
    debug(...args) {
        this._logMessage('debug', ...args);
    }
    group(...args) {
        if (args.length > 0) {
            this._logMessage('debug', ...args);
        }
    }
    groupCollapsed(...args) {
        if (args.length > 0) {
            this._logMessage('debug', ...args);
        }
    }
    groupEnd() {
        // Compatibility with native console group APIs.
    }
    /**
     * 处理进度消息显示
     */
    _handleProgressMessage(type, message) {
        // 如果是错误或警告，总是显示
        if (type === 'error') {
            this._stopProgress();
            this._printOnce(type, message);
            return;
        }
        // 在进度模式下，使用 ora 显示
        if (this.progressMode) {
            this._updateProgress(message);
        }
        else {
            // 非进度模式，正常显示
            this._printOnce(type, message);
        }
    }
    /**
     * 控制台输出去重与防抖
     */
    _printOnce(type, message) {
        const now = Date.now();
        if (this.lastPrintType === type && this.lastPrintMessage === message && (now - this.lastPrintTime) < this.duplicateSuppressWindowMs) {
            // 在时间窗口内的重复消息不再打印，避免刷屏
            return;
        }
        this.lastPrintType = type;
        this.lastPrintMessage = message;
        this.lastPrintTime = now;
        // 控制台输出：保留 ANSI 转义码（用于彩色显示）
        // 使用 try-catch 包裹 consola 调用，避免 consola 内部错误触发全局错误处理器导致死循环
        try {
            this.consola[type](message);
        }
        catch (consolaError) {
            // 如果 consola 调用失败，使用原始 console 输出，避免死循环
            try {
                const rawC = this.__rawConsole || globalThis.console?.__rawConsole || rawConsole;
                rawC.error('[NewConsole] Failed to log to consola:', consolaError);
            }
            catch {
                // 如果连原始 console 都失败了，忽略（避免无限循环）
            }
        }
        // 文件日志：去除 ANSI 转义码（避免日志文件中出现乱码）
        const cleanMessage = (0, strip_ansi_1.default)(message);
        this.messages.push({
            type,
            value: cleanMessage,
        });
        // 使用 try-catch 包裹 pino 调用，避免 pino 内部错误触发全局错误处理器导致死循环
        if (this._start) {
            appendCriticalLogSync(this.logDest, type, cleanMessage);
        }
        try {
            switch (type) {
                case 'debug':
                    this.pino.debug(cleanMessage);
                    break;
                case 'log':
                    this.pino.info(cleanMessage);
                    break;
                case 'warn':
                    this.pino.warn(cleanMessage);
                    break;
                case 'error':
                    this.pino.error(cleanMessage);
                    break;
                case 'info':
                    this.pino.info(cleanMessage);
                    break;
                case 'success':
                    this.pino.info(cleanMessage);
                    break;
                case 'ready':
                    this.pino.info(cleanMessage);
                    break;
                case 'start':
                    this.pino.info(cleanMessage);
                    break;
            }
        }
        catch (pinoError) {
            // 如果 pino 调用失败，使用原始 console 输出，避免死循环
            // 不能使用 newConsole.error，因为那会再次触发这个流程
            try {
                const rawC = this.__rawConsole || globalThis.console?.__rawConsole || rawConsole;
                rawC.error('[NewConsole] Failed to log to pino:', pinoError);
            }
            catch {
                // 如果连原始 console 都失败了，忽略（避免无限循环）
            }
        }
    }
    /**
     * 开始进度模式
     */
    startProgress(_initialMessage = 'Processing...') {
        // this.progressMode = true;
        // this.lastProgressMessage = initialMessage;
        // try {
        //     this.currentSpinner = ora({
        //         text: initialMessage,
        //         spinner: 'dots',
        //         color: 'blue'
        //     }).start();
        // } catch (error) {
        //     // 如果 ora 导入失败，回退到简单的文本显示
        //     console.log(`⏳ ${initialMessage}`);
        //     console.error(error);
        // }
    }
    /**
     * 更新进度消息
     */
    _updateProgress(message) {
        if (this.currentSpinner) {
            this.lastProgressMessage = message;
            this.currentSpinner.text = message;
        }
    }
    /**
     * 停止进度模式
     */
    stopProgress(success = true, finalMessage) {
        if (this.currentSpinner) {
            const message = finalMessage || this.lastProgressMessage;
            if (success) {
                this.currentSpinner.succeed(message);
            }
            else {
                this.currentSpinner.fail(message);
            }
            this.currentSpinner = null;
        }
        else {
            // 如果没有 spinner，使用简单的文本显示
            const message = finalMessage || this.lastProgressMessage;
            if (success) {
                console.log(`✅ ${message}`);
            }
            else {
                console.log(`❌ ${message}`);
            }
        }
        this.progressMode = false;
    }
    /**
     * 停止当前进度（不显示成功/失败状态）
     */
    _stopProgress() {
        if (this.currentSpinner) {
            this.currentSpinner.stop();
            this.currentSpinner = null;
        }
        this.progressMode = false;
    }
    async save() {
        if (!this._start || !this.messages.length) {
            return;
        }
        if (!this.cacheLogs) {
            this.messages.shift(); // pop first message
        }
    }
    trackMemoryStart(name) {
        const heapUsed = process.memoryUsage().heapUsed;
        this.memoryTrackMap.set(name, heapUsed);
        return heapUsed;
    }
    trackMemoryEnd(name, _output = true) {
        // TODO test
        // const start = this.memoryTrackMap.get(name);
        // if (!start) {
        //     return 0;
        // }
        // const heapUsed = process.memoryUsage().heapUsed;
        // this.memoryTrackMap.delete(name);
        // const res = heapUsed - start;
        // if (output) {
        //     // 数值过小时不输出，没有统计意义
        //     res > 1024 * 1024 && console.debug(`[Assets Memory track]: ${name} start:${formateBytes(start)}, end ${formateBytes(heapUsed)}, increase: ${formateBytes(res)}`);
        //     return output;
        // }
        // return res;
    }
    trackTimeStart(message, time) {
        if (this.trackTimeStartMap.has(message)) {
            this.trackTimeStartMap.delete(message);
        }
        this.trackTimeStartMap.set(message, time || Date.now());
    }
    trackTimeEnd(message, options = {}, time) {
        const recordTime = this.trackTimeStartMap.get(message);
        if (!recordTime) {
            this.debug(`trackTimeEnd failed! Can not find the track time ${message} start`);
            return 0;
        }
        time = time || Date.now();
        const durTime = time - recordTime;
        const label = typeof options.label === 'string' ? i18n_1.default.transI18nName(options.label) : message;
        this.debug(label + ` (${durTime}ms)`);
        this.trackTimeStartMap.delete(message);
        return durTime;
    }
    // --------------------- 构建相关便捷方法 -------------------------
    /**
     * 显示构建开始信息
     */
    buildStart(platform) {
        this.start(`🚀 Starting build for ${platform}`);
        this.info(`📋 Detailed logs will be saved to log file`);
        this.startProgress(`Building ${platform}...`);
    }
    /**
     * 显示构建完成信息
     */
    buildComplete(platform, duration, success = true) {
        this.stopProgress(success);
        if (success) {
            this.success(`✅ Build completed successfully for ${platform} in ${duration}`);
        }
        else {
            this.error(`❌ Build failed for ${platform} after ${duration}`);
        }
    }
    /**
     * 显示插件任务信息
     */
    pluginTask(pkgName, funcName, status, duration) {
        const pluginInfo = `${pkgName}:${funcName}`;
        switch (status) {
            case 'start':
                this.info(`🔧 ${pluginInfo} starting...`);
                break;
            case 'complete':
                this.success(`✅ ${pluginInfo} completed${duration ? ` in ${duration}` : ''}`);
                break;
            case 'error':
                this.error(`❌ ${pluginInfo} failed`);
                break;
        }
    }
    /**
     * 显示进度信息（在进度模式下更新，否则正常显示）
     */
    progress(message, current, total) {
        const percentage = Math.round((current / total) * 100);
        const progressBar = this.createProgressBar(percentage);
        const progressMessage = `${progressBar} ${percentage}% - ${message}`;
        if (this.progressMode) {
            this._updateProgress(progressMessage);
        }
        else {
            this.info(progressMessage);
        }
    }
    /**
     * 创建进度条
     */
    createProgressBar(percentage, width = 20) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `[${bar}]`;
    }
    /**
     * 显示阶段信息
     */
    stage(stage, message) {
        const stageText = `[${stage}]`;
        if (message) {
            this.info(`${stageText} ${message}`);
        }
        else {
            this.info(stageText);
        }
    }
    /**
     * 显示任务开始（带进度）
     */
    taskStart(taskName, description) {
        const message = description ? `${taskName}: ${description}` : taskName;
        this.start(`🚀 ${message}`);
        this.startProgress(message);
    }
    /**
     * 显示任务完成
     */
    taskComplete(taskName, success = true, duration) {
        const message = duration ? `${taskName} completed in ${duration}` : `${taskName} completed`;
        this.stopProgress(success, message);
        if (success) {
            this.success(`✅ ${message}`);
        }
        else {
            this.error(`❌ ${taskName} failed`);
        }
    }
    flush() {
        try {
            this.pino?.flush?.();
        }
        catch (_e) {
            // ignore
        }
    }
    // --------------------- Common Level -------------------------
    /**
     * 获取最近的日志信息
     */
    queryLogs(count, type) {
        const messages = [];
        for (let i = this.messages.length - 1; i >= 0 && count > 0; --i) {
            const msg = this.messages[i];
            if (!type || msg.type === type) {
                if (type) {
                    messages.push(`${translate(msg.value)}`);
                }
                else {
                    messages.push(`[${msg.type.toUpperCase()}] ${translate(msg.value)}`);
                }
                --count;
            }
        }
        messages.reverse();
        return messages;
    }
    /**
     * 清除所有日志信息
     */
    clearLogs() {
        this.messages.length = 0;
    }
}
exports.NewConsole = NewConsole;
function formateBytes(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
}
function transTimeToNumber(time) {
    time = (0, path_1.basename)(time, '.log');
    const info = time.match(/-(\d+)$/);
    if (info) {
        const timeStr = Array.from(time);
        timeStr[info.index] = ':';
        return new Date(timeStr.join('')).getTime();
    }
    return new Date().getTime();
}
function translate(msg) {
    if (typeof msg === 'string' && !msg.includes('\n') || typeof msg === 'number') {
        return String(msg);
    }
    if (typeof msg === 'string' && msg.includes('\n')) {
        return translate(msg.split('\n'));
    }
    if (typeof msg === 'object') {
        if (Array.isArray(msg)) {
            let res = '';
            msg.forEach((data) => {
                res += `${translate(data)}\r`;
            });
            return res;
        }
        try {
            if (msg.stack) {
                return translate(msg.stack);
            }
            return JSON.stringify(msg);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }
        catch (error) {
            // noop
        }
    }
    return msg && msg.toString && msg.toString();
}
/**
 * 获取最新时间
 * @returns 2019-03-26 11:03
 */
function getRealTime() {
    const time = new Date();
    return time.toLocaleDateString().replace(/\//g, '-') + ' ' + time.toTimeString().slice(0, 8);
}
exports.newConsole = new NewConsole();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2Jhc2UvY29uc29sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFxdEJBLG9DQUVDO0FBRUQsOENBU0M7QUFtQ0Qsa0NBR0M7QUF4d0JELCtCQUF3RDtBQUN4RCwyQkFBb0M7QUFDcEMsdUNBQXlDO0FBQ3pDLHFDQUF3RDtBQUV4RCxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLDREQUFtQztBQWFuQyxJQUFJLFVBQVUsR0FBUSxNQUFNLENBQUMsT0FBTyxDQUFDO0FBRXJDLFNBQVMsb0JBQW9CLENBQUMsT0FBZ0I7SUFDMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsT0FBTyxJQUFBLFdBQUksRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0QsT0FBTyxJQUFBLGNBQU8sRUFBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLE1BQU0sQ0FBQztBQUNsRixDQUFDO0FBRUQsU0FBUywwQkFBMEIsQ0FBQyxPQUFlO0lBQy9DLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUEsY0FBTyxFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLE9BQU87UUFDSCxPQUFPO1FBQ1AsTUFBTTtRQUNOLFFBQVEsRUFBRSxJQUFBLGVBQVEsRUFBQyxPQUFPLEVBQUUsSUFBQSxjQUFPLEVBQUMsT0FBTyxDQUFDLENBQUM7S0FDaEQsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLE9BQWUsRUFBRSxJQUFrQixFQUFFLE9BQWU7SUFDL0UsSUFBSSxDQUFDLE9BQU8sSUFBSSxD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Ozs7R0FHRztBQUNILFNBQWdCLFdBQVc7SUFDdkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUN4QixPQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2pHLENBQUM7QUFFWSxRQUFBLFVBQVUsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFwcGVuZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgZW5zdXJlRGlyU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNvbnNvbGEsIHR5cGUgQ29uc29sYUluc3RhbmNlIH0gZnJvbSAnY29uc29sYSc7XG5pbXBvcnQgdHlwZSB7IE9yYSB9IGZyb20gJ29yYSc7XG5pbXBvcnQgcGlubyBmcm9tICdwaW5vJztcbmltcG9ydCBpMThuIGZyb20gJy4vaTE4bic7XG5pbXBvcnQgc3RyaXBBbnNpIGZyb20gJ3N0cmlwLWFuc2knO1xuZXhwb3J0IHR5cGUgSUNvbnNvbGVUeXBlID0gJ2xvZycgfCAnd2FybicgfCAnZXJyb3InIHwgJ2RlYnVnJyB8ICdpbmZvJyB8ICdzdWNjZXNzJyB8ICdyZWFkeScgfCAnc3RhcnQnO1xuXG5pbnRlcmZhY2UgSUNvbnNvbGVNZXNzYWdlIHtcbiAgICB0eXBlOiBJQ29uc29sZVR5cGUsXG4gICAgdmFsdWU6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgdHJhY2tUaW1lRW5kT3B0aW9ucyB7XG4gICAgb3V0cHV0PzogYm9vbGVhbjtcbiAgICBsYWJlbD86IHN0cmluZztcbiAgICB2YWx1ZT86IG51bWJlcjtcbn1cblxubGV0IHJhd0NvbnNvbGU6IGFueSA9IGdsb2JhbC5jb25zb2xlO1xuXG5mdW5jdGlvbiBub3JtYWxpemVMb2dGaWxlUGF0aChsb2dEZXN0Pzogc3RyaW5nKSB7XG4gICAgaWYgKCFsb2dEZXN0KSB7XG4gICAgICAgIHJldHVybiBqb2luKHByb2Nlc3MuY3dkKCksICd0ZW1wJywgJ2xvZ3MnLCAnY29jb3MubG9nJyk7XG4gICAgfVxuICAgIHJldHVybiBleHRuYW1lKGxvZ0Rlc3QpLnRvTG93ZXJDYXNlKCkgPT09ICcubG9nJyA/IGxvZ0Rlc3QgOiBgJHtsb2dEZXN0fS5sb2dgO1xufVxuXG5mdW5jdGlvbiBnZXRMb2dGaWxlVHJhbnNwb3J0T3B0aW9ucyhsb2dEZXN0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBsb2dGaWxlID0gbm9ybWFsaXplTG9nRmlsZVBhdGgobG9nRGVzdCk7XG4gICAgY29uc3QgbG9nRGlyID0gZGlybmFtZShsb2dGaWxlKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2dGaWxlLFxuICAgICAgICBsb2dEaXIsXG4gICAgICAgIGZpbGVuYW1lOiBiYXNlbmFtZShsb2dGaWxlLCBleHRuYW1lKGxvZ0ZpbGUpKSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDcml0aWNhbExvZ1N5bmMobG9nRGVzdDogc3RyaW5nLCB0eXBlOiBJQ29uc29sZVR5cGUsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIGlmICghbG9nRGVzdCB8fCAodHlwZSAhPT0gJ2Vycm9yJyAmJiB0eXBlICE9PSAnd2FybicpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsb2dGaWxlID0gbm9ybWFsaXplTG9nRmlsZVBhdGgobG9nRGVzdCk7XG4gICAgdHJ5IHtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGxvZ0ZpbGUpKTtcbiAgICAgICAgY29uc3QgdGltZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgYXBwZW5kRmlsZVN5bmMobG9nRmlsZSwgYFske3RpbWV9XSBbJHt0eXBlLnRvVXBwZXJDYXNlKCl9XSAke21lc3NhZ2V9XFxuYCwgJ3V0ZjgnKTtcbiAgICB9IGNhdGNoIChfZSkge1xuICAgICAgICAvLyBpZ25vcmUgZmFsbGJhY2sgd3JpdGUgZXJyb3JzXG4gICAgfVxufVxuXG4vKipcbiAqIOiHquWumuS5ieeahOS4gOS4quaWsCBjb25zb2xlIOexu+Wei++8jOeUqOS6juaUtumbhuaXpeW/l1xuICog6ZuG5oiQIGNvbnNvbGUg5o+Q5L6b576O6KeC55qE5pel5b+X6L6T5Ye6XG4gKi9cbmV4cG9ydCBjbGFzcyBOZXdDb25zb2xlIHtcbiAgICBjb21tYW5kID0gZmFsc2U7XG4gICAgbWVzc2FnZXM6IElDb25zb2xlTWVzc2FnZVtdID0gW107XG4gICAgcHJpdmF0ZSBsb2dEZXN0OiBzdHJpbmcgPSAnJztcbiAgICBwcml2YXRlIF9zdGFydCA9IGZhbHNlO1xuICAgIHByaXZhdGUgbWVtb3J5VHJhY2tNYXA6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSB0cmFja1RpbWVTdGFydE1hcDogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIGNvbnNvbGE6IENvbnNvbGFJbnN0YW5jZTtcbiAgICBwcml2YXRlIHBpbm86IHBpbm8uTG9nZ2VyID0gcGlubyh7XG4gICAgICAgIGxldmVsOiBwcm9jZXNzLmVudi5ERUJVRyA9PT0gJ3RydWUnIHx8IHByb2Nlc3MuYXJndi5pbmNsdWRlcygnLS1kZWJ1ZycpXG4gICAgICAgICAgICA/ICdkZWJ1ZycgOiAndHJhY2UnLCAvLyDmmoLml7blhajpg6jorrDlvZVcbiAgICB9KTtcbiAgICBwcml2YXRlIGNhY2hlTG9ncyA9IHRydWU7XG4gICAgcHJpdmF0ZSBpc0xvZ2dpbmcgPSBmYWxzZTtcbiAgICBwcml2YXRlIGlzVmVyYm9zZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLy8g6L+b5bqm566h55CG55u45YWzXG4gICAgcHJpdmF0ZSBjdXJyZW50U3Bpbm5lcjogT3JhIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBwcm9ncmVzc01vZGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIGxhc3RQcm9ncmVzc01lc3NhZ2U6IHN0cmluZyA9ICcnO1xuICAgIHByaXZhdGUgcHJvZ3Jlc3NTdGFydFRpbWU6IG51bWJlciA9IDA7XG5cbiAgICAvLyDljrvph43mjqfliLbvvIjmjqfliLblj7DpmLLmipbkuI7ph43lpI3mipHliLbvvIlcbiAgICBwcml2YXRlIGxhc3RQcmludFR5cGU/OiBJQ29uc29sZVR5cGU7XG4gICAgcHJpdmF0ZSBsYXN0UHJpbnRNZXNzYWdlPzogc3RyaW5nO1xuICAgIHByaXZhdGUgbGFzdFByaW50VGltZSA9IDA7XG4gICAgcHJpdmF0ZSBkdXBsaWNhdGVTdXBwcmVzc1dpbmRvd01zID0gODAwO1xuXG4gICAgX2luaXQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvLyDliJ3lp4vljJYgY29uc29sYSDlrp7kvotcbiAgICAgICAgdGhpcy5jb25zb2xhID0gY29uc29sYS5jcmVhdGUoe1xuICAgICAgICAgICAgbGV2ZWw6IHByb2Nlc3MuZW52LkRFQlVHID09PSAndHJ1ZScgfHwgcHJvY2Vzcy5hcmd2LmluY2x1ZGVzKCctLWRlYnVnJykgPyA0IDogMyxcbiAgICAgICAgICAgIGZvcm1hdE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBjb2xvcnM6IHRydWUsXG4gICAgICAgICAgICAgICAgY29tcGFjdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgZGF0ZTogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5ZCv55So6K+m57uG5qih5byPXG4gICAgICAgIHRoaXMuaXNWZXJib3NlID0gcHJvY2Vzcy5lbnYuREVCVUcgPT09ICd0cnVlJyB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoJy0tZGVidWcnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdChsb2dEZXN0OiBzdHJpbmcsIGNhY2hlTG9ncyA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5YW85a655Y+v6IO95a2Y5Zyo5aSa5Liq5ZCM5qC36Ieq5a6a5LmJIGNvbnNvbGUg55qE5aSE55CGXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGNvbnNvbGUuX19yYXdDb25zb2xlKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByYXdDb25zb2xlID0gY29uc29sZS5fX3Jhd0NvbnNvbGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByYXdDb25zb2xlID0gY29uc29sZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlIOaJi+WKqOe7p+aJvyBjb25zb2xlXG4gICAgICAgIHRoaXMuX19wcm90b19fLl9fcHJvdG9fXyA9IHJhd0NvbnNvbGU7XG5cbiAgICAgICAgdGhpcy5sb2dEZXN0ID0gbm9ybWFsaXplTG9nRmlsZVBhdGgobG9nRGVzdCk7XG4gICAgICAgIHRoaXMuY2FjaGVMb2dzID0gY2FjaGVMb2dzO1xuXG4gICAgICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW8gOWni+iusOW9lei1hOa6kOWvvOWFpeaXpeW/l1xuICAgICAqICovXG4gICAgcHVibGljIHJlY29yZChsb2dEZXN0Pzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubG9nRGVzdCA9IG5vcm1hbGl6ZUxvZ0ZpbGVQYXRoKGxvZ0Rlc3QgfHwgdGhpcy5sb2dEZXN0KTtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0UGlub0xvZ2dlcigpO1xuICAgICAgICAgICAgcmF3Q29uc29sZS5kZWJ1ZyhgU3dpdGNoIHJlY29yZCBsb2cgdG8ge2ZpbGUoJHt0aGlzLmxvZ0Rlc3R9KX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChnbG9iYWxUaGlzLmNvbnNvbGUuc3dpdGNoQ29uc29sZSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgZ2xvYmFsVGhpcy5jb25zb2xlLnN3aXRjaENvbnNvbGUodGhpcyk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZsdXNoKCk7IC8vIEZpbmlzaCBwcmV2aW91cyB3cml0ZXNcbiAgICAgICAgY29uc3QgbG9nRmlsZU9wdGlvbnMgPSBnZXRMb2dGaWxlVHJhbnNwb3J0T3B0aW9ucyh0aGlzLmxvZ0Rlc3QpO1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGxvZ0ZpbGVPcHRpb25zLmxvZ0Rpcik7XG4gICAgICAgIGNvbnN0IGlzVGVzdCA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAndGVzdCcgfHwgcHJvY2Vzcy5lbnYuSkVTVF9XT1JLRVJfSUQgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5waW5vID0gcGlubyh7XG4gICAgICAgICAgICBsZXZlbDogcHJvY2Vzcy5lbnYuREVCVUcgPT09ICd0cnVlJyB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoJy0tZGVidWcnKVxuICAgICAgICAgICAgICAgID8gJ2RlYnVnJyA6ICd0cmFjZScsIC8vIOaaguaXtuWFqOmDqOiusOW9lVxuICAgICAgICAgICAgdHJhbnNwb3J0OiAhaXNUZXN0ID8ge1xuICAgICAgICAgICAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiAncGluby10cmFuc3BvcnQtcm90YXRpbmctZmlsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyOiBsb2dGaWxlT3B0aW9ucy5sb2dEaXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IGxvZ0ZpbGVPcHRpb25zLmZpbGVuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogJzFNJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnZhbDogJzFkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbW11dGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGVudGlvbkRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uT3B0aW9uczogeyBsZXZlbDogNiwgc3RyYXRlZ3k6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckxvZ0ZpbGU6IGpvaW4obG9nRmlsZU9wdGlvbnMubG9nRGlyLCAnZXJyb3JzLmxvZycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcEZvcm1hdDogJ2lzbycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2tpcFByZXR0eTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JGbHVzaEludGVydmFsTXM6IDEwMCwgLy8gUmVkdWNlZCBmb3IgZmFzdGVyIGZsdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0gOiB1bmRlZmluZWRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fc3RhcnQgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IEVYSVRfRkxVU0hfR1VBUkQgPSBTeW1ib2wuZm9yKCdjb25zb2xlLmV4aXQuZmx1c2gnKTtcbiAgICAgICAgLy8gQXV0by1mbHVzaCBvbiBleGl0XG4gICAgICAgIGlmICghKHByb2Nlc3MgYXMgYW55KVtFWElUX0ZMVVNIX0dVQVJEXSkge1xuICAgICAgICAgICAgcHJvY2Vzcy5vbignZXhpdCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcignW0NvbnNvbGVdIEZsdXNoIGZhaWxlZCBvbiBleGl0OicsIGUubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAocHJvY2VzcyBhcyBhbnkpW0VYSVRfRkxVU0hfR1VBUkRdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmUg5bCG5aSE55CG6L+H55qE57un5om/6IeqIGNvbnNvbGUg55qE5paw5a+56LGh6LWL57uZIHdpbmRvd3NcbiAgICAgICAgLy8g5L+d5a2Y5Y6f5aeLIGNvbnNvbGUg5byV55So77yM5Lul5L6/5YW25LuW5qih5Z2X5Y+v5Lul6K6/6Zeu5Y6f5aeLIGNvbnNvbGUg6YG/5YWN5q275b6q546vXG4gICAgICAgICh0aGlzIGFzIGFueSkuX19yYXdDb25zb2xlID0gcmF3Q29uc29sZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBnbG9iYWxUaGlzLmNvbnNvbGUgPSB0aGlzO1xuICAgICAgICByYXdDb25zb2xlLmRlYnVnKGBTdGFydCByZWNvcmQgbG9nIGluIHtmaWxlKCR7dGhpcy5sb2dEZXN0fSl9YCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZUxvZ1NpbmtSZXN0b3JlcigpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNMb2dEZXN0ID0gdGhpcy5sb2dEZXN0O1xuICAgICAgICBjb25zdCB3YXNSZWNvcmRpbmcgPSB0aGlzLl9zdGFydDtcbiAgICAgICAgbGV0IHJlc3RvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN0b3JlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3RvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZmx1c2goKTtcblxuICAgICAgICAgICAgaWYgKHdhc1JlY29yZGluZyAmJiBwcmV2aW91c0xvZ0Rlc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlY29yZChwcmV2aW91c0xvZ0Rlc3QpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXJ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wUmVjb3JkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxvZ0Rlc3QgPSBwcmV2aW91c0xvZ0Rlc3Q7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgZmlsZSBsb2cgc2luay5cbiAgICAgKi9cbiAgICBwcml2YXRlIHJlc2V0UGlub0xvZ2dlcigpIHtcbiAgICAgICAgdGhpcy5mbHVzaCgpOyAvLyBGaW5pc2ggcHJldmlvdXMgd3JpdGVzXG4gICAgICAgIHRoaXMubG9nRGVzdCA9IG5vcm1hbGl6ZUxvZ0ZpbGVQYXRoKHRoaXMubG9nRGVzdCk7XG4gICAgICAgIGNvbnN0IGxvZ0ZpbGVPcHRpb25zID0gZ2V0TG9nRmlsZVRyYW5zcG9ydE9wdGlvbnModGhpcy5sb2dEZXN0KTtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhsb2dGaWxlT3B0aW9ucy5sb2dEaXIpO1xuXG4gICAgICAgIGNvbnN0IGlzVGVzdCA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAndGVzdCcgfHwgcHJvY2Vzcy5lbnYuSkVTVF9XT1JLRVJfSUQgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5waW5vID0gcGlubyh7XG4gICAgICAgICAgICBsZXZlbDogcHJvY2Vzcy5lbnYuREVCVUcgPT09ICd0cnVlJyB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoJy0tZGVidWcnKVxuICAgICAgICAgICAgICAgID8gJ2RlYnVnJyA6ICd0cmFjZScsXG4gICAgICAgICAgICB0cmFuc3BvcnQ6ICFpc1Rlc3QgPyB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0czogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6ICdwaW5vLXRyYW5zcG9ydC1yb3RhdGluZy1maWxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXI6IGxvZ0ZpbGVPcHRpb25zLmxvZ0RpcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogbG9nRmlsZU9wdGlvbnMuZmlsZW5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAnMU0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVydmFsOiAnMWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltbXV0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0ZW50aW9uRGF5czogMzAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcHJlc3Npb25PcHRpb25zOiB7IGxldmVsOiA2LCBzdHJhdGVneTogMCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTG9nRmlsZTogam9pbihsb2dGaWxlT3B0aW9ucy5sb2dEaXIsICdlcnJvcnMubG9nJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wRm9ybWF0OiAnaXNvJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2lwUHJldHR5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckZsdXNoSW50ZXJ2YWxNczogMTAwLCAvLyBSZWR1Y2VkIGZvciBmYXN0ZXIgZmx1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSA6IHVuZGVmaW5lZFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlgZzmraLorrDlvZVcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RvcFJlY29yZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9zdGFydCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb25zb2xlIGlzIG5vdCByZWNvcmRpbmcgbG9ncy4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByYXdDb25zb2xlLmRlYnVnKGBTdG9wIHJlY29yZCBhc3NldC1kYiBsb2cuIHtmaWxlKCR7dGhpcy5sb2dEZXN0fSl9YCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUg5bCG5aSE55CG6L+H55qE57un5om/6IeqIGNvbnNvbGUg55qE5paw5a+56LGh6LWL57uZIHdpbmRvd3NcbiAgICAgICAgZ2xvYmFsVGhpcy5jb25zb2xlID0gcmF3Q29uc29sZTtcbiAgICAgICAgdGhpcy5fc3RhcnQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0g6YeN5YaZIGNvbnNvbGUg55u45YWz5pa55rOVIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8qKlxuICAgICAqIOWwhuWPguaVsOaVsOe7hOagvOW8j+WMluS4uua2iOaBr+Wtl+espuS4slxuICAgICAqIOaUr+aMgSBFcnJvciDlr7nosaHjgIHlpJrkuKrlj4LmlbDnrYlcbiAgICAgKi9cbiAgICBwcml2YXRlIF9mb3JtYXRNZXNzYWdlKC4uLmFyZ3M6IGFueVtdKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJncy5tYXAoYXJnID0+IHtcbiAgICAgICAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmcuc3RhY2sgfHwgYXJnLm1lc3NhZ2UgfHwgU3RyaW5nKGFyZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKGFyZyk7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpgJrnlKjnmoTml6Xlv5forrDlvZXmlrnms5VcbiAgICAgKiBAcGFyYW0gdHlwZSDml6Xlv5fnsbvlnotcbiAgICAgKiBAcGFyYW0gYXJncyDml6Xlv5flj4LmlbBcbiAgICAgKi9cbiAgICBwcml2YXRlIF9sb2dNZXNzYWdlKHR5cGU6IElDb25zb2xlVHlwZSwgLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaXNMb2dnaW5nKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzmraPlnKjorrDlvZXml6Xlv5fvvIznm7TmjqXov5Tlm57vvIzpgb/lhY3mrbvlvqrnjq9cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDpmLLmraLpgJLlvZLosIPnlKhcbiAgICAgICAgdGhpcy5pc0xvZ2dpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fZm9ybWF0TWVzc2FnZSguLi5hcmdzKTtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVByb2dyZXNzTWVzc2FnZSh0eXBlLCBtZXNzYWdlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXJ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzml6Xlv5forrDlvZXov4fnqIvkuK3lh7rplJnvvIzkvb/nlKjljp/lp4sgY29uc29sZSDovpPlh7rvvIzpgb/lhY3mrbvlvqrnjq9cbiAgICAgICAgICAgIC8vIOS4jeiDveS9v+eUqCBuZXdDb25zb2xlLmVycm9y77yM5Zug5Li66YKj5Lya5YaN5qyh6Kem5Y+R6L+Z5Liq5rWB56iLXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhd0MgPSAodGhpcyBhcyBhbnkpLl9fcmF3Q29uc29sZSB8fCAoZ2xvYmFsVGhpcyBhcyBhbnkpLmNvbnNvbGU/Ll9fcmF3Q29uc29sZSB8fCByYXdDb25zb2xlO1xuICAgICAgICAgICAgICAgIHJhd0MuZXJyb3IoJ1tOZXdDb25zb2xlXSBFcnJvciBpbiBfbG9nTWVzc2FnZTonLCBlcnJvcik7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzov57ljp/lp4sgY29uc29sZSDpg73lpLHotKXkuobvvIzlv73nlaXvvIjpgb/lhY3ml6DpmZDlvqrnjq/vvIlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIC8vIOW/hemhu+WcqCBmaW5hbGx5IOS4remHjee9ruagh+W/l++8jOehruS/neWNs+S9v+WHuumUmeS5n+iDvemHjee9rlxuICAgICAgICAgICAgdGhpcy5pc0xvZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBsb2coLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgdGhpcy5fbG9nTWVzc2FnZSgnbG9nJywgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgcHVibGljIGluZm8oLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgdGhpcy5fbG9nTWVzc2FnZSgnaW5mbycsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdWNjZXNzKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIHRoaXMuX2xvZ01lc3NhZ2UoJ3N1Y2Nlc3MnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZHkoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgdGhpcy5fbG9nTWVzc2FnZSgncmVhZHknLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhcnQoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgdGhpcy5fbG9nTWVzc2FnZSgnc3RhcnQnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZXJyb3IoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgdGhpcy5fbG9nTWVzc2FnZSgnZXJyb3InLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgd2FybiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICB0aGlzLl9sb2dNZXNzYWdlKCd3YXJuJywgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIHRoaXMuX2xvZ01lc3NhZ2UoJ2RlYnVnJywgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdyb3VwKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ01lc3NhZ2UoJ2RlYnVnJywgLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZ3JvdXBDb2xsYXBzZWQoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fbG9nTWVzc2FnZSgnZGVidWcnLCAuLi5hcmdzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBncm91cEVuZCgpIHtcbiAgICAgICAgLy8gQ29tcGF0aWJpbGl0eSB3aXRoIG5hdGl2ZSBjb25zb2xlIGdyb3VwIEFQSXMuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5aSE55CG6L+b5bqm5raI5oGv5pi+56S6XG4gICAgICovXG4gICAgcHJpdmF0ZSBfaGFuZGxlUHJvZ3Jlc3NNZXNzYWdlKHR5cGU6IElDb25zb2xlVHlwZSwgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIC8vIOWmguaenOaYr+mUmeivr+aIluitpuWRiu+8jOaAu+aYr+aYvuekulxuICAgICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgdGhpcy5fc3RvcFByb2dyZXNzKCk7XG4gICAgICAgICAgICB0aGlzLl9wcmludE9uY2UodHlwZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlnKjov5vluqbmqKHlvI/kuIvvvIzkvb/nlKggb3JhIOaYvuekulxuICAgICAgICBpZiAodGhpcy5wcm9ncmVzc01vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVByb2dyZXNzKG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6Z2e6L+b5bqm5qih5byP77yM5q2j5bi45pi+56S6XG4gICAgICAgICAgICB0aGlzLl9wcmludE9uY2UodHlwZSwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmjqfliLblj7DovpPlh7rljrvph43kuI7pmLLmipZcbiAgICAgKi9cbiAgICBwcml2YXRlIF9wcmludE9uY2UodHlwZTogSUNvbnNvbGVUeXBlLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKHRoaXMubGFzdFByaW50VHlwZSA9PT0gdHlwZSAmJiB0aGlzLmxhc3RQcmludE1lc3NhZ2UgPT09IG1lc3NhZ2UgJiYgKG5vdyAtIHRoaXMubGFzdFByaW50VGltZSkgPCB0aGlzLmR1cGxpY2F0ZVN1cHByZXNzV2luZG93TXMpIHtcbiAgICAgICAgICAgIC8vIOWcqOaXtumXtOeql+WPo+WGheeahOmHjeWkjea2iOaBr+S4jeWGjeaJk+WNsO+8jOmBv+WFjeWIt+Wxj1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzdFByaW50VHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMubGFzdFByaW50TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIHRoaXMubGFzdFByaW50VGltZSA9IG5vdztcbiAgICAgICAgXG4gICAgICAgIC8vIOaOp+WItuWPsOi+k+WHuu+8muS/neeVmSBBTlNJIOi9rOS5ieegge+8iOeUqOS6juW9qeiJsuaYvuekuu+8iVxuICAgICAgICAvLyDkvb/nlKggdHJ5LWNhdGNoIOWMheijuSBjb25zb2xhIOiwg+eUqO+8jOmBv+WFjSBjb25zb2xhIOWGhemDqOmUmeivr+inpuWPkeWFqOWxgOmUmeivr+WkhOeQhuWZqOWvvOiHtOatu+W+queOr1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5jb25zb2xhW3R5cGVdKG1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChjb25zb2xhRXJyb3IpIHtcbiAgICAgICAgICAgIC8vIOWmguaenCBjb25zb2xhIOiwg+eUqOWksei0pe+8jOS9v+eUqOWOn+WniyBjb25zb2xlIOi+k+WHuu+8jOmBv+WFjeatu+W+queOr1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByYXdDID0gKHRoaXMgYXMgYW55KS5fX3Jhd0NvbnNvbGUgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5jb25zb2xlPy5fX3Jhd0NvbnNvbGUgfHwgcmF3Q29uc29sZTtcbiAgICAgICAgICAgICAgICByYXdDLmVycm9yKCdbTmV3Q29uc29sZV0gRmFpbGVkIHRvIGxvZyB0byBjb25zb2xhOicsIGNvbnNvbGFFcnJvcik7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzov57ljp/lp4sgY29uc29sZSDpg73lpLHotKXkuobvvIzlv73nlaXvvIjpgb/lhY3ml6DpmZDlvqrnjq/vvIlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5paH5Lu25pel5b+X77ya5Y676ZmkIEFOU0kg6L2s5LmJ56CB77yI6YG/5YWN5pel5b+X5paH5Lu25Lit5Ye6546w5Lmx56CB77yJXG4gICAgICAgIGNvbnN0IGNsZWFuTWVzc2FnZSA9IHN0cmlwQW5zaShtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICB2YWx1ZTogY2xlYW5NZXNzYWdlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDkvb/nlKggdHJ5LWNhdGNoIOWMheijuSBwaW5vIOiwg+eUqO+8jOmBv+WFjSBwaW5vIOWGhemDqOmUmeivr+inpuWPkeWFqOWxgOmUmeivr+WkhOeQhuWZqOWvvOiHtOatu+W+queOr1xuICAgICAgICBpZiAodGhpcy5fc3RhcnQpIHtcbiAgICAgICAgICAgIGFwcGVuZENyaXRpY2FsTG9nU3luYyh0aGlzLmxvZ0Rlc3QsIHR5cGUsIGNsZWFuTWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waW5vLmRlYnVnKGNsZWFuTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2xvZyc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGluby5pbmZvKGNsZWFuTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3dhcm4nOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBpbm8ud2FybihjbGVhbk1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGluby5lcnJvcihjbGVhbk1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdpbmZvJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waW5vLmluZm8oY2xlYW5NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3VjY2Vzcyc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGluby5pbmZvKGNsZWFuTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3JlYWR5JzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waW5vLmluZm8oY2xlYW5NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3RhcnQnOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBpbm8uaW5mbyhjbGVhbk1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAocGlub0Vycm9yKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpwgcGlubyDosIPnlKjlpLHotKXvvIzkvb/nlKjljp/lp4sgY29uc29sZSDovpPlh7rvvIzpgb/lhY3mrbvlvqrnjq9cbiAgICAgICAgICAgIC8vIOS4jeiDveS9v+eUqCBuZXdDb25zb2xlLmVycm9y77yM5Zug5Li66YKj5Lya5YaN5qyh6Kem5Y+R6L+Z5Liq5rWB56iLXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhd0MgPSAodGhpcyBhcyBhbnkpLl9fcmF3Q29uc29sZSB8fCAoZ2xvYmFsVGhpcyBhcyBhbnkpLmNvbnNvbGU/Ll9fcmF3Q29uc29sZSB8fCByYXdDb25zb2xlO1xuICAgICAgICAgICAgICAgIHJhd0MuZXJyb3IoJ1tOZXdDb25zb2xlXSBGYWlsZWQgdG8gbG9nIHRvIHBpbm86JywgcGlub0Vycm9yKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOi/nuWOn+WniyBjb25zb2xlIOmDveWksei0peS6hu+8jOW/veeVpe+8iOmBv+WFjeaXoOmZkOW+queOr++8iVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5byA5aeL6L+b5bqm5qih5byPXG4gICAgICovXG4gICAgcHVibGljIHN0YXJ0UHJvZ3Jlc3MoX2luaXRpYWxNZXNzYWdlOiBzdHJpbmcgPSAnUHJvY2Vzc2luZy4uLicpIHtcbiAgICAgICAgLy8gdGhpcy5wcm9ncmVzc01vZGUgPSB0cnVlO1xuICAgICAgICAvLyB0aGlzLmxhc3RQcm9ncmVzc01lc3NhZ2UgPSBpbml0aWFsTWVzc2FnZTtcblxuICAgICAgICAvLyB0cnkge1xuICAgICAgICAvLyAgICAgdGhpcy5jdXJyZW50U3Bpbm5lciA9IG9yYSh7XG4gICAgICAgIC8vICAgICAgICAgdGV4dDogaW5pdGlhbE1lc3NhZ2UsXG4gICAgICAgIC8vICAgICAgICAgc3Bpbm5lcjogJ2RvdHMnLFxuICAgICAgICAvLyAgICAgICAgIGNvbG9yOiAnYmx1ZSdcbiAgICAgICAgLy8gICAgIH0pLnN0YXJ0KCk7XG4gICAgICAgIC8vIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vICAgICAvLyDlpoLmnpwgb3JhIOWvvOWFpeWksei0pe+8jOWbnumAgOWIsOeugOWNleeahOaWh+acrOaYvuekulxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYOKPsyAke2luaXRpYWxNZXNzYWdlfWApO1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDov5vluqbmtojmga9cbiAgICAgKi9cbiAgICBwcml2YXRlIF91cGRhdGVQcm9ncmVzcyhtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFNwaW5uZXIpIHtcbiAgICAgICAgICAgIHRoaXMubGFzdFByb2dyZXNzTWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTcGlubmVyLnRleHQgPSBtZXNzYWdlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YGc5q2i6L+b5bqm5qih5byPXG4gICAgICovXG4gICAgcHVibGljIHN0b3BQcm9ncmVzcyhzdWNjZXNzOiBib29sZWFuID0gdHJ1ZSwgZmluYWxNZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTcGlubmVyKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZmluYWxNZXNzYWdlIHx8IHRoaXMubGFzdFByb2dyZXNzTWVzc2FnZTtcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3Bpbm5lci5zdWNjZWVkKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTcGlubmVyLmZhaWwobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTcGlubmVyID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOayoeaciSBzcGlubmVy77yM5L2/55So566A5Y2V55qE5paH5pys5pi+56S6XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZmluYWxNZXNzYWdlIHx8IHRoaXMubGFzdFByb2dyZXNzTWVzc2FnZTtcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKchSAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinYwgJHttZXNzYWdlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvZ3Jlc3NNb2RlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YGc5q2i5b2T5YmN6L+b5bqm77yI5LiN5pi+56S65oiQ5YqfL+Wksei0peeKtuaAge+8iVxuICAgICAqL1xuICAgIHByaXZhdGUgX3N0b3BQcm9ncmVzcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFNwaW5uZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNwaW5uZXIuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3Bpbm5lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcm9ncmVzc01vZGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmUoKSB7XG4gICAgICAgIGlmICghdGhpcy5fc3RhcnQgfHwgIXRoaXMubWVzc2FnZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmNhY2hlTG9ncykge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlcy5zaGlmdCgpOyAvLyBwb3AgZmlyc3QgbWVzc2FnZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJhY2tNZW1vcnlTdGFydChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgaGVhcFVzZWQgPSBwcm9jZXNzLm1lbW9yeVVzYWdlKCkuaGVhcFVzZWQ7XG4gICAgICAgIHRoaXMubWVtb3J5VHJhY2tNYXAuc2V0KG5hbWUsIGhlYXBVc2VkKTtcbiAgICAgICAgcmV0dXJuIGhlYXBVc2VkO1xuICAgIH1cblxuICAgIHRyYWNrTWVtb3J5RW5kKG5hbWU6IHN0cmluZywgX291dHB1dCA9IHRydWUpIHtcbiAgICAgICAgLy8gVE9ETyB0ZXN0XG4gICAgICAgIC8vIGNvbnN0IHN0YXJ0ID0gdGhpcy5tZW1vcnlUcmFja01hcC5nZXQobmFtZSk7XG4gICAgICAgIC8vIGlmICghc3RhcnQpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiAwO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGNvbnN0IGhlYXBVc2VkID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpLmhlYXBVc2VkO1xuICAgICAgICAvLyB0aGlzLm1lbW9yeVRyYWNrTWFwLmRlbGV0ZShuYW1lKTtcbiAgICAgICAgLy8gY29uc3QgcmVzID0gaGVhcFVzZWQgLSBzdGFydDtcbiAgICAgICAgLy8gaWYgKG91dHB1dCkge1xuICAgICAgICAvLyAgICAgLy8g5pWw5YC86L+H5bCP5pe25LiN6L6T5Ye677yM5rKh5pyJ57uf6K6h5oSP5LmJXG4gICAgICAgIC8vICAgICByZXMgPiAxMDI0ICogMTAyNCAmJiBjb25zb2xlLmRlYnVnKGBbQXNzZXRzIE1lbW9yeSB0cmFja106ICR7bmFtZX0gc3RhcnQ6JHtmb3JtYXRlQnl0ZXMoc3RhcnQpfSwgZW5kICR7Zm9ybWF0ZUJ5dGVzKGhlYXBVc2VkKX0sIGluY3JlYXNlOiAke2Zvcm1hdGVCeXRlcyhyZXMpfWApO1xuICAgICAgICAvLyAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIHRyYWNrVGltZVN0YXJ0KG1lc3NhZ2U6IHN0cmluZywgdGltZT86IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy50cmFja1RpbWVTdGFydE1hcC5oYXMobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudHJhY2tUaW1lU3RhcnRNYXAuZGVsZXRlKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHJhY2tUaW1lU3RhcnRNYXAuc2V0KG1lc3NhZ2UsIHRpbWUgfHwgRGF0ZS5ub3coKSk7XG4gICAgfVxuXG4gICAgdHJhY2tUaW1lRW5kKG1lc3NhZ2U6IHN0cmluZywgb3B0aW9uczogdHJhY2tUaW1lRW5kT3B0aW9ucyA9IHt9LCB0aW1lPzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgcmVjb3JkVGltZSA9IHRoaXMudHJhY2tUaW1lU3RhcnRNYXAuZ2V0KG1lc3NhZ2UpO1xuICAgICAgICBpZiAoIXJlY29yZFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMuZGVidWcoYHRyYWNrVGltZUVuZCBmYWlsZWQhIENhbiBub3QgZmluZCB0aGUgdHJhY2sgdGltZSAke21lc3NhZ2V9IHN0YXJ0YCk7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICB0aW1lID0gdGltZSB8fCBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBkdXJUaW1lID0gdGltZSAtIHJlY29yZFRpbWU7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gdHlwZW9mIG9wdGlvbnMubGFiZWwgPT09ICdzdHJpbmcnID8gaTE4bi50cmFuc0kxOG5OYW1lKG9wdGlvbnMubGFiZWwpIDogbWVzc2FnZTtcbiAgICAgICAgdGhpcy5kZWJ1ZyhsYWJlbCArIGAgKCR7ZHVyVGltZX1tcylgKTtcbiAgICAgICAgdGhpcy50cmFja1RpbWVTdGFydE1hcC5kZWxldGUobWVzc2FnZSk7XG4gICAgICAgIHJldHVybiBkdXJUaW1lO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLSDmnoTlu7rnm7jlhbPkvr/mjbfmlrnms5UgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLyoqXG4gICAgICog5pi+56S65p6E5bu65byA5aeL5L+h5oGvXG4gICAgICovXG4gICAgcHVibGljIGJ1aWxkU3RhcnQocGxhdGZvcm06IHN0cmluZykge1xuICAgICAgICB0aGlzLnN0YXJ0KGDwn5qAIFN0YXJ0aW5nIGJ1aWxkIGZvciAke3BsYXRmb3JtfWApO1xuICAgICAgICB0aGlzLmluZm8oYPCfk4sgRGV0YWlsZWQgbG9ncyB3aWxsIGJlIHNhdmVkIHRvIGxvZyBmaWxlYCk7XG4gICAgICAgIHRoaXMuc3RhcnRQcm9ncmVzcyhgQnVpbGRpbmcgJHtwbGF0Zm9ybX0uLi5gKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmmL7npLrmnoTlu7rlrozmiJDkv6Hmga9cbiAgICAgKi9cbiAgICBwdWJsaWMgYnVpbGRDb21wbGV0ZShwbGF0Zm9ybTogc3RyaW5nLCBkdXJhdGlvbjogc3RyaW5nLCBzdWNjZXNzOiBib29sZWFuID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnN0b3BQcm9ncmVzcyhzdWNjZXNzKTtcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHRoaXMuc3VjY2Vzcyhg4pyFIEJ1aWxkIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkgZm9yICR7cGxhdGZvcm19IGluICR7ZHVyYXRpb259YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVycm9yKGDinYwgQnVpbGQgZmFpbGVkIGZvciAke3BsYXRmb3JtfSBhZnRlciAke2R1cmF0aW9ufWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pi+56S65o+S5Lu25Lu75Yqh5L+h5oGvXG4gICAgICovXG4gICAgcHVibGljIHBsdWdpblRhc2socGtnTmFtZTogc3RyaW5nLCBmdW5jTmFtZTogc3RyaW5nLCBzdGF0dXM6ICdzdGFydCcgfCAnY29tcGxldGUnIHwgJ2Vycm9yJywgZHVyYXRpb24/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGx1Z2luSW5mbyA9IGAke3BrZ05hbWV9OiR7ZnVuY05hbWV9YDtcbiAgICAgICAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICAgICAgICAgIGNhc2UgJ3N0YXJ0JzpcbiAgICAgICAgICAgICAgICB0aGlzLmluZm8oYPCflKcgJHtwbHVnaW5JbmZvfSBzdGFydGluZy4uLmApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzcyhg4pyFICR7cGx1Z2luSW5mb30gY29tcGxldGVkJHtkdXJhdGlvbiA/IGAgaW4gJHtkdXJhdGlvbn1gIDogJyd9YCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcihg4p2MICR7cGx1Z2luSW5mb30gZmFpbGVkYCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmmL7npLrov5vluqbkv6Hmga/vvIjlnKjov5vluqbmqKHlvI/kuIvmm7TmlrDvvIzlkKbliJnmraPluLjmmL7npLrvvIlcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvZ3Jlc3MobWVzc2FnZTogc3RyaW5nLCBjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgcGVyY2VudGFnZSA9IE1hdGgucm91bmQoKGN1cnJlbnQgLyB0b3RhbCkgKiAxMDApO1xuICAgICAgICBjb25zdCBwcm9ncmVzc0JhciA9IHRoaXMuY3JlYXRlUHJvZ3Jlc3NCYXIocGVyY2VudGFnZSk7XG4gICAgICAgIGNvbnN0IHByb2dyZXNzTWVzc2FnZSA9IGAke3Byb2dyZXNzQmFyfSAke3BlcmNlbnRhZ2V9JSAtICR7bWVzc2FnZX1gO1xuXG4gICAgICAgIGlmICh0aGlzLnByb2dyZXNzTW9kZSkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUHJvZ3Jlc3MocHJvZ3Jlc3NNZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5mbyhwcm9ncmVzc01lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu66L+b5bqm5p2hXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVQcm9ncmVzc0JhcihwZXJjZW50YWdlOiBudW1iZXIsIHdpZHRoOiBudW1iZXIgPSAyMCk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGZpbGxlZCA9IE1hdGgucm91bmQoKHBlcmNlbnRhZ2UgLyAxMDApICogd2lkdGgpO1xuICAgICAgICBjb25zdCBlbXB0eSA9IHdpZHRoIC0gZmlsbGVkO1xuICAgICAgICBjb25zdCBiYXIgPSAn4paIJy5yZXBlYXQoZmlsbGVkKSArICfilpEnLnJlcGVhdChlbXB0eSk7XG4gICAgICAgIHJldHVybiBgWyR7YmFyfV1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaYvuekuumYtuauteS/oeaBr1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGFnZShzdGFnZTogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHN0YWdlVGV4dCA9IGBbJHtzdGFnZX1dYDtcbiAgICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mbyhgJHtzdGFnZVRleHR9ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5mbyhzdGFnZVRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pi+56S65Lu75Yqh5byA5aeL77yI5bim6L+b5bqm77yJXG4gICAgICovXG4gICAgcHVibGljIHRhc2tTdGFydCh0YXNrTmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZGVzY3JpcHRpb24gPyBgJHt0YXNrTmFtZX06ICR7ZGVzY3JpcHRpb259YCA6IHRhc2tOYW1lO1xuICAgICAgICB0aGlzLnN0YXJ0KGDwn5qAICR7bWVzc2FnZX1gKTtcbiAgICAgICAgdGhpcy5zdGFydFByb2dyZXNzKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaYvuekuuS7u+WKoeWujOaIkFxuICAgICAqL1xuICAgIHB1YmxpYyB0YXNrQ29tcGxldGUodGFza05hbWU6IHN0cmluZywgc3VjY2VzczogYm9vbGVhbiA9IHRydWUsIGR1cmF0aW9uPzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBkdXJhdGlvbiA/IGAke3Rhc2tOYW1lfSBjb21wbGV0ZWQgaW4gJHtkdXJhdGlvbn1gIDogYCR7dGFza05hbWV9IGNvbXBsZXRlZGA7XG4gICAgICAgIHRoaXMuc3RvcFByb2dyZXNzKHN1Y2Nlc3MsIG1lc3NhZ2UpO1xuICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhpcy5zdWNjZXNzKGDinIUgJHttZXNzYWdlfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lcnJvcihg4p2MICR7dGFza05hbWV9IGZhaWxlZGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGZsdXNoKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5waW5vPy5mbHVzaD8uKCk7XG4gICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAvLyBpZ25vcmVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDb21tb24gTGV2ZWwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8qKlxuICAgICAqIOiOt+WPluacgOi/keeahOaXpeW/l+S/oeaBr1xuICAgICAqL1xuICAgIHB1YmxpYyBxdWVyeUxvZ3MoY291bnQ6IG51bWJlciwgdHlwZT86IElDb25zb2xlVHlwZSk6IHN0cmluZ1tdIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLm1lc3NhZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMCAmJiBjb3VudCA+IDA7IC0taSkge1xuICAgICAgICAgICAgY29uc3QgbXNnID0gdGhpcy5tZXNzYWdlc1tpXTtcbiAgICAgICAgICAgIGlmICghdHlwZSB8fCBtc2cudHlwZSA9PT0gdHlwZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYCR7dHJhbnNsYXRlKG1zZy52YWx1ZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXMucHVzaChgWyR7bXNnLnR5cGUudG9VcHBlckNhc2UoKX1dICR7dHJhbnNsYXRlKG1zZy52YWx1ZSl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC0tY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZXMucmV2ZXJzZSgpO1xuICAgICAgICByZXR1cm4gbWVzc2FnZXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOa4hemZpOaJgOacieaXpeW/l+S/oeaBr1xuICAgICAqL1xuICAgIHB1YmxpYyBjbGVhckxvZ3MoKTogdm9pZCB7XG4gICAgICAgIHRoaXMubWVzc2FnZXMubGVuZ3RoID0gMDtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRlQnl0ZXMoYnl0ZXM6IG51bWJlcikge1xuICAgIHJldHVybiAoYnl0ZXMgLyAxMDI0IC8gMTAyNCkudG9GaXhlZCgyKSArICdNQic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc1RpbWVUb051bWJlcih0aW1lOiBzdHJpbmcpIHtcbiAgICB0aW1lID0gYmFzZW5hbWUodGltZSwgJy5sb2cnKTtcbiAgICBjb25zdCBpbmZvID0gdGltZS5tYXRjaCgvLShcXGQrKSQvKTtcbiAgICBpZiAoaW5mbykge1xuICAgICAgICBjb25zdCB0aW1lU3RyID0gQXJyYXkuZnJvbSh0aW1lKTtcbiAgICAgICAgdGltZVN0cltpbmZvLmluZGV4IV0gPSAnOic7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSh0aW1lU3RyLmpvaW4oJycpKS5nZXRUaW1lKCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn1cblxuZnVuY3Rpb24gdHJhbnNsYXRlKG1zZzogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIG1zZyA9PT0gJ3N0cmluZycgJiYgIW1zZy5pbmNsdWRlcygnXFxuJykgfHwgdHlwZW9mIG1zZyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZyhtc2cpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG1zZyA9PT0gJ3N0cmluZycgJiYgbXNnLmluY2x1ZGVzKCdcXG4nKSkge1xuICAgICAgICByZXR1cm4gdHJhbnNsYXRlKG1zZy5zcGxpdCgnXFxuJykpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbXNnID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtc2cpKSB7XG4gICAgICAgICAgICBsZXQgcmVzID0gJyc7XG4gICAgICAgICAgICBtc2cuZm9yRWFjaCgoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzICs9IGAke3RyYW5zbGF0ZShkYXRhKX1cXHJgO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAobXNnLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zbGF0ZShtc2cuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG1zZyk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBub29wXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1zZyAmJiBtc2cudG9TdHJpbmcgJiYgbXNnLnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICog6I635Y+W5pyA5paw5pe26Ze0XG4gKiBAcmV0dXJucyAyMDE5LTAzLTI2IDExOjAzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWFsVGltZSgpIHtcbiAgICBjb25zdCB0aW1lID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4gdGltZS50b0xvY2FsZURhdGVTdHJpbmcoKS5yZXBsYWNlKC9cXC8vZywgJy0nKSArICcgJyArIHRpbWUudG9UaW1lU3RyaW5nKCkuc2xpY2UoMCwgOCk7XG59XG5cbmV4cG9ydCBjb25zdCBuZXdDb25zb2xlID0gbmV3IE5ld0NvbnNvbGUoKTtcbiJdfQ==