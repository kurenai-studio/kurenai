System.register("q-bundled:///fs/cocos/ui/sub-context-view.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "pal/minigame", "pal/screen-adapter", "../scene-graph/component.js", "./view.js", "../2d/components/sprite.js", "../scene-graph/index.js", "../2d/framework/ui-transform.js", "../2d/assets/index.js", "../asset/assets/image-asset.js", "../core/math/index.js", "../core/global-exports.js", "../scene-graph/node-event.js", "../core/index.js", "../asset/assets/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, executionOrder, requireComponent, tooltip, serializable, EDITOR, WECHAT, WECHAT_MINI_PROGRAM, minigame, screenAdapter, Component, view, Sprite, Node, UITransform, SpriteFrame, ImageAsset, Size, legacyCC, NodeEventType, CCObjectFlags, Texture2D, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, SubContextView;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      WECHAT = _virtualInternal253AconstantsJs.WECHAT;
      WECHAT_MINI_PROGRAM = _virtualInternal253AconstantsJs.WECHAT_MINI_PROGRAM;
    }, function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_viewJs) {
      view = _viewJs.view;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }, function (_dFrameworkUiTransformJs) {
      UITransform = _dFrameworkUiTransformJs.UITransform;
    }, function (_dAssetsIndexJs) {
      SpriteFrame = _dAssetsIndexJs.SpriteFrame;
    }, function (_assetAssetsImageAssetJs) {
      ImageAsset = _assetAssetsImageAssetJs.ImageAsset;
    }, function (_coreMathIndexJs) {
      Size = _coreMathIndexJs.Size;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_coreIndexJs) {
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
    }, function (_assetAssetsIndexJs) {
      Texture2D = _assetAssetsIndexJs.Texture2D;
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
      /**
       * @en SubContextView is a view component which controls open data context viewport in WeChat game platform.<br/>
       * The component's node size decide the viewport of the sub context content in main context,
       * the entire sub context texture will be scaled to the node's bounding box area.<br/>
       * This component provides multiple important features:<br/>
       * 1. Sub context could use its own resolution size and policy.<br/>
       * 2. Sub context could be minized to smallest size it needed.<br/>
       * 3. Resolution of sub context content could be increased.<br/>
       * 4. User touch input is transformed to the correct viewport.<br/>
       * 5. Texture update is handled by this component. User don't need to worry.<br/>
       * One important thing to be noted, whenever the node's bounding box change,
       * you need to manually reset the viewport of sub context using updateSubContextViewport.
       * @zh SubContextView 可以用来控制微信小游戏平台开放数据域在主域中的视窗的位置。<br/>
       * 这个组件的节点尺寸决定了开放数据域内容在主域中的尺寸，整个开放数据域会被缩放到节点的包围盒范围内。<br/>
       * 在这个组件的控制下，用户可以更自由得控制开放数据域：<br/>
       * 1. 子域中可以使用独立的设计分辨率和适配模式<br/>
       * 2. 子域区域尺寸可以缩小到只容纳内容即可<br/>
       * 3. 子域的分辨率也可以被放大，以便获得更清晰的显示效果<br/>
       * 4. 用户输入坐标会被自动转换到正确的子域视窗中<br/>
       * 5. 子域内容贴图的更新由组件负责，用户不需要处理<br/>
       * 唯一需要注意的是，当子域节点的包围盒发生改变时，开发者需要使用 `updateSubContextViewport` 来手动更新子域视窗。
       */
      _export("SubContextView", SubContextView = (_dec = ccclass('cc.SubContextView'), _dec2 = help('i18n:cc.SubContextView'), _dec3 = executionOrder(110), _dec4 = requireComponent(UITransform), _dec5 = menu('Miscellaneous/SubContextView'), _dec6 = tooltip('i18n:subContextView.design_size'), _dec7 = tooltip('i18n:subContextView.fps'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = (_class2 = class SubContextView extends Component {
        /**
         * @en Specify a reference value of canvas size for style editing in Open Data Context.
         * The width and height setting of CSS style should not exceed this size, otherwise the rendered content will exceed the canvas.
         * NOTE: This property is read-only at runtime. Please configure the design resolution in the Editor.
         *
         * @zh 为开放数据域的样式编辑指定一个画布尺寸的参考值，CSS 样式的宽高设置不应该超过这个尺寸，否则渲染的内容会超出画布。
         * 注意：该属性在运行时是只读的，请在编辑器环境下配置好设计分辨率。
         */
        get designResolutionSize() {
          return this._designResolutionSize;
        }
        set designResolutionSize(value) {
          if (!EDITOR || value.equals(this._designResolutionSize)) {
            return;
          }
          this._designResolutionSize.set(value);
        }

        /**
         * @en Setting frame rate in Open Data Context.
         *
         * @zh 设置开放数据域的渲染帧率。
         */
        get fps() {
          return this._fps;
        }
        set fps(value) {
          if (this._fps === value) {
            return;
          }
          this._fps = value;
          this._updateInterval = 1000 / value;
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_fps", _descriptor, this);
          this._sprite = null;
          this._imageAsset = new ImageAsset();
          this._texture = new Texture2D();
          this._updatedTime = 0;
          this._updateInterval = 0;
          this._openDataContext = null;
          this._content = new Node('content');
          _initializerDefineProperty(this, "_designResolutionSize", _descriptor2, this);
          this._content.hideFlags |= CCObjectFlags.DontSave | CCObjectFlags.HideInHierarchy;
          this._updatedTime = performance.now();
        }
        onLoad() {
          if (minigame.getOpenDataContext) {
            this._updateInterval = 1000 / this._fps;
            this._openDataContext = minigame.getOpenDataContext();
            this._initSharedCanvas();
            this._initContentNode();
            this._updateSubContextView();
            this._updateContentLayer();
          } else {
            this.enabled = false;
          }
        }
        onEnable() {
          this._registerNodeEvent();
        }
        onDisable() {
          this._unregisterNodeEvent();
        }
        _initSharedCanvas() {
          if (this._openDataContext) {
            const sharedCanvas = this._openDataContext.canvas;
            let designWidth = this._designResolutionSize.width;
            let designHeight = this._designResolutionSize.height;
            if (WECHAT || WECHAT_MINI_PROGRAM) {
              // HACK: on WeChat platform, at least one side of the width and height of sharedCanvas is greater than 513
              // When the sharedCanvas is smaller than this size, the rendering doesn't work.
              const minimumSize = 513;
              if (designWidth <= minimumSize && designHeight <= minimumSize) {
                const scaleWidth = minimumSize / designWidth;
                const scaleHeight = minimumSize / designHeight;
                const targetScale = scaleWidth < scaleHeight ? scaleWidth : scaleHeight;
                designWidth *= targetScale;
                designHeight *= targetScale;
              }
            }
            sharedCanvas.width = designWidth;
            sharedCanvas.height = designHeight;
          }
        }
        _initContentNode() {
          if (this._openDataContext) {
            const sharedCanvas = this._openDataContext.canvas;
            const image = this._imageAsset;
            image.reset(sharedCanvas);
            this._texture.image = image;
            this._texture.create(sharedCanvas.width, sharedCanvas.height);
            this._sprite = this._content.getComponent(Sprite);
            if (!this._sprite) {
              this._sprite = this._content.addComponent(Sprite);
            }
            if (this._sprite.spriteFrame) {
              this._sprite.spriteFrame.texture = this._texture;
            } else {
              const sp = new SpriteFrame();
              sp.texture = this._texture;
              this._sprite.spriteFrame = sp;
            }
            this._content.parent = this.node;
          }
        }
        _updateSubContextView() {
          if (!this._openDataContext) {
            return;
          }

          // update subContextView size
          // use SHOW_ALL policy to adapt subContextView
          const nodeTrans = this.node.getComponent(UITransform);
          const contentTrans = this._content.getComponent(UITransform);
          const scaleX = nodeTrans.width / contentTrans.width;
          const scaleY = nodeTrans.height / contentTrans.height;
          const scale = scaleX > scaleY ? scaleY : scaleX;
          contentTrans.width *= scale;
          contentTrans.height *= scale;

          // update viewport in subContextView
          const viewportRect = view.getViewportRect();
          const box = contentTrans.getBoundingBoxToWorld();
          const visibleSize = view.getVisibleSize();
          const dpr = screenAdapter.devicePixelRatio;

          // TODO: the visibleSize need to be the size of Canvas node where the content node is.
          const x = (viewportRect.width * (box.x / visibleSize.width) + viewportRect.x) / dpr;
          const y = (viewportRect.height * (box.y / visibleSize.height) + viewportRect.y) / dpr;
          const width = viewportRect.width * (box.width / visibleSize.width) / dpr;
          const height = viewportRect.height * (box.height / visibleSize.height) / dpr;
          this._openDataContext.postMessage({
            fromEngine: true,
            // compatible deprecated property
            type: 'engine',
            event: 'viewport',
            x,
            y,
            width,
            height
          });
        }
        _updateSubContextTexture() {
          const img = this._imageAsset;
          if (!img || !this._openDataContext) {
            return;
          }
          if (img.width <= 0 || img.height <= 0) {
            return;
          }
          const sharedCanvas = this._openDataContext.canvas;
          img.reset(sharedCanvas);
          if (sharedCanvas.width > img.width || sharedCanvas.height > img.height) {
            this._texture.create(sharedCanvas.width, sharedCanvas.height);
          }
          this._texture.uploadData(sharedCanvas);
        }
        _registerNodeEvent() {
          this.node.on(NodeEventType.TRANSFORM_CHANGED, this._updateSubContextView, this);
          this.node.on(NodeEventType.SIZE_CHANGED, this._updateSubContextView, this);
          this.node.on(NodeEventType.LAYER_CHANGED, this._updateContentLayer, this);
        }
        _unregisterNodeEvent() {
          this.node.off(NodeEventType.TRANSFORM_CHANGED, this._updateSubContextView, this);
          this.node.off(NodeEventType.SIZE_CHANGED, this._updateSubContextView, this);
          this.node.off(NodeEventType.LAYER_CHANGED, this._updateContentLayer, this);
        }
        _updateContentLayer() {
          this._content.layer = this.node.layer;
        }
        update(dt) {
          const calledUpdateManually = dt === undefined;
          if (calledUpdateManually) {
            this._updateSubContextTexture();
            return;
          }
          const now = performance.now();
          const deltaTime = now - this._updatedTime;
          if (deltaTime >= this._updateInterval) {
            this._updatedTime += this._updateInterval;
            this._updateSubContextTexture();
          }
        }
        onDestroy() {
          this._content.destroy();
          this._texture.destroy();
          if (this._sprite) {
            this._sprite.destroy();
          }
          this._imageAsset.destroy();
          this._openDataContext = null;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "designResolutionSize", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "designResolutionSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fps", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "fps"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_fps", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 60;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_designResolutionSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Size(640, 960);
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
      legacyCC.SubContextView = SubContextView;
    }
  };
});