System.register("q-bundled:///fs/cocos/rendering/post-process/components/hbao.js", ["../../../core/index.js", "../../../core/data/decorators/index.js", "./post-process-setting.js"], function (_export, _context) {
  "use strict";

  var CCBoolean, CCFloat, CCInteger, ccclass, disallowMultiple, editable, executeInEditMode, help, menu, range, serializable, slide, tooltip, type, visible, PostProcessSetting, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, HBAO;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      CCInteger = _coreIndexJs.CCInteger;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      editable = _coreDataDecoratorsIndexJs.editable;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      slide = _coreDataDecoratorsIndexJs.slide;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("HBAO", HBAO = (_dec = ccclass('cc.HBAO'), _dec2 = help('cc.HBAO'), _dec3 = menu('PostProcess/HBAO'), _dec4 = tooltip('i18n:hbao.radiusScale'), _dec5 = range([0, 10, 0.01]), _dec6 = type(CCFloat), _dec7 = visible(false), _dec8 = tooltip('i18n:hbao.angleBiasDegree'), _dec9 = range([0, 100, 0.1]), _dec0 = type(CCFloat), _dec1 = visible(false), _dec10 = tooltip('i18n:hbao.blurSharpness'), _dec11 = range([0, 10, 1]), _dec12 = type(CCInteger), _dec13 = tooltip('i18n:hbao.aoSaturation'), _dec14 = range([0, 10, 0.01]), _dec15 = type(CCFloat), _dec16 = tooltip('i18n:hbao.needBlur'), _dec17 = type(CCBoolean), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class HBAO extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_radiusScale", _descriptor, this);
          _initializerDefineProperty(this, "_angleBiasDegree", _descriptor2, this);
          _initializerDefineProperty(this, "_blurSharpness", _descriptor3, this);
          _initializerDefineProperty(this, "_aoSaturation", _descriptor4, this);
          _initializerDefineProperty(this, "_needBlur", _descriptor5, this);
        }
        set radiusScale(value) {
          this._radiusScale = value;
        }
        get radiusScale() {
          return this._radiusScale;
        }
        set angleBiasDegree(value) {
          this._angleBiasDegree = value;
        }
        get angleBiasDegree() {
          return this._angleBiasDegree;
        }
        set blurSharpness(value) {
          this._blurSharpness = value;
        }
        get blurSharpness() {
          return this._blurSharpness;
        }
        set aoSaturation(value) {
          this._aoSaturation = value;
        }
        get aoSaturation() {
          return this._aoSaturation;
        }
        set needBlur(value) {
          this._needBlur = value;
        }
        get needBlur() {
          return this._needBlur;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_radiusScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_angleBiasDegree", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_blurSharpness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_aoSaturation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_needBlur", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "radiusScale", [slide, _dec4, _dec5, _dec6, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "radiusScale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angleBiasDegree", [_dec7, slide, _dec8, _dec9, _dec0, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "angleBiasDegree"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "blurSharpness", [_dec1, slide, _dec10, _dec11, _dec12, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "blurSharpness"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "aoSaturation", [slide, _dec13, _dec14, _dec15, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "aoSaturation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "needBlur", [_dec16, _dec17, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "needBlur"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});