System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/trigger-condition.js", ["../../parametric.js", "../../../../core/index.js", "../../../define.js", "../../create-eval.js"], function (_export, _context) {
  "use strict";

  var validateVariableExistence, validateVariableTypeTriggerLike, _decorator, CLASS_NAME_PREFIX_ANIM, createEval, TriggerConditionEval, _dec, _class, _class2, _descriptor, ccclass, serializable, TriggerCondition;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_parametricJs) {
      validateVariableExistence = _parametricJs.validateVariableExistence;
      validateVariableTypeTriggerLike = _parametricJs.validateVariableTypeTriggerLike;
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
      _export("TriggerCondition", TriggerCondition = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}TriggerCondition`), _dec(_class = (_class2 = class TriggerCondition {
        constructor() {
          _initializerDefineProperty(this, "trigger", _descriptor, this);
        }
        clone() {
          const that = new TriggerCondition();
          that.trigger = this.trigger;
          return that;
        }
        [createEval](context) {
          const evaluation = new TriggerConditionEval(false);
          const triggerInstance = context.getVar(this.trigger);
          if (validateVariableExistence(triggerInstance, this.trigger)) {
            validateVariableTypeTriggerLike(triggerInstance.type, this.trigger);
            evaluation.setTrigger(triggerInstance.bind(evaluation.setTrigger, evaluation));
          }
          return evaluation;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "trigger", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class));
      TriggerConditionEval = class TriggerConditionEval {
        constructor(triggered) {
          this._triggered = false;
          this._triggered = triggered;
        }
        setTrigger(trigger) {
          this._triggered = trigger;
        }
        eval() {
          return this._triggered;
        }
      };
    }
  };
});