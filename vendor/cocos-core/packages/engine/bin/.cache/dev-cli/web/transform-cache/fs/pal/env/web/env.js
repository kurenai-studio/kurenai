System.register("q-bundled:///fs/pal/env/web/env.js", [], function (_export, _context) {
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
    return new Promise((resolve, reject) => {
      let err;
      function windowErrorListener(evt) {
        if (evt.filename === path) {
          err = evt.error;
        }
      }
      window.addEventListener("error", windowErrorListener);
      const script = document.createElement("script");
      script.charset = "utf-8";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.addEventListener("error", () => {
        window.removeEventListener("error", windowErrorListener);
        reject(Error(`Error loading ${path}`));
      });
      script.addEventListener("load", () => {
        window.removeEventListener("error", windowErrorListener);
        document.head.removeChild(script);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      script.src = path.replace("#", "%23");
      document.head.appendChild(script);
    });
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