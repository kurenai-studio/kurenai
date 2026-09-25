System.register("q-bundled:///fs/cocos/primitive/cone.js", ["./cylinder.js"], function (_export, _context) {
  "use strict";

  var cylinder;
  function cone(radius = 0.5, height = 1, opts = {}) /* TODO: Explicit since ISSUE https://github.com/microsoft/TypeScript/issues/31280 , changes required once the issue is fixed. */{
    return cylinder(0, radius, height, opts);
  }
  _export("default", cone);
  return {
    setters: [function (_cylinderJs) {
      cylinder = _cylinderJs.default;
    }],
    execute: function () {}
  };
});