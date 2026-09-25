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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtd29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvbWFpbi1wcm9jZXNzL3NjZW5lLXdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxpREFBbUQ7QUFDbkQsZ0RBQXdCO0FBQ3hCLG1DQUFzQztBQUN0QyxzQ0FBb0U7QUFDcEUsK0JBQTRCO0FBRTVCLDRDQUErQztBQUMvQyx5Q0FBeUU7QUFDekUsaURBQXlEO0FBTXpELE1BQWEsV0FBVztJQUVwQixNQUFNLENBQUMsZUFBZSxHQUFHLG9CQUFvQixDQUFDO0lBRXRDLFFBQVEsR0FBd0IsSUFBSSxDQUFDO0lBQzdDLElBQVcsT0FBTztRQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDekIsQ0FBQztJQUVPLFlBQVksR0FBRyxJQUFJLHFCQUFZLEVBQUUsQ0FBQztJQUUxQyxTQUFTO0lBQ0Qsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUztJQUNqQyxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTO0lBQ2xDLFVBQVUsR0FBVyxFQUFFLENBQUMsQ0FBQyxPQUFPO0lBQ2hDLFdBQVcsR0FBVyxFQUFFLENBQUMsQ0FBQyxPQUFPO0lBQ2pDLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxVQUFVO0lBQ2hDLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxTQUFTO0lBQy9CLDJCQUEyQixHQUE0QyxJQUFJLENBQUM7SUFFcEYsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFrQixFQUFFLFdBQW1CO1FBQy9DLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMs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QUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvcmssIENoaWxkUHJvY2VzcyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgU2NlbmVQcm9jZXNzRXZlbnRUYWcsIFNjZW5lUmVhZHlDaGFubmVsIH0gZnJvbSAnLi4vY29tbW9uJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4vcnBjJztcbmltcG9ydCB0eXBlIHsgU2NlbmVDb21tYW5kUHJvdmlkZXJSZWdpc3RyYXRpb24gfSBmcm9tICcuL3JwYyc7XG5pbXBvcnQgeyBnZXRTZXJ2ZXJVcmwgfSBmcm9tICcuLi8uLi8uLi9zZXJ2ZXInO1xuaW1wb3J0IHsgZGlzcG9zZU1vZHVsZU1lc3NhZ2VzLCBsaXN0ZW5Nb2R1bGVNZXNzYWdlcyB9IGZyb20gJy4vbWVzc2FnZXMnO1xuaW1wb3J0IHsgZ2V0QXZhaWxhYmxlUG9ydCB9IGZyb20gJy4uLy4uLy4uL3NlcnZlci91dGlscyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNjZW5lV29ya2VyRXZlbnRzIHtcbiAgICAncmVzdGFydCc6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBjbGFzcyBTY2VuZVdvcmtlciB7XG5cbiAgICBzdGF0aWMgRXhpdFdvcmtlckV2ZW50ID0gJ3NjZW5lLXByb2Nlc3M6ZXhpdCc7XG5cbiAgICBwcml2YXRlIF9wcm9jZXNzOiBDaGlsZFByb2Nlc3MgfCBudWxsID0gbnVsbDtcbiAgICBwdWJsaWMgZ2V0IHByb2Nlc3MoKTogQ2hpbGRQcm9jZXNzIHtcbiAgICAgICAgaWYgKCF0aGlzLl9wcm9jZXNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NjZW5lIHdvcmtlciDmnKrliJ3lp4vljJYsIOivt+S9v+eUqCBzY2VuZVdvcmtlci5zdGFydCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9jZXNzO1xuICAgIH1cblxuICAgIHByaXZhdGUgZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgLy8g6YeN5ZCv55u45YWz5bGe5oCnXG4gICAgcHJpdmF0ZSBtYXhSZXN0YXJ0QXR0ZW1wdHMgPSAzOyAvLyDmnIDlpKfph43lkK/mrKHmlbBcbiAgICBwcml2YXRlIGN1cnJlbnRSZXN0YXJ0Q291bnQgPSAwOyAvLyDlvZPliY3ph43lkK/mrKHmlbBcbiAgICBwcml2YXRlIGVuZ2luZVBhdGg6IHN0cmluZyA9ICcnOyAvLyDlvJXmk47ot6/lvoRcbiAgICBwcml2YXRlIHByb2plY3RQYXRoOiBzdHJpbmcgPSAnJzsgLy8g6aG555uu6Lev5b6EXG4gICAgcHJpdmF0ZSBpc1Jlc3RhcnRpbmcgPSBmYWxzZTsgLy8g5piv5ZCm5q2j5Zyo6YeN5ZCv5LitXG4gICAgcHJpdmF0ZSBpc01hbnVhbFN0b3AgPSBmYWxzZTsgLy8g5piv5ZCm5omL5Yqo5YGc5q2iXG4gICAgcHJpdmF0ZSBjb21tYW5kUHJvdmlkZXJSZWdpc3RyYXRpb246IFNjZW5lQ29tbWFuZFByb3ZpZGVyUmVnaXN0cmF0aW9uIHwgbnVsbCA9IG51bGw7XG5cbiAgICBhc3luYyBzdGFydChlbmdpbmVQYXRoOiBzdHJpbmcsIHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKHRoaXMuX3Byb2Nlc3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign6YeN5aSN5ZCv5Yqo5Zy65pmv6L+b56iL77yM6K+3IHN0b3Ag6L+b56iL5ZyoIHN0YXJ0Jyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkv53lrZjlkK/liqjlj4LmlbDku6Xkvr/ph43lkK/ml7bkvb/nlKhcbiAgICAgICAgdGhpcy5lbmdpbmVQYXRoID0gZW5naW5lUGF0aDtcbiAgICAgICAgdGhpcy5wcm9qZWN0UGF0aCA9IHByb2plY3RQYXRoO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGlzUmVzb2x2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBzdGFydHVwVGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVnaXN0cmF0aW9uOiBTY2VuZUNvbW1hbmRQcm92aWRlclJlZ2lzdHJhdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydHVwVGltZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHN0YXJ0dXBUaW1lcik7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0dXBUaW1lciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZU9uY2UgPSAocmVzdWx0OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1Jlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCByZWxlYXNlUmVnaXN0cmF0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG93bmVkUmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uO1xuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWxlYXNlQ29tbWFuZFByb3ZpZGVyKG93bmVkUmVnaXN0cmF0aW9uKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IFtcbiAgICAgICAgICAgICAgICAgICAgYC0tZW5naW5lUGF0aD0ke2VuZ2luZVBhdGh9YCxcbiAgICAgICAgICAgICAgICAgICAgYC0tcHJvamVjdFBhdGg9JHtwcm9qZWN0UGF0aH1gLFxuICAgICAgICAgICAgICAgICAgICBgLS1zZXJ2ZXJVUkw9JHtnZXRTZXJ2ZXJVcmwoKX1gLFxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgY29uc3QgcHJlY2Vzc1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vLi4vZGlzdC9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3MvbWFpbi5qcycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluc3BlY3RQb3J0ID0gYXdhaXQgZ2V0QXZhaWxhYmxlUG9ydCg5MjMwKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnLS1pbnNwZWN0PSAnICsgaW5zcGVjdFBvcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3MgPSBmb3JrKHByZWNlc3NQYXRoLCBhcmdzLCB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFjaGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgc3RkaW86IFsncGlwZScsICdwaXBlJywgJ3BpcGUnLCAnaXBjJ10sXG4gICAgICAgICAgICAgICAgICAgIGV4ZWNBcmd2OiBbYC0taW5zcGVjdD0ke2luc3BlY3RQb3J0fWBdLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g55uR5ZCs6L+b56iL5ZCv5Yqo6ZSZ6K+vXG4gICAgICAgICAgICAgICAgY29uc3Qgb25FcnJvciA9IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5Zy65pmv6L+b56iL5ZCv5Yqo5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzcz8ub2ZmKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzPy5vZmYoJ2V4aXQnLCBvbkVhcmx5RXhpdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZWxlYXNlUmVnaXN0cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbmNlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8g55uR5ZCs6L+b56iL5pep5pyf6YCA5Ye677yI5ZCv5Yqo5aSx6LSl77yJXG4gICAgICAgICAgICAgICAgY29uc3Qgb25FYXJseUV4aXQgPSAoY29kZTogbnVtYmVyLCBzaWduYWw6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5Zy65pmv6L+b56iL5ZCv5Yqo5pe26YCA5Ye6IGNvZGU6JHtjb2RlfSwgc2lnbmFsOiR7c2lnbmFsfWApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzPy5vZmYoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3M/Lm9mZignZXhpdCcsIG9uRWFybHlFeGl0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2VzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJlbGVhc2VSZWdpc3RyYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZU9uY2UoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyDnm5HlkKzlsLHnu6rmtojmga9cbiAgICAgICAgICAgICAgICBsZXQgbGlzdGVuZXJQcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbFN0YXJ0dXAgPSAoZXJyb3I6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5rOo5YaM5Zy65pmv6L+b56iL55uR5ZCs5Zmo5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzcz8ub2ZmKCdtZXNzYWdlJywgb25SZWFkeSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3M/Lm9mZignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzcz8ub2ZmKCdleGl0Jywgb25FYXJseUV4aXQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzcy5raWxsKCdTSUdURVJNJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZWxlYXNlUmVnaXN0cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbmNlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgb25SZWFkeSA9IChtc2c6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobXNnID09PSBTY2VuZVJlYWR5Q2hhbm5lbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NjZW5lIHByb2Nlc3Mgc3RhcnQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzPy5vZmYoJ21lc3NhZ2UnLCBvblJlYWR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3M/Lm9mZignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3M/Lm9mZignZXhpdCcsIG9uRWFybHlFeGl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvaWQgKGxpc3RlbmVyUHJvbWlzZSA/PyBQcm9taXNlLnJlc29sdmUoKSkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiByZXNvbHZlT25jZSh0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsU3RhcnR1cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8g6K6+572u5ZCv5Yqo6LaF5pe277yIMzDnp5LvvIlcbiAgICAgICAgICAgICAgICBzdGFydHVwVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5Zy65pmv6L+b56iL5ZCv5Yqo6LaF5pe2Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3M/Lm9mZignbWVzc2FnZScsIG9uUmVhZHkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzPy5vZmYoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3M/Lm9mZignZXhpdCcsIG9uRWFybHlFeGl0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3Mua2lsbCgnU0lHVEVSTScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2VzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVsZWFzZVJlZ2lzdHJhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25jZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSwgMzAwMDApO1xuXG4gICAgICAgICAgICAgICAgLy8g5rOo5YaM5LqL5Lu255uR5ZCs5ZmoXG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzcy5vbignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzLm9uKCdleGl0Jywgb25FYXJseUV4aXQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3Mub24oJ21lc3NhZ2UnLCBvblJlYWR5KTtcblxuICAgICAgICAgICAgICAgIC8vIOWQr+WKqFJQQ+WSjOazqOWGjOebkeWQrOWZqFxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IFJwYy5zdGFydHVwKHRoaXMuX3Byb2Nlc3MpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29tbWFuZFByb3ZpZGVyUmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyUHJvbWlzZSA9IHRoaXMucmVnaXN0ZXJMaXN0ZW5lcigpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyUHJvbWlzZS5jYXRjaChmYWlsU3RhcnR1cCk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5Yib5bu65Zy65pmv6L+b56iL5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZWxlYXNlUmVnaXN0cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZU9uY2UoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBzdG9wKCkge1xuICAgICAgICBjb25zdCBwcm9jZXNzID0gdGhpcy5fcHJvY2VzcztcbiAgICAgICAgaWYgKCFwcm9jZXNzKSB7XG4gICAgICAgICAgICB0aGlzLnJlbGVhc2VDb21tYW5kUHJvdmlkZXIoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNNYW51YWxTdG9wID0gdHJ1ZTtcbiAgICAgICAgZGlzcG9zZU1vZHVsZU1lc3NhZ2VzKCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHByb2Nlc3Mub2ZmKCdleGl0Jywgb25FeGl0KTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLm9mZignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlT25jZSA9IChyZXN1bHQ6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGxlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignU2NlbmUgcHJvY2VzcyBzdG9wIHRpbWVkIG91dCwgZm9yY2Uga2lsbGluZy4uLicpO1xuICAgICAgICAgICAgICAgIHRyeSB7IHByb2Nlc3Mua2lsbCgnU0lHVEVSTScpOyB9IGNhdGNoIChlKSB7IC8qIGlnbm9yZSAqLyB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHJlc29sdmVPbmNlKHRydWUpO1xuICAgICAgICAgICAgfSwgMTAwMDApO1xuXG4gICAgICAgICAgICBjb25zdCBvbkV4aXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NjZW5lIHByb2Nlc3Mgc3RvcHBlZC4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZU9uY2UodHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25FcnJvciA9IChlcnJvcjogTm9kZUpTLkVycm5vRXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09ICdFUElQRScgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnd3JpdGUgRVBJUEUnKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmVPbmNlKGZhbHNlKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHByb2Nlc3Mub25jZSgnZXhpdCcsIG9uRXhpdCk7XG4gICAgICAgICAgICBwcm9jZXNzLm9uKCdlcnJvcicsIG9uRXJyb3IpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3Muc2VuZChTY2VuZVdvcmtlci5FeGl0V29ya2VyRXZlbnQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7IHByb2Nlc3Mua2lsbCgnU0lHVEVSTScpOyB9IGNhdGNoIChfKSB7IC8qIGlnbm9yZSAqLyB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHJlc29sdmVPbmNlKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKTmlq3mmK/lkKbltKnmuoNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgaXNDcmFzaEV4aXQoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIC8vIOWmguaenOaYr+aJi+WKqOWBnOatou+8jOS4jeeul+W0qea6g1xuICAgICAgICBpZiAodGhpcy5pc01hbnVhbFN0b3ApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5YW25LuW6Z2e6Zu26YCA5Ye656CB5LiU6Z2e5omL5Yqo57uI5q2i5L+h5Y+355qE5oOF5Ya177yM6K6k5Li65piv5bSp5rqDXG4gICAgICAgIHJldHVybiBjb2RlICE9PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmHjeWQr+WcuuaZr+i/m+eoi1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyByZXN0YXJ0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5pc1Jlc3RhcnRpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCflnLrmma/ov5vnqIvmraPlnKjph43lkK/kuK3vvIzot7Pov4fph43lpI3ph43lkK8nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZXN0YXJ0Q291bnQgPj0gdGhpcy5tYXhSZXN0YXJ0QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWcuuaZr+i/m+eoi+mHjeWQr+asoeaVsOW3sui+vuS4iumZkCAoJHt0aGlzLm1heFJlc3RhcnRBdHRlbXB0c30p77yM5YGc5q2i6YeN5ZCvYCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQ8SVNjZW5lV29ya2VyRXZlbnRzPigncmVzdGFydCcsIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNSZXN0YXJ0aW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVzdGFydENvdW50Kys7XG5cbiAgICAgICAgY29uc29sZS5sb2coYOW8gOWni+mHjeWQr+WcuuaZr+i/m+eoiyAo56ysICR7dGhpcy5jdXJyZW50UmVzdGFydENvdW50fS8ke3RoaXMubWF4UmVzdGFydEF0dGVtcHRzfSDmrKEpYCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOa4heeQhuW9k+WJjei/m+eoi1xuICAgICAgICAgICAgdGhpcy5fcHJvY2VzcyA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIOWbuuWumumHjeWQr+mXtOmalFxuICAgICAgICAgICAgY29uc3QgZGVsYXkgPSAyMDAwOyAvLyDlm7rlrpoy56eS6Ze06ZqUXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg562J5b6FICR7ZGVsYXl9bXMg5ZCO6YeN5ZCvLi4uYCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgZGVsYXkpKTtcblxuICAgICAgICAgICAgLy8g6YeN5paw5ZCv5Yqo6L+b56iLXG4gICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgdGhpcy5zdGFydCh0aGlzLmVuZ2luZVBhdGgsIHRoaXMucHJvamVjdFBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflnLrmma/ov5vnqIvph43lkK/miJDlip8nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDph43lkK/miJDlip/lkI7ph43nva7ph43lkK/orqHmlbBcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRSZXN0YXJ0Q291bnQgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdDxJU2NlbmVXb3JrZXJFdmVudHM+KCdyZXN0YXJ0JywgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWcuuaZr+i/m+eoi+mHjeWQr+Wksei0pSAo56ysICR7dGhpcy5jdXJyZW50UmVzdGFydENvdW50fS8ke3RoaXMubWF4UmVzdGFydEF0dGVtcHRzfSDmrKEpYCk7XG5cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzovr7liLDmnIDlpKfph43or5XmrKHmlbDvvIzlj5Hlh7rkuovku7bpgJrnn6VcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVzdGFydENvdW50ID49IHRoaXMubWF4UmVzdGFydEF0dGVtcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+W3sui+vuWIsOacgOWkp+mHjeWQr+asoeaVsO+8jOWcuuaZr+i/m+eoi+aXoOazleaBouWkjScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQ8SVNjZW5lV29ya2VyRXZlbnRzPigncmVzdGFydCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCflnLrmma/ov5vnqIvph43lkK/ov4fnqIvkuK3lj5HnlJ/plJnor686JywgZXJyb3IpO1xuXG4gICAgICAgICAgICAvLyDlj5Hlh7rph43lkK/plJnor6/kuovku7ZcbiAgICAgICAgICAgIHRoaXMuZW1pdDxJU2NlbmVXb3JrZXJFdmVudHM+KCdyZXN0YXJ0JywgZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyDlpoLmnpzovr7liLDmnIDlpKfph43or5XmrKHmlbDvvIzlgZzmraLph43lkK9cbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZXN0YXJ0Q291bnQgPj0gdGhpcy5tYXhSZXN0YXJ0QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfph43lkK/ov4fnqIvkuK3lj5HnlJ/plJnor6/kuJTlt7Lovr7liLDmnIDlpKfph43or5XmrKHmlbDvvIzlgZzmraLph43lkK8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuaXNSZXN0YXJ0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyByZWdpc3Rlckxpc3RlbmVyKCkge1xuICAgICAgICBjb25zdCByZWdpc3RyYXRpb24gPSB0aGlzLmNvbW1hbmRQcm92aWRlclJlZ2lzdHJhdGlvbjtcblxuICAgICAgICB0aGlzLnByb2Nlc3Mub24oJ21lc3NhZ2UnLCAobXNnOiB7IHR5cGU6IHN0cmluZywgZXZlbnQ6IHN0cmluZywgYXJnczogYW55W10gfSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1zZyAmJiBtc2cudHlwZSA9PT0gU2NlbmVQcm9jZXNzRXZlbnRUYWcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQobXNnLmV2ZW50LCAuLi5tc2cuYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucHJvY2Vzcy5zdGRvdXQ/Lm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjaHVuay50b1N0cmluZygpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5wcm9jZXNzLnN0ZGVycj8ub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBpZiAoc3RyLnN0YXJ0c1dpdGgoJ1tTY2VuZV0nKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGNodW5rLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NjZW5lXScsIGNodW5rLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnByb2Nlc3Mub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ1tTY2VuZV0nKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW1NjZW5lXSBgLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnByb2Nlc3Mub24oJ2V4aXQnLCAoY29kZTogbnVtYmVyLCBzaWduYWwpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVsZWFzZUNvbW1hbmRQcm92aWRlcihyZWdpc3RyYXRpb24pO1xuICAgICAgICAgICAgZGlzcG9zZU1vZHVsZU1lc3NhZ2VzKCk7XG4gICAgICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWcuuaZr+i/m+eoi+mAgOWHuuW8guW4uCBjb2RlOiR7Y29kZX0sIHNpZ25hbDoke3NpZ25hbH1gKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDliKTmlq3mmK/lkKbkuLrnnJ/mraPnmoTltKnmuoPvvIjmjpLpmaTmiYvliqgga2lsbCDnmoTmg4XlhrXvvIlcbiAgICAgICAgICAgICAgICBjb25zdCBpc0NyYXNoID0gdGhpcy5pc0NyYXNoRXhpdChjb2RlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoaXNDcmFzaCAmJiAhdGhpcy5pc01hbnVhbFN0b3AgJiYgIXRoaXMuaXNSZXN0YXJ0aW5nICYmIHRoaXMuZW5naW5lUGF0aCAmJiB0aGlzLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmo4DmtYvliLDlnLrmma/ov5vnqIvltKnmuoPvvIzlh4blpIfph43lkK8uLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0YXJ0KCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign6YeN5ZCv5Zy65pmv6L+b56iL5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzTWFudWFsU3RvcCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Zy65pmv6L+b56iL5omL5Yqo5YGc5q2i77yM5LiN6L+b6KGM6YeN5ZCvJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXNDcmFzaCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Zy65pmv6L+b56iL6KKr5aSW6YOo57uI5q2i77yM5LiN6L+b6KGM6YeN5ZCvJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Zy65pmv6L+b56iL5q2j5bi46YCA5Ye6Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOmHjee9ruaJi+WKqOWBnOatouagh+W/l1xuICAgICAgICAgICAgdGhpcy5pc01hbnVhbFN0b3AgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIOebkeWQrOS4u+i/m+eoi+aooeWdl+eahOS6i+S7tlxuICAgICAgICBhd2FpdCBsaXN0ZW5Nb2R1bGVNZXNzYWdlcygpO1xuICAgIH1cblxuICAgIC8qKiBSZWxlYXNlcyBvbmx5IHRoZSBwcm92aWRlciByZWdpc3RyYXRpb24gYWNxdWlyZWQgYnkgdGhlIGN1cnJlbnQgU2NlbmUgV29ya2VyLiAqL1xuICAgIHByaXZhdGUgcmVsZWFzZUNvbW1hbmRQcm92aWRlcihcbiAgICAgICAgcmVnaXN0cmF0aW9uOiBTY2VuZUNvbW1hbmRQcm92aWRlclJlZ2lzdHJhdGlvbiB8IG51bGwgPSB0aGlzLmNvbW1hbmRQcm92aWRlclJlZ2lzdHJhdGlvbixcbiAgICApOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY29tbWFuZFByb3ZpZGVyUmVnaXN0cmF0aW9uID09PSByZWdpc3RyYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY29tbWFuZFByb3ZpZGVyUmVnaXN0cmF0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZWdpc3RyYXRpb24/LmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnm5HlkKzmjIflrprnsbvlnovnmoTkuovku7bvvIjnsbvlnovlronlhajniYjmnKzvvIlcbiAgICAgKiBAcGFyYW0gZXZlbnQg5LqL5Lu25ZCN56ewXG4gICAgICogQHBhcmFtIGxpc3RlbmVyIOS6i+S7tuebkeWQrOWZqFxuICAgICAqL1xuICAgIG9uPFRFdmVudHMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+PihcbiAgICAgICAgZXZlbnQ6IGtleW9mIFRFdmVudHMsXG4gICAgICAgIGxpc3RlbmVyOiBURXZlbnRzW2tleW9mIFRFdmVudHNdIGV4dGVuZHMgdm9pZFxuICAgICAgICAgICAgPyAoKSA9PiB2b2lkXG4gICAgICAgICAgICA6IChwYXlsb2FkOiBURXZlbnRzW2tleW9mIFRFdmVudHNdKSA9PiB2b2lkXG4gICAgKTogdm9pZDtcbiAgICAvKipcbiAgICAgKiDnm5HlkKzmjIflrprnsbvlnovnmoTkuovku7bvvIjpgJrnlKjniYjmnKzvvIlcbiAgICAgKiBAcGFyYW0gZXZlbnQg5LqL5Lu25ZCN56ewXG4gICAgICogQHBhcmFtIGxpc3RlbmVyIOS6i+S7tuebkeWQrOWZqFxuICAgICAqL1xuICAgIG9uKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpOiB2b2lkO1xuICAgIG9uKGV2ZW50OiBhbnksIGxpc3RlbmVyOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIub24oZXZlbnQgYXMgc3RyaW5nLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog55uR5ZCs5oyH5a6a57G75Z6L55qE5LqL5Lu277yI5LiA5qyh5oCn77yM57G75Z6L5a6J5YWo54mI5pys77yJXG4gICAgICogQHBhcmFtIGV2ZW50IOS6i+S7tuWQjeensFxuICAgICAqIEBwYXJhbSBsaXN0ZW5lciDkuovku7bnm5HlkKzlmahcbiAgICAgKi9cbiAgICBvbmNlPFRFdmVudHMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+PihcbiAgICAgICAgZXZlbnQ6IGtleW9mIFRFdmVudHMsXG4gICAgICAgIGxpc3RlbmVyOiBURXZlbnRzW2tleW9mIFRFdmVudHNdIGV4dGVuZHMgdm9pZFxuICAgICAgICAgICAgPyAoKSA9PiB2b2lkXG4gICAgICAgICAgICA6IChwYXlsb2FkOiBURXZlbnRzW2tleW9mIFRFdmVudHNdKSA9PiB2b2lkXG4gICAgKTogdm9pZDtcbiAgICAvKipcbiAgICAgKiDnm5HlkKzmjIflrprnsbvlnovnmoTkuovku7bvvIjkuIDmrKHmgKfvvIzpgJrnlKjniYjmnKzvvIlcbiAgICAgKiBAcGFyYW0gZXZlbnQg5LqL5Lu25ZCN56ewXG4gICAgICogQHBhcmFtIGxpc3RlbmVyIOS6i+S7tuebkeWQrOWZqFxuICAgICAqL1xuICAgIG9uY2UoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IHZvaWQ7XG4gICAgb25jZShldmVudDogYW55LCBsaXN0ZW5lcjogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXZlbnRFbWl0dGVyLm9uY2UoZXZlbnQgYXMgc3RyaW5nLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk5oyH5a6a57G75Z6L55qE5LqL5Lu255uR5ZCs5Zmo77yI57G75Z6L5a6J5YWo54mI5pys77yJXG4gICAgICogQHBhcmFtIGV2ZW50IOS6i+S7tuWQjeensFxuICAgICAqIEBwYXJhbSBsaXN0ZW5lciDkuovku7bnm5HlkKzlmahcbiAgICAgKi9cbiAgICBvZmY8VEV2ZW50cyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4+KFxuICAgICAgICBldmVudDoga2V5b2YgVEV2ZW50cyxcbiAgICAgICAgbGlzdGVuZXI6IFRFdmVudHNba2V5b2YgVEV2ZW50c10gZXh0ZW5kcyB2b2lkXG4gICAgICAgICAgICA/ICgpID0+IHZvaWRcbiAgICAgICAgICAgIDogKHBheWxvYWQ6IFRFdmVudHNba2V5b2YgVEV2ZW50c10pID0+IHZvaWRcbiAgICApOiB2b2lkO1xuICAgIG9mZihldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKTogdm9pZDtcbiAgICBvZmYoZXZlbnQ6IGFueSwgbGlzdGVuZXI6IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5vZmYoZXZlbnQgYXMgc3RyaW5nLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Y+R5bCE5oyH5a6a57G75Z6L55qE5LqL5Lu277yI57G75Z6L5a6J5YWo54mI5pys77yJXG4gICAgICogQHBhcmFtIGV2ZW50IOS6i+S7tuWQjeensFxuICAgICAqIEBwYXJhbSBhcmdzIOS6i+S7tuWPguaVsFxuICAgICAqL1xuICAgIGVtaXQ8VEV2ZW50cyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4+KFxuICAgICAgICBldmVudDoga2V5b2YgVEV2ZW50cyxcbiAgICAgICAgLi4uYXJnczogVEV2ZW50c1trZXlvZiBURXZlbnRzXSBleHRlbmRzIHZvaWQgPyBbXSA6IFtURXZlbnRzW2tleW9mIFRFdmVudHNdXVxuICAgICk6IHZvaWQ7XG4gICAgLyoqXG4gICAgICog6Kem5Y+R5LqL5Lu277yI6YCa55So54mI5pys77yJXG4gICAgICogQHBhcmFtIGV2ZW50IOS6i+S7tuWQjeensFxuICAgICAqIEBwYXJhbSBhcmdzIOS6i+S7tuWPguaVsFxuICAgICAqL1xuICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYXJnczogYW55W10pOiB2b2lkO1xuICAgIGVtaXQoZXZlbnQ6IGFueSwgLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riF6Zmk5LqL5Lu255uR5ZCs5ZmoXG4gICAgICogQHBhcmFtIGV2ZW50IOS6i+S7tuWQjeensO+8jOWmguaenOS4jeaPkOS+m+WImea4hemZpOaJgOaciVxuICAgICAqL1xuICAgIGNsZWFyKGV2ZW50Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpc3Bvc2VNb2R1bGVNZXNzYWdlcygpO1xuICAgICAgICAgICAgdGhpcy5yZWxlYXNlQ29tbWFuZFByb3ZpZGVyKCk7XG4gICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIC8vIOmHjee9rumHjeWQr+ebuOWFs+eKtuaAgVxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVzdGFydENvdW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuaXNSZXN0YXJ0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmlzTWFudWFsU3RvcCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbmdpbmVQYXRoID0gJyc7XG4gICAgICAgICAgICB0aGlzLnByb2plY3RQYXRoID0gJyc7XG4gICAgICAgICAgICB0aGlzLl9wcm9jZXNzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNjZW5lV29ya2VyID0gbmV3IFNjZW5lV29ya2VyKCk7XG4iXX0=