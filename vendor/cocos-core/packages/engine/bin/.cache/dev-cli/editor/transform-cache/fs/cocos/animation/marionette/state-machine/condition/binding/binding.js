System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/binding/binding.js", [], function (_export, _context) {
  "use strict";

  var TCBinding, TCBindingValueType;
  _export("TCBinding", void 0);
  return {
    setters: [],
    execute: function () {
      /**
       * @zh
       * 描述过渡条件中，某个绑定提供的值的类型。
       * @en
       * Describes the type of value providing by a transition condition binding.
       */
      _export("TCBindingValueType", TCBindingValueType = /*#__PURE__*/function (TCBindingValueType) {
        TCBindingValueType[TCBindingValueType["FLOAT"] = 0] = "FLOAT";
        /* VariableType.FLOAT */
        TCBindingValueType[TCBindingValueType["INTEGER"] = 3] = "INTEGER";
        /* VariableType.INTEGER */
        return TCBindingValueType;
      }({}));
      /**
       * @zh 描述过渡条件中的值绑定，例如，二元条件的左操作数上的绑定。
       * 前缀 “TC” 是 “Transition Condition” 的缩写。
       *
       * @en Describes a value binding in transition condition,
       * for example, the binding on binary condition's left hand operand.
       * The prefix "TC" is abbr of `Transition Condition`.
       */
      _export("TCBinding", TCBinding = class TCBinding {});
      /**
       * @zh 过渡条件中的值绑定的求值。
       * @en The evaluation of a float binding in transition condition.
       */
    }
  };
});