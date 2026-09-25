System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/utils.js", [], function (_export, _context) {
  "use strict";

  /**
   * Tells if the weight is too small so that it can be treated as 0.
   * @param weight The weight.
   * @returns True if it can be treated as 0.
   */
  function isIgnorableWeight(weight) {
    return weight < 1e-5;
  }
  _export("isIgnorableWeight", isIgnorableWeight);
  return {
    setters: [],
    execute: function () {}
  };
});