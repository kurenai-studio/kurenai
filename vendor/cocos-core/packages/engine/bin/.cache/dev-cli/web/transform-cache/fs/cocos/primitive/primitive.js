System.register("q-bundled:///fs/cocos/primitive/primitive.js", ["../core/data/decorators/index.js", "../3d/misc/index.js", "../3d/assets/mesh.js", "./index.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, type, serializable, editable, createMesh, Mesh, primitives, Enum, cclegacy, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _Primitive, PrimitiveType, Primitive;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_dMiscIndexJs) {
      createMesh = _dMiscIndexJs.createMesh;
    }, function (_dAssetsMeshJs) {
      Mesh = _dAssetsMeshJs.Mesh;
    }, function (_indexJs) {
      primitives = _indexJs;
    }, function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
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
      PrimitiveType = /*#__PURE__*/function (PrimitiveType) {
        PrimitiveType[PrimitiveType["BOX"] = 0] = "BOX";
        PrimitiveType[PrimitiveType["SPHERE"] = 1] = "SPHERE";
        PrimitiveType[PrimitiveType["CYLINDER"] = 2] = "CYLINDER";
        PrimitiveType[PrimitiveType["CONE"] = 3] = "CONE";
        PrimitiveType[PrimitiveType["CAPSULE"] = 4] = "CAPSULE";
        PrimitiveType[PrimitiveType["TORUS"] = 5] = "TORUS";
        PrimitiveType[PrimitiveType["PLANE"] = 6] = "PLANE";
        PrimitiveType[PrimitiveType["QUAD"] = 7] = "QUAD";
        return PrimitiveType;
      }(PrimitiveType || {});
      Enum(PrimitiveType); // Need reversed keys in Primitive.onLoaded, so use Enum to generate reversed keys.

      /**
       * @en
       * Basic primitive mesh, this can be generate some primitive mesh at runtime.
       * @zh
       * 基础图形网格，可以在运行时构建一些基础的网格。
       */
      _export("Primitive", Primitive = (_dec = ccclass('cc.Primitive'), _dec2 = type(PrimitiveType), _dec(_class = (_class2 = (_Primitive = class Primitive extends Mesh {
        constructor(type = PrimitiveType.BOX) {
          super();
          /**
           * @en
           * The type of the primitive mesh, set it before you call onLoaded.
           * @zh
           * 此基础图形网格的类型，请在 onLoaded 调用之前设置。
           */
          _initializerDefineProperty(this, "type", _descriptor, this);
          /**
           * @en
           * The option for build the primitive mesh, set it before you call onLoaded.
           * @zh
           * 创建此基础图形网格的可选参数，请在 onLoaded 调用之前设置。
           */
          _initializerDefineProperty(this, "info", _descriptor2, this);
          this.type = type;
        }

        /**
         * @en
         * Construct the primitive mesh with `type` and `info`.
         * @zh
         * 根据`type`和`info`构建相应的网格。
         */
        onLoaded() {
          const factory = primitives[PrimitiveType[this.type].toLowerCase()];
          createMesh(factory(this.info), this);
        }
      }, _Primitive.PrimitiveType = PrimitiveType, _Primitive), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PrimitiveType.BOX;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "info", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return {};
        }
      }), _class2)) || _class));
      cclegacy.Primitive = Primitive;
    }
  };
});