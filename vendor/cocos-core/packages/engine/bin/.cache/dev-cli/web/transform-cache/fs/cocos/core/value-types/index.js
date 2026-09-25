System.register("q-bundled:///fs/cocos/core/value-types/index.js", ["./bitmask.js", "./enum.js", "./value-type.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_bitmaskJs) {
      _export("BitMask", _bitmaskJs.BitMask);
    }, function (_enumJs) {
      _export({
        Enum: _enumJs.Enum,
        ccenum: _enumJs.ccenum
      });
    }, function (_valueTypeJs) {
      _export("ValueType", _valueTypeJs.ValueType);
    }],
    execute: function () {}
  };
});