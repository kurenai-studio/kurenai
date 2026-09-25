System.register("q-bundled:///fs/cocos/serialization/index.js", ["./deserialize.js", "./instantiate.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_deserializeJs) {
      _export({
        deserialize: _deserializeJs.deserialize,
        Details: _deserializeJs.Details
      });
    }, function (_instantiateJs) {
      _export("instantiate", _instantiateJs.instantiate);
    }],
    execute: function () {}
  };
});