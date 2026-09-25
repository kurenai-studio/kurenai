System.register("q-bundled:///fs/cocos/2d/framework/ui-renderer-manager.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var DEBUG, assert, js, UIRendererManager, uiRendererManager;
  _export("UIRendererManager", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      assert = _coreIndexJs.assert;
      js = _coreIndexJs.js;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /** @mangle */
      _export("UIRendererManager", UIRendererManager = class UIRendererManager {
        constructor() {
          this._allRenderers = [];
          this._dirtyRenderers = [];
          this._dirtyVersion = 0;
        }
        addRenderer(uiRenderer) {
          if (uiRenderer._internalId === -1) {
            uiRenderer._internalId = this._allRenderers.length;
            this._allRenderers.push(uiRenderer);
          }
        }
        removeRenderer(uiRenderer) {
          if (uiRenderer._internalId !== -1) {
            if (DEBUG) {
              assert(this._allRenderers[uiRenderer._internalId] === uiRenderer);
            }
            const id = uiRenderer._internalId;
            this._allRenderers[this._allRenderers.length - 1]._internalId = id;
            js.array.fastRemoveAt(this._allRenderers, id);
            uiRenderer._internalId = -1;
            if (uiRenderer._dirtyVersion === this._dirtyVersion) {
              js.array.fastRemove(this._dirtyRenderers, uiRenderer);
              uiRenderer._dirtyVersion = -1;
            }
          }
        }
        markDirtyRenderer(uiRenderer) {
          if (uiRenderer._dirtyVersion !== this._dirtyVersion && uiRenderer._internalId !== -1) {
            this._dirtyRenderers.push(uiRenderer);
            uiRenderer._dirtyVersion = this._dirtyVersion;
          }
        }
        updateAllDirtyRenderers() {
          const dirtyRenderers = this._dirtyRenderers;
          for (let i = 0; i < this._dirtyRenderers.length; i++) {
            if (DEBUG) {
              assert(dirtyRenderers[i]._internalId !== -1);
            }
            dirtyRenderers[i].updateRenderer();
          }
          this._dirtyRenderers.length = 0;
          this._dirtyVersion++;
        }
      });
      _export("uiRendererManager", uiRendererManager = new UIRendererManager());
    }
  };
});