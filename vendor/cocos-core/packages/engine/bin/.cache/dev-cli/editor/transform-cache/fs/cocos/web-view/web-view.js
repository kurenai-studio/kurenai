System.register("q-bundled:///fs/cocos/web-view/web-view.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../2d/framework/index.js", "../scene-graph/index.js", "./web-view-impl-manager.js", "./web-view-enums.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, tooltip, type, displayOrder, serializable, requireComponent, EDITOR_NOT_IN_PREVIEW, UITransform, Component, ComponentEventHandler, WebViewImplManager, WebViewEventType, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _WebView, WebView;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
      ComponentEventHandler = _sceneGraphIndexJs.EventHandler;
    }, function (_webViewImplManagerJs) {
      WebViewImplManager = _webViewImplManagerJs.WebViewImplManager;
    }, function (_webViewEnumsJs) {
      WebViewEventType = _webViewEnumsJs.WebViewEventType;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
      /**
       * @en
       * WebView component, used to display web pages in the game.
       * Since different platforms have different authorizations, APIs, and control methods for WebView components, there is no unified standard yet.
       * So currently only Web, iOS, and Android platforms are supported.
       * @zh
       * WebView 组件，用于在游戏中显示网页。
       * 由于不同平台对于 WebView 组件的授权、API、控制方式都不同，还没有形成统一的标准，所以目前只支持 Web、iOS 和 Android 平台。
       */
      _export("WebView", WebView = (_dec = ccclass('cc.WebView'), _dec2 = help('i18n:cc.WebView'), _dec3 = menu('Miscellaneous/WebView'), _dec4 = requireComponent(UITransform), _dec5 = tooltip('i18n:webview.url'), _dec6 = type([ComponentEventHandler]), _dec7 = displayOrder(20), _dec8 = tooltip('i18n:webview.webviewEvents'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = (_class2 = (_WebView = class WebView extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_url", _descriptor, this);
          this._impl = null;
          /**
           * @en
           * The webview's event callback, it will be triggered after the loading is completed or when the loading error occurs.
           * @zh
           * WebView 的回调事件，当网页加载过程中，加载完成后或者加载出错时都会回调此函数。
           */
          _initializerDefineProperty(this, "webviewEvents", _descriptor2, this);
        }

        /**
         * @en
         * A given URL to be loaded by the WebView, it should have a http or https prefix.
         * @zh
         * 指定 WebView 加载的网址，它应该是一个 http 或者 https 开头的字符串。
         */
        get url() {
          return this._url;
        }
        set url(val) {
          this._url = val;
          if (this._impl) {
            this._impl.loadURL(val);
          }
        }
        /**
         * @en
         * Raw webview objects for user customization.
         * @zh
         * 原始网页对象，用于用户定制。
         */
        get nativeWebView() {
          return this._impl && this._impl.webview || null;
        }

        /**
         * @en
         * Gets the current webview state.
         * @zh
         * 获取当前网页视图状态。
         */
        get state() {
          if (!this._impl) {
            return WebViewEventType.NONE;
          }
          return this._impl.state;
        }

        /**
         * @en
         * Sets javascript interface scheme (see also setOnJSCallback).
         * Note: Supports only on the Android and iOS. For HTML5, please refer to the official documentation.
         * Please refer to the official documentation for more details.
         * @zh
         * 设置 JavaScript 接口方案（与 'setOnJSCallback' 配套使用）。
         * 注意：只支持 Android 和 iOS ，Web 端用法请前往官方文档查看。
         * 详情请参阅官方文档
         * @method setJavascriptInterfaceScheme
         * @param {String} scheme
         */
        setJavascriptInterfaceScheme(scheme) {
          if (this._impl) {
            this._impl.setJavascriptInterfaceScheme(scheme);
          }
        }

        /**
         * @en
         * This callback called when load URL that start with javascript
         * interface scheme (see also setJavascriptInterfaceScheme).
         * Note: Supports only on the Android and iOS. For HTML5, please refer to the official documentation.
         * Please refer to the official documentation for more details.
         * @zh
         * 当加载 URL 以 JavaScript 接口方案开始时调用这个回调函数。
         * 注意：只支持 Android 和 iOS，Web 端用法请前往官方文档查看。
         * 详情请参阅官方文档。
         * @method setOnJSCallback
         * @param {Function} callback
         */
        setOnJSCallback(callback) {
          if (this._impl) {
            this._impl.setOnJSCallback(callback);
          }
        }

        /**
         * @en
         * Evaluates JavaScript in the context of the currently displayed page.
         * Please refer to the official document for more details
         * Note: Cross domain issues need to be resolved by yourself
         * @zh
         * 执行 WebView 内部页面脚本（详情请参阅官方文档）。
         * 注意：需要自行解决跨域问题。
         * @method evaluateJS
         * @param {String} str
         */
        evaluateJS(str) {
          if (this._impl) {
            this._impl.evaluateJS(str);
          }
        }
        __preload() {
          if (EDITOR_NOT_IN_PREVIEW) {
            return;
          }
          this._impl = WebViewImplManager.getImpl(this);
          const {
            componentEventList
          } = this._impl;
          // must be register the event listener
          componentEventList.set(WebViewEventType.LOADING, this.onLoading.bind(this));
          componentEventList.set(WebViewEventType.LOADED, this.onLoaded.bind(this));
          componentEventList.set(WebViewEventType.ERROR, this.onError.bind(this));
          this._impl.loadURL(this._url);
        }
        onLoading() {
          ComponentEventHandler.emitEvents(this.webviewEvents, this, WebViewEventType.LOADING);
          this.node.emit(WebViewEventType.LOADING, this);
        }
        onLoaded() {
          ComponentEventHandler.emitEvents(this.webviewEvents, this, WebViewEventType.LOADED);
          this.node.emit(WebViewEventType.LOADED, this);
        }
        onError(...args) {
          ComponentEventHandler.emitEvents(this.webviewEvents, this, WebViewEventType.ERROR, args);
          this.node.emit(WebViewEventType.ERROR, this, args);
        }
        onEnable() {
          if (this._impl) {
            this._impl.enable();
          }
        }
        onDisable() {
          if (this._impl) {
            this._impl.disable();
          }
        }
        onDestroy() {
          if (this._impl) {
            this._impl.destroy();
            this._impl = null;
          }
        }
        update(dt) {
          if (this._impl) {
            this._impl.syncMatrix();
          }
        }
      }, _WebView.EventType = WebViewEventType, _WebView), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_url", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'https://cocos.com';
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "url", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "url"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "webviewEvents", [serializable, _dec6, _dec7, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class)); // TODO Since jsb adapter does not support import cc, put it on internal first and adjust it later.
      legacyCC.internal.WebView = WebView;
    }
  };
});