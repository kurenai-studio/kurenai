System.register("q-bundled:///fs/cocos/rendering/post-process/components/fsr.js", ["../../../core/index.js", "../../../core/data/class-decorator.js", "../../../core/data/decorators/index.js", "./post-process-setting.js"], function (_export, _context) {
  "use strict";

  var CCFloat, type, ccclass, disallowMultiple, executeInEditMode, help, menu, range, serializable, slide, tooltip, PostProcessSetting, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, FSR;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
    }, function (_coreDataClassDecoratorJs) {
      type = _coreDataClassDecoratorJs.type;
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
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }],
    execute: function () {
      _export("FSR", FSR = (_dec = ccclass('cc.FSR'), _dec2 = help('cc.FSR'), _dec3 = menu('PostProcess/FSR'), _dec4 = tooltip('i18n:fsr.sharpness'), _dec5 = range([0.0, 1, 0.01]), _dec6 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class FSR extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_sharpness", _descriptor, this);
        }
        get sharpness() {
          return this._sharpness;
        }
        set sharpness(v) {
          this._sharpness = v;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_sharpness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.8;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "sharpness", [_dec4, slide, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "sharpness"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});