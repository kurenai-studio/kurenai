System.register("q-bundled:///fs/cocos/animation/marionette/parametric.js", ["../../core/index.js", "../define.js", "./errors.js", "./variable/index.js"], function (_export, _context) {
  "use strict";

  var _decorator, CLASS_NAME_PREFIX_ANIM, VariableNotDefinedError, VariableTypeMismatchedError, VariableType, _dec, _class, _class2, _descriptor, _descriptor2, _dec2, _class3, _class4, _descriptor3, _descriptor4, ccclass, serializable, BindableNumber, BindableBoolean;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function bindOr(context, bindable, type, callback, thisArg, ...args) {
    const {
      variable,
      value
    } = bindable;
    if (!variable) {
      return value;
    }
    const varInstance = context.getVar(variable);
    if (!validateVariableExistence(varInstance, variable)) {
      return value;
    }
    if (varInstance.type !== type) {
      throw new VariableTypeMismatchedError(variable, 'number');
    }
    const initialValue = varInstance.bind(callback, thisArg, ...args);
    return initialValue;
  }
  function bindNumericOr(context, bindable, type, callback, thisArg, ...args) {
    const {
      variable,
      value
    } = bindable;
    if (!variable) {
      return value;
    }
    const varInstance = context.getVar(variable);
    if (!validateVariableExistence(varInstance, variable)) {
      return value;
    }
    if (type !== VariableType.FLOAT && type !== VariableType.INTEGER) {
      throw new VariableTypeMismatchedError(variable, 'number or integer');
    }
    const initialValue = varInstance.bind(callback, thisArg, ...args);
    return initialValue;
  }
  function validateVariableExistence(varInstance, name) {
    if (!varInstance) {
      // TODO, warn only?
      throw new VariableNotDefinedError(name);
    } else {
      return true;
    }
  }
  function validateVariableType(type, expected, name) {
    if (type !== expected) {
      throw new VariableTypeMismatchedError(name, 'number');
    }
  }
  function validateVariableTypeNumeric(type, name) {
    if (type !== VariableType.FLOAT && type !== VariableType.INTEGER) {
      throw new VariableTypeMismatchedError(name, 'number or integer');
    }
  }
  function validateVariableTypeTriggerLike(type, name) {
    if (type !== VariableType.TRIGGER) {
      throw new VariableTypeMismatchedError(name, 'trigger');
    }
  }
  _export({
    bindOr: bindOr,
    bindNumericOr: bindNumericOr,
    validateVariableExistence: validateVariableExistence,
    validateVariableType: validateVariableType,
    validateVariableTypeNumeric: validateVariableTypeNumeric,
    validateVariableTypeTriggerLike: validateVariableTypeTriggerLike
  });
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_errorsJs) {
      VariableNotDefinedError = _errorsJs.VariableNotDefinedError;
      VariableTypeMismatchedError = _errorsJs.VariableTypeMismatchedError;
    }, function (_variableIndexJs) {
      VariableType = _variableIndexJs.VariableType;
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
      _export("VariableType", VariableType);
      ({
        ccclass,
        serializable
      } = _decorator);
      _export("BindableNumber", BindableNumber = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}BindableNumber`), _dec(_class = (_class2 = class BindableNumber {
        constructor(value = 0.0) {
          _initializerDefineProperty(this, "variable", _descriptor, this);
          _initializerDefineProperty(this, "value", _descriptor2, this);
          this.value = value;
        }
        clone() {
          const that = new BindableNumber();
          that.value = this.value;
          that.variable = this.variable;
          return that;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "variable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _class2)) || _class));
      _export("BindableBoolean", BindableBoolean = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}BindableBoolean`), _dec2(_class3 = (_class4 = class BindableBoolean {
        constructor(value = false) {
          _initializerDefineProperty(this, "variable", _descriptor3, this);
          _initializerDefineProperty(this, "value", _descriptor4, this);
          this.value = value;
        }
        clone() {
          const that = new BindableBoolean();
          that.value = this.value;
          that.variable = this.variable;
          return that;
        }
      }, _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "variable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class4)) || _class3));
    }
  };
});