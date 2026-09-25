System.register("q-bundled:///fs/cocos/xr/event/xr-event-handle.js", ["../../core/math/index.js", "../../input/types/index.js"], function (_export, _context) {
  "use strict";

  var Vec3, Event, XrUIPressEvent, DeviceType, XrUIPressEventType, XrKeyboardEventType;
  _export("XrUIPressEvent", void 0);
  return {
    setters: [function (_coreMathIndexJs) {
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_inputTypesIndexJs) {
      Event = _inputTypesIndexJs.Event;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com
      
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
      _export("DeviceType", DeviceType = /*#__PURE__*/function (DeviceType) {
        DeviceType[DeviceType["Other"] = 0] = "Other";
        DeviceType[DeviceType["Left"] = 1] = "Left";
        DeviceType[DeviceType["Right"] = 2] = "Right";
        return DeviceType;
      }({}));
      /**
       * @en Xr 3DUI event type
       * @zh xr的3DUI事件类型
       */
      _export("XrUIPressEventType", XrUIPressEventType = /*#__PURE__*/function (XrUIPressEventType) {
        XrUIPressEventType["XRUI_HOVER_ENTERED"] = "xrui-hover-entered";
        XrUIPressEventType["XRUI_HOVER_EXITED"] = "xrui-hover-exited";
        XrUIPressEventType["XRUI_HOVER_STAY"] = "xrui-hover-stay";
        XrUIPressEventType["XRUI_CLICK"] = "xrui-click";
        XrUIPressEventType["XRUI_UNCLICK"] = "xrui-unclick";
        return XrUIPressEventType;
      }({}));
      /**
       * @en Xr Keyboard event type
       * @zh xr的虚拟键盘事件类型
       */
      _export("XrKeyboardEventType", XrKeyboardEventType = /*#__PURE__*/function (XrKeyboardEventType) {
        /**
         * @en
         * The event type for XR keyboard case switching event
         *
         * @zh
         * XR键盘大小写切换事件
         */
        XrKeyboardEventType["XR_CAPS_LOCK"] = "xr-caps-lock";
        /**
         * @en
         * The event type for XR keyboard initialization event
         *
         * @zh
         * XR键盘初始化事件
         */
        XrKeyboardEventType["XR_KEYBOARD_INIT"] = "xr-keyboard-init";
        /**
        * @en
        * The event type for XR keyboard input event
        *
        * @zh
        * XR键盘input事件
        */
        XrKeyboardEventType["XR_KEYBOARD_INPUT"] = "xr-keyboard-input";
        /**
        * @en
        * The event type for XR keyboard to latin
        *
        * @zh
        * 转latin
        */
        XrKeyboardEventType["TO_LATIN"] = "to-latin";
        /**
        * @en
        * The event type for XR keyboard to symbol
        *
        * @zh
        * 转symbol
        */
        XrKeyboardEventType["TO_SYMBOL"] = "to-symbol";
        /**
        * @en
        * The event type for XR keyboard to math_symbol
        *
        * @zh
        * 转math_symbol
        */
        XrKeyboardEventType["TO_MATH_SYMBOL"] = "to-math-symbol";
        return XrKeyboardEventType;
      }({}));
      /**
       * @en Xr 3DUI event.
       *
       * @zh xr的3DUI事件。
       */
      _export("XrUIPressEvent", XrUIPressEvent = class XrUIPressEvent extends Event {
        constructor(...args) {
          super(...args);
          /**
           * @en Event trigger
           * @zh 事件触发者（左右手柄等）
           */
          this.deviceType = DeviceType.Other;
          /**
           * @en Collision detection point
           * @zh 碰撞检测点
           */
          this.hitPoint = new Vec3();
        }
      });
    }
  };
});