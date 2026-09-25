System.register("q-bundled:///fs/cocos/asset/assets/buffer-asset.js", ["../../core/data/decorators/index.js", "../../core/index.js", "./asset.js"], function (_export, _context) {
  "use strict";

  var ccclass, override, assertIsNonNullable, cclegacy, Asset, _dec, _class, _class2, BufferAsset;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      override = _coreDataDecoratorsIndexJs.override;
    }, function (_coreIndexJs) {
      assertIsNonNullable = _coreIndexJs.assertIsNonNullable;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_assetJs) {
      Asset = _assetJs.Asset;
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
      /**
       * @en
       * `BufferAsset` is a kind of assets whose internal data is a section of memory buffer
       * that you can access through the [[BufferAsset.buffer]] function.
       * @zh
       * `BufferAsset` 是一类资产，其内部数据是一段内存缓冲，你可以通过 [[BufferAsset.buffer]] 函数获取其内部数据。
       */
      _export("BufferAsset", BufferAsset = (_dec = ccclass('cc.BufferAsset'), _dec(_class = (_class2 = class BufferAsset extends Asset {
        constructor(name) {
          super(name);
          this._buffer = null;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _nativeAsset() {
          return this._buffer;
        }
        set _nativeAsset(bin) {
          if (bin instanceof ArrayBuffer) {
            this._buffer = bin;
          } else {
            this._buffer = bin.buffer;
          }
        }

        /**
         * @zh 获取此资源中的缓冲数据。
         * @en Get the ArrayBuffer data of this asset.
         * @returns @en The ArrayBuffer. @zh 缓冲数据。
         */
        buffer() {
          assertIsNonNullable(this._buffer);
          return this._buffer;
        }
        validate() {
          return !!this._buffer;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "_nativeAsset", [override], Object.getOwnPropertyDescriptor(_class2.prototype, "_nativeAsset"), _class2.prototype), _class2)) || _class));
      cclegacy.BufferAsset = BufferAsset;
    }
  };
});