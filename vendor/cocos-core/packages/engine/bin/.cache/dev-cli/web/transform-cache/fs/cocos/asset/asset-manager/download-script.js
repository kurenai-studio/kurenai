System.register("q-bundled:///fs/cocos/asset/asset-manager/download-script.js", ["../../core/index.js", "../../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var getError, ccwindow, ccdocument, downloaded;
  function downloadScript(url, options, onComplete) {
    // no need to load script again
    if (downloaded[url]) {
      if (onComplete) {
        onComplete(null);
      }
      return null;
    }
    const script = ccdocument.createElement('script');
    if (ccwindow.location.protocol !== 'file:') {
      script.crossOrigin = 'anonymous';
    }
    script.async = options.scriptAsyncLoading || false;
    script.src = url;
    function loadHandler() {
      script.parentNode.removeChild(script);
      script.removeEventListener('load', loadHandler, false);
      script.removeEventListener('error', errorHandler, false);
      downloaded[url] = true;
      if (onComplete) {
        onComplete(null);
      }
    }
    function errorHandler() {
      script.parentNode.removeChild(script);
      script.removeEventListener('load', loadHandler, false);
      script.removeEventListener('error', errorHandler, false);
      if (onComplete) {
        onComplete(new Error(getError(4928, url)));
      }
    }
    script.addEventListener('load', loadHandler, false);
    script.addEventListener('error', errorHandler, false);
    ccdocument.body.appendChild(script);
    return script;
  }
  _export("default", downloadScript);
  return {
    setters: [function (_coreIndexJs) {
      getError = _coreIndexJs.getError;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      ccdocument = ccwindow.document;
      downloaded = {};
    }
  };
});