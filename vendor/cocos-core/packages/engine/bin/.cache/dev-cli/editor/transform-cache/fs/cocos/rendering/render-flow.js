System.register("q-bundled:///fs/cocos/rendering/render-flow.js", ["../core/data/decorators/index.js", "./render-stage.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, serializable, type, RenderStage, cclegacy, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, RenderFlow;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_renderStageJs) {
      RenderStage = _renderStageJs.RenderStage;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en Render flow information descriptor
       * @zh 渲染流程描述信息。
       */
      /**
       * @en Render flow is a sub process of the [[RenderPipeline]], it dispatch the render task to all the [[RenderStage]]s.
       * @zh 渲染流程是渲染管线（[[RenderPipeline]]）的一个子过程，它将渲染任务派发到它的所有渲染阶段（[[RenderStage]]）中执行。
       */
      _export("RenderFlow", RenderFlow = (_dec = ccclass('RenderFlow'), _dec2 = displayOrder(0), _dec3 = displayOrder(1), _dec4 = displayOrder(2), _dec5 = displayOrder(3), _dec6 = type([RenderStage]), _dec(_class = (_class2 = class RenderFlow {
        constructor() {
          _initializerDefineProperty(this, "_name", _descriptor, this);
          _initializerDefineProperty(this, "_priority", _descriptor2, this);
          _initializerDefineProperty(this, "_tag", _descriptor3, this);
          _initializerDefineProperty(this, "_stages", _descriptor4, this);
          this._pipeline = void 0;
        }
        /**
         * @en The name of the render flow
         * @zh 渲染流程的名字
         */
        get name() {
          return this._name;
        }

        /**
         * @en Priority of the current flow
         * @zh 当前渲染流程的优先级。
         */
        get priority() {
          return this._priority;
        }

        /**
         * @en Tag of the current flow
         * @zh 当前渲染流程的标签。
         */
        get tag() {
          return this._tag;
        }

        /**
         * @en The stages of flow.
         * @zh 渲染流程 stage 列表。
         * @readonly
         */
        get stages() {
          return this._stages;
        }
        /**
         * @en Get pipeline
         * @zh 获取pipeline
         */
        get pipeline() {
          return this._pipeline;
        }

        /**
         * @en The initialization process, user shouldn't use it in most case, only useful when need to generate render pipeline programmatically.
         * @zh 初始化函数，正常情况下不会用到，仅用于程序化生成渲染管线的情况。
         * @param info The render flow information
         */
        initialize(info) {
          this._name = info.name;
          this._priority = info.priority;
          this._stages = info.stages;
          if (info.tag) {
            this._tag = info.tag;
          }
          return true;
        }

        /**
         * @en Activate the current render flow in the given pipeline
         * @zh 为指定的渲染管线开启当前渲染流程
         * @param pipeline The render pipeline to activate this render flow
         */
        activate(pipeline) {
          this._pipeline = pipeline;
          this._stages.sort((a, b) => a.priority - b.priority);
          for (let i = 0, len = this._stages.length; i < len; i++) {
            this._stages[i].activate(pipeline, this);
          }
        }

        /**
         * @en Render function, it basically run all render stages in sequence for the given view.
         * @zh 渲染函数，对指定的渲染视图按顺序执行所有渲染阶段。
         * @param view Render view。
         */
        render(camera) {
          for (let i = 0, len = this._stages.length; i < len; i++) {
            if (this._stages[i].enabled) this._stages[i].render(camera);
          }
        }

        /**
         * @en Destroy function.
         * @zh 销毁函数。
         */
        destroy() {
          for (let i = 0, len = this._stages.length; i < len; i++) {
            this._stages[i].destroy();
          }
          this._stages.length = 0;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_name", [_dec2, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_priority", [_dec3, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_tag", [_dec4, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_stages", [_dec5, _dec6, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      cclegacy.RenderFlow = RenderFlow;
    }
  };
});