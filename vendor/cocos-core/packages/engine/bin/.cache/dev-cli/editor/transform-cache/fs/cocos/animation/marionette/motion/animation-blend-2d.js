System.register("q-bundled:///fs/cocos/animation/marionette/motion/animation-blend-2d.js", ["../../../core/index.js", "../create-eval.js", "./animation-blend.js", "../parametric.js", "./blend-2d.js", "../../define.js"], function (_export, _context) {
  "use strict";

  var Vec2, _decorator, ccenum, assertIsTrue, editable, createEval, AnimationBlend, AnimationBlendEval, AnimationBlendItem, BindableNumber, bindOr, VariableType, sampleFreeformCartesian, blendSimpleDirectional, PolarSpaceGradientBandInterpolator2D, CLASS_NAME_PREFIX_ANIM, AnimationBlend2DEval, PolarSpaceGradientBandBlend2DEval, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _AnimationBlend2D, ccclass, serializable, Algorithm, AnimationBlend2DItem, AnimationBlend2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      _decorator = _coreIndexJs._decorator;
      ccenum = _coreIndexJs.ccenum;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      editable = _coreIndexJs.editable;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_animationBlendJs) {
      AnimationBlend = _animationBlendJs.AnimationBlend;
      AnimationBlendEval = _animationBlendJs.AnimationBlendEval;
      AnimationBlendItem = _animationBlendJs.AnimationBlendItem;
    }, function (_parametricJs) {
      BindableNumber = _parametricJs.BindableNumber;
      bindOr = _parametricJs.bindOr;
      VariableType = _parametricJs.VariableType;
    }, function (_blend2dJs) {
      sampleFreeformCartesian = _blend2dJs.sampleFreeformCartesian;
      blendSimpleDirectional = _blend2dJs.blendSimpleDirectional;
      PolarSpaceGradientBandInterpolator2D = _blend2dJs.PolarSpaceGradientBandInterpolator2D;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
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
      ({
        ccclass,
        serializable
      } = _decorator);
      Algorithm = /*#__PURE__*/function (Algorithm) {
        Algorithm[Algorithm["SIMPLE_DIRECTIONAL"] = 0] = "SIMPLE_DIRECTIONAL";
        Algorithm[Algorithm["FREEFORM_CARTESIAN"] = 1] = "FREEFORM_CARTESIAN";
        Algorithm[Algorithm["FREEFORM_DIRECTIONAL"] = 2] = "FREEFORM_DIRECTIONAL";
        return Algorithm;
      }(Algorithm || {});
      ccenum(Algorithm);
      AnimationBlend2DItem = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationBlend2DItem`), _dec(_class = (_class2 = class AnimationBlend2DItem extends AnimationBlendItem {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "threshold", _descriptor, this);
        }
        clone() {
          const that = new AnimationBlend2DItem();
          this._copyTo(that);
          return that;
        }
        _copyTo(that) {
          super._copyTo(that);
          Vec2.copy(that.threshold, this.threshold);
          return that;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "threshold", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2();
        }
      }), _class2)) || _class);
      _export("AnimationBlend2D", AnimationBlend2D = (_dec2 = ccclass('cc.animation.AnimationBlend2D'), _dec2(_class3 = (_class4 = (_AnimationBlend2D = class AnimationBlend2D extends AnimationBlend {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_items", _descriptor2, this);
          _initializerDefineProperty(this, "paramX", _descriptor3, this);
          _initializerDefineProperty(this, "paramY", _descriptor4, this);
          _initializerDefineProperty(this, "_algorithm", _descriptor5, this);
          this._polarSpaceGBI = undefined;
        }
        get algorithm() {
          return this._algorithm;
        }
        set algorithm(value) {
          if (value === this._algorithm) {
            return;
          }
          this._algorithm = value;
          this._tryReconstructPolarSpaceInterpolator();
        }
        get items() {
          return this._items;
        }
        set items(items) {
          this._items = Array.from(items);
          this._tryReconstructPolarSpaceInterpolator();
        }

        /**
         * // TODO: HACK
         * @internal
         */
        __callOnAfterDeserializeRecursive() {
          this._tryReconstructPolarSpaceInterpolator();
        }
        clone() {
          const that = new AnimationBlend2D();
          this.copyTo(that);
          that._items = this._items.map(item => {
            var _item$clone;
            return (_item$clone = item == null ? void 0 : item.clone()) != null ? _item$clone : null;
          });
          that.paramX = this.paramX.clone();
          that.paramY = this.paramY.clone();
          that.algorithm = this._algorithm;
          return that;
        }
        [createEval](context, ignoreEmbeddedPlayers) {
          const {
            algorithm
          } = this;
          let evaluation;
          switch (algorithm) {
            case Algorithm.FREEFORM_DIRECTIONAL:
              assertIsTrue(this._polarSpaceGBI, `The polar space interpolator is not setup correctly!`);
              evaluation = new PolarSpaceGradientBandBlend2DEval(context, ignoreEmbeddedPlayers, this, this._items, this._polarSpaceGBI, [0.0, 0.0]);
              break;
            default:
              assertIsTrue(false);
            // fallthrough
            case Algorithm.SIMPLE_DIRECTIONAL:
            case Algorithm.FREEFORM_CARTESIAN:
              evaluation = new AnimationBlend2DEval(context, ignoreEmbeddedPlayers, this, this._items, this._items.map(({
                threshold
              }) => threshold), algorithm, [0.0, 0.0]);
              break;
          }
          const initialValueX = bindOr(context, this.paramX, VariableType.FLOAT, evaluation.setInput, evaluation, 0);
          const initialValueY = bindOr(context, this.paramY, VariableType.FLOAT, evaluation.setInput, evaluation, 1);
          evaluation.setInput(initialValueX, 0);
          evaluation.setInput(initialValueY, 1);
          return evaluation;
        }
        _tryReconstructPolarSpaceInterpolator() {
          if (this._algorithm === Algorithm.FREEFORM_DIRECTIONAL) {
            this._polarSpaceGBI = new PolarSpaceGradientBandInterpolator2D(this._items.map(item => item.threshold));
          } else {
            this._polarSpaceGBI = undefined;
          }
        }
      }, _AnimationBlend2D.Algorithm = Algorithm, _AnimationBlend2D.Item = AnimationBlend2DItem, _AnimationBlend2D), _applyDecoratedDescriptor(_class4.prototype, "algorithm", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "algorithm"), _class4.prototype), _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "_items", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "paramX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new BindableNumber();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "paramY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new BindableNumber();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "_algorithm", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Algorithm.SIMPLE_DIRECTIONAL;
        }
      }), _class4)) || _class3));
      AnimationBlend2DEval = class AnimationBlend2DEval extends AnimationBlendEval {
        constructor(context, ignoreEmbeddedPlayers, base, items, thresholds, algorithm, inputs) {
          super(context, ignoreEmbeddedPlayers, base, items, inputs);
          this._thresholds = void 0;
          this._algorithm = void 0;
          this._value = new Vec2();
          this._thresholds = thresholds;
          this._algorithm = algorithm;
          this.doEval();
        }
        eval(weights, [x, y]) {
          Vec2.set(this._value, x, y);
          weights.fill(0);
          switch (this._algorithm) {
            case Algorithm.SIMPLE_DIRECTIONAL:
              blendSimpleDirectional(weights, this._thresholds, this._value);
              break;
            case Algorithm.FREEFORM_CARTESIAN:
              sampleFreeformCartesian(weights, this._thresholds, this._value);
              break;
            default:
              break;
          }
        }
      };
      PolarSpaceGradientBandBlend2DEval = class PolarSpaceGradientBandBlend2DEval extends AnimationBlendEval {
        constructor(context, ignoreEmbeddedPlayers, base, items, interpolator, inputs) {
          super(context, ignoreEmbeddedPlayers, base, items, inputs);
          this._interpolator = void 0;
          this._value = new Vec2();
          this._interpolator = interpolator;
          this.doEval();
        }
        eval(weights, [x, y]) {
          Vec2.set(this._value, x, y);
          weights.fill(0);
          this._interpolator.interpolate(weights, this._value);
        }
      };
    }
  };
});