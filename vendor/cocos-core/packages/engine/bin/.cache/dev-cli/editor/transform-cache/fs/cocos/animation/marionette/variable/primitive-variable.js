System.register("q-bundled:///fs/cocos/animation/marionette/variable/primitive-variable.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../../../core/data/decorators/index.js", "./basic.js"], function (_export, _context) {
  "use strict";

  var DEBUG, assertIsTrue, ccclass, serializable, VariableType, createInstanceTag, VarInstanceBase, VarInstancePrimitive, _dec, _class, _class2, _descriptor, _descriptor2, PlainVariable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export("VarInstancePrimitive", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_basicJs) {
      VariableType = _basicJs.VariableType;
      createInstanceTag = _basicJs.createInstanceTag;
      VarInstanceBase = _basicJs.VarInstanceBase;
    }],
    execute: function () {
      _export("PlainVariable", PlainVariable = (_dec = ccclass('cc.animation.PlainVariable'), _dec(_class = (_class2 = class PlainVariable {
        constructor(type) {
          // TODO: we should not specify type here but due to de-serialization limitation
          // See: https://github.com/cocos-creator/3d-tasks/issues/7909
          _initializerDefineProperty(this, "_type", _descriptor, this);
          // Same as `_type`
          _initializerDefineProperty(this, "_value", _descriptor2, this);
          if (typeof type === 'undefined') {
            return;
          }
          this._type = type;
          switch (type) {
            default:
              break;
            case VariableType.FLOAT:
              this._value = 0.0;
              break;
            case VariableType.INTEGER:
              this._value = 0;
              break;
            case VariableType.BOOLEAN:
              this._value = false;
              break;
          }
        }
        get type() {
          return this._type;
        }
        get value() {
          return this._value;
        }
        set value(value) {
          if (DEBUG) {
            switch (this._type) {
              default:
                break;
              case VariableType.FLOAT:
                assertIsTrue(typeof value === 'number');
                break;
              case VariableType.INTEGER:
                assertIsTrue(Number.isInteger(value));
                break;
              case VariableType.BOOLEAN:
                assertIsTrue(typeof value === 'boolean');
                break;
            }
          }
          this._value = value;
        }
        [createInstanceTag]() {
          return new VarInstancePrimitive(this._type, this._value);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_type", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return VariableType.FLOAT;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _class2)) || _class));
      _export("VarInstancePrimitive", VarInstancePrimitive = class VarInstancePrimitive extends VarInstanceBase {
        constructor(type, value) {
          super(type);
          this._value = void 0;
          this._value = value;
        }
        getValue() {
          return this._value;
        }
        setValue(value) {
          this._value = value;
        }
      });
    }
  };
});