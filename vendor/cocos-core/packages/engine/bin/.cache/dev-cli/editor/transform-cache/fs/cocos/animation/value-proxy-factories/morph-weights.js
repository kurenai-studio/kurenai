System.register("q-bundled:///fs/cocos/animation/value-proxy-factories/morph-weights.js", ["../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, _dec, _class, _class2, _descriptor, _descriptor2, _dec2, _class3, _class4, _descriptor3, _dec3, _class5, MorphWeightValueProxy, MorphWeightsValueProxy, MorphWeightsAllValueProxy;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
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
       * @en
       * Value proxy factory for setting morph weights of specified sub-mesh on model component target.
       * @zh
       * 用于设置模型组件目标上指定子网格的指定形状的形变权重的曲线值代理工厂。
       */
      _export("MorphWeightValueProxy", MorphWeightValueProxy = (_dec = ccclass('cc.animation.MorphWeightValueProxy'), _dec(_class = (_class2 = class MorphWeightValueProxy {
        constructor() {
          /**
            * @en Sub mesh index.
            * @zh 子网格索引。
            */
          _initializerDefineProperty(this, "subMeshIndex", _descriptor, this);
          /**
            * @en Shape Index.
            * @zh 形状索引。
            */
          _initializerDefineProperty(this, "shapeIndex", _descriptor2, this);
        }
        forTarget(target) {
          return {
            set: value => {
              target.setWeight(value, this.subMeshIndex, this.shapeIndex);
            }
          };
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "subMeshIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "shapeIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class));
      /**
       * @en
       * Value proxy factory for setting morph weights of specified sub-mesh on model component target.
       * @zh
       * 用于设置模型组件目标上指定子网格形变权重的曲线值代理工厂。
       */
      _export("MorphWeightsValueProxy", MorphWeightsValueProxy = (_dec2 = ccclass('cc.animation.MorphWeightsValueProxy'), _dec2(_class3 = (_class4 = class MorphWeightsValueProxy {
        constructor() {
          /**
           * @en Sub-mesh index.
           * @zh 子网格索引。
           */
          _initializerDefineProperty(this, "subMeshIndex", _descriptor3, this);
        }
        forTarget(target) {
          return {
            set: value => {
              target.setWeights(value, this.subMeshIndex);
            }
          };
        }
      }, _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "subMeshIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class4)) || _class3));
      /**
       * @en
       * Value proxy factory for setting morph weights of each sub-mesh on model component target.
       * @zh
       * 用于设置模型组件目标上所有子网格形变权重的曲线值代理工厂。
       */
      _export("MorphWeightsAllValueProxy", MorphWeightsAllValueProxy = (_dec3 = ccclass('cc.animation.MorphWeightsAllValueProxy'), _dec3(_class5 = class MorphWeightsAllValueProxy {
        forTarget(target) {
          return {
            set: value => {
              var _target$mesh$struct$p, _target$mesh;
              const nSubMeshes = (_target$mesh$struct$p = (_target$mesh = target.mesh) == null ? void 0 : _target$mesh.struct.primitives.length) != null ? _target$mesh$struct$p : 0;
              for (let iSubMesh = 0; iSubMesh < nSubMeshes; ++iSubMesh) {
                target.setWeights(value, iSubMesh);
              }
            }
          };
        }
      }) || _class5));
    }
  };
});