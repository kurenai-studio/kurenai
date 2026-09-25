System.register("q-bundled:///fs/cocos/animation/marionette/variable/vec3-variable.js", ["../../../core/index.js", "../../../core/data/decorators/index.js", "./basic.js"], function (_export, _context) {
  "use strict";

  var assertIsTrue, Vec3, ccclass, serializable, VariableType, createInstanceTag, VarInstanceBase, VarInstanceVec3, _dec, _class, _class2, _descriptor, Vec3Variable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_basicJs) {
      VariableType = _basicJs.VariableType;
      createInstanceTag = _basicJs.createInstanceTag;
      VarInstanceBase = _basicJs.VarInstanceBase;
    }],
    execute: function () {
      _export("Vec3Variable", Vec3Variable = (_dec = ccclass('cc.animation.Vec3Variable'), _dec(_class = (_class2 = class Vec3Variable {
        constructor() {
          _initializerDefineProperty(this, "_value", _descriptor, this);
        }
        get type() {
          return VariableType.VEC3_experimental;
        }
        get value() {
          return this._value;
        }
        set value(value) {
          Vec3.copy(this._value, value);
        }
        [createInstanceTag]() {
          return new VarInstanceVec3(this.value);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _class2)) || _class));
      VarInstanceVec3 = class VarInstanceVec3 extends VarInstanceBase {
        constructor(value) {
          super(VariableType.VEC3_experimental);
          this._value = new Vec3();
          Vec3.copy(this._value, value);
        }
        getValue() {
          return this._value;
        }
        setValue(value) {
          assertIsTrue(value instanceof Vec3);
          Vec3.copy(this._value, value);
        }
      };
    }
  };
});