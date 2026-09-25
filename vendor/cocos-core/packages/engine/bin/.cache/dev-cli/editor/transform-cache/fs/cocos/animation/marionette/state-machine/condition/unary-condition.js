System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/unary-condition.js", ["../../parametric.js", "../../../../core/index.js", "../../../define.js", "../../create-eval.js"], function (_export, _context) {
  "use strict";

  var VariableType, BindableBoolean, bindOr, _decorator, CLASS_NAME_PREFIX_ANIM, createEval, UnaryConditionEval, _dec, _class, _class2, _descriptor, _descriptor2, _UnaryCondition, ccclass, serializable, UnaryOperator, UnaryCondition;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_parametricJs) {
      VariableType = _parametricJs.VariableType;
      BindableBoolean = _parametricJs.BindableBoolean;
      bindOr = _parametricJs.bindOr;
    }, function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
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
      ({
        ccclass,
        serializable
      } = _decorator);
      UnaryOperator = /*#__PURE__*/function (UnaryOperator) {
        UnaryOperator[UnaryOperator["TRUTHY"] = 0] = "TRUTHY";
        UnaryOperator[UnaryOperator["FALSY"] = 1] = "FALSY";
        return UnaryOperator;
      }(UnaryOperator || {});
      _export("UnaryCondition", UnaryCondition = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}UnaryCondition`), _dec(_class = (_class2 = (_UnaryCondition = class UnaryCondition {
        constructor() {
          _initializerDefineProperty(this, "operator", _descriptor, this);
          _initializerDefineProperty(this, "operand", _descriptor2, this);
        }
        clone() {
          const that = new UnaryCondition();
          that.operator = this.operator;
          that.operand = this.operand.clone();
          return that;
        }
        [createEval](context) {
          const {
            operator,
            operand
          } = this;
          const evaluation = new UnaryConditionEval(operator, false);
          const value = bindOr(context, operand, VariableType.BOOLEAN, evaluation.setOperand, evaluation);
          evaluation.reset(value);
          return evaluation;
        }
      }, _UnaryCondition.Operator = UnaryOperator, _UnaryCondition), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "operator", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return UnaryOperator.TRUTHY;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "operand", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new BindableBoolean();
        }
      }), _class2)) || _class));
      UnaryConditionEval = class UnaryConditionEval {
        constructor(operator, operand) {
          this._operator = operator;
          this._operand = operand;
          this._eval();
        }
        reset(value) {
          this.setOperand(value);
        }
        setOperand(value) {
          this._operand = value;
          this._eval();
        }

        /**
         * Evaluates this condition.
         */
        eval() {
          return this._result;
        }
        _eval() {
          const {
            _operand: operand
          } = this;
          switch (this._operator) {
            default:
            case UnaryOperator.TRUTHY:
              this._result = !!operand;
              break;
            case UnaryOperator.FALSY:
              this._result = !operand;
              break;
          }
        }
      };
    }
  };
});