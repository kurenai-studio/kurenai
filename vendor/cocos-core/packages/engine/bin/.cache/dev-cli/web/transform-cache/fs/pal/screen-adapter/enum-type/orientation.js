System.register("q-bundled:///fs/pal/screen-adapter/enum-type/orientation.js", [], function (_export, _context) {
  "use strict";

  var Orientation;
  _export("Orientation", void 0);
  return {
    setters: [],
    execute: function () {
      (function (Orientation) {
        Orientation[Orientation["PORTRAIT"] = 1] = "PORTRAIT";
        Orientation[Orientation["PORTRAIT_UPSIDE_DOWN"] = 2] = "PORTRAIT_UPSIDE_DOWN";
        Orientation[Orientation["LANDSCAPE_LEFT"] = 4] = "LANDSCAPE_LEFT";
        Orientation[Orientation["LANDSCAPE_RIGHT"] = 8] = "LANDSCAPE_RIGHT";
        Orientation[Orientation["LANDSCAPE"] = 12] = "LANDSCAPE";
        Orientation[Orientation["AUTO"] = 13] = "AUTO";
      })(Orientation || _export("Orientation", Orientation = {}));
    }
  };
});