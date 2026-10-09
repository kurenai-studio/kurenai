"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sceneWorker = exports.SceneWorker = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const common_1 = require("../common");
const rpc_1 = require("./rpc");
const server_1 = require("../../../server");
const messages_1 = require("./messages");
const utils_1 = require("../../../server/utils");
class SceneWorker {
    static ExitWorkerEvent = 'scene-process:exit';
    _process = null;
    get process() {
        if (!this._process) {
            throw new Error('Scene worker 未初始化, 请使用 sceneWorker.start');
        }
        return this._process;
    }
    eventEmitter = new events_1.EventEmitter();
    // 重启相关属性
    maxRestartAttempts = 3; // 最大重启次数
    currentRestartCount = 0; // 当前重启次数
    enginePath = ''; // 引擎路径
    projectPath = ''; // 项目路径
    isRestarting = false; // 是否正在重启中
    isManualStop = false; // 是否手动停止
    commandProviderRegistration = null;
    async start(enginePath, projectPath) {
        if (this._process) {
            console.warn('重复启动场景进程，请 stop 进程在 start');
            return false;
        }
        // 保存启动参数以便重启时使用
        this.enginePath = enginePath;
        this.projectPath = projectPath;
        return new Promise(async (resolve) => {
            let isResolved = false;
            let startupTimer = null;
            let registration = null;
            const cleanup = () => {
                if (startupTimer) {
                    clearTimeout(startupTimer);
                    startupTimer = null;
                }
            };
            const resolveOnce = (result) => {
                if (!isResolved) {
                    isResolved = true;
                    cleanup();
                    resolve(result);
                }
            };
            const releaseRegistration = () => {
                const ownedRegistration = registration;
                registration = null;
                this.releaseCommandProvider(ownedRegistration);
            };
            try {
                const args = [
                    `--enginePath=${enginePath}`,
                    `--projectPath=${projectPath}`,
                    `--serverURL=${(0, server_1.getServerUrl)()}`,
                ];
                const precessPath = path_1.default.join(__dirname, '../../../../dist/core/scene/scene-process/main.js');
                const inspectPort = await (0, utils_1.getAvailablePort)(9230);
                console.log('--inspect= ' + inspectPort);
                this._process = (0, child_process_1.fork)(precessPath, args, {
                    detached: false,
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                    execArgv: [`--inspect=${inspectPort}`],
                });
                // 监听进程启动错误
                const onError = (error) => {
                    console.error('场景进程启动失败:', error);
                    this._process?.off('error', onError);
                    this._process?.off('exit', onEarlyExit);
                    this._process = null;
                    releaseRegistration();
                    resolveOnce(false);
                };
                // 监听进程早期退出（启动失败）
                const onEarlyExit = (code, signal) => {
                    console.error(`场景进程启动时退出 code:${code}, signal:${signal}`);
                    this._process?.off('error', onError);
                    this._process?.off('exit', onEarlyExit);
                    this._process = null;
                    releaseRegistration();
                    resolveOnce(false);
                };
                // 监听就绪消息
                let listenerPromise = null;
                const failStartup = (error) => {
                    console.error('注册场景进程监听器失败:', error);
                    this._process?.off('message', onReady);
                    this._process?.off('error', onError);
                    this._process?.off('exit', onEarlyExit);
                    if (this._process) {
                        this._process.kill('SIGTERM');
                        this._process = null;
                    }
                    releaseRegistration();
                    resolveOnce(false);
                };
                const onReady = (msg) => {
                    if (msg === common_1.SceneReadyChannel) {
                        console.log('Scene process start.');
                        this._process?.off('message', onReady);
                        this._process?.off('error', onError);
                        this._process?.off('exit', onEarlyExit);
                        void (listenerPromise ?? Promise.resolve()).then(() => resolveOnce(true), failStartup);
                    }
                };
                // 设置启动超时（30秒）
                startupTimer = setTimeout(() => {
                    console.error('场景进程启动超时');
                    this._process?.off('message', onReady);
                    this._process?.off('error', onError);
                    this._process?.off('exit', onEarlyExit);
                    if (this._process) {
                        this._process.kill('SIGTERM');
                        this._process = null;
                    }
                    releaseRegistration();
                    resolveOnce(false);
                }, 30000);
                // 注册事件监听器
                this._process.on('error', onError);
                this._process.on('exit', onEarlyExit);
                this._process.on('message', onReady);
                // 启动RPC和注册监听器
                registration = rpc_1.Rpc.startup(this._process);
                this.commandProviderRegistration = registration;
                listenerPromise = this.registerListener();
                listenerPromise.catch(failStartup);
            }
            catch (error) {
                console.error('创建场景进程失败:', error);
                this._process = null;
                releaseRegistration();
                resolveOnce(false);
            }
        });
    }
    async stop() {
        const process = this._process;
        if (!process) {
            this.releaseCommandProvider();
            return true;
        }
        this.isManualStop = true;
        (0, messages_1.disposeModuleMessages)();
        return new Promise((resolve) => {
            let settled = false;
            const cleanup = () => {
                clearTimeout(timeout);
                process.off('exit', onExit);
                process.off('error', onError);
            };
            const resolveOnce = (result) => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(result);
            };
            const timeout = setTimeout(() => {
                console.warn('Scene process stop timed out, force killing...');
                try {
                    process.kill('SIGTERM');
                }
                catch (e) { /* ignore */ }
                this.clear();
                resolveOnce(true);
            }, 10000);
            const onExit = () => {
                console.log('Scene process stopped.');
                this.clear();
                resolveOnce(true);
            };
            const onError = (error) => {
                if (error.code === 'EPIPE' || error.message.includes('write EPIPE')) {
                    return;
                }
                resolveOnce(false);
            };
            process.once('exit', onExit);
            process.on('error', onError);
            try {
                process.send(SceneWorker.ExitWorkerEvent);
            }
            catch (e) {
                try {
                    process.kill('SIGTERM');
                }
                catch (_) { /* ignore */ }
                this.clear();
                resolveOnce(true);
            }
        });
    }
    /**
     * 判断是否崩溃
     * @private
     */
    isCrashExit(code) {
        // 如果是手动停止，不算崩溃
        if (this.isManualStop) {
            return false;
        }
        // 其他非零退出码且非手动终止信号的情况，认为是崩溃
        return code !== 0;
    }
    /**
     * 重启场景进程
     * @private
     */
    async restart() {
        if (this.isRestarting) {
            console.log('场景进程正在重启中，跳过重复重启');
            return;
        }
        if (this.currentRestartCount >= this.maxRestartAttempts) {
            console.error(`场景进程重启次数已达上限 (${this.maxRestartAttempts})，停止重启`);
            this.emit('restart', false);
            return;
        }
        this.isRestarting = true;
        this.currentRestartCount++;
        console.log(`开始重启场景进程 (第 ${this.currentRestartCount}/${this.maxRestartAttempts} 次)`);
        try {
            // 清理当前进程
            this._process = null;
            // 固定重启间隔
            const delay = 2000; // 固定2秒间隔
            console.log(`等待 ${delay}ms 后重启...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // 重新启动进程
            const success = await this.start(this.enginePath, this.projectPath);
            if (success) {
                console.log('场景进程重启成功');
                // 重启成功后重置重启计数
                this.currentRestartCount = 0;
                this.emit('restart', true);
            }
            else {
                console.error(`场景进程重启失败 (第 ${this.currentRestartCount}/${this.maxRestartAttempts} 次)`);
                // 如果达到最大重试次数，发出事件通知
                if (this.currentRestartCount >= this.maxRestartAttempts) {
                    console.error('已达到最大重启次数，场景进程无法恢复');
                    this.emit('restart', false);
                }
            }
        }
        catch (error) {
            console.error('场景进程重启过程中发生错误:', error);
            // 发出重启错误事件
            this.emit('restart', false);
            // 如果达到最大重试次数，停止重启
            if (this.currentRestartCount >= this.maxRestartAttempts) {
                console.error('重启过程中发生错误且已达到最大重试次数，停止重启');
            }
        }
        finally {
            this.isRestarting = false;
        }
    }
    async registerListener() {
        const registration = this.commandProviderRegistration;
        this.process.on('message', (msg) => {
            if (msg && msg.type === common_1.SceneProcessEventTag) {
                this.emit(msg.event, ...msg.args);
            }
        });
        this.process.stdout?.on('data', (chunk) => {
            console.log(chunk.toString());
        });
        this.process.stderr?.on('data', (chunk) => {
            const str = chunk.toString();
            if (str.startsWith('[Scene]')) {
                console.log(chunk.toString());
            }
            else {
                console.log('[Scene]', chunk.toString());
            }
        });
        this.process.on('error', (err) => {
            if (err.message.startsWith('[Scene]')) {
                console.error(err);
            }
            else {
                console.error(`[Scene] `, err);
            }
        });
        this.process.on('exit', (code, signal) => {
            this.releaseCommandProvider(registration);
            (0, messages_1.disposeModuleMessages)();
            if (code !== 0) {
                console.error(`场景进程退出异常 code:${code}, signal:${signal}`);
                // 判断是否为真正的崩溃（排除手动 kill 的情况）
                const isCrash = this.isCrashExit(code);
                if (isCrash && !this.isManualStop && !this.isRestarting && this.enginePath && this.projectPath) {
                    console.log('检测到场景进程崩溃，准备重启...');
                    this.restart().catch(error => {
                        console.error('重启场景进程失败:', error);
                    });
                }
                else if (this.isManualStop) {
                    console.log('场景进程手动停止，不进行重启');
                }
                else if (!isCrash) {
                    console.log('场景进程被外部终止，不进行重启');
                }
            }
            else {
                console.log('场景进程正常退出');
            }
            // 重置手动停止标志
            this.isManualStop = false;
        });
        // 监听主进程模块的事件
        await (0, messages_1.listenModuleMessages)();
    }
    /** Releases only the provider registration acquired by the current Scene Worker. */
    releaseCommandProvider(registration = this.commandProviderRegistration) {
        if (this.commandProviderRegistration === registration) {
            this.commandProviderRegistration = null;
        }
        registration?.dispose();
    }
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    once(event, listener) {
        this.eventEmitter.once(event, listener);
    }
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    emit(event, ...args) {
        this.eventEmitter.emit(event, ...args);
    }
    /**
     * 清除事件监听器
     * @param event 事件名称，如果不提供则清除所有
     */
    clear(event) {
        if (event) {
            this.eventEmitter.removeAllListeners(event);
        }
        else {
            (0, messages_1.disposeModuleMessages)();
            this.releaseCommandProvider();
            this.eventEmitter.removeAllListeners();
            // 重置重启相关状态
            this.currentRestartCount = 0;
            this.isRestarting = false;
            this.isManualStop = false;
            this.enginePath = '';
            this.projectPath = '';
            this._process = null;
        }
    }
}
exports.SceneWorker = SceneWorker;
exports.sceneWorker = new SceneWorker();
