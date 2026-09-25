System.register("q-bundled:///fs/cocos/gfx/base/pipeline-state.js", ["./define.js", "./pipeline-sub-state.js"], function (_export, _context) {
  "use strict";

  var DynamicStateFlagBit, GFXObject, ObjectType, PrimitiveMode, InputState, PipelineBindPoint, BlendState, BlendTarget, RasterizerState, DepthStencilState, PipelineStateInfo, PipelineState;
  _export({
    PipelineStateInfo: void 0,
    PipelineState: void 0
  });
  return {
    setters: [function (_defineJs) {
      DynamicStateFlagBit = _defineJs.DynamicStateFlagBit;
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
      PrimitiveMode = _defineJs.PrimitiveMode;
      InputState = _defineJs.InputState;
      PipelineBindPoint = _defineJs.PipelineBindPoint;
    }, function (_pipelineSubStateJs) {
      BlendState = _pipelineSubStateJs.BlendState;
      BlendTarget = _pipelineSubStateJs.BlendTarget;
      RasterizerState = _pipelineSubStateJs.RasterizerState;
      DepthStencilState = _pipelineSubStateJs.DepthStencilState;
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
      _export("BlendState", BlendState);
      _export("BlendTarget", BlendTarget);
      _export("RasterizerState", RasterizerState);
      _export("DepthStencilState", DepthStencilState);
      _export("PipelineStateInfo", PipelineStateInfo = class PipelineStateInfo {
        // to make sure all usages must be an instance of this exact class, not assembled from plain object

        constructor(shader = null, pipelineLayout = null, renderPass = null, inputState = new InputState(), rasterizerState = new RasterizerState(), depthStencilState = new DepthStencilState(), blendState = new BlendState(), primitive = PrimitiveMode.TRIANGLE_LIST, dynamicStates = DynamicStateFlagBit.NONE, bindPoint = PipelineBindPoint.GRAPHICS) {
          this.shader = shader;
          this.pipelineLayout = pipelineLayout;
          this.renderPass = renderPass;
          this.inputState = inputState;
          this.rasterizerState = rasterizerState;
          this.depthStencilState = depthStencilState;
          this.blendState = blendState;
          this.primitive = primitive;
          this.dynamicStates = dynamicStates;
          this.bindPoint = bindPoint;
        }
      });
      /**
       * @en GFX pipeline state.
       * @zh GFX 管线状态。
       */
      _export("PipelineState", PipelineState = class PipelineState extends GFXObject {
        /**
         * @en Get current shader.
         * @zh GFX 着色器。
         */
        get shader() {
          return this._shader;
        }

        /**
         * @en Get current pipeline layout.
         * @zh GFX 管线布局。
         */
        get pipelineLayout() {
          return this._pipelineLayout;
        }

        /**
         * @en Get current primitve mode.
         * @zh GFX 图元模式。
         */
        get primitive() {
          return this._primitive;
        }

        /**
         * @en Get current rasterizer state.
         * @zh GFX 光栅化状态。
         */
        get rasterizerState() {
          return this._rs;
        }

        /**
         * @en Get current depth stencil state.
         * @zh GFX 深度模板状态。
         */
        get depthStencilState() {
          return this._dss;
        }

        /**
         * @en Get current blend state.
         * @zh GFX 混合状态。
         */
        get blendState() {
          return this._bs;
        }

        /**
         * @en Get current input state.
         * @zh GFX 输入状态。
         */
        get inputState() {
          return this._is;
        }

        /**
         * @en Get current dynamic states.
         * @zh GFX 动态状态数组。
         */
        get dynamicStates() {
          return this._dynamicStates;
        }

        /**
         * @en Get current render pass.
         * @zh GFX 渲染过程。
         */
        get renderPass() {
          return this._renderPass;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.PIPELINE_STATE);
          this._shader = null;
          /** @mangle */
          this._pipelineLayout = null;
          /** @mangle */
          this._primitive = PrimitiveMode.TRIANGLE_LIST;
          /** @mangle */
          this._is = null;
          /** @mangle */
          this._rs = new RasterizerState();
          /** @mangle */
          this._dss = new DepthStencilState();
          /** @mangle */
          this._bs = new BlendState();
          /** @mangle */
          this._dynamicStates = DynamicStateFlagBit.NONE;
          /** @mangle */
          this._renderPass = null;
        }
      });
    }
  };
});