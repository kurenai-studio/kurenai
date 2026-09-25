System.register("q-bundled:///fs/cocos/web-view/web-view-impl.js", ["../core/global-exports.js", "./web-view-enums.js", "../2d/framework/index.js", "../game/director.js"], function (_export, _context) {
  "use strict";

  var legacyCC, WebViewEventType, UITransform, director, WebViewImpl;
  _export("WebViewImpl", void 0);
  return {
    setters: [function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_webViewEnumsJs) {
      WebViewEventType = _webViewEnumsJs.WebViewEventType;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("WebViewImpl", WebViewImpl = class WebViewImpl {
        constructor(component) {
          this._componentEventList = new Map();
          this._state = WebViewEventType.NONE;
          this._wrapper = void 0;
          // Fix iframe display problem in ios.
          this._webview = null;
          this._loaded = false;
          this._forceUpdate = false;
          this._component = null;
          this._uiTrans = null;
          this._node = null;
          this._w = 0;
          this._h = 0;
          this._m00 = 0;
          this._m01 = 0;
          this._m04 = 0;
          this._m05 = 0;
          this._m12 = 0;
          this._m13 = 0;
          this._component = component;
          this._node = component.node;
          this._uiTrans = component.node.getComponent(UITransform);
          this.reset();
          this.createWebView();
        }
        reset() {
          this._wrapper = null;
          this._webview = null;
          this._loaded = false;
          this._w = 0;
          this._h = 0;
          this._m00 = 0;
          this._m01 = 0;
          this._m04 = 0;
          this._m05 = 0;
          this._m12 = 0;
          this._m13 = 0;
          this._state = WebViewEventType.NONE;
          this._forceUpdate = false;
        }
        get loaded() {
          return this._loaded;
        }
        get componentEventList() {
          return this._componentEventList;
        }
        get webview() {
          return this._webview;
        }
        get state() {
          return this._state;
        }
        get UICamera() {
          return director.root.batcher2D.getFirstRenderCamera(this._node);
        }
        dispatchEvent(key, ...args) {
          const callback = this._componentEventList.get(key);
          if (callback) {
            this._state = key;
            callback.call(this, args);
          }
        }
        destroy() {
          this.removeWebView();
          this._wrapper = null;
          this._webview = null;
          this._loaded = false;
          this._component = null;
          this._uiTrans = null;
          this._forceUpdate = false;
          this._componentEventList.clear();
        }
      });
      legacyCC.internal.WebViewImpl = WebViewImpl;
    }
  };
});