System.register("q-bundled:///fs/cocos/core/legacy.js", ["./platform/debug.js", "./utils/path.js", "./global-exports.js"], function (_export, _context) {
  "use strict";

  var debug, _normalize, basename, changeBasename, changeExtname, dirname, extname, getSeperator, join, mainFileName, stripSep, legacyCC;
  return {
    setters: [function (_platformDebugJs) {
      debug = _platformDebugJs;
    }, function (_utilsPathJs) {
      _normalize = _utilsPathJs._normalize;
      basename = _utilsPathJs.basename;
      changeBasename = _utilsPathJs.changeBasename;
      changeExtname = _utilsPathJs.changeExtname;
      dirname = _utilsPathJs.dirname;
      extname = _utilsPathJs.extname;
      getSeperator = _utilsPathJs.getSeperator;
      join = _utilsPathJs.join;
      mainFileName = _utilsPathJs.mainFileName;
      stripSep = _utilsPathJs.stripSep;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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

      // CCDebug.js
      legacyCC.log = debug.log;
      legacyCC.warn = debug.warn;
      legacyCC.error = debug.error;
      legacyCC.assert = debug.assert;
      legacyCC._throw = debug._throw;
      legacyCC.logID = debug.logID;
      legacyCC.warnID = debug.warnID;
      legacyCC.errorID = debug.errorID;
      legacyCC.assertID = debug.assertID;
      legacyCC.debug = debug;

      // path.js
      legacyCC.path = {
        join,
        extname,
        mainFileName,
        basename,
        dirname,
        changeExtname,
        changeBasename,
        _normalize,
        stripSep,
        get sep() {
          return getSeperator();
        }
      };
    }
  };
});