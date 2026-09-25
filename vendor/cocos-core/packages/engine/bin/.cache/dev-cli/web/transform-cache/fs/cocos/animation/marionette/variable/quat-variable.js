System.register("q-bundled:///fs/cocos/animation/marionette/variable/quat-variable.js", ["./basic.js", "../../../core/data/decorators/index.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var VariableType, createInstanceTag, VarInstanceBase, ccclass, serializable, assertIsTrue, Quat, VarInstanceQuat, _dec, _class, _class2, _descriptor, QuatVariable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_basicJs) {
      VariableType = _basicJs.VariableType;
      createInstanceTag = _basicJs.createInstanceTag;
      VarInstanceBase = _basicJs.VarInstanceBase;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      Quat = _coreIndexJs.Quat;
    }],
    execute: function () {
      _export("QuatVariable", QuatVariable = (_dec = ccclass('cc.animation.QuatVariable'), _dec(_class = (_class2 = class QuatVariable {
        constructor() {
          _initializerDefineProperty(this, "_value", _descriptor, this);
        }
        get type() {
          return VariableType.QUAT_experimental;
        }
        get value() {
          return this._value;
        }
        set value(value) {
          Quat.copy(this._value, value);
        }
        [createInstanceTag]() {
          return new VarInstanceQuat(this._value);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Quat();
        }
      }), _class2)) || _class));
      VarInstanceQuat = class VarInstanceQuat extends VarInstanceBase {
        constructor(value) {
          super(VariableType.QUAT_experimental);
          this._value = new Quat();
          Quat.copy(this._value, value);
        }
        getValue() {
          return this._value;
        }
        setValue(value) {
          assertIsTrue(value instanceof Quat);
          Quat.copy(this._value, value);
        }
      };
    }
  };
});