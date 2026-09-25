System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/binding/auxiliary-curve-binding.js", ["../../../../../core/index.js", "../../../../define.js", "./binding.js", "./editor.js"], function (_export, _context) {
  "use strict";

  var _decorator, CLASS_NAME_PREFIX_ANIM, TCBinding, TCBindingValueType, provide, TCAuxiliaryCurveBindingEvaluation, _dec, _dec2, _class, _class2, _descriptor, ccclass, serializable, TCAuxiliaryCurveBinding;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_bindingJs) {
      TCBinding = _bindingJs.TCBinding;
      TCBindingValueType = _bindingJs.TCBindingValueType;
    }, function (_editorJs) {
      provide = _editorJs.provide;
    }],
    execute: function () {
      ({
        ccclass,
        serializable
      } = _decorator);
      /**
       * @zh 一种过渡条件绑定，该绑定用于获取指定辅助曲线的当前值。该类绑定产生浮点值。
       *
       * @en A kind of transition condition binding,
       * which is used to obtain the current value of specified auxiliary curve.
       * This type of binding yields float value.
       */
      _export("TCAuxiliaryCurveBinding", TCAuxiliaryCurveBinding = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}TCAuxiliaryCurveBinding`), _dec2 = provide(TCBindingValueType.FLOAT), _dec(_class = _dec2(_class = (_class2 = class TCAuxiliaryCurveBinding extends TCBinding {
        constructor(...args) {
          super(...args);
          /**
           * @zh
           * 辅助曲线的名称。
           * @en
           * The auxiliary curve's name.
           */
          _initializerDefineProperty(this, "curveName", _descriptor, this);
        }
        getValueType() {
          return TCBindingValueType.FLOAT;
        }
        bind(context) {
          const view = context.getEvaluationTimeAuxiliaryCurveView();
          return new TCAuxiliaryCurveBindingEvaluation(view, this.curveName);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "curveName", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class) || _class));
      TCAuxiliaryCurveBindingEvaluation = class TCAuxiliaryCurveBindingEvaluation {
        constructor(_view, _curveName) {
          this._view = _view;
          this._curveName = _curveName;
        }
        evaluate() {
          return this._view.get(this._curveName);
        }
      };
    }
  };
});