System.register("q-bundled:///fs/cocos/2d/components/ui-static-batch.js", ["../../core/data/decorators/index.js", "../framework/ui-renderer.js", "../renderer/draw-batch.js", "../../core/index.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, executionOrder, visible, override, UIRenderer, DrawBatch2D, warnID, director, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, UIStaticBatch;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      visible = _coreDataDecoratorsIndexJs.visible;
      override = _coreDataDecoratorsIndexJs.override;
    }, function (_frameworkUiRendererJs) {
      UIRenderer = _frameworkUiRendererJs.UIRenderer;
    }, function (_rendererDrawBatchJs) {
      DrawBatch2D = _rendererDrawBatchJs.DrawBatch2D;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
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
       * @en
       * Static batch component of UI.
       * This component is placed on the root node of all node objects that need to be batch.
       * Only sprites and label participate in the batch.
       * Static batch must be enabled manually, otherwise dynamic batch is still used.
       * Note: Do not place mask, Graphics, and objects such as UI models or particles under child nodes,
       * otherwise rendering will be skipped after static batching is enabled.
       *
       * @zh
       * UI 静态合批组件。
       * 该组件放在所有需要被静态合批的节点对象的根节点上，子节点放置对象必须是精灵和文本，其余对象不参与静态合批。
       * 用户必须通过手动方式启用收集静态合批数据[[markAsDirty]]，否则合批方式仍然采用动态合批（采集数据的流程相同）。此后渲染的内容是采用收集到的合批渲染数据，子节点的任何修改将不再有效。
       * 注意：子节点下不要放置 Mask，Graphics，以及 UI 模型或者粒子之类对象，否则会在启用完静态合批后跳过渲染。
       *
       * @deprecated Since v3.4.1, We have adopted a new rendering batching policy in v3.4.1,
       * which will result in an effective performance improvement for normal dynamic batching components,
       * so manual management with the UIStaticBatch component is no longer recommended and will be removed in the future
       */
      _export("UIStaticBatch", UIStaticBatch = (_dec = ccclass('cc.UIStaticBatch'), _dec2 = help('i18n:cc.UIStaticBatch'), _dec3 = menu('2D/UIStaticBatch'), _dec4 = executionOrder(110), _dec5 = visible(false), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = class UIStaticBatch extends UIRenderer {
        constructor() {
          super();
          this._init = false;
          this._bufferAccessor = null;
          this._dirty = true;
          this._uiDrawBatchList = [];
        }
        get color() {
          return this._color;
        }
        set color(value) {
          if (this._color === value) {
            return;
          }
          this._color.set(value);
        }
        get drawBatchList() {
          return this._uiDrawBatchList;
        }
        postUpdateAssembler(render) {
          // if (this._dirty) {
          //     this._dirty = false;
          //     this._init = true;
          //     this.node._static = true;
          //     render.endStaticBatch();
          //     this._bufferAccessor!.uploadBuffers();
          // }
          // render.currIsStatic = false;
        }

        /**
         * @en
         * Recollect data tags.
         * The render data will be recollected during the render phase of the current frame, and the next frame will be rendered using fixed data.
         * Note: 尽量不要频繁调用此接口, 会有一定内存损耗.
         *
         * @zh
         * 重新采集数据标记，会在当前帧的渲染阶段重新采集渲染数据，下一帧开始将会使用固定数据进行渲染。
         * 注意：尽量不要频繁调用此接口，因为会清空原先存储的 ia 数据重新采集，会有一定内存损耗。
         */
        markAsDirty() {

          // this.node._static = false;
          // this._dirty = true;
          // this._init = false;
          // this._clearData();
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _requireDrawBatch() {
          const batch = new DrawBatch2D();
          batch.isStatic = true;
          this._uiDrawBatchList.push(batch);
          return batch;
        }
        _clearData() {
          if (this._bufferAccessor) {
            this._bufferAccessor.reset();
            const ui = this._getBatcher();
            for (let i = 0; i < this._uiDrawBatchList.length; i++) {
              const element = this._uiDrawBatchList[i];
              element.destroy(ui);
            }
          }
          this._uiDrawBatchList.length = 0;
          this._init = false;
        }
        _getBatcher() {
          if (director.root && director.root.batcher2D) {
            return director.root.batcher2D;
          }
          warnID(9301);
          return null;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "color", [override, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});