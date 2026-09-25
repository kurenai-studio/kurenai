System.register("q-bundled:///fs/cocos/sorting/index.js", ["./sorting-layers.js", "./sorting.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_sortingLayersJs) {
      _export("SortingLayers", _sortingLayersJs.SortingLayers);
    }, function (_sortingJs) {
      _export("Sorting", _sortingJs.Sorting);
    }],
    execute: function () {}
  };
});