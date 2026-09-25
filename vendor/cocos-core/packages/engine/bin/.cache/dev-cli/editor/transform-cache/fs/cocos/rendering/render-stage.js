System.register("q-bundled:///fs/cocos/rendering/render-stage.js", ["../core/data/decorators/index.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, serializable, cclegacy, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, RenderStage;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
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
       * @en The render stage information descriptor
       * @zh 渲染阶段描述信息。
       */
      /**
       * @en The render stage actually renders render objects to the output window or other GFX [[gfx.Framebuffer]].
       * Typically, a render stage collects render objects it's responsible for, clear the camera,
       * record and execute command buffer, and at last present the render result.
       * @zh 渲染阶段是实质上的渲染执行者，它负责收集渲染数据并执行渲染将渲染结果输出到屏幕或其他 GFX [[gfx.Framebuffer]] 中。
       * 典型的渲染阶段会收集它所管理的渲染对象，按照 [[Camera]] 的清除标记进行清屏，记录并执行渲染指令缓存，并最终呈现渲染结果。
       */
      _export("RenderStage", RenderStage = (_dec = ccclass('RenderStage'), _dec2 = displayOrder(0), _dec3 = displayOrder(1), _dec4 = displayOrder(2), _dec(_class = (_class2 = class RenderStage {
        constructor() {
          /**
           * @en Name
           * @zh 名称。
           */
          _initializerDefineProperty(this, "_name", _descriptor, this);
          /**
           * @en Priority
           * @zh 优先级。
           */
          _initializerDefineProperty(this, "_priority", _descriptor2, this);
          /**
           * @en Whether to enable
           * @zh 是否启用。
           */
          this._enabled = true;
          /**
           * @en Type
           * @zh 类型。
           */
          _initializerDefineProperty(this, "_tag", _descriptor3, this);
          this._pipeline = void 0;
          this._flow = void 0;
        }
        /**
         * @en Name of the current stage
         * @zh 当前渲染阶段的名字。
         */
        get name() {
          return this._name;
        }

        /**
         * @en Priority of the current stage
         * @zh 当前渲染阶段的优先级。
         */
        get priority() {
          return this._priority;
        }

        /**
         * @en Tag of the current stage
         * @zh 当前渲染阶段的标签。
         */
        get tag() {
          return this._tag;
        }
        set enabled(val) {
          this._enabled = val;
        }
        get enabled() {
          return this._enabled;
        }
        /**
         * @en The initialization process, user shouldn't use it in most case, only useful when need to generate render pipeline programmatically.
         * @zh 初始化函数，正常情况下不会用到，仅用于程序化生成渲染管线的情况。
         * @param info The render stage information
         */
        initialize(info) {
          this._name = info.name;
          this._priority = info.priority;
          if (info.tag) {
            this._tag = info.tag;
          }
          return true;
        }

        /**
         * @en Activate the current render stage in the given render flow
         * @zh 为指定的渲染流程开启当前渲染阶段
         * @param flow The render flow to activate this render stage
         */
        activate(pipeline, flow) {
          this._pipeline = pipeline;
          this._flow = flow;
        }

        /**
         * @en Destroy function
         * @zh 销毁函数。
         */

        /**
         * @en Render function
         * @zh 渲染函数。
         * @param view The render view
         */
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
      }), _class2)) || _class));
      cclegacy.RenderStage = RenderStage;
    }
  };
});