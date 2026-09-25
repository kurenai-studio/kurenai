System.register("q-bundled:///fs/cocos/input/types/event/event.js", ["../../../core/index.js"], function (_export, _context) {
  "use strict";

  var cclegacy, Event;
  _export("Event", void 0);
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
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
      /**
       * @en
       * Base class of all kinds of events.
       *
       * @zh
       * 所有事件对象的基类，包含事件相关基本信息。
       */
      _export("Event", Event = class Event {
        /**
         * @param type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
         * @param bubbles - A boolean indicating whether the event bubbles up through the tree or not
         */
        constructor(type, bubbles) {
          /**
           * @en
           * A reference to the target to which the event was originally dispatched.
           *
           * @zh
           * 最初事件触发的目标。
           */
          this.target = null;
          /**
           * @en
           * A reference to the currently registered target for the event.
           *
           * @zh
           * 当前目标。
           */
          this.currentTarget = null;
          /**
           * @en
           * Indicates which phase of the event flow is currently being evaluated.
           * Returns an integer value represented by 4 constants:
           *  - Event.NONE = 0
           *  - Event.CAPTURING_PHASE = 1
           *  - Event.AT_TARGET = 2
           *  - Event.BUBBLING_PHASE = 3
           * The phases are explained in the [section 3.1, Event dispatch and DOM event flow]
           * [markdown](http://www.w3.org/TR/DOM-Level-3-Events/#event-flow), of the DOM Level 3 Events specification.
           *
           * @zh
           * 事件阶段。
           */
          this.eventPhase = 0;
          /**
           * @en
           * Stops propagation for current event.
           *
           * @zh
           * 停止传递当前事件。
           */
          this.propagationStopped = false;
          /**
           * @en
           * Stops propagation for current event immediately,
           * the event won't even be dispatched to the listeners attached in the current target.
           *
           * @zh
           * 立即停止当前事件的传递，事件甚至不会被分派到所连接的当前目标。
           */
          this.propagationImmediateStopped = false;
          this.type = type;
          this.bubbles = !!bubbles;
        }

        /**
         * @en
         * Reset the event for being stored in the object pool.
         *
         * @zh
         * 重置事件对象以便在对象池中存储。
         */
        unuse() {
          this.type = Event.NO_TYPE;
          this.target = null;
          this.currentTarget = null;
          this.eventPhase = Event.NONE;
          this.propagationStopped = false;
          this.propagationImmediateStopped = false;
        }

        /**
         * @en
         * Reinitialize the event for being used again after retrieved from the object pool.
         * @zh
         * 重新初始化让对象池中取出的事件可再次使用。
         * @param type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
         * @param bubbles - A boolean indicating whether the event bubbles up through the tree or not
         */
        reuse(type, bubbles) {
          this.type = type;
          this.bubbles = bubbles || false;
        }

        // /**
        //  * @en Stops propagation for current event.
        //  * @zh 停止传递当前事件。
        //  */
        // public stopPropagation () {
        //     this.propagationStopped = true;
        // }

        // /**
        //  * @en Stops propagation for current event immediately,
        //  * the event won't even be dispatched to the listeners attached in the current target.
        //  * @zh 立即停止当前事件的传递，事件甚至不会被分派到所连接的当前目标。
        //  */
        // public stopPropagationImmediate () {
        //     this.propagationImmediateStopped = true;
        // }

        /**
         * @en
         * Checks whether the event has been stopped.
         *
         * @zh
         * 检查该事件是否已经停止传递。
         */
        isStopped() {
          return this.propagationStopped || this.propagationImmediateStopped;
        }

        /**
         * @en
         * Gets current target of the event                                                            <br/>
         * note: It only be available when the event listener is associated with node.                <br/>
         * It returns 0 when the listener is associated with fixed priority.
         * @zh
         * 获取当前目标节点
         * @returns - The target with which the event associates.
         */
        getCurrentTarget() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this.currentTarget;
        }

        /**
         * @en
         * Gets the event type.
         * @zh
         * 获取事件类型。
         */
        getType() {
          return this.type;
        }
      });
      /* tslint:disable:no-string-literal */
      // Event types
      /**
       * @en
       * Code for event without type.
       *
       * @zh
       * 没有类型的事件。
       */
      Event.NO_TYPE = 'no_type';
      /**
       * @en
       * The type code of Touch event.
       *
       * @zh
       * 触摸事件类型。
       *
       * @deprecated since v3.3, please use SystemEvent.EventType.TOUCH_START, SystemEvent.EventType.TOUCH_MOVE, SystemEvent.EventType.TOUCH_END and SystemEvent.EventType.TOUCH_CANCEL instead
       */
      Event.TOUCH = 'touch';
      /**
       * @en
       * The type code of Mouse event.
       *
       * @zh
       * 鼠标事件类型。
       *
       * @deprecated since v3.3, please use SystemEvent.EventType.MOUSE_DOWN, SystemEvent.EventType.MOUSE_MOVE, SystemEvent.EventType.MOUSE_UP, SystemEvent.EventType.MOUSE_WHEEL, Node.EventType.MOUSE_ENTER and Node.EventType.MOUSE_LEAVE instead
       */
      Event.MOUSE = 'mouse';
      /**
       * @en
       * The type code of Keyboard event.
       *
       * @zh
       * 键盘事件类型。
       *
       * @deprecated since v3.3, please use SystemEvent.EventType.KEY_DOWN and SystemEvent.EventType.KEY_UP instead
       */
      Event.KEYBOARD = 'keyboard';
      /**
       * @en
       * The type code of Acceleration event.
       *
       * @zh
       * 加速器事件类型。
       *
       * @deprecated since v3.3, please use SystemEvent.EventType.DEVICEMOTION instead
       */
      Event.ACCELERATION = 'acceleration';
      // Event phases
      /**
       * @en
       * Events not currently dispatched are in this phase.
       *
       * @zh
       * 尚未派发事件阶段。
       */
      Event.NONE = 0;
      /**
       * @en
       * The capturing phase comprises the journey from the root to the last node before the event target's node
       * [markdown](http://www.w3.org/TR/DOM-Level-3-Events/#event-flow)
       *
       * @zh
       * 捕获阶段，包括事件目标节点之前从根节点到最后一个节点的过程。
       */
      Event.CAPTURING_PHASE = 1;
      /**
       * @en
       * The target phase comprises only the event target node
       * [markdown] (http://www.w3.org/TR/DOM-Level-3-Events/#event-flow)
       *
       * @zh
       * 目标阶段仅包括事件目标节点。
       */
      Event.AT_TARGET = 2;
      /**
       * @en
       * The bubbling phase comprises any subsequent nodes encountered on the return trip to the root of the hierarchy
       * [markdown] (http://www.w3.org/TR/DOM-Level-3-Events/#event-flow)
       *
       * @zh
       * 冒泡阶段， 包括回程遇到到层次根节点的任何后续节点。
       */
      Event.BUBBLING_PHASE = 3;
      cclegacy.Event = Event;
    }
  };
});