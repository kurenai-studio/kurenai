System.register("q-bundled:///fs/cocos/gfx/base/pipeline-sub-state.jsb.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var BlendFactor, BlendOp, ColorMask, ComparisonFunc, CullMode, PolygonMode, ShadeModel, StencilOp, Color, RasterizerState, DepthStencilState, BlendTarget, BlendState;
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

  function watchArrayElementsField(self, list, eleField, cachedFieldName, callback) {
    for (let i = 0, l = list.length; i < l; i++) {
      let ele = list[i];
      let originField = ele[eleField][cachedFieldName] || ele[eleField];
      // replace with Proxy
      ele[eleField] = new Proxy(originField, {
        get: (originTarget, key) => {
          if (key === cachedFieldName) {
            return originTarget;
          }
          return Reflect.get(originTarget, key);
        },
        set: (originTarget, prop, value) => {
          Reflect.set(originTarget, prop, value);
          callback(self, i, originTarget, prop, value);
          return true;
        }
      });
    }
  }
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
      _export("RasterizerState", RasterizerState = class RasterizerState {
        constructor(isDiscard = false, polygonMode = PolygonMode.FILL, shadeModel = ShadeModel.GOURAND, cullMode = CullMode.BACK, isFrontFaceCCW = true, depthBiasEnabled = false, depthBias = 0, depthBiasClamp = 0.0, depthBiasSlop = 0.0, isDepthClip = true, isMultisample = false, lineWidth = 1.0) {
          this._nativeObj = void 0;
          this._isDiscard = false;
          this._polygonMode = PolygonMode.FILL;
          this._shadeModel = ShadeModel.GOURAND;
          this._cullMode = CullMode.BACK;
          this._isFrontFaceCCW = true;
          this._depthBiasEnabled = false;
          this._depthBias = 0;
          this._depthBiasClamp = 0.0;
          this._depthBiasSlop = 0.0;
          this._isDepthClip = true;
          this._isMultisample = false;
          this._lineWidth = 1.0;
          this._nativeObj = new gfx.RasterizerState();
          this.assignProperties(isDiscard, polygonMode, shadeModel, cullMode, isFrontFaceCCW, depthBiasEnabled, depthBias, depthBiasClamp, depthBiasSlop, isDepthClip, isMultisample, lineWidth);
        }
        get native() {
          return this._nativeObj;
        }
        get isDiscard() {
          return this._isDiscard;
        }
        set isDiscard(val) {
          this._isDiscard = val;
          this._nativeObj.isDiscard = val;
        }
        get polygonMode() {
          return this._polygonMode;
        }
        set polygonMode(val) {
          this._polygonMode = val;
          this._nativeObj.polygonMode = val;
        }
        get shadeModel() {
          return this._shadeModel;
        }
        set shadeModel(val) {
          this._shadeModel = val;
          this._nativeObj.shadeModel = val;
        }
        get cullMode() {
          return this._cullMode;
        }
        set cullMode(val) {
          this._cullMode = val;
          this._nativeObj.cullMode = val;
        }
        get isFrontFaceCCW() {
          return this._isFrontFaceCCW;
        }
        set isFrontFaceCCW(val) {
          this._isFrontFaceCCW = val;
          this._nativeObj.isFrontFaceCCW = val;
        }
        get depthBiasEnabled() {
          return this._depthBiasEnabled;
        }
        set depthBiasEnabled(val) {
          this._depthBiasEnabled = val;
          this._nativeObj.depthBiasEnabled = val;
        }
        get depthBias() {
          return this._depthBias;
        }
        set depthBias(val) {
          this._depthBias = val;
          this._nativeObj.depthBias = val;
        }
        get depthBiasClamp() {
          return this._depthBiasClamp;
        }
        set depthBiasClamp(val) {
          this._depthBiasClamp = val;
          this._nativeObj.depthBiasClamp = val;
        }
        get depthBiasSlop() {
          return this._depthBiasSlop;
        }
        set depthBiasSlop(val) {
          this._depthBiasSlop = val;
          this._nativeObj.depthBiasSlop = val;
        }
        get isDepthClip() {
          return this._isDepthClip;
        }
        set isDepthClip(val) {
          this._isDepthClip = val;
          this._nativeObj.isDepthClip = val;
        }
        get isMultisample() {
          return this._isMultisample;
        }
        set isMultisample(val) {
          this._isMultisample = val;
          this._nativeObj.isMultisample = val;
        }
        get lineWidth() {
          return this._lineWidth;
        }
        set lineWidth(val) {
          this._lineWidth = val;
          this._nativeObj.lineWidth = val;
        }
        reset() {
          this.assignProperties(false, PolygonMode.FILL, ShadeModel.GOURAND, CullMode.BACK, true, false, 0, 0.0, 0.0, true, false, 1.0);
        }
        assign(rs) {
          if (!rs) return;
          this.assignProperties(rs.isDiscard, rs.polygonMode, rs.shadeModel, rs.cullMode, rs.isFrontFaceCCW, rs.depthBiasEnabled, rs.depthBias, rs.depthBiasClamp, rs.depthBiasSlop, rs.isDepthClip, rs.isMultisample, rs.lineWidth);
        }
        destroy() {
          this._nativeObj = null;
        }
        assignProperties(isDiscard, polygonMode, shadeModel, cullMode, isFrontFaceCCW, depthBiasEnabled, depthBias, depthBiasClamp, depthBiasSlop, isDepthClip, isMultisample, lineWidth) {
          if (isDiscard !== undefined) this.isDiscard = isDiscard;
          if (polygonMode !== undefined) this.polygonMode = polygonMode;
          if (shadeModel !== undefined) this.shadeModel = shadeModel;
          if (cullMode !== undefined) this.cullMode = cullMode;
          if (isFrontFaceCCW !== undefined) this.isFrontFaceCCW = isFrontFaceCCW;
          if (depthBiasEnabled !== undefined) this.depthBiasEnabled = depthBiasEnabled;
          if (depthBias !== undefined) this.depthBias = depthBias;
          if (depthBiasClamp !== undefined) this.depthBiasClamp = depthBiasClamp;
          if (depthBiasSlop !== undefined) this.depthBiasSlop = depthBiasSlop;
          if (isDepthClip !== undefined) this.isDepthClip = isDepthClip;
          if (isMultisample !== undefined) this.isMultisample = isMultisample;
          if (lineWidth !== undefined) this.lineWidth = lineWidth;
        }
      });
      /**
       * @en GFX depth stencil state.
       * @zh GFX 深度模板状态。
       */
      _export("DepthStencilState", DepthStencilState = class DepthStencilState {
        constructor(depthTest = true, depthWrite = true, depthFunc = ComparisonFunc.LESS, stencilTestFront = false, stencilFuncFront = ComparisonFunc.ALWAYS, stencilReadMaskFront = 0xffff, stencilWriteMaskFront = 0xffff, stencilFailOpFront = StencilOp.KEEP, stencilZFailOpFront = StencilOp.KEEP, stencilPassOpFront = StencilOp.KEEP, stencilRefFront = 1, stencilTestBack = false, stencilFuncBack = ComparisonFunc.ALWAYS, stencilReadMaskBack = 0xffff, stencilWriteMaskBack = 0xffff, stencilFailOpBack = StencilOp.KEEP, stencilZFailOpBack = StencilOp.KEEP, stencilPassOpBack = StencilOp.KEEP, stencilRefBack = 1) {
          this._nativeObj = void 0;
          this._depthTest = true;
          this._depthWrite = true;
          this._depthFunc = ComparisonFunc.LESS;
          this._stencilTestFront = false;
          this._stencilFuncFront = ComparisonFunc.ALWAYS;
          this._stencilReadMaskFront = 0xffff;
          this._stencilWriteMaskFront = 0xffff;
          this._stencilFailOpFront = StencilOp.KEEP;
          this._stencilZFailOpFront = StencilOp.KEEP;
          this._stencilPassOpFront = StencilOp.KEEP;
          this._stencilRefFront = 1;
          this._stencilTestBack = false;
          this._stencilFuncBack = ComparisonFunc.ALWAYS;
          this._stencilReadMaskBack = 0xffff;
          this._stencilWriteMaskBack = 0xffff;
          this._stencilFailOpBack = StencilOp.KEEP;
          this._stencilZFailOpBack = StencilOp.KEEP;
          this._stencilPassOpBack = StencilOp.KEEP;
          this._stencilRefBack = 1;
          this._nativeObj = new gfx.DepthStencilState();
          this.assignProperties(depthTest, depthWrite, depthFunc, stencilTestFront, stencilFuncFront, stencilReadMaskFront, stencilWriteMaskFront, stencilFailOpFront, stencilZFailOpFront, stencilPassOpFront, stencilRefFront, stencilTestBack, stencilFuncBack, stencilReadMaskBack, stencilWriteMaskBack, stencilFailOpBack, stencilZFailOpBack, stencilPassOpBack, stencilRefBack);
        }
        get native() {
          return this._nativeObj;
        }
        get depthTest() {
          return this._depthTest;
        }
        set depthTest(val) {
          this._depthTest = val;
          this._nativeObj.depthTest = val;
        }
        get depthWrite() {
          return this._depthWrite;
        }
        set depthWrite(val) {
          this._depthWrite = val;
          this._nativeObj.depthWrite = val;
        }
        get depthFunc() {
          return this._depthFunc;
        }
        set depthFunc(val) {
          this._depthFunc = val;
          this._nativeObj.depthFunc = val;
        }
        get stencilTestFront() {
          return this._stencilTestFront;
        }
        set stencilTestFront(val) {
          this._stencilTestFront = val;
          this._nativeObj.stencilTestFront = val;
        }
        get stencilFuncFront() {
          return this._stencilFuncFront;
        }
        set stencilFuncFront(val) {
          this._stencilFuncFront = val;
          this._nativeObj.stencilFuncFront = val;
        }
        get stencilReadMaskFront() {
          return this._stencilReadMaskFront;
        }
        set stencilReadMaskFront(val) {
          this._stencilReadMaskFront = val;
          this._nativeObj.stencilReadMaskFront = val;
        }
        get stencilWriteMaskFront() {
          return this._stencilWriteMaskFront;
        }
        set stencilWriteMaskFront(val) {
          this._stencilWriteMaskFront = val;
          this._nativeObj.stencilWriteMaskFront = val;
        }
        get stencilFailOpFront() {
          return this._stencilFailOpFront;
        }
        set stencilFailOpFront(val) {
          this._stencilFailOpFront = val;
          this._nativeObj.stencilFailOpFront = val;
        }
        get stencilZFailOpFront() {
          return this._stencilZFailOpFront;
        }
        set stencilZFailOpFront(val) {
          this._stencilZFailOpFront = val;
          this._nativeObj.stencilZFailOpFront = val;
        }
        get stencilPassOpFront() {
          return this._stencilPassOpFront;
        }
        set stencilPassOpFront(val) {
          this._stencilPassOpFront = val;
          this._nativeObj.stencilPassOpFront = val;
        }
        get stencilRefFront() {
          return this._stencilRefFront;
        }
        set stencilRefFront(val) {
          this._stencilRefFront = val;
          this._nativeObj.stencilRefFront = val;
        }
        get stencilTestBack() {
          return this._stencilTestBack;
        }
        set stencilTestBack(val) {
          this._stencilTestBack = val;
          this._nativeObj.stencilTestBack = val;
        }
        get stencilFuncBack() {
          return this._stencilFuncBack;
        }
        set stencilFuncBack(val) {
          this._stencilFuncBack = val;
          this._nativeObj.stencilFuncBack = val;
        }
        get stencilReadMaskBack() {
          return this._stencilReadMaskBack;
        }
        set stencilReadMaskBack(val) {
          this._stencilReadMaskBack = val;
          this._nativeObj.stencilReadMaskBack = val;
        }
        get stencilWriteMaskBack() {
          return this._stencilWriteMaskBack;
        }
        set stencilWriteMaskBack(val) {
          this._stencilWriteMaskBack = val;
          this._nativeObj.stencilWriteMaskBack = val;
        }
        get stencilFailOpBack() {
          return this._stencilFailOpBack;
        }
        set stencilFailOpBack(val) {
          this._stencilFailOpBack = val;
          this._nativeObj.stencilFailOpBack = val;
        }
        get stencilZFailOpBack() {
          return this._stencilZFailOpBack;
        }
        set stencilZFailOpBack(val) {
          this._stencilZFailOpBack = val;
          this._nativeObj.stencilZFailOpBack = val;
        }
        get stencilPassOpBack() {
          return this._stencilPassOpBack;
        }
        set stencilPassOpBack(val) {
          this._stencilPassOpBack = val;
          this._nativeObj.stencilPassOpBack = val;
        }
        get stencilRefBack() {
          return this._stencilRefBack;
        }
        set stencilRefBack(val) {
          this._stencilRefBack = val;
          this._nativeObj.stencilRefBack = val;
        }
        reset() {
          this.assignProperties(true, true, ComparisonFunc.LESS, false, ComparisonFunc.ALWAYS, 0xffff, 0xffff, StencilOp.KEEP, StencilOp.KEEP, StencilOp.KEEP, 1, false, ComparisonFunc.ALWAYS, 0xffff, 0xffff, StencilOp.KEEP, StencilOp.KEEP, StencilOp.KEEP, 1);
        }
        assign(dss) {
          if (!dss) return;
          this.assignProperties(dss.depthTest, dss.depthWrite, dss.depthFunc, dss.stencilTestFront, dss.stencilFuncFront, dss.stencilReadMaskFront, dss.stencilWriteMaskFront, dss.stencilFailOpFront, dss.stencilZFailOpFront, dss.stencilPassOpFront, dss.stencilRefFront, dss.stencilTestBack, dss.stencilFuncBack, dss.stencilReadMaskBack, dss.stencilWriteMaskBack, dss.stencilFailOpBack, dss.stencilZFailOpBack, dss.stencilPassOpBack, dss.stencilRefBack);
        }
        destroy() {
          this._nativeObj = null;
        }
        assignProperties(depthTest, depthWrite, depthFunc, stencilTestFront, stencilFuncFront, stencilReadMaskFront, stencilWriteMaskFront, stencilFailOpFront, stencilZFailOpFront, stencilPassOpFront, stencilRefFront, stencilTestBack, stencilFuncBack, stencilReadMaskBack, stencilWriteMaskBack, stencilFailOpBack, stencilZFailOpBack, stencilPassOpBack, stencilRefBack) {
          if (depthTest !== undefined) this.depthTest = depthTest;
          if (depthWrite !== undefined) this.depthWrite = depthWrite;
          if (depthFunc !== undefined) this.depthFunc = depthFunc;
          if (stencilTestFront !== undefined) this.stencilTestFront = stencilTestFront;
          if (stencilFuncFront !== undefined) this.stencilFuncFront = stencilFuncFront;
          if (stencilReadMaskFront !== undefined) this.stencilReadMaskFront = stencilReadMaskFront;
          if (stencilWriteMaskFront !== undefined) this.stencilWriteMaskFront = stencilWriteMaskFront;
          if (stencilFailOpFront !== undefined) this.stencilFailOpFront = stencilFailOpFront;
          if (stencilZFailOpFront !== undefined) this.stencilZFailOpFront = stencilZFailOpFront;
          if (stencilPassOpFront !== undefined) this.stencilPassOpFront = stencilPassOpFront;
          if (stencilRefFront !== undefined) this.stencilRefFront = stencilRefFront;
          if (stencilTestBack !== undefined) this.stencilTestBack = stencilTestBack;
          if (stencilFuncBack !== undefined) this.stencilFuncBack = stencilFuncBack;
          if (stencilReadMaskBack !== undefined) this.stencilReadMaskBack = stencilReadMaskBack;
          if (stencilWriteMaskBack !== undefined) this.stencilWriteMaskBack = stencilWriteMaskBack;
          if (stencilFailOpBack !== undefined) this.stencilFailOpBack = stencilFailOpBack;
          if (stencilZFailOpBack !== undefined) this.stencilZFailOpBack = stencilZFailOpBack;
          if (stencilPassOpBack !== undefined) this.stencilPassOpBack = stencilPassOpBack;
          if (stencilRefBack !== undefined) this.stencilRefBack = stencilRefBack;
        }
      });
      /**
       * @en GFX blend target.
       * @zh GFX 混合目标。
       */
      _export("BlendTarget", BlendTarget = class BlendTarget {
        get native() {
          return this._nativeObj;
        }
        constructor(blend = false, blendSrc = BlendFactor.ONE, blendDst = BlendFactor.ZERO, blendEq = BlendOp.ADD, blendSrcAlpha = BlendFactor.ONE, blendDstAlpha = BlendFactor.ZERO, blendAlphaEq = BlendOp.ADD, blendColorMask = ColorMask.ALL) {
          this._nativeObj = void 0;
          this._blend = false;
          this._blendSrc = BlendFactor.ONE;
          this._blendDst = BlendFactor.ZERO;
          this._blendEq = BlendOp.ADD;
          this._blendSrcAlpha = BlendFactor.ONE;
          this._blendDstAlpha = BlendFactor.ZERO;
          this._blendAlphaEq = BlendOp.ADD;
          this._blendColorMask = ColorMask.ALL;
          this._nativeObj = new gfx.BlendTarget();
          this.assignProperties(blend, blendSrc, blendDst, blendEq, blendSrcAlpha, blendDstAlpha, blendAlphaEq, blendColorMask);
        }
        get blend() {
          return this._blend;
        }
        set blend(val) {
          this._blend = val;
          this._nativeObj.blend = val;
        }
        get blendSrc() {
          return this._blendSrc;
        }
        set blendSrc(val) {
          this._blendSrc = val;
          this._nativeObj.blendSrc = val;
        }
        get blendDst() {
          return this._blendDst;
        }
        set blendDst(val) {
          this._blendDst = val;
          this._nativeObj.blendDst = val;
        }
        get blendEq() {
          return this._blendEq;
        }
        set blendEq(val) {
          this._blendEq = val;
          this._nativeObj.blendEq = val;
        }
        get blendSrcAlpha() {
          return this._blendSrcAlpha;
        }
        set blendSrcAlpha(val) {
          this._blendSrcAlpha = val;
          this._nativeObj.blendSrcAlpha = val;
        }
        get blendDstAlpha() {
          return this._blendDstAlpha;
        }
        set blendDstAlpha(val) {
          this._blendDstAlpha = val;
          this._nativeObj.blendDstAlpha = val;
        }
        get blendAlphaEq() {
          return this._blendAlphaEq;
        }
        set blendAlphaEq(val) {
          this._blendAlphaEq = val;
          this._nativeObj.blendAlphaEq = val;
        }
        get blendColorMask() {
          return this._blendColorMask;
        }
        set blendColorMask(val) {
          this._blendColorMask = val;
          this._nativeObj.blendColorMask = val;
        }
        reset() {
          this.assignProperties(false, BlendFactor.ONE, BlendFactor.ZERO, BlendOp.ADD, BlendFactor.ONE, BlendFactor.ZERO, BlendOp.ADD, ColorMask.ALL);
        }
        destroy() {
          this._nativeObj = null;
        }
        assign(target) {
          if (!target) return;
          this.assignProperties(target.blend, target.blendSrc, target.blendDst, target.blendEq, target.blendSrcAlpha, target.blendDstAlpha, target.blendAlphaEq, target.blendColorMask);
        }
        assignProperties(blend, blendSrc, blendDst, blendEq, blendSrcAlpha, blendDstAlpha, blendAlphaEq, blendColorMask) {
          if (blend !== undefined) this.blend = blend;
          if (blendSrc !== undefined) this.blendSrc = blendSrc;
          if (blendDst !== undefined) this.blendDst = blendDst;
          if (blendEq !== undefined) this.blendEq = blendEq;
          if (blendSrcAlpha !== undefined) this.blendSrcAlpha = blendSrcAlpha;
          if (blendDstAlpha !== undefined) this.blendDstAlpha = blendDstAlpha;
          if (blendAlphaEq !== undefined) this.blendAlphaEq = blendAlphaEq;
          if (blendColorMask !== undefined) this.blendColorMask = blendColorMask;
        }
      });
      _export("BlendState", BlendState = class BlendState {
        _setTargets(targets) {
          this.targets = targets;
          const CACHED_FIELD_NAME = `$__nativeObj`;
          this._syncTargetsToNativeObj(CACHED_FIELD_NAME);

          // watch target[i]._nativeObj fields update
          watchArrayElementsField(this, this.targets, "_nativeObj", CACHED_FIELD_NAME, (self, _idx, _originTarget, _prop, _value) => {
            self._syncTargetsToNativeObj(CACHED_FIELD_NAME);
          });
        }
        _syncTargetsToNativeObj(cachedFieldName) {
          const nativeTars = this.targets.map(target => {
            return target.native[cachedFieldName] || target.native;
          });
          this._nativeObj.targets = nativeTars;
        }
        get native() {
          return this._nativeObj;
        }
        constructor(isA2C = false, isIndepend = false, blendColor = new Color(), targets = [new BlendTarget()]) {
          // NOTE: not initialize in constructor
          this.targets = void 0;
          // NOTE: not initialize in constructor
          this._blendColor = void 0;
          this._nativeObj = void 0;
          this._isA2C = false;
          this._isIndepend = false;
          this._nativeObj = new gfx.BlendState();
          this._setTargets(targets);
          this.blendColor = blendColor;
          this.isA2C = isA2C;
          this.isIndepend = isIndepend;
        }
        get isA2C() {
          return this._isA2C;
        }
        set isA2C(val) {
          this._isA2C = val;
          this._nativeObj.isA2C = val;
        }
        get isIndepend() {
          return this._isIndepend;
        }
        set isIndepend(val) {
          this._isIndepend = val;
          this._nativeObj.isIndepend = val;
        }
        get blendColor() {
          return this._blendColor;
        }
        set blendColor(color) {
          this._blendColor = color;
          this._nativeObj.blendColor = color;
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
          tg.assign(target);
          // TODO: define setTarget function
          this._setTargets(this.targets);
        }
        reset() {
          this.isA2C = false;
          this.isIndepend = false;
          this.blendColor = new Color(0, 0, 0, 0);
          const targets = this.targets;
          for (let i = 1, len = targets.length; i < len; ++i) {
            targets[i].destroy();
          }
          targets.length = 1;
          targets[0].reset();
          this._setTargets(targets);
        }
        destroy() {
          for (let i = 0, len = this.targets.length; i < len; ++i) {
            this.targets[i].destroy();
          }
          // NOTE: Type 'null' is not assignable to type 'BlendTarget[]'.
          this.targets = null;
          this._nativeObj = null;
        }
      });
    }
  };
});