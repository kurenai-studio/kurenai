System.register("q-bundled:///fs/cocos/core/event/callbacks-invoker.js", ["../../../../virtual/internal%253Aconstants.js", "../memop/index.js", "../utils/js.js", "../data/object.js", "../global-exports.js"], function (_export, _context) {
  "use strict";

  var TEST, Pool, array, createMap, isCCObject, isValid, legacyCC, CallbackInfo, CallbackList, CallbacksInvoker, fastRemoveAt, callbackInfoPool, MAX_SIZE, callbackListPool;
  function empty() {}
  _export({
    CallbackList: void 0,
    CallbacksInvoker: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_memopIndexJs) {
      Pool = _memopIndexJs.Pool;
    }, function (_utilsJsJs) {
      array = _utilsJsJs.array;
      createMap = _utilsJsJs.createMap;
    }, function (_dataObjectJs) {
      isCCObject = _dataObjectJs.isCCObject;
      isValid = _dataObjectJs.isValid;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      fastRemoveAt = array.fastRemoveAt;
      CallbackInfo = class CallbackInfo {
        constructor() {
          this.callback = empty;
          this.target = undefined;
          this.once = false;
        }
        set(callback, target, once) {
          this.callback = callback || empty;
          this.target = target;
          this.once = !!once;
        }
        reset() {
          this.target = undefined;
          this.callback = empty;
          this.once = false;
        }
        check() {
          // Validation
          if (isCCObject(this.target) && !isValid(this.target, true)) {
            return false;
          } else {
            return true;
          }
        }
      };
      callbackInfoPool = new Pool(() => new CallbackInfo(), 32);
      /**
       * @zh 事件监听器列表的简单封装。
       * @en A simple list of event callbacks
       */
      _export("CallbackList", CallbackList = class CallbackList {
        constructor() {
          this.callbackInfos = [];
          this.isInvoking = false;
          this.containCanceled = false;
        }

        /**
         * @zh 从列表中移除与指定目标相同回调函数的事件。
         * @en Remove the event listeners with the given callback from the list
         *
         * @param cb - The callback to be removed
         */
        removeByCallback(cb) {
          for (let i = 0; i < this.callbackInfos.length; ++i) {
            const info = this.callbackInfos[i];
            if (info && info.callback === cb) {
              info.reset();
              callbackInfoPool.free(info);
              fastRemoveAt(this.callbackInfos, i);
              --i;
            }
          }
        }
        /**
         * @zh 从列表中移除与指定目标相同调用者的事件。
         * @en Remove the event listeners with the given target from the list
         * @param target
         */
        removeByTarget(target) {
          for (let i = 0; i < this.callbackInfos.length; ++i) {
            const info = this.callbackInfos[i];
            if (info && info.target === target) {
              info.reset();
              callbackInfoPool.free(info);
              fastRemoveAt(this.callbackInfos, i);
              --i;
            }
          }
        }

        /**
         * @zh 移除指定编号事件。
         * @en Remove the event listener at the given index
         * @param index
         */
        cancel(index) {
          const info = this.callbackInfos[index];
          if (info) {
            info.reset();
            if (this.isInvoking) {
              this.callbackInfos[index] = null;
            } else {
              fastRemoveAt(this.callbackInfos, index);
            }
            callbackInfoPool.free(info);
          }
          this.containCanceled = true;
        }

        /**
         * @zh 注销所有事件。
         * @en Cancel all event listeners
         */
        cancelAll() {
          for (let i = 0; i < this.callbackInfos.length; i++) {
            const info = this.callbackInfos[i];
            if (info) {
              info.reset();
              callbackInfoPool.free(info);
              this.callbackInfos[i] = null;
            }
          }
          this.containCanceled = true;
        }

        /**
         * @zh 立即删除所有取消的回调。（在移除过程中会更加紧凑的排列数组）
         * @en Delete all canceled callbacks and compact array
         */
        purgeCanceled() {
          for (let i = this.callbackInfos.length - 1; i >= 0; --i) {
            const info = this.callbackInfos[i];
            if (!info) {
              fastRemoveAt(this.callbackInfos, i);
            }
          }
          this.containCanceled = false;
        }

        /**
         * @zh 清除并重置所有数据。
         * @en Clear all data
         */
        clear() {
          this.cancelAll();
          this.callbackInfos.length = 0;
          this.isInvoking = false;
          this.containCanceled = false;
        }
      });
      MAX_SIZE = 16;
      callbackListPool = new Pool(() => new CallbackList(), MAX_SIZE);
      /**
       * @zh CallbacksInvoker 用来根据事件名（Key）管理事件监听器列表并调用回调方法。
       * @en CallbacksInvoker is used to manager and invoke event listeners with different event keys,
       * each key is mapped to a CallbackList.
       * @engineInternal
       */
      _export("CallbacksInvoker", CallbacksInvoker = class CallbacksInvoker {
        constructor() {
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._callbackTable = createMap(true);
          this._offCallback = void 0;
        }

        /**
         * @zh 向一个事件名注册一个新的事件监听器，包含回调函数和调用者
         * @en Register an event listener to a given event key with callback and target.
         *
         * @param key - Event type
         * @param callback - Callback function when event triggered
         * @param target - Callback callee
         * @param once - Whether invoke the callback only once (and remove it)
         */
        on(key, callback, target, once) {
          if (!this.hasEventListener(key, callback, target)) {
            let list = this._callbackTable[key];
            if (!list) {
              list = this._callbackTable[key] = callbackListPool.alloc();
            }
            const info = callbackInfoPool.alloc();
            info.set(callback, target, once);
            list.callbackInfos.push(info);
          }
          return callback;
        }

        /**
         * @zh 检查指定事件是否已注册回调。
         * @en Checks whether there is correspond event listener registered on the given event
         * @param key - Event type
         * @param callback - Callback function when event triggered
         * @param target - Callback callee
         */
        hasEventListener(key, callback, target) {
          const list = this._callbackTable && this._callbackTable[key];
          if (!list) {
            return false;
          }

          // check any valid callback
          const infos = list.callbackInfos;
          if (!callback) {
            // Make sure no cancelled callbacks
            if (list.isInvoking) {
              for (let i = 0; i < infos.length; ++i) {
                if (infos[i]) {
                  return true;
                }
              }
              return false;
            } else {
              return infos.length > 0;
            }
          }
          for (let i = 0; i < infos.length; ++i) {
            const info = infos[i];
            if (info && info.check() && info.callback === callback && info.target === target) {
              return true;
            }
          }
          return false;
        }

        /**
         * @zh 移除在特定事件类型中注册的所有回调或在某个目标中注册的所有回调。
         * @en Removes all callbacks registered in a certain event type or all callbacks registered with a certain target
         * @param keyOrTarget - The event type or target with which the listeners will be removed
         */
        removeAll(keyOrTarget) {
          const type = typeof keyOrTarget;
          if (type === 'string' || type === 'number') {
            // remove by key
            const list = this._callbackTable && this._callbackTable[keyOrTarget];
            if (list) {
              if (list.isInvoking) {
                list.cancelAll();
              } else {
                list.clear();
                callbackListPool.free(list);
                delete this._callbackTable[keyOrTarget];
              }
            }
          } else if (keyOrTarget) {
            // remove by target
            for (const key in this._callbackTable) {
              const list = this._callbackTable[key];
              if (list.isInvoking) {
                const infos = list.callbackInfos;
                for (let i = 0; i < infos.length; ++i) {
                  const info = infos[i];
                  if (info && info.target === keyOrTarget) {
                    list.cancel(i);
                  }
                }
              } else {
                list.removeByTarget(keyOrTarget);
              }
            }
          }
        }

        /**
         * @zh 删除以指定事件，回调函数，目标注册的回调。
         * @en Remove event listeners registered with the given event key, callback and target
         * @param key - Event type
         * @param callback - The callback function of the event listener, if absent all event listeners for the given type will be removed
         * @param target - The callback callee of the event listener
         */
        off(key, callback, target) {
          var _this$_offCallback;
          const list = this._callbackTable && this._callbackTable[key];
          if (list) {
            const infos = list.callbackInfos;
            if (callback) {
              for (let i = 0; i < infos.length; ++i) {
                const info = infos[i];
                if (info && info.callback === callback && info.target === target) {
                  list.cancel(i);
                  break;
                }
              }
            } else {
              this.removeAll(key);
            }
          }
          (_this$_offCallback = this._offCallback) == null || _this$_offCallback.call(this);
        }

        /**
         * @zh 派发一个指定事件，并传递需要的参数
         * @en Trigger an event directly with the event name and necessary arguments.
         * @param key - event type
         * @param arg0 - The first argument to be passed to the callback
         * @param arg1 - The second argument to be passed to the callback
         * @param arg2 - The third argument to be passed to the callback
         * @param arg3 - The fourth argument to be passed to the callback
         * @param arg4 - The fifth argument to be passed to the callback
         */
        emit(key, arg0, arg1, arg2, arg3, arg4) {
          const list = this._callbackTable && this._callbackTable[key];
          if (list) {
            const rootInvoker = !list.isInvoking;
            list.isInvoking = true;
            const infos = list.callbackInfos;
            for (let i = 0, len = infos.length; i < len; ++i) {
              const info = infos[i];
              if (info) {
                const callback = info.callback;
                const target = info.target;
                // Pre off once callbacks to avoid influence on logic in callback
                if (info.once) {
                  this.off(key, callback, target);
                }
                // Lazy check validity of callback target,
                // if target is CCObject and is no longer valid, then remove the callback info directly
                if (!info.check()) {
                  this.off(key, callback, target);
                } else if (target) {
                  callback.call(target, arg0, arg1, arg2, arg3, arg4);
                } else {
                  callback(arg0, arg1, arg2, arg3, arg4);
                }
              }
            }
            if (rootInvoker) {
              list.isInvoking = false;
              if (list.containCanceled) {
                list.purgeCanceled();
              }
            }
          }
        }

        /**
         * 移除所有回调。
         */
        clear() {
          for (const key in this._callbackTable) {
            const list = this._callbackTable[key];
            if (list) {
              list.clear();
              callbackListPool.free(list);
              delete this._callbackTable[key];
            }
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        _registerOffCallback(cb) {
          this._offCallback = cb;
        }
      });
      if (TEST) {
        legacyCC._Test.CallbacksInvoker = CallbacksInvoker;
      }
    }
  };
});