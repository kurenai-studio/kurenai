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
