System.register("q-bundled:///fs/cocos/rendering/post-process/components/bloom.js", ["../../../core/index.js", "../../../core/data/decorators/index.js", "../../../core/data/utils/attribute.js", "./post-process-setting.js"], function (_export, _context) {
  "use strict";

  var cclegacy, ccclass, disallowMultiple, executeInEditMode, help, menu, range, rangeMin, serializable, slide, tooltip, type, visible, CCBoolean, CCFloat, CCInteger, PostProcessSetting, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, Bloom;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      rangeMin = _coreDataDecoratorsIndexJs.rangeMin;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      slide = _coreDataDecoratorsIndexJs.slide;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_coreDataUtilsAttributeJs) {
      CCBoolean = _coreDataUtilsAttributeJs.CCBoolean;
      CCFloat = _coreDataUtilsAttributeJs.CCFloat;
      CCInteger = _coreDataUtilsAttributeJs.CCInteger;
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }],
    execute: function () {
      _export("Bloom", Bloom = (_dec = ccclass('cc.Bloom'), _dec2 = help('cc.Bloom'), _dec3 = menu('PostProcess/Bloom'), _dec4 = tooltip('i18n:bloom.enableAlphaMask'), _dec5 = type(CCBoolean), _dec6 = tooltip('i18n:bloom.useHdrIlluminance'), _dec7 = visible(() => cclegacy.director.root.pipeline.getMacroBool('CC_USE_FLOAT_OUTPUT')), _dec8 = type(CCBoolean), _dec9 = tooltip('i18n:bloom.threshold'), _dec0 = rangeMin(0), _dec1 = type(CCFloat), _dec10 = tooltip('i18n:bloom.iterations'), _dec11 = range([1, 6, 1]), _dec12 = type(CCInteger), _dec13 = tooltip('i18n:bloom.intensity'), _dec14 = rangeMin(0), _dec15 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class Bloom extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_enableAlphaMask", _descriptor, this);
          _initializerDefineProperty(this, "_useHdrIlluminance", _descriptor2, this);
          _initializerDefineProperty(this, "_threshold", _descriptor3, this);
          _initializerDefineProperty(this, "_iterations", _descriptor4, this);
          _initializerDefineProperty(this, "_intensity", _descriptor5, this);
        }
        set enableAlphaMask(value) {
          this._enableAlphaMask = value;
        }
        get enableAlphaMask() {
          return this._enableAlphaMask;
        }
        set useHdrIlluminance(value) {
          this._useHdrIlluminance = value;
        }
        get useHdrIlluminance() {
          return this._useHdrIlluminance;
        }
        set threshold(value) {
          this._threshold = value;
        }
        get threshold() {
          return this._threshold;
        }
        set iterations(value) {
          this._iterations = value;
        }
        get iterations() {
          return this._iterations;
        }
        set intensity(value) {
          this._intensity = value;
        }
        get intensity() {
          return this._intensity;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enableAlphaMask", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_useHdrIlluminance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_threshold", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.8;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_iterations", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_intensity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2.3;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enableAlphaMask", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "enableAlphaMask"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "useHdrIlluminance", [_dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "useHdrIlluminance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "threshold", [_dec9, _dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "threshold"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "iterations", [_dec10, slide, _dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "iterations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "intensity", [_dec13, _dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "intensity"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});