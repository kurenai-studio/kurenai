System.register("q-bundled:///fs/cocos/ui/page-view-indicator.js", ["../core/data/decorators/index.js", "../2d/assets/index.js", "../scene-graph/component.js", "../core/math/index.js", "../core/value-types/enum.js", "../scene-graph/index.js", "./layout.js", "../2d/components/sprite.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, tooltip, type, serializable, SpriteFrame, Component, Color, Size, ccenum, Node, Layout, LayoutResizeMode, LayoutType, Sprite, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _PageViewIndicator, _color, Direction, PageViewIndicator;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_dAssetsIndexJs) {
      SpriteFrame = _dAssetsIndexJs.SpriteFrame;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreMathIndexJs) {
      Color = _coreMathIndexJs.Color;
      Size = _coreMathIndexJs.Size;
    }, function (_coreValueTypesEnumJs) {
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }, function (_layoutJs) {
      Layout = _layoutJs.Layout;
      LayoutResizeMode = _layoutJs.LayoutResizeMode;
      LayoutType = _layoutJs.LayoutType;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      _color = new Color();
      /**
       * @en Enum for PageView Indicator direction.
       *
       * @zh 页面视图指示器的摆放方向。
       *
       * @enum PageViewIndicator.Direction
       */
      Direction = /*#__PURE__*/function (Direction) {
        /**
         * @en The horizontal direction.
         *
         * @zh 水平方向。
         */
        Direction[Direction["HORIZONTAL"] = 0] = "HORIZONTAL";
        /**
         * @en The vertical direction.
         *
         * @zh 垂直方向。
         */
        Direction[Direction["VERTICAL"] = 1] = "VERTICAL";
        return Direction;
      }(Direction || {});
      ccenum(Direction);

      /**
       * @en
       * The Page View Indicator Component.
       *
       * @zh
       * 页面视图每页标记组件。
       */
      _export("PageViewIndicator", PageViewIndicator = (_dec = ccclass('cc.PageViewIndicator'), _dec2 = help('i18n:cc.PageViewIndicator'), _dec3 = executionOrder(110), _dec4 = menu('UI/PageViewIndicator'), _dec5 = type(SpriteFrame), _dec6 = tooltip('i18n:pageview_indicator.spriteFrame'), _dec7 = type(Direction), _dec8 = tooltip('i18n:pageview_indicator.direction'), _dec9 = type(Size), _dec0 = tooltip('i18n:pageview_indicator.cell_size'), _dec1 = tooltip('i18n:pageview_indicator.spacing'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = (_PageViewIndicator = class PageViewIndicator extends Component {
        /**
         * @en
         * The spriteFrame for each element.
         *
         * @zh
         * 每个页面标记显示的图片。
         */
        get spriteFrame() {
          return this._spriteFrame;
        }
        set spriteFrame(value) {
          if (this._spriteFrame === value) {
            return;
          }
          this._spriteFrame = value;
        }

        /**
         * @en
         * The location direction of PageViewIndicator.
         *
         * @zh
         * 页面标记摆放方向。
         *
         * @param direction @en The direction of the PageViewIndicator. @zh 页面标记的摆放方向。
         */
        get direction() {
          return this._direction;
        }
        set direction(value) {
          if (this._direction === value) {
            return;
          }
          this._direction = value;
        }

        /**
         * @en
         * The cellSize for each element.
         *
         * @zh
         * 每个页面标记的大小。
         */
        get cellSize() {
          return this._cellSize;
        }
        set cellSize(value) {
          if (this._cellSize === value) {
            return;
          }
          this._cellSize = value;
        }

        /**
         * @en Enum for PageView Indicator direction.
         * @zh 页面视图指示器的摆放方向。
         * @enum PageViewIndicator.Direction
         */

        constructor() {
          super();
          /**
           * @en
           * The distance between each element.
           *
           * @zh
           * 每个页面标记之间的边距。
           */
          _initializerDefineProperty(this, "spacing", _descriptor, this);
          _initializerDefineProperty(this, "_spriteFrame", _descriptor2, this);
          _initializerDefineProperty(this, "_direction", _descriptor3, this);
          _initializerDefineProperty(this, "_cellSize", _descriptor4, this);
          this._layout = null;
          this._pageView = null;
          this._indicators = [];
        }
        onLoad() {
          this._updateLayout();
        }

        /**
         * @en
         * Set Page View.
         *
         * @zh
         * 设置页面视图。
         *
         * @param target @en The page view which is attached with this indicator.  @zh 当前标记对象附着到的页面视图对象。
         */
        setPageView(target) {
          this._pageView = target;
          this._refresh();
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _updateLayout() {
          this._layout = this.getComponent(Layout);
          if (!this._layout) {
            this._layout = this.addComponent(Layout);
          }
          const layout = this._layout;
          if (this.direction === Direction.HORIZONTAL) {
            layout.type = LayoutType.HORIZONTAL;
            layout.spacingX = this.spacing;
          } else if (this.direction === Direction.VERTICAL) {
            layout.type = LayoutType.VERTICAL;
            layout.spacingY = this.spacing;
          }
          layout.resizeMode = LayoutResizeMode.CONTAINER;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _createIndicator() {
          const node = new Node();
          node.layer = this.node.layer;
          const sprite = node.addComponent(Sprite);
          sprite.spriteFrame = this.spriteFrame;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          node.parent = this.node;
          node._getUITransformComp().setContentSize(this._cellSize);
          return node;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _changedState() {
          const indicators = this._indicators;
          if (indicators.length === 0 || !this._pageView) {
            return;
          }
          const idx = this._pageView.curPageIdx;
          if (idx >= indicators.length) {
            return;
          }
          for (let i = 0; i < indicators.length; ++i) {
            const node = indicators[i];
            if (!node._uiProps.uiComp) {
              continue;
            }
            const uiComp = node._uiProps.uiComp;
            _color.set(uiComp.color);
            _color.a = 255 / 2;
            uiComp.color = _color;
          }
          if (indicators[idx]._uiProps.uiComp) {
            const comp = indicators[idx]._uiProps.uiComp;
            _color.set(comp.color);
            _color.a = 255;
            comp.color = _color;
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _refresh() {
          if (!this._pageView) {
            return;
          }
          const indicators = this._indicators;
          const pages = this._pageView.getPages();
          if (pages.length === indicators.length) {
            return;
          }
          let i = 0;
          if (pages.length > indicators.length) {
            for (i = 0; i < pages.length; ++i) {
              if (!indicators[i]) {
                indicators[i] = this._createIndicator();
              }
            }
          } else {
            const count = indicators.length - pages.length;
            for (i = count; i > 0; --i) {
              const node = indicators[i - 1];
              this.node.removeChild(node);
              indicators.splice(i - 1, 1);
            }
          }
          if (this._layout && this._layout.enabledInHierarchy) {
            this._layout.updateLayout();
          }
          this._changedState();
        }
      }, _PageViewIndicator.Direction = Direction, _PageViewIndicator), _applyDecoratedDescriptor(_class2.prototype, "spriteFrame", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "spriteFrame"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "direction", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "direction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cellSize", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "cellSize"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "spacing", [serializable, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_spriteFrame", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_direction", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Direction.HORIZONTAL;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_cellSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Size(20, 20);
        }
      }), _class2)) || _class) || _class) || _class) || _class));
      legacyCC.PageViewIndicator = PageViewIndicator;
    }
  };
});