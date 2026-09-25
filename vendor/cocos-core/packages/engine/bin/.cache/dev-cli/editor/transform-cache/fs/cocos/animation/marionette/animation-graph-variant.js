System.register("q-bundled:///fs/cocos/animation/marionette/animation-graph-variant.js", ["../../core/data/decorators/index.js", "../../core/utils/array.js", "../define.js", "./animation-graph.js", "./animation-graph-like.js"], function (_export, _context) {
  "use strict";

  var ccclass, editable, serializable, type, removeIf, CLASS_NAME_PREFIX_ANIM, AnimationGraph, AnimationGraphLike, _dec, _class, _class2, _descriptor, _descriptor2, _dec2, _dec3, _class3, _class4, _descriptor3, _descriptor4, _dec4, _class5, _class6, _descriptor5, ClipOverrideEntry, AnimationGraphVariant, ClipOverrideMap;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_coreUtilsArrayJs) {
      removeIf = _coreUtilsArrayJs.removeIf;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_animationGraphJs) {
      AnimationGraph = _animationGraphJs.AnimationGraph;
    }, function (_animationGraphLikeJs) {
      AnimationGraphLike = _animationGraphLikeJs.AnimationGraphLike;
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
      /**
       * @en
       * An opacity type which denotes what the animation graph variant seems like outside the engine.
       * @zh
       * 一个非透明的类型，它是动画图变体在引擎外部的表示。
       */
      ClipOverrideEntry = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}ClipOverrideEntry`), _dec(_class = (_class2 = class ClipOverrideEntry {
        constructor() {
          _initializerDefineProperty(this, "original", _descriptor, this);
          _initializerDefineProperty(this, "substitution", _descriptor2, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "original", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "substitution", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class);
      _export("AnimationGraphVariant", AnimationGraphVariant = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationGraphVariant`), _dec3 = type(AnimationGraph), _dec2(_class3 = (_class4 = class AnimationGraphVariant extends AnimationGraphLike {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_graph", _descriptor3, this);
          _initializerDefineProperty(this, "_clipOverrides", _descriptor4, this);
        }
        get original() {
          return this._graph;
        }
        set original(value) {
          this._graph = value;
        }
        get clipOverrides() {
          return this._clipOverrides;
        }
      }, _applyDecoratedDescriptor(_class4.prototype, "original", [_dec3, editable], Object.getOwnPropertyDescriptor(_class4.prototype, "original"), _class4.prototype), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_graph", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_clipOverrides", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new ClipOverrideMap();
        }
      }), _class4)) || _class3));
      ClipOverrideMap = (_dec4 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ClipOverrideMap`), _dec4(_class5 = (_class6 = class ClipOverrideMap {
        constructor() {
          _initializerDefineProperty(this, "_entries", _descriptor5, this);
        }
        get size() {
          return this._entries.length;
        }
        [Symbol.iterator]() {
          return this._entries[Symbol.iterator]();
        }
        has(original) {
          return !!this._entries.find(({
            original: o
          }) => o === original);
        }
        get(original) {
          const entry = this._entries.find(({
            original: o
          }) => o === original);
          return entry == null ? void 0 : entry.substitution;
        }
        set(original, substitution) {
          const entry = this._entries.find(({
            original: o
          }) => o === original);
          if (entry) {
            entry.substitution = substitution;
          } else {
            const newEntry = new ClipOverrideEntry();
            newEntry.original = original;
            newEntry.substitution = substitution;
            this._entries.push(newEntry);
          }
        }
        delete(original) {
          removeIf(this._entries, ({
            original: o
          }) => o === original);
        }
        clear() {
          this._entries.length = 0;
        }
      }, _descriptor5 = _applyDecoratedDescriptor(_class6.prototype, "_entries", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class6)) || _class5);
    }
  };
});