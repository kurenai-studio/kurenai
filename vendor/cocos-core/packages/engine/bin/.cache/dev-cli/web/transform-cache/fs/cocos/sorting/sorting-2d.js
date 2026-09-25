System.register("q-bundled:///fs/cocos/sorting/sorting-2d.js", ["../core/data/decorators/index.js", "../core/math/index.js", "./sorting-layers.js", "../scene-graph/component.js", "../core/platform/debug.js", "../2d/framework/ui-renderer.js", "../2d/renderer/batcher-2d.js"], function (_export, _context) {
  "use strict";

  var ccclass, disallowMultiple, editable, executeInEditMode, help, menu, range, serializable, type, requireComponent, clamp, SortingLayers, Component, warnID, UIRenderer, _setSorting2DCount, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, MAX_INT16, MIN_INT16, sorting2DCount, Sorting2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      editable = _coreDataDecoratorsIndexJs.editable;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
    }, function (_coreMathIndexJs) {
      clamp = _coreMathIndexJs.clamp;
    }, function (_sortingLayersJs) {
      SortingLayers = _sortingLayersJs.SortingLayers;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
    }, function (_dFrameworkUiRendererJs) {
      UIRenderer = _dFrameworkUiRendererJs.UIRenderer;
    }, function (_dRendererBatcher2dJs) {
      _setSorting2DCount = _dRendererBatcher2dJs._setSorting2DCount;
    }],
    execute: function () {
      /*
       Copyright (c) 2025 Xiamen Yaji Software Co., Ltd.
      
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
      MAX_INT16 = (1 << 15) - 1;
      MIN_INT16 = -1 << 15;
      sorting2DCount = 0;
      /**
       * @en
       * 2D Render sort component.
       *
       * @zh
       * 2D 渲染排序组件。
       */
      _export("Sorting2D", Sorting2D = (_dec = ccclass('cc.Sorting2D'), _dec2 = menu('Sorting/Sorting2D'), _dec3 = help('i18n:cc.Sorting2D'), _dec4 = requireComponent(UIRenderer), _dec5 = type(SortingLayers.Enum), _dec6 = range([MIN_INT16, MAX_INT16, 1]), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = _dec4(_class = (_class2 = class Sorting2D extends Component {
        constructor() {
          super();
          this._isSorting2DEnabled = false;
          _initializerDefineProperty(this, "_sortingLayer", _descriptor, this);
          // Actually saved id
          _initializerDefineProperty(this, "_sortingOrder", _descriptor2, this);
          this._uiRenderer = null;
        }

        /**
         * @zh 组件所属排序层 id，影响组件的渲染排序。
         * @en The sorting layer id of the component, which affects the rendering order of the component.
         */
        get sortingLayer() {
          return this._sortingLayer;
        }
        set sortingLayer(val) {
          if (val === this._sortingLayer || !SortingLayers.isLayerValid(val)) return;
          this._sortingLayer = val;
          this._updateSortingPriority();
        }

        /**
         * @zh 组件在当前排序层中的顺序，在默认排序规则中，越小越先渲染。
         * @en Model Renderer's order within a sorting layer. In the default sorting rule, smaller values are rendered first.
         */
        get sortingOrder() {
          return this._sortingOrder;
        }
        set sortingOrder(val) {
          if (val === this._sortingOrder) return;
          this._sortingOrder = clamp(val, MIN_INT16, MAX_INT16);
          this._updateSortingPriority();
        }
        __preload() {
          this._uiRenderer = this.getComponent(UIRenderer);
          if (!this._uiRenderer) {
            warnID(16300, this.node.name);
          }
        }
        onEnable() {
          this._isSorting2DEnabled = true;
          this._updateSortingPriority();
          ++sorting2DCount;
          _setSorting2DCount(sorting2DCount);
        }
        onDisable() {
          this._isSorting2DEnabled = false;
          this._updateSortingPriority();
          --sorting2DCount;
          _setSorting2DCount(sorting2DCount);
        }
        _updateSortingPriority() {
          const uiRenderer = this._uiRenderer;
          if (uiRenderer && uiRenderer.isValid) {
            if (this._isSorting2DEnabled) {
              const sortingLayerValue = SortingLayers.getLayerIndex(this._sortingLayer);
              const sortingPriority = SortingLayers.getSortingPriority(sortingLayerValue, this._sortingOrder);
              uiRenderer.priority = sortingPriority;
            } else {
              uiRenderer.priority = SortingLayers.getDefaultPriority();
            }
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "sortingLayer", [editable, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "sortingLayer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "sortingOrder", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "sortingOrder"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_sortingLayer", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SortingLayers.Enum.default;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_sortingOrder", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
    }
  };
});