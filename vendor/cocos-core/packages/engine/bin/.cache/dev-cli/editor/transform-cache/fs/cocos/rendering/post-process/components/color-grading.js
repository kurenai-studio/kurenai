System.register("q-bundled:///fs/cocos/rendering/post-process/components/color-grading.js", ["../../../asset/assets/index.js", "../../../core/index.js", "../../../core/data/decorators/index.js", "./post-process-setting.js"], function (_export, _context) {
  "use strict";

  var Texture2D, CCFloat, ccclass, disallowMultiple, executeInEditMode, help, menu, range, serializable, slide, tooltip, type, PostProcessSetting, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, ColorGrading;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_assetAssetsIndexJs) {
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      slide = _coreDataDecoratorsIndexJs.slide;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }],
    execute: function () {
      _export("ColorGrading", ColorGrading = (_dec = ccclass('cc.ColorGrading'), _dec2 = help('cc.ColorGrading'), _dec3 = menu('PostProcess/ColorGrading'), _dec4 = tooltip('i18n:color_grading.contribute'), _dec5 = range([0, 1, 0.01]), _dec6 = type(CCFloat), _dec7 = tooltip('i18n:color_grading.originalMap'), _dec8 = type(Texture2D), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class ColorGrading extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_contribute", _descriptor, this);
          _initializerDefineProperty(this, "_colorGradingMap", _descriptor2, this);
        }
        set contribute(value) {
          this._contribute = value;
        }
        get contribute() {
          return this._contribute;
        }
        set colorGradingMap(val) {
          this._colorGradingMap = val;
        }
        get colorGradingMap() {
          return this._colorGradingMap;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_contribute", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_colorGradingMap", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "contribute", [_dec4, slide, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "contribute"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "colorGradingMap", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "colorGradingMap"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});