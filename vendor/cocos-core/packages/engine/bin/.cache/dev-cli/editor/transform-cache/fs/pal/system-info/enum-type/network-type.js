System.register("q-bundled:///fs/pal/system-info/enum-type/network-type.js", [], function (_export, _context) {
  "use strict";

  var NetworkType;
  _export("NetworkType", void 0);
  return {
    setters: [],
    execute: function () {
      (function (NetworkType) {
        NetworkType[NetworkType["NONE"] = 0] = "NONE";
        NetworkType[NetworkType["LAN"] = 1] = "LAN";
        NetworkType[NetworkType["WWAN"] = 2] = "WWAN";
      })(NetworkType || _export("NetworkType", NetworkType = {}));
    }
  };
});