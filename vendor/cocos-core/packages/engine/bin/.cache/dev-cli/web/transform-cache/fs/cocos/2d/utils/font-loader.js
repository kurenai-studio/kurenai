System.register("q-bundled:///fs/cocos/2d/utils/font-loader.js", ["../../core/index.js", "./text-utils.js", "../../asset/asset-manager/downloader.js", "../../asset/asset-manager/factory.js", "../assets/ttf-font.js", "../../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var warnID, safeMeasureText, downloader, factory, TTFFont, ccwindow, ccdocument, _canvasContext, _intervalId, _testString, _fontFaces, _loadingFonts, _timeout, useNativeCheck;
  function checkFontLoaded() {
    let allFontsLoaded = true;
    const now = Date.now();
    for (let i = _loadingFonts.length - 1; i >= 0; i--) {
      const fontLoadHandle = _loadingFonts[i];
      const fontFamily = fontLoadHandle.fontFamilyName;
      // load timeout
      if (now - fontLoadHandle.startTime > _timeout) {
        warnID(4933, fontFamily);
        fontLoadHandle.onComplete(null, fontFamily);
        _loadingFonts.splice(i, 1);
        continue;
      }
      const oldWidth = fontLoadHandle.refWidth;
      const fontDesc = `40px ${fontFamily}`;
      _canvasContext.font = fontDesc;
      const newWidth = safeMeasureText(_canvasContext, _testString, fontDesc);
      // loaded successfully
      if (oldWidth !== newWidth) {
        _loadingFonts.splice(i, 1);
        fontLoadHandle.onComplete(null, fontFamily);
      } else {
        allFontsLoaded = false;
      }
    }
    if (allFontsLoaded) {
      clearInterval(_intervalId);
      _intervalId = -1;
    }
  }

  // refer to https://github.com/typekit/webfontloader/blob/master/src/core/nativefontwatchrunner.js
  function nativeCheckFontLoaded(start, font, callback) {
    const loader = new Promise((resolve, reject) => {
      const check = () => {
        const now = Date.now();
        if (now - start >= _timeout) {
          reject();
        } else {
          ccdocument.fonts.load(`40px ${font}`).then(fonts => {
            if (fonts.length >= 1) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          }, () => {
            reject();
          });
        }
      };
      check();
    });
    let timeoutId = null;
    const timer = new Promise((resolve, reject) => {
      timeoutId = setTimeout(reject, _timeout);
    });
    Promise.race([timer, loader]).then(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      callback(null, font);
    }, () => {
      warnID(4933, font);
      callback(null, font);
    });
  }
  function loadFont(url, options, onComplete) {
    const fontFamilyName = getFontFamily(url);
    // Already loaded fonts
    if (_fontFaces[fontFamilyName]) {
      onComplete(null, fontFamilyName);
      return;
    }
    if (!_canvasContext) {
      const labelCanvas = ccdocument.createElement('canvas');
      labelCanvas.width = 100;
      labelCanvas.height = 100;
      _canvasContext = labelCanvas.getContext('2d');
    }

    // Default width reference to test whether new font is loaded correctly
    const fontDesc = `40px ${fontFamilyName}`;

    // Setup font face style
    const fontStyle = ccdocument.createElement('style');
    fontStyle.type = 'text/css';
    let fontStr = '';
    if (Number.isNaN(fontFamilyName)) {
      fontStr += `@font-face { font-family:${fontFamilyName}; src:`;
    } else {
      fontStr += `@font-face { font-family:"${fontFamilyName}"; src:`;
    }
    fontStr += `url("${url}");`;
    fontStyle.textContent = `${fontStr}}`;
    ccdocument.body.appendChild(fontStyle);

    // Preload font with div
    const preloadDiv = ccdocument.createElement('div');
    const divStyle = preloadDiv.style;
    divStyle.fontFamily = fontFamilyName;
    preloadDiv.innerHTML = '.';
    divStyle.position = 'absolute';
    divStyle.left = '-100px';
    divStyle.top = '-100px';
    ccdocument.body.appendChild(preloadDiv);
    if (useNativeCheck()) {
      nativeCheckFontLoaded(Date.now(), fontFamilyName, onComplete);
    } else {
      const refWidth = safeMeasureText(_canvasContext, _testString, fontDesc);
      // Save loading font
      const fontLoadHandle = {
        fontFamilyName,
        refWidth,
        onComplete,
        startTime: Date.now()
      };
      _loadingFonts.push(fontLoadHandle);
      if (_intervalId === -1) {
        _intervalId = setInterval(checkFontLoaded, 100);
      }
    }
    _fontFaces[fontFamilyName] = fontStyle;
  }
  function getFontFamily(fontHandle) {
    const ttfIndex = fontHandle.lastIndexOf('.ttf');
    if (ttfIndex === -1) {
      return fontHandle;
    }
    const slashPos = fontHandle.lastIndexOf('/');
    let fontFamilyName;
    if (slashPos === -1) {
      fontFamilyName = `${fontHandle.substring(0, ttfIndex)}_LABEL`;
    } else {
      fontFamilyName = `${fontHandle.substring(slashPos + 1, ttfIndex)}_LABEL`;
    }
    if (fontFamilyName.indexOf(' ') !== -1) {
      fontFamilyName = `"${fontFamilyName}"`;
    }
    return fontFamilyName;
  }
  function createFont(id, data, options, onComplete) {
    const out = new TTFFont();
    out._nativeUrl = id;
    out._nativeAsset = data;
    onComplete(null, out);
  }
  _export({
    loadFont: loadFont,
    getFontFamily: getFontFamily
  });
  return {
    setters: [function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
    }, function (_textUtilsJs) {
      safeMeasureText = _textUtilsJs.safeMeasureText;
    }, function (_assetAssetManagerDownloaderJs) {
      downloader = _assetAssetManagerDownloaderJs.default;
    }, function (_assetAssetManagerFactoryJs) {
      factory = _assetAssetManagerFactoryJs.default;
    }, function (_assetsTtfFontJs) {
      TTFFont = _assetsTtfFontJs.TTFFont;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      _canvasContext = null;
      _intervalId = -1; // letter symbol number CJK
      _testString = 'BES bswy:->@123\u4E01\u3041\u1101';
      _fontFaces = Object.create(null);
      _loadingFonts = []; // 3 seconds timeout
      _timeout = 3000; // Refer to https://github.com/typekit/webfontloader/blob/master/src/core/fontwatcher.js
      useNativeCheck = (() => {
        let nativeCheck;
        return () => {
          if (nativeCheck === undefined) {
            if ('FontFace' in ccwindow) {
              const match = /Gecko.*Firefox\/(\d+)/.exec(ccwindow.navigator.userAgent);
              const safari10Match = /OS X.*Version\/10\..*Safari/.exec(ccwindow.navigator.userAgent) && /Apple/.exec(ccwindow.navigator.vendor);
              if (match) {
                nativeCheck = parseInt(match[1], 10) > 42;
              } else if (safari10Match) {
                nativeCheck = false;
              } else {
                nativeCheck = true;
              }
            } else {
              nativeCheck = false;
            }
          }
          return nativeCheck;
        };
      })();
      downloader.register({
        // font
        '.font': loadFont,
        '.eot': loadFont,
        '.ttf': loadFont,
        '.woff': loadFont,
        '.svg': loadFont,
        '.ttc': loadFont
      });
      factory.register({
        // font
        '.font': createFont,
        '.eot': createFont,
        '.ttf': createFont,
        '.woff': createFont,
        '.svg': createFont,
        '.ttc': createFont
      });
    }
  };
});