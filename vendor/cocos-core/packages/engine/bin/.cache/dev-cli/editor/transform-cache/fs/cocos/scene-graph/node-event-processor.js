System.register("q-bundled:///fs/cocos/scene-graph/node-event-processor.js", ["../core/event/callbacks-invoker.js", "../input/types/index.js", "../core/math/vec2.js", "../core/global-exports.js", "./node-event.js", "../input/types/event-enum.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var CallbacksInvoker, EventTouch, Vec2, cclegacy, NodeEventType, InputEventType, Pool, NodeEventProcessor, _arrayPool, _currentHovered, pos, _touchEvents, _mouseEvents, DispatcherEventType, globalCallbacksInvoker;
  _export("NodeEventProcessor", void 0);
  return {
    setters: [function (_coreEventCallbacksInvokerJs) {
      CallbacksInvoker = _coreEventCallbacksInvokerJs.CallbacksInvoker;
    }, function (_inputTypesIndexJs) {
      EventTouch = _inputTypesIndexJs.EventTouch;
    }, function (_coreMathVec2Js) {
      Vec2 = _coreMathVec2Js.Vec2;
    }, function (_coreGlobalExportsJs) {
      cclegacy = _coreGlobalExportsJs.cclegacy;
    }, function (_nodeEventJs) {
      NodeEventType = _nodeEventJs.NodeEventType;
    }, function (_inputTypesEventEnumJs) {
      InputEventType = _inputTypesEventEnumJs.InputEventType;
    }, function (_coreIndexJs) {
      Pool = _coreIndexJs.Pool;
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
      _arrayPool = new Pool(() => new Array(16), 3);
      _currentHovered = null;
      pos = new Vec2();
      _touchEvents = [NodeEventType.TOUCH_START, NodeEventType.TOUCH_MOVE, NodeEventType.TOUCH_END, NodeEventType.TOUCH_CANCEL];
      _mouseEvents = [NodeEventType.MOUSE_DOWN, NodeEventType.MOUSE_ENTER, NodeEventType.MOUSE_MOVE, NodeEventType.MOUSE_LEAVE, NodeEventType.MOUSE_UP, NodeEventType.MOUSE_WHEEL];
      _export("DispatcherEventType", DispatcherEventType = /*#__PURE__*/function (DispatcherEventType) {
        DispatcherEventType[DispatcherEventType["ADD_POINTER_EVENT_PROCESSOR"] = 0] = "ADD_POINTER_EVENT_PROCESSOR";
        DispatcherEventType[DispatcherEventType["REMOVE_POINTER_EVENT_PROCESSOR"] = 1] = "REMOVE_POINTER_EVENT_PROCESSOR";
        DispatcherEventType[DispatcherEventType["MARK_LIST_DIRTY"] = 2] = "MARK_LIST_DIRTY";
        return DispatcherEventType;
      }({}));
      globalCallbacksInvoker = new CallbacksInvoker();
      /**
       * @en The event processor for Node
       * @zh 节点事件类。
       */
      _export("NodeEventProcessor", NodeEventProcessor = class NodeEventProcessor {
        /**
         * Whether the node event is enabled
         */
        get isEnabled() {
          return this._isEnabled;
        }

        /**
         * The list of claimed touch ids
         */

        /**
         * The owner of node event processor.
         */
        get node() {
          return this._node;
        }

        /**
         * Target in bubbling phase.
         */

        constructor(node) {
          this.claimedTouchIdList = [];
          /**
           * The masks in the parent chain of the node
           */
          this.maskList = null;
          /**
           * To cache camera priority.
           */
          this.cachedCameraPriority = 0;
          /**
           * To record whether the mouse move in at the previous mouse event.
           */
          this.previousMouseIn = false;
          this.bubblingTarget = null;
          /**
           * Target in capturing phase.
           */
          this.capturingTarget = null;
          /**
           * Whether the node has registered the mouse event callback
           */
          this.shouldHandleEventMouse = false;
          /**
           * Whether the node has registered the touch event callback
           */
          this.shouldHandleEventTouch = false;
          // Whether dispatch cancel event when node is destroyed.
          this._dispatchingTouch = null;
          this._isEnabled = false;
          // Indicate whether the mouse leaves window(only support one window). If it is
          // true, then will not continue dispatching mouse events, such as mouse move events.
          // Tested on macOS, mouse move events will be triggered once even mouse leaves the window.
          this._isMouseLeaveWindow = false;
          this._node = node;
        }

        /**
         * Set enable state of the node event processor
         * @param value Enable state
         * @param recursive Recursively set the state or not
         * @returns void
         */
        setEnabled(value, recursive = false) {
          if (this._isEnabled === value) {
            return;
          }
          this._isEnabled = value;
          const node = this.node;
          const children = node.children;
          if (value) {
            this._attachMask();
          }
          globalCallbacksInvoker.emit(DispatcherEventType.MARK_LIST_DIRTY);
          if (recursive && children.length > 0) {
            for (let i = 0; i < children.length; ++i) {
              const child = children[i];
              child.eventProcessor.setEnabled(value, true);
            }
          }
        }
        reattach() {
          this.node.walk(node => {
            const eventProcessor = node.eventProcessor;
            // NOTE: When reattaching the current node, the masks of all its descendants need to be recalculated
            const currentMaskList = eventProcessor._searchComponentsInParent(NodeEventProcessor._maskComp);
            eventProcessor.maskList = currentMaskList;
          });
        }
        destroy() {
          if (_currentHovered === this._node) {
            _currentHovered = null;
          }
          if (this.capturingTarget) this.capturingTarget.clear();
          if (this.bubblingTarget) this.bubblingTarget.clear();
          globalCallbacksInvoker.emit(DispatcherEventType.REMOVE_POINTER_EVENT_PROCESSOR, this);
          if (this._dispatchingTouch) {
            // Dispatch touch cancel event when node is destroyed.
            const cancelEvent = new EventTouch([this._dispatchingTouch], true, InputEventType.TOUCH_CANCEL);
            cancelEvent.touch = this._dispatchingTouch;
            this.dispatchEvent(cancelEvent);
            this._dispatchingTouch = null;
          }
        }
        on(type, callback, target, useCapture) {
          this._tryEmittingAddEvent(type);
          useCapture = !!useCapture;
          let invoker;
          if (useCapture) {
            var _this$capturingTarget;
            invoker = (_this$capturingTarget = this.capturingTarget) != null ? _this$capturingTarget : this.capturingTarget = this._newCallbacksInvoker();
          } else {
            var _this$bubblingTarget;
            invoker = (_this$bubblingTarget = this.bubblingTarget) != null ? _this$bubblingTarget : this.bubblingTarget = this._newCallbacksInvoker();
          }
          invoker.on(type, callback, target);
          return callback;
        }
        once(type, callback, target, useCapture) {
          this._tryEmittingAddEvent(type);
          useCapture = !!useCapture;
          let invoker;
          if (useCapture) {
            var _this$capturingTarget2;
            invoker = (_this$capturingTarget2 = this.capturingTarget) != null ? _this$capturingTarget2 : this.capturingTarget = this._newCallbacksInvoker();
          } else {
            var _this$bubblingTarget2;
            invoker = (_this$bubblingTarget2 = this.bubblingTarget) != null ? _this$bubblingTarget2 : this.bubblingTarget = this._newCallbacksInvoker();
          }
          invoker.on(type, callback, target, true);
          return callback;
        }
        off(type, callback, target, useCapture) {
          var _invoker;
          useCapture = !!useCapture;
          let invoker;
          if (useCapture) {
            invoker = this.capturingTarget;
          } else {
            invoker = this.bubblingTarget;
          }
          (_invoker = invoker) == null || _invoker.off(type, callback, target);
        }
        targetOff(target) {
          var _this$capturingTarget3, _this$bubblingTarget3;
          (_this$capturingTarget3 = this.capturingTarget) == null || _this$capturingTarget3.removeAll(target);
          (_this$bubblingTarget3 = this.bubblingTarget) == null || _this$bubblingTarget3.removeAll(target);

          // emit event
          if (this.shouldHandleEventTouch && !this._hasTouchListeners()) {
            this.shouldHandleEventTouch = false;
          }
          if (this.shouldHandleEventMouse && !this._hasMouseListeners()) {
            this.shouldHandleEventMouse = false;
          }
          if (!this._hasPointerListeners()) {
            globalCallbacksInvoker.emit(DispatcherEventType.REMOVE_POINTER_EVENT_PROCESSOR, this);
          }
        }
        emit(type, arg0, arg1, arg2, arg3, arg4) {
          var _this$bubblingTarget4;
          (_this$bubblingTarget4 = this.bubblingTarget) == null || _this$bubblingTarget4.emit(type, arg0, arg1, arg2, arg3, arg4);
        }
        dispatchEvent(event) {
          const owner = this.node;
          let target;
          let i = 0;
          event.target = owner;

          // Event.CAPTURING_PHASE
          const cachedArray = _arrayPool.alloc();
          cachedArray.length = 0;
          this.getCapturingTargets(event.type, cachedArray);
          // capturing
          event.eventPhase = 1;
          for (i = cachedArray.length - 1; i >= 0; --i) {
            target = cachedArray[i];
            if (target.eventProcessor.capturingTarget) {
              event.currentTarget = target;
              // fire event
              target.eventProcessor.capturingTarget.emit(event.type, event, cachedArray);
              // check if propagation stopped
              if (event.propagationStopped) {
                _arrayPool.free(cachedArray);
                return;
              }
            }
          }

          // Event.AT_TARGET
          // checks if destroyed in capturing callbacks
          event.eventPhase = 2;
          event.currentTarget = owner;
          if (this.capturingTarget) {
            this.capturingTarget.emit(event.type, event);
          }
          if (!event.propagationImmediateStopped && this.bubblingTarget) {
            this.bubblingTarget.emit(event.type, event);
          }
          if (!event.propagationStopped && event.bubbles) {
            // Event.BUBBLING_PHASE
            cachedArray.length = 0;
            this.getBubblingTargets(event.type, cachedArray);
            // propagate
            event.eventPhase = 3;
            for (i = 0; i < cachedArray.length; ++i) {
              target = cachedArray[i];
              if (target.eventProcessor.bubblingTarget) {
                event.currentTarget = target;
                // fire event
                target.eventProcessor.bubblingTarget.emit(event.type, event);
                // check if propagation stopped
                if (event.propagationStopped) {
                  _arrayPool.free(cachedArray);
                  return;
                }
              }
            }
          }
          _arrayPool.free(cachedArray);
        }
        hasEventListener(type, callback, target) {
          let has = false;
          if (this.bubblingTarget) {
            has = this.bubblingTarget.hasEventListener(type, callback, target);
          }
          if (!has && this.capturingTarget) {
            has = this.capturingTarget.hasEventListener(type, callback, target);
          }
          return has;
        }

        /**
         * @zh
         * 获得所提供的事件类型在目标捕获阶段监听的所有目标。
         * 捕获阶段包括从根节点到目标节点的过程。
         * 结果保存在数组参数中，并且必须从子节点排序到父节点。
         *
         * @param type - 一个监听事件类型的字符串。
         * @param array - 接收目标的数组。
         */
        getCapturingTargets(type, targets) {
          let parent = this._node.parent;
          while (parent) {
            var _parent$eventProcesso;
            if ((_parent$eventProcesso = parent.eventProcessor.capturingTarget) != null && _parent$eventProcesso.hasEventListener(type)) {
              targets.push(parent);
            }
            parent = parent.parent;
          }
        }

        /**
         * @zh
         * 获得所提供的事件类型在目标冒泡阶段监听的所有目标。
         * 冒泡阶段目标节点到根节点的过程。
         * 结果保存在数组参数中，并且必须从子节点排序到父节点。
         *
         * @param type - 一个监听事件类型的字符串。
         * @param array - 接收目标的数组。
         */
        getBubblingTargets(type, targets) {
          let parent = this._node.parent;
          while (parent) {
            var _parent$eventProcesso2;
            if ((_parent$eventProcesso2 = parent.eventProcessor.bubblingTarget) != null && _parent$eventProcesso2.hasEventListener(type)) {
              targets.push(parent);
            }
            parent = parent.parent;
          }
        }
        onUpdatingSiblingIndex() {
          globalCallbacksInvoker.emit(DispatcherEventType.MARK_LIST_DIRTY);
        }
        _searchComponentsInParent(ctor) {
          const node = this.node;
          if (ctor) {
            let index = 0;
            let list = [];
            for (let curr = node; curr && cclegacy.Node.isNode(curr); curr = curr.parent, ++index) {
              const comp = curr.getComponent(ctor);
              if (comp) {
                const next = {
                  index,
                  comp
                };
                if (list) {
                  list.push(next);
                } else {
                  list = [next];
                }
              }
            }
            return list.length > 0 ? list : null;
          }
          return null;
        }
        _attachMask() {
          this.maskList = this._searchComponentsInParent(NodeEventProcessor._maskComp);
        }
        _isTouchEvent(type) {
          const index = _touchEvents.indexOf(type);
          return index !== -1;
        }
        _isMouseEvent(type) {
          const index = _mouseEvents.indexOf(type);
          return index !== -1;
        }
        _hasTouchListeners() {
          for (let i = 0; i < _touchEvents.length; ++i) {
            const eventType = _touchEvents[i];
            if (this.hasEventListener(eventType)) {
              return true;
            }
          }
          return false;
        }
        _hasMouseListeners() {
          for (let i = 0; i < _mouseEvents.length; ++i) {
            const eventType = _mouseEvents[i];
            if (this.hasEventListener(eventType)) {
              return true;
            }
          }
          return false;
        }
        _hasPointerListeners() {
          const has = this._hasTouchListeners();
          if (has) {
            return true;
          }
          return this._hasMouseListeners();
        }
        _tryEmittingAddEvent(typeToAdd) {
          const isTouchEvent = this._isTouchEvent(typeToAdd);
          const isMouseEvent = this._isMouseEvent(typeToAdd);
          if (isTouchEvent) {
            this.shouldHandleEventTouch = true;
          } else if (isMouseEvent) {
            this.shouldHandleEventMouse = true;
          }
          if ((isTouchEvent || isMouseEvent) && !this._hasPointerListeners()) {
            globalCallbacksInvoker.emit(DispatcherEventType.ADD_POINTER_EVENT_PROCESSOR, this);
          }
        }

        /**
         * Fix when reigster 'once' event callback, `this.off` method isn't be invoked after event is emitted.
         * We need to inject some nodeEventProcessor's logic into the `callbacksInvoker.off` method.
         * @returns {CallbacksInvoker<SystemEventTypeUnion>} decorated callbacks invoker
         */
        _newCallbacksInvoker() {
          const callbacksInvoker = new CallbacksInvoker();
          callbacksInvoker._registerOffCallback(() => {
            if (this.shouldHandleEventTouch && !this._hasTouchListeners()) {
              this.shouldHandleEventTouch = false;
            }
            if (this.shouldHandleEventMouse && !this._hasMouseListeners()) {
              this.shouldHandleEventMouse = false;
            }
            if (!this._hasPointerListeners()) {
              globalCallbacksInvoker.emit(DispatcherEventType.REMOVE_POINTER_EVENT_PROCESSOR, this);
            }
          });
          return callbacksInvoker;
        }

        // #region handle mouse event

        /**
         * @engineInternal
         * @mangle
         */
        _handleEventMouse(eventMouse) {
          switch (eventMouse.type) {
            case InputEventType.MOUSE_DOWN:
              return this._handleMouseDown(eventMouse);
            case InputEventType.MOUSE_MOVE:
              return this._handleMouseMove(eventMouse);
            case InputEventType.MOUSE_UP:
              return this._handleMouseUp(eventMouse);
            case InputEventType.MOUSE_WHEEL:
              return this._handleMouseWheel(eventMouse);
            case InputEventType.MOUSE_LEAVE:
              return this._handleMouseLeave(eventMouse);
            case InputEventType.MOUSE_ENTER:
              return this._handleMouseEnter(eventMouse);
            default:
              return false;
          }
        }
        _handleMouseDown(event) {
          const node = this._node;
          const uiTransformComp = node._getUITransformComp();
          if (!node || !uiTransformComp) {
            return false;
          }
          event.getLocation(pos);
          if (uiTransformComp.hitTest(pos, event.windowId)) {
            event.type = NodeEventType.MOUSE_DOWN;
            event.bubbles = true;
            node.dispatchEvent(event);
            event.propagationStopped = true;
            return true;
          }
          return false;
        }
        _handleMouseMove(event) {
          const node = this._node;
          const uiTransformComp = node._getUITransformComp();
          if (!node || !uiTransformComp || this._isMouseLeaveWindow) {
            return false;
          }
          event.getLocation(pos);
          const hit = uiTransformComp.hitTest(pos, event.windowId);
          if (hit) {
            if (!this.previousMouseIn) {
              // Fix issue when hover node switched, previous hovered node won't get MOUSE_LEAVE notification
              if (_currentHovered && _currentHovered !== node) {
                event.type = NodeEventType.MOUSE_LEAVE;
                _currentHovered.dispatchEvent(event);
                _currentHovered.eventProcessor.previousMouseIn = false;
              }
              _currentHovered = node;
              event.type = NodeEventType.MOUSE_ENTER;
              node.dispatchEvent(event);
              this.previousMouseIn = true;
            }
            event.type = NodeEventType.MOUSE_MOVE;
            event.bubbles = true;
            node.dispatchEvent(event);
            event.propagationStopped = true;
            return true;
          } else if (this.previousMouseIn) {
            event.type = NodeEventType.MOUSE_LEAVE;
            node.dispatchEvent(event);
            this.previousMouseIn = false;
            _currentHovered = null;
          }
          return false;
        }
        _handleMouseUp(event) {
          const node = this._node;
          const uiTransformComp = node._getUITransformComp();
          if (!node || !uiTransformComp) {
            return false;
          }
          event.getLocation(pos);
          if (uiTransformComp.hitTest(pos, event.windowId)) {
            event.type = NodeEventType.MOUSE_UP;
            event.bubbles = true;
            node.dispatchEvent(event);
            event.propagationStopped = true;
            return true;
          }
          return false;
        }
        _handleMouseWheel(event) {
          const node = this._node;
          const uiTransformComp = node._getUITransformComp();
          if (!node || !uiTransformComp) {
            return false;
          }
          event.getLocation(pos);
          if (uiTransformComp.hitTest(pos, event.windowId)) {
            event.type = NodeEventType.MOUSE_WHEEL;
            event.bubbles = true;
            node.dispatchEvent(event);
            // event.propagationStopped = true;
            event.propagationStopped = true;
            return true;
          }
          return false;
        }
        _handleMouseLeave(event) {
          this._isMouseLeaveWindow = true;
          if (this.previousMouseIn) {
            event.type = NodeEventType.MOUSE_LEAVE;
            this._node.dispatchEvent(event);
            this.previousMouseIn = false;
            _currentHovered = null;
          }
          return false;
        }
        _handleMouseEnter(event) {
          this._isMouseLeaveWindow = false;
          return false;
        }

        // #endregion handle mouse event

        // #region handle touch event

        /**
         * @engineInternal
         * @mangle
         */
        _handleEventTouch(eventTouch) {
          try {
            switch (eventTouch.type) {
              case InputEventType.TOUCH_START:
                return this._handleTouchStart(eventTouch);
              case InputEventType.TOUCH_MOVE:
                return this._handleTouchMove(eventTouch);
              case InputEventType.TOUCH_END:
                return this._handleTouchEnd(eventTouch);
              case InputEventType.TOUCH_CANCEL:
                return this._handleTouchCancel(eventTouch);
              default:
                return false;
            }
          } catch (err) {
            this.claimedTouchIdList.length = 0;
            throw err;
          }
        }
        _handleTouchStart(event) {
          const node = this.node;
          const uiTransformComp = node._getUITransformComp();
          if (!node || !uiTransformComp) {
            return false;
          }
          event.getLocation(pos);
          if (uiTransformComp.hitTest(pos, event.windowId)) {
            event.type = NodeEventType.TOUCH_START;
            event.bubbles = true;
            this._dispatchingTouch = event.touch;
            node.dispatchEvent(event);
            return true;
          }
          return false;
        }
        _handleTouchMove(event) {
          const node = this.node;
          if (!node || !node._getUITransformComp()) {
            return false;
          }
          event.type = NodeEventType.TOUCH_MOVE;
          event.bubbles = true;
          this._dispatchingTouch = event.touch;
          node.dispatchEvent(event);
          return true;
        }
        _handleTouchEnd(event) {
          const node = this.node;
          const uiTransformComp = node._getUITransformComp();
          if (!node || !uiTransformComp) {
            return;
          }
          event.getLocation(pos);
          if (uiTransformComp.hitTest(pos, event.windowId)) {
            event.type = NodeEventType.TOUCH_END;
          } else {
            event.type = NodeEventType.TOUCH_CANCEL;
          }
          event.bubbles = true;
          node.dispatchEvent(event);
          this._dispatchingTouch = null;
        }
        _handleTouchCancel(event) {
          const node = this.node;
          if (!node || !node._getUITransformComp()) {
            return;
          }
          event.type = NodeEventType.TOUCH_CANCEL;
          event.bubbles = true;
          node.dispatchEvent(event);
          this._dispatchingTouch = null;
        }

        // #endregion handle touch event
      });
      /**
       * @internal
       */
      NodeEventProcessor._maskComp = null;
      /**
       * @internal
       */
      NodeEventProcessor.callbacksInvoker = globalCallbacksInvoker;
      cclegacy.NodeEventProcessor = NodeEventProcessor;
    }
  };
});