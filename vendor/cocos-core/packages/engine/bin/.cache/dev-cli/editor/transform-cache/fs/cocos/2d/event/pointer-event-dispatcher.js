System.register("q-bundled:///fs/cocos/2d/event/pointer-event-dispatcher.js", ["../../input/index.js", "../../input/types/index.js", "../../scene-graph/node-event-processor.js", "../../core/index.js", "../../input/types/event-enum.js", "../../input/input.js"], function (_export, _context) {
  "use strict";

  var input, EventTouch, DispatcherEventType, NodeEventProcessor, CCObjectFlags, js, InputEventType, EventDispatcherPriority, PointerEventDispatcher, mouseEvents, touchEvents, isDestroy, pointerEventDispatcher;
  return {
    setters: [function (_inputIndexJs) {
      input = _inputIndexJs.input;
    }, function (_inputTypesIndexJs) {
      EventTouch = _inputTypesIndexJs.EventTouch;
    }, function (_sceneGraphNodeEventProcessorJs) {
      DispatcherEventType = _sceneGraphNodeEventProcessorJs.DispatcherEventType;
      NodeEventProcessor = _sceneGraphNodeEventProcessorJs.NodeEventProcessor;
    }, function (_coreIndexJs) {
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      js = _coreIndexJs.js;
    }, function (_inputTypesEventEnumJs) {
      InputEventType = _inputTypesEventEnumJs.InputEventType;
    }, function (_inputInputJs) {
      EventDispatcherPriority = _inputInputJs.EventDispatcherPriority;
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
      mouseEvents = [InputEventType.MOUSE_DOWN, InputEventType.MOUSE_MOVE, InputEventType.MOUSE_UP, InputEventType.MOUSE_WHEEL, InputEventType.MOUSE_LEAVE, InputEventType.MOUSE_ENTER];
      touchEvents = [InputEventType.TOUCH_START, InputEventType.TOUCH_MOVE, InputEventType.TOUCH_END, InputEventType.TOUCH_CANCEL];
      isDestroy = node => !!(node._objFlags & CCObjectFlags.Destroying || node._objFlags & CCObjectFlags.Destroyed);
      PointerEventDispatcher = class PointerEventDispatcher {
        constructor() {
          this.priority = EventDispatcherPriority.UI;
          this._isListDirty = false;
          this._inDispatchCount = 0;
          this._pointerEventProcessorList = [];
          this._processorListToAdd = [];
          this._processorListToRemove = [];
          input._registerEventDispatcher(this);
          const callbacksInvoker = NodeEventProcessor.callbacksInvoker;
          callbacksInvoker.on(DispatcherEventType.ADD_POINTER_EVENT_PROCESSOR, this.addPointerEventProcessor, this);
          callbacksInvoker.on(DispatcherEventType.REMOVE_POINTER_EVENT_PROCESSOR, this.removePointerEventProcessor, this);
          callbacksInvoker.on(DispatcherEventType.MARK_LIST_DIRTY, this._markListDirty, this);
        }
        onThrowException() {
          this._inDispatchCount = 0;
        }
        dispatchEvent(event) {
          const eventType = event.type;
          if (touchEvents.includes(eventType)) {
            return this.dispatchEventTouch(event);
          } else if (mouseEvents.includes(eventType)) {
            return this.dispatchEventMouse(event);
          }
          return true;
        }
        addPointerEventProcessor(pointerEventProcessor) {
          if (this._inDispatchCount === 0) {
            if (!this._pointerEventProcessorList.includes(pointerEventProcessor)) {
              this._pointerEventProcessorList.push(pointerEventProcessor);
              this._isListDirty = true;
            }
          } else if (!this._processorListToAdd.includes(pointerEventProcessor)) {
            this._processorListToAdd.push(pointerEventProcessor);
          }
          js.array.remove(this._processorListToRemove, pointerEventProcessor);
        }
        removePointerEventProcessor(pointerEventProcessor) {
          if (this._inDispatchCount === 0) {
            js.array.remove(this._pointerEventProcessorList, pointerEventProcessor);
            this._isListDirty = true;
          } else if (!this._processorListToRemove.includes(pointerEventProcessor)) {
            this._processorListToRemove.push(pointerEventProcessor);
          }
          js.array.remove(this._processorListToAdd, pointerEventProcessor);
        }
        dispatchEventMouse(eventMouse) {
          this._inDispatchCount++;
          this._sortPointerEventProcessorList();
          const pointerEventProcessorList = this._pointerEventProcessorList;
          const length = pointerEventProcessorList.length;
          let dispatchToNextEventDispatcher = true;
          for (let i = 0; i < length; ++i) {
            const pointerEventProcessor = pointerEventProcessorList[i];
            if (pointerEventProcessor.isEnabled && pointerEventProcessor.shouldHandleEventMouse && pointerEventProcessor._handleEventMouse(eventMouse)) {
              dispatchToNextEventDispatcher = false;
              if (!eventMouse.preventSwallow) {
                break;
              } else {
                eventMouse.preventSwallow = false; // reset swallow state
              }
            }
          }
          if (--this._inDispatchCount <= 0) {
            this._updatePointerEventProcessorList();
          }
          return dispatchToNextEventDispatcher;
        }
        dispatchEventTouch(eventTouch) {
          this._inDispatchCount++;
          this._sortPointerEventProcessorList();
          const pointerEventProcessorList = this._pointerEventProcessorList;
          const length = pointerEventProcessorList.length;
          const touch = eventTouch.touch;
          let dispatchToNextEventDispatcher = true;
          for (let i = 0; i < length; ++i) {
            const pointerEventProcessor = pointerEventProcessorList[i];
            if (pointerEventProcessor.isEnabled && pointerEventProcessor.shouldHandleEventTouch) {
              if (eventTouch.type === InputEventType.TOUCH_START) {
                if (pointerEventProcessor._handleEventTouch(eventTouch)) {
                  // pointerEventProcessor may be disabled in handling touch event above.
                  if (pointerEventProcessor.isEnabled) {
                    pointerEventProcessor.claimedTouchIdList.push(touch.getID());
                  } else {
                    const cancelEvent = new EventTouch([eventTouch.touch], true, InputEventType.TOUCH_CANCEL);
                    cancelEvent.touch = eventTouch.touch;
                    pointerEventProcessor.dispatchEvent(cancelEvent);
                    pointerEventProcessor.claimedTouchIdList.length = 0;
                  }
                  dispatchToNextEventDispatcher = false;
                  if (!eventTouch.preventSwallow) {
                    break;
                  } else {
                    eventTouch.preventSwallow = false; // reset swallow state
                  }
                }
              } else if (pointerEventProcessor.claimedTouchIdList.length > 0) {
                const index = pointerEventProcessor.claimedTouchIdList.indexOf(touch.getID());
                if (index !== -1) {
                  pointerEventProcessor._handleEventTouch(eventTouch);
                  if (eventTouch.type === InputEventType.TOUCH_END || eventTouch.type === InputEventType.TOUCH_CANCEL) {
                    js.array.removeAt(pointerEventProcessor.claimedTouchIdList, index);
                    // The event is handled, and the event can be swallowed, so should remove other EventProcessor's claimedTouchIdList.
                    if (!eventTouch.preventSwallow) {
                      this._removeClaimedTouch(i + 1, touch.getID());
                    }
                  }
                  dispatchToNextEventDispatcher = false;
                  if (!eventTouch.preventSwallow) {
                    break;
                  } else {
                    eventTouch.preventSwallow = false; // reset swallow state
                  }
                }
              }
            }
          }
          if (--this._inDispatchCount <= 0) {
            this._updatePointerEventProcessorList();
          }
          return dispatchToNextEventDispatcher;
        }
        _removeClaimedTouch(eventProcessorIndex, touchID) {
          const pointerEventProcessorList = this._pointerEventProcessorList;
          const length = pointerEventProcessorList.length;
          for (let i = eventProcessorIndex; i < length; ++i) {
            const pointerEventProcessor = pointerEventProcessorList[i];
            const touchIndex = pointerEventProcessor.claimedTouchIdList.indexOf(touchID);
            if (touchIndex !== -1) {
              js.array.removeAt(pointerEventProcessor.claimedTouchIdList, touchIndex);
            }
          }
        }
        _updatePointerEventProcessorList() {
          const listToAdd = this._processorListToAdd;
          const addLength = listToAdd.length;
          for (let i = 0; i < addLength; ++i) {
            this.addPointerEventProcessor(listToAdd[i]);
          }
          listToAdd.length = 0;
          const listToRemove = this._processorListToRemove;
          const removeLength = listToRemove.length;
          for (let i = 0; i < removeLength; ++i) {
            this.removePointerEventProcessor(listToRemove[i]);
          }
          listToRemove.length = 0;
        }
        _sortPointerEventProcessorList() {
          if (!this._isListDirty) {
            return;
          }
          const pointerEventProcessorList = this._pointerEventProcessorList;
          const length = pointerEventProcessorList.length;
          for (let i = 0; i < length; ++i) {
            const pointerEventProcessor = pointerEventProcessorList[i];
            const node = pointerEventProcessor.node;
            if (node._uiProps) {
              const trans = node._getUITransformComp();
              pointerEventProcessor.cachedCameraPriority = trans.cameraPriority;
            }
          }
          pointerEventProcessorList.sort(this._sortByPriority);
          this._isListDirty = false;
        }
        _sortByPriority(p1, p2) {
          const node1 = p1.node;
          const node2 = p2.node;
          if (!p2 || !node2 || isDestroy(node2) || !node2.activeInHierarchy || !node2._getUITransformComp()) {
            return -1;
          } else if (!p1 || !node1 || isDestroy(node1) || !node1.activeInHierarchy || !node1._getUITransformComp()) {
            return 1;
          }
          if (p1.cachedCameraPriority !== p2.cachedCameraPriority) {
            return p2.cachedCameraPriority - p1.cachedCameraPriority;
          }
          let n1 = node1;
          let n2 = node2;
          let ex = false;
          while (((_parent = n1.parent) == null ? void 0 : _parent.uuid) !== ((_parent2 = n2.parent) == null ? void 0 : _parent2.uuid)) {
            var _parent, _parent2, _n, _n2;
            n1 = ((_n = n1) == null || (_n = _n.parent) == null ? void 0 : _n.parent) === null ? (ex = true) && node2 : n1 && n1.parent;
            n2 = ((_n2 = n2) == null || (_n2 = _n2.parent) == null ? void 0 : _n2.parent) === null ? (ex = true) && node1 : n2 && n2.parent;
          }
          if (n1.uuid === n2.uuid) {
            if (n1.uuid === node2.uuid) {
              return -1;
            }
            if (n1.uuid === node1.uuid) {
              return 1;
            }
          }
          const priority1 = n1 ? n1.siblingIndex : 0;
          const priority2 = n2 ? n2.siblingIndex : 0;
          return ex ? priority1 - priority2 : priority2 - priority1;
        }
        _markListDirty() {
          this._isListDirty = true;
        }
      };
      _export("pointerEventDispatcher", pointerEventDispatcher = new PointerEventDispatcher());
    }
  };
});