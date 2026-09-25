System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/binary-condition.js", ["../../../../core/index.js", "../../../define.js", "../../create-eval.js", "../../../../serialization/index.js", "./binding/variable-binding.js", "./binding/runtime.js"], function (_export, _context) {
  "use strict";

  var _decorator, CLASS_NAME_PREFIX_ANIM, createEval, instantiate, TCVariableBinding, BinaryConditionEval, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _BinaryCondition, ccclass, serializable, BinaryOperator, BinaryCondition;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_serializationIndexJs) {
      instantiate = _serializationIndexJs.instantiate;
    }, function (_bindingVariableBindingJs) {
      TCVariableBinding = _bindingVariableBindingJs.TCVariableBinding;
    }, function (_bindingRuntimeJs) {}],
    execute: function () {
      ({
        ccclass,
        serializable
      } = _decorator);
      /**
       * @zh 二元条件操作符。
       * @en Operator used in binary condition.
       */
      BinaryOperator = /*#__PURE__*/function (BinaryOperator) {
        BinaryOperator[BinaryOperator["EQUAL_TO"] = 0] = "EQUAL_TO";
        BinaryOperator[BinaryOperator["NOT_EQUAL_TO"] = 1] = "NOT_EQUAL_TO";
        BinaryOperator[BinaryOperator["LESS_THAN"] = 2] = "LESS_THAN";
        BinaryOperator[BinaryOperator["LESS_THAN_OR_EQUAL_TO"] = 3] = "LESS_THAN_OR_EQUAL_TO";
        BinaryOperator[BinaryOperator["GREATER_THAN"] = 4] = "GREATER_THAN";
        BinaryOperator[BinaryOperator["GREATER_THAN_OR_EQUAL_TO"] = 5] = "GREATER_THAN_OR_EQUAL_TO";
        return BinaryOperator;
      }(BinaryOperator || {});
      /**
       * @zh 描述一个二元条件，它有两个数值类型的操作数。
       * @en Describes a binary condition, there are two operands with numeric type.
       */
      _export("BinaryCondition", BinaryCondition = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}BinaryCondition`), _dec(_class = (_class2 = (_BinaryCondition = class BinaryCondition {
        constructor() {
          /**
           * @zh
           * 运算符。
           * @en
           * Operator.
           */
          _initializerDefineProperty(this, "operator", _descriptor, this);
          /**
           * @zh
           * 左操作数的值。
           * @en
           * Left operand value.
           */
          _initializerDefineProperty(this, "lhs", _descriptor2, this);
          /**
           * @zh
           * 左操作数上的绑定。
           * @en
           * Left operand binding.
           */
          _initializerDefineProperty(this, "lhsBinding", _descriptor3, this);
          /**
           * @zh
           * 右操作数的值。
           * @en
           * Right operand value.
           */
          _initializerDefineProperty(this, "rhs", _descriptor4, this);
        }
        clone() {
          const that = new BinaryCondition();
          that.operator = this.operator;
          that.lhs = this.lhs;
          that.lhsBinding = instantiate(this.lhsBinding);
          that.rhs = this.rhs;
          return that;
        }
        [createEval](context) {
          var _this$lhsBinding;
          const lhsBindingEvaluation = (_this$lhsBinding = this.lhsBinding) == null ? void 0 : _this$lhsBinding.bind(context);
          const binaryConditionEval = new BinaryConditionEval(this.operator, this.lhs, this.rhs, lhsBindingEvaluation);
          return binaryConditionEval;
        }
      }, _BinaryCondition.Operator = BinaryOperator, _BinaryCondition), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "operator", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BinaryOperator.EQUAL_TO;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "lhs", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "lhsBinding", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new TCVariableBinding();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "rhs", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _class2)) || _class));
      BinaryConditionEval = class BinaryConditionEval {
        constructor(_operator, lhsValue, rhsValue, _lhsBindingEvaluation) {
          this._operator = _operator;
          this._lhsBindingEvaluation = _lhsBindingEvaluation;
          this._lhsValue = lhsValue;
          this._rhsValue = rhsValue;
        }

        /**
         * Evaluates this condition.
         */
        eval(context) {
          var _this$_lhsBindingEval, _this$_lhsBindingEval2;
          const lhsValue = (_this$_lhsBindingEval = (_this$_lhsBindingEval2 = this._lhsBindingEvaluation) == null ? void 0 : _this$_lhsBindingEval2.evaluate(context)) != null ? _this$_lhsBindingEval : this._lhsValue;
          const rhsValue = this._rhsValue;
          switch (this._operator) {
            default:
            case BinaryOperator.EQUAL_TO:
              return lhsValue === rhsValue;
            case BinaryOperator.NOT_EQUAL_TO:
              return lhsValue !== rhsValue;
            case BinaryOperator.LESS_THAN:
              return lhsValue < rhsValue;
            case BinaryOperator.LESS_THAN_OR_EQUAL_TO:
              return lhsValue <= rhsValue;
            case BinaryOperator.GREATER_THAN:
              return lhsValue > rhsValue;
            case BinaryOperator.GREATER_THAN_OR_EQUAL_TO:
              return lhsValue >= rhsValue;
          }
        }
      };
    }
  };
});