System.register("q-bundled:///fs/cocos/input/system-event.js", ["../core/index.js", "./types/index.js", "./input.js", "./types/event-enum.js"], function (_export, _context) {
  "use strict";

  var EventTarget, cclegacy, SystemEventType, input, InputEventType, SystemEvent, systemEvent;
  _export("SystemEvent", void 0);
  return {
    setters: [function (_coreIndexJs) {
      EventTarget = _coreIndexJs.EventTarget;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_typesIndexJs) {
      SystemEventType = _typesIndexJs.SystemEventType;
    }, function (_inputJs) {
      input = _inputJs.input;
    }, function (_typesEventEnumJs) {
      InputEventType = _typesEventEnumJs.InputEventType;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
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
       * The System event, it currently supports keyboard events and accelerometer events.<br/>
       * You can get the `SystemEvent` instance with `systemEvent`.<br/>
       * @zh
       * 系统事件，它目前支持按键事件和重力感应事件。<br/>
       * 你可以通过 `systemEvent` 获取到 `SystemEvent` 的实例。<br/>
       *
       * @deprecated since v3.4.0, please use Input class instead.
       *
       * @example
       * ```
       * import { systemEvent, SystemEvent } from 'cc';
       * systemEvent.on(SystemEvent.EventType.DEVICEMOTION, this.onDeviceMotionEvent, this);
       * systemEvent.off(SystemEvent.EventType.DEVICEMOTION, this.onDeviceMotionEvent, this);
       * ```
       */
      _export("SystemEvent", SystemEvent = class SystemEvent extends EventTarget {
        constructor() {
          super();
          input.on(InputEventType.MOUSE_DOWN, e => {
            this.emit(SystemEventType.MOUSE_DOWN, e);
          });
          input.on(InputEventType.MOUSE_MOVE, e => {
            this.emit(SystemEventType.MOUSE_MOVE, e);
          });
          input.on(InputEventType.MOUSE_UP, e => {
            this.emit(SystemEventType.MOUSE_UP, e);
          });
          input.on(InputEventType.MOUSE_WHEEL, e => {
            this.emit(SystemEventType.MOUSE_WHEEL, e);
          });
          input.on(InputEventType.TOUCH_START, e => {
            this.emit(SystemEventType.TOUCH_START, e.touch, e);
          });
          input.on(InputEventType.TOUCH_MOVE, e => {
            this.emit(SystemEventType.TOUCH_MOVE, e.touch, e);
          });
          input.on(InputEventType.TOUCH_END, e => {
            this.emit(SystemEventType.TOUCH_END, e.touch, e);
          });
          input.on(InputEventType.TOUCH_CANCEL, e => {
            this.emit(SystemEventType.TOUCH_CANCEL, e.touch, e);
          });
          input.on(InputEventType.KEY_DOWN, e => {
            this.emit(SystemEventType.KEY_DOWN, e);
          });
          input.on(InputEventType.KEY_PRESSING, e => {
            this.emit(SystemEventType.KEY_DOWN, e);
          });
          input.on(InputEventType.KEY_UP, e => {
            this.emit(SystemEventType.KEY_UP, e);
          });
          input.on(InputEventType.DEVICEMOTION, e => {
            this.emit(SystemEventType.DEVICEMOTION, e);
          });
        }
        /**
         * @en
         * Sets whether to enable the accelerometer event listener or not.
         *
         * @zh
         * 是否启用加速度计事件。
         */
        setAccelerometerEnabled(isEnabled) {
          input.setAccelerometerEnabled(isEnabled);
        }

        /**
         * @en
         * Sets the accelerometer interval value.
         *
         * @zh
         * 设置加速度计间隔值。
         */
        setAccelerometerInterval(interval) {
          input.setAccelerometerInterval(interval);
        }

        /**
         * @en
         * Register an callback of a specific system event type.
         * @zh
         * 注册特定事件类型回调。
         *
         * @param type - The event type
         * @param callback - The event listener's callback
         * @param target - The event listener's target and callee
         * @param once - Register the event listener once
         */
        on(type, callback, target, once) {
          super.on(type, callback, target, once);
          return callback;
        }

        /**
         * @en
         * Removes the listeners previously registered with the same type, callback, target and or useCapture,
         * if only type is passed as parameter, all listeners registered with that type will be removed.
         * @zh
         * 删除之前用同类型，回调，目标或 useCapture 注册的事件监听器，如果只传递 type，将会删除 type 类型的所有事件监听器。
         *
         * @param type - A string representing the event type being removed.
         * @param callback - The callback to remove.
         * @param target - The target (this object) to invoke the callback, if it's not given, only callback without target will be removed
         */
        off(type, callback, target) {
          super.off(type, callback, target);
        }
      });
      SystemEvent.EventType = SystemEventType;
      cclegacy.SystemEvent = SystemEvent;
      /**
       * @module cc
       */

      /**
       * @en The singleton of the SystemEvent, there should only be one instance to be used globally
       * @zh 系统事件单例，方便全局使用。
       *
       * @deprecated since v3.4.0, please use input instead.
       */
      _export("systemEvent", systemEvent = new SystemEvent());
      cclegacy.systemEvent = systemEvent;
    }
  };
});