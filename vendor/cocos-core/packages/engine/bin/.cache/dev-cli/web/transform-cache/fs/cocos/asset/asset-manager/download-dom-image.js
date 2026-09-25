System.register("q-bundled:///fs/cocos/asset/asset-manager/download-dom-image.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var XIAOMI, getError, ccwindow;
  function downloadDomImage(url, options, onComplete) {
    const img = new ccwindow.Image();

    // NOTE: on xiaomi platform, we need to force setting img.crossOrigin as 'anonymous'
    if (ccwindow.location.protocol !== 'file:' || XIAOMI) {
      img.crossOrigin = 'anonymous';
    }
    function loadCallback() {
      img.removeEventListener('load', loadCallback);
      img.removeEventListener('error', errorCallback);
      if (onComplete) {
        onComplete(null, img);
      }
    }
    function errorCallback() {
      img.removeEventListener('load', loadCallback);
      img.removeEventListener('error', errorCallback);
      if (onComplete) {
        onComplete(new Error(getError(4930, url)));
      }
    }
    img.addEventListener('load', loadCallback);
    img.addEventListener('error', errorCallback);
    img.src = url;
    return img;
  }
  _export("default", downloadDomImage);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      XIAOMI = _virtualInternal253AconstantsJs.XIAOMI;
    }, function (_coreIndexJs) {
      getError = _coreIndexJs.getError;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
    }],
    execute: function () {}
  };
});