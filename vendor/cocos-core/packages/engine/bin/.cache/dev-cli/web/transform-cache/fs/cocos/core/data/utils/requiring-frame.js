System.register("q-bundled:///fs/cocos/core/data/utils/requiring-frame.js", ["../../../../../virtual/internal%253Aconstants.js", "../../global-exports.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, legacyCC, requiringFrames;
  // the requiring frame infos

  function push(module, uuid, script, importMeta) {
    if (script === undefined) {
      script = uuid;
      uuid = '';
    }
    requiringFrames.push({
      uuid,
      script,
      module,
      exports: module.exports,
      // original exports
      beh: null,
      importMeta
    });
  }
  function pop() {
    const frameInfo = requiringFrames.pop();
    // check exports
    const module = frameInfo.module;
    let exports = module.exports;
    if (exports === frameInfo.exports) {
      for (const anykey in exports) {
        // exported
        return;
      }
      // auto export component
      module.exports = exports = frameInfo.cls;
    }
  }
  function peek() {
    return requiringFrames[requiringFrames.length - 1];
  }
  _export({
    push: push,
    pop: pop,
    peek: peek
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      /**
       *
       */
      requiringFrames = [];
      legacyCC._RF = {
        push,
        pop,
        peek
      };
      if (EDITOR || NODEJS) {
        legacyCC._RF.reset = () => {
          requiringFrames = [];
        };
      }
    }
  };
});