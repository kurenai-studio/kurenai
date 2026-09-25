System.register("q-bundled:///fs/cocos/input/types/event/event-keyboard.js", ["./event.js", "../event-enum.js"], function (_export, _context) {
  "use strict";

  var Event, SystemEventType, EventKeyboard;
  _export("EventKeyboard", void 0);
  return {
    setters: [function (_eventJs) {
      Event = _eventJs.Event;
    }, function (_eventEnumJs) {
      SystemEventType = _eventEnumJs.SystemEventType;
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
       * The keyboard event.
       * @zh
       * 键盘事件。
       */
      _export("EventKeyboard", EventKeyboard = class EventKeyboard extends Event {
        /**
         * @en Indicates whether the current key is being pressed
         * @zh 表示当前按键是否正在被按下
         */
        get isPressed() {
          return this._isPressed;
        }

        /**
         * @param keyCode - The key code of the current key or the DOM KeyboardEvent
         * @param isPressed - Indicates whether the current key is being pressed, this is the DEPRECATED parameter.
         * @param bubbles - Indicates whether the event bubbles up through the hierarchy or not.
         */

        /**
         * @param keyCode - The key code of the current key or the DOM KeyboardEvent
         * @param eventType - The type of the event
         * @param bubbles - Indicates whether the event bubbles up through the hierarchy or not.
         */

        constructor(keyCode, eventType, bubbles) {
          if (typeof eventType === 'boolean') {
            const isPressed = eventType;
            eventType = isPressed ? SystemEventType.KEY_DOWN : SystemEventType.KEY_UP;
          }
          super(eventType, bubbles);
          /**
           * @en The unique ID of window which triggered the event.
           * @zh 触发键盘事件的窗口 ID
           */
          /**
           * @en The KeyCode enum value of current keyboard event.
           * @zh 当前键盘事件的 KeyCode 枚举值
           */
          /**
           * @en Raw DOM KeyboardEvent.
           * @zh 原始 DOM KeyboardEvent 事件对象
           *
           * @deprecated since v3.3, can't access rawEvent anymore
           */
          this.rawEvent = void 0;
          this._isPressed = eventType !== SystemEventType.KEY_UP;
          if (typeof keyCode === 'number') {
            this.keyCode = keyCode;
          } else {
            this.keyCode = keyCode.keyCode;
            this.rawEvent = keyCode;
          }
          this.windowId = 0;
        }
      }); // TODO: this is an injected property, should be deprecated
      // issue: https://github.com/cocos/cocos-engine/issues/14643
      Event.EventKeyboard = EventKeyboard;
    }
  };
});