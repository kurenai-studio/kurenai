"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEditor = void 0;
/**
 * 编辑器基类
 * 提供通用的编辑器功能和状态管理
 * @template TEditorAsset 编辑器处理的资产类型，如 IScene、INode 等
 * @template TEvents 事件类型
 */
class BaseEditor {
    /**
     * 当前打开的资源
     */
    entity = null;
    /**
     * 最近一次 open() 传入的选项，供 _doReload() 复用以保持 encode 结果形状一致
     */
    _lastOpenOptions;
    /**
     * reload 操作的 Promise，用于防止并发调用导致序列化失败
     * 所有调用者都等待这个 Promise，最终会得到基于最新数据的结果
     */
    _reloadPromise = null;
    /**
     * 标记是否有待处理的 reload 请求
     * 如果在一个 reload 执行期间有新的调用，设置此标志，确保最终基于最新数据执行
     */
    _pendingReload = false;
    getRootNode() {
        return this.entity ? this.entity.instance : null;
    }
    setCurrentOpen(entity) {
        this.entity = entity;
    }
    getIdentifier(assetInfo) {
        return {
            assetType: assetInfo.type,
            assetName: assetInfo.name,
            assetUuid: assetInfo.uuid,
            assetUrl: assetInfo.url,
        };
    }
    /**
     * 重载编辑器内容，提供并发保护
     * 如果已有 reload 正在执行，标记待处理标志，确保最终基于最新数据执行
     */
    async reload() {
        // 如果已有 reload 正在执行，标记需要重新执行，确保基于最新数据
        if (this._reloadPromise) {
            this._pendingReload = true;
            // 等待当前执行完成，最终会得到基于最新数据的结果
            return this._reloadPromise;
        }
        // 开始执行 reload
        return this._executeReload();
    }
    /**
     * 执行 reload 操作，支持自动重新执行以确保基于最新数据
     */
    async _executeReload() {
        // 创建新的 Promise，所有调用者都等待这个 Promise
        let resolveCurrent;
        let rejectCurrent;
        this._reloadPromise = new Promise((resolve, reject) => {
            resolveCurrent = resolve;
            rejectCurrent = reject;
        });
        try {
            let result;
            // 使用循环处理待处理的 reload 请求，避免递归
            do {
                // 重置待处理标志
                this._pendingReload = false;
                try {
                    // 执行 reload
                    result = await this._doReload();
                }
                catch (error) {
                    // 如果出错，但有新的 reload 请求，则忽略错误继续重试
                    if (this._pendingReload) {
                        console.warn('Reload failed, retrying due to pending request:', error);
                        continue;
                    }
                    // 否则抛出错误
                    throw error;
                }
            } while (this._pendingReload);
            if (!result) {
                throw new Error('Reload returned no result');
            }
            resolveCurrent(result);
            return result;
        }
        catch (error) {
            rejectCurrent(error);
            throw error;
        }
        finally {
            this._reloadPromise = null;
        }
    }
    async open(asset, options) {
        this._lastOpenOptions = options;
        return this._doOpen(asset, options);
    }
}
exports.BaseEditor = BaseEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1lZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZWRpdG9ycy9iYXNlLWVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQTs7Ozs7R0FLRztBQUNILE1BQXNCLFVBQVU7SUFDNUI7O09BRUc7SUFDTyxNQUFNLEdBQXlCLElBQUksQ0FBQztJQUU5Qzs7T0FFRztJQUNPLGdCQUFnQixDQUErQjtJQUV6RDs7O09BR0c7SUFDTyxjQUFjLEdBQWtDLElBQUksQ0FBQztJQUUvRDs7O09BR0c7SUFDSyxjQUFjLEdBQVksS0FBSyxDQUFDO0lBRWpDLFdBQVc7UUFDZCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDckQsQ0FBQztJQUVNLGNBQWMsQ0FBQyxNQUE0QjtRQUM5QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN6QixDQUFDO0lBRVMsYUFBYSxDQUFDLFNBQXFCO1FBQ3pDLE9BQU87WUFDSCxTQUFTLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDekIsU0FBUyxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3pCLFNBQVMsRUFBRSxTQUFTLENBQUMsSUFBSTtZQUN6QixRQUFRLEVBQUUsU0FBUyxDQUFDLEdBQUc7U0FDMUIsQ0FBQztJQUNOLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsTUFBTTtRQUNSLHFDQUFxQztRQUNyQyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUMzQiwwQkFBMEI7WUFDMUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQy9CLENBQUM7UUFFRCxjQUFjO1FBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLGNBQWM7UUFDeEIsa0NBQWtDO1FBQ2xDLElBQUksY0FBOEMsQ0FBQztRQUNuRCxJQUFJLGFBQXFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLE9BQU8sQ0FBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDakUsY0FBYyxHQUFHLE9BQU8sQ0FBQztZQUN6QixhQUFhLEdBQUcsTUFBTSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDO1lBQ0QsSUFBSSxNQUFpQyxDQUFDO1lBQ3RDLDRCQUE0QjtZQUM1QixHQUFHLENBQUM7Z0JBQ0EsVUFBVTtnQkFDVixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDNUIsSUFBSSxDQUFDO29CQUNELFlBQVk7b0JBQ1osTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2IsZ0NBQWdDO29CQUNoQyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxpREFBaUQsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDdkUsU0FBUztvQkFDYixDQUFDO29CQUNELFNBQVM7b0JBQ1QsTUFBTSxLQUFLLENBQUM7Z0JBQ2hCLENBQUM7WUFDTCxDQUFDLFFBQVEsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUU5QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFFRCxjQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEIsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixhQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsTUFBTSxLQUFLLENBQUM7UUFDaEIsQ0FBQztnQkFBUyxDQUFDO1lBQ1AsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDL0IsQ0FBQztJQUNMLENBQUM7SUFJRCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQWlCLEVBQUUsT0FBMEI7UUFDcEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FVSjtBQXJIRCxnQ0FxSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElCYXNlSWRlbnRpZmllciwgSUNyZWF0ZU9wdGlvbnMsIElFZGl0b3JUYXJnZXQsIFRFZGl0b3JFbnRpdHksIFRFZGl0b3JJbnN0YW5jZSwgSU5vZGVEdW1wT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgdHlwZSB7IElBc3NldEluZm8gfSBmcm9tICcuLi8uLi8uLi8uLi9hc3NldHMvQHR5cGVzL3B1YmxpYyc7XG5cbi8qKlxuICog57yW6L6R5Zmo5Z+657G7XG4gKiDmj5DkvpvpgJrnlKjnmoTnvJbovpHlmajlip/og73lkoznirbmgIHnrqHnkIZcbiAqIEB0ZW1wbGF0ZSBURWRpdG9yQXNzZXQg57yW6L6R5Zmo5aSE55CG55qE6LWE5Lqn57G75Z6L77yM5aaCIElTY2VuZeOAgUlOb2RlIOetiVxuICogQHRlbXBsYXRlIFRFdmVudHMg5LqL5Lu257G75Z6LXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlRWRpdG9yIHtcbiAgICAvKipcbiAgICAgKiDlvZPliY3miZPlvIDnmoTotYTmupBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZW50aXR5OiBJRWRpdG9yVGFyZ2V0IHwgbnVsbCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiDmnIDov5HkuIDmrKEgb3BlbigpIOS8oOWFpeeahOmAiemhue+8jOS+myBfZG9SZWxvYWQoKSDlpI3nlKjku6Xkv53mjIEgZW5jb2RlIOe7k+aenOW9oueKtuS4gOiHtFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfbGFzdE9wZW5PcHRpb25zOiBJTm9kZUR1bXBPcHRpb25zIHwgdW5kZWZpbmVkO1xuXG4gICAgLyoqXG4gICAgICogcmVsb2FkIOaTjeS9nOeahCBQcm9taXNl77yM55So5LqO6Ziy5q2i5bm25Y+R6LCD55So5a+86Ie05bqP5YiX5YyW5aSx6LSlXG4gICAgICog5omA5pyJ6LCD55So6ICF6YO9562J5b6F6L+Z5LiqIFByb21pc2XvvIzmnIDnu4jkvJrlvpfliLDln7rkuo7mnIDmlrDmlbDmja7nmoTnu5PmnpxcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3JlbG9hZFByb21pc2U6IFByb21pc2U8VEVkaXRvckVudGl0eT4gfCBudWxsID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIOagh+iusOaYr+WQpuacieW+heWkhOeQhueahCByZWxvYWQg6K+35rGCXG4gICAgICog5aaC5p6c5Zyo5LiA5LiqIHJlbG9hZCDmiafooYzmnJ/pl7TmnInmlrDnmoTosIPnlKjvvIzorr7nva7mraTmoIflv5fvvIznoa7kv53mnIDnu4jln7rkuo7mnIDmlrDmlbDmja7miafooYxcbiAgICAgKi9cbiAgICBwcml2YXRlIF9wZW5kaW5nUmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgZ2V0Um9vdE5vZGUoKTogVEVkaXRvckluc3RhbmNlIHwgbnVsbCB7XG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eSA/IHRoaXMuZW50aXR5Lmluc3RhbmNlIDogbnVsbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Q3VycmVudE9wZW4oZW50aXR5OiBJRWRpdG9yVGFyZ2V0IHwgbnVsbCk6IHZvaWQge1xuICAgICAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0SWRlbnRpZmllcihhc3NldEluZm86IElBc3NldEluZm8pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFzc2V0VHlwZTogYXNzZXRJbmZvLnR5cGUsXG4gICAgICAgICAgICBhc3NldE5hbWU6IGFzc2V0SW5mby5uYW1lLFxuICAgICAgICAgICAgYXNzZXRVdWlkOiBhc3NldEluZm8udXVpZCxcbiAgICAgICAgICAgIGFzc2V0VXJsOiBhc3NldEluZm8udXJsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmHjei9vee8lui+keWZqOWGheWuue+8jOaPkOS+m+W5tuWPkeS/neaKpFxuICAgICAqIOWmguaenOW3suaciSByZWxvYWQg5q2j5Zyo5omn6KGM77yM5qCH6K6w5b6F5aSE55CG5qCH5b+X77yM56Gu5L+d5pyA57uI5Z+65LqO5pyA5paw5pWw5o2u5omn6KGMXG4gICAgICovXG4gICAgYXN5bmMgcmVsb2FkKCk6IFByb21pc2U8VEVkaXRvckVudGl0eT4ge1xuICAgICAgICAvLyDlpoLmnpzlt7LmnIkgcmVsb2FkIOato+WcqOaJp+ihjO+8jOagh+iusOmcgOimgemHjeaWsOaJp+ihjO+8jOehruS/neWfuuS6juacgOaWsOaVsOaNrlxuICAgICAgICBpZiAodGhpcy5fcmVsb2FkUHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1JlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAvLyDnrYnlvoXlvZPliY3miafooYzlrozmiJDvvIzmnIDnu4jkvJrlvpfliLDln7rkuo7mnIDmlrDmlbDmja7nmoTnu5PmnpxcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWxvYWRQcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5byA5aeL5omn6KGMIHJlbG9hZFxuICAgICAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVJlbG9hZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaJp+ihjCByZWxvYWQg5pON5L2c77yM5pSv5oyB6Ieq5Yqo6YeN5paw5omn6KGM5Lul56Gu5L+d5Z+65LqO5pyA5paw5pWw5o2uXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBfZXhlY3V0ZVJlbG9hZCgpOiBQcm9taXNlPFRFZGl0b3JFbnRpdHk+IHtcbiAgICAgICAgLy8g5Yib5bu65paw55qEIFByb21pc2XvvIzmiYDmnInosIPnlKjogIXpg73nrYnlvoXov5nkuKogUHJvbWlzZVxuICAgICAgICBsZXQgcmVzb2x2ZUN1cnJlbnQ6ICh2YWx1ZTogVEVkaXRvckVudGl0eSkgPT4gdm9pZDtcbiAgICAgICAgbGV0IHJlamVjdEN1cnJlbnQ6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XG4gICAgICAgIHRoaXMuX3JlbG9hZFByb21pc2UgPSBuZXcgUHJvbWlzZTxURWRpdG9yRW50aXR5PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlQ3VycmVudCA9IHJlc29sdmU7XG4gICAgICAgICAgICByZWplY3RDdXJyZW50ID0gcmVqZWN0O1xuICAgICAgICB9KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlc3VsdDogVEVkaXRvckVudGl0eSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIC8vIOS9v+eUqOW+queOr+WkhOeQhuW+heWkhOeQhueahCByZWxvYWQg6K+35rGC77yM6YG/5YWN6YCS5b2SXG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgLy8g6YeN572u5b6F5aSE55CG5qCH5b+XXG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1JlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaJp+ihjCByZWxvYWRcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5fZG9SZWxvYWQoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzlh7rplJnvvIzkvYbmnInmlrDnmoQgcmVsb2FkIOivt+axgu+8jOWImeW/veeVpemUmeivr+e7p+e7remHjeivlVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGVuZGluZ1JlbG9hZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdSZWxvYWQgZmFpbGVkLCByZXRyeWluZyBkdWUgdG8gcGVuZGluZyByZXF1ZXN0OicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIOWQpuWImeaKm+WHuumUmeivr1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICh0aGlzLl9wZW5kaW5nUmVsb2FkKTtcblxuICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbG9hZCByZXR1cm5lZCBubyByZXN1bHQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZUN1cnJlbnQhKHJlc3VsdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVqZWN0Q3VycmVudCEoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9yZWxvYWRQcm9taXNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOaKveixoeaWueazle+8jOWtkOexu+W/hemhu+WunueOsFxuICAgIGFic3RyYWN0IGVuY29kZShlbnRpdHk/OiBJRWRpdG9yVGFyZ2V0IHwgbnVsbCwgb3B0aW9ucz86IElOb2RlRHVtcE9wdGlvbnMpOiBQcm9taXNlPFRFZGl0b3JFbnRpdHk+O1xuICAgIGFzeW5jIG9wZW4oYXNzZXQ6IElBc3NldEluZm8sIG9wdGlvbnM/OiBJTm9kZUR1bXBPcHRpb25zKTogUHJvbWlzZTxURWRpdG9yRW50aXR5PiB7XG4gICAgICAgIHRoaXMuX2xhc3RPcGVuT3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHJldHVybiB0aGlzLl9kb09wZW4oYXNzZXQsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgX2RvT3Blbihhc3NldDogSUFzc2V0SW5mbywgb3B0aW9ucz86IElOb2RlRHVtcE9wdGlvbnMpOiBQcm9taXNlPFRFZGl0b3JFbnRpdHk+O1xuICAgIGFic3RyYWN0IGNsb3NlKG9wdGlvbnM/OiB7IHNhdmU/OiBib29sZWFuIH0pOiBQcm9taXNlPGJvb2xlYW4+O1xuICAgIGFic3RyYWN0IHNhdmUoKTogUHJvbWlzZTxJQXNzZXRJbmZvPjtcbiAgICBhYnN0cmFjdCBzYXZlQXMoYXNzZXQ6IElBc3NldEluZm8pOiBQcm9taXNlPElBc3NldEluZm8+O1xuICAgIC8qKlxuICAgICAqIOaJp+ihjOWunumZheeahOmHjei9veaTjeS9nO+8jOWtkOexu+mcgOimgeWunueOsOWFt+S9k+eahOmHjei9vemAu+i+kVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBfZG9SZWxvYWQoKTogUHJvbWlzZTxURWRpdG9yRW50aXR5PjtcbiAgICBhYnN0cmFjdCBjcmVhdGUocGFyYW1zOiBJQ3JlYXRlT3B0aW9ucyk6IFByb21pc2U8SUJhc2VJZGVudGlmaWVyPjtcbn1cbiJdfQ==