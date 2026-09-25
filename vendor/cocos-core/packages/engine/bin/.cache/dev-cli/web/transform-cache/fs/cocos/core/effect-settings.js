System.register("q-bundled:///fs/cocos/core/effect-settings.js", ["../../../virtual/internal%253Aconstants.js", "./global-exports.js"], function (_export, _context) {
  "use strict";

  var HTML5, legacyCC, EffectSettings, effectSettings;
  _export("EffectSettings", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      HTML5 = _virtualInternal253AconstantsJs.HTML5;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("EffectSettings", EffectSettings = class EffectSettings {
        constructor() {
          this._data = null;
        }
        init(path = '') {
          if (!legacyCC.rendering || !legacyCC.rendering.enableEffectImport || !path) {
            return Promise.resolve();
          }
          return new Promise((resolve, reject) => {
            if (!HTML5 && !path.startsWith('http')) {
              globalThis.fsUtils.readArrayBuffer(path, (err, arrayBuffer) => {
                if (err) {
                  reject(err);
                  return;
                }
                this._data = arrayBuffer;
                resolve();
              });
            } else {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', path);
              xhr.responseType = 'arraybuffer';
              xhr.onload = () => {
                this._data = xhr.response;
                resolve();
              };
              xhr.onerror = () => {
                reject(new Error('request effect settings failed!'));
              };
              xhr.send(null);
            }
          });
        }
        get data() {
          return this._data;
        }
      });
      _export("effectSettings", effectSettings = new EffectSettings());
      legacyCC.effectSettings = effectSettings;
    }
  };
});