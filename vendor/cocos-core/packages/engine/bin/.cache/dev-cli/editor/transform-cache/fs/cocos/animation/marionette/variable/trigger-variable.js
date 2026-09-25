System.register("q-bundled:///fs/cocos/animation/marionette/variable/trigger-variable.js", ["../../../core/index.js", "../../../core/data/decorators/index.js", "./basic.js"], function (_export, _context) {
  "use strict";

  var assertIsTrue, ccclass, serializable, createInstanceTag, VariableType, VarInstanceBase, VarInstanceTrigger, _dec, _class, _class2, _descriptor, TriggerResetMode, TRIGGER_VARIABLE_FLAG_VALUE_START, TRIGGER_VARIABLE_FLAG_VALUE_MASK, TRIGGER_VARIABLE_FLAG_RESET_MODE_START, TRIGGER_VARIABLE_FLAG_RESET_MODE_MASK, TRIGGER_VARIABLE_DEFAULT_FLAGS, TriggerVariable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export("VarInstanceTrigger", void 0);
  return {
    setters: [function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_basicJs) {
      createInstanceTag = _basicJs.createInstanceTag;
      VariableType = _basicJs.VariableType;
      VarInstanceBase = _basicJs.VarInstanceBase;
    }],
    execute: function () {
      /**
       * @en The reset mode of boolean variables. It indicates when to reset the variable as `false`.
       * @zh 布尔类型变量的重置模式，指示在哪些情况下将变量重置为 `false`。
       */
      _export("TriggerResetMode", TriggerResetMode = /*#__PURE__*/function (TriggerResetMode) {
        /**
         * @en The variable is reset when it's consumed by animation transition.
         * @zh 在该变量被动画过渡消耗后自动重置。
         */
        TriggerResetMode[TriggerResetMode["AFTER_CONSUMED"] = 0] = "AFTER_CONSUMED";
        /**
         * @en The variable is reset in next frame or when it's consumed by animation transition.
         * @zh 下一帧自动重置；在该变量被动画过渡消耗后也会自动重置。
         */
        TriggerResetMode[TriggerResetMode["NEXT_FRAME_OR_AFTER_CONSUMED"] = 1] = "NEXT_FRAME_OR_AFTER_CONSUMED";
        return TriggerResetMode;
      }({}));
      TRIGGER_VARIABLE_FLAG_VALUE_START = 0;
      TRIGGER_VARIABLE_FLAG_VALUE_MASK = 1;
      TRIGGER_VARIABLE_FLAG_RESET_MODE_START = 1;
      TRIGGER_VARIABLE_FLAG_RESET_MODE_MASK = 6; // 0b110
      // DO NOT CHANGE TO THIS VALUE. This is related to V3.5 migration.
      TRIGGER_VARIABLE_DEFAULT_FLAGS = 0; // Let's ensure `0`'s meaning: `value: false, resetMode: TriggerSwitchMode: TriggerResetMode.AFTER_CONSUMED`
      assertIsTrue((0 << TRIGGER_VARIABLE_FLAG_VALUE_START | TriggerResetMode.AFTER_CONSUMED << TRIGGER_VARIABLE_FLAG_RESET_MODE_START) === TRIGGER_VARIABLE_DEFAULT_FLAGS);
      _export("TriggerVariable", TriggerVariable = (_dec = ccclass('cc.animation.TriggerVariable'), _dec(_class = (_class2 = class TriggerVariable {
        constructor() {
          // l -> h
          // value(1 bits) | reset_mode(2 bits)
          _initializerDefineProperty(this, "_flags", _descriptor, this);
        }
        get type() {
          return VariableType.TRIGGER;
        }
        get value() {
          return !!((this._flags & TRIGGER_VARIABLE_FLAG_VALUE_MASK) >> TRIGGER_VARIABLE_FLAG_VALUE_START);
        }
        set value(value) {
          if (value) {
            this._flags |= 1 << TRIGGER_VARIABLE_FLAG_VALUE_START;
          } else {
            this._flags &= ~(1 << TRIGGER_VARIABLE_FLAG_VALUE_START);
          }
        }
        get resetMode() {
          return (this._flags & TRIGGER_VARIABLE_FLAG_RESET_MODE_MASK) >> TRIGGER_VARIABLE_FLAG_RESET_MODE_START;
        }
        set resetMode(value) {
          // Clear
          this._flags &= ~TRIGGER_VARIABLE_FLAG_RESET_MODE_MASK;
          // Set
          this._flags |= value << TRIGGER_VARIABLE_FLAG_RESET_MODE_START;
        }
        [createInstanceTag]() {
          return new VarInstanceTrigger(this.value, this.resetMode);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_flags", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TRIGGER_VARIABLE_DEFAULT_FLAGS;
        }
      }), _class2)) || _class));
      _export("VarInstanceTrigger", VarInstanceTrigger = class VarInstanceTrigger extends VarInstanceBase {
        constructor(value, resetMode) {
          super(VariableType.TRIGGER);
          this.resetMode = TriggerResetMode.AFTER_CONSUMED;
          this._value = void 0;
          this.resetMode = resetMode;
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