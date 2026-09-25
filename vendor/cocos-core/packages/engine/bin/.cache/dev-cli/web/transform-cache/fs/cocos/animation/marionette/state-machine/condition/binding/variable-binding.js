System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/binding/variable-binding.js", ["../../../../../core/index.js", "../../../../define.js", "./binding.js", "./editor.js", "../../../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var _decorator, CLASS_NAME_PREFIX_ANIM, TCBinding, TCBindingValueType, provide, editorOnly, TCVariableBindingEvaluation, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, ccclass, serializable, TCVariableBinding;
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
    }, function (_coreDataDecoratorsIndexJs) {
      editorOnly = _coreDataDecoratorsIndexJs.editorOnly;
    }],
    execute: function () {
      ({
        ccclass,
        serializable
      } = _decorator);
      /**
       * @zh 一种过渡条件绑定，该绑定用于获取动画图变量的当前值。该类绑定产生的值类型对应于变量的值类型。
       *
       * @en A kind of transition condition binding,
       * which is used to obtain the current value of a animation graph variable.
       * This type of binding yields the type corresponding to the variable's type.
       */
      _export("TCVariableBinding", TCVariableBinding = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}TCVariableBinding`), _dec2 = provide(TCBindingValueType.FLOAT, TCBindingValueType.INTEGER), _dec(_class = _dec2(_class = (_class2 = class TCVariableBinding extends TCBinding {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "type", _descriptor, this);
          /**
           * @zh
           * 动画图变量的名称。
           * @en
           * The animation graph variable's name.
           */
          _initializerDefineProperty(this, "variableName", _descriptor2, this);
        }
        getValueType() {
          return this.type;
        }
        bind(context) {
          const varInstance = context.getVar(this.variableName);
          if (!varInstance) {
            return undefined;
          }
          return new TCVariableBindingEvaluation(varInstance);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "type", [serializable, editorOnly], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TCBindingValueType.FLOAT;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "variableName", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class) || _class));
      TCVariableBindingEvaluation = class TCVariableBindingEvaluation {
        constructor(_varInstance) {
          this._varInstance = _varInstance;
        }
        evaluate() {
          return this._varInstance.value;
        }
      };
    }
  };
});