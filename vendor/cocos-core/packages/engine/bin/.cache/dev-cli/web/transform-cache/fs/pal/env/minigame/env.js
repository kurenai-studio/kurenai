System.register("q-bundled:///fs/pal/env/minigame/env.js", ["../../../../virtual/internal%253Aconstants.js"], function (_export, _context) {
  "use strict";

  var XIAOMI, WECHAT, WECHAT_MINI_PROGRAM, TAOBAO_MINIGAME, TAOBAO;
  function findCanvas() {
    const container = document.createElement("div");
    return {
      frame: container,
      canvas: window.canvas,
      container
    };
  }
  function loadJsFile(path) {
    if (XIAOMI) {
      return require(`../../${path}`);
    }
    if (WECHAT || WECHAT_MINI_PROGRAM) {
      return __wxRequire(path);
    }
    if (TAOBAO_MINIGAME) {
      return globalThis.__taobaoRequire(path);
    }
    if (TAOBAO) {
      return undefined;
    }
    return require(`../${path}`);
  }
  _export({
    findCanvas: findCanvas,
    loadJsFile: loadJsFile
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      XIAOMI = _virtualInternal253AconstantsJs.XIAOMI;
      WECHAT = _virtualInternal253AconstantsJs.WECHAT;
      WECHAT_MINI_PROGRAM = _virtualInternal253AconstantsJs.WECHAT_MINI_PROGRAM;
      TAOBAO_MINIGAME = _virtualInternal253AconstantsJs.TAOBAO_MINIGAME;
      TAOBAO = _virtualInternal253AconstantsJs.TAOBAO;
    }],
    execute: function () {}
  };
});