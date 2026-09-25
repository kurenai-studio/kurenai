System.register("q-bundled:///fs/cocos/ui/scroll-bar.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../2d/framework/index.js", "../core/math/index.js", "../core/value-types/enum.js", "../core/math/utils.js", "../2d/components/sprite.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, requireComponent, tooltip, displayOrder, type, serializable, Component, UITransform, Color, Vec2, Vec3, ccenum, clamp01, Sprite, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _ScrollBar, GETTING_SHORTER_FACTOR, _tempPos_1, _tempPos_2, _tempVec3, defaultAnchor, _tempColor, _tempVec2, ScrollBarDirection, ScrollBar;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_coreMathIndexJs) {
      Color = _coreMathIndexJs.Color;
      Vec2 = _coreMathIndexJs.Vec2;
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_coreValueTypesEnumJs) {
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_coreMathUtilsJs) {
      clamp01 = _coreMathUtilsJs.clamp01;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
      GETTING_SHORTER_FACTOR = 20;
      _tempPos_1 = new Vec3();
      _tempPos_2 = new Vec3();
      _tempVec3 = new Vec3();
      defaultAnchor = new Vec2();
      _tempColor = new Color();
      _tempVec2 = new Vec2();
      /**
       * @en
       * Enum for ScrollBar direction.
       *
       * @zh
       * 滚动条方向。
       */
      ScrollBarDirection = /*#__PURE__*/function (ScrollBarDirection) {
        /**
         * @en
         * Horizontal scroll.
         *
         * @zh
         * 横向滚动。
         */
        ScrollBarDirection[ScrollBarDirection["HORIZONTAL"] = 0] = "HORIZONTAL";
        /**
         * @en
         * Vertical scroll.
         *
         * @zh
         * 纵向滚动。
         */
        ScrollBarDirection[ScrollBarDirection["VERTICAL"] = 1] = "VERTICAL";
        return ScrollBarDirection;
      }(ScrollBarDirection || {});
      ccenum(ScrollBarDirection);

      /**
       * @en
       * The ScrollBar control allows the user to scroll an image or other view that is too large to see completely.
       *
       * @zh
       * 滚动条组件。
       */
      _export("ScrollBar", ScrollBar = (_dec = ccclass('cc.ScrollBar'), _dec2 = help('i18n:cc.ScrollBar'), _dec3 = executionOrder(110), _dec4 = menu('UI/ScrollBar'), _dec5 = requireComponent(UITransform), _dec6 = type(Sprite), _dec7 = displayOrder(0), _dec8 = tooltip('i18n:scrollbar.handle'), _dec9 = type(ScrollBarDirection), _dec0 = displayOrder(1), _dec1 = tooltip('i18n:scrollbar.direction'), _dec10 = displayOrder(2), _dec11 = tooltip('i18n:scrollbar.auto_hide'), _dec12 = displayOrder(3), _dec13 = tooltip('i18n:scrollbar.auto_hide_time'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = (_class2 = (_ScrollBar = class ScrollBar extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_scrollView", _descriptor, this);
          _initializerDefineProperty(this, "_handle", _descriptor2, this);
          _initializerDefineProperty(this, "_direction", _descriptor3, this);
          _initializerDefineProperty(this, "_enableAutoHide", _descriptor4, this);
          _initializerDefineProperty(this, "_autoHideTime", _descriptor5, this);
          this._touching = false;
          this._opacity = 255;
          this._autoHideRemainingTime = 0;
        }

        /**
         * @en
         * The "handle" part of the ScrollBar.
         *
         * @zh
         * 作为当前滚动区域位置显示的滑块 Sprite。
         */
        get handle() {
          return this._handle;
        }
        set handle(value) {
          if (this._handle === value) {
            return;
          }
          this._handle = value;
          this.onScroll(Vec2.ZERO);
        }

        /**
         * @en
         * The direction of scrolling.
         *
         * @zh
         * ScrollBar 的滚动方向。
         */
        get direction() {
          return this._direction;
        }
        set direction(value) {
          if (this._direction === value) {
            return;
          }
          this._direction = value;
          this.onScroll(Vec2.ZERO);
        }

        /**
         * @en
         * Whether enable auto hide or not.
         *
         * @zh
         * 是否在没有滚动动作时自动隐藏 ScrollBar。
         */
        get enableAutoHide() {
          return this._enableAutoHide;
        }
        set enableAutoHide(value) {
          if (this._enableAutoHide === value) {
            return;
          }
          this._enableAutoHide = value;
          if (this._enableAutoHide) {
            this._setOpacity(0);
          }
        }

        /**
         * @en
         * The time to hide ScrollBar when scroll finished.
         * Note: This value is only useful when enableAutoHide is true.
         *
         * @zh
         * 没有滚动动作后经过多久会自动隐藏。<br/>
         * 注意：只要当 “enableAutoHide” 为 true 时，才有效。
         */
        get autoHideTime() {
          return this._autoHideTime;
        }
        set autoHideTime(value) {
          if (this._autoHideTime === value) {
            return;
          }
          this._autoHideTime = value;
        }
        /**
         * @en
         * Hide ScrollBar.
         *
         * @zh
         * 滚动条隐藏。
         */
        hide() {
          this._autoHideRemainingTime = 0;
          this._setOpacity(0);
        }

        /**
         * @en
         * Show ScrollBar.
         *
         * @zh
         * 滚动条显示。
         */
        show() {
          this._autoHideRemainingTime = this._autoHideTime;
          // because scrollbar's onEnable is later than scrollView, its _opacity is be modified in onEnable. we should reset it.
          this._opacity = 255;
          this._setOpacity(this._opacity);
        }

        /**
         * @en
         * Reset the position of ScrollBar.
         *
         * @zh
         * 重置滚动条位置。
         *
         * @param outOfBoundary @en Rolling displacement. @zh 滚动位移。
         */
        onScroll(outOfBoundary) {
          if (!this._scrollView) {
            return;
          }
          const content = this._scrollView.content;
          if (!content) {
            return;
          }
          const contentSize = content._getUITransformComp().contentSize;
          const scrollViewSize = this._scrollView.node._getUITransformComp().contentSize;
          const barSize = this.node._getUITransformComp().contentSize;
          if (this._conditionalDisableScrollBar(contentSize, scrollViewSize)) {
            return;
          }
          if (this._enableAutoHide) {
            this._autoHideRemainingTime = this._autoHideTime;
            this._setOpacity(this._opacity);
          }
          let contentMeasure = 0;
          let scrollViewMeasure = 0;
          let outOfBoundaryValue = 0;
          let contentPosition = 0;
          let handleNodeMeasure = 0;
          const outOfContentPosition = _tempVec2;
          outOfContentPosition.set(0, 0);
          if (this._direction === ScrollBarDirection.HORIZONTAL) {
            contentMeasure = contentSize.width;
            scrollViewMeasure = scrollViewSize.width;
            handleNodeMeasure = barSize.width;
            outOfBoundaryValue = outOfBoundary.x;
            this._convertToScrollViewSpace(outOfContentPosition, content);
            contentPosition = -outOfContentPosition.x;
          } else if (this._direction === ScrollBarDirection.VERTICAL) {
            contentMeasure = contentSize.height;
            scrollViewMeasure = scrollViewSize.height;
            handleNodeMeasure = barSize.height;
            outOfBoundaryValue = outOfBoundary.y;
            this._convertToScrollViewSpace(outOfContentPosition, content);
            contentPosition = -outOfContentPosition.y;
          }
          const length = this._calculateLength(contentMeasure, scrollViewMeasure, handleNodeMeasure, outOfBoundaryValue);
          const position = _tempVec2;
          this._calculatePosition(position, contentMeasure, scrollViewMeasure, handleNodeMeasure, contentPosition, outOfBoundaryValue, length);
          this._updateLength(length);
          this._updateHandlerPosition(position);
        }

        /**
         * @en
         * Sets the scroll view.
         *
         * @zh
         * 滚动视窗设置。
         *
         * @param scrollView @en The scroll view which is attached with this scroll bar. @zh 当前滚动条附着的滚动视窗。
         */
        setScrollView(scrollView) {
          this._scrollView = scrollView;
        }
        onTouchBegan() {
          if (!this._enableAutoHide) {
            return;
          }
          this._touching = true;
        }
        onTouchEnded() {
          if (!this._enableAutoHide) {
            return;
          }
          this._touching = false;
          if (this._autoHideTime <= 0) {
            return;
          }
          if (this._scrollView) {
            const content = this._scrollView.content;
            if (content) {
              const contentSize = content._getUITransformComp().contentSize;
              const scrollViewSize = this._scrollView.node._getUITransformComp().contentSize;
              if (this._conditionalDisableScrollBar(contentSize, scrollViewSize)) {
                return;
              }
            }
          }
          this._autoHideRemainingTime = this._autoHideTime;
        }
        onEnable() {
          const renderComp = this.node.getComponent(Sprite);
          if (renderComp) {
            this._opacity = renderComp.color.a;
          }
        }
        start() {
          if (this._enableAutoHide) {
            this._setOpacity(0);
          }
        }
        update(dt) {
          this._processAutoHide(dt);
        }
        _convertToScrollViewSpace(out, content) {
          const scrollTrans = this._scrollView && this._scrollView.node._getUITransformComp();
          const contentTrans = content._getUITransformComp();
          if (!scrollTrans || !contentTrans) {
            out.set(Vec2.ZERO);
          } else {
            _tempPos_1.set(-contentTrans.anchorX * contentTrans.width, -contentTrans.anchorY * contentTrans.height, 0);
            contentTrans.convertToWorldSpaceAR(_tempPos_1, _tempPos_2);
            const scrollViewSpacePos = scrollTrans.convertToNodeSpaceAR(_tempPos_2);
            scrollViewSpacePos.x += scrollTrans.anchorX * scrollTrans.width;
            scrollViewSpacePos.y += scrollTrans.anchorY * scrollTrans.height;
            out.set(scrollViewSpacePos.x, scrollViewSpacePos.y);
          }
        }
        _setOpacity(opacity) {
          if (this._handle) {
            let renderComp = this.node.getComponent(Sprite);
            if (renderComp) {
              _tempColor.set(renderComp.color);
              _tempColor.a = opacity;
              renderComp.color = _tempColor;
            }
            renderComp = this._handle.getComponent(Sprite);
            if (renderComp) {
              _tempColor.set(renderComp.color);
              _tempColor.a = opacity;
              renderComp.color = _tempColor;
            }
          }
        }
        _updateHandlerPosition(position) {
          if (this._handle) {
            const oldPosition = _tempVec3;
            this._fixupHandlerPosition(oldPosition);
            this._handle.node.setPosition(position.x + oldPosition.x, position.y + oldPosition.y, oldPosition.z);
          }
        }
        _fixupHandlerPosition(out) {
          const uiTrans = this.node._getUITransformComp();
          const barSize = uiTrans.contentSize;
          const barAnchor = uiTrans.anchorPoint;
          const handleSize = this.handle.node._getUITransformComp().contentSize;
          const handleParent = this.handle.node.parent;
          Vec3.set(_tempPos_1, -barSize.width * barAnchor.x, -barSize.height * barAnchor.y, 0);
          const leftBottomWorldPosition = this.node._getUITransformComp().convertToWorldSpaceAR(_tempPos_1, _tempPos_2);
          const fixupPosition = out;
          fixupPosition.set(0, 0, 0);
          handleParent._getUITransformComp().convertToNodeSpaceAR(leftBottomWorldPosition, fixupPosition);
          if (this.direction === ScrollBarDirection.HORIZONTAL) {
            fixupPosition.set(fixupPosition.x, fixupPosition.y + (barSize.height - handleSize.height) / 2, fixupPosition.z);
          } else if (this.direction === ScrollBarDirection.VERTICAL) {
            fixupPosition.set(fixupPosition.x + (barSize.width - handleSize.width) / 2, fixupPosition.y, fixupPosition.z);
          }
          this.handle.node.setPosition(fixupPosition);
        }
        _conditionalDisableScrollBar(contentSize, scrollViewSize) {
          if (contentSize.width <= scrollViewSize.width && this._direction === ScrollBarDirection.HORIZONTAL) {
            return true;
          }
          if (contentSize.height <= scrollViewSize.height && this._direction === ScrollBarDirection.VERTICAL) {
            return true;
          }
          return false;
        }
        _calculateLength(contentMeasure, scrollViewMeasure, handleNodeMeasure, outOfBoundary) {
          let denominatorValue = contentMeasure;
          if (outOfBoundary) {
            denominatorValue += (outOfBoundary > 0 ? outOfBoundary : -outOfBoundary) * GETTING_SHORTER_FACTOR;
          }
          const lengthRation = scrollViewMeasure / denominatorValue;
          return handleNodeMeasure * lengthRation;
        }
        _calculatePosition(out, contentMeasure, scrollViewMeasure, handleNodeMeasure, contentPosition, outOfBoundary, actualLenth) {
          let denominatorValue = contentMeasure - scrollViewMeasure;
          if (outOfBoundary) {
            denominatorValue += Math.abs(outOfBoundary);
          }
          let positionRatio = 0;
          if (denominatorValue) {
            positionRatio = contentPosition / denominatorValue;
            positionRatio = clamp01(positionRatio);
          }
          const position = (handleNodeMeasure - actualLenth) * positionRatio;
          if (this._direction === ScrollBarDirection.VERTICAL) {
            out.set(0, position);
          } else {
            out.set(position, 0);
          }
        }
        _updateLength(length) {
          if (this._handle) {
            const handleNode = this._handle.node;
            const handleTrans = handleNode._getUITransformComp();
            const handleNodeSize = handleTrans.contentSize;
            const anchor = handleTrans.anchorPoint;
            if (anchor.x !== defaultAnchor.x || anchor.y !== defaultAnchor.y) {
              handleTrans.setAnchorPoint(defaultAnchor);
            }
            if (this._direction === ScrollBarDirection.HORIZONTAL) {
              handleTrans.setContentSize(length, handleNodeSize.height);
            } else {
              handleTrans.setContentSize(handleNodeSize.width, length);
            }
          }
        }
        _processAutoHide(deltaTime) {
          if (!this._enableAutoHide || this._autoHideRemainingTime <= 0) {
            return;
          } else if (this._touching) {
            return;
          }
          this._autoHideRemainingTime -= deltaTime;
          if (this._autoHideRemainingTime <= this._autoHideTime) {
            this._autoHideRemainingTime = Math.max(0, this._autoHideRemainingTime);
            const opacity = this._opacity * (this._autoHideRemainingTime / this._autoHideTime);
            this._setOpacity(opacity);
          }
        }
      }, _ScrollBar.Direction = ScrollBarDirection, _ScrollBar), _applyDecoratedDescriptor(_class2.prototype, "handle", [_dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "handle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "direction", [_dec9, _dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "direction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableAutoHide", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "enableAutoHide"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "autoHideTime", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "autoHideTime"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_scrollView", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_handle", [serializable], {
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
          return ScrollBarDirection.HORIZONTAL;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_enableAutoHide", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_autoHideTime", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
      legacyCC.ScrollBar = ScrollBar;
    }
  };
});