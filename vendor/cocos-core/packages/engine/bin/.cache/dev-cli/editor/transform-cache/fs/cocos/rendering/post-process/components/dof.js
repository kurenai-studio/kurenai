System.register("q-bundled:///fs/cocos/rendering/post-process/components/dof.js", ["../../../core/data/decorators/index.js", "./post-process-setting.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, disallowMultiple, executeInEditMode, help, menu, range, rangeMin, serializable, slide, type, PostProcessSetting, CCFloat, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _class, _class2, _descriptor, _descriptor2, _descriptor3, DOF;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      rangeMin = _coreDataDecoratorsIndexJs.rangeMin;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      slide = _coreDataDecoratorsIndexJs.slide;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_postProcessSettingJs) {
      PostProcessSetting = _postProcessSettingJs.PostProcessSetting;
    }, function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
    }],
    execute: function () {
      _export("DOF", DOF = (_dec = ccclass('cc.DOF'), _dec2 = help('cc.DOF'), _dec3 = menu('PostProcess/DOF'), _dec4 = rangeMin(0), _dec5 = type(CCFloat), _dec6 = rangeMin(0), _dec7 = type(CCFloat), _dec8 = range([1, 10, 0.01]), _dec9 = rangeMin(1.0), _dec0 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class DOF extends PostProcessSetting {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_focusDistance", _descriptor, this);
          _initializerDefineProperty(this, "_focusRange", _descriptor2, this);
          _initializerDefineProperty(this, "_bokehRadius", _descriptor3, this);
        }
        set focusDistance(value) {
          this._focusDistance = value;
        }
        get focusDistance() {
          return this._focusDistance;
        }
        set focusRange(value) {
          this._focusRange = value;
        }
        get focusRange() {
          return this._focusRange;
        }
        set bokehRadius(value) {
          this._bokehRadius = value;
        }
        get bokehRadius() {
          return this._bokehRadius;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_focusDistance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_focusRange", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_bokehRadius", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "focusDistance", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "focusDistance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "focusRange", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "focusRange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bokehRadius", [slide, _dec8, _dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "bokehRadius"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});