System.register("q-bundled:///fs/pal/env/runtime/env.js", ["../../../../virtual/internal%253Aconstants.js"], function (_export, _context) {
  "use strict";

  var VIVO;
  function findCanvas() {
    const container = document.createElement("div");
    const frame = container.parentNode === document.body ? document.documentElement : container.parentNode;
    let canvas;
    if (VIVO) {
      canvas = window.mainCanvas;
      window.mainCanvas = undefined;
    } else {
      canvas = ral.createCanvas();
    }
    return {
      frame,
      canvas,
      container
    };
  }
  function loadJsFile(path) {
    return require(`${path}`);
  }
  _export({
    findCanvas: findCanvas,
    loadJsFile: loadJsFile
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      VIVO = _virtualInternal253AconstantsJs.VIVO;
    }],
    execute: function () {}
  };
});