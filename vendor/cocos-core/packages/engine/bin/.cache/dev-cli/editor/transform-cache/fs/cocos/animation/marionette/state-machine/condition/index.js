System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/condition/index.js", ["./unary-condition.js", "./binary-condition.js", "./trigger-condition.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_unaryConditionJs) {
      _export("UnaryCondition", _unaryConditionJs.UnaryCondition);
    }, function (_binaryConditionJs) {
      _export("BinaryCondition", _binaryConditionJs.BinaryCondition);
    }, function (_triggerConditionJs) {
      _export("TriggerCondition", _triggerConditionJs.TriggerCondition);
    }],
    execute: function () {}
  };
});