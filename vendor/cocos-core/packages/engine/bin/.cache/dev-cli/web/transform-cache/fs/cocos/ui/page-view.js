System.register("q-bundled:///fs/cocos/ui/page-view.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../scene-graph/index.js", "../core/math/index.js", "../core/value-types/enum.js", "./layout.js", "./page-view-indicator.js", "./scroll-view.js", "./scroll-bar.js", "../core/platform/debug.js", "../core/data/utils/extends-enum.js", "../core/global-exports.js", "../scene-graph/node-event.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, tooltip, type, slide, range, visible, override, serializable, editable, EDITOR_NOT_IN_PREVIEW, ComponentEventHandler, v2, v3, Vec2, ccenum, Layout, PageViewIndicator, ScrollView, ScrollEventType, ScrollBar, warnID, logID, extendsEnum, legacyCC, NodeEventType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _PageView, _tempVec2, SizeMode, PageViewDirection, PageViewEventType, PageView;
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
      slide = _coreDataDecoratorsIndexJs.slide;
      range = _coreDataDecoratorsIndexJs.range;
      visible = _coreDataDecoratorsIndexJs.visible;
      override = _coreDataDecoratorsIndexJs.override;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_sceneGraphIndexJs) {
      ComponentEventHandler = _sceneGraphIndexJs.EventHandler;
    }, function (_coreMathIndexJs) {
      v2 = _coreMathIndexJs.v2;
      v3 = _coreMathIndexJs.v3;
      Vec2 = _coreMathIndexJs.Vec2;
    }, function (_coreValueTypesEnumJs) {
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_layoutJs) {
      Layout = _layoutJs.Layout;
    }, function (_pageViewIndicatorJs) {
      PageViewIndicator = _pageViewIndicatorJs.PageViewIndicator;
    }, function (_scrollViewJs) {
      ScrollView = _scrollViewJs.ScrollView;
      ScrollEventType = _scrollViewJs.ScrollViewEventType;
    }, function (_scrollBarJs) {
      ScrollBar = _scrollBarJs.ScrollBar;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
      logID = _corePlatformDebugJs.logID;
    }, function (_coreDataUtilsExtendsEnumJs) {
      extendsEnum = _coreDataUtilsExtendsEnumJs.extendsEnum;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
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
      _tempVec2 = new Vec2();
      /**
       * @en Enum for Page View Size Mode.
       *
       * @zh 页面视图每个页面统一的大小类型。
       */
      SizeMode = /*#__PURE__*/function (SizeMode) {
        /**
         * @en Each page is unified in size.
         * @zh 每个页面统一大小。
         */
        SizeMode[SizeMode["Unified"] = 0] = "Unified";
        /**
         * @en Each page is in free size.
         * @zh 每个页面大小随意。
         */
        SizeMode[SizeMode["Free"] = 1] = "Free";
        return SizeMode;
      }(SizeMode || {});
      ccenum(SizeMode);

      /**
       * @en Enum for Page View Direction.
       *
       * @zh 页面视图滚动类型。
       */
      PageViewDirection = /*#__PURE__*/function (PageViewDirection) {
        /**
         * @en Horizontal scroll.
         * @zh 水平滚动。
         */
        PageViewDirection[PageViewDirection["HORIZONTAL"] = 0] = "HORIZONTAL";
        /**
         * @en Vertical scroll.
         * @zh 垂直滚动。
         */
        PageViewDirection[PageViewDirection["VERTICAL"] = 1] = "VERTICAL";
        return PageViewDirection;
      }(PageViewDirection || {});
      ccenum(PageViewDirection);

      /**
       * @en Enum for ScrollView event type.
       *
       * @zh 滚动视图事件类型。
       */
      PageViewEventType = /*#__PURE__*/function (PageViewEventType) {
        PageViewEventType["PAGE_TURNING"] = "page-turning";
        return PageViewEventType;
      }(PageViewEventType || {});
      /**
       * @en
       * The PageView control.
       *
       * @zh
       * 页面视图组件。
       */
      _export("PageView", PageView = (_dec = ccclass('cc.PageView'), _dec2 = help('i18n:cc.PageView'), _dec3 = executionOrder(110), _dec4 = menu('UI/PageView'), _dec5 = type(SizeMode), _dec6 = tooltip('i18n:pageview.sizeMode'), _dec7 = type(PageViewDirection), _dec8 = tooltip('i18n:pageview.direction'), _dec9 = range([0, 1, 0.01]), _dec0 = tooltip('i18n:pageview.scrollThreshold'), _dec1 = range([0, 1, 0.01]), _dec10 = tooltip('i18n:pageview.pageTurningEventTiming'), _dec11 = type(PageViewIndicator), _dec12 = tooltip('i18n:pageview.indicator'), _dec13 = tooltip('i18n:pageview.autoPageTurningThreshold'), _dec14 = type(ScrollBar), _dec15 = visible(false), _dec16 = type(ScrollBar), _dec17 = visible(false), _dec18 = visible(false), _dec19 = visible(false), _dec20 = visible(false), _dec21 = type([ComponentEventHandler]), _dec22 = visible(false), _dec23 = tooltip('i18n:pageview.pageTurningSpeed'), _dec24 = type([ComponentEventHandler]), _dec25 = tooltip('i18n:pageview.pageEvents'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = (_PageView = class PageView extends ScrollView {
        /**
         * @en
         * Specify the size type of each page in PageView.
         *
         * @zh
         * 页面视图中每个页面大小类型。
         */
        get sizeMode() {
          return this._sizeMode;
        }
        set sizeMode(value) {
          if (this._sizeMode === value) {
            return;
          }
          this._sizeMode = value;
          this._syncSizeMode();
        }

        /**
         * @en
         * The page view direction.
         *
         * @zh
         * 页面视图滚动类型。
         */
        get direction() {
          return this._direction;
        }
        set direction(value) {
          if (this._direction === value) {
            return;
          }
          this._direction = value;
          this._syncScrollDirection();
        }

        /**
         * @en
         * The scroll threshold value, when drag exceeds this value,
         * release the next page will automatically scroll, less than the restore.
         *
         * @zh
         * 滚动临界值，默认单位百分比，当拖拽超出该数值时，松开会自动滚动下一页，小于时则还原。
         */
        get scrollThreshold() {
          return this._scrollThreshold;
        }
        set scrollThreshold(value) {
          if (this._scrollThreshold === value) {
            return;
          }
          this._scrollThreshold = value;
        }

        /**
         * @en
         * Change the PageTurning event timing of PageView.
         *
         * @zh
         * 设置 PageView PageTurning 事件的发送时机。
         */
        get pageTurningEventTiming() {
          return this._pageTurningEventTiming;
        }
        set pageTurningEventTiming(value) {
          if (this._pageTurningEventTiming === value) {
            return;
          }
          this._pageTurningEventTiming = value;
        }

        /**
         * @en
         * The Page View Indicator.
         *
         * @zh
         * 页面视图指示器组件。
         */
        get indicator() {
          return this._indicator;
        }
        set indicator(value) {
          if (this._indicator === value) {
            return;
          }
          this._indicator = value;
          if (this.indicator) {
            this.indicator.setPageView(this);
          }
        }
        get curPageIdx() {
          return this._curPageIdx;
        }

        /**
         * @en Enum for Page View Size Mode.
         * @zh 页面视图每个页面统一的大小类型。
         */

        /**
         * @en
         * The vertical scrollbar reference.
         * @zh
         * 垂直滚动的 ScrollBar。
         */
        get verticalScrollBar() {
          return super.verticalScrollBar;
        }
        set verticalScrollBar(value) {
          super.verticalScrollBar = value;
        }

        /**
         * @en
         * The horizontal scrollbar reference.
         * @zh
         * 水平滚动的 ScrollBar。
         */
        get horizontalScrollBar() {
          return super.horizontalScrollBar;
        }
        set horizontalScrollBar(value) {
          super.horizontalScrollBar = value;
        }

        /**
         * @en
         * Enable horizontal scroll.
         * @zh
         * 是否开启水平滚动。
         */

        constructor() {
          super();
          /**
           * @en
           * Auto page turning velocity threshold. When users swipe the PageView quickly,
           * it will calculate a velocity based on the scroll distance and time,
           * if the calculated velocity is larger than the threshold, then it will trigger page turning.
           *
           * @zh
           * 快速滑动翻页临界值。
           * 当用户快速滑动时，会根据滑动开始和结束的距离与时间计算出一个速度值，
           * 该值与此临界值相比较，如果大于临界值，则进行自动翻页。
           */
          _initializerDefineProperty(this, "autoPageTurningThreshold", _descriptor, this);
          _initializerDefineProperty(this, "horizontal", _descriptor2, this);
          /**
           * @en
           * Enable vertical scroll.
           * @zh
           * 是否开启垂直滚动。
           */
          _initializerDefineProperty(this, "vertical", _descriptor3, this);
          /**
           * @en
           * If cancelInnerEvents is set to true, the scroll behavior will cancel touch events on inner content nodes
           * It's set to true by default.
           * @zh
           * 如果这个属性被设置为 true，那么滚动行为会取消子节点上注册的触摸事件，默认被设置为 true。<br/>
           * 注意，子节点上的 touchstart 事件仍然会触发，触点移动距离非常短的情况下 touchmove 和 touchend 也不会受影响。
           */
          _initializerDefineProperty(this, "cancelInnerEvents", _descriptor4, this);
          /**
           * @en
           * ScrollView events callback.
           * @zh
           * 滚动视图的事件回调函数。
           */
          _initializerDefineProperty(this, "scrollEvents", _descriptor5, this);
          /**
           * @en The time required to turn over a page, unit: second.
           * @zh 每个页面翻页时所需时间，单位：秒。
           */
          _initializerDefineProperty(this, "pageTurningSpeed", _descriptor6, this);
          /**
           * @en PageView events callback.
           * @zh 滚动视图的事件回调函数。
           */
          _initializerDefineProperty(this, "pageEvents", _descriptor7, this);
          _initializerDefineProperty(this, "_sizeMode", _descriptor8, this);
          _initializerDefineProperty(this, "_direction", _descriptor9, this);
          _initializerDefineProperty(this, "_scrollThreshold", _descriptor0, this);
          _initializerDefineProperty(this, "_pageTurningEventTiming", _descriptor1, this);
          _initializerDefineProperty(this, "_indicator", _descriptor10, this);
          this._curPageIdx = 0;
          this._lastPageIdx = 0;
          this._pages = [];
          this._initContentPos = v3();
          this._scrollCenterOffsetX = [];
          // 每一个页面居中时需要的偏移量（X）
          this._scrollCenterOffsetY = [];
          // 每一个页面居中时需要的偏移量（Y）
          this._touchBeganPosition = v2();
          this._touchEndPosition = v2();
        }
        onEnable() {
          super.onEnable();
          this.node.on(NodeEventType.SIZE_CHANGED, this._updateAllPagesSize, this);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.node.on(PageView.EventType.SCROLL_ENG_WITH_THRESHOLD, this._dispatchPageTurningEvent, this);
          }
        }
        onDisable() {
          super.onDisable();
          this.node.off(NodeEventType.SIZE_CHANGED, this._updateAllPagesSize, this);
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.node.off(PageView.EventType.SCROLL_ENG_WITH_THRESHOLD, this._dispatchPageTurningEvent, this);
          }
        }
        onLoad() {
          this._initPages();
          if (this.indicator) {
            this.indicator.setPageView(this);
          }
        }

        /**
         * @en
         * Returns current page index.
         *
         * @zh
         * 返回当前页面索引。
         *
         * @returns @en Current page index of this page view. @zh 当前页面索引。
         */
        getCurrentPageIndex() {
          return this._curPageIdx;
        }

        /**
         * @en
         * Set current page index.
         *
         * @zh
         * 设置当前页面索引。
         * @param index @en The page index to scroll to. @zh 需要滚动到的页面索引。
         */
        setCurrentPageIndex(index) {
          this.scrollToPage(index, 1);
        }

        /**
         * @en
         * Returns all pages of pageview.
         *
         * @zh
         * 返回视图中的所有页面。
         *
         * @returns @en return all pages of this page view. @zh 返回当前视图所有页面。
         */
        getPages() {
          return this._pages;
        }

        /**
         * @en
         * At the end of the current page view to insert a new view.
         *
         * @zh
         * 在当前页面视图的尾部插入一个新视图。
         *
         * @param page @en New page to add to this page view. @zh 新加入的视图。
         */
        addPage(page) {
          if (!page || this._pages.indexOf(page) !== -1 || !this.content) {
            return;
          }
          if (!page._getUITransformComp()) {
            logID(4301);
            return;
          }
          this.content.addChild(page);
          this._pages.push(page);
          this._updatePageView();
        }

        /**
         * @en
         * Inserts a page in the specified location.
         *
         * @zh
         * 将页面插入指定位置中。
         *
         * @param page @en New page to insert to this page view. @zh 新插入的视图。
         * @param index @en The index of new page to be inserted. @zh 新插入视图的索引。
         */
        insertPage(page, index) {
          if (index < 0 || !page || this._pages.indexOf(page) !== -1 || !this.content) {
            return;
          }
          const pageCount = this._pages.length;
          if (index >= pageCount) {
            this.addPage(page);
          } else {
            if (!page._getUITransformComp()) {
              logID(4301);
              return;
            }
            this._pages.splice(index, 0, page);
            this.content.insertChild(page, index);
            this._updatePageView();
          }
        }

        /**
         * @en
         * Removes a page from PageView.
         *
         * @zh
         * 移除指定页面。
         *
         * @param page @en The page to be removed. @zh 将被移除的页面。
         */
        removePage(page) {
          if (!page || !this.content) {
            return;
          }
          const index = this._pages.indexOf(page);
          if (index === -1) {
            warnID(4300, page.name);
            return;
          }
          this.removePageAtIndex(index);
        }

        /**
         * @en
         * Removes a page at index of PageView.
         *
         * @zh
         * 移除指定下标的页面。
         *
         * @param index @en The index of the page to be removed. @zh 将被移除界面的页面下标。
         */
        removePageAtIndex(index) {
          const pageList = this._pages;
          if (index < 0 || index >= pageList.length) {
            return;
          }
          const page = pageList[index];
          if (!page || !this.content) {
            return;
          }
          this.content.removeChild(page);
          pageList.splice(index, 1);
          this._updatePageView();
        }

        /**
         * @en
         * Removes all pages from PageView.
         *
         * @zh
         * 移除所有页面。
         */
        removeAllPages() {
          if (!this.content) {
            return;
          }
          const locPages = this._pages;
          for (let i = 0, len = locPages.length; i < len; i++) {
            this.content.removeChild(locPages[i]);
          }
          this._pages.length = 0;
          this._updatePageView();
        }

        /**
         * @en
         * Scroll PageView to index.
         *
         * @zh
         * 滚动到指定页面
         *
         * @param idx @en The index of page to be scroll to. @zh 希望滚动到的页面下标。
         * @param timeInSecond @en How long time to scroll to the page, in seconds. @zh 滚动到指定页面所需时间，单位：秒。
         */
        scrollToPage(idx, timeInSecond = 0.3) {
          if (idx < 0 || idx >= this._pages.length) {
            return;
          }
          this._curPageIdx = idx;
          this.scrollToOffset(this._moveOffsetValue(idx), timeInSecond, true);
          if (this.indicator) {
            this.indicator._changedState();
          }
        }

        // override the method of ScrollView
        getScrollEndedEventTiming() {
          return this.pageTurningEventTiming;
        }

        // 刷新页面视图
        _updatePageView() {
          // 当页面数组变化时修改 content 大小
          if (!this.content) {
            return;
          }
          const layout = this.content.getComponent(Layout);
          if (layout && layout.enabled) {
            layout.updateLayout();
          }
          const pageCount = this._pages.length;
          if (this._curPageIdx >= pageCount) {
            this._curPageIdx = pageCount === 0 ? 0 : pageCount - 1;
            this._lastPageIdx = this._curPageIdx;
          }
          // 进行排序
          const contentPos = this._initContentPos;
          for (let i = 0; i < pageCount; ++i) {
            const page = this._pages[i];
            // page.setSiblingIndex(i);
            const pos = page.position;
            if (this.direction === PageViewDirection.HORIZONTAL) {
              this._scrollCenterOffsetX[i] = Math.abs(contentPos.x + pos.x);
            } else {
              this._scrollCenterOffsetY[i] = Math.abs(contentPos.y + pos.y);
            }
          }

          // 刷新 indicator 信息与状态
          if (this.indicator) {
            this.indicator._refresh();
          }
        }

        // 刷新所有页面的大小
        _updateAllPagesSize() {
          const viewTrans = this.view;
          if (!this.content || !viewTrans) {
            return;
          }
          if (this._sizeMode !== SizeMode.Unified) {
            return;
          }
          const locPages = EDITOR_NOT_IN_PREVIEW ? this.content.children : this._pages;
          const selfSize = viewTrans.contentSize;
          for (let i = 0, len = locPages.length; i < len; i++) {
            locPages[i]._getUITransformComp().setContentSize(selfSize);
          }
        }
        _handleReleaseLogic() {
          this._autoScrollToPage();
          if (this._scrolling) {
            this._scrolling = false;
            if (!this._autoScrolling) {
              this._dispatchEvent(PageView.EventType.SCROLL_ENDED);
            }
          }
        }
        _onTouchBegan(event, captureListeners) {
          event.touch.getUILocation(_tempVec2);
          Vec2.set(this._touchBeganPosition, _tempVec2.x, _tempVec2.y);
          super._onTouchBegan(event, captureListeners);
        }
        _onTouchMoved(event, captureListeners) {
          super._onTouchMoved(event, captureListeners);
        }
        _onTouchEnded(event, captureListeners) {
          event.touch.getUILocation(_tempVec2);
          Vec2.set(this._touchEndPosition, _tempVec2.x, _tempVec2.y);
          super._onTouchEnded(event, captureListeners);
        }
        _onTouchCancelled(event, captureListeners) {
          event.touch.getUILocation(_tempVec2);
          Vec2.set(this._touchEndPosition, _tempVec2.x, _tempVec2.y);
          super._onTouchCancelled(event, captureListeners);
        }
        _onMouseWheel() {}
        _syncScrollDirection() {
          this.horizontal = this.direction === PageViewDirection.HORIZONTAL;
          this.vertical = this.direction === PageViewDirection.VERTICAL;
        }
        _syncSizeMode() {
          const viewTrans = this.view;
          if (!this.content || !viewTrans) {
            return;
          }
          const layout = this.content.getComponent(Layout);
          if (layout) {
            if (this._sizeMode === SizeMode.Free && this._pages.length > 0) {
              const firstPageTrans = this._pages[0]._getUITransformComp();
              const lastPageTrans = this._pages[this._pages.length - 1]._getUITransformComp();
              if (this.direction === PageViewDirection.HORIZONTAL) {
                layout.paddingLeft = (viewTrans.width - firstPageTrans.width) / 2;
                layout.paddingRight = (viewTrans.width - lastPageTrans.width) / 2;
              } else if (this.direction === PageViewDirection.VERTICAL) {
                layout.paddingTop = (viewTrans.height - firstPageTrans.height) / 2;
                layout.paddingBottom = (viewTrans.height - lastPageTrans.height) / 2;
              }
            }
            layout.updateLayout();
          }
        }

        // 初始化页面
        _initPages() {
          if (!this.content) {
            return;
          }
          this._initContentPos = this.content.position;
          const children = this.content.children;
          for (let i = 0; i < children.length; ++i) {
            const page = children[i];
            if (this._pages.indexOf(page) >= 0) {
              continue;
            }
            this._pages.push(page);
          }
          this._syncScrollDirection();
          this._syncSizeMode();
          this._updatePageView();
        }
        _dispatchPageTurningEvent() {
          if (this._lastPageIdx === this._curPageIdx) {
            return;
          }
          this._lastPageIdx = this._curPageIdx;
          ComponentEventHandler.emitEvents(this.pageEvents, this, PageViewEventType.PAGE_TURNING);
          this.node.emit(PageViewEventType.PAGE_TURNING, this);
        }

        // 快速滑动
        _isQuicklyScrollable(touchMoveVelocity) {
          if (this.direction === PageViewDirection.HORIZONTAL) {
            if (Math.abs(touchMoveVelocity.x) > this.autoPageTurningThreshold) {
              return true;
            }
          } else if (this.direction === PageViewDirection.VERTICAL) {
            if (Math.abs(touchMoveVelocity.y) > this.autoPageTurningThreshold) {
              return true;
            }
          }
          return false;
        }

        // 通过 idx 获取偏移值数值
        _moveOffsetValue(idx) {
          const offset = new Vec2();
          if (this._sizeMode === SizeMode.Free) {
            if (this.direction === PageViewDirection.HORIZONTAL) {
              offset.x = this._scrollCenterOffsetX[idx];
            } else if (this.direction === PageViewDirection.VERTICAL) {
              offset.y = this._scrollCenterOffsetY[idx];
            }
          } else {
            const viewTrans = this.view;
            if (!viewTrans) {
              return offset;
            }
            if (this.direction === PageViewDirection.HORIZONTAL) {
              offset.x = idx * viewTrans.width;
            } else if (this.direction === PageViewDirection.VERTICAL) {
              offset.y = idx * viewTrans.height;
            }
          }
          return offset;
        }
        _getDragDirection(moveOffset) {
          if (this._direction === PageViewDirection.HORIZONTAL) {
            if (moveOffset.x === 0) {
              return 0;
            }
            return moveOffset.x > 0 ? 1 : -1;
          } else {
            // 由于滚动 Y 轴的原点在在右上角所以应该是小于 0
            if (moveOffset.y === 0) {
              return 0;
            }
            return moveOffset.y < 0 ? 1 : -1;
          }
        }

        // 是否超过自动滚动临界值
        _isScrollable(offset, index, nextIndex) {
          if (this._sizeMode === SizeMode.Free) {
            let curPageCenter = 0;
            let nextPageCenter = 0;
            if (this.direction === PageViewDirection.HORIZONTAL) {
              curPageCenter = this._scrollCenterOffsetX[index];
              nextPageCenter = this._scrollCenterOffsetX[nextIndex];
              return Math.abs(offset.x) >= Math.abs(curPageCenter - nextPageCenter) * this.scrollThreshold;
            } else if (this.direction === PageViewDirection.VERTICAL) {
              curPageCenter = this._scrollCenterOffsetY[index];
              nextPageCenter = this._scrollCenterOffsetY[nextIndex];
              return Math.abs(offset.y) >= Math.abs(curPageCenter - nextPageCenter) * this.scrollThreshold;
            }
          } else {
            const viewTrans = this.view;
            if (!viewTrans) {
              return false;
            }
            if (this.direction === PageViewDirection.HORIZONTAL) {
              return Math.abs(offset.x) >= viewTrans.width * this.scrollThreshold;
            } else if (this.direction === PageViewDirection.VERTICAL) {
              return Math.abs(offset.y) >= viewTrans.height * this.scrollThreshold;
            }
          }
          return false;
        }
        _autoScrollToPage() {
          const bounceBackStarted = this._startBounceBackIfNeeded();
          if (bounceBackStarted) {
            const bounceBackAmount = this._getHowMuchOutOfBoundary();
            this._clampDelta(bounceBackAmount);
            if (bounceBackAmount.x > 0 || bounceBackAmount.y < 0) {
              this._curPageIdx = this._pages.length === 0 ? 0 : this._pages.length - 1;
            }
            if (bounceBackAmount.x < 0 || bounceBackAmount.y > 0) {
              this._curPageIdx = 0;
            }
            if (this.indicator) {
              this.indicator._changedState();
            }
          } else {
            const moveOffset = new Vec2();
            Vec2.subtract(moveOffset, this._touchBeganPosition, this._touchEndPosition);
            const index = this._curPageIdx;
            const nextIndex = index + this._getDragDirection(moveOffset);
            const timeInSecond = this.pageTurningSpeed * Math.abs(index - nextIndex);
            if (nextIndex < this._pages.length) {
              if (this._isScrollable(moveOffset, index, nextIndex)) {
                this.scrollToPage(nextIndex, timeInSecond);
                return;
              } else {
                const touchMoveVelocity = this._calculateTouchMoveVelocity();
                if (this._isQuicklyScrollable(touchMoveVelocity)) {
                  this.scrollToPage(nextIndex, timeInSecond);
                  return;
                }
              }
            }
            this.scrollToPage(index, timeInSecond);
          }
        }
      }, _PageView.SizeMode = SizeMode, _PageView.Direction = PageViewDirection, _PageView.EventType = extendsEnum(PageViewEventType, ScrollEventType), _PageView), _applyDecoratedDescriptor(_class2.prototype, "sizeMode", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "sizeMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "direction", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "direction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "scrollThreshold", [slide, _dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "scrollThreshold"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "pageTurningEventTiming", [slide, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "pageTurningEventTiming"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "indicator", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "indicator"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "autoPageTurningThreshold", [serializable, _dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 100;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "verticalScrollBar", [_dec14, override, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "verticalScrollBar"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "horizontalScrollBar", [_dec16, override, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "horizontalScrollBar"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "horizontal", [override, serializable, _dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "vertical", [override, serializable, _dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "cancelInnerEvents", [override, serializable, _dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "scrollEvents", [_dec21, serializable, override, _dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "pageTurningSpeed", [serializable, editable, _dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.3;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "pageEvents", [_dec24, serializable, _dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_sizeMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SizeMode.Unified;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_direction", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PageViewDirection.HORIZONTAL;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_scrollThreshold", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.5;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_pageTurningEventTiming", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_indicator", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
      /**
       * @en
       * Note: This event is emitted from the node to which the component belongs.
       * @zh
       * 注意：此事件是从该组件所属的 Node 上面派发出来的，需要用 node.on 来监听。
       * @event page-turning
       * @param event
       * @param pageView - The PageView component.
       */
      legacyCC.PageView = PageView;
    }
  };
});