System.register("q-bundled:///fs/cocos/animation/marionette/motion/animation-blend-1d.js", ["../../../core/index.js", "../create-eval.js", "../parametric.js", "./animation-blend.js", "./blend-1d.js", "../../define.js"], function (_export, _context) {
  "use strict";

  var _decorator, createEval, BindableNumber, bindOr, VariableType, AnimationBlend, AnimationBlendEval, AnimationBlendItem, blend1D, CLASS_NAME_PREFIX_ANIM, AnimationBlend1DEval, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, _descriptor3, _AnimationBlend1D, ccclass, serializable, AnimationBlend1DItem, AnimationBlend1D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_parametricJs) {
      BindableNumber = _parametricJs.BindableNumber;
      bindOr = _parametricJs.bindOr;
      VariableType = _parametricJs.VariableType;
    }, function (_animationBlendJs) {
      AnimationBlend = _animationBlendJs.AnimationBlend;
      AnimationBlendEval = _animationBlendJs.AnimationBlendEval;
      AnimationBlendItem = _animationBlendJs.AnimationBlendItem;
    }, function (_blend1dJs) {
      blend1D = _blend1dJs.blend1D;
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
      AnimationBlend1DItem = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationBlend1DItem`), _dec(_class = (_class2 = class AnimationBlend1DItem extends AnimationBlendItem {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "threshold", _descriptor, this);
        }
        clone() {
          const that = new AnimationBlend1DItem();
          this._copyTo(that);
          return that;
        }
        _copyTo(that) {
          super._copyTo(that);
          that.threshold = this.threshold;
          return that;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "threshold", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _class2)) || _class);
      _export("AnimationBlend1D", AnimationBlend1D = (_dec2 = ccclass('cc.animation.AnimationBlend1D'), _dec2(_class3 = (_class4 = (_AnimationBlend1D = class AnimationBlend1D extends AnimationBlend {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_items", _descriptor2, this);
          _initializerDefineProperty(this, "param", _descriptor3, this);
        }
        get items() {
          return this._items;
        }
        set items(value) {
          this._items = Array.from(value).sort(({
            threshold: lhs
          }, {
            threshold: rhs
          }) => lhs - rhs);
        }
        clone() {
          const that = new AnimationBlend1D();
          this.copyTo(that);
          that._items = this._items.map(item => item.clone());
          that.param = this.param.clone();
          return that;
        }
        [createEval](context, ignoreEmbeddedPlayers) {
          const evaluation = new AnimationBlend1DEval(context, ignoreEmbeddedPlayers, this, this._items, this._items.map(({
            threshold
          }) => threshold), 0.0);
          const initialValue = bindOr(context, this.param, VariableType.FLOAT, evaluation.setInput, evaluation, 0);
          evaluation.setInput(initialValue, 0);
          return evaluation;
        }
      }, _AnimationBlend1D.Item = AnimationBlend1DItem, _AnimationBlend1D), _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "_items", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "param", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new BindableNumber();
        }
      }), _class4)) || _class3));
      AnimationBlend1DEval = class AnimationBlend1DEval extends AnimationBlendEval {
        constructor(context, ignoreEmbeddedPlayers, base, items, thresholds, input) {
          super(context, ignoreEmbeddedPlayers, base, items, [input]);
          this._thresholds = thresholds;
          this.doEval();
        }
        eval(weights, [value]) {
          blend1D(weights, this._thresholds, value);
        }
      };
    }
  };
});