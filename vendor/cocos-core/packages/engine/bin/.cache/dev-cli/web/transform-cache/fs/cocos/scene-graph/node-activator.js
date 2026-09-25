System.register("q-bundled:///fs/cocos/scene-graph/node-activator.js", ["../../../virtual/internal%253Aconstants.js", "../core/data/object.js", "../core/utils/js.js", "../core/utils/misc.js", "./component-scheduler.js", "../core/global-exports.js", "../core/platform/debug.js", "./node-event.js", "../core/data/utils/asserts.js"], function (_export, _context) {
  "use strict";

  var EDITOR, DEV, SUPPORT_JIT, DEBUG, NODEJS, CCObjectFlags, isValid, array, Pool, tryCatchFunctor_EDITOR, invokeOnEnable, createInvokeImpl, createInvokeImplJit, OneOffInvoker, LifeCycleInvoker, legacyCC, assert, errorID, getError, log, NodeEventType, assertIsTrue, UnsortedInvoker, NodeActivator, MAX_POOL_SIZE, IsPreloadStarted, IsOnLoadStarted, IsOnLoadCalled, IsOnEnableCalled, Deactivating, invokePreload, invokeOnLoad, activateTasksPool;
  function _componentCorrupted(node, comp, index) {
    errorID(3817, node.name, index);
    log('Corrupted component value:', comp);
    if (comp) {
      node._removeComponent(comp);
    } else {
      array.removeAt(node.getWritableComponents(), index);
    }
  }

  /**
   * @en The class used to perform activating and deactivating operations of node and component.
   * @zh 用于执行节点和组件的激活和停用操作的管理器。
   */
  _export("default", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      DEV = _virtualInternal253AconstantsJs.DEV;
      SUPPORT_JIT = _virtualInternal253AconstantsJs.SUPPORT_JIT;
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_coreDataObjectJs) {
      CCObjectFlags = _coreDataObjectJs.CCObjectFlags;
      isValid = _coreDataObjectJs.isValid;
    }, function (_coreUtilsJsJs) {
      array = _coreUtilsJsJs.array;
      Pool = _coreUtilsJsJs.Pool;
    }, function (_coreUtilsMiscJs) {
      tryCatchFunctor_EDITOR = _coreUtilsMiscJs.tryCatchFunctor_EDITOR;
    }, function (_componentSchedulerJs) {
      invokeOnEnable = _componentSchedulerJs.invokeOnEnable;
      createInvokeImpl = _componentSchedulerJs.createInvokeImpl;
      createInvokeImplJit = _componentSchedulerJs.createInvokeImplJit;
      OneOffInvoker = _componentSchedulerJs.OneOffInvoker;
      LifeCycleInvoker = _componentSchedulerJs.LifeCycleInvoker;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_corePlatformDebugJs) {
      assert = _corePlatformDebugJs.assert;
      errorID = _corePlatformDebugJs.errorID;
      getError = _corePlatformDebugJs.getError;
      log = _corePlatformDebugJs.log;
    }, function (_nodeEventJs) {
      NodeEventType = _nodeEventJs.NodeEventType;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }],
    execute: function () {
      /*
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
      MAX_POOL_SIZE = 4;
      IsPreloadStarted = CCObjectFlags.IsPreloadStarted;
      IsOnLoadStarted = CCObjectFlags.IsOnLoadStarted;
      IsOnLoadCalled = CCObjectFlags.IsOnLoadCalled;
      IsOnEnableCalled = CCObjectFlags.IsOnEnableCalled;
      Deactivating = CCObjectFlags.Deactivating; // for __preload: used internally, no sort
      UnsortedInvoker = class UnsortedInvoker extends LifeCycleInvoker {
        constructor(invokeFunc) {
          super(invokeFunc);
        }
        add(comp) {
          this._zero.array.push(comp);
        }
        remove(comp) {
          this._zero.fastRemove(comp);
        }
        cancelInactive(flagToClear) {
          LifeCycleInvoker.stableRemoveInactive(this._zero, flagToClear);
        }
        invoke() {
          this._invoke(this._zero);
          this._zero.array.length = 0;
        }
      };
      invokePreload = SUPPORT_JIT ? createInvokeImplJit('c.__preload();') : createInvokeImpl(c => {
        c.internalPreload == null || c.internalPreload();
      }, iterator => {
        const array = iterator.array;
        for (iterator.i = 0; iterator.i < array.length; ++iterator.i) {
          var _array$iterator$i$int, _array$iterator$i;
          (_array$iterator$i$int = (_array$iterator$i = array[iterator.i]).internalPreload) == null || _array$iterator$i$int.call(_array$iterator$i);
        }
      });
      invokeOnLoad = SUPPORT_JIT ? createInvokeImplJit(`c.onLoad();c._objFlags|=${IsOnLoadCalled}`, false, IsOnLoadCalled) : createInvokeImpl(c => {
        c.internalOnLoad == null || c.internalOnLoad();
        c._objFlags |= IsOnLoadCalled;
      }, iterator => {
        const array = iterator.array;
        for (iterator.i = 0; iterator.i < array.length; ++iterator.i) {
          const comp = array[iterator.i];
          comp.internalOnLoad == null || comp.internalOnLoad();
          comp._objFlags |= IsOnLoadCalled;
        }
      }, IsOnLoadCalled);
      activateTasksPool = new Pool(MAX_POOL_SIZE);
      activateTasksPool.get = function getActivateTask() {
        const task = this._get() || {
          preload: new UnsortedInvoker(invokePreload),
          onLoad: new OneOffInvoker(invokeOnLoad),
          onEnable: new OneOffInvoker(invokeOnEnable)
        };

        // reset index to -1 so we can skip invoked component in cancelInactive
        task.preload.zero.i = -1;
        let invoker = task.onLoad;
        invoker.zero.i = -1;
        invoker.neg.i = -1;
        invoker.pos.i = -1;
        invoker = task.onEnable;
        invoker.zero.i = -1;
        invoker.neg.i = -1;
        invoker.pos.i = -1;
        return task;
      };
      _export("default", NodeActivator = class NodeActivator {
        constructor() {
          this.reset();
        }

        /**
         * @en Reset all activation or des-activation tasks
         * @zh 重置所有激活或非激活任务
         */
        reset() {
          // a stack of node's activating tasks
          this._activatingStack = [];
        }

        /**
         * @en Activate or des-activate a node
         * @zh 激活或者停用某个节点
         * @param node Target node
         * @param active Which state to set the node to
         */
        activateNode(node, active) {
          if (active) {
            const task = activateTasksPool.get();
            if (task) {
              this._activatingStack.push(task);
              this._activateNodeRecursively(node, task.preload, task.onLoad, task.onEnable);
              task.preload.invoke();
              task.onLoad.invoke();
              task.onEnable.invoke();
              this._activatingStack.pop();
              activateTasksPool.put(task);
            }
          } else {
            this._deactivateNodeRecursively(node);

            // remove children of this node from previous activating tasks to debounce
            // (this is an inefficient operation but it ensures general case could be implemented in a efficient way)
            const stack = this._activatingStack;
            for (const lastTask of stack) {
              lastTask.preload.cancelInactive(IsPreloadStarted);
              lastTask.onLoad.cancelInactive(IsOnLoadStarted);
              lastTask.onEnable.cancelInactive(IsOnEnableCalled);
            }
          }
          node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }

        /**
         * @en Activate or des-activate a component
         * @zh 激活或者停用某个组件
         * @param comp Target component
         * @param preloadInvoker The invoker for `_preload` method, normally from [[ComponentScheduler]]
         * @param onLoadInvoker The invoker for `onLoad` method, normally from [[ComponentScheduler]]
         * @param onEnableInvoker The invoker for `onEnable` method, normally from [[ComponentScheduler]]
         */
        activateComp(comp, preloadInvoker, onLoadInvoker, onEnableInvoker) {
          if (!isValid(comp, true)) {
            // destroyed before activating
            return;
          }
          if (!(comp._objFlags & IsPreloadStarted)) {
            comp._objFlags |= IsPreloadStarted;
            if (comp.internalPreload) {
              if (preloadInvoker) {
                preloadInvoker.add(comp);
              } else {
                comp.internalPreload();
              }
            }
          }
          if (!(comp._objFlags & IsOnLoadStarted)) {
            comp._objFlags |= IsOnLoadStarted;
            if (comp.internalOnLoad) {
              if (onLoadInvoker) {
                onLoadInvoker.add(comp);
              } else {
                comp.internalOnLoad();
                comp._objFlags |= IsOnLoadCalled;
              }
            } else {
              comp._objFlags |= IsOnLoadCalled;
            }
          }
          if (comp._enabled) {
            if (DEBUG) {
              assertIsTrue(comp.node, getError(3823, comp.uuid, comp.name));
            }
            const deactivatedOnLoading = !comp.node.activeInHierarchy;
            if (deactivatedOnLoading) {
              return;
            }
            legacyCC.director._compScheduler.enableComp(comp, onEnableInvoker);
          }
        }

        /**
         * @en Destroy a component
         * @zh 销毁一个组件
         * @param comp Target component
         */
        destroyComp(comp) {
          // ensure onDisable called
          legacyCC.director._compScheduler.disableComp(comp);
          if (comp.internalOnDestroy && comp._objFlags & IsOnLoadCalled) {
            comp.internalOnDestroy();
          }
        }
        _activateNodeRecursively(node, preloadInvoker, onLoadInvoker, onEnableInvoker) {
          if (node._objFlags & Deactivating) {
            // en:
            // Forbid reactive the same node during its deactivating procedure
            // to avoid endless loop and simplify the implementation.
            // zh:
            // 对相同节点而言，无法撤销反激活，防止反激活 - 激活 - 反激活的死循环发生。
            // 这样设计简化了一些引擎的实现，而且对调用者来说能保证反激活操作都能成功。
            errorID(3816, node.name);
            return;
          }
          node._setActiveInHierarchy(true);

          // component maybe added during onEnable, and the onEnable of new component is already called
          // so we should record the origin length
          let originCount = node.components.length;
          // activate components
          for (let i = 0; i < originCount; ++i) {
            const component = node.components[i];
            if (component instanceof legacyCC.Component) {
              this.activateComp(component, preloadInvoker, onLoadInvoker, onEnableInvoker);
            } else {
              _componentCorrupted(node, component, i);
              --i;
              --originCount;
            }
          }

          // activate children recursively
          for (let i = 0, len = node.children.length; i < len; ++i) {
            const child = node.children[i];
            if (child.active) {
              this._activateNodeRecursively(child, preloadInvoker, onLoadInvoker, onEnableInvoker);
            }
          }
          node._onPostActivated(true);
        }
        _deactivateNodeRecursively(node) {
          if (DEV) {
            assert(!(node._objFlags & Deactivating), 'node should not deactivating');
            // ensures _activeInHierarchy is always changing when Deactivating flagged
            assert(node.activeInHierarchy, 'node should not deactivated');
          }
          node._objFlags |= Deactivating;
          node._setActiveInHierarchy(false);

          // component maybe added during onEnable, and the onEnable of new component is already called
          // so we should record the origin length
          const originCount = node.components.length;
          for (let c = 0; c < originCount; ++c) {
            const component = node.components[c];
            if (component._enabled) {
              legacyCC.director._compScheduler.disableComp(component);
              if (node.activeInHierarchy) {
                // reactivated from root
                node._objFlags &= ~Deactivating;
                return;
              }
            }
          }
          for (let i = 0, len = node.children.length; i < len; ++i) {
            const child = node.children[i];
            if (child.activeInHierarchy) {
              this._deactivateNodeRecursively(child);
              if (node.activeInHierarchy) {
                // reactivated from root
                node._objFlags &= ~Deactivating;
                return;
              }
            }
          }
          node._onPostActivated(false);
          node._objFlags &= ~Deactivating;
        }
      });
      if (EDITOR || NODEJS) {
        const callPreloadInTryCatch = tryCatchFunctor_EDITOR('__preload');
        const callOnLoadInTryCatch = function (c) {
          try {
            c.internalOnLoad == null || c.internalOnLoad();
          } catch (e) {
            legacyCC._throw(e);
          }
          c._objFlags |= IsOnLoadCalled;
          _onLoadInEditor(c);
        };
        const callOnDestroyInTryCatch = tryCatchFunctor_EDITOR('onDestroy');
        const callOnFocusInTryCatch = tryCatchFunctor_EDITOR('onFocusInEditor');
        const callOnLostFocusInTryCatch = tryCatchFunctor_EDITOR('onLostFocusInEditor');
        const _onLoadInEditor = comp => {
          if (comp.internalOnLoad && !legacyCC.GAME_VIEW) {
            const focused = !NODEJS && Editor.Selection.getLastSelected('node') === comp.node.uuid;
            if (focused) {
              if (comp.onFocusInEditor && callOnFocusInTryCatch) {
                callOnFocusInTryCatch(comp);
              }
            } else if (comp.onLostFocusInEditor && callOnLostFocusInTryCatch) {
              callOnLostFocusInTryCatch(comp);
            }
          }
        };
        NodeActivator.prototype.activateComp = (comp, preloadInvoker, onLoadInvoker, onEnableInvoker) => {
          if (!isValid(comp, true)) {
            // destroyed before activating
            return;
          }
          // NOTE: _executeInEditMode is dynamically injected on Editor environment
          if (legacyCC.GAME_VIEW || comp.constructor._executeInEditMode) {
            if (!(comp._objFlags & IsPreloadStarted)) {
              comp._objFlags |= IsPreloadStarted;
              if (comp.internalPreload) {
                if (preloadInvoker) {
                  preloadInvoker.add(comp);
                } else if (callPreloadInTryCatch) {
                  callPreloadInTryCatch(comp);
                }
              }
            }
            if (!(comp._objFlags & IsOnLoadStarted)) {
              comp._objFlags |= IsOnLoadStarted;
              if (comp.internalOnLoad) {
                if (onLoadInvoker) {
                  onLoadInvoker.add(comp);
                } else if (callOnLoadInTryCatch) {
                  callOnLoadInTryCatch(comp);
                }
              } else {
                comp._objFlags |= IsOnLoadCalled;
                _onLoadInEditor(comp);
              }
            }
          }
          if (comp._enabled) {
            if (DEBUG) {
              assertIsTrue(comp.node, getError(3823, comp.uuid, comp.name));
            }
            const deactivatedOnLoading = !comp.node.activeInHierarchy;
            if (deactivatedOnLoading) {
              return;
            }
            legacyCC.director._compScheduler.enableComp(comp, onEnableInvoker);
          }
        };
        NodeActivator.prototype.destroyComp = comp => {
          // ensure onDisable called
          legacyCC.director._compScheduler.disableComp(comp);
          if (comp.internalOnDestroy && comp._objFlags & IsOnLoadCalled) {
            // NOTE: _executeInEditMode is dynamically injected on Editor environment
            if (legacyCC.GAME_VIEW || comp.constructor._executeInEditMode) {
              callOnDestroyInTryCatch && callOnDestroyInTryCatch(comp);
            }
          }
        };
        NodeActivator.prototype.resetComp = (comp, didResetToDefault) => {
          if (comp.resetInEditor) {
            try {
              comp.resetInEditor(didResetToDefault);
            } catch (e) {
              legacyCC._throw(e);
            }
          }
        };
      }
    }
  };
});