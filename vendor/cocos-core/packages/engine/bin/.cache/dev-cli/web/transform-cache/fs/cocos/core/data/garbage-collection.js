System.register("q-bundled:///fs/cocos/core/data/garbage-collection.js", ["../../../../virtual/internal%253Aconstants.js"], function (_export, _context) {
  "use strict";

  var EDITOR, GarbageCollectionManager, targetSymbol, garbageCollectionManager;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
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
      targetSymbol = Symbol('[[target]]');
      GarbageCollectionManager = class GarbageCollectionManager {
        constructor() {
          this._finalizationRegistry = EDITOR && typeof FinalizationRegistry !== 'undefined' ? new FinalizationRegistry(this.finalizationRegistryCallback.bind(this)) : null;
          this._gcObjects = new WeakMap();
        }
        registerGCObject(gcObject) {
          if (EDITOR && this._finalizationRegistry) {
            const token = {};
            const proxy = new Proxy(gcObject, {
              get(target, property, receiver) {
                if (property === targetSymbol) {
                  return target;
                }
                let val = Reflect.get(target, property);
                if (typeof val === 'function' && property !== 'constructor') {
                  const original = val;
                  // NOTE: fix error - 'this' implicitly has type 'any' because it does not have a type annotation.
                  val = function newFunc() {
                    return original.apply(this[targetSymbol], arguments);
                  };
                }
                return val;
              },
              set(target, prop, value, receiver) {
                target[prop] = value;
                return true;
              }
            });
            this._gcObjects.set(token, gcObject);
            this._finalizationRegistry.register(proxy, token, token);
            return proxy;
          } else {
            return gcObject;
          }
        }
        init() {}
        finalizationRegistryCallback(token) {
          if (!EDITOR) return;
          const gcObject = this._gcObjects.get(token);
          if (gcObject) {
            this._gcObjects.delete(token);
            gcObject.destroy();
          }
          this._finalizationRegistry.unregister(token);
        }
        destroy() {}
      };
      /**
       * @engineInternal
       */
      _export("garbageCollectionManager", garbageCollectionManager = new GarbageCollectionManager());
    }
  };
});