System.register("q-bundled:///fs/cocos/asset/asset-manager/weak-cache.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var js, WeakCache;
  _export("default", void 0);
  return {
    setters: [function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("default", WeakCache = class WeakCache {
        constructor(map) {
          this._weakMap = {};
          if (typeof window.WeakRef === 'undefined') throw new Error('this platform does not support WeakRef!');
          if (map) {
            for (const key in map) {
              this._weakMap[key] = new WeakRef(map[key]);
            }
          }
        }
        add(key, val) {
          this._weakMap[key] = new WeakRef(val);
          return val;
        }
        has(key) {
          return key in this._weakMap && !!this._weakMap[key].deref();
        }
        get(key) {
          return this._weakMap[key] && this._weakMap[key].deref();
        }
        remove(key) {
          const out = this._weakMap[key];
          delete this._weakMap[key];
          return out && out.deref();
        }
        clear() {
          this._weakMap = js.createMap(true);
        }
        forEach(func) {
          for (const key in this._weakMap) {
            const val = this.get(key);
            if (val) {
              func(val, key);
            }
          }
        }
        find(predicate) {
          for (const key in this._weakMap) {
            const val = this.get(key);
            if (val && predicate(val, key)) {
              return this._weakMap[key].deref();
            }
          }
          return null;
        }
        get count() {
          return Object.values(this._weakMap).filter(weakRef => weakRef.deref()).length;
        }
        destroy() {
          this._weakMap = {};
        }
      });
    }
  };
});