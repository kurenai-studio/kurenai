System.register("q-bundled:///fs/cocos/2d/assets/ttf-font.js", ["../../core/data/decorators/index.js", "../../core/index.js", "./font.js"], function (_export, _context) {
  "use strict";

  var ccclass, string, override, serializable, path, cclegacy, Font, _dec, _class, _class2, _descriptor, TTFFont;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      string = _coreDataDecoratorsIndexJs.string;
      override = _coreDataDecoratorsIndexJs.override;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      path = _coreIndexJs.path;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_fontJs) {
      Font = _fontJs.Font;
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
       * @en Class for TTFFont asset.
       * @zh TTF 字体资源类。
       */
      _export("TTFFont", TTFFont = (_dec = ccclass('cc.TTFFont'), _dec(_class = (_class2 = class TTFFont extends Font {
        constructor() {
          super();
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          _initializerDefineProperty(this, "_fontFamily", _descriptor, this);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _nativeAsset() {
          return this._fontFamily;
        }
        set _nativeAsset(value) {
          this._fontFamily = value || 'Arial';
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _nativeDep() {
          return {
            uuid: this._uuid,
            __nativeName__: this._native,
            ext: path.extname(this._native),
            __isNative__: true
          };
        }

        /**
         * @en default init.
         * @zh 默认初始化。
         * @param uuid @en Asset uuid. @zh 资源 uuid。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        initDefault(uuid) {
          this._fontFamily = 'Arial';
          super.initDefault(uuid);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_fontFamily", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "_nativeAsset", [override, string], Object.getOwnPropertyDescriptor(_class2.prototype, "_nativeAsset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_nativeDep", [override], Object.getOwnPropertyDescriptor(_class2.prototype, "_nativeDep"), _class2.prototype), _class2)) || _class));
      cclegacy.TTFFont = TTFFont;
    }
  };
});