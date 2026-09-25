System.register("q-bundled:///fs/cocos/animation/marionette/motion/animation-blend-direct.js", ["../../../core/index.js", "../create-eval.js", "./animation-blend.js", "../../define.js", "../parametric.js"], function (_export, _context) {
  "use strict";

  var _decorator, createEval, AnimationBlend, AnimationBlendEval, AnimationBlendItem, CLASS_NAME_PREFIX_ANIM, BindableNumber, bindOr, VariableType, AnimationBlendDirectEval, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, _AnimationBlendDirect, ccclass, serializable, AnimationBlendDirectItem, AnimationBlendDirect;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_createEvalJs) {
      createEval = _createEvalJs.createEval;
    }, function (_animationBlendJs) {
      AnimationBlend = _animationBlendJs.AnimationBlend;
      AnimationBlendEval = _animationBlendJs.AnimationBlendEval;
      AnimationBlendItem = _animationBlendJs.AnimationBlendItem;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_parametricJs) {
      BindableNumber = _parametricJs.BindableNumber;
      bindOr = _parametricJs.bindOr;
      VariableType = _parametricJs.VariableType;
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
      AnimationBlendDirectItem = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationBlendDirectItem`), _dec(_class = (_class2 = class AnimationBlendDirectItem extends AnimationBlendItem {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "weight", _descriptor, this);
        }
        clone() {
          const that = new AnimationBlendDirectItem();
          this._copyTo(that);
          return that;
        }
        _copyTo(that) {
          super._copyTo(that);
          that.weight = this.weight;
          return that;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "weight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new BindableNumber(0.0);
        }
      }), _class2)) || _class);
      _export("AnimationBlendDirect", AnimationBlendDirect = (_dec2 = ccclass('cc.animation.AnimationBlendDirect'), _dec2(_class3 = (_class4 = (_AnimationBlendDirect = class AnimationBlendDirect extends AnimationBlend {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_items", _descriptor2, this);
        }
        get items() {
          return this._items;
        }
        set items(value) {
          this._items = Array.from(value);
        }
        clone() {
          const that = new AnimationBlendDirect();
          this.copyTo(that);
          that._items = this._items.map(item => {
            var _item$clone;
            return (_item$clone = item == null ? void 0 : item.clone()) != null ? _item$clone : null;
          });
          return that;
        }
        [createEval](context, ignoreEmbeddedPlayers) {
          const myEval = new AnimationBlendDirectEval(context, ignoreEmbeddedPlayers, this, this._items, new Array(this._items.length).fill(0.0));
          for (let iItem = 0; iItem < this._items.length; ++iItem) {
            const item = this._items[iItem];
            const initialValue = bindOr(context, item.weight, VariableType.FLOAT, myEval.setInput, myEval, iItem);
            myEval.setInput(initialValue, iItem);
          }
          return myEval;
        }
      }, _AnimationBlendDirect.Item = AnimationBlendDirectItem, _AnimationBlendDirect), _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "_items", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class4)) || _class3));
      AnimationBlendDirectEval = class AnimationBlendDirectEval extends AnimationBlendEval {
        constructor(...args) {
          super(...args);
          this.doEval();
        }
        eval(weights, inputs) {
          const nChildren = weights.length;
          for (let iChild = 0; iChild < nChildren; ++iChild) {
            weights[iChild] = inputs[iChild];
          }
        }
      };
    }
  };
});