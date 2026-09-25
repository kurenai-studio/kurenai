System.register("q-bundled:///fs/cocos/sorting/sorting.js", ["../core/data/decorators/index.js", "../core/math/index.js", "./sorting-layers.js", "../scene-graph/component.js", "../core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var ccclass, disallowMultiple, editable, executeInEditMode, help, menu, range, serializable, type, clamp, SortingLayers, Component, warnID, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, MAX_INT16, MIN_INT16, Sorting;
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
    }, function (_coreMathIndexJs) {
      clamp = _coreMathIndexJs.clamp;
    }, function (_sortingLayersJs) {
      SortingLayers = _sortingLayersJs.SortingLayers;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
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
      MAX_INT16 = (1 << 15) - 1;
      MIN_INT16 = -1 << 15;
      /**
       * @en
       * Render sort component. This component must be placed on a node with a [[MeshRenderer]] or [[SpriteRenderer]] component.
       *
       * @zh
       * 渲染排序组件。该组件必须放置在带有 [[MeshRenderer]] 或者 [[SpriteRenderer]] 组件的节点上。
       */
      _export("Sorting", Sorting = (_dec = ccclass('cc.Sorting'), _dec2 = menu('Sorting/Sorting'), _dec3 = help('i18n:cc.Sorting'), _dec4 = type(SortingLayers.Enum), _dec5 = range([MIN_INT16, MAX_INT16, 1]), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class Sorting extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_sortingLayer", _descriptor, this);
          // Actually saved id
          _initializerDefineProperty(this, "_sortingOrder", _descriptor2, this);
          this._modelRenderer = null;
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
          this._modelRenderer = this.getComponent('cc.ModelRenderer');
          if (!this._modelRenderer) {
            warnID(16301, this.node.name);
          }
          this._updateSortingPriority();
        }
        _updateSortingPriority() {
          const sortingLayerValue = SortingLayers.getLayerIndex(this._sortingLayer);
          const sortingPriority = SortingLayers.getSortingPriority(sortingLayerValue, this._sortingOrder);
          if (this._modelRenderer && this._modelRenderer.isValid) {
            this._modelRenderer.priority = sortingPriority;
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "sortingLayer", [editable, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "sortingLayer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "sortingOrder", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "sortingOrder"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_sortingLayer", [serializable], {
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
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});