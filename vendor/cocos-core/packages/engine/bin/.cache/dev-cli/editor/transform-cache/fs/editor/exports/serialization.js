System.register("q-bundled:///fs/editor/exports/serialization.js", ["../../cocos/serialization/ccon.js", "../../cocos/serialization/compiled/builtin-value-type.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_cocosSerializationCconJs) {
      _export({
        CCON: _cocosSerializationCconJs.CCON,
        encodeCCONBinary: _cocosSerializationCconJs.encodeCCONBinary,
        BufferBuilder: _cocosSerializationCconJs.BufferBuilder,
        decodeCCONBinary: _cocosSerializationCconJs.decodeCCONBinary
      });
    }, function (_cocosSerializationCompiledBuiltinValueTypeJs) {
      _export("serializeBuiltinValueType", _cocosSerializationCompiledBuiltinValueTypeJs.serializeBuiltinValueType);
    }],
    execute: function () {}
  };
});