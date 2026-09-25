System.register("q-bundled:///fs/pal/env/nodejs/env.js", [], function (_export, _context) {
  "use strict";

  function findCanvas() {
    const frame = document.querySelector("#GameDiv");
    const container = document.querySelector("#Cocos3dGameContainer");
    const canvas = document.querySelector("#GameCanvas");
    return {
      frame,
      container,
      canvas
    };
  }
  function loadJsFile(path) {
    return globalThis.nodeEnv.require(`${path}`);
  }
  _export({
    findCanvas: findCanvas,
    loadJsFile: loadJsFile
  });
  return {
    setters: [],
    execute: function () {}
  };
});