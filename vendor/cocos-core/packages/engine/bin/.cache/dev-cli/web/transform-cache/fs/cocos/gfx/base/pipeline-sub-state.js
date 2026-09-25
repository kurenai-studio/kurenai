System.register("q-bundled:///fs/cocos/gfx/base/pipeline-sub-state.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var BlendFactor, BlendOp, ColorMask, ComparisonFunc, CullMode, PolygonMode, ShadeModel, StencilOp, Color, RasterizerState, DepthStencilState, BlendTarget, BlendState;
  _export({
    RasterizerState: void 0,
    DepthStencilState: void 0,
    BlendTarget: void 0,
    BlendState: void 0
  });
  return {
    setters: [function (_defineJs) {
      BlendFactor = _defineJs.BlendFactor;
      BlendOp = _defineJs.BlendOp;
      ColorMask = _defineJs.ColorMask;
      ComparisonFunc = _defineJs.ComparisonFunc;
      CullMode = _defineJs.CullMode;
      PolygonMode = _defineJs.PolygonMode;
      ShadeModel = _defineJs.ShadeModel;
      StencilOp = _defineJs.StencilOp;
      Color = _defineJs.Color;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated engine source code (the "Software"), a limited,
       worldwide, royalty-free, non-assignable, revocable and non-exclusive license
       to use Cocos Creator solely to develop games on your target platforms. You shall
       not use Cocos Creator software for developing other software or tools that's
       used for developing games. You are not granted to publish, distribute,
       sublicense, and/or sell copies of Cocos Creator.
      
       The software or tools in this License Agreement are licensed, not sold.
       Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
       */
      /**
       * @en GFX rasterizer state.
       * @zh GFX 光栅化状态。
       */
      _export("RasterizerState", RasterizerState = class RasterizerState {
        // to make sure all usages must be an instance of this exact class, not assembled from plain object

        get native() {
          return this;
        }
        constructor(isDiscard = false, polygonMode = PolygonMode.FILL, shadeModel = ShadeModel.GOURAND, cullMode = CullMode.BACK, isFrontFaceCCW = true, depthBiasEnabled = false, depthBias = 0, depthBiasClamp = 0.0, depthBiasSlop = 0.0, isDepthClip = true, isMultisample = false, lineWidth = 1.0) {
          this.isDiscard = isDiscard;
          this.polygonMode = polygonMode;
          this.shadeModel = shadeModel;
          this.cullMode = cullMode;
          this.isFrontFaceCCW = isFrontFaceCCW;
          this.depthBiasEnabled = depthBiasEnabled;
          this.depthBias = depthBias;
          this.depthBiasClamp = depthBiasClamp;
          this.depthBiasSlop = depthBiasSlop;
          this.isDepthClip = isDepthClip;
          this.isMultisample = isMultisample;
          this.lineWidth = lineWidth;
        }
        reset() {
          this.isDiscard = false;
          this.polygonMode = PolygonMode.FILL;
          this.shadeModel = ShadeModel.GOURAND;
          this.cullMode = CullMode.BACK;
          this.isFrontFaceCCW = true;
          this.depthBiasEnabled = false;
          this.depthBias = 0;
          this.depthBiasClamp = 0.0;
          this.depthBiasSlop = 0.0;
          this.isDepthClip = true;
          this.isMultisample = false;
          this.lineWidth = 1.0;
        }
        assign(rs) {
          Object.assign(this, rs);
        }
        destroy() {}
      });
      /**
       * @en GFX depth stencil state.
       * @zh GFX 深度模板状态。
       */
      _export("DepthStencilState", DepthStencilState = class DepthStencilState {
        // to make sure all usages must be an instance of this exact class, not assembled from plain object

        get native() {
          return this;
        }
        constructor(depthTest = true, depthWrite = true, depthFunc = ComparisonFunc.LESS, stencilTestFront = false, stencilFuncFront = ComparisonFunc.ALWAYS, stencilReadMaskFront = 0xffff, stencilWriteMaskFront = 0xffff, stencilFailOpFront = StencilOp.KEEP, stencilZFailOpFront = StencilOp.KEEP, stencilPassOpFront = StencilOp.KEEP, stencilRefFront = 1, stencilTestBack = false, stencilFuncBack = ComparisonFunc.ALWAYS, stencilReadMaskBack = 0xffff, stencilWriteMaskBack = 0xffff, stencilFailOpBack = StencilOp.KEEP, stencilZFailOpBack = StencilOp.KEEP, stencilPassOpBack = StencilOp.KEEP, stencilRefBack = 1) {
          this.depthTest = depthTest;
          this.depthWrite = depthWrite;
          this.depthFunc = depthFunc;
          this.stencilTestFront = stencilTestFront;
          this.stencilFuncFront = stencilFuncFront;
          this.stencilReadMaskFront = stencilReadMaskFront;
          this.stencilWriteMaskFront = stencilWriteMaskFront;
          this.stencilFailOpFront = stencilFailOpFront;
          this.stencilZFailOpFront = stencilZFailOpFront;
          this.stencilPassOpFront = stencilPassOpFront;
          this.stencilRefFront = stencilRefFront;
          this.stencilTestBack = stencilTestBack;
          this.stencilFuncBack = stencilFuncBack;
          this.stencilReadMaskBack = stencilReadMaskBack;
          this.stencilWriteMaskBack = stencilWriteMaskBack;
          this.stencilFailOpBack = stencilFailOpBack;
          this.stencilZFailOpBack = stencilZFailOpBack;
          this.stencilPassOpBack = stencilPassOpBack;
          this.stencilRefBack = stencilRefBack;
        }
        reset() {
          this.depthTest = true;
          this.depthWrite = true;
          this.depthFunc = ComparisonFunc.LESS;
          this.stencilTestFront = false;
          this.stencilFuncFront = ComparisonFunc.ALWAYS;
          this.stencilReadMaskFront = 0xffff;
          this.stencilWriteMaskFront = 0xffff;
          this.stencilFailOpFront = StencilOp.KEEP;
          this.stencilZFailOpFront = StencilOp.KEEP;
          this.stencilPassOpFront = StencilOp.KEEP;
          this.stencilRefFront = 1;
          this.stencilTestBack = false;
          this.stencilFuncBack = ComparisonFunc.ALWAYS;
          this.stencilReadMaskBack = 0xffff;
          this.stencilWriteMaskBack = 0xffff;
          this.stencilFailOpBack = StencilOp.KEEP;
          this.stencilZFailOpBack = StencilOp.KEEP;
          this.stencilPassOpBack = StencilOp.KEEP;
          this.stencilRefBack = 1;
        }
        assign(dss) {
          Object.assign(this, dss);
        }
        destroy() {}
      });
      /**
       * @en GFX blend target.
       * @zh GFX 混合目标。
       */
      _export("BlendTarget", BlendTarget = class BlendTarget {
        // to make sure all usages must be an instance of this exact class, not assembled from plain object

        constructor(blend = false, blendSrc = BlendFactor.ONE, blendDst = BlendFactor.ZERO, blendEq = BlendOp.ADD, blendSrcAlpha = BlendFactor.ONE, blendDstAlpha = BlendFactor.ZERO, blendAlphaEq = BlendOp.ADD, blendColorMask = ColorMask.ALL) {
          this.blend = blend;
          this.blendSrc = blendSrc;
          this.blendDst = blendDst;
          this.blendEq = blendEq;
          this.blendSrcAlpha = blendSrcAlpha;
          this.blendDstAlpha = blendDstAlpha;
          this.blendAlphaEq = blendAlphaEq;
          this.blendColorMask = blendColorMask;
        }
        reset() {
          this.blend = false;
          this.blendSrc = BlendFactor.ONE;
          this.blendDst = BlendFactor.ZERO;
          this.blendEq = BlendOp.ADD;
          this.blendSrcAlpha = BlendFactor.ONE;
          this.blendDstAlpha = BlendFactor.ZERO;
          this.blendAlphaEq = BlendOp.ADD;
          this.blendColorMask = ColorMask.ALL;
        }
        assign(target) {
          Object.assign(this, target);
        }
        destroy() {}
      });
      /**
       * @en GFX blend state.
       * @zh GFX 混合状态。
       */
      _export("BlendState", BlendState = class BlendState {
        // to make sure all usages must be an instance of this exact class, not assembled from plain object

        get native() {
          return this;
        }
        constructor(isA2C = false, isIndepend = false, blendColor = new Color(), targets = [new BlendTarget()]) {
          this.isA2C = isA2C;
          this.isIndepend = isIndepend;
          this.blendColor = blendColor;
          this.targets = targets;
        }

        /**
         * @en Should use this function to set target, or it will not work
         * on native platforms, as native can not support this feature,
         * such as `blendState[i] = target;`.
         *
         * @param index The index to set target.
         * @param target The target to be set.
         */
        setTarget(index, target) {
          let tg = this.targets[index];
          if (!tg) {
            tg = this.targets[index] = new BlendTarget();
          }
          Object.assign(tg, target);
        }
        reset() {
          this.isA2C = false;
          this.isIndepend = false;
          this.blendColor.x = 0;
          this.blendColor.y = 0;
          this.blendColor.z = 0;
          this.blendColor.w = 0;
          this.targets.length = 1;
          this.targets[0].reset();
        }
        destroy() {}
      });
    }
  };
});