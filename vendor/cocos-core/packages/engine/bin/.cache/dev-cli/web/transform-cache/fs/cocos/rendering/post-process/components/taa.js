System.register("q-bundled:///fs/cocos/rendering/post-process/components/taa.js", ["../../../core/data/class-decorator.js", "../../../core/data/decorators/index.js", "./post-process-setting.js"], function (_export, _context) {
  "use strict";

  var property, serializable, ccclass, disallowMultiple, executeInEditMode, help, menu, range, slide, tooltip, PostProcessSetting, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, TAA;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataClassDecoratorJs) {
      property = _coreDataClassDecoratorJs.property;
      serializable = _coreDataClassDecoratorJs.serializable;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      slide = _coreDataDecoratorsIndexJs.slide;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }],
    execute: function () {
      _export("TAA", TAA = (_dec = ccclass('cc.TAA'), _dec2 = help('cc.TAA'), _dec3 = menu('PostProcess/TAA'), _dec4 = tooltip('i18n:taa.sampleScale'), _dec5 = range([0.01, 5, 0.01]), _dec6 = tooltip('i18n:taa.feedback'), _dec7 = range([0.0, 1, 0.01]), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class TAA extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_sampleScale", _descriptor, this);
          _initializerDefineProperty(this, "_feedback", _descriptor2, this);
        }
        get sampleScale() {
          return this._sampleScale;
        }
        set sampleScale(v) {
          this._sampleScale = v;
        }
        get feedback() {
          return this._feedback;
        }
        set feedback(v) {
          this._feedback = v;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_sampleScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "sampleScale", [_dec4, slide, _dec5, property], Object.getOwnPropertyDescriptor(_class2.prototype, "sampleScale"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_feedback", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.95;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "feedback", [_dec6, slide, _dec7, property], Object.getOwnPropertyDescriptor(_class2.prototype, "feedback"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});