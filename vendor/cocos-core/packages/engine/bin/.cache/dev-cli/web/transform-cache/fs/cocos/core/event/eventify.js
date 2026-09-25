System.register("q-bundled:///fs/cocos/core/event/eventify.js", ["./callbacks-invoker.js", "../utils/js.js"], function (_export, _context) {
  "use strict";

  var CallbacksInvoker, createMap;
  /*
   Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
  
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
   * @zh
   * 实现该接口的对象具有处理事件的能力。
   * @en
   * Objects those implement this interface have essentially the capability to process events.
   */

  /**
   * @en Generate a new class from the given base class, after polyfill all functionalities in [[IEventified]] as if it's extended from [[EventTarget]]
   * @zh 生成一个类，该类继承自指定的基类，并以和 [[EventTarget]] 等同的方式实现了 [[IEventified]] 的所有接口。
   * @param base The base class
   * @example
   * ```ts
   * class Base { say() { console.log('Hello!'); } }
   * class MyClass extends Eventify(Base) { }
   * function (o: MyClass) {
   *     o.say(); // Ok: Extend from `Base`
   *     o.emit('sing', 'The ghost'); // Ok: `MyClass` implements IEventified
   * }
   * ```
   */
  function Eventify(base) {
    class Eventified extends base {
      constructor(...args) {
        super(...args);
        /**
         * @dontmangle
         * NOTE: Eventified mixins all properties from CallbacksInvoker.prototype in the following code.
         * After invoking `Eventify` for a class, CallbacksInvoker's constructor will not be called,
         * but its functions may invoke `this._callbackTable` which is declared as `public` in CallbacksInvoker.
         * Marking it as dontmangle is a workaround to avoid the issue that `this._callbackTable` is not defined.
         */
        this._callbackTable = createMap(true);
      }
      once(type, callback, target) {
        return this.on(type, callback, target, true);
      }
      targetOff(typeOrTarget) {
        this.removeAll(typeOrTarget);
      }
    }

    // Mixin with `CallbacksInvokers`'s prototype
    const callbacksInvokerPrototype = CallbacksInvoker.prototype;
    const propertyKeys = Object.getOwnPropertyNames(callbacksInvokerPrototype).concat(Object.getOwnPropertySymbols(callbacksInvokerPrototype));
    for (let iPropertyKey = 0; iPropertyKey < propertyKeys.length; ++iPropertyKey) {
      const propertyKey = propertyKeys[iPropertyKey];
      if (!(propertyKey in Eventified.prototype)) {
        const propertyDescriptor = Object.getOwnPropertyDescriptor(callbacksInvokerPrototype, propertyKey);
        if (propertyDescriptor) {
          Object.defineProperty(Eventified.prototype, propertyKey, propertyDescriptor);
        }
      }
    }
    return Eventified;
  }
  _export("Eventify", Eventify);
  return {
    setters: [function (_callbacksInvokerJs) {
      CallbacksInvoker = _callbacksInvokerJs.CallbacksInvoker;
    }, function (_utilsJsJs) {
      createMap = _utilsJsJs.createMap;
    }],
    execute: function () {}
  };
});